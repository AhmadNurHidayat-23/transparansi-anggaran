import {randomBytes,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import type {Store} from './db.ts';
export type User={id:number;username:string;name:string;role:'Admin'|'Petugas'};
export type Session=User&{token:string;user_id:number;csrf:string;expires:number};
export class AccessError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status;}}
const derive=(value:string,salt:string)=>scryptSync(value,salt,64,{N:32768,r:8,p:3,maxmem:128*1024*1024});
export const digest=(v:string)=>createHash('sha256').update(v).digest('hex');
export function passwordHash(value:string){if(value.length<12||value.length>200)throw new AccessError('Kata sandi harus 12–200 karakter.');const salt=randomBytes(16).toString('hex');return salt+':'+derive(value,salt).toString('hex');}
const dummy=passwordHash(randomBytes(24).toString('hex'));
function verify(value:unknown,hash:string){if(typeof value!=='string'||value.length>200)return false;const [salt,encoded]=hash.split(':'),actual=derive(value,salt),expected=Buffer.from(encoded,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);}
export function addUser(s:Store,data:{username:string;name:string;role:string;password:string}){
 if(!/^[a-zA-Z0-9._-]{1,80}$/.test(data.username)||!data.name.trim()||data.name.length>80||!['Admin','Petugas'].includes(data.role))throw new AccessError('Nama pengguna, nama tampilan, atau peran tidak valid.');
 s.run('INSERT INTO users(username,name,role,password) VALUES(?,?,?,?)',data.username.toLowerCase(),data.name.trim(),data.role,passwordHash(data.password));
}
export function session(s:Store,r:Request){const token=r.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('app_session='))?.slice(12);if(!token||!/^[a-f0-9]{64}$/.test(token))return undefined;return s.get<Session>('SELECT u.id,u.username,u.name,u.role,s.user_id,s.token,s.csrf,s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE token=? AND expires>?',digest(token),Date.now());}
export function guard(s:Store,r:Request,roles=['Admin','Petugas']){const current=session(s,r);if(!current)throw new AccessError('Silakan masuk terlebih dahulu.',401);if(!roles.includes(current.role))throw new AccessError('Tindakan ini hanya untuk Admin.',403);if(r.method!=='GET'&&r.headers.get('x-csrf-token')!==current.csrf)throw new AccessError('Sesi formulir tidak valid. Muat ulang halaman.',403);return current;}
export function sameOrigin(r:Request){const origin=r.headers.get('origin'),url=new URL(r.url);if(origin&&origin!==url.protocol+'//'+(r.headers.get('host')||url.host))throw new AccessError('Asal permintaan tidak diizinkan.',403);}
export async function payload(r:Request){sameOrigin(r);if(!r.headers.get('content-type')?.startsWith('application/json'))throw new AccessError('Format permintaan tidak valid.',415);const raw=await r.text();if(raw.length>65536)throw new AccessError('Permintaan terlalu besar.',413);let data;try{data=JSON.parse(raw);}catch{throw new AccessError('Format data tidak valid.');}if(!data||typeof data!=='object'||Array.isArray(data))throw new AccessError('Format data tidak valid.');return data as Record<string,unknown>;}
export function login(s:Store,r:Request,data:Record<string,unknown>){
 const username=String(data.username||'').toLowerCase().slice(0,80),now=Date.now(),key=digest(username);
 const attempt=s.get<{count:number;until:number}>('SELECT * FROM attempts WHERE key=?',key);
 if(attempt&&attempt.until>now&&attempt.count>=6)throw new AccessError('Terlalu banyak percobaan. Coba lagi dalam 15 menit.',429);
 const user=s.get<User&{password:string}>('SELECT * FROM users WHERE username=?',username),valid=verify(data.password,user?.password||dummy);
 if(!user||!valid){s.run('INSERT INTO attempts(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN until<=? THEN 1 ELSE count+1 END,until=CASE WHEN until<=? THEN ? ELSE until END',key,now+900000,now,now,now+900000);throw new AccessError('Nama pengguna atau kata sandi tidak cocok.',401);}
 const token=randomBytes(32).toString('hex'),csrf=randomBytes(32).toString('hex'),old=session(s,r);
 s.transaction(()=>{s.run('DELETE FROM attempts WHERE key=?',key);s.run('DELETE FROM sessions WHERE expires<=?',now);if(old)s.run('DELETE FROM sessions WHERE token=?',old.token);s.run('INSERT INTO sessions(token,user_id,csrf,expires) VALUES(?,?,?,?)',digest(token),user.id,csrf,now+28800000);});
 return Response.json({user:{id:user.id,username:user.username,name:user.name,role:user.role},csrf},{headers:{'Set-Cookie':'app_session='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800'+(process.env.SECURE_COOKIE==='1'?'; Secure':'')}});
}
export function errorResponse(error:unknown){const text=error instanceof Error?error.message:'Permintaan gagal.';return Response.json({error:text.includes('UNIQUE')?'Data dengan identitas tersebut sudah digunakan.':text.includes('FOREIGN KEY')?'Data masih terkait atau rujukannya tidak ditemukan.':text},{status:error instanceof AccessError?error.status:text.includes('UNIQUE')||text.includes('FOREIGN KEY')?409:400});}
