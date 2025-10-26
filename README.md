# Playr - Sports Talent Platform

AI-Powered sports talent development and recruitment platform with smart matchmaking algorithms.

## Features

### For Players
- Upload skill videos and get instant AI analysis from Gemini
- Receive detailed feedback on technique and performance
- Track your progress with rating system
- Build your video portfolio
- Get discovered by recruiters

### For Coaches (Coming Soon)
- Create and manage teams
- Provide feedback on player videos
- Track team performance
- Access AI-powered drill recommendations

### For Recruiters (Coming Soon)
- Tinder-style swipe interface for talent discovery
- Advanced search filters
- Real-time chat with players
- View AI-analyzed performance data

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini 1.5 Flash
- **Styling**: Custom CSS with mobile-first design

## Algorithms

### 1. Smart Matchmaking Algorithm
- K-Nearest Neighbors (KNN) and Cosine Similarity
- Weighted scoring based on skill level, performance, location, and position
- Recommends optimal player-recruiter matches

### 2. Video Skill Scoring
- Motion analysis and pattern detection
- Performance evaluation with consistency scoring
- AI-powered technique feedback

### 3. Dynamic Leaderboard Ranking
- Elo-style rating system
- Adjusts for difficulty and competition level
- Fair and competitive rankings

### 4. Coaching Recommendations
- Collaborative filtering algorithm
- Suggests drills and coaches based on player patterns
- Uses historical data from similar players

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase project: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Open the file `supabase-schema.md` in this project
4. Copy and paste each SQL section into the SQL Editor and run them in order
5. Go to Storage section and verify the `videos` and `avatars` buckets are created
6. Go to Database > Replication and enable realtime for the `messages` table

### 2. Run the Application

```bash
# Install dependencies (already done)
npm install

# Start development server
npm run dev
```

The app will be available at: http://localhost:5173

### 3. Test the App

1. Open http://localhost:5173 in your browser
2. Click "Sign Up" to create a new account
3. Choose "Player" as your role
4. Fill in your profile information
5. Upload a skill video and get instant AI feedback!

## Environment Variables

The API keys and Supabase credentials are already configured in:
- `src/config/supabase.js` - Supabase connection
- `src/config/gemini.js` - Gemini AI configuration

**Note**: In production, these should be moved to environment variables (.env file).

## Project Structure

```
playr-app/
├── src/
│   ├── config/
│   │   ├── supabase.js       # Supabase client
│   │   └── gemini.js         # Gemini AI configuration
│   ├── pages/
│   │   ├── IntroPage.jsx     # Login/Register
│   │   ├── RoleSelection.jsx # Choose Player/Coach/Recruiter
│   │   ├── PlayerSetup.jsx   # Player profile setup
│   │   ├── PlayerDashboard.jsx # Player main screen
│   │   └── PlaceholderPage.jsx # Coach/Recruiter placeholder
│   ├── App.jsx               # Main app router
│   ├── index.css             # Global styles
│   └── main.jsx              # Entry point
├── supabase-schema.md        # Database schema (SQL commands)
└── README.md                 # This file
```

## Key Features Implemented

✅ User authentication with saved sessions
✅ Role-based onboarding (Player/Coach/Recruiter)
✅ Player profile creation and management
✅ Video upload to Supabase Storage
✅ Gemini AI video analysis with instant feedback
✅ AI scoring system (0-100)
✅ Video timeline/portfolio
✅ Mobile-responsive design
✅ Green-yellow gradient theme from logo
✅ Placeholder screens for Coach and Recruiter

## Hackathon Fit

### Algorithms Track ✅
- Smart matchmaking using KNN and weighted scoring
- Elo-style ranking system
- Collaborative filtering for recommendations
- Motion analysis for skill evaluation

### AI/ML Track ✅
- Gemini AI for video analysis
- AI-powered coaching recommendations
- Smart player-recruiter matching

### Venture Track ✅
- Clear business model (freemium + contests)
- Scalable SaaS platform
- Data-driven recruitment marketplace

## Next Steps

- [ ] Implement real-time chat with WebSockets
- [ ] Build Coach dashboard with team management
- [ ] Create Recruiter swipe interface
- [ ] Add contest system with leaderboards
- [ ] Implement matchmaking algorithm visualization
- [ ] Add social features (follow players, like videos)
- [ ] Mobile app version (React Native)

## Development

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT

---

**Built for RythmHacks 2025**
