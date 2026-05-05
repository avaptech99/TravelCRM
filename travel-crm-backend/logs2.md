2026-05-05T06:32:00.276369682Z GET /api/bookings/69f98da22a7d3b3a0aee46f9 200 - - 203.284 ms
2026-05-05T06:32:10.607900893Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-05T06:32:10.608274641Z GET /api/notifications 304 - - 0.643 ms
2026-05-05T06:32:18.726414178Z POST /api/bookings/69f98da22a7d3b3a0aee46f9/comments 201 273 - 5957.949 ms
2026-05-05T06:32:19.360151071Z [GET] /api/bookings/69f98da22a7d3b3a0aee46f9
2026-05-05T06:32:19.360940211Z (node:82) Warning: Label 'getBookingById_69f98da22a7d3b3a0aee46f9' already exists for console.time()
2026-05-05T06:32:21.596725522Z GET /api/bookings/69f98da22a7d3b3a0aee46f9 200 - - 2236.287 ms
2026-05-05T06:32:22.930189992Z PUT /api/bookings/69f98da22a7d3b3a0aee46f9 200 - - 386.360 ms
2026-05-05T06:32:23.255905819Z [GET] /api/bookings/69f98da22a7d3b3a0aee46f9
2026-05-05T06:32:23.256241554Z (node:82) Warning: Label 'getBookingById_69f98da22a7d3b3a0aee46f9' already exists for console.time()
2026-05-05T06:32:23.468574022Z GET /api/bookings/69f98da22a7d3b3a0aee46f9 200 - - 211.579 ms
2026-05-05T06:32:27.530717939Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T06:32:27.597065563Z GET /api/settings/dropdowns 304 - - 68.425 ms
2026-05-05T06:32:27.602772769Z GET /api/users/agents 304 - - 70.201 ms
2026-05-05T06:32:27.670078096Z getBookingsQuery_mos94422: 139.219ms
2026-05-05T06:32:27.671248576Z GET /api/bookings?page=1&limit=15 200 - - 140.176 ms
2026-05-05T06:32:29.65199071Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.461 ms
2026-05-05T06:32:29.742247061Z GET /api/analytics/agents?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 94.342 ms
2026-05-05T06:32:29.742801684Z GET /api/analytics/bookings?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 238 - 93.074 ms
2026-05-05T06:32:29.789997363Z GET /api/analytics/payments?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 101 - 137.558 ms
2026-05-05T06:32:30.209979448Z GET /api/analytics/revenue-trends?interval=month&companyName= 200 110 - 69.394 ms
2026-05-05T06:32:31.087679433Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.692 ms
2026-05-05T06:32:31.305913612Z GET /api/notifications 304 - - 69.398 ms
2026-05-05T06:32:33.412571792Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.709 ms
2026-05-05T06:40:44.417891882Z ==> Deploying...
2026-05-05T06:40:44.496957715Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-05T06:41:06.261791402Z ==> Running 'npm run start'
2026-05-05T06:41:07.462416628Z 
2026-05-05T06:41:07.462444929Z > travel-crm-backend@1.0.0 start
2026-05-05T06:41:07.462449779Z > node dist/src/server.js
2026-05-05T06:41:07.462452769Z 
2026-05-05T06:41:14.655794428Z Server running in production mode on port 10000
2026-05-05T06:41:15.483268684Z HEAD / 200 36 - 2.678 ms
2026-05-05T06:41:15.739793027Z ==> Your service is live 🎉
2026-05-05T06:41:15.817634992Z ==> 
2026-05-05T06:41:15.828517239Z ==> ///////////////////////////////////////////////////////////
2026-05-05T06:41:15.831163735Z ==> 
2026-05-05T06:41:15.833745789Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-05T06:41:15.837345224Z ==> 
2026-05-05T06:41:15.839649332Z ==> ///////////////////////////////////////////////////////////
2026-05-05T06:41:15.851447082Z GET / 200 36 - 0.370 ms
2026-05-05T06:41:20.155246071Z Error: Server selection timed out after 5000 ms
2026-05-05T06:41:26.910145747Z ==> Running 'npm run start'
2026-05-05T06:41:27.906641212Z 
2026-05-05T06:41:27.906685893Z > travel-crm-backend@1.0.0 start
2026-05-05T06:41:27.906690623Z > node dist/src/server.js
2026-05-05T06:41:27.906693423Z 
2026-05-05T06:41:34.80767919Z Server running in production mode on port 10000
2026-05-05T06:41:35.304443808Z HEAD / 200 36 - 1.670 ms
2026-05-05T06:41:36.058768825Z MongoDB Connected: ac-nvjnavm-shard-00-01.31xmkrx.mongodb.net
2026-05-05T06:41:36.51827895Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-05T06:41:36.590894266Z (node:65) [MONGOOSE] Warning: mongoose: Duplicate schema index on {"uniqueCode":1} for model "Booking". This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
2026-05-05T06:41:36.590920397Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-05T06:46:20.958168575Z ==> Detected service running on port 10000
2026-05-05T06:46:21.060775121Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-05-05T06:48:17.697374124Z ==> Deploying...
2026-05-05T06:48:17.775913214Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-05T06:48:37.888398688Z POST /api/users/heartbeat 404 41 - 28983.406 ms
2026-05-05T06:48:37.892864097Z GET /api/notifications 304 - - 28505.560 ms
2026-05-05T06:48:53.73808092Z 
2026-05-05T06:48:53.73810891Z > travel-crm-backend@1.0.0 start
2026-05-05T06:48:53.738114351Z > node dist/src/server.js
2026-05-05T06:48:53.738117421Z 
2026-05-05T06:49:00.439350651Z Server running in production mode on port 10000
2026-05-05T06:49:00.945775623Z HEAD / 200 36 - 2.721 ms
2026-05-05T06:49:01.652336302Z MongoDB Connected: ac-nvjnavm-shard-00-02.31xmkrx.mongodb.net
2026-05-05T06:49:02.0212736Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-05T06:49:02.229472448Z (node:83) [MONGOOSE] Warning: mongoose: Duplicate schema index on {"uniqueCode":1} for model "Booking". This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
2026-05-05T06:49:02.229493738Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-05T06:49:08.863857735Z ==> Your service is live 🎉
2026-05-05T06:49:08.949797282Z GET / 200 36 - 0.450 ms
2026-05-05T06:49:08.996526818Z ==> 
2026-05-05T06:49:09.001553679Z ==> ///////////////////////////////////////////////////////////
2026-05-05T06:49:09.005453947Z ==> 
2026-05-05T06:49:09.011018569Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-05T06:49:09.016385857Z ==> 
2026-05-05T06:49:09.020240394Z ==> ///////////////////////////////////////////////////////////
2026-05-05T06:51:21.086169915Z ==> Deploying...
2026-05-05T06:51:21.159372568Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-05T06:51:37.176962716Z ==> Running 'npm run start'
2026-05-05T06:51:38.287216833Z 
2026-05-05T06:51:38.287248145Z > travel-crm-backend@1.0.0 start
2026-05-05T06:51:38.287254005Z > node dist/src/server.js
2026-05-05T06:51:38.287256656Z 
2026-05-05T06:51:45.686295327Z Server running in production mode on port 10000
2026-05-05T06:51:45.882300797Z HEAD / 200 36 - 1.907 ms
2026-05-05T06:51:46.632327298Z MongoDB Connected: ac-nvjnavm-shard-00-00.31xmkrx.mongodb.net
2026-05-05T06:51:47.111985945Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-05T06:51:47.234554121Z (node:84) [MONGOOSE] Warning: mongoose: Duplicate schema index on {"uniqueCode":1} for model "Booking". This is often due to declaring an index using both "index: true" and "schema.index()". Please remove the duplicate index definition.
2026-05-05T06:51:47.234573732Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-05T06:51:52.330428754Z ==> Your service is live 🎉
2026-05-05T06:51:52.407440123Z GET / 200 36 - 0.532 ms
2026-05-05T06:51:52.421651157Z ==> 
2026-05-05T06:51:52.426627108Z ==> ///////////////////////////////////////////////////////////
2026-05-05T06:51:52.436358025Z ==> 
2026-05-05T06:51:52.442980423Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-05T06:51:52.44866888Z ==> 
2026-05-05T06:51:52.454381237Z ==> ///////////////////////////////////////////////////////////
2026-05-05T06:52:09.876643619Z POST /api/auth/login 401 52 - 8613.643 ms
2026-05-05T06:52:19.378369421Z POST /api/auth/login 401 52 - 1030.891 ms
2026-05-05T07:05:50.385491025Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:05:50.386701512Z GET /api/notifications 304 - - 0.917 ms
2026-05-05T07:05:52.864926918Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-05T07:06:05.233911183Z getBookingsQuery_mosab3ds: 12.369s
2026-05-05T07:06:05.235260095Z GET /api/bookings?status=Booked&page=4&limit=15 200 - - 12369.848 ms
2026-05-05T07:06:09.298588759Z [GET] /api/bookings/69d3439e519a503fc23ebfe0
2026-05-05T07:06:09.493393639Z GET /api/bookings/69d3439e519a503fc23ebfe0 200 - - 194.564 ms
2026-05-05T07:06:11.000095609Z GET /api/notifications 304 - - 62.906 ms
2026-05-05T07:06:17.720058336Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-05T07:06:17.737276767Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:06:17.769364855Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744_Booked_________1_15
2026-05-05T07:06:17.770271221Z GET /api/bookings?status=Booked&page=1&limit=15 304 - - 2.471 ms
2026-05-05T07:06:17.859532108Z getBookingsQuery_mosabmk7: 139.335ms
2026-05-05T07:06:17.874922947Z GET /api/bookings?status=Booked%2CSent&page=4&limit=15 200 - - 140.432 ms
2026-05-05T07:06:17.876010904Z getBookingsQuery_mosabmkp: 138.657ms
2026-05-05T07:06:17.877046107Z GET /api/bookings?status=Booked%2CSent&page=1&limit=15 200 - - 139.550 ms
2026-05-05T07:06:19.200102871Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:06:19.698344754Z getBookingsQuery_mosabnpb: 498.148ms
2026-05-05T07:06:19.698894798Z GET /api/bookings?status=Sent&page=1&limit=15 304 - - 499.127 ms
2026-05-05T07:06:26.103455364Z [GET] /api/bookings - Page: 20, Limit: 15, Search: none
2026-05-05T07:06:26.231643743Z getBookingsQuery_mosabt13: 128.068ms
2026-05-05T07:06:26.23290636Z GET /api/bookings?status=Sent&page=20&limit=15 200 - - 129.098 ms
2026-05-05T07:06:28.180791687Z [GET] /api/bookings/69d74051519a503fc23ee7ba
2026-05-05T07:06:31.57867577Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:06:31.578697981Z GET /api/notifications 304 - - 0.652 ms
2026-05-05T07:06:36.703614189Z GET /api/bookings/69d74051519a503fc23ee7ba 200 - - 8522.580 ms
2026-05-05T07:06:47.337428086Z GET /api/settings/dropdowns 304 - - 10036.999 ms
2026-05-05T07:06:47.587786238Z GET /api/users/agents 304 - - 6441.838 ms
2026-05-05T07:06:48.014862555Z [GET] /api/bookings - Page: 30, Limit: 15, Search: none
2026-05-05T07:06:48.149398099Z getBookingsQuery_mosac9xq: 134.414ms
2026-05-05T07:06:48.151709031Z GET /api/bookings?status=Sent&page=30&limit=15 200 - - 135.550 ms
2026-05-05T07:06:50.703531648Z [GET] /api/bookings/69d782e2519a503fc23eedbd
2026-05-05T07:06:50.902427184Z GET /api/bookings/69d782e2519a503fc23eedbd 200 - - 196.773 ms
2026-05-05T07:06:52.185145275Z GET /api/notifications 304 - - 63.033 ms
2026-05-05T07:06:55.638457849Z [GET] /api/bookings - Page: 30, Limit: 15, Search: none
2026-05-05T07:06:55.670924587Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:06:55.687820432Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744_Sent_________1_15
2026-05-05T07:06:55.688346664Z GET /api/bookings?status=Sent&page=1&limit=15 304 - - 0.753 ms
2026-05-05T07:06:55.778031547Z getBookingsQuery_mosacfti: 139.456ms
2026-05-05T07:06:55.779302684Z GET /api/bookings?status=Sent%2CWorking&page=30&limit=15 200 - - 140.406 ms
2026-05-05T07:06:55.798811599Z getBookingsQuery_mosacfud: 129.049ms
2026-05-05T07:06:55.799707414Z GET /api/bookings?status=Sent%2CWorking&page=1&limit=15 200 - - 129.920 ms
2026-05-05T07:06:56.998872601Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:06:57.176367874Z getBookingsQuery_mosacgva: 130.915ms
2026-05-05T07:06:57.176394605Z GET /api/bookings?status=Working&page=1&limit=15 304 - - 176.757 ms
2026-05-05T07:07:00.238702617Z [GET] /api/bookings/69f1d5081229ef873858a751
2026-05-05T07:07:00.433643132Z GET /api/bookings/69f1d5081229ef873858a751 200 - - 194.797 ms
2026-05-05T07:07:04.968002642Z [GET] /api/bookings/69c61a80220e3d8fa652f3a4
2026-05-05T07:07:05.157617266Z GET /api/bookings/69c61a80220e3d8fa652f3a4 200 - - 189.170 ms
2026-05-05T07:07:12.782190388Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:07:12.78254531Z GET /api/notifications 304 - - 0.584 ms
2026-05-05T07:07:12.935386265Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:07:13.743037598Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:07:31.668664722Z getBookingsQuery_mosact5z: 18.733s
2026-05-05T07:07:31.669871576Z GET /api/bookings?status=Working%2CPending&page=1&limit=15 200 - - 18734.129 ms
2026-05-05T07:07:31.674287368Z getBookingsQuery_mosactse: 17.931s
2026-05-05T07:07:31.6748206Z GET /api/bookings?status=Pending&page=1&limit=15 304 - - 17932.109 ms
2026-05-05T07:07:33.401937173Z GET /api/notifications 304 - - 64.228 ms
2026-05-05T07:07:37.725011214Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-05T07:07:37.856591153Z getBookingsQuery_mosadcak: 131.458ms
2026-05-05T07:07:37.857842229Z GET /api/bookings?status=Pending&page=2&limit=15 200 - - 132.437 ms
2026-05-05T07:07:41.527344762Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:07:41.530264892Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-05T07:07:41.656041546Z getBookingsQuery_mosadf8a: 125.658ms
2026-05-05T07:07:41.656673285Z GET /api/bookings?page=2&limit=15 304 - - 126.539 ms
2026-05-05T07:07:41.659346769Z getBookingsQuery_mosadf87: 131.966ms
2026-05-05T07:07:41.660161209Z GET /api/bookings?page=1&limit=15 304 - - 133.072 ms
2026-05-05T07:07:45.088901045Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:07:46.784282268Z getBookingsQuery_mosadhz4: 1.695s
2026-05-05T07:07:46.78528401Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 1696.125 ms
2026-05-05T07:07:50.63020164Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:07:50.766767954Z getBookingsQuery_mosadm92: 136.427ms
2026-05-05T07:07:50.76784229Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 200 - - 137.473 ms
2026-05-05T07:07:53.973113574Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:07:53.973424593Z GET /api/notifications 304 - - 0.645 ms
2026-05-05T07:07:54.693566015Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-05T07:07:54.820397753Z getBookingsQuery_mosadpdw: 127.505ms
2026-05-05T07:07:54.820951237Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=6&limit=15 304 - - 128.647 ms
2026-05-05T07:07:56.213516962Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-05T07:07:56.228502235Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:07:57.514816618Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:08:19.410871542Z getBookingsQuery_mosadrk9: 21.897s
2026-05-05T07:08:19.411351692Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 21897.769 ms
2026-05-05T07:08:19.414313264Z getBookingsQuery_mosadqk5: 23.200s
2026-05-05T07:08:19.414644205Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=6&limit=15 200 - - 23200.532 ms
2026-05-05T07:08:22.404769386Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-05T07:08:22.405514062Z GET /api/bookings?page=1&limit=15 304 - - 0.952 ms
2026-05-05T07:08:23.357643485Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:08:26.068769386Z getBookingsQuery_mosadqkj: 29.841s
2026-05-05T07:08:26.069450728Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 304 - - 29842.220 ms
2026-05-05T07:08:26.119603873Z GET /api/notifications 304 - - 11573.034 ms
2026-05-05T07:08:26.879030789Z getBookingsQuery_mosaebi5: 3.521s
2026-05-05T07:08:26.879872871Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 3522.397 ms
2026-05-05T07:08:35.009894382Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:08:35.148690386Z getBookingsQuery_mosaekht: 138.726ms
2026-05-05T07:08:35.150152476Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c537cb220e3d8fa652f0f2&page=1&limit=15 200 - - 140.229 ms
2026-05-05T07:08:36.998895649Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:08:37.127337155Z getBookingsQuery_mosaem12: 128.152ms
2026-05-05T07:08:37.127936152Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 129.314 ms
2026-05-05T07:08:40.771166999Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:08:43.895995359Z getBookingsQuery_mosaeoxv: 3.125s
2026-05-05T07:08:43.897246996Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 200 - - 3125.738 ms
2026-05-05T07:08:46.699450487Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:08:46.699844902Z GET /api/notifications 304 - - 0.560 ms
2026-05-05T07:08:51.248501821Z [GET] /api/bookings - Page: 7, Limit: 15, Search: none
2026-05-05T07:09:09.361470657Z getBookingsQuery_mosaex0w: 18.113s
2026-05-05T07:09:09.362811Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c2a1b98787a5edc5143f9d&page=7&limit=15 200 - - 18113.851 ms
2026-05-05T07:09:15.7634372Z [GET] /api/bookings - Page: 10, Limit: 15, Search: none
2026-05-05T07:09:15.894089685Z getBookingsQuery_mosaffxv: 130.506ms
2026-05-05T07:09:15.905861745Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c2a1b98787a5edc5143f9d&page=10&limit=15 200 - - 131.518 ms
2026-05-05T07:09:17.555372331Z [GET] /api/bookings - Page: 10, Limit: 15, Search: none
2026-05-05T07:09:17.567708686Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:09:17.594065589Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c537cb220e3d8fa652f0f2,69c2a1b98787a5edc5143f9d________1_15
2026-05-05T07:09:17.594552129Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 0.858 ms
2026-05-05T07:09:17.619455693Z getBookingsQuery_mosafhbn: 63.52ms
2026-05-05T07:09:17.619474384Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=10&limit=15 200 67 - 64.260 ms
2026-05-05T07:09:17.704149462Z getBookingsQuery_mosafhby: 137.545ms
2026-05-05T07:09:17.704976553Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 138.533 ms
2026-05-05T07:09:21.276444087Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:09:21.41811697Z getBookingsQuery_mosafk6y: 142.31ms
2026-05-05T07:09:21.418881467Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d%2C69eb50af8e47cc04dc29918d&page=1&limit=15 200 - - 143.439 ms
2026-05-05T07:09:22.298575786Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:09:26.885931173Z getBookingsQuery_mosafkze: 4.581s
2026-05-05T07:09:26.885961375Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 4581.895 ms
2026-05-05T07:09:28.473978873Z GET /api/notifications 304 - - 1231.645 ms
2026-05-05T07:09:35.342967746Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-05T07:09:49.071101319Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:09:49.071499723Z GET /api/notifications 304 - - 0.567 ms
2026-05-05T07:10:09.506794161Z getBookingsQuery_mosafv1q: 34.164s
2026-05-05T07:10:09.507330474Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 304 - - 34164.801 ms
2026-05-05T07:10:14.881164156Z GET /api/notifications 304 - - 5244.801 ms
2026-05-05T07:10:22.191983825Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-05T07:10:22.323296433Z getBookingsQuery_mosagv73: 131.192ms
2026-05-05T07:10:22.323807885Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=3&limit=15 304 - - 132.072 ms
2026-05-05T07:10:24.433879019Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-05T07:10:24.446114101Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:10:24.475346712Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69eb50af8e47cc04dc29918d________1_15
2026-05-05T07:10:24.47595346Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 0.771 ms
2026-05-05T07:10:24.560345166Z getBookingsQuery_mosagwxd: 126.348ms
2026-05-05T07:10:24.561388371Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c538b0220e3d8fa652f122&page=3&limit=15 200 - - 127.382 ms
2026-05-05T07:10:24.582045238Z getBookingsQuery_mosagwxp: 135.994ms
2026-05-05T07:10:24.583150887Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c538b0220e3d8fa652f122&page=1&limit=15 200 - - 136.838 ms
2026-05-05T07:10:25.768512426Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:10:25.895188467Z getBookingsQuery_mosagxyg: 126.618ms
2026-05-05T07:10:25.895633705Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 127.458 ms
2026-05-05T07:10:28.824501459Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-05T07:10:35.803399166Z getBookingsQuery_mosah0bc: 6.979s
2026-05-05T07:10:35.80444418Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=2&limit=15 200 - - 6979.749 ms
2026-05-05T07:10:43.572053358Z [GET] /api/bookings - Page: 7, Limit: 15, Search: none
2026-05-05T07:11:26.979832766Z GET /api/notifications 304 - - 11528.700 ms
2026-05-05T07:11:27.011757803Z getBookingsQuery_mosahboz: 43.440s
2026-05-05T07:11:27.012844241Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=7&limit=15 200 - - 43441.421 ms
2026-05-05T07:11:38.04450983Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:11:38.062851678Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:11:38.068040573Z [GET] /api/bookings - Page: 7, Limit: 15, Search: none
2026-05-05T07:11:38.187176712Z getBookingsQuery_mosaihq4: 142.511ms
2026-05-05T07:11:38.188433371Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 143.464 ms
2026-05-05T07:11:38.202123158Z getBookingsQuery_mosaihqm: 139.183ms
2026-05-05T07:11:38.202617369Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 140.021 ms
2026-05-05T07:11:38.233484752Z getBookingsQuery_mosaihqr: 165.315ms
2026-05-05T07:11:38.234801684Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69c2a2038787a5edc5143fb6&page=7&limit=15 200 - - 166.176 ms
2026-05-05T07:11:39.522220253Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:11:39.7721055Z getBookingsQuery_mosaiiv6: 249.796ms
2026-05-05T07:11:39.773109382Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 250.646 ms
2026-05-05T07:11:43.167229574Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-05T07:11:44.265706346Z getBookingsQuery_mosailof: 1.098s
2026-05-05T07:11:44.26688804Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=3&limit=15 200 - - 1099.427 ms
2026-05-05T07:11:52.543515001Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:11:53.068775669Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-05T07:11:54.570356091Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:12:20.654415462Z GET /api/notifications 304 - - 13091.572 ms
2026-05-05T07:12:20.665362079Z getBookingsQuery_mosaiswv: 28.121s
2026-05-05T07:12:20.665974117Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c52979220e3d8fa652ee44&page=1&limit=15 200 - - 28122.137 ms
2026-05-05T07:12:20.894928362Z getBookingsQuery_mosaitbg: 27.826s
2026-05-05T07:12:20.896839812Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c52979220e3d8fa652ee44&page=3&limit=15 200 - - 27827.027 ms
2026-05-05T07:12:20.900491351Z getBookingsQuery_mosaiuh6: 26.330s
2026-05-05T07:12:20.901533487Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 200 - - 26330.853 ms
2026-05-05T07:12:39.373445235Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:12:39.499176568Z getBookingsQuery_mosajt1p: 125.604ms
2026-05-05T07:12:39.499766435Z GET /api/bookings?page=1&limit=15 304 - - 126.629 ms
2026-05-05T07:12:40.338952268Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:12:40.464048681Z getBookingsQuery_mosajtsi: 125.003ms
2026-05-05T07:12:40.464561334Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 125.955 ms
2026-05-05T07:12:41.234534908Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:12:41.236376454Z GET /api/notifications 304 - - 0.719 ms
2026-05-05T07:12:43.256689101Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:12:55.048677217Z getBookingsQuery_mosajw1k: 11.792s
2026-05-05T07:12:55.049763026Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 11792.853 ms
2026-05-05T07:13:01.123248965Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__unassigned________1_15
2026-05-05T07:13:01.12349396Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 1.011 ms
2026-05-05T07:13:01.147861694Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-05T07:13:01.148418359Z GET /api/bookings?page=1&limit=15 304 - - 0.858 ms
2026-05-05T07:13:03.024007003Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:13:03.493816989Z GET /api/notifications 304 - - 1672.902 ms
2026-05-05T07:13:03.583906291Z GET /api/settings/dropdowns 304 - - 587.456 ms
2026-05-05T07:13:03.659791528Z getBookingsQuery_mosakban: 635.659ms
2026-05-05T07:13:03.661013295Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 200 - - 636.762 ms
2026-05-05T07:13:07.833163591Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-05T07:13:07.96369032Z getBookingsQuery_mosakf09: 130.397ms
2026-05-05T07:13:07.964243565Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=4&limit=15 304 - - 131.421 ms
2026-05-05T07:13:10.262297375Z GET /api/bookings/calendar?month=5&year=2026 304 - - 137.465 ms
2026-05-05T07:13:12.332385466Z GET /api/bookings/calendar?month=6&year=2026 304 - - 71.244 ms
2026-05-05T07:13:13.644421061Z GET /api/bookings/calendar?month=7&year=2026 304 - - 68.556 ms
2026-05-05T07:13:16.377791487Z GET /api/bookings/calendar?month=8&year=2026 304 - - 1777.723 ms
2026-05-05T07:13:18.229619423Z GET /api/bookings/calendar?month=9&year=2026 304 - - 68.222 ms
2026-05-05T07:13:19.309080352Z GET /api/bookings/calendar?month=10&year=2026 304 - - 68.336 ms
2026-05-05T07:13:20.284418303Z GET /api/bookings/calendar?month=11&year=2026 304 - - 68.038 ms
2026-05-05T07:13:22.714044914Z GET /api/bookings/calendar?month=4&year=2026 304 - - 137.132 ms
2026-05-05T07:13:24.08589912Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:13:24.086337818Z GET /api/notifications 304 - - 0.679 ms
2026-05-05T07:13:25.024544017Z GET /api/bookings/calendar?month=3&year=2026 304 - - 209.544 ms
2026-05-05T07:13:26.899652612Z GET /api/bookings/calendar?month=2&year=2026 304 - - 911.724 ms
2026-05-05T07:13:33.592198152Z GET /api/bookings/calendar?month=1&year=2026 304 - - 5367.368 ms
2026-05-05T07:13:45.778308819Z GET /api/notifications 304 - - 1121.877 ms
2026-05-05T07:13:45.781286317Z GET /api/users 200 - - 896.565 ms
2026-05-05T07:13:59.549459399Z GET /api/analytics/bookings?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 238 - 247.104 ms
2026-05-05T07:13:59.568580027Z GET /api/analytics/revenue-trends?interval=month&companyName= 304 - - 256.183 ms
2026-05-05T07:13:59.591162603Z GET /api/analytics/agents?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 292.355 ms
2026-05-05T07:13:59.621145177Z GET /api/analytics/payments?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 101 - 337.355 ms
2026-05-05T07:13:59.840843184Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 - - 519.435 ms
2026-05-05T07:14:06.37689644Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T07:14:06.377187289Z GET /api/notifications 304 - - 0.638 ms
2026-05-05T07:14:41.047665777Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:15:12.723980976Z GET /api/settings/dropdowns 304 - - 33228.406 ms
2026-05-05T07:15:12.734807582Z GET /api/users/agents 304 - - 31839.616 ms
2026-05-05T07:15:13.409647693Z GET /api/notifications 304 - - 46375.781 ms
2026-05-05T07:15:13.409999765Z GET /api/users/agents 200 - - 9270.259 ms
2026-05-05T07:15:13.418371616Z getBookingsQuery_mosamexj: 32.371s
2026-05-05T07:15:13.418938242Z GET /api/bookings?page=1&limit=15 304 - - 32371.605 ms
2026-05-05T07:15:13.955597519Z deleteBooking_69f994e42bb8ca399b17b2b7: 171.369ms
2026-05-05T07:15:13.9556166Z DELETE /api/bookings/69f994e42bb8ca399b17b2b7 200 66 - 22923.139 ms
2026-05-05T07:15:14.548644305Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:15:14.696561077Z getBookingsQuery_mosan4s4: 145.038ms
2026-05-05T07:15:14.702469382Z GET /api/bookings?page=1&limit=15 200 - - 155.233 ms
2026-05-05T07:15:46.724319725Z POST /api/bookings 201 - - 719.233 ms
2026-05-05T07:15:47.324785477Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:15:47.452324361Z getBookingsQuery_mosanu2k: 127.46ms
2026-05-05T07:15:47.453498505Z GET /api/bookings?page=1&limit=15 200 - - 128.497 ms
2026-05-05T07:15:50.804497829Z GET /api/users/agents 304 - - 63.451 ms
2026-05-05T07:15:53.236510011Z deleteBooking_69f999222bb8ca399b17b4f1: 122.801ms
2026-05-05T07:15:53.236588156Z DELETE /api/bookings/69f999222bb8ca399b17b4f1 200 66 - 188.209 ms
2026-05-05T07:15:53.795471947Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T07:15:53.933932878Z getBookingsQuery_mosanz2b: 137.625ms
2026-05-05T07:15:53.934922731Z GET /api/bookings?page=1&limit=15 200 - - 138.638 ms
2026-05-05T07:15:54.024846516Z GET /api/notifications 304 - - 68.150 ms
2026-05-05T07:15:57.17319418Z GET /api/analytics/bookings?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 238 - 69.237 ms
2026-05-05T07:15:57.173789318Z GET /api/analytics/revenue-trends?interval=month&companyName= 200 110 - 62.715 ms
2026-05-05T07:15:57.187249944Z GET /api/analytics/agents?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 85.220 ms
2026-05-05T07:15:57.223262723Z GET /api/analytics/payments?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 101 - 136.588 ms
2026-05-05T07:15:57.38475946Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 - - 253.915 ms