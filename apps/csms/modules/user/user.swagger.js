/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         fullName:
 *           type: string
 *           description: User's full name (computed)
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         profilePicture:
 *           type: string
 *           format: uri
 *           description: URL to user's profile picture
 *         status:
 *           type: string
 *           enum: [Registered, Active, Inactive, Disabled]
 *           description: Current status of the user
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: ID of the user's role
 *         department:
 *           type: string
 *           description: User's department
 *         country:
 *           type: string
 *           description: User's country
 *         timezone:
 *           type: string
 *           description: User's timezone
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *         roleData:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             name:
 *               type: string
 *             code:
 *               type: string
 *             permissions:
 *               type: array
 *               items:
 *                 type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - userRoleId
 *     
 *     UserRole:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *     
 *     EMspAccount:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         taxation:
 *           type: string
 *         billingAddress:
 *           type: string
 *         country:
 *           type: string
 *         currency:
 *           type: string
 *         language:
 *           type: string
 *         profilePicture:
 *           type: string
 *           format: uri
 *     
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User's first name
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phoneNumber:
 *           type: string
 *           pattern: '^\+?[\d\s\-\(\)]+$'
 *           description: User's phone number
 *         file:
 *           type: string
 *           format: binary
 *           description: Profile picture file (JPEG/PNG)
 *       required:
 *         - firstName
 *         - lastName
 *     
 *     UpdateAccountSettingsRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Account name
 *         taxation:
 *           type: string
 *           description: Tax information
 *         billingAddress:
 *           type: string
 *           description: Billing address
 *         country:
 *           type: string
 *           description: Country
 *         currency:
 *           type: string
 *           description: Currency code
 *         language:
 *           type: string
 *           description: Language code
 *         file:
 *           type: string
 *           format: binary
 *           description: Account logo file (JPEG/PNG)
 *     
 *     AddUserRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phoneNumber:
 *           type: string
 *           pattern: '^\+?[\d\s\-\(\)]+$'
 *           description: User's phone number
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: ID of the user's role
 *         country:
 *           type: string
 *           description: User's country
 *         department:
 *           type: string
 *           description: User's department
 *       required:
 *         - name
 *         - email
 *         - userRoleId
 *     
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         phoneNumber:
 *           type: string
 *           pattern: '^\+?[\d\s\-\(\)]+$'
 *           description: User's phone number
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: ID of the user's role
 *         country:
 *           type: string
 *           description: User's country
 *         department:
 *           type: string
 *           description: User's department
 *     
 *     DeleteUserBulkRequest:
 *       type: object
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           minItems: 1
 *           description: Array of user IDs to delete
 *       required:
 *         - ids
 *     
 *     UserListResponse:
 *       type: object
 *       properties:
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *         currentPage:
 *           type: integer
 *           description: Current page number
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 *         totalCount:
 *           type: integer
 *           description: Total number of users
 *     
 *     UserInfoResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           description: User's full name
 *     
 *     FilterStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         status:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Registered", "Active", "Inactive", "Disabled"]
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           description: Error message
 *         errorMessages:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of validation error messages
 *         errorMessage:
 *           type: string
 *           description: Single error message
 *     
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 *     
 *     ActionOTP:
 *       type: apiKey
 *       in: header
 *       name: X-Action-OTP
 *       description: Action OTP for sensitive operations
 * 
 *   parameters:
 *     userId:
 *       name: userId
 *       in: path
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: User ID
 *     
 *     page:
 *       name: page
 *       in: query
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: Page number for pagination
 *     
 *     limit:
 *       name: limit
 *       in: query
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *       description: Number of items per page
 *     
 *     search:
 *       name: search
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         maxLength: 100
 *       description: Search term for filtering users
 *     
 *     status:
 *       name: status
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         enum: [Registered, Active, Inactive, Disabled]
 *       description: Filter users by status
 *     
 *     sortBy:
 *       name: sortBy
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         enum: [fullName, email, createdAt, updatedAt, lastLogin]
 *         default: createdAt
 *       description: Field to sort by
 *     
 *     sortOrder:
 *       name: sortOrder
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         enum: [ASC, DESC]
 *         default: DESC
 *       description: Sort order
 *     
 *     userIdQuery:
 *       name: userId
 *       in: query
 *       required: true
 *       schema:
 *         type: string
 *         format: uuid
 *       description: User ID for info lookup
 */

/**
 * @swagger
 * tags:
 *   - name: User Management
 *     description: User management operations including profile updates, user creation, and user administration
 *   - name: User Profile
 *     description: User profile and account settings management
 *   - name: User Administration
 *     description: Administrative operations for user management
 */

/**
 * @swagger
 * /user/update-profile:
 *   post:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information including name, email, phone number, and profile picture
 *     tags: [User Profile]
 *     security:
 *       - BearerAuth: []
 *       - ActionOTP: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/update-account-settings:
 *   post:
 *     summary: Update account settings
 *     description: Update the authenticated user's account settings (only for account owners)
 *     tags: [User Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccountSettingsRequest'
 *     responses:
 *       200:
 *         description: Account settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EMspAccount'
 *       400:
 *         description: Validation error or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       403:
 *         description: Forbidden - User is not an account owner
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user in the system with role assignment and send invitation email
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddUserRequest'
 *     responses:
 *       200:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   get:
 *     summary: Get user list
 *     description: Retrieve a paginated list of users with filtering and sorting options
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/search'
 *       - $ref: '#/components/parameters/status'
 *       - $ref: '#/components/parameters/sortBy'
 *       - $ref: '#/components/parameters/sortOrder'
 *     responses:
 *       200:
 *         description: User list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/filter-status:
 *   get:
 *     summary: Get user status filter options
 *     description: Retrieve available user status values for filtering
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Status filter options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FilterStatusResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/info:
 *   get:
 *     summary: Get user information
 *     description: Retrieve basic user information by user ID (supports multiple user types)
 *     tags: [User Management]
 *     parameters:
 *       - $ref: '#/components/parameters/userIdQuery'
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfoResponse'
 *       400:
 *         description: Missing user ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve detailed user information by user ID
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   patch:
 *     summary: Update user by ID
 *     description: Update user information by user ID
 *     tags: [User Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   
 *   delete:
 *     summary: Delete user by ID
 *     description: Soft delete a user by user ID
 *     tags: [User Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/delete-bulk:
 *   delete:
 *     summary: Delete multiple users
 *     description: Soft delete multiple users by their IDs
 *     tags: [User Administration]
 *     security:
 *       - BearerAuth: []
 *       - ActionOTP: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DeleteUserBulkRequest'
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or business logic error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: One or more users not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/{userId}/resend-invite-user:
 *   get:
 *     summary: Resend user invitation
 *     description: Resend invitation email to a registered user
 *     tags: [User Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       200:
 *         description: Invitation resent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User is not in registered status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/{userId}/enable:
 *   post:
 *     summary: Enable user
 *     description: Enable a disabled user account
 *     tags: [User Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/userId'
 *     responses:
 *       200:
 *         description: User enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User cannot be enabled (wrong status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 * 
 * /user/{userId}/disable:
 *   post:
 *     summary: Disable user
 *     description: Disable an active user account
 *     tags: [User Administration]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/schemas/userId'
 *     responses:
 *       200:
 *         description: User disabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: User cannot be disabled (wrong status)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing authentication token
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
