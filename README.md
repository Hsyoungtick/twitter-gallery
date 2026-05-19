<div align="center">

### Twitter Gallery

A masonry-style Twitter/X media gallery browser based on [Nitter](https://github.com/zedeus/nitter)

[中文](README_zh.md) / English

![Preview](/images/preview1.png)

![Preview](/images/preview2.png)

[Online Demo](https://twitter-gallery.hsyng.town/)

</div>

## 💻 Features

- Masonry-style media content display
- In-page popup for tweet details
- Unfolded, hierarchical tweet reply display
- @ID automatically displayed as nickname
- Quick links to source URLs everywhere
- Local caching to avoid repeated requests
- Bilingual support (Chinese & English)

## 🚀 Quick Start

### 1. Deploy Nitter Instance

Please refer to [Nitter Configuration](docs/nitter_config.md) to deploy the Nitter instance.

### 2. Clone the Project

```bash
git clone https://github.com/Hsyoungtick/twitter-gallery.git
cd twitter-gallery
```

### 3. Configure Environment Variables

Frontend:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE` | Backend API address | `http://localhost:3000/api` |
| `VITE_PORT` | Frontend dev/preview port | `5173` |

Backend:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NITTER_URL` | **Nitter instance address** | `http://127.0.0.1:8080` |
| `PORT` | Backend server port | `3000` |

### 4. Install Dependencies

```bash
# Frontend
pnpm install

# Backend
cd backend
pnpm install
```

### 5. Start Development Server

```bash
# From the project root, start both frontend and backend
pnpm start
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
pnpm start

# Terminal 2 - Frontend
pnpm dev
```

Visit http://localhost:5173 to use the app.

- Click the user icon in the top right to import followed users. Supports batch import, one username per line.
- Click the refresh button in the top right to update followed users' media content. The more users you follow, the longer it takes due to Nitter limitations.
- Click a user in the following list to filter and view only that user's media content.

## ⚡ One-Click Start & Auto-Start (PM2)

Use [PM2](https://pm2.keymetrics.io/) for production deployment with one-click start and boot auto-start.

### Prerequisites

```bash
npm install -g pm2 pm2-windows-startup
```

### One-Click Start

```bash
pnpm pm2:start
```

This will automatically build the frontend and start both backend and frontend via PM2.

### Boot Auto-Start

```bash
# Register PM2 as a Windows service (run as Administrator)
pm2-startup install

# Start the app
pnpm pm2:start

# Save the process list so it auto-restores on boot
pm2 save
```

## 🏗️ Project Structure

```
twitter-gallery/
├── backend/                # Backend service
│   ├── data/               # SQLite database (auto-created, gitignored)
│   ├── db.js               # Database operations
│   ├── index.js            # Express server entry
│   ├── .env.example        # Backend env template
│   └── package.json
├── src/                    # Frontend source
│   ├── components/         # Vue components
│   │   ├── AddUserModal.vue
│   │   ├── FollowingModal.vue
│   │   ├── Header.vue
│   │   ├── MediaGrid.vue
│   │   ├── Modal.vue
│   │   └── UserCard.vue
│   ├── composables/        # Vue composables
│   │   └── useFollowing.js
│   ├── pages/              # Page components
│   │   └── Gallery.vue
│   ├── utils/              # Utility functions
│   │   └── api.js          # API request wrapper
│   ├── router/             # Router configuration
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── .env.example            # Frontend env template
├── .gitignore
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## ✨ Inspired By

- Inspired by [twitter-media-gallery](https://github.com/sajjadalis/twitter-media-gallery): Use Twitter's Official API to fetch media (photos and videos) from a Twitter user's timeline or hashtag/keyword search results, then display it in a masonry layout

## 🤖 Disclaimer

This project was generated with the assistance of AI. If you have concerns about AI-generated code, please consider this before using it.

## 📝 License

[MIT](LICENSE)
