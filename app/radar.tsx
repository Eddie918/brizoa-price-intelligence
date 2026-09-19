'use client';

import { PurchasePause } from '../components/purchase-pause';
import { productPaste } from '../lib/product-paste';
import { PurchaseSimulator } from '../components/purchase-simulator';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bell, Plus, Search, ArrowDownRight, ArrowUpRight, ArrowRight, Headphones, Coffee, BookOpen, Package, Pause, Play, Archive, Info, Check, CircleHelp, Loader2, X, ScanLine, ShieldCheck, Pencil, ExternalLink, Gamepad2, House, Laptop, Shirt, Sparkles, Code2, Mail, BriefcaseBusiness, TrendingDown, Activity, CalendarDays, Download, RefreshCw, Trash2, Moon, Sun, Gauge } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Toaster, toast } from 'sonner';
import { demoItems, DEMO_AS_OF, type Item } from '@/lib/demo';
import { parseAmazonInput, type Verdict } from '@/lib/recommendation';
import { titleFromAmazonInput, guessCategory } from '@/lib/amazon';

const money = (minor: number | null) => minor == null ? '—' : new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(minor / 100);
const labels: Record<Verdict, string> = { buy: 'Buen momento', wait: 'Conviene esperar', neutral: 'Precio habitual', insufficient: 'Sin datos suficientes', stale: 'Precio por actualizar', unavailable: 'Sin existencias', verify: 'Necesita verificación' };
const categories = ['Tecnología','Hogar','Juguetes','Libros','Estilo','Otros'] as const;
const CategoryIcon = ({ category, size = 25 }: { category: string; size?: number }) => category.includes('Tecnología') || category.includes('Audio') ? <Laptop size={size}/> : category.includes('Hogar') ? <House size={size}/> : category.includes('Juguetes') ? <Gamepad2 size={size}/> : category.includes('Libros') ? <BookOpen size={size}/> : category.includes('Estilo') ? <Shirt size={size}/> : <Package size={size}/>;
const ProductVisual = ({ item, compact = false }: { item: Item; compact?: boolean }) => <span className={`product-visual ${compact ? 'compact' : ''} visual-${categories.indexOf(item.category as typeof categories[number]) + 1}`} aria-hidden="true">{item.imageUrl ? <img src={item.imageUrl} alt="" referrerPolicy="no-referrer" /> : <><CategoryIcon category={item.category}/><b>{item.title.slice(0,1).toUpperCase()}</b></>}</span>;
const quantile = (xs: number[], q: number) => { if (!xs.length) return null; const a=[...xs].sort((x,y)=>x-y); const pos=(a.length-1)*q; const base=Math.floor(pos); return a[base]+(a[base+1] !== undefined ? (a[base+1]-a[base])*(pos-base) : 0); };


