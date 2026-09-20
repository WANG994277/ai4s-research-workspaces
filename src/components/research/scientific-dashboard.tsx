'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { projects, assets, computeTasks, devices } from '@/mock/research';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Notice,
  Status,
  Modal,
  useResearchProject,
  downloadText,
} from './workspace-kit';
const views = [
  ['overview', '管理驾驶舱'],
  ['trend', '科技态势分析'],
  ['strategy', '战略方向研判'],
  ['resources', '资源统筹配置'],
  ['projects', '重大项目监管'],
  ['outcomes', '科技成果展示'],
  ['technology-tree', '科技树'],
];
const topics = [
  {
    name: 'CCUS 催化转化',
    papers: 128,
    patents: 64,
    risk: '催化稳定性需验证',
    projectId: 'PROJ-CCUS-01',
  },
  {
    name: '功能高分子材料',
    papers: 96,
    patents: 45,
    risk: '中试工艺条件待核验',
    projectId: 'PROJ-PE-02',
  },
  {
    name: '储层智能评价',
    papers: 73,
    patents: 29,
    risk: '数据跨区适用性不确定',
    projectId: 'PROJ-RES-03',
  },
];
const trend = [
  { month: '4月', 论文: 32, 专利: 18 },
  { month: '5月', 论文: 45, 专利: 20 },
  { month: '6月', 论文: 59, 专利: 31 },
  { month: '7月', 论文: 78, 专利: 40 },
  { month: '8月', 论文: 103, 专利: 52 },
  { month: '9月', 论文: 128, 专利: 64 },
];
export function ScientificDashboard() {
  const params = useSearchParams();
  const requested = params.get('view') ?? 'overview';
  const view = views.some(([k]) => k === requested) ? requested : 'overview';
  const { href } = useResearchProject();
  const [topic, setTopic] = useState('全部领域');
  const [period, setPeriod] = useState('第三季度');
  const [table, setTable] = useState(false);
  const [detail, setDetail] = useState('');
  const selected = topics.filter(
    (t) => topic === '全部领域' || t.name === topic,
  );
  const projectRows =
    topic === '全部领域'
      ? projects
      : projects.filter((p) => selected.some((t) => t.projectId === p.id));
  const title = views.find(([k]) => k === view)?.[1] ?? '科研驾驶舱';
  const series = trend
    .map((t, index) => ({
      ...t,
      标准: (index + 2) * selected.length,
      论文: Math.round(
        (t.论文 * selected.reduce((n, s) => n + s.papers, 0)) / 128,
      ),
      专利: Math.round(
        (t.专利 * selected.reduce((n, s) => n + s.patents, 0)) / 64,
      ),
    }))
    .filter((_, i) => (period === '第三季度' ? i >= 3 : true));
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title={title}
        description="从科研证据、课题、资源和成果查看进展，按领域下钻到明细。"
      >
        <button
          className="research-button"
          onClick={() =>
            downloadText(
              `${title}.json`,
              JSON.stringify(
                {
                  period,
                  topic,
                  source: '原型演示快照',
                  topics: selected,
                  projects: projectRows,
                },
                null,
                2,
              ),
              'application/json',
            )
          }
        >
          导出视图
        </button>
      </WorkspaceHeader>
      <nav className="flex flex-wrap gap-2" aria-label="科研驾驶舱视角">
        {views.map(([k, label]) => (
          <Link
            key={k}
            className={`research-button ${view === k ? 'border-primary text-primary' : ''}`}
            aria-current={view === k ? 'page' : undefined}
            href={href(`/dashboard?view=${k}`)}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex items-end gap-4">
        <Field label="研究领域">
          <select
            className="research-input"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option>全部领域</option>
            {topics.map((t) => (
              <option key={t.name}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="2026 年统计周期">
          <select
            className="research-input"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option>第三季度</option>
            <option>4月至9月</option>
          </select>
        </Field>
        <span className="pb-2 text-xs text-muted-foreground">
          2026-09-20 示例快照 · 非真实科研指标
        </span>
      </div>
      {(view === 'overview' || view === 'trend') && (
        <>
          <section className="grid grid-cols-4 gap-4">
            {[
              ['关联课题', projectRows.length],
              ['论文证据', selected.reduce((n, t) => n + t.papers, 0)],
              ['专利线索', selected.reduce((n, t) => n + t.patents, 0)],
              ['标准条目', selected.length * 7],
            ].map(([label, n]) => (
              <button
                key={label}
                onClick={() => setDetail(String(label))}
                className="rounded-xl border border-line bg-white p-4 text-left hover:border-primary"
              >
                <span className="text-xs text-muted-foreground">{label}</span>
                <strong className="mt-2 block text-3xl font-semibold">
                  {n}
                </strong>
                <small className="mt-2 block text-primary">
                  查看口径与明细
                </small>
              </button>
            ))}
          </section>
          <Panel
            title="科研证据增长趋势"
            action={
              <button
                className="research-button"
                onClick={() => setTable(!table)}
              >
                {table ? '显示图表' : '表格替代视图'}
              </button>
            }
          >
            {table ? (
              <table className="research-table">
                <thead>
                  <tr>
                    <th>月份</th>
                    <th>论文</th>
                    <th>专利</th>
                    <th>标准</th>
                  </tr>
                </thead>
                <tbody>
                  {series.map((s) => (
                    <tr key={s.month}>
                      <td>{s.month}</td>
                      <td>{s.论文}</td>
                      <td>{s.专利}</td>
                      <td>{s.标准}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-[280px]" aria-label="累计科研证据趋势">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line dataKey="论文" stroke="#2878D0" strokeWidth={2} />
                    <Line dataKey="专利" stroke="#168B68" strokeWidth={2} />
                    <Line dataKey="标准" stroke="#B4232D" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </>
      )}
      {view === 'strategy' && (
        <Panel title="技术方向证据比较">
          <table className="research-table">
            <thead>
              <tr>
                <th>方向</th>
                <th>证据量</th>
                <th>不确定性 / 约束</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {selected.map((t) => (
                <tr key={t.name}>
                  <td>{t.name}</td>
                  <td>
                    论文 {t.papers} · 专利 {t.patents}
                  </td>
                  <td>{t.risk}</td>
                  <td>
                    <button
                      className="text-primary"
                      onClick={() => setDetail(t.name)}
                    >
                      审阅依据
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Notice>
            示例研判，待专家确认。热度与证据数量不能直接替代技术可行性判断。
          </Notice>
        </Panel>
      )}
      {view === 'resources' && (
        <div className="grid grid-cols-2 gap-5">
          <Panel title="计算资源需求">
            <table className="research-table">
              <thead>
                <tr>
                  <th>任务</th>
                  <th>负责人</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {computeTasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <Link
                        className="text-primary"
                        href={href('/compute-tasks', t.id)}
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td>{t.owner}</td>
                    <td>{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted-foreground">
              实际容量和配额由 AI 中台提供，建议不替代资源审批。
            </p>
          </Panel>
          <Panel title="仪器供需">
            {devices.map((d) => (
              <div key={d.id} className="mb-4 border-b border-line pb-4">
                <p className="font-medium">{d.name}</p>
                <p className="my-2 text-sm text-muted-foreground">
                  {d.description}
                </p>
                <Link
                  className="text-sm text-primary"
                  href={href('/lab-resources/reservations')}
                >
                  查看开放机时与预约
                </Link>
              </div>
            ))}
          </Panel>
        </div>
      )}
      {view === 'projects' && (
        <Panel title="里程碑与风险穿透">
          <div className="space-y-5">
            {projectRows.map((p, i) => (
              <div
                key={p.id}
                className="grid grid-cols-[minmax(200px,1fr)_1fr_100px] items-center gap-5 border-b border-line pb-4"
              >
                <div>
                  <Link
                    className="font-medium text-primary"
                    href={`/collaboration/projects?projectId=${p.id}`}
                  >
                    {p.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.owner} · {p.source}
                  </p>
                </div>
                <div>
                  <progress
                    className="h-2 w-full accent-blue"
                    value={[68, 52, 35, 80, 46][i]}
                    max="100"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <Status>{p.status}</Status>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {view === 'outcomes' && (
        <Panel title="成果与关联研究">
          <div className="grid grid-cols-3 gap-4">
            {assets.map((a) => (
              <Link
                key={a.id}
                className="rounded-xl border border-line p-4 hover:border-primary"
                href={href('/assets/data-knowledge', a.id)}
              >
                <Status>{a.status}</Status>
                <h2 className="mt-3 font-semibold">{a.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {a.description}
                </p>
                <small className="mt-4 block">
                  {a.owner} · {a.source}
                </small>
              </Link>
            ))}
          </div>
        </Panel>
      )}
      {view === 'technology-tree' && (
        <Panel title="技术谱系与布局">
          <div className="inline-flex rounded-lg bg-primary px-5 py-3 text-white">
            油气与炼化科研
          </div>
          <ul className="ml-8 mt-4 space-y-4 border-l border-line pl-6">
            {selected.map((t) => (
              <li key={t.name}>
                <button
                  className="research-button font-medium"
                  onClick={() => setDetail(t.name)}
                >
                  {t.name}
                </button>
                <ul className="ml-6 mt-3 grid grid-cols-3 gap-3 border-l border-line pl-5">
                  {['文献与专利证据', '关联课题', '数据与模型'].map(
                    (label, i) => (
                      <li key={label}>
                        <Link
                          className="research-button"
                          href={href(
                            [
                              '/knowledge-graph',
                              '/collaboration/projects',
                              '/assets/models',
                            ][i],
                            t.projectId,
                          )}
                        >
                          {label}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </li>
            ))}
          </ul>
        </Panel>
      )}
      {view !== 'resources' && (
        <Panel title="证据与后续行动">
          {selected.map((t) => (
            <div
              key={t.name}
              className="mb-3 flex items-center justify-between gap-4 border-b border-line pb-3"
            >
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.risk} · 机构：
                  {t.name.includes('储层') ? '油气勘探研究院' : '炼化研究中心'}{' '}
                  · 演示文献集 / 课题记录
                </p>
              </div>
              <Link
                className="research-button shrink-0"
                href={href('/literature-search', t.projectId)}
              >
                核验文献证据
              </Link>
            </div>
          ))}
        </Panel>
      )}
      <Modal
        open={!!detail}
        onClose={() => setDetail('')}
        title={detail || '指标明细'}
      >
        <p className="text-sm leading-7">
          口径：当前领域内的示例累计记录；时间为2026年{period}
          ，截至2026-09-20。此处展示追溯路径，不作为正式统计结论。
        </p>
        {projectRows.map((p) => (
          <Link
            key={p.id}
            className="research-button justify-start"
            href={`/collaboration/projects?projectId=${p.id}`}
          >
            {p.name} · {p.id}
          </Link>
        ))}
      </Modal>
    </div>
  );
}
