# アイテムデータ仕様

`public/data/items/` とアイテム画面（`/items`）の仕様、および「アイテムがどこで手に入るか」の
データ調査結果をまとめる。ETL 全体の仕様は [data.md](./data.md)、共通の前処理は同 §2 を参照。

## 1. ファイル構成

```
public/data/items/
  row.json.gz              # 元の（ゲーム寄りの）構造。参考・再処理・武器の素材名解決用
  index.json.gz            # 一覧用の軽量インデックス（図鑑順、1,764 件）
  <アイテム id>.json.gz    # アイテム 1 件ごとの詳細（manifest 非掲載）
```

- `row`: 名称を持たない内部行・「なし」を除去した元構造。武器のレシピ素材名の解決
  （`loadItemNames`）もこのファイルを読む。
- `index`: 一覧ページが読む唯一のファイル。`id` / `name` / `rare` / `type` /
  `pl_max_count` / `sell_price` / `buy_price` / `craftable`。
- `<id>`: 詳細ページ用。名称・説明・素材カテゴリ・調合・購入・入手方法を join 済み。

## 2. 分類（`type_`）

`type_` は表示名へ解決する（未知の種別は生の値にフォールバック）。

| `type_`           | 表示名 | 件数  |
| ----------------- | ------ | ----- |
| `Material`        | 素材   | 1,199 |
| `OffcutsMaterial` | 端材   | 150   |
| `Antique`         | 骨董品 | 142   |
| `PayOff`          | 換金   | 108   |
| `Consume`         | 消耗品 | 77    |
| `Bullet`          | 弾     | 59    |
| `CarryPayOff`     | 運搬   | 19    |
| `Bottle`          | ビン   | 7     |
| `Tool`            | 道具   | 3     |

## 3. 詳細ファイルの項目

- 基本: `id` / `name` / `rare` / `type` / `pl_max_count` / `sell_price` / `buy_price`。
- `material_categories`: 素材カテゴリ名（例: "鉱石素材"・"鎌鼬竜素材"）。`items.param` の
  `material_category` はタグ付き union で、`{ LrHr: v }` → `material_category_msg` の
  `ICT_Name_<v + 1>`、`{ Mr: v }` → `material_category_msg_mr` の `ICT_Name_<v + 200>` に対応する。
- `description`: 説明文（リッチテキストタグ除去済み）。無い場合は `null`。
- `mix_as_product`: このアイテムを作る調合レシピ（材料名・完成品の個数）。`item_mix` から解決。
- `mix_as_ingredient`: このアイテムを材料に使う調合レシピ（相方の材料名・完成品名・個数）。
- `shop`: 雑貨屋の購入条件（`village` / `hall` / `mr` の★進度）。`item_shop` に無い場合は `null`。
- `monster_rewards`: モンスター報酬の入手経路（§5）。
- `gather_sources`: フィールド採取の入手経路（§6）。

## 4. 入手経路（データ調査結果）

アイテムの入手経路は用途別に複数のテーブルへ分散している。実装状況は次のとおり。

| 入手経路       | 主なテーブル                                                                                          | 内容                                                           | 実装状況              |
| -------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------- |
| モンスター報酬 | `monster_lot` / `monster_lot_mr`                                                                      | モンスター×ランクごとに、報酬種別別の item id・個数・確率      | **実装済**（§5）      |
| フィールド採取 | `item_pop_lot` + `maps` + `map_name`                                                                  | `pop_id` ごとの下位/上位/MR 抽選と、各マップの採取ポイント配置 | **実装済**（§6）      |
| 雑貨屋         | `item_shop` / `item_shop_lot`                                                                         | 販売ラインナップと解放条件                                     | **実装済**（`shop`）  |
| 調合           | `item_mix`                                                                                            | 材料 → 完成品                                                  | **実装済**（`mix_*`） |
| クエスト報酬   | `reward_id_lot_table` / `_mr` + `quest_data_for_reward` / `_mr`                                       | 報酬テーブル id → アイテム抽選、クエスト → 報酬テーブル        | 未実装                |
| 傀異化報酬     | `mystery_reward_item` / `random_mystery_reward_*`                                                     | 傀異化モンスター×レベル帯ごとの報酬アイテムと確率              | 未実装                |
| 交換・交易     | `trade` / `trade_rare` / `trade_dust` / `trade_feature` / `exchange_item` / `mystery_labo_trade_item` | 交易船・交換所・傀異研究所の品と `cost`・解放条件              | 未実装                |
| 支給品         | `supply_data` / `supply_data_mr`                                                                      | クエストごとの支給品                                           | 未実装                |
| DLC            | `item_pack` / `slc_item_pack`                                                                         | アイテムパック                                                 | 未実装                |
| 闘技大会       | `time_attack_reward` → `reward_id_lot_table`                                                          | タイムアタック報酬                                             | 未実装                |
| オトモ         | `monster_lot.otomo_reward_*`                                                                          | 用途不明（対応する表示名が無い）                               | 対象外                |

## 5. モンスター報酬（`monster_rewards`）

### 5.1 元データ

`monster_lot`（下位・上位、133 行）と `monster_lot_mr`（マスター、115 行）。1 行が
**モンスター（`em_types`）× ランク（`quest_rank`）** に対応し、報酬種別ごとに
`*_reward_item_id_list` / `*_reward_num_list` / `*_reward_probability_list`（各 10 枠 × 複数ブロック）
を持つ。

報酬種別の表示名はハンターノートのメッセージ（`hunter_note_msg` の
`HN_Hunternote_ML_Tab_04_Reward_*`）に合わせる。

