# Research Activity Final Information Architecture Design

## Tabs

Research Activities owns eight peer tabs: Agent, Skill, Model Development, Model Training, Model Inference, Dataset, Research Tool, and Scientific Computing.

Model Training and Model Inference move out of the former Scientific Computing internal navigation. Scientific Computing contains compute tasks only.

## Shared list shell

All eight tabs share the Research Activities visual shell: horizontal tabs, white bordered panel, left search, status filter, right create button, consistent table header/rows, count, and pagination. Training, inference, and computing retain task-specific columns and actions inside that shell.

## Creation experiences

- Agent uses a dedicated full-page builder matching the legacy split configuration/debug-preview workspace.
- Skill uses the complete legacy modal: name, discipline, application scenes, form helper, description, trigger, task steps, full research-tool checklist, visibility, cancel, and create.
- Model Development uses the complete legacy modal: name, discipline/directions, multi-select model types and task types, architecture, base model, source, description, cancel, and create.

## Compatibility

Existing computing task details and storage remain usable. Old computing list URLs redirect to the Scientific Computing tab; existing task detail links continue under Research Activities.
