"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Box,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Database,
  FileText,
  Info,
  MoreHorizontal,
  Network,
  Plus,
  Search,
  Share2,
} from "lucide-react";
import { canEnter, now, uid } from "./domain";
import {
  assetsForResearchContext,
  researchAssetActions,
  researchSpaceState,
} from "./research-space-domain";
import { assetTypes, userName } from "./seed";
import { notify, useResearch } from "./store";
import type { Asset, AssetType, Space, State } from "./types";
import { Alert, Button, Details, Field, Modal } from "./ui";

const typeVisual: Record<
  AssetType,
  { Icon: typeof Bot; className: string; label: string }
> = {
  智能体: { Icon: Bot, className: "agent", label: "智能体" },
  Skill: { Icon: Network, className: "skill", label: "Skill" },
  模型: { Icon: Box, className: "model", label: "模型" },
  数据集: { Icon: Database, className: "dataset", label: "数据集" },
  方案模板: { Icon: FileText, className: "template", label: "方案模板" },
};

function lifecycleMeta(asset: Asset) {
  const lifecycle = researchSpaceState(asset).lifecycle;
  if (lifecycle === "DRAFT") return { label: "草稿", tone: "draft", Icon: CircleDot };
  if (lifecycle === "ARCHIVED") return { label: "已归档", tone: "archived", Icon: CircleDot };
  return { label: "有效", tone: "published", Icon: CheckCircle2 };
}

function publishingMeta(asset: Asset) {
  if (!["Skill", "模型"].includes(asset.type)) return { label: "不适用", tone: "neutral", Icon: CircleDot };
  if (/已发布|已上架/.test(asset.publishStatus)) return { label: `已上架 ${asset.version || ""}`.trim(), tone: "published", Icon: CheckCircle2 };
  if (/审核/.test(asset.publishStatus)) return { label: "已提交审核", tone: "review", Icon: Clock3 };
  if (/待上架/.test(asset.publishStatus)) return { label: "待上架", tone: "review", Icon: Clock3 };
  return { label: "未发布", tone: "unpublished", Icon: CircleDot };
}

function contextPath(contextId: string, suffix = "assets") {
  return `/research-spaces/${encodeURIComponent(contextId)}/${suffix}`;
}

type PublishDraft = {
  version: string;
  channel: string;
  visibility: string;
  displayName: string;
  description: string;
  notes: string;
};

