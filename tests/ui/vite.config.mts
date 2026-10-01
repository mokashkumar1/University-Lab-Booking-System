import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';
const path=(value:string)=>fileURLToPath(new URL(value,import.meta.url));
export default defineConfig({root:path('./'),publicDir:path('../../public'),resolve:{alias:[{find:'@/lib/actions',replacement:path('./actions.ts')},{find:'next/link',replacement:path('./next-link.tsx')},{find:'next/image',replacement:path('./next-image.tsx')},{find:'next/navigation',replacement:path('./next-navigation.ts')},{find:'@',replacement:path('../../')}]},server:{host:'127.0.0.1',port:4178,strictPort:true,fs:{allow:[path('../../')]}},esbuild:{jsx:'automatic'}});
