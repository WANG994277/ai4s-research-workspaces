'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowUp,
  Folder,
  ClipboardCheck,
  Settings,
  FlaskConical,
  FileText,
  ChevronRight,
  LayoutGrid,
  BookOpen,
  Calculator,
  Database,
  Cpu,
  Lightbulb,
  AlertTriangle,
  Activity,
  Beaker,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═════════════════════════════════════════
   科研助手全局唤起
   ═════════════════════════════════════════ */
function openAssistant(message?: string) {
  window.dispatchEvent(
    new CustomEvent('petrolab:open-assistant', { detail: { message } })
  );
}

/* ═════════════════════════════════════════
   环形图（纯 SVG）
   ═════════════════════════════════════════ */
function Donut({
  pct,
  color,
  size = 64,
  stroke = 7,
  center,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
  center: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const filled = c * Math.min(Math.max(pct, 0), 1);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eef7" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${filled} ${c - filled}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{center}</div>
    </div>
  );
}

/* ═════════════════════════════════════════
   数据
   ═════════════════════════════════════════ */
const bannerChips = [
  '分析这组实验数据的结论',
  '帮我制定实验计划',
  '文献调研：CCUS最新进展',
  '生成实验报告初稿',
  '推荐合适的计算资源',
  '帮我设计实验方案',
];

const statCards = [
  { icon: Folder, tint: 'bg-blue/10 text-blue', title: '进行中课题', tag: '较上周 +1', tagCls: 'bg-red/10 text-red', num: 5, detail: '2 项本周有关键节点', href: '/collaboration/projects' },
  { icon: ClipboardCheck, tint: 'bg-amber/10 text-amber', title: '待办任务', tag: '较上周 -2', tagCls: 'bg-success/10 text-success', num: 6, detail: '1 项已超期', detailCls: 'text-red', href: '/tasks' },
  { icon: Settings, tint: 'bg-success/10 text-success', title: '运行计算', tag: '较上周 +3', tagCls: 'bg-red/10 text-red', num: 2, detail: '最长已运行 5 h', href: '/compute-tasks' },
  { icon: FlaskConical, tint: 'bg-purple/10 text-purple', title: '进行中实验', tag: '较上周 +1', tagCls: 'bg-red/10 text-red', num: 3, detail: '1 项待确认', detailCls: 'text-red', href: '/experiments' },
  { icon: FileText, tint: 'bg-blue/10 text-blue', title: '科研成果', tag: '较上周 +2', tagCls: 'bg-red/10 text-red', num: 12, detail: '本月新增 2 项', href: '/assets/data-knowledge?category=outcome' },
];

const researchZones = [
  { char: '读', color: 'text-blue', icon: BookOpen, tile: 'bg-blue/10 text-blue', subtitle: '知识与情报', links: [
    { label: '文献与标准检索', href: '/literature-search' },
    { label: '科研文献整理与研读', href: '/literature-search/1' },
    { label: '全网专利分析', href: '/patent-analysis' },
  ] },
  { char: '算', color: 'text-cyan', icon: Calculator, tile: 'bg-cyan/10 text-cyan', subtitle: '计算与仿真', links: [
    { label: '科研计算求解', href: '/compute-space' },
    { label: '智能计算模拟任务', href: '/compute-tasks' },
    { label: '智能设计与筛选', href: '/compute-space/design' },
  ] },
  { char: '做', color: 'text-success', icon: FlaskConical, tile: 'bg-success/10 text-success', subtitle: '实验与执行', links: [
    { label: '实验方案设计', href: '/experiment-design' },
    { label: '实验管理', href: '/experiments' },
    { label: '实验设备纳管与共享', href: '/lab-resources' },
  ] },
  { char: '资', color: 'text-primary', icon: Database, tile: 'bg-primary/10 text-primary', subtitle: '数据与资产', links: [
    { label: '科研数据及知识', href: '/assets/data-knowledge' },
    { label: '科研模型', href: '/assets/models' },
    { label: '科研方案', href: '/assets/plans' },
  ] },
];

