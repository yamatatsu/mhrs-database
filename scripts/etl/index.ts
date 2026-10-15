import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { MHRICE_URL, OUTPUT_DIR } from "./config.ts";
import { datasets } from "./datasets/index.ts";
import { writeDataset } from "./output.ts";
import { fetchMhrice } from "./source.ts";
import type { DatasetOutput, Manifest } from "./types.ts";

/**
 * mhrice.json を取得し、カテゴリ別にスリム化・不要データ除去して
 * public/data/*.json.gz と manifest.json を生成する。
 *
 *   vp run etl
 */
async function main(): Promise<void> {
  const refresh = process.argv.includes("--refresh") || process.env.MHRICE_REFRESH === "1";
  const raw = await fetchMhrice({ refresh });
  console.log(`loaded ${Object.keys(raw).length} top-level keys`);

  // 生成物のみを置くディレクトリなので、古い出力（構成変更前のファイル等）を消してから書く。
  await rm(OUTPUT_DIR, { recursive: true, force: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const buckets = bucketByDataset(raw);
  const outputs: DatasetOutput[] = [];
  let totalBytes = 0;

  for (const dataset of datasets) {
    const group = buckets[dataset.name] ?? {};
    for (const file of dataset.transform(group, raw)) {
      const output = await writeDataset(file, OUTPUT_DIR);
      totalBytes += output.bytes;
      if (file.listed === false) continue;
      outputs.push(output);
      console.log(
        `  ${output.file.padEnd(26)} keys=${String(output.keys).padStart(3)}  ` +
          `raw=${(output.rawBytes / 1e6).toFixed(2)}MB  gz=${(output.bytes / 1e6).toFixed(2)}MB`,
      );
    }
  }

  const manifest: Manifest = {
    source: MHRICE_URL,
    generatedAt: new Date().toISOString(),
    datasets: outputs,
  };
  await writeFile(join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`total: ${(totalBytes / 1e6).toFixed(2)}MB -> ${OUTPUT_DIR}`);
}

/** トップレベルキーを各 dataset に振り分ける。未マッチ（misc / otomo 等）は破棄。 */
function bucketByDataset(raw: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const buckets: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(raw)) {
    const dataset = datasets.find((candidate) => candidate.match(key));
    if (!dataset) continue;
    const bucket = buckets[dataset.name] ?? {};
    bucket[key] = value;
    buckets[dataset.name] = bucket;
  }
  return buckets;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
