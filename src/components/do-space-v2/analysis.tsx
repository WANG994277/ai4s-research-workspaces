"use client";
import { useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Download,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  Badge,
  Button,
  Confirm,
  Empty,
  Field,
  Modal,
  NavLink,
  PageHeader,
  Panel,
  Tabs,
  download,
  useDo,
} from "./ui";
import { useComputeStore } from "@/components/compute-space/store";
import { useReadStore } from "@/components/read-space/store";
import { dateNow, demoPoints } from "./seed";
import type { Point } from "./types";

export function analyzePoints(points: Point[], operations: string[]): Point[] {
  let next = structuredClone(points);
  if (operations.includes("数据清洗"))
    next = next.filter((p) =>
      [p.x, p.a, p.b, p.computed].every(Number.isFinite),
    );
  if (operations.includes("曲线平滑"))
    next = next.map((p, i, arr) => ({
      ...p,
      a: Number(
        (
          arr.slice(Math.max(0, i - 1), i + 2).reduce((n, p) => n + p.a, 0) /
          arr.slice(Math.max(0, i - 1), i + 2).length
        ).toFixed(3),
      ),
      b: Number(
        (
          arr.slice(Math.max(0, i - 1), i + 2).reduce((n, p) => n + p.b, 0) /
          arr.slice(Math.max(0, i - 1), i + 2).length
        ).toFixed(3),
      ),
    }));
  if (operations.includes("归一化转换")) {
    const max = Math.max(...next.map((p) => Math.max(p.a, p.b, p.computed)), 1);
    next = next.map((p) => ({
      ...p,
      a: p.a / max,
      b: p.b / max,
      computed: p.computed / max,
    }));
  }
  return next;
}
export function Analysis() {
  const s = useDo();
  const [selected, setSelected] = useState(s.params.get("result") || "");
  const result =
    s.projectResults.find((r) => r.id === selected) ?? s.projectResults[0];
  const [tab, setTab] = useState("测量曲线");
  const [assistantTab, setAssistantTab] = useState("特征识别");
  const [ops, setOps] = useState<string[]>(result?.operations ?? []);
  const [compareId, setCompareId] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTask, setUploadTask] = useState(s.projectTasks[0]?.id || "");
  const [imageUrl, setImageUrl] = useState("");
  const [imageName, setImageName] = useState("");
  const [reportEdit, setReportEdit] = useState("");
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const imgUpload = useRef<HTMLInputElement>(null);
  const task = s.projectTasks.find((t) => t.id === result?.taskId);
  const plan = s.projectPlans.find((p) => p.id === task?.planId);
  const compare = s.projectResults.find((r) => r.id === compareId);
  const points = useMemo(
    () => analyzePoints(result?.points ?? [], result?.operations ?? []),
    [result],
  );
  const comparisonPoints = points.map((p, i) => ({
    ...p,
    b: compare?.points[i]?.a ?? p.b,
  }));
  const maxA = Math.max(...points.map((p) => p.a), 0);
  const maxB = Math.max(...comparisonPoints.map((p) => p.b), 0);
  const rmse = Math.sqrt(
    points.reduce((n, p) => n + (p.a - p.computed) ** 2, 0) /
      (points.length || 1),
  );
  const peak = points.find((p) => p.a === maxA);
  const transfers = s.transfers.filter((t) => t.resultId === result?.id);
  const unit = result?.operations.includes("归一化转换")
    ? "归一化强度"
    : "响应强度 / a.u.";
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const lines = (await file.text()).trim().split(/\r?\n/);
      const separator = file.name.endsWith(".tsv") ? "\t" : ",";
      const header = lines[0].split(separator);
      if (header.length < 2 || lines.length < 3)
        throw new Error("请上传包含表头和至少两行数据的 CSV / TSV。");
      const values = lines
        .slice(1)
        .filter(Boolean)
        .map((line) => line.split(separator).map((v) => Number(v.trim())));
      if (values.some((row) => row.length < 2 || !row.every(Number.isFinite)))
        throw new Error("数据包含非数值或不完整行，请先核对文件。");
      const t = s.projectTasks.find((t) => t.id === uploadTask);
      if (!t) throw new Error("请选择关联实验任务。");
      const imported = values.map((row) => ({
        x: row[0],
        a: row[1],
        b: row[2] ?? row[1],
        computed: row[3] ?? row[1],
      }));
      const id = s.addResult({
        projectId: s.project.id,
        taskId: t.id,
        sampleId: t.sampleIds[0] || "",
        name: file.name,
        method: "CSV",
        points: imported,
        processed: false,
        operations: [],
        report: "",
        confirmed: false,
        createdAt: dateNow(),
      });
      s.updateTask(t.id, {
        resultId: id,
        logs: [
          ...t.logs,
          `${dateNow()} 张博士上传 ${file.name}，${imported.length} 个数据点`,
        ],
      });
      setSelected(id);
      setUploading(false);
      setNotice(`已导入 ${file.name}，共 ${imported.length} 个测量点。`);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "文件导入失败。");
    }
  }
  function generateReport() {
    if (!result) return;
    setBusy(true);
    const report = `实验结果摘要\n\n实验目标\n${plan?.goal || result.name}\n\n关键结果\n样品 A 峰值 ${maxA.toFixed(3)}，对应横坐标 ${peak?.x ?? "—"}；样品 B 峰值 ${maxB.toFixed(3)}。计算与实验 RMSE 为 ${rmse.toFixed(3)}（${unit}）。\n\n主要特征\n当前数据包含 ${points.length} 个有效测量点；峰值差为 ${(maxA - maxB).toFixed(3)}。处理流程：${result.operations.join(" → ") || "原始数据，未经处理"}。\n\n计算–实验偏差\n偏差应结合仪器校准、重复性与边界条件解释，当前数据用于流程演示。\n\n科学假设\n${plan?.hypothesis || "待结合课题假设核对"}\n当前曲线趋势提供初步对照线索，不能仅由单批次结果认定机理或因果。\n\n异常记录\n${task?.exceptions.map((e) => `${e.description}；${e.resolved ? "已处置：" + e.resolution : "待处置"}`).join("\n") || "本批次未登记异常。"}\n\n建议下一步\n复核实验重复性；使用真实参数校准计算模型；针对偏差补充文献研究。\n\n来源\n${result.id} / ${result.taskId} / ${result.sampleId || "样品待关联"} / ${result.createdAt}\n\n说明：本地模拟数据与辅助解释，正式结论须人工确认。`;
    s.updateResult(result.id, { report, confirmed: false });
    setAssistantTab("实验报告");
    setBusy(false);
    setNotice("实验结果 Artifact 已生成，复核后可确认结论并回流。");
  }
  async function transfer(direction: string) {
    if (!result?.confirmed) return;
    const content = `${result.report}\n\n真实执行参数：\n${task?.parameters.map((p) => `${p.name}：${p.value} ${p.unit}`).join("\n") || "见原始数据"}\n\n原始数据：\n${JSON.stringify(result.points)}\n\n处理后数据：\n${JSON.stringify(points)}\n来源课题：${s.project.name}\n来源实验：${result.taskId}`;
    let targetId = "",
      href = "";
    if (direction === "做 → 算") {
      await useComputeStore.persist.rehydrate();
      const cp = useComputeStore.getState();
      const datasetId = cp.addDataset({
        name: `实验校准数据 · ${result.name}`,
        version: 1,
        rows: result.points.length,
        columns: 4,
        quality: 100,
        source: `做空间 ${result.id} / ${s.project.name}`,
        flow: result.operations,
        createdAt: dateNow(),
        creator: "张博士",
        usedBy: [],
      });
      targetId = cp.createPlan(
        `使用实验结果校准模型：${plan?.goal || result.name}`,
        {
          title: `实验结果校准 · ${result.name}`,
          project: s.project.name,
          datasetId,
          parameters:
            task?.parameters.map((p) => ({
              ...p,
              source: `实验记录 ${task.id}`,
            })) || [],
          evidence: [content],
          hypothesis: plan?.hypothesis || "用真实实验结果修正模型偏差",
        },
      );
      href = `/compute-space/agent?plan=${targetId}`;
      cp.addHandoff({
        direction: "做 → 算",
        taskId: targetId,
        title: result.name,
        content,
        confirmed: true,
      });
    } else {
      await useReadStore.persist.rehydrate();
      const read = useReadStore.getState();
      targetId = read.createTask(
        `补充研究：${result.name} 的计算–实验偏差`,
        "科研思路探索",
        s.project.id,
      );
      read.addArtifact({
        projectId: s.project.id,
        taskId: targetId,
        type: "实验结果与新科学问题",
        title: `实验结果回流 · ${result.name}`,
        content,
        evidenceIds: [],
        confirmed: true,
        mode: "人工",
      });
      href = `/read-space/agent?task=${targetId}`;
    }
    s.addTransfer({
      projectId: s.project.id,
      resultId: result.id,
      direction,
      content,
      targetId,
      href,
    });
    setConfirm("");
    setNotice(`${direction} 已完成，完整结果与来源已保存至下游草稿。`);
  }
  return (
    <div data-prd-id="DO-ANALYSIS">
      <PageHeader
        title="实验表征分析"
        description="从原始数据到科学解释，连接实验观测、计算结果与下一步研究。"
        actions={
          <>
            <Button onClick={() => setUploading(true)}>
              <Upload />
              上传实验数据
            </Button>
            <Button
              variant="primary"
              disabled={!result || busy}
              onClick={generateReport}
            >
              <Sparkles />
              {busy ? "分析中…" : "生成实验报告"}
            </Button>
          </>
        }
      />
      {notice && (
        <p role="status" className="do-note" style={{ marginBottom: 16 }}>
          {notice}
        </p>
      )}
      {!result ? (
        <Empty title="当前课题还没有实验数据">
          <NavLink to="/do-space/tasks">进入实验管理并采集结果</NavLink>
        </Empty>
      ) : (
        <>
          <div className="do-three-col">
            <div className="do-stack">
              <Panel title="实验与样品">
                <div className="do-list">
                  {s.projectResults.map((r) => (
                    <button
                      className={`do-sample-choice ${r.id === result.id ? "do-picked" : ""}`}
                      key={r.id}
                      onClick={() => {
                        setSelected(r.id);
                        setOps(r.operations);
                        setAnswer("");
                      }}
                    >
                      <strong>{r.name}</strong>
                      <p>
                        {r.taskId} / {r.method}
                      </p>
                      <Badge>
                        {r.confirmed
                          ? "已确认"
                          : r.report
                            ? "待确认"
                            : "待分析"}
                      </Badge>
                    </button>
                  ))}
                </div>
              </Panel>
              <Panel title="数据来源">
                <dl className="do-kv">
                  <dt>样品</dt>
                  <dd>
                    {s.samples.find((x) => x.id === result.sampleId)?.name ||
                      "样品待关联"}
                  </dd>
                  <dt>实验批次</dt>
                  <dd>{task?.batch || "—"}</dd>
                  <dt>数据方法</dt>
                  <dd>{result.method}</dd>
                  <dt>数据点</dt>
                  <dd>{result.points.length}</dd>
                  <dt>采集时间</dt>
                  <dd>{result.createdAt}</dd>
                </dl>
              </Panel>
            </div>
            <div className="do-stack">
              <Panel title="表征数据与可视化">
                <Tabs
                  items={[
                    "测量曲线",
                    "图谱分析",
                    "图像特征",
                    "多样品对比",
                    "计算 vs 实验",
                    "原始数据",
                  ]}
                  value={tab}
                  onChange={setTab}
                />
                {tab === "图像特征" ? (
                  <div className="do-stack">
                    <input
                      hidden
                      ref={imgUpload}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImageUrl(String(reader.result));
                            setImageName(file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {imageUrl ? (
                      <div
                        style={{
                          backgroundImage: `url(${imageUrl})`,
                          backgroundSize: "contain",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          height: 300,
                          backgroundColor: "#f2f3f4",
                        }}
                        role="img"
                        aria-label={imageName}
                      />
                    ) : (
                      <svg
                        viewBox="0 0 500 260"
                        role="img"
                        aria-label="颗粒形貌演示示意图，非真实 SEM 数据"
                        style={{
                          width: "100%",
                          background: "#f0f2f4",
                          borderRadius: 5,
                        }}
                      >
                        {Array.from({ length: 48 }, (_, i) => (
                          <circle
                            key={i}
                            cx={28 + (i % 8) * 64 + (i % 3) * 8}
                            cy={24 + Math.floor(i / 8) * 42}
                            r={10 + (i % 4) * 3}
                            fill={["#b7bec5", "#cbd0d5", "#9fa9b3"][i % 3]}
                            stroke="#e2e5e8"
                            strokeWidth="3"
                          />
                        ))}
                        <text x="285" y="245" fill="#586878" fontSize="11">
                          演示形貌示意 · 非真实显微图
                        </text>
                      </svg>
                    )}
                    <Button onClick={() => imgUpload.current?.click()}>
                      <Upload />
                      选择显微图像
                    </Button>
                    <p className="do-note">
                      {imageName
                        ? `已加载 ${imageName}，可人工观察颗粒分布。`
                        : "示意图用于演示形貌分析工作区。"}
                      当前未连接图像识别模型，不自动声称粒径或晶体结构识别结果。
                    </p>
                  </div>
                ) : tab === "原始数据" ? (
                  <div className="do-table-wrap">
                    <table className="do-table">
                      <thead>
                        <tr>
                          <th>横坐标</th>
                          <th>样品 A</th>
                          <th>样品 B</th>
                          <th>计算结果</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.points.map((p, i) => (
                          <tr key={i}>
                            <td>{p.x}</td>
                            <td>{p.a}</td>
                            <td>{p.b}</td>
                            <td>{p.computed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    {tab === "多样品对比" && (
                      <Field label="对比批次">
                        <select
                          value={compareId}
                          onChange={(e) => setCompareId(e.target.value)}
                        >
                          <option value="">当前批次样品 B</option>
                          {s.projectResults
                            .filter((r) => r.id !== result.id)
                            .map((r) => (
                              <option value={r.id} key={r.id}>
                                {r.name}
                              </option>
                            ))}
                        </select>
                      </Field>
                    )}
                    <div className="do-chart" style={{ marginTop: 16 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {tab === "图谱分析" ? (
                          <AreaChart data={points}>
                            <CartesianGrid stroke="#edf0f4" vertical={false} />
                            <XAxis dataKey="x" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} width={40} />
                            <Tooltip />
                            <Area
                              type="monotone"
                              name="测量响应"
                              dataKey="a"
                              stroke="#b4232d"
                              fill="#f6dde1"
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                          </AreaChart>
                        ) : (
                          <LineChart
                            data={
                              tab === "多样品对比" ? comparisonPoints : points
                            }
                          >
                            <CartesianGrid stroke="#edf0f4" vertical={false} />
                            <XAxis dataKey="x" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} width={40} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line
                              name="实验样品 A"
                              dataKey="a"
                              type="monotone"
                              stroke="#b4232d"
                              strokeWidth={2}
                              dot={false}
                            />
                            {tab === "计算 vs 实验" ? (
                              <Line
                                name="计算预测"
                                dataKey="computed"
                                stroke="#66839d"
                                strokeWidth={2}
                                strokeDasharray="5 4"
                                dot={false}
                              />
                            ) : (
                              <Line
                                name={compare ? "对比批次" : "实验样品 B"}
                                dataKey="b"
                                type="monotone"
                                stroke="#748ca1"
                                strokeWidth={2}
                                dot={false}
                              />
                            )}
                          </LineChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                    <p
                      className="do-muted"
                      style={{ textAlign: "center", fontSize: 11 }}
                    >
                      横坐标：采集时间 / s　·　纵坐标：{unit}　·　
                      {tab === "图谱分析"
                        ? "通用测量响应图谱，峰位不映射物相。"
                        : "演示测量数据"}
                    </p>
                  </>
                )}
                <div className="do-row" style={{ marginTop: 18 }}>
                  <Button
                    onClick={() =>
                      download(
                        `${result.name}-原始.csv`,
                        "x,sample_A,sample_B,computed\n" +
                          result.points
                            .map((p) => `${p.x},${p.a},${p.b},${p.computed}`)
                            .join("\n"),
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    <Download />
                    原始数据
                  </Button>
                  <Button
                    onClick={() =>
                      download(
                        `${result.name}-处理后.csv`,
                        "x,sample_A,sample_B,computed\n" +
                          points
                            .map((p) => `${p.x},${p.a},${p.b},${p.computed}`)
                            .join("\n"),
                        "text/csv;charset=utf-8",
                      )
                    }
                  >
                    导出处理结果
                  </Button>
                </div>
              </Panel>
              <Panel title="数据处理">
                <div className="do-row">
                  {["数据清洗", "曲线平滑", "归一化转换"].map((op) => (
                    <label className="do-check" key={op}>
                      <input
                        type="checkbox"
                        checked={ops.includes(op)}
                        onChange={(e) =>
                          setOps(
                            e.target.checked
                              ? [...ops, op]
                              : ops.filter((x) => x !== op),
                          )
                        }
                      />
                      {op}
                    </label>
                  ))}
                  <Button
                    onClick={() => {
                      s.updateResult(result.id, {
                        processed: ops.length > 0,
                        operations: ops,
                        report: "",
                        confirmed: false,
                      });
                      setNotice(
                        "数据处理已应用，原始数据保留。请重新生成与复核报告。",
                      );
                    }}
                  >
                    应用处理
                  </Button>
                </div>
                <small>
                  曲线平滑采用 3
                  点移动平均，归一化按全局最大值缩放。修改处理流程后重新确认结论。
                </small>
                <p style={{ marginTop: 10 }}>
                  <Badge>
                    {result.operations.join(" → ") || "保留原始数据"}
                  </Badge>
                </p>
              </Panel>
            </div>
            <Panel
              title="AI 分析助手"
              actions={<Sparkles size={16} color="#b4232d" />}
            >
              <Tabs
                items={["特征识别", "差异解释", "机理分析", "实验报告"]}
                value={assistantTab}
                onChange={setAssistantTab}
              />
              <div className="do-stack">
                {assistantTab === "实验报告" ? (
                  <>
                    <p className="do-report">
                      {result.report ||
                        "点击“生成实验报告”形成结构化实验结果摘要。"}
                    </p>
                    {result.report && (
                      <Button
                        onClick={() => {
                          setReportEdit(result.report);
                          setEditing(true);
                        }}
                      >
                        人工编辑报告
                      </Button>
                    )}
                  </>
                ) : assistantTab === "特征识别" ? (
                  <>
                    <div className="do-result-metric">
                      <strong>{maxA.toFixed(2)}</strong>
                      <span className="do-muted">样品 A 峰值</span>
                    </div>
                    <p>
                      峰位置：{peak?.x} s；有效点数：{points.length}。
                    </p>
                    <p className="do-note">
                      基于当前曲线进行数值统计，未进行物相或机理自动识别。
                    </p>
                  </>
                ) : assistantTab === "差异解释" ? (
                  <>
                    <p>
                      样品 A 与 B 峰值差：
                      <strong>{(maxA - maxB).toFixed(3)}</strong>。
                    </p>
                    <p>
                      计算–实验 RMSE：<strong>{rmse.toFixed(3)}</strong>。
                    </p>
                    <p className="do-note">
                      建议核对仪器校准、真实实验参数和边界条件，补充重复实验再解释差异。
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      待检验假设：{plan?.hypothesis || "请关联课题科学假设。"}
                    </p>
                    <p className="do-note">
                      单一表征曲线不足以证实反应机理。建议联合结构表征与重复实验，核验原始文献。
                    </p>
                  </>
                )}
                <Field label="补充分析问题">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="例如：如何验证计算与实验偏差？"
                  />
                </Field>
                <Button
                  disabled={!input.trim()}
                  onClick={() => {
                    setAnswer(
                      `针对“${input}”：当前 RMSE 为 ${rmse.toFixed(3)}。建议先核对实际参数与计算边界，再复核重复性。可通过下方回流创建模型校准或补充研究草稿。`,
                    );
                    setInput("");
                  }}
                >
                  分析当前数据
                </Button>
                {answer && <p className="do-message">{answer}</p>}
              </div>
            </Panel>
          </div>
          {result.report && (
            <Panel
              title="实验结果 Artifact"
              actions={
                <Badge>
                  {result.confirmed ? "已确认正式结论" : "待人工确认"}
                </Badge>
              }
            >
              <div className="do-stack">
                <p className="do-muted">
                  结果包包括实验目标、关键结果、主要特征、计算–实验偏差、科学假设、异常与下一步建议。
                </p>
                <div className="do-row">
                  <Button
                    onClick={() =>
                      download(`${result.id}-实验报告.md`, result.report)
                    }
                  >
                    <Download />
                    导出实验报告
                  </Button>
                  <Button
                    variant="primary"
                    disabled={result.confirmed}
                    onClick={() => setConfirm("conclusion")}
                  >
                    <CheckCircle2 />
                    确认实验结论
                  </Button>
                  <Button
                    disabled={!result.confirmed}
                    onClick={() => setConfirm("做 → 算")}
                  >
                    <Calculator />
                    用于模型校准 / 重新计算
                  </Button>
                  <Button
                    disabled={!result.confirmed}
                    onClick={() => setConfirm("做 → 读")}
                  >
                    <BookOpen />
                    补充文献研究
                  </Button>
                </div>
                {transfers.map((h) => (
                  <div className="do-note success" key={h.id}>
                    <div className="do-row do-between">
                      <span>
                        {h.direction} · 已创建 {h.targetId}
                      </span>
                      <NavLink to={h.href}>
                        打开下游草稿
                        <ArrowRight />
                      </NavLink>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </>
      )}
      <Modal
        open={uploading}
        onClose={() => setUploading(false)}
        title="上传实验数据"
        footer={
          <Button
            variant="primary"
            disabled={!uploadTask}
            onClick={() => upload.current?.click()}
          >
            <Upload />
            选择 CSV / TSV 文件
          </Button>
        }
      >
        <div className="do-stack">
          <Field label="关联实验任务">
            <select
              value={uploadTask}
              onChange={(e) => setUploadTask(e.target.value)}
            >
              <option value="">请选择</option>
              {s.projectTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </Field>
          <p>
            列格式：横坐标、样品 A、样品
            B（可选）、计算结果（可选）。第一行为表头，后续为数值数据。
          </p>
          <Button
            onClick={() =>
              download(
                "实验数据模板.csv",
                "x,sample_A,sample_B,computed\n" +
                  demoPoints
                    .map((p) => `${p.x},${p.a},${p.b},${p.computed}`)
                    .join("\n"),
                "text/csv;charset=utf-8",
              )
            }
          >
            下载示例 CSV
          </Button>
        </div>
        <input
          ref={upload}
          hidden
          type="file"
          accept=".csv,.tsv"
          onChange={(e) => {
            void importFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </Modal>
      <Modal
        wide
        open={editing}
        onClose={() => setEditing(false)}
        title="人工编辑实验报告"
        footer={
          <Button
            variant="primary"
            disabled={!reportEdit.trim()}
            onClick={() => {
              if (result)
                s.updateResult(result.id, {
                  report: reportEdit,
                  confirmed: false,
                });
              setEditing(false);
            }}
          >
            保存报告并重新确认
          </Button>
        }
      >
        <textarea
          className="do-prd-text"
          aria-label="实验报告正文"
          value={reportEdit}
          onChange={(e) => setReportEdit(e.target.value)}
        />
      </Modal>
      <Confirm
        open={!!confirm}
        onClose={() => setConfirm("")}
        title={
          confirm === "conclusion"
            ? "人工确认正式实验结论"
            : `确认结果回流：${confirm}`
        }
        onConfirm={() => {
          if (!result) return;
          if (confirm === "conclusion") {
            s.updateResult(result.id, { confirmed: true });
            setConfirm("");
            setNotice("实验结论已人工确认，可用于结果回流。");
          } else void transfer(confirm);
        }}
      >
        <div className="do-stack">
          <p>
            {confirm === "conclusion"
              ? "确认已复核原始数据、处理流程、异常记录和结论适用范围。"
              : "将实验真实参数、原始与处理后数据、偏差、异常样本和来源信息传递至下游工作区，创建可继续编辑的草稿。"}
          </p>
          <strong>{result?.name}</strong>
          <p className="do-note">
            本地模拟数据不作为真实科研结论，回流不会启动真实计算或模型训练。
          </p>
        </div>
      </Confirm>
    </div>
  );
}
