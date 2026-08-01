import { Link } from 'react-router-dom'
import { isLoggedIn } from '../lib/sessionAuth'

const NotFound = () => {
  const loggedIn = isLoggedIn()

  return (
    <div className="page">
      <div className="content center">
        <div className="card">
          <h1>Page not found</h1>
          <p>The page you are looking for does not exist.</p>
          <Link className="btn primary" to={loggedIn ? '/dashboard' : '/'}>
            {loggedIn ? 'Back to Dashboard' : 'Back to Login'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound
