export type User={id:number;username:string;name:string;role:'Admin'|'Petugas'};
export type Auth={user:User|null;csrf?:string;configured?:boolean};
export async function api(path:string,method='GET',body?:unknown,csrf=''){
 const response=await fetch('/api/'+path,{method,cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:method==='GET'?undefined:JSON.stringify(body||{})});
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Permintaan gagal.');return data;
}
export const money=(value:number)=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
export const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Jakarta'});
export const formValues=(form:HTMLFormElement)=>Object.fromEntries(new FormData(form));
export type Change=(path:string,method:string,data?:unknown)=>Promise<boolean>;
