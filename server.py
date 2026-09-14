from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import json

app = Flask(__name__)
CORS(app)

ADMIN_PASSWORD = "kopi_rahasia_123"

def get_db_connection():
    conn = sqlite3.connect('totalkopi.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS testimonials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT NOT NULL,
            status TEXT DEFAULT 'pending' 
        )
    ''')
    # UPDATE: Tambahkan kolom status di tabel orders
    conn.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT NOT NULL,
            items TEXT NOT NULL,
            total_price INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def check_auth():
    return request.headers.get('X-Admin-Password') == ADMIN_PASSWORD

# ==========================================
# JALUR PUBLIK
# ==========================================
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(p) for p in products])

@app.route('/api/testimonials', methods=['POST'])
def add_testimonial():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO testimonials (name, rating, comment) VALUES (?, ?, ?)',
                 (data['name'], data['rating'], data['comment']))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Testimoni berhasil dikirim!"})

@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    conn = get_db_connection()
    testis = conn.execute("SELECT * FROM testimonials WHERE status = 'approved' ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(t) for t in testis])

@app.route('/api/orders', methods=['POST'])
def add_order():
    data = request.json
    items_json = json.dumps(data['items']) 
    conn = get_db_connection()
    conn.execute('''
        INSERT INTO orders (customer_name, phone, address, items, total_price) 
        VALUES (?, ?, ?, ?, ?)
    ''', (data['customer_name'], data['phone'], data['address'], items_json, data['total_price']))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Pesanan dicatat!"})

# ==========================================
# JALUR RAHASIA ADMIN
# ==========================================
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    if check_auth(): return jsonify({"pesan": "Login berhasil!"})
    return jsonify({"pesan": "Password salah!"}), 401

@app.route('/api/admin/testimonials', methods=['GET'])
def admin_get_testimonials():
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    testis = conn.execute('SELECT * FROM testimonials ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(t) for t in testis])

@app.route('/api/admin/testimonials/<int:id>/approve', methods=['POST'])
def admin_approve(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute("UPDATE testimonials SET status = 'approved' WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Disetujui!"})

@app.route('/api/admin/testimonials/<int:id>', methods=['DELETE'])
def admin_delete(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute("DELETE FROM testimonials WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Dihapus!"})

@app.route('/api/admin/orders', methods=['GET'])
def admin_get_orders():
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(o) for o in orders])

# BARU: Endpoint menyelesaikan pesanan
@app.route('/api/admin/orders/<int:id>/complete', methods=['POST'])
def admin_complete_order(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute("UPDATE orders SET status = 'selesai' WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Pesanan diselesaikan!"})

# BARU: Endpoint menghapus pesanan
@app.route('/api/admin/orders/<int:id>', methods=['DELETE'])
def admin_delete_order(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute("DELETE FROM orders WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Pesanan dihapus!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)