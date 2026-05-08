2026-05-08T09:00:51.597754978Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:01:51.598471235Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:02:51.598199655Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:03:51.601446893Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:04:51.599431813Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:05:51.599405504Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:06:51.599647046Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:07:51.600453123Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:08:51.599292468Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/settings/dropdowns":0,"/api/users/agents":0,"/api/bookings":0,"/api/bookings/69fc5f6419eb82df251503a0":0}
2026-05-08T09:23:10.946463996Z ==> Deploying...
2026-05-08T09:23:11.037115657Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-08T09:23:28.211487083Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-08T09:23:28.213783871Z 🚀 Primary startup tasks complete.
2026-05-08T09:23:30.310755969Z MongoDB Connected: ac-nvjnavm-shard-00-00.31xmkrx.mongodb.net
2026-05-08T09:23:31.108670495Z [MONGOOSE SLOW] Booking.find - 2894ms | filter: {"status":"Follow Up","followUpDate":{"$lte":"2026-05-08T23:59:59.000Z","$ne":null}}
2026-05-08T09:23:36.208224829Z MongoDB Connected: undefined
2026-05-08T09:23:36.317786537Z [WORKER] 95 started on port 10000
2026-05-08T09:23:36.869426954Z HEAD / 200 36 - 2.520 ms
2026-05-08T09:23:39.413509369Z MongoDB Connected: ac-nvjnavm-shard-00-00.31xmkrx.mongodb.net
2026-05-08T09:23:42.278794981Z ==> Your service is live 🎉
2026-05-08T09:23:42.313244347Z GET / 200 36 - 0.477 ms
2026-05-08T09:23:42.409222733Z [MONGOOSE SLOW] User.findOneAndUpdate - 143ms | filter: {"_id":"69ae7ab0c8fbcb313fa0c744"}
2026-05-08T09:23:42.40990123Z POST /api/users/offline 200 16 - 146.704 ms
2026-05-08T09:23:42.461309405Z ==> 
2026-05-08T09:23:42.46381675Z ==> ///////////////////////////////////////////////////////////
2026-05-08T09:23:42.467964544Z ==> 
2026-05-08T09:23:42.469948645Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-08T09:23:42.472075505Z ==> 
2026-05-08T09:23:42.47427376Z ==> ///////////////////////////////////////////////////////////
2026-05-08T09:24:15.192629376Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T09:24:15.195688443Z [POLL] OPTIONS /api/sync — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T09:24:16.175293907Z [MONGOOSE SLOW] User.find - 152ms | filter: {"_id":{"$in":["69c537cb220e3d8fa652f0f2","69c538b0220e3d8fa652f122","69eb50af8e47cc04dc29918d","69c53849220e3d8fa652f108"]}}
2026-05-08T09:24:16.177303407Z [MONGOOSE SLOW] Booking.find - 234ms | filter: {"updatedAt":{"$gte":"2026-05-06T09:24:15.938Z"}}
2026-05-08T09:24:16.178014845Z [PERF] getGlobalSync — Total: 239ms | dbQuery: 239ms | formatResponse: 0ms { source: 'db', bookingsCount: 5 }
2026-05-08T09:24:16.211332804Z [POLL] GET / — 276ms | Status: 200 | Cache: MISS | Heap: 34MB
2026-05-08T09:24:16.211352714Z GET /api/sync 200 - - 243.937 ms
2026-05-08T09:24:16.547159259Z [MONGOOSE SLOW] Notification.find - 539ms | filter: {"userId":"69ae7ab0c8fbcb313fa0c744","isDismissed":false}
2026-05-08T09:24:16.547696323Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 539ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 539ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-08T09:24:16.547707583Z [POLL] GET / — 596ms | Status: 304 | Cache: MISS | Heap: 34MB
2026-05-08T09:24:16.547710253Z 🐌 SLOW REQUEST: GET /api/notifications — 596ms | Status: 304 | Heap: 34MB
2026-05-08T09:24:16.547714043Z GET /api/notifications 304 - - 540.649 ms
2026-05-08T09:24:21.85026667Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-08T09:24:24.460812669Z [PERF] getDropdowns — Total: 2336ms | checkCache: 0ms | dbQuery: 0ms | mergeDefaults: 2336ms { source: 'db' }
2026-05-08T09:24:24.461479726Z 🐌 SLOW REQUEST: GET /api/settings/dropdowns — 2338ms | Status: 200 | Heap: 35MB
2026-05-08T09:24:24.461504226Z [POLL] GET /dropdowns — 2338ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T09:24:24.461925497Z GET /api/settings/dropdowns 200 278 - 2337.495 ms
2026-05-08T09:24:24.462237065Z [MONGOOSE SLOW] User.find - 2325ms | filter: {"role":{"$in":["AGENT","MANAGER","ADMIN"]}}
2026-05-08T09:24:24.462540502Z [PERF] getAgents — Total: 2326ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 2326ms { source: 'db', count: 12 }
2026-05-08T09:24:24.46402894Z 🐌 SLOW REQUEST: GET /api/users/agents — 2328ms | Status: 200 | Heap: 35MB
2026-05-08T09:24:24.464059571Z GET /api/users/agents 200 - - 2326.649 ms
2026-05-08T09:38:01.870391544Z [MONGOOSE SLOW] Booking.findOne - 131ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:01.872119427Z [MONGOOSE SLOW] Timeline.find - 132ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:01.872222129Z getBookingById_69fdae1ea07530cbc5965502: 133.208ms
2026-05-08T09:38:01.872341222Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 134ms | checkCache: 0ms | dbQueryParallel: 134ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:01.873735437Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 130ms | checkCache: 0ms | waitDeduplicated: 0ms | finalProcessing: 130ms { source: 'deduplicated', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:01.875021499Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 134.792 ms
2026-05-08T09:38:01.875360937Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 130.223 ms
2026-05-08T09:38:02.084982008Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:38:02.085476251Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 40MB
2026-05-08T09:38:02.085528302Z GET /api/settings/dropdowns 304 - - 0.795 ms
2026-05-08T09:38:02.20233646Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:02.202929065Z GET /api/bookings/69fdae1ea07530cbc5965502 304 - - 1.007 ms
2026-05-08T09:38:06.655968196Z [PERF] getAgents — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:38:06.656295054Z GET /api/users/agents 304 - - 0.700 ms
2026-05-08T09:38:06.794283348Z [MONGOOSE SLOW] Booking.find - 133ms | filter: {}
2026-05-08T09:38:06.794314989Z [PERF] getBookings — Total: 133ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 133ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T09:38:06.794533694Z GET /api/bookings?page=1&limit=15 200 - - 134.321 ms
2026-05-08T09:38:08.208207622Z [GET] /api/bookings/69fc546a19eb82df2515026f
2026-05-08T09:38:08.336179108Z [MONGOOSE SLOW] Booking.findOne - 138ms | filter: {"_id":"69fc546a19eb82df2515026f"}
2026-05-08T09:38:08.336331331Z getBookingById_69fc546a19eb82df2515026f: 137.752ms
2026-05-08T09:38:08.336421483Z [PERF] getBookingById_69fc546a19eb82df2515026f — Total: 138ms | checkCache: 0ms | dbQueryParallel: 138ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fc546a19eb82df2515026f' }
2026-05-08T09:38:08.336900135Z GET /api/bookings/69fc546a19eb82df2515026f 304 - - 139.002 ms
2026-05-08T09:38:12.356479957Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-08T09:38:12.676586811Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:38:12.67695979Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 40MB
2026-05-08T09:38:12.677873183Z GET /api/notifications 304 - - 0.709 ms
2026-05-08T09:38:22.086350471Z [PERF] deletePayment_69fdae1ea07530cbc5965502 — Total: 215ms | validate: 0ms | findPayment: 76ms | deletePayment: 68ms | finalProcessing: 71ms {
2026-05-08T09:38:22.086388923Z   bookingId: '69fdae1ea07530cbc5965502',
2026-05-08T09:38:22.086395733Z   paymentId: '69fdaef0a07530cbc5965569'
2026-05-08T09:38:22.086401493Z }
2026-05-08T09:38:22.086785452Z DELETE /api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569 200 42 - 214.816 ms
2026-05-08T09:38:22.226214103Z [BG:OK] deletePayment_sideEffects_69fdae1ea07530cbc5965502: 139ms
2026-05-08T09:38:22.727117774Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:22.727539214Z GET /api/bookings/69fdae1ea07530cbc5965502 304 - - 0.823 ms
2026-05-08T09:38:25.914685841Z [MONGOOSE SLOW] Booking.findOne - 1820ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:25.917202104Z [MONGOOSE SLOW] Booking.findOne - 1828ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:29.140365228Z [PASSENGER PERF] Update Passengers - Total: 5047ms | DB (Del+Ins): 3226ms | Count: 1
2026-05-08T09:38:29.141038384Z 🐌 SLOW REQUEST: PUT /api/bookings/69fdae1ea07530cbc5965502/passengers — 5047ms | Status: 200 | Heap: 41MB
2026-05-08T09:38:29.141066955Z PUT /api/bookings/69fdae1ea07530cbc5965502/passengers 200 500 - 5046.897 ms
2026-05-08T09:38:29.142746607Z [MONGOOSE SLOW] User.find - 1010ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-08T09:38:29.14286425Z [MONGOOSE SLOW] Booking.findOneAndUpdate - 3225ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:29.145561956Z 🐌 SLOW REQUEST: PUT /api/bookings/69fdae1ea07530cbc5965502 — 5057ms | Status: 200 | Heap: 41MB
2026-05-08T09:38:29.145593387Z PUT /api/bookings/69fdae1ea07530cbc5965502 200 - - 5054.040 ms
2026-05-08T09:38:29.662745172Z [BG:OK] updatePassengers_sideEffects_69fdae1ea07530cbc5965502: 521ms
2026-05-08T09:38:29.666444644Z [MONGOOSE SLOW] Booking.findOne - 523ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:29.666770102Z [MONGOOSE SLOW] Payment.find - 523ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:29.928013436Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:38:30.601700526Z [BG:OK] updateBooking_sideEffects_69fdae1ea07530cbc5965502: 1458ms
2026-05-08T09:38:30.602173998Z [MONGOOSE SLOW] Passenger.find - 674ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:30.604642899Z [MONGOOSE SLOW] Payment.find - 676ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:32.197246837Z [MONGOOSE SLOW] User.find - 1594ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-08T09:38:32.197415111Z [MONGOOSE SLOW] Timeline.find - 2269ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:32.205051651Z [MONGOOSE SLOW] User.find - 1597ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-08T09:38:32.205092021Z [MONGOOSE SLOW] Booking.findOne - 2276ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:32.205098082Z getBookingById_69fdae1ea07530cbc5965502: 2.277s
2026-05-08T09:38:32.205103192Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 2277ms | checkCache: 0ms | dbQueryParallel: 2277ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:32.206277331Z 🐌 SLOW REQUEST: GET /api/bookings/69fdae1ea07530cbc5965502 — 2279ms | Status: 200 | Heap: 41MB
2026-05-08T09:38:32.206325062Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 2278.031 ms
2026-05-08T09:38:33.007446576Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:38:33.322035464Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:38:33.322545736Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:38:33.322576377Z GET /api/notifications 304 - - 0.850 ms
2026-05-08T09:38:33.962758146Z POST /api/users/offline 200 16 - 71.464 ms
2026-05-08T09:38:36.209015529Z [POLL RATE] Last 60s: {"/":0,"/api/users/offline":2,"/api/notifications":6,"/api/sync":0,"/api/settings/dropdowns":2,"/api/bookings":2,"/api/users/agents":2,"/api/bookings/69fc546a19eb82df2515026f":2,"/api/bookings/69f58c0a8148832a3c14646b":0,"/api/bookings/69ecc066d8cfa03b17e3a35b":0,"/api/bookings/69e20d33519a503fc23f316c":0,"/api/bookings/69d9d3b4519a503fc23efbdc":0,"/api/bookings/69ccd36e12d6ce0419001044":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69d76dbb519a503fc23eec2a":0,"/api/users":0,"/api/bookings/calendar":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69e77138519a503fc23f52bd":0,"/api/bookings/69cb524ebe322c9f36033baa":0,"/api/bookings/69d0f94c519a503fc23ebe53":0,"/api/bookings/69f499258148832a3c145c3e":0,"/api/bookings/69fdae1ea07530cbc5965502":12,"/api/bookings/69fdae1ea07530cbc5965502/payments":3,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdae68a07530cbc596552a":0,"/api/bookings/69fdae1ea07530cbc5965502/status":0,"/api/bookings/69fdae1ea07530cbc5965502/passengers":4,"/api/bookings/69fdae1ea07530cbc5965502/verify":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaea1a07530cbc596553d":2,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569":2}
2026-05-08T09:38:43.713348228Z [POLL] OPTIONS /api/settings/dropdowns — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:38:43.728055093Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:38:44.031991437Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:38:44.032615983Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:38:44.032636993Z GET /api/settings/dropdowns 304 - - 0.746 ms
2026-05-08T09:38:44.283981372Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:38:44.284043554Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:38:44.284050174Z GET /api/notifications 304 - - 0.814 ms
2026-05-08T09:38:44.36244867Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:44.363138567Z GET /api/bookings/69fdae1ea07530cbc5965502 304 - - 1.005 ms
2026-05-08T09:38:50.170771532Z [PERF] getAgents — Total: 68ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 68ms { source: 'db', count: 12 }
2026-05-08T09:38:50.172632048Z GET /api/users/agents 200 - - 69.377 ms
2026-05-08T09:38:50.251895746Z [MONGOOSE SLOW] Booking.find - 134ms | filter: {}
2026-05-08T09:38:50.251977808Z [PERF] getBookings — Total: 134ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 134ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T09:38:50.255329261Z GET /api/bookings?page=1&limit=15 200 - - 135.586 ms
2026-05-08T09:39:05.196313755Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:39:05.518851093Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:39:05.51913626Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:39:05.519154721Z GET /api/notifications 304 - - 0.491 ms
2026-05-08T09:39:05.723234847Z [PERF] deletePayment_69fdae1ea07530cbc5965502 — Total: 207ms | validate: 0ms | findPayment: 69ms | deletePayment: 67ms | finalProcessing: 71ms {
2026-05-08T09:39:05.723268868Z   bookingId: '69fdae1ea07530cbc5965502',
2026-05-08T09:39:05.723274239Z   paymentId: '69fdaef2a07530cbc596556b'
2026-05-08T09:39:05.723278409Z }
2026-05-08T09:39:05.723624347Z DELETE /api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef2a07530cbc596556b 200 42 - 207.944 ms
2026-05-08T09:39:05.862315891Z [BG:OK] deletePayment_sideEffects_69fdae1ea07530cbc5965502: 139ms
2026-05-08T09:39:06.364196072Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:39:06.529199298Z [MONGOOSE SLOW] Passenger.find - 165ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.530902631Z [MONGOOSE SLOW] Payment.find - 166ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.613974123Z [MONGOOSE SLOW] Timeline.find - 249ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.61749775Z [MONGOOSE SLOW] Booking.findOne - 253ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.617545932Z getBookingById_69fdae1ea07530cbc5965502: 253.39ms
2026-05-08T09:39:06.617658654Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 254ms | checkCache: 0ms | dbQueryParallel: 254ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:39:06.618710191Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 254.580 ms
2026-05-08T09:39:15.583170741Z [MONGOOSE SLOW] Booking.findOneAndUpdate - 138ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:15.586946625Z PUT /api/bookings/69fdae1ea07530cbc5965502 200 - - 204.997 ms
2026-05-08T09:39:15.588785781Z [PASSENGER PERF] Update Passengers - Total: 212ms | DB (Del+Ins): 140ms | Count: 1
2026-05-08T09:39:15.589228922Z PUT /api/bookings/69fdae1ea07530cbc5965502/passengers 200 500 - 212.760 ms
2026-05-08T09:39:15.66767691Z [BG:OK] updatePassengers_sideEffects_69fdae1ea07530cbc5965502: 78ms
2026-05-08T09:39:15.716913542Z [BG:OK] updateBooking_sideEffects_69fdae1ea07530cbc5965502: 133ms
2026-05-08T09:39:15.921165804Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:39:16.05671443Z [MONGOOSE SLOW] Booking.findOne - 135ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:16.063236772Z [MONGOOSE SLOW] Timeline.find - 142ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:16.063280923Z getBookingById_69fdae1ea07530cbc5965502: 142.115ms
2026-05-08T09:39:16.063627151Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 143ms | checkCache: 0ms | dbQueryParallel: 143ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:39:16.0647951Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 143.450 ms
2026-05-08T09:39:21.115882205Z [MONGOOSE SLOW] User.find - 387ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744","69eb50af8e47cc04dc29918d","69c2a2038787a5edc5143fb6","69c52979220e3d8fa652ee44","69c537cb220e3d8fa652f0f2","69c53849220e3d8fa652f108"]}}
2026-05-08T09:39:21.11649333Z [MONGOOSE SLOW] User.find - 388ms | filter: {"_id":{"$in":[null,"69eb50af8e47cc04dc29918d","69c2a2038787a5edc5143fb6","69c52979220e3d8fa652ee44","69c53878220e3d8fa652f115","69c537cb220e3d8fa652f0f2","69c53849220e3d8fa652f108"]}}
2026-05-08T09:39:21.116770697Z [MONGOOSE SLOW] Booking.find - 1194ms | filter: {}
2026-05-08T09:39:21.116936091Z [PERF] getBookings — Total: 1194ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 1194ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T09:39:21.118399627Z GET /api/bookings?page=1&limit=15 200 - - 1195.085 ms
2026-05-08T09:39:21.118422308Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 1196ms | Status: 200 | Heap: 41MB
2026-05-08T09:39:25.878965873Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-08T09:39:26.20056758Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:39:26.201092113Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-08T09:39:26.201111203Z GET /api/notifications 304 - - 0.707 ms
2026-05-08T09:39:29.040597217Z [PERF] getAgents — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:39:29.04113307Z GET /api/users/agents 304 - - 0.779 ms
2026-05-08T09:39:36.209019332Z [POLL RATE] Last 60s: {"/":0,"/api/users/offline":0,"/api/notifications":6,"/api/sync":0,"/api/settings/dropdowns":2,"/api/bookings":4,"/api/users/agents":4,"/api/bookings/69fc546a19eb82df2515026f":0,"/api/bookings/69f58c0a8148832a3c14646b":0,"/api/bookings/69ecc066d8cfa03b17e3a35b":0,"/api/bookings/69e20d33519a503fc23f316c":0,"/api/bookings/69d9d3b4519a503fc23efbdc":0,"/api/bookings/69ccd36e12d6ce0419001044":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69d76dbb519a503fc23eec2a":0,"/api/users":0,"/api/bookings/calendar":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69e77138519a503fc23f52bd":0,"/api/bookings/69cb524ebe322c9f36033baa":0,"/api/bookings/69d0f94c519a503fc23ebe53":0,"/api/bookings/69f499258148832a3c145c3e":0,"/api/bookings/69fdae1ea07530cbc5965502":9,"/api/bookings/69fdae1ea07530cbc5965502/payments":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdae68a07530cbc596552a":0,"/api/bookings/69fdae1ea07530cbc5965502/status":0,"/api/bookings/69fdae1ea07530cbc5965502/passengers":2,"/api/bookings/69fdae1ea07530cbc5965502/verify":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaea1a07530cbc596553d":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef2a07530cbc596556b":2}
2026-05-08T09:39:38.522282453Z [MONGOOSE SLOW] Booking.findOne - 8013ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:50.787837039Z [PERF] deleteBooking_69fdae1ea07530cbc5965502 — Total: 20277ms | findBooking: 0ms | deleteBookingDoc: 8014ms | finalProcessing: 12263ms { bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:39:50.78787117Z DELETE /api/bookings/69fdae1ea07530cbc5965502 200 85 - 20277.612 ms
2026-05-08T09:39:50.78789157Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fdae1ea07530cbc5965502 — 20279ms | Status: 200 | Heap: 42MB
2026-05-08T09:39:51.52985776Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:39:51.530391413Z GET /api/bookings?page=1&limit=15 304 - - 0.980 ms
2026-05-08T09:39:52.980160725Z [BG:OK] deleteBooking_cleanup_69fdae1ea07530cbc5965502: 2194ms
2026-05-08T09:40:36.209004894Z [POLL RATE] Last 60s: {"/":0,"/api/users/offline":0,"/api/notifications":0,"/api/sync":0,"/api/settings/dropdowns":0,"/api/bookings":2,"/api/users/agents":0,"/api/bookings/69fc546a19eb82df2515026f":0,"/api/bookings/69f58c0a8148832a3c14646b":0,"/api/bookings/69ecc066d8cfa03b17e3a35b":0,"/api/bookings/69e20d33519a503fc23f316c":0,"/api/bookings/69d9d3b4519a503fc23efbdc":0,"/api/bookings/69ccd36e12d6ce0419001044":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69d76dbb519a503fc23eec2a":0,"/api/users":0,"/api/bookings/calendar":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69e77138519a503fc23f52bd":0,"/api/bookings/69cb524ebe322c9f36033baa":0,"/api/bookings/69d0f94c519a503fc23ebe53":0,"/api/bookings/69f499258148832a3c145c3e":0,"/api/bookings/69fdae1ea07530cbc5965502":0,"/api/bookings/69fdae1ea07530cbc5965502/payments":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdae68a07530cbc596552a":0,"/api/bookings/69fdae1ea07530cbc5965502/status":0,"/api/bookings/69fdae1ea07530cbc5965502/passengers":0,"/api/bookings/69fdae1ea07530cbc5965502/verify":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaea1a07530cbc596553d":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef2a07530cbc596556b":0}
2026-05-08T09:40:58.169950647Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-08T09:40:58.512507642Z [GET] /api/bookings/69fc5f6419eb82df251503a0
2026-05-08T09:40:58.643086647Z [MONGOOSE SLOW] Booking.findOne - 130ms | filter: {"_id":"69fc5f6419eb82df251503a0"}
2026-05-08T09:40:58.6431906Z getBookingById_69fc5f6419eb82df251503a0: 130.58ms
2026-05-08T09:40:58.643369114Z [PERF] getBookingById_69fc5f6419eb82df251503a0 — Total: 131ms | checkCache: 0ms | dbQueryParallel: 130ms | calculateTotals: 0ms | formatResponse: 0ms | finalProcessing: 1ms { source: 'db', bookingId: '69fc5f6419eb82df251503a0' }
2026-05-08T09:40:58.644631216Z GET /api/bookings/69fc5f6419eb82df251503a0 200 - - 131.960 ms
2026-05-08T09:40:58.989359634Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:40:58.989794745Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-08T09:40:58.989809675Z GET /api/settings/dropdowns 304 - - 0.665 ms
2026-05-08T09:41:00.992671698Z [MONGOOSE SLOW] Booking.find - 136ms | filter: {}
2026-05-08T09:41:00.992887253Z [PERF] getBookings — Total: 136ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 136ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-08T09:41:00.992892203Z GET /api/bookings?page=1&limit=15 200 - - 137.163 ms
2026-05-08T09:41:01.043935052Z [PERF] getAgents — Total: 66ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 66ms { source: 'db', count: 12 }
2026-05-08T09:41:01.045023989Z GET /api/users/agents 200 - - 69.093 ms
2026-05-08T09:41:01.813735766Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:41:01.881589762Z getBookingById_69fdae1ea07530cbc5965502: 67.708ms
2026-05-08T09:41:01.882172227Z GET /api/bookings/69fdae1ea07530cbc5965502 404 44 - 68.818 ms
2026-05-08T09:38:30.601700526Z [BG:OK] updateBooking_sideEffects_69fdae1ea07530cbc5965502: 1458ms
2026-05-08T09:38:30.602173998Z [MONGOOSE SLOW] Passenger.find - 674ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:30.604642899Z [MONGOOSE SLOW] Payment.find - 676ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:32.197246837Z [MONGOOSE SLOW] User.find - 1594ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-08T09:38:32.197415111Z [MONGOOSE SLOW] Timeline.find - 2269ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:32.205051651Z [MONGOOSE SLOW] User.find - 1597ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744"]}}
2026-05-08T09:38:32.205092021Z [MONGOOSE SLOW] Booking.findOne - 2276ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:38:32.205098082Z getBookingById_69fdae1ea07530cbc5965502: 2.277s
2026-05-08T09:38:32.205103192Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 2277ms | checkCache: 0ms | dbQueryParallel: 2277ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:32.206277331Z 🐌 SLOW REQUEST: GET /api/bookings/69fdae1ea07530cbc5965502 — 2279ms | Status: 200 | Heap: 41MB
2026-05-08T09:38:32.206325062Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 2278.031 ms
2026-05-08T09:38:33.007446576Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:38:33.322035464Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:38:33.322545736Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:38:33.322576377Z GET /api/notifications 304 - - 0.850 ms
2026-05-08T09:38:33.962758146Z POST /api/users/offline 200 16 - 71.464 ms
2026-05-08T09:38:36.209015529Z [POLL RATE] Last 60s: {"/":0,"/api/users/offline":2,"/api/notifications":6,"/api/sync":0,"/api/settings/dropdowns":2,"/api/bookings":2,"/api/users/agents":2,"/api/bookings/69fc546a19eb82df2515026f":2,"/api/bookings/69f58c0a8148832a3c14646b":0,"/api/bookings/69ecc066d8cfa03b17e3a35b":0,"/api/bookings/69e20d33519a503fc23f316c":0,"/api/bookings/69d9d3b4519a503fc23efbdc":0,"/api/bookings/69ccd36e12d6ce0419001044":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69d76dbb519a503fc23eec2a":0,"/api/users":0,"/api/bookings/calendar":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69e77138519a503fc23f52bd":0,"/api/bookings/69cb524ebe322c9f36033baa":0,"/api/bookings/69d0f94c519a503fc23ebe53":0,"/api/bookings/69f499258148832a3c145c3e":0,"/api/bookings/69fdae1ea07530cbc5965502":12,"/api/bookings/69fdae1ea07530cbc5965502/payments":3,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdae68a07530cbc596552a":0,"/api/bookings/69fdae1ea07530cbc5965502/status":0,"/api/bookings/69fdae1ea07530cbc5965502/passengers":4,"/api/bookings/69fdae1ea07530cbc5965502/verify":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaea1a07530cbc596553d":2,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569":2}
2026-05-08T09:38:43.713348228Z [POLL] OPTIONS /api/settings/dropdowns — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:38:43.728055093Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:38:44.031991437Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:38:44.032615983Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:38:44.032636993Z GET /api/settings/dropdowns 304 - - 0.746 ms
2026-05-08T09:38:44.283981372Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:38:44.284043554Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:38:44.284050174Z GET /api/notifications 304 - - 0.814 ms
2026-05-08T09:38:44.36244867Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 0ms | checkCache: 0ms { source: 'cache', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:38:44.363138567Z GET /api/bookings/69fdae1ea07530cbc5965502 304 - - 1.005 ms
2026-05-08T09:38:50.170771532Z [PERF] getAgents — Total: 68ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 68ms { source: 'db', count: 12 }
2026-05-08T09:38:50.172632048Z GET /api/users/agents 200 - - 69.377 ms
2026-05-08T09:38:50.251895746Z [MONGOOSE SLOW] Booking.find - 134ms | filter: {}
2026-05-08T09:38:50.251977808Z [PERF] getBookings — Total: 134ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 134ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T09:38:50.255329261Z GET /api/bookings?page=1&limit=15 200 - - 135.586 ms
2026-05-08T09:39:05.196313755Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 41MB
2026-05-08T09:39:05.518851093Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:39:05.51913626Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 41MB
2026-05-08T09:39:05.519154721Z GET /api/notifications 304 - - 0.491 ms
2026-05-08T09:39:05.723234847Z [PERF] deletePayment_69fdae1ea07530cbc5965502 — Total: 207ms | validate: 0ms | findPayment: 69ms | deletePayment: 67ms | finalProcessing: 71ms {
2026-05-08T09:39:05.723268868Z   bookingId: '69fdae1ea07530cbc5965502',
2026-05-08T09:39:05.723274239Z   paymentId: '69fdaef2a07530cbc596556b'
2026-05-08T09:39:05.723278409Z }
2026-05-08T09:39:05.723624347Z DELETE /api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef2a07530cbc596556b 200 42 - 207.944 ms
2026-05-08T09:39:05.862315891Z [BG:OK] deletePayment_sideEffects_69fdae1ea07530cbc5965502: 139ms
2026-05-08T09:39:06.364196072Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:39:06.529199298Z [MONGOOSE SLOW] Passenger.find - 165ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.530902631Z [MONGOOSE SLOW] Payment.find - 166ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.613974123Z [MONGOOSE SLOW] Timeline.find - 249ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.61749775Z [MONGOOSE SLOW] Booking.findOne - 253ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:06.617545932Z getBookingById_69fdae1ea07530cbc5965502: 253.39ms
2026-05-08T09:39:06.617658654Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 254ms | checkCache: 0ms | dbQueryParallel: 254ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:39:06.618710191Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 254.580 ms
2026-05-08T09:39:15.583170741Z [MONGOOSE SLOW] Booking.findOneAndUpdate - 138ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:15.586946625Z PUT /api/bookings/69fdae1ea07530cbc5965502 200 - - 204.997 ms
2026-05-08T09:39:15.588785781Z [PASSENGER PERF] Update Passengers - Total: 212ms | DB (Del+Ins): 140ms | Count: 1
2026-05-08T09:39:15.589228922Z PUT /api/bookings/69fdae1ea07530cbc5965502/passengers 200 500 - 212.760 ms
2026-05-08T09:39:15.66767691Z [BG:OK] updatePassengers_sideEffects_69fdae1ea07530cbc5965502: 78ms
2026-05-08T09:39:15.716913542Z [BG:OK] updateBooking_sideEffects_69fdae1ea07530cbc5965502: 133ms
2026-05-08T09:39:15.921165804Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:39:16.05671443Z [MONGOOSE SLOW] Booking.findOne - 135ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:16.063236772Z [MONGOOSE SLOW] Timeline.find - 142ms | filter: {"bookingId":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:16.063280923Z getBookingById_69fdae1ea07530cbc5965502: 142.115ms
2026-05-08T09:39:16.063627151Z [PERF] getBookingById_69fdae1ea07530cbc5965502 — Total: 143ms | checkCache: 0ms | dbQueryParallel: 143ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:39:16.0647951Z GET /api/bookings/69fdae1ea07530cbc5965502 200 - - 143.450 ms
2026-05-08T09:39:21.115882205Z [MONGOOSE SLOW] User.find - 387ms | filter: {"_id":{"$in":["69ae7ab0c8fbcb313fa0c744","69eb50af8e47cc04dc29918d","69c2a2038787a5edc5143fb6","69c52979220e3d8fa652ee44","69c537cb220e3d8fa652f0f2","69c53849220e3d8fa652f108"]}}
2026-05-08T09:39:21.11649333Z [MONGOOSE SLOW] User.find - 388ms | filter: {"_id":{"$in":[null,"69eb50af8e47cc04dc29918d","69c2a2038787a5edc5143fb6","69c52979220e3d8fa652ee44","69c53878220e3d8fa652f115","69c537cb220e3d8fa652f0f2","69c53849220e3d8fa652f108"]}}
2026-05-08T09:39:21.116770697Z [MONGOOSE SLOW] Booking.find - 1194ms | filter: {}
2026-05-08T09:39:21.116936091Z [PERF] getBookings — Total: 1194ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 1194ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T09:39:21.118399627Z GET /api/bookings?page=1&limit=15 200 - - 1195.085 ms
2026-05-08T09:39:21.118422308Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 1196ms | Status: 200 | Heap: 41MB
2026-05-08T09:39:25.878965873Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-08T09:39:26.20056758Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T09:39:26.201092113Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-08T09:39:26.201111203Z GET /api/notifications 304 - - 0.707 ms
2026-05-08T09:39:29.040597217Z [PERF] getAgents — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:39:29.04113307Z GET /api/users/agents 304 - - 0.779 ms
2026-05-08T09:39:36.209019332Z [POLL RATE] Last 60s: {"/":0,"/api/users/offline":0,"/api/notifications":6,"/api/sync":0,"/api/settings/dropdowns":2,"/api/bookings":4,"/api/users/agents":4,"/api/bookings/69fc546a19eb82df2515026f":0,"/api/bookings/69f58c0a8148832a3c14646b":0,"/api/bookings/69ecc066d8cfa03b17e3a35b":0,"/api/bookings/69e20d33519a503fc23f316c":0,"/api/bookings/69d9d3b4519a503fc23efbdc":0,"/api/bookings/69ccd36e12d6ce0419001044":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69d76dbb519a503fc23eec2a":0,"/api/users":0,"/api/bookings/calendar":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69e77138519a503fc23f52bd":0,"/api/bookings/69cb524ebe322c9f36033baa":0,"/api/bookings/69d0f94c519a503fc23ebe53":0,"/api/bookings/69f499258148832a3c145c3e":0,"/api/bookings/69fdae1ea07530cbc5965502":9,"/api/bookings/69fdae1ea07530cbc5965502/payments":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdae68a07530cbc596552a":0,"/api/bookings/69fdae1ea07530cbc5965502/status":0,"/api/bookings/69fdae1ea07530cbc5965502/passengers":2,"/api/bookings/69fdae1ea07530cbc5965502/verify":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaea1a07530cbc596553d":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef2a07530cbc596556b":2}
2026-05-08T09:39:38.522282453Z [MONGOOSE SLOW] Booking.findOne - 8013ms | filter: {"_id":"69fdae1ea07530cbc5965502"}
2026-05-08T09:39:50.787837039Z [PERF] deleteBooking_69fdae1ea07530cbc5965502 — Total: 20277ms | findBooking: 0ms | deleteBookingDoc: 8014ms | finalProcessing: 12263ms { bookingId: '69fdae1ea07530cbc5965502' }
2026-05-08T09:39:50.78787117Z DELETE /api/bookings/69fdae1ea07530cbc5965502 200 85 - 20277.612 ms
2026-05-08T09:39:50.78789157Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fdae1ea07530cbc5965502 — 20279ms | Status: 200 | Heap: 42MB
2026-05-08T09:39:51.52985776Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:39:51.530391413Z GET /api/bookings?page=1&limit=15 304 - - 0.980 ms
2026-05-08T09:39:52.980160725Z [BG:OK] deleteBooking_cleanup_69fdae1ea07530cbc5965502: 2194ms
2026-05-08T09:40:36.209004894Z [POLL RATE] Last 60s: {"/":0,"/api/users/offline":0,"/api/notifications":0,"/api/sync":0,"/api/settings/dropdowns":0,"/api/bookings":2,"/api/users/agents":0,"/api/bookings/69fc546a19eb82df2515026f":0,"/api/bookings/69f58c0a8148832a3c14646b":0,"/api/bookings/69ecc066d8cfa03b17e3a35b":0,"/api/bookings/69e20d33519a503fc23f316c":0,"/api/bookings/69d9d3b4519a503fc23efbdc":0,"/api/bookings/69ccd36e12d6ce0419001044":0,"/api/bookings/69cb9ff7b8f3afa31dfb3ddc":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69d76dbb519a503fc23eec2a":0,"/api/users":0,"/api/bookings/calendar":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69e77138519a503fc23f52bd":0,"/api/bookings/69cb524ebe322c9f36033baa":0,"/api/bookings/69d0f94c519a503fc23ebe53":0,"/api/bookings/69f499258148832a3c145c3e":0,"/api/bookings/69fdae1ea07530cbc5965502":0,"/api/bookings/69fdae1ea07530cbc5965502/payments":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdae68a07530cbc596552a":0,"/api/bookings/69fdae1ea07530cbc5965502/status":0,"/api/bookings/69fdae1ea07530cbc5965502/passengers":0,"/api/bookings/69fdae1ea07530cbc5965502/verify":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaea1a07530cbc596553d":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef0a07530cbc5965569":0,"/api/bookings/69fdae1ea07530cbc5965502/payments/69fdaef2a07530cbc596556b":0}
2026-05-08T09:40:58.169950647Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 42MB
2026-05-08T09:40:58.512507642Z [GET] /api/bookings/69fc5f6419eb82df251503a0
2026-05-08T09:40:58.643086647Z [MONGOOSE SLOW] Booking.findOne - 130ms | filter: {"_id":"69fc5f6419eb82df251503a0"}
2026-05-08T09:40:58.6431906Z getBookingById_69fc5f6419eb82df251503a0: 130.58ms
2026-05-08T09:40:58.643369114Z [PERF] getBookingById_69fc5f6419eb82df251503a0 — Total: 131ms | checkCache: 0ms | dbQueryParallel: 130ms | calculateTotals: 0ms | formatResponse: 0ms | finalProcessing: 1ms { source: 'db', bookingId: '69fc5f6419eb82df251503a0' }
2026-05-08T09:40:58.644631216Z GET /api/bookings/69fc5f6419eb82df251503a0 200 - - 131.960 ms
2026-05-08T09:40:58.989359634Z [PERF] getDropdowns — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T09:40:58.989794745Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 42MB
2026-05-08T09:40:58.989809675Z GET /api/settings/dropdowns 304 - - 0.665 ms
2026-05-08T09:41:00.992671698Z [MONGOOSE SLOW] Booking.find - 136ms | filter: {}
2026-05-08T09:41:00.992887253Z [PERF] getBookings — Total: 136ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 136ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-08T09:41:00.992892203Z GET /api/bookings?page=1&limit=15 200 - - 137.163 ms
2026-05-08T09:41:01.043935052Z [PERF] getAgents — Total: 66ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 66ms { source: 'db', count: 12 }
2026-05-08T09:41:01.045023989Z GET /api/users/agents 200 - - 69.093 ms
2026-05-08T09:41:01.813735766Z [GET] /api/bookings/69fdae1ea07530cbc5965502
2026-05-08T09:41:01.881589762Z getBookingById_69fdae1ea07530cbc5965502: 67.708ms
2026-05-08T09:41:01.882172227Z GET /api/bookings/69fdae1ea07530cbc5965502 404 44 - 68.818 ms
2026-05-08T09:41:19.2590055Z [MONGOOSE SLOW] Booking.find - 4680ms | filter: {"travelDate":{"$gte":"2026-05-01T00:00:00.000Z","$lte":"2026-05-31T23:59:59.000Z"}}
2026-05-08T09:41:19.259163684Z 🐌 SLOW REQUEST: GET /api/bookings/calendar?month=5&year=2026 — 4682ms | Status: 304 | Heap: 42MB
2026-05-08T09:41:19.259186544Z GET /api/bookings/calendar?month=5&year=2026 304 - - 4681.522 ms