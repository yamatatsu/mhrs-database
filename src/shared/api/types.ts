/** スリム化済みデータ。構造はソース（mhrice.json）を踏襲する。 */
export type DatasetData = Record<string, unknown>;

export interface ManifestDataset {
  /** 出力 id（拡張子なし）。例: "weapons/great_sword" */
  id: string;
  /** 出力ファイルパス。例: "weapons/great_sword.json.gz" */
  file: string;
  bytes: number;
  rawBytes: number;
  keys: number;
}

export interface Manifest {
  source: string;
  generatedAt: string;
  datasets: ManifestDataset[];
}
