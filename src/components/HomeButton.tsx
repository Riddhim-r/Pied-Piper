import { Link } from 'react-router-dom'

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
    >
      <img src="./home-button.png" alt={title} className="home-button-img" />
    </Link>
  )
}

export default HomeButton
