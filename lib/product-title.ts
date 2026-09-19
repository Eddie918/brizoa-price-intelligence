const separators = /\s+(?:[-–—|•])\s+|;/;

export function compactProductTitle(value: string, maxLength = 78) {
  const source = value.normalize('NFKC').replace(/[®™©]/g, '').replace(/\s+/g, ' ').trim();
  if (!source) return 'Producto de Amazon';
  const productCode = [...source.matchAll(/\b(?=[A-Z0-9-]{5,12}\b)(?=[A-Z0-9-]*\d)[A-Z0-9-]+\b/gi)].at(-1)?.[0];
  const firstClause = source.split(separators).map(part => part.trim()).find(part => part.split(/\s+/).length >= 3) ?? source;
  let title = firstClause.replace(/[,:;\-–—]+$/g, '').trim();
  if (title.length > maxLength) {
    const words = title.split(' '); title = '';
    for (const word of words) { if (`${title} ${word}`.trim().length > maxLength) break; title = `${title} ${word}`.trim(); }
  }
  if (productCode && !title.toUpperCase().includes(productCode.toUpperCase()) && title.length + productCode.length + 3 <= maxLength + 12) title += ` · ${productCode}`;
  return title || source.slice(0, maxLength).trim();
}
