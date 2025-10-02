// src/app/page.tsx
'use client'

import AuthManager from "@/components/AuthManager";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";
import Link from 'next/link';

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
      const { data, error } = await supabase
        .from('venues')
        .select('id, name, city, description')
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
    <div className="min-h-screen bg-gray-50">
      <AuthManager />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-10">
          Temukan Lapangan Olahraga Pilihanmu
        </h1>
        
        {loading ? (
          <p className="text-center text-gray-500">Memuat venue...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.length > 0 ? (
              venues.map((venue) => (
                <Link key={venue.id} href={`/venue/${venue.id}`} className="group">
                  <div className="bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col group-hover:shadow-xl transition-shadow duration-300">
                    {/* Di sini nanti kita bisa tambahkan gambar venue */}
                    <div className="p-6 flex-grow">
                      <p className="text-sm font-semibold text-indigo-600 mb-1">{venue.city}</p>
                      <h2 className="text-xl font-bold text-gray-900 mb-2">{venue.name}</h2>
                      <p className="text-gray-600 text-base line-clamp-3">
                        {venue.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-500 sm:col-span-2 lg:col-span-3">
                Belum ada venue yang tersedia.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}