/**
 * @swagger
 * components:
 *   schemas:
 *     IdTagInfo:
 *       type: object
 *       required:
 *         - idTag
 *       properties:
 *         idTag:
 *           type: string
 *           description: The identifier to be added/updated in the local authorization list
 *           example: "RFID12345678"
 *         status:
 *           type: string
 *           enum: [Accepted, Blocked, Expired, Invalid, ConcurrentTx]
 *           default: Accepted
 *           description: Authorization status for the idTag
 *           example: "Accepted"
 *         expiryDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Optional expiry date for the authorization (ISO 8601 format)
 *           example: "2026-12-31T23:59:59Z"
 *         parentIdTag:
 *           type: string
 *           nullable: true
 *           description: Optional parent identifier
 *           example: "PARENT123"
 *     
 *     LocalAuthorizationListRequest:
 *       type: object
 *       required:
 *         - idTags
 *       properties:
 *         idTags:
 *           type: array
 *           description: Array of ID tags to be added/updated in the local authorization list
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/IdTagInfo'
 *         updateType:
 *           type: string
 *           enum: [Full, Differential]
 *           default: Full
 *           description: |
 *             Type of update:
 *             - Full: Replace the entire local authorization list
 *             - Differential: Add/update only the specified entries
 *           example: "Full"
 *     
 *     LocalAuthorizationListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the operation was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Human-readable message about the operation result
 *           example: "Local authorization list updated and sent to charger successfully"
 *         data:
 *           type: object
 *           properties:
 *             chargeBoxId:
 *               type: string
 *               description: The charger's unique identifier
 *               example: "CHARGER001"
 *             listVersion:
 *               type: integer
 *               description: Version number of the local authorization list
 *               example: 5
 *             updateType:
 *               type: string
 *               enum: [Full, Differential]
 *               description: Type of update that was performed
 *               example: "Full"
 *             totalIdTags:
 *               type: integer
 *               description: Total number of ID tags in the update
 *               example: 10
 *             chargerOnline:
 *               type: boolean
 *               description: Indicates if the charger was online when the update was sent
 *               example: true
 *             ocppResponse:
 *               type: object
 *               nullable: true
 *               description: OCPP response from the charger (if online)
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Accepted"
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message describing what went wrong
 *           example: "Invalid chargeBoxId"
 */

/**
 * @swagger
 * tags:
 *   name: Charger Configurations
 *   description: Charger configuration and local authorization list management
 */

/**
 * @swagger
 * /api/charger-configurations/local-auth-list/{chargeBoxId}:
 *   post:
 *     summary: Update local authorization list for a charger
 *     description: |
 *       Updates or replaces the local authorization list on a charger. This endpoint allows you to:
 *       - Add new RFID cards/tokens to the charger's local authorization list
 *       - Update existing authorization entries
 *       - Replace the entire authorization list (Full update)
 *       - Add/modify specific entries (Differential update)
 *       
 *       The list is sent to the charger via OCPP SendLocalList command if the charger is online.
 *       If the charger is offline, the list is stored in the database and will be sent when the charger comes online.
 *       
 *       **Note**: Each update increments the list version number automatically.
 *     tags: [Charger Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: chargeBoxId
 *         in: path
 *         required: true
 *         description: Unique identifier of the charger (chargeBoxId or serial number)
 *         schema:
 *           type: string
 *           example: "CHARGER001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LocalAuthorizationListRequest'
 *           examples:
 *             fullUpdate:
 *               summary: Full update with multiple RFID cards
 *               value:
 *                 updateType: "Full"
 *                 idTags:
 *                   - idTag: "RFID12345678"
 *                     status: "Accepted"
 *                     expiryDate: "2026-12-31T23:59:59Z"
 *                   - idTag: "RFID87654321"
 *                     status: "Accepted"
 *                   - idTag: "RFID11111111"
 *                     status: "Blocked"
 *             differentialUpdate:
 *               summary: Differential update - add/modify specific cards
 *               value:
 *                 updateType: "Differential"
 *                 idTags:
 *                   - idTag: "RFID99999999"
 *                     status: "Accepted"
 *                     expiryDate: "2027-06-30T23:59:59Z"
 *                     parentIdTag: "PARENT123"
 *             blockCard:
 *               summary: Block a specific card
 *               value:
 *                 updateType: "Differential"
 *                 idTags:
 *                   - idTag: "RFID12345678"
 *                     status: "Blocked"
 *     responses:
 *       200:
 *         description: Local authorization list updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LocalAuthorizationListResponse'
 *             examples:
 *               chargerOnline:
 *                 summary: Charger was online - list sent immediately
 *                 value:
 *                   success: true
 *                   message: "Local authorization list updated and sent to charger successfully"
 *                   data:
 *                     chargeBoxId: "CHARGER001"
 *                     listVersion: 5
 *                     updateType: "Full"
 *                     totalIdTags: 10
 *                     chargerOnline: true
 *                     ocppResponse:
 *                       status: "Accepted"
 *               chargerOffline:
 *                 summary: Charger was offline - list queued for later
 *                 value:
 *                   success: true
 *                   message: "Local authorization list updated. Will be sent when charger comes online"
 *                   data:
 *                     chargeBoxId: "CHARGER001"
 *                     listVersion: 6
 *                     updateType: "Differential"
 *                     totalIdTags: 2
 *                     chargerOnline: false
 *                     ocppResponse: null
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidChargeBoxId:
 *                 summary: Invalid or missing chargeBoxId
 *                 value:
 *                   success: false
 *                   message: "Invalid chargeBoxId"
 *               emptyIdTags:
 *                 summary: Empty or missing idTags array
 *                 value:
 *                   success: false
 *                   message: "idTags array is required and must not be empty"
 *               invalidUpdateType:
 *                 summary: Invalid updateType value
 *                 value:
 *                   success: false
 *                   message: "updateType must be either 'Full' or 'Differential'"
 *               chargerNotFound:
 *                 summary: Charger not found
 *                 value:
 *                   success: false
 *                   message: "Charger not found with the provided chargeBoxId"
 *               missingIdTag:
 *                 summary: Missing idTag field in entry
 *                 value:
 *                   success: false
 *                   message: "Each idTag entry must have an 'idTag' field"
 *               invalidStatus:
 *                 summary: Invalid status value
 *                 value:
 *                   success: false
 *                   message: "Invalid status 'InvalidStatus' for idTag 'RFID12345678'"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Internal server error"
 */

module.exports = {};
