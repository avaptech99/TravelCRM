2026-05-04T18:39:11.645399117Z ==> Deploying...
2026-05-04T18:39:11.711791537Z ==> Setting WEB_CONCURRENCY=1 by default, based on available CPUs in the instance
2026-05-04T18:39:32.621119231Z ==> Running 'npm run start'
2026-05-04T18:39:33.624432205Z 
2026-05-04T18:39:33.624459965Z > travel-crm-backend@1.0.0 start
2026-05-04T18:39:33.624464556Z > node dist/src/server.js
2026-05-04T18:39:33.624467065Z 
2026-05-04T18:39:40.321121502Z Server running in production mode on port 10000
2026-05-04T18:39:40.614179385Z HEAD / 200 36 - 2.644 ms
2026-05-04T18:39:41.206376009Z MongoDB Connected: ac-nvjnavm-shard-00-00.31xmkrx.mongodb.net
2026-05-04T18:39:42.089481392Z [Migration] Outstanding field already present on all bookings.
2026-05-04T18:39:42.089614136Z [FollowUp Cron] Started — checking every 12 hours for due follow-ups.
2026-05-04T18:39:42.264344717Z ==> Your service is live 🎉
2026-05-04T18:39:42.350481821Z GET / 200 36 - 0.511 ms
2026-05-04T18:39:42.393373344Z ==> 
2026-05-04T18:39:42.399619796Z ==> ///////////////////////////////////////////////////////////
2026-05-04T18:39:42.403803719Z ==> 
2026-05-04T18:39:42.407566441Z ==> Available at your primary URL https://travelcrm-2-0.onrender.com
2026-05-04T18:39:42.411894426Z ==> 
2026-05-04T18:39:42.415512805Z ==> ///////////////////////////////////////////////////////////
2026-05-04T18:41:49.215706311Z GET /api/notifications 304 - - 100.624 ms
2026-05-04T18:41:49.228472453Z GET /api/sync 200 - - 178.474 ms
2026-05-04T18:41:51.467413688Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:41:51.533582434Z GET /api/users/agents 304 - - 63.329 ms
2026-05-04T18:41:51.616301143Z getBookingsQuery_morjq9uz: 148.243ms
2026-05-04T18:41:51.618671981Z GET /api/bookings?page=1&limit=15 200 - - 150.933 ms
2026-05-04T18:41:52.067440108Z GET /api/settings/dropdowns 304 - - 70.239 ms
2026-05-04T18:41:52.96245271Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:41:53.104920688Z getBookingsQuery_morjqb0i: 139.907ms
2026-05-04T18:41:53.104939339Z GET /api/bookings?myBookings=true&page=1&limit=15 200 - - 141.118 ms
2026-05-04T18:41:54.298410138Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:41:54.42914798Z getBookingsQuery_morjqc1m: 130.601ms
2026-05-04T18:41:54.430650487Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 131.865 ms
2026-05-04T18:41:55.852710166Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:41:57.400353351Z getBookingsQuery_morjqd8r: 1.548s
2026-05-04T18:41:57.402287218Z GET /api/bookings?status=Booked&isConvertedToEDT=true&page=1&limit=15 200 - - 1550.060 ms
2026-05-04T18:41:59.180717127Z GET /api/bookings/calendar?month=5&year=2026 304 - - 135.120 ms
2026-05-04T18:42:07.886603297Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 2.657 ms
2026-05-04T18:42:09.176755582Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.652 ms
2026-05-04T18:42:09.639795426Z GET /api/users 304 - - 8716.928 ms
2026-05-04T18:42:09.777679652Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:42:09.778041421Z GET /api/notifications 304 - - 0.609 ms
2026-05-04T18:42:11.458763331Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.611 ms
2026-05-04T18:42:15.974800174Z GET /api/analytics/revenue-trends?interval=month&companyName= 304 - - 8623.162 ms
2026-05-04T18:42:15.995751255Z GET /api/analytics/bookings?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 264 - 8641.477 ms
2026-05-04T18:42:16.001488555Z GET /api/analytics/agents?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 - - 8651.790 ms
2026-05-04T18:42:18.644619866Z GET /api/analytics/payments?fromDate=2026-04-05&toDate=2026-05-05&companyName= 200 101 - 10779.274 ms
2026-05-04T18:42:18.987163438Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.720 ms
2026-05-04T18:42:20.290536453Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.617 ms
2026-05-04T18:42:22.5620278Z GET /api/analytics/payment-breakdown?fromDate=2026-04-05&toDate=2026-05-05&companyName= 404 170 - 0.740 ms
2026-05-04T18:42:27.700112407Z GET /api/sync 200 - - 138.731 ms
2026-05-04T18:42:28.104940388Z [CACHE HIT] bookings_69f04fe24a7ed39fe75e2117__________1_15
2026-05-04T18:42:28.105758688Z GET /api/bookings?page=1&limit=15 304 - - 1.118 ms
2026-05-04T18:42:30.428668997Z GET /api/notifications 304 - - 68.436 ms
2026-05-04T18:42:34.096006929Z [GET] /api/bookings - Page: 30, Limit: 15, Search: none
2026-05-04T18:42:34.231997188Z getBookingsQuery_morjr6r3: 135.849ms
2026-05-04T18:42:34.235564035Z GET /api/bookings?page=30&limit=15 200 - - 137.263 ms
2026-05-04T18:42:36.455288352Z [GET] /api/bookings/69ccd36e12d6ce0419001044
2026-05-04T18:42:37.859813982Z GET /api/bookings/69ccd36e12d6ce0419001044 200 - - 1404.465 ms
2026-05-04T18:42:50.999995396Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:42:51.000280863Z GET /api/notifications 304 - - 0.680 ms
2026-05-04T18:42:53.976616638Z [CACHE HIT] bookings_69f04fe24a7ed39fe75e2117__________30_15
2026-05-04T18:42:53.977242833Z GET /api/bookings?page=30&limit=15 304 - - 0.901 ms
2026-05-04T18:42:55.054610125Z [GET] /api/bookings/69ccf97512d6ce04190011ce
2026-05-04T18:43:03.260290896Z GET /api/settings/dropdowns 304 - - 9148.432 ms
2026-05-04T18:43:03.262694165Z GET /api/users/agents 304 - - 9285.007 ms
2026-05-04T18:43:04.214677305Z GET /api/bookings/69ccf97512d6ce04190011ce 200 - - 9159.653 ms
2026-05-04T18:43:17.180992662Z [CACHE HIT] bookings_69f04fe24a7ed39fe75e2117__________30_15
2026-05-04T18:43:17.182271193Z GET /api/bookings?page=30&limit=15 304 - - 1.806 ms
2026-05-04T18:43:21.272779018Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:21.301931169Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:21.388604224Z [GET] /api/bookings - Page: 30, Limit: 15, Search: none
2026-05-04T18:43:22.213265984Z getBookingsQuery_morjs78s: 824.501ms
2026-05-04T18:43:22.213845228Z GET /api/bookings?status=Pending&page=30&limit=15 200 67 - 825.361 ms
2026-05-04T18:43:22.260763023Z getBookingsQuery_morjs75k: 987.902ms
2026-05-04T18:43:22.262095186Z GET /api/bookings?status=Pending&page=1&limit=15 200 - - 988.920 ms
2026-05-04T18:43:22.321161127Z getBookingsQuery_morjs76d: 1.019s
2026-05-04T18:43:22.321783042Z GET /api/bookings?page=1&limit=15 304 - - 1020.048 ms
2026-05-04T18:43:23.18650529Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:23.802501599Z getBookingsQuery_morjs8mq: 615.839ms
2026-05-04T18:43:23.803950784Z GET /api/bookings?status=Sent&page=1&limit=15 200 - - 617.062 ms
2026-05-04T18:43:27.921895383Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:38.308574852Z getBookingsQuery_morjsca9: 10.387s
2026-05-04T18:43:38.309850403Z GET /api/bookings?status=Booked&page=1&limit=15 200 - - 10387.728 ms
2026-05-04T18:43:41.429763504Z GET /api/notifications 304 - - 9870.421 ms
2026-05-04T18:43:43.61161987Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:44.183632474Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:46.195875571Z getBookingsQuery_morjsoe3: 2.583s
2026-05-04T18:43:46.197550452Z GET /api/bookings?status=Booked%2CWorking&page=1&limit=15 200 - - 2584.775 ms
2026-05-04T18:43:46.259011871Z getBookingsQuery_morjsotz: 2.075s
2026-05-04T18:43:46.259680658Z GET /api/bookings?status=Working&page=1&limit=15 200 - - 2075.627 ms
2026-05-04T18:43:48.564908181Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:48.701086513Z getBookingsQuery_morjss7o: 136.042ms
2026-05-04T18:43:48.70261434Z GET /api/bookings?status=Working%2CPending&page=1&limit=15 200 - - 137.354 ms
2026-05-04T18:43:49.333694724Z [CACHE HIT] bookings_69f04fe24a7ed39fe75e2117_Pending_________1_15
2026-05-04T18:43:49.333740706Z GET /api/bookings?status=Pending&page=1&limit=15 304 - - 1.072 ms
2026-05-04T18:43:54.901375217Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:55.031215114Z getBookingsQuery_morjsx3p: 129.727ms
2026-05-04T18:43:55.032138746Z GET /api/bookings?status=Pending&assignedTo=unassigned&page=1&limit=15 200 - - 130.828 ms
2026-05-04T18:43:56.458204011Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:43:56.591560354Z getBookingsQuery_morjsyay: 133.227ms
2026-05-04T18:43:56.592656231Z GET /api/bookings?assignedTo=unassigned&page=1&limit=15 200 - - 134.071 ms
2026-05-04T18:43:59.289798459Z [CACHE HIT] bookings_69f04fe24a7ed39fe75e2117__________1_15
2026-05-04T18:43:59.290453855Z GET /api/bookings?page=1&limit=15 304 - - 0.986 ms
2026-05-04T18:43:59.88960455Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:00.025393222Z getBookingsQuery_morjt0y9: 135.655ms
2026-05-04T18:44:00.026794006Z GET /api/bookings?assignedTo=69c52979220e3d8fa652ee44&page=1&limit=15 200 - - 136.822 ms
2026-05-04T18:44:02.004991857Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:44:02.005279934Z GET /api/notifications 304 - - 0.561 ms
2026-05-04T18:44:02.61027129Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:08.346429568Z getBookingsQuery_morjt31u: 5.736s
2026-05-04T18:44:08.347717179Z GET /api/bookings?assignedTo=69c2a2038787a5edc5143fb6&page=1&limit=15 200 - - 5737.055 ms
2026-05-04T18:44:10.415906372Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:10.554706817Z getBookingsQuery_morjt92n: 138.663ms
2026-05-04T18:44:10.555965238Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122&page=1&limit=15 200 - - 139.623 ms
2026-05-04T18:44:12.753803322Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:13.159513227Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:13.418867582Z getBookingsQuery_morjtavl: 664.977ms
2026-05-04T18:44:13.420068332Z GET /api/bookings?assignedTo=69c538b0220e3d8fa652f122%2C69eb50af8e47cc04dc29918d&page=1&limit=15 200 - - 665.886 ms
2026-05-04T18:44:13.546131346Z getBookingsQuery_morjtb6v: 386.489ms
2026-05-04T18:44:13.547477639Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d&page=1&limit=15 200 - - 387.477 ms
2026-05-04T18:44:15.187659891Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:15.562528854Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:46.484804092Z ==> Detected service running on port 10000
2026-05-04T18:44:46.601270839Z ==> Docs on specifying a port: https://render.com/docs/web-services#port-binding
2026-05-04T18:44:44.05404551Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:44:44.735148548Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:00.14831282Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:01.073346643Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:01.144644241Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:02.126069779Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:02.479998117Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:03.075889125Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:04.136227166Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:04.140463079Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:05.900394206Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:11.749573553Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:13.671872985Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:15.571975606Z GET /api/notifications 304 - - 52943.894 ms
2026-05-04T18:45:15.574105928Z getBookingsQuery_morjtd1m: 1:00.011 (m:ss.mmm)
2026-05-04T18:45:15.575457471Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d&page=1&limit=15 200 - - 60012.460 ms
2026-05-04T18:45:15.883190603Z getBookingsQuery_morjudpf: 12.807s
2026-05-04T18:45:15.883585192Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&page=1&limit=15 304 - - 12807.971 ms
2026-05-04T18:45:16.076569137Z getBookingsQuery_morjtcr7: 1:00.889 (m:ss.mmm)
2026-05-04T18:45:16.078731209Z GET /api/bookings?assignedTo=69eb50af8e47cc04dc29918d%2C69c2a1b98787a5edc5143f9d&page=1&limit=15 200 - - 60889.921 ms
2026-05-04T18:45:16.21987578Z getBookingsQuery_morjtz11: 32.166s
2026-05-04T18:45:16.221970201Z GET /api/bookings?assignedTo=69c2a1b98787a5edc5143f9d%2C69c537cb220e3d8fa652f0f2&page=1&limit=15 200 - - 32166.699 ms
2026-05-04T18:45:16.287818106Z getBookingsQuery_morjtzjv: 31.555s
2026-05-04T18:45:16.290406239Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2&page=1&limit=15 200 - - 31556.625 ms
2026-05-04T18:45:16.359624357Z getBookingsQuery_morjubg4: 16.211s
2026-05-04T18:45:16.361737398Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108&page=1&limit=15 200 - - 16212.542 ms
2026-05-04T18:45:16.427460651Z getBookingsQuery_morjuc5t: 15.354s
2026-05-04T18:45:16.429833388Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=1&limit=15 200 - - 15355.000 ms
2026-05-04T18:45:16.719971471Z getBookingsQuery_morjuc7s: 15.575s
2026-05-04T18:45:16.913260933Z getBookingsQuery_morjucz1: 14.787s
2026-05-04T18:45:16.917488906Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108%2C69c53878220e3d8fa652f115&page=1&limit=15 200 - - 14788.221 ms
2026-05-04T18:45:16.917792373Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 200 - - 15670.039 ms
2026-05-04T18:45:16.971563484Z getBookingsQuery_morjud8v: 14.491s
2026-05-04T18:45:16.973756908Z GET /api/bookings?assignedTo=69c537cb220e3d8fa652f0f2%2C69c53878220e3d8fa652f115&page=1&limit=15 200 - - 14492.525 ms
2026-05-04T18:45:17.045276841Z getBookingsQuery_morjueiv: 12.909s
2026-05-04T18:45:17.045776913Z GET /api/bookings?myBookings=true&page=1&limit=15 304 - - 12909.901 ms
2026-05-04T18:45:17.104910065Z getBookingsQuery_morjuej0: 12.964s
2026-05-04T18:45:17.106401591Z GET /api/bookings?assignedTo=69c53878220e3d8fa652f115&myBookings=true&page=1&limit=15 200 - - 12965.015 ms
2026-05-04T18:45:17.163407481Z getBookingsQuery_morjufvu: 11.264s
2026-05-04T18:45:17.164116648Z GET /api/bookings?page=1&limit=15 304 - - 11265.264 ms
2026-05-04T18:45:17.221864796Z getBookingsQuery_morjulvr: 3.550s
2026-05-04T18:45:17.223631949Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131%2C69c53878220e3d8fa652f115&page=1&limit=15 200 - - 3551.120 ms
2026-05-04T18:45:17.285293802Z getBookingsQuery_morjuked: 5.536s
2026-05-04T18:45:17.286518592Z GET /api/bookings?assignedTo=69c53915220e3d8fa652f131&page=1&limit=15 200 - - 5536.605 ms
2026-05-04T18:45:22.754938735Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:22.893916243Z getBookingsQuery_morjusw2: 138.815ms
2026-05-04T18:45:22.914518745Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108&page=1&limit=15 200 - - 159.115 ms
2026-05-04T18:45:24.914514128Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:25.056032917Z getBookingsQuery_morjuuk2: 141.414ms
2026-05-04T18:45:25.057182965Z GET /api/bookings?assignedTo=69c53849220e3d8fa652f108%2C69c53915220e3d8fa652f131&page=1&limit=15 200 - - 142.362 ms
2026-05-04T18:45:34.946819177Z GET /api/settings/dropdowns 304 - - 887.838 ms
2026-05-04T18:45:36.157224209Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:45:36.157557887Z GET /api/notifications 304 - - 0.561 ms
2026-05-04T18:45:45.023215632Z [BOOKING PERF] Create Booking - Total: 3923ms | DB: 496ms
2026-05-04T18:45:45.256384584Z [ACTIVITY LOG] BOOKING_CREATED for booking 69f8e9587a97cc2c739203ba
2026-05-04T18:45:45.259233974Z POST /api/bookings 201 - - 4154.607 ms
2026-05-04T18:45:45.824363178Z [GET] /api/bookings - Page: 1, Limit: 15, Search: none
2026-05-04T18:45:45.962228558Z getBookingsQuery_morjvaow: 137.747ms
2026-05-04T18:45:45.96354696Z GET /api/bookings?page=1&limit=15 200 - - 138.715 ms
2026-05-04T18:45:48.943453596Z [GET] /api/bookings/69f8e9587a97cc2c739203ba
2026-05-04T18:45:49.193197163Z GET /api/bookings/69f8e9587a97cc2c739203ba 200 - - 250.181 ms
2026-05-04T18:45:56.753170787Z GET /api/notifications 304 - - 58.473 ms
2026-05-04T18:46:17.307800512Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:46:17.308152061Z GET /api/notifications 304 - - 0.766 ms
2026-05-04T18:46:39.529551358Z GET /api/notifications 304 - - 1640.638 ms
2026-05-04T18:47:00.084072244Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:47:00.084355941Z GET /api/notifications 304 - - 0.532 ms
2026-05-04T18:47:29.302792609Z GET /api/notifications 304 - - 8598.381 ms
2026-05-04T18:47:49.849591157Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:47:49.849884144Z GET /api/notifications 304 - - 0.661 ms
2026-05-04T18:48:10.5121436Z GET /api/notifications 304 - - 69.811 ms
2026-05-04T18:48:31.085666372Z [CACHE HIT] notifications_69f04fe24a7ed39fe75e2117
2026-05-04T18:48:31.086429361Z GET /api/notifications 304 - - 0.629 ms
2026-05-04T18:49:22.415619251Z GET /api/notifications 304 - - 9639.273 ms
2026-05-04T18:49:22.472229098Z [PASSENGER PERF] Add Passengers - Total: 43140ms | DB: 1459ms | Count: 2
2026-05-04T18:49:22.656983614Z [ACTIVITY LOG] PASSENGERS_ADDED for booking 69f8e9587a97cc2c739203ba
2026-05-04T18:49:22.657561288Z POST /api/bookings/69f8e9587a97cc2c739203ba/passengers 201 967 - 43325.608 ms
2026-05-04T18:49:22.658496861Z [ACTIVITY LOG] BOOKING_UPDATED for booking 69f8e9587a97cc2c739203ba
2026-05-04T18:49:22.659814323Z [ACTIVITY LOG] STATUS_CHANGE for booking 69f8e9587a97cc2c739203ba
2026-05-04T18:49:22.660387607Z PATCH /api/bookings/69f8e9587a97cc2c739203ba/status 200 782 - 43347.398 ms
2026-05-04T18:49:22.872612851Z [ACTIVITY LOG] PAYMENT_ADDED for booking 69f8e9587a97cc2c739203ba
2026-05-04T18:49:22.873203806Z POST /api/bookings/69f8e9587a97cc2c739203ba/payments 201 311 - 43556.336 ms
2026-05-04T18:49:23.064810979Z PUT /api/bookings/69f8e9587a97cc2c739203ba 200 - - 43739.058 ms
2026-05-04T18:49:23.623733819Z [GET] /api/bookings/69f8e9587a97cc2c739203ba
2026-05-04T18:49:23.624871387Z (node:83) Warning: Label 'getBookingById_69f8e9587a97cc2c739203ba' already exists for console.time()
2026-05-04T18:49:23.624890528Z (Use `node --trace-warnings ...` to show where the warning was created)
2026-05-04T18:49:23.698445527Z GET /api/settings/dropdowns 304 - - 58.253 ms
2026-05-04T18:49:23.878515089Z GET /api/bookings/69f8e9587a97cc2c739203ba 200 - - 254.728 ms