import os
import sqlite3
from datetime import date
from flask import Flask, g, jsonify, render_template, request
from flask_cors import CORS

BASE = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE, "campus.db")

app = Flask(__name__, static_folder="static", template_folder="templates")
app.url_map.strict_slashes = False
CORS(app, resources={r"/*": {"origins": "*"}})

TABLES = {
    "students": ["student_no", "name", "email", "program", "year"],
    "courses": ["code", "title", "dept", "units", "slots", "instructor"],
    "announcements": ["title", "body", "date"],
}

SCHEMA = """
CREATE TABLE IF NOT EXISTS students(
  id INTEGER PRIMARY KEY AUTOINCREMENT, student_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL, email TEXT, program TEXT, year INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS courses(
  id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL, dept TEXT, units INTEGER DEFAULT 3,
  slots INTEGER DEFAULT 40, instructor TEXT);
CREATE TABLE IF NOT EXISTS enrollments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending', date TEXT);
CREATE TABLE IF NOT EXISTS announcements(
  id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
  body TEXT, date TEXT);
"""

ENROLL_SQL = """
SELECT e.id, e.student_id, e.course_id, e.status, e.date,
       s.name AS student_name, s.student_no,
       c.code AS course_code, c.title AS course_title
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses c ON c.id = e.course_id
"""


def db():
    if "db" not in g:
        g.db = sqlite3.connect(DB)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_):
    conn = g.pop("db", None)
    if conn:
        conn.close()


def init_db():
    conn = sqlite3.connect(DB)
    conn.executescript(SCHEMA)
    if conn.execute("SELECT COUNT(*) FROM students").fetchone()[0] == 0:
        conn.executemany(
            "INSERT INTO students(student_no,name,email,program,year) VALUES(?,?,?,?,?)",
            [
                ("2023-00101", "Maria Santos", "maria.santos@campus.edu", "BS Computer Engineering", 2),
                ("2023-00134", "Carlo Reyes", "carlo.reyes@campus.edu", "BS Computer Engineering", 2),
                ("2023-00158", "Ana Dela Cruz", "ana.delacruz@campus.edu", "BS Mathematics", 2),
                ("2023-00176", "Paolo Garcia", "paolo.garcia@campus.edu", "BS Mathematics", 1),
                ("2023-00192", "Isabel Cruz", "isabel.cruz@campus.edu", "BS Computer Engineering", 1),
                ("2023-00207", "James Villanueva", "james.villanueva@campus.edu", "BS Computer Engineering", 1),
            ],
        )
        conn.executemany(
            "INSERT INTO courses(code,title,dept,units,slots,instructor) VALUES(?,?,?,?,?,?)",
            [
                ("CPE101", "Introduction to Computer Engineering", "Engineering", 3, 40, "Dr. Lim"),
                ("CPE201", "Digital Logic Design", "Engineering", 3, 35, "Engr. Tan"),
                ("CPE301", "Data Structures and Algorithms", "Engineering", 3, 35, "Dr. Ramos"),
                ("MATH101", "Calculus I", "Mathematics", 3, 45, "Prof. Aquino"),
                ("MATH201", "Linear Algebra", "Mathematics", 3, 40, "Prof. Bautista"),
                ("MATH301", "Probability and Statistics", "Mathematics", 3, 40, "Dr. Mendoza"),
            ],
        )
        conn.executemany(
            "INSERT INTO enrollments(student_id,course_id,status,date) VALUES(?,?,?,?)",
            [
                (1, 1, "Approved", "2025-11-10"), (2, 2, "Approved", "2025-11-11"),
                (3, 4, "Approved", "2025-11-12"), (4, 5, "Approved", "2025-11-13"),
                (5, 1, "Pending", "2025-11-15"), (1, 3, "Pending", "2025-11-16"),
                (2, 6, "Rejected", "2025-11-17"), (6, 1, "Pending", "2025-11-18"),
            ],
        )
        conn.executemany(
            "INSERT INTO announcements(title,body,date) VALUES(?,?,?)",
            [
                ("Enrollment period extended", "Late enrollment is open until November 30.", "2025-11-20"),
                ("Midterm schedule released", "Check your course page for room assignments.", "2025-11-14"),
                ("Library hours update", "The library will open until 9 PM on weekdays.", "2025-11-05"),
            ],
        )
    conn.commit()
    conn.close()


def rows(cur):
    return [dict(r) for r in cur.fetchall()]


# ---------- pages ----------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/students")
def students_page():
    return render_template("students.html")


@app.route("/courses")
def courses_page():
    return render_template("courses.html")


@app.route("/enrollments")
def enrollments_page():
    return render_template("enrollment.html")


@app.route("/announcements")
def announcements_page():
    return render_template("announcement.html")


# ---------- API ----------
@app.route("/health")
@app.route("/api/health")
def health():
    return jsonify(status="ok", service="Campus Connect API")


