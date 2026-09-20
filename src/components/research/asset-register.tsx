'use client';
import { useState } from 'react';
import type { ResearchRecord } from '@/mock/research';
import { Modal, Field, useResearchProject } from './workspace-kit';
export function AssetRegister({
  onCreate,
}: {
  onCreate: (record: ResearchRecord) => void;
}) {
  const { project } = useResearchProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('DATA');
  const [description, setDescription] = useState('');
  return (
    <>
      <button className="research-primary" onClick={() => setOpen(true)}>
        登记科研资产
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="登记科研资产">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({
              id: `AST-${type}-${Date.now()}`,
              name,
              description,
              project: project.name,
              owner: '张博士',
              status: '待确认',
              updatedAt: new Date().toLocaleDateString('zh-CN'),
              source: 'AI4S',
              kind: 'asset',
            });
            setOpen(false);
            setName('');
            setDescription('');
          }}
        >
          <Field label="资产名称 / 版本">
            <input
              required
              className="research-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：催化剂数据集 v1"
            />
          </Field>
          <Field label="资产类型">
            <select
              className="research-input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="DATA">科研数据</option>
              <option value="KNOW">科研知识</option>
              <option value="RESULT">科研成果</option>
              <option value="MODEL">科研模型</option>
              <option value="PLAN">计算 / 实验方案</option>
            </select>
          </Field>
          <Field label="来源、用途与输入输出说明">
            <textarea
              required
              className="research-input min-h-28"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            所属课题：{project.name}
            ；新登记资产为待审核，仅记录元数据，不上传文件到外部系统。
          </p>
          <button className="research-primary">保存登记</button>
        </form>
      </Modal>
    </>
  );
}
