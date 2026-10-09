import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { CACHE_PATH, MHRICE_URL } from "./config.ts";

/**
 * mhrice.json を取得する。既にキャッシュがあればそれを使う。
 * データはゲーム最終版で凍結されているため、通常は初回のみダウンロードする。
 */
export async function fetchMhrice(): Promise<Record<string, unknown>> {
  if (existsSync(CACHE_PATH)) {
    console.log(`using cache: ${CACHE_PATH}`);
  } else {
    console.log(`downloading ${MHRICE_URL} -> ${CACHE_PATH}`);
    const response = await fetch(MHRICE_URL);
    if (!response.ok) {
      throw new Error(`failed to download mhrice.json: ${response.status} ${response.statusText}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(CACHE_PATH, buffer);
  }

  const text = await readFile(CACHE_PATH, "utf-8");
  return JSON.parse(text) as Record<string, unknown>;
}
