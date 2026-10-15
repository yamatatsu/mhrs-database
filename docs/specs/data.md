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
- **武器 1 件ごとの詳細（`weapons/<type>/<id>`）・モンスター 1 体ごとの詳細（`monsters/<id>`）・アイテム 1 件ごとの詳細（`items/<id>`）は `listed: false` として manifest に含めない**（多数のファイルになるため）。存在は各 `index` の `id` から辿れる。

## 4. データセット一覧

`scripts/etl/datasets/index.ts` に登録されたカテゴリのみ出力される（未登録のトップレベルキーは破棄）。

| データセット         | ファイル                       | 内容                               |
| -------------------- | ------------------------------ | ---------------------------------- |
| weapons              | `weapons/**`                   | 武器（§5）                         |
| armor_skills         | `armor_skills.json.gz`         | 防具・スキル・装飾品・百竜スキル   |
| hyakuryu_skill_names | `hyakuryu_skill_names.json.gz` | 百竜スキル id → 日本語名（§5.4.5） |
| items                | `items/**`                     | アイテム・素材・調合（§7）         |
| monsters             | `monsters/**`                  | モンスター（§6）                   |
| quests               | `quests.json.gz`               | クエスト・報酬・供給               |

weapons / monsters / items 以外は **ゲーム内部テーブルをスリム化しただけ**の構造（トップレベルは元のキーをそのまま保持）。主なトップレベルキー:

- items: `items`（`items/row` として出力）, `items_name_msg`, `items_explain_msg`, `items_name_msg_mr`, `items_explain_msg_mr`, `material_category_msg`, `item_pop_lot`, `item_shop`, `item_mix`, `item_pack`, `insect*` ほか
- monsters: `monsters`, `small_monsters`, `monster_names`, `monster_aliases`, `monster_explains`, `*_mr`, `monster_list`, `parts_type`, `species` ほか（§6 で一覧・詳細ファイルに再構成する）
- quests: `normal_quest_data`, `normal_quest_data_mr`, `dl_quest_data*`, `difficulty_rate*`, `reward_id_lot_table*`, `arena_quest`, `progress` ほか
- armor_skills: `armor`, `armor_series`, `armor_product`, `equip_skill`, `player_skill_*`, `hyakuryu_skill*`, `decorations*` ほか

## 5. 武器データ仕様

### 5.1 ファイル構成

