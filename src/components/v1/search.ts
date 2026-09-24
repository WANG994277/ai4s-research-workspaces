import type { Knowledge } from "./types";
export interface SearchCondition {
  field: string;
  operator: string;
  value: string;
  group?: number;
}
export function parseConditions(raw: string | null): SearchCondition[] {
  try {
    const data = JSON.parse(raw ?? "[]");
    return Array.isArray(data)
      ? data.filter(
          (x) =>
            typeof x.field === "string" &&
            typeof x.value === "string" &&
            typeof x.operator === "string",
        )
      : [];
  } catch {
    return [];
  }
}
export function advancedMatch(o: Knowledge, conditions: SearchCondition[]) {
  const fields: Record<string, string> = {
    标题: o.name,
    作者: o.authors,
    机构: o.organization,
    关键词: o.keywords.join(" "),
    摘要: o.description,
    DOI: o.metadata.DOI ?? "",
    专利号: [o.metadata.申请号, o.metadata.公开号].filter(Boolean).join(" "),
    标准号: o.metadata.标准号 ?? "",
  };
  const populated = conditions.filter((x) => x.value.trim());
  if (!populated.length) return true;
  // AND/NOT bind inside each group; OR joins the groups.
  const groups: SearchCondition[][] = [[]];
  for (const c of populated) {
    if (c.operator === "OR" && groups.at(-1)!.length) groups.push([]);
    groups.at(-1)!.push(c);
  }
  return groups.some((group) =>
    group.every((c) => {
      const hit = (fields[c.field] ?? "")
        .toLowerCase()
        .includes(c.value.toLowerCase());
      return c.operator === "NOT" ? !hit : hit;
    }),
  );
}
