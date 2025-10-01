// src/app/page.tsx
'use client'

import AuthManager from "@/components/AuthManager";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Link from 'next/link';

// Definisikan tipe untuk data Venue yang akan ditampilkan
type Venue = {
  id: string;
  name: string;
  city: string;
  description: string;
};

export default function Home() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovedVenues = async () => {
      // Ambil data dari tabel 'venues' yang statusnya 'approved'
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, city, description') // Hanya ambil kolom yg perlu
        .eq('status', 'approved');

      if (error) {
        console.error('Error fetching venues:', error);
      } else {
        setVenues(data);
      }
      setLoading(false);
    };

    fetchApprovedVenues();
  }, []);

  return (
    <div>
      <AuthManager />
      <main style={{ padding: '40px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Temukan Lapangan Olahraga Pilihanmu</h1>
        
        {loading ? (
          <p style={{ textAlign: 'center' }}>Memuat venue...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {venues.length > 0 ? (
              venues.map((venue) => (
              <Link key={venue.id} href={`/venue/${venue.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px', height: '100%' }}>
                  <h2 style={{ marginTop: '0' }}>{venue.name}</h2>
                  <p><strong>Kota:</strong> {venue.city}</p>
                  <p>{venue.description}</p>
                </div>
              </Link>
              ))
            ) : (
              <p style={{ textAlign: 'center' }}>Belum ada venue yang tersedia.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}