import {AccessError} from './auth.ts';
export function text(v:unknown,label:string,max=120,required=true){if(typeof v!=='string'||v.trim().length>max||required&&!v.trim())throw new AccessError(label+' wajib diisi dengan benar, maksimal '+max+' karakter.');return v.trim();}
export function integer(v:unknown,label:string,min=0,max=1000000000000){if(typeof v==='boolean'||!/^\d+$/.test(String(v))||!Number.isSafeInteger(Number(v))||Number(v)<min||Number(v)>max)throw new AccessError(label+' harus bilangan bulat antara '+min+' dan '+max+'.');return Number(v);}
export function date(v:unknown){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v+'T00:00:00Z'))||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw new AccessError('Tanggal tidak valid.');return v;}
export function choice(v:unknown,options:string[],label:string){if(typeof v!=='string'||!options.includes(v))throw new AccessError(label+' tidak valid.');return v;}
export const csv=(rows:unknown[][])=>'\uFEFF'+rows.map(row=>row.map(v=>'"'+(/^[=+@-]/.test(String(v))?"'"+v:String(v??'')).replaceAll('"','""')+'"').join(',')).join('\r\n');
