# ART LANCE — Design Tokens

**Version 2.0 · Product / SaaS Design Language**

> **v2.0 direction (2026-07):** ART LANCE is a **working product**, not a marketing site.
> The token system was rebuilt from a landing-page language (dark gradient heroes,
> purple→pink gradients everywhere, huge radii, heavy shadows) into a calm, modern
> **SaaS product** language: a neutral canvas, **one** restrained purple accent,
> hairline borders, crisp small radii, subtle functional shadows, and comfortable density.
>
> The old marketing tokens (gradients, dark hero) still exist but are **marketing-only** —
> they must never appear in the app UI (sidebar, topbar, tables, forms, cards).

---

## 1. Design Philosophy

| Principle | What it means in practice |
|---|---|
| **Neutral first** | The UI is built on a cool-grey neutral ramp. Colour is information, not decoration. |
| **One accent** | Purple `#6E34BB` is the *only* brand colour in the product. It marks the primary action, the active state, links, and focus — nothing else. |
| **Quiet surfaces** | White cards on a light-grey canvas, separated by 1px hairline borders and barely-there shadows. No glow, no lift. |
| **Semantic status** | Success / warning / error / info each have a solid, a soft background, and an accessible text tone — they power the status pills a dashboard lives on. |
| **Density with air** | 14px base text, compact 36px controls (44px tap on touch), tight radii. Dense enough to be productive, spaced enough to breathe. |

---

## 2. Color — Neutral Scale

The backbone of the product. A cool slate ramp for surfaces, borders, and text.

| Token | Hex | Usage |
|---|---|---|
| `--neutral-0`   | `#FFFFFF` | Card / panel surface |
| `--neutral-25`  | `#FCFCFD` | Subtle raised fill |
| `--neutral-50`  | `#F8F9FB` | **App canvas** (page background) |
| `--neutral-100` | `#F1F2F6` | Sunken areas, hover fills, table headers |
| `--neutral-200` | `#E6E8EF` | **Hairline borders**, dividers |
| `--neutral-300` | `#D5D8E2` | Strong borders, input borders |
| `--neutral-400` | `#A6ABBD` | Placeholder, disabled text |
| `--neutral-500` | `#71768A` | Tertiary text, muted icons |
| `--neutral-600` | `#545A6E` | Secondary text |
| `--neutral-700` | `#3B4051` | — |
| `--neutral-800` | `#262A37` | — |
| `--neutral-900` | `#14161F` | **Primary text** |

---

## 3. Color — Brand Accent

ART LANCE purple, kept as the single product accent, expanded into a usable tint ramp.

| Token | Hex | Usage |
|---|---|---|
| `--accent-50`  | `#F4EFFB` | Active nav background, icon tint, selected row |
| `--accent-100` | `#E9DDF7` | Hover on accent surfaces |
| `--accent-200` | `#D4BCEF` | Borders on accent surfaces |
| `--accent-300` | `#B792E2` | — |
| `--accent-400` | `#9564D3` | Accent on dark surfaces |
| `--accent-500` | `#7B43C4` | — |
| `--accent-600` | `#6E34BB` | **Primary action / brand** |
| `--accent-700` | `#5B2B9B` | Hover (buttons, active nav text) |
| `--accent-800` | `#47257A` | Active / pressed |

> **Swap-friendly:** the entire brand lives in these nine variables. Re-theming the product
> to a different accent is a nine-line change; nothing else references a raw purple hex.

---

## 4. Color — Semantic

Each status carries three tokens: a **solid** (icons/emphasis), a **soft background** (pills/banners), and an **accessible text** tone (readable on the soft background).

| Status | Solid | Background | Text |
|---|---|---|---|
| Success | `--success` `#16A34A` | `--success-bg` `#EAF7EF` | `--success-text` `#0F7A3D` |
| Warning | `--warning` `#D9880F` | `--warning-bg` `#FBF2E2` | `--warning-text` `#935B06` |
| Error   | `--error` `#E5484D`   | `--error-bg` `#FDECEC`   | `--error-text` `#C0353A` |
| Info    | `--info` `#3E7BFA`    | `--info-bg` `#EAF1FE`    | `--info-text` `#295FD0` |

---

## 5. Semantic Surface / Text / Border Aliases

Components reference these **role tokens**, never a raw scale value. Only these flip between light and dark themes — the brand accent stays constant.

```css
--bg-app:      var(--neutral-50);   /* page canvas        */
--bg-surface:  var(--neutral-0);    /* cards, panels      */
--bg-sunken:   var(--neutral-100);  /* insets, table head */
--bg-hover:    var(--neutral-100);  /* row / nav hover    */
--bg-selected: var(--accent-50);    /* active nav / row   */

--text-primary:   var(--neutral-900);
--text-secondary: var(--neutral-600);
--text-tertiary:  var(--neutral-500);
--text-disabled:  var(--neutral-400);
--text-on-accent: #FFFFFF;

--border:        var(--neutral-200);   /* hairline        */
--border-strong: var(--neutral-300);   /* inputs, controls*/
--border-focus:  var(--accent-600);
```

