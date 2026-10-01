"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, Atom, Beaker, BookOpen, Bot, Boxes, BrainCircuit,
  Database, Eye, FlaskConical, Network, Search, Sparkles, Workflow, Wrench,
} from "lucide-react";
import styles from "./portal.module.css";

const hotResources = {
  知识: ["中国石油科技论文库", "油气勘探开发知识库", "石油天然气行业标准库", "油气技术专利专题库", "炼化工艺与催化专题资料", "新能源与 CCUS 专题资料"],
  数据: ["公共材料结构数据集", "公共油气地质数据集", "组织科研数据目录", "历史实验数据中心", "课题数据空间", "生产动态样例数据集"],
  模型: ["科研中枢大模型", "油气地质领域基础模型", "储层多因素评价模型", "分子性质计算模型", "炼化过程预测模型", "高分子配方性能预测模型"],
  工具: ["分子模拟科研软件", "油藏数值模拟工具", "科研数据库连接器", "专利与标准智能检索", "科学计算 Notebook", "科研可视化工作台"],
  技能: ["储层证据抽取 Skill", "测井曲线质检 Skill", "分子描述符计算 Skill", "材料表征解析 Skill", "代谢通路分析 Skill", "实验方案结构化 Skill"],
  工作流: ["文献调研与综述工作流", "地质证据汇聚工作流", "油藏模拟计算工作流", "催化剂虚拟筛选工作流", "实验数据分析工作流", "科研成果归档工作流"],
  "Agent 及应用": ["油气勘探领域专家 Agent", "炼化化工领域专家 Agent", "文献研究 Agent", "科研数据分析 Agent", "模拟计算 Agent", "实验设计 Agent"],
} as const;

const catalog = [
  ["知识", "论文库", "中国石油科技论文库", "汇聚油气全产业链科研论文，支持语义检索、证据定位和规范引用。", "读", "全专业"],
  ["数据", "公共数据集", "公共油气地质数据集", "用于地质认识、方法验证和算法基准测试，标注来源及使用许可。", "读·算", "油气地质"],
  ["模型", "科学模型", "储层多因素评价模型", "融合地震、测井、岩心与生产动态开展储层评价。", "算", "勘探开发"],
  ["工具", "科研软件", "分子模拟科研软件", "集成分子动力学、量化计算和常用结果分析能力。", "算", "材料科学"],
  ["实验设施", "设备", "高通量催化剂评价装置", "支持多组候选催化剂并行评价和结果回流。", "做", "炼化化工"],
  ["技能", "知识处理", "储层证据抽取 Skill", "从地质报告、测井解释和历史成果中抽取可引用证据。", "读", "地球科学"],
  ["工作流", "文献调研", "文献调研与综述工作流", "从问题拆解到检索、筛选、证据整理和综述生成。", "读", "全专业"],
  ["Agent 及应用", "领域专家", "油气勘探领域专家 Agent", "围绕地质问题提供专业推理、证据核查与研究建议。", "读·算", "勘探开发"],
] as const;

function ResourceIcon({ type }: { type: string }) {
  if (type === "知识") return <BookOpen />;
  if (type === "数据") return <Database />;
  if (type === "模型") return <BrainCircuit />;
  if (type === "实验设施") return <FlaskConical />;
  if (type === "技能") return <Atom />;
  if (type === "工作流") return <Workflow />;
  if (type.includes("Agent")) return <Bot />;
  return <Wrench />;
}

function PublicHeader({ resource = false }: { resource?: boolean }) {
  return <header className={styles.header}>
    <Link href="/" className={styles.logo}><Image src="/v1/sciencelab-logo.jpg" alt="中国石油 ScienceLab · AI for Science 一体化科研平台" width={1100} height={366} style={{ width: 220, height: "auto" }} priority /></Link>
    <nav aria-label="门户导航"><Link className={!resource ? styles.active : ""} href="/">首页</Link><Link className={resource ? styles.active : ""} href="/research-resources">科研资源</Link><Link href="/#activities">科研社区</Link><Link href="/#help">帮助中心</Link></nav>
    <div className={styles.headerActions}><Link href="/workspace">登录</Link><Link className={styles.primaryButton} href="/workspace">进入科研工作台 <ArrowRight size={16} /></Link></div>
  </header>;
}

const SectionTitle = ({ kicker, title, copy }: { kicker: string; title: string; copy?: string }) => <div className={styles.sectionHead}><div><span className={styles.eyebrow}>{kicker}</span><h2>{title}</h2></div>{copy && <p>{copy}</p>}</div>;

