import { defineConfig,loadEnv } from 'vite';
import {resolveOnlineConfig} from './online-config.js';
export default defineConfig(({command,mode})=>{
 if(command==='build')resolveOnlineConfig(loadEnv(mode,process.cwd(),'VITE_').VITE_ONLINE_SERVER_URL,{production:true});
 return {base:'./',server:{port:5173,strictPort:true,watch:{ignored:['**/dist/**','**/.cache/**']}}};
});
