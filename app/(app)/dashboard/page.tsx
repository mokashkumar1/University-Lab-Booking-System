import Screen from '@/components/screens/route';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){return <Screen screen='dashboard' query={await searchParams}/>;}
