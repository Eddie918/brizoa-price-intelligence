'use client';
import { useState } from 'react';
const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n/100);
export function PurchaseSimulator({price,blocked,target,onSave,saving}:{price:number|null;blocked:boolean;target:number|null;onSave:(target:number)=>Promise<boolean>;saving:boolean}) {
  const [urgency,setUrgency]=useState<'now'|'later'>('later');
  const [limit,setLimit]=useState(target==null?'':String(target/100));
  const value=Number(limit), minor=Math.round(value*100);
  const valid=/^\d+(\.\d{1,2})?$/.test(limit)&&value>0&&value<=10000000;
  const known=!blocked&&price!=null;
  const gap=known&&valid ? price!-minor : null;
  return <section className="scenario-box"><h3>Tu límite de compra</h3><p>Decide cuánto quieres pagar. Brizoa te muestra cuánto falta.</p>
    <fieldset className="decision-choice"><legend>¿Lo necesitas pronto?</legend><div className="scenario-tabs"><button type="button" aria-pressed={urgency==='now'} onClick={()=>setUrgency('now')}>Sí, lo necesito</button><button type="button" aria-pressed={urgency==='later'} onClick={()=>setUrgency('later')}>Puedo esperar</button></div></fieldset>
    <label className="decision-field">Como máximo pagaría (MXN)<input type="number" min="0.01" step="0.01" max="10000000" placeholder="Escribe tu límite" value={limit} onChange={e=>setLimit(e.target.value)}/></label>
    <div className="decision-result" aria-live="polite">{!valid ? <p>Escribe un importe para compararlo con el precio.</p> : !known ? <p>Puedes guardar tu límite de {money(minor)}. Falta un precio actual confirmado para compararlo.</p> : gap!>0 ? <><strong>Faltan {money(gap!)} para tu límite</strong><p>{urgency==='now'?'Busca una alternativa que entre en tu presupuesto. La urgencia no cambia tu límite.':'Puedes esperar a que alcance tu límite; no sabemos si bajará ni cuándo.'}</p></> : <><strong>El precio cabe en tu límite</strong><p>{money(-gap!)} por debajo de tu máximo. {urgency==='now'?'Si resuelve tu necesidad, revisa el total antes de comprar.':'No tienes que comprar por estar dentro del presupuesto. Puedes usar la pausa de compra.'}</p></>}</div>
    <button type="button" className="secondary-button" disabled={!valid||saving} onClick={()=>void onSave(minor)}>{saving?'Guardando…':'Guardar mi límite'}</button>
    <small>Guarda también el objetivo de alerta. El demo muestra avisos dentro de la app.</small>
  </section>;
}
