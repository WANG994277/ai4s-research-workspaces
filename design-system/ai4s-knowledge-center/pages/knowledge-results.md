# Knowledge Results Page Overrides

> Source of truth: user-provided search-results reference on 2026-09-29.

## Design Read

- Desktop enterprise scientific search-results page for researchers.
- High information density with a stable blue-white product language.
- `DESIGN_VARIANCE: 3`, `MOTION_INTENSITY: 2`, `VISUAL_DENSITY: 8`.
- Preserve existing search, filters, favorites, context, collection, export and detail flows.

## Layout

1. Page heading identifies the active search mode and explains the result scope.
2. Full-width query field and submit action.
3. Type tabs with real result counts.
4. One-line filter toolbar.
5. Compact AI summary using one short paragraph and real visible-result facts.
6. Main grid: result list on the left, search overview and related-topic panels on the right.

## Tokens and Components

- Reuse the existing PingFang SC / Microsoft YaHei stack and AI4S blue tokens.
- Reject the generated orange CTA and remote serif-font suggestions because they conflict with the existing shell and reference.
- Results use 8-10px radii, pale-blue borders, minimal shadows and 8px spacing rhythm.
- Type, status and topic distinctions include icons and text, never color alone.
- Right-sidebar bars visualize actual in-memory counts only; no invented metrics.
- Empty and loading states keep the result-page structure stable.

## Interaction

- Query Enter and submit button share one native form action.
- Type tabs and topic chips update the URL and reset pagination.
- Filters, favorite, detail, export and Research Agent actions preserve current behavior.
- Focus states remain on the full search control; reduced-motion preferences are honored.

## Scope

- Desktop Web only for 1280x900, 1440x900 and 1920x1080.
- No new backend, recommendation model, external search provider or fabricated result count.
