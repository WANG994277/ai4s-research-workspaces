# Knowledge Home Page Overrides

> **PROJECT:** AI4S Knowledge Center
> **PAGE:** Knowledge discovery home
> **SOURCE OF TRUTH:** User-provided reference image on 2026-09-28

The visual reference overrides generator suggestions whenever they conflict. The page remains inside the existing AI4S V1 shell and reuses the existing route, permissions, knowledge objects and Lucide icon family.

## Design Read

- Desktop enterprise scientific-research search portal for researchers.
- `DESIGN_VARIANCE: 3`, `MOTION_INTENSITY: 2`, `VISUAL_DENSITY: 7`.
- Faithful light-blue scientific language, not a marketing landing page.
- Scope is desktop Web only: 1280x900, 1440x900 and 1920x1080.

## Reference-Locked Layout

1. Existing global sidebar and topbar.
2. Page title `知识中心` followed by `知识发现 / 知识资产` tabs.
3. A wide pale-blue hero containing a centered title and subtitle, two search-mode controls, search input and seven knowledge-type entries.
4. A two-column row below the hero: `最近搜索` on the left and `推荐知识` on the right.
5. Preserve existing result, detail, advanced-search and graph flows after navigation or submission.

## Tokens

| Role | Value |
| --- | --- |
| Brand / active | `#0B6FFB` |
| Brand strong | `#0756C9` |
| Heading | `#0B2D63` |
| Body | `#526B91` |
| Border | `#CFE0F5` |
| Page background | `#F4F8FD` |
| Surface | `#FFFFFF` |
| Hero background | generated scientific banner asset + `#EAF4FF` fallback |

- Keep the existing PingFang SC / Microsoft YaHei stack. Reject the generated serif and remote Google-font recommendation because they conflict with the product shell and reference.
- Keep blue as the sole action accent. Limited red/purple/teal/green are category semantics only, as shown in the reference.
- Cards use 10-12px radii, 1px pale-blue borders and very light blue-tinted shadows.
- Pills use full radius only for mode and category controls; cards and input fields keep 8-12px radii.

## Interaction and Accessibility

- Search submission and existing knowledge routes retain behavior.
- Every icon-only control has an accessible label; visible controls have at least 36px height and obvious focus styles.
- Hover and pressed feedback use 150-200ms color/border/shadow transitions without layout movement.
- No automatic decorative animation. `prefers-reduced-motion` remains supported.
- Reference artwork is background-only; all text and controls remain real HTML.

## Explicit Rejections

- No orange CTA, serif heading, FAQ or contact-sales section from the generic generator output.
- No dark mode expansion, mobile layout work, new backend objects or new navigation hierarchy in this task.
- No text baked into images, emoji icons, hand-drawn SVG icons or fake precision metrics.