```
public/data/weapons/
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

| フィールド           | 型              | 説明                                                    |
| -------------------- | --------------- | ------------------------------------------------------- |
| `id`                 | number          | 武器 id                                                 |
| `name`               | string          | 武器名（日本語）                                        |
| `rarity`             | number          | レア度（`rare_type`）                                   |
| `atk`                | number          | 攻撃力                                                  |
| `critical_rate`      | number          | 会心率（負値あり）                                      |
| `elements`           | WeaponElement[] | 属性（種類と威力）。無属性なら `[]`（§5.4.1）           |
| `sharpness_val_list` | number[]        | 切れ味（§5.4.2）。弓・ガンナーは `[]`                   |
| `takumi_val_list`    | number[]        | 匠による切れ味上昇分（一覧では未使用）                  |
| `path`               | number[]        | 根 → 自身の weapon id 配列（派生ツリー上の位置）        |
| `sort`               | string          | 派生ツリーの前順ソートキー（§5.7）                      |
| `melodies`           | WeaponMelody[]? | 旋律（狩猟笛のみ、§5.4.3）                              |
| `rapid_fire`         | string[]?       | 速射する弾（BulletType 名。ライトボウガンのみ、§5.4.4） |
| `deviation`          | string \| null? | ブレ（ライトボウガンのみ、§5.4.4）                      |
| `reload`             | number?         | リロード速度（ライトボウガンのみ、§5.4.4）              |
| `recoil`             | number?         | 反動（ライトボウガンのみ、§5.4.4）                      |

```json
{
  "id": 340,
  "name": "無明刀【空諦】",
  "rarity": 10,
  "atk": 280,
  "critical_rate": 40,
  "elements": [],
  "sharpness_val_list": [40, 30, 100, 80, 80, 30, 40],
  "takumi_val_list": [0, 0, 0, 0],
  "path": [0, 1, 2, 110, 111, 112, 338, 339, 340],
  "sort": "00000200000"
}
```

#### 5.4.1 `elements`

`base_data` のメイン属性（`main_element_type` / `main_element_val`）と、サブ属性
（`sub_element_type` / `sub_element_val`）をこの順に配列化したもの。属性値が `0` の
ものは無属性として含めない。

```ts
interface WeaponElement {
  /** 属性の種類（例: Fire / Water / Thunder / Ice / Dragon / Poison / Paralyze / Sleep / Bomb）。 */
  type: string;
  /** 属性値（威力）。 */
  value: number;
}
```

- 属性は武器種ごとに個数が異なる。双剣はメイン + サブの 2 属性を持ち得る。
- 個数を配列で表現しているため、将来属性数が変わる武器種が現れても index スキーマの
  変更は不要（`elements` の要素が増減するだけ）。

#### 5.4.2 `sharpness_val_list` / `takumi_val_list`

`base_data` の切れ味をそのまま数値配列で持つ。並びは
**赤 / 橙 / 黄 / 緑 / 青 / 白 / 紫**の 7 色。

- 一覧の切れ味バーは `sharpness_val_list` を使い、合計の最大値 `400` を 100% として
  各色の値を横方向に積み上げて描画する（残りは黒）。
- `takumi_val_list` は匠スキルによる上昇分。**現状は一覧で未使用**で、index に保持する
  のみ（将来の詳細表示用）。
- 弓・ガンナーなど切れ味を持たない武器は空配列 `[]`。

#### 5.4.3 `melodies`（狩猟笛のみ）

狩猟笛のレコードは `horn_melody_type_list`（旋律 id の配列）を持つ。ETL はこの id に
旋律マスタ（`melody` / `melody_mr`、`Horn_UniqueParam_<id>_Name`）の日本語名を join し、
`melodies` として index に載せる。**他の武器種のレコードにはこのフィールドは存在しない。**

```jsonc
{
  "id": 2,
  "name": "アイアンホルンⅠ",
  // ...
  "melodies": [
    { "id": 23, "name": "高周衝撃波" },
    { "id": 20, "name": "スタミナ回復速度UP" },
    { "id": 2, "name": "防御力UP" },
  ],
}
```

```ts
interface WeaponMelody {
  /** 旋律 id（`Horn_UniqueParam_<id>` の id）。 */
  id: number;
  /** 旋律名（日本語）。 */
  name: string;
}
```

- 一覧は index だけで旋律を表示できる（一覧ページが読むのは index のみ、§5.1）。
- `melody`（通常）と `melody_mr`（MR 追加分）をまとめて id → 名称で解決する。
- マスタに無い id は `#<id>` にフォールバックし、欠落を可視化する。
- 武器種ごとの固有フィールドを index に追加する場合は、この節と同じ要領で
  「index に載せて一覧だけで完結させる」方針を取る。

#### 5.4.4 ガンナー性能（ライトボウガンのみ）

ライトボウガンのレコードは `base` 直下にガンナー固有フィールドを持つ。ETL は一覧の
カラムで使う値だけを index に載せる（**他の武器種のレコードにはこれらのフィールドは存在しない**）。

| フィールド   | 型             | 説明                                           |
| ------------ | -------------- | ---------------------------------------------- |
| `rapid_fire` | string[]       | 速射する弾（`BulletType` 名。速射なしは `[]`） |
| `deviation`  | string \| null | ブレ（`Fluctuation`）。`null` はブレなし       |
| `reload`     | number         | リロード速度（数値。大きいほど速い）           |
| `recoil`     | number         | 反動（数値。大きいほど大きい）                 |

```jsonc
{
  "id": 333,
  "name": "冷たき月の狼弩改",
  // ...
  "rapid_fire": ["IceKantsu"],
  "deviation": "RightLittle",
  "reload": 3,
  "recoil": 2,
}
```

