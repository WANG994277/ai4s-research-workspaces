'use client';
import { useState } from 'react';
import {
  Plus,
  Users,
  FlaskConical,
  Flag,
  CheckCircle2,
  Star,
  RefreshCw,
  List,
  LayoutGrid,
  Pencil,
} from 'lucide-react';
import { today, timestamp, uid, type Expert } from './model';
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
  Metadata,
  FormDialog,
  type FormField,
  useCollaborationData,
  useLocation,
  projectOptions,
} from './shared';
type Editor = {
  title: string;
  description?: string;
  fields: FormField[];
  submit?: string;
  save: (v: Record<string, string>) => void | string;
};
export function CollaborationExperts() {
  const { data, setData, ready, storageError } = useCollaborationData();
  const loc = useLocation();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState('');
  const [batch, setBatch] = useState(0);
  const detail = loc.get('detail');
  const expert = data.experts.find((e) => e.id === detail);
  const consultation = data.consultations.find((c) => c.id === detail);
  const view = loc.get('view', 'directory');
  const tab = loc.get('tab', 'basic');
  const layout = loc.get('layout', 'cards');
  const filter = (key: string, value: string) =>
    loc.set({ [key]: value, page: undefined }, true);
  const filtered = data.experts.filter(
    (e) =>
      (!loc.get('field') || e.field === loc.get('field')) &&
      (!loc.get('org') || e.org === loc.get('org')) &&
      (!loc.get('direction') || e.directions.includes(loc.get('direction'))) &&
      (!loc.get('service') || e.services.includes(loc.get('service'))) &&
      (!loc.get('status') || e.status === loc.get('status')) &&
      `${e.name} ${e.bio} ${e.directions.join(' ')}`.includes(loc.get('q')),
  );
  const list = pageSlice(filtered, loc.get('page'), 4);
  const consultations = data.consultations.filter(
    (c) =>
      `${c.title} ${data.experts.find((e) => e.id === c.expertId)?.name}`.includes(
        loc.get('q'),
      ) &&
      (!loc.get('requestStatus') || c.status === loc.get('requestStatus')),
  );
  const requests = pageSlice(consultations, loc.get('page'));
  const available = filtered.filter((e) => e.status !== '暂不可约');
  const recommended = available.length
    ? [...available, ...available].slice(
        batch % available.length,
        (batch % available.length) + Math.min(3, available.length),
      )
    : [];
  const patch = (id: string, fn: (e: Expert) => Expert, msg: string) => {
    setData((d) => ({
      ...d,
      experts: d.experts.map((e) => (e.id === id ? fn(e) : e)),
    }));
    setNotice(msg);
  };
  function request(target?: Expert) {
    if (target?.status === '暂不可约')
      return setNotice('该专家暂不可约，可先收藏档案。');
    const options = data.experts.filter((e) => e.status !== '暂不可约');
    if (!options.length) return setNotice('当前没有可咨询专家。');
    setEditor({
      title: '发起专家咨询',
      description:
        '填写需求并形成咨询申请。当前为本地协作原型，未向真实专家发送消息。',
      submit: '保存咨询申请',
      fields: [
        {
          key: 'expert',
          label: '咨询专家',
          type: 'select',
          options: options.map((e) => e.name),
          value: target?.name,
          required: true,
        },
        {
          key: 'project',
          label: '关联课题',
          type: 'select',
          options: projectOptions(data),
          required: true,
        },
        { key: 'title', label: '咨询主题', required: true, wide: true },
        {
          key: 'service',
          label: '服务类型',
          type: 'select',
          options: ['技术咨询', '项目评审', '方案论证'],
        },
        { key: 'due', label: '期望完成日期', type: 'date', required: true },
        {
          key: 'description',
          label: '问题背景与资料说明',
          type: 'textarea',
          required: true,
        },
        {
          key: 'expected',
          label: '预期成果',
          type: 'textarea',
          required: true,
        },
      ],
      save: (v) => {
        const e = data.experts.find((e) => e.name === v.expert);
        const p = data.projects.find((p) => p.name === v.project);
        if (!e || !p) return '请选择专家与课题。';
        if (!e.services.includes(v.service))
          return '该专家未开放此服务类型，请选择其可服务范围内的类型。';
        const id = uid('CONSULT');
        setData((d) => ({
          ...d,
          consultations: [
            {
              id,
              expertId: e.id,
              projectId: p.id,
              title: v.title,
              service: v.service,
              due: v.due,
              description: v.description,
              expected: v.expected,
              status: '待受理',
              created: today,
              messages: [
                {
                  actor: '张博士',
                  content: '创建咨询申请，等待受理结果',
                  time: timestamp(),
                },
              ],
              result: '',
              rating: '',
              feedback: '',
            },
            ...d.consultations,
          ],
        }));
        setEditor(null);
        loc.set({ view: 'consultations', detail: id, tab: 'basic' });
        setNotice('咨询申请已保存为待受理');
      },
    });
  }
  function editExpert(e: Expert) {
    setEditor({
      title: '维护专家档案',
      fields: [
        { key: 'name', label: '专家姓名', required: true, value: e.name },
        { key: 'title', label: '职称', required: true, value: e.title },
        { key: 'org', label: '所属机构', required: true, value: e.org },
        { key: 'field', label: '专业领域', required: true, value: e.field },
        {
          key: 'directions',
          label: '研究方向（逗号分隔）',
          value: e.directions.join('，'),
          wide: true,
        },
        {
          key: 'services',
          label: '服务类型（逗号分隔）',
          value: e.services.join('，'),
          wide: true,
        },
        {
          key: 'status',
          label: '可合作状态',
          type: 'select',
          options: ['可咨询', '需预约', '暂不可约'],
          value: e.status,
        },
        {
          key: 'bio',
          label: '个人简介',
          type: 'textarea',
          value: e.bio,
          required: true,
        },
        {
          key: 'achievements',
          label: '代表成果（每行一项）',
          type: 'textarea',
          value: e.achievements.join('\n'),
        },
        {
          key: 'experience',
          label: '工作经历（每行一项）',
          type: 'textarea',
          value: e.experience.join('\n'),
        },
        {
          key: 'conditions',
          label: '合作条件',
          type: 'textarea',
          value: e.conditions,
        },
      ],
      save: (v) => {
        patch(
          e.id,
          (x) => ({
            ...x,
            name: v.name,
            title: v.title,
            org: v.org,
            field: v.field,
            status: v.status,
            bio: v.bio,
            directions: v.directions.split(/[,，]/).filter(Boolean),
            services: v.services.split(/[,，]/).filter(Boolean),
            achievements: v.achievements.split('\n').filter(Boolean),
            experience: v.experience.split('\n').filter(Boolean),
            conditions: v.conditions,
          }),
          '专家档案已更新',
        );
        setEditor(null);
      },
    });
  }
  const requestExpert = data.experts.find(
    (e) => e.id === consultation?.expertId,
  );
  if (!ready && loc.get('detail') && !storageError)
    return (
      <div className={s.root} aria-busy="true">
        <Notice message="正在读取协作记录…" />
      </div>
    );
  if (detail && !expert && !consultation)
    return (
      <div className={s.root}>
        <Header title="记录不存在" back={loc.back} />
        <Empty />
      </div>
    );
  return (
    <div className={s.root}>
      {consultation ? (
        <>
          <Header
            title={consultation.title}
            description={`${consultation.id} · 咨询专家：${requestExpert?.name} · ${consultation.service}`}
            back={loc.back}
            trail="咨询记录"
          >
            <Badge value={consultation.status} />
            {consultation.status === '待受理' && (
              <button
                className={s.button}
                onClick={() => {
                  setData((d) => ({
                    ...d,
                    consultations: d.consultations.map((c) =>
                      c.id === consultation.id
                        ? {
                            ...c,
                            status: '沟通中',
                            messages: [
                              ...c.messages,
                              {
                                actor: requestExpert?.name ?? '专家',
                                content: '受理咨询申请，进入需求沟通',
                                time: timestamp(),
                              },
                            ],
                          }
                        : c,
                    ),
                  }));
                  setNotice('已记录专家受理结果（本地演示）');
                }}
              >
                记录受理结果
              </button>
            )}
          </Header>
          <TabBar
            tabs={[
              { key: 'basic', label: '咨询需求' },
              { key: 'communication', label: '服务协同' },
              { key: 'feedback', label: '成果与反馈' },
            ]}
            value={tab}
            onChange={(t) => loc.set({ tab: t })}
          />
          <Notice message={notice || storageError} />
          {tab === 'basic' && (
            <Panel title="咨询申请详情">
              <Metadata
                items={[
                  {
                    label: '咨询专家',
                    value: (
                      <button
                        className={s.link}
                        onClick={() =>
                          loc.set({ detail: requestExpert?.id, tab: 'basic' })
                        }
                      >
                        {requestExpert?.name} · 查看档案
                      </button>
                    ),
                  },
                  {
                    label: '关联课题',
                    value: data.projects.find(
                      (p) => p.id === consultation.projectId,
                    )?.name,
                  },
                  { label: '申请日期', value: consultation.created },
                  { label: '期望完成日期', value: consultation.due },
                  {
                    label: '问题背景',
                    value: consultation.description,
                    wide: true,
                  },
                  {
                    label: '预期成果',
                    value: consultation.expected,
                    wide: true,
                  },
                ]}
              />
              {consultation.status === '待受理' && (
                <button
                  style={{ marginTop: 24 }}
                  className={s.button}
                  onClick={() => {
                    setData((d) => ({
                      ...d,
                      consultations: d.consultations.map((c) =>
                        c.id === consultation.id
                          ? {
                              ...c,
                              status: '已撤回',
                              messages: [
                                ...c.messages,
                                {
                                  actor: '张博士',
                                  content: '撤回咨询申请',
                                  time: timestamp(),
                                },
                              ],
                            }
                          : c,
                      ),
                    }));
                    setNotice('申请已撤回，记录仍保留。');
                  }}
                >
                  撤回申请
                </button>
              )}
            </Panel>
          )}
          {tab === 'communication' && (
            <Panel
              title="咨询沟通与服务记录"
              actions={
                consultation.status === '沟通中' ? (
                  <button
                    className={s.primary}
                    onClick={() =>
                      setEditor({
                        title: '记录咨询成果',
                        fields: [
                          {
                            key: 'result',
                            label: '咨询结论、成果内容与附件说明',
                            type: 'textarea',
                            required: true,
                          },
                        ],
                        save: (v) => {
                          setData((d) => ({
                            ...d,
                            consultations: d.consultations.map((c) =>
                              c.id === consultation.id
                                ? {
                                    ...c,
                                    status: '已完成',
                                    result: v.result,
                                    messages: [
                                      ...c.messages,
                                      {
                                        actor: requestExpert?.name ?? '专家',
                                        content: '提交咨询成果，服务完成',
                                        time: timestamp(),
                                      },
                                    ],
                                  }
                                : c,
                            ),
                          }));
                          setEditor(null);
                          loc.set({ tab: 'feedback' });
                          setNotice('咨询成果已记录，可填写服务评价。');
                        },
                      })
                    }
                  >
                    记录成果并完成
                  </button>
                ) : undefined
              }
            >
              {consultation.messages.map((m, i) => (
                <div className={s.comment} key={i}>
                  <strong>{m.actor}</strong>
                  <span className={s.sub}>{m.time}</span>
                  <p>{m.content}</p>
                </div>
              ))}
              {!['已撤回', '已完成'].includes(consultation.status) && (
                <button
                  className={s.button}
                  style={{ marginTop: 16 }}
                  onClick={() =>
                    setEditor({
                      title: '补充沟通记录',
                      fields: [
                        {
                          key: 'content',
                          label: '沟通内容、补充材料与共识',
                          type: 'textarea',
                          required: true,
                        },
                      ],
                      save: (v) => {
                        setData((d) => ({
                          ...d,
                          consultations: d.consultations.map((c) =>
                            c.id === consultation.id
                              ? {
                                  ...c,
                                  messages: [
                                    ...c.messages,
                                    {
                                      actor: '张博士',
                                      content: v.content,
                                      time: timestamp(),
                                    },
                                  ],
                                }
                              : c,
                          ),
                        }));
                        setEditor(null);
                        setNotice('沟通记录已保存');
                      },
                    })
                  }
                >
                  保存沟通记录
                </button>
              )}
            </Panel>
          )}
          {tab === 'feedback' && (
            <Panel title="咨询成果与服务反馈">
              {consultation.result ? (
                <>
                  <h3 className={s.panelTitle}>服务成果</h3>
                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: 14,
                      lineHeight: 1.9,
                      margin: '16px 0 24px',
                    }}
                  >
                    {consultation.result}
                  </p>
                  <Metadata
                    items={[
                      {
                        label: '满意度',
                        value: consultation.rating || '尚未评价',
                      },
                      {
                        label: '反馈意见',
                        value: consultation.feedback || '尚未填写',
                      },
                    ]}
                  />
                  <button
                    className={s.primary}
                    style={{ marginTop: 24 }}
                    onClick={() =>
                      setEditor({
                        title: '评价专家服务',
                        fields: [
                          {
                            key: 'rating',
                            label: '满意度',
                            type: 'select',
                            options: [
                              '5 分 · 很满意',
                              '4 分 · 满意',
                              '3 分 · 一般',
                              '2 分 · 待改进',
                              '1 分 · 不满意',
                            ],
                            required: true,
                            value: consultation.rating || undefined,
                          },
                          {
                            key: 'feedback',
                            label: '反馈意见',
                            type: 'textarea',
                            required: true,
                            value: consultation.feedback,
                          },
                        ],
                        save: (v) => {
                          setData((d) => ({
                            ...d,
                            consultations: d.consultations.map((c) =>
                              c.id === consultation.id
                                ? {
                                    ...c,
                                    rating: v.rating,
                                    feedback: v.feedback,
                                  }
                                : c,
                            ),
                          }));
                          setEditor(null);
                          setNotice('服务评价已保存');
                        },
                      })
                    }
                  >
                    {consultation.rating ? '修改评价' : '填写服务评价'}
                  </button>
                </>
              ) : (
                <Empty message="服务完成并记录成果后，可填写评价与反馈。" />
              )}
            </Panel>
          )}
        </>
      ) : expert ? (
        <>
          <Header
            title={`${expert.name} · ${expert.title}`}
            description={`${expert.org} · ${expert.field}`}
            back={loc.back}
            trail={view === 'consultations' ? '咨询记录' : '专家目录'}
          >
            <button className={s.button} onClick={() => editExpert(expert)}>
              <Pencil size={14} />
              维护档案
            </button>
            <button
              className={s.button}
              onClick={() =>
                patch(
                  expert.id,
                  (e) => ({ ...e, favorite: !e.favorite }),
                  expert.favorite ? '已取消收藏' : '已收藏专家',
                )
              }
            >
              <Star
                size={14}
                fill={expert.favorite ? 'currentColor' : 'none'}
              />
              {expert.favorite ? '已收藏' : '收藏专家'}
            </button>
            <button
              className={s.primary}
              disabled={expert.status === '暂不可约'}
              onClick={() => request(expert)}
            >
              发起咨询
            </button>
          </Header>
          <Panel>
            <div className={s.expertHead}>
              <span className={`${s.avatar} ${s.avatarLarge}`}>
                {expert.name[0]}
              </span>
              <div className={s.stack} style={{ gap: 10 }}>
                <div className={s.actions}>
                  <strong style={{ fontSize: 18 }}>{expert.name}</strong>
                  <Badge value={expert.status} />
                </div>
                <Tags values={expert.directions} />
              </div>
            </div>
          </Panel>
          <TabBar
            tabs={[
              { key: 'basic', label: '基本信息' },
              { key: 'achievements', label: '代表成果' },
              { key: 'experience', label: '工作经历' },
              { key: 'services', label: '可服务范围' },
              { key: 'conditions', label: '合作条件' },
            ]}
            value={tab}
            onChange={(t) => loc.set({ tab: t })}
          />
          <Notice message={notice || storageError} />
          {tab === 'basic' && (
            <Panel title="专家基本信息">
              <Metadata
                items={[
                  { label: '所属机构', value: expert.org },
                  { label: '专业领域', value: expert.field },
                  {
                    label: '研究方向',
                    value: <Tags values={expert.directions} />,
                    wide: true,
                  },
                  { label: '个人简介', value: expert.bio, wide: true },
                  {
                    label: '档案说明',
                    value:
                      '用于原型展示的示例专家资料；咨询通过服务记录进行跟踪。',
                    wide: true,
                  },
                ]}
              />
            </Panel>
          )}
          {tab === 'achievements' && (
            <Panel title="代表成果">
              {expert.achievements.map((a, i) => (
                <div className={s.comment} key={i}>
                  <div className={s.actions}>
                    <span className={`${s.badge} ${s.badgeOrange}`}>
                      {i + 1}
                    </span>
                    <strong>{a}</strong>
                  </div>
                  <small className={s.sub}>示例成果条目 · {expert.org}</small>
                </div>
              ))}
            </Panel>
          )}
          {tab === 'experience' && (
            <Panel title="工作与研究经历">
              {expert.experience.map((e, i) => (
                <div key={i} className={s.comment}>
                  {e}
                </div>
              ))}
            </Panel>
          )}
          {tab === 'services' && (
            <Panel title="可服务范围">
              <div className={s.tags}>
                {expert.services.map((service) => (
                  <div
                    key={service}
                    style={{
                      minWidth: 220,
                      padding: 20,
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                    }}
                  >
                    <h3 className={s.panelTitle}>{service}</h3>
                    <p className={s.sectionIntro} style={{ marginTop: 10 }}>
                      支持 {expert.directions.slice(0, 2).join('、')} 相关需求。
                    </p>
                    <button
                      className={s.button}
                      disabled={expert.status === '暂不可约'}
                      onClick={() => request(expert)}
                    >
                      就此方向咨询
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          )}
          {tab === 'conditions' && (
            <Panel title="合作条件与准备材料">
              <Badge value={expert.status} />
              <p style={{ fontSize: 14, lineHeight: 1.9, marginTop: 16 }}>
                {expert.conditions}
              </p>
              <p className={s.sectionIntro} style={{ marginTop: 16 }}>
                发起前请确认资料使用范围、需要解决的问题、期望成果和时间要求。
              </p>
            </Panel>
          )}
        </>
      ) : (
        <>
          <Header
            title="专家智库"
            description="维护专家领域、成果、经历和服务范围，按专业能力和合作条件检索，快速匹配合适专家。"
          >
            <button className={s.primary} onClick={() => request()}>
              <Plus size={17} />
              发起专家咨询
            </button>
          </Header>
          <TabBar
            tabs={[
              { key: 'directory', label: '专家档案与能力检索' },
              { key: 'consultations', label: '专家咨询与服务反馈' },
            ]}
            value={view}
            onChange={(v) =>
              loc.set({ view: v, page: undefined, q: undefined })
            }
          />
          <Notice message={notice || storageError} />
          {view === 'directory' ? (
            <>
              <div className={s.filters}>
                <Filter
                  label="专业领域"
                  value={loc.get('field')}
                  options={data.experts.map((e) => e.field)}
                  onChange={(v) => filter('field', v)}
                />
                <Filter
                  label="所属机构"
                  value={loc.get('org')}
                  options={data.experts.map((e) => e.org)}
                  onChange={(v) => filter('org', v)}
                />
                <Filter
                  label="技术方向"
                  value={loc.get('direction')}
                  options={data.experts.flatMap((e) => e.directions)}
                  onChange={(v) => filter('direction', v)}
                />
                <Filter
                  label="服务类型"
                  value={loc.get('service')}
                  options={data.experts.flatMap((e) => e.services)}
                  onChange={(v) => filter('service', v)}
                />
                <Filter
                  label="可合作状态"
                  value={loc.get('status')}
                  options={['可咨询', '需预约', '暂不可约']}
                  onChange={(v) => filter('status', v)}
                />
                <SearchBox
                  value={loc.get('q')}
                  onChange={(v) => filter('q', v)}
                  placeholder="搜索专家姓名、研究方向、关键词"
                />
                <button
                  className={s.link}
                  onClick={() =>
                    loc.set(
                      {
                        field: undefined,
                        org: undefined,
                        direction: undefined,
                        service: undefined,
                        status: undefined,
                        q: undefined,
                        page: undefined,
                      },
                      true,
                    )
                  }
                >
                  重置筛选
                </button>
              </div>
              <Stats
                items={[
                  {
                    label: '专家总数',
                    value: filtered.length,
                    icon: Users,
                    tone: 'rose',
                  },
                  {
                    label: '可咨询专家',
                    value: filtered.filter((e) => e.status === '可咨询').length,
                    icon: FlaskConical,
                    tone: 'green',
                  },
                  {
                    label: '本月咨询',
                    value: data.consultations.filter((c) =>
                      c.created.startsWith('2026-09'),
                    ).length,
                    icon: Flag,
                    tone: 'blue',
                  },
                  {
                    label: '已完成服务',
                    value: data.consultations.filter(
                      (c) => c.status === '已完成',
                    ).length,
                    icon: CheckCircle2,
                    tone: 'orange',
                  },
                ]}
              />
              <div className={s.detailGrid}>
                <Panel
                  title={`专家列表 (${filtered.length})`}
                  padded={false}
                  actions={
                    <>
                      <button
                        aria-label="列表视图"
                        className={s.button}
                        onClick={() => filter('layout', 'list')}
                      >
                        <List size={15} />
                      </button>
                      <button
                        aria-label="卡片视图"
                        className={s.button}
                        onClick={() => filter('layout', 'cards')}
                      >
                        <LayoutGrid size={15} />
                      </button>
                    </>
                  }
                >
                  {layout === 'list' ? (
                    <div className={s.tableScroll}>
                      <table className={s.table}>
                        <thead>
                          <tr>
                            <th>专家</th>
                            <th>机构 / 领域</th>
                            <th>可合作状态</th>
                            <th>服务范围</th>
                            <th>操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {list.rows.map((e) => (
                            <tr key={e.id}>
                              <td>
                                <button
                                  className={s.name}
                                  onClick={() => loc.open(e.id)}
                                >
                                  {e.name}
                                </button>
                                <small className={s.sub}>{e.title}</small>
                              </td>
                              <td>
                                {e.org}
                                <small className={s.sub}>{e.field}</small>
                              </td>
                              <td>
                                <Badge value={e.status} />
                              </td>
                              <td>{e.services.join('、')}</td>
                              <td>
                                <button
                                  className={s.link}
                                  onClick={() => loc.open(e.id)}
                                >
                                  查看档案
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className={s.expertGrid}>
                      {list.rows.map((e) => (
                        <article className={s.expertCard} key={e.id}>
                          <div className={s.expertHead}>
                            <span className={s.avatar}>{e.name[0]}</span>
                            <div>
                              <div className={s.actions}>
                                <button
                                  className={s.name}
                                  onClick={() => loc.open(e.id)}
                                >
                                  {e.name}
                                </button>
                                <Badge value={e.status} />
                              </div>
                              <span className={s.sub}>
                                {e.title} · {e.org}
                              </span>
                            </div>
                          </div>
                          <Tags values={e.directions} />
                          <p className={s.expertBio}>{e.bio}</p>
                          <div className={s.expertFooter}>
                            <span className={s.sub}>
                              代表成果 {e.achievements.length} 项 · 服务{' '}
                              {e.services.length} 类
                            </span>
                            <div className={s.actions}>
                              <button
                                className={s.button}
                                onClick={() => loc.open(e.id)}
                              >
                                查看档案
                              </button>
                              <button
                                className={s.primary}
                                disabled={e.status === '暂不可约'}
                                onClick={() => request(e)}
                              >
                                发起咨询
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  {!filtered.length && <Empty />}
                  <Pagination
                    total={filtered.length}
                    page={list.page}
                    size={4}
                    onChange={(p) => loc.set({ page: String(p) })}
                  />
                </Panel>
                <aside className={s.stack}>
                  <Panel
                    title="匹配推荐"
                    actions={
                      <button
                        className={s.link}
                        onClick={() => setBatch((v) => v + 1)}
                      >
                        <RefreshCw size={12} style={{ display: 'inline' }} />{' '}
                        换一批
                      </button>
                    }
                  >
                    <p className={s.sectionIntro}>
                      根据当前筛选条件与可合作状态推荐。
                    </p>
                    {recommended.map((e) => (
                      <div className={s.comment} key={e.id}>
                        <div className={s.expertHead}>
                          <span
                            className={s.avatar}
                            style={{ width: 34, height: 34, fontSize: 13 }}
                          >
                            {e.name[0]}
                          </span>
                          <div>
                            <strong>{e.name}</strong>
                            <small className={s.sub}>{e.field}</small>
                          </div>
                          <button
                            style={{ marginLeft: 'auto' }}
                            className={s.link}
                            onClick={() => loc.open(e.id)}
                          >
                            查看
                          </button>
                        </div>
                      </div>
                    ))}
                    {!recommended.length && <Empty message="暂无匹配推荐" />}
                  </Panel>
                  <Panel title="近期咨询">
                    {data.consultations.slice(0, 3).map((c) => (
                      <button
                        key={c.id}
                        className={s.comment}
                        style={{
                          display: 'block',
                          textAlign: 'left',
                          width: '100%',
                        }}
                        onClick={() =>
                          loc.set({
                            view: 'consultations',
                            detail: c.id,
                            tab: 'basic',
                          })
                        }
                      >
                        {c.title}
                        <small className={s.sub}>
                          {c.created} · {c.status}
                        </small>
                      </button>
                    ))}
                    {!data.consultations.length && (
                      <p className={s.sectionIntro}>
                        暂无咨询记录，找到合适专家后可发起需求。
                      </p>
                    )}
                  </Panel>
                </aside>
              </div>
            </>
          ) : (
            <>
              <div className={s.filters}>
                <Filter
                  label="咨询状态"
                  value={loc.get('requestStatus')}
                  options={['待受理', '沟通中', '已完成', '已撤回']}
                  onChange={(v) => filter('requestStatus', v)}
                />
                <SearchBox
                  value={loc.get('q')}
                  onChange={(v) => filter('q', v)}
                  placeholder="搜索咨询主题或专家姓名"
                />
              </div>
              <Panel title="专家咨询记录" padded={false}>
                <div className={s.tableScroll}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        {[
                          '咨询主题',
                          '专家',
                          '关联课题',
                          '服务类型',
                          '期望日期',
                          '状态',
                          '操作',
                        ].map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.rows.map((c) => (
                        <tr key={c.id}>
                          <td className={s.cellName}>
                            <button
                              className={s.name}
                              onClick={() => loc.open(c.id)}
                            >
                              {c.title}
                            </button>
                            <small className={s.sub}>{c.id}</small>
                          </td>
                          <td>
                            {
                              data.experts.find((e) => e.id === c.expertId)
                                ?.name
                            }
                          </td>
                          <td>
                            {
                              data.projects.find((p) => p.id === c.projectId)
                                ?.name
                            }
                          </td>
                          <td>{c.service}</td>
                          <td>{c.due}</td>
                          <td>
                            <Badge value={c.status} />
                          </td>
                          <td>
                            <button
                              className={s.link}
                              onClick={() => loc.open(c.id)}
                            >
                              查看咨询
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!consultations.length && (
                  <Empty message="暂无匹配咨询记录，可从专家目录发起需求。" />
                )}
                <Pagination
                  total={consultations.length}
                  page={requests.page}
                  onChange={(p) => loc.set({ page: String(p) })}
                />
              </Panel>
            </>
          )}
        </>
      )}
      {editor && (
        <FormDialog
          key={editor.title}
          title={editor.title}
          description={editor.description}
          fields={editor.fields}
          submit={editor.submit}
          onSubmit={editor.save}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
