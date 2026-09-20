import assert from "node:assert/strict";
import { useDoStore } from "../src/components/do-space-v2/store";

const s = () => useDoStore.getState();
s().reset();
const id = s().createPlan(
  "验证温度与压力对甲醇选择性的影响",
  "PROJ-CCUS-01",
  "CO₂ 加氢制甲醇催化剂研究",
);
assert.equal(s().createTask(id), "", "未定版方案不能创建执行任务");
assert.equal(s().finalize(id), false, "未确认 AI 参数不能定版");
s().confirmParameters(id);
s().review(id, "发起会签", "请审核");
s().review(id, "同意", "参数和安全条件已核对");
assert.equal(s().finalize(id), true);
const original = structuredClone(s().plans.find((p) => p.id === id)!);
const newId = s().newVersion(id);
assert.equal(s().plans.find((p) => p.id === id)?.status, "已定版");
assert.equal(s().plans.find((p) => p.id === newId)?.version, 2);
assert.deepEqual(
  s().plans.find((p) => p.id === id)?.parameters,
  original.parameters,
);
const taskId = s().createTask(id);
assert.ok(taskId);
assert.equal(s().dispatch(taskId), false, "未经前置检查不能下发");
const booking = {
  projectId: "PROJ-CCUS-01",
  planId: id,
  taskId,
  equipmentId: "EQ-01",
  date: "2026-09-24",
  start: 10,
  end: 12,
  sampleId: "S-01",
  owner: "张博士",
  purpose: "催化活性测试",
};
assert.ok(s().book(booking));
assert.equal(
  s().book({ ...booking, start: 11, end: 13 }),
  "",
  "重叠预约必须阻断",
);
assert.equal(
  s().book({ ...booking, equipmentId: "EQ-04" }),
  "",
  "维护设备不能预约",
);
assert.equal(
  s().book({ ...booking, start: 13, end: 12 }),
  "",
  "无效时段必须阻断",
);
s().updateTask(taskId, {
  sampleIds: ["S-01"],
  equipmentId: "EQ-01",
  owner: "张博士",
  checks: ["样品条件", "设备与预约", "高风险实验", "实验前审核"],
});
assert.equal(s().dispatch(taskId), false, "审批中预约不能下发");
const b = s().bookings.find((b) => b.taskId === taskId)!;
s().setBookingStatus(b.id, "已确认");
assert.equal(s().dispatch(taskId), true);
s().advance(taskId);
s().raiseException(taskId, "温控波动");
const progress = s().tasks.find((t) => t.id === taskId)!.step;
s().advance(taskId);
assert.equal(
  s().tasks.find((t) => t.id === taskId)!.step,
  progress,
  "异常未处理禁止继续执行",
);
assert.equal(s().resume(taskId), false);
s().resolveException(taskId, "检查温控系统并复核样品，允许继续");
assert.equal(s().resume(taskId), true);
assert.equal(
  s().changeParameter(taskId, "温度", "900", "校准测试"),
  false,
  "参数变更不能超设备量程",
);
assert.equal(
  s().tasks.find((t) => t.id === taskId)!.parameters[0].value,
  original.parameters[0].value,
);
const safeStep = s().tasks.find((t) => t.id === taskId)!.step;
s().setBookingStatus(b.id, "已取消");
s().advance(taskId);
assert.equal(
  s().tasks.find((t) => t.id === taskId)!.step,
  safeStep,
  "预约撤销后禁止继续推进",
);
const invalid = s().createPlan(
  "超设备量程验证",
  "PROJ-CCUS-01",
  "CO₂ 加氢制甲醇催化剂研究",
);
const invalidPlan = s().plans.find((p) => p.id === invalid)!;
s().updatePlan(invalid, {
  parameters: invalidPlan.parameters.map((p, i) => ({
    ...p,
    value: i === 0 ? "900" : p.value,
    confirmed: true,
  })),
});
s().review(invalid, "发起会签", "检查量程");
s().review(invalid, "同意", "已查看");
assert.equal(s().finalize(invalid), false, "超过设备量程的参数禁止定版");
console.log("做空间：定版守卫、版本隔离、预约冲突、人工审核、异常阻断测试通过");
