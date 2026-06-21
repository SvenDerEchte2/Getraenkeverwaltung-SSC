async function addLog(action, table, recordId, details = {}) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();

    await supabaseClient
      .from("activity_log")
      .insert({
        user_id: user?.id ?? null,
        action,
        table_name: table,
        record_id: recordId,
        details
      });

  } catch (err) {
    console.error("Log Fehler:", err);
  }
}

let activeList = null;
let selectedProduct = null;

document.addEventListener("DOMContentLoaded", () => {
  loadLists();
  setupSearch();

  document
    .getElementById("create-list-btn")
    .addEventListener("click", createList);

  document
    .getElementById("add-product-btn")
    .addEventListener("click", addProductToList);

  document
    .getElementById("print-list-btn")
    .addEventListener("click", printCurrentList);
});

async function loadLists() {
  const container = document.getElementById("lists");

  const { data, error } = await supabaseClient
    .from("shopping_lists")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Listen:", error);
    return;
  }

  container.innerHTML = "";

  if (!data.length) {
    container.innerHTML = "<p>Keine Listen vorhanden.</p>";
    return;
  }

data.forEach(list => {
  const div = document.createElement("div");
  div.classList.add("list-item");

  const name = document.createElement("span");
  name.textContent = list.name;

  // Öffnen
  const openBtn = document.createElement("button");
  openBtn.textContent = "Öffnen";
  openBtn.addEventListener("click", () => openList(list.id));

  // Löschen
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "🗑";
  deleteBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    await deleteList(list.id);
  });

  // Drucken
  const printBtn = document.createElement("button");
  printBtn.textContent = "🖨";
  printBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openList(list.id);
    setTimeout(() => printCurrentList(), 200);
  });

  const btnBox = document.createElement("div");
  btnBox.classList.add("list-actions");

  btnBox.appendChild(openBtn);
  btnBox.appendChild(printBtn);
  btnBox.appendChild(deleteBtn);

  div.appendChild(name);
  div.appendChild(btnBox);

  container.appendChild(div);
});
}

async function createList() {
  const name = prompt("Name der Einkaufsliste:");

  if (!name) return;

  const { error } = await supabaseClient
    .from("shopping_lists")
    .insert({
      name: name
    });

  if (error) {
    console.error("Fehler beim Erstellen:", error);
    return;
  }

  await addLog(
  "CREATE_LIST",
  "shopping_lists",
  null,
  { name }
);

  loadLists();
}

function openList(id) {
  activeList = id;

  document.getElementById(
    "active-list-title"
  ).innerText = `Liste #${id}`;

  loadListItems(id);
}

async function loadListItems(listId) {
  const tbody = document.getElementById("list-items");

  const { data, error } = await supabaseClient
  .from("shopping_list_items")
  .select(`
    id,
    quantity,
    checked,
    products (
      company,
      name,
      unit,
      fill,
      category,
      article_number
    )
  `)
  .eq("list_id", listId);

  if (error) {
    console.error("Fehler beim Laden der Produkte:", error);
    return;
  }

  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML =
      '<tr><td colspan="2">Keine Produkte</td></tr>';
    return;
  }

data.forEach(item => {
  const p = item.products;

  const tr = document.createElement("tr");

  if (item.checked) {
    tr.classList.add("checked-item");
  }

  tr.innerHTML = `
    <td>
      <input type="checkbox"
        ${item.checked ? "checked" : ""}
        onchange="toggleItem(${item.id}, this.checked)">
    </td>

    <td>${p?.company ?? "-"}</td>
    <td>${p?.name ?? "-"}</td>
    <td>${p?.fill ?? "-"} ${p?.unit ?? ""}</td>
    <td>${p?.category ?? "-"}</td>
    <td>${p?.article_number ?? "-"}</td>

    <td>${item.quantity} ${item.quantity_unit ?? "Stück"}</td>

    <td>
      <button class="delete-btn"
        onclick="deleteItem(${item.id})">
        🗑
      </button>
    </td>
  `;

  tbody.appendChild(tr);
});
}

function setupSearch() {
  const input = document.getElementById("product-search");
  const box = document.getElementById("search-results");

  input.addEventListener("input", async e => {
    const query = e.target.value.trim();

    selectedProduct = null;

    if (query.length < 2) {
      box.innerHTML = "";
      return;
    }

    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(6);

    if (error) {
      console.error("Fehler bei Produktsuche:", error);
      return;
    }

    box.innerHTML = "";

    data.forEach(product => {
      const div = document.createElement("div");
      div.classList.add("result-item");

      div.textContent = product.name;

      div.addEventListener("click", () => {
        selectedProduct = product;
        input.value = product.name;
        box.innerHTML = "";
      });

      box.appendChild(div);
    });
  });
}

