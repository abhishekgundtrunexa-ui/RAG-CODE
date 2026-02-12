/**
 *
 * @swagger
 * tags:
 *   name: Customer Transactions
 *   description: Customer Transactions APIs
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * security:
 *   - bearerAuth: []
 *
 * /app/transaction:
 *   get:
 *     tags:
 *       - Customer Transactions
 *     summary: Get Transactions List
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: Get Transactions List
 * 
 * /app/transaction/current:
 *   get:
 *     tags:
 *       - Customer Transactions
 *     summary: Get Current Transaction
 *     responses:
 *       200:
 *         description: Get Current Transaction
 * 
 * /app/transaction/{transaction_id}:
 *   get:
 *     tags:
 *       - Customer Transactions
 *     summary: Get Transaction By ID
 *     parameters:
 *       - in: path
 *         name: transaction_id
 *         description: Transaction ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Transaction By ID
 */
