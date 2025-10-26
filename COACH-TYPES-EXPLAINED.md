# Playr Coaching System - Two Coach Types

## Overview
Playr now supports TWO types of coaches with different workflows and capabilities:

---

## 1. **GENERAL COACH** (Training Sessions)

### Purpose:
Independent coaches who offer training sessions to individual players

### What They Can Do:
- ✅ Create 1-on-1 coaching sessions
- ✅ Create group training sessions
- ✅ Set pricing for their sessions
- ✅ View students who book their sessions
- ✅ Watch student training videos
- ✅ Review AI analysis of student performance
- ✅ Message students
- ✅ Track session bookings

### Dashboard Tabs:
1. **Home** - Profile stats & information
2. **Sessions** - Create and manage training sessions
3. **Students** - View players who booked sessions + their videos
4. **Bookings** - All session reservations
5. **Messages** - Chat with students

### How Players Interact:
- Players browse available sessions in their Coaching tab
- Players book and pay for sessions
- Coaches see these students in their Students tab
- Coaches can watch student videos to prepare for sessions

### Use Cases:
- Private skills trainer
- Freelance coach
- Specialized coach (e.g., shooting coach, goalie coach)
- Guest clinician

---

## 2. **TEAM/CLUB COACH** (Manage Teams)

### Purpose:
Coaches who run organized teams, clubs, or academies

### What They Can Do:
- ✅ Create teams/clubs
- ✅ Add players to team roster
- ✅ Assign jersey numbers & positions
- ✅ Monitor entire team performance
- ✅ Compare team members in competitions
- ✅ View all roster member videos
- ✅ Track team statistics
- ✅ Message team members

### Dashboard Tabs:
1. **Home** - Profile stats & information
2. **Teams** - Create and manage teams/clubs
3. **Roster** - View all team members
4. **Performance** - Team stats and comparisons
5. **Messages** - Chat with team

### How Players Interact:
- Coaches invite players to join their team
- Players accept team invitation
- Once on roster, coach can track all their videos
- Coaches compare players within the team

### Use Cases:
- High school basketball coach
- Club soccer coach
- AAU team coach
- Travel team coach
- Academy director

---

## Database Structure

### Tables:

#### `coach_profiles`
```sql
- id
- user_id
- coach_type ('general' or 'club')  ← NEW!
- sport
- specialty
- bio
- experience_years
- hourly_rate
- rating
- total_sessions
```

#### `teams` (NEW - for club coaches)
```sql
- id
- coach_id (references profiles)
- team_name
- sport
- age_group
- skill_level
- description
- created_at
```

#### `team_members` (NEW - players on a team)
```sql
- id
- team_id (references teams)
- player_id (references player_profiles)
- jersey_number
- position
- joined_at
```

#### `coaching_sessions` (for general coaches)
```sql
- id
- coach_id
- title
- description
- session_type ('1-on-1' or 'group')
- sport
- price
- max_participants
- date
- time
```

#### `session_bookings` (player bookings)
```sql
- id
- session_id
- player_id
- status
- created_at
```

---

## Workflow Comparison

### General Coach Workflow:
```
1. Coach creates profile (type: general)
2. Coach creates training sessions
3. Sessions appear in Player Coaching tab
4. Players book sessions
5. Coach sees booked students
6. Coach watches student videos to prepare
7. Coach conducts session
8. Repeat
```

### Team/Club Coach Workflow:
```
1. Coach creates profile (type: club)
2. Coach creates a team
3. Coach adds players to roster
4. Coach monitors all roster videos automatically
5. Coach compares team members
6. Coach tracks team performance
7. Coach messages entire team
8. Compete in team challenges
```

---

## Key Differences

| Feature | General Coach | Team/Club Coach |
|---------|--------------|-----------------|
| **Creates Sessions** | ✅ Yes | ❌ No |
| **Players Book** | ✅ Yes | ❌ No |
| **Manages Teams** | ❌ No | ✅ Yes |
| **Adds Players to Roster** | ❌ No | ✅ Yes |
| **Tracks Team Stats** | ❌ No | ✅ Yes |
| **Compares Players** | ❌ No | ✅ Yes |
| **Shown in Player Coaching Tab** | ✅ Yes | ❌ No |
| **Access to Student Videos** | ✅ After booking | ✅ All roster members |

---

## Setup Process

### Coach Registration:
1. User signs up and selects "Coach" role
2. **CoachSetup form appears with:**
   - Full Name
   - **Coach Type** ← User selects general or club
   - Sport
   - Specialty
   - Years of Experience
   - Hourly Rate
   - Bio
   - Certifications
3. Form explains difference:
   - General: "Create training sessions for players to book"
   - Club: "Create and manage teams, add players to roster"
4. Profile created with selected type
5. Dashboard loads with appropriate features

---

## Migration Notes

### For Existing Data:
- All existing coaches default to `coach_type = 'general'`
- Existing coaches can be updated to 'club' manually if needed
- Placeholder coaches in PlayerDashboard remain for demo purposes
- Once coaches create real sessions, placeholders can be removed

### Running the Migration:
```sql
-- In Supabase SQL Editor, run:
-- C:\Users\kapil\Documents\SportsTinderMVP\playr-app\MISSING-TABLES.sql

-- This will:
-- 1. Add coach_type column to coach_profiles
-- 2. Create teams table
-- 3. Create team_members table
-- 4. Set up RLS policies
-- 5. Add indexes
```

---

## Next Steps

### To Implement:
1. ✅ Database schema (DONE - MISSING-TABLES.sql)
2. ✅ CoachSetup with type selection (DONE)
3. ⏳ CoachDashboard updates for team management
4. ⏳ TeamManagement component
5. ⏳ RosterView component
6. ⏳ TeamPerformance component
7. ⏳ Update PlayerDashboard to show real sessions (remove placeholders)

### For Team Management Features:
- Create team form
- Add player to roster search
- Jersey number assignment
- Position management
- Team stats dashboard
- Player comparison view
- Team messaging

---

## UI Wireframe Ideas

### Club Coach Dashboard - Teams Tab:
```
┌─────────────────────────────────────┐
│ My Teams                    [+ New] │
├─────────────────────────────────────┤
│ ⚽ Elite Soccer Academy U15          │
│ 18 Players • Founded Jan 2024       │
│ [View Roster] [Stats] [Message All] │
├─────────────────────────────────────┤
│ ⚽ Advanced Training Group            │
│ 12 Players • Founded Mar 2024        │
│ [View Roster] [Stats] [Message All]  │
└─────────────────────────────────────┘
```

### Club Coach Dashboard - Roster Tab:
```
┌─────────────────────────────────────┐
│ Elite Soccer Academy U15            │
│ [Add Player]          🔍 Search     │
├─────────────────────────────────────┤
│ #10 John Smith - Forward            │
│ Rating: 1245 • 15 videos            │
│ [View Videos] [Remove]              │
├─────────────────────────────────────┤
│ #7 Sarah Johnson - Midfielder      │
│ Rating: 1198 • 22 videos            │
│ [View Videos] [Remove]              │
└─────────────────────────────────────┘
```

This two-coach system allows Playr to serve both independent trainers AND organized team coaches! 🏀⚽🏈
