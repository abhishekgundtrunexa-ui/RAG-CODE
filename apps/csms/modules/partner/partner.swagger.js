/**
 * @swagger
 * tags:
 *   name: Partner Management
 *   description: Partner management APIs (Super Admin only)
 *
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for Super Admin authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Partner:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the partner
 *         fullName:
 *           type: string
 *           description: Partner's full name
 *         companyName:
 *           type: string
 *           description: Company name
 *         country:
 *           type: string
 *           description: Country code
 *         phoneNumber:
 *           type: string
 *           description: Phone number
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         state:
 *           type: string
 *           description: State/province
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code
 *         businessNumber:
 *           type: string
 *           description: Business registration number
 *         companyGstAccountNumber:
 *           type: string
 *           description: Company GST account number
 *         federalTaxPercentage:
 *           type: string
 *           description: Federal tax percentage
 *         provincialSalesTaxPercentage:
 *           type: string
 *           description: Provincial sales tax percentage
 *         harmonizedSalesTaxPercentage:
 *           type: string
 *           description: Harmonized sales tax percentage
 *         taxCertificate:
 *           type: string
 *           description: Tax certificate file path
 *         incorporationCertificate:
 *           type: string
 *           description: Incorporation certificate file path
 *         businessPanNumber:
 *           type: string
 *           description: Business PAN number
 *         centralGstPercentage:
 *           type: string
 *           description: Central GST percentage
 *         stateGstPercentage:
 *           type: string
 *           description: State GST percentage
 *         integratedGstPercentage:
 *           type: string
 *           description: Integrated GST percentage
 *         isDeleted:
 *           type: boolean
 *           description: Soft delete flag
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who created this partner
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who last updated this partner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Partner creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Partner last update timestamp
 *         bankDetails:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *               description: Bank details ID
 *             bankName:
 *               type: string
 *               description: Name of the bank
 *             branchNumber:
 *               type: string
 *               description: Branch number
 *             institutionNumber:
 *               type: string
 *               description: Institution number
 *             accountNumber:
 *               type: string
 *               description: Account number
 *             ifscCode:
 *               type: string
 *               description: IFSC code
 *             accountType:
 *               type: string
 *               description: Type of account
 *             bankAddress:
 *               type: string
 *               description: Bank address
 *             bankVerificationLetter:
 *               type: string
 *               description: Bank verification letter file path
 *
 *     PartnerRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - companyName
 *         - country
 *         - phoneNumber
 *         - email
 *         - state
 *         - pincode
 *         - bankName
 *         - branchNumber
 *         - institutionNumber
 *         - accountNumber
 *         - ifscCode
 *         - accountType
 *         - bankAddress
 *         - bankVerificationLetter
 *         - otp
 *       properties:
 *         fullName:
 *           type: string
 *           description: Partner's full name
 *           example: "John Smith"
 *         companyName:
 *           type: string
 *           description: Company name
 *           example: "Moneris Payment Solutions"
 *         country:
 *           type: string
 *           description: Country code
 *           example: "CA"
 *         phoneNumber:
 *           type: string
 *           description: Phone number
 *           example: "+1-416-555-0123"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "partnerships@moneris.com"
 *         state:
 *           type: string
 *           description: State/province
 *           example: "Ontario"
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code
 *           example: "M5V 3A8"
 *         businessNumber:
 *           type: string
 *           description: Business registration number
 *           example: "123456789RT0001"
 *         companyGstAccountNumber:
 *           type: string
 *           description: Company GST account number
 *           example: "GST123456789RT0001"
 *         federalTaxPercentage:
 *           type: string
 *           description: Federal tax percentage
 *           example: "5.0"
 *         provincialSalesTaxPercentage:
 *           type: string
 *           description: Provincial sales tax percentage
 *           example: "8.0"
 *         harmonizedSalesTaxPercentage:
 *           type: string
 *           description: Harmonized sales tax percentage
 *           example: "13.0"
 *         taxCertificate:
 *           type: string
 *           description: Tax certificate file path
 *           example: "certificates/tax_cert.pdf"
 *         incorporationCertificate:
 *           type: string
 *           description: Incorporation certificate file path
 *           example: "certificates/incorporation.pdf"
 *         businessPanNumber:
 *           type: string
 *           description: Business PAN number
 *           example: "ABCDE1234F"
 *         centralGstPercentage:
 *           type: string
 *           description: Central GST percentage
 *           example: "9.0"
 *         stateGstPercentage:
 *           type: string
 *           description: State GST percentage
 *           example: "9.0"
 *         integratedGstPercentage:
 *           type: string
 *           description: Integrated GST percentage
 *           example: "18.0"
 *         bankName:
 *           type: string
 *           description: Name of the bank
 *           example: "Royal Bank of Canada"
 *         branchNumber:
 *           type: string
 *           description: Branch number
 *           example: "0001"
 *         institutionNumber:
 *           type: string
 *           description: Institution number
 *           example: "003"
 *         accountNumber:
 *           type: string
 *           description: Account number
 *           example: "1234567890"
 *         ifscCode:
 *           type: string
 *           description: IFSC code
 *           example: "RBCA0000001"
 *         accountType:
 *           type: string
 *           description: Type of account
 *           example: "Business Checking"
 *         bankAddress:
 *           type: string
 *           description: Bank address
 *           example: "200 Bay Street, Toronto, ON M5J 2J5"
 *         bankVerificationLetter:
 *           type: string
 *           description: Bank verification letter file path
 *           example: "bank_verification_moneris.pdf"
 *         otp:
 *           type: string
 *           description: OTP for verification
 *           example: "1234"
 *
 *     PartnerUpdateRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - companyName
 *         - country
 *         - phoneNumber
 *         - email
 *         - state
 *         - pincode
 *         - bankName
 *         - branchNumber
 *         - institutionNumber
 *         - accountNumber
 *         - ifscCode
 *         - accountType
 *         - bankAddress
 *         - bankVerificationLetter
 *         - otp
 *       properties:
 *         fullName:
 *           type: string
 *           description: Partner's full name
 *           example: "John Smith"
 *         companyName:
 *           type: string
 *           description: Company name
 *           example: "Moneris Payment Solutions"
 *         country:
 *           type: string
 *           description: Country code
 *           example: "CA"
 *         phoneNumber:
 *           type: string
 *           description: Phone number
 *           example: "+1-416-555-0123"
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *           example: "partnerships@moneris.com"
 *         state:
 *           type: string
 *           description: State/province
 *           example: "Ontario"
 *         pincode:
 *           type: string
 *           description: Postal/ZIP code
 *           example: "M5V 3A8"
 *         businessNumber:
 *           type: string
 *           description: Business registration number
 *           example: "123456789RT0001"
 *         companyGstAccountNumber:
 *           type: string
 *           description: Company GST account number
 *           example: "GST123456789RT0001"
 *         federalTaxPercentage:
 *           type: string
 *           description: Federal tax percentage
 *           example: "5.0"
 *         provincialSalesTaxPercentage:
 *           type: string
 *           description: Provincial sales tax percentage
 *           example: "8.0"
 *         harmonizedSalesTaxPercentage:
 *           type: string
 *           description: Harmonized sales tax percentage
 *           example: "13.0"
 *         taxCertificate:
 *           type: string
 *           description: Tax certificate file path
 *           example: "certificates/tax_cert.pdf"
 *         incorporationCertificate:
 *           type: string
 *           description: Incorporation certificate file path
 *           example: "certificates/incorporation.pdf"
 *         businessPanNumber:
 *           type: string
 *           description: Business PAN number
 *           example: "ABCDE1234F"
 *         centralGstPercentage:
 *           type: string
 *           description: Central GST percentage
 *           example: "9.0"
 *         stateGstPercentage:
 *           type: string
 *           description: State GST percentage
 *           example: "9.0"
 *         integratedGstPercentage:
 *           type: string
 *           description: Integrated GST percentage
 *           example: "18.0"
 *         bankName:
 *           type: string
 *           description: Name of the bank
 *           example: "Royal Bank of Canada"
 *         branchNumber:
 *           type: string
 *           description: Branch number
 *           example: "0001"
 *         institutionNumber:
 *           type: string
 *           description: Institution number
 *           example: "003"
 *         accountNumber:
 *           type: string
 *           description: Account number
 *           example: "1234567890"
 *         ifscCode:
 *           type: string
 *           description: IFSC code
 *           example: "RBCA0000001"
 *         accountType:
 *           type: string
 *           description: Type of account
 *           example: "Business Checking"
 *         bankAddress:
 *           type: string
 *           description: Bank address
 *           example: "200 Bay Street, Toronto, ON M5J 2J5"
 *         bankVerificationLetter:
 *           type: string
 *           description: Bank verification letter file path
 *           example: "bank_verification_moneris.pdf"
 *         otp:
 *           type: string
 *           description: OTP for verification
 *           example: "1234"
 *
 *     PartnerDeleteRequest:
 *       type: object
 *       required:
 *         - otp
 *       properties:
 *         otp:
 *           type: string
 *           description: OTP for verification
 *           example: "1234"
 *
 *     PartnerOtpRequest:
 *       type: object
 *       required:
 *         - action
 *       properties:
 *         action:
 *           type: string
 *           enum: [add, update, delete]
 *           description: Action for which OTP is required
 *
 *     PartnerOtpResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "OTP sent to your email."
 *
 *     PartnerResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Partner deleted successfully"
 *
 *     PartnerListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/Partner'
 */

