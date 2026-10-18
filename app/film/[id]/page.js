import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { films, getFilm, programHari, cinema } from '@/lib/data';
import { rupiah } from '@/lib/waktu';
import { halaman } from '@/lib/seo';

export function generateStaticParams() {
  return films.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const f = getFilm(id);
  if (!f) return { title: 'Film tidak ditemukan' };
  return halaman({ judul: f.title, deskripsi: `${f.genre}, ${f.durasi} menit, ${f.klasifikasi}. ${f.sinopsis}`, path: `/film/${f.id}` });
}

const KET = { SU: 'Semua umur', '13+': 'Usia 13 tahun ke atas', '17+': 'Usia 17 tahun ke atas' };
// Satu Senin dan satu Sabtu sebagai contoh program hari biasa dan akhir pekan.
const SENIN = '2026-01-05';
const SABTU = '2026-01-10';

export default async function FilmPage({ params }) {
  const { id } = await params;
  const f = getFilm(id);
  if (!f) notFound();
  const biasa = programHari(SENIN).filter((p) => p.film.id === f.id).map((p) => p.jam);
  const pekan = programHari(SABTU).filter((p) => p.film.id === f.id).map((p) => p.jam);

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <Link href="/film" className="-my-2 inline-flex items-center gap-1 py-2 text-sm font-semibold text-white/80 hover:text-amber-300"><ArrowLeft size={15} aria-hidden="true" /> Semua film</Link>
      <div className="mt-6 grid gap-8 sm:grid-cols-[220px_1fr]">
        <Image src={f.poster} alt={f.posterAlt} width={800} height={1200} priority fetchPriority="high" sizes="(min-width: 640px) 220px, 352px"
          className="mx-auto aspect-[2/3] h-auto w-full max-w-[22rem] rounded-2xl bg-white/5 object-cover shadow-2xl shadow-black/60 ring-1 ring-white/10" />
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">{f.genre}</p>
          <h1 className="mt-2 text-4xl font-bold">{f.title}</h1>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-white/75">Durasi</dt><dd className="font-semibold">{f.durasi} menit</dd></div>
            <div><dt className="text-white/75">Klasifikasi</dt><dd className="font-semibold">{f.klasifikasi} · {KET[f.klasifikasi]}</dd></div>
            <div><dt className="text-white/75">Sutradara</dt><dd className="font-semibold">{f.sutradara}</dd></div>
          </dl>
          <p className="mt-6 leading-relaxed text-white/90">{f.sinopsis}</p>
          <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Jam tayang</h2>
          <p className="mt-2 text-white/90">{biasa.length ? `Setiap hari pukul ${biasa.join(' dan ')}` : `Sabtu dan Minggu pukul ${pekan.join(', ')}`}</p>
          <p className="mt-1 text-sm text-white/75">Tiket {rupiah(cinema.hargaBiasa)} Senin–Kamis, {rupiah(cinema.hargaAkhirPekan)} Jumat–Minggu.</p>
          <Link href={`/?film=${f.id}`} className="mt-6 inline-block rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400">Pilih kursi</Link>
        </div>
      </div>
    </main>
  );
}
