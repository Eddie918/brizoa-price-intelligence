const smallWords = new Set(['a','al','con','de','del','el','en','la','las','los','para','por','un','una','y']);

export function cleanAmazonTitle(value: string) {
  const decoded = (() => { try { return decodeURIComponent(value); } catch { return value; } })();
  const words = decoded
    .replace(/[\-_+|]+/g, ' ')
    .replace(/[^\p{L}\p{N}&.'’ ]+/gu, ' ')
    .replace(/\b(ref|qid|sr|keywords)\b.*$/i, '')
    .replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  return words.map((word, index) => {
    if (/^[A-Z0-9]{2,}$/.test(word)) return word;
    const lower = word.toLocaleLowerCase('es-MX');
    if (index > 0 && smallWords.has(lower)) return lower;
    return lower.charAt(0).toLocaleUpperCase('es-MX') + lower.slice(1);
  }).join(' ').slice(0, 150);
}

export function titleFromAmazonInput(input: string): string | null {
  if (!/^https:\/\//i.test(input.trim())) return null;
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }
  if (!['amazon.com.mx','www.amazon.com.mx'].includes(url.hostname.toLowerCase()) || url.port || url.username || url.password) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  const dp = parts.findIndex(part => part.toLowerCase() === 'dp');
  if (dp < 1) return null;
  const slug = parts[dp - 1];
  if (/^[A-Z0-9]{10}$/i.test(slug)) return null;
  const title = cleanAmazonTitle(slug);
  return title.length >= 2 ? title : null;
}

export function guessCategory(title: string) {
  const value = title.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  if (/(lego|juguete|figura|muneca|rompecabezas|juego)/.test(value)) return 'Juguetes' as const;
  if (/(libro|novela|kindle|comic|manual)/.test(value)) return 'Libros' as const;
  if (/(cafe|cocina|hogar|sarten|olla|taza|aspiradora|mueble)/.test(value)) return 'Hogar' as const;
  if (/(ropa|zapato|tenis|camisa|bolsa|reloj)/.test(value)) return 'Estilo' as const;
  if (/(audifono|laptop|telefono|tablet|monitor|teclado|mouse|camara|electron)/.test(value)) return 'Tecnología' as const;
  return 'Otros' as const;
}
