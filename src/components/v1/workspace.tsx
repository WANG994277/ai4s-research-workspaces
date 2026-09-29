"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowUp,
  Plus,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Circle,
  Play,
  FileText,
  MoreHorizontal,
  Pencil,
  Pin,
  Share2,
  Trash2,
  SquareCheckBig,
  CirclePlay,
  FileStack,
  Bot,
  Sparkles,
  Activity,
  FlaskConical,
  Cpu,
  Lightbulb,
  Search,
  ChartNoAxesColumnIncreasing,
  ScrollText,
  ChevronRight,
  ChevronDown,
  MapPin,
  Star,
} from "lucide-react";
import { useResearch, notify } from "./store";
import {
  activeTasks,
  canEnter,
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
  download,
} from "./ui";
import { ContextActions, ResourcePicker, SaveAsset } from "./actions";
import type { Artifact, Decision, Session, Task } from "./types";
import {
  DEFAULT_WORKBENCH_MODEL,
  buildResearchAssistantView,
  buildWorkbenchHome,
  resolveWorkspaceSession,
  toggleAssistantLaunchMode,
} from "./workspace-view";
import type { AssistantLaunchMode } from "./workspace-view";

const quickResearchTasks = [
  { label: "文献检索", group: "读", icon: Search, prompt: "检索当前课题相关的最新文献并整理来源" },
  { label: "文献精读", group: "读", icon: BookOpen, prompt: "精读一篇文献并提取研究方法、关键结论与证据" },
  { label: "图表提取", group: "读", icon: ChartNoAxesColumnIncreasing, prompt: "从科研资料中提取关键图表和结构化数据" },
  { label: "综述梳理", group: "读", icon: FileText, prompt: "梳理当前研究方向的文献综述和技术脉络" },
  { label: "标准对标", group: "做", icon: ScrollText, prompt: "对比当前课题涉及的国内外标准与适用范围" },
  { label: "专利分析", group: "算", icon: Lightbulb, prompt: "分析当前研究方向的专利布局与技术空白" },
] as const;

const assistantLaunchModes = {
  读: {
    title: "文献与知识",
    description: "检索、研读并组织可信科研证据",
    icon: BookOpen,
    skills: ["文献调研", "研究空白识别", "证据提取", "综述梳理"],
  },
  算: {
    title: "建模与计算",
    description: "分析数据、计算参数并运行科研模型",
    icon: Cpu,
    skills: ["配方参数计算", "科研数据分析", "分子模拟", "模型预测"],
  },
  做: {
    title: "实验与方案",
    description: "设计实验、生成方案并形成执行材料",
    icon: FlaskConical,
    skills: ["实验方案生成", "DOE 实验设计", "SOP 生成", "实验复盘"],
  },
} as const;

