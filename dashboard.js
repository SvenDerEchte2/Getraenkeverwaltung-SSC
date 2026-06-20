document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("log-table-body");

  // 1. LOGS holen
  const { data: logs, error: logError } = await supabaseClient
    .from("stock_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (logError) {
    console.error("Log Fehler:", logError);
    return;
  }

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">Keine Einträge</td></tr>`;
    return;
  }

  // 2. Produkt-IDs sammeln
  const productIds = [...new Set(logs.map(l => l.product_id))];

  // 3. Produkte holen
  const { data: products, error: productError } = await supabaseClient
    .from("products")
    .select("id, name")
    .in("id", productIds);

  if (productError) {
    console.error("Product Fehler:", productError);
    return;
  }

  // 4. Map bauen (id → name)
  const productMap = {};
  (products || []).forEach(p => {
    productMap[p.id] = p.name;
  });

  // 5. Tabelle rendern
  tbody.innerHTML = "";

  logs.forEach(log => {
    const tr = document.createElement("tr");

    const date = log.created_at
      ? new Date(log.created_at).toLocaleDateString("de-DE")
      : "-";

    tr.innerHTML = `
      <td>${log.user_id ?? "-"}</td>
      <td>${productMap[log.product_id] ?? "-"}</td>
      <td>${log.change_amount ?? 0}</td>
      <td>${date}</td>
    `;

    tbody.appendChild(tr);
  });
});