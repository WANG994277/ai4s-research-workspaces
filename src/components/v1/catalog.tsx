"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Box,
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CheckCircle2,
  Clock3,
  Code2,
  Crown,
  Dna,
  Download,
  Eye,
  FileText,
  FlaskConical,
  Grid2X2,
  GraduationCap,
  Heart,
  Info,
  Layers3,
  Lightbulb,
  List,
  MoreHorizontal,
  Network,
  Package,
  Play,
  Plus,
  Search,
  Settings2,
  Upload,
  User,
  Wrench,
  Star,
  ThumbsUp,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import type { Artifact, Asset, Task, Tool } from "./types";
import { useResearch, notify } from "./store";
import { canRead, canUse, hasRole, now, published, uid } from "./domain";
import { disciplines, scoped } from "./seed";
import {
  Alert,
  Badge,
  Button,
  Details,
  Empty,
  Field,
  Files,
  Modal,
  Pagination,
  SearchBox,
  Select,
  Tabs,
  download,
} from "./ui";
import { ExternalJump, PermissionRequest, SaveAsset } from "./actions";
import { matchesToolView } from "./catalog-views";
import assetStyles from "../assets/asset-hub.module.css";
import skillStyles from "./skills-marketplace.module.css";

const skillPurposes = [
  "全部",
  "文献搜索",
  "技术交底书撰写",
  "科研绘图",
  "专利分析",
  "数据分析",
  "实验方案",
  "标准对标",
];

function skillPurpose(name: string) {
  if (/专利/.test(name)) return "专利分析";
  if (/报告|交底/.test(name)) return "技术交底书撰写";
  if (/图表|绘图/.test(name)) return "科研绘图";
  if (/实验|催化|配方/.test(name)) return "实验方案";
  if (/数据|序列|参数|清洗/.test(name)) return "数据分析";
  if (/标准|对标/.test(name)) return "标准对标";
  return "文献搜索";
}

const skillIcons = [FileText, Dna, FlaskConical, Lightbulb, Package, Settings2];
const skillTones = [
  "",
  skillStyles.tone1,
  skillStyles.tone2,
  skillStyles.tone3,
  skillStyles.tone4,
  skillStyles.tone5,
];

const toolDisciplines = ["全部", "通用", "地球科学", "合成生物科学", "材料科学", "能源化工", "其他"];
const toolPurposes = ["全部", "数据处理", "建模仿真", "分子分析", "可视化", "科研绘图", "文献检索", "专利分析", "实验设计", "数据转换", "报告生成", "标准对标"];

function toolPurpose(name: string, tags: string[]) {
  const text = [name, ...tags].join(" ");
  if (/专利/.test(text)) return "专利分析";
  if (/文献|检索/.test(text)) return "文献检索";
  if (/报告/.test(text)) return "报告生成";
  if (/标准|对标/.test(text)) return "标准对标";
  if (/实验|配方/.test(text)) return "实验设计";
  if (/绘图|图表/.test(text)) return "科研绘图";
  if (/可视化/.test(text)) return "可视化";
  if (/分子|化学/.test(text)) return "分子分析";
  if (/模拟|建模|GROMACS|VASP|Gaussian/.test(text)) return "建模仿真";
  if (/转换|格式/.test(text)) return "数据转换";
  return "数据处理";
}

const toolIcons = [FileText, Network, FlaskConical, ChartNoAxesColumnIncreasing, Box, Wrench];
const modelTypes = ["全部", "机理模型", "数值模型", "机器学习模型", "科学基础模型", "多模态模型"];
const modelTasks = ["全部", "性质预测", "结构生成", "分类识别", "图像分析", "优化推荐", "仿真计算"];

function researchModelType(name: string) {
  if (/大语言|基础|分子生成|蛋白质结构/.test(name)) return "科学基础模型";
  if (/多模态|谱图/.test(name)) return "多模态模型";
  if (/机理/.test(name)) return "机理模型";
  if (/数值|仿真/.test(name)) return "数值模型";
  return "机器学习模型";
}

function researchModelTask(name: string) {
  if (/优化|配方/.test(name)) return "优化推荐";
  if (/生成|结构/.test(name)) return "结构生成";
  if (/图像|谱图|显微/.test(name)) return "图像分析";
  if (/分类|识别/.test(name)) return "分类识别";
  if (/仿真|数值/.test(name)) return "仿真计算";
  return "性质预测";
}

