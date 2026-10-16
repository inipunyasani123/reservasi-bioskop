'use client';
import Link from 'next/link';
import { X } from 'lucide-react';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useHariIni } from '@/lib/useHariIni';
import { fmtTanggal, sudahLewat, selisihHari, rupiah } from '@/lib/waktu';
import { cinema } from '@/lib/data';

export default function DaftarTiket() {
  const [tiket, setTiket, loaded] = useLocalStorage('bioskopkelir.tiket', []);
  const { hari, sekarang } = useHariIni();
  if (!loaded || !hari) return <p className="py-16 text-center text-white/75">Memuat tiket…</p>;

  if (!tiket.length) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 p-10 text-center">
        <p className="text-xl font-bold">Belum ada tiket</p>
        <p className="mt-2 text-white/75">Tiket yang kamu simpan di peramban ini akan muncul di sini.</p>
        <Link href="/" className="mt-5 inline-block rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400">Pesan tiket</Link>
      </div>
    );
  }

  const urut = [...tiket].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const selesai = (t) => sudahLewat(t.date, t.selesai || t.time, 0, sekarang);
  const nanti = urut.filter((t) => !selesai(t));
  const lalu = urut.filter(selesai).reverse();
  const batal = (t) => {
    const mulai = sudahLewat(t.date, t.time, 60, sekarang);
    if (window.confirm(mulai ? 'Film mulai kurang dari satu jam lagi: di bioskop sungguhan tiket tidak bisa dibatalkan. Hapus dari daftar?' : 'Batalkan tiket ini?')) setTiket((p) => p.filter((x) => x.id !== t.id));
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby="h-nanti">
        <h2 id="h-nanti" className="text-xl font-bold">Akan ditonton ({nanti.length})</h2>
        {nanti.length === 0 ? <p className="mt-3 text-white/75">Tidak ada tiket yang akan datang.</p> : (
          <ul className="mt-4 space-y-4">
            {nanti.map((t) => {
              const h = selisihHari(hari, t.date);
              return (
                <li key={t.id} className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-white/10 to-white/5">
                  <div className="grid sm:grid-cols-[1fr_auto]">
                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">{h === 0 ? 'Hari ini' : h === 1 ? 'Besok' : `${h} hari lagi`}</p>
                      <p className="mt-1 text-2xl font-bold">{t.film} <span className="text-sm font-semibold text-white/75">{t.klasifikasi}</span></p>
                      <p className="mt-1 text-white/90">{fmtTanggal(t.date)} · {t.time}{t.selesai ? `–${t.selesai}` : ''}</p>
                      <p className="mt-3 text-sm text-white/75">Kursi</p>
                      <p className="flex flex-wrap gap-1.5">{t.seats.map((s) => <span key={s} className="rounded bg-amber-500 px-2 py-0.5 text-sm font-bold text-black">{s}</span>)}</p>
                    </div>
                    <div className="flex flex-col items-start justify-between gap-3 border-t border-dashed border-white/20 p-5 sm:items-end sm:border-l sm:border-t-0">
                      <div className="sm:text-right">
                        <p className="text-xs text-white/75">Kode tiket</p>
                        <p className="font-mono text-xl font-bold tracking-widest">{t.kode}</p>
                        <p className="mt-1 text-sm text-white/75">{t.name} · {rupiah(t.total)}</p>
                      </div>
                      <button type="button" onClick={() => batal(t)} className="-my-2 inline-flex items-center gap-1.5 py-2 text-sm font-semibold text-rose-300 hover:underline"><X size={15} aria-hidden="true" /> Batalkan</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-4 text-sm text-white/75">Pintu studio dibuka 15 menit sebelum film. {cinema.name} adalah purwarupa — kode di atas bukan tiket sungguhan.</p>
      </section>

      {lalu.length > 0 && (
        <section aria-labelledby="h-lalu">
          <h2 id="h-lalu" className="text-xl font-bold">Sudah ditonton</h2>
          <ul className="mt-4 divide-y divide-white/10 rounded-2xl border border-white/10">
            {lalu.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm text-white/80">
                <span>{t.film} · {fmtTanggal(t.date, { day: 'numeric', month: 'short' })}, {t.time} · {t.seats.join(', ')}</span>
                <button type="button" onClick={() => setTiket((p) => p.filter((x) => x.id !== t.id))} className="-my-2 py-2 font-semibold text-white hover:underline">Hapus</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
