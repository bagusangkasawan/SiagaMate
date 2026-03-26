import { createContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthChange, signInWithGoogle, firebaseSignOut, getIdToken, type User } from '../lib/firebase'
import { API_BASE } from '../lib/api'

export interface AuthContextValue {
  user: User | null
  idToken: string | null
  loading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  idToken: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken()
        setIdToken(token)
      } else {
        setIdToken(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const login = async () => {
    try {
      const firebaseUser = await signInWithGoogle()
      const token = await firebaseUser.getIdToken()
      setIdToken(token)

      // Sync user to backend
      await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: firebaseUser.displayName || 'Pengguna Baru',
          photoURL: firebaseUser.photoURL || '',
        }),
      })
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const logout = async () => {
    await firebaseSignOut()
    setUser(null)
    setIdToken(null)
  }

  const refreshToken = async () => {
    const token = await getIdToken()
    setIdToken(token)
    return token
  }

  return (
    <AuthContext.Provider value={{ user, idToken, loading, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}
