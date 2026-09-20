"use client";
import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { Button, Modal, download } from "./ui";
export const requirementSections: Record<
  string,
  { title: string; chapters: number[] }
> = {
  "DO-HOME": { title: "做空间首页", chapters: [8, 17, 18, 25] },
  "DO-AGENT": { title: "实验方案设计与生成", chapters: [9, 21, 22] },
  "DO-PLAN": { title: "方案详情、版本与审核", chapters: [10, 22] },
  "DO-ORCHESTRATE": { title: "实验自动编排", chapters: [11, 22, 23] },
  "DO-SAMPLES": { title: "样品与记录", chapters: [12] },
  "DO-EQUIPMENT": { title: "设备纳管与共享", chapters: [13] },
  "DO-BOOKINGS": { title: "实验仪器预约", chapters: [14, 22] },
  "DO-TASKS": { title: "实验管理", chapters: [15, 22, 23] },
  "DO-ANALYSIS": { title: "表征分析与结果回流", chapters: [16, 19, 20, 22] },
};
export function PrdTools({
  pageId,
  inspect,
  onInspect,
  selected,
  onClose,
}: {
  pageId: string;
  inspect: boolean;
  onInspect: () => void;
  selected: string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState("");
  const [current, setCurrent] = useState("");
  useEffect(() => {
    fetch("/do-space-prd.md")
      .then((r) => r.text())
      .then((content) => {
        setText(localStorage.getItem("ai4s-do-prd-edit") || content);
      })
      .catch(() => setSaved("原始 PRD 加载失败，请刷新重试。"));
  }, []);
  function section(value: string, id: string) {
    const chapters = requirementSections[id]?.chapters ?? [];
    return value
      .split(/(?=^# \d+\.)/m)
      .filter((part) =>
        chapters.some((n) => new RegExp(`^# ${n}\\.`).test(part)),
      )
      .join("\n");
  }
  useEffect(() => {
    if (selected) setCurrent(section(text, selected));
  }, [selected, text]);
  function save() {
    const chapters = requirementSections[selected]?.chapters ?? [];
    const parts = text.split(/(?=^# \d+\.)/m);
    let inserted = false;
    const updated = parts
      .map((part) => {
        if (!chapters.some((n) => new RegExp(`^# ${n}\\.`).test(part)))
          return part;
        if (inserted) return "";
        inserted = true;
        return current + "\n\n";
      })
      .join("");
    localStorage.setItem("ai4s-do-prd-edit", updated);
    setText(updated);
    setSaved("已保存到本地");
  }
  return (
    <>
      <div className="do-row">
        <Button variant="ghost" onClick={onInspect}>
          <FileText />
          {inspect ? "退出需求检查" : "需求检查"}
        </Button>
        <Button
          variant="ghost"
          disabled={!text}
          onClick={() =>
            download(
              `${requirementSections[pageId]?.title}-需求.md`,
              section(text, pageId),
            )
          }
        >
          当前页面需求
        </Button>
        <Button
          variant="ghost"
          disabled={!text}
          onClick={() => download("AI4S_做空间_PRD.md", text)}
        >
          <Download />
          完整 PRD
        </Button>
      </div>
      <Modal
        drawer
        open={!!selected}
        onClose={onClose}
        title={`${requirementSections[selected]?.title ?? "需求"} · PRD`}
        footer={
          <>
            <span role="status">{saved}</span>
            <Button onClick={save}>保存 PRD</Button>
            <Button
              variant="primary"
              onClick={() => download("AI4S_做空间_PRD.md", text)}
            >
              下载完整 PRD
            </Button>
          </>
        }
      >
        <div className="do-stack">
          <p className="do-muted">
            来源：AI4S_做空间_PRD_V1.0.md，第{" "}
            {requirementSections[selected]?.chapters.join("、")}{" "}
            章。修改在本浏览器保存，不改写原始文件。
          </p>
          <textarea
            aria-label="编辑页面需求"
            className="do-prd-text"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setSaved("尚未保存");
            }}
          />
        </div>
      </Modal>
    </>
  );
}
