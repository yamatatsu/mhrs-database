<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

# MHRS Database

モンスターハンターライズ / サンブレイクのデータベースサイト。GitHub Pages の
`https://<user>.github.io/mhrs-database/` でホストするため、`base` は
`/mhrs-database/` です（`vite.config.ts`、ルーターの `basepath`、
`public/404.html` の間で同期を保つこと）。

## スタック

- React 19 + Vite+（Vite 8 / Rolldown）
- Tailwind CSS v4（`@tailwindcss/vite`）
- shadcn/ui（Radix ベース）
- TanStack Router（ファイルベースルーティング）
- Feature-Sliced Design (FSD) v2.1、Steiger で lint

## コマンド

- `vp dev` — 開発サーバーを起動
- `vp build` — 本番ビルド（`tsc` も実行する場合は `vp run build`）
- `vp check` — フォーマット・lint・型チェック
- `vp run fsd` — FSD リンター（Steiger）を実行
- `pnpm dlx shadcn@latest add <component>` — shadcn コンポーネントを追加

## アーキテクチャ（FSD）

公式の FSD スキルが `.agents/skills/feature-sliced-design` にインストールされています。
配置の判断はこれを参照してください。レイヤーは高い順に次のとおりです。

```text
app/     → アプリ初期化、ルーティング、グローバルスタイル、アプリ全体のレイアウト
pages/   → ルート単位の構成（自身のロジックを持つ）
shared/  → ビジネスロジックを持たない基盤（UI キット、ユーティリティ）
```

現在存在するのはこの 3 レイヤーのみです。`features/` や `entities/` は、抽出条件
（今まさに再利用されている・独立した変更理由がある・責務が焦点化されている）を
満たす場合にのみ追加してください。`widgets/` レイヤーは推奨されません。

インポートの向きは一方向です: `app → pages → shared`。スライス内では、外部から
インポートできるのは `index.ts` の公開 API のみです。shared にスライスはなく、
各セグメント（`shared/ui`、`shared/lib`）が自身の `index.ts` を公開します。

主な配置:

- `src/app/routes/` — TanStack Router のファイルベースルート（`routesDirectory`）。
  `src/app/routeTree.gen.ts` は生成物なので編集しないこと。
- `src/app/layouts/` — グローバルなヘッダー/サイドバーのレイアウト。
- `src/app/routing/` — ルーターインスタンスと `RouterProvider`。
- `src/app/styles/global.css` — Tailwind のエントリと shadcn のテーマトークン。
- `src/pages/<page>/ui/` — ページコンポーネント。
- `src/shared/ui/` — shadcn コンポーネント（CLI がここに生成）。
- `src/shared/lib/` — 共有ユーティリティ。

## GitHub Pages

このアプリはブラウザ履歴と `public/404.html` のリダイレクトトリックを使います。
GitHub Pages は未知のパスに対して `404.html` を返すため、そこで要求されたパスを
`sessionStorage` に保存してアプリのルートへ戻します。`index.html` のインライン
スクリプトが、ルーター初期化前に URL を復元します。デプロイは
`.github/workflows/deploy.yml` で実行されます。リポジトリ設定で Pages のソースを
「GitHub Actions」に設定してください。
