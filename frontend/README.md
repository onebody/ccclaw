# Ccclaw Frontend

AI Agent Management Platform - Frontend Scaffold

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Code Standards**: ESLint + Prettier

## Project Structure

```
src/
├── components/      # Reusable components
│   ├── ui/        # shadcn/ui components
│   ├── layout/    # Layout components
│   └── common/   # Common components
├── pages/         # Page components
├── store/         # Zustand store
├── api/           # API client
├── hooks/         # Custom hooks
├── utils/         # Utility functions
├── types/         # TypeScript type definitions
└── styles/        # Global styles
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### Build

```bash
npm run build
```

Builds the app for production to the `dist/` folder.

### Lint

```bash
npm run lint
```

Checks code standards using ESLint.

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### Tailwind CSS

Configuration file: `tailwind.config.js`

### shadcn/ui

Configuration file: `components.json`

To add new shadcn/ui components:

```bash
npx shadcn@latest add [component-name]
```

## Code Standards

- **ESLint**: `.eslintrc.cjs`
- **Prettier**: `.prettierrc.cjs`

## License

Apache-2.0
