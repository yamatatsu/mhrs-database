import { getWeaponElementLabel, type WeaponIndexItem, type WeaponType } from "@/shared/lib";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui";
import { SharpnessBar } from "./SharpnessBar";

interface WeaponTypePageProps {
  weaponType: WeaponType;
  items: readonly WeaponIndexItem[];
}

export function WeaponTypePage({ weaponType, items }: WeaponTypePageProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-bold">{weaponType.label}</h1>
        <span className="text-sm text-muted-foreground">{items.length} 件</span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>名前</TableHead>
            <TableHead className="text-right">レア度</TableHead>
            <TableHead className="text-right">攻撃力</TableHead>
            <TableHead className="text-right">会心率</TableHead>
            <TableHead>属性</TableHead>
            <TableHead className="text-right">属性値</TableHead>
            <TableHead>切れ味</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-muted-foreground">{item.id}</TableCell>
              <TableCell>
                <span
                  className="font-medium"
                  style={{ paddingLeft: `${(item.path.length - 1) * 1}rem` }}
                >
                  {item.name}
                </span>
              </TableCell>
              <TableCell className="text-right">{item.rarity}</TableCell>
              <TableCell className="text-right">{item.atk}</TableCell>
              <TableCell className="text-right">{item.critical_rate}%</TableCell>
              <TableCell>
                {item.elements.length > 0 ? (
                  item.elements.map((element) => getWeaponElementLabel(element.type)).join(" / ")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                {item.elements.length > 0 ? (
                  item.elements.map((element) => element.value).join(" / ")
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.sharpness_val_list.length > 0 ? (
                  <SharpnessBar values={item.sharpness_val_list} />
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