- `rapid_shot_list` / `fluctuation` / `reload` / `recoil` は `base` 直下にあり、
  正規化（§5.6）で `"None"` は `null` になる。
- `deviation` の表示名（`LeftLittle` → 左小 など）と `reload` / `recoil` の数値は
  一覧・詳細でそのまま、または固定の対応表で表示する（フロント側の `shared/lib/weapons.ts`）。
- 弾種の添字・名称は詳細の `bullet_equip_flag_list` 等と共通（§5.5.6）。

#### 5.4.5 百竜スキル名（`hyakuryu_skill_names.json.gz`）

武器詳細の百竜スキル（§5.5.7）は id で保持されるため、表示用に id → 日本語名の
参照テーブルを別ファイルとして出力する（`armor_skills` カテゴリの副産物）。

```jsonc
{ "0": "攻撃力強化Ⅰ", "1": "攻撃力強化Ⅱ" /* ... */ }
```

- 元データは `hyakuryu_skill_name_msg` / `hyakuryu_skill_name_msg_mr` の
  `HyakuryuSkill_<id>_Name`（`_MR` は MR 追加分）。
- `armor_skills.json.gz`（約 3.6MB）を読み込まずに済むよう、名前だけを抜き出している。

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

#### 5.5.6 ガンナー固有フィールド（弾）

ライト・ヘビィボウガンは `base` に弾関連フィールドを持つ。値は `normalize`（§5.6）済み。

- `bullet_equip_flag_list[52]` / `bullet_num_list[52]` / `bullet_type_list[52]`:
  添字は `BulletType`（下表）。装填可否・装填数・射撃タイプ。
- `fluctuation` / `reload` / `recoil`: ブレ（`Fluctuation`）・リロード速度・反動。共通（§5.4.4）。
- ライトボウガンのみ: `rapid_shot_list`（速射する弾。`BulletType` 名の配列）、
  `unique_bullet`（特殊弾 = `Setti` / 起爆竜弾）。
- ヘビィボウガンのみ: `heavy_bowgun_unique_bullet_type`（`Snipe` / `Gatling`）。

`bullet_type_list` の値は `ShootType`: `None` / `MovingShot` / `MovingShotReload` /
`MovingShotSingleAuto` / `MovingReload` / `MovingReloadSingleAuto` / `SingleAuto` /
`MovingShotReloadSingleAuto`。

`BulletType`（添字 = 値。1〜41 と 43 が実在弾。出典: mhrice の `BulletType`）:

| 値    | 名前          | 表示        | 値    | 名前       | 表示               |
| ----- | ------------- | ----------- | ----- | ---------- | ------------------ |
| 1-3   | `Normal1-3`   | 通常弾1-3   | 23-24 | `Sleep1-2` | 睡眠弾1-2          |
| 4-6   | `Kantsu1-3`   | 貫通弾1-3   | 25-26 | `Genki1-2` | 減気弾1-2          |
| 7-9   | `SanW1-3`     | 散弾1-3     | 27-28 | `Heal1-2`  | 回復弾1-2          |
| 10-12 | `SanO1-3`     | 放散弾1-3   | 29    | `Kijin`    | 鬼人弾             |
| 13-15 | `Tekko1-3`    | 徹甲榴弾1-3 | 30    | `Kouka`    | 硬化弾             |
| 16-18 | `Kakusan1-3`  | 拡散弾1-3   | 31-40 | `Fire` 系  | 火炎弾・貫通属性弾 |
| 19-20 | `Poison1-2`   | 毒弾1-2     | 41    | `Zanretsu` | 斬裂弾             |
| 21-22 | `Paralyze1-2` | 麻痺弾1-2   | 43    | `Capture`  | 捕獲用麻酔弾       |

- 弾の日本語名は items の名称マスタ（`I_<アイテム id>_Name`）と同じ表記。
  フロントは `BulletType` → 表示名の固定表を持つ（`shared/lib/weapons.ts`）。
- 44 以降（`Setti` / `Gatling` / `Snipe` 等）は特殊弾・内部値。

#### 5.5.7 百竜スキル

