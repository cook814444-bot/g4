// 가경4 잔손 현황 앱: 켤 때는 폰에 남은 화면·3D 프로그램을 바로 쓰고, 뒤에서 새 것을 받아 둠 (화면이 바뀌었으면 열린 화면이 한 번 새로고침)
// 자료(잔손 목록)는 여기서 저장 안 함 — 화면(index.html)이 암호화된 채로 따로 남김
const C = 'g4-shell-2';
const CDN = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net'];
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // three.js 등은 판 번호가 박힌 주소라 안 바뀜 → 한 번 받으면 계속 폰에 있는 것 씀
  if (CDN.includes(u.hostname)) {
    e.respondWith(caches.match(e.request).then(h => h || fetch(e.request).then(r => {
      if (r.ok || r.type === 'opaque') { const c = r.clone(); caches.open(C).then(x => x.put(e.request, c)); }
      return r;
    })));
    return;
  }
  if (u.origin !== location.origin) return;
  // 화면: 남아 있는 것 바로 보여 주고, 동시에 새로 받아서 바꿔 둠
  // 11-26 새로 받을 땐 브라우저 캐시(10분)를 거치지 않게 no-cache · 화면(index)이 바뀌었으면 열린 화면에 알려 한 번 새로고침
  const old = caches.match(e.request, {ignoreSearch: true});
  let changed = Promise.resolve(false);
  const net = fetch(e.request, {cache: 'no-cache'}).then(r => {
    if (r.ok) {
      const c = r.clone();
      if (e.request.mode === 'navigate') changed = Promise.all([old, r.clone().text()]).then(async ([o, nt]) => !!o && (await o.clone().text()) !== nt);
      caches.open(C).then(x => x.put(e.request, c));
    }
    return r;
  });
  e.respondWith(old.then(h => (h ? h.clone() : net)));
  // 새 화면 창이 생길 때까지 잠깐 기다렸다가 알림 (너무 일찍 보내면 받을 창이 아직 없음)
  e.waitUntil(net.then(() => changed).then(async ch => {
    if (!ch) return;
    for (let i = 0; i < 10; i++) {
      const cl = e.resultingClientId && await self.clients.get(e.resultingClientId);
      if (cl) { cl.postMessage('g4-new'); return; }
      await new Promise(ok => setTimeout(ok, 400));
    }
    (await self.clients.matchAll({type: 'window'})).forEach(x => x.postMessage('g4-new'));
  }).catch(() => {}));
});
