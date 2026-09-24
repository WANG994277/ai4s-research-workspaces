"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Layers3,
  Wrench,
  Star,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import type { Artifact, Asset, Task, Tool } from "./types";
import { useResearch, notify } from "./store";
import { canRead, canUse, hasRole, now, published, uid } from "./domain";
import { disciplines, scoped } from "./seed";
import {
  AdvancedFilters,
  Alert,
  Badge,
  Button,
  Details,
  Empty,
  Field,
  Files,
  Modal,
  PageTitle,
  Pagination,
  SearchBox,
  Select,
  Tabs,
  download,
} from "./ui";
import {
  ContextActions,
  ExternalJump,
  PermissionRequest,
  SaveAsset,
} from "./actions";
import { matchesToolView } from "./catalog-views";
export function Catalog({ kind }: { kind: "skills" | "models" | "tools" }) {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const q = query.get("q") ?? "";
  const toolView = query.get("view") ?? "科研工具";
  const discipline = query.get("discipline") ?? "全部";
  const page = Number(query.get("page") ?? 1);
  const selectedId = query.get("id");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [availability, setAvailability] = useState("全部");
  const [type, setType] = useState("全部");
  const [provider, setProvider] = useState("全部");
  const [sort, setSort] = useState("相关度");
  const [more, setMore] = useState(false);
  const [verified, setVerified] = useState("全部");
  const [panel, setPanel] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [dataset, setDataset] = useState("");
  const [version, setVersion] = useState("");
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const title =
    kind === "skills"
      ? "科研技能"
      : kind === "models"
        ? "科研模型广场"
        : `科研工具箱 · ${toolView}`;
  const itemType =
    kind === "skills" ? "Skill" : kind === "models" ? "模型" : "工具";
  const Icon = kind === "skills" ? Layers3 : kind === "models" ? Box : Wrench;
  function params(key: string, value: string) {
    const next = new URLSearchParams(query.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace("/" + kind + "?" + next);
  }
  const source: (Asset | Tool)[] =
    kind === "tools"
      ? s.tools.filter((tool) => matchesToolView(toolView, tool.type))
      : published(s, kind === "skills" ? "Skill" : "模型");
  const visible = source.filter((o) => canRead(o, p, space.id, s));
  const item = visible.find((o) => o.id === selectedId);
  const list = visible
    .filter(
      (o) =>
        (!filters.tag || o.tags.includes(filters.tag)) &&
        (!filters.scope ||
          o.visibility ===
            (
              {
                平台公开: "PUBLIC",
                项目内: "PROJECT",
                当前空间: "SPACE",
              } as Record<string, string>
            )[filters.scope]) &&
        (!filters.connected ||
          ("authorization" in o && o.authorization === filters.connected)) &&
        (!filters.callable ||
          (filters.callable === "是") === canUse(o, p, space.id, s)) &&
        (discipline === "全部" || o.discipline === discipline) &&
        (!q ||
          [o.name, o.description, o.provider, ...o.tags]
            .join(" ")
            .toLowerCase()
            .includes(q.toLowerCase())) &&
        (availability === "全部" || o.availability === availability) &&
        (type === "全部" || o.type === type) &&
        (provider === "全部" || o.provider === provider) &&
        (verified === "全部" || ("validation" in o && !!o.validation)),
    )
    .sort((a, b) =>
      sort === "最近更新"
        ? b.updatedAt.localeCompare(a.updatedAt)
        : sort === "最近使用"
          ? (s.invocations.findLast((x) => x.resourceId === b.id)?.startedAt ??
              0) -
            (s.invocations.findLast((x) => x.resourceId === a.id)?.startedAt ??
              0)
          : sort === "使用频率"
            ? s.invocations.filter((x) => x.resourceId === b.id).length -
              s.invocations.filter((x) => x.resourceId === a.id).length
            : 0,
    );
  const favorite = (id: string) =>
    mutate("已更新收藏", id, (d) => {
      const f = d.favorites[p.id] ?? [];
      d.favorites[p.id] = f.includes(id)
        ? f.filter((x) => x !== id)
        : [...f, id];
    });
  const inv = item
    ? s.invocations
        .filter(
          (x) =>
            x.resourceId === item.id &&
            x.ownerId === p.id &&
            x.spaceId === space.id,
        )
        .at(-1)
    : undefined;
  function run() {
    if (!item) return false;
    if (!input.trim() && !files.length && !dataset) {
      notify("请填写输入或选择文件 / 数据集。");
      return false;
    }
    const id = uid("invocation");
    return mutate("已提交本地模拟调用", item.id, (d, u) => {
      if (!canUse(item, u, space.id, d))
        throw new Error("当前资源不可调用，请检查权限、状态或外部授权。");
      for (const rid of [...item.dependencies, ...(dataset ? [dataset] : [])]) {
        const resource = d.assets.find((x) => x.id === rid);
        if (!resource || !canUse(resource, u, space.id, d))
          throw new Error("依赖或输入数据无访问权限。");
      }
      let taskId: string | undefined;
      let artifactId: string | undefined;
      if (item.longRunning) {
        taskId = uid("task");
        const sessionId = uid("session");
        const t: Task = {
          ...scoped(taskId, item.name + " · 运行任务", space.id, "SPACE", u.id),
          projectId: space.projectId,
          type: itemType + "调用",
          status: "WAITING_RESOURCE",
          steps: [
            {
              id: taskId + "-1",
              name: "等待执行资源",
              status: "waiting",
              resources: [item.id],
              outputIds: [],
            },
          ],
          sessionIds: [sessionId],
          contextIds: dataset ? [dataset] : [],
          capabilityIds: [item.id],
          participants: [u.id],
          next: "资源可用后执行",
          reason: "本地演示：执行资源等待中，可在科研工作台重试。",
          constraint: input,
          createdAt: now(),
        };
        d.tasks.unshift(t);
        d.sessions.unshift({
          ...scoped(sessionId, t.name, space.id, "PRIVATE", u.id),
          projectId: space.projectId,
          messages: [{ id: uid("m"), role: "user", text: input, at: now() }],
          taskId,
          favorite: false,
          archived: false,
          contextIds: t.contextIds,
          capabilityIds: [item.id],
        });
      } else {
        artifactId = uid("artifact");
        let content =
          "本地模拟结果：已完成输入校验。科研结论需连接真实能力服务后生成。";
        if (item.id === "tool-csv") {
          const rows = input
            .trim()
            .split("\n")
            .map((r) => r.split(","));
          if (rows.length < 2)
            throw new Error("请输入包含字段行和至少一行数据的 CSV。");
          const keys = rows.shift()!;
          if (rows.some((r) => r.length !== keys.length))
            throw new Error("CSV 列数不一致，请检查数据。");
          content = JSON.stringify(
            rows.map((r) =>
              Object.fromEntries(keys.map((k, i) => [k.trim(), r[i].trim()])),
            ),
            null,
            2,
          );
        }
        d.artifacts.unshift({
          ...scoped(
            artifactId,
            item.name + " · 运行结果",
            space.id,
            "PRIVATE",
            u.id,
          ),
          projectId: space.projectId,
          type: "计算结果",
          taskId: "",
          sessionId: "",
          stepId: id,
          version: version || item.version,
          status: "待确认",
          content,
          references: [item.id, ...(dataset ? [dataset] : [])],
        });
      }
      d.invocations.push({
        id,
        resourceId: item.id,
        spaceId: space.id,
        ownerId: u.id,
        input: JSON.stringify({
          input,
          files,
          dataset,
          version: version || item.version,
        }),
        status: taskId ? "等待资源" : "已完成",
        startedAt: Date.now(),
        result: artifactId
          ? d.artifacts.find((x) => x.id === artifactId)!.content
          : "等待资源",
        taskId,
        artifactId,
      });
    });
  }
  return (
    <div className={`v-catalog v-catalog-${kind}`}>
      <PageTitle
        title={title}
        action={
          kind === "skills" && hasRole(p, "researcher", "leader") ? (
            <Button onClick={() => setPanel("external")}>
              <PlusIcon />
              创建{itemType}
              <ExternalLink size={14} />
            </Button>
          ) : undefined
        }
      />
      {selectedId && !item ? (
        <Empty>当前资源未发布、已下架或无访问权限。</Empty>
      ) : item ? (
        <>
          <Button className="v-back" onClick={() => params("id", "")}>
            <ArrowLeft size={15} />
            返回广场
          </Button>
          <div className="v-card">
            <div className="v-section-head">
              <div>
                <div className="v-resource-icon">
                  <Icon size={22} />
                </div>
                <h1 className="v-task-title">{item.name}</h1>
                <p>{item.description}</p>
                <div className="v-actions">
                  <Badge>{item.discipline}</Badge>
                  <Badge>{item.availability}</Badge>
                  <span className="v-muted">
                    {item.version} · {item.provider}
                  </span>
                </div>
              </div>
              <Button aria-label="收藏资源" onClick={() => favorite(item.id)}>
                <Star
                  size={16}
                  fill={
                    (s.favorites[p.id] ?? []).includes(item.id)
                      ? "currentColor"
                      : "none"
                  }
                />
              </Button>
            </div>
            <div className="v-actions">
              <Button
                disabled={!canUse(item, p, space.id, s)}
                onClick={() => setPanel("run")}
              >
                {item.type === "科研软件" ? "打开软件" : "立即使用"}
              </Button>
              <ContextActions object={item} capability />
              {item.availability === "权限受限" && (
                <Button onClick={() => setPanel("permission")}>申请权限</Button>
              )}
              {"authorization" in item && item.authorization !== "已连接" && (
                <Button onClick={() => setPanel("authorization")}>
                  连接授权
                </Button>
              )}
            </div>
            {!canUse(item, p, space.id, s) && (
              <Alert>
                {!hasRole(p, "researcher", "leader", "analyst")
                  ? "当前角色仅可查看资源。"
                  : "当前资源状态、授权或依赖不满足调用条件。"}
              </Alert>
            )}
          </div>
          <div className="v-grid two v-section">
            <section className="v-card">
              <h2>能力与使用</h2>
              <Details
                values={{
                  适用场景: item.tags.join("、"),
                  输入: item.input,
                  输出: item.output,
                  使用示例:
                    kind === "skills"
                      ? "从催化论文中整理实验条件与证据。"
                      : kind === "models"
                        ? "对已授权数据进行预测并复核关键因素。"
                        : "在当前科研任务中使用指定工具。",
                  限制条件: item.limitations,
                  依赖资源: item.dependencies.join("、") || "无额外资源依赖",
                }}
              />
            </section>
            <section className="v-card">
              <h2>来源与版本</h2>
              <Details
                values={{
                  发布方: item.provider,
                  来源: item.source,
                  当前版本: item.version,
                  可用范围:
                    item.visibility === "PUBLIC" ? "平台公开" : "项目授权",
                  更新时间: item.updatedAt,
                  ...("validation" in item
                    ? { 验证信息: item.validation }
                    : {
                        运行环境: "已接入科研环境（原型）",
                        使用方式: item.method,
                        授权状态: item.authorization,
                      }),
                }}
              />
              {"versions" in item && (
                <details>
                  <summary>历史版本</summary>
                  {item.versions.map((v) => (
                    <div className="v-list-line" key={v.id}>
                      <span>
                        {v.number} · {v.description}
                        <small>
                          {v.by} · {v.at}
                        </small>
                      </span>
                      <Badge>{v.status}</Badge>
                    </div>
                  ))}
                </details>
              )}
            </section>
          </div>
          {inv && (
            <section className="v-card v-section">
              <div className="v-section-head">
                <h2>最近运行结果</h2>
                <Badge>
                  {inv.taskId
                    ? s.tasks.find((t) => t.id === inv.taskId)?.status ===
                      "COMPLETED"
                      ? "已完成"
                      : inv.status
                    : inv.status}
                </Badge>
              </div>
              <p className="v-prose">{inv.result}</p>
              <Details
                values={{
                  运行时间: new Date(inv.startedAt).toLocaleString("zh-CN"),
                  版本: item.version,
                  输入: inv.input,
                  来源: "本地原型",
                }}
              />
              <div className="v-actions">
                {inv.taskId ? (
                  <Button
                    onClick={() => router.push("/workspace?task=" + inv.taskId)}
                  >
                    查看持续科研任务
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() =>
                        download(item.name + "-结果.txt", inv.result)
                      }
                    >
                      下载结果
                    </Button>
                    <Button
                      onClick={() =>
                        setArtifact(
                          s.artifacts.find((a) => a.id === inv.artifactId) ??
                            null,
                        )
                      }
                    >
                      保存为科研资产
                    </Button>
                  </>
                )}
                <Button onClick={() => setPanel("run")}>重新运行</Button>
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <div className="v-toolbar v-catalog-search-row">
            <SearchBox
              value={q}
              onChange={(v) => params("q", v)}
              placeholder={`搜索${itemType}名称、能力或科研场景`}
            />
          </div>
          <div className="v-catalog-taxonomy">
            <span>学科领域</span>
            <Tabs
              items={disciplines}
              value={discipline}
              onChange={(v) => params("discipline", v)}
            />
          </div>
          <div className="v-toolbar v-catalog-filters">
            <Select
              label="可用状态"
              value={availability}
              onChange={setAvailability}
              options={[
                "全部",
                "可用",
                "需要授权",
                "权限受限",
                "维护中",
                "暂不可用",
              ]}
            />
            {kind === "tools" && (
              <Select
                label="工具类型"
                value={type}
                onChange={setType}
                options={[
                  "全部",
                  "科研软件",
                  "专业科研工具",
                  "数据处理",
                  "科学计算",
                  "可视化",
                  "文件处理",
                  "外部服务",
                  "连接器",
                  "其他",
                ]}
              />
            )}
            <AdvancedFilters
              value={filters}
              onChange={setFilters}
              fields={[
                {
                  key: "tag",
                  label: "能力标签",
                  options: [...new Set(visible.flatMap((o) => o.tags))],
                },
                {
                  key: "scope",
                  label: "可用范围",
                  options: ["平台公开", "项目内", "当前空间"],
                },
                {
                  key: "callable",
                  label: "支持当前空间调用",
                  options: ["是", "否"],
                },
                ...(kind === "tools"
                  ? [
                      {
                        key: "connected",
                        label: "连接状态",
                        options: ["已连接", "未连接", "授权失效"],
                      },
                    ]
                  : []),
              ]}
            />
            <Button onClick={() => setMore(!more)}>发布与验证筛选</Button>
            {more && (
              <>
                <Select
                  label="发布方"
                  value={provider}
                  onChange={setProvider}
                  options={["全部", ...new Set(visible.map((x) => x.provider))]}
                />
                {kind !== "tools" && (
                  <Select
                    label="验证信息"
                    value={verified}
                    onChange={setVerified}
                    options={["全部", "已验证"]}
                  />
                )}
                <Button
                  onClick={() => {
                    setAvailability("全部");
                    setType("全部");
                    setProvider("全部");
                    setVerified("全部");
                    params("q", "");
                  }}
                >
                  清空筛选
                </Button>
              </>
            )}
          </div>
          <div className="v-catalog-result-head">
            <div>
              <h2>{q ? "搜索结果" : `全部${itemType}`}</h2>
              <span>{list.length} 项</span>
            </div>
            <Select
              label="排序"
              value={sort}
              onChange={setSort}
              options={
                kind === "tools"
                  ? ["相关度", "最近使用", "最近更新"]
                  : ["相关度", "最近更新", "使用频率", "最近使用"]
              }
            />
          </div>
          <div className={`v-grid v-catalog-grid v-catalog-grid-${kind}`}>
            {list.slice((page - 1) * 8, page * 8).map((o) => (
              <article className="v-card v-resource-card" key={o.id}>
                {kind === "models" && (
                  <div
                    className="v-model-cover"
                    data-discipline={o.discipline}
                  >
                    <span>{o.discipline}</span>
                    <Icon size={36} />
                    <small>{o.tags.slice(0, 2).join(" · ")}</small>
                  </div>
                )}
                <div className="v-resource-card-body">
                  <div className="v-section-head">
                    <div className="v-resource-icon">
                      <Icon size={21} />
                    </div>
                    <Badge>{o.availability}</Badge>
                  </div>
                  <h3>
                    <button
                      className="v-link v-task-link"
                      onClick={() => params("id", o.id)}
                    >
                      {o.name}
                    </button>
                  </h3>
                  <p>{o.description}</p>
                  <div className="v-catalog-tags">
                    {o.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="v-muted v-resource-meta">
                    <span>{o.discipline}</span>
                    <span>{o.version}</span>
                    <span>{o.provider}</span>
                  </div>
                  <div className="v-actions">
                    <Button onClick={() => params("id", o.id)}>
                      查看详情
                    </Button>
                    <Button
                      primary={canUse(o, p, space.id, s)}
                      disabled={!canUse(o, p, space.id, s)}
                      onClick={() => {
                        params("id", o.id);
                        setPanel("run");
                      }}
                    >
                      {o.type === "科研软件" ? "打开软件" : "调用"}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {!list.length && (
            <Empty
              action={
                <Button
                  onClick={() => {
                    setAvailability("全部");
                    setType("全部");
                    setProvider("全部");
                    params("q", "");
                  }}
                >
                  清空筛选
                </Button>
              }
            >
              没有符合条件的资源。
            </Empty>
          )}
          <Pagination
            page={page}
            total={list.length}
            onChange={(v) => params("page", String(v))}
          />
        </>
      )}
      <ExternalJump
        kind={"创建" + itemType}
        open={panel === "external"}
        onClose={() => setPanel("")}
      />
      {item && (
        <>
          <Modal
            title={item.name + " · 输入配置"}
            open={panel === "run"}
            onClose={() => setPanel("")}
            wide
            footer={
              <>
                <Button onClick={() => setPanel("")}>返回</Button>
                <Button
                  primary
                  disabled={!canUse(item, p, space.id, s)}
                  onClick={() => {
                    if (run()) setPanel("");
                  }}
                >
                  执行{itemType}
                </Button>
              </>
            }
          >
            <Field label={item.input} required>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  item.id === "tool-csv" ? "name,value\nporosity,0.12" : ""
                }
              />
            </Field>
            <Files value={files} onChange={setFiles} />
            <div className="v-form-grid v-section">
              <Field label="引用数据集">
                <select
                  value={dataset}
                  onChange={(e) => setDataset(e.target.value)}
                >
                  <option value="">不使用数据集</option>
                  {s.assets
                    .filter(
                      (a) => a.type === "数据集" && canUse(a, p, space.id, s),
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
            </div>
            {"versions" in item && (
              <Field label="版本">
                <select
                  value={version || item.version}
                  onChange={(e) => setVersion(e.target.value)}
                >
                  {item.versions.map((v) => (
                    <option key={v.id}>{v.number}</option>
                  ))}
                </select>
              </Field>
            )}
            <Alert>
              除 CSV 格式转换外，本次调用演示状态流，不执行真实科研计算。
            </Alert>
          </Modal>
          <Modal
            title="外部连接授权"
            open={panel === "authorization"}
            onClose={() => setPanel("")}
            footer={
              <Button
                onClick={() => {
                  notify("尚未配置外部授权地址，授权状态未变更。");
                }}
              >
                前往授权
              </Button>
            }
          >
            <Details
              values={{
                连接对象: item.name,
                来源系统: item.source,
                授权状态:
                  "authorization" in item ? item.authorization : "未连接",
              }}
            />
            <Alert>外部系统尚未接入，需要配置正式授权流程。</Alert>
          </Modal>
          <PermissionRequest
            objectId={item.id}
            open={panel === "permission"}
            onClose={() => setPanel("")}
          />
        </>
      )}
      {artifact && (
        <SaveAsset artifact={artifact} open onClose={() => setArtifact(null)} />
      )}
    </div>
  );
}
function PlusIcon() {
  return <span aria-hidden>＋</span>;
}
