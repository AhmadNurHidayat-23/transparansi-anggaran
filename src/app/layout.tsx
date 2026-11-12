import type {Metadata} from 'next';
import './style.css';
export const metadata:Metadata={title:'Transparansi Anggaran',description:'Informasi anggaran dan realisasi desa. Prototipe independen untuk portofolio.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="id"><body>{children}</body></html>;}
