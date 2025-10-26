# Playr Rating Algorithm

## Overview
Playr uses a modified **Elo Rating System** combined with **AI Performance Analysis** to calculate player skill ratings dynamically.

## Initial Rating
- All players start at **1000 rating**
- Set when player creates their profile
- Stored in `player_profiles.skill_rating`

## Rating Calculation Components

### 1. Video Performance Score (AI-Based)
When a player uploads a video:
- **Gemini AI analyzes** the video and provides a score (0-100)
- **Visual analysis** of form and technique (if available)
- **Combined score** = average of text + visual analysis

### 2. Contest Performance (Elo-Based)
When players compete in contests:
- Uses **standard Elo formula**:
  ```
  New Rating = Old Rating + K × (Actual Score - Expected Score)
  ```
- **K-factor = 32** for players with < 30 games
- **K-factor = 24** for players with 30+ games
- **Expected Score** based on rating difference:
  ```
  Expected = 1 / (1 + 10^((Opponent Rating - Your Rating) / 400))
  ```

### 3. Rating Updates Trigger Points

**When ratings change:**
1. ✅ **Video Upload** - AI score affects rating:
   - Score 90-100: +15 rating
   - Score 80-89: +10 rating
   - Score 70-79: +5 rating
   - Score 60-69: No change
   - Score 50-59: -5 rating
   - Score < 50: -10 rating

2. ✅ **Contest Completion** - Elo calculation based on placement
3. ✅ **1v1 Matches** - Direct Elo calculation vs opponent
4. ✅ **Leaderboard Tournaments** - Multi-player Elo

## Implementation

### Database Schema
```sql
-- Player ratings stored here
player_profiles (
  skill_rating INTEGER DEFAULT 1000,
  total_videos INTEGER DEFAULT 0,
  total_contests INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0
)

-- Video scores affect ratings
videos (
  ai_score INTEGER,
  rating_change INTEGER,
  new_rating INTEGER
)

-- Contest results affect ratings
contest_participants (
  player_id UUID,
  contest_id UUID,
  placement INTEGER,
  rating_before INTEGER,
  rating_after INTEGER,
  rating_change INTEGER
)
```

### Rating Update Function (SQL)
```sql
CREATE OR REPLACE FUNCTION update_player_rating_from_video(
  p_player_id UUID,
  p_ai_score INTEGER
) RETURNS INTEGER AS $$
DECLARE
  current_rating INTEGER;
  rating_change INTEGER;
  new_rating INTEGER;
BEGIN
  -- Get current rating
  SELECT skill_rating INTO current_rating
  FROM player_profiles
  WHERE id = p_player_id;

  -- Calculate rating change based on AI score
  rating_change := CASE
    WHEN p_ai_score >= 90 THEN 15
    WHEN p_ai_score >= 80 THEN 10
    WHEN p_ai_score >= 70 THEN 5
    WHEN p_ai_score >= 60 THEN 0
    WHEN p_ai_score >= 50 THEN -5
    ELSE -10
  END;

  -- Calculate new rating (minimum 100, maximum 3000)
  new_rating := GREATEST(100, LEAST(3000, current_rating + rating_change));

  -- Update player rating
  UPDATE player_profiles
  SET skill_rating = new_rating
  WHERE id = p_player_id;

  RETURN new_rating;
END;
$$ LANGUAGE plpgsql;
```

## Leaderboard Ranking
Players are ranked by:
1. **Primary**: `skill_rating` (descending)
2. **Secondary**: `total_contests` (more contests = tiebreaker)
3. **Tertiary**: `created_at` (earlier signup = tiebreaker)

## Future Enhancements
- **Decay system**: Ratings decay if no activity for 30+ days
- **Sport-specific ratings**: Different ratings per sport
- **Position-specific ratings**: Different ratings per position
- **Seasonal ratings**: Reset ratings each season
- **Peak rating tracking**: Track all-time high rating
