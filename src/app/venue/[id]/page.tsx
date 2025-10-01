// src/app/venue/[id]/page.tsx
'use client'

import { supabase } from "@/lib/supabaseClient"
import { useEffect, useState } from "react"
import Link from 'next/link'
import { useParams } from "next/navigation"

// Definisikan tipe untuk data Venue tunggal
type Venue = {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  // Tambahkan properti lain jika perlu di masa depan (misal: gambar, fasilitas)
};

// 'params' akan berisi ID dari URL, contoh: { id: 'uuid-acara-bla-bla' }
export default function VenueDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      // Ambil data dari tabel 'venues' berdasarkan ID dari URL
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id)
        .single(); // .single() untuk mengambil satu baris data saja

      if (error) {
        console.error('Error fetching venue details:', error);
      } else {
        setVenue(data);
      }
      setLoading(false);
    };

    if (params.id) {
      fetchVenueDetails();
    }
  }, [id]);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>Memuat detail venue...</p>;
  }

  if (!venue) {
    return <p style={{ textAlign: 'center', padding: '40px' }}>Venue tidak ditemukan.</p>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: 'auto' }}>
      <Link href="/" style={{ marginBottom: '20px', display: 'inline-block' }}>
        &larr; Kembali ke Daftar Venue
      </Link>
      <h1>{venue.name}</h1>
      <p><strong>Kota:</strong> {venue.city}</p>
      <p><strong>Alamat:</strong> {venue.address}</p>
      <hr style={{ margin: '20px 0' }} />
      <h3>Deskripsi</h3>
      <p>{venue.description}</p>
      {/* Di sinilah nanti kita akan meletakkan sistem booking dan jadwal */}
    </div>
  );
}