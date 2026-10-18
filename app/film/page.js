import Link from 'next/link';
import Image from 'next/image';
import { films } from '@/lib/data';
import { halaman } from '@/lib/seo';

export const metadata = halaman({
  judul: 'Film yang sedang tayang',
  deskripsi: 'Lima film yang sedang tayang di Bioskop Kelir: sinopsis, durasi, klasifikasi usia LSF, dan jam tayang hari biasa maupun akhir pekan.',
  path: '/film',
});

export default function FilmIndex() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Sedang tayang</h1>
      <p className="mt-2 text-white/75">Lima film bergantian di satu layar. Semua judul di sini fiktif.</p>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {films.map((f) => (
          <li key={f.id}>
            <Link href={`/film/${f.id}`} className="group flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-400/60">
              <Image src={f.poster} alt="" width={80} height={120} className="h-[7.5rem] w-20 shrink-0 rounded-lg bg-white/5 object-cover shadow-lg shadow-black/40 ring-1 ring-white/10" />
              <span className="min-w-0">
                <span className="block text-lg font-bold group-hover:text-amber-300">{f.title}</span>
                <span className="block text-xs text-white/75">{f.genre} · {f.durasi} menit · {f.klasifikasi}</span>
                <span className="mt-2 line-clamp-3 block text-sm text-white/85">{f.sinopsis}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
