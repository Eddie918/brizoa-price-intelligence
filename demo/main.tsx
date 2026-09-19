import { createRoot } from 'react-dom/client';
import Radar from '../app/radar';
import { demoRequest, importHistory } from './store';
import { useState } from 'react';
import '../app/globals.css';

function Portfolio() {
  const [message,setMessage] = useState('');
  return <Radar request={demoRequest} demo demoTools={<details className="history-tools"><summary>Importar historial · opciones avanzadas</summary><label>Historial propio (JSON) <input type="file" accept=".json,application/json" onChange={async e=>{
    const file=e.target.files?.[0]; if(!file) return;
    try { if(file.size>2_000_000) throw new Error('El archivo debe pesar menos de 2 MB.'); if(importHistory(JSON.parse(await file.text()))) window.location.reload(); }
    catch(error) {setMessage(error instanceof Error ? error.message : 'Archivo inválido.');}
    e.target.value='';
  }}/></label><p>Importa registros propios o una exportación compatible de Keepa.</p><p role="status">{message}</p></details>}/>;
}
createRoot(document.getElementById('root')!).render(<Portfolio />);
