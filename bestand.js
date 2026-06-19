let selectedProduct = null;
let results = [];
let activeIndex = -1;

document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("product-search");
  const resultsBox = document.getElementById("search-results");
  const form = document.querySelector("form");

  // 🔎 Suche mit Input
  input.addEventListener("input", async (e) => {
    const query = e.target.value.trim();

    selectedProduct = null;
    activeIndex = -1;

    if (query.length < 2) {
      resultsBox.innerHTML = "";
      return;
    }

    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .ilike("name", `%${query}%`)
      .limit(8);

    if (error) {
      console.error(error);
      return;
    }

    results = data;
    renderResults(resultsBox, results);
  });

  // ⌨️ Tastatur Navigation
  input.addEventListener("keydown", (e) => {
    const items = document.querySelectorAll(".result-item");

    if (!items.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, items.length - 1);
      updateActive(items);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive(items);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0) {
        items[activeIndex].click();
      }
    }
  });

  // 💾 Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      alert("Bitte Produkt auswählen");
      return;
    }

    const qty = parseInt(document.getElementById("quantity").value);
    const action = document.getElementById("action").value;

    let newStock = selectedProduct.stock;

    if (action === "add") {
      newStock += qty;
    } else {
      newStock = qty;
    }

    const { error } = await supabaseClient
      .from("products")
      .update({ stock: newStock })
      .eq("id", selectedProduct.id);

    if (error) {
      console.error(error);
      alert("Fehler beim Speichern");
      return;
    }

    alert("Gespeichert!");

    // reset
    selectedProduct = null;
    input.value = "";
    document.getElementById("quantity").value = "";
    document.getElementById("search-results").innerHTML = "";
    clearPreview();
  });
});

// 🧱 Render Liste
function renderResults(container, data) {
  container.innerHTML = "";

  data.forEach((item, index) => {
    const div = document.createElement("div");
    div.classList.add("result-item");
    div.textContent = `${item.name} (${item.stock} ${item.unit})`;

    div.addEventListener("click", () => {
      selectProduct(item);
    });

    container.appendChild(div);
  });

  activeIndex = -1;
}

// 🎯 Auswahl
function selectProduct(product) {
  selectedProduct = product;

  document.getElementById("product-search").value = product.name;
  document.getElementById("search-results").innerHTML = "";

  renderPreview(product);
}

// ⬆️⬇️ Highlight
function updateActive(items) {
  items.forEach((el, i) => {
    el.classList.toggle("active", i === activeIndex);
  });
}

function renderPreview(product) {
  const box = document.getElementById("product-preview");

  box.innerHTML = `
    <div class="preview-row">

      <img 
        src="${product.image_url || ''}" 
        class="preview-thumb"
        onerror="this.style.display='none'"
      />

      <div class="preview-info">
        <div class="preview-name">${product.name}</div>
        <div class="preview-stock">
          ${product.stock} ${product.unit}
        </div>
      </div>

    </div>
  `;
}

function clearPreview() {
  const box = document.getElementById("product-preview");

  box.innerHTML = `<p class="empty">Kein Produkt ausgewählt</p>`;
}