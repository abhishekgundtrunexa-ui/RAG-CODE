/**
 * @swagger
 * components:
 *   schemas:
 *     CgxTeamUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the user
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         country:
 *           type: string
 *           description: User's country
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: User's department ID
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: User's role ID
 *         timezone:
 *           type: string
 *           default: "UTC"
 *           description: User's timezone
 *         dateFormat:
 *           type: string
 *           default: "dd-MM-yyyy"
 *           description: User's date format preference
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: User's status
 *         isSuperAdmin:
 *           type: boolean
 *           default: false
 *           description: Whether user is a super admin
 *         isOwner:
 *           type: boolean
 *           default: false
 *           description: Whether user is an owner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who created this user
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who last updated this user
 *
 *     CgxTeamUserRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - departmentId
 *         - userRoleId
 *       properties:
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         country:
 *           type: string
 *           description: User's country
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: User's department ID
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: User's role ID
 *
 *     CgxTeamUserUpdateRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - departmentId
 *         - userRoleId
 *       properties:
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         country:
 *           type: string
 *           description: User's country
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: User's department ID
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: User's role ID
 *
 *     CgxTeamUserDeleteRequest:
 *       type: object
 *       required:
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of user IDs to delete
 *
 *     CgxTeamUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "User added successfully"
 *
 *     CgxTeamUserListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/CgxTeamUser'
 */

/**
 * @swagger
 * /api/user/cgx-team:
 *   post:
 *     summary: Add a new CGX Team user
 *     description: Create a new CGX Team user
 *     tags: [CGX Team Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CgxTeamUserRequest'
 *           example:
 *             fullName: "John Doe"
 *             email: "john.doe@example.com"
 *             country: "Canada"
 *             phoneNumber: "+1234567890"
 *             departmentId: "uuid-of-department"
 *             userRoleId: "uuid-of-role"
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CgxTeamUser'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all CGX Team users
 *     description: Retrieve a list of all CGX Team users
 *     tags: [CGX Team Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CgxTeamUserListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/user/cgx-team/{id}:
 *   get:
 *     summary: Get CGX Team user by ID
 *     description: Retrieve a specific CGX Team user by their ID
 *     tags: [CGX Team Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CgxTeamUser'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     summary: Update CGX Team user
 *     description: Update an existing CGX Team user
 *     tags: [CGX Team Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CgxTeamUserUpdateRequest'
 *           example:
 *             fullName: "John Doe"
 *             email: "john.doe@example.com"
 *             country: "Canada"
 *             phoneNumber: "+1234567890"
 *             departmentId: "uuid-of-department"
 *             userRoleId: "uuid-of-role"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CgxTeamUserResponse'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 */

/**
 * @swagger
 * /api/user/cgx-team:
 *   delete:
 *     summary: Delete multiple CGX Team users
 *     description: Soft delete multiple CGX Team users
 *     tags: [CGX Team Users]
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
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array of user IDs to delete
 *                 example: ["uuid1", "uuid2"]
 *     responses:
 *       200:
 *         description: Users deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Users deleted successfully
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of deleted user IDs
 *                 notFound:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of user IDs not found
 *       400:
 *         description: Bad request (missing IDs)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
