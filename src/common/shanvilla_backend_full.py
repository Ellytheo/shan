import os
import uuid
import json
from datetime import date, datetime
from decimal import Decimal

import pymysql
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from PIL import Image
import shutil

app = Flask(__name__)
CORS(app)

# Upload Configuration
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
# If running in local dev structure (src/common/), go up two levels.
# If running on PythonAnywhere (flask_app.py in mysite/), put uploads next to the script.
if os.path.basename(BACKEND_DIR) == 'common' and os.path.basename(os.path.dirname(BACKEND_DIR)) == 'src':
    UPLOAD_FOLDER = os.path.abspath(os.path.join(BACKEND_DIR, '..', '..', 'uploads'))
else:
    UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Flask limit, we enforce 3MB on route level


# Set DB_PASSWORD via the WSGI config file on PythonAnywhere (recommended),
# OR replace the empty string below with your actual password before uploading.
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "shanvilla.mysql.pythonanywhere-services.com"),
    "user": os.environ.get("DB_USER", "Shanvilla"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "Shanvilla$default"),
}


ACTIVE_BOOKING_STATUSES = ("pending", "confirmed", "checked_in")
ALL_BOOKING_STATUSES = ("pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show")

ALLOWED_STATUS_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["checked_in", "cancelled", "no_show"],
    "checked_in": ["checked_out"],
    "checked_out": [],
    "cancelled": [],
    "no_show": [],
}


def get_connection():
    return pymysql.connect(
        host=DB_CONFIG["host"],
        user=DB_CONFIG["user"],
        password=DB_CONFIG["password"],
        database=DB_CONFIG["database"],
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=False,
    )


def parse_booking_date(value, field_name):
    try:
        return datetime.strptime(str(value), "%Y-%m-%d").date()
    except Exception:
        raise ValueError(f"{field_name} must be a valid date in YYYY-MM-DD format.")


def validate_booking_dates(checkin_raw, checkout_raw):
    checkin = parse_booking_date(checkin_raw, "checkin_date")
    checkout = parse_booking_date(checkout_raw, "checkout_date")

    if checkin < date.today():
        raise ValueError("Check-in date cannot be before today.")
    if checkout <= checkin:
        raise ValueError("Checkout date must be after check-in date.")

    return checkin, checkout


def require_fields(data, fields):
    missing = [field for field in fields if field not in data or data[field] in ("", None)]
    if missing:
        return f"Missing required field(s): {', '.join(missing)}"
    return None


def normalize_status(value):
    return str(value or "").strip().lower()


def serialize_value(value):
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    return value


def serialize_row(row):
    return {key: serialize_value(value) for key, value in row.items()}


def serialize_rows(rows):
    return [serialize_row(row) for row in rows]


def active_status_placeholders():
    return ", ".join(["%s"] * len(ACTIVE_BOOKING_STATUSES))


def count_overlapping_bookings(cursor, room_type_id, checkin, checkout, exclude_booking_id=None):
    params = [room_type_id, *ACTIVE_BOOKING_STATUSES, checkout, checkin]
    exclude_sql = ""

    if exclude_booking_id:
        exclude_sql = "AND id != %s"
        params.append(exclude_booking_id)

    cursor.execute(f"""
        SELECT COUNT(*) AS booked
        FROM bookings
        WHERE room_type_id = %s
          AND status IN ({active_status_placeholders()})
          AND checkin_date < %s
          AND checkout_date > %s
          {exclude_sql}
    """, params)

    return cursor.fetchone()["booked"]


def get_locked_room_type(cursor, room_type_id):
    cursor.execute("""
        SELECT id, name, price, total_rooms
        FROM room_types
        WHERE id = %s
        FOR UPDATE
    """, (room_type_id,))
    return cursor.fetchone()