---

## 6. Typography

**Font:** `Lexend` (product typeface; loaded via Google Fonts `@import` in the shared CSS). System fallback: Segoe UI / -apple-system.

```css
--font-sans: "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
```

**Base size is `14px`** — the product density standard (dashboards, tables, forms). Marketing pages may bump the base to 16px.

| Token | Size | Weight | Usage |
|---|---|---|---|
| `--fs-display` | `clamp(30px, 4vw, 40px)` | 800 | **Marketing only** — hero headline |
| `--fs-h1` | 24px | 700 | In-app page title (topbar) |
| `--fs-h2` | 20px | 700 | Section heading |
| `--fs-h3` | 16px | 600 | Card title |
| `--fs-h4` | 14px | 600 | Component heading |
| `--fs-body` | 14px | 400–500 | Default body |
| `--fs-sm` | 13px | 400–500 | Secondary / meta |
| `--fs-xs` | 12px | 600 | Captions, labels, pills, overlines |

Line-heights: headings `1.25–1.4`, body `1.55`. Product UI leans on **500–600** weights, not 700–800.

> **Gradient text** stays available (`.text-gradient`) but is **marketing-only** — never for UI or long-form copy.

---

## 7. Spacing

4px base scale.

| Token | Value | | Token | Value |
|---|---|---|---|---|
| `--space-1` | 4px  | | `--space-6`  | 24px |
| `--space-2` | 8px  | | `--space-8`  | 32px |
| `--space-3` | 12px | | `--space-10` | 40px |
| `--space-4` | 16px | | `--space-12` | 48px |
| `--space-5` | 20px | | `--space-16` | 64px |

Typical: card padding `--space-5` (20px); grid/board gaps `--space-5`; content padding `--space-6` (24px).

---

## 8. Border Radius

Tighter than v1 — crisp product edges instead of pill-soft marketing shapes.

```css
--radius-xs: 4px;    /* tags, small controls   */
--radius-sm: 6px;    /* buttons, inputs        */
--radius-md: 8px;    /* dropdowns, menus       */
--radius-lg: 12px;   /* cards, panels          */
--radius-xl: 16px;   /* modals, large surfaces */
--radius-pill: 999px;/* pills, avatars         */
```

---

## 9. Shadows

Subtle, functional elevation — no coloured glows in the product.

```css
--shadow-xs: 0 1px 2px rgba(20, 22, 31, 0.06);
--shadow-sm: 0 1px 2px rgba(20, 22, 31, 0.06), 0 1px 3px rgba(20, 22, 31, 0.04);
--shadow-md: 0 4px 12px rgba(20, 22, 31, 0.08), 0 2px 4px rgba(20, 22, 31, 0.04);
--shadow-lg: 0 12px 28px rgba(20, 22, 31, 0.14);   /* dropdowns, popovers, modals */
--shadow-focus: 0 0 0 3px rgba(110, 52, 187, 0.18);/* keyboard focus ring */
```

**Elevation guide:** cards `--shadow-xs`; hover/raised `--shadow-sm`; sticky bars `--shadow-sm`; floating menus `--shadow-lg`.

---

## 10. Layout & App Shell

```css
--sidebar-w:           264px;
--sidebar-w-collapsed: 76px;
--topbar-h:            64px;
--container-max:       1440px;
```

Shell structure: a fixed **sidebar** (`--bg-surface` + right hairline) + a **sticky topbar** (blurred, hairline bottom) + a scrolling **content** area on the `--bg-app` canvas.

