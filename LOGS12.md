
2026-05-06T10:29:01.133323966Z > node dist/src/server.js
2026-05-06T10:29:01.133327576Z 
2026-05-06T10:29:08.027119723Z Server running in production mode on port 10000
2026-05-06T10:29:08.027385088Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-06T10:29:08.821299065Z MongoDB Connected. Synchronizing indexes...
2026-05-06T10:29:08.830011508Z MongoDB Connected: ac-nvjnavm-shard-00-02.31xmkrx.mongodb.net
2026-05-06T10:29:08.925809564Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-06T10:29:08.926759941Z 🚀 Startup tasks complete. System ready.
2026-05-06T10:29:09.577850193Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-06T10:29:12.944028887Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T10:29:13.095118517Z getBookingsQuery_motx0fov: 150.929ms
2026-05-06T10:29:13.097279865Z GET /api/bookings?page=1&limit=15 304 - - 156.022 ms
2026-05-06T10:29:13.519319335Z GET /api/notifications 304 - - 72.567 ms
2026-05-06T10:31:39.147510396Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T10:31:39.154651422Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:31:39.155174331Z GET /api/notifications 304 - - 0.652 ms
2026-05-06T10:31:39.280452766Z getBookingsQuery_motx3ki3: 132.776ms
2026-05-06T10:31:39.281221159Z GET /api/bookings?page=1&limit=15 304 - - 134.473 ms
2026-05-06T10:31:39.999023893Z GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&companyName= 200 264 - 68.989 ms
2026-05-06T10:31:40.025758283Z GET /api/analytics/revenue-trends?interval=month&companyName= 304 - - 76.292 ms
2026-05-06T10:31:40.030551718Z GET /api/settings/dropdowns 304 - - 76.349 ms
2026-05-06T10:31:40.051620088Z GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&companyName= 304 - - 95.289 ms
2026-05-06T10:31:40.090031754Z GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&companyName= 304 - - 132.148 ms
2026-05-06T10:31:40.583061662Z GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&companyName= 304 - - 130.415 ms
2026-05-06T10:36:41.090480965Z GET /api/notifications - - - - ms
2026-05-06T10:36:45.153608469Z [PERF] POST /api/users/offline - 2768ms | Heap: 35MB | RSS: 101MB
2026-05-06T10:36:45.153651549Z POST /api/users/offline 200 16 - 2767.656 ms
2026-05-06T10:37:23.767212004Z ==> Deploying...
2026-05-06T10:37:23.921293014Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-06T10:37:41.290983214Z ==> Running 'npm run start'
2026-05-06T10:37:42.788730997Z 
2026-05-06T10:37:42.788754958Z > travel-crm-backend@1.0.0 start
2026-05-06T10:37:42.788761198Z > node dist/src/server.js
2026-05-06T10:37:42.788763728Z 
2026-05-06T10:37:49.891595437Z Server running in production mode on port 10000
2026-05-06T10:37:49.891640108Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-06T10:37:50.159694289Z HEAD / 200 36 - 1.750 ms
2026-05-06T10:37:50.677138953Z MongoDB Connected. Synchronizing indexes...
2026-05-06T10:37:50.685643745Z MongoDB Connected: ac-nvjnavm-shard-00-01.31xmkrx.mongodb.net
2026-05-06T10:37:50.780499653Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-06T10:37:50.781416513Z 🚀 Startup tasks complete. System ready.
2026-05-06T10:37:51.890079107Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-06T10:37:55.102569567Z ==> Your service is live 🎉
2026-05-06T10:37:55.243268374Z GET / 200 36 - 0.381 ms
2026-05-06T10:37:55.256415034Z ==> 
2026-05-06T10:37:55.25893762Z ==> ///////////////////////////////////////////////////////////
2026-05-06T10:37:55.261097698Z ==> 
2026-05-06T10:37:55.264226977Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-06T10:37:55.266516807Z ==> 
2026-05-06T10:37:55.26932783Z ==> ///////////////////////////////////////////////////////////
2026-05-06T10:38:04.79892989Z GET /api/notifications 200 2 - 68.032 ms
2026-05-06T10:38:04.894146466Z GET /api/sync 304 - - 144.368 ms
2026-05-06T10:38:07.678170653Z 🐌 SLOW REQUEST: GET /api/settings/dropdowns — 698ms | Status: 304 | Heap: 36MB
2026-05-06T10:38:07.678209824Z GET /api/settings/dropdowns 304 - - 698.295 ms
2026-05-06T10:38:07.688859252Z 🐌 SLOW REQUEST: GET /api/users/agents — 718ms | Status: 200 | Heap: 36MB
2026-05-06T10:38:07.688997345Z GET /api/users/agents 200 - - 700.061 ms
2026-05-06T10:38:09.2695455Z getBookingsQuery_motxbvrp: 2.272s
2026-05-06T10:38:09.27140671Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 2275ms | Status: 200 | Heap: 36MB
2026-05-06T10:38:09.27143858Z GET /api/bookings?page=1&limit=15 200 - - 2273.151 ms
2026-05-06T10:38:19.212534351Z getBookingsQuery_motxc45c: 1.356s
2026-05-06T10:38:19.214318049Z 🐌 SLOW REQUEST: GET /api/bookings?page=8&limit=15 — 1358ms | Status: 200 | Heap: 37MB
2026-05-06T10:38:19.21434513Z GET /api/bookings?page=8&limit=15 200 - - 1356.709 ms
2026-05-06T10:38:25.3624735Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:38:25.362861318Z GET /api/notifications 304 - - 0.712 ms
2026-05-06T10:38:25.626946445Z getBookingsQuery_motxca1g: 134.366ms
2026-05-06T10:38:25.628850606Z GET /api/bookings?page=16&limit=15 200 - - 135.460 ms
2026-05-06T10:38:30.110929633Z [GET] /api/bookings/69e74c52519a503fc23f5131
2026-05-06T10:38:30.254114425Z getBookingById_69e74c52519a503fc23f5131: 143.047ms
2026-05-06T10:38:30.255180158Z GET /api/bookings/69e74c52519a503fc23f5131 200 - - 144.766 ms
2026-05-06T10:38:38.423160889Z getBookingsQuery_motxcjws: 138.586ms
2026-05-06T10:38:38.424707962Z GET /api/bookings?page=26&limit=15 200 - - 139.627 ms
2026-05-06T10:38:40.672071817Z [GET] /api/bookings/69d9f4da519a503fc23eff50
2026-05-06T10:38:44.650811073Z getBookingById_69d9f4da519a503fc23eff50: 3.979s
2026-05-06T10:38:44.652230063Z GET /api/bookings/69d9f4da519a503fc23eff50 200 - - 3979.970 ms
2026-05-06T10:38:44.652255704Z 🐌 SLOW REQUEST: GET /api/bookings/69d9f4da519a503fc23eff50 — 3981ms | Status: 200 | Heap: 35MB
2026-05-06T10:50:35.344856038Z GET /api/bookings?assignedTo=69ea0587519a503fc23f6384&page=1&limit=15 200 99 - 12079.245 ms
2026-05-06T10:50:35.344861778Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69ea0587519a503fc23f6384&page=1&limit=15 — 12080ms | Status: 200 | Heap: 40MB
2026-05-06T10:50:48.226384551Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:50:48.22679197Z GET /api/notifications 304 - - 0.691 ms
2026-05-06T10:50:52.859824546Z getBookingsQuery_motxrmr4: 31.051s
2026-05-06T10:50:52.860492461Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 31053ms | Status: 304 | Heap: 40MB
2026-05-06T10:50:52.860511861Z GET /api/bookings?page=1&limit=15 304 - - 31052.122 ms
2026-05-06T10:50:52.865437596Z 🐌 SLOW REQUEST: GET /api/bookings?page=6&limit=15 — 31078ms | Status: 200 | Heap: 41MB
2026-05-06T10:50:52.865485648Z getBookingsQuery_motxrmqj: 31.077s
2026-05-06T10:50:52.865491428Z GET /api/bookings?page=6&limit=15 200 - - 31077.466 ms
2026-05-06T10:50:53.413530704Z getBookingsQuery_motxrzrj: 14.741s
2026-05-06T10:50:53.419239826Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 — 14748ms | Status: 200 | Heap: 41MB
2026-05-06T10:50:53.419267017Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 200 - - 14741.940 ms
2026-05-06T10:50:58.757636597Z getBookingsQuery_motxsf5x: 127.491ms
2026-05-06T10:50:58.761744755Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=4&limit=15 200 - - 128.874 ms
2026-05-06T10:51:01.013768973Z [GET] /api/bookings/69d755e7519a503fc23eeafa
2026-05-06T10:51:01.148370673Z getBookingById_69d755e7519a503fc23eeafa: 135.414ms
2026-05-06T10:51:01.150576521Z GET /api/bookings/69d755e7519a503fc23eeafa 200 - - 137.912 ms
2026-05-06T10:51:05.588434602Z [GET] /api/bookings/69d3439e519a503fc23ebfe0
2026-05-06T10:51:05.725117087Z getBookingById_69d3439e519a503fc23ebfe0: 136.557ms
2026-05-06T10:51:05.726243701Z GET /api/bookings/69d3439e519a503fc23ebfe0 200 - - 137.734 ms
2026-05-06T10:51:09.021534204Z GET /api/notifications 304 - - 177.324 ms
2026-05-06T10:51:10.979761896Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-06T10:51:10.980478481Z GET /api/bookings?page=1&limit=15 304 - - 1.031 ms
2026-05-06T10:51:11.042336165Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53849220e3d8fa652f108________1_15_
2026-05-06T10:51:11.043630083Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 0.955 ms
2026-05-06T10:51:11.113087249Z getBookingsQuery_motxsop3: 129.344ms
2026-05-06T10:51:11.113653051Z GET /api/bookings?page=4&limit=15 304 - - 130.095 ms
2026-05-06T10:51:12.738900739Z getBookingsQuery_motxspy4: 133.772ms
2026-05-06T10:51:12.739328798Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 135.100 ms
2026-05-06T10:51:15.607628945Z [GET] /api/bookings/69f58c0a8148832a3c14646b
2026-05-06T10:51:15.634274345Z [CACHE HIT] settings_dropdowns
2026-05-06T10:51:15.635115003Z GET /api/settings/dropdowns 304 - - 0.951 ms
2026-05-06T10:51:15.74528518Z getBookingById_69f58c0a8148832a3c14646b: 137.168ms
2026-05-06T10:51:15.746597599Z GET /api/bookings/69f58c0a8148832a3c14646b 200 - - 138.777 ms
2026-05-06T10:51:20.051877824Z [CACHE HIT] users_agents
2026-05-06T10:51:20.052247552Z GET /api/users/agents 304 - - 0.728 ms
2026-05-06T10:51:29.640466854Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:51:29.640849503Z GET /api/notifications 304 - - 0.675 ms
2026-05-06T10:51:31.342288911Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-06T10:51:31.342845123Z GET /api/bookings?page=1&limit=15 304 - - 0.772 ms
2026-05-06T10:51:41.569759924Z getBookingsQuery_motxsyfl: 17.968s
2026-05-06T10:51:41.570165813Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 — 17968ms | Status: 304 | Heap: 42MB
2026-05-06T10:51:41.570186234Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 17968.645 ms
2026-05-06T10:51:41.773548096Z getBookingsQuery_motxsxu9: 18.940s
2026-05-06T10:51:41.775028577Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 200 - - 18941.898 ms
2026-05-06T10:51:41.775032877Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 — 18943ms | Status: 200 | Heap: 42MB
2026-05-06T10:51:41.798391377Z getBookingsQuery_motxt0tq: 15.096s
2026-05-06T10:51:41.79899766Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 15096.664 ms
2026-05-06T10:51:41.79901388Z 🐌 SLOW REQUEST: GET /api/bookings?myBookings=true&page=1&limit=15 — 15097ms | Status: 304 | Heap: 42MB
2026-05-06T10:51:41.955036949Z getBookingsQuery_motxt8s5: 4.942s
2026-05-06T10:51:41.955852157Z getBookingsQuery_motxt7zf: 5.977s
2026-05-06T10:51:41.956284546Z 🐌 SLOW REQUEST: GET /api/bookings?page=2&limit=15 — 5978ms | Status: 304 | Heap: 42MB
2026-05-06T10:51:41.956299416Z GET /api/bookings?page=2&limit=15 304 - - 5977.383 ms
2026-05-06T10:51:41.95695883Z 🐌 SLOW REQUEST: GET /api/bookings?page=3&limit=15 — 4944ms | Status: 200 | Heap: 42MB
2026-05-06T10:51:41.956983431Z GET /api/bookings?page=3&limit=15 200 - - 4942.567 ms
2026-05-06T10:51:50.241103561Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:51:50.241413247Z GET /api/notifications 304 - - 0.538 ms
2026-05-06T10:51:53.179289685Z getBookingsQuery_motxtl1y: 260.885ms
2026-05-06T10:51:53.179844917Z GET /api/bookings?page=6&limit=15 304 - - 261.839 ms
2026-05-06T10:51:56.773699041Z getBookingsQuery_motxtnsd: 312.273ms
2026-05-06T10:51:56.774917087Z GET /api/bookings?page=11&limit=15 200 - - 313.229 ms
2026-05-06T10:52:11.327745155Z getBookingsQuery_motxtug9: 6.230s
2026-05-06T10:52:11.329154005Z 🐌 SLOW REQUEST: GET /api/bookings?page=29&limit=15 — 6231ms | Status: 200 | Heap: 37MB
2026-05-06T10:52:11.329213146Z GET /api/bookings?page=29&limit=15 200 - - 6230.963 ms
2026-05-06T10:52:21.05114895Z GET /api/notifications 304 - - 10258.870 ms
2026-05-06T10:52:21.05114911Z 🐌 SLOW REQUEST: GET /api/notifications — 10259ms | Status: 304 | Heap: 37MB
2026-05-06T10:52:22.180742292Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744________true__1_15_
2026-05-06T10:52:22.181285234Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 0.653 ms
2026-05-06T10:52:29.475100758Z getBookingsQuery_motxu7mk: 7.302s
2026-05-06T10:52:29.475608129Z 🐌 SLOW REQUEST: GET /api/bookings?myBookings=true&page=29&limit=15 — 7303ms | Status: 200 | Heap: 37MB
2026-05-06T10:52:29.4756546Z GET /api/bookings?myBookings=true&page=29&limit=15 200 101 - 7302.854 ms
2026-05-06T10:52:29.661345524Z getBookingsQuery_motxuacx: 3.948s
2026-05-06T10:52:29.661898555Z GET /api/bookings?page=1&limit=15 304 - - 3948.713 ms
2026-05-06T10:52:29.661920256Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 3949ms | Status: 304 | Heap: 37MB
2026-05-06T10:52:29.662333525Z getBookingsQuery_motxuacf: 3.967s
2026-05-06T10:52:29.662730163Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=unassigned&page=1&limit=15 — 3968ms | Status: 304 | Heap: 37MB
2026-05-06T10:52:29.662751504Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 3967.438 ms
2026-05-06T10:52:34.192118481Z [CACHE HIT] settings_dropdowns
2026-05-06T10:52:34.19254446Z GET /api/settings/dropdowns 304 - - 0.637 ms
2026-05-06T10:52:34.336877758Z getBookingsQuery_motxugwj: 141.406ms
2026-05-06T10:52:34.337484631Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 142.080 ms
2026-05-06T10:52:37.290402273Z GET /api/bookings/calendar?month=5&year=2026 304 - - 213.288 ms
2026-05-06T10:52:39.806878805Z GET /api/users 200 - - 71.162 ms
2026-05-06T10:52:41.608224663Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:52:41.60851551Z GET /api/notifications 304 - - 0.576 ms
2026-05-06T10:52:41.853664346Z GET /api/analytics/revenue-trends?interval=month&company= 304 - - 71.349 ms
2026-05-06T10:52:41.877922725Z GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company= 200 264 - 65.239 ms
2026-05-06T10:52:41.881051212Z GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company= 304 - - 87.472 ms
2026-05-06T10:52:41.939103424Z GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company= 304 - - 125.323 ms
2026-05-06T10:52:42.061289369Z GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company= 304 - - 276.153 ms
2026-05-06T10:52:45.451652062Z GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight 200 43 - 612.295 ms
2026-05-06T10:52:45.451654682Z 🐌 SLOW REQUEST: GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight — 613ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:45.452354537Z 🐌 SLOW REQUEST: GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight — 616ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:45.45247848Z GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight 200 2 - 615.956 ms
2026-05-06T10:52:45.507018997Z 🐌 SLOW REQUEST: GET /api/analytics/revenue-trends?interval=month&company=Skylight — 658ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:45.507074808Z GET /api/analytics/revenue-trends?interval=month&company=Skylight 200 2 - 658.179 ms
2026-05-06T10:52:45.662973774Z GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight 200 81 - 831.421 ms
2026-05-06T10:52:45.662991545Z 🐌 SLOW REQUEST: GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight — 832ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:45.73332194Z GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight 200 63 - 886.015 ms
2026-05-06T10:52:45.73332889Z 🐌 SLOW REQUEST: GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company=Skylight — 886ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:57.121791933Z GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 200 43 - 5319.609 ms
2026-05-06T10:52:57.121815034Z 🐌 SLOW REQUEST: GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords — 5320ms | Status: 200 | Heap: 39MB
2026-05-06T10:52:57.122781785Z 🐌 SLOW REQUEST: GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords — 5316ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:57.122813555Z GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 200 2 - 5316.215 ms
2026-05-06T10:52:57.149128638Z 🐌 SLOW REQUEST: GET /api/analytics/revenue-trends?interval=month&company=Travowords — 5315ms | Status: 200 | Heap: 38MB
2026-05-06T10:52:57.149169689Z GET /api/analytics/revenue-trends?interval=month&company=Travowords 200 2 - 5315.046 ms
2026-05-06T10:53:02.766265516Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:53:02.766566743Z GET /api/notifications 304 - - 0.578 ms
2026-05-06T10:53:09.99812565Z 🐌 SLOW REQUEST: GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords — 18165ms | Status: 200 | Heap: 38MB
2026-05-06T10:53:09.998155011Z GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 200 63 - 18165.545 ms
2026-05-06T10:53:10.001893121Z 🐌 SLOW REQUEST: GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords — 18203ms | Status: 200 | Heap: 38MB
2026-05-06T10:53:10.001911001Z GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 200 81 - 18202.689 ms
2026-05-06T10:53:23.475258637Z GET /api/notifications 304 - - 62.652 ms
2026-05-06T10:53:34.129619107Z [CACHE HIT] users_agents
2026-05-06T10:53:34.129955275Z GET /api/users/agents 304 - - 0.614 ms
2026-05-06T10:54:35.195307775Z getBookingsQuery_motxvz9e: 50.552s
2026-05-06T10:54:35.19601906Z GET /api/bookings?page=1&limit=15 304 - - 50553.081 ms
2026-05-06T10:54:35.19602434Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 50553ms | Status: 304 | Heap: 42MB
2026-05-06T10:54:35.394349864Z 🐌 SLOW REQUEST: POST /api/bookings — 53459ms | Status: 201 | Heap: 41MB
2026-05-06T10:54:35.394392505Z POST /api/bookings 201 - - 53456.025 ms
2026-05-06T10:54:40.763569516Z getBookingsQuery_motxx6gn: 131.273ms
2026-05-06T10:54:40.764577478Z GET /api/bookings?page=1&limit=15 200 - - 132.379 ms
2026-05-06T10:54:47.122365687Z [CACHE HIT] settings_dropdowns
2026-05-06T10:54:47.122755166Z GET /api/settings/dropdowns 304 - - 0.600 ms
2026-05-06T10:54:47.142022368Z [GET] /api/bookings/69f977213ed07ab843f38d2d
2026-05-06T10:54:47.276507297Z getBookingById_69f977213ed07ab843f38d2d: 134.336ms
2026-05-06T10:54:47.277402376Z GET /api/bookings/69f977213ed07ab843f38d2d 200 - - 135.280 ms
2026-05-06T10:54:51.337684884Z GET /api/notifications 304 - - 350.277 ms
2026-05-06T10:55:04.429600881Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:55:04.429617622Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-06T10:55:08.332597945Z 🐌 SLOW REQUEST: PUT /api/bookings/69f977213ed07ab843f38d2d — 9900ms | Status: 200 | Heap: 42MB
2026-05-06T10:55:08.332648006Z PUT /api/bookings/69f977213ed07ab843f38d2d 200 - - 9897.499 ms
2026-05-06T10:55:08.678764204Z [CACHE HIT] users_agents
2026-05-06T10:55:08.678781194Z GET /api/users/agents 304 - - 0.623 ms
2026-05-06T10:55:08.804438914Z getBookingsQuery_motxxs3e: 137.487ms
2026-05-06T10:55:08.804996845Z GET /api/bookings?page=1&limit=15 200 - - 138.383 ms
2026-05-06T10:55:09.140000286Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-06T10:55:09.140769302Z GET /api/bookings?page=1&limit=15 304 - - 0.784 ms
2026-05-06T10:55:13.279655154Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:55:13.475656629Z getBookingById_69fb1dbe8e18191c0c54f23b: 195.886ms
2026-05-06T10:55:13.477300235Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 196.986 ms
2026-05-06T10:55:15.923202293Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:55:15.92353452Z GET /api/notifications 304 - - 0.598 ms
2026-05-06T10:55:19.373011228Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:55:19.506123827Z PUT /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 195.466 ms
2026-05-06T10:55:19.785037637Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:55:19.974146744Z getBookingById_69fb1dbe8e18191c0c54f23b: 189.013ms
2026-05-06T10:55:19.975233497Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 189.917 ms
2026-05-06T10:55:21.197269572Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:55:21.697648182Z PATCH /api/bookings/69fb1dbe8e18191c0c54f23b/status 200 911 - 499.808 ms
2026-05-06T10:55:21.984388699Z [CACHE HIT] booking_69fb1dbe8e18191c0c54f23b
2026-05-06T10:55:21.984835278Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 304 - - 0.749 ms
2026-05-06T10:55:36.476791058Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:55:36.477069014Z GET /api/notifications 304 - - 0.721 ms
2026-05-06T10:55:57.105664911Z GET /api/notifications 304 - - 71.476 ms
2026-05-06T10:56:17.702153139Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:56:17.702508077Z GET /api/notifications 304 - - 0.515 ms
2026-05-06T10:56:38.264151026Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:56:38.264481703Z GET /api/notifications 304 - - 0.546 ms
2026-05-06T10:56:52.985491814Z POST /api/bookings/69fb1dbe8e18191c0c54f23b/payments 201 307 - 132.494 ms
2026-05-06T10:56:54.232425244Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:56:54.422617565Z getBookingById_69fb1dbe8e18191c0c54f23b: 190.095ms
2026-05-06T10:56:54.423702148Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 191.060 ms
2026-05-06T10:57:07.885169844Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fb1dbe8e18191c0c54f23b/payments/69fb1e748e18191c0c54f274 — 546ms | Status: 200 | Heap: 43MB
2026-05-06T10:57:07.885193335Z DELETE /api/bookings/69fb1dbe8e18191c0c54f23b/payments/69fb1e748e18191c0c54f274 200 42 - 546.073 ms
2026-05-06T10:57:08.854650855Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:57:09.060235156Z getBookingById_69fb1dbe8e18191c0c54f23b: 204.79ms
2026-05-06T10:57:09.06092045Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 206.191 ms
2026-05-06T10:57:16.058297157Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:57:23.855126647Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:57:23.85995784Z 🐌 SLOW REQUEST: PATCH /api/bookings/69fb1dbe8e18191c0c54f23b/status — 7803ms | Status: 200 | Heap: 39MB
2026-05-06T10:57:23.860006231Z PATCH /api/bookings/69fb1dbe8e18191c0c54f23b/status 200 910 - 7802.621 ms
2026-05-06T10:57:30.106897915Z GET /api/notifications 304 - - 10647.343 ms
2026-05-06T10:57:30.106900555Z 🐌 SLOW REQUEST: GET /api/notifications — 10648ms | Status: 304 | Heap: 38MB
2026-05-06T10:57:39.478564846Z 🐌 SLOW REQUEST: POST /api/bookings/69fb1dbe8e18191c0c54f23b/payments — 24016ms | Status: 201 | Heap: 38MB
2026-05-06T10:57:39.478605397Z POST /api/bookings/69fb1dbe8e18191c0c54f23b/payments 201 307 - 24015.732 ms
2026-05-06T10:57:39.49416219Z [PASSENGER PERF] Add Passengers - Total: 23531ms | DB: 15638ms | Count: 2
2026-05-06T10:57:39.494781763Z POST /api/bookings/69fb1dbe8e18191c0c54f23b/passengers 201 967 - 23531.561 ms
2026-05-06T10:57:39.494807034Z 🐌 SLOW REQUEST: POST /api/bookings/69fb1dbe8e18191c0c54f23b/passengers — 23532ms | Status: 201 | Heap: 38MB
2026-05-06T10:57:43.343184799Z 🐌 SLOW REQUEST: PUT /api/bookings/69fb1dbe8e18191c0c54f23b — 27404ms | Status: 200 | Heap: 38MB
2026-05-06T10:57:43.34324296Z PUT /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 27402.820 ms
2026-05-06T10:57:44.540807544Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:57:44.546510136Z [CACHE HIT] settings_dropdowns
2026-05-06T10:57:44.546896794Z GET /api/settings/dropdowns 304 - - 0.439 ms
2026-05-06T10:57:44.736624436Z getBookingById_69fb1dbe8e18191c0c54f23b: 195.726ms
2026-05-06T10:57:44.737714529Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 196.672 ms
2026-05-06T10:57:50.156247174Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:57:50.300568563Z PUT /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 206.906 ms
2026-05-06T10:57:50.752726292Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:57:50.949715218Z getBookingById_69fb1dbe8e18191c0c54f23b: 196.878ms
2026-05-06T10:57:50.952880746Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 198.172 ms
2026-05-06T10:57:50.983754537Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:57:50.984302778Z GET /api/notifications 304 - - 0.918 ms
2026-05-06T10:57:54.862575044Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-06T10:57:54.993314689Z PUT /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 193.284 ms
2026-05-06T10:57:55.58940776Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:57:55.778743527Z getBookingById_69fb1dbe8e18191c0c54f23b: 189.245ms
2026-05-06T10:57:55.780167308Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 190.269 ms
2026-05-06T10:57:57.616984838Z PATCH /api/bookings/69fb1dbe8e18191c0c54f23b/verify 200 121 - 144.822 ms
2026-05-06T10:57:57.917937391Z [GET] /api/bookings/69fb1dbe8e18191c0c54f23b
2026-05-06T10:57:58.109153748Z getBookingById_69fb1dbe8e18191c0c54f23b: 191.03ms
2026-05-06T10:57:58.110419635Z GET /api/bookings/69fb1dbe8e18191c0c54f23b 200 - - 192.185 ms
2026-05-06T10:58:01.425938822Z GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company= 200 264 - 517.490 ms
2026-05-06T10:58:01.425942642Z 🐌 SLOW REQUEST: GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company= — 518ms | Status: 200 | Heap: 39MB
2026-05-06T10:58:01.42913315Z GET /api/analytics/revenue-trends?interval=month&company= 200 110 - 489.629 ms
2026-05-06T10:58:01.458537759Z GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company= 304 - - 535.628 ms
2026-05-06T10:58:01.458557099Z 🐌 SLOW REQUEST: GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company= — 536ms | Status: 304 | Heap: 40MB
2026-05-06T10:58:02.21603357Z 🐌 SLOW REQUEST: GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company= — 1317ms | Status: 200 | Heap: 40MB
2026-05-06T10:58:02.2160646Z GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company= 200 101 - 1317.134 ms
2026-05-06T10:58:02.353332694Z 🐌 SLOW REQUEST: GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company= — 1430ms | Status: 200 | Heap: 40MB
2026-05-06T10:58:02.353360245Z GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company= 200 - - 1428.742 ms
2026-05-06T10:58:05.566936673Z GET /api/analytics/payment-breakdown?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 304 - - 0.381 ms
2026-05-06T10:58:05.580779099Z GET /api/analytics/payments?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 304 - - 0.305 ms
2026-05-06T10:58:05.628483879Z GET /api/analytics/bookings?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 304 - - 64.931 ms
2026-05-06T10:58:05.633789502Z GET /api/analytics/agents?fromDate=2026-04-06&toDate=2026-05-06&company=Travowords 304 - - 63.378 ms
2026-05-06T10:58:05.651364698Z GET /api/analytics/revenue-trends?interval=month&company=Travowords 200 34 - 74.131 ms
2026-05-06T10:58:11.555076267Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:58:11.555290222Z GET /api/notifications 304 - - 0.691 ms
2026-05-06T10:58:12.206566282Z [CACHE HIT] users_agents
2026-05-06T10:58:12.206599783Z GET /api/users/agents 304 - - 0.632 ms
2026-05-06T10:58:12.334543498Z getBookingsQuery_moty1ppm: 129.954ms
2026-05-06T10:58:12.337304467Z GET /api/bookings?page=1&limit=15 200 - - 131.062 ms
2026-05-06T10:58:39.660819876Z 🐌 SLOW REQUEST: GET /api/users — 9436ms | Status: 200 | Heap: 40MB
2026-05-06T10:58:39.660898268Z GET /api/users 200 - - 9435.115 ms
2026-05-06T10:58:41.95102636Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-06T10:58:41.951573041Z GET /api/bookings?page=1&limit=15 304 - - 0.836 ms
2026-05-06T10:58:44.61106337Z [CACHE HIT] users_agents
2026-05-06T10:58:44.611367166Z GET /api/users/agents 304 - - 0.602 ms
2026-05-06T10:58:50.898281322Z GET /api/notifications 304 - - 18762.275 ms
2026-05-06T10:58:50.898332843Z 🐌 SLOW REQUEST: GET /api/notifications — 18763ms | Status: 304 | Heap: 40MB
2026-05-06T10:58:57.711473638Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fb1dbe8e18191c0c54f23b — 10801ms | Status: 200 | Heap: 40MB
2026-05-06T10:58:57.711506999Z DELETE /api/bookings/69fb1dbe8e18191c0c54f23b 200 85 - 10800.362 ms
2026-05-06T10:58:57.788338161Z [BG] Cleanup complete for booking 69fb1dbe8e18191c0c54f23b
2026-05-06T10:58:57.788372322Z [BG] deleteBooking_cleanup_69fb1dbe8e18191c0c54f23b: 76.472ms
2026-05-06T10:58:58.433311568Z getBookingsQuery_moty2p9z: 137.888ms
2026-05-06T10:58:58.434696738Z GET /api/bookings?page=1&limit=15 200 - - 138.863 ms
2026-05-06T10:59:03.845911627Z [LOGIN PERF] Total: 86ms | DB: 71ms | Bcrypt: 15ms
2026-05-06T10:59:03.921790259Z POST /api/auth/login 200 413 - 162.487 ms
2026-05-06T10:59:04.51080311Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T10:59:04.511017164Z GET /api/notifications 304 - - 0.303 ms
2026-05-06T10:59:04.647128814Z GET /api/sync 200 - - 138.338 ms
2026-05-06T10:59:06.765950476Z [CACHE HIT] settings_dropdowns
2026-05-06T10:59:06.766250172Z GET /api/settings/dropdowns 304 - - 0.572 ms
2026-05-06T10:59:06.768599722Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-06T10:59:06.769001001Z GET /api/bookings?page=1&limit=15 304 - - 0.498 ms
2026-05-06T10:59:06.785011813Z [CACHE HIT] users_agents
2026-05-06T10:59:06.785236118Z GET /api/users/agents 304 - - 0.292 ms
2026-05-06T10:59:07.910234136Z getBookingsQuery_moty2wl4: 141.287ms
2026-05-06T10:59:07.910762507Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 142.819 ms