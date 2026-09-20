'use client';
import { useState } from 'react';
import { Panel, Field, Tabs, Notice, useLocalState } from './workspace-kit';
type Collaboration = {
  members: { name: string; role: string }[];
  milestones: { title: string; due: string; status: string }[];
  risks: { title: string; owner: string; status: string }[];
};
export function ProjectCollaboration({ projectId }: { projectId: string }) {
  const [all, setAll] = useLocalState<Record<string, Collaboration>>(
    'ai4s-project-collaboration',
    {},
  );
  const [tab, setTab] = useState('成员分工');
  const [name, setName] = useState('');
  const [role, setRole] = useState('科研人员');
  const [due, setDue] = useState('2026-09-25');
  const [owner, setOwner] = useState('张博士');
  const [notice, setNotice] = useState('');
  const data = all[projectId] ?? {
    members: [{ name: '张博士', role: '课题负责人' }],
    milestones: [],
    risks: [],
  };
  function save(value: Collaboration) {
    setAll({ ...all, [projectId]: value });
  }
  return (
    <div className="space-y-4 p-5">
      <Tabs
        tabs={['成员分工', '里程碑', '风险与行动项']}
        value={tab}
        onChange={setTab}
      />
      {notice && <Notice>{notice}</Notice>}
      {tab === '成员分工' ? (
        <>
          <table className="research-table">
            <thead>
              <tr>
                <th>课题成员</th>
                <th>职责</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m, i) => (
                <tr key={i}>
                  <td>{m.name}</td>
                  <td>
                    <select
                      className="research-input"
                      aria-label={`${m.name}课题职责`}
                      value={m.role}
                      onChange={(e) =>
                        save({
                          ...data,
                          members: data.members.map((v, j) =>
                            i === j ? { ...v, role: e.target.value } : v,
                          ),
                        })
                      }
                    >
                      <option>课题负责人</option>
                      <option>科研人员</option>
                      <option>实验操作人</option>
                      <option>专家评审人</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (data.members.some((m) => m.name === name.trim()))
                return setNotice('该成员已在课题中。');
              save({
                ...data,
                members: [...data.members, { name: name.trim(), role }],
              });
              setName('');
              setNotice('已记录课题分工（原型数据），不变更真实系统权限。');
            }}
          >
            <Field label="成员姓名">
              <input
                className="research-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="课题职责">
              <select
                className="research-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>科研人员</option>
                <option>实验操作人</option>
                <option>专家评审人</option>
              </select>
            </Field>
            <button className="research-button">添加分工</button>
          </form>
        </>
      ) : tab === '里程碑' ? (
        <>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save({
                ...data,
                milestones: [
                  ...data.milestones,
                  { title: name, due, status: '进行中' },
                ],
              });
              setName('');
            }}
          >
            <Field label="里程碑名称">
              <input
                className="research-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="截止日期">
              <input
                className="research-input"
                required
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </Field>
            <button className="research-button">添加里程碑</button>
          </form>
          {data.milestones.map((m, i) => (
            <div
              className="flex justify-between border-b border-line py-3 text-sm"
              key={i}
            >
              <span>
                {m.title} · {m.due}
              </span>
              <button
                className="text-primary"
                onClick={() =>
                  save({
                    ...data,
                    milestones: data.milestones.map((v, j) =>
                      i === j
                        ? {
                            ...v,
                            status: v.status === '已完成' ? '进行中' : '已完成',
                          }
                        : v,
                    ),
                  })
                }
              >
                {m.status}
              </button>
            </div>
          ))}
        </>
      ) : (
        <>
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              save({
                ...data,
                risks: [
                  ...data.risks,
                  { title: name, owner, status: '待处理' },
                ],
              });
              setName('');
            }}
          >
            <Field label="风险与处理行动">
              <input
                className="research-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="责任人">
              <input
                className="research-input"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
              />
            </Field>
            <button className="research-button">登记风险</button>
          </form>
          {data.risks.map((r, i) => (
            <div
              className="flex justify-between gap-3 border-b border-line py-3 text-sm"
              key={i}
            >
              <span>
                {r.title} · {r.owner}
              </span>
              <button
                className="text-primary"
                onClick={() =>
                  save({
                    ...data,
                    risks: data.risks.map((v, j) =>
                      i === j
                        ? {
                            ...v,
                            status: v.status === '已闭环' ? '待处理' : '已闭环',
                          }
                        : v,
                    ),
                  })
                }
              >
                {r.status}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
