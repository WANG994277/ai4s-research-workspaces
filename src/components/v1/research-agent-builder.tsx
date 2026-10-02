"use client";

import { useParams, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { ArrowLeft, Bot, ChevronDown, History, Link2, MessageSquarePlus, Paperclip, Plus, Send, Sparkles } from "lucide-react";
import { notify } from "./store";
import styles from "./research-agent-builder.module.css";

const scenes = ["文献调研", "数据分析", "实验设计", "科学计算", "科研绘图", "论文写作", "专利与标准", "编程与自动化"];

export function ResearchAgentBuilder() {
  const router = useRouter();
  const params = useParams<Record<string, string | string[]>>();
  const contextId = Array.isArray(params.contextId) ? params.contextId[0] : params.contextId ?? "current";
  const [name, setName] = useState("未命名科研智能体");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [welcome, setWelcome] = useState("");
  const [question, setQuestion] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<string[]>([]);
  const greeting = welcome.trim() || `你好，我是${name}。${description || "告诉我你要完成的科研任务。"}`;

  function send(text = message) { const value = text.trim(); if (!value) return; setChat(previous => [...previous, value]); setMessage(""); }
  return <div className={styles.builder}>
    <header className={styles.top}><button onClick={() => router.push(`/research-spaces/${encodeURIComponent(contextId)}/activities?tab=agents`)} aria-label="返回科研活动"><ArrowLeft/></button><span className={styles.avatar}><Bot/></span><div><input aria-label="智能体名称" value={name} onChange={event => setName(event.target.value)} maxLength={30}/><p>科研智能体　<span>未发布</span></p></div><nav><button className={styles.active}>配置</button><button>分析</button></nav><div className={styles.topActions}><button title="历史版本"><History/></button><button className={styles.publish} onClick={() => notify("智能体配置已发布")}><Send/>发布</button><button>…</button></div></header>
    <main><section className={styles.config}>
      <ConfigGroup title="基础设置"><Field title="模型选择"><select><option>组织默认</option><option>通用大模型</option><option>推理增强模型</option></select></Field><Field title="描述与分类"><p className={styles.tip}>描述展示在科研智能体卡片上；分类用于页面筛选，也帮助 Research Agent 判断何时把任务分派给它。</p><input value={description} onChange={event => setDescription(event.target.value)} placeholder="一句话说明它做什么"/><div className={styles.row}><select><option>通用</option><option>材料科学</option><option>地球科学</option></select></div><div className={styles.chips}>{scenes.map(scene => <button key={scene}>{scene}</button>)}</div></Field><Field title="提示词编辑"><p className={styles.tip}>定义智能体行为的指令（支持 Markdown 文件）　<a>插入结构模板</a>　<a>导入 .md</a></p><textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows={9} placeholder={"例如：你是「催化剂表征分析助手」，服务……\n\n## 核心职责\n## 工作流程\n## 执行边界"}/><small>{prompt.length} / 20000</small></Field><Field title="欢迎语"><select className={styles.compact}><option>简洁模式</option><option>卡片模式</option></select><textarea value={welcome} onChange={event => setWelcome(event.target.value)} rows={4} placeholder="用户打开会话时看到的第一句话"/><small>{welcome.length} / 20000</small><div className={styles.row}><label>背景色 <input type="color" defaultValue="#ffffff"/></label><label>透明度 <input type="range" min="0" max="100" defaultValue="100"/></label></div><label>推荐问题</label><div className={styles.row}><input value={question} onChange={event => setQuestion(event.target.value)} placeholder="输入推荐问题"/><button onClick={() => { if (question.trim() && questions.length < 10) { setQuestions([...questions, question.trim()]); setQuestion(""); } }}><Plus/>添加</button></div>{questions.map(item => <span className={styles.question} key={item}>{item}</span>)}</Field></ConfigGroup>
      <ConfigGroup title="能力扩展"><Capability title="知识库"/><Capability title="技能"/><Capability title="环境变量"/><Capability title="工具"/><Capability title="智能体类型"/><Capability title="MCP服务器"/><Capability title="联网搜索"/><Capability title="深度思考"/></ConfigGroup>
      <ConfigGroup title="高级设置"><Capability title="模型参数"/><Capability title="执行控制"/><Capability title="安全护栏"/><Capability title="学习系统"/><Capability title="会话知识库"/><Capability title="生成式 UI"/></ConfigGroup>
      <ConfigGroup title="权限设置"><Capability title="可见性"/><Capability title="访问控制"/></ConfigGroup>
    </section><section className={styles.preview}><header><h2>调试预览</h2><div><button><MessageSquarePlus/></button><button><Link2/></button></div></header><div className={styles.chat}><div className={styles.bubble}>{greeting}</div>{questions.map(item => <button className={styles.suggestion} key={item} onClick={() => send(item)}>{item}</button>)}{chat.map((item,index) => <div className={styles.userBubble} key={`${item}-${index}`}>{item}</div>)}</div><div className={styles.composer}><textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="输入你的问题"/><button><Paperclip/></button><button className={styles.send} onClick={() => send()}><Send/></button></div><button className={styles.helper}><Sparkles/></button><footer>当前为应用调试环境，发布后在科研超级中枢由 Research Agent 分派。</footer></section></main>
  </div>;
}

function ConfigGroup({ title, children }: { title: string; children: ReactNode }) { return <section className={styles.group}><h2><ChevronDown/>{title}</h2>{children}</section>; }
function Field({ title, children }: { title: string; children: ReactNode }) { return <div className={styles.field}><h3>{title}</h3>{children}</div>; }
function Capability({ title }: { title: string }) { return <details className={styles.capability}><summary>{title}<Plus/></summary><p>点击右侧 + 添加或配置{title}。</p></details>; }
