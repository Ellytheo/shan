import os
import uuid
import re
import json
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from functools import wraps
from datetime import date, datetime,timedelta
from decimal import Decimal
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies
)

import pymysql
from flask import Flask, jsonify, request, send_from_directory,g
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from PIL import Image
import shutil

app = Flask(__name__)

# ---------------- Email Notification Configuration ----------------

def send_booking_email_async(booking_data, room_name, total_price, reference):
    def _send():
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_EMAIL", "")
        smtp_password = os.environ.get("SMTP_PASSWORD", "")
        admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "reception@shanvillaresortkenya.co.ke")

        if not smtp_user or not smtp_password:
            print("[Email Notification Warning] SMTP credentials not configured. Set SMTP_EMAIL & SMTP_PASSWORD in environment to enable email push notifications.")
            return

        try:
            # 1. Email Notification to Admin / Reception Phone
            admin_msg = MIMEMultipart("alternative")
            admin_msg["From"] = f"Shanvilla Booking System <{smtp_user}>"
            admin_msg["To"] = admin_email
            admin_msg["Subject"] = f"🔔 NEW BOOKING: #{reference} - {booking_data['guest_name']}"

            admin_plain = f"""
            🔔 NEW BOOKING ALERT - SHANVILLA RESORT

            Booking Ref: #{reference}
            Guest Name:  {booking_data['guest_name']}
            Phone:       {booking_data['phone']}
            Email:       {booking_data['email']}

            Room Type:   {room_name}
            Check-in:    {booking_data['checkin_date']}
            Check-out:   {booking_data['checkout_date']}
            Guests:      {booking_data['guests']}
            Meal Plan:   {booking_data.get('meal_plan', 'bedBreakfast')}
            Total Price: KES {float(total_price):,.2f}
            """

            admin_html = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #0F8F46; margin-top: 0;">🔔 New Booking Alert</h2>
              <p style="font-size: 15px; color: #333;">A new reservation has been made on the website.</p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <tr><td style="padding: 10px; font-weight: bold; width: 130px; color: #555; border-bottom: 1px solid #eee;">Booking Ref:</td><td style="padding: 10px; font-weight: bold; color: #0F8F46; border-bottom: 1px solid #eee;">#{reference}</td></tr>
                <tr style="background: #fdfdfd;"><td style="padding: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Guest Name:</td><td style="padding: 10px; color: #111; border-bottom: 1px solid #eee;">{booking_data['guest_name']}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Phone:</td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="tel:{booking_data['phone']}" style="color: #0F8F46; font-weight: bold; text-decoration: none;">{booking_data['phone']} (Tap to Call)</a></td></tr>
                <tr style="background: #fdfdfd;"><td style="padding: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Email:</td><td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:{booking_data['email']}" style="color: #0F8F46; text-decoration: none;">{booking_data['email']}</a></td></tr>
                <tr><td style="padding: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Room Type:</td><td style="padding: 10px; color: #111; border-bottom: 1px solid #eee;">{room_name}</td></tr>
                <tr style="background: #fdfdfd;"><td style="padding: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Stay Dates:</td><td style="padding: 10px; color: #111; border-bottom: 1px solid #eee;">{booking_data['checkin_date']} &rarr; {booking_data['checkout_date']}</td></tr>
                <tr><td style="padding: 10px; font-weight: bold; color: #555; border-bottom: 1px solid #eee;">Guests &amp; Plan:</td><td style="padding: 10px; color: #111; border-bottom: 1px solid #eee;">{booking_data['guests']} Guest(s) | {booking_data.get('meal_plan', 'B&B')}</td></tr>
                <tr style="background: #f0fdf4;"><td style="padding: 12px; font-weight: bold; color: #0F8F46;">Total Price:</td><td style="padding: 12px; font-weight: bold; color: #0F8F46; font-size: 1.15rem;">KES {float(total_price):,.2f}</td></tr>
              </table>
            </div>
            """

            admin_msg.attach(MIMEText(admin_plain, "plain"))
            admin_msg.attach(MIMEText(admin_html, "html"))

            with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(admin_msg)

                # 2. Confirmation Email to Guest
                if booking_data.get("email"):
                    guest_msg = MIMEMultipart("alternative")
                    guest_msg["From"] = f"Shanvilla Resort <{smtp_user}>"
                    guest_msg["To"] = booking_data["email"]
                    guest_msg["Subject"] = f"Booking Confirmation #{reference} - Shanvilla Resort"

                    guest_html = f"""
                    <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px;">
                      <h2 style="color: #0F8F46;">Thank You For Choosing Shanvilla Resort!</h2>
                      <p>Dear {booking_data['guest_name']},</p>
                      <p>We have successfully received your booking. Here is your reservation summary:</p>
                      
                      <div style="background: #FAF5EF; padding: 16px; border-radius: 10px; margin: 15px 0;">
                        <p style="margin: 6px 0;"><strong>Booking Reference:</strong> #{reference}</p>
                        <p style="margin: 6px 0;"><strong>Room Type:</strong> {room_name}</p>
                        <p style="margin: 6px 0;"><strong>Check-in:</strong> {booking_data['checkin_date']}</p>
                        <p style="margin: 6px 0;"><strong>Check-out:</strong> {booking_data['checkout_date']}</p>
                        <p style="margin: 6px 0;"><strong>Total Price:</strong> KES {float(total_price):,.2f}</p>
                      </div>

                      <p>If you have any special requests or questions, please feel free to call us at <strong>+254 111427894</strong> or email reception@shanvillaresortkenya.co.ke.</p>
                      <p style="color: #666; font-size: 13px; margin-top: 25px;">Shanvilla Resort Ltd, Maragua, Murang’a County, Kenya</p>
                    </div>
                    """
                    guest_msg.attach(MIMEText(guest_html, "html"))
                    server.send_message(guest_msg)

            print(f"[Email Notification] Successfully dispatched booking emails for #{reference}")
        except Exception as e:
            print(f"[Email Notification Error] Failed to send email for booking #{reference}: {e}")

    threading.Thread(target=_send, daemon=True).start()

def send_contact_email_async(contact_data):
    def _send():
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", 587))
        smtp_user = os.environ.get("SMTP_EMAIL", "")
        smtp_password = os.environ.get("SMTP_PASSWORD", "")
        admin_email = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "reception@shanvillaresortkenya.co.ke")

        if not smtp_user or not smtp_password:
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"Shanvilla Contact Form <{smtp_user}>"
            msg["To"] = admin_email
            msg["Subject"] = f"📩 New Inquiry: {contact_data['first_name']} {contact_data['last_name']}"

            html = f"""
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
              <h3 style="color: #0F8F46;">📩 New Contact Form Inquiry</h3>
              <p><strong>Name:</strong> {contact_data['first_name']} {contact_data['last_name']}</p>
              <p><strong>Phone:</strong> <a href="tel:{contact_data['phone']}" style="color: #0F8F46; font-weight: bold;">{contact_data['phone']}</a></p>
              <p><strong>Email:</strong> <a href="mailto:{contact_data['email']}">{contact_data['email']}</a></p>
              <p><strong>Message:</strong></p>
              <blockquote style="background: #f9f9f9; padding: 12px; border-left: 4px solid #0F8F46; margin: 10px 0;">{contact_data['message']}</blockquote>
            </div>
            """
            msg.attach(MIMEText(html, "html"))
            with smtplib.SMTP(smtp_server, smtp_port, timeout=12) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)
            print(f"[Contact Notification] Email sent for {contact_data['first_name']} {contact_data['last_name']}")
        except Exception as e:
            print(f"[Contact Notification Error] {e}")

    threading.Thread(target=_send, daemon=True).start()

# ---------------- JWT Configuration ----------------

app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY",
    "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET"
)

# Token expiry
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=30)
app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=7)

# Store JWTs in cookies
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]

# Cookie security
is_dev = app.debug or os.environ.get("FLASK_ENV") == "development" or not os.environ.get("PYTHONANYWHERE_DOMAIN")
app.config["JWT_COOKIE_SECURE"] = not is_dev
app.config["JWT_COOKIE_HTTPONLY"] = True
app.config["JWT_COOKIE_SAMESITE"] = "Lax" if is_dev else "None"

# CSRF protection
app.config["JWT_COOKIE_CSRF_PROTECT"] = False

# Cookie paths
app.config["JWT_ACCESS_COOKIE_PATH"] = "/"
app.config["JWT_REFRESH_COOKIE_PATH"] = "/refresh"

jwt = JWTManager(app)

limiter = Limiter(
    key_func=get_remote_address,
    app=app,
    storage_uri="memory://",
    default_limits=[]
)

#------------------------------------------------

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({
        "status": "error",
        "message": "Too many login attempts. Please wait a minute before trying again."
    }), 429

#---------------------------------------------------------------------------------------------------
CORS(
    app,
    supports_credentials=True,
    origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://shanvilla-vite.vercel.app"
    ]
)

# Upload Configuration
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if os.path.basename(BACKEND_DIR) == 'common' and os.path.basename(os.path.dirname(BACKEND_DIR)) == 'src':
    UPLOAD_FOLDER = os.path.abspath(os.path.join(BACKEND_DIR, '..', '..', 'uploads'))
else:
    UPLOAD_FOLDER = os.path.join(BACKEND_DIR, 'uploads')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Flask limit

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

@app.after_request
def add_security_headers(response):
    if request.is_secure:
        response.headers["Strict-Transport-Security"] = (
            "max-age=31536000; includeSubDomains"
        )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = (
        "strict-origin-when-cross-origin"
    )
    response.headers["Permissions-Policy"] = (
        "camera=(), microphone=(), geolocation=()"
    )
    response.headers["Content-Security-Policy"] = (
       "default-src 'self'; "
       "img-src 'self' https: data: blob:; "
       "style-src 'self' 'unsafe-inline' https:; "
       "font-src 'self' https: data:; "
       "script-src 'self'; "
       "connect-src 'self' https://shanvilla.pythonanywhere.com http://localhost:5173;"
    )
    return response

def login_limit_key():
    data = request.get_json(silent=True) or {}
    username = (
        data.get("username", "")
        .strip()
        .lower()
    )
    ip = get_remote_address()
    if username:
        return f"{ip}:{username}"
    return ip

def require_admin():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({
            "status": "error",
            "message": "Authentication required."
        }), 401
    claims = get_jwt()
    role = claims.get("role")
    username = claims.get("username")
    if role != "Admin":
        return jsonify({
            "status": "error",
            "message": "Only administrators can perform this action."
        }), 403
    return {
        "id": int(user_id),
        "username": username,
        "role": role
    }

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        current_user = require_admin()
        if not isinstance(current_user, dict):
            return current_user
        g.current_user = current_user
        return fn(*args, **kwargs)
    return wrapper

def log_activity(
    admin_id,
    admin_username,
    action,
    target_type,
    target_id=None,
    target_name=None,
    description=None
):
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO audit_logs
                (
                    admin_id,
                    admin_username,
                    action,
                    target_type,
                    target_id,
                    target_name,
                    description
                )
                VALUES
                (
                    %s,%s,%s,%s,%s,%s,%s
                )
            """,(
                admin_id,
                admin_username,
                action,
                target_type,
                target_id,
                target_name,
                description
            ))
        conn.commit()
    except Exception as e:
        print("Audit Log Error:",e)
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

