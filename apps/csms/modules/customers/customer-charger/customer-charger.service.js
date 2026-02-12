const {
  getIpData,
  getConfigConstants,
  getChargerByIdentity,
  sendOcppEvent,
  convertDateTimezone,
  getChargerDetailsData,
  decodeBase64,
  encodeBase64,
} = require("@shared-libs/helpers");
const {
  sendReservationWebhook,
  sendPaymentStatusWebhook,
  sendRefundWebhook,
} = require("@shared-libs/whatsapp-webhook");
const axios = require("axios");
const expressUseragent = require("express-useragent");
const {
  ChargerRepository,
  ChargerConnectorTypeRepository,
  OcppTransactionsRepository,
  EvseStationRepository,
  ChargerBookingsRepository,
  ChargerExperienceFeedbackRepository,
  CustomersRepository,
  ChargingInvoiceRepository,
} = require("@shared-libs/db/mysql");
const {
  ChargerStatuses,
  ChargingStatuses,
  OcppEvents,
} = require("@shared-libs/constants");
const { HandleMySqlList } = require("@shared-libs/db");
const {
  startRemoteChargingSession,
  stopRemoteChargingSession,
  reserveTheCharger,
} = require("@shared-libs/charging-session-helper");
const {
  DiscoverChargerLogModel,
  AuropayWebhookModel,
} = require("@shared-libs/db/mongo-db");
const { In } = require("typeorm");
const { DateTime } = require("luxon");
const { checkCardTokenExpiry } = require("@shared-libs/paynex-world");
const {
  auropayCreatePaymentLink,
  auropayGenerateReferenceNo,
  hitAuropayApi,
  getAuropayTransactionTmp,
  giveAuropayTransactionRefundTmp,
} = require("@shared-libs/paynex");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const getChargerDetails = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({ message: `Customer is not logged-in.` });
  }

  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  let chargeBoxId = req?.params?.chargeBoxId;
  const c = await getChargerByIdentity(chargeBoxId);
  if (!c) {
    return res.status(400).json({ message: `Charger not found.` });
  }

  delete c?.uniqueId;
  delete c?.activationDate;
  delete c?.validTill;
  delete c?.activationCode;
  delete c?.activationExpiresAt;
  delete c?.activationRequestedAt;
  delete c?.deviceAdminPassCode;
  delete c?.lastHeartbeat;
  delete c?.isStickerPrinted;
  delete c?.stickerPrintedAt;
  delete c?.stickerPrintedBy;
  delete c?.isDeleted;
  delete c?.connectorTypeId;
  delete c?.chargeUsageTypeId;
  delete c?.cpoId;

  c["evseStation"] = {
    id: c.evseStationId,
    name: c.evseStationName,
    address: c.evseStationAddress,
    city: c.evseStationCity,
    lat: c.evseStationLat,
    lng: c.evseStationLng,
    rating: c.rating,
  };

  delete c?.registeredBy;
  delete c?.updatedBy;
  delete c?.updatedAt;
  delete c?.registeredByUserId;
  delete c?.registeredByUserFirstName;
  delete c?.registeredByUserLastName;

  const charger = c;

  if (isTesting) {
    charger["status"] = ChargerStatuses.AVAILABLE;
    charger["chargingStatus"] = ChargingStatuses.PREPARING;
  }

  return res.status(200).json(charger);
};

const remoteStartTransaction = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({ message: `Customer is not logged-in.` });
  }

  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  const chargeBoxId = req?.params?.chargeBoxId;
  const connectorId = 1;

  console.log("ONE")
  const transactionRes = await startRemoteChargingSession({
    chargeBoxId,
    connectorId,
    customerId,
    isTesting,
  });

  return res.status(transactionRes.code).json(transactionRes.data);
};

const remoteStopTransaction = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({
      message: `Customer is not logged-in.`,
    });
  }

  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  const chargeBoxId = req?.params?.chargeBoxId;
  const connectorId = 1;

  const transactionRes = await stopRemoteChargingSession({
    chargeBoxId,
    connectorId,
    customerId,
    isTesting,
  });

  return res.status(transactionRes.code).json(transactionRes.data);
};

