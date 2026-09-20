'use client';
import { useState } from 'react';
import { Modal } from './workspace-kit';
export function ResearchProfileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        aria-label="查看个人信息"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg p-1"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs text-primary">
          张
        </span>
        <span className="whitespace-nowrap text-xs font-medium">张博士</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="个人信息"
        description="当前为科研业务原型演示身份。"
      >
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <dt>姓名</dt>
          <dd>张博士</dd>
          <dt>研究方向</dt>
          <dd>催化化工</dd>
          <dt>职称</dt>
          <dd>高级研究员</dd>
        </dl>
      </Modal>
    </>
  );
}
