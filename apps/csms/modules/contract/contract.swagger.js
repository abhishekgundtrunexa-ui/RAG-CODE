/**
 * @swagger
 * components:
 *   schemas:
 *     Contract:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the contract
 *         contractCode:
 *           type: string
 *           description: Contract identifier
 *         validFrom:
 *           type: string
 *           format: date-time
 *           description: Contract validity start date
 *         validTo:
 *           type: string
 *           format: date-time
 *           description: Contract validity end date
 *         status:
 *           type: string
 *           enum: [ISSUED, ACCEPTED, REJECTED, EXPIRED]
 *           default: ISSUED
 *           description: Contract status
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who created this contract
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who last updated this contract
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Contract creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Contract last update timestamp
 *         partners:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContractPartner'
 *           description: Associated partners
 *         evseStations:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContractEvseStation'
 *           description: Associated EVSE stations
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ContractActivity'
 *           description: Contract activities
 *
 *     ContractPartner:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: Contract ID
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Partner ID
 *         partnerType:
 *           type: string
 *           description: Partner type
 *         splitPercentage:
 *           type: integer
 *           description: Revenue split percentage
 *         isVerified:
 *           type: boolean
 *           description: Whether partner is verified
 *
 *     ContractEvseStation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: Contract ID
 *         evseStationId:
 *           type: string
 *           format: uuid
 *           description: EVSE Station ID
 *
 *     ContractActivity:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: Contract ID
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User ID who performed the action
 *         action:
 *           type: string
 *           description: Action performed
 *         details:
 *           type: string
 *           description: Action details
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Activity timestamp
 *
 *     ContractRequest:
 *       type: object
 *       required:
 *         - validFrom
 *         - validTo
 *         - evseStationIds
 *         - partners
 *         - otp
 *       properties:
 *         validFrom:
 *           type: string
 *           format: date-time
 *           description: Contract validity start date
 *         validTo:
 *           type: string
 *           format: date-time
 *           description: Contract validity end date
 *         partners:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               partnerType:
 *                 type: string
 *               splitPercentage:
 *                 type: integer
 *           description: Array of partner data
 *         evseStationIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of EVSE station IDs
 *         otp:
 *           type: string
 *           description: OTP for verification
 *
 *     ContractUpdateRequest:
 *       type: object
 *       required:
 *         - contractId
 *         - validFrom
 *         - validTo
 *         - evseStationIds
 *         - partners
 *         - otp
 *       properties:
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: Contract ID
 *         validFrom:
 *           type: string
 *           format: date-time
 *           description: Contract validity start date
 *         validTo:
 *           type: string
 *           format: date-time
 *           description: Contract validity end date
 *         partners:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               partnerType:
 *                 type: string
 *               splitPercentage:
 *                 type: integer
 *           description: Array of partner data
 *         evseStationIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of EVSE station IDs
 *         otp:
 *           type: string
 *           description: OTP for verification
 *
 *     ContractDeleteRequest:
 *       type: object
 *       required:
 *         - contractId
 *         - otp
 *       properties:
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: Contract ID
 *         otp:
 *           type: string
 *           description: OTP for verification
 *
 *     ContractVerifyRequest:
 *       type: object
 *       required:
 *         - contractId
 *         - partnerId
 *         - isVerified
 *       properties:
 *         contractId:
 *           type: string
 *           format: uuid
 *           description: Contract ID
 *         partnerId:
 *           type: string
 *           format: uuid
 *           description: Partner ID
 *         isVerified:
 *           type: boolean
 *           description: Verification status
 *         consent:
 *           type: boolean
 *           description: Consent to split
 *
 *     ContractOtpRequest:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [add, update, delete]
 *           description: Action for which OTP is required
 *
 *     ContractOtpResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "OTP sent to your email."
 *
 *     ContractResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Contract created successfully"
 *
 *     SearchRequest:
 *       type: object
 *       required:
 *         - query
 *       properties:
 *         query:
 *           type: string
 *           description: Search term
 *           example: "station name"
 */

/**
 * @swagger
 * tags:
 *   - name: Contract
 *     description: Contract management and search
 */

