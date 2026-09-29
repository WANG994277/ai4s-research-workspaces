"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderKanban,
  Info,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  UserRound,
} from "lucide-react";
import { canEnter, now, spaceLabels, uid } from "./domain";
import { profiles, userName } from "./seed";
import { notify, useResearch } from "./store";
import type { Membership, Space, State } from "./types";
import { Alert, Badge, Button, Details, Empty, Field, Modal, Table } from "./ui";

type ManageTab = { id: string; label: string };

const projectRoleLabel: Record<Membership["role"], string> = {
  "Space Admin": "项目负责人",
  "Topic Leader": "课题负责人",
  Member: "研究成员",
  "Asset Manager": "技术骨干",
  Viewer: "外部专家",
};

const spaceRoleLabel: Record<Membership["role"], string> = {
  "Space Admin": "空间管理员",
  "Topic Leader": "空间管理员",
  Member: "成员",
  "Asset Manager": "资产管理员",
  Viewer: "只读成员",
};

const dataScopeLabel: Record<Membership["role"], string> = {
  "Space Admin": "全部数据",
  "Topic Leader": "本课题及下属",
  Member: "本课题",
  "Asset Manager": "本课题及下属",
  Viewer: "指定资产",
};

function managePath(contextId: string, view: string) {
  return `/research-spaces/${encodeURIComponent(contextId)}/manage/${view}`;
}

function spaceTypeLabel(space: Space) {
  return space.type === "PROJECT" ? "项目空间" : space.type === "TOPIC" ? "课题空间" : "个人空间";
}

function statusForSpace(space: Space) {
  if (space.status === "ARCHIVED") return { label: "已归档", tone: "archived" };
  if (space.status === "SUSPENDED" || space.syncStatus === "待同步") return { label: "筹备中", tone: "pending" };
  if (space.status === "CLOSED") return { label: "已关闭", tone: "archived" };
  return { label: "运行中", tone: "active" };
}

function Avatar({ userId, name }: { userId: string; name: string }) {
  return <span className={`rs-member-avatar tone-${userId.length % 4}`} aria-label={`${name}头像`}><UserRound size={17} /></span>;
}

export function ResearchSpaceManagement({
  state,
  context,
  view,
  tabs,
}: {
  state: State;
  context: Space;
  view: string;
  tabs: ManageTab[];
}) {
  useEffect(() => {
    document.body.classList.add("rs-management-theme");
    return () => document.body.classList.remove("rs-management-theme");
  }, []);

  if (view === "spaces") return <SpaceDirectory state={state} context={context} />;
  if (view === "new") return <CreateSpace state={state} context={context} />;
  if (view === "members") return <SpaceMembers state={state} context={context} />;
  return <SpaceGovernance state={state} context={context} view={view} tabs={tabs} />;
}

function Breadcrumb({ current }: { current: string }) {
  return <div className="rs-space-breadcrumb"><Link href="/research-spaces/current/assets">科研空间</Link><span>/</span><strong>{current}</strong></div>;
}

