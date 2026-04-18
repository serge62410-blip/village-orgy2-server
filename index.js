const express = require("express");
const app = express();

app.use(express.json({ limit: "1mb" }));

// 🔐 SECURITY KEY (TON SYSTEME)
const SECRET = "v0g2_secure_9XkP";

// 🧠 DATABASE MEMORY (XP / LEVEL)
let avatars = {};

// =========================
// AUTH MIDDLEWARE
// =========================
app.use((req, res, next) => {
    if (req.headers["x-secret"] !== SECRET) {
        return res.status(403).send("Forbidden");
    }
    next();
});

// =========================
// GET AVATAR
// =========================
app.get("/avatar/:id", (req, res) => {
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
// SAVE AVATAR
// =========================
app.post("/avatar/:id", (req, res) => {
    const id = req.params.id;

    let xp = Number(req.body.xp ?? 0);
    let level = Number(req.body.level ?? 1);

    // sécurité anti valeurs cassées
    if (xp < 0) xp = 0;
    if (level < 1) level = 1;

    avatars[id] = { xp, level };

    res.json({
        status: "saved",
        id,
        xp,
        level
    });
});

// =========================
// TOP 10
// =========================
app.get("/top", (req, res) => {
    let list = Object.entries(avatars);

    list.sort((a, b) => {
        return (b[1].level * 100 + b[1].xp) -
               (a[1].level * 100 + a[1].xp);
    });

    const top = list.slice(0, 10).map(([id, data]) => ({
        id,
        xp: data.xp,
        level: data.level
    }));

    res.json(top);
});

// =========================
// HEALTH CHECK (Render safe)
// =========================
app.get("/", (req, res) => {
    res.send("Village Orgy2 Server ONLINE");
});

// =========================
// START
// =========================
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
    console.log("🔥 SERVER RUNNING ON PORT " + PORT);
});
