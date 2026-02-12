const { HandleMySqlList, HandleMongoDBList } = require("@shared-libs/db");
const {
  ChargerRepository,
  EvseStationRepository,
  CpoRepository,
} = require("@shared-libs/db/mysql");
const { In, Like } = require("typeorm");
const { OcppAllLogModel } = require("@shared-libs/db/mongo-db");
const { ObjectDAO, arrayObjStr } = require("@shared-libs/helpers");

const getTransactionList = async (req, res) => {
  let baseQuery = { isDeleted: false };
  const { location, chargeBoxId } = req.query;
  const loggedInUserData = req["loggedInUserData"]["user"];

  const { isPartner, isPartnerTeam } = req?.loggedInUserData;
  if (isPartner || isPartnerTeam) {
    let { contractIds = [] } = req?.allowedIds;

    if (contractIds.length === 0) {
      return res.status(200).json({
        list: [],
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      });
    }

    baseQuery["contractId"] = {
      custom: true,
      value: `in("${contractIds.join('", "')}")`,
    };

    if (location || chargeBoxId) {
      if (location) {
        baseQuery["country"] = location;
      }
      if (chargeBoxId) {
        baseQuery["chargeBoxId"] = chargeBoxId;
      }
    }
  } else {
    if (loggedInUserData?.cpoId) {
      let allowedChargeBoxIds = [];
      const evseStations = await EvseStationRepository.find({
        where: {
          cpoId: loggedInUserData.cpoId,
          isDeleted: false,
          ...(location && { state: Like(`%${location}%`) }),
        },
        select: ["id"],
      });

      const evseStationIds = evseStations.map(({ id }) => id);
      const tmpWhere = [];
      if (evseStationIds.length > 0) {
        tmpWhere.push({ evseStationId: In(evseStationIds) });
      } else {
        tmpWhere.push({
          cpoId: loggedInUserData.cpoId,
          isDeleted: false,
          evseStationId: In([]),
        });
      }

      if (chargeBoxId) {
        tmpWhere.push({
          cpoId: loggedInUserData.cpoId,
          isDeleted: false,
          chargeBoxId,
        });
      }

      const loggedInUserChargers = await ChargerRepository.find({
        where: tmpWhere,
        select: ["chargeBoxId"],
      });

      allowedChargeBoxIds = loggedInUserChargers.map(
        ({ chargeBoxId }) => chargeBoxId
      );

      if (allowedChargeBoxIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["chargeBoxId"] = {
        custom: true,
        value: `in("${allowedChargeBoxIds.join('", "')}")`,
      };
    }
    if (loggedInUserData?.eMspId) {
      let allowedChargeBoxIds = [];
      const evseStations = await EvseStationRepository.find({
        where: { isDeleted: false, ...(location && { country: location }) },
        select: ["id"],
      });

      const evseStationIds = evseStations.map(({ id }) => id);
      const tmpWhere = [];
      if (evseStationIds.length > 0) {
        tmpWhere.push({ isDeleted: false, evseStationId: In(evseStationIds) });
      } else {
        tmpWhere.push({ isDeleted: false, evseStationId: In([]) });
      }

      if (chargeBoxId) {
        tmpWhere.push({
          isDeleted: false,
          chargeBoxId,
        });
      }

      const loggedInUserChargers = await ChargerRepository.find({
        where: tmpWhere,
        select: ["chargeBoxId"],
      });

      allowedChargeBoxIds = loggedInUserChargers.map(
        ({ chargeBoxId }) => chargeBoxId
      );

      if (allowedChargeBoxIds.length === 0) {
        return res.status(200).json({
          list: [],
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
        });
      }

      baseQuery["chargeBoxId"] = {
        custom: true,
        value: `in("${allowedChargeBoxIds.join('", "')}")`,
      };
    }
  }

  const listParams = {
    entityName: "OcppTransactions",
    baseQuery,
    req,
  };
  const chargerListResponse = await HandleMySqlList(listParams);
  if (chargerListResponse.list && chargerListResponse.list.length > 0) {
    const cpoIds = chargerListResponse.list.map(({ cpoId }) => cpoId);
    const evseStationIds = chargerListResponse.list.map(
      ({ evseStationId }) => evseStationId
    );
    const evseStations = await EvseStationRepository.find({
      where: { id: In(evseStationIds) },
      select: ["name", "id"],
    });
    const cpoData = await CpoRepository.find({
      where: { id: In(cpoIds) },
    });

    const cpoIdData = arrayObjStr(cpoData, "id", "name");
    const evseStationIdData = arrayObjStr(evseStations, "id", "name");

    const newList = chargerListResponse.list.map((transaction) => {
      const { startTime, endTime } = transaction;
      let sessionTime = null;

      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (!isNaN(start) && !isNaN(end)) {
          const diffMs = end - start;
          const totalSeconds = Math.floor(diffMs / 1000);

          const hours = String(Math.floor(totalSeconds / 3600)).padStart(
            2,
            "0"
          );
          const minutes = String(
            Math.floor((totalSeconds % 3600) / 60)
          ).padStart(2, "0");
          const seconds = String(totalSeconds % 60).padStart(2, "0");
          sessionTime = `${hours}:${minutes}:${seconds}`;
        }
      }
      transaction["sessionTime"] = sessionTime;
      transaction["cpoName"] = cpoIdData[transaction.cpoId] ?? "-";
      transaction["evseStationName"] =
        evseStationIdData[transaction.evseStationId] ?? "-";

      transaction["endMethod"] = transaction?.endMethod ?? "-";
      transaction["remark"] = transaction?.remark ?? "-";
      transaction["paymentProvider"] = transaction?.paymentProvider ?? "-";
      transaction["paymentType"] = transaction?.paymentType ?? "-";

      return ObjectDAO(transaction);
    });

    chargerListResponse.list = newList;
  }

  res.status(200).json(chargerListResponse);
};

