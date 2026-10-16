import Link from 'next/link';
import { cinema, films } from '@/lib/data';
import { rupiah } from '@/lib/waktu';

export default function Kaki() {
  return (
    <footer className="border-t border-white/10 bg-black/40">
      <div className="mx-auto grid max-w-3xl gap-8 px-5 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold">{cinema.name}</p>
          <p className="mt-2 text-sm text-white/75">{cinema.tagline}. Pintu studio dibuka 15 menit sebelum film.</p>
        </div>
        <div className="text-sm text-white/75">
          <p className="font-semibold text-white">Harga tiket</p>
          <p className="mt-2">Senin–Kamis {rupiah(cinema.hargaBiasa)}</p>
          <p>Jumat–Minggu {rupiah(cinema.hargaAkhirPekan)}</p>
        </div>
        <nav aria-label="Film" className="text-sm">
          <p className="font-semibold text-white">Sedang tayang</p>
          <ul className="mt-1.5 space-y-0.5">{films.map((f) => <li key={f.id}><Link href={`/film/${f.id}`} className="inline-block py-1 text-white/75 underline-offset-4 hover:text-amber-300 hover:underline">{f.title}</Link></li>)}</ul>
        </nav>
      </div>
      <p className="border-t border-white/10 px-5 py-4 text-center text-xs text-white/75">Purwarupa desain: bioskop dan film fiktif. Tiket hanya disimpan di peramban ini.</p>
    </footer>
  );
}