const reserveNow = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;
  if (!customerId) {
    return res.status(400).json({ message: `Customer is not logged-in.` });
  }

  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  const clientId = req?.params?.chargeBoxId;
  const connectorId = 1;

  const response = await reserveTheCharger({
    customerId,
    clientId,
    connectorId,
    isTesting,
  });

  return res.status(response.code).json(response.data);
};

const reserveByStation = async (req, res) => {
  const loggedInUser = req.loggedInUserData;
  const customerId = loggedInUser?.customer?.id;
  const evseStationId = req?.params?.evseStationId;

  if (!customerId) {
    return res.status(400).json({ message: `Customer is not logged-in.` });
  }
  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  const chargerWhere = { evseStationId };
  if (!isTesting) {
    chargerWhere["status"] = ChargerStatuses.AVAILABLE;
    chargerWhere["chargingStatus"] = ChargingStatuses.AVAILABLE;
  }

  const chargers = await ChargerRepository.find({
    where: chargerWhere,
  });

  if (chargers.length == 0) {
    return res.status(400).json({ message: `No available charger found.` });
  }

  let resCode = 400;
  let resData = { message: `No available charger found.` };
  let chargerId = null;
  let clientId = null;
  let bookingId = null;
  let bookingTime = null;
  const connectorId = 1;

  for (const c of chargers) {
    if (resCode !== 200) {
      try {
        clientId = c?.chargeBoxId;
        const response = await reserveTheCharger({
          customerId,
          clientId,
          connectorId,
          fromStation: true,
          isTesting,
        });

        resCode = response?.code;
        resData = response?.data;

        chargerId = c?.id;
        bookingId = response?.bookingId;
        bookingTime = response?.bookingTime;
      } catch (error) {}
    }
  }

  if (resCode == 200 && loggedInUser?.customer?.mobile) {
    const stationData = await EvseStationRepository.findOne({
      where: { id: evseStationId },
      select: ["address"],
    });

    let webHookData = {
      mobileNumber:
        loggedInUser.customer?.mobile || loggedInUser.customer?.email,
      chargeBoxId: clientId,
      bookingId,
      bookingTime,
      evseStationAddress: stationData.address,
    };

    try {
      await sendReservationWebhook(webHookData);
    } catch (e) {
      console.log("Error while calling whatsApp Reservation Webhook", e);
    }

    const responseData = {
      bookingId,
      bookingTime,
      connectorId,
      chargeBoxId: clientId,
      evseStationId,
    };

    return res
      .status(resCode)
      .json({ success: true, data: responseData, ...resData });
  } else {
    return res.status(resCode).json(resData);
  }
};

const cancelReservation = async (req, res) => {
  const loggedInUser = req.loggedInUserData;

  const customerId = loggedInUser?.customer?.id;

  if (!customerId) {
    return res.status(400).json({ message: `Customer is not logged-in.` });
  }
  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  const chargeBoxId = req?.params?.chargeBoxId;
  const reservation = await ChargerBookingsRepository.findOne({
    where: { chargeBoxId, customerId, isFinished: false },
  });

  if (!reservation) {
    return res.status(400).json({
      message: `No active reservation found to cancel.`,
    });
  }

  const eventName = OcppEvents.CancelReservation;
  const ocppSchema = { reservationId: reservation.bookingId };
  const response = await sendOcppEvent(
    req.params?.chargeBoxId,
    eventName,
    ocppSchema,
  );

  if (response?.message?.status !== "Accepted" && !isTesting) {
    return res.status(400).json({
      message: `Cannot cancel the reservation. Please wait for a while.`,
    });
  }

  await ChargerBookingsRepository.update(
    { id: reservation.id },
    { isFinished: true },
  );

  return res
    .status(response.code)
    .json({ success: true, message: "Reservation cancelled successfully." });
};

