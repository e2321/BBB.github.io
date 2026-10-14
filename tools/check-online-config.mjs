import {resolveOnlineConfig} from '../online-config.js';
try{
 const {url}=resolveOnlineConfig(process.env.VITE_ONLINE_SERVER_URL,{production:true});
 if(url)console.log('Production online endpoint validated: WSS.');
 else console.log('::warning::VITE_ONLINE_SERVER_URL is unset. Offline modes will be published; online mode will explain the missing server configuration.');
}catch(error){console.error(error.message);process.exitCode=1;}
