const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3002;

const SECRET = "v0g2_secure_9XkP";
const DB_FILE = "./db.json";

app.use(express.json({ limit: "1mb" }));

// =========================
// 🔥 PERSISTANCE DISQUE
// =========================
function loadDB()
{
    try
    {
        return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    }
    catch(e)
    {
        return {};
    }
}

function saveDB(data)
{
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

let avatars = loadDB();

// =========================
// 🔥 SECURITY
// =========================
app.use((req, res, next) =>
{
    if(req.headers["x-secret"] !== SECRET)
    {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
});

// =========================
// HEALTH
// =========================
app.get("/", (req, res) =>
{
    res.send("🔥 SERVER ONLINE");
});

// =========================
// GET AVATAR
// =========================
app.get("/avatar/:id", (req, res) =>
{
    const id = req.params.id;

    if(!avatars[id])
    {
        avatars[id] = { xp: 0, level: 1 };
        saveDB(avatars);
    }

    res.json(avatars[id]);
});

// =========================
// SAVE AVATAR
// =========================
app.post("/avatar/:id", (req, res) =>
{
    const id = req.params.id;

    let xp = Number(req.body.xp ?? 0);
    let level = Number(req.body.level ?? 1);

    if(xp < 0) xp = 0;
    if(level < 1) level = 1;

    avatars[id] = { xp, level };

    saveDB(avatars);

    res.json({
        status: "saved",
        id,
        xp,
        level
    });
});

// =========================
// 🔥 TOP 10 FIXED CLEAN
// =========================
app.get("/top", (req, res) =>
{
    let list = Object.entries(avatars);

    list.sort((a, b) =>
        (b[1].level * 100 + b[1].xp) -
        (a[1].level * 100 + a[1].xp)
    );

    let top = list.slice(0, 10).map(([id, data]) =>
    {
        return [
            id,
            [data.xp, data.level]
        ];
    });

    res.json(top);
});

// =========================
// START
// =========================
app.listen(PORT, () =>
{
    console.log("🔥 SERVER RUNNING ON PORT " + PORT);
});
