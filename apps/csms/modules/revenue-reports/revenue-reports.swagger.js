/**
 * @swagger
 * components:
 *   schemas:
 *     RevenueReportsResponse:
 *       type: object
 *       properties:
 *         totalGrossRevenue:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               format: float
 *               description: Total gross revenue from charger_revenue model
 *               example: 125680.75
 *             comparison:
 *               type: string
 *               description: Month-over-month comparison text
 *               example: "+$0.3M this month"
 *             comparisonValue:
 *               type: number
 *               format: float
 *               description: Raw comparison value (positive or negative)
 *               example: 300000
 *             isPositive:
 *               type: boolean
 *               description: Whether the comparison is positive (true) or negative (false)
 *               example: true
 *         grossRevenueGrowthRate:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               format: float
 *               description: Gross revenue growth rate percentage
 *               example: 12.5
 *             comparison:
 *               type: string
 *               description: Month-over-month comparison text
 *               example: "+2.5% this month"
 *             comparisonValue:
 *               type: number
 *               format: float
 *               description: Raw comparison value (positive or negative)
 *               example: 2.5
 *             isPositive:
 *               type: boolean
 *               description: Whether the comparison is positive (true) or negative (false)
 *               example: true
 *         avgRevenuePerChargerPerDay:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               format: float
 *               description: Average revenue per charger per day
 *               example: 9680.50
 *             comparison:
 *               type: string
 *               description: Month-over-month comparison text
 *               example: "+$500 this month"
 *             comparisonValue:
 *               type: number
 *               format: float
 *               description: Raw comparison value (positive or negative)
 *               example: 500
 *             isPositive:
 *               type: boolean
 *               description: Whether the comparison is positive (true) or negative (false)
 *               example: true
 *         avgRevenuePerChargerPerSession:
 *           type: object
 *           properties:
 *             value:
 *               type: number
 *               format: float
 *               description: Average revenue per charger per session
 *               example: 1680.25
 *             comparison:
 *               type: string
 *               description: Month-over-month comparison text
 *               example: "+$50 this month"
 *             comparisonValue:
 *               type: number
 *               format: float
 *               description: Raw comparison value (positive or negative)
 *               example: 50
 *             isPositive:
 *               type: boolean
 *               description: Whether the comparison is positive (true) or negative (false)
 *               example: true
 *         grossRevenueSplit:
 *           type: object
 *           properties:
 *             cpo:
 *               type: number
 *               format: float
 *               description: CPO revenue amount
 *               example: 62750.00
 *             siteHost:
 *               type: number
 *               format: float
 *               description: Site Host revenue amount
 *               example: 17730.00
 *             investor:
 *               type: number
 *               format: float
 *               description: Investor revenue amount
 *               example: 6730.00
 *             total:
 *               type: number
 *               format: float
 *               description: Total revenue amount
 *               example: 132410.00
 *         monthlyTrend:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 description: Month abbreviation
 *                 example: "Jan"
 *               year:
 *                 type: number
 *                 description: Year
 *                 example: 2024
 *               cpo:
 *                 type: number
 *                 format: float
 *                 description: CPO revenue for the month
 *                 example: 62000.00
 *               siteHost:
 *                 type: number
 *                 format: float
 *                 description: Site Host revenue for the month
 *                 example: 17500.00
 *               investor:
 *                 type: number
 *                 format: float
 *                 description: Investor revenue for the month
 *                 example: 6500.00
 *               total:
 *                 type: number
 *                 format: float
 *                 description: Total revenue for the month
 *                 example: 131000.00
 *         filters:
 *           type: object
 *           description: Applied filter criteria
 *           example: {"country":"US","startDate":"2024-01-01","endDate":"2024-01-31","partnerType":"SITE HOST"}
 *       example:
 *         totalGrossRevenue:
 *           value: 125680.75
 *           comparison: "+$0.3M this month"
 *           comparisonValue: 300000
 *           isPositive: true
 *         grossRevenueGrowthRate:
 *           value: 12.5
 *           comparison: "+2.5% this month"
 *           comparisonValue: 2.5
 *           isPositive: true
 *         avgRevenuePerChargerPerDay:
 *           value: 9680.50
 *           comparison: "+$500 this month"
 *           comparisonValue: 500
 *           isPositive: true
 *         avgRevenuePerChargerPerSession:
 *           value: 1680.25
 *           comparison: "+$50 this month"
 *           comparisonValue: 50
 *           isPositive: true
 *         grossRevenueSplit:
 *           cpo: 62750.00
 *           siteHost: 17730.00
 *           investor: 6730.00
 *           total: 132410.00
 *         monthlyTrend:
 *           - month: "Jan"
 *             year: 2024
 *             cpo: 62000.00
 *             siteHost: 17500.00
 *             investor: 6500.00
 *             total: 131000.00
 *           - month: "Feb"
 *             year: 2024
 *             cpo: 63000.00
 *             siteHost: 18000.00
 *             investor: 6800.00
 *             total: 133800.00
 *         filters: {"country":"US","startDate":"2024-01-01","endDate":"2024-01-31","partnerType":"SITE HOST"}
 */

/**
 * @swagger
 * /api/revenue-reports:
 *   get:
 *     summary: Get revenue reports dashboard data
 *     description: Retrieve comprehensive revenue reports including total gross revenue, growth rate, average revenue metrics, revenue split, and monthly trends
 *     tags: [Revenue Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: Start date in YYYY-MM-DD format
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *           pattern: '^\d{4}-\d{2}-\d{2}$'
 *         description: End date in YYYY-MM-DD format
 *         example: "2024-01-31"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code for filtering
 *         example: "US"
 *       - in: query
 *         name: evseStationId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EVSE Station ID for filtering
 *         example: "89027033-95b4-4ab3-9cb4-5da4a6280fed"
 *       - in: query
 *         name: partnerType
 *         schema:
 *           type: string
 *           enum: [CPO, SITE HOST, INVESTOR]
 *         description: Partner type for filtering. CPO uses cpoAmount, SITE HOST uses siteHostAmount, INVESTOR uses investorAmounts, others use totalAmount
 *         example: "CPO"
 *     responses:
 *       200:
 *         description: Revenue reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueReportsResponse'
 *       400:
 *         description: Bad request - Invalid filter format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid filter format"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to get revenue reports"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 */
