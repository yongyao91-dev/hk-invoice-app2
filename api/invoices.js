const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://dlkyyifvpmfcglqvbrdy.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsa3l5aWZ2cG1mY2dscXZicmR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNTAzMTksImV4cCI6MjA5MTcyNjMxOX0.sTIodEMrWaeCHDJEwhIJurJdEy3iRlBqGEzmVJKHY_Q";

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("saved_at", { ascending: false });
      if (error) throw error;
      return res.status(200).json({ success: true, data });
    }

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
