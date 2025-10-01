// src/app/venue/[id]/page.tsx
'use client'

import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState, useMemo, useCallback } from "react"
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from "@/context/AuthContext"

type Venue = { id: string; name: string; city: string; address: string; description: string; };
type Field = { id: string; name: string; price_per_hour: number; };
type Booking = { id: string; start_time: string; };
type TimeSlot = { time: string; status: 'Tersedia' | 'Dipesan'; };

export default function VenueDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  const router = useRouter();

  const [venue, setVenue] = useState<Venue | null>(null);
  const [field, setField] = useState<Field | null>(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const nextSevenDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  }), []);

  const fetchBookings = useCallback(async (currentField: Field) => {
    if (!currentField) return;
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data, error } = await supabase.from('bookings').select('id, start_time')
      .eq('field_id', currentField.id).gte('start_time', dayStart.toISOString()).lte('end_time', dayEnd.toISOString());
    if (error) console.error('Error fetching bookings:', error);
    else setBookings(data || []);
  }, [selectedDate]);

  useEffect(() => {
    const fetchVenueAndField = async () => {
      setLoading(true);
      const { data: venueData } = await supabase.from('venues').select('*').eq('id', id).single();
      setVenue(venueData);
      const { data: fieldData } = await supabase.from('fields').select('*').eq('venue_id', id).limit(1).single();
      setField(fieldData);
      if (fieldData) {
        await fetchBookings(fieldData);
      }
      setLoading(false);
    };
    if (id) fetchVenueAndField();
  }, [id, fetchBookings]);

  const timeSlots = useMemo(() => {
    const slots: TimeSlot[] = [];
    const bookedHours = bookings.map(b => new Date(b.start_time).getHours());
    for (let i = 8; i <= 22; i++) {
      slots.push({
        time: `${i.toString().padStart(2, '0')}:00`,
        status: bookedHours.includes(i) ? 'Dipesan' : 'Tersedia'
      });
    }
    return slots;
  }, [bookings]);

  // FUNGSI BARU UNTUK MEMBUAT BOOKING
  const handleBooking = async (time: string) => {
    if (!user) {
      alert('Anda harus login terlebih dahulu untuk melakukan booking.');
      router.push('/login');
      return;
    }
    if (!field) return;

    const [hour] = time.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hour, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 1);

    const { error } = await supabase.from('bookings').insert({
      user_id: user.id,
      field_id: field.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      total_price: field.price_per_hour,
      payment_status: 'pending',
      booking_status: 'confirmed',
    });

    if (error) {
      alert('Gagal melakukan booking: ' + error.message);
    } else {
      alert(`Booking berhasil untuk jam ${time}! Silakan lakukan pembayaran.`);
      // Refresh daftar booking
      fetchBookings(field);
    }
  };

  if (loading) return <p>Memuat detail venue...</p>;
  if (!venue) return <p>Venue tidak ditemukan.</p>;

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: 'auto' }}>
      <Link href="/" style={{ marginBottom: '20px', display: 'inline-block' }}>&larr; Kembali</Link>
      <h1>{venue.name}</h1>
      <p><strong>Alamat:</strong> {venue.address}, {venue.city}</p>
      
      <hr style={{ margin: '30px 0' }} />

      <h2>Pilih Jadwal Booking</h2>
      {field ? (
        <>
          <p>Lapangan: <strong>{field.name}</strong> - Rp {field.price_per_hour.toLocaleString()}/jam</p>
          <div style={{ display: 'flex', gap: '10px', margin: '20px 0', flexWrap: 'wrap' }}>
            {nextSevenDays.map(date => (
              <button key={date.toISOString()} onClick={() => setSelectedDate(date)} style={{ background: date.toDateString() === selectedDate.toDateString() ? 'royalblue' : '#eee', color: date.toDateString() === selectedDate.toDateString() ? 'white' : 'black', border: '1px solid #ccc', padding: '10px', borderRadius: '5px', cursor: 'pointer' }}>
                {date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
            {timeSlots.map(slot => (
              <button key={slot.time}
                onClick={() => handleBooking(slot.time)} // <-- HUBUNGKAN FUNGSI KE TOMBOL
                disabled={slot.status === 'Dipesan'}
                style={{ 
                  padding: '15px',
                  background: slot.status === 'Dipesan' ? '#f44336' : '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: slot.status === 'Dipesan' ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                }}>
                {slot.time} - {slot.status === 'Tersedia' ? 'Pesan Sekarang' : 'Dipesan'}
              </button>
            ))}
          </div>
        </>
      ) : <p>Venue ini belum memiliki lapangan yang bisa dibooking.</p>}
    </div>
  );
}