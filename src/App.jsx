import { useState, useEffect } from 'react'
import { supabase } from './config/supabase'
import IntroPage from './pages/IntroPage'
import RoleSelection from './pages/RoleSelection'
import PlayerSetup from './pages/PlayerSetup'
import PlayerDashboard from './pages/PlayerDashboard'
import CoachSetup from './pages/CoachSetup'
import CoachDashboard from './pages/CoachDashboard'
import RecruiterSetup from './pages/RecruiterSetup'
import RecruiterDashboard from './pages/RecruiterDashboard'

function App() {
  const [session, setSession] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [profileComplete, setProfileComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkUserProfile(session.user.id)
      } else {
        setUserRole(null)
        setProfileComplete(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUserProfile = async (userId) => {
    try {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (profile && profile.role) {
        setUserRole(profile.role)

        // Check if role-specific profile exists
        if (profile.role === 'player') {
          const { data: playerProfile } = await supabase
            .from('player_profiles')
            .select('id')
            .eq('user_id', userId)
            .single()

          setProfileComplete(!!playerProfile)
        } else if (profile.role === 'coach') {
          const { data: coachProfile } = await supabase
            .from('coach_profiles')
            .select('id')
            .eq('user_id', userId)
            .single()

          setProfileComplete(!!coachProfile)
        } else if (profile.role === 'recruiter') {
          const { data: recruiterProfile } = await supabase
            .from('recruiter_profiles')
            .select('id')
            .eq('user_id', userId)
            .single()

          setProfileComplete(!!recruiterProfile)
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (role) => {
    setUserRole(role)
    if (role) {
      setProfileComplete(true)
    }
  }

  const handleRoleSelected = (role) => {
    setUserRole(role)
    setProfileComplete(false)
  }

  const handleProfileComplete = () => {
    setProfileComplete(true)
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  // Not logged in
  if (!session) {
    return <IntroPage onLogin={handleLogin} />
  }

  // Logged in but no role selected
  if (!userRole) {
    return <RoleSelection userId={session.user.id} onRoleSelected={handleRoleSelected} />
  }

  // Role selected but profile not complete
  if (!profileComplete) {
    if (userRole === 'player') {
      return <PlayerSetup onComplete={handleProfileComplete} />
    } else if (userRole === 'coach') {
      return <CoachSetup userId={session.user.id} onComplete={handleProfileComplete} />
    } else if (userRole === 'recruiter') {
      return <RecruiterSetup userId={session.user.id} onComplete={handleProfileComplete} />
    }
  }

  // Show appropriate dashboard based on role
  if (userRole === 'player') {
    return <PlayerDashboard />
  } else if (userRole === 'coach') {
    return <CoachDashboard />
  } else if (userRole === 'recruiter') {
    return <RecruiterDashboard />
  }

  return null
}

export default App
