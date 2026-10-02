"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  BookOpenCheck,
  ArrowLeft,
  ArrowRight,
  Clock3,
  Database,
  FileText,
  FolderOpen,
  Layers3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
  Tabs,
  download,
} from "./ui";
import { ContextActions } from "./actions";
import { advancedMatch, parseConditions } from "./search";
import {
  KnowledgeGraphDetail,
  KnowledgeLiteratureDetail,
} from "./knowledge-reference-views";
import {
  KnowledgeAssetTabs,
  KnowledgeGraphCatalog,
  KnowledgeLibraryView,
  knowledgeGraphCatalog,
  type KnowledgeAssetTab,
} from "./knowledge-asset-views";
import "./knowledge-home.css";
import "./knowledge-results.css";
const modes = ["智能检索", "关键词检索", "高级检索", "结构式检索"];
const types = ["全部", "文献", "专利", "标准", "内部资料", "数据集"];
const quickTypes = [
  { label: "文献", type: "文献", icon: FileText, tone: "blue", meta: "科研文献" },
  { label: "专利", type: "专利", icon: ShieldCheck, tone: "red", meta: "知识产权" },
  { label: "标准", type: "标准", icon: BookOpenCheck, tone: "purple", meta: "规范方法" },
  { label: "数据集", type: "数据集", icon: Database, tone: "teal", meta: "结构化资源" },
  { label: "内部知识", type: "内部资料", icon: FolderOpen, tone: "blue", meta: "企业知识" },
  { label: "知识库", tab: "知识库", icon: Layers3, tone: "blue", meta: "我的知识库" },
  { label: "知识图谱", tab: "知识图谱", icon: Network, tone: "green", meta: "关联探索" },
] as const;

const fallbackHistory = [
  { query: "新能源汽车电池用了哪些新的关键性能指标", time: "10 分钟前" },
  { query: "高性能钙钛矿太阳能电池相关专利", time: "昨天 14:20" },
  { query: "白光耦合量对退耦性能影响", time: "09-24 10:36" },
  { query: "CO₂ 催化转化反应机理", time: "09-23 16:12" },
  { query: "固态电池电解质材料研究进展", time: "09-21 11:08" },
];

const suggestedQuestions = [
  "新能源汽车电池的热稳定性",
  "高性能钙钛矿太阳能电池",
  "CO₂ 催化转化的最新进展",
];

