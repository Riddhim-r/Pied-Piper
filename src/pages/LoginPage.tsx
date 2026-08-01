import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { useAppSettings } from '../features/settings/context/SettingsContext'
import { isLoggedIn, login } from '../lib/sessionAuth'

const LoginPage = () => {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const success = login(password)
    if (!success) {
      setError('Incorrect password. Try again.')
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="page login-page">
      <TopNav title="Pied Piper" hideMark />

      {!showLogin ? (
        <div className="login-hero">
          <div
            className="hero-image"
            role="img"
            aria-label={`${settings.applicationName} hero`}
          />
          <button className="hi-text" type="button" onClick={() => setShowLogin(true)}>
            Hi!
          </button>
        </div>
      ) : (
        <div className="panel">
          <form className="card login-card" onSubmit={handleSubmit}>
            <div className="login-identity">
              <span className="btn active">Bread-winner</span>
            </div>

            <label className="field">
              <span>Input your not-so-secret code here:</span>
              <div className="password-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="admin123"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {error ? <p className="error">{error}</p> : null}

            <button type="submit" className="btn primary">
              Let's Go!
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default LoginPage
