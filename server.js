import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Serve all files in the current directory
app.use(express.static(__dirname));

// Fallback for SPAs: send index.html for any request that doesn't match a file
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Listening on http://0.0.0.0:${PORT}`);
});
