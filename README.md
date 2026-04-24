# KessokuTracker 🎸

![KessokuTracker Banner](.github/assets/banner.png)

**KessokuTracker** is a mobile-first guitar practice and progression tracker built with Next.js. Engineered with a clean, flat, and brutalist UI, it helps you log your daily guitar sessions, track your BPM improvements, manage physical strain (wrist & finger pain), and stay consistent on your musical journey.

## Features ✨

- **Mobile First & PWA Ready**: Installable as a Progressive Web App on your phone so you can log your practice with your guitar directly on your lap.
- **Session Logging**: Track the time you spend on `Warmup`, `Technique`, and `Songs`.
- **BPM Tracker**: Log current BPM targets for your riffs and watch your speed grow over time via visual charts.
- **Pain & Health Monitor**: Don't let injuries stop you. Keep an eye on wrist and finger strain over time to establish healthy practice schedules.
- **Flat Brutalist UI**: Pure, high-contrast, distraction-free interface matching a musician's utility tool. No glassmorphism, no flashy gradients — just the data you need.
- **i18n Ready**: Available in multiple languages.

## Screenshots 📱

*(Capture and drop your mobile screenshots in the `.github/assets/` folder with these names to make them appear here!)*

<div align="center">
  <img src=".github/assets/home.png" alt="Home Screen" width="200" />
  <img src=".github/assets/riffs.png" alt="Riffs Screen" width="200" />
  <img src=".github/assets/session.png" alt="Active Session Screen" width="200" />
  <img src=".github/assets/stats.png" alt="Statistics Screen" width="200" />
</div>

## Getting Started 🚀

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result. The application works best if you open chrome devtools and simulate a mobile device (e.g., iPhone 14 Pro, Pixel 7) !

## Architecture & Tech 🧰

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS V4 (Custom Flat/Brutalist theme variables)
- **Icons:** `lucide-react`
- **Charts:** `recharts` for practice, BPM, and health tracking

## License
MIT
