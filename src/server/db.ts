import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {schema} from './schema.ts';
export class Store {
 db:DatabaseSync;
 constructor(file:string) {
  if(file!==':memory:')fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
  this.db=new DatabaseSync(file,{timeout:10000});
  this.db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=10000;');
  this.db.exec("CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE COLLATE NOCASE,name TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('Admin','Petugas')),password TEXT NOT NULL);CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),csrf TEXT NOT NULL,expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS attempts(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);");
  this.db.exec(schema);
 }
 all<T>(sql:string,...args:SQLInputValue[]) {return this.db.prepare(sql).all(...args) as unknown as T[];}
 get<T>(sql:string,...args:SQLInputValue[]) {return this.db.prepare(sql).get(...args) as unknown as T|undefined;}
 run(sql:string,...args:SQLInputValue[]) {return this.db.prepare(sql).run(...args);}
 transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 close(){this.db.close();}
}
let store:Store|undefined;
export function getStore(){return store??=new Store(process.env.APP_DB||'./data/app.sqlite');}
