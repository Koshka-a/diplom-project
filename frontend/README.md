# Koshka-a Diplom Project - Frontend

Это Frontend-часть дипломного проекта (система анализа графов артефактов и влияния).

## Технологии

- React 18
- TypeScript
- Vite
- React Router (для маршрутизации)
- React Flow (для визуализации онтологии/графа проекта)
- Monaco Editor (для просмотра кода внутри артефактов)
- Lucide React (иконки)

## Структура приложения

- `src/api` - Клиент для работы с backend API (Axios).
- `src/pages` - Основные страницы (Dashboard, Artifacts, Relations, Graph, Impact, Changelog).
- `src/types.ts` - Глобальные TypeScript интерфейсы (соответствующие Pydantic-схемам бэкенда).

## Запуск для разработки

\`\`\`bash
npm install
npm run dev
\`\`\`

## Сборка для Production

\`\`\`bash
npm run build
npm run preview
\`\`\`
