/*! arhat-client - v0.0.1 - 2016-01-26 */
/*
 * js-sha256 v0.3.0
 * https://github.com/emn178/js-sha256
 *
 * Copyright 2014-2015, emn178@gmail.com
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
;(function(root, undefined) {
  'use strict';

  var NODE_JS = typeof(module) != 'undefined';
  if(NODE_JS) {
    root = global;
  }
  var TYPED_ARRAY = typeof(Uint8Array) != 'undefined';
  var HEX_CHARS = '0123456789abcdef'.split('');
  var EXTRA = [-2147483648, 8388608, 32768, 128];
  var SHIFT = [24, 16, 8, 0];
  var K =[0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
          0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
          0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
          0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
          0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
          0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
          0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
          0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];

  var blocks = [];

  var sha224 = function(message) {
    return sha256(message, true);
  };

  var sha256 = function(message, is224) {
    var notString = typeof(message) != 'string';
    if(notString && message.constructor == root.ArrayBuffer) {
      message = new Uint8Array(message);
    }

    var h0, h1, h2, h3, h4, h5, h6, h7, block, code, first = true, end = false,
        i, j, index = 0, start = 0, bytes = 0, length = message.length,
        s0, s1, maj, t1, t2, ch, ab, da, cd, bc;

    if(is224) {
      h0 = 0xc1059ed8;
      h1 = 0x367cd507;
      h2 = 0x3070dd17;
      h3 = 0xf70e5939;
      h4 = 0xffc00b31;
      h5 = 0x68581511;
      h6 = 0x64f98fa7;
      h7 = 0xbefa4fa4;
    } else { // 256
      h0 = 0x6a09e667;
      h1 = 0xbb67ae85;
      h2 = 0x3c6ef372;
      h3 = 0xa54ff53a;
      h4 = 0x510e527f;
      h5 = 0x9b05688c;
      h6 = 0x1f83d9ab;
      h7 = 0x5be0cd19;
    }
    block = 0;
    do {
      blocks[0] = block;
      blocks[16] = blocks[1] = blocks[2] = blocks[3] =
      blocks[4] = blocks[5] = blocks[6] = blocks[7] =
      blocks[8] = blocks[9] = blocks[10] = blocks[11] =
      blocks[12] = blocks[13] = blocks[14] = blocks[15] = 0;
      if(notString) {
        for (i = start;index < length && i < 64; ++index) {
          blocks[i >> 2] |= message[index] << SHIFT[i++ & 3];
        }
      } else {
        for (i = start;index < length && i < 64; ++index) {
          code = message.charCodeAt(index);
          if (code < 0x80) {
            blocks[i >> 2] |= code << SHIFT[i++ & 3];
          } else if (code < 0x800) {
            blocks[i >> 2] |= (0xc0 | (code >> 6)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else if (code < 0xd800 || code >= 0xe000) {
            blocks[i >> 2] |= (0xe0 | (code >> 12)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          } else {
            code = 0x10000 + (((code & 0x3ff) << 10) | (message.charCodeAt(++index) & 0x3ff));
            blocks[i >> 2] |= (0xf0 | (code >> 18)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 12) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | ((code >> 6) & 0x3f)) << SHIFT[i++ & 3];
            blocks[i >> 2] |= (0x80 | (code & 0x3f)) << SHIFT[i++ & 3];
          }
        }
      }
      bytes += i - start;
      start = i - 64;
      if(index == length) {
        blocks[i >> 2] |= EXTRA[i & 3];
        ++index;
      }
      block = blocks[16];
      if(index > length && i < 56) {
        blocks[15] = bytes << 3;
        end = true;
      }

      var a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
      for(j = 16;j < 64;++j) {
        // rightrotate
        t1 = blocks[j - 15];
        s0 = ((t1 >>> 7) | (t1 << 25)) ^ ((t1 >>> 18) | (t1 << 14)) ^ (t1 >>> 3);
        t1 = blocks[j - 2];
        s1 = ((t1 >>> 17) | (t1 << 15)) ^ ((t1 >>> 19) | (t1 << 13)) ^ (t1 >>> 10);
        blocks[j] = blocks[j - 16] + s0 + blocks[j - 7] + s1 << 0;
      }

      bc = b & c;
      for(j = 0;j < 64;j += 4) {
        if(first) {
          if(is224) {
            ab = 300032;
            t1 = blocks[0] - 1413257819;
            h = t1 - 150054599 << 0;
            d = t1 + 24177077 << 0;
          } else {
            ab = 704751109;
            t1 = blocks[0] - 210244248;
            h = t1 - 1521486534 << 0;
            d = t1 + 143694565 << 0;
          }
          first = false;
        } else {
          s0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
          s1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
          ab = a & b;
          maj = ab ^ (a & c) ^ bc;
          ch = (e & f) ^ (~e & g);
          t1 = h + s1 + ch + K[j] + blocks[j];
          t2 = s0 + maj;
          h = d + t1 << 0;
          d = t1 + t2 << 0;
        }
        s0 = ((d >>> 2) | (d << 30)) ^ ((d >>> 13) | (d << 19)) ^ ((d >>> 22) | (d << 10));
        s1 = ((h >>> 6) | (h << 26)) ^ ((h >>> 11) | (h << 21)) ^ ((h >>> 25) | (h << 7));
        da = d & a;
        maj = da ^ (d & b) ^ ab;
        ch = (h & e) ^ (~h & f);
        t1 = g + s1 + ch + K[j + 1] + blocks[j + 1];
        t2 = s0 + maj;
        g = c + t1 << 0;
        c = t1 + t2 << 0;
        s0 = ((c >>> 2) | (c << 30)) ^ ((c >>> 13) | (c << 19)) ^ ((c >>> 22) | (c << 10));
        s1 = ((g >>> 6) | (g << 26)) ^ ((g >>> 11) | (g << 21)) ^ ((g >>> 25) | (g << 7));
        cd = c & d;
        maj = cd ^ (c & a) ^ da;
        ch = (g & h) ^ (~g & e);
        t1 = f + s1 + ch + K[j + 2] + blocks[j + 2];
        t2 = s0 + maj;
        f = b + t1 << 0;
        b = t1 + t2 << 0;
        s0 = ((b >>> 2) | (b << 30)) ^ ((b >>> 13) | (b << 19)) ^ ((b >>> 22) | (b << 10));
        s1 = ((f >>> 6) | (f << 26)) ^ ((f >>> 11) | (f << 21)) ^ ((f >>> 25) | (f << 7));
        bc = b & c;
        maj = bc ^ (b & d) ^ cd;
        ch = (f & g) ^ (~f & h);
        t1 = e + s1 + ch + K[j + 3] + blocks[j + 3];
        t2 = s0 + maj;
        e = a + t1 << 0;
        a = t1 + t2 << 0;
      }

      h0 = h0 + a << 0;
      h1 = h1 + b << 0;
      h2 = h2 + c << 0;
      h3 = h3 + d << 0;
      h4 = h4 + e << 0;
      h5 = h5 + f << 0;
      h6 = h6 + g << 0;
      h7 = h7 + h << 0;
    } while(!end);

    var hex = HEX_CHARS[(h0 >> 28) & 0x0F] + HEX_CHARS[(h0 >> 24) & 0x0F] +
              HEX_CHARS[(h0 >> 20) & 0x0F] + HEX_CHARS[(h0 >> 16) & 0x0F] +
              HEX_CHARS[(h0 >> 12) & 0x0F] + HEX_CHARS[(h0 >> 8) & 0x0F] +
              HEX_CHARS[(h0 >> 4) & 0x0F] + HEX_CHARS[h0 & 0x0F] +
              HEX_CHARS[(h1 >> 28) & 0x0F] + HEX_CHARS[(h1 >> 24) & 0x0F] +
              HEX_CHARS[(h1 >> 20) & 0x0F] + HEX_CHARS[(h1 >> 16) & 0x0F] +
              HEX_CHARS[(h1 >> 12) & 0x0F] + HEX_CHARS[(h1 >> 8) & 0x0F] +
              HEX_CHARS[(h1 >> 4) & 0x0F] + HEX_CHARS[h1 & 0x0F] +
              HEX_CHARS[(h2 >> 28) & 0x0F] + HEX_CHARS[(h2 >> 24) & 0x0F] +
              HEX_CHARS[(h2 >> 20) & 0x0F] + HEX_CHARS[(h2 >> 16) & 0x0F] +
              HEX_CHARS[(h2 >> 12) & 0x0F] + HEX_CHARS[(h2 >> 8) & 0x0F] +
              HEX_CHARS[(h2 >> 4) & 0x0F] + HEX_CHARS[h2 & 0x0F] +
              HEX_CHARS[(h3 >> 28) & 0x0F] + HEX_CHARS[(h3 >> 24) & 0x0F] +
              HEX_CHARS[(h3 >> 20) & 0x0F] + HEX_CHARS[(h3 >> 16) & 0x0F] +
              HEX_CHARS[(h3 >> 12) & 0x0F] + HEX_CHARS[(h3 >> 8) & 0x0F] +
              HEX_CHARS[(h3 >> 4) & 0x0F] + HEX_CHARS[h3 & 0x0F] +
              HEX_CHARS[(h4 >> 28) & 0x0F] + HEX_CHARS[(h4 >> 24) & 0x0F] +
              HEX_CHARS[(h4 >> 20) & 0x0F] + HEX_CHARS[(h4 >> 16) & 0x0F] +
              HEX_CHARS[(h4 >> 12) & 0x0F] + HEX_CHARS[(h4 >> 8) & 0x0F] +
              HEX_CHARS[(h4 >> 4) & 0x0F] + HEX_CHARS[h4 & 0x0F] +
              HEX_CHARS[(h5 >> 28) & 0x0F] + HEX_CHARS[(h5 >> 24) & 0x0F] +
              HEX_CHARS[(h5 >> 20) & 0x0F] + HEX_CHARS[(h5 >> 16) & 0x0F] +
              HEX_CHARS[(h5 >> 12) & 0x0F] + HEX_CHARS[(h5 >> 8) & 0x0F] +
              HEX_CHARS[(h5 >> 4) & 0x0F] + HEX_CHARS[h5 & 0x0F] +
              HEX_CHARS[(h6 >> 28) & 0x0F] + HEX_CHARS[(h6 >> 24) & 0x0F] +
              HEX_CHARS[(h6 >> 20) & 0x0F] + HEX_CHARS[(h6 >> 16) & 0x0F] +
              HEX_CHARS[(h6 >> 12) & 0x0F] + HEX_CHARS[(h6 >> 8) & 0x0F] +
              HEX_CHARS[(h6 >> 4) & 0x0F] + HEX_CHARS[h6 & 0x0F];
    if(!is224) {
      hex += HEX_CHARS[(h7 >> 28) & 0x0F] + HEX_CHARS[(h7 >> 24) & 0x0F] +
             HEX_CHARS[(h7 >> 20) & 0x0F] + HEX_CHARS[(h7 >> 16) & 0x0F] +
             HEX_CHARS[(h7 >> 12) & 0x0F] + HEX_CHARS[(h7 >> 8) & 0x0F] +
             HEX_CHARS[(h7 >> 4) & 0x0F] + HEX_CHARS[h7 & 0x0F];
    }
    return hex;
  };

  if(!root.JS_SHA256_TEST && NODE_JS) {
    sha256.sha256 = sha256;
    sha256.sha224 = sha224;
    module.exports = sha256;
  } else if(root) {
    root.sha256 = sha256;
    root.sha224 = sha224;
  }
}(this));

(function() {
    var root = this;
    var $ = root.$ || root.jQuery || root.Zepto || root.ender;
    if (!$)
        throw new Error('jQuery or Zepto or Ender is needed!');
    if (!_)
        throw new Error('Lodash or Underscore is needed!');

    var previousArhat = root.arhat;
    var arhat = root.arhat = {};
    arhat.noConflict = function() {
        root.arhat = previousArhat;
        return this;
    };

    arhat.codeName = 'jubo';
    arhat.domain = (root.location.protocol === 'file:' ? 'http://127.0.0.1'
            : (root.location.protocol + '//' + root.location.hostname))
            + ':' + (root.ARHAT_PORT ? root.ARHAT_PORT : 9000);
    arhat.baseUrl = arhat.domain + '/' + arhat.codeName;
    arhat._WTF_ = '(?)';
    arhat._DELIMITER_ = '::';

    var eventSplitter = /\s+/;
    var eventsApi = function(obj, action, name, rest) {
        if (!name)
            return true;

        if (typeof name === 'object') {
            for (key in name)
                obj[action].apply(obj, name[key].concat(rest));
            return false;
        }

        if (eventSplitter.test(name)) {
            var names = name.split(eventSplitter);
            for (var i = 0, l = names.length; i < l; ++i)
                obj[action].apply(obj, names[i].concat(rest));
            return false;
        }

        return true;
    };

    var triggerEvents = function(events, args) {
        var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
        switch (args.length) {
            case 0:
                while (++i < l)
                    (ev = events[i]).callback.call(ev.ctx);
                return;
            case 1:
                while (++i < l)
                    (ev = events[i]).callback.call(ev.ctx, a1);
                return;
            case 2:
                while (++i < l)
                    (ev = events[i]).callback.call(ev.ctx, a1, a2);
                return;
            case 3:
                while (++i < l)
                    (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
                return;
            default:
                while (++i < l)
                    (ev = events[i]).callback.apply(ev.ctx, args);
                return;
        }
    };

    var Events = arhat.Events = {
        on: function(name, callback, context) {
            if (!eventsApi(this, 'on', name, [callback, context]) || !callback)
                return this;
            this._events || (this._events = {});
            var events = this._events[name] || (this._events[name] = []);
            events.push({
                callback: callback,
                context: context,
                ctx: context || this
            });
            return this;
        },
        once: function(name, callback, context) {
            if (!eventsApi(this, 'once', name, [callback, context]) || !callback)
                return this;
            var self = this;
            var once = _.once(function() {
                self.off(name, once);
                callback.apply(this, arguments);
            });
            once._callback = callback;
            return this.on(name, once, context);
        },
        off: function(name, callback, context) {
            var retain, ev, events, names, i, l, j, k;
            if (!this._events || !eventsApi(this, 'off', name, [callback, context]))
                return this;
            if (!name && !callback && !context) {
                this._events = void 0;
                return this;
            }
            names = name ? [name] : _.keys(this._events);
            for (i = 0, l = names.length; i < l; i++) {
                name = names[i];
                if (events = this._events[name]) {
                    this._events[name] = retain = [];
                    if (callback || context) {
                        for (var j = 0, k = events.length; j < k; j++) {
                            ev = events[j];
                            if ((callback && callback !== ev.callback && callback !== ev.callback._callback)
                                    || (context && context !== ev.context))
                                retain.push(ev);
                        }
                    }
                    if (!retain.length)
                        delete this._events[name];
                }
            }
            return this;
        },
        trigger: function(name) {
            if (!this._events)
                return this;
            var args = Array.prototype.slice.call(arguments, 1);
            if (!eventsApi(this, 'trigger', name, args))
                return this;
            var events = this._events[name];
            var allEvents = this._events.all;
            if (events)
                triggerEvents(events, args);
            if (allEvents)
                triggerEvents(allEvents, arguments);
            return this;
        },
        stopListening: function(obj, name, callback) {
            var listeningTo = this._listeningTo;
            if (!listeningTo)
                return this;
            var remove = !name && !callback;
            if (!callback && typeof name === 'object')
                callback = this;
            if (obj)
                (listeningTo = {})[obj._listenId] = obj;
            for (id in listeningTo) {
                obj = listeningTo[id];
                obj.off(name, callback, this);
                if (remove || _.isEmpty(obj._events))
                    delete this._listeningTo[id];
            }
            return this;
        }
    };

    var listenMethods = {
        listenTo: 'on',
        listenToOnce: 'once'
    };
    _.forEach(listenMethods, function(implementation, method) {
        Events[method] = function(obj, name, callback) {
            var listeningTo = this._listeningTo || (this._listeningTo = {});
            var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
            listeningTo[id] = obj;
            if (!callback && typeof name === 'object')
                callback = this;
            obj[implementation](name, callback, this);
            return this;
        };
    });

    Events.bind = Events.on;
    Events.unbind = Events.off;

    _.assign(arhat, Events);
}).call(window);

(function() {
    var root = this;
    function throwError(jqXHR, textStatus, errorThrown) {
        throw new Error(textStatus + ': ' + errorThrown);
    }
    var HEADER_ACCESS_TOKEN = 'Arhat-AccessToken';
    var HEADER_TIMESTAMP = 'Arhat-Timestamp';
    var HEADER_SIGNATURE = 'Arhat-Signature';
    var HEADER_PRINCIPAL = "Arhat-Principal";
    function generateSecurityHeaders(method, uri) {
        var headers = {};
        if (root.ARHAT_PRINCIPAL)
            headers[HEADER_PRINCIPAL] = root.ARHAT_PRINCIPAL;
        var accessToken = arhat.ACCESS_TOKEN;
        if (accessToken && root.ARHAT_APP_ID) {
            headers[HEADER_ACCESS_TOKEN] = accessToken;
            var timestamp = '' + (new Date).getTime();
            headers[HEADER_TIMESTAMP] = timestamp;
            uri = uri.replace(arhat.domain, '');
            if (uri.charAt(uri.length - 1) == '/')
                uri = uri.substring(0, uri.length - 1);
            headers[HEADER_SIGNATURE] = sha256(ARHAT_APP_ID + ':' + accessToken + '@' + timestamp
                    + '\r\n' + method.toUpperCase() + ' ' + uri);
            return headers;
        }
        return root.ARHAT_PRINCIPAL ? headers : null;
    }
    function GET(url, settings) {
        var req = {
            method: 'GET',
            dataType: 'json',
            data: settings.params,
            success: settings.success,
            error: settings.error || throwError
        };
        if (settings.headers)
            req.headers = settings.headers;
        else {
            var headers = generateSecurityHeaders('GET', url);
            if (headers)
                req.headers = headers;
        }
        if (/msie/.test(navigator.userAgent.toLowerCase()))
            req.cache = false;
        $.ajax(url, req);
    }
    function POST(url, data, success, error) {
        $.ajax(url, {
            method: 'POST',
            contentType: 'application/json; charset=UTF-8',
            dataType: 'json',
            headers: generateSecurityHeaders('POST', url),
            data: JSON.stringify(data),
            success: success,
            error: error || throwError
        });
    }
    function PUT(url, settings) {
        var req = {
            method: 'PUT',
            dataType: 'json',
            headers: generateSecurityHeaders('PUT', url),
            error: throwError
        };
        if (settings) {
            if (settings.data) {
                req.contentType = 'application/json; charset=UTF-8';
                req.data = JSON.stringify(settings.data);
            }
            if (settings.success)
                req.success = settings.success;
            if (settings.error)
                req.error = settings.error;
        }
        $.ajax(url, req);
    }
    function DELETE(url, success, error) {
        $.ajax(url, {
            method: 'DELETE',
            headers: generateSecurityHeaders('DELETE', url),
            success: success,
            error: error || throwError
        });
    }
    function _directGet_(success, error) {
        GET(this.baseUrl, {
            success: success,
            error: error
        });
    }
    function _directDelete_(success, error) {
        DELETE(this.baseUrl, success, error);
    }
    function guardTimestampRange(range) {
        for (var i = 0; i < range.length; ++i) {
            var value = range[i];
            range[i] = (typeof value === 'number' ? value : (_.isFunction(value.getTime) ? value
                    .getTime() : (typeof value === 'string' ? parseInt(value) : 0)));
        }
        return range;
    }

    function initAllAPI() {
        arhat._cache_ = {};
        arhat._heartbeatHandlers_ = {};
        function wrapSuccessCallback(success) {
            return _.wrap(success, function(func, data) {
                var tid = data.tableId, vid = data.viewId;
                var key = tid + '/' + vid;
                if (typeof arhat._heartbeatHandlers_[key] === 'undefined')
                    arhat._heartbeatHandlers_[key] = setInterval(function() {
                        arhat.table(tid).view(vid).heartbeat();
                    }, arhat.timeout * 0.8);
                _.isFunction(func) && func(data);
            });
        }
        function clearHeartbeatIntervalBeforeDestroy(success, error) {
            var isTableDestroy = !this.viewId;
            var keyPrefix = this.tableId + '/';
            var stoped = false;
            if (isTableDestroy) {
                for (key in arhat._heartbeatHandlers_)
                    if (key.startsWith(keyPrefix))
                        stoped = stopHeartbeat(key) || stoped;
                if (stoped)
                    delete arhat._cache_[this.tableId];
            } else {
                var key = keyPrefix + this.viewId;
                stoped = stopHeartbeat(key);
                if (stoped)
                    delete arhat._cache_[key];
                keyPrefix = key + '/';
            }
            if (stoped) {
                _directDelete_.call(this, success, error);
                for (k in arhat._cache_)
                    if (k.startsWith(keyPrefix))
                        delete arhat._cache_[k];
            }
        }
        function stopHeartbeat(key) {
            var handler = arhat._heartbeatHandlers_[key];
            if (typeof handler === 'number') {
                clearInterval(handler);
                delete arhat._heartbeatHandlers_[key];
                return true;
            }
            return false;
        }
        var escaped = {
            '/': encodeURIComponent('/'),
            '?': encodeURIComponent('?'),
            '#': encodeURIComponent('#')
        }
        function escapeSegement(segment) {
           var s = encodeURI(segment);
           var buf = new Array(s.length);
           for (var i = 0; i < s.length; ++i) {
               var c = s.charAt(i);
               buf[i] = (escaped[c] ? escaped[c] : c)
           }
           return buf.join('')
        }
        arhat.tables = {
            baseUrl: arhat.baseUrl + '/tables',
            getIds: _directGet_,
            create: function(datasource, success, error) {
                if (typeof datasource === 'string')
                    datasource = {
                        uri: datasource
                    };
                POST(this.baseUrl, datasource, wrapSuccessCallback(success), error);
            }
        };
        arhat.table = function(tableId) {
            if (typeof arhat._cache_[tableId] === 'object')
                return arhat._cache_[tableId];

            var tableApiBaseUrl = arhat.tables.baseUrl + '/' + escapeSegement(tableId);
            var tableApi = {
                baseUrl: tableApiBaseUrl,
                tableId: tableId,
                get: _directGet_,
                destroy: clearHeartbeatIntervalBeforeDestroy,
                views: {
                    baseUrl: tableApiBaseUrl + '/views',
                    getIds: _directGet_,
                    create: function(viewSettings, success, error) {
                        if (!viewSettings)
                            viewSettings = {};
                        POST(this.baseUrl, viewSettings, wrapSuccessCallback(success), error);
                    }
                }
            };
            function createViewApi(baseUrl) {
                return {
                    get: _directGet_,
                    destroy: clearHeartbeatIntervalBeforeDestroy,
                    fields: {
                        baseUrl: baseUrl + '/fields',
                        get: _directGet_
                    },
                    field: function(fieldNameOrCol) {
                        return {
                            baseUrl: this.fields.baseUrl + '/' + escapeSegement(fieldNameOrCol),
                            get: _directGet_
                        };
                    },
                    // params: {orderBy: "xxx", reverse: false, skip: 0, limit: 20}
                    selections: function(params, success, error) {
                        GET(this.baseUrl + '/selections', {
                            params: params,
                            success: success,
                            error: error
                        });
                    },
                    reset: function(success, error) {
                        PUT(this.baseUrl + '/reset', {
                            success: success,
                            error: error
                        });
                    },
                    heartbeat: function() {
                        PUT(this.baseUrl + '/heartbeat');
                    },
                    // options: { groupId: 'xxx', from: [0, 1], to: [3, 5], frameSize: 24}
                    play: function(options, success, error) {
                        guardTimestampRange(options.from);
                        guardTimestampRange(options.to);
                        POST(this.baseUrl + '/play', options, success, error);
                    }
                };
            }
            function createGroupApi(baseUrl) {
                return function(groupId) {
                    var viewId = (this.viewId ? this.viewId : '_DEFAULT_');
                    var key = tableId + '/' + viewId + '/' + groupId;
                    if (typeof arhat._cache_[key] === 'object')
                        return arhat._cache_[key];

                    var groupApiBaseUrl = this.baseUrl + '/groups/' + escapeSegement(groupId);
                    return arhat._cache_[key] = {
                        baseUrl: groupApiBaseUrl,
                        tableId: tableId,
                        viewId: viewId,
                        groupId: groupId,
                        get: _directGet_,
                        destroy: _directDelete_,
                        selectExact: function(keys, success, error) {
                            PUT(this.baseUrl + '/selectExact', {
                                data: keys,
                                success: success,
                                error: error
                            });
                        },
                        selectRange: function(fromToKey, success, error) {
                            PUT(this.baseUrl + '/selectRange', {
                                data: fromToKey,
                                success: success,
                                error: error
                            });
                        },
                        selectAll: function(success, error) {
                            PUT(this.baseUrl + '/selectAll', {
                                success: success,
                                error: error
                            });
                        },
                        reduces: {
                            baseUrl: groupApiBaseUrl + '/reduces',
                            getNames: _directGet_,
                            create: function(reduceSettings, success, error) {
                                POST(this.baseUrl, reduceSettings, success, error);
                            }
                        },
                        reduce: function(reduceName) {
                            var key = tableId + '/' + viewId + '/' + groupId + '/' + reduceName;
                            if (typeof arhat._cache_[key] === 'object')
                                return arhat._cache_[key];

                            return arhat._cache_[key] = {
                                baseUrl: this.baseUrl + '/reduces/' + escapeSegement(reduceName),
                                tableId: tableId,
                                viewId: viewId,
                                groupId: groupId,
                                reduceName: reduceName,
                                get: _directGet_,
                                destroy: _directDelete_
                            };
                        },
                        groups: createGroupsApi(groupApiBaseUrl),
                        group: createGroupApi(groupApiBaseUrl)
                    };
                };
            }
            function createGroupsApi(baseUrl) {
                return {
                    baseUrl: baseUrl + '/groups',
                    getIds: _directGet_,
                    create: function(groupSettings, success, error) {
                        POST(this.baseUrl, groupSettings, success, error);
                    }
                };
            }
            function installViewAndGroupsApi(src, scopedBaseUrl) {
                var api = _.assign(src, createViewApi(scopedBaseUrl));
                api.groups = createGroupsApi(scopedBaseUrl);
                api.group = createGroupApi(scopedBaseUrl);
                return api;
            }
            tableApi.view = function(viewId) {
                var key = tableId + '/' + viewId;
                if (typeof arhat._cache_[key] === 'object')
                    return arhat._cache_[key];

                var baseUrl = this.views.baseUrl + '/' + escapeSegement(viewId);
                return arhat._cache_[key] = installViewAndGroupsApi({
                    baseUrl: baseUrl,
                    viewId: viewId,
                    tableId: tableId
                }, baseUrl);
            };
            return arhat._cache_[tableId] = installViewAndGroupsApi(tableApi, tableApi.baseUrl);
        };
        function constantialize(array) {
            _.forEach(array, function(v) {
                array[v] = v;
            });
        }
        arhat.GroupTypes = ['ALL', 'DIVIDES', 'IDENTITY', 'TIMESTAMP'];
        constantialize(arhat.GroupTypes);
        arhat.ValueTypes = ['TEXT', 'NUMBER', 'TIMESTAMP', 'BOOLEAN'];
        constantialize(arhat.ValueTypes);
        arhat.TimestampPrecisions = ['MILLI', 'SECOND', 'MINUTE', 'HOUR', 'DAY', 'WEEK', 'MONTH',
                'QUARTER', 'YEAR', 'DECADE', 'CENTURY'];
        constantialize(arhat.TimestampPrecisions);
        arhat.NumberPrecisions = ['BYTE', 'SHORT', 'CHAR', 'INT', 'LONG', 'BIGINT', 'FLOAT',
                'DOUBLE', 'BIGDECIMAL'];
        constantialize(arhat.NumberPrecisions);
        arhat.ReduceTypes = ['Count', 'CountPct', 'Sum', 'SumPct', 'Mean', 'Mode', 'Min', 'Max',
                'MidRange', 'Min90th', 'Max90th', 'Median', 'Var', 'VarP', 'Stdev', 'StdevP'];
        constantialize(arhat.ReduceTypes);
        arhat.constants = function() {
            var scope = {};
            _.forEach([arhat.GroupTypes, arhat.ValueTypes, arhat.TimestampPrecisions,
                    arhat.NumberPrecisions, arhat.ReduceTypes], function(array) {
                _.forEach(array, function(v) {
                    scope[v] = v;
                });
            });
            return scope;
        };
    }

    if (!arhat.tables) {
        arhat.trigger('loading');
        GET(arhat.baseUrl, {
            headers: (root.ARHAT_APP_ID ? {
                'Arhat-AppId': root.ARHAT_APP_ID
            } : undefined),
            success: function(data, textStatus, request) {
                arhat.ACCESS_TOKEN = request.getResponseHeader(HEADER_ACCESS_TOKEN);
                arhat.contextName = data.context_name;
                arhat.version = data.version;
                arhat.buildTime = new Date(data.build_time);
                arhat.timeout = data.timeout;
                if (arhat.codeName === data.code_name) {
                    initAllAPI();
                    arhat.trigger('success');
                } else
                    arhat.trigger('error');
                arhat.trigger('complete');
            },
            error: function() {
                arhat.trigger('error');
                arhat.trigger('complete');
            }
        });
    }
}).call(window);
