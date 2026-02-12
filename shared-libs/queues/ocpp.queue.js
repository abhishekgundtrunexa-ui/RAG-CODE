const {
  QueueNames,
  PusherConstants,
  OcppEvents,
} = require("@shared-libs/constants");
const {
  OcppTransactionsRepository,
  TestingConfigurationRepository,
  ContractPartnersRepository,
  ChargerRevenueRepository,
  PaymentTransactionsRepository,
  ChargerRepository,
  OtaUpdatesChargersRepository,
  OtaUpdatesRepository,
  CustomerPaymentCardRepository,
  ChargerBookingsRepository,
  ChargerLocalAuthorizationRepository,
  CustomersRepository,
  ChargingInvoiceRepository,
} = require("@shared-libs/db/mysql");
const { default: axios } = require("axios");
const {
  generateInvoice,
  generateTransactionInvoice,
} = require("@shared-libs/pdf");
const {
  getOcppTransactionCalculation,
  getChargingLookup,
  getChargerPaymentConfig,
  getChargerByIdentity,
  getConfigConstants,
  sendOcppEvent,
  getDefaultOcppResponse,
  deepClone,
  sendLocalAuthorizationListByChargeBoxId,
} = require("@shared-libs/helpers");
const { DateTime } = require("luxon");
const { sendDataToPusher } = require("@shared-libs/pusher");
const {
  OcppMeterValueLogModel,
  PreauthLogsModel,
  TransactionHistoryViewModel,
  PreauthCompleteLogsModel,
  PurchaseLogsModel,
  ChargerConfigurationModel,
} = require("@shared-libs/db/mongo-db");
const { CreateQueue } = require("./config");
const { getAnalyticsFromDate } = require("@shared-libs/analytics-helper");
const { captureFromCardToken } = require("@shared-libs/paynex-world");
const {
  changeConfigurationByChargeBoxId,
} = require("@shared-libs/helpers");
const {
  sendSessionCompleteWebhook,
  sendRefundWebhook,
} = require("@shared-libs/whatsapp-webhook");
const {
  giveAuropayTransactionRefundTmp,
  hitAuropayApi,
} = require("@shared-libs/paynex");

require("dotenv").config({ path: process.env.ENV_FILE || ".env" });

