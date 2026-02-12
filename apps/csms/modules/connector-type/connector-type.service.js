const { ObjectDAO } = require("@shared-libs/helpers");
const { HandleMySqlList } = require("@shared-libs/db");

const getConnectorTypeList = async (req, res) => {
  const listParams = {
    entityName: "ChargerConnectorType",
    req,
  };
  let connectorTypeList = await HandleMySqlList(listParams);
  if (connectorTypeList.list && connectorTypeList.list.length > 0) {
    const newConnectorTypeList = connectorTypeList.list.map((connector) => {
      return ObjectDAO(connector);
    });
    connectorTypeList.list = newConnectorTypeList;
    delete newConnectorTypeList;
  }
  res.status(200).json(connectorTypeList);
};

module.exports = {
  getConnectorTypeList,
};
