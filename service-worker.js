// 🚀 Skopelos Plan PWA Service Worker
// Verzija: 1.0 - Offline-first strategija

const CACHE_NAME = 'skopelos-plan-v1.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/assistant/assistant.js',
  '/assistant/weather.js',
  '/assistant/assistant.css',
  '/assistant/modals.css', 
  '/assistant/weather.css',
  '/data/places.json',
  '/data/restaurants.json',
  '/data/transport.json',
  '/data/activities.json',
  '/Ajna i JA.JPG',
  '/Panormos Beach.jpg',
  '/Bus iz Loutraki kreće i dalje posjećuje ostale stanice.jpg',
  '/Bus iz Skolpelosa kreće i dalje posjećuje ostale stanice.jpg',
  '/every Wednesday is Mamma Mia Night.jpg',
  '/Slika rute busa.jpg',
  '/Trajekt 1.jpg',
  '/Trajekt 2.jpg',
  '/Trajekt 3.jpg',
  '/Trajekt, povratna.png',
  '/The Pine Trees, 2508-0409.png',
  '/To Ktima tis Matinas, 2308-2508.png',
  '/Price for Taxi.jpg',
  '/Uplaćena akontacija 180e.jpg',
  'https://cdn-icons-png.flaticon.com/512/5111/5111522.png'
];

// === INSTALL EVENT ===
self.addEventListener('install', event => {
  console.log('🚀 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Caching app shell...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ All files cached successfully');
        self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Cache failed:', error);
      })
  );
});

// === ACTIVATE EVENT ===
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      self.clients.claim();
    })
  );
});

// === FETCH EVENT - OFFLINE-FIRST STRATEGIJA ===
self.addEventListener('fetch', event => {
  // Skip za chrome-extension i non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Vrati cache ako postoji
        if (response) {
          console.log('📦 Serving from cache:', event.request.url);
          return response;
        }

        // Inače pokušaj fetch
        return fetch(event.request)
          .then(response => {
            // Provjeri da li je valjan response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response za cache
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Fallback za offline
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// === PUSH NOTIFICATIONS ===
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Novi update za vaš Skopelos plan!',
    icon: 'https://cdn-icons-png.flaticon.com/192/5111/5111522.png',
    badge: 'https://cdn-icons-png.flaticon.com/192/5111/5111522.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Otvori plan',
        icon: 'https://cdn-icons-png.flaticon.com/192/5111/5111522.png'
      },
      {
        action: 'close',
        title: 'Zatvori'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('🏖️ Skopelos Plan', options)
  );
});

// === NOTIFICATION CLICK ===
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// === BACKGROUND SYNC ===
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return fetch('/api/sync')
    .then(response => response.json())
    .then(data => {
      console.log('🔄 Background sync completed:', data);
    })
    .catch(error => {
      console.log('❌ Background sync failed:', error);
    });
}
