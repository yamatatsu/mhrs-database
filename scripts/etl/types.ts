/** 1 つの出力ファイル（拡張子なしの id とデータ）。 */
export interface DatasetFile {
  /** 出力ベース名。ディレクトリを含められる（例: "weapons/great_sword/index"）。 */
  id: string;
  /** 出力する JSON 値。配列も可（武器の一覧インデックス等）。 */
  data: unknown;
  /**
   * manifest.json に記録するか（既定 true）。
   * 武器 1 件ごとの詳細など大量に生成するファイルは false にして manifest を肥大化させない。
   */
  listed?: boolean;
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
  /**
   * スリム化・テスト除外・最適化の本体。出力ファイルの一覧を返す。
   * `group` は `match` が引き受けたキーだけを集めたバケット。
   * `raw` は mhrice.json 全体で、他カテゴリのキーを横断参照する場合に使う
   * （例: items の「入手方法」は monster_lot / maps を参照する）。
   */
  transform: (group: Record<string, unknown>, raw: Record<string, unknown>) => DatasetFile[];
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
