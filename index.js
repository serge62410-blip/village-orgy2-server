const express = require("express");
const app = express();

app.use(express.json());

const SECRET = "v0g2_secure_9XkP";

let avatars = {};

app.use((req,res,next)=>{
    if(req.query.secret !== SECRET)
        return res.status(403).json({error:"Forbidden"});
    next();
});

app.post("/v2/xp/:id",(req,res)=>{
    const id = req.params.id;
    const amount = req.body.amount;

    if(!avatars[id])
        avatars[id] = {xp:0,level:1};

    avatars[id].xp += amount;

    while(avatars[id].xp >= 100)
    {
        avatars[id].xp -= 100;
        avatars[id].level++;
    }

    res.json(avatars[id]);
});

app.post("/v2/reset",(req,res)=>{
    avatars = {};
    res.json({ok:true});
});

app.listen(3001,()=>console.log("SERVER READY"));
