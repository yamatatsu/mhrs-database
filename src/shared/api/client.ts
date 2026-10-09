import type { DatasetData, DatasetName, Manifest } from "./types";

const BASE_URL = import.meta.env.BASE_URL;

/** 同一データセットの多重取得を防ぐためのメモリキャッシュ。 */
const datasetCache = new Map<string, Promise<unknown>>();

async function fetchGzipJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return JSON.parse(await decodeBody(arrayBuffer)) as T;
}

/**
 * レスポンスボディを文字列にデコードする。
 * サーバが Content-Encoding: gzip を付ける場合（Vite dev 等）は fetch が自動展開するため、
 * gzip マジックバイトの有無で二重展開を防ぐ。
 */
async function decodeBody(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) {
    return new TextDecoder().decode(bytes);
  }
  const stream = new Blob([arrayBuffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

/**
 * カテゴリ単位のデータを取得する。初回のみ通信し、以降はキャッシュを返す。
 * 必要なページで必要なカテゴリだけを呼び出す想定。
 */
export function loadDataset<T = DatasetData>(name: DatasetName): Promise<T> {
  const url = `${BASE_URL}data/${name}.json.gz`;
  let promise = datasetCache.get(url);
  if (!promise) {
    promise = fetchGzipJson<T>(url);
    datasetCache.set(url, promise);
  }
  return promise as Promise<T>;
}

/** 生成物のメタ情報（サイズ・生成時刻など）を取得する。 */
export async function loadManifest(): Promise<Manifest> {
  const response = await fetch(`${BASE_URL}data/manifest.json`);
  if (!response.ok) {
    throw new Error(`failed to fetch manifest: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Manifest;
}