`base` の `hyakuryu_skill_id_list`（武器固有の百竜スキル。`null` は空き）と
`hyakuryu_slot_num_list`（百竜スロットの段数）を保持する。名称は
`hyakuryu_skill_names`（§5.4.5）で id → 日本語名に解決する。百竜強化の候補は
`hyakuryu_buildup`（§5.5.3）に別途保持する。

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

## 6. モンスターデータ仕様

### 6.1 ファイル構成

```
public/data/monsters/
  row.json.gz        # 元の（ゲーム寄りの）構造。参考・再処理用
  index.json.gz      # 一覧用の軽量インデックス
  <id>.json.gz       # モンスター 1 体ごとの詳細（id = Em 値）
```

- `id` は `monsters[].em_type.Em`（内部一意 id）。ゲーム内の `monsters[].id`（モンスター種）と枝番 `sub_id` は詳細に `species_id` / `sub_id` として保持する。
- 名前を持たないテスト用レコード（`em = 131`）は一覧・詳細から除外する。
- 一覧・詳細は `data.monsters` を母集合とし、図鑑の並び（`enemy_type`）で整列する。

### 6.2 index スキーマ（`monsters/index.json.gz`）

`MonsterIndexItem[]`（`enemy_type` 昇順＝図鑑の並び）。

| フィールド   | 型             | 説明                                               |
| ------------ | -------------- | -------------------------------------------------- |
| `id`         | number         | モンスター id（Em 値。詳細ファイル名・ルートキー） |
| `name`       | string         | モンスター名（日本語）                             |
| `alias`      | string \| null | 異名（日本語）                                     |
| `family`     | string \| null | 種族（例: `飛竜種`。§6.4）                         |
| `rank`       | number \| null | 危険度（`enemy_rank`、1〜10）                      |
| `base_size`  | number \| null | サイズの基準値（`size_list`）                      |
| `enemy_type` | number         | 図鑑の並びインデックス（`EnemyIndex<n>` の n）     |

### 6.3 detail スキーマ（`monsters/<id>.json.gz`）

`data.monsters` の 1 行を正規化（§6.5）し、名称・異名・図鑑説明・種族・危険度・サイズ・図鑑メタを join した 1 オブジェクト。

**join フィールド**

| フィールド    | 型             | 説明                                                                                                    |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `id`          | number         | モンスター id（Em 値）                                                                                  |
| `species_id`  | number         | ゲーム内モンスター id（`monsters[].id`）                                                                |
| `sub_id`      | number         | 枝番（亜種・希少種など）                                                                                |
| `enemy_type`  | number         | 図鑑の並びインデックス                                                                                  |
| `name`        | string \| null | 名前（`monster_names` / `*_mr`）                                                                        |
| `alias`       | string \| null | 異名（`monster_aliases` / `*_mr`）                                                                      |
| `description` | string[]       | 図鑑説明（`monster_explains` / `*_mr` をページ順に結合、タグ除去済み）                                  |
| `family`      | string \| null | 種族表示名（§6.4）                                                                                      |
| `rank`        | number \| null | 危険度（`enemy_rank`）                                                                                  |
| `size`        | object \| null | `size_list` の 1 件（`base_size` / `small_boarder` / `big_boarder` / `king_boarder` / `no_size_scale`） |
| `list`        | object \| null | `monster_list` の 1 件（`family_type` / `habitat_area` / `part_table_data` ほか）                       |

**生データ（正規化のみ）**

| フィールド                | 説明                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `data_base` / `data_tune` | 基礎・調整値（体力 `base_hp_vital` / `master_hp_vital`、部位体力、重さ等）                                        |
| `meat_data`               | 肉質。`meat_container[i].meat_group_info[j]` が部位 i・状態 j の弱点値（§6.3.1）                                  |
| `condition_damage_data`   | 状態異常耐性（`*_data.default_stock` に初期耐性・上昇・最大、`active_time` に効果時間）                           |
| `collider_mapping`        | `meat_map`（肉質インデックス → 部位名）/ `part_map`                                                               |
| その他                    | `anger_data` / `stamina_data` / `parts_break_data` / `drop_item` / `parts_break_reward` / `ecological` などを保持 |

