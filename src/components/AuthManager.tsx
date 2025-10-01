// src/components/AuthManager.tsx
'use client'

import { useAuth } from '@/context/AuthContext'

export default function AuthManager() {
  const { session, profile, logout, loading } = useAuth()

  // Jangan tampilkan apa-apa selagi loading
  if (loading) {
    return null
  }

  return (
    <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
      {session ? (
        // Tampilan jika sudah login
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <p>
            Hello, {profile?.email || session.user.email} (<b>{profile?.role}</b>)
          </p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        // Tampilan jika belum login
        <a href="/login">
          <button>Login</button>
        </a>
      )}
    </div>
  )
}