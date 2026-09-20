'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { FileCheck2, Download, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLocalState } from '@/components/research/workspace-kit';
import { downloadText } from './ui';
import source from './prd-source.json';

export function ReadRequirementTools() {
  const path=usePathname(); const [open,setOpen]=useState(false); const [edits,setEdits]=useLocalState<Record<string,string>>('ai4s-read-prd-edits',{});
  const id=path.endsWith('/agent')?'7':path.endsWith('/tasks')?'15':path.endsWith('/handoff')?'17':path.endsWith('/data-extract')?'12':path==='/literature-search'?'8':path.startsWith('/literature-search/')?'9':path==='/standards-benchmark'?'10':path==='/patent-analysis'?'11':path==='/research-writing'?'13':path==='/knowledge-graph'?'14':'6';
  const section=source.sections.find(s=>s.id===id)!;
  const text=edits[id]??section.content;
  const exportFull=()=>downloadText('AI4S_读空间_PRD_评审版.md',`${source.preamble}\n\n来源：${source.source}\n\n${source.sections.map(s=>edits[s.id]??s.content).join('\n\n')}`);
  return <><footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-4 text-[11px] text-slate-400"><span>原型评审 · 依据 PRD V1.0</span><div className="flex items-center gap-4"><button onClick={()=>setOpen(true)} className="inline-flex items-center gap-1"><FileCheck2 size={12}/>本页需求</button><button onClick={()=>downloadText(`读空间-${section.title}.md`,`${text}\n\n页面：${path}\n设计系统：白底、浅灰层级、朱丹红关键操作；前端 Mock 模拟，状态本地持久化。`)} className="inline-flex items-center gap-1"><Download size={12}/>导出本页</button><button onClick={exportFull}>完整 PRD</button></div></footer><Dialog open={open} onOpenChange={setOpen}><DialogContent className="!flex !flex-col !left-auto !right-0 !top-0 !h-dvh !max-h-none !w-[min(620px,100vw)] !translate-x-0 !translate-y-0 !rounded-none bg-white sm:!max-w-none"><DialogHeader><DialogTitle>{section.title}</DialogTitle><DialogDescription>{source.source} · 第 {id} 章 · 对应当前页面 {path}</DialogDescription></DialogHeader><p className="text-xs text-muted-foreground">可编辑评审用需求副本；保存与导出使用当前文本，不会改写原始 PRD。</p><textarea aria-label="编辑本页PRD" className="min-h-0 w-full flex-1 resize-none rounded border border-slate-200 p-4 text-sm leading-7 outline-none" value={text} onChange={e=>setEdits(old=>({...old,[id]:e.target.value}))}/><div className="flex flex-wrap items-center gap-3"><button className="research-primary" onClick={()=>{localStorage.setItem('ai4s-read-prd-edits',JSON.stringify({...edits,[id]:text}));toast.success('评审需求已保存到本地');}}><Save size={13}/>保存需求</button><button className="research-button" onClick={exportFull}>下载完整 PRD</button><span className="text-xs text-muted-foreground">编辑自动保存在本地</span></div></DialogContent></Dialog></>;
}
