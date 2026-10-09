import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { CACHE_PATH, MHRICE_URL } from "./config.ts";

export interface FetchMhriceOptions {
  /** true のとき、キャッシュがあっても再ダウンロードする。既定は false（元サーバーに負荷をかけない）。 */
  refresh?: boolean;
}

/**
 * mhrice.json を取得する。
 * 既定では /tmp のキャッシュがあれば必ず再利用し、再ダウンロードしない
 * （データはゲーム最終版で凍結済み。元サーバーへの負荷を避けるため）。
 * 明示的に取り直したい場合のみ refresh: true を渡す。
 */
export async function fetchMhrice(
  options: FetchMhriceOptions = {},
): Promise<Record<string, unknown>> {
  const hasCache = existsSync(CACHE_PATH);
  if (hasCache && !options.refresh) {
    console.log(`using cache: ${CACHE_PATH}（再ダウンロードしません。更新するには --refresh）`);
  } else {
    if (options.refresh && hasCache) {
      console.log(`refreshing cache: ${CACHE_PATH}`);
    }
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
