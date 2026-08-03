// Curate extracted elements into a representative marker set per screen.
// Read-only: reads figma-export/*.json, writes figma-export/{name}.curated.json
const fs = require('fs');
const path = require('path');
const OUT = '/home/user/Claim-ERP/figma-export';

const SCREENS = ['index','smart-claims','smart-intake','image-system','approval-list',
  'assignment-management','vendor-inquiry','vendor-eval','message-send','ai-dashboard','smart-claims-demo'];

function firstClasses(cls, n=2){
  if(!cls) return '';
  return cls.trim().split(/\s+/).filter(c=>!/^(active|disabled|none|watch|urgent|selected|open|on|off)$/.test(c)).slice(0,n).join('.');
}

for(const name of SCREENS){
  const p = path.join(OUT, name+'.json');
  if(!fs.existsSync(p)) continue;
  const d = JSON.parse(fs.readFileSync(p,'utf8'));
  const pageW = d.page.scrollWidth, pageH = d.page.scrollHeight;
  const groups = new Map();
  for(const e of d.elements){
    // on-canvas only
    if(e.x < 0 || e.y < 0) continue;
    if(e.x >= pageW || e.y >= pageH) continue;
    // anchors with distinct hrefs stay distinct; otherwise group by fn/id/class-signature
    let sig;
    if(e.tag==='a' && e.href) sig = 'a|href|'+e.href;
    else sig = e.fn || e.id || (e.tag+'|'+(e.type||'')+'|'+firstClasses(e.class));
    if(!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(e);
  }
  const curated = [];
  for(const [sig, arr] of groups){
    // representative = first (top-most)
    arr.sort((a,b)=> a.y-b.y || a.x-b.x);
    const rep = arr[0];
    curated.push({
      sig,
      count: arr.length,
      repeated: arr.length>1,
      tag: rep.tag, type: rep.type, role: rep.role,
      text: rep.text, id: rep.id, class: rep.class,
      href: rep.href, name: rep.name, fn: rep.fn,
      handlers: rep.handlers,
      x: rep.x, y: rep.y, w: rep.w, h: rep.h,
    });
  }
  // order by reading order (y then x)
  curated.sort((a,b)=> a.y-b.y || a.x-b.x);
  fs.writeFileSync(path.join(OUT, name+'.curated.json'),
    JSON.stringify({screen:d.screen, page:{w:pageW,h:pageH}, count:curated.length, elements:curated}, null, 2));
  console.log(`${name}: ${d.elements.length} -> ${curated.length} curated`);
}
