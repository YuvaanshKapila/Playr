import { useState } from 'react'
import { supabase } from '../config/supabase'
import './PlayerSetup.css'

export default function PlayerSetup({ onComplete }) {
  const [formData, setFormData] = useState({
    full_name: '',
    sport: '',
    position: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    location: '',
    bio: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const sports = [
    'Soccer', 'Basketball', 'Baseball', 'Football', 'Tennis',
    'Volleyball', 'Track & Field', 'Swimming', 'Hockey', 'Other'
  ]

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const user = await supabase.auth.getUser()

      // Update profile name
      await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('id', user.data.user.id)

      // Create player profile
      const { error: playerError } = await supabase
        .from('player_profiles')
        .insert({
          user_id: user.data.user.id,
          sport: formData.sport,
          position: formData.position,
          age: parseInt(formData.age),
          height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
          weight_kg: formData.weight_kg ? parseInt(formData.weight_kg) : null,
          location: formData.location,
          bio: formData.bio
        })

      if (playerError) throw playerError

      onComplete()
    } catch (error) {
      console.error('Error creating profile:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="player-setup-page">
      <div className="container">
        <div className="setup-header">
          <div className="logo-small">Playr</div>
          <h2>Create Your Player Profile</h2>
          <p className="text-muted">Let's get you set up to compete and get discovered</p>
        </div>

        {error && (
          <div className="error-banner mb-16">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="card">
            <h3 className="section-title">Basic Info</h3>

            <div className="input-group">
              <label htmlFor="full_name">Full Name *</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="sport">Sport *</label>
              <select
                id="sport"
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                required
              >
                <option value="">Select a sport</option>
                {sports.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="position">Position *</label>
              <input
                id="position"
                name="position"
                type="text"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g., Forward, Guard, Pitcher"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="age">Age *</label>
              <input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                placeholder="16"
                min="8"
                max="99"
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, State/Country"
              />
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Physical Stats (Optional)</h3>

            <div className="input-row">
              <div className="input-group">
                <label htmlFor="height_cm">Height (cm)</label>
                <input
                  id="height_cm"
                  name="height_cm"
                  type="number"
                  value={formData.height_cm}
                  onChange={handleChange}
                  placeholder="175"
                />
              </div>

              <div className="input-group">
                <label htmlFor="weight_kg">Weight (kg)</label>
                <input
                  id="weight_kg"
                  name="weight_kg"
                  type="number"
                  value={formData.weight_kg}
                  onChange={handleChange}
                  placeholder="70"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">About You</h3>

            <div className="input-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about your experience, achievements, and goals..."
                rows="4"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-gradient"
            disabled={loading}
          >
            {loading ? <span className="spinner"></span> : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
