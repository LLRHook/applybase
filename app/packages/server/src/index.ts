import "dotenv/config";
import { getConfig } from "./lib/config.js";
import { getDb } from "./db/client.js";
import { createApp } from "./app.js";

const config = getConfig();
const db = getDb();
const app = createApp(db);

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});
