# 🎮 Discord Clone

نسخة كاملة من Discord للدردشة مع الأصدقاء — Full-stack Discord clone built with Next.js, Prisma, Socket.IO, and more.

## 🇸🇦 التشغيل المحلي (خطوات سريعة)

```bash
# 1. تثبيت الحزم
npm install --legacy-peer-deps

# 2. إعداد ملف .env (انسخ من .env.example)
#    DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL

# 3. قاعدة البيانات
npm run db:push

# 4. تشغيل التطبيق (Next.js + Socket.IO)
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) — سجّل حسابًا جديدًا من `/sign-up` ثم أنشئ سيرفرًا.

| الميزة | الوصف |
|--------|--------|
| تسجيل الدخول | `/sign-in` و `/sign-up` |
| السيرفرات والقنوات | إنشاء، تعديل، حذف |
| الدعوات | `/invite/[code]` |
| الدردشة الفورية | Socket.IO |
| الرسائل | تعديل وحذف |
| الملفات | رفع من الجهاز أو رابط URL |
| البروفايل | `/profile` |
| البحث عن أصدقاء | أيقونة العدسة في الشريط الجانبي |
| الصوت/الفيديو | قنوات AUDIO/VIDEO + LiveKit |

![Discord Clone](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black?style=for-the-badge&logo=socket.io)

## ✨ Features

- 🔐 **Authentication** — Email/password registration & login with NextAuth.js
- 🏠 **Servers** — Create, edit, delete servers with invite links
- 📝 **Channels** — Text, Audio, Video channels within servers
- 💬 **Real-time Chat** — Instant messaging with Socket.IO
- ✏️ **Message Actions** — Edit and delete messages in real-time
- 👥 **Member Management** — Kick members, change roles (Admin/Moderator/Guest)
- 🔗 **Invite System** — Generate shareable invite links
- 💌 **Direct Messages** — 1:1 private conversations
- 📎 **File Sharing** — Share files and images in chat
- 🎤 **Voice & Video** — LiveKit integration (optional)
- 📱 **Responsive** — Works on desktop and mobile
- 🌙 **Dark Mode** — Discord-style dark theme
- ♾️ **Infinite Scroll** — Load older messages on scroll

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework (App Router) |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| Prisma ORM | Database ORM |
| PostgreSQL | Database |
| Socket.IO | Real-time messaging |
| NextAuth.js | Authentication |
| TanStack Query | Data fetching & caching |
| Zustand | State management |
| LiveKit | Voice/Video (optional) |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** database (local or cloud)
- **Docker** (optional, for local PostgreSQL)

### 1. Clone and Install

```bash
cd "e:\Projects\fake discord\discord-clone"
npm install --legacy-peer-deps
```

### 2. Start PostgreSQL

**Option A: Docker (recommended)**
```bash
docker-compose up -d
```

**Option B: Local PostgreSQL**
Make sure PostgreSQL is running on port 5432 and update `.env` with your connection string.

**Option C: Cloud Database**
Use [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app) and update `DATABASE_URL` in `.env`.

### 3. Configure Environment

Edit the `.env` file:

```env
# Required
DATABASE_URL="postgresql://discord:discord123@localhost:5432/discord_clone?schema=public"
AUTH_SECRET="your-secret-key"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional (for voice/video - LiveKit)
NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
LIVEKIT_API_KEY="your-key"
LIVEKIT_API_SECRET="your-secret"
```

> **ملاحظة:** رفع الملفات يعمل محليًا عبر `/api/upload` دون الحاجة لخدمة خارجية. يمكنك أيضًا لصق رابط URL مباشرة.

### 4. Setup Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
discord-clone/
├── server.js                 # Custom server (Next.js + Socket.IO)
├── prisma/
│   └── schema.prisma         # Database schema
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── (auth)/           # Sign in / Sign up
│   │   ├── (main)/           # Main app (servers, channels, DMs)
│   │   ├── (invite)/         # Invite acceptance
│   │   └── api/              # API routes
│   ├── components/
│   │   ├── chat/             # Chat UI (messages, input, header)
│   │   ├── modals/           # All modal dialogs
│   │   ├── navigation/       # Server navigation sidebar
│   │   ├── providers/        # Context providers
│   │   ├── server/           # Server sidebar components
│   │   └── ui/               # shadcn/ui base components
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utilities & config
│   └── types/                # TypeScript types
└── docker-compose.yml        # PostgreSQL for local dev
```

## 🎯 Usage Guide

### Creating a Server
1. Click the **+** button in the left sidebar
2. Enter a server name and optional image URL
3. Click **Create**

### Inviting Friends
1. Click the server name at the top of the channel list
2. Select **Invite People**
3. Copy the invite link and share it

### Chatting
1. Select a text channel
2. Type your message and press Enter or click the send button
3. Messages appear in real-time for all members

### Direct Messages
1. Click on a member's name in the server sidebar
2. Start a private conversation

### Managing Members (Admin)
1. Click server name → **Manage Members**
2. Change roles or kick members using the dropdown

## 🔧 Development

```bash
# Run with Next.js dev server only (no Socket.IO)
npm run dev:next

# Run with custom server (Next.js + Socket.IO)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Open Prisma Studio
npm run db:studio
```

## 📝 License

This project is for educational purposes only. Not affiliated with Discord.
