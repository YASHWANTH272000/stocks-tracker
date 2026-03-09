const express = require("express");
const cors = require("cors");
const { getPortfolio } = require("./services/dashboard");

const app = express();
app.use(cors());

app.get("/portfolio", getPortfolio);

app.listen(5000);