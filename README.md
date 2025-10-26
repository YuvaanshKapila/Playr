# Playr

AI-powered sports talent development and recruitment platform with smart matchmaking algorithms.

## Features

### Player Side
- Upload skill videos and receive AI analysis using Gemini
- Get detailed feedback on performance and technique
- Track progress with a rating system and build a video portfolio
- Gain exposure to recruiters and verified coaches

### Coach Side (Coming Soon)
- Create and manage teams
- Provide feedback on player videos
- Access AI-powered drill and training recommendations

### Recruiter Side (Coming Soon)
- Swipe-based interface for discovering athletes
- Advanced search and filtering
- Chat with players directly
- Access verified, AI-analyzed performance data

## Tech Stack

- **Frontend:** React + Vite  
- **Backend:** Supabase (PostgreSQL, Auth, Storage)  
- **AI:** Google Gemini 1.5 Flash  
- **Styling:** Custom CSS (mobile-first design)

## Algorithms

### Smart Matchmaking Algorithm
- Uses K-Nearest Neighbors (KNN) and Cosine Similarity
- Weighted scoring based on skill, performance, position, and location
- Suggests optimal player-recruiter matches

### Video Skill Scoring
- Motion analysis and pattern recognition
- Performance evaluation and consistency scoring
- AI-driven technique feedback

### Dynamic Leaderboard Ranking
- Elo-style rating system
- Adjusts for difficulty and competition level
- Ensures fair and competitive rankings

### Coaching Recommendations
- Collaborative filtering for drill and coach suggestions
- Learns from player history and improvement patterns

## Business and Revenue Model

### Contests = Engagement + Data + Monetization
Players join skill challenges or drills with small entry fees or sponsorships.  
AI or real coaches provide feedback and generate verified performance data.  
Leaderboards showcase top athletes and data is accessible to recruiters.

### Revenue Sources
- Player contest entry fees
- Sponsored contests for brand visibility
- Recruiter access to data and insights

## Hackathon Fit

### Algorithms Track
- Smart matchmaking (KNN, weighted scoring)
- Elo-based rankings
- AI-driven motion scoring

### AI/ML Track
- Gemini AI video feedback
- Skill analysis and performance insights

### Venture Track
- Scalable data-driven recruitment marketplace
- Contest-based engagement system
- Freemium and data access model

## Setup Instructions

1. Clone this repository.
2. Configure Supabase project and add credentials.
3. Run the database schema file (`supabase-schema.md`).
4. Install dependencies:
   ```bash
   npm install
Start the development server:

bash
Copy code
npm run dev
Open the application at http://localhost:5173.

License
MIT License

Built For
RythmHacks 2025
