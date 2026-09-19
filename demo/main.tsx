import { createRoot } from 'react-dom/client';
import Radar from '../app/radar';
import { demoRequest, importHistory } from './store';
import { useState } from 'react';
import '../app/globals.css';

function Portfolio() {
  const [message,setMessage] = useState('');
  return <Radar request={demoRequest} demo demoTools={<section aria-label="Importación de historial"><label>Importar historial propio (JSON) <input type="file" accept=".json,application/json" onChange={async e=>{
    const file=e.target.files?.[0]; if(!file) return;
    try { if(file.size>2_000_000) throw new Error('El archivo debe pesar menos de 2 MB.'); if(importHistory(JSON.parse(await file.text()))) window.location.reload(); }
    catch(error) {setMessage(error instanceof Error ? error.message : 'Archivo inválido.');}
    e.target.value='';
  }}/></label><p>Solo importa datos propios o autorizados. Se identifican como aportados por ti; no se verifican con Amazon.</p><p role="status">{message}</p></section>}/>;
}
createRoot(document.getElementById('root')!).render(<Portfolio />);
