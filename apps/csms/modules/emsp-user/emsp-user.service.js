const {
  EMspRepository,
  UserRepository,
  EMspUserRepository,
  DepartmentRepository,
} = require("@shared-libs/db/mysql");

const addEmspUser = async (req, res) => {
  try {
    const loggedinUser = req.user;
    const { email } = req.body;

    // check for existing user
    const existingCpo = EMspRepository.findOne({
      where: { email },
      select: ["id"],
    });
    if (existingCpo) {
      return res
        .status(400)
        .json({ message: "Email already exists in the system!" });
    }
    const existingSuperAdmin = UserRepository.findOne({ where: { email } });
    if (existingSuperAdmin) {
      return res
        .status(400)
        .json({ message: "Email already exists in the system!" });
    }
    const departmentId = await DepartmentRepository.findOne({
      where: { id: req.body.departmentId },
    });
    if (!departmentId) {
      return res.status(404).json({ message: "Department not found!" });
    }
    const emspUser = await EMspUserRepository.create({
      ...req.body,
      emspId: loggedinUser.emspId,
    });
    return res.status(201).json(emspUser);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("Error in add emsp:", error);
    res.status(500).json({
      message: "An Error Occurred While Adding The Emsp",
      error: error.message,
    });
  } finally {
    await queryRunner.release();
  }
};

const updateEmspUser = async (req, res) => {
  try {
    const loggedinUser = req.user;
    const { emspUserId } = req.params;
    const { email, departmentId, ...updateData } = req.body;

    if (!emspUserId) {
      return res
        .status(400)
        .json({ message: "User ID is required for update." });
    }

    // Check if user exists and belongs to the same emsp
    const existingUser = await EMspUserRepository.findOne({
      where: { id: emspUserId, emspId: loggedinUser.emspId },
    });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // If email is being updated, check for duplicates
    if (email && email !== existingUser.email) {
      const emailExistsInEMsp = await EMspRepository.findOne({
        where: { email },
      });
      const emailExistsInSuperAdmin = await UserRepository.findOne({
        where: { email },
      });

      if (emailExistsInEMsp || emailExistsInSuperAdmin) {
        return res
          .status(400)
          .json({ message: "Email already exists in the system!" });
      }
    }

    // If departmentId is provided, validate it
    if (departmentId) {
      const department = await DepartmentRepository.findOne({
        where: { emspUserId: departmentId },
      });
      if (!department) {
        return res.status(404).json({ message: "Department not found!" });
      }
    }

    // Update user
    const updatedUser = await EMspUserRepository.save({
      ...existingUser,
      email: email || existingUser.email,
      departmentId: departmentId || existingUser.departmentId,
      ...updateData,
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in update emsp:", error);
    return res.status(500).json({
      message: "An Error Occurred While Updating The Emsp",
      error: error.message,
    });
  }
};

const deleteEmspUser = async (req, res) => {
  try {
    const loggedinUser = req.user;
    const { emspUserId } = req.params;

    if (!emspUserId) {
      return res
        .status(400)
        .json({ message: "User ID is required for deletion." });
    }

    // Check if the user exists and belongs to the logged-in EMSP
    const existingUser = await EMspUserRepository.findOne({
      where: { id: emspUserId, emspId: loggedinUser.emspId },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Soft delete: set isDeleted = true
    existingUser.isDeleted = true;
    await EMspUserRepository.save(existingUser);

    return res
      .status(200)
      .json({ message: "User deleted successfully (soft delete)." });
  } catch (error) {
    console.error("Error in deleting emsp user:", error);
    return res.status(500).json({
      message: "An Error Occurred While Deleting The Emsp User",
      error: error.message,
    });
  }
};

module.exports = {
  addEmspUser,
  updateEmspUser,
  deleteEmspUser,
};
