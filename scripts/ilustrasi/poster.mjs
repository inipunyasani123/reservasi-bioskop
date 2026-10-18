// Poster lima film fiktif Bioskop Kelir: ilustrasi buatan sendiri (SVG), dirender ke WebP 800x1200.
// Satu sistem poster (grid tipografi, grain, pita usia LSF, blok kredit, studio fiktif); tiap film punya adegan sendiri.
//
// Pemakaian (dari akar proyek):
//   node scripts/ilustrasi/poster.mjs <folder>            -> tulis <folder>/<id>.svg + <id>.html (font Google diunduh
//                                                            sekali ke <folder>/fonts, jadi render tidak butuh jaringan)
//   node scripts/ilustrasi/poster.mjs <folder> --render   -> sekaligus render lewat Chrome headless ke
//                                                            public/images/poster/<id>.webp
//   node scripts/ilustrasi/poster.mjs <folder> --og       -> public/og.jpg (1200x630) dari poster yang sudah dirender
// Lalu: node scripts/static-images.mjs . --dirs public/images
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { createRequire } from 'node:module'

const f = (n) => Math.round(n * 10) / 10
function acak(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
// kurva halus melalui titik-titik (Catmull-Rom -> Bezier kubik)
function halus(p) {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c
    d += ` C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`
  }
  return d
}
const punggung = (p, bawah = 1200) => `${halus(p)} L${p.at(-1)[0]} ${bawah} L${p[0][0]} ${bawah} Z`
// daun memanjang dari pangkal (x,y): panjang L, lebar W, sudut a (derajat)
function daun(x, y, L, W, a, isi, urat) {
  const d = `M0 0 C${f(L * 0.22)} ${f(-W)} ${f(L * 0.72)} ${f(-W * 0.95)} ${f(L)} 0 C${f(L * 0.72)} ${f(W * 0.95)} ${f(L * 0.22)} ${f(W)} 0 0Z`
  const u = urat ? `<path d="M0 0Q${f(L * 0.5)} ${f(-W * 0.1)} ${f(L * 0.95)} 0" fill="none" stroke="${urat}" stroke-width="${f(Math.max(1, W * 0.07))}"/>` : ''
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})"><path d="${d}" fill="${isi}"/>${u}</g>`
}
// pakis: tangkai dengan anak daun berpasangan
function pakis(x, y, L, a, isi, n = 16) {
  let s = `<path d="M0 0Q${f(L / 2)} ${f(-L * 0.06)} ${f(L)} 0" fill="none" stroke="${isi}" stroke-width="3"/>`
  for (let i = 1; i < n; i++) {
    const t = i / n, px = L * t, l = (1 - t * 0.85) * L * 0.2 + 6
    s += daun(px, -t * L * 0.03, l, l * 0.22, -62 + t * 10, isi) + daun(px, -t * L * 0.03, l, l * 0.22, 62 - t * 10, isi)
  }
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${s}</g>`
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

// ---------- unsur bersama ----------
const KELIR = '#f59e0b'
function pita(kelas) {
  const bawah = kelas === 'SU' ? 'SEMUA UMUR' : 'TAHUN'
  return `<g transform="translate(56 0)" font-family="Barlow Condensed" text-anchor="middle">
    <path d="M0 0H96V158L48 140L0 158Z" fill="${KELIR}"/>
    <path d="M7 0V147.5L48 132L89 147.5V0" fill="none" stroke="#1c1205" stroke-opacity=".35" stroke-width="1.4"/>
    <text x="50" y="40" font-weight="600" font-size="14" letter-spacing="4" fill="#1c1205">USIA</text>
    <text x="48" y="${kelas === 'SU' ? 95 : 93}" font-weight="700" font-size="${kelas === 'SU' ? 52 : 46}" fill="#1c1205">${esc(kelas)}</text>
    <text x="${bawah === 'TAHUN' ? 49.5 : 49}" y="118" font-weight="600" font-size="${bawah === 'TAHUN' ? 13 : 11.5}" letter-spacing="${bawah === 'TAHUN' ? 3 : 1.6}" fill="#1c1205">${bawah}</text>
  </g>`
}
function studio(nama, warna = '#fff') {
  return `<g font-family="Barlow Condensed" text-anchor="middle" fill="${warna}">
    <text x="403" y="80" font-weight="600" font-size="23" letter-spacing="6.5" fill-opacity=".92">${esc(nama.toUpperCase())}</text>
    <text x="401" y="106" font-style="italic" font-weight="400" font-size="18" letter-spacing="2" fill-opacity=".72">mempersembahkan</text>
  </g>`
}
function kredit(film, nama) {
  return `<g font-family="Barlow Condensed" text-anchor="middle">
    <text x="400" y="1074" font-size="27" fill="#fff" fill-opacity=".92"><tspan font-style="italic" font-weight="400" letter-spacing="1">sebuah film karya</tspan><tspan dx="10" font-weight="700" letter-spacing="4">${esc(film.sutradara.toUpperCase())}</tspan></text>
    <line x1="200" x2="600" y1="1095" y2="1095" stroke="${KELIR}" stroke-opacity=".5"/>
    <text x="402" y="1123" font-size="17" font-weight="500" letter-spacing="4.5" fill="#fff" fill-opacity=".66">${esc(`${film.genre.toUpperCase()} · ${film.durasi} MENIT · ${nama.toUpperCase()}`)}</text>
    <text x="404" y="1163" font-size="19" font-weight="700" letter-spacing="8" fill="${KELIR}">SEDANG TAYANG DI BIOSKOP KELIR</text>
  </g>`
}
function bingkai({ film, nama, gelap, isi, judul, grain = 0.3, kaki = 0.9 }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200" viewBox="0 0 800 1200">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" seed="7" stitchTiles="stitch"/>
      <feColorMatrix values=".33 .33 .33 0 0  .33 .33 .33 0 0  .33 .33 .33 0 0  0 0 0 0 1"/>
    </filter>
    <radialGradient id="vignet" cx="50%" cy="40%" r="80%"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".66"/></radialGradient>
    <linearGradient id="kaki" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${gelap}" stop-opacity="0"/><stop offset=".45" stop-color="${gelap}" stop-opacity="${f(kaki * 0.78)}"/><stop offset="1" stop-color="${gelap}" stop-opacity="${kaki}"/></linearGradient>
    <linearGradient id="atas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
  </defs>
  ${isi}
  <rect y="760" width="800" height="440" fill="url(#kaki)"/>
  <rect width="800" height="180" fill="url(#atas)"/>
  <rect width="800" height="1200" fill="url(#vignet)"/>
  ${judul}
  ${kredit(film, nama)}
  ${studio(nama)}
  ${pita(film.klasifikasi)}
  <rect width="800" height="1200" filter="url(#grain)" opacity="${grain}" style="mix-blend-mode:overlay"/>
</svg>`
}

