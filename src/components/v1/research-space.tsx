"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  FileSearch,
  FolderKanban,
  LockKeyhole,
  Plus,
} from "lucide-react";
import {
  canEdit,
  canEnter,
  canCloseSpace,
  canManageSpace,
  canRemoveMember,
  now,
  permissionLabel,
  spaceLabels,
  uid,
} from "./domain";
import {
  assetsForResearchContext,
  researchAssetActions,
  researchSpaceLabel,
  researchSpaceManageTabs,
  researchSpaceState,
} from "./research-space-domain";
import { assetTypes, disciplines, profiles, userName } from "./seed";
import { addContext, notify, useResearch } from "./store";
import { ResearchAssetList } from "./research-space-list";
import type { Asset, AssetType, Membership, Space, State } from "./types";
import {
  AdvancedFilters,
  Alert,
  Badge,
  Button,
  Confirm,
  Details,
  download,
  Empty,
  Field,
  Files,
  Modal,
  PageTitle,
  Pagination,
  SearchBox,
  Select,
  Table,
  Tabs,
} from "./ui";

type Router = ReturnType<typeof useRouter>;
type Search = ReturnType<typeof useSearchParams>;

const managementLabels: Record<string, string> = {
  basic: "基本信息",
  members: "成员",
  roles: "角色与权限",
  topics: "课题空间",
  sharing: "共享规则",
  audit: "操作记录",
};

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function updateQuery(
  router: Router,
  pathname: string,
  search: Search,
  values: Record<string, string>,
) {
  const next = new URLSearchParams(search.toString());
  for (const [key, value] of Object.entries(values)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }
  if (!("page" in values)) next.delete("page");
  const suffix = next.toString();
  router.replace(`${pathname}${suffix ? `?${suffix}` : ""}`);
}

function contextPath(contextId: string, suffix = "assets") {
  return `/research-spaces/${encodeURIComponent(contextId)}/${suffix}`;
}

function NoAccess({ contextId }: { contextId?: string }) {
  return (
    <section className="v-card rs-state" role="alert">
      <LockKeyhole size={28} />
      <h2>无法访问此内容</h2>
      <p>内容不存在，或你没有访问权限。</p>
      <div className="v-actions">
        <Link className="v-button" href="/research-spaces/current/assets">
          返回当前空间
        </Link>
        <Button onClick={() => notify(`不可访问上下文：${contextId ?? "未知"}`)}>
          选择其他有权空间
        </Button>
      </div>
    </section>
  );
}

function StateBadges({ asset }: { asset: Asset }) {
  const state = researchSpaceState(asset);
  const labels = {
    lifecycle:
      state.lifecycle === "ACTIVE"
        ? "有效"
        : state.lifecycle === "DRAFT"
          ? "草稿"
          : "已归档",
    version:
      state.version === "READY"
        ? "版本就绪"
        : state.version === "DRAFT"
          ? "版本未就绪"
          : "版本不可用",
    availability:
      state.availability === "AVAILABLE"
        ? "来源可用"
        : state.availability === "UNKNOWN"
          ? "来源未知"
          : "来源不可用",
  };
  return (
    <div className="v-actions rs-badges">
      <Badge>{labels.lifecycle}</Badge>
      <Badge>{labels.version}</Badge>
      <Badge>{labels.availability}</Badge>
      {state.review !== "NOT_REQUIRED" && (
        <Badge>{state.review === "PENDING" ? "待审核" : asset.publishStatus}</Badge>
      )}
      {state.listing === "LISTED" && <Badge>已上架</Badge>}
    </div>
  );
}

export function ResearchSpace() {
  const { s, p, space, loaded, mutate } = useResearch();
  const params = useParams<Record<string, string | string[]>>();
  const pathname = usePathname();
  const router = useRouter();
  const routeContext = valueOf(params.contextId);
  const requestId = valueOf(params.requestId);
  const requestedContext =
    !routeContext || routeContext === "current"
      ? space
      : s.spaces.find((item) => item.id === routeContext);

  useEffect(() => {
    if (!loaded || requestId) return;
    if (pathname.includes("/manage/")) {
      const targetId = routeContext === "current" ? space.id : routeContext;
      router.replace(`/research-spaces/${encodeURIComponent(targetId ?? space.id)}/overview`);
      return;
    }
    if (routeContext === "current") {
      router.replace(pathname.replace("/research-spaces/current/", `/research-spaces/${space.id}/`));
      return;
    }
    if (
      requestedContext &&
      requestedContext.id !== s.spaceId &&
      canEnter(s, p, requestedContext.id)
    )
      mutate("已切换科研空间", requestedContext.id, (draft) => {
        draft.spaceId = requestedContext.id;
      });
  }, [loaded, mutate, p, pathname, requestId, requestedContext, routeContext, router, s, space.id]);

  if (!loaded)
    return (
      <div className="v-research-space rs-loading" role="status">
        <div />
        <div />
        <div />
        正在加载科研空间…
      </div>
    );

  if (requestId)
    return <BuildRequest requestId={requestId} state={s} router={router} />;

  if (!requestedContext || !canEnter(s, p, requestedContext.id))
    return <NoAccess contextId={routeContext} />;

  const context = requestedContext;
  const managing = pathname.includes("/manage/");
  const assetKey = valueOf(params.assetKey);

  if (managing)
    return <div className="v-loading" role="status">正在转到课题概览…</div>;

  return (
    <div className="v-research-space">
      {assetKey ? (
        <AssetDetail
          state={s}
          context={context}
          assetKey={decodeURIComponent(assetKey)}
          router={router}
        />
      ) : (
        <ResearchAssetList state={s} context={context} />
      )}
    </div>
  );
}

