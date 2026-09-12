from flask import Flask, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# Fungsi untuk membuka koneksi ke database SQLite
def get_db_connection():
    conn = sqlite3.connect('totalkopi.db')
    conn.row_factory = sqlite3.Row # Format hasil query menjadi rapi
    return conn

# Membuat jalur (endpoint) API untuk memanggil produk
@app.route('/api/products')
def get_products():
    conn = get_db_connection()
    # Mengekstrak seluruh baris dari tabel products
    products_db = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    
    # Mengubah data dari SQL menjadi struktur yang siap dikirim
    products_list = []
    for p in products_db:
        products_list.append({
            "id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "category": p["category"],
            "img": p["img"],
            "desc": p["description"]
        })
        
    return jsonify(products_list)

if __name__ == '__main__':
    app.run(debug=True, port=5000)