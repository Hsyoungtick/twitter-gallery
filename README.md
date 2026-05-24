<div align="center">

### Twitter Gallery

A masonry-style Twitter/X media gallery browser based on [Nitter](https://github.com/zedeus/nitter)

English / [中文](README_zh.md)

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
- Auto-refresh followed users' data every hour

## 🚀 Quick Start

### Prerequisites

- Deploy a [Nitter instance](docs/nitter_config.md)

### Option 1: Docker (Recommended)

```bash
docker run -d --name twitter-gallery -p 5173:5173 -v ./twitter-gallery/data:/app/data -e NITTER_URL=http://nitter:8080 --restart unless-stopped ghcr.io/hsyoungtick/twitter-gallery:latest
```

Visit http://localhost:5173 to use the app.

### Option 2: Manual Setup

```bash
git clone https://github.com/Hsyoungtick/twitter-gallery.git
cd twitter-gallery

# Configure environment variables
cp .env.example .env
cp backend/.env.example backend/.env

# Install dependencies
pnpm install
cd backend && pnpm install && cd ..

# Start development server
pnpm start
```

## 🏗️ Project Structure

```
twitter-gallery/
├── backend/                # Backend service
│   ├── db.js               # Database operations
│   ├── index.js            # Express server entry
│   └── package.json
├── data/                   # SQLite database (auto-created)
├── src/                    # Frontend source
│   ├── components/         # Vue components
│   ├── composables/        # Vue composables
│   ├── pages/              # Page components
│   └── utils/              # Utility functions
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## ✨ Inspired By

- [twitter-media-gallery](https://github.com/sajjadalis/twitter-media-gallery)

## 🤖 Disclaimer

This project was generated with the assistance of AI. If you have concerns about AI-generated code, please consider this before using it.

## 📝 License

[MIT](LICENSE)
