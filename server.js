const express = require("express");
const fs = require("fs");
const app = express();

const PORT = process.env.PORT || 3002;
const SECRET = "v0g2_secure_9XkP";
const DB_FILE = "database.json";

app.use(express.json({ limit: "1mb" }));

let avatars = {};

if (fs.existsSync(DB_FILE)) {
    avatars = JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(avatars, null, 2));
}

// =========================
// SECURITY
// =========================
app.use((req, res, next) => {
    if (req.headers["x-secret"] !== SECRET) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
});

// =========================
// GET AVATAR
// =========================
app.get("/avatar/:id", (req, res) => {
    const id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = { xp: 0, level: 1 };
        saveDB();
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

    avatars[id] = { xp, level };

    saveDB();

    res.json({ status: "saved" });
});

// =========================
// TOP
// =========================
app.get("/top", (req, res) => {
    let list = Object.entries(avatars);

    list.sort((a, b) =>
        (b[1].level * 100 + b[1].xp) -
        (a[1].level * 100 + a[1].xp)
    );

    res.json(list.slice(0, 10));
});

app.listen(PORT, () => {
    console.log("🔥 SERVER RUNNING");
});
