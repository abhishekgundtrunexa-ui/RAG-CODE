/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Charger:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the charger
 *         serialNumber:
 *           type: string
 *           description: Serial number of the charger
 *         chargeBoxId:
 *           type: string
 *           description: Charge box ID for OCPP communication
 *         uniqueId:
 *           type: string
 *           description: Unique identifier for external systems
 *         timezone:
 *           type: string
 *           description: Timezone of the charger's location
 *         country:
 *           type: string
 *           description: Country code (e.g., IN, US)
 *         chargerModel:
 *           type: string
 *           description: Model of the charger
 *         connectorTypeId:
 *           type: integer
 *           description: ID of the connector type
 *         status:
 *           type: string
 *           enum: [Generated, Registered, Activated, Available, Busy, Offline, Disabled, In-operative]
 *           description: Current status of the charger
 *         meteringConfig:
 *           type: object
 *           properties:
 *             underVoltageLimitPerPhase:
 *               type: number
 *             overVoltageLimitPerPhase:
 *               type: number
 *             underCurrentLimitPerPhase:
 *               type: number
 *             overCurrentLimitPerPhase:
 *               type: number
 *             maxCurrentLimitPerPhase:
 *               type: number
 *             noLoadTimeLimit:
 *               type: integer
 *           description: Metering configuration for the charger
 *         evseStationId:
 *           type: integer
 *           description: ID of the associated EVSE station
 *         cpoId:
 *           type: integer
 *           description: ID of the associated Charge Point Operator
 *     Feedback:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the feedback
 *         chargeBoxId:
 *           type: string
 *           description: Charge box ID of the charger
 *         transactionUuid:
 *           type: string
 *           description: UUID of the transaction
 *         rating:
 *           type: integer
 *           description: Rating given (1-5)
 *         review:
 *           type: string
 *           description: User-provided review text
 *         feedbackMessages:
 *           type: array
 *           items:
 *             type: string
 *           description: List of canned feedback messages
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of feedback creation
 *         createdAtLocal:
 *           type: string
 *           format: date-time
 *           description: Local timestamp of feedback creation
 *         timezone:
 *           type: string
 *           description: Timezone of the feedback
 */

/**
 * @swagger
 * /api/charger/feedback-messages:
 *   get:
 *     summary: Retrieve Feedback Messages
 *     description: Access a curated list of canned feedback messages in multiple languages, enhancing user experience for global EV charging networks.
 *     tags: [Charger]
 *     parameters:
 *       - in: query
 *         name: language
 *         schema:
 *           type: string
 *           default: en
 *           enum: [en, fr, es]
 *         description: Language code for feedback messages
 *         example: en
 *     responses:
 *       200:
 *         description: Feedback messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedbackMessages:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of feedback messages
 *                   example: ["Fast charging", "Reliable service"]
 *       400:
 *         description: Invalid language code
 */

/**
 * @swagger
 * /api/charger/{chargeBoxId}/charger-experience-feedback:
 *   post:
 *     summary: Submit Charging Experience Feedback
 *     description: Allow users to submit feedback on their charging experience, enabling continuous improvement of enterprise EV charging services.
 *     tags: [Charger]
 *     parameters:
 *       - in: path
 *         name: chargeBoxId
 *         schema:
 *           type: string
 *         required: true
 *         description: Charge box ID of the charger
 *         example: CB123456
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               connectorId:
 *                 type: integer
 *                 default: 1
 *                 description: Connector ID
 *                 example: 1
 *               rating:
 *                 type: integer
 *                 description: Rating (1-5)
 *                 example: 5
 *               review:
 *                 type: string
 *                 description: User review text
 *                 example: Excellent charging speed!
 *               feedbackMessages:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Selected canned feedback messages
 *                 example: ["Fast charging", "User-friendly"]
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       400:
 *         description: Invalid input or charger in use
 */

/**
 * @swagger
 * /api/charger/details:
 *   get:
 *     summary: Retrieve Charger Details
 *     description: Access detailed information about a specific charger, supporting enterprise-grade monitoring and diagnostics for EV infrastructure.
 *     tags: [Charger]
 *     parameters:
 *       - in: query
 *         name: inputValue
 *         schema:
 *           type: string
 *         required: true
 *         description: Charger ID, serial number, or chargeBoxId
 *         example: SN123456789
 *     responses:
 *       200:
 *         description: Charger details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Charger'
 *       404:
 *         description: Charger not found
 */

/**
 * @swagger
 * /api/charger/verify-admin:
 *   post:
 *     summary: Verify device admin passcode
 *     description: |
 *       Verifies whether the given passcode is correct for the device (charger) identified by `chargeboxId`.
 *       Passcode is considered valid if:
 *       - It matches the default `"000000"` passcode, or
 *       - It matches the actual `deviceAdminPassCode` associated with the charger in the database.
 *     tags:
 *       - Charger
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargeboxId
 *               - passcode
 *             properties:
 *               chargeboxId:
 *                 type: string
 *                 example: "CHARGER-001"
 *                 description: Unique identifier of the charger device.
 *               passcode:
 *                 type: string
 *                 example: "123456"
 *                 description: Passcode to be verified against the device's admin passcode.
 *     responses:
 *       200:
 *         description: Verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   example: true
 *                   description: Result indicating if the passcode was verified successfully.
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Something went wrong"
 */

