const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '../data/primaryOwner.json');
function load(){ try{ if(!fs.existsSync(file)) return {}; return JSON.parse(fs.readFileSync(file,'utf8')); }catch{ return {}; } }
function save(d){ fs.writeFileSync(file, JSON.stringify(d,null,2)); }
function getPrimaryOwner(groupId){ const d=load(); return d[groupId]||null; }
function isPrimaryOwner(groupId, userId){
    const p=getPrimaryOwner(groupId);
    if(!p) return false;
    if(p===userId) return true;
    // handle @lid vs @s.whatsapp.net — compare user part
    const a=p.split('@')[0], b=userId.split('@')[0];
    return a===b;
}
function setPrimaryOwner(groupId, userId){
    const d=load();
    if(d[groupId]) return false; // already set, don't overwrite
    d[groupId]=userId;
    save(d);
    return true;
}
function clearPrimaryOwner(groupId){
    const d=load();
    if(!d[groupId]) return false;
    delete d[groupId];
    save(d);
    return true;
}
module.exports={getPrimaryOwner,setPrimaryOwner,isPrimaryOwner,load,save,clearPrimaryOwner};
