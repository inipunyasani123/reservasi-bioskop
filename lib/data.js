// Bioskop Kelir — bioskop satu layar fiktif untuk purwarupa pemesanan kursi.
import { acak, hariKe, menit, keJam } from './waktu';

export const cinema = {
  name: 'Bioskop Kelir',
  tagline: 'Satu layar, sembilan puluh enam kursi',
  url: 'https://reservasi-bioskop.pintuweb.id',
  hargaBiasa: 40000, // Senin–Kamis
  hargaAkhirPekan: 50000, // Jumat–Minggu
  maksKursi: 8,
};

export const nav = [
  { href: '/', label: 'Pesan tiket' },
  { href: '/film', label: 'Film' },
  { href: '/tiket', label: 'Tiket saya' },
];

// Film fiktif. klasifikasi mengikuti penggolongan usia LSF: SU, 13+, 17+.
// poster: ilustrasi buatan sendiri 800x1200 (2:3), dibuat ulang dengan scripts/ilustrasi/poster.mjs.
export const films = [
  {
    id: 'gerhana-terakhir', title: 'Gerhana Terakhir', genre: 'Fiksi ilmiah', durasi: 134, klasifikasi: '13+', sutradara: 'Rendra Halim',
    color: 'from-amber-500 to-orange-700',
    poster: '/images/poster/gerhana-terakhir.webp', posterAlt: 'Poster Gerhana Terakhir: gerhana matahari total di atas observatorium kecil di lereng gunung, seorang teknisi menatap langit',
    sinopsis: 'Seorang teknisi observatorium di lereng gunung menemukan bahwa gerhana yang akan datang datang tiga hari lebih cepat dari hitungan. Ia punya satu malam untuk meyakinkan siapa pun yang mau mendengar.',
  },
  {
    id: 'senandung-hujan', title: 'Senandung Hujan', genre: 'Drama', durasi: 112, klasifikasi: 'SU', sutradara: 'Ayu Prameswari',
    color: 'from-sky-500 to-indigo-700',
    poster: '/images/poster/senandung-hujan.webp', posterAlt: 'Poster Senandung Hujan: kakak beradik berpayung menatap rumah berjendela terang di tengah hujan, pita kaset terurai dari langit',
    sinopsis: 'Dua kakak beradik kembali ke rumah masa kecil di kota kecil yang selalu hujan, untuk mengosongkannya sebelum dijual — dan menemukan kaset-kaset rekaman ibu mereka.',
  },
  {
    id: 'jejak-di-rimba', title: 'Jejak di Rimba', genre: 'Petualangan', durasi: 125, klasifikasi: '13+', sutradara: 'Bima Sasongko',
    color: 'from-emerald-500 to-teal-700',
    poster: '/images/poster/jejak-di-rimba.webp', posterAlt: 'Poster Jejak di Rimba: tiga penjelajah berlampu kepala menyusuri jalan setapak di hutan hujan yang lebat',
    sinopsis: 'Tim pemetaan kecil tersesat di hutan hujan setelah alat navigasi mereka mati. Satu-satunya petunjuk: catatan harian penjelajah yang hilang empat puluh tahun lalu.',
  },
  {
    id: 'kunci-lantai-tiga', title: 'Kunci Lantai Tiga', genre: 'Horor', durasi: 98, klasifikasi: '17+', sutradara: 'Dewi Kartika',
    color: 'from-rose-600 to-stone-900',
    poster: '/images/poster/kunci-lantai-tiga.webp', posterAlt: 'Poster Kunci Lantai Tiga: rumah susun tua pada malam hari, satu pintu di lantai tiga menyala merah, kunci berlabel 3 tergantung',
    sinopsis: 'Penjaga malam rumah susun tua diberi satu aturan: jangan pernah membuka pintu di lantai tiga. Malam ini, seseorang mengetuk dari dalam.',
  },
  {
    id: 'kancil-pulang', title: 'Kancil Pulang Kampung', genre: 'Animasi keluarga', durasi: 85, klasifikasi: 'SU', sutradara: 'Galih Pratama',
    color: 'from-lime-400 to-green-700',
    poster: '/images/poster/kancil-pulang.webp', posterAlt: 'Poster Kancil Pulang Kampung: kancil membawa buntelan batik menatap buaya yang berjaga di jembatan bambu',
    sinopsis: 'Si Kancil ingin pulang untuk hari raya, tapi jembatan satu-satunya dijaga buaya yang masih ingat tipu dayanya tahun lalu.',
  },
];
export const getFilm = (id) => films.find((f) => f.id === id);

// Program harian satu layar: jam tayang tidak boleh tumpang-tindih.
const PROGRAM = [
  { jam: '12:30', film: 'gerhana-terakhir' },
  { jam: '15:00', film: 'senandung-hujan' },
  { jam: '17:15', film: 'jejak-di-rimba' },
  { jam: '19:45', film: 'gerhana-terakhir' },
  { jam: '22:15', film: 'kunci-lantai-tiga' },
];
const PAGI_AKHIR_PEKAN = { jam: '10:15', film: 'kancil-pulang' };

export const akhirPekan = (tanggal) => [0, 5, 6].includes(hariKe(tanggal));
export const hargaTiket = (tanggal) => (akhirPekan(tanggal) ? cinema.hargaAkhirPekan : cinema.hargaBiasa);

export function programHari(tanggal) {
  const daftar = [0, 6].includes(hariKe(tanggal)) ? [PAGI_AKHIR_PEKAN, ...PROGRAM] : PROGRAM;
  return daftar.map((p) => {
    const f = getFilm(p.film);
    return { id: `${tanggal}|${p.jam}`, jam: p.jam, selesai: keJam(menit(p.jam) + f.durasi), film: f };
  });
}

export const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const cols = 12; // 1..12, lorong setelah kolom 6
export const aisleAfter = 6;

// Kursi yang sudah dibeli penonton lain (contoh) — stabil per tanggal & jam tayang.
export function terisiContoh(tanggal, jam) {
  const malam = jam >= '19:00';
  const p = 0.15 + (malam ? 0.2 : 0) + (akhirPekan(tanggal) ? 0.15 : 0);
  const s = new Set();
  for (const r of rows) for (let c = 1; c <= cols; c++) {
    // Baris tengah (D–F) lebih cepat terisi.
    const bonus = 'DEF'.includes(r) ? 0.12 : 0;
    if (acak(`${tanggal}|${jam}|${r}${c}`) < p + bonus) s.add(`${r}${c}`);
  }
  return s;
}
