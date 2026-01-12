# 📄 RPD: Rusdi Bot Web Dashboard & Landing Page

## 1. 🎯 Overview
Development of a web interface for "Rusdi Bot" to provide a landing page for public users and a dashboard for administrators. The project will be restructured into a monorepo-style Docker setup containing both the Discord bot and the Next.js web application.

## 2. 🏗️ Architecture
- **Structure**: Multi-container Docker Compose.
- **Microservices**:
    1.  `bot`: The existing Discord.js bot.
    2.  `web`: New Next.js application.
- **Database Strategy**: Shared Docker Volume mapping the local SQLite `data/` folder to both containers.
    - Bot writes to DB (Analytics, Weather, etc.).
    - Website reads from DB (Stats) and writes (Config/Settings).

### 📁 Directory Structure Plan
```
bot-ngawi-oke/
├── docker-compose.yml      # Orchestrator
├── .env                    # Shared environment variables
├── bot/                    # EXISTING BOT CODE MOVED HERE
│   ├── src/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
├── web/                    # NEW NEXT.JS APP
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── ...
└── data/                   # SHARED DATA (SQLite)
    ├── analytics.db
    ├── weather.db
    └── ...
```

## 3. 🖥️ Tech Stack (Web)
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Minimalist & Utility-first).
- **Components**: [JokoUI](https://github.com/rayasabari/joko-ui) (Premium, Accessible, Dark Mode default).
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (High-performance animations).
- **Auth**: [NextAuth.js](https://next-auth.js.org/) (Discord Provider) - restricted to specific Admin IDs.
- **Database ORM**: `better-sqlite3` (Direct access) or `drizzle-orm` (if creating new schema), but likely reusing raw SQL queries or shared logic for compatibility with bot's existing DB structure.

## 4. 📝 Features Requirement

### 🏠 Public Landing Page
- **Hero Section**:
    - **Headline**: "Advanced. Private. Open Source."
    - **Actions**: "View Source Code" (GitHub) & "Deploy Your Own".
    - **Stats**: Live GitHub Stars, Forks, and Last Commit info (via GitHub API).
- **Features Showcase**:
    - Functional: Music (Lavalink), AI (Gemini/DeepSeek), Analytics, Weather, Downloader.
    - Technical: Docker-ready, Monorepo structure, Clean Architecture.
- **Powered By (Vendors)**:
    - Logo Marquee of tech/APIs used: Discord.js, Next.js, Deepseek, Gemini, Open-Meteo, QuickChart, Lavalink, sqlite.
- **GitHub Integration**:
    - "Recent Commits" widget.
    - "Contributors" avatar pile.
- **Commands List**:
    - Searchable command reference table.

### 🔐 Admin Dashboard (Login Required)
- **Authentication**:
    - Login via Discord.
    - Whitelist check against `OWNER_ID` or specific Role IDs.
- **Overview**:
    - Live System Status (RAM/CPU usage of VPS - via lightweight API or polling).
    - Database Health check.
- **Analytics Management**:
    - Visual Graphs (Recreating the QuickChart graphs with Chart.js/Recharts interactively).
    - Leaderboard Management.
- **Configuration (CRUD)**:
    - Toggle features (Weather, Analytics) per server.
    - **Blacklist/Whitelist** management.
    - **Broadcast/Announcement**: Send message from Web to Discord channels.
- **System Management**:
    - **Database Backup**: One-click download of `analytics.db` and `weather.db` (using SQLite native backup or stream).
    - **Logs**: Stream recent logs or view Error Logs.

## 5. 🎨 Design Guidelines
- **Theme**: "Cyber Dark" / "Midnight".
    - Background: `#0f172a` (Slate 900) or `#000000`.
    - Accents: Gradient Blue/Purple (Discord Blurple mixed with Cyan).
- **Typography**: `Inter` or `Geist Sans`.
- **Motion**:
    - Page transitions.
    - Scroll reveal animations.
    - Micro-interactions on buttons/cards.

## 6. 🚀 Implementation Steps
1.  **Refactor**: detailed backup, move current files to `/bot`, update paths in `bot/Dockerfile`.
2.  **Setup Web**: Initialize Next.js project in `/web`.
3.  **Docker Integration**: Create root `docker-compose.yml` linking both services.
4.  **Backend Logic (Web)**: API Routes to read shared SQLite DB.
5.  **Frontend Dev**: Build Landing Page first, then Admin Dashboard.
6.  **Deploy**: Push to VPS, `docker-compose up --build`.

## 7. 🛡️ Security
- **DB Locking**: Ensure SQLite WAL mode is enabled to handle concurrent reads/writes from two processes (Bot & Web).
- **Auth**: Strict validation of Discord User ID for admin routes.
