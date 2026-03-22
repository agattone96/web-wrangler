# Case Study: WebWrangler

## Overview: The What
**WebWrangler** is a high-performance desktop application designed to serve as a specialized, privacy-focused "workspace" for web applications. It effectively de-clutters the browser by moving critical tools—like Gmail, Slack, and Notion—into a dedicated, locally-managed environment.

## Motivation: The Why
I identified a significant gap in the current web browsing landscape:
1.  **Context Switching Fatigue**: Standard browsers encourage "tab sprawl," making it difficult to maintain focus on specific productivity tools.
2.  **Privacy Concerns**: Most browsers allow trackers to follow users across different web apps. I wanted a solution where each app is isolated and trackers are blocked by default.
3.  **Aesthetic Sterility**: Modern productivity tools often lack "soul." I wanted to prove that a professional tool could also be visually stunning, using a "Neon Cyber-Goth" design to create a more engaging user experience.

## Implementation: The How

### 1. Architectural Foundations
I chose **Electron** for its deep system integration (Tray icons, Global shortcuts) and **better-sqlite3** for a high-performance, local data layer. This ensures the app is fast and completely offline-first for its own metadata.

### 2. Engineering the Visual Identity
I built a custom design system from the ground up using **Vanilla CSS**. By avoiding heavy UI frameworks, I was able to implement complex visual effects like:
- **Glassmorphism**: Using `backdrop-filter` to create a "frosted glass" look that maintains context while reducing visual noise.
- **Neon Glows**: Leveraging CSS variables and animations to create pulsing, interactive elements that provide instant feedback to the user.

### 3. Solving Critical Web Barriers
I engineered two custom systems to improve the experience of "wrapped" web apps:
- **Native Ad-blocking**: I integrated **Ghostery's engine** directly into the Electron session, providing faster and more reliable blocking than typical browser extensions.
- **Universal Dark Mode**: By bundling **DarkReader** locally and injecting it via a custom preload script, I ensured that every application in WebWrangler supports a professional dark mode, regardless of the site's original design.

### 4. Resilience and Deployment
One of the biggest challenges in Electron development is the transition from development to production. I solved this by:
- **Smart Fallbacks**: Implementing code that detects if the Vite dev server is offline and automatically shifts to loading the built production assets from the filesystem.
- **ASAR-Safe Pathing**: Using `app.getAppPath()` and careful relative pathing to ensure the application remains fully functional when packaged into a read-only Mac ASAR bundle.

## Conclusion
WebWrangler demonstrates that with the right architectural choices, we can build tools that are more than just "browsers." It's a cohesive, secure, and beautiful ecosystem that transforms how users interact with the web.