const getStatusList = async (req, res) => {
  // const response = await OcppTransactionsRepository.createQueryBuilder(
  //   "transaction"
  // )
  //   .select("DISTINCT transaction.paymentStatus", "paymentStatus")
  //   .getRawMany();
  // const statuses = response.map((sts) => {
  //   if (sts.paymentStatus == "Accepted") {
  //     return "Completed";
  //   } else if (sts.paymentStatus == "pending") {
  //     return "In progress";
  //   } else {
  //     return "Failed";
  //   }
  // });

  const statuses = ["Completed", "In Progress", "Failed"];
  res.status(200).json({ status: statuses });
};

const getTransactionById = async (transactionId, req, res) => {
  let baseQuery = { isDeleted: false, transactionUuid: transactionId };

  const loggedInUserData = req["loggedInUserData"]["user"];
  if (loggedInUserData?.cpoId) {
    let allowedChargeBoxIds = [];
    const evseStations = await EvseStationRepository.find({
      where: { cpoId: loggedInUserData.cpoId, isDeleted: false },
      select: ["id"],
    });

    const evseStationIds = evseStations.map(({ id }) => id);
    const tmpWhere = [];
    if (evseStationIds.length > 0) {
      tmpWhere.push({ evseStationId: In(evseStationIds), isDeleted: false });
    }
    tmpWhere.push({ cpoId: loggedInUserData.cpoId, isDeleted: false });

    const loggedInUserChargers = await ChargerRepository.find({
      where: tmpWhere,
      select: ["chargeBoxId"],
    });

    allowedChargeBoxIds = loggedInUserChargers.map(
      ({ chargeBoxId }) => chargeBoxId
    );

    if (allowedChargeBoxIds.length === 0) {
      return res.status(404).json({ message: "Transaction Not Found." });
    }

    baseQuery["chargeBoxId"] = {
      custom: true,
      value: `in("${allowedChargeBoxIds.join('", "')}")`,
    };
  }

  const listParams = {
    entityName: "OcppTransactions",
    baseQuery,
    req,
  };

  const chargerListResponse = await HandleMySqlList(listParams);

  if (chargerListResponse.list[0]) {
    res.status(200).json(ObjectDAO(chargerListResponse.list[0]));
  } else {
    res.status(404).json({ message: "Transaction Not Found." });
  }
};

