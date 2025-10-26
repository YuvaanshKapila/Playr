import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import MessagesView from '../components/MessagesView'
import PlayerProfileModal from '../components/PlayerProfileModal'
import RosterManagement from '../components/RosterManagement'
import './PlayerDashboard.css'

export default function CoachDashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('home')
  const [sessions, setSessions] = useState([])
  const [bookings, setBookings] = useState([])
  const [students, setStudents] = useState([])
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)
  const [showAddSession, setShowAddSession] = useState(false)
  const [teams, setTeams] = useState([])
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [teamData, setTeamData] = useState({
    team_name: '',
    age_group: '',
    skill_level: '',
    description: ''
  })
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    session_type: '1-on-1',
    price: '',
    max_participants: 1,
    date: '',
    time: ''
  })

  useEffect(() => {
    loadProfile()
    loadSessions()
    loadBookings()
    loadStudents()
    loadTeams()
  }, [])

  const loadProfile = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*, profiles!coach_profiles_user_id_fkey(full_name, email)')
        .eq('user_id', user.data.user.id)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('coach_id', user.data.user.id)
        .order('date', { ascending: true })

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const loadBookings = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('session_bookings')
        .select('*, coaching_sessions(*), profiles!session_bookings_player_id_fkey(full_name)')
        .eq('coaching_sessions.coach_id', user.data.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
    }
  }

  const loadStudents = async () => {
    try {
      const user = await supabase.auth.getUser()

      // First, get all sessions for this coach
      const { data: mySessions, error: sessionsError } = await supabase
        .from('coaching_sessions')
        .select('id')
        .eq('coach_id', user.data.user.id)

      if (sessionsError) throw sessionsError

      const sessionIds = mySessions.map(s => s.id)
      if (sessionIds.length === 0) {
        setStudents([])
        return
      }

      // Get all bookings for these sessions
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('session_bookings')
        .select('player_id')
        .in('session_id', sessionIds)

      if (bookingsError) throw bookingsError

      // Get unique player IDs
      const uniquePlayerIds = [...new Set(bookingsData.map(b => b.player_id))]

      if (uniquePlayerIds.length === 0) {
        setStudents([])
        return
      }

      // Load player profiles for these IDs
      const { data: playerProfiles, error: profilesError } = await supabase
        .from('player_profiles')
        .select('*, profiles!player_profiles_user_id_fkey(full_name)')
        .in('user_id', uniquePlayerIds)

      if (profilesError) throw profilesError

      // Format the students data
      const studentsData = playerProfiles.map(profile => ({
        id: profile.id,
        name: profile.profiles?.full_name || 'Unknown',
        profile: profile
      }))

      setStudents(studentsData)
    } catch (error) {
      console.error('Error loading students:', error)
      setStudents([]) // Set empty on error so UI shows properly
    }
  }

  const loadTeams = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('teams')
        .select('*, team_members(count)')
        .eq('coach_id', user.data.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error loading teams:', error)
    }
  }

  const handleAddSession = async (e) => {
    e.preventDefault()

    try {
      const user = await supabase.auth.getUser()
      const { error } = await supabase
        .from('coaching_sessions')
        .insert({
          coach_id: user.data.user.id,
          title: sessionData.title,
          description: sessionData.description,
          session_type: sessionData.session_type,
          price: parseFloat(sessionData.price),
          max_participants: parseInt(sessionData.max_participants),
          date: sessionData.date,
          time: sessionData.time,
          sport: profile.sport
        })

      if (error) throw error

      setShowAddSession(false)
      setSessionData({
        title: '',
        description: '',
        session_type: '1-on-1',
        price: '',
        max_participants: 1,
        date: '',
        time: ''
      })
      loadSessions()
      alert('Session added successfully!')
    } catch (error) {
      console.error('Error adding session:', error)
      alert('Failed to add session: ' + error.message)
    }
  }

  const handleAddTeam = async (e) => {
    e.preventDefault()

    try {
      const user = await supabase.auth.getUser()
      const { error } = await supabase
        .from('teams')
        .insert({
          coach_id: user.data.user.id,
          team_name: teamData.team_name,
          sport: profile.sport,
          age_group: teamData.age_group,
          skill_level: teamData.skill_level,
          description: teamData.description
        })

      if (error) throw error

      setShowAddTeam(false)
      setTeamData({
        team_name: '',
        age_group: '',
        skill_level: '',
        description: ''
      })
      loadTeams()
      alert('Team created successfully!')
    } catch (error) {
      console.error('Error creating team:', error)
      alert('Failed to create team: ' + error.message)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!profile) {
    return <div>Error loading profile</div>
  }

  const renderContent = () => {
    if (currentView === 'messages') {
      return <MessagesView />
    }

    if (currentView === 'students') {
      return (
        <div>
          <h3 style={{fontSize: '18px', marginBottom: '16px'}}>My Students ({students.length})</h3>
          {students.length === 0 ? (
            <div className="card empty-state">
              <p className="text-center text-muted">No students yet. Players who book your sessions will appear here!</p>
            </div>
          ) : (
            students.map(student => (
              <div key={student.id} className="card" style={{marginBottom: '12px', padding: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                  <div style={{flex: 1}}>
                    <h4 style={{fontSize: '16px', marginBottom: '4px'}}>{student.name}</h4>
                    {student.profile && (
                      <>
                        <p className="text-muted" style={{fontSize: '12px', marginBottom: '8px'}}>
                          {student.profile.sport} • {student.profile.position}
                        </p>
                        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                          <span className="badge">Rating: {student.profile.skill_rating}</span>
                          <span className="badge">{student.profile.total_videos} videos</span>
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{padding: '6px 12px', fontSize: '13px'}}
                    onClick={() => setSelectedPlayerId(student.profile?.id)}
                  >
                    View Videos
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )
    }

    if (currentView === 'sessions') {
      return (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h3 style={{fontSize: '18px', margin: 0}}>My Sessions</h3>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddSession(true)}
              style={{padding: '8px 16px', fontSize: '14px'}}
            >
              Add Session
            </button>
          </div>

          {showAddSession && (
            <div className="card" style={{marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h4 style={{margin: 0}}>New Session</h4>
                <button onClick={() => setShowAddSession(false)} className="btn-close">×</button>
              </div>

              <form onSubmit={handleAddSession}>
                <div className="input-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={sessionData.title}
                    onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Type *</label>
                  <select
                    value={sessionData.session_type}
                    onChange={(e) => {
                      const type = e.target.value
                      setSessionData({
                        ...sessionData,
                        session_type: type,
                        max_participants: type === '1-on-1' ? 1 : 10
                      })
                    }}
                    required
                  >
                    <option value="1-on-1">1-on-1</option>
                    <option value="group">Group</option>
                  </select>
                </div>

                {sessionData.session_type === 'group' && (
                  <div className="input-group">
                    <label>Max Participants *</label>
                    <input
                      type="number"
                      value={sessionData.max_participants}
                      onChange={(e) => setSessionData({ ...sessionData, max_participants: e.target.value })}
                      min="2"
                      max="50"
                      required
                    />
                  </div>
                )}

                <div className="input-group">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    value={sessionData.price}
                    onChange={(e) => setSessionData({ ...sessionData, price: e.target.value })}
                    min="0"
                    step="5"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={sessionData.date}
                    onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={sessionData.time}
                    onChange={(e) => setSessionData({ ...sessionData, time: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={sessionData.description}
                    onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
                    rows="3"
                  />
                </div>

                <button type="submit" className="btn btn-primary">Add Session</button>
              </form>
            </div>
          )}

          {sessions.length === 0 ? (
            <div className="card empty-state">
              <p className="text-center text-muted">No sessions yet. Add your first session!</p>
            </div>
          ) : (
            sessions.map(session => (
              <div key={session.id} className="card" style={{marginBottom: '12px', padding: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <div>
                    <h4 style={{fontSize: '16px', marginBottom: '4px'}}>{session.title}</h4>
                    <p className="text-muted" style={{fontSize: '12px'}}>
                      {session.session_type} • {session.date} at {session.time}
                    </p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)'}}>${session.price}</div>
                    <span className="badge">{session.session_type}</span>
                  </div>
                </div>
                {session.description && (
                  <p style={{fontSize: '13px', color: '#666'}}>{session.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      )
    }

    if (currentView === 'teams') {
      return (
        <div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h3 style={{fontSize: '18px', margin: 0}}>My Teams</h3>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddTeam(true)}
              style={{padding: '8px 16px', fontSize: '14px'}}
            >
              Create Team
            </button>
          </div>

          {showAddTeam && (
            <div className="card" style={{marginBottom: '16px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                <h4 style={{margin: 0}}>New Team</h4>
                <button onClick={() => setShowAddTeam(false)} className="btn-close">×</button>
              </div>

              <form onSubmit={handleAddTeam}>
                <div className="input-group">
                  <label>Team Name *</label>
                  <input
                    type="text"
                    value={teamData.team_name}
                    onChange={(e) => setTeamData({ ...teamData, team_name: e.target.value })}
                    placeholder="e.g., Elite Basketball U15"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Age Group</label>
                  <input
                    type="text"
                    value={teamData.age_group}
                    onChange={(e) => setTeamData({ ...teamData, age_group: e.target.value })}
                    placeholder="e.g., U15, U18, Adult"
                  />
                </div>

                <div className="input-group">
                  <label>Skill Level</label>
                  <select
                    value={teamData.skill_level}
                    onChange={(e) => setTeamData({ ...teamData, skill_level: e.target.value })}
                  >
                    <option value="">Select level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Elite">Elite</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    value={teamData.description}
                    onChange={(e) => setTeamData({ ...teamData, description: e.target.value })}
                    placeholder="Tell players about your team..."
                    rows="3"
                  />
                </div>

                <button type="submit" className="btn btn-primary">Create Team</button>
              </form>
            </div>
          )}

          {teams.length === 0 ? (
            <div className="card empty-state">
              <p className="text-center text-muted">No teams yet. Create your first team to start building your roster!</p>
            </div>
          ) : (
            teams.map(team => (
              <div key={team.id} className="card" style={{marginBottom: '12px', padding: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                  <div>
                    <h4 style={{fontSize: '16px', marginBottom: '4px'}}>{team.team_name}</h4>
                    <p className="text-muted" style={{fontSize: '12px'}}>
                      {team.age_group && `${team.age_group} • `}{team.skill_level} • {team.sport}
                    </p>
                    <span className="badge">{team.team_members?.[0]?.count || 0} players</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{padding: '6px 12px', fontSize: '13px'}}
                    onClick={() => setSelectedTeam(team)}
                  >
                    Manage Roster
                  </button>
                </div>
                {team.description && (
                  <p style={{fontSize: '13px', color: '#666', marginTop: '8px'}}>{team.description}</p>
                )}
              </div>
            ))
          )}
        </div>
      )
    }

    if (currentView === 'bookings') {
      return (
        <div>
          <h3 style={{fontSize: '18px', marginBottom: '16px'}}>Bookings</h3>
          {bookings.length === 0 ? (
            <div className="card empty-state">
              <p className="text-center text-muted">No bookings yet</p>
            </div>
          ) : (
            bookings.map(booking => (
              <div key={booking.id} className="card" style={{marginBottom: '12px', padding: '12px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignments: 'start'}}>
                  <div>
                    <h4 style={{fontSize: '16px', marginBottom: '4px'}}>{booking.profiles.full_name}</h4>
                    <p className="text-muted" style={{fontSize: '12px'}}>{booking.coaching_sessions.title}</p>
                    <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : ''}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div style={{fontSize: '16px', fontWeight: '700', color: 'var(--primary-dark)'}}>
                    ${booking.coaching_sessions.price}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )
    }

    // Home view
    return (
      <div>
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.profiles.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{profile.profiles.full_name}</h2>
              <p className="text-muted">{profile.sport} Coach • {profile.specialty}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <div className="stat-value">{profile.total_sessions || 0}</div>
              <div className="stat-label">Sessions</div>
            </div>
            <div className="stat">
              <div className="stat-value">{profile.rating || 5.0}</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">${profile.hourly_rate}</div>
              <div className="stat-label">Per Hour</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{marginBottom: '12px'}}>About</h3>
          <p style={{fontSize: '14px', color: '#666', marginBottom: '12px'}}>
            {profile.bio || 'No bio yet.'}
          </p>
          <div style={{fontSize: '13px'}}>
            <div style={{marginBottom: '8px'}}>
              <strong>Experience:</strong> {profile.experience_years} years
            </div>
            {profile.certifications && (
              <div>
                <strong>Certifications:</strong> {profile.certifications}
              </div>
            )}
          </div>
        </div>

        <button
          className="btn btn-gradient"
          onClick={() => setCurrentView('sessions')}
        >
          Manage Sessions
        </button>
      </div>
    )
  }

  return (
    <div className="player-dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="logo-small">Playr</div>
            <button onClick={handleLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <div className="container">
          <div className="tabs">
            <button
              className={`tab ${currentView === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentView('home')}
            >
              Home
            </button>
            <button
              className={`tab ${currentView === 'sessions' ? 'active' : ''}`}
              onClick={() => setCurrentView('sessions')}
            >
              Sessions
            </button>
            <button
              className={`tab ${currentView === 'teams' ? 'active' : ''}`}
              onClick={() => setCurrentView('teams')}
            >
              Teams
            </button>
            <button
              className={`tab ${currentView === 'students' ? 'active' : ''}`}
              onClick={() => setCurrentView('students')}
            >
              Students ({students.length})
            </button>
            <button
              className={`tab ${currentView === 'bookings' ? 'active' : ''}`}
              onClick={() => setCurrentView('bookings')}
            >
              Bookings
            </button>
            <button
              className={`tab ${currentView === 'messages' ? 'active' : ''}`}
              onClick={() => setCurrentView('messages')}
            >
              Messages
            </button>
          </div>
        </div>
      </nav>

      <div className="container">
        {renderContent()}
      </div>

      {/* Player Profile Modal */}
      {selectedPlayerId && (
        <PlayerProfileModal
          playerId={selectedPlayerId}
          onClose={() => setSelectedPlayerId(null)}
        />
      )}

      {/* Roster Management Modal */}
      {selectedTeam && (
        <RosterManagement
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  )
}
