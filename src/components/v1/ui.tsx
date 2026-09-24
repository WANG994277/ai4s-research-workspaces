"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertCircle,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
export function Button({
  children,
  primary = false,
  danger = false,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      className={`v-button ${primary ? "primary" : ""} ${danger ? "danger" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const text = String(children);
  return (
    <span
      className={`v-badge ${/失败|异常|离线|故障|拒绝/.test(text) ? "bad" : /等待|审批|暂停|维护|审核|授权|待/.test(text) ? "wait" : /运行|完成|可用|有效|正常|通过|在线|发布|引用/.test(text) ? "good" : ""}`}
    >
      {children}
    </span>
  );
}
export function Empty({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="v-empty">
      <Inbox size={28} />
      <p>{children}</p>
      {action}
    </div>
  );
}
export function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="v-alert" role="status">
      <AlertCircle size={17} />
      <div>{children}</div>
    </div>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "搜索",
  onSubmit,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}) {
  return (
    <form
      className="v-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          aria-label="清空搜索"
          onClick={() => onChange("")}
        >
          <X size={15} />
        </button>
      )}
    </form>
  );
}
export function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="v-field">
      <span>
        {label}
        {required && <b aria-label="必填"> *</b>}
      </span>
      {children}
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  options: (
    | string
    | {
        value: string;
        label: string;
      }
  )[];
}) {
  return (
    <label className="v-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option
            key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}
          >
            {typeof o === "string" ? o : o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="v-tabs" role="tablist">
      {items.map((x) => (
        <button
          key={x}
          role="tab"
          aria-selected={x === value}
          className={x === value ? "selected" : ""}
          onClick={() => onChange(x)}
        >
          {x}
        </button>
      ))}
    </div>
  );
}
export function Modal({
  title,
  open,
  onClose,
  children,
  footer,
  bottom = false,
  wide = false,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  bottom?: boolean;
  wide?: boolean;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="v-overlay" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`v-modal ${bottom ? "bottom" : ""} ${wide ? "wide" : ""}`}
        >
          <header>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="v-icon" aria-label="关闭">
                <X size={20} />
              </button>
            </Dialog.Close>
          </header>
          <div className="v-modal-body">{children}</div>
          {footer && <footer>{footer}</footer>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Confirm({
  title,
  description,
  onConfirm,
  children,
}: {
  title: string;
  description: string;
  onConfirm: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button danger onClick={() => setOpen(true)}>
        {children}
      </Button>
      <Modal
        title={title}
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button
              primary
              onClick={() => {
                onConfirm();
                setOpen(false);
              }}
            >
              确认
            </Button>
          </>
        }
      >
        <p>{description}</p>
      </Modal>
    </>
  );
}
export function PageTitle({
  title,
  action,
  eyebrow,
}: {
  title: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="v-page-title">
      <div>
        {eyebrow && <span className="v-eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
      </div>
      {action}
    </header>
  );
}
export function Table({
  headers,
  rows,
  empty = "暂无数据",
}: {
  headers: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  return (
    <div className="v-table-wrap">
      <table className="v-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <Empty>{empty}</Empty>}
    </div>
  );
}
export function Details({ values }: { values: Record<string, ReactNode> }) {
  return (
    <dl className="v-details">
      {Object.entries(values).map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Pagination({
  page,
  total,
  onChange,
  size = 8,
}: {
  page: number;
  total: number;
  onChange: (n: number) => void;
  size?: number;
}) {
  const pages = Math.max(1, Math.ceil(total / size));
  return (
    <div className="v-pagination">
      <span>共 {total} 项</span>
      <Button
        aria-label="上一页"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <span>
        {page} / {pages}
      </span>
      <Button
        aria-label="下一页"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
export function Files({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [error, setError] = useState("");
  function add(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files);
    if (list.some((x) => x.size > 20 * 1024 * 1024)) {
      setError("单个文件不能超过 20 MB，请重新选择。");
      return;
    }
    setError("");
    onChange([
      ...value,
      ...list.map((x) => `${x.name} · ${(x.size / 1024).toFixed(1)} KB`),
    ]);
  }
  return (
    <div
      className="v-upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        add(e.dataTransfer.files);
      }}
    >
      <label>
        选择文件或拖拽到此处
        <input
          aria-label="上传附件"
          type="file"
          multiple
          onChange={(e) => add(e.target.files)}
        />
      </label>
      {value.map((f, i) => (
        <div key={i} className="v-file">
          {f}
          <Badge>已选择</Badge>
          <button
            aria-label={"移除 " + f}
            onClick={() => onChange(value.filter((_, n) => n !== i))}
          >
            <X size={14} />
          </button>
        </div>
      ))}
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
export function download(name: string, text: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AdvancedFilters({
  fields,
  value,
  onChange,
}: {
  fields: { key: string; label: string; options?: string[]; type?: string }[];
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        更多筛选
        {Object.values(value).filter(Boolean).length
          ? ` (${Object.values(value).filter(Boolean).length})`
          : ""}
      </Button>
      <Modal
        title="更多筛选"
        open={open}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button onClick={() => onChange({})}>清空筛选</Button>
            <Button primary onClick={() => setOpen(false)}>
              应用筛选
            </Button>
          </>
        }
      >
        <div className="v-form-grid">
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.options ? (
                <select
                  value={value[f.key] ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [f.key]: e.target.value })
                  }
                >
                  <option value="">全部</option>
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type ?? "text"}
                  value={value[f.key] ?? ""}
                  onChange={(e) =>
                    onChange({ ...value, [f.key]: e.target.value })
                  }
                />
              )}
            </Field>
          ))}
        </div>
      </Modal>
    </>
  );
}