// ---------- 1. Gerhana Terakhir (fiksi ilmiah) ----------
function gerhana(film) {
  const r = acak(11), cx = 400, cy = 345, mr = 118
  let bintang = ''
  for (let i = 0; i < 110; i++) {
    const x = r() * 800, y = r() * 690
    if (Math.hypot(x - cx, y - cy) < 255) continue
    bintang += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + r() * 1.3)}" fill="#fff7ed" opacity="${f(0.2 + r() * 0.7)}"/>`
  }
  let corona = ''
  for (let i = 0; i < 20; i++) {
    const a = i * 18 + r() * 10, len = 140 + r() * 150, w = 12 + r() * 20
    corona += `<ellipse cx="${cx}" cy="${f(cy - mr - len / 2 + 34)}" rx="${f(w)}" ry="${f(len / 2)}" transform="rotate(${f(a)} ${cx} ${cy})" fill="#fde68a" opacity="${f(0.07 + r() * 0.11)}"/>`
  }
  let tik = ''
  for (let a = 200; a <= 340; a += 5) {
    const t = (a * Math.PI) / 180, k = a % 15 === 0 ? 14 : 7
    tik += `<line x1="${f(cx + 198 * Math.cos(t))}" y1="${f(cy + 198 * Math.sin(t))}" x2="${f(cx + (198 + k) * Math.cos(t))}" y2="${f(cy + (198 + k) * Math.sin(t))}"/>`
  }
  const silang = [0, 90, 180, 270].map((a) => { const t = (a * Math.PI) / 180; return `<line x1="${f(cx + 236 * Math.cos(t))}" y1="${f(cy + 236 * Math.sin(t))}" x2="${f(cx + 262 * Math.cos(t))}" y2="${f(cy + 262 * Math.sin(t))}"/>` }).join('')
  const dr = (-38 * Math.PI) / 180, dx = cx + 119 * Math.cos(dr), dy = cy + 119 * Math.sin(dr) // "cincin berlian"
  const jauh = [[0, 716], [70, 698], [140, 710], [215, 682], [290, 703], [360, 688], [440, 712], [520, 690], [600, 701], [680, 676], [750, 696], [800, 688]]
  const tengah = [[0, 764], [90, 740], [180, 755], [265, 728], [335, 750], [420, 762], [500, 744], [585, 758], [660, 740], [740, 752], [800, 744]]
  const dekat = [[0, 838], [100, 818], [200, 805], [300, 794], [380, 781], [450, 763], [510, 745], [560, 738], [612, 744], [680, 772], [760, 802], [800, 815]]
  const isi = `
  <defs>
    <linearGradient id="langit" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#04040b"/><stop offset=".36" stop-color="#0e0822"/><stop offset=".46" stop-color="#1c0e2c"/><stop offset=".52" stop-color="#3d1530"/>
      <stop offset=".555" stop-color="#7a2622"/><stop offset=".585" stop-color="#d4620f"/><stop offset=".6" stop-color="#fbbf24"/><stop offset="1" stop-color="#2a0f0a"/>
    </linearGradient>
    <radialGradient id="korona" cx="${cx}" cy="${cy}" r="330" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#fffbeb"/><stop offset=".36" stop-color="#fef3c7"/><stop offset=".4" stop-color="#fcd34d" stop-opacity=".75"/>
      <stop offset=".52" stop-color="#f59e0b" stop-opacity=".3"/><stop offset=".72" stop-color="#ea580c" stop-opacity=".1"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bulan" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#15121f"/><stop offset="1" stop-color="#020203"/></radialGradient>
    <radialGradient id="kilau" cx="${f(dx)}" cy="${f(dy)}" r="60" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff"/><stop offset=".12" stop-color="#fffbeb" stop-opacity=".95"/><stop offset=".4" stop-color="#fde68a" stop-opacity=".35"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient>
    <radialGradient id="ufuk" cx="400" cy="720" r="600" gradientTransform="translate(0 720) scale(1 .33) translate(0 -720)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24" stop-opacity=".95"/><stop offset=".5" stop-color="#ea580c" stop-opacity=".35"/><stop offset="1" stop-color="#ea580c" stop-opacity="0"/></radialGradient>
    <linearGradient id="kubah" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a2a33"/><stop offset="1" stop-color="#0c0810"/></linearGradient>
    <radialGradient id="lampu"><stop offset="0" stop-color="#fbbf24" stop-opacity=".7"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></radialGradient>
    <filter id="kabur14"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="kabur3"><feGaussianBlur stdDeviation="2.5"/></filter>
  </defs>
  <rect width="800" height="1200" fill="url(#langit)"/>
  ${bintang}
  <ellipse cx="400" cy="720" rx="600" ry="200" fill="url(#ufuk)"/>
  <g filter="url(#kabur14)">${corona}</g>
  <circle cx="${cx}" cy="${cy}" r="330" fill="url(#korona)"/>
  <circle cx="${cx}" cy="${cy}" r="${mr + 3}" fill="none" stroke="#fffbeb" stroke-width="4" filter="url(#kabur3)"/>
  <circle cx="${cx}" cy="${cy}" r="${mr}" fill="url(#bulan)"/>
  <circle cx="${f(dx)}" cy="${f(dy)}" r="60" fill="url(#kilau)"/>
  <g stroke="#fff" stroke-linecap="round">
    <line x1="${f(dx - 150)}" y1="${f(dy)}" x2="${f(dx + 150)}" y2="${f(dy)}" stroke-width="1.6" stroke-opacity=".75"/>
    <line x1="${f(dx)}" y1="${f(dy - 90)}" x2="${f(dx)}" y2="${f(dy + 90)}" stroke-width="1.3" stroke-opacity=".6"/>
  </g>
  <circle cx="${f(dx)}" cy="${f(dy)}" r="4.5" fill="#fff"/>
  <g fill="none" stroke="#fbbf24" stroke-opacity=".5" stroke-width="1.2">
    <path d="M${f(cx + 198 * Math.cos((200 * Math.PI) / 180))} ${f(cy + 198 * Math.sin((200 * Math.PI) / 180))} A198 198 0 0 1 ${f(cx + 198 * Math.cos((340 * Math.PI) / 180))} ${f(cy + 198 * Math.sin((340 * Math.PI) / 180))}"/>
    ${tik}${silang}
    <ellipse cx="${cx}" cy="${cy}" rx="300" ry="84" transform="rotate(-14 ${cx} ${cy})" stroke-dasharray="2 7" stroke-opacity=".38"/>
  </g>
  <g font-family="IBM Plex Mono" font-size="13" fill="#fbbf24" fill-opacity=".8" letter-spacing="1.5">
    <text x="${f(cx - 262)}" y="${f(cy - 104)}">PERKIRAAN</text>
    <text x="${f(cx + 176)}" y="${f(cy - 104)}">−72 JAM</text>
  </g>
  <path d="${punggung(jauh)}" fill="#3a1520"/>
  <path d="${halus(jauh)}" fill="none" stroke="#fbbf24" stroke-opacity=".35" stroke-width="1.4"/>
  <path d="${punggung(tengah)}" fill="#1d0c17"/>
  <path d="${halus(tengah)}" fill="none" stroke="#f59e0b" stroke-opacity=".28" stroke-width="1.2"/>
  <path d="${punggung(dekat)}" fill="#08050c"/>
  <path d="${halus(dekat)}" fill="none" stroke="#fcd34d" stroke-opacity=".45" stroke-width="1.6"/>
  <g>
    <rect x="522" y="707" width="76" height="35" fill="#0d0811"/>
    <rect x="515" y="701" width="90" height="7" fill="#1a1019"/>
    <line x1="515" y1="701.5" x2="605" y2="701.5" stroke="#fcd34d" stroke-opacity=".55"/>
    <path d="M520 701A40 40 0 0 1 600 701Z" fill="url(#kubah)"/>
    <g transform="rotate(-23 560 701)">
      <rect x="553.5" y="661" width="13" height="40" fill="#030204"/>
      <rect x="555" y="636" width="10" height="38" rx="2" fill="#20152a" stroke="#fde68a" stroke-opacity=".55" stroke-width=".9"/>
    </g>
    <path d="M521.5 696A40 40 0 0 1 571 662.6" fill="none" stroke="#fde68a" stroke-opacity=".75" stroke-width="1.8"/>
    <circle cx="541" cy="721" r="16" fill="url(#lampu)"/>
    <rect x="536.5" y="716.5" width="9" height="8" fill="#fbbf24"/>
    <rect x="574" y="716.5" width="9" height="8" fill="#3b2a1a"/>
  </g>
  <g>
    <path d="M488.6 750L490 738.5L488.2 725.5Q489 721.4 494.4 721Q499.6 721.4 500.4 725.5L498.8 738.5L500.2 750H496.8L494.6 739.6L492.2 750Z" fill="#050307"/>
    <circle cx="494.5" cy="715.2" r="5.3" fill="#050307"/>
    <path d="M489.4 713.4A5.3 5.3 0 0 1 497.5 710.8" fill="none" stroke="#fcd34d" stroke-opacity=".8" stroke-width="1"/>
    <circle cx="502" cy="727.5" r="9" fill="url(#lampu)"/>
    <rect x="499" y="725.2" width="6.5" height="4.6" fill="#fde68a" transform="rotate(-20 502 727.5)"/>
  </g>`
  const judul = `<g text-anchor="middle">
    <text x="400" y="826" font-family="IBM Plex Mono" font-weight="500" font-size="17" letter-spacing="4" fill="#fbbf24">IA HANYA PUNYA SATU MALAM.</text>
    <text x="402" y="918" font-family="Unbounded" font-weight="800" font-size="84" letter-spacing="3" fill="#fff7ed">GERHANA</text>
    <text x="402" y="1010" font-family="Unbounded" font-weight="800" font-size="84" letter-spacing="3" fill="#fff7ed">TERAKHIR</text>
  </g>`
  return bingkai({ film, nama: 'Lereng Ufuk Pictures', gelap: '#07040a', isi, judul })
}

