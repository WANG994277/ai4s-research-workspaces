"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Atom,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  BookOpen,
  Bot,
  Box,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Copy,
  Database,
  Download,
  Droplets,
  ExternalLink,
  Factory,
  FileText,
  Flame,
  FlaskConical,
  Gauge,
  Languages,
  Mail,
  Network,
  Quote,
  Search,
  Share2,
  Sparkles,
  Star,
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Knowledge } from "./types";
import type { KnowledgeGraphCatalogItem } from "./knowledge-asset-views";
import { notify } from "./store";
import { Modal } from "./ui";
import "./knowledge-reference.css";

type LiteratureProps = {
  item: Knowledge;
  favorite: boolean;
  onBack: () => void;
  onFavorite: () => void;
  onOriginal: () => void;
  onAddContext: () => void;
  onExport: () => void;
};

const literatureTabs = ["摘要", "引用网络", "图表", "相关文献", "评论"];

const assistantQuestions = [
  "这篇文献的核心创新点是什么？",
  "作者采用了哪些研究方法？",
  "这篇研究有哪些局限性？",
  "与同领域研究相比，它的优势是什么？",
];

const aiCapabilities: Array<[string, string, LucideIcon]> = [
  ["文献综述", "基于多篇文献生成综述", FileText],
  ["深度研究", "深入分析研究方法与结论", Search],
  ["全文问答", "基于文献内容精准回答", Bot],
  ["图表数据提取", "提取曲线、数据与结论", BarChart3],
  ["术语解释", "解释专业术语与概念", BookOpen],
  ["全文翻译", "多语言互译，保留专业表达", Languages],
  ["引用生成", "生成标准引用格式", Quote],
  ["相似文献推荐", "发现更多相关研究", Network],
];

type LiteratureAiMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function answerLiteratureQuestion(question: string, item: Knowledge) {
  if (question.includes("创新点")) {
    return `这篇文献的核心价值是将${item.keywords.slice(0, 2).join("与")}放在同一评价框架中，用可对比的指标支撑方法选择。`;
  }
  if (question.includes("研究方法")) {
    return "作者主要采用文献对比、指标建模和样本验证三个步骤，并对不同方法的适用边界进行了对照。";
  }
  if (question.includes("局限性")) {
    return "局限主要在于样本范围较窄、长周期数据不足，且部分参数在不同实验条件下仍需要再校准。";
  }
  if (question.includes("优势")) {
    return "相比单一指标方法，该研究的优势是信息来源更完整、评价结果更易追溯，也更适合与后续实验数据联动。";
  }
  return `我已结合《${item.name}》的摘要和元数据分析这个问题。当前原型可继续围绕${item.keywords.slice(0, 3).join("、")}进行追问。`;
}