type RecCategory = 'know' | 'decide' | 'suggest';
interface Recommendation {
  id: number;
  icon: React.ElementType;
  tile: string;
  title: string;
  tag: string;
  tagCls: string;
  tagIcon?: React.ElementType;
  category: RecCategory;
  desc: string;
  time: string;
  action: string;
  href?: string;
}

const initialRecommendations: Recommendation[] = [
  { id: 1, icon: FlaskConical, tile: 'bg-purple/10 text-purple', title: '实验结果异动提醒', tag: '需要决策', tagCls: 'bg-red/10 text-red border border-red/20', tagIcon: AlertTriangle, category: 'decide', desc: '实验 GB-2026-0915 的催化活性数据均值下降 35%，建议检查反应温度控制系统。', time: '今天 09:20', action: '查看详情', href: '/experiments' },
  { id: 2, icon: Cpu, tile: 'bg-blue/10 text-blue', title: '计算任务已完成', tag: '仅需知悉', tagCls: 'bg-surface-2 text-muted-foreground border border-line', category: 'know', desc: 'VASP 电子结构计算（任务 #1024）已完成，共生成 12 个结果文件。', time: '今天 08:50', action: '查看结果', href: '/compute-tasks' },
  { id: 3, icon: FileText, tile: 'bg-primary/10 text-primary', title: '相关文献推荐', tag: '仅需知悉', tagCls: 'bg-primary/10 text-primary border border-primary/20', category: 'know', desc: '基于你的研究方向，发现 5 篇高度相关文献，已加入「待阅读」。', time: '今天 08:30', action: '查看文献', href: '/literature-search' },
  { id: 4, icon: ClipboardCheck, tile: 'bg-amber/10 text-amber', title: '课题里程碑即将到期', tag: '需要决策', tagCls: 'bg-red/10 text-red border border-red/20', tagIcon: AlertTriangle, category: 'decide', desc: '课题《CO₂ 加氢制甲醇催化剂研究》下一节点（中期评审材料）3 天后到期。', time: '昨天 18:40', action: '去处理', href: '/collaboration/projects' },
  { id: 5, icon: Lightbulb, tile: 'bg-cyan/10 text-cyan', title: '智能体建议：优化实验方案', tag: '建议操作', tagCls: 'bg-cyan/10 text-cyan border border-cyan/20', tagIcon: Lightbulb, category: 'suggest', desc: '基于历史数据分析，建议将反应温度从 200 °C 调整至 220 °C，预计可提升转化率 12%。', time: '昨天 16:20', action: '查看建议', href: '/experiment-design' },
];

