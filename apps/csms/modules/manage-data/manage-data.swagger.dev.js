/**
 *
 * @swagger
 * tags:
 *   name: Manage Data
 *   description: Manage Data APIs
 *
 * /api/manage-data/delete-cancelled-transactions:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: delete-cancelled-transactions
 *
 * /api/manage-data/hard-delete-contracts:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: hard-delete-contracts
 * 
 * /api/manage-data/sync-settlement:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: sync-settlement
 * 
 * /api/manage-data/sync-country-iso-3:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: sync-country-iso-3
 * 
 * /api/manage-data/update-meter-values:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: Meter Values Updated Successfully
 *
 * /api/manage-data/date-test:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: date-test
 *
 * /api/manage-data/check-storage:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: check-storage
 *
 * /api/manage-data/check-email:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: check-email
 *
 * /api/manage-data/seed-app-language:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: seed-app-language
 *
 * /api/manage-data/get-ip-details:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: get-ip-details
 *
 * /api/manage-data/sync-emsp-rates-to-station:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: sync-emsp-rates-to-station
 * 
 * /api/manage-data/sync-revenue:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: sync-revenue
 * 
 * /api/manage-data/sync-ocpp-logs:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: sync-ocpp-logs
 *
 * /api/manage-data/sync-transaction-contract:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     responses:
 *       200:
 *         description: sync-transaction-contract
 * 
 * /api/manage-data/test-pusher-msg:
 *   post:
 *     tags:
 *       - Manage Data
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                channelName:
 *                  type: string
 *                  example: pusher-node-app
 *                eventName:
 *                  type: string
 *                  example: testEvent
 *                data:
 *                  type: object
 *                  properties:
 *                    message:
 *                      type: string
 *                      example: TEST MESSAGE
 *     responses:
 *       200:
 *         description: test-pusher-msg
 * 
 * /api/manage-data/run-analytics:
 *   post:
 *     tags:
 *       - Manage Data
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                date:
 *                  type: string
 *                  example: "2025-07-01"
 *     responses:
 *       200:
 *         description: test-pusher-msg
 * 
 * /api/manage-data/delete-charger/{chargerId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: delete-charger
 * 
 * /api/manage-data/delete-cpo/{cpoId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: cpoId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: delete-cpo
 * 
 * /api/manage-data/delete-evse-station/{evseStationId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: evseStationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: delete-evse-station
 * 
 * /api/manage-data/re-generate-invoice/{transactionId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: re-generate-invoice
 * 
 * /api/manage-data/re-calculate-and-generate-invoice/{transactionId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: re-calculate-and-generate-invoice
 * 
 * /api/manage-data/view-transaction-log/{transactionId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         example: b1400e9d-5d56-4357-948a-61d2c80a766e
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: view-transaction-log
 * 
 * /api/manage-data/get-transaction-invoice/{transactionId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: get-transaction-invoice
 * 
 * /api/manage-data/re-call-payment-api/{transactionId}:
 *   get:
 *     tags:
 *       - Manage Data
 *     security: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: re-call-payment-api
 * 
 * /api/manage-data/onboard-charger:
 *   post:
 *     tags:
 *       - Manage Data
 *     security: []
 *     requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                secretCode:
 *                  type: string
 *                  example: Dharmesh & Abhijeet Knows 
 *                country:
 *                  type: string
 *                  example: CA
 *                custChargeBoxId:
 *                  type: string
 *                  example: optional. if provided, New Charger will be created with this chargeBoxId, otherwise it will be auto generated
 *                paymentDetails:
 *                  type: object
 *                  properties:
 *                    paymentGatewayURL:
 *                      type: string
 *                      example: https://csms.chargnex.com/payment
 *                    preauthAmountMultiplier:
 *                      type: string
 *                      example: 4
 *                    paymentMfg:
 *                      type: string
 *                      example: ID Tech
 *                    paymentMfgId:
 *                      type: string
 *                      example: S/N from back side of idtech
 *                    paymentProvider:
 *                      type: string
 *                      example: moneris
 *                    paymentDeviceId:
 *                      type: string
 *                      example: N0000013
 *                    deviceType:
 *                      type: string
 *                      example: idtech_bdk_ctls
 *                    posCode:
 *                      type: string
 *                      example: 27
 *                partnerId:
 *                  type: string
 *                  example: optional. if not provided, create/update partner from following partnerDetails
 *                partnerDetails:
 *                  type: object
 *                  properties:
 *                    name:
 *                      type: string
 *                      example: Someone
 *                    email:
 *                      type: string
 *                      example: some@one.com
 *                evseStationId:
 *                  type: string
 *                  example: optional. if not provided, create new station from following evseStationDetails
 *                evseStationDetails:
 *                  type: object
 *                  properties:
 *                    name:
 *                      type: string
 *                      example: EV Factory
 *                    address:
 *                      type: string
 *                      example: Some Where
 *                    city:
 *                      type: string
 *                      example: Navi Mumbai
 *                    state:
 *                      type: string
 *                      example: Maharashtra
 *                    country:
 *                      type: string
 *                      example: IN
 *                    areaCode:
 *                      type: string
 *                      example: 123456
 *                    lat:
 *                      type: string
 *                      example: 12.3456
 *                    lng:
 *                      type: string
 *                      example: 12.3456
 *                    baseRate:
 *                      type: string
 *                      example: 0.12 Optional
 *                    electricityGridRate:
 *                      type: string
 *                      example: 0.12 Optional
 *                    taxRate:
 *                      type: string
 *                      example: 0.12 Optional
 *                    preAuthAmount:
 *                      type: string
 *                      example: 12 Optional
 *     responses:
 *       200:
 *         description: test-pusher-msg
 *
 */
