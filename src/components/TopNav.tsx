import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAppSettings } from '../features/settings/context/SettingsContext'

type TopNavProps = {
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  hideMark?: boolean
}

const TopNav = ({ title, subtitle, rightSlot, hideMark }: TopNavProps) => {
  const { settings } = useAppSettings()
  const displayTitle = settings.applicationName || title
  const brandDestination = hideMark ? '/' : '/dashboard'

  return (
    <header className="top-nav">
      <div>
        <Link to={brandDestination} className="brand">
          {hideMark ? null : (
            <span className="brand-mark" aria-label="Pied Piper heart">
              ♥
            </span>
          )}
          <span className={hideMark ? 'brand-text brand-hero' : 'brand-text'}>
            {displayTitle}
          </span>
        </Link>
        {subtitle ? <p className="subtle">{subtitle}</p> : null}
      </div>
      <div className="nav-actions">{rightSlot}</div>
    </header>
  )
}

export default TopNav
