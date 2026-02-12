/**
 *
 * @swagger
 * tags:
 *   name: Charger ET Testing
 *   description: Charger ET Testing APIs
 *
 * /api/charger-et-testing/set:
 *   post:
 *     tags:
 *       - Charger ET Testing
 *     security: []
 *     summary: Set ET Testing Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chargeBoxId:
 *                 type: string
 *                 example: "CGXINPRM2025B46DB8"
 *               testCaseId:
 *                 type: string
 *                 example: "MCD 04 Test 01 Scenario 01 A"
 *               preAuthAmount:
 *                 type: string
 *                 example: "15"
 *               purchaseAmount:
 *                 type: string
 *                 example: "10"
 *               purchaseOnly:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Set ET Testing Data
 *
 * /api/charger-et-testing/reset:
 *   post:
 *     tags:
 *       - Charger ET Testing
 *     security: []
 *     summary: Reset ET Testing Data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chargeBoxId:
 *                 type: string
 *                 example: "CGXINPRM2025B46DB8"
 *     responses:
 *       200:
 *         description: Reset ET Testing Data
 *
 *
 */
