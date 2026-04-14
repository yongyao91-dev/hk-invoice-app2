const { createClient } = require("@supabase/supabase-js");

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const supabase = getSupabase();

    // GET — fetch all invoices
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

    // POST — save new invoice
    if (req.method === "POST") {
      const invoice = req.body;
      if (!invoice) return res.status(400).json({ error: "No data" });
      const { data, error } = await supabase
        .from("invoices")
        .insert([{
          outlet: invoice.outlet,
          supplier: invoice.supplier,
          invoice_no: invoice.invoice_no,
          date: invoice.date,
          items: invoice.items,
          total: invoice.total,
          notes: invoice.notes,
          saved_at: new Date().toISOString()
        }])
        .select();
      if (error) throw error;
      return res.status(200).json({ success: true, data: data[0] });
    }

    // DELETE — delete invoice by id
    if (req.method === "DELETE") {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "No id" });
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
