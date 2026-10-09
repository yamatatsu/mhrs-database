import type { DatasetData, Manifest } from "@/shared/api";

interface WeaponsPageProps {
  weapon: DatasetData;
  common: DatasetData;
  manifest: Manifest;
}

export function WeaponsPage({ weapon, common, manifest }: WeaponsPageProps) {
  const weaponKeys = Object.keys(weapon);
  const commonKeys = Object.keys(common);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">武器</h1>
      <p className="text-muted-foreground text-sm">生成日時: {manifest.generatedAt}</p>
      <section>
        <h2 className="font-semibold">大剣（weapons/great_sword）: {weaponKeys.length} キー</h2>
        <ul className="list-disc pl-5 text-sm">
          {weaponKeys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-semibold">共通（weapons/common）: {commonKeys.length} キー</h2>
        <ul className="list-disc pl-5 text-sm">
          {commonKeys.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
