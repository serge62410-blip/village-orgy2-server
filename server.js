const express = require("express");
const app = express();

app.use(express.json());

const SECRET = "v0g2_secure_9XkP";

// mémoire (stable runtime)
let avatars = {};

// =========================
app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
        return res.status(403).send("Forbidden");
    next();
});

// =========================
// GET
// =========================
app.get("/avatar/:id",(req,res)=>{
    const id = req.params.id;

    if(!avatars[id])
        avatars[id] = { xp:0, level:1 };

    res.json(avatars[id]);
});

// =========================
// SAVE
// =========================
app.post("/avatar/:id",(req,res)=>{
    const id = req.params.id;
    const { xp, level } = req.body;

    if(!avatars[id])
        avatars[id] = {};

    avatars[id].xp = xp;
    avatars[id].level = level;

    res.json({status:"ok"});
});

// =========================
// SYNC SAFE (IMPORTANT FIX)
// =========================
app.get("/sync/:id",(req,res)=>{
    const id = req.params.id;

    if(!avatars[id])
        avatars[id] = { xp:0, level:1 };

    res.json(avatars[id]);
});

// =========================
app.listen(3000,()=>console.log("SERVER OK"));
