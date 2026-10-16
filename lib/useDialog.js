'use client';
import { useEffect, useRef } from 'react';

const BISA_FOKUS = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

// Dialog yang benar untuk keyboard dan pembaca layar: fokus masuk saat dibuka,
// Tab berputar di dalam dialog, Escape menutup, dan fokus kembali ke tempat semula
// (atau ke judul halaman bila elemen asalnya sudah hilang).
export function useDialog(buka, tutup) {
  const ref = useRef(null);
  const tutupRef = useRef(tutup);
  useEffect(() => { tutupRef.current = tutup; });

  useEffect(() => {
    if (!buka) return;
    // Elemen asal = yang terfokus sebelum dialog dibuka (body tidak dihitung).
    const asal = document.activeElement && document.activeElement !== document.body ? document.activeElement : null;
    const el = ref.current;
    const daftar = () => (el ? [...el.querySelectorAll(BISA_FOKUS)] : []);
    (daftar()[0] || el)?.focus();
    const tombol = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); tutupRef.current(); return; }
      if (e.key !== 'Tab') return;
      const f = daftar();
      if (!f.length) return;
      const awal = f[0], akhir = f[f.length - 1];
      if (e.shiftKey && document.activeElement === awal) { e.preventDefault(); akhir.focus(); }
      else if (!e.shiftKey && document.activeElement === akhir) { e.preventDefault(); awal.focus(); }
    };
    document.addEventListener('keydown', tombol);
    const html = document.documentElement;
    const luapan = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', tombol);
      html.style.overflow = luapan;
      // Elemen asal bisa sudah hilang atau nonaktif (mis. kursi yang baru dipesan menjadi "terisi").
      if (asal && asal.isConnected) asal.focus();
      if (!asal || document.activeElement !== asal) {
        const h1 = document.querySelector('main h1');
        if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus(); }
      }
    };
  }, [buka]);

  return ref;
}
