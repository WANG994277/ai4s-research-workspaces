"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Crown,
  Database,
  Download,
  FileJson,
  FileText,
  Grid2X2,
  HardDrive,
  Info,
  Layers3,
  List,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Table2,
  Upload,
  User,
} from "lucide-react";
import { canRead, canUse, hasRole } from "./domain";
import {
  datasetActivityCount,
  datasetUseLabel,
  filterDatasetCatalog,
  getDatasetMetadata,
  uniqueLabels,
} from "./dataset-marketplace";
import { disciplines } from "./seed";
import { notify, useResearch } from "./store";
import { ExternalJump, PermissionRequest } from "./actions";
import { Button, Empty, Pagination } from "./ui";
import marketStyles from "./skills-marketplace.module.css";
import styles from "./dataset-marketplace.module.css";

const modalities = [
  "全部",
  "表格数据",
  "文本数据",
  "图像数据",
  "时序数据",
  "光谱数据",
  "序列数据",
  "分子结构",
  "多模态数据",
];

const purposes = [
  "全部",
  "模型训练",
  "预测验证",
  "实验分析",
  "材料设计",
  "地学解释",
  "文献研究",
];

const catalogTabs = [
  "全部数据",
  "我可使用的",
  "最近使用",
  "我的收藏",
  "我发布的",
];

const datasetIcons = [Database, Table2, Layers3, FileJson, HardDrive];
const recordFormatter = new Intl.NumberFormat("zh-CN");
const tones = [
  "",
  marketStyles.tone1,
  marketStyles.tone2,
  marketStyles.tone3,
  marketStyles.tone4,
  marketStyles.tone5,
];

function formatRecords(value: number) {
  return recordFormatter.format(value);
}

