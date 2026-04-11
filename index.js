const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

// 🔐 Nouveau secret (change-le si tu veux)
const SECRET = "v0g2_secure_9XkP";

// 📦 Data
let avatars = {};
let multiplier = 1;

// =========================
function load() {
    try {
        avatars = JSON.parse(fs.readFileSync("data.json"));
    } catch (e) {
        avatars = {};
    }
}

function save() {
    fs.writeFileSync("data.json", JSON.stringify(avatars, null, 2));
}

load();

// =========================
function xpRule(count) {
    if (count >= 2)
        return { xp: 5, interval: 20000 };

    return { xp: 1, interval: 40000 };
}

// =========================
function xpNeeded(level) {
    return 100 + level * 20;
}

// =========================
function update(av) {
    if (!av.last) av.last = Date.now();

    if (!av.seated) return;

    let now = Date.now();
    let rule = xpRule(av.seatedCount);

    let diff = now - av.last;
    let ticks = Math.floor(diff / rule.interval);

    if (ticks <= 0) return;

    av.last += ticks * rule.interval;

    av.xp += ticks * rule.xp * multiplier;

    while (av.xp >= xpNeeded(av.level)) {
        av.xp -= xpNeeded(av.level);
        av.level++;
    }
}

// =========================
// 📡 STATUS
app.post("/v2/status/:id", (req, res) => {
    if (req.headers["x-vog2-key"] !== SECRET)
        return res.status(403).json({ error: "Forbidden" });

    let id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = {
            xp: 0,
            level: 1,
            seated: false,
            seatedCount: 0,
            last: Date.now()
        };
    }

    let av = avatars[id];

    // 🛡️ Anti-cheat
    av.seated = !!req.body.seated;
    av.seatedCount = Math.max(0, Math.min(5, parseInt(req.body.seatedCount) || 0));

    update(av);

    save();

    res.json({
        xp: av.xp,
        level: av.level
    });
});

// =========================
// 🏆 TOP
app.get("/v2/top", (req, res) => {
    let list = Object.entries(avatars);

    list.sort((a, b) =>
        (b[1].level * 1000 + b[1].xp) -
        (a[1].level * 1000 + a[1].xp)
    );

    let top = list.slice(0, 10);

    let result = top.map(p => ({
        id: p[0],
        level: p[1].level,
        xp: p[1].xp
    }));

    res.json({ top: result });
});

// =========================
// ⚙️ ADMIN (sécurisé)
app.post("/v2/admin/multiplier/:v", (req, res) => {
    if (req.headers["x-vog2-key"] !== SECRET)
        return res.status(403).json({});

    multiplier = Math.max(1, parseInt(req.params.v) || 1);

    res.json({ multiplier });
});

app.post("/v2/admin/reset", (req, res) => {
    if (req.headers["x-vog2-key"] !== SECRET)
        return res.status(403).json({});

    avatars = {};
    save();

    res.json({ ok: true });
});

// =========================
// 🌐 PORT (Render compatible + custom fallback)
const PORT = process.env.PORT || 3010;

app.listen(PORT, () => {
    console.log("Village Orgy 2 server running on port " + PORT);
});
