import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    // Explicit path: Tailwind otherwise looks for its config in the process cwd.
    tailwindcss: { config: path.join(dirname, "tailwind.config.ts") },
    autoprefixer: {},
  },
};
