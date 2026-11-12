import {describe,it,expect,beforeAll,afterAll} from 'vitest';
import {randomBytes} from 'node:crypto';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {getStore} from '../src/server/db';
import {addUser} from '../src/server/auth';
import {GET,POST,PUT,DELETE} from '../src/app/api/[...path]/route';
const password=randomBytes(20).toString('hex');
type Headers={cookie:string;'X-CSRF-Token':string};
let admin:Headers,staff:Headers;
async function request(url:string,method='GET',body?:unknown,headers:Record<string,string>={}){const [route,query]=url.split('?');const r=new Request('http://localhost:5421/api/'+url,{method,headers:{host:'127.0.0.1:5421','Content-Type':'application/json',...headers},body:method==='GET'?undefined:JSON.stringify(body||{})});const context={params:Promise.resolve({path:route.split('/')})};return ({GET,POST,PUT,DELETE} as Record<string,typeof GET>)[method](r,context);}
async function login(username:string){const response=await request('login','POST',{username,password},{Origin:'http://127.0.0.1:5421'});expect(response.status).toBe(200);return {cookie:response.headers.get('set-cookie')!.split(';')[0],'X-CSRF-Token':(await response.json()).csrf};}
beforeAll(async()=>{process.env.APP_DB=path.join(mkdtempSync(path.join(tmpdir(),'budget-api-')),'app.sqlite');const db=getStore();addUser(db,{username:'admin',name:'Admin Uji',role:'Admin',password});addUser(db,{username:'petugas',name:'Petugas Uji',role:'Petugas',password});admin=await login('admin');staff=await login('petugas');});
afterAll(()=>{getStore().close();delete process.env.APP_DB;});
describe('Izin server Next.js',()=>{
 it('menolak akses anonim, CSRF hilang, asal lain dan perubahan induk oleh Petugas',async()=>{expect((await request('state')).status).toBe(401);expect((await request('years','POST',{year:2026},staff)).status).toBe(403);expect((await request('years','POST',{year:2026},{cookie:admin.cookie})).status).toBe(403);expect((await request('years','POST',{year:2026},{...admin,Origin:'https://lain.example'})).status).toBe(403);});
 it('CRUD melalui route handler, publikasi dan ekspor CSV nyata',async()=>{expect((await request('years','POST',{year:2026,published:false},admin)).status).toBe(200);expect((await request('categories','POST',{name:'Belanja uji',type:'Belanja'},admin)).status).toBe(200);expect((await request('allocations','POST',{year_id:1,category_id:1,title:'Uji',amount:1000},admin)).status).toBe(200);expect((await request('realizations','POST',{allocation_id:1,date:'2026-11-12',amount:250,note:'Catatan internal uji'},staff)).status).toBe(200);expect((await (await request('public')).json()).allocations).toHaveLength(0);expect((await request('years/1','PUT',{year:2026,published:true},admin)).status).toBe(200);const publicData=await (await request('public')).json();expect(publicData.summary.remaining).toBe(750);expect(JSON.stringify(publicData)).not.toContain('Catatan internal uji');expect((await request('export?public=1')).status).toBe(200);expect(await (await request('export?public=1')).text()).toContain('750');});
 it('sesi persisten dan logout membatalkan hak akses',async()=>{expect((await request('state','GET',undefined,staff)).status).toBe(200);expect((await request('logout','POST',{},staff)).status).toBe(200);expect((await request('state','GET',undefined,staff)).status).toBe(401);});
});