const SyncRevenueQueue = CreateQueue(
  QueueNames.SYNC_REVENUE_QUEUE,
  async (jobData) => {
    const { transactionUuid } = jobData;

    let isPaid = false;

    const preauthComplete = await PreauthCompleteLogsModel.findOne(
      {
        "response.transactionInfo.paymentStatus": "success",
        transactionId: transactionUuid,
      },
      ["transactionId"],
    );

    if (preauthComplete?.transactionId) {
      isPaid = true;
    } else {
      const purchase = await PurchaseLogsModel.findOne(
        {
          "response.transactionInfo.paymentStatus": "authorized",
          transactionId: transactionUuid,
        },
        ["transactionId"],
      );

      if (purchase?.transactionId) {
        isPaid = true;
      }
    }

    if (isPaid) {
      const ocppTransactionData = await OcppTransactionsRepository.findOne({
        where: { transactionUuid },
      });

      if (ocppTransactionData) {
        try {
          const tmpCharger = await ChargerRepository.findOne({
            where: { chargeBoxId: ocppTransactionData?.chargeBoxId },
          });

          const paymentTransactionData =
            await PaymentTransactionsRepository.findOne({
              where: { ocppTransactionId: transactionUuid },
            });

          const totalAmount = parseFloat(ocppTransactionData?.netAmount);
          const partnerAmounts = {
            cpoId: null,
            cpoSplitPercentage: null,
            cpoAmount: null,
            siteHostId: null,
            siteHostSplitPercentage: null,
            siteHostAmount: null,
            investorAmounts: [],
            investor1Id: null,
            investor1SplitPercentage: null,
            investor1Amount: null,
            investor2Id: null,
            investor2SplitPercentage: null,
            investor2Amount: null,
          };

          if (ocppTransactionData?.contractId) {
            const contractPartners = await ContractPartnersRepository.find({
              where: { contractId: ocppTransactionData?.contractId },
            });

            if (contractPartners.length > 0) {
              let calcAmounts = [];
              let sum = 0;

              // first calculate raw & rounded
              for (const cp of contractPartners) {
                const raw =
                  totalAmount * (parseFloat(cp.splitPercentage) / 100);
                const rounded = parseFloat(raw).toFixed(2);
                calcAmounts.push({ cp, raw, rounded });
                sum += rounded;
              }

              // fix rounding diff on last partner
              const diff = parseFloat(totalAmount - sum).toFixed(2);
              if (calcAmounts.length > 0) {
                calcAmounts[calcAmounts.length - 1].rounded = parseFloat(
                  calcAmounts[calcAmounts.length - 1].rounded + diff,
                ).toFixed(2);
              }

              // now assign
              for (const { cp, rounded } of calcAmounts) {
                if (cp.partnerType === "CPO") {
                  partnerAmounts.cpoId = cp.partnerId;
                  partnerAmounts.cpoSplitPercentage = cp.splitPercentage;
                  partnerAmounts.cpoAmount = rounded;
                } else if (cp.partnerType === "SITE HOST") {
                  partnerAmounts.siteHostId = cp.partnerId;
                  partnerAmounts.siteHostSplitPercentage = cp.splitPercentage;
                  partnerAmounts.siteHostAmount = rounded;
                } else if (cp.partnerType === "INVESTOR") {
                  if (!partnerAmounts.investor1Id) {
                    partnerAmounts.investor1Id = cp.partnerId;
                    partnerAmounts.investor1SplitPercentage =
                      cp.splitPercentage;
                    partnerAmounts.investor1Amount = rounded;
                  } else if (!partnerAmounts.investor2Id) {
                    partnerAmounts.investor2Id = cp.partnerId;
                    partnerAmounts.investor2SplitPercentage =
                      cp.splitPercentage;
                    partnerAmounts.investor2Amount = rounded;
                  }

                  partnerAmounts.investorAmounts.push({
                    partnerId: cp.partnerId,
                    amount: rounded,
                    splitPercentage: cp.splitPercentage,
                  });
                }
              }
            }
          }

          const insertChargerRevenue = {
            ocppTransactionId: transactionUuid,
            chargerId: tmpCharger?.id,
            orderId: ocppTransactionData?.orderId,
            evseStationId: ocppTransactionData?.evseStationId,
            chargeBoxId: ocppTransactionData?.chargeBoxId,
            paymentProvider: paymentTransactionData?.paymentProvider,
            timezone: paymentTransactionData?.timezone,
            country: paymentTransactionData?.country,
            dateTime: paymentTransactionData?.dateTime,
            dateTimeLocal: paymentTransactionData?.dateTimeLocal,
            amount: ocppTransactionData?.netAmount ?? 0,
            refundAmount: 0,
            totalAmount: ocppTransactionData?.netAmount ?? 0,
            taxAmount: ocppTransactionData?.tax ?? 0,
            effectiveEnergyConsumed:
              ocppTransactionData?.effectiveEnergyConsumed ?? 0,
            chargingDuration: ocppTransactionData?.chargingDuration ?? 0,
            avgChargingRate: ocppTransactionData?.avgChargingRate ?? 0,
            isTestTransaction: ocppTransactionData?.isTestTransaction,
            purchaseOnly: ocppTransactionData?.purchaseOnly,
            contractId: ocppTransactionData?.contractId,
            ...partnerAmounts,
            isSettled: false,
            currency: ocppTransactionData?.currency,
            currencyName: ocppTransactionData?.currencyName,
            currencySymbol: ocppTransactionData?.currencySymbol,
            createdAt: ocppTransactionData?.createdAt,
            createdAtLocal: ocppTransactionData?.createdAtLocal,
          };

          const chargerRevenueData = await ChargerRevenueRepository.findOne({
            where: {
              ocppTransactionId: transactionUuid,
            },
          });

          if (!chargerRevenueData) {
            await ChargerRevenueRepository.save(insertChargerRevenue);
          } else {
            await ChargerRevenueRepository.update(
              chargerRevenueData.id,
              insertChargerRevenue,
            );
          }

          const todayDate = DateTime.utc().toFormat("yyyy-MM-dd");
          await getAnalyticsFromDate(todayDate);

          const yesterdayDate = DateTime.utc()
            .minus({ day: 1 })
            .toFormat("yyyy-MM-dd");
          await getAnalyticsFromDate(yesterdayDate);
        } catch (error) {
          console.log("🚀 -----------------🚀");
          console.log("🚀 ~ SyncRevenueQueue error:", error);
          console.log("🚀 -----------------🚀");
        }
      }
    }
  },
);

