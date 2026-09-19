'use client';
import { useEffect, useState } from 'react';

type Pause = { reason: string; alternative: boolean; started: number; until: number; price: number | null; reviewed: boolean };
export function PurchasePause({id,price,onArchive}:{id:string;price:number|null;onArchive:()=>Promise<boolean>}) {
  const key = `brizoa-pause-v1:${id}`;
  const [pause,setPause]=useState<Pause|null>(null);
  const [reason,setReason]=useState('');
  const [alternative,setAlternative]=useState(false);
  const [hours,setHours]=useState('24');
  const [now,setNow]=useState(Date.now());
  const [ready,setReady]=useState(false);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  useEffect(()=>{try {const raw=localStorage.getItem(key);if(raw){const p=JSON.parse(raw);if(typeof p.reason==='string'&&Number.isFinite(p.until)&&Number.isFinite(p.started)&&typeof p.reviewed==='boolean')setPause(p);}}catch{setError('No pudimos leer la pausa guardada.');}setReady(true);const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer);},[key]);
  function save(value:Pause|null){try{if(value)localStorage.setItem(key,JSON.stringify(value));else localStorage.removeItem(key);setPause(value);setError('');return true;}catch{setError('Tu navegador no permitió guardar la pausa.');return false;}}
  const due=!!pause&&now>=pause.until;
  return <section className="scenario-box purchase-pause" aria-label="Pausa de compra"><span className="eyebrow">ANTES DE COMPRAR</span><h3>¿Lo seguirás queriendo mañana?</h3><p>Guarda el motivo y vuelve a decidir cuando pase la emoción de la oferta.</p>
    {!ready ? <p>Cargando…</p> : !pause ? <form onSubmit={e=>{e.preventDefault();if(!reason.trim())return;const started=Date.now();setNow(started);save({reason:reason.trim(),alternative,started,until:started+Number(hours)*3600000,price,reviewed:false});}}>
      <label className="decision-field">¿Para qué lo usarías?<textarea required maxLength={300} rows={2} placeholder="Por ejemplo: para mi proyecto del próximo mes" value={reason} onChange={e=>setReason(e.target.value)}/></label>
      <label className="decision-check"><input type="checkbox" checked={alternative} onChange={e=>setAlternative(e.target.checked)}/> Ya tengo algo que cumple esa función</label>
      <label className="decision-field">Volver a decidir en<select value={hours} onChange={e=>setHours(e.target.value)}><option value="24">24 horas</option><option value="72">3 días</option><option value="168">Una semana</option></select></label>
      <button type="submit" className="secondary-button">Poner la compra en pausa</button>
    </form> : <><blockquote>{pause.reason}</blockquote>{pause.alternative&&<p>Recordaste que ya tienes una alternativa.</p>}<p role="status">{pause.reviewed?'Ya revisaste esta decisión.':due?'Ya puedes revisar tu decisión.':`Vuelve el ${new Date(pause.until).toLocaleString('es-MX',{dateStyle:'medium',timeStyle:'short'})}.`}</p>
    <p>¿Sigue siendo una compra que necesitas?</p><div className="decision-actions"><button className="secondary-button" disabled={busy} onClick={()=>save({...pause,reviewed:true})}>Sí, mantener en mi radar</button><button className="plain-button" disabled={busy} onClick={async()=>{setBusy(true);try{if(await onArchive())save(null);}finally{setBusy(false);}}}>Ya no lo necesito · Archivar</button><button className="plain-button" disabled={busy} onClick={()=>save(null)}>Quitar pausa</button></div></>}
    {error&&<p role="alert">{error}</p>}<small>Guardado en este navegador. No bloquea compras ni envía recordatorios.</small>
  </section>;
}
