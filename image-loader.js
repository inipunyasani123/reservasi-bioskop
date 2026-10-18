// Loader next/image untuk gambar statis: varian WebP di public/_img/ buatan skrip static-images (lihat
// image-manifest.json). Tidak memakai Image Optimization Vercel, jadi tidak terikat kuota bulanan.
// Lebar yang diminta selalu salah satu dari deviceSizes/imageSizes di next.config (= WIDTHS di bawah).
// Gambar di luar manifest (SVG, GIF, URL luar, impor statis) dikembalikan apa adanya.
import manifest from './image-manifest.json'

const WIDTHS = [64,128,256,384,640,828,1080,1280,1920]

export default function staticImageLoader({ src, width }) {
  const hash = manifest[src]
  if (!hash) return src
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1]
  const stem = src.slice("".length).replace(/\.(png|jpe?g|webp)$/i, '')
  return `/_img${stem}.${hash}-${w}.webp`
}
