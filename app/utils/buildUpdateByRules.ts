type UpdateRule = 'nullable' | 'direct' | 'object';

export const buildUpdateByRules = <
  T extends Record<string, any>
>(
  input: T,
  rules: Partial<Record<keyof T, UpdateRule>>
): Partial<T> => {
  const result: Partial<T> = {};

  (Object.keys(rules) as (keyof T)[]).forEach((key) => {
    const rule = rules[key];
    if (!rule) return;

    const value = input[key];
    if (value === undefined) return;

    switch (rule) {
      case 'nullable':
        result[key] = value ?? (undefined as T[keyof T]);
        break;
      case 'direct':
        result[key] = value;
        break;
      case 'object':
        result[key] = value ?? ({} as T[keyof T]);
        break;
    }
  });

  return result;
}
