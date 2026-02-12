/**
 *
 * @swagger
 * tags:
 *   name: Remote OCPP
 *   description: Remote OCPP APIs
 *
 * /api/remote-ocpp/{chargeBoxId}/remote-start-transaction:
 *   post:
 *     tags:
 *       - Remote OCPP
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
 * /api/remote-ocpp/{chargeBoxId}/remote-stop-transaction:
 *   post:
 *     tags:
 *       - Remote OCPP
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
 * /api/remote-ocpp/{chargeBoxId}/reset-hard:
 *   post:
 *     tags:
 *       - Remote OCPP
 *     summary: reset-hard
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: reset-hard response
 *
 * /api/remote-ocpp/{chargeBoxId}/change-availability:
 *   post:
 *     tags:
 *       - Remote OCPP
 *     summary: change-availability
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         description: ChargeBoxID
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
 *               connectorId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [Operative, Inoperative]
 *           example:
 *             connectorId: 1
 *             type: "Operative"
 *     responses:
 *       200:
 *         description: change-availability response
 *
 *
 */
