import assert from 'node:assert/strict';
import { createExperimentDraft } from '../src/components/compute-space/experiment-bridge';
import { useDoStore } from '../src/components/do-space-v2/store';

async function main(){
  useDoStore.getState().reset();
  for(const [goal,expected] of [['页岩温压耦合裂缝模拟','页岩柱状'],['合成生物代谢路径优化','候选菌株'],['催化材料稳定性筛选','候选催化']] as const){
    const id=await createExperimentDraft({title:goal,goal,hypothesis:'验证已引用研究假设',method:'实验对照',parameters:[{name:'主参数',value:'10',unit:'%',source:'计算结果'}],steps:['准备','测量','对比'],risks:'需独立验证',evidence:['来源计算结果'],projectId:'PROJ-SHALE-06',project:'深层页岩气储层机理研究',sourceId:'SIM-CHECK',template:'科研实验验证'});
    const plan=useDoStore.getState().plans.find(p=>p.id===id)!;
    assert.ok(plan.materials.includes(expected),`${goal} 不得误用其他领域样本`);
    assert.equal(plan.sampleCount,9);assert.equal(plan.status,'草稿');assert.equal(plan.projectId,'PROJ-SHALE-06');
    assert.equal(plan.parameters[0].value,'10');assert.equal(plan.parameters[0].confirmed,false);
    assert.equal(plan.evidence[0].sourceId,'SIM-CHECK');assert.ok(plan.reviews[0].content.includes('SIM-CHECK'));
  }
  console.log('Handoff checks passed: geology, materials and biology keep correct samples, parameters, evidence and project.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
