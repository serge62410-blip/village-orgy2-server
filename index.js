const express = require("express");
const app = express();

app.use(express.json());

let avatars = {};
let seated = {};

let xpMultiplier = 1;

// =========================
function countSeated()
{
    return Object.keys(seated).length;
}

function level(xp)
{
    return Math.floor(xp / 100) + 1;
}

// =========================
// SEAT SYNC (REALTIME HEARTBEAT)
app.post("/v2/seat",(req,res)=>{
    const {id,action}=req.body;

    if(action==="SIT")
        seated[id]=Date.now();

    if(action==="UNSIT")
        delete seated[id];

    res.json({count:countSeated()});
});

// =========================
// CLEAN AFK SEATS
setInterval(()=>{
    let now = Date.now();

    for(let id in seated)
    {
        if(now - seated[id] > 8000)
            delete seated[id];
    }
},3000);

// =========================
// XP + COUPLE SYSTEM
app.post("/v2/xp",(req,res)=>{
    const {id}=req.body;

    if(!avatars[id])
        avatars[id]={xp:0,level:1};

    let count = countSeated();

    // ❌ SOLO BLOCK
    if(count < 2)
    {
        return res.json({
            cmd:"NOTICE",
            id,
            message:"⚠ System inactive. Need 2 players."
        });
    }

    // 🔥 BASE XP
    let xpGain = 5;

    // 💋 COUPLE BONUS
    if(count === 2)
        xpGain *= 2;

    // 💦 GROUP BONUS
    if(count >= 3)
        xpGain *= 3;

    avatars[id].xp += xpGain;
    avatars[id].level = level(avatars[id].xp);

    return res.json({
        cmd:"HUD",
        id,
        xp:avatars[id].xp,
        level:avatars[id].level,
        bonus:xpGain
    });
});

// =========================
app.listen(3001,()=>console.log("NODE READY REALTIME"));
