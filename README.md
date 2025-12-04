<div align="center">
  <img width="1200" height="475" alt="doofTrack Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
  
  <h1>dooF-_-Track</h1>
  <p>A modern Progressive Web App for tracking your manhwa reading progress</p>
  
  ![Status](https://img.shields.io/badge/status-production-success)
  ![Version](https://img.shields.io/badge/version-1.0.0-blue)
  ![License](https://img.shields.io/badge/license-MIT-green)
  
  [Live Demo](https://doof-track.vercel.app) • [Report Bug](https://github.com/doofx0071/dooftrack/issues)
</div>

---

## ✨ Features

- 📚 **Library Management** - Organize your manhwa collection with custom statuses
- 🔍 **Browse & Search** - Discover new manhwa from MangaDex
- 📊 **Reading Statistics** - Track chapters read, completion rates, and reading history
- 🎯 **Goals & Achievements** - Set monthly/yearly reading goals and unlock achievements
- ⭐ **Ratings & Notes** - Rate manhwa and write personal notes with Markdown support
- 🌙 **Dark Mode** - Beautiful light and dark themes
- 📱 **PWA Support** - Install as a native app on any device
- 🔄 **Offline Mode** - Continue browsing your library without internet
- 💾 **Auto-Save** - Never lose your progress with automatic saving
- 🔐 **Secure** - User authentication with Supabase

## 🚀 Live Demo

**Production URL:** [https://doof-track.vercel.app](https://doof-track.vercel.app)

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **API:** MangaDex API
- **Deployment:** Vercel
- **Icons:** Lucide React

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/doofx0071/dooftrack.git
   cd dooftrack
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open browser**
   
   Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 📱 PWA Installation

1. Visit [https://doof-track.vercel.app](https://doof-track.vercel.app)
2. Click the install prompt (Chrome/Edge) or "Add to Home Screen" (Safari)
3. Enjoy the native app experience!

## 🗄️ Database Schema

The app uses Supabase with the following tables:
- `manhwa` - Manhwa metadata
- `reading_progress` - User reading progress
- `reading_goals` - Monthly/yearly reading goals
- `achievements` - Unlocked achievements

See `supabase/migrations/` for full schema.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 👤 Author

**Damascus (doofx0071)**

- GitHub: [@doofx0071](https://github.com/doofx0071)
- Project: [dooftrack](https://github.com/doofx0071/dooftrack)

## 🎉 Acknowledgments

- [MangaDex](https://mangadex.org) for the amazing API
- [Supabase](https://supabase.com) for backend infrastructure
- [Vercel](https://vercel.com) for hosting
- [Lucide](https://lucide.dev) for beautiful icons

---

<div align="center">
  <p>Made with ❤️ by Damascus</p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
