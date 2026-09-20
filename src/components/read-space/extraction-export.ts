// Small, dependency-free OpenXML workbook writer. Files are stored in a valid ZIP
// container; exports include a separate provenance sheet rather than a fake .xls.
export type SheetCell = string | number;
const encoder = new TextEncoder();
const escapeXml = (value: string) => value.replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]!);
function crc32(data: Uint8Array) { let crc = -1; for (const byte of data) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ -1) >>> 0; }
function bytes(size: number) { const value = new Uint8Array(size); return { value, view: new DataView(value.buffer) }; }
function zip(files: Record<string, string>) {
  const chunks: Uint8Array[] = []; const directories: Uint8Array[] = []; let offset = 0;
  for (const [path, text] of Object.entries(files)) {
    const name = encoder.encode(path); const data = encoder.encode(text); const crc = crc32(data);
    const local = bytes(30 + name.length); const l = local.view;
    l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint32(14, crc, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, name.length, true); local.value.set(name, 30);
    const central = bytes(46 + name.length); const c = central.view;
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true); central.value.set(name, 46);
    chunks.push(local.value, data); directories.push(central.value); offset += local.value.length + data.length;
  }
  const end = bytes(22); end.view.setUint32(0, 0x06054b50, true); end.view.setUint16(8, directories.length, true); end.view.setUint16(10, directories.length, true); end.view.setUint32(12, directories.reduce((sum, item) => sum + item.length, 0), true); end.view.setUint32(16, offset, true);
  const all = [...chunks, ...directories, end.value]; const output = new Uint8Array(all.reduce((sum, item) => sum + item.length, 0)); let position = 0; for (const item of all) { output.set(item, position); position += item.length; } return output;
}
function columnName(index: number): string { let result = ''; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result; }
export function workbookBytes(sheets: { name: string; rows: SheetCell[][] }[]) {
  const files: Record<string, string> = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`,
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map((s, i) => `<sheet name="${escapeXml(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`,
  };
  sheets.forEach((sheet, i) => { files[`xl/worksheets/sheet${i + 1}.xml`] = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheet.rows.map((row, r) => `<row r="${r + 1}">${row.map((cell, col) => { const ref = `${columnName(col)}${r + 1}`; return typeof cell === 'number' && Number.isFinite(cell) ? `<c r="${ref}"><v>${cell}</v></c>` : `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell))}</t></is></c>`; }).join('')}</row>`).join('')}</sheetData></worksheet>`; });
  return zip(files);
}
export function downloadWorkbook(name: string, sheets: { name: string; rows: SheetCell[][] }[]) { const data = workbookBytes(sheets); const url = URL.createObjectURL(new Blob([data.buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