// ---------- 2. Senandung Hujan (drama) ----------
function hujan(film) {
  const r = acak(23)
  let kota = ''
  for (let x = -30; x < 830;) {
    const w = 46 + r() * 54, h = 22 + r() * 26, t = 15 + r() * 15, y = 642 - h
    kota += `<path d="M${f(x)} ${f(y)}L${f(x + w / 2)} ${f(y - t)}L${f(x + w)} ${f(y)}V648H${f(x)}Z" fill="#17256a"/>`
    if (r() < 0.45) kota += `<rect x="${f(x + w * 0.3)}" y="${f(y + h * 0.35)}" width="4" height="5" fill="#fcd34d" opacity=".5"/>`
    x += w + 2 + r() * 10
  }
  const tiang = [50, 300, 560, 770].map((x) => `<line x1="${x}" y1="470" x2="${x}" y2="648"/><line x1="${x - 14}" y1="482" x2="${x + 14}" y2="482"/>`).join('')
  const kabel = [[50, 300], [300, 560], [560, 770]].map(([a, b]) => `<path d="M${a} 484Q${(a + b) / 2} 516 ${b} 484"/><path d="M${a} 488Q${(a + b) / 2} 526 ${b} 488"/>`).join('')
  const hj = []
  let hjHangat = ''
  for (let i = 0; i < 320; i++) {
    const x = r() * 860 - 30, y = r() * 1260 - 60, L = 26 + r() * 60
    hj.push(`<line x1="${f(x)}" y1="${f(y)}" x2="${f(x - L * 0.16)}" y2="${f(y + L)}" stroke-opacity="${f(0.1 + r() * 0.22)}"/>`)
  }
  for (let i = 0; i < 80; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 200, x = 186 + Math.cos(a) * d, y = 556 + Math.sin(a) * d * 0.9, L = 18 + r() * 34
    hjHangat += `<line x1="${f(x)}" y1="${f(y)}" x2="${f(x - L * 0.16)}" y2="${f(y + L)}" stroke-opacity="${f(0.25 + r() * 0.45)}"/>`
  }
  let riak = ''
  for (let i = 0; i < 34; i++) {
    const x = r() * 800, y = 660 + r() * 420, w = 4 + r() * 12
    riak += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(w)}" ry="${f(w * 0.22)}"/>`
  }
  // kakak (memegang payung) dan adik (membawa kardus), dilihat dari belakang
  const sosok = `
    <path d="M556 606C556 590 588 590 588 606C590 622 592 640 594 652C586 657 560 657 550 652C552 640 554 622 556 606Z"/>
    <path d="M548 652C542 668 540 690 542 730L546 760H600L604 730C606 690 604 668 598 652C590 648 556 648 548 652Z"/>
    <path d="M546 756L542 788H604L600 756Z"/>
    <rect x="557" y="786" width="9" height="15" rx="2"/><rect x="580" y="786" width="9" height="15" rx="2"/>
    <path d="M598 664C612 654 612 640 596 630" fill="none" stroke="#050817" stroke-width="10" stroke-linecap="round"/>
    <circle cx="508" cy="682" r="14"/>
    <path d="M494 698C488 708 486 724 488 748L492 764H526L530 748C532 724 530 708 524 698C516 693 500 693 494 698Z"/>
    <path d="M490 762L488 784H506L508 772L512 784H530L528 762Z"/>
    <rect x="493" y="782" width="7" height="19" rx="2"/><rect x="516" y="782" width="7" height="19" rx="2"/>
    <path d="M490 716C478 724 474 736 482 744" fill="none" stroke="#050817" stroke-width="9" stroke-linecap="round"/>`
  const kardus = '<g transform="rotate(-8 478 728)"><rect x="458" y="712" width="40" height="30" fill="#1d1a3a"/><path d="M458 712l8 -7h24l8 7" fill="#24204a"/><line x1="458" y1="712" x2="498" y2="712" stroke="#fbbf24" stroke-opacity=".5"/></g>'
  const tepi = `
    <path d="M550 652C552 640 554 622 556 606C556 594 566 590 574 591"/>
    <path d="M548 652C542 668 540 690 542 730L546 760"/><path d="M546 760L542 788"/>
    <path d="M495 690C495 676 504 668 512 668"/><path d="M494 698C488 708 486 724 488 748L492 764"/>`
  const payung = 'M448 598C452 548 504 520 560 522C616 520 668 546 672 590Q646 580 616 590Q588 578 560 590Q532 578 504 592Q476 582 448 598Z'
  const pita = 'M612 266C642 330 556 352 590 418C622 480 470 478 420 430C362 376 300 466 330 500C352 524 262 520 222 548'
  const kaset = `<g transform="translate(600 210) rotate(-12)">
    <rect x="-88" y="-56" width="176" height="112" rx="9" fill="#1e1b30" stroke="#3a3458" stroke-width="2"/>
    <rect x="-78" y="-48" width="156" height="58" rx="4" fill="#efe6cf"/>
    <rect x="-78" y="-48" width="156" height="12" rx="3" fill="#f59e0b"/>
    <text x="-66" y="-12" font-family="Caveat" font-weight="700" font-size="27" fill="#3a2614">Ibu — sisi A</text>
    <rect x="-46" y="-2" width="92" height="28" rx="14" fill="#0b0a14" stroke="#4a4370"/>
    <circle cx="-28" cy="12" r="13" fill="#3b2412"/><circle cx="28" cy="12" r="8" fill="#3b2412"/>
    <circle cx="-28" cy="12" r="6" fill="#d6cfc0"/><circle cx="28" cy="12" r="6" fill="#d6cfc0"/>
    <circle cx="-28" cy="12" r="2.4" fill="#1e1b30"/><circle cx="28" cy="12" r="2.4" fill="#1e1b30"/>
    <path d="M-50 56L-40 40H40L50 56Z" fill="#141226"/>
    <circle cx="-20" cy="49" r="3" fill="#0b0a14"/><circle cx="20" cy="49" r="3" fill="#0b0a14"/>
    ${[[-80, -48], [80, -48], [-80, 48], [80, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#4a4370"/>`).join('')}
  </g>`
  const isi = `
  <defs>
    <linearGradient id="langit" x1="0" y1="0" x2="0" y2="648" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#060a22"/><stop offset=".42" stop-color="#101b50"/><stop offset=".72" stop-color="#22388c"/><stop offset=".9" stop-color="#3b5bc4"/><stop offset="1" stop-color="#5a7bd9"/></linearGradient>
    <linearGradient id="jalan" x1="0" y1="644" x2="0" y2="1200" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#3552b4"/><stop offset=".1" stop-color="#16246a"/><stop offset=".36" stop-color="#080d32"/><stop offset="1" stop-color="#03051a"/></linearGradient>
    <radialGradient id="kabut" cx="400" cy="630" r="460" gradientTransform="translate(0 630) scale(1 .32) translate(0 -630)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#8fb0ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fb0ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="jendela" cx="50%" cy="50%" r="60%"><stop offset="0" stop-color="#fff2c4"/><stop offset=".55" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></radialGradient>
    <radialGradient id="pendar" cx="186" cy="556" r="270" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fbbf24" stop-opacity=".55"/><stop offset=".45" stop-color="#f59e0b" stop-opacity=".16"/><stop offset="1" stop-color="#f59e0b" stop-opacity="0"/></radialGradient>
    <linearGradient id="pantul" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbbf24" stop-opacity=".65"/><stop offset="1" stop-color="#fbbf24" stop-opacity="0"/></linearGradient>
    <linearGradient id="genteng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1440"/><stop offset="1" stop-color="#16206a"/></linearGradient>
    <linearGradient id="kanopi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a2a6c"/><stop offset="1" stop-color="#070c2a"/></linearGradient>
    <filter id="k2"><feGaussianBlur stdDeviation="2.5"/></filter>
    <filter id="k6"><feGaussianBlur stdDeviation="6"/></filter>
  </defs>
  <rect width="800" height="1200" fill="url(#langit)"/>
  <ellipse cx="400" cy="630" rx="520" ry="170" fill="url(#kabut)"/>
  <g stroke="#0e1848" stroke-width="2" fill="none">${tiang}${kabel}</g>
  ${kota}
  <g stroke="#cfdcff" stroke-width="1" opacity=".6">${hj.slice(0, 160).join('')}</g>
  ${kaset}
  <path d="M40 470L432 470L360 390L112 390Z" fill="url(#genteng)"/>
  <g stroke="#2a3a8a" stroke-opacity=".6">${Array.from({ length: 8 }, (_, i) => `<line x1="${f(112 - i * 9)}" y1="${400 + i * 10}" x2="${f(360 + i * 9)}" y2="${400 + i * 10}"/>`).join('')}</g>
  <path d="M112 390L360 390" stroke="#6d86e0" stroke-opacity=".5" stroke-width="2"/>
  <rect x="70" y="470" width="332" height="172" fill="#121c58"/>
  <rect x="70" y="470" width="332" height="10" fill="#0a1140"/>
  <rect x="86" y="478" width="11" height="164" fill="#0c1446"/><rect x="376" y="478" width="11" height="164" fill="#0c1446"/>
  <circle cx="186" cy="556" r="270" fill="url(#pendar)"/>
  <rect x="118" y="508" width="136" height="92" fill="url(#jendela)"/>
  <path d="M120 511C140 536 136 572 126 598H120Z" fill="#b45309" opacity=".55"/>
  <path d="M118 508h136v92h-136z M186 508v92 M118 554h136" fill="none" stroke="#3a240f" stroke-width="5"/>
  <rect x="292" y="518" width="60" height="124" fill="#080d34"/>
  <circle cx="342" cy="582" r="2.5" fill="#fbbf24" opacity=".7"/>
  <rect x="60" y="638" width="352" height="8" fill="#0b123c"/>
  <path d="${pita}" fill="none" stroke="#3b2412" stroke-width="6" stroke-linecap="round"/>
  <path d="${pita}" fill="none" stroke="#c08a52" stroke-width="1.6" stroke-dasharray="64 40" stroke-opacity=".85" stroke-linecap="round"/>
  <rect x="0" y="646" width="800" height="554" fill="url(#jalan)"/>
  <g filter="url(#k6)" opacity=".8">
    <rect x="124" y="652" width="30" height="230" fill="url(#pantul)"/>
    <rect x="160" y="656" width="18" height="170" fill="url(#pantul)"/>
    <rect x="192" y="650" width="36" height="250" fill="url(#pantul)"/>
    <rect x="236" y="656" width="14" height="150" fill="url(#pantul)"/>
  </g>
  <g fill="none" stroke="#9fb4ff" stroke-opacity=".25">${riak}</g>
  <g fill="#050817" opacity=".3" filter="url(#k2)" transform="translate(0 1602) scale(1 -1)">${sosok}<path d="${payung}"/></g>
  <g fill="#050817">${sosok}</g>
  ${kardus}
  <g fill="none" stroke="#fbbf24" stroke-opacity=".6" stroke-width="1.6">${tepi}</g>
  <line x1="566" y1="524" x2="588" y2="670" stroke="#0a1132" stroke-width="3.5"/><path d="M588 670q3 12 -7 12" fill="none" stroke="#0a1132" stroke-width="3.5"/>
  <path d="${payung}" fill="url(#kanopi)"/>
  <g stroke="#2b3c86" stroke-opacity=".7" stroke-width="1.2">${[[504, 592], [560, 590], [616, 590]].map(([x, y]) => `<line x1="560" y1="523" x2="${x}" y2="${y}"/>`).join('')}</g>
  <path d="M448 598C452 548 504 520 560 522" fill="none" stroke="#fbbf24" stroke-opacity=".75" stroke-width="2"/>
  <line x1="560" y1="522" x2="560" y2="508" stroke="#0a1132" stroke-width="3"/>
  <g stroke="#fcd34d" stroke-width="1.1">${hjHangat}</g>
  <g stroke="#dbe5ff" stroke-width="1.2">${hj.slice(160).join('')}</g>`
  const judul = `<g text-anchor="middle" font-family="Fraunces">
    <text x="400" y="840" font-style="italic" font-weight="400" font-size="28" fill="#c7d2fe">Ada suara ibu di setiap kaset.</text>
    <text x="400" y="934" font-style="italic" font-weight="600" font-size="100" fill="#eef2ff">Senandung</text>
    <text x="400" y="1030" font-style="italic" font-weight="600" font-size="112" fill="#eef2ff">Hujan</text>
  </g>`
  return bingkai({ film, nama: 'Gerimis Sore Films', gelap: '#03051a', isi, judul })
}

// ---------- 3. Jejak di Rimba (petualangan) ----------
function rimba(film) {
  const r = acak(37)
  const topo = (cx, cy, n, b, s) => Array.from({ length: n }, (_, i) => {
    const rad = b + i * s, p = []
    for (let k = 0; k <= 48; k++) { const t = (k / 48) * Math.PI * 2; const q = rad * (1 + 0.13 * Math.sin(3 * t + i * 0.5) + 0.07 * Math.sin(5 * t + 1.3)); p.push([cx + Math.cos(t) * q * 1.25, cy + Math.sin(t) * q * 0.8]) }
    return `<path d="${halus(p)}Z"/>`
  }).join('')
  let jauh = ''
  for (let i = 0; i < 14; i++) { const x = 150 + r() * 500, w = 7 + r() * 12; jauh += `<rect x="${f(x)}" y="120" width="${f(w)}" height="620" fill="#3e9f8a" opacity="${f(0.35 + r() * 0.25)}"/>` }
  let tengah = ''
  for (const [x, w] of [[180, 30], [262, 22], [520, 26], [590, 38], [330, 16], [470, 18]]) {
    tengah += `<path d="M${f(x + w * 0.12)} 0H${f(x + w * 0.88)}L${f(x + w * 1.1)} 700C${f(x + w * 1.4)} 730 ${f(x + w * 2)} 752 ${f(x + w * 2.5)} 762H${f(x - w * 1.5)}C${f(x - w * 1)} 752 ${f(x - w * 0.4)} 730 ${f(x - w * 0.1)} 700Z" fill="#15584b"/><path d="M${f(x + w * 0.14)} 0L${f(x - w * 0.06)} 700" stroke="#3fa58e" stroke-opacity=".35" stroke-width="${f(w * 0.18)}"/>`
    tengah += `<path d="M${x + w / 2} 60C${x + w / 2 + 30} 160 ${x + w / 2 - 26} 260 ${x + w / 2 + 14} 380" fill="none" stroke="#0e4a3e" stroke-width="3"/>`
  }
  const sinar = [[330, 120, 520], [372, 236, 340], [410, 420, 640], [446, 600, 760], [470, 530, 700]].map(([x, a, b], i) =>
    `<path d="M${x} -20L${x + 26 + i * 6} -20L${b} 900L${a} 900Z" fill="#ecfccb" opacity="${f(0.06 + (i % 2) * 0.05)}"/>`).join('')
  let kanopi = ''
  for (let i = 0; i < 46; i++) { const x = r() * 840 - 20, y = r() * 120 - 30; kanopi += daun(x, y, 70 + r() * 90, 18 + r() * 16, 40 + r() * 100, i % 3 ? '#032a22' : '#063a2f') }
  let liana = ''
  for (let i = 0; i < 7; i++) {
    const x = 120 + r() * 560, L = 180 + r() * 260
    liana += `<path d="M${f(x)} 40C${f(x + 18)} ${f(40 + L * 0.3)} ${f(x - 16)} ${f(40 + L * 0.6)} ${f(x + 6)} ${f(40 + L)}" fill="none" stroke="#03241d" stroke-width="3"/>`
    for (let k = 0; k < 4; k++) liana += daun(x + (r() - 0.5) * 14, 60 + (L * (k + 1)) / 5, 20 + r() * 16, 6, r() < 0.5 ? 30 : 150, '#04302a')
  }
  let semak = ''
  for (let i = 0; i < 24; i++) { const s = i % 2 ? -1 : 1, x = s > 0 ? r() * 240 - 40 : 840 - r() * 240, y = 760 + r() * 360; semak += daun(x, y, 120 + r() * 120, 26 + r() * 22, s > 0 ? -60 + r() * 70 : 190 + r() * 70, i % 3 ? '#02201a' : '#053128', '#0b4a3d') }
  for (let i = 0; i < 6; i++) { const s = i % 2 ? -1 : 1; semak += pakis(s > 0 ? 20 + r() * 120 : 780 - r() * 120, 900 + r() * 220, 170 + r() * 80, s > 0 ? -50 - r() * 30 : -130 + r() * 30, '#063b30') }
  const orang = (x, s = 1, peta = false) => `<g transform="translate(${x} 704) scale(${s})">
    <path d="M-5 0L-4 -14L-6 -26Q-5 -31 0 -31.5Q5 -31 6 -26L4 -14L5 0H2L0 -12L-2 0Z" fill="#021a15"/>
    <rect x="-9.5" y="-29" width="7" height="13" rx="2" fill="#021a15"/>
    <circle cx="0" cy="-36" r="4.4" fill="#021a15"/><path d="M-8 -37.5H8" stroke="#021a15" stroke-width="2.2"/>
    <circle cx="2.5" cy="-37" r="7" fill="#fde68a" opacity=".35"/><circle cx="2.5" cy="-37" r="1.8" fill="#fef9c3"/>
    ${peta ? '<rect x="4" y="-25" width="8" height="6" fill="#e7e5c8" transform="rotate(-15 8 -22)"/>' : ''}
  </g>`
  const kompas = (() => {
    let s = '<circle cx="400" cy="640" r="168"/><circle cx="400" cy="640" r="150" stroke-dasharray="1 5"/>'
    for (let a = 0; a < 360; a += 10) { const t = (a * Math.PI) / 180, k = a % 90 === 0 ? 18 : a % 30 === 0 ? 10 : 5; s += `<line x1="${f(400 + 168 * Math.cos(t))}" y1="${f(640 + 168 * Math.sin(t))}" x2="${f(400 + (168 - k) * Math.cos(t))}" y2="${f(640 + (168 - k) * Math.sin(t))}"/>` }
    return s
  })()
  const isi = `
  <defs>
    <radialGradient id="kabutR" cx="400" cy="560" r="520" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a7f3d0"/><stop offset=".25" stop-color="#34d399"/><stop offset=".55" stop-color="#0f766e"/><stop offset="1" stop-color="#042f2b"/></radialGradient>
    <linearGradient id="setapak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fdcb8" stop-opacity=".8"/><stop offset="1" stop-color="#1d5a45"/></linearGradient>
    <linearGradient id="batangK" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#021c17"/><stop offset=".8" stop-color="#05302a"/><stop offset="1" stop-color="#0a463b"/></linearGradient>
    <linearGradient id="batangKa" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#021c17"/><stop offset=".8" stop-color="#05302a"/><stop offset="1" stop-color="#0a463b"/></linearGradient>
    <linearGradient id="pudarAtas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff"/><stop offset=".7" stop-color="#000"/></linearGradient>
    <mask id="mTopo"><rect width="800" height="1200" fill="url(#pudarAtas)"/></mask>
    <filter id="k8"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="k3"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>
  <rect width="800" height="1200" fill="url(#kabutR)"/>
  <g filter="url(#k3)">${jauh}</g>
  <rect width="800" height="1200" fill="#a7f3d0" opacity=".12"/>
  ${tengah}
  <g filter="url(#k8)" style="mix-blend-mode:screen">${sinar}</g>
  <path d="M372 1200C380 1000 330 900 384 800C410 752 396 724 400 706L412 706C416 730 440 760 432 812C420 900 520 1000 560 1200Z" fill="url(#setapak)"/>
  <g fill="none" stroke="#d1fae5" stroke-opacity=".28" stroke-width="1.1">${kompas}</g>
  <path d="M400 640L436 560L408 646Z" fill="#fbbf24" opacity=".8"/><path d="M400 640L364 720L392 634Z" fill="#d1fae5" opacity=".5"/>
  <g font-family="Barlow Condensed" font-weight="600" font-size="16" fill="#d1fae5" fill-opacity=".55" text-anchor="middle"><text x="400" y="466">U</text><text x="584" y="646">T</text><text x="400" y="828">S</text><text x="216" y="646">B</text></g>
  ${orang(374, 0.95)}${orang(400, 1, true)}${orang(426, 0.92)}
  <path d="M0 0H150C138 200 150 520 170 700C186 800 230 860 250 900H0Z" fill="url(#batangK)"/>
  <path d="M150 640C176 760 260 820 320 880C250 880 200 860 160 820Z" fill="#03241d"/>
  <path d="M800 0H652C664 220 650 520 630 700C614 800 572 860 552 900H800Z" fill="url(#batangKa)"/>
  <path d="M652 640C626 760 548 820 486 884C556 880 604 860 642 820Z" fill="#03241d"/>
  <g stroke="#0d4a3e" stroke-opacity=".7" stroke-width="2" fill="none"><path d="M40 0C50 300 60 560 92 760"/><path d="M96 0C102 260 110 520 140 720"/><path d="M760 0C752 300 742 560 710 760"/><path d="M704 0C698 260 690 520 662 720"/></g>
  ${liana}
  ${kanopi}
  <g fill="none" stroke="#d1fae5" stroke-opacity=".2" stroke-width="1.1" mask="url(#mTopo)">${topo(560, 270, 7, 26, 26)}${topo(200, 330, 5, 22, 24)}</g>
  ${semak}`
  const judul = `<g text-anchor="middle">
    <text x="402" y="826" font-family="Barlow Condensed" font-weight="600" font-size="24" letter-spacing="4" fill="#bbf7d0">SATU CATATAN TUA. SATU JALAN PULANG.</text>
    <text x="400" y="958" font-family="Big Shoulders Stencil Display" font-weight="900" font-size="156" letter-spacing="6" fill="#ecfdf5">JEJAK</text>
    <text x="402" y="1036" font-family="Big Shoulders Stencil Display" font-weight="800" font-size="76" letter-spacing="14" fill="#a7f3d0">DI RIMBA</text>
  </g>`
  return bingkai({ film, nama: 'Kompas Lumut Films', gelap: '#011510', isi, judul })
}

// ---------- 4. Kunci Lantai Tiga (horor) ----------
function lantaiTiga(film) {
  const r = acak(41), X0 = 120, X1 = 680, LANTAI = [670, 560, 450, 340, 230] // atap tiap lantai (L1..L5)
  const kaos = (x, y, c) => `<path d="M${x} ${y}h30l11 9l-6 9l-6 -4v28h-28v-28l-6 4l-6 -9z" fill="${c}"/>`
  const sarung = (x, y, c) => `<g><rect x="${x}" y="${y}" width="34" height="46" fill="${c}"/><path d="M${x} ${y + 15}h34M${x} ${y + 30}h34M${x + 11} ${y}v46M${x + 23} ${y}v46" stroke="#000" stroke-opacity=".25"/></g>`
  const handuk = (x, y, c) => `<rect x="${x}" y="${y}" width="22" height="38" fill="${c}"/>`
  let g = `<rect x="${X0 - 14}" y="196" width="${X1 - X0 + 28}" height="34" fill="#151210"/><line x1="${X0 - 14}" y1="196.5" x2="${X1 + 14}" y2="196.5" stroke="#57504a" stroke-opacity=".6"/>
    <rect x="${X0}" y="230" width="${X1 - X0}" height="552" fill="#191614"/>`
  for (let i = 0; i < 46; i++) { const x = X0 + r() * (X1 - X0), y = 236 + r() * 520; g += `<rect x="${f(x)}" y="${f(y)}" width="${f(3 + r() * 12)}" height="${f(30 + r() * 80)}" fill="url(#luntur)" opacity="${f(0.35 + r() * 0.4)}"/>` }
  LANTAI.forEach((y, li) => {
    const lt = li + 1, ry = y + 110
    g += `<rect x="${X0}" y="${y + 12}" width="${X1 - X0}" height="16" fill="#080706" opacity=".75"/>`
    g += `<rect x="${X0}" y="${y}" width="${X1 - X0}" height="12" fill="#27221f"/><line x1="${X0}" y1="${y + 0.5}" x2="${X1}" y2="${y + 0.5}" stroke="#4d4540" stroke-opacity=".7"/>`
    for (let u = 0; u < 6; u++) {
      const x = X0 + 24 + u * 92, merah = lt === 3 && u === 3
      if (!merah) g += `<rect x="${x}" y="${y + 26}" width="44" height="78" fill="#0a0807" stroke="#26201d"/>`
      g += `<rect x="${x + 54}" y="${y + 32}" width="26" height="18" fill="#0e0b0a"/><g stroke="#221d1a" stroke-width="1.5">${[0, 1, 2, 3].map((k) => `<line x1="${x + 54}" y1="${y + 36 + k * 4}" x2="${x + 80}" y2="${y + 36 + k * 4}"/>`).join('')}</g>`
    }
    g += `<rect x="${X0}" y="${ry - 34}" width="${X1 - X0}" height="4" fill="#38312d"/><rect x="${X0}" y="${ry}" width="${X1 - X0}" height="6" fill="#211c1a"/>`
    let jr = ''
    for (let x = X0 + 6; x < X1; x += 13) jr += `<line x1="${x}" y1="${ry - 30}" x2="${x}" y2="${ry}"${lt === 3 && x > 380 && x < 520 ? ' stroke="#5c1a24"' : ''}/>`
    g += `<g stroke="#302926" stroke-width="2">${jr}</g>`
    if (lt === 2 || lt === 4 || lt === 5) {
      const warna = ['#2c2420', '#3a2a24', '#2a2a2e', '#3b1f1f']
      for (let k = 0; k < 3; k++) {
        const x = Math.round(X0 + 30 + r() * (X1 - X0 - 100)), c = warna[Math.floor(r() * warna.length)], j = r()
        g += j < 0.4 ? kaos(x, ry - 34, c) : j < 0.75 ? sarung(x, ry - 34, c) : handuk(x, ry - 34, c)
      }
    }
  })
  g += `<rect x="${X0}" y="780" width="${X1 - X0}" height="8" fill="#141110"/>`
  const px = X0 + 24 + 3 * 92, py = 450 + 26 // pintu lantai 3 nomor 4
  const tangga = [670, 560, 450, 340].map((y) => `<path d="M${X1 + 8} ${y + 100}L${X1 + 62} ${y + 20}" stroke="#2a2522" stroke-width="5"/><path d="M${X1 + 8} ${y + 100}L${X1 + 62} ${y + 20}" stroke="#3a332e" stroke-width="1" stroke-dasharray="3 6"/>`).join('')
  const isi = `
  <defs>
    <linearGradient id="langit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#050404"/><stop offset=".55" stop-color="#110e0d"/><stop offset="1" stop-color="#080706"/></linearGradient>
    <radialGradient id="merah" cx="${px + 22}" cy="${py + 40}" r="240" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e11d48" stop-opacity=".8"/><stop offset=".3" stop-color="#be123c" stop-opacity=".3"/><stop offset="1" stop-color="#881337" stop-opacity="0"/></radialGradient>
    <linearGradient id="ruangMerah" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fb7185"/><stop offset=".5" stop-color="#e11d48"/><stop offset="1" stop-color="#4c0519"/></linearGradient>
    <linearGradient id="luntur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="sorot" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fef9c3" stop-opacity=".5"/><stop offset="1" stop-color="#fef9c3" stop-opacity=".03"/></linearGradient>
    <linearGradient id="kuningan" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#78350f"/><stop offset=".35" stop-color="#fcd34d"/><stop offset=".55" stop-color="#b45309"/><stop offset="1" stop-color="#451a03"/></linearGradient>
    <linearGradient id="kabutL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6d3d1" stop-opacity="0"/><stop offset=".5" stop-color="#d6d3d1" stop-opacity=".14"/><stop offset="1" stop-color="#d6d3d1" stop-opacity="0"/></linearGradient>
    <linearGradient id="neonTurun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2e8f0" stop-opacity=".22"/><stop offset="1" stop-color="#e2e8f0" stop-opacity="0"/></linearGradient>
    <filter id="k4"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="k12"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>
  <rect width="800" height="1200" fill="url(#langit)"/>
  <ellipse cx="400" cy="200" rx="360" ry="90" fill="#57534e" opacity=".12" filter="url(#k12)"/>
  ${g}
  <rect x="${X1}" y="230" width="66" height="552" fill="#121010"/><line x1="${X1}" y1="230" x2="${X1}" y2="782" stroke="#2a2522"/>
  ${tangga}
  <path d="M${X1 + 22} 596L${X1 + 4} 668H${X1 + 62}L${X1 + 40} 596Z" fill="url(#neonTurun)"/><rect x="${X1 + 22}" y="593" width="18" height="3.5" rx="1.5" fill="#e2e8f0" opacity=".6"/>
  <rect x="${px}" y="${py}" width="44" height="78" fill="url(#ruangMerah)"/>
  <path d="M${px} ${py}L${px + 31} ${py + 5}V${py + 73}L${px} ${py + 78}Z" fill="#090706"/>
  <g fill="#e7d3cc">${[0, 1, 2, 3].map((k) => `<rect x="${px + 26}" y="${py + 30 + k * 5.6}" width="9" height="4.4" rx="2.2"/>`).join('')}</g>
  <circle cx="${px + 22}" cy="${py + 40}" r="240" fill="url(#merah)" style="mix-blend-mode:screen"/>
  <path d="M${px + 31} ${py + 78}L${px - 40} ${py + 84}H${px + 120}L${px + 44} ${py + 78}Z" fill="#fb7185" opacity=".45" filter="url(#k4)"/>
  <rect x="0" y="788" width="800" height="412" fill="#0a0807"/>
  <path d="M236 770L${px - 6} ${py + 6}L${px + 52} ${py + 50}Z" fill="url(#sorot)" filter="url(#k4)"/>
  <rect x="0" y="700" width="800" height="200" fill="url(#kabutL)"/>
  <g fill="#040303">
    <path d="M196 838L198 800L192 772Q190 752 200 746L204 744Q206 736 212 734Q222 732 224 742L226 744Q236 750 236 764L232 776L240 772L246 778L232 790L226 800L228 838H220L214 806L208 838Z"/>
    <path d="M200 735Q212 724 226 735Z"/><rect x="198" y="733" width="30" height="3.5" rx="1.5"/>
  </g>
  <path d="M224 742Q232 750 234 762M232 776L240 772" fill="none" stroke="#fda4af" stroke-opacity=".45"/>
  <circle cx="241" cy="774" r="5" fill="#fef9c3"/><circle cx="241" cy="774" r="14" fill="#fef9c3" opacity=".18"/>
  <rect x="0" y="840" width="800" height="120" fill="url(#kabutL)"/>
  <g transform="rotate(7 640 0)">
    <line x1="640" y1="0" x2="640" y2="118" stroke="#57534e" stroke-width="2"/>
    <circle cx="640" cy="132" r="15" fill="none" stroke="url(#kuningan)" stroke-width="5"/>
    <path d="M630 142L612 160" stroke="#a8a29e" stroke-width="1.5"/>
    <g transform="rotate(16 600 182)">
      <path d="M588 160h28v52h-28z" fill="#d9c8a3"/><path d="M588 160h28v52h-28z" fill="none" stroke="#8a7a5c"/>
      <circle cx="602" cy="168" r="3.4" fill="#0c0a09"/>
      <text x="602" y="203" text-anchor="middle" font-family="Special Elite" font-size="30" fill="#2b1a10">3</text>
    </g>
    <circle cx="642" cy="176" r="26" fill="url(#kuningan)"/><circle cx="642" cy="176" r="11" fill="#0c0a09"/>
    <path d="M642 150A26 26 0 0 0 618 168" fill="none" stroke="#fde68a" stroke-opacity=".8" stroke-width="2"/>
    <rect x="637" y="200" width="10" height="112" fill="url(#kuningan)"/>
    <path d="M647 270h16v10h-8v8h8v10h-16Z" fill="url(#kuningan)"/>
    <line x1="638.5" y1="204" x2="638.5" y2="310" stroke="#fde68a" stroke-opacity=".6"/>
  </g>`
  const judul = `<g text-anchor="middle" font-family="Cormorant Garamond">
    <text x="400" y="878" font-style="italic" font-weight="500" font-size="31" fill="#fda4af">Malam ini, ada yang mengetuk dari dalam.</text>
    <text x="410" y="978" font-weight="700" font-size="124" letter-spacing="20" fill="#f5f5f4">KUNCI</text>
    <text x="408" y="1040" font-weight="600" font-size="56" letter-spacing="16" fill="#f5f5f4">LANTAI TIGA</text>
  </g>`
  return bingkai({ film, nama: 'Lorong Sunyi Pictures', gelap: '#050404', isi, judul, grain: 0.42 })
}

// ---------- 5. Kancil Pulang Kampung (animasi keluarga) ----------
function kancil(film) {
  const r = acak(53)
  const anyaman = '<g stroke="#4d7c0f" stroke-width="2.2" stroke-opacity=".8"><line x1="-6" y1="-17" x2="-6" y2="17"/><line x1="6" y1="-17" x2="6" y2="17"/><line x1="-17" y1="-6" x2="17" y2="-6"/><line x1="-17" y1="6" x2="17" y2="6"/></g>'
  const ketupat = (x, y, s, ekor = true) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})">
    <line x1="0" y1="-24" x2="0" y2="-4" stroke="#4d7c0f" stroke-width="1.6"/>
    <g transform="translate(0 18) rotate(45)"><rect x="-17" y="-17" width="34" height="34" rx="3" fill="#a3e635"/><rect x="-17" y="-17" width="17" height="17" fill="#bef264"/>${anyaman}</g>
    ${ekor ? '<path d="M2 42C8 58 4 70 12 82M-2 42C-10 56 -6 68 -14 78" fill="none" stroke="#84cc16" stroke-width="5" stroke-linecap="round"/>' : ''}
  </g>`
  const titik = [0.08, 0.24, 0.4, 0.56, 0.72, 0.88].map((t) => { const x = (1 - t) ** 2 * -10 + 2 * (1 - t) * t * 400 + t * t * 810, y = (1 - t) ** 2 * 138 + 2 * (1 - t) * t * 236 + t * t * 150; return ketupat(x, y + 22, 0.9 + r() * 0.25) }).join('')
  let awan = ''
  for (const [x, y, s] of [[150, 352, 0.9], [650, 318, 1.1]]) awan += `<g transform="translate(${x} ${y}) scale(${s})"><g fill="#fff"><circle cx="-40" cy="10" r="30"/><circle cx="0" cy="-8" r="40"/><circle cx="44" cy="8" r="30"/><rect x="-70" y="10" width="146" height="30" rx="15"/></g><rect x="-70" y="30" width="146" height="10" rx="5" fill="#ecfccb"/></g>`
  let rumah = ''
  for (const [x, y, s] of [[96, 492, 0.8], [178, 484, 1], [606, 478, 0.9], [690, 494, 0.75]]) rumah += `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-22" y="-6" width="44" height="26" fill="#fef3c7"/><path d="M-32 -4L-14 -24H14L32 -4Z" fill="#c2410c"/><path d="M-14 -24H14" stroke="#9a3412" stroke-width="3"/><rect x="-6" y="4" width="10" height="16" fill="#92400e"/></g>`
  const kelapa = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0C4 -40 10 -80 6 -120" fill="none" stroke="#854d0e" stroke-width="7" stroke-linecap="round"/>${[-150, -120, -80, -40, -10, 20].map((a) => daun(6, -120, 64, 11, a, '#4d7c0f')).join('')}</g>`
  const dek = (x) => 652 - (x - 300) * 0.0714 // tinggi papan jembatan
  const kawung = []
  for (let gx = -60; gx <= 40; gx += 16) for (let gy = -236; gy <= -168; gy += 16) kawung.push(`<g transform="translate(${gx} ${gy})" fill="#fcd34d" opacity=".8"><ellipse cx="0" cy="-4" rx="2.4" ry="3.6"/><ellipse cx="0" cy="4" rx="2.4" ry="3.6"/><ellipse cx="-4" cy="0" rx="3.6" ry="2.4"/><ellipse cx="4" cy="0" rx="3.6" ry="2.4"/></g>`)
  const tokoh = `<g transform="translate(150 806) scale(1.12)">
    <ellipse cx="0" cy="2" rx="96" ry="9" fill="#14532d" opacity=".25"/>
    <path d="M-86 -132C-100 -142 -106 -122 -90 -118Z" fill="#8f4a17"/>
    <path d="M-42 -88C-40 -60 -48 -40 -44 -3M56 -94C58 -60 54 -40 58 -4" fill="none" stroke="#7c3f12" stroke-width="8" stroke-linecap="round"/>
    <path d="M-84 -122C-88 -164 -48 -182 -4 -176C36 -172 66 -158 74 -128C82 -100 62 -82 32 -80L-44 -80C-70 -82 -82 -98 -84 -122Z" fill="url(#bulu)"/>
    <path d="M-66 -92C-40 -78 14 -76 50 -88C40 -78 -24 -72 -66 -92Z" fill="#f6d3a5"/>
    <path d="M-60 -92C-58 -60 -70 -40 -64 -3M38 -88C40 -60 34 -40 36 -3" fill="none" stroke="#a0561b" stroke-width="8.5" stroke-linecap="round"/>
    <g fill="#3f2a1b"><ellipse cx="-64" cy="-1" rx="6.5" ry="4"/><ellipse cx="36" cy="-1" rx="6.5" ry="4"/><ellipse cx="-44" cy="-1" rx="5.5" ry="3.5" opacity=".8"/><ellipse cx="58" cy="-2" rx="5.5" ry="3.5" opacity=".8"/></g>
    <path d="M54 -152C62 -186 80 -210 100 -222L122 -208C106 -192 92 -166 84 -132Z" fill="url(#bulu)"/>
    <path d="M86 -140C94 -166 104 -186 116 -200" fill="none" stroke="#fff7ed" stroke-width="5" stroke-linecap="round"/>
    <path d="M78 -152C84 -170 94 -186 104 -196" fill="none" stroke="#fff7ed" stroke-width="3" stroke-linecap="round" opacity=".85"/>
    <path d="M100 -246C88 -278 94 -300 104 -306C112 -290 112 -266 110 -248Z" fill="#a8541a"/>
    <path d="M92 -232C96 -256 132 -262 148 -242C156 -232 168 -220 168 -212C168 -202 158 -198 144 -200C124 -200 102 -204 94 -216Z" fill="url(#bulu)"/>
    <path d="M114 -250C116 -284 130 -298 140 -298C142 -280 132 -260 122 -246Z" fill="#c2691d"/><path d="M119 -254C121 -278 130 -288 136 -290C136 -276 130 -262 124 -252Z" fill="#fcd9b0"/>
    <ellipse cx="150" cy="-209" rx="15" ry="9" fill="#f6d3a5"/>
    <ellipse cx="166" cy="-212" rx="4.6" ry="3.6" fill="#2b1608"/>
    <path d="M148 -203Q155 -198 162 -203" fill="none" stroke="#5b2f0e" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="138" cy="-218" rx="6" ry="3.4" fill="#fb923c" opacity=".45"/>
    <ellipse cx="126" cy="-232" rx="10" ry="11" fill="#fff"/><circle cx="128.6" cy="-231" r="6.6" fill="#1c1006"/><circle cx="131" cy="-234" r="2.3" fill="#fff"/><circle cx="126.5" cy="-227.5" r="1" fill="#fff"/>
    <path d="M115 -247Q126 -253 137 -245" fill="none" stroke="#5b2f0e" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M20 -182C40 -170 52 -150 56 -132" fill="none" stroke="#92400e" stroke-width="6" stroke-linecap="round"/>
    <clipPath id="cBuntel"><path d="M-58 -176C-64 -214 -32 -234 -2 -228C26 -222 38 -198 26 -178C10 -168 -42 -166 -58 -176Z"/></clipPath>
    <path d="M-58 -176C-64 -214 -32 -234 -2 -228C26 -222 38 -198 26 -178C10 -168 -42 -166 -58 -176Z" fill="#7c2d12"/>
    <g clip-path="url(#cBuntel)">${kawung.join('')}</g>
    <path d="M-58 -176C-42 -168 10 -168 26 -178" fill="none" stroke="#451a03" stroke-width="2" opacity=".5"/>
    <path d="M-8 -226C-20 -246 -4 -254 2 -240C8 -254 26 -248 14 -228Z" fill="#9a3412"/>
    <path d="M4 -232C22 -226 34 -214 40 -200" fill="none" stroke="#4d7c0f" stroke-width="1.6"/>
    ${ketupat(40, -214, 0.55, false)}
  </g>`
  const buaya = `<g transform="translate(470 ${f(dek(470) - 4)}) rotate(-4)">
    <path d="M214 -30C262 -30 292 -4 302 40C306 60 300 80 290 88C292 66 290 46 282 26C270 2 246 -10 214 -8Z" fill="#4d7c0f"/>
    <path d="M30 -30C60 -54 160 -58 214 -30C222 -24 222 -10 214 -6C150 2 70 2 34 -6Z" fill="url(#buaya)"/>
    ${[66, 92, 118, 144, 170, 196].map((x, i) => `<path d="M${x} ${-46 + Math.abs(i - 2.5) * 1.6}q8 -13 16 0z" fill="#3f6212"/>`).join('')}
    <path d="M44 -9C90 -3 160 -3 208 -9" fill="none" stroke="#bef264" stroke-width="6" stroke-linecap="round"/>
    <path d="M60 -12C58 0 52 6 42 8M178 -12C178 0 174 6 166 8" fill="none" stroke="#3f6212" stroke-width="11" stroke-linecap="round"/>
    <g fill="#ecfccb"><circle cx="38" cy="9" r="2"/><circle cx="44" cy="10" r="2"/><circle cx="162" cy="9" r="2"/><circle cx="168" cy="10" r="2"/></g>
    <path d="M36 -28C20 -42 -40 -42 -68 -31C-78 -27 -78 -15 -68 -11C-40 -5 10 -5 36 -10Z" fill="#65a30d"/>
    <path d="M-68 -19H30" stroke="#365314" stroke-width="2.2" stroke-linecap="round"/>
    ${[-56, -40, -24, -8, 8].map((x) => `<path d="M${x} -19l3 5l3 -5z" fill="#fff"/>`).join('')}
    <circle cx="-66" cy="-31" r="5" fill="#4d7c0f"/><circle cx="-67" cy="-32" r="1.6" fill="#1a2e05"/>
    <circle cx="22" cy="-40" r="14" fill="#84cc16"/>
    <ellipse cx="20" cy="-40" rx="8" ry="7" fill="#fff"/><circle cx="17.5" cy="-39" r="3.8" fill="#1a2e05"/><circle cx="16" cy="-40.5" r="1.2" fill="#fff"/>
    <path d="M9 -44Q21 -56 34 -45L33 -40Q21 -47 10 -40Z" fill="#4d7c0f"/>
    <path d="M6 -50Q18 -58 30 -55" fill="none" stroke="#365314" stroke-width="2.6" stroke-linecap="round"/>
  </g>`
  const tiang = [320, 400, 480, 560, 640, 712]
  const jembatan = `
    <g opacity=".3">${tiang.map((x) => `<line x1="${x}" y1="${f(dek(x) + 30)}" x2="${x}" y2="${f(dek(x) + 120)}" stroke="#713f12" stroke-width="6"/>`).join('')}</g>
    ${tiang.map((x) => `<line x1="${x}" y1="${f(dek(x) - 46)}" x2="${x}" y2="${f(dek(x) + 70)}" stroke="#a16207" stroke-width="7" stroke-linecap="round"/>`).join('')}
    <path d="M300 652L720 622" stroke="#ca8a04" stroke-width="11" stroke-linecap="round"/>
    <path d="M300 662L720 632" stroke="#a16207" stroke-width="8" stroke-linecap="round"/>
    <path d="M306 606L716 576" stroke="#ca8a04" stroke-width="6" stroke-linecap="round"/>
    <g fill="#854d0e">${[350, 430, 510, 590, 670].map((x) => `<rect x="${x - 1.5}" y="${f(dek(x) - 6)}" width="3" height="11"/>`).join('')}</g>`
  const isi = `
  <defs>
    <linearGradient id="langit" x1="0" y1="0" x2="0" y2="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d9f99d"/><stop offset=".7" stop-color="#fef9c3"/><stop offset="1" stop-color="#fde68a"/></linearGradient>
    <radialGradient id="mentari"><stop offset="0" stop-color="#fff7cc"/><stop offset=".5" stop-color="#fde68a"/><stop offset="1" stop-color="#fde68a" stop-opacity="0"/></radialGradient>
    <linearGradient id="sungai" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0284c7"/></linearGradient>
    <linearGradient id="bulu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3913f"/><stop offset="1" stop-color="#b45f1b"/></linearGradient>
    <linearGradient id="buaya" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#65a30d"/><stop offset="1" stop-color="#3f6212"/></linearGradient>
    <linearGradient id="tebing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#84cc16"/><stop offset=".25" stop-color="#65a30d"/><stop offset="1" stop-color="#3f6212"/></linearGradient>
    <linearGradient id="rumput" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16a34a"/><stop offset="1" stop-color="#14532d"/></linearGradient>
    <filter id="bayang"><feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#14532d" flood-opacity=".35"/></filter>
  </defs>
  <rect width="800" height="1200" fill="url(#langit)"/>
  <circle cx="590" cy="420" r="150" fill="url(#mentari)"/>
  ${awan}
  <path d="${punggung([[0, 470], [120, 446], [260, 466], [400, 438], [540, 462], [680, 440], [800, 460]])}" fill="#bef264"/>
  ${rumah}
  <path d="${punggung([[0, 530], [140, 508], [300, 530], [460, 506], [620, 526], [800, 508]])}" fill="#a3e635"/>
  <g fill="none" stroke="#65a30d" stroke-width="3" stroke-opacity=".55">${[0, 1, 2, 3].map((i) => `<path d="M${430 + i * 10} ${530 + i * 14}Q620 ${518 + i * 12} 820 ${530 + i * 16}"/>`).join('')}</g>
  ${kelapa(60, 600, 1)}${kelapa(744, 590, 0.9)}${kelapa(676, 600, 0.7)}
  <path d="M0 580C160 566 300 590 440 578C580 566 690 586 800 574V600H0Z" fill="#84cc16"/>
  <path d="M0 596C140 584 260 604 400 596C540 588 660 606 800 594V800H0Z" fill="url(#sungai)"/>
  <g stroke="#e0f2fe" stroke-width="3" stroke-linecap="round" opacity=".75"><line x1="440" y1="700" x2="490" y2="700"/><line x1="560" y1="740" x2="620" y2="740"/><line x1="660" y1="690" x2="700" y2="690"/><line x1="380" y1="760" x2="420" y2="760"/></g>
  <path d="M640 618C680 606 740 604 800 602V640C760 640 700 640 650 636Z" fill="#65a30d"/>
  <g filter="url(#bayang)">${jembatan}</g>
  <g filter="url(#bayang)">${buaya}</g>
  <path d="M0 656C90 646 200 650 320 664C340 700 350 760 380 800C330 830 200 850 0 846Z" fill="url(#tebing)"/>
  <path d="M0 656C90 646 200 650 320 664" fill="none" stroke="#bef264" stroke-width="4" stroke-linecap="round"/>
  <g filter="url(#bayang)">${tokoh}</g>
  <path d="M-10 138Q400 236 810 150" fill="none" stroke="#65a30d" stroke-width="2.5"/>
  ${titik}
  <path d="M0 860C100 828 200 846 300 836C420 822 520 856 640 842C720 834 770 842 800 838V1200H0Z" fill="url(#rumput)"/>
  ${Array.from({ length: 22 }, (_, i) => daun(20 + i * 36 + r() * 10, 860 + r() * 16, 30 + r() * 26, 7, -70 - r() * 40, i % 2 ? '#22c55e' : '#15803d')).join('')}`
  const judul = `<g text-anchor="middle" font-family="Fredoka" stroke="#14532d" stroke-linejoin="round" paint-order="stroke" transform="rotate(-3 400 960)">
    <text x="400" y="868" font-weight="500" font-size="27" stroke-width="0" fill="#fef9c3">Hari raya sudah dekat. Buayanya masih ingat.</text>
    <text x="400" y="976" font-weight="700" font-size="128" stroke-width="16" fill="#ffffff">Kancil</text>
    <text x="400" y="1044" font-weight="700" font-size="62" stroke-width="12" fill="#d9f99d">Pulang Kampung</text>
  </g>`
  return bingkai({ film, nama: 'Studio Animasi Pematang', gelap: '#0b2e17', isi, judul, grain: 0.22, kaki: 0.7 })
}

