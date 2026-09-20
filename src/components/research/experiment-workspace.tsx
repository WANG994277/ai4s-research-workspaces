'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSidebar } from '@/components/layout/sidebar-context';
import {
  WorkspaceHeader,
  Panel,
  Modal,
  Field,
  Tabs,
  Notice,
  Empty,
  Status,
  NextActions,
  useLocalState,
  useResearchProject,
  downloadText,
} from './workspace-kit';

type Sample = {
  id: string;
  name: string;
  batch: string;
  location: string;
  status: string;
  projectId: string;
  experiment: string;
  history: string[];
};
const seedSamples: Sample[] = [
  {
    id: 'SMP-001',
    name: 'Cu/ZnO 催化剂',
    batch: 'B-0920-01',
    location: 'A201 / 样品柜02',
    status: '已登记',
    projectId: 'PROJ-CCUS-01',
    experiment: 'GB-2026-0915',
    history: ['2026-09-20 09:00 张博士登记，10 g'],
  },
];

export function SamplesWorkspace() {
  const { project } = useResearchProject();
  const [samples, setSamples] = useLocalState('ai4s-samples-v2', seedSamples);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    batch: '',
    location: '',
    experiment: '',
  });
  const [transfer, setTransfer] = useState('');
  const [notice, setNotice] = useState('');
  const record = samples.find((s) => s.id === selected);
  const rows = samples.filter(
    (s) =>
      s.projectId === project.id &&
      `${s.name} ${s.id} ${s.batch} ${s.experiment}`.includes(query),
  );
  function save(e: React.FormEvent) {
    e.preventDefault();
    const id = `SMP-${Date.now()}`;
    setSamples((all) => [
      ...all,
      {
        ...form,
        id,
        status: '已登记',
        projectId: project.id,
        history: [
          `${new Date().toLocaleString('zh-CN')} 登记样品，负责人张博士`,
        ],
      },
    ]);
    setCreate(false);
    setSelected(id);
    setForm({ name: '', batch: '', location: '', experiment: '' });
  }
  function change(status: string) {
    if (!record) return;
    setSamples((all) =>
      all.map((s) =>
        s.id === record.id
          ? {
              ...s,
              status,
              location: transfer || s.location,
              history: [
                ...s.history,
                `${new Date().toLocaleString('zh-CN')} 张博士：${status}${transfer ? ' → ' + transfer : ''}`,
              ],
            }
          : s,
      ),
    );
    setTransfer('');
  }
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="实验样品与记录"
        description="按样品与批次追踪登记、位置、领用和实验关联，保留全过程记录。"
      >
        <button className="research-primary" onClick={() => setCreate(true)}>
          登记样品
        </button>
      </WorkspaceHeader>
      {notice && <Notice>{notice}</Notice>}
      <Panel
        title={`当前课题样品 · ${rows.length}`}
        action={
          <button
            className="research-button"
            onClick={() =>
              downloadText(
                '样品台账.json',
                JSON.stringify(rows, null, 2),
                'application/json',
              )
            }
          >
            导出台账
          </button>
        }
      >
        <input
          aria-label="搜索样品"
          className="research-input mb-4 max-w-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="样品、批次、实验编号"
        />
        <table className="research-table">
          <thead>
            <tr>
              {[
                '样品 / 编号',
                '批次',
                '存放位置',
                '关联实验',
                '状态',
                '操作',
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id}>
                <td>
                  {s.name}
                  <small className="block text-muted-foreground">{s.id}</small>
                </td>
                <td>{s.batch}</td>
                <td>{s.location}</td>
                <td>{s.experiment || '未关联'}</td>
                <td>
                  <Status>{s.status}</Status>
                </td>
                <td>
                  <button
                    className="text-primary"
                    onClick={() => setSelected(s.id)}
                  >
                    追溯与流转
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && (
          <Empty message="当前课题暂无匹配样品，可登记样品或切换课题。" />
        )}
      </Panel>
      <Modal open={create} onClose={() => setCreate(false)} title="登记样品">
        <form className="space-y-4" onSubmit={save}>
          {(
            [
              ['name', '样品名称'],
              ['batch', '批次号'],
              ['location', '存放位置'],
              ['experiment', '关联实验编号'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                required={key !== 'experiment'}
                className="research-input"
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
          <button className="research-primary" type="submit">
            确认登记
          </button>
        </form>
      </Modal>
      <Modal
        open={!!record}
        onClose={() => setSelected(null)}
        title={record?.name ?? '样品详情'}
      >
        {record && (
          <>
            <div className="flex gap-2">
              <Status>{record.batch}</Status>
              <Status>{record.status}</Status>
              <Status>{record.location}</Status>
            </div>
            <Field label="转入位置 / 接收人">
              <input
                className="research-input"
                value={transfer}
                onChange={(e) => setTransfer(e.target.value)}
                placeholder="例如：分析实验室 B / 李工"
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                className="research-button"
                disabled={!transfer.trim()}
                onClick={() => change('已转交')}
              >
                记录转交
              </button>
              <button
                className="research-button"
                onClick={() => change('检测中')}
              >
                开始检测
              </button>
              <button
                className="research-button"
                onClick={() => change('已归档')}
              >
                归档样品
              </button>
              <button
                className="research-button"
                onClick={() =>
                  setNotice(
                    'ELN 当前未连接；已保留样品和实验编号，接入后展示原始记录与来源定位。',
                  )
                }
              >
                ELN 记录
              </button>
            </div>
            <h3 className="font-semibold">批次流转记录</h3>
            <ol className="space-y-3 border-l border-line pl-4 text-sm">
              {record.history.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ol>
            <NextActions sourceId={record.id} />
          </>
        )}
      </Modal>
    </div>
  );
}

type Run = {
  id: string;
  name: string;
  projectId: string;
  owner: string;
  device: string;
  plan: string;
  version: number;
  status: string;
  parameters: string;
  steps: string[];
  logs: string[];
};
const seedRuns: Run[] = [
  {
    id: 'GB-2026-0915',
    name: '催化活性评价实验',
    projectId: 'PROJ-CCUS-01',
    owner: '张博士',
    device: '固定床反应器',
    plan: 'PLAN-CAT-03',
    version: 3,
    status: '运行中',
    parameters: '温度 200 °C；压力 3 MPa；气体流量 50 mL/min',
    steps: ['设备与样品检查', '参数复核', '装样与升温', '稳态采集', '结果汇总'],
    logs: [
      '09:00 方案 v3 审核通过',
      '09:30 操作人确认就绪',
      '10:00 开始运行，ELN 结果待同步',
    ],
  },
];

export function ExperimentsWorkspace({
  orchestrator = false,
}: {
  orchestrator?: boolean;
}) {
  const sourceId = useSearchParams().get('sourceId') ?? '';
  const [registration, setRegistration] = useState({
    owner: '张博士',
    device: '固定床反应器',
    plan: sourceId.split('@')[0],
    parameters: '',
  });
  const { project } = useResearchProject();
  const { role } = useSidebar();
  const [runs, setRuns] = useLocalState('ai4s-experiment-runs-v2', seedRuns);
  const [tab, setTab] = useState(orchestrator ? '实验编排' : '实验台账');
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [pending, setPending] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState('');
  const [step, setStep] = useState('');
  const rows = runs.filter(
    (r) =>
      r.projectId === project.id &&
      `${r.name} ${r.id} ${r.status}`.includes(query),
  );
  const run = rows.find((r) => r.id === selected) ?? rows[0];
  const canReview = role === 'lead' || role === 'manager';
  function transition() {
    if (!run) return;
    setRuns((all) =>
      all.map((r) =>
        r.id === run.id
          ? {
              ...r,
              status: pending,
              logs: [
                ...r.logs,
                `${new Date().toLocaleTimeString('zh-CN')} 张博士：${r.status} → ${pending}${reason ? '；' + reason : ''}`,
              ],
            }
          : r,
      ),
    );
    setNotice(`实验状态已更新为${pending}（本地演示）。`);
    setPending('');
    setReason('');
  }
  function modify(changes: Partial<Run>) {
    if (!run) return;
    setRuns((all) =>
      all.map((r) => (r.id === run.id ? { ...r, ...changes } : r)),
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="实验执行与管理"
        description="以实验批次为主线组织方案、步骤、运行记录和调优。每次审核与状态变更保留责任人。"
      >
        <button className="research-primary" onClick={() => setCreate(true)}>
          登记实验
        </button>
      </WorkspaceHeader>
      <Tabs
        tabs={['实验台账', '实验编排', '运行记录', '参数调优']}
        value={tab}
        onChange={setTab}
      />
      {notice && <Notice>{notice}</Notice>}
      <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-5">
        <Panel title="当前课题实验">
          <input
            className="research-input"
            aria-label="搜索实验"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名称、编号、状态"
          />
          <div className="mt-3 space-y-2">
            {rows.map((r) => (
              <button
                key={r.id}
                className={`w-full rounded-lg border p-3 text-left ${run?.id === r.id ? 'border-primary bg-secondary' : 'border-line'}`}
                onClick={() => setSelected(r.id)}
              >
                <span className="block text-sm font-medium">{r.name}</span>
                <small className="mt-2 block text-muted-foreground">
                  {r.id} · {r.status}
                </small>
              </button>
            ))}
            {!rows.length && <Empty />}
          </div>
        </Panel>
        <Panel title={run?.name ?? '实验详情'}>
          {run ? (
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Status>{run.status}</Status>
                <Status>
                  方案 {run.plan} v{run.version}
                </Status>
                <Status>{run.owner}</Status>
                <Status>{run.device}</Status>
              </div>
              {tab === '实验台账' && (
                <>
                  <p className="text-sm leading-7">{run.parameters}</p>
                  <p className="text-sm text-muted-foreground">
                    课题：{project.name}；来源：AI4S / ELN
                    示例记录。执行前需完成方案审批、设备和样品准备。
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {run.status === '草稿' && (
                      <button
                        className="research-primary"
                        onClick={() => setPending('待审核')}
                      >
                        提交审核
                      </button>
                    )}
                    {run.status === '待审核' && canReview && (
                      <>
                        <button
                          className="research-primary"
                          onClick={() => setPending('待执行')}
                        >
                          审核通过
                        </button>
                        <button
                          className="research-button"
                          onClick={() => setPending('草稿')}
                        >
                          退回修改
                        </button>
                      </>
                    )}
                    {run.status === '待审核' && !canReview && (
                      <p className="text-sm text-muted-foreground">
                        等待课题负责人审核。
                      </p>
                    )}
                    {run.status === '待执行' && (
                      <button
                        className="research-primary"
                        onClick={() => setPending('运行中')}
                      >
                        确认下发
                      </button>
                    )}
                    {run.status === '运行中' && (
                      <>
                        <button
                          className="research-button"
                          onClick={() => setPending('已暂停')}
                        >
                          暂停实验
                        </button>
                        <button
                          className="research-primary"
                          onClick={() => setPending('已完成')}
                        >
                          完成并汇总
                        </button>
                      </>
                    )}
                    {run.status === '已暂停' && (
                      <button
                        className="research-primary"
                        onClick={() => setPending('运行中')}
                      >
                        恢复实验
                      </button>
                    )}
                  </div>
                </>
              )}
              {tab === '实验编排' && (
                <>
                  <p className="text-sm text-muted-foreground">
                    按执行顺序登记步骤；已提交审核的方案锁定，调整时先创建新版本。
                  </p>
                  <ol className="space-y-3">
                    {run.steps.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-lg border border-line p-3"
                      >
                        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs text-primary">
                          {i + 1}
                        </span>
                        <span className="flex-1 text-sm">{s}</span>
                        {run.status === '草稿' && (
                          <button
                            className="text-xs text-muted-foreground"
                            onClick={() =>
                              modify({
                                steps: run.steps.filter((_, n) => i !== n),
                              })
                            }
                          >
                            移除
                          </button>
                        )}
                      </li>
                    ))}
                  </ol>
                  <div className="flex gap-2">
                    <input
                      className="research-input"
                      aria-label="新增实验步骤"
                      value={step}
                      onChange={(e) => setStep(e.target.value)}
                      disabled={run.status !== '草稿'}
                      placeholder="新增步骤及执行要求"
                    />
                    <button
                      className="research-button shrink-0"
                      disabled={run.status !== '草稿' || !step.trim()}
                      onClick={() => {
                        modify({ steps: [...run.steps, step.trim()] });
                        setStep('');
                      }}
                    >
                      添加步骤
                    </button>
                  </div>
                </>
              )}
              {tab === '运行记录' && (
                <>
                  <ol className="space-y-3 border-l border-line pl-4 text-sm">
                    {run.logs.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ol>
                  <Field label="观察 / 异常记录">
                    <textarea
                      className="research-input"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="记录异常、观察与处置结论"
                    />
                  </Field>
                  <button
                    className="research-button"
                    disabled={!reason.trim()}
                    onClick={() => {
                      modify({
                        logs: [
                          ...run.logs,
                          `${new Date().toLocaleTimeString('zh-CN')} ${reason}`,
                        ],
                      });
                      setReason('');
                    }}
                  >
                    保存记录
                  </button>
                  <button
                    className="research-button ml-2"
                    onClick={() =>
                      downloadText(
                        `${run.id}-运行记录.txt`,
                        run.logs.join('\n'),
                      )
                    }
                  >
                    导出记录
                  </button>
                </>
              )}
              {tab === '参数调优' && (
                <>
                  <Field label="下一轮参数与调整原因">
                    <textarea
                      className="research-input min-h-28"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={run.parameters}
                    />
                  </Field>
                  <button
                    className="research-primary"
                    disabled={!reason.trim()}
                    onClick={() => {
                      const id = `EXP-${Date.now()}`;
                      setRuns((all) => [
                        ...all,
                        {
                          ...run,
                          id,
                          name: run.name + ' · 下一轮',
                          version: run.version + 1,
                          status: '草稿',
                          parameters: reason,
                          logs: [
                            `由 ${run.id} v${run.version} 克隆；等待参数审核`,
                          ],
                        },
                      ]);
                      setSelected(id);
                      setReason('');
                      setTab('实验台账');
                      setNotice('已创建下一轮草稿，重新审核后才能执行。');
                    }}
                  >
                    保存为下一轮实验
                  </button>
                </>
              )}
              <div className="border-t border-line pt-4">
                <NextActions sourceId={run.id} />
              </div>
            </div>
          ) : (
            <Empty message="请登记实验，关联方案、设备与责任人。" />
          )}
        </Panel>
      </div>
      <Modal open={create} onClose={() => setCreate(false)} title="登记实验">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const id = `EXP-${Date.now()}`;
            setRuns((all) => [
              ...all,
              {
                id,
                name,
                projectId: project.id,
                owner: registration.owner,
                device: registration.device,
                plan: registration.plan,
                version: Number(sourceId.split('@v')[1]) || 1,
                status: '草稿',
                parameters: registration.parameters,
                steps: ['检查样品与设备', '复核参数', '执行与采集'],
                logs: ['创建实验草稿'],
              },
            ]);
            setSelected(id);
            setCreate(false);
            setName('');
          }}
        >
          <Field label="实验名称">
            <input
              className="research-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          {(['owner', 'device', 'plan', 'parameters'] as const).map(
            (key, i) => (
              <Field
                key={key}
                label={['负责人', '设备', '关联方案编号', '参数与执行要求'][i]}
              >
                <input
                  required
                  className="research-input"
                  value={registration[key]}
                  onChange={(e) =>
                    setRegistration({ ...registration, [key]: e.target.value })
                  }
                />
              </Field>
            ),
          )}
          <p className="text-xs text-muted-foreground">
            所属课题：{project.name}；来源：{sourceId || '手工登记'}
          </p>
          <button className="research-primary">保存草稿</button>
        </form>
      </Modal>
      <Modal
        open={!!pending}
        onClose={() => setPending('')}
        title={`确认变更为${pending}`}
        description="此原型仅记录状态，不向设备发送控制指令。"
      >
        <Field label="审核意见 / 操作原因">
          <textarea
            className="research-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <p className="text-sm">
          实验：{run?.name}；责任人：{run?.owner}；方案版本：v{run?.version}
        </p>
        <button className="research-primary" onClick={transition}>
          确认变更
        </button>
      </Modal>
    </div>
  );
}
