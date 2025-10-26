import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import './PlayerProfileModal.css'

export default function PlayerProfileModal({ playerId, onClose, onMessage }) {
  const [player, setPlayer] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showMessageBox, setShowMessageBox] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (playerId) {
      loadPlayerData()
    }
  }, [playerId])

  const loadPlayerData = async () => {
    try {
      setLoading(true)

      // Load player profile
      const { data: playerData, error: playerError } = await supabase
        .from('player_profiles')
        .select('*, profiles!player_profiles_user_id_fkey(full_name, email, id)')
        .eq('id', playerId)
        .single()

      if (playerError) throw playerError
      setPlayer(playerData)

      // Load player videos with AI analysis
      // The videos table uses user_id, not player_id
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', playerData.user_id)
        .order('created_at', { ascending: false })

      if (videoError) throw videoError
      setVideos(videoData || [])
    } catch (error) {
      console.error('Error loading player data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !player) return

    setSending(true)
    try {
      const currentUser = await supabase.auth.getUser()

      // Send message
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.data.user.id,
          receiver_id: player.profiles.id,
          message: messageText.trim()
        })

      if (error) throw error

      alert('Message sent successfully!')
      setMessageText('')
      setShowMessageBox(false)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message: ' + error.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (!player) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Error loading player profile</p>
          <button onClick={onClose} className="btn btn-primary">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content player-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{player.profiles.full_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Player Stats */}
          <div className="player-stats-grid">
            <div className="stat-card">
              <div className="stat-label">Rating</div>
              <div className="stat-value">{player.skill_rating}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sport</div>
              <div className="stat-value">{player.sport}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Position</div>
              <div className="stat-value">{player.position}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Age</div>
              <div className="stat-value">{player.age}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Height</div>
              <div className="stat-value">{player.height_cm || '-'} cm</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Weight</div>
              <div className="stat-value">{player.weight_kg || '-'} kg</div>
            </div>
          </div>

          {/* Bio */}
          {player.bio && (
            <div className="profile-section">
              <h3>About</h3>
              <p>{player.bio}</p>
            </div>
          )}

          {/* Location */}
          {player.location && (
            <div className="profile-section">
              <h3>Location</h3>
              <p>{player.location}</p>
            </div>
          )}

          {/* Videos Section */}
          <div className="profile-section">
            <h3>Training Videos ({videos.length})</h3>

            {videos.length === 0 ? (
              <p className="text-muted">No videos uploaded yet</p>
            ) : (
              <div className="videos-grid">
                {videos.map(video => (
                  <div
                    key={video.id}
                    className="video-card"
                  >
                    {/* Video Player */}
                    {video.video_url && (
                      <video
                        src={video.video_url}
                        controls
                        className="video-player"
                        style={{
                          width: '100%',
                          borderRadius: '8px 8px 0 0',
                          backgroundColor: '#000'
                        }}
                      />
                    )}

                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p className="text-muted">{new Date(video.created_at).toLocaleDateString()}</p>
                      {video.ai_score && (
                        <div className="ai-score-badge">
                          AI Score: {video.ai_score}/100
                        </div>
                      )}

                      {/* View Analysis Button */}
                      <button
                        onClick={() => setSelectedVideo(selectedVideo?.id === video.id ? null : video)}
                        className="btn btn-secondary"
                        style={{marginTop: '8px', width: '100%', padding: '8px', fontSize: '13px'}}
                      >
                        {selectedVideo?.id === video.id ? 'Hide Analysis' : 'View AI Analysis'}
                      </button>
                    </div>

                    {/* Expanded AI Analysis */}
                    {selectedVideo?.id === video.id && (video.ai_analysis || video.ai_feedback) && (
                      <div className="video-analysis">
                        <h4>AI Analysis</h4>
                        <div className="analysis-content">
                          <div className="analysis-score">
                            <span className="score-label">Performance Score</span>
                            <span className="score-value">{video.ai_score}/100</span>
                          </div>
                          <div className="feedback-text">
                            {video.ai_analysis || (typeof video.ai_feedback === 'object' ? video.ai_feedback?.combined || video.ai_feedback?.text : video.ai_feedback) || 'No feedback available'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {!showMessageBox ? (
            <>
              <button
                onClick={() => setShowMessageBox(true)}
                className="btn btn-primary"
              >
                Send Message
              </button>
              <button onClick={onClose} className="btn btn-secondary">Close</button>
            </>
          ) : (
            <div className="message-box">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                rows="3"
                className="message-input"
              />
              <div className="message-actions">
                <button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sending}
                  className="btn btn-primary"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
                <button
                  onClick={() => {
                    setShowMessageBox(false)
                    setMessageText('')
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
