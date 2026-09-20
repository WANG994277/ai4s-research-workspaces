import fs from 'node:fs';

const catalog = JSON.parse(
  fs.readFileSync(new URL('../src/data/capabilities.json', import.meta.url)),
);
const routes = [
  ...new Set(
    catalog
      .map((item) => item.href.replace('[id]', '1').split('#')[0])
      .concat(['/experiment-plans', '/literature-library']),
  ),
];
const excluded = [
  '/research-flow',
  '/research-flow/agents',
  '/foundation/fs-01',
  '/admin/operation/dashboard',
  '/admin/security',
  '/ops/op-01',
  '/security/se-01',
  '/manage/users',
];
const failures = [];
const queue = [
  ...routes.map((path) => ({ path, expected: 200 })),
  ...excluded.map((path) => ({ path, expected: 404 })),
];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const { path, expected } = queue.shift();
      try {
        const response = await fetch(`http://localhost:3000${path}`);
        const html = await response.text();
        const visibleHtml = html.replace(
          /<script\b[^>]*>[\s\S]*?<\/script>/gi,
          '',
        );
        const notFound =
          visibleHtml.includes('This page could not be found') ||
          /name="next-error" content="not-found"/.test(visibleHtml);
        const actual = notFound ? 404 : response.status;
        if (actual !== expected) failures.push({ path, expected, actual });
      } catch (error) {
        failures.push({ path, error: String(error) });
      }
    }
  }),
);
console.log(
  JSON.stringify(
    { included: routes.length, excluded: excluded.length, failures },
    null,
    2,
  ),
);
process.exitCode = failures.length ? 1 : 0;
