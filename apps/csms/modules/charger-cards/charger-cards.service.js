const { ChargerCardRepository, ChargerLocalAuthorizationRepository } = require("@shared-libs/db/mysql");
const { convertObjectValuesToString, getChargerByIdentity, getRawCardUid, getChargerDetailsData, sendOcppEvent, sendLocalAuthorizationListByChargeBoxId } = require("@shared-libs/helpers");
const { OcppEvents } = require("@shared-libs/constants");


const setChargerCard = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const payload = req?.body;
  if (!payload?.cardUid) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid cardUid",
      })
    );
  }
  if (!payload?.cardLabel) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid cardLabel",
      })
    );
  }

  let { cardUid, cardLabel, expiryDate, expiryTime } = payload;
  const cardUidRaw = getRawCardUid(cardUid);

  let combinedExpiryDate = expiryDate;
  if (expiryDate && expiryTime) {
    combinedExpiryDate = `${expiryDate} ${expiryTime}`;
  }

  const checkUid = await ChargerCardRepository.find({
    where: [
      { cardUid, isExpired: false },
      { cardUidRaw, isExpired: false },
    ],
  });
  if (checkUid?.length > 0) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This cardUid ia already in use.",
      })
    );
  }

  await ChargerCardRepository.insert({
    chargerId: charger?.id,
    chargeBoxId: charger?.chargeBoxId,
    serialNumber: charger?.serialNumber,
    cardUid,
    cardLabel,
    cardUidRaw,
    expiryDateRaw: expiryDate,
    expiryDate: combinedExpiryDate,
    expiryTimeRaw: expiryTime,
  });

  const chargerDetails = await getChargerDetailsData(charger.id);

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "The card has been assigned to the charger successfully.",
      chargerDetails,
    })
  );
};

const setChargerCardAuthList = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const payload = req?.body;
  if (!payload?.cardUid) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid cardUid",
      })
    );
  }
  if (!payload?.cardLabel) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid cardLabel",
      })
    );
  }

  let { cardUid, cardLabel, expiryDate, status, parentIdTag } = payload;
  const cardUidRaw = getRawCardUid(cardUid);

  let expiryDateOnly = null;
  let expiryTimeOnly = null;
  let combinedExpiryDate = expiryDate;

  if (expiryDate) {
    const dateObj = new Date(expiryDate);
    expiryDateOnly = dateObj.toISOString().split('T')[0];
    expiryTimeOnly = dateObj.toISOString().split('T')[1].split('.')[0];
    combinedExpiryDate = `${expiryDateOnly} ${expiryTimeOnly}`;
  }
  

  const checkUid = await ChargerCardRepository.find({
    where: [
      { cardUid, isExpired: false },
      { cardUidRaw, isExpired: false },
    ],
  });
  if (checkUid?.length > 0) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "This cardUid ia already in use.",
      })
    );
  }

  await ChargerCardRepository.insert({
    chargerId: charger?.id,
    chargeBoxId: charger?.chargeBoxId,
    serialNumber: charger?.serialNumber,
    cardUid,
    cardLabel,
    cardUidRaw,
    expiryDateRaw: expiryDate,
    expiryDate: combinedExpiryDate,
    expiryTimeRaw: expiryTimeOnly,
  });


  try {
    const existingLists = await ChargerLocalAuthorizationRepository.find({
      where: { chargeBoxId: charger?.chargeBoxId },
      order: { listVersion: "DESC" },
      take: 1,
    });

    let newListVersion = 1;
    if (existingLists && existingLists.length > 0) {
      newListVersion = existingLists[0].listVersion + 1;
    }

    await ChargerLocalAuthorizationRepository.save({
      chargeBoxId: charger?.chargeBoxId,
      listVersion: newListVersion,
      idTag: cardUid,
      status: status || "Accepted",
      expiryDate: expiryDate ? expiryDate : null,
      parentIdTag: parentIdTag || null,
      updateType: "Differential",
    });

    const syncResult = await sendLocalAuthorizationListByChargeBoxId(
      charger?.chargeBoxId,
      "Differential"
    );

    if (!syncResult.success) {
      console.error("Failed to sync card with charger:", syncResult.message);
    }
  } catch (syncError) {
    console.error("Error syncing card to charger:", syncError);
  }

  const chargerDetails = await getChargerDetailsData(charger.id);

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "The card has been assigned to the charger successfully.",
      chargerDetails,
    })
  );
};

const getChargerCard = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const chargerCards = await ChargerCardRepository.find({
    where: { chargerId: charger?.id },
  });

  return res.status(200).json({
    success: true,
    chargerCards,
  });
};

