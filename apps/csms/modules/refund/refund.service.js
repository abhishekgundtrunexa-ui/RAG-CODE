const { DateTime } = require("luxon");
const { In, Between, MoreThanOrEqual } = require("typeorm");
const {
  SupportTicketRepository,
  SupportTicketUpdatesRepository,
  OcppTransactionsRepository,
} = require("@shared-libs/db/mysql");
const { getIpData, generateRandomCode } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");
const { RefundStatus } = require("@shared-libs/constants");
const { CountryModel } = require("@shared-libs/db/mongo-db");

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

const createRefund = async (req, res) => {
  try {
    const data = req.body;

    // send 400 error when sessionId is already exists in the database
    const existingRefund = await SupportTicketRepository.findOne({
      where: { sessionId: data.sessionId },
    });
    if (existingRefund) {
      return res.status(400).json({
        success: false,
        message: "Duplicate sessionId for Dispute/Refund",
      });
    }

    // Get timezone from IP
    const geoLocation = await getIpData(req);
    const { timezone } = geoLocation;

    // Get original receipt from OCPP transaction
    const ocppTransaction = await OcppTransactionsRepository.findOne({
      where: [{ transactionUuid: data.sessionId }, { orderId: data.sessionId }],
    });

    const nowUtc = DateTime.utc();

    // Prepare refund data
    const refundData = {
      ...data,
      ticketId: `TKT-${generateRandomCode(6).toUpperCase()}`,
      priority: "Medium",
      assignedTo: "Finance",
      ticketStatus: "Open",
      refundStatus: "Pending",
      isRefund: true,
      originalReceipt: ocppTransaction ? ocppTransaction.invoicePdfUrl : null,
      timezone,
      createdAt: nowUtc.toJSDate(),
      updatedAt: nowUtc.toJSDate(),
      respondedAt: nowUtc.toJSDate(), // For refunds, it will be same as createdAt
      createdAtLocal: timezone ? formatDateString(nowUtc, timezone) : null,
      updatedAtLocal: timezone ? formatDateString(nowUtc, timezone) : null,
      respondedAtLocal: timezone ? formatDateString(nowUtc, timezone) : null,
    };

    const newRefund = await SupportTicketRepository.save(refundData);

    // Add initial activity log
    await addUpdateLog({
      supportTicketId: newRefund.id,
      details: "Ticket created and assigned to Finance Team",
      creator: "System",
    });

    return res.status(201).json(newRefund);
  } catch (error) {
    console.error("Error creating refund:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getRefunds = async (req, res) => {
  try {
    try {
      if (req?.query?.filter) {
        const filters = req?.query?.filter.replace(
          "ticketStatus",
          "refundStatus"
        );
        req.query.filter = filters;
      }
    } catch (error) {}

    const listParams = {
      entityName: "SupportTicket",
      baseQuery: { isRefund: true },
      req,
    };

    const refundResponse = await HandleMySqlList(listParams);

    return res.status(200).json(refundResponse);
  } catch (error) {
    console.error("Error fetching refunds:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getRefundById = async (req, res) => {
  try {
    const refundId = req.params.refundId;

    const refund = await SupportTicketRepository.findOne({
      where: { id: refundId, isRefund: true },
    });

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    let updates = await SupportTicketUpdatesRepository.find({
      where: { supportTicketId: refundId },
    });
    updates.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.status(200).json({ ...refund, updates });
  } catch (error) {
    console.error("Error fetching refund details:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const addRefundComment = async (req, res) => {
  try {
    const refundId = req.params.refundId;
    const { comment } = req.body;

    const refund = await SupportTicketRepository.findOne({
      where: { id: refundId, isRefund: true },
    });

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    await addUpdateLog({
      supportTicketId: refundId,
      details: comment,
      creator: refund.assignedTo,
    });

    return res.status(201).json({ message: "Comment added successfully" });
  } catch (error) {
    console.error("Error adding refund comment:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateRefundStatus = async (req, res) => {
  try {
    const refundId = req.params.refundId;
    const { status } = req.body;

    const refund = await SupportTicketRepository.findOne({
      where: { id: refundId, isRefund: true },
    });

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    const nowUtc = DateTime.utc();
    const updatedFields = {
      refundStatus: status,
      updatedAt: nowUtc.toJSDate(),
      updatedAtLocal: refund.timezone
        ? formatDateString(nowUtc, refund.timezone)
        : null,
    };

    // Update ticketStatus to "In Progress" if it's "Open"
    if (refund.ticketStatus === "Open") {
      updatedFields.ticketStatus = "In Progress";
    }

    await SupportTicketRepository.update(refundId, updatedFields);

    // Add activity log
    await addUpdateLog({
      supportTicketId: refundId,
      details: `Refund status updated to ${status}`,
      creator: refund.assignedTo,
    });

    const updatedRefund = await SupportTicketRepository.findOneBy({
      id: refundId,
    });
    return res.status(200).json(updatedRefund);
  } catch (error) {
    console.error("Error updating refund status:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const reassignRefund = async (req, res) => {
  try {
    const refundId = req.params.refundId;
    const { assignTo } = req.body;

    const refund = await SupportTicketRepository.findOne({
      where: { id: refundId, isRefund: true },
    });

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    const oldAssignedTo = refund.assignedTo;
    const nowUtc = DateTime.utc();

    const updatedFields = {
      assignedTo: assignTo,
      updatedAt: nowUtc.toJSDate(),
      updatedAtLocal: refund.timezone
        ? formatDateString(nowUtc, refund.timezone)
        : null,
    };

    await SupportTicketRepository.update(refundId, updatedFields);

    // Add activity log with old assignedTo value
    await addUpdateLog({
      supportTicketId: refundId,
      details: `Refund reassigned from ${oldAssignedTo} to ${assignTo}`,
      creator: oldAssignedTo,
    });

    const updatedRefund = await SupportTicketRepository.findOneBy({
      id: refundId,
    });
    return res.status(200).json(updatedRefund);
  } catch (error) {
    console.error("Error reassigning refund:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const processRefund = async (req, res) => {
  try {
    const refundId = req.params.refundId;
    const { refundAmount } = req.body;

    const refund = await SupportTicketRepository.findOne({
      where: { id: refundId, isRefund: true },
    });

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    const nowUtc = DateTime.utc();

    const updatedFields = {
      refundAmount,
      refundStatus: "Completed",
      updatedAt: nowUtc.toJSDate(),
      updatedAtLocal: refund.timezone
        ? formatDateString(nowUtc, refund.timezone)
        : null,
    };

    await SupportTicketRepository.update(refundId, updatedFields);
    const countryData = await CountryModel.findOne({ isoCode: refund?.country }).lean();
    // Add activity log
    await addUpdateLog({
      supportTicketId: refundId,
      details: `Refund processed for amount ${countryData?.currencySymbol || "$"}${refundAmount}. Refund status updated to Completed`,
      creator: refund.assignedTo,
    });

    const updatedRefund = await SupportTicketRepository.findOneBy({
      id: refundId,
    });
    return res.status(200).json(updatedRefund);
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * Get refund overview statistics with filtering support
 * Returns: Total Tickets, Pending, Rejected, Refunds, Refund Amount
 */
const getRefundOverview = async (req, res) => {
  try {
    const { rangeRaw, location: country } = req.analyticsFilters;

    // Build base query for refunds
    let baseQuery = {
      isRefund: true,
    };

    // Apply date range filter
    if (rangeRaw?.start && rangeRaw?.end) {
      baseQuery.createdAt = Between(rangeRaw?.start, rangeRaw?.end);
    }

    if (country) {
      baseQuery.country = country;
    }

    const [totalTickets, pendingCount, rejectedCount, refundsCount] =
      await Promise.all([
        SupportTicketRepository.count({
          where: baseQuery,
        }),
        SupportTicketRepository.count({
          where: {
            ...baseQuery,
            refundStatus: In([RefundStatus.PENDING, RefundStatus.IN_REVIEW]),
          },
        }),
        SupportTicketRepository.count({
          where: {
            ...baseQuery,
            refundStatus: "Rejected",
          },
        }),
        SupportTicketRepository.count({
          where: {
            ...baseQuery,
            refundStatus: "Completed",
          },
        }),
      ]);

    // 5. Refund Amount Total (sum of refundAmount where refundStatus = "Completed")
    const refundAmountResult = await SupportTicketRepository.createQueryBuilder(
      "supportTicket"
    )
      .select("SUM(supportTicket.refundAmount)", "totalAmount")
      .where("supportTicket.isRefund = :isRefund", { isRefund: true })
      .andWhere("supportTicket.refundStatus = :status", {
        status: "Completed",
      });

    if (rangeRaw?.start && rangeRaw?.end) {
      refundAmountResult.andWhere(
        "supportTicket.createdAt BETWEEN :start AND :end",
        {
          start: rangeRaw?.start,
          end: rangeRaw?.end,
        }
      );
    }

    if (country) {
      refundAmountResult.andWhere("supportTicket.country = :country", {
        country: country,
      });
    }

    const refundAmountData = await refundAmountResult.getRawOne();
    const refundAmount = parseFloat(refundAmountData?.totalAmount) || 0;

    // =============================

    let newAssignments = 0;
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const where = {
        isRefund: true,
        createdAt: MoreThanOrEqual(startOfToday),
        refundStatus: RefundStatus.PENDING,
      };

      if (country) {
        where.country = country;
      }

      newAssignments = await SupportTicketRepository.count({
        where,
      });
    } catch (assignmentError) {
      console.error("Error calculating new assignments:", assignmentError);
    }

    const response = {
      totalTickets: {
        value: totalTickets,
        label: "Total Tickets",
      },
      pending: {
        value: pendingCount,
        label: "Pending",
      },
      rejected: {
        value: rejectedCount,
        label: "Rejected",
      },
      refunds: {
        value: refundsCount,
        label: "Refunds",
      },
      refundAmount: {
        value: refundAmount,
        label: "Refund Amount",
      },
      newAssignments,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error getting refund overview:", error);
    res
      .status(500)
      .json({ message: "Failed to get refund overview", error: error.message });
  }
};

module.exports = {
  createRefund,
  getRefunds,
  getRefundById,
  addRefundComment,
  updateRefundStatus,
  reassignRefund,
  processRefund,
  getRefundOverview,
};
