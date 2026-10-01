"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowUp, AtSign, Bot, ChevronDown, ChevronRight,
  Download, FileCode2, FileSpreadsheet, FileText, Folder,
  FolderOpen, LayoutGrid, Mic, MoreHorizontal, Plus, RefreshCw, Search,
  Upload, UsersRound,
} from "lucide-react";
import { Badge, Button, Empty, Field, Modal } from "./ui";
import { notify } from "./store";

type Message = { id: string; role: "user" | "assistant" | "system"; text: string };
type PlanStep = { id: number; title: string; sub: string; status: "已完成" | "进行中" | "待执行" };
type SandboxFile = { name: string; type: string; size: string };
type TraceEvent = { id: string; type: "user" | "assistant" | "tool"; round: number; duration: string; title: string; detail: string };
type SessionModel = { id: string; name: string; messages: Message[]; steps: PlanStep[]; files: SandboxFile[]; traces: TraceEvent[] };
type TaskGroup = { id: string; name: string; open: boolean; sessions: SessionModel[] };

const initialMessages: Message[] = [
  { id: "m1", role: "user", text: "为运动型乘用车轮胎开发锡偶联 SSBR 新牌号，设计一批分子结构使纯胶 Tg 达到 -35±5℃，串行迭代用分子动力学预测 Tg。" },
  { id: "m2", role: "assistant", text: "已读取项目记忆与 17 个专利配方。将按串行策略：设计候选 → RDKit 校验 → RadonPy MD 预测 Tg，不达标自动规划下一候选。先给出候选 C1/C2/C3。" },
  { id: "m3", role: "user", text: "先按方案 A 覆盖策略推进，禁用 Fox 方程。" },
  { id: "m4", role: "assistant", text: "已确认方案 A、禁用 Fox。C1/C2/C3 已建链校验，正在提交 MD 预测；当前推荐 Top5，最高分 81.04。" },
];

const initialSteps: PlanStep[] = [
  { id: 1, title: "候选筛选与预测", sub: "ID:7", status: "已完成" },
  { id: 2, title: "聚合物选材（数字研发）", sub: "ID:3", status: "进行中" },
  { id: 3, title: "配方优化（数字小试）", sub: "ID:4", status: "待执行" },
  { id: 4, title: "模流分析（数字试模）", sub: "ID:5", status: "待执行" },
  { id: 5, title: "结论与决策", sub: "ID:6", status: "待执行" },
];

const initialTraces: TraceEvent[] = [
  { id: "t1", type: "user", round: 1, duration: "—", title: "用户提出科研任务", detail: initialMessages[0].text },
  { id: "t2", type: "tool", round: 1, duration: "0.7s", title: "读取历史配方", detail: "17 条专利配方与历史 Tg 已载入" },
  { id: "t3", type: "assistant", round: 1, duration: "2.1s", title: "认知智能体答复", detail: "按苯乙烯结合量与 1,2-乙烯基比例设计候选 C1/C2/C3" },
  { id: "t4", type: "tool", round: 2, duration: "3.2s", title: "RDKit 校验", detail: "C1/C2/C3 分子结构校验通过" },
  { id: "t5", type: "assistant", round: 2, duration: "1.8s", title: "任务编排", detail: "MD 单次 Tg 不确定度较大，先用于趋势筛选" },
];

function makeSession(id: string, name: string): SessionModel {
  return {
    id, name,
    messages: name === "橡胶配方与性能预测" ? initialMessages : [
      { id: `${id}-1`, role: "user", text: `请继续推进「${name}」，并给出可验证的下一步。` },
      { id: `${id}-2`, role: "assistant", text: "已载入该子对话的研究上下文。我将先核对引用资料和当前任务状态，再继续执行。" },
    ],
    steps: initialSteps,
    files: [
      { name: "PLAN.md", type: "研究计划", size: "6 KB" },
      { name: "candidate_C2.json", type: "候选结构", size: "12 KB" },
      { name: "Tg_trend_summary.csv", type: "趋势数据", size: "4 KB" },
    ],
    traces: initialTraces,
  };
}

const initialGroups: TaskGroup[] = [
  { id: "g1", name: "柔性聚合物材料研究", open: true, sessions: [makeSession("s1", "橡胶配方与性能预测"), makeSession("s2", "储层渗透率预测方案")] },
  { id: "g2", name: "成本降低专项", open: false, sessions: [makeSession("s3", "降本配方评估")] },
];

const agents = ["性能预测智能体", "文献配方对比智能体", "配方推荐智能体"];
const initialMembers = [
  { id: "p1", name: "林夏", role: "负责人", active: true, review: "每周" },
  { id: "p2", name: "王霏", role: "成员", active: true, review: "里程碑" },
  { id: "p3", name: "陈敏", role: "评审人", active: true, review: "阶段成果" },
  { id: "p4", name: "刘洋", role: "成员", active: false, review: "每周" },
];

