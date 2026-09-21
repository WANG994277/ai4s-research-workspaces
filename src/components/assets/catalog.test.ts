import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assetCategories,
  assetRecords,
  filterAssets,
  resolveAssetRoute,
  sortAssets,
} from './catalog';

test('P0 catalog exposes exactly the eleven PRD asset types and excludes device services', () => {
  assert.equal(assetCategories.length, 11);
  assert.deepEqual(assetCategories.map((item) => item.label), [
    '科研数据', '科研知识', '科研成果', '科研模型', '计算方案', '实验方案',
    '科研智能体', '科研工作流', 'Skill', '科学软件', '算法工具',
  ]);
  assert.equal(assetCategories.some((item) => item.label.includes('设备')), false);
});

test('search matches metadata while filters combine discipline, purpose and asset attributes', () => {
  const matches = filterAssets(assetRecords, {
    query: 'Cu/ZnO',
    categories: ['data'],
    disciplines: ['化学与化工'],
    purposes: ['表征分析'],
    attributes: ['表征数据'],
  });
  assert.deepEqual(matches.map((item) => item.slug), ['cu-zno-catalyst-characterization']);
  assert.equal(filterAssets(assetRecords, { query: '不存在的科研资产' }).length, 0);
});

test('sorting supports PRD plaza ordering without mutating source assets', () => {
  const original = assetRecords.map((item) => item.slug);
  const newest = sortAssets(assetRecords, 'latest');
  const downloaded = sortAssets(assetRecords, 'downloads');
  assert.ok(newest[0].publishedAt >= newest[1].publishedAt);
  assert.ok(downloaded[0].downloads >= downloaded[1].downloads);
  assert.deepEqual(assetRecords.map((item) => item.slug), original);
});

test('asset routes resolve home, plaza, detail, upload, mine and search P0 views', () => {
  assert.deepEqual(resolveAssetRoute('/assets'), { kind: 'home' });
  assert.deepEqual(resolveAssetRoute('/assets/data-knowledge', 'tab=knowledge'), { kind: 'plaza', category: 'knowledge' });
  assert.deepEqual(resolveAssetRoute('/assets/data/cu-zno-catalyst-characterization'), { kind: 'detail', category: 'data', slug: 'cu-zno-catalyst-characterization' });
  assert.deepEqual(resolveAssetRoute('/assets/upload', 'type=model'), { kind: 'upload', category: 'model' });
  assert.deepEqual(resolveAssetRoute('/assets/mine'), { kind: 'mine' });
  assert.deepEqual(resolveAssetRoute('/assets/search', 'q=catalyst'), { kind: 'search' });
});
