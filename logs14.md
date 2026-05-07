2026-05-07T06:06:33.163434648Z ==> Deploying...
2026-05-07T06:06:33.248735854Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-07T06:06:49.34512576Z > node dist/src/server.js
2026-05-07T06:06:49.345128351Z 
2026-05-07T06:06:56.330840631Z Server running in production mode on port 10000
2026-05-07T06:06:56.331054418Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-07T06:06:57.026972245Z HEAD / 200 36 - 1.860 ms
2026-05-07T06:06:57.588815664Z MongoDB Connected: ac-nvjnavm-shard-00-01.31xmkrx.mongodb.net
2026-05-07T06:06:57.624105734Z Synchronizing indexes in background...
2026-05-07T06:06:57.695263733Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-07T06:06:57.696379411Z 🚀 Startup tasks complete. System ready.
2026-05-07T06:06:59.967798335Z ✅ Index synchronization complete
2026-05-07T06:07:04.172103297Z ==> Your service is live 🎉
2026-05-07T06:07:04.29993217Z GET / 200 36 - 0.562 ms
2026-05-07T06:07:04.359454467Z ==> 
2026-05-07T06:07:04.365293348Z ==> ///////////////////////////////////////////////////////////
2026-05-07T06:07:04.367914337Z ==> 
2026-05-07T06:07:04.373067752Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-07T06:07:04.375323753Z ==> 
2026-05-07T06:07:04.379742622Z ==> ///////////////////////////////////////////////////////////
2026-05-07T06:07:12.868671644Z 🐌 SLOW REQUEST: GET /api/notifications — 2271ms | Status: 304 | Heap: 35MB
2026-05-07T06:07:12.868732706Z GET /api/notifications 304 - - 2270.620 ms
2026-05-07T06:07:15.641288225Z 🐌 SLOW REQUEST: GET /api/sync — 4614ms | Status: 200 | Heap: 35MB
2026-05-07T06:07:15.641318256Z GET /api/sync 200 - - 4605.301 ms
2026-05-07T06:07:26.777043082Z 🐌 SLOW REQUEST: GET /api/users/agents — 2775ms | Status: 200 | Heap: 36MB
2026-05-07T06:07:26.777260109Z GET /api/users/agents 200 - - 2770.112 ms
2026-05-07T06:07:26.785308993Z 🐌 SLOW REQUEST: GET /api/settings/dropdowns — 2328ms | Status: 304 | Heap: 36MB
2026-05-07T06:07:26.785335394Z GET /api/settings/dropdowns 304 - - 2327.521 ms
2026-05-07T06:07:26.843783281Z getBookingsQuery_mov33l91: 2.854s
2026-05-07T06:07:26.845574442Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 2857ms | Status: 200 | Heap: 36MB
2026-05-07T06:07:26.845635344Z GET /api/bookings?page=1&limit=15 200 - - 2855.969 ms
2026-05-07T06:07:33.42208813Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:07:33.422419891Z GET /api/notifications 304 - - 0.647 ms
2026-05-07T06:07:34.725311109Z getBookingsQuery_mov33tfd: 139.746ms
2026-05-07T06:07:34.72681653Z GET /api/bookings?page=6&limit=15 200 - - 140.891 ms
2026-05-07T06:07:38.529302741Z getBookingsQuery_mov33wd5: 135.586ms
2026-05-07T06:07:38.530764011Z GET /api/bookings?page=8&limit=15 200 - - 136.714 ms
2026-05-07T06:07:45.257514931Z getBookingsQuery_mov341k3: 133.989ms
2026-05-07T06:07:45.258916369Z GET /api/bookings?page=34&limit=15 200 - - 135.049 ms
2026-05-07T06:07:48.138263865Z [GET] /api/bookings/69ce1bb512d6ce0419001a9a
2026-05-07T06:07:53.995631305Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:07:53.995998217Z GET /api/notifications 304 - - 0.796 ms
2026-05-07T06:07:54.63605961Z getBookingById_69ce1bb512d6ce0419001a9a: 6.498s
2026-05-07T06:07:54.637365655Z 🐌 SLOW REQUEST: GET /api/bookings/69ce1bb512d6ce0419001a9a — 6501ms | Status: 200 | Heap: 37MB
2026-05-07T06:07:54.637591492Z GET /api/bookings/69ce1bb512d6ce0419001a9a 200 - - 6499.486 ms
2026-05-07T06:13:42.476330895Z GET /api/bookings?group=Operation&page=1&limit=15 304 - - 1369.732 ms
2026-05-07T06:13:46.341932096Z getBookingsQuery_mov3bq60: 2.734s
2026-05-07T06:13:46.34233634Z 🐌 SLOW REQUEST: GET /api/bookings?group=Account&page=1&limit=15 — 2735ms | Status: 304 | Heap: 37MB
2026-05-07T06:13:46.342361921Z GET /api/bookings?group=Account&page=1&limit=15 304 - - 2734.552 ms
2026-05-07T06:13:48.333514651Z getBookingsQuery_mov3btl9: 288.281ms
2026-05-07T06:13:48.334024718Z GET /api/bookings?status=Interested&group=Account&page=1&limit=15 200 99 - 289.177 ms
2026-05-07T06:13:49.778570423Z getBookingsQuery_mov3buvh: 68.75ms
2026-05-07T06:13:49.778919195Z GET /api/bookings?status=Interested%2CNot+Interested&group=Account&page=1&limit=15 200 99 - 69.477 ms
2026-05-07T06:13:51.603386399Z getBookingsQuery_mov3bw7y: 149.139ms
2026-05-07T06:13:51.604717654Z GET /api/bookings?status=Interested%2CNot+Interested&page=1&limit=15 200 - - 150.054 ms
2026-05-07T06:14:31.907775759Z 🐌 SLOW REQUEST: GET /api/notifications — 30588ms | Status: 304 | Heap: 38MB
2026-05-07T06:14:31.907800389Z GET /api/notifications 304 - - 30588.102 ms
2026-05-07T06:14:33.001683446Z getBookingsQuery_mov3by6y: 38.991s
2026-05-07T06:14:33.003248119Z 🐌 SLOW REQUEST: GET /api/bookings?status=Interested&page=1&limit=15 — 38993ms | Status: 200 | Heap: 37MB
2026-05-07T06:14:33.003286211Z GET /api/bookings?status=Interested&page=1&limit=15 200 - - 38991.844 ms
2026-05-07T06:14:41.036369973Z getBookingsQuery_mov3cydc: 139.424ms
2026-05-07T06:14:41.036911462Z GET /api/bookings?page=1&limit=15 304 - - 140.514 ms
2026-05-07T06:14:42.98048026Z getBookingsQuery_mov3czve: 138.05ms
2026-05-07T06:14:42.980912354Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 138.906 ms
2026-05-07T06:14:46.864069466Z getBookingsQuery_mov3d2aj: 884.41ms
2026-05-07T06:14:46.865257286Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 200 - - 885.328 ms
2026-05-07T06:14:46.865258316Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 — 887ms | Status: 200 | Heap: 38MB
2026-05-07T06:14:51.545998641Z getBookingsQuery_mov3d6hb: 138.156ms
2026-05-07T06:14:51.547352547Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 139.290 ms
2026-05-07T06:14:52.45309573Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:14:52.453423471Z GET /api/notifications 304 - - 0.570 ms
2026-05-07T06:15:05.60893239Z getBookingsQuery_mov3d9a0: 10.576s
2026-05-07T06:15:05.610342408Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 — 10578ms | Status: 200 | Heap: 38MB
2026-05-07T06:15:05.610376759Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 200 - - 10576.834 ms
2026-05-07T06:15:08.922102142Z [CACHE HIT] settings_dropdowns
2026-05-07T06:15:08.922491205Z GET /api/settings/dropdowns 304 - - 0.708 ms
2026-05-07T06:15:08.926390347Z [GET] /api/bookings/69dceb75519a503fc23f13e6
2026-05-07T06:15:13.011277566Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:15:13.011640618Z GET /api/notifications 304 - - 0.603 ms
2026-05-07T06:15:26.171376056Z getBookingById_69dceb75519a503fc23f13e6: 17.245s
2026-05-07T06:15:26.172439972Z 🐌 SLOW REQUEST: GET /api/bookings/69dceb75519a503fc23f13e6 — 17247ms | Status: 200 | Heap: 38MB
2026-05-07T06:15:26.172488263Z GET /api/bookings/69dceb75519a503fc23f13e6 200 - - 17245.711 ms
2026-05-07T06:15:32.717027145Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c2a2038787a5edc5143fb6________2_15_
2026-05-07T06:15:32.717662036Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 304 - - 0.931 ms
2026-05-07T06:15:32.723271486Z [CACHE HIT] users_agents
2026-05-07T06:15:32.723843856Z GET /api/users/agents 304 - - 0.583 ms
2026-05-07T06:15:33.647201417Z GET /api/notifications 304 - - 69.825 ms
2026-05-07T06:15:35.815269315Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15_
2026-05-07T06:15:35.815931228Z GET /api/bookings?page=1&limit=15 304 - - 0.954 ms
2026-05-07T06:15:35.816779447Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c2a2038787a5edc5143fb6________1_15_
2026-05-07T06:15:35.817300674Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 304 - - 0.683 ms
2026-05-07T06:15:35.942831474Z getBookingsQuery_mov3e4qj: 139.181ms
2026-05-07T06:15:35.943745255Z GET /api/bookings?page=2&limit=15 304 - - 140.342 ms
2026-05-07T06:15:36.601025848Z getBookingsQuery_mov3e58s: 139.27ms
2026-05-07T06:15:36.602437176Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69ae7ab0c8fbcb313fa0c744&page=1&limit=15 200 - - 140.507 ms
2026-05-07T06:15:36.977391059Z getBookingsQuery_mov3e5l8: 68.709ms
2026-05-07T06:15:36.977740481Z GET /api/bookings?assignedTo=69ae7ab0c8fbcb313fa0c744&page=1&limit=15 304 - - 69.460 ms
2026-05-07T06:15:39.011689868Z getBookingsQuery_mov3e73s: 139.337ms
2026-05-07T06:15:39.013074085Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 200 - - 140.457 ms
2026-05-07T06:15:44.443150861Z getBookingsQuery_mov3eamc: 1.015s
2026-05-07T06:15:44.446188094Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=4&limit=15 — 1019ms | Status: 200 | Heap: 39MB
2026-05-07T06:15:44.446914099Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=4&limit=15 200 - - 1017.750 ms
2026-05-07T06:15:46.861120649Z [GET] /api/bookings/69e36d36519a503fc23f3bdc
2026-05-07T06:15:46.999733333Z getBookingById_69e36d36519a503fc23f3bdc: 138.412ms
2026-05-07T06:15:47.000637503Z GET /api/bookings/69e36d36519a503fc23f3bdc 200 - - 139.567 ms
2026-05-07T06:15:54.205315197Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:15:54.205672989Z GET /api/notifications 304 - - 0.589 ms
2026-05-07T06:16:17.070601805Z getBookingsQuery_mov3ehfm: 24.812s
2026-05-07T06:16:17.072302362Z getBookingsQuery_mov3ehg5: 24.795s
2026-05-07T06:16:17.073100959Z 🐌 SLOW REQUEST: GET /api/bookings?page=1&limit=15 — 24795ms | Status: 304 | Heap: 40MB
2026-05-07T06:16:17.073320557Z GET /api/bookings?page=1&limit=15 304 - - 24795.568 ms
2026-05-07T06:16:17.07370724Z 🐌 SLOW REQUEST: GET /api/bookings?page=4&limit=15 — 24816ms | Status: 200 | Heap: 40MB
2026-05-07T06:16:17.073733561Z GET /api/bookings?page=4&limit=15 200 - - 24813.567 ms
2026-05-07T06:16:17.105899512Z getBookingsQuery_mov3eilk: 23.336s
2026-05-07T06:16:17.107366482Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 200 - - 23337.570 ms
2026-05-07T06:16:17.107378293Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 — 23339ms | Status: 200 | Heap: 39MB
2026-05-07T06:16:35.224761896Z GET /api/notifications 304 - - 69.098 ms
2026-05-07T06:16:37.741962923Z getBookingsQuery_mov3fgf7: 136.57ms
2026-05-07T06:16:37.741979734Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 200 - - 137.689 ms
2026-05-07T06:16:41.295483067Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69eb50af8e47cc04dc29918d________1_15_
2026-05-07T06:16:41.298638404Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 0.997 ms
2026-05-07T06:16:57.277605661Z getBookingsQuery_mov3fix4: 16.437s
2026-05-07T06:16:57.279054201Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 200 - - 16437.801 ms
2026-05-07T06:16:57.279059221Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 — 16438ms | Status: 200 | Heap: 40MB
2026-05-07T06:16:57.283388248Z getBookingsQuery_mov3fixk: 16.427s
2026-05-07T06:16:57.284759114Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=2&limit=15 200 - - 16428.010 ms
2026-05-07T06:16:57.284761084Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=2&limit=15 — 16429ms | Status: 200 | Heap: 40MB
2026-05-07T06:16:58.511322036Z getBookingsQuery_mov3fjqn: 16.607s
2026-05-07T06:16:58.513112537Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 200 - - 16608.226 ms
2026-05-07T06:16:58.513146848Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 — 16609ms | Status: 200 | Heap: 40MB
2026-05-07T06:17:06.059763555Z getBookingsQuery_mov3g29p: 141.697ms
2026-05-07T06:17:06.061102171Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=5&limit=15 200 - - 143.059 ms
2026-05-07T06:17:08.455931967Z [GET] /api/bookings/69c2a2988787a5edc514402a
2026-05-07T06:17:08.470323666Z [CACHE HIT] settings_dropdowns
2026-05-07T06:17:08.470405458Z GET /api/settings/dropdowns 304 - - 0.733 ms
2026-05-07T06:17:08.597291794Z getBookingById_69c2a2988787a5edc514402a: 143.188ms
2026-05-07T06:17:08.598147813Z GET /api/bookings/69c2a2988787a5edc514402a 200 - - 144.323 ms
2026-05-07T06:17:10.74868278Z [CACHE HIT] users_agents
2026-05-07T06:17:10.748719351Z GET /api/users/agents 304 - - 0.862 ms
2026-05-07T06:17:11.809020602Z [GET] /api/bookings/69cb524ebe322c9f36033baa
2026-05-07T06:17:11.949171618Z getBookingById_69cb524ebe322c9f36033baa: 139.972ms
2026-05-07T06:17:11.950215363Z GET /api/bookings/69cb524ebe322c9f36033baa 200 - - 141.135 ms
2026-05-07T06:17:15.780944516Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:17:15.781444993Z GET /api/notifications 304 - - 0.739 ms
2026-05-07T06:17:17.147638054Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c2a1b98787a5edc5143f9d________1_15_
2026-05-07T06:17:17.147669935Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 1.021 ms
2026-05-07T06:17:17.337222157Z getBookingsQuery_mov3gawg: 231.988ms
2026-05-07T06:17:17.338968626Z GET /api/bookings?page=5&limit=15 200 - - 233.092 ms
2026-05-07T06:17:17.342354751Z getBookingsQuery_mov3gaxm: 195.434ms
2026-05-07T06:17:17.343057445Z GET /api/bookings?page=1&limit=15 304 - - 196.381 ms
2026-05-07T06:17:18.395089185Z getBookingsQuery_mov3gbsk: 134.246ms
2026-05-07T06:17:18.39641398Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 200 - - 135.245 ms
2026-05-07T06:17:40.871386478Z getBookingsQuery_mov3gfuq: 17.349s
2026-05-07T06:17:40.873139728Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=7&limit=15 — 17350ms | Status: 200 | Heap: 36MB
2026-05-07T06:17:40.873168429Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=7&limit=15 200 - - 17349.722 ms
2026-05-07T06:17:44.569832974Z [GET] /api/bookings/69d0b26b519a503fc23eba2f
2026-05-07T06:17:45.985005858Z getBookingById_69d0b26b519a503fc23eba2f: 1.415s
2026-05-07T06:17:45.985914529Z 🐌 SLOW REQUEST: GET /api/bookings/69d0b26b519a503fc23eba2f — 1417ms | Status: 200 | Heap: 36MB
2026-05-07T06:17:45.98595366Z GET /api/bookings/69d0b26b519a503fc23eba2f 200 - - 1416.205 ms
2026-05-07T06:17:56.422039008Z GET /api/notifications 304 - - 69.788 ms
2026-05-07T06:17:59.672924497Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c537cb220e3d8fa652f0f2________1_15_
2026-05-07T06:17:59.673221057Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 0.765 ms
2026-05-07T06:17:59.794379139Z getBookingsQuery_mov3h7qg: 137.815ms
2026-05-07T06:17:59.795742685Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108&page=7&limit=15 200 - - 138.904 ms
2026-05-07T06:17:59.804008646Z getBookingsQuery_mov3h7qt: 134.232ms
2026-05-07T06:17:59.805356911Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108&page=1&limit=15 200 - - 135.042 ms
2026-05-07T06:18:02.727045489Z getBookingsQuery_mov3h9g7: 846.858ms
2026-05-07T06:18:02.728509899Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 — 849ms | Status: 200 | Heap: 36MB
2026-05-07T06:18:02.72855515Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 200 - - 847.919 ms
2026-05-07T06:18:11.34612927Z getBookingsQuery_mov3he5x: 3.357s
2026-05-07T06:18:11.347398603Z 🐌 SLOW REQUEST: GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=4&limit=15 — 3359ms | Status: 200 | Heap: 36MB
2026-05-07T06:18:11.347436325Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=4&limit=15 200 - - 3358.007 ms
2026-05-07T06:18:16.390613786Z [CACHE HIT] settings_dropdowns
2026-05-07T06:18:16.390971579Z GET /api/settings/dropdowns 304 - - 0.629 ms
2026-05-07T06:18:16.400512022Z [GET] /api/bookings/69d3439e519a503fc23ebfe0
2026-05-07T06:18:16.972146801Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:18:16.97240384Z GET /api/notifications 304 - - 0.517 ms
2026-05-07T06:18:31.280830654Z getBookingById_69d3439e519a503fc23ebfe0: 14.880s
2026-05-07T06:18:31.283699961Z 🐌 SLOW REQUEST: GET /api/bookings/69d3439e519a503fc23ebfe0 — 14884ms | Status: 200 | Heap: 36MB
2026-05-07T06:18:31.284297461Z GET /api/bookings/69d3439e519a503fc23ebfe0 200 - - 14881.161 ms
2026-05-07T06:18:33.978923045Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53849220e3d8fa652f108________4_15_
2026-05-07T06:18:33.979405682Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=4&limit=15 304 - - 0.804 ms
2026-05-07T06:18:34.058231657Z GET /api/users/agents 200 - - 70.081 ms
2026-05-07T06:18:37.289396679Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53849220e3d8fa652f108________1_15_
2026-05-07T06:18:37.289908406Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 0.807 ms
2026-05-07T06:18:37.398734959Z getBookingsQuery_mov3i0r2: 136.466ms
2026-05-07T06:18:37.399359351Z GET /api/bookings?page=4&limit=15 304 - - 137.395 ms
2026-05-07T06:18:37.425423255Z getBookingsQuery_mov3i0ru: 134.567ms
2026-05-07T06:18:37.426042626Z GET /api/bookings?page=1&limit=15 304 - - 135.430 ms
2026-05-07T06:18:37.542406545Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:18:37.542732836Z GET /api/notifications 304 - - 0.610 ms
2026-05-07T06:18:51.083579457Z 🐌 SLOW REQUEST: POST /api/bookings — 1765ms | Status: 201 | Heap: 40MB
2026-05-07T06:18:51.083639159Z POST /api/bookings 201 - - 1762.620 ms
2026-05-07T06:18:51.766806593Z getBookingsQuery_mov3ibu8: 133.98ms
2026-05-07T06:18:51.768015384Z GET /api/bookings?page=1&limit=15 200 - - 134.938 ms
2026-05-07T06:18:54.493334331Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:19:08.226928158Z getBookingById_69fc2eca94f2831de11034b0: 13.735s
2026-05-07T06:19:08.227865659Z 🐌 SLOW REQUEST: GET /api/bookings/69fc2eca94f2831de11034b0 — 13737ms | Status: 200 | Heap: 40MB
2026-05-07T06:19:08.22789242Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 13736.273 ms
2026-05-07T06:19:15.756485994Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:19:15.756513525Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-07T06:19:15.90075603Z PUT /api/bookings/69fc2eca94f2831de11034b0 200 - - 214.422 ms
2026-05-07T06:19:16.173583799Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:19:16.369623192Z getBookingById_69fc2eca94f2831de11034b0: 196.256ms
2026-05-07T06:19:16.370648657Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 197.409 ms
2026-05-07T06:19:18.156761761Z GET /api/notifications 304 - - 63.027 ms
2026-05-07T06:19:18.791239343Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:19:18.856843729Z PATCH /api/bookings/69fc2eca94f2831de11034b0/status 200 912 - 67.267 ms
2026-05-07T06:19:19.132511964Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:19:19.324599443Z getBookingById_69fc2eca94f2831de11034b0: 191.948ms
2026-05-07T06:19:19.325509814Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 192.991 ms
2026-05-07T06:19:23.371050896Z [CACHE HIT] settings_dropdowns
2026-05-07T06:19:23.371381587Z GET /api/settings/dropdowns 304 - - 0.566 ms
2026-05-07T06:19:38.711851713Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:19:38.712123632Z GET /api/notifications 304 - - 0.526 ms
2026-05-07T06:19:59.30604105Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:19:59.306286828Z GET /api/notifications 304 - - 0.533 ms
2026-05-07T06:20:12.682681138Z POST /api/bookings/69fc2eca94f2831de11034b0/payments 201 307 - 5808.915 ms
2026-05-07T06:20:12.682681508Z 🐌 SLOW REQUEST: POST /api/bookings/69fc2eca94f2831de11034b0/payments — 5809ms | Status: 201 | Heap: 41MB
2026-05-07T06:20:13.231719941Z [CACHE HIT] booking_69fc2eca94f2831de11034b0
2026-05-07T06:20:13.232125195Z GET /api/bookings/69fc2eca94f2831de11034b0 304 - - 0.735 ms
2026-05-07T06:21:00.809196592Z 🐌 SLOW REQUEST: GET /api/notifications — 40960ms | Status: 304 | Heap: 41MB
2026-05-07T06:21:00.809232063Z GET /api/notifications 304 - - 40959.737 ms
2026-05-07T06:21:15.738598203Z POST /api/bookings/69fc2eca94f2831de11034b0/payments 201 307 - 50112.662 ms
2026-05-07T06:21:15.738642745Z 🐌 SLOW REQUEST: POST /api/bookings/69fc2eca94f2831de11034b0/payments — 50114ms | Status: 201 | Heap: 41MB
2026-05-07T06:21:16.293970842Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:21:16.491385272Z getBookingById_69fc2eca94f2831de11034b0: 197.239ms
2026-05-07T06:21:16.492421537Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 198.389 ms
2026-05-07T06:21:21.360469422Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:21:21.360811644Z GET /api/notifications 304 - - 0.737 ms
2026-05-07T06:21:25.577152731Z DELETE /api/bookings/69fc2eca94f2831de11034b0/payments/69fc2f1b94f2831de11034da 200 42 - 193.195 ms
2026-05-07T06:21:26.11544511Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:21:26.311576486Z getBookingById_69fc2eca94f2831de11034b0: 195.966ms
2026-05-07T06:21:26.312662923Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 196.990 ms
2026-05-07T06:21:29.117685222Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:21:30.459865584Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:21:31.466613362Z 🐌 SLOW REQUEST: PATCH /api/bookings/69fc2eca94f2831de11034b0/status — 2350ms | Status: 200 | Heap: 42MB
2026-05-07T06:21:31.466647843Z PATCH /api/bookings/69fc2eca94f2831de11034b0/status 200 911 - 2350.028 ms
2026-05-07T06:21:32.137910855Z [PASSENGER PERF] Add Passengers - Total: 3002ms | DB: 2038ms | Count: 2
2026-05-07T06:21:32.138589738Z 🐌 SLOW REQUEST: POST /api/bookings/69fc2eca94f2831de11034b0/passengers — 3003ms | Status: 201 | Heap: 42MB
2026-05-07T06:21:32.138624509Z POST /api/bookings/69fc2eca94f2831de11034b0/passengers 201 967 - 3003.052 ms
2026-05-07T06:21:33.320248823Z PUT /api/bookings/69fc2eca94f2831de11034b0 200 - - 4207.196 ms
2026-05-07T06:21:33.320258653Z 🐌 SLOW REQUEST: PUT /api/bookings/69fc2eca94f2831de11034b0 — 4209ms | Status: 200 | Heap: 42MB
2026-05-07T06:21:33.599054185Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:21:33.79603688Z getBookingById_69fc2eca94f2831de11034b0: 197.54ms
2026-05-07T06:21:33.797281222Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 198.651 ms
2026-05-07T06:21:33.879018167Z [CACHE HIT] settings_dropdowns
2026-05-07T06:21:33.87941746Z GET /api/settings/dropdowns 304 - - 0.700 ms
2026-05-07T06:21:36.032423761Z PATCH /api/bookings/69fc2eca94f2831de11034b0/verify 200 121 - 131.019 ms
2026-05-07T06:21:36.573830046Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:21:36.775176789Z getBookingById_69fc2eca94f2831de11034b0: 202.073ms
2026-05-07T06:21:36.776245085Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 203.227 ms
2026-05-07T06:21:38.604579137Z PATCH /api/bookings/69fc2eca94f2831de11034b0/verify 200 88 - 128.166 ms
2026-05-07T06:21:38.879608651Z [CACHE HIT] booking_69fc2eca94f2831de11034b0
2026-05-07T06:21:38.879651043Z GET /api/bookings/69fc2eca94f2831de11034b0 304 - - 1.076 ms
2026-05-07T06:21:41.908052544Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-07T06:21:41.908325063Z GET /api/notifications 304 - - 0.561 ms
2026-05-07T06:21:45.599589241Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:21:59.450001913Z 🐌 SLOW REQUEST: PATCH /api/bookings/69fc2eca94f2831de11034b0/status — 13851ms | Status: 200 | Heap: 43MB
2026-05-07T06:21:59.450049755Z PATCH /api/bookings/69fc2eca94f2831de11034b0/status 200 1006 - 13851.320 ms
2026-05-07T06:22:00.088002017Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:22:10.404958229Z GET /api/bookings/69fc2eca94f2831de11034b0 - - - - ms
2026-05-07T06:22:11.536059198Z getBookingById_69fc2eca94f2831de11034b0: 11.448s
2026-05-07T06:22:11.536931248Z [DEDUPLICATED] Request for booking 69fc2eca94f2831de11034b0 served from in-flight promise
2026-05-07T06:22:11.540765538Z 🐌 SLOW REQUEST: GET /api/bookings/69fc2eca94f2831de11034b0 — 826ms | Status: 200 | Heap: 43MB
2026-05-07T06:22:11.540792368Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 822.581 ms
2026-05-07T06:22:13.668196392Z [PASSENGER PERF] Update Passengers - Total: 210ms | DB (Del+Ins): 146ms | Count: 2
2026-05-07T06:22:13.668856134Z PUT /api/bookings/69fc2eca94f2831de11034b0/passengers 200 973 - 210.495 ms
2026-05-07T06:22:13.73030825Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:22:13.802629145Z PATCH /api/bookings/69fc2eca94f2831de11034b0/status 200 1005 - 73.606 ms
2026-05-07T06:22:14.136293999Z (node:83) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
2026-05-07T06:22:14.281102614Z PUT /api/bookings/69fc2eca94f2831de11034b0 200 - - 212.845 ms
2026-05-07T06:22:14.594902504Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:22:14.798137952Z getBookingById_69fc2eca94f2831de11034b0: 202.176ms
2026-05-07T06:22:14.798906178Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 203.635 ms
2026-05-07T06:22:16.73770255Z PATCH /api/bookings/69fc2eca94f2831de11034b0/verify 200 121 - 129.476 ms
2026-05-07T06:22:17.057934248Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:22:17.247782012Z getBookingById_69fc2eca94f2831de11034b0: 189.687ms
2026-05-07T06:22:17.249048975Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 191.025 ms
2026-05-07T06:22:19.356390147Z PATCH /api/bookings/69fc2eca94f2831de11034b0/verify 200 88 - 129.205 ms
2026-05-07T06:22:19.985018663Z [GET] /api/bookings/69fc2eca94f2831de11034b0
2026-05-07T06:22:20.174833855Z getBookingById_69fc2eca94f2831de11034b0: 189.679ms
2026-05-07T06:22:20.176180011Z GET /api/bookings/69fc2eca94f2831de11034b0 200 - - 191.046 ms
2026-05-07T06:22:22.360657731Z [CACHE HIT] users_agents
2026-05-07T06:22:22.36120916Z GET /api/users/agents 304 - - 0.725 ms
2026-05-07T06:22:22.48554239Z getBookingsQuery_mov3muff: 138.188ms
2026-05-07T06:22:22.486745881Z GET /api/bookings?page=1&limit=15 200 - - 139.569 ms
2026-05-07T06:22:22.5595141Z GET /api/notifications 304 - - 68.062 ms
2026-05-07T06:22:23.541155387Z [CACHE HIT] users_agents
2026-05-07T06:22:23.541567111Z GET /api/users/agents 304 - - 0.691 ms
2026-05-07T06:22:26.484588776Z DELETE /api/bookings/69fc2eca94f2831de11034b0 200 85 - 280.909 ms
2026-05-07T06:22:26.561803297Z [BG] Cleanup complete for booking 69fc2eca94f2831de11034b0
2026-05-07T06:22:26.561826448Z [BG] deleteBooking_cleanup_69fc2eca94f2831de11034b0: 77.027ms
2026-05-07T06:22:26.936460963Z getBookingsQuery_mov3mxv1: 138.276ms
2026-05-07T06:22:26.937948313Z GET /api/bookings?page=1&limit=15 200 - - 139.329 ms