require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL Connection Pool
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

// Initialize Database and Table
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
    console.log('Database initialized successfully. "todos" table is ready.');
  } catch (error) {
    console.error('Error initializing database. Check your RDS connection and .env credentials:', error.message);
  }
}
initDB();

// API Endpoints

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new todo
app.post('/api/todos', async (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  try {
    const [result] = await pool.query('INSERT INTO todos (title) VALUES (?)', [title]);
    const [newTodo] = await pool.query('SELECT * FROM todos WHERE id = ?', [result.insertId]);
    res.status(201).json(newTodo[0]);
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update todo (completed status)
app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;
  try {
    await pool.query('UPDATE todos SET completed = ? WHERE id = ?', [completed, id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete todo
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM todos WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Load Balancer (ALB) and EC2 Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`server ${PORT} working`);
});