export function KnowledgeLiteratureDetail({
  item,
  favorite,
  onBack,
  onFavorite,
  onOriginal,
  onAddContext,
  onExport,
}: LiteratureProps) {
  const [tab, setTab] = useState("摘要");
  const [aiDraft, setAiDraft] = useState("");
  const [capabilityDialogOpen, setCapabilityDialogOpen] = useState(false);
  const [activeCapability, setActiveCapability] = useState("全文问答");
  const aiInputRef = useRef<HTMLTextAreaElement>(null);
  const aiMessagesEndRef = useRef<HTMLSpanElement>(null);
  const [aiMessages, setAiMessages] = useState<LiteratureAiMessage[]>(() => [
    {
      id: `welcome-${item.id}`,
      role: "assistant",
      text: `我已读取《${item.name}》的摘要、作者、机构和关键词。你可以直接追问创新点、研究方法、局限性或应用价值。`,
    },
  ]);
  const metadata = item.metadata;
  const doi = metadata.DOI ?? "未接入真实 DOI";
  const journal = metadata.期刊 ?? item.source;
  const content = item.fulltext ? item.content : item.description;

  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [aiMessages]);

  function sendAiQuestion(value = aiDraft) {
    const question = value.trim();
    if (!question) return;
    setAiMessages((current) => {
      const sequence = current.length;
      return [
        ...current,
        { id: `user-${sequence}`, role: "user", text: question },
        { id: `assistant-${sequence + 1}`, role: "assistant", text: answerLiteratureQuestion(question, item) },
      ];
    });
    setAiDraft("");
  }

  function submitAiQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendAiQuestion();
  }

  return (
    <div className="v-literature-detail-layout">
      <main className="v-literature-main">
        <button type="button" className="v-literature-back" onClick={onBack}>
          ← 返回搜索结果
        </button>
        <section className="v-literature-header-card">
          <div className="v-literature-badges">
            <span>{item.type === "文献" ? "期刊论文" : item.type}</span>
            <span className="open">{item.fulltext ? "开放获取" : "题录可读"}</span>
          </div>
          <div className="v-literature-actions-top">
            <button type="button" onClick={onFavorite}><Star size={15} />{favorite ? "已收藏" : "收藏"}</button>
            <button type="button" onClick={onExport}><Quote size={15} />引用</button>
            <button type="button" onClick={onOriginal}><BookOpen size={15} />原文</button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  notify("已复制文献分享链接");
                } catch {
                  notify("浏览器未允许复制，请手动复制当前地址");
                }
              }}
            ><Share2 size={15} />分享</button>
          </div>
          <h1>{item.name}</h1>
          <p className="v-literature-authors">{item.authors} <Mail size={14} /></p>
          <p className="v-literature-org">{item.organization}</p>
          <p className="v-literature-source">
            来源：<strong>{journal}</strong><span>发表日期：{item.date}</span><span>DOI：{doi}</span>
          </p>
          <p className="v-literature-metrics">被引量：{item.citationCount} <span>浏览量：本地演示未统计</span></p>
        </section>

        <section className="v-literature-content-card">
          <nav className="v-literature-tabs" role="tablist" aria-label="文献详情页签">
            {literatureTabs.map((value) => (
              <button
                type="button"
                role="tab"
                id={`literature-tab-${value}`}
                aria-controls={`literature-panel-${value}`}
                aria-selected={tab === value}
                className={tab === value ? "selected" : ""}
                onClick={() => setTab(value)}
                key={value}
              >
                {value}{value === "图表" ? " (0)" : value === "评论" ? " (0)" : ""}
              </button>
            ))}
          </nav>
          {tab === "摘要" ? (
            <article
              className="v-literature-abstract"
              role="tabpanel"
              id="literature-panel-摘要"
              aria-labelledby="literature-tab-摘要"
            >
              <h2>摘要</h2>
              <p>{item.description}</p>
              {content !== item.description && !content.startsWith(item.description) && <p>{content}</p>}
              <dl>
                <dt>关键词</dt><dd>{item.keywords.join("、")}</dd>
                <dt>作者</dt><dd>{item.authors}</dd>
                <dt>机构</dt><dd>{item.organization}</dd>
                <dt>DOI</dt><dd>{doi} <Copy size={13} /></dd>
                <dt>专题</dt><dd>{item.discipline}</dd>
                <dt>分类号</dt><dd>{metadata.分类号 ?? "本地示例未标注"}</dd>
                <dt>发表时间</dt><dd>{item.date}</dd>
                <dt>来源</dt><dd>{journal}</dd>
                <dt>语言</dt><dd>{item.language}</dd>
                <dt>开放获取</dt><dd><CheckCircle2 size={14} />{item.fulltext ? "示例正文可读" : "暂无全文权限"}</dd>
              </dl>
            </article>
          ) : (
            <div
              className="v-literature-tab-placeholder"
              role="tabpanel"
              id={`literature-panel-${tab}`}
              aria-labelledby={`literature-tab-${tab}`}
            >
              <Network size={24} />
              <h2>{tab}</h2>
              <p>当前原型保留该信息架构，尚未接入真实外部文献服务。</p>
            </div>
          )}
          <footer className="v-literature-bottom-actions">
            <button type="button" className="primary" onClick={() => aiInputRef.current?.focus()}><Sparkles size={16} />AI 阅读</button>
            <button type="button" onClick={onOriginal}><BookOpen size={16} />原版阅读</button>
            <button type="button" onClick={() => notify("当前为本地原型，PDF 文件源尚未接入")}><Download size={16} />PDF 下载</button>
            <button type="button" onClick={() => notify("已将文献标记为章节下载示例")}><Download size={16} />章节下载</button>
            <span />
            <button type="button" onClick={onAddContext}><ExternalLink size={15} />加入课题</button>
            <button type="button" onClick={onExport}><Quote size={15} />导出引用</button>
          </footer>
        </section>
      </main>

      <aside className="v-literature-ai-panel">
        <section className="v-literature-ai-chat" aria-label="AI 文献研究助手">
          <header>
            <span><Sparkles size={18} /></span>
            <div><strong>AI 研究助手</strong><small><i />已载入当前文献</small></div>
          </header>
          <div className="v-literature-ai-messages" aria-live="polite">
            {aiMessages.map((message) => (
              <article className={message.role} key={message.id}>
                <span>{message.role === "assistant" ? <Sparkles size={15} /> : "林"}</span>
                <div><strong>{message.role === "assistant" ? "AI 研究助手" : "你"}</strong><p>{message.text}</p></div>
              </article>
            ))}
            <span ref={aiMessagesEndRef} />
          </div>
          <div className="v-literature-ai-suggestions" aria-label="建议问题">
            <span>你可以继续问：</span>
            {assistantQuestions.map((question) => (
              <button type="button" onClick={() => sendAiQuestion(question)} key={question}>{question}</button>
            ))}
          </div>
          <form className="v-literature-ai-composer" onSubmit={submitAiQuestion}>
            <textarea
              ref={aiInputRef}
              aria-label="向 AI 研究助手提问"
              value={aiDraft}
              onChange={(event) => setAiDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendAiQuestion();
                }
              }}
              placeholder="基于当前文献输入问题……"
              rows={2}
            />
            <div>
              <button type="button" onClick={() => setCapabilityDialogOpen(true)}><CircleGauge size={15} />AI 能力</button>
              <span>{activeCapability}</span>
              <button type="submit" aria-label="发送问题" className="send" disabled={!aiDraft.trim()}><ArrowUp size={17} /></button>
            </div>
          </form>
        </section>
      </aside>
      <Modal title="选择 AI 能力" open={capabilityDialogOpen} onClose={() => setCapabilityDialogOpen(false)}>
        <div className="v-literature-capability-dialog">
          <p>选择后将把该能力加入当前文献对话。</p>
          <div>
            {aiCapabilities.map(([name, description, Icon]) => (
              <button
                type="button"
                aria-pressed={activeCapability === name}
                className={activeCapability === name ? "selected" : ""}
                onClick={() => {
                  setActiveCapability(name);
                  setCapabilityDialogOpen(false);
                  setAiMessages((current) => [...current, {
                    id: `capability-${name}-${current.length}`,
                    role: "assistant",
                    text: `已切换到「${name}」能力。${description}，请告诉我你希望处理的重点。`,
                  }]);
                }}
                key={name}
              >
                <Icon size={19} />
                <span><strong>{name}</strong><small>{description}</small></span>
                {activeCapability === name && <CheckCircle2 size={16} />}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

type GraphNode = {
  id: string;
  name: string;
  english: string;
  type: string;
  Icon: LucideIcon;
  x: number;
  y: number;
  color: string;
  resourceId?: string;
  relation: string;
  relationType: string;
};

const shaleGraphNodes: GraphNode[] = [
  { id: "shale", name: "页岩油", english: "Shale Oil", type: "材料", Icon: Network, x: 50, y: 48, color: "blue", resourceId: "k-paper", relation: "中心实体", relationType: "包含/组成" },
  { id: "organic", name: "有机质", english: "Organic Matter", type: "材料", Icon: Atom, x: 31, y: 19, color: "purple", relation: "来源于", relationType: "来源于" },
  { id: "pyrolysis", name: "热解", english: "Pyrolysis", type: "工艺", Icon: FlaskConical, x: 57, y: 17, color: "green", relation: "转化为", relationType: "应用于" },
  { id: "light-oil", name: "轻质油", english: "Light Oil", type: "化合物", Icon: Droplets, x: 77, y: 28, color: "orange", relation: "产物", relationType: "包含/组成" },
  { id: "gas", name: "非常规油气", english: "Unconventional Gas", type: "文献", Icon: Factory, x: 86, y: 51, color: "indigo", resourceId: "k-patent", relation: "属于", relationType: "相关研究" },
  { id: "shale-gas", name: "页岩气", english: "Shale Gas", type: "性能", Icon: Flame, x: 77, y: 75, color: "pink", relation: "伴生", relationType: "具有性质" },
  { id: "property", name: "储层物性", english: "Reservoir Property", type: "数据", Icon: Database, x: 50, y: 85, color: "red", resourceId: "k-dataset", relation: "影响", relationType: "影响" },
  { id: "well", name: "水平井", english: "Horizontal Well", type: "工艺", Icon: Gauge, x: 24, y: 73, color: "teal", relation: "开发方式", relationType: "应用于" },
  { id: "fracture", name: "压裂", english: "Fracturing", type: "工艺", Icon: Waves, x: 15, y: 51, color: "blue", resourceId: "k-standard", relation: "开发工艺", relationType: "应用于" },
  { id: "toc", name: "TOC", english: "Total Organic Carbon", type: "标准", Icon: FileText, x: 23, y: 30, color: "orange", relation: "表征指标", relationType: "具有性质" },
];

function createGraphNodes(graph: KnowledgeGraphCatalogItem): GraphNode[] {
  if (graph.id === "graph-shale") return shaleGraphNodes;
  const concepts = [
    graph.name.replace("知识图谱", ""),
    graph.tags[0],
    graph.tags[1],
    graph.tags[2],
    "代表文献",
    "核心性能",
    "实验数据",
    "关键工艺",
    "标准方法",
    "关联专利",
  ];
  return shaleGraphNodes.map((node, index) => ({
    ...node,
    id: `${graph.id}-${index}`,
    name: concepts[index],
    english: index === 0 ? graph.discipline : concepts[index],
    resourceId: index === 4 ? "k-paper" : index === 6 ? "k-dataset" : index === 8 ? "k-standard" : index === 9 ? "k-patent" : undefined,
  }));
}

const entityTypes = ["材料", "化合物", "工艺", "性能", "数据", "文献", "标准"];
const relationTypes = ["具有性质", "应用于", "包含/组成", "影响", "来源于", "相关研究"];

type GraphProps = {
  graph: KnowledgeGraphCatalogItem;
  resources: Knowledge[];
  favoriteIds: string[];
  onBack: () => void;
  onOpenResource: (id: string) => void;
  onFavorite: (id: string) => void;
};

export function KnowledgeGraphDetail({ graph, resources, favoriteIds, onBack, onOpenResource, onFavorite }: GraphProps) {
  const currentGraphNodes = useMemo(() => createGraphNodes(graph), [graph]);
  const rootId = currentGraphNodes[0].id;
  const [selectedId, setSelectedId] = useState(rootId);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(100);
  const [activeTypes, setActiveTypes] = useState(entityTypes);
  const [activeRelations, setActiveRelations] = useState(relationTypes);
  const visibleNodes = useMemo(
    () => currentGraphNodes.filter((node) => node.id === rootId || (
      activeTypes.includes(node.type)
      && activeRelations.includes(node.relationType)
    )),
    [activeRelations, activeTypes, currentGraphNodes, rootId],
  );
  const selected = visibleNodes.find((node) => node.id === selectedId) ?? visibleNodes[0];
  const relatedResources = resources.filter((resource) => resource.keywords.some((keyword) => selected.name.includes(keyword) || keyword.includes(selected.name.slice(0, 2))));

  function toggleType(value: string) {
    setActiveTypes((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value]);
  }

  function selectSearchResult() {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      setSelectedId(rootId);
      return;
    }
    const match = visibleNodes.find((node) => `${node.name} ${node.english}`.toLowerCase().includes(normalized));
    if (match) setSelectedId(match.id);
    else notify(`未找到与“${query.trim()}”匹配的图谱实体`);
  }

  return (
    <div className="v-graph-detail-page">
      <section className={`v-graph-detail-hero ${graph.id === "graph-shale" ? "" : "generic"}`}>
        <div>
          <button type="button" className="v-graph-detail-back" onClick={onBack}><ArrowLeft size={14} />返回图谱列表</button>
          <p>知识中心 › 知识图谱 › <strong>图谱详情</strong></p>
          <h1>{graph.name} <span>{graph.type}</span></h1>
          <p>{graph.description}</p>
          <div className="v-graph-metrics">
            <span><Box size={15} />实体 <strong>{graph.entities.toLocaleString()}</strong></span>
            <span><Network size={15} />关系 <strong>{graph.relations.toLocaleString()}</strong></span>
            <span><FileText size={15} />来源文献 <strong>{resources.filter((resource) => resource.type === "文献").length}</strong></span>
            <span><Gauge size={15} />最后更新 <strong>{graph.updatedAt.split(" ")[0]}</strong></span>
          </div>
        </div>
      </section>

      <section className="v-graph-toolbar">
        <label><Search size={17} /><input aria-label="搜索图谱实体" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入实体名称，如：页岩油、储层、裂缝" /></label>
        <button type="button" className="primary" onClick={selectSearchResult}><Search size={15} />搜索</button>
      </section>

      <section className="v-graph-shell">
        <aside className="v-graph-filter-panel">
          <h2>实体类型</h2>
          {entityTypes.map((value) => (
            <label key={value}><input type="checkbox" checked={activeTypes.includes(value)} onChange={() => toggleType(value)} /><i className={`tone-${value}`} />{value}<span>{currentGraphNodes.filter((node) => node.type === value).length}</span></label>
          ))}
          <h2>关系类型</h2>
          {relationTypes.map((value) => (
            <label key={value}><input type="checkbox" checked={activeRelations.includes(value)} onChange={() => setActiveRelations((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value])} />{value}</label>
          ))}
        </aside>

        <div className="v-graph-canvas" style={{ "--graph-zoom": zoom / 100 } as CSSProperties}>
          <div className="v-graph-canvas-controls">
            <span>图谱视图</span>
            <button type="button" aria-label="缩小图谱" title="缩小图谱" onClick={() => setZoom((value) => Math.max(70, value - 10))}><ZoomOut size={14} /></button>
            <strong>{zoom}%</strong>
            <button type="button" aria-label="放大图谱" title="放大图谱" onClick={() => setZoom((value) => Math.min(130, value + 10))}><ZoomIn size={14} /></button>
          </div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {visibleNodes.filter((node) => node.id !== rootId).map((node) => (
              <line key={node.id} x1="50" y1="48" x2={node.x} y2={node.y} />
            ))}
          </svg>
          <div className="v-graph-stage">
            {visibleNodes.map((node) => {
              const Icon = node.Icon;
              return (
                <button
                  type="button"
                  className={`v-graph-node ${node.id === selected.id ? "selected" : ""} tone-${node.color}`}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  onClick={() => setSelectedId(node.id)}
                  key={node.id}
                >
                  <span><Icon size={node.id === rootId ? 28 : 22} /></span>
                  <strong>{node.name}</strong>
                  {node.id !== rootId && <small>{node.relation}</small>}
                </button>
              );
            })}
          </div>
          <div className="v-graph-legend">{entityTypes.map((value) => <span key={value}><i className={`tone-${value}`} />{value}</span>)}</div>
        </div>

        <aside className="v-graph-entity-panel">
          <header><span>{selected.type}</span><button type="button" disabled={!selected.resourceId} title={selected.resourceId ? "收藏关联资源" : "该概念暂无可收藏资源"} onClick={() => selected.resourceId && onFavorite(selected.resourceId)}><Star size={15} />{selected.resourceId && favoriteIds.includes(selected.resourceId) ? "已收藏" : "收藏"}</button></header>
          <h2>{selected.name}</h2>
          <small>{selected.english}</small>
          <h3>基本信息</h3>
          <dl>
            <dt>别名</dt><dd>{selected.name}相关概念</dd>
            <dt>类型</dt><dd>{selected.type}</dd>
            <dt>所属领域</dt><dd>{graph.discipline}</dd>
            <dt>定义</dt><dd>{selected.id === rootId ? graph.description : `「${selected.name}」是${graph.name}中的核心概念之一。`}</dd>
          </dl>
          <h3>关联信息</h3>
          <div className="v-graph-related-links">
            {relatedResources.length ? relatedResources.map((resource) => (
              <button type="button" onClick={() => onOpenResource(resource.id)} key={resource.id}>{resource.type} · {resource.name}<ChevronRight size={13} /></button>
            )) : <p>当前暂无直接关联资源。</p>}
          </div>
          <h3>高频关联概念</h3>
          <div className="v-graph-concepts">{currentGraphNodes.filter((node) => node.id !== selected.id).slice(0, 6).map((node) => <button type="button" onClick={() => setSelectedId(node.id)} key={node.id}>{node.name}</button>)}</div>
        </aside>
      </section>
    </div>
  );
}
