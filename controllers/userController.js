const User = require("../models/userModel");
const catchAsync = require("../backLib/catchAsync");
const AppError = require("../backLib/appError.js");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

module.exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});
module.exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMypassword",
        400
      )
    );
  // Filter out unwanted fields names like roles
  const filteredBody = filterObj(req.body, "email");

  const updatedUser = await User.updateOne(
    { _id: req.user.id },
    {
      $set: filteredBody,
    }
  );
  res.status(200).json({ status: "success", data: { user: updatedUser } });
});
module.exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.updateOne(
    { _id: req.user.id },
    {
      $set: { active: false }
    }
  );
  res.status(204).json({
      status:'success',
      data:null
  })
});
