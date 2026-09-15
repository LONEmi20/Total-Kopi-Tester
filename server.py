from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import sqlite3
import json
import csv
from io import StringIO

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type", "X-Admin-Password"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

ADMIN_PASSWORD = "zxzczvzbznzm"

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

    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price INTEGER NOT NULL,
            image TEXT NOT NULL,
            category TEXT DEFAULT 'Coffee'
        )
    ''')
    
    try:
        conn.execute('ALTER TABLE products ADD COLUMN category TEXT DEFAULT "Coffee"')
    except:
        pass 
        
    conn.commit()
    conn.close()
init_db()

def check_auth():
    return request.headers.get('X-Admin-Password') == ADMIN_PASSWORD

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

@app.route('/api/admin/orders/<int:id>/complete', methods=['POST'])
def admin_complete_order(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute("UPDATE orders SET status = 'selesai' WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Pesanan diselesaikan!"})

@app.route('/api/admin/orders/<int:id>', methods=['DELETE'])
def admin_delete_order(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute("DELETE FROM orders WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Pesanan dihapus!"})

@app.route('/api/admin/orders/export', methods=['GET'])
def admin_export_orders():
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    
    conn = get_db_connection()
    orders = conn.execute('SELECT * FROM orders ORDER BY id DESC').fetchall()
    conn.close()
    
    si = StringIO()
    cw = csv.writer(si)
    
    cw.writerow(['ID Pesanan', 'Waktu UTC', 'Nama Pelanggan', 'No HP', 'Alamat', 'Detail Pesanan', 'Total Harga', 'Status'])
    
    for o in orders:
        try:
            items = json.loads(o['items'])
            items_text = ", ".join([f"{item['qty']}x {item['name']}" for item in items])
        except:
            items_text = "Data tidak valid"
            
        cw.writerow([
            o['id'],
            o['created_at'],
            o['customer_name'],
            o['phone'],
            o['address'],
            items_text,
            o['total_price'],
            o['status']
        ])
        
    output = si.getvalue()
    return Response(
        output,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment;filename=dataset_penjualan_totalkopi.csv"}
    )

@app.route('/api/admin/products', methods=['POST'])
def admin_add_product():
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO products (name, price, image, category) VALUES (?, ?, ?, ?)',
                 (data['name'], data['price'], data['image'], data['category']))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Produk berhasil ditambahkan!"})

@app.route('/api/admin/products/<int:id>/edit', methods=['POST'])
def admin_edit_product(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    data = request.json
    conn = get_db_connection()
    conn.execute('UPDATE products SET name=?, price=?, image=?, category=? WHERE id=?',
                 (data['name'], data['price'], data['image'], data['category'], id))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Produk berhasil diperbarui!"})

@app.route('/api/admin/products/<int:id>', methods=['DELETE'])
def admin_delete_product(id):
    if not check_auth(): return jsonify({"pesan": "Akses Ditolak!"}), 401
    conn = get_db_connection()
    conn.execute('DELETE FROM products WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Produk berhasil dihapus!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)