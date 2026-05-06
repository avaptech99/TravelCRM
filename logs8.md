2026-05-06T05:03:28.640393435Z ==> Deploying...
2026-05-06T05:03:28.74089664Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-06T05:03:40.139995826Z ==> Running 'npm run start'
2026-05-06T05:03:41.338112567Z 
2026-05-06T05:03:41.338146068Z > travel-crm-backend@1.0.0 start
2026-05-06T05:03:41.338151208Z > node dist/src/server.js
2026-05-06T05:03:41.338154458Z 
2026-05-06T05:03:48.236850306Z Server running in production mode on port 10000
2026-05-06T05:03:48.237049751Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-06T05:03:48.839780689Z HEAD / 200 36 - 1.710 ms
2026-05-06T05:03:49.768016948Z ==> Your service is live 🎉
2026-05-06T05:03:49.828008726Z GET / 200 36 - 0.408 ms
2026-05-06T05:03:49.873887791Z ==> 
2026-05-06T05:03:49.877137422Z ==> ///////////////////////////////////////////////////////////
2026-05-06T05:03:49.881769179Z ==> 
2026-05-06T05:03:49.885123014Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-06T05:03:49.89412838Z ==> 
2026-05-06T05:03:49.900786378Z ==> ///////////////////////////////////////////////////////////
2026-05-06T05:03:52.122198778Z MongoDB Connected. Synchronizing indexes...
2026-05-06T05:03:52.132171387Z MongoDB Connected: ac-nvjnavm-shard-00-02.31xmkrx.mongodb.net
2026-05-06T05:03:52.231548717Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-06T05:03:52.235077085Z 🚀 Startup tasks complete. System ready.
2026-05-06T05:03:53.495684379Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-06T05:04:08.050280779Z [PERF] GET /api/notifications - 6672ms | Heap: 35MB | RSS: 105MB
2026-05-06T05:04:08.05033919Z GET /api/notifications 200 2 - 6672.272 ms
2026-05-06T05:13:35.434406242Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:13:35.5682232Z getBookingsQuery_motlqjey: 133.763ms
2026-05-06T05:13:35.568729753Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 134.768 ms
2026-05-06T05:13:37.424007184Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:13:37.424308402Z GET /api/notifications 304 - - 0.639 ms
2026-05-06T05:13:38.863928032Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:13:39.068421174Z getBookingsQuery_motlqm27: 204.374ms
2026-05-06T05:13:39.069214954Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 205.495 ms
2026-05-06T05:13:44.108539951Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T05:13:44.406725955Z getBookingsQuery_motlqq3w: 297.97ms
2026-05-06T05:13:44.408007027Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=5&limit=15 200 - - 299.159 ms
2026-05-06T05:13:49.667761683Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T05:13:49.714005063Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:13:49.880672277Z getBookingsQuery_motlqueb: 212.801ms
2026-05-06T05:13:49.88200085Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c52979220e3d8fa652ee44&page=5&limit=15 200 - - 213.932 ms
2026-05-06T05:13:49.915915602Z getBookingsQuery_motlqufl: 201.818ms
2026-05-06T05:13:49.917171533Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c52979220e3d8fa652ee44&page=1&limit=15 200 - - 202.922 ms
2026-05-06T05:13:51.337644527Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:13:58.137843949Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:13:58.138224128Z GET /api/notifications 304 - - 0.661 ms
2026-05-06T05:13:59.063029732Z getBookingsQuery_motlqvop: 7.725s
2026-05-06T05:13:59.063755321Z [PERF] GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 - 7727ms | Heap: 37MB | RSS: 112MB
2026-05-06T05:13:59.063777031Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 304 - - 7726.363 ms
2026-05-06T05:14:04.342098211Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:14:04.560050542Z getBookingsQuery_motlr5px: 217.859ms
2026-05-06T05:14:04.561278083Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44%2C69c53849220e3d8fa652f108&page=1&limit=15 200 - - 218.891 ms
2026-05-06T05:14:05.391753481Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:14:05.59726112Z getBookingsQuery_motlr6j3: 205.416ms
2026-05-06T05:14:05.597858595Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 206.569 ms
2026-05-06T05:14:12.274719032Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T05:14:12.47696387Z getBookingsQuery_motlrbua: 202.118ms
2026-05-06T05:14:12.481095764Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=3&limit=15 200 - - 203.176 ms
2026-05-06T05:14:15.547967819Z [GET] /api/bookings/69df271a519a503fc23f1d51
2026-05-06T05:14:16.988211727Z [PERF] GET /api/settings/dropdowns - 1472ms | Heap: 38MB | RSS: 112MB
2026-05-06T05:14:16.988245868Z GET /api/settings/dropdowns 304 - - 1472.008 ms
2026-05-06T05:14:18.736769427Z [PERF] GET /api/bookings/69df271a519a503fc23f1d51 - 3189ms | Heap: 38MB | RSS: 112MB
2026-05-06T05:14:18.736802808Z GET /api/bookings/69df271a519a503fc23f1d51 200 - - 3188.298 ms
2026-05-06T05:14:18.788932787Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:14:18.789266455Z GET /api/notifications 304 - - 0.673 ms
2026-05-06T05:14:29.013307827Z [PERF] GET /api/users/agents - 6190ms | Heap: 38MB | RSS: 112MB
2026-05-06T05:14:29.013343718Z GET /api/users/agents 304 - - 6190.106 ms
2026-05-06T05:14:30.704762378Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T05:14:30.715437116Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:14:30.729617542Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c53849220e3d8fa652f108________1_15
2026-05-06T05:14:30.730151566Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 0.670 ms
2026-05-06T05:14:32.491569704Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:14:54.531206637Z [PERF] GET /api/notifications - 15073ms | Heap: 38MB | RSS: 112MB
2026-05-06T05:14:54.531241648Z GET /api/notifications 304 - - 15073.282 ms
2026-05-06T05:14:56.763695146Z getBookingsQuery_motlrq2j: 26.048s
2026-05-06T05:14:56.764826854Z getBookingsQuery_motlrq28: 26.060s
2026-05-06T05:14:56.766446315Z [PERF] GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c2a2038787a5edc5143fb6&page=3&limit=15 - 26062ms | Heap: 38MB | RSS: 112MB
2026-05-06T05:14:56.766464505Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c2a2038787a5edc5143fb6&page=3&limit=15 200 - - 26060.977 ms
2026-05-06T05:14:56.766734472Z [PERF] GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c2a2038787a5edc5143fb6&page=1&limit=15 - 26052ms | Heap: 38MB | RSS: 112MB
2026-05-06T05:14:56.766751472Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 26049.162 ms
2026-05-06T05:14:56.772391324Z getBookingsQuery_motlrrfv: 24.281s
2026-05-06T05:14:56.77300959Z [PERF] GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 - 24282ms | Heap: 39MB | RSS: 112MB
2026-05-06T05:14:56.77302525Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 304 - - 24281.800 ms
2026-05-06T05:15:03.27568391Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T05:15:03.487533061Z getBookingsQuery_motlsf6z: 211.742ms
2026-05-06T05:15:03.48827446Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 304 - - 212.834 ms
2026-05-06T05:15:11.025332273Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T05:15:11.031320183Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:15:11.233920522Z getBookingsQuery_motlsl6f: 202.424ms
2026-05-06T05:15:11.23545554Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c537cb220e3d8fa652f0f2&page=1&limit=15 200 - - 203.263 ms
2026-05-06T05:15:11.236867346Z getBookingsQuery_motlsl69: 210.955ms
2026-05-06T05:15:11.23743331Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c537cb220e3d8fa652f0f2&page=2&limit=15 200 - - 211.885 ms
2026-05-06T05:15:15.173761117Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:15:15.176230319Z GET /api/notifications 304 - - 1.846 ms
2026-05-06T05:15:24.133305974Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:15:35.874579296Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:15:35.874853123Z GET /api/notifications 304 - - 0.547 ms
2026-05-06T05:15:44.727584448Z getBookingsQuery_motlsvad: 20.594s
2026-05-06T05:15:44.728343817Z [PERF] GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 - 20596ms | Heap: 39MB | RSS: 112MB
2026-05-06T05:15:44.729696451Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 20595.439 ms
2026-05-06T05:15:52.653509062Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T05:15:52.874819013Z getBookingsQuery_motlthal: 221.198ms
2026-05-06T05:15:52.876151627Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=5&limit=15 200 - - 222.262 ms
2026-05-06T05:15:57.009007398Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:15:57.009317986Z GET /api/notifications 304 - - 0.592 ms
2026-05-06T05:16:00.250696189Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T05:16:00.259028219Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:01.959967513Z getBookingsQuery_motltn5m: 1.709s
2026-05-06T05:16:01.961303816Z [PERF] GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c538b0220e3d8fa652f122&page=5&limit=15 - 1711ms | Heap: 39MB | RSS: 112MB
2026-05-06T05:16:01.961321287Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c538b0220e3d8fa652f122&page=5&limit=15 200 - - 1710.274 ms
2026-05-06T05:16:01.989506765Z getBookingsQuery_motltn5u: 1.730s
2026-05-06T05:16:01.991271859Z [PERF] GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c538b0220e3d8fa652f122&page=1&limit=15 - 1733ms | Heap: 39MB | RSS: 112MB
2026-05-06T05:16:01.99128951Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c538b0220e3d8fa652f122&page=1&limit=15 200 - - 1731.269 ms
2026-05-06T05:16:04.203925844Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:04.417200423Z getBookingsQuery_motltq7f: 213.155ms
2026-05-06T05:16:04.417837499Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 214.158 ms
2026-05-06T05:16:08.308919596Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-06T05:16:17.672185486Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:16:17.672450343Z GET /api/notifications 304 - - 0.517 ms
2026-05-06T05:16:25.430232429Z getBookingsQuery_motlttdg: 17.121s
2026-05-06T05:16:25.431534312Z [PERF] GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=6&limit=15 - 17123ms | Heap: 40MB | RSS: 112MB
2026-05-06T05:16:25.431551552Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=6&limit=15 200 - - 17122.224 ms
2026-05-06T05:16:31.667345934Z [GET] /api/bookings - Page: 6, Limit: 15, Search: none
2026-05-06T05:16:31.692780873Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c538b0220e3d8fa652f122________1_15
2026-05-06T05:16:31.692799484Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 0.942 ms
2026-05-06T05:16:31.717403322Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:31.878314667Z getBookingsQuery_motlubeb: 210.857ms
2026-05-06T05:16:31.87961797Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=6&limit=15 200 - - 211.923 ms
2026-05-06T05:16:31.925404671Z getBookingsQuery_motlubfp: 204.661ms
2026-05-06T05:16:31.925421671Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 205.620 ms
2026-05-06T05:16:32.755162858Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:33.035938296Z getBookingsQuery_motluc8j: 280.505ms
2026-05-06T05:16:33.039076845Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 281.496 ms
2026-05-06T05:16:36.81775716Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T05:16:37.030790375Z getBookingsQuery_motlufdd: 212.883ms
2026-05-06T05:16:37.031446592Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 304 - - 214.434 ms
2026-05-06T05:16:38.447900949Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:16:38.448614566Z GET /api/notifications 304 - - 0.575 ms
2026-05-06T05:16:39.584932321Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T05:16:39.782039906Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:39.796709455Z getBookingsQuery_motluhi8: 211.743ms
2026-05-06T05:16:39.797260229Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=2&limit=15 304 - - 212.662 ms
2026-05-06T05:16:39.980437244Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:40.077883373Z getBookingsQuery_motluhnp: 295.707ms
2026-05-06T05:16:40.078357005Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 296.657 ms
2026-05-06T05:16:40.192811482Z getBookingsQuery_motluht8: 212.319ms
2026-05-06T05:16:40.193270444Z GET /api/bookings?page=1&limit=15 304 - - 213.211 ms
2026-05-06T05:16:40.556996208Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:40.873073613Z getBookingsQuery_motlui98: 316.384ms
2026-05-06T05:16:40.873681518Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 317.499 ms
2026-05-06T05:16:49.32775421Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:16:49.541223356Z getBookingsQuery_motlup0v: 213.347ms
2026-05-06T05:16:49.541737519Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 214.410 ms
2026-05-06T05:16:59.096436709Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:16:59.096815129Z GET /api/notifications 304 - - 0.561 ms
2026-05-06T05:17:05.126919615Z [PERF] GET /api/settings/dropdowns - 13357ms | Heap: 40MB | RSS: 113MB
2026-05-06T05:17:05.126956876Z GET /api/settings/dropdowns 304 - - 13356.978 ms
2026-05-06T05:17:19.001343363Z [PERF] POST /api/bookings - 19970ms | Heap: 38MB | RSS: 115MB
2026-05-06T05:17:19.001399904Z POST /api/bookings 500 140 - 19969.006 ms
2026-05-06T05:17:38.480915856Z [CACHE HIT] NLP Extraction: nlp_ZGZnaGpqa2xqaGdmZA==
2026-05-06T05:17:38.619880281Z POST /api/bookings 500 140 - 209.260 ms
2026-05-06T05:17:50.700038148Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:18:03.156644696Z [CACHE HIT] NLP Extraction: nlp_ZGZnaGpqa2xqaGdmZA==
2026-05-06T05:18:03.877235024Z getBookingsQuery_motlw0dn: 13.177s
2026-05-06T05:18:03.878070885Z [PERF] GET /api/bookings?page=1&limit=15 - 13178ms | Heap: 38MB | RSS: 115MB
2026-05-06T05:18:03.878091105Z GET /api/bookings?page=1&limit=15 304 - - 13178.232 ms
2026-05-06T05:18:03.887558444Z [PERF] POST /api/bookings - 13035ms | Heap: 39MB | RSS: 115MB
2026-05-06T05:18:03.887579944Z POST /api/bookings 500 140 - 13034.323 ms
2026-05-06T05:18:24.542612904Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T05:18:24.543118247Z GET /api/bookings?page=1&limit=15 304 - - 1.000 ms
2026-05-06T05:18:27.29586196Z [GET] /api/bookings/69f977213ed07ab843f38d2d
2026-05-06T05:18:27.369691948Z GET /api/settings/dropdowns 304 - - 72.303 ms
2026-05-06T05:18:27.438182661Z GET /api/bookings/69f977213ed07ab843f38d2d 200 - - 142.498 ms
2026-05-06T05:18:31.890570133Z [PERF] GET /api/users/agents - 2325ms | Heap: 39MB | RSS: 115MB
2026-05-06T05:18:31.890597894Z GET /api/users/agents 304 - - 2324.592 ms
2026-05-06T05:22:01.771157931Z [PERF] GET /api/notifications - 979ms | Heap: 39MB | RSS: 115MB
2026-05-06T05:22:01.771192982Z GET /api/notifications 304 - - 979.024 ms
2026-05-06T05:22:09.4612422Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:22:09.672055464Z getBookingsQuery_motm1k1h: 210.712ms
2026-05-06T05:22:09.672707241Z GET /api/bookings?page=1&limit=15 304 - - 211.710 ms
2026-05-06T05:22:30.333022239Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T05:22:30.333593614Z GET /api/bookings?page=1&limit=15 304 - - 0.822 ms
2026-05-06T05:22:32.821588763Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:22:32.844553473Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:22:33.696164834Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:22:45.711344523Z [PERF] GET /api/settings/dropdowns - 12032ms | Heap: 40MB | RSS: 115MB
2026-05-06T05:22:45.711413124Z GET /api/settings/dropdowns 304 - - 12031.551 ms
2026-05-06T05:22:46.0427977Z getBookingsQuery_motm22qo: 12.347s
2026-05-06T05:22:46.043399816Z [PERF] GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 - 12348ms | Heap: 39MB | RSS: 115MB
2026-05-06T05:22:46.043418496Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 12347.365 ms
2026-05-06T05:22:46.043834176Z getBookingsQuery_motm2230: 13.199s
2026-05-06T05:22:46.044236186Z [PERF] GET /api/bookings?myBookings=true&page=1&limit=15 - 13201ms | Heap: 39MB | RSS: 115MB
2026-05-06T05:22:46.044243237Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 13200.151 ms
2026-05-06T05:22:46.04518967Z getBookingsQuery_motm222d: 13.224s
2026-05-06T05:22:46.04556542Z [PERF] GET /api/bookings?assignedTo=unassigned&page=1&limit=15 - 13225ms | Heap: 40MB | RSS: 115MB
2026-05-06T05:22:46.0455799Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 13224.750 ms
2026-05-06T05:23:07.453747922Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744_Booked_________1_15
2026-05-06T05:23:07.454309356Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 1.015 ms
2026-05-06T05:23:08.170279413Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T05:23:08.170813107Z GET /api/bookings?page=1&limit=15 304 - - 0.804 ms
2026-05-06T05:23:16.382459834Z [PERF] GET /api/users/agents - 7754ms | Heap: 40MB | RSS: 116MB
2026-05-06T05:23:16.382509295Z GET /api/users/agents 304 - - 7752.995 ms
2026-05-06T05:23:22.447007388Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:23:22.447503671Z GET /api/notifications 304 - - 0.609 ms
2026-05-06T05:23:28.913855137Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:23:37.79114506Z getBookingsQuery_motm39ch: 8.877s
2026-05-06T05:23:37.7915069Z [PERF] GET /api/bookings?page=1&limit=15 - 8878ms | Heap: 41MB | RSS: 116MB
2026-05-06T05:23:37.79151915Z GET /api/bookings?page=1&limit=15 304 - - 8877.902 ms
2026-05-06T05:23:37.953385873Z [PERF] POST /api/bookings - 22491ms | Heap: 41MB | RSS: 116MB
2026-05-06T05:23:37.953411514Z POST /api/bookings 201 - - 22489.857 ms
2026-05-06T05:23:38.698995362Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:23:38.908543399Z getBookingsQuery_motm3gwa: 210.089ms
2026-05-06T05:23:38.909708508Z GET /api/bookings?page=1&limit=15 200 - - 211.083 ms
2026-05-06T05:23:40.471511297Z [GET] /api/bookings/69fad0565d195ec9d357c11b
2026-05-06T05:23:40.678329944Z GET /api/bookings/69fad0565d195ec9d357c11b 200 - - 207.227 ms
2026-05-06T05:23:43.32651031Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:23:43.32691567Z GET /api/notifications 304 - - 0.636 ms
2026-05-06T05:23:57.571758031Z PUT /api/bookings/69fad0565d195ec9d357c11b 200 - - 417.159 ms
2026-05-06T05:23:57.939660753Z [GET] /api/bookings/69fad0565d195ec9d357c11b
2026-05-06T05:23:57.939666534Z (node:84) Warning: Label 'getBookingById_69fad0565d195ec9d357c11b' already exists for console.time()
2026-05-06T05:24:04.082701108Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:24:04.083014436Z GET /api/notifications 304 - - 0.645 ms
2026-05-06T05:24:19.401462137Z [PERF] GET /api/bookings/69fad0565d195ec9d357c11b - 21462ms | Heap: 42MB | RSS: 117MB
2026-05-06T05:24:19.401494187Z GET /api/bookings/69fad0565d195ec9d357c11b 200 - - 21460.529 ms
2026-05-06T05:24:22.692025704Z [PERF] PATCH /api/bookings/69fad0565d195ec9d357c11b/status - 21046ms | Heap: 42MB | RSS: 117MB
2026-05-06T05:24:22.692055044Z PATCH /api/bookings/69fad0565d195ec9d357c11b/status 200 1018 - 21046.262 ms
2026-05-06T05:24:22.999642226Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:24:23.079052701Z GET /api/settings/dropdowns 304 - - 70.706 ms
2026-05-06T05:24:23.079743788Z GET /api/users/agents 304 - - 72.612 ms
2026-05-06T05:24:23.205158983Z getBookingsQuery_motm4f2v: 205.432ms
2026-05-06T05:24:23.20664127Z GET /api/bookings?page=1&limit=15 200 - - 206.554 ms
2026-05-06T05:24:23.591318988Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T05:24:23.59181509Z GET /api/bookings?page=1&limit=15 304 - - 0.822 ms
2026-05-06T05:24:24.278208722Z [GET] /api/bookings/69fad0565d195ec9d357c11b
2026-05-06T05:24:24.278564231Z (node:84) Warning: Label 'getBookingById_69fad0565d195ec9d357c11b' already exists for console.time()
2026-05-06T05:24:24.480526157Z GET /api/bookings/69fad0565d195ec9d357c11b 200 - - 201.970 ms
2026-05-06T05:24:24.829449203Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:24:24.829841872Z GET /api/notifications 304 - - 0.731 ms
2026-05-06T05:24:45.813716397Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:24:45.814974849Z GET /api/notifications 304 - - 1.712 ms
2026-05-06T05:25:06.782744805Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:25:06.783325249Z GET /api/notifications 304 - - 0.703 ms
2026-05-06T05:25:27.506488135Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:25:27.506796522Z GET /api/notifications 304 - - 0.769 ms
2026-05-06T05:25:48.264881723Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:25:48.266222867Z GET /api/notifications 304 - - 0.721 ms
2026-05-06T05:26:08.976049423Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:26:08.976296779Z GET /api/notifications 304 - - 0.494 ms
2026-05-06T05:26:29.609873092Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:26:29.610151328Z GET /api/notifications 304 - - 0.584 ms
2026-05-06T05:26:50.19140535Z [PERF] POST /api/bookings/69fad0565d195ec9d357c11b/payments - 20855ms | Heap: 43MB | RSS: 117MB
2026-05-06T05:26:50.191428811Z POST /api/bookings/69fad0565d195ec9d357c11b/payments 201 325 - 20854.030 ms
2026-05-06T05:26:51.047520519Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T05:26:51.047858128Z GET /api/notifications 304 - - 0.615 ms
2026-05-06T05:26:51.198027002Z [GET] /api/bookings/69fad0565d195ec9d357c11b
2026-05-06T05:26:51.198323269Z (node:84) Warning: Label 'getBookingById_69fad0565d195ec9d357c11b' already exists for console.time()
2026-05-06T05:26:51.400673861Z GET /api/bookings/69fad0565d195ec9d357c11b 200 - - 202.406 ms
2026-05-06T05:26:56.722190507Z [PASSENGER PERF] Add Passengers - Total: 138ms | DB: 72ms | Count: 3
2026-05-06T05:26:56.816322376Z POST /api/bookings/69fad0565d195ec9d357c11b/passengers 201 - - 233.208 ms
2026-05-06T05:26:56.838150487Z PATCH /api/bookings/69fad0565d195ec9d357c11b/status 200 1017 - 233.297 ms
2026-05-06T05:26:57.2091307Z [PERF] PUT /api/bookings/69fad0565d195ec9d357c11b - 608ms | Heap: 44MB | RSS: 117MB
2026-05-06T05:26:57.209153341Z PUT /api/bookings/69fad0565d195ec9d357c11b 200 - - 607.096 ms
2026-05-06T05:26:57.729856256Z [GET] /api/bookings/69fad0565d195ec9d357c11b
2026-05-06T05:26:57.730159054Z (node:84) Warning: Label 'getBookingById_69fad0565d195ec9d357c11b' already exists for console.time()
2026-05-06T05:26:57.93147646Z GET /api/bookings/69fad0565d195ec9d357c11b 200 - - 201.257 ms
2026-05-06T05:26:58.159390429Z GET /api/settings/dropdowns 304 - - 65.247 ms
2026-05-06T05:27:01.140261183Z PATCH /api/bookings/69fad0565d195ec9d357c11b/verify 200 61 - 201.081 ms
2026-05-06T05:27:01.498554515Z [GET] /api/bookings/69fad0565d195ec9d357c11b
2026-05-06T05:27:01.498554735Z (node:84) Warning: Label 'getBookingById_69fad0565d195ec9d357c11b' already exists for console.time()
2026-05-06T05:27:01.695550643Z GET /api/bookings/69fad0565d195ec9d357c11b 200 - - 197.927 ms
2026-05-06T05:27:06.428767935Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T05:27:07.640220915Z [PERF] GET /api/users/agents - 1239ms | Heap: 44MB | RSS: 117MB
2026-05-06T05:27:07.640264636Z GET /api/users/agents 304 - - 1239.446 ms
2026-05-06T05:27:08.01245562Z getBookingsQuery_motm7x6k: 1.584s
2026-05-06T05:27:08.01402312Z [PERF] GET /api/bookings?page=1&limit=15 - 1585ms | Heap: 43MB | RSS: 117MB
2026-05-06T05:27:08.01406349Z GET /api/bookings?page=1&limit=15 200 - - 1584.543 ms