// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Efek untuk melindungi rute
  useEffect(() => {
    // Jika loading selesai dan tidak ada user, alihkan ke halaman login
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Tampilkan pesan loading selagi data diambil
  if (loading || !profile) {
    return <div>Loading...</div>
  }

  // Tampilan utama setelah memastikan user sudah login
  return (
    <div style={{ padding: '40px' }}>
      <h1>Selamat Datang di Dashboard</h1>
      <p>Halo, {profile.email}! Anda login sebagai: <strong>{profile.role}</strong></p>
      
      <hr style={{ margin: '20px 0' }} />

      {/* Tampilkan konten berdasarkan peran */}
      <div>
        {profile.role === 'player' && (
          <div>
            <h2>Dasbor Player</h2>
            <p>Di sini Anda bisa melihat riwayat booking dan jadwal mendatang.</p>
          </div>
        )}
        
        {profile.role === 'manager' && (
          <div>
            <h2>Dasbor Pengelola Lapangan</h2>
            <p>Di sini Anda bisa mengelola venue, lapangan, dan melihat laporan pendapatan.</p>
          </div>
        )}
        
        {profile.role === 'superadmin' && (
          <div>
            <h2>Dasbor Superadmin</h2>
            <p>Di sini Anda bisa mengelola semua pengguna, venue, dan pengaturan platform.</p>
          </div>
        )}
      </div>
    </div>
  )
}