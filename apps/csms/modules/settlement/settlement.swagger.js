/**
 * @swagger
 * components:
 *   schemas:
 *     SettlementRequest:
 *       type: object
 *       properties:
 *         settlementId:
 *           type: string
 *         settlementPeriod:
 *           type: string
 *           enum: [1 Week, 2 Weeks, 1 Month]
 *         contractId:
 *           type: string
 *           format: uuid
 *         emspId:
 *           type: string
 *           format: uuid
 *         numberOfTransactions:
 *           type: number
 *         settlementAmount:
 *           type: number
 *         paymentGateway:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Pending, Completed, Settled, Rejected]
 *         timezone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdAtLocal:
 *           type: string
 *           format: date-time
 *         updatedAtLocal:
 *           type: string
 *           format: date-time
 *     SettlementPartnerRequest:
 *       type: object
 *       properties:
 *         settlementId:
 *           type: string
 *         partnerId:
 *           type: string
 *           format: uuid
 *         partnerName:
 *           type: string
 *         partnerEmail:
 *           type: string
 *         partnerType:
 *           type: string
 *           enum: [CPO, Site Host, Investor]
 *         splitPercentage:
 *           type: number
 *         amount:
 *           type: number
 *         transferStatus:
 *           type: string
 *           enum: [Pending, Completed, Failed, Processing]
 *         transferredBy:
 *           type: string
 *           format: uuid
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         timezone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdAtLocal:
 *           type: string
 *           format: date-time
 *         updatedAtLocal:
 *           type: string
 *           format: date-time
 *     Settlement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         settlementId:
 *           type: string
 *         settlementPeriod:
 *           type: string
 *           enum: [1 Week, 2 Weeks, 1 Month]
 *         contractId:
 *           type: string
 *           format: uuid
 *         emspId:
 *           type: string
 *           format: uuid
 *         numberOfTransactions:
 *           type: number
 *         settlementAmount:
 *           type: number
 *         paymentGateway:
 *           type: string
 *         status:
 *           type: string
 *           enum: [Pending, Completed, Settled, Rejected]
 *         timezone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdAtLocal:
 *           type: string
 *           format: date-time
 *         updatedAtLocal:
 *           type: string
 *           format: date-time
 *     SettlementPartner:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         settlementId:
 *           type: string
 *           format: uuid
 *         partnerId:
 *           type: string
 *           format: uuid
 *         partnerName:
 *           type: string
 *         partnerEmail:
 *           type: string
 *         partnerType:
 *           type: string
 *           enum: [CPO, Site Host, Investor]
 *         splitPercentage:
 *           type: number
 *         amount:
 *           type: number
 *         transferStatus:
 *           type: string
 *           enum: [Pending, Completed, Failed, Processing]
 *         transferredBy:
 *           type: string
 *           format: uuid
 *         bankName:
 *           type: string
 *         accountNumber:
 *           type: string
 *         timezone:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdAtLocal:
 *           type: string
 *           format: date-time
 *         updatedAtLocal:
 *           type: string
 *           format: date-time
 */


/**
 * @swagger
 * tags:
 *   name: Settlement
 *   description: Settlement management
 */

/**
 * @swagger
 *
 * /api/settlement/generate-settlement:
 *   post:
 *     summary: Generate a new settlement for contract
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                contractId:
 *                  type: string
 *                  example: "add9d0db-f184-45fa-b97d-da9069adbe84" 
 *     responses:
 *       201:
 *         description: Settlement Generate successfully
 * 
 * /api/settlement:
 *   post:
 *     summary: Add a new settlement
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettlementRequest'
 *     responses:
 *       201:
 *         description: Settlement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settlement'
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 * /api/settlement/{settlementId}/partner:
 *   post:
 *     summary: Add a new settlement partner
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettlementPartnerRequest'
 *     responses:
 *       201:
 *         description: Settlement partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SettlementPartner'
 *       400:
 *         description: Bad request (missing required fields)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 */



/**
 * @swagger
 *
 * /api/settlement:
 *   get:
 *     summary: Get all settlements
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Settlement'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 *
 * /api/settlement/{settlementId}:
 *   get:
 *     summary: Get settlement by ID
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: settlementId
 *         in: path
 *         description: Settlement ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settlement'
 * 
 */

/**
 * @swagger
 *
 * /api/settlement/{settlementId}/sessions:
 *   get:
 *     summary: Get sessions by settlement ID
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: settlementId
 *         in: path
 *         description: Settlement ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Session'
 * 
 */

