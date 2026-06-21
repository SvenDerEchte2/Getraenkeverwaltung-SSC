let allProducts = [];

document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  loadCategories();

  document
    .getElementById("category-filter")
    .addEventListener("change", (e) => {
      filterByCategory(e.target.value);
    });
});

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  allProducts = data;      // 👈 WICHTIG speichern
  renderTable(allProducts);
}

function renderTable(data) {
  const tbody = document.getElementById("table-body");
  if (!tbody) return;

  tbody.innerHTML = "";

  data.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.unit}</td>
      <td>${item.stock}</td>
    `;

    tbody.appendChild(row);
  });
}

async function loadCategories() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("category");

  if (error) {
    console.error(error);
    return;
  }

  const uniqueCategories = [...new Set(data.map(item => item.category))];

  const select = document.getElementById("category-filter");

  select.innerHTML = `<option value="">Alle</option>`;

  uniqueCategories.forEach(cat => {
    if (!cat) return;

    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);

    select.appendChild(option);
  });
}

function filterByCategory(category) {
  if (!category) {
    renderTable(allProducts);
    return;
  }

  const filtered = allProducts.filter(item => item.category === category);
  renderTable(filtered);
}