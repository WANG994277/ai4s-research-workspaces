"use client";
import { userName } from "./seed";
import { ExternalReturn } from "./external-return";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, FolderArchive } from "lucide-react";
import { useResearch, notify } from "./store";
import {
  canEdit,
  canShare,
  canRead,
  canUse,
  hasRole,
  now,
  permissionLabel,
  uid,
} from "./domain";
import { assetTypes, disciplines } from "./seed";
import {
  AdvancedFilters,
  Alert,
  Badge,
  Button,
  Confirm,
  Details,
  Empty,
  Field,
  Modal,
  PageTitle,
  Pagination,
  SearchBox,
  Select,
  Table,
  Tabs,
} from "./ui";
import {
  ContextActions,
  ExternalJump,
  PermissionRequest,
  ShareAsset,
} from "./actions";
export function Assets() {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const view = query.get("view") ?? "我的资产";
  const q = query.get("q") ?? "";
  const type = query.get("type") ?? "全部";
  const id = query.get("id");
  const page = Number(query.get("page") ?? 1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [range, setRange] = useState("全部");
  const [status, setStatus] = useState("全部");
  const [discipline, setDiscipline] = useState("全部");
  const [sort, setSort] = useState("最近更新");
  const [panel, setPanel] = useState("");
  const [tab, setTab] = useState("基础信息");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("");
  const [change, setChange] = useState("");
  const [createType, setCreateType] = useState("");
  const [target, setTarget] = useState("");
  function params(k: string, v: string) {
    const next = new URLSearchParams(query.toString());
    v ? next.set(k, v) : next.delete(k);
    if (k !== "page") next.delete("page");
    router.replace("/assets?" + next);
  }
  const visible = s.assets.filter((a) => canRead(a, p, space.id, s));
  const a = visible.find((x) => x.id === id);
  const editable = a ? canEdit(a, p, space.id, s) : false;
  const list = visible
    .filter(
      (a) =>
        (!filters.creator || a.ownerId.includes(filters.creator)) &&
        (!filters.source || a.source === filters.source) &&
        (!filters.space ||
          s.spaces.find((sp) => sp.id === a.spaceId)?.name === filters.space) &&
        (!filters.sharing ||
          (filters.sharing === "已共享") === !!a.shares.length) &&
        (!filters.from || a.updatedAt.slice(0, 10) >= filters.from) &&
        (!filters.to || a.updatedAt.slice(0, 10) <= filters.to) &&
        (!filters.version ||
          a.versions.some((v) => v.status === filters.version)) &&
        (view === "我的资产"
          ? a.ownerId === p.id
          : !!space.projectId && a.projectId === space.projectId) &&
        (type === "全部" || a.type === type) &&
        (range === "全部" ||
          (range === "当前课题" && a.spaceId === space.id) ||
          (range === "项目公共" && a.visibility === "PROJECT") ||
          (range === "其他课题授权共享" &&
            a.spaceId !== space.id &&
            a.shares.some(
              (g) => g.targetSpace === space.id || g.targetUser === p.id,
            ))) &&
        (status === "全部" ||
          a.publishStatus === status ||
          a.lifecycle === status) &&
        (discipline === "全部" || a.discipline === discipline) &&
        (!q ||
          [
            a.name,
            a.description,
            a.type,
            a.discipline,
            userName(a.ownerId),
            a.version,
            ...a.tags,
          ]
            .join(" ")
            .includes(q)),
    )
    .sort((a, b) =>
      sort === "名称"
        ? a.name.localeCompare(b.name)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  function changeLifecycle(value: string) {
    if (!a) return;
    mutate(value === "已归档" ? "已归档资产" : "已删除资产", a.id, (d, u) => {
      const original = d.assets.find((x) => x.id === a.id)!;
      if (!canEdit(original, u, space.id, d))
        throw new Error("没有此资产的管理权限。");
      if (value === "删除") {
        if (
          original.shares.length ||
          original.publishStatus === "已发布" ||
          d.tasks.some(
            (t) =>
              t.contextIds.includes(a.id) || t.capabilityIds.includes(a.id),
          )
        )
          throw new Error("资产已共享、发布或被引用，请使用归档。");
        d.assets = d.assets.filter((x) => x.id !== a.id);
      } else original.lifecycle = value;
    });
    if (value === "删除") params("id", "");
  }
  return (
    <>
      <ExternalReturn />
      <PageTitle
        title={`科研资产 · ${view}`}
        action={
          hasRole(p, "researcher", "leader") ? (
            <Button onClick={() => setPanel("create")}>
              <Plus size={15} />
              新建资产
            </Button>
          ) : undefined
        }
      />
      {id && !a ? (
        <Empty>当前资产未向你开放，或已不存在。</Empty>
      ) : a ? (
        <>
          <Button className="v-back" onClick={() => params("id", "")}>
            <ArrowLeft size={15} />
            返回资产列表
          </Button>
          <section className="v-card">
            <div className="v-section-head">
              <div>
                <span className="v-kicker">RESEARCH ASSET</span>
                <h1 className="v-task-title">{a.name}</h1>
                <div className="v-actions">
                  <Badge>{a.type}</Badge>
                  <Badge>{a.lifecycle}</Badge>
                  <Badge>{a.publishStatus}</Badge>
                  <span className="v-muted">{a.version}</span>
                </div>
              </div>
              <FolderArchive size={32} color="#98756b" />
            </div>
            <p>{a.description}</p>
            <div className="v-actions">
              <ContextActions
                object={a}
                capability={["智能体", "Skill", "模型"].includes(a.type)}
              />
              {["Skill", "模型"].includes(a.type) &&
                a.publishStatus === "已发布" && (
                  <Link
                    className="v-button"
                    href={
                      "/" +
                      (a.type === "Skill" ? "skills" : "models") +
                      "?id=" +
                      a.id
                    }
                  >
                    直接调用
                  </Link>
                )}
              {editable && (
                <>
                  <Button
                    disabled={!canShare(a, p, space.id, s)}
                    onClick={() => setPanel("share")}
                  >
                    分享
                  </Button>
                  <Button
                    disabled={
                      a.publishStatus === "审核中" ||
                      a.publishStatus === "已发布"
                    }
                    onClick={() => setPanel("publish")}
                  >
                    申请发布
                  </Button>
                </>
              )}
              {permissionLabel(a, p, space.id, s) === "可复制" && (
                <Button
                  onClick={() =>
                    mutate("已复制资产", a.id, (d, u) => {
                      if (!canRead(a, u, space.id, d))
                        throw new Error("访问权限已失效。");
                      d.assets.unshift({
                        ...structuredClone(a),
                        id: uid("asset"),
                        name: a.name + "（副本）",
                        ownerId: u.id,
                        spaceId: space.id,
                        projectId: space.projectId,
                        visibility: "PRIVATE",
                        shares: [],
                        publishStatus: "未发布",
                        sourceAssetId: a.id,
                      });
                    })
                  }
                >
                  复制为我的资产
                </Button>
              )}
            </div>
            <p className="v-footer-note">
              当前权限：{permissionLabel(a, p, space.id, s)} · 来源：
              {a.ownerId === p.id
                ? "资产所有者"
                : a.shares.some((g) => g.targetSpace === space.id)
                  ? "跨课题共享授权"
                  : a.visibility === "PUBLIC"
                    ? "平台公开"
                    : "Project / Space 授权"}
            </p>
            {["已归档", "已下架"].includes(a.lifecycle) && (
              <Alert>该资产不再用于新任务，历史版本与既有引用保留。</Alert>
            )}
          </section>
          <section className="v-card v-section">
            <Tabs
              items={[
                "基础信息",
                "使用说明",
                "版本",
                "来源与归属",
                "权限与共享",
                "关联科研任务",
              ]}
              value={tab}
              onChange={setTab}
            />
            {tab === "基础信息" ? (
              <>
                <Details
                  values={{
                    资产名称: a.name,
                    资产类型: a.type,
                    所属学科: a.discipline,
                    所有者: userName(a.ownerId),
                    当前版本: a.version,
                    更新时间: a.updatedAt,
                    发布状态: a.publishStatus,
                    生命周期: a.lifecycle,
                    ...(a.type === "数据集"
                      ? {
                          数据类型: "结构化表格",
                          数据规模: "24条示例记录",
                          字段说明: "压力、吸附量、温度、样品标识",
                          数据来源: a.source,
                        }
                      : a.type === "模型"
                        ? { 模型验证: a.validation }
                        : a.type === "方案模板"
                          ? {
                              模板结构: "研究目标 → 输入核对 → 分析 → 结果复核",
                              适用场景: a.tags.join("、"),
                            }
                          : a.type === "智能体"
                            ? {
                                可调用技能: "文献证据抽取 Skill",
                                可调用模型: "页岩储层甜点预测模型",
                              }
                            : { 输入: a.input, 输出: a.output }),
                  }}
                />
                {editable && (
                  <div className="v-actions">
                    <Button
                      onClick={() => {
                        setName(a.name);
                        setDescription(a.description);
                        setPanel("edit");
                      }}
                    >
                      编辑基础信息
                    </Button>
                    <Confirm
                      title="归档科研资产"
                      description="归档后不再用于新任务，历史版本和来源引用仍保留。"
                      onConfirm={() => changeLifecycle("已归档")}
                    >
                      归档
                    </Confirm>
                    <Confirm
                      title="删除科研资产"
                      description="仅未共享、未发布、未被引用的资产可删除。"
                      onConfirm={() => changeLifecycle("删除")}
                    >
                      删除
                    </Confirm>
                  </div>
                )}
              </>
            ) : tab === "使用说明" ? (
              <Details
                values={{
                  适用场景: a.tags.join("、"),
                  输入: a.input,
                  输出: a.output,
                  使用限制: a.limitations,
                  验证信息: a.validation,
                }}
              />
            ) : tab === "版本" ? (
              <>
                <Table
                  headers={["版本", "变更说明", "创建人", "时间", "状态"]}
                  rows={a.versions.map((v) => [
                    v.number,
                    v.description,
                    v.by,
                    v.at.slice(0, 10),
                    <Badge key="s">{v.status}</Badge>,
                  ])}
                />
                {editable && (
                  <Button
                    onClick={() => {
                      setVersion("");
                      setChange("");
                      setPanel("version");
                    }}
                  >
                    登记新版本
                  </Button>
                )}
              </>
            ) : tab === "来源与归属" ? (
              <>
                <Details
                  values={{
                    来源类型: a.source,
                    来源系统: a.externalId ? "AI 中台" : a.source,
                    外部对象: a.externalId ?? "—",
                    所属项目: s.projects.find((x) => x.id === a.projectId)
                      ?.name,
                    所属空间: s.spaces.find((x) => x.id === a.spaceId)?.name,
                    来源产出: a.artifactId,
                    来源任务: a.taskId,
                    来源会话: a.sessionId,
                    来源版本: a.version,
                    原资产: a.sourceAssetId,
                  }}
                />
                {editable && (
                  <Button onClick={() => setPanel("move")}>
                    关联至项目 / 空间
                  </Button>
                )}
              </>
            ) : tab === "权限与共享" ? (
              <>
                <Details
                  values={{
                    可见范围: a.visibility,
                    当前权限: permissionLabel(a, p, space.id, s),
                  }}
                />
                {a.shares.length ? (
                  <Table
                    headers={["目标", "权限级别", "有效期", "操作"]}
                    rows={a.shares.map((g) => [
                      s.spaces.find((x) => x.id === g.targetSpace)?.name ??
                        g.targetUser,
                      g.level,
                      g.validTo || "长期有效",
                      editable ? (
                        <Confirm
                          key={g.id}
                          title="撤销共享"
                          description="目标成员或空间将失去本次共享权限；历史使用记录保留。"
                          onConfirm={() =>
                            mutate("已撤销共享", a.id, (d) => {
                              d.assets.find((x) => x.id === a.id)!.shares =
                                d.assets
                                  .find((x) => x.id === a.id)!
                                  .shares.filter((x) => x.id !== g.id);
                            })
                          }
                        >
                          撤销共享
                        </Confirm>
                      ) : (
                        "—"
                      ),
                    ])}
                  />
                ) : (
                  <Empty>暂无共享授权。</Empty>
                )}
                {editable && (
                  <Button
                    disabled={!canShare(a, p, space.id, s)}
                    onClick={() => setPanel("share")}
                  >
                    分享资产
                  </Button>
                )}
              </>
            ) : (
              <>
                {s.tasks
                  .filter(
                    (t) =>
                      (t.id === a.taskId ||
                        t.contextIds.includes(a.id) ||
                        t.capabilityIds.includes(a.id)) &&
                      canRead(t, p, space.id, s),
                  )
                  .map((t) => (
                    <Link
                      className="v-list-line"
                      href={"/workspace?task=" + t.id}
                      key={t.id}
                    >
                      {t.name}
                      <span className="v-muted">使用版本 {a.version}</span>
                    </Link>
                  ))}
              </>
            )}
          </section>
        </>
      ) : (
        <>
          <Tabs
            items={["全部", ...assetTypes]}
            value={type}
            onChange={(v) => params("type", v)}
          />
          <div className="v-toolbar">
            <SearchBox
              value={q}
              onChange={(v) => params("q", v)}
              placeholder="搜索资产名称、标签、创建人或版本"
            />
            {view === "项目资产" && (
              <Select
                label="范围"
                value={range}
                onChange={setRange}
                options={["全部", "当前课题", "项目公共", "其他课题授权共享"]}
              />
            )}
            <Select
              label="状态"
              value={status}
              onChange={setStatus}
              options={[
                "全部",
                "未发布",
                "审核中",
                "已发布",
                "已驳回",
                "已归档",
                "已下架",
              ]}
            />
            <Select
              label="学科"
              value={discipline}
              onChange={setDiscipline}
              options={disciplines}
            />
            <Select
              label="排序"
              value={sort}
              onChange={setSort}
              options={["最近更新", "名称"]}
            />
            <AdvancedFilters
              value={filters}
              onChange={setFilters}
              fields={[
                { key: "creator", label: "创建人" },
                {
                  key: "space",
                  label: "所属空间",
                  options: [
                    ...new Set(
                      visible.map(
                        (a) =>
                          s.spaces.find((sp) => sp.id === a.spaceId)?.name ??
                          "个人空间",
                      ),
                    ),
                  ],
                },
                {
                  key: "source",
                  label: "来源",
                  options: [...new Set(visible.map((a) => a.source))],
                },
                {
                  key: "sharing",
                  label: "共享状态",
                  options: ["已共享", "未共享"],
                },
                { key: "from", label: "更新开始日期", type: "date" },
                { key: "to", label: "更新结束日期", type: "date" },
                {
                  key: "version",
                  label: "版本状态",
                  options: ["有效", "已下架"],
                },
              ]}
            />
          </div>
          <Table
            headers={[
              "资产名称",
              "类型 / 学科",
              "所属空间",
              "版本",
              "共享 / 发布",
              "更新时间",
              "操作",
            ]}
            rows={list.slice((page - 1) * 8, page * 8).map((x) => [
              <button
                key="n"
                className="v-link v-task-link"
                onClick={() => params("id", x.id)}
              >
                {x.name}
                <small>{x.source}</small>
              </button>,
              <span key="t">
                {x.type}
                <small>{x.discipline}</small>
              </span>,
              s.spaces.find((sp) => sp.id === x.spaceId)?.name,
              x.version,
              <div key="s" className="v-actions">
                <Badge>
                  {x.shares.length
                    ? "已共享"
                    : x.visibility === "PRIVATE"
                      ? "私有"
                      : "空间可见"}
                </Badge>
                <Badge>{x.publishStatus}</Badge>
              </div>,
              x.updatedAt.slice(0, 10),
              <Button key="a" onClick={() => params("id", x.id)}>
                查看详情
              </Button>,
            ])}
            empty={
              view === "项目资产" && !space.projectId
                ? "请切换至项目或课题空间查看项目资产。"
                : "当前范围暂无科研资产。"
            }
          />
          <Pagination
            page={page}
            total={list.length}
            onChange={(v) => params("page", String(v))}
          />
        </>
      )}
      <Modal
        title="新建科研资产"
        open={panel === "create"}
        onClose={() => setPanel("")}
      >
        {["智能体", "Skill", "模型", "数据集"].map((t) => (
          <button
            key={t}
            className="v-space-option"
            onClick={() => {
              setCreateType(t);
              setPanel("external");
            }}
          >
            <Plus size={17} />
            <strong>新建{t}</strong>
            <span className="v-muted">AI 中台</span>
          </button>
        ))}
      </Modal>
      <ExternalJump
        kind={"创建" + createType}
        open={panel === "external"}
        onClose={() => setPanel("")}
      />
      {a && (
        <>
          <ShareAsset
            asset={a}
            open={panel === "share"}
            onClose={() => setPanel("")}
          />
          <PermissionRequest
            objectId={a.id}
            open={panel === "permission"}
            onClose={() => setPanel("")}
          />
          <Modal
            title={
              panel === "edit"
                ? "编辑基础信息"
                : panel === "version"
                  ? "登记新版本"
                  : panel === "move"
                    ? "关联至项目 / 空间"
                    : "申请发布"
            }
            open={["edit", "version", "move", "publish"].includes(panel)}
            onClose={() => setPanel("")}
            footer={
              <>
                <Button onClick={() => setPanel("")}>取消</Button>
                <Button
                  primary
                  onClick={() => {
                    if (
                      mutate(
                        panel === "publish" ? "已提交发布申请" : "已更新资产",
                        a.id,
                        (d, u) => {
                          const original = d.assets.find((x) => x.id === a.id)!;
                          if (!canEdit(original, u, space.id, d))
                            throw new Error("没有此资产的编辑权限。");
                          if (panel === "edit") {
                            if (!name.trim()) throw new Error("请输入名称。");
                            original.name = name;
                            original.description = description;
                          }
                          if (panel === "version") {
                            if (!version.trim() || !change.trim())
                              throw new Error("请填写版本号和变更说明。");
                            if (
                              original.versions.some(
                                (v) => v.number === version,
                              )
                            )
                              throw new Error(
                                "版本号已存在，不可覆盖历史版本。",
                              );
                            original.versions.push({
                              id: uid("version"),
                              number: version,
                              description: change,
                              at: now(),
                              by: u.id,
                              status: "有效",
                            });
                            original.version = version;
                          }
                          if (panel === "publish") {
                            if (
                              !original.name ||
                              !original.version ||
                              !original.description ||
                              !original.input ||
                              !original.output ||
                              !original.source ||
                              original.availability !== "可用"
                            )
                              throw new Error(
                                "发布前请补全信息并确认资源可用。",
                              );
                            original.publishStatus = "审核中";
                          }
                          if (panel === "move") {
                            const sp = d.spaces.find((x) => x.id === target);
                            if (
                              !sp ||
                              !canUse(
                                { ...original, spaceId: sp.id },
                                u,
                                sp.id,
                                d,
                              )
                            )
                              throw new Error("目标空间不可用。");
                            original.spaceId = sp.id;
                            original.projectId = sp.projectId;
                            original.visibility = "SPACE";
                          }
                          original.updatedAt = now();
                        },
                      )
                    )
                      setPanel("");
                  }}
                >
                  确认
                </Button>
              </>
            }
          >
            {panel === "edit" ? (
              <>
                <Field label="名称" required>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>
                <Field label="简介">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>
              </>
            ) : panel === "version" ? (
              <>
                <Field label="版本号" required>
                  <input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="V1.1"
                  />
                </Field>
                <Field label="变更说明" required>
                  <textarea
                    value={change}
                    onChange={(e) => setChange(e.target.value)}
                  />
                </Field>
              </>
            ) : panel === "move" ? (
              <Field label="目标空间">
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                >
                  <option value="">请选择</option>
                  {s.spaces
                    .filter(
                      (sp) =>
                        sp.type !== "PERSONAL" &&
                        s.members.some(
                          (m) =>
                            m.spaceId === sp.id &&
                            m.userId === p.id &&
                            m.status === "active",
                        ),
                    )
                    .map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.name}
                      </option>
                    ))}
                </select>
              </Field>
            ) : (
              <>
                <Details
                  values={{
                    资产: a.name,
                    版本: a.version,
                    发布目标:
                      a.type === "Skill"
                        ? "科研技能广场"
                        : a.type === "模型"
                          ? "科研模型广场"
                          : "正式资源发现范围",
                  }}
                />
                <Alert>
                  申请进入审核中；审核通过前不会出现在技能或模型广场。
                </Alert>
              </>
            )}
          </Modal>
        </>
      )}
    </>
  );
}