const activityTabs: { label: string; items: { time: string; icon: React.ElementType; tile: string; title: string; desc: string; badge: string; badgeCls: string }[] }[] = [
  {
    label: '项目动态',
    items: [
      { time: '10:30', icon: Cpu, tile: 'bg-primary/10 text-primary', title: '实验数据已同步', desc: '实验 GB-2026-0915 数据已同步至 ELN', badge: '成功', badgeCls: 'bg-success/10 text-success' },
      { time: '09:41', icon: FlaskConical, tile: 'bg-success/10 text-success', title: '计算任务开始运行', desc: 'GROMACS 分子动力学模拟（任务 #1025）', badge: '运行中', badgeCls: 'bg-primary/10 text-primary' },
      { time: '09:15', icon: Database, tile: 'bg-primary/10 text-primary', title: '新文献已加入知识库', desc: '《Nature Catalysis》最新文献已收录', badge: '成功', badgeCls: 'bg-success/10 text-success' },
      { time: '昨天 18:20', icon: ClipboardCheck, tile: 'bg-amber/10 text-amber', title: '课题进展更新', desc: '《功能性 PE 配方优化》已更新周报', badge: '更新', badgeCls: 'bg-amber/10 text-amber' },
      { time: '昨天 16:05', icon: Beaker, tile: 'bg-purple/10 text-purple', title: '实验预约成功', desc: '预约 9 月 17 日 10:00-12:00 普通仪器', badge: '成功', badgeCls: 'bg-success/10 text-success' },
    ],
  },
  {
    label: '实验动态',
    items: [
      { time: '11:20', icon: Beaker, tile: 'bg-purple/10 text-purple', title: '反应温度达到设定值', desc: 'GB-2026-0915 加氢反应进入恒温阶段', badge: '运行中', badgeCls: 'bg-primary/10 text-primary' },
      { time: '10:30', icon: Cpu, tile: 'bg-primary/10 text-primary', title: '实验数据已同步', desc: 'GB-2026-0915 数据已同步至 ELN', badge: '成功', badgeCls: 'bg-success/10 text-success' },
      { time: '昨天 17:45', icon: FlaskConical, tile: 'bg-success/10 text-success', title: '催化剂活性测试完成', desc: '第 3 组平行实验完成，数据待分析', badge: '成功', badgeCls: 'bg-success/10 text-success' },
      { time: '昨天 14:10', icon: ClipboardCheck, tile: 'bg-amber/10 text-amber', title: '实验方案待确认', desc: '下一轮正交实验方案已生成，等待确认', badge: '待确认', badgeCls: 'bg-amber/10 text-amber' },
      { time: '周一 09:00', icon: Database, tile: 'bg-primary/10 text-primary', title: '设备预约变更', desc: '固定床反应器预约调整至周三', badge: '更新', badgeCls: 'bg-amber/10 text-amber' },
    ],
  },
  {
    label: '计算动态',
    items: [
      { time: '09:41', icon: FlaskConical, tile: 'bg-success/10 text-success', title: '计算任务开始运行', desc: 'GROMACS 分子动力学模拟（任务 #1025）', badge: '运行中', badgeCls: 'bg-primary/10 text-primary' },
      { time: '08:50', icon: Cpu, tile: 'bg-primary/10 text-primary', title: '计算任务已完成', desc: 'VASP 电子结构计算（任务 #1024）生成 12 个结果文件', badge: '成功', badgeCls: 'bg-success/10 text-success' },
      { time: '08:12', icon: AlertTriangle, tile: 'bg-red/10 text-red', title: '计算任务失败', desc: 'DFT-2839 因内存不足中断，建议降低 k 点密度', badge: '失败', badgeCls: 'bg-red/10 text-red' },
      { time: '昨天 22:30', icon: Cpu, tile: 'bg-amber/10 text-amber', title: '排队任务已调度', desc: 'MC-2841 蒙特卡洛任务进入运行队列', badge: '更新', badgeCls: 'bg-amber/10 text-amber' },
      { time: '昨天 18:05', icon: FileText, tile: 'bg-primary/10 text-primary', title: '计算报告已生成', desc: 'QC-2831 基础油黏温特性分析报告', badge: '成功', badgeCls: 'bg-success/10 text-success' },
    ],
  },
  {
    label: '成果动态',
    items: [
      { time: '昨天 20:15', icon: FileText, tile: 'bg-primary/10 text-primary', title: '论文初稿已生成', desc: '《CO₂ 加氢催化剂综述》初稿完成，待审阅', badge: '更新', badgeCls: 'bg-amber/10 text-amber' },
      { time: '昨天 16:40', icon: ClipboardCheck, tile: 'bg-amber/10 text-amber', title: '成果待归档', desc: '2 项实验成果待归档至成果库', badge: '待确认', badgeCls: 'bg-amber/10 text-amber' },
      { time: '周一 15:30', icon: FileText, tile: 'bg-primary/10 text-primary', title: '专利草案已更新', desc: '「催化剂制备方法」权利要求书 v2', badge: '成功', badgeCls: 'bg-success/10 text-success' },
      { time: '周一 10:20', icon: Database, tile: 'bg-primary/10 text-primary', title: '数据集已发布', desc: 'CuZnO_001 计算数据集已共享至团队', badge: '成功', badgeCls: 'bg-success/10 text-success' },
    ],
  },
];

