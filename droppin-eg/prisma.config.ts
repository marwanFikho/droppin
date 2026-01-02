import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  datasources: {
    db: {
      url: `file:${path.resolve(__dirname, "prisma/dev.sqlite")}`,
    },
  },
};
