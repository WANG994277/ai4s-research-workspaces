'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Modal,
  Tabs,
  Notice,
  Empty,
  Status,
  NextActions,
  useLocalState,
  useResearchProject,
} from './workspace-kit';
const people = [
  {
    id: 'EXPERT-001',
    name: '周教授',
    field: '催化剂与反应机理',
    org: '炼化研究中心',
    work: 'CO₂ 加氢、催化剂失活分析',
    availability: '可咨询',
  },
  {
    id: 'EXPERT-002',
    name: '刘研究员',
    field: '分子模拟与材料',
    org: '材料研究所',
    work: 'VASP、分子动力学、多尺度模拟',
    availability: '可咨询',
  },
  {
    id: 'EXPERT-003',
    name: '陈研究员',
    field: '地球科学',
    org: '油气勘探研究院',
    work: '储层评价、地震反演',
    availability: '需预约',
  },
];
export function ExpertsWorkspace() {
  const { project } = useResearchProject();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [purpose, setPurpose] = useState('');
  const [requests, setRequests] = useLocalState<
    {
      id: string;
      expert: string;
      project: string;
      purpose: string;
      status: string;
      rating: string;
    }[]
  >('ai4s-consultations', []);
  const [tab, setTab] = useState('专家目录');
  const [notice, setNotice] = useState('');
  const rows = people.filter((p) =>
    `${p.name} ${p.field} ${p.org} ${p.work}`.includes(query),
  );
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="专家智库"
        description="根据研究方向和合作条件寻找专家，关联课题提出咨询需求并记录反馈。"
      />
      <Tabs tabs={['专家目录', '咨询与反馈']} value={tab} onChange={setTab} />
      {notice && <Notice>{notice}</Notice>}
      {tab === '专家目录' ? (
        <>
          <input
            className="research-input max-w-md"
            aria-label="专家检索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="姓名、领域、机构、能力关键词"
          />
          <div className="grid grid-cols-3 gap-5">
            {rows.map((p) => (
              <Panel title={p.name} key={p.id}>
                <Status>{p.field}</Status>
                <p className="mt-4 text-sm">{p.org}</p>
                <p className="my-3 text-sm leading-6 text-muted-foreground">
                  {p.work}
                </p>
                <p className="mb-4 text-xs">{p.availability} · 示例专家档案</p>
                <button
                  className="research-button"
                  onClick={() => {
                    setSelected(p.id);
                    setPurpose('');
                  }}
                >
                  档案与咨询
                </button>
              </Panel>
            ))}
          </div>
          {!rows.length && <Empty />}
        </>
      ) : (
        <Panel title="咨询申请记录">
          {requests.length ? (
            <table className="research-table">
              <thead>
                <tr>
                  <th>专家</th>
                  <th>咨询需求</th>
                  <th>状态</th>
                  <th>反馈</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{people.find((p) => p.id === r.expert)?.name}</td>
                    <td>
                      {r.purpose}
                      <small className="block text-muted-foreground">
                        {r.project}
                      </small>
                    </td>
                    <td>{r.status}</td>
                    <td>
                      <select
                        aria-label={`咨询${r.id}反馈`}
                        className="research-input"
                        value={r.rating}
                        onChange={(e) =>
                          setRequests((all) =>
                            all.map((v) =>
                              v.id === r.id
                                ? { ...v, rating: e.target.value }
                                : v,
                            ),
                          )
                        }
                      >
                        <option>待评价</option>
                        <option>符合需求</option>
                        <option>需补充沟通</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty message="还没有咨询申请，请先选择匹配专家。" />
          )}
        </Panel>
      )}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={people.find((p) => p.id === selected)?.name ?? '专家档案'}
      >
        <p className="text-sm">
          研究能力：{people.find((p) => p.id === selected)?.work}
        </p>
        <p className="text-xs text-muted-foreground">
          来源：员工助手示例档案；成果、经历和服务时间待来源系统确认。
        </p>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!selected) return;
            setRequests((all) => [
              ...all,
              {
                id: `CONSULT-${Date.now()}`,
                expert: selected,
                project: project.name,
                purpose,
                status: '草稿待发送',
                rating: '待评价',
              },
            ]);
            setSelected(null);
            setTab('咨询与反馈');
            setNotice('咨询草稿已保存。尚未连接员工助手，未向专家发送消息。');
          }}
        >
          <Field label="咨询问题与预期成果">
            <textarea
              className="research-input min-h-28"
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </Field>
          <button className="research-primary">保存咨询申请</button>
        </form>
      </Modal>
    </div>
  );
}

