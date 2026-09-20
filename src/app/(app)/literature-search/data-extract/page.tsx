'use client';

import React, { useState } from 'react';
import {
  ArrowLeft, Upload, Table2, LineChart, Download, Settings2,
  FileSpreadsheet, Crosshair, Move, CheckCircle2, AlertCircle,
  ZoomIn, ZoomOut, RotateCcw, Copy, Trash2, Plus, Minus
} from 'lucide-react';
import Link from 'next/link';

type ExtractTab = 'table' | 'chart';
type ExtractStatus = 'idle' | 'processing' | 'done' | 'error';

/* ─── Mock Table Data ─── */
const mockTableData = {
  title: 'Table 2 - Catalytic performance of Ni-Mo/Al₂O₃ with different P/Mo ratios',
  headers: ['P/Mo ratio', 'DBT conversion (%)', 'Selectivity DDS (%)', 'Selectivity HYD (%)', 'BET surface (m²/g)', 'MoS₂ slab length (nm)'],
  rows: [
    ['0.0', '75.2', '68.3', '31.7', '186', '5.8'],
    ['0.1', '82.1', '62.5', '37.5', '192', '5.2'],
    ['0.3', '91.6', '55.2', '44.8', '198', '4.6'],
    ['0.5', '98.3', '48.7', '51.3', '205', '3.9'],
    ['0.7', '93.4', '50.1', '49.9', '201', '4.3'],
    ['1.0', '87.2', '54.8', '45.2', '189', '5.1'],
  ]
};

/* ─── Mock Chart Data ─── */
const mockChartData = {
  points: [
    { x: 0.0, y: 75.2, isKey: false },
    { x: 0.1, y: 82.1, isKey: false },
    { x: 0.2, y: 87.5, isKey: false },
    { x: 0.3, y: 91.6, isKey: true, label: '拐点' },
    { x: 0.4, y: 95.8, isKey: false },
    { x: 0.5, y: 98.3, isKey: true, label: '峰值' },
    { x: 0.6, y: 96.1, isKey: false },
    { x: 0.7, y: 93.4, isKey: false },
    { x: 0.8, y: 90.7, isKey: false },
    { x: 0.9, y: 88.9, isKey: false },
    { x: 1.0, y: 87.2, isKey: false },
  ],
  xLabel: 'P/Mo ratio',
  yLabel: 'DBT conversion (%)',
  title: 'Fig. 3 - Effect of P/Mo ratio on DBT conversion'
};

