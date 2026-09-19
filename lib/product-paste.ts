import { titleFromAmazonInput, cleanAmazonTitle } from './amazon.ts';

export function productPaste(raw: string) {
  const value = raw.trim();
  const match = value.match(/https:\/\/(?:www\.)?amazon\.com\.mx\/[^\s<>"\u201d]+/i);
  if (!match) return { input: value, title: null as string | null };
  const input = match[0].replace(/[),.;]+$/, '');
  let url: URL;
  try { url = new URL(input); } catch { return {input:value,title:null}; }
  if (!['amazon.com.mx','www.amazon.com.mx'].includes(url.hostname) || url.username || url.password || url.port) return {input:value,title:null};
  const fromUrl = titleFromAmazonInput(input);
  const shared = value.replace(match[0], '').split(/\r?\n/).map(s=>s.trim()).find(s=>s.length>3 && !/^https?:/i.test(s));
  return { input, title: fromUrl ?? (shared ? cleanAmazonTitle(shared).slice(0,100) : null) };
}