/**
 * @swagger
 * /api/contract/verify:
 *   post:
 *     summary: Verify contract partner
 *     description: Update the verification status of a partner in a contract
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractVerifyRequest'
 *           example:
 *             contractId: "uuid-1"
 *             partnerId: "uuid-2"
 *             isVerified: true
 *             consent: true
 *     responses:
 *       200:
 *         description: Contract verification status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Contract verification status updated successfully"
 *                 contractId:
 *                   type: string
 *                   format: uuid
 *                 partnerId:
 *                   type: string
 *                   format: uuid
 *                 isVerified:
 *                   type: boolean
 *                 consent:
 *                   type: boolean
 *       400:
 *         description: Invalid request or missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       404:
 *         description: Contract, partner, or contract-partner relationship not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/contract:
 *   post:
 *     summary: Create a new contract
 *     description: Create a new contract with partners and EVSE stations (requires OTP)
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractRequest'
 *           example:
 *             validFrom: "2024-01-01T00:00:00Z"
 *             validTo: "2024-12-31T23:59:59Z"
 *             country: "CA"
 *             partners: [
 *               {
 *                 id: "uuid-1",
 *                 partnerType: "OPERATOR",
 *                 splitPercentage: 60
 *               },
 *               {
 *                 id: "uuid-2",
 *                 partnerType: "OWNER",
 *                 splitPercentage: 40
 *               }
 *             ]
 *             evseStationIds: ["uuid-1", "uuid-2"]
 *             otp: "1234"
 *     responses:
 *       201:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contract'
 *       400:
 *         description: Invalid request, duplicate contract ID, or invalid OTP
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all contracts
 *     description: Retrieve a list of all contracts with pagination
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of contracts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/contract/{id}:
 *   get:
 *     summary: Get contract by ID
 *     description: Retrieve a specific contract with all details
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     responses:
 *       200:
 *         description: Contract retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contract'
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     summary: Update contract
 *     description: Update an existing contract (requires OTP)
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractUpdateRequest'
 *           example:
 *             contractId: "CONTRACT-001-UPDATED"
 *             validFrom: "2024-01-01T00:00:00Z"
 *             validTo: "2024-12-31T23:59:59Z"
 *             evseStationIds: ["uuid-1", "uuid-2"]
 *             partners: [
 *               {
 *                 id: "uuid-1",
 *                 partnerType: "OPERATOR",
 *                 splitPercentage: 70
 *               }
 *             ]
 *             otp: "1234"
 *     responses:
 *       200:
 *         description: Contract updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContractResponse'
 *       400:
 *         description: Invalid request or invalid OTP
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete contract
 *     description: Soft delete a contract and all related data (requires OTP)
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contractId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Contract ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ContractDeleteRequest'
 *           example:
 *             contractId: "uuid-1"
 *             otp: "1234"
 *     responses:
 *       200:
 *         description: Contract deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ContractResponse'
 *       400:
 *         description: Invalid OTP
 *       404:
 *         description: Contract not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/contract/search-evse-station:
 *   post:
 *     summary: Search EVSE stations for contract
 *     description: Search EVSE stations by name, address, city, or state
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SearchRequest'
 *           example:
 *             query: "Downtown Station"
 *             country: "ca"
 *     responses:
 *       200:
 *         description: List of matching EVSE stations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   name:
 *                     type: string
 *                   code:
 *                     type: string
 *                   country:
 *                     type: string
 *       400:
 *         description: Search query required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/contract/search-partner:
 *   post:
 *     summary: Search partners for contract
 *     description: Search partners by name, company, email, or phone with optional partner type filter
 *     tags: [Contract]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search term for partner
 *                 example: "ABC Company"
 *               partnerType:
 *                 type: string
 *                 description: Filter by partner type (optional)
 *                 example: "OPERATOR"
 *     responses:
 *       200:
 *         description: List of matching partners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                     description: Partner ID
 *                   fullName:
 *                     type: string
 *                     description: Partner full name
 *                   partnerCode:
 *                     type: string
 *                     description: Partner code
 *       400:
 *         description: Search query required
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Super Admin access required
 *       500:
 *         description: Internal server error
 */
