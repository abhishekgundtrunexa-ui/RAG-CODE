const { DateTime } = require("luxon");
const {
  OcppTransactionsRepository,
  CustomerPaymentCardRepository,
  ChargerLanguageRepository,
  ChargerViewRepository,
  ChargerBookingsRepository,
} = require("@shared-libs/db/mysql");
const {
  ChargerStatuses,
  ChargingStatuses,
  OcppEvents,
} = require("@shared-libs/constants");
const {
  getChargerByIdentity,
  getRemoteStartIdTag,
  sendOcppEvent,
  getOcppTransaction,
  getConfigConstants,
  generateRandomOtp,
} = require("@shared-libs/helpers");
const { checkCardTokenExpiry } = require("@shared-libs/paynex-world");
const { MockTransactionQueue } = require("@shared-libs/queues");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const ALLOW_EXTERNAL_OCPP = process.env.ALLOW_EXTERNAL_OCPP === "true";

const startRemoteChargingSession = async (params) => {
  const {
    chargeBoxId,
    connectorId = 1,
    customerId = null,
    startMethod = "Mobile App",
    transactionStatus = "remote-started",
    maxAmount = 0,
    cardUid = null,
    sendRemoteEvent = true,
    isTesting = false,
  } = params;

  const charger = await getChargerByIdentity(chargeBoxId);
  let clientId = chargeBoxId;

  let isExternal = false;
  if (!ALLOW_EXTERNAL_OCPP) {
    if (!charger) {
      return { code: 400, data: { message: `Charger not found.` } };
    }
  } else {
    isExternal = true;
  }

  if (charger && !isTesting) {
    if (charger.status == ChargerStatuses.INOPERATIVE) {
      return { code: 400, data: { message: `Charger is Inoperative.` } };
    }
    if (charger.status == ChargerStatuses.DISABLED) {
      return { code: 400, data: { message: `Charger is disabled.` } };
    }
    // if (charger.status == ChargerStatuses.BUSY) {
    //   return {
    //     code: 400,
    //     data: {
    //       message: `Charger is busy. Please wait until it becomes Available.`,
    //     },
    //   };
    // }
    if (charger.chargingStatus != ChargingStatuses.PREPARING) {
      if (charger.chargingStatus != ChargingStatuses.RESERVED) {
        return {
          code: 400,
          data: {
            message: `Gun is not connected. Please connect the gun & try again.`,
          },
        };
      }
    }
  }

  if (!isExternal) {
    clientId = charger.chargeBoxId;

    // check if charger connector is busy or not
    const lastTransaction = await OcppTransactionsRepository.find({
      where: {
        chargeBoxId: charger.chargeBoxId,
        connectorId,
        transactionStatus: "started",
      },
      order: { createdAt: "DESC" },
    });

    if (lastTransaction.length > 0) {
      return { code: 400, data: { message: `Charger is busy.` } };
    }
  }

  const checkPaymentCard = false;
  if (checkPaymentCard && customerId && !isTesting) {
    const customerPaymentCard = await CustomerPaymentCardRepository.findOne({
      where: { customerId, isDeleted: false, isDefault: true },
    });
    if (!customerPaymentCard) {
      return {
        code: 400,
        data: {
          message: `Please save a card before starting the charging session.`,
        },
      };
    }

    if (!customerPaymentCard?.paymentTokenId) {
      return {
        code: 400,
        data: {
          message: `Your default card is not valid. Please add another card.`,
        },
      };
    }

    const cardTokenExpiry = await checkCardTokenExpiry(
      customerPaymentCard?.paymentTokenId,
    );

    if (cardTokenExpiry?.isCardExpired == true) {
      return {
        code: 400,
        data: {
          message: `Your default card's payment token is expired. Please add another card.`,
        },
      };
    }
  }

  let idTag = cardUid ? cardUid : await getRemoteStartIdTag();

  // Check if this charger is already booked
  const alreadyBookedCharger = await ChargerBookingsRepository.findOne({
    where: {
      chargeBoxId: clientId,
      isFinished: false,
    },
  });

  if (alreadyBookedCharger) {
    // Check expiry
    let isExpired = true;

    const reservationValidityInMinutes = await getConfigConstants([
      "reservationValidityInMinutes",
    ]);

    const alreadyBookedChargerExpiry = DateTime.fromJSDate(
      alreadyBookedCharger.bookingTime,
    )
      .plus({ minutes: reservationValidityInMinutes })
      .toUTC();

    if (DateTime.utc() < alreadyBookedChargerExpiry) {
      isExpired = false;
    }

    if (!isExpired) {
      if (customerId && alreadyBookedCharger?.customerId == customerId) {
        customerHasReservation = true;
        idTag = alreadyBookedCharger?.idTag;
      } else {
        return {
          code: 400,
          data: {
            message: `It seems charger is reserved. Please wait for a while.`,
          },
        };
      }
    } else {
      await ChargerBookingsRepository.update(
        { id: alreadyBookedCharger?.id },
        { isFinished: true },
      );
    }
  }

  const chargerLanguage = await ChargerLanguageRepository.findOne({
    where: { chargeBoxId },
  });

  const chargerViewData = await ChargerViewRepository.findOne({
    where: { chargeBoxId },
  });
  const contractId = chargerViewData?.contractId ?? null;

  const ocppTransactionData = await getOcppTransaction({
    chargeBoxId,
    connectorId,
    hashedPan: idTag,
    charger,
    currency: charger?.currency ?? "USD",
    language: chargerLanguage?.language ?? "en",
    paymentProvider: "moneris",
    transactionStatus,
    customerId,
    startMethod,
    maxAmount,
    contractId,
  });
  await ChargerBookingsRepository.update(
    { idTag },
    {
      ocppTransactionId: ocppTransactionData?.transactionUuid,
    },
  );

  let isStartedForTesting = false;

  if (sendRemoteEvent) {
    const eventName = OcppEvents.RemoteStartTransaction;
    const ocppSchema = { connectorId, idTag };
    const response = await sendOcppEvent(clientId, eventName, ocppSchema);

    if (isTesting && response?.message?.message == "Client is not connected.") {
      isStartedForTesting = true;
    } else if (
      response?.message?.status &&
      response?.message?.status !== "Accepted"
    ) {
      await OcppTransactionsRepository.update(
        ocppTransactionData?.transactionUuid,
        { transactionStatus: "cancelled" },
      );
      return {
        code: 400,
        data: { message: `Cannot start charging. Please wait for a while.` },
      };
    }
  }

  if (isStartedForTesting) {
    await MockTransactionQueue.add(
      {
        ocppTransactionData,
        action: "Start",
      },
      { delay: 500 },
    );
  }

  return {
    code: 200,
    data: { message: "Remote Start Event Sent" },
    ocppTransactionData,
  };
};

