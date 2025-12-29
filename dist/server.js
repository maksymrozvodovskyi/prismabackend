"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const app_1 = require("./app");
const getEnvVar_1 = require("./utils/getEnvVar");
const PORT = Number((0, getEnvVar_1.getEnvVar)("PORT", 3000));
app_1.app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
