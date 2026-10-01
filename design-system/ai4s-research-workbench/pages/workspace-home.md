# Workspace Home Page Overrides

> **PROJECT:** AI4S Research Workbench
> **Updated:** 2026-10-01
> **Page Type:** Dashboard / Data View

> ⚠️ **IMPORTANT:** Rules in this file **override** the Master file (`design-system/MASTER.md`).
> Only deviations from the Master are documented here. For all other rules, refer to the Master.

---

## Page-Specific Rules

### Task examples

- Display “读 / 算 / 做” as three equally weighted rows; show every category and its recommended questions at the same time.
- Category labels are static labels, not tabs or selected controls. No category has a default selected state.
- Recommendation questions remain buttons and fill the main research composer when selected.

### Research output trend

- The output summary shows “近一年科研产出趋势”.
- Use one bar per month for the latest 12 months, with every month labelled on the horizontal axis.
- Keep the existing card, chart colors, tooltip, and compact desktop density.

### Validation

- Desktop only: verify 1280, 1440, and 1920 widths without horizontal overflow.
- Preserve visible keyboard focus for every recommendation button.
