import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import HomeButton from './HomeButton'
import LogoutButton from './LogoutButton'
import { useAppSettings } from '../features/settings/context/SettingsContext'
import { playBlipSound } from '../lib/arcadeAudio'
import logoImg from '../assets/logo.png'

type TopNavProps = {
  title?: string
  subtitle?: string
  rightSlot?: ReactNode
  hideMark?: boolean
  showHome?: boolean
  showLogout?: boolean
}

const TopNav = ({ title, rightSlot, hideMark, showHome = true, showLogout = true }: TopNavProps) => {
  const { settings } = useAppSettings()
  const displayTitle = settings.applicationName || title || 'Pied Piper'
  const brandDestination = hideMark ? '/' : '/dashboard'

  return (
    <header className="top-nav">
      <Link
        to={brandDestination}
        className="brand brand-logo-link"
        aria-label={displayTitle}
        onClick={() => playBlipSound()}
      >
        <img src={logoImg} alt={displayTitle} className="brand-logo-img" />
      </Link>
      <div className="nav-actions">
        {rightSlot !== undefined ? (
          rightSlot
        ) : hideMark ? null : (
          <>
            {showHome ? <HomeButton /> : null}
            {showLogout ? <LogoutButton /> : null}
          </>
        )}
      </div>
    </header>
  )
}

export default TopNav


