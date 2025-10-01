// src/app/login/page.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const handleSignUp = async () => {
    setMessage('')
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      setMessage('Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.')
    }
  }

  const handleSignIn = async () => {
    setMessage('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (error) {
      setMessage('Error: ' + error.message)
    } else {
      // Login Successful
      setMessage('Login berhasil! Anda akan segera diarahkan.')
      // Redirect to home page after successful login
      window.location.href = '/'
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>ArenaKita Auth</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '20px', boxSizing: 'border-box' }}
        />
        <button onClick={handleSignUp} style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
          Sign Up
        </button>
        <button onClick={handleSignIn} style={{ width: '100%', padding: '10px' }}>
          Sign In
        </button>
        {message && <p style={{ marginTop: '15px', textAlign: 'center' }}>{message}</p>}
      </div>
    </div>
  )
}