const ADEGAN = { 'gerhana-terakhir': gerhana, 'senandung-hujan': hujan, 'jejak-di-rimba': rimba, 'kunci-lantai-tiga': lantaiTiga, 'kancil-pulang': kancil }
const FONTS = 'family=Barlow+Condensed:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Unbounded:wght@800&family=IBM+Plex+Mono:wght@500&family=Fraunces:ital,opsz,wght@1,9..144,400;1,9..144,600&family=Big+Shoulders+Stencil+Display:wght@800;900&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&family=Fredoka:wght@500;700&family=Caveat:wght@700&family=Special+Elite&family=Outfit:wght@500;600;800'

// data film dibaca dari lib/data.js (tanpa menjalankan Next): cukup ambil objek films
async function muatFilm(akar) {
  const src = readFileSync(path.join(akar, 'lib/data.js'), 'utf8')
  const blok = src.slice(src.indexOf('export const films = ['), src.indexOf('];', src.indexOf('export const films = [')) + 1)
  return Function(`return ${blok.replace('export const films = ', '')}`)()
}

const akar = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..')
const keluar = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : path.join(akar, '.poster-html'))
mkdirSync(keluar, { recursive: true })

// Font diunduh sekali ke <keluar>/fonts (woff2 + fonts.css) supaya Chrome tidak perlu jaringan saat merender.
async function siapkanFont() {
  const dir = path.join(keluar, 'fonts')
  if (existsSync(path.join(dir, 'fonts.css'))) return
  mkdirSync(dir, { recursive: true })
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  const get = async (u) => { const res = await fetch(u, { headers: { 'User-Agent': UA } }); if (!res.ok) throw new Error(`${res.status} ${u}`); return res }
  let css = await (await get(`https://fonts.googleapis.com/css2?${FONTS}&display=block`)).text()
  const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((m) => m[1]))]
  for (const [i, u] of urls.entries()) {
    writeFileSync(path.join(dir, `f${i}.woff2`), Buffer.from(await (await get(u)).arrayBuffer()))
    css = css.split(u).join(`f${i}.woff2`)
  }
  writeFileSync(path.join(dir, 'fonts.css'), css)
}
await siapkanFont()
const films = await muatFilm(akar)
for (const film of films) {
  const svg = ADEGAN[film.id](film)
  writeFileSync(path.join(keluar, `${film.id}.svg`), svg)
  writeFileSync(path.join(keluar, `${film.id}.html`), `<!doctype html><html><head><meta charset="utf-8"><link href="fonts/fonts.css" rel="stylesheet"><style>html,body{margin:0;background:#000}svg{display:block}</style></head><body>${svg}</body></html>`)
}
console.log(`${films.length} poster -> ${keluar}`)

