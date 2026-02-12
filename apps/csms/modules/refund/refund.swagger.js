/**
 * @swagger
 * components:
 *   schemas:
 *     RefundTicket:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the refund ticket
 *         ticketId:
 *           type: string
 *           description: Auto-generated ticket ID (e.g., TKT-ABC123)
 *         issueCategory:
 *           type: string
 *           enum: [EV Driver Issue, Card Re-Issue, General Support]
 *           description: Category of the refund issue
 *         priority:
 *           type: string
 *           enum: [Low, Medium, High]
 *           description: Priority level of the refund ticket
 *         assignedTo:
 *           type: string
 *           enum: [Sales, Operations, Maintenance, Finance]
 *           description: Department assigned to handle the refund
 *         customerName:
 *           type: string
 *           description: Name of the customer requesting refund
 *         country:
 *           type: string
 *           description: Country of the customer
 *         customerPhoneNumber:
 *           type: string
 *           description: Phone number of the customer
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Email address of the customer
 *         sessionId:
 *           type: string
 *           description: Session ID related to the refund
 *         chargeBoxId:
 *           type: string
 *           description: Charger ID related to the refund
 *         subject:
 *           type: string
 *           description: Subject of the refund request
 *         description:
 *           type: string
 *           description: Detailed description of the refund request
 *         amount:
 *           type: number
 *           description: Original amount of the transaction
 *         refundAmount:
 *           type: number
 *           description: Amount to be refunded
 *         ticketStatus:
 *           type: string
 *           enum: [Open, In Progress, Resolved, Closed]
 *           description: Current status of the ticket
 *         refundStatus:
 *           type: string
 *           enum: [Pending, In Review, Completed, Approved, Rejected]
 *           description: Current status of the refund
 *         isRefund:
 *           type: boolean
 *           description: Flag indicating if this is a refund ticket
 *         originalReceipt:
 *           type: string
 *           description: URL or reference to the original receipt
 *         refundReceipt:
 *           type: string
 *           description: URL or reference to the refund receipt
 *         timezone:
 *           type: string
 *           description: Timezone of the customer
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the refund ticket was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the refund ticket was last updated
 *         respondedAt:
 *           type: string
 *           format: date-time
 *           description: When the refund ticket was first responded to
 *         createdAtLocal:
 *           type: string
 *           description: Local creation timestamp
 *         updatedAtLocal:
 *           type: string
 *           description: Local update timestamp
 *         respondedAtLocal:
 *           type: string
 *           description: Local response timestamp
 *     
 *     RefundUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the update
 *         supportTicketId:
 *           type: string
 *           format: uuid
 *           description: ID of the refund ticket this update belongs to
 *         details:
 *           type: string
 *           description: Details of the update/comment
 *         creator:
 *           type: string
 *           description: Who created this update
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the update was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the update was last modified
 *         createdAtLocal:
 *           type: string
 *           description: Local creation timestamp
 *     
 *     CreateRefundRequest:
 *       type: object
 *       required:
 *         - sessionId
 *         - chargeBoxId
 *         - subject
 *         - description
 *         - amount
 *         - customerName
 *         - issueCategory
 *       properties:
 *         sessionId:
 *           type: string
 *           description: Session ID related to the refund
 *           example: "sess_123456789"
 *         chargeBoxId:
 *           type: string
 *           description: Charger ID related to the refund
 *           example: "CHG001"
 *         subject:
 *           type: string
 *           description: Subject of the refund request
 *           example: "Charging session failed - requesting refund"
 *         description:
 *           type: string
 *           description: Detailed description of the refund request
 *           example: "The charging session started but failed after 5 minutes. I was charged the full amount but received no service."
 *         amount:
 *           type: number
 *           description: Original amount of the transaction
 *           example: 25.50
 *         customerName:
 *           type: string
 *           description: Name of the customer requesting refund
 *           example: "John Doe"
 *         country:
 *           type: string
 *           description: Country of the customer
 *           example: "US"
 *         customerPhoneNumber:
 *           type: string
 *           description: Phone number of the customer
 *           example: "+1234567890"
 *         customerEmail:
 *           type: string
 *           format: email
 *           description: Email address of the customer
 *           example: "john.doe@example.com"
 *         issueCategory:
 *           type: string
 *           enum: [EV Driver Issue, Card Re-Issue, General Support]
 *           description: Category of the refund issue
 *           example: "EV Driver Issue"
 *     
 *     AddRefundCommentRequest:
 *       type: object
 *       required:
 *         - comment
 *       properties:
 *         comment:
 *           type: string
 *           description: Comment to add to the refund ticket
 *           example: "Customer has provided additional documentation. Processing refund."
 *     
 *     UpdateRefundStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [Pending, In Review, Completed, Approved, Rejected]
 *           description: New status for the refund
 *           example: "In Review"
 *     
 *     ReassignRefundRequest:
 *       type: object
 *       required:
 *         - assignTo
 *       properties:
 *         assignTo:
 *           type: string
 *           enum: [Sales, Operations, Maintenance, Finance]
 *           description: Department to reassign the refund to
 *           example: "Finance"
 *     
 *     ProcessRefundRequest:
 *       type: object
 *       required:
 *         - refundAmount
 *       properties:
 *         refundAmount:
 *           type: number
 *           description: Amount to be refunded
 *           example: 25.50
 *     
 *     RefundListResponse:
 *       type: object
 *       properties:
 *         list:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RefundTicket'
 *         currentPage:
 *           type: number
 *           description: Current page number
 *         totalPages:
 *           type: number
 *           description: Total number of pages
 *         totalCount:
 *           type: number
 *           description: Total number of refund tickets
 *     
 *     RefundDetailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/RefundTicket'
 *         - type: object
 *           properties:
 *             updates:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RefundUpdate'
 *               description: List of updates/comments for this refund ticket
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Refund not found"
 *     
 *     SuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message
 *           example: "Comment added successfully"
 */

