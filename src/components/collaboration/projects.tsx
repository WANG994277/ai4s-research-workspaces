'use client';
import { useState } from 'react';
import {
  Plus,
  FolderOpen,
  FlaskConical,
  Flag,
  TriangleAlert,
  Pencil,
  Users,
  ArrowRight,
} from 'lucide-react';
import { activity, timestamp, today, uid, type ResearchProject } from './model';
import {
  s,
  Header,
  TabBar,
  Panel,
  Badge,
  Tags,
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
} from './shared';
type Editor = {
  title: string;
  fields: FormField[];
  save: (v: Record<string, string>) => void | string;
};
export function CollaborationProjects() {
  const { data, setData, ready, storageError } = useCollaborationData();
  const loc = useLocation();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState('');
  const detail = loc.get('detail');
  const project = data.projects.find((p) => p.id === detail);
  const view = loc.get('view', 'spaces');
  const tab = loc.get('tab', 'basic');
  const filter = (key: string, value: string) =>
    loc.set({ [key]: value, page: undefined }, true);
  const filtered = data.projects
    .filter(
      (p) =>
        (!loc.get('org') || p.org === loc.get('org')) &&
        (!loc.get('direction') || p.direction === loc.get('direction')) &&
        (!loc.get('status') || p.status === loc.get('status')) &&
        `${p.name} ${p.owner} ${p.tags.join(' ')}`
          .toLowerCase()
          .includes(loc.get('q').toLowerCase()),
    )
    .sort((a, b) => b.updated.localeCompare(a.updated));
  const list = pageSlice(filtered, loc.get('page'));
  const allTasks = filtered.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, project: p })),
  );
  const tasks = pageSlice(allTasks, loc.get('page'));
  const patch = (
    id: string,
    fn: (p: ResearchProject) => ResearchProject,
    message: string,
  ) => {
    setData((d) => ({
      ...d,
      projects: d.projects.map((p) =>
        p.id === id
          ? {
              ...fn(p),
              updated: today,
              activities: [...p.activities, activity(message)],
            }
          : p,
      ),
    }));
    setNotice(message);
  };
  function editProject(p?: ResearchProject) {
    setEditor({
      title: p ? '编辑课题信息' : '新建课题空间',
      fields: [
        {
          key: 'name',
          label: '课题名称',
          required: true,
          wide: true,
          value: p?.name,
        },
        { key: 'owner', label: '负责人', required: true, value: p?.owner },
        { key: 'org', label: '组织机构', required: true, value: p?.org },
        {
          key: 'direction',
          label: '研究方向',
          type: 'select',
          options: ['油气勘探', '催化化学', '新材料', '腐蚀防护'],
          value: p?.direction,
        },
        {
          key: 'status',
          label: '课题状态',
          type: 'select',
          options: ['规划中', '在研', '已结题'],
          value: p?.status,
        },
        {
          key: 'start',
          label: '开始日期',
          type: 'date',
          required: true,
          value: p?.start ?? today,
        },
        {
          key: 'end',
          label: '结束日期',
          type: 'date',
          required: true,
          value: p?.end,
        },
        {
          key: 'managementId',
          label: '关联科技管理项目主键',
          value: p?.managementId,
          wide: true,
        },
        {
          key: 'description',
          label: '课题简介',
          type: 'textarea',
          required: true,
          value: p?.description,
        },
      ],
      save: (v) => {
        if (v.end < v.start) return '结束日期不能早于开始日期。';
        if (
          v.managementId &&
          data.projects.some(
            (x) => x.id !== p?.id && x.managementId === v.managementId,
          )
        )
          return '该科技管理项目主键已关联其他课题。';
        if (p) patch(p.id, (x) => ({ ...x, ...v }), '更新了课题基础信息');
        else {
          const id = uid('PROJ');
          setData((d) => ({
            ...d,
            projects: [
              {
                name: v.name,
                owner: v.owner,
                org: v.org,
                direction: v.direction,
                status: v.status,
                start: v.start,
                end: v.end,
                managementId: v.managementId,
                description: v.description,
                id,
                tags: [v.direction],
                members: [
                  {
                    name: v.owner,
                    role: '课题负责人',
                    responsibility: '总体组织与课题管理',
                  },
                ],
                milestones: [],
                tasks: [],
                folders: ['文档', '笔记', '数据', '报告'],
                activities: [activity('创建了课题空间')],
                updated: today,
              },
              ...d.projects,
            ],
          }));
          loc.open(id);
          setNotice('课题空间已创建');
        }
        setEditor(null);
      },
    });
  }
  function addMember() {
    if (!project) return;
    setEditor({
      title: '添加课题成员',
      fields: [
        { key: 'name', label: '成员姓名', required: true },
        {
          key: 'role',
          label: '课题角色',
          type: 'select',
          options: ['科研人员', '实验操作人', '专家评审人', '课题负责人'],
        },
        {
          key: 'responsibility',
          label: '职责范围',
          type: 'textarea',
          required: true,
        },
      ],
      save: (v) => {
        if (project.members.some((m) => m.name === v.name))
          return '该成员已在课题中。';
        patch(
          project.id,
          (p) => ({
            ...p,
            members: [
              ...p.members,
              { name: v.name, role: v.role, responsibility: v.responsibility },
            ],
          }),
          `添加课题成员 ${v.name}`,
        );
        setEditor(null);
      },
    });
  }
  function addMilestone() {
    if (!project) return;
    setEditor({
      title: '新增里程碑',
      fields: [
        { key: 'name', label: '里程碑名称', required: true, wide: true },
        { key: 'due', label: '计划日期', type: 'date', required: true },
        {
          key: 'status',
          label: '状态',
          type: 'select',
          options: ['未开始', '进行中', '已完成'],
        },
      ],
      save: (v) => {
        patch(
          project.id,
          (p) => ({
            ...p,
            milestones: [
              ...p.milestones,
              { id: uid('MS'), name: v.name, due: v.due, status: v.status },
            ],
          }),
          `新增里程碑 ${v.name}`,
        );
        setEditor(null);
      },
    });
  }
  function addTask() {
    if (!project) return;
    setEditor({
      title: '分派科研任务',
      fields: [
        { key: 'name', label: '任务名称', required: true, wide: true },
        {
          key: 'owner',
          label: '责任人',
          type: 'select',
          options: project.members.map((m) => m.name),
          required: true,
        },
        { key: 'due', label: '截止日期', type: 'date', required: true },
        { key: 'risk', label: '风险及行动要求', type: 'textarea' },
      ],
      save: (v) => {
        patch(
          project.id,
          (p) => ({
            ...p,
            tasks: [
              ...p.tasks,
              {
                id: uid('TASK'),
                name: v.name,
                owner: v.owner,
                due: v.due,
                status: '未开始',
                risk: v.risk,
              },
            ],
          }),
          `向 ${v.owner} 分派任务 ${v.name}`,
        );
        setEditor(null);
      },
    });
  }
  const tabs = [
    { key: 'basic', label: '基本信息' },
    { key: 'members', label: `成员与角色 (${project?.members.length ?? 0})` },
    { key: 'milestones', label: '里程碑' },
    { key: 'tasks', label: '任务与进展' },
    { key: 'config', label: '基础配置' },
  ];
  if (!ready && loc.get('detail') && !storageError)
    return (
      <div className={s.root} aria-busy="true">
        <Notice message="正在读取协作记录…" />
      </div>
    );
  if (detail && !project)
    return (
      <div className={s.root}>
        <Header title="课题不存在" back={loc.back} />
        <Empty message="课题已变更或地址无效，请返回列表重新选择。" />
      </div>
    );
  return (
    <div className={s.root}>
      {project ? (
        <>
          <Header
            title={project.name}
            description={`${project.id} · 负责人：${project.owner} · ${project.org}`}
            back={loc.back}
            trail="课题列表"
          >
            <Badge value={project.status} />
            <button className={s.button} onClick={() => editProject(project)}>
              <Pencil size={14} />
              编辑课题
            </button>
          </Header>
          <TabBar
            tabs={tabs}
            value={tab}
            onChange={(t) => loc.set({ tab: t })}
          />
          <Notice message={notice || storageError} />
          <div className={tab === 'basic' ? s.detailGrid : undefined}>
            <div className={s.stack}>
              {tab === 'basic' && (
                <>
                  <Panel title="课题基本信息">
                    <Metadata
                      items={[
                        {
                          label: '课题简介',
                          value: project.description,
                          wide: true,
                        },
                        { label: '研究方向', value: project.direction },
                        {
                          label: '研究周期',
                          value: `${project.start} 至 ${project.end}`,
                        },
                        {
                          label: '关联科技管理项目主键',
                          value: project.managementId,
                        },
                        { label: '更新日期', value: project.updated },
                        {
                          label: '课题标签',
                          value: <Tags values={project.tags} />,
                          wide: true,
                        },
                      ]}
                    />
                  </Panel>
                  <Panel
                    title="阶段里程碑"
                    actions={
                      <button
                        className={s.link}
                        onClick={() => loc.set({ tab: 'milestones' })}
                      >
                        管理全部里程碑 →
                      </button>
                    }
                  >
                    <div className={s.steps}>
                      {project.milestones.slice(0, 5).map((m, i) => (
                        <div
                          className={`${s.step} ${m.status === '已完成' ? s.stepDone : ''}`}
                          key={m.id}
                        >
                          <span className={s.stepCircle}>
                            {m.status === '已完成' ? '✓' : i + 1}
                          </span>
                          <p>{m.name}</p>
                          <small className={s.sub}>{m.due}</small>
                        </div>
                      ))}
                    </div>
                    {!project.milestones.length && (
                      <Empty message="暂无里程碑，可按课题计划新增。" />
                    )}
                  </Panel>
                </>
              )}
              {tab === 'members' && (
                <Panel
                  title="成员与责任分工"
                  padded={false}
                  actions={
                    <button className={s.primary} onClick={addMember}>
                      <Plus size={14} />
                      添加成员
                    </button>
                  }
                >
                  <div className={s.tableScroll}>
                    <table className={s.table}>
                      <thead>
                        <tr>
                          <th>成员</th>
                          <th>课题角色</th>
                          <th>责任范围</th>
                          <th>操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.members.map((m, i) => (
                          <tr key={m.name}>
                            <td>
                              <div className={s.fileName}>
                                <span
                                  className={s.avatar}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    fontSize: 12,
                                  }}
                                >
                                  {m.name[0]}
                                </span>
                                {m.name}
                              </div>
                            </td>
                            <td>
                              <Badge value={m.role} />
                            </td>
                            <td>{m.responsibility}</td>
                            <td>
                              <button
                                className={s.link}
                                onClick={() =>
                                  setEditor({
                                    title: '设置课题角色与职责',
                                    fields: [
                                      {
                                        key: 'role',
                                        label: '角色',
                                        type: 'select',
                                        options: [
                                          '课题负责人',
                                          '科研人员',
                                          '实验操作人',
                                          '专家评审人',
                                        ],
                                        value: m.role,
                                      },
                                      {
                                        key: 'responsibility',
                                        label: '职责范围',
                                        type: 'textarea',
                                        required: true,
                                        value: m.responsibility,
                                      },
                                    ],
                                    save: (v) => {
                                      patch(
                                        project.id,
                                        (p) => ({
                                          ...p,
                                          members: p.members.map((x, j) =>
                                            j === i ? { ...x, ...v } : x,
                                          ),
                                        }),
                                        `更新 ${m.name} 的课题分工`,
                                      );
                                      setEditor(null);
                                    },
                                  })
                                }
                              >
                                设置角色
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
              {tab === 'milestones' && (
                <Panel
                  title="里程碑计划"
                  padded={false}
                  actions={
                    <button className={s.primary} onClick={addMilestone}>
                      <Plus size={14} />
                      新增里程碑
                    </button>
                  }
                >
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>里程碑</th>
                        <th>计划日期</th>
                        <th>状态</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.milestones.map((m) => (
                        <tr key={m.id}>
                          <td className={s.name}>{m.name}</td>
                          <td>{m.due}</td>
                          <td>
                            <Badge value={m.status} />
                          </td>
                          <td>
                            <button
                              className={s.link}
                              onClick={() =>
                                setEditor({
                                  title: '维护里程碑',
                                  fields: [
                                    {
                                      key: 'name',
                                      label: '名称',
                                      value: m.name,
                                      required: true,
                                    },
                                    {
                                      key: 'due',
                                      label: '计划日期',
                                      value: m.due,
                                      type: 'date',
                                      required: true,
                                    },
                                    {
                                      key: 'status',
                                      label: '状态',
                                      type: 'select',
                                      value: m.status,
                                      options: ['未开始', '进行中', '已完成'],
                                    },
                                  ],
                                  save: (v) => {
                                    patch(
                                      project.id,
                                      (p) => ({
                                        ...p,
                                        milestones: p.milestones.map((x) =>
                                          x.id === m.id ? { ...x, ...v } : x,
                                        ),
                                      }),
                                      `更新里程碑 ${m.name}`,
                                    );
                                    setEditor(null);
                                  },
                                })
                              }
                            >
                              编辑
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!project.milestones.length && <Empty />}
                </Panel>
              )}
              {tab === 'tasks' && (
                <Panel
                  title="科研任务、进展与风险"
                  padded={false}
                  actions={
                    <button className={s.primary} onClick={addTask}>
                      <Plus size={14} />
                      分派任务
                    </button>
                  }
                >
                  <div className={s.tableScroll}>
                    <table className={s.table}>
                      <thead>
                        <tr>
                          {[
                            '任务',
                            '责任人',
                            '截止日期',
                            '状态',
                            '风险与行动项',
                            '操作',
                          ].map((h) => (
                            <th key={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {project.tasks.map((t) => (
                          <tr key={t.id}>
                            <td className={s.cellName}>
                              <span className={s.name}>{t.name}</span>
                              <small className={s.sub}>{t.id}</small>
                            </td>
                            <td>{t.owner}</td>
                            <td>{t.due}</td>
                            <td>
                              <Badge value={t.status} />
                            </td>
                            <td>{t.risk || '无'}</td>
                            <td>
                              <button
                                className={s.link}
                                onClick={() =>
                                  setEditor({
                                    title: '更新任务进展',
                                    fields: [
                                      {
                                        key: 'owner',
                                        label: '责任人',
                                        value: t.owner,
                                        type: 'select',
                                        options: project.members.map(
                                          (m) => m.name,
                                        ),
                                      },
                                      {
                                        key: 'status',
                                        label: '状态',
                                        type: 'select',
                                        value: t.status,
                                        options: [
                                          '未开始',
                                          '进行中',
                                          '已完成',
                                          '需关注',
                                        ],
                                      },
                                      {
                                        key: 'risk',
                                        label: '风险与行动项',
                                        type: 'textarea',
                                        value: t.risk,
                                      },
                                    ],
                                    save: (v) => {
                                      patch(
                                        project.id,
                                        (p) => ({
                                          ...p,
                                          tasks: p.tasks.map((x) =>
                                            x.id === t.id ? { ...x, ...v } : x,
                                          ),
                                        }),
                                        `更新任务 ${t.name}`,
                                      );
                                      setEditor(null);
                                    },
                                  })
                                }
                              >
                                更新进展
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {!project.tasks.length && (
                    <Empty message="暂无任务，点击“分派任务”明确下一步工作。" />
                  )}
                </Panel>
              )}
              {tab === 'config' && (
                <Panel
                  title="课题基础配置"
                  actions={
                    <button
                      className={s.button}
                      onClick={() =>
                        setEditor({
                          title: '维护课题配置',
                          fields: [
                            {
                              key: 'managementId',
                              label: '科技管理项目主键',
                              value: project.managementId,
                              wide: true,
                            },
                            {
                              key: 'tags',
                              label: '课题标签（逗号分隔）',
                              value: project.tags.join('，'),
                              wide: true,
                            },
                            {
                              key: 'folders',
                              label: '文档目录（逗号分隔）',
                              value: project.folders.join('，'),
                              wide: true,
                            },
                          ],
                          save: (v) => {
                            patch(
                              project.id,
                              (p) => ({
                                ...p,
                                managementId: v.managementId,
                                tags: v.tags
                                  .split(/[,，]/)
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                                folders: v.folders
                                  .split(/[,，]/)
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              }),
                              '更新了项目关联、标签和目录配置',
                            );
                            setEditor(null);
                          },
                        })
                      }
                    >
                      编辑配置
                    </button>
                  }
                >
                  <p className={s.sectionIntro}>
                    这里只维护课题空间的业务配置；平台组织和系统权限由外部基础支撑系统管理。
                  </p>
                  <Metadata
                    items={[
                      {
                        label: '关联科技管理项目主键',
                        value: project.managementId,
                        wide: true,
                      },
                      {
                        label: '课题标签',
                        value: <Tags values={project.tags} />,
                        wide: true,
                      },
                      {
                        label: '默认文档目录',
                        value: project.folders.join(' / '),
                        wide: true,
                      },
                    ]}
                  />
                </Panel>
              )}
            </div>
            {tab === 'basic' && (
              <aside className={s.stack}>
                <Panel title="课题操作">
                  <div className={s.stack}>
                    <button
                      className={s.button}
                      onClick={() => {
                        loc.set({ tab: 'members' });
                        addMember();
                      }}
                    >
                      <Users size={14} />
                      添加课题成员
                    </button>
                    <button
                      className={s.button}
                      onClick={() => {
                        loc.set({ tab: 'tasks' });
                        addTask();
                      }}
                    >
                      分派科研任务
                    </button>
                    <button
                      className={s.button}
                      onClick={() => loc.set({ tab: 'config' })}
                    >
                      关联科技管理项目
                    </button>
                  </div>
                </Panel>
                <Panel title="协作动态">
                  <Timeline items={project.activities.slice(-5)} />
                </Panel>
              </aside>
            )}
          </div>
        </>
      ) : (
        <>
          <Header
            title="课题协作"
            description="构建开放协同的科研空间，汇聚团队智慧，推动创新成果高效产出。"
          >
            <button className={s.primary} onClick={() => editProject()}>
              <Plus size={17} />
              新建课题空间
            </button>
          </Header>
          <TabBar
            tabs={[
              { key: 'spaces', label: '课题空间与组织管理' },
              { key: 'progress', label: '科研任务、进展与风险协作' },
            ]}
            value={view}
            onChange={(v) => loc.set({ view: v, page: undefined })}
          />
          <Notice message={notice || storageError} />
          <div className={s.filters}>
            <Filter
              label="组织机构"
              value={loc.get('org')}
              options={data.projects.map((p) => p.org)}
              onChange={(v) => filter('org', v)}
            />
            <Filter
              label="研究方向"
              value={loc.get('direction')}
              options={data.projects.map((p) => p.direction)}
              onChange={(v) => filter('direction', v)}
            />
            <Filter
              label="课题状态"
              value={loc.get('status')}
              options={['规划中', '在研', '已结题']}
              onChange={(v) => filter('status', v)}
            />
            <SearchBox value={loc.get('q')} onChange={(v) => filter('q', v)} />
          </div>
          <Stats
            items={[
              {
                label: '课题总数',
                value: filtered.length,
                icon: FolderOpen,
                tone: 'rose',
              },
              {
                label: '在研课题',
                value: filtered.filter((p) => p.status === '在研').length,
                icon: FlaskConical,
                tone: 'green',
              },
              {
                label: '本月里程碑',
                value: filtered
                  .flatMap((p) => p.milestones)
                  .filter((m) => m.due.startsWith('2026-09')).length,
                icon: Flag,
                tone: 'blue',
              },
              {
                label: '风险事项',
                value: allTasks.filter((t) => t.risk && t.status !== '已完成')
                  .length,
                icon: TriangleAlert,
                tone: 'orange',
              },
            ]}
          />
          {view === 'spaces' ? (
            <Panel
              title="课题空间列表"
              padded={false}
              actions={<span className={s.sub}>按最近更新排序</span>}
            >
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {[
                        '课题名称',
                        '组织机构 / 研究方向',
                        '负责人',
                        '成员',
                        '课题状态',
                        '更新日期',
                        '操作',
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.rows.map((p) => (
                      <tr key={p.id}>
                        <td className={s.cellName}>
                          <button
                            className={s.name}
                            onClick={() => loc.open(p.id)}
                          >
                            {p.name}
                          </button>
                          <small className={s.sub}>{p.managementId}</small>
                        </td>
                        <td>
                          {p.org}
                          <small className={s.sub}>{p.direction}</small>
                        </td>
                        <td className={s.nowrap}>{p.owner}</td>
                        <td>{p.members.length}</td>
                        <td>
                          <Badge value={p.status} />
                        </td>
                        <td className={s.nowrap}>{p.updated}</td>
                        <td>
                          <button
                            className={s.link}
                            onClick={() => loc.open(p.id)}
                          >
                            进入课题{' '}
                            <ArrowRight
                              size={12}
                              style={{ display: 'inline' }}
                            />
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
            <Panel title="跨课题科研任务" padded={false}>
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {[
                        '任务名称',
                        '所属课题',
                        '责任人',
                        '截止日期',
                        '状态',
                        '风险与行动项',
                        '操作',
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.rows.map((t) => (
                      <tr key={t.id}>
                        <td className={s.name}>{t.name}</td>
                        <td>{t.project.name}</td>
                        <td>{t.owner}</td>
                        <td>{t.due}</td>
                        <td>
                          <Badge value={t.status} />
                        </td>
                        <td>{t.risk || '无'}</td>
                        <td>
                          <button
                            className={s.link}
                            onClick={() =>
                              loc.set({ detail: t.project.id, tab: 'tasks' })
                            }
                          >
                            查看任务
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!allTasks.length && <Empty />}
              <Pagination
                total={allTasks.length}
                page={tasks.page}
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
          onSubmit={editor.save}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
