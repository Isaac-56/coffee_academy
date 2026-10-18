import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'TERA — Academy portal',description:'Learn with Henok Asrat. Courses, lessons and your coffee journey.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
