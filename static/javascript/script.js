/* Campus Connect – shared frontend for all pages */
const PAGE = document.body.dataset.page;
const getBase = () => localStorage.getItem("apiBase") || "/api";
const state = { demo: false, data: {} };

/* Clearly labelled sample data, used only when the API is unreachable */
const DEMO = {
  students: [
    { id: 1, student_no: "2023-00101", name: "Maria Santos", email: "maria.santos@campus.edu", program: "BS Computer Engineering", year: 2 },
    { id: 2, student_no: "2023-00134", name: "Carlo Reyes", email: "carlo.reyes@campus.edu", program: "BS Computer Engineering", year: 2 },
    { id: 3, student_no: "2023-00158", name: "Ana Dela Cruz", email: "ana.delacruz@campus.edu", program: "BS Mathematics", year: 2 },
    { id: 4, student_no: "2023-00176", name: "Paolo Garcia", email: "paolo.garcia@campus.edu", program: "BS Mathematics", year: 1 },
    { id: 5, student_no: "2023-00192", name: "Isabel Cruz", email: "isabel.cruz@campus.edu", program: "BS Computer Engineering", year: 1 },
    { id: 6, student_no: "2023-00207", name: "James Villanueva", email: "james.villanueva@campus.edu", program: "BS Computer Engineering", year: 1 },
  ],
  courses: [
    { id: 1, code: "CPE101", title: "Introduction to Computer Engineering", dept: "Engineering", units: 3, slots: 40, instructor: "Dr. Lim" },
    { id: 2, code: "CPE201", title: "Digital Logic Design", dept: "Engineering", units: 3, slots: 35, instructor: "Engr. Tan" },
    { id: 3, code: "CPE301", title: "Data Structures and Algorithms", dept: "Engineering", units: 3, slots: 35, instructor: "Dr. Ramos" },
    { id: 4, code: "MATH101", title: "Calculus I", dept: "Mathematics", units: 3, slots: 45, instructor: "Prof. Aquino" },
    { id: 5, code: "MATH201", title: "Linear Algebra", dept: "Mathematics", units: 3, slots: 40, instructor: "Prof. Bautista" },
    { id: 6, code: "MATH301", title: "Probability and Statistics", dept: "Mathematics", units: 3, slots: 40, instructor: "Dr. Mendoza" },
  ],
  enrollments: [
    { id: 8, student_id: 6, course_id: 1, student_name: "James Villanueva", student_no: "2023-00207", course_code: "CPE101", course_title: "Introduction to Computer Engineering", status: "Pending", date: "2025-11-18" },
    { id: 7, student_id: 2, course_id: 6, student_name: "Carlo Reyes", student_no: "2023-00134", course_code: "MATH301", course_title: "Probability and Statistics", status: "Rejected", date: "2025-11-17" },
    { id: 6, student_id: 1, course_id: 3, student_name: "Maria Santos", student_no: "2023-00101", course_code: "CPE301", course_title: "Data Structures and Algorithms", status: "Pending", date: "2025-11-16" },
    { id: 5, student_id: 5, course_id: 1, student_name: "Isabel Cruz", student_no: "2023-00192", course_code: "CPE101", course_title: "Introduction to Computer Engineering", status: "Pending", date: "2025-11-15" },
    { id: 4, student_id: 4, course_id: 5, student_name: "Paolo Garcia", student_no: "2023-00176", course_code: "MATH201", course_title: "Linear Algebra", status: "Approved", date: "2025-11-13" },
    { id: 3, student_id: 3, course_id: 4, student_name: "Ana Dela Cruz", student_no: "2023-00158", course_code: "MATH101", course_title: "Calculus I", status: "Approved", date: "2025-11-12" },
    { id: 2, student_id: 2, course_id: 2, student_name: "Carlo Reyes", student_no: "2023-00134", course_code: "CPE201", course_title: "Digital Logic Design", status: "Approved", date: "2025-11-11" },
    { id: 1, student_id: 1, course_id: 1, student_name: "Maria Santos", student_no: "2023-00101", course_code: "CPE101", course_title: "Introduction to Computer Engineering", status: "Approved", date: "2025-11-10" },
  ],
  announcements: [
    { id: 1, title: "Enrollment period extended", body: "Late enrollment is open until November 30.", date: "2025-11-20" },
    { id: 2, title: "Midterm schedule released", body: "Check your course page for room assignments.", date: "2025-11-14" },
    { id: 3, title: "Library hours update", body: "The library will open until 9 PM on weekdays.", date: "2025-11-05" },
  ],
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (d) => { const x = new Date(d + "T00:00:00"); return isNaN(x) ? d : x.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
const $ = (s) => document.querySelector(s);

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 3200);
}

