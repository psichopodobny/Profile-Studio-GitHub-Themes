(function(root){
  'use strict';
  const o=root.PCWinterOptions,FILE='profile-studio.json',HUB='psichopodobny/psichopodobny';
  function reference(input){
    if(!input||typeof input!=='object')throw Error('Некорректная ссылка на тему.');
    const owner=o.loginFor(input.owner),file=input.file||FILE;
    if(!owner||owner!==input.owner||typeof file!=='string'||!(file===FILE||/^profile-studio-themes\/[a-z0-9][a-z0-9_-]{0,63}\.json$/.test(file)))throw Error('Некорректный автор или путь темы.');
    return {owner,file};
  }
  function rawURL(input){const r=reference(input);return 'https://raw.githubusercontent.com/'+r.owner+'/'+r.owner+'/HEAD/'+r.file;}
  function parse(source,expectedOwner){
    if(typeof source!=='string'||source.length>8000000)throw Error('Файл темы больше 8 МБ.');
    let p;try{p=JSON.parse(source);}catch{throw Error('Не удалось прочитать опубликованную тему.');}
    if(!p||p.format!=='profile-studio-profile'||p.version!==1||Object.keys(p).some(k=>!['format','version','owner','allowRemix','basedOn','theme'].includes(k)))throw Error('Неподдерживаемый формат публикации.');
    const owner=o.loginFor(p.owner);if(!owner||owner!==p.owner||(expectedOwner&&owner!==expectedOwner)||typeof p.allowRemix!=='boolean')throw Error('Автор темы не совпадает с профилем.');
    const basedOn=p.basedOn==null?null:reference(p.basedOn),theme=o.parseTheme(JSON.stringify(p.theme));
    return {format:p.format,version:1,owner,allowRemix:p.allowRemix,basedOn,theme};
  }
  function serialize(preferences,{owner,name,includePersonal=false,allowRemix=true,basedOn=null}){
    owner=o.loginFor(owner);if(!owner)throw Error('Укажи свой ник GitHub перед публикацией.');
    const p={format:'profile-studio-profile',version:1,owner,allowRemix:Boolean(allowRemix),basedOn:basedOn?reference(basedOn):null,theme:JSON.parse(o.serializeTheme(preferences,{name,includePersonal}))};
    const result=JSON.stringify(p,null,2);parse(result,owner);return result;
  }
  function slug(input){return String(input||'my-theme').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64)||'my-theme';}
  function issueURL(input){
    const r=reference(input),meta={format:'profile-studio-share',version:1,...r,name:String(input.name||'Моя тема').slice(0,80),description:String(input.description||'').slice(0,240),accent:/^#[a-f0-9]{6}$/i.test(input.accent||'')?input.accent:'#a8bde5'};
    const body='## '+meta.name+'\n\n'+meta.description+'\n\nАвтор: @'+r.owner+'\n\nТема: '+rawURL(r)+'\n\nПубликую собственное оформление для использования и переработки.\n\n```profile-studio\n'+JSON.stringify(meta,null,2)+'\n```';
    return 'https://github.com/'+HUB+'/issues/new?title='+encodeURIComponent('[Theme] '+meta.name)+'&body='+encodeURIComponent(body);
  }
  function entries(issues){
    if(!Array.isArray(issues))throw Error('Некорректный ответ галереи.');
    return issues.slice(0,100).flatMap(issue=>{try{
      if(issue.pull_request||issue.state!=='open'||typeof issue.body!=='string'||issue.body.length>65536)return [];
      const match=issue.body.match(/```profile-studio\s*\n([\s\S]*?)\n```/);if(!match)return [];
      const meta=JSON.parse(match[1]),r=reference(meta);
      if(meta.format!=='profile-studio-share'||meta.version!==1||o.loginFor(issue.user?.login)!==r.owner||typeof meta.name!=='string'||meta.name.length>80||!Number.isSafeInteger(issue.number)||issue.number<1)return [];
      return [{...r,name:meta.name,description:typeof meta.description==='string'?meta.description.slice(0,240):'',accent:/^#[a-f0-9]{6}$/i.test(meta.accent||'')?meta.accent:'#a8bde5',issue:issue.number}];
    }catch{return [];}});
  }
  const api={FILE,HUB,reference,rawURL,parse,serialize,slug,issueURL,entries};root.PCStudioSharing=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
