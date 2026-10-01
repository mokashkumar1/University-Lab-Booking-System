'use client';
import { useState } from 'react';
import Image from 'next/image';
import { FlaskConical, Cpu } from 'lucide-react';
export default function ResourceImage({resource,equipment=false}:{resource:Record<string,any>;equipment?:boolean}){const [failed,setFailed]=useState(false);const src=resource.image_url||(equipment?'/images/equipment.jpg':'/images/lab.jpg');return <div className="resource-image">{failed?<div className="image-placeholder">{equipment?<Cpu size={44}/>:<FlaskConical size={44}/>}<span>{resource.name}</span></div>:<Image src={src} alt={resource.name} fill sizes="(max-width: 767px) 100vw, (max-width: 1200px) 50vw, 33vw" style={{objectFit:'cover'}} unoptimized={/^https?:/.test(src)&&!src.startsWith('https://images.unsplash.com/')} onError={()=>setFailed(true)}/>}</div>;}
