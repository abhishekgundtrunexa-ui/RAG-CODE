const {
  ServiceRequestCategoryRepository,
  ServiceRequestRepository,
  ServiceRequestLogRepository,
  UserRepository,
} = require("@shared-libs/db/mysql");
const { HandleMySqlList } = require("@shared-libs/db");
const { customErrorMsg } = require("@shared-libs/constants");
const { ObjectDAO } = require("@shared-libs/helpers");

const addServiceRequest = async (payload, req, res) => {
  const { srNumber, categoryId } = payload;

  const serviceReqCategory = await ServiceRequestCategoryRepository.findOne({
    where: { id: categoryId },
  });

  if (!serviceReqCategory) {
    return res.status(404).send({
      message: customErrorMsg.serviceRequest.SERVICE_REQUEST_CATEGORY_NOT_FOUND,
    });
  }

  const loggedInUserId = req.loggedInUserData.user.id;

  const isSrNumberExist = await ServiceRequestRepository.findOne({
    where: { srNumber },
  });

  if (isSrNumberExist) {
    return res.status(400).json({
      message: customErrorMsg.serviceRequest.SERIAL_NUMBER_ALREADY_EXIST,
    });
  }

  const newServiceRequest = ServiceRequestRepository.create({
    ...payload,
    createdBy: loggedInUserId,
  });

  const createdServiceRequest = await ServiceRequestRepository.save(
    newServiceRequest
  );

  // Fetch the created Service Request with populated categoryId
  const createdServiceRequestObj = await ServiceRequestRepository.findOne({
    where: { id: createdServiceRequest.id },
  });

  res.status(201).json(createdServiceRequestObj);
};

const getServiceRequestById = async (serviceRequestId, req, res) => {
  const serviceRequest = await ServiceRequestRepository.findOne({
    where: { id: serviceRequestId, isDeleted: false },
  });

  if (!serviceRequest) {
    return res.status(404).json({
      message: customErrorMsg.serviceRequest.SERVICE_REQUEST_NOT_FOUND,
    });
  }

  res.status(200).json(ObjectDAO(serviceRequest));
};

const getServiceRequestList = async (req, res) => {
  const listParams = {
    entityName: "ServiceRequest",
    baseQuery: {
      isDeleted: false,
    },
    req,
  };

  const serviceRequestListResponse = await HandleMySqlList(listParams);
  if (
    serviceRequestListResponse.list &&
    serviceRequestListResponse.list.length > 0
  ) {
    const newList = serviceRequestListResponse.list.map((service) => {
      return ObjectDAO(newList);
    });
    serviceRequestListResponse.list = newList;
  }
  res.status(200).json(serviceRequestListResponse);
};

const updateServiceRequestStatus = async (
  serviceRequestId,
  payload,
  req,
  res
) => {
  try {
    const { currentStatus, assignedTo } = payload;

    const serviceRequest = await ServiceRequestRepository.findOne({
      where: { id: serviceRequestId },
    });
    if (!serviceRequest) {
      return res.status(404).json({
        message: customErrorMsg.serviceRequest.SERVICE_REQUEST_NOT_FOUND,
      });
    }

    if (assignedTo) {
      const user = await UserRepository.findOne({ where: { id: assignedTo } });
      if (!user) {
        return res
          .status(404)
          .json({ message: customErrorMsg.user.USER_NOT_FOUND });
      }
    }

    const loggedInUserId = req["loggedInUserData"]["user"]["id"];

    const serviceReqLogCreate = {
      ...payload,
      serviceRequestId: serviceRequest.id,
      updatedBy: loggedInUserId,
    };

    if (serviceRequest.currentStatus !== currentStatus) {
      await ServiceRequestRepository.update(serviceRequestId, {
        currentStatus,
      });

      await ServiceRequestLogRepository.save(serviceReqLogCreate);
    }

    const updatedServiceRequest = await ServiceRequestRepository.findOne({
      where: { id: serviceRequestId },
    });

    res.status(200).json(updatedServiceRequest);
  } catch (error) {
    console.error("Error updating service request status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const softDeleteServiceRequest = async (serviceRequestId, req, res) => {
  const serviceRequest = await ServiceRequestRepository.findOne({
    where: { id: serviceRequestId },
  });
  if (!serviceRequest) {
    return res.status(404).json({
      message: customErrorMsg.serviceRequest.SERVICE_REQUEST_NOT_FOUND,
    });
  }

  if (serviceRequest.isDeleted) {
    return res.status(400).json({
      message: customErrorMsg.serviceRequest.SERVICE_REQUEST_ALREADY_DELETED,
    });
  }

  await ServiceRequestRepository.update(serviceRequestId, {
    isDeleted: true,
  });

  // Fetch the updated service request
  const deletedServiceRequest = await ServiceRequestRepository.findOne({
    where: { id: serviceRequestId },
  });

  res.status(200).json(deletedServiceRequest);
};

module.exports = {
  addServiceRequest,
  getServiceRequestById,
  updateServiceRequestStatus,
  getServiceRequestList,
  softDeleteServiceRequest,
};