const getTransactionSessionList = async (transactionId, req, res) => {
  let baseQuery = { isDeleted: false, transactionUuid: transactionId };

  const loggedInUserData = req["loggedInUserData"]["user"];
  if (loggedInUserData?.cpoId) {
    let allowedChargeBoxIds = [];
    const evseStations = await EvseStationRepository.find({
      where: { cpoId: loggedInUserData.cpoId, isDeleted: false },
      select: ["id"],
    });

    const evseStationIds = evseStations.map(({ id }) => id);
    const tmpWhere = [];
    if (evseStationIds.length > 0) {
      tmpWhere.push({ evseStationId: In(evseStationIds), isDeleted: false });
    }
    tmpWhere.push({ cpoId: loggedInUserData.cpoId, isDeleted: false });

    const loggedInUserChargers = await ChargerRepository.find({
      where: tmpWhere,
      select: ["chargeBoxId"],
    });

    allowedChargeBoxIds = loggedInUserChargers.map(
      ({ chargeBoxId }) => chargeBoxId
    );

    if (allowedChargeBoxIds.length === 0) {
      return res.status(404).json({ message: "Transaction Not Found." });
    }

    baseQuery["chargeBoxId"] = {
      custom: true,
      value: `in("${allowedChargeBoxIds.join('", "')}")`,
    };
  }

  const listParams = {
    entityName: "OcppTransactions",
    baseQuery,
    req,
  };

  const chargerListResponse = await HandleMySqlList(listParams);

  if (chargerListResponse.list[0]) {
    if (!req.query.limit) {
      req.query.page = 1;
      req.query.limit = -1;
    }
    const listParams = {
      model: OcppAllLogModel,
      baseQuery: { transactionUuid: transactionId },
      req,
    };
    const sessionListResponse = await HandleMongoDBList(listParams);
    if (sessionListResponse.list && sessionListResponse.list.length > 0) {
      const newList = sessionListResponse.list.map((session) => {
        return ObjectDAO(session);
      });
      sessionListResponse.list = newList;
    }
    res.status(200).json(sessionListResponse);
  } else {
    res.status(404).json({ message: "Transaction Not Found." });
  }
};

const getTransactionSessionListByCharger = async (chargeBoxId, req, res) => {
  let baseQuery = { isDeleted: false };

  const loggedInUserData = req["loggedInUserData"]["user"];

  const { isPartner, isPartnerTeam } = req?.loggedInUserData;
  if (isPartner || isPartnerTeam) {
    let { chargeBoxIds = [], contractIds = [] } = req?.allowedIds;

    if (contractIds.length === 0) {
      return res.status(200).json({
        list: [],
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      });
    }

    baseQuery["contractId"] = {
      custom: true,
      value: `in("${contractIds.join('", "')}")`,
    };

    if (!chargeBoxIds.includes(chargeBoxId)) {
      return res.status(200).json({
        list: [],
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
      });
    }

    baseQuery["chargeBoxId"] = chargeBoxId;
  } else if (loggedInUserData?.cpoId) {
    let allowedChargeBoxIds = [];
    const evseStations = await EvseStationRepository.find({
      where: { cpoId: loggedInUserData.cpoId, isDeleted: false },
      select: ["id"],
    });

    const evseStationIds = evseStations.map(({ id }) => id);
    const tmpWhere = [];
    if (evseStationIds.length > 0) {
      tmpWhere.push({
        evseStationId: In(evseStationIds),
        chargeBoxId,
        isDeleted: false,
      });
    }
    tmpWhere.push({
      cpoId: loggedInUserData.cpoId,
      chargeBoxId,
      isDeleted: false,
    });

    const loggedInUserChargers = await ChargerRepository.find({
      where: tmpWhere,
      select: ["chargeBoxId"],
    });

    allowedChargeBoxIds = loggedInUserChargers.map(
      ({ chargeBoxId }) => chargeBoxId
    );

    if (allowedChargeBoxIds.length === 0) {
      return res.status(404).json({ message: "Transaction Not Found." });
    }

    baseQuery["chargeBoxId"] = {
      custom: true,
      value: `in("${allowedChargeBoxIds.join('", "')}")`,
    };
  } else {
    baseQuery["chargeBoxId"] = chargeBoxId;
  }

  const listParams = {
    entityName: "OcppTransactions",
    baseQuery,
    req,
  };

  const chargerListResponse = await HandleMySqlList(listParams);

  if (chargerListResponse.list[0]) {
    const transactionUuids = chargerListResponse.list.map(
      ({ transactionUuid }) => transactionUuid
    );

    if (!req.query.limit) {
      req.query.page = 1;
      req.query.limit = -1;
    }
    const listParams = {
      model: OcppAllLogModel,
      baseQuery: { transactionUuid: { $in: transactionUuids } },
      req,
    };

    const sessionListResponse = await HandleMongoDBList(listParams);
    if (sessionListResponse.list && sessionListResponse.list.length > 0) {
      const newList = sessionListResponse.list.map((session) => {
        return ObjectDAO(session);
      });
      sessionListResponse.list = newList;
    }
    res.status(200).json(sessionListResponse);
  } else {
    res.status(404).json({ message: "Transaction Not Found." });
  }
};

module.exports = {
  getTransactionList,
  getTransactionById,
  getTransactionSessionList,
  getTransactionSessionListByCharger,
  getStatusList,
};
