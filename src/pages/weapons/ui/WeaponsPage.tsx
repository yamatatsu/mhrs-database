import type { DatasetData, Manifest } from "@/shared/api";

interface WeaponsPageProps {
  data: DatasetData;
  manifest: Manifest;
}

export function WeaponsPage({ data, manifest }: WeaponsPageProps) {
  const keys = Object.keys(data);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">武器</h1>
      <p className="text-muted-foreground text-sm">
        読み込み済みデータ: {keys.length} キー（生成日時: {manifest.generatedAt}）
      </p>
      <ul className="list-disc pl-5 text-sm">
        {keys.map((key) => (
          <li key={key}>{key}</li>
        ))}
      </ul>
    </div>
  );
}
