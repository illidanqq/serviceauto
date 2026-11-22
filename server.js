const path = require('path');
const fs = require('fs');
const express = require('express');
const { MongoClient } = require('mongodb');

const ROOT = __dirname;

// Настройки из файла .env (если он есть). Переменные, заданные в терминале, имеют приоритет.
if (fs.existsSync(path.join(ROOT, '.env'))) {
    process.loadEnvFile(path.join(ROOT, '.env'));
}

const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB = process.env.MONGODB_DB || 'remont';

// ---- База данных (MongoDB) ----
let appointments; // коллекция заявок
let counters;     // счётчик для коротких номеров заявок (#1, #2, ...)

// Строка mongodb+srv:// требует DNS-запроса типа SRV. На некоторых компьютерах (VPN, прокси,
// фильтры трафика) Node.js обращается к локальному DNS 127.0.0.1, который такие запросы не обслуживает.
// В этом случае переключаемся на публичные DNS-серверы (или на заданные в DNS_SERVERS).
async function ensureSrvDns(uri) {
    if (!uri.startsWith('mongodb+srv://')) return;
    const dns = require('dns');
    const fallback = (process.env.DNS_SERVERS || '1.1.1.1,8.8.8.8').split(',').map(s => s.trim()).filter(Boolean);
    const host = uri.slice('mongodb+srv://'.length).split('/')[0].split('?')[0].split('@').pop();
    try {
        await dns.promises.resolveSrv('_mongodb._tcp.' + host);
    } catch (err) {
        console.warn(`DNS ${dns.getServers().join(', ')} не ответил на запрос (${err.code}), используем ${fallback.join(', ')}`);
        dns.setServers(fallback);
    }
}

async function connectDb() {
    if (!MONGODB_URI) {
        throw new Error('Не задана переменная MONGODB_URI. Скопируйте .env.example в .env и впишите строку подключения из MongoDB Atlas.');
    }
    await ensureSrvDns(MONGODB_URI);
    const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    await client.connect();
    const db = client.db(MONGODB_DB);
    await db.command({ ping: 1 });

    appointments = db.collection('appointments');
    counters = db.collection('counters');

    // Защита от двойной записи: на каждый час есть SLOT_CAPACITY «мест» (slot_seat 0, 1, ...),
    // и одно место в одно время может занять только одна заявка.
    await appointments.createIndex(
        { appt_date: 1, appt_time: 1, slot_seat: 1 },
        { unique: true, partialFilterExpression: { appt_date: { $type: 'string' } }, name: 'unique_slot_seat' }
    );
    await appointments.createIndex({ id: -1 }, { unique: true, name: 'id_desc' });
    return client;
}

async function nextId() {
    const doc = await counters.findOneAndUpdate(
        { _id: 'appointments' },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return doc.seq;
}

// ---- Расписание ----
// Рабочие часы: Пн–Сб, 9:00–18:00, запись на начало каждого часа (последняя — 17:00).
const TIMEZONE = 'Asia/Almaty';
const WORK_DAYS = [1, 2, 3, 4, 5, 6]; // 0 — воскресенье
const SLOT_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const SLOT_CAPACITY = Math.max(1, parseInt(process.env.SLOT_CAPACITY, 10) || 1); // сколько машин одновременно
const BOOKING_DAYS_AHEAD = 30;

// Дата и время в Алматы, независимо от часового пояса сервера
function partsInTimezone(date) {
    return Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
        }).formatToParts(date).map(p => [p.type, p.value])
    );
}