const homeTopics = [
  "新能源电池", "钙钛矿太阳能电池", "CO₂催化", "高分子材料",
  "蛋白质结构预测", "固态电池", "氢能", "碳中和", "催化剂设计",
  "锂电池", "纳米材料", "材料基因工程", "AI 智能科研", "能源存储", "电解质",
];
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
  const conditions = query.get("conditions") ?? "";
  const type = query.get("type") ?? "全部";
  const id = query.get("id");
  const libraryId = query.get("library") ?? "";
  const graphId = query.get("graph") ?? "";
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
  const [author, setAuthor] = useState("");
  const [organization, setOrganization] = useState("");
  const [language, setLanguage] = useState("全部");
  const [scope, setScope] = useState("全部");
  useEffect(() => {
    setInput(q);
  }, [q]);
  useEffect(() => {
    const parsed = parseConditions(conditions);
    if (parsed.length) setAdvanced(parsed);
  }, [conditions]);
  function params(values: Record<string, string>, history: "replace" | "push" = "replace") {
    const next = new URLSearchParams(query.toString());
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!("page" in values)) next.delete("page");
    const url = "/knowledge?" + next;
    if (history === "push") router.push(url);
    else router.replace(url);
  }
  const visible = s.knowledge.filter((o) => canRead(o, p, space.id, s));
  const isHome = tab === "一站式检索" && !id && !query.has("searched");
  const isResults =
    tab === "一站式检索" && !id && query.has("searched");
  const isAssetTab = tab === "知识库" || tab === "知识图谱";
  const storedSearches = (s.history[p.id] ?? []).filter((entry) =>
    entry.query.trim(),
  );
  const recentSearches = [
    ...storedSearches.map((entry, index) => ({
      ...entry,
      time: ["10 分钟前", "昨天 14:20", "09-24 10:36"][index] ?? "近期",
    })),
    ...fallbackHistory.map((entry) => ({ ...entry, mode: "智能检索" })),
  ].filter(
    (entry, index, values) =>
      values.findIndex((candidate) => candidate.query === entry.query) === index,
  ).slice(0, 5);
  const item = visible.find((o) => o.id === id);
  const selectedGraph = knowledgeGraphCatalog.find((graph) => graph.id === graphId);
  const favoriteIds = s.favorites[p.id] ?? [];
  const matchedResults = visible
    .filter(
      (o) =>
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
  const results = matchedResults.filter(
    (o) => type === "全部" || o.type === type,
  );
  const typeCounts = Object.fromEntries(
    types.map((value) => [
      value,
      value === "全部"
        ? matchedResults.length
        : matchedResults.filter((result) => result.type === value).length,
    ]),
  ) as Record<string, number>;
  const maxTypeCount = Math.max(1, ...types.slice(1).map((value) => typeCounts[value]));
  const sourceCounts = Array.from(
    matchedResults.reduce((counts, result) => {
      counts.set(result.source, (counts.get(result.source) ?? 0) + 1);
      return counts;
    }, new Map<string, number>()),
  ).sort((a, b) => b[1] - a[1]);
  const relatedTopics = [
    ...new Set(matchedResults.flatMap((result) => result.keywords)),
  ].slice(0, 10);
  const resultYears = [
    ...new Set(matchedResults.map((result) => result.date.slice(0, 4))),
  ].sort();
  const summaryTopics = relatedTopics.slice(0, 3);
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
    if (!value.trim() || loading) return;
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
  function addToKnowledgeBase(id: string) {
    mutate("已加入知识库", id, (d) => {
      const existing = d.collections.find(
        (collection) =>
          collection.name === "我的知识库" &&
          collection.ownerId === p.id &&
          collection.spaceId === space.id,
      );
      if (existing) {
        existing.ids = [...new Set([...existing.ids, id])];
      } else {
        d.collections.push({
          id: uid("collection"),
          name: "我的知识库",
          ids: [id],
          ownerId: p.id,
          spaceId: space.id,
        });
      }
    });
    notify("已加入知识库");
  }
  return (
    <>
      {isResults ? (
        <header className="v-knowledge-results-title">
          <h1>{mode}结果</h1>
          <p>基于当前空间与权限范围，统一检索可读科研知识。</p>
        </header>
      ) : item?.type === "文献" || isAssetTab ? null : (
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
      )}
      {!id && isAssetTab && (
        <KnowledgeAssetTabs
          value={tab as KnowledgeAssetTab}
          onChange={(value) => params({ tab: value, library: "", graph: "", q: "", searched: "", id: "" }, "push")}
        />
      )}
      {id && !item ? (
        <Empty>该知识资源不可访问或不存在。</Empty>
      ) : item ? (
        item.type === "文献" ? (
          <KnowledgeLiteratureDetail
            item={item}
            favorite={favoriteIds.includes(item.id)}
            onBack={() => params({ id: "" })}
            onFavorite={() => favorite([item.id])}
            onOriginal={() => setPanel("original")}
            onAddContext={() => {
              if (addContext([item.id])) router.push("/workspace");
            }}
            onExport={() =>
              download(
                `${item.name}-引用.txt`,
                `${item.authors}. ${item.name}. ${item.date}. ${item.source}`,
              )
            }
          />
        ) : (
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
              <Button onClick={() => router.push("/research-spaces/current/assets/" + item.assetId)}>
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
        )
      ) : tab === "知识库" ? (
        <KnowledgeLibraryView
          resources={visible}
          selectedLibraryId={libraryId}
          onSelectLibrary={(nextLibraryId) => params({ library: nextLibraryId }, "push")}
          onBack={() => params({ library: "" }, "push")}
          onOpenResource={(resourceId) => params({ id: resourceId }, "push")}
          onAddResources={(ids) => {
            if (addContext(ids)) router.push("/workspace");
          }}
        />
      ) : tab === "知识图谱" ? (
        selectedGraph ? (
          <KnowledgeGraphDetail
            graph={selectedGraph}
            resources={visible}
            favoriteIds={favoriteIds}
            onBack={() => params({ graph: "" }, "push")}
            onOpenResource={(resourceId) => params({ id: resourceId }, "push")}
            onFavorite={(resourceId) => favorite([resourceId])}
          />
        ) : (
          <KnowledgeGraphCatalog
            onOpenGraph={(nextGraphId) => params({ graph: nextGraphId }, "push")}
            onCreateGraph={() => notify("新建知识图谱功能为原型演示，尚未接入真实构建流程。")}
          />
        )
      ) : (
        <>
          {isHome && (
            <nav
              className="v-knowledge-home-tabs"
              aria-label="知识中心视图"
            >
              <button type="button" className="selected" aria-current="page">
                知识发现
              </button>
              <button
                type="button"
                onClick={() => params({ tab: "知识库", mode: "", q: "" }, "push")}
              >
                知识资产
              </button>
            </nav>
          )}
          <section
            className={`v-knowledge-search ${query.has("searched") ? "compact" : ""} ${isHome ? "v-knowledge-home-hero" : ""} ${isResults ? "v-knowledge-results-search" : ""}`}
          >
            {isResults ? null : isHome ? (
              <>
                <h1>发现和理解科研知识</h1>
                <p className="v-knowledge-home-intro">
                  跨论文、专利、标准、数据等企业内部知识统一检索
                  <br />
                  让科学知识触手可及，加速科研创新
                </p>
                <div
                  className="v-knowledge-mode-switch"
                  role="tablist"
                  aria-label="检索模式"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "智能检索"}
                    className={mode === "智能检索" ? "selected" : ""}
                    onClick={() => params({ mode: "智能检索" })}
                  >
                    <Sparkles size={18} />
                    智能检索
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "高级检索"}
                    className={mode === "高级检索" ? "selected" : ""}
                    onClick={() => params({ mode: "高级检索" })}
                  >
                    <SlidersHorizontal size={18} />
                    高级检索
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="v-kicker">KNOWLEDGE & EVIDENCE</span>
                <h1>一站式科研知识检索</h1>
                <Tabs
                  items={modes}
                  value={mode}
                  onChange={(v) => params({ mode: v })}
                />
              </>
            )}
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
                  formId="knowledge-home-search"
                  value={input}
                  onChange={setInput}
                  placeholder={
                    isHome
                      ? "输入科研问题、关键词或分子结构式，支持自然语言、关键词和检索表达式"
                      : "输入科研问题、关键词或检索表达式"
                  }
                  onSubmit={search}
                />
                <Button
                  type="submit"
                  form="knowledge-home-search"
                  primary
                  disabled={loading || !input.trim()}
                >
                  {!loading && <Search size={16} />}
                  {loading ? "检索中…" : "检索"}
                </Button>
              </div>
            )}
            {isHome && mode === "智能检索" && (
              <div className="v-knowledge-home-prompts">
                <span>试试这些问题：</span>
                {suggestedQuestions.map((question) => (
                  <button type="button" onClick={() => setInput(question)} key={question}>
                    {question}
                  </button>
                ))}
                <button type="button" aria-label="更多推荐问题">…</button>
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
            {isHome && (
              <div
                className="v-knowledge-quick-types v-knowledge-category-cards"
                aria-label="知识类型卡片"
              >
                {quickTypes.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <div className={`v-knowledge-type-card tone-${entry.tone}`} key={entry.label}>
                      <i><Icon size={21} /></i>
                      <span><strong>{entry.label}</strong><small>{entry.meta}</small></span>
                    </div>
                  );
                })}
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
                <div className="v-knowledge-results-page">
                  <nav className="v-knowledge-results-tabs" aria-label="知识类型">
                    {types.map((value) => (
                      <button
                        type="button"
                        className={type === value ? "selected" : ""}
                        aria-current={type === value ? "page" : undefined}
                        onClick={() => params({ type: value })}
                        key={value}
                      >
                        {value}
                        <span>{typeCounts[value]}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="v-knowledge-results-filters">
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
                      <SlidersHorizontal size={15} />
                      更多筛选
                    </Button>
                  </div>
                  {mode === "智能检索" && matchedResults.length > 0 && (
                    <section className="v-ai-summary" aria-labelledby="ai-summary-title">
                      <header>
                        <span><Sparkles size={17} />AI</span>
                        <h2 id="ai-summary-title">AI检索摘要</h2>
                        <small>基于 {matchedResults.length} 条可见结果</small>
                      </header>
                      <p className="v-ai-summary-copy">
                        {summaryTopics.length
                          ? `当前结果主要聚焦${summaryTopics.join("、")}。`
                          : "已按当前条件完成多源知识检索。"}
                        {results[0]?.description
                          ? ` ${results[0].description}`
                          : " 可调整类型或筛选条件继续缩小范围。"}
                      </p>
                    </section>
                  )}
                  {mode === "结构式检索" && (
                    <Alert>
                      结构检索使用本地示例映射（乙醇）；真实相似度与子结构计算尚未接入。
                    </Alert>
                  )}
                  {validSelected.length > 0 && (
                    <div className="v-results-batch-bar">
                      <span>已选择 {validSelected.length} 项</span>
                    <Button
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
                  )}
                  <div className="v-knowledge-results-layout">
                    <main className="v-knowledge-results-main">
                      <div className="v-results-count">
                        共找到 <strong>{results.length}</strong> 条相关结果
                      </div>
                      <div className="v-knowledge-result-list">
                        {results.slice((page - 1) * 8, page * 8).map((r) => {
                          const typeEntry = quickTypes.find(
                            (entry) => "type" in entry && entry.type === r.type,
                          );
                          const TypeIcon = typeEntry?.icon ?? FileText;
                          return (
                            <article className="v-knowledge-result-card" key={r.id}>
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
                              <span className={`v-result-type tone-${typeEntry?.tone ?? "blue"}`}>
                                <TypeIcon size={20} />
                                {r.type === "内部资料" ? "内部" : r.type}
                              </span>
                              <div className="v-result-copy">
                                <header>
                                  <h3>
                                    <button
                                      className="v-link v-task-link"
                                      onClick={() => params({ id: r.id })}
                                    >
                                      {r.name}
                                    </button>
                                  </h3>
                                  <div className="v-result-actions">
                                    <button type="button" onClick={() => params({ id: r.id })}>
                                      查看详情
                                    </button>
                                    <button type="button" onClick={() => favorite([r.id])}>
                                      {favoriteIds.includes(r.id) ? "已收藏" : "收藏"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        download(
                                          `${r.name}-引用.txt`,
                                          `${r.authors}. ${r.name}. ${r.date}. ${r.source}`,
                                        )
                                      }
                                    >
                                      导出引用
                                    </button>
                                    {hasRole(p, "researcher", "leader") && (
                                      <button
                                        type="button"
                                        onClick={() => addToKnowledgeBase(r.id)}
                                      >
                                        加入知识库
                                      </button>
                                    )}
                                  </div>
                                </header>
                                <p className="v-result-meta">
                                  {r.authors} · {r.organization} · {r.date} · {r.source}
                                </p>
                                <p className="v-result-description">{r.description}</p>
                                <div className="v-result-keywords">
                                  {r.keywords.slice(0, 4).map((keyword) => (
                                    <button
                                      type="button"
                                      key={keyword}
                                      onClick={() => {
                                        setInput(keyword);
                                        params({ q: keyword, type: "全部", searched: "1" });
                                      }}
                                    >
                                      {keyword}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </article>
                          );
                        })}
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
                    </main>
                    <aside className="v-knowledge-results-aside">
                      <section className="v-search-overview">
                        <header>检索概览</header>
                        <div className="v-overview-summary">
                          <div><strong>{matchedResults.length}</strong><span>相关结果</span></div>
                          <div>
                            <strong>
                              {resultYears.length > 1
                                ? `${resultYears[0]}-${resultYears.at(-1)}`
                                : resultYears[0] ?? "暂无"}
                            </strong>
                            <span>时间范围</span>
                          </div>
                        </div>
                        <div className="v-overview-types">
                          {types.slice(1).map((value) => {
                            const entry = quickTypes.find(
                              (candidate) => "type" in candidate && candidate.type === value,
                            );
                            const OverviewIcon = entry?.icon ?? FileText;
                            return (
                              <div key={value}>
                                <span><OverviewIcon size={14} />{value}</span>
                                <i><b style={{ width: `${(typeCounts[value] / maxTypeCount) * 100}%` }} /></i>
                                <strong>{typeCounts[value]}</strong>
                              </div>
                            );
                          })}
                        </div>
                        {sourceCounts.length > 0 && (
                          <div className="v-overview-sources">
                            <h3>主要来源</h3>
                            {sourceCounts.slice(0, 5).map(([source, count]) => (
                              <div key={source}><span>{source}</span><strong>{count}</strong></div>
                            ))}
                          </div>
                        )}
                      </section>
                      <section className="v-related-topics">
                        <header>相关主题</header>
                        <div>
                          {relatedTopics.length ? relatedTopics.map((topic) => (
                            <button
                              type="button"
                              key={topic}
                              onClick={() => {
                                setInput(topic);
                                params({ q: topic, type: "全部", searched: "1" });
                              }}
                            >
                              {topic}
                            </button>
                          )) : <span className="v-muted">暂无可推荐主题</span>}
                        </div>
                      </section>
                    </aside>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="v-knowledge-home-grid v-knowledge-home-three-col">
              <section
                className="v-knowledge-home-panel"
                aria-labelledby="recent-searches-title"
              >
                <header>
                  <h2 id="recent-searches-title">
                    <Clock3 size={24} />
                    最近搜索
                  </h2>
                  <button
                    type="button"
                    onClick={() => params({ searched: "1" })}
                  >
                    查看全部
                    <ArrowRight size={16} />
                  </button>
                </header>
                <div className="v-knowledge-recent-list">
                  {recentSearches.map((entry, index) => (
                    <button
                      type="button"
                      key={`${entry.query}-${index}`}
                      onClick={() => {
                        setInput(entry.query);
                        params({
                          q: entry.query,
                          mode: entry.mode,
                          searched: "1",
                        });
                      }}
                    >
                      <Search size={17} />
                      <span>{entry.query || "全部知识"}</span>
                      <time>{entry.time}</time>
                    </button>
                  ))}
                </div>
              </section>

              <section
                className="v-knowledge-home-panel"
                aria-labelledby="recommended-knowledge-title"
              >
                <header>
                  <h2 id="recommended-knowledge-title">
                    <Star size={24} />
                    推荐知识
                  </h2>
                  <button
                    type="button"
                    onClick={() => params({ searched: "1" })}
                  >
                    查看更多
                    <ArrowRight size={16} />
                  </button>
                </header>
                <div className="v-knowledge-recommend-list">
                  {visible.slice(0, 3).map((resource) => (
                    <article key={resource.id}>
                      <Badge>{resource.type}</Badge>
                      <button
                        type="button"
                        className="v-knowledge-recommend-copy"
                        onClick={() => params({ id: resource.id })}
                      >
                        <strong>{resource.name}</strong>
                        <span>{resource.description}</span>
                        <small>
                          {resource.source} · {resource.date}
                        </small>
                      </button>
                      <button
                        type="button"
                        className="v-knowledge-recommend-open"
                        aria-label={`查看${resource.name}`}
                        onClick={() => params({ id: resource.id })}
                      >
                        <ArrowRight size={21} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>

              <section
                className="v-knowledge-home-panel v-hot-topics"
                aria-labelledby="hot-topics-title"
              >
                <header>
                  <h2 id="hot-topics-title">
                    <Sparkles size={24} />
                    热门研究主题
                  </h2>
                  <button type="button" onClick={() => params({ searched: "1" })}>
                    查看更多
                    <ArrowRight size={16} />
                  </button>
                </header>
                <div className="v-hot-topic-list">
                  {homeTopics.map((topic) => (
                    <button
                      type="button"
                      key={topic}
                      onClick={() => {
                        setInput(topic);
                        params({ q: topic, type: "全部", searched: "1" });
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="v-hot-topics-graph"
                  onClick={() => params({ tab: "知识图谱", q: "", searched: "" }, "push")}
                >
                  <Network size={28} />
                  <span><strong>探索知识图谱</strong><small>发现领域关键概念与关联关系</small></span>
                  <ArrowRight size={16} />
                </button>
              </section>
            </div>
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
