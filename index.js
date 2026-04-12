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
    return "ACTIVE";
}

// =========================
function process(av) {
    if (!av.active) return;

    const now = Date.now();

    if (!av.lastTick) av.lastTick = now;

    const interval = 40000; // FIX: 40 sec

    if (now - av.lastTick >= interval) {
        av.lastTick = now;

        av.xp += 5 * multiplier;

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

    // =========================
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

    // =========================
    // UPDATE COUNT
    av.seatedCount = count;

    // =========================
    // START ONLY IF 2+
    if (av.seatedCount >= 2) {
        av.active = true;
    } else {
        av.active = false;
    }

    // =========================
    if (av.active) {
        process(av);
    }

    save();

    res.json({
        xp: av.xp,
        level: av.level,
        status: getStatus(av.seatedCount)
    });
});

// =========================
app.listen(3010, () => {
    console.log("CORE FIXED READY");
});
