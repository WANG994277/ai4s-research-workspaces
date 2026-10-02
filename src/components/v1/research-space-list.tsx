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
  Network,
  Plus,
  Search,
  X,
} from "lucide-react";
import { canEnter, now, uid } from "./domain";
import {
  assetsForResearchContext,
  researchAssetPublicationApprovalFlow,
  researchAssetDisplayActions,
  researchAssetDisplayStatus,
  researchAssetPublishChannel,
} from "./research-space-domain";
import type { ResearchAssetPublicationVisibility } from "./research-space-domain";
import { assetTypes, userName } from "./seed";
import { useResearch } from "./store";
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

function statusMeta(asset: Asset) {
  const label = researchAssetDisplayStatus(asset);
  if (label === "已发布") return { label, tone: "published", Icon: CheckCircle2 };
  if (label === "审核中") return { label, tone: "review", Icon: Clock3 };
  if (label === "待发布") return { label, tone: "pending", Icon: Clock3 };
  return { label, tone: "confirm", Icon: CircleDot };
}

function contextPath(contextId: string, suffix = "assets") {
  return `/research-spaces/${encodeURIComponent(contextId)}/${suffix}`;
}

type PublishDraft = {
  version: string;
  channel: string;
  visibility: ResearchAssetPublicationVisibility;
  displayName: string;
  description: string;
  notes: string;
  tags: string[];
  tagInput: string;
};

function TableFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const selected = options.find((option) => option.value === value);
  return (
    <details className={`rs-table-filter ${value ? "active" : ""}`}>
      <summary>{selected?.label ?? label}<ChevronDown size={14} /></summary>
      <div>
        {options.map((option) => (
          <button
            type="button"
            className={option.value === value ? "selected" : ""}
            key={option.value || "all"}
            onClick={(event) => {
              onChange(option.value);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export function ResearchAssetList({ state, context }: { state: State; context: Space }) {
  const { p, mutate } = useResearch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "mine" ? "mine" : "project";
  const query = searchParams.get("q") ?? "";
  const activeType = searchParams.get("type") ?? "全部";
  const statusFilter = searchParams.get("status") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const size = [10, 20, 50].includes(Number(searchParams.get("size"))) ? Number(searchParams.get("size")) : 10;
  const [searchDraft, setSearchDraft] = useState(query);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmingAsset, setConfirmingAsset] = useState<Asset | null>(null);
  const [publishAsset, setPublishAsset] = useState<Asset | null>(null);
  const [publishStep, setPublishStep] = useState(1);
  const [publishDraft, setPublishDraft] = useState<PublishDraft>({ version: "", channel: "", visibility: "项目空间", displayName: "", description: "", notes: "", tags: [], tagInput: "" });

  useEffect(() => setSearchDraft(query), [query]);
  useEffect(() => {
    const requestedId = searchParams.get("publish");
    if (!requestedId) return;
    const asset = state.assets.find((item) => item.id === requestedId);
    if (!asset) return;
    setPublishAsset(asset);
    setPublishStep(1);
    setPublishDraft({ version: asset.version, channel: researchAssetPublishChannel(asset.type), visibility: "项目空间", displayName: asset.name, description: asset.description, notes: "", tags: [...asset.tags], tagInput: "" });
  }, [searchParams, state.assets]);

  const contextAssets = useMemo(
    () => assetsForResearchContext(state, p, context.id),
    [context.id, p, state],
  );
  const scopedAssets = useMemo(
    () => view === "mine" ? state.assets.filter((asset) => asset.ownerId === p.id && canEnter(state, p, asset.spaceId)) : contextAssets,
    [contextAssets, p, state, view],
  );
  const filtered = scopedAssets
    .filter((asset) => {
      const status = researchAssetDisplayStatus(asset);
      return (
        (activeType === "全部" || asset.type === activeType) &&
        (!statusFilter || status === statusFilter) &&
        (!query || `${asset.name} ${asset.description} ${userName(asset.ownerId)}`.toLowerCase().includes(query.toLowerCase()))
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * size, currentPage * size);
  const allSelected = rows.length > 0 && rows.every((asset) => selectedIds.includes(asset.id));
  const listReturnTo = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;

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
    update({ view: nextView === "mine" ? "mine" : "", type: "", status: "", page: "1" });
    setSelectedIds([]);
  }

  function confirmAsset() {
    if (!confirmingAsset) return;
    const asset = confirmingAsset;
    mutate("已确认科研资产", asset.id, (draft) => {
      const item = draft.assets.find((candidate) => candidate.id === asset.id);
      if (!item) throw new Error("资产不存在或已失效。");
      item.lifecycle = "有效";
      item.publishStatus = "待发布";
      item.updatedAt = now();
    });
    setConfirmingAsset(null);
  }

  function openPublish(asset: Asset) {
    setPublishAsset(asset);
    setPublishStep(1);
    setPublishDraft({
      version: asset.version,
      channel: researchAssetPublishChannel(asset.type),
      visibility: "项目空间",
      displayName: asset.name,
      description: asset.description,
      notes: "",
      tags: [...asset.tags],
      tagInput: "",
    });
  }

  function addPublishTag() {
    const tag = publishDraft.tagInput.trim();
    if (!tag || publishDraft.tags.includes(tag) || publishDraft.tags.length >= 10) {
      setPublishDraft({ ...publishDraft, tagInput: "" });
      return;
    }
    setPublishDraft({ ...publishDraft, tags: [...publishDraft.tags, tag], tagInput: "" });
  }

  function removePublishTag(tag: string) {
    setPublishDraft({ ...publishDraft, tags: publishDraft.tags.filter((item) => item !== tag) });
  }

  function submitPublish() {
    if (!publishAsset) return;
    const assetId = publishAsset.id;
    const ok = mutate("已提交发布申请", assetId, (draft, actor) => {
      const item = draft.assets.find((asset) => asset.id === assetId);
      if (!item) throw new Error("资产不存在或已失效。");
      item.publishStatus = "审核中";
      item.tags = [...publishDraft.tags];
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
  const publicationApprovalFlow = publishAsset
    ? researchAssetPublicationApprovalFlow(state, publishAsset, publishDraft.visibility)
    : [];

  return (
    <div className="rs-reference-list rs-assets-blue">
      <header className="rs-assets-title">
        <h1>科研资产</h1>
        <p>查看和管理当前科研空间沉淀的数据集、模型、报告、方案及其他科研成果。</p>
      </header>
      <div className="rs-asset-scope-tabs" role="tablist" aria-label="科研资产范围">
        <button type="button" role="tab" aria-selected={view === "project"} className={view === "project" ? "selected" : ""} onClick={() => changeView("project")}>项目资产</button>
        <button type="button" role="tab" aria-selected={view === "mine"} className={view === "mine" ? "selected" : ""} onClick={() => changeView("mine")}>我的资产</button>
      </div>

      <div className="rs-assets-controlbar">
        <div className="rs-list-actions">
          <form className="rs-asset-search" onSubmit={(event) => { event.preventDefault(); update({ q: searchDraft.trim() }); }}>
            <Search size={18} />
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="搜索资产名称、描述、创建人…" aria-label="搜索科研资产" />
          </form>
          <button type="button" className="v-button primary" onClick={() => update({ q: searchDraft.trim() })}>搜索</button>
          <button type="button" className="v-button" onClick={() => { setSearchDraft(""); update({ q: "", type: "", status: "", page: "1" }); }}>重置</button>
        </div>
      </div>

      <div className="rs-assets-table-wrap">
        <table className={`rs-assets-table ${view === "mine" ? "mine" : "project"}`}>
          <thead>
            {view === "project" ? (
              <tr><th className="select"><input type="checkbox" aria-label="选择本页全部资产" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...rows.map((asset) => asset.id)])] : selectedIds.filter((id) => !rows.some((asset) => asset.id === id)))} /></th><th>名称</th><th><TableFilter label="类型" value={activeType === "全部" ? "" : activeType} options={[{ label: "全部类型", value: "" }, ...assetTypes.map((item) => ({ label: item, value: item }))]} onChange={(value) => update({ type: value })} /></th><th>实际归属</th><th>版本</th><th><TableFilter label="状态" value={statusFilter} options={[{ label: "全部状态", value: "" }, ...["待确认", "审核中", "待发布", "已发布"].map((item) => ({ label: item, value: item }))]} onChange={(value) => update({ status: value })} /></th><th>创建人</th><th>更新时间</th><th className="operation">操作</th></tr>
            ) : (
              <tr><th className="select"><input type="checkbox" aria-label="选择本页全部资产" checked={allSelected} onChange={(event) => setSelectedIds(event.target.checked ? [...new Set([...selectedIds, ...rows.map((asset) => asset.id)])] : selectedIds.filter((id) => !rows.some((asset) => asset.id === id)))} /></th><th>名称</th><th><TableFilter label="类型" value={activeType === "全部" ? "" : activeType} options={[{ label: "全部类型", value: "" }, ...assetTypes.map((item) => ({ label: item, value: item }))]} onChange={(value) => update({ type: value })} /></th><th>版本</th><th><TableFilter label="状态" value={statusFilter} options={[{ label: "全部状态", value: "" }, ...["待确认", "审核中", "待发布", "已发布"].map((item) => ({ label: item, value: item }))]} onChange={(value) => update({ status: value })} /></th><th>创建时间</th><th className="operation">操作</th></tr>
            )}
          </thead>
          <tbody>
            {rows.map((asset) => {
              const visual = typeVisual[asset.type];
              const status = statusMeta(asset);
              const assetContextId = view === "mine" ? asset.spaceId : context.id;
              const displayActions = researchAssetDisplayActions(status.label, view);
              return (
                <tr key={asset.id}>
                  <td className="select"><input type="checkbox" aria-label={`选择${asset.name}`} checked={selectedIds.includes(asset.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, asset.id] : selectedIds.filter((id) => id !== asset.id))} /></td>
                  <td><div className="rs-asset-name-cell"><span className={`rs-type-icon ${visual.className}`}><visual.Icon size={23} /></span><Link href={`${contextPath(assetContextId)}/${encodeURIComponent(asset.id)}?tab=overview&returnTo=${encodeURIComponent(listReturnTo)}`}><strong>{asset.name}</strong><small>{asset.description}</small></Link></div></td>
                  <td><span className={`rs-type-badge ${visual.className}`}>{visual.label}</span></td>
                  {view === "project" ? <>
                    <td><span className="rs-space-name">{state.spaces.find((item) => item.id === asset.spaceId)?.name ?? "个人空间"}</span></td>
                    <td className="version">{asset.version || "—"}</td>
                    <td><span className={`rs-status-pill ${status.tone}`}><status.Icon size={14} />{status.label}</span></td>
                    <td>{userName(asset.ownerId)}</td>
                    <td className="date">{asset.updatedAt.slice(0, 16).replace("T", " ")}</td>
                  </> : <>
                    <td className="version">{asset.version || "—"}</td>
                    <td><span className={`rs-status-pill ${status.tone}`}><status.Icon size={14} />{status.label}</span></td>
                    <td className="date">{asset.updatedAt.slice(0, 16).replace("T", " ")}</td>
                  </>}
                  <td className="operation">
                    <div className="rs-row-actions">
                      {displayActions.map((action) => action === "查看" ? (
                        <Link href={`${contextPath(assetContextId)}/${encodeURIComponent(asset.id)}?returnTo=${encodeURIComponent(listReturnTo)}`} key={action}>{action}</Link>
                      ) : (
                        <button type="button" key={action} onClick={() => action === "确认" ? setConfirmingAsset(asset) : openPublish(asset)}>{action}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <div className="rs-list-empty"><Database size={30} /><strong>没有符合条件的科研资产</strong><p>请调整搜索或筛选条件。</p><button type="button" onClick={() => router.replace(pathname)}>重置条件</button></div>}
      </div>

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

      <Modal
        title="确认科研资产"
        open={!!confirmingAsset}
        onClose={() => setConfirmingAsset(null)}
        footer={<><Button onClick={() => setConfirmingAsset(null)}>取消</Button><Button primary onClick={confirmAsset}>确认</Button></>}
      >
        <p>是否将当前资产转为待发布状态？</p>
      </Modal>

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
              <Field label="发布渠道" required><div className="rs-publish-channel">{publishDraft.channel}</div></Field>
              <Field label="可见范围" required><div className="rs-radio-row"><label><input type="radio" checked={publishDraft.visibility === "项目空间"} onChange={() => setPublishDraft({ ...publishDraft, visibility: "项目空间" })} />项目空间</label><label><input type="radio" checked={publishDraft.visibility === "集团资源中心"} onChange={() => setPublishDraft({ ...publishDraft, visibility: "集团资源中心" })} />集团资源中心</label></div></Field>
              <Field label="展示名称" required><input value={publishDraft.displayName} onChange={(event) => setPublishDraft({ ...publishDraft, displayName: event.target.value })} /></Field>
              <Field label="简介" required><textarea maxLength={200} value={publishDraft.description} onChange={(event) => setPublishDraft({ ...publishDraft, description: event.target.value })} /></Field>
              <Field label="标签"><div className="rs-publish-tag-editor"><div className="rs-publish-tags">{publishDraft.tags.map((tag) => <span key={tag}>{tag}<button type="button" aria-label={`删除标签${tag}`} onClick={() => removePublishTag(tag)}><X size={12} /></button></span>)}</div><div className="rs-publish-tag-input"><input maxLength={20} value={publishDraft.tagInput} onChange={(event) => setPublishDraft({ ...publishDraft, tagInput: event.target.value })} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addPublishTag(); } }} placeholder="输入标签" /><button type="button" onClick={addPublishTag} disabled={!publishDraft.tagInput.trim() || publishDraft.tags.length >= 10}><Plus size={14} />添加</button></div><small>最多 10 个标签，每个不超过 20 个字符。</small></div></Field>
            </div>
            <aside className="rs-publish-notice"><h3>发布须知</h3><ul><li>发布后将在“{publishDraft.channel}”展示。</li><li>{publishDraft.visibility === "项目空间" ? "仅当前项目及相关课题成员可见。" : "提交后进入集团审核流程，审核通过后面向有权限的集团用户展示。"}</li><li>发布内容需符合相关管理规定，不得包含涉密信息。</li><li>发布后仍保留在“我的资产”中。</li></ul></aside>
          </div> : publishStep === 2 ? <div className="rs-publish-content"><Details values={{ 资产: publishDraft.displayName, 版本: publishDraft.version, 发布渠道: publishDraft.channel, 可见范围: publishDraft.visibility, 标签: publishDraft.tags.join("、") || "—" }} /><Field label="发布说明" required><textarea value={publishDraft.notes} onChange={(event) => setPublishDraft({ ...publishDraft, notes: event.target.value })} placeholder="请说明本次发布内容、适用场景和版本变化…" /></Field><Alert>发布内容将沿用当前版本的能力说明、输入输出约束与使用限制。</Alert></div> : <div className="rs-publish-confirm"><CheckCircle2 size={42} /><h3>确认提交发布申请</h3><p>提交后将按以下顺序审批；全部通过后才会正式上架。</p><section className="rs-publish-approval" aria-label="发布审批流程"><h4>审批流程</h4><ol>{publicationApprovalFlow.map((node, index) => <li className={node.kind} key={`${node.role}-${node.name}`}><span className="rs-approval-index">{index + 1}</span><div><strong>{node.name}</strong><small>{node.role}</small></div><em>{node.status}</em></li>)}</ol></section><Details values={{ 资产名称: publishDraft.displayName, 资产类型: publishAsset.type, 发布版本: publishDraft.version, 发布渠道: publishDraft.channel, 可见范围: publishDraft.visibility, 标签: publishDraft.tags.join("、") || "—" }} /></div>}
        </div>}
      </Modal>
    </div>
  );
}
