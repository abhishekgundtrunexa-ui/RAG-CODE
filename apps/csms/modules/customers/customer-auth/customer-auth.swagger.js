/**
 *
 * @swagger
 * tags:
 *   name: Customer Auth
 *   description: Customer Auth APIs
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
 * /app/auth/get-login-otp:
 *   post:
 *     tags:
 *       - Customer Auth
 *     security: []
 *     summary: Get Login OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrMobile:
 *                 type: string
 *                 example: 'abc@xyz.com'
 *     responses:
 *       200:
 *         description: Get Login OTP
 *
 * /app/auth/verify-login-otp:
 *   post:
 *     tags:
 *       - Customer Auth
 *     security: []
 *     summary: Verify Login OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailOrMobile:
 *                 type: string
 *                 example: 'abc@xyz.com'
 *               otp:
 *                 type: string
 *                 example: '000000'
 *     responses:
 *       200:
 *         description: Verify Login OTP
 *
 * /app/auth/who-am-i:
 *   get:
 *     tags:
 *       - Customer Auth
 *     summary: Get Logged-in User
 *     responses:
 *       200:
 *         description: Logged-in User
 *
 * /app/auth/logout:
 *   get:
 *     tags:
 *       - Customer Auth
 *     summary: Logout the user
 *     responses:
 *       200:
 *         description: Logout the user
 *
 * /app/auth/update-profile:
 *   post:
 *     tags:
 *       - Customer Auth
 *     summary: Customer Update Profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: 'Doe'
 *               email:
 *                 type: string
 *                 example: 'john@doe.com'
 *               mobile:
 *                 type: string
 *                 example: '9955447788'
 *     responses:
 *       200:
 *         description: Customer Update Profile
 *
 * /app/auth/refresh-token:
 *   post:
 *     tags:
 *       - Customer Auth
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