def validate_password(password):
    if len(password) < 12:
        return False, "Password must be at least 12 characters."
    if not re.search(r"[A-Z]", password):
        return False, "Password needs an uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password needs a lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password needs a number."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password needs a special character."
    return True, None

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
        SELECT id, name, price, total_rooms, max_guests, pricing
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

# =====================================================================
# AUTH & SECURITY ROUTES
# =====================================================================

@app.route("/logout", methods=["POST"])
@jwt_required(optional=True)
def logout():
    response = jsonify({
        "status": "success",
        "message": "Logged out successfully."
    })
    unset_jwt_cookies(response)
    return response, 200

@app.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    access_token = create_access_token(
        identity=identity,
        additional_claims={
            "username": claims["username"],
            "role": claims["role"]
        }
    )
    response = jsonify({
        "status": "success",
        "message": "Token refreshed."
    })
    set_access_cookies(response, access_token)
    return response, 200

# =====================================================================
# CONTACT FORM ROUTES
# =====================================================================

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
        send_contact_email_async({
            "first_name": data.get("first_name", ""),
            "last_name": data.get("last_name", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "message": data.get("message", "")
        })
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
                SELECT id, first_name, last_name, email, phone, message, status
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

@app.route("/update_contact_status/<int:contact_id>", methods=["PUT"])
def update_contact_status(contact_id):
    data = request.get_json() or {}
    new_status = data.get("status", "read")
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE contact_form
                SET status = %s
                WHERE id = %s
            """, (new_status, contact_id))
        conn.commit()
        return jsonify({"status": "success", "message": "Inquiry status updated successfully."}), 200
    except Exception as e:
        if conn:
            conn.rollback()
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
@limiter.limit(
    "5 per minute;20 per hour",
    key_func=login_limit_key
)
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
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
                    role,
                    status,
                    failed_attempts,
                    locked_until
                FROM users
                WHERE username = %s
            """, (username,))
            user = cursor.fetchone()
        if not user:
            return jsonify({
                "status": "error",
                "message": "Invalid username or password."
            }), 401
        if (
            user["locked_until"] is not None and
            datetime.utcnow() < user["locked_until"]
        ):
            remaining = int(
                (user["locked_until"] - datetime.utcnow()).total_seconds() // 60
            ) + 1
            return jsonify({
                "status": "error",
                "message": f"Account locked. Try again in {remaining} minute(s)."
            }), 423
        if user["status"] == "Disabled":
            return jsonify({
                "status": "error",
                "message": (
                    "Your account has been disabled. "
                    "Please contact your administrator."
                )
            }), 403
        if not check_password_hash(user["password"], password):
            attempts = user["failed_attempts"] + 1
            locked_until = None
            if attempts >= 5:
                locked_until = datetime.utcnow() + timedelta(minutes=15)
                with conn.cursor() as cursor:
                    cursor.execute("""
                        UPDATE users
                        SET
                            failed_attempts = %s,
                            locked_until = %s
                        WHERE id = %s
                    """, (
                        5,
                        locked_until,
                        user["id"]
                    ))
                conn.commit()
                return jsonify({
                    "status": "error",
                    "message": (
                        "Too many failed login attempts. "
                        "Your account has been locked for 15 minutes."
                    )
                }), 423
            with conn.cursor() as cursor:
                cursor.execute("""
                    UPDATE users
                    SET failed_attempts = %s
                    WHERE id = %s
                """, (
                    attempts,
                    user["id"]
                ))
            conn.commit()
            remaining = 5 - attempts
            return jsonify({
                "status": "error",
                "message": (
                    f"Invalid username or password. "
                    f"{remaining} attempt(s) remaining."
                )
            }), 401
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users
                SET
                    failed_attempts = 0,
                    locked_until = NULL,
                    last_login = NOW()
                WHERE id = %s
            """, (user["id"],))
        conn.commit()
        access_token = create_access_token(
            identity=str(user["id"]),
            additional_claims={
                "username": user["username"],
                "role": user["role"]
            }
        )
        refresh_token = create_refresh_token(
            identity=str(user["id"]),
            additional_claims={
                "username": user["username"],
                "role": user["role"]
            }
        )
        response = jsonify({
            "status": "success",
            "message": "Login successful.",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"],
                "status": user["status"]
            }
        })
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)
        return response, 200
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
@jwt_required()
@admin_required
def signup():
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    role = data.get("role", "Receptionist").strip()
    if not username or not password:
        return jsonify({
            "status": "error",
            "message": "Username and password are required."
        }), 400
    valid, message = validate_password(password)
    if not valid:
        return jsonify({
            "status": "error",
            "message": message
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
            cursor.execute("""
                SELECT id
                FROM users
                WHERE username = %s
            """, (username,))
            if cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Username already exists."
                }), 409
            hashed_password = generate_password_hash(password)
            cursor.execute("""
                INSERT INTO users
                (
                    username,
                    password,
                    role,
                    status
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s
                )
            """, (
                username,
                hashed_password,
                role,
                "Active"
            ))
            new_user_id = cursor.lastrowid
        conn.commit()
        log_activity(
            admin_id=current_user["id"],
            admin_username=current_user["username"],
            action="Create User",
            target_type="User",
            target_id=new_user_id,
            target_name=username,
            description=(
                f"Created new user '{username}' "
                f"with role '{role}' "
                f"and status 'Active'."
            )
        )
        return jsonify({
            "status": "success",
            "message": "User created successfully.",
            "user": {
                "id": new_user_id,
                "username": username,
                "role": role,
                "status": "Active"
            }
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

# =====================================================================
# BOOKING ROUTES
# =====================================================================

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

            # Validate guest count against room maximum
            guests = int(data["guests"])
            max_guests = room.get("max_guests", 2)
            if guests < 1 or guests > max_guests:
                conn.rollback()
                return jsonify({
                    "status": "error",
                    "message": f"This room type allows a maximum of {max_guests} guest(s)."
                }), 400

            booked = count_overlapping_bookings(cursor, data["room_type_id"], checkin, checkout)
            available = max(room["total_rooms"] - booked, 0)
            if available <= 0:
                conn.rollback()
                return jsonify({"status": "error", "message": "No rooms available for the selected dates."}), 409

            # Calculate total price using single/double occupancy rates + meal plan
            nights = (checkout - checkin).days
            meal_plan = data.get("meal_plan", "bedBreakfast")
            if meal_plan not in ("bedBreakfast", "halfBoard", "fullBoard"):
                meal_plan = "bedBreakfast"

            pricing = {}
            if room.get("pricing"):
                try:
                    pricing = json.loads(room["pricing"]) if isinstance(room["pricing"], str) else room["pricing"]
                except Exception:
                    pricing = {}

            def get_rate(pricing_obj, guest_count, plan):
                """Return the per-night rate based on occupancy and meal plan."""
                if guest_count >= 3 and pricing_obj.get("triple"):
                    tier = pricing_obj["triple"]
                elif guest_count == 1 and pricing_obj.get("single"):
                    tier = pricing_obj["single"]
                elif pricing_obj.get("double"):
                    tier = pricing_obj["double"]
                else:
                    tier = pricing_obj
                return Decimal(str(tier.get(plan, tier.get("bedBreakfast", 0))))

            rate = get_rate(pricing, guests, meal_plan) if pricing else Decimal(str(room.get("price", 0)))
            total_price = rate * nights if nights > 0 else Decimal("0")

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
                    total_price,
                    status,
                    admin_notes,
                    created_by
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                reference,
                data["guest_name"],
                data["email"],
                data["phone"],
                data["room_type_id"],
                checkin,
                checkout,
                guests,
                total_price,
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
        send_booking_email_async(
            booking_data=data,
            room_name=room.get("name", "Shanvilla Suite"),
            total_price=total_price,
            reference=reference
        )
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

            # Validate guest count against room maximum
            guests = int(data["guests"])
            max_guests = room.get("max_guests", 2)
            if guests < 1 or guests > max_guests:
                conn.rollback()
                return jsonify({
                    "status": "error",
                    "message": f"This room type allows a maximum of {max_guests} guest(s)."
                }), 400

            booked = count_overlapping_bookings(cursor, data["room_type_id"], checkin, checkout, exclude_booking_id=booking_id)
            if max(room["total_rooms"] - booked, 0) <= 0:
                conn.rollback()
                return jsonify({"status": "error", "message": "No rooms available for the selected dates."}), 409

            # Recalculate total_price
            nights = (checkout - checkin).days
            meal_plan = data.get("meal_plan", "bedBreakfast")
            if meal_plan not in ("bedBreakfast", "halfBoard", "fullBoard"):
                meal_plan = "bedBreakfast"

            pricing = {}
            if room.get("pricing"):
                try:
                    pricing = json.loads(room["pricing"]) if isinstance(room["pricing"], str) else room["pricing"]
                except Exception:
                    pricing = {}

            def get_rate(pricing_obj, guest_count, plan):
                if guest_count >= 3 and pricing_obj.get("triple"):
                    tier = pricing_obj["triple"]
                elif guest_count == 1 and pricing_obj.get("single"):
                    tier = pricing_obj["single"]
                elif pricing_obj.get("double"):
                    tier = pricing_obj["double"]
                else:
                    tier = pricing_obj
                return Decimal(str(tier.get(plan, tier.get("bedBreakfast", 0))))

            rate = get_rate(pricing, guests, meal_plan) if pricing else Decimal(str(room.get("price", 0)))
            total_price = rate * nights if nights > 0 else Decimal("0")

            cursor.execute("""
                UPDATE bookings
                SET guest_name = %s,
                    email = %s,
                    phone = %s,
                    room_type_id = %s,
                    checkin_date = %s,
                    checkout_date = %s,
                    guests = %s,
                    total_price = %s,
                    admin_notes = %s
                WHERE id = %s
            """, (
                data["guest_name"],
                data["email"],
                data["phone"],
                data["room_type_id"],
                checkin,
                checkout,
                guests,
                total_price,
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
            cursor.execute("SELECT id, name, price, total_rooms, pricing, max_guests FROM room_types ORDER BY name")
            room_types = cursor.fetchall()
            rooms = []
            for room in room_types:
                booked = count_overlapping_bookings(cursor, room["id"], checkin, checkout)
                available = max(room["total_rooms"] - booked, 0)
                pricing = None
                if room.get("pricing"):
                    try:
                        pricing = json.loads(room["pricing"]) if isinstance(room["pricing"], str) else room["pricing"]
                    except Exception:
                        pricing = None
                rooms.append({
                    "id": room["id"],
                    "name": room["name"],
                    "price": serialize_value(room["price"]),
                    "total_rooms": room["total_rooms"],
                    "booked": booked,
                    "available": available,
                    "max_guests": room.get("max_guests", 2),
                    "pricing": pricing,
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

# =====================================================================
# DASHBOARD & ROOM ROUTES
# =====================================================================

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
                    "price": float(r["price"]) if r["price"] is not None else 0.0,
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
            # ── room_types table column additions ──────────────────────────
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
            if "max_guests" not in columns:
                alterations.append("ADD COLUMN max_guests INT NOT NULL DEFAULT 2")
            if alterations:
                cursor.execute(f"ALTER TABLE room_types {', '.join(alterations)}")
                conn.commit()
                print("room_types table migrated successfully.")

            # ── bookings table: add total_price column if missing ──────────
            cursor.execute("SHOW COLUMNS FROM bookings")
            booking_cols = [row["Field"] for row in cursor.fetchall()]
            if "total_price" not in booking_cols:
                cursor.execute("ALTER TABLE bookings ADD COLUMN total_price DECIMAL(12,2) DEFAULT NULL")
                conn.commit()
                print("Added total_price column to bookings.")

            # ── seed / update room defaults ────────────────────────────────
            defaults = {
                1: {
                    "name": "Standard Room",
                    "total_rooms": 7,
                    "max_guests": 2,
                    "price": 4000,
                    "description": "A well-appointed retreat offering modern comforts and elegant simplicity — the ideal base for both leisure and business.",
                    "image_url": "pic5",
                    "amenities": [
                        {"icon": "bi-thermometer-snow", "label": "Air Conditioning"},
                        {"icon": "bi-door-closed",      "label": "Private Bathroom"},
                        {"icon": "bi-tv",               "label": "Flat Screen TV"},
                        {"icon": "bi-wifi",             "label": "High-Speed WiFi"},
                        {"icon": "bi-briefcase",        "label": "Work Desk"}
                    ],
                    "pricing": {
                        "single": {"bedBreakfast": 4000, "halfBoard": 5500, "fullBoard": 6500},
                        "double": {"bedBreakfast": 4700, "halfBoard": 7200, "fullBoard": 9500}
                    }
                },
                2: {
                    "name": "Deluxe Room",
                    "total_rooms": 12,
                    "max_guests": 2,
                    "price": 5200,
                    "description": "Elevated living with a private balcony and resort panoramas. Perfect for those who seek a little more indulgence.",
                    "image_url": "pic15",
                    "amenities": [
                        {"icon": "bi-door-open",        "label": "Balcony"},
                        {"icon": "bi-thermometer-snow", "label": "Air Conditioning"},
                        {"icon": "bi-display",          "label": "Smart TV"},
                        {"icon": "bi-wifi",             "label": "High-Speed WiFi"},
                        {"icon": "bi-bell",             "label": "Room Service"}
                    ],
                    "pricing": {
                        "single": {"bedBreakfast": 5200, "halfBoard": 6200, "fullBoard": 7500},
                        "double": {"bedBreakfast": 6000, "halfBoard": 8500, "fullBoard": 10500}
                    }
                },
                3: {
                    "name": "Superior Twin Room",
                    "total_rooms": 1,
                    "max_guests": 3,
                    "price": 8500,
                    "description": "Spacious twin-bed luxury with smart amenities — crafted for companions, colleagues, or families seeking shared comfort.",
                    "image_url": "room1",
                    "amenities": [
                        {"icon": "bi-people",  "label": "Twin Beds"},
                        {"icon": "bi-display", "label": "Smart TV"},
                        {"icon": "bi-wifi",    "label": "High-Speed WiFi"},
                        {"icon": "bi-snow2",   "label": "Mini Fridge"},
                        {"icon": "bi-bell",    "label": "Room Service"}
                    ],
                    "pricing": {
                        "double": {"bedBreakfast": 8500, "halfBoard": 11000, "fullBoard": 13000},
                        "triple": {"bedBreakfast": 9200, "halfBoard": 11700, "fullBoard": 13700}
                    }
                },
                4: {
                    "name": "Executive Room",
                    "total_rooms": 2,
                    "max_guests": 2,
                    "price": 7000,
                    "description": "An exceptional sanctuary featuring luxury bedding, a premium mini bar, and an array of curated amenities for the discerning traveller.",
                    "image_url": "room2",
                    "amenities": [
                        {"icon": "bi-stars",       "label": "Luxury Bedding"},
                        {"icon": "bi-cup-straw",   "label": "Mini Bar"},
                        {"icon": "bi-display",     "label": "Smart TV"},
                        {"icon": "bi-reception-4", "label": "Premium WiFi"},
                        {"icon": "bi-briefcase",   "label": "Work Desk"}
                    ],
                    "pricing": {
                        "single": {"bedBreakfast": 7000, "halfBoard": 8500, "fullBoard": 9500},
                        "double": {"bedBreakfast": 7700, "halfBoard": 10000, "fullBoard": 12000}
                    }
                },
                5: {
                    "name": "VIP Room",
                    "total_rooms": 1,
                    "max_guests": 2,
                    "price": 8000,
                    "description": "The ultimate in luxury and style. Offers an expansive living layout, premium finishes, and top-tier guest privileges.",
                    "image_url": "vip",
                    "amenities": [
                        {"icon": "bi-stars",           "label": "Luxury Bedding"},
                        {"icon": "bi-cup-straw",       "label": "Mini Bar"},
                        {"icon": "bi-display",         "label": "Smart TV"},
                        {"icon": "bi-reception-4",     "label": "Premium WiFi"},
                        {"icon": "bi-door-open",       "label": "Balcony"},
                        {"icon": "bi-bell",            "label": "Room Service"},
                        {"icon": "bi-thermometer-snow","label": "Air Conditioning"}
                    ],
                    "pricing": {
                        "single": {"bedBreakfast": 8000, "halfBoard": 9500, "fullBoard": 10500},
                        "double": {"bedBreakfast": 8700, "halfBoard": 11000, "fullBoard": 13500}
                    }
                }
            }

            cursor.execute("SELECT id FROM room_types")
            existing_ids = {row["id"] for row in cursor.fetchall()}

            for rid, d in defaults.items():
                if rid in existing_ids:
                    # Always update to keep data current
                    cursor.execute("""
                        UPDATE room_types
                        SET name = %s,
                            total_rooms = %s,
                            max_guests = %s,
                            price = %s,
                            pricing = %s
                        WHERE id = %s
                    """, (
                        d["name"],
                        d["total_rooms"],
                        d["max_guests"],
                        d["price"],
                        json.dumps(d["pricing"]),
                        rid
                    ))
                else:
                    # Insert new room type (e.g. VIP room)
                    cursor.execute("""
                        INSERT INTO room_types (id, name, total_rooms, max_guests, price, description, image_url, amenities, pricing)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, (
                        rid,
                        d["name"],
                        d["total_rooms"],
                        d["max_guests"],
                        d["price"],
                        d["description"],
                        d["image_url"],
                        json.dumps(d["amenities"]),
                        json.dumps(d["pricing"]),
                    ))
                    print(f"Inserted new room type: {d['name']} (id={rid})")

            conn.commit()

            # ── gallery table ──────────────────────────────────────────────
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS gallery (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    image_url VARCHAR(500) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

            cursor.execute("SELECT COUNT(*) as cnt FROM gallery")
            gallery_count = cursor.fetchone()["cnt"]
            if gallery_count == 0:
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
            print("Database migrations completed successfully.")
    except Exception as e:
        print(f"Error running database migrations: {e}")
    finally:
        if 'conn' in locals() and conn:
            conn.close()

# =====================================================================
# SYSTEM SETTINGS ROUTES
# =====================================================================

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    try:
        connection = get_connection()
        with connection.cursor(pymysql.cursors.DictCursor) as cursor:
            if request.method == 'GET':
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

# =====================================================================
# USER MANAGEMENT ROUTES
# =====================================================================

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

@app.route("/api/users/<int:user_id>/status", methods=["PUT"])
@jwt_required()
@admin_required
def update_user_status(user_id):
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in ["Active", "Disabled"]:
        return jsonify({
            "status": "error",
            "message": "Invalid status."
        }), 400
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id,
                    username,
                    role,
                    status
                FROM users
                WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    "status": "error",
                    "message": "User not found."
                }), 404
            if current_user["id"] == user_id and status == "Disabled":
                return jsonify({
                    "status": "error",
                    "message": "You cannot disable your own account."
                }), 403
            if user["status"] == status:
                return jsonify({
                    "status": "success",
                    "message": "No changes detected."
                }), 200
            old_status = user["status"]
            cursor.execute("""
                UPDATE users
                SET status = %s
                WHERE id = %s
            """, (
                status,
                user_id
            ))
        conn.commit()
        log_activity(
            admin_id=current_user["id"],
            admin_username=current_user["username"],
            action="Change User Status",
            target_type="User",
            target_id=user_id,
            target_name=user["username"],
            description=(
                f"Status changed from "
                f"'{old_status}' to '{status}'"
            )
        )
        return jsonify({
            "status": "success",
            "message": f"User status updated to '{status}'."
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

@app.route("/api/users/<int:user_id>", methods=["PUT"])
@jwt_required()
@admin_required
def update_user(user_id):
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    role = data.get("role", "").strip()
    if not username:
        return jsonify({
            "status": "error",
            "message": "Username is required."
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
            cursor.execute("""
                SELECT
                    id,
                    username,
                    role
                FROM users
                WHERE id = %s
            """, (user_id,))
            existing_user = cursor.fetchone()
            if not existing_user:
                return jsonify({
                    "status": "error",
                    "message": "User not found."
                }), 404
            cursor.execute("""
                SELECT id
                FROM users
                WHERE username = %s
                AND id <> %s
            """, (
                username,
                user_id
            ))
            if cursor.fetchone():
                return jsonify({
                    "status": "error",
                    "message": "Username already exists."
                }), 409
            if existing_user["role"] == "Admin" and role != "Admin":
                cursor.execute("""
                    SELECT COUNT(*) AS total
                    FROM users
                    WHERE role = 'Admin'
                """)
                admin_count = cursor.fetchone()["total"]
                if admin_count <= 1:
                    return jsonify({
                        "status": "error",
                        "message": "Cannot change the role of the last administrator."
                    }), 403
            changes = []
            if existing_user["username"] != username:
                changes.append(
                    f"Username changed from '{existing_user['username']}' to '{username}'"
                )
            if existing_user["role"] != role:
                changes.append(
                    f"Role changed from '{existing_user['role']}' to '{role}'"
                )
            if not changes:
                return jsonify({
                    "status": "success",
                    "message": "No changes detected."
                }), 200
            cursor.execute("""
                UPDATE users
                SET
                    username = %s,
                    role = %s
                WHERE id = %s
            """, (
                username,
                role,
                user_id
            ))
        conn.commit()
        log_activity(
            admin_id=current_user["id"],
            admin_username=current_user["username"],
            action="Edit User",
            target_type="User",
            target_id=user_id,
            target_name=username,
            description="; ".join(changes)
        )
        return jsonify({
            "status": "success",
            "message": "User updated successfully."
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

@app.route("/api/users/<int:user_id>/password", methods=["PUT"])
@jwt_required()
@admin_required
def reset_user_password(user_id):
    current_user = g.current_user
    data = request.get_json(silent=True) or {}
    password = data.get("password", "").strip()
    if not password:
        return jsonify({
            "status": "error",
            "message": "Password is required."
        }), 400
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    id,
                    username
                FROM users
                WHERE id = %s
            """, (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({
                    "status": "error",
                    "message": "User not found."
                }), 404
            hashed_password = generate_password_hash(password)
            cursor.execute("""
                UPDATE users
                SET password = %s
                WHERE id = %s
            """, (
                hashed_password,
                user_id
            ))
        conn.commit()
        log_activity(
            admin_id=current_user["id"],
            admin_username=current_user["username"],
            action="Reset Password",
            target_type="User",
            target_id=user_id,
            target_name=user["username"],
            description=f"Password reset for user '{user['username']}'."
        )
        return jsonify({
            "status": "success",
            "message": "Password reset successfully."
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

@app.route("/api/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
@admin_required
def delete_user(user_id):
    current_user = g.current_user
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            if current_user["id"] == user_id:
                return jsonify({
                    "status": "error",
                    "message": "You cannot delete your own account."
                }), 403
            cursor.execute("""
                SELECT
                    id,
                    username,
                    role,
                    status
                FROM users
                WHERE id = %s
            """, (user_id,))
            target_user = cursor.fetchone()
            if not target_user:
                return jsonify({
                    "status": "error",
                    "message": "User not found."
                }), 404
            if target_user["role"] == "Admin":
                cursor.execute("""
                    SELECT COUNT(*) AS total
                    FROM users
                    WHERE role = 'Admin'
                """)
                admin_count = cursor.fetchone()["total"]
                if admin_count <= 1:
                    return jsonify({
                        "status": "error",
                        "message": "Cannot delete the last administrator."
                    }), 403
            cursor.execute("""
                DELETE FROM users
                WHERE id = %s
            """, (user_id,))
        conn.commit()
        log_activity(
            admin_id=current_user["id"],
            admin_username=current_user["username"],
            action="Delete User",
            target_type="User",
            target_id=user_id,
            target_name=target_user["username"],
            description=(
                f"Deleted user '{target_user['username']}' "
                f"(Role: {target_user['role']}, "
                f"Status: {target_user['status']})"
            )
        )
        return jsonify({
            "status": "success",
            "message": "User deleted successfully."
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

# =====================================================================
# AUDIT LOG ROUTES
# =====================================================================

@app.route("/api/audit-logs", methods=["GET"])
@jwt_required()
@admin_required
def get_audit_logs():
    current_user = g.current_user
    page = request.args.get("page", default=1, type=int)
    limit = request.args.get("limit", default=20, type=int)
    search = request.args.get("search", default="", type=str).strip()
    action = request.args.get("action", default="", type=str).strip()
    admin = request.args.get("admin", default="", type=str).strip()
    start_date = request.args.get("start_date", default="", type=str).strip()
    end_date = request.args.get("end_date", default="", type=str).strip()
    page = max(page, 1)
    limit = max(min(limit, 100), 1)
    offset = (page - 1) * limit
    conn = None
    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            where = []
            params = []
            if search:
                where.append("""
                    (
                        admin_username LIKE %s
                        OR target_name LIKE %s
                        OR description LIKE %s
                    )
                """)
                params.extend([
                    f"%{search}%",
                    f"%{search}%",
                    f"%{search}%"
                ])
            if action:
                where.append("action = %s")
                params.append(action)
            if admin:
                where.append("admin_username = %s")
                params.append(admin)
            if start_date:
                where.append("DATE(created_at) >= %s")
                params.append(start_date)
            if end_date:
                where.append("DATE(created_at) <= %s")
                params.append(end_date)
            where_sql = ""
            if where:
                where_sql = "WHERE " + " AND ".join(where)

            cursor.execute(f"""
                SELECT COUNT(*) AS total
                FROM audit_logs
                {where_sql}
            """, params)
            total = cursor.fetchone()["total"]
            pages = (total + limit - 1) // limit if total else 1

            cursor.execute(f"""
                SELECT
                    id,
                    admin_id,
                    admin_username,
                    action,
                    target_type,
                    target_id,
                    target_name,
                    description,
                    created_at
                FROM audit_logs
                {where_sql}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, params + [limit, offset])
            logs = cursor.fetchall()
        return jsonify({
            "status": "success",
            "page": page,
            "limit": limit,
            "total": total,
            "pages": pages,
            "count": len(logs),
            "logs": logs
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
    finally:
        if conn:
            conn.close()

# Run self-healing migrations on startup
run_migrations()
