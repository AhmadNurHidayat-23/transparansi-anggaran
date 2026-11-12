export type Year={id:number;year:number;published:number};
export type Category={id:number;name:string;type:'Pendapatan'|'Belanja'};
export type Allocation={id:number;year_id:number;category_id:number;title:string;amount:number;realized:number;remaining:number;category:string;type:'Pendapatan'|'Belanja'};
export type Realization={id:number;allocation_id:number;date:string;amount:number;note:string;owner_id?:number;title:string};
export type Group={id:number;name:string;type:'Pendapatan'|'Belanja';planned:number;realized:number};
export type BudgetState={years:Year[];categories:Category[];allocations:Allocation[];realizations:Realization[];groups:Group[];year:number;summary:{income:number;spending:number;realized:number;remaining:number}};
