"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Bookmark, ChevronRight, Clock3, FileText, Folder, Heart, Info, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { notify } from "./store";
import { type PersonalResource, type ResourceRelation } from "./my-resources-domain";
import styles from "./my-resources.module.css";

const tabs = ["概览", "能力组成", "版本管理", "使用指南", "相关资源"] as const;

export function ResourceDetail({ resource, relation, profileId, favorite, onBack, onFavorite, onUpdate, onEdit }: {
  resource: PersonalResource; relation: ResourceRelation; profileId: string; favorite: boolean;
  onBack: () => void; onFavorite: () => void; onUpdate: (resource: PersonalResource) => boolean; onEdit: () => void;
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]>("概览");
  const status = resource.creationStatus && relation === "我创建的" ? resource.creationStatus : resource.application && relation === "我的申请" ? resource.application.status : resource.access === "available" ? "可使用" : resource.application?.status ?? "需申请";
  const canApply = resource.access === "request" && !resource.creationStatus && (!resource.application || resource.application.status === "已驳回" || resource.application.status === "已过期");
  function apply() {
    if (onUpdate({ ...resource, application: { status: "审批中", appliedAt: new Date().toISOString().slice(0, 10), reason: "科研任务使用", userId: profileId } })) notify("申请已记录为审批中，演示页面不会自动授予权限。");
  }

  return <main className={styles.detailPage}>
    <button type="button" className={styles.back} onClick={onBack}><ArrowLeft size={16} /> 返回我的资源</button>
    <div className={styles.detailHero}><span className={styles.detailIcon}><Layers3 size={27} /></span><div className={styles.detailIntro}><div className={styles.detailHeading}><h1>{resource.name}</h1><span className={styles.status} data-status={status}>{status}</span></div><p>{resource.description}</p><div className={styles.detailMeta}><span><FileText size={14} /> 版本 {resource.version}</span><span><Folder size={14} /> {resource.scope}</span><span><Clock3 size={14} /> 更新于 {resource.updatedAt}</span></div></div><div className={styles.detailActions}>{resource.access === "available" && <Link className={styles.primary} href="/workspace">前往科研工作台</Link>}{canApply && <button type="button" className={styles.primary} onClick={apply}>申请使用权限</button>}{resource.creationStatus === "草稿" || resource.creationStatus === "已驳回" ? <button type="button" className={styles.primary} onClick={onEdit}>继续编辑</button> : null}<button type="button" className={styles.secondary} aria-pressed={favorite} onClick={onFavorite}><Heart size={16} fill={favorite ? "currentColor" : "none"} /> {favorite ? "已收藏" : "收藏"}</button></div></div>
    <nav className={styles.detailTabs} aria-label="资源详情内容">{tabs.map((item) => <button key={item} type="button" aria-current={tab === item ? "page" : undefined} className={tab === item ? styles.detailTabActive : ""} onClick={() => setTab(item)}>{item}</button>)}</nav>
    <div className={styles.detailColumns}><section className={styles.detailMain}>
      {tab === "概览" && <><h2>资源简介</h2><p>{resource.description}本资源用于相关课题的科研工作，使用前请确认所属空间和授权状态。</p><h2>适用场景</h2><div className={styles.tagRow}>{resource.tags.length ? resource.tags.map((tag) => <span key={tag}>{tag}</span>) : <span>科研协作</span>}</div><h2>使用与权限</h2><p>{resource.access === "available" ? "当前资源可用。前往科研工作台后，可在具体任务中按其支持的方式使用；此演示页不会自动启动资源。" : resource.application?.status === "审批中" ? "申请正在审核中。审核完成前不可直接使用此资源。" : "当前暂无使用权限，可提交申请并等待审核。"}</p></>}
      {tab === "能力组成" && <><h2>能力组成</h2><div className={styles.featureList}><div><Sparkles size={18} /><span><strong>核心能力</strong><small>{resource.description}</small></span></div><div><ShieldCheck size={18} /><span><strong>授权边界</strong><small>仅在有访问权限的科研空间与任务中使用。</small></span></div><div><Bookmark size={18} /><span><strong>资料与结果</strong><small>相关输入、输出及证据应由具体任务记录。</small></span></div></div></>}
      {tab === "版本管理" && <><h2>版本记录</h2><div className={styles.versionRow}><strong>{resource.version}</strong><span>当前版本</span><time>{resource.updatedAt}</time></div><p>演示数据仅提供当前版本。完整历史应从资源服务读取。</p></>}
      {tab === "使用指南" && <><h2>使用步骤</h2><ol className={styles.guide}><li>确认资源所属空间与当前权限。</li><li>在科研工作台选择课题或任务。</li><li>引用资源并检查输入、输出与证据。</li></ol><p>实验设施仍需按设备预约和安全管理流程使用。</p></>}
      {tab === "相关资源" && <><h2>相关资源</h2><p>使用上方标签在“我的资源”中继续筛选同类资源。</p><button className={styles.secondary} type="button" onClick={onBack}>返回资源列表 <ChevronRight size={14} /></button></>}
    </section><aside className={styles.detailAside}><h2>基本信息</h2><dl><div><dt>资源类型</dt><dd>{resource.type}</dd></div><div><dt>所属空间</dt><dd>{resource.scope}</dd></div><div><dt>创建归属</dt><dd>{resource.creationStatus ? "我创建的" : "共享资源"}</dd></div><div><dt>当前状态</dt><dd>{status}</dd></div><div><dt>更新时间</dt><dd>{resource.updatedAt}</dd></div></dl>{resource.application && <div className={styles.applicationBox}><h3><Info size={15} /> 申请记录</h3><p>状态：{resource.application.status}</p><p>申请时间：{resource.application.appliedAt}</p><p>申请原因：{resource.application.reason}</p></div>}</aside></div>
  </main>;
}
