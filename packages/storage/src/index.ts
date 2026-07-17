import type {Readable} from "node:stream";

export interface StorageDriver {
  put(key: string, data: Readable): Promise<void>;
  read(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
}
