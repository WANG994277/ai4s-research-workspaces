import { notFound } from 'next/navigation';
import { Home } from '@/components/do-space-v2/home';
import { Agent, PlanList, PlanDetail } from '@/components/do-space-v2/plans';
import { Samples, Equipment, Bookings } from '@/components/do-space-v2/resources';
import { TaskList, TaskDetail, Orchestration } from '@/components/do-space-v2/execution';
import { Analysis } from '@/components/do-space-v2/analysis';
export default async function Page({params}:{params:Promise<{segments?:string[]}>}){const{segments=[]}=await params;const[page,id]=segments;if(segments.length>2)notFound();if(!page)return <Home/>;if(page==='agent')return <Agent/>;if(page==='plans')return id?<PlanDetail id={id}/>:<PlanList/>;if(page==='samples')return <Samples/>;if(page==='equipment')return <Equipment/>;if(page==='bookings')return <Bookings/>;if(page==='tasks')return id?<TaskDetail id={id}/>:<TaskList/>;if(page==='orchestrate')return <Orchestration/>;if(page==='analysis')return <Analysis/>;notFound();}
