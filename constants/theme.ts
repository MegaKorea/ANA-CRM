export const THEME = {
  fontSize: {
    base: 14,
  },
  // ART LANCE v2 radius scale (DESIGN_TOKEN.md §8) — antd only exposes 3 radius
  // slots, so xs/sm/md cover controls; lg/xl/pill are for bespoke component CSS.
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
  },
  shadow: {
    offset: 2,
  },
  opacity: {
    hover: 0.08,
  },
} as const;
