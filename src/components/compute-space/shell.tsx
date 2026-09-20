'use client';
import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Boxes, ChartNoAxesCombined, Cpu, Database, Home, Layers, RotateCcw } from 'lucide-react';
import { useComputeStore } from './store';
import { Button, Modal } from './ui';
import { PrdInspector } from './prd-inspector';
import { ComputeReadReceiver } from './read-receiver';
import './compute-space.css';
const nav=[['开始计算','',Home],['智能设计与筛选','design',Boxes],['计算任务','tasks',Cpu],['科研数据处理','data',Database],['模型训练与评价','models',ChartNoAxesCombined],['科研工具','tools',Layers]] as const;
export function ComputeShell({children}:{children:ReactNode}){const path=usePathname();const[ready,setReady]=useState(false);const[reset,setReset]=useState(false);const[error,setError]=useState('');useEffect(()=>{Promise.resolve(useComputeStore.persist.rehydrate()).catch(()=>setError('本地演示记录无法读取，已使用初始数据。')).finally(()=>setReady(true));},[]);return <div className="compute-space"><nav className="cp-subnav" aria-label="算空间工作台">{nav.map(([label,part,Icon])=>{const active=part?path.startsWith(`/compute-space/${part}`):path==='/compute-space'||path==='/compute-space/agent';return <Link key={label} className={active?'active':''} href={`/compute-space${part?`/${part}`:''}`} aria-current={active?'page':undefined}><Icon size={14}/>{label}</Link>;})}<span className="cp-environment"><i/>演示环境</span></nav>{error&&<p role="alert">{error}</p>}{ready?<><ComputeReadReceiver />{children}</>:<div className="cp-empty" role="status">正在恢复科研计算工作区…</div>}<div className="cp-row" style={{justifyContent:'space-between',marginTop:24,borderTop:'1px solid #e3e6eb',paddingTop:12}}><PrdInspector/><Button variant="ghost" onClick={()=>setReset(true)}><RotateCcw/>重置演示</Button></div><Modal open={reset} onClose={()=>setReset(false)} title="重置算空间演示数据" footer={<><Button onClick={()=>setReset(false)}>保留当前数据</Button><Button variant="danger" onClick={()=>{localStorage.removeItem('ai4s-compute-processing-v1');useComputeStore.getState().reset();window.location.assign('/compute-space');}}>确认重置</Button></>}><p>这会清除本浏览器中新建的算空间方案、计算任务、数据和模型版本、工具与交接记录，并恢复初始示例。其他业务模块的数据不受影响。</p></Modal></div>}


