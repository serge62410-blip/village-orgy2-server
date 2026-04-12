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
    if (count >= 2) return { xp: 5, interval: 30000 };
    return { xp: 1, interval: 60000 };
}

function xpNeeded(level) {
    return 100 + level * 20;
}

// =========================
function checkKey(req, res) {
    if ((req.query.key || "") !== SECRET) {
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
function process(av) {
    if (!av.active) return;

    const now = Date.now();

    if (!av.lastTick) av.lastTick = now;

    let rule = xpRule(av.seatedCount);

    if (now - av.lastTick >= rule.interval) {
        av.lastTick = now;

        av.xp += rule.xp * multiplier;

        let need = xpNeeded(av.level);

        while (av.xp >= need) {
            av.xp -= need;
            av.level += 1;
        }
    }
}

// =========================
app.post("/v2/event/:id", (req, res) => {
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

    let av = avatars[id];

    let seated = !!req.body.seated;
    let count = parseInt(req.body.count);

    if (!count) count = 0;

    // START SESSION
    if (seated === true && count > 0 && av.active === false) {
        av.active = true;
        av.lastTick = Date.now();
    }

    // STOP SESSION
    if (seated === false || count <= 0) {
        av.active = false;
        av.seatedCount = 0;

        save();

        return res.json({
            xp: av.xp,
            level: av.level,
            status: "OFF"
        });
    }

    av.seatedCount = count;

    if (av.active) process(av);

    save();

    res.json({
        xp: av.xp,
        level: av.level,
        status: getStatus(av.seatedCount)
    });
});

// =========================
app.post("/v2/admin/reset", (req, res) => {
    if (!checkKey(req, res)) return;

    avatars = {};
    save();

    res.json({ ok: true });
});

app.post("/v2/admin/multiplier/:v", (req, res) => {
    if (!checkKey(req, res)) return;

    multiplier = parseInt(req.params.v);
    if (!multiplier) multiplier = 1;

    res.json({ multiplier });
});

app.listen(3010, () => console.log("NODE READY"));
