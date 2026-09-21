export interface StorageWriter {
  setItem: (key: string, value: string) => void;
}

export function persistValue<T>(storage: StorageWriter, key: string, value: T) {
  storage.setItem(key, JSON.stringify(value));
}
