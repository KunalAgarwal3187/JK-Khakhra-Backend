import "dotenv/config";
import app from "./app.js";
import { warmupDatabase } from "./lib/prisma.js";
const PORT = Number(process.env.PORT || 5000);
if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
        void warmupDatabase();
    });
}
export default app;
