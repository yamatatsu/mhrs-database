import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { gzipSync } from "node:zlib";
import type { DatasetFile, DatasetOutput } from "./types.ts";

/** 1 出力ファイルを gzip 圧縮して書き出し、manifest 用のメタ情報を返す。 */
export async function writeDataset(file: DatasetFile, outputDir: string): Promise<DatasetOutput> {
  const raw = Buffer.from(JSON.stringify(file.data), "utf-8");
  const gz = gzipSync(raw, { level: 9 });
  const path = join(outputDir, `${file.id}.json.gz`);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, gz);
  return {
    id: file.id,
    file: `${file.id}.json.gz`,
    bytes: gz.byteLength,
    rawBytes: raw.byteLength,
    keys: countKeys(file.data),
  };
}

/** 配列は要素数、オブジェクトはキー数を「おおよそのデータ量」として数える。 */
function countKeys(data: unknown): number {
  if (Array.isArray(data)) return data.length;
  if (data !== null && typeof data === "object") return Object.keys(data).length;
  return 0;
}
