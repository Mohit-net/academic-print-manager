const mongoose = require("mongoose");

const validateObjectId = (parameter = "id") => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params[parameter])) {
    return res.status(400).json({
      success: false,
      message: `Invalid ${parameter}`,
    });
  }

  next();
};

module.exports = validateObjectId;
