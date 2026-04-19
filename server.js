const express = require("express");
const fs = require("fs");

const app = express();

const PORT = process.env.PORT || 3002;
const SECRET = "v0g2_secure_9XkP";
const DB_FILE = "database.json";

app.use(express.json());

let avatars = {};

if (fs.existsSync(DB_FILE)) {
    try {
        avatars = JSON.parse(fs.readFileSync(DB_FILE));
    } catch (e) {
        avatars = {};
    }
}

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(avatars, null, 2));
}

app.use((req, res, next) => {
    if (req.headers["x-secret"] !== SECRET) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
});

app.get("/avatar/:id", (req, res) => {
    const id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = { xp: 0, level: 1 };
        saveDB();
    }

    res.json(avatars[id]);
});

app.post("/avatar/:id", (req, res) => {
    const id = req.params.id;

    avatars[id] = {
        xp: Number(req.body.xp),
        level: Number(req.body.level)
    };

    saveDB();

    res.json({ status: "saved" });
});

app.get("/top", (req, res) => {
    let list = Object.entries(avatars);

    list.sort((a, b) =>
        (b[1].level * 100 + b[1].xp) -
        (a[1].level * 100 + a[1].xp)
    );

    res.json(list.slice(0, 10));
});

app.listen(PORT, () => {
    console.log("SERVER RUNNING");
});
