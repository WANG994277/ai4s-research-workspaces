import assert from 'node:assert/strict';
import { test } from 'node:test';
import { visibleGroups } from './capabilities';

test('科研驾驶舱紧跟个人工作台出现', () => {
  assert.equal(visibleGroups('researcher')[0], '科研驾驶舱');
  assert.equal(visibleGroups('lead')[0], '科研驾驶舱');
  assert.equal(visibleGroups('manager')[0], '科研驾驶舱');
});
