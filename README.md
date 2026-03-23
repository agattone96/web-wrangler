# 🌐 WebWrangler: Reclaim Your Digital Workspace

**Are you drowning in browser tabs? Is your computer sounding like a jet engine just from keeping a few web apps open?** Meet **WebWrangler**. It's not just another browser—it's a lightning-fast, hyper-secure desktop command center for all your favorite websites and web apps. Stop wrestling with browser clutter and step into a beautifully organized, private, and distraction-free zone.

## ✨ Why WebWrangler is an Absolute Game-Changer

* 🚀 **Blazing Fast & Lightweight:** Say goodbye to lag. WebWrangler forcefully strips away invisible background trackers, bloatware, and annoying ads *before* they even load. The result? A buttery-smooth experience that sips your computer's memory instead of guzzling it.
* 🛡️ **Ironclad Privacy:** What happens in WebWrangler, stays in WebWrangler. Every app runs in its own secure, isolated vault. That means social media sites and ad networks absolutely cannot snoop on what you're doing in your other tabs. 
* 🌙 **Gorgeous Universal Dark Mode:** We've built in a beautiful, highly optimized dark theme that seamlessly forces *every single website* into a sleek dark mode. No clunky browser extensions required. 
* 🧠 **Photographic Memory:** Close the app in a hurry? No problem. WebWrangler instantly saves your exact setup. When you come back, your entire workspace is ready and waiting right where you left it.

---

## 🛠️ Get Started in Minutes

Ready to completely upgrade your workflow? Getting WebWrangler up and running on your machine is incredibly straightforward. *(Just make sure you have Node.js installed on your system!)*

### 1. Grab the Code
Open up your terminal and clone the app directly to your computer:
```bash
git clone [https://github.com/agattone96/web-wrangler.git](https://github.com/agattone96/web-wrangler.git)
cd web-wrangler
```

### 2. Install the Engine
Let the package manager download everything WebWrangler needs to run at top speed:
```bash
npm install
```

### 3. Launch Your Workspace
Fire up the app in development mode and experience the magic (includes hot-reloading!):
```bash
npm run dev
```

---

## 🧰 The Ultimate Developer Toolkit (Command Line Arsenal)

Whether you want to build a standalone app, clean up the code, or run security checks, we've packed in every command you could possibly need. Run any of these from the root folder:

### 📦 Building & Packaging
Want to turn WebWrangler into a permanent desktop app? Use these commands to build it for Windows, Mac, or Linux.
* **`npm run build`** - Compiles all the TypeScript and prepares the core app files for production.
* **`npm run dist`** - The big one! Compiles the app and generates the final, installable application files (like `.exe`, `.dmg`, or `.AppImage`) inside the `dist/` folder.
* **`npm run pack`** - Creates an unpacked version of the app for fast local testing without taking the time to compress it into an installer.

### 🧹 Quality Control & Formatting
Keep the codebase spotless and bug-free with our built-in maintenance tools.
* **`npm run lint`** - Scans the code for potential bugs, bad practices, and messy formatting.
* **`npm run format`** - Automatically magically fixes code spacing, quotes, and styling across the entire project.
* **`npm test`** - Runs our automated testing suite to make sure you didn't accidentally break anything! 
* **`npm run verify`** - The ultimate checkpoint. Runs linting, formatting, and testing all at once. *(Always run this before submitting a Pull Request!)*

### 🛠️ Utilities
* **`npm run clean`** - Nukes the `dist/` and `build/` folders so you can start completely fresh. Great for fixing weird cache issues.
* **`npm update`** - Checks for and safely installs updates for all the under-the-hood packages powering WebWrangler.

*Built for speed, privacy, and absolute peace of mind.*
