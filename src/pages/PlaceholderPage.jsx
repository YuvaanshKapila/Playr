import { supabase } from '../config/supabase'
import './PlaceholderPage.css'

export default function PlaceholderPage({ role }) {
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  const roleInfo = {
    coach: {
      title: 'Coach Dashboard',
      description: 'Create teams, manage players, and provide expert feedback',
      features: [
        'Create and manage your teams',
        'Review player videos and provide feedback',
        'Track team performance and progress',
        'Set challenges for your players',
        'Access AI-powered drill recommendations'
      ]
    },
    recruiter: {
      title: 'Recruiter Dashboard',
      description: 'Discover talent with our smart matchmaking system',
      features: [
        'Swipe through player profiles (Tinder-style)',
        'Advanced search filters by sport, position, location',
        'View AI-analyzed skill videos',
        'Real-time chat with players',
        'Compare players side-by-side',
        'Build and manage your talent shortlist'
      ]
    }
  }

  const info = roleInfo[role] || roleInfo.coach

  return (
    <div className="placeholder-page gradient-bg">
      <header className="placeholder-header">
        <div className="container">
          <div className="header-content">
            <div className="logo">Playr</div>
            <button onClick={handleLogout} className="btn-logout-white">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="placeholder-content">
          <h1 className="placeholder-title">{info.title}</h1>
          <p className="placeholder-subtitle">{info.description}</p>

          <div className="card features-card">
            <h3 className="text-center mb-16">Coming Soon</h3>
            <ul className="features-list">
              {info.features.map((feature, index) => (
                <li key={index}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="status-badge">
              Under Development
            </div>
          </div>

          <p className="text-center text-light">
            This feature is currently being built. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  )
}
