import {createInterface} from 'node:readline/promises';
import {Store} from './db.ts';
import {addUser} from './auth.ts';
async function secret():Promise<string>{
 if(!process.stdin.isTTY)throw new Error('Jalankan pengaturan akun melalui terminal interaktif.');
 process.stdout.write('Kata sandi (12–200 karakter, tidak ditampilkan): ');process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
 return new Promise((resolve,reject)=>{let value='';const onData=(chunk:string)=>{for(const c of chunk){if(c==='\u0003'){finish();reject(new Error('Dibatalkan.'));return;}if(c==='\r'||c==='\n'){finish();resolve(value);return;}if(c==='\u007f'||c==='\b')value=value.slice(0,-1);else if(c>=' ')value+=c;}};function finish(){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');}process.stdin.on('data',onData);});
}
const s=new Store(process.env.APP_DB||'./data/app.sqlite'),rl=createInterface({input:process.stdin,output:process.stdout});
try{const username=await rl.question('Nama pengguna: '),name=await rl.question('Nama tampilan: '),role=await rl.question('Peran (Admin/Petugas): ');rl.close();const password=await secret();addUser(s,{username,name,role,password});console.log('Akun berhasil dibuat.');}catch(e){console.error(e instanceof Error?e.message:'Pengaturan gagal.');process.exitCode=1;}finally{rl.close();s.close();}
