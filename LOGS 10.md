2026-05-06T06:44:32.641525859Z ==> Deploying...
2026-05-06T06:44:32.744853053Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-06T06:45:04.153838579Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-06T06:45:06.087173948Z GET / 200 36 - 0.553 ms
2026-05-06T06:45:06.11520714Z ==> Your service is live 🎉
2026-05-06T06:45:07.397698905Z ==> 
2026-05-06T06:45:07.40022826Z ==> ///////////////////////////////////////////////////////////
2026-05-06T06:45:07.402780656Z ==> 
2026-05-06T06:45:07.404850882Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-06T06:45:07.408683176Z ==> 
2026-05-06T06:45:07.410667889Z ==> ///////////////////////////////////////////////////////////
2026-05-06T06:45:51.533532395Z GET /api/notifications 304 - - 72.651 ms
2026-05-06T06:45:51.618961546Z GET /api/sync 200 - - 133.922 ms
2026-05-06T06:45:54.314953687Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:45:54.371500402Z GET /api/users/agents 200 - - 64.039 ms
2026-05-06T06:45:54.413876165Z GET /api/settings/dropdowns 304 - - 97.320 ms
2026-05-06T06:45:54.521626492Z getBookingsQuery_motp198q: 205.86ms
2026-05-06T06:45:54.522156423Z GET /api/bookings?page=1&limit=15 304 - - 207.638 ms
2026-05-06T06:45:57.805561593Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:45:59.044645041Z getBookingsQuery_motp1bxp: 1.239s
2026-05-06T06:45:59.045423348Z [PERF] GET /api/bookings?myBookings=true&page=1&limit=15 - 1241ms | Heap: 37MB | RSS: 106MB
2026-05-06T06:45:59.045444768Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 1240.193 ms
2026-05-06T06:46:01.887562021Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:46:10.629812984Z getBookingsQuery_motp1f33: 8.742s
2026-05-06T06:46:10.630422777Z [PERF] GET /api/bookings?assignedTo=unassigned&page=1&limit=15 - 8744ms | Heap: 38MB | RSS: 106MB
2026-05-06T06:46:10.630543769Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 8743.244 ms
2026-05-06T06:46:13.850399398Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:46:13.851408809Z GET /api/bookings?page=1&limit=15 304 - - 1.351 ms
2026-05-06T06:46:13.859593204Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:46:13.859951091Z GET /api/notifications 304 - - 0.633 ms
2026-05-06T06:46:18.129263633Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:46:20.310530166Z getBookingsQuery_motp1rm9: 2.181s
2026-05-06T06:46:20.311451016Z [PERF] GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 - 2183ms | Heap: 35MB | RSS: 106MB
2026-05-06T06:46:20.311478856Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 2182.483 ms
2026-05-06T06:54:01.764976769Z getBookingsQuery_motpboqm: 806.296ms
2026-05-06T06:54:01.765622223Z [PERF] GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 - 808ms | Heap: 38MB | RSS: 108MB
2026-05-06T06:54:01.765636684Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 807.358 ms
2026-05-06T06:54:04.243121996Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:54:04.243380921Z GET /api/notifications 304 - - 0.569 ms
2026-05-06T06:54:06.91953516Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-06T06:54:07.124565257Z getBookingsQuery_motpbtc7: 204.938ms
2026-05-06T06:54:07.125045488Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=6&limit=15 304 - - 205.791 ms
2026-05-06T06:54:12.6697725Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:54:12.675351122Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-06T06:54:14.264604414Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:54:17.212229898Z getBookingsQuery_motpbxs3: 4.537s
2026-05-06T06:54:17.212880592Z [PERF] GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=6&limit=15 - 4538ms | Heap: 39MB | RSS: 109MB
2026-05-06T06:54:17.212897553Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=6&limit=15 304 - - 4537.692 ms
2026-05-06T06:54:17.214564299Z getBookingsQuery_motpbxrx: 4.545s
2026-05-06T06:54:17.215176682Z [PERF] GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=1&limit=15 - 4546ms | Heap: 39MB | RSS: 109MB
2026-05-06T06:54:17.215191363Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 4546.240 ms
2026-05-06T06:54:17.215941389Z getBookingsQuery_motpbz08: 2.951s
2026-05-06T06:54:17.216499911Z [PERF] GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 - 2953ms | Heap: 39MB | RSS: 109MB
2026-05-06T06:54:17.216511981Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 2952.353 ms
2026-05-06T06:54:21.101573352Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:54:21.307001717Z getBookingsQuery_motpc4a5: 205.286ms
2026-05-06T06:54:21.307454637Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 304 - - 206.160 ms
2026-05-06T06:54:23.603235325Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:54:23.608193983Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:54:23.810878378Z getBookingsQuery_motpc67r: 203.336ms
2026-05-06T06:54:23.813838822Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 205.719 ms
2026-05-06T06:54:23.814417905Z getBookingsQuery_motpc67m: 211.588ms
2026-05-06T06:54:23.814988887Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=2&limit=15 304 - - 212.630 ms
2026-05-06T06:54:24.445790437Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:54:24.652869928Z getBookingsQuery_motpc6v1: 206.428ms
2026-05-06T06:54:24.652895169Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 207.300 ms
2026-05-06T06:54:24.964609149Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:54:24.964911095Z GET /api/notifications 304 - - 0.496 ms
2026-05-06T06:54:45.387496953Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c2a1b98787a5edc5143f9d________1_15
2026-05-06T06:54:45.388608228Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 0.960 ms
2026-05-06T06:54:45.645589983Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:54:45.64587589Z GET /api/notifications 304 - - 0.643 ms
2026-05-06T06:54:49.849119182Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T06:54:50.05570489Z getBookingsQuery_motpcqgo: 206.435ms
2026-05-06T06:54:50.057046739Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=3&limit=15 200 - - 207.486 ms
2026-05-06T06:55:03.129220566Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-06T06:55:06.36205339Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:55:06.362442248Z GET /api/notifications 304 - - 0.543 ms
2026-05-06T06:55:17.149036441Z getBookingsQuery_motpd0pl: 14.020s
2026-05-06T06:55:17.150442602Z [PERF] GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=4&limit=15 - 14022ms | Heap: 39MB | RSS: 109MB
2026-05-06T06:55:17.150462153Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=4&limit=15 200 - - 14020.669 ms
2026-05-06T06:55:20.961810941Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-06T06:55:20.990143528Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c2a1b98787a5edc5143f9d________1_15
2026-05-06T06:55:20.990737151Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 1.068 ms
2026-05-06T06:55:20.991369925Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:55:23.072971666Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:55:27.100166705Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:55:27.100453361Z GET /api/notifications 304 - - 0.520 ms
2026-05-06T06:55:29.933344177Z getBookingsQuery_motpdegv: 8.973s
2026-05-06T06:55:29.934039113Z [PERF] GET /api/bookings?page=4&limit=15 - 8974ms | Heap: 40MB | RSS: 110MB
2026-05-06T06:55:29.934052663Z GET /api/bookings?page=4&limit=15 304 - - 8974.280 ms
2026-05-06T06:55:29.935435763Z getBookingsQuery_motpdehr: 8.944s
2026-05-06T06:55:29.936002265Z [PERF] GET /api/bookings?page=1&limit=15 - 8945ms | Heap: 41MB | RSS: 110MB
2026-05-06T06:55:29.936012635Z GET /api/bookings?page=1&limit=15 304 - - 8944.831 ms
2026-05-06T06:55:29.940418191Z getBookingsQuery_motpdg3k: 6.867s
2026-05-06T06:55:29.940923392Z [PERF] GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 - 6868ms | Heap: 40MB | RSS: 110MB
2026-05-06T06:55:29.940948113Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 6868.397 ms
2026-05-06T06:55:37.380101292Z [GET] /api/bookings - Page: 7, Limit: 15, Search: none
2026-05-06T06:55:37.585606413Z getBookingsQuery_motpdr4z: 205.446ms
2026-05-06T06:55:37.587130576Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=7&limit=15 200 - - 206.463 ms
2026-05-06T06:55:42.833036831Z [GET] /api/bookings - Page: 7, Limit: 15, Search: none
2026-05-06T06:55:43.443211366Z getBookingsQuery_motpdvcg: 610.027ms
2026-05-06T06:55:43.444580116Z [PERF] GET /api/bookings?page=7&limit=15 - 612ms | Heap: 40MB | RSS: 110MB
2026-05-06T06:55:43.444594846Z GET /api/bookings?page=7&limit=15 200 - - 611.022 ms
2026-05-06T06:55:44.017920759Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:55:45.061592095Z getBookingsQuery_motpdw9d: 1.044s
2026-05-06T06:55:45.062041094Z [PERF] GET /api/bookings?assignedTo=69ea0587519a503fc23f6384&page=1&limit=15 - 1044ms | Heap: 40MB | RSS: 110MB
2026-05-06T06:55:45.062108106Z GET /api/bookings?assignedTo=69ea0587519a503fc23f6384&page=1&limit=15 200 65 - 1044.320 ms
2026-05-06T06:55:47.814981834Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:55:47.815315252Z GET /api/notifications 304 - - 0.618 ms
2026-05-06T06:55:52.385185383Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:55:52.386126674Z GET /api/bookings?page=1&limit=15 304 - - 1.135 ms
2026-05-06T06:55:53.302789434Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:56:27.646296579Z [PERF] GET /api/notifications - 19121ms | Heap: 41MB | RSS: 111MB
2026-05-06T06:56:27.646332179Z GET /api/notifications 304 - - 19120.120 ms
2026-05-06T06:56:27.699440024Z getBookingsQuery_motpe3fa: 34.397s
2026-05-06T06:56:27.699954395Z [PERF] GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 - 34397ms | Heap: 41MB | RSS: 111MB
2026-05-06T06:56:27.699962105Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 34397.419 ms
2026-05-06T06:56:35.093404503Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T06:56:35.297918709Z getBookingsQuery_motpezo5: 204.401ms
2026-05-06T06:56:35.298493192Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=3&limit=15 304 - - 205.466 ms
2026-05-06T06:56:40.032574044Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-06T06:56:40.239519912Z getBookingsQuery_motpf3hc: 206.84ms
2026-05-06T06:56:40.241453104Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=6&limit=15 200 - - 207.827 ms
2026-05-06T06:56:43.500469736Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53849220e3d8fa652f108________1_15
2026-05-06T06:56:43.500928116Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 0.711 ms
2026-05-06T06:56:43.50891703Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-06T06:56:43.518726473Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:56:45.720178145Z getBookingsQuery_motpf65w: 2.208s
2026-05-06T06:56:45.7227314Z [PERF] GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=6&limit=15 - 2214ms | Heap: 36MB | RSS: 111MB
2026-05-06T06:56:45.722815832Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=6&limit=15 200 - - 2212.140 ms
2026-05-06T06:56:45.932331716Z getBookingsQuery_motpf666: 2.413s
2026-05-06T06:56:45.932938549Z [PERF] GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=1&limit=15 - 2414ms | Heap: 36MB | RSS: 111MB
2026-05-06T06:56:45.932951949Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=1&limit=15 304 - - 2414.182 ms
2026-05-06T06:56:47.431764937Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:56:47.635934965Z getBookingsQuery_motpf96u: 205.386ms
2026-05-06T06:56:47.636487647Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 206.603 ms
2026-05-06T06:56:48.32077922Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:56:48.321152609Z GET /api/notifications 304 - - 0.671 ms
2026-05-06T06:56:52.592357851Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-06T06:57:08.953748406Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:57:08.953996032Z GET /api/notifications 304 - - 0.481 ms
2026-05-06T06:57:15.500445162Z getBookingsQuery_motpfd68: 22.908s
2026-05-06T06:57:15.502018006Z [PERF] GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=4&limit=15 - 22910ms | Heap: 36MB | RSS: 111MB
2026-05-06T06:57:15.502036176Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=4&limit=15 200 - - 22909.048 ms
2026-05-06T06:57:21.848616921Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:57:21.851923173Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-06T06:57:22.053459021Z getBookingsQuery_motpfzqz: 201.397ms
2026-05-06T06:57:22.054416382Z getBookingsQuery_motpfzqw: 205.776ms
2026-05-06T06:57:22.054975884Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 304 - - 206.554 ms
2026-05-06T06:57:22.055552186Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=4&limit=15 200 - - 202.201 ms
2026-05-06T06:57:22.551827628Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53915220e3d8fa652f131________1_15
2026-05-06T06:57:22.551861518Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 0.988 ms
2026-05-06T06:57:23.147069549Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:57:23.283341879Z getBookingsQuery_motpg0qy: 136.179ms
2026-05-06T06:57:23.283707797Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 136.905 ms
2026-05-06T06:57:29.015258987Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:57:29.649695448Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:57:29.650146998Z GET /api/notifications 304 - - 0.580 ms
2026-05-06T06:57:29.85466193Z [CACHE HIT] settings_dropdowns
2026-05-06T06:57:29.855031078Z GET /api/settings/dropdowns 304 - - 0.644 ms
2026-05-06T06:57:35.049528121Z getBookingsQuery_motpg59z: 6.034s
2026-05-06T06:57:35.050113824Z [PERF] GET /api/bookings?page=1&limit=15 - 6035ms | Heap: 37MB | RSS: 111MB
2026-05-06T06:57:35.050127374Z GET /api/bookings?page=1&limit=15 304 - - 6035.088 ms
2026-05-06T06:57:50.515464746Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:57:50.515774873Z GET /api/notifications 304 - - 0.678 ms
2026-05-06T06:57:55.687204322Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:57:55.688871388Z GET /api/bookings?page=1&limit=15 304 - - 1.512 ms
2026-05-06T06:58:11.112214592Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:58:11.112557879Z GET /api/notifications 304 - - 0.534 ms
2026-05-06T06:58:16.342325393Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:58:16.342809933Z GET /api/bookings?page=1&limit=15 304 - - 0.777 ms
2026-05-06T06:58:21.924703411Z [PERF] POST /api/bookings - 42798ms | Heap: 39MB | RSS: 111MB
2026-05-06T06:58:21.924736952Z POST /api/bookings 201 - - 42795.540 ms
2026-05-06T06:58:22.469695541Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:58:22.470356685Z GET /api/bookings?page=1&limit=15 304 - - 1.040 ms
2026-05-06T06:58:32.030139643Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:58:32.030529571Z GET /api/notifications 304 - - 0.691 ms
2026-05-06T06:58:36.176808017Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:58:36.467942856Z getBookingsQuery_motphl3j: 292.048ms
2026-05-06T06:58:36.469759085Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 294.454 ms
2026-05-06T06:58:38.765966047Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:58:38.988297322Z getBookingsQuery_motphn3h: 222.966ms
2026-05-06T06:58:38.989401486Z GET /api/bookings?page=1&limit=15 200 - - 223.898 ms
2026-05-06T06:58:41.609567507Z POST /api/users/offline 200 16 - 71.735 ms
2026-05-06T06:58:42.434642081Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:58:42.435016259Z GET /api/notifications 304 - - 0.669 ms
2026-05-06T06:58:42.435436698Z [CACHE HIT] settings_dropdowns
2026-05-06T06:58:42.435704154Z GET /api/settings/dropdowns 304 - - 0.349 ms
2026-05-06T06:58:42.801812669Z GET /api/users/agents 200 - - 346.993 ms
2026-05-06T06:58:42.938592957Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:58:42.93919933Z GET /api/bookings?page=1&limit=15 304 - - 0.882 ms
2026-05-06T06:58:45.189505402Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T06:58:53.909991482Z getBookingById_69fae6679a87e9c77ab799c8: 8.720s
2026-05-06T06:58:53.911232739Z [PERF] GET /api/bookings/69fae6679a87e9c77ab799c8 - 8722ms | Heap: 40MB | RSS: 115MB
2026-05-06T06:58:53.911249129Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 8721.487 ms
2026-05-06T06:59:01.156617475Z PATCH /api/bookings/69fae6679a87e9c77ab799c8/status 200 - - 141.788 ms
2026-05-06T06:59:01.90726983Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T06:59:02.111112432Z getBookingById_69fae6679a87e9c77ab799c8: 203.718ms
2026-05-06T06:59:02.112113384Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 204.781 ms
2026-05-06T06:59:03.055285816Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:59:03.055537671Z GET /api/notifications 304 - - 0.329 ms
2026-05-06T06:59:03.467893687Z PUT /api/bookings/69fae6679a87e9c77ab799c8 200 - - 415.910 ms
2026-05-06T06:59:03.814740722Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T06:59:04.01659313Z getBookingById_69fae6679a87e9c77ab799c8: 203.743ms
2026-05-06T06:59:04.017566972Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 205.032 ms
2026-05-06T06:59:23.651865164Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:59:23.65215826Z GET /api/notifications 304 - - 0.514 ms
2026-05-06T06:59:44.267867089Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:59:44.268248558Z GET /api/notifications 304 - - 0.581 ms
2026-05-06T07:00:05.317045973Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T07:00:05.31734827Z GET /api/notifications 304 - - 0.622 ms
2026-05-06T07:00:13.847171415Z POST /api/bookings/69fae6679a87e9c77ab799c8/payments 201 307 - 147.754 ms
2026-05-06T07:00:14.553393551Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T07:00:14.754568981Z getBookingById_69fae6679a87e9c77ab799c8: 201.087ms
2026-05-06T07:00:14.755479651Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 202.198 ms
2026-05-06T07:00:26.373723203Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T07:00:26.373753223Z GET /api/notifications 304 - - 0.673 ms
2026-05-06T07:00:46.991720584Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T07:00:46.992026991Z GET /api/notifications 304 - - 0.611 ms
2026-05-06T07:01:08.160988096Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T07:01:08.161271733Z GET /api/notifications 304 - - 0.580 ms
2026-05-06T07:01:24.019785744Z [PERF] POST /api/bookings/69fae6679a87e9c77ab799c8/payments - 35156ms | Heap: 42MB | RSS: 113MB
2026-05-06T07:01:24.019824585Z POST /api/bookings/69fae6679a87e9c77ab799c8/payments 201 307 - 35156.008 ms
2026-05-06T07:01:24.024514646Z [PASSENGER PERF] Add Passengers - Total: 34638ms | DB: 675ms | Count: 2
2026-05-06T07:01:24.025481487Z [PERF] PATCH /api/bookings/69fae6679a87e9c77ab799c8/status - 35158ms | Heap: 43MB | RSS: 113MB
2026-05-06T07:01:24.025495968Z PATCH /api/bookings/69fae6679a87e9c77ab799c8/status 200 - - 35154.584 ms
2026-05-06T07:01:24.287050091Z [PERF] POST /api/bookings/69fae6679a87e9c77ab799c8/passengers - 34900ms | Heap: 42MB | RSS: 113MB
2026-05-06T07:01:24.287069862Z POST /api/bookings/69fae6679a87e9c77ab799c8/passengers 201 982 - 34900.149 ms
2026-05-06T07:01:24.508066937Z [PERF] DELETE /api/bookings/69fae6679a87e9c77ab799c8/payments/69fae6fd9a87e9c77ab799fc - 64222ms | Heap: 43MB | RSS: 113MB
2026-05-06T07:01:24.508119669Z DELETE /api/bookings/69fae6679a87e9c77ab799c8/payments/69fae6fd9a87e9c77ab799fc 200 42 - 64221.720 ms
2026-05-06T07:01:24.576773035Z [PERF] DELETE /api/bookings/69fae6679a87e9c77ab799c8/payments/69fae6fd9a87e9c77ab799fc - 48452ms | Heap: 43MB | RSS: 113MB
2026-05-06T07:01:24.576810286Z DELETE /api/bookings/69fae6679a87e9c77ab799c8/payments/69fae6fd9a87e9c77ab799fc 200 42 - 48451.525 ms
2026-05-06T07:01:24.643595872Z [PERF] PUT /api/bookings/69fae6679a87e9c77ab799c8 - 35757ms | Heap: 43MB | RSS: 113MB
2026-05-06T07:01:24.643620053Z PUT /api/bookings/69fae6679a87e9c77ab799c8 200 - - 35756.329 ms
2026-05-06T07:01:25.077158421Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T07:01:25.282438206Z getBookingById_69fae6679a87e9c77ab799c8: 205.833ms
2026-05-06T07:01:25.284126762Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 207.174 ms
2026-05-06T07:01:25.569810599Z [CACHE HIT] booking_69fae6679a87e9c77ab799c8
2026-05-06T07:01:25.569833269Z GET /api/bookings/69fae6679a87e9c77ab799c8 304 - - 0.876 ms
2026-05-06T07:01:28.958211799Z GET /api/notifications 304 - - 69.110 ms
2026-05-06T07:01:37.416006947Z [PERF] POST /api/bookings/69fae6679a87e9c77ab799c8/payments - 1449ms | Heap: 43MB | RSS: 113MB
2026-05-06T07:01:37.416046867Z POST /api/bookings/69fae6679a87e9c77ab799c8/payments 201 307 - 1350.209 ms
2026-05-06T07:01:37.683958508Z [PASSENGER PERF] Update Passengers - Total: 1677ms | DB (Del+Ins): 552ms | Count: 2
2026-05-06T07:01:37.755399405Z [PERF] PUT /api/bookings/69fae6679a87e9c77ab799c8/passengers - 1750ms | Heap: 38MB | RSS: 113MB
2026-05-06T07:01:37.755487537Z PUT /api/bookings/69fae6679a87e9c77ab799c8/passengers 200 982 - 1748.987 ms
2026-05-06T07:01:37.959585275Z [PERF] PUT /api/bookings/69fae6679a87e9c77ab799c8 - 1951ms | Heap: 38MB | RSS: 113MB
2026-05-06T07:01:37.959607056Z PUT /api/bookings/69fae6679a87e9c77ab799c8 200 - - 1949.332 ms
2026-05-06T07:01:38.321028321Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T07:01:38.520835497Z getBookingById_69fae6679a87e9c77ab799c8: 199.675ms
2026-05-06T07:01:38.522138365Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 200.980 ms
2026-05-06T07:01:38.695183172Z [CACHE HIT] settings_dropdowns
2026-05-06T07:01:38.695614431Z GET /api/settings/dropdowns 304 - - 0.733 ms
2026-05-06T07:01:48.641228595Z [PERF] PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify - 4608ms | Heap: 38MB | RSS: 113MB
2026-05-06T07:01:48.641267565Z PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify 200 121 - 4607.176 ms
2026-05-06T07:01:49.194627324Z [CACHE HIT] booking_69fae6679a87e9c77ab799c8
2026-05-06T07:01:49.195243098Z GET /api/bookings/69fae6679a87e9c77ab799c8 304 - - 0.928 ms
2026-05-06T07:01:49.605516149Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T07:01:49.605770535Z GET /api/notifications 304 - - 0.542 ms
2026-05-06T07:01:57.783420621Z [CACHE HIT] users_agents
2026-05-06T07:01:57.783748748Z GET /api/users/agents 304 - - 0.575 ms
2026-05-06T07:01:57.78428688Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T07:01:57.981713363Z getBookingsQuery_motplwns: 197.275ms
2026-05-06T07:01:57.982842468Z GET /api/bookings?page=1&limit=15 200 - - 198.133 ms
2026-05-06T07:02:00.627550962Z PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify 200 121 - 140.462 ms
2026-05-06T07:02:01.254813669Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T07:02:01.458312203Z getBookingById_69fae6679a87e9c77ab799c8: 203.38ms
2026-05-06T07:02:01.459580681Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 204.434 ms
2026-05-06T07:02:05.989805301Z [PERF] PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify - 1133ms | Heap: 39MB | RSS: 113MB
2026-05-06T07:02:05.989841132Z PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify 200 88 - 1133.242 ms
2026-05-06T07:02:05.996156529Z [PERF] PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify - 1747ms | Heap: 39MB | RSS: 113MB
2026-05-06T07:02:05.996173459Z PATCH /api/bookings/69fae6679a87e9c77ab799c8/verify 200 88 - 1746.844 ms
2026-05-06T07:02:06.710055689Z [GET] /api/bookings/69fae6679a87e9c77ab799c8
2026-05-06T07:02:06.909396704Z getBookingById_69fae6679a87e9c77ab799c8: 199.252ms
2026-05-06T07:02:06.910462687Z GET /api/bookings/69fae6679a87e9c77ab799c8 200 - - 200.297 ms
2026-05-06T07:02:10.069410424Z [CACHE HIT] users_agents
2026-05-06T07:02:10.069433914Z GET /api/users/agents 304 - - 0.912 ms
2026-05-06T07:02:10.174316094Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T07:02:10.174624731Z GET /api/notifications 304 - - 0.680 ms
2026-05-06T07:02:12.76960281Z deleteBooking_69fae6679a87e9c77ab799c8: 403.752ms
2026-05-06T07:02:12.770111881Z DELETE /api/bookings/69fae6679a87e9c77ab799c8 200 66 - 498.531 ms
2026-05-06T07:02:14.125508004Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T07:02:14.322781523Z getBookingsQuery_motpm99p: 197.177ms
2026-05-06T07:02:14.3240224Z GET /api/bookings?page=1&limit=15 200 - - 198.187 ms