/**
 * @swagger
 * tags:
 *   name: Refund Management
 *   description: APIs for managing refund tickets and disputes
 */

/**
 * @swagger
 * /api/refund:
 *   post:
 *     summary: Create a new refund ticket
 *     description: Creates a new refund ticket for a charging session dispute. The system will automatically get the timezone from the IP address and retrieve the original receipt from OCPP transactions.
 *     tags: [Refund Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRefundRequest'
 *           example:
 *             sessionId: "sess_123456789"
 *             chargeBoxId: "CHG001"
 *             subject: "Charging session failed - requesting refund"
 *             description: "The charging session started but failed after 5 minutes. I was charged the full amount but received no service."
 *             amount: 25.50
 *             customerName: "John Doe"
 *             country: "US"
 *             customerPhoneNumber: "+1234567890"
 *             customerEmail: "john.doe@example.com"
 *             issueCategory: "EV Driver Issue"
 *     responses:
 *       201:
 *         description: Refund ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundTicket'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               ticketId: "TKT-ABC123"
 *               issueCategory: "EV Driver Issue"
 *               priority: "Medium"
 *               assignedTo: "Finance"
 *               customerName: "John Doe"
 *               sessionId: "sess_123456789"
 *               chargeBoxId: "CHG001"
 *               subject: "Charging session failed - requesting refund"
 *               description: "The charging session started but failed after 5 minutes..."
 *               amount: 25.50
 *               ticketStatus: "Open"
 *               refundStatus: "Pending"
 *               isRefund: true
 *               timezone: "America/New_York"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updatedAt: "2024-01-15T10:30:00.000Z"
 *               respondedAt: "2024-01-15T10:30:00.000Z"
 *       400:
 *         description: Bad request - validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Validation failed"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Internal Server Error"
 * 
 *   get:
 *     summary: Get all refund tickets
 *     description: Retrieves a paginated list of all refund tickets with optional filtering and search capabilities.
 *     tags: [Refund Management]
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
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term to filter refund tickets
 *       - in: query
 *         name: refundStatus
 *         schema:
 *           type: string
 *           enum: [Pending, In Review, Completed, Approved, Rejected]
 *         description: Filter by refund status
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *           enum: [Sales, Operations, Maintenance, Finance]
 *         description: Filter by assigned department
 *       - in: query
 *         name: ticketStatus
 *         schema:
 *           type: string
 *           enum: [Open, In Progress, Resolved, Closed]
 *         description: Filter by ticket status
 *     responses:
 *       200:
 *         description: List of refund tickets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundListResponse'
 *             example:
 *               list:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   ticketId: "TKT-ABC123"
 *                   issueCategory: "EV Driver Issue"
 *                   priority: "Medium"
 *                   assignedTo: "Finance"
 *                   customerName: "John Doe"
 *                   refundStatus: "Pending"
 *                   ticketStatus: "Open"
 *                   amount: 25.50
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *               currentPage: 1
 *               totalPages: 5
 *               totalCount: 50
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/refund/{refundId}:
 *   get:
 *     summary: Get refund ticket by ID
 *     description: Retrieves detailed information about a specific refund ticket including all updates and comments.
 *     tags: [Refund Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the refund ticket
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Refund ticket details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundDetailResponse'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               ticketId: "TKT-ABC123"
 *               issueCategory: "EV Driver Issue"
 *               priority: "Medium"
 *               assignedTo: "Finance"
 *               customerName: "John Doe"
 *               sessionId: "sess_123456789"
 *               chargeBoxId: "CHG001"
 *               subject: "Charging session failed - requesting refund"
 *               description: "The charging session started but failed after 5 minutes..."
 *               amount: 25.50
 *               ticketStatus: "Open"
 *               refundStatus: "Pending"
 *               isRefund: true
 *               timezone: "America/New_York"
 *               createdAt: "2024-01-15T10:30:00.000Z"
 *               updates:
 *                 - id: "456e7890-e89b-12d3-a456-426614174001"
 *                   supportTicketId: "123e4567-e89b-12d3-a456-426614174000"
 *                   details: "Dispute/Refund ticket created successfully!"
 *                   creator: "System"
 *                   createdAt: "2024-01-15T10:30:00.000Z"
 *       404:
 *         description: Refund ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refund not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/refund/{refundId}/add-comment:
 *   post:
 *     summary: Add comment to refund ticket
 *     description: Adds a comment or update to an existing refund ticket. The comment will be attributed to the currently assigned department.
 *     tags: [Refund Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the refund ticket
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddRefundCommentRequest'
 *           example:
 *             comment: "Customer has provided additional documentation. Processing refund."
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               message: "Comment added successfully"
 *       404:
 *         description: Refund ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refund not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/refund/{refundId}/update-status:
 *   post:
 *     summary: Update refund ticket status
 *     description: Updates the refund status of a ticket. If the ticket status is "Open", it will automatically be changed to "In Progress".
 *     tags: [Refund Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the refund ticket
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRefundStatusRequest'
 *           example:
 *             status: "In Review"
 *     responses:
 *       200:
 *         description: Refund status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundTicket'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               ticketId: "TKT-ABC123"
 *               refundStatus: "In Review"
 *               ticketStatus: "In Progress"
 *               updatedAt: "2024-01-15T11:00:00.000Z"
 *       404:
 *         description: Refund ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refund not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/refund/{refundId}/re-assign:
 *   post:
 *     summary: Reassign refund ticket
 *     description: Reassigns a refund ticket to a different department. The reassignment will be logged with the previous assignee as the creator.
 *     tags: [Refund Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the refund ticket
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReassignRefundRequest'
 *           example:
 *             assignTo: "Finance"
 *     responses:
 *       200:
 *         description: Refund ticket reassigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundTicket'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               ticketId: "TKT-ABC123"
 *               assignedTo: "Finance"
 *               updatedAt: "2024-01-15T11:30:00.000Z"
 *       404:
 *         description: Refund ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refund not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/refund/{refundId}/process-refund:
 *   post:
 *     summary: Process refund
 *     description: Processes a refund by setting the refund amount and updating the status to "Completed". This is the final step in the refund process.
 *     tags: [Refund Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: refundId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the refund ticket
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessRefundRequest'
 *           example:
 *             refundAmount: 25.50
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefundTicket'
 *             example:
 *               id: "123e4567-e89b-12d3-a456-426614174000"
 *               ticketId: "TKT-ABC123"
 *               refundAmount: 25.50
 *               refundStatus: "Completed"
 *               updatedAt: "2024-01-15T12:00:00.000Z"
 *       404:
 *         description: Refund ticket not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Refund not found"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /api/refund/overview:
 *   get:
 *     summary: Get refund overview statistics
 *     description: Retrieve overview statistics for refund tickets including total tickets, pending, rejected, refunds count, and refund amount
 *     tags: [Refund]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date in YYYY-MM-DD format
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date in YYYY-MM-DD format
 *         example: "2024-01-31"
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Country code for filtering (uses country from support_ticket table)
 *         example: "US"
 *     responses:
 *       200:
 *         description: Refund overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTickets:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       description: Total number of refund tickets
 *                       example: 100
 *                     label:
 *                       type: string
 *                       description: Label for the metric
 *                       example: "Total Tickets"
 *                 pending:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       description: Number of pending refund tickets
 *                       example: 7
 *                     label:
 *                       type: string
 *                       description: Label for the metric
 *                       example: "Pending"
 *                 rejected:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       description: Number of rejected refund tickets
 *                       example: 12
 *                     label:
 *                       type: string
 *                       description: Label for the metric
 *                       example: "Rejected"
 *                 refunds:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       description: Number of completed refunds
 *                       example: 23
 *                     label:
 *                       type: string
 *                       description: Label for the metric
 *                       example: "Refunds"
 *                 refundAmount:
 *                   type: object
 *                   properties:
 *                     value:
 *                       type: number
 *                       format: float
 *                       description: Total refund amount processed
 *                       example: 137.50
 *                     label:
 *                       type: string
 *                       description: Label for the metric
 *                       example: "Refund Amount"
 *                 filters:
 *                   type: object
 *                   description: Applied filter criteria
 *                   properties:
 *                     startDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-01"
 *                     endDate:
 *                       type: string
 *                       format: date
 *                       example: "2024-01-31"
 *                     country:
 *                       type: string
 *                       example: "US"
 *             example:
 *               totalTickets:
 *                 value: 100
 *                 label: "Total Tickets"
 *               pending:
 *                 value: 7
 *                 label: "Pending"
 *               rejected:
 *                 value: 12
 *                 label: "Rejected"
 *               refunds:
 *                 value: 23
 *                 label: "Refunds"
 *               refundAmount:
 *                 value: 137.50
 *                 label: "Refund Amount"
 *               filters: {"startDate":"2024-01-01","endDate":"2024-01-31","country":"US"}
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