#### 6.3.1 肉質（`meat_data` × `collider_mapping.meat_map`）

- `meat_map` のキー（`"0"`〜）が `meat_container` のインデックスに対応し、値が部位名（例: `["A：頭部", "A：頭部_顎用（クグツ）"]`）。
- `meat_container[i].meat_group_info[j]` が状態 j の肉質（`slash` / `strike` / `shell` / `fire` / `water` / `ice` / `elect` / `dragon` / `piyo`）。
- 部位によっては状態を複数持つ（通常・怒り等）。`list.part_table_data` の `em_meat` / `em_meat_group_index` が図鑑の部位と対応する。

### 6.4 種族（`family`）

`monster_list[].family_type` は通常種を `Species`、MR 追加種（ゴア・マガラ系）を `MrSpecies` で持つ。ETL は対応するモンスターから逆引きした次の表で表示名に変換する。

| キー        | 表示名 | キー          | 表示名 |
| ----------- | ------ | ------------- | ------ |
| `Species:1` | 海竜種 | `Species:9`   | 鳥竜種 |
| `Species:2` | 牙獣種 | `Species:10`  | 飛竜種 |
| `Species:3` | 牙竜種 | `Species:11`  | 古龍種 |
| `Species:4` | 魚竜種 | `Species:12`  | 両生種 |
| `Species:5` | 甲殻種 | `Species:13`  | 鋏角種 |
| `Species:8` | 獣竜種 | `MrSpecies:0` | 古龍種 |

### 6.5 正規化ルール

武器と同じく、キーが 1 つだけのタグ付き union を値へ開く（`{ Em: 1 }` → `1`、`{ Normal: 519 }` → `519`）。`"None"` → `null`。対象タグは `Em` / `Ems` / `Normal`。

## 7. アイテムデータ仕様

### 7.1 ファイル構成

```
public/data/items/
  row.json.gz              # 元の（ゲーム寄りの）構造。参考・再処理用
  index.json.gz            # 一覧用の軽量インデックス（図鑑順）
  <アイテム id>.json.gz    # アイテム 1 件ごとの詳細
```

- `row`: 名称を持たない内部行・「なし」を除去した元構造（§2 の前処理後）。武器のレシピ素材名の解決（§8 の `loadItemNames`）もこのファイルを読む。
- `index`: 一覧ページが読む唯一のファイル（1,764 件）。`id` / `name` / `rare` / `type` / `pl_max_count` / `sell_price` / `buy_price` / `craftable`。
- `<id>`: 詳細ページ用。名称・説明・素材カテゴリ・調合・購入条件を join 済み。

### 7.2 分類（`type_`）

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

### 7.3 詳細ファイルの項目

- 基本: `id` / `name` / `rare` / `type` / `pl_max_count` / `sell_price` / `buy_price`。
- `material_categories`: 素材カテゴリ名（例: "鉱石素材"・"鎌鼬竜素材"）。`items.param` の `material_category` はタグ付き union で、`{ LrHr: v }` → `material_category_msg` の `ICT_Name_<v + 1>`、`{ Mr: v }` → `material_category_msg_mr` の `ICT_Name_<v + 200>` に対応する。
- `description`: 説明文（リッチテキストタグ除去済み）。無い場合は `null`。
- `mix_as_product`: このアイテムを作る調合レシピ（材料名・完成品の個数）。`item_mix` から解決。
- `mix_as_ingredient`: このアイテムを材料に使う調合レシピ（相方の材料名・完成品名・個数）。
- `shop`: 雑貨屋の購入条件（`village` / `hall` / `mr` の★進度）。`item_shop` に無い場合は `null`。

## 8. フロントエンド側

