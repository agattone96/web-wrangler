# WebWrangler

**WebWrangler** is a premium, privacy-focused desktop application designed to provide a dedicated and highly performant workspace for your favorite web apps. Built with a signature "Neon Cyber-Goth" aesthetic, it combines robust security features with a stunning visual experience.

![WebWrangler App Icon](./assets/icon.png)

## 🚀 Key Features

- **Dedicated App Catalog**: A pre-seeded collection of popular web apps (Gmail, Slack, Notion, etc.) ready to be "wrangled" into your workspace.
- **Neon Cyber-Goth UI**: A custom-engineered design system featuring glassmorphism, pulsing neon glows, and micro-animations.
- **Privacy First**: 
  - Integrated **native ad-blocking** via the Ghostery engine.
  - **Universal Dark Mode** support for all guest applications using a bundled DarkReader injection system.
  - Complete local data persistence via **SQLite**.
- **Performance Optimized**: Built on **Electron** + **Vite** + **TypeScript** for near-instant load times and zero-latency interactions.
- **Multi-Profile & Spaces**: Organize your apps into custom spaces (Work, Personal, Dev) with isolated profiles.

## 🛠 Tech Stack

- **Core**: Electron, React, TypeScript
- **Styling**: Vanilla CSS (Custom Design System)
- **Database**: better-sqlite3
- **Ad-blocking**: @ghostery/adblocker-electron
- **Dark Mode**: localized darkreader injection
- **Build Tools**: Vite, tsc, electron-builder

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- npm

### Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm start
   ```

### Production Build
To create a production-ready package for macOS:
```bash
npm run build
npm run dist:mac
```

## 📄 Documentation

For more in-depth technical details, check out our specialized documentation in the `assets/` folder:
- [Build Documentation](./assets/build_documentation.md) — Technical details on architecture and security.
- [Case Study](./assets/case_study.md) — The "What, Why, and How" behind WebWrangler.

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to get started.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---
*Built with 💖 for the modern web wrangler.*
