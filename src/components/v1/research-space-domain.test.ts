import test from "node:test";
import assert from "node:assert/strict";
import { createSeed, profiles, userName } from "./seed";
import {
  assetsForResearchContext,
  legacyResearchSpaceTarget,
  researchAssetActions,
  researchAssetDisplayActions,
  researchAssetDisplayStatus,
  researchAssetPublishChannel,
  researchAssetPublicationApprovalFlow,
  promotableAssetTypes,
  researchSpaceManageTabs,
  researchSpaceState,
} from "./research-space-domain";

test("publication approval follows the asset owning project", () => {
  const state = createSeed();
  const asset = state.assets.find((item) => item.id === "shared-b")!;
  asset.spaceId = "topic-ccus";
  asset.projectId = "p2";

  assert.deepEqual(
    researchAssetPublicationApprovalFlow(state, asset, "项目空间"),
    [
      { kind: "applicant", userId: asset.ownerId, name: userName(asset.ownerId), role: "申请人", status: "发起" },
      { kind: "approver", name: "王敏", role: "项目负责人", status: "待审批" },
    ],
  );
});

test("group publication appends the platform administrator approval", () => {
  const state = createSeed();
  const asset = state.assets.find((item) => item.id === "shared-b")!;
  asset.spaceId = "topic-ccus";
  asset.projectId = "p2";

  assert.deepEqual(
    researchAssetPublicationApprovalFlow(state, asset, "集团资源中心"),
    [
      { kind: "applicant", userId: asset.ownerId, name: userName(asset.ownerId), role: "申请人", status: "发起" },
      { kind: "approver", name: "王敏", role: "项目负责人", status: "待审批" },
      { kind: "approver", name: "平台管理员", role: "平台管理员", status: "待审批" },
    ],
  );
});

test("research assets use the four requested display states", () => {
  const state = createSeed();
  const asset = state.assets[0];
  asset.publishStatus = "未发布";
  asset.lifecycle = "草稿";
  assert.equal(researchAssetDisplayStatus(asset), "待确认");
  asset.publishStatus = "审核中";
  assert.equal(researchAssetDisplayStatus(asset), "审核中");
  asset.publishStatus = "待发布";
  assert.equal(researchAssetDisplayStatus(asset), "待发布");
  asset.publishStatus = "已发布";
  assert.equal(researchAssetDisplayStatus(asset), "已发布");
});

test("project assets are read-only while mine exposes confirm and publish by state", () => {
  assert.deepEqual(researchAssetDisplayActions("待确认", "project"), ["查看"]);
  assert.deepEqual(researchAssetDisplayActions("审核中", "project"), ["查看"]);
  assert.deepEqual(researchAssetDisplayActions("待发布", "project"), ["查看"]);
  assert.deepEqual(researchAssetDisplayActions("已发布", "project"), ["查看"]);
  assert.deepEqual(researchAssetDisplayActions("待确认", "mine"), ["查看", "确认"]);
  assert.deepEqual(researchAssetDisplayActions("审核中", "mine"), ["查看"]);
  assert.deepEqual(researchAssetDisplayActions("待发布", "mine"), ["查看", "发布"]);
  assert.deepEqual(researchAssetDisplayActions("已发布", "mine"), ["查看"]);
});

test("research asset publication channel follows the asset type", () => {
  assert.equal(researchAssetPublishChannel("智能体"), "科研智能体");
  assert.equal(researchAssetPublishChannel("Skill"), "科研技能");
  assert.equal(researchAssetPublishChannel("模型"), "科研模型");
  assert.equal(researchAssetPublishChannel("数据集"), "科研数据集");
  assert.equal(researchAssetPublishChannel("方案模板"), "科研资产目录");
});

test("personal context does not pull assets created by the same person in projects", () => {
  const state = createSeed();
  const profile = profiles.researcher;
  const personalId = `personal-${profile.id}`;
  const personal = state.assets.find((asset) => asset.id === "template")!;
  personal.spaceId = personalId;
  personal.projectId = "";
  const projectAsset = state.assets.find((asset) => asset.id === "dataset-shale")!;
  projectAsset.ownerId = profile.id;

  const ids = assetsForResearchContext(state, profile, personalId).map(
    (asset) => asset.id,
  );

  assert.ok(ids.includes(personal.id));
  assert.equal(ids.includes(projectAsset.id), false);
});

test("topic context includes explicit cross-topic grant without granting edit or download", () => {
  const state = createSeed();
  const profile = profiles.researcher;
  const asset = state.assets.find((item) => item.id === "shared-b")!;

  const visible = assetsForResearchContext(state, profile, "topic-a");
  const actions = researchAssetActions(state, profile, "topic-a", asset);

  assert.ok(visible.some((item) => item.id === asset.id));
  assert.ok(actions.includes("read"));
  assert.equal(actions.includes("edit"), false);
  assert.equal(actions.includes("download"), false);
});

test("only Skill and model expose publication actions", () => {
  const state = createSeed();
  const profile = profiles.researcher;
  for (const asset of state.assets) {
    if (asset.ownerId !== profile.id || asset.spaceId !== "topic-a") continue;
    const actions = researchAssetActions(state, profile, "topic-a", asset);
    assert.equal(
      actions.includes("publish.submit"),
      asset.type === "Skill" || asset.type === "模型",
      asset.type,
    );
  }
});

test("research asset state keeps lifecycle, version, source, review and listing separate", () => {
  const state = createSeed();
  const asset = state.assets.find((item) => item.id === "model-reservoir")!;
  asset.lifecycle = "有效";
  asset.availability = "维护中";
  asset.publishStatus = "审核中";
  asset.versions[0].status = "有效";

  assert.deepEqual(researchSpaceState(asset), {
    lifecycle: "ACTIVE",
    version: "READY",
    availability: "UNAVAILABLE",
    sync: "SUCCESS",
    review: "PENDING",
    listing: "UNLISTED",
  });
});

test("personal space only has basic management while managed project exposes six pages", () => {
  const state = createSeed();
  assert.deepEqual(
    researchSpaceManageTabs(
      state,
      profiles.researcher,
      `personal-${profiles.researcher.id}`,
    ).map((item) => item.id),
    ["basic"],
  );
  assert.deepEqual(
    researchSpaceManageTabs(state, profiles.manager, "project-p1").map(
      (item) => item.id,
    ),
    ["basic", "members", "roles", "topics", "sharing", "audit"],
  );
});

test("legacy routes converge on the current research-space context", () => {
  assert.equal(
    legacyResearchSpaceTarget("/assets", "topic-a"),
    "/research-spaces/topic-a/assets",
  );
  assert.equal(
    legacyResearchSpaceTarget("/space-management", "project-p1"),
    "/research-spaces/project-p1/manage/basic",
  );
});

test("research output promotion only offers asset types supported by the source", () => {
  assert.deepEqual(
    promotableAssetTypes({ type: "研究方案", content: "研究目标与实验条件" }),
    ["方案模板"],
  );
  assert.deepEqual(
    promotableAssetTypes({ type: "结构化数据", content: "sample_id,value" }),
    ["数据集"],
  );
  assert.deepEqual(
    promotableAssetTypes({ type: "研究报告", content: "普通文本结论" }),
    [],
  );
});