/**
 * @swagger
 * /api/charger/{chargerId}/status:
 *   patch:
 *     summary: Update Charging Status
 *     description: |
 *       Updates the charging status of a charger.
 *       This action is restricted if the charger is already in `CHARGING`, `PREPARING`, or `FINISHING` state.
 *     tags:
 *       - Charger
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the charger to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, OCCUPIED, RESERVED, CHARGING, FINISHING, SUSPENDED, PREPARING, UNAVAILABLE]
 *                 example: AVAILABLE
 *                 description: New charging status to set
 *     responses:
 *       200:
 *         description: Charger status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 chargingStatus:
 *                   type: string
 *                   example: "AVAILABLE"
 *       400:
 *         description: Invalid status value or update not allowed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid Charging Status. Allowed Status Values: AVAILABLE, OCCUPIED, etc."
 *       404:
 *         description: Charger not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "CHARGER_NOT_FOUND"
 *       500:
 *         description: Server error while updating status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An Error Occurred While Updating The Charging Status"
 */

/**
 * @swagger
 * /api/charger/activate:
 *   patch:
 *     summary: Activate a charger
 *     description: |
 *       Activates a charger using its serial number and activation code.
 *       Validates the activation code, charger registration status, EVSE station linkage, location proximity, and timezone.
 *       Once activated, sends notifications and events through Pusher and updates charger status and metadata.
 *     tags:
 *       - Charger
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *               - activationCode
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 example: "CH-1234-5678"
 *                 description: Unique serial number of the charger (hyphens will be stripped internally)
 *               activationCode:
 *                 type: string
 *                 example: "000000"
 *                 description: Activation code received by the user or system (000000 for default bypass)
 *               lat:
 *                 type: number
 *                 format: float
 *                 example: 18.5204
 *                 description: Latitude of the charger location (optional; fallback to IP-based location)
 *               lng:
 *                 type: number
 *                 format: float
 *                 example: 73.8567
 *                 description: Longitude of the charger location (optional; fallback to IP-based location)
 *     responses:
 *       200:
 *         description: Charger activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Full charger details
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 serialNumber:
 *                   type: string
 *                   example: "CH12345678"
 *                 status:
 *                   type: string
 *                   example: "ACTIVATED"
 *                 activationDate:
 *                   type: string
 *                   format: date-time
 *                 validTill:
 *                   type: string
 *                   format: date-time
 *                 timezone:
 *                   type: string
 *                   example: "Asia/Kolkata"
 *                 ...:
 *                   description: Additional charger fields as returned by getChargerDetailsData
 *       208:
 *         description: Charger already activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger is already activated."
 *       400:
 *         description: Bad request (validation failure, expired code, unmatched location, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid Activation Code"
 *       404:
 *         description: Charger not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "CHARGER_NOT_FOUND"
 *       500:
 *         description: Server error while activating the charger
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An Error Occurred While Activating The Charger"
 */

