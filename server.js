const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const SECRET = "v0g2_secure_9XkP";

let avatars = {};

// =========================
// LOAD SAVE (FIX RESTART)
// =========================

function loadData()
{
    if(fs.existsSync("data.json"))
    {
        avatars = JSON.parse(fs.readFileSync("data.json"));
    }
}

function saveData()
{
    fs.writeFileSync("data.json", JSON.stringify(avatars,null,2));
}

loadData();

// =========================
// SECURITY
// =========================

app.use((req,res,next) => {
    if(req.headers["x-secret"] !== SECRET)
    {
        return res.status(403).send("Forbidden");
    }
    next();
});

// =========================
// UPDATE AVATAR
// =========================

app.post("/avatar/:id",(req,res) => {
    const id = req.params.id;

    avatars[id] = {
        xp:req.body.xp,
        level:req.body.level
    };

    saveData();

    res.json({status:"saved"});
});

// =========================
// GET AVATAR
// =========================

app.get("/avatar/:id",(req,res) => {
    const id = req.params.id;

    if(!avatars[id])
    {
        avatars[id] = {xp:0,level:1};
    }

    res.json(avatars[id]);
});

// =========================
// RESYNC ALL (IMPORTANT FIX)
// =========================

app.get("/resync",(req,res) => {
    let list = [];

    for(let id in avatars)
    {
        list.push([id,avatars[id].xp,avatars[id].level]);
    }

    res.json(list);
});

// =========================
// HEARTBEAT
// =========================

app.post("/heartbeat",(req,res) => {
    res.json({status:"ok"});
});

// =========================
// TOP 10
// =========================

app.get("/top",(req,res) => {
    let list = Object.entries(avatars);

    list.sort((a,b) => {
        return (b[1].level*100 + b[1].xp) - (a[1].level*100 + a[1].xp);
    });

    res.json(list.slice(0,10));
});

// =========================
// START
// =========================

app.listen(3000, () => {
    console.log("SERVER V7.6 RUNNING");
});
