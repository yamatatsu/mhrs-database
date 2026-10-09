# mhrs-database

モンスターハンターライズ / サンブレイクのデータベースサイト。GitHub Pages で
`https://<user>.github.io/mhrs-database/` にホストする。

開発・構成の詳細は [AGENTS.md](./AGENTS.md) を参照。

## データ

- データソース: [MHRice](https://mhrise.mhrice.info/)（`https://mhrise.mhrice.info/mhrice.json`、2024-02 版）
- ETL: `vp run etl` がカテゴリ別の `public/data/*.json.gz` を生成する。**生成物はコミット対象**。
- 抽出時にテスト用・未使用データ（`#Rejected#` 等）を除外している。

## クレジット

- モンスターハンターライズのデータは [MHRice](https://mhrise.mhrice.info/)（[wwylele/mhrice](https://github.com/wwylele/mhrice)、Apache-2.0）の公開 JSON を利用している。
- ゲームデータの著作権は株式会社カプコンに帰属する。
- `public/data/` のコミット物は個人利用（非商用のファンサイト）を前提とし、権利者からの要請があれば対応する。
