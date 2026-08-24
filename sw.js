const CACHE='mingji-otter-max999999-v3631';
const OFFLINE='./index.html';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(SHELL))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

async function navigationResponse(request){
  try{
    const fresh=await fetch(request,{cache:'no-store'});
    if(fresh&&fresh.ok){
      const cache=await caches.open(CACHE);
      cache.put('./index.html',fresh.clone()).catch(()=>{});
    }
    return fresh;
  }catch(_){
    return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
  }
}

async function assetResponse(request){
  const cached=await caches.match(request);
  const networkPromise=fetch(request,{cache:'no-cache'}).then(async fresh=>{
    if(fresh&&fresh.ok){
      const cache=await caches.open(CACHE);
      cache.put(request,fresh.clone()).catch(()=>{});
    }
    return fresh;
  }).catch(()=>null);
  return cached || (await networkPromise) || Response.error();
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith('/admin')||url.pathname.endsWith('/admin.html')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  if(event.request.mode==='navigate'){
    event.respondWith(navigationResponse(event.request));
    return;
  }

  if(url.pathname.endsWith('/sw.js')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }

  event.respondWith(assetResponse(event.request));
});
