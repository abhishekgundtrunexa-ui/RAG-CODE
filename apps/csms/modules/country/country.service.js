const { CountryModel } = require("@shared-libs/db/mongo-db");
const { ObjectDAO, getCountries } = require("@shared-libs/helpers");
const { HandleMongoDBList } = require("@shared-libs/db");
const { StateModel } = require("@shared-libs/db/mongo-db/models");

const getCountryListing = async (req, res) => {
  let countryFilter = req.query?.location || null;
  const countryList = await getCountries(countryFilter);

  res.status(200).json(countryList);
};

const activeInactiveCountry = async (req, res) => {
  const { isoCode, isActive } = req.body;
  const country = await CountryModel.findOneAndUpdate(
    { isoCode: isoCode },
    { isActive: isActive },
    { new: true }
  );

  if (!country) {
    return res.status(404).json({ message: "Country Not Found" });
  }

  res.status(200).json(country);
};

const activeInactiveCountries = async (req, res) => {
  const { isoCodes, isActive } = req.body;

  if (!Array.isArray(isoCodes) || isoCodes.length === 0) {
    return res.status(400).json({ message: "Invalid IsoCodes Array" });
  }

  const result = await CountryModel.updateMany(
    { isoCode: { $in: isoCodes } },
    { isActive: isActive },
    { new: true }
  );

  if (result.modifiedCount === 0) {
    return res.status(404).json({ message: "No Countries Found To Update" });
  }

  res.status(200).json({
    message: `${result.modifiedCount} Countries Updated Successfully`,
  });
};

const getActiveCountries = async (req, res) => {
  const listParams = {
    model: CountryModel,
    baseQuery: {
      isActive: true,
    },
    req,
  };
  let countryList = await HandleMongoDBList(listParams);
  if (countryList.list?.length > 0) {
    countryList.list = countryList.list.map(ObjectDAO);
  }
  res.status(200).json(countryList);
};

// const getCountryStates = async (req, res) => {
//   try {
//     const loggedInUserData = req["loggedInUserData"];
//     // if (!loggedInUserData || !loggedInUserData.settings?.cpo) {
//     //   return res
//     //     .status(400)
//     //     .json({ message: "User settings or CPO data missing." });
//     // }
//     // const { country, id } = loggedInUserData.settings?.cpo;
//     const isoCode = req.params?.isoCode;
//     const whereCondition = { isDeleted: false };

//     // whereCondition.country = isoCode || country;
//     whereCondition.country = isoCode;
//     // if (id) {
//     //   whereCondition.cpoId = id;
//     // }
//     // const raw = await EvseStationRepository.find({
//     //   where: whereCondition,
//     //   select: ["state"],
//     // });
//     let states = [];
//     if (raw.length > 0) {
//       states = [...new Set(raw.map((item) => item.state.trim().toLowerCase()))].map(
//         (state) => state.charAt(0).toUpperCase() + state.slice(1)
//       );
//     }
//     return res.status(200).json({ states });
//   } catch (error) {
//     console.error("Error in getting states from country:", error);
//     return res
//       .status(500)
//       .json({ message: "Internal Server Error", error: error.message });
//   }
// };

const getCountryStates = async (req, res) => {
  try {
    const isoCode = req.query?.isoCode;
    if (!isoCode) {
      return res.status(400).json({ message: "Country ISO code is required." });
    }

    // Find states by countryIsoCode
    const statesFromDb = await StateModel.find(
      { countryIsoCode: isoCode },
      { name: 1, _id: 0 } // Only return the name
    );

    let states = [];
    if (statesFromDb.length > 0) {
      states = statesFromDb
        .map((s) => s.name.trim().toLowerCase())
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i) // unique
        .map((name) => name.charAt(0).toUpperCase() + name.slice(1));
    }
    return res.status(200).json({ states });
  } catch (error) {
    console.error("Error in getting states from country:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

module.exports = {
  getCountryListing,
  activeInactiveCountry,
  activeInactiveCountries,
  getActiveCountries,
  getCountryStates,
};