async function addProductToList() {
  if (!activeList) {
    alert("Keine Liste ausgewählt");
    return;
  }

  if (!selectedProduct) {
    alert("Kein Produkt ausgewählt");
    return;
  }

  const unit = document.getElementById("quantity-unit").value;
  const qty = parseInt(document.getElementById("quantity").value);

  if (!qty || qty <= 0) {
    alert("Ungültige Menge");
    return;
  }

  // 🔥 WICHTIG: vorher sichern
  const productId = selectedProduct.id;

  const { error } = await supabaseClient
    .from("shopping_list_items")
    .insert({
      list_id: activeList,
      product_id: productId,
      quantity: qty,
      quantity_unit: unit
    });

  if (error) {
    console.error("Fehler beim Hinzufügen:", error);
    return;
  }

  await addLog(
    "ADD_ITEM",
    "shopping_list_items",
    null,
    {
      list: activeList,
      product: productId,
      qty,
      unit
    }
  );

  document.getElementById("product-search").value = "";
  document.getElementById("quantity").value = "";
  selectedProduct = null;

  loadListItems(activeList);
}

async function toggleItem(id, checked) {
  const { error } = await supabaseClient
    .from("shopping_list_items")
    .update({
      checked: checked
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  await addLog(
  "TOGGLE_ITEM",
  "shopping_list_items",
  id,
  { checked }
);

  loadListItems(activeList);
}

async function deleteItem(id) {
  const ok = confirm(
    "Produkt wirklich löschen?"
  );

  if (!ok) return;

  const { error } = await supabaseClient
    .from("shopping_list_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  await addLog(
  "DELETE_ITEM",
  "shopping_list_items",
  id,
  { list: activeList }
);

  loadListItems(activeList);
  
}

async function deleteList(id) {
  const ok = confirm(
    "Diese Einkaufsliste inklusive aller Produkte löschen?"
  );

  if (!ok) return;

  // zuerst Einträge löschen
  let { error } = await supabaseClient
    .from("shopping_list_items")
    .delete()
    .eq("list_id", id);

  if (error) {
    console.error(error);
    return;
  }

  // dann Liste löschen
  ({ error } = await supabaseClient
    .from("shopping_lists")
    .delete()
    .eq("id", id));

  if (error) {
    console.error(error);
    return;
  }

  await addLog(
  "DELETE_LIST",
  "shopping_lists",
  id,
  {}
);

  if (activeList === id) {
    activeList = null;

    document.getElementById("active-list-title")
      .innerText = "Keine Liste ausgewählt";

    document.getElementById("list-items").innerHTML =
      '<tr><td colspan="4">Keine Liste ausgewählt</td></tr>';
  }

  loadLists();
}

function printCurrentList() {
  if (!activeList) {
    alert("Keine Liste ausgewählt");
    return;
  }

  const title =
    document.getElementById("active-list-title").innerText;

  const rows = document.querySelectorAll("#list-items tr");

  let htmlRows = "";

  rows.forEach(row => {
    const checkbox = row.querySelector("input[type='checkbox']");
    if (checkbox && checkbox.checked) return;

    const cells = row.querySelectorAll("td");
    if (cells.length < 8) return;

    const company = cells[1].textContent;
    const name = cells[2].textContent;
    const fill = cells[3].textContent;
    const category = cells[4].textContent;
    const article = cells[5].textContent;
    const qty = cells[6].textContent;

    htmlRows += `
      <tr>
        <td style="text-align:center; font-size:18px;">☐</td>
        <td>${company}</td>
        <td>${name}</td>
        <td>${fill}</td>
        <td>${category}</td>
        <td>${article}</td>
        <td>${qty}</td>
      </tr>
    `;
  });

  const win = window.open("", "_blank");

  win.document.write(`
    <html>
      <head>
        <title>Getränkeverwaltung Staufener SC</title>
        <style>
          body {
            font-family: Arial;
            padding: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            font-size: 12px;
          }

          th {
            background: #eee;
          }
        </style>
      </head>

      <body>
        <h2>${title}</h2>

        <table>
          <thead>
            <tr>
              <th>✓</th>
              <th>Firma</th>
              <th>Produkt</th>
              <th>Füllmenge</th>
              <th>Kategorie</th>
              <th>Art.-Nr.</th>
              <th>Menge</th>
            </tr>
          </thead>

          <tbody>
            ${htmlRows}
          </tbody>
        </table>
      </body>
    </html>
  `);

  win.document.close();
  win.print();
}