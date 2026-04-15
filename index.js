const express = require("express");
const app = express();

app.use(express.json());

// =========================
// SECRET
// =========================
const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

// =========================
// MEMORY DB
// =========================
let avatars = {};

// =========================
// AUTH FIX (IMPORTANT)
// =========================
app.use((req,res,next)=>{
    if(req.query.secret !== SECRET)
        return res.status(403).json({error:"Forbidden"});
    next();
});

// =========================
// GET AVATAR
// =========================
app.get("/v2/avatar/:id",(req,res)=>{
    const id = req.params.id;

    if(!avatars[id])
        avatars[id] = {xp:0, level:1};

    res.json(avatars[id]);
});

// =========================
// SET FULL AVATAR
// =========================
app.post("/v2/avatar/:id",(req,res)=>{
    const id = req.params.id;
    const {xp,level} = req.body;

    if(typeof xp !== "number" || typeof level !== "number")
        return res.status(400).json({error:"bad data"});

    avatars[id] = {xp,level};

    res.json({ok:true});
});

// =========================
// ADD XP (CORE SYSTEM)
// =========================
app.post("/v2/xp/:id",(req,res)=>{
    const id = req.params.id;
    const {amount} = req.body;

    if(!avatars[id])
        avatars[id] = {xp:0, level:1};

    if(typeof amount !== "number")
        return res.status(400).json({error:"bad xp"});

    avatars[id].xp += amount;

    // LEVEL SYSTEM
    while(avatars[id].xp >= 100)
    {
        avatars[id].xp -= 100;
        avatars[id].level++;
    }

    res.json(avatars[id]);
});

// =========================
// RESET ALL
// =========================
app.post("/v2/reset",(req,res)=>{
    avatars = {};
    res.json({ok:true});
});

// =========================
// TOP 10
// =========================
app.get("/v2/top",(req,res)=>{
    let list = Object.entries(avatars);

    list.sort((a,b)=>
        (b[1].level * 100 + b[1].xp) -
        (a[1].level * 100 + a[1].xp)
    );

    res.json(list.slice(0,10));
});

// =========================
// SERVER START
// =========================
app.listen(3001,()=>{
    console.log("🔥 V6.7 NODE SERVER READY");
});
