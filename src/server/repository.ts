import type {Store} from './db.ts';
import type {Year,Category,Allocation,Realization,BudgetState} from '../types.ts';
export function state(s:Store,params:URLSearchParams,publicOnly=false):BudgetState{
 const years=s.all<Year>('SELECT * FROM years'+(publicOnly?' WHERE published=1':'')+' ORDER BY year DESC');
 const requested=Number(params.get('year')),selected=years.find(y=>y.id===requested)||years[0],id=selected?.id||0;
 const categories=s.all<Category>('SELECT * FROM categories ORDER BY type,name'),category=params.get('category')||'';
 const allocations=s.all<Allocation>("SELECT a.*,c.name category,c.type,coalesce((SELECT sum(r.amount) FROM realizations r WHERE r.allocation_id=a.id),0) realized FROM allocations a JOIN categories c ON c.id=a.category_id WHERE a.year_id=?"+(category?' AND a.category_id=?':'')+' ORDER BY c.type,c.name,a.title',...category?[id,category]:[id]).map(a=>({...a,remaining:a.amount-a.realized})).filter(a=>{const q=(params.get('q')||'').trim().toLocaleLowerCase().slice(0,120);return !q||a.title.toLocaleLowerCase().includes(q)||a.category.toLocaleLowerCase().includes(q);});
 const ids=new Set(allocations.map(a=>a.id));
 const rows=s.all<Realization>('SELECT r.*,a.title FROM realizations r JOIN allocations a ON a.id=r.allocation_id WHERE a.year_id=? ORDER BY r.date DESC,r.id DESC',id).filter(r=>ids.has(r.allocation_id));
 const realizations=publicOnly?[]:rows;
 const groups=categories.map(c=>({id:c.id,name:c.name,type:c.type,planned:allocations.filter(a=>a.category_id===c.id).reduce((sum,a)=>sum+a.amount,0),realized:allocations.filter(a=>a.category_id===c.id).reduce((sum,a)=>sum+a.realized,0)})).filter(g=>allocations.some(a=>a.category_id===g.id));
 const income=allocations.filter(a=>a.type==='Pendapatan').reduce((sum,a)=>sum+a.amount,0),spending=allocations.filter(a=>a.type==='Belanja').reduce((sum,a)=>sum+a.amount,0),realized=allocations.filter(a=>a.type==='Belanja').reduce((sum,a)=>sum+a.realized,0);
 return {years,categories,allocations,realizations,groups,year:id,summary:{income,spending,realized,remaining:spending-realized}};
}