export function AssetList({
  state,
  context,
  router,
}: {
  state: State;
  context: Space;
  router: Router;
}) {
  const { p, mutate } = useResearch();
  const pathname = usePathname();
  const query = useSearchParams();
  const q = query.get("q") ?? "";
  const type = query.get("type") ?? "全部";
  const lifecycle = query.get("lifecycle") ?? "草稿和有效";
  const sourceRange = query.get("range") ?? "全部可访问";
  const mine = query.get("mine") === "1";
  const page = Math.max(1, Number(query.get("page") ?? 1));
  const size = [20, 50, 100].includes(Number(query.get("size")))
    ? Number(query.get("size"))
    : 20;
  const [searchDraft, setSearchDraft] = useState(q);
  const filters = {
    discipline: query.get("discipline") ?? "",
    creator: query.get("creator") ?? "",
    from: query.get("from") ?? "",
    to: query.get("to") ?? "",
    sharing: query.get("sharing") ?? "",
    publishing: query.get("publishing") ?? "",
  };
  const [panel, setPanel] = useState("");
  const [createType, setCreateType] = useState<AssetType | "">("");
  const [form, setForm] = useState({ name: "", discipline: "材料科学", description: "" });
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => setSearchDraft(q), [q]);
  const visible = useMemo(
    () => assetsForResearchContext(state, p, context.id),
    [context.id, p, state],
  );
  const list = visible
    .filter((asset) => {
      const stateView = researchSpaceState(asset);
      const rangeMatches =
        sourceRange === "全部可访问" ||
        (sourceRange === "当前空间" && asset.spaceId === context.id) ||
        (sourceRange === "项目公共区" && asset.visibility === "PROJECT") ||
        (sourceRange === "共享进入" &&
          asset.spaceId !== context.id &&
          asset.shares.some((share) => share.targetSpace === context.id));
      return (
        (type === "全部" || asset.type === type) &&
        (lifecycle === "全部" ||
          (lifecycle === "草稿和有效" && stateView.lifecycle !== "ARCHIVED") ||
          (lifecycle === "草稿" && stateView.lifecycle === "DRAFT") ||
          (lifecycle === "有效" && stateView.lifecycle === "ACTIVE") ||
          (lifecycle === "已归档" && stateView.lifecycle === "ARCHIVED")) &&
        rangeMatches &&
        (!mine || asset.ownerId === p.id) &&
        (!filters.discipline || asset.discipline === filters.discipline) &&
        (!filters.creator || userName(asset.ownerId).includes(filters.creator)) &&
        (!filters.from || asset.updatedAt.slice(0, 10) >= filters.from) &&
        (!filters.to || asset.updatedAt.slice(0, 10) <= filters.to) &&
        (!filters.sharing ||
          (filters.sharing === "有效共享" ? asset.shares.length > 0 : asset.shares.length === 0)) &&
        (!filters.publishing ||
          (filters.publishing === "已上架"
            ? asset.publishStatus === "已发布"
            : filters.publishing === "审核中"
              ? /审核/.test(asset.publishStatus)
              : asset.publishStatus !== "已发布")) &&
        (!q || `${asset.name} ${asset.description}`.toLowerCase().includes(q.toLowerCase()))
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const canCreate = context.status === "ACTIVE" && canEnter(state, p, context.id);

  function setParam(key: string, value: string) {
    updateQuery(router, pathname, query, { [key]: value });
  }

  function setAdvancedFilters(values: Record<string, string>) {
    const next = new URLSearchParams(query.toString());
    for (const key of ["discipline", "creator", "from", "to", "sharing", "publishing"]) {
      const value = values[key] ?? "";
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  function createAsset() {
    const name = form.name.trim();
    if (!createType || name.length < 2 || name.length > 80) {
      notify("请输入 2—80 字符的资产名称。");
      return;
    }
    if (form.description.length > 500) {
      notify("简介不能超过 500 字符。");
      return;
    }
    if (createType === "方案模板" && !files.length) {
      notify("请选择并校验方案模板文件。");
      return;
    }
    const id = uid("asset");
    const technical = createType !== "方案模板";
    const requestId = technical ? uid("build") : "";
    const ok = mutate(technical ? "已保存建设草稿" : "已新建方案模板", id, (draft, actor) => {
      const target = draft.spaces.find((item) => item.id === context.id);
      if (!target || target.status !== "ACTIVE") throw new Error("当前空间不可写入。");
      draft.assets.unshift({
        id,
        name,
        type: createType,
        ownerId: actor.id,
        projectId: context.projectId,
        spaceId: context.id,
        visibility: "PRIVATE",
        shares: [],
        updatedAt: now(),
        discipline: form.discipline,
        description: form.description || "尚未补充科研用途说明。",
        source: technical ? "AI 中台（待接入）" : "科研空间",
        version: technical ? "" : "V1.0",
        versions: technical
          ? []
          : [{ id: `${id}-v1`, number: "V1.0", description: "初始版本", at: now(), by: actor.id, status: "有效" }],
        publishStatus: "未发布",
        lifecycle: technical ? "草稿" : "有效",
        availability: technical ? "待接入" : "可用",
        provider: "炼化研究院",
        tags: [form.discipline, createType],
        input: "来源未提供",
        output: "来源未提供",
        limitations: "按当前空间与来源授权使用。",
        validation: "—",
        dependencies: createType === "方案模板" ? [...files] : [],
        schema: [],
        externalId: technical ? requestId : undefined,
      });
      if (technical)
        draft.requests.unshift({
          id: requestId,
          objectId: id,
          userId: actor.id,
          purpose: `创建${createType}`,
          status: "等待来源",
          kind: "BUILD",
          createdAt: now(),
        });
    });
    if (!ok) return;
    setPanel("");
    router.push(
      technical
        ? `/research-spaces/builds/${requestId}`
        : `${contextPath(context.id)}/${encodeURIComponent(id)}`,
    );
  }

  return (
    <>
      <div className="rs-page-head">
        <div>
          <h2>科研资产</h2>
          <p>当前空间可访问的科研能力与正式资产；共享进入不会改变原归属。</p>
        </div>
        {canCreate && (
          <Button primary onClick={() => setPanel("type")}>
            <Plus size={15} /> 新建
          </Button>
        )}
      </div>
      <Tabs items={["全部", ...assetTypes]} value={type} onChange={(value) => setParam("type", value)} />
      <div className="v-toolbar rs-toolbar">
        <SearchBox
          value={searchDraft}
          onChange={setSearchDraft}
          onSubmit={() => setParam("q", searchDraft.trim())}
          placeholder="搜索名称或简介，按 Enter 查询"
        />
        <Select
          label="生命周期"
          value={lifecycle}
          onChange={(value) => setParam("lifecycle", value)}
          options={["草稿和有效", "全部", "草稿", "有效", "已归档"]}
        />
        <Select
          label="来源范围"
          value={sourceRange}
          onChange={(value) => setParam("range", value)}
          options={
            context.type === "PERSONAL"
              ? ["全部可访问", "当前空间", "共享进入"]
              : ["全部可访问", "当前空间", "项目公共区", "共享进入"]
          }
        />
        <label className="rs-check">
          <input
            type="checkbox"
            checked={mine}
            onChange={(event) => setParam("mine", event.target.checked ? "1" : "")}
          />
          我创建的
        </label>
        <AdvancedFilters
          value={filters}
          onChange={setAdvancedFilters}
          fields={[
            { key: "discipline", label: "学科", options: disciplines.slice(1) },
            { key: "creator", label: "创建人" },
            { key: "from", label: "更新开始", type: "date" },
            { key: "to", label: "更新结束", type: "date" },
            { key: "sharing", label: "共享状态", options: ["未共享", "有效共享"] },
            { key: "publishing", label: "发布状态", options: ["未上架", "审核中", "已上架"] },
          ]}
        />
      </div>
      <Table
        headers={["名称", "类型", "所属位置", "版本", "状态", "更新时间", "操作"]}
        rows={list.slice((page - 1) * size, page * size).map((asset) => [
          <Link
            key="name"
            className="v-link rs-name"
            href={`${contextPath(context.id)}/${encodeURIComponent(asset.id)}?tab=overview`}
          >
            {asset.name}
            <small>{asset.description}</small>
          </Link>,
          <span key="type">{asset.type}<small>{asset.discipline}</small></span>,
          <span key="scope">
            {state.spaces.find((item) => item.id === asset.spaceId)?.name ?? "个人空间"}
            {asset.spaceId !== context.id && <small>共享/聚合进入</small>}
          </span>,
          asset.version || "—",
          <StateBadges asset={asset} key="state" />,
          asset.updatedAt.slice(0, 10),
          <Link key="action" className="v-button" href={`${contextPath(context.id)}/${encodeURIComponent(asset.id)}`}>
            详情
          </Link>,
        ])}
        empty={q || type !== "全部" ? "没有符合当前筛选条件的资产。" : "当前空间还没有科研资产。"}
      />
      <div className="rs-pagination-row">
        <Pagination page={page} total={list.length} size={size} onChange={(value) => setParam("page", String(value))} />
        <Select label="每页" value={String(size)} onChange={(value) => setParam("size", value)} options={["20", "50", "100"]} />
      </div>

      <Modal title="新建资产" open={panel === "type"} onClose={() => setPanel("")}>
        <div className="rs-create-menu">
          {assetTypes.map((item) => (
            <button key={item} type="button" onClick={() => { setCreateType(item); setFiles([]); setPanel("create"); }}>
              <FolderKanban size={18} />
              <span><strong>新建{item}</strong><small>{item === "方案模板" ? "在科研空间登记文件版本" : "保存草稿后前往 AI 中台建设"}</small></span>
            </button>
          ))}
        </div>
        <Alert>关联中台已有对象仅在来源具备列举与关联能力时开放；当前原型显示为来源未接入。</Alert>
      </Modal>
      <Modal
        title={`新建${createType}`}
        open={panel === "create"}
        onClose={() => setPanel("")}
        footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={createAsset}>{createType === "方案模板" ? "保存正式版本" : "保存草稿"}</Button></>}
      >
        <div data-unsaved={!!form.name.trim()}>
          <Field label="资产类型"><input value={createType} readOnly /></Field>
          <Field label="名称" required><input value={form.name} maxLength={80} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field>
          <Field label="学科" required><select value={form.discipline} onChange={(event) => setForm({ ...form, discipline: event.target.value })}>{disciplines.slice(1).map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Field label="用途说明"><textarea maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          {createType === "方案模板" && <><div className="v-field"><span>模板文件 <b aria-label="必填">*</b></span><Files value={files} onChange={setFiles} /></div><Alert>原型限制为单文件 20MB；文件在校验完成前不会形成就绪版本。</Alert></>}
          <Details values={{ 归属空间: context.name, 初始可见性: "创建者与明确授权协作者", 建设环境: createType === "方案模板" ? "科研空间" : "AI 中台（来源未接入）" }} />
          {createType !== "方案模板" && <Alert>来源未接入：本次只保存建设草稿，不会伪造中台对象或可用版本。</Alert>}
        </div>
      </Modal>
    </>
  );
}

function AssetDetail({
  state,
  context,
  assetKey,
  router,
}: {
  state: State;
  context: Space;
  assetKey: string;
  router: Router;
}) {
  const { p, mutate } = useResearch();
  const query = useSearchParams();
  const tab = query.get("tab") ?? "overview";
  const visible = assetsForResearchContext(state, p, context.id);
  const asset = visible.find((item) => item.id === assetKey);
  const [panel, setPanel] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<string[]>([]);
  const actions = asset ? researchAssetActions(state, p, context.id, asset) : [];
  if (!asset) return <NoAccess contextId={context.id} />;
  const assetId = asset.id;
  const assetName = asset.name;
  const tabs = [
    { id: "overview", label: "概览" },
    { id: "versions", label: "版本" },
    { id: "shares", label: "共享" },
    ...(asset.type === "Skill" || asset.type === "模型" ? [{ id: "publishing", label: "发布记录" }] : []),
    { id: "usage", label: "使用记录" },
  ];
  const capability = ["智能体", "Skill", "模型"].includes(asset.type);

  function setTab(value: string) {
    router.replace(`${contextPath(context.id)}/${encodeURIComponent(assetId)}?tab=${value}`);
  }

  function saveMetadata() {
    const name = (form.name ?? assetName).trim();
    if (name.length < 2 || name.length > 80) return notify("名称需为 2—80 字符。");
    const ok = mutate("已更新资产基本信息", assetId, (draft, actor) => {
      const item = draft.assets.find((value) => value.id === assetId)!;
      if (!researchAssetActions(draft, actor, context.id, item).includes("edit")) throw new Error("没有编辑权限。");
      item.name = name;
      item.description = form.description ?? item.description;
      item.discipline = form.discipline ?? item.discipline;
      item.limitations = form.limitations ?? item.limitations;
      item.updatedAt = now();
    });
    if (ok) setPanel("");
  }

  function shareAsset() {
    const target = form.target;
    if (!target) return notify("请选择共享目标。");
    const ok = mutate("已提交资产共享", assetId, (draft, actor) => {
      const item = draft.assets.find((value) => value.id === assetId)!;
      if (!researchAssetActions(draft, actor, context.id, item).includes("share")) throw new Error("当前无共享权限。");
      item.shares.push({
        id: uid("grant"),
        targetSpace: target,
        level: (form.level || "可引用") as "只读" | "可引用" | "可复制" | "可协作",
        validTo: form.validTo || "",
        by: actor.id,
        at: now(),
      });
      item.updatedAt = now();
    });
    if (ok) setPanel("");
  }

  function publishAsset() {
    const ok = mutate("已提交发布申请", assetId, (draft, actor) => {
      const item = draft.assets.find((value) => value.id === assetId)!;
      if (!researchAssetActions(draft, actor, context.id, item).includes("publish.submit")) throw new Error("当前版本或来源状态不允许发布。");
      item.publishStatus = "审核中";
      draft.requests.unshift({ id: uid("publish"), objectId: item.id, userId: actor.id, purpose: `发布${item.type} ${item.version}`, status: "待审核", kind: "PUBLICATION", targetVersion: item.version, createdAt: now() });
    });
    if (ok) setPanel("");
  }

  function updatePublication(action: "withdraw" | "approve" | "reject" | "delist") {
    const requestId = form.requestId;
    if (!requestId && action !== "delist") return notify("未找到发布申请。");
    if (
      mutate(
        action === "withdraw"
          ? "已撤回发布申请"
          : action === "delist"
            ? "已提交下架申请"
            : action === "approve"
              ? "发布审核通过待生效"
              : "已驳回发布申请",
        assetId,
        (draft, actor) => {
          const item = draft.assets.find((value) => value.id === assetId)!;
          if (action === "delist") {
            draft.requests.unshift({ id: uid("delist"), objectId: item.id, userId: actor.id, purpose: `申请下架 ${item.version}`, status: "待审核", kind: "DELIST", targetVersion: item.version, createdAt: now() });
            item.publishStatus = "下架审核中";
            return;
          }
          const request = draft.requests.find((value) => value.id === requestId);
          if (!request || request.objectId !== item.id) throw new Error("申请不存在或已失效。");
          if (action === "withdraw") {
            if (request.userId !== actor.id || request.status !== "待审核") throw new Error("当前申请不可撤回。");
            request.status = "已撤回";
            item.publishStatus = "未发布";
            return;
          }
          if (!canManageSpace(draft, actor, context.id) || request.userId === actor.id)
            throw new Error("没有该申请的审批资格，且申请人不可自审。");
          request.status = action === "approve" ? "通过待生效" : "已驳回";
          item.publishStatus = action === "approve" ? "待上架" : "已驳回";
        },
      )
    )
      setPanel("");
  }

  function attachToTask() {
    if (!form.taskId) return notify("请选择可操作的科研任务。");
    if (addContext([assetId], capability, form.taskId)) {
      const task = state.tasks.find((item) => item.id === form.taskId);
      setPanel("");
      router.push(`/workspace?task=${form.taskId}${task?.sessionIds[0] ? `&session=${task.sessionIds[0]}` : ""}`);
    }
  }

  function copyAsset() {
    const ok = mutate("已复制资产到科研空间", assetId, (draft, actor) => {
      const item = draft.assets.find((value) => value.id === assetId)!;
      if (!researchAssetActions(draft, actor, context.id, item).includes("copy")) throw new Error("来源不支持复制，或当前没有复制权限。");
      draft.assets.unshift({ ...structuredClone(item), id: uid("asset"), name: `${item.name}（副本）`, ownerId: actor.id, spaceId: context.id, projectId: context.projectId, visibility: "PRIVATE", shares: [], publishStatus: "未发布", sourceAssetId: item.id, updatedAt: now() });
    });
    if (ok) setPanel("");
  }

  function changeArchive(next: "已归档" | "有效") {
    const ok = mutate(next === "已归档" ? "已归档资产" : "已恢复资产", assetId, (draft, actor) => {
      const item = draft.assets.find((value) => value.id === assetId)!;
      const allowed = researchAssetActions(draft, actor, context.id, item);
      if (!allowed.includes(next === "已归档" ? "archive" : "restore")) throw new Error("当前状态或权限不允许此操作。");
      if (next === "已归档" && (item.shares.length || item.publishStatus === "已发布" || draft.tasks.some((task) => task.contextIds.includes(item.id) || task.capabilityIds.includes(item.id)))) throw new Error("存在有效共享、上架或任务引用，请先处理依赖。");
      item.lifecycle = next;
      item.updatedAt = now();
    });
    if (ok) setPanel("");
  }

  function continueBuild() {
    const requestId = uid("build");
    if (
      mutate("已创建继续建设请求", assetId, (draft, actor) => {
        const item = draft.assets.find((value) => value.id === assetId)!;
        if (!researchAssetActions(draft, actor, context.id, item).includes("edit"))
          throw new Error("没有继续建设权限。");
        draft.requests.unshift({
          id: requestId,
          objectId: item.id,
          userId: actor.id,
          purpose: `继续建设${item.type}`,
          status: "等待来源",
          kind: "BUILD",
          targetVersion: item.version,
          createdAt: now(),
        });
      })
    )
      router.push(`/research-spaces/builds/${requestId}`);
  }

  function appendTemplateVersion() {
    if (!files.length || !(form.changeLog ?? "").trim())
      return notify("请选择模板文件并填写版本说明。");
    if (
      mutate("已登记模板新版本", assetId, (draft, actor) => {
        const item = draft.assets.find((value) => value.id === assetId)!;
        if (item.type !== "方案模板" || !researchAssetActions(draft, actor, context.id, item).includes("edit"))
          throw new Error("当前资产不能更新模板版本。");
        const numbers = item.versions.map((version) => Number(version.number.replace(/^V\d+\./, "")) || 0);
        const next = `V1.${Math.max(0, ...numbers) + 1}`;
        item.versions.push({ id: uid("version"), number: next, description: form.changeLog.trim(), at: now(), by: actor.id, status: "有效" });
        item.version = next;
        item.updatedAt = now();
      })
    ) {
      setPanel("");
      setFiles([]);
    }
  }

  const headerActions = (
    <div className="v-actions">
      {actions.includes("use") && <Button primary onClick={() => setPanel("use")}>在科研任务中使用</Button>}
      {actions.includes("edit") && <Button onClick={() => { setForm({ name: asset.name, description: asset.description, discipline: asset.discipline, limitations: asset.limitations }); setPanel("edit"); }}>编辑基本信息</Button>}
      {actions.includes("share") && <Button onClick={() => setPanel("share")}>共享</Button>}
      {actions.includes("publish.submit") && <Button onClick={() => setPanel("publish")}>申请发布</Button>}
    </div>
  );

  return (
    <>
      <Button className="v-back" onClick={() => router.push(contextPath(context.id))}><ArrowLeft size={15} />返回资产列表</Button>
      <section className="v-card rs-asset-header">
        <div className="rs-page-head">
          <div>
            <span className="v-eyebrow">{asset.type} · {asset.version || "尚无就绪版本"}</span>
            <h2>{asset.name}</h2>
            <p>归属：{state.spaces.find((item) => item.id === asset.spaceId)?.name ?? "个人空间"} · 当前权限：{permissionLabel(asset, p, context.id, state)}</p>
          </div>
          {headerActions}
        </div>
        <StateBadges asset={asset} />
        {researchSpaceState(asset).availability !== "AVAILABLE" && (
          <Alert>来源未接入或暂不可用；允许披露的科研元数据可查看，新增调用与受限正文已阻断。</Alert>
        )}
      </section>
      <section className="v-card v-section">
        <Tabs items={tabs.map((item) => item.label)} value={tabs.find((item) => item.id === tab)?.label ?? "概览"} onChange={(label) => setTab(tabs.find((item) => item.label === label)?.id ?? "overview")} />
        {tab === "versions" ? (
          <Table headers={["版本", "版本状态", "创建时间", "版本说明", "操作"]} rows={asset.versions.map((version) => [version.number, <Badge key="state">{version.status}</Badge>, version.at.slice(0, 10), version.description, <Button key="action" onClick={() => { setForm({ versionId: version.id }); setPanel("version"); }}>详情</Button>])} empty="尚无就绪版本；可继续建设或补充模板文件。" />
        ) : tab === "shares" ? (
          <>
            <Table headers={["共享目标", "版本", "权限动作", "有效期", "状态", "操作"]} rows={asset.shares.map((share) => [state.spaces.find((item) => item.id === share.targetSpace)?.name ?? share.targetUser ?? "—", asset.version || "—", share.level, share.validTo || "长期", <Badge key="state">有效</Badge>, actions.includes("share") ? <Confirm key="action" title="撤销共享" description="新的读取和调用将受限；其他独立授权与已下载副本不受此动作影响。" onConfirm={() => mutate("已撤销共享", asset.id, (draft) => { const item = draft.assets.find((value) => value.id === asset.id)!; item.shares = item.shares.filter((value) => value.id !== share.id); })}>撤销</Confirm> : "—"])} empty="暂无共享授权。" />
            {actions.includes("share") && <Button onClick={() => setPanel("share")}>新增共享</Button>}
          </>
        ) : tab === "publishing" ? (
          <><Table headers={["申请单", "版本", "渠道", "受众", "审核状态", "上架状态", "操作"]} rows={state.requests.filter((request) => request.objectId === asset.id && ["PUBLICATION", "DELIST"].includes(request.kind ?? "")).map((request) => [request.id, request.targetVersion || asset.version, asset.type === "Skill" ? "科研技能" : "科研模型", "当前租户", <Badge key="review">{request.status}</Badge>, <Badge key="listing">{asset.publishStatus === "已发布" ? "已上架" : asset.publishStatus}</Badge>, <Button key="action" onClick={() => { setForm({ requestId: request.id }); setPanel("review"); }}>详情</Button>])} empty="暂无发布申请；只有 Skill 和模型具有明确发布渠道。" />{asset.publishStatus === "已发布" && actions.includes("publish.submit") && <Button onClick={() => setPanel("delist")}>申请下架</Button>}</>
        ) : tab === "usage" ? (
          <Table headers={["时间", "使用人", "版本", "目标空间", "使用方式", "结果 / 入口"]} rows={state.tasks.filter((task) => task.contextIds.includes(asset.id) || task.capabilityIds.includes(asset.id)).map((task) => [task.updatedAt.slice(0, 16).replace("T", " "), userName(task.ownerId), asset.version || "—", state.spaces.find((item) => item.id === task.spaceId)?.name, "加入任务", <Link key="task" className="v-link" href={`/workspace?task=${task.id}`}>已加入 / 查看</Link>])} empty="使用记录未接入，不能将未知显示为 0 次。" />
        ) : (
          <AssetOverview asset={asset} state={state} actions={actions} openPanel={setPanel} />
        )}
      </section>
      <div className="v-actions rs-secondary-actions">
        {actions.includes("edit") && asset.type === "方案模板" && <Button onClick={() => { setFiles([]); setForm({ changeLog: "" }); setPanel("version-new"); }}>更新版本</Button>}
        {actions.includes("copy") && <Button onClick={() => setPanel("copy")}>复制到科研空间</Button>}
        {actions.includes("archive") && <Button onClick={() => setPanel("archive")}>归档</Button>}
        {actions.includes("restore") && <Button onClick={() => setPanel("restore")}>恢复</Button>}
        {!actions.includes("edit") && <Button onClick={() => setPanel("permission")}>申请访问 / 引用权限</Button>}
      </div>

      <Modal title="编辑基本信息" open={panel === "edit"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={saveMetadata}>保存修改</Button></>}>
        <div data-unsaved={true}><Field label="AI4S 展示名称" required><input maxLength={80} value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="学科" required><select value={form.discipline ?? asset.discipline} onChange={(event) => setForm({ ...form, discipline: event.target.value })}>{disciplines.slice(1).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="简介"><textarea maxLength={500} value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label="使用限制"><textarea value={form.limitations ?? ""} onChange={(event) => setForm({ ...form, limitations: event.target.value })} /></Field><Details values={{ 归属空间: state.spaces.find((item) => item.id === asset.spaceId)?.name, 来源名称版本: `${asset.source} / ${asset.version || "—"}` }} /></div>
      </Modal>
      <Modal title="共享资产" open={panel === "share"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={shareAsset}>确认共享</Button></>}>
        <Field label="版本" required><input value={asset.version || "尚无就绪版本"} readOnly /></Field><Field label="共享目标" required><select value={form.target ?? ""} onChange={(event) => setForm({ ...form, target: event.target.value })}><option value="">请选择当前项目内有权空间</option>{state.spaces.filter((item) => item.projectId === context.projectId && item.id !== asset.spaceId && canEnter(state, p, item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="权限预设"><select value={form.level ?? "可引用"} onChange={(event) => setForm({ ...form, level: event.target.value })}>{["只读", "可引用", "可复制", "可协作"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="有效期"><input type="date" value={form.validTo ?? ""} onChange={(event) => setForm({ ...form, validTo: event.target.value })} /></Field><Alert>查看、引用、下载、复制、协作编辑是独立动作；当前原型权限预设不会自动授予下载。</Alert>
      </Modal>
      <Modal title="申请发布" open={panel === "publish"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={publishAsset}>提交发布申请</Button></>}><Details values={{ 资产: asset.name, 版本: asset.version, 发布渠道: asset.type === "Skill" ? "科研技能" : "科研模型", 受众: "当前租户", 来源状态: asset.availability }} /><Field label="申请说明" required><textarea onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field><Alert>审核通过、目录上架与来源可用分别判断；本次申请不会覆盖已上架旧版本。</Alert></Modal>
      <Modal title="申请详情及授权审批" open={panel === "review"} onClose={() => setPanel("")} footer={(() => { const request = state.requests.find((item) => item.id === form.requestId); if (!request || request.status !== "待审核") return <Button onClick={() => setPanel("")}>关闭</Button>; if (request.userId === p.id) return <><Button onClick={() => setPanel("")}>关闭</Button><Button onClick={() => updatePublication("withdraw")}>撤回申请</Button></>; if (canManageSpace(state, p, context.id)) return <><Button onClick={() => updatePublication("reject")}>驳回</Button><Button primary onClick={() => updatePublication("approve")}>通过</Button></>; return <Button onClick={() => setPanel("")}>关闭</Button>; })()}><Details values={(() => { const request = state.requests.find((item) => item.id === form.requestId); return { 申请单: request?.id, 类型: request?.kind === "DELIST" ? "下架申请" : `${asset.type}发布`, 申请人: request ? userName(request.userId) : "—", 版本: request?.targetVersion, 受众: "当前租户", 状态: request?.status, 归属: context.name }; })()} /><Alert>通过前重新校验来源版本、状态、受众与动作；通过后先显示“通过待生效”，收到目录回执才可上架。</Alert></Modal>
      <Modal title="申请下架" open={panel === "delist"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={() => updatePublication("delist")}>确认提交</Button></>}><Details values={{ 对象: asset.name, 版本: asset.version, 渠道: asset.type === "Skill" ? "科研技能" : "科研模型" }} /><Field label="原因" required><textarea minLength={5} maxLength={500} /></Field><Alert>下架只移除目录曝光与目录授权，不删除资产，也不声称已停用来源服务。</Alert></Modal>
      <Modal title="在科研任务中使用" open={panel === "use"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={attachToTask}>加入并进入会话</Button></>}><Details values={{ 资产: asset.name, 固定版本: asset.version, 目标上下文: context.name }} /><Field label="已有科研任务" required><select value={form.taskId ?? ""} onChange={(event) => setForm({ ...form, taskId: event.target.value })}><option value="">请选择当前空间可操作任务</option>{state.tasks.filter((task) => task.spaceId === context.id && !["COMPLETED", "CANCELLED"].includes(task.status) && canEdit(task, p, context.id, state)).map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}</select></Field><Alert>只添加指定版本的资料或候选能力，不自动执行、不切换模型、不触发有成本运行。</Alert><Link className="v-button" href={`/workspace?prefillAsset=${asset.id}`}>新建科研任务（进入工作台预填）</Link></Modal>
      <Modal title="复制到科研空间" open={panel === "copy"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={copyAsset}>确认复制</Button></>}><Details values={{ 来源: `${asset.name} ${asset.version}`, 原归属: state.spaces.find((item) => item.id === asset.spaceId)?.name, 目标空间: context.name }} /><Alert>生成独立对象并保留来源与使用限制；不会迁移原对象，也不会继承旧共享和上架。</Alert></Modal>
      <Modal title={panel === "restore" ? "恢复资产" : "归档资产"} open={panel === "archive" || panel === "restore"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={() => changeArchive(panel === "restore" ? "有效" : "已归档")}>确认</Button></>}><Details values={{ 运行引用: state.tasks.filter((task) => task.contextIds.includes(asset.id) || task.capabilityIds.includes(asset.id)).length, 有效共享: asset.shares.length, 审核中申请: state.requests.filter((request) => request.objectId === asset.id && request.status.includes("审核")).length, 已上架目录: asset.publishStatus === "已发布" ? 1 : 0 }} /><Alert>归档保留历史版本和引用，不物理删除来源对象；恢复不自动恢复旧共享或上架。</Alert></Modal>
      <Modal title="申请资产权限" open={panel === "permission"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={() => { mutate("已提交访问权限申请", asset.id, (draft, actor) => draft.requests.unshift({ id: uid("access"), objectId: asset.id, userId: actor.id, purpose: form.reason || "科研任务引用", status: "待审核", kind: "ACCESS", targetVersion: asset.version, createdAt: now() })); setPanel(""); }}>提交申请</Button></>}><Field label="需要的动作"><select><option>查看</option><option>引用</option></select></Field><Field label="申请原因" required><textarea onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field><Alert>提交不表示已经获得权限；生效后将重新读取实际 allowed actions。</Alert></Modal>
      <Modal title="版本详情" open={panel === "version"} onClose={() => setPanel("")}><Details values={(() => { const version = asset.versions.find((item) => item.id === form.versionId); return { 资产: asset.name, 版本: version?.number, 状态: version?.status, 创建人: version?.by ? userName(version.by) : "—", 创建时间: version?.at, 版本说明: version?.description }; })()} /><Alert>历史版本只读，不可覆盖；任务引用和发布目录均固定到明确版本。</Alert></Modal>
      <Modal title="继续建设" open={panel === "continue-build"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={continueBuild}>进入回流承接</Button></>}><Details values={{ 操作: `继续建设${asset.type}`, 对象: `${asset.name} ${asset.version}`, 归属: context.name, 建设环境: "AI 中台", 来源能力: asset.source.includes("待接入") ? "待接入" : "已声明" }} /><Alert>专业建设在 AI 中台完成；返回后仍需可信回执、版本与当前权限核验，不在本页复制开发界面。</Alert></Modal>
      <Modal title="更新方案模板版本" open={panel === "version-new"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={appendTemplateVersion}>保存正式版本</Button></>}><Files value={files} onChange={setFiles} /><Field label="版本说明" required><textarea maxLength={500} value={form.changeLog ?? ""} onChange={(event) => setForm({ ...form, changeLog: event.target.value })} /></Field><Alert>更新固定原资产和归属，只追加新版本；旧任务仍绑定历史版本。</Alert></Modal>
      <Modal title={`文件预览：${asset.type === "数据集" ? "数据样本" : "授权材料"}`} open={panel === "preview"} onClose={() => setPanel("")} wide>
        <Details values={{ 资产: asset.name, 版本: asset.version || "—", 来源: asset.source, 当前权限: actions.includes("content.read") ? "内容读取" : "仅元数据" }} />
        {asset.type === "数据集" ? (
          <><Alert>预览样本：前 20 行；不是全部数据。下载需独立权限。</Alert><Table headers={["sample_id", "temperature", "performance_value"]} rows={[["DEMO-001", "示例值", "示例值"], ["DEMO-002", "示例值", "示例值"]]} /></>
        ) : (
          <section className="rs-preview-copy">当前仅展示经授权的文本摘要；不执行 HTML、宏、脚本、Skill 包或模型代码。</section>
        )}
        {actions.includes("download") && <div className="v-actions v-section"><Button onClick={() => download(`${asset.name}-${asset.version || "draft"}.txt`, `${asset.name}\n版本：${asset.version || "—"}\n本文件为前端原型中的授权下载示例，不代表真实来源内容。`)}>下载授权示例文件</Button></div>}
      </Modal>
    </>
  );
}

function AssetOverview({ asset, state, actions, openPanel }: { asset: Asset; state: State; actions: string[]; openPanel: (value: string) => void }) {
  const common = {
    学科: asset.discipline,
    能力说明: asset.description,
    输入: asset.input || "来源未提供",
    输出: asset.output || "来源未提供",
    使用限制: asset.limitations,
  };
  const typeSpecific =
    asset.type === "数据集"
      ? { 数据来源: asset.source, 数据类型: "表格（示例）", 规模: "来源返回后展示", 字段权限: "内容读取独立鉴权" }
      : asset.type === "模型"
        ? { 研究用途: asset.description, 验证材料: asset.validation || "—", 技术版本: asset.version, 当前广场版本: asset.publishStatus === "已发布" ? asset.version : "—" }
        : asset.type === "方案模板"
          ? { 模板类型: asset.tags.find((item) => item.includes("方案")) ?? "研究方案", 适用场景: asset.description, 模板结构: "研究目标 → 约束 → 方法 → 结果确认" }
          : { 依赖摘要: asset.dependencies.join("、") || "来源未提供", 技术来源: asset.source, 版本材料: asset.version || "尚未就绪" };
  return (
    <>
      <Details values={{ ...common, ...typeSpecific }} />
      <details className="rs-source-details"><summary>来源与归属详情</summary><Details values={{ 建设来源: asset.source, 外部对象: asset.externalId || "—", 所属空间: state.spaces.find((item) => item.id === asset.spaceId)?.name, 创建人: userName(asset.ownerId), 来源任务: asset.taskId || "—", 来源产出: asset.artifactId || "—" }} /></details>
      <div className="v-actions">
        {actions.includes("content.read") && (asset.type === "数据集" || asset.type === "方案模板" || asset.type === "模型") && <Button onClick={() => openPanel("preview")}><FileSearch size={15} />预览可读材料</Button>}
        {actions.includes("edit") && asset.type !== "方案模板" && <Button onClick={() => openPanel("continue-build")}>继续建设 <ExternalLink size={14} /></Button>}
      </div>
    </>
  );
}

export function SpaceManagement({
  state,
  context,
  view,
  router,
  tabs,
}: {
  state: State;
  context: Space;
  view: string;
  router: Router;
  tabs: ReturnType<typeof researchSpaceManageTabs>;
}) {
  const { p, mutate } = useResearch();
  const [panel, setPanel] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const allowed = tabs.some((item) => item.id === view);
  if (!allowed) return <NoAccess contextId={context.id} />;
  const canManage = canManageSpace(state, p, context.id);
  const policy = state.spacePolicies?.[context.id] ?? {
    member: true,
    siblingTopic: true,
    project: true,
    download: false,
    copy: false,
    edit: false,
    approval: "跨课题需要审批",
    defaultVisibility: "创建者与已授权协作者",
    validDays: "长期或按上级策略",
    revision: 1,
  };
  const members = state.members.filter((item) => item.spaceId === context.id && item.status === "active");
  const topics = state.spaces.filter((item) => item.projectId === context.projectId && item.type === "TOPIC");

  function saveBasic() {
    const name = (form.name ?? context.name).trim();
    if (name.length < 2) return notify("请输入有效空间名称。");
    if (mutate("已更新空间基本信息", context.id, (draft, actor) => {
      if (!canManageSpace(draft, actor, context.id)) throw new Error("没有空间设置权限。");
      const item = draft.spaces.find((value) => value.id === context.id)!;
      item.name = name;
      item.description = form.description ?? item.description;
    })) setPanel("");
  }

  function addMember() {
    if (!form.userId) return notify("请选择授权候选成员。");
    if (mutate("已添加空间成员", context.id, (draft, actor) => {
      if (!canManageSpace(draft, actor, context.id)) throw new Error("没有成员管理权限。");
      if (draft.members.some((item) => item.userId === form.userId && item.spaceId === context.id && item.status === "active")) throw new Error("该成员已存在。");
      draft.members.push({ id: uid("member"), userId: form.userId, projectId: context.projectId, spaceId: context.id, role: (form.role || "Member") as Membership["role"], status: "active", joinedAt: now() });
    })) setPanel("");
  }

  function removeMember() {
    if (mutate("已移除空间成员", context.id, (draft, actor) => {
      if (!canManageSpace(draft, actor, context.id)) throw new Error("没有成员管理权限。");
      const reason = canRemoveMember(draft, context.id, form.userId);
      if (reason) throw new Error(reason);
      const member = draft.members.find((item) => item.id === form.memberId)!;
      member.status = "removed";
    })) setPanel("");
  }

  function saveMemberRole() {
    if (!form.role) return notify("请选择业务角色。");
    if (
      mutate("已更新成员业务角色", context.id, (draft, actor) => {
        if (!canManageSpace(draft, actor, context.id)) throw new Error("没有角色分配权限。");
        const member = draft.members.find((item) => item.id === form.memberId);
        if (!member || member.status !== "active") throw new Error("成员关系已失效。");
        if (member.role === "Space Admin") throw new Error("上级管理员任免不在此处理。");
        member.role = form.role as Membership["role"];
      })
    )
      setPanel("");
  }

  function createTopic() {
    if (!form.name?.trim() || !form.code?.trim()) return notify("请填写课题名称和编号。");
    if (mutate("已创建课题空间", context.id, (draft, actor) => {
      if (!canManageSpace(draft, actor, context.id)) throw new Error("没有课题空间创建权限。");
      if (draft.spaces.some((item) => item.projectId === context.projectId && item.code === form.code)) throw new Error("该正式课题已绑定空间。");
      const id = uid("topic");
      draft.spaces.push({ id, name: form.name.trim(), type: "TOPIC", projectId: context.projectId, ownerId: form.ownerId || actor.id, status: "ACTIVE", description: form.description || "", code: form.code, mapping: "", syncStatus: "待同步", createdAt: now(), parentSpaceId: context.type === "TOPIC" ? context.id : form.parentSpaceId || context.id });
      draft.members.push({ id: uid("member"), userId: actor.id, projectId: context.projectId, spaceId: id, role: "Space Admin", status: "active", joinedAt: now() });
    })) setPanel("");
  }

  function saveRole() {
    const name = form.name?.trim();
    if (!name) return notify("请输入业务角色名称。");
    if (mutate("已保存科研业务角色", context.id, (draft, actor) => {
      if (!canManageSpace(draft, actor, context.id)) throw new Error("没有角色管理权限。");
      draft.rolePermissions[`${context.id}:custom:${name}`] = ["view", ...(form.members === "1" ? ["members"] : []), ...(form.share === "1" ? ["share"] : [])];
    })) setPanel("");
  }

  function savePolicy() {
    if (mutate("已更新空间共享规则", context.id, (draft, actor) => {
      if (!canManageSpace(draft, actor, context.id)) throw new Error("没有共享规则修改权限。");
      draft.spacePolicies ??= {};
      draft.spacePolicies[context.id] = {
        ...policy,
        siblingTopic: form.siblingTopic === undefined ? policy.siblingTopic : form.siblingTopic === "1",
        download: form.download === "1",
        copy: form.copy === "1",
        edit: form.edit === "1",
        approval: form.approval || policy.approval,
        revision: policy.revision + 1,
      };
    })) setPanel("");
  }

  function changeSpaceLifecycle(target: Space["status"]) {
    if (context.type === "PROJECT") {
      notify("项目级生命周期操作需前往既有上级治理入口。");
      return;
    }
    if (
      mutate("已提交空间状态变更", context.id, (draft, actor) => {
        if (!canManageSpace(draft, actor, context.id)) throw new Error("没有空间状态管理权限。");
        const item = draft.spaces.find((value) => value.id === context.id)!;
        if (target === "ARCHIVED") {
          if (item.status !== "SUSPENDED") throw new Error("空间需先停用并处理依赖后才能归档。");
          const reason = canCloseSpace(draft, item.id);
          if (reason) throw new Error(reason);
        }
        if (item.status === "ARCHIVED" && target === "ACTIVE") throw new Error("归档空间必须先恢复为停用状态，再确认启用。");
        item.status = target;
      })
    )
      setPanel("");
  }

  const managementAction =
    view === "members" && canManage ? <Button primary onClick={() => setPanel("member-add")}><Plus size={15} />添加成员</Button> :
    view === "roles" && canManage ? <Button primary onClick={() => setPanel("role-new")}><Plus size={15} />新建业务角色</Button> :
    view === "topics" && canManage ? <Button primary onClick={() => setPanel("topic-new")}><Plus size={15} />新建课题空间</Button> : undefined;

  return (
    <>
      <div className="rs-page-head"><div><h2>{managementLabels[view]}</h2><p>当前空间：{context.name} · 管理查看不自动开放科研内容编辑。</p></div>{managementAction}</div>
      <div className="rs-manage-tabs" role="tablist">
        {tabs.map((item) => <Link role="tab" aria-selected={item.id === view} className={item.id === view ? "selected" : ""} key={item.id} href={contextPath(context.id, `manage/${item.id}`)}>{item.label}</Link>)}
      </div>
      {view === "basic" ? (
        <section className="v-card">
          <Details values={{ 空间名称: context.name, 空间简介: context.description, 空间类型: researchSpaceLabel(context), 所属租户: "炼化研究院", 关联正式项目: state.projects.find((item) => item.id === context.projectId)?.name || "—", 项目编号: state.projects.find((item) => item.id === context.projectId)?.code || "—", 业务负责人: userName(context.ownerId), 当前状态: spaceLabels[context.status], 来源映射: context.mapping || "尚未接入" }} />
          {canManage && <div className="v-actions"><Button onClick={() => { setForm({ name: context.name, description: context.description }); setPanel("basic-edit"); }}>编辑基本信息</Button><Button onClick={() => setPanel("lifecycle")}>生命周期操作</Button></div>}
          {context.syncStatus !== "已同步" && <Alert>来源未接入或同步异常；本地简介可维护，依赖来源的建设与运行操作不可用。</Alert>}
        </section>
      ) : view === "members" ? (
        <Table headers={["姓名 / 单位", "业务角色", "权限来源", "状态", "操作"]} rows={members.map((member) => { const user = Object.values(profiles).find((item) => item.id === member.userId); return [<span key="user">{user?.name ?? member.userId}<small>炼化研究院</small></span>, member.role, member.role === "Space Admin" ? "上级管理员" : "当前空间", <Badge key="state">有效</Badge>, <div key="action" className="v-actions"><Button onClick={() => { setForm({ memberId: member.id, userId: member.userId, role: member.role }); setPanel("permission-view"); }}>查看权限</Button>{canManage && member.role !== "Space Admin" && <Button onClick={() => { setForm({ memberId: member.id, userId: member.userId, role: member.role }); setPanel("member-role"); }}>设置角色</Button>}{canManage && <Button onClick={() => { setForm({ memberId: member.id, userId: member.userId }); setPanel("member-remove"); }}>移除</Button>}</div>]; })} empty="当前空间暂无成员。" />
      ) : view === "roles" ? (
        <><Table headers={["角色名称", "来源", "作用范围", "状态", "已绑定人数", "操作"]} rows={["Space Admin", "Topic Leader", "Member", "Asset Manager", "Viewer", ...Object.keys(state.rolePermissions).filter((key) => key.startsWith(`${context.id}:custom:`)).map((key) => key.split(":custom:")[1])].map((role) => [role, role.includes(" ") ? "预置" : "自定义", context.name, <Badge key="state">启用</Badge>, members.filter((member) => member.role === role).length, <Button key="action" onClick={() => { setForm({ role }); setPanel("permission-view"); }}>查看</Button>])} /><Alert>上级管理角色只读；科研业务角色不能创建、复制或伪装成平台/租户/项目管理员。</Alert></>
      ) : view === "topics" ? (
        context.type === "PERSONAL" ? <Empty>个人空间不提供课题管理。</Empty> : <Table headers={["课题 / 子课题", "负责人", "成员", "资产", "状态", "操作"]} rows={topics.map((topic) => [<span key="topic">{topic.name}<small>{topic.parentSpaceId === context.id && context.type === "TOPIC" ? "子课题" : "课题空间"}</small></span>, userName(topic.ownerId), state.members.filter((member) => member.spaceId === topic.id && member.status === "active").length, state.assets.filter((asset) => asset.spaceId === topic.id).length, <Badge key="state">{spaceLabels[topic.status]}</Badge>, <Button key="action" onClick={() => router.push(contextPath(topic.id))}>进入</Button>])} empty="当前项目还没有课题空间。" />
      ) : view === "sharing" ? (
        <section className="v-card rs-policy"><Details values={{ 上级策略: "项目共享规则 V3（只读）", 可共享对象: "本空间成员 / 同项目课题 / 项目公共区", 允许动作上限: `查看、引用${policy.download ? "、下载" : ""}${policy.copy ? "、复制" : ""}${policy.edit ? "、协作编辑" : ""}`, 跨课题共享: policy.approval, 新资产可见性: policy.defaultVisibility, 共享有效期: policy.validDays, 当前修订: `V${policy.revision}` }} />{canManage && <Button primary onClick={() => setPanel("policy-edit")}>编辑共享规则</Button>}<Alert>放宽规则只改变未来可授权上限，不会自动公开已有资产；收紧需先查看影响并确认回收。</Alert></section>
      ) : (
        <Table headers={["时间", "操作人", "操作", "对象", "结果", "操作"]} rows={state.audit.filter((item) => item.objectId === context.id || state.assets.some((asset) => asset.id === item.objectId && asset.spaceId === context.id)).map((item) => [item.at.slice(0, 16).replace("T", " "), userName(item.userId), item.action, state.assets.find((asset) => asset.id === item.objectId)?.name ?? context.name, <Badge key="result">{item.result ?? "成功"}</Badge>, <Button key="action" onClick={() => { setForm({ auditId: item.id }); setPanel("audit-view"); }}>详情</Button>])} empty="操作记录未接入或当前范围暂无记录。" />
      )}

      <Modal title="编辑空间基本信息" open={panel === "basic-edit"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={saveBasic}>保存</Button></>}><div data-unsaved={true}><Field label="空间名称" required><input value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="空间简介"><textarea value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Alert>正式项目名称、编号、负责人、租户归属和管理员任免均为只读来源字段。</Alert></div></Modal>
      <Modal title="添加成员" open={panel === "member-add"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={addMember}>确认添加</Button></>}><Field label="授权候选成员" required><select value={form.userId ?? ""} onChange={(event) => setForm({ ...form, userId: event.target.value })}><option value="">请选择</option>{Object.values(profiles).filter((profile) => profile.projects.includes(context.projectId) && !members.some((member) => member.userId === profile.id)).map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></Field><Field label="业务角色" required><select value={form.role ?? "Member"} onChange={(event) => setForm({ ...form, role: event.target.value })}>{["Topic Leader", "Member", "Asset Manager", "Viewer"].map((role) => <option key={role}>{role}</option>)}</select></Field><Alert>课题候选仅限当前项目有效成员；不在此创建 IAM 账号或任免上级管理员。</Alert></Modal>
      <Modal title="移除成员影响检查" open={panel === "member-remove"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={removeMember}>确认移除</Button></>}><Details values={{ 成员: userName(form.userId), 移除范围: context.name, 业务负责人职责: context.ownerId === form.userId ? "存在，需先交接" : "无", 正在运行任务: state.tasks.filter((task) => task.spaceId === context.id && task.ownerId === form.userId && !["COMPLETED", "CANCELLED"].includes(task.status)).length, 空间归属资产: "保留", 历史操作记录: "保留" }} /><Alert>移除只撤销当前范围成员关系，不删除 IAM 账号、资产或其他课题授权。</Alert></Modal>
      <Modal title="设置业务角色" open={panel === "member-role"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={saveMemberRole}>保存角色设置</Button></>}><Details values={{ 成员: userName(form.userId), 当前空间: context.name, 上级继承权限: "项目空间策略（只读）" }} /><Field label="可分配角色" required><select value={form.role ?? "Member"} onChange={(event) => setForm({ ...form, role: event.target.value })}>{["Topic Leader", "Member", "Asset Manager", "Viewer"].map((role) => <option key={role}>{role}</option>)}</select></Field><Field label="变更原因" required><textarea minLength={5} maxLength={500} /></Field><Alert>只操作当前管理人可委派角色；来源同步成功前不提前开放新增敏感动作，缩权先本地阻断。</Alert></Modal>
      <Modal title="科研业务角色" open={panel === "role-new"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={saveRole}>保存角色</Button></>}><Field label="角色名称" required><input value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="说明"><textarea /></Field><label className="rs-check"><input type="checkbox" onChange={(event) => setForm({ ...form, members: event.target.checked ? "1" : "" })} />查看/添加成员</label><label className="rs-check"><input type="checkbox" onChange={(event) => setForm({ ...form, share: event.target.checked ? "1" : "" })} />提交共享</label><Alert>权限候选受上级可委派集合限制；不包含项目开通、管理员任免、跨租户数据和技术部署。</Alert></Modal>
      <Modal title="有效权限" open={panel === "permission-view"} onClose={() => setPanel("")}><Details values={{ 主体: form.userId ? userName(form.userId) : form.role, 上下文: context.name, 查看资产: "允许 / 当前空间角色", 引用资产: "按对象共享与版本判断", 编辑内容: "不因管理查看自动允许", 分配管理员: "不允许" }} /><Alert>管理范围读取、直接授权、继承授权和来源拒绝分别计算；只读页面不授予权限。</Alert></Modal>
      <Modal title="新建课题空间" open={panel === "topic-new"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={createTopic}>创建课题空间</Button></>}><Details values={{ 所属项目: state.projects.find((item) => item.id === context.projectId)?.name, 父空间: context.name, 默认策略: "继承上级，不可突破上限" }} /><Field label="关联课题编号" required><input value={form.code ?? ""} onChange={(event) => setForm({ ...form, code: event.target.value })} /></Field><Field label="空间名称" required><input value={form.name ?? ""} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="空间简介"><textarea value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Alert>创建的是 AI4S 协作空间，不是正式科研项目或课题立项。</Alert></Modal>
      <Modal title="编辑共享规则" open={panel === "policy-edit"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>返回修改</Button><Button primary onClick={savePolicy}>确认提交变更</Button></>}><label className="rs-check"><input type="checkbox" defaultChecked={policy.siblingTopic} onChange={(event) => setForm({ ...form, siblingTopic: event.target.checked ? "1" : "0" })} />允许同项目课题作为共享目标</label><label className="rs-check"><input type="checkbox" defaultChecked={policy.download} onChange={(event) => setForm({ ...form, download: event.target.checked ? "1" : "0" })} />允许授予下载</label><label className="rs-check"><input type="checkbox" defaultChecked={policy.copy} onChange={(event) => setForm({ ...form, copy: event.target.checked ? "1" : "0" })} />允许授予复制</label><label className="rs-check"><input type="checkbox" defaultChecked={policy.edit} onChange={(event) => setForm({ ...form, edit: event.target.checked ? "1" : "0" })} />允许协作编辑</label><Field label="跨课题共享"><select defaultValue={policy.approval} onChange={(event) => setForm({ ...form, approval: event.target.value })}><option>跨课题需要审批</option><option>上级策略内可直接共享</option></select></Field><Alert>规则变更将生成影响记录；新增允许不会自动授予，拟回收动作先阻断新操作并等待来源回执。</Alert></Modal>
      <Modal title="空间状态变更" open={panel === "lifecycle"} onClose={() => setPanel("")} footer={context.type === "PROJECT" ? <Button onClick={() => { notify("项目级生命周期操作需前往既有上级治理入口。"); setPanel(""); }}>前往上级治理说明</Button> : <><Button onClick={() => setPanel("")}>取消</Button>{context.status === "ACTIVE" && <Button primary onClick={() => changeSpaceLifecycle("SUSPENDED")}>确认停用</Button>}{context.status === "SUSPENDED" && <><Button onClick={() => changeSpaceLifecycle("ACTIVE")}>恢复正常</Button><Button primary onClick={() => changeSpaceLifecycle("ARCHIVED")}>确认归档</Button></>}{context.status === "ARCHIVED" && <Button primary onClick={() => changeSpaceLifecycle("SUSPENDED")}>恢复为停用</Button>}</>}><Details values={{ 空间: context.name, 当前状态: spaceLabels[context.status], 允许路径: "正常 → 停用 → 已归档；恢复后先回停用", 影响检查: "运行任务 / 有效共享 / 待审核 / 下属空间 / 来源映射" }} /><Field label="变更原因" required><textarea minLength={5} maxLength={500} /></Field><Alert>项目级生命周期上提既有后台；当前前台不会提供含混的“关闭”或物理删除。</Alert></Modal>
      <Modal title="操作记录详情" open={panel === "audit-view"} onClose={() => setPanel("")}><Details values={(() => { const audit = state.audit.find((item) => item.id === form.auditId); return { 记录: audit?.id, 操作: audit?.action, 操作者: audit ? userName(audit.userId) : "—", 范围: context.name, 结果: audit?.result ?? "成功", 时间: audit?.at, request_id: audit?.requestId ?? "—" }; })()} /><Alert>日志只读，不提供编辑、删除、密钥查看或任意请求重放。</Alert></Modal>
    </>
  );
}

function BuildRequest({ requestId, state, router }: { requestId: string; state: State; router: Router }) {
  const request = state.requests.find((item) => item.id === requestId);
  const asset = request ? state.assets.find((item) => item.id === request.objectId) : undefined;
  if (!request || !asset) return <NoAccess />;
  return (
    <div className="v-research-space">
      <Button className="v-back" onClick={() => router.push(contextPath(asset.spaceId))}><ArrowLeft size={15} />返回科研资产</Button>
      <PageTitle title={`建设请求：${asset.name}`} eyebrow={`归属锁定 · ${asset.spaceId}`} />
      <section className="v-card rs-build">
        <div className="rs-steps"><span className="done">1 建设入口已准备</span><span>2 等待中台结果</span><span>3 校验来源</span><span>4 资产登记</span></div>
        <Alert>来源未接入：此页只核验建设结果，不显示中台开发界面，也不会把浏览器回跳当成可信完成凭据。</Alert>
        <Details values={{ request_id: request.id, 操作: request.purpose, 发起时归属: state.spaces.find((item) => item.id === asset.spaceId)?.name, 当前状态: request.status, 来源对象: asset.externalId || "待返回", 来源版本: asset.version || "待返回" }} />
        <div className="v-actions"><Button disabled>重新进入建设</Button><Button onClick={() => notify("来源未接入，当前无法核验建设结果。")}>核验建设结果</Button><Button onClick={() => router.push(contextPath(asset.spaceId))}>返回列表</Button></div>
      </section>
    </div>
  );
}
