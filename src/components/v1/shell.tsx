"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Box,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  FileText,
  FlaskConical,
  FolderArchive,
  Home,
  Layers3,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  UserRound,
  Wrench,
} from "lucide-react";
import { ResearchRuntime, notify, useResearch } from "./store";
import {
  moduleForPath,
  modules,
  visibleModule,
  visibleModules,
} from "./navigation";
import { canEnter, scopeKey, spaceLabels } from "./domain";
import { profiles, roleNames } from "./seed";
import { groupResearchSpaces, isSpaceSwitchable } from "./workspace-view";
import { Alert, Badge, Button, Empty, Modal, SearchBox } from "./ui";
import "./v1.css";

const iconByModule = {
  workspace: Home,
  knowledge: BookOpen,
  skills: Layers3,
  models: Box,
  tools: Wrench,
  lab: FlaskConical,
  assets: FolderArchive,
  "space-management": Network,
  "research-management": ClipboardList,
  "research-decision": ChartNoAxesCombined,
  "project-management-external": BriefcaseBusiness,
  admin: Settings,
} as const;

const groups = [
  "科研执行",
  "科研协同与管理",
  "科研决策",
  "科研项目管理",
  "系统管理",
];

export function BaselineShell({ children }: { children: ReactNode }) {
  const { s, p, space, loaded, toast, mutate } = useResearch();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const current = moduleForPath(pathname);
  const allowedModules = visibleModules(p);
  const firstAllowed = allowedModules[0];
  const [collapsed, setCollapsed] = useState(false);
  const [panel, setPanel] = useState("");
  const [spaceQuery, setSpaceQuery] = useState("");
  const [pendingSpace, setPendingSpace] = useState("");
  const [globalQuery, setGlobalQuery] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [expandedSpaceProjects, setExpandedSpaceProjects] = useState<string[]>(
    space.projectId ? [space.projectId] : [],
  );

  const queryString = searchParams.toString();
  const currentUrl = `${pathname}${queryString ? `?${queryString}` : ""}`;
  const activeWorkspace =
    pathname === "/workspace" &&
    (searchParams.has("session") || searchParams.has("task"));
  const hasCurrentAccess = !current || visibleModule(current.id, p);

  useEffect(() => {
    if (loaded && !hasCurrentAccess && firstAllowed)
      router.replace(firstAllowed.href);
  }, [firstAllowed, hasCurrentAccess, loaded, router]);
  const spaces = useMemo(
    () =>
      s.spaces.filter(
        (item) =>
          canEnter(s, p, item.id) &&
          item.status !== "ARCHIVED" &&
          item.status !== "CLOSED" &&
          `${item.name} ${s.projects.find((project) => project.id === item.projectId)?.name ?? ""}`.includes(
            spaceQuery,
          ),
      ),
    [p, s, spaceQuery],
  );
  const spaceGroups = useMemo(
    () => groupResearchSpaces(spaces, s.projects),
    [s.projects, spaces],
  );

  function switchSpace(id: string) {
    mutate("已切换科研空间", id, (draft) => {
      if (!canEnter(draft, p, id)) throw new Error("无空间访问权限。");
      const nextSpace = draft.spaces.find((item) => item.id === id);
      if (!nextSpace || !isSpaceSwitchable(nextSpace))
        throw new Error("暂停、归档或关闭的空间不能切换进入。");
      draft.spaceId = id;
    });
    setPanel("");
    setPendingSpace("");
    router.replace(current?.href ?? "/workspace");
  }

  function isChildActive(href: string) {
    return decodeURIComponent(currentUrl) === decodeURIComponent(href);
  }

  function submitGlobalSearch() {
    const value = globalQuery.trim();
    if (!value) return;
    setPanel("");
    router.push(
      `/knowledge?q=${encodeURIComponent(value)}&searched=1&mode=${encodeURIComponent("智能检索")}`,
    );
  }

  return (
    <div
      className={`v-app ${collapsed ? "collapsed" : ""} ${activeWorkspace ? "workspace-active" : ""}`}
    >
      <ResearchRuntime />
      <a className="v-skip" href="#v-main">
        跳至主内容
      </a>

      <aside className="v-sidebar">
        <Link className="v-logo" href={firstAllowed?.href ?? "/workspace"}>
          <Image
            src="/v1/ai4s-logo.png"
            alt="AI4S · AI for Science"
            width={160}
            height={70}
            priority
          />
        </Link>

        <nav aria-label="平台功能导航">
          {groups.map((group) => {
            const items = allowedModules.filter(
              (module) => module.group === group,
            );
            if (!items.length) return null;
            return (
              <section className="v-nav-group" key={group} aria-label={group}>
                {!collapsed && <p>{group}</p>}
                {items.map((module) => {
                  const Icon =
                    iconByModule[module.id as keyof typeof iconByModule];
                  const active = current?.id === module.id;
                  const open = expanded.includes(module.id);
                  return (
                    <div
                      className={`v-nav-module ${active ? "active" : ""}`}
                      key={module.id}
                    >
                      <div className="v-nav-parent">
                        <Link
                          href={module.href}
                          title={module.name}
                          aria-current={active ? "page" : undefined}
                        >
                          <Icon size={18} />
                          {!collapsed && <span>{module.name}</span>}
                        </Link>
                        {!collapsed && module.children.length > 0 && (
                          <button
                            type="button"
                            aria-label={`${open ? "收起" : "展开"}${module.name}`}
                            aria-expanded={open}
                            onClick={() =>
                              setExpanded((value) =>
                                value.includes(module.id)
                                  ? value.filter((id) => id !== module.id)
                                  : [...value, module.id],
                              )
                            }
                          >
                            {open ? (
                              <ChevronDown size={15} />
                            ) : (
                              <ChevronRight size={15} />
                            )}
                          </button>
                        )}
                      </div>

                      {!collapsed && module.children.length > 0 && open && (
                        <div className="v-nav-children">
                          {module.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={
                                isChildActive(child.href) ? "active" : ""
                              }
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </nav>

        <div className="v-sidebar-bottom">
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "展开导航" : "收起导航"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
          {!collapsed && <span>AI4S 科研平台 · 原型</span>}
        </div>
      </aside>

      <div className="v-frame">
        <header className="v-topbar">
          <div className="v-top-title">
            <span>当前页面：</span>
            <strong>{current?.name ?? "科研平台"}</strong>
          </div>
          <div className="v-top-actions">
            <button
              type="button"
              className="v-top-search"
              onClick={() => {
                setGlobalQuery("");
                setPanel("search");
              }}
            >
              <Search size={17} />
              <span>搜索文献、数据、工具或提问…</span>
            </button>
            <button
              type="button"
              className="v-space-button"
              onClick={() => {
                setSpaceQuery("");
                setPanel("space");
              }}
            >
              <span>当前空间：</span>
              <strong>{space?.name ?? "个人空间"}</strong>
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              className="v-icon"
              aria-label="通知"
              onClick={() => setPanel("notifications")}
            >
              <Bell size={19} />
              {s.decisions.some(
                (decision) =>
                  decision.assignee === p.id && decision.status === "pending",
              ) && <i />}
            </button>
            <button
              type="button"
              className="v-icon"
              aria-label="帮助"
              onClick={() => setPanel("help")}
            >
              <CircleHelp size={19} />
            </button>
            <button
              type="button"
              className="v-user"
              onClick={() => setPanel("profile")}
              aria-label="用户入口"
            >
              <span>{p.name[0]}</span>
              <span>{p.name}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        <main id="v-main" className="v-main" tabIndex={-1} aria-busy={!loaded}>
          {!hasCurrentAccess ? (
            <Empty>正在进入当前账号可访问的模块…</Empty>
          ) : (
            children
          )}
        </main>
      </div>

      {toast && (
        <div className="v-toast" role="status" aria-live="polite">
          <Check size={16} />
          {toast}
          <button
            type="button"
            aria-label="关闭提示"
            onClick={() => notify("")}
          >
            ×
          </button>
        </div>
      )}

      <Modal
        title="全局知识检索"
        open={panel === "search"}
        onClose={() => setPanel("")}
      >
        <SearchBox
          value={globalQuery}
          onChange={setGlobalQuery}
          onSubmit={submitGlobalSearch}
          placeholder="搜索文献、数据、工具或输入科研问题"
        />
        <div className="v-actions v-section">
          <Button
            primary
            disabled={!globalQuery.trim()}
            onClick={submitGlobalSearch}
          >
            进入知识中心检索
          </Button>
        </div>
      </Modal>

      <Modal
        title="切换科研空间"
        open={panel === "space"}
        onClose={() => setPanel("")}
        wide
      >
        <div className="v-space-tree">
          <SearchBox
            value={spaceQuery}
            onChange={setSpaceQuery}
            placeholder="搜索空间名称"
          />

          <div className="v-space-tree-section personal">
            {spaceGroups.personal.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`v-space-option ${item.id === space.id ? "selected" : ""}`}
                disabled={!isSpaceSwitchable(item)}
                onClick={() => {
                  if (
                    s.drafts[scopeKey(p, space.id)] ||
                    document.querySelector('[data-unsaved="true"]')
                  )
                    setPendingSpace(item.id);
                  else switchSpace(item.id);
                }}
              >
                <UserRound size={20} />
                <div>
                  <strong>个人空间</strong>
                  <small>{spaceLabels[item.status]}</small>
                </div>
                {item.id === space.id && <Check size={19} />}
              </button>
            ))}
          </div>

          <div className="v-space-tree-label">
            <span>项目空间</span>
            <i />
          </div>

          <div className="v-space-projects">
            {spaceGroups.projects.map((group) => {
              const open =
                !!spaceQuery ||
                group.project.id === space.projectId ||
                expandedSpaceProjects.includes(group.project.id);
              return (
                <section className="v-space-project" key={group.project.id}>
                  <button
                    type="button"
                    className="v-space-project-toggle"
                    aria-expanded={open}
                    onClick={() =>
                      setExpandedSpaceProjects((value) =>
                        value.includes(group.project.id)
                          ? value.filter((id) => id !== group.project.id)
                          : [...value, group.project.id],
                      )
                    }
                  >
                    {open ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    )}
                    <Network size={20} />
                    <strong>{group.project.name}</strong>
                  </button>
                  {open && (
                    <div className="v-space-project-children">
                      {[...(group.projectSpace ? [group.projectSpace] : []), ...group.topics].map(
                        (item) => (
                          <button
                            type="button"
                            key={item.id}
                          className={`v-space-option ${item.id === space.id ? "selected" : ""}`}
                            disabled={!isSpaceSwitchable(item)}
                            onClick={() => {
                              if (
                                s.drafts[scopeKey(p, space.id)] ||
                                document.querySelector('[data-unsaved="true"]')
                              )
                                setPendingSpace(item.id);
                              else switchSpace(item.id);
                            }}
                          >
                            <FileText size={19} />
                            <div>
                              <strong>
                                {item.type === "PROJECT" ? "项目空间" : item.name}
                              </strong>
                              <small>
                                {item.type === "PROJECT" ? "项目空间" : "课题空间"}
                                {" · "}
                                {spaceLabels[item.status]}
                              </small>
                            </div>
                            {item.id === space.id && <Check size={19} />}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
          {!spaces.length && <Empty>没有匹配的科研空间。</Empty>}
        </div>
      </Modal>

      <Modal
        title="切换空间"
        open={!!pendingSpace}
        onClose={() => setPendingSpace("")}
        footer={
          <>
            <Button onClick={() => setPendingSpace("")}>取消</Button>
            <Button primary onClick={() => switchSpace(pendingSpace)}>
              继续切换
            </Button>
          </>
        }
      >
        <p>
          当前页面存在未提交内容。会话草稿保留在原空间，其他未提交表单将丢弃；已有对象不会迁移。
        </p>
      </Modal>

      <Modal
        title="用户与演示角色"
        open={panel === "profile"}
        onClose={() => setPanel("")}
      >
        <Alert>角色切换用于验证导航、操作权限与数据范围。</Alert>
        {Object.entries(profiles).map(([key, profile]) => (
          <button
            type="button"
            className="v-space-option"
            key={key}
            onClick={() => {
              setExpanded([]);
              mutate("已切换演示角色", key, (draft) => {
                draft.profileKey = key;
                draft.extraRoles = [];
                draft.spaceId = canEnter(draft, profile, draft.spaceId)
                  ? draft.spaceId
                  : `personal-${profile.id}`;
              });
              setPanel("");
              const target = modules.find((module) =>
                visibleModule(module.id, profile),
              );
              router.push(target?.href ?? "/workspace");
            }}
          >
            <UserRound size={18} />
            <div>
              <strong>{profile.name}</strong>
              <small>
                {profile.roles.map((role) => roleNames[role]).join("、")}
              </small>
            </div>
            {s.profileKey === key && <Check size={17} />}
          </button>
        ))}
      </Modal>

      <Modal
        title="通知"
        open={panel === "notifications"}
        onClose={() => setPanel("")}
      >
        {s.decisions
          .filter(
            (decision) =>
              decision.assignee === p.id && decision.status === "pending",
          )
          .map((decision) => (
            <Link
              className="v-list-line"
              onClick={() => setPanel("")}
              href={`/workspace?task=${decision.taskId}`}
              key={decision.id}
            >
              <span>{decision.question}</span>
              <Badge>需要确认</Badge>
            </Link>
          ))}
        {s.tasks
          .filter(
            (task) =>
              task.ownerId === p.id &&
              ["COMPLETED", "FAILED"].includes(task.status),
          )
          .map((task) => (
            <Link
              className="v-list-line"
              onClick={() => setPanel("")}
              href={`/workspace?task=${task.id}`}
              key={task.id}
            >
              {task.name}
              <Badge>
                {task.status === "COMPLETED" ? "已完成" : "执行失败"}
              </Badge>
            </Link>
          ))}
      </Modal>

      <Modal title="帮助" open={panel === "help"} onClose={() => setPanel("")}>
        <p>
          当前为AI4S桌面原型。页面功能、对象状态和权限以V1.0 PRD及权限矩阵为准。
        </p>
        <p className="v-muted">
          AI、外部系统、科研软件和设备连接使用明确标注的本地演示状态。
        </p>
      </Modal>
    </div>
  );
}
