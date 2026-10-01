"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight, Atom, BookOpen, Boxes, BrainCircuit, Database,
  Eye, FlaskConical, Grid2X2, PlayCircle, Search,
  Share2, SlidersHorizontal, Sparkles, Users, Workflow, Wrench, X,
  type LucideIcon,
} from "lucide-react";
import catalogData from "./public-catalog.json";
import hotResourceData from "./hot-resources.json";
import s from "./portal-reference.module.css";

const c = (...names: string[]) => names.map((name) => s[name] ?? name).join(" ");
type Resource = [string, string[], string, string, string, string];
const catalog = catalogData as Resource[];
const resourceTypes = [
  ["全部", "全部资源", "统一浏览平台的科研资源与能力"],
  ["知识", "知识", "论文、知识库、标准、专利与行业资料"],
  ["数据", "数据", "公共数据、组织数据与课题数据"],
  ["模型", "模型", "基础模型、科学模型与预测模型"],
  ["工具", "工具", "科研软件、数据库、检索与可视化工具"],
  ["实验设施", "实验设施", "实验设备、实验试剂与实验条件"],
  ["技能", "技能", "可被 AI 与 Agent 调用的原子科研能力"],
  ["工作流", "工作流", "文献调研、模拟计算与实验分析模板"],
  ["Agent及应用", "Agent及应用", "领域专家、专业 Agent 与科研应用"],
] as const;
const iconByType: Record<string, LucideIcon> = {
  全部: Grid2X2, 知识: BookOpen, 数据: Database, 模型: BrainCircuit,
  工具: Wrench, 实验设施: FlaskConical, 技能: Atom, 工作流: Workflow,
  Agent及应用: Sparkles, "Agent 及应用": Sparkles,
};
const resourceProviders: Record<string,string> = { 知识:"科技信息中心", 数据:"数据管理中心", 模型:"数智研究院", 工具:"科研软件中心", 实验设施:"实验资源中心", 技能:"AI4S 技能中心", 工作流:"AI4S 运营中心", Agent及应用:"数智研究院" };
const hotResources = hotResourceData as unknown as Record<string, [string,string,string,string[]][]>;
const cases = [
  ["勘探开发", "页岩气储层敏感性评价", "如何识别影响甜点评价可靠性的关键因素？", "整合文献证据、地震测井与岩心数据，完成多因素敏感性分析。", "评价方法 · 证据集 · 技术报告", "case-material.png"],
  ["新材料", "高性能合成橡胶配方优化", "湿抓性能与耐磨性如何实现协同提升？", "从历史配方与机理证据出发，形成候选配方并设计验证实验。", "候选配方 · 预测模型 · 实验方案", "case-hydrogen.png"],
  ["炼化化工 · CCUS", "CO₂ 加氢催化剂筛选", "如何缩小高活性、高选择性催化剂的候选范围？", "联动专利文献、分子计算与实验约束，形成优先级清单。", "候选清单 · 计算记录 · 验证路径", "case-hydrogen.png"],
] as const;
const processColumns = [
  ["读 · 获取知识，形成证据", "从公开文献、行业标准与企业历史成果中建立可定位、可引用、可比较的证据。", ["文献与专利智能检索", "标准与企业知识问答", "证据抽取、对比与综述"]],
  ["算 · 建模预测，筛选方案", "组织多源数据、科学模型和专业软件，通过 AI 中台调度形成可复现的计算过程。", ["数据分析与特征工程", "机理模型与 AI 模型协同", "模拟计算、参数优化与筛选"]],
  ["做 · 实验验证，反馈迭代", "将计算结论转为实验或现场验证方案，接收仪器和生产数据持续修正科学认识。", ["实验方案与变量设计", "设备协同与仪器数据分析", "现场验证与结果回流"]],
] as const;

function PublicHeader({ resource = false }: { resource?: boolean }) {
  return <header className={c("portal-header")}>
    <Link className={c("brand-lockup")} href="/"><Image src="/portal-original/ai4s-logo.png" alt="中国石油 ScienceLab · AI for Science 一体化科研平台" width={2060} height={430} priority /></Link>
    <nav className={c("portal-nav")} aria-label="门户导航">
      <Link className={!resource ? c("active") : ""} href="/">首页</Link>
      <Link className={resource ? c("active") : ""} href="/research-resources">科研资源</Link>
      <Link href="/#activities">科研社区</Link><Link href="/#help">帮助中心</Link>
    </nav>
    <div className={c("portal-actions")}><Link className={c("btn","btn-ghost")} href="/workspace">登录</Link><Link className={c("btn","btn-primary")} href="/workspace">进入科研工作台 <ArrowRight size={16} /></Link></div>
  </header>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return <div className={c("section-heading")}><div><div className={c("eyebrow")}>{eyebrow}</div><h2>{title}</h2></div>{description && <p>{description}</p>}</div>;
}

