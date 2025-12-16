import "dotenv/config";

import { app } from "./app";
import { getEnvVar } from "./utils/getEnvVar";

const PORT = Number(getEnvVar("PORT", 3000));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
