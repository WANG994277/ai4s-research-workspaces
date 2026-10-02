import {
  canEdit,
  canEnter,
  canManageSpace,
  canRead,
  canShare,
  canUse,
  grant,
  spacePermission,
} from "./domain";
import type { Asset, Profile, Space, State } from "./types";
import { userName } from "./seed";

export type ResearchAssetAction =
  | "read"
  | "content.read"
  | "download"
  | "use"
  | "edit"
  | "share"
  | "copy"
  | "publish.submit"
  | "archive"
  | "restore"
  | "request";

export interface ResearchSpaceStateView {
  lifecycle: "DRAFT" | "ACTIVE" | "ARCHIVED";
  version: "DRAFT" | "READY" | "UNAVAILABLE";
  availability: "AVAILABLE" | "UNAVAILABLE" | "UNKNOWN";
  sync: "NOT_CONFIGURED" | "PENDING" | "SUCCESS" | "FAILED";
  review: "NOT_REQUIRED" | "PENDING" | "APPROVED" | "REJECTED";
  listing:
    | "UNLISTED"
    | "PENDING"
    | "LISTED"
    | "DELISTED"
    | "FAILED";
}

export type ResearchAssetDisplayStatus = "待确认" | "审核中" | "待发布" | "已发布";
export type ResearchAssetDisplayAction = "查看" | "确认" | "发布";

export function researchAssetDisplayStatus(asset: Asset): ResearchAssetDisplayStatus {
  if (/已发布|已上架/.test(asset.publishStatus)) return "已发布";
  if (/审核/.test(asset.publishStatus)) return "审核中";
  if (/待发布|待上架/.test(asset.publishStatus)) return "待发布";
  return "待确认";
}

export function researchAssetDisplayActions(
  status: ResearchAssetDisplayStatus,
  view: "project" | "mine",
): ResearchAssetDisplayAction[] {
  if (view === "project") return ["查看"];
  if (status === "待确认") return ["查看", "确认"];
  if (status === "待发布") return ["查看", "发布"];
  return ["查看"];
}

export function researchAssetPublishChannel(type: Asset["type"]) {
  if (type === "智能体") return "科研智能体";
  if (type === "Skill") return "科研技能";
  if (type === "模型") return "科研模型";
  if (type === "数据集") return "科研数据集";
  return "科研资产目录";
}

export type ResearchAssetPublicationVisibility = "项目空间" | "集团资源中心";

export interface ResearchAssetPublicationApprovalNode {
  kind: "applicant" | "approver";
  userId?: string;
  name: string;
  role: "申请人" | "项目负责人" | "平台管理员";
  status: "发起" | "待审批";
}

export function researchAssetPublicationApprovalFlow(
  state: State,
  asset: Asset,
  visibility: ResearchAssetPublicationVisibility,
): ResearchAssetPublicationApprovalNode[] {
  const owningSpace = state.spaces.find((space) => space.id === asset.spaceId);
  const projectId = owningSpace?.projectId || asset.projectId;
  const owningProject = state.projects.find((project) => project.id === projectId);
  const flow: ResearchAssetPublicationApprovalNode[] = [
    {
      kind: "applicant",
      userId: asset.ownerId,
      name: userName(asset.ownerId),
      role: "申请人",
      status: "发起",
    },
    {
      kind: "approver",
      name: owningProject?.owner || "未配置项目负责人",
      role: "项目负责人",
      status: "待审批",
    },
  ];
  if (visibility === "集团资源中心") {
    flow.push({
      kind: "approver",
      name: "平台管理员",
      role: "平台管理员",
      status: "待审批",
    });
  }
  return flow;
}

export const researchSpaceManageItems = [
  { id: "basic", label: "基本信息" },
  { id: "members", label: "成员" },
  { id: "roles", label: "角色与权限" },
  { id: "topics", label: "课题空间" },
  { id: "sharing", label: "共享规则" },
  { id: "audit", label: "操作记录" },
] as const;

function isDirectlySharedToContext(asset: Asset, contextId: string) {
  return asset.shares.some((share) => share.targetSpace === contextId);
}

function canReadInOwningScope(state: State, profile: Profile, asset: Asset) {
  return canEnter(state, profile, asset.spaceId)
    ? canRead(asset, profile, asset.spaceId, state)
    : false;
}

export function assetsForResearchContext(
  state: State,
  profile: Profile,
  contextId: string,
) {
  const context = state.spaces.find((space) => space.id === contextId);
  if (!context || !canEnter(state, profile, contextId)) return [];

  return state.assets.filter((asset) => {
    if (asset.denied?.includes(profile.id)) return false;
    if (context.type === "PERSONAL") {
      return (
        asset.spaceId === contextId ||
        (isDirectlySharedToContext(asset, contextId) &&
          grant(asset, profile, contextId) !== undefined)
      );
    }
    if (asset.projectId !== context.projectId) return false;
    if (context.type === "TOPIC") {
      return (
        asset.spaceId === contextId ||
        asset.visibility === "PROJECT" ||
        isDirectlySharedToContext(asset, contextId)
      ) && canRead(asset, profile, contextId, state);
    }
    return (
      asset.spaceId === contextId ||
      asset.visibility === "PROJECT" ||
      isDirectlySharedToContext(asset, contextId) ||
      canReadInOwningScope(state, profile, asset) ||
      (canManageSpace(state, profile, contextId) &&
        profile.managementProjects.includes(context.projectId))
    );
  });
}

