const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const cors = require("cors");

const corsRouter = require("./routes/cors.js");
const productsRouter = require("./routes/products.js");
const usersRouter = require("./routes/userRoutes.js");
const globalErrorController = require("./controllers/errorController.js");

const port = process.env.PORT || 4000;
const dev = process.env.NODE_ENV !== "production";

if (dev) require("dotenv").config();

const limiter = rateLimit({
  // 50 requests per minute
  max: 50,
  windowMs: 60 * 1000,
  message: "Too many requests from this IP, please try again in a minute",
});

// DB
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("connected to mongoose"));

// express
const server = express();

server.use("/api", limiter);
server.use(cookieParser());
server.use(express.json());
server.use(cors());
server.use(mongoSanitize());
server.use(xss());

server.use("/api/cors", corsRouter);
server.use("/api/products", productsRouter);
server.use("/api/users", usersRouter);

// Global error handling middleware
server.use(globalErrorController);

server.listen(port, (err) => {
  if (err) throw err;
  console.log(`> Ready on http://localhost:${port}`);
});
