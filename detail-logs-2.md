2026-05-07T10:11:06.801498946Z ==> Deploying...
2026-05-07T10:11:06.885600522Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-07T10:11:17.294145999Z ==> Running 'npm run start'
2026-05-07T10:11:18.29816347Z 
2026-05-07T10:11:18.29818629Z > travel-crm-backend@1.0.0 start
2026-05-07T10:11:18.2981902Z > node dist/src/server.js
2026-05-07T10:11:18.2981922Z 
2026-05-07T10:11:25.198483077Z Server running in production mode on port 10000
2026-05-07T10:11:25.198762343Z Self-pinging: Initialized for https://travelcrm-2-0.onrender.com
2026-05-07T10:11:25.3967401Z HEAD / 200 36 - 69.872 ms
2026-05-07T10:11:26.013121439Z MongoDB Connected: ac-nvjnavm-shard-00-01.31xmkrx.mongodb.net
2026-05-07T10:11:26.092508232Z Synchronizing indexes in background...
2026-05-07T10:11:26.156045341Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-07T10:11:26.157070423Z 🚀 Startup tasks complete. System ready.
2026-05-07T10:11:27.271489983Z [MONGOOSE SLOW] Booking.find - 1114ms | filter: {"status":"Follow Up","followUpDate":{"$lte":"2026-05-07T23:59:59.000Z","$ne":null}}
2026-05-07T10:11:27.671059686Z ✅ Index synchronization complete
2026-05-07T10:11:27.826542995Z ==> Your service is live 🎉
2026-05-07T10:11:27.85693081Z GET / 200 36 - 0.437 ms
2026-05-07T10:11:27.919815951Z ==> 
2026-05-07T10:11:27.922400269Z ==> ///////////////////////////////////////////////////////////
2026-05-07T10:11:27.924936346Z ==> 
2026-05-07T10:11:27.927150346Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-07T10:11:27.929713554Z ==> 
2026-05-07T10:11:27.931968874Z ==> ///////////////////////////////////////////////////////////
2026-05-07T10:11:58.33585695Z [POLL RATE] Last 60s: {"/":0,"/api/auth/login":0,"/api/sync":0,"/api/notifications":0,"/api/bookings":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/bookings":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/bookings/69f863453ed07ab843f38758":0,"/api/bookings/69f845093ed07ab843f3840c":0,"/api/bookings/69f86db23ed07ab843f3891a":0,"/api/bookings/69f08d221229ef87385899a8":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69d77b38519a503fc23eed2b":0,"/api/users/offline":0,"/api/bookings/69fc42c81b90d6e6cbf74a9e":0,"/api/bookings/69fc5a9757331c2809c46796":0,"/api/bookings/69fc5a9757331c2809c46796/status":0,"/api/bookings/69fc5a9757331c2809c46796/payments":0,"/api/bookings/69fc5a9757331c2809c46796/payments/69fc5aef57331c2809c467bd":0,"/api/bookings/69fc5a9757331c2809c46796/passengers":0,"/api/bookings/69fc5a9757331c2809c46796/verify":0,"/api/bookings/69fc5a9757331c2809c46796/comments":0,"/api/bookings/69fc5a9757331c2809c46796/payments/69fc5b0c57331c2809c467cf":0,"/api/settings/dropdowns/costSources":0,"/api/users/heartbeat":0}
2026-05-07T10:12:25.094839087Z [POLL RATE] Last 60s: {"/":2}
2026-05-07T10:12:29.267432346Z [PERF] loginUser — Total: 225ms | validate: 1ms | dbQuery: 67ms | bcryptVerify: 82ms | passwordUpgradeCheck: 0ms { email: 'admin@travel.com', role: 'ADMIN' }
2026-05-07T10:12:29.269976052Z POST /api/auth/login 200 413 - 227.080 ms
2026-05-07T10:12:30.076947696Z [POLL] OPTIONS /api/sync — 1ms | Status: 204 | Cache: MISS | Heap: 36MB
2026-05-07T10:12:30.094583078Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 36MB
2026-05-07T10:12:30.524285323Z [MONGOOSE SLOW] Booking.find - 162ms | filter: {"updatedAt":{"$gte":"2026-05-06T10:12:30.360Z"}}
2026-05-07T10:12:30.531972694Z [POLL] GET / — 174ms | Status: 200 | Cache: MISS | Heap: 36MB
2026-05-07T10:12:30.531993504Z GET /api/sync 200 - - 166.810 ms
2026-05-07T10:12:30.905129531Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 69ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 69ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-07T10:12:30.905797216Z [POLL] GET / — 71ms | Status: 304 | Cache: MISS | Heap: 36MB
2026-05-07T10:12:30.905822476Z GET /api/notifications 304 - - 70.451 ms
2026-05-07T10:12:32.832062448Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 37MB
2026-05-07T10:12:33.186735925Z [PERF] getAgents — Total: 69ms | checkCache: 0ms | dbQuery: 69ms | formatResponse: 0ms { source: 'db', count: 12 }
2026-05-07T10:12:33.188145096Z GET /api/users/agents 200 - - 70.523 ms
2026-05-07T10:12:33.195236643Z [PERF] getDropdowns — Total: 66ms | checkCache: 0ms | dbQuery: 0ms | mergeDefaults: 65ms { source: 'db' }
2026-05-07T10:12:33.196588944Z [POLL] GET /dropdowns — 67ms | Status: 304 | Cache: MISS | Heap: 37MB
2026-05-07T10:12:33.196616664Z GET /api/settings/dropdowns 304 - - 67.112 ms
2026-05-07T10:12:33.261423955Z [MONGOOSE SLOW] Booking.find - 137ms | filter: {}
2026-05-07T10:12:33.261758653Z [PERF] getBookings — Total: 137ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 137ms { page: 1, limit: 15, total: 567, returned: 15 }
2026-05-07T10:12:33.263606964Z GET /api/bookings?page=1&limit=15 200 - - 139.000 ms
2026-05-07T10:12:35.929508534Z [MONGOOSE SLOW] User.find - 125ms | filter: {"_id":{"$in":["69c53849220e3d8fa652f108","69c538b0220e3d8fa652f122","69eb50af8e47cc04dc29918d","69c2a1b98787a5edc5143f9d","69c537cb220e3d8fa652f0f2","69c53915220e3d8fa652f131"]}}
2026-05-07T10:12:35.934373122Z [MONGOOSE SLOW] User.find - 129ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-07T10:12:35.934386912Z [MONGOOSE SLOW] Booking.find - 279ms | filter: {"$or":[{"assignedToUserId":"69ae7ab0c8fbcb313fa0c744"},{"createdByUserId":"69ae7ab0c8fbcb313fa0c744"}]}
2026-05-07T10:12:35.934401203Z [PERF] getBookings — Total: 280ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 280ms { page: 1, limit: 15, total: 11, returned: 11 }
2026-05-07T10:12:35.935420635Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 280.866 ms
2026-05-07T10:12:43.102239994Z [MONGOOSE SLOW] User.find - 3528ms | filter: {"_id":{"$in":["69cbb0d312d6ce0419000911"]}}
2026-05-07T10:12:43.102488909Z [MONGOOSE SLOW] Booking.find - 5354ms | filter: {"assignedToUserId":{"$in":[null]}}
2026-05-07T10:12:43.102721505Z [PERF] getBookings — Total: 5355ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 5355ms { page: 1, limit: 15, total: 4, returned: 4 }
2026-05-07T10:12:43.104234358Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=unassigned&page=1&limit=15 — 5356ms | Status: 200 | Heap: 35MB
2026-05-07T10:12:43.104301Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 5355.625 ms
2026-05-07T10:23:07.033026005Z GET /api/users/agents 304 - - 0.916 ms
2026-05-07T10:23:19.891454129Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-07T10:23:20.176139823Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:23:20.176788427Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-07T10:23:20.176804708Z GET /api/notifications 304 - - 0.712 ms
2026-05-07T10:23:25.095357172Z [POLL RATE] Last 60s: {"/":0,"/api/auth/login":0,"/api/sync":0,"/api/notifications":4,"/api/settings/dropdowns":2,"/api/users/agents":2,"/api/bookings":3,"/api/bookings/69d3439e519a503fc23ebfe0":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69d6014f519a503fc23ede18":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/payments":0,"/api/analytics/bookings":0,"/api/analytics/revenue-trends":0,"/api/analytics/agents":0,"/api/analytics/payment-breakdown":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69ce6c013cb589cd1818d44a":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e077dc519a503fc23f2739":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69e7223f519a503fc23f4cb9":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69c66180220e3d8fa652fd6c":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69ca5db4220e3d8fa6531178":0,"/api/bookings/69d8865f519a503fc23ef1d2":0,"/api/bookings/69f5ce088148832a3c146a6b":0,"/api/bookings/69f20a3f67553ddabb8916fe":0,"/api/bookings/69df90e1519a503fc23f2580":0,"/api/bookings/69dccb2b519a503fc23f0fa4":0,"/api/bookings/69fc67d26f2a843ea15c3d29":7,"/api/bookings/69fc67d26f2a843ea15c3d29/status":4}
2026-05-07T10:23:40.457138433Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-07T10:23:40.736521333Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:23:40.736912742Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-07T10:23:40.736926142Z GET /api/notifications 304 - - 0.540 ms
2026-05-07T10:24:01.022617297Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-07T10:24:01.428764972Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 68ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 68ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-07T10:24:01.429093969Z [POLL] GET / — 68ms | Status: 304 | Cache: MISS | Heap: 42MB
2026-05-07T10:24:01.429106159Z GET /api/notifications 304 - - 68.591 ms
2026-05-07T10:24:21.782151286Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-07T10:24:22.057293258Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:24:22.057677587Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-07T10:24:22.057692027Z GET /api/notifications 304 - - 0.661 ms
2026-05-07T10:24:25.095376537Z [POLL RATE] Last 60s: {"/":0,"/api/auth/login":0,"/api/sync":0,"/api/notifications":6,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69d3439e519a503fc23ebfe0":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69d6014f519a503fc23ede18":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/payments":0,"/api/analytics/bookings":0,"/api/analytics/revenue-trends":0,"/api/analytics/agents":0,"/api/analytics/payment-breakdown":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69ce6c013cb589cd1818d44a":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e077dc519a503fc23f2739":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69e7223f519a503fc23f4cb9":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69c66180220e3d8fa652fd6c":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69ca5db4220e3d8fa6531178":0,"/api/bookings/69d8865f519a503fc23ef1d2":0,"/api/bookings/69f5ce088148832a3c146a6b":0,"/api/bookings/69f20a3f67553ddabb8916fe":0,"/api/bookings/69df90e1519a503fc23f2580":0,"/api/bookings/69dccb2b519a503fc23f0fa4":0,"/api/bookings/69fc67d26f2a843ea15c3d29":0,"/api/bookings/69fc67d26f2a843ea15c3d29/status":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments":2}
2026-05-07T10:25:05.362500773Z [MONGOOSE SLOW] Booking.findOne - 48721ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:05.46628129Z [PERF] addPayment_69fc67d26f2a843ea15c3d29 — Total: 48826ms | validate: 0ms | insertPayment: 48826ms | cacheInvalidation: 0ms { bookingId: '69fc67d26f2a843ea15c3d29', amount: 6554 }
2026-05-07T10:25:05.46906876Z 🐌 SLOW REQUEST: POST /api/bookings/69fc67d26f2a843ea15c3d29/payments — 48827ms | Status: 201 | Heap: 42MB
2026-05-07T10:25:05.469094511Z POST /api/bookings/69fc67d26f2a843ea15c3d29/payments 201 307 - 48826.859 ms
2026-05-07T10:25:05.608944448Z [BG:OK] addPayment_sideEffects: 141ms
2026-05-07T10:25:05.816072371Z [MONGOOSE SLOW] Timeline.find - 138ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:05.816091122Z [MONGOOSE SLOW] Booking.findOne - 207ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:06.042140565Z [PERF] getBookingById_69fc67d26f2a843ea15c3d29 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:25:06.043967835Z GET /api/bookings/69fc67d26f2a843ea15c3d29 200 - - 0.958 ms
2026-05-07T10:25:11.206695639Z [PERF] deletePayment_69fc67d26f2a843ea15c3d29 — Total: 210ms | validate: 0ms | findPayment: 70ms | deletePayment: 68ms {
2026-05-07T10:25:11.206718049Z   bookingId: '69fc67d26f2a843ea15c3d29',
2026-05-07T10:25:11.206722839Z   paymentId: '69fc68816f2a843ea15c3d61'
2026-05-07T10:25:11.206726219Z }
2026-05-07T10:25:11.207986467Z DELETE /api/bookings/69fc67d26f2a843ea15c3d29/payments/69fc68816f2a843ea15c3d61 200 42 - 210.643 ms
2026-05-07T10:25:11.357391641Z [BG:OK] deletePayment_sideEffects_69fc67d26f2a843ea15c3d29: 150ms
2026-05-07T10:25:11.553697511Z [MONGOOSE SLOW] Timeline.find - 126ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:11.553720321Z [MONGOOSE SLOW] Booking.findOne - 195ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:11.772989619Z [PERF] getBookingById_69fc67d26f2a843ea15c3d29 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:25:11.774143204Z GET /api/bookings/69fc67d26f2a843ea15c3d29 200 - - 0.880 ms
2026-05-07T10:25:22.349962527Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-07T10:25:22.699595788Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 62ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 62ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-07T10:25:22.699616468Z [POLL] GET / — 64ms | Status: 304 | Cache: MISS | Heap: 42MB
2026-05-07T10:25:22.699622548Z GET /api/notifications 304 - - 63.370 ms
2026-05-07T10:25:25.096221621Z [POLL RATE] Last 60s: {"/":0,"/api/auth/login":0,"/api/sync":0,"/api/notifications":2,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69d3439e519a503fc23ebfe0":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69d6014f519a503fc23ede18":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/payments":0,"/api/analytics/bookings":0,"/api/analytics/revenue-trends":0,"/api/analytics/agents":0,"/api/analytics/payment-breakdown":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69ce6c013cb589cd1818d44a":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e077dc519a503fc23f2739":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69e7223f519a503fc23f4cb9":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69c66180220e3d8fa652fd6c":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69ca5db4220e3d8fa6531178":0,"/api/bookings/69d8865f519a503fc23ef1d2":0,"/api/bookings/69f5ce088148832a3c146a6b":0,"/api/bookings/69f20a3f67553ddabb8916fe":0,"/api/bookings/69df90e1519a503fc23f2580":0,"/api/bookings/69dccb2b519a503fc23f0fa4":0,"/api/bookings/69fc67d26f2a843ea15c3d29":4,"/api/bookings/69fc67d26f2a843ea15c3d29/status":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments/69fc68816f2a843ea15c3d61":2}
2026-05-07T10:25:35.850652884Z [MONGOOSE SLOW] Booking.findOne - 1866ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:35.857941022Z [MONGOOSE SLOW] Booking.findOne - 1860ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:35.862245945Z [MONGOOSE SLOW] Booking.findOne - 1863ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:35.863281577Z [MONGOOSE SLOW] Booking.findOneAndUpdate - 1871ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:35.863503212Z [PERF] updateStatus_69fc67d26f2a843ea15c3d29 — Total: 1871ms | findAndUpdate: 0ms | cacheInvalidation: 1871ms { bookingId: '69fc67d26f2a843ea15c3d29', newStatus: 'Booked' }
2026-05-07T10:25:35.86433777Z PATCH /api/bookings/69fc67d26f2a843ea15c3d29/status 200 948 - 1871.743 ms
2026-05-07T10:25:35.86434871Z 🐌 SLOW REQUEST: PATCH /api/bookings/69fc67d26f2a843ea15c3d29/status — 1873ms | Status: 200 | Heap: 43MB
2026-05-07T10:25:36.790063288Z [PASSENGER PERF] Add Passengers - Total: 2806ms | DB: 939ms | Count: 2
2026-05-07T10:25:36.793948402Z 🐌 SLOW REQUEST: POST /api/bookings/69fc67d26f2a843ea15c3d29/passengers — 2807ms | Status: 201 | Heap: 43MB
2026-05-07T10:25:36.793972042Z POST /api/bookings/69fc67d26f2a843ea15c3d29/passengers 201 967 - 2807.082 ms
2026-05-07T10:25:36.797323395Z [PERF] addPayment_69fc67d26f2a843ea15c3d29 — Total: 2799ms | validate: 0ms | insertPayment: 2799ms | cacheInvalidation: 0ms { bookingId: '69fc67d26f2a843ea15c3d29', amount: 787 }
2026-05-07T10:25:36.797828906Z 🐌 SLOW REQUEST: POST /api/bookings/69fc67d26f2a843ea15c3d29/payments — 2799ms | Status: 201 | Heap: 43MB
2026-05-07T10:25:36.797983349Z POST /api/bookings/69fc67d26f2a843ea15c3d29/payments 201 306 - 2798.775 ms
2026-05-07T10:25:36.798328477Z [BG:OK] updateStatus_sideEffects_69fc67d26f2a843ea15c3d29: 934ms
2026-05-07T10:25:37.907468437Z [MONGOOSE SLOW] Passenger.find - 1114ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:37.912781072Z [MONGOOSE SLOW] User.find - 1119ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-07T10:25:37.913389095Z [MONGOOSE SLOW] User.find - 1117ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-07T10:25:37.913418986Z [MONGOOSE SLOW] Booking.findOneAndUpdate - 2055ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:37.913532708Z [PERF] updateBooking_69fc67d26f2a843ea15c3d29 — Total: 3916ms | fetchExisting: 0ms { bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:25:37.916296748Z [MONGOOSE SLOW] Booking.findOne - 1117ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:37.916817299Z [MONGOOSE SLOW] Payment.find - 1117ms | filter: {"bookingId":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:37.918992817Z 🐌 SLOW REQUEST: PUT /api/bookings/69fc67d26f2a843ea15c3d29 — 3921ms | Status: 200 | Heap: 39MB
2026-05-07T10:25:37.919028877Z PUT /api/bookings/69fc67d26f2a843ea15c3d29 200 - - 3916.607 ms
2026-05-07T10:25:38.036694435Z [BG:OK] addPayment_sideEffects: 1238ms
2026-05-07T10:25:38.098949014Z [MONGOOSE SLOW] Passenger.find - 104ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.12000007Z [MONGOOSE SLOW] Payment.find - 125ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.122376631Z [MONGOOSE SLOW] Payment.find - 1329ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.131761454Z [BG:OK] updateBooking_sideEffects_69fc67d26f2a843ea15c3d29: 217ms
2026-05-07T10:25:38.13294795Z [MONGOOSE SLOW] Timeline.find - 141ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.132982061Z [MONGOOSE SLOW] Booking.findOne - 221ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:38.198813537Z [MONGOOSE SLOW] Timeline.find - 1405ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.199994702Z [MONGOOSE SLOW] Booking.findOne - 2335ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:38.211814428Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 39MB
2026-05-07T10:25:38.212566564Z [PERF] getBookingById_69fc67d26f2a843ea15c3d29 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:25:38.214855484Z GET /api/bookings/69fc67d26f2a843ea15c3d29 200 - - 0.752 ms
2026-05-07T10:25:38.256915095Z [MONGOOSE SLOW] Timeline.find - 127ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.256994306Z [MONGOOSE SLOW] Booking.findOne - 220ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:38.331759406Z [MONGOOSE SLOW] Timeline.find - 132ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.331850698Z [MONGOOSE SLOW] Booking.findOne - 200ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:38.4875783Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:25:38.488070891Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 39MB
2026-05-07T10:25:38.488082461Z GET /api/settings/dropdowns 304 - - 0.876 ms
2026-05-07T10:25:38.584868327Z [MONGOOSE SLOW] Timeline.find - 590ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:38.585054551Z [MONGOOSE SLOW] Booking.findOne - 670ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:40.979538819Z PATCH /api/bookings/69fc67d26f2a843ea15c3d29/verify 200 121 - 130.429 ms
2026-05-07T10:25:41.044261221Z [BG:OK] verifyBooking_sideEffects_69fc67d26f2a843ea15c3d29: 65ms
2026-05-07T10:25:41.24322394Z [MONGOOSE SLOW] Timeline.find - 137ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:41.243281001Z [MONGOOSE SLOW] Booking.findOne - 199ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:41.521014116Z [PERF] getBookingById_69fc67d26f2a843ea15c3d29 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:25:41.522390066Z GET /api/bookings/69fc67d26f2a843ea15c3d29 200 - - 0.985 ms
2026-05-07T10:25:42.988943639Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 39MB
2026-05-07T10:25:43.273453931Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:25:43.273848959Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 39MB
2026-05-07T10:25:43.27386747Z GET /api/notifications 304 - - 0.633 ms
2026-05-07T10:25:43.755128093Z PATCH /api/bookings/69fc67d26f2a843ea15c3d29/verify 200 88 - 141.135 ms
2026-05-07T10:25:43.826709944Z [BG:OK] verifyBooking_sideEffects_69fc67d26f2a843ea15c3d29: 71ms
2026-05-07T10:25:44.01953973Z [MONGOOSE SLOW] Timeline.find - 124ms | filter: {"bookingId":{"$in":["69fc67d26f2a843ea15c3d29"]}}
2026-05-07T10:25:44.019639282Z [MONGOOSE SLOW] Booking.findOne - 193ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:25:44.093007601Z [PERF] getBookingById_69fc67d26f2a843ea15c3d29 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:25:44.093734877Z GET /api/bookings/69fc67d26f2a843ea15c3d29 200 - - 1.001 ms
2026-05-07T10:25:46.533454398Z [PERF] getAgents — Total: 68ms | checkCache: 0ms | dbQuery: 68ms | formatResponse: 0ms { source: 'db', count: 12 }
2026-05-07T10:25:46.534250056Z GET /api/users/agents 200 - - 68.669 ms
2026-05-07T10:25:46.580922977Z [MONGOOSE SLOW] Booking.find - 137ms | filter: {}
2026-05-07T10:25:46.581110281Z [PERF] getBookings — Total: 137ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 137ms { page: 1, limit: 15, total: 568, returned: 15 }
2026-05-07T10:25:46.582426879Z GET /api/bookings?page=1&limit=15 200 - - 138.865 ms
2026-05-07T10:25:48.499995543Z [MONGOOSE SLOW] Booking.find - 145ms | filter: {"$or":[{"assignedToUserId":"69ae7ab0c8fbcb313fa0c744"},{"createdByUserId":"69ae7ab0c8fbcb313fa0c744"}]}
2026-05-07T10:25:48.500130126Z [PERF] getBookings — Total: 145ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 145ms { page: 1, limit: 15, total: 12, returned: 12 }
2026-05-07T10:25:48.50126565Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 146.173 ms
2026-05-07T10:25:49.988430572Z [MONGOOSE SLOW] Booking.find - 123ms | filter: {"assignedToUserId":{"$in":[null]}}
2026-05-07T10:25:49.988467243Z [PERF] getBookings — Total: 123ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 123ms { page: 1, limit: 15, total: 5, returned: 5 }
2026-05-07T10:25:49.989340182Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 123.844 ms
2026-05-07T10:25:53.927935605Z [MONGOOSE SLOW] User.find - 2119ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744","69c538b0220e3d8fa652f122","69c537cb220e3d8fa652f0f2","69eb50af8e47cc04dc29918d","69c2a1b98787a5edc5143f9d","69c53849220e3d8fa652f108","69c52979220e3d8fa652ee44"]}}
2026-05-07T10:25:54.020345987Z [MONGOOSE SLOW] User.find - 2212ms | filter: {"_id":{"$in":[null,"69c538b0220e3d8fa652f122","69c537cb220e3d8fa652f0f2","69eb50af8e47cc04dc29918d","69c2a1b98787a5edc5143f9d","69c53849220e3d8fa652f108","69c52979220e3d8fa652ee44"]}}
2026-05-07T10:25:54.020626383Z [MONGOOSE SLOW] Booking.find - 3400ms | filter: {"status":"Booked"}
2026-05-07T10:25:54.020876528Z [PERF] getBookings — Total: 3400ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 3400ms { page: 1, limit: 15, total: 54, returned: 15 }
2026-05-07T10:25:54.022375611Z 🐌 SLOW REQUEST: GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 — 3403ms | Status: 200 | Heap: 40MB
2026-05-07T10:25:54.022405191Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 200 - - 3401.656 ms
2026-05-07T10:25:58.514964489Z [MONGOOSE SLOW] Booking.find - 203ms | filter: {"travelDate":{"$gte":"2026-05-01T00:00:00.000Z","$lte":"2026-05-31T23:59:59.000Z"}}
2026-05-07T10:25:58.515651164Z GET /api/bookings/calendar?month=5&year=2026 304 - - 204.244 ms
2026-05-07T10:26:03.589208805Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-07T10:26:04.017426262Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:26:04.017444382Z [POLL] GET / — 2ms | Status: 304 | Cache: HIT | Heap: 40MB
2026-05-07T10:26:04.017449952Z GET /api/notifications 304 - - 0.929 ms
2026-05-07T10:26:10.743474133Z [MONGOOSE SLOW] User.find - 6721ms | filter: {}
2026-05-07T10:26:10.743618726Z [PERF] getAllUsers — Total: 6721ms | checkCache: 0ms | dbQuery: 6721ms | formatResponse: 0ms { source: 'db', count: 14 }
2026-05-07T10:26:10.744530886Z GET /api/users 200 - - 6721.858 ms
2026-05-07T10:26:10.744537186Z 🐌 SLOW REQUEST: GET /api/users — 6723ms | Status: 200 | Heap: 40MB
2026-05-07T10:26:24.324034118Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-07T10:26:25.097148622Z [POLL RATE] Last 60s: {"/":0,"/api/auth/login":0,"/api/sync":0,"/api/notifications":6,"/api/settings/dropdowns":2,"/api/users/agents":2,"/api/bookings":8,"/api/bookings/69d3439e519a503fc23ebfe0":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69d6014f519a503fc23ede18":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/calendar":2,"/api/users":2,"/api/analytics/payments":2,"/api/analytics/bookings":2,"/api/analytics/revenue-trends":2,"/api/analytics/agents":2,"/api/analytics/payment-breakdown":2,"/api/settings/dropdowns/costSources":0,"/api/bookings/69ce6c013cb589cd1818d44a":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e077dc519a503fc23f2739":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69e7223f519a503fc23f4cb9":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69c66180220e3d8fa652fd6c":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69ca5db4220e3d8fa6531178":0,"/api/bookings/69d8865f519a503fc23ef1d2":0,"/api/bookings/69f5ce088148832a3c146a6b":0,"/api/bookings/69f20a3f67553ddabb8916fe":0,"/api/bookings/69df90e1519a503fc23f2580":0,"/api/bookings/69dccb2b519a503fc23f0fa4":0,"/api/bookings/69fc67d26f2a843ea15c3d29":6,"/api/bookings/69fc67d26f2a843ea15c3d29/status":2,"/api/bookings/69fc67d26f2a843ea15c3d29/payments":2,"/api/bookings/69fc67d26f2a843ea15c3d29/payments/69fc68816f2a843ea15c3d61":0,"/api/bookings/69fc67d26f2a843ea15c3d29/passengers":2,"/api/bookings/69fc67d26f2a843ea15c3d29/verify":3}
2026-05-07T10:26:32.829536984Z 🐌 SLOW REQUEST: GET /api/analytics/revenue-trends?interval=week&company= — 19647ms | Status: 200 | Heap: 41MB
2026-05-07T10:26:32.830457734Z GET /api/analytics/revenue-trends?interval=week&company= 200 423 - 19646.060 ms
2026-05-07T10:26:32.848860623Z [MONGOOSE SLOW] Booking.find - 19623ms | filter: {"outstanding":{"$gt":0}}
2026-05-07T10:26:32.853396811Z 🐌 SLOW REQUEST: GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company= — 19658ms | Status: 304 | Heap: 40MB
2026-05-07T10:26:32.853399421Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 19657.710 ms
2026-05-07T10:26:33.224640897Z 🐌 SLOW REQUEST: GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company= — 19539ms | Status: 200 | Heap: 40MB
2026-05-07T10:26:33.224691598Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company= 200 264 - 19539.174 ms
2026-05-07T10:26:33.43242933Z [MONGOOSE SLOW] Notification.find - 8723ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744"}
2026-05-07T10:26:33.432466881Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 8723ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 8723ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-07T10:26:33.432925461Z 🐌 SLOW REQUEST: GET /api/notifications — 8724ms | Status: 304 | Heap: 41MB
2026-05-07T10:26:33.432966852Z [POLL] GET / — 8724ms | Status: 304 | Cache: MISS | Heap: 41MB
2026-05-07T10:26:33.432980842Z GET /api/notifications 304 - - 8723.725 ms
2026-05-07T10:26:33.496862697Z 🐌 SLOW REQUEST: GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company= — 19816ms | Status: 200 | Heap: 41MB
2026-05-07T10:26:33.496885027Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company= 200 99 - 19815.697 ms
2026-05-07T10:26:33.62715236Z 🐌 SLOW REQUEST: GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company= — 20420ms | Status: 200 | Heap: 41MB
2026-05-07T10:26:33.627177591Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company= 200 - - 20419.191 ms
2026-05-07T10:26:37.77924578Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 304 - - 67.236 ms
2026-05-07T10:26:37.787855447Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 122 - 67.757 ms
2026-05-07T10:26:37.792951347Z GET /api/analytics/revenue-trends?interval=week&company=Travel+Window+Dubai 200 40 - 68.323 ms
2026-05-07T10:26:37.857242481Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 446 - 126.308 ms
2026-05-07T10:26:37.857279661Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 75 - 134.082 ms
2026-05-07T10:26:43.865180971Z [POLL] OPTIONS /api/sync — 0ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-07T10:26:44.272672124Z [MONGOOSE SLOW] Booking.find - 126ms | filter: {"updatedAt":{"$gte":"2026-05-06T10:26:44.145Z"}}
2026-05-07T10:26:44.273692516Z [POLL] GET / — 128ms | Status: 200 | Cache: MISS | Heap: 42MB
2026-05-07T10:26:44.273720077Z GET /api/sync 200 - - 127.611 ms
2026-05-07T10:26:52.584265545Z [POLL] OPTIONS /api/settings/dropdowns — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-07T10:26:52.974215308Z [PERF] getAgents — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:26:52.974262559Z GET /api/users/agents 304 - - 0.952 ms
2026-05-07T10:26:52.981794582Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:26:52.981809112Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-07T10:26:52.981814532Z GET /api/settings/dropdowns 304 - - 0.642 ms
2026-05-07T10:26:53.123175217Z [MONGOOSE SLOW] Booking.find - 138ms | filter: {}
2026-05-07T10:26:53.123197137Z [PERF] getBookings — Total: 139ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 138ms { page: 1, limit: 15, total: 568, returned: 15 }
2026-05-07T10:26:53.123203118Z GET /api/bookings?page=1&limit=15 304 - - 139.082 ms
2026-05-07T10:26:53.587325509Z [MONGOOSE SLOW] Booking.find - 129ms | filter: {"$or":[{"assignedToUserId":"69ae7ab0c8fbcb313fa0c744"},{"createdByUserId":"69ae7ab0c8fbcb313fa0c744"}]}
2026-05-07T10:26:53.587399011Z [PERF] getBookings — Total: 129ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 129ms { page: 1, limit: 15, total: 12, returned: 12 }
2026-05-07T10:26:53.588874613Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 129.616 ms
2026-05-07T10:26:53.712454972Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-07T10:26:53.982130188Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:26:53.982493766Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-07T10:26:53.982523196Z GET /api/notifications 304 - - 0.645 ms
2026-05-07T10:26:55.400107308Z [PERF] getAgents — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:26:55.400508177Z GET /api/users/agents 304 - - 0.760 ms
2026-05-07T10:27:01.463697545Z [MONGOOSE SLOW] Booking.findOne - 3850ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:27:14.16635738Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:27:14.166889692Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 1.044 ms
2026-05-07T10:27:14.272725917Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-07T10:27:14.552291419Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:27:14.552655157Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-07T10:27:14.552670467Z GET /api/notifications 304 - - 0.601 ms
2026-05-07T10:27:25.098132585Z [POLL RATE] Last 60s: {"/":0,"/api/auth/login":0,"/api/sync":2,"/api/notifications":4,"/api/settings/dropdowns":2,"/api/users/agents":3,"/api/bookings":6,"/api/bookings/69d3439e519a503fc23ebfe0":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69d6014f519a503fc23ede18":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/payments":2,"/api/analytics/bookings":2,"/api/analytics/revenue-trends":2,"/api/analytics/agents":2,"/api/analytics/payment-breakdown":2,"/api/settings/dropdowns/costSources":0,"/api/bookings/69ce6c013cb589cd1818d44a":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e077dc519a503fc23f2739":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69e7223f519a503fc23f4cb9":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69c66180220e3d8fa652fd6c":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69ca5db4220e3d8fa6531178":0,"/api/bookings/69d8865f519a503fc23ef1d2":0,"/api/bookings/69f5ce088148832a3c146a6b":0,"/api/bookings/69f20a3f67553ddabb8916fe":0,"/api/bookings/69df90e1519a503fc23f2580":0,"/api/bookings/69dccb2b519a503fc23f0fa4":0,"/api/bookings/69fc67d26f2a843ea15c3d29":2,"/api/bookings/69fc67d26f2a843ea15c3d29/status":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments/69fc68816f2a843ea15c3d61":0,"/api/bookings/69fc67d26f2a843ea15c3d29/passengers":0,"/api/bookings/69fc67d26f2a843ea15c3d29/verify":0}
2026-05-07T10:27:28.765173575Z [MONGOOSE SLOW] Booking.findOneAndDelete - 27302ms | filter: {"_id":"69fc67d26f2a843ea15c3d29"}
2026-05-07T10:27:28.765215106Z [PERF] deleteBooking_69fc67d26f2a843ea15c3d29 — Total: 31152ms | findBooking: 0ms | deleteBookingDoc: 3850ms { bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:27:28.765743717Z DELETE /api/bookings/69fc67d26f2a843ea15c3d29 200 85 - 31152.556 ms
2026-05-07T10:27:28.765743817Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fc67d26f2a843ea15c3d29 — 31153ms | Status: 200 | Heap: 42MB
2026-05-07T10:27:29.359167128Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:27:29.359571237Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 0.788 ms
2026-05-07T10:27:30.10806034Z [BG:OK] deleteBooking_cleanup_69fc67d26f2a843ea15c3d29: 1342ms
2026-05-07T10:27:42.279848492Z [PERF] getAgents — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:27:42.280301752Z GET /api/users/agents 304 - - 0.779 ms
2026-05-07T10:27:45.313719244Z [PERF] deleteBooking_69fc67d26f2a843ea15c3d29 — Total: 74ms | findBooking: 0ms { error: 'Not found', bookingId: '69fc67d26f2a843ea15c3d29' }
2026-05-07T10:27:45.314491161Z DELETE /api/bookings/69fc67d26f2a843ea15c3d29 404 44 - 75.336 ms
2026-05-07T10:27:51.08751991Z [MONGOOSE SLOW] User.find - 172ms | filter: {}
2026-05-07T10:27:51.08798055Z [PERF] getAllUsers — Total: 173ms | checkCache: 0ms | dbQuery: 173ms | formatResponse: 0ms { source: 'db', count: 14 }
2026-05-07T10:27:51.088642555Z GET /api/users 200 - - 173.361 ms
2026-05-07T10:27:51.094972602Z [MONGOOSE SLOW] Booking.find - 1410ms | filter: {"assignedToUserId":{"$in":[null]}}
2026-05-07T10:27:51.095040574Z [PERF] getBookings — Total: 1410ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 1410ms { page: 1, limit: 15, total: 4, returned: 4 }
2026-05-07T10:27:51.095867781Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 1411.118 ms
2026-05-07T10:27:51.095881042Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=unassigned&page=1&limit=15 — 1412ms | Status: 200 | Heap: 42MB
2026-05-07T10:27:51.098260603Z [MONGOOSE SLOW] Booking.find - 1440ms | filter: {}
2026-05-07T10:27:51.098351145Z [PERF] getBookings — Total: 1440ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 1440ms { page: 1, limit: 15, total: 567, returned: 15 }
2026-05-07T10:27:51.099516931Z GET /api/bookings?page=1&limit=15 200 - - 1440.702 ms
2026-05-07T10:27:51.099544461Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 1442ms | Status: 200 | Heap: 42MB
2026-05-07T10:27:52.090386857Z GET /api/bookings/calendar?month=5&year=2026 304 - - 0.746 ms
2026-05-07T10:27:53.639819532Z [MONGOOSE SLOW] Booking.find - 408ms | filter: {"$or":[{"assignedToUserId":"69ae7ab0c8fbcb313fa0c744"},{"createdByUserId":"69ae7ab0c8fbcb313fa0c744"}],"assignedToUserId":{"$in":[null]}}
2026-05-07T10:27:53.641848996Z [PERF] getBookings — Total: 411ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 411ms { page: 1, limit: 15, total: 0, returned: 0 }
2026-05-07T10:27:53.642552872Z GET /api/bookings?assignedTo=unassigned&myBookings=true&page=1&limit=15 200 99 - 411.720 ms
2026-05-07T10:27:53.6798003Z [MONGOOSE SLOW] User.find - 344ms | filter: {"_id":{"$in":["69c538b0220e3d8fa652f122","69c537cb220e3d8fa652f0f2","69eb50af8e47cc04dc29918d","69c2a1b98787a5edc5143f9d","69c53849220e3d8fa652f108","69c52979220e3d8fa652ee44"]}}
2026-05-07T10:27:53.680646718Z [MONGOOSE SLOW] User.find - 345ms | filter: {"_id":{"$in":["69c538b0220e3d8fa652f122","69c537cb220e3d8fa652f0f2","69eb50af8e47cc04dc29918d","69c2a1b98787a5edc5143f9d","69c53849220e3d8fa652f108","69c52979220e3d8fa652ee44","69ae7ab0c8fbcb313fa0c744"]}}
2026-05-07T10:27:53.68072708Z [MONGOOSE SLOW] Booking.find - 1698ms | filter: {"status":"Booked"}
2026-05-07T10:27:53.68074094Z [PERF] getBookings — Total: 1698ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 1698ms { page: 1, limit: 15, total: 53, returned: 15 }
2026-05-07T10:27:53.683112262Z 🐌 SLOW REQUEST: GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 — 1701ms | Status: 200 | Heap: 42MB
2026-05-07T10:27:53.683137032Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 200 - - 1699.130 ms
2026-05-07T10:27:53.725413229Z [MONGOOSE SLOW] Booking.find - 507ms | filter: {"$or":[{"assignedToUserId":"69ae7ab0c8fbcb313fa0c744"},{"createdByUserId":"69ae7ab0c8fbcb313fa0c744"}]}
2026-05-07T10:27:53.72542812Z [PERF] getBookings — Total: 508ms | checkCache: 1ms | parseFilters: 0ms | dbQuery: 0ms | formatResponse: 507ms { page: 1, limit: 15, total: 11, returned: 11 }
2026-05-07T10:27:53.727839802Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 508.084 ms
2026-05-07T10:27:53.727853122Z 🐌 SLOW REQUEST: GET /api/bookings?myBookings=true&page=1&limit=15 — 509ms | Status: 200 | Heap: 42MB
2026-05-07T10:27:54.816218875Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-07T10:27:55.465324248Z [MONGOOSE SLOW] Notification.find - 378ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744"}
2026-05-07T10:27:55.4654261Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 378ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 378ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-07T10:27:55.465825469Z [POLL] GET / — 379ms | Status: 304 | Cache: MISS | Heap: 42MB
2026-05-07T10:27:55.465831719Z GET /api/notifications 304 - - 378.506 ms
2026-05-07T10:27:57.099617926Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 43MB
2026-05-07T10:27:57.383800761Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:27:57.384240141Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-07T10:27:57.384314252Z GET /api/settings/dropdowns 304 - - 0.754 ms
2026-05-07T10:27:57.385153301Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 0.400 ms
2026-05-07T10:27:57.408305633Z GET /api/analytics/revenue-trends?interval=week&company= 304 - - 0.440 ms
2026-05-07T10:27:57.858870109Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 0.427 ms
2026-05-07T10:27:57.875106811Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 0.463 ms
2026-05-07T10:27:57.960638887Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 0.439 ms
2026-05-07T10:28:00.911286257Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 304 - - 0.609 ms
2026-05-07T10:28:00.919502935Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 304 - - 0.487 ms
2026-05-07T10:28:00.93583406Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 304 - - 0.395 ms
2026-05-07T10:28:00.9363376Z GET /api/analytics/revenue-trends?interval=week&company=Travel+Window+Dubai 304 - - 0.289 ms
2026-05-07T10:28:00.94507012Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 304 - - 0.272 ms
2026-05-07T10:28:09.290996165Z GET / 200 36 - 0.264 ms
2026-05-07T10:28:15.775921682Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 43MB
2026-05-07T10:28:16.088099357Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-07T10:28:16.088117557Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 43MB
2026-05-07T10:28:16.088123897Z GET /api/notifications 304 - - 0.778 ms
2026-05-07T10:28:17.493465986Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-07T10:28:17.496037301Z GET /api/bookings?page=1&limit=15 304 - - 0.988 ms
2026-05-07T10:28:25.098460997Z [POLL RATE] Last 60s: {"/":1,"/api/auth/login":0,"/api/sync":0,"/api/notifications":4,"/api/settings/dropdowns":2,"/api/users/agents":4,"/api/bookings":14,"/api/bookings/69d3439e519a503fc23ebfe0":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69d6014f519a503fc23ede18":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/calendar":2,"/api/users":2,"/api/analytics/payments":4,"/api/analytics/bookings":4,"/api/analytics/revenue-trends":4,"/api/analytics/agents":4,"/api/analytics/payment-breakdown":4,"/api/settings/dropdowns/costSources":0,"/api/bookings/69ce6c013cb589cd1818d44a":0,"/api/bookings/69e1c2ea519a503fc23f2e5b":0,"/api/bookings/69e077dc519a503fc23f2739":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69e7223f519a503fc23f4cb9":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69c66180220e3d8fa652fd6c":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69ca5db4220e3d8fa6531178":0,"/api/bookings/69d8865f519a503fc23ef1d2":0,"/api/bookings/69f5ce088148832a3c146a6b":0,"/api/bookings/69f20a3f67553ddabb8916fe":0,"/api/bookings/69df90e1519a503fc23f2580":0,"/api/bookings/69dccb2b519a503fc23f0fa4":0,"/api/bookings/69fc67d26f2a843ea15c3d29":2,"/api/bookings/69fc67d26f2a843ea15c3d29/status":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments":0,"/api/bookings/69fc67d26f2a843ea15c3d29/payments/69fc68816f2a843ea15c3d61":0,"/api/bookings/69fc67d26f2a843ea15c3d29/passengers":0,"/api/bookings/69fc67d26f2a843ea15c3d29/verify":0}
2026-05-07T10:28:32.7685541Z [MONGOOSE SLOW] User.find - 15292ms | filter: {"role":{"$in":["AGENT","MANAGER","ADMIN"]}}
2026-05-07T10:28:32.76856981Z [PERF] getAgents — Total: 15292ms | checkCache: 0ms | dbQuery: 15292ms | formatResponse: 0ms { source: 'db', count: 12 }
2026-05-07T10:28:32.768831856Z GET /api/users/agents 200 - - 15292.956 ms
2026-05-07T10:28:32.768848716Z 🐌 SLOW REQUEST: GET /api/users/agents — 15293ms | Status: 200 | Heap: 43MB