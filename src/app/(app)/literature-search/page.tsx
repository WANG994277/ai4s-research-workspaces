'use client';

import React, { useState, useMemo, useEffect, Fragment } from 'react';
import {
  Search, Filter, Star, Download, ExternalLink, X, BookOpen, Quote,
  TrendingUp, Clock, Sparkles, ChevronDown, Copy, Send, Database, Tag,
  FileText, BookmarkPlus, CheckCircle2, Layers, GraduationCap, FlaskConical,
  MessageSquare, Bell, Image as ImageIcon, Highlighter, GitBranch, User,
  MoreHorizontal, CheckSquare, Check, Eye, Zap, Braces, ArrowRight, Plus, PanelRightClose, FileStack,
  RefreshCw, Award, ClipboardList, FileCode, BrainCircuit
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { addReviewPaper, isPaperAdded } from '@/lib/review-papers';
import { addSmartReadPaper, isPaperInSmartRead } from '@/lib/smart-read-papers';
import { papers as papersData, type Paper, getCitation, citationFormats } from '@/lib/literature-data';

/* ─── Mock Data (re-exported from shared module) ─── */
const papers = papersData;

const aiSuggestionTags = ['加氢脱硫催化剂', '分子筛改性', 'AI催化设计', '丙烯增产', '水热稳定性', '活性位点调控', '反应机理DFT', '催化剂再生'];


// Pick icon based on recommendation reason content
function getReasonIcon(reason: string): React.ElementType {
  if (reason.includes('收藏') || reason.includes('作者')) return Star;
  if (reason.includes('高被引')) return TrendingUp;
  if (reason.includes('近期')) return Clock;
  return Sparkles;
}

const filterGroups = {
  database: { label: '数据库来源', icon: Database, options: ['Web of Science', 'Scopus', 'PubMed', 'CNKI', '万方'] },
  year: { label: '发表年份', icon: Clock, options: ['2026', '2025', '2024', '2023', '2022', '2021', '2020'] },
  field: { label: '研究领域', icon: FlaskConical, options: ['催化化学', '计算化学', '分子模拟', 'AI催化', '可持续能源', '石油加工'] },
  type: { label: '文献类型', icon: FileText, options: ['期刊论文', '会议论文', '书籍', '学位论文', '预印本', '技术报告', '标准文献'] },
};

const literatureTypeTabs: { key: string; label: string }[] = [
  { key: '全部', label: '全部' },
  { key: '期刊论文', label: '期刊论文' },
  { key: '会议论文', label: '会议论文' },
  { key: '书籍', label: '书籍' },
  { key: '学位论文', label: '学位论文' },
  { key: '预印本', label: '预印本' },
  { key: '技术报告', label: '技术报告' },
  { key: '标准文献', label: '标准文献' },
];

const sortOptions = [{ key: 'relevance', label: '相关度' }, { key: 'cited', label: '引用量' }, { key: 'year', label: '发表时间' }];

/* ─── Advanced Search Syntax Guide ─── */
const searchSyntaxGuide = [
  { syntax: 'title:关键词', desc: '标题搜索', example: 'title:zeolite' },
  { syntax: 'author:姓名', desc: '作者搜索', example: 'author:Zhang' },
  { syntax: 'journal:期刊名', desc: '期刊搜索', example: 'journal:"Nature Catalysis"' },
  { syntax: 'year:年份', desc: '年份筛选', example: 'year:2024' },
  { syntax: 'doi:DOI号', desc: 'DOI精确查找', example: 'doi:10.1038/s41929' },
  { syntax: 'keyword:关键词', desc: '关键词搜索', example: 'keyword:"hydrodesulfurization"' },
  { syntax: 'AND / OR / NOT', desc: '逻辑运算', example: 'zeolite AND catalyst NOT review' },
  { syntax: '"精确短语"', desc: '短语匹配', example: '"acid site distribution"' },
];

/* ─── Literature type badge helper ─── */
function getLiteratureTypeInfo(type: Paper['literatureType']): { icon: React.ElementType; color: string; bg: string } {
  switch (type) {
    case '期刊论文': return { icon: FileText, color: 'text-[#1d5fd6]', bg: 'bg-[#1d5fd6]/10' };
    case '会议论文': return { icon: Layers, color: 'text-[#13b7c7]', bg: 'bg-[#13b7c7]/10' };
    case '书籍': return { icon: BookOpen, color: 'text-[#7c5ce0]', bg: 'bg-[#7c5ce0]/10' };
    case '学位论文': return { icon: GraduationCap, color: 'text-[#f59e0b]', bg: 'bg-[#f59e0b]/10' };
    case '预印本': return { icon: FileCode, color: 'text-[#17a56a]', bg: 'bg-[#17a56a]/10' };
    case '技术报告': return { icon: ClipboardList, color: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10' };
    case '标准文献': return { icon: Award, color: 'text-[#64748b]', bg: 'bg-[#64748b]/10' };
    default: return { icon: FileText, color: 'text-[var(--color-muted-foreground)]', bg: 'bg-[var(--color-surface-2)]' };
  }
}

export default function LiteratureSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeSort, setActiveSort] = useState('relevance');
  const [stars, setStars] = useState<Set<number>>(new Set(papers.filter(p => p.starred).map(p => p.id)));
  const [searchMode, setSearchMode] = useState<'semantic' | 'keyword' | 'ai-qa' | 'multimodal'>('semantic');
  const [activeFilters, setActiveFilters] = useState<Record<string, Set<string>>>(() => ({
    database: new Set(filterGroups.database.options),
    year: new Set(['2026', '2025', '2024']),
    field: new Set(filterGroups.field.options),
    type: new Set(filterGroups.type.options),
  }));
  const [pendingFilters, setPendingFilters] = useState<Record<string, Set<string>>>(activeFilters);
  const [literatureTypeTab, setLiteratureTypeTab] = useState('全部');
  const [showCiteModal, setShowCiteModal] = useState(false);
  const [citeFormat, setCiteFormat] = useState('apa');
  const [copied, setCopied] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(true);
  const [detailTab, setDetailTab] = useState<'abstract' | 'fulltext' | 'refs' | 'citations' | 'chat' | 'notes' | 'authors' | 'related'>('abstract');
  const [selectedPapers, setSelectedPapers] = useState<Set<number>>(new Set());
  const [showSyntaxHelp, setShowSyntaxHelp] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([
    { role: 'ai', content: '你好！我可以帮你深入理解这篇文献。你可以询问研究方法、实验设计、数据解读等任何问题。' }
  ]);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showBibExport, setShowBibExport] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [aiQaInput, setAiQaInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [aiQaMessages, setAiQaMessages] = useState<{ role: string; content: string }[]>([
    { role: 'ai', content: '你好！我是 AI 研究助理，可以帮你用自然语言检索文献。请描述你的研究问题，我会为你匹配最相关的文献。' }
  ]);
  const [addedToReview, setAddedToReview] = useState<Set<number>>(new Set());
  const [addedToSmartRead, setAddedToSmartRead] = useState<Set<number>>(new Set());
  const [dislikedPapers, setDislikedPapers] = useState<Set<number>>(new Set());
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  // Sync addedToReview state with localStorage on mount and when changed
  useEffect(() => {
    const sync = () => {
      const added = new Set<number>();
      papers.forEach(p => { if (isPaperAdded(p.id)) added.add(p.id); });
      setAddedToReview(added);
    };
    sync();
    window.addEventListener('review-papers-changed', sync);
    return () => window.removeEventListener('review-papers-changed', sync);
  }, []);

  // Sync addedToSmartRead state with localStorage on mount and when changed
  useEffect(() => {
    const sync = () => {
      const added = new Set<number>();
      papers.forEach(p => { if (isPaperInSmartRead(p.id)) added.add(p.id); });
      setAddedToSmartRead(added);
    };
    sync();
    window.addEventListener('smart-read-papers-changed', sync);
    return () => window.removeEventListener('smart-read-papers-changed', sync);
  }, []);

  const handleAddToReview = (paper: Paper) => {
    addReviewPaper({
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      journal: paper.journal,
      year: paper.year,
      doi: paper.doi,
      abstract: paper.abstract,
      keywords: paper.keywords,
      tags: paper.tags,
      literatureType: paper.literatureType,
      relevanceScore: paper.relevanceScore,
      cited: paper.cited,
    });
    setAddedToReview(prev => new Set(prev).add(paper.id));
  };

  const handleAddToSmartRead = (paper: Paper) => {
    addSmartReadPaper({
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      journal: paper.journal,
      year: paper.year,
      doi: paper.doi,
      abstract: paper.abstract,
      keywords: paper.keywords,
      tags: paper.tags,
      literatureType: paper.literatureType,
      relevanceScore: paper.relevanceScore,
      cited: paper.cited,
    });
    setAddedToSmartRead(prev => new Set(prev).add(paper.id));
  };

  const handleBatchAddToReview = () => {
    const selectedPaperList = filteredPapers.filter(p => selectedPapers.has(p.id));
    selectedPaperList.forEach(p => {
      addReviewPaper({
        id: p.id, title: p.title, authors: p.authors, journal: p.journal,
        year: p.year, doi: p.doi, abstract: p.abstract, keywords: p.keywords,
        tags: p.tags, literatureType: p.literatureType, relevanceScore: p.relevanceScore, cited: p.cited,
      });
    });
    setAddedToReview(prev => { const n = new Set(prev); selectedPapers.forEach(id => n.add(id)); return n; });
    setDownloadToast(`已将 ${selectedPapers.size} 篇文献加入综述`);
    setTimeout(() => setDownloadToast(null), 2000);
  };

  const handleBatchAddToSmartRead = () => {
    const selectedPaperList = filteredPapers.filter(p => selectedPapers.has(p.id));
    selectedPaperList.forEach(p => {
      addSmartReadPaper({
        id: p.id, title: p.title, authors: p.authors, journal: p.journal,
        year: p.year, doi: p.doi, abstract: p.abstract, keywords: p.keywords,
        tags: p.tags, literatureType: p.literatureType, relevanceScore: p.relevanceScore, cited: p.cited,
      });
    });
    setAddedToSmartRead(prev => { const n = new Set(prev); selectedPapers.forEach(id => n.add(id)); return n; });
    router.push('/smart-read');
  };

  const handleDownloadPdf = (paper: Paper) => {
    // Demo: simulate PDF download with a toast notification
    setDownloadToast(`正在下载: ${paper.title.slice(0, 40)}...`);
    setTimeout(() => setDownloadToast('下载完成!'), 1500);
    // In production: fetch(pdfUrl) -> blob -> download
  };

  const handleBatchDownloadPdf = () => {
    const count = selectedPapers.size;
    if (count === 0) return;
    setDownloadToast(`正在批量下载 ${count} 篇文献PDF...`);
    setTimeout(() => setDownloadToast(`${count} 篇文献PDF下载完成!`), 2000);
  };

  const toggleStar = (id: number) => { setStars(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) };
  const togglePaperSelect = (id: number) => { setSelectedPapers(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) };
  const toggleFilter = (group: string, option: string) => { setPendingFilters(prev => { const n = { ...prev }; const s = new Set(n[group]); s.has(option) ? s.delete(option) : s.add(option); n[group] = s; return n }); };
  const applyFilters = () => { setActiveFilters(pendingFilters); setShowFilters(false); setHasSearched(true); };
  const cancelFilters = () => { setPendingFilters(activeFilters); setShowFilters(false); };
  const clearFilters = () => { setPendingFilters({ database: new Set(), year: new Set(), field: new Set(), type: new Set() }); };
  const resetFilters = () => { setPendingFilters({ database: new Set(filterGroups.database.options), year: new Set(['2026', '2025', '2024']), field: new Set(filterGroups.field.options), type: new Set(filterGroups.type.options) }); };
  const hasActiveFilters = Object.values(activeFilters).some(s => s.size > 0);

  const filteredPapers = (() => {
    let result = [...papers];
    if (query) { const q = query.toLowerCase(); result = result.filter(p => p.title.toLowerCase().includes(q) || p.abstract.toLowerCase().includes(q) || p.tags.some(t => t.includes(q))) }
    if (activeFilters.database.size > 0) result = result.filter(p => activeFilters.database.has(p.database));
    if (activeFilters.year.size > 0) result = result.filter(p => activeFilters.year.has(String(p.year)));
    if (activeFilters.field.size > 0) result = result.filter(p => activeFilters.field.has(p.fieldType));
    if (activeFilters.type.size > 0) result = result.filter(p => activeFilters.type.has(p.literatureType));
    if (literatureTypeTab !== '全部') result = result.filter(p => p.literatureType === literatureTypeTab);
    switch (activeSort) {
      case 'cited': result.sort((a, b) => b.cited - a.cited); break;
      case 'year': result.sort((a, b) => b.year - a.year); break;
      default: result.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    return result;
  })();

  const toggleSelectAll = () => {
    if (selectedPapers.size === filteredPapers.length) { setSelectedPapers(new Set()); }
    else { setSelectedPapers(new Set(filteredPapers.map(p => p.id))); }
  };

  // === Dynamic Recommendation System ===

  // Collect signals from starred (collected) papers
  const starredPapers = useMemo(() => papers.filter(p => stars.has(p.id)), [stars]);
  const collectedTags = useMemo(() => {
    const tags = new Map<string, number>();
    starredPapers.forEach(p => p.tags.forEach(t => tags.set(t, (tags.get(t) || 0) + 1)));
    return tags;
  }, [starredPapers]);
  const collectedFields = useMemo(() => {
    const fields = new Map<string, number>();
    starredPapers.forEach(p => fields.set(p.fieldType, (fields.get(p.fieldType) || 0) + 1));
    return fields;
  }, [starredPapers]);
  const collectedKeywords = useMemo(() => {
    const kws = new Map<string, number>();
    starredPapers.forEach(p => p.keywords.forEach(k => kws.set(k, (kws.get(k) || 0) + 1)));
    return kws;
  }, [starredPapers]);
  const collectedAuthors = useMemo(() => {
    const authors = new Set<string>();
    starredPapers.forEach(p => p.authors.split(',').forEach(a => authors.add(a.trim())));
    return authors;
  }, [starredPapers]);


  // Related recommendations for the detail panel
  const relatedRecommendations = useMemo(() => {
    if (!selectedPaper) return [];
    const selectedTags = new Set(selectedPaper.tags);
    const selectedKeywords = new Set(selectedPaper.keywords);
    const selectedAuthors = new Set(selectedPaper.authors.split(',').map(a => a.trim()));
    const refTitles = new Set((selectedPaper.references || []).map(r => r.toLowerCase()));
    const citedByEntries = new Set((selectedPaper.citedBy || []).map(r => r.toLowerCase()));

    return papers
      .filter(p => p.id !== selectedPaper.id)
      .map(p => {
        const reasons: string[] = [];
        let score = 0;

        // Tag overlap
        const tagOverlap = p.tags.filter(t => selectedTags.has(t));
        if (tagOverlap.length > 0) {
          score += tagOverlap.length * 3;
          reasons.push(`共享「${tagOverlap[0]}」标签`);
        }

        // Keyword overlap
        const kwOverlap = p.keywords.filter(k => selectedKeywords.has(k));
        if (kwOverlap.length > 0) {
          score += kwOverlap.length * 2;
        }

        // Same author
        const paperAuthors = p.authors.split(',').map(a => a.trim());
        const sharedAuthors = paperAuthors.filter(a => selectedAuthors.has(a));
        if (sharedAuthors.length > 0) {
          score += 2;
          reasons.push(`同作者「${sharedAuthors[0]}」`);
        }

        // Citation relationship (match by title substring)
        const pTitleLower = p.title.toLowerCase();
        if (refTitles.has(pTitleLower) || (selectedPaper.references || []).some(r => r.toLowerCase().includes(pTitleLower))) {
          score += 4;
          reasons.push('本文引用了该文献');
        }
        if (citedByEntries.has(pTitleLower) || (selectedPaper.citedBy || []).some(r => r.toLowerCase().includes(pTitleLower))) {
          score += 4;
          reasons.push('该文献引用了本文');
        }

        // Same field
        if (p.fieldType === selectedPaper.fieldType && reasons.length === 0) {
          score += 1;
          reasons.push(`同属「${p.fieldType}」领域`);
        }

        return { ...p, score, reasons: reasons.length > 0 ? reasons : ['相关推荐'] };
      })
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [selectedPaper, papers]);

  const handleSearch = () => {
    if (query.trim() || hasActiveFilters) {
      setHasSearched(true);
      if (query.trim()) {
        setSearchHistory(prev => [...prev, query.trim()].slice(-10));
      }
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setActiveFilters({ database: new Set(filterGroups.database.options), year: new Set(['2026', '2025', '2024']), field: new Set(filterGroups.field.options), type: new Set(filterGroups.type.options) });
    setPendingFilters({ database: new Set(filterGroups.database.options), year: new Set(['2026', '2025', '2024']), field: new Set(filterGroups.field.options), type: new Set(filterGroups.type.options) });
    setHasSearched(false);
    setLiteratureTypeTab('全部');
  };

  const handleCopyCitation = () => { if (!selectedPaper) return; navigator.clipboard.writeText(getCitation(selectedPaper, citeFormat)); setCopied(true); setTimeout(() => setCopied(false), 2000) };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setTimeout(() => {
      let aiReply = '';
      const lower = userMsg.toLowerCase();
      if (lower.includes('实验') || lower.includes('设计') || lower.includes('复现')) {
        aiReply = '根据本文研究，实验设计的关键步骤如下：\n\n1. **催化剂制备**：采用等体积浸渍法制备Ni-Mo/Al₂O₃催化剂，P/Mo比控制在0.3-0.7范围，最佳值为0.5\n2. **活性评价**：在固定床反应器中进行DBT加氢脱硫反应，反应温度320-380°C，压力3-5 MPa，LHSV=2h⁻¹\n3. **表征方法**：\n   - XRD → 物相分析\n   - BET → 比表面积和孔结构\n   - HRTEM → MoS₂活性相形貌\n   - XPS → 表面元素价态\n   - NH₃-TPD → 酸性位点\n4. **预硫化条件**：CS₂/环己烷溶液，400°C × 4h\n\n建议参考文中Figure 3的实验流程图进行复现。';
      } else if (lower.includes('公式') || lower.includes('方程') || lower.includes('含义')) {
        aiReply = '本文涉及的关键公式包括：\n\n1. **HDS反应速率方程**：\n   r = k · C_DBT^n\n   其中k为速率常数，C_DBT为DBT浓度，n为反应级数（本文测定n≈1.5）\n\n2. **Arrhenius方程**：\n   k = A · exp(-Ea/RT)\n   Ea为表观活化能（未改性: 78.3 kJ/mol → 磷改性: 65.2 kJ/mol），A为指前因子\n\n3. **Langmuir吸附等温式**：\n   θ = K·C / (1 + K·C)\n   K为吸附平衡常数，θ为表面覆盖率\n\n这些公式基于Langmuir-Hinshelwood机理，假设DBT在催化剂表面发生吸附后进行加氢脱硫反应。磷改性后Ea降低13.1 kJ/mol，说明P助剂降低了反应能垒。';
      } else if (lower.includes('化学') || lower.includes('反应式') || lower.includes('机理')) {
        aiReply = '本文核心化学方程式和反应机理：\n\n**DBT加氢脱硫两条路径**：\n\n路径1 - 直接脱硫（DDS）：\n  C₁₂H₈S + H₂ → C₁₂H₈ + H₂S\n  (二苯并噻吩 → 联苯 + 硫化氢)\n\n路径2 - 先加氢后脱硫（HYD）：\n  C₁₂H₈S + 2H₂ → C₁₂H₁₀S → C₁₂H₁₂ + H₂S\n  (二苯并噻吩 → 四氢二苯并噻吩 → 环己基苯 + 硫化氢)\n\n**磷改性影响**：\n- P/Mo=0.5时，HYD路径选择性从31.7%提升至51.3%\n- 原因：P助剂改变了MoS₂边缘位的电子密度，促进了加氢活性位（rim site）的形成\n- 同时抑制了直接C-S键断裂位点（edge site）的活性';
      } else if (lower.includes('数据') || lower.includes('理解') || lower.includes('解读') || lower.includes('分析')) {
        aiReply = '本文核心数据的解读：\n\n**DBT转化率 vs P/Mo比**（Table 2）：\n- P/Mo=0 → 75.2%（基线）\n- P/Mo=0.5 → 98.3%（峰值，↑23.1%）\n- P/Mo>0.5 → 活性下降，说明过量P会堵塞孔道\n\n**HYD/DDS选择性变化**：\n- 未改性：DDS占优（68.3%），直接脱硫为主\n- P/Mo=0.5：HYD占优（51.3%），加氢路径增强\n- 这对深度脱硫有利，因为位阻大的含硫化合物更易通过HYD路径脱除\n\n**BET数据**：\n- P/Mo=0.5时比表面积最大（205 m²/g）\n- 孔容从0.45增至0.52 cm³/g\n- 说明适量P改善了载体孔结构\n\n**HRTEM统计**：\n- MoS₂片层长度从5.8nm降至3.9nm → 分散度提高\n- 堆叠层数从2.1增至3.8 → Type II活性位增多';
      } else if (lower.includes('局限') || lower.includes('不足') || lower.includes('问题')) {
        aiReply = '本文研究的局限性：\n\n1. **模型化合物局限**：仅使用DBT作为模型含硫化合物，未考察4,6-DMDBT等更难脱硫的组分\n2. **反应条件范围**：未考察高压（>6MPa）和低LHSV条件下的表现\n3. **稳定性测试**：仅进行了100h寿命测试，缺少长期稳定性数据（>1000h）\n4. **机理研究深度**：DFT计算仅考虑了Mo边缘位，未考虑S边缘位和载体效应\n5. **磷含量精确控制**：等体积浸渍法难以精确控制P的分布均匀性\n6. **工业放大验证**：缺少中试或工业装置验证数据\n\n建议后续研究：引入4,6-DMDBT评价、延长寿命测试、开展DFT深入计算。';
      } else {
        aiReply = '基于本文内容分析：\n\n本文的核心贡献在于通过磷改性策略提升了Ni-Mo/Al₂O₃催化剂的HDS活性。关键创新点是P/Mo比优化至0.5时活性最优（DBT转化率98.3%），这与磷促进MoS₂活性相分散、增加Type II活性位点密切相关。\n\n从催化化学角度理解：\n- 磷的引入调节了载体-活性组分相互作用力\n- 适量P有利于活性相的分散和堆叠\n- 过量P则堵塞孔道、稀释活性组分\n\n如需更详细的分析，可以进一步探讨具体的表征数据、反应机理或实验复现方案。';
      }
      setChatMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
    }, 800);
  };

  const sendAiQaMessage = () => {
    if (!aiQaInput.trim()) return;
    setAiQaMessages(prev => [...prev, { role: 'user', content: aiQaInput }]);
    setTimeout(() => {
      setAiQaMessages(prev => [...prev, { role: 'ai', content: '根据你的研究问题，我为你找到了以下相关文献：\n\n1. Zhang Y et al. (2024) - 磷改性Ni-Mo/Al₂O₃加氢脱硫催化剂\n2. Li M et al. (2024) - 机器学习优化FCC催化剂\n3. Wang T et al. (2024) - 分子筛水热稳定性模拟\n\n这些文献涵盖了催化剂改性、AI辅助设计和稳定性研究三个方向，与你的需求高度相关。' }]);
    }, 800);
    setAiQaInput('');
  };

  return (
    <div className="flex h-[calc(100vh-44px-40px)] gap-0 -m-5">
      {/* Left: Search + Results */}
      <div className={cn('flex flex-1 flex-col min-w-0 bg-[var(--color-surface)]', showDetail && 'border-r border-[var(--color-line)]')}>
        {/* Search area */}
        <div className="shrink-0 border-b border-[var(--color-line)] p-3">
          {/* Search mode toggle - 4 modes */}
          <div className="mb-2 flex items-center gap-1">
            {([
              ['semantic', '语义搜索', Sparkles],
              ['keyword', '关键词', Search],
              ['ai-qa', 'AI问答', MessageSquare],
              ['multimodal', '多模态', ImageIcon],
            ] as const).map(([mode, label, Icon]) => (
              <button
                key={mode}
                onClick={() => setSearchMode(mode)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold transition-colors',
                  searchMode === mode ? 'bg-[var(--color-blue)]/10 text-[var(--color-blue)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)]'
                )}
              >
                <Icon className="h-3 w-3" />{label}
              </button>
            ))}
          </div>

          {/* Search input */}
          {searchMode !== 'ai-qa' ? (
            <>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] px-3 py-2">
                {searchMode === 'multimodal' ? <ImageIcon className="h-4 w-4 shrink-0 text-[var(--color-purple)]" /> : <Search className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />}
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                  placeholder={
                    searchMode === 'semantic' ? '用自然语言描述研究问题...' :
                    searchMode === 'multimodal' ? '上传分子结构或图片搜索...' :
                    '输入关键词、DOI...'
                  }
                  className="flex-1 bg-transparent text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-faint)] focus:outline-none"
                />
                {hasSearched && query && (
                  <button onClick={handleClearSearch} className="flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-bold text-[var(--color-red)] hover:bg-[var(--color-red)]/10 transition-colors">
                    <X className="h-3 w-3" />清除
                  </button>
                )}
                {searchMode === 'keyword' && (
                  <button onClick={() => setShowSyntaxHelp(!showSyntaxHelp)} className={cn('flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-bold', showSyntaxHelp ? 'bg-[var(--color-blue)]/10 text-[var(--color-blue)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)]')}>
                    <Braces className="h-3 w-3" />语法
                  </button>
                )}
                <button
                  onClick={() => { if (!showFilters) setPendingFilters(activeFilters); setShowFilters(!showFilters); }}
                  className={cn('flex h-6 items-center gap-1 rounded-md px-2 text-[12px] font-bold transition-colors', showFilters || hasActiveFilters ? 'bg-[var(--color-blue)]/10 text-[var(--color-blue)]' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)]')}
                >
                  <Filter className="h-3 w-3" />筛选{hasActiveFilters ? `(${Object.values(activeFilters).reduce((a, s) => a + s.size, 0)})` : ''}
                </button>
                <button
                  onClick={handleSearch}
                  className="flex h-6 items-center gap-1 rounded-md bg-[var(--color-blue)] px-3 text-[12px] font-bold text-white transition-colors hover:bg-[var(--color-blue)]/90"
                >
                  <Search className="h-3 w-3" />检索
                </button>
              </div>

              {/* Multimodal upload area */}
              {searchMode === 'multimodal' && (
                <div className="mt-2 rounded-lg border-2 border-dashed border-[var(--color-purple)]/30 bg-[var(--color-purple)]/5 p-4 text-center">
                  <ImageIcon className="w-8 h-8 mx-auto text-[var(--color-purple)] mb-2" />
                  <div className="text-[13px] text-[var(--color-muted-foreground)]">拖拽或点击上传分子结构图 / 化学式截图 / 谱图</div>
                  <div className="text-[12px] text-[var(--color-faint)] mt-1">支持 SMILES / InChI / MOL / 图片格式</div>
                  <button className="mt-2 px-3 py-1.5 rounded-md text-[13px] bg-[var(--color-purple)] text-white">选择文件</button>
                </div>
              )}

              {/* Advanced Search Syntax Help */}
              {showSyntaxHelp && searchMode === 'keyword' && (
                <div className="mt-2 rounded-lg border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-[var(--color-blue)] flex items-center gap-1"><Braces className="h-3 w-3" />高级搜索语法</span>
                    <button onClick={() => setShowSyntaxHelp(false)} className="text-[var(--color-faint)]"><X className="h-3 w-3" /></button>
                  </div>
                  <div className="space-y-1.5">
                    {searchSyntaxGuide.map(item => (
                      <div key={item.syntax} className="flex items-start gap-2">
                        <code className="text-[12px] px-1.5 py-0.5 rounded bg-[var(--color-surface)] text-[var(--color-blue)] font-mono whitespace-nowrap">{item.syntax}</code>
                        <div className="flex-1">
                          <span className="text-[12px] text-[var(--color-text)]">{item.desc}</span>
                          <span className="text-[11px] text-[var(--color-faint)] ml-1">例: {item.example}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI search suggestions */}
              {showAiSuggestions && !query && searchMode === 'semantic' && (
                <div className="mt-2 rounded-lg border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[12px] font-bold text-[var(--color-cyan)]"><Sparkles className="h-3 w-3" />AI 检索建议</span>
                    <button onClick={() => setShowAiSuggestions(false)} className="text-[var(--color-faint)]"><X className="h-3 w-3" /></button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {aiSuggestionTags.map(tag => (
                      <button key={tag} onClick={() => setQuery(tag)} className="rounded-full border border-[var(--color-cyan)]/20 bg-white px-2 py-0.5 text-[12px] text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 transition-colors">{tag}</button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* AI QA Mode */
            <div className="rounded-lg border border-[var(--color-cyan)]/20 bg-[var(--color-surface-2)] p-3">
              <div className="max-h-48 overflow-y-auto space-y-2 mb-2">
                {aiQaMessages.map((msg, i) => (
                  <div key={i} className={cn('text-[13px] leading-relaxed whitespace-pre-line', msg.role === 'ai' ? 'text-[var(--color-text)]' : 'text-[var(--color-blue)]')}>
                    <span className="font-bold">{msg.role === 'ai' ? 'AI: ' : '我: '}</span>{msg.content}
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-[13px] rounded-md border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-cyan)]"
                  placeholder="描述你的研究问题，AI帮你检索..."
                  value={aiQaInput}
                  onChange={e => setAiQaInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendAiQaMessage()}
                />
                <button className="px-3 py-2 rounded-md text-[13px] bg-[var(--color-cyan)] text-white" onClick={sendAiQaMessage}><Send className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          )}

          {/* Multi-dimensional filter panel */}
          {showFilters && searchMode !== 'ai-qa' && (
            <div className="mt-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-3">
              {Object.entries(filterGroups).map(([key, group]) => (
                <div key={key}>
                  <div className="mb-1.5 flex items-center gap-1">
                    <group.icon className="h-3 w-3 text-[var(--color-muted-foreground)]" />
                    <span className="text-[12px] font-bold text-[var(--color-muted-foreground)]">{group.label}</span>
                    {pendingFilters[key].size > 0 && <span className="rounded-full bg-[var(--color-blue)]/10 px-1.5 text-[11px] font-bold text-[var(--color-blue)]">{pendingFilters[key].size}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {group.options.map(opt => (
                      <button key={opt} onClick={() => toggleFilter(key, opt)} className={cn('rounded-md px-2 py-0.5 text-[12px] font-medium transition-colors', pendingFilters[key].has(opt) ? 'bg-[var(--color-blue)] text-white' : 'bg-white text-[var(--color-muted-foreground)] hover:bg-[var(--color-blue)]/10 hover:text-[var(--color-blue)]')}>{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-line)] pt-2">
                <div className="flex items-center gap-2">
                  <button onClick={resetFilters} className="text-[12px] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] hover:underline transition-colors">恢复默认</button>
                  <button onClick={clearFilters} className="text-[12px] text-[var(--color-red)] hover:underline">清除全部</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={cancelFilters} className="px-3 py-1 rounded-md text-[12px] font-bold text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] transition-colors">取消</button>
                  <button onClick={applyFilters} className="px-3 py-1 rounded-md text-[12px] font-bold bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 transition-colors">确定</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Literature Type Tab Bar */}
        <div className="flex items-center gap-0.5 border-b border-[var(--color-line)] px-3 py-1.5 overflow-x-auto shrink-0">
          {literatureTypeTabs.map(tab => {
            const typeInfo = tab.key === '全部' ? null : getLiteratureTypeInfo(tab.key as Paper['literatureType']);
            const TypeIcon = typeInfo?.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setLiteratureTypeTab(tab.key)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-bold transition-colors whitespace-nowrap',
                  literatureTypeTab === tab.key
                    ? 'bg-[var(--color-blue)] text-white'
                    : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                )}
              >
                {TypeIcon && <TypeIcon className="w-3 h-3" />}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Results / Recommendation View */}
        {hasSearched ? (
          <>
            {/* Sort + Batch Actions */}
            <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-3 py-2">
              <button onClick={toggleSelectAll}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 transition-colors">
                {selectedPapers.size === filteredPapers.length && filteredPapers.length > 0
                  ? <><Check className="w-3.5 h-3.5" /> 取消全选</>
                  : <><CheckSquare className="w-3.5 h-3.5" /> 全选</>
                }
              </button>
              <div className="flex gap-1">
                {sortOptions.map(opt => (
                  <button key={opt.key} onClick={() => setActiveSort(opt.key)} className={cn('rounded-md px-2 py-0.5 text-[12px] font-bold transition-colors', activeSort === opt.key ? 'bg-[var(--color-blue)] text-white' : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)]')}>{opt.label}</button>
                ))}
              </div>
              <div className="flex-1" />
              {selectedPapers.size > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-[var(--color-blue)]">已选 {selectedPapers.size} 篇</span>
                  <button className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90" onClick={handleBatchDownloadPdf}><Download className="w-3 h-3 inline mr-0.5" />下载PDF</button>
                  <button className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)]" onClick={() => setShowBibExport(true)}><FileText className="w-3 h-3 inline mr-0.5" />.bib</button>
                  <button className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:text-[var(--color-amber)]"><BookmarkPlus className="w-3 h-3 inline mr-0.5" />收藏</button>
                  <button className="px-1.5 py-0.5 rounded text-[11px] bg-[#17a56a]/10 text-[#17a56a] hover:bg-[#17a56a]/20" onClick={handleBatchAddToReview}><FileStack className="w-3 h-3 inline mr-0.5" />加入综述</button>
                  <button className="px-1.5 py-0.5 rounded text-[11px] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/20" onClick={handleBatchAddToSmartRead}><BrainCircuit className="w-3 h-3 inline mr-0.5" />智能研读</button>
                </div>
              )}
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-3 py-1.5 text-[12px] text-[var(--color-faint)]">找到 {filteredPapers.length} 篇文献</div>
              {filteredPapers.map(paper => (
                <div
                  key={paper.id}
                  className={cn('cursor-pointer border-b border-[var(--color-line)] px-3 py-2.5 transition-colors', selectedPaper?.id === paper.id ? 'bg-[var(--color-blue)]/5 border-l-2 border-l-[var(--color-blue)]' : 'hover:bg-[var(--color-surface-2)]/50 border-l-2 border-l-transparent')}
                  onClick={() => { setSelectedPaper(paper); if (!showDetail) setShowDetail(true); }}
                >
                  <div className="flex items-start gap-2">
                    <button className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${selectedPapers.has(paper.id) ? 'bg-[var(--color-blue)] border-[var(--color-blue)]' : 'border-[var(--color-line)] hover:border-[var(--color-blue)]'}`} onClick={e => { e.stopPropagation(); togglePaperSelect(paper.id) }}>
                      {selectedPapers.has(paper.id) && <CheckSquare className="w-3 h-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5">
                        <button className={`mt-0.5 shrink-0 ${stars.has(paper.id) ? 'text-[var(--color-amber)]' : 'text-[var(--color-faint)] hover:text-[var(--color-amber)]'}`} onClick={e => { e.stopPropagation(); toggleStar(paper.id) }}>
                          <Star className="h-3.5 w-3.5" fill={stars.has(paper.id) ? 'currentColor' : 'none'} />
                        </button>
                        <a href={`/literature-search/${paper.id}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-[var(--color-text)] line-clamp-2 hover:text-[var(--color-blue)] hover:underline" onClick={e => e.stopPropagation()}>{paper.title}</a>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-muted-foreground)]">
                        <span>{paper.authors}</span>
                        <span className="text-[var(--color-faint)]">·</span>
                        <span className="italic">{paper.journal}</span>
                        <span className="text-[var(--color-faint)]">·</span>
                        <span>{paper.year}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {(() => { const ti = getLiteratureTypeInfo(paper.literatureType); const TI = ti.icon; return <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${ti.bg} ${ti.color}`}><TI className="w-3 h-3" />{paper.literatureType}</span>; })()}
                        <span className="text-[12px] text-[var(--color-blue)] font-bold">相关度 {paper.relevanceScore}%</span>
                        <span className="text-[12px] text-[var(--color-faint)]">引用 {paper.cited}</span>
                        {paper.notes && paper.notes.length > 0 && <span className="text-[11px] text-[var(--color-purple)] flex items-center gap-0.5"><Highlighter className="w-2.5 h-2.5" />{paper.notes.length}</span>}
                        <span className="text-[11px] text-[var(--color-faint)]">{paper.database}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {paper.tags.map(tag => <span key={tag} className="rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--color-muted-foreground)]">{tag}</span>)}
                      </div>
                      {/* Action buttons */}
                      <div className="mt-2 flex items-center gap-1.5">
                        <button className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border border-[var(--color-line)] bg-white text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 hover:border-[var(--color-blue)]/30 transition-colors" onClick={e => { e.stopPropagation(); handleDownloadPdf(paper) }}>
                          <Download className="w-3 h-3" />下载PDF
                        </button>
                        <button className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border border-[var(--color-line)] bg-white text-[var(--color-muted-foreground)] hover:text-[var(--color-amber)] hover:bg-[var(--color-amber)]/10 hover:border-[var(--color-amber)]/30 transition-colors" onClick={e => { e.stopPropagation(); toggleStar(paper.id) }}>
                          <Star className="w-3 h-3" fill={stars.has(paper.id) ? 'currentColor' : 'none'} />{stars.has(paper.id) ? '已收藏' : '收藏'}
                        </button>
                        <button className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border border-[var(--color-line)] bg-white text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] hover:bg-[var(--color-blue)]/10 hover:border-[var(--color-blue)]/30 transition-colors" onClick={e => { e.stopPropagation(); setSelectedPaper(paper); setShowCiteModal(true) }}>
                          <Quote className="w-3 h-3" />引用
                        </button>
                        <button className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/15 transition-colors" onClick={e => { e.stopPropagation(); setSelectedPaper(paper); setDetailTab('chat') }}>
                          <MessageSquare className="w-3 h-3" />AI解读
                        </button>
                        <button className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border border-[var(--color-line)] bg-white text-[var(--color-muted-foreground)] hover:text-[var(--color-purple)] hover:bg-[var(--color-purple)]/10 hover:border-[var(--color-purple)]/30 transition-colors" onClick={e => { e.stopPropagation(); setSelectedPaper(paper); setDetailTab('notes') }}>
                          <Highlighter className="w-3 h-3" />笔记
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleAddToReview(paper) }}
                          className={cn('inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border transition-colors', addedToReview.has(paper.id) ? 'border-[#17a56a]/30 bg-[#17a56a]/5 text-[#17a56a]' : 'border-[var(--color-line)] bg-white text-[var(--color-muted-foreground)] hover:text-[#17a56a] hover:bg-[#17a56a]/10 hover:border-[#17a56a]/30')}
                        >
                          <FileStack className="w-3 h-3" />{addedToReview.has(paper.id) ? '已加入' : '加入综述'}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleAddToSmartRead(paper) }}
                          className={cn('inline-flex items-center gap-0.5 px-2 py-1 rounded text-[12px] border transition-colors', addedToSmartRead.has(paper.id) ? 'border-[var(--color-cyan)]/30 bg-[var(--color-cyan)]/5 text-[var(--color-cyan)]' : 'border-[var(--color-line)] bg-white text-[var(--color-muted-foreground)] hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/10 hover:border-[var(--color-cyan)]/30')}
                        >
                          <BrainCircuit className="w-3 h-3" />{addedToSmartRead.has(paper.id) ? '已研读' : '研读'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </>
        ) : (
          /* Default Recommended Literature View */
          <div className="flex-1 overflow-y-auto">
            {/* Recommendation header */}
            <div className="px-3 py-2.5 border-b border-[var(--color-line)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--color-blue)]" />
                <span className="text-[14px] font-bold text-[var(--color-text)]">推荐文献</span>
                <span className="text-[12px] text-[var(--color-faint)]">基于您的研究领域智能推荐</span>
              </div>
            </div>
            {/* Grouped by recommend reason */}
            {(() => {
              let recommended = [...papers].sort((a, b) => b.relevanceScore - a.relevanceScore);
              if (literatureTypeTab !== '全部') recommended = recommended.filter(p => p.literatureType === literatureTypeTab);
              if (recommended.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Search className="h-10 w-10 text-[var(--color-faint)]" />
                    <p className="mt-2 text-[13px] text-[var(--color-muted-foreground)]">该类型暂无推荐文献</p>
                  </div>
                );
              }
              const groups: Record<string, Paper[]> = {};
              recommended.forEach(p => {
                const reason = p.recommendReason || '热门领域';
                if (!groups[reason]) groups[reason] = [];
                groups[reason].push(p);
              });
              const groupLabels: Record<string, { label: string; icon: React.ElementType }> = {
                '高被引': { label: '高被引推荐', icon: TrendingUp },
                '近期发表': { label: '近期发表', icon: Clock },
                '与你收藏相关': { label: '与您收藏相关', icon: Star },
                '热门领域': { label: '热门领域', icon: Sparkles },
              };
              return Object.entries(groups).map(([reason, groupPapers]) => {
                const meta = groupLabels[reason] || groupLabels['热门领域'];
                const Icon = meta.icon;
                return (
                  <div key={reason}>
                    <div className="px-3 py-2 flex items-center gap-1.5 bg-[var(--color-surface)]/60 border-b border-[var(--color-line)]">
                      <Icon className="w-3.5 h-3.5 text-[var(--color-blue)]" />
                      <span className="text-[12px] font-bold text-[var(--color-muted-foreground)]">{meta.label}</span>
                      <span className="text-[11px] text-[var(--color-faint)]">{groupPapers.length} 篇</span>
                    </div>
                    {groupPapers.map(paper => {
                      const typeInfo = getLiteratureTypeInfo(paper.literatureType);
                      const TypeIcon = typeInfo.icon;
                      return (
                        <div
                          key={paper.id}
                          className={cn('cursor-pointer border-b border-[var(--color-line)] px-3 py-2.5 transition-colors', selectedPaper?.id === paper.id ? 'bg-[var(--color-blue)]/5 border-l-2 border-l-[var(--color-blue)]' : 'hover:bg-[var(--color-surface-2)]/50 border-l-2 border-l-transparent')}
                          onClick={() => { setSelectedPaper(paper); if (!showDetail) setShowDetail(true); }}
                        >
                          <div className="flex items-start gap-2">
                            <button className={`mt-0.5 shrink-0 ${stars.has(paper.id) ? 'text-[var(--color-amber)]' : 'text-[var(--color-faint)] hover:text-[var(--color-amber)]'}`} onClick={e => { e.stopPropagation(); toggleStar(paper.id) }}>
                              <Star className="h-3.5 w-3.5" fill={stars.has(paper.id) ? 'currentColor' : 'none'} />
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-1.5">
                                <a href={`/literature-search/${paper.id}`} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-[var(--color-text)] line-clamp-2 hover:text-[var(--color-blue)] hover:underline" onClick={e => e.stopPropagation()}>{paper.title}</a>
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--color-muted-foreground)]">
                                <span>{paper.authors}</span>
                                <span className="text-[var(--color-faint)]">·</span>
                                <span className="italic">{paper.journal}</span>
                                <span className="text-[var(--color-faint)]">·</span>
                                <span>{paper.year}</span>
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${typeInfo.bg} ${typeInfo.color}`}>
                                  <TypeIcon className="w-3 h-3" />{paper.literatureType}
                                </span>
                                <span className="text-[12px] text-[var(--color-blue)] font-bold">相关度 {paper.relevanceScore}%</span>
                                <span className="text-[12px] text-[var(--color-faint)]">引用 {paper.cited}</span>
                                {paper.notes && paper.notes.length > 0 && <span className="text-[11px] text-[var(--color-purple)] flex items-center gap-0.5"><Highlighter className="w-2.5 h-2.5" />{paper.notes.length}</span>}
                                <span className="text-[11px] text-[var(--color-faint)]">{paper.database}</span>
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {paper.tags.map(tag => <span key={tag} className="rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--color-muted-foreground)]">{tag}</span>)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Right: Detail Panel */}
      {selectedPaper && showDetail && (
        <div className="flex w-1/2 flex-col min-w-0">
          {/* Detail Tabs */}
          <div className="flex items-center border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-1 gap-0 overflow-x-auto">
            {([
              ['abstract', '摘要', BookOpen],
              ['fulltext', '全文', FileText],
              ['refs', '引用链', GitBranch],
              ['citations', '被引', TrendingUp],
              ['related', '相关推荐', Sparkles],
              ['chat', 'AI解读', MessageSquare],
              ['notes', '笔记', Highlighter],
              ['authors', '作者', User],
            ] as const).map(([key, label, Icon]) => (
              <button key={key} onClick={() => setDetailTab(key)} className={cn('flex items-center gap-1 px-3 py-2 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap', detailTab === key ? 'border-[var(--color-blue)] text-[var(--color-blue)]' : 'border-transparent text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]')}>
                <Icon className="h-3.5 w-3.5" />{label}
                {key === 'notes' && selectedPaper.notes && selectedPaper.notes.length > 0 && <span className="ml-0.5 px-1 rounded-full text-[10px] bg-[var(--color-purple)]/10 text-[var(--color-purple)]">{selectedPaper.notes.length}</span>}
                {key === 'citations' && selectedPaper.citedBy && <span className="ml-0.5 px-1 rounded-full text-[10px] bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]">{selectedPaper.citedBy.length}</span>}
              </button>
            ))}
            <div className="flex-1" />
            {/* Action buttons */}
            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded hover:bg-[var(--color-blue)]/10 text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)]" title="下载PDF" onClick={() => handleDownloadPdf(selectedPaper)}><Download className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]" title="收藏" onClick={() => toggleStar(selectedPaper.id)}><BookmarkPlus className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]" title="引用导出" onClick={() => setShowCiteModal(true)}><Quote className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]" title="订阅提醒" onClick={() => setShowSubscribeModal(true)}><Bell className="h-4 w-4" /></button>
              <button className="p-1.5 rounded hover:bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]" title="关闭详情" onClick={() => setShowDetail(false)}><PanelRightClose className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Detail Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-base font-bold text-[var(--color-navy)] mb-2">{selectedPaper.title}</h2>
            <div className="flex items-center gap-2 text-[13px] text-[var(--color-muted-foreground)] mb-4">
              <span>{selectedPaper.authors}</span>
              <span className="text-[var(--color-faint)]">·</span>
              <span className="italic">{selectedPaper.journal}</span>
              <span className="text-[var(--color-faint)]">·</span>
              <span>{selectedPaper.year}</span>
              <span className="text-[var(--color-faint)]">·</span>
              <span>DOI: <span className="text-[var(--color-blue)]">{selectedPaper.doi}</span></span>
            </div>

            {/* Abstract Tab */}
            {detailTab === 'abstract' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-1.5">摘要</h3>
                  <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{selectedPaper.abstract}</p>
                </div>
                {selectedPaper.aiSummary && (
                  <div className="rounded-lg border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--color-cyan)]" />
                      <span className="text-[13px] font-bold text-[var(--color-cyan)]">AI 摘要</span>
                    </div>
                    <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{selectedPaper.aiSummary}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-[13px] font-bold text-[var(--color-text)] mb-1.5">关键词</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPaper.keywords.map(kw => <span key={kw} className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[12px] text-[var(--color-muted-foreground)]">{kw}</span>)}
                  </div>
                </div>
              </div>
            )}

            {/* Fulltext Tab */}
            {detailTab === 'fulltext' && (
              <div className="space-y-4">
                <div className="rounded-lg border border-[var(--color-line)] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-bold text-[var(--color-text)]">文献全文</span>
                    <button className="px-2 py-1 rounded text-[12px] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)]"><Eye className="w-3 h-3 inline mr-1" />PDF 阅读</button>
                  </div>
                  <div className="prose prose-sm max-w-none text-[14px] text-[var(--color-text)] leading-relaxed">
                    <h4>1. 引言</h4>
                    <p>催化剂是石油化工行业的核心技术支撑。在加氢脱硫（HDS）过程中，Ni-Mo/Al₂O₃催化剂是最广泛使用的工业催化剂体系之一...</p>
                    <h4>2. 实验部分</h4>
                    <p>催化剂制备采用共浸渍法，以γ-Al₂O₃为载体，硝酸镍和钼酸铵为活性组分前驱体，磷酸二氢铵为磷源...</p>
                    <h4>3. 结果与讨论</h4>
                    <p>XRD表征结果显示，不同P/Mo比催化剂均保持γ-Al₂O₃的特征衍射峰，未检测到独立的MoO₃或NiO晶相...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Citation Chain Tab */}
            {detailTab === 'refs' && (
              <div className="space-y-4">
                <div className="text-[13px] font-bold text-[var(--color-text)] flex items-center gap-1.5"><GitBranch className="h-4 w-4 text-[var(--color-blue)]" />引用链追踪</div>
                <div className="rounded-lg border border-[var(--color-line)] p-4">
                  <h4 className="text-[13px] font-bold text-[var(--color-text)] mb-2">本文引用的文献</h4>
                  {selectedPaper.references ? selectedPaper.references.map((ref, i) => (
                    <div key={i} className="flex items-start gap-2 py-2 border-b border-[var(--color-line)] last:border-b-0">
                      <div className="w-6 h-6 rounded-full bg-[var(--color-blue)]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[11px] font-bold text-[var(--color-blue)]">{i + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[var(--color-text)]">{ref}</div>
                        <div className="flex gap-1.5 mt-1">
                          <button className="text-[11px] text-[var(--color-blue)] hover:underline flex items-center gap-0.5"><Search className="w-2.5 h-2.5" />检索</button>
                          <button className="text-[11px] text-[var(--color-blue)] hover:underline flex items-center gap-0.5"><GitBranch className="w-2.5 h-2.5" />展开引用链</button>
                        </div>
                      </div>
                    </div>
                  )) : <div className="text-[13px] text-[var(--color-faint)] py-2">暂无引用数据</div>}
                </div>
                {selectedPaper.citedBy && selectedPaper.citedBy.length > 0 && (
                  <div className="rounded-lg border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 p-4">
                    <h4 className="text-[13px] font-bold text-[var(--color-text)] mb-2 flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-[var(--color-cyan)]" />引用本文的文献</h4>
                    {selectedPaper.citedBy.map((ref, i) => (
                      <div key={i} className="flex items-start gap-2 py-2 border-b border-[var(--color-cyan)]/10 last:border-b-0">
                        <div className="w-6 h-6 rounded-full bg-[var(--color-cyan)]/10 flex items-center justify-center shrink-0 mt-0.5">
                          <ArrowRight className="w-3 h-3 text-[var(--color-cyan)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] text-[var(--color-text)]">{ref}</div>
                          <button className="text-[11px] text-[var(--color-cyan)] hover:underline flex items-center gap-0.5 mt-1"><Search className="w-2.5 h-2.5" />检索</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Citations Tab */}
            {detailTab === 'citations' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-bold text-[var(--color-text)]">被引信息</div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="text-[var(--color-blue)] font-bold">被引 {selectedPaper.cited} 次</span>
                  </div>
                </div>
                {selectedPaper.citedBy && selectedPaper.citedBy.map((ref, i) => (
                  <div key={i} className="p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-blue)] cursor-pointer transition-colors">
                    <div className="text-[13px] text-[var(--color-text)]">{ref}</div>
                    <div className="flex gap-1.5 mt-1.5">
                      <button className="text-[11px] text-[var(--color-blue)] hover:underline"><Search className="w-2.5 h-2.5 inline mr-0.5" />查看</button>
                      <button className="text-[11px] text-[var(--color-blue)] hover:underline"><GitBranch className="w-2.5 h-2.5 inline mr-0.5" />引用链</button>
                    </div>
                  </div>
                ))}
                {!selectedPaper.citedBy && <div className="text-[13px] text-[var(--color-faint)] py-4 text-center">暂无被引数据</div>}
              </div>
            )}

            {/* Chat with Paper Tab */}
            {detailTab === 'chat' && (
              <div className="flex flex-col h-full -m-6 p-6">
                <div className="flex items-center gap-1.5 mb-3">
                  <MessageSquare className="h-4 w-4 text-[var(--color-cyan)]" />
                  <span className="text-[13px] font-bold text-[var(--color-text)]">AI 深度解读</span>
                  <span className="text-[12px] text-[var(--color-faint)]">— 可解答实验设计、公式含义、化学方程式等问题</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 mb-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={cn('p-3 rounded-lg text-[13px] leading-relaxed', msg.role === 'ai' ? 'bg-[var(--color-surface-2)] text-[var(--color-text)]' : 'bg-[var(--color-blue)]/5 text-[var(--color-blue)]')}>
                      <span className="font-bold">{msg.role === 'ai' ? 'AI: ' : '我: '}</span>
                      <div className="whitespace-pre-wrap mt-1">{msg.content}</div>
                    </div>
                  ))}
                </div>
                {/* Quick Questions */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    { q: '实验如何设计？', icon: '🧪' },
                    { q: '公式含义是什么？', icon: '📐' },
                    { q: '化学方程式解读', icon: '⚗️' },
                    { q: '数据如何理解？', icon: '📊' },
                    { q: '结论的局限性？', icon: '💡' },
                    { q: '如何复现实验？', icon: '🔬' },
                  ].map(item => (
                    <button key={item.q} className="inline-flex items-center gap-1 rounded-full border border-[var(--color-line)] px-2.5 py-1 text-[11px] text-[var(--color-muted-foreground)] hover:border-[var(--color-cyan)]/30 hover:text-[var(--color-cyan)] hover:bg-[var(--color-cyan)]/5 transition-colors" onClick={() => { setChatInput(item.q); }}>
                      {item.icon}{item.q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 text-[13px] rounded-md border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-cyan)]" placeholder="询问关于这篇文献的任何问题，如：反应机理是什么？" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChatMessage()} />
                  <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-cyan)] text-white flex items-center gap-1" onClick={sendChatMessage}><Send className="w-3.5 h-3.5" />发送</button>
                </div>
              </div>
            )}

            {/* Notes Tab */}
            {detailTab === 'notes' && (
              <div className="space-y-3">
                <button className="w-full px-3 py-2 rounded-md border border-dashed border-[var(--color-line)] text-[13px] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)] hover:text-[var(--color-blue)] transition-colors flex items-center justify-center gap-1" onClick={() => setShowNoteEditor(true)}>
                  <Plus className="w-3.5 h-3.5" />添加笔记/标注
                </button>
                {selectedPaper.notes && selectedPaper.notes.map(note => (
                  <div key={note.id} className="p-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: note.color }} />
                      <span className="text-[12px] text-[var(--color-faint)]">第{note.page}页 · {note.date}</span>
                    </div>
                    <div className="text-[13px] text-[var(--color-muted-foreground)] italic mb-1 pl-3 border-l-2" style={{ borderColor: note.color }}>&ldquo;{note.highlight}&rdquo;</div>
                    <div className="text-[13px] text-[var(--color-text)] pl-3">{note.content}</div>
                  </div>
                ))}
                {(!selectedPaper.notes || selectedPaper.notes.length === 0) && (
                  <div className="text-center py-8">
                    <Highlighter className="w-8 h-8 mx-auto text-[var(--color-faint)] mb-2" />
                    <div className="text-[13px] text-[var(--color-faint)]">暂无笔记标注</div>
                  </div>
                )}
              </div>
            )}

            {/* Related Tab */}
            {detailTab === 'related' && (
              <div className="space-y-2">
                <div className="text-[13px] font-bold text-[var(--color-text)] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[var(--color-cyan)]" />与本文相关的推荐
                </div>
                {relatedRecommendations.length === 0 && (
                  <div className="text-[13px] text-[var(--color-faint)] py-4 text-center">暂无相关推荐数据</div>
                )}
                {relatedRecommendations.map(paper => (
                  <div key={paper.id} className="p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-cyan)]/30 hover:bg-[var(--color-cyan)]/5 cursor-pointer transition-colors" onClick={() => { setSelectedPaper(paper); setDetailTab('abstract'); }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <a href={`/literature-search/${paper.id}`} target="_blank" rel="noopener noreferrer" className="text-[13px] font-bold text-[var(--color-text)] line-clamp-1 hover:text-[var(--color-blue)] hover:underline">{paper.title}</a>
                        <div className="text-[11px] text-[var(--color-faint)] mt-0.5">{paper.authors} · {paper.journal} · {paper.year}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-[var(--color-muted-foreground)]">引用 {paper.cited}</span>
                          <span className="text-[11px] text-[var(--color-muted-foreground)]">·</span>
                          <span className="text-[11px] text-[var(--color-muted-foreground)]">{paper.literatureType}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {paper.reasons.map((reason, idx) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-cyan)]/10 px-1.5 py-0.5 text-[11px] text-[var(--color-cyan)] font-medium">
                              <Sparkles className="h-2.5 w-2.5" />{reason}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-cyan)]/10 text-[var(--color-cyan)]">{paper.score}分</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Authors Tab */}
            {detailTab === 'authors' && (
              <div className="space-y-3">
                <div className="text-[13px] font-bold text-[var(--color-text)] flex items-center gap-1.5"><User className="h-4 w-4 text-[var(--color-blue)]" />作者画像</div>
                {selectedPaper.authorFull.map((author, i) => (
                  <div key={i} className="p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-blue)] transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-blue)]/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-[var(--color-blue)]">{author.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[var(--color-text)]">{author.name}</span>
                          <button className="text-[11px] text-[var(--color-blue)] hover:underline flex items-center gap-0.5"><Search className="w-2.5 h-2.5" />查看全部论文</button>
                        </div>
                        <div className="text-[13px] text-[var(--color-muted-foreground)] mt-0.5">{author.affiliation}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="text-center">
                            <div className="text-sm font-bold text-[var(--color-navy)]">{author.hIndex}</div>
                            <div className="text-[11px] text-[var(--color-faint)]">H-index</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-[var(--color-text)]">{author.papers}</div>
                            <div className="text-[11px] text-[var(--color-faint)]">论文</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-bold text-[var(--color-text)]">{author.cited.toLocaleString()}</div>
                            <div className="text-[11px] text-[var(--color-faint)]">总引用</div>
                          </div>
                        </div>
                        {/* 研究方向 */}
                        {author.researchAreas && author.researchAreas.length > 0 && (
                          <div className="mt-2">
                            <div className="text-[11px] font-bold text-[var(--color-faint)] mb-1">研究方向</div>
                            <div className="flex flex-wrap gap-1">
                              {author.researchAreas.map((area, j) => (
                                <span key={j} className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-blue)]/8 text-[var(--color-blue)] border border-[var(--color-blue)]/15">{area}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* 发文趋势 */}
                        {author.pubTrend && author.pubTrend.length > 0 && (
                          <div className="mt-2">
                            <div className="text-[11px] font-bold text-[var(--color-faint)] mb-1">发文趋势</div>
                            <div className="flex items-end gap-[3px] h-[32px]">
                              {author.pubTrend.map((t, j) => {
                                const maxCount = Math.max(...author.pubTrend!.map(x => x.count));
                                const h = Math.max(4, (t.count / maxCount) * 28);
                                return (
                                  <div key={j} className="flex flex-col items-center gap-[1px]">
                                    <div className="w-[14px] rounded-[2px] bg-[var(--color-blue)]/60" style={{ height: `${h}px` }} title={`${t.year}: ${t.count}篇`} />
                                    <span className="text-[8px] text-[var(--color-faint)]">{String(t.year).slice(-2)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {/* 代表成果 */}
                        {author.topPapers && author.topPapers.length > 0 && (
                          <div className="mt-2">
                            <div className="text-[11px] font-bold text-[var(--color-faint)] mb-1">代表成果</div>
                            <div className="space-y-0.5">
                              {author.topPapers.slice(0, 3).map((p, j) => (
                                <div key={j} className="text-[11px] text-[var(--color-muted-foreground)] flex items-start gap-1">
                                  <span className="text-[var(--color-blue)] mt-[2px]">•</span>
                                  <span className="line-clamp-1">{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {/* 合作网络 */}
                        {author.collaborators && author.collaborators.length > 0 && (
                          <div className="mt-2">
                            <div className="text-[11px] font-bold text-[var(--color-faint)] mb-1">合作网络</div>
                            <div className="flex items-center gap-1 flex-wrap">
                              <div className="w-6 h-6 rounded-full bg-[var(--color-blue)]/15 flex items-center justify-center">
                                <span className="text-[9px] font-bold text-[var(--color-blue)]">{author.name.charAt(0)}</span>
                              </div>
                              {author.collaborators.map((c, j) => (
                                <Fragment key={j}>
                                  <div className="w-3 h-[1px] bg-[var(--color-blue)]/30" />
                                  <div className="w-6 h-6 rounded-full bg-[var(--color-blue)]/8 flex items-center justify-center" title={c}>
                                    <span className="text-[9px] font-medium text-[var(--color-blue)]/70">{c.charAt(0)}</span>
                                  </div>
                                </Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                        <button className="mt-2 px-2 py-1 rounded text-[11px] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] flex items-center gap-1">
                          <Bell className="w-2.5 h-2.5" />订阅该作者新论文
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Citation Export Modal */}
      {showCiteModal && selectedPaper && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCiteModal(false)}>
          <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)]">引用导出</h3>
              <button onClick={() => setShowCiteModal(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {citationFormats.map(fmt => (
                <button key={fmt.key} onClick={() => setCiteFormat(fmt.key)} className={cn('rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors', citeFormat === fmt.key ? 'bg-[var(--color-blue)] text-white' : 'border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)] hover:text-[var(--color-blue)]')}>{fmt.label}</button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)] mb-3">
              <pre className="text-[13px] text-[var(--color-text)] font-mono whitespace-pre-wrap">{getCitation(selectedPaper, citeFormat)}</pre>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={handleCopyCitation} className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white flex items-center gap-1">
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}{copied ? '已复制' : '复制引用'}
              </button>
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] flex items-center gap-1"><Download className="w-3.5 h-3.5" />下载 .bib</button>
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
              <button onClick={() => setShowSubscribeModal(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-blue)] cursor-pointer">
                <input type="checkbox" className="rounded border-[var(--color-line)]" defaultChecked />
                <div><div className="text-[13px] font-bold text-[var(--color-text)]">新引用提醒</div><div className="text-[12px] text-[var(--color-faint)]">当本文被新论文引用时通知</div></div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-blue)] cursor-pointer">
                <input type="checkbox" className="rounded border-[var(--color-line)]" />
                <div><div className="text-[13px] font-bold text-[var(--color-text)]">相关论文推送</div><div className="text-[12px] text-[var(--color-faint)]">推送与本文相关的最新文献</div></div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-blue)] cursor-pointer">
                <input type="checkbox" className="rounded border-[var(--color-line)]" />
                <div><div className="text-[13px] font-bold text-[var(--color-text)]">作者新文提醒</div><div className="text-[12px] text-[var(--color-faint)]">当本文作者发表新论文时通知</div></div>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-lg border border-[var(--color-line)] hover:border-[var(--color-blue)] cursor-pointer">
                <input type="checkbox" className="rounded border-[var(--color-line)]" />
                <div><div className="text-[13px] font-bold text-[var(--color-text)]">关键词订阅</div><div className="text-[12px] text-[var(--color-faint)]">按本文关键词订阅新文献</div></div>
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)]" onClick={() => setShowSubscribeModal(false)}>取消</button>
              <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white" onClick={() => setShowSubscribeModal(false)}>确认订阅</button>
            </div>
          </div>
        </div>
      )}

      {/* Bib Export Modal */}
      {showBibExport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowBibExport(false)}>
          <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-[520px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)]">.bib 批量导出</h3>
              <button onClick={() => setShowBibExport(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-[13px] text-[var(--color-muted-foreground)] mb-2">已选 {selectedPapers.size || filteredPapers.length} 篇文献</div>
            <div className="p-3 rounded-lg bg-[var(--color-surface-2)] max-h-48 overflow-y-auto">
              <pre className="text-[12px] text-[var(--color-text)] font-mono whitespace-pre-wrap">{(selectedPapers.size > 0 ? filteredPapers.filter(p => selectedPapers.has(p.id)) : filteredPapers).map(p => getCitation(p, 'bibtex')).join('\n\n')}</pre>
            </div>
            <div className="flex gap-2 justify-end mt-3">
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)]" onClick={() => setShowBibExport(false)}>取消</button>
              <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white flex items-center gap-1"><Download className="w-3.5 h-3.5" />下载 .bib 文件</button>
            </div>
          </div>
        </div>
      )}

      {/* Download Toast */}
      {downloadToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-text)] text-white px-5 py-2.5 rounded-lg shadow-lg text-[13px] flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Download className="w-4 h-4" />
          {downloadToast}
        </div>
      )}

      {/* Note Editor Modal */}
      {showNoteEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowNoteEditor(false)}>
          <div className="bg-[var(--color-surface)] rounded-lg shadow-lg w-[440px] p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--color-text)]">添加笔记标注</h3>
              <button onClick={() => setShowNoteEditor(false)} className="text-[var(--color-muted-foreground)] hover:text-[var(--color-text)]"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div><div className="text-[13px] font-medium text-[var(--color-text)] mb-1">高亮文本</div><input className="w-full px-3 py-2 text-[13px] rounded-md border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-blue)]" placeholder="输入或粘贴要标注的原文..." /></div>
              <div><div className="text-[13px] font-medium text-[var(--color-text)] mb-1">笔记内容</div><textarea className="w-full px-3 py-2 text-[13px] rounded-md border border-[var(--color-line)] focus:outline-none focus:border-[var(--color-blue)] min-h-[80px]" placeholder="写下你的理解和思考..." /></div>
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-medium text-[var(--color-text)]">标注颜色</div>
                {['#f59e0b', '#17a56a', '#7c5ce0', '#13b7c7', '#cf3f3f'].map(c => <button key={c} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />)}
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button className="px-4 py-2 rounded-md text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)]" onClick={() => setShowNoteEditor(false)}>取消</button>
              <button className="px-4 py-2 rounded-md text-[13px] bg-[var(--color-blue)] text-white" onClick={() => setShowNoteEditor(false)}>保存笔记</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
