const { Brackets } = require("typeorm");
const { MySQLDataSource } = require("./mysql");

const arrayObjStr = (arr, keyColumn, dataColumn) => {
  const returnData = {};
  arr.forEach((v, i) => {
    returnData[arr[i][keyColumn]] = dataColumn ? arr[i][dataColumn] : arr[i];
  });
  return returnData;
};

const HandleMongoDBList = async (params) => {
  try {
    const { baseQuery, model, req } = params;
    let { page = 1, limit = 10, search, sort, filter, select } = req.query;
    if (page <= 0) {
      page = 1;
    }
    page = parseInt(page);
    limit = parseInt(limit);
    let query = {};

    // Add search functionality
    if (search) {
      const searchFields = Object.keys(model.schema.paths).filter(
        (path) => model.schema.paths[path].instance === "String"
      );
      const orConditions = searchFields.map((field) => ({
        [field]: { $regex: search, $options: "i" },
      }));
      query = { ...query, $or: orConditions };
    }

    // Add filter functionality
    if (filter) {
      let filterObj = null;

      try {
        filterObj = eval("(" + filter + ")");
      } catch (error) {
        filterObj = null;
      }

      if (filterObj !== null) {
        query = { ...query, ...filterObj };
      }
    }

    //Append base query with the filter
    if (baseQuery) {
      query = { ...query, ...baseQuery };
    }

    //select fields
    let selectOptions = {};
    if (select) {
      selectOptions = {
        ...JSON.parse(select),
      };
    }

    // Perform sorting
    const sortOptions = {};
    if (sort) {
      const [field, order] = sort.split(":");
      sortOptions[field] = order === "desc" ? -1 : 1;
    } else {
      sortOptions["createdAt"] = -1;
    }

    const totalCount = await model.countDocuments(query);
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1;

    let list = [];
    if (limit > 0) {
      list = await model
        .find(query)
        .sort(sortOptions)
        .skip((page - 1) * limit)
        .limit(limit)
        .select(selectOptions)
        .lean();
    } else {
      list = await model
        .find(query)
        .sort(sortOptions)
        .select(selectOptions)
        .lean();
    }

    return {
      list,
      currentPage: page,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.log("error", error);
    throw new Error(error.message);
  }
};

const HandleMySqlList = async (params) => {
  try {
    const { baseQuery, entityName, req } = params;
    let { page = 1, limit = 10, search, sort, filter, select } = req.query;
    if (page <= 0) {
      page = 1;
    }
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (!entityName) {
      throw new Error("Entity name is required");
    }

    // Get the repository for the view
    const repository = await MySQLDataSource.getRepository(entityName);
    let queryBuilder = repository.createQueryBuilder("entity");

    const columnData = queryBuilder.connection
      .getMetadata(entityName)
      .columns.map((column) => {
        return { propertyName: column.propertyName, type: column.type };
      });

    const allColumns = queryBuilder.connection
      .getMetadata(entityName)
      .columns.map((column) => {
        return column.propertyName;
      });

    const columnTypeMapping = arrayObjStr(columnData, "propertyName", "type");

    const searchFields = Object.keys(columnTypeMapping).filter(
      (key) =>
        columnTypeMapping[key] === "varchar" ||
        columnTypeMapping[key] === "text"
    );

    const enumFields = Object.keys(columnTypeMapping).filter(
      (key) => columnTypeMapping[key] === "enum"
    );

    // Add search functionality
    // if (search) {
    //   queryBuilder.andWhere(
    //     new Brackets((qb) => {
    //       searchFields.forEach((field) => {
    //         qb.orWhere(`entity.${field} LIKE :search`, {
    //           search: `%${search?.trim()}%`,
    //         });
    //       });
    //     })
    //   );
    // }

    if (search) {
      if (entityName !== "EmspUser") {
        const searchWords = search.trim().split(/\s+/);

        searchWords.forEach((word, index) => {
          const paramKey = `search_${index}`;

          queryBuilder.andWhere(
            new Brackets((qb) => {
              searchFields.forEach((field) => {
                qb.orWhere(`entity.${field} LIKE :${paramKey}`, {
                  [paramKey]: `%${word}%`,
                });
              });
            })
          );
        });
      }
    }

    // Add filter functionality
    if (filter) {
      let filterObj = null;

      try {
        filterObj = eval("(" + filter + ")");
      } catch (error) {
        filterObj = null;
        throw new Error("Filter format is invalid. Expected a JSON object.");
      }
      if (filterObj?.startDate && filterObj?.endDate) {
        queryBuilder.andWhere(`entity.createdAt BETWEEN :start AND :end`, {
          start: `${filterObj.startDate} 00:00:00`,
          end: `${filterObj.endDate} 23:59:59`,
        });
        delete filterObj["startDate"];
        delete filterObj["endDate"];
      }

      if (filterObj !== null) {
        Object.keys(filterObj).forEach((key) => {
          const value = filterObj[key];
          if (Array.isArray(value)) {
            if (key.startsWith("!")) {
              const actualKey = key.substring(1);
              if (allColumns.includes(actualKey)) {
                queryBuilder = queryBuilder.andWhere(
                  `entity.${actualKey} NOT IN (:...${actualKey})`,
                  {
                    [actualKey]: value,
                  }
                );
              }
            } else {
              if (allColumns.includes(key)) {
                queryBuilder = queryBuilder.andWhere(
                  `entity.${key} IN (:...${key})`,
                  {
                    [key]: value,
                  }
                );
              }
            }
          } else if (typeof value === "string") {
            if (enumFields.includes(key)) {
              queryBuilder = queryBuilder.andWhere(`entity.${key} = :${key}`, {
                [key]: value,
              });
            } else {
              if (allColumns.includes(key)) {
                queryBuilder = queryBuilder.andWhere(
                  `entity.${key} LIKE :${key}`,
                  {
                    [key]: `%${value}%`,
                  }
                );
              }
            }
          } else {
            if (allColumns.includes(key)) {
              queryBuilder = queryBuilder.andWhere(`entity.${key} = :${key}`, {
                [key]: value,
              });
            }
          }
        });
      }
    }

    // Apply base query
    if (baseQuery) {
      Object.keys(baseQuery).forEach((key) => {
        if (baseQuery[key]?.custom) {
          if (key == "ALL_FIELDS") {
            queryBuilder.andWhere(
              new Brackets((qb) => {
                qb.orWhere(baseQuery[key]?.value);
              })
            );
          } else {
            queryBuilder = queryBuilder.andWhere(
              `entity.${key} ${baseQuery[key]?.value}`
            );
          }
        } else {
          queryBuilder = queryBuilder.andWhere(`entity.${key} = :${key}`, {
            [key]: baseQuery[key],
          });
        }
      });
    }

    // Perform sorting
    if (sort) {
      const [field, order] = sort.split(":");
      queryBuilder = queryBuilder.orderBy(
        `entity.${field}`,
        order.toUpperCase() === "DESC" ? "DESC" : "ASC"
      );
    } else {
      queryBuilder = queryBuilder.orderBy("entity.createdAt", "DESC");
    }

    // Apply pagination
    const totalCount = await queryBuilder.getCount();
    const totalPages = limit > 0 ? Math.ceil(totalCount / limit) : 1;
    if (limit > 0) {
      queryBuilder = queryBuilder.skip((page - 1) * limit).take(limit);
    }

    // Select fields (Optional)
    if (select) {
      let selectFields = [];
      try {
        selectFields = JSON.parse(select);
        if (!Array.isArray(selectFields)) {
          throw new Error("Select parameter should be an array.");
        }
      } catch (error) {
        console.error("Error parsing select parameter:", error.message);
        throw new Error("Invalid select parameter format.");
      }

      const entityMetadata = queryBuilder.connection.getMetadata(entityName);
      const validFields = entityMetadata.columns.map((col) => col.propertyName);

      selectFields.forEach((field) => {
        if (!validFields.includes(field)) {
          console.warn(`Field "${field}" is not a valid column in the entity.`);
        }
      });

      queryBuilder = queryBuilder.select(
        selectFields.map((field) => `entity.${field}`)
      );
    }

    const list = await queryBuilder.getMany();

    return {
      list,
      currentPage: page,
      totalPages,
      totalCount,
    };
  } catch (error) {
    console.log("🚀 -----------------🚀");
    console.log("🚀 ~ error:", error);
    console.log("🚀 -----------------🚀");
    throw new Error("An error occurred while processing the request.");
  }
};

module.exports = {
  HandleMongoDBList,
  HandleMySqlList,
};