async function api(path, opts = {}) {
  const res = await fetch(getBase() + path, { headers: { "Content-Type": "application/json" }, ...opts });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

async function load(name) {
  try { const d = await api("/" + name); state.demo = false; return d; }
  catch (e) { state.demo = true; return structuredClone(DEMO[name]); }
}

async function write(method, path, body) {
  if (state.demo) { toast("Demo data: connect the API to save changes."); return false; }
  try { await api(path, { method, body: body ? JSON.stringify(body) : undefined }); return true; }
  catch (e) { toast(e.message); return false; }
}

/* ---------- layout ---------- */
const ICONS = {
  dashboard: '<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>',
  students: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M17 5a3.5 3.5 0 010 7M22 20c0-2.5-1.5-4.5-4-5.5"/>',
  courses: '<path d="M2 4h7a3 3 0 013 3v13a2 2 0 00-2-2H2zM22 4h-7a3 3 0 00-3 3v13a2 2 0 012-2h8z"/>',
  enrollments: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  announcements: '<path d="M3 11v3l12 5V6zM15 8h3a3 3 0 010 6h-3M6 15l1 5h3l-1-4"/>',
  api: '<path d="M9 2v6M15 2v6M6 8h12v4a6 6 0 01-12 0zM12 18v4"/>',
  docs: '<path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h8"/>',
  grad: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2.5 9 2.5 12 0v-5"/>',
};
const ico = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const NAV = [["dashboard", "/", "Dashboard"], ["students", "/students", "Students"], ["courses", "/courses", "Courses"], ["enrollments", "/enrollments", "Enrollments"], ["announcements", "/announcements", "Announcements"]];

function renderSidebar() {
  $("#sidebar").innerHTML = `
    <div class="brand"><div class="logo">${ico("grad")}</div><div><b>Campus Connect</b><small>STUDENT INFORMATION SYSTEM</small></div></div>
    <div class="nav-label">WORKSPACE</div>
    <nav class="nav">${NAV.map(([k, href, label]) => `<a href="${href}" class="${k === PAGE ? "active" : ""}">${ico(k)}${label}</a>`).join("")}</nav>
    <div class="spacer"></div>
    <div class="side-bottom nav">
      <button id="apiBtn">${ico("api")}API settings</button>
      <a href="${getBase()}" target="_blank">${ico("docs")}Backend &amp; docs</a>
    </div>
    <div class="status-chip"><span class="dot" id="statusDot"></span><span id="statusTxt">Checking…</span></div>`;
  $("#apiBtn").onclick = () => openForm("API settings", [{ key: "base", label: "API base URL", value: getBase() }], (v) => {
    localStorage.setItem("apiBase", v.base || "/api"); location.reload();
  });
}

function setStatus() {
  $("#statusDot").classList.toggle("ok", !state.demo);
  $("#statusTxt").textContent = state.demo ? "Demo data · connect API" : "Live data · SQLite";
  $("#demoPill").classList.toggle("hidden", !state.demo);
  $("#banner").innerHTML = state.demo ? `
    <div class="banner"><div><h3>⚠ Demonstration dataset — the Flask API is not connected</h3>
    <p>The portal is displaying a fictional dataset so that the interface may be reviewed. Start the backend at <code>http://127.0.0.1:5000/api</code> and reload to read live records from SQLite. No change is saved while the API is unavailable.</p></div>
    <div class="actions"><button class="btn sm" onclick="location.reload()">Retry connection</button><button class="btn sm dark" onclick="document.getElementById('apiBtn').click()">API settings</button></div></div>` : "";
}

function openForm(title, fields, onSubmit) {
  const m = $("#modal");
  m.innerHTML = `<form class="box"><h3>${esc(title)}</h3>
    ${fields.map((f) => `<div class="field"><label>${esc(f.label)}</label>${
      f.type === "select" ? `<select name="${f.key}" required>${f.options.map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`).join("")}</select>`
      : f.type === "textarea" ? `<textarea name="${f.key}" rows="4">${esc(f.value || "")}</textarea>`
      : `<input name="${f.key}" type="${f.type || "text"}" value="${esc(f.value ?? "")}" ${f.optional ? "" : "required"}>`}</div>`).join("")}
    <div class="foot"><button type="button" class="btn" id="cancelBtn">Cancel</button><button class="btn primary">Save</button></div></form>`;
  m.classList.remove("hidden");
  const close = () => m.classList.add("hidden");
  $("#cancelBtn").onclick = close;
  m.onclick = (e) => { if (e.target === m) close(); };
  m.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    await onSubmit(Object.fromEntries(new FormData(e.target)));
    close();
  };
}

function table(cols, rows, empty = "No records found.") {
  if (!rows.length) return `<div class="empty">${empty}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th>${c.h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${cols.map((c) => `<td>${c.f(r)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
const badge = (s) => `<span class="badge ${esc(s)}">${esc(s)}</span>`;
const two = (a, b) => `${esc(a)}<div class="muted">${esc(b)}</div>`;

async function reload() { await PAGES[PAGE].render(); setStatus(); applySearch(); }

const PAGES = {
  dashboard: {
    action: ["+ New enrollment", () => newEnrollment()],
    async render() {
      const [s, c, e, a] = await Promise.all(["students", "courses", "enrollments", "announcements"].map(load));
      const approved = e.filter((x) => x.status === "Approved").length;
      const pending = e.filter((x) => x.status === "Pending").length;
      const depts = new Set(c.map((x) => x.dept)).size;
      const latest = a.map((x) => x.date).sort().pop();
      $("#content").innerHTML = `
        <div class="stats">
          <div class="stat"><div class="lbl">TOTAL STUDENTS ${ico("students")}</div><div class="num">${s.length}</div><div class="sub">No new records this month</div></div>
          <div class="stat"><div class="lbl">ACTIVE COURSES ${ico("courses")}</div><div class="num">${c.length}</div><div class="sub"><b>${depts} dept</b><br>${c.length} open for enrollment</div></div>
          <div class="stat"><div class="lbl">TOTAL ENROLLMENTS ${ico("enrollments")}</div><div class="num">${e.length}</div><div class="sub"><b>${approved} approved</b><br>${pending} pending review</div></div>
          <div class="stat"><div class="lbl">ANNOUNCEMENTS ${ico("announcements")}</div><div class="num">${a.length}</div><div class="sub">${latest ? "Latest " + fmtDate(latest) : "None yet"}</div></div>
        </div>
        <div class="section-head"><div><div class="section-label">OFFICE OF THE UNIVERSITY REGISTRAR</div><h2>Recent enrollment activity</h2></div><a href="/enrollments">View all</a></div>
        <div class="card">${enrollTable(e.slice(0, 6))}</div>`;
      bindEnrollActions();
    },
  },

  students: {
    action: ["+ New student", () => studentForm()],
    async render() {
      const s = await load("students");
      $("#content").innerHTML = `<div class="card">${table([
        { h: "ID", f: (r) => `<span class="idc">#${r.id}</span>` },
        { h: "STUDENT", f: (r) => two(r.name, r.student_no) },
        { h: "PROGRAM", f: (r) => esc(r.program) },
        { h: "YEAR", f: (r) => "Year " + esc(r.year) },
        { h: "EMAIL", f: (r) => esc(r.email) },
        { h: "ACTIONS", f: (r) => `<div class="row-actions"><button class="btn sm" data-edit="${r.id}">Edit</button><button class="btn sm danger" data-del="${r.id}">Delete</button></div>` },
      ], s)}</div>`;
      crudButtons("students", s, studentForm);
    },
  },

  courses: {
    action: ["+ New course", () => courseForm()],
    async render() {
      const c = await load("courses");
      $("#content").innerHTML = c.length ? `<div class="grid">${c.map((r) => `
        <div class="card course"><span class="code">${esc(r.code)}</span><h3>${esc(r.title)}</h3>
        <div class="muted">${esc(r.instructor || "TBA")}</div>
        <div class="tags"><span class="tag">${esc(r.dept)}</span><span class="tag">${esc(r.units)} units</span><span class="tag">${esc(r.slots)} slots</span></div>
        <div class="row-actions" style="margin-top:10px"><button class="btn sm" data-edit="${r.id}">Edit</button><button class="btn sm danger" data-del="${r.id}">Delete</button></div></div>`).join("")}</div>`
        : `<div class="card empty">No courses yet.</div>`;
      crudButtons("courses", c, courseForm);
    },
  },

  enrollments: {
    action: ["+ New enrollment", () => newEnrollment()],
    async render() {
      const e = await load("enrollments");
      $("#content").innerHTML = `<div class="card">${enrollTable(e)}</div>`;
      bindEnrollActions();
    },
  },

  announcements: {
    action: ["+ New announcement", () => announcementForm()],
    async render() {
      const a = await load("announcements");
      $("#content").innerHTML = `<div class="card">${a.length ? a.map((r) => `
        <div class="news"><div><h3>${esc(r.title)}</h3><p>${esc(r.body)}</p><div class="muted" style="margin-top:6px">${fmtDate(r.date)}</div></div>
        <div class="row-actions"><button class="btn sm" data-edit="${r.id}">Edit</button><button class="btn sm danger" data-del="${r.id}">Delete</button></div></div>`).join("")
        : `<div class="empty">No announcements.</div>`}</div>`;
      crudButtons("announcements", a, announcementForm);
    },
  },
};

function enrollTable(rows) {
  return table([
    { h: "ID", f: (r) => `<span class="idc">#${r.id}</span>` },
    { h: "STUDENT", f: (r) => two(r.student_name, r.student_no) },
    { h: "COURSE", f: (r) => two(r.course_code, r.course_title) },
    { h: "STATUS", f: (r) => badge(r.status) },
    { h: "DATE", f: (r) => fmtDate(r.date) },
    { h: "ACTIONS", f: (r) => `<div class="row-actions">
        ${r.status !== "Approved" ? `<button class="btn sm" data-status="Approved" data-id="${r.id}">Approve</button>` : ""}
        ${r.status !== "Rejected" ? `<button class="btn sm danger" data-status="Rejected" data-id="${r.id}">Reject</button>` : ""}
        <button class="btn sm" data-remove="${r.id}">Remove</button></div>` },
  ], rows, "No enrollments yet.");
}

