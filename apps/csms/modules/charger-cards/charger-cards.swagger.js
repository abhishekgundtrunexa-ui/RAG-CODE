/**
 * @swagger
 * /charger-cards/set-charger-card-auth-list/{serial_number}:
 *   post:
 *     summary: Set charger card authorization list
 *     description: Adds a new card to the charger's local authorization list and syncs it with the charger using OCPP SendLocalList (Differential update)
 *     tags:
 *       - Charger Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *         description: The serial number or chargeBoxId of the charger
 *         example: "CHARGER001"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardUid
 *               - cardLabel
 *             properties:
 *               cardUid:
 *                 type: string
 *                 description: The unique identifier of the RFID card
 *                 example: "04A1B2C3D4E5F6"
 *               cardLabel:
 *                 type: string
 *                 description: A human-readable label for the card
 *                 example: "John Doe's Card"
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiry date for the card authorization (ISO 8601 format)
 *                 example: "2026-12-31T23:59:59.000Z"
 *               status:
 *                 type: string
 *                 enum: [Accepted, Blocked, Expired, Invalid, ConcurrentTx]
 *                 description: Authorization status of the card
 *                 default: "Accepted"
 *                 example: "Accepted"
 *               parentIdTag:
 *                 type: string
 *                 description: Optional parent ID tag for hierarchical authorization
 *                 example: "PARENT_TAG_001"
 *     responses:
 *       200:
 *         description: Card successfully added to authorization list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "The card has been assigned to the charger successfully."
 *                 chargerDetails:
 *                   type: object
 *                   description: Updated charger details including cards
 *       400:
 *         description: Bad request - Invalid parameters or card already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "This cardUid ia already in use."
 *       401:
 *         description: Unauthorized - Authentication required
 */

/**
 * @swagger
 * /charger-cards/update-charger-card-auth-list/{serial_number}/{card_id}:
 *   put:
 *     summary: Update charger card authorization list
 *     description: Updates an existing card in the charger's local authorization list and syncs the changes with the charger using OCPP SendLocalList (Differential update)
 *     tags:
 *       - Charger Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *         description: The serial number or chargeBoxId of the charger
 *         example: "CHARGER001"
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The database ID of the card to update
 *         example: "123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardUid:
 *                 type: string
 *                 description: The unique identifier of the RFID card (optional, only if changing)
 *                 example: "04A1B2C3D4E5F6"
 *               cardLabel:
 *                 type: string
 *                 description: A human-readable label for the card (optional)
 *                 example: "John Doe's Updated Card"
 *               expiryDate:
 *                 type: string
 *                 format: date-time
 *                 description: Optional expiry date for the card authorization (ISO 8601 format)
 *                 example: "2027-12-31T23:59:59.000Z"
 *               status:
 *                 type: string
 *                 enum: [Accepted, Blocked, Expired, Invalid, ConcurrentTx]
 *                 description: Authorization status of the card
 *                 example: "Blocked"
 *               parentIdTag:
 *                 type: string
 *                 description: Optional parent ID tag for hierarchical authorization
 *                 example: "PARENT_TAG_001"
 *     responses:
 *       200:
 *         description: Card successfully updated in authorization list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "The card has been updated successfully."
 *                 chargerDetails:
 *                   type: object
 *                   description: Updated charger details including cards
 *       400:
 *         description: Bad request - Invalid parameters or card UID already in use
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid Serial-Number"
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Card not found"
 *       401:
 *         description: Unauthorized - Authentication required
 */


/**
 * @swagger
 * /charger-cards/sync-auth-list/{serial_number}:
 *   post:
 *     summary: Sync full authorization list with charger
 *     description: Synchronizes the complete local authorization list with the charger using OCPP SendLocalList (Full update). This sends all active cards to the charger and replaces its entire local list.
 *     tags:
 *       - Charger Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *         description: The serial number or chargeBoxId of the charger
 *         example: "CHARGER001"
 *     responses:
 *       200:
 *         description: Authorization list successfully synced with charger
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Auth list has beed synced with charger"
 *       400:
 *         description: Bad request - Invalid serial number
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid Serial-Number"
 *       401:
 *         description: Unauthorized - Authentication required
 */

/**
 * @swagger
 * /charger-cards/delete-charger-card/{serial_number}/{card_id}:
 *   delete:
 *     summary: Delete a charger card
 *     description: Deletes a card from the database and updates the charger's local authorization list to invalidate the card.
 *     tags:
 *       - Charger Cards
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serial_number
 *         required: true
 *         schema:
 *           type: string
 *         description: The serial number or chargeBoxId of the charger
 *         example: "CHARGER001"
 *       - in: path
 *         name: card_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The database ID of the card to delete
 *         example: "123"
 *     responses:
 *       200:
 *         description: Card successfully deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "The card has been deleted successfully."
 *                 chargerDetails:
 *                   type: object
 *                   description: Updated charger details
 *       400:
 *         description: Bad request - Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid Serial-Number"
 *       404:
 *         description: Card not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Card not found"
 *       401:
 *         description: Unauthorized - Authentication required
 */
