import assert from 'node:assert/strict';
import { test } from 'node:test';
import { persistValue } from './persistence';

test('persistent state writes synchronously before route-driven remounts', () => {
  const calls: Array<[string, string]> = [];
  const storage = { setItem: (key: string, value: string) => calls.push([key, value]) };
  const asset = { id: 'MY-NEW', status: '已发布' };
  persistValue(storage, 'ai4s-assets', [asset]);
  assert.deepEqual(calls, [['ai4s-assets', JSON.stringify([asset])]]);
});