/**
 * @swagger
 * /api/charger/resend-activate-code:
 *   patch:
 *     summary: Resend activation code for a charger
 *     description: |
 *       Generates a new activation code for a charger that has not yet been activated.
 *       The activation code is sent to all CPO admin users associated with the charger's EVSE station.
 *     tags:
 *       - Charger
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serialNumber
 *             properties:
 *               serialNumber:
 *                 type: string
 *                 example: "CH-1234-5678"
 *                 description: Serial number of the charger (hyphens will be stripped internally)
 *     responses:
 *       200:
 *         description: Activation code resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: Updated charger with new activation data
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *                 serialNumber:
 *                   type: string
 *                   example: "CH12345678"
 *                 activationCode:
 *                   type: string
 *                   example: "859321"
 *                 activationExpiresAt:
 *                   type: string
 *                   format: date-time
 *                 activationRequestedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Charger is already activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger is already activated"
 *       404:
 *         description: Charger or station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "CHARGER_NOT_FOUND"
 *       500:
 *         description: Internal server error while resending activation code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /api/charger/deleted:
 *   get:
 *     summary: Get deleted chargers with pagination and filtering
 *     description: |
 *       Retrieves a paginated list of chargers that have been soft deleted (marked as deleted but not permanently removed).
 *       This endpoint follows the same pattern as the main charger list but specifically for deleted chargers.
 *       Supports role-based access control, location filtering, and advanced query parameters.
 *       Users can only access deleted chargers they have permission to view based on their role.
 *     tags:
 *       - Charger
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location (state for CPO users, country for EMSP users)
 *         example: "California"
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: JSON string for advanced filtering (status, date ranges, etc.)
 *         example: '{"status": "activated", "startDate": "2024-01-01", "endDate": "2024-12-31"}'
 *       - in: query
 *         name: commissioned
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by commissioning status
 *         example: "true"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *         example: "createdAt"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order (ASC or DESC)
 *         example: "DESC"
 *     responses:
 *       200:
 *         description: Deleted chargers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Charger'
 *                   description: Array of deleted charger objects with detailed information
 *                 currentPage:
 *                   type: integer
 *                   description: Current page number
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   description: Total number of pages
 *                   example: 5
 *                 totalCount:
 *                   type: integer
 *                   description: Total number of deleted chargers
 *                   example: 50
 *                 hasNextPage:
 *                   type: boolean
 *                   description: Whether there is a next page
 *                   example: true
 *                 hasPreviousPage:
 *                   type: boolean
 *                   description: Whether there is a previous page
 *                   example: false
 *               example:
 *                 list:
 *                   - id: "123"
 *                     serialNumber: "CH-1234-5678"
 *                     chargeBoxId: "CB123456"
 *                     status: "deleted"
 *                     isDeleted: true
 *                     meteringConfig:
 *                       emModelName: "model123"
 *                       underVoltageLimitPerPhase: 200
 *                       overVoltageLimitPerPhase: 250
 *                     ocppConfig:
 *                       ocppVersion: "1.6.0"
 *                       csmsURL: "wss://csms.example.com"
 *                     cpo:
 *                       id: "456"
 *                       name: "Example CPO"
 *                     evseStation:
 *                       id: "789"
 *                       name: "Station A"
 *                 currentPage: 1
 *                 totalPages: 5
 *                 totalCount: 50
 *                 hasNextPage: true
 *                 hasPreviousPage: false
 *       400:
 *         description: Bad request (invalid filter parameters, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid filter parameters"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *       403:
 *         description: Access forbidden (user doesn't have permission to view deleted chargers)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access forbidden"
 *       404:
 *         description: Endpoint not found or resource unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not Found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /api/charger/{chargerId}:
 *   delete:
 *     summary: Soft delete a single charger
 *     description: |
 *       Soft deletes a specific charger by marking it as deleted without permanently removing it from the database.
 *       This operation requires OTP verification for security. The charger must not be in "busy" status.
 *       Only users with appropriate permissions can delete chargers.
 *       The charger will be marked as deleted and can be viewed in the deleted chargers list.
 *     tags:
 *       - Charger
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chargerId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the charger to delete
 *         example: "123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: One-time password received via email for verification
 *     responses:
 *       200:
 *         description: Charger soft deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger deleted successfully"
 *                   description: Success message confirming charger deletion
 *               example:
 *                 message: "Charger deleted successfully"
 *       400:
 *         description: Invalid OTP, charger busy, or other validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "'Invalid OTP' or 'Charger is busy and cannot be deleted'"
 *                   description: Error message indicating the specific validation failure
 *               example:
 *                 message: "Invalid OTP"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *                   description: Error message indicating authentication is required
 *               example:
 *                 message: "Authentication required"
 *       403:
 *         description: Access forbidden (user doesn't have permission to delete chargers)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access forbidden"
 *                   description: Error message indicating insufficient permissions
 *               example:
 *                 message: "Access forbidden"
 *       404:
 *         description: Charger not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger not found"
 *                   description: Error message indicating the specified charger doesn't exist
 *               example:
 *                 message: "Charger not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                   description: Error message indicating server-side error
 *               example:
 *                 message: "Internal Server Error"
 */

/**
 * @swagger
 * /api/charger/delete-bulk:
 *   delete:
 *     summary: Soft delete multiple chargers in bulk
 *     description: |
 *       Soft deletes multiple chargers by marking them as deleted without permanently removing them from the database.
 *       This operation requires OTP verification for security. All chargers must not be in "busy" status.
 *       Only users with appropriate permissions can delete chargers.
 *       The chargers will be marked as deleted and can be viewed in the deleted chargers list.
 *       This endpoint is useful for bulk operations to delete multiple chargers at once.
 *     tags:
 *       - Charger
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chargerIds
 *               - otp
 *             properties:
 *               chargerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["123", "456", "789"]
 *                 description: Array of charger IDs to delete
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: One-time password received via email for verification
 *     responses:
 *       200:
 *         description: Chargers soft deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Chargers deleted successfully"
 *                   description: Success message confirming bulk charger deletion
 *                 deletedCount:
 *                   type: integer
 *                   example: 3
 *                   description: Number of chargers successfully deleted
 *               example:
 *                 message: "Chargers deleted successfully"
 *                 deletedCount: 3
 *       400:
 *         description: Invalid OTP, chargers busy, or other validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "'Invalid OTP' or 'Some chargers are busy and cannot be deleted'"
 *                   description: Error message indicating the specific validation failure
 *               example:
 *                 message: "Invalid OTP"
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Authentication required"
 *                   description: Error message indicating authentication is required
 *               example:
 *                 message: "Authentication required"
 *       403:
 *         description: Access forbidden (user doesn't have permission to delete chargers)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Access forbidden"
 *                   description: Error message indicating insufficient permissions
 *               example:
 *                 message: "Access forbidden"
 *       404:
 *         description: One or more chargers not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "One or more chargers not found"
 *                   description: Error message indicating some specified chargers don't exist
 *               example:
 *                 message: "One or more chargers not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 *                   description: Error message indicating server-side error
 *               example:
 *                 message: "Internal Server Error"
 */
