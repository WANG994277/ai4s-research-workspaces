"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  BadgeCheck,
  Share2,
  Database,
  Star,
  ChartNoAxesCombined,
  CircleDollarSign,
  Building2,
  Search,
  X,
  Check,
} from "lucide-react";
import { number, type Outcome } from "./data";
import { Badge, Donut, Empty, Metrics, More, Panel, Select, Tabs } from "./ui";
import { MetricInfo, type OpenDetail } from "./trend-strategy";
export function OutcomeDetail({
  outcome: o,
  open,
  onShare,
  requested,
  full = false,
}: {
  outcome: Outcome;
  open: OpenDetail;
  onShare: (o: Outcome) => void;
  requested: boolean;
  full?: boolean;
}) {
  return (
    <>
      <Image
        className="ck-outcome-image"
        src={`/cockpit/${o.image}.png`}
        width={640}
        height={240}
        alt={`${o.topic}科研成果配图`}
      />
      <h3 className="ck-detail-title">{o.name}</h3>
      <div className="ck-tags">
        <Badge>{o.type}</Badge>
        <Badge>{o.topic}</Badge>
        <Badge tone={o.approved ? "green" : "orange"}>
          {o.approved ? "已审核" : "待审核"}
        </Badge>
      </div>
      {!full && (
        <div className="ck-detail-actions">
          <button
            className="ck-button primary"
            onClick={() =>
              open(
                "科研成果详情",
                <div className="ck">
                  <OutcomeDetail
                    outcome={o}
                    open={open}
                    onShare={onShare}
                    requested={requested}
                    full
                  />
                </div>,
              )
            }
          >
            查看成果详情
          </button>
          <Link
            className="ck-button"
            href={`/dashboard?view=projects&record=${o.projectId}`}
          >
            查看关联项目
          </Link>
          <button
            className="ck-button"
            disabled={requested || !o.approved}
            onClick={() => onShare(o)}
          >
            {requested ? "已保存共享申请" : "申请共享权限"}
          </button>
        </div>
      )}
      <div className="ck-detail-block">
        <h3>基本信息</h3>
        <dl className="ck-details">
          <div>
            <dt>成果类型</dt>
            <dd>{o.type === "专利" ? "发明专利" : o.type}</dd>
          </div>
          <div>
            <dt>{o.type === "专利" ? "申请号" : "登记编号"}</dt>
            <dd>{o.application}</dd>
          </div>
          <div>
            <dt>登记日期</dt>
            <dd>{o.date}</dd>
          </div>
          <div>
            <dt>完成单位</dt>
            <dd>{o.org}</dd>
          </div>
          <div>
            <dt>主要完成人</dt>
            <dd>{o.owner}、李娜、王强</dd>
          </div>
          <div>
            <dt>来源系统</dt>
            <dd>{o.source}</dd>
          </div>
          <div>
            <dt>共享范围</dt>
            <dd>{o.shared ? "集团内可申请共享" : "需成果负责人授权"}</dd>
          </div>
        </dl>
      </div>
      <div className="ck-detail-block">
        <h3>成果简介</h3>
        <p className="ck-description">
          {o.description}{" "}
          当前展示为原型中的成果摘要，完整技术资料需要完成权限申请后在来源系统查阅。
        </p>
      </div>
      <div className="ck-detail-block">
        <h3>相关标签</h3>
        <div className="ck-tags">
          {[
            o.topic,
            o.field,
            "技术创新",
            o.converted ? "应用转化" : "科研验证",
          ].map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
      </div>
      {full && (
        <div className="ck-detail-block">
          <h3>应用与转化</h3>
          <p className="ck-description">
            {o.converted
              ? `已进入应用转化阶段，示例转化金额 ${number(o.amount)} 万元。`
              : "尚未形成转化记录，等待阶段验证。"}
          </p>
          <h3 className="mt-3">关联项目</h3>
          <Link
            className="ck-link"
            href={`/dashboard?view=projects&record=${o.projectId}`}
          >
            {o.project}
          </Link>
        </div>
      )}
    </>
  );
}
export function OutcomesView({
  rows,
  open,
  onShare,
  requests,
}: {
  rows: Outcome[];
  open: OpenDetail;
  onShare: (o: Outcome) => void;
  requests: string[];
}) {
  const [tab, setTab] = useState("最新成果");
  const [selectedId, setSelectedId] = useState<string | null>("o1");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("按更新时间");
  const [topic, setTopic] = useState(false);
  const filtered = rows
    .filter(
      (o) =>
        (tab === "最新成果" ||
          (tab === "高价值专利" && o.type === "专利") ||
          (tab === "标准规范" && o.type === "标准规范") ||
          (tab === "应用转化" && o.converted)) &&
        (!topic || o.field !== "油气勘探开发") &&
        `${o.name} ${o.topic} ${o.owner}`.includes(search.trim()),
    )
    .sort((a, b) =>
      sort === "按更新时间"
        ? b.date.localeCompare(a.date)
        : b.amount - a.amount,
    );
  const selected =
    selectedId === null
      ? null
      : (filtered.find((o) => o.id === selectedId) ?? filtered[0]);
  const distribution = [...new Set(rows.map((o) => o.type))].map((name) => ({
    name,
    value: rows.filter((o) => o.type === name).length,
  }));
  return (
    <>
      <Metrics
        items={[
          { label: "成果总数", value: rows.length, icon: FileText, tone: 0 },
          {
            label: "已审核成果",
            value: rows.filter((o) => o.approved).length,
            icon: BadgeCheck,
            tone: 1,
          },
          {
            label: "可共享成果",
            value: rows.filter((o) => o.shared).length,
            icon: Share2,
            tone: 2,
          },
          {
            label: "成果转化数",
            value: rows.filter((o) => o.converted).length,
            icon: Database,
            tone: 3,
          },
          {
            label: "重点专题数",
            value: new Set(rows.map((o) => o.topic)).size,
            icon: Star,
            tone: 4,
          },
        ]}
        onInspect={(m) => open("成果指标口径", <MetricInfo metric={m} />)}
      />
      <div className="ck-outcome-grid">
        <div className="ck-stack">
          <Panel
            title="成果专题"
            action={
              <More
                label="查看全部"
                onClick={() =>
                  open(
                    "科研成果专题",
                    <div className="ck space-y-3">
                      {[...new Set(rows.map((o) => o.topic))].map((t) => (
                        <button
                          key={t}
                          className="ck-button"
                          onClick={() => {
                            setTopic(false);
                            setTab("最新成果");
                            setSearch(t);
                            open(
                              "专题成果列表",
                              <div className="ck">
                                {rows
                                  .filter((o) => o.topic === t)
                                  .map((o) => (
                                    <button
                                      className="ck-row-button ck-detail-block"
                                      key={o.id}
                                      onClick={() =>
                                        open(
                                          o.name,
                                          <div className="ck">
                                            <OutcomeDetail
                                              outcome={o}
                                              open={open}
                                              onShare={onShare}
                                              requested={requests.includes(
                                                o.id,
                                              )}
                                              full
                                            />
                                          </div>,
                                        )
                                      }
                                    >
                                      {o.name}
                                    </button>
                                  ))}
                              </div>,
                            );
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>,
                  )
                }
              />
            }
          >
            <div className="ck-topic">
              <Image
                src="/cockpit/earth.png"
                alt="地球与能源科技网络"
                fill
                sizes="400px"
              />
              <Badge tone="red">专题</Badge>
              <h3>
                能源低碳转型
                <br />
                关键技术成果专题
              </h3>
              <p>汇聚低碳能源领域的重要创新成果，支撑“双碳”目标实现。</p>
              <button
                className="ck-button"
                onClick={() => {
                  setTopic(!topic);
                  setSearch("");
                  setTab("最新成果");
                  setSelectedId("o1");
                }}
              >
                {topic ? "查看全部成果" : "查看专题"} <span>→</span>
              </button>
            </div>
            {topic && (
              <p className="ck-description mt-2">当前展示：低碳转型专题</p>
            )}
          </Panel>
          <Panel title="成果类型分布">
            <Donut
              data={distribution}
              label="成果总数"
              onSelect={(type) => {
                setTopic(false);
                setSearch("");
                setTab(
                  type === "专利"
                    ? "高价值专利"
                    : type === "标准规范"
                      ? "标准规范"
                      : "最新成果",
                );
                open(
                  `${type}成果`,
                  <div className="ck">
                    {rows
                      .filter((o) => o.type === type)
                      .map((o) => (
                        <button
                          key={o.id}
                          className="ck-row-button ck-detail-block"
                          onClick={() =>
                            open(
                              o.name,
                              <div className="ck">
                                <OutcomeDetail
                                  outcome={o}
                                  open={open}
                                  onShare={onShare}
                                  requested={requests.includes(o.id)}
                                  full
                                />
                              </div>,
                            )
                          }
                        >
                          {o.name}
                        </button>
                      ))}
                  </div>,
                );
              }}
            />
          </Panel>
          <Panel
            title="应用成效 / 转化进展"
            action={
              <More
                label="详情"
                onClick={() => {
                  setTab("应用转化");
                  setSearch("");
                  setTopic(false);
                }}
              />
            }
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "实际应用数",
                  value: rows.filter((o) => o.converted).length,
                  Icon: ChartNoAxesCombined,
                },
                {
                  label: "转化合同数",
                  value: rows.filter((o) => o.converted).length,
                  Icon: Database,
                },
                {
                  label: "转化金额（万元）",
                  value: number(rows.reduce((n, o) => n + o.amount, 0)),
                  Icon: CircleDollarSign,
                },
                {
                  label: "应用单位数",
                  value: new Set(
                    rows.filter((o) => o.converted).map((o) => o.org),
                  ).size,
                  Icon: Building2,
                },
              ].map((m) => (
                <div
                  key={m.label}
                  className="rounded border border-slate-100 p-2"
                >
                  <m.Icon size={20} color="#2878ff" />
                  <p className="text-[10px] text-slate-500 mt-2">{m.label}</p>
                  <b className="text-lg">{m.value}</b>
                </div>
              ))}
            </div>
          </Panel>
        </div>
        <Panel title="成果列表" className="ck-outcome-list">
          <Tabs
            label="成果列表分类"
            items={["最新成果", "高价值专利", "标准规范", "应用转化"]}
            value={tab}
            onChange={setTab}
          />
          <label className="ck-search">
            <Search size={14} />
            <input
              aria-label="搜索科研成果"
              placeholder="搜索成果名称、关键词、作者"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button aria-label="清空成果搜索" onClick={() => setSearch("")}>
                <X size={13} />
              </button>
            )}
          </label>
          <div className="ck-outcome-list-header">
            <span>
              {topic ? "低碳转型专题 · " : ""}共 {filtered.length} 项成果
            </span>
            <Select
              compact
              label="成果排序"
              value={sort}
              options={["按更新时间", "按转化金额"]}
              onChange={setSort}
            />
          </div>
          {filtered.length ? (
            filtered.map((o) => (
              <button
                key={o.id}
                className={`ck-outcome-row ${selected?.id === o.id ? "selected" : ""}`}
                aria-pressed={selected?.id === o.id}
                onClick={() => setSelectedId(o.id)}
              >
                <Image
                  src={`/cockpit/${o.image}.png`}
                  alt={`${o.topic}配图`}
                  width={144}
                  height={120}
                />
                <div>
                  <h3>{o.name}</h3>
                  <div className="ck-tags">
                    <Badge>{o.type}</Badge>
                    <Badge>{o.topic}</Badge>
                    {o.approved && (
                      <Badge tone="green">
                        <Check size={10} />
                        已审核
                      </Badge>
                    )}
                  </div>
                  <p>{o.description}</p>
                  <div className="ck-outcome-meta">
                    <span>关联项目：{o.project}</span>
                    <time>{o.date}</time>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <Empty
              message="暂无符合条件的成果"
              onReset={() => {
                setSearch("");
                setTab("最新成果");
                setTopic(false);
              }}
            />
          )}
        </Panel>
        <Panel
          title="成果详情"
          className="ck-outcome-detail"
          action={
            selected ? (
              <button
                className="ck-more"
                aria-label="关闭成果详情"
                onClick={() => setSelectedId(null)}
              >
                <X size={17} />
              </button>
            ) : undefined
          }
        >
          {selected ? (
            <OutcomeDetail
              key={selected.id}
              outcome={selected}
              open={open}
              onShare={onShare}
              requested={requests.includes(selected.id)}
            />
          ) : (
            <Empty message="选择一项成果查看详情" />
          )}
        </Panel>
      </div>
    </>
  );
}
