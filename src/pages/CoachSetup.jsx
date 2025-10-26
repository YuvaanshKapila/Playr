import { useState } from 'react'
import { supabase } from '../config/supabase'

export default function CoachSetup({ userId, onComplete }) {
  const [formData, setFormData] = useState({
    full_name: '',
    sport: '',
    specialty: '',
    bio: '',
    experience_years: '',
    hourly_rate: '',
    certifications: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create coach profile
      const { error } = await supabase
        .from('coach_profiles')
        .insert({
          user_id: userId,
          sport: formData.sport,
          specialty: formData.specialty,
          bio: formData.bio,
          experience_years: parseInt(formData.experience_years),
          hourly_rate: parseFloat(formData.hourly_rate),
          certifications: formData.certifications
        })

      if (error) throw error

      // Update main profile with full name
      await supabase
        .from('profiles')
        .update({ full_name: formData.full_name })
        .eq('id', userId)

      if (onComplete) {
        onComplete()
      } else {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to create profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg">
      <div className="container" style={{paddingTop: '40px'}}>
        <div className="card">
          <h2 className="text-center mb-24">Coach Profile Setup</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="input-group">
              <label>Sport *</label>
              <select
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                required
              >
                <option value="">Select sport</option>
                <option value="Basketball">Basketball</option>
                <option value="Soccer">Soccer</option>
                <option value="Football">Football</option>
                <option value="Baseball">Baseball</option>
                <option value="Tennis">Tennis</option>
                <option value="Volleyball">Volleyball</option>
                <option value="Track & Field">Track & Field</option>
                <option value="Swimming">Swimming</option>
              </select>
            </div>

            <div className="input-group">
              <label>Specialty *</label>
              <input
                type="text"
                value={formData.specialty}
                onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                placeholder="e.g., Ball Handling & Dribbling"
                required
              />
            </div>

            <div className="input-group">
              <label>Years of Experience *</label>
              <input
                type="number"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                placeholder="5"
                min="0"
                required
              />
            </div>

            <div className="input-group">
              <label>Hourly Rate ($) *</label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                placeholder="75"
                min="0"
                step="5"
                required
              />
            </div>

            <div className="input-group">
              <label>Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell players about your coaching experience and philosophy..."
                rows="4"
              />
            </div>

            <div className="input-group">
              <label>Certifications (optional)</label>
              <input
                type="text"
                value={formData.certifications}
                onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                placeholder="e.g., USA Basketball Certified Coach"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
