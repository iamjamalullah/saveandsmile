import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, setAuthToken, getAuthToken } from '../api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('qg_staff_user') || 'null')
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => getAuthToken())
  const [loading, setLoading] = useState(true)

  // Verify token on mount
  useEffect(() => {
    const existingToken = getAuthToken()
    if (!existingToken) {
      setLoading(false)
      return
    }
    api.auth.me()
      .then(res => {
        if (res?.user) {
          setUser(res.user)
          try {
            localStorage.setItem('qg_staff_user', JSON.stringify(res.user))
          } catch {}
        } else {
          logout()
        }
      })
      .catch(() => {
        logout()
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.auth.login(email, password)
    if (res?.token && res?.user) {
      setToken(res.token)
      setUser(res.user)
      setAuthToken(res.token)
      try {
        localStorage.setItem('qg_staff_user', JSON.stringify(res.user))
      } catch {}
      return res.user
    }
    throw new Error('Authentication failed: Missing token in response')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch {}
    setUser(null)
    setToken(null)
    setAuthToken(null)
    try {
      localStorage.removeItem('qg_staff_user')
    } catch {}
  }, [])

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(user && token),
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager' || user?.role === 'admin',
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
