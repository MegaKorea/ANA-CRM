'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Input } from 'antd';
import type { InputProps } from 'antd';

type DebouncedInputProps = Omit<InputProps, 'onChange'> & {
  onChange?: (value: string) => void;
  delay?: number;
};

export function DebouncedInput({ onChange, delay = 300, ...rest }: DebouncedInputProps) {
  const timerRef = useRef<number | null>(null);

  const debouncedOnChange = useCallback(
    (nextValue: string) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        onChange?.(nextValue);
      }, delay);
    },
    [delay, onChange]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <Input
      {...rest}
      onChange={(e) => {
        const nextValue = e.target.value;
        debouncedOnChange(nextValue);
      }}
    />
  );
}

