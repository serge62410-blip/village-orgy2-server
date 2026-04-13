const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

let multiplier = 1;
let avatars = {};
let seated = {};

// =========================
function countPlayers()
{
    return Object.keys(seated).length;
}

function calcLevel(xp)
{
    return Math.floor(xp / 100) + 1;
}

// =========================
app.post("/v2/seat",(req,res)=>{
    const {id,action}=req.body;

    if(action === "SIT") seated[id]=true;
    if(action === "UNSIT") delete seated[id];

    res.json({
        count: countPlayers(),
        active: countPlayers() >= 2
    });
});

// =========================
app.post("/v2/xp",(req,res)=>{
    const {id}=req.body;

    if(!avatars[id])
        avatars[id]={xp:0,level:1};

    // 🚨 SOLO BLOCK
    if(countPlayers() < 2)
    {
        return res.json({
            cmd:"NOTICE",
            id:id,
            message:"⚠ You need at least 2 players seated to activate XP system"
        });
    }

    avatars[id].xp += 5 * multiplier;
    avatars[id].level = calcLevel(avatars[id].xp);

    return res.json({
        cmd:"HUD",
        id:id,
        xp:avatars[id].xp,
        level:avatars[id].level
    });
});

// =========================
app.post("/v2/admin",(req,res)=>{
    if(req.headers["x-secret"] !== SECRET)
        return res.status(403).json({error:"no access"});

    const {action}=req.body;

    if(action==="XP1") multiplier=1;
    if(action==="XP2") multiplier=2;
    if(action==="XP3") multiplier=3;
    if(action==="XP5") multiplier=5;

    if(action==="RESET")
    {
        avatars={};
        seated={};
    }

    if(action==="TOP")
    {
        let t = Object.entries(avatars)
        .sort((a,b)=>(b[1].level*100+b[1].xp)-(a[1].level*100+a[1].xp))
        .slice(0,10)
        .map(x=>`${x[0]} L${x[1].level} XP${x[1].xp}`)
        .join("\n");

        return res.json({cmd:"TOP",data:t});
    }

    res.json({cmd:"OK"});
});

// =========================
app.listen(3001,()=>console.log("NODE READY"));
