export const initZenDesk = () => window.zE || (function (e, t, s) { 
  var n = window.zE = window.zEmbed = function () { n._.push(arguments); };
  var a = n.s = e.createElement(t), r = e.getElementsByTagName(t)[0]; 
  n.set = function (e) { n.set._.push(e); }; 
  n._ = [];
  n.set._ = [];
  a.async = true;
  a.setAttribute('charset', 'utf-8');
  a.src = 'https://static.zdassets.com/ekr/asset_composer.js?key=' + s;
  n.t = +new Date();
  a.type = 'text/javascript';
  r.parentNode.insertBefore(a, r); 
})(document, 'script', 'a65d5e9f-47c6-40c5-97e6-8d0f16721de2');

export const hideZenDesk = () => window.zE && window.zE.hide && window.zE.hide();
