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
            comment TEXT NOT NULL
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
    
    products_list = []
    for p in products_db:
        products_list.append(dict(p))
    return jsonify(products_list)

# 3. Endpoint Menerima Testimoni Baru (POST)
@app.route('/api/testimonials', methods=['POST'])
def add_testimonial():
    data = request.json
    conn = get_db_connection()
    conn.execute('INSERT INTO testimonials (name, rating, comment) VALUES (?, ?, ?)',
                 (data['name'], data['rating'], data['comment']))
    conn.commit()
    conn.close()
    return jsonify({"pesan": "Testimoni berhasil disimpan!"})

# 4. Endpoint Menampilkan Testimoni (GET)
@app.route('/api/testimonials', methods=['GET'])
def get_testimonials():
    conn = get_db_connection()
    # Ambil data terbaru di urutan paling atas
    testis = conn.execute('SELECT * FROM testimonials ORDER BY id DESC').fetchall()
    conn.close()
    
    testi_list = []
    for t in testis:
        testi_list.append(dict(t))
    return jsonify(testi_list)

if __name__ == '__main__':
    app.run(debug=True, port=5000)