const modelIcons = [Box, Network, Dna, ChartNoAxesColumnIncreasing, FlaskConical, Lightbulb];
export function Catalog({ kind }: { kind: "skills" | "models" | "tools" }) {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const q = query.get("q") ?? "";
  const toolView = query.get("view") ?? "全部";
  const catalogTab = query.get("tab") ??
    (kind === "tools"
      ? "全部工具"
      : kind === "skills" ? "全部技能" : "全部模型");
  const discipline = query.get("discipline") ?? "全部";
  const page = Number(query.get("page") ?? 1);
  const selectedId = query.get("id");
  const filters: Record<string, string> = {};
  const [availability, setAvailability] = useState("全部");
  const [type, setType] = useState("全部");
  const [provider, setProvider] = useState("全部");
  const [sort, setSort] = useState("相关度");
  const [verified, setVerified] = useState("全部");
  const [panel, setPanel] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [dataset, setDataset] = useState("");
  const [version, setVersion] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [layoutView, setLayoutView] = useState<"list" | "grid">(
    "grid",
  );
  const [catalogFilterOpen, setCatalogFilterOpen] = useState(true);
  const [detailTab, setDetailTab] = useState("资产介绍");
  const [purpose, setPurpose] = useState("全部");
  const [modelType, setModelType] = useState("全部");
  const title =
    kind === "skills"
      ? "科研技能"
      : kind === "models"
        ? "科研模型"
        : "科研工具箱";
  const itemType =
    kind === "skills"
      ? "Skill"
      : kind === "models"
        ? "模型"
        : toolView === "科研软件"
          ? "软件"
          : toolView === "MCP"
            ? "MCP服务"
          : "工具";
  const Icon = kind === "skills" ? Layers3 : kind === "models" ? Box : Wrench;
  const description = kind === "skills"
    ? "可被 Research Agent 编排调用的标准化科研 Skill"
    : kind === "models"
      ? "机理、数值、机器学习与科学基础模型"
      : toolView === "科研软件"
        ? "完整专业科研应用，支持本地、云端与 Agent 调用"
        : toolView === "MCP"
          ? "面向 Research Agent 的标准化工具与数据连接服务"
          : "轻量科研能力、数据处理与科学计算工具";
  function params(key: string, value: string) {
    const next = new URLSearchParams(query.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace("/" + kind + "?" + next);
  }
  const source: (Asset | Tool)[] =
    kind === "tools"
      ? toolView === "全部"
        ? s.tools
        : s.tools.filter((tool) => matchesToolView(toolView, tool.type))
      : published(s, kind === "skills" ? "Skill" : "模型");
  const visible = source.filter((o) => canRead(o, p, space.id, s));
  const item = visible.find((o) => o.id === selectedId);
  const list = visible
    .filter(
      (o) =>
        (!filters.tag || o.tags.includes(filters.tag)) &&
        (!filters.scope ||
          o.visibility ===
            (
              {
                平台公开: "PUBLIC",
                项目内: "PROJECT",
                当前空间: "SPACE",
              } as Record<string, string>
            )[filters.scope]) &&
        (!filters.connected ||
          ("authorization" in o && o.authorization === filters.connected)) &&
        (!filters.callable ||
          (filters.callable === "是") === canUse(o, p, space.id, s)) &&
        (discipline === "全部" || o.discipline === discipline) &&
        (!q ||
          [o.name, o.description, o.provider, ...o.tags]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (availability === "全部" || o.availability === availability) &&
        (type === "全部" || o.type === type) &&
        (provider === "全部" || o.provider === provider) &&
        (verified === "全部" || ("validation" in o && !!o.validation)) &&
        (kind !== "skills" || purpose === "全部" || skillPurpose(o.name) === purpose) &&
        (kind !== "tools" || purpose === "全部" || toolPurpose(o.name, o.tags) === purpose) &&
        (kind !== "models" || modelType === "全部" || researchModelType(o.name) === modelType) &&
        (kind !== "models" || purpose === "全部" || researchModelTask(o.name) === purpose) &&
        (!catalogTab.includes("收藏") || (s.favorites[p.id] ?? []).includes(o.id)) &&
        (!catalogTab.includes("最近") || s.invocations.some((invocation) => invocation.resourceId === o.id && invocation.ownerId === p.id)) &&
        (!(catalogTab.includes("创建") || catalogTab.includes("上传")) || o.ownerId === p.id) &&
        (!(catalogTab.includes("可用") || catalogTab.includes("启用")) || canUse(o, p, space.id, s)),
    )
    .sort((a, b) =>
      sort === "最近更新"
        ? b.updatedAt.localeCompare(a.updatedAt)
        : sort === "最近使用"
          ? (s.invocations.findLast((x) => x.resourceId === b.id)?.startedAt ??
              0) -
            (s.invocations.findLast((x) => x.resourceId === a.id)?.startedAt ??
              0)
          : sort === "使用频率"
            ? s.invocations.filter((x) => x.resourceId === b.id).length -
              s.invocations.filter((x) => x.resourceId === a.id).length
            : 0,
    );
  const favorite = (id: string) =>
    mutate("已更新收藏", id, (d) => {
      const f = d.favorites[p.id] ?? [];
      d.favorites[p.id] = f.includes(id)
        ? f.filter((x) => x !== id)
        : [...f, id];
    });
  const inv = item
    ? s.invocations
        .filter(
          (x) =>
            x.resourceId === item.id &&
            x.ownerId === p.id &&
            x.spaceId === space.id,
        )
        .at(-1)
    : undefined;
  const detailTabs = kind === "models"
    ? ["资产介绍", "性能指标", "在线体验", "文件与配置", "版本记录"]
    : toolView === "科研软件"
      ? ["资产介绍", "安装使用", "授权与环境", "文件与配置", "版本记录"]
      : ["资产介绍", "使用说明", "文件与配置", "版本记录"];
  function run() {
    if (!item) return false;
    if (!input.trim() && !files.length && !dataset) {
      notify("请填写输入或选择文件 / 数据集。");
      return false;
    }
    const id = uid("invocation");
    return mutate("已提交本地模拟调用", item.id, (d, u) => {
      if (!canUse(item, u, space.id, d))
        throw new Error("当前资源不可调用，请检查权限、状态或外部授权。");
      for (const rid of [...item.dependencies, ...(dataset ? [dataset] : [])]) {
        const resource = d.assets.find((x) => x.id === rid);
        if (!resource || !canUse(resource, u, space.id, d))
          throw new Error("依赖或输入数据无访问权限。");
      }
      let taskId: string | undefined;
      let artifactId: string | undefined;
      if (item.longRunning) {
        taskId = uid("task");
        const sessionId = uid("session");
        const t: Task = {
          ...scoped(taskId, item.name + " · 运行任务", space.id, "SPACE", u.id),
          projectId: space.projectId,
          type: itemType + "调用",
          status: "WAITING_RESOURCE",
          steps: [
            {
              id: taskId + "-1",
              name: "等待执行资源",
              status: "waiting",
              resources: [item.id],
              outputIds: [],
            },
          ],
          sessionIds: [sessionId],
          contextIds: dataset ? [dataset] : [],
          capabilityIds: [item.id],
          participants: [u.id],
          next: "资源可用后执行",
          reason: "本地演示：执行资源等待中，可在科研工作台重试。",
          constraint: input,
          createdAt: now(),
        };
        d.tasks.unshift(t);
        d.sessions.unshift({
          ...scoped(sessionId, t.name, space.id, "PRIVATE", u.id),
          projectId: space.projectId,
          messages: [{ id: uid("m"), role: "user", text: input, at: now() }],
          taskId,
          favorite: false,
          archived: false,
          contextIds: t.contextIds,
          capabilityIds: [item.id],
        });
      } else {
        artifactId = uid("artifact");
        let content =
          "本地模拟结果：已完成输入校验。科研结论需连接真实能力服务后生成。";
        if (item.id === "tool-csv") {
          const rows = input
            .trim()
            .split("\n")
            .map((r) => r.split(","));
          if (rows.length < 2)
            throw new Error("请输入包含字段行和至少一行数据的 CSV。");
          const keys = rows.shift()!;
          if (rows.some((r) => r.length !== keys.length))
            throw new Error("CSV 列数不一致，请检查数据。");
          content = JSON.stringify(
            rows.map((r) =>
              Object.fromEntries(keys.map((k, i) => [k.trim(), r[i].trim()])),
            ),
            null,
            2,
          );
        }
        d.artifacts.unshift({
          ...scoped(
            artifactId,
            item.name + " · 运行结果",
            space.id,
            "PRIVATE",
            u.id,
          ),
          projectId: space.projectId,
          type: "计算结果",
          taskId: "",
          sessionId: "",
          stepId: id,
          version: version || item.version,
          status: "待确认",
          content,
          references: [item.id, ...(dataset ? [dataset] : [])],
        });
      }
      d.invocations.push({
        id,
        resourceId: item.id,
        spaceId: space.id,
        ownerId: u.id,
        input: JSON.stringify({
          input,
          files,
          dataset,
          version: version || item.version,
        }),
        status: taskId ? "等待资源" : "已完成",
        startedAt: Date.now(),
        result: artifactId
          ? d.artifacts.find((x) => x.id === artifactId)!.content
          : "等待资源",
        taskId,
        artifactId,
      });
    });
  }
  return (
    <div className={`v-catalog v-catalog-${kind} ${assetStyles.blueTheme}`}>
      {selectedId && !item ? (
        <Empty>当前资源未发布、已下架或无访问权限。</Empty>
      ) : item ? (
        kind === "skills" ? (
          <div className={skillStyles.detailPage}>
            <button className={skillStyles.detailBack} onClick={() => params("id", "")}>
              <ArrowLeft size={15} />返回科研技能广场
            </button>

            <section className={skillStyles.detailHero}>
              <div className={skillStyles.detailIdentity}>
                <span className={skillStyles.detailMark}><Layers3 size={32} /></span>
                <div>
                  <div className={skillStyles.detailTitleRow}>
                    <h1>{item.name}</h1>
                    <span className={skillStyles.detailType}>Skill</span>
                    <span className={skillStyles.detailVersion}>{item.version}</span>
                    <span className={skillStyles.detailAvailable}><CheckCircle2 size={13} />{item.availability}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className={skillStyles.detailStats}>
                    <span><User size={14} />{item.provider}</span>
                    <span><CalendarDays size={14} />更新于 {item.updatedAt.slice(0, 10)}</span>
                    <span><Eye size={14} />{Math.max(360, item.tags.length * 1280).toLocaleString()}</span>
                    <span><Star size={14} />{(s.favorites[p.id] ?? []).includes(item.id) ? 129 : 128}</span>
                    <span><ThumbsUp size={14} />{Math.max(86, item.dependencies.length * 420 + 230).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className={skillStyles.detailHeroArt} aria-hidden="true">
                <span className={skillStyles.detailDoc}><FileText size={42} /></span>
                <span className={skillStyles.detailLens} />
              </div>
              <div className={skillStyles.detailActions}>
                <button className={skillStyles.downloadButton} disabled={!canUse(item, p, space.id, s)} onClick={() => setPanel("run")}><Download size={17} />下载/获取</button>
                <button className={skillStyles.outlineButton} onClick={() => { navigator.clipboard?.writeText(`https://ai4s.local/${kind}/${item.id}`); notify("调用地址已复制。"); }}><Code2 size={17} />API/SDK</button>
                <button className={`${skillStyles.outlineButton} ${(s.favorites[p.id] ?? []).includes(item.id) ? skillStyles.outlineButtonActive : ""}`} onClick={() => favorite(item.id)}><Heart size={17} fill={(s.favorites[p.id] ?? []).includes(item.id) ? "currentColor" : "none"} />{(s.favorites[p.id] ?? []).includes(item.id) ? "已收藏" : "收藏"}</button>
                <button className={skillStyles.moreButton} aria-label="更多技能操作"><MoreHorizontal size={19} /></button>
              </div>
            </section>

            {!canUse(item, p, space.id, s) && <div className={skillStyles.detailNotice}>当前资源状态、授权或依赖不满足调用条件，可查看资产信息后申请权限。</div>}

            <nav className={skillStyles.detailTabs} aria-label="技能详情页签">
              {detailTabs.map((tab) => (
                <button className={`${skillStyles.detailTab} ${detailTab === tab ? skillStyles.detailTabActive : ""}`} onClick={() => setDetailTab(tab)} key={tab} aria-selected={detailTab === tab} role="tab">{tab}</button>
              ))}
            </nav>

            <div className={skillStyles.detailLayout}>
              <main className={skillStyles.detailMain}>
                {detailTab === "资产介绍" && (
                  <>
                    <section className={skillStyles.detailCard}>
                      <header><h2><FileText size={19} />资产介绍概览</h2></header>
                      <div className={skillStyles.detailCardBody}>
                        <p className={skillStyles.overviewText}>{item.description}基于大语言模型和学术领域知识，结构化解析论文内容，帮助科研人员快速获取可验证的事实证据，提升文献调研与知识整理效率。</p>
                        <div className={skillStyles.attributeGrid}>
                          <div className={skillStyles.attributeCard}><span className={skillStyles.attributeIcon}><GraduationCap size={22} /></span><div><strong>学科领域</strong><span className={skillStyles.softTag}>{item.discipline}</span></div></div>
                          <div className={skillStyles.attributeCard}><span className={skillStyles.attributeIcon}><Layers3 size={22} /></span><div><strong>学术用途</strong><span className={skillStyles.tagLine}><span className={skillStyles.softTag}>{skillPurpose(item.name)}</span><span className={skillStyles.softTag}>证据抽取</span></span></div></div>
                          <div className={skillStyles.attributeCard}><span className={`${skillStyles.attributeIcon} ${skillStyles.attributeIconCyan}`}><Box size={22} /></span><div><strong>资产属性</strong><span className={skillStyles.tagLine}><span className={skillStyles.softTag}>Skill</span><span className={skillStyles.softTag}>{item.availability}</span></span></div></div>
                        </div>
                      </div>
                    </section>

                    <section className={skillStyles.detailCard}>
                      <header><h2><FileText size={19} />输入与输出</h2></header>
                      <div className={`${skillStyles.detailCardBody} ${skillStyles.ioGrid}`}>
                        <div className={skillStyles.ioCard}><Upload size={24} /><div><strong>输入</strong><ul><li>{item.input}</li><li>支持单篇或批量文献输入</li></ul></div></div>
                        <div className={skillStyles.ioCard}><FileText size={24} /><div><strong>输出</strong><ul><li>{item.output}</li><li>支持按章节、结果类型组织输出</li><li>可导出为 JSON、Markdown 等格式</li></ul></div></div>
                      </div>
                    </section>

                    <section className={skillStyles.detailCard}>
                      <header><h2><Lightbulb size={19} />适用场景 / 能力说明</h2></header>
                      <div className={skillStyles.detailCardBody}>
                        <ul className={skillStyles.capabilityList}>
                          <li>快速提取论文中的实验条件（如材料、方法、参数等）</li>
                          <li>识别并抽取关键结论及其对应的证据引用（段落、图表、来源页码等）</li>
                          <li>支持多领域学术文献，适用于文献调研、综述撰写、知识图谱构建等场景</li>
                          <li>通过结构化输出，提升科研信息获取与整理效率</li>
                        </ul>
                      </div>
                    </section>

                    <section className={skillStyles.detailCard}>
                      <header className={skillStyles.warningHeader}><h2><AlertTriangle size={19} />限制与依赖</h2></header>
                      <div className={skillStyles.detailCardBody}><p className={skillStyles.overviewText}>{item.limitations}</p><p className={skillStyles.overviewText}>依赖：{item.dependencies.join("、") || "无额外资源依赖"}</p></div>
                    </section>
                  </>
                )}

                {detailTab === "使用说明" && (
                  <section className={skillStyles.detailCard}><header><h2><Code2 size={19} />使用说明</h2></header><div className={skillStyles.detailCardBody}><div className={skillStyles.instructionGrid}><div><strong>1. 准备输入</strong><p>{item.input}</p></div><div><strong>2. 设置参数</strong><p>选择版本、输出格式与引用数据集。</p></div><div><strong>3. 运行与复核</strong><p>{item.output}；结果需由科研人员复核。</p></div></div></div></section>
                )}

                {detailTab === "文件与配置" && (
                  <section className={skillStyles.detailCard}><header><h2><FileText size={19} />文件与配置</h2><button className={skillStyles.smallOutlineButton} onClick={() => download(`${item.name}-${item.version}.txt`, `${item.name}\n${item.description}\n输入：${item.input}\n输出：${item.output}`)}><Download size={14} />整包下载</button></header><div className={skillStyles.detailCardBody}><table className={skillStyles.fileTable}><thead><tr><th>文件名</th><th>类型</th><th>版本</th><th>说明</th><th>操作</th></tr></thead><tbody><tr><td>{item.id}-README.md</td><td>Markdown</td><td>{item.version}</td><td>使用说明与输入输出定义</td><td><button onClick={() => download(`${item.name}-README.md`, item.description)}>下载</button></td></tr><tr><td>{item.id}-config.json</td><td>JSON</td><td>{item.version}</td><td>调用参数与依赖配置</td><td><button onClick={() => download(`${item.name}-config.json`, JSON.stringify({ input: item.input, output: item.output, dependencies: item.dependencies }, null, 2))}>下载</button></td></tr></tbody></table></div></section>
                )}

                {detailTab === "版本记录" && (
                  <section className={skillStyles.detailCard}><header><h2><Clock3 size={19} />版本记录</h2></header><div className={skillStyles.detailCardBody}><div className={skillStyles.versionList}>{("versions" in item ? item.versions : []).map((versionItem) => <div className={skillStyles.versionRow} key={versionItem.id}><strong>{versionItem.number}</strong><span>{versionItem.at.slice(0, 10)}</span><span>{versionItem.description}</span><span>{versionItem.number === item.version ? "当前版本" : versionItem.status}</span></div>)}</div></div></section>
                )}
              </main>

              <aside className={skillStyles.detailAside}>
                <section className={skillStyles.sideCard}>
                  <header><h2><Info size={18} />资产信息</h2></header>
                  <dl><dt>资产类型</dt><dd>Skill</dd><dt>当前版本</dt><dd>{item.version}</dd><dt>文件格式</dt><dd>Markdown / JSON</dd><dt>上传者</dt><dd>{item.provider}</dd><dt>可见范围</dt><dd>{item.visibility === "PUBLIC" ? "平台内公开" : "项目授权"}</dd><dt>License</dt><dd>平台科研使用许可</dd></dl>
                </section>
                <section className={skillStyles.sideCard}>
                  <header><h2><Download size={18} />获取前说明</h2></header>
                  <div className={skillStyles.sideCardBody}><div className={skillStyles.tipBox}><Info size={18} /><ul><li>当前版本 {item.version}，可在版本记录中切换历史版本。</li><li>调用条件：{item.availability}，{item.dependencies.length ? `依赖 ${item.dependencies.length} 项资源` : "无额外依赖"}。</li><li>使用前请阅读 README 与限制说明。</li><li>如需面向生产环境使用，建议联系上传者获取技术支持。</li></ul></div></div>
                </section>
                <section className={skillStyles.sideCard}>
                  <header><h2 className={skillStyles.relatedTitle}><Star size={18} />相关资产</h2></header>
                  <div className={skillStyles.relatedList}>{visible.filter((record) => record.id !== item.id).slice(0, 3).map((record) => <button className={skillStyles.relatedItem} onClick={() => params("id", record.id)} key={record.id}><Layers3 size={18} /><span><strong>{record.name}</strong><small>{record.version} · {record.provider}</small></span><span className={skillStyles.miniAvailable}><CheckCircle2 size={9} />{record.availability}</span></button>)}</div>
                </section>
              </aside>
            </div>

            {inv && (
              <section className={skillStyles.detailCard}><header><h2><CheckCircle2 size={19} />最近运行结果</h2></header><div className={skillStyles.detailCardBody}><p>{inv.result}</p><div className={skillStyles.resultActions}><button className={skillStyles.smallOutlineButton} onClick={() => setPanel("run")}>重新运行</button>{!inv.taskId && <button className={skillStyles.downloadButton} onClick={() => download(item.name + "-结果.txt", inv.result)}>下载结果</button>}</div></div></section>
            )}
          </div>
        ) : (
        <>
          <section className={assetStyles.detailHeader}>
            <button className={assetStyles.backLink} onClick={() => params("id", "")}>
              <ArrowLeft size={14} />返回{title}广场
            </button>
            <div className={assetStyles.detailHero}>
              <div className={assetStyles.detailLead}>
                <span className="v-resource-icon"><Icon size={22} /></span>
                <div>
                  <div className={assetStyles.assetTitleRow}>
                    <h1>{item.name}</h1>
                    <span className={assetStyles.typeTag}>{itemType}</span>
                    <span className={assetStyles.tag}>{item.version}</span>
                    <span className={assetStyles.statusTag}><CheckCircle2 size={11} />{item.availability}</span>
                  </div>
                  <p>{item.description}</p>
                  <div className={assetStyles.detailMeta}>
                    <span><User size={13} />{item.provider}</span>
                    <span><Building2 size={13} />{item.provider}</span>
                    <span><Clock3 size={13} />更新于 {item.updatedAt.slice(0, 10)}</span>
                    <span><Eye size={13} />{Math.max(360, item.tags.length * 1280).toLocaleString()}</span>
                    <span><Download size={13} />{Math.max(86, item.dependencies.length * 420 + 230).toLocaleString()}</span>
                    <span><Heart size={13} />{(s.favorites[p.id] ?? []).includes(item.id) ? 129 : 128}</span>
                  </div>
                </div>
              </div>
              <div className={assetStyles.detailActions}>
                <button className={assetStyles.primaryButton} disabled={!canUse(item, p, space.id, s)} onClick={() => setPanel("run")}>
                  <Download size={15} />{item.type === "科研软件" ? "下载/打开" : "下载/获取"}
                </button>
                {kind === "models" && <button className={assetStyles.secondaryButton} onClick={() => setDetailTab("在线体验")}><Play size={15} />在线体验</button>}
                <button className={assetStyles.secondaryButton} onClick={() => { navigator.clipboard?.writeText(`https://ai4s.local/${kind}/${item.id}`); notify("调用地址已复制。"); }}><Code2 size={15} />API/SDK</button>
                <button className={`${assetStyles.secondaryButton} ${(s.favorites[p.id] ?? []).includes(item.id) ? assetStyles.iconButtonActive : ""}`} onClick={() => favorite(item.id)}><Heart size={15} fill={(s.favorites[p.id] ?? []).includes(item.id) ? "currentColor" : "none"} />{(s.favorites[p.id] ?? []).includes(item.id) ? "已收藏" : "收藏"}</button>
                <button className={assetStyles.iconButton} aria-label="更多资产操作"><MoreHorizontal size={16} /></button>
              </div>
            </div>
            {!canUse(item, p, space.id, s) && <div className={assetStyles.callout}>当前资源状态、授权或依赖不满足调用条件，可查看资产信息后申请权限。</div>}
          </section>
          <nav className={assetStyles.detailTabs} aria-label="资产详情页签">
            {detailTabs.map((tab) => <button className={`${assetStyles.detailTab} ${detailTab === tab ? assetStyles.detailTabActive : ""}`} onClick={() => setDetailTab(tab)} key={tab} aria-selected={detailTab === tab}>{tab}</button>)}
          </nav>
          <div className={assetStyles.detailLayout}>
            <main className={assetStyles.detailMain}>
              <section className={assetStyles.contentCard}>
                <div className={assetStyles.contentCardHeader}>
                  <h2><FileText size={16} color="#1268e8" />{detailTab}</h2>
                  {detailTab === "文件与配置" && <button className={assetStyles.secondaryButton} onClick={() => download(`${item.name}-${item.version}.txt`, `${item.name}\n${item.description}\n输入：${item.input}\n输出：${item.output}`)}><Download size={14} />整包下载</button>}
                </div>
                <div className={assetStyles.contentCardBody}>
                  {detailTab === "资产介绍" && <div className={assetStyles.stack}>
                    <p style={{ margin: 0 }}>{item.description}</p>
                    <div className={assetStyles.infoGrid}>
                      <div className={assetStyles.infoBlock}><strong>学科领域</strong><div className={assetStyles.tagRow}><span className={assetStyles.tag}>{item.discipline}</span></div></div>
                      <div className={assetStyles.infoBlock}><strong>学术用途</strong><div className={assetStyles.tagRow}>{item.tags.slice(0, 3).map((tag) => <span className={assetStyles.tag} key={tag}>{tag}</span>)}</div></div>
                      <div className={assetStyles.infoBlock}><strong>资产属性</strong><div className={assetStyles.tagRow}><span className={assetStyles.tag}>{itemType}</span><span className={assetStyles.tag}>{item.availability}</span></div></div>
                    </div>
                    <div className={assetStyles.infoBlock}><strong>输入与输出</strong><p>输入：{item.input}</p><p>输出：{item.output}</p></div>
                    <div className={assetStyles.infoBlock}><strong>限制与依赖</strong><p>{item.limitations}</p><p>依赖：{item.dependencies.join("、") || "无额外资源依赖"}</p></div>
                  </div>}
                  {(detailTab === "使用说明" || detailTab === "安装使用" || detailTab === "授权与环境") && <div className={assetStyles.stack}>
                    <div className={assetStyles.infoBlock}><strong>准备输入</strong><p>{item.input}</p></div>
                    <div className={assetStyles.infoBlock}><strong>运行与结果</strong><p>{item.output}</p></div>
                    <div className={assetStyles.callout}><Code2 size={15} /><span>引用时请标注资产 ID {item.id}、版本 {item.version}、发布方与获取日期。</span></div>
                  </div>}
                  {detailTab === "性能指标" && <div className={assetStyles.infoGrid}>{[["验证状态", "已验证"], ["适用数据", item.discipline], ["当前版本", item.version], ["运行方式", "在线推理"]].map(([label, value]) => <div className={assetStyles.infoBlock} key={label}><strong>{label}</strong><p style={{ fontSize: 20, fontWeight: 700 }}>{value}</p></div>)}</div>}
                  {detailTab === "在线体验" && <div className={assetStyles.infoGrid}><div className={assetStyles.infoBlock}><strong>示例输入</strong><p>{item.input}</p></div><div className={assetStyles.infoBlock}><strong>预期输出</strong><p>{item.output}</p></div><div className={assetStyles.infoBlock}><strong>原型边界</strong><p>当前展示输入输出形态，真实结果需连接计算资源。</p></div><button className={assetStyles.primaryButton} onClick={() => setPanel("run")}><Play size={14} />运行示例</button></div>}
                  {detailTab === "文件与配置" && <div className={assetStyles.fileTableWrap}><table className={assetStyles.fileTable}><thead><tr><th>文件名</th><th>类型</th><th>版本</th><th>说明</th><th>操作</th></tr></thead><tbody><tr><td>{item.id}-README.md</td><td>Markdown</td><td>{item.version}</td><td>使用说明与输入输出定义</td><td><button className={assetStyles.tableAction} onClick={() => download(`${item.name}-README.md`, item.description)}>下载</button></td></tr><tr><td>{item.id}-config.json</td><td>JSON</td><td>{item.version}</td><td>调用参数与依赖配置</td><td><button className={assetStyles.tableAction} onClick={() => download(`${item.name}-config.json`, JSON.stringify({ input: item.input, output: item.output, dependencies: item.dependencies }, null, 2))}>下载</button></td></tr></tbody></table></div>}
                  {detailTab === "版本记录" && <div className={assetStyles.versionList}>{("versions" in item ? item.versions : [{ id: item.id, number: item.version, description: "当前发布版本", by: item.provider, at: item.updatedAt, status: "已发布" }]).map((v) => <div className={assetStyles.versionItem} key={v.id}><strong>{v.number}</strong><span>{v.at.slice(0, 10)}</span><span>{v.description}</span><button className={assetStyles.tableAction}>{v.number === item.version ? "当前版本" : "查看该版本"}</button></div>)}</div>}
                </div>
              </section>
            </main>
            <aside className={assetStyles.detailAside}>
              <section className={assetStyles.contentCard}><div className={assetStyles.contentCardHeader}><h2><Info size={16} color="#2878d0" />资产信息</h2></div><div className={assetStyles.contentCardBody}><dl className={assetStyles.definitionList}><dt>资产类型</dt><dd>{itemType}</dd><dt>当前版本</dt><dd>{item.version}</dd><dt>文件格式</dt><dd>{kind === "models" ? "模型文件 / JSON" : "Markdown / JSON"}</dd><dt>上传者</dt><dd>{item.provider}</dd><dt>可见范围</dt><dd>{item.visibility === "PUBLIC" ? "平台内公开" : "项目授权"}</dd><dt>License</dt><dd>平台科研使用许可</dd></dl></div></section>
              <section className={assetStyles.contentCard}><div className={assetStyles.contentCardHeader}><h2><Download size={16} color="#1268e8" />获取前说明</h2></div><div className={assetStyles.contentCardBody}><div className={assetStyles.guideList}><div><strong>版本</strong><br />默认获取 {item.version}，可在版本记录切换历史版本。</div><div><strong>调用条件</strong><br />{item.availability} · {item.dependencies.length ? `依赖 ${item.dependencies.length} 项资源` : "无额外依赖"}</div><div><strong>使用条款</strong><br />使用前请阅读 README 与限制说明。</div></div></div></section>
              <section className={assetStyles.contentCard}><div className={assetStyles.contentCardHeader}><h2><Star size={16} color="#c99325" />相关资产</h2></div><div className={assetStyles.contentCardBody}><div className={assetStyles.rankList}>{visible.filter((record) => record.id !== item.id).slice(0, 3).map((record) => <div className={assetStyles.rankItem} key={record.id}><Icon size={14} /><div><button onClick={() => params("id", record.id)}>{record.name}</button><small>{record.version} · {record.provider}</small></div></div>)}</div></div></section>
            </aside>
          </div>
          {inv && (
            <section className="v-card v-section">
              <div className="v-section-head">
                <h2>最近运行结果</h2>
                <Badge>
                  {inv.taskId
                    ? s.tasks.find((t) => t.id === inv.taskId)?.status ===
                      "COMPLETED"
                      ? "已完成"
                      : inv.status
                    : inv.status}
                </Badge>
              </div>
              <p className="v-prose">{inv.result}</p>
              <Details
                values={{
                  运行时间: new Date(inv.startedAt).toLocaleString("zh-CN"),
                  版本: item.version,
                  输入: inv.input,
                  来源: "本地原型",
                }}
              />
              <div className="v-actions">
                {inv.taskId ? (
                  <Button
                    onClick={() => router.push("/assistant?task=" + inv.taskId)}
                  >
                    查看持续科研任务
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() =>
                        download(item.name + "-结果.txt", inv.result)
                      }
                    >
                      下载结果
                    </Button>
                    <Button
                      onClick={() =>
                        setArtifact(
                          s.artifacts.find((a) => a.id === inv.artifactId) ??
                            null,
                        )
                      }
                    >
                      保存为科研资产
                    </Button>
                  </>
                )}
                <Button onClick={() => setPanel("run")}>重新运行</Button>
              </div>
            </section>
          )}
        </>
        )
      ) : (
        <>
          {kind === "skills" ? (
            <div className={skillStyles.page}>
              <section className={skillStyles.hero}>
                <div className={skillStyles.heroCopy}>
                  <h1>科研技能广场</h1>
                  <p>可被 Research Agent 调用和用户标准化科研 Skill<br />在这里发现、启用和使用各类科研技能，助力你的科研创新。</p>
                </div>
                <div className={skillStyles.heroArt} aria-hidden="true">
                  <span className={skillStyles.orbit} />
                  <span className={skillStyles.aiCube}>AI</span>
                  <span className={skillStyles.miniCube}><FileText size={21} /></span>
                  <span className={skillStyles.miniCube}><FlaskConical size={20} /></span>
                </div>
                {hasRole(p, "researcher", "leader") && (
                  <div className={skillStyles.heroActions}>
                    <button className={skillStyles.heroButton} onClick={() => setPanel("external")}><Upload size={16} />导入技能</button>
                    <button className={skillStyles.heroButtonPrimary} onClick={() => setPanel("external")}><Plus size={16} />新建技能</button>
                  </div>
                )}
              </section>

              <div className={skillStyles.searchShell}>
                <form className={skillStyles.searchForm} onSubmit={(event) => event.preventDefault()}>
                  <Search size={18} />
                  <input
                    aria-label="搜索技能"
                    value={q}
                    onChange={(event) => params("q", event.target.value)}
                    placeholder="搜索技能名称、能力或应用场景（如：文献搜索、分子预测、材料设计…）"
                  />
                  <button type="submit">搜索</button>
                </form>
              </div>

              <div className={skillStyles.filterStack}>
                <div className={skillStyles.filterRow}>
                  <span className={skillStyles.filterLabel}>学科分类：</span>
                  <div className={skillStyles.pills}>
                    {disciplines.map((value) => (
                      <button
                        className={`${skillStyles.pill} ${discipline === value ? skillStyles.pillActive : ""}`}
                        onClick={() => params("discipline", value)}
                        key={value}
                        aria-pressed={discipline === value}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={skillStyles.filterRow}>
                  <span className={skillStyles.filterLabel}>用途分类：</span>
                  <div className={skillStyles.pills}>
                    {skillPurposes.map((value) => (
                      <button
                        className={`${skillStyles.pill} ${purpose === value ? skillStyles.pillActive : ""}`}
                        onClick={() => { setPurpose(value); params("page", "1"); }}
                        key={value}
                        aria-pressed={purpose === value}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <nav className={skillStyles.catalogTabs} aria-label="技能范围">
                {["全部技能", "已启用", "最近使用", "我的收藏", "我创建的"].map((value) => (
                  <button
                    className={`${skillStyles.catalogTab} ${catalogTab === value ? skillStyles.catalogTabActive : ""}`}
                    onClick={() => params("tab", value)}
                    key={value}
                    aria-current={catalogTab === value ? "page" : undefined}
                  >
                    {value}
                  </button>
                ))}
              </nav>

              <div className={skillStyles.toolbar}>
                <span className={skillStyles.count}>共 {list.length} 项</span>
                <select className={skillStyles.sortSelect} aria-label="技能排序" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="相关度">综合排序</option>
                  <option>最近更新</option>
                  <option>使用频率</option>
                  <option>最近使用</option>
                </select>
                <button className={`${skillStyles.viewButton} ${layoutView === "grid" ? skillStyles.viewButtonActive : ""}`} onClick={() => setLayoutView("grid")} aria-label="网格视图" aria-pressed={layoutView === "grid"}><Grid2X2 size={17} /></button>
                <button className={`${skillStyles.viewButton} ${layoutView === "list" ? skillStyles.viewButtonActive : ""}`} onClick={() => setLayoutView("list")} aria-label="列表视图" aria-pressed={layoutView === "list"}><List size={17} /></button>
              </div>

              {!q && discipline === "全部" && purpose === "全部" && catalogTab === "全部技能" && list.length > 0 && (
                <section className={skillStyles.featured}>
                  <div className={skillStyles.featuredTitle}>
                    <h2><Crown size={18} />精选推荐</h2>
                    <span>基于科研场景的热门技能，助力高效科研</span>
                  </div>
                  <div className={skillStyles.featuredGrid}>
                    {list.slice(0, 3).map((o, index) => {
                      const FeaturedIcon = skillIcons[index % skillIcons.length];
                      return (
                        <button className={skillStyles.featuredCard} onClick={() => params("id", o.id)} key={o.id}>
                          <span className={`${skillStyles.skillIcon} ${skillTones[index % skillTones.length]}`}><FeaturedIcon size={23} /></span>
                          <span>
                            <h3>{o.name}</h3>
                            <span className={skillStyles.featuredMeta}>
                              <span className={skillStyles.tag}>{o.discipline}</span>
                              <span className={skillStyles.tag}>{skillPurpose(o.name)}</span>
                              <span className={skillStyles.officialTag}>平台官方</span>
                            </span>
                            <p>{o.description}</p>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {list.length ? (
                <div className={`${skillStyles.skillGrid} ${layoutView === "list" ? skillStyles.skillList : ""}`}>
                  {list.slice((page - 1) * 9, page * 9).map((o, index) => {
                    const CardIcon = skillIcons[index % skillIcons.length];
                    return (
                      <article className={skillStyles.skillCard} key={o.id}>
                        <span className={`${skillStyles.skillIcon} ${skillTones[index % skillTones.length]}`}><CardIcon size={23} /></span>
                        <div className={skillStyles.skillBody}>
                          <button className={skillStyles.skillTitle} onClick={() => params("id", o.id)}>{o.name}</button>
                          <div className={skillStyles.tags}>
                            <span className={skillStyles.tag}>{o.discipline}</span>
                            <span className={skillStyles.tag}>{skillPurpose(o.name)}</span>
                            <span className={skillStyles.officialTag}>Skill</span>
                            <span className={o.availability === "可用" ? skillStyles.statusTag : skillStyles.tag}>{o.availability}</span>
                          </div>
                          <p className={skillStyles.skillSummary}>{o.description}</p>
                          <div className={skillStyles.cardFooter}>
                            <div className={skillStyles.cardMeta}><span>最近更新：{o.updatedAt.slice(0, 10)}</span><span>{o.version}</span></div>
                            <div className={skillStyles.cardActions}>
                              <button className={skillStyles.detailButton} onClick={() => params("id", o.id)}>查看详情</button>
                              <button className={skillStyles.useButton} disabled={!canUse(o, p, space.id, s)} onClick={() => { params("id", o.id); setPanel("run"); }}>使用</button>
                            </div>
                          </div>
                        </div>
                        <button className={skillStyles.cardMore} aria-label={`收藏 ${o.name}`} onClick={() => favorite(o.id)}><MoreHorizontal size={17} /></button>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className={skillStyles.empty}>没有符合当前条件的科研技能。</div>
              )}

              <Pagination page={page} total={list.length} size={9} onChange={(value) => params("page", String(value))} />
            </div>
          ) : kind === "tools" ? (
            <div className={`${skillStyles.page} ${skillStyles.toolboxPage}`}>
              <section className={`${skillStyles.hero} ${skillStyles.toolboxHero}`}>
                <div className={skillStyles.heroCopy}>
                  <h1>科研工具箱</h1>
                  <p className={skillStyles.toolSubtitle}>轻量科研能力、数据处理与科学计算工具</p>
                  <p>汇聚优质科研工具、科研软件与 MCP 服务，打通数据、计算与实验资源</p>
                </div>
                <div className={skillStyles.heroArt} aria-hidden="true">
                  <span className={skillStyles.orbit} />
                  <span className={skillStyles.aiCube}>AI</span>
                  <span className={skillStyles.miniCube}><FileText size={21} /></span>
                  <span className={skillStyles.miniCube}><Settings2 size={20} /></span>
                </div>
                {hasRole(p, "researcher", "leader") && (
                  <div className={skillStyles.heroActions}>
                    <button className={skillStyles.heroButton} onClick={() => setPanel("external")}><Upload size={16} />接入工具</button>
                    <button className={skillStyles.heroButtonPrimary} onClick={() => setPanel("external")}><Plus size={16} />新建工具</button>
                  </div>
                )}
              </section>

              <div className={skillStyles.searchShell}>
                <form className={skillStyles.searchForm} onSubmit={(event) => event.preventDefault()}>
                  <Search size={18} />
                  <input aria-label="搜索科研工具" value={q} onChange={(event) => params("q", event.target.value)} placeholder="搜索工具名称、功能、应用场景或关键词（支持自然语言）" />
                  <button type="submit">搜索</button>
                </form>
              </div>

              <div className={skillStyles.filterStack}>
                <div className={skillStyles.filterRow}>
                  <span className={skillStyles.filterLabel}>学科领域：</span>
                  <div className={skillStyles.pills}>{toolDisciplines.map((value) => <button className={`${skillStyles.pill} ${discipline === value ? skillStyles.pillActive : ""}`} onClick={() => params("discipline", value)} key={value} aria-pressed={discipline === value}>{value}</button>)}</div>
                </div>
                <div className={skillStyles.filterRow}>
                  <span className={skillStyles.filterLabel}>用途分类：</span>
                  <div className={skillStyles.pills}>{toolPurposes.map((value) => <button className={`${skillStyles.pill} ${purpose === value ? skillStyles.pillActive : ""}`} onClick={() => { setPurpose(value); params("page", "1"); }} key={value} aria-pressed={purpose === value}>{value}</button>)}</div>
                </div>
                <div className={skillStyles.filterRow}>
                  <span className={skillStyles.filterLabel}>工具类型：</span>
                  <div className={skillStyles.pills}>{["全部", "科研工具", "科研软件", "MCP"].map((value) => <button className={`${skillStyles.pill} ${toolView === value ? skillStyles.pillActive : ""}`} onClick={() => params("view", value === "全部" ? "" : value)} key={value} aria-pressed={toolView === value}>{value}</button>)}</div>
                </div>
              </div>

              <nav className={skillStyles.catalogTabs} aria-label="工具范围">
                {["全部工具", "最近使用", "已收藏", "我可用的"].map((value) => <button className={`${skillStyles.catalogTab} ${catalogTab === value ? skillStyles.catalogTabActive : ""}`} onClick={() => params("tab", value)} key={value} aria-current={catalogTab === value ? "page" : undefined}>{value}</button>)}
              </nav>

              <div className={skillStyles.toolbar}>
                <span className={skillStyles.count}>共 {list.length} 个工具</span>
                <select className={skillStyles.sortSelect} aria-label="工具排序" value={sort} onChange={(event) => setSort(event.target.value)}><option value="相关度">综合排序</option><option>最近更新</option><option>最近使用</option></select>
                <button className={`${skillStyles.viewButton} ${layoutView === "grid" ? skillStyles.viewButtonActive : ""}`} onClick={() => setLayoutView("grid")} aria-label="卡片视图" aria-pressed={layoutView === "grid"}><Grid2X2 size={17} /><span>卡片</span></button>
                <button className={`${skillStyles.viewButton} ${skillStyles.wideViewButton} ${layoutView === "list" ? skillStyles.viewButtonActive : ""}`} onClick={() => setLayoutView("list")} aria-label="列表视图" aria-pressed={layoutView === "list"}><List size={17} /><span>列表</span></button>
              </div>

              {!q && discipline === "全部" && purpose === "全部" && toolView === "全部" && catalogTab === "全部工具" && list.length > 0 && (
                <section className={skillStyles.featured}>
                  <div className={skillStyles.featuredTitle}><h2><Crown size={18} />精选推荐</h2><span>基于科研高频场景精选，助力高效科研</span></div>
                  <div className={skillStyles.featuredGrid}>
                    {list.slice(0, 3).map((o, index) => {
                      const FeaturedIcon = toolIcons[index % toolIcons.length];
                      return <button className={skillStyles.featuredCard} onClick={() => params("id", o.id)} key={o.id}><span className={`${skillStyles.skillIcon} ${skillTones[index % skillTones.length]}`}><FeaturedIcon size={23} /></span><span><h3>{o.name}</h3><span className={skillStyles.featuredMeta}><span className={skillStyles.tag}>{toolPurpose(o.name, o.tags)}</span><span className={skillStyles.tag}>{o.tags[0] ?? o.discipline}</span><span className={skillStyles.officialTag}>平台官方</span></span><p>{o.description}</p></span></button>;
                    })}
                  </div>
                </section>
              )}

              {list.length ? (
                <div className={`${skillStyles.skillGrid} ${layoutView === "list" ? skillStyles.skillList : ""}`}>
                  {list.slice((page - 1) * 9, page * 9).map((o, index) => {
                    const ToolIcon = toolIcons[index % toolIcons.length];
                    const viewCount = Math.max(1200, (index + 1) * 620 + o.tags.length * 370);
                    const favoriteCount = Math.max(48, (index + 1) * 28 + o.dependencies.length * 17);
                    return (
                      <article className={`${skillStyles.skillCard} ${skillStyles.toolCard}`} key={o.id}>
                        <span className={`${skillStyles.skillIcon} ${skillTones[index % skillTones.length]}`}><ToolIcon size={23} /></span>
                        <div className={skillStyles.skillBody}>
                          <button className={skillStyles.skillTitle} onClick={() => params("id", o.id)}>{o.name}</button>
                          <div className={skillStyles.tags}><span className={skillStyles.tag}>{toolPurpose(o.name, o.tags)}</span><span className={skillStyles.tag}>{o.tags[0] ?? o.discipline}</span><span className={o.availability === "可用" ? skillStyles.statusTag : skillStyles.tag}>{o.availability}</span></div>
                          <p className={skillStyles.toolSummary}>{o.description}</p>
                          <div className={skillStyles.cardFooter}>
                            <div className={skillStyles.cardMeta}><span><User size={12} />{o.provider}</span><span><Eye size={12} />{(viewCount / 1000).toFixed(1)}K</span><span><Heart size={12} />{favoriteCount}</span></div>
                            <div className={skillStyles.cardActions}><button className={skillStyles.detailButton} onClick={() => params("id", o.id)}>查看详情</button><button className={skillStyles.useButton} disabled={!canUse(o, p, space.id, s)} onClick={() => { params("id", o.id); setPanel("run"); }}>使用</button></div>
                          </div>
                        </div>
                        <button className={skillStyles.cardMore} aria-label={`收藏 ${o.name}`} onClick={() => favorite(o.id)}><MoreHorizontal size={17} /></button>
                      </article>
                    );
                  })}
                </div>
              ) : <div className={skillStyles.empty}>没有符合当前条件的科研工具。</div>}

              <Pagination page={page} total={list.length} size={9} onChange={(value) => params("page", String(value))} />
            </div>
          ) : (
            <div className={`${skillStyles.page} ${skillStyles.modelsPage}`}>
              <section className={`${skillStyles.hero} ${skillStyles.modelsHero}`}>
                <div className={skillStyles.heroCopy}>
                  <h1>科研模型广场</h1>
                  <p className={skillStyles.toolSubtitle}>机理、数值、机器学习与科学基础模型</p>
                  <p>在这里发现、评估和使用各类科研模型，加速预测、仿真与科学发现</p>
                </div>
                <div className={skillStyles.heroArt} aria-hidden="true"><span className={skillStyles.orbit} /><span className={skillStyles.aiCube}>AI</span><span className={skillStyles.miniCube}><Box size={21} /></span><span className={skillStyles.miniCube}><Network size={20} /></span></div>
                {hasRole(p, "researcher", "leader") && <div className={skillStyles.heroActions}><button className={skillStyles.heroButton} onClick={() => setPanel("external")}><Upload size={16} />导入模型</button><button className={skillStyles.heroButtonPrimary} onClick={() => setPanel("external")}><Plus size={16} />新建模型</button></div>}
              </section>

              <div className={skillStyles.searchShell}><form className={skillStyles.searchForm} onSubmit={(event) => event.preventDefault()}><Search size={18} /><input aria-label="搜索科研模型" value={q} onChange={(event) => params("q", event.target.value)} placeholder="搜索模型名称、能力、算法或应用场景（如：性质预测、结构生成…）" /><button type="submit">搜索</button></form></div>

              <div className={skillStyles.filterStack}>
                <div className={skillStyles.filterRow}><span className={skillStyles.filterLabel}>学科分类：</span><div className={skillStyles.pills}>{disciplines.map((value) => <button className={`${skillStyles.pill} ${discipline === value ? skillStyles.pillActive : ""}`} onClick={() => params("discipline", value)} key={value} aria-pressed={discipline === value}>{value}</button>)}</div></div>
                <div className={skillStyles.filterRow}><span className={skillStyles.filterLabel}>模型类型：</span><div className={skillStyles.pills}>{modelTypes.map((value) => <button className={`${skillStyles.pill} ${modelType === value ? skillStyles.pillActive : ""}`} onClick={() => { setModelType(value); params("page", "1"); }} key={value} aria-pressed={modelType === value}>{value}</button>)}</div></div>
                <div className={skillStyles.filterRow}><span className={skillStyles.filterLabel}>应用任务：</span><div className={skillStyles.pills}>{modelTasks.map((value) => <button className={`${skillStyles.pill} ${purpose === value ? skillStyles.pillActive : ""}`} onClick={() => { setPurpose(value); params("page", "1"); }} key={value} aria-pressed={purpose === value}>{value}</button>)}</div></div>
              </div>

              <nav className={skillStyles.catalogTabs} aria-label="模型范围">{["全部模型", "已启用", "最近使用", "我的收藏", "我上传的"].map((value) => <button className={`${skillStyles.catalogTab} ${catalogTab === value ? skillStyles.catalogTabActive : ""}`} onClick={() => params("tab", value)} key={value} aria-current={catalogTab === value ? "page" : undefined}>{value}</button>)}</nav>

              <div className={skillStyles.toolbar}><span className={skillStyles.count}>共 {list.length} 项</span><select className={skillStyles.sortSelect} aria-label="模型排序" value={sort} onChange={(event) => setSort(event.target.value)}><option value="相关度">综合排序</option><option>最近更新</option><option>使用频率</option><option>最近使用</option></select><button className={`${skillStyles.viewButton} ${layoutView === "grid" ? skillStyles.viewButtonActive : ""}`} onClick={() => setLayoutView("grid")} aria-label="网格视图" aria-pressed={layoutView === "grid"}><Grid2X2 size={17} /></button><button className={`${skillStyles.viewButton} ${layoutView === "list" ? skillStyles.viewButtonActive : ""}`} onClick={() => setLayoutView("list")} aria-label="列表视图" aria-pressed={layoutView === "list"}><List size={17} /></button></div>

              {!q && discipline === "全部" && modelType === "全部" && purpose === "全部" && catalogTab === "全部模型" && list.length > 0 && <section className={skillStyles.featured}><div className={skillStyles.featuredTitle}><h2><Crown size={18} />精选推荐</h2><span>经过场景验证的热门科研模型</span></div><div className={skillStyles.featuredGrid}>{list.slice(0, 3).map((o, index) => { const FeaturedIcon = modelIcons[index % modelIcons.length]; return <button className={skillStyles.featuredCard} onClick={() => params("id", o.id)} key={o.id}><span className={`${skillStyles.skillIcon} ${skillTones[index % skillTones.length]}`}><FeaturedIcon size={23} /></span><span><h3>{o.name}</h3><span className={skillStyles.featuredMeta}><span className={skillStyles.tag}>{o.discipline}</span><span className={skillStyles.tag}>{researchModelTask(o.name)}</span><span className={skillStyles.officialTag}>已验证</span></span><p>{o.description}</p></span></button>; })}</div></section>}

              {list.length ? <div className={`${skillStyles.skillGrid} ${layoutView === "list" ? skillStyles.skillList : ""}`}>{list.slice((page - 1) * 9, page * 9).map((o, index) => { const ModelIcon = modelIcons[index % modelIcons.length]; return <article className={`${skillStyles.skillCard} ${skillStyles.modelCard}`} key={o.id}><span className={`${skillStyles.skillIcon} ${skillTones[index % skillTones.length]}`}><ModelIcon size={23} /></span><div className={skillStyles.skillBody}><button className={skillStyles.skillTitle} onClick={() => params("id", o.id)}>{o.name}</button><div className={skillStyles.tags}><span className={skillStyles.tag}>{o.discipline}</span><span className={skillStyles.tag}>{researchModelType(o.name)}</span><span className={skillStyles.tag}>{researchModelTask(o.name)}</span><span className={o.availability === "可用" ? skillStyles.statusTag : skillStyles.tag}>{o.availability}</span></div><p className={skillStyles.toolSummary}>{o.description}</p><div className={skillStyles.cardFooter}><div className={skillStyles.cardMeta}><span>{o.provider}</span><span>{o.version}</span><span className={skillStyles.validationMeta}><CheckCircle2 size={11} />已验证</span></div><div className={skillStyles.cardActions}><button className={skillStyles.detailButton} onClick={() => params("id", o.id)}>查看详情</button><button className={skillStyles.useButton} disabled={!canUse(o, p, space.id, s)} onClick={() => { params("id", o.id); setPanel("run"); }}>在线体验</button></div></div></div><button className={skillStyles.cardMore} aria-label={`收藏 ${o.name}`} onClick={() => favorite(o.id)}><MoreHorizontal size={17} /></button></article>; })}</div> : <div className={skillStyles.empty}>没有符合当前条件的科研模型。</div>}

              <Pagination page={page} total={list.length} size={9} onChange={(value) => params("page", String(value))} />
            </div>
          )}
        </>
      )}
      <ExternalJump
        kind={"创建" + itemType}
        open={panel === "external"}
        onClose={() => setPanel("")}
      />
      {item && (
        <>
          <Modal
            title={item.name + " · 输入配置"}
            open={panel === "run"}
            onClose={() => setPanel("")}
            wide
            footer={
              <>
                <Button onClick={() => setPanel("")}>返回</Button>
                <Button
                  primary
                  disabled={!canUse(item, p, space.id, s)}
                  onClick={() => {
                    if (run()) setPanel("");
                  }}
                >
                  执行{itemType}
                </Button>
              </>
            }
          >
            <Field label={item.input} required>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  item.id === "tool-csv" ? "name,value\nporosity,0.12" : ""
                }
              />
            </Field>
            <Files value={files} onChange={setFiles} />
            <div className="v-form-grid v-section">
              <Field label="引用数据集">
                <select
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value)}
                >
                  <option value="">不使用数据集</option>
                  {s.assets
                    .filter(
                      (a) => a.type === "数据集" && canUse(a, p, space.id, s),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            {"versions" in item && (
              <Field label="版本">
                <select
                  value={version || item.version}
                  onChange={(e) => setVersion(e.target.value)}
                >
                  {item.versions.map((v) => (
                    <option key={v.id}>{v.number}</option>
                  ))}
                </select>
              </Field>
            )}
            <Alert>
              除 CSV 格式转换外，本次调用演示状态流，不执行真实科研计算。
            </Alert>
          </Modal>
          <Modal
            title="外部连接授权"
            open={panel === "authorization"}
            onClose={() => setPanel("")}
            footer={
              <Button
                onClick={() => {
                  notify("尚未配置外部授权地址，授权状态未变更。");
                }}
              >
                前往授权
              </Button>
            }
          >
            <Details
              values={{
                连接对象: item.name,
                来源系统: item.source,
                授权状态:
                  "authorization" in item ? item.authorization : "未连接",
              }}
            />
            <Alert>外部系统尚未接入，需要配置正式授权流程。</Alert>
          </Modal>
          <PermissionRequest
            objectId={item.id}
            open={panel === "permission"}
            onClose={() => setPanel("")}
          />
        </>
      )}
      {artifact && (
        <SaveAsset artifact={artifact} open onClose={() => setArtifact(null)} />
      )}
    </div>
  );
}
function PlusIcon() {
  return <span aria-hidden>＋</span>;
}
