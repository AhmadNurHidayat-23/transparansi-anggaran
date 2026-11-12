import type {Group} from '../types';
import {money} from './api';
export default function Chart({groups}:{groups:Group[]}){
 const max=Math.max(1,...groups.flatMap(g=>[g.planned,g.realized]));
 return <section className="section"><p className="eyebrow">Perbandingan / Rupiah</p><h2>Anggaran & realisasi</h2><p className="chart-legend">Batang atas: alokasi · Batang bawah: realisasi tercatat</p>{groups.length?groups.map(g=><div className="chart-row" key={g.id}><p><strong>{g.name}</strong> / {g.type}</p><svg viewBox="0 0 800 40" role="img" aria-label={g.name+': alokasi '+money(g.planned)+', realisasi '+money(g.realized)}><rect className="plan-bar" x="0" y="0" width={g.planned/max*800} height="16"/><rect className="actual-bar" x="0" y="23" width={g.realized/max*800} height="16"/></svg><p className="meta">{money(g.planned)} / {money(g.realized)}</p></div>):<p className="empty">Grafik akan tampil setelah alokasi dicatat. Nilainya berasal dari database aplikasi.</p>}</section>;
}
