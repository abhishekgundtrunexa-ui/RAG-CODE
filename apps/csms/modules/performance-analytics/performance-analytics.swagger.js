/**
 * @swagger
 * /api/performance/charger-analytics:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Charger Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charger Analytics Response
 *
 * /api/performance/revenue-analytics:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Get revenue analytics
 *     description: Retrieve comprehensive revenue analytics including total revenue, revenue per charger, revenue per site, revenue per CPO, revenue per session, and revenue payout distribution
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *         example: "2024-01-31"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Country code for filtering
 *         example: "US"
 *       - in: query
 *         name: evseStationId
 *         schema:
 *           type: string
 *         description: EVSE Station ID for filtering
 *         example: "station-123"
 *     responses:
 *       200:
 *         description: Revenue analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenueAnalytics:
 *                   type: object
 *                   properties:
 *                     totalRevenue:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Total revenue amount
 *                           example: 124567.89
 *                         comparison:
 *                           type: string
 *                           description: Month-over-month comparison
 *                           example: "+12.64% this month"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether the comparison is positive
 *                           example: true
 *                     performanceSummary:
 *                       type: string
 *                       description: Performance summary based on revenue trends
 *                       example: "Strong and steady growth across all key metrics, reflecting solid overall progress and positive momentum."
 *                     revenuePerCharger:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Average revenue per charger
 *                           example: 1834.00
 *                         description:
 *                           type: string
 *                           example: "Average per unit"
 *                     revenuePerSite:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Average revenue per site/location
 *                           example: 15672.00
 *                         description:
 *                           type: string
 *                           example: "Average per location"
 *                     revenuePerCpo:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Revenue per Charge Point Operator
 *                           example: 8934.00
 *                         description:
 *                           type: string
 *                           example: "Charge Point Operator"
 *                     revenuePerSession:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Average revenue per session
 *                           example: 23.45
 *                         description:
 *                           type: string
 *                           example: "Average session value"
 *                     revenuePerKwh:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Revenue per kilowatt hour
 *                           example: 0.35
 *                         description:
 *                           type: string
 *                           example: "Per kilowatt hour"
 *                     avgSessionDuration:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           format: float
 *                           description: Average session duration in minutes
 *                           example: 42.8
 *                         description:
 *                           type: string
 *                           example: "Revenue driver metric"
 *                 revenuePayoutDistribution:
 *                   type: object
 *                   properties:
 *                     cpo:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: CPO percentage of total payout
 *                           example: 82.7
 *                         amount:
 *                           type: number
 *                           format: float
 *                           description: CPO amount
 *                           example: 56055.55
 *                         growth:
 *                           type: string
 *                           description: Growth percentage
 *                           example: "+12.5%"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether growth is positive
 *                           example: true
 *                     siteHost:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Site Host percentage of total payout
 *                           example: 14.3
 *                         amount:
 *                           type: number
 *                           format: float
 *                           description: Site Host amount
 *                           example: 25598.76
 *                         growth:
 *                           type: string
 *                           description: Growth percentage
 *                           example: "+8.2%"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether growth is positive
 *                           example: true
 *                     investor:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Investor percentage of total payout
 *                           example: 4.3
 *                         amount:
 *                           type: number
 *                           format: float
 *                           description: Investor amount
 *                           example: 18055.55
 *                         growth:
 *                           type: string
 *                           description: Growth percentage
 *                           example: "+5.1%"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether growth is positive
 *                           example: true
 *                 filters:
 *                   type: object
 *                   description: Applied filter criteria
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-01"
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-31"
 *                     country:
 *                       type: string
 *                       example: "US"
 *                     evseStationId:
 *                       type: string
 *                       example: "station-123"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/performance/revenue-payout-distribution:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Get revenue payout distribution
 *     description: Retrieve revenue payout distribution for CPO, Site Host, and Investor with percentages and growth rates
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [Weekly, Monthly]
 *         description: Period for filtering data
 *         example: "Weekly"
 *     responses:
 *       200:
 *         description: Revenue payout distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   description: Selected period filter
 *                   example: "Weekly"
 *                 revenuePayoutDistribution:
 *                   type: object
 *                   properties:
 *                     cpo:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           format: float
 *                           description: CPO amount
 *                           example: 56055.55
 *                         splitPercentage:
 *                           type: number
 *                           format: float
 *                           description: CPO split percentage
 *                           example: 82.7
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: CPO percentage of total payout
 *                           example: 82.7
 *                         growth:
 *                           type: string
 *                           description: Growth percentage
 *                           example: "+12.5%"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether growth is positive
 *                           example: true
 *                     siteHost:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           format: float
 *                           description: Site Host amount
 *                           example: 25598.76
 *                         splitPercentage:
 *                           type: number
 *                           format: float
 *                           description: Site Host split percentage
 *                           example: 14.3
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Site Host percentage of total payout
 *                           example: 14.3
 *                         growth:
 *                           type: string
 *                           description: Growth percentage
 *                           example: "+8.2%"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether growth is positive
 *                           example: true
 *                     investor:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: number
 *                           format: float
 *                           description: Investor amount
 *                           example: 18055.55
 *                         splitPercentage:
 *                           type: number
 *                           format: float
 *                           description: Average investor split percentage
 *                           example: 4.3
 *                         percentage:
 *                           type: number
 *                           format: float
 *                           description: Investor percentage of total payout
 *                           example: 4.3
 *                         growth:
 *                           type: string
 *                           description: Growth percentage
 *                           example: "+5.1%"
 *                         isPositive:
 *                           type: boolean
 *                           description: Whether growth is positive
 *                           example: true
 *                 totalPayoutAmount:
 *                   type: number
 *                   format: float
 *                   description: Total payout amount
 *                   example: 99709.86
 *                 dateRange:
 *                   type: object
 *                   description: Date ranges used for calculation
 *                   properties:
 *                     current:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-01 00:00:00"
 *                         end:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-07 23:59:59"
 *                     previous:
 *                       type: object
 *                       properties:
 *                         start:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-25 00:00:00"
 *                         end:
 *                           type: string
 *                           format: date-time
 *                           example: "2023-12-31 23:59:59"
 *       400:
 *         description: Bad request - Invalid period parameter
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/performance/charger-feedback-analytics:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Charger Feedback Analytics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charger Feedback Analytics Response
 * 
 * /api/performance/partner-analytics:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Get partner analytics overview
 *     description: Retrieve comprehensive partner analytics including overview metrics, top partners, and analytics by partner type
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Partner analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalPartners:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 1718
 *                         comparison:
 *                           type: string
 *                           example: "+92 this month"
 *                         isPositive:
 *                           type: boolean
 *                           example: true
 *                     newPartnersOnboarded:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 93
 *                         comparison:
 *                           type: string
 *                           example: "+12% this month"
 *                         isPositive:
 *                           type: boolean
 *                           example: true
 *                     activeVsInactivePartners:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: string
 *                           example: "893/272"
 *                         comparison:
 *                           type: string
 *                           example: "+5.2% this month"
 *                         isPositive:
 *                           type: boolean
 *                           example: true
 *                 topPartnersByUtilization:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       site:
 *                         type: string
 *                         example: "Canada"
 *                       tag:
 *                         type: string
 *                         example: "CPO"
 *                       revenue:
 *                         type: string
 *                         example: "$487,500"
 *                       utilization:
 *                         type: number
 *                         example: 87.5
 *                 topPartnersByRevenue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       site:
 *                         type: string
 *                         example: "Canada"
 *                       tag:
 *                         type: string
 *                         example: "CPO"
 *                       revenue:
 *                         type: string
 *                         example: "$717,928"
 *                       utilization:
 *                         type: number
 *                         example: 87.5
 *                 lowPartnersByUtilization:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       site:
 *                         type: string
 *                         example: "Canada"
 *                       tag:
 *                         type: string
 *                         example: "CPO"
 *                       revenue:
 *                         type: string
 *                         example: "$3,947"
 *                       utilization:
 *                         type: number
 *                         example: 45.2
 *                 lowPartnersByRevenue:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       site:
 *                         type: string
 *                         example: "Canada"
 *                       tag:
 *                         type: string
 *                         example: "CPO"
 *                       revenue:
 *                         type: string
 *                         example: "$3,947"
 *                       utilization:
 *                         type: number
 *                         example: 45.2
 *                 partnerSplit:
 *                   type: object
 *                   properties:
 *                     totalPartners:
 *                       type: number
 *                       example: 1084
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "CPO"
 *                           value:
 *                             type: number
 *                             example: 978
 *                           percentage:
 *                             type: number
 *                             example: 82.7
 *                 cpoAnalytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Total CPOs"
 *                       value:
 *                         type: string
 *                         example: "156"
 *                       unit:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       delta:
 *                         type: string
 *                         example: "+8 this month"
 *                       icon:
 *                         type: string
 *                         example: "user"
 *                 siteHostAnalytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Total Site Hosts"
 *                       value:
 *                         type: string
 *                         example: "156"
 *                       unit:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       delta:
 *                         type: string
 *                         example: "+8 this month"
 *                       icon:
 *                         type: string
 *                         example: "user"
 *                 investorAnalytics:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                         example: "Total Investors"
 *                       value:
 *                         type: string
 *                         example: "47"
 *                       unit:
 *                         type: string
 *                         nullable: true
 *                         example: null
 *                       delta:
 *                         type: string
 *                         example: "+3 this month"
 *                       icon:
 *                         type: string
 *                         example: "user"
 *                       isDangerous:
 *                         type: boolean
 *                         example: false
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/performance/partner-analytics-top-cpo:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Get top CPO analytics
 *     description: Retrieve top CPO partners by utilization and revenue for monthly and weekly periods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top CPO analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 top5CpoUtilizationMonthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargersManaged:
 *                         type: string
 *                         example: "2,847"
 *                       sessions:
 *                         type: string
 *                         example: "45,748"
 *                       energy:
 *                         type: string
 *                         example: "1234.5"
 *                       revenue:
 *                         type: string
 *                         example: "$717,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       utilization:
 *                         type: number
 *                         example: 87.5
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+12.5%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "CPO"
 *                 top5CpoUtilizationWeekly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargersManaged:
 *                         type: string
 *                         example: "2,847"
 *                       sessions:
 *                         type: string
 *                         example: "8,234"
 *                       energy:
 *                         type: string
 *                         example: "234.5"
 *                       revenue:
 *                         type: string
 *                         example: "$125,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       utilization:
 *                         type: number
 *                         example: 89.5
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+15.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "CPO"
 *                 top5CpoRevenueMonthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargersManaged:
 *                         type: string
 *                         example: "2,847"
 *                       sessions:
 *                         type: string
 *                         example: "45,748"
 *                       energy:
 *                         type: string
 *                         example: "1234.5"
 *                       revenue:
 *                         type: string
 *                         example: "$717,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       utilization:
 *                         type: number
 *                         example: 87.5
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+12.5%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "CPO"
 *                 top5CpoRevenueWeekly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargersManaged:
 *                         type: string
 *                         example: "2,847"
 *                       sessions:
 *                         type: string
 *                         example: "8,234"
 *                       energy:
 *                         type: string
 *                         example: "234.5"
 *                       revenue:
 *                         type: string
 *                         example: "$125,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       utilization:
 *                         type: number
 *                         example: 89.5
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+15.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "CPO"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/performance/partner-analytics-top-sitehost:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Get top Site Host analytics
 *     description: Retrieve top Site Host partners by utilization and revenue for monthly and weekly periods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top Site Host analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 top5SitehostUtilizationMonthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       siteHostName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargingStations:
 *                         type: string
 *                         example: "234"
 *                       chargers:
 *                         type: string
 *                         example: "1456"
 *                       utilization:
 *                         type: number
 *                         example: 96
 *                       revenueShare:
 *                         type: string
 *                         example: "$717,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+14.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Sitehost"
 *                 top5SitehostUtilizationWeekly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       siteHostName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargingStations:
 *                         type: string
 *                         example: "234"
 *                       chargers:
 *                         type: string
 *                         example: "1456"
 *                       utilization:
 *                         type: number
 *                         example: 97
 *                       revenueShare:
 *                         type: string
 *                         example: "$125,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+16.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Sitehost"
 *                 top5SitehostRevenueMonthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       siteHostName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargingStations:
 *                         type: string
 *                         example: "234"
 *                       chargers:
 *                         type: string
 *                         example: "1456"
 *                       utilization:
 *                         type: number
 *                         example: 96
 *                       revenueShare:
 *                         type: string
 *                         example: "$717,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+14.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Sitehost"
 *                 top5SitehostRevenueWeekly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       siteHostName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       chargingStations:
 *                         type: string
 *                         example: "234"
 *                       chargers:
 *                         type: string
 *                         example: "1456"
 *                       utilization:
 *                         type: number
 *                         example: 97
 *                       revenueShare:
 *                         type: string
 *                         example: "$125,928"
 *                       uptime:
 *                         type: number
 *                         example: 98.2
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       revenueGrowth:
 *                         type: string
 *                         example: "+16.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Sitehost"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/performance/partner-analytics-top-investor:
 *   get:
 *     tags:
 *       - Performance Analytics
 *     summary: Get top Investor analytics
 *     description: Retrieve top Investor partners by utilization and revenue for monthly and weekly periods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Top Investor analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 top5InvestorUtilizationMonthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       investment:
 *                         type: string
 *                         example: "$15.5M"
 *                       revenueShare:
 *                         type: string
 *                         example: "$2.34M"
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       roi:
 *                         type: string
 *                         example: "15.1%"
 *                       investmentGrowth:
 *                         type: string
 *                         example: "+8.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Investor"
 *                 top5InvestorUtilizationWeekly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       investment:
 *                         type: string
 *                         example: "$15.5M"
 *                       revenueShare:
 *                         type: string
 *                         example: "$450K"
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       roi:
 *                         type: string
 *                         example: "15.1%"
 *                       investmentGrowth:
 *                         type: string
 *                         example: "+10.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Investor"
 *                 top5InvestorRevenueMonthly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       investment:
 *                         type: string
 *                         example: "$15.5M"
 *                       revenueShare:
 *                         type: string
 *                         example: "$2.34M"
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       roi:
 *                         type: string
 *                         example: "15.1%"
 *                       investmentGrowth:
 *                         type: string
 *                         example: "+8.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Investor"
 *                 top5InvestorRevenueWeekly:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: number
 *                         example: 1
 *                       cpoName:
 *                         type: string
 *                         example: "EcoCharge Networks"
 *                       investment:
 *                         type: string
 *                         example: "$15.5M"
 *                       revenueShare:
 *                         type: string
 *                         example: "$450K"
 *                       settlementStatus:
 *                         type: string
 *                         example: "Completed"
 *                       roi:
 *                         type: string
 *                         example: "15.1%"
 *                       investmentGrowth:
 *                         type: string
 *                         example: "+10.2%"
 *                       location:
 *                         type: string
 *                         example: "Canada"
 *                       partnerType:
 *                         type: string
 *                         example: "Investor"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 * 
 *
 */
