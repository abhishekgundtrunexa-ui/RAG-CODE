const Joi = require("joi");
const {
    SupportTicketRepository,
} = require("@shared-libs/db/mysql");

const priorities = ['Low', 'Medium', 'High'];
const departments = ['Sales', 'Operations', 'Maintenance', 'Finance'];
const ticketStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];


const validateDepartmentExists = async (value, helpers) => {
    if (!departments.includes(value)) {
        throw new Error("Invalid assignedTo department");
    }
    return value;
};

const validateTicketExists = async (value, helpers) => {
    const ticket = await SupportTicketRepository.findOneBy({ id: value });
    if (!ticket) {
        throw new Error("Ticket not found");
    }
    return value;
};

const createTicketValidation = {
    body: Joi.object({
        issueCategory: Joi.string().required(),
        priority: Joi.string().valid(...priorities).required(),
        assignedTo: Joi.string().optional().allow(null),
        customerName: Joi.string().optional().allow(null),
        country: Joi.string().optional().allow(null),
        customerPhoneNumber: Joi.string().optional().allow(null),
        customerEmail: Joi.string().email().optional().allow(null),
        sessionId: Joi.string().optional().allow(null),
        chargeBoxId: Joi.string().optional().allow(null),
        subject: Joi.string().optional().allow(null),
        description: Joi.string().optional().allow(null),
        timezone: Joi.string().optional().allow(null),
    }),
};

const updateTicketStatusValidation = {
    params: Joi.object({
        ticketId: Joi.string().uuid().required().external(validateTicketExists),
    }),
    body: Joi.object({
        status: Joi.string().valid(...ticketStatuses).required(),
        responseMessage: Joi.string().optional(),
    }),
};

const assignOrReassignTicketValidation = {
    params: Joi.object({
        ticketId: Joi.string().uuid().required().external(validateTicketExists),
    }),
    body: Joi.object({
        assignedTo: Joi.string().valid(...departments).required(),
    }),
};

const addTicketCommentValidation = {
    params: Joi.object({
        ticketId: Joi.string().uuid().required().external(validateTicketExists),
    }),
    body: Joi.object({
        details: Joi.string().required(),
        creator: Joi.string().required(),
    }),
};

const deleteTicketValidation = {
    params: Joi.object({
        ticketId: Joi.string().uuid().required().external(validateTicketExists),
    }),
};

const getTicketByIdValidation = {
    params: Joi.object({
        ticketId: Joi.string().uuid().required().external(validateTicketExists),
    }),
};

module.exports = {
    createTicketValidation,
    updateTicketStatusValidation,
    assignOrReassignTicketValidation,
    addTicketCommentValidation,
    deleteTicketValidation,
    getTicketByIdValidation,
};
