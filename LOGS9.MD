
2026-05-06T05:54:15.146511075Z ==> Running 'npm run start'
2026-05-06T05:54:16.251431266Z 
2026-05-06T05:54:16.251464597Z > travel-crm-backend@1.0.0 start
2026-05-06T05:54:16.251471057Z > node dist/src/server.js
2026-05-06T05:54:16.251474947Z 
2026-05-06T05:54:22.943803296Z Server running in production mode on port 10000
2026-05-06T05:54:22.944087333Z ⚠️  BASE_URL not set. Server may go to sleep on Render Free Tier.
2026-05-06T05:54:27.115475966Z MongoDB Connected. Synchronizing indexes...
2026-05-06T05:54:27.120348983Z MongoDB Connected: ac-nvjnavm-shard-00-02.31xmkrx.mongodb.net
2026-05-06T05:54:27.208786361Z [FollowUp Cron] Started — checking every hour for due follow-ups.
2026-05-06T05:54:27.20955601Z 🚀 Startup tasks complete. System ready.
2026-05-06T05:54:27.838563747Z [PERF] POST /api/users/heartbeat - 3513ms | Heap: 35MB | RSS: 102MB
2026-05-06T05:54:27.838837903Z POST /api/users/heartbeat 200 54 - 3510.065 ms
2026-05-06T05:54:28.206424818Z ✅ Index synchronization complete (all performance indexes applied)
2026-05-06T06:04:41.121137061Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:04:41.358116036Z POST /api/users/heartbeat - - - - ms
2026-05-06T06:04:41.358654619Z GET /api/notifications - - - - ms
2026-05-06T06:04:41.358663569Z GET /api/bookings?page=1&limit=15 - - - - ms
2026-05-06T06:05:02.147903769Z [PERF] POST /api/users/offline - 19672ms | Heap: 35MB | RSS: 102MB
2026-05-06T06:05:02.14792989Z POST /api/users/offline 200 16 - 19670.881 ms
2026-05-06T06:05:02.85062114Z getBookingsQuery_motnk8ww: 21.729s
2026-05-06T06:06:48.672972789Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:06:48.67299922Z GET /api/notifications 200 2 - 1.058 ms
2026-05-06T06:06:55.265823872Z [PERF] GET /api/sync - 6138ms | Heap: 35MB | RSS: 104MB
2026-05-06T06:06:55.265888224Z GET /api/sync 200 - - 6127.842 ms
2026-05-06T06:07:00.171242935Z GET /api/settings/dropdowns 304 - - 68.002 ms
2026-05-06T06:07:00.673912273Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:07:00.844871188Z GET /api/users/agents 304 - - 71.537 ms
2026-05-06T06:07:00.867564678Z getBookingsQuery_motnn8ld: 194.071ms
2026-05-06T06:07:00.869710961Z GET /api/bookings?page=1&limit=15 200 - - 195.498 ms
2026-05-06T06:07:05.220582226Z [CACHE HIT] users_agents
2026-05-06T06:07:05.221512009Z GET /api/users/agents 304 - - 1.124 ms
2026-05-06T06:07:08.438083055Z deleteBooking_69fad0565d195ec9d357c11b: 578.186ms
2026-05-06T06:07:08.43872239Z [PERF] DELETE /api/bookings/69fad0565d195ec9d357c11b - 721ms | Heap: 36MB | RSS: 104MB
2026-05-06T06:07:08.43873456Z DELETE /api/bookings/69fad0565d195ec9d357c11b 200 66 - 721.004 ms
2026-05-06T06:07:09.106143524Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:07:09.313533463Z getBookingsQuery_motnnf3l: 207.235ms
2026-05-06T06:07:09.315171123Z GET /api/bookings?page=1&limit=15 200 - - 208.451 ms
2026-05-06T06:07:09.429525866Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:07:09.429864464Z GET /api/notifications 304 - - 0.580 ms
2026-05-06T06:07:11.849033108Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:07:12.418108388Z getBookingsQuery_motnnh7s: 568.731ms
2026-05-06T06:07:12.418821055Z [PERF] GET /api/bookings?myBookings=true&page=1&limit=15 - 570ms | Heap: 37MB | RSS: 105MB
2026-05-06T06:07:12.418835235Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 569.999 ms
2026-05-06T06:07:16.896045521Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:07:18.224192291Z getBookingsQuery_motnnl3z: 1.327s
2026-05-06T06:07:18.224213681Z [PERF] GET /api/bookings?assignedTo=unassigned&page=1&limit=15 - 1328ms | Heap: 37MB | RSS: 105MB
2026-05-06T06:07:18.224228152Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 1327.944 ms
2026-05-06T06:07:22.720866316Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:07:30.195277804Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:07:30.195641073Z GET /api/notifications 304 - - 0.601 ms
2026-05-06T06:07:43.83483233Z getBookingsQuery_motnnpls: 21.113s
2026-05-06T06:07:43.835167538Z [PERF] GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 - 21114ms | Heap: 37MB | RSS: 105MB
2026-05-06T06:07:43.835182009Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 304 - - 21114.559 ms
2026-05-06T06:07:48.171805788Z [GET] /api/bookings - Page: 4, Limit: 15, Search: none
2026-05-06T06:07:48.377456767Z getBookingsQuery_motno98r: 205.977ms
2026-05-06T06:07:48.378960704Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=4&limit=15 200 - - 207.188 ms
2026-05-06T06:07:51.077930666Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:07:51.078273464Z GET /api/notifications 304 - - 0.814 ms
2026-05-06T06:07:52.889174101Z [GET] /api/bookings/69c3eccc220e3d8fa652ec41
2026-05-06T06:07:53.030884829Z GET /api/bookings/69c3eccc220e3d8fa652ec41 200 - - 141.804 ms
2026-05-06T06:08:03.203632975Z [PERF] GET /api/bookings/calendar?month=5&year=2026 - 3990ms | Heap: 37MB | RSS: 105MB
2026-05-06T06:08:03.203661816Z GET /api/bookings/calendar?month=5&year=2026 304 - - 3989.357 ms
2026-05-06T06:13:37.369938721Z GET /api/bookings?outstandingOnly=true&page=2&limit=15 304 - - 211.580 ms
2026-05-06T06:13:40.114979422Z [GET] /api/bookings/69c61a80220e3d8fa652f3a4
2026-05-06T06:13:40.257060549Z GET /api/bookings/69c61a80220e3d8fa652f3a4 200 - - 141.475 ms
2026-05-06T06:13:43.929806012Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:13:43.930092749Z GET /api/notifications 304 - - 0.543 ms
2026-05-06T06:13:44.243923924Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:13:44.453631972Z getBookingsQuery_motnvvzn: 209.605ms
2026-05-06T06:13:44.454218066Z GET /api/bookings?page=2&limit=15 304 - - 210.577 ms
2026-05-06T06:13:44.971531688Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:13:44.985074557Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:13:45.019720898Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:13:45.020282271Z GET /api/bookings?page=1&limit=15 304 - - 0.733 ms
2026-05-06T06:13:45.183168473Z getBookingsQuery_motnvwjv: 211.519ms
2026-05-06T06:13:45.183608164Z GET /api/bookings?status=Interested&page=1&limit=15 304 - - 212.536 ms
2026-05-06T06:13:45.190083661Z getBookingsQuery_motnvwk8: 204.954ms
2026-05-06T06:13:45.191180688Z GET /api/bookings?status=Interested&page=2&limit=15 200 - - 205.673 ms
2026-05-06T06:13:50.031799724Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T06:13:50.583281226Z getBookingsQuery_motnw0gf: 551.834ms
2026-05-06T06:13:50.584596438Z [PERF] GET /api/bookings?status=Interested&page=5&limit=15 - 554ms | Heap: 37MB | RSS: 109MB
2026-05-06T06:13:50.584612808Z GET /api/bookings?status=Interested&page=5&limit=15 200 - - 553.027 ms
2026-05-06T06:13:54.467168973Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T06:13:54.708454598Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:13:56.087156975Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:14:02.865874702Z getBookingsQuery_motnw42c: 8.157s
2026-05-06T06:14:02.866131658Z [PERF] GET /api/bookings?status=Interested%2CNot+Interested&page=1&limit=15 - 8158ms | Heap: 38MB | RSS: 109MB
2026-05-06T06:14:02.866227011Z GET /api/bookings?status=Interested%2CNot+Interested&page=1&limit=15 304 - - 8157.771 ms
2026-05-06T06:14:02.866783054Z getBookingsQuery_motnw3vn: 8.400s
2026-05-06T06:14:02.868063656Z [PERF] GET /api/bookings?status=Interested%2CNot+Interested&page=5&limit=15 - 8401ms | Heap: 38MB | RSS: 109MB
2026-05-06T06:14:02.868099406Z GET /api/bookings?status=Interested%2CNot+Interested&page=5&limit=15 200 - - 8400.661 ms
2026-05-06T06:14:02.905580086Z getBookingsQuery_motnw54n: 6.818s
2026-05-06T06:14:02.906483298Z [PERF] GET /api/bookings?status=Not+Interested&page=1&limit=15 - 6820ms | Heap: 38MB | RSS: 109MB
2026-05-06T06:14:02.906690723Z GET /api/bookings?status=Not+Interested&page=1&limit=15 304 - - 6819.552 ms
2026-05-06T06:14:04.662345452Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:14:04.662622128Z GET /api/notifications 304 - - 0.611 ms
2026-05-06T06:14:11.614232129Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:14:11.828719495Z getBookingsQuery_motnwh3y: 214.341ms
2026-05-06T06:14:11.829389572Z GET /api/bookings?page=1&limit=15 304 - - 215.497 ms
2026-05-06T06:14:15.407370518Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:14:15.596829186Z getBookingsQuery_motnwk1b: 189.361ms
2026-05-06T06:14:15.597327739Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 304 - - 190.412 ms
2026-05-06T06:14:18.77616605Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:14:23.627625717Z getBookingsQuery_motnwmmw: 4.851s
2026-05-06T06:14:23.628351714Z [PERF] GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 - 4853ms | Heap: 38MB | RSS: 109MB
2026-05-06T06:14:23.628371375Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 304 - - 4852.538 ms
2026-05-06T06:14:25.667999878Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:14:25.668281125Z GET /api/notifications 304 - - 0.674 ms
2026-05-06T06:14:27.57117698Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:14:27.571630591Z GET /api/bookings?page=1&limit=15 304 - - 0.753 ms
2026-05-06T06:14:28.3085317Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:14:30.602406109Z getBookingsQuery_motnwtzo: 2.294s
2026-05-06T06:14:30.603162537Z [PERF] GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 - 2295ms | Heap: 39MB | RSS: 109MB
2026-05-06T06:14:30.603177888Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 304 - - 2294.854 ms
2026-05-06T06:14:33.883866315Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:14:46.459481353Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:14:46.459712569Z GET /api/notifications 304 - - 0.625 ms
2026-05-06T06:15:07.073296268Z getBookingsQuery_motnwyae: 33.195s
2026-05-06T06:15:07.074028356Z [PERF] GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 - 33196ms | Heap: 39MB | RSS: 109MB
2026-05-06T06:15:07.074043787Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=2&limit=15 304 - - 33196.137 ms
2026-05-06T06:15:07.248378711Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:15:07.250962384Z GET /api/notifications 304 - - 0.556 ms
2026-05-06T06:15:21.786339859Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T06:15:22.008334942Z getBookingsQuery_motnxz96: 221.927ms
2026-05-06T06:15:22.009595352Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=3&limit=15 200 - - 222.891 ms
2026-05-06T06:15:27.998566583Z GET /api/notifications 304 - - 71.231 ms
2026-05-06T06:15:30.762189883Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T06:15:30.784778922Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:15:30.797394028Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:15:32.553629476Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:15:41.488090842Z getBookingsQuery_motny66i: 10.726s
2026-05-06T06:15:41.489622349Z [PERF] GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c538b0220e3d8fa652f122&page=3&limit=15 - 10728ms | Heap: 39MB | RSS: 110MB
2026-05-06T06:15:41.489638169Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c538b0220e3d8fa652f122&page=3&limit=15 200 - - 10726.737 ms
2026-05-06T06:15:41.490960281Z getBookingsQuery_motny67g: 10.694s
2026-05-06T06:15:41.491424763Z [PERF] GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 - 10695ms | Heap: 39MB | RSS: 110MB
2026-05-06T06:15:41.491437753Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 304 - - 10694.703 ms
2026-05-06T06:15:41.493321199Z getBookingsQuery_motny674: 10.709s
2026-05-06T06:15:41.49378559Z [PERF] GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c538b0220e3d8fa652f122&page=1&limit=15 - 10709ms | Heap: 39MB | RSS: 110MB
2026-05-06T06:15:41.49380208Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6%2C69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 10709.188 ms
2026-05-06T06:15:43.844336594Z getBookingsQuery_motny7k9: 11.291s
2026-05-06T06:15:43.845109162Z [PERF] GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 - 11292ms | Heap: 39MB | RSS: 110MB
2026-05-06T06:15:43.845125773Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 11291.587 ms
2026-05-06T06:15:48.671321785Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:15:48.671610872Z GET /api/notifications 304 - - 1.089 ms
2026-05-06T06:15:52.156563757Z [GET] /api/bookings - Page: 7, Limit: 15, Search: none
2026-05-06T06:15:52.352461178Z getBookingsQuery_motnymos: 195.762ms
2026-05-06T06:15:52.353954234Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=7&limit=15 200 - - 196.923 ms
2026-05-06T06:15:56.864901856Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T06:15:57.073923776Z getBookingsQuery_motnyqbk: 208.999ms
2026-05-06T06:15:57.080926616Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=3&limit=15 200 - - 210.412 ms
2026-05-06T06:16:00.73420367Z [GET] /api/bookings - Page: 3, Limit: 15, Search: none
2026-05-06T06:16:00.735795559Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:00.786602254Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c538b0220e3d8fa652f122________1_15
2026-05-06T06:16:00.787192988Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 304 - - 0.753 ms
2026-05-06T06:16:00.936249581Z getBookingsQuery_motnytb3: 199.494ms
2026-05-06T06:16:00.936281882Z GET /api/bookings?page=1&limit=15 304 - - 200.513 ms
2026-05-06T06:16:00.937742467Z getBookingsQuery_motnytb2: 203.403ms
2026-05-06T06:16:00.939012158Z GET /api/bookings?page=3&limit=15 200 - - 204.510 ms
2026-05-06T06:16:01.771633883Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:01.984438195Z getBookingsQuery_motnyu3v: 212.285ms
2026-05-06T06:16:01.985934572Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 214.519 ms
2026-05-06T06:16:02.038734605Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:02.245336446Z getBookingsQuery_motnyuba: 206.509ms
2026-05-06T06:16:02.246069544Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 207.545 ms
2026-05-06T06:16:07.009732701Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:16:25.834188566Z getBookingsQuery_motnyy5d: 18.824s
2026-05-06T06:16:25.834853823Z [PERF] GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 - 18825ms | Heap: 40MB | RSS: 110MB
2026-05-06T06:16:25.834927444Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=2&limit=15 304 - - 18825.386 ms
2026-05-06T06:16:29.357016908Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:16:29.357273034Z GET /api/notifications 304 - - 0.670 ms
2026-05-06T06:16:33.832822892Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:33.851358853Z [GET] /api/bookings - Page: 2, Limit: 15, Search: none
2026-05-06T06:16:33.854723284Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69eb50af8e47cc04dc29918d________1_15
2026-05-06T06:16:33.855219776Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 304 - - 0.695 ms
2026-05-06T06:16:34.043138815Z getBookingsQuery_motnziug: 210.191ms
2026-05-06T06:16:34.04373683Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 211.214 ms
2026-05-06T06:16:34.056863889Z getBookingsQuery_motnziuz: 205.418ms
2026-05-06T06:16:34.067851636Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=2&limit=15 304 - - 206.406 ms
2026-05-06T06:16:35.25588618Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:35.46193714Z getBookingsQuery_motnzjxz: 205.897ms
2026-05-06T06:16:35.462526534Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 304 - - 206.952 ms
2026-05-06T06:16:39.670943455Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:40.291334629Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:16:44.0278194Z getBookingsQuery_motnzncm: 4.356s
2026-05-06T06:16:44.027852261Z [PERF] GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d%2C69c537cb220e3d8fa652f0f2&page=1&limit=15 - 4357ms | Heap: 40MB | RSS: 111MB
2026-05-06T06:16:44.027858691Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d%2C69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 4357.056 ms
2026-05-06T06:16:45.359543082Z getBookingsQuery_motnzntv: 5.068s
2026-05-06T06:16:45.360161017Z [PERF] GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 - 5070ms | Heap: 41MB | RSS: 111MB
2026-05-06T06:16:45.360174947Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 5069.096 ms
2026-05-06T06:16:50.061406702Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:16:50.061782622Z GET /api/notifications 304 - - 0.589 ms
2026-05-06T06:17:01.535296808Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T06:17:10.792316519Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:17:10.792663017Z GET /api/notifications 304 - - 0.519 ms
2026-05-06T06:17:31.561457262Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:17:31.5617834Z GET /api/notifications 304 - - 0.622 ms
2026-05-06T06:17:34.747835741Z getBookingsQuery_moto047s: 33.216s
2026-05-06T06:17:34.747868512Z [PERF] GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=5&limit=15 - 33218ms | Heap: 41MB | RSS: 111MB
2026-05-06T06:17:34.747874392Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=5&limit=15 304 - - 33217.573 ms
2026-05-06T06:17:45.124827086Z [GET] /api/bookings - Page: 5, Limit: 15, Search: none
2026-05-06T06:17:45.13364323Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:17:45.140477096Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__69c537cb220e3d8fa652f0f2________1_15
2026-05-06T06:17:45.14102903Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 304 - - 0.570 ms
2026-05-06T06:17:45.329373032Z getBookingsQuery_moto11us: 204.576ms
2026-05-06T06:17:45.330988652Z getBookingsQuery_moto11uz: 198.605ms
2026-05-06T06:17:45.331013292Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108&page=1&limit=15 304 - - 199.343 ms
2026-05-06T06:17:45.331639167Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108&page=5&limit=15 200 - - 205.619 ms
2026-05-06T06:17:46.602137471Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:17:46.814515279Z getBookingsQuery_moto12zu: 212.215ms
2026-05-06T06:17:46.815323128Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 304 - - 213.523 ms
2026-05-06T06:17:52.473727023Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:17:52.474700497Z GET /api/notifications 304 - - 0.559 ms
2026-05-06T06:17:52.649374487Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:17:52.934106236Z getBookingsQuery_moto17nt: 284.607ms
2026-05-06T06:17:52.934793203Z GET /api/bookings?page=1&limit=15 304 - - 285.749 ms
2026-05-06T06:17:53.316794848Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:17:53.527026024Z getBookingsQuery_moto186b: 211.354ms
2026-05-06T06:17:53.527870604Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 304 - - 212.911 ms
2026-05-06T06:18:01.738888859Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:18:13.162414549Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:18:13.162810448Z GET /api/notifications 304 - - 0.575 ms
2026-05-06T06:18:22.847325272Z getBookingsQuery_moto1eoa: 21.109s
2026-05-06T06:18:22.847837244Z [PERF] GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 - 21110ms | Heap: 42MB | RSS: 112MB
2026-05-06T06:18:22.847861745Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 21109.580 ms
2026-05-06T06:18:30.611524812Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:18:30.61226061Z GET /api/bookings?page=1&limit=15 304 - - 1.042 ms
2026-05-06T06:18:31.890413035Z GET /api/settings/dropdowns 304 - - 70.898 ms
2026-05-06T06:18:33.870385906Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:18:33.870746765Z GET /api/notifications 304 - - 1.222 ms
2026-05-06T06:18:51.381253796Z [CACHE HIT] bookings_69ae7ab0c8fbcb313fa0c744__________1_15
2026-05-06T06:18:51.381844531Z GET /api/bookings?page=1&limit=15 304 - - 0.945 ms
2026-05-06T06:18:54.937222782Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:18:54.937513499Z GET /api/notifications 304 - - 0.563 ms
2026-05-06T06:19:07.006556037Z [PERF] POST /api/bookings - 20713ms | Heap: 38MB | RSS: 113MB
2026-05-06T06:19:07.006578347Z POST /api/bookings 201 - - 20712.317 ms
2026-05-06T06:19:07.72982436Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:19:07.944245942Z getBookingsQuery_moto2tld: 214.387ms
2026-05-06T06:19:07.94538372Z GET /api/bookings?page=1&limit=15 200 - - 215.249 ms
2026-05-06T06:19:15.779860852Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:19:15.78017485Z GET /api/notifications 304 - - 0.565 ms
2026-05-06T06:19:17.504793783Z GET /api/users/agents 304 - - 70.623 ms
2026-05-06T06:19:22.747340942Z PATCH /api/bookings/69fadd4ec6b2f5f324f2de33/status 200 1018 - 332.942 ms
2026-05-06T06:19:23.186339525Z [PERF] PUT /api/bookings/69fadd4ec6b2f5f324f2de33 - 787ms | Heap: 39MB | RSS: 112MB
2026-05-06T06:19:23.186360925Z PUT /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 771.436 ms
2026-05-06T06:19:23.908092665Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:19:24.127421247Z getBookingsQuery_moto362r: 218.405ms
2026-05-06T06:19:24.130618625Z GET /api/bookings?page=1&limit=15 200 - - 221.381 ms
2026-05-06T06:19:25.04429043Z [GET] /api/bookings/69fadd4ec6b2f5f324f2de33
2026-05-06T06:19:25.250783699Z GET /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 205.419 ms
2026-05-06T06:19:36.752206843Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:19:36.772943088Z GET /api/notifications 304 - - 0.634 ms
2026-05-06T06:19:45.44285603Z [PERF] GET /api/settings/dropdowns - 5161ms | Heap: 40MB | RSS: 112MB
2026-05-06T06:19:45.442891221Z GET /api/settings/dropdowns 304 - - 5160.962 ms
2026-05-06T06:19:57.485813667Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:19:57.485835557Z GET /api/notifications 304 - - 0.895 ms
2026-05-06T06:20:18.243599917Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:20:18.244323214Z GET /api/notifications 304 - - 0.735 ms
2026-05-06T06:20:38.95448815Z GET /api/notifications 304 - - 65.203 ms
2026-05-06T06:21:00.159013693Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:21:00.16010326Z GET /api/notifications 304 - - 0.715 ms
2026-05-06T06:21:20.905776132Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:21:20.910850086Z GET /api/notifications 304 - - 0.580 ms
2026-05-06T06:21:21.01353977Z [PERF] POST /api/bookings/69fadd4ec6b2f5f324f2de33/payments - 22403ms | Heap: 40MB | RSS: 112MB
2026-05-06T06:21:21.013559841Z POST /api/bookings/69fadd4ec6b2f5f324f2de33/payments 201 308 - 22402.313 ms
2026-05-06T06:21:21.691855531Z [GET] /api/bookings/69fadd4ec6b2f5f324f2de33
2026-05-06T06:21:21.692742543Z (node:65) Warning: Label 'getBookingById_69fadd4ec6b2f5f324f2de33' already exists for console.time()
2026-05-06T06:21:21.695973732Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-06T06:21:21.911122049Z GET /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 206.297 ms
2026-05-06T06:21:28.628395763Z DELETE /api/bookings/69fadd4ec6b2f5f324f2de33/payments/69faddddc6b2f5f324f2de5c 200 42 - 469.623 ms
2026-05-06T06:21:29.238921602Z [GET] /api/bookings/69fadd4ec6b2f5f324f2de33
2026-05-06T06:21:29.239207409Z (node:65) Warning: Label 'getBookingById_69fadd4ec6b2f5f324f2de33' already exists for console.time()
2026-05-06T06:21:29.434269367Z GET /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 194.945 ms
2026-05-06T06:21:34.957998443Z [PASSENGER PERF] Add Passengers - Total: 439ms | DB: 77ms | Count: 2
2026-05-06T06:21:35.036219021Z [PERF] PATCH /api/bookings/69fadd4ec6b2f5f324f2de33/status - 578ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:35.04604371Z PATCH /api/bookings/69fadd4ec6b2f5f324f2de33/status 200 1017 - 577.389 ms
2026-05-06T06:21:35.046072631Z [PERF] POST /api/bookings/69fadd4ec6b2f5f324f2de33/passengers - 521ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:35.046079611Z POST /api/bookings/69fadd4ec6b2f5f324f2de33/passengers 201 967 - 520.040 ms
2026-05-06T06:21:35.252271Z [PERF] POST /api/bookings/69fadd4ec6b2f5f324f2de33/payments - 822ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:35.252290031Z POST /api/bookings/69fadd4ec6b2f5f324f2de33/payments 201 308 - 822.069 ms
2026-05-06T06:21:35.455445546Z [PERF] PUT /api/bookings/69fadd4ec6b2f5f324f2de33 - 566ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:35.455516207Z PUT /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 564.827 ms
2026-05-06T06:21:35.819440423Z (node:65) Warning: Label 'getBookingById_69fadd4ec6b2f5f324f2de33' already exists for console.time()
2026-05-06T06:21:35.819469744Z [GET] /api/bookings/69fadd4ec6b2f5f324f2de33
2026-05-06T06:21:36.564354711Z GET /api/settings/dropdowns 304 - - 363.128 ms
2026-05-06T06:21:36.727936281Z [PERF] GET /api/bookings/69fadd4ec6b2f5f324f2de33 - 910ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:36.727956962Z GET /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 908.636 ms
2026-05-06T06:21:41.591041354Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:21:41.591066915Z GET /api/notifications 304 - - 0.705 ms
2026-05-06T06:21:52.883218835Z [PERF] PATCH /api/bookings/69fadd4ec6b2f5f324f2de33/verify - 10316ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:52.883240476Z PATCH /api/bookings/69fadd4ec6b2f5f324f2de33/verify 200 61 - 10315.311 ms
2026-05-06T06:21:53.855615846Z [GET] /api/bookings/69fadd4ec6b2f5f324f2de33
2026-05-06T06:21:53.855917893Z (node:65) Warning: Label 'getBookingById_69fadd4ec6b2f5f324f2de33' already exists for console.time()
2026-05-06T06:21:59.519635558Z [PERF] GET /api/bookings/69fadd4ec6b2f5f324f2de33 - 5664ms | Heap: 41MB | RSS: 113MB
2026-05-06T06:21:59.519657328Z GET /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 5663.519 ms
2026-05-06T06:22:02.624517103Z [CACHE HIT] notifications_69ae7ab0c8fbcb313fa0c744
2026-05-06T06:22:02.624912723Z GET /api/notifications 304 - - 0.622 ms
2026-05-06T06:22:06.576535508Z PATCH /api/bookings/69fadd4ec6b2f5f324f2de33/verify 200 64 - 197.220 ms
2026-05-06T06:22:07.334407987Z [GET] /api/bookings/69fadd4ec6b2f5f324f2de33
2026-05-06T06:22:07.334904379Z (node:65) Warning: Label 'getBookingById_69fadd4ec6b2f5f324f2de33' already exists for console.time()
2026-05-06T06:22:07.531548787Z GET /api/bookings/69fadd4ec6b2f5f324f2de33 200 - - 196.796 ms
2026-05-06T06:22:09.539486765Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:22:09.574571271Z GET /api/users/agents 304 - - 65.324 ms
2026-05-06T06:22:09.759944804Z getBookingsQuery_moto6pvn: 212.317ms
2026-05-06T06:22:09.760022096Z GET /api/bookings?page=1&limit=15 200 - - 213.415 ms
2026-05-06T06:22:12.901295136Z [CACHE HIT] users_agents
2026-05-06T06:22:12.901740757Z GET /api/users/agents 304 - - 0.758 ms
2026-05-06T06:22:16.526440925Z deleteBooking_69fadd4ec6b2f5f324f2de33: 1.026s
2026-05-06T06:22:16.526473086Z [PERF] DELETE /api/bookings/69fadd4ec6b2f5f324f2de33 - 1348ms | Heap: 42MB | RSS: 113MB
2026-05-06T06:22:16.526594109Z DELETE /api/bookings/69fadd4ec6b2f5f324f2de33 200 66 - 1347.224 ms
2026-05-06T06:22:17.307855141Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-06T06:22:17.518296045Z getBookingsQuery_moto6vvf: 210.317ms
2026-05-06T06:22:17.519511665Z GET /api/bookings?page=1&limit=15 200 - - 211.381 ms