const updateChargerCardAuthList = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  const card_id = req?.params?.card_id;

  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  if (!card_id) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Card ID",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const existingCard = await ChargerCardRepository.findOne({
    where: { id: card_id, chargerId: charger?.id },
  });

  if (!existingCard) {
    return res.status(404).json(
      convertObjectValuesToString({
        success: false,
        message: "Card not found",
      })
    );
  }

  const payload = req?.body;
  let { cardUid, cardLabel, expiryDate, status, parentIdTag } = payload;

  if (cardUid && cardUid !== existingCard.cardUid) {
    const cardUidRaw = getRawCardUid(cardUid);
    const checkUid = await ChargerCardRepository.find({
      where: [
        { cardUid, isExpired: false },
        { cardUidRaw, isExpired: false },
      ],
    });

    if (checkUid?.length > 0) {
      return res.status(400).json(
        convertObjectValuesToString({
          success: false,
          message: "This cardUid is already in use.",
        })
      );
    }
  }

  const updateData = {};
  
  if (cardUid) {
    updateData.cardUid = cardUid;
    updateData.cardUidRaw = getRawCardUid(cardUid);
  }
  
  if (cardLabel) {
    updateData.cardLabel = cardLabel;
  }

  if (expiryDate) {
    const dateObj = new Date(expiryDate);
    const expiryDateOnly = dateObj.toISOString().split('T')[0];
    const expiryTimeOnly = dateObj.toISOString().split('T')[1].split('.')[0];
    const combinedExpiryDate = `${expiryDateOnly} ${expiryTimeOnly}`;
    
    updateData.expiryDateRaw = expiryDate;
    updateData.expiryDate = combinedExpiryDate;
    updateData.expiryTimeRaw = expiryTimeOnly;
  }

  await ChargerCardRepository.update({ id: card_id }, updateData);

  const updatedCard = await ChargerCardRepository.findOne({
    where: { id: card_id },
  });

  try {
    const existingLists = await ChargerLocalAuthorizationRepository.find({
      where: { chargeBoxId: charger?.chargeBoxId },
      order: { listVersion: "DESC" },
      take: 1,
    });

    let newListVersion = 1;
    if (existingLists && existingLists.length > 0) {
      newListVersion = existingLists[0].listVersion + 1;
    }

    await ChargerLocalAuthorizationRepository.save({
      chargeBoxId: charger?.chargeBoxId,
      listVersion: newListVersion,
      idTag: updatedCard.cardUid,
      status: status || "Accepted",
      expiryDate: updatedCard.expiryDate || null,
      parentIdTag: parentIdTag || null,
      updateType: "Differential",
    });

    const syncResult = await sendLocalAuthorizationListByChargeBoxId(
      charger?.chargeBoxId,
      "Differential"
    );

    if (!syncResult.success) {
      console.error("Failed to sync updated card with charger:", syncResult.message);
    }
  } catch (syncError) {
    console.error("Error syncing updated card to charger:", syncError);
  }

  const chargerDetails = await getChargerDetailsData(charger.id);

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "The card has been updated successfully.",
      chargerDetails,
    })
  );
};

const syncAuthList = async (req, res) => {
  const serial_number = req?.params?.serial_number;

  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const syncResult = await sendLocalAuthorizationListByChargeBoxId(
    charger?.chargeBoxId,
    "Full"
  );

  if (!syncResult.success) {
    console.error("Failed to sync updated card with charger:", syncResult.message);
  }

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "Auth list has beed synced with charger",
    })
  );
};


const deleteChargerCard = async (req, res) => {
  const serial_number = req?.params?.serial_number;
  const card_id = req?.params?.card_id;

  if (!serial_number) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  if (!card_id) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Card ID",
      })
    );
  }

  let charger = await getChargerByIdentity(serial_number);
  if (!charger) {
    return res.status(400).json(
      convertObjectValuesToString({
        success: false,
        message: "Invalid Serial-Number",
      })
    );
  }

  const existingCard = await ChargerCardRepository.findOne({
    where: { id: card_id, chargerId: charger?.id },
  });

  if (!existingCard) {
    return res.status(404).json(
      convertObjectValuesToString({
        success: false,
        message: "Card not found",
      })
    );
  }

  await ChargerCardRepository.delete({ id: card_id });

  try {
    const existingLists = await ChargerLocalAuthorizationRepository.find({
      where: { chargeBoxId: charger?.chargeBoxId },
      order: { listVersion: "DESC" },
      take: 1,
    });

    let newListVersion = 1;
    if (existingLists && existingLists.length > 0) {
      newListVersion = existingLists[0].listVersion + 1;
    }

    await ChargerLocalAuthorizationRepository.save({
      chargeBoxId: charger?.chargeBoxId,
      listVersion: newListVersion,
      idTag: existingCard.cardUid,
      status: "Invalid",
      expiryDate: null,
      parentIdTag: null,
      updateType: "Differential",
    });

    const syncResult = await sendLocalAuthorizationListByChargeBoxId(
      charger?.chargeBoxId,
      "Differential"
    );

    if (!syncResult.success) {
      console.error("Failed to sync deleted card with charger:", syncResult.message);
    }
  } catch (syncError) {
    console.error("Error syncing deleted card to charger:", syncError);
  }

  const chargerDetails = await getChargerDetailsData(charger.id);

  return res.status(200).json(
    convertObjectValuesToString({
      success: true,
      message: "The card has been deleted successfully.",
      chargerDetails,
    })
  );
};


module.exports = { 
    setChargerCard,
    setChargerCardAuthList,
    getChargerCard,
    updateChargerCardAuthList,
    deleteChargerCard,
    sendLocalAuthorizationListByChargeBoxId,
    syncAuthList
};