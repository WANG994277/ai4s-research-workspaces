"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowUp,
  BookOpen,
  Box,
  ChartNoAxesColumn,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Play,
  Clock3,
  Database,
  FolderKanban,
  FileText,
  FlaskConical,
  Layers3,
  MapPin,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Plus,
  Sparkles,
  SquareCheckBig,
  CirclePlay,
  Cpu,
  FileStack,
  Bot,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
} from "./ui";
import { ContextActions, ResourcePicker, SaveAsset } from "./actions";
import type { Artifact, Decision, Session, Task } from "./types";
import { collectChatFiles, resolveWorkspaceSession } from "./workspace-view";

const workbenchRecommendations = [
  {
    title: "实验结果异动提醒",
    category: "需要决策",
    description:
      "实验 GB-2026-0915 的催化活性数据均值下降 35%，建议检查反应温度控制系统。",
    time: "今天 09:20",
    action: "查看详情",
    icon: "experiment",
  },
  {
    title: "计算任务已完成",
    category: "仅需知悉",
    description: "VASP 电子结构计算（任务 #1024）已完成，共生成 12 个结果文件。",
    time: "今天 08:50",
    action: "查看结果",
    icon: "compute",
  },
  {
    title: "相关文献推荐",
    category: "仅需知悉",
    description: "基于你的研究方向，发现 5 篇高度相关文献，已加入「待读」列表。",
    time: "今天 08:30",
    action: "查看文献",
    icon: "paper",
  },
  {
    title: "课题里程碑即将到期",
    category: "需要决策",
    description: "课题《CO₂ 加氢制甲醇催化剂研究》下一节点（中期评审材料）3 天后到期。",
    time: "昨天 18:40",
    action: "去处理",
    icon: "experiment",
  },
  {
    title: "智能体建议：优化实验方案",
    category: "建议操作",
    description:
      "基于历史数据分析，建议将反应温度从 200 ℃ 调整至 220 ℃，预计可提升转化率 12%。",
    time: "昨天 16:20",
    action: "查看建议",
    icon: "compute",
  },
] as const;

const researchNews = [
  {
    title: "《Nature Catalysis》催化材料最新论文速递",
    description: "催化材料领域发布最新研究成果，涉及低碳催化剂设计与反应机理。",
    time: "今天 10:28",
  },
  {
    title: "CCUS 领域本周科研动态",
    description: "本周 CCUS 领域发布多项重要研究进展，包括 CO₂ 捕集材料新突破与地质封存评估。",
    time: "今天 08:45",
  },
  {
    title: "页岩气储层改造最新行业资讯",
    description: "国内外页岩气储层改造技术取得新进展，多家机构发布最新研究动态与应用案例。",
    time: "昨天 17:20",
  },
  {
    title: "AI4S 科研模型应用观察",
    description: "多模态科研模型在材料筛选与实验规划中的应用持续增加，验证效率明显提升。",
    time: "昨天 14:10",
  },
  {
    title: "科研数据治理规范更新",
    description: "科研数据分类分级与可追溯管理规范发布新版本，新增实验数据质量要求。",
    time: "09/28 16:30",
  },
] as const;

const researchActivities = [
  { time: "10:30", title: "实验数据已同步", description: "实验 GB-2026-0915 数据已同步至 ELN", status: "成功", kind: "实验动态", icon: "activity" },
  { time: "09:41", title: "计算任务开始运行", description: "GROMACS 分子动力学模拟（任务 #1025）", status: "运行中", kind: "计算动态", icon: "compute" },
  { time: "09:15", title: "新文献已加入知识库", description: "《Nature Catalysis》最新文献已收录", status: "成功", kind: "成果动态", icon: "activity" },
  { time: "昨天\n18:20", title: "课题进展更新", description: "《功能性 PE 配方优化》已更新周报", status: "更新", kind: "项目动态", icon: "activity" },
  { time: "昨天\n16:05", title: "实验预约成功", description: "预约 9 月 17 日 10:00–12:00 普通仪器", status: "成功", kind: "实验动态", icon: "experiment" },
] as const;

