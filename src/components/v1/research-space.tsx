"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Box,
  CalendarDays,
  Database,
  Eye,
  FileText,
  FolderKanban,
  LockKeyhole,
  Network,
  Play,
  Share2,
  UserRound,
} from "lucide-react";
import {
  canEdit,
  canEnter,
  canManageSpace,
  now,
  permissionLabel,
  uid,
} from "./domain";
import {
  assetsForResearchContext,
  researchAssetActions,
  researchSpaceLabel,
  researchSpaceManageTabs,
  researchSpaceState,
  uniqueLabels,
} from "./research-space-domain";
import { userName } from "./seed";
import { addContext, notify, useResearch } from "./store";
import { ResearchAssetList } from "./research-space-list";
import { ResearchSpaceManagement } from "./research-space-management";
import type { Asset, Space, State } from "./types";
import {
  Alert,
  Badge,
  Button,
  Confirm,
  Details,
  Field,
  Modal,
  PageTitle,
  Table,
  Tabs,
} from "./ui";

type Router = ReturnType<typeof useRouter>;

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function contextPath(contextId: string, suffix = "assets") {
  return `/research-spaces/${encodeURIComponent(contextId)}/${suffix}`;
}

const assetDetailVisual = {
  智能体: { Icon: Bot, className: "agent" },
  Skill: { Icon: Network, className: "skill" },
  模型: { Icon: Box, className: "model" },
  数据集: { Icon: Database, className: "dataset" },
  方案模板: { Icon: FileText, className: "template" },
} satisfies Record<Asset["type"], { Icon: typeof Bot; className: string }>;

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
    document.body.classList.add("rs-theme");
    return () => document.body.classList.remove("rs-theme");
  }, []);

  useEffect(() => {
    if (!loaded || requestId) return;
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
  const manageView = valueOf(params.view) ?? "spaces";
  const manageTabs = researchSpaceManageTabs(s, p, context.id);

  return (
    <div className={`v-research-space${managing ? " rs-management-surface" : ""}`}>
      {managing ? (
        <SpaceManagement
          state={s}
          context={context}
          view={manageView}
          tabs={manageTabs}
        />
      ) : (
        <>
          <PageTitle
            title="科研空间"
            eyebrow={`${researchSpaceLabel(context)} · ${context.name}`}
          />
          <div className="rs-module-nav" role="tablist" aria-label="科研空间功能">
            <Link
              role="tab"
              aria-selected="true"
              className="selected"
              href={contextPath(context.id)}
            >
              科研资产
            </Link>
            {manageTabs.length > 0 && (
              <Link
                role="tab"
                aria-selected="false"
                href={contextPath(context.id, "manage/spaces")}
              >
                空间管理
              </Link>
            )}
          </div>
          {assetKey ? (
            <AssetDetail
              state={s}
              context={context}
              assetKey={decodeURIComponent(assetKey)}
              router={router}
            />
          ) : (
            <AssetList state={s} context={context} router={router} />
          )}
        </>
      )}
    </div>
  );
}

function AssetList({
  state,
  context,
}: {
  state: State;
  context: Space;
  router: Router;
}) {
  return <ResearchAssetList state={state} context={context} />;
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
  const actions = asset ? researchAssetActions(state, p, context.id, asset) : [];
  if (!asset) return <NoAccess contextId={context.id} />;
  const assetId = asset.id;
  const tabs = [
    { id: "overview", label: "概览" },
    { id: "versions", label: "版本管理" },
    { id: "shares", label: "共享权限" },
    { id: "publishing", label: "发布记录" },
    { id: "usage", label: "使用记录" },
  ];
  const capability = ["智能体", "Skill", "模型"].includes(asset.type);

  function setTab(value: string) {
    router.replace(`${contextPath(context.id)}/${encodeURIComponent(assetId)}?tab=${value}`);
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

  const visual = assetDetailVisual[asset.type];
  const DetailIcon = visual.Icon;
  const owningSpace = state.spaces.find((item) => item.id === asset.spaceId);
  const createdAt = asset.versions[0]?.at ?? asset.updatedAt;
  const visibilityLabel = asset.visibility === "PRIVATE" ? "仅本人可见" : asset.visibility === "PROJECT" ? "项目内可见" : asset.visibility === "PUBLIC" ? "公开可见" : "空间内可见";
  const headerActions = <div className="v-actions rs-detail-actions">
    {actions.includes("use") && <Button primary onClick={() => setPanel("use")}><Play size={16} />打开使用</Button>}
    {actions.includes("share") && <Button onClick={() => setPanel("share")}><Share2 size={16} />共享</Button>}
    {actions.includes("publish.submit") && <Button onClick={() => setPanel("publish")}>申请发布</Button>}
  </div>;

  return (
    <>
      <Button className="v-back" onClick={() => router.push(contextPath(context.id))}><ArrowLeft size={15} />返回资产列表</Button>
      <section className="rs-detail-hero">
        <span className={`rs-detail-icon ${visual.className}`}><DetailIcon size={46} /></span>
        <div className="rs-detail-summary">
          <h2>{asset.name}</h2>
          <p>{asset.description}</p>
          <div className="rs-detail-meta">
            <span><UserRound size={16} />{userName(asset.ownerId)}</span>
            <span><CalendarDays size={16} />{asset.updatedAt.slice(0, 16).replace("T", " ")}</span>
            <span><FolderKanban size={16} />{owningSpace?.name ?? "个人空间"}</span>
            <span><Eye size={16} />{visibilityLabel}</span>
            <span>当前权限：{permissionLabel(asset, p, context.id, state)}</span>
          </div>
          <div className="rs-detail-statuses"><StateBadges asset={asset} /></div>
        </div>
        {headerActions}
        {researchSpaceState(asset).availability !== "AVAILABLE" && (
          <Alert>来源未接入或暂不可用；允许披露的科研元数据可查看，新增调用与受限正文已阻断。</Alert>
        )}
      </section>
      <div className="rs-detail-tabs">
        <Tabs items={tabs.map((item) => item.label)} value={tabs.find((item) => item.id === tab)?.label ?? "概览"} onChange={(label) => setTab(tabs.find((item) => item.label === label)?.id ?? "overview")} />
      </div>
      <section className="v-card rs-detail-panel">
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
          <AssetOverview asset={asset} state={state} createdAt={createdAt} />
        )}
      </section>
      <Modal title="共享资产" open={panel === "share"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={shareAsset}>确认共享</Button></>}>
        <Field label="版本" required><input value={asset.version || "尚无就绪版本"} readOnly /></Field><Field label="共享目标" required><select value={form.target ?? ""} onChange={(event) => setForm({ ...form, target: event.target.value })}><option value="">请选择当前项目内有权空间</option>{state.spaces.filter((item) => item.projectId === context.projectId && item.id !== asset.spaceId && canEnter(state, p, item.id)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="权限预设"><select value={form.level ?? "可引用"} onChange={(event) => setForm({ ...form, level: event.target.value })}>{["只读", "可引用", "可复制", "可协作"].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="有效期"><input type="date" value={form.validTo ?? ""} onChange={(event) => setForm({ ...form, validTo: event.target.value })} /></Field><Alert>查看、引用、下载、复制、协作编辑是独立动作；当前原型权限预设不会自动授予下载。</Alert>
      </Modal>
      <Modal title="申请发布" open={panel === "publish"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={publishAsset}>提交发布申请</Button></>}><Details values={{ 资产: asset.name, 版本: asset.version, 发布渠道: asset.type === "Skill" ? "科研技能" : "科研模型", 受众: "当前租户", 来源状态: asset.availability }} /><Field label="申请说明" required><textarea onChange={(event) => setForm({ ...form, reason: event.target.value })} /></Field><Alert>审核通过、目录上架与来源可用分别判断；本次申请不会覆盖已上架旧版本。</Alert></Modal>
      <Modal title="申请详情及授权审批" open={panel === "review"} onClose={() => setPanel("")} footer={(() => { const request = state.requests.find((item) => item.id === form.requestId); if (!request || request.status !== "待审核") return <Button onClick={() => setPanel("")}>关闭</Button>; if (request.userId === p.id) return <><Button onClick={() => setPanel("")}>关闭</Button><Button onClick={() => updatePublication("withdraw")}>撤回申请</Button></>; if (canManageSpace(state, p, context.id)) return <><Button onClick={() => updatePublication("reject")}>驳回</Button><Button primary onClick={() => updatePublication("approve")}>通过</Button></>; return <Button onClick={() => setPanel("")}>关闭</Button>; })()}><Details values={(() => { const request = state.requests.find((item) => item.id === form.requestId); return { 申请单: request?.id, 类型: request?.kind === "DELIST" ? "下架申请" : `${asset.type}发布`, 申请人: request ? userName(request.userId) : "—", 版本: request?.targetVersion, 受众: "当前租户", 状态: request?.status, 归属: context.name }; })()} /><Alert>通过前重新校验来源版本、状态、受众与动作；通过后先显示“通过待生效”，收到目录回执才可上架。</Alert></Modal>
      <Modal title="申请下架" open={panel === "delist"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={() => updatePublication("delist")}>确认提交</Button></>}><Details values={{ 对象: asset.name, 版本: asset.version, 渠道: asset.type === "Skill" ? "科研技能" : "科研模型" }} /><Field label="原因" required><textarea minLength={5} maxLength={500} /></Field><Alert>下架只移除目录曝光与目录授权，不删除资产，也不声称已停用来源服务。</Alert></Modal>
      <Modal title="在科研任务中使用" open={panel === "use"} onClose={() => setPanel("")} footer={<><Button onClick={() => setPanel("")}>取消</Button><Button primary onClick={attachToTask}>加入并进入会话</Button></>}><Details values={{ 资产: asset.name, 固定版本: asset.version, 目标上下文: context.name }} /><Field label="已有科研任务" required><select value={form.taskId ?? ""} onChange={(event) => setForm({ ...form, taskId: event.target.value })}><option value="">请选择当前空间可操作任务</option>{state.tasks.filter((task) => task.spaceId === context.id && !["COMPLETED", "CANCELLED"].includes(task.status) && canEdit(task, p, context.id, state)).map((task) => <option key={task.id} value={task.id}>{task.name}</option>)}</select></Field><Alert>只添加指定版本的资料或候选能力，不自动执行、不切换模型、不触发有成本运行。</Alert><Link className="v-button" href={`/workspace?prefillAsset=${asset.id}`}>新建科研任务（进入工作台预填）</Link></Modal>
      <Modal title="版本详情" open={panel === "version"} onClose={() => setPanel("")}><Details values={(() => { const version = asset.versions.find((item) => item.id === form.versionId); return { 资产: asset.name, 版本: version?.number, 状态: version?.status, 创建人: version?.by ? userName(version.by) : "—", 创建时间: version?.at, 版本说明: version?.description }; })()} /><Alert>历史版本只读，不可覆盖；任务引用和发布目录均固定到明确版本。</Alert></Modal>
    </>
  );
}

function AssetOverview({ asset, state, createdAt }: { asset: Asset; state: State; createdAt: string }) {
  const owningSpace = state.spaces.find((item) => item.id === asset.spaceId);
  return (
    <section className="rs-basic-info-card">
      <h3>基本信息</h3>
      <dl className="rs-basic-info-grid">
        <div><dt>名称</dt><dd>{asset.name}</dd></div>
        <div><dt>类型</dt><dd><span className={`rs-type-badge ${assetDetailVisual[asset.type].className}`}>{asset.type}</span></dd></div>
        <div><dt>所属空间</dt><dd>{owningSpace?.name ?? "个人空间"}</dd></div>
        <div><dt>创建人</dt><dd>{userName(asset.ownerId)}</dd></div>
        <div><dt>创建时间</dt><dd>{createdAt.slice(0, 16).replace("T", " ")}</dd></div>
        <div><dt>最新版本</dt><dd>{asset.version || "尚无就绪版本"}</dd></div>
        <div className="full"><dt>适用领域</dt><dd className="rs-detail-tags">{uniqueLabels([asset.discipline, ...asset.tags.slice(0, 3)]).map((tag) => <span key={tag}>{tag}</span>)}</dd></div>
        <div className="full"><dt>简介</dt><dd>{asset.description}</dd></div>
        <div className="full"><dt>关键词</dt><dd className="rs-detail-tags">{asset.tags.length ? uniqueLabels(asset.tags).map((tag) => <span key={tag}>{tag}</span>) : "—"}</dd></div>
      </dl>
    </section>
  );
}

function SpaceManagement({
  state,
  context,
  view,
  tabs,
}: {
  state: State;
  context: Space;
  view: string;
  tabs: ReturnType<typeof researchSpaceManageTabs>;
}) {
  return <ResearchSpaceManagement state={state} context={context} view={view} tabs={[...tabs]} />;
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
