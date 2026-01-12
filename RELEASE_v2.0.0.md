# The Omniscient Update v2.0.0

We are proud to present **The Omniscient Update**, a major evolution for Bot Ngawi Oke. This version brings **total transparency**, **complete control**, and **dual intelligence** into a single, integrated ecosystem.

## 🌟 Key Features

### 1. Unified Activity Log (Omniscient View)
No more missed activities. Our new logging system unifies all interactions into a single timeline:
- **Chat**: Real-time text message logging.
- **Voice**: Precise tracking for Join, Leave, and Move channel events.
- **Commands**: Monitoring Slash Command usage.
Displayed with intuitive icons and color-coded indicators on the admin dashboard.

### 2. Dual AI Logic Core
Artificial intelligence flexibility at your fingertips.
- **Switchable AI**: Switch AI models between **Google Gemini** and **DeepSeek** *on-the-fly* via the Admin dashboard.
- Define the personality and logic that best suits your server needs without restarting.

### 3. Advanced Admin Dashboard
A completely rebuilt web command center powered by Next.js.
- **Live System Monitor**: Monitor CPU Load, RAM Usage, and Bot Uptime in real-time.
- **Analytics Visualization**: Interactive charts (Daily & Hourly) and "Top Active Users" lists to understand your community trends.
- **System Settings**: Add new admins and manage global configurations directly from the UI.

### 4. Database Manager & Backup
Full control over your data.
- **Visual Database Editor**: View and edit raw data from `chat_history.db`, `weather.db`, and `analytics.db` directly in the browser.
- **CRUD Capable**: Delete or modify incorrect records without touching the command line.
- **One-Click Backup**: Download the entire database in a secure ZIP file.

### 5. Seamless Deployment
- **Docker Native**: Containerized architecture ensures the bot and web app run identically in development and production.
- **Safe Migrations**: Smart database system that handles new table structures without deleting old data (`CREATE TABLE IF NOT EXISTS`).

---

## 🛠️ Technology Stack & Vendors

This update is built on a foundation of modern technologies for speed and stability:

### Backend & Bot Logic
- **Runtime**: Node.js
- **Framework**: Discord.js (Bot Interaction)
- **Database**: SQLite (via `better-sqlite3` for high performance & zero-latency)
- **AI Providers**:
  - [Google DeepMind](https://deepmind.google/technologies/gemini/) (Gemini AI)
  - [DeepSeek](https://www.deepseek.com/) (LLM Alternative)

### Web Dashboard (Frontend/Fullstack)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **UI Library**: React
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS)
- **Animations**: [Framer Motion](https://www.framer.com/motion/) (Smooth transitions)
- **Icons**: [Lucide React](https://lucide.dev/) (Clean, consistent iconography)
- **Charts**: [Recharts](https://recharts.org/) (Data Visualization)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/) (Secure Discord OAuth)

### Infrastructure
- **Containerization**: [Docker](https://www.docker.com/) & Docker Compose
