const express = require("express");
const app = express();

app.use(express.json());

const SECRET = "v0g2_secure_9XkP";
const PORT = process.env.PORT || 3001;

let avatars = {};

function checkSecret(req, res, next)
{
    const s = req.query.secret || req.body.secret;

    if(s !== SECRET)
        return res.status(403).json({ error: "Forbidden" });

    next();
}

app.post("/v2/xp/global", checkSecret, (req, res) => {

    const amount = Number(req.body.amount || 0);
    const users = req.body.users || [];

    let result = [];

    for(let i = 0; i < users.length; i++)
    {
        const id = users[i];

        if(!avatars[id])
            avatars[id] = { xp: 0, level: 1 };

        avatars[id].xp += amount;

        while(avatars[id].xp >= 100)
        {
            avatars[id].xp -= 100;
            avatars[id].level++;
        }

        result.push(id + "," + avatars[id].xp + "," + avatars[id].level);
    }

    res.json({
        result: result.join("|")
    });
});

app.post("/v2/reset", checkSecret, (req, res) => {
    avatars = {};
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log("SERVER READY");
});
