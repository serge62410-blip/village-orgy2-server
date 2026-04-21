const express = require("express");
const app = express();

app.use(express.json());

const SECRET = "v0g2_secure_9XkP";

let avatars = {};

// sécurité
app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
        return res.status(403).send("Forbidden");
    next();
});

// get avatar
app.get("/avatar/:id",(req,res)=>{
    const id = req.params.id;

    if(!avatars[id])
        avatars[id] = { xp:0, level:1 };

    res.json(avatars[id]);
});

// save avatar
app.post("/avatar/:id",(req,res)=>{
    const id = req.params.id;
    const { xp, level } = req.body;

    avatars[id] = { xp, level };

    res.json({status:"ok"});
});

// top
app.get("/top",(req,res)=>{
    let list = Object.entries(avatars);

    list.sort((a,b)=>{
        return (b[1].level*100 + b[1].xp) - (a[1].level*100 + a[1].xp);
    });

    res.json(list.slice(0,10));
});

app.listen(3000,()=>console.log("Server running"));