export function researchAssetActions(
  state: State,
  profile: Profile,
  contextId: string,
  asset: Asset,
): ResearchAssetAction[] {
  const actions: ResearchAssetAction[] = [];
  const readable = assetsForResearchContext(state, profile, contextId).some(
    (item) => item.id === asset.id,
  );
  if (!readable) return ["request"];
  actions.push("read");
  const permission = grant(asset, profile, contextId)?.level;
  const editable = canEdit(asset, profile, contextId, state);
  const usable = canUse(asset, profile, contextId, state);
  const active = !["已归档", "已下架"].includes(asset.lifecycle);

  if (asset.type !== "数据集" || permission !== "只读")
    actions.push("content.read");
  if (usable) actions.push("use");
  if (editable && active) actions.push("edit");
  if (editable && active && canShare(asset, profile, contextId, state))
    actions.push("share");
  if (
    active &&
    usable &&
    (asset.ownerId === profile.id || permission === "可复制")
  )
    actions.push("copy");
  if (
    active &&
    editable &&
    asset.availability === "可用" &&
    (asset.type === "Skill" || asset.type === "模型")
  )
    actions.push("publish.submit");
  if (editable && active) actions.push("archive");
  if (editable && asset.lifecycle === "已归档") actions.push("restore");
  if (
    actions.includes("content.read") &&
    ["数据集", "方案模板"].includes(asset.type) &&
    (asset.ownerId === profile.id || permission === "可复制")
  )
    actions.push("download");
  return [...new Set(actions)];
}

export function researchSpaceState(asset: Asset): ResearchSpaceStateView {
  const lifecycle = asset.lifecycle === "已归档"
    ? "ARCHIVED"
    : asset.lifecycle === "草稿"
      ? "DRAFT"
      : "ACTIVE";
  const currentVersion = asset.versions.find(
    (version) => version.number === asset.version,
  );
  const version = !currentVersion || /草稿|等待/.test(currentVersion.status)
    ? "DRAFT"
    : /不可用|下架|失败/.test(currentVersion.status)
      ? "UNAVAILABLE"
      : "READY";
  const availability = asset.availability === "可用"
    ? "AVAILABLE"
    : asset.availability
      ? "UNAVAILABLE"
      : "UNKNOWN";
  const review = /审核中|待审核/.test(asset.publishStatus)
    ? "PENDING"
    : /驳回/.test(asset.publishStatus)
      ? "REJECTED"
      : /通过/.test(asset.publishStatus)
        ? "APPROVED"
        : "NOT_REQUIRED";
  const listing = /已发布|已上架/.test(asset.publishStatus)
    ? "LISTED"
    : /待上架/.test(asset.publishStatus)
      ? "PENDING"
      : /已下架/.test(asset.publishStatus)
        ? "DELISTED"
        : /失败/.test(asset.publishStatus)
          ? "FAILED"
          : "UNLISTED";
  const sync = /失败|异常/.test(asset.availability)
    ? "FAILED"
    : /等待|同步/.test(asset.lifecycle)
      ? "PENDING"
      : asset.source
        ? "SUCCESS"
        : "NOT_CONFIGURED";
  return { lifecycle, version, availability, sync, review, listing };
}

export function uniqueLabels(labels: string[]) {
  return [...new Set(labels.filter(Boolean))];
}

export function researchSpaceManageTabs(
  state: State,
  profile: Profile,
  contextId: string,
) {
  const space = state.spaces.find((item) => item.id === contextId);
  if (!space || !canEnter(state, profile, contextId)) return [];
  if (space.type === "PERSONAL") return [researchSpaceManageItems[0]];
  if (canManageSpace(state, profile, contextId)) return [...researchSpaceManageItems];
  const allowed = new Set(["basic"]);
  if (spacePermission(state, profile, contextId, "members"))
    allowed.add("members");
  if (spacePermission(state, profile, contextId, "roles"))
    allowed.add("roles");
  if (spacePermission(state, profile, contextId, "view"))
    allowed.add("audit");
  return researchSpaceManageItems.filter((item) => allowed.has(item.id));
}

export function legacyResearchSpaceTarget(path: string, contextId: string) {
  return path.startsWith("/space-management")
    ? `/research-spaces/${contextId}/manage/basic`
    : `/research-spaces/${contextId}/assets`;
}

export function researchSpaceLabel(space: Space) {
  return space.type === "PERSONAL"
    ? "个人空间"
    : space.type === "PROJECT"
      ? "项目空间"
      : "课题空间";
}

export function promotableAssetTypes(output: {
  type: string;
  content: string;
}): Asset["type"][] {
  const signature = `${output.type} ${output.content.slice(0, 200)}`;
  if (/结构化数据|数据表|CSV|dataset/i.test(signature)) return ["数据集"];
  if (/研究方案|实验方案|分析方案|方案草案|模板/.test(signature))
    return ["方案模板"];
  return [];
}