const OcppRealtimeAmountQueue = CreateQueue(
  QueueNames.OCPP_REALTIME_AMOUNT_QUEUE,
  async (jobData) => {
    const { ocppTransactionId, clientId, meterValueId } = jobData;

    const extraData = { endTime: DateTime.utc({ zone: "UTC" }).toJSDate() };

    const { data } = await getOcppTransactionCalculation(
      ocppTransactionId,
      extraData,
    );

    if (data?.isPreauthReached == true) {
      await StopTransactionAndCaptureQueue.add(
        { ocppTransactionId },
        { delay: 500 },
      );
    }

    if (clientId != "2503170809000072") {
      const transactionData = await OcppTransactionsRepository.findOne({
        where: { transactionUuid: ocppTransactionId },
      });

      let sentMock = false;
      if (transactionData?.customerId) {
        try {
          const customer = await CustomersRepository.findOne({
            where: { id: transactionData?.customerId },
          });
          if (customer?.isTesting == true) {
            sentMock = true;

            await processMockOcppEvent(
              {
                clientId,
                eventName: OcppEvents.DataTransfer,
                params: {
                  vendorId: "chargnex",
                  messageId: "chargingAmount",
                  data: JSON.stringify({ meterValueId, ...data }),
                },
              },
              getDefaultOcppResponse(OcppEvents.DataTransfer),
            );
          }
        } catch (e) {}
      }

      if (!sentMock) {
        await sendOcppEvent(clientId, OcppEvents.DataTransfer, {
          vendorId: "chargnex",
          messageId: "chargingAmount",
          data: JSON.stringify({ meterValueId, ...data }),
        });
      }
    }
  },
);

const OcppAmountLookupQueue = CreateQueue(
  QueueNames.OCPP_AMOUNT_LOOKUP_QUEUE,
  async (jobData) => {
    const {
      ocppTransactionId,
      meterStop = null,
      clientId,
      paymentType,
    } = jobData;

    const testConfig = await TestingConfigurationRepository.findOne({
      where: { chargeBoxId: clientId },
      select: ["meterStop"],
    });
    if (testConfig) {
      meterStop = testConfig ? testConfig["meterStop"] : meterStop;
    }

    const { data } = await getChargingLookup(
      ocppTransactionId,
      meterStop,
      paymentType,
    );

    if (data?.isPreauthReached == true) {
      await StopTransactionAndCaptureQueue.add(
        { ocppTransactionId },
        { delay: 500 },
      );
    }

    if (clientId != "2503170809000072") {
      await sendOcppEvent(clientId, OcppEvents.DataTransfer, {
        vendorId: "chargnex",
        messageId: "chargingAmount",
        data: JSON.stringify({ meterValueId: "default", ...data }),
      });
    }
  },
);

