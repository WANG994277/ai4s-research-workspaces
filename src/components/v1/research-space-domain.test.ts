import test from "node:test";
import assert from "node:assert/strict";
import { createSeed, profiles } from "./seed";
import { canEnter } from "./domain";
import {
  assetsForResearchContext,
  legacyResearchSpaceTarget,
  researchAssetActions,
  promotableAssetTypes,
  researchSpaceManageTabs,
  researchSpaceState,
  uniqueLabels,
} from "./research-space-domain";

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

test("platform administrator can enter every seeded project space", () => {
  const state = createSeed();
  const denied = state.spaces
    .filter((space) => space.type !== "PERSONAL")
    .filter((space) => !canEnter(state, profiles.admin, space.id));
  assert.deepEqual(denied.map((space) => space.id), []);
});

test("asset detail labels remove duplicates while preserving order", () => {
  assert.deepEqual(uniqueLabels(["材料科学", "材料科学", "智能体", "材料科学"]), [
    "材料科学",
    "智能体",
  ]);
});