const chargingExperienceFeedback = async (req, res) => {
  try {
    const {
      connectorId = 1,
      rating,
      review = "",
      feedbackMessages = [],
    } = req.body;
    const chargeBoxId = req.params.chargeBoxId;

    const chargerData = await ChargerRepository.findOne({
      where: { chargeBoxId },
    });

    if (!chargerData) {
      return res.status(404).json({ error: "Charger Not Found" });
    }

    const transaction = await OcppTransactionsRepository.findOne({
      where: {
        chargeBoxId,
        connectorId,
        endTime: Not(IsNull()),
      },
      order: {
        endTime: "DESC",
      },
    });

    if (!transaction) {
      return res.status(400).json({ error: "Charging Already In Progress" });
    }

    const createdAtLocal = convertDateTimezone(
      DateTime.utc(),
      transaction?.timezone ?? "UTC",
    );

    let chargingExperienceFeedback =
      await ChargerExperienceFeedbackRepository.save({
        chargeBoxId,
        transactionUuid: transaction?.transactionUuid,
        timezone: transaction?.timezone,
        country: transaction?.country,
        createdAtLocal,
        rating,
        review,
        cpoId: chargerData["cpoId"],
        evseStationId: chargerData["evseStationId"],
        feedbackMessages: feedbackMessages ?? [],
      });

    const feedbacks = await ChargerExperienceFeedbackRepository.find({
      where: { chargeBoxId, isDeleted: false },
    });

    const validFeedbacks = feedbacks.filter((f) => Number(f.rating) > 0);
    let chargerAverageRating = 0;

    if (validFeedbacks.length > 0) {
      const total = validFeedbacks.reduce(
        (sum, f) => sum + Number(f.rating),
        0,
      );
      chargerAverageRating = total / validFeedbacks.length;
    }

    await ChargerRepository.update(
      { chargeBoxId },
      { rating: chargerAverageRating },
    );

    const evseStationId = chargerData.evseStationId;

    if (evseStationId) {
      const stationChargers = await ChargerRepository.find({
        where: { evseStationId: evseStationId },
      });

      const currentChargerIndex = stationChargers.findIndex(
        (c) => c.chargeBoxId === chargeBoxId,
      );
      if (currentChargerIndex !== -1) {
        stationChargers[currentChargerIndex].rating = chargerAverageRating;
      }

      const validStationChargers = stationChargers.filter(
        (c) => Number(c.rating) > 0,
      );
      let stationAverageRating = 0;

      if (validStationChargers.length > 0) {
        const total = validStationChargers.reduce(
          (sum, c) => sum + Number(c.rating),
          0,
        );
        stationAverageRating = total / validStationChargers.length;
      }

      await EvseStationRepository.update(
        { id: evseStationId },
        { rating: stationAverageRating },
      );
    }

    return res.status(200).json(chargingExperienceFeedback);
  } catch (error) {
    console.error("Error:", error.message);
    return res
      .status(500)
      .json({ error: "Error Saving Charging Experience Feedback" });
  }
};

