'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Modal,
  Tabs,
  Status,
  Empty,
  Notice,
  useLocalState,
  useResearchProject,
} from './workspace-kit';
const initial = [
  {
    id: 'TODO-01',
    title: '复核催化活性异常',
    source: 'ELN',
    sourceId: 'GB-2026-0915',
    projectId: 'PROJ-CCUS-01',
    owner: '张博士',
    due: '2026-09-21',
    status: '待处理',
    kind: '人工决策',
    url: '/experiments',
    note: '确认温度控制记录，形成处理意见。',
  },
  {
    id: 'TODO-02',
    title: '查看电子结构计算结果',
    source: 'AI中台',
    sourceId: '1024',
    projectId: 'PROJ-CCUS-01',
    owner: '张博士',
    due: '2026-09-22',
    status: '待处理',
    kind: '待知悉',
    url: '/compute-results/1024',
    note: '已返回12个结果文件，需确认结果是否符合预期。',
  },
  {
    id: 'TODO-03',
    title: '提交课题周报',
    source: '川庆',
    sourceId: 'PROJ-PE-02',
    projectId: 'PROJ-PE-02',
    owner: '李工',
    due: '2026-09-25',
    status: '待处理',
    kind: '重点风险',
    url: '/project-management/pm-07',
    note: '请在来源系统完成周报提交。',
  },
];
export function TasksWorkspace() {
  const { project, href } = useResearchProject();
  const [tasks, setTasks] = useLocalState('ai4s-todos-v2', initial);
  const [tab, setTab] = useState('全部');
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('当前课题');
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [notice, setNotice] = useState('');
  const task = tasks.find((t) => t.id === selected);
  const rows = tasks.filter(
    (t) =>
      (scope === '所有课题' || t.projectId === project.id) &&
      (tab === '全部' || tab === t.kind) &&
      `${t.title} ${t.source} ${t.owner}`.includes(query),
  );
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="任务与待办"
        description="聚合科研审核、计算、实验和项目待办，按来源与责任人跟踪处理结果。"
      />
      <Tabs
        tabs={['全部', '人工决策', '待知悉', '重点风险']}
        value={tab}
        onChange={setTab}
      />
      {notice && <Notice>{notice}</Notice>}
      <Panel title="待办列表">
        <div className="mb-4 flex gap-3">
          <input
            aria-label="搜索待办"
            className="research-input max-w-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="任务、来源、责任人"
          />
          <select
            aria-label="待办课题范围"
            className="research-input max-w-40"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option>当前课题</option>
            <option>所有课题</option>
          </select>
        </div>
        <table className="research-table">
          <thead>
            <tr>
              {[
                '任务',
                '来源 / 原始对象',
                '责任人',
                '截止日期',
                '状态',
                '操作',
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="font-medium">
                  {t.title}
                  <small className="block text-muted-foreground">
                    {t.kind}
                  </small>
                </td>
                <td>
                  {t.source}
                  <small className="block">{t.sourceId}</small>
                </td>
                <td>{t.owner}</td>
                <td>{t.due}</td>
                <td>
                  <Status>{t.status}</Status>
                </td>
                <td>
                  <button
                    className="text-primary"
                    onClick={() => {
                      setSelected(t.id);
                      setNote('');
                    }}
                  >
                    处理详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <Empty />}
      </Panel>
      <Modal
        open={!!task}
        onClose={() => setSelected(null)}
        title={task?.title ?? '待办详情'}
      >
        {task && (
          <>
            <p className="text-sm leading-6">{task.note}</p>
            <p className="text-xs text-muted-foreground">
              {task.source} · {task.sourceId} · 截止 {task.due} · 责任人{' '}
              {task.owner}
            </p>
            <Field label="处理意见">
              <textarea
                className="research-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Link
                className="research-button"
                href={href(task.url, task.sourceId)}
              >
                打开业务对象
              </Link>
              <button
                className="research-button"
                onClick={() => {
                  setNotice(`已记录对 ${task.owner} 的催办请求（本地演示）。`);
                  setSelected(null);
                }}
              >
                记录催办
              </button>
              <button
                className="research-primary"
                disabled={task.status === '已完成'}
                onClick={() => {
                  setTasks((all) =>
                    all.map((t) =>
                      t.id === task.id
                        ? { ...t, status: '已完成', note: note || t.note }
                        : t,
                    ),
                  );
                  setSelected(null);
                  setNotice('本地待办已处理；来源系统状态将在正式接入后同步。');
                }}
              >
                标记已处理
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
