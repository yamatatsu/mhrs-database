import type { Dataset } from "../types.ts";
import { armorSkills } from "./armor-skills.ts";
import { items } from "./items.ts";
import { monsters } from "./monsters.ts";
import { quests } from "./quests.ts";
import { weapons } from "./weapons.ts";

/**
 * 有効なデータセットの一覧。
 * ここに追加するだけで新しいカテゴリが出力対象になる。
 * （misc / otomo は今回対象外のため登録しない）
 */
export const datasets: Dataset[] = [weapons, armorSkills, items, monsters, quests];
