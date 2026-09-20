'use client';
import { useState } from 'react';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Modal,
  Tabs,
  Notice,
  Empty,
  Status,
  useLocalState,
  useResearchProject,
  downloadText,
  NextActions,
} from './workspace-kit';
type Note = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  tags: string;
  version: number;
  versions: { version: number; body: string; time: string }[];
  comments: string[];
  shared: boolean;
};
const initial: Note[] = [
  {
    id: 'NOTE-001',
    projectId: 'PROJ-CCUS-01',
    title: '催化剂失活机理研读笔记',
    body: '## 研究问题\n首轮催化活性下降是否与温度控制有关？\n\n## 文献证据\nLIT-001，示例证据，待原文核验。\n\n## 下一步\n复核温度记录，比较首轮实验数据。',
    tags: '催化剂,失活机理',
    version: 1,
    versions: [],
    comments: ['张博士：补充温度记录作为证据。'],
    shared: false,
  },
];
export function NotesWorkspace() {
  const { project } = useResearchProject();
  const [notes, setNotes] = useLocalState('ai4s-notes-v2', initial);
  const [selected, setSelected] = useState('NOTE-001');
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('编辑');
  const [comment, setComment] = useState('');
  const [notice, setNotice] = useState('');
  const [create, setCreate] = useState(false);
  const [name, setName] = useState('');
  const [sharing, setSharing] = useState(false);
  const rows = notes.filter(
    (n) => n.projectId === project.id && `${n.title} ${n.tags}`.includes(query),
  );
  const note = rows.find((n) => n.id === selected) ?? rows[0];
  function edit(changes: Partial<Note>) {
    if (note)
      setNotes((all) =>
        all.map((n) => (n.id === note.id ? { ...n, ...changes } : n)),
      );
  }
  function version() {
    if (!note) return;
    edit({
      version: note.version + 1,
      versions: [
        ...note.versions,
        {
          version: note.version,
          body: note.body,
          time: new Date().toLocaleString('zh-CN'),
        },
      ],
    });
    setNotice('已保存版本快照；编辑内容自动保存在本机。');
  }
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="文件与笔记"
        description="按课题组织资料和科研笔记，保留标签、评论、版本与分享记录。"
      >
        <button className="research-primary" onClick={() => setCreate(true)}>
          新建笔记
        </button>
      </WorkspaceHeader>
      {notice && <Notice>{notice}</Notice>}
      <div className="grid grid-cols-[250px_minmax(0,1fr)] gap-5">
        <Panel title="课题资料">
          <input
            aria-label="搜索文件与笔记"
            className="research-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="标题或标签"
          />
          <div className="mt-4 space-y-2">
            {rows.map((n) => (
              <button
                key={n.id}
                className={`w-full rounded-lg border p-3 text-left ${note?.id === n.id ? 'border-primary bg-secondary' : 'border-line'}`}
                onClick={() => setSelected(n.id)}
              >
                <span className="block text-sm font-medium">{n.title}</span>
                <small className="text-muted-foreground">
                  {n.tags} · v{n.version}
                </small>
              </button>
            ))}
          </div>
          <label className="research-button mt-4 w-full cursor-pointer">
            导入文本资料
            <input
              className="sr-only"
              type="file"
              accept=".txt,.md"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const body = await file.text();
                const id = `NOTE-${Date.now()}`;
                setNotes((all) => [
                  ...all,
                  {
                    id,
                    projectId: project.id,
                    title: file.name,
                    body,
                    tags: '导入资料',
                    version: 1,
                    versions: [],
                    comments: [],
                    shared: false,
                  },
                ]);
                setSelected(id);
                setNotice('文本资料已导入当前课题。');
              }}
            />
          </label>
        </Panel>
        <Panel>
          {note ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{note.title}</h2>
                  <span className="text-xs text-muted-foreground">
                    {note.id} · 当前 v{note.version} · 本地自动保存
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="research-button" onClick={version}>
                    保存版本
                  </button>
                  <button
                    className="research-button"
                    onClick={() => setSharing(true)}
                  >
                    分享范围
                  </button>
                  <button
                    className="research-button"
                    onClick={() =>
                      downloadText(
                        `${note.title}.md`,
                        note.body,
                        'text/markdown;charset=utf-8',
                      )
                    }
                  >
                    导出
                  </button>
                </div>
              </div>
              <Tabs
                tabs={['编辑', '版本对比', '评论']}
                value={tab}
                onChange={setTab}
              />
              {tab === '编辑' && (
                <>
                  <Field label="标签（逗号分隔）">
                    <input
                      className="research-input"
                      value={note.tags}
                      onChange={(e) => edit({ tags: e.target.value })}
                    />
                  </Field>
                  <Field label="科研笔记正文">
                    <textarea
                      className="research-input min-h-[360px] font-mono leading-7"
                      value={note.body}
                      onChange={(e) => edit({ body: e.target.value })}
                    />
                  </Field>
                </>
              )}
              {tab === '版本对比' && (
                <>
                  {note.versions.length ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="mb-2 text-sm font-medium">
                            上次快照 v{note.versions.at(-1)?.version}
                          </h3>
                          <pre className="min-h-64 whitespace-pre-wrap rounded-lg bg-surface-2 p-4 text-sm">
                            {note.versions.at(-1)?.body}
                          </pre>
                        </div>
                        <div>
                          <h3 className="mb-2 text-sm font-medium">
                            当前版本 v{note.version}
                          </h3>
                          <pre className="min-h-64 whitespace-pre-wrap rounded-lg bg-secondary/40 p-4 text-sm">
                            {note.body}
                          </pre>
                        </div>
                      </div>
                      {note.versions.map((v) => (
                        <div
                          className="flex items-center justify-between border-t border-line pt-3 text-sm"
                          key={v.version}
                        >
                          <span>
                            v{v.version} · {v.time}
                          </span>
                          <button
                            className="research-button"
                            onClick={() => {
                              edit({
                                body: v.body,
                                version: note.version + 1,
                                versions: [
                                  ...note.versions,
                                  {
                                    version: note.version,
                                    body: note.body,
                                    time: new Date().toLocaleString('zh-CN'),
                                  },
                                ],
                              });
                              setNotice(
                                '已从历史版本恢复内容，并保留恢复前快照。',
                              );
                            }}
                          >
                            恢复为新版本
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty message="保存第一个版本后，可在这里对比修改和恢复历史内容。" />
                  )}
                </>
              )}
              {tab === '评论' && (
                <>
                  <ul className="space-y-3">
                    {note.comments.map((c, i) => (
                      <li
                        className="rounded-lg bg-surface-2 p-3 text-sm"
                        key={i}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                  <Field label="评论或引用说明">
                    <textarea
                      className="research-input"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </Field>
                  <button
                    className="research-primary"
                    disabled={!comment.trim()}
                    onClick={() => {
                      edit({
                        comments: [...note.comments, `张博士：${comment}`],
                      });
                      setComment('');
                    }}
                  >
                    保存评论
                  </button>
                </>
              )}
              <div className="border-t border-line pt-4">
                <NextActions sourceId={`${note.id}@v${note.version}`} />
              </div>
            </div>
          ) : (
            <Empty message="当前课题尚无笔记，可新建笔记或导入文本资料。" />
          )}
        </Panel>
      </div>
      <Modal
        title="新建科研笔记"
        open={create}
        onClose={() => setCreate(false)}
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const id = `NOTE-${Date.now()}`;
            setNotes((all) => [
              ...all,
              {
                id,
                projectId: project.id,
                title: name,
                body: '',
                tags: '',
                version: 1,
                versions: [],
                comments: [],
                shared: false,
              },
            ]);
            setSelected(id);
            setName('');
            setCreate(false);
          }}
        >
          <Field label="笔记名称">
            <input
              className="research-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <button className="research-primary">创建</button>
        </form>
      </Modal>
      <Modal
        title="资料分享范围"
        open={sharing}
        onClose={() => setSharing(false)}
        description="演示授权范围，实际对外分享需要接入统一身份与权限服务。"
      >
        <p className="text-sm">
          当前范围：{note?.shared ? '课题组成员可见' : '仅本人'}
        </p>
        <button
          className="research-primary"
          onClick={() => {
            edit({ shared: !note?.shared });
            setSharing(false);
            setNotice(
              note?.shared
                ? '已撤回课题内分享。'
                : '已设置为课题内分享（本地演示）。',
            );
          }}
        >
          {note?.shared ? '撤回分享' : '允许课题组成员查看'}
        </button>
      </Modal>
    </div>
  );
}
