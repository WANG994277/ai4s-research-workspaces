'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FlaskConical,
  FolderOpen,
  Clock,
  TriangleAlert,
  ArrowRightLeft,
  Upload,
  Pencil,
} from 'lucide-react';
import { activity, today, timestamp, uid, type Experiment } from './model';
import {
  s,
  Header,
  TabBar,
  Panel,
  Badge,
  Stats,
  Filter,
  SearchBox,
  Pagination,
  pageSlice,
  Empty,
  Notice,
  Timeline,
  Metadata,
  FormDialog,
  type FormField,
  useCollaborationData,
  useLocation,
  projectOptions,
  uploadRecord,
} from './shared';
type Editor = {
  title: string;
  fields: FormField[];
  submit?: string;
  save: (v: Record<string, string>) => void | string;
};
export function CollaborationExperiments() {
  const { data, setData, ready, storageError } = useCollaborationData();
  const loc = useLocation();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const exp = data.experiments.find((x) => x.id === loc.get('detail'));
  const project = data.projects.find((p) => p.id === exp?.projectId);
  const view = loc.get('view', 'tasks');
  const tab = loc.get('tab', 'basic');
  const filter = (key: string, value: string) =>
    loc.set({ [key]: value, page: undefined }, true);
  const filtered = data.experiments
    .filter(
      (e) =>
        (!loc.get('org') || e.org === loc.get('org')) &&
        (!loc.get('type') || e.type === loc.get('type')) &&
        (!loc.get('status') || e.status === loc.get('status')) &&
        (!loc.get('owner') || e.owner === loc.get('owner')) &&
        `${e.name} ${e.owner} ${e.id}`
          .toLowerCase()
          .includes(loc.get('q').toLowerCase()),
    )
    .sort((a, b) => b.updated.localeCompare(a.updated));
  const list = pageSlice(filtered, loc.get('page'));
  const issues = filtered.flatMap((e) =>
    e.issues.map((i) => ({ ...i, experiment: e })),
  );
  const issuePage = pageSlice(issues, loc.get('page'));
  const patch = (
    id: string,
    fn: (e: Experiment) => Experiment,
    message: string,
    actor = '张博士',
  ) => {
    setData((d) => ({
      ...d,
      experiments: d.experiments.map((e) =>
        e.id === id
          ? {
              ...fn(e),
              updated: today,
              activities: [...e.activities, activity(message, actor)],
            }
          : e,
      ),
    }));
    setNotice(message);
  };
  function editExperiment(target?: Experiment) {
    setEditor({
      title: target ? '编辑实验任务' : '新建实验任务',
      fields: [
        {
          key: 'name',
          label: '实验任务名称',
          required: true,
          wide: true,
          value: target?.name,
        },
        {
          key: 'project',
          label: '所属课题',
          type: 'select',
          required: true,
          options: projectOptions(data),
          value: data.projects.find((p) => p.id === target?.projectId)?.name,
        },
        {
          key: 'type',
          label: '实验类型',
          type: 'select',
          options: ['室内实验', '模拟实验', '岩心实验', '分析测试'],
          value: target?.type,
        },
        {
          key: 'owner',
          label: '实验负责人',
          required: true,
          value: target?.owner,
        },
        {
          key: 'operator',
          label: '当前操作人',
          required: true,
          value: target?.operator,
        },
        {
          key: 'start',
          label: '计划开始',
          type: 'date',
          required: true,
          value: target?.start ?? today,
        },
        {
          key: 'end',
          label: '计划结束',
          type: 'date',
          required: true,
          value: target?.end,
        },
        { key: 'location', label: '实验地点', value: target?.location },
        { key: 'device', label: '关联设备', value: target?.device },
        { key: 'sample', label: '实验样品 / 批次', value: target?.sample },
        {
          key: 'goal',
          label: '实验目标与要求',
          type: 'textarea',
          required: true,
          value: target?.goal,
        },
      ],
      save: (v) => {
        if (v.end < v.start) return '结束日期不能早于开始日期。';
        const p = data.projects.find((p) => p.name === v.project);
        if (!p) return '请选择所属课题';
        const fields = {
          name: v.name,
          type: v.type,
          owner: v.owner,
          operator: v.operator,
          start: v.start,
          end: v.end,
          location: v.location,
          device: v.device,
          sample: v.sample,
          goal: v.goal,
          projectId: p.id,
          org: p.org,
        };
        if (target)
          patch(target.id, (e) => ({ ...e, ...fields }), '更新了实验任务信息');
        else {
          const id = uid('EXP');
          setData((d) => ({
            ...d,
            experiments: [
              {
                ...fields,
                id,
                status: '准备中',
                recordId: '',
                updated: today,
                members: [
                  {
                    name: v.owner,
                    role: '实验负责人',
                    responsibility: '实验总体组织与结果确认',
                  },
                  {
                    name: v.operator,
                    role: '实验操作人',
                    responsibility: '现场执行与数据记录',
                  },
                ],
                handoffs: [],
                issues: [],
                activities: [activity('创建实验任务')],
              },
              ...d.experiments,
            ],
          }));
          loc.open(id);
          setNotice('实验任务已创建');
        }
        setEditor(null);
      },
    });
  }
  function assign() {
    if (!exp) return;
    if (exp.status === '待交接')
      return setNotice('任务正在交接中，请先确认接收或撤回交接，再调整分派。');
    if (exp.status === '已完成')
      return setNotice('任务已完成，如有新的实验工作请新建任务。');
    setEditor({
      title: '分派任务与责任范围',
      fields: [
        {
          key: 'operator',
          label: '操作人 / 承接人',
          required: true,
          value: exp.operator,
        },
        {
          key: 'responsibility',
          label: '负责工作与责任边界',
          type: 'textarea',
          required: true,
        },
        {
          key: 'due',
          label: '完成期限',
          type: 'date',
          required: true,
          value: exp.end,
        },
      ],
      save: (v) => {
        patch(
          exp.id,
          (e) => ({
            ...e,
            operator: v.operator,
            end: v.due,
            members: e.members.some((m) => m.name === v.operator)
              ? e.members.map((m) =>
                  m.name === v.operator
                    ? { ...m, responsibility: v.responsibility }
                    : m,
                )
              : [
                  ...e.members,
                  {
                    name: v.operator,
                    role: '实验操作人',
                    responsibility: v.responsibility,
                  },
                ],
          }),
          `分派任务给 ${v.operator}：${v.responsibility}`,
        );
        setEditor(null);
      },
    });
  }
  function handoff() {
    if (!exp) return;
    if (exp.status === '已完成') return setNotice('任务已完成，无需继续交接。');
    if (exp.handoffs.some((h) => h.status === '待接收'))
      return setNotice('已有交接待接收，请先确认或撤回。');
    setEditor({
      title: '发起实验任务交接',
      submit: '发起交接',
      fields: [
        { key: 'to', label: '接收人', required: true },
        {
          key: 'content',
          label: '交接内容、已完成工作与待办事项',
          type: 'textarea',
          required: true,
        },
      ],
      save: (v) => {
        if (v.to === exp.operator) return '接收人不能与当前操作人相同。';
        patch(
          exp.id,
          (e) => ({
            ...e,
            status: '待交接',
            handoffs: [
              ...e.handoffs,
              {
                id: uid('HAND'),
                from: e.operator,
                to: v.to,
                content: v.content,
                time: timestamp(),
                status: '待接收',
                resumeStatus: e.status,
              },
            ],
          }),
          `发起交接：${exp.operator} → ${v.to}`,
        );
        loc.set({ tab: 'handoffs' });
        setEditor(null);
      },
    });
  }
  function updateStatus() {
    if (!exp) return;
    const allowed: Record<string, string[]> = {
      准备中: ['进行中', '异常'],
      进行中: ['结果处理', '异常'],
      结果处理: ['已完成', '异常'],
      异常: ['准备中', '进行中', '结果处理'],
    };
    if (!allowed[exp.status])
      return setNotice(
        exp.status === '待交接' ? '请先完成交接确认。' : '该任务已完成。',
      );
    setEditor({
      title: '更新实验任务状态',
      fields: [
        {
          key: 'status',
          label: '目标状态',
          type: 'select',
          options: allowed[exp.status],
          required: true,
        },
        {
          key: 'reason',
          label: '进展说明与依据',
          type: 'textarea',
          required: true,
        },
      ],
      save: (v) => {
        patch(
          exp.id,
          (e) => ({ ...e, status: v.status }),
          `状态更新：${exp.status} → ${v.status}；${v.reason}`,
        );
        setEditor(null);
      },
    });
  }
  function addIssue() {
    if (!exp) return;
    setEditor({
      title: '上报实验问题',
      fields: [
        { key: 'title', label: '问题标题', required: true, wide: true },
        {
          key: 'level',
          label: '风险级别',
          type: 'select',
          options: ['一般', '中', '高'],
        },
        { key: 'owner', label: '处理责任人', required: true, value: exp.owner },
        {
          key: 'description',
          label: '问题描述与影响范围',
          type: 'textarea',
          required: true,
        },
      ],
      save: (v) => {
        patch(
          exp.id,
          (e) => ({
            ...e,
            issues: [
              ...e.issues,
              {
                id: uid('ISSUE'),
                title: v.title,
                level: v.level,
                owner: v.owner,
                status: '待处理',
                description: v.description,
                resolution: '',
                comments: [],
                created: today,
              },
            ],
          }),
          `上报问题：${v.title}`,
        );
        loc.set({ tab: 'issues' });
        setEditor(null);
      },
    });
  }
  const attached = data.files.filter(
    (f) =>
      !f.deleted && f.refs.some((r) => r.type === '实验' && r.id === exp?.id),
  );
  if (!ready && loc.get('detail') && !storageError)
    return (
      <div className={s.root} aria-busy="true">
        <Notice message="正在读取协作记录…" />
      </div>
    );
  if (loc.get('detail') && !exp)
    return (
      <div className={s.root}>
        <Header title="实验任务不存在" back={loc.back} />
        <Empty />
      </div>
    );
  return (
    <div className={s.root}>
      {exp ? (
        <>
          <Header
            title={exp.name}
            description={`${exp.id} · 所属课题：${project?.name ?? exp.projectId}`}
            back={loc.back}
            trail="实验任务列表"
          >
            <Badge value={exp.status} />
            <button className={s.button} onClick={() => editExperiment(exp)}>
              <Pencil size={14} />
              编辑任务
            </button>
            <button className={s.primary} onClick={assign}>
              分派任务
            </button>
          </Header>
          <TabBar
            tabs={[
              { key: 'basic', label: '基本信息' },
              { key: 'flow', label: '流转记录' },
              { key: 'handoffs', label: `交接记录 (${exp.handoffs.length})` },
              { key: 'members', label: '协作成员' },
              { key: 'files', label: `相关文件 (${attached.length})` },
              { key: 'issues', label: `问题与讨论 (${exp.issues.length})` },
            ]}
            value={tab}
            onChange={(t) => loc.set({ tab: t })}
          />
          <Notice message={notice || storageError} />
          <div className={tab === 'basic' ? s.detailGrid : undefined}>
            <div className={s.stack}>
              {tab === 'basic' && (
                <>
                  <Panel title="实验任务信息">
                    <Metadata
                      items={[
                        { label: '实验负责人', value: exp.owner },
                        { label: '当前操作人', value: exp.operator },
                        { label: '所属机构', value: exp.org },
                        { label: '实验类型', value: exp.type },
                        { label: '实验目标', value: exp.goal, wide: true },
                        {
                          label: '预计周期',
                          value: `${exp.start} 至 ${exp.end}`,
                        },
                        { label: '实验地点', value: exp.location },
                        { label: '关联设备', value: exp.device },
                        { label: '实验样品', value: exp.sample },
                        {
                          label: '关联实验记录',
                          value: exp.recordId || '尚未关联',
                        },
                        {
                          label: '责任边界',
                          value: exp.members
                            .map((m) => `${m.name}：${m.responsibility}`)
                            .join('；'),
                          wide: true,
                        },
                      ]}
                    />
                  </Panel>
                  <Panel title="任务流转进度">
                    <div className={s.steps}>
                      {['准备中', '进行中', '结果处理', '已完成'].map(
                        (stage, i) => {
                          const current = [
                            '准备中',
                            '进行中',
                            '结果处理',
                            '已完成',
                          ].indexOf(exp.status);
                          return (
                            <div
                              key={stage}
                              className={`${s.step} ${i <= current ? s.stepDone : ''}`}
                            >
                              <span className={s.stepCircle}>{i + 1}</span>
                              <p>
                                {['准备', '执行实验', '结果处理', '完成'][i]}
                              </p>
                            </div>
                          );
                        },
                      )}
                    </div>
                    <div className={s.actions}>
                      <button className={s.button} onClick={updateStatus}>
                        更新状态
                      </button>
                      <button
                        className={s.button}
                        onClick={() => loc.set({ tab: 'flow' })}
                      >
                        查看流转记录
                      </button>
                    </div>
                  </Panel>
                </>
              )}
              {tab === 'flow' && (
                <Panel title="实验任务流转记录">
                  <Timeline items={exp.activities} />
                </Panel>
              )}
              {tab === 'handoffs' && (
                <Panel
                  title="交接记录"
                  actions={
                    <button className={s.primary} onClick={handoff}>
                      <ArrowRightLeft size={14} />
                      发起交接
                    </button>
                  }
                >
                  {exp.handoffs.length ? (
                    exp.handoffs.map((h) => (
                      <div key={h.id} className={s.comment}>
                        <div className={s.actions}>
                          <strong>
                            {h.from} → {h.to}
                          </strong>
                          <Badge value={h.status} />
                        </div>
                        <p>{h.content}</p>
                        <small className={s.sub}>
                          发起时间：{h.time}
                          {h.acceptedAt ? ` · 接收时间：${h.acceptedAt}` : ''}
                        </small>
                        {h.status === '待接收' && (
                          <div className={s.actions} style={{ marginTop: 12 }}>
                            <button
                              className={s.primary}
                              onClick={() => {
                                patch(
                                  exp.id,
                                  (e) => ({
                                    ...e,
                                    operator: h.to,
                                    status: h.resumeStatus ?? '进行中',
                                    members: e.members.some(
                                      (m) => m.name === h.to,
                                    )
                                      ? e.members
                                      : [
                                          ...e.members,
                                          {
                                            name: h.to,
                                            role: '实验操作人',
                                            responsibility: h.content,
                                          },
                                        ],
                                    handoffs: e.handoffs.map((x) =>
                                      x.id === h.id
                                        ? {
                                            ...x,
                                            status: '已接收',
                                            acceptedAt: timestamp(),
                                          }
                                        : x,
                                    ),
                                  }),
                                  `${h.to} 确认接收交接`,
                                  h.to,
                                );
                              }}
                            >
                              确认接收（{h.to}）
                            </button>
                            <button
                              className={s.button}
                              onClick={() =>
                                patch(
                                  exp.id,
                                  (e) => ({
                                    ...e,
                                    status: h.resumeStatus ?? '进行中',
                                    handoffs: e.handoffs.map((x) =>
                                      x.id === h.id
                                        ? { ...x, status: '已撤回' }
                                        : x,
                                    ),
                                  }),
                                  '撤回了待接收的交接',
                                )
                              }
                            >
                              撤回交接
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <Empty message="还没有交接记录；工作移交时明确接收人与待办。" />
                  )}
                </Panel>
              )}
              {tab === 'members' && (
                <Panel
                  title="实验协作成员"
                  padded={false}
                  actions={
                    <button className={s.button} onClick={assign}>
                      维护分工
                    </button>
                  }
                >
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>成员</th>
                        <th>角色</th>
                        <th>责任边界</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exp.members.map((m, i) => (
                        <tr key={`${m.name}-${i}`}>
                          <td>{m.name}</td>
                          <td>
                            <Badge value={m.role} />
                          </td>
                          <td>{m.responsibility}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
              )}
              {tab === 'files' && (
                <Panel
                  title="实验结果与附件"
                  padded={false}
                  actions={
                    <button
                      className={s.primary}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload size={14} />
                      上传结果
                    </button>
                  }
                >
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>文件名称</th>
                        <th>类型</th>
                        <th>上传人</th>
                        <th>更新日期</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attached.map((f) => (
                        <tr key={f.id}>
                          <td>{f.name}</td>
                          <td>{f.type}</td>
                          <td>{f.author}</td>
                          <td>{f.updated}</td>
                          <td>
                            <Link
                              className={s.link}
                              href={`/collaboration/files-notes?detail=${f.id}`}
                            >
                              查看文件
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!attached.length && (
                    <Empty message="暂无相关文件，可上传实验结果或过程记录（本地附件限2MB）。" />
                  )}
                </Panel>
              )}
              {tab === 'issues' && (
                <Panel
                  title="实验问题与过程协同"
                  actions={
                    <button className={s.primary} onClick={addIssue}>
                      <Plus size={14} />
                      上报问题
                    </button>
                  }
                >
                  {exp.issues.length ? (
                    exp.issues.map((issue) => (
                      <div className={s.comment} key={issue.id}>
                        <div className={s.actions}>
                          <strong>{issue.title}</strong>
                          <Badge value={issue.level} />
                          <Badge value={issue.status} />
                          <span className={s.sub}>责任人：{issue.owner}</span>
                        </div>
                        <p>{issue.description}</p>
                        {issue.comments.map((c, i) => (
                          <p className={s.sectionIntro} key={i}>
                            {c}
                          </p>
                        ))}
                        {issue.resolution && (
                          <p>
                            <strong>处理结论：</strong>
                            {issue.resolution}
                          </p>
                        )}
                        <div className={s.actions}>
                          <button
                            className={s.button}
                            onClick={() =>
                              setEditor({
                                title: '补充问题讨论',
                                fields: [
                                  {
                                    key: 'comment',
                                    label: '讨论意见与证据说明',
                                    type: 'textarea',
                                    required: true,
                                  },
                                ],
                                save: (v) => {
                                  patch(
                                    exp.id,
                                    (e) => ({
                                      ...e,
                                      issues: e.issues.map((x) =>
                                        x.id === issue.id
                                          ? {
                                              ...x,
                                              comments: [
                                                ...x.comments,
                                                `张博士：${v.comment}`,
                                              ],
                                            }
                                          : x,
                                      ),
                                    }),
                                    `补充问题 ${issue.title} 的讨论`,
                                  );
                                  setEditor(null);
                                },
                              })
                            }
                          >
                            补充讨论
                          </button>
                          {issue.status !== '已关闭' && (
                            <button
                              className={s.button}
                              onClick={() =>
                                setEditor({
                                  title: '更新问题处理',
                                  fields: [
                                    {
                                      key: 'status',
                                      label: '处理状态',
                                      type: 'select',
                                      options: ['处理中', '已关闭'],
                                    },
                                    {
                                      key: 'resolution',
                                      label: '处理结论及闭环依据',
                                      type: 'textarea',
                                      required: true,
                                      value: issue.resolution,
                                    },
                                  ],
                                  save: (v) => {
                                    patch(
                                      exp.id,
                                      (e) => ({
                                        ...e,
                                        issues: e.issues.map((x) =>
                                          x.id === issue.id
                                            ? { ...x, ...v }
                                            : x,
                                        ),
                                      }),
                                      `更新问题处理：${issue.title}`,
                                    );
                                    setEditor(null);
                                  },
                                })
                              }
                            >
                              处理与关闭
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty message="当前实验没有待协同问题。" />
                  )}
                </Panel>
              )}
            </div>
            {tab === 'basic' && (
              <aside className={s.stack}>
                <Panel title="协作操作">
                  <div className={s.stack}>
                    <button className={s.button} onClick={handoff}>
                      发起交接
                    </button>
                    <button className={s.button} onClick={addIssue}>
                      上报异常问题
                    </button>
                    <button
                      className={s.button}
                      onClick={() =>
                        setEditor({
                          title: '关联实验记录',
                          fields: [
                            {
                              key: 'recordId',
                              label: 'ELN / 实验记录编号',
                              required: true,
                              wide: true,
                              value: exp.recordId,
                            },
                          ],
                          save: (v) => {
                            patch(
                              exp.id,
                              (e) => ({ ...e, recordId: v.recordId }),
                              `关联实验记录 ${v.recordId}`,
                            );
                            setEditor(null);
                          },
                        })
                      }
                    >
                      关联实验记录
                    </button>
                    <button
                      className={s.button}
                      onClick={() => fileRef.current?.click()}
                    >
                      上传实验结果
                    </button>
                  </div>
                </Panel>
                <Panel title="近期协作动态">
                  <Timeline items={exp.activities.slice(-4)} />
                </Panel>
              </aside>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const record = await uploadRecord(f, exp.projectId, [
                  { type: '实验', id: exp.id, name: exp.name },
                ]);
                setData((d) => ({
                  ...d,
                  files: [record, ...d.files],
                  experiments: d.experiments.map((x) =>
                    x.id === exp.id
                      ? {
                          ...x,
                          activities: [
                            ...x.activities,
                            activity(`上传文件 ${f.name}`),
                          ],
                        }
                      : x,
                  ),
                }));
                setNotice('文件已保存到实验附件和文件目录');
                loc.set({ tab: 'files' });
              } catch (error) {
                setNotice(String(error));
              }
              e.target.value = '';
            }}
          />
        </>
      ) : (
        <>
          <Header
            title="实验协作"
            description="跟踪实验任务进度与流转，明确责任边界，支持成员协同与过程管理。"
          >
            <button className={s.primary} onClick={() => editExperiment()}>
              <Plus size={17} />
              新建实验任务
            </button>
          </Header>
          <TabBar
            tabs={[
              { key: 'tasks', label: '实验任务进度与流转' },
              { key: 'issues', label: '实验问题与过程协同' },
            ]}
            value={view}
            onChange={(v) => loc.set({ view: v, page: undefined })}
          />
          <Notice message={notice || storageError} />
          <div className={s.filters}>
            <Filter
              label="组织机构"
              value={loc.get('org')}
              options={data.experiments.map((e) => e.org)}
              onChange={(v) => filter('org', v)}
            />
            <Filter
              label="实验类型"
              value={loc.get('type')}
              options={data.experiments.map((e) => e.type)}
              onChange={(v) => filter('type', v)}
            />
            <Filter
              label="任务状态"
              value={loc.get('status')}
              options={[
                '准备中',
                '进行中',
                '待交接',
                '结果处理',
                '已完成',
                '异常',
              ]}
              onChange={(v) => filter('status', v)}
            />
            <Filter
              label="负责人"
              value={loc.get('owner')}
              options={data.experiments.map((e) => e.owner)}
              onChange={(v) => filter('owner', v)}
            />
            <SearchBox
              value={loc.get('q')}
              onChange={(v) => filter('q', v)}
              placeholder="搜索实验任务名称、负责人、编号"
            />
          </div>
          <Stats
            items={[
              {
                label: '实验任务总数',
                value: filtered.length,
                icon: FolderOpen,
                tone: 'rose',
              },
              {
                label: '进行中任务',
                value: filtered.filter((e) => e.status === '进行中').length,
                icon: FlaskConical,
                tone: 'green',
              },
              {
                label: '待交接',
                value: filtered.filter((e) => e.status === '待交接').length,
                icon: Clock,
                tone: 'blue',
              },
              {
                label: '未关闭问题',
                value: issues.filter((i) => i.status !== '已关闭').length,
                icon: TriangleAlert,
                tone: 'orange',
              },
            ]}
          />
          {view === 'tasks' ? (
            <Panel
              title="实验任务列表"
              padded={false}
              actions={<span className={s.sub}>按最近更新排序</span>}
            >
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {[
                        '实验任务',
                        '所属课题',
                        '实验类型',
                        '负责人 / 操作人',
                        '任务状态',
                        '更新时间',
                        '操作',
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.rows.map((e) => (
                      <tr key={e.id}>
                        <td className={s.cellName}>
                          <button
                            className={s.name}
                            onClick={() => loc.open(e.id)}
                          >
                            {e.name}
                          </button>
                          <small className={s.sub}>{e.id}</small>
                        </td>
                        <td style={{ maxWidth: 200 }}>
                          {
                            data.projects.find((p) => p.id === e.projectId)
                              ?.name
                          }
                        </td>
                        <td className={s.nowrap}>{e.type}</td>
                        <td className={s.nowrap}>
                          {e.owner}
                          <small className={s.sub}>操作人：{e.operator}</small>
                        </td>
                        <td>
                          <Badge value={e.status} />
                        </td>
                        <td className={s.nowrap}>{e.updated}</td>
                        <td>
                          <button
                            className={s.link}
                            onClick={() => loc.open(e.id)}
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filtered.length && <Empty />}
              <Pagination
                total={filtered.length}
                page={list.page}
                onChange={(p) => loc.set({ page: String(p) })}
              />
            </Panel>
          ) : (
            <Panel title="实验问题列表" padded={false}>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {[
                        '问题',
                        '关联实验',
                        '风险级别',
                        '责任人',
                        '处理状态',
                        '操作',
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issuePage.rows.map((i) => (
                      <tr key={i.id}>
                        <td className={s.name}>{i.title}</td>
                        <td>{i.experiment.name}</td>
                        <td>
                          <Badge value={i.level} />
                        </td>
                        <td>{i.owner}</td>
                        <td>
                          <Badge value={i.status} />
                        </td>
                        <td>
                          <button
                            className={s.link}
                            onClick={() =>
                              loc.set({
                                detail: i.experiment.id,
                                tab: 'issues',
                              })
                            }
                          >
                            进入问题协同
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!issues.length && <Empty message="暂无匹配的实验问题。" />}
              <Pagination
                total={issues.length}
                page={issuePage.page}
                onChange={(p) => loc.set({ page: String(p) })}
              />
            </Panel>
          )}
        </>
      )}
      {editor && (
        <FormDialog
          key={editor.title}
          title={editor.title}
          fields={editor.fields}
          submit={editor.submit}
          onSubmit={editor.save}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
