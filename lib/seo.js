import { cinema as situs } from '@/lib/data';

// Deskripsi dipotong di batas kata supaya tetap ≤155 karakter di hasil pencarian.
export function ringkas(teks, maks = 155) {
  const t = teks.replace(/\s+/g, ' ').trim();
  if (t.length <= maks) return t;
  const potong = t.slice(0, maks - 1);
  return potong.slice(0, potong.lastIndexOf(' ')).replace(/[\s,;:.—–-]+$/, '') + '…';
}

// Metadata satu halaman: judul, deskripsi, canonical, Open Graph, dan kartu X
// selalu milik halaman itu sendiri (tidak mewarisi milik beranda).
export function halaman({ judul, deskripsi, path = '/', gambar, alt, robots }) {
  const url = situs.url + (path === '/' ? '' : path);
  const lengkap = `${judul} — ${situs.name}`;
  const isi = ringkas(deskripsi);
  const images = gambar
    ? [{ url: gambar, alt: alt || judul }]
    : [{ url: '/og.jpg', width: 1200, height: 630, alt: lengkap }];
  return {
    title: judul,
    description: isi,
    alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'id_ID', siteName: situs.name, url, title: lengkap, description: isi, images },
    twitter: { card: 'summary_large_image', title: lengkap, description: isi, images: images.map((i) => i.url) },
    ...(robots ? { robots } : {}),
  };
}
