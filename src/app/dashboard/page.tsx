// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // State untuk form pendaftaran venue
  const [venueName, setVenueName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  // Efek untuk melindungi rute
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Fungsi untuk handle submit form venue
  const handleVenueSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)
    setMessage('')

    const { error } = await supabase.from('venues').insert({
      owner_id: user.id, // ID dari pengguna yang sedang login
      name: venueName,
      address: address,
      city: city,
      description: description,
      status: 'pending', // Status awal saat pendaftaran
    })

    if (error) {
      setMessage('Gagal mendaftarkan venue: ' + error.message)
    } else {
      setMessage('Venue berhasil didaftarkan! Menunggu persetujuan Superadmin.')
      // Reset form
      setVenueName('')
      setAddress('')
      setDescription('')
    }
    setIsSubmitting(false)
  }

  if (loading || !profile) {
    return <div>Loading...</div>
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Selamat Datang di Dashboard</h1>
      <p>Halo, {profile.email}! Anda login sebagai: <strong>{profile.role}</strong></p>
      
      <hr style={{ margin: '20px 0' }} />

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
            <p>Gunakan form di bawah ini untuk mendaftarkan venue olahraga Anda.</p>
            
            {/* Form Pendaftaran Venue */}
            <form onSubmit={handleVenueSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
              <input
                type="text"
                placeholder="Nama Venue (cth: Garuda Sport Center)"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                required
                style={{ padding: '10px' }}
              />
              <input
                type="text"
                placeholder="Kota (cth: Jakarta, Semarang)"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                style={{ padding: '10px' }}
              />
              <input
                type="text"
                placeholder="Alamat Lengkap Venue"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                style={{ padding: '10px' }}
              />
              <textarea
                placeholder="Deskripsi singkat tentang venue dan fasilitasnya"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{ padding: '10px', minHeight: '100px' }}
              />
              <button type="submit" disabled={isSubmitting} style={{ padding: '12px', cursor: 'pointer' }}>
                {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Venue Saya'}
              </button>
              {message && <p>{message}</p>}
            </form>
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