export function DatasetMarketplace() {
  const { s, p, space, mutate } = useResearch();
  const router = useRouter();
  const query = useSearchParams();
  const q = query.get("q") ?? "";
  const discipline = query.get("discipline") ?? "全部";
  const modality = query.get("modality") ?? "全部";
  const purpose = query.get("purpose") ?? "全部";
  const format = query.get("format") ?? "全部";
  const access = query.get("access") ?? "全部";
  const catalogTab = query.get("tab") ?? "全部数据";
  const sort = query.get("sort") ?? "综合排序";
  const layout = query.get("layout") ?? "grid";
  const page = Number(query.get("page") ?? 1);
  const selectedId = query.get("id");
  const detailTab = query.get("section") ?? "数据概览";
  const [panel, setPanel] = useState("");

  function params(key: string, value: string) {
    const next = new URLSearchParams(query.toString());
    if (value && value !== "全部") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    router.replace(`/datasets${next.size ? `?${next.toString()}` : ""}`);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (layout !== "grid") next.set("layout", layout);
    router.replace(`/datasets${next.size ? `?${next.toString()}` : ""}`);
  }

  const visibleDatasets = useMemo(
    () =>
      filterDatasetCatalog(s.assets, {
        query: "",
        discipline: "全部",
        modality: "全部",
        purpose: "全部",
        format: "全部",
        access: "全部",
      }).filter((item) => canRead(item, p, space.id, s)),
    [p, s, space.id],
  );
  const item = visibleDatasets.find((dataset) => dataset.id === selectedId);
  const favoriteIds = useMemo(
    () => s.favorites[p.id] ?? [],
    [p.id, s.favorites],
  );
  const activityContexts = useMemo(
    () => [
      ...s.tasks.map((task) => task.contextIds),
      ...s.sessions.map((session) => session.contextIds),
    ],
    [s.sessions, s.tasks],
  );

  const list = useMemo(() => {
    const filtered = filterDatasetCatalog(visibleDatasets, {
      query: q,
      discipline,
      modality,
      purpose,
      format,
      access,
    }).filter((dataset) => {
      if (catalogTab === "我可使用的")
        return canUse(dataset, p, space.id, s);
      if (catalogTab === "最近使用")
        return datasetActivityCount(dataset.id, activityContexts) > 0;
      if (catalogTab === "我的收藏") return favoriteIds.includes(dataset.id);
      if (catalogTab === "我发布的") return dataset.ownerId === p.id;
      return true;
    });
    return [...filtered].sort((a, b) => {
      if (sort === "最近更新") return b.updatedAt.localeCompare(a.updatedAt);
      if (sort === "使用频率")
        return (
          datasetActivityCount(b.id, activityContexts) -
          datasetActivityCount(a.id, activityContexts)
        );
      if (sort === "数据规模")
        return getDatasetMetadata(b).recordCount - getDatasetMetadata(a).recordCount;
      return 0;
    });
  }, [
    access,
    activityContexts,
    catalogTab,
    discipline,
    favoriteIds,
    format,
    modality,
    p,
    purpose,
    q,
    s,
    sort,
    space.id,
    visibleDatasets,
  ]);

  function favorite(id: string) {
    mutate("已更新数据集收藏", id, (draft) => {
      const current = draft.favorites[p.id] ?? [];
      draft.favorites[p.id] = current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id];
    });
  }

  if (selectedId && !item)
    return (
      <Empty action={<Button onClick={() => params("id", "")}>返回科研数据广场</Button>}>
        当前数据集未发布、已归档或您无查看权限。
      </Empty>
    );

  return item ? (
    <DatasetDetail
      item={item}
      detailTab={detailTab}
      related={visibleDatasets.filter((dataset) => dataset.id !== item.id).slice(0, 3)}
      favorite={favoriteIds.includes(item.id)}
      onFavorite={() => favorite(item.id)}
      onBack={() => params("id", "")}
      onTab={(value) => params("section", value)}
      onRelated={(id) => params("id", id)}
      onPermission={() => setPanel("permission")}
      permissionOpen={panel === "permission"}
      onPermissionClose={() => setPanel("")}
    />
  ) : (
    <div className={`${marketStyles.page} ${styles.page}`}>
      <section className={`${marketStyles.hero} ${styles.hero}`}>
        <div className={marketStyles.heroCopy}>
          <h1>科研数据广场</h1>
          <p>
            发现、预览并引用可追溯的科研数据集
            <br />
            为 Research Agent、科研计算与实验任务选择确定版本的数据。
          </p>
        </div>
        <div className={marketStyles.heroArt} aria-hidden="true">
          <span className={marketStyles.orbit} />
          <span className={marketStyles.aiCube}>
            <Database size={28} />
          </span>
          <span className={marketStyles.miniCube}>
            <Table2 size={21} />
          </span>
          <span className={marketStyles.miniCube}>
            <HardDrive size={20} />
          </span>
        </div>
        {hasRole(p, "researcher", "leader", "analyst") && (
          <div className={marketStyles.heroActions}>
            <button className={marketStyles.heroButton} onClick={() => setPanel("import")}>
              <Upload size={16} />接入数据集
            </button>
            <button className={marketStyles.heroButtonPrimary} onClick={() => setPanel("create")}>
              <Plus size={16} />新建数据集
            </button>
          </div>
        )}
      </section>

      <div className={marketStyles.searchShell}>
        <form className={marketStyles.searchForm} onSubmit={(event) => event.preventDefault()}>
          <Search size={18} />
          <input
            aria-label="搜索科研数据集"
            value={q}
            onChange={(event) => params("q", event.target.value)}
            placeholder="搜索数据集名称、研究对象、字段、来源或用途…"
          />
          <button type="submit">搜索</button>
        </form>
      </div>

      <div className={marketStyles.filterStack}>
        <FilterRow label="学科分类：" values={disciplines} value={discipline} onChange={(value) => params("discipline", value)} />
        <FilterRow label="数据类型：" values={modalities} value={modality} onChange={(value) => params("modality", value)} />
      </div>

      <nav className={marketStyles.catalogTabs} aria-label="数据集范围">
        {catalogTabs.map((value) => (
          <button
            className={`${marketStyles.catalogTab} ${catalogTab === value ? marketStyles.catalogTabActive : ""}`}
            onClick={() => params("tab", value)}
            key={value}
            aria-current={catalogTab === value ? "page" : undefined}
          >
            {value}
          </button>
        ))}
      </nav>

      <div className={styles.toolbar}>
        <span className={marketStyles.count}>共 {list.length} 项</span>
        <span className={styles.spacer} />
        <CatalogSelect label="科研用途" value={purpose} options={purposes} onChange={(value) => params("purpose", value)} />
        <CatalogSelect label="数据格式" value={format} options={["全部", "CSV", "Parquet", "JSONL", "HDF5", "FASTA", "PNG", "SDF", "SEG-Y", "Zarr"]} onChange={(value) => params("format", value)} />
        <CatalogSelect label="访问条件" value={access} options={["全部", "可直接使用", "需要申请"]} onChange={(value) => params("access", value)} />
        <CatalogSelect label="排序" value={sort} options={["综合排序", "最近更新", "使用频率", "数据规模"]} onChange={(value) => params("sort", value)} />
        <button className={`${marketStyles.viewButton} ${layout === "grid" ? marketStyles.viewButtonActive : ""}`} onClick={() => params("layout", "grid")} aria-label="网格视图" aria-pressed={layout === "grid"}>
          <Grid2X2 size={17} />
        </button>
        <button className={`${marketStyles.viewButton} ${layout === "list" ? marketStyles.viewButtonActive : ""}`} onClick={() => params("layout", "list")} aria-label="列表视图" aria-pressed={layout === "list"}>
          <List size={17} />
        </button>
      </div>

      {!q && discipline === "全部" && modality === "全部" && purpose === "全部" && catalogTab === "全部数据" && list.length > 0 && (
        <section className={marketStyles.featured}>
          <div className={marketStyles.featuredTitle}>
            <h2><Crown size={18} />精选数据集</h2>
            <span>来源可追溯、元数据完整的高频科研数据</span>
          </div>
          <div className={marketStyles.featuredGrid}>
            {list.slice(0, 3).map((dataset, index) => {
              const metadata = getDatasetMetadata(dataset);
              const Icon = datasetIcons[index % datasetIcons.length];
              return (
                <button className={marketStyles.featuredCard} onClick={() => params("id", dataset.id)} key={dataset.id}>
                  <span className={`${marketStyles.skillIcon} ${tones[index % tones.length]}`}><Icon size={23} /></span>
                  <span>
                    <h3>{dataset.name}</h3>
                    <span className={marketStyles.featuredMeta}>
                      <span className={marketStyles.tag}>{dataset.discipline}</span>
                      <span className={marketStyles.tag}>{metadata.modality}</span>
                      <span className={marketStyles.officialTag}>已验证来源</span>
                    </span>
                    <p>{dataset.description}</p>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {list.length ? (
        <div className={`${marketStyles.skillGrid} ${layout === "list" ? marketStyles.skillList : ""}`}>
          {list.slice((page - 1) * 9, page * 9).map((dataset, index) => {
            const metadata = getDatasetMetadata(dataset);
            const Icon = datasetIcons[index % datasetIcons.length];
            const usable = canUse(dataset, p, space.id, s);
            return (
              <article className={`${marketStyles.skillCard} ${styles.datasetCard}`} key={dataset.id}>
                <span className={`${marketStyles.skillIcon} ${tones[index % tones.length]}`}><Icon size={23} /></span>
                <div className={marketStyles.skillBody}>
                  <button className={marketStyles.skillTitle} onClick={() => params("id", dataset.id)}>{dataset.name}</button>
                  <div className={marketStyles.tags}>
                    <span className={marketStyles.tag}>{dataset.discipline}</span>
                    <span className={marketStyles.tag}>{metadata.modality}</span>
                    <span className={marketStyles.officialTag}>{metadata.formats.slice(0, 2).join(" / ")}</span>
                    <span className={usable ? marketStyles.statusTag : marketStyles.tag}>{datasetUseLabel(dataset.availability, usable)}</span>
                  </div>
                  <p className={marketStyles.skillSummary}>{dataset.description}</p>
                  <div className={marketStyles.cardFooter}>
                    <div className={marketStyles.cardMeta}>
                      <span>{formatRecords(metadata.recordCount)} 条</span>
                      <span>{metadata.size}</span>
                      <span>{dataset.version}</span>
                    </div>
                    <div className={marketStyles.cardActions}>
                      <button className={marketStyles.detailButton} onClick={() => params("id", dataset.id)}>查看详情</button>
                      <button className={marketStyles.useButton} disabled={!usable} onClick={() => params("id", dataset.id)}>使用数据</button>
                    </div>
                  </div>
                </div>
                <button className={marketStyles.cardMore} aria-label={`${favoriteIds.includes(dataset.id) ? "取消收藏" : "收藏"} ${dataset.name}`} onClick={() => favorite(dataset.id)}>
                  <Star size={17} fill={favoriteIds.includes(dataset.id) ? "currentColor" : "none"} />
                </button>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={marketStyles.empty}>
          <div className={styles.emptyBody}>
            <Database size={28} />
            <strong>没有符合当前条件的数据集</strong>
            <span>请调整关键词、分类或访问条件。</span>
            <Button onClick={resetFilters}>清空筛选</Button>
          </div>
        </div>
      )}

      <Pagination page={page} total={list.length} size={9} onChange={(value) => params("page", String(value))} />
      <ExternalJump kind={panel === "import" ? "接入数据集" : "创建数据集"} open={panel === "import" || panel === "create"} onClose={() => setPanel("")} />
    </div>
  );
}

function FilterRow({ label, values, value, onChange }: { label: string; values: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className={marketStyles.filterRow}>
      <span className={marketStyles.filterLabel}>{label}</span>
      <div className={marketStyles.pills}>
        {values.map((option) => (
          <button className={`${marketStyles.pill} ${value === option ? marketStyles.pillActive : ""}`} onClick={() => onChange(option)} key={option} aria-pressed={value === option}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CatalogSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className={styles.select}>
      <span className={styles.srOnly}>{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function DatasetDetail({ item, detailTab, related, favorite, onFavorite, onBack, onTab, onRelated, onPermission, permissionOpen, onPermissionClose }: {
  item: ReturnType<typeof filterDatasetCatalog>[number];
  detailTab: string;
  related: ReturnType<typeof filterDatasetCatalog>;
  favorite: boolean;
  onFavorite: () => void;
  onBack: () => void;
  onTab: (value: string) => void;
  onRelated: (id: string) => void;
  onPermission: () => void;
  permissionOpen: boolean;
  onPermissionClose: () => void;
}) {
  const { s, p, space } = useResearch();
  const metadata = getDatasetMetadata(item);
  const usable = canUse(item, p, space.id, s);
  const useLabel = datasetUseLabel(item.availability, usable);
  const tabs = ["数据概览", "数据预览", "字段与 Schema", "使用与许可", "版本与来源"];
  return (
    <div className={`${marketStyles.detailPage} ${styles.detailPage}`}>
      <button className={marketStyles.detailBack} onClick={onBack}><ArrowLeft size={15} />返回科研数据广场</button>
      <section className={marketStyles.detailHero}>
        <div className={marketStyles.detailIdentity}>
          <div className={`${marketStyles.detailMark} ${styles.detailMark}`}><Database size={34} /></div>
          <div>
            <div className={marketStyles.detailTitleRow}>
              <h1>{item.name}</h1>
              <span className={marketStyles.detailType}>数据集</span>
              <span className={marketStyles.detailVersion}>{item.version}</span>
              <span className={usable ? marketStyles.detailAvailable : styles.restrictedTag}>
                {usable ? <CheckCircle2 size={13} /> : <ShieldCheck size={13} />}{useLabel}
              </span>
            </div>
            <p>{item.description}</p>
            <div className={marketStyles.detailStats}>
              <span><User size={14} />{item.provider}</span>
              <span><Database size={14} />{formatRecords(metadata.recordCount)} 条记录</span>
              <span><FileText size={14} />{metadata.fileCount} 个文件</span>
              <span><HardDrive size={14} />{metadata.size}</span>
            </div>
          </div>
        </div>
        <div className={marketStyles.detailHeroArt} aria-hidden="true">
          <span className={marketStyles.detailDoc}><Database size={36} /></span>
          <span className={marketStyles.detailLens} />
        </div>
        <div className={marketStyles.detailActions}>
          <button className={marketStyles.outlineButton} disabled={!usable} onClick={() => notify("演示环境未连接真实数据下载服务。")}><Download size={16} />下载/获取</button>
          <button className={marketStyles.outlineButton} onClick={() => notify("演示环境尚未配置数据 API/SDK。")}><Code2 size={16} />API/SDK</button>
          {!usable && item.availability !== "可用" && <button className={marketStyles.outlineButton} onClick={onPermission}><ShieldCheck size={16} />申请权限</button>}
          <button className={`${marketStyles.moreButton} ${favorite ? marketStyles.outlineButtonActive : ""}`} onClick={onFavorite} aria-label={favorite ? "取消收藏" : "收藏数据集"}><Star size={17} fill={favorite ? "currentColor" : "none"} /></button>
        </div>
      </section>
      <div className={marketStyles.detailNotice}>
        {usable ? "当前为前端原型示例：可预览元数据和脱敏样例，不执行真实下载或 API 调用。" : "当前数据集可查看元数据，但实际使用前需完成权限审批。"}
      </div>
      <nav className={marketStyles.detailTabs} aria-label="数据集详情">
        {tabs.map((tab) => <button className={`${marketStyles.detailTab} ${detailTab === tab ? marketStyles.detailTabActive : ""}`} onClick={() => onTab(tab)} key={tab} aria-current={detailTab === tab ? "page" : undefined}>{tab}</button>)}
      </nav>
      <div className={marketStyles.detailLayout}>
        <main className={marketStyles.detailMain}>
          {detailTab === "数据概览" && <DatasetOverview item={item} />}
          {detailTab === "数据预览" && <DatasetPreview item={item} />}
          {detailTab === "字段与 Schema" && <DatasetSchema item={item} />}
          {detailTab === "使用与许可" && <DatasetUsage item={item} />}
          {detailTab === "版本与来源" && <DatasetVersions item={item} />}
        </main>
        <aside className={marketStyles.detailAside}>
          <section className={marketStyles.sideCard}>
            <header><h2><Info size={16} />数据集信息</h2></header>
            <dl>
              <dt>数据类型</dt><dd>{metadata.modality}</dd>
              <dt>当前版本</dt><dd>{item.version}</dd>
              <dt>文件格式</dt><dd>{metadata.formats.join(" / ")}</dd>
              <dt>数据规模</dt><dd>{formatRecords(metadata.recordCount)} 条 · {metadata.size}</dd>
              <dt>发布方</dt><dd>{item.provider}</dd>
              <dt>可见范围</dt><dd>{metadata.accessLevel}</dd>
              <dt>License</dt><dd>{metadata.license}</dd>
            </dl>
          </section>
          <section className={marketStyles.sideCard}>
            <header><h2><Download size={16} />获取前说明</h2></header>
            <div className={marketStyles.sideCardBody}>
              <div className={marketStyles.tipBox}><Info size={15} /><span>选择数据集时会锁定具体版本，并将来源与权限信息记录到科研任务。</span></div>
            </div>
          </section>
          <section className={marketStyles.sideCard}>
            <header><h2 className={marketStyles.relatedTitle}><Crown size={16} />相关数据集</h2></header>
            <div className={marketStyles.relatedList}>
              {related.map((dataset) => <button className={marketStyles.relatedItem} onClick={() => onRelated(dataset.id)} key={dataset.id}><Database size={16} /><span><strong>{dataset.name}</strong><small>{dataset.discipline} · {getDatasetMetadata(dataset).modality}</small></span><span className={marketStyles.miniAvailable}>{dataset.availability}</span></button>)}
            </div>
          </section>
        </aside>
      </div>
      <PermissionRequest objectId={item.id} open={permissionOpen} onClose={onPermissionClose} />
    </div>
  );
}

function DatasetOverview({ item }: { item: ReturnType<typeof filterDatasetCatalog>[number] }) {
  const metadata = getDatasetMetadata(item);
  return (
    <>
      <section className={marketStyles.detailCard}>
        <header><h2><FileText size={16} />数据集概览</h2></header>
        <div className={marketStyles.detailCardBody}>
          <p className={marketStyles.overviewText}>{item.description}数据已按当前元数据规则整理，具体科研结论仍需结合原始实验或计算记录复核。</p>
          <div className={marketStyles.attributeGrid}>
            <Attribute icon={<Layers3 size={18} />} title="学科领域" values={[item.discipline]} />
            <Attribute icon={<Database size={18} />} title="数据模态" values={[metadata.modality, ...metadata.formats.slice(0, 2)]} />
            <Attribute icon={<ShieldCheck size={18} />} title="访问与状态" values={uniqueLabels([metadata.accessLevel, item.availability])} />
          </div>
        </div>
      </section>
      <section className={marketStyles.detailCard}>
        <header><h2><CheckCircle2 size={16} />数据质量与适用性</h2></header>
        <div className={marketStyles.detailCardBody}>
          <div className={marketStyles.ioGrid}>
            <div className={marketStyles.ioCard}><CheckCircle2 size={18} /><div><strong>质量摘要</strong><p>{metadata.qualitySummary}</p></div></div>
            <div className={marketStyles.ioCard}><Database size={18} /><div><strong>适用场景</strong><ul>{metadata.purposes.map((purpose) => <li key={purpose}>{purpose}</li>)}</ul></div></div>
          </div>
        </div>
      </section>
    </>
  );
}

function Attribute({ icon, title, values }: { icon: React.ReactNode; title: string; values: string[] }) {
  return <div className={marketStyles.attributeCard}><span className={marketStyles.attributeIcon}>{icon}</span><div><strong>{title}</strong><span className={marketStyles.tagLine}>{values.map((value) => <span className={marketStyles.softTag} key={value}>{value}</span>)}</span></div></div>;
}

function DatasetPreview({ item }: { item: ReturnType<typeof filterDatasetCatalog>[number] }) {
  const metadata = getDatasetMetadata(item);
  const columns = metadata.fields.map((field) => field.name);
  return (
    <section className={marketStyles.detailCard}>
      <header><h2><Table2 size={16} />脱敏样例预览</h2><span className={styles.previewNote}>仅展示 {metadata.previewRows.length} 条原型样例</span></header>
      <div className={`${marketStyles.detailCardBody} ${styles.previewBody}`}>
        {metadata.previewRows.length ? (
          <div className={styles.previewWrap}>
            <table className={styles.previewTable}>
              <thead><tr>{columns.map((column) => <th key={column}>{metadata.fields.find((field) => field.name === column)?.label ?? column}</th>)}</tr></thead>
              <tbody>{metadata.previewRows.map((row, index) => <tr key={index}>{columns.map((column) => <td key={column}>{String(row[column] ?? "—")}</td>)}</tr>)}</tbody>
            </table>
          </div>
        ) : <div className={styles.previewUnavailable}>当前格式不支持在线预览，请查看字段与使用说明。</div>}
      </div>
    </section>
  );
}

function DatasetSchema({ item }: { item: ReturnType<typeof filterDatasetCatalog>[number] }) {
  const metadata = getDatasetMetadata(item);
  return (
    <section className={marketStyles.detailCard}>
      <header><h2><FileJson size={16} />字段与 Schema</h2><span className={styles.previewNote}>{metadata.fields.length} 个核心字段</span></header>
      <div className={styles.tableWrap}>
        <table className={marketStyles.fileTable}>
          <thead><tr><th>字段</th><th>含义</th><th>类型</th><th>单位</th><th>说明</th></tr></thead>
          <tbody>{metadata.fields.map((field) => <tr key={field.name}><td className={styles.code}>{field.name}</td><td>{field.label}</td><td>{field.type}</td><td>{field.unit ?? "—"}</td><td>{field.description}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

function DatasetUsage({ item }: { item: ReturnType<typeof filterDatasetCatalog>[number] }) {
  const metadata = getDatasetMetadata(item);
  return (
    <section className={marketStyles.detailCard}>
      <header><h2><ShieldCheck size={16} />使用与许可</h2></header>
      <div className={marketStyles.detailCardBody}>
        <div className={marketStyles.instructionGrid}>
          <div><strong>许可协议</strong><p>{metadata.license}</p></div>
          <div><strong>访问条件</strong><p>{metadata.accessLevel}。{item.availability === "可用" ? "当前空间可直接引用。" : "实际获取前需完成审批。"}</p></div>
          <div><strong>限制与责任</strong><p>{item.limitations}</p></div>
        </div>
        <div className={`${marketStyles.tipBox} ${styles.usageTip}`}><Info size={15} /><span>使用数据发表科研成果时，应引用具体版本并遵守数据许可、脱敏与项目权限要求。</span></div>
      </div>
    </section>
  );
}

function DatasetVersions({ item }: { item: ReturnType<typeof filterDatasetCatalog>[number] }) {
  const metadata = getDatasetMetadata(item);
  return (
    <>
      <section className={marketStyles.detailCard}>
        <header><h2><Database size={16} />版本记录</h2></header>
        <div className={marketStyles.detailCardBody}>
          <div className={marketStyles.versionList}>{item.versions.map((version) => <div className={marketStyles.versionRow} key={version.id}><strong>{version.number}</strong><span>{version.at.slice(0, 10)}</span><span>{version.description}</span><span className={marketStyles.statusTag}>{version.status}</span></div>)}</div>
        </div>
      </section>
      <section className={marketStyles.detailCard}>
        <header><h2><Info size={16} />来源与引用</h2></header>
        <div className={marketStyles.detailCardBody}>
          <dl className={styles.provenanceList}>
            <dt>数据来源</dt><dd>{metadata.provenance}</dd>
            <dt>建议引用</dt><dd>{metadata.citation}</dd>
            <dt>DOI / PID</dt><dd>{metadata.doi ?? "未分配"}</dd>
          </dl>
        </div>
      </section>
    </>
  );
}
