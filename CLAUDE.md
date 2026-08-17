# CLAUDE.md

Project-specific conventions for working in this repo.

## antd CSS Modules must use `:global(.ant-xxx)` on component roots

**Rule:** when a CSS Module class is applied via `className` directly onto
the root element of a raw antd component (`<Card className={styles.card}>`,
`<Sider className={styles.sider}>`, a destructured `<Header>`/`<Footer>`
from `Layout`, etc.), the selector in the CSS Module **must** be a compound
selector combining our class with antd's own class for that component:

```scss
// Wrong — silently loses to antd's own rule depending on stylesheet order.
.card {
  border-radius: 12px;
}

// Right — always wins regardless of stylesheet order.
.card:global(.ant-card) {
  border-radius: 12px;
}
```

**Why this matters:** `app/layout.tsx` wraps the app in `<AntdRegistry>`
(`@ant-design/nextjs-registry`) so antd's CSS-in-JS output gets extracted
into the SSR HTML instead of injected client-side only — this fixed a
flash-of-unstyled-content bug on hard reload. The tradeoff: antd's
`<style id="antd-cssinjs">` tag can land in the DOM *after* our own CSS
Module `<link>`/`<style>` tags. Our module class and antd's base class
(e.g. `.ant-layout-sider`) have equal specificity (0,1,0), so whichever
stylesheet is later in the DOM wins the tie — and that's now antd, not us.

This has caused real, hard-to-diagnose bugs: `Sidebar.module.scss`'s
`.sider { position: fixed }` lost to antd's `.ant-layout-sider { position:
relative }` (sidebar silently stopped being fixed-positioned, breaking the
whole layout's horizontal spacing); `Header.module.scss`'s `.header {
padding }` lost to antd's famous `.ant-layout-header { padding: 0 50px }`
default (padding edits appeared to do nothing). Both were found only by
measuring `getComputedStyle` in a real browser — the source code looked
correct.

A compound selector (two classes, specificity 0,2,0) always beats antd's
single-class rule, regardless of DOM order — no need to fight the cascade
order at all.

**Descendant selectors are unaffected.** `.wrapper :global(.ant-btn)` (styling
an antd element *nested inside* our own wrapper) is already higher
specificity than antd's bare rule and needs no change — this only applies
to styling an antd component's own root element.

**Automated check:** `npm run check:antd-css` (part of `npm run lint`)
scans `.tsx` files for `<AntdComponent className={styles.x}>` usages and
flags any where the CSS Module class isn't compounded with `:global(.ant-`.
See `scripts/check-antd-css-overrides.mjs` for the known component list and
detection logic. If it flags a false positive, extend the script rather
than silencing it.

## Page-level padding: one source of truth

Every page rendered inside `CRMLayout` already gets consistent padding from
`components/layout/Layout.module.scss`'s `.content` class. Pages must **not**
add their own competing padding (a `.p-page`-style utility class, an inline
`style={{ padding: N }}`, or a page's own `page.module.scss` root container
padding) — that produces inconsistent spacing across pages and silently
double-pads whichever page has both. If a page's content needs to look
different from the rest, adjust `Layout.module.scss`, not the individual
page.
