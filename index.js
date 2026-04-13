const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

// =========================
let multiplier = 1;

let avatars = {};
let seated = {};

// =========================
function calcLevel(xp)
{
    return Math.floor(xp / 100) + 1;
}

// =========================
function top10()
{
    return Object.entries(avatars)
        .sort((a,b)=>
            (b[1].level*100+b[1].xp)-
            (a[1].level*100+a[1].xp)
        )
        .slice(0,10);
}

// =========================
app.post("/v2/admin",(req,res)=>{
    if(req.headers["x-secret"] !== SECRET)
        return res.status(403).json({error:"no access"});

    const {action,user}=req.body;

    if(action === "XP1") multiplier=1;
    if(action === "XP2") multiplier=2;
    if(action === "XP3") multiplier=3;
    if(action === "XP5") multiplier=5;

    if(action === "RESET")
    {
        avatars = {};
        seated = {};
    }

    if(action === "TOP")
    {
        let t = top10()
            .map(x => `${x[0]} L${x[1].level} XP${x[1].xp}`)
            .join("\n");

        return res.json({cmd:"TOP",data:t});
    }

    if(action === "ADMINS")
    {
        return res.json({cmd:"ADMINS",data:"Admin system active"});
    }

    res.json({cmd:"OK"});
});

// =========================
app.post("/v2/seat",(req,res)=>{
    const {id,action}=req.body;

    if(action==="SIT") seated[id]=true;
    if(action==="UNSIT") delete seated[id];

    res.json({ok:true});
});

// =========================
app.post("/v2/xp",(req,res)=>{
    const {id}=req.body;

    if(!avatars[id])
        avatars[id]={xp:0,level:1};

    if(Object.keys(seated).length < 2)
        return res.json({skip:true});

    avatars[id].xp += 5 * multiplier;
    avatars[id].level = calcLevel(avatars[id].xp);

    res.json({
        cmd:"HUD",
        id,
        xp:avatars[id].xp,
        level:avatars[id].level
    });
});

// =========================
app.listen(3001,()=>console.log("NODE READY"));
