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
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dasbor</h1>
          <p className="mt-1 text-gray-600">Selamat datang, {profile.email}! Anda login sebagai <span className="font-semibold text-indigo-600">{profile.role}</span>.</p>
        </div>

        {/* --- TAMPILAN PLAYER --- */}
        {profile.role === 'player' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Riwayat Booking Anda</h2>
            {bookingHistory.length > 0 ? (
              <ul className="space-y-4">
                {bookingHistory.map(booking => (
                  <li key={booking.id} className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row justify-between sm:items-center">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{booking.fields?.venues?.name || 'N/A'} - <span className="font-normal">{booking.fields?.name || 'N/A'}</span></p>
                      <p className="text-sm text-gray-500">{new Date(booking.start_time).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                      <p className="text-sm text-gray-700 mt-1">Total: Rp {booking.total_price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${booking.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                        {booking.payment_status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500">Anda belum memiliki riwayat booking.</p>}
          </div>
        )}

        {/* --- TAMPILAN MANAGER --- */}
        {profile.role === 'manager' && (
          <div className="space-y-10">
            {managerVenues.map(venue => (
              <div key={venue.id} className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-4 mb-4">Venue: {venue.name}</h2>
                {/* Manajemen Fields */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">Manajemen Lapangan</h3>
                  {venue.fields.length > 0 ? ( <ul className="list-disc list-inside space-y-1 mb-4">{venue.fields.map(field => <li key={field.id}>{field.name} - Rp {field.price_per_hour.toLocaleString()}/jam</li>)}</ul> ) : <p className="text-sm text-gray-500 mb-4">Belum ada lapangan.</p>}
                  <form onSubmit={(e) => handleFieldSubmit(e, venue.id)} className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-md">
                    <input type="text" placeholder="Nama Lapangan Baru" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} required className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <input type="number" placeholder="Harga per Jam" value={newFieldPrice} onChange={e => setNewFieldPrice(e.target.value)} required className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Tambah</button>
                  </form>
                </div>
                {/* Daftar Booking Masuk */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-gray-700 mb-3">Daftar Booking Masuk</h3>
                  {/* ... JSX untuk tabel booking manager ... */}
                </div>
              </div>
            ))}
             {/* Form Daftar Venue Baru */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Daftarkan Venue Baru</h2>
                 {/* ... JSX untuk form daftar venue baru ... */}
            </div>
          </div>
        )}

        {/* --- TAMPILAN SUPERADMIN --- */}
        {profile.role === 'superadmin' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Venue Menunggu Persetujuan</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th scope="col" className="px-6 py-3">Nama Venue</th><th scope="col" className="px-6 py-3">Aksi</th></tr></thead>
                <tbody>
                  {pendingVenues.length > 0 ? (
                    pendingVenues.map((venue) => (
                      <tr key={venue.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{venue.name}</td>
                        <td className="px-6 py-4 flex gap-2">
                          <button onClick={() => handleVenueStatusChange(venue.id, 'approved')} className="px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-md hover:bg-green-600">Approve</button>
                          <button onClick={() => handleVenueStatusChange(venue.id, 'rejected')} className="px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded-md hover:bg-red-600">Reject</button>
                        </td>
                      </tr>
                    ))
                  ) : <tr><td colSpan={2} className="px-6 py-4 text-center">Tidak ada venue yang menunggu persetujuan.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}