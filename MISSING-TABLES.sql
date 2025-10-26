-- ===================================================================
-- PLAYR DATABASE MIGRATION
-- Run this entire file in Supabase SQL Editor
-- ===================================================================

-- First, drop existing tables to ensure clean slate
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS session_bookings CASCADE;
DROP TABLE IF EXISTS coaching_sessions CASCADE;
DROP TABLE IF EXISTS recruiter_swipes CASCADE;
DROP TABLE IF EXISTS recruiter_shortlist CASCADE;

-- Add missing columns to coach_profiles table
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL DEFAULT 0;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS rating DECIMAL DEFAULT 5.0;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE coach_profiles ADD COLUMN IF NOT EXISTS certifications TEXT;

-- Make club_name nullable (it's not always needed)
ALTER TABLE coach_profiles ALTER COLUMN club_name DROP NOT NULL;

-- Create coaching_sessions table
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL CHECK (session_type IN ('1-on-1', 'group')),
  sport TEXT NOT NULL,
  price DECIMAL NOT NULL,
  max_participants INTEGER DEFAULT 1,
  current_participants INTEGER DEFAULT 0,
  date DATE NOT NULL,
  time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create session_bookings table
CREATE TABLE IF NOT EXISTS session_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES coaching_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, player_id)
);

-- Create teams table (for club coaches)
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  age_group TEXT,
  skill_level TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table (players on a team)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  jersey_number INTEGER,
  position TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, player_id)
);

-- Add missing columns to recruiter_profiles table
-- Note: The table already has 'school_organization' (NOT NULL), so we'll add the new columns
ALTER TABLE recruiter_profiles ADD COLUMN IF NOT EXISTS organization TEXT;
ALTER TABLE recruiter_profiles ADD COLUMN IF NOT EXISTS sport TEXT;
ALTER TABLE recruiter_profiles ADD COLUMN IF NOT EXISTS position_seeking TEXT;
ALTER TABLE recruiter_profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Make school_organization nullable if it exists (so we can use 'organization' instead)
ALTER TABLE recruiter_profiles ALTER COLUMN school_organization DROP NOT NULL;

-- Create recruiter_shortlist table
CREATE TABLE IF NOT EXISTS recruiter_shortlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recruiter_id, player_id)
);

-- Create recruiter_swipes table to track ALL swipes (both left and right)
CREATE TABLE IF NOT EXISTS recruiter_swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recruiter_id, player_id)
);

-- Create messages table for real-time messaging
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations view helper (optional but useful)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id)
);

-- Enable RLS on new tables
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coaching_sessions
CREATE POLICY "Anyone can view coaching sessions"
  ON coaching_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coaches can insert own sessions"
  ON coaching_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own sessions"
  ON coaching_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own sessions"
  ON coaching_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- RLS Policies for session_bookings
CREATE POLICY "Anyone can view bookings"
  ON session_bookings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players can create bookings"
  ON session_bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Players can update own bookings"
  ON session_bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = player_id);

-- RLS Policies for teams
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coaches can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own teams"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- RLS Policies for team_members
CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Coaches can add team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can remove team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.coach_id = auth.uid()
    )
  );

-- RLS Policies for recruiter_shortlist
CREATE POLICY "Recruiters can view own shortlist"
  ON recruiter_shortlist FOR SELECT
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can add to own shortlist"
  ON recruiter_shortlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update own shortlist"
  ON recruiter_shortlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete from own shortlist"
  ON recruiter_shortlist FOR DELETE
  TO authenticated
  USING (auth.uid() = recruiter_id);

-- RLS Policies for recruiter_swipes
CREATE POLICY "Recruiters can view own swipes"
  ON recruiter_swipes FOR SELECT
  TO authenticated
  USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can add own swipes"
  ON recruiter_swipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = recruiter_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach_id ON coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_date ON coaching_sessions(date);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_sport ON coaching_sessions(sport);
CREATE INDEX IF NOT EXISTS idx_session_bookings_session_id ON session_bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_session_bookings_player_id ON session_bookings(player_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_player_id ON team_members(player_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_shortlist_recruiter_id ON recruiter_shortlist(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_shortlist_player_id ON recruiter_shortlist(player_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_swipes_recruiter_id ON recruiter_swipes(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_swipes_player_id ON recruiter_swipes(player_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant2_id ON conversations(participant2_id);
