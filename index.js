const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

let avatars = {};
let seated = {};
let xpMultiplier = 1;

// =========================
function getLevel(xp)
{
    return Math.floor(xp / 100) + 1;
}

// =========================
function top10()
{
    return Object.entries(avatars)
    .sort((a,b)=>(b[1].level*100+b[1].xp)-(a[1].level*100+a[1].xp))
    .slice(0,10);
}

// =========================
app.post("/v2/seat",(req,res)=>{
    const {id,action}=req.body;

    if(action==="SIT") seated[id]=Date.now();
    if(action==="UNSIT") delete seated[id];

    res.json({count:Object.keys(seated).length});
});

// =========================
setInterval(()=>{
    let now=Date.now();

    for(let id in seated)
        if(now-seated[id]>8000)
            delete seated[id];
},3000);

// =========================
app.post("/v2/xp",(req,res)=>{
    const {id}=req.body;

    if(!avatars[id])
        avatars[id]={xp:0,level:1};

    let count = Object.keys(seated).length;

    if(count < 2)
    {
        return res.json({
            cmd:"NOTICE",
            id,
            message:"⚠ 2 players required"
        });
    }

    let gain = 5;

    if(count===2) gain*=2;
    if(count>=3) gain*=3;

    avatars[id].xp += gain;
    avatars[id].level = getLevel(avatars[id].xp);

    res.json({
        cmd:"HUD",
        id,
        xp:avatars[id].xp,
        level:avatars[id].level,
        bonus:gain
    });
});

// =========================
app.post("/v2/admin",(req,res)=>{
    if(req.headers["x-secret"]!==SECRET)
        return res.status(403).json({error:"forbidden"});

    const {action}=req.body;

    if(action==="XP1") xpMultiplier=1;
    if(action==="XP2") xpMultiplier=2;
    if(action==="XP3") xpMultiplier=3;
    if(action==="XP5") xpMultiplier=5;

    if(action==="RESET")
    {
        avatars={};
        seated={};
    }

    if(action==="TOP")
    {
        let t = top10()
        .map(x=>x[0]+" | L"+x[1].level+" | XP "+x[1].xp)
        .join("\n");

        return res.json({cmd:"TOP",data:t});
    }

    res.json({cmd:"OK"});
});

app.listen(3001,()=>console.log("NODE READY FIXED"));
