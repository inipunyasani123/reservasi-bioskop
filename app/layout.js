import './globals.css';
import { Outfit } from 'next/font/google';
import Kepala from '@/components/Kepala';
import Kaki from '@/components/Kaki';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

const __jsonld = {"@context":"https://schema.org","@type":"WebSite","name":"Bioskop Kelir","description":"Bioskop satu layar dengan 96 kursi: lihat program tayang hari ini, pilih kursi langsung di denah studio, dan simpan tiketmu. Film dan bioskop fiktif.","url":"https://reservasi-bioskop.pintuweb.id","inLanguage":"id"};

export const metadata = {
  metadataBase: new URL("https://reservasi-bioskop.pintuweb.id"),
  title: { default: "Bioskop Kelir — Pesan tiket dan pilih kursi", template: "%s — Bioskop Kelir" },
  description: "Bioskop satu layar dengan 96 kursi: lihat program tayang hari ini, pilih kursi langsung di denah studio, dan simpan tiketmu. Film dan bioskop fiktif.",
  applicationName: "Bioskop Kelir",
  keywords: ["pesan tiket bioskop", "pilih kursi bioskop", "jadwal film", "bioskop satu layar"],
  authors: [{ name: "Bioskop Kelir" }],
  creator: "Bioskop Kelir",
  publisher: "Bioskop Kelir",
  alternates: { canonical: "https://reservasi-bioskop.pintuweb.id" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://reservasi-bioskop.pintuweb.id",
    siteName: "Bioskop Kelir",
    title: "Bioskop Kelir — Pesan tiket dan pilih kursi",
    description: "Bioskop satu layar dengan 96 kursi: lihat program tayang hari ini, pilih kursi langsung di denah studio, dan simpan tiketmu. Film dan bioskop fiktif.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Bioskop Kelir — Pesan tiket dan pilih kursi" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bioskop Kelir — Pesan tiket dan pilih kursi",
    description: "Bioskop satu layar dengan 96 kursi: lihat program tayang hari ini, pilih kursi langsung di denah studio, dan simpan tiketmu. Film dan bioskop fiktif.",
    images: ["/og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport = { themeColor: '#f59e0b' };

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body className="antialiased">
        <Kepala />
        {children}
        <Kaki />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(__jsonld) }} />
        <aside aria-label="Tentang situs demo ini" style={{ display: 'block', margin: 0, padding: '12px 16px', background: '#0f1b33', color: '#dfe6f3', font: '400 13px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', textAlign: 'center' }}>
          Situs demo buatan PintuWeb — nama dan isinya rekaan.{' '}
          <a href="https://www.pintuweb.id/kontak?demo=bioskop" style={{ color: '#ffffff', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>Buat yang seperti ini →</a>
        </aside>
        </body>
    </html>
  );
}