- **型・定数**: `src/shared/lib/weapons.ts`
  - `WeaponType` / `weaponTypes`（id・表示名・表示順）
  - `getWeaponType(id)`
  - `WeaponIndexItem`（§5.4 の index 型）
  - `WeaponElement` / `getWeaponElementLabel(type)`（§5.4.1 の属性表示。未知の属性種別は生の表記にフォールバック）
  - `WeaponDetail` / `WeaponRecipes` / `WeaponRecipe` / `WeaponTree`（§5.5 の detail 型）、
    `getWeaponDetailElements(detail)`（detail の主・サブ属性を一覧と同じ配列へまとめる）
  - `getWeaponBulletLabel(type)` / `getWeaponFluctuationLabel(type)` / `getWeaponShotType(type)`
    と `getWeaponBullets(detail)`（§5.5.6 の弾を一覧表示用にまとめる。ガンナー以外は空）
- **レシピ素材の名称**: `src/shared/lib/items.ts` の `ItemNameTable` と `getItemName` /
  `getMaterialCategoryName`。`src/pages/weapons/api/load-item-names.ts` の
  `loadItemNames()` が `items/row` データからアイテム名・素材カテゴリ名の参照テーブルを構築する
  （レシピの素材はアイテム id で保持されるため、表示時にここで名称へ解決する）。
- **百竜スキル名**: `src/shared/lib/hyakuryu.ts` の `HyakuryuSkillNameTable` と
  `getHyakuryuSkillName`。`src/pages/weapons/api/load-hyakuryu-skill-names.ts` の
  `loadHyakuryuSkillNames()` が `hyakuryu_skill_names`（§5.4.5）を読む。
- **読み込み**: `src/shared/api/client.ts` の `loadDataset(id)`
  - `id` は `public/data/` 配下の拡張子なしパス（例: `weapons/great_sword/index`）。
  - 同一 URL はメモリキャッシュ。gzip はマジックバイトで二重展開を防止。
- **一覧表示**: `src/shared/ui/data-table.tsx` の汎用 `DataTable`（TanStack Table v9）が
  既存の shadcn `Table` を描画する。武器種ごとのカラムは `src/pages/weapons/ui/` に置く。
  - `weapon-columns.tsx`: 全武器種共通のカラム（ID / 名前 / レア度 / 攻撃力 / 会心率 / 属性 / 切れ味）。
  - `horn-columns.tsx`: 共通カラム + 狩猟笛の旋律カラム（§5.4.3）。
  - `light-bowgun-columns.tsx`: 共通カラム + 速射 / ブレ / リロード / 反動（§5.4.4）。
  - 切れ味バーは `src/pages/weapons/ui/SharpnessBar.tsx` が描画する（§5.4.2）。
- **読み込み（武器種ごと）**: `src/pages/weapons/api/load-weapon-list.ts` の
  `loadWeaponList(weaponType)` が index を読み、武器種固有フィールドを型付けした
  判別可能な union（`WeaponListData`）を返す。狩猟笛は `melodies` を join 済みの
  `HornIndexItem`、ライトボウガンは速射等を載せた `LightBowgunIndexItem` として返す
  （`src/pages/weapons/model/`）。
- **読み込み（武器 1 件）**: `src/pages/weapons/api/load-weapon-detail.ts` の
  `loadWeaponDetail(weaponType, id)` が `weapons/<武器種>/<id>` を読む。
- **詳細ドロワー**: `src/pages/weapons/ui/WeaponDetailDrawer.tsx` が shadcn `Sheet` で
  基本情報（レア度 / 攻撃力 / 会心率 / 防御力 / 属性 / スロット / 切れ味、ガンナーは
  ブレ / リロード / 反動 / 特殊弾）・説明・使用可能な弾（ガンナー。§5.5.6）・
  百竜スキル（§5.5.7）・生産/強化/加工レシピ・派生ツリー（`prev` / `next` を一覧の名称で
  リンク）を表示する。モバイルは全幅（`data-[side=right]:w-full`）で表示する。
  - 一覧を眺めながら詳細を開けるよう、非モーダル（`modal={false}`）かつ
    オーバーレイなし（`showOverlay={false}`）で描画し、背面の一覧を操作できる。
  - ドロワーを開く / ツリー遷移 / 閉じるナビゲーションは `resetScroll: false` を指定し、
    一覧のスクロール位置を維持する（既定の `resetScroll: true` だと先頭へ戻ってしまう）。
