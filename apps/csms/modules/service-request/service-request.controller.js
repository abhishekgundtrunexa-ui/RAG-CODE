const serviceRequestService = require("./service-request.service");

exports.addServiceRequest = async (req, res) => {
  try {
    await serviceRequestService.addServiceRequest(req.body, req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getServiceRequestById = async (req, res) => {
  try {
    const serviceRequestId = req.params.serviceRequestId;
    await serviceRequestService.getServiceRequestById(
      serviceRequestId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.updateServiceRequestStatus = async (req, res) => {
  try {
    const serviceRequestId = req.params.serviceRequestId;
    const payload = req.body;
    await serviceRequestService.updateServiceRequestStatus(
      serviceRequestId,
      payload,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getServiceRequestList = async (req, res) => {
  try {
    await serviceRequestService.getServiceRequestList(req, res);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.softDeleteServiceRequest = async (req, res) => {
  try {
    const serviceRequestId = req.params.serviceRequestId;
    await serviceRequestService.softDeleteServiceRequest(
      serviceRequestId,
      req,
      res
    );
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