function SpaceDirectory({ state, context }: { state: State; context: Space }) {
  const { p, mutate } = useResearch();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("全部空间类型");
  const [status, setStatus] = useState("全部状态");
  const [tenant, setTenant] = useState("全部租户");
  const [page, setPage] = useState(1);
  const size = 10;
  const candidates = useMemo(() => {
    if (p.roles.includes("admin")) return state.spaces;
    if (p.roles.includes("manager")) return state.spaces.filter((space) => space.type === "PERSONAL" ? space.ownerId === p.id : p.managementProjects.includes(space.projectId));
    return state.spaces.filter((space) => canEnter(state, p, space.id));
  }, [p, state]);
  const tenants = [...new Set(state.projects.map((project) => project.organization))];
  const filtered = candidates.filter((space) => {
    const project = state.projects.find((item) => item.id === space.projectId);
    const manager = userName(space.ownerId);
    const spaceStatus = statusForSpace(space).label;
    return (
      (!query || `${space.name} ${manager} ${project?.name ?? ""}`.includes(query)) &&
      (type === "全部空间类型" || spaceTypeLabel(space) === type) &&
      (status === "全部状态" || spaceStatus === status) &&
      (tenant === "全部租户" || project?.organization === tenant)
    );
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  const rows = filtered.slice((page - 1) * size, page * size);

  function enterSpace(space: Space) {
    mutate("已切换科研空间", space.id, (draft) => { draft.spaceId = space.id; });
    router.push(managePath(space.id, space.type === "PERSONAL" ? "basic" : "members"));
  }

  return (
    <div className="rs-space-directory">
      <Breadcrumb current="空间管理" />
      <header className="rs-space-page-title"><h1>空间管理</h1><p>集中查看与管理平台内全部科研空间。</p></header>
      <section className="rs-space-card">
        <div className="rs-space-card-title"><h2>空间列表</h2></div>
        <div className="rs-space-toolbar">
          <label className="rs-space-search"><Search size={18} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="搜索空间名称、负责人或关键词" /></label>
          <select value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option>全部空间类型</option><option>项目空间</option><option>课题空间</option><option>个人空间</option></select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option>全部状态</option><option>运行中</option><option>筹备中</option><option>已归档</option></select>
          <select value={tenant} onChange={(event) => { setTenant(event.target.value); setPage(1); }}><option>全部租户</option>{tenants.map((item) => <option key={item}>{item}</option>)}</select>
          <button type="button" className="rs-space-primary" onClick={() => router.push(managePath(context.id, "new"))}><Plus size={18} />新建空间</button>
        </div>
        <div className="rs-space-table-wrap"><table className="rs-space-table"><thead><tr><th className="check"><input type="checkbox" aria-label="选择全部空间" /></th><th>空间名称</th><th>空间类型</th><th>所属租户</th><th>负责人</th><th>成员数</th><th>关联课题/子空间</th><th>状态</th><th>最近更新</th><th className="action">操作</th></tr></thead><tbody>{rows.map((space) => { const project = state.projects.find((item) => item.id === space.projectId); const memberCount = state.members.filter((member) => member.spaceId === space.id && member.status === "active").length; const children = state.spaces.filter((item) => item.parentSpaceId === space.id || (space.type === "PROJECT" && item.projectId === space.projectId && item.type === "TOPIC")); const statusMeta = statusForSpace(space); const Icon = space.type === "PERSONAL" ? UserRound : space.type === "PROJECT" ? FolderKanban : FileText; return <tr key={space.id}><td className="check"><input type="checkbox" aria-label={`选择${space.name}`} /></td><td><button type="button" className="rs-space-name" onClick={() => enterSpace(space)}><span className={`rs-space-icon ${space.type.toLowerCase()}`}><Icon size={18} /></span><strong>{space.name}</strong></button></td><td>{spaceTypeLabel(space)}</td><td>{project?.organization ?? "当前租户"}</td><td><span className="rs-person"><Avatar userId={space.ownerId} name={userName(space.ownerId)} />{userName(space.ownerId)}</span></td><td>{memberCount}</td><td>{space.type === "PROJECT" ? `${children.filter((item) => item.type === "TOPIC").length}个课题 / ${children.filter((item) => item.parentSpaceId).length}个子空间` : `${children.length}个子空间`}</td><td><span className={`rs-space-status ${statusMeta.tone}`}><i />{statusMeta.label}</span></td><td>{space.createdAt.slice(0, 16).replace("T", " ")}</td><td className="action"><button type="button" aria-label={`${space.name}更多操作`}><MoreHorizontal size={19} /></button></td></tr>; })}</tbody></table>{!rows.length && <Empty>没有符合当前条件的空间。</Empty>}</div>
        <div className="rs-space-pagination"><span>共 {filtered.length} 条</span><div><button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={17} /></button>{Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map((item) => <button className={item === page ? "selected" : ""} key={item} onClick={() => setPage(item)}>{item}</button>)}{pageCount > 5 && <><span>…</span><button onClick={() => setPage(pageCount)}>{pageCount}</button></>}<button disabled={page >= pageCount} onClick={() => setPage(page + 1)}><ChevronRight size={17} /></button><select aria-label="每页数量" defaultValue="10"><option>10条/页</option></select></div></div>
      </section>
    </div>
  );
}

type DraftMember = { userId: string; projectRole: string; spaceRole: Membership["role"]; dataScope: string };

function CreateSpace({ state, context }: { state: State; context: Space }) {
  const { p, mutate } = useResearch();
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<Space["type"] | "">("");
  const [projectId, setProjectId] = useState(context.projectId || state.projects[0]?.id || "");
  const [parentId, setParentId] = useState(context.type === "PERSONAL" ? "" : context.id);
  const [ownerId, setOwnerId] = useState(p.id);
  const [description, setDescription] = useState("");
  const initialProfiles = Object.values(profiles).filter((profile) => profile.projects.includes(projectId)).slice(0, 3);
  const [draftMembers, setDraftMembers] = useState<DraftMember[]>(initialProfiles.map((profile, index) => ({ userId: profile.id, projectRole: index === 0 ? "项目负责人" : index === 1 ? "课题负责人" : "研究成员", spaceRole: index === 0 ? "Space Admin" : "Member", dataScope: index === 0 ? "全部数据" : index === 1 ? "本课题数据" : "部分数据" })));
  const [projectShare, setProjectShare] = useState(true);
  const [crossTopic, setCrossTopic] = useState(true);
  const [validDays, setValidDays] = useState("365天");
  const [externalExpert, setExternalExpert] = useState(false);

  function updateMember(index: number, patch: Partial<DraftMember>) {
    setDraftMembers((members) => members.map((member, itemIndex) => itemIndex === index ? { ...member, ...patch } : member));
  }

  function addMember() {
    const existing = new Set(draftMembers.map((member) => member.userId));
    const candidate = Object.values(profiles).find((profile) => !existing.has(profile.id) && profile.projects.includes(projectId));
    if (!candidate) return notify("当前项目没有更多可添加的候选成员。");
    setDraftMembers([...draftMembers, { userId: candidate.id, projectRole: "研究成员", spaceRole: "Member", dataScope: "本课题数据" }]);
  }

  function createSpace() {
    if (!name.trim() || !type || !projectId || !ownerId) return notify("请完整填写空间名称、类型、所属租户和负责人。");
    const id = uid("space");
    const ok = mutate("已创建科研空间", id, (draft) => {
      if (type === "PROJECT" && draft.spaces.some((space) => space.type === "PROJECT" && space.projectId === projectId)) throw new Error("该项目已存在项目空间。");
      const space: Space = { id, name: name.trim(), type, projectId: type === "PERSONAL" ? "" : projectId, ownerId, status: "ACTIVE", description, code: `SPACE-${Date.now().toString().slice(-6)}`, mapping: "", syncStatus: "待同步", createdAt: now(), parentSpaceId: type === "TOPIC" ? parentId || undefined : undefined };
      draft.spaces.push(space);
      for (const member of draftMembers) draft.members.push({ id: uid("member"), userId: member.userId, projectId: space.projectId, spaceId: id, role: member.spaceRole, status: "active", joinedAt: now() });
      draft.spacePolicies ??= {};
      draft.spacePolicies[id] = { member: projectShare, siblingTopic: crossTopic, project: projectShare, download: false, copy: false, edit: false, approval: crossTopic ? "跨课题需要审批" : "不允许跨课题", defaultVisibility: "创建者与已授权协作者", validDays, revision: 1 };
      draft.spaceId = id;
    });
    if (ok) router.push(managePath(id, type === "PERSONAL" ? "basic" : "members"));
  }

  return (
    <div className="rs-space-create">
      <Breadcrumb current="全部空间 / 新建空间" />
      <header className="rs-space-page-title"><h1>新建空间</h1><p>创建项目空间、课题空间或个人空间，并配置负责人、成员与协作范围。</p></header>
      <section className="rs-space-form-card"><h2>基本信息</h2><div className="rs-space-form-grid"><label><span>空间名称 <b>*</b></span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="请输入空间名称" /></label><label><span>空间类型 <b>*</b></span><select value={type} onChange={(event) => setType(event.target.value as Space["type"])}><option value="">请选择空间类型</option><option value="PROJECT">项目空间</option><option value="TOPIC">课题空间</option><option value="PERSONAL">个人空间</option></select></label><label><span>所属租户 <b>*</b></span><select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{state.projects.map((project) => <option key={project.id} value={project.id}>{project.organization}</option>)}</select></label><label><span>上级空间</span><select value={parentId} onChange={(event) => setParentId(event.target.value)}><option value="">请选择上级空间（可选）</option>{state.spaces.filter((space) => space.projectId === projectId && space.type !== "PERSONAL").map((space) => <option key={space.id} value={space.id}>{space.name}</option>)}</select><small><Info size={14} />课题空间可挂载到项目空间下</small></label><label><span>负责人 <b>*</b></span><select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>{Object.values(profiles).filter((profile) => profile.projects.includes(projectId)).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label><label><span>空间管理员</span><div className="rs-space-static-input">{draftMembers.filter((member) => member.spaceRole === "Space Admin").map((member) => userName(member.userId)).join("、") || "请在成员初始化中选择"}</div></label><label className="full"><span>描述</span><textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} placeholder="请输入空间描述（可选），用于说明该空间的研究目标、范围和预期成果等…" /><small className="counter">{description.length}/500</small></label></div></section>
      <section className="rs-space-form-card"><div className="rs-form-section-head"><h2>成员初始化</h2><div><button type="button" onClick={addMember}><Plus size={16} />添加成员</button><button type="button"><Upload size={16} />批量导入</button></div></div><div className="rs-init-table"><table><thead><tr><th>姓名</th><th>所属单位</th><th>项目角色</th><th>空间角色</th><th>数据范围</th><th>操作</th></tr></thead><tbody>{draftMembers.map((member, index) => { const profile = Object.values(profiles).find((item) => item.id === member.userId); const project = state.projects.find((item) => item.id === projectId); return <tr key={member.userId}><td><span className="rs-person"><Avatar userId={member.userId} name={profile?.name ?? member.userId} /><strong>{profile?.name ?? member.userId}</strong></span></td><td>{project?.organization ?? "当前租户"}</td><td><select value={member.projectRole} onChange={(event) => updateMember(index, { projectRole: event.target.value })}><option>项目负责人</option><option>课题负责人</option><option>技术骨干</option><option>研究成员</option><option>外部专家</option></select></td><td><select value={member.spaceRole} onChange={(event) => updateMember(index, { spaceRole: event.target.value as Membership["role"] })}><option value="Space Admin">管理员</option><option value="Asset Manager">资产管理员</option><option value="Member">成员</option><option value="Viewer">只读成员</option></select></td><td><select value={member.dataScope} onChange={(event) => updateMember(index, { dataScope: event.target.value })}><option>全部数据</option><option>本课题数据</option><option>本课题及下属</option><option>部分数据</option><option>指定资产</option></select></td><td><button type="button" className="link" onClick={() => setDraftMembers(draftMembers.filter((_, itemIndex) => itemIndex !== index))}>移除</button></td></tr>; })}</tbody></table></div></section>
      <section className="rs-space-form-card rs-collaboration-settings"><h2>协作与共享设置</h2><div className="rs-setting-grid"><label><span>项目内可共享 <Info size={14} /></span><button type="button" role="switch" aria-checked={projectShare} className={projectShare ? "on" : ""} onClick={() => setProjectShare(!projectShare)}><i /></button><small>同一项目内的成员可共享资源与成果</small></label><label><span>跨课题需授权 <Info size={14} /></span><button type="button" role="switch" aria-checked={crossTopic} className={crossTopic ? "on" : ""} onClick={() => setCrossTopic(!crossTopic)}><i /></button><small>向其他课题共享时需经管理员授权</small></label><label><span>默认共享有效期 <Info size={14} /></span><select value={validDays} onChange={(event) => setValidDays(event.target.value)}><option>30天</option><option>90天</option><option>365天</option><option>长期</option></select><small>共享链接或权限的默认有效期</small></label><label><span>允许外部专家加入 <Info size={14} /></span><button type="button" role="switch" aria-checked={externalExpert} className={externalExpert ? "on" : ""} onClick={() => setExternalExpert(!externalExpert)}><i /></button><small>支持邀请外部专家加入该空间进行协作</small></label></div><div className="rs-create-footer"><button type="button" onClick={() => router.push(managePath(context.id, "spaces"))}>取消</button><button type="button" onClick={() => notify("空间草稿已保存在当前浏览器。")}>保存草稿</button><button type="button" className="primary" onClick={createSpace}>立即创建</button></div></section>
    </div>
  );
}

function SpaceMembers({ state, context }: { state: State; context: Space }) {
  const { mutate } = useResearch();
  const [query, setQuery] = useState("");
  const [projectRole, setProjectRole] = useState("全部项目角色");
  const [spaceRole, setSpaceRole] = useState("全部空间角色");
  const [status, setStatus] = useState("全部状态");
  const [addOpen, setAddOpen] = useState(false);
  const [candidateId, setCandidateId] = useState("");
  const [candidateRole, setCandidateRole] = useState<Membership["role"]>("Member");
  const members = state.members.filter((member) => member.spaceId === context.id && member.status === "active");
  const project = state.projects.find((item) => item.id === context.projectId);
  const candidates = Object.values(profiles).filter((profile) => profile.projects.includes(context.projectId) && !members.some((member) => member.userId === profile.id));
  const filtered = members.filter((member) => {
    const name = userName(member.userId);
    const presence = member.userId.length % 4 === 0 ? "离线" : "在线";
    return (!query || `${name} ${project?.organization ?? ""}`.includes(query)) && (projectRole === "全部项目角色" || projectRoleLabel[member.role] === projectRole) && (spaceRole === "全部空间角色" || spaceRoleLabel[member.role] === spaceRole) && (status === "全部状态" || presence === status);
  });

  function addMember() {
    if (!candidateId) return notify("请选择需要添加的成员。");
    const ok = mutate("已添加空间成员", candidateId, (draft) => {
      if (draft.members.some((member) => member.spaceId === context.id && member.userId === candidateId && member.status === "active")) throw new Error("该成员已在当前空间中。");
      draft.members.push({ id: uid("member"), userId: candidateId, projectId: context.projectId, spaceId: context.id, role: candidateRole, status: "active", joinedAt: now() });
    });
    if (ok) {
      setAddOpen(false);
      setCandidateId("");
      setCandidateRole("Member");
    }
  }
  return (
    <div className="rs-space-members">
      <Breadcrumb current="空间管理" />
      <header className="rs-space-page-title"><h1>空间管理</h1><p>管理空间成员、角色权限及协作范围，支持项目高效开展。</p></header>
      <section className="rs-space-card"><div className="rs-space-card-title"><h2>空间成员</h2></div><div className="rs-space-toolbar"><label className="rs-space-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索成员姓名、单位或邮箱" /></label><select value={projectRole} onChange={(event) => setProjectRole(event.target.value)}><option>全部项目角色</option>{[...new Set(members.map((member) => projectRoleLabel[member.role]))].map((item) => <option key={item}>{item}</option>)}</select><select value={spaceRole} onChange={(event) => setSpaceRole(event.target.value)}><option>全部空间角色</option>{[...new Set(members.map((member) => spaceRoleLabel[member.role]))].map((item) => <option key={item}>{item}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)}><option>全部状态</option><option>在线</option><option>离线</option></select><button type="button" className="rs-space-primary" onClick={() => setAddOpen(true)}><Plus size={18} />添加成员</button></div><div className="rs-space-table-wrap"><table className="rs-space-table member"><thead><tr><th className="check"><input type="checkbox" aria-label="选择全部成员" /></th><th>姓名</th><th>所属单位</th><th>项目角色</th><th>空间角色</th><th>所属课题</th><th>数据范围</th><th>状态</th><th>最近登录</th><th className="action">操作</th></tr></thead><tbody>{filtered.map((member) => { const name = userName(member.userId); const presence = member.userId.length % 4 === 0 ? "离线" : "在线"; return <tr key={member.id}><td className="check"><input type="checkbox" aria-label={`选择${name}`} /></td><td><span className="rs-person"><Avatar userId={member.userId} name={name} /><strong>{name}</strong></span></td><td>{project?.organization ?? "当前租户"}</td><td>{projectRoleLabel[member.role]}</td><td>{spaceRoleLabel[member.role]}</td><td>{context.type === "PROJECT" ? "项目整体" : context.name}</td><td>{dataScopeLabel[member.role]}</td><td><span className={`rs-member-presence ${presence === "在线" ? "online" : "offline"}`}><i />{presence}</span></td><td>{member.joinedAt.slice(0, 16).replace("T", " ")}</td><td className="action"><button type="button" aria-label={`${name}更多操作`}><MoreHorizontal size={19} /></button></td></tr>; })}</tbody></table>{!filtered.length && <Empty>没有符合条件的空间成员。</Empty>}</div><div className="rs-space-pagination"><span>共 {filtered.length} 条</span><div><button disabled><ChevronLeft size={17} /></button><button className="selected">1</button><button disabled><ChevronRight size={17} /></button><select defaultValue="10条/页"><option>10条/页</option></select></div></div></section>
      <Modal title="添加成员" open={addOpen} onClose={() => setAddOpen(false)} footer={<><Button onClick={() => setAddOpen(false)}>取消</Button><Button primary disabled={!candidateId} onClick={addMember}>确认添加</Button></>}>
        {candidates.length ? <><Field label="选择成员" required><select value={candidateId} onChange={(event) => setCandidateId(event.target.value)}><option value="">请选择项目成员</option>{candidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}</select></Field><Field label="空间角色" required><select value={candidateRole} onChange={(event) => setCandidateRole(event.target.value as Membership["role"])}><option value="Member">成员</option><option value="Viewer">只读成员</option><option value="Asset Manager">资产管理员</option><option value="Space Admin">空间管理员</option></select></Field></> : <Empty>当前项目成员均已加入该空间。</Empty>}
      </Modal>
    </div>
  );
}

function GovernanceNav({ context, view, tabs }: { context: Space; view: string; tabs: ManageTab[] }) {
  return <nav className="rs-governance-nav" aria-label="空间管理功能">{tabs.map((tab) => <Link key={tab.id} className={tab.id === view ? "selected" : ""} href={managePath(context.id, tab.id)}>{tab.label}</Link>)}</nav>;
}

function SpaceGovernance({ state, context, view, tabs }: { state: State; context: Space; view: string; tabs: ManageTab[] }) {
  const project = state.projects.find((item) => item.id === context.projectId);
  const members = state.members.filter((member) => member.spaceId === context.id && member.status === "active");
  const title = tabs.find((tab) => tab.id === view)?.label ?? "基本信息";
  return <div className="rs-space-governance"><Breadcrumb current={`空间管理 / ${title}`} /><header className="rs-space-page-title"><h1>{title}</h1><p>当前空间：{context.name}，相关管理操作受角色与数据范围约束。</p></header><GovernanceNav context={context} view={view} tabs={tabs} />{view === "basic" ? <section className="rs-space-card governance"><Details values={{ 空间名称: context.name, 空间类型: spaceTypeLabel(context), 所属租户: project?.organization ?? "当前租户", 关联项目: project?.name ?? "—", 负责人: userName(context.ownerId), 当前状态: spaceLabels[context.status], 来源映射: context.mapping || "尚未接入" }} /></section> : view === "roles" ? <section className="rs-space-card governance"><Table headers={["空间角色", "项目角色", "数据范围", "绑定人数", "状态"]} rows={(Object.keys(spaceRoleLabel) as Membership["role"][]).map((role) => [spaceRoleLabel[role], projectRoleLabel[role], dataScopeLabel[role], members.filter((member) => member.role === role).length, <Badge key={role}>启用</Badge>])} /></section> : view === "topics" ? <section className="rs-space-card governance"><Table headers={["课题空间", "负责人", "成员数", "状态"]} rows={state.spaces.filter((space) => space.projectId === context.projectId && space.type === "TOPIC").map((space) => [space.name, userName(space.ownerId), state.members.filter((member) => member.spaceId === space.id && member.status === "active").length, <Badge key={space.id}>{spaceLabels[space.status]}</Badge>])} /></section> : view === "sharing" ? <section className="rs-space-card governance"><Details values={{ 项目内共享: "允许", 跨课题授权: "需要管理员确认", 默认有效期: state.spacePolicies?.[context.id]?.validDays ?? "365天", 外部专家: "按上级策略" }} /><Alert>共享规则只定义可授权上限，不会自动公开已有科研资产。</Alert></section> : <section className="rs-space-card governance"><Table headers={["时间", "操作人", "操作", "对象", "结果"]} rows={state.audit.filter((item) => item.objectId === context.id).map((item) => [item.at.slice(0, 16).replace("T", " "), userName(item.userId), item.action, context.name, item.result ?? "成功"])} empty="暂无操作记录。" /></section>}</div>;
}
