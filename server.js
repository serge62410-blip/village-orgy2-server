const express = require("express");
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const SECRET = "v0g2_secure_9XkP";

// =========================
// MEMORY DATABASE
// =========================

let avatars = {};

// =========================
// SECURITY MIDDLEWARE
// =========================

app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
    {
        return res.status(403).send("Forbidden");
    }
    next();
});

// =========================
// GET AVATAR
// =========================

app.get("/avatar/:id",(req,res)=>{
    const id = req.params.id;

    if(!avatars[id])
    {
        avatars[id] = { xp:0, level:1 };
    }

    res.json(avatars[id]);
});

// =========================
// SYNC (LSL SAFE)
// =========================

app.get("/sync/:id",(req,res)=>{
    const id = req.params.id;

    if(!avatars[id])
    {
        avatars[id] = { xp:0, level:1 };
    }

    res.json({
        xp: avatars[id].xp,
        level: avatars[id].level
    });
});

// =========================
// SAVE AVATAR
// =========================

app.post("/avatar/:id",(req,res)=>{
    const id = req.params.id;

    const xp = req.body.xp;
    const level = req.body.level;

    if(!avatars[id])
    {
        avatars[id] = {};
    }

    avatars[id].xp = xp;
    avatars[id].level = level;

    res.json({status:"ok"});
});

// =========================
// TOP 10
// =========================

app.get("/top",(req,res)=>{
    let list = Object.entries(avatars);

    list.sort((a,b)=>{
        return (b[1].level * 100 + b[1].xp) -
               (a[1].level * 100 + a[1].xp);
    });

    res.json(list.slice(0,10));
});

// =========================
// START SERVER
// =========================

app.listen(PORT, "0.0.0.0", ()=>{
    console.log("Server running on port " + PORT);
});
