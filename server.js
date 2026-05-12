require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Bağlantı Havuzu
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Veritabanı ve Tabloyu Başlatma
async function initDB() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log('Veritabanı başarıyla başlatıldı. "todos" tablosu hazır.');
  } catch (error) {
    console.error('Veritabanı başlatılırken hata oluştu. RDS bağlantınızı ve .env bilgilerinizi kontrol edin:', error.message);
  }
}
initDB();

// API Endpointleri

// Tüm görevleri getir
app.get('/api/todos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Görevler getirilirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Yeni görev ekle
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Başlık gereklidir' });
  }
  try {
    const [result] = await pool.query('INSERT INTO todos (title) VALUES (?)', [title]);
    const [newTodo] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    res.status(201).json(newTodo[0]);
  } catch (error) {
    console.error('Görev eklenirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Görevi güncelle (tamamlandı durumu)
app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    await pool.query('UPDATE todos SET completed = ? WHERE id = ?', [completed, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Görev güncellenirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Görevi sil
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM todos WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Görev silinirken hata:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Load Balancer (ALB) ve EC2 Health Check Endpointi
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(\`Sunucu \${PORT} portunda çalışıyor\`);
});
