'use client';
import { useState } from 'react';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Notice,
  NextActions,
  useLocalState,
  downloadText,
} from './workspace-kit';
const clauses = [
  {
    id: '1',
    section: '试验条件',
    left: '温度 200 °C ± 2 °C',
    right: '温度 473.15 K ± 3 K',
    difference: '温度基准等效，允许偏差不同',
    page: 'A 第3页 / B 第4页',
  },
  {
    id: '2',
    section: '采样周期',
    left: '每 30 min 采集一次',
    right: '每 0.5 h 采集一次',
    difference: '单位转换后一致',
    page: 'A 第4页 / B 第5页',
  },
  {
    id: '3',
    section: '报告内容',
    left: '记录设备、样品批次和检测结果',
    right: '增加校准记录和测量不确定度',
    difference: '报告字段存在差异',
    page: 'A 第6页 / B 第7页',
  },
];
export function StandardsWorkspace() {
  const [version, setVersion] = useState('2024');
  const [confirmed, setConfirmed] = useLocalState<string[]>(
    'ai4s-standard-confirmed',
    [],
  );
  const [filter, setFilter] = useState('全部');
  const [note, setNote] = useLocalState('ai4s-standard-conclusion', '');
  const shown = clauses.filter(
    (c) => filter === '全部' || !confirmed.includes(c.id),
  );
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="国内外标准对标"
        description="选择标准版本，逐条比较技术条件、指标与单位，人工确认差异后形成结论。"
      >
        <button
          className="research-primary"
          disabled={confirmed.length !== clauses.length}
          onClick={() =>
            downloadText(
              '标准条款差异结论.md',
              `# 标准对标（示例）\n\n${clauses.map((c) => `${c.section}：${c.difference}（${c.page}）`).join('\n')}\n\n人工结论：${note}`,
            )
          }
        >
          导出已确认结论
        </button>
      </WorkspaceHeader>
      <Notice>
        本页标准、阈值与页码均为原型示例，不代表真实标准条款。正式对标需加载有授权的原文版本。
      </Notice>
      <div className="grid grid-cols-3 gap-4">
        <Field label="国内标准 / 版本">
          <select
            className="research-input"
            value={version}
            onChange={(e) => {
              setVersion(e.target.value);
              setConfirmed([]);
            }}
          >
            <option value="2024">内部试验方法 A · 2024</option>
            <option value="2022">内部试验方法 A · 2022</option>
          </select>
        </Field>
        <Field label="国际标准 / 版本">
          <input
            className="research-input"
            readOnly
            value="对照试验方法 B · 2024（示例）"
          />
        </Field>
        <Field label="确认状态">
          <select
            className="research-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>全部</option>
            <option>待确认</option>
          </select>
        </Field>
      </div>
      <Panel title={`条款对照 · 已确认 ${confirmed.length}/${clauses.length}`}>
        <table className="research-table">
          <thead>
            <tr>
              {['条款', '方法 A', '方法 B', '差异与来源', '确认'].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id}>
                <td>{c.section}</td>
                <td>
                  {version === '2022' && c.id === '1'
                    ? '温度 200 °C ± 5 °C'
                    : c.left}
                </td>
                <td>{c.right}</td>
                <td>
                  {c.difference}
                  <small className="mt-1 block text-muted-foreground">
                    {c.page}
                  </small>
                </td>
                <td>
                  <input
                    aria-label={`确认${c.section}`}
                    type="checkbox"
                    checked={confirmed.includes(c.id)}
                    onChange={(e) =>
                      setConfirmed(
                        e.target.checked
                          ? [...confirmed, c.id]
                          : confirmed.filter((id) => id !== c.id),
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel title="人工差异结论">
        <textarea
          aria-label="人工差异结论"
          className="research-input min-h-28"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="说明差异是否适用于当前课题，并记录采用标准及理由。"
        />
        <div className="mt-4">
          <NextActions sourceId={`STD-A-${version}`} />
        </div>
      </Panel>
    </div>
  );
}
