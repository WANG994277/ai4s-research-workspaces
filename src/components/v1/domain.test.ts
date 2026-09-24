import test from "node:test";
import assert from "node:assert/strict";
import {
  canRead,
  canUse,
  canEdit,
  needsTask,
  reservationError,
  transitionTask,
  canCloseSpace,
} from "./domain";
import { createSeed, profiles } from "./seed";
test("private session stays private even for platform administrators", () => {
  const s = createSeed();
  assert.equal(canRead(s.sessions[0], profiles.admin, "topic-a", s), false);
});
test("same project does not expose sibling topic assets", () => {
  const s = createSeed();
  const a = s.assets.find((x) => x.id === "private-b")!;
  assert.equal(canRead(a, profiles.researcher, "topic-a", s), false);
});
test("read-only share permits discovery but forbids Agent use", () => {
  const s = createSeed();
  const a = s.assets.find((x) => x.id === "shared-b")!;
  assert.equal(canRead(a, profiles.researcher, "topic-a", s), true);
  assert.equal(canUse(a, profiles.researcher, "topic-a", s), false);
});
test("expired share grants no access", () => {
  const s = createSeed();
  const a = s.assets.find((x) => x.id === "shared-b")!;
  a.shares[0].validTo = "2000-01-01";
  assert.equal(canRead(a, profiles.researcher, "topic-a", s), false);
});
test("decision role cannot edit assets or run capabilities", () => {
  const s = createSeed();
  const a = s.assets.find((x) => x.id === "model-reservoir")!;
  assert.equal(canEdit(a, profiles.decision, "topic-a", s), false);
  assert.equal(canUse(a, profiles.decision, "topic-a", s), false);
});
test("simple question is session only; deep research becomes persistent task", () => {
  assert.equal(needsTask("翻译这句话", "快速分析"), false);
  assert.equal(needsTask("研究储层敏感性并形成报告", "深度研究"), true);
});
test("booking excludes overlaps, permits adjacent times, rejects reversed times", () => {
  const s = createSeed();
  const b = s.reservations[0];
  assert.match(reservationError(s, b.instrumentId, b.start, b.end), /预约/);
  assert.equal(
    reservationError(s, b.instrumentId, b.end, "2026-09-25T14:00"),
    "",
  );
  assert.match(reservationError(s, b.instrumentId, b.end, b.start), /时间/);
});
test("task state machine disallows completed task resume", () => {
  assert.equal(transitionTask("PAUSED", "resume"), "RUNNING");
  assert.throws(() => transitionTask("COMPLETED", "resume"));
});
test("space closure blocks outstanding tasks", () => {
  const s = createSeed();
  assert.match(canCloseSpace(s, "topic-a"), /未完成/);
});
test("revoked space membership blocks invocation while private session ownership stays intact", () => {
  const s = createSeed();
  s.members = s.members.map((m) =>
    m.userId === "lin" && m.spaceId === "topic-a"
      ? { ...m, status: "removed" }
      : m,
  );
  assert.equal(
    canUse(
      s.assets.find((a) => a.id === "model-reservoir")!,
      profiles.researcher,
      "topic-a",
      s,
    ),
    false,
  );
  assert.equal(canRead(s.sessions[0], profiles.researcher, "topic-a", s), true);
});
test("space permission template can revoke task creation", () => {
  const s = createSeed();
  s.rolePermissions["topic-a:Member"] = ["view"];
  assert.equal(
    canUse(
      s.assets.find((a) => a.id === "model-reservoir")!,
      profiles.researcher,
      "topic-a",
      s,
    ),
    false,
  );
});
test("read-only share of a SPACE asset cannot bypass invocation policy", () => {
  const s = createSeed();
  const a = s.assets.find((x) => x.id === "dataset-shale")!;
  a.shares.push({
    id: "ro-space",
    targetSpace: "topic-b",
    level: "只读",
    validTo: "",
    by: "lin",
    at: "2026-09-24",
  });
  assert.equal(canRead(a, profiles.leader, "topic-b", s), true);
  assert.equal(canUse(a, profiles.leader, "topic-b", s), false);
});
test("space view permission revocation removes non-owned resources", () => {
  const s = createSeed();
  const a = s.assets.find((x) => x.id === "dataset-shale")!;
  s.rolePermissions["topic-a:Topic Leader"] = [];
  assert.equal(canRead(a, profiles.leader, "topic-a", s), false);
});
test("archived source assets cannot be edited from a different active space", () => {
  const s = createSeed();
  s.spaces.find((x) => x.id === "topic-a")!.status = "ARCHIVED";
  assert.equal(
    canEdit(
      s.assets.find((a) => a.id === "dataset-shale")!,
      profiles.researcher,
      "personal-lin",
      s,
    ),
    false,
  );
});
test("research completion waits for experiment result confirmation", async () => {
  const { executionBlockReason } = await import("./domain");
  const s = createSeed();
  const t = s.tasks.find((x) => x.id === "task-plan")!;
  assert.match(executionBlockReason(s, t, profiles.researcher), /实验/);
  s.experiments[0].status = "已完成";
  assert.equal(executionBlockReason(s, t, profiles.researcher), "");
});
test("role union includes both research and management without duplicate navigation", async () => {
  const { modules, visibleModule } = await import("./navigation");
  const p = {
    ...profiles.researcher,
    roles: ["researcher", "manager"] as typeof profiles.researcher.roles,
  };
  const visible = modules.filter((m) => visibleModule(m.id, p));
  assert.equal(
    visible.some((m) => m.id === "workspace"),
    true,
  );
  assert.equal(
    visible.some((m) => m.id === "research-management"),
    true,
  );
  assert.equal(new Set(visible.map((m) => m.id)).size, visible.length);
  assert.equal(
    visible.some((m) => m.id === "admin"),
    false,
  );
});
test("ordinary project leader does not get global space management", async () => {
  const { visibleModule } = await import("./navigation");
  assert.equal(visibleModule("space-management", profiles.leader), false);
});
