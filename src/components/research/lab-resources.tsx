'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSidebar } from '@/components/layout/sidebar-context';
import { CalendarDays, Microscope } from 'lucide-react';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Modal,
  Tabs,
  Notice,
  Empty,
  Status,
  useLocalState,
  useResearchProject,
} from './workspace-kit';

const seedDevices = [
  {
    id: 'DEV-001',
    name: '固定床反应器',
    lab: '催化实验室 A',
    capability: '催化反应 / 高温高压',
    status: '可预约',
    protocol: 'OPC UA',
    signal: '温度、压力、流量',
    last: '2026-09-20 09:30',
    location: '科研楼 A201',
    scope: '课题组',
    hours: 32,
  },
  {
    id: 'DEV-002',
    name: '气相色谱仪',
    lab: '分析实验室 B',
    capability: '组分分析 / 纯度检测',
    status: '可预约',
    protocol: '文件采集',
    signal: '色谱数据、检测时间',
    last: '2026-09-20 09:15',
    location: '科研楼 B102',
    scope: '单位内共享',
    hours: 24,
  },
  {
    id: 'DEV-003',
    name: 'X 射线衍射仪',
    lab: '材料实验室 C',
    capability: '晶体结构 / 相组成',
    status: '维护中',
    protocol: 'HTTP',
    signal: '衍射谱、设备状态',
    last: '2026-09-19 16:40',
    location: '科研楼 C301',
    scope: '单位内共享',
    hours: 12,
  },
];
type Reservation = {
  id: string;
  device: string;
  projectId: string;
  date: string;
  start: number;
  end: number;
  sample: string;
  purpose: string;
  operator: string;
  status: string;
};
const initial: Reservation[] = [
  {
    id: 'RSV-001',
    device: 'DEV-001',
    projectId: 'PROJ-CCUS-01',
    date: '2026-09-21',
    start: 10,
    end: 12,
    sample: 'SMP-001',
    purpose: '催化活性评价',
    operator: '张博士',
    status: '已批准',
  },
];

