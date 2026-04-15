
// server json V6.7 FINAL

const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

let avatars = {};
let seats = 0;

// =========================
// AUTH
// =========================
app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
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
// UPDATE AVATAR
// =========================
app.post("/v2/avatar/:id",(req,res)=>{
    const id=req.params.id;
    const {xp,level}=req.body;

    if(typeof xp!=="number"||typeof level!=="number")
        return res.status(400).json({error:"bad data"});

    avatars[id]={xp,level};
    res.json({ok:true});
});

// =========================
// ADD XP (CORE)
// =========================
app.post("/v2/xp/:id",(req,res)=>{
    const id=req.params.id;
    const {amount}=req.body;

    if(!avatars[id])
        avatars[id]={xp:0,level:1};

    avatars[id].xp += amount;

    while(avatars[id].xp >= 100)
    {
        avatars[id].xp -= 100;
        avatars[id].level++;
    }

    res.json(avatars[id]);
});

// =========================
// RESET GLOBAL
// =========================
app.post("/v2/reset",(req,res)=>{
    avatars = {};
    res.json({ok:true});
});

// =========================
// TOP 10
// =========================
app.get("/v2/top",(req,res)=>{
    let list=Object.entries(avatars);

    list.sort((a,b)=>
        (b[1].level*100+b[1].xp)-
        (a[1].level*100+a[1].xp)
    );

    res.json(list.slice(0,10));
});

app.listen(3001,()=>console.log("🔥 V6.7 SERVER READY"));
