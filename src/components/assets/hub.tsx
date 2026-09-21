'use client';

import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle, ArrowLeft, ArrowRight, Beaker, BookOpen, Bot, Box, Braces,
  Building2, Calculator, Check, CheckCircle2, ChevronDown, ChevronRight,
  Clock3, CloudUpload, Code2, Copy, Database, Download, Eye, File,
  FileArchive, FileJson, FileText, Filter, FlaskConical, FolderOpen,
  Globe2, Grid2X2, Heart, Info, List, LockKeyhole, MonitorCog,
  MoreHorizontal, Play, Plus, RefreshCw, RotateCcw, Save, Search,
  SlidersHorizontal, Sparkles, Star, Trash2, Upload, User, Users, Workflow,
  X,
} from 'lucide-react';
import styles from './asset-hub.module.css';
import {
  assetCategories, assetRecords, categoryByKey, detailHref, disciplines,
  filterAssets, plazaHref, purposes, resolveAssetRoute, sortAssets,
  type AssetCategoryKey, type AssetRecord, type AssetStatus,
  type AssetVisibility, type SortKey,
} from './catalog';
import { persistValue } from './persistence';

const categoryIcons: Record<AssetCategoryKey, LucideIcon> = {
  data: Database,
  knowledge: BookOpen,
  outcome: FileText,
  model: Box,
  'compute-plan': Calculator,
  'experiment-plan': FlaskConical,
  agent: Bot,
  workflow: Workflow,
  skill: Sparkles,
  software: MonitorCog,
  algorithm: Braces,
};

const groupTabs: Record<string, AssetCategoryKey[]> = {
  'data-knowledge': ['data', 'knowledge', 'outcome'],
  model: ['model'],
  plans: ['compute-plan', 'experiment-plan'],
  'intelligent-services': ['agent', 'workflow', 'skill', 'software', 'algorithm'],
};

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: '综合排序' },
  { value: 'latest', label: '最新发布' },
  { value: 'updated', label: '最近更新' },
  { value: 'downloads', label: '下载最多' },
  { value: 'views', label: '浏览最多' },
  { value: 'favorites', label: '收藏最多' },
  { value: 'usage', label: '使用最多' },
];

const seededOwnedAssets: AssetRecord[] = [
  { ...assetRecords[0], id: 'MY-ASSET-001', slug: 'my-catalyst-lifetime-data', name: 'Cu/ZnO 催化剂寿命评价数据集', summary: '不同温度与空速条件下的催化剂连续稳定性、活性衰减与再生数据。', author: '张博士', organization: '北京能源材料研究院', downloads: 86, views: 420, favorites: 27, usage: 18 },
  { ...assetRecords[7], id: 'MY-DRAFT-001', slug: 'my-experiment-plan-draft', name: '催化剂寿命评价实验方案', author: '张博士', organization: '北京能源材料研究院', status: '草稿', visibility: '仅自己可见', downloads: 0, views: 0, favorites: 0, usage: 0 },
];

function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch { /* Browser storage is an optional prototype enhancement. */ }
  }, [key]);
  const setPersistentValue = useCallback((next: T) => {
    setValue(next);
    try { persistValue(window.localStorage, key, next); } catch { /* Ignore quota/privacy failures. */ }
  }, [key]);
  return [value, setPersistentValue] as const;
}

