const SESSION_KEY = 'pied_piper_authenticated'
const BREAD_WINNER_PASSWORD = 'admin123'

export const isLoggedIn = () => {
  return localStorage.getItem(SESSION_KEY) === 'true'
}

export const login = (password: string) => {
  if (password !== BREAD_WINNER_PASSWORD) {
    return false
  }

  localStorage.setItem(SESSION_KEY, 'true')
  return true
}

export const logout = () => {
  localStorage.removeItem(SESSION_KEY)
}
