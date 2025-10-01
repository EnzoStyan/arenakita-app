// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Definisikan tipe untuk data Venue
type Venue = {
  id: string;
  name: string;
  address: string;
  status: string;
  // tambahkan properti lain jika perlu
};

export default function DashboardPage() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // State untuk form pendaftaran venue (Manager)
  const [venueName, setVenueName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  
  // State untuk daftar venue pending (Superadmin)
  const [pendingVenues, setPendingVenues] = useState<Venue[]>([])

  // Fungsi untuk mengambil venue yang pending (Superadmin)
  const fetchPendingVenues = useCallback(async () => {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('status', 'pending')
    
    if (data) {
      setPendingVenues(data)
    }
  }, [])

  // Efek untuk melindungi rute
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
    // Jika user adalah superadmin, ambil data venue pending
    if (profile?.role === 'superadmin') {
      fetchPendingVenues()
    }
  }, [user, loading, router, profile, fetchPendingVenues])

  // Fungsi untuk handle submit form venue (Manager)
  const handleVenueSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSubmitting(true)
    setMessage('')
    const { error } = await supabase.from('venues').insert({
      owner_id: user.id,
      name: venueName,
      address: address,
      city: city,
      description: description,
      status: 'pending',
    })
    if (error) {
      setMessage('Gagal mendaftarkan venue: ' + error.message)
    } else {
      setMessage('Venue berhasil didaftarkan! Menunggu persetujuan Superadmin.')
      setVenueName(''); setAddress(''); setCity(''); setDescription('')
    }
    setIsSubmitting(false)
  }

  // Fungsi untuk approve/reject venue (Superadmin)
  const handleVenueStatusChange = async (venueId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('venues')
      .update({ status: newStatus })
      .eq('id', venueId)

    if (error) {
      alert('Gagal mengubah status: ' + error.message)
    } else {
      alert(`Venue telah di-${newStatus}.`)
      // Refresh daftar venue pending
      fetchPendingVenues()
    }
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
        {/* Tampilan untuk Player */}
        {profile.role === 'player' && (
          <div>...</div>
        )}
        
        {/* Tampilan untuk Manager */}
        {profile.role === 'manager' && (
          <div>...</div> // Form venue disembunyikan agar kode tidak terlalu panjang
        )}
        
        {/* Tampilan untuk Superadmin */}
        {profile.role === 'superadmin' && (
          <div>
            <h2>Dasbor Superadmin</h2>
            <p>Daftar venue yang menunggu persetujuan:</p>
            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f2f2f2' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Nama Venue</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Alamat</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingVenues.length > 0 ? (
                  pendingVenues.map((venue) => (
                    <tr key={venue.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{venue.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{venue.address}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <button onClick={() => handleVenueStatusChange(venue.id, 'approved')} style={{ marginRight: '5px', background: 'green', color: 'white' }}>Approve</button>
                        <button onClick={() => handleVenueStatusChange(venue.id, 'rejected')} style={{ background: 'red', color: 'white' }}>Reject</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Tidak ada venue yang menunggu persetujuan.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}