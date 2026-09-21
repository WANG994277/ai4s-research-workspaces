const origin = process.env.AI4S_ORIGIN || 'http://localhost:3000';

const routes = [
  ['RA01', '/assets'],
  ['RA02', '/assets/data-knowledge'],
  ['RA03', '/assets/data/cu-zno-catalyst-characterization'],
  ['RA04', '/assets/upload?type=data'],
  ['RA05', '/assets/data-knowledge?tab=knowledge'],
  ['RA06', '/assets/knowledge/methanol-catalysis-knowledge-graph'],
  ['RA07', '/assets/data-knowledge?tab=outcome'],
  ['RA08', '/assets/outcome/co2-methanol-stage-report'],
  ['RA09', '/assets/models'],
  ['RA10', '/assets/model/methanol-microkinetic-model'],
  ['RA11', '/assets/upload?type=model'],
  ['RA12', '/assets/plans'],
  ['RA13', '/assets/compute-plan/high-throughput-catalyst-screening'],
  ['RA14', '/assets/experiment-plan/co2-hydrogenation-doe'],
  ['RA15', '/assets/intelligent-services'],
  ['RA16', '/assets/agent/scientific-literature-agent'],
  ['RA17', '/assets/workflow/spectra-analysis-workflow'],
  ['RA18', '/assets/skill/scientific-chart-extraction'],
  ['RA19', '/assets/software/molecular-simulation-studio'],
  ['RA20', '/assets/algorithm/bayesian-parameter-inversion'],
  ['RA21', '/assets/upload'],
  ['RA22', '/assets/mine'],
  ['RA23', '/assets/search?q=催化剂'],
];

const failures = [];
for (const [id, path] of routes) {
  const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
  const body = await response.text();
  const ok = response.status === 200 && body.includes('科研资产') && !body.includes('NEXT_HTTP_ERROR_FALLBACK;404');
  console.log(`${ok ? '✓' : '✗'} ${id} ${response.status} ${path}`);
  if (!ok) failures.push({ id, path, status: response.status });
}

if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exit(1);
}

console.log(`Verified ${routes.length} PRD P0 asset routes.`);