| フィールド接頭辞     | 表示名         |
| -------------------- | -------------- |
| `target_reward`      | ターゲット報酬 |
| `capture_reward`     | 捕獲報酬       |
| `parts_break_reward` | 部位破壊報酬   |
| `hagitory_reward`    | 剥ぎ取り素材   |
| `drop_reward`        | 落とし物       |

- `drop_reward_*` は 60 枠で、先頭から 10 枠ごとに `drop_reward_type_list`（`DropItem` /
  `DropItem2` …）のサブテーブルになっている。表示上は 1 つの「落とし物」にまとめる。
- `otomo_reward_*` は全行に存在するが、ハンターノートに対応する表示名が無く用途が不明なため
  **対象外**とする。

### 5.2 逆引きと出力

`em_types.Em`（＝モンスター詳細の id）から `monster_names` / `monster_names_mr`
（`EnemyIndex<enemy_type>`）で名前を引く。大型モンスター（`monsters`）は詳細ページへ
リンク可、小型モンスター（`small_monsters`）は名前のみ（`linkable: false`）。

`items/<id>.json.gz` の `monster_rewards` は次の形（1 モンスター × 1 ランクごと）。

```jsonc
[
  {
    "monster_id": 98,
    "monster_name": "オサイズチ",
    "linkable": true,
    "rank": "Low", // "Low" | "High" | "Master"
    "rewards": [
      { "kind": "target", "num": 1, "probability": 21 },
      { "kind": "hagitory", "num": 1, "probability": 43 },
      // kind: "target" | "capture" | "parts_break" | "hagitory" | "drop"
    ],
  },
]
```

並び順はランク（下位→上位→マスター）→ 最大確率の降順 → 名前。同じ報酬種別に複数エントリが
ある場合（落とし物のサブテーブルなど）はそのまま複数行で持つ。

## 6. フィールド採取（`gather_sources`）

### 6.1 元データ

- `item_pop_lot`: `pop_id` × `field_type` ごとの採取抽選。`lower_*` / `upper_*` / `master_*`
  （下位・上位・マスター）の id・個数・確率（各 10 枠）を持つ。
- `maps`: マップ（`map_no`）ごとの `pops`。採取ポイントは
  `kind.Item.behavior.pop_id` で `item_pop_lot` を参照する。
- `field_type` は **`map_no`**（マップ固有の抽選）で、`-1` は既定。同じ `pop_id` でも
  マップによって抽選が変わるため、`field_type = map_no` があればそれを、無ければ `-1` を使う。

### 6.2 マップ名

`map_name` の `Stage_Name_<map_no>` から引く（1 大社跡 / 2 砂原 / 3 水没林 / 4 寒冷群島 /
5 溶岩洞 / 7 翡葉の砦 / 9 獄泉郷 / 10 闘技場 / 11 龍宮砦跡）。MR マップ（12〜15）は
`map_name` に対応が無いため固定表を使う（クエスト名から確認済み）。

| `map_no` | 名前       |
| -------- | ---------- |
| 12       | 密林       |
| 13       | 城塞高地   |
| 14       | 塔の秘境   |
| 15       | 淵劫の奈落 |

> `pop_category`（採取ポイントの種別）には名称テーブルが存在しないため、種別は表示しない。

### 6.3 逆引きと出力

`items/<id>.json.gz` の `gather_sources` は次の形（1 ランク × 1 マップごと）。

```jsonc
[
  {
    "rank": "Low",
    "map": "大社跡",
    "probabilities": [40, 30, 20, 10], // 採取ポイント種別ごとの確率（重複除去・降順）
  },
]
```

並び順はランク（下位→上位→マスター）→ `map_no` 昇順。

## 7. クロスデータセット参照

「入手方法」は他カテゴリのキー（`monster_lot*` / `monster_names*` / `maps` / `map_name`）を
参照するため、ETL の `Dataset.transform(group, raw)` に mhrice.json 全体（`raw`）を渡す
（[data.md](./data.md) §4）。items の `transform` は `group`（items 系キー）に加えて `raw` から
これらのキーを読む。出力には items 系キーのみを含む。

## 8. フロントエンド

- **型・定数**: `src/pages/items/model/items.ts`（`ItemIndexItem` / `ItemDetail` /
  `ItemMonsterReward` / `ItemGatherSource`、`itemRankLabels` / `itemRewardKindLabels`）。
- **読み込み**: `src/pages/items/api/load-item-list.ts` / `load-item-detail.ts` が
  `items/index` と `items/<id>` を読む。
- **一覧**: `src/pages/items/ui/ItemsPage.tsx`（名前検索・分類フィルタ付き `DataTable`、
  カラムは `item-columns.tsx`）。行クリックで詳細へ。
- **詳細**: `src/pages/items/ui/ItemDetailPage.tsx` が基本情報・素材カテゴリ・説明・調合・
  **モンスター報酬**（モンスターは `/monsters/$monsterId` へリンク）・**フィールド採取**・
  購入条件を表示する。
- **ルーティング**: `src/app/routes/items.index.tsx` → `/items`、
  `src/app/routes/items.$itemId.tsx` → `/items/$itemId`。

## 9. 今後の候補

- クエスト報酬（`reward_id_lot_table` + `quest_data_for_reward` + クエストデータの join）。
- 傀異化報酬（`mystery_reward_item`）。
- 交換・交易（`trade*` / `exchange_item` / `mystery_labo_trade_item`）。解放条件が絡むため工数増。
- 支給品・DLC パック・闘技大会報酬。
- 採取ポイント種別（`pop_category`）の名称。名称テーブルが無いため、対応表を用意できれば表示可能。
