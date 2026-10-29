'use strict';
if(typeof importScripts==='function')importScripts('options.js','sharing.js');
(function(){
  const api=globalThis.browser||globalThis.chrome,share=PCStudioSharing,cache=new Map(),pending=new Map(),TTL=5*60*1000;
  function extensionPage(sender){return sender.id===api.runtime.id&&typeof sender.url==='string'&&sender.url.startsWith(api.runtime.getURL(''));}
  function currentOwner(sender){try{const u=new URL(sender.url||'');if(sender.id!==api.runtime.id||u.origin!=='https://github.com'||u.searchParams.get('tab')&&u.searchParams.get('tab')!=='overview')return null;return /^\/[a-z0-9-]+\/?$/i.test(u.pathname)?PCWinterOptions.loginFor(u.pathname.slice(1).replace(/\/$/,'')):null;}catch{return null;}}
  async function textAt(url,max){
    const response=await fetch(url,{credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(12000),headers:{Accept:'application/json'}});
    if(response.status===404)return null;
    if(response.status===403||response.status===429)throw Error('GitHub ограничил запросы. Попробуй позже.');
    if(!response.ok)throw Error('GitHub вернул ошибку '+response.status+'.');
    if(Number(response.headers.get('content-length'))>max)throw Error('Ответ слишком большой.');
    const reader=response.body.getReader(),decoder=new TextDecoder();let result='',size=0;
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>max){await reader.cancel();throw Error('Ответ слишком большой.');}result+=decoder.decode(part.value,{stream:true});}
    return result+decoder.decode();
  }
  async function cached(key,load,refresh){
    const old=cache.get(key);if(!refresh&&old&&Date.now()-old.time<TTL)return old.value;
    if(pending.has(key))return pending.get(key);
    const work=(async()=>{const value=await load();cache.set(key,{time:Date.now(),value});let bytes=0;for(const [name,item]of [...cache].reverse()){bytes+=JSON.stringify(item.value).length;if(bytes>16000000||cache.size>20)cache.delete(name);}return value;})();
    pending.set(key,work);try{return await work;}finally{pending.delete(key);}
  }
  async function getTheme(ref,refresh){const r=share.reference(ref);return cached('theme:'+r.owner+'/'+r.file,async()=>{const text=await textAt(share.rawURL(r),8000000);return text===null?null:share.parse(text,r.owner);},refresh);}
  api.runtime.onMessage.addListener((message,sender,respond)=>{
    if(sender.id!==api.runtime.id||!message||typeof message.type!=='string')return false;
    const local=extensionPage(sender),owner=currentOwner(sender);
    let action;
    if(message.type==='studio-owner-theme'&&owner&&message.owner===owner)action=async()=>{
      const state=await api.storage.local.get(['enabled','showPublished']);if(state.enabled===false||state.showPublished===false)return {theme:null};
      return {theme:await getTheme({owner},false)};
    };
    else if(message.type==='studio-fetch-theme'&&local)action=async()=>({theme:await getTheme(message.ref,Boolean(message.refresh))});
    else if(message.type==='studio-gallery'&&local)action=async()=>({entries:await cached('gallery',async()=>{const text=await textAt('https://api.github.com/repos/'+share.HUB+'/issues?state=open&per_page=100&sort=created&direction=desc',2000000);return share.entries(JSON.parse(text||'[]'));},Boolean(message.refresh))});
    else if(message.type==='studio-open'&&(local||owner))action=async()=>{
      let query='';if(message.remix&&owner)query='?remix='+owner;else if(owner)query='?profile='+owner;
      await api.tabs.create({url:api.runtime.getURL(message.gallery?'gallery.html':'studio.html')+query});return {ok:true};
    };
    if(!action)return false;
    action().then(value=>respond({ok:true,...value}),error=>respond({ok:false,error:error.message||'Не удалось загрузить тему.'}));return true;
  });
})();
