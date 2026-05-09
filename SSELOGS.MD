2026-05-09T11:02:14.776101904Z ==> Your service is live 🎉
2026-05-09T11:02:14.883206024Z ==> 
2026-05-09T11:02:14.889160297Z ==> ///////////////////////////////////////////////////////////
2026-05-09T11:02:14.892245451Z ==> 
2026-05-09T11:02:14.895171372Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-09T11:02:14.89761786Z ==> 
2026-05-09T11:02:14.900352606Z ==> ///////////////////////////////////////////////////////////
2026-05-09T11:02:31.29964602Z [POLL RATE] Last 60s: {"/api/users/heartbeat":0,"/api/bookings":0,"/api/notifications":0,"/api/sync":0,"/api/users/agents":0,"/api/settings/dropdowns":0,"/api/bookings/69fef6230277a28683d26269":0}
2026-05-09T11:07:13.161842321Z ==> Detected service running on port 10000
2026-05-09T11:07:13.261758723Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-05-09T11:13:14.717027608Z [POLL] GET / — 66ms | Status: 304 | Cache: MISS | Heap: 32MB
2026-05-09T11:13:14.717068911Z GET /api/notifications 304 - - 65.662 ms
2026-05-09T11:13:14.718736658Z POST /api/users/heartbeat 200 54 - 75.305 ms
2026-05-09T11:13:14.824350318Z [MONGOOSE SLOW] Booking.find - 103ms | filter: {}
2026-05-09T11:13:14.824594235Z [PERF] getBookings — Total: 104ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 104ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:13:14.825530571Z GET /api/bookings?page=1&limit=15 304 - - 105.769 ms
2026-05-09T11:13:55.069287759Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 33MB
2026-05-09T11:13:55.406819751Z [PERF] getBookings — Total: 9ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 9ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:13:55.407267753Z GET /api/bookings?page=1&limit=15 304 - - 10.862 ms
2026-05-09T11:13:55.862195281Z [PERF] getNotifications_69f04fe24a7ed39fe75e2117 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69f04fe24a7ed39fe75e2117' }
2026-05-09T11:13:55.862685066Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 33MB
2026-05-09T11:13:55.862763431Z GET /api/notifications 304 - - 0.903 ms
2026-05-09T11:14:08.627584123Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":4,"/api/users/heartbeat":2,"/api/bookings":4}
2026-05-09T11:15:08.628396129Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":0}
2026-05-09T11:15:46.983881967Z [PERF] getBookings — Total: 8ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 8ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:15:47.017264827Z GET /api/bookings?page=1&limit=15 304 - - 42.400 ms
2026-05-09T11:16:08.628568214Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":2}
2026-05-09T11:16:47.68621147Z [PERF] getBookings — Total: 8ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 8ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:16:47.686973644Z GET /api/bookings?page=1&limit=15 304 - - 10.059 ms
2026-05-09T11:17:08.629412579Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":2}
2026-05-09T11:18:08.629856495Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":0}
2026-05-09T11:19:08.630162825Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":0}
2026-05-09T11:20:08.630109706Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":0}
2026-05-09T11:20:23.435188872Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-09T11:20:24.196184413Z [PERF] getNotifications_69f04fe24a7ed39fe75e2117 — Total: 12ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 12ms { source: 'db', userId: '69f04fe24a7ed39fe75e2117', count: 0 }
2026-05-09T11:20:24.196770784Z [POLL] GET / — 13ms | Status: 304 | Cache: MISS | Heap: 34MB
2026-05-09T11:20:24.196910404Z GET /api/notifications 304 - - 12.908 ms
2026-05-09T11:20:24.20599657Z [PERF] getBookings — Total: 25ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 25ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:20:24.206676568Z GET /api/bookings?page=1&limit=15 304 - - 26.096 ms
2026-05-09T11:20:36.317903045Z POST /api/users/offline 200 16 - 52.807 ms
2026-05-09T11:20:49.928707172Z ==> Deploying...
2026-05-09T11:20:50.043965249Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-09T11:21:01.223921614Z ==> Running 'npm run start'
2026-05-09T11:21:02.338493716Z 
2026-05-09T11:21:02.338516546Z > travel-crm-backend@1.0.0 start
2026-05-09T11:21:02.338520186Z > node dist/src/server.js
2026-05-09T11:21:02.338522306Z 
2026-05-09T11:21:08.427230106Z [PRIMARY] 83 is running. Forking 1 workers...
2026-05-09T11:21:08.520969624Z ✅ MongoDB Connected: undefined | Database: undefined
2026-05-09T11:21:08.629779128Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":2,"/api/users/heartbeat":0,"/api/bookings":2,"/api/users/offline":2}
2026-05-09T11:21:10.224455703Z ✅ MongoDB Connected: ac-g3tynuf-shard-00-00.wxmise3.mongodb.net | Database: TESTDATA
2026-05-09T11:21:10.822378851Z [MONGOOSE SLOW] User.find - 2298ms | filter: {"role":{"$in":["agent","manager","AGENT","MANAGER"]}}
2026-05-09T11:21:10.822399171Z [CACHE] Warm-up: 10 agents cached
2026-05-09T11:21:11.01984074Z ✅ Dropdown cache warmed successfully
2026-05-09T11:21:11.019888791Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-09T11:21:11.020539385Z 🚀 Primary startup tasks complete.
2026-05-09T11:21:16.423998549Z ✅ MongoDB Connected: undefined | Database: undefined
2026-05-09T11:21:17.323481496Z ✅ MongoDB Connected: ac-g3tynuf-shard-00-00.wxmise3.mongodb.net | Database: TESTDATA
2026-05-09T11:21:17.630030432Z ✅ Dropdown cache warmed successfully
2026-05-09T11:21:17.733290914Z [MONGOOSE SLOW] User.find - 1308ms | filter: {"role":{"$in":["agent","manager","AGENT","MANAGER"]}}
2026-05-09T11:21:17.733346685Z [CACHE] Warm-up: 10 agents cached
2026-05-09T11:21:17.820650356Z [SSE] Heartbeat started (30s interval)
2026-05-09T11:21:17.826177864Z [WORKER] 95 started on port 10000
2026-05-09T11:21:18.224242521Z HEAD / 200 36 - 2.174 ms
2026-05-09T11:21:20.97591257Z ==> Your service is live 🎉
2026-05-09T11:21:21.057918697Z GET / 200 36 - 0.349 ms
2026-05-09T11:21:21.155470056Z ==> 
2026-05-09T11:21:21.157894678Z ==> ///////////////////////////////////////////////////////////
2026-05-09T11:21:21.160292178Z ==> 
2026-05-09T11:21:21.162779101Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-09T11:21:21.16555391Z ==> 
2026-05-09T11:21:21.167703155Z ==> ///////////////////////////////////////////////////////////
2026-05-09T11:22:08.464934674Z GET /api/api/stream?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YWU3YWIwYzhmYmNiMzEzZmEwYzc0NCIsInJvbGUiOiJBRE1JTiIsIm5hbWUiOiJHdXJwcmVldCBTaW5naCIsImVtYWlsIjoiYWRtaW5AdHJhdmVsLmNvbSIsImlhdCI6MTc3ODIzOTM3OCwiZXhwIjoxNzgwODMxMzc4fQ.QwuS-CLolng1Gk3qgBNSPAU9bwtMWvAGAXNYpRM5mqw 404 153 - 1.244 ms
2026-05-09T11:22:08.467629351Z [POLL] OPTIONS /api/sync — 1ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:08.63020984Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/users/heartbeat":0,"/api/bookings":0,"/api/users/offline":0}
2026-05-09T11:22:08.826156556Z [PERF] getGlobalSync — Total: 81ms | dbQuery: 81ms | formatResponse: 0ms { source: 'db', bookingsCount: 1 }
2026-05-09T11:22:08.827029065Z [POLL] GET / — 85ms | Status: 200 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:08.827045335Z GET /api/sync 200 756 - 85.016 ms
2026-05-09T11:22:08.973281834Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:09.298148032Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 3ms | checkCache: 0ms | dbQuery: 1ms | formatResponse: 2ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-09T11:22:09.298693463Z [POLL] GET / — 5ms | Status: 304 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:09.298714394Z GET /api/notifications 304 - - 4.166 ms
2026-05-09T11:22:12.320995773Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:12.606941511Z [PERF] getBookings — Total: 9ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 9ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:22:12.619048769Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-09T11:22:12.619604961Z [POLL] GET /dropdowns — 7ms | Status: 304 | Cache: HIT | Heap: 34MB
2026-05-09T11:22:12.619622221Z GET /api/settings/dropdowns 304 - - 6.145 ms
2026-05-09T11:22:12.620224824Z GET /api/bookings?page=1&limit=15 200 - - 10.947 ms
2026-05-09T11:22:13.102252493Z [PERF] getAgents — Total: 1ms | finalProcessing: 1ms { source: 'cache' }
2026-05-09T11:22:13.103703514Z GET /api/users/agents 200 - - 1.215 ms
2026-05-09T11:22:14.915585283Z GET /api/api/stream?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YWU3YWIwYzhmYmNiMzEzZmEwYzc0NCIsInJvbGUiOiJBRE1JTiIsIm5hbWUiOiJHdXJwcmVldCBTaW5naCIsImVtYWlsIjoiYWRtaW5AdHJhdmVsLmNvbSIsImlhdCI6MTc3ODIzOTM3OCwiZXhwIjoxNzgwODMxMzc4fQ.QwuS-CLolng1Gk3qgBNSPAU9bwtMWvAGAXNYpRM5mqw 404 153 - 0.359 ms
2026-05-09T11:22:15.451579523Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 1, limit: 15, total: 11, returned: 11 }
2026-05-09T11:22:15.452813789Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 7.876 ms
2026-05-09T11:22:16.422429646Z [POLL RATE] Last 60s: {"/":2,"/api/api/stream":2,"/api/sync":2,"/api/notifications":2,"/api/settings/dropdowns":2,"/api/bookings":4,"/api/users/agents":2}
2026-05-09T11:22:16.44231482Z GET /api/api/stream?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YWU3YWIwYzhmYmNiMzEzZmEwYzc0NCIsInJvbGUiOiJBRE1JTiIsIm5hbWUiOiJHdXJwcmVldCBTaW5naCIsImVtYWlsIjoiYWRtaW5AdHJhdmVsLmNvbSIsImlhdCI6MTc3ODIzOTM3OCwiZXhwIjoxNzgwODMxMzc4fQ.QwuS-CLolng1Gk3qgBNSPAU9bwtMWvAGAXNYpRM5mqw 404 153 - 0.358 ms
2026-05-09T11:22:21.590969307Z [PERF] getBookings — Total: 5ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 5ms { page: 1, limit: 15, total: 4, returned: 4 }
2026-05-09T11:22:21.592138212Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 6.134 ms
2026-05-09T11:22:22.630194149Z [PERF] getBookings — Total: 3ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 3ms { page: 1, limit: 15, total: 0, returned: 0 }
2026-05-09T11:22:22.630782402Z GET /api/bookings?assignedTo=unassigned&myBookings=true&page=1&limit=15 200 99 - 4.460 ms
2026-05-09T11:22:26.655517422Z [PERF] getBookings — Total: 14ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 14ms { page: 1, limit: 15, total: 60, returned: 15 }
2026-05-09T11:22:26.657379852Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 200 - - 14.475 ms
2026-05-09T11:22:28.018591001Z GET /api/bookings/calendar?month=5&year=2026 200 - - 9.412 ms
2026-05-09T11:22:37.623231984Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:37.91187778Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-09T11:22:37.91235748Z [POLL] GET / — 2ms | Status: 304 | Cache: HIT | Heap: 34MB
2026-05-09T11:22:37.91237268Z GET /api/notifications 304 - - 0.846 ms
2026-05-09T11:22:37.921859642Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-09T11:22:37.922438725Z GET /api/bookings?page=1&limit=15 304 - - 0.851 ms
2026-05-09T11:22:55.857714269Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 2, limit: 15, total: 613, returned: 15 }
2026-05-09T11:22:55.858990516Z GET /api/bookings?page=2&limit=15 200 - - 7.959 ms
2026-05-09T11:22:56.719287635Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-09T11:22:56.724848143Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-09T11:22:56.725384975Z GET /api/bookings?page=2&limit=15 304 - - 0.879 ms
2026-05-09T11:22:57.000056893Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-09T11:22:57.000436731Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 34MB
2026-05-09T11:22:57.000461842Z GET /api/notifications 304 - - 0.655 ms
2026-05-09T11:22:58.44964889Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 3, limit: 15, total: 613, returned: 15 }
2026-05-09T11:22:58.450903247Z GET /api/bookings?page=3&limit=15 200 - - 7.850 ms
2026-05-09T11:23:00.418895202Z GET /api/analytics/payment-breakdown?fromDate=2026-04-09&toDate=2026-05-09&company= 200 - - 10.091 ms
2026-05-09T11:23:00.419541105Z GET /api/analytics/bookings?fromDate=2026-04-09&toDate=2026-05-09&company= 200 263 - 7.019 ms
2026-05-09T11:23:00.436851414Z GET /api/analytics/revenue-trends?interval=week&company= 304 - - 3.157 ms
2026-05-09T11:23:00.447479331Z GET /api/analytics/agents?fromDate=2026-04-09&toDate=2026-05-09&company= 200 - - 32.632 ms
2026-05-09T11:23:00.565736983Z GET /api/analytics/payments?fromDate=2026-04-09&toDate=2026-05-09&company= 200 100 - 4.079 ms
2026-05-09T11:23:09.43197428Z [PERF] getBookings — Total: 8ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 8ms { page: 1, limit: 15, total: 11, returned: 11 }
2026-05-09T11:23:09.432487821Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 9.386 ms
2026-05-09T11:23:10.589814536Z [PERF] getBookings — Total: 9ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 9ms { page: 1, limit: 15, total: 4, returned: 4 }
2026-05-09T11:23:10.590219045Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 9.606 ms
2026-05-09T11:23:10.627929919Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-09T11:23:10.62844635Z GET /api/bookings?page=1&limit=15 304 - - 7.815 ms
2026-05-09T11:23:11.491955658Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 1ms | dbQuery: 6ms { page: 1, limit: 15, total: 60, returned: 15 }
2026-05-09T11:23:11.492602462Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 7.748 ms
2026-05-09T11:23:12.968270387Z [PERF] getAllUsers — Total: 3ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 2ms | finalProcessing: 1ms { source: 'db', count: 14 }
2026-05-09T11:23:12.969288319Z GET /api/users 200 - - 4.224 ms
2026-05-09T11:23:14.384504984Z [POLL] OPTIONS /api/settings/dropdowns — 1ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-09T11:23:14.669830241Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-09T11:23:14.670219719Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 35MB
2026-05-09T11:23:14.670243919Z GET /api/settings/dropdowns 304 - - 0.776 ms
2026-05-09T11:23:16.422394512Z [POLL RATE] Last 60s: {"/":0,"/api/api/stream":1,"/api/sync":0,"/api/notifications":4,"/api/settings/dropdowns":2,"/api/bookings":21,"/api/users/agents":0,"/api/bookings/calendar":2,"/api/analytics/payment-breakdown":2,"/api/analytics/bookings":2,"/api/analytics/revenue-trends":2,"/api/analytics/agents":2,"/api/analytics/payments":2,"/api/users":2}
2026-05-09T11:23:16.724043636Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-09T11:23:17.035864207Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 3ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 3ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-09T11:23:17.036256476Z [POLL] GET / — 4ms | Status: 304 | Cache: MISS | Heap: 35MB
2026-05-09T11:23:17.036271596Z GET /api/notifications 304 - - 3.310 ms
2026-05-09T11:23:17.364764252Z [POLL] OPTIONS /api/sync — 0ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-09T11:23:17.668623654Z [PERF] getGlobalSync — Total: 0ms |  { source: 'cache' }
2026-05-09T11:23:17.669034502Z [POLL] GET / — 1ms | Status: 304 | Cache: MISS | Heap: 35MB
2026-05-09T11:23:17.669046073Z GET /api/sync 304 - - 0.765 ms
2026-05-09T11:23:18.539407627Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-09T11:23:18.540304117Z GET /api/bookings?page=1&limit=15 304 - - 1.070 ms
2026-05-09T11:23:18.566740421Z [PERF] getAgents — Total: 0ms |  { source: 'cache' }
2026-05-09T11:23:18.566852903Z GET /api/users/agents 304 - - 1.196 ms
2026-05-09T11:23:37.616091515Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-09T11:23:37.895007444Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-09T11:23:37.895091786Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 36MB
2026-05-09T11:23:37.895098926Z GET /api/notifications 304 - - 0.775 ms
2026-05-09T11:23:37.902662637Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-09T11:23:37.903615518Z GET /api/bookings?page=1&limit=15 304 - - 1.606 ms