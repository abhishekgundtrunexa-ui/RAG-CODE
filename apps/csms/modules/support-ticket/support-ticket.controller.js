const supportTicketService = require("./support-ticket.service");

exports.getTickets = async (req, res) => {
  try {
    await supportTicketService.getTickets(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    await supportTicketService.getTicketById(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.createTicket = async (req, res) => {
  try {
    await supportTicketService.createTicket(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    await supportTicketService.updateTicketStatus(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.assignOrReassignTicket = async (req, res) => {
  try {
    await supportTicketService.assignOrReassignTicket(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.addTicketComment = async (req, res) => {
  try {
    await supportTicketService.addTicketComment(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getDashboardOverview = async (req, res) => {
  try {
    await supportTicketService.getDashboardOverview(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    await supportTicketService.deleteTicket(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
