// src/components/AuthManager.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'

export default function AuthManager() {
  const { session, profile, logout, loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
      {session ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <p>
            Hello, {profile?.email} (<b>{profile?.role}</b>)
          </p>
          {/* Tambahkan Link ke Dashboard */}
          <Link href="/dashboard">
            <button>Dashboard</button>
          </Link>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <Link href="/login">
          <button>Login</button>
        </Link>
      )}
    </div>
  )
}