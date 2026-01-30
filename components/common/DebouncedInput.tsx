'use client';

import { useEffect, useMemo } from 'react';
import { Input } from 'antd';
import type { InputProps } from 'antd';
import debounce from 'lodash/debounce';

type DebouncedInputProps = Omit<InputProps, 'onChange'> & {
  onChange?: (value: string) => void;
  delay?: number;
};

export function DebouncedInput({ onChange, delay = 300, ...rest }: DebouncedInputProps) {
  const debouncedOnChange = useMemo(
    () =>
      debounce((nextValue: string) => {
        onChange?.(nextValue);
      }, delay),
    [onChange, delay]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

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