- **ルーティング**:
  - `src/app/routes/weapons.$weaponType.tsx` → `/weapons/$weaponType`（一覧）。
    `loadWeaponList` を呼び `WeaponTypePage` に渡しつつ、`<Outlet />` で子ルートを重ねる。
  - `src/app/routes/weapons.$weaponType.$weaponId.tsx` → `/weapons/$weaponType/$weaponId`（詳細）。
    `loadWeaponDetail` / `loadWeaponList`（キャッシュで即時）/ `loadItemNames` /
    `loadHyakuryuSkillNames` を読み、
    `WeaponDetailDrawer` を右側ドロワーとして描画する。開閉はルートで表現し、閉じると
    一覧ルートへ戻る。一覧は親ルートが保持したまま子だけが入れ替わるため、開閉でソート
    状態が失われない。
  - `/weapons` は先頭武器種へリダイレクト。
- **モンスター**
  - **型・定数**: `src/shared/lib/monsters.ts`（`MonsterIndexItem` / `MonsterDetail`、
    `monsterHitzoneColumns` / `monsterStatusTypes`、`getMonsterPartLabel`）。
  - **読み込み**: `src/pages/monsters/api/load-monster-list.ts` / `load-monster-detail.ts`
    が `monsters/index` と `monsters/<id>` を読む。
  - **一覧**: `src/pages/monsters/ui/MonstersPage.tsx` が詳細ページへのリンクを並べる。
  - **詳細**: `src/pages/monsters/ui/MonsterDetailPage.tsx` が基本情報・図鑑説明・
    肉質（`MonsterHitzoneTable`）・状態異常耐性（`MonsterStatusTable`）を表示する。
  - **肉質の表示**: `src/pages/monsters/model/hitzone.ts` の `buildMonsterHitzoneRows` が
    部位（`meat_map`）ごとに相（`meat_group_info`）を畳む。全相で同値なら単一値、
    1 つでも異なれば相の順に `/` 区切り（`formatMonsterHitzoneValue`）で表示する。
  - **ルーティング**: `src/app/routes/monsters.index.tsx` → `/monsters`（一覧）、
    `src/app/routes/monsters.$monsterId.tsx` → `/monsters/$monsterId`（詳細）。
    サイドバーは「モンスター」1 項目のままで、一覧から詳細へ遷移する。
- **アイテム**
  - **型**: `src/pages/items/model/items.ts`（`ItemIndexItem` / `ItemDetail`、
    `ItemMixRecipe` / `ItemMixUsage` / `ItemShopEntry`）。
  - **読み込み**: `src/pages/items/api/load-item-list.ts` / `load-item-detail.ts`
    が `items/index` と `items/<id>` を読む。
  - **一覧**: `src/pages/items/ui/ItemsPage.tsx` が名前の部分一致検索・分類フィルタ付きの
    `DataTable` を表示する。カラムは `item-columns.tsx`（名前 / レア度 / 分類 / 所持上限 /
    売値 / 調合）。行クリックで詳細へ遷移する。
  - **詳細**: `src/pages/items/ui/ItemDetailPage.tsx` が基本情報・素材カテゴリ・説明・
    調合（このアイテムを作る／使う）・雑貨屋の購入条件を表示する。
  - **ルーティング**: `src/app/routes/items.index.tsx` → `/items`（一覧）、
    `src/app/routes/items.$itemId.tsx` → `/items/$itemId`（詳細）。

## 9. 変更・再生成の手順

1. `scripts/etl/datasets/*.ts` を編集。
2. `vp run etl` で `public/data/` を再生成。
3. `vp check` / `vp run fsd` / `vp run knip` / `vp build` を実行。

> 注: `public/data/` は Git 管理下。武器 1 件ごとの詳細（約 3,900 ファイル）・
> モンスター 1 体ごとの詳細（約 80 ファイル）・アイテム 1 件ごとの詳細（約 1,760 ファイル）
> を含む点に留意する。