interface LegendRow { num: string; numCls: string; label: string }
const overviewCards: {
  icon: React.ElementType;
  tile: string;
  title: string;
  donut?: { pct: number; color: string; center: string };
  bigNum?: string;
  bars?: number[];
  legend: LegendRow[];
}[] = [
  { icon: BookOpen, tile: 'bg-primary/10 text-primary', title: '课题进展', donut: { pct: 0.68, color: '#1d5fd6', center: '68%' }, legend: [
    { num: '5', numCls: 'text-primary', label: '进行中' },
    { num: '2', numCls: 'text-amber', label: '本周关键节点' },
    { num: '3', numCls: 'text-red', label: '逾期风险' },
  ] },
  { icon: Cpu, tile: 'bg-purple/10 text-purple', title: '计算任务', donut: { pct: 0.62, color: '#7c5ce0', center: '62%' }, legend: [
    { num: '2', numCls: 'text-primary', label: '进行中' },
    { num: '1', numCls: 'text-amber', label: '排队中' },
    { num: '5', numCls: 'text-success', label: '本月完成' },
  ] },
  { icon: FlaskConical, tile: 'bg-success/10 text-success', title: '实验运行', donut: { pct: 0.88, color: '#17a56a', center: '12' }, legend: [
    { num: '3', numCls: 'text-primary', label: '进行中' },
    { num: '1', numCls: 'text-amber', label: '待确认' },
    { num: '', numCls: '', label: '本周完成 12 次' },
  ] },
  { icon: FileText, tile: 'bg-primary/10 text-primary', title: '科研成果', bigNum: '12', bars: [10, 16, 12, 20, 14, 22], legend: [
    { num: '12', numCls: 'text-navy', label: '项成果' },
    { num: '2', numCls: 'text-success', label: '本月新增' },
  ] },
  { icon: AlertTriangle, tile: 'bg-red/10 text-red', title: '风险提醒', donut: { pct: 0.3, color: '#ef4444', center: '3' }, legend: [
    { num: '1', numCls: 'text-red', label: '实验异常' },
    { num: '1', numCls: 'text-amber', label: '课题逾期' },
    { num: '1', numCls: 'text-primary', label: '资源不足' },
  ] },
];

/* ═════════════════════════════════════════
   页面
   ═════════════════════════════════════════ */