export default function Radar({ request = globalThis.fetch, demo = false, demoTools }: { request?: typeof fetch; demo?: boolean; demoTools?: React.ReactNode }) {
  const fetch = request;
  const [items, setItems] = useState<Item[]>(demoItems());
  const [selected, setSelected] = useState('preview-audio');
  const [tab, setTab] = useState('products');
  const [range, setRange] = useState('90');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [category, setCategory] = useState<typeof categories[number]>('Tecnología');
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<typeof categories[number]>('Otros');
  const [inputError, setInputError] = useState('');
  const [target, setTarget] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [readOnly, setReadOnly] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [events, setEvents] = useState<{ id: string; title: string; price_minor: number; created_at: string }[]>([]);
  const [dark, setDark] = useState(false);
  const attemptedRefresh = useRef(new Set<string>());

  useEffect(() => { const saved = localStorage.getItem('brizoa-theme'); setDark(saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches); }, []);
  useEffect(() => { document.body.classList.toggle('brizoa-dark', dark); return () => document.body.classList.remove('brizoa-dark'); }, [dark]);
  function toggleTheme() { setDark(value => { const next=!value; localStorage.setItem('brizoa-theme', next ? 'dark' : 'light'); return next; }); }

  const reload = useCallback(async () => {
    try {
      const response = await fetch('/api/watchlist', { cache: 'no-store' });
      const result = await response.json() as { items: Item[]; readOnly: boolean; events?: { id: string; title: string; price_minor: number; created_at: string }[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'No pudimos cargar tu lista.');
      setItems(result.items); setReadOnly(result.readOnly); setEvents(result.events ?? []); setLoadError('');
      setSelected(prev => result.items.some((p: Item) => p.id === prev) ? prev : result.items.find((p: Item) => p.status !== 'archived')?.id ?? result.items[0]?.id ?? '');
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'No pudimos cargar tu lista.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const active = items.find(p => p.id === selected);
  useEffect(() => { setTarget(active?.targetMinor == null ? '' : String(active.targetMinor / 100)); }, [active?.id, active?.targetMinor]);

  const patch = useCallback(async (id: string, changes: Record<string, unknown>) => {
    if (readOnly) { toast.error('Inicia sesión en tu espacio privado para guardar cambios.'); return false; }
    setSaving(true);
    try {
      const res = await fetch(`/api/watchlist/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
      const data = await res.json() as { error?: string; id: string; existing?: boolean; status?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se guardó el cambio.');
      await reload(); toast.success(changes.refresh_amazon ? 'Ficha y precio actualizados' : 'Cambio guardado'); return true;
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Inténtalo de nuevo.'); return false; }
    finally { setSaving(false); }
  }, [readOnly, reload]);

  useEffect(() => {
    if (demo || loading || readOnly || !active || active.demoKey || active.metadataStatus === 'apify' || attemptedRefresh.current.has(active.id)) return;
    attemptedRefresh.current.add(active.id);
    toast.info('Conectando la ficha con Amazon…');
    void patch(active.id, { refresh_amazon: true });
  }, [active, loading, patch, readOnly]);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault(); setInputError('');
    if (name.trim() && name.trim().length < 2) { setInputError('Escribe al menos dos caracteres o déjalo vacío.'); return; }
    try { parseAmazonInput(input); } catch (err) { setInputError((err as Error).message); return; }
    if (readOnly) { setInputError('Inicia sesión desde tu espacio privado para guardar productos.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, title: name.trim() || 'Producto por identificar', category }) });
      const data = await res.json() as { error?: string; id: string; existing?: boolean; status?: string; dataStatus?: string; providerError?: string | null };
      if (!res.ok) throw new Error(data.error ?? 'No se pudo agregar.');
      await reload(); setSelected(data.id); setTab(data.status === 'archived' ? 'archive' : 'products'); setAddOpen(false); setInput(''); setName(''); setNameTouched(false); setCategory('Tecnología');
      if (data.providerError) toast.warning(`Producto guardado, pero no se pudo obtener la ficha: ${data.providerError}`);
      else toast.success(data.existing ? 'Este producto ya está en tu radar' : data.dataStatus === 'provider' ? 'Producto y precio conectados' : 'Producto agregado al radar');
    } catch (e) { setInputError((e as Error).message); }
    finally { setSaving(false); }
  }
  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); if (!active || editName.trim().length < 2) return;
    if (await patch(active.id, { title: editName.trim(), category: editCategory })) setEditOpen(false);
  }
  function openProfile() { if (!active) return; setEditName(active.title); setEditCategory(categories.includes(active.category as typeof categories[number]) ? active.category as typeof categories[number] : 'Otros'); setEditOpen(true); }
  async function saveTarget(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(target);
    if (!target || !Number.isFinite(value) || value <= 0 || value > 10000000 || !/^\d+(\.\d{1,2})?$/.test(target)) { toast.error('Escribe un importe positivo con hasta 2 decimales.'); return; }
    if (active) await patch(active.id, { target_minor: Math.round(value * 100), status: 'active' });
  }
  async function deleteProduct() {
    if (!active || active.demoKey || readOnly) return;
    if (!window.confirm(`¿Eliminar “${active.title}” y todo su historial? Esta acción no se puede deshacer.`)) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/watchlist/${encodeURIComponent(active.id)}`, { method: 'DELETE' });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'No se pudo eliminar.');
      await reload(); toast.success('Producto e historial eliminados');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'No se pudo eliminar.'); }
    finally { setSaving(false); }
  }
  function updateAmazonInput(value: string) {
    const pasted = productPaste(value);
    setInput(pasted.input); setInputError('');
    if (!nameTouched) {
      setName(pasted.title ?? '');
      setCategory(pasted.title ? guessCategory(pasted.title) : 'Otros');
    }
  }


  const followed = items.filter(p => p.status !== 'archived');
  const good = followed.filter(p => p.recommendation.action === 'buy' && p.status === 'active').length;
  const visible = items.filter(p => (tab === 'archive' ? p.status === 'archived' : p.status !== 'archived') && (!query || (p.title + p.externalId).toLowerCase().includes(query.toLowerCase())) && (filter !== 'buy' || p.recommendation.action === 'buy'));
  const r = active?.recommendation;
  const chartData = active?.observations.slice(-Math.min(Number(range), active.observations.length)).map(o => ({ day: o.at.slice(5, 10).split('-').reverse().join('/'), price: o.totalMinor / 100 })) ?? [];
  const chartPrices = chartData.map(d => d.price); const q25 = quantile(chartPrices,.25); const q75 = quantile(chartPrices,.75); const rangeMedian = quantile(chartPrices,.5);
  const rangeMin = chartPrices.length ? Math.min(...chartPrices) : null; const rangeMax = chartPrices.length ? Math.max(...chartPrices) : null;
  const rangeDifference = r?.current != null && rangeMedian ? ((r.current / 100 - rangeMedian) / rangeMedian) * 100 : null;
  const recent = chartPrices.slice(-14); const previous = chartPrices.slice(-28,-14); const avg = (v:number[]) => v.length ? v.reduce((a,b)=>a+b,0)/v.length : 0;
  const trend = previous.length ? ((avg(recent)-avg(previous))/avg(previous))*100 : null;
  const volatility = chartPrices.length ? Math.sqrt(chartPrices.reduce((a,b)=>a+(b-avg(chartPrices))**2,0)/chartPrices.length)/avg(chartPrices)*100 : null;
  const opportunityDays = r?.median ? chartPrices.filter(v => v <= r.median!/100*.97).length : 0;
  const freshnessHours = active?.refreshedAt ? Math.max(0, (Date.now() - Date.parse(active.refreshedAt)) / 3_600_000) : Infinity;
  const evidenceScore = active?.demoKey ? 92 : Math.round(Math.min(100, Math.min(60, (r?.days ?? 0) * 2) + (freshnessHours <= 24 ? 25 : freshnessHours <= 72 ? 15 : 0) + (r?.current != null ? 15 : 0)));
  const evidenceLabel = evidenceScore >= 80 ? 'Alta' : evidenceScore >= 45 ? 'Media' : 'Inicial';
  const trackedValue = followed.reduce((sum, item) => sum + (item.recommendation.current ?? 0), 0);
  const potentialSaving = followed.reduce((sum, item) => sum + Math.max(0, (item.recommendation.median ?? 0) - (item.recommendation.current ?? 0)), 0);

  useEffect(() => {
    type Registry = { registerTool: (t: unknown, options: { signal: AbortSignal }) => void | Promise<void> };
    const registry = (document as Document & { modelContext?: Registry }).modelContext;
    if (!registry) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(registry.registerTool({ name: 'brizoa_filter_watchlist', description: 'Filtra los productos visibles de Brizoa por nombre. No modifica datos guardados.', inputSchema: { type: 'object', properties: { query: { type: 'string', maxLength: 150 } }, required: ['query'], additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: true }, execute: async (input: unknown) => { if (!input || typeof input !== 'object' || !('query' in input) || typeof input.query !== 'string' || input.query.length > 150 || Object.keys(input).some(k => k !== 'query')) throw new Error('Se requiere query de hasta 150 caracteres.'); setQuery(input.query); setFilter('all'); setTab('products'); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); return { applied: true, query: input.query }; } }, { signal: lifecycle.signal })).catch(() => {}); } catch {}
    return () => lifecycle.abort();
  }, []);

  return <div className={`app-shell ${dark ? 'theme-dark' : ''}`}>
    <Toaster position="bottom-right" richColors />
    <header className="topbar"><a href="./" className="wordmark" aria-label="Brizoa, inicio"><img className="logo-lockup" src="./brizoa-logo-inverse.svg" alt="Brizoa" width="164" height="42" /></a><span className="brand-descriptor">COMPRA CON PERSPECTIVA</span><nav className="side-nav" aria-label="Navegación principal"><button aria-current={tab === 'products' ? 'page' : undefined} onClick={() => setTab('products')}><ScanLine size={19} /> Mi radar <span>{followed.length}</span></button><button aria-current={tab === 'alerts' ? 'page' : undefined} onClick={() => setTab('alerts')}><Bell size={19} /> Alertas <span>{events.length || ''}</span></button><button aria-current={tab === 'archive' ? 'page' : undefined} onClick={() => setTab('archive')}><Archive size={19} /> Archivados</button></nav><button className="theme-toggle" onClick={toggleTheme} aria-label={dark ? 'Usar modo claro' : 'Usar modo oscuro'} title={dark ? 'Modo claro' : 'Modo oscuro'}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="side-bottom"><div className="brand-statement">El momento<br/>también importa<span>.</span></div><button className="plain-button about-button" onClick={() => setAboutOpen(true)}><CircleHelp size={18} /> Cómo decidimos</button><div className="private-label"><ShieldCheck size={16} />{demo ? 'Demo local' : readOnly ? 'Vista de ejemplo' : 'Espacio privado'}</div></div></header>
    <main className="workspace">
      {demo && <p className="demo-caption" role="status">Demo interactivo · Ejemplos identificados · Guardado en este navegador</p>}
      {demo && demoTools}
      <section className="page-heading"><div><p className="eyebrow">TU ESPACIO PERSONAL</p><h1>Menos dudas.<br/><span>Mejores compras.</span></h1><p>Sigue lo que quieres. Decide con contexto.</p></div><div className="heading-actions"><button className="primary-button" onClick={() => setAddOpen(true)}><Plus size={19} /> Agregar producto</button></div></section>
      <section className="portfolio-strip" aria-label="Resumen de tu radar"><div><span>Valor observado</span><strong>{money(trackedValue)}</strong></div><div><span>Ahorro frente a mediana</span><strong>{money(potentialSaving)}</strong></div><div><span>Oportunidades activas</span><strong>{good}</strong></div><div><span>Cobertura real</span><strong>{followed.filter(item => !item.demoKey && item.metadataStatus === 'apify').length}<small> / {followed.filter(item => !item.demoKey).length}</small></strong></div></section>
      {loadError && <div className="error-banner" role="alert">{loadError} <button onClick={() => void reload()}>Reintentar</button></div>}
      <Tabs value={tab} onValueChange={v => { setTab(v); setFilter('all'); setQuery(''); }}>
        <div className="nav-row"><h2 className="section-label">{tab === 'products' ? 'Mi radar' : tab === 'alerts' ? 'Alertas' : 'Archivados'} <span>{tab === 'products' ? followed.length : ''}</span></h2><TabsList variant="line" className="main-tabs"><TabsTrigger value="products">Mis productos <span className="tab-count">{followed.length}</span></TabsTrigger><TabsTrigger value="alerts"><Bell size={16} /> Alertas</TabsTrigger><TabsTrigger value="archive">Archivados</TabsTrigger></TabsList><span className="sync-state">{loading ? <><Loader2 size={14} className="spin" /> Cargando…</> : <><Check size={14} /> {readOnly ? 'Explora la demostración' : 'Lista guardada'}</>}</span></div>
        <TabsContent value="products"><div className="radar-grid"><aside className="product-list"><div className="list-toolbar"><label className="search-field"><Search size={17} /><input aria-label="Buscar en mis productos" placeholder="Buscar en tu radar" value={query} onChange={e => setQuery(e.target.value)} />{query && <button onClick={() => setQuery('')} aria-label="Limpiar búsqueda"><X size={15} /></button>}</label><div className="filters"><button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todos</button><button aria-pressed={filter === 'buy'} onClick={() => setFilter('buy')}><ArrowDownRight size={14} /> Buen momento <span>{good}</span></button></div></div><div className="product-rows">{visible.map(p => <button key={p.id} onClick={() => setSelected(p.id)} className={`product-row ${selected === p.id ? 'selected' : ''}`}><ProductVisual item={p} compact /><span className="product-content"><span className="product-category">{p.category}</span><strong>{p.title}</strong><span className="price-line"><span>{money(p.recommendation.current)}</span><span className={`status-label ${p.status === 'paused' ? '' : p.recommendation.action}`}>{p.status === 'paused' ? 'Pausado' : labels[p.recommendation.action]}</span></span></span></button>)}</div>{!visible.length && <div className="empty-state"><Search size={30} /><h3>{query ? 'Sin coincidencias' : 'Tu radar tiene espacio'}</h3><p>{query ? 'Prueba con otro nombre o ASIN.' : 'Agrega un producto para empezar a seguirlo.'}</p></div>}<div className="list-note"><img src="./brizoa-symbol.svg" width="92" height="92" alt="Alebrije de Brizoa" /><div><strong>Comprar bien también es esperar.</strong><p>Tu alebrije te ayuda a ver el contexto, sin presionarte.</p></div></div></aside><section className="detail-panel" aria-label="Detalle del producto seleccionado">{active && active.status !== 'archived' ? <>
          <div className="detail-title"><div className="detail-identity"><ProductVisual item={active}/><div><span className="eyebrow">{active.demoKey ? 'PRODUCTO DE DEMOSTRACIÓN' : active.metadataStatus === 'apify' ? 'FICHA VERIFICADA POR PROVEEDOR' : active.metadataStatus === 'imported' ? 'HISTORIAL IMPORTADO' : demo ? 'FICHA LOCAL · SIN CONSULTA A AMAZON' : 'PENDIENTE DE CONECTAR'}</span><h2>{active.title}</h2><p>{active.category} <span>·</span> {active.demoKey ? 'Vendedor de ejemplo · Producto nuevo' : active.externalId}</p></div></div><div className="detail-actions">{!demo && !active.demoKey && <button className="icon-button" title="Actualizar ficha (máximo una vez cada 24 h)" aria-label="Actualizar ficha del producto" disabled={saving} onClick={() => void patch(active.id, { refresh_amazon: true })}>{saving ? <Loader2 className="spin" size={18}/> : <RefreshCw size={18}/>}</button>}{!active.demoKey && <button className="icon-button" title="Editar ficha" aria-label="Editar ficha del producto" onClick={openProfile}><Pencil size={18}/></button>}{active.url && <a className="icon-button" href={active.url} target="_blank" rel="noopener noreferrer" title="Abrir producto" aria-label="Abrir producto en Amazon México"><ExternalLink size={18}/></a>}<button className="icon-button" title="Archivar producto" aria-label="Archivar producto" disabled={saving} onClick={() => void patch(active.id, { status: 'archived' })}><Archive size={19} /></button>{!active.demoKey && <button className="icon-button danger" title="Eliminar producto e historial" aria-label="Eliminar producto e historial" disabled={saving} onClick={() => void deleteProduct()}><Trash2 size={18}/></button>}</div></div>
          <div className="analysis-main">
          <div className="price-overview"><div><span className="muted">{active.demoKey ? 'Precio del ejemplo' : 'Precio actual'}</span><div className="current-price">{money(r!.current)}<span>MXN</span></div><p>{active.demoKey ? 'Envío incluido en el ejemplo' : r!.current == null ? 'Todavía no hay un precio verificado' : `Actualizado ${active.refreshedAt ? new Date(active.refreshedAt).toLocaleString('es-MX') : 'recientemente'}`}</p></div>{rangeDifference != null && <div className={`difference ${rangeDifference > 0 ? 'positive' : ''}`}><strong>{rangeDifference > 0 ? '+' : '−'}{Math.abs(rangeDifference).toFixed(1)}%</strong><span>frente a la mediana de {range} días</span></div>}</div>
          <div className="chart-header"><h3>Historial de precio</h3><Tabs value={range} onValueChange={setRange}><TabsList className="range-tabs">{['30', '90', '365'].map(d => <TabsTrigger key={d} value={d}>{d} días</TabsTrigger>)}</TabsList></Tabs></div>
          {chartData.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={232}><AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}><defs><linearGradient id="priceFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#276653" stopOpacity={.16} /><stop offset="100%" stopColor="#276653" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9e9f0" strokeDasharray="3 4" /><XAxis dataKey="day" tickLine={false} axisLine={false} minTickGap={50} tick={{ fontSize: 12, fill: '#5c6864' }} /><YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={65} tick={{ fontSize: 12, fill: '#5c6864' }} tickFormatter={v => `$${Number(v).toLocaleString('es-MX')}`} />{q25 != null && q75 != null && <ReferenceArea y1={q25} y2={q75} fill="#d7f369" fillOpacity={.16} strokeOpacity={0}/>}<Tooltip formatter={v => [money(Number(v) * 100), 'Precio observado']} contentStyle={{ borderRadius: 12, border: '1px solid #e6e6ef' }} />{rangeMedian != null && <ReferenceLine y={rangeMedian} stroke="#7b8983" strokeDasharray="5 5" />}<Area type="linear" dataKey="price" stroke="#276653" strokeWidth={2.5} fill="url(#priceFade)" isAnimationActive={false} /></AreaChart></ResponsiveContainer></div> : <div className="chart-empty"><Package size={32} /><p>Aún no hay observaciones fechadas. Un precio actual no permite reconstruir el pasado.</p></div>}
          <div className="chart-legend"><span><i /> Total observado</span><span><i className="dashed" /> Mediana del periodo</span><span>{range === '365' && active.demoKey ? 'Disponibles: 90 días de ejemplo' : active.demoKey ? 'Misma variante y vendedor' : chartPrices.length ? `${chartPrices.length} observaciones` : 'Sin historial'}</span></div>
          <div className="stats-row"><div><span>Mínimo · {range} días</span><strong>{money(rangeMin == null ? null : rangeMin * 100)}</strong></div><div><span>Mediana · {range} días</span><strong>{money(rangeMedian == null ? null : rangeMedian * 100)}</strong></div><div><span>Máximo · {range} días</span><strong>{money(rangeMax == null ? null : rangeMax * 100)}</strong></div><div><span>Observaciones</span><strong>{chartPrices.length}<small> / {range}</small></strong></div></div><section className="pattern-panel"><div><TrendingDown/><span>Tendencia · 14 días</span><strong>{trend == null ? '—' : `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}</strong></div><div><Activity/><span>Variación del periodo</span><strong>{volatility == null ? '—' : volatility < 6 ? 'Estable' : volatility < 12 ? 'Variable' : 'Muy variable'}</strong></div><div><CalendarDays/><span>Días de oportunidad</span><strong>{chartPrices.length ? `${opportunityDays} de ${chartPrices.length}` : '—'}</strong></div><div className="evidence-card"><Gauge/><span>Nivel de evidencia</span><strong>{evidenceLabel} · {evidenceScore}%</strong><small>{r!.days} días comparables · {freshnessHours === Infinity ? 'sin actualización' : freshnessHours < 24 ? 'dato reciente' : 'dato por renovar'}</small></div></section>
          </div><aside className="decision-column" aria-label="Lectura y objetivo">          <div className={`verdict ${r!.action}`}><div><div className="verdict-caption"><span className="verdict-symbol">{r!.action === 'buy' ? <ArrowDownRight size={18} /> : r!.action === 'wait' ? <ArrowUpRight size={18} /> : <Info size={18} />}</span>LA LECTURA DE BRIZOA</div><h3>{labels[r!.action]}</h3><p>{r!.reason}</p></div>{r!.score !== null && <div className="score"><strong>{r!.score}<span>/100</span></strong><span>Posición del precio</span><button onClick={() => setAboutOpen(true)}>¿Qué significa?</button></div>}</div>
          <PurchaseSimulator key={active.id} price={r?.current ?? null} blocked={!r || ['stale','unavailable','verify'].includes(r.action) || (!active.demoKey && !active.observations.at(-1)?.complete)} target={active.targetMinor} saving={saving} onSave={value=>patch(active.id,{target_minor:value,status:'active'})}/><PurchasePause key={active.id} id={active.id} price={r?.current ?? null} onArchive={()=>patch(active.id,{status:'archived'})}/><div className="target-box"><div className="target-heading"><div><Bell size={20} /><strong>Alerta de precio</strong></div><Switch checked={active.targetMinor != null && active.status === 'active'} onCheckedChange={checked => { if (checked && active.targetMinor == null) { toast.info('Primero define y guarda un precio objetivo.'); return; } void patch(active.id, { status: checked ? 'active' : 'paused' }); }} disabled={saving || active.targetMinor == null} aria-label="Activar alerta de precio" /></div><p>{active.demoKey ? 'Guarda un objetivo para probar un aviso dentro de la app.' : 'Se evaluará al recibir cada precio verificado. No se enviarán correos.'}</p><form onSubmit={saveTarget} className="target-form"><label><span>$</span><input type="number" min="0.01" max="10000000" step="0.01" aria-label="Precio objetivo en pesos mexicanos" placeholder="Tu objetivo en MXN" value={target} onChange={e => setTarget(e.target.value)} /><span>MXN</span></label><button className="secondary-button" type="submit" disabled={saving}>{saving ? 'Guardando…' : active.targetMinor != null ? 'Actualizar objetivo' : 'Crear alerta'}</button></form>{active.targetMinor != null && <div className="saved-target"><Check size={14} /> Objetivo guardado: {money(active.targetMinor)}<button disabled={saving} onClick={() => void patch(active.id, { target_minor: null })}>Quitar</button></div>}</div></aside>
        </> : <div className="empty-state large"><img src="./brizoa-symbol.svg" width="170" height="170" alt="Alebrije de Brizoa" /><h2>Una buena compra empieza aquí.</h2><p>Selecciona un producto de tu radar o agrega uno nuevo.</p></div>}</section></div></TabsContent>
        <TabsContent value="alerts"><section className="wide-panel"><div className="panel-heading"><div><h2>Tus alertas</h2><p>Objetivos guardados y avisos de esta demostración.</p></div><Bell size={28} /></div><div className="alert-grid"><div><h3>Precios objetivo</h3>{items.filter(p => p.targetMinor != null && p.status !== 'archived').map(p => <div className="alert-row" key={p.id}><div><strong>{p.title}</strong><p>{money(p.targetMinor)} · {p.status === 'paused' ? 'Pausada' : p.demoKey ? 'Ejemplo activo' : 'Esperando datos'}</p></div><button className="plain-button" onClick={() => { setSelected(p.id); setTab('products'); }}>Editar <ArrowRight size={17} /></button></div>)}{!items.some(p => p.targetMinor != null && p.status !== 'archived') && <p className="muted">Define tu precio ideal desde un producto para crear una alerta.</p>}</div><div><h3>Avisos de prueba</h3>{events.map(e => <div className="alert-row" key={e.id}><span className="event-icon"><Check size={18} /></span><div><strong>{e.title}</strong><p>El ejemplo alcanzó tu objetivo: {money(e.price_minor)}.</p><small>{new Date(e.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })} · Solo en la app</small></div></div>)}{!events.length && <p className="muted">Aún no hay avisos. Prueba un objetivo igual o mayor al precio de un producto de ejemplo.</p>}</div></div></section></TabsContent>
        <TabsContent value="archive"><section className="wide-panel"><h2>Productos archivados</h2><p className="muted">Puedes devolverlos a tu radar cuando quieras.</p>{items.filter(p => p.status === 'archived').map(p => <div className="alert-row" key={p.id}><div><strong>{p.title}</strong><p>{p.category}</p></div><button className="secondary-button" disabled={saving} onClick={() => void patch(p.id, { status: 'active' })}><Play size={16} /> Volver a seguir</button></div>)}{!items.some(p => p.status === 'archived') && <div className="empty-state"><Archive size={32} /><p>Aquí aparecerán los productos que archives.</p></div>}</section></TabsContent>
      </Tabs>
      <footer><span className="footer-brand">brizoa</span><span>Una mirada más clara a tus compras.</span><div className="contact-links"><a href="https://github.com/Eddie918" target="_blank" rel="noopener noreferrer"><Code2/> GitHub</a><a href="mailto:saul.ariasst@gmail.com"><Mail/> Contacto</a><a href="https://www.linkedin.com/in/saularias" target="_blank" rel="noopener noreferrer"><BriefcaseBusiness/> LinkedIn</a></div><button onClick={() => setAboutOpen(true)}>Sobre esta versión</button></footer>
    </main>
    <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent className="brizoa-dialog"><DialogHeader><DialogTitle>Algo nuevo en tu radar</DialogTitle><DialogDescription>{demo ? 'Pega el enlace o el texto compartido con el nombre del producto. Este demo no consulta Amazon.' : 'Pega un enlace de Amazon México. Intentaremos obtener la ficha al guardarlo.'}</DialogDescription></DialogHeader><form onSubmit={addProduct} className="add-form"><label>Enlace o texto compartido<input autoFocus value={input} onChange={e => updateAmazonInput(e.target.value)} placeholder="https://www.amazon.com.mx/Nombre-del-producto/dp/…" maxLength={2048} required /></label><label>Nombre del producto (opcional)<input value={name} onChange={e => { setName(e.target.value); setNameTouched(true); }} placeholder="Escribe o pega el nombre si no viene en el enlace" maxLength={150} />{input && !name && <small className="field-hint">Este enlace solo identifica el producto. Puedes escribir su nombre o guardarlo como “Producto por identificar”.</small>}{name && !nameTouched && <small className="field-hint">Nombre sugerido a partir del texto pegado; puedes editarlo.</small>}</label><label>Categoría<select value={category} onChange={e => setCategory(e.target.value as typeof category)}>{categories.map(c => <option key={c}>{c}</option>)}</select></label><p className="source-note"><ShieldCheck size={16}/> {demo ? 'Se guarda solo en este navegador. Los enlaces sin nombre no permiten obtener título, imagen o precio en este demo.' : 'Si el proveedor no devuelve información, conservaremos una ficha editable.'}</p>{inputError && <p className="form-error" role="alert">{inputError}</p>}<button type="submit" disabled={saving} className="primary-button">{saving ? 'Guardando…' : 'Agregar a mi radar'} <ArrowRight size={17} /></button></form></DialogContent></Dialog>
    <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="brizoa-dialog"><DialogHeader><DialogTitle>Editar ficha</DialogTitle><DialogDescription>El nombre y la portada por categoría te ayudan a reconocer el producto mientras llega la información oficial.</DialogDescription></DialogHeader><form onSubmit={saveProfile} className="add-form"><label>Nombre del producto<input autoFocus value={editName} onChange={e=>setEditName(e.target.value)} maxLength={150} required/></label><label>Categoría<select value={editCategory} onChange={e=>setEditCategory(e.target.value as typeof editCategory)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><button className="primary-button" disabled={saving}>{saving?'Guardando…':'Guardar ficha'}</button></form></DialogContent></Dialog>
    <Dialog open={aboutOpen} onOpenChange={setAboutOpen}><DialogContent className="brizoa-dialog"><DialogHeader><DialogTitle>Perspectiva, sin adivinanzas.</DialogTitle><DialogDescription>Así interpreta Brizoa el precio que estás viendo.</DialogDescription></DialogHeader><div className="about-content"><img src="./brizoa-symbol.svg" width="95" height="95" alt="Alebrije de Brizoa" /><p><strong>El índice mide posición histórica, no probabilidad.</strong> Un 90/100 significa que el precio está en la parte baja de los días comparables; no significa 90% de certeza de ahorrar.</p><p>Comparamos hasta 90 días de la misma variante, vendedor, condición y moneda. Se requieren al menos 30 días de datos y un costo total conocido.</p><p>Un buen momento requiere estar en el cuarto más barato del historial y al menos 3% por debajo de la mediana. Los umbrales son reglas iniciales, pendientes de validar con datos reales.</p><p><strong>Los ejemplos siguen siendo sintéticos.</strong> El demo no consulta Amazon. Permite importar registros propios identificados por su fuente. El backend separado obtiene datos actuales mediante Apify y acumula observaciones desde el inicio del seguimiento; no recupera el pasado. Brizoa no está afiliada ni respaldada por Amazon.</p><div className="creator-card"><span>Creado por Saúl Arias</span><a href="https://github.com/Eddie918" target="_blank" rel="noopener noreferrer">GitHub</a><a href="mailto:saul.ariasst@gmail.com">Email</a><a href="https://www.linkedin.com/in/saularias" target="_blank" rel="noopener noreferrer">LinkedIn</a></div><p className="muted">Brizoa · Alfa 0.6 · Integración de precios y alertas dentro de la app</p></div></DialogContent></Dialog>
  </div>;
}
