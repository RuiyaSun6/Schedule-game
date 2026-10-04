// Quick manual check: npm run test:ai -- "Finish my algorithms assignment and go to the gym today."
import { generateQuestsFromText } from "../services/geminiService.js";

const text = process.argv.slice(2).join(" ") || "Finish my algorithms assignment and go to the gym today.";
const result = await generateQuestsFromText({ id: "demo-user" }, text);
console.log(JSON.stringify(result, null, 2));
