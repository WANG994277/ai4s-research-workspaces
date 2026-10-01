"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, CircleHelp, Sparkles } from "lucide-react";
import { createResourceDraft, personalResourceTypes, submitResourceForReview, type PersonalResource, type PersonalResourceType, type ResourceDraftInput } from "./my-resources-domain";
import { notify } from "./store";
import styles from "./my-resources.module.css";

const steps = ["填写基本信息", "AI 合规检测", "提交发布", "审核中", "发布完成"];
const spaces = ["配方优化课题", "高性能合成橡胶", "合成生物橡胶课题", "催化材料课题", "页岩气储层评价", "CCUS课题", "个人空间", "集团共享"];

export function ResourcePublish({ initial, profileId, onBack, onSave, onFinish }: {
  initial: PersonalResource | null; profileId: string; onBack: () => void;
  onSave: (resource: PersonalResource) => boolean; onFinish: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<PersonalResourceType | "">(initial?.type ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [tags, setTags] = useState(initial?.tags.join("、") ?? "");
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");

  const draft: ResourceDraftInput = { name, type, scope, description };
  function validatedResource() {
    const result = createResourceDraft(draft, profileId, initial?.id ?? `local-${crypto.randomUUID()}`);
    if (!result.ok) { setError(result.error); return null; }
    setError("");
    return { ...result.resource, tags: tags.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean).slice(0, 6), version: initial?.version ?? "V0.1" };
  }
  function saveDraft() {
    const item = validatedResource();
    if (!item) return;
    if (!onSave(item)) return;
    notify("资源草稿已保存到“我创建的”。");
    onFinish();
  }
  function next() {
    if (step === 0 && !validatedResource()) return;
    if (step < 2) setStep(step + 1);
  }
  function submit() {
    const item = validatedResource();
    if (!item) return;
    if (!onSave(submitResourceForReview(item))) return;
    notify("资源已提交，当前状态为审核中。");
    setStep(3);
  }
  function generateSuggestion() {
    if (!name.trim() || !type) { setError("先填写资源名称和类型，再生成说明建议。"); return; }
    setError("");
    setSuggestion(`${name.trim()}面向${scope || "指定科研空间"}的研究任务，提供${type}相关能力。使用时应明确输入材料、适用范围、结果验证方式和责任人，并记录证据来源。`);
  }

  return <main className={styles.publishPage}>
    <button type="button" className={styles.back} onClick={onBack}><ArrowLeft size={16} /> 返回我的资源</button>
    <div className={styles.publishHeader}><h1>{initial ? "编辑资源" : "新建资源"}</h1><p>填写资源资料，查看本地说明建议，提交后进入审核流程。</p></div>
    <ol className={styles.stepper}>{steps.map((label, index) => <li key={label} className={index === step ? styles.stepCurrent : index < step ? styles.stepDone : ""}><span>{index < step ? <Check size={14} /> : index + 1}</span><small>{label}</small></li>)}</ol>
    {step === 3 ? <section className={styles.publishSuccess}><span><Check size={28} /></span><h2>已提交审核</h2><p>资源已加入“我创建的”，状态为“审核中”。审批结果需要由真实审核系统提供；本地演示不会自动变成“已发布”。</p><button type="button" className={styles.primary} onClick={onFinish}>查看我创建的资源</button></section> : <section className={styles.publishPanel}>
      {step === 0 && <><h2>基本信息</h2><div className={styles.formGrid}><label>资源名称 <em>*</em><input maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：橡胶配方优化智能体" /><small>{name.length}/50</small></label><label>资源类型 <em>*</em><select value={type} onChange={(event) => setType(event.target.value as PersonalResourceType | "")}><option value="">请选择资源类型</option>{personalResourceTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>所属空间 <em>*</em><select value={scope} onChange={(event) => setScope(event.target.value)}><option value="">请选择所属空间</option>{spaces.map((item) => <option key={item}>{item}</option>)}</select></label><label className={styles.fullField}>资源描述 <em>*</em><textarea maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="描述资源用途、能力、输入输出和适用边界" /><small>{description.length}/200</small></label><label className={styles.fullField}>标签（可选）<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="用顿号分隔，最多 6 个" /></label></div></>}
      {step === 1 && <><h2>AI 合规检测</h2><p className={styles.helper}><CircleHelp size={15} /> 当前未连接 AI 合规服务；此处仅检查必填信息完整性并用本地模板生成说明建议，不代表合规结论。</p><div className={styles.suggestionCard}><div><Sparkles size={20} /><strong>资源说明建议</strong></div>{suggestion ? <p>{suggestion}</p> : <p>必填信息已完整。点击“生成说明建议”，查看可编辑的资源说明草稿。</p>}<div><button type="button" className={styles.secondary} onClick={generateSuggestion}>生成说明建议</button>{suggestion && <button type="button" className={styles.secondary} onClick={() => setDescription(suggestion.slice(0, 200))}>采用建议</button>}</div></div><p className={styles.helper}>资源名称、类型和所属空间将在下一步再次核对。</p></>}
      {step === 2 && <><h2>提交发布</h2><div className={styles.reviewList}><div><span>资源名称</span><strong>{name}</strong></div><div><span>资源类型</span><strong>{type}</strong></div><div><span>所属空间</span><strong>{scope}</strong></div><div><span>资源描述</span><strong>{description}</strong></div><div><span>标签</span><strong>{tags || "—"}</strong></div></div><p className={styles.helper}><CircleHelp size={15} /> 提交后状态为“审核中”，审核通过前不会进入可用资源。</p></>}
      {error && <p className={styles.formError} role="alert">{error}</p>}
      <footer className={styles.publishFooter}><button type="button" className={styles.secondary} onClick={onBack}>取消</button><div><button type="button" className={styles.secondary} onClick={saveDraft}>保存草稿</button>{step > 0 && <button type="button" className={styles.secondary} onClick={() => setStep(step - 1)}>上一步</button>}{step < 2 ? <button type="button" className={styles.primary} onClick={next}>下一步 <ChevronRight size={15} /></button> : <button type="button" className={styles.primary} onClick={submit}>提交审核 <ChevronRight size={15} /></button>}</div></footer>
    </section>}
  </main>;
}
