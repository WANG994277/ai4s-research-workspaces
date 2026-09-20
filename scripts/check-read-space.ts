import assert from 'node:assert/strict';
import { movePlanStep, draftFromTask, taskRoute, DEFAULT_PLAN, type ResearchTask } from '../src/components/read-space/types';
import { artifactInput, artifactContent, evidenceInputs, stageArtifact } from '../src/components/read-space/simulation';

const task: ResearchTask = { id:'T1',projectId:'P1',title:'温压耦合研究',goal:'验证温压耦合作用',type:'科研思路探索',status:'规划中',mode:'深度研究',plan:DEFAULT_PLAN.map((title,i)=>({id:`s${i}`,title,done:i===0})),resourceIds:['demo-lit-1','demo-lit-2'],artifactIds:[],stream:[],confirmations:[],updatedAt:'2026-09-21T00:00:00Z',createdAt:'2026-09-21T00:00:00Z',focus:['耦合作用'],hypothesis:'高温与围压存在交互效应'};
const moved=movePlanStep(task.plan,'s2',-1);
assert.equal(moved[1].id,'s2');
assert.equal(task.plan[1].id,'s1','Moving a step must not mutate stored plan');
assert.deepEqual(movePlanStep(task.plan,'s0',-1),task.plan);
assert.equal(moved[0].done,true,'Completed step state must survive reordering');
assert.equal(stageArtifact('形成候选科学假设'),'科学假设');
assert.match(artifactContent(task,'问题树'),/验证温压耦合作用/);
assert.match(artifactContent(task,'研究空白'),/候选/);
assert.match(artifactContent(task,'科学假设'),/高温与围压/);
const evidence=evidenceInputs(task);
assert.deepEqual(evidence.map(e=>e.sourceId),task.resourceIds);
assert.ok(evidence.every(e=>e.projectId===task.projectId && e.taskId===task.id && e.page>0 && e.location && !e.confirmed));
const artifact=artifactInput(task,'证据',['E1','E2']);
assert.equal(artifact.taskId,'T1');assert.equal(artifact.projectId,'P1');assert.deepEqual(artifact.evidenceIds,['E1','E2']);
for(const target of ['compute','experiment'] as const){const draft=draftFromTask(task,target,['E1'],'温度 150 ℃');assert.equal(draft.projectId,'P1');assert.equal(draft.taskId,'T1');assert.equal(draft.hypothesis,task.hypothesis);assert.equal(draft.parameters,'温度 150 ℃');assert.deepEqual(draft.evidenceIds,['E1']);assert.match(draft.data,/demo-lit-1/);}
assert.match(taskRoute(task),/\/read-space\/agent\?task=T1&projectId=P1/);
assert.match(taskRoute({...task,type:'多文献研读'}),/\/literature-search\/1/);
assert.match(taskRoute({...task,type:'科研写作'}),/\/research-writing/);
console.log('PASS: plan editing, candidate semantics, evidence provenance, artifact linkage, both handoff payloads, workspace restoration routes.');

async function verifyProjectResources() {
  const storage = new Map<string,string>();
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (key:string) => storage.get(key) ?? null, setItem: (key:string,value:string) => storage.set(key,value), removeItem: (key:string) => storage.delete(key) }, configurable: true });
  const { useReadStore } = await import('../src/components/read-space/store');
  const store = useReadStore.getState();
  store.addResource({ id:'same-source',projectId:'P1',name:'课题一资料',kind:'文献',status:'可研读' });
  store.addResource({ id:'same-source',projectId:'P2',name:'课题二资料',kind:'文献',status:'可研读' });
  assert.equal(useReadStore.getState().resources.filter(r=>r.id==='same-source').length,2);
  assert.equal(useReadStore.getState().resources.find(r=>r.id==='same-source'&&r.projectId==='P1')?.name,'课题一资料');
  console.log('PASS: identical source IDs remain independently associated with multiple projects.');
}
void verifyProjectResources();