const OcppStopTransactionQueue = CreateQueue(
  QueueNames.OCPP_STOP_TRANSACTION_QUEUE,
  async (jobData) => {
    let {
      transactionUuid,
      makePayment = false,
      remoteStop = false,
      isAutoCaptured = false,
    } = jobData;

    try {
      const transactionData = await OcppTransactionsRepository.findOne({
        where: { transactionUuid },
      });

      if (transactionData) {
        let generateInvoice = false;
        let sendInvoiceDataTransfer = false;

        let startMethod = "By Card";
        if (transactionData?.startMethod) {
          startMethod = transactionData?.startMethod;
        }

        const { code, data } =
          await getOcppTransactionCalculation(transactionUuid);
        if (code === 200) {
          let tmpUpdData = { endMethod: "By Card", remark: "Transaction END" };
          if (isAutoCaptured) {
            tmpUpdData = { endMethod: "Auto-Capture", remark: "Auto Captured" };
          } else if (makePayment) {
            tmpUpdData = {
              endMethod: "By EV/Charger",
              remark: "EV Disconnected",
            };
          }

          if (startMethod !== "By Card") {
            const stopMethods = {
              "Remote Start": "Remote Stop",
              "Mobile App": "Mobile App",
              WhatsApp: "WhatsApp",
              RFID: "RFID",
            };

            if (!makePayment) {
              tmpUpdData = {
                endMethod: stopMethods[startMethod] ?? "Remote Stop",
                remark: stopMethods[startMethod] ?? "Remote Stop",
              };
              if (startMethod == "WhatsApp" || startMethod == "Mobile App") {
                generateInvoice = true;
              }
            } else {
              generateInvoice = true;
            }

            await ChargerBookingsRepository.update(
              { ocppTransactionId: transactionData.transactionUuid },
              { isFinished: true },
            );

            makePayment = false;
            remoteStop = false;
            isAutoCaptured = false;

            tmpUpdData["transactionStatus"] = "finished";
            tmpUpdData["isPaid"] = true;
            tmpUpdData["paymentType"] = "Capture";
            tmpUpdData["paymentStatus"] = "Accepted";
          }

          await OcppTransactionsRepository.update(
            transactionData.transactionUuid,
            tmpUpdData,
          );

          if (makePayment) {
            const charger = await getChargerByIdentity(
              transactionData.chargeBoxId,
            );

            const { paymentProvider } = await getChargerPaymentConfig(
              charger.id,
            );

            let maskedPan = null;
            let cardType = null;
            try {
              const preAuthData = await PreauthLogsModel.findOne({
                transactionId: transactionUuid,
              }).lean();
              maskedPan = preAuthData?.request?.cardInfo?.maskedPan;
              cardType = preAuthData?.request?.cardInfo?.cardType;
            } catch (error) {}

            const paymentPayload = {
              $schema: "http://json-schema.org/draft-04/schema#",
              id: "cgx:pay:0.1:2025:1:preauth-complete",
              title: "preauth-complete",
              paymentProvider,
              cardInfo: {
                encryptedTrack2: "true",
                pan: transactionData?.hashedPan,
                maskedPan,
                cardType,
              },
              chargerInfo: {
                serialNumber: charger?.serialNumber,
                chargeboxId: charger?.chargeBoxId,
                connectorId: transactionData?.connectorId,
              },
              sessionInfo: {
                sessionId: transactionData?.transactionUuid,
                totalAmount: data?.netAmount,
                currency: transactionData?.currency,
              },
            };

            if (isAutoCaptured) {
              paymentPayload.sessionInfo["description"] = "Auto-Captured";
            }

            const paymentResponse = await axios.post(
              `${process.env.CORE_API_BASEURL}/payment/preauth-complete`,
              paymentPayload,
            );

            if (paymentResponse?.data) {
              if (
                paymentResponse?.data?.transactionInfo?.paymentStatus ===
                "success"
              ) {
                const paymentStatus = "Accepted";

                await OcppTransactionsRepository.update(
                  transactionData.transactionUuid,
                  { paymentStatus },
                );

                // const updatedTransaction = await OcppTransactionsRepository.findOne(
                //   { where: { transactionUuid: transactionData.transactionUuid } }
                // );

                await sendDataToPusher({
                  channelName: PusherConstants.channels.PUSHER_NODE_APP,
                  eventName:
                    PusherConstants.events.transaction.TRANSACTION_UPDATED,
                  data: { transactionUuid: transactionData.transactionUuid },
                });

                if (transactionData?.cpoId) {
                  await sendDataToPusher({
                    channelName: transactionData.cpoId,
                    eventName:
                      PusherConstants.events.transaction.TRANSACTION_UPDATED,
                    data: { transactionUuid: transactionData.transactionUuid },
                  });
                }

                if (paymentStatus === "Accepted") {
                  generateInvoice = true;
                  sendInvoiceDataTransfer = true;
                }
              }
            }
          } else {
            if (
              transactionData?.customerId &&
              transactionData?.startMethod == "Mobile App"
            ) {
              const makeCardPayment = false;
              if (makeCardPayment) {
                // making payment from customer's card
                try {
                  const customerPaymentCard =
                    await CustomerPaymentCardRepository.findOne({
                      where: {
                        customerId: transactionData?.customerId,
                        isDeleted: false,
                        isDefault: true,
                      },
                    });

                  await captureFromCardToken(
                    customerPaymentCard?.paymentTokenId,
                    {
                      paymentInfo: {
                        totalAmount: data?.netAmount,
                        langCode: transactionData?.language ?? "en",
                        currency: transactionData?.currency ?? "USD",
                      },
                      extraData: {
                        transactionUuid: transactionData.transactionUuid,
                        method: "PaidOnRemoteStop",
                      },
                    },
                  );
                } catch (error) {}
              }
            }

            if (transactionData.chargeBoxId != "2503170809000072") {
              let sentMock = false;
              if (transactionData?.customerId) {
                try {
                  const customer = await CustomersRepository.findOne({
                    where: { id: transactionData?.customerId },
                  });
                  if (customer?.isTesting == true) {
                    sentMock = true;

                    await processMockOcppEvent(
                      {
                        clientId,
                        eventName: OcppEvents.DataTransfer,
                        params: {
                          vendorId: "chargnex",
                          messageId: "chargingAmount",
                          data: JSON.stringify({
                            meterValueId: "default",
                            ...data,
                          }),
                        },
                      },
                      getDefaultOcppResponse(OcppEvents.DataTransfer),
                    );
                  }
                } catch (e) {}
              }

              if (!sentMock) {
                try {
                  await sendOcppEvent(
                    transactionData.chargeBoxId,
                    OcppEvents.DataTransfer,
                    {
                      vendorId: "chargnex",
                      messageId: "chargingAmount",
                      data: JSON.stringify({
                        meterValueId: "default",
                        ...data,
                      }),
                    },
                  );
                } catch (error) {}
              }
            }
          }

          if (remoteStop) {
            await sendOcppEvent(
              transactionData.chargeBoxId,
              OcppEvents.RemoteStopTransaction,
              { transactionId: Number(transactionData.chargerTransactionId) },
            );
          }

          if (generateInvoice) {
            await OcppGenerateInvoiceQueue.add(
              {
                transactionUuid: transactionData.transactionUuid,
                sendDataTransfer: sendInvoiceDataTransfer,
              },
              { delay: 500 },
            );
          }
        }
      }
    } catch (error) {
      console.log("🚀 -----------------🚀");
      console.log("🚀 ~ error:", error);
      console.log("🚀 -----------------🚀");
    }

    // Updating Charger Revenue.
    try {
      await SyncRevenueQueue.add({ transactionUuid }, { delay: 500 });
    } catch (error) {
      console.log("🚀 -----------------🚀");
      console.log("🚀 ~ REV error:", error);
      console.log("🚀 -----------------🚀");
    }
  },
);

