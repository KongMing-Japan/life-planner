# FIRE & Die-with-Zero Lifetime Planner

个人/家庭 50 年 Lifetime Plan（Sample-first + 渐进式输入）

## 🎯 MVP 功能

- **Sample Gallery（10 个案例）**: 首页无需输入直接查看案例卡
- **Case Detail**: 每个案例可查看年度表 + 图表 + 结论
- **My Plan**: 通过 3–5 个快速问题生成个人版，并可继续编辑参数和事件
- **Import**: 支持 CSV 支出导入、JSON 导入/导出
- **Scenario A/B**: 支持复制并做简易 what-if 对比
- **LocalStorage**: 默认本地保存（离线优先）

## 🚀 起動方法

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build
```

## 🧭 路由

- `/` Sample Gallery
- `/case/:id` Case Detail
- `/plan` My Plan
- `/import` Import / Export
- `/about` Method

## 📦 Cloudflare Pages デプロイ

1. GitHubにプッシュ
2. Cloudflare Pagesで新規プロジェクト作成
3. 設定:
   - Build command: `npm run build`
   - Build output: `dist`
   - Node version: 18以上

## 🗂 项目结构（核心）

```
life-planner/
├── public/_redirects   # Cloudflare Pages SPA fallback
├── index.html
├── package.json
├── src/
│   ├── main.jsx
│   ├── data/
│   │   ├── defaults.js
│   │   └── cases.json
│   ├── engine/
│   │   ├── calculator.js
│   │   └── scenario.js
│   ├── parser/
│   │   └── importCsv.js
│   ├── storage/
│   │   └── local.js
│   ├── components/
│   │   ├── ResultsPage.js
│   │   ├── ProjectionTable.js
│   │   ├── Charts.js
│   │   └── EventsForm.js
│   └── styles/main.css
└── dist/
```
