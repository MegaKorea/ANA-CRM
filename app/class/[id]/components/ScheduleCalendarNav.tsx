'use client';

import { Button, Select } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo } from 'react';
import styles from './tab-schedule.module.scss';

type HeaderRender = NonNullable<CalendarProps<Dayjs>['headerRender']>;

type Props = {
  value: Dayjs;
  isMobile: boolean;
  onChange: (next: Dayjs) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

export function ScheduleCalendarNav({
  value,
  isMobile,
  onChange,
  onPrevMonth,
  onNextMonth,
}: Props) {
  const year = value.year();
  const month = value.month();
  const selectSize = isMobile ? 'small' : 'middle';

  const yearOptions = useMemo(
    () => Array.from({ length: 21 }, (_, i) => {
      const y = year - 10 + i;
      return { value: y, label: String(y) };
    }),
    [year],
  );

  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: dayjs().month(i).format(isMobile ? 'MMM' : 'MMMM'),
    })),
    [isMobile],
  );

  return (
    <div className={styles.calNav}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={onPrevMonth}
        aria-label="Tháng trước"
        className={styles.calNavBtn}
      />
      <div className={styles.calNavFilters}>
        <Select
          size={selectSize}
          value={month}
          options={monthOptions}
          popupMatchSelectWidth={false}
          className={styles.calNavSelect}
          onChange={(newMonth) => onChange(value.month(newMonth))}
        />
        <Select
          size={selectSize}
          value={year}
          options={yearOptions}
          popupMatchSelectWidth={false}
          className={styles.calNavSelectYear}
          onChange={(newYear) => onChange(value.year(newYear))}
        />
      </div>
      <Button
        type="text"
        icon={<RightOutlined />}
        onClick={onNextMonth}
        aria-label="Tháng sau"
        className={styles.calNavBtn}
      />
    </div>
  );
}

export function createCalendarHeaderRender(props: Omit<Props, 'value'>): HeaderRender {
  function CalendarHeader({ value, onChange }: Parameters<HeaderRender>[0]) {
    return (
      <ScheduleCalendarNav
        value={value}
        isMobile={props.isMobile}
        onPrevMonth={props.onPrevMonth}
        onNextMonth={props.onNextMonth}
        onChange={(next) => {
          props.onChange(next);
          onChange(next);
        }}
      />
    );
  }
  return CalendarHeader;
}
