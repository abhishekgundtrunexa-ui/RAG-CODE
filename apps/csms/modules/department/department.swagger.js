/**
 * @swagger
 * tags:
 *   name: Department
 *   description: Department management with OTP verification
 */

/**
 * @swagger
 *
 * /api/department:
 *   post:
 *     summary: Add a department (OTP required)
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - otp
 *             properties:
 *               name:
 *                 type: string
 *                 example: Operation Department 4
 *               code:
 *                 type: string
 *                 example: OPD04
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *               otp:
 *                 type: string
 *                 example: "9325"
 *               permissions:
 *                 type: array
 *                 description: List of module permissions
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                       example: Dashboard
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     subModules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Chargers Team
 *                           access:
 *                             type: string
 *                             example: view_edit
 *     responses:
 *       201:
 *         description: Department created
 *       400:
 *         description: Missing or invalid input/OTP
 *       500:
 *         description: Failed to add department
 *
 *   get:
 *     summary: List all departments
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Department'
 *       500:
 *         description: Failed to fetch departments
 *
 * /api/department/{departmentId}:
 *   get:
 *     summary: Get a department by ID
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to fetch department
 * 
 *   patch:
 *     summary: Update a department (OTP required)
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *               - otp
 *             properties:
 *               name:
 *                 type: string
 *                 example: Operation Department 4
 *               code:
 *                 type: string
 *                 example: OPD04
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *               otp:
 *                 type: string
 *                 example: "9325"
 *               permissions:
 *                 type: array
 *                 description: List of module permissions
 *                 items:
 *                   type: object
 *                   properties:
 *                     module:
 *                       type: string
 *                       example: Dashboard
 *                     enabled:
 *                       type: boolean
 *                       example: true
 *                     subModules:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Chargers Team
 *                           access:
 *                             type: string
 *                             example: view_edit
 *     responses:
 *       200:
 *         description: Department updated successfully
 *       400:
 *         description: Missing or invalid input/OTP
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to update department
 *
 *   delete:
 *     summary: Delete a department (OTP required)
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
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
 *                 example: "1234"
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       400:
 *         description: Missing or invalid input/OTP
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to delete department
 * 
 * 
 * /api/department/{departmentId}/roles:
 *   get:
 *     summary: Get a department roles by department ID
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department Role List
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to fetch department roles
 * 
 * /api/department/{departmentId}/role:
 *   post:
 *     summary: Create a department role by department ID
 *     tags: [Department]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Team Lead"
 *     responses:
 *       200:
 *         description: Department Role created successfully
 *       404:
 *         description: Department not found
 *       500:
 *         description: Failed to fetch department roles
 *
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         emspId:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               module:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *               subModules:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     access:
 *                       type: string
 *         isDefault:
 *           type: boolean
 *         createdBy:
 *           type: string
 *         isDeleted:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */ 