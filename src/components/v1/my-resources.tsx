"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bot, BrainCircuit, Check, ChevronLeft, ChevronRight, CircleHelp, Database, FileText, FlaskConical, Folder, Heart, Layers3, LibraryBig, ListFilter, Plus, Search, Settings2, Sparkles, Workflow, Wrench, X, type LucideIcon } from "lucide-react";
import { useResearch, notify } from "./store";
import { canSaveResourceForProfile, filterPersonalResources, getPersonalResourceStats, initialFavoriteIds, personalizeResources, personalResourceSeed, personalResourceTypes, statusForRelation, type PersonalResource, type PersonalResourceType, type ResourceRelation } from "./my-resources-domain";
import { ResourceDetail } from "./my-resources-detail";
import { ResourcePublish } from "./my-resources-publish";
import styles from "./my-resources.module.css";

const relations: ResourceRelation[] = ["可用资源", "我创建的", "我的收藏", "我的申请"];
const iconByType: Record<PersonalResourceType, LucideIcon> = { 科研应用: LibraryBig, 智能体: Bot, Skill: Sparkles, 模型: BrainCircuit, 工具: Wrench, 数据集: Database, 知识: FileText, 实验设施: FlaskConical, 工作流: Workflow };
const pageSize = 6;
interface LocalResourceState { created: PersonalResource[]; favoriteIds: string[]; }
const initialLocalState: LocalResourceState = { created: [], favoriteIds: initialFavoriteIds };
const storageKey = (profileId: string) => `ai4s-my-resources-v1:${profileId}`;

function readLocalState(profileId: string): LocalResourceState {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(profileId)) ?? "null");
    if (!saved || !Array.isArray(saved.created) || !Array.isArray(saved.favoriteIds)) return { created: [], favoriteIds: profileId === "lin" ? initialFavoriteIds : [] };
    return {
      created: saved.created.filter((item: unknown): item is PersonalResource => Boolean(item && typeof item === "object" && "id" in item && "name" in item && "type" in item)).map((item: PersonalResource) => ({
        ...item,
        ...(item.creationStatus && !item.ownerId ? { ownerId: profileId } : {}),
        ...(item.application && !item.application.userId ? { application: { ...item.application, userId: profileId } } : {}),
      })),
      favoriteIds: saved.favoriteIds.filter((id: unknown): id is string => typeof id === "string"),
    };
  } catch {
    notify("本地资源记录无法读取，已显示演示数据。");
    return initialLocalState;
  }
}

function actionLabel(resource: PersonalResource, relation: ResourceRelation) {
  if (relation === "我创建的") return resource.creationStatus === "草稿" || resource.creationStatus === "已驳回" ? "继续编辑" : "查看";
  if (relation === "我的申请") return "查看申请";
  if (relation === "我的收藏") return "查看详情";
  return resource.type === "智能体" ? "发起任务" : resource.type === "工具" ? "启动工具" : resource.type === "科研应用" ? "打开应用" : "立即使用";
}

export function ResourceGlyph({ type }: { type: PersonalResourceType }) {
  const Icon = iconByType[type];
  return <span className={styles.glyph} data-type={type}><Icon size={19} strokeWidth={2.2} /></span>;
}

export function MyResources() {
  const { p, loaded } = useResearch();
  const [local, setLocal] = useState<LocalResourceState>(initialLocalState);
  const [hydratedProfile, setHydratedProfile] = useState("");
  const [relation, setRelation] = useState<ResourceRelation>("可用资源");
  const [type, setType] = useState<PersonalResourceType | "全部">("全部");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("全部空间");
  const [status, setStatus] = useState("全部状态");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [publish, setPublish] = useState(false);
  const [editing, setEditing] = useState<PersonalResource | null>(null);

  useEffect(() => {
    if (!loaded) return;
    setLocal(readLocalState(p.id));
    setHydratedProfile(p.id);
    setPublish(false);
    setEditing(null);
    setDetailId(null);
    setRelation("可用资源");
    setStatus("全部状态");
    setPage(1);
  }, [loaded, p.id]);

  const resources = useMemo(() => {
    const overrides = new Map(local.created.map((item) => [item.id, item]));
    return personalizeResources([...local.created.filter((item) => !personalResourceSeed.some((seed) => seed.id === item.id)), ...personalResourceSeed.map((item) => overrides.get(item.id) ?? item)], p.id);
  }, [local.created, p.id]);
  const favorites = useMemo(() => new Set(local.favoriteIds), [local.favoriteIds]);
  const stats = useMemo(() => getPersonalResourceStats(resources, favorites), [resources, favorites]);
  const scopes = useMemo(() => ["全部空间", ...new Set(resources.map((item) => item.scope))], [resources]);
  const statusOptions = relation === "我创建的" ? ["全部状态", "草稿", "审核中", "已发布", "已驳回"] : relation === "我的申请" ? ["全部状态", "审批中", "已通过", "已驳回", "已过期"] : relation === "可用资源" ? ["全部状态", "可使用"] : ["全部状态", "可使用", "需申请", "审批中", "已驳回", "已过期"];
  const visible = useMemo(() => filterPersonalResources(resources, favorites, { relation, type, query, scope, status }), [resources, favorites, relation, type, query, scope, status]);
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const detail = resources.find((item) => item.id === detailId) ?? null;

  function persist(next: LocalResourceState): boolean {
    if (hydratedProfile !== p.id) { notify("用户角色已切换，请在当前角色下重新操作。"); return false; }
    try {
      localStorage.setItem(storageKey(p.id), JSON.stringify(next));
      setLocal(next);
      return true;
    } catch {
      notify("浏览器无法保存本地演示记录，请检查浏览器存储权限后重试。");
      return false;
    }
  }
  function saveResource(item: PersonalResource): boolean {
    if (!canSaveResourceForProfile(p.id, hydratedProfile, item)) { notify("资源归属与当前用户不一致，未保存。"); return false; }
    return persist({ ...local, created: [item, ...local.created.filter((entry) => entry.id !== item.id)] });
  }
  function toggleFavorite(id: string) {
    if (persist({ ...local, favoriteIds: favorites.has(id) ? local.favoriteIds.filter((item) => item !== id) : [...local.favoriteIds, id] })) notify(favorites.has(id) ? "已取消收藏。" : "已加入我的收藏。");
  }
  function changeRelation(next: ResourceRelation) { setRelation(next); setStatus("全部状态"); setPage(1); setDetailId(null); }
  function openResource(item: PersonalResource) {
    if (relation === "我创建的" && (item.creationStatus === "草稿" || item.creationStatus === "已驳回")) { setEditing(item); setPublish(true); return; }
    setDetailId(item.id);
  }
  function finishPublish() { setPublish(false); setEditing(null); setRelation("我创建的"); setStatus("全部状态"); setType("全部"); setScope("全部空间"); setQuery(""); setPage(1); }

  if (publish) return <ResourcePublish initial={editing} profileId={p.id} onBack={() => setPublish(false)} onSave={saveResource} onFinish={finishPublish} />;
  if (detail) return <ResourceDetail resource={detail} relation={relation} profileId={p.id} favorite={favorites.has(detail.id)} onBack={() => setDetailId(null)} onFavorite={() => toggleFavorite(detail.id)} onUpdate={saveResource} onEdit={() => { setEditing(detail); setPublish(true); }} />;

  return <main className={styles.page}>
    <header className={styles.pageHeader}><div><p className={styles.eyebrow}>PERSONAL RESOURCE CENTER</p><h1>我的资源</h1><p>统一管理可使用、创建、收藏和申请的科研资源。</p></div><button className={styles.primary} onClick={() => { setEditing(null); setPublish(true); }}><Plus size={17} /> 新建资源</button></header>
    <p className={styles.demoNote}><CircleHelp size={14} /> 当前为前端演示数据，收藏、新建和申请状态保存在本机浏览器。</p>
    <section className={styles.stats} aria-label="资源概况">{([[Check, stats.available, "可用资源"], [FileText, stats.created, "我创建的"], [Heart, stats.favorites, "我的收藏"], [Layers3, stats.applications, "我的申请"]] as const).map(([Icon, count, label]) => <article key={label}><span className={styles.statIcon}><Icon size={19} /></span><div><strong>{count}</strong><span>{label}</span></div></article>)}</section>
    <div className={styles.toolbar}><label className={styles.search}><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索资源名称、关键词、所属课题或描述" aria-label="搜索我的资源" />{query && <button type="button" aria-label="清空搜索" onClick={() => { setQuery(""); setPage(1); }}><X size={15} /></button>}</label><button className={styles.filterButton} type="button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><ListFilter size={16} /> 筛选</button></div>
    {showFilters && <div className={styles.advancedFilters}><label>所属空间<select value={scope} onChange={(event) => { setScope(event.target.value); setPage(1); }}>{scopes.map((item) => <option key={item}>{item}</option>)}</select></label><label>资源状态<select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{statusOptions.map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" onClick={() => { setScope("全部空间"); setStatus("全部状态"); setPage(1); }}>重置筛选</button></div>}
    <nav className={styles.relations} aria-label="资源关系">{relations.map((item) => <button key={item} type="button" className={relation === item ? styles.activeRelation : ""} aria-current={relation === item ? "page" : undefined} onClick={() => changeRelation(item)}>{item}</button>)}</nav>
    <section className={styles.results}><div className={styles.typeBar}><span>资源类型</span>{["全部", ...personalResourceTypes].map((item) => <button type="button" key={item} className={type === item ? styles.activeType : ""} aria-pressed={type === item} onClick={() => { setType(item as PersonalResourceType | "全部"); setPage(1); }}>{item}</button>)}<small>{visible.length} 条结果</small></div>
      {rows.length ? relation === "可用资源" ? <div className={styles.grid}>{rows.map((item) => <article key={item.id} className={styles.card}><div className={styles.cardTop}><ResourceGlyph type={item.type} /><span className={styles.available}>可使用</span></div><span className={styles.kind}>{item.type}</span><h2>{item.name}</h2><p>{item.description}</p><div className={styles.cardMeta}><span><Folder size={13} /> {item.scope}</span><span>{item.version}</span></div><footer><span>更新于 {item.updatedAt}</span><button type="button" onClick={() => openResource(item)}>{actionLabel(item, relation)}</button></footer></article>)}</div>
        : <div className={styles.tableWrap}><table><thead><tr><th>名称</th><th>类型</th><th>所属空间</th><th>版本</th><th>状态</th><th>{relation === "我的申请" ? "申请时间" : "更新时间"}</th><th>操作</th></tr></thead><tbody>{rows.map((item) => <tr key={item.id}><td><span className={styles.tableName}><ResourceGlyph type={item.type} /><strong>{item.name}</strong></span></td><td>{item.type}</td><td>{item.scope}</td><td>{item.version}</td><td><span className={styles.status} data-status={statusForRelation(item, relation)}>{statusForRelation(item, relation)}</span></td><td>{relation === "我的申请" ? item.application?.appliedAt : item.updatedAt}</td><td><div className={styles.rowActions}><button type="button" onClick={() => openResource(item)}>{actionLabel(item, relation)}</button>{relation === "我的收藏" && <button type="button" onClick={() => toggleFavorite(item.id)}>取消收藏</button>}</div></td></tr>)}</tbody></table></div>
        : <div className={styles.empty}><Settings2 size={28} /><h2>没有符合条件的资源</h2><p>调整关键词、类型或筛选条件后重试。</p><button type="button" onClick={() => { setQuery(""); setType("全部"); setScope("全部空间"); setStatus("全部状态"); setPage(1); }}>清除筛选</button></div>}
      {rows.length > 0 && <div className={styles.pagination} aria-label="资源列表分页"><span>共 {visible.length} 条</span><button type="button" aria-label="上一页" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><b>{currentPage} / {pageCount}</b><button type="button" aria-label="下一页" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div>}
    </section>
    <Link className={styles.catalogLink} href="/research-resources">前往集团科研资源中心 <ChevronRight size={16} /></Link>
  </main>;
}