function formatCount(value: number) {
  return new Intl.NumberFormat('zh-CN', { notation: value >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
}

function cn(...values: Array<string | false | undefined>) {
  return values.filter(Boolean).join(' ');
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);
  return <div className={styles.toast} role="status"><CheckCircle2 size={17} /><span>{message}</span><button className={styles.ghostButton} aria-label="关闭提示" onClick={onClose}><X size={14} /></button></div>;
}

function CategoryIcon({ category, size = 18 }: { category: AssetCategoryKey; size?: number }) {
  const Icon = categoryIcons[category];
  const config = categoryByKey(category);
  return <span className={cn(styles.assetIcon, styles[config.color])}><Icon size={size} strokeWidth={1.8} /></span>;
}

function PageHeader({ title, description, actions, eyebrow = '科研资产' }: { title: string; description: string; actions?: ReactNode; eyebrow?: string }) {
  return <header className={styles.pageHeader}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{actions ? <div className={styles.headerActions}>{actions}</div> : null}</header>;
}

function HubNav() {
  const pathname = usePathname();
  const items = [
    ['资产首页', '/assets'], ['数据及知识', '/assets/data-knowledge'], ['科研模型', '/assets/models'],
    ['科研方案', '/assets/plans'], ['智能服务', '/assets/intelligent-services'], ['我的资产', '/assets/mine'],
  ];
  const activePath = pathname.startsWith('/assets/data-knowledge') || ['/assets/data/', '/assets/knowledge/', '/assets/outcome/'].some((p) => pathname.startsWith(p)) ? '/assets/data-knowledge'
    : pathname.startsWith('/assets/models') || pathname.startsWith('/assets/model/') ? '/assets/models'
      : pathname.startsWith('/assets/plans') || pathname.startsWith('/assets/compute-plan/') || pathname.startsWith('/assets/experiment-plan/') ? '/assets/plans'
        : pathname.startsWith('/assets/intelligent-services') || ['/assets/agent/', '/assets/workflow/', '/assets/skill/', '/assets/software/', '/assets/algorithm/'].some((p) => pathname.startsWith(p)) ? '/assets/intelligent-services'
          : pathname.startsWith('/assets/mine') ? '/assets/mine' : '/assets';
  return <nav className={styles.plazaNav} aria-label="科研资产导航">{items.map(([label, href]) => <Link key={href} href={href} aria-current={activePath === href ? 'page' : undefined} className={cn(styles.plazaTab, activePath === href && styles.plazaTabActive)}>{label}</Link>)}</nav>;
}

function SearchBox({ value, onChange, onSubmit, placeholder, label = '搜索科研资产' }: { value: string; onChange: (value: string) => void; onSubmit?: () => void; placeholder: string; label?: string }) {
  return <div className={styles.searchBox}><Search size={18} aria-hidden="true" /><input aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') onSubmit?.(); }} placeholder={placeholder} />{value ? <button className={styles.ghostButton} aria-label="清空搜索" onClick={() => onChange('')}><X size={14} /></button> : null}</div>;
}

function RecommendationCard({ item }: { item: AssetRecord }) {
  return <Link href={detailHref(item)} className={styles.recommendCard}><div className={styles.quickCardTop}><CategoryIcon category={item.category} /><span className={styles.typeTag}>{categoryByKey(item.category).shortLabel}</span></div><div><div className={styles.recommendTitle}>{item.name}</div><p className={styles.recommendSummary}>{item.summary}</p></div><div className={styles.metaLine}><span><Download size={12} />{formatCount(item.downloads)}</span><span><Heart size={12} />{formatCount(item.favorites)}</span><span>{item.version}</span></div></Link>;
}

function HomePage({ records, recentRecords }: { records: AssetRecord[]; recentRecords: AssetRecord[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const sections = [
    { title: '热门科研资产', description: '按浏览、下载、收藏与使用量综合排序', items: sortAssets(records, 'relevance').slice(0, 4) },
    { title: '最新发布', description: '平台近期发布的可用资产', items: sortAssets(records, 'latest').slice(0, 4) },
    { title: '编辑推荐', description: '说明完整、可复现性较高的精选内容', items: records.filter((item) => item.editorPick).slice(0, 4) },
    { title: '最近浏览', description: '当前浏览器最近打开的科研资产', items: recentRecords.slice(0, 4) },
  ].filter((section) => section.items.length > 0);
  const submitSearch = () => router.push(`/assets/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`);
  return <div className={styles.stack}><HubNav /><PageHeader title="科研资产" description="汇聚科研数据、模型、方案与智能服务，支持发现、上传、下载和复用。" actions={<><Link className={styles.secondaryButton} href="/assets/mine"><FolderOpen size={16} />我的科研资产</Link><Link className={styles.primaryButton} href="/assets/upload"><Upload size={16} />上传科研资产</Link></>} /><section className={styles.searchHero}><SearchBox value={query} onChange={setQuery} onSubmit={submitSearch} placeholder="搜索数据、知识、成果、模型、方案、Agent、Workflow、Skill、软件、算法" /><button className={styles.primaryButton} onClick={submitSearch}><Search size={16} />搜索资产</button></section><section><div className={styles.sectionHeader} style={{ border: 0, padding: '0 4px' }}><div><h2>按资产类型浏览</h2><p>选择资产类型，再按学科与学术用途筛选</p></div></div><div className={styles.quickGrid}>{assetCategories.map((item) => { const Icon = categoryIcons[item.key]; const count = records.filter((record) => record.category === item.key).length; return <Link key={item.key} href={plazaHref(item.key)} className={styles.quickCard}><div className={styles.quickCardTop}><span className={cn(styles.quickIcon, styles[item.color])}><Icon size={19} /></span><span className={styles.metaLine}>{count} 项 <ChevronRight size={13} /></span></div><strong>{item.label}</strong><p>{item.description}</p></Link>; })}</div></section>{sections.map((section) => <section className={styles.section} key={section.title}><div className={styles.sectionHeader}><div><h2>{section.title}</h2><p>{section.description}</p></div><Link className={styles.ghostButton} href="/assets/search">查看更多 <ChevronRight size={14} /></Link></div><div className={styles.sectionBody}><div className={styles.recommendGrid}>{section.items.map((item) => <RecommendationCard key={item.id} item={item} />)}</div></div></section>)}</div>;
}

function FilterGroup({ title, values, selected, counts, onToggle }: { title: string; values: string[]; selected: string[]; counts: Map<string, number>; onToggle: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? values : values.slice(0, 6);
  return <div className={styles.filterGroup}><h3>{title}</h3><div className={styles.filterOptions}>{visible.map((value) => <button key={value} className={cn(styles.filterOption, selected.includes(value) && styles.filterOptionActive)} onClick={() => onToggle(value)} aria-pressed={selected.includes(value)}>{selected.includes(value) ? <Check size={12} /> : <span style={{ width: 12 }} />}{value}<span className={styles.filterCount}>{counts.get(value) ?? 0}</span></button>)}</div>{values.length > 6 ? <button className={styles.moreButton} onClick={() => setExpanded((value) => !value)}>{expanded ? '收起' : '展开更多'} <ChevronDown size={12} style={{ display: 'inline', transform: expanded ? 'rotate(180deg)' : undefined }} /></button> : null}</div>;
}

function toggleValue(value: string, list: string[]) { return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; }

function AssetCard({ item, grid, favorite, onFavorite, onAction }: { item: AssetRecord; grid: boolean; favorite: boolean; onFavorite: () => void; onAction: (message: string) => void }) {
  const category = categoryByKey(item.category);
  const executable = ['model', 'agent', 'workflow', 'skill', 'algorithm'].includes(item.category);
  return <article className={styles.assetCard}><CategoryIcon category={item.category} size={20} /><div className={styles.assetBody}><div className={styles.assetTitleRow}><Link href={detailHref(item)} className={styles.assetTitle}>{item.name}</Link><span className={styles.typeTag}>{category.shortLabel}</span>{item.status === '已发布' ? <span className={styles.statusTag}><CheckCircle2 size={11} />已发布</span> : null}</div><div className={styles.tagRow} style={{ marginTop: 8 }}>{[...item.disciplines.slice(0, 1), ...item.purposes.slice(0, 2), ...item.attributes.slice(0, 2)].map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}</div><p className={styles.assetSummary}>{item.summary}</p><div className={styles.assetFooter}><div className={styles.metaLine}><span><User size={12} />{item.author}</span><span><Clock3 size={12} />{item.updatedAt}</span><span>{item.version}</span><span>{item.format}</span><span>{item.size}</span></div><div className={styles.metaLine}><span><Eye size={12} />{formatCount(item.views)}</span><span><Download size={12} />{formatCount(item.downloads)}</span><span><Heart size={12} />{formatCount(item.favorites)}</span></div></div></div><div className={styles.assetActions}>{item.metric && !grid ? <div className={styles.metric}><span>{item.metric.label}</span><strong>{item.metric.value}</strong></div> : null}<Link href={detailHref(item)} className={styles.secondaryButton}>查看详情</Link><button className={styles.primaryButton} onClick={() => onAction(item.restricted ? '已提交获取申请，请等待资产上传者回复。' : executable ? `已获取 ${item.name} 的使用方式。` : `${item.name} 下载任务已创建。`)}>{item.restricted ? '申请获取' : executable ? '获取/使用' : '下载'}</button><button className={cn(styles.iconButton, favorite && styles.iconButtonActive)} onClick={onFavorite} aria-label={favorite ? `取消收藏 ${item.name}` : `收藏 ${item.name}`} aria-pressed={favorite}><Heart size={15} fill={favorite ? 'currentColor' : 'none'} /></button></div></article>;
}

function PlazaPage({ initialCategory, records, favoriteIds, setFavoriteIds, searchMode = false, onToast }: { initialCategory: AssetCategoryKey; records: AssetRecord[]; favoriteIds: string[]; setFavoriteIds: (ids: string[]) => void; searchMode?: boolean; onToast: (message: string) => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<AssetCategoryKey>(initialCategory);
  const [query, setQuery] = useState(searchMode ? searchParams.get('q') ?? '' : '');
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('relevance');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const config = categoryByKey(category);
  const categoryRecords = searchMode ? records : records.filter((item) => item.category === category);
  const attributes = [...new Set(categoryRecords.flatMap((item) => item.attributes))];
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    categoryRecords.flatMap((item) => [...item.disciplines, ...item.purposes, ...item.attributes]).forEach((value) => map.set(value, (map.get(value) ?? 0) + 1));
    return map;
  }, [categoryRecords]);
  const filtered = useMemo(() => sortAssets(filterAssets(categoryRecords, { query, disciplines: selectedDisciplines, purposes: selectedPurposes, attributes: selectedAttributes }), sort), [categoryRecords, query, selectedDisciplines, selectedPurposes, selectedAttributes, sort]);
  const pageSize = searchMode ? 6 : 5;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);
  const selected = [...selectedDisciplines, ...selectedPurposes, ...selectedAttributes];
  useEffect(() => { setPage(1); }, [category, query, selectedDisciplines, selectedPurposes, selectedAttributes, sort]);
  const changeCategory = (next: AssetCategoryKey) => {
    setCategory(next); setSelectedDisciplines([]); setSelectedPurposes([]); setSelectedAttributes([]);
    router.push(searchMode ? `/assets/search?type=${next}${query.trim() ? `&q=${encodeURIComponent(query.trim())}` : ''}` : plazaHref(next));
  };
  const clear = () => { setSelectedDisciplines([]); setSelectedPurposes([]); setSelectedAttributes([]); setQuery(''); };
  const toggleFavorite = (id: string) => { const next = favoriteIds.includes(id) ? favoriteIds.filter((value) => value !== id) : [...favoriteIds, id]; setFavoriteIds(next); onToast(favoriteIds.includes(id) ? '已取消收藏。' : '已收藏，可在“我的资产”查看。'); };
  const tabs = searchMode ? assetCategories.map((item) => item.key) : groupTabs[config.group];
  return <div className={styles.stack}><HubNav /><PageHeader title={searchMode ? '科研资产搜索' : config.label} description={searchMode ? '按类型、学科、学术用途与资产属性精确查找。' : config.description} actions={<Link href={`/assets/upload?type=${category}`} className={styles.primaryButton}><Upload size={16} />{config.primaryAction}</Link>} /><div className={styles.searchHero}><SearchBox value={query} onChange={setQuery} placeholder={searchMode ? '搜索名称、简介、作者、单位、标签、文件名' : `搜索${config.label}名称、作者、关键词或文件名`} /><button className={styles.secondaryButton} onClick={() => setFilterOpen((value) => !value)}><SlidersHorizontal size={15} />{filterOpen ? '收起筛选' : '展开筛选'}</button></div><nav className={styles.plazaNav} aria-label="资产类型">{tabs.map((key) => <button key={key} className={cn(styles.plazaTab, category === key && styles.plazaTabActive)} onClick={() => changeCategory(key)} aria-current={category === key ? 'page' : undefined}>{categoryByKey(key).label}</button>)}</nav>{selected.length ? <div className={styles.activeFilters}>{selected.map((value) => <button key={value} className={styles.activeFilter} onClick={() => { setSelectedDisciplines((list) => list.filter((item) => item !== value)); setSelectedPurposes((list) => list.filter((item) => item !== value)); setSelectedAttributes((list) => list.filter((item) => item !== value)); }}>{value}<X size={11} /></button>)}<button className={styles.ghostButton} onClick={clear}>清空条件</button></div> : null}<div className={styles.plazaLayout}><aside className={styles.filterPanel} data-open={filterOpen} aria-label="科研属性筛选"><div className={styles.filterTop}><strong><Filter size={14} style={{ display: 'inline', marginRight: 6 }} />科研属性</strong><button className={styles.ghostButton} onClick={clear}><RotateCcw size={12} />清空</button></div>{searchMode ? <FilterGroup title="资产类型" values={assetCategories.map((item) => item.label)} selected={[categoryByKey(category).label]} counts={new Map(assetCategories.map((item) => [item.label, records.filter((record) => record.category === item.key).length]))} onToggle={(value) => changeCategory(assetCategories.find((item) => item.label === value)!.key)} /> : null}<FilterGroup title="学科领域" values={disciplines} selected={selectedDisciplines} counts={counts} onToggle={(value) => setSelectedDisciplines((list) => toggleValue(value, list))} /><FilterGroup title="学术用途" values={purposes} selected={selectedPurposes} counts={counts} onToggle={(value) => setSelectedPurposes((list) => toggleValue(value, list))} /><FilterGroup title="资产属性" values={attributes} selected={selectedAttributes} counts={counts} onToggle={(value) => setSelectedAttributes((list) => toggleValue(value, list))} /></aside><main className={styles.plazaMain}><div className={styles.toolbar}><span className={styles.resultCount}>共 <strong>{filtered.length}</strong> 项{searchMode ? '搜索结果' : config.label}</span><div className={styles.toolbarControls}><select className={styles.select} value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="资产排序">{sortOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><button className={cn(styles.iconButton, view === 'list' && styles.iconButtonActive)} onClick={() => setView('list')} aria-label="列表视图" aria-pressed={view === 'list'}><List size={15} /></button><button className={cn(styles.iconButton, view === 'grid' && styles.iconButtonActive)} onClick={() => setView('grid')} aria-label="卡片视图" aria-pressed={view === 'grid'}><Grid2X2 size={15} /></button></div></div>{visible.length ? <div className={cn(styles.assetList, view === 'grid' && styles.assetGrid)}>{visible.map((item) => <AssetCard key={item.id} item={item} grid={view === 'grid'} favorite={favoriteIds.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onAction={onToast} />)}</div> : <div className={styles.empty}><div><span className={styles.emptyIcon}><Search size={21} /></span><h3>没有找到匹配的科研资产</h3><p>请减少筛选条件、更换关键词，或清空条件后重新浏览。</p><button className={styles.secondaryButton} onClick={clear}><RotateCcw size={14} />清空筛选</button></div></div>}{pageCount > 1 ? <nav className={styles.pagination} aria-label="分页">{Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => <button key={value} className={cn(styles.pageButton, page === value && styles.pageButtonActive)} onClick={() => setPage(value)} aria-current={page === value ? 'page' : undefined}>{value}</button>)}</nav> : null}</main><aside className={styles.asideStack}><div className={styles.asideCard}><div className={styles.asideTitle}><strong><Star size={15} style={{ display: 'inline', marginRight: 6, color: '#b4232d' }} />热门{config.shortLabel}</strong><button className={styles.ghostButton} onClick={() => onToast('已换一批热门资产。')}><RefreshCw size={12} />换一批</button></div><div className={styles.rankList}>{sortAssets(categoryRecords, 'downloads').slice(0, 5).map((item, index) => <div className={styles.rankItem} key={item.id}><span className={cn(styles.rank, index === 0 && styles.rankTop)}>{index + 1}</span><div><Link href={detailHref(item)}>{item.name}</Link><small>下载 {formatCount(item.downloads)} · 收藏 {formatCount(item.favorites)}</small></div></div>)}</div></div><div className={styles.asideCard}><div className={styles.asideTitle}><strong><Info size={15} style={{ display: 'inline', marginRight: 6, color: '#2878d0' }} />上传说明</strong></div><div className={styles.guideList}>{['准备完整的基本信息与使用说明。', '上传文件、配置或可复现示例。', '至少选择一个学科和学术用途。', '确认可见范围和 License 后发布。'].map((text, index) => <div className={styles.guideItem} key={text}><span>{index + 1}</span><span>{text}</span></div>)}</div><Link href={`/assets/upload?type=${category}`} className={styles.secondaryButton} style={{ width: '100%', marginTop: 14 }}><Upload size={14} />{config.primaryAction}</Link></div></aside></div></div>;
}

const dataTabs = ['数据集介绍', '文件列表', '数据预览', '字段说明', '版本记录', '使用说明'];
const modelTabs = ['模型介绍', '在线体验', '文件列表', '指标评估', '使用说明', '版本记录'];

function tabsFor(item: AssetRecord) {
  if (item.category === 'data') return dataTabs;
  if (item.category === 'model') return modelTabs;
  if (item.category === 'compute-plan') return ['方案介绍', '输入与参数', '计算流程', '依赖资源', '文件', '版本'];
  if (item.category === 'experiment-plan') return ['方案介绍', '材料与样品', '实验步骤', '参数条件', '质量控制', '文件', '版本'];
  if (item.category === 'software') return ['软件介绍', '安装说明', '文件', '授权说明', '版本'];
  if (['agent', 'workflow', 'skill', 'algorithm'].includes(item.category)) return ['介绍', '使用方式', '文件', '示例', '版本'];
  return ['资产介绍', '文件', '使用说明', '版本记录'];
}

function downloadTextFile(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url);
}

function FileList({ item, onToast }: { item: AssetRecord; onToast: (message: string) => void }) {
  return <div className={styles.fileTableWrap}><table className={styles.fileTable}><thead><tr><th>文件名</th><th>类型</th><th>大小</th><th>更新时间</th><th>说明</th><th>操作</th></tr></thead><tbody>{item.files.map((file) => <tr key={file.name}><td><span className={styles.fileName}>{file.type === 'JSON' ? <FileJson size={15} /> : file.type === 'ZIP' ? <FileArchive size={15} /> : <File size={15} />}{file.name}</span></td><td>{file.type}</td><td>{file.size}</td><td>{file.updatedAt}</td><td>{file.description}</td><td><button className={styles.tableAction} onClick={() => { downloadTextFile(file.name, `${item.name}\n${file.description}\n原型演示文件`); onToast(`${file.name} 已下载。`); }}><Download size={12} style={{ display: 'inline' }} /> 下载</button></td></tr>)}</tbody></table></div>;
}

function DetailContent({ item, tab, onToast }: { item: AssetRecord; tab: string; onToast: (message: string) => void }) {
  if (tab.includes('文件')) return <FileList item={item} onToast={onToast} />;
  if (tab.includes('版本')) return <div className={styles.versionList}>{item.versions.map((version, index) => <div className={styles.versionItem} key={version.version}><strong>{version.version}</strong><span>{version.date}</span><span>{version.note}</span><button className={styles.tableAction} onClick={() => onToast(index === 0 ? '当前已是最新版本。' : `已切换至 ${version.version} 历史版本。`)}>{index === 0 ? '当前版本' : '查看该版本'}</button></div>)}</div>;
  if (tab.includes('数据预览') || tab.includes('字段')) return <><div className={styles.callout}><Info size={15} /><span>当前展示可公开的样例数据；完整数据以下载文件和版本说明为准。</span></div><table className={styles.previewTable} style={{ marginTop: 12 }}><thead><tr><th>样本编号</th><th>温度 (K)</th><th>压力 (MPa)</th><th>转化率 (%)</th><th>来源文件</th></tr></thead><tbody>{[['CZA-001','513','3.0','78.4','XRD_patterns.csv'],['CZA-002','533','3.0','81.2','XRD_patterns.csv'],['CZA-003','553','4.0','83.7','metadata.json']].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></>;
  if (tab.includes('在线体验') || tab.includes('示例')) return <div className={styles.infoGrid}><div className={styles.infoBlock}><strong>示例输入</strong><p>温度 533 K、压力 3.0 MPa、H₂/CO₂ = 3。</p></div><div className={styles.infoBlock}><strong>预期输出</strong><p>甲醇生成速率、产物选择性与关键中间体。</p></div><div className={styles.infoBlock}><strong>原型边界</strong><p>在线体验仅展示输入输出形态，未调用真实计算资源。</p></div><button className={styles.primaryButton} onClick={() => onToast('示例任务已创建，运行结果将显示在当前页。')}><Play size={14} />运行示例</button></div>;
  if (tab.includes('指标')) return <div className={styles.infoGrid}>{[['准确率','92.3%'],['RMSE','0.12'],['R²','0.91'],['推理时长','0.8 s']].map(([label,value]) => <div key={label} className={styles.infoBlock}><strong>{label}</strong><p style={{ fontSize: 22, fontWeight: 700, color: '#15203a' }}>{value}</p><p>测试集指标，详见评估说明。</p></div>)}</div>;
  if (tab.includes('使用') || tab.includes('安装') || tab.includes('授权')) return <div className={styles.stack}>{item.detailSections.map((section) => <div className={styles.infoBlock} key={section.title}><strong>{section.title}</strong><p>{section.body}</p></div>)}<div className={styles.callout}><Code2 size={15} /><span>引用时请标注资产 ID {item.id}、版本 {item.version}、作者与获取日期。</span></div></div>;
  return <div className={styles.stack}><p style={{ margin: 0 }}>{item.description}</p><div className={styles.infoGrid}><div className={styles.infoBlock}><strong>学科领域</strong><div className={styles.tagRow}>{item.disciplines.map((value) => <span className={styles.tag} key={value}>{value}</span>)}</div></div><div className={styles.infoBlock}><strong>学术用途</strong><div className={styles.tagRow}>{item.purposes.map((value) => <span className={styles.tag} key={value}>{value}</span>)}</div></div><div className={styles.infoBlock}><strong>资产属性</strong><div className={styles.tagRow}>{item.attributes.map((value) => <span className={styles.tag} key={value}>{value}</span>)}</div></div></div>{item.detailSections.map((section) => <div className={styles.infoBlock} key={section.title}><strong>{section.title}</strong><p>{section.body}</p></div>)}</div>;
}

function AssetIssueBanner({ state, item }: { state?: string | null; item: AssetRecord }) {
  const issues: Record<string, { title: string; body: string }> = {
    network: { title: '网络异常', body: '暂时无法加载最新资产信息，请检查网络后重试。' },
    'download-failed': { title: '下载失败', body: '下载任务未完成，请重试或改为单文件下载。' },
    'no-access': { title: '无访问权限', body: '当前账号不在该资产的可见用户范围内。' },
    down: { title: '资产已下架', body: '该资产已停止在广场分发，历史收藏仅保留基本信息。' },
    'version-missing': { title: '历史版本不存在', body: '请切换到当前版本，或联系上传者确认版本记录。' },
  };
  const issue = state ? issues[state] : undefined;
  if (!issue) return null;
  return <div className={cn(styles.callout, styles.warningCallout)} role="alert"><AlertCircle size={16} /><span><strong>{issue.title}</strong><br />{issue.body}</span><Link href={detailHref(item)} className={styles.secondaryButton}>恢复当前版本</Link></div>;
}

function DetailPage({ item, favorite, onFavorite, onToast }: { item: AssetRecord; favorite: boolean; onFavorite: () => void; onToast: (message: string) => void }) {
  const [tab, setTab] = useState(tabsFor(item)[0]);
  const [preparing, setPreparing] = useState(false);
  const config = categoryByKey(item.category);
  const executable = ['model', 'agent', 'workflow', 'skill', 'algorithm'].includes(item.category);
  const prepareDownload = () => {
    if (item.restricted) { onToast('已提交获取申请，结果将在站内消息通知。'); return; }
    if (Number.parseFloat(item.size) >= 5 && item.size.includes('GB')) {
      setPreparing(true); onToast('大文件正在后台准备，完成后可下载。');
      window.setTimeout(() => { setPreparing(false); downloadTextFile(`${item.slug}-${item.version}.txt`, `${item.name}\n${item.version}\n原型下载包说明`); }, 1800);
    } else { downloadTextFile(`${item.slug}-${item.version}.txt`, `${item.name}\n${item.version}\n原型下载包说明`); onToast('当前版本下载已开始。'); }
  };
  return <div className={styles.stack}><HubNav /><section className={styles.detailHeader}><Link href={plazaHref(item.category)} className={styles.backLink}><ArrowLeft size={14} />返回{config.label}广场</Link><div className={styles.detailHero}><div className={styles.detailLead}><CategoryIcon category={item.category} size={22} /><div><div className={styles.assetTitleRow}><h1>{item.name}</h1><span className={styles.typeTag}>{config.label}</span><span className={styles.tag}>{item.version}</span><span className={styles.statusTag}><CheckCircle2 size={11} />{item.status}</span></div><p>{item.summary}</p><div className={styles.detailMeta}><span><User size={13} />{item.author}</span><span><Building2 size={13} />{item.organization}</span><span><Clock3 size={13} />更新于 {item.updatedAt}</span><span><Eye size={13} />{formatCount(item.views)}</span><span><Download size={13} />{formatCount(item.downloads)}</span><span><Heart size={13} />{formatCount(item.favorites)}</span></div></div></div><div className={styles.detailActions}><button className={styles.primaryButton} onClick={prepareDownload} disabled={preparing}>{preparing ? <RefreshCw size={15} className="animate-spin motion-reduce:animate-none" /> : <Download size={15} />}{preparing ? '准备中…' : item.restricted ? '申请获取' : executable ? '下载/获取' : '下载资产'}</button>{['model', 'agent'].includes(item.category) ? <button className={styles.secondaryButton} onClick={() => { setTab(tabsFor(item).find((value) => value.includes('体验')) ?? tabsFor(item)[1]); onToast('已打开在线体验。'); }}><Play size={15} />在线体验</button> : null}{executable ? <button className={styles.secondaryButton} onClick={() => { navigator.clipboard?.writeText(`https://ai4s.example/assets/${item.category}/${item.slug}`); onToast('调用地址已复制。'); }}><Code2 size={15} />API/SDK</button> : null}<button className={cn(styles.secondaryButton, favorite && styles.iconButtonActive)} onClick={onFavorite}><Heart size={15} fill={favorite ? 'currentColor' : 'none'} />{favorite ? '已收藏' : '收藏'}</button><button className={styles.iconButton} aria-label="更多资产操作"><MoreHorizontal size={16} /></button></div></div></section><nav className={styles.detailTabs} aria-label="资产详情页签">{tabsFor(item).map((value) => <button key={value} className={cn(styles.detailTab, tab === value && styles.detailTabActive)} onClick={() => setTab(value)} aria-selected={tab === value}>{value}</button>)}</nav><div className={styles.detailLayout}><main className={styles.detailMain}><section className={styles.contentCard}><div className={styles.contentCardHeader}><h2><FileText size={16} color="#b4232d" />{tab}</h2>{tab.includes('文件') ? <button className={styles.secondaryButton} onClick={prepareDownload}><Download size={14} />整包下载</button> : null}</div><div className={styles.contentCardBody}><DetailContent item={item} tab={tab} onToast={onToast} /></div></section></main><aside className={styles.detailAside}><section className={styles.contentCard}><div className={styles.contentCardHeader}><h2><Info size={16} color="#2878d0" />资产信息</h2></div><div className={styles.contentCardBody}><dl className={styles.definitionList}><dt>资产类型</dt><dd>{config.label}</dd><dt>当前版本</dt><dd>{item.version}</dd><dt>文件格式</dt><dd>{item.format}</dd><dt>文件规模</dt><dd>{item.size}</dd><dt>上传者</dt><dd>{item.author}</dd><dt>可见范围</dt><dd>{item.visibility}</dd><dt>License</dt><dd>{item.license}</dd></dl></div></section><section className={styles.contentCard}><div className={styles.contentCardHeader}><h2><Download size={16} color="#b4232d" />获取前说明</h2></div><div className={styles.contentCardBody}><div className={styles.guideList}><div><strong>版本</strong><br />默认获取 {item.version}，可在版本记录切换历史版本。</div><div><strong>格式与大小</strong><br />{item.format} · {item.size}</div><div><strong>使用条款</strong><br />{item.license}，使用前请阅读 README 与限制说明。</div></div></div></section><section className={styles.contentCard}><div className={styles.contentCardHeader}><h2><Star size={16} color="#c99325" />相关资产</h2></div><div className={styles.contentCardBody}><div className={styles.rankList}>{assetRecords.filter((record) => record.category === item.category && record.id !== item.id).slice(0, 3).map((record) => <div className={styles.rankItem} key={record.id}><CategoryIcon category={record.category} size={14} /><div><Link href={detailHref(record)}>{record.name}</Link><small>{record.version} · 下载 {formatCount(record.downloads)}</small></div></div>)}</div></div></section></aside></div></div>;
}

type UploadDraft = { category?: AssetCategoryKey; name: string; summary: string; description: string; version: string; discipline: string[]; purpose: string[]; attributes: string[]; visibility: AssetVisibility; files: { name: string; size: string; progress: number; error?: boolean }[] };
const emptyDraft: UploadDraft = { name: '', summary: '', description: '', version: 'v1.0', discipline: [], purpose: [], attributes: [], visibility: '平台内公开', files: [] };
const uploadSteps = ['选择资产类型', '填写基本信息', '上传文件/配置', '科研分类与标签', '可见范围', '预览并发布'];

function UploadIssueBanner({ state }: { state?: string | null }) {
  if (state !== 'upload-failed' && state !== 'parse-failed') return null;
  return <div className={cn(styles.callout, styles.warningCallout)} role="alert"><AlertCircle size={16} /><span><strong>{state === 'upload-failed' ? '文件上传失败' : '文件解析失败'}</strong><br />{state === 'upload-failed' ? '请检查网络、文件大小和名称后重新上传。' : '文件已保留在上传列表，可重试解析或替换文件。'}</span></div>;
}

function UploadPage({ initialCategory, onPublished, drafts, setDrafts, onToast }: { initialCategory?: AssetCategoryKey; onPublished: (item: AssetRecord) => void; drafts: UploadDraft[]; setDrafts: (drafts: UploadDraft[]) => void; onToast: (message: string) => void }) {
  const router = useRouter();
  const [step, setStep] = useState(initialCategory ? 1 : 0);
  const [draft, setDraft] = useState<UploadDraft>({ ...emptyDraft, category: initialCategory });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const config = draft.category ? categoryByKey(draft.category) : undefined;
  const typeAttributes = draft.category ? [...new Set(assetRecords.filter((item) => item.category === draft.category).flatMap((item) => item.attributes))] : [];
  const update = <K extends keyof UploadDraft>(key: K, value: UploadDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const validate = () => {
    const next: Record<string, string> = {};
    if (step === 0 && !draft.category) next.category = '请选择资产类型。';
    if (step === 1) { if (!draft.name.trim()) next.name = '请填写资产名称。'; if (draft.summary.trim().length < 100) next.summary = '简介需 100—300 字，说明资产内容、适用范围和使用价值。'; if (!draft.version.trim()) next.version = '请填写版本号。'; }
    if (step === 2 && draft.files.length === 0) next.files = '请至少添加一个文件或配置。';
    if (step === 3) { if (!draft.discipline.length) next.discipline = '请至少选择一个学科领域。'; if (!draft.purpose.length) next.purpose = '请至少选择一个学术用途。'; if (!draft.attributes.length) next.attributes = '请至少选择一个资产属性。'; }
    setErrors(next); return Object.keys(next).length === 0;
  };
  const nextStep = () => { if (validate()) setStep((value) => Math.min(5, value + 1)); };
  const addFiles = (event: ChangeEvent<HTMLInputElement>) => { const next = Array.from(event.target.files ?? []).map((file) => ({ name: file.name, size: `${Math.max(1, Math.round(file.size / 1024))} KB`, progress: 100 })); update('files', [...draft.files, ...next]); };
  const saveDraft = () => { setDrafts([...drafts, draft]); onToast('草稿已保存在当前浏览器。'); };
  const publish = () => {
    if (!draft.category) return;
    const item: AssetRecord = { ...assetRecords.find((record) => record.category === draft.category)!, id: `MY-${Date.now()}`, slug: `${draft.category}-${Date.now()}`, name: draft.name, summary: draft.summary, description: draft.description || draft.summary, version: draft.version, disciplines: draft.discipline, purposes: draft.purpose, attributes: draft.attributes, author: '张博士', organization: '北京能源材料研究院', visibility: draft.visibility, status: '已发布', publishedAt: '2026-09-21', updatedAt: '2026-09-21', downloads: 0, views: 0, favorites: 0, usage: 0, files: draft.files.map((file) => ({ name: file.name, type: file.name.split('.').pop()?.toUpperCase() ?? 'FILE', size: file.size, updatedAt: '2026-09-21 12:00', description: '用户上传文件' })) };
    onPublished(item); onToast('科研资产已发布，可在“我的资产”中继续管理。'); router.push('/assets/mine');
  };
  const stepContent = () => {
    if (step === 0) return <><h2>选择要上传的资产类型</h2><div className={styles.typeSelector}>{assetCategories.map((item) => { const Icon = categoryIcons[item.key]; return <button key={item.key} className={cn(styles.typeOption, draft.category === item.key && styles.typeOptionActive)} onClick={() => update('category', item.key)} aria-pressed={draft.category === item.key}><span className={cn(styles.quickIcon, styles[item.color])}><Icon size={17} /></span><span><strong>{item.label}</strong><small>{item.description}</small></span></button>; })}</div>{errors.category ? <p className={styles.errorText}>{errors.category}</p> : null}</>;
    if (step === 1) return <><h2>{config?.label}·基本信息</h2><div className={styles.formGrid}><div className={cn(styles.field, styles.fieldFull)}><label htmlFor="asset-name"><span className={styles.required}>*</span> 资产名称</label><input id="asset-name" className={styles.input} value={draft.name} onChange={(event) => update('name', event.target.value)} maxLength={120} />{errors.name ? <span className={styles.errorText} role="alert">{errors.name}</span> : null}</div><div className={cn(styles.field, styles.fieldFull)}><label htmlFor="asset-summary"><span className={styles.required}>*</span> 简介</label><textarea id="asset-summary" className={styles.textarea} value={draft.summary} onChange={(event) => update('summary', event.target.value)} maxLength={300} /><span className={styles.helper}><span>建议 100—300 字，说明资产内容和用途</span><span>{draft.summary.length}/300</span></span>{errors.summary ? <span className={styles.errorText} role="alert">{errors.summary}</span> : null}</div><div className={cn(styles.field, styles.fieldFull)}><label htmlFor="asset-description">详细说明</label><textarea id="asset-description" className={styles.textarea} value={draft.description} onChange={(event) => update('description', event.target.value)} placeholder="支持 Markdown 结构的内容说明" /></div><div className={styles.field}><label htmlFor="asset-version"><span className={styles.required}>*</span> 版本</label><input id="asset-version" className={styles.input} value={draft.version} onChange={(event) => update('version', event.target.value)} />{errors.version ? <span className={styles.errorText}>{errors.version}</span> : null}</div><div className={styles.field}><span className={styles.fieldLabel}>上传者 / 所属单位</span><div className={styles.input} style={{ background: '#f8fafc' }}>张博士 · 北京能源材料研究院</div></div></div></>;
    if (step === 2) return <><h2>{config?.label}·上传文件或配置</h2><label className={styles.dropzone}><input type="file" multiple hidden onChange={addFiles} /><span><CloudUpload size={30} color="#b4232d" /><h3>点击或拖放文件到此处上传</h3><p>支持多文件、文件夹和常用科研格式；单文件建议不超过 10GB</p><span className={styles.secondaryButton}><FolderOpen size={14} />选择文件</span></span></label><button className={styles.ghostButton} onClick={() => update('files', [...draft.files, { name: config?.key === 'model' ? 'model.safetensors' : 'README.md', size: config?.key === 'model' ? '1.2 GB' : '12 KB', progress: 100 }])}><Plus size={13} />添加示例文件</button>{errors.files ? <p className={styles.errorText} role="alert">{errors.files}</p> : null}<div className={styles.fileQueue}>{draft.files.map((file, index) => <div className={styles.fileQueueItem} key={`${file.name}-${index}`}><File size={16} color="#2878d0" /><div><strong>{file.name}</strong><small>{file.size} · {file.error ? '上传失败' : '上传完成'}</small><div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${file.progress}%`, background: file.error ? '#c62828' : undefined }} /></div></div><button className={styles.iconButton} aria-label={`移除 ${file.name}`} onClick={() => update('files', draft.files.filter((_, fileIndex) => fileIndex !== index))}><Trash2 size={14} /></button></div>)}</div></>;
    if (step === 3) return <><h2>{config?.label}·科研分类与标签</h2><div className={styles.stack}><div className={styles.field}><span className={styles.fieldLabel}><span className={styles.required}>*</span> 学科领域</span><div className={styles.choiceGrid}>{disciplines.map((value) => <button key={value} className={cn(styles.choice, draft.discipline.includes(value) && styles.choiceActive)} onClick={() => update('discipline', toggleValue(value, draft.discipline))}>{value}</button>)}</div>{errors.discipline ? <span className={styles.errorText}>{errors.discipline}</span> : null}</div><div className={styles.field}><span className={styles.fieldLabel}><span className={styles.required}>*</span> 学术用途</span><div className={styles.choiceGrid}>{purposes.map((value) => <button key={value} className={cn(styles.choice, draft.purpose.includes(value) && styles.choiceActive)} onClick={() => update('purpose', toggleValue(value, draft.purpose))}>{value}</button>)}</div>{errors.purpose ? <span className={styles.errorText}>{errors.purpose}</span> : null}</div><div className={styles.field}><span className={styles.fieldLabel}><span className={styles.required}>*</span> 资产属性</span><div className={styles.choiceGrid}>{(typeAttributes.length ? typeAttributes : ['通用资产', '可下载', '可复用']).map((value) => <button key={value} className={cn(styles.choice, draft.attributes.includes(value) && styles.choiceActive)} onClick={() => update('attributes', toggleValue(value, draft.attributes))}>{value}</button>)}</div>{errors.attributes ? <span className={styles.errorText}>{errors.attributes}</span> : null}</div></div></>;
    if (step === 4) return <><h2>{config?.label}·发布设置</h2><div className={styles.radioList}>{[<><Globe2 size={16} /><span><strong>平台内公开</strong><small>平台内用户可检索、查看并按说明获取。</small></span></>, <><LockKeyhole size={16} /><span><strong>仅自己可见</strong><small>仅当前用户可查看和管理。</small></span></>, <><Users size={16} /><span><strong>指定用户可见</strong><small>发布后可继续维护可访问用户列表。</small></span></>].map((content, index) => { const value = ['平台内公开', '仅自己可见', '指定用户可见'][index] as AssetVisibility; return <label className={styles.radioOption} key={value}><input type="radio" name="visibility" checked={draft.visibility === value} onChange={() => update('visibility', value)} />{content}</label>; })}</div><div className={styles.callout} style={{ marginTop: 14 }}><Info size={15} /><span>本版本不引入课题权限。收藏不会改变资产的可见范围。</span></div></>;
    return <><h2>预览并发布</h2><div className={styles.infoGrid}><div className={styles.infoBlock}><strong>资产</strong><p>{draft.name}<br />{config?.label} · {draft.version}</p></div><div className={styles.infoBlock}><strong>文件</strong><p>{draft.files.length} 个文件<br />{draft.files.map((file) => file.name).join('、')}</p></div><div className={styles.infoBlock}><strong>可见范围</strong><p>{draft.visibility}<br />上传者：张博士</p></div></div><div className={styles.contentCard} style={{ marginTop: 14 }}><div className={styles.contentCardHeader}><h2>{draft.name}</h2><span className={styles.statusTag}><CheckCircle2 size={11} />待发布</span></div><div className={styles.contentCardBody}><p>{draft.summary}</p><div className={styles.tagRow}>{[...draft.discipline, ...draft.purpose, ...draft.attributes].map((value) => <span key={value} className={styles.tag}>{value}</span>)}</div></div></div></>;
  };
  const checks = [Boolean(draft.category), Boolean(draft.name && draft.summary.length >= 100 && draft.version), draft.files.length > 0, draft.discipline.length > 0 && draft.purpose.length > 0 && draft.attributes.length > 0, Boolean(draft.visibility)];
  return <div className={styles.stack}><HubNav /><PageHeader title="上传科研资产" description="用统一步骤发布数据、模型、方案与智能服务。" actions={<button className={styles.secondaryButton} onClick={saveDraft}><Save size={15} />保存草稿</button>} /><ol className={styles.steps}>{uploadSteps.map((label, index) => <li key={label} className={cn(styles.step, index === step && styles.stepActive, index < step && styles.stepDone)}><span className={styles.stepNumber}>{index < step ? <Check size={14} /> : index + 1}</span><span className={styles.stepText}><strong>{label}</strong><small>{index === step ? '当前步骤' : index < step ? '已完成' : '待填写'}</small></span></li>)}</ol><div className={styles.uploadLayout}><main className={styles.formCard}>{stepContent()}<div className={styles.formFooter}><button className={styles.secondaryButton} onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}><ArrowLeft size={14} />上一步</button><div className={styles.formFooterActions}><button className={styles.secondaryButton} onClick={saveDraft}><Save size={14} />保存草稿</button>{step < 5 ? <button className={styles.primaryButton} onClick={nextStep}>下一步<ArrowRight size={14} /></button> : <button className={styles.primaryButton} onClick={publish}><Upload size={14} />确认并发布</button>}</div></div></main><aside className={styles.asideStack}><div className={styles.asideCard}><div className={styles.asideTitle}><strong><Info size={15} style={{ display: 'inline', color: '#2878d0', marginRight: 6 }} />上传说明</strong></div><div className={styles.guideList}>{['确保拥有文件的合法使用和发布权限。', '简介用于广场搜索与判断，详细说明用于详情页。', '根据资产类型上传文件、配置、示例或环境说明。', '发布后可以在我的资产中发布新版本或下架。'].map((text, index) => <div className={styles.guideItem} key={text}><span>{index + 1}</span><span>{text}</span></div>)}</div></div><div className={styles.asideCard}><div className={styles.asideTitle}><strong><CheckCircle2 size={15} style={{ display: 'inline', color: '#168b68', marginRight: 6 }} />发布前检查</strong></div><div className={styles.checkList}>{['已选择资产类型', '基本信息完整', '已添加文件/配置', '已选学科、用途和属性', '已设置可见范围'].map((label, index) => <div className={cn(styles.checkItem, checks[index] && styles.checkOk)} key={label}>{checks[index] ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}<span>{label}</span></div>)}</div></div></aside></div></div>;
}

function MinePage({ ownedAssets, setOwnedAssets, drafts, favoriteAssets, onToast }: { ownedAssets: AssetRecord[]; setOwnedAssets: (records: AssetRecord[]) => void; drafts: UploadDraft[]; favoriteAssets: AssetRecord[]; onToast: (message: string) => void }) {
  const [tab, setTab] = useState<'uploaded' | 'drafts' | 'published' | 'favorites'>('uploaded');
  const [query, setQuery] = useState('');
  const tabs = [
    { key: 'uploaded', label: '我上传的', count: ownedAssets.length },
    { key: 'drafts', label: '草稿', count: drafts.length + ownedAssets.filter((item) => item.status === '草稿').length },
    { key: 'published', label: '已发布', count: ownedAssets.filter((item) => item.status === '已发布').length },
    { key: 'favorites', label: '我收藏的', count: favoriteAssets.length },
  ] as const;
  const rows = tab === 'favorites' ? favoriteAssets : tab === 'published' ? ownedAssets.filter((item) => item.status === '已发布') : tab === 'drafts' ? ownedAssets.filter((item) => item.status === '草稿') : ownedAssets;
  const visible = rows.filter((item) => `${item.name} ${item.id}`.toLowerCase().includes(query.toLowerCase()));
  const changeStatus = (id: string, status: AssetStatus) => { setOwnedAssets(ownedAssets.map((item) => item.id === id ? { ...item, status } : item)); onToast(status === '已下架' ? '资产已下架，广场不再展示。' : '资产已发布。'); };
  const changeVisibility = (id: string) => { setOwnedAssets(ownedAssets.map((item) => item.id === id ? { ...item, visibility: item.visibility === '平台内公开' ? '仅自己可见' : '平台内公开' } : item)); onToast('资产可见范围已更新。'); };
  const removeDraft = (id: string) => { if (window.confirm('确定删除这份草稿吗？删除后无法恢复。')) { setOwnedAssets(ownedAssets.filter((item) => item.id !== id)); onToast('草稿已删除。'); } };
  return <div className={styles.stack}><HubNav /><PageHeader title="我的科研资产" description="管理本人上传、发布和收藏的科研资产。" actions={<Link href="/assets/upload" className={styles.primaryButton}><Plus size={15} />上传新资产</Link>} /><div className={styles.searchHero}><SearchBox value={query} onChange={setQuery} placeholder="搜索我的资产名称或编号" /><span className={styles.resultCount}>共 <strong>{visible.length}</strong> 项</span></div><nav className={styles.mineTabs} aria-label="我的科研资产分类">{tabs.map((item) => <button key={item.key} className={cn(styles.mineTab, tab === item.key && styles.mineTabActive)} onClick={() => setTab(item.key)}>{item.label} <span className={styles.tag}>{item.count}</span></button>)}</nav>{tab === 'drafts' && drafts.length ? <div className={styles.callout}><Save size={15} /><span>当前浏览器还有 {drafts.length} 份未转换为资产记录的上传草稿，可从上传入口继续补充。</span></div> : null}{visible.length ? <div className={styles.mineTableWrap}><table className={styles.mineTable}><thead><tr><th>资产名称</th><th>类型</th><th>版本</th><th>状态</th><th>可见范围</th><th>更新时间</th><th>下载/使用</th><th>操作</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><Link href={detailHref(item)} className={styles.assetTitle}>{item.name}</Link><small className={styles.metaLine}>{item.id}</small></td><td>{categoryByKey(item.category).label}</td><td>{item.version}</td><td><span className={cn(styles.statusTag, item.status === '已下架' && styles.warningCallout)}>{item.status}</span></td><td>{item.visibility}</td><td>{item.updatedAt}</td><td>{formatCount(item.downloads)} / {formatCount(item.usage)}</td><td><div className={styles.tableActions}><Link href={detailHref(item)} className={styles.tableAction}>查看</Link>{tab !== 'favorites' ? <><button className={styles.tableAction} onClick={() => onToast('已打开资产编辑草稿。')}>编辑</button><button className={styles.tableAction} onClick={() => onToast('已创建新版本上传草稿。')}>新版本</button><button className={styles.tableAction} onClick={() => changeVisibility(item.id)}>可见范围</button>{item.status === '草稿' ? <><button className={styles.tableAction} onClick={() => changeStatus(item.id, '已发布')}>发布</button><button className={cn(styles.tableAction, styles.tableActionDanger)} onClick={() => removeDraft(item.id)}>删除</button></> : item.status === '已发布' ? <button className={cn(styles.tableAction, styles.tableActionDanger)} onClick={() => changeStatus(item.id, '已下架')}>下架</button> : null}</> : null}</div></td></tr>)}</tbody></table></div> : <div className={styles.empty}><div><span className={styles.emptyIcon}><FolderOpen size={21} /></span><h3>当前分类暂无资产</h3><p>上传并发布资产，或在资产广场收藏后，内容会出现在这里。</p><Link href="/assets/upload" className={styles.primaryButton}><Upload size={14} />上传科研资产</Link></div></div>}</div>;
}

function NotFoundPage() {
  return <div className={styles.stack}><HubNav /><div className={styles.empty}><div><span className={styles.emptyIcon}><AlertCircle size={22} /></span><h3>科研资产页面不存在</h3><p>该资产可能已下架，或历史版本不存在。请返回资产广场重新查找。</p><Link href="/assets" className={styles.primaryButton}><ArrowLeft size={14} />返回科研资产</Link></div></div></div>;
}

export function AssetHub() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = resolveAssetRoute(pathname, searchParams.toString());
  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>('ai4s-asset-favorites-v1', []);
  const [ownedAssets, setOwnedAssets] = usePersistentState<AssetRecord[]>('ai4s-asset-owned-v1', seededOwnedAssets);
  const [drafts, setDrafts] = usePersistentState<UploadDraft[]>('ai4s-asset-upload-drafts-v1', []);
  const [recentIds, setRecentIds] = usePersistentState<string[]>('ai4s-asset-recent-v1', ['RA-MODEL-001', 'RA-DATA-001']);
  const [toast, setToast] = useState('');
  const records = useMemo(() => [...assetRecords, ...ownedAssets.filter((item) => item.status === '已发布' && item.visibility === '平台内公开')], [ownedAssets]);
  const detailSlug = route.kind === 'detail' ? route.slug : '';
  useEffect(() => {
    if (!detailSlug) return;
    const current = [...records, ...ownedAssets].find((item) => item.slug === detailSlug);
    if (current && recentIds[0] !== current.id) setRecentIds([current.id, ...recentIds.filter((id) => id !== current.id)].slice(0, 8));
  }, [detailSlug, ownedAssets, recentIds, records, setRecentIds]);
  const toggleFavorite = (id: string) => { const next = favoriteIds.includes(id) ? favoriteIds.filter((value) => value !== id) : [...favoriteIds, id]; setFavoriteIds(next); setToast(favoriteIds.includes(id) ? '已取消收藏。' : '已收藏，可在“我的资产”查看。'); };
  const recentRecords = recentIds.map((id) => records.find((item) => item.id === id)).filter((item): item is AssetRecord => Boolean(item));
  const requestedSearchCategory = searchParams.get('type');
  const searchCategory = assetCategories.some((item) => item.key === requestedSearchCategory) ? requestedSearchCategory as AssetCategoryKey : 'data';
  let content: ReactNode;
  if (route.kind === 'home') content = <HomePage records={records} recentRecords={recentRecords} />;
  else if (route.kind === 'plaza') content = <PlazaPage key={`${route.category}-${searchParams.toString()}`} initialCategory={route.category} records={records} favoriteIds={favoriteIds} setFavoriteIds={setFavoriteIds} onToast={setToast} />;
  else if (route.kind === 'search') content = <PlazaPage key={`search-${searchParams.toString()}`} initialCategory={searchCategory} records={records} favoriteIds={favoriteIds} setFavoriteIds={setFavoriteIds} searchMode onToast={setToast} />;
  else if (route.kind === 'detail') { const item = [...records, ...ownedAssets].find((record) => record.category === route.category && record.slug === route.slug); content = item ? <><AssetIssueBanner state={searchParams.get('state')} item={item} /><DetailPage item={item} favorite={favoriteIds.includes(item.id)} onFavorite={() => toggleFavorite(item.id)} onToast={setToast} /></> : <NotFoundPage />; }
  else if (route.kind === 'upload') content = <><UploadIssueBanner state={searchParams.get('state')} /><UploadPage initialCategory={route.category} onPublished={(item) => setOwnedAssets([...ownedAssets, item])} drafts={drafts} setDrafts={setDrafts} onToast={setToast} /></>;
  else if (route.kind === 'mine') content = <MinePage ownedAssets={ownedAssets} setOwnedAssets={setOwnedAssets} drafts={drafts} favoriteAssets={records.filter((item) => favoriteIds.includes(item.id))} onToast={setToast} />;
  else content = <NotFoundPage />;
  return <div className={styles.hub}>{content}{toast ? <Toast message={toast} onClose={() => setToast('')} /> : null}</div>;
}
