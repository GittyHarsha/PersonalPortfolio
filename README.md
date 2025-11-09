# Portfolio - Harsha Narayana P

Minimal personal portfolio built with **React + TypeScript** featuring an interactive research papers reading graph.

## Features

- 📄 **Home Page**: About, projects, and contact information
- 📊 **Research Papers DAG**: Interactive dependency graph visualization
  - View paper reading dependencies
  - Track reading progress
  - Auto-layout with dagre
  - **Dev Mode** (localhost): Edit and rearrange nodes
  - **Production Mode** (deployed): View-only

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **React Flow** for graph visualization
- **Dagre** for automatic graph layout
- **Azure Static Web Apps** for deployment

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Modes

### Development Mode (localhost)
- Drag and rearrange paper nodes
- Export positions to JSON
- Full editing capabilities

### Production Mode (deployed)
- View-only mode
- No editing controls
- Optimized for presentation

## Project Structure

```
portfolio/
├── src/
│   ├── components/      # React components
│   │   └── PaperNode.tsx
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   └── ResearchPapers.tsx
│   ├── utils/          # Utilities
│   │   ├── environment.ts
│   │   └── layout.ts
│   ├── types.ts        # TypeScript types
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/
│   └── papers.json     # Research papers data
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Adding Research Papers

Edit `public/papers.json` to add your papers:

```json
{
  "papers": [
    {
      "id": "paper-1",
      "title": "Your Paper Title",
      "authors": "Authors",
      "year": 2024,
      "url": "https://arxiv.org/...",
      "status": "reading",
      "priority": "HIGH",
      "dependencies": [],
      "venue": "Conference Name",
      ...
    }
  ]
}
```

## Deployment

Automatically deploys to Azure Static Web Apps on push to main branch.

## License

MIT