function ScienceVisual() {
  return <div className={c("ai-science-visual")} aria-label="科研中枢连接知识、计算与实验的数字孪生场景">
    <div className={c("ai-visual-grid")} />
    <header><span>SCIENCE NEXUS / DIGITAL TWIN</span><b><i />智能推演中</b></header>
    <div className={c("ai-source-stack")}>{[[BookOpen,"知识证据","论文 · 专利 · 标准"],[Database,"科研数据","地震 · 测井 · 实验"],[BrainCircuit,"专业能力","模型 · 工具 · Skill"]].map(([Icon,name,desc]) => { const Glyph = Icon as LucideIcon; return <div key={String(name)}><span><Glyph size={16} /></span><p><b>{String(name)}</b><small>{String(desc)}</small></p></div>; })}</div>
    <div className={c("ai-data-beam","beam-in")}><i /><i /><i /></div>
    <div className={c("ai-nexus-core")}><div className={c("nexus-ring","ring-one")} /><div className={c("nexus-ring","ring-two")} /><div className={c("nexus-ring","ring-three")} /><div className={c("nexus-center")}><span><Sparkles size={16} /></span><b>科研中枢</b><small>模型理解 · 智能体规划</small></div><i className={c("nexus-dot","nd1")} /><i className={c("nexus-dot","nd2")} /><i className={c("nexus-dot","nd3")} /></div>
    <div className={c("ai-data-beam","beam-out")}><i /><i /><i /></div>
    <div className={c("digital-twin-field")}><div className={c("twin-head")}><span>MULTI-SCALE TWIN</span><b>多尺度科学模型</b></div><div className={c("strata-model")}><i /><i /><i /><i /><span className={c("well-path")} /><span className={c("well-point")} /></div><div className={c("molecule-model")}><i /><i /><i /><i /><i /><span /><span /><span /></div><div className={c("model-readout")}><span>储层预测 <b>0.87</b></span><span>候选方案 <b>12</b></span></div></div>
    <div className={c("research-loop")}><span>读</span><i>→</i><span>算</span><i>→</i><span>做</span><i>↻</i><small>实验与现场反馈</small></div>
    <div className={c("agent-status")}><i><Sparkles size={16} /></i><span><strong>科研中枢智能体</strong><small>正在生成可验证的研究路径</small></span><b>运行中</b></div>
  </div>;
}

function PublicFooter({ resource = false }: { resource?: boolean }) {
  return <footer className={c("portal-footer")}><Image src="/portal-original/ai4s-logo.png" alt="中国石油 ScienceLab" width={2060} height={430} /><span>{resource ? "集团统一科研资源中心 · 可公开浏览" : "面向油气全产业链，贯通知识、计算、实验与现场验证。"}</span><span>{resource ? "使用权限由资源授权与课题边界共同决定" : "数据安全 · 引用可追溯 · 权限与合规"}</span></footer>;
}