const OcppGenerateInvoiceQueue = CreateQueue(
  QueueNames.OCPP_GENERATE_INVOICE_QUEUE,
  async (jobData) => {
    const { transactionUuid, sendDataTransfer = true } = jobData;

    const transactionData = await OcppTransactionsRepository.findOne({
      where: { transactionUuid },
    });

    if (transactionData) {
      try {
        const invoiceData = await generateInvoice(
          transactionData.transactionUuid,
        );

        // Sending Webhook to whatsapp
        if (
          transactionData?.startMethod == "WhatsApp" &&
          transactionData?.customerId
        ) {
          try {
            const customer = await CustomersRepository.findOne({
              where: { id: transactionData?.customerId },
            });

            const existingInvoice = await ChargingInvoiceRepository.findOne({
              where: { transactionId: transactionData?.transactionUuid },
            });

            const maxAmount = parseFloat(transactionData?.maxAmount ?? 0);
            const netAmount = parseFloat(transactionData?.netAmount ?? 0);
            const refundAmount = parseFloat(maxAmount - netAmount);

            if (refundAmount > 0) {
              const refundParam = {
                method: "POST",
                endpoint: `refunds`,
                body: {
                  orderId: existingInvoice?.auropayTransactionId,
                  userType: 1,
                  amount: parseFloat(refundAmount),
                  remarks: "Charging Session Completed",
                },
              };
              const auropayRefundRes = await hitAuropayApi(refundParam);
              // const auropayRefundRes = await giveAuropayTransactionRefundTmp(
              //   refundParam.body,
              // );

              // Sending Refund Webhook to WhatsApp
              try {
                await sendRefundWebhook({
                  phone: customer?.mobile,
                  amount: refundAmount,
                  reason: "Charging Session Completed",
                });
              } catch (e) {
                console.log(
                  "Error while calling whatsApp Refund Webhook On Complete",
                  e,
                );
              }
            }

            await sendSessionCompleteWebhook({
              mobileNumber: customer?.mobile,
              chargeBoxId: transactionData?.chargeBoxId,
              sessionId: transactionData?.transactionUuid,
              status: "finished",
              invoicePdfUrl: invoiceData.pdfUrl,
              refund: refundAmount > 0 ? refundAmount : null,
            });
          } catch (e) {
            console.log(
              "Error while calling whatsApp Session Complete Webhook",
              e,
            );
          }
        }

        if (sendDataTransfer) {
          if (transactionData.chargeBoxId != "2503170809000072") {
            const ocppSchema = {
              vendorId: "chargnex",
              messageId: "transactionInvoice",
              data: JSON.stringify({
                transactionId: transactionData.chargerTransactionId,
                connectorId: transactionData.connectorId,
                invoiceURL: invoiceData.pdfUrl,
                invoiceQRURL: invoiceData.qrCodeUrl,
                country: transactionData?.country,
                timezone: transactionData?.timezone,
                startTime: transactionData?.startTime,
                startTimeLocal: transactionData?.startTimeLocal,
                endTime: transactionData?.endTime,
                endTimeLocal: transactionData?.endTimeLocal,
              }),
            };

            await sendOcppEvent(
              transactionData.chargeBoxId,
              OcppEvents.DataTransfer,
              ocppSchema,
            );
          }
        }
      } catch (error) {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ transactionInvoice error:", error);
        console.log("🚀 -----------------🚀");
      }

      // Updating Charger Revenue.
      try {
        await SyncRevenueQueue.add({ transactionUuid }, { delay: 500 });
      } catch (error) {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ REV error:", error);
        console.log("🚀 -----------------🚀");
      }
    }
  },
);

