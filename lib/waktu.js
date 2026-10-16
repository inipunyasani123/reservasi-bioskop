// Tanggal & jam dalam WIB (Asia/Jakarta). Tanggal disimpan sebagai 'YYYY-MM-DD'.
export function sekarangWIB() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
}
const dua = (n) => String(n).padStart(2, '0');
export const isoTanggal = (d) => `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}`;
export const keDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
export const tambahHari = (iso, n) => { const d = keDate(iso); d.setDate(d.getDate() + n); return isoTanggal(d); };
export const selisihHari = (a, b) => Math.round((keDate(b) - keDate(a)) / 86400000);
export const hariKe = (iso) => keDate(iso).getDay(); // 0 = Minggu
export const fmtTanggal = (iso, opsi = { weekday: 'long', day: 'numeric', month: 'long' }) => keDate(iso).toLocaleDateString('id-ID', opsi);
export const menit = (jam) => { const [h, m] = jam.split(/[:.]/).map(Number); return h * 60 + m; };
export const keJam = (m) => `${dua(Math.floor(m / 60))}:${dua(m % 60)}`;

// Slot sudah lewat bila tanggalnya sebelum hari ini, atau hari ini dan jamnya ≤ sekarang + jeda.
export function sudahLewat(iso, jam, jedaMenit = 0, now = sekarangWIB()) {
  const hari = isoTanggal(now);
  if (iso !== hari) return iso < hari;
  return menit(jam) <= now.getHours() * 60 + now.getMinutes() + jedaMenit;
}

// Angka semu 0..1 yang stabil untuk string yang sama — dipakai untuk keterisian contoh.
export function acak(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export const rupiah = (n) => 'Rp\u00a0' + Math.round(n).toLocaleString('id-ID'); // spasi tak-putus: "Rp" tidak terpisah dari angkanya
export const kodePesan = (awalan, s) => `${awalan}-${Math.floor(acak(s) * 9000 + 1000)}`;
