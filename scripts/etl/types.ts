/** ETL が出力するデータセット名（= 出力ファイル名の元）。 */
export type DatasetName = "weapons" | "armor_skills" | "items" | "monsters" | "quests";

/**
 * カテゴリごとの変換定義。カテゴリの追加・データ最適化は
 * `datasets/*.ts` に 1 ファイル追加し、ここを実装するだけで完結する。
 */
export interface Dataset {
  /** 出力ファイル名・manifest のキー。 */
  name: DatasetName;
  /** mhrice.json のトップレベルキーをこの dataset が引き受けるかどうか。 */
  match: (key: string) => boolean;
  /** スリム化・テスト除外・最適化の本体。 */
  transform: (group: Record<string, unknown>) => Record<string, unknown>;
}

/** manifest.json に記録する 1 データセット分のメタ情報。 */
export interface DatasetOutput {
  name: DatasetName;
  file: string;
  /** gzip 後のバイト数。 */
  bytes: number;
  /** 圧縮前の JSON バイト数。 */
  rawBytes: number;
  /** トップレベルキー数（おおよそのデータ量の目安）。 */
  keys: number;
}

export interface Manifest {
  source: string;
  generatedAt: string;
  datasets: DatasetOutput[];
}
