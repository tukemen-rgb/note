export const getCredentials = () => {
  const id = process.env.NEXT_PUBLIC_LOGIN_ID || 'admin'
  const password = process.env.NEXT_PUBLIC_LOGIN_PASSWORD || 'kashikin2026'
  return { id, password }
}

export const verifyCredentials = (id: string, password: string): boolean => {
  const { id: correctId, password: correctPassword } = getCredentials()
  return id === correctId && password === correctPassword
}

export const getAuthFromStorage = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const auth = localStorage.getItem('kashikin_auth')
    if (!auth) return false
    const parsed = JSON.parse(auth)
    return parsed.loggedIn === true
  } catch {
    return false
  }
}

export const setAuthInStorage = (loggedIn: boolean): void => {
  localStorage.setItem('kashikin_auth', JSON.stringify({ loggedIn }))
}

export const clearAuthFromStorage = (): void => {
  localStorage.removeItem('kashikin_auth')
}
