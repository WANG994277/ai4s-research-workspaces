'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Paperclip, Send, Sparkles } from 'lucide-react';
import {
  Panel,
  Field,
  Status,
  Notice,
  useLocalState,
  useResearchProject,
  downloadText,
} from './workspace-kit';
type Session = {
  id: string;
  projectId: string;
  title: string;
  question: string;
  plan: string;
  memory: string;
  files: string[];
  state: '草稿' | '待确认' | '已生成';
  answer: string;
};
export function ResearchAgentWorkspace({
  compute = false,
}: {
  compute?: boolean;
}) {
  const { project, href } = useResearchProject();
  const [sessions, setSessions] = useLocalState<Session[]>(
    compute ? 'ai4s-compute-sessions' : 'ai4s-research-sessions',
    [],
  );
  const [id, setId] = useState('');
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const shown = sessions.filter((s) => s.projectId === project.id);
  const session = shown.find((s) => s.id === id);
  const title = compute ? '科研计算求解' : '科研思路探索';
  function patch(changes: Partial<Session>) {
    setSessions((all) =>
      all.map((s) => (s.id === id ? { ...s, ...changes } : s)),
    );
  }
  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const next: Session = {
      id: `SESSION-${Date.now()}`,
      projectId: project.id,
      title: input.slice(0, 28),
      question: input,
      plan: compute
        ? '1. 确认计算目标和输入数据\n2. 选择模型、工具与资源\n3. 核验参数和运行环境\n4. 创建计算任务草稿'
        : '1. 澄清研究问题与约束\n2. 确认课题资料及检索范围\n3. 对比文献证据与不确定性\n4. 形成研究建议与可编辑草稿',
      memory: '只使用当前课题授权资料；结论需附来源。',
      files,
      state: '待确认',
      answer: '',
    };
    setSessions((all) => [next, ...all]);
    setId(next.id);
    setInput('');
    setFiles([]);
  }
  function confirm() {
    patch({
      state: '已生成',
      answer: `# ${session?.title}\n\n## 任务目标\n${session?.question}\n\n## 计划\n${session?.plan}\n\n## 证据与约束\n当前使用本地演示资料 LIT-001（未核验）。正式结论需原文及计算/实验结果支持。\n\n## 下一步\n${compute ? '检查数据、参数、环境与资源后提交计算任务。' : '进入文献检索收集证据，形成研究假设并完善报告。'}`,
    });
  }
  return (
    <div className="grid min-h-[640px] grid-cols-[210px_minmax(360px,1fr)_320px] gap-4">
      <Panel title="科研会话">
        <button
          className="research-primary w-full"
          onClick={() => {
            setId('');
            setInput('');
            setFiles([]);
          }}
        >
          新建任务
        </button>
        <div className="mt-4 space-y-2">
          {shown.map((s) => (
            <button
              className={`w-full rounded-lg border p-3 text-left ${s.id === id ? 'border-primary bg-secondary' : 'border-line'}`}
              key={s.id}
              onClick={() => setId(s.id)}
            >
              <span className="block text-sm">{s.title}</span>
              <small className="text-muted-foreground">{s.state}</small>
            </button>
          ))}
        </div>
      </Panel>
      <Panel title={title}>
        <div className="flex min-h-[540px] flex-col">
          <p className="text-xs text-muted-foreground">
            {project.name} · {project.id}
          </p>
          <div className="flex-1 space-y-5 py-6">
            {session ? (
              <>
                <div className="rounded-xl bg-surface-2 p-4 text-sm leading-7">
                  {session.question}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Sparkles className="size-4 text-primary" />
                    执行计划 <Status>{session.state}</Status>
                  </div>
                  <Field label="可编辑计划">
                    <textarea
                      className="research-input min-h-36 leading-7"
                      value={session.plan}
                      readOnly={session.state === '已生成'}
                      onChange={(e) => patch({ plan: e.target.value })}
                    />
                  </Field>
                  {session.state === '待确认' && (
                    <div className="flex gap-2">
                      <button
                        className="research-primary"
                        disabled={!session.plan.trim()}
                        onClick={confirm}
                      >
                        确认计划并预览产物
                      </button>
                      <button
                        className="research-button"
                        onClick={() => patch({ state: '草稿' })}
                      >
                        暂停规划
                      </button>
                    </div>
                  )}
                  {session.state === '草稿' && (
                    <button
                      className="research-button"
                      onClick={() => patch({ state: '待确认' })}
                    >
                      继续规划
                    </button>
                  )}
                  {session.state === '已生成' && (
                    <>
                      <Notice>
                        演示草稿已生成，尚未调用真实模型、检索或计算工具。核验后可进入下一步任务。
                      </Notice>
                      <details className="rounded-lg border border-line p-3 text-sm">
                        <summary className="cursor-pointer font-medium">
                          工具与证据轨迹
                        </summary>
                        <div className="mt-3 space-y-2">
                          <p>
                            课题资料 ·{' '}
                            {session.files.join('、') || '默认演示文献'} · 只读
                          </p>
                          <p>证据检索 · 未接入 · 引用 LIT-001 待核验</p>
                          <p>产物版本 · v1 · 等待科研人员确认</p>
                        </div>
                      </details>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center">
                <Sparkles className="mx-auto size-9 text-primary" />
                <h1 className="mt-4 text-xl font-semibold">
                  {compute
                    ? '把科研问题转成可执行计算任务'
                    : '从问题开始，形成有依据的研究思路'}
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  选择课题资料，先审阅计划，再查看建议与产物。
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {(compute
                    ? ['设计催化剂活性预测计算', '选择分子动力学工具和资源']
                    : ['梳理催化剂失活机制证据', '比较两种材料的研究路线']
                  ).map((q) => (
                    <button
                      className="research-button"
                      onClick={() => setInput(q)}
                      key={q}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <form className="rounded-xl border border-line p-3" onSubmit={send}>
            <textarea
              aria-label="科研问题"
              className="min-h-20 w-full resize-y bg-transparent text-sm outline-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="描述问题、目标和约束条件…"
            />
            <div className="flex items-center justify-between gap-2">
              <label className="research-button cursor-pointer">
                <Paperclip className="size-4" />
                补充资料
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={(e) =>
                    setFiles(
                      Array.from(e.target.files ?? []).map((f) => f.name),
                    )
                  }
                />
              </label>
              <span className="text-xs text-muted-foreground">
                {files.length
                  ? `${files.length} 个本地附件（仅记录文件名）`
                  : ''}
              </span>
              <button
                aria-label="发送科研问题"
                className="research-primary"
                disabled={!input.trim()}
              >
                <Send className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </Panel>
      <Panel title="任务产物">
        <div className="space-y-5">
          {session ? (
            <>
              <Field label="课题记忆 / 约束">
                <textarea
                  className="research-input min-h-24"
                  value={session.memory}
                  onChange={(e) => patch({ memory: e.target.value })}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                输入资料：{session.files.join('、') || '演示资料'}
                <br />
                来源：{session.id} · 当前课题 · v1
              </p>
              {session.answer ? (
                <>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg bg-surface-2 p-3 text-xs leading-6">
                    {session.answer}
                  </pre>
                  <button
                    className="research-button w-full"
                    onClick={() =>
                      downloadText(`${session.title}.md`, session.answer)
                    }
                  >
                    下载草稿
                  </button>
                  <Link
                    className="research-primary w-full"
                    href={href(
                      compute ? '/compute-tasks' : '/research-writing',
                      session.id,
                    )}
                  >
                    {compute ? '转为计算任务' : '进入报告撰写'}
                  </Link>
                  <Link
                    className="research-button w-full"
                    href={href('/literature-search', session.id)}
                  >
                    回看文献依据
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  确认计划后，在此查看产物和来源信息。
                </p>
              )}
            </>
          ) : (
            <p className="text-sm leading-7 text-muted-foreground">
              研究计划、报告草稿和计算参数将与会话分别保留，方便继续编辑与下载。
            </p>
          )}
          {notice && <Notice>{notice}</Notice>}
        </div>
      </Panel>
    </div>
  );
}
