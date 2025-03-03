# Three.js Test Game

A 3D game project built with React and Three.js, exploring 3D graphics and interactive gameplay.

## 🚀 Features

- React 18 with TypeScript support
- Three.js for 3D graphics with full TypeScript type definitions
- Modern development setup with Vite
- Hot Module Replacement (HMR)
- ESLint with TypeScript support
- Path aliases for cleaner imports (@/*)

## 🛠️ Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 📦 Installation

1. Clone the repository:
```bash
git clone [your-repo-url]
cd threejs_test_game
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

## 🎮 Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Building for Production

Build the project:
```bash
npm run build
# or
yarn build
```

## 📚 Project Structure

```
threejs_test_game/
├── src/
│   ├── components/     # React components
│   ├── scenes/        # Three.js scenes
│   ├── models/        # 3D models and assets
│   └── utils/         # Utility functions
├── public/            # Static assets
├── tsconfig.json      # TypeScript configuration
├── tsconfig.node.json # Node-specific TypeScript config
└── vite.config.ts     # Vite configuration
```

## 🔧 TypeScript Configuration

The project uses TypeScript with the following key configurations:

- Strict type checking enabled
- Path aliases for cleaner imports (use `@/` to import from `src/`)
- Full type support for React and Three.js
- Modern ES2020 target
- React JSX support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details. 