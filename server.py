from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

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
    conn.commit()
    conn.close()

init_db()

@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products_db = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(p) for p in products_db])

@app.route('/api/testimonials', methods=['POST'])
def add_testimonial():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO testimonials (name, rating, comment) VALUES (?, ?, ?)',
                 (data['name'], data['rating'], data['comment']))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Testimoni berhasil dikirim dan menunggu moderasi!"})

@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    conn = get_db_connection()
    testis = conn.execute("SELECT * FROM testimonials WHERE status = 'approved' ORDER BY id DESC").fetchall()
    conn.close()
    return jsonify([dict(t) for t in testis])

#ADMIN
@app.route('/api/admin/testimonials', methods=['GET'])
def admin_get_testimonials():
    conn = get_db_connection()
    testis = conn.execute('SELECT * FROM testimonials ORDER BY id DESC').fetchall()
    conn.close()
    return jsonify([dict(t) for t in testis])

@app.route('/api/admin/testimonials/<int:id>/approve', methods=['POST'])
def admin_approve(id):
    conn = get_db_connection()
    conn.execute("UPDATE testimonials SET status = 'approved' WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Testimoni disetujui!"})

@app.route('/api/admin/testimonials/<int:id>', methods=['DELETE'])
def admin_delete(id):
    conn = get_db_connection()
    conn.execute("DELETE FROM testimonials WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Testimoni dihapus!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)