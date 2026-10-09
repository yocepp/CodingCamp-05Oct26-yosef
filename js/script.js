/* ===== Helpers: Local Storage ===== */
const load = (key, fallback) => {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return data ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* ===== 1. Greeting, Time & Date ===== */
const NAME_KEY = "dashboard_name";
let userName = load(NAME_KEY, "");

const timeEl = document.getElementById("time");
const dateEl = document.getElementById("date");
const greetingEl = document.getElementById("greeting");

function getGreeting(hour) {
  if (hour < 11) return ["Good Morning", "☀️"];
  if (hour < 15) return ["Good Afternoon", "🌤️"];
  if (hour < 18) return ["Good Afternoon.", "🌇"];
  return ["Good Night", "🌙"];
}

function updateClock() {
  const now = new Date();
  timeEl.textContent = now.toLocaleTimeString("en-GB", { hour12: false });
  dateEl.textContent = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const [text, icon] = getGreeting(now.getHours());
  greetingEl.textContent = userName ? `${text}, ${userName} ${icon}` : `${text} ${icon}`;
}

updateClock();
setInterval(updateClock, 1000);

/* ----- Custom name ----- */
const nameEdit = document.getElementById("name-edit");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");
const nameCancel = document.getElementById("name-cancel");

function openNameForm() {
  nameInput.value = userName;
  nameForm.hidden = false;
  nameEdit.hidden = true;
  nameInput.focus();
}

function closeNameForm() {
  nameForm.hidden = true;
  nameEdit.hidden = false;
}

nameEdit.addEventListener("click", openNameForm);
nameCancel.addEventListener("click", closeNameForm);

nameForm.addEventListener("submit", (e) => {
  e.preventDefault();
  userName = nameInput.value.trim();
  save(NAME_KEY, userName);
  updateClock();
  closeNameForm();
});

/* ===== 2. Focus Timer (25 menit) ===== */
const TIMER_KEY = "dashboard_timer_minutes";
const DEFAULT_MINUTES = 25;
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

let timerMinutes = Number(load(TIMER_KEY, DEFAULT_MINUTES)) || DEFAULT_MINUTES;
let remaining = timerMinutes * 60;
let timerId = null;

const timerDisplay = document.getElementById("timer-display");
const startBtn = document.getElementById("timer-start");
const stopBtn = document.getElementById("timer-stop");
const resetBtn = document.getElementById("timer-reset");
const timerForm = document.getElementById("timer-form");
const timerMinutesInput = document.getElementById("timer-minutes");

function renderTimer() {
  const m = String(Math.floor(remaining / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  timerDisplay.textContent = `${m}:${s}`;
}

function startTimer() {
  if (timerId) return; // cegah interval ganda
  timerId = setInterval(() => {
    remaining--;
    renderTimer();
    if (remaining <= 0) {
      stopTimer();
      alert("Waktu fokus selesai! Saatnya istirahat 🎉");
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function resetTimer() {
  stopTimer();
  remaining = timerMinutes * 60;
  renderTimer();
}

function setTimerMinutes(value) {
  const minutes = Math.round(Number(value));
  if (!Number.isFinite(minutes) || minutes < MIN_MINUTES || minutes > MAX_MINUTES) {
    alert(`Masukkan durasi antara ${MIN_MINUTES} dan ${MAX_MINUTES} menit.`);
    timerMinutesInput.value = timerMinutes;
    return;
  }
  timerMinutes = minutes;
  save(TIMER_KEY, timerMinutes);
  timerMinutesInput.value = timerMinutes;
  resetTimer(); // hentikan timer berjalan dan pakai durasi baru
}

startBtn.addEventListener("click", startTimer);
stopBtn.addEventListener("click", stopTimer);
resetBtn.addEventListener("click", resetTimer);
timerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  setTimerMinutes(timerMinutesInput.value);
});

timerMinutesInput.value = timerMinutes;
renderTimer();

/* ===== 3. To-Do List ===== */
const TODO_KEY = "dashboard_todos";
let todos = load(TODO_KEY, []);
let editingId = null; // id task yang sedang diedit

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoEmpty = document.getElementById("todo-empty");

function renderTodos() {
  todoList.innerHTML = "";
  todoEmpty.hidden = todos.length > 0;

  todos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.title = "Tandai selesai";
    checkbox.addEventListener("change", () => toggleTodo(todo.id));
    li.appendChild(checkbox);

    if (editingId === todo.id) {
      // Mode edit: tampilkan input + tombol Simpan/Batal
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "todo-edit-input";
      editInput.value = todo.text;
      editInput.maxLength = 200;

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "btn btn-primary";
      saveBtn.textContent = "Simpan";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "btn";
      cancelBtn.textContent = "Batal";

      const commit = () => saveEdit(todo.id, editInput.value);
      saveBtn.addEventListener("click", commit);
      cancelBtn.addEventListener("click", cancelEdit);
      editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") cancelEdit();
      });

      li.append(editInput, saveBtn, cancelBtn);
      todoList.appendChild(li);
      editInput.focus();
      editInput.select();
      return;
    }

    // Mode normal
    const span = document.createElement("span");
    span.className = "todo-text";
    span.textContent = todo.text;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "todo-edit";
    editBtn.textContent = "✎";
    editBtn.title = "Edit task";
    editBtn.addEventListener("click", () => startEdit(todo.id));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "link-del";
    delBtn.textContent = "✕";
    delBtn.title = "Hapus task";
    delBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.append(span, editBtn, delBtn);
    todoList.appendChild(li);
  });
}

function persistTodos() {
  save(TODO_KEY, todos);
  renderTodos();
}

function toggleTodo(id) {
  todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  persistTodos();
}

function deleteTodo(id) {
  if (editingId === id) editingId = null;
  todos = todos.filter((t) => t.id !== id);
  persistTodos();
}

function startEdit(id) {
  editingId = id;
  renderTodos();
}

function cancelEdit() {
  editingId = null;
  renderTodos();
}

function saveEdit(id, newText) {
  const text = newText.trim();
  if (!text) return; // jangan simpan task kosong
  todos = todos.map((t) => (t.id === id ? { ...t, text } : t));
  editingId = null;
  persistTodos();
}

todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  persistTodos();
  todoForm.reset();
});