export default function DataExtractPage() {
  const [activeTab, setActiveTab] = useState<ExtractTab>('table');
  const [tableStatus, setTableStatus] = useState<ExtractStatus>('idle');
  const [chartStatus, setChartStatus] = useState<ExtractStatus>('idle');
  const [extractedTable, setExtractedTable] = useState<typeof mockTableData | null>(null);
  const [extractedChart, setExtractedChart] = useState<typeof mockChartData | null>(null);
  const [numPoints, setNumPoints] = useState(10);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [tableData, setTableData] = useState(mockTableData);

  /* Table Extraction */
  const handleExtractTable = () => {
    setTableStatus('processing');
    setTimeout(() => {
      setExtractedTable(mockTableData);
      setTableData(mockTableData);
      setTableStatus('done');
    }, 2000);
  };

  /* Chart Extraction */
  const handleExtractChart = () => {
    setChartStatus('processing');
    setTimeout(() => {
      setExtractedChart(mockChartData);
      setChartStatus('done');
    }, 2500);
  };

  /* Sample points with fixed count */
  const getSampledPoints = () => {
    if (!extractedChart) return [];
    const pts = extractedChart.points;
    const step = (pts.length - 1) / (numPoints - 1);
    const sampled = [];
    for (let i = 0; i < numPoints; i++) {
      const idx = Math.min(Math.round(i * step), pts.length - 1);
      sampled.push(pts[idx]);
    }
    return sampled;
  };

  /* Export CSV */
  const handleExportCsv = (data: { headers: string[]; rows: string[][] }, filename: string) => {
    const csvContent = [data.headers.join(','), ...data.rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* Export chart data as CSV */
  const handleExportChartCsv = () => {
    const points = getSampledPoints();
    const headers = [extractedChart?.xLabel ?? 'X', extractedChart?.yLabel ?? 'Y', '关键点'];
    const rows = points.map(p => [String(p.x), String(p.y), p.isKey ? p.label ?? '是' : '']);
    handleExportCsv({ headers, rows }, 'chart_data');
  };

  /* Cell edit */
  const handleCellEdit = (row: number, col: number, value: string) => {
    const newRows = [...tableData.rows];
    newRows[row] = [...newRows[row]];
    newRows[row][col] = value;
    setTableData({ ...tableData, rows: newRows });
    setEditingCell(null);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/literature-search" className="flex items-center gap-1 text-[13px] text-[var(--color-muted-foreground)] hover:text-[var(--color-blue)] transition-colors">
            <ArrowLeft className="w-4 h-4" />返回文献检索
          </Link>
          <div className="flex-1" />
          <span className="text-[14px] font-bold text-[var(--color-text)]">文献数据提取工具</span>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-6">
        <input id="source-data-file" type="file" accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0]?.name ?? null)} />
        <p className="mb-4 rounded-lg border border-line bg-white p-3 text-xs leading-6 text-muted-foreground">原型演示：可选择文件、编辑示例提取表格并导出 CSV（Excel 可打开）；未接入真实 PDF/OCR 解析。来源文件：{selectedFile ?? '未选择'}，原文页码与坐标待核验。</p>
        {/* File Upload Area */}
        <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] p-8 mb-6 text-center">
          <Upload className="w-10 h-10 text-[var(--color-muted-foreground)] mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-[var(--color-text)] mb-1">上传论文PDF或图片</h3>
          <p className="text-[13px] text-[var(--color-muted-foreground)] mb-4">支持 PDF、PNG、JPG 格式，将自动识别表格和图表</p>
          <div className="flex items-center justify-center gap-3">
            <button className="px-4 py-2 rounded-lg text-[13px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 transition-colors" onClick={() => document.getElementById('source-data-file')?.click()}>
              <Upload className="w-3.5 h-3.5 inline mr-1.5" />选择文件
            </button>
            <button className="px-4 py-2 rounded-lg text-[13px] border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)]/30 hover:text-[var(--color-blue)] transition-colors" onClick={() => { setSelectedFile('demo_catalyst.pdf'); }}>
              使用示例论文
            </button>
          </div>
          {selectedFile && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-blue)]/5 px-4 py-1.5 text-[13px] text-[var(--color-blue)]">
              <CheckCircle2 className="w-3.5 h-3.5" />{selectedFile}
            </div>
          )}
        </div>

        {/* Tab Switch */}
        <div className="flex gap-2 mb-6">
          <button className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${activeTab === 'table' ? 'bg-[var(--color-blue)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)]/20'}`} onClick={() => setActiveTab('table')}>
            <Table2 className="w-4 h-4" />表格数据提取
          </button>
          <button className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${activeTab === 'chart' ? 'bg-[var(--color-blue)] text-white' : 'bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-muted-foreground)] hover:border-[var(--color-blue)]/20'}`} onClick={() => setActiveTab('chart')}>
            <LineChart className="w-4 h-4" />曲线图取点
          </button>
        </div>

        {/* Table Extraction */}
        {activeTab === 'table' && (
          <div className="space-y-6">
            {/* Extract Button */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg text-[13px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 flex items-center gap-1.5 disabled:opacity-50" onClick={handleExtractTable} disabled={tableStatus === 'processing' || !selectedFile}>
                <Table2 className="w-3.5 h-3.5" />{tableStatus === 'processing' ? '正在识别表格...' : '提取表格数据'}
              </button>
              {tableStatus === 'done' && extractedTable && (
                <>
                  <button className="px-4 py-2 rounded-lg text-[13px] bg-[var(--color-green)] text-white hover:bg-[var(--color-green)]/90 flex items-center gap-1.5" onClick={() => handleExportCsv(tableData, 'table_data')}>
                    <Download className="w-3.5 h-3.5" />导出 Excel (CSV)
                  </button>
                  <span className="text-[12px] text-[var(--color-green)] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />已识别 {extractedTable.rows.length} 行 × {extractedTable.headers.length} 列</span>
                </>
              )}
            </div>

            {/* Processing animation */}
            {tableStatus === 'processing' && (
              <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/5 p-8 text-center">
                <div className="animate-pulse text-[14px] text-[var(--color-blue)] flex items-center justify-center gap-2">
                  <Table2 className="w-5 h-5" />正在分析PDF结构，识别表格区域...
                </div>
                <div className="mt-3 flex justify-center gap-4 text-[12px] text-[var(--color-muted-foreground)]">
                  <span>1. 解析PDF页面 ✓</span>
                  <span>2. 定位表格区域 ●</span>
                  <span>3. 识别单元格...</span>
                </div>
              </div>
            )}

            {/* Extracted Table */}
            {tableStatus === 'done' && extractedTable && (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[var(--color-text)]">{tableData.title}</span>
                  <span className="text-[11px] text-[var(--color-faint)]">双击单元格可编辑</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[var(--color-surface-2)]">
                        {tableData.headers.map((h, i) => (
                          <th key={i} className="px-4 py-2.5 text-left font-bold text-[var(--color-text)] whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.rows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 0 ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-surface-2)]/50'}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-4 py-2.5 text-[var(--color-text)] border-t border-[var(--color-line)]/50 whitespace-nowrap cursor-pointer hover:bg-[var(--color-blue)]/5"
                              onDoubleClick={() => { setEditingCell({ row: ri, col: ci }); setEditValue(cell); }}>
                              {editingCell?.row === ri && editingCell?.col === ci ? (
                                <input className="w-full px-1 py-0.5 border border-[var(--color-blue)] rounded text-[13px] focus:outline-none bg-[var(--color-surface)]"
                                  value={editValue} autoFocus
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={() => handleCellEdit(ri, ci, editValue)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleCellEdit(ri, ci, editValue); if (e.key === 'Escape') setEditingCell(null); }} />
                              ) : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {tableStatus === 'idle' && (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-12 text-center">
                <Table2 className="w-12 h-12 text-[var(--color-faint)] mx-auto mb-3" />
                <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1">表格数据提取</h4>
                <p className="text-[13px] text-[var(--color-muted-foreground)] max-w-md mx-auto">
                  上传论文PDF后，系统将自动识别其中的表格区域，提取结构化数据。支持多表格识别，提取后的数据可编辑并导出为Excel。
                </p>
              </div>
            )}
          </div>
        )}

        {/* Chart Extraction */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            {/* Extract Button */}
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 rounded-lg text-[13px] bg-[var(--color-blue)] text-white hover:bg-[var(--color-blue)]/90 flex items-center gap-1.5 disabled:opacity-50" onClick={handleExtractChart} disabled={chartStatus === 'processing' || !selectedFile}>
                <LineChart className="w-3.5 h-3.5" />{chartStatus === 'processing' ? '正在提取曲线...' : '提取曲线数据'}
              </button>
              {chartStatus === 'done' && extractedChart && (
                <>
                  <button className="px-4 py-2 rounded-lg text-[13px] bg-[var(--color-green)] text-white hover:bg-[var(--color-green)]/90 flex items-center gap-1.5" onClick={handleExportChartCsv}>
                    <Download className="w-3.5 h-3.5" />导出数据 (CSV)
                  </button>
                  <span className="text-[12px] text-[var(--color-green)] flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />已提取 {extractedChart.points.length} 个数据点</span>
                </>
              )}
            </div>

            {/* Processing animation */}
            {chartStatus === 'processing' && (
              <div className="rounded-xl border border-[var(--color-cyan)]/20 bg-[var(--color-cyan)]/5 p-8 text-center">
                <div className="animate-pulse text-[14px] text-[var(--color-cyan)] flex items-center justify-center gap-2">
                  <LineChart className="w-5 h-5" />正在识别曲线图，提取数据点...
                </div>
                <div className="mt-3 flex justify-center gap-4 text-[12px] text-[var(--color-muted-foreground)]">
                  <span>1. 定位图表区域 ✓</span>
                  <span>2. 标定坐标轴 ●</span>
                  <span>3. 追踪曲线...</span>
                </div>
              </div>
            )}

            {/* Chart Preview with Data Points */}
            {chartStatus === 'done' && extractedChart && (
              <div className="grid grid-cols-2 gap-6">
                {/* Chart Visualization */}
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[var(--color-text)]">{extractedChart.title}</span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 rounded hover:bg-[var(--color-surface-2)]"><ZoomIn className="w-4 h-4 text-[var(--color-muted-foreground)]" /></button>
                      <button className="p-1 rounded hover:bg-[var(--color-surface-2)]"><ZoomOut className="w-4 h-4 text-[var(--color-muted-foreground)]" /></button>
                      <button className="p-1 rounded hover:bg-[var(--color-surface-2)]"><RotateCcw className="w-4 h-4 text-[var(--color-muted-foreground)]" /></button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* SVG Chart */}
                    <svg viewBox="0 0 400 250" className="w-full h-auto">
                      {/* Grid */}
                      <line x1="50" y1="20" x2="50" y2="200" stroke="var(--color-line)" strokeWidth="1" />
                      <line x1="50" y1="200" x2="380" y2="200" stroke="var(--color-line)" strokeWidth="1" />
                      {[0, 1, 2, 3, 4].map(i => (
                        <line key={`h${i}`} x1="50" y1={200 - i * 45} x2="380" y2={200 - i * 45} stroke="var(--color-line)" strokeWidth="0.5" strokeDasharray="4,4" />
                      ))}
                      {/* Y axis labels */}
                      {['70', '80', '90', '100'].map((l, i) => (
                        <text key={`yl${i}`} x="45" y={200 - i * 45} textAnchor="end" fontSize="10" fill="var(--color-muted-foreground)">{l}</text>
                      ))}
                      {/* X axis labels */}
                      {['0', '0.2', '0.4', '0.6', '0.8', '1.0'].map((l, i) => (
                        <text key={`xl${i}`} x={50 + i * 66} y="215" textAnchor="middle" fontSize="10" fill="var(--color-muted-foreground)">{l}</text>
                      ))}
                      {/* Axis labels */}
                      <text x="215" y="240" textAnchor="middle" fontSize="11" fill="var(--color-muted-foreground)">{extractedChart.xLabel}</text>
                      <text x="15" y="110" textAnchor="middle" fontSize="11" fill="var(--color-muted-foreground)" transform="rotate(-90, 15, 110)">{extractedChart.yLabel}</text>
                      {/* Curve */}
                      <polyline
                        points={extractedChart.points.map(p => {
                          const x = 50 + (p.x / 1.0) * 330;
                          const y = 200 - ((p.y - 70) / 30) * 180;
                          return `${x},${y}`;
                        }).join(' ')}
                        fill="none" stroke="var(--color-blue)" strokeWidth="2"
                      />
                      {/* Data Points */}
                      {extractedChart.points.map((p, i) => {
                        const x = 50 + (p.x / 1.0) * 330;
                        const y = 200 - ((p.y - 70) / 30) * 180;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r={p.isKey ? 5 : 3.5} fill={p.isKey ? '#f59e0b' : 'var(--color-blue)'} stroke="white" strokeWidth="1.5" />
                            {p.isKey && <text x={x} y={y - 10} textAnchor="middle" fontSize="9" fill="#f59e0b" fontWeight="bold">{p.label}: {p.y}</text>}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </div>

                {/* Data Points Table */}
                <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--color-line)] flex items-center justify-between">
                    <span className="text-[13px] font-bold text-[var(--color-text)]">数据点</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[var(--color-muted-foreground)]">取点数量</span>
                      <div className="flex items-center gap-1">
                        <button className="w-6 h-6 rounded flex items-center justify-center border border-[var(--color-line)] hover:border-[var(--color-blue)]/30" onClick={() => setNumPoints(Math.max(3, numPoints - 1))}><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-[13px] font-bold text-[var(--color-blue)]">{numPoints}</span>
                        <button className="w-6 h-6 rounded flex items-center justify-center border border-[var(--color-line)] hover:border-[var(--color-blue)]/30" onClick={() => setNumPoints(Math.min(20, numPoints + 1))}><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-[400px]">
                    <table className="w-full text-[13px]">
                      <thead className="sticky top-0 bg-[var(--color-surface-2)]">
                        <tr>
                          <th className="px-4 py-2 text-left font-bold text-[var(--color-text)]">#</th>
                          <th className="px-4 py-2 text-left font-bold text-[var(--color-text)]">{extractedChart.xLabel}</th>
                          <th className="px-4 py-2 text-left font-bold text-[var(--color-text)]">{extractedChart.yLabel}</th>
                          <th className="px-4 py-2 text-left font-bold text-[var(--color-text)]">标注</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSampledPoints().map((p, i) => (
                          <tr key={i} className={`${p.isKey ? 'bg-[#f59e0b]/5' : i % 2 === 0 ? '' : 'bg-[var(--color-surface-2)]/50'} border-t border-[var(--color-line)]/50`}>
                            <td className="px-4 py-2 text-[var(--color-faint)]">{i + 1}</td>
                            <td className="px-4 py-2 text-[var(--color-text)] font-mono">{p.x.toFixed(2)}</td>
                            <td className="px-4 py-2 text-[var(--color-text)] font-mono">{p.y.toFixed(1)}</td>
                            <td className="px-4 py-2">
                              {p.isKey ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#f59e0b]/10 text-[#f59e0b] px-2 py-0.5 text-[11px] font-medium">
                                  <Crosshair className="w-3 h-3" />{p.label}
                                </span>
                              ) : (
                                <span className="text-[11px] text-[var(--color-faint)]">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Empty state */}
            {chartStatus === 'idle' && (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-12 text-center">
                <LineChart className="w-12 h-12 text-[var(--color-faint)] mx-auto mb-3" />
                <h4 className="text-[14px] font-bold text-[var(--color-text)] mb-1">曲线图数据取点</h4>
                <p className="text-[13px] text-[var(--color-muted-foreground)] max-w-md mx-auto mb-4">
                  上传论文PDF或图片后，系统将自动识别曲线图，标定坐标轴并提取数据点。支持固定数量均匀取点，可识别峰值、拐点等关键点。
                </p>
                <div className="flex flex-wrap justify-center gap-3 text-[12px] text-[var(--color-muted-foreground)]">
                  <span className="flex items-center gap-1"><Crosshair className="w-3.5 h-3.5 text-[var(--color-blue)]" />自动取点</span>
                  <span className="flex items-center gap-1"><Move className="w-3.5 h-3.5 text-[var(--color-cyan)]" />坐标标定</span>
                  <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-[#f59e0b]" />关键点识别</span>
                  <span className="flex items-center gap-1"><FileSpreadsheet className="w-3.5 h-3.5 text-[var(--color-green)]" />Excel导出</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