export function PortalHome() {
  const [category, setCategory] = useState<keyof typeof hotResources>("知识");
  return <div className={styles.portal}><PublicHeader /><main>
    <section className={styles.hero}><div className={styles.heroCopy}><span className={styles.eyebrow}>中国石油 SCIENCELAB · AI FOR SCIENCE 一体化科研平台</span><h1>用 AI 加速科学发现，<strong>让复杂问题走向确定答案</strong></h1><p>AI4S 平台面向勘探开发、油气工程、炼化化工、新材料与新能源科研，统一汇聚知识、数据、模型、工具、技能、工作流和实验设施。</p><div className={styles.heroActions}><Link className={styles.primaryButton} href="/workspace">描述科研问题 <ArrowRight size={17} /></Link><a className={styles.secondaryButton} href="#help">新手上路</a></div><div className={styles.valueLine}><span>统一科研入口</span><span>资源开放共享</span><span>AI 原生研究</span><span>过程全程可追溯</span></div></div>
      <div className={styles.twin}><div className={styles.twinGrid} /><header><span>SCIENCE NEXUS / DIGITAL TWIN</span><b>智能推演中</b></header><div className={styles.sources}><span><BookOpen />知识证据</span><span><Database />科研数据</span><span><BrainCircuit />专业能力</span></div><div className={styles.nexus}><Sparkles /><strong>科研中枢</strong><small>模型理解 · 智能体规划</small></div><div className={styles.model}><Network /><b>多尺度科学模型</b><span>储层预测 0.87 · 候选方案 12</span></div><footer><Bot /><span><b>科研中枢智能体</b><small>正在生成可验证的研究路径</small></span><em>运行中</em></footer></div></section>
    <div className={styles.domainStrip}><strong>AI+ PETROLEUM R&amp;D<br /><small>科研场景</small></strong>{[["勘探开发", "储层预测 · 油藏模拟"], ["油气工程", "钻完井 · 压裂优化"], ["炼化化工", "催化剂 · 工艺优化"], ["新材料新能源", "高分子 · 氢能 · CCUS"]].map(([t, d]) => <span key={t}><b>{t}</b><small>{d}</small></span>)}</div>
    <section className={styles.section}><SectionTitle kicker="END-TO-END AI RESEARCH" title="科研全流程贯通：从问题提出到成果沉淀" copy="资源中心提供知识与专业能力，科研中枢理解问题并组织任务，课题空间支撑协作与资产沉淀。" /><div className={styles.path}>科学问题 <ArrowRight /> 读 <ArrowRight /> 算 <ArrowRight /> 做 <ArrowRight /> 科研资产</div><div className={styles.capabilities}>{[["读 · 获取知识，形成证据", "从公开文献、行业标准与企业历史成果中建立可定位、可引用、可比较的证据。"], ["算 · 建模预测，筛选方案", "组织多源数据、科学模型和专业软件，形成可复现的计算过程。"], ["做 · 实验验证，反馈迭代", "将计算结论转为实验或现场验证方案，持续修正科学认识。"]].map(([t, d], i) => <article key={t}><span>0{i + 1}</span><h3>{t}</h3><p>{d}</p><ul><li>专业资源与工具</li><li>AI 中枢理解与调度</li><li>过程和证据可追溯</li></ul></article>)}</div></section>
    <section className={`${styles.section} ${styles.alt}`}><SectionTitle kicker="POPULAR RESEARCH RESOURCES" title="热门科研资源" /><div className={styles.hotShell}><nav>{(Object.keys(hotResources) as (keyof typeof hotResources)[]).map((name) => <button className={category === name ? styles.selected : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</nav><div className={styles.resourceGrid}>{hotResources[category].map((name, i) => <article key={name}><span><ResourceIcon type={category} /></span><div><small>{category} · 平台公开</small><h3>{name}</h3><p>面向科研任务提供可发现、可授权、可调用的专业能力。</p><em>{i % 2 ? "组织共享" : "ScienceLab 资源"}</em></div></article>)}</div></div><Link className={styles.moreLink} href="/research-resources">查看全部科研资源 <ArrowRight size={16} /></Link></section>
    <section className={styles.section}><SectionTitle kicker="AI-ASSISTED OUTCOMES" title="AI 协同科研成果案例" copy="展示 AI 如何参与问题分解、证据组织、模型计算与验证设计。" /><div className={styles.cases}>{[["勘探开发", "页岩气储层敏感性评价", "评价方法 · 证据集 · 技术报告"], ["新材料", "高性能合成橡胶配方优化", "候选配方 · 预测模型 · 实验方案"], ["炼化化工 · CCUS", "CO₂ 加氢催化剂筛选", "候选清单 · 计算记录 · 验证路径"]].map(([domain, title, assets], i) => <article key={title}><div><span>0{i + 1}</span><small>{domain}</small><Beaker /></div><section><h3>{title}</h3><p><b>科学问题</b>如何系统缩小候选范围并保留可验证证据？</p><p><b>沉淀资产</b>{assets}</p></section></article>)}</div></section>
    <section id="activities" className={`${styles.section} ${styles.alt}`}><SectionTitle kicker="AI RESEARCH COMMUNITY" title="平台动态与 AI 科研活动" copy="了解 AI 能力更新、资源上新、专题交流与科研培训。" /><div className={styles.activities}><article><span>专题活动</span><h3>材料与催化 AI for Science 专题交流</h3><p>围绕文献证据、分子计算、配方筛选与实验验证，分享“读—算—做”一体化实践路径。</p></article><div>{[["培训课程", "《AI for Science 科研工作流入门》"], ["资源更新", "油气专业标准与科研数据资源更新"], ["平台更新", "课题空间资产血缘能力上线"]].map(([kind, title]) => <article key={title}><span>{kind}</span><strong>{title}</strong><ArrowRight size={16} /></article>)}</div></div></section>
    <section id="help" className={styles.help}><div><strong>第一次使用 ScienceLab？</strong><span>从提出科研问题开始，三步建立一条可追溯研究链路。</span></div><Link href="/workspace">查看新手上路</Link></section>
  </main><footer className={styles.footer}><Image src="/v1/sciencelab-logo.jpg" alt="中国石油 ScienceLab · AI for Science 一体化科研平台" width={1100} height={366} style={{ width: 190, height: "auto" }} /><span>面向油气全产业链，贯通知识、计算、实验与现场验证。</span><span>数据安全 · 引用可追溯 · 权限与合规</span></footer></div>;
}

export function ResearchResourceCenter() {
  const [type, setType] = useState("全部");
  const [stage, setStage] = useState("全部");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => catalog.filter((item) => (type === "全部" || item[0] === type) && (stage === "全部" || item[4].includes(stage)) && `${item[2]} ${item[3]}`.includes(query)), [query, stage, type]);
  const types = ["全部", "知识", "数据", "模型", "工具", "实验设施", "技能", "工作流", "Agent 及应用"];
  return <div className={styles.portal}><PublicHeader resource /><main className={styles.resourcePage}><section className={styles.resourceHero}><div><span className={styles.eyebrow}>AI RESEARCH COMMONS</span><h1>集团科研资源中心</h1><p>统一发现知识、数据、模型、工具、实验设施、技能、工作流和 Agent，并按科研阶段快速筛选。</p></div><div className={styles.metrics}>{[["11,620", "资源总量"], ["8,426", "科研知识"], ["2,186", "科研数据"], ["326", "科学模型"], ["214", "科研技能"]].map(([v, l]) => <span key={l}><b>{v}</b><small>{l}</small></span>)}</div><label className={styles.resourceSearch}><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索资源名称、科研问题、专业领域或 AI 能力" /></label></section><section className={styles.browser}><nav>{types.map((name) => <button className={type === name ? styles.selected : ""} key={name} onClick={() => setType(name)}><ResourceIcon type={name} /><span>{name}</span></button>)}</nav><div><header className={styles.filters}><b>科研阶段</b>{["全部", "读", "算", "做"].map((name) => <button className={stage === name ? styles.selected : ""} key={name} onClick={() => setStage(name)}>{name}</button>)}<span>{visible.length} 项资源</span></header><div className={styles.publicGrid}>{visible.map((item, i) => <article key={item[2]}><header><span><ResourceIcon type={item[0]} /></span><b>{item[1]}</b><em>{i % 3 ? "公开" : "申请"}</em></header><h2>{item[2]}</h2><p>{item[3]}</p><div className={styles.resourceTags}><span>{item[4]}</span><span>{item[5]}</span></div><footer><span><Boxes size={15} /> ScienceLab</span><span><Eye size={15} /> {426 + i * 173}</span><button>查看详情 <ArrowRight size={14} /></button></footer></article>)}</div>{!visible.length && <div className={styles.empty}>没有符合当前条件的资源，请调整搜索或筛选。</div>}</div></section><section className={styles.loginNote}><div><span className={styles.eyebrow}>FROM DISCOVERY TO ACTION</span><h2>浏览保持开放，执行进入可信工作环境</h2><p>查看资源介绍无需登录；申请受限数据、提交计算或把资源加入课题时，需要进入科研工作台。</p></div><Link className={styles.primaryButton} href="/workspace">登录并进入科研工作台 <ArrowRight size={16} /></Link></section></main></div>;
}