export function PortalHomeReference() {
  const [hotCategory, setHotCategory] = useState("知识");
  const [selectedCase, setSelectedCase] = useState<(typeof cases)[number] | null>(null);
  return <div className={c("portal","portal-v2")}><PublicHeader /><main className={c("portal-main")}>
    <section className={c("portal-hero","portal-ai-hero")} id="top">
      <div className={c("hero-copy")}><div className={c("eyebrow")}>中国石油 ScienceLab · AI for Science 一体化科研平台</div><h1>用 AI 加速科学发现，<span>让复杂问题走向确定答案</span></h1><p>AI4S 平台面向勘探开发、油气工程、炼化化工、新材料与新能源科研，统一汇聚知识、数据、模型、工具、技能、工作流和实验设施，贯通问题提出、智能研究、计算模拟、实验验证与科研资产沉淀。</p><div className={c("hero-actions")}><Link className={c("btn","btn-primary")} href="/workspace">描述科研问题 <ArrowRight size={16} /></Link><a className={c("btn","hero-secondary")} href="#help">新手上路</a></div><div className={c("platform-value-line")}><span>统一科研入口</span><i /><span>资源开放共享</span><i /><span>AI 原生研究</span><i /><span>过程全程可追溯</span></div></div>
      <ScienceVisual />
    </section>
    <div className={c("research-domain-strip")}><div className={c("matrix-label","domain")}><small>AI+ PETROLEUM R&amp;D</small><strong>科研场景</strong></div>{[["勘探开发","储层预测 · 油藏模拟"],["油气工程","钻完井 · 压裂优化"],["炼化化工","催化剂 · 工艺优化"],["新材料新能源","高分子 · 氢能 · CCUS"]].map(([title,copy])=><div className={c("matrix-cell","domain")} key={title}><b>{title}</b><small>{copy}</small></div>)}</div>
    <section className={c("section","capability-section")} id="capabilities"><SectionHeading eyebrow="END-TO-END AI RESEARCH" title="科研全流程贯通：从问题提出到成果沉淀" description="资源中心提供知识与专业能力，科研中枢理解问题并组织任务，工作台承接个人研究，课题空间支撑协作与资产沉淀。" /><div className={c("capability-path")}><span>科学问题</span><i>→</i><span>读</span><i>→</i><span>算</span><i>→</i><span>做</span><i>→</i><span>科研资产</span></div><div className={c("capability-grid","capability-map")}>{processColumns.map(([title,description,items],index)=><article className={c("capability-column")} key={title}><span className={c("num")}>0{index+1}</span><h3>{title}</h3><p>{description}</p><ul className={c("plain-list")}>{items.map(item=><li key={item}>{item}</li>)}</ul><Link className={c("link")} href="/workspace">从这里开始 →</Link></article>)}</div></section>
    <section className={c("section","alt")} id="resources"><SectionHeading eyebrow="POPULAR RESEARCH RESOURCES" title="热门科研资源" description="按照科研资源类目快速发现内容；科研中枢智能体可理解资源能力边界，并按研究计划完成组合调用。" /><div className={c("hot-resource-shell")}><nav className={c("hot-resource-nav")} aria-label="热门资源分类">{Object.keys(hotResources).map(name=>{const Icon=iconByType[name];return <button className={name===hotCategory?c("active"):""} key={name} onClick={()=>setHotCategory(name)}><span><Icon size={17}/></span><b>{name}</b><small>{hotResources[name].length} 类热门能力</small></button>})}</nav><div className={c("hot-resource-content")}><header><div><strong>{hotCategory}</strong><span>面向科研任务可直接发现、了解并申请使用</span></div><Link className={c("link")} href="/research-resources">查看全部 {hotCategory} →</Link></header><div className={c("hot-resource-matrix")}>{hotResources[hotCategory].map(([type,name,description,tags])=>{const Icon=iconByType[hotCategory];return <article className={c("cloud-resource-card")} key={name}><div className={c("cloud-resource-head")}><span className={c("cloud-cube")}><Icon size={17}/></span><div><h3>{name}</h3><small>{type}</small></div><em>公开</em></div><p>{description}</p><div className={c("cloud-tags")}>{tags.map(tag=><span key={tag}>{tag}</span>)}</div><footer><span>ScienceLab 科研资源</span><Link className={c("link")} href="/research-resources">查看详情 →</Link></footer></article>})}</div></div></div></section>
    <section className={c("section")} id="cases"><SectionHeading eyebrow="AI-ASSISTED OUTCOMES" title="AI 协同科研成果案例" description="展示 AI 如何参与问题分解、证据组织、模型计算与验证设计，并由科研人员完成关键判断。" /><div className={c("case-grid")}>{cases.map(([domain,title,question,ai,asset,img],index)=><article className={c("case-card")} key={title}><div className={c("case-visual")} style={{backgroundImage:`linear-gradient(180deg,rgba(5,30,67,.05),rgba(5,30,67,.72)),url('/portal-original/${img}')`}}><span>0{index+1}</span><small>{domain}</small></div><div className={c("case-body")}><h3>{title}</h3><dl><div><dt>科学问题</dt><dd>{question}</dd></div><div><dt>AI 参与</dt><dd>{ai}</dd></div><div><dt>沉淀资产</dt><dd>{asset}</dd></div></dl><button className={c("link")} onClick={()=>setSelectedCase(cases[index])}>公开查看案例路径 →</button></div></article>)}</div></section>
    <section className={c("section","alt")} id="activities"><SectionHeading eyebrow="AI RESEARCH COMMUNITY" title="平台动态与 AI 科研活动" description="了解 AI 能力更新、资源上新、专题交流与科研培训，让 AI 真正进入日常科研流程。" /><div className={c("activity-layout")}><article className={c("activity-feature")}><span className={c("activity-label")}>专题活动</span><h2>材料与催化 AI for Science 专题交流</h2><p>围绕文献证据、分子计算、配方筛选与实验验证，分享“读—算—做”一体化实践路径。</p><Link className={c("btn","btn-primary")} href="/workspace">了解活动 <ArrowRight size={16}/></Link></article><div className={c("activity-list")}>{[["培训课程","《AI for Science 科研工作流入门》","帮助科研人员从描述问题到创建课题、调用资源并沉淀成果。"],["资源更新","油气专业标准与科研数据资源更新","新增专业标准、历史成果和经过治理的数据资源。"],["平台更新","课题空间资产血缘能力上线","科研产物可追溯到输入数据、模型版本、计算环境与确认人。"]].map(([type,title,copy])=><article key={title}><span>{type}</span><div><h3>{title}</h3><p>{copy}</p></div><Link className={c("link")} href="/workspace">查看 →</Link></article>)}</div></div></section>
    <section className={c("portal-help")} id="help"><div><strong>第一次使用 ScienceLab？</strong><span>从提出科研问题开始，三步建立一条可追溯研究链路。</span></div><Link className={c("btn")} href="/workspace">查看新手上路</Link></section>
  </main><PublicFooter />{selectedCase&&<div className={s.detailOverlay} role="presentation" onClick={()=>setSelectedCase(null)}><section role="dialog" aria-modal="true" aria-label={selectedCase[1]} onClick={event=>event.stopPropagation()}><button aria-label="关闭案例" onClick={()=>setSelectedCase(null)}><X size={20}/></button><span>{selectedCase[0]}</span><h2>{selectedCase[1]}</h2><p><b>科学问题：</b>{selectedCase[2]}</p><p><b>AI 参与：</b>{selectedCase[3]}</p><p><b>沉淀资产：</b>{selectedCase[4]}</p><Link href="/workspace">从科研工作台开始 <ArrowRight size={16}/></Link></section></div>}</div>;
}