type Tool = {
  id: string;
  name: string;
  field: string;
  version: string;
  license: string;
  input: string;
  output: string;
  environment: string;
};
const seedTools: Tool[] = [
  {
    id: 'TOOL-VASP',
    name: 'VASP',
    field: '材料科学',
    version: '6.4',
    license: '需单位授权',
    input: '结构、k点、截断能',
    output: '能量、电荷密度、结构',
    environment: 'CPU / Linux',
  },
  {
    id: 'TOOL-GROMACS',
    name: 'GROMACS',
    field: '材料科学',
    version: '2024',
    license: '按安装包许可证授权',
    input: '拓扑、坐标、力场',
    output: '轨迹、能量曲线',
    environment: 'CPU/GPU / Linux',
  },
  {
    id: 'TOOL-GEO',
    name: 'GeoEast / AGT',
    field: '地球科学',
    version: '待绑定版本',
    license: '需单位授权',
    input: '地震数据、速度场',
    output: '解释结果、正演波场',
    environment: '来源软件环境',
  },
  {
    id: 'TOOL-MATLAB',
    name: 'MATLAB',
    field: '数值计算',
    version: '待绑定版本',
    license: '商业许可',
    input: '脚本、数据、参数',
    output: '数值结果、图表',
    environment: '单位许可环境',
  },
];
export function ToolsWorkspace() {
  const { project, href } = useResearchProject();
  const [tools, setTools] = useLocalState('ai4s-tools-v2', seedTools);
  const [tab, setTab] = useState('软件目录');
  const [selected, setSelected] = useState<Tool | null>(null);
  const [query, setQuery] = useState('');
  const [params, setParams] = useState('');
  const [notice, setNotice] = useState('');
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    version: '',
    input: '',
    output: '',
    environment: '',
    license: '',
  });
  const rows = tools.filter((t) => `${t.name} ${t.field}`.includes(query));
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="工具与科学软件"
        description="按科学任务选择软件、输入输出和运行环境，管理工具版本及参数模板。"
      >
        <button className="research-primary" onClick={() => setCreate(true)}>
          登记工具
        </button>
      </WorkspaceHeader>
      <Tabs
        tabs={['软件目录', '机理仿真', '工具建设']}
        value={tab}
        onChange={setTab}
      />
      {notice && <Notice>{notice}</Notice>}
      {tab === '工具建设' ? (
        <Panel title="工具接口与版本">
          <p className="text-sm leading-7 text-muted-foreground">
            登记自研代码或来源软件接口，明确参数、输入输出、运行环境和许可，调试通过后再正式发布。
          </p>
          <table className="research-table mt-4">
            <thead>
              <tr>
                <th>工具</th>
                <th>版本</th>
                <th>输入 → 输出</th>
                <th>环境</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tools.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.version}</td>
                  <td>
                    {t.input} → {t.output}
                  </td>
                  <td>{t.environment}</td>
                  <td>
                    <button
                      className="text-primary"
                      onClick={() => setSelected(t)}
                    >
                      参数与调试
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : (
        <>
          <input
            aria-label="检索工具"
            className="research-input max-w-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="软件名称或领域"
          />
          <div className="grid grid-cols-3 gap-4">
            {rows.map((t) => (
              <Panel title={t.name} key={t.id}>
                <Status>{t.field}</Status>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>版本：{t.version}</div>
                  <div>许可：{t.license}</div>
                  <div>输入：{t.input}</div>
                  <div>输出：{t.output}</div>
                </dl>
                <button
                  className="research-button mt-4"
                  onClick={() => {
                    setSelected(t);
                    setParams('');
                  }}
                >
                  {tab === '机理仿真' ? '配置仿真输入' : '查看与使用'}
                </button>
              </Panel>
            ))}
          </div>
        </>
      )}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? '工具配置'}
      >
        {selected && (
          <>
            <p className="text-sm">
              版本：{selected.version} · 环境：{selected.environment} ·{' '}
              {selected.license}
            </p>
            <Field label="输入参数与模板">
              <textarea
                className="research-input min-h-28"
                value={params}
                onChange={(e) => setParams(e.target.value)}
                placeholder={selected.input}
              />
            </Field>
            <button
              className="research-button"
              disabled={!params.trim()}
              onClick={() =>
                setNotice(
                  '参数模板已通过本地非空校验，真实求解器调试尚未接入。',
                )
              }
            >
              校验参数
            </button>
            <Link
              className="research-primary"
              href={href('/compute-tasks', selected.id)}
            >
              进入计算任务创建
            </Link>
            <p className="text-xs text-muted-foreground">
              课题：{project.name}；工具实际执行和许可校验需来源系统接入。
            </p>
          </>
        )}
      </Modal>
      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="登记工具版本"
      >
        <form
          className="grid grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setTools((all) => [
              ...all,
              { ...form, id: `TOOL-${Date.now()}`, field: '自研工具' },
            ]);
            setCreate(false);
            setTab('工具建设');
            setNotice('工具元数据已登记为本地草稿，待真实调试与发布。');
          }}
        >
          {Object.entries({
            name: '工具名称',
            version: '版本号',
            input: '输入参数',
            output: '输出产物',
            environment: '运行环境',
            license: '许可范围',
          }).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                className="research-input"
                required
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </Field>
          ))}
          <button className="research-primary col-span-2">保存工具草稿</button>
        </form>
      </Modal>
    </div>
  );
}

