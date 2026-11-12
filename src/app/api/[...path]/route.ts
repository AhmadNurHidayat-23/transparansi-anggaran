import {getStore} from '../../../server/db';
import {session,guard,login,payload,errorResponse,AccessError} from '../../../server/auth';
import {integer,csv} from '../../../server/validate';
import {state} from '../../../server/repository';
import * as service from '../../../server/service';
export const runtime='nodejs';export const dynamic='force-dynamic';
type Context={params:Promise<{path:string[]}>};
async function handle(r:Request,c:Context){try{
 const {path}=await c.params,[kind,rawId]=path,s=getStore(),method=r.method,params=new URL(r.url).searchParams;
 if(path.length>2)throw new AccessError('Alamat tidak tersedia.',404);
 if(method==='GET'&&kind==='session'){const current=session(s,r);return Response.json({user:current?{id:current.id,name:current.name,username:current.username,role:current.role}:null,csrf:current?.csrf,configured:!!s.get('SELECT id FROM users LIMIT 1')},{headers:{'Cache-Control':'no-store'}});}
 if(method==='GET'&&kind==='public')return Response.json(state(s,params,true),{headers:{'Cache-Control':'no-store'}});
 if(method==='GET'&&kind==='state'){guard(s,r);return Response.json(state(s,params),{headers:{'Cache-Control':'no-store'}});}
 if(method==='GET'&&kind==='export'){const publicOnly=params.get('public')==='1';if(!publicOnly)guard(s,r);const data=state(s,params,publicOnly);const rows=[['Tahun','Jenis','Kategori','Alokasi','Anggaran rupiah','Realisasi rupiah','Sisa rupiah'],...data.allocations.map(a=>[data.years.find(y=>y.id===a.year_id)?.year,a.type,a.category,a.title,a.amount,a.realized,a.remaining])];return new Response(csv(rows),{headers:{'Content-Type':'text/csv;charset=utf-8','Content-Disposition':'attachment; filename=laporan-anggaran.csv'}});}
 if(method==='GET')throw new AccessError('Alamat tidak tersedia.',404);
 const data=await payload(r);
 if(kind==='login'&&method==='POST')return login(s,r,data);
 const user=guard(s,r,kind==='realizations'||kind==='logout'?['Admin','Petugas']:['Admin']);
 if(kind==='logout'&&method==='POST'){s.run('DELETE FROM sessions WHERE token=?',user.token);return Response.json({message:'Anda telah keluar.'},{headers:{'Set-Cookie':'transparansi_anggaran_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'}});}
 if(!['years','categories','allocations','realizations'].includes(kind))throw new AccessError('Alamat tidak tersedia.',404);
 const id=rawId?integer(rawId,'ID',1):0;
 if(method==='DELETE'&&id)service.remove(s,kind,id,user);
 else if(method==='POST'&&!id||method==='PUT'&&id){if(kind==='years')service.saveYear(s,data,id);if(kind==='categories')service.saveCategory(s,data,id);if(kind==='allocations')service.saveAllocation(s,data,id);if(kind==='realizations')service.saveRealization(s,user,data,id);}
 else throw new AccessError('Tindakan tidak tersedia.');
 return Response.json({message:'Perubahan anggaran disimpan.'});
 }catch(e){return errorResponse(e);}}
export const GET=handle;export const POST=handle;export const PUT=handle;export const DELETE=handle;
