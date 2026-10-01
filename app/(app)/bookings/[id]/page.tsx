import Screen from '@/components/screens/route';
export default async function Page({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}){return <Screen screen='booking-detail' id={(await params).id} query={await searchParams}/>;}
