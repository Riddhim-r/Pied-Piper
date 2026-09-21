import { useNavigate } from 'react-router-dom'
import { logout } from '../lib/sessionAuth'
import { playBlipSound } from '../lib/arcadeAudio'
import logoutButtonImg from '../assets/logout-button.png'

const LogoutButton = () => {
  const navigate = useNavigate()
  return (
    <button
      className="logout-button-img-btn"
      onClick={() => {
        playBlipSound()
        logout()
        navigate('/')
      }}
      type="button"
      aria-label="Log out"
      title="Log out"
    >
      <img src={logoutButtonImg} alt="Log out" className="logout-button-img" />
    </button>
  )
}

export default LogoutButton