if (process.argv.includes('--render')) {
  const sharp = createRequire(path.join(akar, 'package.json'))('sharp')
  const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const tujuan = path.join(akar, 'public/images/poster')
  mkdirSync(tujuan, { recursive: true })
  for (const film of films) {
    const png = path.join(keluar, `${film.id}.png`)
    execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=800,1200', '--virtual-time-budget=15000',
      '--allow-file-access-from-files', `--screenshot=${png}`, 'file://' + path.join(keluar, `${film.id}.html`)], { stdio: 'ignore' })
    await sharp(png).resize(800, 1200, { fit: 'cover', position: 'top' }).webp({ quality: 82, effort: 6 }).toFile(path.join(tujuan, `${film.id}.webp`))
    console.log('->', path.join(tujuan, `${film.id}.webp`))
  }
}

// Gambar Open Graph situs: lima poster berkipas + nama bioskop (memakai poster WebP yang sudah ada).
if (process.argv.includes('--og')) {
  const sharp = createRequire(path.join(akar, 'package.json'))('sharp')
  const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  const src = readFileSync(path.join(akar, 'lib/data.js'), 'utf8')
  const tagline = src.match(/tagline: '([^']+)'/)[1]
  const kipas = [[-10, 735, 222], [-5, 820, 200], [0, 908, 186], [5, 996, 200], [10, 1081, 222]]
  const urut = [0, 4, 1, 3, 2] // poster tengah paling atas
  const kursi = Array.from({ length: 12 }, (_, i) => `<span class="k${i === 6 || i === 7 ? ' p' : i % 5 === 2 ? ' t' : ''}"></span>${i === 5 ? '<i></i>' : ''}`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><link href="fonts/fonts.css" rel="stylesheet"><style>
    html,body{margin:0}body{width:1200px;height:630px;overflow:hidden;background:#0a0a12;font-family:Outfit,sans-serif;color:#f4f2fa;position:relative}
    .layar{position:absolute;left:120px;right:120px;top:0;height:6px;border-radius:0 0 6px 6px;background:linear-gradient(90deg,rgba(251,191,36,.1),#fbbf24,rgba(251,191,36,.1));box-shadow:0 6px 60px 10px rgba(245,158,11,.45)}
    .cahaya{position:absolute;inset:0;background:radial-gradient(60% 70% at 70% 0%,rgba(245,158,11,.22),transparent 70%)}
    .kiri{position:absolute;left:72px;top:132px;width:500px}
    .logo{width:72px;height:72px;border-radius:18px;background:#f59e0b;display:flex;align-items:center;justify-content:center}
    h1{margin:30px 0 0;font-weight:800;font-size:78px;line-height:.95;letter-spacing:-1.5px}
    .sub{margin:18px 0 0;font-weight:600;font-size:32px;color:#fbbf24}
    .tag{margin:10px 0 0;font-weight:500;font-size:24px;color:rgba(244,242,250,.78)}
    .kursi{margin-top:44px;display:flex;gap:7px;align-items:center}.kursi span{width:22px;height:22px;border-radius:6px 6px 3px 3px;background:rgba(255,255,255,.22)}
    .kursi span.t{background:rgba(255,255,255,.09)}.kursi span.p{background:#f59e0b}.kursi i{width:14px}
    img{position:absolute;width:180px;height:270px;border-radius:12px;box-shadow:0 24px 50px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.12);transform-origin:50% 100%}
  </style></head><body><div class="cahaya"></div><div class="layar"></div>
  <div class="kiri"><div class="logo"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z"/><path d="m6.2 5.3 3.1 3.9"/><path d="m12.4 3.4 3.1 4"/><path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg></div>
  <h1>Bioskop Kelir</h1><p class="sub">Pesan tiket dan pilih kursi</p><p class="tag">${esc(tagline)}</p><div class="kursi">${kursi}</div></div>
  ${urut.map((i) => { const [rot, x, y] = kipas[i]; return `<img src="file://${path.join(akar, 'public/images/poster', films[i].id + '.webp')}" style="left:${x - 90}px;top:${y}px;transform:rotate(${rot}deg)${i === 2 ? ' scale(1.08)' : ''}">` }).join('')}
  </body></html>`
  writeFileSync(path.join(keluar, 'og.html'), html)
  const png = path.join(keluar, 'og.png')
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1200,630', '--virtual-time-budget=15000',
    '--allow-file-access-from-files', `--screenshot=${png}`, 'file://' + path.join(keluar, 'og.html')], { stdio: 'ignore' })
  await sharp(png).resize(1200, 630, { fit: 'cover', position: 'top' }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(akar, 'public/og.jpg'))
  console.log('->', path.join(akar, 'public/og.jpg'))
}
