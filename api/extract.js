const Anthropic = require("@anthropic-ai/sdk");

const KNOWN_SUPPLIERS = [
  "Pelangi Jaya","GQ Trading","Malmart","A&S Brother",
  "Best Marketing","Navitass","Asia Aquaculture","Coway","Triways",
  "CS Chin Seng Frozen Seafood","LTF","Poseidon Wholesale Trading",
  "Nature Coffee & Tea Marketing","Meat Food","Gemilang Asiamaju",
  "Best Marketing & Distribution","Ultra Green Supplies","A Tube Ice"
];

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

  try {
    const client = new Anthropic({ apiKey });
    const { pages, imageBase64, mediaType } = req.body;

    // Build content blocks — support multiple pages
    const imageBlocks = [];
    if (pages && pages.length > 0) {
      pages.forEach((page, i) => {
        if (pages.length > 1) {
          imageBlocks.push({ type: "text", text: `Page ${i+1} of ${pages.length}:` });
        }
        const mType = page.mediaType || "image/jpeg";
        if (mType === "application/pdf") {
          imageBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: page.b64 } });
        } else {
          imageBlocks.push({ type: "image", source: { type: "base64", media_type: mType, data: page.b64 } });
        }
      });
    } else if (imageBase64) {
      const mType = mediaType || "image/jpeg";
      if (mType === "application/pdf") {
        imageBlocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } });
      } else {
        imageBlocks.push({ type: "image", source: { type: "base64", media_type: mType, data: imageBase64 } });
      }
    } else {
      return res.status(400).json({ error: "No image provided" });
    }

    const isMultiPage = imageBlocks.filter(b => b.type !== "text").length > 1;

    imageBlocks.push({
      type: "text",
      text: `Extract ALL data from ${isMultiPage ? "these invoice pages (combine all pages into one record)" : "this invoice"}. Return ONLY this JSON structure:
{"supplier":"company name","invoice_no":"invoice or DO number","date":"DD/MM/YYYY","items":[{"desc":"item description","qty":"quantity with unit e.g. 5 KG","unit_price":0.00,"amount":0.00}],"total":0.00,"notes":"payment terms or bank info"}

IMPORTANT rules:
- ${isMultiPage ? "Combine ALL line items from ALL pages into the items array" : "Extract all line items"}
- total: use the FINAL total from the last page, not subtotals
- unit_price: price per unit — look for columns: Price/Unit, Unit Price, U/Price, Harga Seunit, @
- qty: include the unit (KG, Pack, CTN, BTL, pcs etc.)
- date format must be DD/MM/YYYY
- all prices are numbers not strings
- max 20 items
- Known suppliers: ${KNOWN_SUPPLIERS.join(", ")}`
    });

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: "You are an invoice OCR tool for a Malaysian F&B restaurant group. Respond with ONLY a raw JSON object. No markdown, no code fences, no explanation. Start with { and end with }.",
      messages: [{ role: "user", content: imageBlocks }]
    });

    const rawText = message.content.map(b => b.text || "").join("");
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(422).json({ error: "Could not parse invoice", raw: rawText.slice(0,200) });
    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json({ success: true, data: parsed });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
