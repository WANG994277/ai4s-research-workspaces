import test from "node:test";
import assert from "node:assert/strict";
import {
  filterDatasetCatalog,
  getDatasetMetadata,
  datasetUseLabel,
  uniqueLabels,
} from "./dataset-marketplace";
import { createSeed, ensureAssistantDemoState } from "./seed";

test("dataset marketplace only exposes published active dataset assets", () => {
  const state = createSeed();
  const results = filterDatasetCatalog(state.assets, {
    query: "",
    discipline: "全部",
    modality: "全部",
    purpose: "全部",
    format: "全部",
    access: "全部",
  });

  assert.ok(results.length >= 8);
  assert.ok(results.every((item) => item.type === "数据集"));
  assert.ok(results.every((item) => item.publishStatus === "已发布"));
  assert.ok(results.every((item) => item.lifecycle !== "已归档"));
});

test("dataset marketplace supports combined semantic and metadata filters", () => {
  const state = createSeed();
  const results = filterDatasetCatalog(state.assets, {
    query: "吸附 压力",
    discipline: "材料科学",
    modality: "表格数据",
    purpose: "模型训练",
    format: "CSV",
    access: "可直接使用",
  });

  assert.ok(results.length > 0);
  assert.ok(results.every((item) => item.discipline === "材料科学"));
  assert.ok(
    results.every((item) => getDatasetMetadata(item).modality === "表格数据"),
  );
  assert.ok(results.every((item) => getDatasetMetadata(item).formats.includes("CSV")));
});

test("dataset metadata includes reproducibility and safe-use fields", () => {
  const state = createSeed();
  const dataset = state.assets.find((item) => item.id === "dataset-adsorption-benchmark");
  assert.ok(dataset);

  const metadata = getDatasetMetadata(dataset);
  assert.equal(metadata.version, dataset.version);
  assert.ok(metadata.recordCount > 0);
  assert.ok(metadata.fields.length >= 4);
  assert.ok(metadata.license.length > 0);
  assert.ok(metadata.provenance.length > 0);
  assert.ok(metadata.citation.length > 0);
  assert.ok(metadata.previewRows.length >= 3);
});

test("legacy persisted state receives marketplace datasets without overwriting user assets", () => {
  const state = createSeed();
  const marketplaceIds = new Set(
    state.assets
      .filter((item) => item.type === "数据集" && item.publishStatus === "已发布")
      .map((item) => item.id),
  );
  state.assets = state.assets.filter((item) => !marketplaceIds.has(item.id));
  const preserved = state.assets.find((item) => item.id === "dataset-rubber-history");
  assert.ok(preserved);
  preserved.description = "用户已修改的数据集说明";

  ensureAssistantDemoState(state);

  const publishedDatasets = state.assets.filter(
    (item) => item.type === "数据集" && item.publishStatus === "已发布",
  );
  assert.ok(publishedDatasets.length >= 8);
  assert.equal(
    state.assets.find((item) => item.id === "dataset-rubber-history")?.description,
    "用户已修改的数据集说明",
  );
});

test("repeated dataset status labels are collapsed for stable rendering", () => {
  assert.deepEqual(uniqueLabels(["需要授权", "需要授权", "可预览"]), [
    "需要授权",
    "可预览",
  ]);
});

test("dataset use label distinguishes resource restriction from role-only access", () => {
  assert.equal(datasetUseLabel("可用", true), "可直接使用");
  assert.equal(datasetUseLabel("可用", false), "当前角色仅可查看");
  assert.equal(datasetUseLabel("需要授权", false), "需要授权");
});
