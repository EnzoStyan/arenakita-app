// src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'

// --- Tipe Data ---
type BookingHistory = {
  id: string; start_time: string; total_price: number; payment_status: string;
  fields: { name: string; venues: { name: string; } | null; } | null;
};
type Venue = { id: string; name: string; address: string; status: string; };
type Field = { id: string; name: string; price_per_hour: number; };
type ManagerVenue = {
  id: string; name: string;
  fields: (Field & {
    bookings: { id: string; start_time: string; payment_status: string; profiles: { email: string; } | null; }[]
  })[];
};

export default function DashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  // --- States ---
  const [bookingHistory, setBookingHistory] = useState<BookingHistory[]>([]);
  const [managerVenues, setManagerVenues] = useState<ManagerVenue[]>([]);
  const [pendingVenues, setPendingVenues] = useState<Venue[]>([]);
  
  // State untuk form venue baru
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmittingVenue, setIsSubmittingVenue] = useState(false);
  const [venueMessage, setVenueMessage] = useState('');

  // State untuk form field baru
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldPrice, setNewFieldPrice] = useState('');

  // --- Handlers & Effects ---
  const fetchManagerData = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('venues')
      .select(`id, name, fields ( *, bookings ( *, profiles (email) ) )`)
      .eq('owner_id', user.id);
    if (error) console.error("Error fetching manager data:", error);
    else setManagerVenues(data as ManagerVenue[]);
  }, [user]);

  const fetchPendingVenues = useCallback(async () => {
    const { data } = await supabase.from('venues').select('*').eq('status', 'pending');
    if (data) setPendingVenues(data);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    if (!profile) return;

    if (profile.role === 'player') {
      const fetchBookingHistory = async () => {
        const { data, error } = await supabase.from('bookings').select('id, start_time, total_price, payment_status, fields!inner(name, venues!inner(name))').eq('user_id', user.id).order('start_time', { ascending: false });
        if (error) console.error("Error fetching booking history:", error);
        else setBookingHistory(data as unknown as BookingHistory[]);
      };
      fetchBookingHistory();
    }
    if (profile.role === 'manager') { fetchManagerData(); }
    if (profile.role === 'superadmin') { fetchPendingVenues(); }
  }, [user, loading, router, profile, fetchManagerData, fetchPendingVenues]);

  const handleVenueSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmittingVenue(true);
    setVenueMessage('');
    const { error } = await supabase.from('venues').insert({ owner_id: user.id, name: venueName, address: address, city: city, description: description, status: 'pending' });
    if (error) {
      setVenueMessage('Gagal mendaftarkan venue: ' + error.message);
    } else {
      setVenueMessage('Venue baru berhasil didaftarkan! Menunggu persetujuan Superadmin.');
      setVenueName(''); setAddress(''); setCity(''); setDescription('');
    }
    setIsSubmittingVenue(false);
  };
  
  const handleFieldSubmit = async (e: FormEvent, venueId: string) => {
    e.preventDefault();
    if (!newFieldName || !newFieldPrice) { alert('Nama lapangan dan harga harus diisi.'); return; }
    const { error } = await supabase.from('fields').insert({ venue_id: venueId, name: newFieldName, price_per_hour: Number(newFieldPrice), category_id: 1 });
    if (error) {
      alert('Gagal menambah lapangan: ' + error.message);
    } else {
      alert('Lapangan baru berhasil ditambahkan!');
      setNewFieldName(''); setNewFieldPrice('');
      fetchManagerData();
    }
  };

  const handleVenueStatusChange = async (venueId: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase.from('venues').update({ status: newStatus }).eq('id', venueId);
    if (error) { alert('Gagal mengubah status: ' + error.message); }
    else {
      alert(`Venue telah di-${newStatus}.`);
      fetchPendingVenues();
    }
  };
  
  if (loading || !profile) return <div>Loading...</div>;

  // --- RENDER ---
  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: 'auto' }}>
      <h1>Dasbor {profile.role}</h1>
      <p>Halo, {profile.email}!</p>
      <hr style={{ margin: '20px 0' }} />

      {/* Tampilan Player */}
      {profile.role === 'player' && (
        <div>
          <h2>Riwayat Booking Anda</h2>
          {bookingHistory.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {bookingHistory.map(booking => (
                <li key={booking.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', marginBottom: '10px' }}>
                  <strong>{booking.fields?.venues?.name || 'Venue Dihapus'}</strong> - {booking.fields?.name || 'Lapangan Dihapus'}
                  <br />Jadwal: {new Date(booking.start_time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                  <br />Total: Rp {booking.total_price.toLocaleString('id-ID')}
                  <br />Status: <span style={{ fontWeight: 'bold', color: booking.payment_status === 'pending' ? 'orange' : 'green' }}>{booking.payment_status}</span>
                </li>
              ))}
            </ul>
          ) : <p>Anda belum memiliki riwayat booking.</p>}
        </div>
      )}

      {/* Tampilan Manager */}
      {profile.role === 'manager' && (
        <div>
          <h2>Manajemen Venue & Lapangan</h2>
          {managerVenues.map(venue => (
            <div key={venue.id} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
              <h3>Venue: {venue.name}</h3>
              
              <h4>Daftar Lapangan</h4>
              {venue.fields.length > 0 ? <ul>{venue.fields.map(field => <li key={field.id}>{field.name} - Rp {field.price_per_hour.toLocaleString()}/jam</li>)}</ul> : <p>Belum ada lapangan.</p>}

              <form onSubmit={(e) => handleFieldSubmit(e, venue.id)} style={{ marginTop: '15px' }}>
                <h4>Tambah Lapangan Baru</h4>
                <input type="text" placeholder="Nama Lapangan" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} required style={{ marginRight: '10px', padding: '8px' }}/>
                <input type="number" placeholder="Harga per Jam" value={newFieldPrice} onChange={e => setNewFieldPrice(e.target.value)} required style={{ marginRight: '10px', padding: '8px' }}/>
                <button type="submit">Tambah</button>
              </form>

              <h4 style={{ marginTop: '30px' }}>Daftar Booking Masuk</h4>
              {venue.fields.flatMap(f => f.bookings).length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f2f2f2' }}><th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Pemesan</th><th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Jadwal</th><th style={{padding: '8px', border: '1px solid #ddd', textAlign: 'left'}}>Status</th></tr></thead>
                  <tbody>
                    {venue.fields.flatMap(f => f.bookings).map(booking => (
                      <tr key={booking.id}><td style={{padding: '8px', border: '1px solid #ddd'}}>{booking.profiles?.email}</td><td style={{padding: '8px', border: '1px solid #ddd'}}>{new Date(booking.start_time).toLocaleString('id-ID')}</td><td style={{padding: '8px', border: '1px solid #ddd'}}>{booking.payment_status}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>Belum ada booking yang masuk.</p>}
            </div>
          ))}
          <hr />
          <h2>Daftarkan Venue Baru</h2>
          <form onSubmit={handleVenueSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <input type="text" placeholder="Nama Venue" value={venueName} onChange={(e) => setVenueName(e.target.value)} required style={{ padding: '10px' }}/>
            <input type="text" placeholder="Kota" value={city} onChange={(e) => setCity(e.target.value)} required style={{ padding: '10px' }}/>
            <input type="text" placeholder="Alamat Lengkap" value={address} onChange={(e) => setAddress(e.target.value)} required style={{ padding: '10px' }}/>
            <textarea placeholder="Deskripsi" value={description} onChange={(e) => setDescription(e.target.value)} required style={{ padding: '10px', minHeight: '100px' }}/>
            <button type="submit" disabled={isSubmittingVenue} style={{ padding: '12px', cursor: 'pointer' }}>{isSubmittingVenue ? 'Mendaftarkan...' : 'Daftarkan Venue'}</button>
            {venueMessage && <p>{venueMessage}</p>}
          </form>
        </div>
      )}

      {/* Tampilan Superadmin */}
      {profile.role === 'superadmin' && (
        <div>
          <h2>Daftar Venue Menunggu Persetujuan</h2>
          <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f2f2f2' }}><th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Nama Venue</th><th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Aksi</th></tr></thead>
            <tbody>
              {pendingVenues.length > 0 ? (
                pendingVenues.map((venue) => (
                  <tr key={venue.id}><td style={{ padding: '10px', border: '1px solid #ddd' }}>{venue.name}</td><td style={{ padding: '10px', border: '1px solid #ddd' }}><button onClick={() => handleVenueStatusChange(venue.id, 'approved')} style={{ marginRight: '5px', background: 'green', color: 'white' }}>Approve</button><button onClick={() => handleVenueStatusChange(venue.id, 'rejected')} style={{ background: 'red', color: 'white' }}>Reject</button></td></tr>
                ))
              ) : <tr><td colSpan={2} style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>Tidak ada venue yang menunggu.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}