const stopRemoteChargingSession = async (params) => {
  const {
    chargeBoxId,
    connectorId = 1,
    customerId = null,
    sendRemoteEvent = true,
    isTesting = false,
  } = params;

  const charger = await getChargerByIdentity(chargeBoxId);
  let clientId = chargeBoxId;

  if (!ALLOW_EXTERNAL_OCPP) {
    if (!charger) {
      return { code: 400, data: { message: `Charger not found.` } };
    }
  }

  if (charger && !isTesting) {
    if (charger.status == ChargerStatuses.INOPERATIVE) {
      return { code: 400, data: { message: `Charger is Inoperative.` } };
    }
    if (charger.status == ChargerStatuses.DISABLED) {
      return { code: 400, data: { message: `Charger is disabled.` } };
    }
  }

  const trxWhere = {
    chargeBoxId,
    connectorId,
    transactionStatus: "started",
  };
  if (customerId) {
    trxWhere["customerId"] = customerId;
  }

  const lastTransaction = await OcppTransactionsRepository.findOne({
    where: trxWhere,
    order: { createdAt: "DESC" },
  });

  const transactionId = lastTransaction?.chargerTransactionId ?? null;

  if (!transactionId) {
    return {
      code: 400,
      data: { message: `No active remote transaction found to stop.` },
    };
  }

  let isStoppedForTesting = false;
  if (sendRemoteEvent) {
    const eventName = OcppEvents.RemoteStopTransaction;
    const ocppSchema = { transactionId: Number(transactionId) };
    const response = await sendOcppEvent(clientId, eventName, ocppSchema);

    if (isTesting && response?.message?.message == "Client is not connected.") {
      isStoppedForTesting = true;
    } else if (
      response?.message?.status &&
      response?.message?.status !== "Accepted"
    ) {
      return {
        code: 400,
        data: { message: `Cannot stop charging. Please wait for a while.` },
      };
    }
  }

  if (isStoppedForTesting) {
    await MockTransactionQueue.add(
      {
        ocppTransactionData: lastTransaction,
        action: "Stop",
      },
      { delay: 500 },
    );
  }

  return {
    code: 200,
    data: { message: "Remote Stop Event Sent" },
    ocppTransactionData: lastTransaction,
  };
};

