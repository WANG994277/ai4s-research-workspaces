"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Calculator,
  Upload,
  LayoutTemplate,
  FlaskConical,
  GitCompareArrows,
  ShieldCheck,
  SlidersHorizontal,
  FileCheck2,
  TestTubes,
  Microscope,
  CalendarDays,
  ClipboardList,
  ChartNoAxesCombined,
  X,
} from "lucide-react";
import { Button, Modal, Badge, Field, Empty, NavLink, useDo } from "./ui";
import { useReadStore } from "@/components/read-space/store";
import { useComputeStore } from "@/components/compute-space/store";
import { useDoStore } from "./store";
import type { Evidence, Parameter } from "./types";
const defaultGoal =
  "验证温度与压力对 CO₂ 加氢制甲醇选择性的影响，设计含对照组的参数梯度实验。";
const quick = [
  ["根据文献生成实验方案", BookOpen],
  ["根据计算结果设计验证实验", Calculator],
  ["优化已有实验方案", Sparkles],
  ["设计参数梯度实验", SlidersHorizontal],
  ["设计对照实验", FlaskConical],
  ["比较两个实验方案", GitCompareArrows],
  ["检查方案风险", ShieldCheck],
  ["检查标准符合性", FileCheck2],
] as const;
export function Home() {
  const s = useDo();
  const [goal, setGoal] = useState("");
  const [template, setTemplate] = useState("");
  const [modal, setModal] = useState("");
  const [refs, setRefs] = useState<Evidence[]>([]);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [importedParams, setImportedParams] = useState<Parameter[]>([]);
  const [importedHypothesis, setImportedHypothesis] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const read = useReadStore();
  const compute = useComputeStore();
  const readId = s.params.get("readDraft");
  const sourceId = s.params.get("sourceId");
  useEffect(() => {
    Promise.all([
      useReadStore.persist.rehydrate(),
      useComputeStore.persist.rehydrate(),
    ])
      .then(() => {
        const draft = useReadStore
          .getState()
          .drafts.find(
            (d) =>
              d.id === readId && d.projectId === s.project.id && d.confirmed,
          );
        if (draft) {
          setGoal(draft.goal);
          setImportedHypothesis(draft.hypothesis);
          if (draft.parameters.trim())
            setImportedParams([
              {
                name: "上游关键参数",
                value: draft.parameters,
                unit: "见来源",
                source: "文献",
                confirmed: false,
              },
            ]);
          setRefs([
            {
              id: draft.id,
              type: "读空间",
              title: draft.title,
              content: `研究目标：${draft.goal}\n科学假设：${draft.hypothesis}\n方法：${draft.method}\n参数：${draft.parameters}\n标准：${draft.standardRequirements}`,
              href: s.href(`/read-space/handoff?draft=${draft.id}`),
            },
          ]);
          setNotice("已接收读空间研究目标、假设、方法、参数与证据。");
        }
        if (sourceId) {
          try {
            const legacy = JSON.parse(
              localStorage.getItem("ai4s-plans-v2") || "[]",
            );
            const p = Array.isArray(legacy)
              ? legacy.find(
                  (p: { id: string; projectId: string }) =>
                    p.id === sourceId && p.projectId === s.project.id,
                )
              : null;
            if (p) {
              setGoal(p.name);
              setRefs([
                {
                  id: p.id,
                  type: "算空间",
                  title: p.name,
                  content: `${p.parameters}\n${p.steps}`,
                  href: "/compute-space",
                },
              ]);
              setImportedParams([
                {
                  name: "上游推荐参数",
                  value: p.parameters,
                  unit: "见来源",
                  source: "计算结果",
                  confirmed: false,
                },
              ]);
              setNotice("已接收算空间实验交接包，参数与原始来源已保留。");
            }
          } catch {
            setNotice("上游交接包无法读取，请重新引用算空间结果。");
          }
        }
      })
      .catch(() => setNotice("部分上下文读取失败，可通过引用按钮重新选择。"));
    // Source IDs determine when a new incoming handoff should replace the composer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readId, sourceId, s.project.id]);
  function addRef(e: Evidence) {
    setRefs((v) => (v.some((x) => x.id === e.id) ? v : [...v, e]));
  }
  async function fileChosen(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setNotice("文件超过 10 MB，请选择较小的实验方案文件。");
      return;
    }
    const textual = /\.(md|txt|csv)$/i.test(file.name);
    const content = textual
      ? (await file.text()).slice(0, 15000)
      : `已附加 ${file.name}（${(file.size / 1024).toFixed(1)} KB）。当前演示仅登记 PDF/Word 附件，未解析原文；请在目标中补充关键实验条件。`;
    addRef({
      id: `FILE-${file.name}`,
      type: "上传文件",
      title: file.name,
      content,
    });
    if (textual && !goal) setGoal(content.slice(0, 300));
    setNotice(
      textual
        ? "文件正文已读取并加入上下文。"
        : "附件已登记，请补充需纳入方案的实验目标与条件。",
    );
  }
  function generate() {
    if (!goal.trim()) return;
    setBusy(true);
    const id = s.createPlan(
      goal.trim(),
      s.project.id,
      s.project.name,
      template,
    );
    s.updatePlan(id, {
      evidence: [
        ...refs,
        ...(useDoStore.getState().plans.find((p) => p.id === id)?.evidence ??
          []),
      ],
      ...(importedParams.length ? { parameters: importedParams } : {}),
      ...(importedHypothesis ? { hypothesis: importedHypothesis } : {}),
      messages: [{ role: "user", content: goal.trim() }],
    });
    s.go(`/do-space/agent?plan=${id}`);
  }
  function quickClick(name: string) {
    if (name === "比较两个实验方案") {
      s.go("/do-space/plans?view=compare");
      return;
    }
    if (["检查方案风险", "检查标准符合性", "优化已有实验方案"].includes(name)) {
      setModal(name);
      return;
    }
    setGoal(
      name === "设计对照实验"
        ? "设计 Cu/ZnO 催化剂与空白载体的对照实验，控制反应温度、压力和空速。"
        : name === "设计参数梯度实验"
          ? defaultGoal
          : `${name}：${defaultGoal}`,
    );
    if (name.includes("文献")) setModal("引用读空间结论");
    if (name.includes("计算")) setModal("引用算空间结果");
  }
  const execution = [
    ["实验样品与记录", "samples", TestTubes],
    ["实验设备", "equipment", Microscope],
    ["仪器预约", "bookings", CalendarDays],
    ["实验管理", "tasks", ClipboardList],
    ["表征分析", "analysis", ChartNoAxesCombined],
  ] as const;
  return (
    <div className="do-home" data-prd-id="DO-HOME">
      <div className="do-home-heading">
        <div>
          <h1>今天想设计什么实验？</h1>
          <p>连接研究认知与计算验证，让每一份实验方案都有据可循。</p>
        </div>
        <div className="do-lab-mark">
          <FlaskConical size={34} />
        </div>
      </div>
      {notice && (
        <p role="status" className="do-note" style={{ marginBottom: 14 }}>
          {notice}
        </p>
      )}
      <section className="do-composer">
        <textarea
          aria-label="实验目标"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder={`描述实验目标，例如：${defaultGoal}`}
        />
        {refs.length > 0 && (
          <div className="do-context-tags">
            {refs.map((e) => (
              <button
                key={e.id}
                onClick={() => setRefs(refs.filter((v) => v.id !== e.id))}
                title="移除引用"
              >
                @{e.title} <X size={10} style={{ display: "inline" }} />
              </button>
            ))}
          </div>
        )}
        <div className="do-composer-bottom">
          <div className="do-row">
            <Button variant="ghost" onClick={() => setModal("引用读空间结论")}>
              <BookOpen />
              引用读空间
            </Button>
            <Button variant="ghost" onClick={() => setModal("引用算空间结果")}>
              <Calculator />
              引用算空间
            </Button>
            <Button variant="ghost" onClick={() => upload.current?.click()}>
              <Upload />
              上传已有方案
            </Button>
            <Button variant="ghost" onClick={() => setModal("方案模板")}>
              <LayoutTemplate />
              选择模板
            </Button>
          </div>
          <Button
            variant="primary"
            disabled={!goal.trim() || busy}
            onClick={generate}
          >
            <Sparkles />
            {busy ? "正在创建…" : "生成实验方案"}
            <ArrowRight />
          </Button>
        </div>
      </section>
      <input
        hidden
        type="file"
        ref={upload}
        accept=".md,.txt,.pdf,.docx,.csv"
        onChange={(e) => {
          void fileChosen(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="do-quick-grid">
        {quick.map(([name, Icon]) => (
          <button
            className="do-quick"
            key={name}
            onClick={() => quickClick(name)}
          >
            <Icon />
            {name}
          </button>
        ))}
      </div>
      <div className="do-agent-banner">
        <div className="do-row">
          <span style={{ color: "var(--do-primary)" }}>
            <Sparkles size={24} />
          </span>
          <div>
            <h2>实验方案设计与生成</h2>
            <p>
              梳理实验路线、推荐参数与设备，完成风险检查，保留每一次人工决策。
            </p>
          </div>
        </div>
        <div className="do-row">
          <Badge>设计 → 会签 → 定版</Badge>
          <Button
            variant="ghost"
            onClick={() => {
              setGoal(defaultGoal);
              setNotice("示例目标已填入，可调整后生成方案。");
            }}
          >
            试用示例 <ArrowRight />
          </Button>
        </div>
      </div>
      <section>
        <div className="do-recent-head">
          <h2>最近实验方案</h2>
          <NavLink to="/do-space/plans">
            查看全部 <ArrowRight />
          </NavLink>
        </div>
        <div className="do-table-wrap">
          <table className="do-table">
            <thead>
              <tr>
                <th>方案名称 / 所属课题</th>
                <th>版本</th>
                <th>状态</th>
                <th>最近更新</th>
                <th>下一步</th>
              </tr>
            </thead>
            <tbody>
              {s.projectPlans.slice(0, 4).map((p) => (
                <tr key={p.id}>
                  <td>
                    <button
                      className="do-link"
                      onClick={() => s.go(`/do-space/plans/${p.id}`)}
                    >
                      <strong>{p.title}</strong>
                    </button>
                    <small>{p.project}</small>
                  </td>
                  <td>V{p.version}</td>
                  <td>
                    <Badge>{p.status}</Badge>
                  </td>
                  <td>{p.updatedAt.slice(0, 16)}</td>
                  <td>
                    <Button
                      variant="ghost"
                      onClick={() => s.go(`/do-space/plans/${p.id}`)}
                    >
                      {p.status === "已定版"
                        ? "进入实验执行"
                        : p.status === "草稿"
                          ? "继续设计"
                          : "查看与审核"}
                      <ArrowRight />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!s.projectPlans.length && (
            <Empty title="当前课题还没有实验方案">
              从上方描述实验目标，开始第一份方案。
            </Empty>
          )}
        </div>
      </section>
      <section style={{ marginTop: 25 }}>
        <h2>实验执行工作区</h2>
        <div className="do-execution-links">
          {execution.map(([label, path, Icon]) => (
            <NavLink key={path} to={`/do-space/${path}`}>
              <Icon />
              {label}
            </NavLink>
          ))}
        </div>
      </section>
      <Modal
        open={!!modal}
        onClose={() => setModal("")}
        title={modal}
        wide
        footer={
          <Button variant="primary" onClick={() => setModal("")}>
            完成选择
          </Button>
        }
      >
        <div className="do-stack">
          {modal === "方案模板" ? (
            <>
              <p className="do-muted">
                选择适合当前实验的结构化模板，随后可编辑全部参数。
              </p>
              <div className="do-form-grid">
                {["催化活性验证", "页岩真三轴实验", "材料稳定性实验"].map(
                  (t) => (
                    <button
                      className={`do-sample-choice ${template === t ? "do-picked" : ""}`}
                      key={t}
                      onClick={() => {
                        setTemplate(t);
                        setGoal(
                          `${t}：验证关键参数对实验结果的影响，设置对照组与 3 次重复。`,
                        );
                      }}
                    >
                      <h3>{t}</h3>
                      <p>变量矩阵 · 对照组 · 安全条件 · 设备建议</p>
                      <Badge>{template === t ? "已选择" : "可用模板"}</Badge>
                    </button>
                  ),
                )}
              </div>
            </>
          ) : modal === "引用读空间结论" ? (
            <>
              <Field label="可引用的上下文类型">
                <select
                  onChange={(e) =>
                    addRef({
                      id: e.target.value,
                      type: "科研上下文",
                      title: e.target.value,
                      content: `${s.project.name} · ${e.target.value}（演示上下文）`,
                    })
                  }
                  defaultValue=""
                >
                  <option value="" disabled>
                    选择当前课题 / 科学假设 / 文献 / 标准
                  </option>
                  {[
                    "当前课题",
                    "科学假设",
                    "文献方法",
                    "标准要求",
                    "研究空白",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </Field>
              {read.artifacts
                .filter((a) => a.projectId === s.project.id)
                .slice(0, 5)
                .map((a) => (
                  <button
                    key={a.id}
                    className="do-sample-choice"
                    onClick={() =>
                      addRef({
                        id: a.id,
                        type: "读空间",
                        title: a.title,
                        content: a.content,
                        href: s.href(`/read-space/agent?task=${a.taskId}`),
                      })
                    }
                  >
                    <strong>{a.title}</strong>
                    <p>{a.content.slice(0, 150)}</p>
                    <Badge>
                      {refs.some((e) => e.id === a.id)
                        ? "已引用"
                        : "引用研究产物"}
                    </Badge>
                  </button>
                ))}
              <button
                className="do-sample-choice"
                onClick={() =>
                  addRef({
                    id: "READ-DEMO",
                    type: "文献",
                    title: "CO₂ 加氢反应文献方法摘要",
                    content:
                      "演示文献摘要：建议控制空速，使用三个温度梯度与双压力条件，每组重复 3 次。",
                  })
                }
              >
                <strong>CO₂ 加氢反应文献方法摘要</strong>
                <p>演示来源 · 温度梯度、对照组与重复性设计</p>
                <Badge>
                  {refs.some((e) => e.id === "READ-DEMO")
                    ? "已引用"
                    : "引用示例"}
                </Badge>
              </button>
            </>
          ) : modal === "引用算空间结果" ? (
            <>
              {compute.tasks
                .filter((t) => t.status === "已完成")
                .map((t) => (
                  <button
                    key={t.id}
                    className="do-sample-choice"
                    onClick={() => {
                      addRef({
                        id: t.id,
                        type: "计算结果",
                        title: t.name,
                        content: `${t.conclusion}\n${t.parameters.map((p) => `${p.name}：${p.value} ${p.unit}`).join("\n")}`,
                        href: `/compute-space/tasks/${t.id}`,
                      });
                      setImportedParams(
                        t.parameters.map((p) => ({
                          ...p,
                          source: "计算结果",
                          confirmed: false,
                        })),
                      );
                      setGoal(`验证计算结果：${t.name}`);
                    }}
                  >
                    <strong>{t.name}</strong>
                    <p>
                      {t.project} · {t.conclusion.slice(0, 120)}
                    </p>
                    <Badge>
                      {refs.some((e) => e.id === t.id)
                        ? "已引用"
                        : "引用结果与参数"}
                    </Badge>
                  </button>
                ))}
              <button
                className="do-sample-choice"
                onClick={() =>
                  addRef({
                    id: "COMPUTE-DEMO",
                    type: "计算结果",
                    title: "催化反应敏感参数分析",
                    content:
                      "演示预测：推荐温度 220 / 240 / 260 ℃，压力 2 / 4 MPa，重点关注 240 ℃附近的活性变化。",
                  })
                }
              >
                <strong>催化反应敏感参数分析（示例）</strong>
                <p>温度 220 / 240 / 260 ℃；压力 2 / 4 MPa</p>
                <Badge>
                  {refs.some((e) => e.id === "COMPUTE-DEMO")
                    ? "已引用"
                    : "引用示例"}
                </Badge>
              </button>
            </>
          ) : (
            <>
              {s.projectPlans.map((p) => (
                <button
                  className="do-sample-choice"
                  key={p.id}
                  onClick={() =>
                    s.go(
                      `/do-space/agent?plan=${p.id}&action=${modal.includes("优化") ? "edit" : "risk"}`,
                    )
                  }
                >
                  <strong>{p.title}</strong>
                  <p>
                    V{p.version} · {p.status}
                  </p>
                </button>
              ))}
              {!s.projectPlans.length && <Empty title="先创建一份实验方案" />}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
