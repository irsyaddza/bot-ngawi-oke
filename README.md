# 🤖 Orang Jawa Bot

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> **Bot Discord berbahasa Indonesia dengan fitur Voice TTS & Welcomer!**  
> _Ngomong Jowo sitik-sitik jos!_ 🗣️

---

## ✨ Fitur Unggulan

🤖 **Voice TTS (Text-to-Speech)**  
Bot dapat berbicara di voice channel menggunakan command `/say`. Suara yang dihasilkan adalah suara **Pria Indonesia (Ardi)** yang natural!

👋 **Auto Voice Welcomer**  
Secara otomatis menyapa teman yang baru join ke voice channel. Gak bakal kesepian lagi!

📸 **Profile Manager**  
Ganti foto profil bot dengan mudah via command.

---

## 🛠️ Commands List

| Command | Icon | Deskripsi |
| :--- | :---: | :--- |
| **/join** | 🔌 | Masukkan bot ke voice channel (bisa pilih channel). |
| **/leave** | ❌ | Keluarkan bot dari voice channel. |
| **/say** `[pesan]` | 🗣️ | Bot akan mengucapkan pesan kamu. |
| **/changepfp** | 🖼️ | Ganti foto profil bot (Admin Only). |

---

## 🚀 Cara Install & Jalankan

### 1. Prerequisite
Pastikan kamu sudah menginstall:
- [Node.js](https://nodejs.org/) (Versi 16.9.0 atau lebih baru)
- [FFmpeg](https://ffmpeg.org/) (Sudah termasuk dalam dependency package)

### 2. Clone Repository
```bash
git clone https://github.com/username/project_bot.git
cd project_bot
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Konfigurasi
Buat file `.env` dan isi dengan token bot kamu:
```env
DISCORD_TOKEN=token_bot_kamu_disini
CLIENT_ID=client_id_kamu_disini
GUILD_ID=server_id_kamu_disini
```

### 5. Deploy Commands
Daftarkan slash commands ke Discord:
```bash
npm run deploy
```

### 6. Jalankan Bot
```bash
npm start
```

---

## 📦 Tech Stack

- **Discord.js v14** - Library utama
- **@discordjs/voice** - Voice connection
- **msedge-tts** - Text-to-Speech engine (Microsoft Edge - Ardi Neural)
- **ffmpeg-static** - Audio processing

---

## 🤝 Kontribusi

Mau nambah fitur? Silakan **Fork** repository ini dan buat **Pull Request**!

---

<div align="center">
  Dibuat dengan ❤️ oleh <b>Irsyad</b>
</div>
