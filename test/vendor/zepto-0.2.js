var Zepto = (function() {
  var slice=[].slice, d=document,
    ADJ_OPS={append: 'beforeEnd', prepend: 'afterBegin', before: 'beforeBegin', after: 'afterEnd'},
    e, k, css, un, $$;

  // fix for iOS 3.2
  if(String.prototype.trim === un)
    String.prototype.trim = function(){ return this.replace(/^\s+/, '').replace(/\s+$/, '') };

  function classRE(name){ return new RegExp("(^|\\s)"+name+"(\\s|$)") }
  function compact(array){ return array.filter(function(el){ return el !== un && el !== null }) }

  function Z(dom, _){ this.dom = dom || []; this.selector = _ || '' }
  Z.prototype = $.fn;

  function $(_, context){
    return _ == d ? new Z : (context !== un) ? $(context).find(_) : new Z(compact(_ instanceof Z ? _.dom : (_ instanceof Array ? _ : (_ instanceof Element || _ === window ? [_] : $$(d, _)))), _);
  }

  $.extend = function(target, src){ for(k in src) target[k] = src[k] }
  $.qsa = $$ = function(el, selector){ return slice.call(el.querySelectorAll(selector)) }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }

  $.fn = {
    ready: function(callback){
      d.addEventListener('DOMContentLoaded', callback, false); return this;
    },
    compact: function(){ this.dom=compact(this.dom); return this },
    get: function(idx){ return idx === un ? this.dom : this.dom[idx] },
    remove: function(){
      return this.each(function(el){ el.parentNode.removeChild(el) });
    },
    each: function(callback){ this.dom.forEach(callback); return this },
    filter: function(selector){
      return $(this.dom.filter(function(el){ return $$(el.parentNode, selector).indexOf(el)>=0; }));
    },
    is: function(selector){
      return this.dom.length>0 && $(this.dom[0]).filter(selector).dom.length>0;
    },
    first: function(callback){ this.dom=compact([this.dom[0]]); return this },
    find: function(selector){
      return $(this.dom.map(function(el){ return $$(el, selector) }).reduce(function(a,b){ return a.concat(b) }, []));
    },
    closest: function(selector){
      var el = this.dom[0].parentNode, nodes = $$(d, selector);
      while(el && nodes.indexOf(el)<0) el = el.parentNode;
      return $(el && !(el===d) ? el : []);
    },
    pluck: function(property){ return this.dom.map(function(el){ return el[property] }) },
    show: function(){ return this.css('display', 'block') },
    hide: function(){ return this.css('display', 'none') },
    prev: function(){ return $(this.pluck('previousElementSibling')) },
    next: function(){ return $(this.pluck('nextElementSibling')) },
    html: function(html){
      return html === un ?
        (this.dom.length>0 ? this.dom[0].innerHTML : null) :
        this.each(function(el){ el.innerHTML = html });
    },
    text: function(text){
      return text === un ?
        (this.dom.length>0 ? this.dom[0].innerText : null) :
        this.each(function(el){ el.innerText = text });
    },
    attr: function(name,value){
      return (typeof name == 'string' && value === un) ?
        (this.dom.length>0 ? this.dom[0].getAttribute(name) || undefined : null) :
        this.each(function(el){
          if (typeof name == 'object') for(k in name) el.setAttribute(k, name[k])
          else el.setAttribute(name,value);
        });
    },
    offset: function(){
      var obj = this.dom[0].getBoundingClientRect();
      return { left: obj.left+d.body.scrollLeft, top: obj.top+d.body.scrollTop, width: obj.width, height: obj.height };
    },
    css: function(prop, value){
      if(value === un && typeof prop == 'string') return this.dom[0].style[camelize(prop)];
      css=""; for(k in prop) css += k+':'+prop[k]+';';
      if(typeof prop == 'string') css = prop+":"+value;
      return this.each(function(el) { el.style.cssText += ';' + css });
    },
    index: function(el){
      return this.dom.indexOf($(el).get(0));
    },
    hasClass: function(name){
      return classRE(name).test(this.dom[0].className);
    },
    addClass: function(name){
      return this.each(function(el){ !$(el).hasClass(name) && (el.className += (el.className ? ' ' : '') + name) });
    },
    removeClass: function(name){
      return this.each(function(el){ el.className = el.className.replace(classRE(name), ' ').trim() });
    }
  };

  ['width','height'].forEach(function(m){ $.fn[m] = function(){ return this.offset()[m] }});

  for(k in ADJ_OPS)
    $.fn[k] = (function(op){
      return function(html){ return this.each(function(el){
        el['insertAdjacent' + (html instanceof Element ? 'Element' : 'HTML')](op,html)
      })};
    })(ADJ_OPS[k]);

  Z.prototype = $.fn;

  return $;
})();

