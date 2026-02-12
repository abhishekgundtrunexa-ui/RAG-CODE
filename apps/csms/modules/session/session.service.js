const { SessionModel, SessionView } = require("@shared-libs/db/mongo-db");
const { DateTime } = require("luxon");
const { customErrorMsg, customSuccessMsg } = require("@shared-libs/constants");
const { HandleMongoDBList } = require("@shared-libs/db");
const {
  ChargerRepository,
  EvseStationRepository,
} = require("@shared-libs/db/mysql");
const { ObjectDAO } = require("@shared-libs/helpers");

const addSession = async (payload, req, res) => {
  const { chargerId, evseStationId } = payload;

  const charger = await ChargerRepository.findOne({ where: { id: chargerId } });
  if (!charger) {
    return res
      .status(404)
      .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
  }

  const station = await EvseStationRepository.findOne({
    where: { id: evseStationId },
  });
  if (!station) {
    return res
      .status(404)
      .send({ message: customErrorMsg.station.EVSE_STATION_NOT_FOUND });
  }

  const createSessionPayload = {
    ...payload,
  };

  const createdSession = await SessionModel.create(createSessionPayload);
  res.status(201).json(createdSession);
};

const getSessionById = async (sessionId, req, res) => {
  const session = await SessionModel.findById(sessionId).lean();
  if (!session) {
    return res
      .status(404)
      .json({ message: customErrorMsg.session.SESSION_NOT_FOUND });
  }
  res.status(200).json(ObjectDAO(session));
};

const updateSession = async (sessionId, payload, req, res) => {
  const { inTime, outTime } = payload;

  const session = await SessionModel.findById(sessionId);
  if (!session) {
    return res
      .status(404)
      .send({ message: customErrorMsg.session.SESSION_NOT_FOUND });
  }

  const updateSessionPayload = {
    ...payload,
  };

  if (inTime && outTime) {
    const durationInMin = calculateSessionDuration(inTime, outTime);
    updateSessionPayload["durationInMin"] = durationInMin;
  }

  const updatedSession = await SessionModel.findByIdAndUpdate(
    sessionId,
    {
      ...updateSessionPayload,
    },
    {
      new: true,
    }
  );
  res.status(200).json(updatedSession);
};

const getSessionList = async (chargerId, req, res) => {
  const charger = await ChargerRepository.findOne({ where: { id: chargerId } });
  if (!charger) {
    return res
      .status(404)
      .send({ message: customErrorMsg.charger.CHARGER_NOT_FOUND });
  }

  const listParams = {
    model: SessionView,
    baseQuery: {
      chargerId,
    },
    req,
  };
  const sessionListResponse = await HandleMongoDBList(listParams);
  if (sessionListResponse.list && sessionListResponse.list.length > 0) {
    const newList = sessionListResponse.list.map((session) => {
      return ObjectDAO(newList);
    });
    sessionListResponse.list = newList;
  }
  res.status(200).json(sessionListResponse);
};

const deleteSession = async (sessionId, req, res) => {
  const session = await SessionModel.findById(sessionId);
  if (!session) {
    return res
      .status(404)
      .json({ message: customErrorMsg.session.SESSION_NOT_FOUND });
  }
  await SessionModel.findByIdAndDelete(sessionId);
  res.status(200).json({
    message: customSuccessMsg.session.SESSION_DELETED_SUCCESS,
  });
};

const calculateSessionDuration = (inTime, outTime) => {
  const inTimeDateTime = DateTime.fromFormat(inTime, "HH:mm");
  const outTimeDateTime = DateTime.fromFormat(outTime, "HH:mm");
  const durationInMin = outTimeDateTime.diff(inTimeDateTime, "minutes").minutes;
  return durationInMin;
};

module.exports = {
  addSession,
  getSessionById,
  updateSession,
  getSessionList,
  deleteSession,
};