const OcppCalculateAvgChargingRateQueue = CreateQueue(
  QueueNames.OCPP_CALCULATE_AVG_CHARGING_RATE_QUEUE,
  async (jobData) => {
    const { transactionUuid } = jobData;

    const transactionData = await OcppTransactionsRepository.findOne({
      where: { transactionUuid },
    });

    if (transactionData) {
      try {
        const meterValueData = await OcppMeterValueLogModel.aggregate([
          {
            $match: {
              transactionUuid,
              "ocppSchema.parsedMeterValue.voltageXCurrentImport": {
                $exists: true,
                $ne: null,
              },
            },
          },
          {
            $group: {
              _id: 0,
              total: {
                $sum: "$ocppSchema.parsedMeterValue.voltageXCurrentImport",
              },
              count: { $sum: 1 },
            },
          },
        ]);

        if (meterValueData?.length > 0) {
          if (meterValueData[0]?.total && meterValueData[0]?.count) {
            const avgChargingRate =
              Number(meterValueData[0]?.total) /
              (Number(meterValueData[0]?.count) * 1000);

            if (avgChargingRate) {
              await OcppTransactionsRepository.update(transactionUuid, {
                avgChargingRate: parseFloat(avgChargingRate ?? 0).toFixed(2),
              });
            }
          }
        }
      } catch (error) {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ OcppCalculateAvgChargingRateQueue error:", error);
        console.log("🚀 -----------------🚀");
      }

      // Updating Charger Revenue.
      try {
        await SyncRevenueQueue.add({ transactionUuid }, { delay: 500 });
      } catch (error) {
        console.log("🚀 -----------------🚀");
        console.log("🚀 ~ REV error:", error);
        console.log("🚀 -----------------🚀");
      }
    }
  },
);

const TempInvoiceGenerateQueue = CreateQueue(
  QueueNames.TEMP_INVOICE_GENERATE_QUEUE,
  async (jobData) => {
    const transactions = await TransactionHistoryViewModel.aggregate(
      [
        { $match: { "response.receiptInfo": { $exists: false } } },
        { $sort: { createdAt: -1 } },
        { $project: { _id: 1 } },
      ],
      { allowDiskUse: true },
    );

    for (const t of transactions) {
      try {
        await generateTransactionInvoice(t._id);
      } catch (error) {}
    }

    // await Promise.all(
    //   transactions.map(async (t) => {
    //     try {
    //       await generateTransactionInvoice(t._id);
    //     } catch (error) {}
    //   })
    // );
    console.log("===================================");
    console.log("===================================");
    console.log("==========  FINISHED  =============");
    console.log("===================================");
    console.log("===================================");
  },
);

const OcppGetConfigurationQueue = CreateQueue(
  QueueNames.OCPP_GET_CONFIGURATION_QUEUE,
  async (jobData) => {
    const { clientId, connectorId = 1 } = jobData;

    const response = await sendOcppEvent(
      clientId,
      OcppEvents.GetConfiguration,
      { key: [] },
    );

    const { configurationKey } = response.message;
    if (configurationKey?.length > 0) {
      const bulkOps = [];
      for (const config of configurationKey) {
        bulkOps.push({
          updateOne: {
            filter: { chargeBoxId: clientId, key: config.key },
            update: {
              $set: {
                value: config.value,
                readonly: config?.readonly || false,
                isJson: config.key.startsWith("cnx_") ? true : false,
              },
            },
            upsert: true,
          },
        });
      }
      await ChargerConfigurationModel.bulkWrite(bulkOps);
      await sendDataToPusher({
        channelName: PusherConstants.channels.PUSHER_NODE_APP,
        eventName: PusherConstants.events.charger.CHARGER_CONFIG_FETCHED,
        data: {
          chargeBoxId: clientId,
          connectorId,
        },
      });
    } else {
      console.log("=====No Configuration Key Found=====");
    }
  },
);

const OcppChangeConfigurationQueue = CreateQueue(
  QueueNames.OCPP_CHANGE_CONFIGURATION_QUEUE,
  async (jobData) => {
    const { clientId } = jobData;

    const configs = await ChargerConfigurationModel.find({
      chargeBoxId: clientId,
    }).lean();
    if (configs.length > 0) {
      await changeConfigurationByChargeBoxId(clientId, configs);
    }
  },
);

const OcppUpdatePendingFirmwareQueue = CreateQueue(
  QueueNames.OCPP_UPDATE_PENDING_FIRMWARE_QUEUE,
  async (jobData) => {
    const { clientId, connectorId = 1 } = jobData;

    const charger = await getChargerByIdentity(clientId);

    if (!charger) {
      console.log("Charger Not Found for UpdateFirmware");
      return;
    }

    // check for pending firmware update
    const pendingFirmwareUpdate = await OtaUpdatesChargersRepository.findOne({
      where: { chargeBoxId: charger?.chargeBoxId, status: "Created" },
      order: { createdAt: "DESC" },
    });
    if (!pendingFirmwareUpdate) {
      return;
    }
    const otaUpdateData = await OtaUpdatesRepository.findOne({
      where: { id: pendingFirmwareUpdate.otaUpdateId },
    });
    if (!otaUpdateData) {
      return;
    }

    const retrieveDate = otaUpdateData?.updateDateTime
      ? DateTime.fromISO(otaUpdateData.updateDateTime).toUTC().toISO()
      : DateTime.now().toUTC().toISO();
    const data = await getConfigConstants([
      "OTA_UPDATE_RETRIES",
      "OTA_UPDATE_RETRY_INTERVAL",
    ]);
    const retries = data.OTA_UPDATE_RETRIES || 3;
    const retryInterval = data.OTA_UPDATE_RETRY_INTERVAL || 60;

    const ocppSchema = {
      location: otaUpdateData.fileUrl,
      retrieveDate: retrieveDate,
      retries: retries,
      retryInterval: retryInterval,
    };

    try {
      await sendOcppEvent(
        charger?.chargeBoxId,
        OcppEvents.UpdateFirmware,
        ocppSchema,
      );

      await OtaUpdatesChargersRepository.update(pendingFirmwareUpdate.id, {
        status: "Sent",
      });
    } catch (err) {
      console.error(
        `Failed to send OTA update to charger ${charger.chargeBoxId}:`,
        err.message,
      );
    }
  },
);

