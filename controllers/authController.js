const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../backLib/appError.js");
const catchAsync = require("../backLib/catchAsync");
// const sendEmail = require("../backLib/sendEmail");
const Email = require("../backLib/sendEmail");

const signToken = (email) => {
  return jwt.sign({ email: email }, process.env.JWT_SECRET, {
    expiresIn: 7200,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.email);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", "Bearer " + token, cookieOptions);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    // token: "Bearer " + token,
    ...user,
  });
};
module.exports.signup = catchAsync(async (req, res, next) => {
  try {
    const exist = await User.findOne({ email: req.body.email });
    if (exist)
      return next(new AppError("Email already assigned to an account.", 400));
    const { email, _id } = await User.create({
      email: req.body.email,
      password: req.body.password,
      // role: ["admin"],
    });
    return res.status(201).json({ message: "registed", email, _id });
  } catch (error) {
    return next(new AppError("Couldn't create the user", 400));
  }
});
module.exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const exist = await User.findOne({ email }).select("+password");

  // console.log(exist,req.body)

  if (!exist || !(await exist.correctPassword(password, exist.password)))
    return next(new AppError("Invalid email or password", 401));

  const token = signToken(exist.email);

  createSendToken(
    {
      message: "loggedIn",
      email: exist.email,
      role: exist.role,
      // token: "Bearer " + token,
    },
    200,
    res
  );

  // return res.json({
  //   message: "Successfully loggedIn",
  //   username: exist.email,
  //   role: exist.role,
  //   token: "Bearer " + token,
  // });
});
module.exports.verifyJWT = catchAsync(async (req, res, next) => {
  // console.log('Cookies: ', req.cookies.jwt)
  const token = req.cookies.jwt?.split(" ")[1];
  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findOne({ email: decoded.email });

  if (!currentUser)
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  req.user = {};
  req.user.id = currentUser._id;
  req.user.username = currentUser.email;
  req.user.role = currentUser.role;
  next();
});
module.exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    let isAllowed = false;
    req.user.role.map((role) => {
      if (roles.includes(role)) isAllowed = true;
    });
    isAllowed ? next() : next(new AppError("You are not an allowed!", 403));
  });
};
module.exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return new AppError("There is no user with that email address.", 404);

  const resetToken = user.createPasswordResetToken();
  await user.save();

  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/passwordReset?t=${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
    // await sendEmail(
    //   user.email,
    //   "Password reset link, (valid for 10min)",
    //   resetURL
    // );
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.save();
    return next(new AppError("There was an Error sending the email", 500));
  }
  res.status(200).json({ message: "Sent" });
});
module.exports.resetPassword = catchAsync(async (req, res, next) => {
  // encrypt the received token and compare it to the one in the DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Token is invalid or has expired", 400));
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExipres = undefined;
  user.save();
  res.status(200).json({ msg: "password reset sucessfully." });
});
module.exports.updatePassword = catchAsync(async (req, res, next) => {
  //user have to send the username in the token and the password
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError("Password incorrect", 401));
  user.password = req.body.passwordNew;
  await user.save();
  const token = signToken(req.user.email);

  res.status(200).json({
    msg: "Password updated",
    username: req.user.email,
    role: req.user.role,
    token: "Bearer " + token,
  });
});
