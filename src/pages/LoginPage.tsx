import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { useAppSettings } from '../features/settings/context/SettingsContext'
import {
  isSoundMuted,
  playBlipSound,
  playCoinSound,
  playErrorSound,
  playSuccessSound,
  toggleSoundMuted,
} from '../lib/arcadeAudio'
import { isLoggedIn, login } from '../lib/sessionAuth'
import loginHeroImg from '../assets/login-hero.jpg'

const LoginPage = () => {
  const navigate = useNavigate()
  const { settings } = useAppSettings()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [muted, setMuted] = useState(isSoundMuted())
  const [isShaking, setIsShaking] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const handleToggleSound = () => {
    const isNowMuted = toggleSoundMuted()
    setMuted(isNowMuted)
    if (!isNowMuted) {
      playBlipSound()
    }
  }

  const handlePressStart = () => {
    playCoinSound()
    setShowLogin(true)
    setError('')
  }

  const handleBackToStart = () => {
    playBlipSound()
    setShowLogin(false)
    setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    playBlipSound()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const success = login(password)
    if (!success) {
      playErrorSound()
      setError('ACCESS DENIED. INCORRECT CODE.')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      return
    }

    playSuccessSound()
    setIsUnlocking(true)

    // Smooth arcade unlock flash before redirecting
    setTimeout(() => {
      navigate('/dashboard')
    }, 600)
  }

  return (
    <div className="page login-page">
      <TopNav title={settings.applicationName || 'Pied Piper'} hideMark />

      <div className="arcade-cabinet-wrapper">
        <div className="arcade-cabinet">
          {/* Arcade Marquee Header */}
          <div className="arcade-marquee">
            <div className="marquee-left">
              <span className="marquee-pill">CRT-88</span>
              <span className="marquee-title">PIED PIPER VAULT</span>
            </div>
            <div className="marquee-right">
              <span className="high-score-label">HIGH SCORE</span>
              <span className="high-score-val">999990</span>
              <button
                type="button"
                className="sound-toggle-btn"
                onClick={handleToggleSound}
                title={muted ? 'Unmute SFX' : 'Mute SFX'}
                aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
              >
                {muted ? '🔇 MUTE' : '🔊 SFX ON'}
              </button>
            </div>
          </div>

          {/* CRT Screen Frame */}
          <div className="crt-bezel">
            <div
              className={`crt-screen ${isShaking ? 'shake' : ''} ${isUnlocking ? 'unlock-flash' : ''}`}
            >
              <div className="crt-scanlines" />

              {!showLogin ? (
                /* STAGE 1: PRESS START SCREEN */
                <div className="arcade-hero-stage">
                  <div
                    className="hero-image"
                    role="img"
                    style={{ backgroundImage: `url(${loginHeroImg})` }}
                    aria-label={`${settings.applicationName} hero`}
                  />
                  <div className="press-start-box">
                    <p className="insert-coin-text">★ INSERT COIN TO ACCESS ★</p>
                    <button
                      className="arcade-start-btn"
                      type="button"
                      onClick={handlePressStart}
                    >
                      ▶ PRESS START ◀
                    </button>
                    <p className="coin-subtext">CREDITS 01/99 • STAGE 01</p>
                  </div>
                </div>
              ) : (
                /* STAGE 2: PASSCODE ENTRY VAULT */
                <div className="arcade-vault-stage">
                  <form className="arcade-form" onSubmit={handleSubmit}>
                    <div className="vault-header">
                      <span className="identity-badge">PLAYER 1: BREAD-WINNER</span>
                      <span className="security-status">SYSTEM LOCKED</span>
                    </div>

                    <div className="passcode-container">
                      <label htmlFor="not-so-secret-code" className="passcode-label">
                        INPUT SECRET CODE:
                      </label>
                      <div className="arcade-input-row">
                        <input
                          id="not-so-secret-code"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="admin123"
                          value={password}
                          onChange={handlePasswordChange}
                          autoFocus
                          required
                        />
                        <button
                          type="button"
                          className="arcade-toggle-btn"
                          onClick={() => {
                            playBlipSound()
                            setShowPassword((curr) => !curr)
                          }}
                        >
                          {showPassword ? '🙈 HIDE' : '👁 SHOW'}
                        </button>
                      </div>
                    </div>

                    {error ? <div className="arcade-error-msg">{error}</div> : null}

                    <div className="arcade-controls-row">
                      <button
                        type="button"
                        className="arcade-btn secondary"
                        onClick={handleBackToStart}
                      >
                        [B] BACK
                      </button>
                      <button type="submit" className="arcade-btn primary">
                        [A] LET'S GO!
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Cabinet Bottom Control Strip & Status Light */}
          <div className="cabinet-footer">
            <div className="status-indicator">
              <span className="status-led glowing" />
              <span className="status-text">SYSTEM ONLINE</span>
            </div>
            <div className="speaker-grille">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="coin-slot-badge">🪙 25¢ PLAY</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
