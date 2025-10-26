import { useState } from 'react'
import { supabase } from '../config/supabase'

export default function RecruiterSetup({ userId, onComplete }) {
  const [formData, setFormData] = useState({
    full_name: '',
    organization: '',
    sport: '',
    position_seeking: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create recruiter profile
      const { error } = await supabase
        .from('recruiter_profiles')
        .insert({
          user_id: userId,
          school_organization: formData.organization,
          // Note: 'sport', 'position_seeking', 'location' columns need to be added via MISSING-TABLES.sql
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
          <h2 className="text-center mb-24">Recruiter Profile Setup</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="input-group">
              <label>Organization *</label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                placeholder="e.g., UCLA Athletics, Nike"
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
              <label>Position Seeking</label>
              <input
                type="text"
                value={formData.position_seeking}
                onChange={(e) => setFormData({ ...formData, position_seeking: e.target.value })}
                placeholder="e.g., Point Guard, Forward"
              />
            </div>

            <div className="input-group">
              <label>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Los Angeles, CA"
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
