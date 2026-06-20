let selectedProduct = null;
let results = [];
let activeIndex = -1;

document.addEventListener("DOMContentLoaded", () => {

  const input = document.getElementById("product-search");
  const resultsBox = document.getElementById("search-results");

  clearPreview();

  // Suche
  input.addEventListener("input", async (e) => {

    const query = e.target.value.trim();

    selectedProduct = null;
    activeIndex = -1;

    if (query.length < 2) {
      resultsBox.innerHTML = "";
      clearPreview();
      return;
    }

    const { data, error } = await supabaseClient
      .from("products")
      .select("*")
      .or(`name.ilike.%${query}%,article_number.eq.${query}`)
      .order("name", { ascending: true })
      .limit(10);

    if (error) {
      console.error("Fehler bei der Suche:", error);
      return;
    }

    results = data || [];

    renderResults(resultsBox, results);

  });

  // Tastatursteuerung
  input.addEventListener("keydown", (e) => {

    const items = document.querySelectorAll(".result-item");

    if (!items.length) return;

    if (e.key === "ArrowDown") {

      e.preventDefault();

      activeIndex = Math.min(
        activeIndex + 1,
        items.length - 1
      );

      updateActive(items);
    }

    if (e.key === "ArrowUp") {

      e.preventDefault();

      activeIndex = Math.max(
        activeIndex - 1,
        0
      );

      updateActive(items);
    }

    if (e.key === "Enter") {

      e.preventDefault();

      if (activeIndex >= 0) {
        items[activeIndex].click();
      }
    }

  });

});

/* ==========================
   Suchergebnisse rendern
========================== */

function renderResults(container, data) {

  container.innerHTML = "";

  if (!data.length) {

    container.innerHTML = `
      <div class="result-item">
        Keine Produkte gefunden
      </div>
    `;

    return;
  }

  data.forEach((item) => {

    const div = document.createElement("div");

    div.classList.add("result-item");

    div.innerHTML = `
      <strong>${item.name}</strong><br>
      Art.-Nr: ${item.article_number || "-"}
    `;

    div.addEventListener("click", () => {
      selectProduct(item);
    });

    container.appendChild(div);

  });

  activeIndex = -1;
}

/* ==========================
   Produkt auswählen
========================== */

function selectProduct(product) {

  selectedProduct = product;

  document.getElementById("product-search").value =
    product.name;

  document.getElementById("search-results").innerHTML = "";

  renderPreview(product);
}

/* ==========================
   Tastatur Highlight
========================== */

function updateActive(items) {

  items.forEach((item, index) => {

    item.classList.toggle(
      "active",
      index === activeIndex
    );

  });

}

/* ==========================
   Produkt Vorschau
========================== */

function renderPreview(product) {

  const box =
    document.getElementById("product-preview");

  box.innerHTML = `

    <div class="preview-row">

      <img
        src="${product.image_url || ""}"
        class="preview-thumb"
        alt="${product.name}"
        onerror="this.style.display='none'"
      >

      <div class="preview-info">

        <h2>${product.name}</h2>

        <div>
          <strong>Artikelnummer:</strong>
          ${product.article_number || "-"}
        </div>

                <div>
  <strong>Bestand:</strong>
  ${(() => {
    const stock = product.stock || 0;
    const perCrate = product.bottlesincrate || 1;

    const crates = Math.floor(stock / perCrate);
    const bottles = stock % perCrate;

    return `${stock} (${crates} Kisten + ${bottles} Flaschen)`;
  })()}
</div>

        <div>
          <strong>Hersteller:</strong>
          ${product.company || "-"}
        </div>

        <div>
          <strong>Kategorie:</strong>
          ${product.category || "-"}
        </div>

        <div>
          <strong>Füllmenge:</strong>
          ${product.fill || "-"}
          ${product.unit || ""}
        </div>

        <div>
          <strong>Alkohol:</strong>
          ${product.alcohol || "-"}
        </div>

        <div>

        <div>
          <strong>Verkaufspreis:</strong>
          ${product.sale_price ?? "-"} €
        </div>

        <div>
          <strong>Erstellt:</strong>
          ${
            product.created_at
              ? new Date(product.created_at)
                  .toLocaleDateString("de-DE")
              : "-"
          }
        </div>

      </div>

    </div>

  `;
}

/* ==========================
   Leere Vorschau
========================== */

function clearPreview() {

  document.getElementById(
    "product-preview"
  ).innerHTML = `
    <p class="empty">
      Kein Produkt ausgewählt
    </p>
  `;
}