renderTodos();

/* ===== 4. Quick Links ===== */
const LINKS_KEY = "dashboard_links";
const defaultLinks = [
  { id: 1, name: "Google", url: "https://www.google.com" },
  { id: 2, name: "YouTube", url: "https://www.youtube.com" },
  { id: 3, name: "GitHub", url: "https://github.com" },
];
let links = load(LINKS_KEY, defaultLinks);

const linkForm = document.getElementById("link-form");
const linkName = document.getElementById("link-name");
const linkUrl = document.getElementById("link-url");
const linksList = document.getElementById("links-list");

function renderLinks() {
  linksList.innerHTML = "";

  links.forEach((link) => {
    const wrap = document.createElement("div");
    wrap.className = "link-item";

    const openBtn = document.createElement("button");
    openBtn.className = "link-btn";
    openBtn.textContent = link.name;
    openBtn.addEventListener("click", () => {
      window.open(link.url, "_blank", "noopener,noreferrer");
    });

    const delBtn = document.createElement("button");
    delBtn.className = "link-del";
    delBtn.textContent = "✕";
    delBtn.title = "Hapus link";
    delBtn.addEventListener("click", () => deleteLink(link.id));

    wrap.append(openBtn, delBtn);
    linksList.appendChild(wrap);
  });
}

function persistLinks() {
  save(LINKS_KEY, links);
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((l) => l.id !== id);
  persistLinks();
}

linkForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = linkName.value.trim();
  const url = linkUrl.value.trim();
  if (!name || !url) return;
  links.push({ id: Date.now(), name, url });
  persistLinks();
  linkForm.reset();
});

renderLinks();

/* ===== 5. Theme Toggle (Light / Dark) ===== */
const THEME_KEY = "dashboard_theme";
const themeBtn = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "☀️" : "🌙";
  themeBtn.title = theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap";
}

themeBtn.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// Sinkronkan ikon dengan tema yang sudah dipasang oleh skrip di <head>
applyTheme(document.documentElement.getAttribute("data-theme") || "light");