def check_duplicate_booking(cursor, data, checkin, checkout, exclude_booking_id=None):
    params = [
        data["email"],
        data["phone"],
        data["room_type_id"],
        checkin,
        checkout,
        *ACTIVE_BOOKING_STATUSES,
    ]
    exclude_sql = ""

    if exclude_booking_id:
        exclude_sql = "AND id != %s"
        params.append(exclude_booking_id)

    cursor.execute(f"""
        SELECT id, booking_reference
        FROM bookings
        WHERE email = %s
          AND phone = %s
          AND room_type_id = %s
          AND checkin_date = %s
          AND checkout_date = %s
          AND status IN ({active_status_placeholders()})
          {exclude_sql}
        LIMIT 1
    """, params)

    return cursor.fetchone()


def insert_booking_history(cursor, booking_id, old_status, new_status, changed_by):
    cursor.execute("""
        INSERT INTO booking_history
        (booking_id, old_status, new_status, changed_by)
        VALUES (%s, %s, %s, %s)
    """, (booking_id, old_status, new_status, changed_by or "admin"))


@app.route("/submit_contact", methods=["POST"])
def submit_contact():
    data = request.form
    required_fields = ["first_name", "last_name", "email", "phone", "message"]

    error = require_fields(data, required_fields)
    if error:
        return jsonify({"status": "error", "message": error}), 400

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO contact_form (first_name, last_name, email, phone, message)
                VALUES (%s, %s, %s, %s, %s)
            """, (data["first_name"], data["last_name"], data["email"], data["phone"], data["message"]))
        conn.commit()
        return jsonify({"status": "success", "message": "Contact form submitted successfully."}), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/get_contacts", methods=["GET"])
def get_contacts():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, first_name, last_name, email, phone, message
                FROM contact_form
                ORDER BY id DESC
            """)
            rows = cursor.fetchall()
        return jsonify({"status": "success", "data": serialize_rows(rows)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/delete_contact/<int:contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM contact_form WHERE id = %s", (contact_id,))
        conn.commit()
        return jsonify({"status": "success", "message": "Contact deleted successfully."}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Missing credentials."
        }), 400

    conn = None

    try:
        conn = get_connection()

        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id,
                    username,
                    password,
                    status
                FROM users
                WHERE username = %s
            """, (username,))

            user = cursor.fetchone()

        # User not found
        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid username or password."
            }), 401

        # Password incorrect
        if not check_password_hash(user["password"], password):
            return jsonify({
                "status": "error",
                "message": "Invalid username or password."
            }), 401

        # Account disabled
        if user["status"] == "Disabled":
            return jsonify({
                "status": "error",
                "message": "Your account has been disabled. Please contact your administrator."
            }), 403

        # Update last login timestamp
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET last_login = NOW()
                WHERE id = %s
            """, (user["id"],))
        conn.commit()

        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "username": user["username"]
            }
        }), 200

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()

@app.route("/users/hash-password", methods=["POST"])
def hash_password_helper():
    data = request.get_json(silent=True) or {}
    password = data.get("password")

    if not password:
        return jsonify({"status": "error", "message": "Password is required."}), 400

    return jsonify({"status": "success", "hashed_password": generate_password_hash(password)}), 200


@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}

    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "Receptionist")

    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Missing username or password."
        }), 400

    if role not in ["Admin", "Receptionist"]:
        return jsonify({
            "status": "error",
            "message": "Invalid role."
        }), 400

    conn = None
    try:
        conn = get_connection()

        with conn.cursor() as cursor:

            cursor.execute(
                "SELECT id FROM users WHERE username=%s",
                (username,)
            )

            if cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Username already exists."
                }), 409

            hashed = generate_password_hash(password)

            cursor.execute("""
                INSERT INTO users
                (username, password, role, status)
                VALUES (%s, %s, %s, %s)
            """, (
                username,
                hashed,
                role,
                "Active"
            ))

        conn.commit()

        return jsonify({
            "status": "success",
            "message": "User created successfully."
        }), 201

    except Exception as e:

        if conn:
            conn.rollback()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

    finally:

        if conn:
            conn.close()

