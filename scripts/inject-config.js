// Writes /config.js at build time so the public anon Supabase credentials
// (safe to expose client-side) are available to the browser without being
// committed to git.
import fs from "fs";

const url = process.env.SUPABASE_URL || "";
const anonKey = process.env.SUPABASE_ANON_KEY || "";

const contents = `window.ETHEREAL_SUPABASE = ${JSON.stringify({ url, anonKey })};\n`;

fs.writeFileSync(new URL("../config.js", import.meta.url), contents);
console.log("Wrote config.js");
