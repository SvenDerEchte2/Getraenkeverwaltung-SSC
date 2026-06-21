document.addEventListener("DOMContentLoaded", async () => {
  const tbody = document.getElementById("log-table-body");

  // 1. Activity Logs holen
  const { data: logs, error: logError } = await supabaseClient
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (logError) {
    console.error("Log Fehler:", logError);
    return;
  }

  if (!logs || logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Keine Einträge</td></tr>`;
    return;
  }

  // 2. Tabelle rendern
  tbody.innerHTML = "";

  logs.forEach(log => {
    const tr = document.createElement("tr");

    const date = log.created_at
      ? new Date(log.created_at).toLocaleDateString("de-DE")
      : "-";

    const detailsText = log.details
      ? JSON.stringify(log.details)
      : "-";

    tr.innerHTML = `
      <td>${log.user_id ?? "-"}</td>
      <td>${log.action ?? "-"}</td>
      <td>${log.table_name ?? "-"}</td>
      <td>${log.record_id ?? "-"}</td>
      <td>${date}</td>
      <td>${detailsText}</td>
    `;

    tbody.appendChild(tr);
  });
});