function WorkbenchPage() {
  const [query, setQuery] = useState('');
  const [deepThink, setDeepThink] = useState(false);
  const [recTab, setRecTab] = useState<'all' | RecCategory>('all');
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [activityTab, setActivityTab] = useState(0);

  useEffect(() => {
    try {
      const readIds: number[] = JSON.parse(localStorage.getItem('ai4s-read-recommendations') ?? '[]');
      setRecommendations(initialRecommendations.filter((item) => !readIds.includes(item.id)));
    } catch {
      localStorage.removeItem('ai4s-read-recommendations');
    }
  }, []);

  const handleBannerSend = useCallback(() => {
    const text = query.trim();
    openAssistant(text || undefined);
    setQuery('');
  }, [query]);

  const markRead = useCallback((id: number) => {
    try {
      const readIds: number[] = JSON.parse(localStorage.getItem('ai4s-read-recommendations') ?? '[]');
      localStorage.setItem('ai4s-read-recommendations', JSON.stringify([...new Set([...readIds, id])]));
    } catch {
      localStorage.setItem('ai4s-read-recommendations', JSON.stringify([id]));
    }
    setRecommendations((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const tabDefs: { key: 'all' | RecCategory; label: string }[] = useMemo(() => {
    const count = (cat: RecCategory) => recommendations.filter((r) => r.category === cat).length;
    return [
      { key: 'all', label: `全部 (${recommendations.length})` },
      { key: 'know', label: `仅需知悉 (${count('know')})` },
      { key: 'decide', label: `需要决策 (${count('decide')})` },
      { key: 'suggest', label: `建议操作 (${count('suggest')})` },
    ];
  }, [recommendations]);

  const visibleRecs = useMemo(
    () => (recTab === 'all' ? recommendations : recommendations.filter((r) => r.category === recTab)),
    [recommendations, recTab]
  );

  return (
    <div className="space-y-4">
      {/* ═══ Banner：AI 科研助手 ═══ */}
      <section
        className="relative overflow-hidden rounded-xl"
        style={{ background: 'linear-gradient(100deg, #0a2c66 0%, #10408f 48%, #1e63d6 100%)' }}
      >
        {/* 机器人吉祥物：按参考图保持完整姿态，沿横幅高度等比展示 */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-[3%] z-0 w-[42%] bg-no-repeat"
          style={{
            backgroundImage: 'url(/robot-banner-reference.png)',
            backgroundPosition: 'right center',
            backgroundSize: 'auto 100%',
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%, black 82%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%, black 82%, transparent 100%)',
          }}
        />
        {/* 右上角标语 */}
        <div className="absolute right-6 top-5 z-10 text-right text-[10px] font-bold leading-relaxed tracking-[0.2em] text-white/70">
          AI FOR A BETTER
          <br />
          SCIENTIFIC FUTURE
        </div>
        {/* 右下角手写体 */}
        <div
          className="absolute bottom-4 right-6 z-10 text-2xl font-bold italic text-white/90"
          style={{ fontFamily: "'Kaiti SC', 'STKaiti', 'KaiTi', serif", transform: 'rotate(-2deg)' }}
        >
          让科研更简单
        </div>

        <div className="relative z-10 w-full p-6 lg:max-w-[72%] 2xl:max-w-[62%]">
          <h1 className="text-2xl font-black text-white">你好，张博士</h1>
          <p className="mt-1.5 text-sm text-white/80">
            我是你的 AI 科研助手，随时为你提供科研灵感、任务规划和实验分析支持。
          </p>

          {/* 输入框 */}
          <div className="mt-4 flex h-12 items-center gap-2 rounded-full bg-white pr-1.5 pl-4 shadow-[0_8px_24px_rgba(10,40,100,0.25)]">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBannerSend()}
              placeholder="请描述你的科研问题，例如：帮我分析这组实验数据的结论"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
            />
            <button
              onClick={() => setDeepThink((v) => !v)}
              className={cn(
                'flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition-colors',
                deepThink ? 'bg-primary/10 text-primary' : 'text-primary hover:bg-primary/5'
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              深度思考
            </button>
            <button
              onClick={handleBannerSend}
              aria-label="发送"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary/90"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>

          {/* 快捷指令 */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/60">你可以试着问我：</span>
            {bannerChips.map((chip) => (
              <button
                key={chip}
                onClick={() => openAssistant(chip)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white/90 transition-colors hover:bg-white/20"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 统计卡 ═══ */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link href={card.href}
              key={card.title}
              className="group rounded-lg border border-line bg-white p-3 transition-colors hover:border-primary/40 hover:bg-[#FFF7F7] focus-visible:outline-2 focus-visible:outline-primary"
            >
              <div className="flex items-start gap-2">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', card.tint)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <span className="whitespace-nowrap text-[12px] font-bold text-navy">{card.title}</span>
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold', card.tagCls)}>
                      {card.tag}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span className="text-2xl font-black text-navy">{card.num}</span>
                    <span className="text-xs text-faint">项</span>
                  </div>
                </div>
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint transition-colors group-hover:text-primary" />
              </div>
              <div className={cn('mt-2 text-xs', card.detailCls ?? 'text-muted-foreground')}>{card.detail}</div>
            </Link>
          );
        })}
      </section>

      {/* ═══ 科研专区 ═══ */}
      <section id="research-zone" className="rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-primary" />
            <h2 className="text-[15px] font-bold text-navy">科研专区</h2>
          </div>
          <Link href="/read-space" className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary">
            进入全部功能
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {researchZones.map((zone) => {
            const Icon = zone.icon;
            return (
              <div key={zone.char} className="rounded-lg border border-line bg-surface-2/40 p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm', zone.tile)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn('text-xl font-black', zone.color)}>{zone.char}</span>
                      <span className="text-xs text-muted-foreground">{zone.subtitle}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-faint" />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line/70 pt-2.5">
                  {zone.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ AI 为你推荐 + 科研活动 ═══ */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* AI 为你推荐 */}
        <div id="todo" className="rounded-lg border border-line bg-white p-4 xl:col-span-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-[15px] font-bold text-navy">AI 为你推荐</h2>
            </div>
            <button onClick={() => setRecTab('all')} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary">
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 筛选 Tab */}
          <div className="mt-3 flex items-center gap-2">
            {tabDefs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRecTab(tab.key)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  recTab === tab.key
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'text-muted-foreground hover:bg-surface-2'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 推荐列表 */}
          <div className="mt-2 divide-y divide-line/70">
            {visibleRecs.length === 0 && (
              <div className="py-10 text-center text-xs text-faint">暂无新的推荐，全部内容已处理</div>
            )}
            {visibleRecs.map((rec) => {
              const Icon = rec.icon;
              const TagIcon = rec.tagIcon;
              return (
                <div key={rec.id} className="flex items-start gap-3 py-3">
                  <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', rec.tile)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-navy">{rec.title}</span>
                      <span className={cn('inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold', rec.tagCls)}>
                        {TagIcon && <TagIcon className="h-3 w-3" />}
                        {rec.tag}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{rec.desc}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[11px] text-faint">{rec.time}</span>
                    {rec.href ? (
                      <Link
                        href={rec.href}
                        className="rounded-md border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                      >
                        {rec.action}
                      </Link>
                    ) : (
                      <button
                        onClick={() => openAssistant(rec.desc)}
                        className="rounded-md border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
                      >
                        {rec.action}
                      </button>
                    )}
                    <button
                      onClick={() => markRead(rec.id)}
                      className="rounded-md border border-line px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-2"
                    >
                      标记已读
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 科研活动 */}
        <div id="activity" className="rounded-lg border border-line bg-white p-4 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-[15px] font-bold text-navy">科研活动</h2>
            </div>
            <button onClick={() => setActivityTab(0)} className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary">
              查看全部
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-1.5">
            {activityTabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActivityTab(i)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs transition-colors',
                  activityTab === i
                    ? 'bg-primary font-bold text-white'
                    : 'bg-surface-2 text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-2">
            {activityTabs[activityTab].items.map((item, idx) => {
              const Icon = item.icon;
              const isLast = idx === activityTabs[activityTab].items.length - 1;
              return (
                <div key={`${activityTab}-${idx}`} className="relative flex gap-3 pb-4">
                  {/* 时间 */}
                  <div className="w-14 shrink-0 pt-0.5 text-right text-[11px] leading-4 text-faint">
                    {item.time}
                  </div>
                  {/* 时间线 */}
                  <div className="relative flex w-4 shrink-0 justify-center">
                    {!isLast && <div className="absolute top-6 bottom-0 w-px bg-line" />}
                    <div className="z-10 mt-1.5 h-2 w-2 rounded-full border-2 border-primary bg-white" />
                  </div>
                  {/* 内容 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', item.tile)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="truncate text-[13px] font-bold text-navy">{item.title}</span>
                      <span className={cn('ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold', item.badgeCls)}>
                        {item.badge}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 pl-9 text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ 科研概览 ═══ */}
      <section className="rounded-lg border border-line bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-[15px] font-bold text-navy">科研概览</h2>
          <Link href="/dashboard" className="ml-auto flex items-center text-xs text-muted-foreground hover:text-primary">进入科研驾驶舱 <ChevronRight className="size-3.5" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/40 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white shadow-sm', card.tile)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate text-[13px] font-bold text-navy">{card.title}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {card.legend.map((row) => (
                      <div key={row.label} className="flex items-center gap-1.5 text-xs">
                        {row.num && <span className={cn('font-black', row.numCls)}>{row.num}</span>}
                        <span className="text-muted-foreground">{row.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {card.donut && (
                  <Donut pct={card.donut.pct} color={card.donut.color} center={
                    <span className="text-sm font-black text-navy">{card.donut.center}</span>
                  } />
                )}
                {card.bigNum && card.bars && (
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-navy">{card.bigNum}</span>
                    <div className="flex h-8 items-end gap-1">
                      {card.bars.map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-sm bg-primary"
                          style={{ height: h, opacity: 0.45 + (i / card.bars!.length) * 0.55 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default WorkbenchPage;