function appliedSource(item: Resource) { return item[0] === "数据" && /组织|课题/.test(item[5]); }

function scienceDomain(text: string) {
  if (/合成生物|生物制造/.test(text)) return "合成生物学";
  if (/材料|炼化|实验资源|新材料/.test(text)) return "材料科学";
  if (/油气|勘探|地质|开发/.test(text)) return "地球科学";
  return "全部领域";
}

export function ResearchResourceCenterReference() {
  const [type,setType]=useState("全部");
  const [stage,setStage]=useState("全部");
  const [domain,setDomain]=useState("全部领域");
  const [access,setAccess]=useState("全部");
  const [source,setSource]=useState("全部");
  const [updated,setUpdated]=useState("全部");
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<Resource|null>(null);
  const visible=useMemo(()=>catalog.filter(item=>{
    const [kind,stages,subtype,title,description,discipline]=item;
    const itemAccess=kind==="实验设施"||/组织|课题/.test(discipline)?"申请":"公开";
    return (type==="全部"||kind===type)&&(stage==="全部"||stages.includes(stage))&&(domain==="全部领域"||scienceDomain(discipline)===domain)&&(access==="全部"||itemAccess===access)&&(source==="全部"||(source==="组织共享")===appliedSource(item))&&(updated==="全部"||catalog.indexOf(item)<12)&&(`${subtype} ${title} ${description} ${discipline}`.toLowerCase().includes(query.trim().toLowerCase()));
  }),[type,stage,domain,access,source,updated,query]);
  return <div className={c("portal","public-resource-page")}><PublicHeader resource /><main>
    <section className={c("public-resource-hero")}><div className={c("resource-hero-top")}><div><div className={c("eyebrow")}>AI RESEARCH COMMONS</div><h1>科研资源中心</h1></div><p>统一发现知识、数据、模型、工具、实验设施、技能、工作流和 Agent，并按科研阶段快速筛选。</p></div><div className={c("resource-hero-bottom")}><label className={c("public-search")}><Search size={18}/><input aria-label="搜索科研资源" placeholder="搜索资源名称、科研问题、专业领域或 AI 能力" value={query} onChange={event=>setQuery(event.target.value)}/></label><div className={c("resource-metrics")}>{[["11,620","资源总量"],["8,426","科研知识"],["2,186","科研数据"],["326","科学模型"],["148","科学工具"],["96","实验设备"],["214","科研技能"]].map(([number,label])=><span key={label}><b>{number}</b><small>{label}</small></span>)}</div></div></section>
    <section className={c("resource-discovery")}><div className={c("resource-browser-shell")}><nav className={c("resource-type-nav")} aria-label="科研资源类别">{resourceTypes.map(([key,label,description])=>{const Icon=iconByType[key];return <button key={key} type="button" className={c("resource-type-tab",...(type===key?["active"]:[]))} onClick={()=>setType(key)} aria-pressed={type===key}><span><Icon size={17}/></span><div><b>{label}</b><small>{description}</small></div><i>{key==="全部"?catalog.length:catalog.filter(item=>item[0]===key).length}</i></button>})}</nav><div className={c("resource-type-content")}><div className={c("resource-filter-stack")}><div className={c("task-stage-filter")}><div><span>科研阶段</span>{["全部","读","算","做"].map(value=><button className={stage===value?c("active"):""} key={value} onClick={()=>setStage(value)}>{value}</button>)}</div><div className={c("science-domain-tabs")}><span>科学领域</span>{["全部领域","地球科学","材料科学","合成生物学"].map(value=><button className={domain===value?c("active"):""} key={value} onClick={()=>setDomain(value)}>{value}</button>)}</div></div><div className={c("facet-filter-panel")}><div className={c("facet-filter-title")}><span><SlidersHorizontal size={15}/>专业筛选</span><small><b>{type==="全部"?"全部资源":type}</b> · {visible.length} 项资源</small></div><div className={c("facet-controls")}><label><span>共享方式</span><select aria-label="共享方式" value={access} onChange={event=>setAccess(event.target.value)}><option>全部</option><option>公开</option><option>申请</option></select></label><label><span>资源来源</span><select aria-label="资源来源" value={source} onChange={event=>setSource(event.target.value)}><option>全部</option><option>平台资源</option><option>组织共享</option></select></label><label><span>更新时间</span><select aria-label="更新时间" value={updated} onChange={event=>setUpdated(event.target.value)}><option>全部</option><option>最近更新</option></select></label><button className={c("facet-reset")} onClick={()=>{setType("全部");setStage("全部");setDomain("全部领域");setAccess("全部");setSource("全部");setUpdated("全部");setQuery("");}}>重置</button></div></div></div><div className={c("public-resource-grid")}>{visible.map(item=>{const [kind,stages,subtype,title,description,discipline]=item;const Icon=iconByType[kind]??Boxes;const applied=kind==="实验设施"||/组织|课题/.test(discipline);const index=catalog.indexOf(item);const views=426+((index+1)*173)%1800;return <article className={c("public-resource-card")} key={title}><header><span className={c("resource-card-icon")}><Icon size={17}/></span><span>{subtype}</span><em className={c("resource-access",applied?"apply":"open")}>{applied?"申请":"公开"}</em></header><h3>{title}</h3><p>{description}</p><div className={c("resource-stage-tags")}><small>{scienceDomain(discipline)==="全部领域"?discipline:`${scienceDomain(discipline)} · ${discipline}`}</small>{stages.map(value=><span key={value}>{value}</span>)}</div><div className={c("resource-shared-info")}><span><i><Users size={15}/></i><span><small>提供方</small><b>{resourceProviders[kind]}</b></span></span><span><i><Share2 size={15}/></i><span><small>共享方式</small><b>{applied?"申请使用":"全员公开"}</b></span></span></div><footer><span><span><Eye size={14}/>{views.toLocaleString()}</span><i/><span><PlayCircle size={14}/>{Math.max(18,Math.round(views/6))}</span></span><button className={c("link")} onClick={()=>setSelected(item)}>查看详情 →</button></footer></article>})}</div>{visible.length===0&&<div className={c("empty")}>没有符合当前条件的资源，请调整搜索或筛选。</div>}</div></div></section>
    <section className={c("public-login-note")}><div><div className={c("eyebrow")}>FROM DISCOVERY TO ACTION</div><h2>浏览保持开放，执行进入可信工作环境</h2><p>查看资源介绍无需登录；申请受限数据、提交计算、预约实验设备或把资源加入课题时，需要进入科研工作台。</p></div><Link className={c("btn","btn-primary")} href="/workspace">登录并进入科研工作台 <ArrowRight size={16}/></Link></section>
  </main><PublicFooter resource />{selected&&<div className={s.detailOverlay} role="presentation" onClick={()=>setSelected(null)}><section role="dialog" aria-modal="true" aria-label={selected[3]} onClick={event=>event.stopPropagation()}><button aria-label="关闭详情" onClick={()=>setSelected(null)}><X size={20}/></button><span>{selected[2]}</span><h2>{selected[3]}</h2><p>{selected[4]}</p><p>科研阶段：{selected[1].join(" · ")}　专业领域：{selected[5]}</p><Link href="/workspace">进入科研工作台 <ArrowRight size={16}/></Link></section></div>}</div>;
}
