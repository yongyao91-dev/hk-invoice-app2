const Anthropic = require("@anthropic-ai/sdk");

const KNOWN_SUPPLIERS = [
  "Pelangi Jaya","GQ Trading","Malmart","A&S Brother",
  "Best Marketing","Navitass","Asia Aquaculture","Coway","Triways",
  "CS Chin Seng Frozen Seafood","LTF"
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
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "No image provided" });

    const validTypes = ["image/jpeg","image/png","image/gif","image/webp","application/pdf"];
    const mType = validTypes.includes(mediaType) ? mediaType : "image/jpeg";

    const contentBlock = mType === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: imageBase64 } }
      : { type: "image", source: { type: "base64", media_type: mType, data: imageBase64 } };

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: "You are an invoice OCR tool for a Malaysian F&B restaurant group. Respond with ONLY a raw JSON object. No markdown, no code fences, no explanation. Start with { and end with }.",
      messages: [{
        role: "user",
        content: [
          contentBlock,
          { type: "text", text: `Extract ALL data from this invoice image carefully. Return ONLY this JSON structure:
{"supplier":"company name","invoice_no":"invoice or DO number","date":"DD/MM/YYYY","items":[{"desc":"item description","qty":"quantity with unit e.g. 5 KG","unit_price":0.00,"amount":0.00}],"total":0.00,"notes":"payment terms or bank info"}

IMPORTANT rules:
- unit_price: the price per unit (e.g. price per KG, per pack, per piece) — look for columns labeled Price/Unit, Unit Price, Harga Seunit, @, or similar
- amount: the total cost for that line item (qty x unit_price)
- If unit_price column exists, always read it even if you have to calculate it
- qty: include the unit (KG, Pack, CTN, pcs etc.)
- date format must be DD/MM/YYYY
- all prices are numbers not strings
- max 15 items
- Known suppliers to match: ${KNOWN_SUPPLIERS.join(", ")}` }
        ]
      }]
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
