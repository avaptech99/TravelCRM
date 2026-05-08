2026-05-08T10:40:09.470661213Z ==> Downloading cache...
2026-05-08T10:40:09.507237835Z ==> Cloning from https://github.com/avaptech99/TravelCRM
2026-05-08T10:40:11.110020681Z ==> Checking out commit 8547e540148947fea37dc9ee3188e15192329a79 in branch CRM-2.0
2026-05-08T10:40:13.126960884Z ==> Downloaded 73MB in 2s. Extraction took 2s.
2026-05-08T10:40:15.553481954Z ==> Using Node.js version 24.14.1 (default)
2026-05-08T10:40:15.580315278Z ==> Docs on specifying a Node.js version: https://render.com/docs/node-version
2026-05-08T10:40:15.756576169Z ==> Running build command 'npm install; npm run build'...
2026-05-08T10:40:16.527431347Z 
2026-05-08T10:40:16.527473468Z up to date, audited 229 packages in 670ms
2026-05-08T10:40:16.527494788Z 
2026-05-08T10:40:16.527604302Z 28 packages are looking for funding
2026-05-08T10:40:16.527674224Z   run `npm fund` for details
2026-05-08T10:40:16.528741454Z 
2026-05-08T10:40:16.528755605Z found 0 vulnerabilities
2026-05-08T10:40:16.684900152Z 
2026-05-08T10:40:16.684923073Z > travel-crm-backend@1.0.0 build
2026-05-08T10:40:16.684926923Z > tsc
2026-05-08T10:40:16.684930073Z 
2026-05-08T10:40:21.448822332Z ==> Uploading build...
2026-05-08T10:40:25.320100383Z ==> Uploaded in 2.1s. Compression took 1.7s
2026-05-08T10:40:25.358439755Z ==> Build successful 🎉
2026-05-08T10:40:28.633235903Z ==> Deploying...
2026-05-08T10:40:28.708034359Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-08T10:41:33.19870647Z ==> Running 'npm run start'
2026-05-08T10:41:34.397809426Z 
2026-05-08T10:41:34.397832407Z > travel-crm-backend@1.0.0 start
2026-05-08T10:41:34.397837097Z > node dist/src/server.js
2026-05-08T10:41:34.397839987Z 
2026-05-08T10:41:35.256623189Z ==> No open ports detected, continuing to scan...
2026-05-08T10:41:35.367776854Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
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
2026-05-08T10:41:59.750651019Z ==> 
2026-05-08T10:41:59.753361246Z ==> ///////////////////////////////////////////////////////////
2026-05-08T10:41:59.75571408Z ==> 
2026-05-08T10:41:59.757911784Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-08T10:41:59.760093877Z ==> 
2026-05-08T10:41:59.762254258Z ==> ///////////////////////////////////////////////////////////