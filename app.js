require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// MySQL RDS connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'taskdb',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auto-create database table
async function initDb() {
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
        console.log('Database initialized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error.message);
        console.log('Please ensure your RDS MySQL instance is running and credentials are correct in .env');
    }
}

initDb();

// --- API Routes ---

// Get all todos
app.get('/api/todos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});

// Add a new todo
app.post('/api/todos', async (req, res) => {
    const { title } = req.body;
    if (!title) {
        return res.status(400).json({ error: 'Title is required' });
    }
    try {
        const [result] = await pool.query('INSERT INTO todos (title) VALUES (?)', [title]);
        res.status(201).json({ id: result.insertId, title, completed: false });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create todo' });
    }
});

// Update a todo (completed status)
app.patch('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    try {
        await pool.query('UPDATE todos SET completed = ? WHERE id = ?', [completed, id]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM todos WHERE id = ?', [id]);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete todo' });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
