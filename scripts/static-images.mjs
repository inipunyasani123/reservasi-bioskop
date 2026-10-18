// Gambar statis tanpa kuota Image Optimization Vercel.
// Membuat varian WebP (beberapa lebar) untuk gambar raster di public/, menulis image-manifest.json, dan menyalin
// image-loader.js ke akar proyek. Gambar asli TIDAK diubah (varian ditulis ke public/_img/).
//
// Pemakaian (dari akar proyek):
//   node scripts/static-images.mjs . [--base /path-portal] [--dirs public/images,public/foo] [--check]
// (PintuWeb: node scripts/static-images.mjs . --dirs public/images)
// Lalu di next.config.* proyek itu:
//   images: { loader: 'custom', loaderFile: './image-loader.js', deviceSizes: [640, 828, 1080, 1280, 1920], imageSizes: [64, 128, 256, 384] }
//   headers(): { source: '/_img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }
// --base untuk portal multi-zone (basePath): src next/image di sana sudah berawalan basePath, jadi kunci manifest ikut.
// --check: hanya melaporkan gambar yang belum punya varian / varian basi, tanpa menulis apa pun.
// Jalankan ulang setiap menambah/mengganti gambar (varian lama untuk gambar yang sama dibersihkan otomatis).
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'

const WIDTHS = [64, 128, 256, 384, 640, 828, 1080, 1280, 1920]
const QUALITY = 78
const args = process.argv.slice(2)
const proj = path.resolve(args[0] || '.')
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null }
const base = (opt('--base') || '').replace(/\/$/, '')
const check = args.includes('--check')
const dirs = (opt('--dirs') || 'public').split(',').map((d) => path.join(proj, d))
// favicon, ikon aplikasi, dan gambar OG dipakai lewat <link>/<meta>, bukan next/image: dilewati
const SKIP = /(^|\/)(favicon|apple-touch-icon|icon-\d|icon-maskable|android-chrome|mstile|safari-pinned|og(-[\w-]+)?\.(png|jpe?g|webp)$|opengraph|twitter-image)|(^|\/)_img\//i

const req = createRequire(path.join(proj, 'package.json'))
let sharp
try { sharp = req('sharp') } catch {
  // cadangan: sharp dari PintuWeb (ikut terpasang bersama next)
  sharp = createRequire('/Users/arya/Developer/NextJS/PintuWeb/package.json')('sharp')
}

function walk(d, out = []) {
  if (!existsSync(d)) return out
  for (const f of readdirSync(d)) {
    const p = path.join(d, f)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(png|jpe?g|webp)$/i.test(f)) out.push(p)
  }
  return out
}

const pub = path.join(proj, 'public')
const files = [...new Set(dirs.flatMap((d) => walk(d)))].filter((f) => !SKIP.test(path.relative(pub, f).split(path.sep).join('/')))
const manifest = {}
let made = 0, kept = 0, removed = 0
const todo = []
for (const f of files) {
  const rel = '/' + path.relative(pub, f).split(path.sep).join('/') // "/images/galeri/toko.jpg"
  const hash = createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 8)
  manifest[base + rel] = hash
  const stem = rel.replace(/\.(png|jpe?g|webp)$/i, '')
  const outDir = path.join(pub, '_img', path.dirname(stem))
  const name = path.basename(stem)
  if (existsSync(outDir)) {
    // varian basi (hash lama) untuk gambar yang sama
    for (const g of readdirSync(outDir)) {
      const m = g.match(/^(.*)\.([0-9a-f]{8})-(\d+)\.webp$/)
      if (m && m[1] === name && m[2] !== hash) { if (!check) unlinkSync(path.join(outDir, g)); removed++ }
    }
  }
  for (const w of WIDTHS) {
    const out = path.join(outDir, `${name}.${hash}-${w}.webp`)
    if (existsSync(out)) { kept++; continue }
    todo.push({ f, out, w })
  }
}
if (check) {
  console.log(`${files.length} gambar · ${todo.length} varian belum ada · ${removed} varian basi`)
  process.exit(todo.length || removed ? 1 : 0)
}
for (const { f, out, w } of todo) {
  mkdirSync(path.dirname(out), { recursive: true })
  // tanpa pembesaran: gambar yang lebih kecil dari w tetap di ukuran aslinya (nama file tetap -w supaya loader sederhana)
  await sharp(f, { animated: false }).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 5 }).toFile(out)
  made++
}
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(path.join(proj, 'image-manifest.json'), JSON.stringify(sorted, null, 1) + '\n')
writeFileSync(path.join(proj, 'image-loader.js'), `// Loader next/image untuk gambar statis: varian WebP di public/_img/ buatan skrip static-images (lihat
// image-manifest.json). Tidak memakai Image Optimization Vercel, jadi tidak terikat kuota bulanan.
// Lebar yang diminta selalu salah satu dari deviceSizes/imageSizes di next.config (= WIDTHS di bawah).
// Gambar di luar manifest (SVG, GIF, URL luar, impor statis) dikembalikan apa adanya.
import manifest from './image-manifest.json'

const WIDTHS = ${JSON.stringify(WIDTHS)}

export default function staticImageLoader({ src, width }) {
  const hash = manifest[src]
  if (!hash) return src
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1]
  const stem = src.slice(${JSON.stringify(base)}.length).replace(/\\.(png|jpe?g|webp)$/i, '')
  return \`${base}/_img\${stem}.\${hash}-\${w}.webp\`
}
`)
let bytes = 0
for (const f of walk(path.join(pub, '_img'))) bytes += statSync(f).size
console.log(`${files.length} gambar · ${made} varian baru · ${kept} sudah ada · ${removed} basi dihapus · total public/_img ${(bytes / 1048576).toFixed(1)} MB`)
