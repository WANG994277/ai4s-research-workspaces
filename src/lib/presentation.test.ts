import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  SHOW_COCKPIT_HEADER_TOOLS,
  SHOW_PROTOTYPE_REVIEW_TOOLS,
} from './presentation';

test('汇报演示默认隐藏驾驶舱页头内部工具', () => {
  assert.equal(SHOW_COCKPIT_HEADER_TOOLS, false);
});

test('汇报演示默认隐藏 PRD 与重置工具栏', () => {
  assert.equal(SHOW_PROTOTYPE_REVIEW_TOOLS, false);
});
