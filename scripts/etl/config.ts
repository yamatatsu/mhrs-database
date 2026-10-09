import { fileURLToPath } from "node:url";

/** データソース。2024-02 ビルドで更新停止しており、再実行は原則不要。 */
export const MHRICE_URL = "https://mhrise.mhrice.info/mhrice.json";

/** ダウンロードした mhrice.json のキャッシュ先。 */
export const CACHE_PATH = process.env.MHRICE_CACHE ?? "/tmp/mhrice.json";

/** 生成物の出力先（リポジトリの public/data）。 */
export const OUTPUT_DIR = fileURLToPath(new URL("../../public/data/", import.meta.url));
