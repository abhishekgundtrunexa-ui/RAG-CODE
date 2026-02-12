/**
 * @swagger
 * tags:
 *   name: EMSP Management
 *   description: Electric Mobility Service Provider (EMSP) management APIs
 *
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SettlementScheduleRequest:
 *       type: object
 *       properties:
 *         settlementPeriod:
 *           type: string
 *           enum: [1 Week, 2 Weeks, 1 Month]
 *           description: Settlement period
 *         nextSettlementDate:
 *           type: string
 *           format: date
 *           description: Next settlement date
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EMSP:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the EMSP
 *         name:
 *           type: string
 *           description: EMSP company name
 *         email:
 *           type: string
 *           format: email
 *           description: Company email address
 *         phone:
 *           type: string
 *           description: Company phone number
 *         registeredAddress:
 *           type: string
 *           description: Registered business address
 *         billingAddress:
 *           type: string
 *           description: Billing address
 *         country:
 *           type: string
 *           description: Country code
 *         currency:
 *           type: string
 *           description: Default currency
 *         language:
 *           type: string
 *           description: Default language
 *         profilePicture:
 *           type: string
 *           description: Profile picture URL
 *         bankVerificationStatus:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: Bank verification status
 *         taxCertificateDocumentId:
 *           type: string
 *           description: Tax certificate document ID
 *         incorporationCertificateDocumentId:
 *           type: string
 *           description: Incorporation certificate document ID
 *         bankVerificationLetterDocumentId:
 *           type: string
 *           description: Bank verification letter document ID
 *         bankVerificationActionTakenBy:
 *           type: string
 *           description: User who took the verification action
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who created this EMSP
 *         isOwner:
 *           type: boolean
 *           description: Whether this is an owner EMSP
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: EMSP creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: EMSP last update timestamp
 *
 *     EMSPUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the EMSP user
 *         emspId:
 *           type: string
 *           format: uuid
 *           description: Associated EMSP ID
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phone:
 *           type: string
 *           description: User's phone number
 *         state:
 *           type: string
 *           description: State/province
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code
 *         country:
 *           type: string
 *           description: Country code
 *         profilePicture:
 *           type: string
 *           description: Profile picture URL
 *         isBillingAddressSame:
 *           type: boolean
 *           description: Whether billing address is same as registered address
 *         status:
 *           type: string
 *           enum: [REGISTERED, ACTIVE, INACTIVE, SUSPENDED]
 *           description: User status
 *         apexEmailVerified:
 *           type: boolean
 *           description: Whether email is verified by Apex
 *         isEmsp:
 *           type: boolean
 *           description: Whether this user is an EMSP user
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *
 *     EMSPRequest:
 *       type: object
 *       required:
 *         - emspData
 *       properties:
 *         emspData:
 *           type: object
 *           required:
 *             - companyName
 *             - emspAdminName
 *             - companyEmail
 *             - emspAdminEmail
 *             - phone
 *             - currency
 *             - country
 *             - language
 *           properties:
 *             companyName:
 *               type: string
 *               description: Company name
 *               example: "ElectroCharge Solutions"
 *             emspAdminName:
 *               type: string
 *               description: EMSP admin name
 *               example: "John Smith"
 *             companyEmail:
 *               type: string
 *               format: email
 *               description: Company email address
 *               example: "info@electrocharge.com"
 *             emspAdminEmail:
 *               type: string
 *               format: email
 *               description: EMSP admin email address
 *               example: "john.smith@electrocharge.com"
 *             phone:
 *               type: string
 *               description: Phone number
 *               example: "+1-416-555-0123"
 *             currency:
 *               type: string
 *               description: Default currency
 *               example: "USD"
 *             country:
 *               type: string
 *               description: Country code
 *               example: "US"
 *             language:
 *               type: string
 *               description: Default language
 *               example: "en"
 *             registeredAddress:
 *               type: string
 *               description: Registered business address
 *               example: "123 Business St, New York, NY 10001"
 *             isBillingAddressSame:
 *               type: boolean
 *               description: Whether billing address is same as registered address
 *               example: true
 *             billingAddress:
 *               type: string
 *               description: Billing address (if different)
 *               example: "456 Billing Ave, New York, NY 10002"
 *             profilePicture:
 *               type: string
 *               description: Profile picture URL
 *               example: "https://example.com/profile.jpg"
 *             state:
 *               type: string
 *               description: State/province
 *               example: "New York"
 *             pincode:
 *               type: string
 *               description: Postal/ZIP code
 *               example: "10001"
 *         businessTaxDetails:
 *           type: object
 *           properties:
 *             businessNumber:
 *               type: string
 *               description: Business registration number
 *             taxCertificate:
 *               type: string
 *               description: Tax certificate file path
 *         bankAccount:
 *           type: object
 *           properties:
 *             bankName:
 *               type: string
 *               description: Bank name
 *             branchNumber:
 *               type: string
 *               description: Branch number
 *             institutionNumber:
 *               type: string
 *               description: Institution number
 *             accountNumber:
 *               type: string
 *               description: Account number
 *             accountType:
 *               type: string
 *               description: Account type
 *             bankAddress:
 *               type: string
 *               description: Bank address
 *             bankVerificationLetter:
 *               type: string
 *               description: Bank verification letter file path
 *         paymentConfig:
 *           type: object
 *           properties:
 *             tarrif_model:
 *               type: string
 *               description: Tariff model
 *             electricityGridRate:
 *               type: number
 *               description: Electricity grid rate
 *             grossMargin:
 *               type: number
 *               description: Gross margin percentage
 *             baseRate:
 *               type: number
 *               description: Base charging rate
 *             paymentGatewayPartner:
 *               type: string
 *               description: Payment gateway partner
 *             preauthAmount:
 *               type: number
 *               description: Pre-authorization amount
 *         chargerConfig:
 *           type: object
 *           properties:
 *             maxChargingPower:
 *               type: number
 *               description: Maximum charging power in kW
 *             chargingProtocol:
 *               type: string
 *               description: Charging protocol (OCPP, etc.)
 *
 *     EMSPOtpRequest:
 *       type: object
 *       required:
 *         - otp
 *       properties:
 *         otp:
 *           type: string
 *           description: OTP for verification
 *           example: "1234"
 *
 *     EMSPUpdateRequest:
 *       type: object
 *       properties:
 *         emspData:
 *           type: object
 *           properties:
 *             companyName:
 *               type: string
 *               description: Company name
 *             emspAdminName:
 *               type: string
 *               description: EMSP admin name
 *             emspAdminEmail:
 *               type: string
 *               format: email
 *               description: EMSP admin email address
 *             phone:
 *               type: string
 *               description: Phone number
 *             country:
 *               type: string
 *               description: Country code
 *             state:
 *               type: string
 *               description: State/province
 *             pincode:
 *               type: string
 *               description: Postal/ZIP code
 *             isBillingAddressSame:
 *               type: boolean
 *               description: Whether billing address is same as registered address
 *             registeredAddress:
 *               type: string
 *               description: Registered business address
 *             billingAddress:
 *               type: string
 *               description: Billing address
 *             profilePicture:
 *               type: string
 *               description: Profile picture URL
 *         businessTaxDetails:
 *           $ref: '#/components/schemas/EMSPRequest/properties/businessTaxDetails'
 *         bankAccount:
 *           $ref: '#/components/schemas/EMSPRequest/properties/bankAccount'
 *         paymentConfig:
 *           $ref: '#/components/schemas/EMSPRequest/properties/paymentConfig'
 *         chargerConfig:
 *           $ref: '#/components/schemas/EMSPRequest/properties/chargerConfig'
 *
 *     BankVerificationApproveRequest:
 *       type: object
 *       required:
 *         - taxCertificateDocumentId
 *         - incorporationCertificateDocumentId
 *         - bankVerificationLetterDocumentId
 *       properties:
 *         taxCertificateDocumentId:
 *           type: string
 *           description: Tax certificate document ID
 *           example: "doc_uuid_123"
 *         incorporationCertificateDocumentId:
 *           type: string
 *           description: Incorporation certificate document ID
 *           example: "doc_uuid_456"
 *         bankVerificationLetterDocumentId:
 *           type: string
 *           description: Bank verification letter document ID
 *           example: "doc_uuid_789"
 *
 *     EMSPResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *         emspUserData:
 *           $ref: '#/components/schemas/EMSPUser'
 *         emspCompanyData:
 *           $ref: '#/components/schemas/EMSP'
 *         businessTaxDetails:
 *           type: object
 *           description: Business tax details
 *         bankAccount:
 *           type: object
 *           description: Bank account details
 *         paymentConfig:
 *           type: object
 *           description: Payment configuration
 *         chargerConfig:
 *           type: object
 *           description: Charger configuration
 *
 *     EMSPListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/EMSPResponse'
 */