@app.route("/bookings", methods=["GET"])
def get_bookings():
    search = request.args.get("search", "").strip()
    status = normalize_status(request.args.get("status"))

    try:
        page = max(int(request.args.get("page", 1)), 1)
        limit = min(max(int(request.args.get("limit", 20)), 1), 100)
    except ValueError:
        return jsonify({"status": "error", "message": "page and limit must be valid numbers."}), 400

    offset = (page - 1) * limit
    where = []
    params = []

    if status:
        if status not in ALL_BOOKING_STATUSES:
            return jsonify({"status": "error", "message": "Invalid status filter."}), 400
        where.append("b.status = %s")
        params.append(status)

    if search:
        where.append("""
            (
                b.booking_reference LIKE %s OR
                b.guest_name LIKE %s OR
                b.phone LIKE %s OR
                b.email LIKE %s
            )
        """)
        search_value = f"%{search}%"
        params.extend([search_value, search_value, search_value, search_value])

    where_sql = f"WHERE {' AND '.join(where)}" if where else ""

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(f"""
                SELECT COUNT(*) AS total
                FROM bookings b
                JOIN room_types r ON b.room_type_id = r.id
                {where_sql}
            """, params)
            total = cursor.fetchone()["total"]

            cursor.execute(f"""
                SELECT
                    b.id,
                    b.booking_reference,
                    b.guest_name,
                    b.email,
                    b.phone,
                    b.room_type_id,
                    b.checkin_date,
                    b.checkout_date,
                    b.guests,
                    b.status,
                    b.admin_notes,
                    b.created_by,
                    b.created_at,
                    b.updated_at,
                    r.name AS room_name,
                    r.price
                FROM bookings b
                JOIN room_types r ON b.room_type_id = r.id
                {where_sql}
                ORDER BY b.created_at DESC
                LIMIT %s OFFSET %s
            """, [*params, limit, offset])
            bookings = cursor.fetchall()

        return jsonify({
            "status": "success",
            "page": page,
            "limit": limit,
            "total": total,
            "bookings": serialize_rows(bookings),
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/create_booking", methods=["POST"])
def create_booking():
    data = request.get_json(silent=True) or {}
    required_fields = ["guest_name", "email", "phone", "room_type_id", "checkin_date", "checkout_date", "guests"]

    error = require_fields(data, required_fields)
    if error:
        return jsonify({"status": "error", "message": error}), 400

    try:
        checkin, checkout = validate_booking_dates(data["checkin_date"], data["checkout_date"])
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    reference = f"SHV-{uuid.uuid4().hex[:8].upper()}"
    conn = None

    try:
        conn = get_connection()
        conn.begin()

        with conn.cursor() as cursor:
            duplicate = check_duplicate_booking(cursor, data, checkin, checkout)
            if duplicate:
                conn.rollback()
                return jsonify({
                    "status": "error",
                    "message": "Duplicate booking detected.",
                    "booking_reference": duplicate["booking_reference"],
                }), 409

            room = get_locked_room_type(cursor, data["room_type_id"])
            if not room:
                conn.rollback()
                return jsonify({"status": "error", "message": "Invalid room type."}), 400

            booked = count_overlapping_bookings(cursor, data["room_type_id"], checkin, checkout)
            available = max(room["total_rooms"] - booked, 0)
            if available <= 0:
                conn.rollback()
                return jsonify({"status": "error", "message": "No rooms available for the selected dates."}), 409

            cursor.execute("""
                INSERT INTO bookings
                (
                    booking_reference,
                    guest_name,
                    email,
                    phone,
                    room_type_id,
                    checkin_date,
                    checkout_date,
                    guests,
                    status,
                    admin_notes,
                    created_by
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                reference,
                data["guest_name"],
                data["email"],
                data["phone"],
                data["room_type_id"],
                checkin,
                checkout,
                data["guests"],
                "pending",
                data.get("admin_notes"),
                data.get("created_by", "website"),
            ))

            booking_id = cursor.lastrowid
            cursor.execute("""
                SELECT id, booking_reference, status, created_at
                FROM bookings
                WHERE id = %s
            """, (booking_id,))
            booking = cursor.fetchone()

        conn.commit()
        return jsonify({
            "status": "success",
            "message": "Booking created successfully.",
            "booking": serialize_row(booking),
        }), 201
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/booking/<int:booking_id>", methods=["PUT"])
def edit_booking(booking_id):
    data = request.get_json(silent=True) or {}
    required_fields = ["guest_name", "email", "phone", "room_type_id", "checkin_date", "checkout_date", "guests"]

    error = require_fields(data, required_fields)
    if error:
        return jsonify({"status": "error", "message": error}), 400

    try:
        checkin, checkout = validate_booking_dates(data["checkin_date"], data["checkout_date"])
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    conn = None
    try:
        conn = get_connection()
        conn.begin()

        with conn.cursor() as cursor:
            cursor.execute("SELECT id, status FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))
            existing_booking = cursor.fetchone()

            if not existing_booking:
                conn.rollback()
                return jsonify({"status": "error", "message": "Booking not found."}), 404

            if existing_booking["status"] not in ACTIVE_BOOKING_STATUSES:
                conn.rollback()
                return jsonify({"status": "error", "message": "Only active bookings can be edited."}), 400

            duplicate = check_duplicate_booking(cursor, data, checkin, checkout, exclude_booking_id=booking_id)
            if duplicate:
                conn.rollback()
                return jsonify({
                    "status": "error",
                    "message": "Duplicate booking detected.",
                    "booking_reference": duplicate["booking_reference"],
                }), 409

            room = get_locked_room_type(cursor, data["room_type_id"])
            if not room:
                conn.rollback()
                return jsonify({"status": "error", "message": "Invalid room type."}), 400

            booked = count_overlapping_bookings(cursor, data["room_type_id"], checkin, checkout, exclude_booking_id=booking_id)
            if max(room["total_rooms"] - booked, 0) <= 0:
                conn.rollback()
                return jsonify({"status": "error", "message": "No rooms available for the selected dates."}), 409

            cursor.execute("""
                UPDATE bookings
                SET guest_name = %s,
                    email = %s,
                    phone = %s,
                    room_type_id = %s,
                    checkin_date = %s,
                    checkout_date = %s,
                    guests = %s,
                    admin_notes = %s
                WHERE id = %s
            """, (
                data["guest_name"],
                data["email"],
                data["phone"],
                data["room_type_id"],
                checkin,
                checkout,
                data["guests"],
                data.get("admin_notes"),
                booking_id,
            ))

        conn.commit()
        return jsonify({"status": "success", "message": "Booking updated successfully.", "booking_id": booking_id}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/booking/<booking_reference>", methods=["GET"])
def get_booking_by_reference(booking_reference):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    b.id,
                    b.booking_reference,
                    b.guest_name,
                    b.email,
                    b.phone,
                    b.room_type_id,
                    b.checkin_date,
                    b.checkout_date,
                    b.guests,
                    b.status,
                    b.admin_notes,
                    b.created_by,
                    b.created_at,
                    b.updated_at,
                    r.name AS room_name,
                    r.price
                FROM bookings b
                JOIN room_types r ON b.room_type_id = r.id
                WHERE b.booking_reference = %s
            """, (booking_reference,))
            booking = cursor.fetchone()

        if not booking:
            return jsonify({"status": "error", "message": "Booking not found."}), 404

        return jsonify({"status": "success", "booking": serialize_row(booking)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/availability", methods=["GET"])
def availability():
    checkin_raw = request.args.get("checkin")
    checkout_raw = request.args.get("checkout")

    if not checkin_raw or not checkout_raw:
        return jsonify({"status": "error", "message": "Missing dates."}), 400

    try:
        checkin, checkout = validate_booking_dates(checkin_raw, checkout_raw)
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 400

    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, price, total_rooms FROM room_types ORDER BY name")
            room_types = cursor.fetchall()

            rooms = []
            for room in room_types:
                booked = count_overlapping_bookings(cursor, room["id"], checkin, checkout)
                available = max(room["total_rooms"] - booked, 0)
                rooms.append({
                    "id": room["id"],
                    "name": room["name"],
                    "price": serialize_value(room["price"]),
                    "total_rooms": room["total_rooms"],
                    "booked": booked,
                    "available": available,
                })

        return jsonify({"status": "success", "rooms": rooms}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/booking/<int:booking_id>/status", methods=["PUT"])
def update_booking_status(booking_id):
    data = request.get_json(silent=True) or {}
    new_status = normalize_status(data.get("status"))
    changed_by = data.get("changed_by", "admin")

    if not new_status:
        return jsonify({"status": "error", "message": "Status is required."}), 400
    if new_status not in ALL_BOOKING_STATUSES:
        return jsonify({"status": "error", "message": "Invalid status."}), 400

    conn = None
    try:
        conn = get_connection()
        conn.begin()

        with conn.cursor() as cursor:
            cursor.execute("SELECT id, status FROM bookings WHERE id = %s FOR UPDATE", (booking_id,))
            booking = cursor.fetchone()

            if not booking:
                conn.rollback()
                return jsonify({"status": "error", "message": "Booking not found."}), 404

            current_status = booking["status"]
            if new_status not in ALLOWED_STATUS_TRANSITIONS[current_status]:
                conn.rollback()
                return jsonify({
                    "status": "error",
                    "message": f"Cannot change booking from '{current_status}' to '{new_status}'.",
                }), 400

            cursor.execute("UPDATE bookings SET status = %s WHERE id = %s", (new_status, booking_id))
            insert_booking_history(cursor, booking_id, current_status, new_status, changed_by)

        conn.commit()
        return jsonify({
            "status": "success",
            "message": "Booking status updated successfully.",
            "booking_id": booking_id,
            "previous_status": current_status,
            "current_status": new_status,
        }), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/booking/<int:booking_id>/cancel", methods=["PUT"])
def cancel_booking(booking_id):
    data = request.get_json(silent=True) or {}
    data["status"] = "cancelled"
    with app.test_request_context(json=data):
        return update_booking_status(booking_id)


@app.route("/booking/<int:booking_id>/history", methods=["GET"])
def get_booking_history(booking_id):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, booking_id, old_status, new_status, changed_by, changed_at
                FROM booking_history
                WHERE booking_id = %s
                ORDER BY changed_at DESC
            """, (booking_id,))
            history = cursor.fetchall()
        return jsonify({"status": "success", "history": serialize_rows(history)}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/dashboard", methods=["GET"])
def dashboard():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT status, COUNT(*) AS count FROM bookings GROUP BY status")
            status_rows = cursor.fetchall()

            stats = {status: 0 for status in ALL_BOOKING_STATUSES}
            for row in status_rows:
                stats[row["status"]] = row["count"]

            cursor.execute("SELECT COUNT(*) AS today_bookings FROM bookings WHERE DATE(created_at) = CURDATE()")
            today_bookings = cursor.fetchone()["today_bookings"]

            cursor.execute("SELECT COALESCE(SUM(total_rooms), 0) AS total_rooms FROM room_types")
            total_rooms = cursor.fetchone()["total_rooms"]

            checked_in = stats["checked_in"]
            available_rooms = max(total_rooms - checked_in, 0)
            occupancy = round((checked_in / total_rooms) * 100) if total_rooms else 0

        return jsonify({
            "status": "success",
            "today_bookings": today_bookings,
            **stats,
            "total_rooms": total_rooms,
            "available_rooms": available_rooms,
            "occupancy": occupancy,
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/rooms", methods=["GET"])
def get_rooms_api():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, price, total_rooms, description, image_url, amenities, pricing FROM room_types")
            rows = cursor.fetchall()

            rooms = []
            for r in rows:
                try:
                    amenities = json.loads(r["amenities"]) if r.get("amenities") else []
                except:
                    amenities = []

                try:
                    pricing = json.loads(r["pricing"]) if r.get("pricing") else {}
                except:
                    pricing = {}

                rooms.append({
                    "id": r["id"],
                    "name": r["name"],
                    "price": float(r["price"]),
                    "total_rooms": r["total_rooms"],
                    "description": r["description"] or "",
                    "image_url": r["image_url"] or "",
                    "amenities": amenities,
                    "pricing": pricing
                })
            return jsonify({"status": "success", "rooms": rooms}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/rooms/<int:room_id>", methods=["PUT"])
def update_room_api(room_id):
    data = request.get_json(silent=True) or {}
    name = data.get("name")
    price = data.get("price")
    description = data.get("description")
    image_url = data.get("image_url")
    amenities = data.get("amenities")
    pricing = data.get("pricing")

    if not name or price is None:
        return jsonify({"status": "error", "message": "Name and price are required."}), 400

    conn = None
    try:
        conn = get_connection()
        conn.begin()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM room_types WHERE id = %s", (room_id,))
            if not cursor.fetchone():
                return jsonify({"status": "error", "message": "Room not found."}), 404

            cursor.execute("""
                UPDATE room_types
                SET name = %s,
                    price = %s,
                    description = %s,
                    image_url = %s,
                    amenities = %s,
                    pricing = %s
                WHERE id = %s
            """, (
                name,
                price,
                description,
                image_url,
                json.dumps(amenities) if amenities is not None else None,
                json.dumps(pricing) if pricing is not None else None,
                room_id
            ))
        conn.commit()
        return jsonify({"status": "success", "message": "Room updated successfully."}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/uploads/<filename>")
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route("/api/upload", methods=["POST"])
def upload_file_api():
    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"status": "error", "message": "Empty file name"}), 400

    filename = secure_filename(file.filename)
    ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
    if ext not in ["jpg", "jpeg", "png", "webp"]:
        return jsonify({"status": "error", "message": "Only JPG, JPEG, PNG, and WEBP formats are supported."}), 400

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 3 * 1024 * 1024:
        return jsonify({"status": "error", "message": "File size exceeds the 3 MB limit."}), 400

    try:
        img = Image.open(file)
        try:
            from PIL import ImageOps
            img = ImageOps.exif_transpose(img)
        except:
            pass

        max_size = 1600
        width, height = img.size
        if width > max_size or height > max_size:
            if width > height:
                new_width = max_size
                new_height = int((max_size / width) * height)
            else:
                new_height = max_size
                new_width = int((max_size / height) * width)
            img = img.resize((new_width, new_height), Image.LANCZOS)

        unique_name = f"{uuid.uuid4().hex}.jpg"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(filepath, "JPEG", quality=85)

        return jsonify({
            "status": "success",
            "url": f"/uploads/{unique_name}"
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": f"Failed to process image: {str(e)}"}), 500


@app.route("/api/gallery", methods=["GET"])
def get_gallery_api():
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, image_url, created_at FROM gallery ORDER BY id DESC")
            rows = cursor.fetchall()
            images = []
            for r in rows:
                images.append({
                    "id": r["id"],
                    "image_url": r["image_url"],
                    "created_at": r["created_at"].isoformat() if isinstance(r["created_at"], (date, datetime)) else str(r["created_at"])
                })
            return jsonify({"status": "success", "images": images}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/gallery", methods=["POST"])
def add_gallery_api():
    data = request.get_json(silent=True) or {}
    image_url = data.get("image_url")
    if not image_url:
        return jsonify({"status": "error", "message": "Image URL is required."}), 400

    conn = None
    try:
        conn = get_connection()
        conn.begin()
        with conn.cursor() as cursor:
            cursor.execute("INSERT INTO gallery (image_url) VALUES (%s)", (image_url,))
        conn.commit()
        return jsonify({"status": "success", "message": "Image added to gallery."}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@app.route("/api/gallery/<int:img_id>", methods=["DELETE"])
def delete_gallery_api(img_id):
    conn = None
    try:
        conn = get_connection()
        conn.begin()
        with conn.cursor() as cursor:
            cursor.execute("SELECT image_url FROM gallery WHERE id = %s", (img_id,))
            row = cursor.fetchone()
            if not row:
                return jsonify({"status": "error", "message": "Image not found."}), 404

            img_url = row["image_url"]
            if img_url.startswith("/uploads/"):
                filename = img_url.split("/")[-1]
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception as e:
                        print(f"Failed to delete file {filepath}: {e}")

            cursor.execute("DELETE FROM gallery WHERE id = %s", (img_id,))
        conn.commit()
        return jsonify({"status": "success", "message": "Image deleted from gallery."}), 200
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


def run_migrations():
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SHOW COLUMNS FROM room_types")
            columns = [row["Field"] for row in cursor.fetchall()]

            alterations = []
            if "description" not in columns:
                alterations.append("ADD COLUMN description TEXT")
            if "image_url" not in columns:
                alterations.append("ADD COLUMN image_url VARCHAR(500)")
            if "amenities" not in columns:
                alterations.append("ADD COLUMN amenities TEXT")
            if "pricing" not in columns:
                alterations.append("ADD COLUMN pricing TEXT")

            if alterations:
                cursor.execute(f"ALTER TABLE room_types {', '.join(alterations)}")
                conn.commit()
                print("Database migrated successfully.")

            cursor.execute("SELECT id, description, image_url FROM room_types")
            existing = cursor.fetchall()

            defaults = {
                1: {
                    "description": "A well-appointed retreat offering modern comforts and elegant simplicity — the ideal base for both leisure and business.",
                    "image_url": "pic5",
                    "amenities": [
                        {"icon": "bi-thermometer-snow", "label": "Air Conditioning"},
                        {"icon": "bi-door-closed", "label": "Private Bathroom"},
                        {"icon": "bi-tv", "label": "Flat Screen TV"},
                        {"icon": "bi-wifi", "label": "High-Speed WiFi"},
                        {"icon": "bi-briefcase", "label": "Work Desk"}
                    ],
                    "pricing": {
                        "bedBreakfast": 5000,
                        "halfBoard": 6500,
                        "fullBoard": 7500
                    }
                },
                2: {
                    "description": "Elevated living with a private balcony and resort panoramas. Perfect for those who seek a little more indulgence.",
                    "image_url": "pic15",
                    "amenities": [
                        {"icon": "bi-door-open", "label": "Balcony"},
                        {"icon": "bi-thermometer-snow", "label": "Air Conditioning"},
                        {"icon": "bi-display", "label": "Smart TV"},
                        {"icon": "bi-wifi", "label": "High-Speed WiFi"},
                        {"icon": "bi-bell", "label": "Room Service"}
                    ],
                    "pricing": {
                        "bedBreakfast": 5000,
                        "halfBoard": 6000,
                        "fullBoard": 7300
                    }
                },
                3: {
                    "description": "Spacious twin-bed luxury with smart amenities — crafted for companions, colleagues, or families seeking shared comfort.",
                    "image_url": "room1",
                    "amenities": [
                        {"icon": "bi-people", "label": "Twin Beds"},
                        {"icon": "bi-display", "label": "Smart TV"},
                        {"icon": "bi-wifi", "label": "High-Speed WiFi"},
                        {"icon": "bi-snow2", "label": "Mini Fridge"},
                        {"icon": "bi-bell", "label": "Room Service"}
                    ],
                    "pricing": {
                        "bedBreakfast": 6000,
                        "halfBoard": 8500,
                        "fullBoard": 10500
                    }
                },
                4: {
                    "description": "An exceptional sanctuary featuring luxury bedding, a premium mini bar, and an array of curated amenities for the discerning traveller.",
                    "image_url": "room2",
                    "amenities": [
                        {"icon": "bi-stars", "label": "Luxury Bedding"},
                        {"icon": "bi-cup-straw", "label": "Mini Bar"},
                        {"icon": "bi-display", "label": "Smart TV"},
                        {"icon": "bi-reception-4", "label": "Premium WiFi"},
                        {"icon": "bi-briefcase", "label": "Work Desk"}
                    ],
                    "pricing": {
                        "bedBreakfast": 8000,
                        "halfBoard": 9300,
                        "fullBoard": 10300
                    }
                }
            }

            for row in existing:
                rid = row["id"]
                if not row.get("description") and rid in defaults:
                    d = defaults[rid]
                    cursor.execute("""
                        UPDATE room_types
                        SET description = %s, image_url = %s, amenities = %s, pricing = %s
                        WHERE id = %s
                    """, (
                        d["description"],
                        d["image_url"],
                        json.dumps(d["amenities"]),
                        json.dumps(d["pricing"]),
                        rid
                    ))
            # Create gallery table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS gallery (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    image_url VARCHAR(500) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

            # Check if gallery has entries
            cursor.execute("SELECT COUNT(*) as cnt FROM gallery")
            gallery_count = cursor.fetchone()["cnt"]

            if gallery_count == 0:
                # Copy default images from src/images to uploads/ and insert
                src_images_dir = os.path.abspath(os.path.join(BACKEND_DIR, '..', 'images'))
                default_gallery = [
                    "shan2.jpg", "pic1.jpg", "pic2.jpg", "pic3.jpg", "pic4.jpg",
                    "pic5.jpg", "pic6.jpg", "pic7.jpg", "pic8.jpg", "pic9.jpg",
                    "pic10.jpg", "pic11.jpg", "pic12.jpg", "pic13.jpg", "pic14.jpg",
                    "pic15.jpg", "pic16.jpg", "pic17.jpg", "pic18.jpg", "pic19.jpg"
                ]

                if os.path.exists(src_images_dir):
                    for img in default_gallery:
                        src_path = os.path.join(src_images_dir, img)
                        if os.path.exists(src_path):
                            dest_path = os.path.join(app.config['UPLOAD_FOLDER'], img)
                            if not os.path.exists(dest_path):
                                shutil.copy2(src_path, dest_path)

                            rel_url = f"/uploads/{img}"
                            cursor.execute("INSERT INTO gallery (image_url) VALUES (%s)", (rel_url,))
                    conn.commit()
                    print("Seeded default gallery database entries.")
            conn.commit()
    except Exception as e:
        print(f"Error running database migrations: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    try:
        connection = get_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            if request.method == 'GET':
                # Fetch current settings (id=1)
                cursor.execute("SELECT * FROM site_settings WHERE id = 1")
                settings = cursor.fetchone()
                if not settings:
                    settings = {
                        "resortName": "Shanvilla Resort",
                        "phone": "0742682580",
                        "email": "info@shanvilla.com",
                        "checkinTime": "14:00",
                        "checkoutTime": "10:00",
                        "cancellationPolicy": "Free cancellation up to 24 hours before check-in."
                    }
                return jsonify({"status": "success", "settings": settings})

            elif request.method == 'POST':
                # Save new settings
                data = request.json
                sql = """
                    UPDATE site_settings
                    SET resortName=%s, phone=%s, email=%s, checkinTime=%s, checkoutTime=%s, cancellationPolicy=%s
                    WHERE id = 1
                """
                cursor.execute(sql, (
                    data.get('resortName'),
                    data.get('phone'),
                    data.get('email'),
                    data.get('checkinTime'),
                    data.get('checkoutTime'),
                    data.get('cancellationPolicy')
                ))
                connection.commit()
                return jsonify({"status": "success", "message": "Settings updated"})
    except Exception as e:
        print(f"Error handling settings: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if 'connection' in locals() and connection.open:
            connection.close()

@app.route("/api/users", methods=["GET"])
def get_users():
    conn = get_connection()
    cursor = conn.cursor(pymysql.cursors.DictCursor)

    cursor.execute("""
        SELECT
            id,
            username,
            role,
            status,
            created_at,
            last_login
        FROM users
        ORDER BY id DESC
    """)

    users = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(users)
# Run self-healing migrations on startup
run_migrations()


"""


Password hashing:
1. Call POST /users/hash-password with {"password":"your-admin-password"}.
2. Copy the returned hashed_password into users.password.
3. Remove /users/hash-password from production after migration.
"""

