import DaftarTiket from '@/components/DaftarTiket';
import { halaman } from '@/lib/seo';

export const metadata = halaman({
  judul: 'Tiket saya',
  deskripsi: 'Tiket Bioskop Kelir yang tersimpan di peramban ini: film, jam tayang, kursi, dan kode tiket.',
  path: '/tiket',
  robots: { index: false, follow: true },
});

export default function TiketPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-3xl font-bold md:text-4xl">Tiket saya</h1>
      <p className="mt-2 text-white/75">Tersimpan di peramban ini saja.</p>
      <div className="mt-8"><DaftarTiket /></div>
    </main>
  );
}