const StopTransactionAndCaptureQueue = CreateQueue(
  QueueNames.STOP_TRANSACTION_AND_CAPTURE_QUEUE,
  async (jobData) => {
    const { ocppTransactionId } = jobData;

    const transactionData = await OcppTransactionsRepository.findOne({
      where: { transactionUuid: ocppTransactionId },
    });

    // Sending Remote Stop, It will trigger payment also
    const response = await sendOcppEvent(
      transactionData.chargeBoxId,
      OcppEvents.RemoteStopTransaction,
      { transactionId: Number(transactionData.chargerTransactionId) },
    );

    try {
      const customer = await CustomersRepository.findOne({
        where: { id: transactionData?.customerId },
      });

      if (
        customer?.isTesting &&
        response?.message?.message == "Client is not connected."
      ) {
        await MockTransactionQueue.add(
          {
            ocppTransactionData: transactionData,
            action: "Stop",
          },
          { delay: 500 },
        );
      }
    } catch (error) {}
  },
);

const processMockOcppEvent = async (data, responseData = {}) => {
  let returnData = deepClone(responseData);

  try {
    const url = `${process.env.CORE_API_BASEURL}/ocpp/handle-event`;
    const response = await axios.post(url, data);
    if (response?.data) {
      returnData = response?.data;
    }
    return returnData;
  } catch (error) {
    return returnData;
  }
};

