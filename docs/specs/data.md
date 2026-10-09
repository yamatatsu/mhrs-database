# データ仕様

MHRS Database が配信するデータ（`public/data/`）の仕様をまとめる。

## 1. 概要

- **出典**: [mhrice.json](https://mhrise.mhrice.info/mhrice.json)（MHRice。2024-02 ビルドで更新停止＝実質凍結）。
- **生成**: `scripts/etl` の ETL パイプライン。
  - `vp run etl` で生成（既定では `/tmp/mhrice.json` のキャッシュを再利用。再取得は `--refresh`）。
  - 出力先は `public/data/`（実行時に一度 `rm -rf` してから全生成する）。
- **配信**: 静的配信（GitHub Pages、`base = /mhrs-database/`）。サーバー処理はなし。
- **形式**: JSON を gzip（level 9）した `*.json.gz`。トップレベルに `manifest.json`（非圧縮）。

## 2. 共通の前処理（baseTransform）

`scripts/etl/slim.ts` と `scripts/etl/filter.ts`。全データセットに適用される。

- **`slimValue`**
  - 名称系 `content` 配列を 32 言語 → 先頭 2 要素（日本語・英語）に削減。
  - メタ列 `guid` / `hash` / `attributes` / `attribute_headers` を除去。
- **`dropRejectedEntries`**: `#Rejected#` を含む未使用エントリを再帰的に除去。

## 3. manifest.json

```jsonc
{
  "source": "https://mhrise.mhrice.info/mhrice.json",
  "generatedAt": "2026-10-09T10:15:27.041Z",
  "datasets": [
    {
      "id": "weapons/great_sword/index",
      "file": "weapons/great_sword/index.json.gz",
      "bytes": 6162,
      "rawBytes": 37242,
      "keys": 280,
    },
    // ...
  ],
}
```

- `datasets[].id` は拡張子なしの出力 id、`file` は実ファイルパス、`bytes`/`rawBytes` は gzip 後／前のバイト数、`keys` は配列なら要素数・オブジェクトならキー数。
- **武器 1 件ごとの詳細（`weapons/<type>/<id>`）は `listed: false` として manifest に含めない**（数千ファイルになるため）。存在は `index` の `id` から辿れる。

## 4. データセット一覧

`scripts/etl/datasets/index.ts` に登録されたカテゴリのみ出力される（未登録のトップレベルキーは破棄）。

| データセット | ファイル               | 内容                               |
| ------------ | ---------------------- | ---------------------------------- |
| weapons      | `weapons/**`           | 武器（本ドキュメントの主対象。§5） |
| armor_skills | `armor_skills.json.gz` | 防具・スキル・装飾品・百竜スキル   |
| items        | `items.json.gz`        | アイテム・素材・調合・虫           |
| monsters     | `monsters.json.gz`     | モンスター・小型モンスター・図鑑   |
| quests       | `quests.json.gz`       | クエスト・報酬・供給               |

weapons 以外は **ゲーム内部テーブルをスリム化しただけ**の構造（トップレベルは元のキーをそのまま保持）。主なトップレベルキー:

- items: `items`, `items_name_msg`, `items_explain_msg`, `items_name_msg_mr`, `items_explain_msg_mr`, `material_category_msg`, `item_pop_lot`, `item_shop`, `item_mix`, `item_pack`, `insect*` ほか
- monsters: `monsters`, `small_monsters`, `monster_names`, `monster_aliases`, `monster_explains`, `*_mr`, `monster_list`, `parts_type`, `species` ほか
- quests: `normal_quest_data`, `normal_quest_data_mr`, `dl_quest_data*`, `difficulty_rate*`, `reward_id_lot_table*`, `arena_quest`, `progress` ほか
- armor_skills: `armor`, `armor_series`, `armor_product`, `equip_skill`, `player_skill_*`, `hyakuryu_skill*`, `decorations*` ほか

## 5. 武器データ仕様

### 5.1 ファイル構成

```
public/data/weapons/
  common.json.gz                 # 全武器種で共有する系統名マスタ
  <武器種>/
    row.json.gz                  # 元の（ゲーム寄りの）構造。参考・再処理用
    index.json.gz                # 一覧用の軽量インデックス
    <武器 id>.json.gz            # 武器 1 件ごとの非正規化レコード
```

- `row`: ETL のフィルタ（§5.3）は適用済みだが、`base` の入れ子や enum 表現は**元のまま**。
- `index`: 一覧ページが読む唯一のファイル。軽量。
- `<id>`: 詳細ページ用。フラット化・正規化・join 済み（§5.5）。

### 5.2 武器種一覧

| id              | 表示名             | `idKey`        | `deep` |
| --------------- | ------------------ | -------------- | ------ |
| `great_sword`   | 大剣               | `GreatSword`   | true   |
| `long_sword`    | 太刀               | `LongSword`    | true   |
| `short_sword`   | 片手剣             | `ShortSword`   | true   |
| `dual_blades`   | 双剣               | `DualBlades`   | true   |
| `hammer`        | ハンマー           | `Hammer`       | true   |
| `horn`          | 狩猟笛             | `Horn`         | true   |
| `lance`         | ランス             | `Lance`        | true   |
| `gun_lance`     | ガンランス         | `GunLance`     | true   |
| `slash_axe`     | スラッシュアックス | `SlashAxe`     | true   |
| `charge_axe`    | チャージアックス   | `ChargeAxe`    | true   |
| `insect_glaive` | 操虫棍             | `InsectGlaive` | true   |
| `bow`           | 弓                 | `Bow`          | false  |
| `light_bowgun`  | ライトボウガン     | `LightBowgun`  | false  |
| `heavy_bowgun`  | ヘビィボウガン     | `HeavyBowgun`  | false  |

`deep` は `base_data.param[].base…` の階層差。近接は `base` が 4 段（`row.base.base.base` が性能）、弓・ガンナーは 3 段（`row.base.base` が性能）。

### 5.3 実在武器のフィルタ（tree ホワイトリスト）

`base_data.param` は **`tree`（派生ツリー）に登録された weapon id の集合**だけを残す。

- `tree` はゲームが「実在武器」として扱う id の**正解集合**。テスト武器（`カスタムT*` / `MR*テスト用` 等）や重ね着専用ダミー（`ロストコード＝*` / `ぬいぐるみ*`）はここに含まれない。
- 名称・説明マスタ（`name` / `name_mr` / `explain` / `explain_mr`）も同じ id 集合に絞る。
- `tree` が無い／空のときはデータを失わないよう何もしない（安全側）。
- 参考: 大剣は生 `base_data` 295 件 → tree 280 件（テスト 12・ダミー 2・未使用 1 を除外）。全 14 種で tree と完全一致する。

### 5.4 index スキーマ（`weapons/<type>/index.json.gz`）

`WeaponIndexItem[]`（`sort` 昇順＝派生ツリーの前順で整列済み）。

| フィールド | 型       | 説明                                             |
| ---------- | -------- | ------------------------------------------------ |
| `id`       | number   | 武器 id                                          |
| `name`     | string   | 武器名（日本語）                                 |
| `rarity`   | number   | レア度（`rare_type`）                            |
| `atk`      | number   | 攻撃力                                           |
| `series`   | string?  | 系統名（解決できた場合のみ。§5.8）               |
| `path`     | number[] | 根 → 自身の weapon id 配列（派生ツリー上の位置） |
| `sort`     | string   | 派生ツリーの前順ソートキー（§5.7）               |

```json
{
  "id": 340,
  "name": "霆剣ライゼクス",
  "rarity": 10,
  "atk": 320,
  "series": "鉱石素材派生",
  "path": [2, 3, 0, 1, 7, 8, 335, 338, 339, 340],
  "sort": "002000000100"
}
```

### 5.5 detail スキーマ（`weapons/<type>/<id>.json.gz`）

`base_data` の 1 行を**フラット化・正規化**し、名称・説明・レシピ・派生ツリー等を **join** した 1 オブジェクト。

**共通フィールド（`base_data` 由来）**

| フィールド               | 型                 | 説明                      |
| ------------------------ | ------------------ | ------------------------- |
| `id`                     | number             | 武器 id                   |
| `sort_id`                | number             | 内部ソート用 id           |
| `rare_type`              | number             | レア度                    |
| `model_id`               | number             | モデル id                 |
| `base_val`               | number             | 基本価値（生産費など）    |
| `buy_val`                | number             | 購入価格                  |
| `atk`                    | number             | 攻撃力                    |
| `critical_rate`          | number             | 会心率                    |
| `def_bonus`              | number             | 防御力ボーナス            |
| `main_element_type`      | string \| null     | 主属性（`null` は無属性） |
| `main_element_val`       | number             | 主属性値                  |
| `sharpness_val_list`     | number[]?          | 切れ味（近接のみ）        |
| `takumi_val_list`        | number[]?          | 匠（近接のみ）            |
| `hyakuryu_skill_id_list` | (number \| null)[] | 百竜スキル id             |
| `slot_num_list`          | number[]           | 装飾品スロット            |
| `hyakuryu_slot_num_list` | number[]           | 百竜スロット              |
| `custom_table_no`        | number             | カスタム強化テーブル番号  |
| `custom_cost`            | number             | カスタム強化コスト        |

**武器種固有フィールド**（該当武器種のみ）

| 武器種             | フィールド                                                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| 双剣               | `sub_element_type`, `sub_element_val`                                                                                                  |
| 狩猟笛             | `horn_melody_type_list`                                                                                                                |
| ガンランス         | `gun_lance_fire_type`, `gun_lance_fire_lv`                                                                                             |
| スラッシュアックス | `slash_axe_bottle_type`, `slash_axe_bottle_element_val`                                                                                |
| チャージアックス   | `charge_axe_bottle_type`                                                                                                               |
| 操虫棍             | `insect_glaive_insect_lv`                                                                                                              |
| 弓                 | `bow_bottle_power_up_type_list`, `bow_bottle_equip_flag_list`, `bow_default_charge_lv_limit`, `bow_charge_type_list`, `bow_curve_type` |
| ライトボウガン     | `rapid_shot_list`, `unique_bullet` ＋ ガンナー共通                                                                                     |
| ヘビィボウガン     | `heavy_bowgun_unique_bullet_type` ＋ ガンナー共通                                                                                      |
| ガンナー共通       | `fluctuation`, `reload`, `recoil`, `kakusan_type`, `bullet_equip_flag_list`, `bullet_num_list`, `bullet_type_list`                     |

**join フィールド**

| フィールド         | 型             | 説明                                       |
| ------------------ | -------------- | ------------------------------------------ |
| `name`             | string \| null | 武器名（`name` / `name_mr` を id で join） |
| `description`      | string \| null | 説明文（`explain` / `explain_mr`）         |
| `series`           | string \| null | 系統名（§5.8）                             |
| `recipes`          | object         | 生産・強化・加工レシピ（§5.5.1）           |
| `tree`             | object \| null | 派生ツリー上の位置（§5.5.2）               |
| `hyakuryu_buildup` | object \| null | 百竜強化（§5.5.3）                         |
| `chaos_critical`   | object \| null | 混沌会心（§5.5.4）                         |
| `overwear`         | object[]       | 重ね着（§5.5.5）                           |

#### 5.5.1 `recipes`

`product`（生産） / `change`（強化） / `process`（加工）を武器 id で join。各要素は `base` をフラット化・正規化したレシピ。該当がなければ `null`。

```jsonc
{
  "product": {
    "id": 20,
    "item_flag": null,
    "enemy_flag": 0,
    "progress_flag": 0,
    "item": [null, null, null, null],
    "item_num": [0, 0, 0, 0],
    "material_category": 3,
    "material_category_num": 1,
    "output_item": [null, null, null],
    "output_item_num": [0, 0, 0],
  },
  "change": null,
  "process": null,
}
```

- `item[]` / `output_item[]`: アイテム id（`null` は空き枠）。
- `material_category`: 素材カテゴリ id（`LrHr` / `Mr` タグは数値に正規化）。
- `product` / `process` は `output_item` を持つ。`change` は持たない。

#### 5.5.2 `tree`

```jsonc
{ "type": 95, "index": 0, "prev": null, "next": [133] }
```

- `type`: `tree_type`（系統 id。`"Ore"` は 0 相当）。`index`: ツリー内の位置。
- `prev` / `next`: `(type, index)` 参照を**武器 id に解決**したもの（`prev` は単一、`next` は順序付き配列）。

#### 5.5.3 `hyakuryu_buildup`

```jsonc
{
  "weapon_id": 26,
  "slot_type": 2,
  "buildup_id_list": [4, null, null, null, null, null, null, null, null, null],
}
```

#### 5.5.4 `chaos_critical`

```jsonc
{ "weapon": 462, "chaos_critical_num": -35 }
```

#### 5.5.5 `overwear`

```jsonc
[
  {
    "id": 135266315,
    "relative_id": 25,
    "sort_id": 1,
    "model_id": 135266315,
    "rare_type": 8,
    "product": {
      "id": 135266315,
      "item_flag": null,
      "item": [2870, null, null],
      "item_num": [1, 0, 0],
      "material_category": 0,
      "material_category_num": 10,
      "price": 3000,
    },
  },
]
```

### 5.6 正規化ルール

`flattenBase`（入れ子の解消）と `normalize`（enum・センチネル）を適用。

- **フラット化**: `base_data` / レシピの `base` 連鎖を辿り、`base` を除いた全キーを 1 段に統合する。近接（4 段）と弓・ガンナー（3 段）の差を吸収。
- **`"None"` → `null`**。
- **タグ付き union → 値**: キーが 1 つだけのオブジェクトを値に開く。
  - `{ "GreatSword": 132 }` → `132`、`{ "Skill": 9 }` → `9`、`{ "TreeType": 95 }` → `95`、`{ "Normal": 1021 }` → `1021`
  - 対象タグ: 各武器種の `idKey`、`Skill` / `Em` / `LrHr` / `Mr` / `Normal` / `TreeType` / `VillageProgress` / `HallProgress` / `MasterRankProgress`
- 配列・オブジェクトには再帰的に適用。

### 5.7 派生ツリーとソートキー

`tree` を辿って「兄弟順（ordinal）」ベースの前順ソートキーを生成する（`buildTreeIndex` / `treeSort`）。

1. 各ノードの親を `prev`、子の並びを `next_weapon_index_list` の順で取得。
2. 根から自身までの **weapon id パス** `path` と、**兄弟順パス** `order` を計算。
   - `order[i]` = その階層で親の子リストの何番目か。
3. ソートキー:
   ```
   sort = pad(根 id, idWidth) + pad(order[0], ordinalWidth) + pad(order[1], ordinalWidth) + …
   ```
   - `idWidth` = その武器種の最大 weapon id の桁数（動的）。
   - `ordinalWidth` = 最大子数の桁数（動的。現状は最大 5 子なので 1）。
4. 文字列の辞書順がそのまま**前順**になる（親 → 子孫、兄弟は派生順、根は id 順）。

例（大剣・鉄系ツリー。先頭の `sort` と深さぶんのインデント）:

```
002  2 アイアンソードⅠ
0020    3 スティールソード
00200      0 バスターソードⅠ
002000        1 バスターブレイド
0020000          7 クロームレイザーⅠ
00200000            8 クロームデスレイザー
002000000              335 クロームヘル
0020000000                336 クロームヘル改
00200000000                  337 クロームヘヴン
0020000001                338 啼剣ライゼクス        ← 335 の別の子（ordinal 1）
00200000010                  339 啼剣ライゼクス改
002000000100                    340 霆剣ライゼクス
002001        17 バルバロイブレイドⅠ              ← スティール系の兄弟（ordinal 1）
00201       94 アイシクルファングⅠ                ← 根の子（ordinal 1）
```

クライアントでの利用:

```ts
// 既定（ツリー前順）: index は既に整列済み。並べ替えるなら sort 昇順。
items.toSorted((a, b) => (a.sort < b.sort ? -1 : a.sort > b.sort ? 1 : 0));

// ツリー表示: path.length - 1 が深さ。
const depth = item.path.length - 1;
```

### 5.8 系統名（series）と既知の制約

- `tree_type`（数値）を系統 id とみなし、`weapon_series` / `weapon_series_mr` の `WeaponSeries_Hunter_<id>` と対応付けて `series` を得る。`"Ore"` は系統 id 0。
- **制約**: 一部の `tree_type`（99〜134 など）に対応する系統名が元データに存在せず、`series` は付かない。また `？？？派生` のようなプレースホルダは採用しない。→ `series` は**オプショナル**。

### 5.9 `weapons/common.json.gz`

```jsonc
{
  "weapon_series":    { "entries": [ { "name": "WeaponSeries_Hunter_000", "content": ["鉱石素材派生", "Ore Tree"] }, … ] },
  "weapon_series_mr": { "entries": [ … ] }
}
```

## 6. フロントエンド側

- **型・定数**: `src/shared/lib/weapons.ts`
  - `WeaponType` / `weaponTypes`（id・表示名・表示順）
  - `getWeaponType(id)`
  - `WeaponIndexItem`（§5.4 の index 型）
- **読み込み**: `src/shared/api/client.ts` の `loadDataset(id)`
  - `id` は `public/data/` 配下の拡張子なしパス（例: `weapons/great_sword/index`）。
  - 同一 URL はメモリキャッシュ。gzip はマジックバイトで二重展開を防止。
- **ルーティング**: `src/app/routes/weapons.$weaponType.tsx` → `/weapons/$weaponType` で `index` を読み、`WeaponTypePage` に渡す。`/weapons` は先頭武器種へリダイレクト。

## 7. 変更・再生成の手順

1. `scripts/etl/datasets/*.ts` を編集。
2. `vp run etl` で `public/data/` を再生成。
3. `vp check` / `vp run fsd` / `vp run knip` / `vp build` を実行。

> 注: `public/data/` は Git 管理下。武器 1 件ごとの詳細ファイルを含めると約 3,900 ファイルになる点に留意する。
