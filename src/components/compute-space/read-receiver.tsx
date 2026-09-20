'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookOpen, ArrowRight } from 'lucide-react';
import { useReadStore } from '@/components/read-space/store';
import { useComputeStore } from './store';
import { useResearchProject } from '@/components/research/workspace-kit';
import { Button } from './ui';
export function ComputeReadReceiver(){const q=useSearchParams();const router=useRouter();const {project}=useResearchProject();const[ready,setReady]=useState(false);const read=useReadStore();const compute=useComputeStore();useEffect(()=>{Promise.resolve(useReadStore.persist.rehydrate()).finally(()=>setReady(true));},[]);const draft=read.drafts.find(d=>d.id===q.get('readDraft')&&d.confirmed&&d.target==='compute'&&d.projectId===project.id);if(!ready||!draft)return null;const previous=compute.plans.find(p=>p.evidence.includes(`读空间草稿 ${draft.id}`));return <div className="cp-note" style={{marginTop:16}} data-prd-id="REQ-HANDOFF-001"><div className="cp-row" style={{justifyContent:'space-between'}}><div><strong className="cp-row"><BookOpen size={16}/>已接收读空间研究上下文</strong><p style={{marginTop:8}}>{draft.goal}</p><p style={{marginTop:4}}>假设：{draft.hypothesis} · 参数：{draft.parameters}</p></div><Button variant="primary" onClick={()=>{const id=previous?.id||compute.createPlan(draft.goal,{title:draft.title,projectId:project.id,project:project.name,hypothesis:draft.hypothesis,method:draft.method||'参数敏感性分析',risks:draft.constraints,evidence:[`读空间草稿 ${draft.id}`,...draft.evidenceIds.map(id=>{const e=read.evidence.find(v=>v.id===id);return e?`${e.source} · ${e.location} · ${e.excerpt}`:id;})],parameters:[{name:'读空间关键参数',value:draft.parameters,unit:'见原文',source:`读空间草稿 ${draft.id}`} ]});router.push(`/compute-space/agent?plan=${id}`);}}>{previous?'继续计算方案':'生成计算方案'}<ArrowRight/></Button></div></div>}

