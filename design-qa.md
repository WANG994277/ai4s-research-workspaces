# Research Models Design QA

- Source visual truth: `http://localhost:3000/skills` (current research-skills marketplace, captured in the Codex in-app browser).
- Implementation: `http://localhost:3000/models` (captured in the same in-app browser session).
- Implementation screenshot path: in-app browser capture emitted inline; this browser surface does not expose a persistent filesystem path.
- Viewport: 754 x 1100 CSS px, device scale inherited from the in-app browser.
- Source pixels: 754 x 1100 visible capture.
- Implementation pixels: 754 x 1100 visible capture.
- Density normalization: same browser, viewport, theme, profile, and capture method; no resampling applied.
- State: default marketplace view, no query or filters, grid view selected; additional card-region captures taken after one-page scroll.

## Full-view comparison evidence

The models page now follows the same page hierarchy as the skills source: two-line hero copy with paired import/create actions, bordered search surface, horizontal pill filters, underlined catalog tabs, right-aligned count/sort/view controls, featured recommendations, and reusable catalog cards. The additional third filter row is intentional because model selection requires both model type and application task.

## Focused region comparison evidence

Focused card-region captures show the same icon scale, card radius, border, action alignment, metadata rhythm, and vertical density. Model cards intentionally replace skill update metadata with provider, version, and validation state, and replace the primary action label with `在线体验`.

## Required fidelity surfaces

- Fonts and typography: shared application font stack, title scale, label weight, body line height, and truncation behavior match the skills page.
- Spacing and layout rhythm: hero, search, filters, tabs, toolbar, featured block, and cards reuse the established marketplace classes. The model-specific third filter row is the only material vertical expansion.
- Colors and visual tokens: blue primary, pale-blue surfaces, neutral borders, green availability/validation status, and focus states use the existing catalog tokens.
- Image quality and asset fidelity: no new raster imagery was required; existing product iconography and marketplace visual treatment are reused. The hero decoration is the existing shared marketplace treatment.
- Copy and content: model-specific labels cover discipline, model type, application task, version, provider, validation, details, and online trial.

## Interaction checks

- Machine-learning-model filter: 10 items to 6 items.
- Image-analysis task combined with machine-learning filter: 1 item.
- List view and grid view: both selectable; grid restored as default.
- Detail and online-trial controls retain existing catalog behavior.
- Browser console: no errors observed during the model-page inspection.

## Comparison history

### Pass 1

- Earlier P0/P1/P2 findings: none after implementation capture.
- Intentional differences: third filter row and model-specific validation metadata.
- Post-fix evidence: default and card-region captures show consistent structure with the skills marketplace.

## Follow-up polish

- P3: a future iteration could add genuine benchmark metrics when a source of validated model-evaluation data is available.

final result: passed
