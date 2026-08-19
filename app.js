/* Family Events PWA
 * Backend: Google Apps Script web app backed by a Google Sheet.
 * Set API_URL below after deploying apps-script/Code.gs (see README).
 */

const API_URL = "https://script.google.com/macros/s/AKfycby-ToUBXQ9PKCR5EglIhIS0nEVw96kYRzchWkXrzuKzU2XWb-vF2u2GraOw5fGU_P4y/exec"; // <-- paste your Apps Script Web App URL here

const eventsList = document.getElementById("eventsList");
const addSection = document.getElementById("addSection");
const settingsBtn = document.getElementById("settingsBtn");
const backBtn = document.getElementById("backBtn");
const addForm = document.getElementById("addForm");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

const CACHE_KEY = "familyEvents";
let currentEvents = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");

function setEvents(events) {
  currentEvents = events;
  localStorage.setItem(CACHE_KEY, JSON.stringify(events));
  render(events);
}

// ---------- helpers ----------
function showStatus(msg, isError = false) {
  statusEl.innerHTML = msg;
  statusEl.classList.toggle("error", isError);
  statusEl.classList.remove("hidden");
  clearTimeout(showStatus._t);
  if (!msg.includes("spinner")) {
    showStatus._t = setTimeout(() => statusEl.classList.add("hidden"), 3000);
  }
}
function showSyncing(msg) {
  showStatus(`<span class="spinner"></span>${msg}`);
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function formatTime(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

function dayLabel(dateStr) {
  if (dateStr === todayStr()) return { label: "Today", cls: "today" };
  if (dateStr === todayStr(1)) return { label: "Tomorrow", cls: "tomorrow" };
  const d = new Date(dateStr + "T00:00:00");
  return {
    label: d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }),
    cls: "",
  };
}

// ---------- rendering ----------
// Week-at-a-glance: a card for each of the next 7 days; tap a day to expand
// its events. Anything past 7 days appears in a "Later" section.
function render(events) {
  const upcoming = events
    .filter((e) => e.date >= todayStr())
    .sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));

  const byDate = {};
  for (const e of upcoming) (byDate[e.date] ||= []).push(e);

  let html = "";
  const todayEvents = byDate[todayStr()] || [];
  html += todayEvents.length
    ? ""
    : '<div class="today-banner">Nothing scheduled today — enjoy your day!</div>';
  for (let i = 0; i < 7; i++) {
    const date = todayStr(i);
    const dayEvents = byDate[date] || [];
    const { label, cls } = dayLabel(date);
    const d = new Date(date + "T00:00:00");
    const sub = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const count = dayEvents.length;
    const expanded = count > 0; // any day with events shows them by default
    html += `
      <div class="day-row ${cls} ${count ? "has-events" : "no-events"} ${expanded ? "open" : ""}" data-date="${date}">
        <button class="day-header" ${count ? "" : "disabled"}>
          <span class="day-name">${label}</span>
          <span class="day-sub">${sub}</span>
          <span class="day-count">${count ? `${count} event${count > 1 ? "s" : ""} ▾` : "—"}</span>
        </button>
        <div class="day-events">${dayEvents.map(eventCard).join("")}</div>
      </div>`;
  }

  const later = upcoming.filter((e) => e.date > todayStr(6));
  if (later.length) {
    html += `<div class="later-heading">Later</div>`;
    const groups = {};
    for (const e of later) (groups[e.date] ||= []).push(e);
    for (const date of Object.keys(groups)) {
      const d = new Date(date + "T00:00:00");
      const label = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
      html += `<div class="day-group"><div class="day-heading">${label}</div>${groups[date].map(eventCard).join("")}</div>`;
    }
  }

  eventsList.innerHTML = html || '<p class="empty">No upcoming events.<br>Enjoy the free time!</p>';
}

function eventCard(e) {
  return `
    <div class="event-card">
      <div class="event-title">${escapeHtml(e.title)}</div>
      ${e.time ? `<div class="event-time">${formatTime(e.time)}</div>` : ""}
      ${e.notes ? `<div class="event-notes">${escapeHtml(e.notes)}</div>` : ""}
      <button class="event-delete" data-id="${e.id}">Remove</button>
    </div>`;
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s || "";
  return div.innerHTML;
}

// Normalize event fields in case the backend returns raw Date strings
function normalizeEvent(e) {
  let date = e.date || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date(date);
    if (!isNaN(d)) {
      date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }
  }
  let time = e.time || "";
  if (time && !/^\d{2}:\d{2}$/.test(time)) {
    const t = new Date(time);
    time = isNaN(t) ? "" : `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  return { ...e, date, time };
}

// ---------- data ----------
async function loadEvents({ silent = false } = {}) {
  // Show cached data immediately
  if (currentEvents.length) render(currentEvents);

  if (!API_URL) {
    if (!currentEvents.length) eventsList.innerHTML = '<p class="empty">App not connected yet.<br>See README to set the API URL.</p>';
    return;
  }

  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    const events = (data.events || []).map(normalizeEvent);
    setEvents(events);
  } catch (err) {
    if (!silent) showStatus("Couldn't reach the server — showing saved events.", true);
  }
}

async function addEvent(event) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "add", ...event }),
  });
  return res.json();
}

async function deleteEvent(id) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ action: "delete", id }),
  });
  return res.json();
}

// ---------- events ----------
function showAddForm(show) {
  addSection.classList.toggle("hidden", !show);
  eventsList.classList.toggle("hidden", show);
}
settingsBtn.addEventListener("click", () => {
  // Entering settings also unlocks edit mode (shows Remove buttons)
  document.body.classList.add("edit-mode");
  showAddForm(true);
});
backBtn.addEventListener("click", () => showAddForm(false));

// Refresh events whenever the app is reopened / regains focus
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadEvents({ silent: true });
});

// And quietly every 5 minutes while the app stays open
setInterval(() => {
  if (!document.hidden) loadEvents({ silent: true });
}, 5 * 60 * 1000);

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!API_URL) return showStatus("Set the API URL first (see README).", true);

  const newEvent = normalizeEvent({
    id: "tmp-" + Date.now(),
    title: addForm.title.value.trim(),
    date: addForm.date.value,
    time: addForm.time.value,
    notes: addForm.notes.value.trim(),
  });

  // Optimistic: show it instantly and return to the list
  setEvents([...currentEvents, newEvent]);
  addForm.reset();
  showAddForm(false);
  showSyncing("Saving event\u2026");

  try {
    await addEvent(newEvent);
    await loadEvents({ silent: true });
    showStatus("\u2713 Event saved");
  } catch {
    // Roll back on failure
    setEvents(currentEvents.filter((ev) => ev.id !== newEvent.id));
    showStatus("Couldn't save. Check your connection and try again.", true);
  }
});

eventsList.addEventListener("click", async (e) => {
  // Expand/collapse a day row
  const header = e.target.closest(".day-header");
  if (header) {
    header.closest(".day-row").classList.toggle("open");
    return;
  }

  const btn = e.target.closest(".event-delete");
  if (!btn) return;
  if (!confirm("Remove this event?")) return;

  const id = btn.dataset.id;
  const removed = currentEvents;
  // Optimistic: remove it from the screen immediately
  setEvents(currentEvents.filter((ev) => ev.id !== id));
  showSyncing("Removing\u2026");
  try {
    await deleteEvent(id);
    await loadEvents({ silent: true });
    showStatus("\u2713 Event removed");
  } catch {
    setEvents(removed); // roll back
    showStatus("Couldn't remove it. Try again.", true);
  }
});

// ---------- init ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
loadEvents();
