
2026-05-05T10:24:02.615944519Z ==> Deploying...
2026-05-05T10:24:02.683823484Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-05T10:24:19.929833703Z ==> Running 'npm run start'
2026-05-05T10:24:21.333378448Z 
2026-05-05T10:24:21.333399599Z > travel-crm-backend@1.0.0 start
2026-05-05T10:24:21.333403769Z > node dist/src/server.js
2026-05-05T10:24:21.333406239Z 
2026-05-05T10:24:29.034011042Z Server running in production mode on port 10000
2026-05-05T10:24:29.034085253Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-05T10:24:30.035871157Z HEAD / 200 36 - 1.851 ms
2026-05-05T10:24:34.224110357Z Error: Server selection timed out after 5000 ms
2026-05-05T10:24:39.055464343Z ==> Exited with status 1
2026-05-05T10:24:39.05950977Z ==> Common ways to troubleshoot your deploy: https://render.com/docs/troubleshooting-deploys
2026-05-05T10:24:45.195504085Z 
2026-05-05T10:24:52.493310388Z Server running in production mode on port 10000
2026-05-05T10:24:52.494755325Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-05T10:24:53.294438522Z HEAD / 200 36 - 3.857 ms
2026-05-05T10:24:56.242924674Z MongoDB Connected. Synchronizing indexes...
2026-05-05T10:24:56.253767819Z MongoDB Connected: ac-nvjnavm-shard-00-01.31xmkrx.mongodb.net
2026-05-05T10:24:56.365253716Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-05T10:24:56.366419725Z 🚀 Startup tasks complete. System ready.
2026-05-05T10:24:58.373396848Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-05T10:25:16.855197626Z ==> Running 'npm run start'
2026-05-05T10:25:18.057501276Z 
2026-05-05T10:25:18.057521898Z > travel-crm-backend@1.0.0 start
2026-05-05T10:25:18.057526438Z > node dist/src/server.js
2026-05-05T10:25:18.057528958Z 
2026-05-05T10:25:24.556565217Z Server running in production mode on port 10000
2026-05-05T10:25:24.55678108Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-05T10:25:28.143720746Z MongoDB Connected: ac-nvjnavm-shard-00-00.31xmkrx.mongodb.net
2026-05-05T10:25:28.217299005Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-05T10:25:28.218253831Z 🚀 Startup tasks complete. System ready.
2026-05-05T10:30:04.808185009Z ==> Deploying...
2026-05-05T10:30:04.937519584Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-05T10:30:12.171187686Z GET /api/notifications 304 - - 76.739 ms
2026-05-05T10:30:12.500267337Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:30:12.649931141Z POST /api/users/heartbeat 200 54 - 151.691 ms
2026-05-05T10:30:12.718538684Z getBookingsQuery_moshluz8: 216.577ms
2026-05-05T10:30:12.719496451Z GET /api/bookings?page=1&limit=15 304 - - 219.665 ms
2026-05-05T10:30:21.091509078Z ==> Running 'npm run start'
2026-05-05T10:30:22.279687382Z 
2026-05-05T10:30:22.279716003Z > travel-crm-backend@1.0.0 start
2026-05-05T10:30:22.279722383Z > node dist/src/server.js
2026-05-05T10:30:22.279725053Z 
2026-05-05T10:30:28.886129693Z Server running in production mode on port 10000
2026-05-05T10:30:28.886383859Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-05T10:30:29.776383465Z HEAD / 200 36 - 1.530 ms
2026-05-05T10:30:31.041633291Z MongoDB Connected. Synchronizing indexes...
2026-05-05T10:30:31.082759423Z MongoDB Connected: ac-nvjnavm-shard-00-02.31xmkrx.mongodb.net
2026-05-05T10:30:34.402019111Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-05T10:30:34.403149208Z 🚀 Startup tasks complete. System ready.
2026-05-05T10:30:34.692193361Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-05T10:30:37.689931397Z ==> Your service is live 🎉
2026-05-05T10:30:37.817982052Z ==> 
2026-05-05T10:30:37.819981755Z ==> ///////////////////////////////////////////////////////////
2026-05-05T10:30:37.822594761Z ==> 
2026-05-05T10:30:37.826048926Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-05T10:30:37.82855238Z ==> 
2026-05-05T10:30:37.830598724Z ==> ///////////////////////////////////////////////////////////
2026-05-05T10:30:38.007075955Z GET / 200 36 - 0.413 ms
2026-05-05T10:31:22.984819283Z POST /api/auth/login 401 52 - 133.843 ms
2026-05-05T10:31:48.479842188Z [LOGIN PERF] Total: 10062ms | DB: 9990ms | Bcrypt: 72ms
2026-05-05T10:34:36.43406381Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-05T10:34:36.563467405Z getBookingsQuery_moshrimp: 129.243ms
2026-05-05T10:34:36.563933545Z GET /api/bookings?status=Pending&page=2&limit=15 304 - - 130.219 ms
2026-05-05T10:34:39.855312899Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:34:39.983919324Z getBookingsQuery_moshrl9r: 128.522ms
2026-05-05T10:34:39.984412626Z GET /api/bookings?status=Pending%2CWorking&page=1&limit=15 304 - - 129.355 ms
2026-05-05T10:34:40.890449121Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:34:41.019349203Z getBookingsQuery_moshrm2i: 128.743ms
2026-05-05T10:34:41.019773313Z GET /api/bookings?status=Working&page=1&limit=15 304 - - 129.614 ms
2026-05-05T10:34:47.962306343Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:34:48.405831868Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:34:49.381475959Z getBookingsQuery_moshrriv: 1.421s
2026-05-05T10:34:49.382103524Z GET /api/bookings?status=Working%2CSent&page=1&limit=15 304 - - 1422.394 ms
2026-05-05T10:34:49.401140048Z getBookingsQuery_moshrrv8: 996.269ms
2026-05-05T10:34:49.401731372Z GET /api/bookings?status=Sent&page=1&limit=15 304 - - 997.351 ms
2026-05-05T10:34:52.319288855Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:34:52.319622602Z GET /api/notifications 304 - - 0.525 ms
2026-05-05T10:34:54.241299221Z [GET] /api/bookings - Page: 20, Limit: 15, Search: none
2026-05-05T10:35:06.541679955Z getBookingsQuery_moshrwdd: 12.300s
2026-05-05T10:35:06.542507944Z GET /api/bookings?status=Sent&page=20&limit=15 304 - - 12301.369 ms
2026-05-05T10:35:09.80836695Z [GET] /api/bookings/69df79f4519a503fc23f22dc
2026-05-05T10:35:19.410494884Z GET /api/notifications 304 - - 6421.887 ms
2026-05-05T10:35:19.584012029Z GET /api/bookings/69df79f4519a503fc23f22dc 200 - - 9773.406 ms
2026-05-05T10:35:23.498009934Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744_Sent_________20_15
2026-05-05T10:35:23.498568598Z GET /api/bookings?status=Sent&page=20&limit=15 304 - - 0.943 ms
2026-05-05T10:35:23.565760768Z GET /api/users/agents 304 - - 63.684 ms
2026-05-05T10:35:26.0977591Z [GET] /api/bookings - Page: 20, Limit: 15, Search: none
2026-05-05T10:35:26.108377888Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:26.113781274Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744_Sent_________1_15
2026-05-05T10:35:26.11444329Z GET /api/bookings?status=Sent&page=1&limit=15 304 - - 0.801 ms
2026-05-05T10:35:26.226459517Z getBookingsQuery_moshsky8: 129.852ms
2026-05-05T10:35:26.228317101Z GET /api/bookings?status=Sent%2CBooked&page=20&limit=15 200 - - 130.878 ms
2026-05-05T10:35:26.235226392Z getBookingsQuery_moshskyh: 129.474ms
2026-05-05T10:35:26.235772915Z GET /api/bookings?status=Sent%2CBooked&page=1&limit=15 304 - - 130.360 ms
2026-05-05T10:35:28.248965765Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:28.378764968Z getBookingsQuery_moshsmm0: 129.359ms
2026-05-05T10:35:28.379229158Z GET /api/bookings?status=Booked&page=1&limit=15 304 - - 130.496 ms
2026-05-05T10:35:31.382419718Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:31.515387395Z getBookingsQuery_moshsp10: 132.855ms
2026-05-05T10:35:31.515404696Z GET /api/bookings?status=Booked%2CFollow+Up&page=1&limit=15 304 - - 134.461 ms
2026-05-05T10:35:32.204879046Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:32.270181551Z getBookingsQuery_moshspnw: 64.805ms
2026-05-05T10:35:32.270217022Z GET /api/bookings?status=Follow+Up&page=1&limit=15 304 - - 65.600 ms
2026-05-05T10:35:33.871163688Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:34.28939781Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:34.47642161Z getBookingsQuery_moshsqy6: 605.405ms
2026-05-05T10:35:34.476776529Z GET /api/bookings?status=Follow+Up&outstandingOnly=true&page=1&limit=15 304 - - 606.394 ms
2026-05-05T10:35:34.74302815Z getBookingsQuery_moshsr9t: 453.512ms
2026-05-05T10:35:34.743639204Z GET /api/bookings?outstandingOnly=true&page=1&limit=15 304 - - 454.653 ms
2026-05-05T10:35:36.55595014Z ==> Detected service running on port 10000
2026-05-05T10:35:36.655610442Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-05-05T10:35:37.890302395Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:38.021034989Z getBookingsQuery_moshsu1u: 130.619ms
2026-05-05T10:35:38.021862079Z GET /api/bookings?page=1&limit=15 304 - - 131.908 ms
2026-05-05T10:35:39.230379415Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:40.03652559Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:35:40.036807957Z GET /api/notifications 304 - - 0.561 ms
2026-05-05T10:35:43.61294274Z getBookingsQuery_moshsv32: 4.382s
2026-05-05T10:35:43.653654251Z GET /api/bookings?status=Interested&page=1&limit=15 304 - - 4383.526 ms
2026-05-05T10:35:48.368471616Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:49.171379095Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:52.336643006Z getBookingsQuery_mosht24w: 3.967s
2026-05-05T10:35:52.336783319Z GET /api/bookings?status=Interested%2CNot+Interested&page=1&limit=15 304 - - 3968.463 ms
2026-05-05T10:35:52.337586818Z getBookingsQuery_mosht2r5: 3.168s
2026-05-05T10:35:52.338067459Z GET /api/bookings?status=Not+Interested&page=1&limit=15 304 - - 3168.773 ms
2026-05-05T10:35:57.062101325Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:35:57.192209045Z getBookingsQuery_mosht8ud: 130.01ms
2026-05-05T10:35:57.193590827Z GET /api/bookings?status=Not+Interested&assignedTo=unassigned&page=1&limit=15 200 - - 131.008 ms
2026-05-05T10:36:00.734142672Z GET /api/notifications 304 - - 64.683 ms
2026-05-05T10:36:01.574092985Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:01.704554333Z getBookingsQuery_moshtcbp: 130.34ms
2026-05-05T10:36:01.705405193Z GET /api/bookings?status=Not+Interested%2CInterested&assignedTo=unassigned&page=1&limit=15 200 - - 131.264 ms
2026-05-05T10:36:03.139184289Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:03.204270949Z getBookingsQuery_moshtdj6: 65.002ms
2026-05-05T10:36:03.204989166Z GET /api/bookings?status=Interested&assignedTo=unassigned&page=1&limit=15 200 65 - 65.872 ms
2026-05-05T10:36:05.411558985Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:05.546948958Z getBookingsQuery_moshtfab: 135.265ms
2026-05-05T10:36:05.547510101Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 136.207 ms
2026-05-05T10:36:06.435739872Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:06.809939274Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:08.61531871Z getBookingsQuery_moshtg2r: 2.179s
2026-05-05T10:36:08.616703882Z GET /api/bookings?assignedTo=unassigned%2C69c52979220e3d8fa652ee44&page=1&limit=15 200 - - 2180.573 ms
2026-05-05T10:36:09.093351277Z getBookingsQuery_moshtgd5: 2.283s
2026-05-05T10:36:09.093950901Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 304 - - 2284.338 ms
2026-05-05T10:36:11.632179176Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:12.035726644Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:12.305577528Z getBookingsQuery_moshtk33: 673.358ms
2026-05-05T10:36:12.306207493Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44%2C69c2a2038787a5edc5143fb6&page=1&limit=15 304 - - 674.348 ms
2026-05-05T10:36:12.365114578Z getBookingsQuery_moshtkeb: 329.309ms
2026-05-05T10:36:12.365692342Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 304 - - 330.256 ms
2026-05-05T10:36:15.057492544Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:15.531412165Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:16.138675991Z getBookingsQuery_moshtmq9: 1.081s
2026-05-05T10:36:16.139180593Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 1082.148 ms
2026-05-05T10:36:16.213077409Z getBookingsQuery_moshtn3f: 681.551ms
2026-05-05T10:36:16.213598961Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 682.573 ms
2026-05-05T10:36:19.049318874Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:19.930793635Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:36:21.358951147Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:36:21.359266864Z GET /api/notifications 304 - - 0.600 ms
2026-05-05T10:36:55.074032604Z GET /api/notifications 304 - - 13084.348 ms
2026-05-05T10:36:55.076947882Z getBookingsQuery_moshtpt5: 36.028s
2026-05-05T10:36:55.077588237Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 36028.633 ms
2026-05-05T10:36:55.15390417Z getBookingsQuery_moshtqhm: 35.223s
2026-05-05T10:36:55.154636547Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 35223.960 ms
2026-05-05T10:37:01.294680212Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:01.42818836Z getBookingsQuery_moshumem: 133.411ms
2026-05-05T10:37:01.428719102Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 134.386 ms
2026-05-05T10:37:02.152904206Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:02.28537237Z getBookingsQuery_moshun2g: 131.347ms
2026-05-05T10:37:02.28538904Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 132.577 ms
2026-05-05T10:37:05.262262776Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:05.395628941Z getBookingsQuery_moshupgu: 133.259ms
2026-05-05T10:37:05.396179513Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d%2C69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 134.222 ms
2026-05-05T10:37:05.684755243Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:05.817506234Z getBookingsQuery_moshupsk: 132.623ms
2026-05-05T10:37:05.818269431Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 133.832 ms
2026-05-05T10:37:08.21941199Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:08.537892128Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:11.155954182Z getBookingsQuery_moshurqz: 2.935s
2026-05-05T10:37:11.155971642Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108&page=1&limit=15 304 - - 2936.451 ms
2026-05-05T10:37:11.481790172Z getBookingsQuery_moshurzt: 2.944s
2026-05-05T10:37:11.482350355Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 2944.830 ms
2026-05-05T10:37:15.695410437Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:37:15.695705864Z GET /api/notifications 304 - - 0.602 ms
2026-05-05T10:37:15.891759563Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-05T10:37:34.65629572Z getBookingsQuery_moshuxo3: 18.764s
2026-05-05T10:37:34.657603671Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=5&limit=15 200 - - 18765.562 ms
2026-05-05T10:37:36.818294857Z GET /api/notifications 304 - - 485.907 ms
2026-05-05T10:37:41.070045902Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53849220e3d8fa652f108________1_15
2026-05-05T10:37:41.070681587Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 0.762 ms
2026-05-05T10:37:41.073049542Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-05T10:37:41.075160971Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:41.202398572Z getBookingsQuery_moshvh3j: 130.4ms
2026-05-05T10:37:41.203657272Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=5&limit=15 200 - - 131.270 ms
2026-05-05T10:37:41.205595387Z getBookingsQuery_moshvh3n: 130.387ms
2026-05-05T10:37:41.206125719Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=1&limit=15 304 - - 131.106 ms
2026-05-05T10:37:42.233642473Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:42.363602918Z getBookingsQuery_moshvhzt: 129.886ms
2026-05-05T10:37:42.364262653Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 131.101 ms
2026-05-05T10:37:50.995532079Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:51.127821668Z getBookingsQuery_moshvor7: 132.183ms
2026-05-05T10:37:51.128593557Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 304 - - 133.356 ms
2026-05-05T10:37:51.617904542Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:51.682949891Z getBookingsQuery_moshvp8h: 64.759ms
2026-05-05T10:37:51.683269108Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 65.574 ms
2026-05-05T10:37:53.521949611Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:53.838271618Z getBookingsQuery_moshvqpd: 313.921ms
2026-05-05T10:37:53.838311679Z GET /api/bookings?page=1&limit=15 304 - - 314.862 ms
2026-05-05T10:37:54.840363407Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:54.970991277Z getBookingsQuery_moshvrpz: 131.263ms
2026-05-05T10:37:54.971457837Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 132.249 ms
2026-05-05T10:37:55.531688139Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:55.657821154Z getBookingsQuery_moshvs95: 126.953ms
2026-05-05T10:37:55.657840674Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 127.812 ms
2026-05-05T10:37:56.738846165Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:37:56.790301227Z GET /api/settings/dropdowns 304 - - 64.590 ms
2026-05-05T10:37:56.867998951Z getBookingsQuery_moshvt6q: 129.043ms
2026-05-05T10:37:56.868608355Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 130.014 ms
2026-05-05T10:37:57.443866057Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:37:57.444170265Z GET /api/notifications 304 - - 0.596 ms
2026-05-05T10:37:57.486148195Z GET /api/bookings/calendar?month=5&year=2026 304 - - 191.104 ms
2026-05-05T10:37:57.960794297Z GET /api/users 200 - - 64.836 ms
2026-05-05T10:37:58.701417361Z GET /api/analytics/revenue-trends?interval=month&companyName= 304 - - 151.245 ms
2026-05-05T10:37:58.725255647Z GET /api/analytics/agents?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 170.511 ms
2026-05-05T10:37:58.767062733Z GET /api/analytics/payments?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 214.711 ms
2026-05-05T10:37:59.073029617Z GET /api/analytics/bookings?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 263 - 88.923 ms
2026-05-05T10:37:59.281548866Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 338.368 ms
2026-05-05T10:38:00.342663192Z GET /api/users/agents 304 - - 64.164 ms
2026-05-05T10:38:10.648135092Z POST /api/bookings 201 - - 1604.507 ms
2026-05-05T10:38:11.301889026Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:38:11.489377893Z getBookingsQuery_moshw4f9: 187.348ms
2026-05-05T10:38:11.490761826Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 188.535 ms
2026-05-05T10:38:17.14032201Z [CACHE HIT] users_agents
2026-05-05T10:38:17.140869983Z GET /api/users/agents 304 - - 0.797 ms
2026-05-05T10:38:18.151073619Z GET /api/notifications 304 - - 64.204 ms
2026-05-05T10:38:20.726529398Z PATCH /api/bookings/69f9c8925c0edc2e2f70010d/status 200 1018 - 198.727 ms
2026-05-05T10:38:21.181746686Z PUT /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 658.390 ms
2026-05-05T10:38:21.859102041Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:38:21.993636252Z getBookingsQuery_moshwcki: 132.884ms
2026-05-05T10:38:21.994535942Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 134.436 ms
2026-05-05T10:38:23.398140322Z [GET] /api/bookings/69f9c8925c0edc2e2f70010d
2026-05-05T10:38:23.601651824Z GET /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 203.181 ms
2026-05-05T10:38:38.793604874Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:38:38.793626105Z GET /api/notifications 304 - - 2.738 ms
2026-05-05T10:38:59.715178929Z GET /api/notifications 304 - - 291.430 ms
2026-05-05T10:39:20.357442139Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:39:20.357735626Z GET /api/notifications 304 - - 0.639 ms
2026-05-05T10:39:41.045800341Z GET /api/notifications 304 - - 68.141 ms
2026-05-05T10:40:01.685734509Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:40:01.686050016Z GET /api/notifications 304 - - 0.719 ms
2026-05-05T10:40:20.528327653Z POST /api/bookings/69f9c8925c0edc2e2f70010d/payments 201 320 - 4093.318 ms
2026-05-05T10:40:21.168949402Z [GET] /api/bookings/69f9c8925c0edc2e2f70010d
2026-05-05T10:40:21.169939515Z (node:83) Warning: Label 'getBookingById_69f9c8925c0edc2e2f70010d' already exists for console.time()
2026-05-05T10:40:21.169959335Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-05T10:40:21.369603054Z GET /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 200.164 ms
2026-05-05T10:40:22.550736305Z GET /api/notifications 304 - - 63.870 ms
2026-05-05T10:40:24.187858596Z [PASSENGER PERF] Add Passengers - Total: 136ms | DB: 71ms | Count: 3
2026-05-05T10:40:24.251624724Z PATCH /api/bookings/69f9c8925c0edc2e2f70010d/status 200 1017 - 212.300 ms
2026-05-05T10:40:24.255237128Z POST /api/bookings/69f9c8925c0edc2e2f70010d/passengers 201 - - 203.456 ms
2026-05-05T10:40:24.60201939Z PUT /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 569.963 ms
2026-05-05T10:40:24.919711874Z [GET] /api/bookings/69f9c8925c0edc2e2f70010d
2026-05-05T10:40:24.920034231Z (node:83) Warning: Label 'getBookingById_69f9c8925c0edc2e2f70010d' already exists for console.time()
2026-05-05T10:40:25.11753771Z GET /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 197.437 ms
2026-05-05T10:40:25.3374021Z GET /api/settings/dropdowns 304 - - 64.450 ms
2026-05-05T10:40:27.504214981Z PATCH /api/bookings/69f9c8925c0edc2e2f70010d/verify 200 61 - 196.708 ms
2026-05-05T10:40:27.831505267Z (node:83) Warning: Label 'getBookingById_69f9c8925c0edc2e2f70010d' already exists for console.time()
2026-05-05T10:40:27.831552249Z [GET] /api/bookings/69f9c8925c0edc2e2f70010d
2026-05-05T10:40:28.028138556Z GET /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 197.507 ms
2026-05-05T10:40:31.228934112Z PATCH /api/bookings/69f9c8925c0edc2e2f70010d/verify 200 64 - 200.788 ms
2026-05-05T10:40:31.859876924Z [GET] /api/bookings/69f9c8925c0edc2e2f70010d
2026-05-05T10:40:31.860246603Z (node:83) Warning: Label 'getBookingById_69f9c8925c0edc2e2f70010d' already exists for console.time()
2026-05-05T10:40:32.056245126Z GET /api/bookings/69f9c8925c0edc2e2f70010d 200 - - 195.967 ms
2026-05-05T10:40:34.356473778Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:40:34.648219126Z GET /api/users/agents 304 - - 296.921 ms
2026-05-05T10:40:35.994600311Z getBookingsQuery_moshz6t0: 1.638s
2026-05-05T10:40:35.995895562Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 1638.951 ms
2026-05-05T10:40:36.485580767Z [CACHE HIT] users_agents
2026-05-05T10:40:36.486001297Z GET /api/users/agents 304 - - 0.780 ms
2026-05-05T10:40:39.277705776Z [CACHE HIT] users_agents
2026-05-05T10:40:39.278089785Z GET /api/users/agents 304 - - 0.657 ms
2026-05-05T10:40:43.211083192Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-05T10:40:43.211398819Z GET /api/notifications 304 - - 0.519 ms
2026-05-05T10:40:56.126987812Z deleteBooking_69f9c8925c0edc2e2f70010d: 12.436s
2026-05-05T10:40:56.127378741Z DELETE /api/bookings/69f9c8925c0edc2e2f70010d 200 66 - 14739.248 ms
2026-05-05T10:40:56.614026125Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:41:00.528164065Z getBookingsQuery_moshznz9: 3.914s
2026-05-05T10:41:00.529790223Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 3915.012 ms
2026-05-05T10:41:00.835152107Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744________true__1_15
2026-05-05T10:41:00.836934879Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 1.394 ms
2026-05-05T10:41:09.998447988Z GET /api/analytics/bookings?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 263 - 66.282 ms
2026-05-05T10:41:10.000187078Z GET /api/analytics/revenue-trends?interval=month&companyName= 304 - - 63.593 ms
2026-05-05T10:41:10.01652596Z GET /api/analytics/agents?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 94.465 ms
2026-05-05T10:41:10.242084552Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 322.596 ms
2026-05-05T10:41:10.496230001Z GET /api/analytics/payments?fromDate=2026-04-05&toDate=2026-05-05&companyName= 304 - - 127.727 ms
2026-05-05T10:41:10.616324453Z GET /api/users 200 - - 63.924 ms
2026-05-05T10:41:11.210256649Z GET /api/bookings/calendar?month=5&year=2026 304 - - 129.376 ms
2026-05-05T10:41:11.734413837Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:41:11.871153367Z getBookingsQuery_moshzzna: 136.652ms
2026-05-05T10:41:11.872241503Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 137.628 ms
2026-05-05T10:41:12.186679939Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:41:12.313932507Z getBookingsQuery_moshzzzu: 127.178ms
2026-05-05T10:41:12.314404668Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 128.101 ms
2026-05-05T10:41:12.627995514Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:41:12.764100749Z getBookingsQuery_mosi00c3: 136.024ms
2026-05-05T10:41:12.765212315Z GET /api/bookings?assignedTo=unassigned&myBookings=true&page=1&limit=15 200 - - 136.843 ms
2026-05-05T10:41:13.083316986Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-05T10:41:15.103379273Z GET /api/sync 304 - - 1644.253 ms
2026-05-05T10:41:15.583029983Z getBookingsQuery_mosi00or: 2.500s
2026-05-05T10:41:15.58375972Z GET /api/bookings?page=1&limit=15 304 - - 2500.721 ms