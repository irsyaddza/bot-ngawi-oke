# 🤖 Bot Ngawi Oke (Rusdi Edition)

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![DisTube](https://img.shields.io/badge/DisTube-FF0000?style=for-the-badge&logo=discogs&logoColor=white)](https://distube.js.org/)
[![yt-dlp](https://img.shields.io/badge/yt--dlp-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://github.com/yt-dlp/yt-dlp)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)

**Fun discord bot**  

---

## 🔥 Fitur Utama

### 📥 All-in-One Downloader
Mau nyomot video dari mana aja? Gas!
- **1000+ Sites Supported**: TikTok, Facebook, Instagram, Twitter/X, YouTube, Reddit, dan banyak lagi.
- **Smart Embed**: Tampilan bersih, ada tombol "source"
- **Audio Only**: Bisa convert video jadi MP3 juga kalau cuma butuh suaranya.

### 🎵 Music System (Powered by DisTube)
Bosen sepi? Rusdi bisa nyetel lagu dari mana aja:
- **Multi-Platform Support**: YouTube, Spotify, SoundCloud.
- **Interactive Controls**: Gak perlu ngetik terus, tinggal klik tombol-tombol cakep buat Skip, Volume, Pause, dll.
- **Volume Presets**: Ada menu preset buat ngatur volume cepet (Normal, Bass Boost, dll).

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

### 🔒 Voice Lock (Baru!)
Kunci voice channel biar gak sembarang orang join:
- **Whitelist System**: Pilih user/role yang boleh join.
- **Smart Block**: User yang gak berhak auto di-kick tanpa ganggu yang udah di dalem.
- **Persistent**: Konfigurasi tetap aman meski bot restart.

### 📋 Audit Log (Baru!)
Pantau aktivitas server secara real-time:
- **Voice Events**: Join, Leave, Mute, Deafen, Kick.
- **Member Events**: Join, Leave, Ban, Unban.
- **Mod Tracking**: Tau siapa yang nge-kick/ban/mute.

---

## 🛠️ Daftar Command

### 📥 Downloader & Utility
| Command | Apa gunanya? |
| :--- | :--- |
| **/dl** `[url]` | Download video dari TikTok, FB, IG, YT, dll. |
| **/dashboard** | Cek kuota API Gemini/ElevenLabs/OpenRouter. |
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
| **/send** `[channel]` | Kirim pesan lewat bot ke channel lain. |
| **/voicelock** | Lock/Unlock voice channel + whitelist. |
| **/auditlog** | Setting channel untuk audit log server. |

### 🤖 AI & Database
| Command | Apa gunanya? |
| :--- | :--- |
| **/logic** | Switch AI antara Gemini dan DeepSeek. |
| **/logiccheck** | Cek AI mana yang lagi aktif. |
| **/chatdb** | Lihat statistik database chat history. |

---

## 🚀 Cara Setup (Buat yang Berani)

1.  **Install Node.js** (Minimal v16.9.0, tapi v18+ lebih mantap).
2.  **Clone repo** ini:
    ```bash
    git clone https://github.com/irsyaddza/bot-ngawi-oke.git
    cd bot-ngawi-oke
    ```
3.  **Install alat tempurnya**:
    ```bash
    npm install
    # ffmpeg & yt-dlp udah dapet di dalem, gak perlu install manual.
    ```
4.  **Isi `.env`**:
    Pake file `.env` dan masukin token-token sakti lu:
    ```env
    DISCORD_TOKEN=
    CLIENT_ID=
    GUILD_ID=
    ELEVENLABS_API_KEY=
    GEMINI_API_KEY=
    OPENROUTER_API_KEY=
    ```
5.  **Daftarin Command**:
    ```bash
    npm run deploy
    ```
6.  **Gasskeun!**:
    ```bash
    npm start
    ```

---

## 📦 Tech Stack & Library

<div align="center">
  <img src="https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js" />
  <img src="https://img.shields.io/badge/DisTube-FF0000?style=for-the-badge&logo=discogs&logoColor=white" alt="DisTube" />
  <img src="https://img.shields.io/badge/yt--dlp-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="yt-dlp" />
  <img src="https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <p><i>Plus msedge-tts, ElevenLabs SDK, OpenRouter, & FFmpeg Static</i></p>
</div>

---

<div align="center">
  <b>Antigravity 2026</b> 🚀
</div>
