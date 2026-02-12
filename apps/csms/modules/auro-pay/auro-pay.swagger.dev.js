/**
 *
 * @swagger
 * tags:
 *   name: Auro Pay
 *   description: Auro Pay APIs
 *
 * /api/auro-pay/get-transaction:
 *   post:
 *     tags:
 *       - Auro Pay
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                transactionId:
 *                  type: string
 *                  example: "733a93c4-2688-45e0-862a-727f07d3f3ec"
 *     responses:
 *       200:
 *         description: get-transaction
 *
 * /api/auro-pay/refund:
 *   post:
 *     tags:
 *       - Auro Pay
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                transactionId:
 *                  type: string
 *                  example: "733a93c4-2688-45e0-862a-727f07d3f3ec"
 *                amount:
 *                  type: string
 *                  example: "5"
 *                remarks:
 *                  type: string
 *                  example: "Charging Completed"
 *     responses:
 *       200:
 *         description: refund
 *
 */
