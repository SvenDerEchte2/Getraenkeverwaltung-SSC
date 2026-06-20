async function loadLists() {
  const container = document.getElementById("lists");

  const { data, error } = await supabaseClient
    .from("shopping_lists")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  container.innerHTML = "";

  data.forEach(list => {
    const div = document.createElement("div");
    div.classList.add("list-item");

    div.innerHTML = `
      <span>${list.name}</span>
      <button onclick="openList(${list.id})">Öffnen</button>
    `;

    container.appendChild(div);
  });
}

async function createList() {
  const name = prompt("Name der Einkaufsliste:");

  if (!name) return;

  const { error } = await supabaseClient
    .from("shopping_lists")
    .insert({ name });

  if (error) {
    console.error(error);
    return;
  }

  loadLists();
}

function openList(id) {
  activeList = id;

  document.getElementById("active-list-title")
    .innerText = "Liste #" + id;

  loadListItems(id);
}

async function loadListItems(listId) {
  const tbody = document.getElementById("list-items");

  const { data, error } = await supabaseClient
    .from("shopping_list_items")
    .select("*")
    .eq("list_id", listId);

  if (error) {
    console.error(error);
    return;
  }

  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="2">Keine Produkte</td></tr>`;
    return;
  }

  data.forEach(item => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.product_name ?? item.product_id}</td>
      <td>${item.quantity}</td>
    `;

    tbody.appendChild(tr);
  });
}

function setupSearch() {
  const input = document.getElementById("product-search");
  const box = document.getElementById("search-results");

  input.addEventListener("input", async (e) => {
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
      console.error(error);
      return;
    }

    box.innerHTML = "";

    data.forEach(product => {
      const div = document.createElement("div");
      div.classList.add("result-item");

      div.textContent = product.name;

      div.onclick = () => {
        selectedProduct = product;
        input.value = product.name;
        box.innerHTML = "";
      };

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
    alert("Kein Produkt gewählt");
    return;
  }

  const qty = document.getElementById("quantity").value;

  if (!qty || qty <= 0) {
    alert("Ungültige Menge");
    return;
  }

  const { error } = await supabaseClient
    .from("shopping_list_items")
    .insert({
      list_id: activeList,
      product_id: selectedProduct.id,
      quantity: parseInt(qty)
    });

  if (error) {
    console.error(error);
    return;
  }

  loadListItems(activeList);

  document.getElementById("quantity").value = "";
}