# Rusdi Fun Discord BOT

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Lavalink](https://img.shields.io/badge/Lavalink-FF5555?style=for-the-badge&logo=java&logoColor=white)](https://lavalink.dev/)
[![Kazagumo](https://img.shields.io/badge/Kazagumo-9B59B6?style=for-the-badge&logo=musicbrainz&logoColor=white)](https://github.com/Takiyo0/Kazagumo)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Open-Meteo](https://img.shields.io/badge/Open--Meteo-00a8ff?style=for-the-badge&logo=cloudfoundry&logoColor=white)](https://open-meteo.com/)

**Fun discord bot**  

---

## 🔥 Fitur Utama

### 📥 All-in-One Downloader
Mau nyomot video dari mana aja? Gas!
- **1000+ Sites Supported**: TikTok, Facebook, Instagram, Twitter/X, YouTube, Reddit, dan banyak lagi.
- **Smart Embed**: Tampilan bersih, ada tombol "source"
- **Audio Only**: Bisa convert video jadi MP3 juga kalau cuma butuh suaranya.

### 🎵 Music System (Powered by Lavalink)
Bosen sepi? Rusdi bisa nyetel lagu dari mana aja:
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud.
- **Lavalink Backend**: Audio streaming via Lavalink server - lebih stabil dan reliable.
- **Interactive Controls**: Gak perlu ngetik terus, tinggal klik tombol-tombol cakep buat Skip, Pause, Shuffle, dll.
- **Queue System**: Add, shuffle, repeat, dan manage playlist dengan mudah.

### 🎙️ Voice & TTS (Text-to-Speech)
Ngobrol tanpa mic? Bisa banget:
- **Premium Voices**: Pake engine premium kayak ElevenLabs & Edge TTS.
- **Auto Welcomer**: Bot auto nyapa siapa aja yang nongol di Voice Channel. Lu gak bakal sendirian lagi.
- **Voice Chat AI**: Panggil "Halo Rusdi", dan si bot bakal jawab pake suara aslinya.

### 🤖 Smart AI Interaction
Rusdi pinter (kadang-kadang) karena dibekali otak dari Google Gemini & DeepSeek:
- **Persistent Memory**: Chat history disimpan ke database, Rusdi ingat percakapan sebelumnya!
- **Dual AI Engine**: Bisa switch antara Gemini dan DeepSeek sesuai kebutuhan.
- **Server Info**: Cek kondisi server lewat chat biasa.
- **Moderator**: Rusdi bisa nge-kick, ban, mute, atau hapus pesan kalo disuruh (asal ada izin).

### 🔒 Voice Lock
Kunci voice channel biar gak sembarang orang join:
- **Whitelist System**: Pilih user/role yang boleh join.
- **Smart Block**: User yang gak berhak auto di-kick tanpa ganggu yang udah di dalem.
- **Persistent**: Konfigurasi tetap aman meski bot restart.

### 📋 Audit Log
Pantau aktivitas server secara real-time:
- **Voice Events**: Join, Leave, Mute, Deafen, Kick.
- **Member Events**: Join, Leave, Ban, Unban.
- **Mod Tracking**: Tau siapa yang nge-kick/ban/mute.

### 📊 Server Analytics
Weekly report server activity dengan AI-powered insights:
- **Message Tracking**: Track semua pesan per user.
- **Voice Tracking**: Hitung durasi voice chat per user.
- **AI Roasts**: Komentar lucu untuk top members (powered by Gemini/DeepSeek).
- **Visual Charts**: Grafik aktivitas harian via QuickChart.io.
- **Scheduled Reports**: Auto-post weekly report ke channel pilihan.

---

## 🛠️ Daftar Command

### 📥 Downloader & Utility
| Command | Apa gunanya? |
| :--- | :--- |
| **/dl** `[url]` | Download video dari TikTok, FB, IG, YT, dll. |
| **/dashboard** | Cek system status Gemini/ElevenLabs/OpenRouter. |
| **/ping** | Cek seberapa lemot bot merespon (latency). |

### 🔊 Music & Voice
| Command | Apa gunanya? |
| :--- | :--- |
| **/play** `[lagu]` | Nyetel musik + munculin tombol kontrol. |
| **/stop** | Kasih dia istirahat, stop musik & bersihin queue. |
| **/queue** | Intip lagu apa aja yang bakal diputer selanjutnya. |
| **/say** `[pesan]` | Suruh bot ngomong sesuatu di VC. |
| **/join** / **/leave** | Panggil atau usir bot dari voice channel. |
| **/changevoice** | Ganti-ganti suara bot (Edge/ElevenLabs). |

### 👮 Moderasi & Admin
| Command | Apa gunanya? |
| :--- | :--- |
| **/giverole** / **/takerole** | Atur role member gak pake ribet. |
| **/send** `[channel]` `[gambar]` | Kirim pesan + gambar lewat bot ke channel lain. |
| **/voicelock** | Lock/Unlock voice channel + whitelist. |
| **/auditlog** | Setting channel untuk audit log server. |

### 🤖 AI & Database
| Command | Apa gunanya? |
| :--- | :--- |
| **/logic** | Switch AI antara Gemini dan DeepSeek. |
| **/logiccheck** | Cek AI mana yang lagi aktif. |
| **/chatdb** | Lihat statistik database chat history. |
| **/clearchat** | Hapus semua chat history AI dari database. |

### 🌦️ Weather
| Command | Apa gunanya? |
| :--- | :--- |
| **/weather now** `[wilayah]` | Cek cuaca sekarang (semua user). |
| **/weather set** `[channel]` `[wilayah]` `[jam]` | Set update cuaca harian (admin). |
| **/weather stop** | Stop update cuaca harian (admin). |

### 📊 Analytics
| Command | Apa gunanya? |
| :--- | :--- |
| **/analytics setup** `[channel]` | Setup weekly report ke channel (admin). |
| **/analytics stats** | Lihat statistik pribadi minggu ini. |
| **/analytics leaderboard** | Top 10 member paling aktif. |
| **/analytics report** | Generate weekly report sekarang (admin). |
| **/analytics stop** | Hentikan weekly report (admin). |
| **/analytics test seed** | Generate dummy data untuk testing (admin). |
| **/analytics test clear** | Hapus semua data analytics (admin). |
| **/analytics test preview** | Preview report tanpa post ke channel (admin). |

---

## 🚀 Cara Setup (Buat yang Berani)

1.  **Install Node.js** (Minimal v18+, recommended v22).
2.  **Clone repo** ini:
    ```bash
    git clone https://github.com/irsyaddza/bot-ngawi-oke.git
    cd bot-ngawi-oke
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Isi `.env`** (copy dari `.env.example` kalo ada, atau bikin manual):
    ```env
    # === Discord Bot ===
    DISCORD_TOKEN=token_bot_dari_discord_developer_portal
    CLIENT_ID=client_id_bot_untuk_register_commands
    GUILD_ID=id_server_discord_untuk_deploy_commands

    # === AI Services ===
    GEMINI_API_KEY=api_key_dari_google_ai_studio
    OPENROUTER_API_KEY=api_key_dari_openrouter_untuk_deepseek

    # === Voice/TTS ===
    ELEVENLABS_API_KEY=api_key_dari_elevenlabs_untuk_tts_premium
    ```
    
    **Cara dapetin:**
    - `DISCORD_TOKEN` & `CLIENT_ID`: [Discord Developer Portal](https://discord.com/developers/applications) → Bot → Token & Application ID
    - `GUILD_ID`: Enable Developer Mode di Discord → Klik kanan server → Copy Server ID
    - `GEMINI_API_KEY`: [Google AI Studio](https://aistudio.google.com/apikey)
    - `OPENROUTER_API_KEY`: [OpenRouter](https://openrouter.ai/keys)
    - `ELEVENLABS_API_KEY`: [ElevenLabs](https://elevenlabs.io/)

5.  **Daftarin Command**:
    ```bash
    npm run deploy
    ```
6.  **Gasskeun!**:
    ```bash
    npm start
    ```

> **Note**: Music system pake public Lavalink nodes. Kalo mau pake Lavalink server sendiri, edit config di `src/utils/lavalinkManager.js`.

---

## 🐳 Docker Deployment (Optional)

Mau deploy pake Docker? Gampang:

1. **Pastiin Docker Desktop running**
2. **Build dan jalanin:**
   ```bash
   docker-compose up --build -d
   ```
3. **Lihat logs:**
   ```bash
   docker-compose logs -f
   ```
4. **Stop:**
   ```bash
   docker-compose down
   ```

> **Tip:** Build pertama agak lama (~5 menit) karena install ffmpeg + dependencies. Build selanjutnya lebih cepat karena Docker cache.

---

## 📦 Tech Stack & Library

<div align="center">
  <img src="https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js" />
  <img src="https://img.shields.io/badge/Lavalink-FF5555?style=for-the-badge&logo=java&logoColor=white" alt="Lavalink" />
  <img src="https://img.shields.io/badge/Kazagumo-9B59B6?style=for-the-badge&logo=musicbrainz&logoColor=white" alt="Kazagumo" />
  <img src="https://img.shields.io/badge/Shoukaku-3498DB?style=for-the-badge&logo=musicbrainz&logoColor=white" alt="Shoukaku" />
  <img src="https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <p><i>Plus msedge-tts, ElevenLabs SDK, OpenRouter, & FFmpeg Static</i></p>
</div>

---

<div align="center">
  <b>Antigravity 2026</b> 🚀
</div>
