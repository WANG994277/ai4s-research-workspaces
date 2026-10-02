# Research Activities and Scientific Computing Merge Design

## Goal

Make Research Activities the single research-capability entry for agents, skills, models, datasets, research tools, and scientific computing. Remove the standalone Scientific Computing navigation item while preserving existing calculation workflows.

## Information architecture

- Research Activities owns six tabs: `智能体`, `技能`, `模型`, `数据集`, `科研工具`, and `科学计算`.
- Capability tabs use the uploaded reference's compact table layout.
- The Scientific Computing tab embeds the existing computing task workflow.
- Existing `/computing` URLs redirect to the corresponding Research Activities scientific-computing location so bookmarks remain valid.

## Research Activities list

- Keep the page title and the short sentence `在当前科研空间内进行能力构建与科学计算。`.
- Keep tab navigation, name search, status filtering, a context-sensitive create button, table, count, and pagination.
- Remove the help card, long explanatory copy, updated-time/source filters, view switcher, AI-middle-platform button, hint banner, associated-capability column, and operation column.
- The Agent tab also removes the creation-method column.

## Compatibility

- Computing task data and dialogs continue to use the existing domain and local-storage implementation.
- Computing task details remain reachable under Research Activities routes.
- Navigation selection treats computing detail routes as Research Activities.

## Verification

- Navigation tests prove the standalone menu is removed.
- Source tests protect the six tabs and deleted Agent columns/actions.
- Existing scientific-computing domain tests continue to pass.
- Browser verification covers the Agent tab and Scientific Computing tab.
