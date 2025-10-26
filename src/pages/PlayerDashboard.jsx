import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { analyzeSkillVideo, extractScore, analyzeVideoFrame, extractVideoFrame } from '../config/gemini'
import MessagesView from '../components/MessagesView'
import FormVisualization from '../components/FormVisualization'
import './PlayerDashboard.css'

export default function PlayerDashboard() {
  const [profile, setProfile] = useState(null)
  const [videos, setVideos] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    skill_type: ''
  })
  const [videoFile, setVideoFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [currentView, setCurrentView] = useState('home') // home, contests, coaching, leaderboard, messages
  const [contests, setContests] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [messages, setMessages] = useState([])
  const [aiRecommendations, setAiRecommendations] = useState(null)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [coaches, setCoaches] = useState([])
  const [groupSessions, setGroupSessions] = useState([])
  const [loadingCoaches, setLoadingCoaches] = useState(false)

  useEffect(() => {
    loadProfile()
    loadVideos()
    loadContests()
    loadLeaderboard()
    loadMessages()
  }, [])

  const loadContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false })

      if (error) throw error
      setContests(data || [])
    } catch (error) {
      console.error('Error loading contests:', error)
    }
  }

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('player_profiles')
        .select('*, profiles!player_profiles_user_id_fkey(full_name)')
        .order('skill_rating', { ascending: false })
        .limit(50)

      if (error) throw error
      setLeaderboard(data || [])
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)')
        .or(`sender_id.eq.${user.data.user.id},receiver_id.eq.${user.data.user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const loadCoaches = async () => {
    setLoadingCoaches(true)
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('*, profiles!coach_profiles_user_id_fkey(full_name)')
        .limit(10)

      if (error) throw error

      const coachesData = data?.length > 0 ? data.map(coach => ({
        id: coach.id,
        full_name: coach.profiles.full_name,
        specialty: coach.specialty,
        sport: coach.sport,
        rating: coach.rating || 5.0,
        sessions: coach.total_sessions || 0,
        price: coach.hourly_rate
      })) : []

      setCoaches(coachesData)
    } catch (error) {
      console.error('Error loading coaches:', error)
    } finally {
      setLoadingCoaches(false)
    }
  }

  const loadGroupSessions = async () => {
    try {
      // Get user to check if they're logged in
      const user = await supabase.auth.getUser()

      // Load ALL coaching sessions (both 1-on-1 and group)
      const { data, error} = await supabase
        .from('coaching_sessions')
        .select(`
          *,
          coach:profiles!coaching_sessions_coach_id_fkey(full_name)
        `)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(20)

      if (error) {
        console.log('Error loading coaching sessions:', error)
        throw error
      }

      const sessionsData = data?.length > 0 ? data.map(session => ({
        id: session.id,
        title: session.title,
        description: session.description,
        coach: session.coach?.full_name || 'Coach',
        coach_id: session.coach_id,
        sport: session.sport,
        session_type: session.session_type,
        date: new Date(session.date).toLocaleDateString(),
        time: session.time,
        spots: session.max_participants,
        spotsLeft: session.max_participants - (session.current_participants || 0),
        price: session.price
      })) : []

      setGroupSessions(sessionsData)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setGroupSessions([])
    }
  }

  const loadProfile = async () => {
    try {
      const user = await supabase.auth.getUser()
      console.log('Loading profile for user:', user.data.user.id)

      const { data, error } = await supabase
        .from('player_profiles')
        .select('*, profiles!player_profiles_user_id_fkey(full_name, email)')
        .eq('user_id', user.data.user.id)
        .single()

      console.log('Profile query result:', { data, error })

      if (error) {
        console.error('Profile load error:', error)
        throw error
      }

      console.log('Profile loaded successfully:', data)
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const loadVideos = async () => {
    try {
      const user = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.data.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVideos(data || [])
    } catch (error) {
      console.error('Error loading videos:', error)
    }
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!videoFile) {
      alert('Please select a video file')
      return
    }

    setUploading(true)

    try {
      const user = await supabase.auth.getUser()
      const fileExt = videoFile.name.split('.').pop()
      const fileName = `${user.data.user.id}/${Date.now()}.${fileExt}`

      // Upload video to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName)

      // Analyze video with Gemini AI - both text and visual analysis
      console.log('Starting AI analysis...')
      const textAnalysis = await analyzeSkillVideo(
        uploadData.description || uploadData.title,
        profile.sport,
        uploadData.skill_type || 'general'
      )

      console.log('Text analysis result:', textAnalysis)

      // Check if analysis failed
      if (!textAnalysis.success) {
        console.error('Text analysis failed:', textAnalysis.error)
        alert(`AI Analysis Error: ${textAnalysis.error || 'Failed to analyze video'}`)
        // Continue with upload but without AI analysis
      }

      // Extract a frame and do visual analysis
      let visualAnalysis = null
      let textScore = extractScore(textAnalysis.analysis)
      let visualScore = null
      let combinedScore = null

      try {
        const frameData = await extractVideoFrame(videoFile)
        visualAnalysis = await analyzeVideoFrame(
          frameData,
          profile.sport,
          uploadData.skill_type || 'general'
        )

        // If we got visual analysis, extract score
        if (visualAnalysis.success) {
          visualScore = extractScore(visualAnalysis.analysis)
        }
      } catch (error) {
        console.error('Visual analysis failed, using text analysis only:', error)
      }

      // Calculate combined score only if we have at least one score
      if (textScore !== null && visualScore !== null) {
        combinedScore = Math.round((textScore + visualScore) / 2)
      } else if (textScore !== null) {
        combinedScore = textScore
      } else if (visualScore !== null) {
        combinedScore = visualScore
      }

      const aiScore = combinedScore
      const combinedAnalysis = visualAnalysis?.success
        ? `${textAnalysis.analysis}\n\n--- Visual Form Analysis ---\n${visualAnalysis.analysis}`
        : textAnalysis.analysis

      // Log for debugging
      console.log('AI Analysis Results:', {
        textScore,
        visualScore,
        combinedScore,
        textAnalysis: textAnalysis.analysis,
        visualAnalysis: visualAnalysis?.analysis
      })

      // Calculate rating change based on AI score
      let ratingChange = 0
      let newRating = profile.skill_rating

      if (aiScore !== null) {
        if (aiScore >= 90) ratingChange = 15
        else if (aiScore >= 80) ratingChange = 10
        else if (aiScore >= 70) ratingChange = 5
        else if (aiScore >= 60) ratingChange = 0
        else if (aiScore >= 50) ratingChange = -5
        else ratingChange = -10

        newRating = Math.max(100, Math.min(3000, profile.skill_rating + ratingChange))
      }

      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          player_id: profile.id,
          user_id: user.data.user.id,
          title: uploadData.title,
          description: uploadData.description,
          video_url: publicUrl,
          ai_analysis: combinedAnalysis,
          ai_score: aiScore,
          ai_feedback: {
            text: textAnalysis.analysis,
            visual: visualAnalysis?.analysis || null,
            combined: combinedAnalysis
          }
        })

      if (dbError) throw dbError

      // Update player total videos and rating
      await supabase
        .from('player_profiles')
        .update({
          total_videos: profile.total_videos + 1,
          skill_rating: newRating
        })
        .eq('id', profile.id)

      // Reset form and reload
      setShowUpload(false)
      setUploadData({ title: '', description: '', skill_type: '' })
      setVideoFile(null)
      loadVideos()
      loadProfile()

      // Show rating change alert
      if (aiScore !== null && ratingChange !== 0) {
        const changeSymbol = ratingChange > 0 ? '+' : ''
        alert(`Video uploaded successfully!\n\nAI Score: ${aiScore}/100\nRating: ${profile.skill_rating} → ${newRating} (${changeSymbol}${ratingChange})`)
      } else if (aiScore !== null) {
        alert(`Video uploaded successfully!\n\nAI Score: ${aiScore}/100\nNo rating change.`)
      } else {
        alert('Video uploaded successfully!')
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  // Extract correction points from AI analysis text
  const extractCorrectionsFromAI = (aiAnalysis) => {
    if (!aiAnalysis) return []

    const corrections = []
    const lines = aiAnalysis.split('\n')

    // Look for common patterns in AI feedback
    lines.forEach(line => {
      const trimmed = line.trim()
      // Match numbered points, bullet points, or sentences with improvement keywords
      if (
        trimmed.match(/^\d+\./) || // "1. Your form..."
        trimmed.match(/^[-*•]/) || // "- Your form..." or "* Keep..."
        trimmed.toLowerCase().includes('improve') ||
        trimmed.toLowerCase().includes('focus on') ||
        trimmed.toLowerCase().includes('work on') ||
        trimmed.toLowerCase().includes('keep') ||
        trimmed.toLowerCase().includes('maintain') ||
        trimmed.toLowerCase().includes('adjust')
      ) {
        // Clean up the text
        const cleaned = trimmed.replace(/^\d+\.\s*/, '').replace(/^[-*•]\s*/, '')
        if (cleaned.length > 10 && cleaned.length < 150) {
          corrections.push(cleaned)
        }
      }
    })

    // If no corrections found, try to extract sentences
    if (corrections.length === 0) {
      const sentences = aiAnalysis.match(/[^.!?]+[.!?]+/g) || []
      corrections.push(...sentences.slice(0, 3).map(s => s.trim()))
    }

    return corrections.slice(0, 5) // Max 5 corrections
  }

  const handleDeleteVideo = async (videoId, videoUrl) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    try {
      // Extract file path from URL
      const urlParts = videoUrl.split('/videos/')
      const filePath = urlParts[1]

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('videos')
        .remove([filePath])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId)

      if (dbError) throw dbError

      // Update player total videos count
      if (profile.total_videos > 0) {
        await supabase
          .from('player_profiles')
          .update({ total_videos: profile.total_videos - 1 })
          .eq('id', profile.id)
      }

      // Reload videos and profile
      await loadVideos()
      await loadProfile()
      alert('Video deleted successfully!')
    } catch (error) {
      console.error('Error deleting video:', error)
      alert('Failed to delete video. Please try again.')
    }
  }

  const handleBookSession = async (sessionId) => {
    try {
      const user = await supabase.auth.getUser()

      const { error } = await supabase
        .from('session_bookings')
        .insert({
          session_id: sessionId,
          player_id: user.data.user.id,
          status: 'confirmed'
        })

      if (error) throw error

      alert('Session booked successfully!')
      loadGroupSessions() // Reload to update spots
    } catch (error) {
      console.error('Error booking session:', error)
      if (error.code === '23505') {
        alert('You have already booked this session!')
      } else {
        alert('Failed to book session: ' + error.message)
      }
    }
  }

  const generateAIRecommendations = async () => {
    setLoadingRecommendations(true)
    try {
      // Get player's recent videos and their AI feedback
      const recentVideos = videos.slice(0, 5) // Last 5 videos

      // Build context from videos
      const videoContext = recentVideos.map(v => ({
        title: v.title,
        score: v.ai_score,
        feedback: v.ai_analysis
      }))

      const prompt = `You are an expert ${profile.sport} coach. Based on this player's recent performance videos, provide personalized training recommendations.

Player Info:
- Sport: ${profile.sport}
- Position: ${profile.position}
- Current Rating: ${profile.skill_rating}
- Age: ${profile.age}

Recent Videos Analysis:
${videoContext.map((v, i) => `
Video ${i + 1}: ${v.title}
Score: ${v.score || 'N/A'}/100
Feedback: ${v.feedback || 'No feedback yet'}
`).join('\n')}

Generate 5 personalized drill recommendations to improve this player's weaknesses. For each drill:
1. Name of the drill
2. Target skill area
3. Step-by-step instructions (3-5 steps)
4. Expected benefits
5. Difficulty level (Beginner/Intermediate/Advanced)

Format as JSON array with structure:
[{
  "name": "Drill name",
  "targetSkill": "skill",
  "instructions": ["step1", "step2", "step3"],
  "benefits": "expected benefits",
  "difficulty": "level"
}]`

      // Use Gemini to generate recommendations
      const { model } = await import('../config/gemini')
      const result = await model.generateContent(prompt)
      const responseText = result.response.text()

      // Extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0])
        setAiRecommendations(recommendations)
      } else {
        throw new Error('Could not parse AI response')
      }
    } catch (error) {
      console.error('Error generating recommendations:', error)
      alert('Failed to generate recommendations. Please try again.')
    } finally {
      setLoadingRecommendations(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="player-dashboard">
        <header className="dashboard-header">
          <div className="container">
            <div className="header-content">
              <div className="logo-small">Playr</div>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="container">
          <div className="card">
            <h3>Error Loading Profile</h3>
            <p>Could not load your player profile. Please check the browser console (F12) for errors.</p>
            <button className="btn btn-primary mt-16" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render different views based on currentView
  const renderContent = () => {
    if (currentView === 'contests') {
      const displayContests = contests.length > 0 ? contests : [
        {
          id: 'placeholder-1',
          title: 'Weekly Skills Challenge',
          description: 'Show off your best moves! Upload your skills video and compete with players worldwide.',
          sport: profile?.sport || 'Basketball',
          difficulty: 'Intermediate',
          challenge_type: 'Skills Showcase'
        },
        {
          id: 'placeholder-2',
          title: 'Speed & Agility Contest',
          description: 'Test your speed and agility in this timed challenge. Fastest times win!',
          sport: profile?.sport || 'Basketball',
          difficulty: 'Advanced',
          challenge_type: 'Speed Challenge'
        }
      ]

      return (
        <div>
          <h2 className="page-title">Active Contests</h2>
          {displayContests.map(contest => (
            <div key={contest.id} className="card" style={{marginBottom: '16px'}}>
              <h3>{contest.title}</h3>
              <p className="text-muted">{contest.description}</p>
              <div style={{marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                <span className="badge">{contest.sport}</span>
                <span className="badge">{contest.difficulty}</span>
                <span className="badge">{contest.challenge_type}</span>
              </div>
              <button className="btn btn-primary" style={{marginTop: '16px'}}>
                {contest.id.includes('placeholder') ? 'Coming Soon' : 'Enter Contest'}
              </button>
            </div>
          ))}
        </div>
      )
    }

    if (currentView === 'coaching') {
      return (
        <div>
          <h3 style={{marginBottom: '16px', fontSize: '20px'}}>Available Coaching Sessions</h3>

          {groupSessions.length === 0 ? (
            <div className="card empty-state">
              <p className="text-center text-muted">No coaching sessions available yet. Check back soon!</p>
            </div>
          ) : (
            groupSessions.map(session => (
              <div key={session.id} className="card" style={{marginBottom: '12px', padding: '14px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px'}}>
                  <div style={{flex: 1}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px'}}>
                      <h4 style={{fontSize: '17px', margin: 0}}>{session.title}</h4>
                      <span className="badge" style={{fontSize: '11px'}}>
                        {session.session_type === '1-on-1' ? '1-on-1' : 'Group'}
                      </span>
                    </div>
                    <p className="text-muted" style={{fontSize: '13px', marginBottom: '8px'}}>
                      Coach: {session.coach}
                    </p>
                    {session.description && (
                      <p style={{fontSize: '13px', color: '#555', marginBottom: '8px'}}>{session.description}</p>
                    )}
                    <div style={{fontSize: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', color: '#666'}}>
                      <span>📅 {session.date}</span>
                      <span>•</span>
                      <span>🕐 {session.time}</span>
                      <span>•</span>
                      <span>📍 {session.sport}</span>
                      <span>•</span>
                      <span className={session.spotsLeft > 0 ? 'text-success' : 'text-danger'}>
                        {session.spotsLeft > 0 ? `${session.spotsLeft} spots left` : 'Full'}
                      </span>
                    </div>
                  </div>
                  <div style={{textAlign: 'right', marginLeft: '16px'}}>
                    <div style={{fontSize: '22px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '8px'}}>
                      ${session.price}
                    </div>
                    <button
                      className="btn btn-primary"
                      style={{padding: '8px 16px', fontSize: '14px', fontWeight: '600'}}
                      onClick={() => handleBookSession(session.id)}
                      disabled={session.spotsLeft === 0}
                    >
                      {session.spotsLeft === 0 ? 'Full' : 'Book Now'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )
    }

    if (currentView === 'leaderboard') {
      return (
        <div>
          <h2 className="page-title">Leaderboard</h2>
          <div className="card">
            {leaderboard.length === 0 ? (
              <p className="text-center text-muted">No rankings yet</p>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((player, index) => (
                  <div key={player.id} className="leaderboard-item">
                    <div className="rank">#{index + 1}</div>
                    <div className="player-info">
                      <strong>{player.profiles?.full_name || 'Player'}</strong>
                      <span className="text-muted text-sm">{player.sport} • {player.position}</span>
                    </div>
                    <div className="rating">{player.skill_rating}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }

    if (currentView === 'messages') {
      return <MessagesView />
    }

    // Home view
    return (
      <div>
        {/* Profile Stats Card */}
        <div className="card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.profiles.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h2>{profile.profiles.full_name}</h2>
              <p className="text-muted">{profile.sport} • {profile.position}</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <div className="stat-value">{profile.skill_rating}</div>
              <div className="stat-label">Rating</div>
            </div>
            <div className="stat">
              <div className="stat-value">{profile.total_videos}</div>
              <div className="stat-label">Videos</div>
            </div>
            <div className="stat">
              <div className="stat-value">{profile.total_contests}</div>
              <div className="stat-label">Contests</div>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        {!showUpload && (
          <button
            className="btn btn-gradient mb-24"
            onClick={() => setShowUpload(true)}
          >
            Upload Skill Video
          </button>
        )}

        {/* Upload Form */}
        {showUpload && (
          <div className="card upload-card">
            <div className="card-header">
              <h3>Upload New Video</h3>
              <button
                className="btn-close"
                onClick={() => setShowUpload(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleVideoUpload}>
              <div className="input-group">
                <label htmlFor="title">Video Title *</label>
                <input
                  id="title"
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="e.g., Free Kick Practice"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="skill_type">Skill Type</label>
                <input
                  id="skill_type"
                  type="text"
                  value={uploadData.skill_type}
                  onChange={(e) => setUploadData({ ...uploadData, skill_type: e.target.value })}
                  placeholder="e.g., shooting, dribbling, passing"
                />
              </div>

              <div className="input-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Describe what you're demonstrating in this video..."
                  rows="3"
                />
              </div>

              <div className="input-group">
                <label htmlFor="video">Video File *</label>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files[0])}
                  required
                />
                <p className="text-sm text-muted mt-8">Max 50MB. Formats: MP4, MOV, AVI</p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner"></span>
                    Uploading & Analyzing...
                  </>
                ) : (
                  'Upload Video'
                )}
              </button>
            </form>
          </div>
        )}

        {/* Videos Section */}
        <div className="section-header">
          <h3>My Videos</h3>
          <span className="text-muted">{videos.length} total</span>
        </div>

        {videos.length === 0 ? (
          <div className="card empty-state">
            <p className="text-center text-muted">
              No videos yet. Upload your first skill video to get AI feedback!
            </p>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div key={video.id} className="card video-card">
                <video
                  src={video.video_url}
                  controls
                  className="video-player"
                />
                <div className="video-info">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                    <h4>{video.title}</h4>
                    <button
                      onClick={() => handleDeleteVideo(video.id, video.video_url)}
                      className="btn-delete"
                      title="Delete video"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#dc2626',
                        cursor: 'pointer',
                        fontSize: '20px',
                        padding: '4px 8px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  {video.description && (
                    <p className="text-sm text-muted">{video.description}</p>
                  )}
                  {video.ai_score && (
                    <div className="ai-score">
                      AI Score: <strong>{video.ai_score}/100</strong>
                    </div>
                  )}
                  {video.ai_analysis && (
                    <details className="ai-feedback">
                      <summary>View AI Feedback</summary>
                      <p className="text-sm">{video.ai_analysis}</p>

                      {/* Visual Form Demonstration */}
                      <FormVisualization
                        sport={profile.sport}
                        skillType={video.skill_type || 'general'}
                        corrections={extractCorrectionsFromAI(video.ai_analysis)}
                      />
                    </details>
                  )}
                  <p className="text-sm text-muted mt-8">
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* Navigation Tabs */}
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
              className={`tab ${currentView === 'contests' ? 'active' : ''}`}
              onClick={() => setCurrentView('contests')}
            >
              Contests
            </button>
            <button
              className={`tab ${currentView === 'coaching' ? 'active' : ''}`}
              onClick={() => {
                setCurrentView('coaching')
                loadCoaches()
                loadGroupSessions()
              }}
            >
              Coaching
            </button>
            <button
              className={`tab ${currentView === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setCurrentView('leaderboard')}
            >
              Leaderboard
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
    </div>
  )
}
