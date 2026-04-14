// server Json V7 FULL SERVER

const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

let avatars = {};
let seated = new Set();

// CONFIG XP
const XP_PER_TICK = 5;
const TICK_RATE = 5000; // 5 sec

// =====================
// AUTH
// =====================
app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
        return res.status(403).json({error:"Forbidden"});
    next();
});

// =====================
// AVATAR
// =====================
app.get("/v2/avatar/:id",(req,res)=>{
    const id = req.params.id;
    if(!avatars[id]) avatars[id]={xp:0,level:1};
    res.json(avatars[id]);
});

// =====================
// SEAT SYSTEM
// =====================
app.post("/v2/seat",(req,res)=>{
    const {action, id} = req.body;

    if(action==="SIT") seated.add(id);
    if(action==="UNSIT") seated.delete(id);

    res.json({active: seated.size >= 2});
});

// =====================
// TOP 10
// =====================
app.get("/v2/top",(req,res)=>{
    let list=Object.entries(avatars);

    list.sort((a,b)=>
        (b[1].level*100+b[1].xp)-
        (a[1].level*100+a[1].xp)
    );

    res.json(list.slice(0,10));
});

// =====================
// XP ENGINE
// =====================
setInterval(()=>{
    if(seated.size < 2) return;

    seated.forEach(id=>{
        if(!avatars[id]) avatars[id]={xp:0,level:1};

        avatars[id].xp += XP_PER_TICK;

        if(avatars[id].xp >= 100)
        {
            avatars[id].xp -= 100;
            avatars[id].level += 1;
        }
    });

}, TICK_RATE);

app.listen(3001,()=>console.log("🔥 V7 SERVER READY"));
