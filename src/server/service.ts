import type {Store} from './db.ts';
import type {Year,Category,Allocation,Realization} from '../types.ts';
import type {User} from './auth.ts';
import {AccessError} from './auth.ts';
import {text,integer,choice,date} from './validate.ts';
type Data=Record<string,unknown>;
export function requireRow<T>(s:Store,table:string,id:number){if(!['years','categories','allocations','realizations'].includes(table))throw new AccessError('Jenis data tidak valid.');const row=s.get<T>('SELECT * FROM '+table+' WHERE id=?',id);if(!row)throw new AccessError('Data tidak ditemukan.',404);return row;}
export function saveYear(s:Store,data:Data,id=0){const year=integer(data.year,'Tahun',2000,2100),published=data.published===true||data.published==='on'?1:0;if(id){const old=requireRow<Year>(s,'years',id);if(old.year!==year&&s.get('SELECT id FROM allocations WHERE year_id=?',id))throw new AccessError('Tahun yang sudah berisi alokasi tidak dapat diganti.');s.run('UPDATE years SET year=?,published=? WHERE id=?',year,published,id);}else s.run('INSERT INTO years(year,published) VALUES(?,?)',year,published);}
export function saveCategory(s:Store,data:Data,id=0){const name=text(data.name,'Nama kategori',80),type=choice(data.type,['Pendapatan','Belanja'],'Jenis kategori');if(id){const old=requireRow<Category>(s,'categories',id);if(old.type!==type&&s.get('SELECT id FROM allocations WHERE category_id=?',id))throw new AccessError('Jenis kategori yang sudah digunakan tidak dapat diubah.');s.run('UPDATE categories SET name=?,type=? WHERE id=?',name,type,id);}else s.run('INSERT INTO categories(name,type) VALUES(?,?)',name,type);}
export function saveAllocation(s:Store,data:Data,id=0){s.transaction(()=>{
 const year=integer(data.year_id,'Tahun anggaran',1),category=integer(data.category_id,'Kategori',1),title=text(data.title,'Nama alokasi'),amount=integer(data.amount,'Alokasi rupiah');requireRow<Year>(s,'years',year);requireRow<Category>(s,'categories',category);
 if(id){const old=requireRow<Allocation>(s,'allocations',id),realized=s.get<{total:number;n:number}>('SELECT coalesce(sum(amount),0) total,count(*) n FROM realizations WHERE allocation_id=?',id)!;if(realized.n&&(old.year_id!==year||old.category_id!==category))throw new AccessError('Tahun/kategori alokasi yang memiliki realisasi tidak dapat dipindahkan.');if(amount<realized.total)throw new AccessError('Alokasi tidak boleh lebih kecil dari realisasi yang sudah dicatat.');}
 const total=s.get<{total:number}>('SELECT coalesce(sum(amount),0) total FROM allocations WHERE id<>?',id)!.total+amount;if(!Number.isSafeInteger(total))throw new AccessError('Total alokasi melebihi batas perhitungan aman.');
 if(id)s.run('UPDATE allocations SET year_id=?,category_id=?,title=?,amount=? WHERE id=?',year,category,title,amount,id);else s.run('INSERT INTO allocations(year_id,category_id,title,amount) VALUES(?,?,?,?)',year,category,title,amount);
 });}
export function saveRealization(s:Store,user:User,data:Data,id=0){s.transaction(()=>{
 const allocation=integer(data.allocation_id,'Alokasi',1),when=date(data.date),amount=integer(data.amount,'Realisasi rupiah',1),note=text(data.note,'Uraian transaksi',500),a=requireRow<Allocation>(s,'allocations',allocation),year=requireRow<Year>(s,'years',a.year_id);
 if(Number(when.slice(0,4))!==year.year)throw new AccessError('Tanggal transaksi harus berada dalam tahun anggaran alokasi.');
 if(id){const old=requireRow<Realization>(s,'realizations',id);if(user.role!=='Admin'&&old.owner_id!==user.id)throw new AccessError('Petugas hanya dapat mengubah transaksi yang dicatat sendiri.',403);}
 const total=s.get<{total:number}>('SELECT coalesce(sum(amount),0) total FROM realizations WHERE allocation_id=? AND id<>?',allocation,id)!.total+amount;
 if(total>a.amount)throw new AccessError('Realisasi melebihi alokasi. Tambah alokasi terlebih dahulu bila diperlukan.');
 const global=s.get<{total:number}>('SELECT coalesce(sum(amount),0) total FROM realizations WHERE id<>?',id)!.total+amount;if(!Number.isSafeInteger(global))throw new AccessError('Total realisasi melebihi batas perhitungan aman.');
 if(id)s.run('UPDATE realizations SET allocation_id=?,date=?,amount=?,note=? WHERE id=?',allocation,when,amount,note,id);else s.run('INSERT INTO realizations(allocation_id,date,amount,note,owner_id) VALUES(?,?,?,?,?)',allocation,when,amount,note,user.id);
 });}
export function remove(s:Store,table:string,id:number,user:User){requireRow(s,table,id);if(table==='realizations'&&user.role!=='Admin'&&requireRow<Realization>(s,table,id).owner_id!==user.id)throw new AccessError('Petugas hanya dapat menghapus transaksi sendiri.',403);if(table!=='realizations'&&user.role!=='Admin')throw new AccessError('Hanya Admin dapat menghapus data induk.',403);s.run('DELETE FROM '+table+' WHERE id=?',id);}
