/**
 *
 * @swagger
 * tags:
 *   name: Customer Chargers
 *   description: Customer Chargers APIs
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
 * /app/charger/discovery:
 *   get:
 *     tags:
 *       - Customer Chargers
 *     summary: Get Charger List
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *           example: 13.01506022
 *         description: Latitude of the location
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *           example: 77.57439404
 *         description: Longitude of the location
 *       - in: query
 *         name: distance
 *         required: false
 *         schema:
 *           type: number
 *         description: Search radius in kilometers
 *       - in: query
 *         name: viewType
 *         required: false
 *         schema:
 *           type: string
 *           enum: [list, map]
 *           default: map
 *         description: View type for displaying results
 *       - in: query
 *         name: showOnlyAvailable
 *         required: false
 *         schema:
 *           type: boolean
 *         description: If true, only chargers that are currently available will be shown
 *       - in: query
 *         name: connectorTypes
 *         required: false
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *           example: [Type1, Type2, CC2]
 *         style: form
 *         explode: true
 *         description: List of connector types to filter (e.g., Type1, Type2, CC2)
 *     responses:
 *       200:
 *         description: Get Charger List
 *
 * /app/charger/{chargeBoxId}/get-details:
 *   get:
 *     tags:
 *       - Customer Chargers
 *     summary: get-details
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: get-details response
 *
 * /app/charger/{chargeBoxId}/remote-start-transaction:
 *   post:
 *     tags:
 *       - Customer Chargers
 *     summary: remote-start-transaction
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: remote-start-transaction response
 *
 * /app/charger/{chargeBoxId}/remote-stop-transaction:
 *   post:
 *     tags:
 *       - Customer Chargers
 *     summary: remote-stop-transaction
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: remote-stop-transaction response
 *
 * /app/charger/{chargeBoxId}/reserve-now:
 *   post:
 *     tags:
 *       - Customer Chargers
 *     summary: reserve-now
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: reserve-now response
 *
 * /app/charger/{evseStationId}/reserve-by-station:
 *   post:
 *     tags:
 *       - Customer Chargers
 *     summary: reserve-by-station
 *     parameters:
 *       - in: path
 *         name: evseStationId
 *         description: EVSE Station ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: reserve-by-station response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                       example: "123456"
 *                     bookingTime:
 *                       type: string
 *                       example: "2023-10-25T12:00:00.000Z"
 *                     connectorId:
 *                       type: integer
 *                       example: 1
 *                     chargeBoxId:
 *                       type: string
 *                       example: "ChargeBox1"
 *                     evseStationId:
 *                       type: string
 *                       example: "Station1"
 *                 status:
 *                   type: string
 *                   example: "Accepted"
 *
 * /app/charger/{chargeBoxId}/cancel-reservation:
 *   post:
 *     tags:
 *       - Customer Chargers
 *     summary: Cancel Reservation
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBox ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         success: true
 *         message: Reservation cancelled successfully.
 *
 * /app/charger/{chargeBoxId}/charger-experience-feedback:
 *   post:
 *     tags:
 *       - Customer Chargers
 *     summary: charger-experience-feedback
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBox ID
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               connectorId:
 *                 type: integer
 *               rating:
 *                 type: number
 *               review:
 *                 type: string
 *               feedbackMessages:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: charger-experience-feedback response
 *
 * /app/charger/{chargeBoxId}/get-payable-amount:
 *   get:
 *     tags:
 *       - Customer Chargers
 *     summary: get-payable-amount
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: enteredValue
 *         required: true
 *         schema:
 *           type: string
 *         description: Amount to pay
 *     responses:
 *       200:
 *         description: get-payable-amount response
 *
 * /app/charger/{chargeBoxId}/payment-status-update/{token}:
 *   get:
 *     tags:
 *       - Customer Chargers
 *     summary: payment-status-update
 *     security: []
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         description: Token (base64 data that contains customer info)
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: payment-status-update response
 *
 */
