'use client';

import React, { useState, use } from 'react';
import {
  ArrowLeft, Star, Download, Quote, Bell, BookOpen, MessageSquare,
  Highlighter, GitBranch, User, Sparkles, Send, ExternalLink,
  BookmarkPlus, Copy, CheckCircle2, FlaskConical, TrendingUp
} from 'lucide-react';
import { getPaperById, getCitation, citationFormats, papers, type Paper } from '@/lib/literature-data';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type DetailTab = 'abstract' | 'fulltext' | 'refs' | 'citations' | 'chat' | 'notes' | 'authors' | 'related';

const detailTabs: { key: DetailTab; label: string; icon: React.ElementType }[] = [
  { key: 'abstract', label: '摘要', icon: BookOpen },
  { key: 'fulltext', label: '全文', icon: FileIcon },
  { key: 'refs', label: '参考文献', icon: GitBranch },
  { key: 'citations', label: '被引', icon: TrendingUp },
  { key: 'chat', label: 'AI解读', icon: MessageSquare },
  { key: 'notes', label: '笔记', icon: Highlighter },
  { key: 'authors', label: '作者', icon: User },
  { key: 'related', label: '相关推荐', icon: Sparkles },
];

function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
  );
}

export default function LiteratureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const paperId = parseInt(id, 10);
  const paper = getPaperById(paperId);

  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<DetailTab>(searchParams.get('tab') === 'authors' ? 'authors' : 'abstract');
  const [starred, setStarred] = useState(paper?.starred ?? false);
  const [showCiteModal, setShowCiteModal] = useState(false);
  const [citeFormat, setCiteFormat] = useState('apa');
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    { role: 'ai', content: '你好！我可以帮你深入理解这篇文献。你可以询问研究方法、实验设计、数据解读、公式含义等任何问题。' }
  ]);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteHighlight, setNoteHighlight] = useState('');

  if (!paper) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">文献未找到</h1>
          <p className="text-[var(--color-muted-foreground)] mb-4">ID为 {paperId} 的文献不存在</p>
          <Link href="/literature-search" className="text-[var(--color-blue)] hover:underline flex items-center gap-1 justify-center">
            <ArrowLeft className="w-4 h-4" />返回文献检索
          </Link>
        </div>
      </div>
    );
  }

  const handleDownloadPdf = () => {
    setDownloadToast('正在下载PDF...');
    setTimeout(() => setDownloadToast('下载完成!'), 1500);
  };

  const handleCopyCitation = () => {
    navigator.clipboard.writeText(getCitation(paper, citeFormat));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let aiReply = '';
      if (userMsg.includes('实验') || userMsg.includes('设计')) {
        aiReply = '根据本文研究，实验设计的关键步骤如下：\n\n1. **催化剂制备**：采用等体积浸渍法制备Ni-Mo/Al₂O₃催化剂，P/Mo比控制在0.3-0.7范围\n2. **活性评价**：在固定床反应器中进行DBT加氢脱硫反应，反应温度320-380°C，压力3-5 MPa\n3. **表征方法**：XRD、BET、HRTEM、XPS等手段表征催化剂物化性质\n\n建议参考文中Figure 3的实验流程图进行复现。';
      } else if (userMsg.includes('公式') || userMsg.includes('方程')) {
        aiReply = '本文涉及的关键公式包括：\n\n1. **HDS反应速率方程**：\n   r = k · C_DBT^n\n   其中k为速率常数，C_DBT为DBT浓度，n为反应级数\n\n2. **Arrhenius方程**：\n   k = A · exp(-Ea/RT)\n   Ea为表观活化能，A为指前因子\n\n这些公式基于Langmuir-Hinshelwood机理，假设DBT在催化剂表面发生吸附后进行加氢脱硫。';
      } else if (userMsg.includes('化学') || userMsg.includes('反应式')) {
        aiReply = '本文核心化学方程式：\n\n**DBT加氢脱硫反应路径**：\n\n路径1（直接脱硫DDS）：\n   C₁₂H₈S → C₁₂H₈ + H₂S\n\n路径2（先加氢后脱硫HYD）：\n   C₁₂H₈S → C₁₂H₁₀S → C₁₂H₁₂ → C₁₂H₁₂ + H₂S\n\n磷改性后，HYD路径选择性提高，有利于深度脱硫。';
      } else {
        aiReply = '基于本文内容，这是一个很好的问题。本文的核心贡献在于通过磷改性策略提升了Ni-Mo/Al₂O₃催化剂的HDS活性。关键创新点是P/Mo比优化至0.5时活性最优，这与磷促进MoS₂活性相分散密切相关。如需更详细的分析，可以进一步探讨具体的表征数据或反应机理。';
      }
      setChatMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
    }, 800);
  };

  const quickQuestions = [
    '实验如何设计？', '公式含义是什么？', '化学方程式如何理解？',
    '数据如何解读？', '结论的局限性？', '如何复现实验？'
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/literature-search" className="flex items-center gap-1 text-[13px] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] transition-colors">
            <ArrowLeft className="w-4 h-4" />返回文献检索
          </Link>
          <div className="flex-1" />
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 transition-colors" onClick={handleDownloadPdf}>
            <Download className="w-3.5 h-3.5" />下载PDF
          </button>
          <button className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border transition-colors ${starred ? 'border-[var(--color-amber)]/30 bg-[var(--color-amber)]/5 text-[var(--color-amber)]' : 'border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-amber)]/30 hover:text-[var(--color-amber)]'}`} onClick={() => setStarred(!starred)}>
            <Star className="w-3.5 h-3.5" fill={starred ? 'currentColor' : 'none'} />{starred ? '已收藏' : '收藏'}
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)]/30 hover:text-[var(--color-blue)] transition-colors" onClick={() => setShowCiteModal(true)}>
            <Quote className="w-3.5 h-3.5" />引用
          </button>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)]/30 hover:text-[var(--color-blue)] transition-colors" onClick={() => setShowSubscribeModal(true)}>
            <Bell className="w-3.5 h-3.5" />订阅
          </button>
        </div>
      </div>

      {/* Paper Header */}
      <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-4">
        <h1 className="text-xl font-bold text-[var(--color-text)] leading-relaxed mb-3">{paper.title}</h1>
        <div className="flex items-center gap-2 text-[14px] text-[var(--color-muted-foreground)] mb-3 flex-wrap">
          <span>{paper.authors}</span>
          <span className="text-[var(--color-faint)]">·</span>
          <span className="italic">{paper.journal}</span>
          <span className="text-[var(--color-faint)]">·</span>
          <span>{paper.year}</span>
          <span className="text-[var(--color-faint)]">·</span>
          <span>DOI: <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-blue)] hover:underline">{paper.doi}</a></span>
          <span className="text-[var(--color-faint)]">·</span>
          <span>引用 {paper.cited}</span>
          <span className="text-[var(--color-faint)]">·</span>
          <span>{paper.database}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {paper.tags.map(tag => (
            <span key={tag} className="rounded-full bg-[var(--color-blue)]/5 text-[var(--color-blue)] px-2.5 py-1 text-[12px] font-medium">{tag}</span>
          ))}
          {paper.keywords.map(kw => (
            <span key={kw} className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-[12px] text-[var(--color-muted-foreground)]">{kw}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-[1200px] mx-auto px-6 border-b border-[var(--color-line)]">
        <div className="flex gap-1 overflow-x-auto">
          {detailTabs.map(tab => (
            <button
              key={tab.key}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? 'text-[var(--color-blue)] border-[var(--color-blue)]' : 'text-[var(--color-muted-foreground)] border-transparent hover:text-[var(--color-text)]'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-[1200px] mx-auto px-6 py-6">
        {/* Abstract */}
        {activeTab === 'abstract' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-3">摘要</h3>
              <p className="text-[15px] text-[var(--color-text)] leading-relaxed">{paper.abstract}</p>
            </div>
            {paper.aiSummary && (
              <div className="rounded-xl border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-[var(--color-cyan)]" />
                  <span className="text-[14px] font-bold text-[var(--color-cyan)]">AI 摘要</span>
                </div>
                <p className="text-[15px] text-[var(--color-text)] leading-relaxed">{paper.aiSummary}</p>
              </div>
            )}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-center">
                <div className="text-xl font-black text-[var(--color-blue)]">{paper.relevanceScore}%</div>
                <div className="text-[12px] text-[var(--color-muted-foreground)] mt-1">相关度</div>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-center">
                <div className="text-xl font-black text-[var(--color-text)]">{paper.cited}</div>
                <div className="text-[12px] text-[var(--color-muted-foreground)] mt-1">被引次数</div>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-center">
                <div className="text-xl font-black text-[var(--color-text)]">{paper.keywords.length}</div>
                <div className="text-[12px] text-[var(--color-muted-foreground)] mt-1">关键词</div>
              </div>
              <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-center">
                <div className="text-xl font-black text-[var(--color-text)]">{paper.references?.length ?? 0}</div>
                <div className="text-[12px] text-[var(--color-muted-foreground)] mt-1">参考文献</div>
              </div>
            </div>
          </div>
        )}

        {/* Fulltext */}
        {activeTab === 'fulltext' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[var(--color-text)]">全文阅读</h3>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90" onClick={handleDownloadPdf}>
                <Download className="w-3.5 h-3.5" />下载PDF全文
              </button>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-8">
              <div className="prose max-w-none">
                <h4 className="text-[16px] font-bold text-[var(--color-text)] mb-4">1. 引言</h4>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-4">
                  加氢脱硫（HDS）是石油炼制过程中的关键技术，用于降低燃料油中的硫含量以满足日益严格的环保法规要求。Ni-Mo/Al₂O₃催化剂因其优异的HDS活性而被广泛使用，但传统催化剂在深度脱硫方面仍面临挑战。磷改性作为一种有效的助剂策略，被证实可以显著改善催化剂的活性和稳定性。
                </p>
                <h4 className="text-[16px] font-bold text-[var(--color-text)] mb-4">2. 实验部分</h4>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-4">
                  催化剂制备：采用等体积浸渍法，以γ-Al₂O₃为载体，Ni(NO₃)₂和(NH₄)₆Mo₇O₂₄为活性组分前驱体，(NH₄)₂HPO₄为磷源。磷添加量以P/Mo摩尔比计，范围为0-1.0。浸渍后样品在120°C干燥12h，500°C焙烧4h。预硫化采用CS₂/环己烷溶液，在400°C下处理4h。
                </p>
                <h4 className="text-[16px] font-bold text-[var(--color-text)] mb-4">3. 结果与讨论</h4>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-4">
                  在P/Mo比为0.5时，催化剂表现出最优的HDS活性，DBT转化率达到98.3%，较未改性催化剂提高了23%。HRTEM表征表明，磷的引入促进了MoS₂活性相的分散，增加了活性位点数量。XPS分析显示，磷助剂改变了Ni和Mo的电子状态，有利于加氢路径（HYD）的选择性提升。
                </p>
                <h4 className="text-[16px] font-bold text-[var(--color-text)] mb-4">4. 结论</h4>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed">
                  磷改性Ni-Mo/Al₂O₃催化剂在DBT加氢脱硫反应中表现出优异的活性。最佳P/Mo比为0.5，此时催化剂具有最高的活性相分散度和最优的电子结构。该研究为高效HDS催化剂的设计提供了理论指导和实验依据。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* References */}
        {activeTab === 'refs' && (
          <div>
            <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-4">参考文献 ({paper.references?.length ?? 0})</h3>
            {paper.references && paper.references.length > 0 ? (
              <div className="space-y-2">
                {paper.references.map((ref, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-blue)]/20 transition-colors">
                    <span className="text-[12px] text-[var(--color-faint)] mt-0.5 w-6 text-right shrink-0">[{i + 1}]</span>
                    <div className="flex-1">
                      <p className="text-[13px] text-[var(--color-text)]">{ref}</p>
                    </div>
                    <button className="text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] shrink-0"><ExternalLink className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-[var(--color-faint)] py-8 text-center">暂无参考文献数据</div>
            )}
          </div>
        )}

        {/* Citations */}
        {activeTab === 'citations' && (
          <div>
            <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-4">被引文献 ({paper.citedBy?.length ?? 0})</h3>
            {paper.citedBy && paper.citedBy.length > 0 ? (
              <div className="space-y-2">
                {paper.citedBy.map((cite, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-cyan)]/20 transition-colors">
                    <span className="text-[12px] text-[var(--color-faint)] mt-0.5 w-6 text-right shrink-0">[{i + 1}]</span>
                    <div className="flex-1">
                      <p className="text-[13px] text-[var(--color-text)]">{cite}</p>
                    </div>
                    <button className="text-[var(--color-muted-foreground)] hover:text-[var(--color-cyan)] shrink-0"><ExternalLink className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-[var(--color-faint)] py-8 text-center">暂未被引用</div>
            )}
          </div>
        )}

        {/* AI Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-[14px] leading-relaxed ${msg.role === 'user' ? 'bg-[var(--color-blue)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text)]'}`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Quick Questions */}
            <div className="flex flex-wrap gap-2 mb-3">
              {quickQuestions.map(q => (
                <button key={q} className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[12px] text-[var(--color-muted-foreground)] hover:border-[var(--color-cyan)]/30 hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/5 transition-colors" onClick={() => { setChatInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
            {/* Input */}
            <div className="flex gap-2">
              <input className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--color-line)] text-[14px] focus:outline-none focus:border-[var(--color-blue)] bg-[var(--color-surface)]" placeholder="输入问题，如：实验如何设计？公式含义？化学方程式？" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSendChat(); }} />
              <button className="px-4 py-2.5 rounded-lg bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 transition-colors" onClick={handleSendChat}><Send className="w-4 h-4" /></button>
            </div>
          </div>
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-[var(--color-text)]">笔记标注</h3>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90" onClick={() => setShowNoteEditor(true)}>
                <Highlighter className="w-3.5 h-3.5" />添加笔记
              </button>
            </div>
            {paper.notes && paper.notes.length > 0 ? (
              <div className="space-y-3">
                {paper.notes.map(note => (
                  <div key={note.id} className="rounded-lg border-l-[3px] p-4 bg-[var(--color-surface)]" style={{ borderLeftColor: note.color }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12px] text-[var(--color-faint)]">第{note.page}页</span>
                      <span className="text-[12px] text-[var(--color-faint)]">·</span>
                      <span className="text-[12px] text-[var(--color-faint)]">{note.date}</span>
                    </div>
                    <div className="rounded bg-[var(--color-surface-2)] px-3 py-2 text-[13px] text-[var(--color-muted-foreground)] italic mb-2">&ldquo;{note.highlight}&rdquo;</div>
                    <p className="text-[14px] text-[var(--color-text)]">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-[var(--color-faint)] py-8 text-center">暂无笔记，点击上方按钮添加</div>
            )}
          </div>
        )}

        {/* Authors */}
        {activeTab === 'authors' && (
          <div>
            <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-4">作者信息</h3>
            {paper.authorFull.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {paper.authorFull.map((author, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-blue)]/10 flex items-center justify-center text-[var(--color-blue)] font-bold">{author.name.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="text-[14px] font-bold text-[var(--color-text)]">{author.name}</div>
                        <div className="text-[12px] text-[var(--color-muted-foreground)]">{author.affiliation}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center"><div className="text-[16px] font-black text-[var(--color-blue)]">{author.hIndex}</div><div className="text-[10px] text-[var(--color-faint)]">H-index</div></div>
                      <div className="text-center"><div className="text-[16px] font-black text-[var(--color-text)]">{author.papers}</div><div className="text-[10px] text-[var(--color-faint)]">论文</div></div>
                      <div className="text-center"><div className="text-[16px] font-black text-[var(--color-text)]">{author.cited}</div><div className="text-[10px] text-[var(--color-faint)]">引用</div></div>
                    </div>
                    {author.researchAreas && (
                      <div className="mb-3">
                        <div className="text-[11px] font-bold text-[var(--color-muted-foreground)] mb-1.5">研究方向</div>
                        <div className="flex flex-wrap gap-1">
                          {author.researchAreas.map(area => <span key={area} className="rounded-full bg-[var(--color-blue)]/5 text-[var(--color-blue)] px-2 py-0.5 text-[11px]">{area}</span>)}
                        </div>
                      </div>
                    )}
                    {author.topPapers && (
                      <div className="mb-3">
                        <div className="text-[11px] font-bold text-[var(--color-muted-foreground)] mb-1.5">代表成果</div>
                        {author.topPapers.map((tp, j) => <div key={j} className="text-[12px] text-[var(--color-text)] py-0.5 truncate">· {tp}</div>)}
                      </div>
                    )}
                    {author.pubTrend && (
                      <div>
                        <div className="text-[11px] font-bold text-[var(--color-muted-foreground)] mb-1.5">发文趋势</div>
                        <div className="flex items-end gap-1 h-8">
                          {author.pubTrend.map(pt => (
                            <div key={pt.year} className="flex-1 flex flex-col items-center">
                              <div className="w-full bg-[var(--color-blue)]/20 rounded-sm" style={{ height: `${(pt.count / Math.max(...author.pubTrend!.map(p => p.count))) * 100}%` }} />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          {author.pubTrend.map(pt => <div key={pt.year} className="flex-1 text-center text-[8px] text-[var(--color-faint)]">{String(pt.year).slice(2)}</div>)}
                        </div>
                      </div>
                    )}
                    {author.collaborators && (
                      <div className="mt-3">
                        <div className="text-[11px] font-bold text-[var(--color-muted-foreground)] mb-1.5">合作者</div>
                        <div className="flex flex-wrap gap-1">
                          {author.collaborators.map(c => <span key={c} className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] text-[var(--color-muted-foreground)]">{c}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[13px] text-[var(--color-faint)] py-8 text-center">暂无作者详细信息</div>
            )}
          </div>
        )}

        {/* Related */}
        {activeTab === 'related' && (
          <div>
            <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-4">相关推荐</h3>
            <div className="space-y-3">
              {getPaperById(paperId) && papers.filter(p => p.id !== paperId).slice(0, 5).map(p => (
                <Link key={p.id} href={`/literature-search/${p.id}`} className="block rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 hover:border-[var(--color-blue)]/20 hover:shadow-sm transition-all">
                  <div className="text-[14px] font-bold text-[var(--color-text)] mb-1 hover:text-[var(--color-blue)]">{p.title}</div>
                  <div className="text-[12px] text-[var(--color-muted-foreground)]">{p.authors} · {p.journal} · {p.year}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[11px] text-[var(--color-blue)]">相关度 {p.relevanceScore}%</span>
                    <span className="text-[11px] text-[var(--color-faint)]">引用 {p.cited}</span>
                    {p.recommendReason && <span className="text-[11px] text-[var(--color-amber)]">{p.recommendReason}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Citation Modal */}
      {showCiteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCiteModal(false)}>
          <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)]">引用格式</h3>
              <button onClick={() => setShowCiteModal(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><ArrowLeft className="w-5 h-5 rotate-180" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {citationFormats.map(fmt => (
                <button key={fmt.key} className={`px-2.5 py-1 rounded text-[12px] ${citeFormat === fmt.key ? 'bg-[var(--color-blue)] text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-blue)]/10'}`} onClick={() => setCiteFormat(fmt.key)}>{fmt.label}</button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)] max-h-48 overflow-y-auto">
              <pre className="text-[13px] text-[var(--color-text)] font-mono whitespace-pre-wrap">{getCitation(paper, citeFormat)}</pre>
            </div>
            <div className="flex gap-2 justify-end mt-3">
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)]" onClick={() => setShowCiteModal(false)}>取消</button>
              <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white flex items-center gap-1" onClick={handleCopyCitation}>
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowSubscribeModal(false)}>
          <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)]">订阅提醒</h3>
              <button onClick={() => setShowSubscribeModal(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><ArrowLeft className="w-5 h-5 rotate-180" /></button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" defaultChecked />有新文献引用本文时通知我</label>
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" />作者有新论文时通知我</label>
              <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" />相关领域有新进展时通知我</label>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)]" onClick={() => setShowSubscribeModal(false)}>取消</button>
              <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white" onClick={() => setShowSubscribeModal(false)}>确认订阅</button>
            </div>
          </div>
        </div>
      )}

      {/* Note Editor Modal */}
      {showNoteEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNoteEditor(false)}>
          <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-[440px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)]">添加笔记标注</h3>
              <button onClick={() => setShowNoteEditor(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><ArrowLeft className="w-5 h-5 rotate-180" /></button>
            </div>
            <div className="space-y-3">
              <div><div className="text-[13px] font-medium text-[var(--color-text)] mb-1">高亮文本</div><input className="w-full px-3 py-2 text-[13px] rounded-md border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-blue)]" placeholder="输入或粘贴要标注的原文..." value={noteHighlight} onChange={e => setNoteHighlight(e.target.value)} /></div>
              <div><div className="text-[13px] font-medium text-[var(--color-text)] mb-1">笔记内容</div><textarea className="w-full px-3 py-2 text-[13px] rounded-md border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-blue)] min-h-[80px]" placeholder="写下你的理解和思考..." value={noteContent} onChange={e => setNoteContent(e.target.value)} /></div>
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-medium text-[var(--color-text)]">标注颜色</div>
                {['#f59e0b', '#17a56a', '#7c5ce0', '#13b7c7', '#cf3f3f'].map(c => <button key={c} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />)}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)]" onClick={() => setShowNoteEditor(false)}>取消</button>
              <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white" onClick={() => { setShowNoteEditor(false); setNoteContent(''); setNoteHighlight(''); }}>保存笔记</button>
            </div>
          </div>
        </div>
      )}

      {/* Download Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-text)] text-white px-5 py-2.5 rounded-lg shadow-lg text-[13px] flex items-center gap-2 z-50">
          <Download className="w-4 h-4" />{downloadToast}
        </div>
      )}
    </div>
  );
}