export function LabResources({
  reservation = false,
}: {
  reservation?: boolean;
}) {
  const [devices, setDevices] = useLocalState(
    'ai4s-device-settings-v2',
    seedDevices.map((d) => ({ ...d, openFrom: 8, openTo: 18 })),
  );
  const { role } = useSidebar();
  const { project, href } = useResearchProject();
  const [tab, setTab] = useState(reservation ? '仪器预约' : '设备台账');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('2026-09-21');
  const [selected, setSelected] = useState<(typeof devices)[number] | null>(
    null,
  );
  const [detailTab, setDetailTab] = useState('技术档案');
  const [bookings, setBookings] = useLocalState<Reservation[]>(
    'ai4s-reservations-v2',
    initial,
  );
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    device: 'DEV-001',
    start: 9,
    end: 10,
    sample: 'SMP-001',
    purpose: '',
    operator: '张博士',
    qualified: false,
  });
  const shown = devices.filter((d) =>
    `${d.name} ${d.lab} ${d.capability}`.includes(query.trim()),
  );
  const daily = bookings.filter(
    (b) => b.date === date && b.status !== '已取消',
  );
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const targetDevice = devices.find((d) => d.id === form.device);
    if (
      form.start >= form.end ||
      form.start < (targetDevice?.openFrom ?? 8) ||
      form.end > (targetDevice?.openTo ?? 18)
    )
      return setError('请在该设备的开放时段内预约，结束时间必须晚于开始时间。');
    if (!form.qualified) return setError('请确认操作资质和设备安全要求。');
    if (devices.find((d) => d.id === form.device)?.status === '维护中')
      return setError('该设备维护中，请选择其他设备或等待恢复开放。');
    if (
      daily.some(
        (b) =>
          b.device === form.device && form.start < b.end && form.end > b.start,
      )
    )
      return setError('该时段已有预约，请选择时间轴中的空闲时段。');
    setBookings((all) => [
      ...all,
      {
        ...form,
        id: `RSV-${Date.now()}`,
        projectId: project.id,
        date,
        status: '待审批',
      },
    ]);
    setBooking(false);
    setNotice('预约申请已保存为待审批。来源系统接入后同步审批与排期结果。');
  }
  function update(id: string, status: string) {
    setBookings((all) => all.map((b) => (b.id === id ? { ...b, status } : b)));
    setNotice(`预约状态已更新：${status}（本地演示）`);
  }
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="仪器与预约"
        description="按实验能力查找设备，查看接入状态与开放机时，完成预约和使用记录。"
      >
        <button
          className="research-primary"
          onClick={() => {
            setError('');
            setBooking(true);
            setTab('仪器预约');
          }}
        >
          申请预约
        </button>
      </WorkspaceHeader>
      <Tabs
        tabs={['设备台账', '仪器预约', '机时统计']}
        value={tab}
        onChange={setTab}
      />
      {notice && <Notice>{notice}</Notice>}
      <div className="flex items-end gap-3">
        <Field label="设备 / 实验室 / 能力">
          <input
            className="research-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索设备"
          />
        </Field>
        {tab !== '设备台账' && (
          <Field label="日期">
            <input
              type="date"
              required
              className="research-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        )}
      </div>
      {tab === '设备台账' && (
        <Panel>
          <table className="research-table">
            <thead>
              <tr>
                {[
                  '设备 / 编号',
                  '实验室与位置',
                  '能力',
                  '开放范围',
                  '状态',
                  '操作',
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">
                    {d.name}
                    <small className="block text-muted-foreground">
                      {d.id}
                    </small>
                  </td>
                  <td>
                    {d.lab}
                    <small className="block text-muted-foreground">
                      {d.location}
                    </small>
                  </td>
                  <td>{d.capability}</td>
                  <td>{d.scope}</td>
                  <td>
                    <Status>{d.status}</Status>
                  </td>
                  <td>
                    <button
                      className="text-primary"
                      onClick={() => {
                        setSelected(d);
                        setDetailTab('技术档案');
                      }}
                    >
                      查看档案
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!shown.length && <Empty />}
        </Panel>
      )}
      {tab === '仪器预约' && (
        <>
          <Panel
            title="资源时间轴"
            action={
              <span className="text-xs text-muted-foreground">
                开放 08:00–18:00 · 选择空闲格申请
              </span>
            }
          >
            <div className="overflow-x-auto">
              <div className="grid min-w-[740px] grid-cols-[160px_repeat(10,minmax(48px,1fr))] gap-1 text-xs">
                <div />
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    className="py-2 text-center text-muted-foreground"
                    key={i}
                  >
                    {i + 8}:00
                  </div>
                ))}
                {shown.map((d) => (
                  <div className="contents" key={d.id}>
                    <div className="flex h-14 items-center gap-2">
                      <Microscope className="size-4" />
                      {d.name}
                    </div>
                    {Array.from({ length: 10 }, (_, i) => {
                      const hour = i + 8;
                      const used = daily.find(
                        (b) =>
                          b.device === d.id && hour >= b.start && hour < b.end,
                      );
                      const blocked =
                        d.status === '维护中' ||
                        hour < d.openFrom ||
                        hour >= d.openTo;
                      return (
                        <button
                          key={i}
                          className={`h-14 rounded-md border ${blocked ? 'border-line bg-surface-2' : used ? 'border-primary/20 bg-secondary text-primary' : 'border-green/20 bg-green/5 text-green hover:bg-green/15'}`}
                          aria-label={`${d.name} ${hour}:00 ${blocked ? '维护' : used ? '已占用' : '空闲'}`}
                          disabled={blocked || !!used}
                          onClick={() => {
                            setForm({
                              ...form,
                              device: d.id,
                              start: hour,
                              end: hour + 1,
                            });
                            setError('');
                            setBooking(true);
                          }}
                        >
                          {blocked ? '维护' : used ? '已占用' : '空闲'}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Panel>
          <Panel title="预约记录">
            <table className="research-table">
              <thead>
                <tr>
                  {['设备 / 时段', '课题 / 样品', '操作人', '状态', '操作'].map(
                    (h) => (
                      <th key={h}>{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {bookings
                  .filter(
                    (b) =>
                      b.date === date && shown.some((d) => d.id === b.device),
                  )
                  .map((b) => (
                    <tr key={b.id}>
                      <td>
                        {devices.find((d) => d.id === b.device)?.name}
                        <small className="block">
                          {b.start}:00–{b.end}:00
                        </small>
                      </td>
                      <td>
                        {b.projectId}
                        <small className="block text-muted-foreground">
                          {b.sample} · {b.purpose}
                        </small>
                      </td>
                      <td>{b.operator}</td>
                      <td>
                        <Status>{b.status}</Status>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          {b.status === '待审批' && role !== 'researcher' && (
                            <button
                              className="text-primary"
                              onClick={() => update(b.id, '已批准')}
                            >
                              批准预约
                            </button>
                          )}
                          {b.status === '已批准' && (
                            <button
                              className="text-primary"
                              onClick={() => update(b.id, '使用中')}
                            >
                              签到
                            </button>
                          )}
                          {b.status === '使用中' && (
                            <button
                              className="text-primary"
                              onClick={() => update(b.id, '已完成')}
                            >
                              签退
                            </button>
                          )}
                          {['待审批', '已批准'].includes(b.status) && (
                            <button
                              className="text-muted-foreground"
                              onClick={() => update(b.id, '已取消')}
                            >
                              取消预约
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {!bookings.some((b) => b.date === date) && (
              <Empty message="当日暂无预约，可从时间轴选择空闲时段。" />
            )}
          </Panel>
        </>
      )}
      {tab === '机时统计' && (
        <Panel title="开放与使用统计">
          <p className="mb-4 text-xs text-muted-foreground">
            示例台账：本周开放机时；当日预约数由当前预约记录计算。
          </p>
          <table className="research-table">
            <thead>
              <tr>
                {[
                  '仪器',
                  '本周开放 / 小时',
                  '当日已预约 / 小时',
                  '当日完成预约',
                  '维护状态',
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.hours}</td>
                  <td>
                    {daily
                      .filter((b) => b.device === d.id)
                      .reduce((n, b) => n + b.end - b.start, 0)}
                  </td>
                  <td>
                    {
                      daily.filter(
                        (b) => b.device === d.id && b.status === '已完成',
                      ).length
                    }
                  </td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? '设备档案'}
      >
        {selected && (
          <>
            <Tabs
              tabs={['技术档案', '接入与采集', '共享与使用']}
              value={detailTab}
              onChange={setDetailTab}
            />
            {detailTab === '技术档案' ? (
              <dl className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries({
                  编号: selected.id,
                  实验室: selected.lab,
                  位置: selected.location,
                  技术能力: selected.capability,
                  负责人: '设备管理员',
                  来源系统: 'iLOMS（示例）',
                }).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="mt-1">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : detailTab === '接入与采集' ? (
              <div className="space-y-3 text-sm">
                <p>
                  协议：{selected.protocol}；采集点位：{selected.signal}
                </p>
                <p>最后同步：{selected.last}（示例快照）</p>
                <p>
                  采集批次：BATCH-0920 · 时间对齐：UTC+8 · 补采状态：无待补采
                </p>
                <Notice>
                  设备协议配置和真实采集由来源系统负责，原型展示同步与异常状态。
                </Notice>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="开放范围">
                    <select
                      className="research-input"
                      value={selected.scope}
                      onChange={(e) =>
                        setSelected({ ...selected, scope: e.target.value })
                      }
                    >
                      <option>课题组</option>
                      <option>单位内共享</option>
                      <option>指定合作单位</option>
                    </select>
                  </Field>
                  <Field label="设备状态">
                    <select
                      className="research-input"
                      value={selected.status}
                      onChange={(e) =>
                        setSelected({ ...selected, status: e.target.value })
                      }
                    >
                      <option>可预约</option>
                      <option>维护中</option>
                    </select>
                  </Field>
                  <Field label="开放起始小时">
                    <input
                      type="number"
                      min={8}
                      max={17}
                      className="research-input"
                      value={selected.openFrom}
                      onChange={(e) =>
                        setSelected({ ...selected, openFrom: +e.target.value })
                      }
                    />
                  </Field>
                  <Field label="开放结束小时">
                    <input
                      type="number"
                      min={9}
                      max={18}
                      className="research-input"
                      value={selected.openTo}
                      onChange={(e) =>
                        setSelected({ ...selected, openTo: +e.target.value })
                      }
                    />
                  </Field>
                </div>
                <button
                  className="research-button"
                  disabled={
                    role === 'researcher' ||
                    selected.openFrom >= selected.openTo ||
                    selected.openFrom < 8 ||
                    selected.openTo > 18
                  }
                  onClick={() => {
                    setDevices((all) =>
                      all.map((d) => (d.id === selected.id ? selected : d)),
                    );
                    setNotice(
                      '设备开放规则已保存（本地演示），新的预约按更新后的时段校验。',
                    );
                  }}
                >
                  保存开放规则
                </button>
                <p className="text-xs text-muted-foreground">
                  规则调整由负责人或管理角色操作，不改变已批准的预约。
                </p>
                <p>预约规则：提前预约，单次不超过10小时；维护期间不可预约。</p>
                <p>
                  本地使用记录：
                  {bookings.filter((b) => b.device === selected.id).length} 条
                </p>
                <Link
                  className="research-button"
                  href={href('/lab-resources/reservations')}
                >
                  进入排期
                </Link>
              </div>
            )}
          </>
        )}
      </Modal>
      <Modal
        open={booking}
        onClose={() => setBooking(false)}
        title="仪器预约申请"
      >
        <form className="grid grid-cols-2 gap-4" onSubmit={submit}>
          <Field label="设备">
            <select
              className="research-input"
              value={form.device}
              onChange={(e) => setForm({ ...form, device: e.target.value })}
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="日期">
            <input
              className="research-input"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="开始时间 / 小时">
            <input
              className="research-input"
              type="number"
              min={8}
              max={17}
              value={form.start}
              onChange={(e) => setForm({ ...form, start: +e.target.value })}
            />
          </Field>
          <Field label="结束时间 / 小时">
            <input
              className="research-input"
              type="number"
              min={9}
              max={18}
              value={form.end}
              onChange={(e) => setForm({ ...form, end: +e.target.value })}
            />
          </Field>
          <Field label="样品 / 批次">
            <input
              className="research-input"
              required
              value={form.sample}
              onChange={(e) => setForm({ ...form, sample: e.target.value })}
            />
          </Field>
          <Field label="操作人">
            <input
              className="research-input"
              required
              value={form.operator}
              onChange={(e) => setForm({ ...form, operator: e.target.value })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="实验用途">
              <input
                className="research-input"
                required
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </Field>
          </div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.qualified}
              onChange={(e) =>
                setForm({ ...form, qualified: e.target.checked })
              }
            />
            已了解设备安全要求并具备操作资质
          </label>
          {error && (
            <p role="alert" className="col-span-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <button className="research-primary col-span-2" type="submit">
            <CalendarDays className="size-4" />
            确认申请
          </button>
        </form>
      </Modal>
    </div>
  );
}
