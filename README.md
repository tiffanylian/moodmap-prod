# 🗺️ MoodMap

A real-time mood mapping application with community reporting and progressive moderation. Users can share their emotional state across a map and report inappropriate content with an escalating moderation system.

## 🎯 Features

- **Interactive Map**: Visualize user moods in real-time on a Mapbox GL map
- **Mood Pins**: Share your mood (😊, 😐, 😢) with a message and location
- **Community Moderation**: Report inappropriate content
- **Progressive Moderation**: 
  - 1st violation: 3 reports to delete next pin
  - 2nd violation: 2 reports to delete next pin
  - 3rd violation: 1 report to delete next pin
  - Suspended: Account locked, no new pins allowed
- **Authentication**: Secure login via Supabase Auth
- **Daily Streaks**: Track consecutive days of posting

## 🛠️ Tech Stack

### Frontend
- React + TypeScript
- Vite (build tool)
- Mapbox GL (mapping)
- Framer Motion (animations)
- TailwindCSS (styling)
- Supabase JS Client

### Backend
- FastAPI (Python web framework)
- Uvicorn (ASGI server)
- Supabase Python Client
- Better-Profanity (content moderation)
- TextBlob (sentiment analysis)

### Database
- Supabase PostgreSQL
- Row Level Security (RLS)

---

## 📋 Prerequisites

- **Node.js 18+** (for frontend)
- **Python 3.13+** (for backend)
- **Supabase Account** (free tier available at [supabase.com](https://supabase.com))
- **Mapbox API Key** (free tier at [mapbox.com](https://www.mapbox.com))

---

## 🚀 Quick Start (Local Development)

### 1️⃣ Clone & Setup

```bash
# Clone the repository
git clone https://github.com/tiffanylian/moodmap.git
cd moodmap

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../
pip install -r requirements.txt
```

### 2️⃣ Environment Variables

Create `.env` file in `src/backend/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
```

Create `.env.local` file in `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_MAPBOX_TOKEN=your-mapbox-token
VITE_BACKEND_URL=http://localhost:8000
```

### 3️⃣ Start Backend

```bash
# From root directory
python -m uvicorn src.backend.main:app --reload --port 8000

# Backend will run on http://localhost:8000
```

### 4️⃣ Start Frontend (in new terminal)

```bash
# From root directory
cd frontend
npm run dev

# Frontend will run on http://localhost:5173
```

### 5️⃣ Open in Browser

Go to **http://localhost:5173** and start mapping moods! 🎉

---

## 📦 Deployment

### Deploy Frontend to Vercel

1. Push code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. **Root Directory**: `frontend`
5. **Framework Preset**: Vite
6. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MAPBOX_TOKEN`
   - `VITE_BACKEND_URL` (your Railway backend URL)
7. Deploy! 🚀

### Deploy Backend to Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create New Project → Deploy from GitHub
4. Select your repository
5. Add Environment Variables:
   - `SUPABASE_URL`
   - `SUPABASE_KEY` (service role key)
6. Go to **Settings** → **Deploy**
7. Set **Start Command**: 
   ```
   python -m uvicorn src.backend.main:app --host 0.0.0.0 --port $PORT
   ```
8. Deploy! 🎉

Get your Railway URL from the **Domains** section and update your frontend `VITE_BACKEND_URL`.

---

## 📁 Project Structure

```
moodmap/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── api/             # API client for backend
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # Auth context
│   │   └── lib/             # Supabase config
│   └── package.json
├── src/
│   ├── backend/
│   │   ├── main.py          # FastAPI app & endpoints
│   │   └── checker.py       # Content moderation logic
│   └── aggregation/         # Data processing
├── supabase/
│   └── schema.sql          # Database schema
├── requirements.txt        # Python dependencies
├── Procfile               # Deployment config
├── railway.json           # Railway config
└── README.md             # This file
```

---

## 🔌 API Endpoints

### POST `/pins/report`
Report a mood pin for inappropriate content.

**Request:**
```json
{
  "pin_id": 123,
  "reporter_id": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "pin_deleted": false,
  "user_suspended": false
}
```

---

## 🗄️ Database Schema

### `mood_pins` Table
- `id` (int, PK)
- `user_id` (uuid, FK → users)
- `mood` (text: HAPPY, NEUTRAL, SAD)
- `note` (text)
- `latitude` (float)
- `longitude` (float)
- `created_at` (timestamp)

### `pin_reports` Table
- `id` (int, PK)
- `pin_id` (int, FK → mood_pins)
- `reporter_id` (uuid, FK → users)
- `created_at` (timestamp)
- **Constraint**: Unique(pin_id, reporter_id) - prevents duplicate reports

### `users` Table (extended)
- `id` (uuid, PK)
- `email` (text)
- `moderation_level` (int, default 0)
  - 0 = Normal
  - 1 = 1st violation
  - 2 = 2nd violation
  - 3+ = Suspended

---

## 🔐 Environment Variables Reference

| Variable | Location | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | frontend/.env.local | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend/.env.local | Supabase anon key (public) |
| `VITE_MAPBOX_TOKEN` | frontend/.env.local | Mapbox API token |
| `VITE_BACKEND_URL` | frontend/.env.local | Backend API URL (localhost or Railway) |
| `SUPABASE_URL` | src/backend/.env | Your Supabase project URL |
| `SUPABASE_KEY` | src/backend/.env | Supabase **service role key** (private) |

**⚠️ Important**: Use the **service role key** for backend (not the anon key). It has full database access needed for moderation.

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 8000 is in use
lsof -ti:8000 | xargs kill -9

# Then restart
python -m uvicorn src.backend.main:app --reload --port 8000
```

### "Failed to report pin" error
- ✅ Check `VITE_BACKEND_URL` in frontend/.env.local
- ✅ Verify backend is running on port 8000
- ✅ Check Supabase credentials in src/backend/.env
- ✅ Look at browser console for specific error

### Frontend can't connect to Supabase
- ✅ Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- ✅ Check Supabase RLS policies
- ✅ Look at browser Network tab in DevTools

---

## 📝 Moderation System

### How It Works

1. **First Violation**: Pin reported 3 times → pin deleted, user level → 1
2. **Second Violation**: Next pin reported 2 times → deleted, user level → 2
3. **Third Violation**: Next pin reported 1 time → deleted, user level → 3
4. **Suspended**: User cannot submit new pins

### Report Flow
1. User clicks report flag on a pin
2. Confirmation dialog appears
3. User confirms report
4. Frontend calls `/pins/report` endpoint
5. Backend checks:
   - Pin exists
   - User not already suspended
   - Duplicate report prevention
6. Report recorded in database
7. Backend counts reports, checks threshold
8. If threshold met: delete pin, increment moderation level
9. Frontend shows success message and removes pin from UI

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Push and open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🎓 Learning Resources

- [Supabase Docs](https://supabase.com/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)

---

## 💡 Future Features

- [ ] Email notifications for moderation actions
- [ ] User profiles with mood history
- [ ] Mood trends and analytics
- [ ] Block/mute users
- [ ] Custom mood categories
- [ ] Dark mode
- [ ] Mobile app

---

**Made with 💜 by Tiffany Lian**
