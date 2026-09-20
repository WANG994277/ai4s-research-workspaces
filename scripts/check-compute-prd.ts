import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildFullMarkdown, buildPageMarkdown, computePrdPages, computeRequirements, resolvePrdPage } from '../src/components/compute-space/requirements';
const ids = new Set(computeRequirements.map(r => r.id));
assert.equal(ids.size, computeRequirements.length);
for(const name of fs.readdirSync('src/components/compute-space').filter(n=>n.endsWith('.tsx'))){
  const text=fs.readFileSync(`src/components/compute-space/${name}`,'utf8');
  for(const match of text.matchAll(/data-prd-id="([^"]+)"/g)) for(const id of match[1].split(',')) assert.ok(ids.has(id),`${name}: ${id} must resolve`);
}
const page=resolvePrdPage('/compute-space/models');
const edited=buildPageMarkdown(page,{'REQ-MODEL-001':{description:'验收修订示例'}});
assert.ok(edited.includes('验收修订示例'));
assert.ok(!edited.includes('### REQ-TOOL-001'));
const original=fs.readFileSync('public/compute-space-prd.md','utf8');
const full=buildFullMarkdown(original);
assert.ok(full.includes(original));
for(let i=0;i<=33;i++) assert.ok(new RegExp(`^# ${i}\\.`, 'm').test(full),`原始 PRD 第 ${i} 章`);
assert.equal(computePrdPages.length,12);
assert.ok(resolvePrdPage('/compute-space/tasks/SIM-001').requirementIds.includes('REQ-DETAIL-001'));
console.log(`PRD checks passed: ${computePrdPages.length} pages, ${ids.size} requirements, all rendered anchors, full original PRD and edited exports.`);