const referenceTasks = [
  { name: "高效催化剂配方优化", status: "进行中", step: "分子模拟计算 (7/12)", progress: 58, topic: "催化剂优化课题", tone: "blue" },
  { name: "CO₂驱油机理文献综述", status: "已完成", step: "文献分析 (5/5)", progress: 100, topic: "提高采收率课题", tone: "green" },
  { name: "页岩油燃烧实验方案设计", status: "待处理", step: "等待方案确认 (2/6)", progress: 33, topic: "非常规油气开发课题", tone: "orange" },
] as const;

const referenceOutputTypes = [
  { name: "研究报告", count: 10, percentage: 38, donutColor: "#3b82f6", cardColor: "#3b82f6", icon: "report" },
  { name: "数据集", count: 6, percentage: 23, donutColor: "#3dbb91", cardColor: "#f4ad32", icon: "data" },
  { name: "图表", count: 6, percentage: 23, donutColor: "#f4ad32", cardColor: "#7a5ce5", icon: "chart" },
  { name: "模型", count: 4, percentage: 15, donutColor: "#ef5a3e", cardColor: "#3dbb91", icon: "model" },
  { name: "其他", count: 0, percentage: 4, donutColor: "#8d77df", cardColor: "#8d77df", icon: "other" },
] as const;