function nowInTimezone() {
    const p = partsInTimezone(new Date());
    return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

function formatLocal(date) {
    const p = partsInTimezone(date);
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

function parseDate(str) {
    if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
    const d = new Date(str + 'T00:00:00Z');
    if (isNaN(d) || d.toISOString().slice(0, 10) !== str) return null;
    return d;
}

function addDays(dateStr, n) {
    const d = new Date(dateStr + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
}

// Список слотов на дату с признаком доступности; null — если на дату записаться нельзя
async function getSlots(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return null;
    const now = nowInTimezone();
    if (dateStr < now.date || dateStr > addDays(now.date, BOOKING_DAYS_AHEAD)) return null;
    if (!WORK_DAYS.includes(d.getUTCDay())) return [];

    const counts = await appointments.aggregate([
        { $match: { appt_date: dateStr } },
        { $group: { _id: '$appt_time', n: { $sum: 1 } } },
    ]).toArray();
    const booked = Object.fromEntries(counts.map(r => [r._id, r.n]));

    return SLOT_TIMES.map(time => ({
        time,
        available: (booked[time] || 0) < SLOT_CAPACITY && !(dateStr === now.date && time <= now.time),
    }));
}

// ---- HTTP ----
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
    const sep = decoded.indexOf(':');
    const user = decoded.slice(0, sep);
    const password = decoded.slice(sep + 1);
    if (sep < 0 || user !== ADMIN_USER || password !== ADMIN_PASSWORD) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
        return res.status(401).json({ error: 'unauthorized' });
    }
    next();
}

app.post('/api/appointments', async (req, res) => {
    const { name, phone, service, car, date, time } = req.body || {};
    const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const trimmedName = str(name, 100);
    const trimmedPhone = str(phone, 30);
    const trimmedService = str(service, 200);
    const trimmedCar = str(car, 100);
    const apptDate = str(date, 10);
    const apptTime = str(time, 5);

    if (!trimmedName) {
        return res.status(400).json({ error: 'name is required' });
    }
    if (!trimmedPhone || !/^[\+]?[0-9\s\-\(\)]{7,20}$/.test(trimmedPhone) || trimmedPhone.replace(/\D/g, '').length < 7) {
        return res.status(400).json({ error: 'phone is required or invalid' });
    }

    try {
        // Дата и время необязательны, но если указаны — только вместе и только свободный слот
        if (apptDate || apptTime) {
            const slots = await getSlots(apptDate);
            if (!slots) return res.status(400).json({ error: 'date is invalid' });
            const slot = slots.find(s => s.time === apptTime);
            if (!slot) return res.status(400).json({ error: 'time is invalid' });
            if (!slot.available) return res.status(409).json({ error: 'slot_taken' });
        }

        const doc = {
            id: await nextId(),
            name: trimmedName,
            phone: trimmedPhone,
            ...(trimmedService && { service: trimmedService }),
            ...(trimmedCar && { car: trimmedCar }),
            created_at: new Date(),
        };

        if (apptDate) {
            // Пробуем занять свободное «место» в выбранном часе. Уникальный индекс не даст
            // двум клиентам занять одно и то же место, даже если они нажмут кнопку одновременно.
            let saved = false;
            for (let seat = 0; seat < SLOT_CAPACITY && !saved; seat++) {
                try {
                    await appointments.insertOne({ ...doc, appt_date: apptDate, appt_time: apptTime, slot_seat: seat });
                    saved = true;
                } catch (err) {
                    if (err.code !== 11000) throw err; // 11000 — это место уже занято, пробуем следующее
                }
            }
            if (!saved) return res.status(409).json({ error: 'slot_taken' });
        } else {
            await appointments.insertOne(doc);
        }

        res.status(201).json({ ok: true, id: doc.id });
    } catch (err) {
        console.error('DB insert failed:', err);
        res.status(500).json({ error: 'internal error' });
    }
});

app.get('/api/slots', async (req, res) => {
    try {
        const slots = await getSlots(req.query.date);
        if (!slots) return res.status(400).json({ error: 'date is invalid' });
        res.json({ date: req.query.date, closed: slots.length === 0, slots });
    } catch (err) {
        console.error('DB read failed:', err);
        res.status(500).json({ error: 'internal error' });
    }
});

app.get('/api/appointments', requireAdmin, async (req, res) => {
    try {
        const docs = await appointments.find({}).sort({ id: -1 }).toArray();
        res.json(docs.map(d => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
            service: d.service || null,
            car: d.car || null,
            appt_date: d.appt_date || null,
            appt_time: d.appt_time || null,
            created_at: d.created_at ? formatLocal(d.created_at) : null,
        })));
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

// Служебные файлы не отдаём наружу
app.use((req, res, next) => {
    if (/^\/(\.env|server\.js|package(-lock)?\.json|node_modules|data)(\/|$)/i.test(req.path)) {
        return res.status(404).end();
    }
    next();
});
app.use(express.static(ROOT, { extensions: ['html'], dotfiles: 'deny' }));

// ---- Запуск ----
async function start() {
    let client;
    try {
        client = await connectDb();
        console.log(`MongoDB: подключено (база «${MONGODB_DB}»)`);
    } catch (err) {
        console.error('\nНе удалось подключиться к MongoDB:', err.message);
        if (/whitelist|IP|Server selection timed out|ETIMEDOUT|ECONNREFUSED/i.test(err.message)) {
            console.error('Проверьте в Atlas: кластер не на паузе (Resume) и ваш IP разрешён в Network Access.');
        }
        if (/auth|bad auth|Authentication failed/i.test(err.message)) {
            console.error('Неверный логин или пароль пользователя базы в MONGODB_URI (Atlas → Database Access).');
        }
        console.error('');
        process.exit(1);
    }

    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Admin panel at http://localhost:${PORT}/admin (login: ${ADMIN_USER})`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`\nПорт ${PORT} уже занят — скорее всего, сайт уже запущен в другом окне терминала.`);
            console.error(`Откройте http://localhost:${PORT} или остановите тот сервер (Ctrl+C в его окне).`);
            console.error(`Либо запустите на другом порту: $env:PORT=3001; npm start\n`);
            process.exit(1);
        }
        throw err;
    });

    const shutdown = async () => {
        await client.close().catch(() => {});
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

start();
