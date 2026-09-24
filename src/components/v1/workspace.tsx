"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUp,
  Plus,
  Paperclip,
  BookOpen,
  Database,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  MoreHorizontal,
  SquareCheckBig,
  CirclePlay,
  FileStack,
  Bot,
} from "lucide-react";
import { useResearch, notify } from "./store";
import {
  activeTasks,
  canEdit,
  canRead,
  canUse,
  hasRole,
  needsTask,
  now,
  taskLabels,
  transitionTask,
  uid,
  writable,
} from "./domain";
import { scoped, userName } from "./seed";
import {
  Badge,
  Button,
  Confirm,
  Details,
  Empty,
  Field,
  Files,
  Modal,
  SearchBox,
  Select,
} from "./ui";
import { ContextActions, ResourcePicker, SaveAsset } from "./actions";
import type { Artifact, Decision, Session, Task } from "./types";
import { collectChatFiles, resolveWorkspaceSession } from "./workspace-view";
export function Workspace() {
  const { s, p, space, key, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const taskId =
    query.get("task") ??
    s.sessions.find((x) => x.id === query.get("session"))?.taskId;
  const sessionId = query.get("session");
  const view = query.get("view") ?? "home";
  const [mode, setMode] = useState("自动");
  const [search, setSearch] = useState("");
  const [historyRange, setHistoryRange] = useState("当前空间");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [panel, setPanel] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [fileTab, setFileTab] = useState<"产出" | "引用资料">("产出");
  const [decisionId, setDecisionId] = useState("");
  const [choice, setChoice] = useState("");
  const [custom, setCustom] = useState("");
  const [output, setOutput] = useState<Artifact | null>(null);
  const [save, setSave] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [rename, setRename] = useState("");
  const [shareUser, setShareUser] = useState("");
  const [taskFilter, setTaskFilter] = useState("全部");
  const [plan, setPlan] = useState("");
  const [constraint, setConstraint] = useState("");
  const draft = s.drafts[key] ?? "";
  const histories = s.sessions.filter(
    (x) =>
      canRead(x, p, space.id, s) &&
      !x.archived &&
      (historyRange === "全部有权空间" || x.spaceId === space.id) &&
      x.name.includes(search),
  );
  const task = s.tasks.find(
    (t) => t.id === taskId && canRead(t, p, space.id, s),
  );
  const readableSessions = s.sessions.filter((item) =>
    canRead(item, p, space.id, s),
  );
  const session = task
    ? resolveWorkspaceSession(readableSessions, sessionId, task)
    : readableSessions.find((item) => item.id === sessionId);
  const tasks = activeTasks(s)
    .filter((t) => t.spaceId === space.id && canRead(t, p, space.id, s))
    .sort(
      (a, b) =>
        (["WAITING_HUMAN", "RUNNING", "WAITING_RESOURCE"].includes(a.status)
          ? ["WAITING_HUMAN", "RUNNING", "WAITING_RESOURCE"].indexOf(a.status)
          : 3) -
        (["WAITING_HUMAN", "RUNNING", "WAITING_RESOURCE"].includes(b.status)
          ? ["WAITING_HUMAN", "RUNNING", "WAITING_RESOURCE"].indexOf(b.status)
          : 3),
    );
  const artifacts = s.artifacts.filter(
    (a) => a.spaceId === space.id && canRead(a, p, space.id, s),
  );
  const decisions = s.decisions.filter(
    (d) =>
      d.assignee === p.id &&
      d.status === "pending" &&
      s.tasks.some((t) => t.id === d.taskId && t.spaceId === space.id),
  );
  const decision = s.decisions.find((d) => d.id === decisionId);
  const editable = task ? canEdit(task, p, space.id, s) : true;
  const activeConversation = !!(task || session);
  const resourceById = (id: string) =>
    [
      ...s.assets,
      ...s.tools,
      ...s.knowledge,
      ...s.artifacts,
      ...s.spaces,
      ...s.sessions,
    ].find((item) => item.id === id);
  const resourceName = (id: string) => resourceById(id)?.name ?? id;
  const chatFiles = collectChatFiles(
    artifacts,
    task,
    session,
    (id) => {
      const resource = [
        ...s.assets,
        ...s.tools,
        ...s.knowledge,
        ...s.artifacts,
        ...s.sessions,
      ].find((item) => item.id === id);
      return !!resource && canRead(resource, p, space.id, s);
    },
  );
  function openTask(t: Task) {
    router.push("/workspace?task=" + t.id);
  }
  function act(action: string) {
    if (!task) return;
    mutate(
      action === "pause"
        ? "已暂停任务"
        : action === "cancel"
          ? "已取消任务"
          : "已开始科研任务",
      task.id,
      (d, u) => {
        const t = d.tasks.find((x) => x.id === task.id)!;
        if (!canEdit(t, u, space.id, d))
          throw new Error("没有此任务的执行权限。");
        t.status = transitionTask(t.status, action);
        t.updatedAt = now();
        if (t.status === "RUNNING") {
          t.runAt = Date.now() + 8000;
          const step = t.steps.find((x) => x.status !== "completed");
          if (step) {
            step.status = "running";
            step.startedAt = now();
          }
        }
      },
    );
  }
  function send() {
    if (!draft.trim() && !files.length) return;
    if (
      !writable(s, p, space.id) ||
      !hasRole(p, "researcher", "leader", "analyst")
    ) {
      notify("当前空间或角色不允许创建科研任务。");
      return;
    }
    const id = session?.id ?? uid("session");
    const complex = needsTask(draft, mode);
    const newTaskId = task?.id ?? (complex ? uid("task") : undefined);
    const ok = mutate(
      complex ? "已创建持续科研任务" : "已保存会话",
      id,
      (d, u) => {
        const refs = d.pendingContext[key] ?? [];
        const caps = d.pendingCapabilities[key] ?? [];
        for (const rid of [...refs, ...caps]) {
          const o = [
            ...d.assets,
            ...d.tools,
            ...d.knowledge,
            ...d.artifacts,
            ...d.sessions,
          ].find((x) => x.id === rid);
          if (
            o &&
            ("publishStatus" in o || "authorization" in o
              ? !canUse(o, u, space.id, d)
              : !canRead(o, u, space.id, d))
          )
            throw new Error("引用资源的权限已变化，请重新选择。");
        }
        let ss = d.sessions.find((x) => x.id === id);
        if (!ss) {
          ss = {
            ...scoped(
              id,
              draft.trim().slice(0, 32) || "附件研究",
              space.id,
              "PRIVATE",
              u.id,
            ),
            projectId: space.projectId,
            messages: [],
            favorite: false,
            archived: false,
            contextIds: refs,
            capabilityIds: caps,
            taskId: newTaskId,
          };
          d.sessions.unshift(ss);
          if (task) {
            const ownerTask = d.tasks.find((t) => t.id === task.id);
            if (ownerTask && !ownerTask.sessionIds.includes(id))
              ownerTask.sessionIds.push(id);
          }
        }
        ss.messages.push({
          id: uid("message"),
          role: "user",
          text: draft + (files.length ? "\n附件：" + files.join("、") : ""),
          at: now(),
        });
        ss.updatedAt = now();
        if (complex && !task) {
          const t: Task = {
            ...scoped(
              newTaskId!,
              draft.slice(0, 36) || "附件研究任务",
              space.id,
              "SPACE",
              u.id,
            ),
            projectId: space.projectId,
            type: mode === "深度研究" ? "深度研究" : "综合研究",
            status: "PLANNING",
            steps: [
              "核对输入资料与研究范围",
              "调用授权能力开展分析",
              "形成科研产出并保留来源",
            ].map((name, i) => ({
              id: newTaskId + "-" + i,
              name,
              status: "pending",
              resources:
                i === 1 ? (caps.length ? caps : ["skill-evidence"]) : refs,
              outputIds: [],
            })),
            sessionIds: [id],
            contextIds: refs,
            capabilityIds: caps.length ? caps : ["skill-evidence"],
            participants: [u.id],
            next: "确认研究计划",
            reason: "",
            constraint: "",
            createdAt: now(),
          };
          d.tasks.unshift(t);
        } else {
          ss.messages.push({
            id: uid("message"),
            role: "assistant",
            text: task
              ? "已记录补充信息，后续执行将保留这项约束。"
              : "这是本地会话演示。已记录你的问题和上下文；真实回答需要接入 Research Agent 服务。该即时会话不会创建持续科研任务。",
            at: now(),
          });
        }
        d.drafts[key] = "";
        d.pendingContext[key] = [];
        d.pendingCapabilities[key] = [];
      },
    );
    if (ok) {
      setFiles([]);
      router.push(
        "/workspace?" + (newTaskId ? "task=" + newTaskId : "session=" + id),
      );
    }
  }
  function decide(d: Decision) {
    setDecisionId(d.id);
    setChoice(d.options[1] ?? d.options[0]);
    setCustom("");
  }
  const input = (
    <div className="v-composer">
      <textarea
        aria-label="科研任务输入"
        placeholder="输入你的科研问题，或描述想推进的研究…"
        value={draft}
        onChange={(e) =>
          mutate("", space.id, (d) => {
            d.drafts[key] = e.target.value;
          })
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            send();
          }
        }}
      />
      {[...(s.pendingContext[key] ?? []), ...(s.pendingCapabilities[key] ?? [])]
        .length > 0 && (
        <div className="v-actions v-context-chips">
          {[
            ...(s.pendingContext[key] ?? []),
            ...(s.pendingCapabilities[key] ?? []),
          ].map((id) => (
            <span className="v-chip" key={id}>
              {resourceName(id)}
              <button
                aria-label={"移除 " + resourceName(id)}
                onClick={() =>
                  mutate("", id, (d) => {
                    d.pendingContext[key] = (
                      d.pendingContext[key] ?? []
                    ).filter((x) => x !== id);
                    d.pendingCapabilities[key] = (
                      d.pendingCapabilities[key] ?? []
                    ).filter((x) => x !== id);
                  })
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {files.length > 0 && (
        <p className="v-muted v-context-chips">已选择 {files.length} 个附件</p>
      )}
      <div className="v-composer-toolbar">
        <div className="v-actions">
          <button onClick={() => setPanel("files")}>
            <Paperclip size={15} />
            附件
          </button>
          <button onClick={() => setPanel("knowledge")}>
            <BookOpen size={15} />
            引用知识
          </button>
          <button onClick={() => setPanel("data")}>
            <Database size={15} />
            关联数据
          </button>
          <label>
            <span className="sr-only">研究模式</span>
            <select
              aria-label="研究模式"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              {["自动", "深度研究", "快速分析"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
        </div>
        <Button
          primary
          aria-label="发送科研任务"
          disabled={
            (!draft.trim() && !files.length) || !writable(s, p, space.id)
          }
          onClick={send}
        >
          <ArrowUp size={18} />
        </Button>
      </div>
    </div>
  );
  return (
    <div
      className={`v-workspace ${historyCollapsed && !activeConversation ? "history-collapsed" : ""} ${activeConversation ? "conversation-active" : ""}`}
    >
      <aside
        className={`v-history ${historyCollapsed && !activeConversation ? "collapsed" : ""}`}
      >
        {activeConversation && (
          <button
            type="button"
            className="v-chat-brand"
            onClick={() => router.push("/workspace")}
            aria-label="新建科研对话"
          >
            <Image
              src="/v1/ai4s-logo.png"
              alt="AI4S · AI for Science"
              width={104}
              height={44}
            />
            <span>Research Agent</span>
          </button>
        )}
        <div className="v-history-actions">
          {(!historyCollapsed || activeConversation) && (
            <Button onClick={() => router.push("/workspace")}>
              <Plus size={16} />
              {activeConversation ? "新建对话" : "新建科研任务"}
            </Button>
          )}
          {!activeConversation && (
            <button
              type="button"
              className="v-history-toggle"
              aria-label={historyCollapsed ? "展开会话栏" : "收起会话栏"}
              aria-expanded={!historyCollapsed}
              onClick={() => setHistoryCollapsed((value) => !value)}
            >
              {historyCollapsed ? (
                <PanelLeftOpen size={17} />
              ) : (
                <PanelLeftClose size={17} />
              )}
            </button>
          )}
          {historyCollapsed && !activeConversation && (
            <button
              type="button"
              className="v-history-new-icon"
              aria-label="新建科研任务"
              onClick={() => router.push("/workspace")}
            >
              <Plus size={17} />
            </button>
          )}
        </div>
        {(!historyCollapsed || activeConversation) && (
          <>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="搜索历史会话"
            />
            <Select
              label="范围"
              value={historyRange}
              onChange={setHistoryRange}
              options={["当前空间", "全部有权空间"]}
            />
            <p className="v-history-label">最近会话</p>
            {histories.map((h) => (
          <div
            className={`v-history-item ${h.id === session?.id ? "selected" : ""}`}
            key={h.id}
          >
            <button
              onClick={() => {
                if (h.spaceId !== space.id) {
                  mutate("已恢复原空间会话", h.id, (d) => {
                    d.spaceId = h.spaceId;
                  });
                }
                router.push("/workspace?session=" + h.id);
              }}
            >
              {h.favorite ? "★ " : ""}
              {h.name}
            </button>
            <button
              aria-label={h.name + " 会话操作"}
              onClick={() => {
                if (h.ownerId !== p.id) {
                  notify("共享会话当前为只读。");
                  return;
                }
                setEditSession(h);
                setRename(h.name);
              }}
            >
              <MoreHorizontal size={15} />
            </button>
          </div>
            ))}
            {!histories.length && <p className="v-muted">暂无历史会话</p>}
            {!activeConversation && (
              <button
                className="v-link v-history-all"
                onClick={() => router.push("/workspace?view=history")}
              >
                查看全部
              </button>
            )}
          </>
        )}
      </aside>
      <div className="v-research-main">
        {(taskId && !task) || (sessionId && !session) ? (
          <Empty>当前对象不可访问，或已不存在。</Empty>
        ) : task || session ? (
          <>
            <section className="v-chat-main" aria-label="主会话区">
              <header className="v-chat-header">
                <div>
                  <h1>{task?.name ?? session?.name}</h1>
                  <div className="v-chat-meta">
                    <Badge>
                      {task ? taskLabels[task.status] : "对话中"}
                    </Badge>
                    <span>{space.name}</span>
                  </div>
                </div>
              </header>

              <div className="v-chat-scroll">
                <div className="v-conversation">
                  {session?.messages.map((message) => (
                    <article
                      className={`v-message ${message.role}`}
                      key={message.id}
                    >
                      <span className="v-message-avatar" aria-hidden="true">
                        {message.role === "user" ? p.name[0] : <Bot size={17} />}
                      </span>
                      <div>
                        <strong>
                          {message.role === "user" ? p.name : "Research Agent"}
                        </strong>
                        <p>{message.text}</p>
                        <time>{message.at.replace("T", " ").slice(0, 16)}</time>
                      </div>
                    </article>
                  ))}

                  {task && (
                    <section className="v-agent-run-card" aria-label="Agent执行进度">
                      <header>
                        <span><Bot size={18} /></span>
                        <div>
                          <strong>
                            Agent {task.status === "COMPLETED" ? "已完成" : "正在执行"}
                          </strong>
                          <small>{task.next || "持续推进科研任务"}</small>
                        </div>
                        <Badge>{taskLabels[task.status]}</Badge>
                      </header>
                      <ol>
                        {task.steps.map((step, index) => (
                          <li className={step.status} key={step.id}>
                            <span className="v-agent-step-icon">
                              {step.status === "completed" ? (
                                <CheckCircle2 size={18} />
                              ) : step.status === "running" ? (
                                <CirclePlay size={18} />
                              ) : (
                                <Circle size={18} />
                              )}
                            </span>
                            <div>
                              <strong>{step.name}</strong>
                              <small>
                                {step.status === "completed"
                                  ? "已完成"
                                  : step.status === "failed"
                                    ? "执行失败"
                                    : step.status === "waiting"
                                      ? "等待确认"
                                      : step.status === "running"
                                        ? "当前步骤"
                                        : `步骤 ${index + 1}`}
                              </small>
                            </div>
                          </li>
                        ))}
                      </ol>
                      {task.status === "PLANNING" && (
                        <div className="v-agent-run-actions">
                          <Button
                            primary
                            disabled={!editable}
                            onClick={() => act("start")}
                          >
                            <Play size={15} />
                            开始执行
                          </Button>
                          <Button
                            disabled={!editable}
                            onClick={() => {
                              setPlan(task.steps.map((step) => step.name).join("\n"));
                              setPanel("plan");
                            }}
                          >
                            调整计划
                          </Button>
                        </div>
                      )}
                    </section>
                  )}

                  {task && (
                    <>
                {task.status === "PLANNING" && (
                  <div className="v-chat-note">
                    <Button
                      disabled={!editable}
                      onClick={() => {
                        setConstraint(task.constraint);
                        setPanel("constraint");
                      }}
                    >
                      添加约束
                    </Button>
                  </div>
                )}
                {["FAILED", "WAITING_RESOURCE", "PAUSED"].includes(
                  task.status,
                ) && (
                  <div className="v-chat-status-card" role="status">
                    {task.reason ||
                      "该科研任务已暂停，可恢复原上下文继续执行。"}
                    <div className="v-actions">
                      <Button
                        disabled={!editable}
                        onClick={() =>
                          act(task.status === "PAUSED" ? "resume" : "retry")
                        }
                      >
                        {task.status === "PAUSED" ? "恢复执行" : "重新执行"}
                      </Button>
                      <Button
                        disabled={!editable}
                        onClick={() => {
                          setPlan(task.steps.map((x) => x.name).join("\n"));
                          setPanel("plan");
                        }}
                      >
                        调整方案
                      </Button>
                    </div>
                  </div>
                )}
                {task.status === "WAITING_HUMAN" &&
                  s.decisions
                    .filter(
                      (d) => d.taskId === task.id && d.status === "pending",
                    )
                    .map((d) => (
                      <section className="v-decision-card" key={d.id}>
                        <div>
                          <strong>需要你的确认</strong>
                          <p>{d.question}</p>
                          <small>{d.recommendation}</small>
                        </div>
                        <div>
                          <Button
                            primary
                            disabled={d.assignee !== p.id}
                            onClick={() => decide(d)}
                          >
                            查看并处理
                          </Button>
                        </div>
                      </section>
                    ))}
                {editable &&
                  !["COMPLETED", "CANCELLED"].includes(task.status) && (
                    <div className="v-chat-task-actions">
                      {task.status === "RUNNING" && (
                        <Button onClick={() => act("pause")}>暂停任务</Button>
                      )}
                      <Confirm
                        title="取消科研任务"
                        description="任务将停止执行，已有会话、步骤与产出保留。"
                        onConfirm={() => act("cancel")}
                      >
                        取消任务
                      </Confirm>
                      {task.status === "RUNNING" && (
                        <span className="v-muted">
                          任务将在本地后台继续，刷新后可恢复。
                        </span>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>
              </div>

              {(!task
                ? !session ||
                  session.ownerId === p.id ||
                  session.visibility === "COLLABORATIVE"
                : editable) && <div className="v-chat-composer">{input}</div>}
            </section>

            <aside className="v-chat-files" aria-label="聊天文件">
              <header>
                <div>
                  <h2>聊天文件</h2>
                  <span>{chatFiles.outputs.length + chatFiles.referenceIds.length}</span>
                </div>
              </header>
              <div className="v-chat-file-tabs" role="tablist">
                {(["产出", "引用资料"] as const).map((tab) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={fileTab === tab}
                    className={fileTab === tab ? "selected" : ""}
                    onClick={() => setFileTab(tab)}
                    key={tab}
                  >
                    {tab}
                    <span>
                      {tab === "产出"
                        ? chatFiles.outputs.length
                        : chatFiles.referenceIds.length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="v-chat-file-list">
                {fileTab === "产出" ? (
                  chatFiles.outputs.length ? (
                    chatFiles.outputs.map((artifact) => (
                      <button
                        type="button"
                        className="v-chat-file-card"
                        onClick={() => setOutput(artifact)}
                        key={artifact.id}
                      >
                        <span className="v-chat-file-icon"><FileText size={20} /></span>
                        <div>
                          <strong>{artifact.name}</strong>
                          <small>
                            {artifact.type} · {artifact.version} · {artifact.status}
                          </small>
                          <p>{artifact.content}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <Empty>当前对话还没有形成科研产出。</Empty>
                  )
                ) : chatFiles.referenceIds.length ? (
                  chatFiles.referenceIds.map((id) => (
                    <div className="v-chat-reference" key={id}>
                      <BookOpen size={18} />
                      <div>
                        <strong>{resourceName(id)}</strong>
                        <small>已加入当前科研上下文</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <Empty>当前对话还没有引用资料。</Empty>
                )}
              </div>
            </aside>
          </>
        ) : view === "history" ? (
          <>
            <h1>历史会话</h1>
            {histories.map((h) => (
              <Link
                className="v-list-line"
                href={"/workspace?session=" + h.id}
                key={h.id}
              >
                {h.name}
                <Badge>{h.visibility === "PRIVATE" ? "私有" : "已共享"}</Badge>
              </Link>
            ))}
          </>
        ) : (
          <>
            <section className="v-agent-home">
              <span className="v-kicker">UNIFIED RESEARCH AGENT</span>
              <h1>今天想推进什么科研任务？</h1>
              {input}
            </section>
            {(view === "home" || view === "pending") && (
              <section className="v-section v-workbench-panel v-pending-panel">
                <div className="v-section-head">
                  <h2>
                    <SquareCheckBig size={18} />
                    需要我处理{" "}
                    {decisions.length > 0 && (
                      <span className="v-count">{decisions.length}</span>
                    )}
                  </h2>
                  <Link href="/workspace?view=pending" className="v-link">
                    查看全部
                  </Link>
                </div>
                {decisions.length ? (
                  <div className="v-data-table v-pending-table">
                    <div className="v-data-head">
                      <span>任务 / 事项</span>
                      <span>Agent 建议</span>
                      <span>来源</span>
                      <span>时间</span>
                      <span>操作</span>
                    </div>
                    {decisions.map((decisionItem) => {
                      const relatedTask = s.tasks.find(
                        (taskItem) => taskItem.id === decisionItem.taskId,
                      );
                      return (
                        <div className="v-data-row" key={decisionItem.id}>
                          <div>
                            <strong>
                              {relatedTask?.name ?? decisionItem.question}
                            </strong>
                            <small>{decisionItem.question}</small>
                          </div>
                          <div>
                            <span>{decisionItem.recommendation}</span>
                            <small>{decisionItem.reason}</small>
                          </div>
                          <span>{space.name}</span>
                          <span>
                            {relatedTask?.updatedAt
                              .slice(0, 16)
                              .replace("T", " ") ?? "待处理"}
                          </span>
                          <Button onClick={() => decide(decisionItem)}>
                            查看并处理
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty>当前没有需要你处理的事项。</Empty>
                )}
              </section>
            )}
            {(view === "home" || view === "tasks") && (
              <section className="v-section v-workbench-panel v-research-panel">
                <div className="v-section-head">
                  <h2>
                    <CirclePlay size={18} />
                    当前研究
                  </h2>
                  <Link href="/workspace?view=tasks" className="v-link">
                    查看全部
                  </Link>
                </div>
                {view === "tasks" && (
                  <Select
                    label="状态"
                    value={taskFilter}
                    onChange={setTaskFilter}
                    options={["全部", ...Object.values(taskLabels)]}
                  />
                )}
                <div className="v-data-table v-research-table">
                  <div className="v-data-head">
                    <span>研究任务</span>
                    <span>状态</span>
                    <span>当前步骤</span>
                    <span>下一步</span>
                    <span>更新时间</span>
                    <span>操作</span>
                  </div>
                  {tasks
                    .filter(
                      (t) =>
                        taskFilter === "全部" ||
                        taskLabels[t.status] === taskFilter,
                    )
                    .slice(0, view === "home" ? 3 : 99)
                    .map((t) => (
                      <div className="v-data-row" key={t.id}>
                        <div>
                          <button
                            className="v-link v-task-link"
                            onClick={() => openTask(t)}
                          >
                            {t.name}
                          </button>
                          <small>
                            {t.type} · {space.name}
                          </small>
                        </div>
                        <Badge>{taskLabels[t.status]}</Badge>
                        <span>
                          {t.steps.find(
                            (step) =>
                              step.status === "running" ||
                              step.status === "waiting" ||
                              step.status === "failed",
                          )?.name ?? t.next}
                        </span>
                        <span>{t.next}</span>
                        <span>
                          {t.updatedAt.slice(0, 16).replace("T", " ")}
                        </span>
                        <Button onClick={() => openTask(t)}>查看</Button>
                      </div>
                    ))}
                  {!tasks.length && (
                    <Empty
                      action={
                        <Button onClick={() => router.push("/workspace")}>
                          发起科研任务
                        </Button>
                      }
                    >
                      暂无持续进行中的科研任务。
                    </Empty>
                  )}
                </div>
              </section>
            )}
            {(view === "home" || view === "outputs") && (
              <section className="v-section v-workbench-panel v-output-panel">
                <div className="v-section-head">
                  <h2>
                    <FileStack size={18} />
                    最近科研产出
                  </h2>
                  <Link href="/assets?view=我的资产" className="v-link">
                    查看全部
                  </Link>
                </div>
                <div className="v-data-table v-output-table">
                  <div className="v-data-head">
                    <span>产出名称</span>
                    <span>类型</span>
                    <span>版本</span>
                    <span>状态</span>
                    <span>来源任务</span>
                    <span>更新时间</span>
                    <span>操作</span>
                  </div>
                  {artifacts.slice(0, view === "home" ? 3 : 99).map((a) => (
                    <div className="v-data-row" key={a.id}>
                      <div>
                        <button
                          className="v-link v-task-link"
                          onClick={() => setOutput(a)}
                        >
                          {a.name}
                        </button>
                        <small>Research Artifact</small>
                      </div>
                      <span>{a.type}</span>
                      <span>{a.version}</span>
                      <Badge>{a.status}</Badge>
                      <span>
                        {s.tasks.find((taskItem) => taskItem.id === a.taskId)
                          ?.name ?? "独立调用"}
                      </span>
                      <span>{a.updatedAt.slice(0, 16).replace("T", " ")}</span>
                      <Button onClick={() => setOutput(a)}>查看</Button>
                    </div>
                  ))}
                  {!artifacts.length && (
                    <Empty>尚未形成可沉淀的科研产出。</Empty>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
      <ResourcePicker
        mode="knowledge"
        open={panel === "knowledge"}
        onClose={() => setPanel("")}
      />
      <ResourcePicker
        mode="data"
        open={panel === "data"}
        onClose={() => setPanel("")}
      />
      <Modal
        title="附件"
        open={panel === "files"}
        onClose={() => setPanel("")}
        footer={
          <Button primary onClick={() => setPanel("")}>
            完成
          </Button>
        }
      >
        <Files value={files} onChange={setFiles} />
        <p className="v-muted">本地原型保留附件信息，未上传至服务器。</p>
      </Modal>
      <Modal
        title="需要你确认"
        open={!!decision}
        bottom
        onClose={() => setDecisionId("")}
        footer={
          <>
            <Button onClick={() => setDecisionId("")}>暂不处理</Button>
            <Button
              primary
              disabled={!choice || (choice === "自定义" && !custom.trim())}
              onClick={() => {
                if (!decision) return;
                if (
                  mutate("已记录人工决策", decision.id, (d, u) => {
                    const item = d.decisions.find((x) => x.id === decision.id)!;
                    if (item.assignee !== u.id || item.status !== "pending")
                      throw new Error("当前不能处理此决策。");
                    item.status = "decided";
                    item.choice = choice === "自定义" ? custom : choice;
                    item.by = u.id;
                    item.at = now();
                    if (item.experimentId) {
                      const e = d.experiments.find(
                        (x) => x.id === item.experimentId,
                      );
                      if (e) {
                        e.status = "待执行";
                        e.exception = "";
                        e.records.push(now() + " 人工决策：" + item.choice);
                      }
                    }
                    const t = d.tasks.find((x) => x.id === item.taskId)!;
                    t.status = item.experimentId
                      ? "WAITING_RESOURCE"
                      : "RUNNING";
                    t.runAt = item.experimentId ? undefined : Date.now() + 8000;
                    if (item.experimentId)
                      t.reason = "等待实验重新执行与结果确认。";
                    const st = t.steps.find((x) => x.id === item.stepId);
                    if (st) st.status = "running";
                    const ss = d.sessions.find((x) => x.id === t.sessionIds[0]);
                    ss?.messages.push({
                      id: uid("m"),
                      role: "user",
                      text: "人工决策：" + item.choice,
                      at: now(),
                    });
                  })
                )
                  setDecisionId("");
              }}
            >
              确认并继续
            </Button>
          </>
        }
      >
        {decision && (
          <>
            <h3>{decision.question}</h3>
            <Details
              values={{
                "Agent 建议": decision.recommendation,
                建议原因: decision.reason,
              }}
            />
            {decision.options.map((o) => (
              <label className="v-check-line" key={o}>
                <input
                  type="radio"
                  name="decision"
                  checked={choice === o}
                  onChange={() => setChoice(o)}
                />
                {o}
              </label>
            ))}
            {choice === "自定义" && (
              <Field label="自定义方案">
                <textarea
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </Field>
            )}
          </>
        )}
      </Modal>
      <Modal
        title={panel === "plan" ? "修改研究计划" : "添加研究约束"}
        open={panel === "plan" || panel === "constraint"}
        onClose={() => setPanel("")}
        footer={
          <>
            <Button onClick={() => setPanel("")}>取消</Button>
            <Button
              primary
              onClick={() => {
                if (!task) return;
                if (
                  mutate("已更新科研任务", task.id, (d, u) => {
                    const t = d.tasks.find((x) => x.id === task.id)!;
                    if (!canEdit(t, u, space.id, d))
                      throw new Error("没有编辑权限。");
                    if (panel === "plan") {
                      const names = plan.split("\n").filter((x) => x.trim());
                      if (!names.length)
                        throw new Error("计划至少包含一个步骤。");
                      t.steps = names.map((name, i) => ({
                        id: t.id + "-replan-" + i,
                        name,
                        status: "pending",
                        resources: t.capabilityIds,
                        outputIds: [],
                      }));
                      t.status = "PLANNING";
                    } else t.constraint = constraint;
                  })
                )
                  setPanel("");
              }}
            >
              保存
            </Button>
          </>
        }
      >
        <Field label={panel === "plan" ? "计划步骤（每行一项）" : "约束内容"}>
          <textarea
            value={panel === "plan" ? plan : constraint}
            onChange={(e) =>
              panel === "plan"
                ? setPlan(e.target.value)
                : setConstraint(e.target.value)
            }
          />
        </Field>
      </Modal>
      {output && (
        <Modal
          title={output.name}
          open
          onClose={() => {
            setOutput(null);
            setSave(false);
          }}
          wide
          footer={
            <>
              <Button
                onClick={() => {
                  setOutput(null);
                  router.push("/workspace?task=" + output.taskId);
                }}
              >
                查看来源任务
              </Button>
              <Button
                disabled={!canEdit(output, p, space.id, s)}
                onClick={() =>
                  mutate("已确认科研产出", output.id, (d) => {
                    const a = d.artifacts.find((x) => x.id === output.id)!;
                    a.status = "已确认";
                    setOutput({ ...a });
                  })
                }
              >
                确认产出
              </Button>
              <Button
                primary
                disabled={!!output.assetId || !canEdit(output, p, space.id, s)}
                onClick={() => setSave(true)}
              >
                {output.assetId ? "已沉淀为资产" : "保存为科研资产"}
              </Button>
            </>
          }
        >
          <Badge>{output.status}</Badge>
          <p className="v-prose">{output.content}</p>
          <Details
            values={{
              类型: output.type,
              版本: output.version,
              来源任务:
                s.tasks.find((t) => t.id === output.taskId)?.name ??
                "资源直接调用",
              来源步骤: output.stepId,
              引用: output.references.map(resourceName).join("、"),
            }}
          />
          <ContextActions object={output} />
        </Modal>
      )}
      {output && save && (
        <SaveAsset
          artifact={output}
          open
          onClose={() => {
            setSave(false);
            setOutput(null);
          }}
        />
      )}
      <Modal
        title="会话操作"
        open={!!editSession}
        onClose={() => setEditSession(null)}
      >
        {editSession && (
          <>
            <Field label="会话名称">
              <input
                value={rename}
                onChange={(e) => setRename(e.target.value)}
              />
            </Field>
            <div className="v-actions">
              <Button
                onClick={() => {
                  if (!rename.trim()) return;
                  mutate("已重命名会话", editSession.id, (d) => {
                    d.sessions.find((x) => x.id === editSession.id)!.name =
                      rename;
                  });
                  setEditSession(null);
                }}
              >
                重命名
              </Button>
              <Button
                onClick={() => {
                  mutate("已更新会话收藏", editSession.id, (d) => {
                    const x = d.sessions.find((x) => x.id === editSession.id)!;
                    x.favorite = !x.favorite;
                  });
                  setEditSession(null);
                }}
              >
                {editSession.favorite ? "取消收藏" : "收藏"}
              </Button>
              <Confirm
                title="归档会话"
                description="会话从最近列表移除，原任务与产出保留。"
                onConfirm={() => {
                  mutate("已归档会话", editSession.id, (d) => {
                    d.sessions.find((x) => x.id === editSession.id)!.archived =
                      true;
                  });
                  setEditSession(null);
                }}
              >
                归档
              </Confirm>
              <Confirm
                title="删除会话"
                description="删除本地会话记录，关联任务与正式产出保留。"
                onConfirm={() => {
                  mutate("已删除会话", editSession.id, (d) => {
                    d.sessions = d.sessions.filter(
                      (x) => x.id !== editSession.id,
                    );
                  });
                  setEditSession(null);
                  router.push("/workspace");
                }}
              >
                删除
              </Confirm>
            </div>
            <div className="v-divider" />
            <Field label="分享给指定成员">
              <select
                value={shareUser}
                onChange={(e) => setShareUser(e.target.value)}
              >
                <option value="">选择成员</option>
                {s.members
                  .filter(
                    (m) =>
                      m.spaceId === editSession.spaceId &&
                      m.userId !== p.id &&
                      m.status === "active",
                  )
                  .map((m) => (
                    <option key={m.id} value={m.userId}>
                      {userName(m.userId)}
                    </option>
                  ))}
              </select>
            </Field>
            <Button
              disabled={!shareUser}
              onClick={() => {
                mutate("已共享会话", editSession.id, (d) => {
                  const x = d.sessions.find((x) => x.id === editSession.id)!;
                  x.visibility = "SHARED";
                  x.shares.push({
                    id: uid("share"),
                    targetUser: shareUser,
                    level: "只读",
                    validTo: "",
                    by: p.id,
                    at: now(),
                  });
                });
                setEditSession(null);
              }}
            >
              分享
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
}