const MockTransactionQueue = CreateQueue(
  QueueNames.MOCK_TRANSACTION_QUEUE,
  async (jobData) => {
    const { ocppTransactionData = null, action = null } = jobData;

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const sleepTime = 3000;

    const clientId = ocppTransactionData?.chargeBoxId;
    const idTag = ocppTransactionData?.idTag;
    const connectorId = ocppTransactionData?.connectorId;
    const transactionId = ocppTransactionData?.chargerTransactionId;
    const meterStart = 1;
    const meterStop = 3;

    let eventName = OcppEvents.Authorize;
    if (action == "Start") {
      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: { idTag },
        },
        getDefaultOcppResponse(eventName),
      );

      await sleep(sleepTime);

      eventName = OcppEvents.StartTransaction;
      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: { connectorId, idTag, meterStart, timestamp: DateTime.utc() },
        },
        getDefaultOcppResponse(eventName),
      );

      await sleep(sleepTime);

      eventName = OcppEvents.MeterValues;

      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: {
            connectorId,
            transactionId,
            meterValue: [
              {
                timestamp: DateTime.utc(),
                sampledValue: [
                  {
                    value: "1",
                    context: "Transaction.Begin",
                    format: "Raw",
                    measurand: "Current.Import",
                    phase: "L1",
                    unit: "A",
                  },
                  {
                    value: "1",
                    context: "Transaction.Begin",
                    format: "Raw",
                    measurand: "Voltage",
                    phase: "L1",
                    unit: "V",
                  },
                  {
                    value: "1",
                    context: "Transaction.Begin",
                    format: "Raw",
                    measurand: "Energy.Active.Import.Register",
                    phase: "L1",
                    unit: "kWh",
                  },
                ],
              },
            ],
          },
        },
        getDefaultOcppResponse(eventName),
      );

      await sleep(sleepTime);

      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: {
            connectorId,
            transactionId,
            meterValue: [
              {
                timestamp: DateTime.utc(),
                sampledValue: [
                  {
                    value: "1.50",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Current.Import",
                    phase: "L1",
                    unit: "A",
                  },
                  {
                    value: "1.50",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Voltage",
                    phase: "L1",
                    unit: "V",
                  },
                  {
                    value: "1.50",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Energy.Active.Import.Register",
                    phase: "L1",
                    unit: "kWh",
                  },
                ],
              },
            ],
          },
        },
        getDefaultOcppResponse(eventName),
      );

      await sleep(sleepTime);

      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: {
            connectorId,
            transactionId,
            meterValue: [
              {
                timestamp: DateTime.utc(),
                sampledValue: [
                  {
                    value: "2.00",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Current.Import",
                    phase: "L1",
                    unit: "A",
                  },
                  {
                    value: "2.00",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Voltage",
                    phase: "L1",
                    unit: "V",
                  },
                  {
                    value: "2.00",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Energy.Active.Import.Register",
                    phase: "L1",
                    unit: "kWh",
                  },
                ],
              },
            ],
          },
        },
        getDefaultOcppResponse(eventName),
      );

      await sleep(sleepTime);

      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: {
            connectorId,
            transactionId,
            meterValue: [
              {
                timestamp: DateTime.utc(),
                sampledValue: [
                  {
                    value: "3.00",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Current.Import",
                    phase: "L1",
                    unit: "A",
                  },
                  {
                    value: "3.00",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Voltage",
                    phase: "L1",
                    unit: "V",
                  },
                  {
                    value: "3.00",
                    context: "Sample.Periodic",
                    format: "Raw",
                    measurand: "Energy.Active.Import.Register",
                    phase: "L1",
                    unit: "kWh",
                  },
                ],
              },
            ],
          },
        },
        getDefaultOcppResponse(eventName),
      );
    } else {
      eventName = OcppEvents.StopTransaction;
      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: {
            idTag,
            meterStop,
            reason: "Remote",
            transactionId,
            timestamp: DateTime.utc(),
          },
        },
        getDefaultOcppResponse(eventName),
      );

      await sleep(sleepTime);

      eventName = OcppEvents.MeterValues;

      await processMockOcppEvent(
        {
          clientId,
          eventName,
          params: {
            connectorId,
            transactionId,
            meterValue: [
              {
                timestamp: DateTime.utc(),
                sampledValue: [
                  {
                    value: "3.00",
                    context: "Transaction.End",
                    format: "Raw",
                    measurand: "Current.Import",
                    phase: "L1",
                    unit: "A",
                  },
                  {
                    value: "3.00",
                    context: "Transaction.End",
                    format: "Raw",
                    measurand: "Voltage",
                    phase: "L1",
                    unit: "V",
                  },
                  {
                    value: "3.00",
                    context: "Transaction.End",
                    format: "Raw",
                    measurand: "Energy.Active.Import.Register",
                    phase: "L1",
                    unit: "kWh",
                  },
                ],
              },
            ],
          },
        },
        getDefaultOcppResponse(eventName),
      );
    }

    return true;
  },
);

const OcppSendLocalListQueue = CreateQueue(
  QueueNames.OCPP_SEND_LOCAL_LIST_QUEUE,
  async (jobData) => {
    const { chargeBoxId } = jobData;

    try {
      let chargerCurrentVersion = 0;
      try {
        const getVersionResponse = await sendOcppEvent(
          chargeBoxId,
          OcppEvents.GetLocalListVersion,
          {}
        );

        if (getVersionResponse.code === 200 && getVersionResponse.message?.listVersion !== undefined) {
          chargerCurrentVersion = getVersionResponse.message.listVersion;
          console.log(`Charger ${chargeBoxId} current list version: ${chargerCurrentVersion}`);
        }
      } catch (versionError) {
        console.log(`Could not get current version for ${chargeBoxId}, proceeding with update:`, versionError.message);
      }

      const latestListInDb = await ChargerLocalAuthorizationRepository.find({
        where: { chargeBoxId },
        order: { listVersion: "DESC" },
        take: 1,
      });

      if (!latestListInDb || latestListInDb.length === 0) {
        console.log(`No local authorization list found in DB for charger ${chargeBoxId}`);
        return;
      }

      const dbListVersion = latestListInDb[0].listVersion;

      if (dbListVersion <= chargerCurrentVersion) {
        console.log(`Charger ${chargeBoxId} already has the latest version (${chargerCurrentVersion}), skipping update`);
        return;
      }

      await sendLocalAuthorizationListByChargeBoxId(chargeBoxId, "Full")
      
    } catch (error) {
      console.error(`Error in OcppSendLocalListQueue for ${chargeBoxId}:`, error.message);
    }
  }
);

module.exports = {
  OcppStopTransactionQueue,
  MockTransactionQueue,
  OcppAmountLookupQueue,
  OcppGenerateInvoiceQueue,
  OcppRealtimeAmountQueue,
  OcppCalculateAvgChargingRateQueue,
  SyncRevenueQueue,
  TempInvoiceGenerateQueue,
  OcppGetConfigurationQueue,
  OcppUpdatePendingFirmwareQueue,
  StopTransactionAndCaptureQueue,
  OcppChangeConfigurationQueue,
  OcppSendLocalListQueue,
};
