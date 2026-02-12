/**
 *
 * @swagger
 * tags:
 *   name: OCPP Remote APIs
 *
 * /api/ocpp/{client_id}/disconnect-client:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Disconnect client, (For testing purpose)
 *     parameters:
 *       - in: path
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Disconnect client
 * 
 * /api/ocpp/{client_id}/remote-start-transaction:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Remote Start Transaction
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               idTag:
 *                 type: string
 *               connectorId:
 *                 type: integer
 *               chargingProfile:
 *                 type: object
 *           example:
 *             idTag: "ABC12345"
 *             connectorId: 1
 *             chargingProfile:
 *               chargingProfileId: 10
 *               stackLevel: 0
 *               chargingProfilePurpose: "TxProfile"
 *               chargingProfileKind: "Absolute"
 *               chargingSchedule:
 *                 duration: 3600
 *                 startSchedule: "2025-10-01T12:00:00Z"
 *                 chargingRateUnit: "A"
 *                 chargingSchedulePeriod:
 *                   - startPeriod: 0
 *                     limit: 16
 *     responses:
 *       200:
 *         description: Remote Start Transaction Response
 *
 * /api/ocpp/{client_id}/remote-stop-transaction:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Remote Stop Transaction
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               transactionId:
 *                 type: integer
 *           example:
 *             transactionId: 12345
 *     responses:
 *       200:
 *         description: Remote Stop Transaction Response
 *
 * /api/ocpp/{client_id}/change-availability:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Change Availability
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *         description: Change Availability Response
 *
 * /api/ocpp/{client_id}/reset:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Reset Charger
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               type:
 *                 type: string
 *                 enum: [Hard, Soft]
 *           example:
 *             type: "Hard"
 *     responses:
 *       200:
 *         description: Reset Charger Response
 *
 * /api/ocpp/{client_id}/change-configuration:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Change Configuration
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *           example:
 *             key: "AuthorizeRemoteTxRequests"
 *             value: "true"
 *     responses:
 *       200:
 *         description: Change Configuration Response
 *
 * /api/ocpp/{client_id}/get-configuration:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Get Configuration
 *     parameters:
 *       - in: path
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: array
 *                 items:
 *                   type: string
 *           example:
 *             key: ["HeartbeatInterval", "MeterValuesSampleInterval"]
 *     responses:
 *       200:
 *         description: Get Configuration Response
 *
 * /api/ocpp/{client_id}/clear-cache:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Clear Cache
 *     parameters:
 *       - in: path
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Clear Cache Response
 *
 * /api/ocpp/{client_id}/update-firmware:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Update Firmware
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               location:
 *                 type: string
 *               retrieveDate:
 *                 type: string
 *                 format: date-time
 *               retries:
 *                 type: integer
 *               retryInterval:
 *                 type: integer
 *           example:
 *             location: "http://firmware.example.com/firmware_v2.bin"
 *             retrieveDate: "2025-10-01T13:00:00Z"
 *             retries: 3
 *             retryInterval: 60
 *     responses:
 *       200:
 *         description: Update Firmware Response
 *
 * /api/ocpp/{client_id}/get-diagnostics:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Get Diagnostics
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               location:
 *                 type: string
 *               retries:
 *                 type: integer
 *               retryInterval:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               stopTime:
 *                 type: string
 *                 format: date-time
 *           example:
 *             location: "http://server.com/logs"
 *             retries: 2
 *             retryInterval: 30
 *             startTime: "2025-10-01T00:00:00Z"
 *             stopTime: "2025-10-01T23:59:59Z"
 *     responses:
 *       200:
 *         description: Get Diagnostics Response
 *
 * /api/ocpp/{client_id}/send-local-list:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Send Local List
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               listVersion:
 *                 type: integer
 *               updateType:
 *                 type: string
 *                 enum: [Full, Differential]
 *               localAuthorizationList:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     idTag:
 *                       type: string
 *                     idTagInfo:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           enum: [Accepted, Blocked, Expired, Invalid, ConcurrentTx]
 *                         expiryDate:
 *                           type: string
 *                           format: date-time
 *                         parentIdTag:
 *                           type: string
 *           example:
 *             listVersion: 2
 *             updateType: "Full"
 *             localAuthorizationList:
 *               - idTag: "RFID1234"
 *                 idTagInfo:
 *                   status: "Accepted"
 *                   expiryDate: "2026-01-01T00:00:00Z"
 *                   parentIdTag: "MASTER123"
 *     responses:
 *       200:
 *         description: Send Local List Response
 *
 * /api/ocpp/{client_id}/get-local-list-version:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Get Local List Version
 *     parameters:
 *       - in: path
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Get Local List Version Response
 *
 * /api/ocpp/{client_id}/data-transfer:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Data Transfer
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               vendorId:
 *                 type: string
 *               messageId:
 *                 type: string
 *               data:
 *                 type: object
 *           example:
 *             vendorId: "AcmeCorp"
 *             messageId: "GetChargerTemp"
 *             data:
 *               threshold: 50
 *     responses:
 *       200:
 *         description: Data Transfer Response
 *
 * /api/ocpp/{client_id}/trigger-message:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Trigger Message
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               requestedMessage:
 *                 type: string
 *                 enum: [BootNotification, StatusNotification, MeterValues, Heartbeat]
 *               connectorId:
 *                 type: integer
 *           example:
 *             requestedMessage: "MeterValues"
 *             connectorId: 1
 *     responses:
 *       200:
 *         description: Trigger Message Response
 *
 * /api/ocpp/{client_id}/set-charging-profile:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Set Charging Profile
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               csChargingProfiles:
 *                 type: object
 *           example:
 *             connectorId: 1
 *             csChargingProfiles:
 *               chargingProfileId: 20
 *               stackLevel: 0
 *               chargingProfilePurpose: "TxProfile"
 *               chargingProfileKind: "Absolute"
 *               chargingSchedule:
 *                 duration: 7200
 *                 startSchedule: "2025-10-01T14:00:00Z"
 *                 chargingRateUnit: "W"
 *                 chargingSchedulePeriod:
 *                   - startPeriod: 0
 *                     limit: 22000
 *     responses:
 *       200:
 *         description: Set Charging Profile Response
 *
 * /api/ocpp/{client_id}/clear-charging-profile:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Clear Charging Profile
 *     parameters:
 *       - in: path
 *         name: client_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               connectorId:
 *                 type: integer
 *               chargingProfilePurpose:
 *                 type: string
 *                 enum: [TxProfile, TxDefaultProfile, ChargePointMaxProfile]
 *           example:
 *             id: 20
 *             connectorId: 1
 *             chargingProfilePurpose: "TxProfile"
 *     responses:
 *       200:
 *         description: Clear Charging Profile Response
 *
 * /api/ocpp/{client_id}/get-composite-schedule:
 *   post:
 *     tags:
 *       - OCPP Remote APIs
 *     summary: Get Composite Schedule
 *     parameters:
 *       - in: path
 *         name: client_id
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
 *               duration:
 *                 type: integer
 *               chargingRateUnit:
 *                 type: string
 *                 enum: [W, A]
 *           example:
 *             connectorId: 1
 *             duration: 3600
 *             chargingRateUnit: "W"
 *     responses:
 *       200:
 *         description: Get Composite Schedule Response
 *
 */
