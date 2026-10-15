/** 一覧用インデックス（`items/index.json.gz`）の 1 件。 */
export interface ItemIndexItem {
  /** アイテム id（詳細ページのルーティングキー）。 */
  readonly id: number;
  /** アイテム名（日本語）。 */
  readonly name: string;
  /** レア度（1〜10）。 */
  readonly rare: number;
  /** 分類の表示名（例: "素材"・"消耗品"）。 */
  readonly type: string;
  /** 所持上限。 */
  readonly pl_max_count: number;
  /** 売値（z）。 */
  readonly sell_price: number;
  /** 買値（z）。雑貨屋で買えないアイテムにも値が入る。 */
  readonly buy_price: number;
  /** 調合で作れるか。 */
  readonly craftable: boolean;
}

/** 調合レシピ（このアイテムを作る側）。 */
export interface ItemMixRecipe {
  /** 材料名（1〜2 個）。 */
  readonly ingredients: readonly string[];
  /** 完成品の個数。 */
  readonly num: number;
}

/** 調合レシピ（このアイテムを材料に使う側）。 */
export interface ItemMixUsage {
  /** このアイテムと一緒に使う材料名。 */
  readonly with: readonly string[];
  /** 完成品の名前。 */
  readonly result: string;
  /** 完成品の個数。 */
  readonly num: number;
}

/** 雑貨屋の購入条件。未到達の進度は `null`。 */
export interface ItemShopEntry {
  /** 村クエストの進度（★）。 */
  readonly village: number | null;
  /** 集会所クエストの進度（★）。 */
  readonly hall: number | null;
  /** MR クエストの進度（★）。 */
  readonly mr: number | null;
}

/** アイテムの入手ランク。 */
export type ItemRank = "Low" | "High" | "Master";

/** モンスター報酬の種別（ハンターノートの報酬タブに対応）。 */
export type ItemRewardKind = "target" | "capture" | "parts_break" | "hagitory" | "drop";

/** モンスター報酬の 1 件（報酬種別ごとの個数と確率）。 */
export interface ItemRewardEntry {
  readonly kind: ItemRewardKind;
  readonly num: number;
  readonly probability: number;
}

/** モンスター報酬の入手経路（1 モンスター × 1 ランク）。 */
export interface ItemMonsterReward {
  readonly monster_id: number;
  readonly monster_name: string;
  /** モンスター詳細ページが存在するか（小型モンスターは `false`）。 */
  readonly linkable: boolean;
  readonly rank: ItemRank;
  readonly rewards: readonly ItemRewardEntry[];
}

/** フィールド採取の入手経路（1 ランク × 1 マップ）。 */
export interface ItemGatherSource {
  readonly rank: ItemRank;
  readonly map: string;
  /** 採取ポイント種別ごとの入手確率（重複除去・降順）。 */
  readonly probabilities: readonly number[];
}

/** ランクの表示名。 */
export const itemRankLabels: Record<ItemRank, string> = {
  Low: "下位",
  High: "上位",
  Master: "マスター",
};

/** モンスター報酬種別の表示名（ハンターノートの表記に合わせる）。 */
export const itemRewardKindLabels: Record<ItemRewardKind, string> = {
  target: "ターゲット報酬",
  capture: "捕獲報酬",
  parts_break: "部位破壊報酬",
  hagitory: "剥ぎ取り素材",
  drop: "落とし物",
};

/** アイテム詳細（`items/<id>.json.gz`）の 1 件。 */
export interface ItemDetail {
  readonly id: number;
  readonly name: string;
  readonly rare: number;
  readonly type: string;
  readonly pl_max_count: number;
  readonly sell_price: number;
  readonly buy_price: number;
  /** 素材カテゴリ名（例: "鉱石素材"・"鎌鼬竜素材"）。 */
  readonly material_categories: readonly string[];
  /** 説明文。無い場合は `null`。 */
  readonly description: string | null;
  /** このアイテムを作る調合レシピ。 */
  readonly mix_as_product: readonly ItemMixRecipe[];
  /** このアイテムを材料に使う調合レシピ。 */
  readonly mix_as_ingredient: readonly ItemMixUsage[];
  /** 雑貨屋の購入条件。買えない場合は `null`。 */
  readonly shop: ItemShopEntry | null;
  /** モンスター報酬の入手経路（討伐・捕獲・部位破壊・剥ぎ取り・落し物）。 */
  readonly monster_rewards: readonly ItemMonsterReward[];
  /** フィールド採取の入手経路。 */
  readonly gather_sources: readonly ItemGatherSource[];
}
