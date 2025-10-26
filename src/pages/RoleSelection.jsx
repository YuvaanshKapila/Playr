import { useState } from 'react'
import { supabase } from '../config/supabase'
import './RoleSelection.css'

export default function RoleSelection({ userId, onRoleSelected }) {
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)

  const roles = [
    {
      id: 'player',
      title: 'Player',
      description: 'Upload skills, compete in challenges, get discovered'
    },
    {
      id: 'coach',
      title: 'Coach',
      description: 'Create teams, provide feedback, develop talent'
    },
    {
      id: 'recruiter',
      title: 'Recruiter',
      description: 'Discover talent, connect with players, build your roster'
    }
  ]

  const handleContinue = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()

      if (userError) {
        console.error('Error getting user:', userError)
        throw new Error('Could not get user data: ' + userError.message)
      }

      console.log('User data:', userData)
      console.log('Attempting to insert/update profile for user:', userData.user.id)
      console.log('Role:', selectedRole)

      // Update profile with selected role
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: userData.user.email,
          role: selectedRole,
          full_name: '',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      console.log('Upsert response:', { data, error })

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      console.log('Role saved successfully!')
      onRoleSelected(selectedRole)
    } catch (error) {
      console.error('Error saving role:', error)
      console.error('Full error object:', JSON.stringify(error, null, 2))

      // Show detailed error to help with debugging
      let errorMessage = 'Failed to save role.\n\n'

      if (error.message) {
        errorMessage += 'Error: ' + error.message + '\n\n'
      }

      if (error.details) {
        errorMessage += 'Details: ' + error.details + '\n\n'
      }

      if (error.hint) {
        errorMessage += 'Hint: ' + error.hint + '\n\n'
      }

      errorMessage += 'Check the browser console (F12) for more details.'

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg role-selection-page">
      <div className="container">
        <div className="role-content">
          <div className="logo-section">
            <div className="logo">Playr</div>
          </div>

          <div className="card">
            <h2 className="text-center mb-16">I am a...</h2>
            <p className="text-center text-muted mb-24">
              Choose your role to get started
            </p>

            <div className="roles-grid">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <h3 className="role-title">{role.title}</h3>
                  <p className="role-description">{role.description}</p>
                </button>
              ))}
            </div>

            <button
              className="btn btn-gradient mt-16"
              onClick={handleContinue}
              disabled={!selectedRole || loading}
            >
              {loading ? <span className="spinner"></span> : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