const referenceOutputTrend = [
  { month: "11月", value: 1 },
  { month: "12月", value: 2 },
  { month: "1月", value: 1 },
  { month: "2月", value: 3 },
  { month: "3月", value: 2 },
  { month: "4月", value: 2 },
  { month: "5月", value: 1 },
  { month: "6月", value: 3 },
  { month: "7月", value: 2 },
  { month: "8月", value: 3 },
  { month: "9月", value: 2 },
  { month: "10月", value: 4 },
] as const;
export function Workspace() {
  const { s, p, space, key, loaded, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const taskId =
    query.get("task") ??
    s.sessions.find((x) => x.id === query.get("session"))?.taskId;
  const sessionId = query.get("session");
  const view = query.get("view") ?? "home";
  const [mode, setMode] = useState("自动");
  const [homeModel, setHomeModel] = useState("科研中枢大模型");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
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
  const [recommendationFilter, setRecommendationFilter] = useState("全部");
  const [activityFilter, setActivityFilter] = useState("项目动态");
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
  const researchSuggestions = {
    读: ["梳理当前课题的关键技术路线", "整理近期科研产出并生成摘要"],
    算: ["分析实验数据中的关键影响因素", "评估当前模型的适用范围与风险"],
    做: ["生成下一轮对比实验方案", "总结当前研究进展与待办"],
  };
  const pendingTaskCount = decisions.length;
  const runningExperimentCount = s.experiments.filter(
    (experiment) =>
      canRead(experiment, p, space.id, s) &&
      ["进行中", "执行中", "已接收"].includes(experiment.status),
  ).length;
  const decision = s.decisions.find((d) => d.id === decisionId);
  const editable = task ? canEdit(task, p, space.id, s) : true;
  const activeConversation = !!(task || session);
  const homeComposer = !activeConversation && view === "home";
  const availableTopics = s.spaces.filter(
    (item) => item.type === "TOPIC" && canEnter(s, p, item.id) && item.status === "ACTIVE",
  );
  const currentTopicId = availableTopics.some((item) => item.id === space.id) ? space.id : "";
  useEffect(() => {
    if (!loaded || !homeComposer || currentTopicId || draft || !availableTopics.length) return;
    const nextTopic = availableTopics.find((item) => item.projectId === space.projectId) ?? availableTopics[0];
    mutate("已切换当前课题", nextTopic.id, (draftState) => {
      if (!canEnter(draftState, p, nextTopic.id)) throw new Error("无课题访问权限。");
      draftState.spaceId = nextTopic.id;
    });
  }, [loaded, homeComposer, currentTopicId, draft, availableTopics, space.projectId, mutate, p]);
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
    <div className={`v-composer${homeComposer ? " v-workbench-composer" : ""}`}>
      <textarea
        aria-label="科研任务输入"
        placeholder={homeComposer ? "描述研究目标、科研问题；或配置定时任务，如「每日 8 点获取橡胶材料最新研究进展」……" : "输入你的科研问题，或描述想推进的研究…"}
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
        {homeComposer ? (
          <div className="v-actions v-workbench-composer-start">
            <div className="v-workbench-add-wrap">
              <button
                type="button"
                aria-label="添加研究资料"
                aria-expanded={addMenuOpen}
                aria-controls="v-workbench-add-menu"
                onClick={() => setAddMenuOpen((open) => !open)}
              >
                <Plus size={18} />
              </button>
              {addMenuOpen && (
                <div id="v-workbench-add-menu" className="v-workbench-add-menu">
                  {([
                    ["files", "添加附件", Paperclip],
                    ["knowledge", "引用知识", BookOpen],
                    ["data", "关联数据", Database],
                  ] as const).map(([target, label, Icon]) => (
                    <button
                      type="button"
                      key={target}
                      onClick={() => { setPanel(target); setAddMenuOpen(false); }}
                    >
                      <Icon size={15} />{label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label className="v-composer-space-picker">
              <MapPin size={15} aria-hidden="true" />
              <select
                aria-label="选择当前课题"
                value={currentTopicId}
                onChange={(event) => {
                  const nextSpaceId = event.target.value;
                  mutate("已切换当前空间", nextSpaceId, (draftState) => {
                    if (!canEnter(draftState, p, nextSpaceId)) throw new Error("无空间访问权限。");
                    draftState.spaceId = nextSpaceId;
                  });
                }}
              >
                {!currentTopicId && <option value="" disabled>选择课题</option>}
                {availableTopics.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
              <ChevronDown size={14} aria-hidden="true" />
            </label>
          </div>
        ) : (
          <div className="v-actions">
            <button onClick={() => setPanel("files")}><Paperclip size={15} />附件</button>
            <button onClick={() => setPanel("knowledge")}><BookOpen size={15} />引用知识</button>
            <button onClick={() => setPanel("data")}><Database size={15} />关联数据</button>
            <label>
              <span className="sr-only">研究模式</span>
              <select aria-label="研究模式" value={mode} onChange={(e) => setMode(e.target.value)}>
                {["自动", "深度研究", "快速分析"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </label>
          </div>
        )}
        {homeComposer && (
          <label className="v-workbench-model-picker">
            <span className="sr-only">科研模型</span>
            <select aria-label="科研模型" value={homeModel} onChange={(event) => setHomeModel(event.target.value)}>
              {["科研中枢大模型", "deepseekV4Pro", "GPT-5.6", "Qwen3-Max"].map((model) => <option key={model}>{model}</option>)}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        )}
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
      className={`v-workspace ${!activeConversation && view === "home" ? "home-dashboard" : ""} ${historyCollapsed && !activeConversation ? "history-collapsed" : ""} ${activeConversation ? "conversation-active" : ""}`}
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
              src="/v1/sciencelab-logo.jpg"
              alt="中国石油 ScienceLab · AI for Science 一体化科研平台"
              width={1100}
              height={366}
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
            {view === "home" && (
              <>
                <section className="v-agent-home">
                  <span className="v-kicker">UNIFIED RESEARCH AGENT</span>
                  <h1>今天想推进什么科研任务？</h1>
                  <div className="v-workbench-examples" aria-label="科研任务示例">
                    <span>任务示例</span>
                    <div className="v-workbench-example-content">
                      {(["读", "算", "做"] as const).map((category) => (
                        <div className="v-workbench-example-row" key={category}>
                          <span className="v-workbench-example-category">{category}</span>
                          <div className="v-workbench-example-list" aria-label={`${category}类推荐问题`}>
                            {researchSuggestions[category].map((suggestion) => (
                              <button
                                type="button"
                                key={suggestion}
                                onClick={() =>
                                  mutate("", space.id, (draftState) => {
                                    draftState.drafts[key] = suggestion;
                                  })
                                }
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {input}
                </section>

                <div className="v-workbench-dashboard">
                  <section className="v-workbench-metrics" aria-label="科研概览">
                    <button
                      type="button"
                      onClick={() => router.push("/research-spaces/current/overview")}
                    >
                      <span className="tone-blue"><FolderKanban size={22} /></span>
                      <div><small>参与科研项目</small><strong>8</strong></div>
                      <ChevronRight size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/research-spaces/current/overview")}
                    >
                      <span className="tone-violet"><Layers3 size={22} /></span>
                      <div><small>参与课题</small><strong>15</strong></div>
                      <ChevronRight size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/workspace?view=tasks")}
                    >
                      <span className="tone-green"><Clock3 size={22} /></span>
                      <div><small>进行中任务</small><strong>12</strong></div>
                      <ChevronRight size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/workspace?view=outputs")}
                    >
                      <span className="tone-orange"><FileStack size={22} /></span>
                      <div><small>最近科研产出</small><strong>26</strong></div>
                      <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => router.push("/workspace?view=pending")}>
                      <span className="tone-blue"><SquareCheckBig size={22} /></span>
                      <div><small>我的待办任务</small><strong>{pendingTaskCount}</strong></div>
                      <ChevronRight size={17} />
                    </button>
                    <button type="button" onClick={() => router.push("/lab?tab=" + encodeURIComponent("实验任务管理"))}>
                      <span className="tone-green"><FlaskConical size={22} /></span>
                      <div><small>进行中试验</small><strong>{runningExperimentCount}</strong></div>
                      <ChevronRight size={17} />
                    </button>
                  </section>

                  <div className="v-workbench-dual-grid">
                    <section className="v-workbench-panel v-workbench-recommendations reference-panel">
                      <div className="v-section-head">
                        <h2><Sparkles size={18} />AI 为你推荐</h2>
                        <button className="v-link" type="button" onClick={() => notify("当前已展示全部推荐演示数据。")}>查看全部</button>
                      </div>
                      <div className="v-workbench-tabs" role="tablist" aria-label="AI 推荐筛选">
                        {["全部 (5)", "仅需知悉 (2)", "需要决策 (2)", "建议操作 (1)", "科研资讯 (5)"].map((filter) => {
                          const value = filter.replace(/ \(\d+\)$/, "");
                          return (
                          <button
                            type="button"
                            role="tab"
                            aria-selected={recommendationFilter === value}
                            className={recommendationFilter === value ? "selected" : ""}
                            onClick={() => setRecommendationFilter(value)}
                            key={filter}
                          >
                            {filter}
                          </button>
                          );
                        })}
                      </div>
                      <div className="v-recommendation-list reference-list">
                        {recommendationFilter === "科研资讯"
                          ? researchNews.map((item) => (
                              <article key={item.title}>
                                <span className="recommendation-icon news"><BookOpen size={20} /></span>
                                <div>
                                  <strong>{item.title}</strong>
                                  <p>{item.description}</p>
                                </div>
                                <time>{item.time}</time>
                                <Button onClick={() => notify("科研资讯详情为本地演示。")}>查看详情</Button>
                              </article>
                            ))
                          : workbenchRecommendations
                              .filter(
                                (item) =>
                                  recommendationFilter === "全部" ||
                                  item.category === recommendationFilter,
                              )
                              .map((item) => (
                                <article key={item.title}>
                                  <span className={`recommendation-icon ${item.icon}`}>
                                    {item.icon === "experiment" ? <FlaskConical size={21} /> : item.icon === "compute" ? <Cpu size={21} /> : <BookOpen size={21} />}
                                  </span>
                                  <div>
                                    <div className="reference-recommendation-title">
                                      <strong>{item.title}</strong>
                                      <span>{item.category}</span>
                                    </div>
                                    <p>{item.description}</p>
                                  </div>
                                  <time>{item.time}</time>
                                  <Button onClick={() => notify(`${item.action}为本地演示。`)}>{item.action}</Button>
                                </article>
                              ))}
                      </div>
                    </section>

                    <section className="v-workbench-panel v-workbench-activity reference-panel">
                      <div className="v-section-head">
                        <h2><Activity size={18} />科研活动</h2>
                        <button className="v-link" type="button" onClick={() => notify("当前已展示全部科研活动演示数据。")}>
                          查看全部
                        </button>
                      </div>
                      <div className="v-workbench-tabs" role="tablist" aria-label="科研活动筛选">
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
                      <div className="v-activity-timeline reference-activity-list">
                        {researchActivities
                          .filter(
                            (item) =>
                              activityFilter === "项目动态" ||
                              item.kind === activityFilter,
                          )
                          .map((item) => (
                            <button
                              type="button"
                              key={`${item.time}-${item.title}`}
                              onClick={() => notify("科研活动详情为本地演示。")}
                            >
                              <time>{item.time}</time>
                              <span className="activity-dot" />
                              <span className="reference-activity-icon">
                                {item.icon === "compute" ? <Cpu size={19} /> : item.icon === "experiment" ? <FlaskConical size={19} /> : <Activity size={19} />}
                              </span>
                              <div><strong>{item.title}</strong><small>{item.description}</small></div>
                              <Badge>{item.status}</Badge>
                            </button>
                          ))}
                      </div>
                    </section>
                  </div>

                  <div className="v-workbench-bottom-grid">
                    <section className="v-workbench-panel v-workbench-current-research">
                      <div className="v-section-head">
                        <h2><CirclePlay size={18} />最近科研任务</h2>
                        <Link href="/workspace?view=tasks" className="v-link">查看全部</Link>
                      </div>
                      <div className="v-home-task-table v-reference-task-table">
                        <div className="v-home-task-head">
                          <span>任务名称</span><span>任务状态</span><span>当前步骤 / 进度</span><span>相关课题</span><span>操作</span>
                        </div>
                        {referenceTasks.map((item) => (
                          <div className="v-home-task-row" key={item.name}>
                            <div className="reference-task-name"><span className={`task-dot ${item.tone}`} /><strong>{item.name}</strong></div>
                            <Badge>{item.status}</Badge>
                            <div className="v-home-progress">
                              <span>{item.step}</span>
                              <div><i style={{ width: `${item.progress}%` }} /><small>{item.progress}%</small></div>
                            </div>
                            <span className="reference-topic">{item.topic}</span>
                            <Button onClick={() => notify("科研任务详情为本地演示。")}>查看</Button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="v-workbench-panel v-workbench-output-summary">
                      <div className="v-section-head">
                        <h2><FileStack size={18} />最近科研产出</h2>
                        <Link href="/research-spaces/current/assets" className="v-link">查看全部</Link>
                      </div>
                      <div className="v-reference-output-layout">
                        <div className="v-reference-output-distribution" aria-label="成果类型占比，共 26 项">
                          <strong>成果类型占比</strong>
                          <div className="v-reference-donut-row">
                            <div className="v-reference-donut">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={[...referenceOutputTypes]} dataKey="percentage" innerRadius={54} outerRadius={76} paddingAngle={1} stroke="none">
                                    {referenceOutputTypes.map((item) => <Cell key={item.name} fill={item.donutColor} />)}
                                  </Pie>
                                  <Tooltip formatter={(value) => [`${value}%`, "占比"]} contentStyle={{ fontSize: 11, border: "1px solid #dbe6f4", borderRadius: 7 }} />
                                </PieChart>
                              </ResponsiveContainer>
                              <div><b>26</b><span>总数</span></div>
                            </div>
                            <ul>
                              {referenceOutputTypes.map((item) => (
                                <li key={item.name}><i style={{ backgroundColor: item.donutColor }} /><span>{item.name}</span><b>{item.percentage}%</b></li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <div className="v-reference-output-right">
                          <div className="v-reference-output-cards">
                            {referenceOutputTypes.slice(0, 4).map((item) => (
                              <div key={item.name}>
                                <span style={{ color: item.cardColor }}>
                                  {item.icon === "report" ? <FileText size={19} /> : item.icon === "data" ? <Database size={19} /> : item.icon === "chart" ? <ChartNoAxesColumn size={19} /> : <Box size={19} />}
                                </span>
                                <p>{item.name}<b>{item.count}</b></p>
                              </div>
                            ))}
                          </div>
                          <div className="v-output-trend" role="img" aria-label="近一年科研产出趋势，按月展示">
                            <strong>近一年科研产出趋势</strong>
                            <ResponsiveContainer width="100%" height={142}>
                              <BarChart data={[...referenceOutputTrend]} margin={{ top: 8, right: 2, left: -28, bottom: 0 }}>
                                <CartesianGrid stroke="#e9f0f8" vertical={false} />
                                <XAxis dataKey="month" interval={0} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#7186a3" }} />
                                <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#7186a3" }} />
                                <Tooltip cursor={{ fill: "#eef6ff" }} contentStyle={{ fontSize: 11, border: "1px solid #dbe6f4", borderRadius: 7 }} />
                                <Bar dataKey="value" name="产出数" fill="#4b91ec" radius={[2, 2, 0, 0]} barSize={14} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
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
