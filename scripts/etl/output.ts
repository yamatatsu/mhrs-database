import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import type { DatasetName, DatasetOutput } from "./types.ts";

/** 1 データセットを gzip 圧縮して出力し、manifest 用のメタ情報を返す。 */
export async function writeDataset(
  name: DatasetName,
  data: Record<string, unknown>,
  outputDir: string,
): Promise<DatasetOutput> {
  const raw = Buffer.from(JSON.stringify(data), "utf-8");
  const gz = gzipSync(raw, { level: 9 });
  const file = `${name}.json.gz`;
  await writeFile(join(outputDir, file), gz);
  return {
    name,
    file,
    bytes: gz.byteLength,
    rawBytes: raw.byteLength,
    keys: Object.keys(data).length,
  };
}
