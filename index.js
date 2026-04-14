const express = require("express");
const app = express();

app.use(express.json());

const SECRET = process.env.SECRET || "v0g2_secure_9XkP";

let avatars = {};
let seats = 0;

// auth
app.use((req,res,next)=>{
    if(req.headers["x-secret"] !== SECRET)
        return res.status(403).json({error:"Forbidden"});
    next();
});

// avatar
app.get("/v2/avatar/:id",(req,res)=>{
    const id = req.params.id;
    if(!avatars[id]) avatars[id]={xp:0,level:1};
    res.json(avatars[id]);
});

app.post("/v2/avatar/:id",(req,res)=>{
    const id=req.params.id;
    const {xp,level}=req.body;

    if(typeof xp!=="number"||typeof level!=="number")
        return res.status(400).json({error:"bad data"});

    avatars[id]={xp,level};
    res.json({ok:true});
});

// seat system
app.post("/v2/seat",(req,res)=>{
    const {action}=req.body;

    if(action==="SIT") seats++;
    if(action==="UNSIT") seats--;

    if(seats<0) seats=0;

    res.json({active: seats>=2});
});

// top
app.get("/v2/top",(req,res)=>{
    let list=Object.entries(avatars);

    list.sort((a,b)=>
        (b[1].level*100+b[1].xp)-
        (a[1].level*100+a[1].xp)
    );

    res.json(list.slice(0,10));
});

app.listen(3001,()=>console.log("V2 SERVER READY"));
