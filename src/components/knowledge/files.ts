const databaseName = 'ai4s-knowledge-files-v1';
const storeName = 'files';
function openFiles(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('当前浏览器不支持本地文件保存，请使用普通浏览窗口。')); return; }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('无法打开本地文件存储，请检查浏览器存储权限。'));
  });
}
export async function putFileBlob(id: string, blob: Blob): Promise<void> {
  const database = await openFiles();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    transaction.objectStore(storeName).put(blob, id);
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(new Error('文件保存失败，可能是浏览器存储空间不足。')); };
    transaction.onabort = () => { database.close(); reject(new Error('文件保存被中断，请重试。')); };
  });
}
export async function getFileBlob(id: string): Promise<Blob | undefined> {
  const database = await openFiles();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result instanceof Blob ? request.result : undefined);
    request.onerror = () => reject(new Error('无法读取原始文件。'));
    transaction.oncomplete = () => database.close();
  });
}

export const supportedExtensions = new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'md', 'markdown', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'gif']);
export const textExtensions = new Set(['txt', 'md', 'markdown', 'csv']);
export function extensionOf(name: string) { return name.split('.').pop()?.toLowerCase() ?? ''; }
export function validateFile(file: File) {
  if (!supportedExtensions.has(extensionOf(file.name))) throw new Error(`${file.name}：不支持此文件格式。`);
  if (!file.size) throw new Error(`${file.name}：文件为空。`);
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name}：单个文件不能超过 25 MB。`);
}
