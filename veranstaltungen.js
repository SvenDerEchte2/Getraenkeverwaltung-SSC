let calendar;
let selectedEvent = null;
let activeEdit = null;

document.addEventListener("DOMContentLoaded", () => {
  initCalendar();

  document
    .getElementById("new-event-btn")
    .addEventListener("click", () => {
      createEmptyEvent();
    });

  document
    .getElementById("refresh-calendar-btn")
    .addEventListener("click", () => {
      reloadEvents();
    });
});

async function initCalendar() {

  const calendarEl = document.getElementById("calendar");

  calendar = new FullCalendar.Calendar(calendarEl, {

    initialView: "dayGridMonth",
    locale: "de",
    height: "auto",

    dateClick(info) {
      createEmptyEvent(info.dateStr);
    },

    eventClick(info) {
      loadEventDetails(String(info.event.id));
    }

  });

  calendar.render();

  await reloadEvents();
}

async function reloadEvents() {

  const { data, error } = await supabaseClient
    .from("events")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  calendar.removeAllEvents();

  const events = data.map(ev => ({
    id: ev.id,
    title: ev.title,
    start: ev.event_time
      ? `${ev.event_date}T${ev.event_time}`
      : ev.event_date
  }));

  calendar.addEventSource(events);
}

async function createEmptyEvent(date = null) {

  const eventDate =
    date || new Date().toISOString().split("T")[0];

  const { data, error } = await supabaseClient
    .from("events")
    .insert({
      title: "Neues Event",
      event_date: eventDate,
      event_time: null,
      expected_visitors: 0,
      description: ""
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return;
  }

  // 👉 ERST NACH ERFOLG
  const { error: listError } = await supabaseClient
    .from("shopping_lists")
    .insert({
      name: data.title,
      event_id: data.id
    });

  if (listError) {
    console.error(listError);
  }

  await reloadEvents();
  loadEventDetails(data.id);
}

async function loadEventDetails(id) {

  const { data, error } = await supabaseClient
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  selectedEvent = data;

  const box = document.getElementById("event-details");

  box.innerHTML = `
    <div class="event-card">

      ${field("Titel", "title", data.title, id)}
      ${field("Datum", "event_date", data.event_date, id, "date")}
      ${field("Uhrzeit", "event_time", data.event_time, id, "time")}
      ${field("Besucher", "expected_visitors", data.expected_visitors, id, "number")}

      <div class="event-card-actions">
        <button onclick="deleteEvent(${id})">Löschen</button>
      </div>

    </div>
  `;
}

async function saveEvent(id) {

  const title = document.getElementById("ev-title").value;
  const date = document.getElementById("ev-date").value;
  const time = document.getElementById("ev-time").value;
  const visitors = document.getElementById("ev-visitors").value;
  const desc = document.getElementById("ev-desc").value;

  const { error } = await supabaseClient
    .from("events")
    .update({
      title,
      event_date: date,
      event_time: time || null,
      expected_visitors: visitors ? parseInt(visitors) : 0,
      description: desc
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  await reloadEvents();
  loadEventDetails(id);
}

async function deleteEvent(id) {

  const ok = confirm("Veranstaltung wirklich löschen?");
  if (!ok) return;

  const { error: listError } = await supabaseClient
  .from("shopping_lists")
  .delete()
  .eq("event_id", id);

if (listError) {
  console.error(listError);
}

  const { error } = await supabaseClient
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  selectedEvent = null;

  document.getElementById("event-details").innerHTML =
    "<p>Wähle eine Veranstaltung im Kalender aus.</p>";

  await reloadEvents();
}

function field(label, key, value, id, type = "text") {

  return `
    <div style="margin-bottom:10px;">

      <strong>${label}:</strong>

      <span id="${key}-view-${id}">${value ?? "-"}</span>

      <input
        id="${key}-input-${id}"
        type="${type}"
        value="${value ?? ""}"
        style="display:none;">

      <button onclick="editField('${key}', ${id})">✏️</button>
      <button onclick="saveField('${key}', ${id})"
              id="${key}-save-${id}"
              style="display:none;">
        💾
      </button>

    </div>
  `;
}

function editField(key, id) {

  document.getElementById(`${key}-view-${id}`).style.display = "none";
  document.getElementById(`${key}-input-${id}`).style.display = "inline-block";
  document.getElementById(`${key}-save-${id}`).style.display = "inline-block";
}

async function saveField(key, id) {

  const value =
    document.getElementById(`${key}-input-${id}`).value;

  const update = {};
  update[key] = value;

  const { error } = await supabaseClient
    .from("events")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error(error);
    return;
  }

  await reloadEvents();
  loadEventDetails(id);
  activeEdit = null;
}

function editField(key, id) {

  const current = `${key}-${id}`;

  // 🔥 wenn schon aktiv → CANCEL
  if (activeEdit === current) {

    document.getElementById(`${key}-view-${id}`).style.display = "inline";
    document.getElementById(`${key}-input-${id}`).style.display = "none";
    document.getElementById(`${key}-save-${id}`).style.display = "none";

    activeEdit = null;
    return;
  }

  // 🔥 wenn anderes aktiv → vorher schließen
  if (activeEdit) {
    const [oldKey, oldId] = activeEdit.split("-");

    document.getElementById(`${oldKey}-view-${oldId}`).style.display = "inline";
    document.getElementById(`${oldKey}-input-${oldId}`).style.display = "none";
    document.getElementById(`${oldKey}-save-${oldId}`).style.display = "none";
  }

  // 🔥 neues aktivieren
  document.getElementById(`${key}-view-${id}`).style.display = "none";
  document.getElementById(`${key}-input-${id}`).style.display = "inline-block";
  document.getElementById(`${key}-save-${id}`).style.display = "inline-block";

  activeEdit = current;
}