const reserveTheCharger = async (params) => {
  const {
    customerId,
    clientId,
    connectorId = 1,
    fromStation = false,
    isTesting = false,
  } = params;

  const charger = await getChargerByIdentity(clientId);

  let isExternal = false;
  if (!ALLOW_EXTERNAL_OCPP) {
    if (!charger) {
      return { code: 400, data: { message: `Charger not found.` } };
    }
  } else {
    isExternal = true;
  }

  if (charger && !isTesting) {
    if (charger.status == ChargerStatuses.INOPERATIVE) {
      return { code: 400, data: { message: `Charger is Inoperative.` } };
    }
    if (charger.status == ChargerStatuses.DISABLED) {
      return { code: 400, data: { message: `Charger is disabled.` } };
    }
  }

  if (!isExternal) {
    clientId = charger.chargeBoxId;

    // check if charger connector is busy or not
    const lastTransaction = await OcppTransactionsRepository.find({
      where: {
        chargeBoxId: charger.chargeBoxId,
        connectorId,
        transactionStatus: "started",
      },
      order: { createdAt: "DESC" },
    });

    if (lastTransaction.length > 0) {
      return { code: 400, data: { message: `Charger is busy.` } };
    }
  }

  const checkPaymentCard = false;
  if (checkPaymentCard && !isTesting) {
    const customerPaymentCard = await CustomerPaymentCardRepository.findOne({
      where: { customerId, isDeleted: false, isDefault: true },
    });
    if (!customerPaymentCard) {
      return {
        code: 400,
        data: {
          message: `Please save a card before starting the charging session.`,
        },
      };
    }

    if (!customerPaymentCard?.paymentTokenId) {
      return {
        code: 400,
        data: {
          message: `Your default card is not valid. Please add another card.`,
        },
      };
    }

    const cardTokenExpiry = await checkCardTokenExpiry(
      customerPaymentCard?.paymentTokenId,
    );

    if (cardTokenExpiry?.isCardExpired == true) {
      return {
        code: 400,
        data: {
          message: `Your default card's payment token is expired. Please add another card.`,
        },
      };
    }
  }

  const reservationValidityInMinutes = await getConfigConstants([
    "reservationValidityInMinutes",
  ]);

  // Check if customer has already booked this charger
  const existingChargerBooking = await ChargerBookingsRepository.findOne({
    where: {
      chargeBoxId: charger.chargeBoxId,
      isFinished: false,
      customerId,
    },
  });
  if (existingChargerBooking) {
    const existingChargerBookingExpiry = DateTime.fromJSDate(
      existingChargerBooking.bookingTime,
    )
      .plus({ minutes: reservationValidityInMinutes })
      .toUTC();

    if (DateTime.utc() > existingChargerBookingExpiry) {
      // Check if customer's booking is expired
      await ChargerBookingsRepository.update(
        { id: existingChargerBooking.id },
        { isFinished: true },
      );
    } else {
      return {
        code: 400,
        data: { message: `You have already reserved this charger.` },
      };
    }
  }

  // Check if this charger is already booked
  const alreadyBookedCharger = await ChargerBookingsRepository.findOne({
    where: {
      chargeBoxId: charger.chargeBoxId,
      isFinished: false,
    },
  });

  if (alreadyBookedCharger) {
    const alreadyBookedChargerExpiry = DateTime.fromJSDate(
      alreadyBookedCharger.bookingTime,
    )
      .plus({ minutes: reservationValidityInMinutes })
      .toUTC();

    if (DateTime.utc() > alreadyBookedChargerExpiry) {
      // Check if booking is expired
      await ChargerBookingsRepository.update(
        { id: alreadyBookedCharger.id },
        { isFinished: true },
      );
    } else {
      return {
        code: 400,
        data: { message: `It seems charger is already booked.` },
      };
    }
  }

  // Check if customer has already booking of another charger
  const otherChargerBooking = await ChargerBookingsRepository.findOne({
    where: { isFinished: false, customerId },
  });
  if (otherChargerBooking) {
    const otherChargerBookingExpiry = DateTime.fromJSDate(
      otherChargerBooking.bookingTime,
    )
      .plus({ minutes: reservationValidityInMinutes })
      .toUTC();

    if (DateTime.utc() > otherChargerBookingExpiry) {
      // Check if customer's booking is expired
      await ChargerBookingsRepository.update(
        { id: otherChargerBooking.id },
        { isFinished: true },
      );
    } else {
      return {
        code: 400,
        data: { message: `You have already a booking of another charger.` },
      };
    }
  }

  const idTag = await getRemoteStartIdTag();
  const bookingId = generateRandomOtp(6);
  const reservationExpiry = DateTime.utc()
    .plus({ minutes: Number(reservationValidityInMinutes ?? 15) })
    .toISO();
  const bookingTime = DateTime.utc().toISO();

  const savedBooking = await ChargerBookingsRepository.save({
    bookingId,
    customerId,
    chargerId: charger.id,
    chargeBoxId: clientId,
    evseStationId: charger.evseStationId,
    bookingTime,
    idTag,
    connectorId,
    isFinished: false,
  });

  const eventName = OcppEvents.ReserveNow;
  const ocppSchema = {
    connectorId,
    idTag,
    expiryDate: reservationExpiry,
    reservationId: bookingId,
  };
  const response = await sendOcppEvent(clientId, eventName, ocppSchema);

  let isReservedForTesting = false;
  if (isTesting && response?.message?.message == "Client is not connected.") {
    isReservedForTesting = true;
  } else if (
    response?.message?.status &&
    response?.message?.status !== "Accepted"
  ) {
    await ChargerBookingsRepository.update(
      { id: savedBooking?.id },
      { isFinished: true },
    );

    return {
      code: 400,
      data: { message: `Cannot reserve the charger. Please wait for a while.` },
    };
  }

  const returnData = response.message;
  if (fromStation) {
    returnData["connectorId"] = connectorId;
    returnData["bookingId"] = bookingId;
    returnData["bookingTime"] = bookingTime;
  }

  if (isReservedForTesting) {
    return { code: 200, data: "Charger is reserved." };
  }

  return { code: response.code, data: returnData };
};

module.exports = {
  startRemoteChargingSession,
  stopRemoteChargingSession,
  reserveTheCharger,
};
