"use client";
import { userName } from "./seed";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, ArrowLeft, Network } from "lucide-react";
import { useResearch, notify } from "./store";
import {
  canCloseSpace,
  canManageSpace,
  spacePermission,
  canRemoveMember,
  hasRole,
  now,
  spaceLabels,
  uid,
} from "./domain";
import { profiles, roleNames } from "./seed";
import type { Membership, Space } from "./types";
import {
  Alert,
  Badge,
  Button,
  Details,
  Empty,
  Field,
  Modal,
  PageTitle,
  SearchBox,
  Select,
  Table,
  Tabs,
} from "./ui";
const tabs = ["项目空间", "课题空间", "空间成员", "角色与权限", "空间配置"];
const roles: Membership["role"][] = [
  "Space Admin",
  "Topic Leader",
  "Member",
  "Asset Manager",
  "Viewer",
];
const permissions: Record<string, string> = {
  view: "查看空间与授权内容",
  members: "邀请 / 移除成员",
  roles: "配置成员角色",
  create: "创建科研任务",
  share: "共享空间资产",
  configure: "管理空间配置",
  archive: "关闭 / 归档空间",
};
export function Spaces() {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const tab = query.get("tab") ?? tabs[0];
  const id = query.get("id");
  const q = query.get("q") ?? "";
  const [status, setStatus] = useState("全部");
  const [panel, setPanel] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [role, setRole] = useState("Member");
  const [chosenSpaces, setChosenSpaces] = useState<string[]>([]);
  const [detailTab, setDetailTab] = useState("空间概况");
  const accessible = s.spaces.filter(
    (sp) => sp.type !== "PERSONAL" && canManageSpace(s, p, sp.id),
  );
  const selected = accessible.find((x) => x.id === id);
  const managed = accessible.find((x) => x.id === space.id) ?? accessible[0];
  const current = selected ?? managed;
  const projects = s.projects.filter((x) =>
    p.managementProjects.includes(x.id),
  );
  function params(values: Record<string, string>) {
    const next = new URLSearchParams(query.toString());
    Object.entries(values).forEach(([k, v]) =>
      v ? next.set(k, v) : next.delete(k),
    );
    router.replace("/space-management?" + next);
  }
  function open(name: string, values: Record<string, string> = {}) {
    setPanel(name);
    setForm(values);
    setError("");
    setChosenSpaces(current ? [current.id] : []);
  }
  function field(
    key: string,
    label: string,
    opts?:
      | string[]
      | {
          value: string;
          label: string;
        }[],
    required = false,
  ) {
    return (
      <Field label={label} required={required}>
        {opts ? (
          <select
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          >
            <option value="">请选择</option>
            {opts.map((o) => (
              <option
                key={typeof o === "string" ? o : o.value}
                value={typeof o === "string" ? o : o.value}
              >
                {typeof o === "string" ? o : o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={form[key] ?? ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        )}
      </Field>
    );
  }
  function submit() {
    const ok = mutate(panel + "已保存", current?.id ?? panel, (d, u) => {
      if (
        !hasRole(u, "admin", "manager") &&
        (!current || !canManageSpace(d, u, current.id))
      )
        throw new Error("无空间管理权限。");
      if (
        ["创建项目空间", "创建课题空间"].includes(panel) &&
        !hasRole(u, "admin", "manager")
      )
        throw new Error("当前角色没有创建正式空间的权限。");
      if (panel === "创建项目空间" || panel === "创建课题空间") {
        if (
          !form.projectId ||
          !form.name?.trim() ||
          !form.ownerId ||
          !form.adminId
        )
          throw new Error("请填写必填字段。");
        const project = d.projects.find((x) => x.id === form.projectId);
        if (!project || !u.managementProjects.includes(project.id))
          throw new Error("请选择已授权的有效 Project。");
        if (
          panel === "创建项目空间" &&
          d.spaces.some(
            (sp) => sp.projectId === project.id && sp.type === "PROJECT",
          )
        )
          throw new Error("该项目已存在 Project Space。");
        if (
          panel === "创建课题空间" &&
          (!form.code ||
            d.spaces.some(
              (sp) => sp.projectId === project.id && sp.code === form.code,
            ))
        )
          throw new Error("请填写唯一的课题编号。");
        const parent = d.spaces.find(
          (sp) => sp.type === "PROJECT" && sp.projectId === project.id,
        );
        if (panel === "创建课题空间" && !parent)
          throw new Error("请先创建所属项目空间。");
        const sp: Space = {
          id: uid("space"),
          name: form.name,
          type: panel === "创建项目空间" ? "PROJECT" : "TOPIC",
          projectId: project.id,
          ownerId: form.ownerId,
          status: "ACTIVE",
          description: form.description ?? "",
          code: form.code ?? project.code,
          mapping: form.mapping ?? "",
          syncStatus: form.mapping ? "待同步" : "未映射",
          createdAt: now(),
        };
        d.spaces.push(sp);
        for (const userId of new Set([form.ownerId, form.adminId, u.id])) {
          d.members.push({
            id: uid("member"),
            userId,
            projectId: project.id,
            spaceId: sp.id,
            role:
              userId === form.adminId || userId === u.id
                ? "Space Admin"
                : "Topic Leader",
            status: "active",
            joinedAt: now(),
          });
          if (
            parent &&
            !d.members.some(
              (m) =>
                m.userId === userId &&
                m.spaceId === parent.id &&
                m.status === "active",
            )
          )
            d.members.push({
              id: uid("member"),
              userId,
              projectId: project.id,
              spaceId: parent.id,
              role: "Member",
              status: "active",
              joinedAt: now(),
            });
        }
      }
      if (panel === "编辑空间" && current) {
        if (!form.name?.trim()) throw new Error("空间名称不能为空。");
        const sp = d.spaces.find((x) => x.id === current.id)!;
        sp.name = form.name;
        sp.description = form.description ?? "";
      }
      if (panel === "添加成员") {
        if (!form.userId || !chosenSpaces.length)
          throw new Error("请选择用户和目标空间。");
        for (const sid of chosenSpaces) {
          const sp = d.spaces.find((x) => x.id === sid)!;
          if (sp.status !== "ACTIVE")
            throw new Error("暂停或归档空间不能添加成员。");
          if (
            !canManageSpace(d, u, sp.id) ||
            (!hasRole(u, "admin", "manager") &&
              !spacePermission(d, u, sp.id, "members"))
          )
            throw new Error("没有目标空间成员管理权限。");
          if (
            d.members.some(
              (m) =>
                m.userId === form.userId &&
                m.spaceId === sid &&
                m.status === "active",
            )
          )
            continue;
          d.members.push({
            id: uid("member"),
            userId: form.userId,
            projectId: sp.projectId,
            spaceId: sid,
            role: (form.role || "Member") as Membership["role"],
            status: "active",
            joinedAt: now(),
          });
          const parent = d.spaces.find(
            (x) => x.projectId === sp.projectId && x.type === "PROJECT",
          );
          if (
            parent &&
            !d.members.some(
              (m) =>
                m.userId === form.userId &&
                m.spaceId === parent.id &&
                m.status === "active",
            )
          )
            d.members.push({
              id: uid("member"),
              userId: form.userId,
              projectId: sp.projectId,
              spaceId: parent.id,
              role: "Member",
              status: "active",
              joinedAt: now(),
            });
        }
      }
      if (panel === "移除成员" && current) {
        if (
          !hasRole(u, "admin", "manager") &&
          !spacePermission(d, u, current.id, "members")
        )
          throw new Error("没有成员管理权限。");
        const err = canRemoveMember(d, current.id, form.userId);
        if (err) throw new Error(err);
        const m = d.members.find((x) => x.id === form.memberId)!;
        m.status = "removed";
      }
      if (panel === "配置成员角色") {
        if (
          current &&
          !hasRole(u, "admin", "manager") &&
          !spacePermission(d, u, current.id, "roles")
        )
          throw new Error("没有角色配置权限。");
        const m = d.members.find((x) => x.id === form.memberId)!;
        if (!form.role) throw new Error("请选择角色。");
        if (
          m.role === "Space Admin" &&
          form.role !== "Space Admin" &&
          d.members.filter(
            (x) =>
              x.spaceId === m.spaceId &&
              x.role === "Space Admin" &&
              x.status === "active",
          ).length <= 1
        )
          throw new Error("空间至少保留一位管理员。");
        m.role = form.role as Membership["role"];
      }
      if (
        ["暂停空间", "归档空间", "关闭空间", "恢复空间"].includes(panel) &&
        current
      ) {
        const sp = d.spaces.find((x) => x.id === current.id)!;
        if (panel !== "恢复空间" && !form.reason?.trim())
          throw new Error("请填写操作原因。");
        if (["关闭空间", "归档空间"].includes(panel)) {
          const reason = canCloseSpace(d, sp.id);
          if (reason) throw new Error(reason);
        }
        sp.status =
          panel === "暂停空间"
            ? "SUSPENDED"
            : panel === "归档空间"
              ? "ARCHIVED"
              : panel === "关闭空间"
                ? "CLOSED"
                : "ACTIVE";
      }
      if (panel === "AI 中台资源空间映射" && current) {
        const sp = d.spaces.find((x) => x.id === current.id)!;
        sp.mapping = form.mapping ?? "";
        sp.syncStatus = sp.mapping ? "待同步" : "未映射";
      }
    });
    if (ok) setPanel("");
    else setError("保存未完成，请查看提示并修正。");
  }
  const list = accessible.filter(
    (sp) =>
      sp.type === (tab === "项目空间" ? "PROJECT" : "TOPIC") &&
      `${sp.name} ${sp.code} ${sp.projectId} ${sp.ownerId}`.includes(q) &&
      (status === "全部" || spaceLabels[sp.status] === status),
  );
  return (
    <>
      <PageTitle
        title={`项目空间管理 · ${tab}`}
        action={
          tab === "项目空间" || tab === "课题空间" ? (
            <Button
              primary
              onClick={() =>
                open(tab === "项目空间" ? "创建项目空间" : "创建课题空间", {
                  projectId: space.projectId,
                })
              }
            >
              <Plus size={15} />
              创建{tab}
            </Button>
          ) : tab === "空间成员" ? (
            <Button
              primary
              onClick={() => open("添加成员", { role: "Member" })}
            >
              添加成员
            </Button>
          ) : undefined
        }
      />
      {id && !selected ? (
        <Empty>当前空间不在你的管理范围内。</Empty>
      ) : selected ? (
        <>
          <Button className="v-back" onClick={() => params({ id: "" })}>
            <ArrowLeft size={15} />
            返回列表
          </Button>
          <section className="v-card">
            <div className="v-section-head">
              <div>
                <Badge>{spaceLabels[selected.status]}</Badge>
                <h1 className="v-task-title">{selected.name}</h1>
              </div>
              <Network size={32} color="#798b7c" />
            </div>
            <Tabs
              items={[
                "空间概况",
                "课题空间",
                "成员",
                "角色与权限",
                "科研资产概览",
                "空间配置",
                "操作记录",
              ]}
              value={detailTab}
              onChange={setDetailTab}
            />
            {detailTab === "空间概况" ? (
              <>
                <Details
                  values={{
                    空间类型: selected.type,
                    Project: s.projects.find((x) => x.id === selected.projectId)
                      ?.name,
                    项目编号: s.projects.find(
                      (x) => x.id === selected.projectId,
                    )?.code,
                    空间负责人: userName(selected.ownerId),
                    空间简介: selected.description,
                    创建时间: selected.createdAt,
                    状态: spaceLabels[selected.status],
                  }}
                />
                <Button
                  onClick={() =>
                    open("编辑空间", {
                      name: selected.name,
                      description: selected.description,
                    })
                  }
                >
                  编辑空间
                </Button>
              </>
            ) : detailTab === "课题空间" ? (
              <Table
                headers={["课题空间", "负责人", "状态", "操作"]}
                rows={accessible
                  .filter(
                    (sp) =>
                      sp.projectId === selected.projectId &&
                      sp.type === "TOPIC",
                  )
                  .map((sp) => [
                    sp.name,
                    userName(sp.ownerId),
                    <Badge key="s">{spaceLabels[sp.status]}</Badge>,
                    <Button key="a" onClick={() => params({ id: sp.id })}>
                      查看
                    </Button>,
                  ])}
              />
            ) : detailTab === "成员" ? (
              <Button onClick={() => params({ tab: "空间成员", id: "" })}>
                查看空间成员
              </Button>
            ) : detailTab === "科研资产概览" ? (
              <>
                <p>
                  {
                    s.assets.filter(
                      (a) =>
                        a.spaceId === selected.id && a.visibility !== "PRIVATE",
                    ).length
                  }{" "}
                  项空间资产
                </p>
                <Button
                  onClick={() => {
                    mutate("已切换科研空间", selected.id, (d) => {
                      d.spaceId = selected.id;
                    });
                    router.push("/assets?view=项目资产");
                  }}
                >
                  进入科研资产
                </Button>
              </>
            ) : detailTab === "操作记录" ? (
              <div className="v-audit">
                {s.audit
                  .filter((x) => x.objectId === selected.id)
                  .map((x) => (
                    <p key={x.id}>
                      {x.at} · {userName(x.userId)} · {x.action}
                    </p>
                  ))}
              </div>
            ) : (
              <Button onClick={() => params({ tab: detailTab, id: "" })}>
                进入{detailTab}
              </Button>
            )}
          </section>
        </>
      ) : ["项目空间", "课题空间"].includes(tab) ? (
        <>
          <div className="v-toolbar">
            <SearchBox
              value={q}
              onChange={(v) => params({ q: v })}
              placeholder="搜索项目、编号、空间或负责人"
            />
            <Select
              label="状态"
              value={status}
              onChange={setStatus}
              options={["全部", "正常", "暂停", "已归档", "已关闭"]}
            />
          </div>
          <Table
            headers={[
              "空间名称",
              "项目 / 编号",
              "负责人",
              "成员数",
              "课题 / 资产",
              "状态",
              "操作",
            ]}
            rows={list.map((sp) => [
              sp.name,
              <span key="p">
                {s.projects.find((x) => x.id === sp.projectId)?.name}
                <small>{sp.code}</small>
              </span>,
              userName(sp.ownerId),
              s.members.filter(
                (m) => m.spaceId === sp.id && m.status === "active",
              ).length,
              sp.type === "PROJECT"
                ? s.spaces.filter(
                    (x) => x.projectId === sp.projectId && x.type === "TOPIC",
                  ).length
                : s.assets.filter(
                    (x) => x.spaceId === sp.id && x.visibility !== "PRIVATE",
                  ).length,
              <Badge key="s">{spaceLabels[sp.status]}</Badge>,
              <Button key="a" onClick={() => params({ id: sp.id })}>
                查看详情
              </Button>,
            ])}
          />
        </>
      ) : !current ? (
        <Empty>当前没有可管理的项目空间。</Empty>
      ) : (
        <>
          <div className="v-toolbar">
            <Select
              label="管理空间"
              value={current.id}
              onChange={(v) =>
                mutate("已切换管理空间", v, (d) => {
                  d.spaceId = v;
                })
              }
              options={accessible.map((sp) => ({
                value: sp.id,
                label: sp.name,
              }))}
            />
          </div>
          {tab === "空间成员" ? (
            <>
              <SearchBox
                value={q}
                onChange={(v) => params({ q: v })}
                placeholder="搜索空间成员"
              />
              <Table
                headers={[
                  "姓名 / 单位",
                  "系统角色",
                  "空间角色",
                  "加入时间",
                  "状态",
                  "操作",
                ]}
                rows={s.members
                  .filter(
                    (m) => m.spaceId === current.id && m.status === "active",
                  )
                  .filter((m) =>
                    (
                      Object.values(profiles).find((u) => u.id === m.userId)
                        ?.name ?? m.userId
                    ).includes(q),
                  )
                  .map((m) => {
                    const user = Object.values(profiles).find(
                      (u) => u.id === m.userId,
                    );
                    return [
                      <span key="u">
                        {user?.name ?? m.userId}
                        <small>能源研究院</small>
                      </span>,
                      user?.roles.map((r) => roleNames[r]).join("、"),
                      m.role,
                      m.joinedAt.slice(0, 10),
                      "正常",
                      <div key="a" className="v-actions">
                        <Button
                          onClick={() =>
                            open("配置成员角色", {
                              memberId: m.id,
                              role: m.role,
                            })
                          }
                        >
                          设置角色
                        </Button>
                        <Button
                          danger
                          onClick={() =>
                            open("移除成员", {
                              memberId: m.id,
                              userId: m.userId,
                            })
                          }
                        >
                          移除
                        </Button>
                      </div>,
                    ];
                  })}
              />
            </>
          ) : tab === "角色与权限" ? (
            <section className="v-card">
              <Select
                label="空间角色"
                value={role}
                onChange={setRole}
                options={roles}
              />
              <Alert>
                系统角色与空间角色分开。此处不授予平台角色或私人内容访问权。
              </Alert>
              {Object.entries(permissions).map(([code, label]) => (
                <label className="v-check-line" key={code}>
                  <input
                    type="checkbox"
                    checked={(
                      s.rolePermissions[current.id + ":" + role] ??
                      s.rolePermissions[role] ??
                      []
                    ).includes(code)}
                    onChange={(e) =>
                      mutate("已更新空间角色权限", current.id, (d) => {
                        const k = current.id + ":" + role;
                        const prev =
                          d.rolePermissions[k] ?? d.rolePermissions[role] ?? [];
                        d.rolePermissions[k] = e.target.checked
                          ? [...new Set([...prev, code])]
                          : prev.filter((x) => x !== code);
                      })
                    }
                  />
                  {label}
                </label>
              ))}
              <p className="v-muted">
                权限限定于当前管理空间，显式拒绝与资产 ACL 仍优先。
              </p>
            </section>
          ) : (
            <section className="v-card">
              <Details
                values={{
                  空间: current.name,
                  状态: spaceLabels[current.status],
                  AI中台资源空间: current.mapping || "未映射",
                  同步状态: current.syncStatus,
                  外部项目同步: s.projects.find(
                    (x) => x.id === current.projectId,
                  )?.syncStatus,
                }}
              />
              <div className="v-actions">
                <Button
                  onClick={() =>
                    open("AI 中台资源空间映射", { mapping: current.mapping })
                  }
                >
                  配置 AI 中台映射
                </Button>
                {current.status === "ACTIVE" ? (
                  <Button onClick={() => open("暂停空间")}>暂停空间</Button>
                ) : (
                  <Button onClick={() => open("恢复空间")}>恢复空间</Button>
                )}
                <Button onClick={() => open("归档空间")}>归档空间</Button>
                <Button danger onClick={() => open("关闭空间")}>
                  关闭空间
                </Button>
              </div>
              {current.syncStatus !== "已同步" && (
                <Alert>映射尚未完成同步，相关 AI 能力可能暂不可用。</Alert>
              )}
              <details className="v-section">
                <summary>空间操作记录</summary>
                <div className="v-audit">
                  {s.audit
                    .filter((a) => a.objectId === current.id)
                    .map((a) => (
                      <p key={a.id}>
                        {a.at} · {a.action}
                      </p>
                    ))}
                </div>
              </details>
            </section>
          )}
        </>
      )}
      <Modal
        title={panel}
        open={!!panel}
        onClose={() => setPanel("")}
        wide
        footer={
          <>
            <Button onClick={() => setPanel("")}>取消</Button>
            <Button primary onClick={submit}>
              确认
            </Button>
          </>
        }
      >
        <div data-unsaved={Object.values(form).some(Boolean)}>
          {["创建项目空间", "创建课题空间"].includes(panel) ? (
            <>
              <div className="v-form-grid">
                {field(
                  "projectId",
                  "所属 Project",
                  projects.map((pr) => ({ value: pr.id, label: pr.name })),
                  true,
                )}
                {field("name", "空间名称", undefined, true)}
                {panel === "创建课题空间" &&
                  field("code", "课题编号", undefined, true)}
                {field(
                  "ownerId",
                  "空间负责人",
                  Object.values(profiles)
                    .filter((u) => u.projects.includes(form.projectId))
                    .map((u) => ({ value: u.id, label: u.name })),
                  true,
                )}
                {field(
                  "adminId",
                  "空间管理员",
                  Object.values(profiles)
                    .filter((u) => u.projects.includes(form.projectId))
                    .map((u) => ({ value: u.id, label: u.name })),
                  true,
                )}
                {field("mapping", "AI 中台资源空间映射")}
              </div>
              <Details
                values={{
                  项目名称: s.projects.find((x) => x.id === form.projectId)
                    ?.name,
                  项目编号: s.projects.find((x) => x.id === form.projectId)
                    ?.code,
                  默认权限策略: "课题默认隔离，按成员角色与对象 ACL 授权",
                }}
              />
              {field("description", "空间简介")}
            </>
          ) : panel === "编辑空间" ? (
            <>
              {field("name", "空间名称", undefined, true)}
              {field("description", "空间简介")}
            </>
          ) : panel === "添加成员" ? (
            <>
              {field(
                "userId",
                "选择用户",
                Object.values(profiles)
                  .filter((u) => u.projects.includes(current?.projectId ?? ""))
                  .map((u) => ({ value: u.id, label: u.name })),
                true,
              )}
              {field("role", "空间角色", roles, true)}
              <h3>目标空间</h3>
              {accessible
                .filter((sp) => sp.projectId === current?.projectId)
                .map((sp) => (
                  <label className="v-check-line" key={sp.id}>
                    <input
                      type="checkbox"
                      checked={chosenSpaces.includes(sp.id)}
                      onChange={(e) =>
                        setChosenSpaces(
                          e.target.checked
                            ? [...chosenSpaces, sp.id]
                            : chosenSpaces.filter((x) => x !== sp.id),
                        )
                      }
                    />
                    {sp.name}
                  </label>
                ))}
              <p className="v-muted">
                加入课题空间时同时建立所属项目成员关系。
              </p>
            </>
          ) : panel === "配置成员角色" ? (
            field("role", "空间角色", roles, true)
          ) : panel === "移除成员" ? (
            <Alert>
              移除后成员失去该空间数据访问；私人会话所有权和历史记录保留。系统将检查负责人、唯一管理员、未完成任务与关键资产。
            </Alert>
          ) : panel === "AI 中台资源空间映射" ? (
            <>
              {field("mapping", "外部资源空间 ID")}
              <Alert>仅保存映射配置；实际同步需要连接 AI 中台。</Alert>
            </>
          ) : (
            <>
              <Alert>
                空间状态变化不会删除历史会话、任务和资产。关闭与归档前将检查未完成任务和有效共享关系。
              </Alert>
              {panel !== "恢复空间" &&
                field("reason", "操作原因", undefined, true)}
            </>
          )}
          {error && <Alert>{error}</Alert>}
        </div>
      </Modal>
    </>
  );
}
