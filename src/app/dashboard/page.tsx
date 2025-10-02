// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Definisikan semua tipe data yang dibutuhkan
type BookingHistory = {
  id: string; start_time: string; total_price: number; payment_status: string;
  fields: { name: string; venues: { name: string; } | null; } | null;
};
type Venue = { id: string; name: string; address: string; status: string; };
type ManagerBooking = {
  id: string; start_time: string; payment_status: string; total_price: number;
  fields: { name: string; } | null;
  profiles: { full_name: string | null; email: string; } | null;
};

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // Kumpulkan semua state di satu tempat
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [managerBookings, setManagerBookings] = useState<ManagerBooking[]>([]);
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [pendingVenues, setPendingVenues] = useState<Venue[]>([]);

  // Callback untuk fetch data superadmin
  const fetchPendingVenues = useCallback(async () => {
    const { data } = await supabase.from('venues').select('*').eq('status', 'pending');
    if (data) setPendingVenues(data);
  }, []);

  // useEffect yang menangani semua peran
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (profile?.role === 'player' && user) {
      const fetchBookingHistory = async () => {
        const { data, error } = await supabase
          .from('bookings').select('id, start_time, total_price, payment_status, fields(name, venues(name))').eq('user_id', user.id).order('start_time', { ascending: false });
        if (error) console.error("Error fetching booking history:", error);
        else setBookingHistory(data as unknown as BookingHistory[]);
      };
      fetchBookingHistory();
    }

    if (profile?.role === 'manager' && user) {
      const fetchManagerBookings = async () => {
        const { data, error } = await supabase
          .from('venues')
          .select(`
            fields (
              name, 
              bookings (
                *,
                profiles ( email, full_name )
              )
            )
          `)
          .eq('owner_id', user.id);

        if (error) {
          console.error("Error fetching manager bookings:", error);
        } else if (data) {
          const allBookings = data.flatMap(venue => 
            venue.fields.flatMap(field => 
              field.bookings.map(booking => ({ 
                ...booking, 
                fields: { name: field.name } 
              }))
            )
          );
          setManagerBookings(allBookings as ManagerBooking[]);
        }
      };
      fetchManagerBookings();
    }
    
    if (profile?.role === 'superadmin') {
      fetchPendingVenues();
    }
  }, [user, loading, router, profile, fetchPendingVenues]);

  // Fungsi untuk handle submit venue (Manager)
  const handleVenueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setMessage('');
    const { error } = await supabase.from('venues').insert({
      owner_id: user.id, name: venueName, address: address, city: city, description: description, status: 'pending',
    });
    if (error) {
      setMessage('Gagal mendaftarkan venue: ' + error.message);
    } else {
      setMessage('Venue berhasil didaftarkan! Menunggu persetujuan Superadmin.');
      setVenueName(''); setAddress(''); setCity(''); setDescription('');
    }
    setIsSubmitting(false);
  };

  // Fungsi untuk approve/reject venue (Superadmin)
  const handleVenueStatusChange = async (venueId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase.from('venues').update({ status: newStatus }).eq('id', venueId);
    if (error) {
      alert('Gagal mengubah status: ' + error.message);
    } else {
      alert(`Venue telah di-${newStatus}.`);
      fetchPendingVenues();
    }
  };
  
  if (loading || !profile) {
    return <div>Loading...</div>;
  }

  // JSX untuk render UI berdasarkan peran
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: 'auto' }}>
      <h1>Selamat Datang di Dashboard</h1>
      <p>Halo, {profile.email}! Anda login sebagai: <strong>{profile.role}</strong></p>
      <hr style={{ margin: '20px 0' }} />
      <div>
        {profile.role === 'player' && (
          <div>
            <h2>Riwayat Booking Anda</h2>
            {bookingHistory.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {bookingHistory.map(booking => (
                  <li key={booking.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                    <strong>{booking.fields?.venues?.name || 'Venue Dihapus'}</strong> - {booking.fields?.name || 'Lapangan Dihapus'}
                    <br />
                    Jadwal: {new Date(booking.start_time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                    <br />
                    Total: Rp {booking.total_price.toLocaleString('id-ID')}
                    <br />
                    Status: <span style={{ fontWeight: 'bold', color: booking.payment_status === 'pending' ? 'orange' : 'green' }}>
                      {booking.payment_status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <p>Anda belum memiliki riwayat booking.</p>}
          </div>
        )}

        {profile.role === 'manager' && (
          <div>
            <h2>Daftar Booking Masuk</h2>
            {managerBookings.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
                <thead>
                  <tr style={{ background: '#f2f2f2' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Pemesan</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Lapangan</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Jadwal</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Status Bayar</th>
                  </tr>
                </thead>
                <tbody>
                  {managerBookings.map(booking => (
                    <tr key={booking.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.profiles?.email || 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{booking.fields?.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{new Date(booking.start_time).toLocaleString('id-ID')}</td>
                      <td style={{ padding: '10px', border: '1-px solid #ddd' }}>{booking.payment_status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>Belum ada booking yang masuk untuk venue Anda.</p>}
            
            <h2>Daftarkan Venue Baru</h2>
            <form onSubmit={handleVenueSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
              <input type="text" placeholder="Nama Venue" value={venueName} onChange={(e) => setVenueName(e.target.value)} required style={{ padding: '10px' }}/>
              <input type="text" placeholder="Kota" value={city} onChange={(e) => setCity(e.target.value)} required style={{ padding: '10px' }}/>
              <input type="text" placeholder="Alamat Lengkap" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ padding: '10px' }}/>
              <textarea placeholder="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ padding: '10px', minHeight: '100px' }}/>
              <button type="submit" disabled={isSubmitting} style={{ padding: '12px', cursor: 'pointer' }}>{isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Venue'}</button>
              {message && <p>{message}</p>}
            </form>
          </div>
        )}

        {profile.role === 'superadmin' && (
          <div>
            <h2>Daftar Venue Menunggu Persetujuan</h2>
            <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f2f2f2' }}><th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Nama Venue</th><th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Aksi</th></tr></thead>
              <tbody>
                {pendingVenues.length > 0 ? (
                  pendingVenues.map((venue) => (
                    <tr key={venue.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{venue.name}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <button onClick={() => handleVenueStatusChange(venue.id, 'approved')} style={{ marginRight: '5px', background: 'green', color: 'white' }}>Approve</button>
                        <button onClick={() => handleVenueStatusChange(venue.id, 'rejected')} style={{ background: 'red', color: 'white' }}>Reject</button>
                      </td>
                    </tr>
                  ))
                ) : <tr><td colSpan={2} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Tidak ada venue yang menunggu.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}