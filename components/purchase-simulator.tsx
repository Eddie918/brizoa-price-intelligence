'use client';
import { useState } from 'react';
import { purchaseScenario } from '../lib/purchase-scenario';

const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n/100);
export function PurchaseSimulator({price,blocked,target,onSave,saving}:{price:number|null;blocked:boolean;target:number|null;onSave:(target:number)=>Promise<boolean>;saving:boolean}) {
  const [budget,setBudget]=useState('');
  const [goal,setGoal]=useState(target==null?'':String(target/100));
  const [days,setDays]=useState('30');
  const [cost,setCost]=useState('0');
  const result = budget.trim() && goal.trim() && days.trim() && cost.trim() ? purchaseScenario(price,Math.round(Number(budget)*100),Math.round(Number(goal)*100),Number(days),Math.round(Number(cost)*100)) : null;
  return <div className="scenario-box"><h3>¿Comprar o esperar?</h3><p>Compara tu presupuesto con un precio objetivo y el costo que tendría esperar.</p>
    <div className="scenario-tabs">{[['0','Lo necesito hoy'],['30','Puedo esperar']].map(([value,label])=><button key={value} aria-pressed={days===value} onClick={()=>setDays(value)}>{label}</button>)}</div>
    <div style={{display:'grid',gap:12,marginTop:16}}>{[['Presupuesto máximo (MXN)',budget,setBudget,'0.01'],['Precio que esperas (MXN)',goal,setGoal,'0.01'],['Días que puedes esperar',days,setDays,'1'],['Costo por día de esperar (MXN)',cost,setCost,'0.01']].map(([label,value,setter,step])=><label key={String(label)} style={{display:'grid',gap:6}}>{String(label)}<input aria-label={String(label)} type="number" min="0" step={String(step)} value={String(value)} onChange={e=>(setter as (v:string)=>void)(e.target.value)} style={{width:'100%',padding:10,border:'1px solid #789387',borderRadius:6,background:'transparent',color:'inherit'}}/></label>)}</div>
    <p>El costo diario lo defines tú, por ejemplo, por alquilar un reemplazo. Usa cero si esperar no te cuesta.</p>
    <div aria-live="polite">{blocked || price==null ? <p>Primero necesitamos un precio actual, disponible y con costo total confirmado.</p> : !result ? <p>Introduce un presupuesto y un objetivo positivos para calcular.</p> : <><h4>{result.title}</h4><p>Margen al comprar hoy: {money(result.remaining)}</p><p>Ahorro si alcanza tu objetivo: {money(result.saving)}<br/>Costo de esperar: {money(result.waitingCost)}<br/>Balance de esperar: {money(result.netSaving)}</p>{result.breakEvenDays!=null && <p>El ahorro cubriría hasta {result.breakEvenDays.toFixed(1)} días de espera.</p>}<button className="secondary-button" disabled={saving || Number(goal)<=0 || Number(goal)>10000000} onClick={()=>void onSave(Math.round(Number(goal)*100))}>Guardar este precio como objetivo</button></>}</div>
    <p>Es un escenario calculado con tus supuestos, no una predicción de que el precio bajará.</p>
  </div>;
}
