# Research Activity Actions and Create Dialogs Design

## Scope

- Add `创建人` and `操作` columns to the Agent, Skill, Model, Dataset, and Research Tool tabs.
- Each row exposes `查看` and `添加使用`.
- `添加使用` keeps the user on the list and shows the bottom toast `已添加到科研超级中枢`.
- Remove `已就绪` from statuses, filter options, and seeded rows; existing dataset content uses `已发布`.

## Create dialogs

Use the forms in `public/AI4S科研平台原型设计.html` as the source of structure and terminology, adapted to native React dialogs:

- Agent: basic identity, discipline/model, goal/instructions, bound tools and skills, execution limits, and visibility.
- Skill: name, discipline, research direction, scenarios, skill form, description, usage trigger, task steps, dependent tools, and visibility.
- Model: name, discipline, model/task types, architecture, source/base model, description, and visibility.

The three forms open from their matching tabs, validate required fields, support cancel/close, and create a new local list row on submit. Dataset and Research Tool creation remain demo entries.

## Verification

- Source tests protect the two columns, two actions, exact toast, absent ready status, and three dialog forms.
- Browser checks cover Agent list actions and opening/submitting the three dialogs.
