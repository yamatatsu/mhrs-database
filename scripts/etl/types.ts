/** 1 つの出力ファイル（拡張子なしの id とデータ）。 */
export interface DatasetFile {
  /** 出力ベース名。ディレクトリを含められる（例: "weapons/great_sword"）。 */
  id: string;
  data: Record<string, unknown>;
}

/**
 * カテゴリごとの変換定義。カテゴリの追加・データ最適化は
 * `datasets/*.ts` に 1 ファイル追加し、ここを実装するだけで完結する。
 * 1 カテゴリが複数ファイルを出力できる（武器は武器種ごとに分割）。
 */
export interface Dataset {
  /** カテゴリ名（バケットのキー・manifest のグルーピングに使う）。 */
  name: string;
  /** mhrice.json のトップレベルキーをこのカテゴリが引き受けるかどうか。 */
  match: (key: string) => boolean;
  /** スリム化・テスト除外・最適化の本体。出力ファイルの一覧を返す。 */
  transform: (group: Record<string, unknown>) => DatasetFile[];
}

/** manifest.json に記録する 1 出力ファイル分のメタ情報。 */
export interface DatasetOutput {
  /** 出力 id（拡張子なし）。 */
  id: string;
  /** 出力ファイルパス（id + .json.gz）。 */
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
