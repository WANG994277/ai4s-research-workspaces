"use client";
import { useState, type ReactNode, type FormEvent } from "react";
import Link from "next/link";
import { Download, ClipboardList, X, CheckCircle2 } from "lucide-react";
import { ScientificDashboard } from "../scientific-dashboard";
import { SHOW_COCKPIT_HEADER_TOOLS } from "@/lib/presentation";
import {
  Modal,
  useLocalState,
  useResearchProject,
  downloadText,
} from "../workspace-kit";
import {
  defaults,
  evidence,
  fields,
  inScope,
  organizations,
  outcomes,
  projectRecords,
  resourceRecords,
  views,
  type Filters,
  type View,
  type Direction,
  type Outcome,
  type ResourceRecord,
} from "./data";
import { Empty, Select } from "./ui";
import { StrategyView, TrendView, type OpenDetail } from "./trend-strategy";
import { ProjectsView, ResourcesView } from "./resources-projects";
import { OutcomesView } from "./outcomes";
import "./cockpit.css";
type ActionRecord = {
  id: string;
  kind: string;
  target: string;
  name: string;
  owner: string;
  note: string;
  date: string;
  status: string;
};
export function ScientificCockpit({
  initialView = "trend",
  initialRecord,
}: {
  initialView?: string;
  initialRecord?: string;
}) {
  const view = initialView;
  if (
    !["trend", "strategy", "resources", "projects", "outcomes"].includes(view)
  )
    return <ScientificDashboard />;
  return <CockpitPage key={view} view={view as View} record={initialRecord} />;
}
function CockpitPage({ view, record }: { view: View; record?: string }) {
  const { href } = useResearchProject();
  const [draft, setDraft] = useState<Filters>(defaults);
  const [filters, setFilters] = useState<Filters>(defaults);
  const [notice, setNotice] = useState("");
  const [detail, setDetail] = useState<{
    title: string;
    content: ReactNode;
  } | null>(null);
  const [stored, setStored] = useLocalState<ActionRecord[]>(
    "ai4s-cockpit-actions-v1",
    [],
  );
  const records = Array.isArray(stored)
    ? stored.filter(
        (r) => r && typeof r.target === "string" && typeof r.kind === "string",
      )
    : [];
  const open: OpenDetail = (title, content) => setDetail({ title, content });
  const reset = () => {
    setDraft(defaults);
    setFilters(defaults);
    setNotice("筛选已重置为全部组织内的历史示例范围。");
  };
  const evidenceRows = evidence.filter((r) => inScope(r, filters));
  const projectRows = projectRecords.filter(
    (r) =>
      inScope(r, filters) &&
      (filters.status === "全部" || r.status === filters.status),
  );
  const resourceRows = resourceRecords.filter((r) => inScope(r, filters));
  const outcomeRows = outcomes.filter(
    (r) =>
      inScope(r, filters) &&
      (filters.type === "全部" || r.type === filters.type) &&
      (filters.share === "全部" ||
        (filters.share === "可共享" ? r.shared : !r.shared)),
  );
  const activeRows =
    view === "projects"
      ? projectRows
      : view === "resources"
        ? resourceRows
        : view === "outcomes"
          ? outcomeRows
          : evidenceRows;
  const description = views.find((v) => v[0] === view)!;
  const sourceOptions =
    view === "trend" || view === "strategy"
      ? ["全部", "Web of Science", "中国专利数据库", "国家标准库", "科研管理"]
      : view === "resources"
        ? ["全部", "A4S"]
        : ["全部", "A4S", "科研管理", "创新平台"];
  const setField = (key: keyof Filters) => (value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const createAction = (kind: string, target: string, name: string) =>
    open(
      kind,
      <ActionForm
        kind={kind}
        name={name}
        onCancel={() => setDetail(null)}
        onSave={(owner, note) => {
          const action = {
            id: `CK-${Date.now()}`,
            kind,
            target,
            name,
            owner,
            note,
            date: new Date().toLocaleString("zh-CN"),
            status: "待处理（本机演示）",
          };
          try {
            localStorage.setItem(
              "ai4s-cockpit-actions-v1",
              JSON.stringify([...records, action]),
            );
          } catch {
            return "浏览器存储不可用，暂未保存。请允许本地存储后重试。";
          }
          setStored([...records, action]);
          setDetail(null);
          setNotice(`${kind}已保存到本机记录，尚未提交外部系统。`);
          return "";
        }}
      />,
    );
  const expertRequest = (d: Direction) =>
    createAction("专家确认申请", d.id, d.name);
  const shareRequest = (o: Outcome) =>
    createAction("成果共享申请", o.id, o.name);
  const coordinate = (r: ResourceRecord) =>
    createAction(
      "资源协调记录",
      r.id,
      `${r.name} · 当前利用率 ${r.utilization}%`,
    );
  const showRecords = () =>
    open(
      "本机申请与协调记录",
      <div className="ck">
        {records.length ? (
          <table className="ck-table">
            <thead>
              <tr>
                <th>类型 / 对象</th>
                <th>经办人</th>
                <th>状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {[...records].reverse().map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.kind}</strong>
                    <p>{r.name}</p>
                    <small>{r.note}</small>
                  </td>
                  <td>{r.owner}</td>
                  <td>{r.status}</td>
                  <td>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <Empty message="尚未创建申请或协调记录" />
        )}
        <p className="ck-description">
          记录仅保存在当前浏览器，不会向专家、资源负责人或成果管理系统发送消息。
        </p>
      </div>,
    );
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setFilters({ ...draft });
    setNotice(
      `已查询：${draft.org} · ${view === "projects" ? draft.status : view === "outcomes" ? draft.type : draft.field} · ${draft.period} · ${draft.source}`,
    );
  };
  return (
    <div className="ck">
      <header className="ck-header">
        <h1>{description[2]}</h1>
        {SHOW_COCKPIT_HEADER_TOOLS && (
          <nav className="ck-views" aria-label="科研驾驶舱视角">
            {views.map(([key, label]) => (
              <Link
                key={key}
                aria-current={view === key ? "page" : undefined}
                href={href(`/dashboard?view=${key}`)}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}
        {SHOW_COCKPIT_HEADER_TOOLS && (
          <>
            <button className="ck-button" onClick={showRecords}>
              <ClipboardList size={14} />
              本机记录{records.length > 0 ? ` (${records.length})` : ""}
            </button>
            <button
              className="ck-button"
              style={{ marginLeft: 0 }}
              title="导出顶部筛选范围内的全部分类数据"
              onClick={() => {
                downloadText(
                  `科研驾驶舱-${view}.json`,
                  JSON.stringify(
                    {
                      view,
                      filters,
                      source: "历史演示数据，非实时统计",
                      snapshot: "2024-12-10",
                      scope:
                        "顶部筛选范围的全部分类数据；不包含页面内的搜索、页签与排序条件",
                      records: activeRows,
                    },
                    null,
                    2,
                  ),
                  "application/json",
                );
                setNotice("顶部筛选范围的全部分类数据已导出为 JSON。");
              }}
            >
              <Download size={14} />
              导出汇总
            </button>
          </>
        )}
      </header>

      <form className="ck-filters" onSubmit={submit}>
        <Select
          label="组织机构"
          options={[...organizations]}
          value={draft.org}
          onChange={setField("org")}
        />
        {view === "projects" ? (
          <Select
            label="项目状态"
            options={["全部", "在研", "已结题", "待启动"]}
            value={draft.status}
            onChange={setField("status")}
          />
        ) : view === "outcomes" ? (
          <>
            <Select
              label="成果类型"
              options={[
                "全部",
                "专利",
                "论文",
                "标准规范",
                "软件著作权",
                "技术成果",
              ]}
              value={draft.type}
              onChange={setField("type")}
            />
            <Select
              label="共享范围"
              options={["全部", "可共享", "需授权"]}
              value={draft.share}
              onChange={setField("share")}
            />
          </>
        ) : (
          <Select
            label="研究领域"
            options={[...fields]}
            value={draft.field}
            onChange={setField("field")}
          />
        )}
        <Select
          label="时间范围"
          options={["2019 - 2024", "2024", "2023", "2025"]}
          value={draft.period}
          onChange={setField("period")}
        />
        <Select
          label={
            view === "projects" || view === "outcomes" ? "来源系统" : "数据来源"
          }
          options={sourceOptions}
          value={draft.source}
          onChange={setField("source")}
        />
        <div className="ck-filter-actions">
          <button type="submit" className="ck-button primary">
            查询
          </button>
          <button type="button" className="ck-button" onClick={reset}>
            重置
          </button>
        </div>
      </form>
      {notice && (
        <div className="ck-notice" role="status">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={14} />
            {notice}
          </span>
          <button aria-label="关闭操作提示" onClick={() => setNotice("")}>
            <X size={14} />
          </button>
        </div>
      )}
      {!activeRows.length ? (
        <Empty onReset={reset} />
      ) : view === "trend" ? (
        <TrendView rows={evidenceRows} open={open} />
      ) : view === "strategy" ? (
        <StrategyView
          rows={evidenceRows}
          open={open}
          onRequest={expertRequest}
          requests={records
            .filter((r) => r.kind === "专家确认申请")
            .map((r) => r.target)}
        />
      ) : view === "resources" ? (
        <ResourcesView
          rows={resourceRows}
          open={open}
          onCoordinate={coordinate}
        />
      ) : view === "projects" ? (
        <ProjectsView rows={projectRows} open={open} initialId={record} />
      ) : (
        <OutcomesView
          rows={outcomeRows}
          open={open}
          onShare={shareRequest}
          requests={records
            .filter((r) => r.kind === "成果共享申请")
            .map((r) => r.target)}
        />
      )}
      <footer className="ck-footer">
        <span>
          历史演示数据 · 聚合统计、研判与预测仅用于原型展示 · 不替代业务审批
        </span>
        <span>数据快照：2024-12-10</span>
      </footer>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? "详情"}
        description="当前展示历史示例与本机操作记录。"
      >
        <div className="ck-modal-body">{detail?.content}</div>
      </Modal>
    </div>
  );
}
function ActionForm({
  kind,
  name,
  onSave,
  onCancel,
}: {
  kind: string;
  name: string;
  onSave: (owner: string, note: string) => string;
  onCancel: () => void;
}) {
  const [owner, setOwner] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      className="ck-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!owner.trim() || !note.trim()) {
          setError("请填写经办人及申请说明。");
          return;
        }
        setError(onSave(owner.trim(), note.trim()));
      }}
    >
      <p>
        <strong>申请对象：</strong>
        {name}
      </p>
      <label>
        {kind === "专家确认申请" ? "拟邀请专家" : "经办人"}
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          required
          maxLength={50}
          placeholder={
            kind === "专家确认申请" ? "输入拟邀请专家姓名" : "输入经办人姓名"
          }
        />
      </label>
      <label>
        {kind === "资源协调记录" ? "协调方案与用途" : "申请说明"}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          required
          maxLength={1000}
          placeholder="说明研究目的、使用范围及期望安排"
        />
      </label>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <p>仅保存本机演示申请，后续需通过正式系统提交和审批。</p>
      <div className="flex justify-end gap-3">
        <button type="button" className="ck-button" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="ck-button primary">
          保存申请
        </button>
      </div>
    </form>
  );
}
