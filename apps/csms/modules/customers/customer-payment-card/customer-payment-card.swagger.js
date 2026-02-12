/**
 * @swagger
 * tags:
 *   name: CustomerPaymentCard
 *   description: Customer Payment Card management
 */

/**
 * @swagger
 * /app/payment-card:
 *   post:
 *     summary: Create a new payment card
 *     tags: [CustomerPaymentCard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardNumber
 *               - cardHolderName
 *               - expiryMonth
 *               - expiryYear
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 example: "4111111111111111"
 *               cardHolderName:
 *                 type: string
 *                 example: "John Doe"
 *               expiryMonth:
 *                 type: integer
 *                 example: 12
 *               expiryYear:
 *                 type: integer
 *                 example: 2028
 *               brand:
 *                 type: string
 *                 example: "Visa"
 *               isDefault:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Payment card created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerPaymentCard'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *
 *   get:
 *     summary: Get all payment cards for the customer
 *     tags: [CustomerPaymentCard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment cards
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CustomerPaymentCard'
 *       401:
 *         description: Unauthorized
 *
 * /app/payment-card/{id}/check-token-expiry:
 *   get:
 *     summary: Check a payment card token expiry by ID
 *     tags: [CustomerPaymentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment card ID
 *     responses:
 *       200:
 *         description: Payment card token expiry details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 * 
 * /app/payment-card/{id}:
 *   get:
 *     summary: Get a payment card by ID
 *     tags: [CustomerPaymentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment card ID
 *     responses:
 *       200:
 *         description: Payment card details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerPaymentCard'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *
 *   put:
 *     summary: Update a payment card
 *     tags: [CustomerPaymentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardHolderName:
 *                 type: string
 *                 example: "Jane Doe"
 *               expiryMonth:
 *                 type: integer
 *                 example: 11
 *               expiryYear:
 *                 type: integer
 *                 example: 2029
 *               brand:
 *                 type: string
 *                 example: "Mastercard"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Payment card updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerPaymentCard'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *
 *   delete:
 *     summary: Delete a payment card
 *     tags: [CustomerPaymentCard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Payment card ID
 *     responses:
 *       200:
 *         description: Payment card deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment card deleted.
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Not found
 *
 * components:
 *   schemas:
 *     CustomerPaymentCard:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         customerId:
 *           type: string
 *         cardNumber:
 *           type: string
 *           description: Masked card number
 *         cardHolderName:
 *           type: string
 *         expiryMonth:
 *           type: integer
 *         expiryYear:
 *           type: integer
 *         brand:
 *           type: string
 *         last4:
 *           type: string
 *         isDefault:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         isDeleted:
 *           type: boolean
 */
