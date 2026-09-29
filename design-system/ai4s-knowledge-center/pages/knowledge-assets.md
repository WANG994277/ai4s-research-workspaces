# Knowledge Assets Page Override

## Information architecture

- Preserve the current global sidebar and top bar.
- Use two URL-backed local tabs: `知识库` and `知识图谱`.
- Knowledge library contains a searchable/filterable overview and a library detail state with a predictable back path.
- Knowledge graph retains the existing hero, filters, graph canvas and entity detail.

## Visual system

- Desktop-first, blue-white enterprise research UI.
- Tabs use the same underline language as Knowledge Discovery.
- Library cards use 3-column desktop grid, 10px radius, cool-blue border, compact metadata and one clear primary action.
- Library detail uses a summary header, metric cards and a dense resource list; no empty decorative canvas.

## Interaction rules

- Tab, selected library and selected resource must be recoverable from the URL.
- Remove graph settings, graph export and graph fullscreen controls; keep graph entity search and canvas zoom.
- Graph tab opens a catalog before detail: dense list by default, optional card view, search, discipline/source/creator/update filters and pagination.
- Use blue AI4S primary buttons for `新建知识图谱` and `查看`; do not carry the red accent from the external reference.
- Do not invent unavailable backend actions. Mock counts and descriptive content are labeled as prototype data through context, while readable resource entries use the existing permission-filtered knowledge objects.