export function ResearchAssetList({ state, context }: { state: State; context: Space }) {
  const { p, mutate } = useResearch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "mine" ? "mine" : "project";
  const query = searchParams.get("q") ?? "";
  const activeType = searchParams.get("type") ?? "全部";
  const statusFilter = searchParams.get("status") ?? "全部状态";
  const rangeFilter = searchParams.get("range") ?? (view === "mine" ? "全部发布" : "全部归属");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const size = [10, 20, 50].includes(Number(searchParams.get("size"))) ? Number(searchParams.get("size")) : 10;
  const [searchDraft, setSearchDraft] = useState(query);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [createMenu, setCreateMenu] = useState(searchParams.get("create") === "1");
  const [rowMenu, setRowMenu] = useState("");
  const [publishAsset, setPublishAsset] = useState<Asset | null>(null);
  const [publishStep, setPublishStep] = useState(1);
  const [publishDraft, setPublishDraft] = useState<PublishDraft>({ version: "", channel: "", visibility: "当前租户", displayName: "", description: "", notes: "" });

  useEffect(() => setSearchDraft(query), [query]);
  useEffect(() => {
    const requestedId = searchParams.get("publish");
    if (!requestedId) return;
    const asset = state.assets.find((item) => item.id === requestedId);
    if (!asset) return;
    setPublishAsset(asset);
    setPublishStep(1);
    setPublishDraft({ version: asset.version, channel: asset.type === "Skill" ? "科研技能广场" : "科研模型广场", visibility: "当前租户", displayName: asset.name, description: asset.description, notes: "" });
  }, [searchParams, state.assets]);

  const contextAssets = useMemo(
    () => assetsForResearchContext(state, p, context.id),
    [context.id, p, state],
  );
  const scopedAssets = useMemo(
    () => view === "mine" ? state.assets.filter((asset) => asset.ownerId === p.id && canEnter(state, p, asset.spaceId)) : contextAssets,
    [contextAssets, p, state, view],
  );
  const counts = useMemo(
    () => Object.fromEntries(["全部", ...assetTypes].map((item) => [item, item === "全部" ? scopedAssets.length : scopedAssets.filter((asset) => asset.type === item).length])),
    [scopedAssets],
  );
  const filtered = scopedAssets
    .filter((asset) => {
      const lifecycle = lifecycleMeta(asset).label;
      const publishing = publishingMeta(asset).label;
      const assetSpace = state.spaces.find((item) => item.id === asset.spaceId);
      const rangeMatches = view === "mine"
        ? rangeFilter === "全部发布" || publishing.startsWith(rangeFilter)
        : rangeFilter === "全部归属" ||
          (rangeFilter === "当前空间" && asset.spaceId === context.id) ||
          (rangeFilter === "项目空间" && assetSpace?.type === "PROJECT") ||
          (rangeFilter === "课题空间" && assetSpace?.type === "TOPIC") ||
          (rangeFilter === "共享进入" && asset.spaceId !== context.id);
      return (
        (activeType === "全部" || asset.type === activeType) &&
        (statusFilter === "全部状态" || lifecycle === statusFilter) &&
        rangeMatches &&
        (!query || `${asset.name} ${asset.description} ${userName(asset.ownerId)}`.toLowerCase().includes(query.toLowerCase()))
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * size, currentPage * size);
  const allSelected = rows.length > 0 && rows.every((asset) => selectedIds.includes(asset.id));
  const canCreate = context.status === "ACTIVE" && canEnter(state, p, context.id);

  function update(values: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!("page" in values)) next.delete("page");
    router.replace(`${pathname}${next.toString() ? `?${next}` : ""}`);
  }

  function changeView(nextView: "project" | "mine") {
    update({ view: nextView === "mine" ? "mine" : "", type: "", status: "", range: "", page: "1" });
    setSelectedIds([]);
  }

  function openPublish(asset: Asset) {
    setPublishAsset(asset);
    setPublishStep(1);
    setPublishDraft({
      version: asset.version,
      channel: asset.type === "Skill" ? "科研技能广场" : "科研模型广场",
      visibility: "当前租户",
      displayName: asset.name,
      description: asset.description,
      notes: "",
    });
  }

  function submitPublish() {
    if (!publishAsset) return;
    const assetId = publishAsset.id;
    const ok = mutate("已提交发布申请", assetId, (draft, actor) => {
      const item = draft.assets.find((asset) => asset.id === assetId);
      if (!item) throw new Error("资产不存在或已失效。");
      if (!researchAssetActions(draft, actor, item.spaceId, item).includes("publish.submit")) throw new Error("当前版本或来源状态不允许发布。");
      item.publishStatus = "审核中";
      item.updatedAt = now();
      draft.requests.unshift({ id: uid("publish"), objectId: item.id, userId: actor.id, purpose: publishDraft.notes.trim() || `发布${item.type} ${publishDraft.version}`, status: "待审核", kind: "PUBLICATION", targetVersion: publishDraft.version, createdAt: now() });
    });
    if (ok) {
      setPublishAsset(null);
      setPublishStep(1);
    }
  }

  const publishFooter = publishAsset ? <>
    <Button onClick={() => setPublishAsset(null)}>取消</Button>
    {publishStep > 1 && <Button onClick={() => setPublishStep((step) => step - 1)}>上一步</Button>}
    {publishStep < 3 ? <Button primary onClick={() => setPublishStep((step) => step + 1)}>下一步</Button> : <Button primary onClick={submitPublish}>确认提交</Button>}
  </> : undefined;

  return (
    <div className="rs-reference-list rs-assets-blue">
      <div className="rs-asset-scope-tabs" role="tablist" aria-label="科研资产范围">
        <button type="button" role="tab" aria-selected={view === "project"} className={view === "project" ? "selected" : ""} onClick={() => changeView("project")}>项目资产</button>
        <button type="button" role="tab" aria-selected={view === "mine"} className={view === "mine" ? "selected" : ""} onClick={() => changeView("mine")}>我的资产</button>
      </div>

      <div className="rs-assets-controlbar">
        <div className="rs-category-tabs" role="tablist" aria-label="科研资产类型">
          {["全部", ...assetTypes].map((item) => (
            <button type="button" role="tab" aria-selected={activeType === item} className={`rs-category-tab ${activeType === item ? "selected" : ""}`} key={item} onClick={() => update({ type: item === "全部" ? "" : item })}>
              {item} <span>({counts[item] ?? 0})</span>
            </button>
          ))}
        </div>
        <div className="rs-list-actions">
          <form className="rs-asset-search" onSubmit={(event) => { event.preventDefault(); update({ q: searchDraft.trim() }); }}>
            <Search size={18} />
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="搜索资产名称、描述、创建人…" aria-label="搜索科研资产" />
          </form>
          <select className="rs-inline-filter" aria-label="资产状态" value={statusFilter} onChange={(event) => update({ status: event.target.value === "全部状态" ? "" : event.target.value })}>
            <option>全部状态</option><option>有效</option><option>草稿</option><option>已归档</option>
          </select>
          {view === "project" ? (
            <select className="rs-inline-filter" aria-label="归属范围" value={rangeFilter} onChange={(event) => update({ range: event.target.value === "全部归属" ? "" : event.target.value })}>
              <option>全部归属</option><option>当前空间</option><option>项目空间</option><option>课题空间</option><option>共享进入</option>
            </select>
          ) : (
            <select className="rs-inline-filter" aria-label="发布情况" value={rangeFilter} onChange={(event) => update({ range: event.target.value === "全部发布" ? "" : event.target.value })}>
              <option>全部发布</option><option>未发布</option><option>已提交审核</option><option>已上架</option><option>不适用</option>
            </select>
          )}
          {canCreate && (
            <div className="rs-create-wrap">
              <button type="button" className="rs-create-trigger" onClick={() => setCreateMenu((value) => !value)} aria-expanded={createMenu}>
                <Plus size={18} /> 新建 <ChevronDown size={16} />
              </button>
              {createMenu && (
                <div className="rs-create-dropdown">
                  {assetTypes.map((item) => {
                    const { Icon, className } = typeVisual[item];
                    return <button type="button" key={item} aria-disabled="true"><span className={`rs-menu-icon ${className}`}><Icon size={18} /></span>新建{item}</button>;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rs-assets-table-wrap">
        <table className={`rs-assets-table ${view === "mine" ? "mine" : "project"}`}>
          <thead>
            {view === "project" ? (
              <tr><th className="select"><input type="checkbox" aria-label="选择本页全部资产" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...rows.map((asset) => asset.id)])] : selectedIds.filter((id) => !rows.some((asset) => asset.id === id)))} /></th><th>名称</th><th>类型</th><th>实际归属</th><th>版本</th><th>状态</th><th>创建人</th><th>更新时间</th><th className="operation">操作</th></tr>
            ) : (
              <tr><th className="select"><input type="checkbox" aria-label="选择本页全部资产" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...rows.map((asset) => asset.id)])] : selectedIds.filter((id) => !rows.some((asset) => asset.id === id)))} /></th><th>名称</th><th>类型</th><th>版本</th><th>状态</th><th>发布情况</th><th>创建时间</th><th className="operation">操作</th></tr>
            )}
          </thead>
          <tbody>
            {rows.map((asset) => {
              const visual = typeVisual[asset.type];
              const lifecycle = lifecycleMeta(asset);
              const publish = publishingMeta(asset);
              const assetContextId = view === "mine" ? asset.spaceId : context.id;
              const canPublish = researchAssetActions(state, p, assetContextId, asset).includes("publish.submit") && !/审核/.test(asset.publishStatus);
              return (
                <tr key={asset.id}>
                  <td className="select"><input type="checkbox" aria-label={`选择${asset.name}`} checked={selectedIds.includes(asset.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, asset.id] : selectedIds.filter((id) => id !== asset.id))} /></td>
                  <td><div className="rs-asset-name-cell"><span className={`rs-type-icon ${visual.className}`}><visual.Icon size={23} /></span><Link href={`${contextPath(assetContextId)}/${encodeURIComponent(asset.id)}?tab=overview`}><strong>{asset.name}</strong><small>{asset.description}</small></Link></div></td>
                  <td><span className={`rs-type-badge ${visual.className}`}>{visual.label}</span></td>
                  {view === "project" ? <>
                    <td><span className="rs-space-name">{state.spaces.find((item) => item.id === asset.spaceId)?.name ?? "个人空间"}</span></td>
                    <td className="version">{asset.version || "—"}</td>
                    <td><span className={`rs-status-pill ${lifecycle.tone}`}><lifecycle.Icon size={14} />{lifecycle.label}</span></td>
                    <td>{userName(asset.ownerId)}</td>
                    <td className="date">{asset.updatedAt.slice(0, 16).replace("T", " ")}</td>
                  </> : <>
                    <td className="version">{asset.version || "—"}</td>
                    <td><span className={`rs-status-pill ${lifecycle.tone}`}><lifecycle.Icon size={14} />{lifecycle.label}</span></td>
                    <td><span className={`rs-status-pill ${publish.tone}`}><publish.Icon size={14} />{publish.label}</span></td>
                    <td className="date">{asset.updatedAt.slice(0, 16).replace("T", " ")}</td>
                  </>}
                  <td className="operation">
                    <div className="rs-row-actions">
                      <Link href={`${contextPath(assetContextId)}/${encodeURIComponent(asset.id)}`}>查看</Link>
                      {view === "mine" && canPublish && <button type="button" onClick={() => openPublish(asset)}>{/已发布|已上架/.test(asset.publishStatus) ? "发布新版" : "发布"}</button>}
                      <button type="button" className="rs-more" aria-label={`${asset.name}更多操作`} onClick={() => setRowMenu(rowMenu === asset.id ? "" : asset.id)}><MoreHorizontal size={20} /></button>
                    </div>
                    {rowMenu === asset.id && <div className="rs-row-menu"><Link href={`${contextPath(assetContextId)}/${encodeURIComponent(asset.id)}`}>查看详情</Link><button type="button" onClick={() => { setRowMenu(""); notify(`已选择${asset.name}`); }}>选择资产</button></div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div className="rs-list-empty"><Database size={30} /><strong>没有符合条件的科研资产</strong><p>请调整搜索或筛选条件。</p><button type="button" onClick={() => router.replace(pathname)}>重置条件</button></div>}
      </div>

      <div className="rs-assets-note"><Info size={16} />{view === "mine" ? "我的资产展示当前用户拥有的资产；发布后仍保留在我的资产中。" : "项目资产展示当前项目、课题拥有及授权共享进入的资产；共享不改变实际归属。"}</div>
      <div className="rs-list-footer">
        <span>共 {filtered.length} 条</span>
        <div className="rs-page-controls">
          <button type="button" aria-label="上一页" disabled={currentPage <= 1} onClick={() => update({ page: String(currentPage - 1) })}><ChevronLeft size={17} /></button>
          {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map((item) => <button type="button" className={item === currentPage ? "selected" : ""} key={item} onClick={() => update({ page: String(item) })}>{item}</button>)}
          {pageCount > 6 && <><span>…</span><button type="button" onClick={() => update({ page: String(pageCount) })}>{pageCount}</button></>}
          <button type="button" aria-label="下一页" disabled={currentPage >= pageCount} onClick={() => update({ page: String(currentPage + 1) })}><ChevronRight size={17} /></button>
          <select aria-label="每页数量" value={size} onChange={(event) => update({ size: event.target.value, page: "1" })}><option value="10">10条/页</option><option value="20">20条/页</option><option value="50">50条/页</option></select>
          <label>跳至 <input aria-label="跳转页码" inputMode="numeric" defaultValue={currentPage} onKeyDown={(event) => { if (event.key === "Enter") update({ page: String(Math.min(pageCount, Math.max(1, Number(event.currentTarget.value) || 1))) }); }} /> 页</label>
        </div>
      </div>

      <Modal title="发布资产" open={!!publishAsset} onClose={() => setPublishAsset(null)} footer={publishFooter} wide>
        {publishAsset && <div className="rs-publish-flow">
          <div className="rs-publish-steps" aria-label="发布进度">
            {["基本信息", "发布内容", "确认提交"].map((label, index) => <div key={label} className={publishStep === index + 1 ? "current" : publishStep > index + 1 ? "done" : ""}><span>{index + 1}</span><strong>{label}</strong></div>)}
          </div>
          {publishStep === 1 ? <div className="rs-publish-grid">
            <div className="rs-publish-fields">
              <Field label="资产名称"><input value={publishAsset.name} readOnly /></Field>
              <Field label="资产类型"><span className={`rs-type-badge ${typeVisual[publishAsset.type].className}`}>{publishAsset.type}</span></Field>
              <Field label="版本选择" required><select value={publishDraft.version} onChange={(event) => setPublishDraft({ ...publishDraft, version: event.target.value })}>{publishAsset.versions.map((version) => <option value={version.number} key={version.id}>{version.number}（{version.at.slice(0, 10)}）</option>)}</select></Field>
              <Field label="发布渠道" required><select value={publishDraft.channel} onChange={(event) => setPublishDraft({ ...publishDraft, channel: event.target.value })}><option>科研技能广场</option><option>科研模型广场</option></select></Field>
              <Field label="可见范围" required><div className="rs-radio-row"><label><input type="radio" checked={publishDraft.visibility === "当前租户"} onChange={() => setPublishDraft({ ...publishDraft, visibility: "当前租户" })} />当前租户</label><label><input type="radio" checked={publishDraft.visibility === "全集团（需审核）"} onChange={() => setPublishDraft({ ...publishDraft, visibility: "全集团（需审核）" })} />全集团（需审核）</label></div></Field>
              <Field label="展示名称" required><input value={publishDraft.displayName} onChange={(event) => setPublishDraft({ ...publishDraft, displayName: event.target.value })} /></Field>
              <Field label="简介" required><textarea maxLength={200} value={publishDraft.description} onChange={(event) => setPublishDraft({ ...publishDraft, description: event.target.value })} /></Field>
              <Field label="标签"><div className="rs-publish-tags">{publishAsset.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></Field>
            </div>
            <aside className="rs-publish-notice"><h3>发布须知</h3><ul><li>发布后将在科研技能广场展示，供有权限的用户使用。</li><li>发布内容需符合相关管理规定，不得包含涉密信息。</li><li>提交后将进入审核流程，审核通过后自动上架。</li><li>发布后仍保留在“我的资产”中。</li></ul></aside>
          </div> : publishStep === 2 ? <div className="rs-publish-content"><Details values={{ 资产: publishDraft.displayName, 版本: publishDraft.version, 发布渠道: publishDraft.channel, 可见范围: publishDraft.visibility, 标签: publishAsset.tags.join("、") || "—" }} /><Field label="发布说明" required><textarea value={publishDraft.notes} onChange={(event) => setPublishDraft({ ...publishDraft, notes: event.target.value })} placeholder="请说明本次发布内容、适用场景和版本变化…" /></Field><Alert>发布内容将沿用当前版本的能力说明、输入输出约束与使用限制。</Alert></div> : <div className="rs-publish-confirm"><CheckCircle2 size={42} /><h3>确认提交发布申请</h3><p>提交后将进入审核流程；审核通过才会正式上架。</p><Details values={{ 资产名称: publishDraft.displayName, 资产类型: publishAsset.type, 发布版本: publishDraft.version, 发布渠道: publishDraft.channel, 可见范围: publishDraft.visibility }} /></div>}
        </div>}
      </Modal>
    </div>
  );
}