const getPayableAmount = async (req, res) => {
  try {
    const loggedInUser = req.loggedInUserData;

    const {
      id: customerId = null,
      fullName: customerName = null,
      email: customerEmail = null,
      mobile: customerMobile = null,
    } = loggedInUser?.customer;

    let firstName = "John";
    let lastName = "Doe";
    try {
      if (customerName) {
        const [fn = "-", ln = "-"] = customerName.split(" ");
        firstName = fn ?? firstName;
        lastName = ln ?? lastName;
      }
    } catch (error) {}

    if (!customerId) {
      return res.status(400).json({ message: `Customer is not logged-in.` });
    }

    const chargeBoxId = req.params.chargeBoxId;

    const {
      enteredValue, // Amount to pay
    } = req.query;

    if (!chargeBoxId || !enteredValue) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: chargeBoxId and enteredValue are required",
      });
    }

    const basicCharger = await getChargerByIdentity(chargeBoxId);
    if (!basicCharger) {
      return res.status(404).json({
        success: false,
        message: "Charger not found",
      });
    }

    const charger = await getChargerDetailsData(basicCharger.id);

    if (!charger) {
      return res.status(404).json({
        success: false,
        message: "Charger details not found",
      });
    }

    const amount = parseFloat(enteredValue);
    const currency =
      charger.baseRate?.currencyCodeAlpha || charger.currency || "INR";

    const tokenData = encodeBase64({
      src: "wa",
      cid: customerId,
      ph: customerMobile,
      amt: amount,
    });

    const paymentLinkData = await auropayCreatePaymentLink({
      amount,
      currency,
      firstName,
      lastName,
      email: customerEmail || "chargnex@chargnex.com",
      phone: customerMobile || "9999999999",
      callbackUrl: `${process.env.CORE_API_BASEURL || "http://localhost:3001"}/app/charger/${chargeBoxId}/payment-status-update/${tokenData}`,
      title: auropayGenerateReferenceNo(),
      shortDescription: `Payment for EV charging at ${charger.evseStation?.name || "charging station"}`,
      paymentDescription: `Charger: ${chargeBoxId}, Amount: ${currency} ${amount}`,
      invoiceNumber: auropayGenerateReferenceNo(),
    });

    return res.status(200).json({
      success: true,
      message: "Payment link created successfully",
      data: {
        chargeBoxId,
        amount,
        currency,
        payment_link: paymentLinkData?.shortUrl || paymentLinkData?.paymentLink,
        paymentLinkId: paymentLinkData?.paymentLinkId,
        referenceNo: paymentLinkData?.referenceNo,
        expiresOn: paymentLinkData?.expireOn,
        chargerName: charger.deviceName || charger.chargeBoxId,
        stationName: charger.evseStation?.name,
      },
    });
  } catch (error) {
    console.error("Error creating payment link:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating payment link",
      error: error.message,
    });
  }
};

const paymentStatusUpdate = async (req, res) => {
  try {
    const chargeBoxId = req.params.chargeBoxId;
    const token = req.params.token;

    try {
      const payload = req?.query ?? {};
      const tokenData = decodeBase64(token);

      await AuropayWebhookModel.create({
        data: {
          eventName: "WA-REDIRECT",
          chargeBoxId,
          token,
          tokenData,
          payload,
        },
      });

      let webHookData = {
        mobileNumber: tokenData?.ph ?? null,
        amount: tokenData?.amt ?? 0,
        chargeBoxId,
        transactionId: payload?.id ?? null,
        transactionDateTime: DateTime.utc().toISO(),
        paymentStatus: "Fail",
        sessionId: null,
      };

      if (payload?.id) {
        let giveRefund = false;

        const transactionId = payload?.id;
        const auropayRes = await hitAuropayApi({
          method: "GET",
          endpoint: `payments/${transactionId}`,
        });
        // const auropayRes = await getAuropayTransactionTmp(transactionId);
        if (auropayRes?.code == 200 && auropayRes?.data) {
          const transactionData = auropayRes?.data;

          // Sending Webhook to WhatsApp
          const mobileNumber = transactionData?.billingContact?.phone;
          const transactionDate = transactionData?.transactionDate;

          webHookData["mobileNumber"] = mobileNumber;
          webHookData["transactionId"] = transactionId;
          webHookData["transactionDateTime"] = transactionDate;
          webHookData["paymentStatus"] =
            transactionData?.transactionStatus == 2 ? "Success" : "Fail";

          try {
            await sendPaymentStatusWebhook(webHookData);
          } catch (e) {
            console.log(
              "Error while calling whatsApp Payment Status Webhook",
              e,
            );
          }

          // 2: Success
          if (transactionData?.transactionStatus == 2) {
            const customerId = tokenData?.cid;

            const customer = await CustomersRepository.findOne({
              where: { id: customerId },
            });

            const isTesting = customer?.isTesting ?? false;

            const amount = transactionData?.tenderInfo?.amount;

            console.log("TWO")
            const transactionRes = await startRemoteChargingSession({
              chargeBoxId,
              customerId,
              startMethod: "WhatsApp",
              maxAmount: amount,
              isTesting,
            });

            if (transactionRes?.code != 200) {
              giveRefund = true;
            } else {
              const createdAtLocal = convertDateTimezone(
                DateTime.utc(),
                transactionRes?.ocppTransactionData?.timezone ?? "UTC",
              );
              await ChargingInvoiceRepository.save({
                transactionId:
                  transactionRes?.ocppTransactionData?.transactionUuid,
                timezone: transactionRes?.ocppTransactionData?.timezone,
                country: transactionRes?.ocppTransactionData?.country,
                createdAtLocal,
                auropayTransactionId: transactionId,
              });
            }
          }
        } else {
          giveRefund = true;
        }

        if (giveRefund) {
          const refundParam = {
            method: "POST",
            endpoint: `refunds`,
            body: {
              orderId: transactionId,
              userType: 1,
              amount: parseFloat(webHookData["amount"]),
              remarks: "Charging session could not be started",
            },
          };

          await hitAuropayApi(refundParam);
          // await giveAuropayTransactionRefundTmp(
          //   refundParam.body,
          // );

          // Sending Refund Webhook to WhatsApp
          webHookData = {
            phone: webHookData["mobileNumber"],
            amount: webHookData["amount"],
            reason: "Charging session could not be started",
          };

          try {
            await sendRefundWebhook(webHookData);
          } catch (e) {
            console.log("Error while calling whatsApp Refund Webhook", e);
          }
        }
      }
      
    } catch (error) {}
  } catch (error) {
    console.error("Error creating payment link:", error);
    // return res.status(500).json({
    //   success: false,
    //   message: "Error creating payment link",
    //   error: error.message,
    // });
  }

  const waURL = await getConfigConstants(["whatsappUrl"]);

  // const waURL = process.env.WA_URL || "https://wa.me/919156701229";
  return res.redirect(waURL);
};

