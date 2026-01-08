# 🤖 Orang Jawa Bot

![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

> **Bot Discord berbahasa Indonesia dengan fitur Voice TTS & Welcomer!**  
> _Ngomong Jowo sitik-sitik jos!_ 🗣️

---

## ✨ Fitur Unggulan

🤖 **Multi-Engine TTS (Text-to-Speech)**  
Bot dapat berbicara di voice channel menggunakan command `/say`. Mendukung berbagai suara berkualitas tinggi:
- **Edge TTS**: Ardi (Pria) & Gadis (Wanita).
- **ElevenLabs**: Brian, Putri, Serafina (English), Putra, Aki (Japanese), Annie (Korean).

🎙️ **Voice Customization**  
Ganti suara TTS bot kapan saja dengan command `/changevoice`. Tersedia berbagai pilihan bahasa dan karakter.

👋 **Auto Voice Welcomer**  
Secara otomatis menyapa teman yang baru join ke voice channel.
- **Member Welcome**: Menyapa member yang join.
- **Bot Welcome**: Bot bisa memperkenalkan diri saat join (Command: `/voicewelcome`).

📸 **Profile Manager**  
Ganti foto profil bot dengan mudah via command `/changepfp`.

👮 **Moderation Tools**  
Kelola member dengan command `/giverole` dan `/takerole`.

📢 **Message Tools**  
Kirim pesan atau reply ke channel tertentu melalui bot menggunakan `/send` atau use apps untuk reply.

---

## 🛠️ Commands List

### 🔊 Voice Commands
| Command | Deskripsi |
| :--- | :--- |
| **/join** | Masukkan bot ke voice channel (bisa pilih channel). |
| **/leave** | Keluarkan bot dari voice channel. |
| **/say** `[pesan]` | Bot akan mengucapkan pesan kamu di voice channel. |
| **/changevoice** | Ganti suara TTS bot (Edge/ElevenLabs). |
| **/voicewelcome** `[status]` | Aktifkan/matikan sapaan otomatis bot saat join voice channel. |
| **/voicechat** `[status]` | Aktifkan/matikan voice chat AI. Panggil "Halo Rusdi" untuk ngobrol! |

### 👮 Moderation Commands
| Command | Deskripsi |
| :--- | :--- |
| **/giverole** `[user]` `[role]` | Berikan role kepada member. |
| **/takerole** `[user]` `[role]` | Cabut role dari member. |

### ✉️ Message Commands
| Command | Deskripsi |
| :--- | :--- |
| **/send** `[channel]` `[pesan]` | Kirim pesan ke channel tertentu. Mendukung mention & channel.

### ⚙️ Utility Commands
| Command | Deskripsi |
| :--- | :--- |
| **/changepfp** `[url]` | Ganti foto profil bot (Admin Only). |
| **/dashboard** `[provider]` | Lihat info & usage API (Gemini/ElevenLabs). |

### 🤖 AI Chat Commands (Mention Bot)
Mention bot untuk menggunakan perintah atau chat dengan AI (Rusdi from Ngawi).

| Mention Command | Deskripsi |
| :--- | :--- |
| **@Bot** `[pesan]` | Chat dengan AI (Rusdi from Ngawi). |
| **@Bot** `info server` | Tampilkan informasi server. |
| **@Bot** `berapa member` | Tampilkan jumlah anggota server. |
| **@Bot** `mute @user [durasi]` | Mute member (default 5 menit). |
| **@Bot** `unmute @user` | Unmute member. |
| **@Bot** `kick @user` | Kick member dari server. |
| **@Bot** `ban @user` | Ban member dari server. |
| **@Bot** `hapus X pesan` | Hapus X pesan terakhir di channel. |

---

## 🚀 Cara Install & Jalankan

### 1. Prerequisite
Pastikan kamu sudah menginstall:
- [Node.js](https://nodejs.org/) (Versi 16.9.0 atau lebih baru)
- [FFmpeg](https://ffmpeg.org/) (Sudah termasuk dalam dependency package)

### 2. Clone Repository
```bash
git clone https://github.com/username/bot-ngawi-oke.git
cd bot-ngawi-oke
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Konfigurasi
Buat file `.env` dan isi dengan konfigurasi kamu:
```env
DISCORD_TOKEN=token_bot_kamu_disini
CLIENT_ID=client_id_kamu_disini
GUILD_ID=server_id_kamu_disini
ELEVENLABS_API_KEY=api_key_kamu_disini
GEMINI_API_KEY=api_key_kamu_disini
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
- **msedge-tts** - Text-to-Speech engine (Ardi & Gadis Neural)
- **ElevenLabs API** - Premium Text-to-Speech engine
- **@google/generative-ai** - Integrasi AI (Opsional)

---

## 🤝 Kontribusi

Mau nambah fitur? Silakan **Fork** repository ini dan buat **Pull Request**!

---

<div align="center">
  From <b>Antigravity 2026</b>
</div>