'$' in window||(window.$=Zepto);
(function($){
  var d=document, $$=$.qsa, handlers=[];
  function find(el, ev, fn) {
    return handlers.filter(function(handler){
      return handler && handler.el===el && (!ev || handler.ev===ev) && (!fn || handler.fn===fn);
    });
  }
  $.event = {
    add: function(el, events, fn){
      events.split(/\s/).forEach(function(ev){
        var handler = {ev: ev, el: el, fn: fn, i: handlers.length};
        handlers.push(handler);
        el.addEventListener(ev, fn, false);
      });
    },
    remove: function(el, events, fn){
      (events||'').split(/\s/).forEach(function(ev){
        find(el, ev, fn).forEach(function(handler){
          handlers[handler.i] = null;
          el.removeEventListener(handler.ev, handler.fn, false);
        });
      });
    }
  };
  $.fn.bind = function(event, callback){
    return this.each(function(el){ $.event.add(el, event, callback) });
  };
  $.fn.unbind = function(event, callback){
    return this.each(function(el){ $.event.remove(el, event, callback) });
  };
  $.fn.delegate = function(selector, event, callback){
    return this.each(function(el){
      $.event.add(el, event, function(event){
        var target = event.target, nodes = $$(el, selector);
        while(target && nodes.indexOf(target)<0) target = target.parentNode;
        if(target && !(target===el) && !(target===d)) callback.call(target, event);
      }, false);
    });
  };
  $.fn.live = function(event, callback){
    $(d.body).delegate(this.selector, event, callback); return this;
  };
  $.fn.trigger = function(event){
    return this.each(function(el){ var e; el.dispatchEvent(e = d.createEvent('Events'), e.initEvent(event, true, false)) });
  };
})(Zepto);
(function($){
  function detect(ua){
    var ua = ua, os = {},
      android = ua.match(/(Android)\s+([\d.]+)/),
      iphone = ua.match(/(iPhone\sOS)\s([\d_]+)/),
      ipad = ua.match(/(iPad).*OS\s([\d_]+)/),
      webos = ua.match(/(webOS)\/([\d.]+)/);
    if(android) os.android = true, os.version = android[2];
    if(iphone) os.ios = true, os.version = iphone[2].replace(/_/g,'.'), os.iphone = true;
    if(ipad) os.ios = true, os.version = ipad[2].replace(/_/g,'.'), os.ipad = true;
    if(webos) os.webos = true, os.version = webos[2];
    return os;
  }
  $.os = detect(navigator.userAgent);
  $.__detect = detect;
  $.browser = {
    webkit: true,
    version: navigator.userAgent.match(/WebKit\/([\d.]+)/)[1]
  }
})(Zepto);
(function($){
  $.fn.anim = function(props, dur, ease){
    var transforms = [], opacity, k;
    for (k in props) k === 'opacity' ? opacity=props[k] : transforms.push(k+'('+props[k]+')');
    return this.css({ '-webkit-transition': 'all '+(dur||0.5)+'s '+(ease||''),
      '-webkit-transform': transforms.join(' '), opacity: opacity });
  }
})(Zepto);
(function($){
  var touch={}, touchTimeout;

  function parentIfText(node){
    return 'tagName' in node ? node : node.parentNode;
  }

  $(document).ready(function(){
    $(document.body).bind('touchstart', function(e){
      var now = Date.now(), delta = now-(touch.last || now);
      touch.target = parentIfText(e.touches[0].target);
      touchTimeout && clearTimeout(touchTimeout);
      touch.x1 = e.touches[0].pageX;
      if (delta > 0 && delta <= 250) touch.isDoubleTap = true;
      touch.last = now;
    }).bind('touchmove', function(e){
      touch.x2 = e.touches[0].pageX
    }).bind('touchend', function(e){
      if (touch.isDoubleTap) {
        $(touch.target).trigger('doubleTap');
        touch = {};
      } else if (touch.x2 > 0) {
        Math.abs(touch.x1-touch.x2)>30 && $(touch.target).trigger('swipe');
        touch.x1 = touch.x2 = touch.last = 0;
      } else if ('last' in touch) {
        touchTimeout = setTimeout(function(){
          touchTimeout = null;
          $(touch.target).trigger('tap')
          touch = {};
        }, 250);
      }
    }).bind('touchcancel', function(){ touch={} });
  });

  ['swipe', 'doubleTap', 'tap'].forEach(function(m){
    $.fn[m] = function(callback){ return this.bind(m, callback) }
  });
})(Zepto);
(function($){
  function ajax(method, url, success, data, type){
    data = data || null;
    var r = new XMLHttpRequest();
    if (success instanceof Function) {
      r.onreadystatechange = function(){
        if(r.readyState==4 && (r.status==200 || r.status==0))
          success(r.responseText);
      };
    }
    r.open(method,url,true);
    if (type) r.setRequestHeader("Accept", type );
    if (data instanceof Object) data = JSON.stringify(data), r.setRequestHeader('Content-Type','application/json');
    r.setRequestHeader('X-Requested-With','XMLHttpRequest');
    r.send(data);
  }

  $.get = function(url, success){ ajax('GET', url, success); };
  $.post = function(url, data, success, type){
    if (data instanceof Function) type = type || success, success = data, data = null;
    ajax('POST', url, success, data, type);
  };
  $.getJSON = function(url, success){
    $.get(url, function(json){ success(JSON.parse(json)) });
  };

  $.fn.load = function(url, success){
    var self = this, parts = url.split(/\s/), selector;
    if(!this.dom.length) return this;
    if(parts.length>1) url = parts[0], selector = parts[1];
    $.get(url, function(response){
      self.html(selector ?
        $(document.createElement('div')).html(response).find(selector).html()
        : response);
      success && success();
    });
    return this;
  };
})(Zepto);
(function($){
  var cache = [], timeout;

  $.fn.remove = function(){
    return this.each(function(el){
      if(el.tagName=='IMG'){
        cache.push(el);
        el.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        if(timeout) clearTimeout(timeout);
        timeout = setTimeout(function(){ cache = [] }, 60000);
      }
      el.parentNode.removeChild(el);
    });
  }
})(Zepto);
