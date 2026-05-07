2026-05-07T06:45:04.614020118Z Server running in production mode on port 10000
2026-05-07T06:45:04.614285198Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-07T06:45:09.914404135Z Error: Server selection timed out after 5000 ms
2026-05-07T06:45:37.968875017Z ==> Running 'npm run start'
2026-05-07T06:45:39.064277402Z 
2026-05-07T06:45:39.064317735Z > travel-crm-backend@1.0.0 start
2026-05-07T06:45:39.064323925Z > node dist/src/server.js
2026-05-07T06:45:39.064327405Z 
2026-05-07T06:45:46.461319305Z Server running in production mode on port 10000
2026-05-07T06:45:46.461587516Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-07T06:45:51.475579952Z Error: Server selection timed out after 5000 ms
2026-05-07T06:46:43.837987625Z ==> Running 'npm run start'
2026-05-07T06:46:44.954542229Z 
2026-05-07T06:46:44.954571481Z > travel-crm-backend@1.0.0 start
2026-05-07T06:46:44.954577812Z > node dist/src/server.js
2026-05-07T06:46:44.954581042Z 
2026-05-07T06:46:52.535408483Z Server running in production mode on port 10000
2026-05-07T06:46:52.535690304Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-07T06:46:53.994519667Z MongoDB Connected: ac-nvjnavm-shard-00-02.31xmkrx.mongodb.net
2026-05-07T06:46:53.997633663Z Synchronizing indexes in background...
2026-05-07T06:46:54.061266087Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-07T06:46:54.062330218Z 🚀 Startup tasks complete. System ready.
2026-05-07T06:46:56.501153239Z ✅ Index synchronization complete
2026-05-07T06:56:39.083462156Z ==> Deploying...
2026-05-07T06:56:39.202792337Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-07T06:57:23.03726891Z ==> Running 'npm run start'
2026-05-07T06:57:24.396435927Z 
2026-05-07T06:57:24.397047261Z > travel-crm-backend@1.0.0 start
2026-05-07T06:57:24.397056521Z > node dist/src/server.js
2026-05-07T06:57:24.397061302Z 
2026-05-07T06:57:31.330386855Z Server running in production mode on port 10000
2026-05-07T06:57:31.330675352Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-07T06:57:32.084525363Z MongoDB Connected: ac-nvjnavm-shard-00-01.31xmkrx.mongodb.net
2026-05-07T06:57:32.132517549Z Synchronizing indexes in background...
2026-05-07T06:57:32.153447887Z HEAD / 200 36 - 1.522 ms
2026-05-07T06:57:32.233094976Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-07T06:57:32.233925557Z 🚀 Startup tasks complete. System ready.
2026-05-07T06:57:33.083090501Z ✅ Index synchronization complete
2026-05-07T06:57:40.29746075Z ==> Your service is live 🎉
2026-05-07T06:57:40.367960496Z GET / 200 36 - 0.540 ms
2026-05-07T06:57:40.426596946Z ==> 
2026-05-07T06:57:40.435026296Z ==> ///////////////////////////////////////////////////////////
2026-05-07T06:57:40.441635494Z ==> 
2026-05-07T06:57:40.446207157Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-07T06:57:40.455082106Z ==> 
2026-05-07T06:57:40.460367715Z ==> ///////////////////////////////////////////////////////////
2026-05-07T06:59:56.744815766Z 🐌 SLOW REQUEST: GET /api/sync — 3494ms | Status: 200 | Heap: 34MB
2026-05-07T06:59:56.744846887Z GET /api/sync 200 - - 3485.793 ms
2026-05-07T06:59:57.148046246Z 🐌 SLOW REQUEST: GET /api/notifications — 3886ms | Status: 304 | Heap: 34MB
2026-05-07T06:59:57.148072806Z GET /api/notifications 304 - - 3885.934 ms
2026-05-07T07:04:45.050365957Z 🐌 SLOW REQUEST: GET /api/bookings?group=Ticketing&page=1&limit=15 — 1601ms | Status: 304 | Heap: 40MB
2026-05-07T07:04:46.346196861Z getBookingsQuery_mov55dc9: 64.108ms
2026-05-07T07:04:46.346571441Z GET /api/bookings?group=Package&page=1&limit=15 304 - - 64.862 ms
2026-05-07T07:04:49.548066544Z getBookingsQuery_mov55fra: 133.799ms
2026-05-07T07:04:49.549470498Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 200 - - 135.008 ms
2026-05-07T07:04:51.605085665Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-07T07:04:51.606000247Z GET /api/bookings?page=1&limit=15 304 - - 0.818 ms
2026-05-07T07:05:29.600788831Z GET /api/notifications 304 - - 25154.415 ms
2026-05-07T07:05:29.600863603Z 🐌 SLOW REQUEST: GET /api/notifications — 25155ms | Status: 304 | Heap: 40MB
2026-05-07T07:05:29.601219142Z getBookingsQuery_mov55i20: 37.209s
2026-05-07T07:05:29.602280477Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 — 37211ms | Status: 200 | Heap: 40MB
2026-05-07T07:05:29.602301608Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 200 - - 37209.598 ms
2026-05-07T07:05:50.164377117Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69eb50af8e47cc04dc29918d________1_15_
2026-05-07T07:05:50.280116523Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 0.974 ms
2026-05-07T07:05:50.280154284Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:05:50.280165754Z GET /api/notifications 304 - - 0.511 ms
2026-05-07T07:05:51.461199624Z getBookingsQuery_mov56rht: 179.468ms
2026-05-07T07:05:51.462695851Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 200 - - 180.517 ms
2026-05-07T07:05:54.336379227Z getBookingsQuery_mov56tk2: 380.911ms
2026-05-07T07:05:54.433164895Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69ae7ab0c8fbcb313fa0c744&page=2&limit=15 200 - - 476.386 ms
2026-05-07T07:05:55.076354961Z getBookingsQuery_mov56tkp: 1.099s
2026-05-07T07:05:55.077842867Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69ae7ab0c8fbcb313fa0c744&page=1&limit=15 — 1101ms | Status: 200 | Heap: 35MB
2026-05-07T07:05:55.07796584Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69ae7ab0c8fbcb313fa0c744&page=1&limit=15 200 - - 1100.055 ms
2026-05-07T07:06:10.732399904Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:06:10.732419575Z GET /api/notifications 304 - - 1.420 ms
2026-05-07T07:06:28.570687455Z getBookingsQuery_mov56u6c: 33.814s
2026-05-07T07:06:28.572025897Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 33815.151 ms
2026-05-07T07:06:28.572055648Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a2038787a5edc5143fb6&page=1&limit=15 — 33816ms | Status: 200 | Heap: 36MB
2026-05-07T07:06:36.592052364Z getBookingsQuery_mov56xm3: 37.381s
2026-05-07T07:06:36.593892408Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 — 37383ms | Status: 200 | Heap: 36MB
2026-05-07T07:06:36.594009641Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 37382.110 ms
2026-05-07T07:06:44.975505198Z 🐌 SLOW REQUEST: GET /api/notifications — 13679ms | Status: 304 | Heap: 36MB
2026-05-07T07:06:44.975505678Z GET /api/notifications 304 - - 13678.690 ms
2026-05-07T07:06:45.095070403Z getBookingsQuery_mov57u1i: 3.856s
2026-05-07T07:06:45.09661653Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 200 - - 3856.868 ms
2026-05-07T07:06:45.096644971Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 — 3858ms | Status: 200 | Heap: 36MB
2026-05-07T07:06:48.4504757Z getBookingsQuery_mov57zia: 127.26ms
2026-05-07T07:06:48.451767651Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=3&limit=15 200 - - 128.238 ms
2026-05-07T07:06:50.669880892Z getBookingsQuery_mov5817m: 138.702ms
2026-05-07T07:06:50.670494077Z GET /api/bookings?page=3&limit=15 304 - - 139.849 ms
2026-05-07T07:06:50.733737263Z getBookingsQuery_mov58195: 148.205ms
2026-05-07T07:06:50.734493541Z GET /api/bookings?page=1&limit=15 304 - - 149.247 ms
2026-05-07T07:06:52.643834852Z getBookingsQuery_mov582qw: 123.542ms
2026-05-07T07:06:52.645113643Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 200 - - 124.521 ms
2026-05-07T07:07:01.65244884Z getBookingsQuery_mov586x0: 3.728s
2026-05-07T07:07:01.653821323Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=3&limit=15 200 - - 3729.115 ms
2026-05-07T07:07:01.653839874Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=3&limit=15 — 3730ms | Status: 200 | Heap: 37MB
2026-05-07T07:07:05.232105433Z [CACHE HIT] settings_dropdowns
2026-05-07T07:07:05.232518143Z GET /api/settings/dropdowns 304 - - 0.650 ms
2026-05-07T07:07:05.272128807Z [GET] /api/bookings/69e8b1a5519a503fc23f590a
2026-05-07T07:07:05.528424407Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:07:05.528660223Z GET /api/notifications 304 - - 0.575 ms
2026-05-07T07:07:06.906126424Z getBookingById_69e8b1a5519a503fc23f590a: 1.636s
2026-05-07T07:07:06.907048136Z GET /api/bookings/69e8b1a5519a503fc23f590a 200 - - 1636.904 ms
2026-05-07T07:07:06.907084077Z 🐌 SLOW REQUEST: GET /api/bookings/69e8b1a5519a503fc23f590a — 1637ms | Status: 200 | Heap: 37MB
2026-05-07T07:07:09.657444196Z [CACHE HIT] users_agents
2026-05-07T07:07:09.657907977Z GET /api/users/agents 304 - - 0.835 ms
2026-05-07T07:07:11.434439995Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________3_15_
2026-05-07T07:07:11.434932887Z GET /api/bookings?page=3&limit=15 304 - - 0.794 ms
2026-05-07T07:07:11.487156816Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-07T07:07:11.487705019Z GET /api/bookings?page=1&limit=15 304 - - 0.872 ms
2026-05-07T07:07:11.501048381Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53915220e3d8fa652f131________1_15_
2026-05-07T07:07:11.501545213Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 0.711 ms
2026-05-07T07:07:35.642885469Z getBookingsQuery_mov58jdq: 21.564s
2026-05-07T07:07:35.644375585Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 21565.327 ms
2026-05-07T07:07:35.644387566Z 🐌 SLOW REQUEST: GET /api/bookings?myBookings=true&page=1&limit=15 — 21567ms | Status: 200 | Heap: 37MB
2026-05-07T07:07:35.647953962Z getBookingsQuery_mov58jd9: 21.586s
2026-05-07T07:07:35.648744341Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&myBookings=true&page=1&limit=15 — 21588ms | Status: 200 | Heap: 37MB
2026-05-07T07:07:35.648809022Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&myBookings=true&page=1&limit=15 200 - - 21587.010 ms
2026-05-07T07:07:39.073591585Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-07T07:07:39.074144768Z GET /api/bookings?page=1&limit=15 304 - - 0.936 ms
2026-05-07T07:07:39.216438866Z getBookingsQuery_mov592oe: 129.275ms
2026-05-07T07:07:39.217644435Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 130.257 ms
2026-05-07T07:07:41.38460675Z getBookingsQuery_mov594ci: 133.941ms
2026-05-07T07:07:41.385951292Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 200 - - 135.044 ms
2026-05-07T07:07:46.173178544Z getBookingsQuery_mov5981n: 129.771ms
2026-05-07T07:07:46.174412973Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=3&limit=15 200 - - 130.737 ms
2026-05-07T07:07:46.212526331Z GET /api/notifications 304 - - 62.586 ms
2026-05-07T07:07:52.16355713Z 🐌 SLOW REQUEST: GET /api/bookings/calendar?month=5&year=2026 — 2921ms | Status: 304 | Heap: 37MB
2026-05-07T07:07:52.163589331Z GET /api/bookings/calendar?month=5&year=2026 304 - - 2920.976 ms
2026-05-07T07:07:54.173725514Z GET /api/bookings/calendar?month=6&year=2026 304 - - 131.638 ms
2026-05-07T07:07:55.235572417Z GET /api/bookings/calendar?month=7&year=2026 304 - - 65.168 ms
2026-05-07T07:07:56.21026405Z GET /api/bookings/calendar?month=8&year=2026 304 - - 65.147 ms
2026-05-07T07:08:03.575986963Z 🐌 SLOW REQUEST: GET /api/bookings/calendar?month=9&year=2026 — 6480ms | Status: 304 | Heap: 38MB
2026-05-07T07:08:03.577280064Z GET /api/bookings/calendar?month=9&year=2026 304 - - 6479.829 ms
2026-05-07T07:08:20.805035972Z GET /api/bookings/calendar?month=4&year=2026 304 - - 10955.245 ms
2026-05-07T07:08:20.805072173Z 🐌 SLOW REQUEST: GET /api/bookings/calendar?month=4&year=2026 — 10955ms | Status: 304 | Heap: 38MB
2026-05-07T07:08:23.575781732Z GET /api/bookings/calendar?month=3&year=2026 304 - - 65.237 ms
2026-05-07T07:08:24.690598134Z GET /api/bookings/calendar?month=2&year=2026 304 - - 64.921 ms
2026-05-07T07:08:25.736628169Z GET /api/bookings/calendar?month=1&year=2026 304 - - 76.122 ms
2026-05-07T07:08:26.782911601Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:08:26.783194058Z GET /api/notifications 304 - - 0.521 ms
2026-05-07T07:08:29.580022607Z [CACHE HIT] settings_dropdowns
2026-05-07T07:08:29.581479962Z GET /api/settings/dropdowns 304 - - 0.700 ms
2026-05-07T07:08:29.638473614Z GET /api/users 200 - - 66.250 ms
2026-05-07T07:08:31.989363328Z GET /api/analytics/revenue-trends?interval=month&company= 304 - - 65.888 ms
2026-05-07T07:08:31.996248634Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company= 200 264 - 66.056 ms
2026-05-07T07:08:32.014899313Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 88.250 ms
2026-05-07T07:08:32.04926687Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 117.433 ms
2026-05-07T07:08:32.673745888Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company= 304 - - 236.625 ms
2026-05-07T07:08:48.720308893Z GET /api/notifications 304 - - 1411.715 ms
2026-05-07T07:08:48.720311513Z 🐌 SLOW REQUEST: GET /api/notifications — 1412ms | Status: 304 | Heap: 39MB
2026-05-07T07:09:06.465022946Z 🐌 SLOW REQUEST: GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords — 8147ms | Status: 200 | Heap: 39MB
2026-05-07T07:09:06.465045547Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords 200 43 - 8147.197 ms
2026-05-07T07:09:06.468540321Z 🐌 SLOW REQUEST: GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords — 8153ms | Status: 200 | Heap: 39MB
2026-05-07T07:09:06.468561622Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords 200 2 - 8152.633 ms
2026-05-07T07:09:06.480097299Z GET /api/analytics/revenue-trends?interval=month&company=Travowords 200 2 - 8169.182 ms
2026-05-07T07:09:06.480117099Z 🐌 SLOW REQUEST: GET /api/analytics/revenue-trends?interval=month&company=Travowords — 8169ms | Status: 200 | Heap: 39MB
2026-05-07T07:09:07.047006992Z 🐌 SLOW REQUEST: GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords — 8709ms | Status: 200 | Heap: 39MB
2026-05-07T07:09:07.047008842Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords 200 63 - 8708.747 ms
2026-05-07T07:09:07.048242092Z 🐌 SLOW REQUEST: GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords — 8729ms | Status: 200 | Heap: 39MB
2026-05-07T07:09:07.048272612Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company=Travowords 200 67 - 8728.544 ms
2026-05-07T07:09:09.264168769Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:09:09.264467066Z GET /api/notifications 304 - - 0.497 ms
2026-05-07T07:09:13.53188171Z GET /api/analytics/revenue-trends?interval=month&company=Travel+Window+Dubai 304 - - 74.103 ms
2026-05-07T07:09:13.555403016Z GET /api/analytics/agents?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 2 - 64.388 ms
2026-05-07T07:09:13.582696482Z GET /api/analytics/bookings?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 43 - 58.420 ms
2026-05-07T07:09:13.587983289Z GET /api/analytics/payment-breakdown?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 63 - 128.556 ms
2026-05-07T07:09:13.59718745Z GET /api/analytics/payments?fromDate=2026-04-07&toDate=2026-05-07&company=Travel+Window+Dubai 200 67 - 127.941 ms
2026-05-07T07:09:19.333902892Z [CACHE HIT] users_agents
2026-05-07T07:09:19.334383464Z GET /api/users/agents 304 - - 0.761 ms
2026-05-07T07:09:19.490528768Z getBookingsQuery_mov5b81v: 127.14ms
2026-05-07T07:09:19.491122292Z GET /api/bookings?page=1&limit=15 304 - - 128.132 ms
2026-05-07T07:09:20.650909206Z getBookingsQuery_mov5b8vn: 215.264ms
2026-05-07T07:09:20.651574762Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 216.361 ms
2026-05-07T07:09:26.685179752Z getBookingsQuery_mov5ba5g: 4.601s
2026-05-07T07:09:26.686015023Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 4601.550 ms
2026-05-07T07:09:26.686060864Z 🐌 SLOW REQUEST: GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 — 4602ms | Status: 304 | Heap: 40MB
2026-05-07T07:09:27.141944223Z getBookingsQuery_mov5b9py: 5.615s
2026-05-07T07:09:27.14267135Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=unassigned&page=1&limit=15 — 5616ms | Status: 304 | Heap: 40MB
2026-05-07T07:09:27.142689771Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 5615.861 ms
2026-05-07T07:09:28.199068645Z GET /api/bookings/calendar?month=5&year=2026 304 - - 5542.810 ms
2026-05-07T07:09:28.199122466Z 🐌 SLOW REQUEST: GET /api/bookings/calendar?month=5&year=2026 — 5543ms | Status: 304 | Heap: 40MB
2026-05-07T07:09:29.832181721Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:09:29.832198602Z GET /api/notifications 304 - - 0.616 ms
2026-05-07T07:09:33.933287139Z 🐌 SLOW REQUEST: POST /api/bookings — 1159ms | Status: 201 | Heap: 38MB
2026-05-07T07:09:33.933351321Z POST /api/bookings 201 - - 1155.285 ms
2026-05-07T07:09:34.606676555Z getBookingsQuery_mov5bjpn: 130.569ms
2026-05-07T07:09:34.608081118Z GET /api/bookings?page=1&limit=15 200 - - 131.778 ms
2026-05-07T07:09:35.857637602Z [CACHE HIT] settings_dropdowns
2026-05-07T07:09:35.85794477Z GET /api/settings/dropdowns 304 - - 0.647 ms
2026-05-07T07:09:35.861260909Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:09:58.28416881Z getBookingById_69fc3aad2982c4eb79cae053: 22.423s
2026-05-07T07:09:58.28580758Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 22423.526 ms
2026-05-07T07:09:58.28582821Z 🐌 SLOW REQUEST: GET /api/bookings/69fc3aad2982c4eb79cae053 — 22425ms | Status: 200 | Heap: 39MB
2026-05-07T07:10:14.570959036Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-07T07:10:14.571345885Z GET /api/bookings?page=1&limit=15 304 - - 0.959 ms
2026-05-07T07:10:17.352222258Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:10:17.352258409Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-07T07:10:19.399441357Z 🐌 SLOW REQUEST: GET /api/notifications — 29019ms | Status: 304 | Heap: 39MB
2026-05-07T07:10:19.399486758Z GET /api/notifications 304 - - 29018.840 ms
2026-05-07T07:10:19.636593422Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:10:19.715569609Z 🐌 SLOW REQUEST: PATCH /api/bookings/69fc3aad2982c4eb79cae053/status — 2367ms | Status: 200 | Heap: 38MB
2026-05-07T07:10:19.71560412Z PATCH /api/bookings/69fc3aad2982c4eb79cae053/status 200 944 - 2366.484 ms
2026-05-07T07:10:20.023036424Z PUT /api/bookings/69fc3aad2982c4eb79cae053 200 - - 17608.355 ms
2026-05-07T07:10:20.023046494Z 🐌 SLOW REQUEST: PUT /api/bookings/69fc3aad2982c4eb79cae053 — 17611ms | Status: 200 | Heap: 39MB
2026-05-07T07:10:20.290667211Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:10:20.491090585Z getBookingById_69fc3aad2982c4eb79cae053: 200.294ms
2026-05-07T07:10:20.492007407Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 201.446 ms
2026-05-07T07:10:25.740561174Z GET /api/users/agents 200 - - 69.387 ms
2026-05-07T07:10:26.30505576Z getBookingsQuery_mov5cnlj: 136.836ms
2026-05-07T07:10:26.309763283Z GET /api/bookings?page=1&limit=15 200 - - 138.091 ms
2026-05-07T07:10:26.8722233Z [CACHE HIT] users_agents
2026-05-07T07:10:26.872859796Z GET /api/users/agents 304 - - 0.988 ms
2026-05-07T07:10:32.670583186Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:10:32.726854277Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:10:32.740442534Z PATCH /api/bookings/69fc3aad2982c4eb79cae053/status 200 940 - 70.611 ms
2026-05-07T07:10:32.860414715Z PUT /api/bookings/69fc3aad2982c4eb79cae053 200 - - 196.018 ms
2026-05-07T07:10:33.773034628Z getBookingsQuery_mov5ct7l: 331.52ms
2026-05-07T07:10:33.77437784Z GET /api/bookings?page=1&limit=15 200 - - 332.532 ms
2026-05-07T07:10:39.98130713Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:10:39.981623038Z GET /api/notifications 304 - - 0.541 ms
2026-05-07T07:10:41.707124745Z [CACHE HIT] settings_dropdowns
2026-05-07T07:10:41.707529824Z GET /api/settings/dropdowns 304 - - 0.707 ms
2026-05-07T07:11:00.571908961Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:11:00.572283221Z GET /api/notifications 304 - - 0.761 ms
2026-05-07T07:11:14.094432606Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-07T07:11:14.094931629Z GET /api/bookings?page=1&limit=15 304 - - 0.904 ms
2026-05-07T07:11:21.221524222Z GET /api/notifications 304 - - 64.061 ms
2026-05-07T07:11:22.4926011Z POST /api/users/offline 200 16 - 67.290 ms
2026-05-07T07:11:24.038794349Z [CACHE HIT] settings_dropdowns
2026-05-07T07:11:24.038826719Z GET /api/settings/dropdowns 304 - - 0.684 ms
2026-05-07T07:11:24.046593576Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:11:24.065566851Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:11:24.065592792Z GET /api/notifications 304 - - 0.591 ms
2026-05-07T07:11:24.236168654Z getBookingById_69fc3aad2982c4eb79cae053: 190.418ms
2026-05-07T07:11:24.237844954Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 191.491 ms
2026-05-07T07:11:29.624536452Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:11:29.692372959Z PATCH /api/bookings/69fc3aad2982c4eb79cae053/status 200 946 - 70.823 ms
2026-05-07T07:11:30.478269604Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:11:30.675487165Z getBookingById_69fc3aad2982c4eb79cae053: 195.653ms
2026-05-07T07:11:30.678001335Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 197.169 ms
2026-05-07T07:11:44.605189154Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:11:44.605538493Z GET /api/notifications 304 - - 0.589 ms
2026-05-07T07:12:05.165728738Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:12:05.166134447Z GET /api/notifications 304 - - 0.654 ms
2026-05-07T07:12:32.78703456Z 🐌 SLOW REQUEST: GET /api/notifications — 7051ms | Status: 304 | Heap: 40MB
2026-05-07T07:12:32.787040261Z GET /api/notifications 304 - - 7050.318 ms
2026-05-07T07:12:42.96811046Z POST /api/bookings/69fc3aad2982c4eb79cae053/payments 201 307 - 134.794 ms
2026-05-07T07:12:43.528562982Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:12:43.723887434Z getBookingById_69fc3aad2982c4eb79cae053: 195.217ms
2026-05-07T07:12:43.725374159Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 196.426 ms
2026-05-07T07:12:51.300480464Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fc3aad2982c4eb79cae053/payments/69fc3b6a2982c4eb79cae09a — 4026ms | Status: 200 | Heap: 41MB
2026-05-07T07:12:51.300615527Z DELETE /api/bookings/69fc3aad2982c4eb79cae053/payments/69fc3b6a2982c4eb79cae09a 200 42 - 4025.382 ms
2026-05-07T07:12:51.848350024Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:12:52.054454613Z getBookingById_69fc3aad2982c4eb79cae053: 204.3ms
2026-05-07T07:12:52.057903506Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 205.472 ms
2026-05-07T07:12:53.35083141Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:12:53.352758056Z GET /api/notifications 304 - - 0.772 ms
2026-05-07T07:12:56.258998051Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:12:58.273688919Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T07:12:58.275617635Z PATCH /api/bookings/69fc3aad2982c4eb79cae053/status 200 943 - 2017.103 ms
2026-05-07T07:12:58.275635126Z 🐌 SLOW REQUEST: PATCH /api/bookings/69fc3aad2982c4eb79cae053/status — 2018ms | Status: 200 | Heap: 41MB
2026-05-07T07:13:06.318461005Z [PASSENGER PERF] Add Passengers - Total: 10072ms | DB: 8042ms | Count: 2
2026-05-07T07:13:06.319104251Z 🐌 SLOW REQUEST: POST /api/bookings/69fc3aad2982c4eb79cae053/passengers — 10073ms | Status: 201 | Heap: 41MB
2026-05-07T07:13:06.319115861Z POST /api/bookings/69fc3aad2982c4eb79cae053/passengers 201 967 - 10073.223 ms
2026-05-07T07:13:06.320859483Z 🐌 SLOW REQUEST: POST /api/bookings/69fc3aad2982c4eb79cae053/payments — 10083ms | Status: 201 | Heap: 41MB
2026-05-07T07:13:06.320889944Z POST /api/bookings/69fc3aad2982c4eb79cae053/payments 201 307 - 10082.779 ms
2026-05-07T07:13:13.91942961Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:13:13.919457801Z GET /api/notifications 304 - - 0.741 ms
2026-05-07T07:13:27.37301311Z 🐌 SLOW REQUEST: PUT /api/bookings/69fc3aad2982c4eb79cae053 — 31117ms | Status: 200 | Heap: 41MB
2026-05-07T07:13:27.373058891Z PUT /api/bookings/69fc3aad2982c4eb79cae053 200 - - 31113.523 ms
2026-05-07T07:13:27.942955413Z [CACHE HIT] settings_dropdowns
2026-05-07T07:13:27.94325851Z GET /api/settings/dropdowns 304 - - 0.798 ms
2026-05-07T07:13:28.442837627Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:13:28.638063774Z getBookingById_69fc3aad2982c4eb79cae053: 193.402ms
2026-05-07T07:13:28.638105695Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 194.545 ms
2026-05-07T07:13:32.653469968Z PATCH /api/bookings/69fc3aad2982c4eb79cae053/verify 200 121 - 134.408 ms
2026-05-07T07:13:32.989033005Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:13:33.182315725Z getBookingById_69fc3aad2982c4eb79cae053: 194.244ms
2026-05-07T07:13:33.18379422Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 195.662 ms
2026-05-07T07:13:34.538423828Z GET /api/notifications 304 - - 66.075 ms
2026-05-07T07:13:35.104123568Z PATCH /api/bookings/69fc3aad2982c4eb79cae053/verify 200 88 - 141.476 ms
2026-05-07T07:13:35.673409113Z [GET] /api/bookings/69fc3aad2982c4eb79cae053
2026-05-07T07:13:35.900993765Z getBookingById_69fc3aad2982c4eb79cae053: 218.983ms
2026-05-07T07:13:35.901011835Z GET /api/bookings/69fc3aad2982c4eb79cae053 200 - - 223.840 ms
2026-05-07T07:13:38.92310921Z GET /api/users/agents 200 - - 68.720 ms
2026-05-07T07:13:38.968509147Z getBookingsQuery_mov5gs99: 138.776ms
2026-05-07T07:13:38.969627414Z GET /api/bookings?page=1&limit=15 200 - - 139.678 ms
2026-05-07T07:13:40.677619823Z [CACHE HIT] users_agents
2026-05-07T07:13:40.678067573Z GET /api/users/agents 304 - - 0.724 ms
2026-05-07T07:13:47.713251676Z 🐌 SLOW REQUEST: DELETE /api/bookings/69fc3aad2982c4eb79cae053 — 4454ms | Status: 200 | Heap: 42MB
2026-05-07T07:13:47.713263727Z DELETE /api/bookings/69fc3aad2982c4eb79cae053 200 85 - 4452.920 ms
2026-05-07T07:13:47.815475444Z [BG] Cleanup complete for booking 69fc3aad2982c4eb79cae053
2026-05-07T07:13:47.815502535Z [BG] deleteBooking_cleanup_69fc3aad2982c4eb79cae053: 101.989ms
2026-05-07T07:13:48.980376253Z getBookingsQuery_mov5gzj3: 724.526ms
2026-05-07T07:13:48.981754366Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 726ms | Status: 200 | Heap: 42MB
2026-05-07T07:13:49.003909236Z GET /api/bookings?page=1&limit=15 200 - - 725.559 ms
2026-05-07T07:13:55.245811807Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T07:13:55.246199346Z GET /api/notifications 304 - - 0.693 ms