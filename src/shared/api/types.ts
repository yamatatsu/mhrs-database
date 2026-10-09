/** ETL が出力するデータセット名。 */
export type DatasetName = "weapons" | "armor_skills" | "items" | "monsters" | "quests";

/** スリム化済みデータ。構造はソース（mhrice.json）を踏襲する。 */
export type DatasetData = Record<string, unknown>;

export interface ManifestDataset {
  name: DatasetName;
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
