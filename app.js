const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DB Connection Pool ───────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'your-rds-endpoint.rds.amazonaws.com',
  user:     process.env.DB_USER     || 'admin',
  password: process.env.DB_PASSWORD || 'yourpassword',
  database: process.env.DB_NAME     || 'taskdb',
  port:     process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── Init Table ───────────────────────────────────────────────────────────────
async function initDB() {
  const conn = await pool.getConnection();
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      title      VARCHAR(255) NOT NULL,
      description TEXT,
      status     ENUM('todo','inprogress','done') DEFAULT 'todo',
      priority   ENUM('low','medium','high') DEFAULT 'medium',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  conn.release();
  console.log('✅ Database table ready.');
}

// ─── API Routes ───────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { status, priority } = req.query;
    let sql = 'SELECT * FROM tasks';
    const params = [];
    const filters = [];
    if (status)   { filters.push('status = ?');   params.push(status); }
    if (priority) { filters.push('priority = ?'); params.push(priority); }
    if (filters.length) sql += ' WHERE ' + filters.join(' AND ');
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single task
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description = '', status = 'todo', priority = 'medium' } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const [result] = await pool.execute(
      'INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)',
      [title, description, status, priority]
    );
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    await pool.execute(
      'UPDATE tasks SET title=?, description=?, status=?, priority=? WHERE id=?',
      [title, description, status, priority, req.params.id]
    );
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH status only
app.patch('/api/tasks/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await pool.execute('UPDATE tasks SET status=? WHERE id=?', [status, req.params.id]);
    const [rows] = await pool.execute('SELECT * FROM tasks WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats
app.get('/api/stats', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(status='todo') AS todo,
        SUM(status='inprogress') AS inprogress,
        SUM(status='done') AS done,
        SUM(priority='high') AS high_priority
      FROM tasks
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Serve Frontend ───────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('❌ DB init failed:', err.message);
  process.exit(1);
});