const tone = { user: "用户", assistant: "助手", tool: "工具" } as const;

function saveText(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

export function ResearchTaskWorkspace() {
  const [groups, setGroups] = useState(initialGroups);
  const [sessionId, setSessionId] = useState("s1");
  const [centerTab, setCenterTab] = useState<"chat" | "trace">("chat");
  const [rightTab, setRightTab] = useState<"plan" | "files">("plan");
  const [draft, setDraft] = useState("");
  const [traceFilter, setTraceFilter] = useState<"all" | TraceEvent["type"]>("all");
  const [traceView, setTraceView] = useState<"duration" | "round" | "call">("duration");
  const [traceQuery, setTraceQuery] = useState("");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  const [membersOpen, setMembersOpen] = useState(false);
  const [outputOpen, setOutputOpen] = useState(false);
  const [members, setMembers] = useState(initialMembers);
  const [menuGroup, setMenuGroup] = useState("");
  const uploadRef = useRef<HTMLInputElement>(null);

  const active = useMemo(() => groups.flatMap((group) => group.sessions).find((session) => session.id === sessionId) ?? groups[0].sessions[0], [groups, sessionId]);
  const activeGroup = groups.find((group) => group.sessions.some((session) => session.id === active.id)) ?? groups[0];
  const mentionTerm = /@([^@\s]*)$/.exec(draft)?.[1] ?? null;
  const mentionOptions = [...agents, ...members.filter((member) => member.active && member.name !== "林夏").map((member) => member.name)].filter((name) => mentionTerm !== null && (!mentionTerm || name.includes(mentionTerm)));
  const traceItems = active.traces.filter((event) => (traceFilter === "all" || event.type === traceFilter) && `${event.title} ${event.detail}`.toLowerCase().includes(traceQuery.toLowerCase()));

  function updateActive(update: (session: SessionModel) => SessionModel) {
    setGroups((current) => current.map((group) => ({ ...group, sessions: group.sessions.map((session) => session.id === active.id ? update(session) : session) })));
  }

  function toggleGroup(id: string) {
    setGroups((current) => current.map((group) => group.id === id ? { ...group, open: !group.open } : group));
  }

  function addTask() {
    const name = newTaskName.trim();
    if (!name) return;
    const groupId = `g-${Date.now()}`;
    const next = makeSession(`s-${Date.now()}`, "新会话");
    setGroups((current) => [{ id: groupId, name, open: true, sessions: [next] }, ...current]);
    setSessionId(next.id); setNewTaskName(""); setNewTaskOpen(false); notify("已新建科研任务。");
  }

  function addSession(groupId: string) {
    const next = makeSession(`s-${Date.now()}`, "新会话");
    setGroups((current) => current.map((group) => group.id === groupId ? { ...group, open: true, sessions: [...group.sessions, next] } : group));
    setSessionId(next.id); setMenuGroup("");
  }

  function chooseMention(name: string) {
    setDraft((value) => value.replace(/@([^@\s]*)$/, `@${name} `));
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    const mentioned = [...agents, ...members.map((member) => member.name)].filter((name) => text.includes(`@${name}`));
    const timestamp = Date.now();
    updateActive((session) => ({
      ...session,
      messages: [
        ...session.messages,
        { id: `u-${timestamp}`, role: "user", text },
        ...(mentioned.length ? [{ id: `n-${timestamp}`, role: "system" as const, text: `已通知 ${mentioned.map((name) => `@${name}`).join("、")}：已加入本任务并启动多人多智能体协同。` }] : []),
        { id: `a-${timestamp}`, role: "assistant", text: mentioned.length ? "已收到指令，正在协调各方智能体协同处理，结果将同步到右侧面板与相关成员。" : "已收到你的指令，正在执行相关分析任务。稍后将输出结果到右侧文件面板。" },
      ],
      traces: [...session.traces, { id: `tu-${timestamp}`, type: "user", round: session.traces.length + 1, duration: "—", title: "用户追问", detail: text }, { id: `ta-${timestamp}`, type: "assistant", round: session.traces.length + 1, duration: "1.6s", title: "智能体答复", detail: "已接收追问并更新任务执行上下文。" }],
    }));
    setDraft("");
  }

  function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    updateActive((session) => ({ ...session, files: [...session.files, ...Array.from(files).map((file) => ({ name: file.name, type: "用户上传", size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB` }))] }));
    setRightTab("files"); notify("文件已加入当前沙盒。");
  }

  function removeGroup(groupId: string) {
    setGroups((current) => current.filter((group) => group.id !== groupId));
    setMenuGroup("");
  }

  return <div className="rtw-shell">
    <aside className="rtw-tree">
      <Button className="rtw-new" onClick={() => setNewTaskOpen(true)}><Plus />新建任务</Button>
      <div className="rtw-tree-list">{groups.map((group) => <section className="rtw-group" key={group.id}>
        <header className={group.id === activeGroup.id ? "active" : ""}>
          <button className="rtw-group-main" onClick={() => toggleGroup(group.id)}>{group.open ? <ChevronDown /> : <ChevronRight />}{group.open ? <FolderOpen /> : <Folder />}<strong>{group.name}</strong></button>
          <div className="rtw-group-actions"><button title="新建对话" onClick={() => addSession(group.id)}><Plus /></button><button title="任务产出视图" onClick={() => { setSessionId(group.sessions[0]?.id ?? active.id); setOutputOpen(true); }}><LayoutGrid /></button><button title="成员与协作" onClick={() => setMenuGroup(menuGroup === group.id ? "" : group.id)}><MoreHorizontal /></button></div>
        </header>
        {menuGroup === group.id && <div className="rtw-folder-menu"><button onClick={() => setMembersOpen(true)}><UsersRound />成员与协作</button><button onClick={() => setOutputOpen(true)}><LayoutGrid />查看任务产出</button>{groups.length > 1 && <button onClick={() => removeGroup(group.id)}>删除演示任务</button>}</div>}
        {group.open && <div className="rtw-sessions">{group.sessions.map((session) => <button className={session.id === active.id ? "selected" : ""} onClick={() => { setSessionId(session.id); setCenterTab("chat"); }} key={session.id}><i />{session.name}</button>)}</div>}
      </section>)}</div>
    </aside>

    {outputOpen ? <section className="rtw-output"><header><Button onClick={() => setOutputOpen(false)}><ArrowLeft />返回对话</Button><strong>任务产出视图</strong></header><div><article className="rtw-output-summary"><Badge>成果汇总</Badge><h2>{activeGroup.name}</h2><p>已整理当前任务的对话、执行轨迹、目标规划与沙盒文件。所有结果为前端演示数据，不构成真实科研结论。</p><div><span><b>{active.messages.length}</b>次对话</span><span><b>{active.files.length}</b>项产出</span><span><b>{active.traces.length}</b>条轨迹</span></div></article><div className="rtw-output-grid">{active.files.map((file) => <article key={file.name}><FileText /><h3>{file.name}</h3><p>{file.type} · {file.size}</p><Button onClick={() => saveText(file.name, `${activeGroup.name}\n${active.name}\n${file.type}`)}><Download />下载</Button></article>)}</div></div></section> : <>
      <main className="rtw-center">
        <nav className="rtw-tabs" role="tablist"><button role="tab" aria-selected={centerTab === "chat"} className={centerTab === "chat" ? "selected" : ""} onClick={() => setCenterTab("chat")}>对话</button><button role="tab" aria-selected={centerTab === "trace"} className={centerTab === "trace" ? "selected" : ""} onClick={() => setCenterTab("trace")}>轨迹</button></nav>
        {centerTab === "chat" ? <><div className="rtw-chat">{active.messages.map((message) => message.role === "system" ? <div className="rtw-system" key={message.id}><UsersRound />{message.text}</div> : <article className={message.role} key={message.id}>{message.role === "assistant" && <span className="rtw-bot"><Bot /></span>}<div>{message.text.split("\n").map((line, index) => <p key={`${message.id}-${index}`}>{line || <br />}</p>)}</div></article>)}</div><div className="rtw-composer">{mentionTerm !== null && <div className="rtw-mention"><small>关联智能体 / 协作者</small>{mentionOptions.map((name) => <button onClick={() => chooseMention(name)} key={name}>{agents.includes(name) ? <Bot /> : <UsersRound />}<span><b>{name}</b><small>{agents.includes(name) ? "智能体 · 可加入任务" : "协作者 / 评审人"}</small></span></button>)}</div>}<input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} placeholder="描述任务，或输入 @ 选择协作者 / 关联智能体，形成多人多智能体协同…" /><footer><button onClick={() => setDraft((value) => `${value}${value ? " " : ""}@`)}><AtSign />输入 @ 选择人或智能体</button><RefreshCw /><Mic /><button className="rtw-send" disabled={!draft.trim()} onClick={sendMessage}><ArrowUp /></button></footer></div></> : <div className="rtw-trace"><header><div className="rtw-trace-view">{[["duration", "时长"], ["round", "轮次"], ["call", "调用"]].map(([value, label]) => <button className={traceView === value ? "selected" : ""} onClick={() => setTraceView(value as typeof traceView)} key={value}>{label}</button>)}</div><label><Search /><input value={traceQuery} onChange={(event) => setTraceQuery(event.target.value)} placeholder="搜索轨迹" /></label><Button onClick={() => saveText(`${active.name}-trace.txt`, active.traces.map((event) => `${event.title}\t${event.detail}`).join("\n"))}><Download />导出</Button></header><div className="rtw-density">{active.traces.map((event) => <i className={event.type} title={event.title} key={event.id} />)}</div><div className="rtw-filter">{[["all", "全部"], ["user", "人的问题"], ["assistant", "智能体答复"], ["tool", "调用工具"]].map(([value, label]) => <button className={traceFilter === value ? "selected" : ""} onClick={() => setTraceFilter(value as typeof traceFilter)} key={value}>{label}</button>)}</div><div className="rtw-trace-list">{traceItems.map((event) => <article key={event.id}><Badge>{tone[event.type]}</Badge><div><b>{event.title}</b><p>{event.detail}</p></div><small>{traceView === "duration" ? event.duration : traceView === "round" ? `轮次 ${event.round}` : event.type === "tool" ? "tool" : tone[event.type]}</small></article>)}</div></div>}
      </main>

      <aside className="rtw-right">
        <nav className="rtw-tabs" role="tablist"><button role="tab" aria-selected={rightTab === "plan"} className={rightTab === "plan" ? "selected" : ""} onClick={() => setRightTab("plan")}>目标规划</button><button role="tab" aria-selected={rightTab === "files"} className={rightTab === "files" ? "selected" : ""} onClick={() => setRightTab("files")}>沙盒文件</button></nav>
        {rightTab === "plan" ? <div className="rtw-plan"><header><span><Bot /></span><div><b>认知智能体</b><small>builtin:matl_coordinator</small></div></header><p>绑定实验 {active.steps.length} 个 · 下一批 1 项</p><ol>{active.steps.map((step) => <li className={step.status === "进行中" ? "current" : ""} key={step.id}><span>{step.id}</span><button onClick={() => updateActive((session) => ({ ...session, steps: session.steps.map((item) => item.id === step.id ? { ...item, status: "进行中" } : item) }))}><span><b>{step.title}</b><small>{step.sub} · {step.status}</small></span>{step.status === "进行中" && <em>» 当前</em>}</button>{step.status !== "进行中" && <ChevronRight />}</li>)}</ol></div> : <div className="rtw-files"><header><b>共 {active.files.length} 个</b><div><button title="上传" onClick={() => uploadRef.current?.click()}><Upload /></button><button title="下载全部" onClick={() => saveText(`${active.name}-files.txt`, active.files.map((file) => file.name).join("\n"))}><Download /></button></div></header><input ref={uploadRef} className="sr-only" type="file" multiple onChange={(event) => uploadFiles(event.target.files)} />{active.files.length ? active.files.map((file) => <article key={file.name}>{file.name.endsWith(".csv") ? <FileSpreadsheet /> : file.name.endsWith(".json") ? <FileCode2 /> : <FileText />}<div><b>{file.name}</b><small>{file.type} · {file.size}</small></div><button aria-label={`下载${file.name}`} onClick={() => saveText(file.name, `${active.name}\n${file.type}`)}><Download /></button></article>) : <Empty>任务产出文件将显示于此。</Empty>}</div>}
      </aside>
    </>}

    <Modal title="新建任务" open={newTaskOpen} onClose={() => setNewTaskOpen(false)} footer={<><Button onClick={() => setNewTaskOpen(false)}>取消</Button><Button primary onClick={addTask}>创建任务</Button></>}><Field label="任务名称" required><input autoFocus value={newTaskName} onChange={(event) => setNewTaskName(event.target.value)} placeholder="例如：配方性能预测与实验验证" /></Field><p className="v-muted">新任务将在当前科研空间中创建，并自动生成首个子对话。</p></Modal>
    <Modal title="成员与协作" open={membersOpen} onClose={() => setMembersOpen(false)} wide footer={<Button primary onClick={() => setMembersOpen(false)}>完成</Button>}><p className="v-muted">管理可通过 @ 加入对话的协作者与评审人，并设置 Review 节奏。</p><div className="rtw-member-list">{members.map((member) => <article key={member.id}><span>{member.name.slice(0, 1)}</span><div><b>{member.name}</b><small>{member.role}</small></div><select value={member.role} onChange={(event) => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, role: event.target.value } : item))}><option>负责人</option><option>成员</option><option>评审人</option></select><select value={member.review} onChange={(event) => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, review: event.target.value } : item))}><option>每周</option><option>里程碑</option><option>阶段成果</option></select><Button disabled={member.name === "林夏"} onClick={() => setMembers((current) => current.map((item) => item.id === member.id ? { ...item, active: !item.active } : item))}>{member.active ? "移出" : "添加"}</Button></article>)}</div></Modal>
  </div>;
}
