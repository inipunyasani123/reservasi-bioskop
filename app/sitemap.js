import { films } from '@/lib/data';

const URL = 'https://reservasi-bioskop.pintuweb.id';

export default function sitemap() {
  const now = new Date();
  return ['', '/film', ...films.map((f) => `/film/${f.id}`)].map((p) => ({ url: URL + p, lastModified: now, changeFrequency: 'weekly', priority: p ? 0.7 : 1 }));
}
