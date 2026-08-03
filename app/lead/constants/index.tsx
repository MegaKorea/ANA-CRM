/**
 * Barrel re-export so existing `@/app/lead/constants` imports keep working.
 * The actual content lives in:
 *  - `labels.tsx`       — status labels only (used by the public `/lead-form`)
 *  - `lead-helpers.tsx` — pure constants/data helpers shared across lead components
 *  - `columns.tsx`      — the antd Table column factory (pulls in row-action components)
 */
export * from './labels';
export * from './lead-helpers';
export * from './columns';
