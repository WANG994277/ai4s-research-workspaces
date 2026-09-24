"use client";
import { userName } from "./seed";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useResearch } from "./store";
import { canRead, taskLabels, spaceLabels } from "./domain";
import { disciplines } from "./seed";
import {
  Alert,
  Badge,
  Button,
  Details,
  Empty,
  Modal,
  PageTitle,
  SearchBox,
  Select,
  Table,
} from "./ui";
import { ExternalJump } from "./actions";
import type { Task } from "./types";
export function Management({ decision = false }: { decision?: boolean }) {
  const { s, p } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const tabs = decision
    ? ["科研态势", "重大项目", "风险与异常", "科研成果", "科研资源"]
    : ["管理概览", "项目运行", "科研进展", "风险与异常", "科研成果"];
  const tab = query.get("tab") ?? tabs[0];
  const projectId = query.get("project") ?? "全部";
  const detailId = query.get("detail");
  const [organization, setOrganization] = useState("全部");
  const [discipline, setDiscipline] = useState("全部");
  const [period, setPeriod] = useState("2026-09");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("全部");
  const [assetType, setAssetType] = useState("全部");
  const [drill, setDrill] = useState("");
  const [objectType, setObjectType] = useState("全部");
  const [progressType, setProgressType] = useState("Research Task");
  const [readTask, setReadTask] = useState<Task | null>(null);
  const [external, setExternal] = useState(false);
  const [resourceType, setResourceType] = useState("全部");
  const [readObject, setReadObject] = useState<{
    title: string;
    values: Record<string, string | number>;
    content?: string;
  } | null>(null);
  const path = decision ? "/research-decision" : "/research-management";
  function params(values: Record<string, string>) {
    const next = new URLSearchParams(query.toString());
    Object.entries(values).forEach(([k, v]) =>
      v ? next.set(k, v) : next.delete(k),
    );
    router.replace(path + "?" + next);
  }
  const authorized = s.projects.filter((pr) =>
    p.managementProjects.includes(pr.id),
  );
  const projects = authorized.filter(
    (pr) =>
      (projectId === "全部" || pr.id === projectId) &&
      (organization === "全部" || pr.organization === organization) &&
      (discipline === "全部" || pr.discipline === discipline),
  );
  const ids = projects.map((pr) => pr.id);
  const inTime = (date: string) => period === "全部" || date.startsWith(period);
  const tasks = s.tasks.filter(
    (t) =>
      ids.includes(t.projectId) &&
      t.visibility !== "PRIVATE" &&
      canRead(t, p, t.spaceId, s) &&
      inTime(t.createdAt),
  );
  const experiments = s.experiments.filter(
    (e) =>
      ids.includes(e.projectId) &&
      e.visibility !== "PRIVATE" &&
      canRead(e, p, e.spaceId, s) &&
      inTime(e.updatedAt),
  );
  const assets = s.assets.filter(
    (a) =>
      ids.includes(a.projectId) &&
      canRead(a, p, a.spaceId, s) &&
      a.visibility !== "PRIVATE" &&
      inTime(a.updatedAt),
  );
  const spaces = s.spaces.filter(
    (sp) => ids.includes(sp.projectId) && sp.type !== "PERSONAL",
  );
  const resources = [
    ...s.assets.filter(
      (a) =>
        ["Skill", "模型", "数据集"].includes(a.type) &&
        canRead(a, p, a.spaceId, s) &&
        (a.publishStatus === "已发布" || a.type === "数据集") &&
        (a.visibility === "PUBLIC" || ids.includes(a.projectId)),
    ),
    ...s.tools.filter(
      (t) =>
        canRead(t, p, t.spaceId, s) &&
        ids.some((id) => p.projects.includes(id)),
    ),
    ...s.instruments
      .filter((i) => i.visibleProjects.some((id) => ids.includes(id)))
      .map((i) => ({
        ...i,
        type: "仪器",
        availability: i.runtime,
        projectId: "",
        spaceId: "",
        description: i.purpose,
      })),
  ];
  const anomalies = [
    ...tasks
      .filter((t) =>
        ["FAILED", "WAITING_RESOURCE", "PAUSED"].includes(t.status),
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        type: "科研任务异常",
        projectId: t.projectId,
        spaceId: t.spaceId,
        status: taskLabels[t.status],
        reason: t.reason || "科研任务已暂停",
        source: "AI4S",
        time: t.updatedAt,
      })),
    ...experiments
      .filter((e) => e.status === "异常")
      .map((e) => ({
        id: e.id,
        name: e.name,
        type: "实验执行异常",
        projectId: e.projectId,
        spaceId: e.spaceId,
        status: e.status,
        reason: e.exception,
        source: "云上实验室",
        time: e.updatedAt,
      })),
    ...projects
      .filter((pr) => pr.syncStatus !== "已同步")
      .map((pr) => ({
        id: pr.id,
        name: pr.name,
        type: "空间 / 集成异常",
        projectId: pr.id,
        spaceId: "",
        status: pr.syncStatus,
        reason: "外部项目主数据同步失败，已有执行数据仍可查看。",
        source: "科研项目管理系统",
        time: pr.syncTime,
      })),
    ...spaces
      .filter((sp) => sp.status !== "ACTIVE")
      .map((sp) => ({
        id: sp.id,
        name: sp.name,
        type: "空间 / 集成异常",
        projectId: sp.projectId,
        spaceId: sp.id,
        status: spaceLabels[sp.status],
        reason: "空间状态限制新科研任务。",
        source: "AI4S",
        time: sp.createdAt,
      })),
    ...s.instruments
      .filter(
        (i) =>
          ["故障", "离线", "维护中"].includes(i.runtime) &&
          experiments.some(
            (e) =>
              e.instrumentId === i.id &&
              !["已完成", "已取消"].includes(e.status),
          ),
      )
      .map((i) => ({
        id: i.id,
        name: i.name,
        type: "科研资源异常",
        projectId: experiments.find((e) => e.instrumentId === i.id)!.projectId,
        spaceId: "",
        status: i.runtime,
        reason: "设备状态影响已关联实验任务。",
        source: i.source,
        time: i.syncTime,
      })),
  ];
  const detail = projects.find((pr) => pr.id === detailId);
  const active = tasks.filter((t) =>
    [
      "PLANNING",
      "RUNNING",
      "WAITING_HUMAN",
      "WAITING_RESOURCE",
      "PAUSED",
    ].includes(t.status),
  );
  const filteredAssets = assets.filter(
    (a) => (assetType === "全部" || a.type === assetType) && a.name.includes(q),
  );
  const filteredAnomalies = anomalies.filter(
    (a) =>
      (objectType === "全部" || a.type === objectType) && a.name.includes(q),
  );
  function taskDetail(id: string) {
    const t = tasks.find((t) => t.id === id);
    if (t) setReadTask(t);
    else {
      const e = experiments.find((e) => e.id === id);
      if (e)
        setReadObject({
          title: e.name,
          values: {
            对象: "Experiment Task",
            状态: e.status,
            执行人: userName(e.executorId),
            申请人: userName(e.ownerId),
            实验要求: e.requirements,
            计划开始: e.plannedStart,
            设备:
              s.instruments.find((i) => i.id === e.instrumentId)?.name ?? "—",
            关联科研任务: s.tasks.find((t) => t.id === e.taskId)?.name ?? "—",
          },
          content: e.result || e.exception,
        });
    }
  }
  function anomalyDetail(a: (typeof anomalies)[number]) {
    if (
      tasks.some((t) => t.id === a.id) ||
      experiments.some((e) => e.id === a.id)
    )
      taskDetail(a.id);
    else
      setReadObject({
        title: a.name,
        values: {
          类型: a.type,
          当前事实状态: a.status,
          原因: a.reason,
          来源: a.source,
          最近同步: a.time,
          影响项目: projects.find((pr) => pr.id === a.projectId)?.name ?? "—",
        },
      });
  }
  const projectTable = (data = projects) => (
    <Table
      headers={[
        "项目名称 / 编号",
        "牵头单位",
        "负责人",
        "项目 / 空间状态",
        "活跃研究",
        "异常事项",
        "科研资产",
        "操作",
      ]}
      rows={data
        .filter((pr) => pr.name.includes(q) || pr.code.includes(q))
        .map((pr) => [
          <span key="n">
            {pr.name}
            <small>{pr.code}</small>
          </span>,
          pr.organization,
          pr.owner,
          <div key="s" className="v-actions">
            <Badge>{pr.status}</Badge>
            <Badge>
              {
                spaceLabels[
                  s.spaces.find(
                    (sp) => sp.projectId === pr.id && sp.type === "PROJECT",
                  )?.status ?? "ACTIVE"
                ]
              }
            </Badge>
          </div>,
          active.filter((t) => t.projectId === pr.id).length,
          anomalies.filter((a) => a.projectId === pr.id).length,
          assets.filter((a) => a.projectId === pr.id).length,
          <Button key="a" onClick={() => params({ detail: pr.id })}>
            查看
          </Button>,
        ])}
    />
  );
  const anomalyTable = (
    <Table
      headers={["对象", "类型", "所属项目", "当前状态", "事实原因", "操作"]}
      rows={filteredAnomalies.map((a) => [
        a.name,
        a.type,
        projects.find((pr) => pr.id === a.projectId)?.name,
        <Badge key="s">{a.status}</Badge>,
        a.reason,
        <Button key="a" onClick={() => anomalyDetail(a)}>
          查看依据
        </Button>,
      ])}
      empty="当前范围暂无已识别的执行异常事项。"
    />
  );
  const assetTable = (
    <Table
      headers={[
        "资产名称",
        "类型",
        "项目 / 空间",
        "所有者",
        "版本",
        "共享 / 发布",
        "操作",
      ]}
      rows={filteredAssets.map((a) => [
        a.name,
        a.type,
        <span key="p">
          {projects.find((pr) => pr.id === a.projectId)?.name}
          <small>{s.spaces.find((sp) => sp.id === a.spaceId)?.name}</small>
        </span>,
        userName(a.ownerId),
        a.version,
        <div key="s" className="v-actions">
          <Badge>{a.shares.length ? "已共享" : "未共享"}</Badge>
          <Badge>{a.publishStatus}</Badge>
        </div>,
        <Button
          key="a"
          onClick={() => router.push("/assets?view=项目资产&id=" + a.id)}
        >
          查看资产
        </Button>,
      ])}
    />
  );
  function chart(
    title: string,
    rows: {
      name: string;
      count: number;
      action?: () => void;
    }[],
    caption: string,
  ) {
    const max = Math.max(1, ...rows.map((x) => x.count));
    return (
      <section className="v-card">
        <h2>{title}</h2>
        {rows.map((r) => (
          <div className="v-bar-row" key={r.name}>
            <button className="v-link" disabled={!r.action} onClick={r.action}>
              {r.name}
            </button>
            <div className="v-bar-track">
              <i style={{ width: (r.count / max) * 100 + "%" }} />
            </div>
            <strong>{r.count}</strong>
          </div>
        ))}
        <p className="v-footer-note">
          {caption} · {period} · 当前授权筛选范围 · 更新 2026-09-24
        </p>
      </section>
    );
  }
  return (
    <>
      <PageTitle
        title={decision ? `科研决策工作台 · ${tab}` : `科研管理工作台 · ${tab}`}
      />
      <div className="v-toolbar">
        <Select
          label={decision ? "决策范围" : "管理范围"}
          value={projectId}
          onChange={(v) => params({ project: v, detail: "" })}
          options={[
            { value: "全部", label: "全部授权项目" },
            ...authorized.map((pr) => ({ value: pr.id, label: pr.name })),
          ]}
        />
        <Select
          label="组织"
          value={organization}
          onChange={setOrganization}
          options={["全部", ...new Set(authorized.map((x) => x.organization))]}
        />
        {decision && (
          <Select
            label="学科"
            value={discipline}
            onChange={setDiscipline}
            options={disciplines}
          />
        )}
        <Select
          label="时间范围"
          value={period}
          onChange={setPeriod}
          options={["全部", "2026-09", "2026-08", "2025"]}
        />
      </div>
      <p className="v-muted">
        来源：AI4S 本地示例 / 科研项目管理系统模拟主数据 · 最后同步 2026-09-24
        09:30
      </p>
      {projects.some((pr) => pr.syncStatus !== "已同步") && (
        <Alert>
          CCUS 项目基础信息同步异常，最后成功同步：2026-09-23
          16:00。该项目主数据可能不完整，AI4S 内已有数据仍可查看。
        </Alert>
      )}
      {!authorized.length ? (
        <Empty>
          当前账号暂无{decision ? "科研决策" : "科研管理"}数据权限。
        </Empty>
      ) : detailId && !detail ? (
        <Empty>该项目不在当前授权筛选范围。</Empty>
      ) : detail ? (
        <>
          <Button className="v-back" onClick={() => params({ detail: "" })}>
            <ArrowLeft size={15} />
            返回项目列表
          </Button>
          <section className="v-card">
            <h1 className="v-task-title">{detail.name}</h1>
            <Details
              values={{
                项目编号: detail.code,
                牵头单位: detail.organization,
                负责人: detail.owner,
                项目状态: detail.status,
                起止时间: detail.start + " — " + detail.end,
                重大项目属性: detail.major ? "外部项目系统明确标识" : "未配置",
                来源: "科研项目管理系统（示例）",
                同步时间: detail.syncTime,
              }}
            />
            <div className="v-actions">
              {decision && (
                <Button
                  onClick={() =>
                    router.push(
                      "/research-management?project=" +
                        detail.id +
                        "&detail=" +
                        detail.id,
                    )
                  }
                >
                  查看科研管理详情
                </Button>
              )}
              <Button onClick={() => setExternal(true)}>
                进入科研项目管理系统
              </Button>
            </div>
          </section>
          <section className="v-section">
            <h2>空间结构</h2>
            <Table
              headers={[
                "空间",
                "类型",
                "负责人",
                "成员",
                "状态",
                "活跃科研任务",
              ]}
              rows={spaces
                .filter((sp) => sp.projectId === detail.id)
                .map((sp) => [
                  sp.name,
                  sp.type,
                  userName(sp.ownerId),
                  s.members.filter(
                    (m) => m.spaceId === sp.id && m.status === "active",
                  ).length,
                  <Badge key="s">{spaceLabels[sp.status]}</Badge>,
                  active.filter((t) => t.spaceId === sp.id).length,
                ])}
            />
          </section>
          <section className="v-section">
            <h2>科研执行与明确异常</h2>
            <Table
              headers={["科研任务", "空间", "状态", "当前步骤", "操作"]}
              rows={tasks
                .filter((t) => t.projectId === detail.id)
                .map((t) => [
                  t.name,
                  s.spaces.find((x) => x.id === t.spaceId)?.name,
                  <Badge key="s">{taskLabels[t.status]}</Badge>,
                  t.steps.find(
                    (x) => x.status === "running" || x.status === "failed",
                  )?.name ?? t.next,
                  <Button key="a" onClick={() => taskDetail(t.id)}>
                    只读查看
                  </Button>,
                ])}
            />
          </section>
          <section className="v-section">
            <h2>科研成果</h2>
            {assetTable}
          </section>
        </>
      ) : tab === tabs[0] ? (
        <>
          <div className="v-mini-stats">
            <button
              onClick={() =>
                decision ? setDrill("projects") : params({ tab: "项目运行" })
              }
            >
              <span>授权项目</span>
              <strong>{projects.length}</strong>
            </button>
            <button
              onClick={() => {
                setStatus("活跃");
                setDrill("tasks");
              }}
            >
              <span>活跃 Research Task</span>
              <strong>{active.length}</strong>
            </button>
            <button onClick={() => params({ tab: "风险与异常" })}>
              <span>{decision ? "存在明确异常的项目" : "需要关注的事项"}</span>
              <strong>
                {decision
                  ? new Set(anomalies.map((a) => a.projectId)).size
                  : anomalies.length}
              </strong>
            </button>
            <button onClick={() => params({ tab: "科研成果" })}>
              <span>正式科研资产</span>
              <strong>{assets.length}</strong>
            </button>
          </div>
          <div className="v-grid two">
            {chart(
              "科研任务状态分布",
              Object.entries(taskLabels).map(([status, name]) => ({
                name,
                count: tasks.filter((t) => t.status === status).length,
                action: () => {
                  setStatus(name);
                  setDrill("tasks");
                },
              })),
              "按 Research Task 当前状态计数",
            )}
            {decision
              ? chart(
                  "科研资产沉淀趋势",
                  ["2026-07", "2026-08", "2026-09"].map((month) => ({
                    name: month,
                    count: assets.filter((a) =>
                      (a.versions[0]?.at ?? a.updatedAt).startsWith(month),
                    ).length,
                    action: () => {
                      setPeriod(month);
                      params({ tab: "科研成果" });
                    },
                  })),
                  "按资产当前示例形成日期计数",
                )
              : chart(
                  "资产类型分布",
                  ["智能体", "Skill", "模型", "数据集", "方案模板"].map(
                    (name) => ({
                      name,
                      count: assets.filter((a) => a.type === name).length,
                      action: () => {
                        setAssetType(name);
                        params({ tab: "科研成果" });
                      },
                    }),
                  ),
                  "正式 Research Asset，不含过程产出",
                )}
          </div>
          <section className="v-section">
            <div className="v-section-head">
              <h2>{decision ? "重点项目" : "需要关注"}</h2>
              <button
                className="v-link"
                onClick={() =>
                  params({ tab: decision ? "重大项目" : "风险与异常" })
                }
              >
                查看全部
                <ArrowRight size={13} style={{ display: "inline" }} />
              </button>
            </div>
            {decision
              ? projectTable(projects.filter((pr) => pr.major))
              : anomalyTable}
          </section>
          <section className="v-section">
            <h2>{decision ? "项目结构分布" : "项目运行"}</h2>
            {decision
              ? chart(
                  "学科分布",
                  disciplines.slice(1).map((name) => ({
                    name,
                    count: projects.filter((pr) => pr.discipline === name)
                      .length,
                    action: () => setDiscipline(name),
                  })),
                  "授权 Project 按学科分组",
                )
              : projectTable()}
          </section>
        </>
      ) : tab === "项目运行" || tab === "重大项目" ? (
        <>
          <div className="v-toolbar">
            <SearchBox
              value={q}
              onChange={setQ}
              placeholder="搜索项目名称或编号"
            />
          </div>
          {tab === "重大项目" && !projects.some((pr) => pr.major) ? (
            <Empty>当前范围暂未配置重大 / 重点项目。</Empty>
          ) : (
            projectTable(
              tab === "重大项目" ? projects.filter((pr) => pr.major) : projects,
            )
          )}
        </>
      ) : tab === "科研进展" ? (
        <>
          <div className="v-toolbar">
            <Select
              label="对象"
              value={progressType}
              onChange={setProgressType}
              options={["Research Task", "Experiment Task"]}
            />
            <SearchBox value={q} onChange={setQ} placeholder="搜索科研任务" />
            <Select
              label="状态"
              value={status}
              onChange={setStatus}
              options={[
                "全部",
                ...(progressType === "Research Task"
                  ? Object.values(taskLabels)
                  : [
                      "草稿",
                      "待接收",
                      "待执行",
                      "执行中",
                      "等待确认",
                      "已完成",
                      "异常",
                      "已取消",
                    ]),
              ]}
            />
          </div>
          <Table
            headers={[
              "任务",
              "Project / Space",
              "负责人 / 执行人",
              "状态",
              "当前阶段",
              "操作",
            ]}
            rows={
              progressType === "Research Task"
                ? tasks
                    .filter(
                      (t) =>
                        t.name.includes(q) &&
                        (status === "全部" || taskLabels[t.status] === status),
                    )
                    .map((t) => [
                      t.name,
                      <span key="p">
                        {projects.find((pr) => pr.id === t.projectId)?.name}
                        <small>
                          {s.spaces.find((sp) => sp.id === t.spaceId)?.name}
                        </small>
                      </span>,
                      userName(t.ownerId),
                      <Badge key="s">{taskLabels[t.status]}</Badge>,
                      t.steps.find((st) => st.status === "running")?.name ??
                        t.next,
                      <Button key="a" onClick={() => taskDetail(t.id)}>
                        查看轨迹
                      </Button>,
                    ])
                : experiments
                    .filter(
                      (e) =>
                        e.name.includes(q) &&
                        (status === "全部" || e.status === status),
                    )
                    .map((e) => [
                      e.name,
                      s.spaces.find((sp) => sp.id === e.spaceId)?.name,
                      userName(e.executorId),
                      <Badge key="s">{e.status}</Badge>,
                      e.progress,
                      <Button key="a" onClick={() => taskDetail(e.id)}>
                        查看实验
                      </Button>,
                    ])
            }
          />
        </>
      ) : tab === "风险与异常" ? (
        <>
          <div className="v-toolbar">
            <SearchBox value={q} onChange={setQ} placeholder="搜索异常对象" />
            <Select
              label="来源类型"
              value={objectType}
              onChange={setObjectType}
              options={[
                "全部",
                "科研任务异常",
                "实验执行异常",
                "科研资源异常",
                "空间 / 集成异常",
              ]}
            />
          </div>
          {decision && (
            <div className="v-grid two v-section">
              {chart(
                "异常来源分布",
                [
                  "科研任务异常",
                  "实验执行异常",
                  "科研资源异常",
                  "空间 / 集成异常",
                ].map((name) => ({
                  name,
                  count: anomalies.filter((a) => a.type === name).length,
                  action: () => setObjectType(name),
                })),
                "既有对象异常状态聚合",
              )}
              {chart(
                "异常项目分布",
                projects.map((pr) => ({
                  name: pr.name,
                  count: anomalies.filter((a) => a.projectId === pr.id).length,
                  action: () => params({ project: pr.id }),
                })),
                "不生成风险评级",
              )}
            </div>
          )}
          <section className="v-section">{anomalyTable}</section>
        </>
      ) : tab === "科研成果" ? (
        <>
          <div className="v-toolbar">
            <SearchBox value={q} onChange={setQ} placeholder="搜索科研资产" />
            <Select
              label="资产类型"
              value={assetType}
              onChange={setAssetType}
              options={[
                "全部",
                "智能体",
                "Skill",
                "模型",
                "数据集",
                "方案模板",
              ]}
            />
          </div>
          <div className="v-grid two">
            {chart(
              "正式资产类型分布",
              ["智能体", "Skill", "模型", "数据集", "方案模板"].map((name) => ({
                name,
                count: assets.filter((a) => a.type === name).length,
                action: () => setAssetType(name),
              })),
              "仅 Research Asset",
            )}
            {chart(
              "分享与发布状态",
              [
                {
                  name: "已共享",
                  count: assets.filter((a) => a.shares.length).length,
                },
                {
                  name: "已发布",
                  count: assets.filter((a) => a.publishStatus === "已发布")
                    .length,
                },
                {
                  name: "未发布",
                  count: assets.filter((a) => a.publishStatus === "未发布")
                    .length,
                },
              ],
              "共享与发布分别统计，不可相加",
            )}
          </div>
          <section className="v-section">{assetTable}</section>
        </>
      ) : (
        <>
          <div className="v-toolbar">
            <SearchBox value={q} onChange={setQ} placeholder="搜索科研资源" />
            <Select
              label="资源类型"
              value={resourceType}
              onChange={setResourceType}
              options={[
                "全部",
                "Skill",
                "模型",
                "数据集",
                "科研软件",
                "数据处理",
                "连接器",
                "仪器",
              ]}
            />
          </div>
          <div className="v-grid two">
            {chart(
              "科研资源类型",
              ["Skill", "模型", "数据集", "工具 / 软件", "仪器"].map(
                (name) => ({
                  name,
                  count: resources.filter((r) =>
                    name === "工具 / 软件"
                      ? !["Skill", "模型", "数据集", "仪器"].includes(r.type)
                      : r.type === name,
                  ).length,
                }),
              ),
              "已发布能力、授权数据集及设备",
            )}
            {chart(
              "科研资源学科",
              disciplines.slice(1).map((name) => ({
                name,
                count: resources.filter((r) => r.discipline === name).length,
              })),
              "按资源已登记学科计数",
            )}
          </div>
          <section className="v-section">
            <Table
              headers={["资源", "类型", "学科", "当前状态", "操作"]}
              rows={resources
                .filter(
                  (r) =>
                    r.name.includes(q) &&
                    (resourceType === "全部" || r.type === resourceType),
                )
                .map((r) => [
                  r.name,
                  r.type,
                  r.discipline,
                  <Badge key="s">{r.availability}</Badge>,
                  <Button
                    key="a"
                    onClick={() => {
                      if (r.type === "Skill" || r.type === "模型")
                        router.push(
                          "/" +
                            (r.type === "Skill" ? "skills" : "models") +
                            "?id=" +
                            r.id,
                        );
                      else if (r.type === "数据集")
                        router.push("/assets?id=" + r.id);
                      else if (r.type === "仪器")
                        router.push("/lab?id=" + r.id);
                      else
                        setReadObject({
                          title: r.name,
                          values: {
                            资源类型: r.type,
                            学科: r.discipline,
                            当前状态: r.availability,
                          },
                          content: r.description,
                        });
                    }}
                  >
                    查看资源
                  </Button>,
                ])}
            />
          </section>
        </>
      )}
      <Modal
        title={drill === "projects" ? "授权项目" : "科研任务下钻"}
        open={!!drill}
        onClose={() => setDrill("")}
        wide
      >
        {drill === "projects" ? (
          projectTable()
        ) : (
          <Table
            headers={["任务", "状态", "所属空间", "操作"]}
            rows={tasks
              .filter((t) =>
                status === "活跃"
                  ? active.some((x) => x.id === t.id)
                  : status === "全部" || taskLabels[t.status] === status,
              )
              .map((t) => [
                t.name,
                <Badge key="s">{taskLabels[t.status]}</Badge>,
                s.spaces.find((x) => x.id === t.spaceId)?.name,
                <Button key="a" onClick={() => taskDetail(t.id)}>
                  查看轨迹
                </Button>,
              ])}
          />
        )}
      </Modal>
      <Modal
        title={readTask?.name ?? "科研任务"}
        open={!!readTask}
        onClose={() => setReadTask(null)}
        wide
      >
        {readTask && (
          <>
            <Badge>{taskLabels[readTask.status]}</Badge>
            <Details
              values={{
                对象: "Research Task",
                负责人: userName(readTask.ownerId),
                空间: s.spaces.find((x) => x.id === readTask.spaceId)?.name,
                最近更新: readTask.updatedAt,
                原因: readTask.reason,
              }}
            />
            <h3>执行轨迹</h3>
            {readTask.steps.map((st) => (
              <div className="v-list-line" key={st.id}>
                <span>
                  {st.name}
                  <small>
                    资源：
                    {st.resources
                      .map(
                        (id) => s.assets.find((a) => a.id === id)?.name ?? id,
                      )
                      .join("、")}
                  </small>
                </span>
                <Badge>{st.status}</Badge>
              </div>
            ))}
            <p className="v-muted">
              只读业务视图。私人 Agent Session 按会话权限单独控制。
            </p>
          </>
        )}
      </Modal>
      <Modal
        title={readObject?.title ?? "对象详情"}
        open={!!readObject}
        onClose={() => setReadObject(null)}
      >
        {readObject && (
          <>
            <Details values={readObject.values} />
            {readObject.content && (
              <p className="v-prose">{readObject.content}</p>
            )}
          </>
        )}
      </Modal>
      <ExternalJump
        kind="科研项目管理系统"
        open={external}
        onClose={() => setExternal(false)}
      />
    </>
  );
}
