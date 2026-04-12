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
function checkKey(req, res) {
    const key = (req.query.key || "").toString().trim();

    if (key !== SECRET) {
        res.status(403).json({ error: "Forbidden" });
        return false;
    }
    return true;
}

// =========================
function getStatus(count) {
    if (count <= 0) return "OFF";
    if (count === 1) return "WAIT";
    return "FUCK";
}

// =========================
function processXP(av) {
    if (!av.active) return;

    const now = Date.now();
    const rule = xpRule(av.seatedCount);

    if (!av.lastTick) av.lastTick = now;

    if (now - av.lastTick >= rule.interval) {
        av.lastTick = now;

        av.xp += rule.xp * multiplier;

        let need = xpNeeded(av.level);

        while (av.xp >= need) {
            av.xp -= need;
            av.level++;
            need = xpNeeded(av.level);
        }
    }
}

// =========================
app.post("/v2/status/:id", (req, res) => {
    if (!checkKey(req, res)) return;

    const id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = {
            xp: 0,
            level: 1,
            seatedCount: 0,
            active: false,
            lastTick: 0
        };
    }

    const av = avatars[id];

    const nowSeated = !!req.body.seated;
    const nowCount = Math.max(0, parseInt(req.body.seatedCount) || 0);

    // =========================
    // START SESSION
    if (!av.active && nowSeated && nowCount > 0) {
        av.active = true;
        av.seatedCount = nowCount;
        av.lastTick = Date.now();
    }

    // =========================
    // STOP SESSION
    if (av.active && (!nowSeated || nowCount <= 0)) {
        av.active = false;
        av.seatedCount = 0;

        save();

        return res.json({
            xp: av.xp,
            level: av.level,
            status: "OFF",
            seatedCount: 0
        });
    }

    av.seatedCount = nowCount;

    if (av.active) {
        processXP(av);
    }

    save();

    res.json({
        xp: av.xp,
        level: av.level,
        status: String(getStatus(av.seatedCount)),
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