/**
 * @swagger
 * /api/partner:
 *   post:
 *     summary: Add a new partner
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PartnerRequest'
 *     responses:
 *       201:
 *         description: Partner created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Bad request (missing OTP, invalid data, duplicate email)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all partners
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of partners retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PartnerListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/partner/{id}:
 *   get:
 *     summary: Get partner by ID
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Partner'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     summary: Update partner
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PartnerUpdateRequest'
 *     responses:
 *       200:
 *         description: Partner updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Bad request (missing OTP, invalid data, duplicate email)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/partner:
 *   delete:
 *     summary: Delete multiple partners
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *               - otp
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of partner IDs to delete
 *                 example: ["uuid1", "uuid2"]
 *               otp:
 *                 type: string
 *                 description: OTP for verification
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Partners deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Partners deleted successfully
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of deleted partner IDs
 *                 notFound:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of partner IDs not found
 *       400:
 *         description: Bad request (missing OTP or IDs)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

//resend partner invitation
/**
 * @swagger
 * /api/partner/{id}/resend-invite-user:
 *   get:
 *     summary: Resend partner invitation
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Partner invitation resent successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/partner/{id}/reject-bank-verification:
 *   patch:
 *     summary: Reject partner bank verification
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Partner bank verification rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Partner bank verification rejected successfully
 *                 partner:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Bad request (invalid partner ID)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/partner/{id}/approve-bank-verification:
 *   patch:
 *     summary: Approve partner bank verification
 *     tags: [Partner Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taxCertificateDocumentId
 *               - incorporationCertificateDocumentId
 *               - bankVerificationLetterDocumentId
 *             properties:
 *               taxCertificateDocumentId:
 *                 type: string
 *                 description: Tax certificate document ID
 *                 example: "doc_uuid_123"
 *               incorporationCertificateDocumentId:
 *                 type: string
 *                 description: Incorporation certificate document ID
 *                 example: "doc_uuid_456"
 *               bankVerificationLetterDocumentId:
 *                 type: string
 *                 description: Bank verification letter document ID
 *                 example: "doc_uuid_789"
 *     responses:
 *       200:
 *         description: Partner bank verification approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Partner bank verification approved successfully
 *                 partner:
 *                   $ref: '#/components/schemas/Partner'
 *       400:
 *         description: Bad request (missing required document IDs or invalid partner ID)
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Partner not found
 *       500:
 *         description: Internal server error
 */
