const express = require("express");
const app = express();

app.use(express.json());

const SECRET = "v0g2_secure_9XkP";

let avatars = {};

app.use((req, res, next) => {
    if (req.headers["x-secret"] !== SECRET) {
        return res.status(403).send("Forbidden");
    }
    next();
});

app.get("/avatar/:id", (req, res) => {
    const id = req.params.id;

    if (!avatars[id]) {
        avatars[id] = { xp: 0, level: 1 };
    }

    res.json(avatars[id]);
});

app.post("/avatar/:id", (req, res) => {
    const id = req.params.id;

    let xp = Number(req.body.xp ?? 0);
    let level = Number(req.body.level ?? 1);

    avatars[id] = { xp, level };

    res.json({ status: "saved" });
});

app.get("/top", (req, res) => {
    let list = Object.entries(avatars);

    list.sort((a, b) =>
        (b[1].level * 100 + b[1].xp) -
        (a[1].level * 100 + a[1].xp)
    );

    res.json(
        list.slice(0, 10).map(([id, d]) => ({
            id,
            xp: d.xp,
            level: d.level
        }))
    );
});

app.listen(3002, () => {
    console.log("SERVER RUNNING ON PORT 3002");
});
