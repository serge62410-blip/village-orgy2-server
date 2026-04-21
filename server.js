const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SECRET = "v0g2_secure_9XkP";

const DATA_FILE = "./data.json";

// =========================
// LOAD / SAVE
// =========================

function loadData()
{
    if(!fs.existsSync(DATA_FILE))
    {
        fs.writeFileSync(DATA_FILE, JSON.stringify({avatars:{}}, null, 2));
    }

    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data)
{
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// =========================
// SECURITY
// =========================

app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
    {
        return res.status(403).send("Forbidden");
    }
    next();
});

// =========================
// AVATAR GET
// =========================

app.get("/avatar/:id",(req,res)=>{
    let data = loadData();
    let id = req.params.id;

    if(!data.avatars[id])
    {
        data.avatars[id] = { xp:0, level:1 };
        saveData(data);
    }

    res.json(data.avatars[id]);
});

// =========================
// SYNC
// =========================

app.get("/sync/:id",(req,res)=>{
    let data = loadData();
    let id = req.params.id;

    if(!data.avatars[id])
    {
        data.avatars[id] = { xp:0, level:1 };
        saveData(data);
    }

    res.json(data.avatars[id]);
});

// =========================
// SAVE
// =========================

app.post("/avatar/:id",(req,res)=>{
    let data = loadData();
    let id = req.params.id;

    if(!data.avatars[id])
    {
        data.avatars[id] = { xp:0, level:1 };
    }

    data.avatars[id].xp = req.body.xp;
    data.avatars[id].level = req.body.level;

    saveData(data);

    res.json({status:"ok"});
});

// =========================
// TOP 10
// =========================

app.get("/top",(req,res)=>{
    let data = loadData();
    let list = Object.entries(data.avatars);

    list.sort((a,b)=>{
        return (b[1].level * 100 + b[1].xp) -
               (a[1].level * 100 + a[1].xp);
    });

    res.json(list.slice(0,10));
});

// =========================
// START SERVER
// =========================

app.listen(PORT,"0.0.0.0",()=>{
    console.log("🚀 Server running on port " + PORT);
});
