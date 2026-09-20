'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Search,
  type LucideIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  seedData,
  today,
  uid,
  type Activity,
  type CollaborationData,
  type ResearchFile,
} from './model';
import s from './collaboration.module.css';
export { s };
const storageKey = 'ai4s-collaboration-redesign-v1';

export function useCollaborationData() {
  const [data, setData] = useState<CollaborationData>(seedData);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed.version === 1 &&
          Array.isArray(parsed.projects) &&
          Array.isArray(parsed.files) &&
          Array.isArray(parsed.experiments) &&
          Array.isArray(parsed.experts) &&
          Array.isArray(parsed.consultations)
        )
          setData(parsed);
        else throw new Error('Invalid collaboration data');
      } else {
        const imported = JSON.parse(
          localStorage.getItem('ai4s-notes-v2') ?? '[]',
        ) as {
          id: string;
          projectId: string;
          title: string;
          body: string;
          tags: string;
          version: number;
          versions: { version: number; body: string; time: string }[];
          comments: string[];
          shared: boolean;
        }[];
        const legacyFiles: ResearchFile[] = Array.isArray(imported)
          ? imported.map((n) => ({
              id: n.id,
              name: n.title,
              type: '笔记',
              projectId: n.projectId,
              folder: '笔记',
              tags: (n.tags ?? '').split(',').filter(Boolean),
              author: '张博士',
              updated: today,
              content: n.body ?? '',
              version: n.version ?? 1,
              versions: (n.versions ?? []).map((v) => ({
                version: v.version,
                content: v.body,
                time: v.time,
                author: '张博士',
              })),
              comments: (n.comments ?? []).map((content) => ({
                author: '张博士',
                content,
                time: today,
                resolved: false,
              })),
              shares: n.shared
                ? [{ recipient: '课题成员', permission: '可查看' }]
                : [],
              refs: [],
              favorite: false,
              deleted: false,
            }))
          : [];
        const legacyTasks = JSON.parse(
          localStorage.getItem('ai4s-project-tasks-v2') ?? '[]',
        ) as {
          id: string;
          projectId: string;
          title: string;
          owner: string;
          due: string;
          status: string;
        }[];
        const legacyConfig = JSON.parse(
          localStorage.getItem('ai4s-project-collaboration') ?? '{}',
        ) as Record<
          string,
          {
            members?: { name: string; role: string }[];
            milestones?: { title: string; due: string; status: string }[];
          }
        >;
        const projects = seedData.projects.map((p) => {
          const config = legacyConfig[p.id];
          const tasks = (Array.isArray(legacyTasks) ? legacyTasks : [])
            .filter((t) => t.projectId === p.id)
            .map((t) => ({
              id: t.id,
              name: t.title,
              owner: t.owner,
              due: t.due,
              status: t.status,
              risk: '',
            }));
          return {
            ...p,
            tasks: [...p.tasks, ...tasks],
            members: config?.members?.length
              ? config.members.map((m) => ({
                  ...m,
                  responsibility: '既有课题分工',
                }))
              : p.members,
            milestones: [
              ...p.milestones,
              ...(config?.milestones ?? []).map((m, i) => ({
                id: `LEGACY-${p.id}-${i}`,
                name: m.title,
                due: m.due,
                status: m.status,
              })),
            ],
          };
        });
        setData({
          ...seedData,
          projects,
          files: [...seedData.files, ...legacyFiles],
        });
      }
    } catch {
      setStorageError(
        '本地协作记录读取失败，原始记录未覆盖。当前展示示例数据，更改暂不持久保存。',
      );
      return;
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      setStorageError(
        '浏览器存储空间不足，本次更改尚未持久保存。请导出重要内容。',
      );
    }
  }, [data, ready]);
  return { data, setData, ready, storageError };
}
export function useLocation() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const detail = params.get('detail');
  const view = params.get('view');
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.querySelector('main')?.scrollTo({ top: 0 });
    });
    return () => cancelAnimationFrame(frame);
  }, [detail, view]);
  return {
    params,
    get: (key: string, fallback = '') => params.get(key) ?? fallback,
    set: (patch: Record<string, string | undefined>, replace = false) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch))
        if (value) next.set(key, value);
        else next.delete(key);
      const url = `${pathname}${next.size ? '?' + next.toString() : ''}`;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: !patch.tab });
    },
    open: (id: string) => {
      const next = new URLSearchParams(params.toString());
      next.set('detail', id);
      next.delete('tab');
      router.push(`${pathname}?${next}`);
    },
    back: () => {
      const next = new URLSearchParams(params.toString());
      next.delete('detail');
      next.delete('tab');
      router.push(`${pathname}${next.size ? '?' + next : ''}`);
    },
  };
}
export function Header({
  title,
  description,
  children,
  back,
  trail,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  back?: () => void;
  trail?: string;
}) {
  return (
    <div>
      {back ? (
        <button className={s.back} onClick={back}>
          <ArrowLeft size={14} />
          返回{trail ?? '列表'}
        </button>
      ) : (
        <div className={s.eyebrow}>科研协作 / {title}</div>
      )}
      <header className={s.hero}>
        <div>
          <h1 className={s.title}>{title}</h1>
          {description && <p className={s.subtitle}>{description}</p>}
        </div>
        <div className={s.actions}>{children}</div>
      </header>
    </div>
  );
}
export function TabBar({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <nav className={s.tabs} aria-label="协作页面视图">
      {tabs.map((t) => (
        <button
          key={t.key}
          aria-current={value === t.key ? 'page' : undefined}
          className={`${s.tab} ${value === t.key ? s.tabActive : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
export function Panel({
  title,
  children,
  actions,
  padded = true,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={s.panel}>
      {title && (
        <div className={s.panelHead}>
          <h2 className={s.panelTitle}>{title}</h2>
          <div className={s.actions}>{actions}</div>
        </div>
      )}
      <div className={padded ? s.panelBody : undefined}>{children}</div>
    </section>
  );
}
export function Badge({ value }: { value: string }) {
  const cls = /完成|在研|可咨询|已接收|已关闭|已通过/.test(value)
    ? s.badgeGreen
    : /异常|高|待处理/.test(value)
      ? s.badgeRed
      : /交接|审核|需预约|处理中/.test(value)
        ? s.badgeOrange
        : /进行|规划|准备|结果处理/.test(value)
          ? s.badgeBlue
          : s.badgeGray;
  return <span className={`${s.badge} ${cls}`}>{value}</span>;
}
export function Tags({ values }: { values: string[] }) {
  return (
    <div className={s.tags}>
      {values.map((v, i) => (
        <span className={s.tag} key={`${v}-${i}`}>
          {v}
        </span>
      ))}
    </div>
  );
}
export function Stats({
  items,
}: {
  items: {
    label: string;
    value: number;
    icon: LucideIcon;
    tone: 'rose' | 'green' | 'blue' | 'orange';
    unit?: string;
  }[];
}) {
  return (
    <div className={s.stats}>
      {items.map(({ label, value, icon: Icon, tone, unit = '个' }) => (
        <div key={label} className={`${s.stat} ${s[tone]}`}>
          <div className={s.statIcon}>
            <Icon size={25} />
          </div>
          <div>
            <p className={s.statLabel}>{label}</p>
            <strong className={s.statNumber}>
              {value}
              <span className={s.statUnit}>{unit}</span>
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Filter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className={s.filter}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">全部</option>
        {[...new Set(options)].filter(Boolean).map((v) => (
          <option key={v}>{v}</option>
        ))}
      </select>
    </label>
  );
}
export function SearchBox({
  value,
  onChange,
  placeholder = '搜索名称、负责人、关键词',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={`${s.filter} ${s.search}`}>
      <span>关键词检索</span>
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
export function Pagination({
  total,
  page,
  size = 6,
  onChange,
}: {
  total: number;
  page: number;
  size?: number;
  onChange: (page: number) => void;
}) {
  const count = Math.max(1, Math.ceil(total / size));
  return (
    <div className={s.pager}>
      <span>
        共 {total} 条记录 · 每页 {size} 条
      </span>
      <div className={s.actions}>
        <button
          className={s.page}
          aria-label="上一页"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: count }, (_, i) => i + 1)
          .filter((n) => n === 1 || n === count || Math.abs(n - page) < 2)
          .map((n) => (
            <button
              key={n}
              className={`${s.page} ${page === n ? s.pageActive : ''}`}
              aria-label={`第 ${n} 页`}
              aria-current={page === n ? 'page' : undefined}
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          ))}
        <button
          className={s.page}
          aria-label="下一页"
          disabled={page >= count}
          onClick={() => onChange(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
export function pageSlice<T>(rows: T[], requested: string, size = 6) {
  const page = Math.min(
    Math.max(1, Number(requested) || 1),
    Math.max(1, Math.ceil(rows.length / size)),
  );
  return { page, rows: rows.slice((page - 1) * size, page * size) };
}
export function Empty({
  message = '暂无匹配记录，请调整筛选条件。',
  children,
}: {
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div className={s.empty}>
      <FolderOpen size={32} />
      <p>{message}</p>
      {children}
    </div>
  );
}
export function Notice({ message }: { message: string }) {
  return message ? (
    <p role="status" className={s.notice}>
      {message}
    </p>
  ) : null;
}
export function Timeline({ items }: { items: Activity[] }) {
  return items.length ? (
    <ol className={s.timeline}>
      {items
        .slice()
        .reverse()
        .map((a) => (
          <li className={s.timelineItem} key={a.id}>
            <strong>{a.actor}</strong>
            <p>{a.action}</p>
            <small className={s.sub}>{a.time}</small>
          </li>
        ))}
    </ol>
  ) : (
    <p className={s.sectionIntro}>暂无协作动态</p>
  );
}
export function Metadata({
  items,
}: {
  items: { label: string; value: ReactNode; wide?: boolean }[];
}) {
  return (
    <dl className={s.metadata}>
      {items.map(({ label, value, wide }) => (
        <div className={wide ? s.wide : undefined} key={label}>
          <dt>{label}</dt>
          <dd>{value || '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
export type FormField = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'date' | 'select';
  options?: string[];
  required?: boolean;
  wide?: boolean;
  value?: string;
  placeholder?: string;
};
export function FormDialog({
  title,
  description,
  fields,
  submit = '保存',
  onSubmit,
  onClose,
}: {
  title: string;
  description?: string;
  fields: FormField[];
  submit?: string;
  onSubmit: (values: Record<string, string>) => void | string;
  onClose: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      fields.map((f) => [
        f.key,
        f.value ?? (f.type === 'select' ? (f.options?.[0] ?? '') : ''),
      ]),
    ),
  );
  const [error, setError] = useState('');
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[660px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description ?? '填写相关信息，操作将记录到当前协作对象。'}
          </DialogDescription>
        </DialogHeader>
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            for (const f of fields)
              if (f.required && !values[f.key]?.trim())
                return setError(`请填写${f.label}`);
            const result = onSubmit(
              Object.fromEntries(
                Object.entries(values).map(([k, v]) => [k, v.trim()]),
              ),
            );
            if (typeof result === 'string') setError(result);
          }}
        >
          {fields.map((f) => (
            <label
              key={f.key}
              className={`${s.field} ${f.wide || f.type === 'textarea' ? s.wide : ''}`}
            >
              <span>
                {f.label}
                {f.required && (
                  <span style={{ color: 'var(--primary)' }}> *</span>
                )}
              </span>
              {f.type === 'textarea' ? (
                <textarea
                  value={values[f.key]}
                  required={f.required}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                  placeholder={f.placeholder}
                />
              ) : f.type === 'select' ? (
                <select
                  value={values[f.key]}
                  required={f.required}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                >
                  {f.options?.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={values[f.key]}
                  required={f.required}
                  onChange={(e) =>
                    setValues({ ...values, [f.key]: e.target.value })
                  }
                  placeholder={f.placeholder}
                />
              )}
            </label>
          ))}
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          <div className={s.formFooter}>
            <button type="button" className={s.button} onClick={onClose}>
              取消
            </button>
            <button type="submit" className={s.primary}>
              {submit}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
export const projectOptions = (data: CollaborationData) =>
  data.projects.map((p) => p.name);
export function documentPreview(content: string) {
  return content.split('\n').map((line, i) =>
    line.startsWith('## ') ? (
      <h2 key={i}>{line.slice(3)}</h2>
    ) : line.startsWith('- ') ? (
      <ul key={i}>
        <li>{line.slice(2)}</li>
      </ul>
    ) : (
      <p key={i}>{line || '\u00a0'}</p>
    ),
  );
}
export async function uploadRecord(
  file: File,
  projectId: string,
  refs: ResearchFile['refs'] = [],
): Promise<ResearchFile> {
  if (file.size > 2 * 1024 * 1024)
    throw new Error('本地演示附件限2MB，请选择更小的文件。');
  const text = /\.(txt|md)$/i.test(file.name);
  const image = file.type.startsWith('image/');
  const pdf = file.type === 'application/pdf';
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('文件读取失败，请重试'));
    reader.readAsDataURL(file);
  });
  return {
    id: uid('DOC'),
    name: file.name,
    type: text
      ? '笔记'
      : pdf
        ? 'PDF'
        : image
          ? '图片'
          : /\.(xlsx|csv)$/i.test(file.name)
            ? '数据'
            : '文档',
    projectId,
    folder: text ? '笔记' : /\.(xlsx|csv)$/i.test(file.name) ? '数据' : '文档',
    tags: [],
    author: '张博士',
    updated: today,
    content: text ? await file.text() : '',
    version: 1,
    versions: [],
    comments: [],
    shares: [],
    refs,
    favorite: false,
    deleted: false,
    dataUrl,
    mime: file.type,
    size: file.size,
  };
}
