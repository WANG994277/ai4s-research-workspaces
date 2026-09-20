"use client";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronRight, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useResearchProject } from "@/components/research/workspace-kit";
import { useDoStore } from "./store";

export function Button({
  children,
  variant = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
}) {
  return (
    <button
      type="button"
      className={`do-btn ${variant} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function NavLink({
  to,
  children,
  primary = false,
}: {
  to: string;
  children: ReactNode;
  primary?: boolean;
}) {
  const { href } = useResearchProject();
  return (
    <Link className={`do-btn ${primary ? "primary" : ""}`} href={href(to)}>
      {children}
    </Link>
  );
}
export function Badge({ children }: { children: ReactNode }) {
  const text = String(children);
  const tone = /异常|冲突|退回|废止|终止|维护/.test(text)
    ? "danger"
    : /已完成|已定版|已确认|已制备|空闲|通过|已接入/.test(text)
      ? "success"
      : /待|审核|审批|暂停|部分/.test(text)
        ? "warning"
        : "neutral";
  return <span className={`do-badge ${tone}`}>{children}</span>;
}
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: string;
}) {
  return (
    <header className="do-page-head">
      <div>
        {back && (
          <NavLink to={back}>
            返回
            <ChevronRight size={12} />
          </NavLink>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className="do-row">{actions}</div>
    </header>
  );
}
export function Panel({
  title,
  actions,
  children,
  className = "",
  prd,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  prd?: string;
}) {
  return (
    <section className={`do-panel ${className}`} data-prd-id={prd}>
      {(title || actions) && (
        <div className="do-panel-head">
          <h2>{title}</h2>
          <div className="do-row">{actions}</div>
        </div>
      )}
      <div className="do-panel-body">{children}</div>
    </section>
  );
}
export function Tabs({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="do-tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item}
          role="tab"
          aria-selected={value === item}
          className={value === item ? "active" : ""}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
  drawer = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  drawer?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className={`do-space do-modal ${wide ? "do-modal-wide" : ""} ${drawer ? "do-drawer" : ""}`}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">
          查看信息，完成操作后可以关闭此窗口。
        </DialogDescription>
        <div className="do-modal-body">{children}</div>
        {footer && <div className="do-modal-footer">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
export function Confirm({
  open,
  onClose,
  title,
  children,
  onConfirm,
  label = "确认",
  disabled = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose}>返回检查</Button>
          <Button variant="primary" disabled={disabled} onClick={onConfirm}>
            <Check size={14} />
            {label}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
export function Empty({
  title = "暂无符合条件的记录",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="do-empty">
      <Search size={26} />
      <strong>{title}</strong>
      {children}
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="do-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = "搜索名称、编号…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="do-search">
      <Search size={15} />
      <input
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function download(
  name: string,
  body: string,
  mime = "text/markdown;charset=utf-8",
) {
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function useDo() {
  const store = useDoStore();
  const { project, href } = useResearchProject();
  const params = useSearchParams();
  const router = useRouter();
  return {
    ...store,
    project,
    href,
    params,
    router,
    projectPlans: store.plans.filter((x) => x.projectId === project.id),
    projectTasks: store.tasks.filter((x) => x.projectId === project.id),
    projectSamples: store.samples.filter((x) => x.projectId === project.id),
    projectResults: store.results.filter((x) => x.projectId === project.id),
    go: (path: string) => router.push(href(path)),
  };
}
