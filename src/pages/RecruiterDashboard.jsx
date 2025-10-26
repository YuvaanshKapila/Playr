import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import PlayerProfileModal from '../components/PlayerProfileModal'
import MessagesView from '../components/MessagesView'
import './RecruiterDashboard.css'

export default function RecruiterDashboard() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('swipe')
  const [players, setPlayers] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [shortlist, setShortlist] = useState([])
  const [filters, setFilters] = useState({
    sport: '',
    position: '',
    minRating: 0,
    location: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)

  useEffect(() => {
    loadProfile()
    loadPlayers()
    loadShortlist()
  }, [])

  const loadProfile = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('recruiter_profiles')
        .select('*, profiles!recruiter_profiles_user_id_fkey(full_name, email)')
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

  const loadPlayers = async () => {
    try {
      const user = await supabase.auth.getUser()

      // Get ALL swiped player IDs to exclude them (both left and right swipes)
      const { data: swipedData } = await supabase
        .from('recruiter_swipes')
        .select('player_id')
        .eq('recruiter_id', user.data.user.id)

      const swipedIds = swipedData?.map(s => s.player_id) || []

      // Load players excluding swiped ones
      let query = supabase
        .from('player_profiles')
        .select('*, profiles!player_profiles_user_id_fkey(full_name, email)')
        .order('skill_rating', { ascending: false })
        .limit(50)

      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`)
      }

      const { data, error } = await query

      if (error) throw error
      setPlayers(data || [])
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const loadShortlist = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('recruiter_shortlist')
        .select('*, player_profiles(*, profiles!player_profiles_user_id_fkey(full_name))')
        .eq('recruiter_id', user.data.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setShortlist(data || [])
    } catch (error) {
      console.error('Error loading shortlist:', error)
    }
  }

  const handleSwipe = async (direction) => {
    if (currentPlayerIndex >= players.length) return

    const currentPlayer = players[currentPlayerIndex]
    const user = await supabase.auth.getUser()

    try {
      // Record the swipe in recruiter_swipes table
      await supabase
        .from('recruiter_swipes')
        .insert({
          recruiter_id: user.data.user.id,
          player_id: currentPlayer.id,
          direction: direction
        })

      // If swiped right, also add to shortlist
      if (direction === 'right') {
        await supabase
          .from('recruiter_shortlist')
          .insert({
            recruiter_id: user.data.user.id,
            player_id: currentPlayer.id,
            notes: ''
          })

        loadShortlist()
      }
    } catch (error) {
      console.error('Error recording swipe:', error)
    }

    // Move to next player
    setCurrentPlayerIndex(currentPlayerIndex + 1)
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

  const currentPlayer = players[currentPlayerIndex]

  const renderSwipeView = () => {
    if (currentPlayerIndex >= players.length) {
      return (
        <div className="card empty-state">
          <h3>No More Players!</h3>
          <p className="text-muted">You've viewed all available players. Check back later for more talent!</p>
          <button className="btn btn-primary" onClick={() => {
            loadPlayers()
            setCurrentPlayerIndex(0)
          }}>
            Refresh
          </button>
        </div>
      )
    }

    if (!currentPlayer) return null

    return (
      <div className="swipe-container">
        <div className="player-card">
          <div className="player-card-header">
            <div className="player-avatar-large">
              {currentPlayer.profiles.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="player-card-info">
              <h2>{currentPlayer.profiles.full_name}</h2>
              <p className="text-muted">{currentPlayer.sport} • {currentPlayer.position}</p>
              <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                <span className="badge">Rating: {currentPlayer.skill_rating}</span>
                <span className="badge">{currentPlayer.age} years</span>
                {currentPlayer.location && <span className="badge">{currentPlayer.location}</span>}
              </div>
            </div>
          </div>

          <div className="player-card-body">
            <div className="stat-row">
              <div className="stat-item">
                <div className="stat-label">Height</div>
                <div className="stat-value">{currentPlayer.height_cm || '-'} cm</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Weight</div>
                <div className="stat-value">{currentPlayer.weight_kg || '-'} kg</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Videos</div>
                <div className="stat-value">{currentPlayer.total_videos}</div>
              </div>
            </div>

            {currentPlayer.bio && (
              <div style={{marginTop: '16px'}}>
                <h4 style={{fontSize: '14px', marginBottom: '8px'}}>About</h4>
                <p style={{fontSize: '13px', color: '#666'}}>{currentPlayer.bio}</p>
              </div>
            )}
          </div>

          <div className="swipe-actions">
            <button className="swipe-btn swipe-btn-pass" onClick={() => handleSwipe('left')}>
              ✕
            </button>
            <button className="swipe-btn swipe-btn-like" onClick={() => handleSwipe('right')}>
              ★
            </button>
          </div>
        </div>

        <div style={{textAlign: 'center', marginTop: '16px', color: '#666', fontSize: '13px'}}>
          {currentPlayerIndex + 1} / {players.length} players
        </div>
      </div>
    )
  }

  const renderShortlistView = () => {
    return (
      <div>
        <h3 style={{fontSize: '18px', marginBottom: '16px'}}>My Shortlist ({shortlist.length})</h3>
        {shortlist.length === 0 ? (
          <div className="card empty-state">
            <p className="text-center text-muted">No players in your shortlist yet. Swipe right to add players!</p>
          </div>
        ) : (
          shortlist.map(item => (
            <div key={item.id} className="card" style={{marginBottom: '12px', padding: '12px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                <div style={{flex: 1}}>
                  <h4 style={{fontSize: '16px', marginBottom: '4px'}}>{item.player_profiles.profiles.full_name}</h4>
                  <p className="text-muted" style={{fontSize: '12px', marginBottom: '8px'}}>
                    {item.player_profiles.sport} • {item.player_profiles.position}
                  </p>
                  <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                    <span className="badge">Rating: {item.player_profiles.skill_rating}</span>
                    <span className="badge">{item.player_profiles.age} years</span>
                    <span className="badge">{item.player_profiles.total_videos} videos</span>
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{padding: '6px 12px', fontSize: '13px'}}
                  onClick={() => setSelectedPlayerId(item.player_profiles.id)}
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  const renderSearchView = () => {
    // Filter players (already excludes shortlisted from loadPlayers)
    const filteredPlayers = players.filter(player => {
      if (filters.sport && player.sport !== filters.sport) return false
      if (filters.position && player.position.toLowerCase() !== filters.position.toLowerCase()) return false
      if (filters.minRating && player.skill_rating < filters.minRating) return false
      if (filters.location && !player.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
      return true
    })

    return (
      <div>
        <div style={{marginBottom: '16px'}}>
          <button
            className="btn btn-primary"
            style={{padding: '8px 16px', fontSize: '14px'}}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="card" style={{marginBottom: '16px', padding: '12px'}}>
            <h4 style={{fontSize: '14px', marginBottom: '12px'}}>Filters</h4>
            <div className="input-group">
              <label>Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
              >
                <option value="">All Sports</option>
                <option value="Basketball">Basketball</option>
                <option value="Soccer">Soccer</option>
                <option value="Football">Football</option>
              </select>
            </div>
            <div className="input-group">
              <label>Position</label>
              <input
                type="text"
                value={filters.position}
                onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                placeholder="e.g., Point Guard"
              />
            </div>
            <div className="input-group">
              <label>Min Rating</label>
              <input
                type="number"
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                placeholder="e.g., Los Angeles"
              />
            </div>
          </div>
        )}

        <h3 style={{fontSize: '18px', marginBottom: '16px'}}>
          Search Results ({filteredPlayers.length})
        </h3>
        {filteredPlayers.map(player => (
          <div key={player.id} className="card" style={{marginBottom: '12px', padding: '12px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
              <div style={{flex: 1}}>
                <h4 style={{fontSize: '16px', marginBottom: '4px'}}>{player.profiles.full_name}</h4>
                <p className="text-muted" style={{fontSize: '12px', marginBottom: '8px'}}>
                  {player.sport} • {player.position}
                </p>
                <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                  <span className="badge">Rating: {player.skill_rating}</span>
                  <span className="badge">{player.age} years</span>
                  {player.location && <span className="badge">{player.location}</span>}
                </div>
              </div>
              <div style={{textAlign: 'right'}}>
                <button
                  className="btn btn-primary"
                  style={{padding: '6px 12px', fontSize: '13px', marginBottom: '4px'}}
                  onClick={() => setSelectedPlayerId(player.id)}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderContent = () => {
    if (currentView === 'swipe') return renderSwipeView()
    if (currentView === 'shortlist') return renderShortlistView()
    if (currentView === 'search') return renderSearchView()
    if (currentView === 'messages') return <MessagesView />
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
              className={`tab ${currentView === 'swipe' ? 'active' : ''}`}
              onClick={() => setCurrentView('swipe')}
            >
              Discover
            </button>
            <button
              className={`tab ${currentView === 'search' ? 'active' : ''}`}
              onClick={() => setCurrentView('search')}
            >
              Search
            </button>
            <button
              className={`tab ${currentView === 'shortlist' ? 'active' : ''}`}
              onClick={() => setCurrentView('shortlist')}
            >
              Shortlist ({shortlist.length})
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
    </div>
  )
}
