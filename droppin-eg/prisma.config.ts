import { defineConfig } from "@prisma/internals";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  datasources: {
    db: {
      url: `file:${path.join(__dirname, "prisma/dev.sqlite")}`,
    },
  },
});
