/** @type {import('next').NextConfig} */
// Gambar statis: kuota Image Optimization Vercel tim habis (Okt 2026), jadi next/image memakai varian WebP
// siap pakai di public/_img/ lewat image-loader.js, bukan /_next/image.
// Setelah menambah atau mengganti gambar (mis. poster film): node scripts/static-images.mjs . --dirs public/images
const nextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './image-loader.js',
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  async headers() {
    return [{ source: '/_img/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }];
  },
};

export default nextConfig;
