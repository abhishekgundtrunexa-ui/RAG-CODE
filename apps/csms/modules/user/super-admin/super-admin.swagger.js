/**
 * @swagger
 * components:
 *   schemas:
 *     SuperAdminUser:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the super admin
 *         fullName:
 *           type: string
 *           description: Super admin's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Super admin's email address
 *         country:
 *           type: string
 *           description: Super admin's country
 *         phoneNumber:
 *           type: string
 *           description: Super admin's phone number
 *         departmentId:
 *           type: string
 *           format: uuid
 *           description: Super admin's department ID
 *         userRoleId:
 *           type: string
 *           format: uuid
 *           description: Super admin's role ID
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *           description: Super admin's permissions array
 *           example: [
 *             {
 *               "module": "Dashboard",
 *               "enabled": true
 *             },
 *             {
 *               "module": "User Management",
 *               "enabled": true,
 *               "subModules": [
 *                 {
 *                   "name": "Chargers Team",
 *                   "access": "view_edit"
 *                 },
 *                 {
 *                   "name": "Partners",
 *                   "access": "view"
 *                 }
 *               ]
 *             }
 *           ]
 *         timezone:
 *           type: string
 *           default: "UTC"
 *           description: Super admin's timezone
 *         dateFormat:
 *           type: string
 *           default: "dd-MM-yyyy"
 *           description: Super admin's date format preference
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Super admin's status
 *         isSuperAdmin:
 *           type: boolean
 *           default: true
 *           description: Whether user is a super admin
 *         isOwner:
 *           type: boolean
 *           default: false
 *           description: Whether user is an owner
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Super admin creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Super admin last update timestamp
 *         createdBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who created this super admin
 *         updatedBy:
 *           type: string
 *           format: uuid
 *           description: ID of user who last updated this super admin
 *
 *     SuperAdminUserRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *       properties:
 *         fullName:
 *           type: string
 *           description: Super admin's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Super admin's email address
 *         country:
 *           type: string
 *           description: Super admin's country
 *         phoneNumber:
 *           type: string
 *           description: Super admin's phone number
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *           description: Super admin's permissions array
 *           example: [
 *             {
 *               "module": "Dashboard",
 *               "enabled": true
 *             },
 *             {
 *               "module": "User Management",
 *               "enabled": true,
 *               "subModules": [
 *                 {
 *                   "name": "Chargers Team",
 *                   "access": "view_edit"
 *                 },
 *                 {
 *                   "name": "Partners",
 *                   "access": "view"
 *                 }
 *               ]
 *             }
 *           ]
 *
 *     SuperAdminUserUpdateRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *       properties:
 *         fullName:
 *           type: string
 *           description: Super admin's full name
 *         email:
 *           type: string
 *           format: email
 *           description: Super admin's email address
 *         country:
 *           type: string
 *           description: Super admin's country
 *         phoneNumber:
 *           type: string
 *           description: Super admin's phone number
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *           description: Super admin's permissions array
 *           example: [
 *             {
 *               "module": "Dashboard",
 *               "enabled": true
 *             },
 *             {
 *               "module": "User Management",
 *               "enabled": true,
 *               "subModules": [
 *                 {
 *                   "name": "Chargers Team",
 *                   "access": "view_edit"
 *                 },
 *                 {
 *                   "name": "Partners",
 *                   "access": "view"
 *                 }
 *               ]
 *             }
 *           ]    
 *
 *     SuperAdminUserDeleteRequest:
 *       type: object
 *       required:
 *       properties:
 *         ids:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of super admin IDs to delete
 *
 *
 *     SuperAdminUserResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Super admin added successfully"
 *
 *     SuperAdminUserListResponse:
 *       type: array
 *       items:
 *         $ref: '#/components/schemas/SuperAdminUser'
 */

/**
 * @swagger
 * /api/user/super-admin:
 *   post:
 *     summary: Add a new Super Admin user
 *     description: Create a new Super Admin user
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuperAdminUserRequest'
 *           example:
 *             fullName: "Admin User"
 *             email: "admin.user@example.com"
 *             country: "Canada"
 *             phoneNumber: "+1234567890"
 *             permissions: [
 *               {
 *                 "module": "Dashboard",
 *                 "enabled": true
 *               },
 *               {
 *                 "module": "User Management",
 *                 "enabled": true,
 *                 "subModules": [
 *                   {
 *                     "name": "Chargers Team",
 *                     "access": "view_edit"
 *                   },
 *                   {
 *                     "name": "Partners",
 *                     "access": "view"
 *                   }
 *                 ]
 *               }
 *             ]
 *     responses:
 *       201:
 *         description: Super admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuperAdminUser'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all Super Admin users
 *     description: Retrieve a list of all Super Admin users
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of super admins retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuperAdminUserListResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/user/super-admin/{id}:
 *   get:
 *     summary: Get Super Admin user by ID
 *     description: Retrieve a specific Super Admin user by their ID
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Super admin ID
 *     responses:
 *       200:
 *         description: Super admin retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuperAdminUser'
 *       404:
 *         description: Super admin not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 *   patch:
 *     summary: Update Super Admin user
 *     description: Update an existing Super Admin user
 *     tags: [Super Admin Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Super admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SuperAdminUserUpdateRequest'
 *           example:
 *             fullName: "Admin User"
 *             email: "admin.user@example.com"
 *             country: "Canada"
 *             phoneNumber: "+1234567890"
 *             permissions: [
 *               {
 *                 "module": "Dashboard",
 *                 "enabled": true
 *               },
 *               {
 *                 "module": "User Management",
 *                 "enabled": true,
 *                 "subModules": [
 *                   {
 *                     "name": "Chargers Team",
 *                     "access": "view_edit"
 *                   },
 *                   {
 *                     "name": "Partners",
 *                     "access": "view"
 *                   }
 *                 ]
 *               }
 *             ]
 *     responses:
 *       200:
 *         description: Super admin updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuperAdminUserResponse'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Super admin not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *
 */

/**
 * @swagger
 * /api/user/super-admin:
 *   delete:
 *     summary: Delete multiple Super Admin users
 *     description: Soft delete multiple Super Admin users
 *     tags: [Super Admin Users]
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
 *                 description: Array of super admin IDs to delete
 *                 example: ["uuid1", "uuid2"]
 *     responses:
 *       200:
 *         description: Super admins deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Super admins deleted successfully
 *                 deleted:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of deleted super admin IDs
 *                 notFound:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: List of super admin IDs not found
 *       400:
 *         description: Bad request (missing IDs)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
