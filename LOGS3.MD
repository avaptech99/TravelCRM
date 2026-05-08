2026-05-08T10:38:36.530629545Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/sync":0,"/api/users/offline":0}
2026-05-08T10:38:36.728720174Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-08T10:38:45.324707166Z ==> Running 'npm run start'
2026-05-08T10:38:46.327317141Z 
2026-05-08T10:38:46.327348091Z > travel-crm-backend@1.0.0 start
2026-05-08T10:38:46.327352631Z > node dist/src/server.js
2026-05-08T10:38:46.327355251Z 
2026-05-08T10:38:53.031331058Z [PRIMARY] 83 is running. Forking 1 workers...
2026-05-08T10:38:53.125160731Z MongoDB Connected: undefined
2026-05-08T10:38:54.822538216Z Error: bad auth : Authentication failed.
2026-05-08T10:38:56.49376761Z ==> Exited with status 1
2026-05-08T10:38:56.497548751Z ==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
2026-05-08T10:39:01.135199804Z ==> Running 'npm run start'
2026-05-08T10:39:02.131357164Z 
2026-05-08T10:39:02.131379135Z > travel-crm-backend@1.0.0 start
2026-05-08T10:39:02.131384005Z > node dist/src/server.js
2026-05-08T10:39:02.131386735Z 
2026-05-08T10:39:08.929444547Z [PRIMARY] 71 is running. Forking 1 workers...
2026-05-08T10:39:08.93650288Z MongoDB Connected: undefined
2026-05-08T10:39:10.631192375Z Error: bad auth : Authentication failed.
2026-05-08T10:39:36.531409306Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/sync":0,"/api/users/offline":0}
2026-05-08T10:40:28.633235903Z ==> Deploying...
2026-05-08T10:40:28.708034359Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-08T10:40:36.531142678Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/sync":0,"/api/users/offline":0}
2026-05-08T10:41:33.19870647Z ==> Running 'npm run start'
2026-05-08T10:41:34.397809426Z 
2026-05-08T10:41:34.397832407Z > travel-crm-backend@1.0.0 start
2026-05-08T10:41:34.397837097Z > node dist/src/server.js
2026-05-08T10:41:34.397839987Z 
2026-05-08T10:41:35.256623189Z ==> No open ports detected, continuing to scan...
2026-05-08T10:41:35.367776854Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-05-08T10:41:36.531028488Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/sync":0,"/api/users/offline":0}
2026-05-08T10:41:40.997538111Z [PRIMARY] 83 is running. Forking 1 workers...
2026-05-08T10:41:41.094305037Z MongoDB Connected: undefined
2026-05-08T10:41:42.988826788Z MongoDB Connected: ac-g3tynuf-shard-00-01.wxmise3.mongodb.net
2026-05-08T10:41:43.39048918Z ❌ Failed to warm dropdown cache: MongoServerError: user is not allowed to do action [find] on [test.settings]
2026-05-08T10:41:43.39051909Z     at Connection.sendCommand (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cmap/connection.js:320:27)
2026-05-08T10:41:43.39052502Z     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
2026-05-08T10:41:43.39052958Z     at async Connection.command (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cmap/connection.js:344:26)
2026-05-08T10:41:43.390534021Z     at async Server.command (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/sdam/server.js:208:29)
2026-05-08T10:41:43.390538871Z     at async tryOperation (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/operations/execute_operation.js:215:32)
2026-05-08T10:41:43.390543031Z     at async executeOperation (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/operations/execute_operation.js:80:16)
2026-05-08T10:41:43.390547231Z     at async FindCursor._initialize (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/find_cursor.js:62:26)
2026-05-08T10:41:43.390551731Z     at async FindCursor.cursorInit (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:620:27)
2026-05-08T10:41:43.390555921Z     at async FindCursor.fetchBatch (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:654:13)
2026-05-08T10:41:43.390560071Z     at async FindCursor.next (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:326:17) {
2026-05-08T10:41:43.390564821Z   errorLabelSet: Set(0) {},
2026-05-08T10:41:43.390569592Z   errorResponse: {
2026-05-08T10:41:43.390573672Z     ok: 0,
2026-05-08T10:41:43.390578182Z     errmsg: 'user is not allowed to do action [find] on [test.settings]',
2026-05-08T10:41:43.390582372Z     code: 8000,
2026-05-08T10:41:43.390586752Z     codeName: 'AtlasError'
2026-05-08T10:41:43.390590812Z   },
2026-05-08T10:41:43.390591032Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-08T10:41:43.390595912Z   ok: 0,
2026-05-08T10:41:43.390600292Z   code: 8000,
2026-05-08T10:41:43.390631663Z   codeName: 'AtlasError'
2026-05-08T10:41:43.390637053Z }
2026-05-08T10:41:43.391576893Z 🚀 Primary startup tasks complete.
2026-05-08T10:41:43.491474737Z [FollowUp Cron] Error processing follow-up reminders: MongoServerError: user is not allowed to do action [find] on [test.bookings]
2026-05-08T10:41:43.491505368Z     at Connection.sendCommand (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cmap/connection.js:320:27)
2026-05-08T10:41:43.491513558Z     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
2026-05-08T10:41:43.491519869Z     at async Connection.command (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cmap/connection.js:344:26)
2026-05-08T10:41:43.491525949Z     at async Server.command (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/sdam/server.js:208:29)
2026-05-08T10:41:43.491532559Z     at async tryOperation (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/operations/execute_operation.js:215:32)
2026-05-08T10:41:43.49156569Z     at async executeOperation (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/operations/execute_operation.js:80:16)
2026-05-08T10:41:43.491568759Z     at async FindCursor._initialize (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/find_cursor.js:62:26)
2026-05-08T10:41:43.49157461Z     at async FindCursor.cursorInit (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:620:27)
2026-05-08T10:41:43.49157718Z     at async FindCursor.fetchBatch (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:654:13)
2026-05-08T10:41:43.49157967Z     at async FindCursor.next (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:326:17) {
2026-05-08T10:41:43.49158295Z   errorLabelSet: Set(0) {},
2026-05-08T10:41:43.49158604Z   errorResponse: {
2026-05-08T10:41:43.49158861Z     ok: 0,
2026-05-08T10:41:43.49159165Z     errmsg: 'user is not allowed to do action [find] on [test.bookings]',
2026-05-08T10:41:43.49159416Z     code: 8000,
2026-05-08T10:41:43.49159663Z     codeName: 'AtlasError'
2026-05-08T10:41:43.49159903Z   },
2026-05-08T10:41:43.49160151Z   ok: 0,
2026-05-08T10:41:43.49160391Z   code: 8000,
2026-05-08T10:41:43.49160683Z   codeName: 'AtlasError'
2026-05-08T10:41:43.49160928Z }
2026-05-08T10:41:49.793978722Z MongoDB Connected: undefined
2026-05-08T10:41:50.692437885Z MongoDB Connected: ac-g3tynuf-shard-00-01.wxmise3.mongodb.net
2026-05-08T10:41:50.810667638Z ❌ Failed to warm dropdown cache: MongoServerError: user is not allowed to do action [find] on [test.settings]
2026-05-08T10:41:50.810704359Z     at Connection.sendCommand (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cmap/connection.js:320:27)
2026-05-08T10:41:50.810713109Z     at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
2026-05-08T10:41:50.810719499Z     at async Connection.command (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cmap/connection.js:344:26)
2026-05-08T10:41:50.8107262Z     at async Server.command (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/sdam/server.js:208:29)
2026-05-08T10:41:50.81073196Z     at async tryOperation (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/operations/execute_operation.js:215:32)
2026-05-08T10:41:50.81073586Z     at async executeOperation (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/operations/execute_operation.js:80:16)
2026-05-08T10:41:50.81073964Z     at async FindCursor._initialize (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/find_cursor.js:62:26)
2026-05-08T10:41:50.81074339Z     at async FindCursor.cursorInit (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:620:27)
2026-05-08T10:41:50.81074742Z     at async FindCursor.fetchBatch (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:654:13)
2026-05-08T10:41:50.81075121Z     at async FindCursor.next (/opt/render/project/src/travel-crm-backend/node_modules/mongodb/lib/cursor/abstract_cursor.js:326:17) {
2026-05-08T10:41:50.81075687Z   errorLabelSet: Set(0) {},
2026-05-08T10:41:50.81076139Z   errorResponse: {
2026-05-08T10:41:50.81076532Z     ok: 0,
2026-05-08T10:41:50.810770901Z     errmsg: 'user is not allowed to do action [find] on [test.settings]',
2026-05-08T10:41:50.81077481Z     code: 8000,
2026-05-08T10:41:50.810778641Z     codeName: 'AtlasError'
2026-05-08T10:41:50.810782621Z   },
2026-05-08T10:41:50.810786521Z   ok: 0,
2026-05-08T10:41:50.810803831Z   code: 8000,
2026-05-08T10:41:50.810806501Z   codeName: 'AtlasError'
2026-05-08T10:41:50.810808941Z }
2026-05-08T10:41:50.895412372Z [WORKER] 95 started on port 10000
2026-05-08T10:41:51.426320817Z HEAD / 200 36 - 2.193 ms
2026-05-08T10:41:59.647541287Z ==> Your service is live 🎉
2026-05-08T10:41:59.739055419Z GET / 200 36 - 0.517 ms
2026-05-08T10:41:59.750651019Z ==> 
2026-05-08T10:41:59.753361246Z ==> ///////////////////////////////////////////////////////////
2026-05-08T10:41:59.75571408Z ==> 
2026-05-08T10:41:59.757911784Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-08T10:41:59.760093877Z ==> 
2026-05-08T10:41:59.762254258Z ==> ///////////////////////////////////////////////////////////
2026-05-08T10:42:22.424853739Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 33MB
2026-05-08T10:42:22.710477535Z [POLL] GET /api/notifications — 13ms | Status: 500 | Cache: MISS | Heap: 33MB
2026-05-08T10:42:22.710514036Z GET /api/notifications 500 90 - 11.678 ms
2026-05-08T10:42:22.886992477Z [POLL] OPTIONS /api/sync — 0ms | Status: 204 | Cache: MISS | Heap: 33MB
2026-05-08T10:42:23.187336713Z [POLL] GET /api/sync — 7ms | Status: 500 | Cache: MISS | Heap: 34MB
2026-05-08T10:42:23.187364203Z GET /api/sync 500 85 - 6.489 ms
2026-05-08T10:42:36.530752511Z [POLL RATE] Last 60s: {"/api/notifications":0,"/api/sync":0,"/api/users/offline":0}
2026-05-08T10:42:49.792873495Z [POLL RATE] Last 60s: {"/":2,"/api/notifications":2,"/api/sync":2}
2026-05-08T10:43:49.793281418Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/sync":0}
2026-05-08T10:44:49.793917487Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/sync":0}
2026-05-08T10:45:49.793969884Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/sync":0}
2026-05-08T10:46:44.229106994Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 32MB
2026-05-08T10:46:44.238937898Z [POLL] OPTIONS /api/sync — 0ms | Status: 204 | Cache: MISS | Heap: 32MB
2026-05-08T10:46:44.563870978Z [POLL] GET /api/notifications — 7ms | Status: 500 | Cache: MISS | Heap: 32MB
2026-05-08T10:46:44.563888349Z GET /api/notifications 500 90 - 6.503 ms
2026-05-08T10:46:44.58417071Z [POLL] GET /api/sync — 6ms | Status: 500 | Cache: MISS | Heap: 32MB
2026-05-08T10:46:44.58419299Z GET /api/sync 500 85 - 5.417 ms
2026-05-08T10:46:46.789716187Z POST /api/users/offline 500 82 - 67.749 ms
2026-05-08T10:46:49.794841292Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":2,"/api/sync":2,"/api/users/offline":2}
2026-05-08T10:46:56.026235662Z ==> Detected service running on port 10000
2026-05-08T10:46:56.15700707Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-05-08T10:47:05.031632573Z ==> Deploying...
2026-05-08T10:47:05.169799783Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-08T10:47:17.378207457Z ==> Running 'npm run start'
2026-05-08T10:47:18.478076087Z 
2026-05-08T10:47:18.478102058Z > travel-crm-backend@1.0.0 start
2026-05-08T10:47:18.478107858Z > node dist/src/server.js
2026-05-08T10:47:18.478111118Z 
2026-05-08T10:47:24.881191256Z [PRIMARY] 84 is running. Forking 1 workers...
2026-05-08T10:47:25.069759781Z ✅ MongoDB Connected: undefined | Database: undefined
2026-05-08T10:47:27.173891806Z ✅ MongoDB Connected: ac-g3tynuf-shard-00-02.wxmise3.mongodb.net | Database: TESTDATA
2026-05-08T10:47:27.972414258Z ✅ Dropdown cache warmed successfully
2026-05-08T10:47:27.972453819Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-08T10:47:27.973314533Z 🚀 Primary startup tasks complete.
2026-05-08T10:47:33.271052966Z ✅ MongoDB Connected: undefined | Database: undefined
2026-05-08T10:47:34.178762117Z ✅ MongoDB Connected: ac-g3tynuf-shard-00-02.wxmise3.mongodb.net | Database: TESTDATA
2026-05-08T10:47:34.478122743Z ✅ Dropdown cache warmed successfully
2026-05-08T10:47:34.57294394Z [WORKER] 96 started on port 10000
2026-05-08T10:47:34.871086443Z HEAD / 200 36 - 1.988 ms
2026-05-08T10:47:36.084137947Z ==> Your service is live 🎉
2026-05-08T10:47:36.168008042Z GET / 200 36 - 0.514 ms
2026-05-08T10:47:36.189131098Z ==> 
2026-05-08T10:47:36.192421357Z ==> ///////////////////////////////////////////////////////////
2026-05-08T10:47:36.195568033Z ==> 
2026-05-08T10:47:36.200072931Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-08T10:47:36.2033734Z ==> 
2026-05-08T10:47:36.206337062Z ==> ///////////////////////////////////////////////////////////
2026-05-08T10:47:49.794364852Z [POLL RATE] Last 60s: {"/":0,"/api/notifications":0,"/api/sync":0,"/api/users/offline":0}
2026-05-08T10:47:59.127754136Z [POLL] OPTIONS /api/sync — 1ms | Status: 204 | Cache: MISS | Heap: 33MB
2026-05-08T10:47:59.593810714Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 33MB
2026-05-08T10:47:59.894377694Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 8ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 8ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-08T10:47:59.895006181Z [POLL] GET / — 12ms | Status: 200 | Cache: MISS | Heap: 33MB
2026-05-08T10:47:59.895030022Z GET /api/notifications 200 2 - 11.661 ms
2026-05-08T10:47:59.98359206Z [PERF] getGlobalSync — Total: 63ms | dbQuery: 63ms | formatResponse: 0ms { source: 'db', bookingsCount: 5 }
2026-05-08T10:48:00.075856697Z [POLL] GET / — 156ms | Status: 200 | Cache: MISS | Heap: 34MB
2026-05-08T10:48:00.075883538Z GET /api/sync 200 - - 63.806 ms
2026-05-08T10:48:02.822826256Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T10:48:03.12169282Z [PERF] getBookings — Total: 9ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 9ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-08T10:48:03.170388333Z GET /api/bookings?page=1&limit=15 304 - - 10.560 ms
2026-05-08T10:48:03.172166162Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-08T10:48:03.172904762Z [POLL] GET /dropdowns — 1ms | Status: 200 | Cache: HIT | Heap: 34MB
2026-05-08T10:48:03.172932902Z GET /api/settings/dropdowns 200 278 - 0.948 ms
2026-05-08T10:48:03.644617264Z [PERF] getAgents — Total: 4ms | finalProcessing: 4ms { source: 'db', count: 12 }
2026-05-08T10:48:03.646140156Z GET /api/users/agents 200 - - 4.578 ms
2026-05-08T10:48:06.473171451Z [PERF] getBookings — Total: 6ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 6ms { page: 1, limit: 15, total: 11, returned: 11 }
2026-05-08T10:48:06.473587893Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 7.838 ms
2026-05-08T10:48:08.954995654Z [PERF] getBookings — Total: 5ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 5ms { page: 1, limit: 15, total: 4, returned: 4 }
2026-05-08T10:48:08.955476777Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 6.439 ms
2026-05-08T10:48:10.50287435Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 1, limit: 15, total: 60, returned: 15 }
2026-05-08T10:48:10.503497487Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 8.311 ms
2026-05-08T10:48:12.141091393Z GET /api/bookings/calendar?month=5&year=2026 304 - - 11.178 ms
2026-05-08T10:48:14.619070113Z GET /api/bookings/calendar?month=6&year=2026 304 - - 5.526 ms
2026-05-08T10:48:15.84064442Z GET /api/bookings/calendar?month=7&year=2026 304 - - 3.510 ms
2026-05-08T10:48:18.014059442Z GET /api/bookings/calendar?month=4&year=2026 304 - - 13.013 ms
2026-05-08T10:48:18.986302011Z GET /api/bookings/calendar?month=3&year=2026 304 - - 2.979 ms
2026-05-08T10:48:19.884260462Z GET /api/bookings/calendar?month=2&year=2026 304 - - 2.732 ms
2026-05-08T10:48:20.195228775Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-08T10:48:20.470066476Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:48:20.470489138Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 35MB
2026-05-08T10:48:20.470502428Z GET /api/notifications 304 - - 0.814 ms
2026-05-08T10:48:20.842062529Z GET /api/bookings/calendar?month=1&year=2026 304 - - 2.594 ms
2026-05-08T10:48:22.828613723Z GET /api/bookings/calendar?month=8&year=2026 304 - - 2.873 ms
2026-05-08T10:48:23.711978306Z GET /api/bookings/calendar?month=9&year=2026 304 - - 2.727 ms
2026-05-08T10:48:24.627855075Z GET /api/bookings/calendar?month=10&year=2026 304 - - 2.573 ms
2026-05-08T10:48:25.680748947Z GET /api/bookings/calendar?month=11&year=2026 304 - - 2.742 ms
2026-05-08T10:48:30.548103638Z [PERF] getAllUsers — Total: 3ms | checkCache: 0ms | dbQuery: 1ms | formatResponse: 2ms { source: 'db', count: 14 }
2026-05-08T10:48:30.54999813Z GET /api/users 200 - - 4.208 ms
2026-05-08T10:48:33.269907072Z [POLL RATE] Last 60s: {"/":2,"/api/sync":2,"/api/notifications":4,"/api/bookings":8,"/api/settings/dropdowns":2,"/api/users/agents":2,"/api/bookings/calendar":22,"/api/users":2}
2026-05-08T10:48:37.583877183Z GET /api/analytics/payment-breakdown?fromDate=2026-04-08&toDate=2026-05-08&company= 304 - - 15.864 ms
2026-05-08T10:48:37.774728502Z GET /api/analytics/bookings?fromDate=2026-04-08&toDate=2026-05-08&company= 200 263 - 182.456 ms
2026-05-08T10:48:37.774747452Z GET /api/analytics/agents?fromDate=2026-04-08&toDate=2026-05-08&company= 304 - - 186.000 ms
2026-05-08T10:48:37.97034424Z GET /api/analytics/revenue-trends?interval=week&company= 304 - - 197.884 ms
2026-05-08T10:48:38.171500149Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 200.388 ms
2026-05-08T10:48:39.458036745Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 10.948 ms
2026-05-08T10:48:40.73714392Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T10:48:41.029249401Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 1ms | checkCache: 1ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:48:41.029861378Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 34MB
2026-05-08T10:48:41.029886299Z GET /api/notifications 304 - - 0.758 ms
2026-05-08T10:48:41.745839653Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 4.697 ms
2026-05-08T10:49:01.314780798Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T10:49:01.611734182Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:49:01.611764643Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 34MB
2026-05-08T10:49:01.611770403Z GET /api/notifications 304 - - 1.046 ms
2026-05-08T10:49:05.453781956Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T10:49:05.751747628Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-08T10:49:05.75218748Z [POLL] GET /dropdowns — 1ms | Status: 304 | Cache: HIT | Heap: 34MB
2026-05-08T10:49:05.752277532Z GET /api/settings/dropdowns 304 - - 0.739 ms
2026-05-08T10:49:09.734428167Z [POLL] OPTIONS /api/settings/dropdowns/costTypes — 1ms | Status: 204 | Cache: MISS | Heap: 34MB
2026-05-08T10:49:10.083337634Z [POLL] PUT /dropdowns/costTypes — 42ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:10.083354654Z PUT /api/settings/dropdowns/costTypes 200 104 - 41.982 ms
2026-05-08T10:49:10.359063941Z [PERF] getDropdowns — Total: 2ms | finalProcessing: 2ms { source: 'db' }
2026-05-08T10:49:10.359479262Z [POLL] GET /dropdowns — 4ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:10.359571985Z GET /api/settings/dropdowns 200 266 - 3.261 ms
2026-05-08T10:49:11.640966347Z [POLL] PUT /dropdowns/costTypes — 12ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:11.640984358Z PUT /api/settings/dropdowns/costTypes 200 95 - 11.905 ms
2026-05-08T10:49:11.922252665Z [POLL] OPTIONS /api/settings/dropdowns — 1ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:12.221371908Z [PERF] getDropdowns — Total: 3ms | finalProcessing: 3ms { source: 'db' }
2026-05-08T10:49:12.222270773Z [POLL] GET /dropdowns — 3ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:12.222282373Z GET /api/settings/dropdowns 200 257 - 3.175 ms
2026-05-08T10:49:15.123309575Z [POLL] OPTIONS /api/settings/dropdowns/costSources — 1ms | Status: 204 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:15.426051527Z [POLL] PUT /dropdowns/costSources — 8ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:15.426076277Z PUT /api/settings/dropdowns/costSources 200 81 - 8.267 ms
2026-05-08T10:49:15.696736067Z [PERF] getDropdowns — Total: 2ms | finalProcessing: 2ms { source: 'db' }
2026-05-08T10:49:15.696767828Z [POLL] GET /dropdowns — 4ms | Status: 200 | Cache: MISS | Heap: 35MB
2026-05-08T10:49:15.696772238Z GET /api/settings/dropdowns 200 250 - 3.195 ms
2026-05-08T10:49:16.815187649Z [PERF] getBookings — Total: 10ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 9ms | finalProcessing: 1ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-08T10:49:16.815868517Z GET /api/bookings?page=1&limit=15 304 - - 10.671 ms
2026-05-08T10:49:16.838534184Z [PERF] getAgents — Total: 0ms |  { source: 'cache' }
2026-05-08T10:49:16.839094449Z GET /api/users/agents 304 - - 0.798 ms
2026-05-08T10:49:19.605378168Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 1, limit: 15, total: 18, returned: 15 }
2026-05-08T10:49:19.605877302Z GET /api/bookings?status=Pending&page=1&limit=15 304 - - 7.411 ms
2026-05-08T10:49:21.895726707Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 36MB
2026-05-08T10:49:22.166310684Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:49:22.166553681Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 36MB
2026-05-08T10:49:22.166560601Z GET /api/notifications 304 - - 0.819 ms
2026-05-08T10:57:15.378129327Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 37MB
2026-05-08T10:57:15.660675881Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:57:15.66099969Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 37MB
2026-05-08T10:57:15.661014001Z GET /api/notifications 304 - - 0.692 ms
2026-05-08T10:57:17.205202647Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 38MB
2026-05-08T10:57:17.485495009Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-08T10:57:17.485860839Z [POLL] GET /dropdowns — 0ms | Status: 304 | Cache: HIT | Heap: 37MB
2026-05-08T10:57:17.485879Z GET /api/settings/dropdowns 304 - - 0.405 ms
2026-05-08T10:57:17.486558319Z [PERF] getBookings — Total: 6ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 6ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T10:57:17.486997061Z GET /api/bookings?page=1&limit=15 304 - - 7.074 ms
2026-05-08T10:57:17.495404113Z [PERF] getAgents — Total: 0ms |  { source: 'cache' }
2026-05-08T10:57:17.49567631Z GET /api/users/agents 304 - - 0.363 ms
2026-05-08T10:57:18.280640314Z [PERF] getAgents — Total: 0ms |  { source: 'cache' }
2026-05-08T10:57:18.281092856Z GET /api/users/agents 304 - - 0.769 ms
2026-05-08T10:57:20.258851653Z GET /api/analytics/revenue-trends?interval=week&company= 200 424 - 13.135 ms
2026-05-08T10:57:20.259569523Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 7.899 ms
2026-05-08T10:57:20.259767148Z GET /api/analytics/payment-breakdown?fromDate=2026-04-08&toDate=2026-05-08&company= 200 - - 19.252 ms
2026-05-08T10:57:20.740386226Z GET /api/analytics/agents?fromDate=2026-04-08&toDate=2026-05-08&company= 304 - - 28.705 ms
2026-05-08T10:57:20.753319243Z GET /api/analytics/bookings?fromDate=2026-04-08&toDate=2026-05-08&company= 200 263 - 4.920 ms
2026-05-08T10:57:21.539874921Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 3.180 ms
2026-05-08T10:57:23.850075938Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 3.198 ms
2026-05-08T10:57:27.051335326Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company=Skylight 500 343 - 2.893 ms
2026-05-08T10:57:27.052894579Z GET /api/analytics/revenue-trends?interval=week&company=Skylight 304 - - 11.108 ms
2026-05-08T10:57:27.054829582Z GET /api/analytics/agents?fromDate=2026-04-08&toDate=2026-05-08&company=Skylight 304 - - 3.063 ms
2026-05-08T10:57:27.070558447Z GET /api/analytics/payment-breakdown?fromDate=2026-04-08&toDate=2026-05-08&company=Skylight 304 - - 6.309 ms
2026-05-08T10:57:27.078988219Z GET /api/analytics/bookings?fromDate=2026-04-08&toDate=2026-05-08&company=Skylight 304 - - 3.072 ms
2026-05-08T10:57:28.33767697Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company=Skylight 500 343 - 3.018 ms
2026-05-08T10:57:30.6229322Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company=Skylight 500 343 - 5.094 ms
2026-05-08T10:57:33.271096172Z [POLL RATE] Last 60s: {"/":0,"/api/sync":0,"/api/notifications":4,"/api/bookings":2,"/api/settings/dropdowns":2,"/api/users/agents":3,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/revenue-trends":4,"/api/analytics/payment-breakdown":4,"/api/analytics/bookings":4,"/api/analytics/payments":8,"/api/analytics/agents":4,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69c621ad220e3d8fa652f618":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69fc3a6719eb82df2514ff43":0,"/api/bookings/69da1634519a503fc23f01a6":0,"/api/bookings/69e5faf1519a503fc23f44b5":0,"/api/bookings/69e36d36519a503fc23f3bdc":0,"/api/bookings/69dca7ff519a503fc23f0cf6":0,"/api/bookings/69cf6a3f980a4dc08bdcc3f9":0,"/api/bookings/69ce1dce12d6ce0419001bd0":0,"/api/bookings/69f08d221229ef87385899a8":0,"/api/bookings/69d77b38519a503fc23eed2b":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69ef069510f271cd9cd4cdf7":0,"/api/bookings/69f57f918148832a3c146333":0,"/api/bookings/69ecca4dd8cfa03b17e3a3f0":0,"/api/bookings/69e22264519a503fc23f32c3":0,"/api/bookings/69fadfe419eb82df2514f05e":0,"/api/bookings/69de2129519a503fc23f1a02":0,"/api/bookings/69fc326519eb82df2514fe81":0,"/api/bookings/69fc1cdc19eb82df2514fb97":0,"/api/bookings/69f9a1763ed07ab843f39163":0,"/api/bookings/69fadb9119eb82df2514ef84":0,"/api/bookings/69f3077267553ddabb891b8c":0,"/api/bookings/69e51665519a503fc23f3d4a":0,"/api/bookings/69fb1c6819eb82df2514f779":0,"/api/bookings/69ef111a10f271cd9cd4d090":0,"/api/bookings/69fc56a119eb82df251502f0":0,"/api/bookings/69e3550e519a503fc23f39ac":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69fdc0ae489d19d4850ae4ff":5,"/api/bookings/69fdc0ae489d19d4850ae4ff/status":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/payments":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/payments/69fdc125489d19d4850ae532":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/passengers":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/verify":5}
2026-05-08T10:57:34.486948241Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company=Travowords 500 343 - 7.227 ms
2026-05-08T10:57:34.487685632Z GET /api/analytics/payment-breakdown?fromDate=2026-04-08&toDate=2026-05-08&company=Travowords 200 437 - 10.320 ms
2026-05-08T10:57:34.488195996Z GET /api/analytics/bookings?fromDate=2026-04-08&toDate=2026-05-08&company=Travowords 200 122 - 7.257 ms
2026-05-08T10:57:34.506029118Z GET /api/analytics/revenue-trends?interval=week&company=Travowords 200 42 - 8.309 ms
2026-05-08T10:57:34.518587314Z GET /api/analytics/agents?fromDate=2026-04-08&toDate=2026-05-08&company=Travowords 200 2 - 3.924 ms
2026-05-08T10:57:35.796783304Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company=Travowords 500 343 - 3.355 ms
2026-05-08T10:57:35.951198054Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 38MB
2026-05-08T10:57:36.244725421Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:57:36.245223764Z [POLL] GET / — 2ms | Status: 304 | Cache: HIT | Heap: 39MB
2026-05-08T10:57:36.245241365Z GET /api/notifications 304 - - 0.726 ms
2026-05-08T10:57:38.118332775Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company=Travowords 500 343 - 3.497 ms
2026-05-08T10:57:56.525200016Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 39MB
2026-05-08T10:57:56.802127476Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:57:56.802441214Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 39MB
2026-05-08T10:57:56.802455994Z GET /api/notifications 304 - - 0.575 ms
2026-05-08T10:58:06.17904443Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T10:58:06.179755599Z GET /api/bookings?page=1&limit=15 304 - - 1.132 ms
2026-05-08T10:58:07.365093738Z [GET] /api/bookings/69fdc0ae489d19d4850ae4ff
2026-05-08T10:58:07.371713001Z getBookingById_69fdc0ae489d19d4850ae4ff: 6.527ms
2026-05-08T10:58:07.371788233Z [PERF] getBookingById_69fdc0ae489d19d4850ae4ff — Total: 7ms | checkCache: 0ms | dbQueryParallel: 7ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69fdc0ae489d19d4850ae4ff' }
2026-05-08T10:58:07.373090579Z GET /api/bookings/69fdc0ae489d19d4850ae4ff 200 - - 7.675 ms
2026-05-08T10:58:17.100166395Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 39MB
2026-05-08T10:58:17.386669169Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 5ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 5ms { source: 'db', userId: '69ae7ab0c8fbcb313fa0c744', count: 0 }
2026-05-08T10:58:17.38669689Z [POLL] GET / — 8ms | Status: 304 | Cache: MISS | Heap: 39MB
2026-05-08T10:58:17.38670327Z GET /api/notifications 304 - - 7.077 ms
2026-05-08T10:58:21.517979098Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 39MB
2026-05-08T10:58:21.79064937Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-08T10:58:21.791435542Z [POLL] GET /dropdowns — 2ms | Status: 304 | Cache: HIT | Heap: 39MB
2026-05-08T10:58:21.791447702Z GET /api/settings/dropdowns 304 - - 0.711 ms
2026-05-08T10:58:22.905692921Z [PERF] getAgents — Total: 0ms |  { source: 'cache' }
2026-05-08T10:58:22.906096912Z GET /api/users/agents 304 - - 0.838 ms
2026-05-08T10:58:22.915012798Z [PERF] getBookings — Total: 7ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 7ms { page: 1, limit: 15, total: 614, returned: 15 }
2026-05-08T10:58:22.915614894Z GET /api/bookings?page=1&limit=15 304 - - 7.708 ms
2026-05-08T10:58:33.271271384Z [POLL RATE] Last 60s: {"/":0,"/api/sync":0,"/api/notifications":6,"/api/bookings":4,"/api/settings/dropdowns":2,"/api/users/agents":2,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/revenue-trends":2,"/api/analytics/payment-breakdown":2,"/api/analytics/bookings":2,"/api/analytics/payments":4,"/api/analytics/agents":2,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69c621ad220e3d8fa652f618":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69fc3a6719eb82df2514ff43":0,"/api/bookings/69da1634519a503fc23f01a6":0,"/api/bookings/69e5faf1519a503fc23f44b5":0,"/api/bookings/69e36d36519a503fc23f3bdc":0,"/api/bookings/69dca7ff519a503fc23f0cf6":0,"/api/bookings/69cf6a3f980a4dc08bdcc3f9":0,"/api/bookings/69ce1dce12d6ce0419001bd0":0,"/api/bookings/69f08d221229ef87385899a8":0,"/api/bookings/69d77b38519a503fc23eed2b":0,"/api/bookings/69c2a2988787a5edc514402a":0,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69ef069510f271cd9cd4cdf7":0,"/api/bookings/69f57f918148832a3c146333":0,"/api/bookings/69ecca4dd8cfa03b17e3a3f0":0,"/api/bookings/69e22264519a503fc23f32c3":0,"/api/bookings/69fadfe419eb82df2514f05e":0,"/api/bookings/69de2129519a503fc23f1a02":0,"/api/bookings/69fc326519eb82df2514fe81":0,"/api/bookings/69fc1cdc19eb82df2514fb97":0,"/api/bookings/69f9a1763ed07ab843f39163":0,"/api/bookings/69fadb9119eb82df2514ef84":0,"/api/bookings/69f3077267553ddabb891b8c":0,"/api/bookings/69e51665519a503fc23f3d4a":0,"/api/bookings/69fb1c6819eb82df2514f779":0,"/api/bookings/69ef111a10f271cd9cd4d090":0,"/api/bookings/69fc56a119eb82df251502f0":0,"/api/bookings/69e3550e519a503fc23f39ac":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69fdc0ae489d19d4850ae4ff":2,"/api/bookings/69fdc0ae489d19d4850ae4ff/status":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/payments":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/payments/69fdc125489d19d4850ae532":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/passengers":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/verify":0}
2026-05-08T10:58:33.755935514Z [PERF] getAgents — Total: 0ms |  { source: 'cache' }
2026-05-08T10:58:33.755966125Z GET /api/users/agents 304 - - 0.787 ms
2026-05-08T10:58:36.406095714Z [PERF] deleteBooking_69fdc0ae489d19d4850ae4ff — Total: 7ms | deleteBookingDoc: 2ms | finalProcessing: 5ms { bookingId: '69fdc0ae489d19d4850ae4ff' }
2026-05-08T10:58:36.406364802Z DELETE /api/bookings/69fdc0ae489d19d4850ae4ff 200 74 - 8.135 ms
2026-05-08T10:58:36.434143568Z [BG:OK] deleteBooking_cleanup_69fdc0ae489d19d4850ae4ff: 28ms
2026-05-08T10:58:36.998783035Z [PERF] getBookings — Total: 6ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 6ms { page: 1, limit: 15, total: 613, returned: 15 }
2026-05-08T10:58:36.999935347Z GET /api/bookings?page=1&limit=15 200 - - 6.906 ms
2026-05-08T10:58:37.685197431Z [POLL] OPTIONS /api/notifications — 1ms | Status: 204 | Cache: MISS | Heap: 39MB
2026-05-08T10:58:37.986684068Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:58:37.987063909Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 39MB
2026-05-08T10:58:37.987074599Z GET /api/notifications 304 - - 0.673 ms
2026-05-08T10:58:44.455408382Z [PERF] getBookings — Total: 6ms | checkCache: 0ms | parseFilters: 0ms | dbQuery: 6ms { page: 41, limit: 15, total: 613, returned: 13 }
2026-05-08T10:58:44.455904456Z GET /api/bookings?page=41&limit=15 304 - - 6.920 ms
2026-05-08T10:58:46.597731803Z [GET] /api/bookings/69c2a2988787a5edc514402a
2026-05-08T10:58:46.609647442Z getBookingById_69c2a2988787a5edc514402a: 11.548ms
2026-05-08T10:58:46.609678483Z [PERF] getBookingById_69c2a2988787a5edc514402a — Total: 12ms | checkCache: 0ms | dbQueryParallel: 12ms | calculateTotals: 0ms | formatResponse: 0ms { source: 'db', bookingId: '69c2a2988787a5edc514402a' }
2026-05-08T10:58:46.609682293Z GET /api/bookings/69c2a2988787a5edc514402a 304 - - 12.933 ms
2026-05-08T10:59:33.271194735Z [POLL RATE] Last 60s: {"/":0,"/api/sync":0,"/api/notifications":2,"/api/bookings":4,"/api/settings/dropdowns":0,"/api/users/agents":2,"/api/bookings/calendar":0,"/api/users":0,"/api/analytics/revenue-trends":0,"/api/analytics/payment-breakdown":0,"/api/analytics/bookings":0,"/api/analytics/payments":0,"/api/analytics/agents":0,"/api/settings/dropdowns/costTypes":0,"/api/settings/dropdowns/costSources":0,"/api/bookings/69c621ad220e3d8fa652f618":0,"/api/bookings/69c61a80220e3d8fa652f3a4":0,"/api/bookings/69fc3a6719eb82df2514ff43":0,"/api/bookings/69da1634519a503fc23f01a6":0,"/api/bookings/69e5faf1519a503fc23f44b5":0,"/api/bookings/69e36d36519a503fc23f3bdc":0,"/api/bookings/69dca7ff519a503fc23f0cf6":0,"/api/bookings/69cf6a3f980a4dc08bdcc3f9":0,"/api/bookings/69ce1dce12d6ce0419001bd0":0,"/api/bookings/69f08d221229ef87385899a8":0,"/api/bookings/69d77b38519a503fc23eed2b":0,"/api/bookings/69c2a2988787a5edc514402a":2,"/api/bookings/69ca5e06220e3d8fa65311c5":0,"/api/bookings/69ef069510f271cd9cd4cdf7":0,"/api/bookings/69f57f918148832a3c146333":0,"/api/bookings/69ecca4dd8cfa03b17e3a3f0":0,"/api/bookings/69e22264519a503fc23f32c3":0,"/api/bookings/69fadfe419eb82df2514f05e":0,"/api/bookings/69de2129519a503fc23f1a02":0,"/api/bookings/69fc326519eb82df2514fe81":0,"/api/bookings/69fc1cdc19eb82df2514fb97":0,"/api/bookings/69f9a1763ed07ab843f39163":0,"/api/bookings/69fadb9119eb82df2514ef84":0,"/api/bookings/69f3077267553ddabb891b8c":0,"/api/bookings/69e51665519a503fc23f3d4a":0,"/api/bookings/69fb1c6819eb82df2514f779":0,"/api/bookings/69ef111a10f271cd9cd4d090":0,"/api/bookings/69fc56a119eb82df251502f0":0,"/api/bookings/69e3550e519a503fc23f39ac":0,"/api/bookings/69cbe26212d6ce0419000b62":0,"/api/bookings/69e72a70519a503fc23f4d40":0,"/api/bookings/69fdc0ae489d19d4850ae4ff":2,"/api/bookings/69fdc0ae489d19d4850ae4ff/status":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/payments":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/payments/69fdc125489d19d4850ae532":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/passengers":0,"/api/bookings/69fdc0ae489d19d4850ae4ff/verify":0}
2026-05-08T10:59:37.039387984Z [PERF] getBookings — Total: 0ms | checkCache: 0ms { source: 'cache' }
2026-05-08T10:59:37.039903418Z GET /api/bookings?page=41&limit=15 304 - - 0.954 ms
2026-05-08T10:59:38.296070324Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-08T10:59:38.605903242Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:59:38.606242551Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 40MB
2026-05-08T10:59:38.606252602Z GET /api/notifications 304 - - 0.597 ms
2026-05-08T10:59:50.375428828Z [PERF] loginUser — Total: 78ms | validate: 1ms | dbQuery: 3ms | bcryptVerify: 68ms | passwordUpgradeCheck: 0ms | dbUpdateStatus: 6ms { email: 'admin@travel.com', role: 'ADMIN' }
2026-05-08T10:59:50.377023182Z POST /api/auth/login 200 385 - 79.122 ms
2026-05-08T10:59:50.669182662Z [POLL] OPTIONS /api/notifications — 0ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-08T10:59:50.685494562Z [POLL] OPTIONS /api/sync — 0ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-08T10:59:50.975421121Z [PERF] getGlobalSync — Total: 8ms | dbQuery: 8ms | formatResponse: 0ms { source: 'db', bookingsCount: 5 }
2026-05-08T10:59:50.975961116Z [POLL] GET / — 8ms | Status: 304 | Cache: MISS | Heap: 40MB
2026-05-08T10:59:50.975980676Z GET /api/sync 304 - - 8.225 ms
2026-05-08T10:59:51.462831438Z [PERF] getNotifications_69ae7ab0c8fbcb313fa0c744 — Total: 0ms | checkCache: 0ms { source: 'cache', userId: '69ae7ab0c8fbcb313fa0c744' }
2026-05-08T10:59:51.462861779Z [POLL] GET / — 1ms | Status: 304 | Cache: HIT | Heap: 40MB
2026-05-08T10:59:51.462869119Z GET /api/notifications 304 - - 0.948 ms
2026-05-08T10:59:58.192214144Z [POLL] OPTIONS /api/settings/dropdowns — 0ms | Status: 204 | Cache: MISS | Heap: 40MB
2026-05-08T10:59:58.471084868Z [PERF] getAllUsers — Total: 2ms | checkCache: 0ms | dbQuery: 0ms | formatResponse: 2ms { source: 'db', count: 14 }
2026-05-08T10:59:58.472333303Z GET /api/users 200 - - 3.410 ms
2026-05-08T10:59:58.481731012Z [PERF] getDropdowns — Total: 0ms |  { source: 'cache' }
2026-05-08T10:59:58.482077321Z [POLL] GET /dropdowns — 0ms | Status: 304 | Cache: HIT | Heap: 40MB
2026-05-08T10:59:58.482086821Z GET /api/settings/dropdowns 304 - - 0.505 ms
2026-05-08T10:59:59.613219318Z GET /api/analytics/revenue-trends?interval=week&company= 200 424 - 3.094 ms
2026-05-08T10:59:59.616003135Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 2.358 ms
2026-05-08T10:59:59.646319332Z GET /api/analytics/payment-breakdown?fromDate=2026-04-08&toDate=2026-05-08&company= 200 - - 13.033 ms
2026-05-08T11:00:00.156562369Z GET /api/analytics/bookings?fromDate=2026-04-08&toDate=2026-05-08&company= 200 263 - 11.891 ms
2026-05-08T11:00:00.163615373Z GET /api/analytics/agents?fromDate=2026-04-08&toDate=2026-05-08&company= 304 - - 32.049 ms
2026-05-08T11:00:00.928561568Z GET /api/analytics/payments?fromDate=2026-04-08&toDate=2026-05-08&company= 500 329 - 5.478 ms