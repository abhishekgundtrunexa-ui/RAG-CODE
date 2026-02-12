const { DateTime } = require("luxon");
const { MoreThanOrEqual, Not, IsNull } = require("typeorm");
const {
  SupportTicketRepository,
  SupportTicketUpdatesRepository,
} = require("@shared-libs/db/mysql");
const { generateRandomCode } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { RefundAssignedToStatus } = require("@shared-libs/constants");

const formatDateString = (dateTime, timezone) => {
  if (timezone === "UTC") {
    return dateTime.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'+00:00'");
  }
  return dateTime.setZone(timezone).toISO({ includeOffset: true });
};

const addUpdateLog = async ({ supportTicketId, details, creator }) => {
  const ticket = await SupportTicketRepository.findOneBy({
    id: supportTicketId,
  });

  const nowUtc = DateTime.utc();
  const createdAt = nowUtc.toJSDate();
  const createdAtLocal = ticket?.timezone
    ? formatDateString(nowUtc, ticket.timezone)
    : null;

  return SupportTicketUpdatesRepository.save({
    supportTicketId,
    details,
    creator,
    createdAt,
    updatedAt: createdAt,
    createdAtLocal,
  });
};

const getTickets = async (req, res) => {
  try {
    let baseQuery = {};

    const { isPartner, isPartnerTeam } = req?.loggedInUserData;

    if (isPartner || isPartnerTeam) {
      const { partnerIds = [] } = req?.allowedIds;

      if (partnerIds.length == 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["createdBy"] = {
        custom: true,
        value: `in("${partnerIds.join('", "')}")`,
      };
    }

    const listParams = {
      entityName: "SupportTicket",
      baseQuery,
      req,
    };
    const ticketResponse = await HandleMySqlList(listParams);
    return res.status(200).json(ticketResponse);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTicketById = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    const ticket = await SupportTicketRepository.findOneBy({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    let updates = await SupportTicketUpdatesRepository.find({
      where: { supportTicketId: ticketId },
    });
    updates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return res.status(200).json({ ...ticket, updates });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const createTicket = async (req, res) => {
  try {
    const data = req.body;

    const loggedInUserData = req.loggedInUserData;

    const { userId, user, isPartner, isPartnerTeam } = loggedInUserData;

    const nowUtc = DateTime.utc();

    data.ticketId = `TKT-${generateRandomCode(6).toUpperCase()}`;

    data.createdAt = nowUtc.toJSDate();
    data.updatedAt = nowUtc.toJSDate();
    data.createdAtLocal = data.timezone
      ? formatDateString(nowUtc, data.timezone)
      : null;
    data.updatedAtLocal = data.timezone
      ? formatDateString(nowUtc, data.timezone)
      : null;
    data.respondedAt = null;
    data.respondedAtLocal = null;
    data.createdBy = userId;
    data.customerName = user.fullName;
    data.customerEmail = user.email;
    data.customerPhoneNumber = user.phoneNumber;
    if (isPartner || isPartnerTeam) {
      data.assignedTo = RefundAssignedToStatus.SUPPORT;
    }

    const newTicket = await SupportTicketRepository.save(data);

    await addUpdateLog({
      supportTicketId: newTicket.id,
      details: "Ticket created by Customer",
      creator: "System",
    });

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const { status, responseMessage } = req.body;
    const ticket = await SupportTicketRepository.findOneBy({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    const nowUtc = DateTime.utc();
    const updatedFields = {
      ticketStatus: status,
      updatedAt: nowUtc.toJSDate(),
      updatedAtLocal: ticket.timezone
        ? formatDateString(nowUtc, ticket.timezone)
        : null,
    };

    if (["In Progress", "Resolved", "Closed"].includes(status)) {
      if (ticket.respondedAt != null) {
        updatedFields.respondedAt = nowUtc.toJSDate();
        updatedFields.respondedAtLocal = ticket.timezone
          ? formatDateString(nowUtc, ticket.timezone)
          : null;
      }
    }
    await SupportTicketRepository.update(ticketId, updatedFields);
    let logMessage = `Status updated to ${status}`;
    if (responseMessage) {
      logMessage += ` - ${responseMessage}`;
    }
    await addUpdateLog({
      supportTicketId: ticketId,
      details: logMessage,
      creator: ticket.assignedTo,
    });

    const updatedTicket = await SupportTicketRepository.findOneBy({
      id: ticketId,
    });
    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const assignOrReassignTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const { assignedTo } = req.body;

    const ticket = await SupportTicketRepository.findOneBy({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const nowUtc = DateTime.utc();

    const updatedFields = {
      assignedTo,
      updatedAt: nowUtc.toJSDate(),
      updatedAtLocal: ticket.timezone
        ? formatDateString(nowUtc, ticket.timezone)
        : null,
    };

    await SupportTicketRepository.update(ticketId, updatedFields);

    await addUpdateLog({
      supportTicketId: ticketId,
      details: `Ticket assigned to ${assignedTo}`,
      creator: ticket.assignedTo,
    });

    const updatedTicket = await SupportTicketRepository.findOneBy({
      id: ticketId,
    });

    return res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error reassigning ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const addTicketComment = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    const { details } = req.body;
    const ticket = await SupportTicketRepository.findOne({
      where: { id: ticketId },
    });

    const newComment = await SupportTicketUpdatesRepository.save({
      supportTicketId: ticketId,
      details,
      creator: ticket.assignedTo,
      createdAt: DateTime.utc().toJSDate(),
      updatedAt: DateTime.utc().toJSDate(),
      createdAtLocal: null,
    });

    return res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding ticket comment:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getDashboardOverview = async (req, res) => {
  try {
    const totalTickets = await SupportTicketRepository.count();
    const openTickets = await SupportTicketRepository.count({
      where: { ticketStatus: "Open" },
    });
    const inProgressTickets = await SupportTicketRepository.count({
      where: { ticketStatus: "In Progress" },
    });
    const resolvedTickets = await SupportTicketRepository.count({
      where: { ticketStatus: "Resolved" },
    });
    const closedTickets = await SupportTicketRepository.count({
      where: { ticketStatus: "Closed" },
    });

    let avgResponseTime = "0h";
    try {
      const ticketsWithResponse = await SupportTicketRepository.find({
        where: {
          respondedAt: Not(IsNull()),
          createdAt: Not(IsNull()),
        },
        select: ["createdAt", "respondedAt"],
      });

      if (ticketsWithResponse && ticketsWithResponse.length > 0) {
        let totalResponseTimeMs = 0;
        let validTickets = 0;

        ticketsWithResponse.forEach((ticket, idx) => {
          if (ticket.createdAt && ticket.respondedAt) {
            const createdTime = new Date(ticket.createdAt).getTime();
            const respondedTime = new Date(ticket.respondedAt).getTime();

            if (
              !isNaN(createdTime) &&
              !isNaN(respondedTime) &&
              respondedTime > createdTime
            ) {
              const responseTimeMs = respondedTime - createdTime;
              totalResponseTimeMs += responseTimeMs;
              validTickets++;
            }
          }
        });
        if (validTickets > 0) {
          const avgResponseTimeMs = totalResponseTimeMs / validTickets;
          const avgResponseHours = avgResponseTimeMs / (1000 * 60 * 60);

          if (avgResponseHours < 1) {
            const avgResponseMinutes = Math.round(
              avgResponseTimeMs / (1000 * 60)
            );
            avgResponseTime =
              avgResponseMinutes === 0 ? "< 1m" : `${avgResponseMinutes}m`;
          } else if (avgResponseHours < 24) {
            avgResponseTime = `${avgResponseHours.toFixed(1)}h`;
          } else {
            const avgResponseDays = (avgResponseHours / 24).toFixed(1);
            avgResponseTime = `${avgResponseDays}d`;
          }
        }
      }
    } catch (responseError) {
      console.error("Error calculating average response time:", responseError);
    }

    let newAssignments = 0;
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      newAssignments = await SupportTicketRepository.count({
        where: {
          createdAt: MoreThanOrEqual(startOfToday),
          ticketStatus: "Open",
        },
      });
    } catch (assignmentError) {
      console.error("Error calculating new assignments:", assignmentError);
    }
    return res.status(200).json({
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      avgResponseTime,
      newAssignments,
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const ticket = await SupportTicketRepository.findOneBy({ id: ticketId });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }
    await SupportTicketRepository.remove(ticket);
    await SupportTicketUpdatesRepository.delete({ supportTicketId: ticketId });
    return res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  getTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  assignOrReassignTicket,
  addTicketComment,
  getDashboardOverview,
  deleteTicket,
};
