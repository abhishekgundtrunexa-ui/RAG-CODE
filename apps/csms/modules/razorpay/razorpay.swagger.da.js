/**
 *
 * @swagger
 * tags:
 *   name: Razorpay
 *   description: Razorpay APIs
 * 
 * /api/razorpay/generate-qr:
 *   post:
 *     tags:
 *       - Razorpay
 *     summary: Generate QR-Code
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "My Name"
 *               payment_amount:
 *                 type: integer
 *                 example: 10
 *               notes:
 *                 type: object
 *                 properties:
 *                   any_key:
 *                    type: string
 *                    example: any_value
 *     responses:
 *       200:
 *         description: QR-Code Generated
 *
 */
