import { useState } from 'react'
import { supabase } from '../config/supabase'
import './IntroPage.css'

export default function IntroPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Check if user has completed profile setup
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (profile && profile.role) {
          // User has completed setup, go to main app
          onLogin(profile.role)
        } else {
          // User needs to select role and complete profile
          onLogin(null)
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        // After signup, user needs to select role
        onLogin(null)
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg intro-page">
      <div className="container">
        <div className="intro-content">
          <div className="logo-section">
            <div className="logo">Playr</div>
            <p className="tagline">Train. Compete. Get Discovered.</p>
          </div>

          <div className="card">
            <h2 className="text-center mb-24">
              {isLogin ? 'Welcome Back' : 'Join Playr'}
            </h2>

            {error && (
              <div className="error-banner mb-16">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-gradient mb-16"
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : isLogin ? (
                  'Log In'
                ) : (
                  'Sign Up'
                )}
              </button>

              <div className="text-center text-sm">
                {isLogin ? (
                  <p>
                    Don't have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(false) }}>
                      Sign Up
                    </a>
                  </p>
                ) : (
                  <p>
                    Already have an account?{' '}
                    <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(true) }}>
                      Log In
                    </a>
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
