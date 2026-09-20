'use client';
import { useState } from 'react';
import Link from 'next/link';
import { papers, getCitation } from '@/lib/literature-data';
import {
  WorkspaceHeader,
  Panel,
  Field,
  Tabs,
  Notice,
  Empty,
  useLocalState,
  useResearchProject,
  downloadText,
} from './workspace-kit';
export function LiteratureLibrary() {
  const { href } = useResearchProject();
  const [tab, setTab] = useState('专题与检索策略');
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState('catalyst AND stability');
  const [saved, setSaved] = useLocalState<
    { name: string; query: string; subscribed: boolean }[]
  >('ai4s-saved-searches-v2', []);
  const [name, setName] = useState('');
  const [selected, setSelected] = useLocalState<number[]>(
    'ai4s-literature-collection-v2',
    [],
  );
  const [terms, setTerms] = useLocalState<{ en: string; zh: string }[]>(
    'ai4s-glossary-v2',
    [{ en: 'catalyst deactivation', zh: '催化剂失活' }],
  );
  const [term, setTerm] = useState({ en: '', zh: '' });
  const [notice, setNotice] = useState('');
  const [corrections, setCorrections] = useLocalState<Record<string, string>>(
    'ai4s-review-matrix',
    {},
  );
  const rows = papers.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()),
  );
  const chosen = papers.filter((p) => selected.includes(p.id));
  return (
    <div className="space-y-5">
      <WorkspaceHeader
        title="专题文献与知识整理"
        description="保存检索策略，按专题收藏文献；通过对比矩阵、作者和术语整理形成可复用证据。"
      />
      <Tabs
        tabs={['专题与检索策略', '文献收藏', '对比与综述', '术语与翻译']}
        value={tab}
        onChange={setTab}
      />
      {notice && <Notice>{notice}</Notice>}
      {tab === '专题与检索策略' && (
        <Panel title="检索策略与跟踪">
          <form
            className="grid grid-cols-[1fr_2fr_auto] items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSaved((all) => [
                ...all,
                { name, query: strategy, subscribed: false },
              ]);
              setName('');
            }}
          >
            <Field label="专题名称">
              <input
                className="research-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="检索式">
              <input
                className="research-input"
                required
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              />
            </Field>
            <button className="research-primary">保存策略</button>
          </form>
          <div className="mt-5 divide-y divide-line">
            {saved.map((s, i) => (
              <div
                className="flex items-center justify-between gap-4 py-4"
                key={i}
              >
                <div>
                  <p className="font-medium">{s.name}</p>
                  <code className="text-xs text-muted-foreground">
                    {s.query}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Link
                    className="research-button"
                    href={href(
                      `/literature-search?q=${encodeURIComponent(s.query)}`,
                    )}
                  >
                    执行检索
                  </Link>
                  <button
                    className="research-button"
                    onClick={() => {
                      setSaved((all) =>
                        all.map((v, j) =>
                          j === i ? { ...v, subscribed: !v.subscribed } : v,
                        ),
                      );
                      setNotice(
                        '专题跟踪偏好已保存。来源订阅服务接入后才会获取真实增量更新。',
                      );
                    }}
                  >
                    {s.subscribed ? '取消订阅' : '订阅更新'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Notice>
            专题结果按文献编号去重；订阅与增量获取目前记录为本地偏好。
          </Notice>
        </Panel>
      )}
      {tab === '文献收藏' && (
        <Panel
          title="选择专题文献"
          action={
            <button
              className="research-button"
              disabled={!selected.length}
              onClick={() =>
                downloadText(
                  '专题文献引用.txt',
                  chosen.map((p) => getCitation(p, 'apa')).join('\n\n'),
                )
              }
            >
              批量导出引用
            </button>
          }
        >
          <input
            aria-label="筛选专题文献"
            className="research-input mb-4 max-w-md"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="文献标题关键词"
          />
          <div className="divide-y divide-line">
            {rows.slice(0, 20).map((p) => (
              <label className="flex gap-3 py-4" key={p.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(p.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...new Set([...selected, p.id])]
                        : selected.filter((id) => id !== p.id),
                    )
                  }
                />
                <div>
                  <Link
                    className="text-sm font-medium text-blue"
                    href={href(`/literature-search/${p.id}`)}
                  >
                    {p.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.authors} · {p.year}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </Panel>
      )}
      {tab === '对比与综述' && (
        <Panel
          title="多文献证据对比"
          action={
            <Link
              className="research-button"
              href={href(
                '/research-writing',
                chosen.map((p) => p.id).join(','),
              )}
            >
              转入综述撰写
            </Link>
          }
        >
          {chosen.length ? (
            <table className="research-table">
              <thead>
                <tr>
                  <th>文献与来源</th>
                  <th>研究方法 / 结论 / 局限</th>
                  <th>作者画像</th>
                </tr>
              </thead>
              <tbody>
                {chosen.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        className="text-blue"
                        href={href(`/literature-search/${p.id}`)}
                      >
                        {p.title}
                      </Link>
                      <small className="block">
                        {p.year} · 引用 [{p.id}]
                      </small>
                    </td>
                    <td>
                      <textarea
                        className="research-input min-h-24"
                        aria-label={`${p.id}证据分析`}
                        value={corrections[p.id] ?? ''}
                        onChange={(e) =>
                          setCorrections({
                            ...corrections,
                            [p.id]: e.target.value,
                          })
                        }
                        placeholder="记录方法、结果、适用条件与来源页码"
                      />
                    </td>
                    <td>
                      {p.authors}
                      <Link
                        className="mt-2 block text-xs text-primary"
                        href={href(`/literature-search/${p.id}?tab=authors`)}
                      >
                        查看代表成果与关联文献
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty message="先在文献收藏中选择两篇或多篇资料，再填写对比证据。" />
          )}
        </Panel>
      )}
      {tab === '术语与翻译' && (
        <Panel title="课题术语记忆">
          <form
            className="flex items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              setTerms((all) => [...all, term]);
              setTerm({ en: '', zh: '' });
            }}
          >
            <Field label="英文术语">
              <input
                className="research-input"
                required
                value={term.en}
                onChange={(e) => setTerm({ ...term, en: e.target.value })}
              />
            </Field>
            <Field label="中文译法">
              <input
                className="research-input"
                required
                value={term.zh}
                onChange={(e) => setTerm({ ...term, zh: e.target.value })}
              />
            </Field>
            <button className="research-primary">加入术语表</button>
          </form>
          <table className="research-table mt-5">
            <thead>
              <tr>
                <th>原文术语</th>
                <th>课题统一译法（可纠正）</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t, i) => (
                <tr key={i}>
                  <td>{t.en}</td>
                  <td>
                    <input
                      aria-label={`纠正${t.en}译法`}
                      className="research-input"
                      value={t.zh}
                      onChange={(e) =>
                        setTerms((all) =>
                          all.map((x, j) =>
                            j === i ? { ...x, zh: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted-foreground">
            全文翻译从文献精读的 AI
            解读进入；此处维护人工确认的专业术语，避免不同报告译法不一致。
          </p>
        </Panel>
      )}
    </div>
  );
}
