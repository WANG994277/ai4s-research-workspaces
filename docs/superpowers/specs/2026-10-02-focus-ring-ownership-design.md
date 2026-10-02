# Focus Ring Ownership Design

## Problem

Global CSS applies a blue `outline` to every focused button, link, input, select, and textarea. Composite fields already draw focus on their wrapper with `:focus-within`, while shared form controls provide their own border/ring state. The global input outline therefore creates a second, inner blue rectangle.

## Decision

- Keep the global focus fallback for `button` and `a` elements.
- Remove `input`, `select`, and `textarea` from that fallback.
- Continue to let standalone and composite form controls own their focus presentation locally.
- Preserve keyboard-visible focus feedback; do not introduce a blanket `outline: none` rule.

## Verification

- A source-level regression test will assert that the global fallback targets only buttons and links.
- Type checking and linting must remain clean.
- Browser verification will confirm that the research-output search field has one wrapper focus treatment and no inner input outline.
