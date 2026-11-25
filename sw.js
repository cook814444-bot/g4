// 가경4 잔손 현황 앱: 켤 때는 폰에 남은 화면·3D 프로그램을 바로 쓰고, 뒤에서 새 것을 받아 둠 (다음 켤 때 반영)
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
  const net = fetch(e.request).then(r => {
    if (r.ok) { const c = r.clone(); caches.open(C).then(x => x.put(e.request, c)); }
    return r;
  });
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(h => h || net));
  e.waitUntil(net.catch(() => {}));
});
