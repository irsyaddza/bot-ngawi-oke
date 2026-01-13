# Rusdi Fun Discord BOT

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Fun Discord Bot & Web Dashboard Integration**

---

## 🚀 Cara Setup

### 1. Persiapan
Pastikan kamu sudah menginstall:
- **Node.js** (Minimal v18+, v22 Recommended)
- **Git**
- **Docker** (Optional, tapi recommended buat deployment)

### 2. Clone Repository
```bash
git clone https://github.com/irsyaddza/bot-ngawi-oke.git
cd bot-ngawi-oke
```

### 3. Konfigurasi Environment (`.env`)
Buat file bernama `.env` di **folder root** project, lalu copy-paste konfigurasi di bawah ini dan isi value-nya:

```properties
# --- Config Mode ---
# Pilih: 'development' atau 'production'
APP_ENV=development

# --- Production Keys (Default) ---
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
DISCORD_CLIENT_SECRET=

# --- Development Keys ---
# Diperlukan jika APP_ENV=development
DEV_DISCORD_TOKEN=
DEV_CLIENT_ID=
DEV_GUILD_ID=
DEV_DISCORD_CLIENT_SECRET=

# --- API Keys ---
# Isi sesuai fitur yang ingin digunakan
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
GITHUB_TOKEN=
OPENROUTER_API_KEY=
EMBEDEZ_API_KEY=

# --- Web Auth ---
# Konfigurasi untuk Dashboard Web
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
ADMIN_ID=
```

### 4. Instalasi & Menjalankan (Manual)

Kamu bisa menjalankan Bot dan Web secara terpisah di terminal yang berbeda.

#### A. Menjalankan BOT
```bash
cd bot
npm install

# Register Slash Commands (Wajib saat pertama kali atau ada update command)
npm run deploy

# Start Bot
npm start
```

#### B. Menjalankan Web Dashboard
```bash
cd web
npm install

# Jalankan mode development
npm run dev
```
Akses web di: `http://localhost:3000`

---

## 🐳 Docker Deployment (Recommended)

Cara paling gampang buat deploy semuanya sekaligus tanpa ribet setup environment satu-satu.

1. **Pastikan Docker Desktop sudah running.**
2. **Pastikan file `.env` sudah ada di root folder.**
3. **Build dan Jalankan:**
   ```bash
   docker-compose up --build -d
   ```
4. **Cek Logs:**
   ```bash
   docker-compose logs -f
   ```
5. **Stop Container:**
   ```bash
   docker-compose down
   ```

---

## 📦 Tech Stack

### 🤖 Bot Backend
<div align="center">
  <img src="https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Kazagumo-9B59B6?style=for-the-badge&logo=musicbrainz&logoColor=white" alt="Kazagumo" />
  <img src="https://img.shields.io/badge/Lavalink-FF5555?style=for-the-badge&logo=java&logoColor=white" alt="Lavalink" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
</div>

### 🌐 Web Dashboard
<div align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Recharts" />
  <img src="https://img.shields.io/badge/NextAuth-black?style=for-the-badge&logo=next.js&logoColor=white" alt="NextAuth" />
</div>

---

<div align="center">
  <b>Antigravity 2026</b> 🚀
</div>
