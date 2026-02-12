/**
 *
 * @swagger
 * tags:
 *   name: Webhook Listeners
 *   description: Webhook Listener APIs
 *
 * /api/webhook-listener/paynex:
 *   post:
 *     tags:
 *       - Webhook Listeners
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                any_data:
 *                  type: string
 *                  example: any_data
 *     responses:
 *       200:
 *         description: paynex webhooks
 * 
 *
 * /api/webhook-listener/auropay:
 *   post:
 *     tags:
 *       - Webhook Listeners
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                any_data:
 *                  type: string
 *                  example: any_data
 *     responses:
 *       200:
 *         description: auropay webhooks
 *
 * /api/webhook-listener/auropay/{eventName}:
 *   post:
 *     tags:
 *       - Webhook Listeners
 *     security: []
 *     parameters:
 *       - in: path
 *         name: eventName
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                any_data:
 *                  type: string
 *                  example: any_data
 *     responses:
 *       200:
 *         description: auropay webhooks
 * 
 */
