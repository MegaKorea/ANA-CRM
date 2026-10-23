'use client';

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { Button, Checkbox, Popover, Space, Tooltip } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

const HIDDEN_COLUMNS_STORAGE_KEY = 'lead:hidden-columns';
// Without a name the row can't be identified, so it can never be hidden.
const ALWAYS_VISIBLE_KEYS = new Set(['full_name']);

const hiddenColumnsListeners = new Set<() => void>();

function subscribeHiddenColumns(callback: () => void) {
  hiddenColumnsListeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === HIDDEN_COLUMNS_STORAGE_KEY) {
      hiddenColumnsListeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    hiddenColumnsListeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

// Returns the raw string so the snapshot stays referentially stable between renders.
function getHiddenColumnsSnapshot(): string | null {
  try {
    return localStorage.getItem(HIDDEN_COLUMNS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getHiddenColumnsServerSnapshot(): string | null {
  return null;
}

function parseHiddenColumns(raw: string | null): Set<string> {
  if (!raw) return new Set();
  try {
    const parsed: unknown = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((k) => typeof k === 'string') : []);
  } catch {
    return new Set();
  }
}

function setStoredHiddenColumns(keys: Set<string>): void {
  try {
    localStorage.setItem(HIDDEN_COLUMNS_STORAGE_KEY, JSON.stringify([...keys]));
  } catch {
    // Storage unavailable (private mode, quota): the choice just won't persist.
  }
  hiddenColumnsListeners.forEach((l) => l());
}

/** Column keys the user chose to hide in the lead table, persisted in localStorage. */
export function useLeadHiddenColumns() {
  const raw = useSyncExternalStore(
    subscribeHiddenColumns,
    getHiddenColumnsSnapshot,
    getHiddenColumnsServerSnapshot,
  );
  const hiddenKeys = useMemo(() => parseHiddenColumns(raw), [raw]);
  return { hiddenKeys, setHiddenKeys: setStoredHiddenColumns };
}

export interface LeadColumnOption {
  key: string;
  title: ReactNode;
}

interface LeadColumnSettingsProps {
  columns: LeadColumnOption[];
  hiddenKeys: Set<string>;
  onChange: (hiddenKeys: Set<string>) => void;
}

export function LeadColumnSettings({ columns, hiddenKeys, onChange }: LeadColumnSettingsProps) {
  const toggle = useCallback(
    (key: string, visible: boolean) => {
      const next = new Set(hiddenKeys);
      if (visible) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onChange(next);
    },
    [hiddenKeys, onChange],
  );

  const content = (
    <div style={{ minWidth: 200 }}>
      <Space orientation="vertical" size={4} style={{ display: 'flex' }}>
        {columns.map((col) => (
          <Checkbox
            key={col.key}
            checked={!hiddenKeys.has(col.key)}
            disabled={ALWAYS_VISIBLE_KEYS.has(col.key)}
            onChange={(e) => toggle(col.key, e.target.checked)}
          >
            {col.title}
          </Checkbox>
        ))}
      </Space>
      <Button
        type="link"
        size="small"
        style={{ paddingInline: 0, marginTop: 8 }}
        disabled={hiddenKeys.size === 0}
        onClick={() => onChange(new Set())}
      >
        Hiện tất cả
      </Button>
    </div>
  );

  return (
    <Popover content={content} title="Cột hiển thị" trigger="click" placement="bottomRight">
      <Tooltip title="Tùy chỉnh cột hiển thị">
        <Button icon={<SettingOutlined />} aria-label="Tùy chỉnh cột hiển thị" />
      </Tooltip>
    </Popover>
  );
}