export function Workspace({ assistant = false, initialView }: { assistant?: boolean; initialView?: string }) {
  const { s, p, space, key, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const view = query.get("view") ?? initialView ?? "home";
  const taskId =
    query.get("task") ??
    s.sessions.find((x) => x.id === query.get("session"))?.taskId;
  const sessionId = query.get("session");
  const mode: string = "自动";
  const [model, setModel] = useState(DEFAULT_WORKBENCH_MODEL);
  const [search, setSearch] = useState("");
  const [historyRange, setHistoryRange] = useState("当前空间");
  const [historyCollapsed, setHistoryCollapsed] = useState(false);
  const [panel, setPanel] = useState("");
  const [files, setFiles] = useState<string[]>([]);
  const [decisionId, setDecisionId] = useState("");
  const [dismissedDecisionId, setDismissedDecisionId] = useState("");
  const [choice, setChoice] = useState("");
  const [custom, setCustom] = useState("");
  const [output, setOutput] = useState<Artifact | null>(null);
  const [save, setSave] = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [sessionMenu, setSessionMenu] = useState("");
  const [sessionDialog, setSessionDialog] = useState<"rename" | "share" | "">("");
  const [rename, setRename] = useState("");
  const [shareUser, setShareUser] = useState("");
  const [taskFilter, setTaskFilter] = useState("全部");
  const [plan, setPlan] = useState("");
  const [constraint, setConstraint] = useState("");
  const [recommendationFilter, setRecommendationFilter] = useState("全部");
  const [activityFilter, setActivityFilter] = useState("项目动态");
  const [frontierDiscipline, setFrontierDiscipline] = useState("全部");
  const [frontierType, setFrontierType] = useState("全部");
  const [assistantTab, setAssistantTab] = useState<"process" | "outputs">("process");
  const [assistantOutputFilter, setAssistantOutputFilter] = useState("全部");
  const [expandedAssistantStages, setExpandedAssistantStages] = useState<string[]>(["research", "simulation"]);
  const [assistantOutputMenu, setAssistantOutputMenu] = useState("");
  const [assistantLaunchMode, setAssistantLaunchMode] = useState<AssistantLaunchMode | "">("读");
  const [assistantSkillTags, setAssistantSkillTags] = useState<string[]>([]);
  const [publishedAssistantOutputs, setPublishedAssistantOutputs] = useState<string[]>([]);
  const draft = s.drafts[key] ?? "";
  const assistantTaskIds = new Set(["task-read", "task-calculate", "task-experiment"]);
  const histories = s.sessions.filter(
    (x) =>
      canRead(x, p, space.id, s) &&
      !x.archived &&
      (!assistant || (!!x.taskId && assistantTaskIds.has(x.taskId))) &&
      (assistant || historyRange === "全部有权空间" || x.spaceId === space.id) &&
      x.name.includes(search),
  ).sort((a, b) => Number(b.favorite) - Number(a.favorite));
  const task = s.tasks.find(
    (t) => t.id === taskId && canRead(t, p, space.id, s),
  );
  const activeSpace = task
    ? s.spaces.find((item) => item.id === task.spaceId) ?? space
    : space;
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
  const workbenchHome = buildWorkbenchHome(s, space.id, p.id);
  const visibleRecommendations = workbenchHome.recommendations.filter(
    (item) => recommendationFilter === "全部" || item.category === recommendationFilter,
  );
  const visibleActivities = activityFilter === "项目动态"
    ? workbenchHome.activities
    : workbenchHome.activities.filter((item) => item.category === activityFilter);
  const visibleFrontier = workbenchHome.frontier
    .filter(
      (item) =>
        (frontierDiscipline === "全部" || item.discipline === frontierDiscipline) &&
        (frontierType === "全部" || item.type === frontierType),
    );
  const pendingTaskDecision = task?.status === "WAITING_HUMAN"
    ? s.decisions.find(
        (item) => item.taskId === task.id && item.status === "pending" && item.assignee === p.id,
      ) ?? (task.id === "task-experiment" ? {
        id: "decision-experiment-slot",
        taskId: task.id,
        stepId: "task-experiment-3",
        question: "两组配方验证实验采用哪组替代时段？",
        recommendation: "分别预约周四 14:00–17:00 和周五 09:00–12:00。",
        reason: "原定时段存在仪器冲突；两个替代时段均满足人员、仪器和耗材条件。",
        options: ["采用两个推荐时段", "两组均安排在周五", "自定义"],
        assignee: p.id,
        status: "pending" as const,
        choice: "",
        at: "",
        by: "",
      } : undefined)
    : undefined;
  const decision = s.decisions.find((d) => d.id === decisionId) ??
    (pendingTaskDecision?.id !== dismissedDecisionId ? pendingTaskDecision : undefined);
  const effectiveChoice = choice || decision?.options[0] || "";
  const editable = task ? canEdit(task, p, activeSpace.id, s) : true;
  const activeConversation = !!(task || session);
  const assistantBase = "/assistant";
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
  const assistantView = task
    ? buildResearchAssistantView(s, task, session)
    : undefined;
  const assistantScenarioTask = !!task && assistantTaskIds.has(task.id);
  const assistantOutputs = assistantView?.outputs.filter(
    (item) => assistantOutputFilter === "全部" || item.type === assistantOutputFilter,
  ) ?? [];
  useEffect(() => {
    if (!assistantView) return;
    const runningStage = assistantView.stages.find((stage) => stage.status === "running");
    setExpandedAssistantStages(
      [runningStage?.id ?? assistantView.stages[0]?.id].filter(
        (id): id is string => !!id,
      ),
    );
    setAssistantTab("process");
    setAssistantOutputFilter("全部");
    setAssistantOutputMenu("");
  }, [taskId]);
  useEffect(() => {
    if (!decision) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDismissedDecisionId(decision.id);
        setDecisionId("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [decision?.id]);
  function openTask(t: Task) {
    router.push(assistantBase + "?task=" + t.id);
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
          text:
            draft +
            (assistantSkillTags.length ? "\nSkill：" + assistantSkillTags.join("、") : "") +
            (files.length ? "\n附件：" + files.join("、") : ""),
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
            type: assistant && assistantLaunchMode
              ? `${assistantLaunchMode} · ${assistantLaunchModes[assistantLaunchMode].title}`
              : mode === "深度研究" ? "深度研究" : "综合研究",
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
      setAssistantSkillTags([]);
      router.push(
        assistantBase + "?" + (newTaskId ? "task=" + newTaskId : "session=" + id),
      );
    }
  }
  function decide(d: Decision) {
    setDismissedDecisionId("");
    setDecisionId(d.id);
    setChoice(d.options[0] ?? "");
    setCustom("");
  }
  function closeDecision() {
    if (decision) setDismissedDecisionId(decision.id);
    setDecisionId("");
  }
  function confirmDecision() {
    if (!decision) return;
    if (
      mutate("已记录人工决策", decision.id, (d, u) => {
        let item = d.decisions.find((x) => x.id === decision.id);
        if (!item) {
          item = structuredClone(decision);
          d.decisions.push(item);
        }
        if (item.assignee !== u.id || item.status !== "pending")
          throw new Error("当前不能处理此决策。");
        item.status = "decided";
        item.choice = effectiveChoice === "自定义" ? custom : effectiveChoice;
        item.by = u.id;
        item.at = now();
        if (item.experimentId) {
          const experiment = d.experiments.find((x) => x.id === item.experimentId);
          if (experiment) {
            experiment.status = "待执行";
            experiment.exception = "";
            experiment.records.push(now() + " 人工决策：" + item.choice);
          }
        }
        const relatedTask = d.tasks.find((x) => x.id === item.taskId)!;
        relatedTask.status = item.experimentId ? "WAITING_RESOURCE" : "RUNNING";
        relatedTask.runAt = item.experimentId ? undefined : Date.now() + 8000;
        if (item.experimentId)
          relatedTask.reason = "等待实验重新执行与结果确认。";
        const step = relatedTask.steps.find((x) => x.id === item.stepId);
        if (step) step.status = "running";
        const relatedSession = d.sessions.find((x) => x.id === relatedTask.sessionIds[0]);
        relatedSession?.messages.push({
          id: uid("m"),
          role: "user",
          text: "人工决策：" + item.choice,
          at: now(),
        });
      })
    ) {
      setDecisionId("");
      setDismissedDecisionId(decision.id);
    }
  }
  const input = (
    <div className="v-composer">
      <textarea
        aria-label="科研任务输入"
        placeholder={activeConversation
          ? "继续输入要求，或告诉 AI 下一步要做什么……"
          : assistantSkillTags.length
            ? `描述“${assistantSkillTags.at(-1)}”的研究目标、问题、约束或材料……`
            : "描述研究目标、科研问题，或上传材料开始研究……"}
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
      {([...(s.pendingContext[key] ?? []), ...(s.pendingCapabilities[key] ?? [])]
        .length > 0 || assistantSkillTags.length > 0) && (
        <div className="v-actions v-context-chips">
          {assistantSkillTags.map((tag) => (
            <span className="v-chip v-skill-context-chip" key={tag}>
              <Sparkles size={12} />
              Skill · {tag}
              <button
                aria-label={`移除 Skill ${tag}`}
                onClick={() => setAssistantSkillTags((value) => value.filter((item) => item !== tag))}
              >
                ×
              </button>
            </span>
          ))}
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
          <button aria-label="添加附件" onClick={() => setPanel("files")}>
            <Plus size={17} />
          </button>
          {(assistant || activeConversation) && <>
            <button onClick={() => setPanel("knowledge")}>
              知识与数据 <ChevronRight size={14} />
            </button>
            <button onClick={() => router.push("/skills")}>
              技能 <ChevronRight size={14} />
            </button>
            <button onClick={() => router.push("/tools?view=科研工具")}>
              工具 <ChevronRight size={14} />
            </button>
          </>}
          {!assistant && !activeConversation && (
            <label className="v-composer-space-picker">
              <MapPin size={14} aria-hidden="true" />
              <select
                aria-label="选择当前科研空间"
                value={space.id}
                onChange={(event) => {
                  const nextSpaceId = event.target.value;
                  mutate("已切换当前空间", nextSpaceId, (draftState) => {
                    if (!canEnter(draftState, p, nextSpaceId))
                      throw new Error("无空间访问权限。");
                    draftState.spaceId = nextSpaceId;
                  });
                }}
              >
                {s.spaces
                  .filter((item) => canEnter(s, p, item.id) && item.status === "ACTIVE")
                  .map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown size={13} />
            </label>
          )}
        </div>
        <div className="v-composer-end">
          <label>
            <span className="sr-only">模型</span>
            <select
              aria-label="模型"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {["deepseekV4Pro", "GPT-5.6", "Qwen3-Max"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
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
    </div>
  );
  return (
    <div
      className={`v-workspace ${assistant ? "assistant-route" : ""} ${!assistant && view === "home" && !activeConversation ? "workbench-home" : ""} ${historyCollapsed && !activeConversation ? "history-collapsed" : ""} ${activeConversation ? "conversation-active" : ""}`}
    >
      <aside
        className={`v-history ${historyCollapsed && !activeConversation ? "collapsed" : ""}`}
      >
        <div className="v-history-actions">
          {(!historyCollapsed || activeConversation) && (
            <Button onClick={() => router.push(assistant ? "/assistant" : "/workspace")}>
              <Plus size={16} />
              新建科研任务
            </Button>
          )}
          {!activeConversation && !assistant && (
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
          {historyCollapsed && !activeConversation && !assistant && (
            <button
              type="button"
              className="v-history-new-icon"
              aria-label="新建科研任务"
              onClick={() => router.push(assistant ? "/assistant" : "/workspace")}
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
              placeholder={assistant ? "搜索科研任务" : "搜索历史会话"}
            />
            {!assistant && <Select
              label="范围"
              value={historyRange}
              onChange={setHistoryRange}
              options={["当前空间", "全部有权空间"]}
            />}
            <p className="v-history-label">{assistant ? "最近科研任务" : "最近会话"}</p>
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
                router.push(assistantBase + "?session=" + h.id);
              }}
            >
              <span>{h.favorite ? "★ " : ""}{h.name}</span>
              {assistant && h.taskId && (
                <small>{taskLabels[s.tasks.find((item) => item.id === h.taskId)?.status ?? "PLANNING"]}</small>
              )}
            </button>
            <button
              aria-label={h.name + " 会话操作"}
              onClick={() => {
                if (h.ownerId !== p.id) {
                  notify("共享会话当前为只读。");
                  return;
                }
                setSessionMenu((value) => value === h.id ? "" : h.id);
              }}
            >
              <MoreHorizontal size={15} />
            </button>
            {sessionMenu === h.id && (
              <div className="v-session-bubble" role="menu" aria-label={`${h.name} 任务菜单`}>
                <button role="menuitem" onClick={() => { setEditSession(h); setRename(h.name); setSessionDialog("rename"); setSessionMenu(""); }}><Pencil size={15} />重命名</button>
                <button role="menuitem" onClick={() => { mutate(h.favorite ? "已取消置顶" : "已置顶科研任务", h.id, (d) => { d.sessions.find((x) => x.id === h.id)!.favorite = !h.favorite; }); setSessionMenu(""); }}><Pin size={15} />{h.favorite ? "取消置顶" : "置顶"}</button>
                <button role="menuitem" onClick={() => { setEditSession(h); setShareUser(""); setSessionDialog("share"); setSessionMenu(""); }}><Share2 size={15} />分享</button>
                <div className="v-session-menu-divider" />
                <Confirm
                  title="删除科研任务会话"
                  description="删除本地会话记录，关联任务与正式产出保留。"
                  onConfirm={() => {
                    mutate("已删除会话", h.id, (d) => { d.sessions = d.sessions.filter((x) => x.id !== h.id); });
                    setSessionMenu("");
                    if (h.id === session?.id) router.push("/assistant");
                  }}
                >
                  <span className="v-session-delete"><Trash2 size={15} />删除</span>
                </Confirm>
              </div>
            )}
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
                    {task && (
                      <span>
                        {assistantScenarioTask
                          ? "高性能合成橡胶项目 / 配方优化课题"
                          : `${s.projects.find((project) => project.id === task.projectId)?.name ?? "科研项目"} / ${activeSpace.name}`}
                      </span>
                    )}
                    <Badge>
                      {task ? taskLabels[task.status] : "对话中"}
                    </Badge>
                    <span>更新于 {assistantView?.updatedAt ?? "10:42"}</span>
                  </div>
                </div>
              </header>

              <div className="v-chat-scroll">
                <div className="v-conversation">
                  {(assistantView
                    ? session?.messages.filter((message) => message.role === "user").slice(0, 1)
                    : session?.messages
                  )?.map((message) => (
                    <article
                      className={`v-message ${message.role}`}
                      key={message.id}
                    >
                      <span className={`v-message-avatar ${message.role}-avatar`} aria-hidden="true">
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

                  {assistantView && (
                    <>
                      <article className="v-message assistant v-assistant-plan-message">
                        <span className="v-message-avatar assistant-avatar" aria-hidden="true"><Sparkles size={17} /></span>
                        <div>
                          <strong>Research Agent</strong>
                          <p>我将为你开展系统性的科研任务，并按以下步骤推进：</p>
                          <ol>
                            {assistantView.stages.map((stage, index) => (
                              <li key={stage.id}><span>{index + 1}</span>{stage.summary}</li>
                            ))}
                          </ol>
                          <time>{session?.messages.find((message) => message.role === "assistant")?.at.replace("T", " ").slice(0, 16) ?? "2026-09-24 09:11"}</time>
                        </div>
                      </article>
                      <section className="v-research-progress-card" aria-label="科研任务执行进度">
                        <header>
                          <span className="v-progress-signal"><Activity size={18} /></span>
                          <div><strong>{task?.status === "COMPLETED" ? "研究已完成" : "研究进行中"}</strong><small>{task?.status === "COMPLETED" ? "全部研究阶段已经完成" : "AI 正在多源检索和分析，请稍候…"}</small></div>
                          <span className="v-progress-runtime">已运行 12 分钟</span>
                        </header>
                        <ol>
                          {assistantView.stages.map((stage, index) => (
                            <li className={stage.status} key={stage.id}>
                              <span className="v-progress-state">{stage.status === "completed" ? <CheckCircle2 size={17} /> : stage.status === "running" ? <CirclePlay size={17} /> : <Circle size={17} />}</span>
                              <strong>{stage.label}</strong>
                              <span>{stage.summary}</span>
                              <i>{stage.status === "completed" ? `09:${String(37 + index * 3).padStart(2, "0")}` : stage.status === "running" ? "65%" : "等待执行"}</i>
                            </li>
                          ))}
                        </ol>
                        <footer><span>已处理：126 篇文献 · 43 项专利 · 4 项标准</span><button type="button" onClick={() => setAssistantTab("process")}>查看执行过程 <ChevronRight size={14} /></button></footer>
                      </section>
                    </>
                  )}

                  {!assistantView && task && task.status === "PLANNING" && (
                    <section className="v-agent-run-card" aria-label="Agent执行进度">
                      <header>
                        <span><Bot size={18} /></span>
                        <div>
                          <strong>Agent 正在规划</strong>
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

                  {!assistantView && task && (
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

            <aside className="v-chat-files v-assistant-side" aria-label="研究任务上下文">
              <div className="v-assistant-side-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={assistantTab === "process"}
                  className={assistantTab === "process" ? "selected" : ""}
                  onClick={() => setAssistantTab("process")}
                >
                  研究过程
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={assistantTab === "outputs"}
                  className={assistantTab === "outputs" ? "selected" : ""}
                  onClick={() => setAssistantTab("outputs")}
                >
                  科研产出
                </button>
              </div>

              {assistantTab === "process" && assistantView ? (
                <div className="v-process-panel">
                  <ol className="v-process-stages">
                    {assistantView.stages.map((stage, index) => (
                      <li className={stage.status} key={stage.id}>
                        <button
                          type="button"
                          className="v-process-stage-title"
                          aria-expanded={expandedAssistantStages.includes(stage.id)}
                          onClick={() => setExpandedAssistantStages((value) =>
                            value.includes(stage.id)
                              ? []
                              : [stage.id])}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{stage.label}</strong>
                          <i>{stage.status === "completed" ? "已完成" : stage.status === "running" ? "进行中" : "未开始"}</i>
                          {expandedAssistantStages.includes(stage.id)
                            ? <ChevronDown size={14} />
                            : <ChevronRight size={14} />}
                        </button>
                        {expandedAssistantStages.includes(stage.id) && (
                          <div className="v-agent-execution">
                            <p className="v-process-stage-summary">{stage.summary}</p>
                            <ol>
                              {stage.events.map((event) => (
                                <li className={event.status} key={event.id}>
                                  <span className={`v-execution-kind ${event.kind}`}>
                                    {event.kind === "dispatch"
                                      ? "编排"
                                      : event.kind === "agent"
                                        ? "Agent"
                                        : event.kind === "tool"
                                          ? "工具"
                                          : "结果"}
                                  </span>
                                  <div>
                                    <strong>{event.title}</strong>
                                    <p>{event.detail}</p>
                                  </div>
                                  <i>{event.status === "completed" ? "完成" : event.status === "running" ? "运行中" : "等待"}</i>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : assistantView ? (
                <div className="v-output-panel-side">
                  <header>
                    <strong>当前任务产出</strong>
                    <span>共 {assistantView.outputs.length} 项成果</span>
                  </header>
                  <div className="v-output-filter-tabs" role="tablist">
                    {assistantView.outputFilters.map((filter) => (
                      <button
                        type="button"
                        role="tab"
                        aria-selected={assistantOutputFilter === filter}
                        className={assistantOutputFilter === filter ? "selected" : ""}
                        onClick={() => setAssistantOutputFilter(filter)}
                        key={filter}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                  <div className="v-assistant-output-list">
                    {assistantOutputs.map((item) => (
                      <article className="v-assistant-output-row" key={item.id}>
                        <span className="v-output-star">{item.core ? <Star size={14} fill="currentColor" /> : null}</span>
                        <span><strong>{item.name}</strong><small>{item.type} · {item.version}</small></span>
                        <Badge>{publishedAssistantOutputs.includes(item.id) || s.assets.some((asset) => asset.sourceAssetId === item.id) ? "已发布" : item.status}</Badge>
                        <div className="v-output-more">
                          <button
                            type="button"
                            aria-label={`${item.name} 更多操作`}
                            aria-expanded={assistantOutputMenu === item.id}
                            onClick={() => setAssistantOutputMenu((value) => value === item.id ? "" : item.id)}
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {assistantOutputMenu === item.id && (
                            <div className="v-output-menu" role="menu">
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  setAssistantOutputMenu("");
                                  download(
                                    `${item.name}.txt`,
                                    `${item.name}\n类型：${item.type}\n版本：${item.version}\n状态：${item.status}\n来源：${item.source}\n引用：${item.references}\n`,
                                  );
                                  notify(`已下载“${item.name}”。`);
                                }}
                              >
                                下载
                              </button>
                              <button
                                type="button"
                                role="menuitem"
                                disabled={
                                  ["草稿", "生成中", "已废弃"].includes(item.status) ||
                                  publishedAssistantOutputs.includes(item.id) ||
                                  s.assets.some((asset) => asset.sourceAssetId === item.id)
                                }
                                onClick={() => {
                                  setAssistantOutputMenu("");
                                  if (!task) return;
                                  const ok = mutate("已发布为科研资产", item.id, (draft, user) => {
                                    if (draft.assets.some((asset) => asset.sourceAssetId === item.id))
                                      return;
                                    const templateAsset = draft.assets.find((asset) => asset.id === "template-rubber-experiment") ?? draft.assets[0];
                                    if (!templateAsset) throw new Error("缺少可复用的资产模板。");
                                    draft.assets.unshift({
                                      ...structuredClone(templateAsset),
                                      id: uid("asset"),
                                      name: item.name,
                                      ownerId: user.id,
                                      projectId: task.projectId,
                                      spaceId: task.spaceId,
                                      visibility: "SPACE",
                                      shares: [],
                                      updatedAt: now(),
                                      type: item.type === "数据" ? "数据集" : "方案模板",
                                      description: `${item.source}形成的${item.type}，版本 ${item.version}。`,
                                      version: item.version,
                                      publishStatus: "已发布",
                                      sourceAssetId: item.id,
                                    });
                                  });
                                  if (ok)
                                    setPublishedAssistantOutputs((value) => value.includes(item.id) ? value : [...value, item.id]);
                                }}
                              >
                                发布为资产
                              </button>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <Empty>当前会话尚未形成持续科研任务。</Empty>
              )}
            </aside>
          </>
        ) : view === "history" ? (
          <>
            <h1>历史会话</h1>
            {histories.map((h) => (
              <Link
                className="v-list-line"
                href={assistantBase + "?session=" + h.id}
                key={h.id}
              >
                {h.name}
                <Badge>{h.visibility === "PRIVATE" ? "私有" : "已共享"}</Badge>
              </Link>
            ))}
          </>
        ) : (
          <>
            <section className={`v-agent-home ${assistant ? "v-assistant-launch-home" : ""}`}>
              <span className="v-kicker">{assistant ? "AI FOR SCIENCE" : "UNIFIED RESEARCH AGENT"}</span>
              <h1>{assistant ? "从一个科研任务开始" : "今天想推进什么科研任务？"}</h1>
              {assistant && <>
                <p className="v-assistant-launch-lead">描述你的研究目标、问题或材料，AI 将规划并推进后续工作</p>
                <div className="v-assistant-launch-choices">
                <div className="v-assistant-mode-grid" role="group" aria-label="科研任务模式（可选）">
                  {(Object.entries(assistantLaunchModes) as [keyof typeof assistantLaunchModes, (typeof assistantLaunchModes)[keyof typeof assistantLaunchModes]][]).map(([mode, config]) => {
                    const ModeIcon = config.icon;
                    return <button
                      type="button"
                      aria-pressed={assistantLaunchMode === mode}
                      className={assistantLaunchMode === mode ? "selected" : ""}
                      onClick={() => {
                        setAssistantLaunchMode((current) => toggleAssistantLaunchMode(current, mode));
                        setAssistantSkillTags([]);
                      }}
                      key={mode}
                    >
                      <span><ModeIcon size={17} /></span>
                      <strong>{mode} · {config.title}</strong>
                      <small>{config.description}</small>
                    </button>;
                  })}
                </div>
                {assistantLaunchMode && <div className="v-assistant-skill-options" aria-label={`${assistantLaunchMode}类科研 Skill`}>
                  {assistantLaunchModes[assistantLaunchMode].skills.map((skill) => (
                    <button
                      type="button"
                      className={assistantSkillTags.includes(skill) ? "selected" : ""}
                      aria-pressed={assistantSkillTags.includes(skill)}
                      onClick={() => setAssistantSkillTags((value) => value.includes(skill) ? value.filter((item) => item !== skill) : [...value, skill])}
                      key={skill}
                    >
                      <Sparkles size={13} />{skill}
                    </button>
                  ))}
                </div>}
                </div>
              </>}
              {input}
            </section>
            {view === "home" && !assistant && (
              <>
                <section className="v-workbench-quick" aria-labelledby="quick-task-title">
                  <div className="v-workbench-inline-head">
                    <div>
                      <h2 id="quick-task-title">常用科研任务</h2>
                    </div>
                  </div>
                  <div className="v-quick-task-list">
                    {quickResearchTasks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          type="button"
                          key={item.label}
                          onClick={() =>
                            mutate("", item.label, (state) => {
                              state.drafts[key] = item.prompt;
                            })
                          }
                        >
                          <span><Icon size={17} /></span>
                          <strong>{item.label}</strong>
                          <small>{item.group}</small>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="v-workbench-grid v-workbench-overview-grid">
                  <section className="v-workbench-card v-recommendation-card" aria-labelledby="recommendation-title">
                    <div className="v-workbench-card-head">
                    <h2 id="recommendation-title"><Sparkles size={19} />AI 为你推荐</h2>
                      <Link href="/workspace?view=pending" className="v-link">查看全部 <ChevronRight size={14} /></Link>
                    </div>
                    <div className="v-workbench-tabs" role="tablist" aria-label="推荐类型">
                      {["全部", "仅需知悉", "需要决策", "建议操作"].map((filter) => {
                        const count = filter === "全部"
                          ? workbenchHome.recommendations.length
                          : workbenchHome.recommendations.filter((item) => item.category === filter).length;
                        return (
                          <button
                            type="button"
                            role="tab"
                            aria-selected={recommendationFilter === filter}
                            className={recommendationFilter === filter ? "selected" : ""}
                            onClick={() => setRecommendationFilter(filter)}
                            key={filter}
                          >
                            {filter} <span>({count})</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="v-recommendation-list">
                      {visibleRecommendations.map((item) => (
                        <article className="v-recommendation-item" key={item.id}>
                          <span className={`v-recommendation-icon ${item.kind}`} aria-hidden="true">
                            {item.kind === "decision" ? <FlaskConical size={19} /> : item.kind === "task" ? <Cpu size={19} /> : <BookOpen size={19} />}
                          </span>
                          <div>
                            <div className="v-recommendation-title-line">
                              <strong>{item.title}</strong>
                              <Badge>{item.category}</Badge>
                            </div>
                            <p>{item.description}</p>
                          </div>
                          <time>{item.time}</time>
                          <Button
                            onClick={() => {
                              if (item.kind === "decision") {
                                const pending = s.decisions.find((decisionItem) => decisionItem.id === item.targetId);
                                if (pending) decide(pending);
                              } else if (item.kind === "task") {
                                router.push(`/workspace?task=${item.targetId}`);
                              } else {
                                router.push(`/knowledge?detail=${item.targetId}`);
                              }
                            }}
                          >
                            {item.action}
                          </Button>
                        </article>
                      ))}
                      {!visibleRecommendations.length && <Empty>当前筛选下没有推荐事项。</Empty>}
                    </div>
                  </section>

                  <section className="v-workbench-card v-activity-card" id="activity" aria-labelledby="activity-title">
                    <div className="v-workbench-card-head">
                    <h2 id="activity-title"><Activity size={19} />科研活动</h2>
                      <Link href="/workspace?view=tasks" className="v-link">查看全部 <ChevronRight size={14} /></Link>
                    </div>
                    <div className="v-workbench-tabs" role="tablist" aria-label="科研活动类型">
                      {["项目动态", "实验动态", "计算动态", "成果动态"].map((filter) => (
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activityFilter === filter}
                          className={activityFilter === filter ? "selected" : ""}
                          onClick={() => setActivityFilter(filter)}
                          key={filter}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                    <div className="v-activity-list">
                      {visibleActivities.map((item) => (
                        <button
                          type="button"
                          className="v-activity-item"
                          onClick={() => {
                            if (item.category === "成果动态") {
                              const artifact = s.artifacts.find((entry) => entry.id === item.targetId);
                              if (artifact) setOutput(artifact);
                            } else if (item.category === "实验动态" || item.id === "mock-data-sync" || item.id === "mock-reservation") {
                              router.push("/lab?tab=实验任务");
                            } else if (item.id === "mock-knowledge-added") {
                              router.push(`/knowledge?detail=${item.targetId}`);
                            } else {
                              router.push(`/workspace?task=${item.targetId}`);
                            }
                          }}
                          key={item.id}
                        >
                          <time>{item.time}</time>
                          <span className="v-activity-dot" aria-hidden="true" />
                          <span className="v-activity-symbol" aria-hidden="true">
                            {item.category === "实验动态" ? <FlaskConical size={17} /> : item.category === "计算动态" ? <Cpu size={17} /> : item.category === "成果动态" ? <FileStack size={17} /> : <Activity size={17} />}
                          </span>
                          <span className="v-activity-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
                          <Badge>{item.status}</Badge>
                        </button>
                      ))}
                      {!visibleActivities.length && <Empty>当前暂无{activityFilter}。</Empty>}
                    </div>
                  </section>
                </div>

                <div className="v-workbench-grid v-recent-grid">
                  <section className="v-workbench-card" aria-labelledby="recent-task-title">
                    <div className="v-workbench-card-head">
                      <h2 id="recent-task-title"><CirclePlay size={18} />最近科研任务</h2>
                      <Link href="/workspace?view=tasks" className="v-link">查看全部 <ChevronRight size={14} /></Link>
                    </div>
                    <div className="v-recent-task-list">
                      {workbenchHome.recentTasks.map((item) => (
                        <button type="button" onClick={() => openTask(item)} key={item.id}>
                          <span className={`v-task-state ${item.status.toLowerCase()}`} aria-hidden="true" />
                          <span><strong>{item.name}</strong><small>{item.type} · {space.name}</small></span>
                          <Badge>{taskLabels[item.status]}</Badge>
                          <span className="v-recent-action">{item.status === "COMPLETED" ? "查看" : "继续"}<ChevronRight size={14} /></span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="v-workbench-card" aria-labelledby="recent-output-title">
                    <div className="v-workbench-card-head">
                      <h2 id="recent-output-title"><FileStack size={18} />最近科研产出</h2>
                      <Link href="/research-spaces/current/assets" className="v-link">查看全部 <ChevronRight size={14} /></Link>
                    </div>
                    <div className="v-recent-output-list">
                      {workbenchHome.recentArtifacts.map((item) => (
                        <button type="button" onClick={() => setOutput(item)} key={item.id}>
                          <span><strong>{item.name}</strong><small>{item.type} · {item.version}</small></span>
                          <Badge>{item.status}</Badge>
                          <ChevronRight size={15} />
                        </button>
                      ))}
                      {!workbenchHome.recentArtifacts.length && <Empty>当前空间尚未形成科研产出。</Empty>}
                    </div>
                  </section>
                </div>

                <section className="v-workbench-card v-frontier-card" aria-labelledby="frontier-title">
                  <div className="v-workbench-card-head">
                    <h2 id="frontier-title"><BookOpen size={18} />科研前沿</h2>
                    <Link href="/knowledge" className="v-link">查看全部 <ChevronRight size={14} /></Link>
                  </div>
                  <div className="v-frontier-filters">
                    <div><span>学科领域：</span>{["全部", "地球科学", "材料科学", "合成生物", "化学化工"].map((item) => <button type="button" className={frontierDiscipline === item ? "selected" : ""} onClick={() => setFrontierDiscipline(item)} key={item}>{item}</button>)}</div>
                    <div><span>资源类型：</span>{["全部", "文献", "专利", "标准", "科研资讯"].map((item) => <button type="button" className={frontierType === item ? "selected" : ""} onClick={() => setFrontierType(item)} key={item}>{item}</button>)}</div>
                  </div>
                  <div className="v-frontier-list">
                    {visibleFrontier.map((item) => (
                      <Link
                        href={item.id.startsWith("frontier-")
                          ? `/knowledge?query=${encodeURIComponent(item.name)}`
                          : `/knowledge?detail=${item.id}`}
                        key={item.id}
                      >
                        <Badge>{item.type}</Badge>
                        <span><strong>{item.name}</strong><small>{item.organization} · {item.date} · {item.description}</small></span>
                        <ChevronRight size={16} />
                      </Link>
                    ))}
                    {!visibleFrontier.length && <Empty>当前筛选下暂无科研资源，请调整学科或资源类型。</Empty>}
                  </div>
                </section>
              </>
            )}
            {view === "pending" && (
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
            {view === "tasks" && (
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
                    .slice(0, 99)
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
            {view === "outputs" && (
              <section className="v-section v-workbench-panel v-output-panel">
                <div className="v-section-head">
                  <h2>
                    <FileStack size={18} />
                    最近科研产出
                  </h2>
                  <Link href="/research-spaces/current/assets" className="v-link">
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
                  {artifacts.slice(0, 99).map((a) => (
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
      {decision && (
        <div className="v-decision-sheet-layer">
          <section
            className="v-decision-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-sheet-title"
          >
            <header>
              <div>
                <span>需要你确认</span>
                <h2 id="decision-sheet-title">{decision.question}</h2>
              </div>
              <button type="button" aria-label="关闭确认问题" onClick={closeDecision}>×</button>
            </header>
            <div className="v-decision-sheet-content">
              <div className="v-decision-advice">
                <strong>Agent 建议</strong>
                <p>{decision.recommendation}</p>
                <small>{decision.reason}</small>
              </div>
              <div className="v-decision-options">
                {decision.options.map((option) => (
                  <label className={effectiveChoice === option ? "selected" : ""} key={option}>
                    <input
                      type="radio"
                      name="decision"
                      checked={effectiveChoice === option}
                      onChange={() => setChoice(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {effectiveChoice === "自定义" && (
                <Field label="自定义方案">
                  <textarea value={custom} onChange={(e) => setCustom(e.target.value)} />
                </Field>
              )}
            </div>
            <footer>
              <Button onClick={closeDecision}>暂不处理</Button>
              <Button
                primary
                disabled={!effectiveChoice || (effectiveChoice === "自定义" && !custom.trim())}
                onClick={confirmDecision}
              >
                确认并继续
              </Button>
            </footer>
          </section>
        </div>
      )}
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
                  router.push(assistantBase + "?task=" + output.taskId);
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
                {output.assetId ? "已沉淀到科研空间" : "保存到科研空间"}
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
        title={sessionDialog === "share" ? "分享科研任务" : "重命名科研任务"}
        open={!!editSession && !!sessionDialog}
        onClose={() => { setEditSession(null); setSessionDialog(""); }}
      >
        {editSession && (
          <>
            {sessionDialog === "rename" && <><Field label="任务名称">
              <input
                value={rename}
                onChange={(e) => setRename(e.target.value)}
              />
            </Field>
            <div className="v-actions">
              <Button
                onClick={() => {
                  if (!rename.trim()) return;
                  mutate("已重命名科研任务", editSession.id, (d) => {
                    d.sessions.find((x) => x.id === editSession.id)!.name =
                      rename;
                  });
                  setEditSession(null);
                  setSessionDialog("");
                }}
              >
                保存名称
              </Button>
            </div>
            </>}
            {sessionDialog === "share" && <><Field label="分享给指定成员">
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
                setSessionDialog("");
              }}
            >
              分享
            </Button>
            </>}
          </>
        )}
      </Modal>
    </div>
  );
}
