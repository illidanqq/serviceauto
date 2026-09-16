const path = require('path');
const fs = require('fs');
const express = require('express');
const Database = require('better-sqlite3');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DB_PATH = path.join(DATA_DIR, 'appointments.db');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        phone      TEXT NOT NULL,
        service    TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
`);

const app = express();
app.use(express.json());

function requireAdmin(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Basic' || !token) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
        return res.status(401).json({ error: 'unauthorized' });
    }
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [user, password] = decoded.split(':');
    if (user !== ADMIN_USER || password !== ADMIN_PASSWORD) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
        return res.status(401).json({ error: 'unauthorized' });
    }
    next();
}

app.post('/api/appointments', (req, res) => {
    const { name, phone, service } = req.body || {};
    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
    const trimmedService = typeof service === 'string' ? service.trim() : '';

    if (!trimmedName) {
        return res.status(400).json({ error: 'name is required' });
    }
    if (!trimmedPhone || !/^[\+]?[0-9\s\-\(\)]{7,15}$/.test(trimmedPhone)) {
        return res.status(400).json({ error: 'phone is required or invalid' });
    }

    try {
        const result = db
            .prepare('INSERT INTO appointments (name, phone, service) VALUES (?, ?, ?)')
            .run(trimmedName, trimmedPhone, trimmedService || null);
        res.status(201).json({ ok: true, id: result.lastInsertRowid });
    } catch (err) {
        console.error('DB insert failed:', err);
        res.status(500).json({ error: 'internal error' });
    }
});

app.get('/api/appointments', requireAdmin, (req, res) => {
    try {
        const rows = db
            .prepare('SELECT id, name, phone, service, created_at FROM appointments ORDER BY id DESC')
            .all();
        res.json(rows);
    } catch (err) {
        console.error('DB read failed:', err);
        res.status(500).json({ error: 'internal error' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

app.get('/admin', requireAdmin, (req, res) => {
    res.sendFile(path.join(ROOT, 'admin.html'));
});
app.get('/admin.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(ROOT, 'admin.html'));
});

app.use(express.static(ROOT, { extensions: ['html'] }));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Admin panel at http://localhost:${PORT}/admin (${ADMIN_USER}/${ADMIN_PASSWORD})`);
});