"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Artifact, Asset, AssetType, Scoped } from "./types";
import { useResearch, addContext } from "./store";
import {
  canEdit,
  canShare,
  canRead,
  canUse,
  hasRole,
  now,
  permissionLabel,
  uid,
  writable,
} from "./domain";
import { assetTypes, disciplines, userName } from "./seed";
import {
  pickerResources,
  type ResourcePickerMode,
} from "./resource-picker-options";
import {
  Alert,
  Button,
  Details,
  Empty,
  Field,
  Modal,
  SearchBox,
  Select,
} from "./ui";
export function ContextActions({
  object,
  capability = false,
}: {
  object: Scoped;
  capability?: boolean;
}) {
  const { s, p, space } = useResearch();
  const router = useRouter();
  const [choose, setChoose] = useState(false);
  const [task, setTask] = useState("");
  const allowed =
    capability || "publishStatus" in object || "authorization" in object
      ? canUse(object, p, space.id, s)
      : canRead(object, p, space.id, s) &&
        hasRole(p, "researcher", "leader", "analyst") &&
        writable(s, p, space.id);
  return (
    <>
      <Button
        primary
        disabled={!allowed}
        onClick={() => {
          if (addContext([object.id], capability)) router.push("/workspace");
        }}
      >
        加入 Research Agent
      </Button>
      <Button disabled={!allowed} onClick={() => setChoose(true)}>
        加入当前研究
      </Button>
      <Modal
        title="加入当前研究"
        open={choose}
        onClose={() => setChoose(false)}
        footer={
          <>
            <Button onClick={() => setChoose(false)}>取消</Button>
            <Button
              primary
              disabled={!task}
              onClick={() => {
                if (addContext([object.id], capability, task)) setChoose(false);
              }}
            >
              确认加入
            </Button>
          </>
        }
      >
        <Field label="Research Task">
          <select value={task} onChange={(e) => setTask(e.target.value)}>
            <option value="">选择当前研究</option>
            {s.tasks
              .filter(
                (t) =>
                  t.spaceId === space.id &&
                  canEdit(t, p, space.id, s) &&
                  !["COMPLETED", "CANCELLED"].includes(t.status),
              )
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </Field>
      </Modal>
    </>
  );
}
export function SaveAsset({
  artifact,
  open,
  onClose,
}: {
  artifact: Artifact;
  open: boolean;
  onClose: () => void;
}) {
  const { s, p, space, mutate } = useResearch();
  const [name, setName] = useState(artifact.name);
  const [type, setType] = useState<AssetType>("方案模板");
  const [target, setTarget] = useState("我的资产");
  const [description, setDescription] = useState(artifact.content);
  const [error, setError] = useState("");
  return (
    <Modal
      title="保存为科研资产"
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            primary
            onClick={() => {
              if (!name.trim()) {
                setError("请输入资产名称。");
                return;
              }
              const ok = mutate("已保存为科研资产", artifact.id, (d, u) => {
                if (!canEdit(artifact, u, space.id, d))
                  throw new Error("当前没有保存此产出的权限。");
                if (artifact.assetId) throw new Error("该产出已沉淀为资产。");
                if (target === "项目公共资产" && !hasRole(u, "leader"))
                  throw new Error("没有项目公共资产发布权限。");
                if (target !== "我的资产" && !space.projectId)
                  throw new Error("请在项目或课题空间中保存。");
                const id = uid("asset");
                const version = {
                  id: uid("version"),
                  number: "V1.0",
                  description: "由科研产出沉淀",
                  at: now(),
                  by: u.id,
                  status: "有效",
                };
                const a: Asset = {
                  id,
                  name: name.trim(),
                  type,
                  discipline: "地球科学",
                  description,
                  ownerId: u.id,
                  projectId: artifact.projectId,
                  spaceId: artifact.spaceId,
                  visibility:
                    target === "我的资产"
                      ? "PRIVATE"
                      : target === "项目公共资产"
                        ? "PROJECT"
                        : "SPACE",
                  shares: [],
                  updatedAt: now(),
                  source: "Research Agent",
                  version: "V1.0",
                  versions: [version],
                  publishStatus: "未发布",
                  lifecycle: "有效",
                  availability: "可用",
                  provider: u.name,
                  tags: [],
                  input: "来源科研任务的输入",
                  output: "已确认科研产出",
                  limitations: "按来源与使用范围复用",
                  validation: "科研人员确认",
                  taskId: artifact.taskId,
                  sessionId: artifact.sessionId,
                  stepId: artifact.stepId,
                  artifactId: artifact.id,
                  dependencies: [],
                  schema: [
                    {
                      name: "input",
                      label: "科研任务",
                      type: "text",
                      required: true,
                    },
                  ],
                };
                d.assets.unshift(a);
                const original = d.artifacts.find((x) => x.id === artifact.id);
                if (original) {
                  original.assetId = id;
                  original.status = "已沉淀为资产";
                }
              });
              if (ok) onClose();
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <Field label="资产名称" required>
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="资产类型">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as AssetType)}
        >
          {assetTypes.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="保存位置">
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option>我的资产</option>
          <option disabled={space.type !== "TOPIC"}>当前课题资产</option>
          <option disabled={!hasRole(p, "leader") || !space.projectId}>
            项目公共资产
          </option>
        </select>
      </Field>
      <Field label="简介">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      {error && <Alert>{error}</Alert>}
      <Details
        values={{
          来源任务:
            s.tasks.find((t) => t.id === artifact.taskId)?.name ?? "独立调用",
          来源版本: artifact.version,
          所属空间: s.spaces.find((x) => x.id === artifact.spaceId)?.name,
        }}
      />
    </Modal>
  );
}
export function ShareAsset({
  asset,
  open,
  onClose,
}: {
  asset: Asset;
  open: boolean;
  onClose: () => void;
}) {
  const { s, p, space, mutate } = useResearch();
  const [targetType, setTargetType] = useState("指定课题空间");
  const [target, setTarget] = useState("");
  const [level, setLevel] = useState("只读");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  return (
    <Modal
      title="分享资产"
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            primary
            onClick={() => {
              if (!target) {
                setError("请选择分享目标。");
                return;
              }
              if (expiry && Date.parse(expiry) < Date.now()) {
                setError("有效期应晚于今天。");
                return;
              }
              if (
                mutate("已分享科研资产", asset.id, (d, u) => {
                  if (!canShare(asset, u, space.id, d))
                    throw new Error("没有共享权限。");
                  const a = d.assets.find((x) => x.id === asset.id)!;
                  a.shares.push({
                    id: uid("share"),
                    ...(targetType === "指定成员"
                      ? { targetUser: target }
                      : { targetSpace: target }),
                    level: level as "只读",
                    validTo: expiry,
                    by: u.id,
                    at: now(),
                  });
                  a.lifecycle = "已共享";
                })
              )
                onClose();
            }}
          >
            确认分享
          </Button>
        </>
      }
    >
      <Field label="分享目标类型">
        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setTarget("");
          }}
        >
          {["项目空间", "指定课题空间", "指定成员"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="分享目标" required>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">请选择</option>
          {targetType === "指定成员"
            ? Array.from(
                new Set(
                  s.members
                    .filter(
                      (m) =>
                        m.projectId === asset.projectId &&
                        m.status === "active" &&
                        m.userId !== p.id,
                    )
                    .map((m) => m.userId),
                ),
              ).map((id) => (
                <option key={id} value={id}>
                  {userName(id)}
                </option>
              ))
            : s.spaces
                .filter(
                  (sp) =>
                    sp.projectId === asset.projectId &&
                    sp.id !== asset.spaceId &&
                    sp.type ===
                      (targetType === "项目空间" ? "PROJECT" : "TOPIC"),
                )
                .map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.name}
                  </option>
                ))}
        </select>
      </Field>
      <Field label="权限级别">
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {["只读", "可引用", "可复制", "可协作"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field label="有效期（留空为长期有效）">
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
      </Field>
      <p className="v-muted">分享不会改变原资产归属。</p>
      {error && <Alert>{error}</Alert>}
    </Modal>
  );
}
export function PermissionRequest({
  objectId,
  open,
  onClose,
}: {
  objectId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { space, mutate } = useResearch();
  const [purpose, setPurpose] = useState("");
  return (
    <Modal
      title="申请访问权限"
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            primary
            disabled={!purpose.trim()}
            onClick={() => {
              if (
                mutate("已记录本地权限申请", objectId, (d, p) => {
                  d.requests.push({
                    id: uid("request"),
                    objectId,
                    userId: p.id,
                    purpose,
                    status: "待处理",
                  });
                })
              )
                onClose();
            }}
          >
            提交申请
          </Button>
        </>
      }
    >
      <Field label="使用目的" required>
        <textarea
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
        />
      </Field>
      <Details values={{ 当前空间: space.name, 申请权限: "可引用 / 可调用" }} />
      <Alert>原型仅保存本地申请记录，未连接审批系统。</Alert>
    </Modal>
  );
}
export function ExternalJump({
  kind,
  open,
  onClose,
}: {
  kind: string;
  open: boolean;
  onClose: () => void;
}) {
  const { s, p, space, mutate } = useResearch();
  const [status, setStatus] = useState("");
  return (
    <Modal
      title={
        kind === "科研项目管理系统"
          ? "进入科研项目管理系统"
          : "进入 AI 中台 · " + kind
      }
      open={open}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>返回</Button>
          <Button
            primary
            onClick={() => {
              mutate("已检查外部系统连接", kind, () => {});
              setStatus(
                "尚未配置外部系统连接地址，当前无法跳转。上下文已保留。",
              );
            }}
          >
            继续
          </Button>
        </>
      }
    >
      <Details
        values={{
          当前用户: p.name,
          当前项目:
            s.projects.find((x) => x.id === space.projectId)?.name ?? "无",
          当前空间: space.name,
          返回位置:
            kind === "科研项目管理系统" ? "当前页面" : "科研资产 · 我的资产",
          连接状态: "未配置",
        }}
      />
      {status && <Alert>{status}</Alert>}
      <p className="v-muted">
        创建与开发在 AI 中台完成，返回后登记到科研资产。
      </p>
    </Modal>
  );
}
export function ResourcePicker({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: ResourcePickerMode;
}) {
  const { s, p, space } = useResearch();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("全部");
  const [discipline, setDiscipline] = useState("全部");
  const [selected, setSelected] = useState<string[]>([]);
  const objects = pickerResources(mode, s, p, space.id);
  const list = objects.filter(
    (o) =>
      o.name.includes(q) &&
      (category === "全部" || ("type" in o && o.type === category)) &&
      (discipline === "全部" ||
        ("discipline" in o && o.discipline === discipline)),
  );
  return (
    <Modal
      title={mode === "knowledge" ? "引用知识" : "关联数据"}
      open={open}
      onClose={onClose}
      wide
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            primary
            onClick={() => {
              if (addContext(selected, false)) {
                setSelected([]);
                onClose();
              }
            }}
          >
            添加 {selected.length ? `(${selected.length})` : ""}
          </Button>
        </>
      }
    >
      <SearchBox value={q} onChange={setQ} placeholder="搜索有权访问的资源" />
      <div className="v-toolbar">
        <Select
          label="类型"
          value={category}
          onChange={setCategory}
          options={[
            "全部",
            ...(mode === "knowledge"
              ? ["文献", "专利", "标准", "内部资料", "数据集"]
              : ["数据集"]),
          ]}
        />
        <Select
          label="学科"
          value={discipline}
          onChange={setDiscipline}
          options={disciplines}
        />
      </div>
      {list.map((o) => (
        <label className="v-list-line" key={o.id}>
          <span className="v-check-line">
            <input
              type="checkbox"
              checked={selected.includes(o.id)}
              onChange={(e) =>
                setSelected(
                  e.target.checked
                    ? [...selected, o.id]
                    : selected.filter((x) => x !== o.id),
                )
              }
            />
            <span>
              {o.name}
              <small>{"type" in o ? String(o.type) : "历史会话"}</small>
            </span>
          </span>
          <span className="v-muted">{permissionLabel(o, p, space.id, s)}</span>
        </label>
      ))}
      {!list.length && <Empty>没有符合条件的可用资源。</Empty>}
    </Modal>
  );
}