@app.route("/api")
def api_root():
    return jsonify({
        "name": "Campus Connect API",
        "endpoints": ["/api/health", "/api/students", "/api/courses", "/api/enrollments",
                      "/api/announcements", "/api/stats"],
    })


@app.route("/api/stats")
def stats():
    d = db()
    one = lambda q: d.execute(q).fetchone()[0]
    return jsonify({
        "students": one("SELECT COUNT(*) FROM students"),
        "courses": one("SELECT COUNT(*) FROM courses"),
        "enrollments": one("SELECT COUNT(*) FROM enrollments"),
        "approved": one("SELECT COUNT(*) FROM enrollments WHERE status='Approved'"),
        "pending": one("SELECT COUNT(*) FROM enrollments WHERE status='Pending'"),
        "announcements": one("SELECT COUNT(*) FROM announcements"),
    })


def register_crud(table):
    cols = TABLES[table]

    def list_items():
        order = "date DESC, id DESC" if table == "announcements" else "id"
        return jsonify(rows(db().execute(f"SELECT * FROM {table} ORDER BY {order}")))

    def create_item():
        data = request.get_json(silent=True) or {}
        if table == "announcements":
            data.setdefault("date", date.today().isoformat())
        vals = [data.get(c) for c in cols]
        if not vals[0] or not vals[1 if table != "announcements" else 0]:
            return jsonify(error="Missing required fields"), 400
        try:
            cur = db().execute(
                f"INSERT INTO {table}({','.join(cols)}) VALUES({','.join('?' * len(cols))})", vals)
            db().commit()
        except sqlite3.IntegrityError as e:
            return jsonify(error=str(e)), 409
        row = db().execute(f"SELECT * FROM {table} WHERE id=?", (cur.lastrowid,)).fetchone()
        return jsonify(dict(row)), 201

    def update_item(item_id):
        data = request.get_json(silent=True) or {}
        fields = [c for c in cols if c in data]
        if not fields:
            return jsonify(error="Nothing to update"), 400
        try:
            db().execute(
                f"UPDATE {table} SET {','.join(f + '=?' for f in fields)} WHERE id=?",
                [data[f] for f in fields] + [item_id])
            db().commit()
        except sqlite3.IntegrityError as e:
            return jsonify(error=str(e)), 409
        row = db().execute(f"SELECT * FROM {table} WHERE id=?", (item_id,)).fetchone()
        return (jsonify(dict(row)), 200) if row else (jsonify(error="Not found"), 404)

    def delete_item(item_id):
        db().execute(f"DELETE FROM {table} WHERE id=?", (item_id,))
        db().commit()
        return jsonify(deleted=item_id)

    app.add_url_rule(f"/api/{table}", f"{table}_list", list_items)
    app.add_url_rule(f"/api/{table}", f"{table}_create", create_item, methods=["POST"])
    app.add_url_rule(f"/api/{table}/<int:item_id>", f"{table}_update", update_item, methods=["PUT"])
    app.add_url_rule(f"/api/{table}/<int:item_id>", f"{table}_delete", delete_item, methods=["DELETE"])


for t in TABLES:
    register_crud(t)


@app.route("/api/enrollments", methods=["GET"])
def enrollments_list():
    return jsonify(rows(db().execute(ENROLL_SQL + " ORDER BY e.date DESC, e.id DESC")))


@app.route("/api/enrollments", methods=["POST"])
def enrollments_create():
    data = request.get_json(silent=True) or {}
    if not data.get("student_id") or not data.get("course_id"):
        return jsonify(error="student_id and course_id are required"), 400
    dup = db().execute(
        "SELECT 1 FROM enrollments WHERE student_id=? AND course_id=?",
        (data["student_id"], data["course_id"])).fetchone()
    if dup:
        return jsonify(error="Student is already enrolled in this course"), 409
    cur = db().execute(
        "INSERT INTO enrollments(student_id,course_id,status,date) VALUES(?,?,?,?)",
        (data["student_id"], data["course_id"], data.get("status", "Pending"),
         data.get("date") or date.today().isoformat()))
    db().commit()
    row = db().execute(ENROLL_SQL + " WHERE e.id=?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/enrollments/<int:item_id>", methods=["PUT"])
def enrollments_update(item_id):
    status = (request.get_json(silent=True) or {}).get("status")
    if status not in ("Pending", "Approved", "Rejected"):
        return jsonify(error="Invalid status"), 400
    db().execute("UPDATE enrollments SET status=? WHERE id=?", (status, item_id))
    db().commit()
    row = db().execute(ENROLL_SQL + " WHERE e.id=?", (item_id,)).fetchone()
    return (jsonify(dict(row)), 200) if row else (jsonify(error="Not found"), 404)


@app.route("/api/enrollments/<int:item_id>", methods=["DELETE"])
def enrollments_delete(item_id):
    db().execute("DELETE FROM enrollments WHERE id=?", (item_id,))
    db().commit()
    return jsonify(deleted=item_id)


init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
