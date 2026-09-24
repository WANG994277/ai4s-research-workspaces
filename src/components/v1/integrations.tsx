"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useResearch } from "./store";
import type { Role } from "./types";
import { profiles, roleNames } from "./seed";
import {
  Alert,
  Badge,
  Button,
  Confirm,
  Details,
  Empty,
  PageTitle,
  Table,
  Tabs,
  Modal,
} from "./ui";
import { ExternalJump } from "./actions";
export function ExternalProject() {
  const { s, p, space } = useResearch();
  const query = useSearchParams();
  const [open, setOpen] = useState(false);
  const [record, setRecord] = useState<Record<string, string> | null>(null);
  const view = query.get("view") ?? "立项管理";
  const project = s.projects.find(
    (x) => x.id === space.projectId && p.projects.includes(x.id),
  );
  const projectName = project?.name ?? "非常规油气前沿研究";
  const syncedAt = (project?.syncTime ?? "2026-09-24 09:30").replace("T", " ");
  const viewData: Record<
    string,
    { headers: string[]; rows: Record<string, string>[]; note: string }
  > = {
    立项管理: {
      headers: ["项目名称", "项目编号", "负责人", "牵头单位", "项目状态"],
      rows: [
        {
          项目名称: projectName,
          项目编号: project?.code ?? "KY-2026-017",
          负责人: project?.owner ?? "赵岩",
          牵头单位: project?.organization ?? "能源研究院",
          项目状态: project?.status ?? "在研",
        },
      ],
      note: "申报、评审、立项审批与正式主数据维护在科研项目管理系统完成。",
    },
    过程管理: {
      headers: ["项目名称", "阶段", "计划时间", "执行状态", "同步状态"],
      rows: [
        {
          项目名称: projectName,
          阶段: "年度研究任务执行",
          计划时间: "2026-01 至 2026-12",
          执行状态: "进行中",
          同步状态: "已同步",
        },
        {
          项目名称: projectName,
          阶段: "中期检查",
          计划时间: "2027-01",
          执行状态: "未开始",
          同步状态: "已同步",
        },
      ],
      note: "正式计划、检查与验收过程由来源系统维护；AI4S展示科研执行关联信息。",
    },
    外协管理: {
      headers: ["外协事项", "关联项目", "承担单位", "当前状态", "更新时间"],
      rows: [
        {
          外协事项: "储层岩样高压吸附测试",
          关联项目: projectName,
          承担单位: "协作实验中心（示例）",
          当前状态: "执行中",
          更新时间: "2026-09-24 08:50",
        },
      ],
      note: "合同、付款和供应商流程不在AI4S内重复建设。",
    },
    成果管理: {
      headers: ["成果名称", "成果类型", "关联项目", "登记状态", "更新时间"],
      rows: [
        {
          成果名称: "页岩气储层敏感性分析结果",
          成果类型: "科研资产",
          关联项目: projectName,
          登记状态: "已关联",
          更新时间: "2026-09-24 09:28",
        },
      ],
      note: "AI4S中的Research Asset可关联来源系统成果记录，但不改变资产权限。",
    },
    人才管理: {
      headers: ["人员", "所属单位", "项目角色", "参与课题", "数据来源"],
      rows: [
        {
          人员: "赵岩",
          所属单位: "能源研究院",
          项目角色: "项目负责人",
          参与课题: "页岩气储层评价课题",
          数据来源: "项目系统",
        },
        {
          人员: "林夏",
          所属单位: "能源研究院",
          项目角色: "科研人员",
          参与课题: "页岩气储层评价课题",
          数据来源: "项目系统",
        },
      ],
      note: "这里只展示项目成员关系，不建设人员画像、能力评分或人事档案。",
    },
    考核管理: {
      headers: ["考核对象", "考核周期", "考核事项", "当前状态", "来源"],
      rows: [
        {
          考核对象: projectName,
          考核周期: "2026年度",
          考核事项: "年度科研任务检查",
          当前状态: "未开始",
          来源: "项目系统",
        },
      ],
      note: "考核规则和结论由来源系统负责，AI4S不生成黑盒评分。",
    },
    日常管理: {
      headers: ["事项", "关联项目", "责任人", "状态", "更新时间"],
      rows: [
        {
          事项: "项目基础信息同步核对",
          关联项目: projectName,
          责任人: "项目管理员",
          状态: "待核对",
          更新时间: "2026-09-24 09:30",
        },
      ],
      note: "日常事项仅展示来源系统同步信息，正式办理仍进入科研项目管理系统。",
    },
  };
  const content = viewData[view] ?? viewData.立项管理;
  return (
    <>
      <PageTitle
        title={`科研项目管理 · ${view}`}
        action={
          <Button primary onClick={() => setOpen(true)}>
            进入科研项目管理系统
          </Button>
        }
      />
      <Alert>当前页面展示来源系统同步信息。{content.note}</Alert>
      <div className="v-toolbar">
        <Badge>{project?.syncStatus ?? "未关联"}</Badge>
        <span className="v-muted">
          来源：科研项目管理系统 · 同步时间：{syncedAt}
        </span>
      </div>
      <Table
        headers={[...content.headers, "操作"]}
        rows={content.rows.map((item) => [
          ...content.headers.map((header) => item[header] ?? "—"),
          <Button key="detail" onClick={() => setRecord(item)}>
            查看同步详情
          </Button>,
        ])}
      />
      <ExternalJump
        kind="科研项目管理系统"
        open={open}
        onClose={() => setOpen(false)}
      />
      <Modal
        title={`${view} · 同步详情`}
        open={!!record}
        onClose={() => setRecord(null)}
      >
        {record && <Details values={record} />}
        <p className="v-footer-note">
          本页只读；编辑、审批和正式办理需进入来源系统。
        </p>
      </Modal>
    </>
  );
}
export function Admin() {
  const { s, p, mutate } = useResearch();
  const router = useRouter();
  const [tab, setTab] = useState("用户与系统角色");
  const [editUser, setEditUser] = useState("");
  const [chosenRoles, setChosenRoles] = useState<Role[]>([]);
  if (!p.roles.includes("admin"))
    return <Empty>当前账号没有平台管理权限。</Empty>;
  return (
    <>
      <PageTitle title="平台管理后台" />
      <Tabs
        items={["用户与系统角色", "空间治理", "资源与资产治理", "系统集成"]}
        value={tab}
        onChange={setTab}
      />
      {tab === "用户与系统角色" ? (
        <>
          <Table
            headers={["用户", "系统角色", "授权项目范围", "操作"]}
            rows={Object.values(profiles).map((u) => [
              u.name,
              (s.userRoles?.[u.id] ?? u.roles)
                .map((r) => roleNames[r])
                .join("、"),
              u.projects
                .map((id) => s.projects.find((pr) => pr.id === id)?.name)
                .join("、"),
              <Button
                key="role"
                onClick={() => {
                  setEditUser(u.id);
                  setChosenRoles(s.userRoles?.[u.id] ?? u.roles);
                }}
              >
                配置系统角色
              </Button>,
            ])}
          />
          <Alert>
            演示账号权限按提供的矩阵配置；平台治理权不开放科研人员私人会话与草稿。
          </Alert>
        </>
      ) : tab === "空间治理" ? (
        <section className="v-card">
          <h2>Project / Space 全局治理</h2>
          <p>项目空间、成员、空间角色与资源映射。</p>
          <Button primary onClick={() => router.push("/space-management")}>
            进入项目空间管理
          </Button>
        </section>
      ) : tab === "资源与资产治理" ? (
        <Table
          headers={["资源名称", "类型", "发布状态", "可用状态", "操作"]}
          rows={s.assets
            .filter(
              (a) =>
                a.publishStatus === "审核中" ||
                (a.visibility !== "PRIVATE" &&
                  (a.publishStatus === "已发布" ||
                    a.publishStatus === "已下架")),
            )
            .map((a) => [
              a.name,
              a.type,
              <Badge key="p">{a.publishStatus}</Badge>,
              <Badge key="s">{a.availability}</Badge>,
              <div className="v-actions" key="a">
                {a.publishStatus === "审核中" ? (
                  <>
                    <Button
                      onClick={() =>
                        mutate("发布审核已通过", a.id, (d) => {
                          const x = d.assets.find((x) => x.id === a.id)!;
                          if (
                            !x.input ||
                            !x.output ||
                            !x.version ||
                            !x.validation
                          )
                            throw new Error("输入输出、版本或验证信息不完整。");
                          x.publishStatus = "已发布";
                          x.visibility = "PUBLIC";
                        })
                      }
                    >
                      审核通过
                    </Button>
                    <Button
                      onClick={() =>
                        mutate("发布申请已驳回", a.id, (d) => {
                          d.assets.find((x) => x.id === a.id)!.publishStatus =
                            "已驳回";
                        })
                      }
                    >
                      驳回
                    </Button>
                  </>
                ) : (
                  <Confirm
                    title="下架资源"
                    description="资源从广场移除，历史调用记录保留。"
                    onConfirm={() =>
                      mutate("资源已下架", a.id, (d) => {
                        const x = d.assets.find((x) => x.id === a.id)!;
                        x.publishStatus = "已下架";
                        x.availability = "已下架";
                      })
                    }
                  >
                    下架
                  </Confirm>
                )}
              </div>,
            ])}
        />
      ) : (
        <Table
          headers={["来源系统", "连接状态", "上下文映射"]}
          rows={["AI 中台", "科研项目管理系统", "LIMS / ELN / iLOMS"].map(
            (name) => [
              name,
              <Badge key="s">未连接</Badge>,
              "Project / Space 映射已保留，本地模拟数据",
            ],
          )}
        />
      )}
      <Modal
        title="配置系统角色"
        open={!!editUser}
        onClose={() => setEditUser("")}
        footer={
          <>
            <Button onClick={() => setEditUser("")}>取消</Button>
            <Button
              primary
              disabled={!chosenRoles.length}
              onClick={() => {
                if (
                  mutate("已更新系统角色", editUser, (d) => {
                    if (editUser === p.id && !chosenRoles.includes("admin"))
                      throw new Error("不能移除当前唯一平台管理员的权限。");
                    d.userRoles = { ...d.userRoles, [editUser]: chosenRoles };
                  })
                )
                  setEditUser("");
              }}
            >
              保存角色
            </Button>
          </>
        }
      >
        {Object.entries(roleNames).map(([role, label]) => (
          <label className="v-check-line" key={role}>
            <input
              type="checkbox"
              checked={chosenRoles.includes(role as Role)}
              onChange={(e) =>
                setChosenRoles(
                  e.target.checked
                    ? [...chosenRoles, role as Role]
                    : chosenRoles.filter((x) => x !== role),
                )
              }
            />
            {label}
          </label>
        ))}
        <Alert>
          系统角色按并集合并；Project / Space 和对象 ACL 仍须单独满足。
        </Alert>
      </Modal>
    </>
  );
}
