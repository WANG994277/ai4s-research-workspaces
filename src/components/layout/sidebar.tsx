'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BookOpen, Building2, ChevronDown, ChevronLeft, ChevronRight,
  Database, FlaskConical, FolderKanban,
  Gauge, LayoutDashboard, Users, Calculator,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { capabilities, visibleGroups, isCurrentCapability, navigationHref } from '@/lib/capabilities';
import { useSidebar, type DemoRole } from './sidebar-context';
import { cn } from '@/lib/utils';

const icons: Record<string, LucideIcon> = {
  科研协作: Users, 读空间: BookOpen, 算空间: Calculator, 做空间: FlaskConical,
  科研资产: Database, 科研驾驶舱: Gauge,
  科研项目管理: Building2,
};

const roles: { value: DemoRole; label: string }[] = [
  { value: 'researcher', label: '科研人员' },
  { value: 'lead', label: '课题负责人' },
  { value: 'manager', label: '科研管理人员' },
];

const projectManagementOrder = ['立项管理', '过程管理', '外协管理', '人才管理', '成果管理', '考核管理', '日常管理'];
const mergedChildren = ['RD-03','RD-07','CP-05','EX-04','EX-05'];
const workspaceLabels: Record<string,string> = { 'RD-02':'文献工作区', 'CP-04':'科研数据与模型', 'EX-03':'仪器与预约', 'EX-06':'实验执行与管理' };

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHref = `${pathname}?${searchParams.toString()}`;
  const { collapsed, toggleCollapsed, role, setRole } = useSidebar();
  const [openGroups, setOpenGroups] = useState<string[]>(['科研协作', '读空间']);
  const groups = visibleGroups(role);

  useEffect(() => {
    if (role === 'researcher') setOpenGroups(['科研协作', '读空间']);
    if (role === 'manager') setOpenGroups(['科研驾驶舱']);
    if (role === 'lead') setOpenGroups(['科研驾驶舱']);
  }, [role]);

  useEffect(() => {
    const active = capabilities.find((item) => isCurrentCapability(currentHref, item.href));
    if (active) setOpenGroups((current) => current.includes(active.group) ? current : [...current.slice(-1), active.group]);
  }, [currentHref]);

  const toggleGroup = (group: string) => {
    setOpenGroups((current) => current.includes(group)
      ? current.filter((name) => name !== group)
      : [...current.slice(-1), group]);
  };

  return (
    <aside className={cn('flex h-screen shrink-0 flex-col border-r border-line bg-white transition-[width] duration-200', collapsed ? 'w-16' : 'w-[232px]')}>
      <Link href="/workbench" className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3" aria-label="AI4S 工作台">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">A</span>
        {!collapsed && <span className="min-w-0"><strong className="block text-[13px] leading-tight text-primary">AI4S 科研平台</strong><small className="block text-[10px] leading-tight text-muted-foreground">PETROLAB</small></span>}
      </Link>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="主导航">
        <Link href="/workbench" title={collapsed ? '工作台' : undefined} className={cn('mb-2 flex h-9 items-center gap-2.5 rounded-md px-3 text-[13px] font-medium', pathname === '/workbench' ? 'border-l-[3px] border-primary bg-[#FCEBEC] pl-[9px] text-[#7F1116]' : 'text-foreground hover:bg-[#F6F7F9]')}>
          <LayoutDashboard className="size-4 shrink-0" />{!collapsed && '个人工作台'}
        </Link>
        {groups.map((group) => {
          const Icon = icons[group] ?? FolderKanban;
          const items = capabilities
            .filter((item) => item.group === group && item.nav !== '否' && !mergedChildren.includes(item.pageId))
            .sort((a, b) => group === '科研项目管理'
              ? projectManagementOrder.indexOf(a.label) - projectManagementOrder.indexOf(b.label)
              : 0);
          const open = openGroups.includes(group);
          return <div key={group} className="mb-1">
            <button type="button" title={collapsed ? group : undefined} aria-expanded={open} onClick={() => collapsed ? toggleCollapsed() : toggleGroup(group)} className="flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13px] font-medium text-foreground hover:bg-[#F6F7F9]">
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              {!collapsed && <><span className="min-w-0 flex-1 truncate">{group}</span><ChevronDown className={cn('size-3.5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} /></>}
            </button>
            {!collapsed && open && <div className="ml-4 border-l border-line pl-1">
              {items.map((item) => <Link key={item.id} href={navigationHref(item)} aria-current={isCurrentCapability(currentHref, item.href) ? 'page' : undefined} className={cn('my-0.5 block rounded-r-md border-l-[3px] border-transparent px-2 py-2 text-[12px] leading-snug text-muted-foreground hover:bg-[#F6F7F9] hover:text-foreground', isCurrentCapability(currentHref, item.href) && 'border-primary bg-secondary font-semibold text-primary')}>
                {workspaceLabels[item.pageId] ?? item.label}
              </Link>)}
            </div>}
          </div>;
        })}
      </nav>

      {!collapsed && <div className="border-t border-line px-3 py-3">
        <label htmlFor="demo-role" className="mb-1 block text-[11px] text-muted-foreground">演示角色</label>
        <select id="demo-role" value={role} onChange={(event) => setRole(event.target.value as DemoRole)} className="h-8 w-full rounded-md border border-line bg-white px-2 text-xs text-foreground focus-visible:outline-2 focus-visible:outline-primary">
          {roles.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
        </select>
      </div>}
      <div className="border-t border-line p-2">
        <button onClick={toggleCollapsed} className="flex h-8 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-[#F6F7F9]" aria-label={collapsed ? '展开导航' : '收起导航'}>
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </button>
      </div>
    </aside>
  );
}
