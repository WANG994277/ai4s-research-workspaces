# Research Datasets Page Overrides

> **PROJECT:** AI4S Research Data
> **Generated:** 2026-09-29 11:35:08
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Product Boundary

- Show published `Research Asset` objects whose type is `数据集`; do not create a second dataset object.
- Discovery and use live here. Ownership, sharing, publishing, archiving, and destructive actions remain in `科研资产`.
- Data cleaning and version production remain in the compute/data-processing workflow.

### Layout Overrides

- **Max Width:** 1400px or full-width
- **Grid:** 12-column grid for data flexibility
- **Sections:** 1. Compact discovery hero, 2. Search, 3. Discipline and modality filters, 4. Scope tabs + sort/view controls, 5. Featured datasets, 6. Result grid/list, 7. Pagination.
- **Detail:** Back path, dataset identity and access actions, content tabs, two-column overview with a narrower metadata sidebar.

### Spacing Overrides

- **Content Density:** High — optimize for information display

### Typography Overrides

- Use the AI4S V1 system CJK font stack. Page title 30–32px, section title 16–18px, body 13–14px, metadata 11–12px.

### Color Overrides

- Use the AI4S semantic palette from the Master project override. Dataset cards stay white with blue-gray borders; green/amber/red only communicate explicit availability states with adjacent text.

### Component Overrides

- Dataset cards surface name, description, discipline, modality, format, scale, provider, version, update date, access and validation state.
- Primary card action is `查看详情`; direct use is secondary and must be disabled with a reason when permission is missing.
- Preview tables use sticky headers only inside their own card, readable field labels, tabular figures, and an explicit demo/sample notice.
- Empty states explain whether filters or permissions caused the result and provide a safe recovery action.
- Avoid metric-card decoration, autoplay media, hover-only information, and dense rows of more than three card actions.

---

## Page-Specific Components

- No unique components for this page

---

## Recommendations

- Effects: subtle border/elevation change on hover, 160–200ms transition, no layout-shifting scale.
- Accessibility: buttons at least 36px high in dense desktop toolbars, icon-only controls have labels, all selected states expose `aria-pressed` or `aria-current`.
- State coverage: loading skeleton, no match, permission restricted, preview unavailable, source unavailable, archived version.
- CTA placement: `接入数据集` and one primary `新建数据集` in the hero; task/use actions in the detail header.
