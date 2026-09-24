"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Search,
  Star,
  Network,
  Plus,
  Download,
} from "lucide-react";
import { useResearch, addContext, notify } from "./store";
import { canRead, hasRole, uid } from "./domain";
import { disciplines } from "./seed";
import {
  Alert,
  Badge,
  Button,
  Details,
  Empty,
  Field,
  Modal,
  PageTitle,
  Pagination,
  SearchBox,
  Select,
  Table,
  Tabs,
  download,
} from "./ui";
import { ContextActions } from "./actions";
import { findGraphPath, graphNeighborhood } from "../knowledge/graph-utils";
import { advancedMatch, parseConditions } from "./search";
import type { GraphRelation } from "../knowledge/model";
const modes = ["智能检索", "关键词检索", "高级检索", "结构式检索"];
const types = ["全部", "文献", "专利", "标准", "内部资料", "数据集"];
function matchesBoolean(text: string, q: string) {
  if (!q.trim()) return true;
  return q.split(/\s+OR\s+/i).some((group) => {
    const terms = group.match(/"[^"]+"|\S+/g) ?? [];
    let negate = false;
    return terms.every((term) => {
      if (term.toUpperCase() === "AND") return true;
      if (term.toUpperCase() === "NOT") {
        negate = true;
        return true;
      }
      const hit = text
        .toLowerCase()
        .includes(term.replaceAll('"', "").toLowerCase());
      const result = negate ? !hit : hit;
      negate = false;
      return result;
    });
  });
}
export function KnowledgeCenter() {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const tab = query.get("tab") ?? "一站式检索";
  const mode = query.get("mode") ?? "智能检索";
  const q = query.get("q") ?? "";
  const type = query.get("type") ?? "全部";
  const id = query.get("id");
  const page = Number(query.get("page") ?? 1);
  const [input, setInput] = useState(q);
  const [selected, setSelected] = useState<string[]>([]);
  const [discipline, setDiscipline] = useState("全部");
  const [year, setYear] = useState("全部");
  const [sort, setSort] = useState("相关度");
  const [favorites, setFavorites] = useState(false);
  const [fulltext, setFulltext] = useState(false);
  const [panel, setPanel] = useState("");
  const [collection, setCollection] = useState("");
  const [loading, setLoading] = useState(false);
  const [advanced, setAdvanced] = useState(() => {
    const parsed = parseConditions(query.get("conditions"));
    return parsed.length
      ? parsed
      : [{ field: "标题", operator: "AND", value: "" }];
  });
  const [structureType, setStructureType] = useState("SMILES");
  const [structureMode, setStructureMode] = useState("精确结构");
  const [threshold, setThreshold] = useState("0.8");
  const [atoms, setAtoms] = useState<string[]>([]);
  const [structure, setStructure] = useState("");
  const [entity, setEntity] = useState("");
  const [activeEntity, setActiveEntity] = useState("");
  const [pathEnd, setPathEnd] = useState("");
  const [depth, setDepth] = useState(1);
  const [baseOpen, setBaseOpen] = useState(false);
  const [author, setAuthor] = useState("");
  const [organization, setOrganization] = useState("");
  const [language, setLanguage] = useState("全部");
  const [scope, setScope] = useState("全部");
  function params(values: Record<string, string>) {
    const next = new URLSearchParams(query.toString());
    for (const [k, v] of Object.entries(values)) {
      v ? next.set(k, v) : next.delete(k);
    }
    if (!("page" in values)) next.delete("page");
    router.replace("/knowledge?" + next);
  }
  const visible = s.knowledge.filter((o) => canRead(o, p, space.id, s));
  const item = visible.find((o) => o.id === id);
  const favoriteIds = s.favorites[p.id] ?? [];
  const results = visible
    .filter(
      (o) =>
        (type === "全部" || o.type === type) &&
        (mode === "结构式检索"
          ? ["文献", "专利", "数据集"].includes(o.type) &&
            (!q || q === "CCO" || q === "C2H6O" || q === "InChI=1S/C2H6O")
          : mode === "高级检索"
            ? advancedMatch(o, parseConditions(query.get("conditions")))
            : mode === "智能检索"
              ? !q ||
                [o.name, o.description, ...o.keywords].some(
                  (text) =>
                    text.includes(q) ||
                    (q.includes("储层") && text.includes("储层")),
                )
              : matchesBoolean(
                  [
                    o.name,
                    o.description,
                    o.authors,
                    o.organization,
                    ...o.keywords,
                    ...Object.values(o.metadata),
                  ].join(" "),
                  q,
                )) &&
        (discipline === "全部" || o.discipline === discipline) &&
        (year === "全部" || o.date.startsWith(year)) &&
        (!favorites || favoriteIds.includes(o.id)) &&
        (!fulltext || o.fulltext) &&
        (!author || o.authors.includes(author)) &&
        (!organization || o.organization.includes(organization)) &&
        (language === "全部" || o.language === language) &&
        (scope === "全部" ||
          (scope === "当前空间" && o.spaceId === space.id) ||
          (scope === "公共知识" && o.visibility === "PUBLIC")),
    )
    .sort((a, b) =>
      sort === "最新" || sort === "公开时间" || sort === "申请时间"
        ? b.date.localeCompare(a.date)
        : sort === "引用量" || sort === "热度"
          ? b.citationCount - a.citationCount
          : 0,
    );
  const validSelected = selected.filter((id) =>
    results.some((o) => o.id === id),
  );
  function search() {
    let value = input;
    if (mode === "结构式检索") value = structure || atoms.join("");
    if (mode === "高级检索")
      value = advanced
        .filter((x) => x.value.trim())
        .map((x, i) => (i ? " " + x.operator + " " : "") + '"' + x.value + '"')
        .join("");
    setLoading(true);
    mutate("已保存检索条件", "knowledge", (d, u) => {
      d.history[u.id] = [
        { query: value, mode },
        ...(d.history[u.id] ?? []),
      ].slice(0, 8);
    });
    params({
      q: value,
      searched: "1",
      mode,
      conditions: mode === "高级检索" ? JSON.stringify(advanced) : "",
    });
    setSelected([]);
    setTimeout(() => setLoading(false), 350);
  }
  function favorite(ids: string[]) {
    mutate("已更新知识收藏", ids.join(","), (d) => {
      const old = d.favorites[p.id] ?? [];
      d.favorites[p.id] =
        ids.length === 1 && old.includes(ids[0])
          ? old.filter((x) => x !== ids[0])
          : [...new Set([...old, ...ids])];
    });
  }
  const graphNodes = [
    { id: "shale", name: "页岩气", resource: "k-paper" },
    { id: "reservoir", name: "储层评价", resource: "k-patent" },
    { id: "porosity", name: "孔隙度", resource: "k-standard" },
    { id: "dataset", name: "实验数据", resource: "k-dataset" },
  ].filter((n) => visible.some((o) => o.id === n.resource));
  const edges: GraphRelation[] = [
    ["shale", "reservoir", "研究方法"],
    ["reservoir", "porosity", "评价参数"],
    ["porosity", "dataset", "数据依据"],
  ]
    .filter(
      ([a, b]) =>
        graphNodes.some((x) => x.id === a) &&
        graphNodes.some((x) => x.id === b),
    )
    .map(([a, b, name], i) => ({
      id: "edge-" + i,
      sourceEntityId: a,
      targetEntityId: b,
      relationType: name,
      evidenceIds: ["k-paper"],
      confirmed: true,
      extractedAt: "2026-09-24",
      extractionMethod: "示例资料关系",
    }));
  const neighborhood = activeEntity
    ? graphNeighborhood(activeEntity, edges, depth)
    : new Set<string>();
  const path =
    activeEntity && pathEnd
      ? findGraphPath(activeEntity, pathEnd, edges)
      : null;
  return (
    <>
      <PageTitle
        title={tab === "一站式检索" ? "知识中心" : `知识中心 · ${tab}`}
        action={
          tab !== "一站式检索" ? (
            <Button
              onClick={() =>
                params({ tab: "一站式检索", id: "", q: "", searched: "" })
              }
            >
              <ArrowLeft size={15} />
              返回一站式检索
            </Button>
          ) : undefined
        }
      />
      {id && !item ? (
        <Empty>该知识资源不可访问或不存在。</Empty>
      ) : item ? (
        <>
          <Button className="v-back" onClick={() => params({ id: "" })}>
            <ArrowLeft size={15} />
            返回检索结果
          </Button>
          <article className="v-card">
            <Badge>{item.type}</Badge>
            <h1 className="v-task-title">{item.name}</h1>
            <p className="v-muted">
              {item.authors} · {item.date} · {item.source}
            </p>
            <div className="v-actions">
              <ContextActions object={item} />
              <Button onClick={() => favorite([item.id])}>
                <Star size={15} />
                {favoriteIds.includes(item.id) ? "取消收藏" : "收藏"}
              </Button>
              <Button onClick={() => setPanel("original")}>
                {item.type === "专利" ? "查看原始专利" : "查看原文"}
              </Button>
              {item.type === "标准" && (
                <Button
                  onClick={() => {
                    if (addContext([item.id])) router.push("/workspace");
                  }}
                >
                  发起标准对比任务
                </Button>
              )}
            </div>
            <div className="v-divider" />
            <h2>摘要</h2>
            <p className="v-prose">{item.description}</p>
            <Details
              values={{
                作者: item.authors,
                机构: item.organization,
                学科: item.discipline,
                关键词: item.keywords.join("、"),
                来源: item.source,
                发布时间: item.date,
                引用量: item.citationCount,
                全文状态: item.fulltext ? "示例正文可读" : "暂无全文权限",
                ...item.metadata,
              }}
            />
            {item.fulltext && (
              <>
                <h2>正文 / 预览</h2>
                <p className="v-prose">{item.content}</p>
              </>
            )}
            {item.assetId && (
              <Button onClick={() => router.push("/assets?id=" + item.assetId)}>
                查看资产来源
              </Button>
            )}
            {item.type === "文献" && (
              <details>
                <summary>AI 辅助摘要与核心结论</summary>
                <p>
                  本地示例摘要：{item.description}{" "}
                  <button
                    className="v-link"
                    onClick={() => setPanel("original")}
                  >
                    [来源]
                  </button>
                </p>
              </details>
            )}
          </article>
        </>
      ) : tab === "知识库" ? (
        <>
          {!baseOpen ? (
            <div className="v-grid">
              <article className="v-card">
                <BookOpen size={26} color="#7a6256" />
                <h3 className="v-section">页岩气研究知识库</h3>
                <p>储层评价、实验方法与项目资料。</p>
                <Details
                  values={{
                    学科: "地球科学",
                    所属组织: "能源研究院",
                    文档数量: visible.length,
                    更新时间: "2026-09-24",
                    权限范围: "公共与当前空间授权",
                  }}
                />
                <Button onClick={() => setBaseOpen(true)}>打开知识库</Button>
              </article>
              {s.collections
                .filter((c) => c.ownerId === p.id && c.spaceId === space.id)
                .map((c) => (
                  <article className="v-card" key={c.id}>
                    <h3>{c.name}</h3>
                    <p>
                      {
                        c.ids.filter((id) => visible.some((o) => o.id === id))
                          .length
                      }{" "}
                      项资料
                    </p>
                    {c.ids
                      .filter((id) => visible.some((o) => o.id === id))
                      .map((id) => (
                        <button
                          key={id}
                          className="v-list-line v-wide-button"
                          onClick={() => params({ id })}
                        >
                          {visible.find((o) => o.id === id)?.name}
                        </button>
                      ))}
                  </article>
                ))}
            </div>
          ) : (
            <>
              <Button className="v-back" onClick={() => setBaseOpen(false)}>
                返回知识库
              </Button>
              <section className="v-card">
                <h2>页岩气研究知识库</h2>
                <SearchBox
                  value={input}
                  onChange={setInput}
                  placeholder="搜索库内文档"
                />
                {visible
                  .filter((o) => o.name.includes(input))
                  .map((o) => (
                    <button
                      className="v-list-line v-wide-button"
                      key={o.id}
                      onClick={() => params({ id: o.id })}
                    >
                      {o.name}
                      <Badge>{o.type}</Badge>
                    </button>
                  ))}
                <Button
                  onClick={() => {
                    if (addContext(visible.map((x) => x.id)))
                      router.push("/workspace");
                  }}
                >
                  将知识库加入 Research Agent
                </Button>
                <details>
                  <summary>更新记录与权限</summary>
                  <p className="v-muted">
                    2026-09-24 初始化示例；每条文档按 Project / Space / ACL
                    单独校验。
                  </p>
                </details>
              </section>
            </>
          )}
        </>
      ) : tab === "知识图谱" ? (
        <>
          <div className="v-toolbar">
            <SearchBox
              value={entity}
              onChange={setEntity}
              placeholder="搜索科研实体"
              onSubmit={() => {
                const n = graphNodes.find((x) => x.name.includes(entity));
                setActiveEntity(n?.id ?? "");
              }}
            />
            <Button
              primary
              onClick={() => {
                const n = graphNodes.find((x) => x.name.includes(entity));
                setActiveEntity(n?.id ?? "");
              }}
            >
              查询关系
            </Button>
          </div>
          {!activeEntity ? (
            <Empty>搜索实体后查看局部关系。</Empty>
          ) : (
            <div className="v-card">
              <div className="v-toolbar">
                <Select
                  label="关系深度"
                  value={String(depth)}
                  onChange={(v) => setDepth(Number(v))}
                  options={["1", "2", "3"]}
                />
                <Select
                  label="路径目标"
                  value={pathEnd}
                  onChange={setPathEnd}
                  options={[
                    { value: "", label: "选择实体" },
                    ...graphNodes.map((n) => ({ value: n.id, label: n.name })),
                  ]}
                />
              </div>
              <div className="v-graph-local">
                {graphNodes
                  .filter((n) => neighborhood.has(n.id))
                  .map((n) => (
                    <button
                      className={n.id === activeEntity ? "selected" : ""}
                      key={n.id}
                      onClick={() => setActiveEntity(n.id)}
                    >
                      <Network size={21} />
                      {n.name}
                    </button>
                  ))}
              </div>
              <Table
                headers={["实体", "关系", "关联实体", "知识来源"]}
                rows={edges
                  .filter(
                    (e) =>
                      neighborhood.has(e.sourceEntityId) &&
                      neighborhood.has(e.targetEntityId),
                  )
                  .map((e) => [
                    graphNodes.find((n) => n.id === e.sourceEntityId)?.name,
                    e.relationType,
                    graphNodes.find((n) => n.id === e.targetEntityId)?.name,
                    <button
                      className="v-link"
                      key="s"
                      onClick={() =>
                        params({
                          id: graphNodes.find((n) => n.id === e.targetEntityId)!
                            .resource,
                        })
                      }
                    >
                      查看依据
                    </button>,
                  ])}
              />
              {pathEnd && (
                <p>
                  路径：
                  {path
                    ? path.entityIds
                        .map((id) => graphNodes.find((x) => x.id === id)?.name)
                        .join(" → ")
                    : "当前局部图谱无可达路径"}
                </p>
              )}
              <div className="v-actions">
                <Button
                  onClick={() =>
                    params({
                      id: graphNodes.find((x) => x.id === activeEntity)!
                        .resource,
                    })
                  }
                >
                  节点详情与知识资源
                </Button>
                <Button onClick={() => favorite([activeEntity])}>
                  收藏实体
                </Button>
                <Button
                  primary
                  onClick={() => {
                    const n = graphNodes.find((x) => x.id === activeEntity)!;
                    if (addContext([n.resource])) router.push("/workspace");
                  }}
                >
                  加入 Research Agent 上下文
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <section
            className={`v-knowledge-search ${query.has("searched") ? "compact" : ""}`}
          >
            <span className="v-kicker">KNOWLEDGE & EVIDENCE</span>
            <h1>一站式科研知识检索</h1>
            <Tabs
              items={modes}
              value={mode}
              onChange={(v) => params({ mode: v })}
            />
            {mode === "高级检索" ? (
              <div className="v-advanced">
                {advanced.map((row, i) => (
                  <div className="v-toolbar" key={i}>
                    <Select
                      label="逻辑"
                      value={row.operator}
                      onChange={(v) =>
                        setAdvanced(
                          advanced.map((x, n) =>
                            n === i ? { ...x, operator: v } : x,
                          ),
                        )
                      }
                      options={["AND", "OR", "NOT"]}
                    />
                    <Select
                      label="字段"
                      value={row.field}
                      onChange={(v) =>
                        setAdvanced(
                          advanced.map((x, n) =>
                            n === i ? { ...x, field: v } : x,
                          ),
                        )
                      }
                      options={[
                        "标题",
                        "作者",
                        "机构",
                        "关键词",
                        "摘要",
                        "DOI",
                        "专利号",
                        "标准号",
                      ]}
                    />
                    <input
                      className="v-input"
                      aria-label={"条件 " + (i + 1)}
                      value={row.value}
                      onChange={(e) =>
                        setAdvanced(
                          advanced.map((x, n) =>
                            n === i ? { ...x, value: e.target.value } : x,
                          ),
                        )
                      }
                    />
                    <Button
                      onClick={() =>
                        setAdvanced(advanced.filter((_, n) => n !== i))
                      }
                      disabled={advanced.length === 1}
                    >
                      移除
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={() =>
                    setAdvanced([
                      ...advanced,
                      { field: "标题", operator: "AND", value: "" },
                    ])
                  }
                >
                  <Plus size={14} />
                  添加条件
                </Button>
              </div>
            ) : mode === "结构式检索" ? (
              <>
                <div className="v-toolbar">
                  <Select
                    label="结构输入"
                    value={structureType}
                    onChange={setStructureType}
                    options={[
                      "SMILES",
                      "分子式",
                      "InChI",
                      "结构式绘制",
                      "上传结构文件",
                    ]}
                  />
                  <Select
                    label="检索模式"
                    value={structureMode}
                    onChange={setStructureMode}
                    options={["精确结构", "相似结构", "子结构"]}
                  />
                  {structureMode === "相似结构" && (
                    <Field label="相似度阈值">
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                      />
                    </Field>
                  )}
                </div>
                {structureType === "结构式绘制" ? (
                  <div className="v-card">
                    <div className="v-actions">
                      {["C", "O", "N", "S"].map((atom) => (
                        <Button
                          key={atom}
                          onClick={() => setAtoms([...atoms, atom])}
                        >
                          {atom}
                        </Button>
                      ))}
                      <Button onClick={() => setAtoms(atoms.slice(0, -1))}>
                        撤销
                      </Button>
                    </div>
                    <p className="v-molecule">
                      {atoms.join(" — ") || "选择原子，绘制单键链"}
                    </p>
                  </div>
                ) : structureType === "上传结构文件" ? (
                  <input
                    aria-label="上传结构文件"
                    type="file"
                    accept=".smi,.txt,.mol"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setStructure(await f.text());
                    }}
                  />
                ) : (
                  <Field label={structureType}>
                    <input
                      value={structure}
                      onChange={(e) => setStructure(e.target.value)}
                      placeholder={
                        structureType === "SMILES"
                          ? "CCO"
                          : structureType === "分子式"
                            ? "C2H6O"
                            : "InChI=1S/C2H6O"
                      }
                    />
                  </Field>
                )}
              </>
            ) : (
              <div className="v-knowledge-query-row">
                <SearchBox
                  value={input}
                  onChange={setInput}
                  placeholder="输入科研问题、关键词或检索表达式"
                  onSubmit={search}
                />
                <Button primary onClick={search}>
                  <Search size={16} />
                  检索
                </Button>
              </div>
            )}
            {["高级检索", "结构式检索"].includes(mode) && (
              <div className="v-actions v-section v-knowledge-search-actions">
                <Button primary onClick={search}>
                  <Search size={16} />
                  检索
                </Button>
              </div>
            )}
          </section>
          {query.has("searched") ? (
            <>
              {loading ? (
                <div className="v-loading" role="status">
                  正在理解检索条件并查询本地知识库…
                </div>
              ) : (
                <>
                  <Tabs
                    items={types}
                    value={type}
                    onChange={(v) => params({ type: v })}
                  />
                  <div className="v-toolbar">
                    <Select
                      label="学科"
                      value={discipline}
                      onChange={setDiscipline}
                      options={disciplines}
                    />
                    <Select
                      label="年份"
                      value={year}
                      onChange={setYear}
                      options={["全部", "2026", "2025", "2024"]}
                    />
                    <Select
                      label="排序"
                      value={sort}
                      onChange={setSort}
                      options={[
                        "相关度",
                        "最新",
                        "引用量",
                        "热度",
                        ...(type === "专利" ? ["公开时间", "申请时间"] : []),
                      ]}
                    />
                    <label className="v-check-line">
                      <input
                        type="checkbox"
                        checked={fulltext}
                        onChange={(e) => setFulltext(e.target.checked)}
                      />
                      全文可用
                    </label>
                    <label className="v-check-line">
                      <input
                        type="checkbox"
                        checked={favorites}
                        onChange={(e) => setFavorites(e.target.checked)}
                      />
                      已收藏
                    </label>
                    <Button onClick={() => setPanel("filters")}>
                      更多筛选
                    </Button>
                  </div>
                  {mode === "智能检索" && results.length > 0 && (
                    <div className="v-search-summary">
                      <span>检索摘要 · 本地示例</span>
                      <p>
                        {results.slice(0, 2).map((r, i) => (
                          <span key={r.id}>
                            {r.description}{" "}
                            <button
                              className="v-link"
                              onClick={() => params({ id: r.id })}
                            >
                              [{i + 1}]
                            </button>{" "}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                  {mode === "结构式检索" && (
                    <Alert>
                      结构检索使用本地示例映射（乙醇）；真实相似度与子结构计算尚未接入。
                    </Alert>
                  )}
                  <div className="v-toolbar">
                    <span className="v-muted">
                      已选择 {validSelected.length} 项
                    </span>
                    <Button
                      disabled={!validSelected.length}
                      onClick={() => favorite(validSelected)}
                    >
                      批量收藏
                    </Button>
                    <Button
                      disabled={
                        !validSelected.length ||
                        !hasRole(p, "researcher", "leader")
                      }
                      onClick={() => {
                        if (addContext(validSelected))
                          notify("已加入科研上下文");
                      }}
                    >
                      加入科研上下文
                    </Button>
                    <Button
                      disabled={
                        !validSelected.length ||
                        !hasRole(p, "researcher", "leader")
                      }
                      onClick={() => {
                        if (addContext(validSelected))
                          router.push("/workspace");
                      }}
                    >
                      发送至 Research Agent
                    </Button>
                    <Button
                      disabled={!validSelected.length}
                      onClick={() => setPanel("collection")}
                    >
                      创建资料集
                    </Button>
                    <Button
                      disabled={!validSelected.length}
                      onClick={() =>
                        download(
                          "科研知识引用.txt",
                          results
                            .filter((r) => validSelected.includes(r.id))
                            .map(
                              (r) =>
                                `${r.authors}. ${r.name}. ${r.date}. ${r.source}`,
                            )
                            .join("\n"),
                        )
                      }
                    >
                      <Download size={14} />
                      导出引用
                    </Button>
                  </div>
                  <div className="v-card">
                    {results.slice((page - 1) * 8, page * 8).map((r) => (
                      <article className="v-knowledge-result" key={r.id}>
                        <input
                          aria-label={"选择 " + r.name}
                          type="checkbox"
                          checked={validSelected.includes(r.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, r.id]
                                : selected.filter((x) => x !== r.id),
                            )
                          }
                        />
                        <div>
                          <Badge>{r.type}</Badge>
                          <h3>
                            <button
                              className="v-link v-task-link"
                              onClick={() => params({ id: r.id })}
                            >
                              {r.name}
                            </button>
                          </h3>
                          <p className="v-muted">
                            {r.authors} · {r.date} · {r.source}
                          </p>
                          <p>{r.description}</p>
                          <div className="v-actions">
                            <Button onClick={() => params({ id: r.id })}>
                              查看详情
                            </Button>
                            <Button onClick={() => favorite([r.id])}>
                              {favoriteIds.includes(r.id) ? "已收藏" : "收藏"}
                            </Button>
                            {hasRole(p, "researcher", "leader") && (
                              <Button
                                onClick={() => {
                                  if (addContext([r.id]))
                                    router.push("/workspace");
                                }}
                              >
                                发送至 Research Agent
                              </Button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                    {!results.length && (
                      <Empty
                        action={
                          <Button
                            onClick={() => {
                              setDiscipline("全部");
                              setYear("全部");
                              setFulltext(false);
                              setFavorites(false);
                              setAuthor("");
                              setOrganization("");
                              setLanguage("全部");
                              setScope("全部");
                            }}
                          >
                            放宽筛选
                          </Button>
                        }
                      >
                        未找到符合条件的科研知识。
                      </Empty>
                    )}
                  </div>
                  <Pagination
                    page={page}
                    total={results.length}
                    onChange={(v) => params({ page: String(v) })}
                  />
                </>
              )}
            </>
          ) : (
            <>
              <div className="v-knowledge-types">
                {types.slice(1).map((t) => (
                  <button
                    key={t}
                    onClick={() => params({ type: t, searched: "1" })}
                  >
                    {t}
                    <ArrowRight size={14} />
                  </button>
                ))}
                <button onClick={() => params({ tab: "知识库" })}>
                  知识库
                  <ArrowRight size={14} />
                </button>
                <button onClick={() => params({ tab: "知识图谱" })}>
                  知识图谱
                  <ArrowRight size={14} />
                </button>
              </div>
              {(s.history[p.id] ?? []).length > 0 && (
                <div className="v-section">
                  <div className="v-section-head">
                    <h2>最近搜索</h2>
                    <Button
                      onClick={() =>
                        mutate("已清除搜索历史", "knowledge", (d) => {
                          d.history[p.id] = [];
                        })
                      }
                    >
                      清除历史
                    </Button>
                  </div>
                  <div className="v-actions">
                    {s.history[p.id].map((h, i) => (
                      <button
                        key={i}
                        className="v-chip"
                        onClick={() => {
                          setInput(h.query);
                          params({ q: h.query, mode: h.mode, searched: "1" });
                        }}
                      >
                        {h.query || "全部知识"} · {h.mode}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
      <Modal
        title="更多筛选"
        open={panel === "filters"}
        onClose={() => setPanel("")}
        footer={
          <Button primary onClick={() => setPanel("")}>
            应用筛选
          </Button>
        }
      >
        <Field label="作者">
          <input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </Field>
        <Field label="机构">
          <input
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </Field>
        <Select
          label="语言"
          value={language}
          onChange={setLanguage}
          options={["全部", "中文", "英文"]}
        />
        <Select
          label="权限范围"
          value={scope}
          onChange={setScope}
          options={["全部", "当前空间", "公共知识"]}
        />
      </Modal>
      <Modal
        title="创建资料集"
        open={panel === "collection"}
        onClose={() => setPanel("")}
        footer={
          <Button
            primary
            disabled={!collection.trim()}
            onClick={() => {
              mutate("已创建资料集", "knowledge", (d) => {
                d.collections.push({
                  id: uid("collection"),
                  name: collection,
                  ids: validSelected,
                  ownerId: p.id,
                  spaceId: space.id,
                });
              });
              setPanel("");
            }}
          >
            创建
          </Button>
        }
      >
        <Field label="资料集名称" required>
          <input
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          />
        </Field>
        <p>{validSelected.length} 条资源，仍保留原始知识权限。</p>
      </Modal>
      <Modal
        title="原文来源"
        open={panel === "original"}
        onClose={() => setPanel("")}
      >
        {item && (
          <>
            <Details
              values={{
                资源: item.name,
                来源: item.source,
                原文权限: item.fulltext ? "示例正文可读" : "暂无全文权限",
              }}
            />
            <p className="v-prose">
              {item.fulltext ? item.content : "当前未接入外部全文数据库。"}
            </p>
          </>
        )}
      </Modal>
    </>
  );
}