```
┌──────────┬─────────────────────────────────────┐
│ sidebar  │ topbar  (title · search · action · ⌗) │
│ (nav)    ├─────────────────────────────────────┤
│          │ content  (cards / tables / forms)   │
└──────────┴─────────────────────────────────────┘
```

Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`. Board columns collapse to 1 under 1024px; the sidebar hides under 860px.

---

## 11. Components

### Button
Compact 36px controls (`sm` 32px, `lg` 44px; ≥44px tap target on touch), 8px radius, 600 weight.

| Variant | Use | Style |
|---|---|---|
| `.btn-primary` | The **one** main action per view | Solid `--accent-600`, white text; hover `-700`, active `-800`. No gradient, no shadow. |
| `.btn-secondary` | Secondary actions | `--bg-surface`, `--border-strong`, primary text; hover raises the fill. |
| `.btn-ghost` | Low-emphasis / toolbar | Transparent, secondary text; hover fill. |
| `.btn-danger` | Destructive | Solid `--error`. |
| `.icon-btn` | Icon-only (topbar, rows) | 36px square, ghost; supports a `.dot` count badge. |

### Card
```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xs);
  padding: var(--space-5);
}
/* Only interactive cards react to hover — a subtle border/shadow, never a lift. */
.card--interactive:hover { border-color: var(--border-strong); box-shadow: var(--shadow-sm); }
```

### Status Pill / Tag
The dashboard essential — soft background + accessible text, always with an icon or label (never colour alone).

```css
.pill { height: 24px; padding: 0 10px; border-radius: var(--radius-pill);
        font-size: 12px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
.pill--success { background: var(--success-bg); color: var(--success-text); }
.pill--warning { background: var(--warning-bg); color: var(--warning-text); }
.pill--error   { background: var(--error-bg);   color: var(--error-text); }
.pill--info    { background: var(--info-bg);    color: var(--info-text); }
.pill--accent  { background: var(--accent-50);  color: var(--accent-700); }

/* Solid variant (ClickUp filled section-header look, e.g. DONE / IN PROGRESS).
   Fill is the accessible --*-text tone so white text still clears AA 4.5:1. */
.pill--solid-success { background: var(--success-text); color: #fff; }
.pill--solid-info    { background: var(--info-text);    color: #fff; }
.pill--solid-neutral { background: var(--neutral-600);  color: #fff; }
```

Soft pills are the default (per-row status); **solid** pills are for status
*group headers / lane titles*. Both always pair colour with an icon + label.

### Nav item
```css
.nav-item        { padding: 9px 12px; border-radius: var(--radius-sm); color: var(--text-secondary); font-weight: 500; }
.nav-item:hover  { background: var(--bg-hover); color: var(--text-primary); }
.nav-item.is-active { background: var(--bg-selected); color: var(--accent-700); font-weight: 600; }
```

### Input / Select
```css
.input { height: 36px; background: var(--bg-surface); border: 1px solid var(--border-strong);
         border-radius: var(--radius-sm); padding: 0 12px; font-size: 14px; color: var(--text-primary); }
.input:focus { outline: none; border-color: var(--border-focus); box-shadow: var(--shadow-focus); }
```

### Other
- **Badge** (numeric count): `--bg-sunken` / accent variant, 20px pill.
- **Avatar**: 32px pill, accent fill + initials, or image.
- **Icon box**: 36–48px, `--accent-50` tint + `--accent-600` line icon.
- **Table**: uppercase 12px header on `--bg-sunken`, 1px row hairlines, `--bg-hover` on row hover.
- **Line icons**: Lucide / Heroicons (outline), stroke `1.75`, muted `--text-tertiary` inside meta rows.

---

## 12. Usage Rules

### Do
- ✅ Build on the **neutral canvas**; reserve purple for the primary action, active state, links, focus.
- ✅ Use **semantic pills** for status — always icon/label + colour.
- ✅ Keep cards **flat**: hairline border + `--shadow-xs`, no hover lift.
- ✅ Reference **role tokens** (`--bg-surface`, `--text-secondary`, `--border`), not raw scale hexes.
- ✅ Keep controls compact and consistent (36px desktop / 44px touch), copy short.

### Don't
- ❌ No gradients, dark hero panels, or coloured glows in the product UI (marketing pages only) — **except** the dark app-switcher rail (`--rail*` tokens), the one scoped ClickUp-style dark surface.
- ❌ No more than one `--btn-primary` per view.
- ❌ No huge radii (18px+) or 40px+ blurred shadows on product surfaces.
- ❌ Don't convey status by colour alone.
- ❌ Don't hardcode a colour that already has a token.

---

## 13. Accessibility

- Body/large-text contrast meets **WCAG AA** (`--text-secondary` #545A6E and `--text-tertiary` #71768A both pass 4.5:1 on white; primary text is ~16:1).
- Every interactive element has a visible focus ring (`--shadow-focus`) via `:focus-visible`.
- Status is never colour-only — pills pair colour with an icon and a word.
- Minimum touch target **44×44px** on touch; respect `prefers-reduced-motion`.

---

## 14. Migration Notes (v1 → v2)

- v1 token names (`--color-primary`, `--color-bg`, `--color-surface`, `--color-text`, `--color-border`, `--radius-*`, `--shadow-*`, `--space-*`) are kept as **aliases** mapping to v2 values, so existing prototype pages keep working.
- **Reference implementation:** [`prototype/dashboard.html`](prototype/dashboard.html) — the product look built entirely on v2 tokens.
- **Follow-up:** refresh `prototype/design-tokens.html` and `prototype/index.html` to v2 (they still render via aliases but document v1 values).
