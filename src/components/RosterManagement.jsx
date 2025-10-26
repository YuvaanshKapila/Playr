import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

export default function RosterManagement({ team, onClose }) {
  const [roster, setRoster] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadRoster()
  }, [team.id])

  const loadRoster = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          player:player_profiles!team_members_player_id_fkey(
            *,
            profile:profiles!player_profiles_user_id_fkey(full_name)
          )
        `)
        .eq('team_id', team.id)

      if (error) throw error
      setRoster(data || [])
    } catch (error) {
      console.error('Error loading roster:', error)
    }
  }

  const searchPlayers = async (query) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*, profile:profiles!player_profiles_user_id_fkey(full_name)')
        .ilike('profiles.full_name', `%${query}%`)
        .eq('sport', team.sport)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching players:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPlayerToRoster = async (playerId) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          player_id: playerId
        })

      if (error) throw error

      alert('Player added to roster!')
      setSearchQuery('')
      setSearchResults([])
      loadRoster()
    } catch (error) {
      console.error('Error adding player:', error)
      if (error.code === '23505') {
        alert('Player is already on the roster!')
      } else {
        alert('Failed to add player: ' + error.message)
      }
    }
  }

  const removePlayerFromRoster = async (memberId) => {
    if (!confirm('Remove this player from the team?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      alert('Player removed from roster')
      loadRoster()
    } catch (error) {
      console.error('Error removing player:', error)
      alert('Failed to remove player: ' + error.message)
    }
  }

  const updateJerseyNumber = async (memberId, jerseyNumber) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ jersey_number: jerseyNumber })
        .eq('id', memberId)

      if (error) throw error
      loadRoster()
    } catch (error) {
      console.error('Error updating jersey number:', error)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '24px'
      }}>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
          <h2 style={{margin: 0}}>{team.team_name} - Roster</h2>
          <button onClick={onClose} className="btn-close" style={{fontSize: '28px'}}>×</button>
        </div>

        {/* Search Players */}
        <div className="card" style={{marginBottom: '20px'}}>
          <h3 style={{fontSize: '16px', marginBottom: '12px'}}>Add Player to Roster</h3>
          <input
            type="text"
            placeholder="Search players by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchPlayers(e.target.value)
            }}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              border: '1px solid #ddd',
              borderRadius: '8px'
            }}
          />

          {loading && <p className="text-muted" style={{marginTop: '8px'}}>Searching...</p>}

          {searchResults.length > 0 && (
            <div style={{marginTop: '12px'}}>
              {searchResults.map(player => (
                <div key={player.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <strong>{player.profile?.full_name}</strong>
                    <p className="text-muted" style={{fontSize: '12px', margin: '4px 0 0 0'}}>
                      {player.position} • Rating: {player.skill_rating}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{padding: '6px 12px', fontSize: '13px'}}
                    onClick={() => addPlayerToRoster(player.id)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Roster */}
        <h3 style={{fontSize: '16px', marginBottom: '12px'}}>Current Roster ({roster.length} players)</h3>

        {roster.length === 0 ? (
          <p className="text-muted">No players on roster yet. Add players above!</p>
        ) : (
          roster.map(member => (
            <div key={member.id} className="card" style={{marginBottom: '10px', padding: '12px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    <input
                      type="number"
                      placeholder="#"
                      value={member.jersey_number || ''}
                      onChange={(e) => updateJerseyNumber(member.id, e.target.value)}
                      style={{
                        width: '50px',
                        padding: '6px',
                        fontSize: '14px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}
                    />
                    <div>
                      <strong style={{fontSize: '15px'}}>{member.player?.profile?.full_name}</strong>
                      <p className="text-muted" style={{fontSize: '12px', margin: '4px 0 0 0'}}>
                        {member.player?.position} • Rating: {member.player?.skill_rating} • {member.player?.total_videos} videos
                      </p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removePlayerFromRoster(member.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '18px',
                    padding: '4px 8px'
                  }}
                  title="Remove from roster"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