export function DesignWorkspace() {
  const [tab, setTab] = useState('候选设计');
  const [objective, setObjective] = useState('提高催化活性，控制成本');
  const [constraints, setConstraints] = useState(
    '温度不超过250 °C；使用可采购原料',
  );
  const [generated, setGenerated] = useState(false);
  const [selection, setSelection] = useState<string[]>([]);
  const { href } = useResearchProject();
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="智能设计与筛选"
        description="先明确目标和约束，再比较候选方案，通过专业插件继续计算验证。"
      />
      <Tabs tabs={['候选设计', '专业场景插件']} value={tab} onChange={setTab} />
      {tab === '专业场景插件' ? (
        <div className="grid grid-cols-3 gap-5">
          {[
            ['地球科学', 'GeoEast、AGT、储层评价', '/compute-space/tools'],
            ['材料科学', '分子生成、性质筛选、逆合成', '/molecular-design'],
            ['合成生物学', '蛋白质设计与序列筛选', '/protein-engineering'],
          ].map(([name, desc, path]) => (
            <Panel key={name} title={name}>
              <p className="mb-4 text-sm leading-7 text-muted-foreground">
                {desc}
              </p>
              <Link className="research-button" href={href(path)}>
                进入专业设计
              </Link>
            </Panel>
          ))}
        </div>
      ) : (
        <>
          <Panel title="设计目标">
            <div className="grid grid-cols-2 gap-4">
              <Field label="性能目标 / 优化方向">
                <textarea
                  className="research-input"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </Field>
              <Field label="结构、成本与实验约束">
                <textarea
                  className="research-input"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                />
              </Field>
            </div>
            <button
              className="research-primary mt-4"
              disabled={!objective.trim() || !constraints.trim()}
              onClick={() => setGenerated(true)}
            >
              预览候选设计
            </button>
          </Panel>
          {generated && (
            <Panel title="候选方案对比">
              <Notice>
                下列为交互演示候选，未调用模型预测。需计算和实验验证后才能采纳。
              </Notice>
              <table className="research-table mt-4">
                <thead>
                  <tr>
                    <th>选择</th>
                    <th>候选</th>
                    <th>设计方向</th>
                    <th>约束检查</th>
                    <th>验证要求</th>
                  </tr>
                </thead>
                <tbody>
                  {['CAT-A', 'CAT-B', 'CAT-C'].map((id, i) => (
                    <tr key={id}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`选择${id}`}
                          checked={selection.includes(id)}
                          onChange={(e) =>
                            setSelection(
                              e.target.checked
                                ? [...selection, id]
                                : selection.filter((v) => v !== id),
                            )
                          }
                        />
                      </td>
                      <td>{id}</td>
                      <td>{['活性优先', '成本优先', '稳定性优先'][i]}</td>
                      <td>{i === 2 ? '需复核原料' : '待核验'}</td>
                      <td>能量计算、稳定性实验</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4">
                <NextActions sourceId={selection.join(',') || 'DESIGN-DRAFT'} />
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
