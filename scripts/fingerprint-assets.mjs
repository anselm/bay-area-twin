// Version entry assets so cached embeds do not mix old rendering code with new pages.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dist=new URL('../dist/',import.meta.url),versions={};
for(const name of ['main.js','style.css'])versions[name]=createHash('sha256').update(await fs.readFile(new URL(name,dist))).digest('hex').slice(0,12);
for(const name of ['index.html','embed.html']){
 const url=new URL(name,dist),html=await fs.readFile(url,'utf8');
 await fs.writeFile(url,html.replace(/(\b(?:src|href)=["'])\.\/(main\.js|style\.css)(?:\?[^"']*)?(["'])/g,(_,open,file,close)=>`${open}./${file}?v=${versions[file]}${close}`));
}
console.log('Versioned entry assets:',versions);
