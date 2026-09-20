'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  FileText,
  NotebookPen,
  Clock,
  MessageSquare,
  Folder,
  Star,
  Users,
  Trash2,
  Upload,
  Download,
  Pencil,
  RotateCcw,
  Link as LinkIcon,
} from 'lucide-react';
import { today, timestamp, uid, type ResearchFile } from './model';
import {
  s,
  Header,
  TabBar,
  Panel,
  Badge,
  Tags,
  Stats,
  Filter,
  SearchBox,
  Pagination,
  pageSlice,
  Empty,
  Notice,
  Metadata,
  FormDialog,
  type FormField,
  useCollaborationData,
  useLocation,
  projectOptions,
  documentPreview,
  uploadRecord,
} from './shared';
import { downloadText } from '@/components/research/workspace-kit';
type Editor = {
  title: string;
  description?: string;
  fields: FormField[];
  submit?: string;
  save: (v: Record<string, string>) => void | string;
};
export function CollaborationFiles() {
  const { data, setData, ready, storageError } = useCollaborationData();
  const loc = useLocation();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [comment, setComment] = useState('');
  const uploadRef = useRef<HTMLInputElement>(null);
  const file = data.files.find((f) => f.id === loc.get('detail'));
  const tab = loc.get('tab', 'content');
  const view = loc.get('view', 'documents');
  const scope = loc.get('scope', 'all');
  const dirty = !!file && editing && draft !== file.content;
  useEffect(() => {
    if (!dirty) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  const filter = (key: string, value: string) =>
    loc.set({ [key]: value, page: undefined }, true);
  const base = data.files.filter((f) =>
    scope === 'trash' ? f.deleted : !f.deleted,
  );
  const filtered = base
    .filter(
      (f) =>
        (scope !== 'mine' || f.author === '张博士') &&
        (scope !== 'shared' ||
          (f.author !== '张博士' &&
            f.shares.some(
              (a) =>
                a.recipient === '课题成员' || a.recipient.includes('张博士'),
            ))) &&
        (scope !== 'favorite' || f.favorite) &&
        (!loc.get('project') ||
          data.projects.find((p) => p.id === f.projectId)?.name ===
            loc.get('project')) &&
        (!loc.get('type') || f.type === loc.get('type')) &&
        (!loc.get('tag') || f.tags.includes(loc.get('tag'))) &&
        (!loc.get('folder') || f.folder === loc.get('folder')) &&
        (!loc.get('updated') ||
          (loc.get('updated') === '本周更新'
            ? f.updated >= '2026-09-14'
            : f.updated.startsWith('2026-09'))) &&
        `${f.name} ${f.content} ${f.author} ${f.tags.join(' ')}`
          .toLowerCase()
          .includes(loc.get('q').toLowerCase()) &&
        (view !== 'sharing' ||
          f.shares.length > 0 ||
          f.versions.length > 0 ||
          f.comments.length > 0),
    )
    .sort((a, b) => b.updated.localeCompare(a.updated));
  const list = pageSlice(filtered, loc.get('page'), 8);
  const activeFiles = data.files.filter((f) => !f.deleted);
  const patch = (
    id: string,
    fn: (f: ResearchFile) => ResearchFile,
    msg: string,
  ) => {
    setData((d) => ({
      ...d,
      files: d.files.map((f) =>
        f.id === id ? { ...fn(f), updated: today } : f,
      ),
    }));
    setNotice(msg);
  };
  function back() {
    if (dirty)
      setEditor({
        title: '返回列表前确认',
        description:
          '当前有未保存的正文修改。可以取消返回并继续编辑，或放弃这些修改。',
        fields: [],
        submit: '放弃修改并返回',
        save: () => {
          setEditing(false);
          setEditor(null);
          loc.back();
        },
      });
    else {
      setEditing(false);
      loc.back();
    }
  }
  function create() {
    setEditor({
      title: '新建文档或笔记',
      fields: [
        { key: 'name', label: '文档 / 笔记名称', required: true, wide: true },
        {
          key: 'project',
          label: '所属课题',
          type: 'select',
          options: projectOptions(data),
          required: true,
          value: loc.get('project') || undefined,
        },
        {
          key: 'type',
          label: '类型',
          type: 'select',
          options: ['文档', '笔记', '报告'],
        },
        { key: 'tags', label: '标签（逗号分隔）', wide: true },
      ],
      save: (v) => {
        const p = data.projects.find((p) => p.name === v.project);
        if (!p) return '请选择课题';
        if (
          data.files.some(
            (f) => !f.deleted && f.projectId === p.id && f.name === v.name,
          )
        )
          return '当前课题下已存在同名文件，请更换名称。';
        const id = uid('DOC');
        const record: ResearchFile = {
          id,
          name: v.name,
          type: v.type,
          projectId: p.id,
          folder:
            (loc.get('project') === p.name ? loc.get('folder') : '') ||
            (v.type === '笔记' ? '笔记' : v.type === '报告' ? '报告' : '文档'),
          tags: v.tags.split(/[,，]/).filter(Boolean),
          author: '张博士',
          updated: today,
          content: '',
          version: 1,
          versions: [],
          comments: [],
          shares: [],
          refs: [{ type: '课题', id: p.id, name: p.name }],
          favorite: false,
          deleted: false,
        };
        setData((d) => ({ ...d, files: [record, ...d.files] }));
        setEditor(null);
        setDraft('');
        setEditing(true);
        loc.open(id);
        setNotice('已创建，填写正文后保存。');
      },
    });
  }
  function saveContent() {
    if (!file) return;
    patch(
      file.id,
      (f) => ({
        ...f,
        content: draft,
        version: f.version + 1,
        versions: [
          ...f.versions,
          {
            version: f.version,
            content: f.content,
            time: timestamp(),
            author: '张博士',
          },
        ],
      }),
      '已保存正文和历史版本',
    );
    setEditing(false);
  }
  function share() {
    if (!file) return;
    setEditor({
      title: '新增分享授权',
      description: '这里演示课题内分享范围；不会向外部发送文件或消息。',
      fields: [
        {
          key: 'recipient',
          label: '分享对象',
          required: true,
          value: '课题成员',
        },
        {
          key: 'permission',
          label: '权限',
          type: 'select',
          options: ['可查看', '可评论', '可编辑'],
        },
      ],
      save: (v) => {
        if (file.shares.some((x) => x.recipient === v.recipient))
          return '该对象已有授权，请先撤回旧授权。';
        patch(
          file.id,
          (f) => ({
            ...f,
            shares: [
              ...f.shares,
              { recipient: v.recipient, permission: v.permission },
            ],
          }),
          '分享范围已更新',
        );
        setEditor(null);
      },
    });
  }
  function download() {
    if (!file) return;
    if (file.dataUrl) {
      const a = document.createElement('a');
      a.href = file.dataUrl;
      a.download = file.name;
      a.click();
    } else
      downloadText(
        `${file.name}.md`,
        file.content,
        'text/markdown;charset=utf-8',
      );
  }
  if (!ready && loc.get('detail') && !storageError)
    return (
      <div className={s.root} aria-busy="true">
        <Notice message="正在读取协作记录…" />
      </div>
    );
  if (loc.get('detail') && !file)
    return (
      <div className={s.root}>
        <Header title="文件不存在" back={loc.back} />
        <Empty />
      </div>
    );
  return (
    <div className={s.root}>
      {file ? (
        <>
          <Header
            title={file.name}
            description={`${file.type} · ${data.projects.find((p) => p.id === file.projectId)?.name ?? '关联课题'} · ${file.author} · v${file.version}`}
            back={back}
            trail="文件列表"
          >
            <button
              className={s.button}
              onClick={() =>
                patch(
                  file.id,
                  (f) => ({ ...f, favorite: !f.favorite }),
                  file.favorite ? '已取消收藏' : '已收藏',
                )
              }
            >
              <Star size={14} fill={file.favorite ? 'currentColor' : 'none'} />
              {file.favorite ? '已收藏' : '收藏'}
            </button>
            <button className={s.button} onClick={download}>
              <Download size={14} />
              下载
            </button>
            {!file.dataUrl && !file.deleted && (
              <button
                className={s.primary}
                onClick={() => {
                  setDraft(file.content);
                  setEditing(true);
                  loc.set({ tab: 'content' });
                }}
              >
                <Pencil size={14} />
                编辑正文
              </button>
            )}
          </Header>
          <TabBar
            tabs={[
              { key: 'content', label: '内容预览' },
              { key: 'comments', label: `协作评论 (${file.comments.length})` },
              { key: 'versions', label: `版本历史 (${file.versions.length})` },
              { key: 'refs', label: `引用链接 (${file.refs.length})` },
              { key: 'sharing', label: '分享授权' },
            ]}
            value={tab}
            onChange={(t) => {
              if (dirty)
                return setNotice('请先保存正文或取消编辑，再切换页签。');
              setEditing(false);
              loc.set({ tab: t });
            }}
          />
          <Notice message={notice || storageError} />
          {file.deleted && (
            <Notice message="文件位于回收站。恢复后可继续编辑与分享。" />
          )}
          {tab === 'content' && (
            <div className={s.detailGrid}>
              <Panel
                title={editing ? '编辑正文' : '文档内容'}
                padded={false}
                actions={
                  editing ? (
                    <>
                      <button
                        className={s.button}
                        onClick={() => setEditing(false)}
                      >
                        取消编辑
                      </button>
                      <button className={s.primary} onClick={saveContent}>
                        保存版本
                      </button>
                    </>
                  ) : (
                    <Badge value={`当前 v${file.version}`} />
                  )
                }
              >
                {editing ? (
                  <textarea
                    aria-label="文档正文"
                    className={s.editor}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="输入正文，可使用 ## 标题和 - 列表。"
                  />
                ) : file.dataUrl && file.mime === 'application/pdf' ? (
                  <iframe
                    title="PDF 原文预览"
                    src={file.dataUrl}
                    style={{ width: '100%', height: 580, border: 0 }}
                  />
                ) : file.dataUrl && file.mime?.startsWith('image/') ? (
                  <div className={s.panelBody}>
                    <img
                      alt={file.name}
                      src={file.dataUrl}
                      style={{
                        maxWidth: '100%',
                        maxHeight: 550,
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                ) : file.content ? (
                  <article className={s.document}>
                    {documentPreview(file.content)}
                  </article>
                ) : (
                  <Empty
                    message={
                      file.dataUrl
                        ? '当前文件保留原始附件，请下载后用对应软件打开。'
                        : '正文为空，点击编辑正文开始撰写。'
                    }
                  />
                )}
              </Panel>
              <Panel title="文档信息">
                <Metadata
                  items={[
                    { label: '文件类型', value: file.type },
                    { label: '版本', value: `v${file.version}` },
                    { label: '作者', value: file.author },
                    { label: '更新日期', value: file.updated },
                    {
                      label: '文件大小',
                      value: file.size
                        ? `${(file.size / 1024).toFixed(1)} KB`
                        : '在线文档',
                    },
                    {
                      label: '分享范围',
                      value: file.shares.length
                        ? `${file.shares.length} 项授权`
                        : '仅本人',
                    },
                    {
                      label: '标签',
                      value: <Tags values={file.tags} />,
                      wide: true,
                    },
                  ]}
                />
                <div style={{ marginTop: 18 }}>
                  <button
                    className={s.button}
                    onClick={() =>
                      setEditor({
                        title: '编辑文件标签',
                        fields: [
                          {
                            key: 'tags',
                            label: '标签（逗号分隔）',
                            value: file.tags.join('，'),
                            wide: true,
                          },
                        ],
                        save: (v) => {
                          patch(
                            file.id,
                            (f) => ({
                              ...f,
                              tags: v.tags
                                .split(/[,，]/)
                                .map((t) => t.trim())
                                .filter(Boolean),
                            }),
                            '标签已更新',
                          );
                          setEditor(null);
                        },
                      })
                    }
                  >
                    维护标签
                  </button>
                </div>
              </Panel>
            </div>
          )}
          {tab === 'comments' && (
            <Panel title="协作评论">
              {file.comments.length ? (
                file.comments.map((c, i) => (
                  <div key={i} className={s.comment}>
                    <div className={s.actions}>
                      <strong>{c.author}</strong>
                      <span className={s.sub}>{c.time}</span>
                      <Badge value={c.resolved ? '已完成' : '待处理'} />
                    </div>
                    <p>{c.content}</p>
                    <button
                      className={s.link}
                      onClick={() =>
                        patch(
                          file.id,
                          (f) => ({
                            ...f,
                            comments: f.comments.map((x, j) =>
                              j === i ? { ...x, resolved: !x.resolved } : x,
                            ),
                          }),
                          c.resolved ? '评论已重新打开' : '评论已标记处理',
                        )
                      }
                    >
                      {c.resolved ? '重新打开' : '标记已处理'}
                    </button>
                  </div>
                ))
              ) : (
                <Empty message="暂无评论，可以针对文档内容补充意见。" />
              )}
              <div className={s.field} style={{ marginTop: 20 }}>
                <label htmlFor="file-comment">新增协作意见</label>
                <textarea
                  id="file-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="可注明章节、段落或引用内容…"
                />
              </div>
              <button
                style={{ marginTop: 12 }}
                className={s.primary}
                disabled={!comment.trim()}
                onClick={() => {
                  patch(
                    file.id,
                    (f) => ({
                      ...f,
                      comments: [
                        ...f.comments,
                        {
                          author: '张博士',
                          content: comment.trim(),
                          time: timestamp(),
                          resolved: false,
                        },
                      ],
                    }),
                    '评论已保存',
                  );
                  setComment('');
                }}
              >
                发布评论
              </button>
            </Panel>
          )}
          {tab === 'versions' && (
            <Panel title="版本历史与内容对比">
              {file.versions.length ? (
                file.versions
                  .slice()
                  .reverse()
                  .map((v) => (
                    <details className={s.comment} key={v.version}>
                      <summary style={{ cursor: 'pointer' }}>
                        <strong>历史版本 v{v.version}</strong> · {v.author} ·{' '}
                        {v.time}
                      </summary>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 16,
                          marginTop: 16,
                        }}
                      >
                        <div>
                          <p className={s.sectionIntro}>历史内容</p>
                          <pre
                            style={{
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              background: '#f7f8fb',
                              padding: 16,
                            }}
                          >
                            {v.content || '空白正文'}
                          </pre>
                        </div>
                        <div>
                          <p className={s.sectionIntro}>当前 v{file.version}</p>
                          <pre
                            style={{
                              whiteSpace: 'pre-wrap',
                              fontFamily: 'inherit',
                              background: '#fdf1f3',
                              padding: 16,
                            }}
                          >
                            {file.content || '空白正文'}
                          </pre>
                        </div>
                      </div>
                      <button
                        className={s.button}
                        onClick={() =>
                          setEditor({
                            title: '恢复历史内容',
                            description:
                              '将保留当前版本，并将所选历史内容保存成新的版本。',
                            fields: [],
                            submit: '恢复为新版本',
                            save: () => {
                              patch(
                                file.id,
                                (f) => ({
                                  ...f,
                                  content: v.content,
                                  version: f.version + 1,
                                  versions: [
                                    ...f.versions,
                                    {
                                      version: f.version,
                                      content: f.content,
                                      time: timestamp(),
                                      author: '张博士',
                                    },
                                  ],
                                }),
                                '已恢复历史内容，当前版本仍保留在历史中',
                              );
                              setEditor(null);
                            },
                          })
                        }
                      >
                        <RotateCcw size={13} />
                        恢复为新版本
                      </button>
                    </details>
                  ))
              ) : (
                <Empty message="保存正文后，旧版本会在此保留，支持比较和恢复。" />
              )}
            </Panel>
          )}
          {tab === 'refs' && (
            <Panel
              title="引用链接与关联对象"
              padded={false}
              actions={
                <button
                  className={s.primary}
                  onClick={() =>
                    setEditor({
                      title: '关联研究对象',
                      fields: [
                        {
                          key: 'type',
                          label: '对象类型',
                          type: 'select',
                          options: ['课题', '实验', '成果'],
                        },
                        { key: 'id', label: '对象编号', required: true },
                        {
                          key: 'name',
                          label: '对象名称',
                          required: true,
                          wide: true,
                        },
                      ],
                      save: (v) => {
                        patch(
                          file.id,
                          (f) => ({
                            ...f,
                            refs: [
                              ...f.refs,
                              { type: v.type, id: v.id, name: v.name },
                            ],
                          }),
                          '已关联研究对象',
                        );
                        setEditor(null);
                      },
                    })
                  }
                >
                  <Plus size={14} />
                  关联对象
                </button>
              }
            >
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>名称</th>
                    <th>编号</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {file.refs.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <Badge value={r.type} />
                      </td>
                      <td>{r.name}</td>
                      <td>{r.id}</td>
                      <td>
                        {r.type === '课题' &&
                        data.projects.some((p) => p.id === r.id) ? (
                          <Link
                            className={s.link}
                            href={`/collaboration/projects?detail=${r.id}`}
                          >
                            查看课题
                          </Link>
                        ) : r.type === '实验' &&
                          data.experiments.some((e) => e.id === r.id) ? (
                          <Link
                            className={s.link}
                            href={`/collaboration/experiments?detail=${r.id}`}
                          >
                            查看实验
                          </Link>
                        ) : (
                          <span className={s.sub}>已记录来源引用</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!file.refs.length && <Empty />}
            </Panel>
          )}
          {tab === 'sharing' && (
            <Panel
              title="分享授权"
              padded={false}
              actions={
                <button className={s.primary} onClick={share}>
                  <Users size={14} />
                  新增授权
                </button>
              }
            >
              <div className={s.panelBody}>
                <p className={s.sectionIntro}>
                  按课题成员或指定人员设置查看、评论、编辑权限。当前为本地授权演示，不产生公开外链。
                </p>
              </div>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>分享对象</th>
                    <th>权限</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {file.shares.map((a, i) => (
                    <tr key={a.recipient}>
                      <td>{a.recipient}</td>
                      <td>
                        <Badge value={a.permission} />
                      </td>
                      <td>
                        <button
                          className={s.link}
                          onClick={() =>
                            patch(
                              file.id,
                              (f) => ({
                                ...f,
                                shares: f.shares.filter((_, j) => j !== i),
                              }),
                              `已撤回 ${a.recipient} 的分享授权`,
                            )
                          }
                        >
                          撤回授权
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!file.shares.length && (
                <Empty message="仅本人可见，尚未授权分享。" />
              )}
            </Panel>
          )}
        </>
      ) : (
        <>
          <Header
            title="文件与笔记"
            description="统一管理科研文档、目录、标签和笔记，关联课题、任务与成果，沉淀科研过程知识。"
          >
            <button
              className={s.button}
              onClick={() => uploadRef.current?.click()}
            >
              <Upload size={15} />
              上传文件
            </button>
            <button className={s.primary} onClick={create}>
              <Plus size={17} />
              新建文档 / 笔记
            </button>
          </Header>
          <TabBar
            tabs={[
              { key: 'documents', label: '科研文档与笔记管理' },
              { key: 'sharing', label: '版本协作与授权分享' },
            ]}
            value={view}
            onChange={(v) => loc.set({ view: v, page: undefined })}
          />
          <Notice message={notice || storageError} />
          <div className={s.filters}>
            <Filter
              label="所属课题"
              value={loc.get('project')}
              options={projectOptions(data)}
              onChange={(v) => {
                loc.set(
                  { project: v, folder: undefined, page: undefined },
                  true,
                );
              }}
            />
            <Filter
              label="文件类型"
              value={loc.get('type')}
              options={['文档', '笔记', 'PDF', '图片', '数据', '报告']}
              onChange={(v) => filter('type', v)}
            />
            <Filter
              label="标签"
              value={loc.get('tag')}
              options={activeFiles.flatMap((f) => f.tags)}
              onChange={(v) => filter('tag', v)}
            />
            <Filter
              label="更新时间"
              value={loc.get('updated')}
              options={['本周更新', '本月更新']}
              onChange={(v) => filter('updated', v)}
            />
            <SearchBox
              value={loc.get('q')}
              onChange={(v) => filter('q', v)}
              placeholder="搜索文档、内容、作者或标签"
            />
          </div>
          <Stats
            items={[
              {
                label: '文档总数',
                value: activeFiles.filter((f) => f.type !== '笔记').length,
                icon: FileText,
                tone: 'rose',
              },
              {
                label: '笔记总数',
                value: activeFiles.filter((f) => f.type === '笔记').length,
                icon: NotebookPen,
                tone: 'green',
              },
              {
                label: '本周更新',
                value: activeFiles.filter((f) => f.updated >= '2026-09-14')
                  .length,
                icon: Clock,
                tone: 'blue',
              },
              {
                label: '待处理评论',
                value: activeFiles
                  .flatMap((f) => f.comments)
                  .filter((c) => !c.resolved).length,
                icon: MessageSquare,
                tone: 'orange',
              },
            ]}
          />
          <div className={s.directoryLayout}>
            <Panel
              title="课题目录"
              padded={false}
              actions={
                <button
                  aria-label="新建目录"
                  className={s.link}
                  onClick={() =>
                    setEditor({
                      title: '新建课题目录',
                      fields: [
                        {
                          key: 'project',
                          label: '所属课题',
                          type: 'select',
                          options: projectOptions(data),
                          required: true,
                        },
                        { key: 'folder', label: '目录名称', required: true },
                      ],
                      save: (v) => {
                        const p = data.projects.find(
                          (p) => p.name === v.project,
                        );
                        if (!p) return '请选择课题';
                        if (p.folders.includes(v.folder)) return '该目录已存在';
                        setData((d) => ({
                          ...d,
                          projects: d.projects.map((x) =>
                            x.id === p.id
                              ? { ...x, folders: [...x.folders, v.folder] }
                              : x,
                          ),
                        }));
                        setEditor(null);
                        setNotice('目录已创建');
                      },
                    })
                  }
                >
                  <Plus size={15} />
                </button>
              }
            >
              <div className={s.directory}>
                <button
                  className={`${s.directoryButton} ${!loc.get('project') && scope === 'all' ? s.directoryActive : ''}`}
                  onClick={() =>
                    loc.set({
                      project: undefined,
                      folder: undefined,
                      scope: 'all',
                      page: undefined,
                    })
                  }
                >
                  <Folder size={15} />
                  全部文件
                </button>
                {data.projects.map((p) => (
                  <div key={p.id}>
                    <button
                      className={`${s.directoryButton} ${loc.get('project') === p.name ? s.directoryActive : ''}`}
                      onClick={() =>
                        loc.set({
                          project: p.name,
                          folder: undefined,
                          scope: 'all',
                          page: undefined,
                        })
                      }
                    >
                      <Folder size={14} />
                      <span
                        style={{
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={p.name}
                      >
                        {p.name}
                      </span>
                      <small className={s.directoryCount}>
                        {activeFiles.filter((f) => f.projectId === p.id).length}
                      </small>
                    </button>
                    {loc.get('project') === p.name &&
                      p.folders.map((folder) => (
                        <button
                          key={folder}
                          className={`${s.directoryButton} ${loc.get('folder') === folder ? s.directoryActive : ''}`}
                          style={{ paddingLeft: 31 }}
                          onClick={() => loc.set({ folder, page: undefined })}
                        >
                          <Folder size={13} />
                          {folder}
                          <small className={s.directoryCount}>
                            {
                              activeFiles.filter(
                                (f) =>
                                  f.projectId === p.id && f.folder === folder,
                              ).length
                            }
                          </small>
                        </button>
                      ))}
                  </div>
                ))}
                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    marginTop: 16,
                    paddingTop: 12,
                  }}
                >
                  {[
                    { key: 'mine', label: '我创建的', icon: FileText },
                    { key: 'shared', label: '与我共享', icon: Users },
                    { key: 'favorite', label: '收藏夹', icon: Star },
                    { key: 'trash', label: '回收站', icon: Trash2 },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      className={`${s.directoryButton} ${scope === key ? s.directoryActive : ''}`}
                      onClick={() =>
                        loc.set({
                          scope: key,
                          project: undefined,
                          folder: undefined,
                          page: undefined,
                        })
                      }
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel
              title={scope === 'trash' ? '回收站' : '文件与笔记列表'}
              padded={false}
              actions={<span className={s.sub}>{filtered.length} 项</span>}
            >
              <div className={s.tableScroll}>
                <table className={s.table}>
                  <thead>
                    <tr>
                      {[
                        '名称',
                        '标签',
                        '关联课题',
                        '作者',
                        '更新日期',
                        '版本',
                        '操作',
                      ].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.rows.map((f) => (
                      <tr key={f.id}>
                        <td className={s.cellName}>
                          <div className={s.fileName}>
                            <span className={s.fileIcon}>
                              {f.type === '笔记' ? (
                                <NotebookPen size={18} />
                              ) : (
                                <FileText size={18} />
                              )}
                            </span>
                            <div>
                              <button
                                className={s.name}
                                onClick={() => {
                                  setEditing(false);
                                  loc.open(f.id);
                                }}
                              >
                                {f.name}
                              </button>
                              <small className={s.sub}>{f.type}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Tags values={f.tags.slice(0, 2)} />
                        </td>
                        <td style={{ maxWidth: 160 }}>
                          {data.projects.find((p) => p.id === f.projectId)
                            ?.name ?? '关联资料'}
                        </td>
                        <td className={s.nowrap}>{f.author}</td>
                        <td className={s.nowrap}>{f.updated}</td>
                        <td>v{f.version}</td>
                        <td>
                          <div className={s.actions}>
                            {f.deleted ? (
                              <button
                                className={s.link}
                                onClick={() =>
                                  patch(
                                    f.id,
                                    (x) => ({ ...x, deleted: false }),
                                    '文件已恢复到原目录',
                                  )
                                }
                              >
                                恢复
                              </button>
                            ) : (
                              <>
                                <button
                                  className={s.link}
                                  onClick={() => loc.open(f.id)}
                                >
                                  查看
                                </button>
                                <button
                                  aria-label={`将${f.name}移入回收站`}
                                  className={s.link}
                                  onClick={() =>
                                    setEditor({
                                      title: '移入回收站',
                                      description: `“${f.name}”将移入回收站，保留内容、版本与评论，可随时恢复。`,
                                      fields: [],
                                      submit: '移入回收站',
                                      save: () => {
                                        patch(
                                          f.id,
                                          (x) => ({ ...x, deleted: true }),
                                          '文件已移入回收站',
                                        );
                                        setEditor(null);
                                      },
                                    })
                                  }
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!filtered.length && (
                <Empty
                  message={
                    scope === 'trash'
                      ? '回收站为空。'
                      : '当前目录没有匹配文件，可新建或上传。'
                  }
                />
              )}
              <Pagination
                total={filtered.length}
                page={list.page}
                size={8}
                onChange={(p) => loc.set({ page: String(p) })}
              />
            </Panel>
          </div>
          <input
            ref={uploadRef}
            type="file"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const p =
                data.projects.find((p) => p.name === loc.get('project')) ??
                data.projects[0];
              try {
                const record = await uploadRecord(f, p.id, [
                  { type: '课题', id: p.id, name: p.name },
                ]);
                setData((d) => ({ ...d, files: [record, ...d.files] }));
                setNotice(`文件已上传至 ${p.name} / ${record.folder}`);
              } catch (error) {
                setNotice(String(error));
              }
              e.target.value = '';
            }}
          />
        </>
      )}
      {editor && (
        <FormDialog
          key={editor.title}
          title={editor.title}
          description={editor.description}
          fields={editor.fields}
          submit={editor.submit}
          onSubmit={editor.save}
          onClose={() => setEditor(null)}
        />
      )}
    </div>
  );
}
