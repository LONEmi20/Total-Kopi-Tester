import sqlite3

# 1. Membuat atau membuka database
conn = sqlite3.connect('totalkopi.db')
cursor = conn.cursor()

# 2. Membuat tabel products
cursor.execute('''
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    img TEXT,
    description TEXT
)
''')

# 3. Membersihkan data lama (jika file dijalankan ulang)
cursor.execute('DELETE FROM products')

# 4. Data 12 menu Total Kopi
data_kopi = [
    (1, "Kopi Bahagia", 15000, "Coffee", "assets/images/TotalKopi-icon.jpg", "Signature iced coffee dengan gula aren pilihan yang pas manisnya, memberikan kebahagiaan di setiap tegukan."),
    (2, "Americano", 15000, "Coffee", "assets/images/TotalKopi-icon.jpg", "Kopi hitam pekat dari espresso berkualitas. Cocok untuk pecinta kopi sejati yang mencari tendangan kafein ekstra."),
    (3, "Ice Latte", 15000, "Coffee", "assets/images/TotalKopi-icon.jpg", "Perpaduan harmonis antara espresso tebal dan susu segar dingin. Lembut dan menyegarkan."),
    (4, "Hot Latte", 20000, "Coffee", "assets/images/TotalKopi-icon.jpg", "Espresso hangat dibalut buih susu lembut (microfoam). Sempurna untuk menemani pagimu."),
    (5, "Butterscotch", 18000, "Coffee", "assets/images/TotalKopi-icon.jpg", "Kopi susu dengan tambahan sirup butterscotch yang wangi dan creamy. Favorit banyak orang."),
    (6, "Caramel Macchiato", 18000, "Coffee", "assets/images/TotalKopi-icon.jpg", "Vanilla latte dengan tuangan espresso murni di atasnya, disempurnakan dengan saus karamel lezat."),
    (7, "Ice Chocolate", 18000, "Non Coffee", "assets/images/TotalKopi-icon.jpg", "Minuman cokelat belgia yang pekat dan creamy. Tidak terlalu manis, pas untuk menaikkan mood."),
    (8, "Ice Matcha", 18000, "Non Coffee", "assets/images/TotalKopi-icon.jpg", "Matcha premium khas Jepang berpadu dengan susu segar. Cita rasa otentik yang menenangkan."),
    (9, "Lemon Tea", 10000, "Non Coffee", "assets/images/TotalKopi-icon.jpg", "Es teh segar dengan perasan jeruk lemon asli. Solusi dahaga di cuaca panas."),
    (10, "Lychee Tea", 15000, "Non Coffee", "assets/images/TotalKopi-icon.jpg", "Teh hitam pilihan dengan sirup leci dan buah leci asli yang segar."),
    (11, "Tropical Black", 20000, "Japanese Coffee", "assets/images/TotalKopi-icon.jpg", "Cold brew kopi bernuansa tropis dengan notes buah-buahan cerah. Disajikan dingin menyegarkan."),
    (12, "Passion Black", 25000, "Japanese Coffee", "assets/images/TotalKopi-icon.jpg", "Japanese iced coffee dengan profil rasa yang kuat, bold, namun tetap bersih di mulut (clean aftertaste).")
]

# 5. Memasukkan data ke tabel dan menyimpannya
cursor.executemany('''
INSERT INTO products (id, name, price, category, img, description)
VALUES (?, ?, ?, ?, ?, ?)
''', data_kopi)

conn.commit()
conn.close()
print("Database 'totalkopi.db' berhasil dibuat dan diisi 12 menu!")