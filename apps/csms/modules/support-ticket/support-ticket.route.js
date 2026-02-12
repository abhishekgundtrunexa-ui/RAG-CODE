const { Router } = require("express");
const router = Router();
const supportTicketController = require("./support-ticket.controller");
const { Authenticate, AuthenticatePartner } = require("../../middlewares/authenticate.middleware");
const {
  createTicketValidation,
  getTicketByIdValidation,
  updateTicketStatusValidation,
  assignOrReassignTicketValidation,
  addTicketCommentValidation,
  deleteTicketValidation,
} = require("./support-ticket.validation");
const { Validate } = require("../../middlewares/validate.middleware");

router.get("/", Authenticate, AuthenticatePartner, supportTicketController.getTickets);

router.get(
  "/:ticketId",
  Authenticate,
  AuthenticatePartner,
  Validate(getTicketByIdValidation),
  supportTicketController.getTicketById
);

router.post(
  "/",
  Authenticate,
  AuthenticatePartner,
  Validate(createTicketValidation),
  supportTicketController.createTicket
);

router.patch(
  "/:ticketId/status",
  Authenticate,
  Validate(updateTicketStatusValidation),
  supportTicketController.updateTicketStatus
);

router.patch(
  "/:ticketId/assignment",
  Authenticate,
  Validate(assignOrReassignTicketValidation),
  supportTicketController.assignOrReassignTicket
);

router.post(
  "/:ticketId/comments",
  Authenticate,
  Validate(addTicketCommentValidation),
  supportTicketController.addTicketComment
);

router.get(
  "/dashboard/overview",
  Authenticate,
  supportTicketController.getDashboardOverview
);

router.delete(
  "/:ticketId",
  Authenticate,
  Validate(deleteTicketValidation),
  supportTicketController.deleteTicket
);

module.exports = router;