/**
 * @swagger
 *
 * /api/settlement/{settlementId}/sessions:
 *   get:
 *     summary: Get session by settlement ID and session ID
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: settlementId
 *         in: path
 *         description: Settlement ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 * 
 */

/**
 * @swagger
 *
 * /api/settlement/{settlementId}/sessions-overview:
 *   get:
 *     summary: Get session overview by settlement ID and session ID
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: settlementId
 *         in: path
 *         description: Settlement ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SessionOverview'
 * 
 */

/**
 * @swagger
 *
 * /api/settlement/{settlementId}/reject:
 *   post:
 *     summary: Reject settlement by ID
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: settlementId
 *         in: path
 *         description: Settlement ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settlement'
 * 
 */

/**
 * @swagger
 *
 * /api/settlement/{settlementId}/update-partner-transfer-status/{partnerId}:
 *   post:
 *     summary: Update partner transfer status by settlement ID and partner ID
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: settlementId
 *         in: path
 *         description: Settlement ID
 *         required: true
 *         schema:
 *           type: string
 *       - name: partnerId
 *         in: path
 *         description: Partner ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settlement'
 *      
 */

/**
 * @swagger
 * /api/settlement/overview:
 *   get:
 *     summary: Get settlement overview statistics
 *     description: Retrieves high-level settlement statistics including total amount deposited to Chargnex, gateway deductions, settlement count, and total amount settled.
 *     tags: [Settlement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Settlement overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalAmountDepositedToChagnex:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       format: float
 *                       description: Total amount deposited to Chargnex from charger_revenue model
 *                       example: 125000.75
 *                     comparison:
 *                       type: string
 *                       description: Month-over-month comparison text
 *                       example: "+$0.3M this month"
 *                     comparisonValue:
 *                       type: number
 *                       format: float
 *                       description: Raw comparison value (positive or negative)
 *                       example: 300000
 *                     isPositive:
 *                       type: boolean
 *                       description: Whether the comparison is positive (true) or negative (false)
 *                       example: true
 *                 totalGatewayDeduction:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       format: float
 *                       description: Total gateway deductions (currently 0)
 *                       example: 0
 *                     comparison:
 *                       type: string
 *                       description: Month-over-month comparison text
 *                       example: "No change"
 *                     comparisonValue:
 *                       type: number
 *                       format: float
 *                       description: Raw comparison value (always 0)
 *                       example: 0
 *                     isPositive:
 *                       type: boolean
 *                       description: Whether the comparison is positive (always true)
 *                       example: true
 *                 settlementCount:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       description: Total number of settlements
 *                       example: 150
 *                     comparison:
 *                       type: string
 *                       description: Month-over-month comparison text
 *                       example: "+120 this month"
 *                     comparisonValue:
 *                       type: number
 *                       description: Raw comparison value (positive or negative)
 *                       example: 120
 *                     isPositive:
 *                       type: boolean
 *                       description: Whether the comparison is positive (true) or negative (false)
 *                       example: true
 *                 totalAmountSettled:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       format: float
 *                       description: Total amount settled across all settlements
 *                       example: 100000.50
 *                     comparison:
 *                       type: string
 *                       description: Month-over-month comparison text
 *                       example: "+$10,000 this month"
 *                     comparisonValue:
 *                       type: number
 *                       format: float
 *                       description: Raw comparison value (positive or negative)
 *                       example: 10000
 *                     isPositive:
 *                       type: boolean
 *                       description: Whether the comparison is positive (true) or negative (false)
 *                       example: true
 *                 filters:
 *                   type: object
 *                   description: Applied filter criteria
 *                   example: {"country":"US","startDate":"2024-01-01","endDate":"2024-01-31"}
 *               example:
 *                 totalAmountDepositedToChagnex:
 *                   value: 125000.75
 *                   comparison: "+$0.3M this month"
 *                   comparisonValue: 300000
 *                   isPositive: true
 *                 totalGatewayDeduction:
 *                   value: 0
 *                   comparison: "No change"
 *                   comparisonValue: 0
 *                   isPositive: true
 *                 settlementCount:
 *                   value: 150
 *                   comparison: "+120 this month"
 *                   comparisonValue: 120
 *                   isPositive: true
 *                 totalAmountSettled:
 *                   value: 100000.50
 *                   comparison: "+$10,000 this month"
 *                   comparisonValue: 10000
 *                   isPositive: true
 *                 filters: {"country":"US","startDate":"2024-01-01","endDate":"2024-01-31"}
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
 *                   example: "Failed to get settlement overview"
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */