
const express = require("express");
const app = express();

app.use(express.json());

// =========================
// SECURITY
// =========================
const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

// =========================
// MEMORY DB
// =========================
let avatars = {};
let seated = new Set();

// =========================
// AUTH MIDDLEWARE
// =========================
app.use((req, res, next) => {
    if (req.headers["x-secret"] !== SECRET) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
});

// =========================
// GET AVATAR (HUD SYNC)
// =========================
app.get("/v2/avatar/:id", (req, res) => {
    const id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = {
            xp: 0,
            level: 1
        };
    }

    res.json(avatars[id]);
});

// =========================
// UPDATE AVATAR (OPTIONAL FUTURE USE)
// =========================
app.post("/v2/avatar/:id", (req, res) => {
    const id = req.params.id;
    const { xp, level } = req.body;

    if (typeof xp !== "number" || typeof level !== "number") {
        return res.status(400).json({ error: "bad data" });
    }

    avatars[id] = { xp, level };

    res.json({ ok: true });
});

// =========================
// SEAT SYSTEM (LSL COMPATIBLE)
// =========================
app.post("/v2/seat", (req, res) => {
    const { action, id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "missing id" });
    }

    if (action === "SIT") {
        seated.add(id);

        if (!avatars[id]) {
            avatars[id] = { xp: 0, level: 1 };
        }
    }

    if (action === "UNSIT") {
        seated.delete(id);
    }

    res.json({
        active: seated.size >= 2
    });
});

// =========================
// RESET GLOBAL (IMPORTANT FIX FOR HUD)
// =========================
app.post("/v2/reset", (req, res) => {

    avatars = {};
    seated = new Set();

    res.json({
        ok: true
    });
});

// =========================
// TOP 10 LEADERBOARD
// =========================
app.get("/v2/top", (req, res) => {

    let list = Object.entries(avatars);

    list.sort((a, b) => {
        return (b[1].level * 100 + b[1].xp) -
               (a[1].level * 100 + a[1].xp);
    });

    let top10 = list.slice(0, 10).map(([id, data]) => {
        return {
            id: id,
            xp: data.xp,
            level: data.level
        };
    });

    res.json(top10);
});

// =========================
// AUTO XP ENGINE (SERVER AUTHORITY FIX)
// =========================
setInterval(() => {

    if (seated.size < 2) return;

    seated.forEach(id => {

        if (!avatars[id]) {
            avatars[id] = { xp: 0, level: 1 };
        }

        avatars[id].xp += 5;

        if (avatars[id].xp >= 100) {
            avatars[id].xp -= 100;
            avatars[id].level += 1;
        }

    });

}, 5000);

// =========================
// START SERVER
// =========================
app.listen(3001, () => {
    console.log("🔥 LSL COMPAT SERVER READY V6.7 FIXED");
});
