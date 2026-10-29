(function(root){
  'use strict';
  function create({document:doc,main,view,native,route}){
    const win=doc.defaultView,originals=new Map();let avatar=null,avatarAttrs=null,face=null,fontSource='',generation=0,frame=null,resize=null,pending=0,settings=null,extra=null;
    function replace(node,value){
      if(!node)return;const saved=originals.get(node);
      if(!value){if(saved){node.replaceChildren(...saved.nodes);node.classList.remove('pc-text-override');originals.delete(node);}return;}
      if(saved?.value===value)return;
      if(!saved)originals.set(node,{nodes:[...node.childNodes],value});else saved.value=value;node.textContent=value;node.classList.add('pc-text-override');
    }
    function position(){pending=0;if(!frame||!avatar)return;const r=avatar.getBoundingClientRect();frame.hidden=!r.width||r.bottom<0||r.top>win.innerHeight;Object.assign(frame.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});}
    function schedule(){if(!pending)pending=win.requestAnimationFrame(position);}
    function restoreAvatar(){
      if(avatar&&avatarAttrs)for(const [k,v]of Object.entries(avatarAttrs)){if(v===null)avatar.removeAttribute(k);else avatar.setAttribute(k,v);}
      frame?.remove();frame=null;resize?.disconnect();resize=null;avatar=null;
      win.removeEventListener('scroll',schedule,true);win.removeEventListener('resize',schedule);if(pending)win.cancelAnimationFrame(pending);pending=0;
    }
    function bindAvatar(node){
      if(avatar===node)return;restoreAvatar();avatar=node;if(!node)return;
      avatarAttrs=Object.fromEntries(['src','srcset','style'].map(k=>[k,node.getAttribute(k)]));frame=doc.createElement('span');frame.className='pc-avatar-frame';frame.setAttribute('aria-hidden','true');frame.append(doc.createElement('i'));doc.body.append(frame);
      resize=new win.ResizeObserver(schedule);resize.observe(avatar);win.addEventListener('scroll',schedule,{passive:true,capture:true});win.addEventListener('resize',schedule,{passive:true});
    }
    async function font(next){
      const source=next.font==='custom'?next.customFont:'';if(source===fontSource)return;fontSource=source;const id=++generation;if(face)doc.fonts.delete(face);face=null;if(!source)return;
      try{const bytes=Uint8Array.from(atob(source.split(',')[1]),c=>c.charCodeAt(0));const loaded=await new win.FontFace('WinterUploaded',bytes).load();if(id!==generation)return;face=loaded;doc.fonts.add(face);main.dataset.pcFontStatus='loaded';}
      catch{if(id===generation)main.dataset.pcFontStatus='error';}
    }
    function update(next){
      settings=next;void font(next);
      for(const node of [main,view].filter(Boolean)){node.style.setProperty('--pc-accent',next.accent);node.style.setProperty('--pc-secondary',next.secondary);node.style.setProperty('--pc-font',root.PCWinterOptions.fonts[next.font]);}
      bindAvatar((native?main:view).querySelector(native?'.avatar-user.width-full':'.portrait img'));
      if(avatar){
        const desired=next.customAvatar||avatarAttrs.src;if(desired!==null&&avatar.getAttribute('src')!==desired)avatar.setAttribute('src',desired);
        if(next.customAvatar){avatar.removeAttribute('srcset');avatar.style.filter='none';}else{if(avatarAttrs.srcset!==null)avatar.setAttribute('srcset',avatarAttrs.srcset);if(avatarAttrs.style===null)avatar.removeAttribute('style');else avatar.setAttribute('style',avatarAttrs.style);}
        avatar.style.borderRadius=next.avatarShape==='circle'?'50%':'18%';
        if(!native){for(const container of [avatar.closest('.portrait'),avatar.closest('.portrait-ring')])if(container)container.style.borderRadius=avatar.style.borderRadius;}
        frame.dataset.frame=next.frame;frame.dataset.motion=String(next.motion);frame.style.setProperty('--pc-accent',next.accent);frame.style.setProperty('--pc-secondary',next.secondary);frame.style.setProperty('--pc-speed',next.frameSpeed+'s');frame.style.borderRadius=avatar.style.borderRadius;position();
      }
      const base=native?main:view;replace(base.querySelector(native?'.vcard-names .p-name':'.identity h1'),next.displayName);replace(base.querySelector(native?'.p-note':'.identity-copy'),next.bio);
      // Keep the shared title and uikole's half intact.
      if(!native&&route!=='duo')replace(base.querySelector('.hero-copy'),next.headline);
      if(native){let article=main.querySelector('article.markdown-body');
        if(!article&&(next.about||next.headline)){if(!extra){extra=doc.createElement('article');extra.className='pc-local-about';(main.querySelector('.Layout-main')||main).append(extra);}article=extra;}
        replace(article,[next.headline,next.about].filter(Boolean).join('\n\n'));
        if(extra&&!next.about&&!next.headline){originals.delete(extra);extra.remove();extra=null;}
      }else{if(next.about){if(!extra){extra=doc.createElement('section');extra.className='pc-local-about';base.querySelector('.hero').after(extra);}replace(extra,next.about);}else if(extra){originals.delete(extra);extra.remove();extra=null;}}
    }
    return {update,refresh(){if(settings)update(settings);},destroy(){++generation;if(face)doc.fonts.delete(face);for(const [node,saved]of originals){node.replaceChildren(...saved.nodes);node.classList.remove('pc-text-override');}originals.clear();extra?.remove();restoreAvatar();main.removeAttribute('data-pc-font-status');for(const node of [main,view].filter(Boolean))for(const k of ['--pc-accent','--pc-secondary','--pc-font'])node.style.removeProperty(k);}};
  }
  root.PCWinterEffects={create};
})(globalThis);
