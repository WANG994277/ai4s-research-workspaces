import type { Asset, DatasetMetadata } from "./types";

export interface DatasetCatalogFilters {
  query: string;
  discipline: string;
  modality: string;
  purpose: string;
  format: string;
  access: string;
}

const all = "全部";

export function uniqueLabels(values: string[]) {
  return [...new Set(values)];
}

export function datasetUseLabel(availability: string, usable: boolean) {
  if (usable) return "可直接使用";
  return availability === "可用" ? "当前角色仅可查看" : availability;
}

export function getDatasetMetadata(asset: Asset): DatasetMetadata {
  return (
    asset.dataset ?? {
      version: asset.version,
      modality: "其他",
      purposes: [],
      formats: [],
      recordCount: 0,
      fileCount: 0,
      size: "—",
      fields: [],
      license: "未声明",
      accessLevel: asset.availability,
      qualitySummary: asset.validation || "尚未提供质量说明",
      provenance: asset.source,
      citation: `${asset.provider}. ${asset.name} (${asset.version}).`,
      previewRows: [],
    }
  );
}

function matchesAccess(asset: Asset, value: string) {
  if (value === all) return true;
  if (value === "可直接使用") return asset.availability === "可用";
  if (value === "需要申请")
    return ["需要授权", "权限受限"].includes(asset.availability);
  return getDatasetMetadata(asset).accessLevel === value;
}

export function filterDatasetCatalog(
  assets: Asset[],
  filters: DatasetCatalogFilters,
) {
  const tokens = filters.query
    .trim()
    .toLocaleLowerCase("zh-CN")
    .split(/\s+/)
    .filter(Boolean);

  return assets.filter((asset) => {
    if (
      asset.type !== "数据集" ||
      asset.publishStatus !== "已发布" ||
      asset.lifecycle === "已归档"
    )
      return false;
    const metadata = getDatasetMetadata(asset);
    const searchable = [
      asset.name,
      asset.description,
      asset.provider,
      asset.source,
      ...asset.tags,
      metadata.modality,
      ...metadata.purposes,
      ...metadata.formats,
      metadata.provenance,
      ...metadata.fields.flatMap((field) => [
        field.name,
        field.label,
        field.description,
        field.unit ?? "",
      ]),
    ]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    return (
      tokens.every((token) => searchable.includes(token)) &&
      (filters.discipline === all || asset.discipline === filters.discipline) &&
      (filters.modality === all || metadata.modality === filters.modality) &&
      (filters.purpose === all || metadata.purposes.includes(filters.purpose)) &&
      (filters.format === all || metadata.formats.includes(filters.format)) &&
      matchesAccess(asset, filters.access)
    );
  });
}

export function datasetActivityCount(assetId: string, contextIds: string[][]) {
  return contextIds.filter((ids) => ids.includes(assetId)).length;
}
