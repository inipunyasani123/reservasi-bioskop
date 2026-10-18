'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, Clock } from 'lucide-react';
import { cinema, rows, cols, aisleAfter, programHari, hargaTiket, terisiContoh, getFilm } from '@/lib/data';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useHariIni } from '@/lib/useHariIni';
import { useDialog } from '@/lib/useDialog';
import { tambahHari, hariKe, fmtTanggal, sudahLewat, rupiah, kodePesan } from '@/lib/waktu';

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
// Denah: label baris, 6 kursi, lorong, 6 kursi. Kolom fleksibel supaya 12 kursi muat di layar ponsel.
const KOLOM = { gridTemplateColumns: `0.875rem repeat(${aisleAfter}, minmax(1.5rem, 1fr)) 0.5rem repeat(${cols - aisleAfter}, minmax(1.5rem, 1fr))` };

export default function BioskopApp() {
  const { hari, sekarang } = useHariIni(60);
  const [tiket, setTiket] = useLocalStorage('bioskopkelir.tiket', []);
  const [date, setDate] = useState(null);
  const [showId, setShowId] = useState(null);
  const [seats, setSeats] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [done, setDone] = useState(null);
  const dialog = useDialog(!!done, () => setDone(null));

  const lewat = (d, jam) => (sekarang ? sudahLewat(d, jam, 0, sekarang) : true);
  const hariPil = useMemo(() => (hari ? Array.from({ length: 5 }, (_, i) => tambahHari(hari, i)) : []), [hari]);
  const program = useMemo(() => (date ? programHari(date) : []), [date]);
  const show = program.find((p) => p.id === showId) || null;

  // Pilih hari & jam tayang pertama yang belum mulai; ?film= (dari halaman film) memilih jam tayang film itu.
  useEffect(() => {
    if (!hari || date) return;
    const ingin = new URLSearchParams(window.location.search).get('film');
    for (const d of Array.from({ length: 5 }, (_, i) => tambahHari(hari, i))) {
      const p = programHari(d).find((x) => !lewat(d, x.jam) && (!ingin || x.film.id === ingin));
      if (p) { setDate(d); setShowId(p.id); return; }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hari]);

  const pilihHari = (d) => {
    setDate(d); setSeats([]);
    const p = programHari(d).find((x) => !lewat(d, x.jam));
    setShowId(p ? p.id : null);
  };

  const takenSet = useMemo(() => {
    if (!show) return new Set();
    const s = terisiContoh(date, show.jam);
    tiket.filter((b) => b.date === date && b.time === show.jam).forEach((b) => b.seats.forEach((x) => s.add(x)));
    return s;
  }, [tiket, show, date]);

  const toggle = (id) => {
    if (takenSet.has(id)) return;
    setSeats((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= cinema.maksKursi ? p : [...p, id]));
  };

  const harga = date ? hargaTiket(date) : cinema.hargaBiasa;
  const total = seats.length * harga;
  const sisa = rows.length * cols - takenSet.size;

  const confirm = (e) => {
    e.preventDefault();
    if (!show || !seats.length || !form.name.trim() || !form.phone.trim()) return;
    const id = `b-${Date.now()}`;
    const t = { id, kode: kodePesan('BK', id), filmId: show.film.id, film: show.film.title, klasifikasi: show.film.klasifikasi, date, time: show.jam, selesai: show.selesai, seats: [...seats].sort(), total, name: form.name, dibuat: new Date().toISOString() };
    setTiket((p) => [...p, t]);
    setDone(t);
    setSeats([]);
    setForm({ name: '', phone: '' });
  };

  return (
    <div className={show && seats.length ? 'pb-56' : 'pb-10'}>
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-3xl font-bold">Pesan tiket</h1>
        <p className="mt-1 text-white/75">Satu studio, satu film dalam satu waktu. Tiket {rupiah(cinema.hargaBiasa)} Senin–Kamis, {rupiah(cinema.hargaAkhirPekan)} Jumat–Minggu.</p>

        <section aria-labelledby="h-hari" className="mt-6">
          <h2 id="h-hari" className="sr-only">Tanggal</h2>
          {/* Kerangka seukuran isi aslinya: tanggal WIB baru diketahui di peramban, jadi tata letak tidak bergeser. */}
          {!hari ? (
            <div className="grid grid-cols-5 gap-2 sm:flex" role="status">
              <span className="sr-only">Memuat jadwal…</span>
              {Array.from({ length: 5 }, (_, i) => <span key={i} className="min-h-14 rounded-lg border border-white/10 bg-white/5 sm:w-20" aria-hidden="true" />)}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2 sm:flex">
              {hariPil.map((d, i) => {
                const habis = programHari(d).every((p) => lewat(d, p.jam));
                return (
                  <button key={d} type="button" disabled={habis} onClick={() => pilihHari(d)} aria-pressed={date === d}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-lg border px-1 py-1.5 transition disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-20 sm:px-4 ${date === d ? 'border-amber-500 bg-amber-500 text-black' : 'border-white/20 bg-white/5 text-white/90 hover:border-amber-400'}`}>
                    <span className="text-[11px] font-semibold uppercase tracking-wide">{i === 0 ? 'Hari ini' : i === 1 ? 'Besok' : HARI[hariKe(d)]}</span>{' '}
                    <span className="text-lg font-bold leading-tight">{Number(d.slice(8))}</span>
                    <span className="sr-only"> {fmtTanggal(d, { month: 'long' })}{habis ? ', semua jam tayang sudah lewat' : ''}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="h-program" className="mt-6">
          <h2 id="h-program" className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Program {date ? fmtTanggal(date, { weekday: 'long', day: 'numeric', month: 'long' }) : ''}</h2>
          <ul className="mt-3 space-y-2">
            {!date && Array.from({ length: 5 }, (_, i) => <li key={i} className="h-[4.625rem] rounded-xl border border-white/10 bg-white/5" aria-hidden="true" />)}
            {program.map((p) => {
              const habis = lewat(date, p.jam); const aktif = showId === p.id;
              return (
                <li key={p.id}>
                  <button type="button" disabled={habis} onClick={() => { setShowId(p.id); setSeats([]); }} aria-pressed={aktif}
                    className={`flex w-full items-center gap-4 overflow-hidden rounded-xl border text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${aktif ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30' : 'border-white/10 bg-white/5 hover:border-white/30'}`}>
                    <span className="relative h-[4.5rem] w-12 shrink-0 bg-white/5">
                      <Image src={p.film.poster} alt="" width={48} height={72} className="h-full w-full object-cover" />
                      <span className="absolute inset-x-0 bottom-1 flex justify-center text-[10px] font-bold"><span className="rounded bg-black/75 px-1 py-px">{p.film.klasifikasi}</span></span>
                    </span>
                    <span className="w-24 shrink-0 font-mono text-lg font-bold">{p.jam}<span className="block text-[11px] font-normal text-white/75">s.d. {p.selesai}</span></span>
                    <span className="min-w-0 flex-1 py-2 pr-3">
                      <span className="block truncate font-semibold">{p.film.title}</span>
                      <span className="block text-xs text-white/75">{p.film.genre} · {p.film.durasi} menit{habis ? ' · sudah mulai' : ''}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!date && <span className="mt-2 block h-8" aria-hidden="true" />}
          {show && <Link href={`/film/${show.film.id}`} className="mt-2 inline-block py-1.5 text-sm font-semibold text-amber-300 underline-offset-4 hover:underline">Sinopsis {show.film.title}</Link>}
        </section>

        {!date && <div className="mt-10 h-[360px] rounded-2xl border border-white/5 bg-white/[0.02] sm:h-[442px]" aria-hidden="true" />}
        {show && (
          <section aria-labelledby="h-kursi" className="mt-10">
            <h2 id="h-kursi" className="sr-only">Pilih kursi</h2>
            <div className="relative mx-auto w-3/4" aria-hidden="true">
              <div className="h-2 w-full rounded-full bg-gradient-to-r from-amber-400/10 via-amber-400 to-amber-400/10 shadow-[0_4px_30px_rgba(245,158,11,0.55)]" />
              <div className="absolute left-1/2 top-2 h-12 w-4/5 -translate-x-1/2 rounded-full bg-amber-400/20 blur-2xl" />
            </div>
            <p className="mb-8 mt-4 text-center text-[11px] uppercase tracking-[0.35em] text-amber-200">Layar · {sisa} kursi tersisa</p>

            <div className="-mx-1 overflow-x-auto px-1 pb-2">
              <div className="mx-auto w-full max-w-[30rem] space-y-[3px] sm:space-y-1.5">
                {rows.map((r) => (
                  <div key={r} role="group" aria-label={`Baris ${r}`} className="grid items-center gap-[3px] sm:gap-1.5" style={KOLOM}>
                    <span className="text-center text-[11px] font-bold text-white/75" aria-hidden="true">{r}</span>
                    {Array.from({ length: cols }, (_, i) => i + 1).map((c) => {
                      const id = `${r}${c}`;
                      const taken = takenSet.has(id);
                      const sel = seats.includes(id);
                      return [
                        c === aisleAfter + 1 ? <span key={`lorong-${r}`} aria-hidden="true" /> : null,
                        <button key={id} type="button" disabled={taken} onClick={() => toggle(id)} aria-pressed={sel}
                          className={`flex aspect-square w-full items-center justify-center rounded-md rounded-b-sm text-[10px] font-bold transition sm:text-[11px] ${
                            sel ? 'bg-amber-500 text-black' : taken ? 'cursor-not-allowed bg-white/10 text-white/30' : 'bg-white/20 text-white/90 hover:bg-amber-400/50'
                          }`}>
                          <span className="sr-only">Kursi {r}</span>{c}<span className="sr-only">{taken ? ', terisi' : ''}</span>
                        </button>,
                      ];
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mx-auto mt-6 flex w-max max-w-full flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs text-white/80">
              <Legend className="bg-white/20" label="Kosong" />
              <Legend className="bg-amber-500" label="Pilihanmu" />
              <Legend className="bg-white/10" label="Terisi" />
            </div>
            {seats.length >= cinema.maksKursi && <p className="mt-3 text-center text-sm text-amber-200">Maksimal {cinema.maksKursi} kursi per transaksi.</p>}
          </section>
        )}
      </main>

      {show && seats.length > 0 && (
          <form onSubmit={confirm} aria-label="Data pemesan dan simpan tiket"
            className="anim-bawah fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#11101c]/95 backdrop-blur">
            <div className="mx-auto max-w-3xl px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xs text-white/75">{seats.length} kursi · {show.film.title} · {fmtTanggal(date, { weekday: 'short', day: 'numeric', month: 'short' })} {show.jam}</p>
                  <p className="mt-0.5 flex flex-wrap gap-1">
                    {[...seats].sort().map((s) => <span key={s} className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[11px] font-bold text-amber-200">{s}</span>)}
                  </p>
                </div>
                <p className="shrink-0 font-bold text-amber-300">{rupiah(total)}</p>
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label className="w-full"><span className="sr-only">Nama</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama" autoComplete="name" required
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/60 focus:border-amber-400" /></label>
                <label className="w-full"><span className="sr-only">Nomor HP</span><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Nomor HP" autoComplete="tel" required
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/60 focus:border-amber-400" /></label>
                <button type="submit" className="shrink-0 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-bold text-black transition hover:bg-amber-400">Simpan tiket</button>
              </div>
              <p className="mt-2 text-center text-[11px] text-white/70">Purwarupa: tanpa pembayaran, tiket disimpan di peramban ini.</p>
            </div>
          </form>
      )}

      {done && (
          <div className="anim-pudar fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5" onClick={() => setDone(null)}>
            <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="judul-selesai" onClick={(e) => e.stopPropagation()} className="anim-skala w-full max-w-sm overflow-hidden rounded-2xl bg-[#15131f] text-left shadow-2xl outline-none ring-1 ring-white/10">
              {/* Tiket bersobekan: badan tiket di atas, potongan kode di bawah garis sobek */}
              <div className={`h-1.5 bg-gradient-to-r ${getFilm(done.filmId)?.color || 'from-amber-400 to-amber-600'}`} aria-hidden="true" />
              <div className="flex gap-4 px-6 pb-5 pt-6">
                <span className="relative h-[5.25rem] w-14 shrink-0 overflow-hidden rounded-lg bg-white/5" aria-hidden="true">
                  {getFilm(done.filmId) && <Image src={getFilm(done.filmId).poster} alt="" width={56} height={84} className="h-full w-full object-cover" />}
                  <span className="absolute inset-x-0 bottom-1.5 flex justify-center text-[10px] font-bold"><span className="rounded bg-black/75 px-1.5 py-0.5">{done.klasifikasi}</span></span>
                </span>
                <div className="min-w-0">
                  <h2 id="judul-selesai">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-300"><Check size={13} aria-hidden="true" /> Tiket tersimpan</span>
                    <span className="mt-1 block text-2xl font-bold leading-tight">{done.film}</span>
                  </h2>
                  <p className="mt-1 text-sm text-white/75">{fmtTanggal(done.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-3 px-6 pb-5 text-sm">
                <div><dt className="text-[11px] uppercase tracking-wide text-white/70">Kursi</dt><dd className="mt-0.5 font-bold text-amber-300">{done.seats.join(', ')}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-wide text-white/70">Jam</dt><dd className="mt-0.5 font-mono font-bold">{done.time}</dd></div>
                <div><dt className="text-[11px] uppercase tracking-wide text-white/70">Total</dt><dd className="mt-0.5 font-bold">{rupiah(done.total)}</dd></div>
              </dl>
              <div className="relative border-t-2 border-dashed border-white/15" aria-hidden="true">
                <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#040406]" />
                <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#040406]" />
              </div>
              <div className="px-6 pb-6 pt-5">
                <div className="flex items-end justify-between gap-3">
                  <div><p className="text-[11px] uppercase tracking-wide text-white/70">Kode tiket</p><p className="font-mono text-2xl font-bold tracking-widest">{done.kode}</p></div>
                  <p className="text-right text-sm text-white/75">atas nama<br /><span className="font-semibold text-white">{done.name}</span></p>
                </div>
                <p className="mt-4 flex items-start gap-1.5 text-xs text-white/75"><Clock size={13} className="mt-0.5 shrink-0" aria-hidden="true" /> Pintu studio dibuka 15 menit sebelum film. Purwarupa: tanpa pembayaran, tiket hanya tersimpan di peramban ini.</p>
                <div className="mt-5 grid grid-cols-2 gap-2 text-center">
                  <Link href="/tiket" className="rounded-xl bg-amber-500 py-3 text-sm font-bold text-black hover:bg-amber-400">Tiket saya</Link>
                  <button type="button" onClick={() => setDone(null)} className="rounded-xl border border-white/20 py-3 text-sm font-semibold text-white/90 hover:bg-white/5">Tutup</button>
                </div>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}

function Legend({ className, label }) {
  return <span className="flex items-center gap-1.5"><span className={`h-4 w-4 rounded-md rounded-b-sm ${className}`} aria-hidden="true" /> {label}</span>;
}