/**
 * @swagger
 * /api/emsp/get-preauth-amount:
 *   post:
 *     summary: Get Preauth-Amount
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               regionalElectricityRate:
 *                 type: number
 *                 example: 0.19
 *     responses:
 *       201:
 *         description: Preauth-Amount
 * 
 * /api/emsp:
 *   post:
 *     summary: Add a new EMSP
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPRequest'
 *     responses:
 *       201:
 *         description: EMSP created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EMSPResponse'
 *       400:
 *         description: Bad request (invalid data, duplicate email)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all EMSP users
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of EMSP users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EMSPListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/verify-otp:
 *   post:
 *     summary: Verify OTP for EMSP
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPOtpRequest'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "OTP verified successfully"
 *       400:
 *         description: Bad request (invalid OTP)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/business-tax:
 *   post:
 *     summary: Add or update business tax details
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPRequest/properties/businessTaxDetails'
 *     responses:
 *       201:
 *         description: Business tax details added/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Business tax details added successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/bank-account:
 *   post:
 *     summary: Add or update bank account details
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPRequest/properties/bankAccount'
 *     responses:
 *       201:
 *         description: Bank account details added/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Bank account details added successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/payment-config:
 *   post:
 *     summary: Add or update payment configuration
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPRequest/properties/paymentConfig'
 *     responses:
 *       201:
 *         description: Payment configuration added/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Payment configuration added successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/charger-config:
 *   post:
 *     summary: Add or update charger configuration
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPRequest/properties/chargerConfig'
 *     responses:
 *       201:
 *         description: Charger configuration added/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Charger configuration added successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/check-account:
 *   get:
 *     summary: Check EMSP account by email or phone
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *           format: email
 *         description: EMSP email address
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: EMSP phone number
 *     responses:
 *       200:
 *         description: EMSP account details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EMSPResponse'
 *       400:
 *         description: Bad request (missing filters or EMSP already verified)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/{emspId}:
 *   get:
 *     summary: Get EMSP by ID
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     responses:
 *       200:
 *         description: EMSP details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EMSPResponse'
 *       400:
 *         description: Bad request (missing emspId)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     summary: Update EMSP
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EMSPUpdateRequest'
 *     responses:
 *       200:
 *         description: EMSP updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EMSPResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 *
 *   delete:
 *     summary: Delete EMSP
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     responses:
 *       200:
 *         description: EMSP deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EMSP deleted successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/{emspId}/reject-bank-verification:
 *   patch:
 *     summary: Reject EMSP bank verification
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     responses:
 *       200:
 *         description: EMSP bank verification rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EMSP bank verification rejected successfully"
 *                 emsp:
 *                   $ref: '#/components/schemas/EMSP'
 *       400:
 *         description: Bad request (invalid emspId)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/{emspId}/approve-bank-verification:
 *   patch:
 *     summary: Approve EMSP bank verification
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BankVerificationApproveRequest'
 *     responses:
 *       200:
 *         description: EMSP bank verification approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EMSP bank verification approved successfully"
 *                 emsp:
 *                   $ref: '#/components/schemas/EMSP'
 *       400:
 *         description: Bad request (missing required document IDs or invalid emspId)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/emsp/{emspId}/set-settlement-schedule:
 *   put:
 *     summary: Set EMSP settlement schedule
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SettlementScheduleRequest'
 *     responses:
 *       200:
 *         description: EMSP settlement schedule set successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EMSP settlement schedule set successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/emsp/{emspId}/profile-photo:
 *   patch:
 *     summary: Update EMSP profile photo
 *     tags: [EMSP Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: emspId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: EMSP user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProfilePhotoRequest'
 *             properties:
 *               profilePhoto:
 *                 type: string
 *                 description: Profile photo URL
 *     responses:
 *       200:
 *         description: EMSP profile photo updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "EMSP profile photo updated successfully"
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: EMSP not found
 *       500:
 *         description: Internal server error
 */