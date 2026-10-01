import { FlaskConical } from 'lucide-react';
import Link from 'next/link';
export function Logo({compact=false}:{compact?:boolean}) { return <Link className="brand" href="/dashboard" aria-label="UniLab home"><span className="brand-mark"><FlaskConical size={26}/><i/></span><span><strong>UniLab</strong>{!compact && <small>Book. Learn. Innovate.</small>}</span></Link>; }
