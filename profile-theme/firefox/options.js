(function (root) {
  'use strict';
  const keys = ['enabled','motion','snow','background','customBackground','accent','font'];
  const fonts = {system:'"Segoe UI",system-ui,sans-serif',mono:'Consolas,"Courier New",monospace',serif:'Georgia,"Times New Roman",serif'};
  function normalize(input = {}, motion = true) {
    const bool = (key, fallback) => typeof input[key] === 'boolean' ? input[key] : fallback;
    const custom = typeof input.customBackground === 'string' && input.customBackground.length <= 7000000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.customBackground) ? input.customBackground : '';
    return {enabled:bool('enabled',true),motion:bool('motion',motion),snow:bool('snow',true),
      background:['forest','lake','custom'].includes(input.background) ? input.background : 'forest',
      customBackground:custom,accent:/^#[0-9a-f]{6}$/i.test(input.accent || '') ? input.accent : '#d0e0ed',
      font:Object.hasOwn(fonts,input.font) ? input.font : 'system'};
  }
  root.PCWinterOptions = {keys,fonts,normalize};
  if (typeof module !== 'undefined') module.exports = {keys,fonts,normalize};
})(globalThis);
