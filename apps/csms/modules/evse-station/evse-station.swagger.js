/**
 * @swagger
 * /api/evse-station/{evseStationId}:
 *   patch:
 *     summary: Update EVSE station with OTP verification
 *     description: |
 *       Updates an existing EVSE station with OTP verification for security.
 *       This operation requires a valid OTP that was sent via the send-otp endpoint.
 *       The OTP must be provided in the request body and will be verified before the update proceeds.
 *     tags:
 *       - EVSE Station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evseStationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the EVSE station to update
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
 *               name:
 *                 type: string
 *                 example: "Station A"
 *                 description: Name of the EVSE station
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *                 description: Address of the EVSE station
 *               city:
 *                 type: string
 *                 example: "New York"
 *                 description: City where the station is located
 *               state:
 *                 type: string
 *                 example: "NY"
 *                 description: State where the station is located
 *               country:
 *                 type: string
 *                 example: "US"
 *                 description: Country where the station is located
 *               lat:
 *                 type: number
 *                 example: 40.7128
 *                 description: Latitude coordinate
 *               lng:
 *                 type: number
 *                 example: -74.0060
 *                 description: Longitude coordinate
 *               baseRate:
 *                 type: number
 *                 example: 10
 *                 description: Base rate
 *               electricityGridRate:
 *                 type: number
 *                 example: 30
 *                 description: Electricity grid rate
 *               taxRate:
 *                 type: number
 *                 example: 60
 *                 description: Tax rate
 *     responses:
 *       200:
 *         description: EVSE station updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123"
 *                 name:
 *                   type: string
 *                   example: "Station A"
 *                 address:
 *                   type: string
 *                   example: "123 Main St"
 *       400:
 *         description: Invalid OTP or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired OTP"
 *                   description: Error message indicating OTP validation failure
 *               example:
 *                 message: "Invalid or expired OTP"
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
 *       404:
 *         description: EVSE station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EVSE station not found"
 *                   description: Error message indicating the specified station doesn't exist
 *               example:
 *                 message: "EVSE station not found"
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
 * /api/evse-station/{evseStationId}:
 *   delete:
 *     summary: Soft delete EVSE station with OTP verification
 *     description: |
 *       Soft deletes a specific EVSE station by marking it as deleted without permanently removing it from the database.
 *       This operation requires OTP verification for security. The station must not have any associated chargers.
 *       Only users with appropriate permissions can delete EVSE stations.
 *       The station will be marked as deleted and can be viewed in the deleted stations list.
 *     tags:
 *       - EVSE Station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: evseStationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the EVSE station to delete
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
 *         description: EVSE station soft deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "123"
 *                 isDeleted:
 *                   type: boolean
 *                   example: true
 *                   description: Indicates the station has been soft deleted
 *       400:
 *         description: Invalid OTP, station has associated chargers, or other validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "'Invalid or expired OTP' or 'Cannot Delete EVSE Station With Associated Chargers'"
 *                   description: Error message indicating the specific validation failure
 *               example:
 *                 message: "Invalid or expired OTP"
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
 *       404:
 *         description: EVSE station not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EVSE station not found"
 *                   description: Error message indicating the specified station doesn't exist
 *               example:
 *                 message: "EVSE station not found"
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
 * /api/evse-station/bulk-delete:
 *   delete:
 *     summary: Soft delete multiple EVSE stations in bulk with OTP verification
 *     description: |
 *       Soft deletes multiple EVSE stations by marking them as deleted without permanently removing them from the database.
 *       This operation requires OTP verification for security. All stations must not have any associated chargers.
 *       Only users with appropriate permissions can delete EVSE stations.
 *       The stations will be marked as deleted and can be viewed in the deleted stations list.
 *       This endpoint is useful for bulk operations to delete multiple stations at once.
 *     tags:
 *       - EVSE Station
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - evseStationIds
 *               - otp
 *             properties:
 *               evseStationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["123", "456", "789"]
 *                 description: Array of EVSE station IDs to delete
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: One-time password received via email for verification
 *     responses:
 *       200:
 *         description: EVSE stations soft deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "123"
 *                   isDeleted:
 *                     type: boolean
 *                     example: true
 *                     description: Indicates the station has been soft deleted
 *               example:
 *                 - id: "123"
 *                   isDeleted: true
 *                 - id: "456"
 *                   isDeleted: true
 *       400:
 *         description: Invalid OTP, stations have associated chargers, or other validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "'Invalid or expired OTP for one or more EVSE stations' or 'Cannot delete EVSE Station with Chargers Assigned!'"
 *                   description: Error message indicating the specific validation failure
 *               example:
 *                 message: "Invalid or expired OTP for one or more EVSE stations"
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
 *       404:
 *         description: One or more EVSE stations not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EVSE Stations not found!"
 *                   description: Error message indicating some specified stations don't exist
 *               example:
 *                 message: "EVSE Stations not found!"
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
