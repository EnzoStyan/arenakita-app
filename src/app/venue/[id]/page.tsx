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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800 transition-colors mb-6 inline-block">
          &larr; Kembali ke Daftar Venue
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-3 md:gap-12">
          {/* Kolom Kiri: Info Venue */}
          <div className="md:col-span-1 mb-8 md:mb-0">
            <h1 className="text-4xl font-bold text-gray-900">{venue.name}</h1>
            <p className="text-lg text-gray-500 mt-2">{venue.city}</p>
            <p className="text-md text-gray-600 mt-1">{venue.address}</p>
            <hr className="my-6" />
            <h3 className="text-xl font-semibold mb-2">Deskripsi</h3>
            <p className="text-gray-700">{venue.description}</p>
          </div>

          {/* Kolom Kanan: Jadwal Booking */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Pilih Jadwal Booking</h2>
            {field ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-lg mb-4">
                  Lapangan: <span className="font-semibold">{field.name}</span> - <span className="text-indigo-600 font-bold">Rp {field.price_per_hour.toLocaleString()}/jam</span>
                </p>
                
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {nextSevenDays.map(date => (
                    <button key={date.toISOString()} onClick={() => setSelectedDate(date)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${date.toDateString() === selectedDate.toDateString() ? 'bg-indigo-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                      {date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {timeSlots.map(slot => (
                    <button key={slot.time}
                      onClick={() => handleBooking(slot.time)}
                      disabled={slot.status === 'Dipesan'}
                      className="px-2 py-3 rounded-md text-white font-semibold transition-colors disabled:bg-red-400 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600"
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p>Venue ini belum memiliki lapangan yang bisa dibooking.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}