function bindEnrollActions() {
  document.querySelectorAll("[data-status]").forEach((b) => b.onclick = async () => {
    if (await write("PUT", "/enrollments/" + b.dataset.id, { status: b.dataset.status })) { toast("Enrollment " + b.dataset.status.toLowerCase()); reload(); }
  });
  document.querySelectorAll("[data-remove]").forEach((b) => b.onclick = async () => {
    if (confirm("Remove this enrollment?") && await write("DELETE", "/enrollments/" + b.dataset.remove)) reload();
  });
}

async function newEnrollment() {
  const [s, c] = await Promise.all([load("students"), load("courses")]);
  openForm("New enrollment", [
    { key: "student_id", label: "Student", type: "select", options: s.map((x) => ({ value: x.id, label: `${x.name} (${x.student_no})` })) },
    { key: "course_id", label: "Course", type: "select", options: c.map((x) => ({ value: x.id, label: `${x.code} – ${x.title}` })) },
  ], async (v) => { if (await write("POST", "/enrollments", { student_id: +v.student_id, course_id: +v.course_id })) { toast("Enrollment submitted"); reload(); } });
}

function crudButtons(name, rows, formFn) {
  document.querySelectorAll("[data-edit]").forEach((b) => b.onclick = () => formFn(rows.find((r) => r.id == b.dataset.edit)));
  document.querySelectorAll("[data-del]").forEach((b) => b.onclick = async () => {
    if (confirm("Delete this record?") && await write("DELETE", `/${name}/${b.dataset.del}`)) reload();
  });
}
function save(name, item, v) {
  return write(item ? "PUT" : "POST", `/${name}` + (item ? "/" + item.id : ""), v).then((ok) => { if (ok) { toast("Saved"); reload(); } });
}
const studentForm = (i) => openForm(i ? "Edit student" : "New student", [
  { key: "student_no", label: "Student number", value: i?.student_no },
  { key: "name", label: "Full name", value: i?.name },
  { key: "email", label: "Email", type: "email", value: i?.email, optional: true },
  { key: "program", label: "Program", value: i?.program, optional: true },
  { key: "year", label: "Year level", type: "number", value: i?.year ?? 1 },
], (v) => save("students", i, { ...v, year: +v.year }));
const courseForm = (i) => openForm(i ? "Edit course" : "New course", [
  { key: "code", label: "Course code", value: i?.code },
  { key: "title", label: "Title", value: i?.title },
  { key: "dept", label: "Department", value: i?.dept },
  { key: "units", label: "Units", type: "number", value: i?.units ?? 3 },
  { key: "slots", label: "Slots", type: "number", value: i?.slots ?? 40 },
  { key: "instructor", label: "Instructor", value: i?.instructor, optional: true },
], (v) => save("courses", i, { ...v, units: +v.units, slots: +v.slots }));
const announcementForm = (i) => openForm(i ? "Edit announcement" : "New announcement", [
  { key: "title", label: "Title", value: i?.title },
  { key: "body", label: "Message", type: "textarea", value: i?.body },
], (v) => save("announcements", i, i ? v : { ...v, date: new Date().toISOString().slice(0, 10) }));

function applySearch() {
  const q = $("#search").value.toLowerCase();
  document.querySelectorAll("tbody tr, .course, .news").forEach((el) => el.style.display = el.textContent.toLowerCase().includes(q) ? "" : "none");
}

document.addEventListener("DOMContentLoaded", async () => {
  renderSidebar();
  const [label, fn] = PAGES[PAGE].action;
  $("#primaryBtn").textContent = label; $("#primaryBtn").onclick = fn;
  $("#search").oninput = applySearch;
  $("#menuBtn").onclick = () => { $("#sidebar").classList.toggle("open"); $("#scrim").classList.toggle("show"); };
  $("#scrim").onclick = () => { $("#sidebar").classList.remove("open"); $("#scrim").classList.remove("show"); };
  await reload();
});
