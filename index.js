const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const SECRET = "v0g2_secure_9XkP";

let avatars = {};
let multiplier = 1;

// =========================
function load() {
    try {
        avatars = JSON.parse(fs.readFileSync("data.json"));
    } catch {
        avatars = {};
    }
}

function save() {
    fs.writeFileSync("data.json", JSON.stringify(avatars, null, 2));
}

load();

// =========================
function xpRule(count) {
    return count >= 2
        ? { xp: 5, interval: 30000 }
        : { xp: 1, interval: 50000 };
}

function xpNeeded(level) {
    return 100 + level * 20;
}

// =========================
function update(av) {
    if (!av.last) av.last = Date.now();
    if (!av.seated || av.seatedCount <= 0) return;

    const now = Date.now();
    const rule = xpRule(av.seatedCount);

    const diff = now - av.last;
    const ticks = Math.floor(diff / rule.interval);

    if (ticks <= 0) return;

    av.last += ticks * rule.interval;
    av.xp += ticks * rule.xp * multiplier;

    while (av.xp >= xpNeeded(av.level)) {
        av.xp -= xpNeeded(av.level);
        av.level++;
    }
}

// =========================
function checkKey(req, res) {
    const key = (req.headers["x-vog2-key"] || "").toString().trim();
    if (key !== SECRET) {
        res.status(403).json({ error: "Forbidden" });
        return false;
    }
    return true;
}

// =========================
app.post("/v2/status/:id", (req, res) => {
    if (!checkKey(req, res)) return;

    const id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = {
            xp: 0,
            level: 1,
            seated: false,
            seatedCount: 0,
            last: Date.now()
        };
    }

    const av = avatars[id];

    av.seated = !!req.body.seated;
    av.seatedCount = Math.max(0, Math.min(10, parseInt(req.body.seatedCount) || 0));

    if (!av.seated || av.seatedCount <= 0) {
        av.last = Date.now();
    }

    if (av.seated && av.seatedCount > 0) {
        update(av);
    }

    save();

    res.json({
        xp: av.xp,
        level: av.level,
        multiplier: multiplier
    });
});

// =========================
app.get("/v2/top", (req, res) => {
    const list = Object.entries(avatars);

    list.sort((a, b) =>
        (b[1].level * 1000 + b[1].xp) -
        (a[1].level * 1000 + a[1].xp)
    );

    res.json({
        top: list.slice(0, 10).map(p => ({
            id: p[0],
            level: p[1].level,
            xp: p[1].xp
        }))
    });
});

// =========================
app.post("/v2/admin/multiplier/:v", (req, res) => {
    if (!checkKey(req, res)) return;

    multiplier = Math.max(1, parseInt(req.params.v) || 1);

    res.json({ multiplier });
});

// =========================
app.post("/v2/admin/reset_all", (req, res) => {
    if (!checkKey(req, res)) return;

    avatars = {};
    save();

    res.json({ ok: true });
});

// =========================
const PORT = process.env.PORT || 3010;
app.listen(PORT, () => {
    console.log("Server running on " + PORT);
});
