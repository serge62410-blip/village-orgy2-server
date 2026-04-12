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
        : { xp: 1, interval: 60000 };
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
    const key = (req.query.key || "").toString().trim();

    if (key !== SECRET) {
        res.status(403).json({ error: "Forbidden" });
        return false;
    }
    return true;
}

// =========================
// 🔥 STATUS CENTRALISÉ
function getStatus(count) {
    if (count <= 0) return "OFF";
    if (count === 1) return "WAIT";
    return "FUCK";
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

    const wasSeated = av.seated;

    const nowSeated = !!req.body.seated;
    const nowCount = Math.max(0, parseInt(req.body.seatedCount) || 0);

    // =========================
    // 🔥 reset propre transition
    if (wasSeated !== nowSeated) {
        av.last = Date.now();
    }

    av.seated = nowSeated;
    av.seatedCount = nowCount;

    if (av.seated && av.seatedCount > 0) {
        update(av);
    }

    save();

    res.json({
        xp: av.xp,
        level: av.level,
        multiplier: multiplier,
        status: getStatus(av.seatedCount),
        seatedCount: av.seatedCount
    });
});

// =========================
app.post("/v2/admin/multiplier/:v", (req, res) => {
    if (!checkKey(req, res)) return;

    multiplier = Math.max(1, parseInt(req.params.v) || 1);

    res.json({ multiplier });
});

app.post("/v2/admin/reset_all", (req, res) => {
    if (!checkKey(req, res)) return;

    avatars = {};
    save();

    res.json({ ok: true });
});

// =========================
app.listen(3010, () => console.log("Server OK"));
