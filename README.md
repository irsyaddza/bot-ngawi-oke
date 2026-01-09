# 🤖 Bot Ngawi Oke (Rusdi Edition)

[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![DisTube](https://img.shields.io/badge/DisTube-FF0000?style=for-the-badge&logo=discogs&logoColor=white)](https://distube.js.org/)
[![Spotify](https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white)](https://www.spotify.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Fun discord bot**  

---

## 🔥 Fitur Utama

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
Rusdi pinter (kadang-kadang) karena dibekali otak dari Google Gemini:
- **Chatting**: Bisa curhat atau nanyain hal gak guna.
- **Server Info**: Cek kondisi server lewat chat biasa.
- **Moderator**: Rusdi bisa nge-kick, ban, atau hapus pesan kalo disuruh (asal ada izin).

---

## 🛠️ Daftar Command

### 🔊 Music & Voice
| Command | Apa gunanya? |
| :--- | :--- |
| **/play** `[lagu]` | Nyetel musik + munculin tombol kontrol. |
| **/stop** | Kasih dia istirahat, stop musik & bersihin queue. |
| **/queue** | Intip lagu apa aja yang bakal diputer selanjutnya. |
| **/say** `[pesan]` | Suruh bot ngomong sesuatu di VC. |
| **/join** / **/leave** | Panggil atau usir bot dari voice channel. |

### 👮 Moderasi & Utility
| Command | Apa gunanya? |
| :--- | :--- |
| **/giverole** / **/takerole** | Atur role member gak pake ribet. |
| **/send** `[channel]` | Kirim pesan lewat bot ke channel lain. |
| **/changevoice** | Ganti-ganti suara bot (Edge/ElevenLabs). |
| **/dashboard** | Cek kuota API Gemini/ElevenLabs biar gak boncos. |

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
    # ffmpeg udah dapet di dalem (ffmpeg-static), gak perlu install manual.
    ```
4.  **Isi `.env`**:
    Pake file `.env` dan masukin token-token sakti lu:
    ```env
    DISCORD_TOKEN=
    CLIENT_ID=
    GUILD_ID=
    ELEVENLABS_API_KEY=
    GEMINI_API_KEY=
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
  <img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube" />
  <img src="https://img.shields.io/badge/Spotify-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify" />
  <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
  <p><i>Plus msedge-tts, ElevenLabs SDK, & FFmpeg Static</i></p>
</div>

---

<div align="center">
  <b>Antigravity 2026</b> 🚀
</div>
