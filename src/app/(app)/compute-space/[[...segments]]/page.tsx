import { notFound } from 'next/navigation';
import { ComputeHome } from '@/components/compute-space/home';
import { ComputeAgent } from '@/components/compute-space/agent';
import { TaskCenter, TaskDetail } from '@/components/compute-space/tasks';
import { ResultAnalysis } from '@/components/compute-space/analysis';
import { DesignWorkspace } from '@/components/compute-space/design';
import { DataWorkspace } from '@/components/compute-space/data';
import { ModelsWorkspace } from '@/components/compute-space/models';
import { ToolsWorkspace, ToolDetail, ToolManagement } from '@/components/compute-space/tools';
import { ComputeHandoff } from '@/components/compute-space/handoff';
export default async function ComputePage({params}:{params:Promise<{segments?:string[]}>}){const {segments=[]}=await params;const [page,id]=segments;if(!page)return <ComputeHome/>;if(segments.length>2)notFound();if(page==='tasks'&&id)return <TaskDetail id={id}/>;if(page==='tools'&&id==='manage')return <ToolManagement/>;if(page==='tools'&&id)return <ToolDetail id={id}/>;if(id)notFound();switch(page){case 'agent':return <ComputeAgent/>;case 'design':return <DesignWorkspace/>;case 'tasks':return <TaskCenter/>;case 'analysis':return <ResultAnalysis/>;case 'data':return <DataWorkspace/>;case 'models':return <ModelsWorkspace/>;case 'tools':return <ToolsWorkspace/>;case 'handoff':return <ComputeHandoff/>;default:notFound();}}
