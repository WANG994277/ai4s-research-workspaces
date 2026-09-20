'use client';
import { useState } from 'react';
import { papers, getCitation } from '@/lib/literature-data';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Modal,
  Tabs,
  Notice,
  Status,
  useLocalState,
  useResearchProject,
  downloadText,
} from './workspace-kit';
type Report = {
  id: string;
  projectId: string;
  name: string;
  template: string;
  sections: { title: string; body: string }[];
  citations: number[];
  version: number;
  snapshots: string[];
  status: string;
};
const outlines: Record<string, string[]> = {
  科研报告: ['摘要', '研究背景', '研究方法', '结果与讨论', '结论', '参考文献'],
  文献综述: ['研究范围', '检索策略', '证据对比', '研究空白', '参考文献'],
  技术交底书: ['技术领域', '背景技术', '技术方案', '实施方式', '附图说明'],
};
export function ReportWorkspace() {
  const { project } = useResearchProject();
  const [reports, setReports] = useLocalState<Report[]>('ai4s-reports-v2', []);
  const [selected, setSelected] = useState('');
  const [chapter, setChapter] = useState(0);
  const [tab, setTab] = useState('章节编辑');
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('科研报告');
  const [notice, setNotice] = useState('');
  const [checks, setChecks] = useState<string[]>([]);
  const [cite, setCite] = useState(false);
  const [citeQuery, setCiteQuery] = useState('');
  const local = reports.filter((r) => r.projectId === project.id);
  const report = local.find((r) => r.id === selected) ?? local[0];
  const section =
    report?.sections[Math.min(chapter, (report?.sections.length ?? 1) - 1)];
  function edit(changes: Partial<Report>) {
    if (report)
      setReports((all) =>
        all.map((r) => (r.id === report.id ? { ...r, ...changes } : r)),
      );
  }
  function content() {
    return report
      ? `# ${report.name}\n\n${report.sections.map((s) => `## ${s.title}\n${s.body}`).join('\n\n')}\n\n## 引用\n${report.citations
          .map((id) => {
            const p = papers.find((p) => p.id === id);
            return p ? getCitation(p, 'gb') : `来源 ${id}`;
          })
          .join('\n')}`
      : '';
  }
  function saveVersion() {
    if (report) {
      edit({
        snapshots: [...report.snapshots, content()],
        version: report.version + 1,
      });
      setNotice('已保存版本快照；正文已自动保存在本机。');
    }
  }
  function check() {
    if (!report) return;
    const issues = report.sections
      .filter((s) => !s.body.trim())
      .map((s) => `“${s.title}”尚未填写`);
    if (!report.citations.length) issues.push('尚未绑定引用来源');
    if (/CO2/.test(content()) && /CO₂/.test(content()))
      issues.push('术语不一致：CO2 与 CO₂ 混用');
    if (
      report.template === '技术交底书' &&
      !report.sections.some((s) => s.title === '实施方式' && s.body.trim())
    )
      issues.push('缺少可验证的实施方式');
    setChecks(
      issues.length
        ? issues
        : ['结构与引用基础检查通过；科学结论仍需人工核验。'],
    );
    setTab('质量检查');
  }
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="科研报告撰写"
        description="按模板组织章节，绑定来源证据，编辑、检查并保存报告版本。"
      >
        <button className="research-primary" onClick={() => setCreate(true)}>
          新建报告
        </button>
      </WorkspaceHeader>
      {notice && <Notice>{notice}</Notice>}
      <div className="grid grid-cols-[220px_minmax(0,1fr)_280px] gap-4">
        <Panel title="课题报告">
          <div className="space-y-2">
            {local.map((r) => (
              <button
                className={`w-full rounded-lg border p-3 text-left ${r.id === report?.id ? 'border-primary bg-secondary' : 'border-line'}`}
                key={r.id}
                onClick={() => {
                  setSelected(r.id);
                  setChapter(0);
                }}
              >
                <span className="block text-sm">{r.name}</span>
                <small>
                  {r.template} · v{r.version}
                </small>
              </button>
            ))}
          </div>
          {report && (
            <>
              <h2 className="mb-3 mt-6 text-sm font-semibold">章节大纲</h2>
              {report.sections.map((s, i) => (
                <button
                  key={i}
                  className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-sm ${s === section ? 'bg-surface-2 text-primary' : ''}`}
                  onClick={() => {
                    setChapter(i);
                    setTab('章节编辑');
                  }}
                >
                  {i + 1}. {s.title}
                </button>
              ))}
            </>
          )}
        </Panel>
        <Panel title={report?.name ?? '开始撰写'}>
          {report && section ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Status>{report.status}</Status>
                <Status>v{report.version} · 自动保存</Status>
                <button className="research-button" onClick={saveVersion}>
                  保存版本
                </button>
                <button
                  className="research-button"
                  onClick={() =>
                    downloadText(
                      `${report.name}.md`,
                      content(),
                      'text/markdown;charset=utf-8',
                    )
                  }
                >
                  导出 Markdown
                </button>
              </div>
              <Tabs
                tabs={['章节编辑', '质量检查', '版本对比']}
                value={tab}
                onChange={setTab}
              />
              {tab === '章节编辑' && (
                <>
                  <Field label="章节名称">
                    <input
                      className="research-input"
                      value={section.title}
                      onChange={(e) =>
                        edit({
                          sections: report.sections.map((s, i) =>
                            i === chapter ? { ...s, title: e.target.value } : s,
                          ),
                        })
                      }
                    />
                  </Field>
                  <Field label="章节正文">
                    <textarea
                      className="research-input min-h-[350px] leading-7"
                      value={section.body}
                      onChange={(e) =>
                        edit({
                          sections: report.sections.map((s, i) =>
                            i === chapter ? { ...s, body: e.target.value } : s,
                          ),
                        })
                      }
                      placeholder="编辑内容，可使用 Markdown 表格、公式和引用编号。"
                    />
                  </Field>
                  <button
                    className="research-button"
                    onClick={() => setCite(true)}
                  >
                    插入证据引用
                  </button>
                  <button
                    className="research-button ml-2"
                    onClick={() =>
                      edit({
                        sections: [
                          ...report.sections,
                          { title: '新增章节', body: '' },
                        ],
                      })
                    }
                  >
                    添加章节
                  </button>
                </>
              )}
              {tab === '质量检查' && (
                <div className="space-y-4">
                  <button className="research-primary" onClick={check}>
                    检查结构、术语与引用
                  </button>
                  <ul className="space-y-3">
                    {checks.map((c, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-surface-2 p-3 text-sm"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                  <Notice>
                    重复内容与 AIGC
                    检测属于外部检测服务，当前未连接。不会将简单文字检查作为检测结论。
                  </Notice>
                </div>
              )}
              {tab === '版本对比' && (
                <div className="space-y-4">
                  <p className="text-sm">
                    历史快照 {report.snapshots.length} 个
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <pre className="max-h-[450px] overflow-auto whitespace-pre-wrap bg-surface-2 p-3 text-xs leading-6">
                      {report.snapshots.at(-1) ?? '尚未保存版本快照'}
                    </pre>
                    <pre className="max-h-[450px] overflow-auto whitespace-pre-wrap bg-secondary/30 p-3 text-xs leading-6">
                      {content()}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">
                选择科研报告、文献综述或技术交底书模板，开始组织研究材料。
              </p>
              <button
                className="research-primary mt-5"
                onClick={() => setCreate(true)}
              >
                选择模板
              </button>
            </div>
          )}
        </Panel>
        <Panel title="资料与写作检查">
          <div className="space-y-4">
            <p className="text-sm">当前课题：{project.name}</p>
            <p className="text-xs text-muted-foreground">
              引用必须保留来源文献。AI生成的段落在核验后再采纳。
            </p>
            <button
              disabled={!report}
              className="research-button w-full"
              onClick={check}
            >
              专业文稿质量检查
            </button>
            {report?.citations.map((id) => {
              const paper = papers.find((p) => p.id === id);
              return (
                <a
                  key={id}
                  href={`/literature-search/${id}`}
                  className="block rounded-lg border border-line p-3 text-xs leading-6 text-blue"
                >
                  [{id}] {paper?.title}
                </a>
              );
            })}
            <label className="research-button w-full cursor-pointer">
              导入章节文本
              <input
                type="file"
                accept=".md,.txt"
                className="sr-only"
                disabled={!report}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file && report) {
                    const body = await file.text();
                    edit({
                      sections: report.sections.map((s, i) =>
                        i === chapter ? { ...s, body } : s,
                      ),
                    });
                  }
                }}
              />
            </label>
          </div>
        </Panel>
      </div>
      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="选择报告模板"
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const id = `REPORT-${Date.now()}`;
            setReports((all) => [
              ...all,
              {
                id,
                projectId: project.id,
                name,
                template,
                sections: outlines[template].map((title) => ({
                  title,
                  body: '',
                })),
                citations: [],
                version: 1,
                snapshots: [],
                status: '草稿',
              },
            ]);
            setSelected(id);
            setChapter(0);
            setCreate(false);
            setName('');
          }}
        >
          <Field label="报告名称">
            <input
              className="research-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="模板">
            <select
              className="research-input"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            >
              {Object.keys(outlines).map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <p className="text-sm text-muted-foreground">
            {outlines[template].join(' → ')}
          </p>
          <button className="research-primary">创建报告</button>
        </form>
      </Modal>
      <Modal open={cite} onClose={() => setCite(false)} title="选择引用证据">
        <input
          className="research-input"
          aria-label="搜索引用文献"
          value={citeQuery}
          onChange={(e) => setCiteQuery(e.target.value)}
          placeholder="标题关键词"
        />
        {papers
          .filter((p) =>
            p.title.toLowerCase().includes(citeQuery.toLowerCase()),
          )
          .slice(0, 8)
          .map((p) => (
            <button
              className="research-button justify-start text-left"
              key={p.id}
              onClick={() => {
                if (!report) return;
                edit({
                  citations: [...new Set([...report.citations, p.id])],
                  sections: report.sections.map((s, i) =>
                    i === chapter
                      ? {
                          ...s,
                          body:
                            s.body +
                            `\n[${p.id}] ${p.title}（请补充页码及引用片段）`,
                        }
                      : s,
                  ),
                });
                setCite(false);
              }}
            >
              {p.title}
            </button>
          ))}
      </Modal>
    </div>
  );
}
