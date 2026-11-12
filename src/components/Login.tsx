import {useState,type FormEvent} from 'react';
export default function Login({configured,login}:{configured?:boolean;login:(data:unknown)=>Promise<void>}){
 const [pending,setPending]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const form=e.currentTarget;setPending(true);try{await login(Object.fromEntries(new FormData(form)));form.reset();}finally{setPending(false);}}
 return <section className="section"><p className="eyebrow">Akses pengelola</p><h2>Masuk ruang kerja</h2><p className="muted">{configured===false?'Belum ada akun. Jalankan npm run user melalui terminal server untuk membuat Admin dan Petugas.':'Gunakan akun yang dibuat pengelola server.'}</p><form className="stack login-form" onSubmit={submit}><label>Nama pengguna<input name="username" required maxLength={80} autoComplete="username"/></label><label>Kata sandi<input name="password" type="password" required maxLength={200} autoComplete="current-password"/></label><button className="primary" disabled={pending}>{pending?'Memeriksa…':'Masuk'}</button></form></section>;
}
