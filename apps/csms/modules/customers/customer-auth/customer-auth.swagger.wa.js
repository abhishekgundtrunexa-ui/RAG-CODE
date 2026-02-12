/**
 *
 * @swagger
 * tags:
 *   name: WhatsApp Auth
 *   description: WhatsApp Auth APIs
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
 * /app/auth/get-token-for-wa:
 *   post:
 *     tags:
 *       - WhatsApp Auth
 *     security: []
 *     summary: Get token for WhatsApp
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mobileNumber:
 *                 type: string
 *                 example: '9988776655'
 *     responses:
 *       200:
 *         description: Token for WhatsApp
 *
 * /app/auth/who-am-i:
 *   get:
 *     tags:
 *       - WhatsApp Auth
 *     summary: Get Logged-in User
 *     responses:
 *       200:
 *         description: Logged-in User
 *
 * /app/auth/logout:
 *   get:
 *     tags:
 *       - WhatsApp Auth
 *     summary: Logout the user
 *     responses:
 *       200:
 *         description: Logout the user
 *
 * /app/auth/refresh-token:
 *   post:
 *     tags:
 *       - WhatsApp Auth
 *     security: []
 *     summary: Get Authentication Token by Using Refresh Token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 'dESqoa7LRfiFoi8W4lpJKk:APA91bGps4t-0IG__swMP7ik5gLR-c5BG4RUvaSEQTO6tDoLWRDlIsmg2BRu3lrrY2vcWqCfk0UgPynN09wZP41_A9VBqF3OcGr3WKThcVAqrdZ4DR1cJWI'
 *     responses:
 *       200:
 *         description: Token returned
 *
 *
 */
