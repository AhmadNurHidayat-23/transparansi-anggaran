export const schema=
 'CREATE TABLE IF NOT EXISTS years(id INTEGER PRIMARY KEY,year INTEGER NOT NULL UNIQUE,published INTEGER NOT NULL DEFAULT 0 CHECK(published IN(0,1)));'+
 "CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,name TEXT NOT NULL,type TEXT NOT NULL CHECK(type IN('Pendapatan','Belanja')),UNIQUE(name,type));"+
 'CREATE TABLE IF NOT EXISTS allocations(id INTEGER PRIMARY KEY,year_id INTEGER NOT NULL REFERENCES years(id),category_id INTEGER NOT NULL REFERENCES categories(id),title TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>=0),UNIQUE(year_id,category_id,title));'+
 'CREATE TABLE IF NOT EXISTS realizations(id INTEGER PRIMARY KEY,allocation_id INTEGER NOT NULL REFERENCES allocations(id),date TEXT NOT NULL,amount INTEGER NOT NULL CHECK(amount>0),note TEXT NOT NULL,owner_id INTEGER NOT NULL REFERENCES users(id));';
