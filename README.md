# Bioskop Kelir — Pesan tiket dan pilih kursi

Bioskop satu layar (fiktif) dengan 96 kursi. Paradigma **peta kursi**: pilih hari dan jam tayang dari program harian, lalu kursi di denah studio.

**Demo live:** https://reservasi-bioskop.vercel.app

![Tangkapan layar](public/og.jpg)

> Purwarupa desain. Nama usaha, data, dan harga fiktif. Tidak ada pembayaran dan tidak ada yang dikirim ke server: pemesanan disimpan di `localStorage` peramban. Tanggal dan jam dihitung dalam WIB di peramban; keterisian contoh dibuat stabil per tanggal.

## Fitur

- Program harian tanpa jam tumpang-tindih (satu layar), pertunjukan pagi film keluarga di akhir pekan.
- Harga Senin–Kamis dan Jumat–Minggu; maksimal 8 kursi per transaksi.
- `/film` dan `/film/[id]` — sinopsis, durasi, klasifikasi usia LSF, jam tayang.
- `/tiket` — tiket saya bergaya e-ticket dengan kode.

## Halaman

`/` · `/film` · `/film/[id]` · `/tiket`

## Teknologi

- Next.js 15.5 (App Router) dan React 19
- Tailwind CSS v4
- JavaScript
- Framer Motion, Lucide (ikon)
- Font: Outfit (next/font)
- SEO: metadata per halaman, Open Graph, sitemap.xml, dan robots.txt

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000. Untuk build produksi: `npm run build` lalu `npm start`.

---

Bagian dari koleksi 5 aplikasi reservasi di [PortalReservasi](https://www.pintuweb.id/website-reservasi). Dibuat oleh [PintuWeb](https://www.pintuweb.id), jasa pembuatan website.
