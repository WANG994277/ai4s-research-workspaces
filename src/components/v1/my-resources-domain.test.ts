import test from "node:test";
import assert from "node:assert/strict";
import {
  filterPersonalResources,
  getPersonalResourceStats,
  createResourceDraft,
  submitResourceForReview,
  personalizeResources,
  canSaveResourceForProfile,
  personalResourceSeed,
  type PersonalResource,
} from "./my-resources-domain";

test("mock catalog has distinct resources across every supported type and relation", () => {
  assert.ok(personalResourceSeed.length >= 24);
  assert.equal(new Set(personalResourceSeed.map((item) => item.id)).size, personalResourceSeed.length);
  for (const kind of ["科研应用", "智能体", "Skill", "模型", "工具", "数据集", "知识", "实验设施", "工作流"]) {
    assert.ok(personalResourceSeed.some((item) => item.type === kind), `${kind} has examples`);
  }
  const stats = getPersonalResourceStats(personalResourceSeed, new Set(["r-app-rubber", "r-model-polymer"]));
  assert.deepEqual(stats, {
    available: personalResourceSeed.filter((item) => item.access === "available").length,
    created: personalResourceSeed.filter((item) => item.creationStatus).length,
    favorites: 2,
    applications: personalResourceSeed.filter((item) => item.application).length,
  });
});

test("drafts stay unavailable and personal relations belong to the current profile", () => {
  const draft = personalResourceSeed.find((item) => item.id === "r-workflow-literature")!;
  assert.equal(draft.access, "request");
  const otherProfile = personalizeResources(personalResourceSeed, "chen");
  assert.equal(otherProfile.filter((item) => item.creationStatus).length, 0);
  assert.equal(otherProfile.filter((item) => item.application).length, 0);
  assert.equal(canSaveResourceForProfile("lin", "chen", draft), false);
  assert.equal(canSaveResourceForProfile("lin", "lin", draft), true);
});

test("relation, type, keyword, scope and status filters combine without leaking other relations", () => {
  const result = filterPersonalResources(personalResourceSeed, new Set(["r-app-rubber"]), {
    relation: "我的收藏",
    type: "科研应用",
    query: "橡胶",
    scope: "配方优化课题",
    status: "可使用",
  });
  assert.deepEqual(result.map((item) => item.id), ["r-app-rubber"]);
  assert.ok(filterPersonalResources(personalResourceSeed, new Set(), {
    relation: "我的收藏", type: "全部", query: "", scope: "全部空间", status: "全部状态",
  }).length === 0);
  assert.ok(filterPersonalResources(personalResourceSeed, new Set(), {
    relation: "我的申请", type: "全部", query: "", scope: "全部空间", status: "审批中",
  }).every((item) => item.application?.status === "审批中"));
});

test("draft validation keeps invalid details and submission remains pending review", () => {
  assert.deepEqual(createResourceDraft({ name: " ", type: "智能体", scope: "", description: "" }, "u1", "draft-1"), {
    ok: false,
    error: "请填写资源名称、类型、所属空间和资源描述。",
  });
  const result = createResourceDraft({
    name: "配方验证助手", type: "智能体", scope: "配方优化课题", description: "汇总配方实验与性能证据。",
  }, "u1", "draft-1");
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.resource.creationStatus, "草稿");
  const submitted: PersonalResource = submitResourceForReview(result.resource);
  assert.equal(submitted.creationStatus, "审核中");
  assert.equal(submitted.access, "request");
  assert.equal(submitted.application, undefined);
});
