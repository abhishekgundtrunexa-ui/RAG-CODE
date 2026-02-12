const { ChargerLocalAuthorizationRepository, ChargerCardRepository } = require("@shared-libs/db/mysql");
const { OcppEvents } = require("@shared-libs/constants");

const sendLocalAuthorizationListByChargeBoxId = async (chargeBoxId, updateType = "Differential") => {
  const { sendOcppEvent, getChargerByIdentity } = require("@shared-libs/helpers");
  const convertToISOFormat = (dateString) => {
    if (!dateString) return null;
    try {
      const isoString = dateString.replace(' ', 'T') + 'Z';
      return isoString;
    } catch (error) {
      console.error('Error converting date to ISO format:', error);
      return dateString;
    }
  };

  try {
    if (!["Full", "Differential"].includes(updateType)) {
      throw new Error("updateType must be either 'Full' or 'Differential'");
    }

    if (!chargeBoxId) {
      throw new Error("chargeBoxId is required");
    }

    const charger = await getChargerByIdentity(chargeBoxId);
    if (!charger) {
      throw new Error("Charger not found with the provided chargeBoxId");
    }

    let localAuthorizationList = [];
    let listVersion = 1;

    if (updateType === "Differential") {
      const authRecord = await ChargerLocalAuthorizationRepository.findOne({
        where: { chargeBoxId },
        order: { listVersion: "DESC" },
      });

      if (!authRecord) {
        throw new Error("No authorization record found for Differential update");
      }

      listVersion = authRecord.listVersion || 1;

      const authItem = {
        idTag: authRecord.idTag,
        idTagInfo: {
          status: authRecord.status,
        },
      };

      if (authRecord.expiryDate) {
        authItem.idTagInfo.expiryDate = convertToISOFormat(authRecord.expiryDate);
      }

      if (authRecord.parentIdTag) {
        authItem.idTagInfo.parentIdTag = authRecord.parentIdTag;
      }

      localAuthorizationList.push(authItem);

    } else {
      const chargerCards = await ChargerCardRepository.find({
        where: { 
          chargeBoxId,
          isExpired: false 
        },
      });

      if (!chargerCards || chargerCards.length === 0) {
        throw new Error("No cards found for Full update");
      }

      const existingLists = await ChargerLocalAuthorizationRepository.find({
        where: { chargeBoxId },
        order: { listVersion: "DESC" },
        take: 1,
      });

      if (existingLists && existingLists.length > 0) {
        listVersion = existingLists[0].listVersion + 1;
      }

      localAuthorizationList = chargerCards.map((card) => {
        const authItem = {
          idTag: card.cardUid || card.cardUidRaw,
          idTagInfo: {
            status: card.status || "Accepted",
          },
        };

        if (card.expiryDate) {
          authItem.idTagInfo.expiryDate = convertToISOFormat(card.expiryDate);
        }

        return authItem;
      });

      const authListEntries = chargerCards.map((card) => ({
        chargeBoxId,
        listVersion,
        idTag: card.cardUid || card.cardUidRaw,
        status: card.status || "Accepted",
        expiryDate: card.expiryDate || null,
        parentIdTag: null,
        updateType: "Full",
      }));

      await ChargerLocalAuthorizationRepository.delete({ chargeBoxId });
      
      await ChargerLocalAuthorizationRepository.save(authListEntries);
    }

    const ocppPayload = {
      listVersion,
      updateType,
      localAuthorizationList,
    };

    let ocppResponse = null;
    let isChargerOnline = false;

    try {
      ocppResponse = await sendOcppEvent(
        chargeBoxId,
        OcppEvents.SendLocalList,
        ocppPayload
      );

      if (ocppResponse.code === 200 && ocppResponse.message?.status === "Accepted") {
        isChargerOnline = true;
      }
    } catch (error) {
      console.error(`Error sending SendLocalList to charger ${chargeBoxId}:`, error);
    }

    return {
      success: true,
      message: isChargerOnline
        ? "Local authorization list updated and sent to charger successfully"
        : "Local authorization list updated. Will be sent when charger comes online",
      data: {
        chargeBoxId,
        listVersion,
        updateType,
        totalIdTags: localAuthorizationList.length,
        chargerOnline: isChargerOnline,
        ocppResponse: ocppResponse?.message || null,
      },
    };

  } catch (error) {
    console.error("Error in sendLocalAuthorizationListByChargeBoxId:", error);
    return {
      success: false,
      message: error.message || "Failed to send local authorization list",
      error: error.message,
    };
  }
};

module.exports = {
  sendLocalAuthorizationListByChargeBoxId
};
