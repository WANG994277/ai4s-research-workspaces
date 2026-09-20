'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import type { Capability } from '@/lib/capabilities';
import { capabilities } from '@/lib/capabilities';
import requirements from '@/data/page-requirements.json';
import {
  WorkspaceHeader,
  Panel,
  Notice,
  useResearchProject,
} from './workspace-kit';

export function IntegrationPlaceholder({ item }: { item: Capability }) {
  const { project, href } = useResearchProject();
  const [notice, setNotice] = useState(false);
  const spec = requirements.find((p) => p.id === item.pageId);
  const isProject = item.group === '科研项目管理';
  const source = isProject ? '川庆科研管理 / 数智员工' : 'AI 中台';
  const siblings = capabilities.filter((p) =>
    isProject ? p.group === item.group : ['CP-04', 'CP-05'].includes(p.pageId),
  );
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title={item.label}
        description={`通过 ${source} 提供业务能力，AI4S 保留课题上下文及结果返回位置。`}
      />
      {siblings.length > 1 && (
        <nav aria-label="来源系统业务" className="flex flex-wrap gap-2">
          {siblings.map((p) => (
            <Link
              key={p.id}
              href={href(p.href)}
              aria-current={p.id === item.id ? 'page' : undefined}
              className={`research-button ${p.id === item.id ? 'border-primary text-primary' : ''}`}
            >
              {p.label}
            </Link>
          ))}
        </nav>
      )}
      <Panel title="来源系统能力">
        <div className="flex items-start gap-4">
          <ExternalLink className="size-8 shrink-0 text-blue" />
          <div>
            <p className="font-medium">{source}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              当前课题：{project.name}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {project.id} · 来源系统尚未连接
            </p>
          </div>
        </div>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {spec?.children.map((f) => (
            <div className="py-4" key={f.id}>
              <h2 className="text-sm font-semibold">{f.name}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {f.description ||
                  f.requirements.join('；') ||
                  '由来源系统办理并返回处理结果。'}
              </p>
            </div>
          ))}
        </div>
        <button
          className="research-primary mt-5"
          onClick={() => setNotice(true)}
        >
          查看接入状态
        </button>
      </Panel>
      {notice && (
        <Notice>
          此功能为占位入口。正式地址及单点登录接入后，将携带当前课题、来源对象和返回路径跳转；当前不会提交或执行真实任务。
        </Notice>
      )}
    </div>
  );
}
