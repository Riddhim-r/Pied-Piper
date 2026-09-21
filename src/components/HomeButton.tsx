import { Link } from 'react-router-dom'
import { playBlipSound } from '../lib/arcadeAudio'

type HomeButtonProps = {
  to?: string
  title?: string
  className?: string
}

const HomeButton = ({ to = '/dashboard', title = 'Back to Dashboard', className = '' }: HomeButtonProps) => {
  return (
    <Link
      to={to}
      className={`home-button-img-btn ${className}`.trim()}
      aria-label={title}
      title={title}
      onClick={() => playBlipSound()}
    >
      <img src="./home-button.png" alt={title} className="home-button-img" />
    </Link>
  )
}

export default HomeButton