const getNearbyChargers = async (req, res) => {
  const geoLocation = await getIpData(req);

  let userAgent = req.headers["user-agent"];
  let userAgentResponse = expressUseragent.parse(userAgent);

  const country = geoLocation?.country ?? "";
  const state = geoLocation?.region ?? "";
  const city = geoLocation?.city ?? "";
  const timezone = geoLocation?.timezone ?? "";
  const lat1 = geoLocation?.lat ?? "";
  const lng1 = geoLocation?.lng ?? "";

  const { platform, browser, version, os } = userAgentResponse;

  const responseObj = {
    country,
    city,
    state,
    lat: lat1,
    lng: lng1,
    platform: platform[0] || "Unknown",
    browser: browser,
    agent: userAgent,
    timezone,
    browserversion: version,
    os: os,
  };
  const loggedInUser = req.loggedInUserData;
  const isTesting = loggedInUser?.customer?.isTesting ?? false;

  let {
    lat = geoLocation?.ll?.latitude,
    lng = geoLocation?.ll?.longitude,
    distance = 0,
    viewType = "map",
    showOnlyAvailable = false,
    connectorTypes,
    pincode,
    pinecode,
  } = req.query;

  const postalCode = pincode || pinecode;

  if (postalCode && !isTesting) {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${postalCode}&key=${apiKey}`;
      const response = await axios.get(geocodeUrl);
      if (
        response?.data?.status === "OK" &&
        response?.data?.results?.length > 0
      ) {
        const location = response.data.results[0].geometry.location;
        lat = location.lat;
        lng = location.lng;
        showOnlyAvailable = true;
      } else {
        return res.status(400).json({ error: "Invalid pincode." });
      }
    } catch (error) {
      console.error("Error fetching coordinates for pincode:", error);
    }
  }

  let ctIds = [];
  if (connectorTypes && !isTesting) {
    if (typeof connectorTypes == "string") {
      connectorTypes = [connectorTypes];
    }

    const ctData = await ChargerConnectorTypeRepository.find({
      where: { displayText: In(connectorTypes) },
    });

    ctIds = ctData.map(({ id }) => id);
  }

  if (!isTesting) {
    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude And Longitude Are Required." });
    }
  }

  const latCenter = parseFloat(lat);
  const lngCenter = parseFloat(lng);
  const maxDistance =
    distance > 0
      ? distance
      : await getConfigConstants(["maxDistanceForNearByChargers"]);

  try {
    // const qb = ChargerRepository.createQueryBuilder("Charger")
    //   .select([
    //     "Charger.*",
    //     "(6371 * acos(cos(radians(:latCenter)) * cos(radians(Charger.lat)) * cos(radians(Charger.lng) - radians(:lngCenter)) + sin(radians(:latCenter)) * sin(radians(Charger.lat)))) AS distance",
    //   ])
    //   .having("distance < :radius")
    //   .orderBy("distance")
    //   .setParameters({
    //     latCenter,
    //     lngCenter,
    //     radius: Number(maxDistance),
    //   });

    // const chargers = await qb.getRawMany();

    // if (chargers.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ error: "No Chargers Found Within The Specified Radius." });
    // }

    const chargerWhere = {
      isDeleted: false,
      ...(showOnlyAvailable ? { status: ChargerStatuses.AVAILABLE } : {}),
    };

    if (!isTesting) {
      const qb = EvseStationRepository.createQueryBuilder("EvseStation")
        .select([
          //         "Charger.*",
          // "(6371 * acos(cos(radians(:latCenter)) * cos(radians(Charger.lat)) * cos(radians(Charger.lng) - radians(:lngCenter)) + sin(radians(:latCenter)) * sin(radians(Charger.lat)))) AS distance",
          "EvseStation.*",
          "(6371 * acos(cos(radians(:latCenter)) * cos(radians(EvseStation.lat)) * cos(radians(EvseStation.lng) - radians(:lngCenter)) + sin(radians(:latCenter)) * sin(radians(EvseStation.lat)))) AS distance",
        ])
        .having("distance < :radius")
        .orderBy("distance")
        .setParameters({
          latCenter,
          lngCenter,
          radius: Number(maxDistance),
        });

      const stations = await qb.getRawMany();

      if (stations.length === 0) {
        return res
          .status(404)
          .json({ error: "No Chargers Found Within The Specified Radius." });
      }

      const stationIds = stations.map((s) => s.id);
      chargerWhere["evseStationId"] = In(stationIds);
    }

    const chargers = await ChargerRepository.find({
      where: chargerWhere,
      select: ["serialNumber"],
    });

    if (chargers.length === 0) {
      return res
        .status(404)
        .json({ error: "No Chargers Found Within The Specified Radius." });
    }

    if (!req.query.limit && viewType === "map") {
      req.query.page = 1;
      req.query.limit = -1;
    }

    const serialNumbers = chargers.map(({ serialNumber }) => serialNumber);
    const baseQuery = {
      isDeleted: false,
      serialNumber: {
        custom: true,
        value: `in("${serialNumbers.join('", "')}")`,
      },
    };

    if (showOnlyAvailable == true) {
      baseQuery["status"] = ChargerStatuses.AVAILABLE;
    }
    // if (viewType === "list") {
    //   baseQuery["status"] = ChargerStatuses.AVAILABLE;
    // }
    const listParams = {
      entityName: "ChargerView",
      baseQuery,
      req,
    };

    const chargerListResponse = await HandleMySqlList(listParams);

    let returnData = chargerListResponse;
    if (chargerListResponse.list.length > 0) {
      const tempList = [];
      await Promise.all(
        chargerListResponse.list.map((c) => {
          delete c?.uniqueId;
          delete c?.activationDate;
          delete c?.validTill;
          delete c?.activationCode;
          delete c?.activationExpiresAt;
          delete c?.activationRequestedAt;
          delete c?.deviceAdminPassCode;
          delete c?.lastHeartbeat;
          delete c?.isStickerPrinted;
          delete c?.stickerPrintedAt;
          delete c?.stickerPrintedBy;
          delete c?.isDeleted;
          delete c?.connectorTypeId;
          delete c?.chargeUsageTypeId;
          delete c?.cpoId;

          c["evseStation"] = {
            id: c.evseStationId,
            name: c.evseStationName,
            address: c.evseStationAddress,
            city: c.evseStationCity,
            lat: c.evseStationLat,
            lng: c.evseStationLng,
            rating: c.rating,
          };

          if (viewType !== "map") {
            delete c?.evseStationId;
            delete c?.evseStationName;
            delete c?.evseStationAddress;
            delete c?.evseStationCity;
            delete c?.evseStationLat;
            delete c?.evseStationLng;
          }

          delete c?.registeredBy;
          delete c?.updatedBy;
          delete c?.updatedAt;
          delete c?.registeredByUserId;
          delete c?.registeredByUserFirstName;
          delete c?.registeredByUserLastName;

          tempList.push(c);
        }),
      );

      chargerListResponse.list = tempList;

      // ==================================

      if (viewType === "map") {
        const evseData = {};

        await Promise.all(
          chargerListResponse.list.map((c) => {
            const chargerEvseStationId = c.evseStationId;

            evseData[chargerEvseStationId] = evseData[chargerEvseStationId] ?? {
              // cpoId: c.cpoId,
              id: chargerEvseStationId,
              name: c.evseStationName,
              address: c.evseStationAddress,
              city: c.evseStationCity,
              lat: c.evseStationLat,
              lng: c.evseStationLng,
              rating: c.rating,
              usageType: "Public",
              amenities: [],
              photos: [],
              video: "",
              counts: {
                all: 0,
                offline: 0,
                busy: 0,
                available: 0,
              },
              chargers: [],
              // chargers: {
              //   all: [],
              //   offline: [],
              //   busy: [],
              //   available: [],
              // },
            };

            delete c?.evseStationId;
            delete c?.evseStationName;
            delete c?.evseStationAddress;
            delete c?.evseStationCity;
            delete c?.evseStationLat;
            delete c?.evseStationLng;

            evseData[chargerEvseStationId].counts.all++;
            // evseData[chargerEvseStationId].chargers.all.push(c);

            let chargerStatus = "offline";
            if (c.status == ChargerStatuses.OFFLINE) {
              chargerStatus = "offline";
            } else if (
              c.status == ChargerStatuses.BUSY ||
              [
                ChargingStatuses.PREPARING,
                ChargingStatuses.CHARGING,
                ChargingStatuses.FINISHING,
                ChargingStatuses.SUSPENDED_EVSE,
              ].includes(c.chargingStatus)
            ) {
              chargerStatus = "busy";
            } else if (
              c.status == ChargerStatuses.AVAILABLE &&
              c.chargingStatus == ChargingStatuses.AVAILABLE
            ) {
              chargerStatus = "available";
            }

            evseData[chargerEvseStationId].counts[chargerStatus]++;
            // if (chargerStatus === "available") {
            evseData[chargerEvseStationId].chargers.push(c);
            // }
          }),
        );

        returnData = Object.values(evseData);
      }
    } else {
      if (viewType === "map") {
        returnData = [];
      }
    }

    await DiscoverChargerLogModel.create({
      ...responseObj,
      guestId:
        loggedInUser?.isGuest === true ? loggedInUser?.customer?.id : null,
      customerId:
        loggedInUser?.isGuest === false ? loggedInUser?.customer?.id : null,
      filters: req.query,
    });

    res.status(200).json(returnData);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "Error Fetching Nearby Chargers" });
  }
};

module.exports = {
  getNearbyChargers,
  remoteStartTransaction,
  remoteStopTransaction,
  reserveNow,
  reserveByStation,
  chargingExperienceFeedback,
  cancelReservation,
  getPayableAmount,
  getChargerDetails,
  paymentStatusUpdate,
};
