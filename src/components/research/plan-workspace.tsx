'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSidebar } from '@/components/layout/sidebar-context';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Modal,
  Status,
  Notice,
  Empty,
  useLocalState,
  useResearchProject,
  downloadText,
} from './workspace-kit';
type Plan = {
  id: string;
  projectId: string;
  name: string;
  template: string;
  version: number;
  status: string;
  parameters: string;
  steps: string;
  history: string[];
  signatures?: string[];
};
export function PlanWorkspace() {
  const { project, href } = useResearchProject();
  const { role } = useSidebar();
  const [plans, setPlans] = useLocalState<Plan[]>('ai4s-plans-v2', []);
  const [selected, setSelected] = useState('');
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('催化活性评价');
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState('');
  const rows = plans.filter((p) => p.projectId === project.id);
  const plan = rows.find((p) => p.id === selected) ?? rows[0];
  const editable = plan?.status === '草稿';
  function patch(changes: Partial<Plan>) {
    if (plan)
      setPlans((all) =>
        all.map((p) => (p.id === plan.id ? { ...p, ...changes } : p)),
      );
  }
  function change(status: string) {
    if (plan && status === '已定版') {
      if (role !== 'lead' && role !== 'manager') return;
      const signatures = [...new Set([...(plan.signatures ?? []), role])];
      const complete =
        signatures.includes('lead') && signatures.includes('manager');
      patch({
        signatures,
        status: complete ? '已定版' : '待审核',
        history: [
          ...plan.history,
          `${new Date().toLocaleString('zh-CN')} ${role === 'lead' ? '课题负责人' : '科研管理人员'}会签通过：${review || '同意'}`,
        ],
      });
      setReview('');
      setNotice(
        complete
          ? '会签完成，方案已定版锁定。'
          : '本角色已完成会签，等待另一审核角色确认。',
      );
      return;
    }
    if (plan)
      patch({
        status,
        signatures: [],
        history: [
          ...plan.history,
          `${new Date().toLocaleString('zh-CN')} ${status}：${review || '确认'}（${role === 'researcher' ? '科研人员' : '课题负责人/管理人员'}）`,
        ],
      });
    setReview('');
    setNotice(
      status === '已定版'
        ? '方案已锁定，后续修改需创建新版本。'
        : `方案已${status}。`,
    );
  }
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="实验方案设计"
        description="从模板创建方案，编辑参数和步骤，审核后锁定版本并用于实验执行。"
      >
        <button className="research-primary" onClick={() => setCreate(true)}>
          新建实验方案
        </button>
      </WorkspaceHeader>
      {notice && <Notice>{notice}</Notice>}
      <div className="grid grid-cols-[240px_minmax(0,1fr)] gap-5">
        <Panel title="课题方案">
          {rows.map((p) => (
            <button
              className={`mb-2 w-full rounded-lg border p-3 text-left ${plan?.id === p.id ? 'border-primary bg-secondary' : 'border-line'}`}
              key={p.id}
              onClick={() => setSelected(p.id)}
            >
              <span className="block text-sm">{p.name}</span>
              <small>
                v{p.version} · {p.status}
              </small>
            </button>
          ))}
          <Link
            className="research-button mt-4"
            href={href('/experiment-design')}
          >
            进入因子与 DOE 设计
          </Link>
        </Panel>
        <Panel title={plan?.name ?? '方案编辑'}>
          {plan ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Status>{plan.template}</Status>
                <Status>v{plan.version}</Status>
                <Status>{plan.status}</Status>
              </div>
              <Field label="实验参数 / 范围 / 单位">
                <textarea
                  className="research-input min-h-28"
                  readOnly={!editable}
                  value={plan.parameters}
                  onChange={(e) => patch({ parameters: e.target.value })}
                />
              </Field>
              <Field label="操作步骤与安全要求">
                <textarea
                  className="research-input min-h-48"
                  readOnly={!editable}
                  value={plan.steps}
                  onChange={(e) => patch({ steps: e.target.value })}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {editable && (
                  <button
                    className="research-primary"
                    disabled={!plan.parameters.trim() || !plan.steps.trim()}
                    onClick={() => change('待审核')}
                  >
                    提交方案审核
                  </button>
                )}
                {plan.status === '待审核' && role !== 'researcher' && (
                  <>
                    <Field label="审核意见">
                      <input
                        className="research-input"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                      />
                    </Field>
                    <button
                      className="research-primary"
                      disabled={plan.signatures?.includes(role)}
                      onClick={() => change('已定版')}
                    >
                      {plan.signatures?.includes(role)
                        ? '本角色已会签'
                        : '提交会签意见'}
                    </button>
                    <button
                      className="research-button"
                      onClick={() => change('草稿')}
                    >
                      退回修改
                    </button>
                  </>
                )}
                {plan.status === '待审核' && role === 'researcher' && (
                  <p className="text-sm text-muted-foreground">
                    等待课题负责人审核，提交版本已锁定。
                  </p>
                )}
                {plan.status === '已定版' && (
                  <Link
                    className="research-primary"
                    href={href('/experiments', `${plan.id}@v${plan.version}`)}
                  >
                    用于实验执行
                  </Link>
                )}
                <button
                  className="research-button"
                  onClick={() => {
                    const id = `PLAN-${Date.now()}`;
                    setPlans((all) => [
                      ...all,
                      {
                        ...plan,
                        id,
                        version: plan.version + 1,
                        status: '草稿',
                        signatures: [],
                        history: [
                          ...plan.history,
                          `从${plan.id} v${plan.version}创建新版本`,
                        ],
                      },
                    ]);
                    setSelected(id);
                  }}
                >
                  复制为新版本
                </button>
                <button
                  className="research-button"
                  onClick={() =>
                    downloadText(
                      `${plan.name}-v${plan.version}.md`,
                      `${plan.parameters}\n\n${plan.steps}\n\n${plan.history.join('\n')}`,
                    )
                  }
                >
                  导出方案
                </button>
              </div>
              <details className="border-t border-line pt-4 text-sm">
                <summary className="cursor-pointer font-medium">
                  版本与审批记录
                </summary>
                <ul className="mt-3 space-y-2">
                  {plan.history.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <Empty message="先从模板创建实验方案，再配置因子、参数与执行要求。" />
          )}
        </Panel>
      </div>
      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="选择方案模板"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const id = `PLAN-${Date.now()}`;
            setPlans((all) => [
              ...all,
              {
                id,
                name,
                projectId: project.id,
                template,
                version: 1,
                status: '草稿',
                parameters:
                  '温度（°C）：待填写\n压力（MPa）：待填写\n样品与批次：待关联',
                steps:
                  '1. 检查样品、设备和人员资质\n2. 核验参数与安全要求\n3. 执行并记录实验数据\n4. 汇总结果与异常',
                history: ['由模板创建方案草稿'],
              },
            ]);
            setSelected(id);
            setCreate(false);
            setName('');
          }}
        >
          <Field label="方案名称">
            <input
              className="research-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="方案模板">
            <select
              className="research-input"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              <option>催化活性评价</option>
              <option>正交实验 / DOE</option>
              <option>材料表征分析</option>
            </select>
          </Field>
          <button className="research-primary">创建方案草稿</button>
        </form>
      </Modal>
    </div>
  );
}
