/**
 *
 * @swagger
 * tags:
 *   name: Hub Chargers
 *   description: Hub Chargers APIs
 *
 * /hub/charger:
 *   get:
 *     tags:
 *       - Hub Chargers
 *     security: []
 *     summary: Get Charger List
 *     responses:
 *       200:
 *         description: Get Charger List
 *
 * /hub/charger/{chargerId}:
 *   get:
 *     tags:
 *       - Hub Chargers
 *     security: []
 *     summary: get-details
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         description: ChargeBoxID | Serial Number | Charger ID
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: get-details response
 *
 * /hub/charger/register:
 *   post:
 *     tags:
 *       - Hub Chargers
 *     security: []
 *     summary: Register Charger
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *                serialNumber:
 *                  type: string
 *                  example: "ABC0012345"
 *                country:
 *                  type: string
 *                  example: "IN"
 *                meteringConfig:
 *                  type: object
 *                  properties:
 *                    underVoltageLimitPerPhase:
 *                      type: string
 *                      example: "190"
 *                    overVoltageLimitPerPhase:
 *                      type: string
 *                      example: "270"
 *                    underCurrentLimitPerPhase:
 *                      type: string
 *                      example: "0.5"
 *                    overCurrentLimitPerPhase:
 *                      type: string
 *                      example: "32"
 *                    maxCurrentLimitPerPhase:
 *                      type: string
 *                      example: "30"
 *                    wiringType:
 *                      type: string
 *                      example: "3Phase"
 *                    chargerCapacity:
 *                      type: string
 *                      example: "19.2"
 *                    typicalVoltage:
 *                      type: string
 *                      example: "240"
 *     responses:
 *       200:
 *         description: register charger response
 *
 */
