'use client';
import { useDoStore } from '@/components/do-space-v2/store';
import type { Parameter } from './types';
import { scenarioFor } from './scenarios';
export async function createExperimentDraft(input:{title:string;goal:string;hypothesis:string;method:string;parameters:Parameter[];steps:string[];risks:string;evidence:string[];projectId:string;project:string;sourceId:string;template:string}){
  await useDoStore.persist.rehydrate();const s=useDoStore.getState();
  const scenario=scenarioFor({title:input.title,goal:input.goal,method:input.method,toolId:''});
  const template=scenario.kind==='geo'?'页岩真三轴实验':scenario.kind==='material'?'材料稳定性实验':input.template;
  const id=s.createPlan(input.goal,input.projectId,input.project,template);
  const profiles={geo:{materials:'页岩柱状试样，50 × 100 mm，9 件',control:'25 ℃、10 MPa，3 个平行样',characterization:'CT、声发射、应力应变曲线',equipmentId:'EQ-03'},material:{materials:'候选催化材料及空白对照，9 份；组成参照计算方案',control:'基准组成与温度，3 个平行样',characterization:'热重分析、催化活性和循环稳定性',equipmentId:'EQ-05'},bio:{materials:'候选菌株 / 元件与对照组，9 份',control:'未诱导对照，3 次重复',characterization:'产率、代谢通量与生长曲线',equipmentId:s.equipment.find(e=>/培养|发酵/.test(e.name))?.id||''},flow:{materials:'标准岩心和驱替介质，9 份',control:'基准注入工况，3 次重复',characterization:'压力分布、产出组分与采收率',equipmentId:s.equipment.find(e=>/驱替/.test(e.name))?.id||''},generic:{materials:'按研究方案准备实验样本与对照样本，9 份',control:'基准参数组合，3 次重复',characterization:'科研目标对应的观测指标',equipmentId:''}};
  const profile=profiles[scenario.kind as keyof typeof profiles];
  s.updatePlan(id,{...profile,sampleCount:9,repeats:3,output:scenario.outputs.join('、')});
  s.updatePlan(id,{title:input.title,hypothesis:input.hypothesis,method:input.method,parameters:input.parameters.map(p=>({...p,confirmed:false})),steps:input.steps,risks:[input.risks],evidence:input.evidence.map((text,i)=>({id:`${input.sourceId}-E${i}`,type:'计算依据',title:text,content:text,sourceId:input.sourceId,href:input.sourceId.startsWith('SIM-')?`/compute-space/tasks/${input.sourceId}`:'/compute-space/design'})),status:'草稿',reviews:[{action:'从算空间交接',content:`来源 ${input.sourceId}，人工确认创建实验草稿`,time:new Date().toLocaleString('zh-CN'),author:'张博士'}],messages:[{role:'assistant',content:`已接收科研计算上下文。来源：${input.sourceId}。请检查实验参数和风险后进入评审。`}]});
  return id;
}

