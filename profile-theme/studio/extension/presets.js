(function(root){
  'use strict';
  const presets=[
    {id:'frost',name:'Frost',label:'Зимний лес / серебро',description:'Туман, медленный снег и тонкое свечение.',background:'forest',accent:'#d5e3ec',secondary:'#ffffff',font:'mono',frame:'frost',frameSpeed:14,snow:true},
    {id:'midnight',name:'Midnight',label:'Графит / холодный свет',description:'Спокойная тёмная тема с орбитальной рамкой.',background:'midnight',accent:'#a8bde5',secondary:'#e8edff',font:'system',frame:'orbit',frameSpeed:16,snow:false},
    {id:'neon',name:'Neon',label:'Фиолетовый / циан',description:'Светящиеся края и глубокий тёмный фон.',background:'neon',accent:'#b697ff',secondary:'#64eaff',font:'mono',frame:'neon',frameSpeed:8,snow:false},
    {id:'aurora',name:'Aurora',label:'Мята / северное сияние',description:'Плавное движение холодного зелёного света.',background:'aurora',accent:'#81e5bd',secondary:'#8daeff',font:'rounded',frame:'orbit',frameSpeed:20,snow:true},
    {id:'uikole',name:'uikole',label:'Розовый / тёплое золото',description:'Мягкая цветная палитра с тёплыми акцентами.',background:'uikole',accent:'#f0b5d6',secondary:'#f4d19d',font:'serif',frame:'pulse',frameSpeed:10,snow:false},
    {id:'ember',name:'Ember',label:'Уголь / янтарь',description:'Тёплый свет на почти чёрном фоне.',background:'ember',accent:'#efb178',secondary:'#f29c9c',font:'book',frame:'neon',frameSpeed:18,snow:false}
  ].map(p=>({...p,appearance:{motion:true,snow:p.snow,background:p.background,customBackground:'',accent:p.accent,secondary:p.secondary,font:p.font,customFont:'',fontName:'',frame:p.frame,frameSpeed:p.frameSpeed,avatarShape:'circle',dim:55,blur:0}}));
  root.PCWinterPresets=presets;if(typeof module!=='undefined')module.exports=presets;
})(globalThis);
