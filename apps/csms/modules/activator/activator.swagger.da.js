/**
 *
 * @swagger
 * tags:
 *   name: Charger Serial Number Generator/Activator
 *   description: Charger Serial Number Generator/Activator APIs
 *
 * components:
 *   securitySchemes:
 *     cgxApiKey:
 *       type: apiKey
 *       name: cgx-api-key
 *       in: header
 * 
 * security:
 *   - cgxApiKey: []
 *
 * /api/activator/generate-serial-number:
 *   get:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Generate Serial Number
 *     parameters:
 *       - in: query
 *         name: serial_number
 *         schema:
 *           type: string
 *         description: Serial Number
 *     responses:
 *       200:
 *         description: Generated Serial Number Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 serialNumber:
 *                   type: string
 *                   example: "94834C01482C4F8E"
 *                 chargeBoxId:
 *                   type: string
 *                   example: "CGXINPRM202561BCE5"
 *                 ocppUrl:
 *                   type: string
 *                   example: "wss://ocpp.chargnex.com/"
 *                 fotaUrl:
 *                   type: string
 *                   example: "http://csms.chargnex.com/"
 *                 passCode:
 *                   type: string
 *                   example: "123456"
 *                 authCodes:
 *                   type: string
 *                   example: ["12", "34", "56"]
 *                 authCodeExpireAt:
 *                   type: string
 *                   example: "2025-08-05T23:59:59.999Z"
 *                 currentDateTime:
 *                   type: string
 *                   example: "2025-08-05T00:00:00.000Z"
 *
 * /api/activator/get-charger-auth-codes/{serial_number}:
 *   get:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Get Charger Auth-Codes
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Charger Auth-Codes Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 authCodes:
 *                    type: array
 *                    items:
 *                      type: integer
 *                    example: [11, 22, 33]
 *                 authCodeExpireAt:
 *                   type: string
 *                   example: "2025-08-05T23:59:59.999Z"
 *                 currentDateTime:
 *                   type: string
 *                   example: "2025-08-05T00:00:00.000Z"
 *       400:
 *         description: Invalid Serial-Number Provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Serial-Number"
 *
 * /api/activator/verify-charger-auth-code/{serial_number}:
 *   post:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Verify Charger Auth-Code
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               authCode:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Verify Charger Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 message:
 *                    type: string
 *                    example: "Charger Auth-Code Verified"
 *       400:
 *         description: Verify Charger Failed Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Auth-Code"
 *
 * /api/activator/get-charger-card-pass-code/{serial_number}:
 *   get:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Get Charger Pass Code For Card
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Charger Pass Code For Card Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 cardPassCode:
 *                    type: string
 *                    example: "abf7202f1d0259c8b6046073a3e662a3"
 *       400:
 *         description: Invalid Serial-Number Provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Serial-Number"
 *
 * /api/activator/get-charger-card/{serial_number}:
 *   get:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Get Charger Card
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Charger Card Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 chargerCards:
 *                    type: array
 *                    example: []
 *       400:
 *         description: Invalid Serial-Number Provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Serial-Number"
 * 
 * /api/activator/set-charger-card/{serial_number}:
 *   post:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Set Charger Card
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chargeBoxId:
 *                 type: string
 *                 example: "CGXDEFAULT0001"
 *               cardUid:
 *                 type: string
 *                 example: "AA:BB:CC:DD"
 *               cardLabel:
 *                 type: string
 *                 example: "Card 1"
 *               expiryDate:
 *                 type: string
 *                 example: "2026-12-31"
 *     responses:
 *       200:
 *         description: Set Charger Card Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 message:
 *                    type: string
 *                    example: "Charger Card Assigned"
 *       400:
 *         description: Invalid Serial-Number Provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Serial-Number"
 * 
 * /api/activator/remove-charger-card:
 *   post:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Remove Charger Card
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardUid:
 *                 type: string
 *                 example: "AA:BB:CC:DD"
 *     responses:
 *       200:
 *         description: Remove Charger Card Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 message:
 *                    type: string
 *                    example: "The card has been removed."
 * 
 * /api/activator/send-charger-activation-otp/{serial_number}:
 *   post:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Send Charger Activation OTP
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Send Charger Activation OTP Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 message:
 *                    type: string
 *                    example: "OTP sent successfully"
 *       400:
 *         description: Invalid Serial-Number Provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Serial-Number"
 * 
 * /api/activator/verify-charger-activation-otp/{serial_number}:
 *   post:
 *     tags:
 *       - Charger Serial Number Generator/Activator
 *     security: 
 *       - cgxApiKey: []
 *     summary: Verify Charger Activation OTP
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *                 example: 000000
 *     responses:
 *       200:
 *         description: Verify Charger Activation OTP Response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: true
 *                 message:
 *                    type: string
 *                    example: "OTP verified successfully"
 *       400:
 *         description: Invalid Serial-Number Provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                    type: boolean
 *                    example: false
 *                 message:
 *                    type: string
 *                    example: "Invalid Serial-Number"
 *
 */
