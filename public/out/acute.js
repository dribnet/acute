var CLOSURE_NO_DEPS = true;
var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(opt_returnValue, var_args) {
  return opt_returnValue
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    if(ctor.instance_) {
      return ctor.instance_
    }
    if(goog.DEBUG) {
      goog.instantiatedSingletons_[goog.instantiatedSingletons_.length] = ctor
    }
    return ctor.instance_ = new ctor
  }
};
goog.instantiatedSingletons_ = [];
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = typeof val;
  return type == "object" && val != null || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.urlEncode = function(str) {
  return encodeURIComponent(String(str))
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.countOf = function(s, ss) {
  return s && ss ? s.split(ss).length - 1 : 0
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCase = function(str) {
  return String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
};
goog.string.toSelectorCase = function(str) {
  return String(str).replace(/([A-Z])/g, "-$1").toLowerCase()
};
goog.string.toTitleCase = function(str, opt_delimiters) {
  var delimiters = goog.isString(opt_delimiters) ? goog.string.regExpEscape(opt_delimiters) : "\\s";
  delimiters = delimiters ? "|[" + delimiters + "]+" : "";
  var regexp = new RegExp("(^" + delimiters + ")([a-z])", "g");
  return str.replace(regexp, function(all, p1, p2) {
    return p1 + p2.toUpperCase()
  })
};
goog.string.parseInt = function(value) {
  if(isFinite(value)) {
    value = String(value)
  }
  if(goog.isString(value)) {
    return/^\s*-?0x/i.test(value) ? parseInt(value, 16) : parseInt(value, 10)
  }
  return NaN
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  if(Error.captureStackTrace) {
    Error.captureStackTrace(this, goog.debug.Error)
  }else {
    this.stack = (new Error).stack || ""
  }
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
  return value
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.toArray = function(object) {
  var length = object.length;
  if(length > 0) {
    var rv = new Array(length);
    for(var i = 0;i < length;i++) {
      rv[i] = object[i]
    }
    return rv
  }
  return[]
};
goog.array.clone = goog.array.toArray;
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.string.StringBuffer");
goog.string.StringBuffer = function(opt_a1, var_args) {
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.buffer_ = "";
goog.string.StringBuffer.prototype.set = function(s) {
  this.buffer_ = "" + s
};
goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
  this.buffer_ += a1;
  if(opt_a2 != null) {
    for(var i = 1;i < arguments.length;i++) {
      this.buffer_ += arguments[i]
    }
  }
  return this
};
goog.string.StringBuffer.prototype.clear = function() {
  this.buffer_ = ""
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.buffer_.length
};
goog.string.StringBuffer.prototype.toString = function() {
  return this.buffer_
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__$1 = x == null ? null : x;
  if(p[goog.typeOf(x__$1)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__2819__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__2819 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2819__delegate.call(this, array, i, idxs)
    };
    G__2819.cljs$lang$maxFixedArity = 2;
    G__2819.cljs$lang$applyTo = function(arglist__2820) {
      var array = cljs.core.first(arglist__2820);
      var i = cljs.core.first(cljs.core.next(arglist__2820));
      var idxs = cljs.core.rest(cljs.core.next(arglist__2820));
      return G__2819__delegate(array, i, idxs)
    };
    G__2819.cljs$lang$arity$variadic = G__2819__delegate;
    return G__2819
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.Fn = {};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto__ = this$;
      if(and__3822__auto__) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto__
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2390__auto__ = this$ == null ? null : this$;
      return function() {
        var or__3824__auto__ = cljs.core._invoke[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._invoke["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._count[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._count["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._empty[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._empty["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._conj[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._conj["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto__ = coll;
      if(and__3822__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2390__auto__ = coll == null ? null : coll;
      return function() {
        var or__3824__auto__ = cljs.core._nth[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._nth["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto__ = coll;
      if(and__3822__auto__) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto__
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2390__auto__ = coll == null ? null : coll;
      return function() {
        var or__3824__auto__ = cljs.core._nth[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._nth["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._first[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._first["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._rest[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._rest["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._next[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._next["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto__ = o;
      if(and__3822__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2390__auto__ = o == null ? null : o;
      return function() {
        var or__3824__auto__ = cljs.core._lookup[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._lookup["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto__ = o;
      if(and__3822__auto__) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto__
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2390__auto__ = o == null ? null : o;
      return function() {
        var or__3824__auto__ = cljs.core._lookup[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._lookup["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._contains_key_QMARK_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._assoc[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._assoc["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._dissoc[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._dissoc["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._key[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._key["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._val[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._val["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._disjoin[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._disjoin["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._peek[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._peek["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._pop[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._pop["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._assoc_n[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._assoc_n["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._deref[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._deref["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._deref_with_timeout[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._meta[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._meta["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._with_meta[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._with_meta["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto__ = coll;
      if(and__3822__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2390__auto__ = coll == null ? null : coll;
      return function() {
        var or__3824__auto__ = cljs.core._reduce[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._reduce["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto__ = coll;
      if(and__3822__auto__) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto__
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2390__auto__ = coll == null ? null : coll;
      return function() {
        var or__3824__auto__ = cljs.core._reduce[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._reduce["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._kv_reduce[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._equiv[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._equiv["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._hash[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._hash["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._seq[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._seq["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._rseq[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._rseq["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._sorted_seq[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._sorted_seq_from[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._entry_key[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._entry_key["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._comparator[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._comparator["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._pr_seq[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._pr_seq["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IWriter = {};
cljs.core._write = function _write(writer, s) {
  if(function() {
    var and__3822__auto__ = writer;
    if(and__3822__auto__) {
      return writer.cljs$core$IWriter$_write$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_write$arity$2(writer, s)
  }else {
    var x__2390__auto__ = writer == null ? null : writer;
    return function() {
      var or__3824__auto__ = cljs.core._write[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._write["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-write", writer);
        }
      }
    }().call(null, writer, s)
  }
};
cljs.core._flush = function _flush(writer) {
  if(function() {
    var and__3822__auto__ = writer;
    if(and__3822__auto__) {
      return writer.cljs$core$IWriter$_flush$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return writer.cljs$core$IWriter$_flush$arity$1(writer)
  }else {
    var x__2390__auto__ = writer == null ? null : writer;
    return function() {
      var or__3824__auto__ = cljs.core._flush[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._flush["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWriter.-flush", writer);
        }
      }
    }().call(null, writer)
  }
};
cljs.core.IPrintWithWriter = {};
cljs.core._pr_writer = function _pr_writer(o, writer, opts) {
  if(function() {
    var and__3822__auto__ = o;
    if(and__3822__auto__) {
      return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return o.cljs$core$IPrintWithWriter$_pr_writer$arity$3(o, writer, opts)
  }else {
    var x__2390__auto__ = o == null ? null : o;
    return function() {
      var or__3824__auto__ = cljs.core._pr_writer[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._pr_writer["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintWithWriter.-pr-writer", o);
        }
      }
    }().call(null, o, writer, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto__ = d;
    if(and__3822__auto__) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2390__auto__ = d == null ? null : d;
    return function() {
      var or__3824__auto__ = cljs.core._realized_QMARK_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto__ = this$;
    if(and__3822__auto__) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2390__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3824__auto__ = cljs.core._notify_watches[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._notify_watches["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto__ = this$;
    if(and__3822__auto__) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2390__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3824__auto__ = cljs.core._add_watch[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._add_watch["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto__ = this$;
    if(and__3822__auto__) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2390__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3824__auto__ = cljs.core._remove_watch[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._remove_watch["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._as_transient[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._as_transient["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._conj_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._persistent_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._assoc_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._dissoc_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._assoc_n_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._pop_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto__ = tcoll;
    if(and__3822__auto__) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2390__auto__ = tcoll == null ? null : tcoll;
    return function() {
      var or__3824__auto__ = cljs.core._disjoin_BANG_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3822__auto__ = x;
    if(and__3822__auto__) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2390__auto__ = x == null ? null : x;
    return function() {
      var or__3824__auto__ = cljs.core._compare[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._compare["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._drop_first[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._drop_first["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._chunked_first[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._chunked_first["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._chunked_rest[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._chunked_rest["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3822__auto__ = coll;
    if(and__3822__auto__) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2390__auto__ = coll == null ? null : coll;
    return function() {
      var or__3824__auto__ = cljs.core._chunked_next[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._chunked_next["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__2822 = coll;
      if(G__2822) {
        if(function() {
          var or__3824__auto__ = G__2822.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__2822.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__2822.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__2822)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__2822)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__2824 = coll;
      if(G__2824) {
        if(function() {
          var or__3824__auto__ = G__2824.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__2824.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__2824.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__2824)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__2824)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(s == null) {
        return null
      }else {
        return cljs.core._first.call(null, s)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__2826 = coll;
      if(G__2826) {
        if(function() {
          var or__3824__auto__ = G__2826.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__2826.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__2826.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__2826)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__2826)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s = cljs.core.seq.call(null, coll);
      if(!(s == null)) {
        return cljs.core._rest.call(null, s)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__2828 = coll;
      if(G__2828) {
        if(function() {
          var or__3824__auto__ = G__2828.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__2828.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__2828.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__2828)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__2828)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto__ = x === y;
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__2829__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__2830 = y;
            var G__2831 = cljs.core.first.call(null, more);
            var G__2832 = cljs.core.next.call(null, more);
            x = G__2830;
            y = G__2831;
            more = G__2832;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__2829 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2829__delegate.call(this, x, y, more)
    };
    G__2829.cljs$lang$maxFixedArity = 2;
    G__2829.cljs$lang$applyTo = function(arglist__2833) {
      var x = cljs.core.first(arglist__2833);
      var y = cljs.core.first(cljs.core.next(arglist__2833));
      var more = cljs.core.rest(cljs.core.next(arglist__2833));
      return G__2829__delegate(x, y, more)
    };
    G__2829.cljs$lang$arity$variadic = G__2829__delegate;
    return G__2829
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__2834 = null;
  var G__2834__2 = function(o, k) {
    return null
  };
  var G__2834__3 = function(o, k, not_found) {
    return not_found
  };
  G__2834 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__2834__2.call(this, o, k);
      case 3:
        return G__2834__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__2834
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.IPrintWithWriter["null"] = true;
cljs.core._pr_writer["null"] = function(o, writer, _) {
  return cljs.core._write.call(null, writer, "nil")
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__2835 = null;
  var G__2835__2 = function(_, f) {
    return f.call(null)
  };
  var G__2835__3 = function(_, f, start) {
    return start
  };
  G__2835 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__2835__2.call(this, _, f);
      case 3:
        return G__2835__3.call(this, _, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__2835
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__2836 = null;
  var G__2836__2 = function(_, n) {
    return null
  };
  var G__2836__3 = function(_, n, not_found) {
    return not_found
  };
  G__2836 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__2836__2.call(this, _, n);
      case 3:
        return G__2836__3.call(this, _, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__2836
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3822__auto__ = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3822__auto__) {
    return o.toString() === other.toString()
  }else {
    return and__3822__auto__
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IWithMeta["function"] = true;
cljs.core._with_meta["function"] = function(f, meta) {
  return cljs.core.with_meta.call(null, function() {
    if(void 0 === cljs.core.t2837) {
      goog.provide("cljs.core.t2837");
      cljs.core.t2837 = function(meta, f, meta2838) {
        this.meta = meta;
        this.f = f;
        this.meta2838 = meta2838;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 393217
      };
      cljs.core.t2837.cljs$lang$type = true;
      cljs.core.t2837.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
        return cljs.core.list.call(null, "cljs.core/t2837")
      };
      cljs.core.t2837.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
        return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/t2837")
      };
      cljs.core.t2837.prototype.call = function() {
        var G__2841__delegate = function(self__, args) {
          var self____$1 = this;
          var _ = self____$1;
          return cljs.core.apply.call(null, self__.f, args)
        };
        var G__2841 = function(self__, var_args) {
          var self__ = this;
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
          }
          return G__2841__delegate.call(this, self__, args)
        };
        G__2841.cljs$lang$maxFixedArity = 1;
        G__2841.cljs$lang$applyTo = function(arglist__2842) {
          var self__ = cljs.core.first(arglist__2842);
          var args = cljs.core.rest(arglist__2842);
          return G__2841__delegate(self__, args)
        };
        G__2841.cljs$lang$arity$variadic = G__2841__delegate;
        return G__2841
      }();
      cljs.core.t2837.prototype.apply = function(self__, args2840) {
        var self__ = this;
        return self__.call.apply(self__, [self__].concat(args2840.slice()))
      };
      cljs.core.t2837.prototype.cljs$core$Fn$ = true;
      cljs.core.t2837.prototype.cljs$core$IMeta$_meta$arity$1 = function(_2839) {
        var self__ = this;
        return self__.meta2838
      };
      cljs.core.t2837.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(_2839, meta2838__$1) {
        var self__ = this;
        return new cljs.core.t2837(self__.meta, self__.f, meta2838__$1)
      }
    }else {
    }
    return new cljs.core.t2837(meta, f, null)
  }(), meta)
};
cljs.core.IMeta["function"] = true;
cljs.core._meta["function"] = function(_) {
  return null
};
cljs.core.Fn["function"] = true;
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
goog.provide("cljs.core.Reduced");
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var self__ = this;
  return self__.val
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt = cljs.core._count.call(null, cicoll);
    if(cnt === 0) {
      return f.call(null)
    }else {
      var val = cljs.core._nth.call(null, cicoll, 0);
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, cljs.core._nth.call(null, cicoll, n));
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__2843 = nval;
            var G__2844 = n + 1;
            val = G__2843;
            n = G__2844;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__2845 = nval;
          var G__2846 = n + 1;
          val__$1 = G__2845;
          n = G__2846;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt = cljs.core._count.call(null, cicoll);
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, cljs.core._nth.call(null, cicoll, n));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__2847 = nval;
          var G__2848 = n + 1;
          val__$1 = G__2847;
          n = G__2848;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val = arr[0];
      var n = 1;
      while(true) {
        if(n < cnt) {
          var nval = f.call(null, val, arr[n]);
          if(cljs.core.reduced_QMARK_.call(null, nval)) {
            return cljs.core.deref.call(null, nval)
          }else {
            var G__2849 = nval;
            var G__2850 = n + 1;
            val = G__2849;
            n = G__2850;
            continue
          }
        }else {
          return val
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = 0;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__2851 = nval;
          var G__2852 = n + 1;
          val__$1 = G__2851;
          n = G__2852;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt = arr.length;
    var val__$1 = val;
    var n = idx;
    while(true) {
      if(n < cnt) {
        var nval = f.call(null, val__$1, arr[n]);
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__2853 = nval;
          var G__2854 = n + 1;
          val__$1 = G__2853;
          n = G__2854;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__2856 = x;
  if(G__2856) {
    if(function() {
      var or__3824__auto__ = G__2856.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2856.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__2856.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__2856)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__2856)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__2858 = x;
  if(G__2858) {
    if(function() {
      var or__3824__auto__ = G__2858.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2858.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__2858.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__2858)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__2858)
  }
};
goog.provide("cljs.core.IndexedSeq");
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199550
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.a.length) {
    return new cljs.core.IndexedSeq(self__.a, self__.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  var c = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c > 0) {
    return new cljs.core.RSeq(coll, c - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  if(cljs.core.counted_QMARK_.call(null, self__.a)) {
    return cljs.core.ci_reduce.call(null, self__.a, f, self__.a[self__.i], self__.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, self__.a[self__.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  if(cljs.core.counted_QMARK_.call(null, self__.a)) {
    return cljs.core.ci_reduce.call(null, self__.a, f, start, self__.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.a.length - self__.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var self__ = this;
  return self__.a[self__.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var self__ = this;
  if(self__.i + 1 < self__.a.length) {
    return new cljs.core.IndexedSeq(self__.a, self__.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.a.length) {
    return self__.a[i__$1]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  var i__$1 = n + self__.i;
  if(i__$1 < self__.a.length) {
    return self__.a[i__$1]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(i < prim.length) {
      return new cljs.core.IndexedSeq(prim, i)
    }else {
      return null
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__2859 = null;
  var G__2859__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__2859__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__2859 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__2859__2.call(this, array, f);
      case 3:
        return G__2859__3.call(this, array, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__2859
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__2860 = null;
  var G__2860__2 = function(array, k) {
    return array[k]
  };
  var G__2860__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__2860 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__2860__2.call(this, array, k);
      case 3:
        return G__2860__3.call(this, array, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__2860
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__2861 = null;
  var G__2861__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__2861__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__2861 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__2861__2.call(this, array, n);
      case 3:
        return G__2861__3.call(this, array, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__2861
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
goog.provide("cljs.core.RSeq");
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.ci, self__.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.i > 0) {
    return new cljs.core.RSeq(self__.ci, self__.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var self__ = this;
  return new cljs.core.RSeq(self__.ci, self__.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.RSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn = cljs.core.next.call(null, s);
    if(!(sn == null)) {
      var G__2862 = sn;
      s = G__2862;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__2863__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__2864 = conj.call(null, coll, x);
          var G__2865 = cljs.core.first.call(null, xs);
          var G__2866 = cljs.core.next.call(null, xs);
          coll = G__2864;
          x = G__2865;
          xs = G__2866;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__2863 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2863__delegate.call(this, coll, x, xs)
    };
    G__2863.cljs$lang$maxFixedArity = 2;
    G__2863.cljs$lang$applyTo = function(arglist__2867) {
      var coll = cljs.core.first(arglist__2867);
      var x = cljs.core.first(cljs.core.next(arglist__2867));
      var xs = cljs.core.rest(cljs.core.next(arglist__2867));
      return G__2863__delegate(coll, x, xs)
    };
    G__2863.cljs$lang$arity$variadic = G__2863__delegate;
    return G__2863
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s = cljs.core.seq.call(null, coll);
  var acc = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s)) {
      return acc + cljs.core._count.call(null, s)
    }else {
      var G__2868 = cljs.core.next.call(null, s);
      var G__2869 = acc + 1;
      s = G__2868;
      acc = G__2869;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    while(true) {
      if(coll == null) {
        throw new Error("Index out of bounds");
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            throw new Error("Index out of bounds");
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__2870 = cljs.core.next.call(null, coll);
              var G__2871 = n - 1;
              coll = G__2870;
              n = G__2871;
              continue
            }else {
              if("\ufdd0'else") {
                throw new Error("Index out of bounds");
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    while(true) {
      if(coll == null) {
        return not_found
      }else {
        if(n === 0) {
          if(cljs.core.seq.call(null, coll)) {
            return cljs.core.first.call(null, coll)
          }else {
            return not_found
          }
        }else {
          if(cljs.core.indexed_QMARK_.call(null, coll)) {
            return cljs.core._nth.call(null, coll, n, not_found)
          }else {
            if(cljs.core.seq.call(null, coll)) {
              var G__2872 = cljs.core.next.call(null, coll);
              var G__2873 = n - 1;
              var G__2874 = not_found;
              coll = G__2872;
              n = G__2873;
              not_found = G__2874;
              continue
            }else {
              if("\ufdd0'else") {
                return not_found
              }else {
                return null
              }
            }
          }
        }
      }
      break
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__2877 = coll;
        if(G__2877) {
          if(function() {
            var or__3824__auto__ = G__2877.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto__) {
              return or__3824__auto__
            }else {
              return G__2877.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__2877.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__2877)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__2877)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__2878 = coll;
        if(G__2878) {
          if(function() {
            var or__3824__auto__ = G__2878.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto__) {
              return or__3824__auto__
            }else {
              return G__2878.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__2878.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__2878)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__2878)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__2879__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__2880 = ret;
          var G__2881 = cljs.core.first.call(null, kvs);
          var G__2882 = cljs.core.second.call(null, kvs);
          var G__2883 = cljs.core.nnext.call(null, kvs);
          coll = G__2880;
          k = G__2881;
          v = G__2882;
          kvs = G__2883;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__2879 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__2879__delegate.call(this, coll, k, v, kvs)
    };
    G__2879.cljs$lang$maxFixedArity = 3;
    G__2879.cljs$lang$applyTo = function(arglist__2884) {
      var coll = cljs.core.first(arglist__2884);
      var k = cljs.core.first(cljs.core.next(arglist__2884));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__2884)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__2884)));
      return G__2879__delegate(coll, k, v, kvs)
    };
    G__2879.cljs$lang$arity$variadic = G__2879__delegate;
    return G__2879
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__2885__delegate = function(coll, k, ks) {
      while(true) {
        var ret = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__2886 = ret;
          var G__2887 = cljs.core.first.call(null, ks);
          var G__2888 = cljs.core.next.call(null, ks);
          coll = G__2886;
          k = G__2887;
          ks = G__2888;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__2885 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2885__delegate.call(this, coll, k, ks)
    };
    G__2885.cljs$lang$maxFixedArity = 2;
    G__2885.cljs$lang$applyTo = function(arglist__2889) {
      var coll = cljs.core.first(arglist__2889);
      var k = cljs.core.first(cljs.core.next(arglist__2889));
      var ks = cljs.core.rest(cljs.core.next(arglist__2889));
      return G__2885__delegate(coll, k, ks)
    };
    G__2885.cljs$lang$arity$variadic = G__2885__delegate;
    return G__2885
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__2891 = o;
    if(G__2891) {
      if(function() {
        var or__3824__auto__ = G__2891.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__2891.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__2891.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__2891)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__2891)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__2892__delegate = function(coll, k, ks) {
      while(true) {
        var ret = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__2893 = ret;
          var G__2894 = cljs.core.first.call(null, ks);
          var G__2895 = cljs.core.next.call(null, ks);
          coll = G__2893;
          k = G__2894;
          ks = G__2895;
          continue
        }else {
          return ret
        }
        break
      }
    };
    var G__2892 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2892__delegate.call(this, coll, k, ks)
    };
    G__2892.cljs$lang$maxFixedArity = 2;
    G__2892.cljs$lang$applyTo = function(arglist__2896) {
      var coll = cljs.core.first(arglist__2896);
      var k = cljs.core.first(cljs.core.next(arglist__2896));
      var ks = cljs.core.rest(cljs.core.next(arglist__2896));
      return G__2892__delegate(coll, k, ks)
    };
    G__2892.cljs$lang$arity$variadic = G__2892__delegate;
    return G__2892
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h = cljs.core.string_hash_cache[k];
  if(!(h == null)) {
    return h
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3822__auto__ = goog.isString(o);
      if(and__3822__auto__) {
        return check_cache
      }else {
        return and__3822__auto__
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  var or__3824__auto__ = coll == null;
  if(or__3824__auto__) {
    return or__3824__auto__
  }else {
    return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
  }
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__2898 = x;
    if(G__2898) {
      if(function() {
        var or__3824__auto__ = G__2898.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__2898.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__2898.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__2898)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__2898)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__2900 = x;
    if(G__2900) {
      if(function() {
        var or__3824__auto__ = G__2900.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__2900.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__2900.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__2900)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__2900)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__2902 = x;
  if(G__2902) {
    if(function() {
      var or__3824__auto__ = G__2902.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2902.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__2902.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__2902)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__2902)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__2904 = x;
  if(G__2904) {
    if(function() {
      var or__3824__auto__ = G__2904.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2904.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__2904.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__2904)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__2904)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__2906 = x;
  if(G__2906) {
    if(function() {
      var or__3824__auto__ = G__2906.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2906.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__2906.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__2906)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__2906)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__2908 = x;
    if(G__2908) {
      if(function() {
        var or__3824__auto__ = G__2908.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__2908.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__2908.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__2908)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__2908)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__2910 = x;
  if(G__2910) {
    if(function() {
      var or__3824__auto__ = G__2910.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2910.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__2910.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__2910)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__2910)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__2912 = x;
  if(G__2912) {
    if(function() {
      var or__3824__auto__ = G__2912.cljs$lang$protocol_mask$partition1$ & 512;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2912.cljs$core$IChunkedSeq$
      }
    }()) {
      return true
    }else {
      if(!G__2912.cljs$lang$protocol_mask$partition1$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__2912)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__2912)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__2913__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__2913 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__2913__delegate.call(this, keyvals)
    };
    G__2913.cljs$lang$maxFixedArity = 0;
    G__2913.cljs$lang$applyTo = function(arglist__2914) {
      var keyvals = cljs.core.seq(arglist__2914);
      return G__2913__delegate(keyvals)
    };
    G__2913.cljs$lang$arity$variadic = G__2913__delegate;
    return G__2913
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys = [];
  goog.object.forEach(obj, function(val, key, obj__$1) {
    return keys.push(key)
  });
  return keys
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__$1 = i;
  var j__$1 = j;
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__2915 = i__$1 + 1;
      var G__2916 = j__$1 + 1;
      var G__2917 = len__$1 - 1;
      i__$1 = G__2915;
      j__$1 = G__2916;
      len__$1 = G__2917;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__$1 = i + (len - 1);
  var j__$1 = j + (len - 1);
  var len__$1 = len;
  while(true) {
    if(len__$1 === 0) {
      return to
    }else {
      to[j__$1] = from[i__$1];
      var G__2918 = i__$1 - 1;
      var G__2919 = j__$1 - 1;
      var G__2920 = len__$1 - 1;
      i__$1 = G__2918;
      j__$1 = G__2919;
      len__$1 = G__2920;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__2922 = s;
    if(G__2922) {
      if(function() {
        var or__3824__auto__ = G__2922.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__2922.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__2922.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__2922)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__2922)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__2924 = s;
  if(G__2924) {
    if(function() {
      var or__3824__auto__ = G__2924.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__2924.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__2924.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__2924)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__2924)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto__ = goog.isString(x);
  if(and__3822__auto__) {
    return!function() {
      var or__3824__auto__ = x.charAt(0) === "\ufdd0";
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3822__auto__
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto__ = goog.isString(x);
  if(and__3822__auto__) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto__
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto__ = goog.isString(x);
  if(and__3822__auto__) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto__
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  var or__3824__auto__ = goog.isFunction(f);
  if(or__3824__auto__) {
    return or__3824__auto__
  }else {
    var G__2926 = f;
    if(G__2926) {
      if(cljs.core.truth_(function() {
        var or__3824__auto____$1 = null;
        if(cljs.core.truth_(or__3824__auto____$1)) {
          return or__3824__auto____$1
        }else {
          return G__2926.cljs$core$Fn$
        }
      }())) {
        return true
      }else {
        if(!G__2926.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__2926)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.Fn, G__2926)
    }
  }
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto__ = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto__) {
    return or__3824__auto__
  }else {
    var G__2928 = f;
    if(G__2928) {
      if(function() {
        var or__3824__auto____$1 = G__2928.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          return G__2928.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__2928.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__2928)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__2928)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto__ = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto__) {
    var and__3822__auto____$1 = !isNaN(n);
    if(and__3822__auto____$1) {
      var and__3822__auto____$2 = !(n === Infinity);
      if(and__3822__auto____$2) {
        return parseFloat(n) === parseInt(n, 10)
      }else {
        return and__3822__auto____$2
      }
    }else {
      return and__3822__auto____$1
    }
  }else {
    return and__3822__auto__
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(function() {
    var and__3822__auto__ = !(coll == null);
    if(and__3822__auto__) {
      var and__3822__auto____$1 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____$1) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____$1
      }
    }else {
      return and__3822__auto__
    }
  }()) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__2929__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs = more;
        while(true) {
          var x__$1 = cljs.core.first.call(null, xs);
          var etc = cljs.core.next.call(null, xs);
          if(cljs.core.truth_(xs)) {
            if(cljs.core.contains_QMARK_.call(null, s, x__$1)) {
              return false
            }else {
              var G__2930 = cljs.core.conj.call(null, s, x__$1);
              var G__2931 = etc;
              s = G__2930;
              xs = G__2931;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__2929 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2929__delegate.call(this, x, y, more)
    };
    G__2929.cljs$lang$maxFixedArity = 2;
    G__2929.cljs$lang$applyTo = function(arglist__2932) {
      var x = cljs.core.first(arglist__2932);
      var y = cljs.core.first(cljs.core.next(arglist__2932));
      var more = cljs.core.rest(cljs.core.next(arglist__2932));
      return G__2929__delegate(x, y, more)
    };
    G__2929.cljs$lang$arity$variadic = G__2929__delegate;
    return G__2929
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__2934 = x;
            if(G__2934) {
              if(function() {
                var or__3824__auto__ = G__2934.cljs$lang$protocol_mask$partition1$ & 2048;
                if(or__3824__auto__) {
                  return or__3824__auto__
                }else {
                  return G__2934.cljs$core$IComparable$
                }
              }()) {
                return true
              }else {
                if(!G__2934.cljs$lang$protocol_mask$partition1$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__2934)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__2934)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl = cljs.core.count.call(null, xs);
    var yl = cljs.core.count.call(null, ys);
    if(xl < yl) {
      return-1
    }else {
      if(xl > yl) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3822__auto__ = d === 0;
        if(and__3822__auto__) {
          return n + 1 < len
        }else {
          return and__3822__auto__
        }
      }()) {
        var G__2935 = xs;
        var G__2936 = ys;
        var G__2937 = len;
        var G__2938 = n + 1;
        xs = G__2935;
        ys = G__2936;
        len = G__2937;
        n = G__2938;
        continue
      }else {
        return d
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r)) {
        return r
      }else {
        if(cljs.core.truth_(r)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3971__auto__) {
      var s = temp__3971__auto__;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s), cljs.core.next.call(null, s))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__$1 = val;
    var coll__$1 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__$1) {
        var nval = f.call(null, val__$1, cljs.core.first.call(null, coll__$1));
        if(cljs.core.reduced_QMARK_.call(null, nval)) {
          return cljs.core.deref.call(null, nval)
        }else {
          var G__2939 = nval;
          var G__2940 = cljs.core.next.call(null, coll__$1);
          val__$1 = G__2939;
          coll__$1 = G__2940;
          continue
        }
      }else {
        return val__$1
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a);
  return cljs.core.vec.call(null, a)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__2943 = coll;
      if(G__2943) {
        if(function() {
          var or__3824__auto__ = G__2943.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__2943.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__2943.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__2943)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__2943)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__2944 = coll;
      if(G__2944) {
        if(function() {
          var or__3824__auto__ = G__2944.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__2944.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__2944.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__2944)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__2944)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__2945__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__2945 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2945__delegate.call(this, x, y, more)
    };
    G__2945.cljs$lang$maxFixedArity = 2;
    G__2945.cljs$lang$applyTo = function(arglist__2946) {
      var x = cljs.core.first(arglist__2946);
      var y = cljs.core.first(cljs.core.next(arglist__2946));
      var more = cljs.core.rest(cljs.core.next(arglist__2946));
      return G__2945__delegate(x, y, more)
    };
    G__2945.cljs$lang$arity$variadic = G__2945__delegate;
    return G__2945
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__2947__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__2947 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2947__delegate.call(this, x, y, more)
    };
    G__2947.cljs$lang$maxFixedArity = 2;
    G__2947.cljs$lang$applyTo = function(arglist__2948) {
      var x = cljs.core.first(arglist__2948);
      var y = cljs.core.first(cljs.core.next(arglist__2948));
      var more = cljs.core.rest(cljs.core.next(arglist__2948));
      return G__2947__delegate(x, y, more)
    };
    G__2947.cljs$lang$arity$variadic = G__2947__delegate;
    return G__2947
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__2949__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__2949 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2949__delegate.call(this, x, y, more)
    };
    G__2949.cljs$lang$maxFixedArity = 2;
    G__2949.cljs$lang$applyTo = function(arglist__2950) {
      var x = cljs.core.first(arglist__2950);
      var y = cljs.core.first(cljs.core.next(arglist__2950));
      var more = cljs.core.rest(cljs.core.next(arglist__2950));
      return G__2949__delegate(x, y, more)
    };
    G__2949.cljs$lang$arity$variadic = G__2949__delegate;
    return G__2949
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__2951__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__2951 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2951__delegate.call(this, x, y, more)
    };
    G__2951.cljs$lang$maxFixedArity = 2;
    G__2951.cljs$lang$applyTo = function(arglist__2952) {
      var x = cljs.core.first(arglist__2952);
      var y = cljs.core.first(cljs.core.next(arglist__2952));
      var more = cljs.core.rest(cljs.core.next(arglist__2952));
      return G__2951__delegate(x, y, more)
    };
    G__2951.cljs$lang$arity$variadic = G__2951__delegate;
    return G__2951
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__2953__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__2954 = y;
            var G__2955 = cljs.core.first.call(null, more);
            var G__2956 = cljs.core.next.call(null, more);
            x = G__2954;
            y = G__2955;
            more = G__2956;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__2953 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2953__delegate.call(this, x, y, more)
    };
    G__2953.cljs$lang$maxFixedArity = 2;
    G__2953.cljs$lang$applyTo = function(arglist__2957) {
      var x = cljs.core.first(arglist__2957);
      var y = cljs.core.first(cljs.core.next(arglist__2957));
      var more = cljs.core.rest(cljs.core.next(arglist__2957));
      return G__2953__delegate(x, y, more)
    };
    G__2953.cljs$lang$arity$variadic = G__2953__delegate;
    return G__2953
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__2958__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__2959 = y;
            var G__2960 = cljs.core.first.call(null, more);
            var G__2961 = cljs.core.next.call(null, more);
            x = G__2959;
            y = G__2960;
            more = G__2961;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__2958 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2958__delegate.call(this, x, y, more)
    };
    G__2958.cljs$lang$maxFixedArity = 2;
    G__2958.cljs$lang$applyTo = function(arglist__2962) {
      var x = cljs.core.first(arglist__2962);
      var y = cljs.core.first(cljs.core.next(arglist__2962));
      var more = cljs.core.rest(cljs.core.next(arglist__2962));
      return G__2958__delegate(x, y, more)
    };
    G__2958.cljs$lang$arity$variadic = G__2958__delegate;
    return G__2958
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__2963__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__2964 = y;
            var G__2965 = cljs.core.first.call(null, more);
            var G__2966 = cljs.core.next.call(null, more);
            x = G__2964;
            y = G__2965;
            more = G__2966;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__2963 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2963__delegate.call(this, x, y, more)
    };
    G__2963.cljs$lang$maxFixedArity = 2;
    G__2963.cljs$lang$applyTo = function(arglist__2967) {
      var x = cljs.core.first(arglist__2967);
      var y = cljs.core.first(cljs.core.next(arglist__2967));
      var more = cljs.core.rest(cljs.core.next(arglist__2967));
      return G__2963__delegate(x, y, more)
    };
    G__2963.cljs$lang$arity$variadic = G__2963__delegate;
    return G__2963
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__2968__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__2969 = y;
            var G__2970 = cljs.core.first.call(null, more);
            var G__2971 = cljs.core.next.call(null, more);
            x = G__2969;
            y = G__2970;
            more = G__2971;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__2968 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2968__delegate.call(this, x, y, more)
    };
    G__2968.cljs$lang$maxFixedArity = 2;
    G__2968.cljs$lang$applyTo = function(arglist__2972) {
      var x = cljs.core.first(arglist__2972);
      var y = cljs.core.first(cljs.core.next(arglist__2972));
      var more = cljs.core.rest(cljs.core.next(arglist__2972));
      return G__2968__delegate(x, y, more)
    };
    G__2968.cljs$lang$arity$variadic = G__2968__delegate;
    return G__2968
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__2973__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__2973 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2973__delegate.call(this, x, y, more)
    };
    G__2973.cljs$lang$maxFixedArity = 2;
    G__2973.cljs$lang$applyTo = function(arglist__2974) {
      var x = cljs.core.first(arglist__2974);
      var y = cljs.core.first(cljs.core.next(arglist__2974));
      var more = cljs.core.rest(cljs.core.next(arglist__2974));
      return G__2973__delegate(x, y, more)
    };
    G__2973.cljs$lang$arity$variadic = G__2973__delegate;
    return G__2973
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__2975__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__2975 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2975__delegate.call(this, x, y, more)
    };
    G__2975.cljs$lang$maxFixedArity = 2;
    G__2975.cljs$lang$applyTo = function(arglist__2976) {
      var x = cljs.core.first(arglist__2976);
      var y = cljs.core.first(cljs.core.next(arglist__2976));
      var more = cljs.core.rest(cljs.core.next(arglist__2976));
      return G__2975__delegate(x, y, more)
    };
    G__2975.cljs$lang$arity$variadic = G__2975__delegate;
    return G__2975
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.js_mod = function js_mod(n, d) {
  return n % d
};
cljs.core.mod = function mod(n, d) {
  return(n % d + d) % d
};
cljs.core.quot = function quot(n, d) {
  var rem = n % d;
  return cljs.core.fix.call(null, (n - rem) / d)
};
cljs.core.rem = function rem(n, d) {
  var q = cljs.core.quot.call(null, n, d);
  return n - d * q
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__$1 = v - (v >> 1 & 1431655765);
  var v__$2 = (v__$1 & 858993459) + (v__$1 >> 2 & 858993459);
  return(v__$2 + (v__$2 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__2977__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__2978 = y;
            var G__2979 = cljs.core.first.call(null, more);
            var G__2980 = cljs.core.next.call(null, more);
            x = G__2978;
            y = G__2979;
            more = G__2980;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__2977 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__2977__delegate.call(this, x, y, more)
    };
    G__2977.cljs$lang$maxFixedArity = 2;
    G__2977.cljs$lang$applyTo = function(arglist__2981) {
      var x = cljs.core.first(arglist__2981);
      var y = cljs.core.first(cljs.core.next(arglist__2981));
      var more = cljs.core.rest(cljs.core.next(arglist__2981));
      return G__2977__delegate(x, y, more)
    };
    G__2977.cljs$lang$arity$variadic = G__2977__delegate;
    return G__2977
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__$1 = n;
  var xs = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto__ = xs;
      if(and__3822__auto__) {
        return n__$1 > 0
      }else {
        return and__3822__auto__
      }
    }())) {
      var G__2982 = n__$1 - 1;
      var G__2983 = cljs.core.next.call(null, xs);
      n__$1 = G__2982;
      xs = G__2983;
      continue
    }else {
      return xs
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__2984__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__2985 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__2986 = cljs.core.next.call(null, more);
            sb = G__2985;
            more = G__2986;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__2984 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__2984__delegate.call(this, x, ys)
    };
    G__2984.cljs$lang$maxFixedArity = 1;
    G__2984.cljs$lang$applyTo = function(arglist__2987) {
      var x = cljs.core.first(arglist__2987);
      var ys = cljs.core.rest(arglist__2987);
      return G__2984__delegate(x, ys)
    };
    G__2984.cljs$lang$arity$variadic = G__2984__delegate;
    return G__2984
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__2988__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__2989 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__2990 = cljs.core.next.call(null, more);
            sb = G__2989;
            more = G__2990;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__2988 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__2988__delegate.call(this, x, ys)
    };
    G__2988.cljs$lang$maxFixedArity = 1;
    G__2988.cljs$lang$applyTo = function(arglist__2991) {
      var x = cljs.core.first(arglist__2991);
      var ys = cljs.core.rest(arglist__2991);
      return G__2988__delegate(x, ys)
    };
    G__2988.cljs$lang$arity$variadic = G__2988__delegate;
    return G__2988
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    var args__$1 = cljs.core.map.call(null, function(x) {
      if(function() {
        var or__3824__auto__ = cljs.core.keyword_QMARK_.call(null, x);
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return cljs.core.symbol_QMARK_.call(null, x)
        }
      }()) {
        return[cljs.core.str(x)].join("")
      }else {
        return x
      }
    }, args);
    return cljs.core.apply.call(null, goog.string.format, fmt, args__$1)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__2992) {
    var fmt = cljs.core.first(arglist__2992);
    var args = cljs.core.rest(arglist__2992);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs = cljs.core.seq.call(null, x);
    var ys = cljs.core.seq.call(null, y);
    while(true) {
      if(xs == null) {
        return ys == null
      }else {
        if(ys == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs), cljs.core.first.call(null, ys))) {
            var G__2993 = cljs.core.next.call(null, xs);
            var G__2994 = cljs.core.next.call(null, ys);
            xs = G__2993;
            ys = G__2994;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__2995_SHARP_, p2__2996_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__2995_SHARP_, cljs.core.hash.call(null, p2__2996_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h = 0;
  var s = cljs.core.seq.call(null, m);
  while(true) {
    if(s) {
      var e = cljs.core.first.call(null, s);
      var G__2997 = (h + (cljs.core.hash.call(null, cljs.core.key.call(null, e)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e)))) % 4503599627370496;
      var G__2998 = cljs.core.next.call(null, s);
      h = G__2997;
      s = G__2998;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h = 0;
  var s__$1 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__$1) {
      var e = cljs.core.first.call(null, s__$1);
      var G__2999 = (h + cljs.core.hash.call(null, e)) % 4503599627370496;
      var G__3000 = cljs.core.next.call(null, s__$1);
      h = G__2999;
      s__$1 = G__3000;
      continue
    }else {
      return h
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__3003_3005 = cljs.core.seq.call(null, fn_map);
  while(true) {
    if(G__3003_3005) {
      var vec__3004_3006 = cljs.core.first.call(null, G__3003_3005);
      var key_name_3007 = cljs.core.nth.call(null, vec__3004_3006, 0, null);
      var f_3008 = cljs.core.nth.call(null, vec__3004_3006, 1, null);
      var str_name_3009 = cljs.core.name.call(null, key_name_3007);
      obj[str_name_3009] = f_3008;
      var G__3010 = cljs.core.next.call(null, G__3003_3005);
      G__3003_3005 = G__3010;
      continue
    }else {
    }
    break
  }
  return obj
};
goog.provide("cljs.core.List");
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return null
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, coll, self__.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.List(meta__$1, self__.first, self__.rest, self__.count, self__.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
goog.provide("cljs.core.EmptyList");
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.List(self__.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.EmptyList(meta__$1)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__3012 = coll;
  if(G__3012) {
    if(function() {
      var or__3824__auto__ = G__3012.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__3012.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__3012.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__3012)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__3012)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__3013__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__3013 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3013__delegate.call(this, x, y, z, items)
    };
    G__3013.cljs$lang$maxFixedArity = 3;
    G__3013.cljs$lang$applyTo = function(arglist__3014) {
      var x = cljs.core.first(arglist__3014);
      var y = cljs.core.first(cljs.core.next(arglist__3014));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3014)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3014)));
      return G__3013__delegate(x, y, z, items)
    };
    G__3013.cljs$lang$arity$variadic = G__3013__delegate;
    return G__3013
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
goog.provide("cljs.core.Cons");
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, self__.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.Cons(null, o, coll, self__.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Cons(meta__$1, self__.first, self__.rest, self__.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto__ = coll == null;
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      var G__3016 = coll;
      if(G__3016) {
        if(function() {
          var or__3824__auto____$1 = G__3016.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            return G__3016.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__3016.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3016)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__3016)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__3018 = x;
  if(G__3018) {
    if(function() {
      var or__3824__auto__ = G__3018.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return G__3018.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__3018.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__3018)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__3018)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__3019 = null;
  var G__3019__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__3019__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__3019 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__3019__2.call(this, string, f);
      case 3:
        return G__3019__3.call(this, string, f, start)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3019
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__3020 = null;
  var G__3020__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__3020__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__3020 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3020__2.call(this, string, k);
      case 3:
        return G__3020__3.call(this, string, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3020
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__3021 = null;
  var G__3021__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__3021__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__3021 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3021__2.call(this, string, n);
      case 3:
        return G__3021__3.call(this, string, n, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3021
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
goog.provide("cljs.core.Keyword");
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__3023 = null;
  var G__3023__2 = function(self__, coll) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return null
    }else {
      var strobj = coll.strobj;
      if(strobj == null) {
        return cljs.core._lookup.call(null, coll, self__.k, null)
      }else {
        return strobj[self__.k]
      }
    }
  };
  var G__3023__3 = function(self__, coll, not_found) {
    var self__ = this;
    var self____$1 = this;
    var _ = self____$1;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, self__.k, not_found)
    }
  };
  G__3023 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3023__2.call(this, self__, coll);
      case 3:
        return G__3023__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3023
}();
cljs.core.Keyword.prototype.apply = function(self__, args3022) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3022.slice()))
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__3025 = null;
  var G__3025__2 = function(self__, coll) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core._lookup.call(null, coll, this$.toString(), null)
  };
  var G__3025__3 = function(self__, coll, not_found) {
    var self____$1 = this;
    var this$ = self____$1;
    return cljs.core._lookup.call(null, coll, this$.toString(), not_found)
  };
  G__3025 = function(self__, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3025__2.call(this, self__, coll);
      case 3:
        return G__3025__3.call(this, self__, coll, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3025
}();
String.prototype.apply = function(self__, args3024) {
  return self__.call.apply(self__, [self__].concat(args3024.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x = lazy_seq.x;
  if(lazy_seq.realized) {
    return x
  }else {
    lazy_seq.x = x.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
goog.provide("cljs.core.LazySeq");
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.LazySeq(meta__$1, self__.realized, self__.x, self__.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.ChunkBuffer");
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var self__ = this;
  var _ = this;
  self__.buf[self__.end] = o;
  return self__.end = self__.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var self__ = this;
  var _ = this;
  var ret = new cljs.core.ArrayChunk(self__.buf, 0, self__.end);
  self__.buf = null;
  return ret
};
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
goog.provide("cljs.core.ArrayChunk");
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, self__.arr[self__.off], self__.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var self__ = this;
  return cljs.core.array_reduce.call(null, self__.arr, f, start, self__.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off === self__.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(self__.arr, self__.off + 1, self__.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var self__ = this;
  return self__.arr[self__.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = i >= 0;
    if(and__3822__auto__) {
      return i < self__.end - self__.off
    }else {
      return and__3822__auto__
    }
  }()) {
    return self__.arr[self__.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var self__ = this;
  return self__.end - self__.off
};
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
goog.provide("cljs.core.ChunkedCons");
cljs.core.ChunkedCons = function(chunk, more, meta, __hash) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31850604;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core._count.call(null, self__.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, self__.chunk), self__.more, self__.meta, null)
  }else {
    if(self__.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return self__.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return null
  }else {
    return self__.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return new cljs.core.ChunkedCons(self__.chunk, self__.more, m, self__.__hash)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return self__.more
  }
};
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__3027 = s;
    if(G__3027) {
      if(function() {
        var or__3824__auto__ = G__3027.cljs$lang$protocol_mask$partition1$ & 1024;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__3027.cljs$core$IChunkedNext$
        }
      }()) {
        return true
      }else {
        if(!G__3027.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__3027)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__3027)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary = [];
  var s__$1 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__$1)) {
      ary.push(cljs.core.first.call(null, s__$1));
      var G__3028 = cljs.core.next.call(null, s__$1);
      s__$1 = G__3028;
      continue
    }else {
      return ary
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i_3029 = 0;
  var xs_3030 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs_3030) {
      ret[i_3029] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs_3030));
      var G__3031 = i_3029 + 1;
      var G__3032 = cljs.core.next.call(null, xs_3030);
      i_3029 = G__3031;
      xs_3030 = G__3032;
      continue
    }else {
    }
    break
  }
  return ret
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto__ = s__$1;
          if(and__3822__auto__) {
            return i < size
          }else {
            return and__3822__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__3033 = i + 1;
          var G__3034 = cljs.core.next.call(null, s__$1);
          i = G__3033;
          s__$1 = G__3034;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__2552__auto___3035 = size;
      var i_3036 = 0;
      while(true) {
        if(i_3036 < n__2552__auto___3035) {
          a[i_3036] = init_val_or_seq;
          var G__3037 = i_3036 + 1;
          i_3036 = G__3037;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto__ = s__$1;
          if(and__3822__auto__) {
            return i < size
          }else {
            return and__3822__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__3038 = i + 1;
          var G__3039 = cljs.core.next.call(null, s__$1);
          i = G__3038;
          s__$1 = G__3039;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__2552__auto___3040 = size;
      var i_3041 = 0;
      while(true) {
        if(i_3041 < n__2552__auto___3040) {
          a[i_3041] = init_val_or_seq;
          var G__3042 = i_3041 + 1;
          i_3041 = G__3042;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s = cljs.core.seq.call(null, init_val_or_seq);
      var i = 0;
      var s__$1 = s;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto__ = s__$1;
          if(and__3822__auto__) {
            return i < size
          }else {
            return and__3822__auto__
          }
        }())) {
          a[i] = cljs.core.first.call(null, s__$1);
          var G__3043 = i + 1;
          var G__3044 = cljs.core.next.call(null, s__$1);
          i = G__3043;
          s__$1 = G__3044;
          continue
        }else {
          return a
        }
        break
      }
    }else {
      var n__2552__auto___3045 = size;
      var i_3046 = 0;
      while(true) {
        if(i_3046 < n__2552__auto___3045) {
          a[i_3046] = init_val_or_seq;
          var G__3047 = i_3046 + 1;
          i_3046 = G__3047;
          continue
        }else {
        }
        break
      }
      return a
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__$1 = s;
    var i = n;
    var sum = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto__ = i > 0;
        if(and__3822__auto__) {
          return cljs.core.seq.call(null, s__$1)
        }else {
          return and__3822__auto__
        }
      }())) {
        var G__3048 = cljs.core.next.call(null, s__$1);
        var G__3049 = i - 1;
        var G__3050 = sum + 1;
        s__$1 = G__3048;
        i = G__3049;
        sum = G__3050;
        continue
      }else {
        return sum
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s = cljs.core.seq.call(null, x);
      if(s) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s), concat.call(null, cljs.core.chunk_rest.call(null, s), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s), concat.call(null, cljs.core.rest.call(null, s), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__3051__delegate = function(x, y, zs) {
      var cat = function cat(xys, zs__$1) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__$1 = cljs.core.seq.call(null, xys);
          if(xys__$1) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__$1)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__$1), cat.call(null, cljs.core.chunk_rest.call(null, xys__$1), zs__$1))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__$1), cat.call(null, cljs.core.rest.call(null, xys__$1), zs__$1))
            }
          }else {
            if(cljs.core.truth_(zs__$1)) {
              return cat.call(null, cljs.core.first.call(null, zs__$1), cljs.core.next.call(null, zs__$1))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat.call(null, concat.call(null, x, y), zs)
    };
    var G__3051 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3051__delegate.call(this, x, y, zs)
    };
    G__3051.cljs$lang$maxFixedArity = 2;
    G__3051.cljs$lang$applyTo = function(arglist__3052) {
      var x = cljs.core.first(arglist__3052);
      var y = cljs.core.first(cljs.core.next(arglist__3052));
      var zs = cljs.core.rest(cljs.core.next(arglist__3052));
      return G__3051__delegate(x, y, zs)
    };
    G__3051.cljs$lang$arity$variadic = G__3051__delegate;
    return G__3051
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__3053__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__3053 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3053__delegate.call(this, a, b, c, d, more)
    };
    G__3053.cljs$lang$maxFixedArity = 4;
    G__3053.cljs$lang$applyTo = function(arglist__3054) {
      var a = cljs.core.first(arglist__3054);
      var b = cljs.core.first(cljs.core.next(arglist__3054));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3054)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3054))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3054))));
      return G__3053__delegate(a, b, c, d, more)
    };
    G__3053.cljs$lang$arity$variadic = G__3053__delegate;
    return G__3053
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__$1 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a = cljs.core._first.call(null, args__$1);
    var args__$2 = cljs.core._rest.call(null, args__$1);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a)
      }else {
        return f.call(null, a)
      }
    }else {
      var b = cljs.core._first.call(null, args__$2);
      var args__$3 = cljs.core._rest.call(null, args__$2);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a, b)
        }else {
          return f.call(null, a, b)
        }
      }else {
        var c = cljs.core._first.call(null, args__$3);
        var args__$4 = cljs.core._rest.call(null, args__$3);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a, b, c)
          }else {
            return f.call(null, a, b, c)
          }
        }else {
          var d = cljs.core._first.call(null, args__$4);
          var args__$5 = cljs.core._rest.call(null, args__$4);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a, b, c, d)
            }else {
              return f.call(null, a, b, c, d)
            }
          }else {
            var e = cljs.core._first.call(null, args__$5);
            var args__$6 = cljs.core._rest.call(null, args__$5);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a, b, c, d, e)
              }else {
                return f.call(null, a, b, c, d, e)
              }
            }else {
              var f__$1 = cljs.core._first.call(null, args__$6);
              var args__$7 = cljs.core._rest.call(null, args__$6);
              if(argc === 6) {
                if(f__$1.cljs$lang$arity$6) {
                  return f__$1.cljs$lang$arity$6(a, b, c, d, e, f__$1)
                }else {
                  return f__$1.call(null, a, b, c, d, e, f__$1)
                }
              }else {
                var g = cljs.core._first.call(null, args__$7);
                var args__$8 = cljs.core._rest.call(null, args__$7);
                if(argc === 7) {
                  if(f__$1.cljs$lang$arity$7) {
                    return f__$1.cljs$lang$arity$7(a, b, c, d, e, f__$1, g)
                  }else {
                    return f__$1.call(null, a, b, c, d, e, f__$1, g)
                  }
                }else {
                  var h = cljs.core._first.call(null, args__$8);
                  var args__$9 = cljs.core._rest.call(null, args__$8);
                  if(argc === 8) {
                    if(f__$1.cljs$lang$arity$8) {
                      return f__$1.cljs$lang$arity$8(a, b, c, d, e, f__$1, g, h)
                    }else {
                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h)
                    }
                  }else {
                    var i = cljs.core._first.call(null, args__$9);
                    var args__$10 = cljs.core._rest.call(null, args__$9);
                    if(argc === 9) {
                      if(f__$1.cljs$lang$arity$9) {
                        return f__$1.cljs$lang$arity$9(a, b, c, d, e, f__$1, g, h, i)
                      }else {
                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i)
                      }
                    }else {
                      var j = cljs.core._first.call(null, args__$10);
                      var args__$11 = cljs.core._rest.call(null, args__$10);
                      if(argc === 10) {
                        if(f__$1.cljs$lang$arity$10) {
                          return f__$1.cljs$lang$arity$10(a, b, c, d, e, f__$1, g, h, i, j)
                        }else {
                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j)
                        }
                      }else {
                        var k = cljs.core._first.call(null, args__$11);
                        var args__$12 = cljs.core._rest.call(null, args__$11);
                        if(argc === 11) {
                          if(f__$1.cljs$lang$arity$11) {
                            return f__$1.cljs$lang$arity$11(a, b, c, d, e, f__$1, g, h, i, j, k)
                          }else {
                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k)
                          }
                        }else {
                          var l = cljs.core._first.call(null, args__$12);
                          var args__$13 = cljs.core._rest.call(null, args__$12);
                          if(argc === 12) {
                            if(f__$1.cljs$lang$arity$12) {
                              return f__$1.cljs$lang$arity$12(a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }else {
                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l)
                            }
                          }else {
                            var m = cljs.core._first.call(null, args__$13);
                            var args__$14 = cljs.core._rest.call(null, args__$13);
                            if(argc === 13) {
                              if(f__$1.cljs$lang$arity$13) {
                                return f__$1.cljs$lang$arity$13(a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }else {
                                return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m)
                              }
                            }else {
                              var n = cljs.core._first.call(null, args__$14);
                              var args__$15 = cljs.core._rest.call(null, args__$14);
                              if(argc === 14) {
                                if(f__$1.cljs$lang$arity$14) {
                                  return f__$1.cljs$lang$arity$14(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }else {
                                  return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n)
                                }
                              }else {
                                var o = cljs.core._first.call(null, args__$15);
                                var args__$16 = cljs.core._rest.call(null, args__$15);
                                if(argc === 15) {
                                  if(f__$1.cljs$lang$arity$15) {
                                    return f__$1.cljs$lang$arity$15(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }else {
                                    return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o)
                                  }
                                }else {
                                  var p = cljs.core._first.call(null, args__$16);
                                  var args__$17 = cljs.core._rest.call(null, args__$16);
                                  if(argc === 16) {
                                    if(f__$1.cljs$lang$arity$16) {
                                      return f__$1.cljs$lang$arity$16(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }else {
                                      return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p)
                                    }
                                  }else {
                                    var q = cljs.core._first.call(null, args__$17);
                                    var args__$18 = cljs.core._rest.call(null, args__$17);
                                    if(argc === 17) {
                                      if(f__$1.cljs$lang$arity$17) {
                                        return f__$1.cljs$lang$arity$17(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }else {
                                        return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q)
                                      }
                                    }else {
                                      var r = cljs.core._first.call(null, args__$18);
                                      var args__$19 = cljs.core._rest.call(null, args__$18);
                                      if(argc === 18) {
                                        if(f__$1.cljs$lang$arity$18) {
                                          return f__$1.cljs$lang$arity$18(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }else {
                                          return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r)
                                        }
                                      }else {
                                        var s = cljs.core._first.call(null, args__$19);
                                        var args__$20 = cljs.core._rest.call(null, args__$19);
                                        if(argc === 19) {
                                          if(f__$1.cljs$lang$arity$19) {
                                            return f__$1.cljs$lang$arity$19(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }else {
                                            return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s)
                                          }
                                        }else {
                                          var t = cljs.core._first.call(null, args__$20);
                                          var args__$21 = cljs.core._rest.call(null, args__$20);
                                          if(argc === 20) {
                                            if(f__$1.cljs$lang$arity$20) {
                                              return f__$1.cljs$lang$arity$20(a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }else {
                                              return f__$1.call(null, a, b, c, d, e, f__$1, g, h, i, j, k, l, m, n, o, p, q, r, s, t)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, args, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity = f.cljs$lang$maxFixedArity;
    if(f.cljs$lang$applyTo) {
      var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
      if(bc <= fixed_arity) {
        return cljs.core.apply_to.call(null, f, bc, arglist)
      }else {
        return f.cljs$lang$applyTo(arglist)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist))
    }
  };
  var apply__6 = function() {
    var G__3055__delegate = function(f, a, b, c, d, args) {
      var arglist = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity = f.cljs$lang$maxFixedArity;
      if(f.cljs$lang$applyTo) {
        var bc = cljs.core.bounded_count.call(null, arglist, fixed_arity + 1);
        if(bc <= fixed_arity) {
          return cljs.core.apply_to.call(null, f, bc, arglist)
        }else {
          return f.cljs$lang$applyTo(arglist)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist))
      }
    };
    var G__3055 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3055__delegate.call(this, f, a, b, c, d, args)
    };
    G__3055.cljs$lang$maxFixedArity = 5;
    G__3055.cljs$lang$applyTo = function(arglist__3056) {
      var f = cljs.core.first(arglist__3056);
      var a = cljs.core.first(cljs.core.next(arglist__3056));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3056)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3056))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3056)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3056)))));
      return G__3055__delegate(f, a, b, c, d, args)
    };
    G__3055.cljs$lang$arity$variadic = G__3055__delegate;
    return G__3055
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__3057) {
    var obj = cljs.core.first(arglist__3057);
    var f = cljs.core.first(cljs.core.next(arglist__3057));
    var args = cljs.core.rest(cljs.core.next(arglist__3057));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__3058__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__3058 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3058__delegate.call(this, x, y, more)
    };
    G__3058.cljs$lang$maxFixedArity = 2;
    G__3058.cljs$lang$applyTo = function(arglist__3059) {
      var x = cljs.core.first(arglist__3059);
      var y = cljs.core.first(cljs.core.next(arglist__3059));
      var more = cljs.core.rest(cljs.core.next(arglist__3059));
      return G__3058__delegate(x, y, more)
    };
    G__3058.cljs$lang$arity$variadic = G__3058__delegate;
    return G__3058
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__3060 = pred;
        var G__3061 = cljs.core.next.call(null, coll);
        pred = G__3060;
        coll = G__3061;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3824__auto__ = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto__)) {
        return or__3824__auto__
      }else {
        var G__3062 = pred;
        var G__3063 = cljs.core.next.call(null, coll);
        pred = G__3062;
        coll = G__3063;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__3064 = null;
    var G__3064__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__3064__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__3064__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__3064__3 = function() {
      var G__3065__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__3065 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__3065__delegate.call(this, x, y, zs)
      };
      G__3065.cljs$lang$maxFixedArity = 2;
      G__3065.cljs$lang$applyTo = function(arglist__3066) {
        var x = cljs.core.first(arglist__3066);
        var y = cljs.core.first(cljs.core.next(arglist__3066));
        var zs = cljs.core.rest(cljs.core.next(arglist__3066));
        return G__3065__delegate(x, y, zs)
      };
      G__3065.cljs$lang$arity$variadic = G__3065__delegate;
      return G__3065
    }();
    G__3064 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__3064__0.call(this);
        case 1:
          return G__3064__1.call(this, x);
        case 2:
          return G__3064__2.call(this, x, y);
        default:
          return G__3064__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw new Error("Invalid arity: " + arguments.length);
    };
    G__3064.cljs$lang$maxFixedArity = 2;
    G__3064.cljs$lang$applyTo = G__3064__3.cljs$lang$applyTo;
    return G__3064
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__3067__delegate = function(args) {
      return x
    };
    var G__3067 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3067__delegate.call(this, args)
    };
    G__3067.cljs$lang$maxFixedArity = 0;
    G__3067.cljs$lang$applyTo = function(arglist__3068) {
      var args = cljs.core.seq(arglist__3068);
      return G__3067__delegate(args)
    };
    G__3067.cljs$lang$arity$variadic = G__3067__delegate;
    return G__3067
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__3069 = null;
      var G__3069__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__3069__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__3069__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__3069__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__3069__4 = function() {
        var G__3070__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3070 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3070__delegate.call(this, x, y, z, args)
        };
        G__3070.cljs$lang$maxFixedArity = 3;
        G__3070.cljs$lang$applyTo = function(arglist__3071) {
          var x = cljs.core.first(arglist__3071);
          var y = cljs.core.first(cljs.core.next(arglist__3071));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3071)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3071)));
          return G__3070__delegate(x, y, z, args)
        };
        G__3070.cljs$lang$arity$variadic = G__3070__delegate;
        return G__3070
      }();
      G__3069 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3069__0.call(this);
          case 1:
            return G__3069__1.call(this, x);
          case 2:
            return G__3069__2.call(this, x, y);
          case 3:
            return G__3069__3.call(this, x, y, z);
          default:
            return G__3069__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3069.cljs$lang$maxFixedArity = 3;
      G__3069.cljs$lang$applyTo = G__3069__4.cljs$lang$applyTo;
      return G__3069
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__3072 = null;
      var G__3072__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__3072__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__3072__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__3072__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__3072__4 = function() {
        var G__3073__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__3073 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3073__delegate.call(this, x, y, z, args)
        };
        G__3073.cljs$lang$maxFixedArity = 3;
        G__3073.cljs$lang$applyTo = function(arglist__3074) {
          var x = cljs.core.first(arglist__3074);
          var y = cljs.core.first(cljs.core.next(arglist__3074));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3074)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3074)));
          return G__3073__delegate(x, y, z, args)
        };
        G__3073.cljs$lang$arity$variadic = G__3073__delegate;
        return G__3073
      }();
      G__3072 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3072__0.call(this);
          case 1:
            return G__3072__1.call(this, x);
          case 2:
            return G__3072__2.call(this, x, y);
          case 3:
            return G__3072__3.call(this, x, y, z);
          default:
            return G__3072__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3072.cljs$lang$maxFixedArity = 3;
      G__3072.cljs$lang$applyTo = G__3072__4.cljs$lang$applyTo;
      return G__3072
    }()
  };
  var comp__4 = function() {
    var G__3075__delegate = function(f1, f2, f3, fs) {
      var fs__$1 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__3076__delegate = function(args) {
          var ret = cljs.core.apply.call(null, cljs.core.first.call(null, fs__$1), args);
          var fs__$2 = cljs.core.next.call(null, fs__$1);
          while(true) {
            if(fs__$2) {
              var G__3077 = cljs.core.first.call(null, fs__$2).call(null, ret);
              var G__3078 = cljs.core.next.call(null, fs__$2);
              ret = G__3077;
              fs__$2 = G__3078;
              continue
            }else {
              return ret
            }
            break
          }
        };
        var G__3076 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3076__delegate.call(this, args)
        };
        G__3076.cljs$lang$maxFixedArity = 0;
        G__3076.cljs$lang$applyTo = function(arglist__3079) {
          var args = cljs.core.seq(arglist__3079);
          return G__3076__delegate(args)
        };
        G__3076.cljs$lang$arity$variadic = G__3076__delegate;
        return G__3076
      }()
    };
    var G__3075 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3075__delegate.call(this, f1, f2, f3, fs)
    };
    G__3075.cljs$lang$maxFixedArity = 3;
    G__3075.cljs$lang$applyTo = function(arglist__3080) {
      var f1 = cljs.core.first(arglist__3080);
      var f2 = cljs.core.first(cljs.core.next(arglist__3080));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3080)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3080)));
      return G__3075__delegate(f1, f2, f3, fs)
    };
    G__3075.cljs$lang$arity$variadic = G__3075__delegate;
    return G__3075
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__3081__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__3081 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3081__delegate.call(this, args)
      };
      G__3081.cljs$lang$maxFixedArity = 0;
      G__3081.cljs$lang$applyTo = function(arglist__3082) {
        var args = cljs.core.seq(arglist__3082);
        return G__3081__delegate(args)
      };
      G__3081.cljs$lang$arity$variadic = G__3081__delegate;
      return G__3081
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__3083__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__3083 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3083__delegate.call(this, args)
      };
      G__3083.cljs$lang$maxFixedArity = 0;
      G__3083.cljs$lang$applyTo = function(arglist__3084) {
        var args = cljs.core.seq(arglist__3084);
        return G__3083__delegate(args)
      };
      G__3083.cljs$lang$arity$variadic = G__3083__delegate;
      return G__3083
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__3085__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__3085 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__3085__delegate.call(this, args)
      };
      G__3085.cljs$lang$maxFixedArity = 0;
      G__3085.cljs$lang$applyTo = function(arglist__3086) {
        var args = cljs.core.seq(arglist__3086);
        return G__3085__delegate(args)
      };
      G__3085.cljs$lang$arity$variadic = G__3085__delegate;
      return G__3085
    }()
  };
  var partial__5 = function() {
    var G__3087__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__3088__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__3088 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__3088__delegate.call(this, args)
        };
        G__3088.cljs$lang$maxFixedArity = 0;
        G__3088.cljs$lang$applyTo = function(arglist__3089) {
          var args = cljs.core.seq(arglist__3089);
          return G__3088__delegate(args)
        };
        G__3088.cljs$lang$arity$variadic = G__3088__delegate;
        return G__3088
      }()
    };
    var G__3087 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3087__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__3087.cljs$lang$maxFixedArity = 4;
    G__3087.cljs$lang$applyTo = function(arglist__3090) {
      var f = cljs.core.first(arglist__3090);
      var arg1 = cljs.core.first(cljs.core.next(arglist__3090));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3090)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3090))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3090))));
      return G__3087__delegate(f, arg1, arg2, arg3, more)
    };
    G__3087.cljs$lang$arity$variadic = G__3087__delegate;
    return G__3087
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__3091 = null;
      var G__3091__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__3091__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__3091__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__3091__4 = function() {
        var G__3092__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__3092 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3092__delegate.call(this, a, b, c, ds)
        };
        G__3092.cljs$lang$maxFixedArity = 3;
        G__3092.cljs$lang$applyTo = function(arglist__3093) {
          var a = cljs.core.first(arglist__3093);
          var b = cljs.core.first(cljs.core.next(arglist__3093));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3093)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3093)));
          return G__3092__delegate(a, b, c, ds)
        };
        G__3092.cljs$lang$arity$variadic = G__3092__delegate;
        return G__3092
      }();
      G__3091 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__3091__1.call(this, a);
          case 2:
            return G__3091__2.call(this, a, b);
          case 3:
            return G__3091__3.call(this, a, b, c);
          default:
            return G__3091__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3091.cljs$lang$maxFixedArity = 3;
      G__3091.cljs$lang$applyTo = G__3091__4.cljs$lang$applyTo;
      return G__3091
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__3094 = null;
      var G__3094__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__3094__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__3094__4 = function() {
        var G__3095__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__3095 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3095__delegate.call(this, a, b, c, ds)
        };
        G__3095.cljs$lang$maxFixedArity = 3;
        G__3095.cljs$lang$applyTo = function(arglist__3096) {
          var a = cljs.core.first(arglist__3096);
          var b = cljs.core.first(cljs.core.next(arglist__3096));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3096)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3096)));
          return G__3095__delegate(a, b, c, ds)
        };
        G__3095.cljs$lang$arity$variadic = G__3095__delegate;
        return G__3095
      }();
      G__3094 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3094__2.call(this, a, b);
          case 3:
            return G__3094__3.call(this, a, b, c);
          default:
            return G__3094__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3094.cljs$lang$maxFixedArity = 3;
      G__3094.cljs$lang$applyTo = G__3094__4.cljs$lang$applyTo;
      return G__3094
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__3097 = null;
      var G__3097__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__3097__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__3097__4 = function() {
        var G__3098__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__3098 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3098__delegate.call(this, a, b, c, ds)
        };
        G__3098.cljs$lang$maxFixedArity = 3;
        G__3098.cljs$lang$applyTo = function(arglist__3099) {
          var a = cljs.core.first(arglist__3099);
          var b = cljs.core.first(cljs.core.next(arglist__3099));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3099)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3099)));
          return G__3098__delegate(a, b, c, ds)
        };
        G__3098.cljs$lang$arity$variadic = G__3098__delegate;
        return G__3098
      }();
      G__3097 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__3097__2.call(this, a, b);
          case 3:
            return G__3097__3.call(this, a, b, c);
          default:
            return G__3097__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3097.cljs$lang$maxFixedArity = 3;
      G__3097.cljs$lang$applyTo = G__3097__4.cljs$lang$applyTo;
      return G__3097
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi = function mapi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__2552__auto___3100 = size;
          var i_3101 = 0;
          while(true) {
            if(i_3101 < n__2552__auto___3100) {
              cljs.core.chunk_append.call(null, b, f.call(null, idx + i_3101, cljs.core._nth.call(null, c, i_3101)));
              var G__3102 = i_3101 + 1;
              i_3101 = G__3102;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), mapi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3974__auto__) {
      var s = temp__3974__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__2552__auto___3103 = size;
        var i_3104 = 0;
        while(true) {
          if(i_3104 < n__2552__auto___3103) {
            var x_3105 = f.call(null, cljs.core._nth.call(null, c, i_3104));
            if(x_3105 == null) {
            }else {
              cljs.core.chunk_append.call(null, b, x_3105)
            }
            var G__3106 = i_3104 + 1;
            i_3104 = G__3106;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keep.call(null, f, cljs.core.chunk_rest.call(null, s)))
      }else {
        var x = f.call(null, cljs.core.first.call(null, s));
        if(x == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s))
        }else {
          return cljs.core.cons.call(null, x, keep.call(null, f, cljs.core.rest.call(null, s)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi = function keepi(idx, coll__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll__$1);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__2552__auto___3113 = size;
          var i_3114 = 0;
          while(true) {
            if(i_3114 < n__2552__auto___3113) {
              var x_3115 = f.call(null, idx + i_3114, cljs.core._nth.call(null, c, i_3114));
              if(x_3115 == null) {
              }else {
                cljs.core.chunk_append.call(null, b, x_3115)
              }
              var G__3116 = i_3114 + 1;
              i_3114 = G__3116;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), keepi.call(null, idx + size, cljs.core.chunk_rest.call(null, s)))
        }else {
          var x = f.call(null, idx, cljs.core.first.call(null, s));
          if(x == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s))
          }else {
            return cljs.core.cons.call(null, x, keepi.call(null, idx + 1, cljs.core.rest.call(null, s)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            return p.call(null, y)
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____$1)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep1__4 = function() {
        var G__3123__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto__ = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto__)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto__
            }
          }())
        };
        var G__3123 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3123__delegate.call(this, x, y, z, args)
        };
        G__3123.cljs$lang$maxFixedArity = 3;
        G__3123.cljs$lang$applyTo = function(arglist__3124) {
          var x = cljs.core.first(arglist__3124);
          var y = cljs.core.first(cljs.core.next(arglist__3124));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3124)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3124)));
          return G__3123__delegate(x, y, z, args)
        };
        G__3123.cljs$lang$arity$variadic = G__3123__delegate;
        return G__3123
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____$1)) {
              var and__3822__auto____$2 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____$2)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____$2
              }
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____$1)) {
              var and__3822__auto____$2 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____$2)) {
                var and__3822__auto____$3 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____$3)) {
                  var and__3822__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____$4)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____$4
                  }
                }else {
                  return and__3822__auto____$3
                }
              }else {
                return and__3822__auto____$2
              }
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep2__4 = function() {
        var G__3125__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto__ = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3107_SHARP_) {
                var and__3822__auto____$1 = p1.call(null, p1__3107_SHARP_);
                if(cljs.core.truth_(and__3822__auto____$1)) {
                  return p2.call(null, p1__3107_SHARP_)
                }else {
                  return and__3822__auto____$1
                }
              }, args)
            }else {
              return and__3822__auto__
            }
          }())
        };
        var G__3125 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3125__delegate.call(this, x, y, z, args)
        };
        G__3125.cljs$lang$maxFixedArity = 3;
        G__3125.cljs$lang$applyTo = function(arglist__3126) {
          var x = cljs.core.first(arglist__3126);
          var y = cljs.core.first(cljs.core.next(arglist__3126));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3126)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3126)));
          return G__3125__delegate(x, y, z, args)
        };
        G__3125.cljs$lang$arity$variadic = G__3125__delegate;
        return G__3125
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____$1)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____$1)) {
              var and__3822__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____$2)) {
                var and__3822__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____$3)) {
                  var and__3822__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____$4)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____$4
                  }
                }else {
                  return and__3822__auto____$3
                }
              }else {
                return and__3822__auto____$2
              }
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto__ = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____$1)) {
              var and__3822__auto____$2 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____$2)) {
                var and__3822__auto____$3 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____$3)) {
                  var and__3822__auto____$4 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____$4)) {
                    var and__3822__auto____$5 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____$5)) {
                      var and__3822__auto____$6 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____$6)) {
                        var and__3822__auto____$7 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____$7)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____$7
                        }
                      }else {
                        return and__3822__auto____$6
                      }
                    }else {
                      return and__3822__auto____$5
                    }
                  }else {
                    return and__3822__auto____$4
                  }
                }else {
                  return and__3822__auto____$3
                }
              }else {
                return and__3822__auto____$2
              }
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())
      };
      var ep3__4 = function() {
        var G__3127__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto__ = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto__)) {
              return cljs.core.every_QMARK_.call(null, function(p1__3108_SHARP_) {
                var and__3822__auto____$1 = p1.call(null, p1__3108_SHARP_);
                if(cljs.core.truth_(and__3822__auto____$1)) {
                  var and__3822__auto____$2 = p2.call(null, p1__3108_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____$2)) {
                    return p3.call(null, p1__3108_SHARP_)
                  }else {
                    return and__3822__auto____$2
                  }
                }else {
                  return and__3822__auto____$1
                }
              }, args)
            }else {
              return and__3822__auto__
            }
          }())
        };
        var G__3127 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3127__delegate.call(this, x, y, z, args)
        };
        G__3127.cljs$lang$maxFixedArity = 3;
        G__3127.cljs$lang$applyTo = function(arglist__3128) {
          var x = cljs.core.first(arglist__3128);
          var y = cljs.core.first(cljs.core.next(arglist__3128));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3128)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3128)));
          return G__3127__delegate(x, y, z, args)
        };
        G__3127.cljs$lang$arity$variadic = G__3127__delegate;
        return G__3127
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__3129__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__3109_SHARP_) {
            return p1__3109_SHARP_.call(null, x)
          }, ps__$1)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__3110_SHARP_) {
            var and__3822__auto__ = p1__3110_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto__)) {
              return p1__3110_SHARP_.call(null, y)
            }else {
              return and__3822__auto__
            }
          }, ps__$1)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__3111_SHARP_) {
            var and__3822__auto__ = p1__3111_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto__)) {
              var and__3822__auto____$1 = p1__3111_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____$1)) {
                return p1__3111_SHARP_.call(null, z)
              }else {
                return and__3822__auto____$1
              }
            }else {
              return and__3822__auto__
            }
          }, ps__$1)
        };
        var epn__4 = function() {
          var G__3130__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto__ = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto__)) {
                return cljs.core.every_QMARK_.call(null, function(p1__3112_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__3112_SHARP_, args)
                }, ps__$1)
              }else {
                return and__3822__auto__
              }
            }())
          };
          var G__3130 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3130__delegate.call(this, x, y, z, args)
          };
          G__3130.cljs$lang$maxFixedArity = 3;
          G__3130.cljs$lang$applyTo = function(arglist__3131) {
            var x = cljs.core.first(arglist__3131);
            var y = cljs.core.first(cljs.core.next(arglist__3131));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3131)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3131)));
            return G__3130__delegate(x, y, z, args)
          };
          G__3130.cljs$lang$arity$variadic = G__3130__delegate;
          return G__3130
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__3129 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3129__delegate.call(this, p1, p2, p3, ps)
    };
    G__3129.cljs$lang$maxFixedArity = 3;
    G__3129.cljs$lang$applyTo = function(arglist__3132) {
      var p1 = cljs.core.first(arglist__3132);
      var p2 = cljs.core.first(cljs.core.next(arglist__3132));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3132)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3132)));
      return G__3129__delegate(p1, p2, p3, ps)
    };
    G__3129.cljs$lang$arity$variadic = G__3129__delegate;
    return G__3129
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto__ = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____$1)) {
            return or__3824__auto____$1
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__3134__delegate = function(x, y, z, args) {
          var or__3824__auto__ = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto__)) {
            return or__3824__auto__
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__3134 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3134__delegate.call(this, x, y, z, args)
        };
        G__3134.cljs$lang$maxFixedArity = 3;
        G__3134.cljs$lang$applyTo = function(arglist__3135) {
          var x = cljs.core.first(arglist__3135);
          var y = cljs.core.first(cljs.core.next(arglist__3135));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3135)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3135)));
          return G__3134__delegate(x, y, z, args)
        };
        G__3134.cljs$lang$arity$variadic = G__3134__delegate;
        return G__3134
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____$1)) {
            return or__3824__auto____$1
          }else {
            var or__3824__auto____$2 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____$2)) {
              return or__3824__auto____$2
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____$1)) {
            return or__3824__auto____$1
          }else {
            var or__3824__auto____$2 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____$2)) {
              return or__3824__auto____$2
            }else {
              var or__3824__auto____$3 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____$3)) {
                return or__3824__auto____$3
              }else {
                var or__3824__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____$4)) {
                  return or__3824__auto____$4
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__3136__delegate = function(x, y, z, args) {
          var or__3824__auto__ = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto__)) {
            return or__3824__auto__
          }else {
            return cljs.core.some.call(null, function(p1__3117_SHARP_) {
              var or__3824__auto____$1 = p1.call(null, p1__3117_SHARP_);
              if(cljs.core.truth_(or__3824__auto____$1)) {
                return or__3824__auto____$1
              }else {
                return p2.call(null, p1__3117_SHARP_)
              }
            }, args)
          }
        };
        var G__3136 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3136__delegate.call(this, x, y, z, args)
        };
        G__3136.cljs$lang$maxFixedArity = 3;
        G__3136.cljs$lang$applyTo = function(arglist__3137) {
          var x = cljs.core.first(arglist__3137);
          var y = cljs.core.first(cljs.core.next(arglist__3137));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3137)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3137)));
          return G__3136__delegate(x, y, z, args)
        };
        G__3136.cljs$lang$arity$variadic = G__3136__delegate;
        return G__3136
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____$1)) {
            return or__3824__auto____$1
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____$1)) {
            return or__3824__auto____$1
          }else {
            var or__3824__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____$2)) {
              return or__3824__auto____$2
            }else {
              var or__3824__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____$3)) {
                return or__3824__auto____$3
              }else {
                var or__3824__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____$4)) {
                  return or__3824__auto____$4
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto__ = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____$1)) {
            return or__3824__auto____$1
          }else {
            var or__3824__auto____$2 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____$2)) {
              return or__3824__auto____$2
            }else {
              var or__3824__auto____$3 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____$3)) {
                return or__3824__auto____$3
              }else {
                var or__3824__auto____$4 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____$4)) {
                  return or__3824__auto____$4
                }else {
                  var or__3824__auto____$5 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____$5)) {
                    return or__3824__auto____$5
                  }else {
                    var or__3824__auto____$6 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____$6)) {
                      return or__3824__auto____$6
                    }else {
                      var or__3824__auto____$7 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____$7)) {
                        return or__3824__auto____$7
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__3138__delegate = function(x, y, z, args) {
          var or__3824__auto__ = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto__)) {
            return or__3824__auto__
          }else {
            return cljs.core.some.call(null, function(p1__3118_SHARP_) {
              var or__3824__auto____$1 = p1.call(null, p1__3118_SHARP_);
              if(cljs.core.truth_(or__3824__auto____$1)) {
                return or__3824__auto____$1
              }else {
                var or__3824__auto____$2 = p2.call(null, p1__3118_SHARP_);
                if(cljs.core.truth_(or__3824__auto____$2)) {
                  return or__3824__auto____$2
                }else {
                  return p3.call(null, p1__3118_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__3138 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3138__delegate.call(this, x, y, z, args)
        };
        G__3138.cljs$lang$maxFixedArity = 3;
        G__3138.cljs$lang$applyTo = function(arglist__3139) {
          var x = cljs.core.first(arglist__3139);
          var y = cljs.core.first(cljs.core.next(arglist__3139));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3139)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3139)));
          return G__3138__delegate(x, y, z, args)
        };
        G__3138.cljs$lang$arity$variadic = G__3138__delegate;
        return G__3138
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__3140__delegate = function(p1, p2, p3, ps) {
      var ps__$1 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__3119_SHARP_) {
            return p1__3119_SHARP_.call(null, x)
          }, ps__$1)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__3120_SHARP_) {
            var or__3824__auto__ = p1__3120_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto__)) {
              return or__3824__auto__
            }else {
              return p1__3120_SHARP_.call(null, y)
            }
          }, ps__$1)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__3121_SHARP_) {
            var or__3824__auto__ = p1__3121_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto__)) {
              return or__3824__auto__
            }else {
              var or__3824__auto____$1 = p1__3121_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____$1)) {
                return or__3824__auto____$1
              }else {
                return p1__3121_SHARP_.call(null, z)
              }
            }
          }, ps__$1)
        };
        var spn__4 = function() {
          var G__3141__delegate = function(x, y, z, args) {
            var or__3824__auto__ = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto__)) {
              return or__3824__auto__
            }else {
              return cljs.core.some.call(null, function(p1__3122_SHARP_) {
                return cljs.core.some.call(null, p1__3122_SHARP_, args)
              }, ps__$1)
            }
          };
          var G__3141 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3141__delegate.call(this, x, y, z, args)
          };
          G__3141.cljs$lang$maxFixedArity = 3;
          G__3141.cljs$lang$applyTo = function(arglist__3142) {
            var x = cljs.core.first(arglist__3142);
            var y = cljs.core.first(cljs.core.next(arglist__3142));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3142)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3142)));
            return G__3141__delegate(x, y, z, args)
          };
          G__3141.cljs$lang$arity$variadic = G__3141__delegate;
          return G__3141
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__3140 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3140__delegate.call(this, p1, p2, p3, ps)
    };
    G__3140.cljs$lang$maxFixedArity = 3;
    G__3140.cljs$lang$applyTo = function(arglist__3143) {
      var p1 = cljs.core.first(arglist__3143);
      var p2 = cljs.core.first(cljs.core.next(arglist__3143));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3143)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3143)));
      return G__3140__delegate(p1, p2, p3, ps)
    };
    G__3140.cljs$lang$arity$variadic = G__3140__delegate;
    return G__3140
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
          var c = cljs.core.chunk_first.call(null, s);
          var size = cljs.core.count.call(null, c);
          var b = cljs.core.chunk_buffer.call(null, size);
          var n__2552__auto___3144 = size;
          var i_3145 = 0;
          while(true) {
            if(i_3145 < n__2552__auto___3144) {
              cljs.core.chunk_append.call(null, b, f.call(null, cljs.core._nth.call(null, c, i_3145)));
              var G__3146 = i_3145 + 1;
              i_3145 = G__3146;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), map.call(null, f, cljs.core.chunk_rest.call(null, s)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s)), map.call(null, f, cljs.core.rest.call(null, s)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto__ = s1;
        if(and__3822__auto__) {
          return s2
        }else {
          return and__3822__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      var s3 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3822__auto__ = s1;
        if(and__3822__auto__) {
          var and__3822__auto____$1 = s2;
          if(and__3822__auto____$1) {
            return s3
          }else {
            return and__3822__auto____$1
          }
        }else {
          return and__3822__auto__
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1), cljs.core.first.call(null, s2), cljs.core.first.call(null, s3)), map.call(null, f, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2), cljs.core.rest.call(null, s3)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__3147__delegate = function(f, c1, c2, c3, colls) {
      var step = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss), step.call(null, map.call(null, cljs.core.rest, ss)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__3133_SHARP_) {
        return cljs.core.apply.call(null, f, p1__3133_SHARP_)
      }, step.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__3147 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3147__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__3147.cljs$lang$maxFixedArity = 4;
    G__3147.cljs$lang$applyTo = function(arglist__3148) {
      var f = cljs.core.first(arglist__3148);
      var c1 = cljs.core.first(cljs.core.next(arglist__3148));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3148)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3148))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3148))));
      return G__3147__delegate(f, c1, c2, c3, colls)
    };
    G__3147.cljs$lang$arity$variadic = G__3147__delegate;
    return G__3147
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take.call(null, n - 1, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step = function(n__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3822__auto__ = n__$1 > 0;
        if(and__3822__auto__) {
          return s
        }else {
          return and__3822__auto__
        }
      }())) {
        var G__3149 = n__$1 - 1;
        var G__3150 = cljs.core.rest.call(null, s);
        n__$1 = G__3149;
        coll__$1 = G__3150;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s = cljs.core.seq.call(null, coll);
  var lead = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead) {
      var G__3151 = cljs.core.next.call(null, s);
      var G__3152 = cljs.core.next.call(null, lead);
      s = G__3151;
      lead = G__3152;
      continue
    }else {
      return s
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step = function(pred__$1, coll__$1) {
    while(true) {
      var s = cljs.core.seq.call(null, coll__$1);
      if(cljs.core.truth_(function() {
        var and__3822__auto__ = s;
        if(and__3822__auto__) {
          return pred__$1.call(null, cljs.core.first.call(null, s))
        }else {
          return and__3822__auto__
        }
      }())) {
        var G__3153 = pred__$1;
        var G__3154 = cljs.core.rest.call(null, s);
        pred__$1 = G__3153;
        coll__$1 = G__3154;
        continue
      }else {
        return s
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3974__auto__) {
      var s = temp__3974__auto__;
      return cljs.core.concat.call(null, s, cycle.call(null, s))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1 = cljs.core.seq.call(null, c1);
      var s2 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3822__auto__ = s1;
        if(and__3822__auto__) {
          return s2
        }else {
          return and__3822__auto__
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1), cljs.core.cons.call(null, cljs.core.first.call(null, s2), interleave.call(null, cljs.core.rest.call(null, s1), cljs.core.rest.call(null, s2))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__3155__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss)))
        }else {
          return null
        }
      }, null)
    };
    var G__3155 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3155__delegate.call(this, c1, c2, colls)
    };
    G__3155.cljs$lang$maxFixedArity = 2;
    G__3155.cljs$lang$applyTo = function(arglist__3156) {
      var c1 = cljs.core.first(arglist__3156);
      var c2 = cljs.core.first(cljs.core.next(arglist__3156));
      var colls = cljs.core.rest(cljs.core.next(arglist__3156));
      return G__3155__delegate(c1, c2, colls)
    };
    G__3155.cljs$lang$arity$variadic = G__3155__delegate;
    return G__3155
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat = function cat(coll, colls__$1) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3971__auto__) {
        var coll__$1 = temp__3971__auto__;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__$1), cat.call(null, cljs.core.rest.call(null, coll__$1), colls__$1))
      }else {
        if(cljs.core.seq.call(null, colls__$1)) {
          return cat.call(null, cljs.core.first.call(null, colls__$1), cljs.core.rest.call(null, colls__$1))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__3157__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__3157 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__3157__delegate.call(this, f, coll, colls)
    };
    G__3157.cljs$lang$maxFixedArity = 2;
    G__3157.cljs$lang$applyTo = function(arglist__3158) {
      var f = cljs.core.first(arglist__3158);
      var coll = cljs.core.first(cljs.core.next(arglist__3158));
      var colls = cljs.core.rest(cljs.core.next(arglist__3158));
      return G__3157__delegate(f, coll, colls)
    };
    G__3157.cljs$lang$arity$variadic = G__3157__delegate;
    return G__3157
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3974__auto__) {
      var s = temp__3974__auto__;
      if(cljs.core.chunked_seq_QMARK_.call(null, s)) {
        var c = cljs.core.chunk_first.call(null, s);
        var size = cljs.core.count.call(null, c);
        var b = cljs.core.chunk_buffer.call(null, size);
        var n__2552__auto___3159 = size;
        var i_3160 = 0;
        while(true) {
          if(i_3160 < n__2552__auto___3159) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c, i_3160)))) {
              cljs.core.chunk_append.call(null, b, cljs.core._nth.call(null, c, i_3160))
            }else {
            }
            var G__3161 = i_3160 + 1;
            i_3160 = G__3161;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b), filter.call(null, pred, cljs.core.chunk_rest.call(null, s)))
      }else {
        var f = cljs.core.first.call(null, s);
        var r = cljs.core.rest.call(null, s);
        if(cljs.core.truth_(pred.call(null, f))) {
          return cljs.core.cons.call(null, f, filter.call(null, pred, r))
        }else {
          return filter.call(null, pred, r)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__3162_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__3162_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__3164 = to;
    if(G__3164) {
      if(function() {
        var or__3824__auto__ = G__3164.cljs$lang$protocol_mask$partition1$ & 4;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__3164.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__3164.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__3164)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__3164)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__3165__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__3165 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__3165__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__3165.cljs$lang$maxFixedArity = 4;
    G__3165.cljs$lang$applyTo = function(arglist__3166) {
      var f = cljs.core.first(arglist__3166);
      var c1 = cljs.core.first(cljs.core.next(arglist__3166));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3166)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3166))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3166))));
      return G__3165__delegate(f, c1, c2, c3, colls)
    };
    G__3165.cljs$lang$arity$variadic = G__3165__delegate;
    return G__3165
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, cljs.core.drop.call(null, step, s)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        var p = cljs.core.take.call(null, n, s);
        if(n === cljs.core.count.call(null, p)) {
          return cljs.core.cons.call(null, p, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel = cljs.core.lookup_sentinel;
    var m__$1 = m;
    var ks__$1 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__$1) {
        var m__$2 = cljs.core._lookup.call(null, m__$1, cljs.core.first.call(null, ks__$1), sentinel);
        if(sentinel === m__$2) {
          return not_found
        }else {
          var G__3167 = sentinel;
          var G__3168 = m__$2;
          var G__3169 = cljs.core.next.call(null, ks__$1);
          sentinel = G__3167;
          m__$1 = G__3168;
          ks__$1 = G__3169;
          continue
        }
      }else {
        return m__$1
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__3170, v) {
  var vec__3172 = p__3170;
  var k = cljs.core.nth.call(null, vec__3172, 0, null);
  var ks = cljs.core.nthnext.call(null, vec__3172, 1);
  if(cljs.core.truth_(ks)) {
    return cljs.core.assoc.call(null, m, k, assoc_in.call(null, cljs.core._lookup.call(null, m, k, null), ks, v))
  }else {
    return cljs.core.assoc.call(null, m, k, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__3173, f, args) {
    var vec__3175 = p__3173;
    var k = cljs.core.nth.call(null, vec__3175, 0, null);
    var ks = cljs.core.nthnext.call(null, vec__3175, 1);
    if(cljs.core.truth_(ks)) {
      return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k, null), ks, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k, null), args))
    }
  };
  var update_in = function(m, p__3173, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__3173, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__3176) {
    var m = cljs.core.first(arglist__3176);
    var p__3173 = cljs.core.first(cljs.core.next(arglist__3176));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3176)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3176)));
    return update_in__delegate(m, p__3173, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
goog.provide("cljs.core.Vector");
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var new_array = self__.array.slice();
  new_array[k] = v;
  return new cljs.core.Vector(self__.meta, new_array, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__3178 = null;
  var G__3178__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3178__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3178 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3178__2.call(this, self__, k);
      case 3:
        return G__3178__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3178
}();
cljs.core.Vector.prototype.apply = function(self__, args3177) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3177.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  var new_array = self__.array.slice();
  new_array.push(o);
  return new cljs.core.Vector(self__.meta, new_array, null)
};
cljs.core.Vector.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, self__.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, self__.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.array.length > 0) {
    var vector_seq = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < self__.array.length) {
          return cljs.core.cons.call(null, self__.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  var count = self__.array.length;
  if(count > 0) {
    return self__.array[count - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.array.length > 0) {
    var new_array = self__.array.slice();
    new_array.pop();
    return new cljs.core.Vector(self__.meta, new_array, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.Vector(meta__$1, self__.array, self__.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = 0 <= n;
    if(and__3822__auto__) {
      return n < self__.array.length
    }else {
      return and__3822__auto__
    }
  }()) {
    return self__.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = 0 <= n;
    if(and__3822__auto__) {
      return n < self__.array.length
    }else {
      return and__3822__auto__
    }
  }()) {
    return self__.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, self__.meta)
};
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
goog.provide("cljs.core.VectorNode");
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode.cljs$lang$ctorPrWriter = function(this__2333__auto__, writer__2334__auto__, opts__2335__auto__) {
  return cljs.core._write.call(null, writer__2334__auto__, "cljs.core/VectorNode")
};
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt = pv.cnt;
  if(cnt < 32) {
    return 0
  }else {
    return cnt - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll = level;
  var ret = node;
  while(true) {
    if(ll === 0) {
      return ret
    }else {
      var embed = ret;
      var r = cljs.core.pv_fresh_node.call(null, edit);
      var _ = cljs.core.pv_aset.call(null, r, 0, embed);
      var G__3179 = ll - 5;
      var G__3180 = r;
      ll = G__3179;
      ret = G__3180;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret = cljs.core.pv_clone_node.call(null, parent);
  var subidx = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret, subidx, tailnode);
    return ret
  }else {
    var child = cljs.core.pv_aget.call(null, parent, subidx);
    if(!(child == null)) {
      var node_to_insert = push_tail.call(null, pv, level - 5, child, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }else {
      var node_to_insert = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret, subidx, node_to_insert);
      return ret
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto__ = 0 <= i;
    if(and__3822__auto__) {
      return i < pv.cnt
    }else {
      return and__3822__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node = pv.root;
      var level = pv.shift;
      while(true) {
        if(level > 0) {
          var G__3181 = cljs.core.pv_aget.call(null, node, i >>> level & 31);
          var G__3182 = level - 5;
          node = G__3181;
          level = G__3182;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret, i & 31, val);
    return ret
  }else {
    var subidx = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret, subidx, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx), i, val));
    return ret
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx));
    if(function() {
      var and__3822__auto__ = new_child == null;
      if(and__3822__auto__) {
        return subidx === 0
      }else {
        return and__3822__auto__
      }
    }()) {
      return null
    }else {
      var ret = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret, subidx, new_child);
      return ret
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret, subidx, null);
        return ret
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentVector");
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientVector(self__.cnt, self__.shift, cljs.core.tv_editable_root.call(null, self__.root), cljs.core.tv_editable_tail.call(null, self__.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = 0 <= k;
    if(and__3822__auto__) {
      return k < self__.cnt
    }else {
      return and__3822__auto__
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail = self__.tail.slice();
      new_tail[k & 31] = v;
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, self__.root, new_tail, null)
    }else {
      return new cljs.core.PersistentVector(self__.meta, self__.cnt, self__.shift, cljs.core.do_assoc.call(null, coll, self__.shift, self__.root, k, v), self__.tail, null)
    }
  }else {
    if(k === self__.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(self__.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__3184 = null;
  var G__3184__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3184__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3184 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3184__2.call(this, self__, k);
      case 3:
        return G__3184__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3184
}();
cljs.core.PersistentVector.prototype.apply = function(self__, args3183) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3183.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var self__ = this;
  var step_init = [0, init];
  var i = 0;
  while(true) {
    if(i < self__.cnt) {
      var arr = cljs.core.array_for.call(null, v, i);
      var len = arr.length;
      var init__$1 = function() {
        var j = 0;
        var init__$1 = step_init[1];
        while(true) {
          if(j < len) {
            var init__$2 = f.call(null, init__$1, j + i, arr[j]);
            if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
              return init__$2
            }else {
              var G__3185 = j + 1;
              var G__3186 = init__$2;
              j = G__3185;
              init__$1 = G__3186;
              continue
            }
          }else {
            step_init[0] = len;
            step_init[1] = init__$1;
            return init__$1
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
        return cljs.core.deref.call(null, init__$1)
      }else {
        var G__3187 = i + step_init[0];
        i = G__3187;
        continue
      }
    }else {
      return step_init[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(self__.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail = self__.tail.slice();
    new_tail.push(o);
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, self__.shift, self__.root, new_tail, null)
  }else {
    var root_overflow_QMARK_ = self__.cnt >>> 5 > 1 << self__.shift;
    var new_shift = root_overflow_QMARK_ ? self__.shift + 5 : self__.shift;
    var new_root = root_overflow_QMARK_ ? function() {
      var n_r = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r, 0, self__.root);
      cljs.core.pv_aset.call(null, n_r, 1, cljs.core.new_path.call(null, null, self__.shift, new cljs.core.VectorNode(null, self__.tail)));
      return n_r
    }() : cljs.core.push_tail.call(null, coll, self__.shift, self__.root, new cljs.core.VectorNode(null, self__.tail));
    return new cljs.core.PersistentVector(self__.meta, self__.cnt + 1, new_shift, new_root, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return new cljs.core.RSeq(coll, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, self__.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === self__.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
    }else {
      if(1 < self__.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(self__.meta, self__.cnt - 1, self__.shift, self__.root, self__.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail = cljs.core.array_for.call(null, coll, self__.cnt - 2);
          var nr = cljs.core.pop_tail.call(null, coll, self__.shift, self__.root);
          var new_root = nr == null ? cljs.core.PersistentVector.EMPTY_NODE : nr;
          var cnt_1 = self__.cnt - 1;
          if(function() {
            var and__3822__auto__ = 5 < self__.shift;
            if(and__3822__auto__) {
              return cljs.core.pv_aget.call(null, new_root, 1) == null
            }else {
              return and__3822__auto__
            }
          }()) {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift - 5, cljs.core.pv_aget.call(null, new_root, 0), new_tail, null)
          }else {
            return new cljs.core.PersistentVector(self__.meta, cnt_1, self__.shift, new_root, new_tail, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentVector(meta__$1, self__.cnt, self__.shift, self__.root, self__.tail, self__.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = 0 <= n;
    if(and__3822__auto__) {
      return n < self__.cnt
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l = xs.length;
  var xs__$1 = no_clone === true ? xs : xs.slice();
  if(l < 32) {
    return new cljs.core.PersistentVector(null, l, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__$1, null)
  }else {
    var node = xs__$1.slice(0, 32);
    var v = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node, null);
    var i = 32;
    var out = cljs.core._as_transient.call(null, v);
    while(true) {
      if(i < l) {
        var G__3188 = i + 1;
        var G__3189 = cljs.core.conj_BANG_.call(null, out, xs__$1[i]);
        i = G__3188;
        out = G__3189;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__3190) {
    var args = cljs.core.seq(arglist__3190);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
goog.provide("cljs.core.ChunkedSeq");
cljs.core.ChunkedSeq = function(vec, node, i, off, meta, __hash) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition0$ = 31719660;
  this.cljs$lang$protocol_mask$partition1$ = 1536
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return null
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return self__.node[self__.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.off + 1 < self__.node.length) {
    var s = cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off + 1);
    if(s == null) {
      return cljs.core.List.EMPTY
    }else {
      return s
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return null
  }else {
    return s
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var self__ = this;
  return cljs.core.chunked_seq.call(null, self__.vec, self__.node, self__.i, self__.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, self__.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.array_chunk.call(null, self__.node, self__.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var self__ = this;
  var l = self__.node.length;
  var s = self__.i + l < cljs.core._count.call(null, self__.vec) ? cljs.core.chunked_seq.call(null, self__.vec, self__.i + l, 0) : null;
  if(s == null) {
    return cljs.core.List.EMPTY
  }else {
    return s
  }
};
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta, null)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
goog.provide("cljs.core.Subvec");
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var self__ = this;
  var v_pos = self__.start + key;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc.call(null, self__.v, v_pos, val), self__.start, self__.end > v_pos + 1 ? self__.end : v_pos + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__3192 = null;
  var G__3192__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3192__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3192 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3192__2.call(this, self__, k);
      case 3:
        return G__3192__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3192
}();
cljs.core.Subvec.prototype.apply = function(self__, args3191) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3191.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, self__.meta, cljs.core._assoc_n.call(null, self__.v, self__.end, o), self__.start, self__.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start__$1) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, coll, f, start__$1)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var subvec_seq = function subvec_seq(i) {
    if(i === self__.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, self__.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq.call(null, self__.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.end - self__.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(self__.start === self__.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return cljs.core.build_subvec.call(null, self__.meta, self__.v, self__.start, self__.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var self__ = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return cljs.core.build_subvec.call(null, meta__$1, self__.v, self__.start, self__.end, self__.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  return cljs.core._nth.call(null, self__.v, self__.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, self__.meta)
};
cljs.core.build_subvec = function build_subvec(meta, v, start, end, __hash) {
  var c = cljs.core.count.call(null, v);
  if(function() {
    var or__3824__auto__ = start < 0;
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      var or__3824__auto____$1 = end < 0;
      if(or__3824__auto____$1) {
        return or__3824__auto____$1
      }else {
        var or__3824__auto____$2 = start > c;
        if(or__3824__auto____$2) {
          return or__3824__auto____$2
        }else {
          return end > c
        }
      }
    }
  }()) {
    throw new Error("Index out of bounds");
  }else {
  }
  return new cljs.core.Subvec(meta, v, start, end, __hash)
};
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return cljs.core.build_subvec.call(null, null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret, 0, tl.length);
  return ret
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret, subidx, level === 5 ? tail_node : function() {
    var child = cljs.core.pv_aget.call(null, ret, subidx);
    if(!(child == null)) {
      return tv_push_tail.call(null, tv, level - 5, child, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__$1 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx));
    if(function() {
      var and__3822__auto__ = new_child == null;
      if(and__3822__auto__) {
        return subidx === 0
      }else {
        return and__3822__auto__
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__$1, subidx, new_child);
      return node__$1
    }
  }else {
    if(subidx === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__$1, subidx, null);
        return node__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto__ = 0 <= i;
    if(and__3822__auto__) {
      return i < tv.cnt
    }else {
      return and__3822__auto__
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root = tv.root;
      var node = root;
      var level = tv.shift;
      while(true) {
        if(level > 0) {
          var G__3193 = cljs.core.tv_ensure_editable.call(null, root.edit, cljs.core.pv_aget.call(null, node, i >>> level & 31));
          var G__3194 = level - 5;
          node = G__3193;
          level = G__3194;
          continue
        }else {
          return node.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
goog.provide("cljs.core.TransientVector");
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 88
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__3196 = null;
  var G__3196__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3196__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3196 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3196__2.call(this, self__, k);
      case 3:
        return G__3196__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3196
}();
cljs.core.TransientVector.prototype.apply = function(self__, args3195) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3195.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var self__ = this;
  if(self__.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = 0 <= n;
    if(and__3822__auto__) {
      return n < self__.cnt
    }else {
      return and__3822__auto__
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.root.edit) {
    return self__.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var self__ = this;
  if(self__.root.edit) {
    if(function() {
      var and__3822__auto__ = 0 <= n;
      if(and__3822__auto__) {
        return n < self__.cnt
      }else {
        return and__3822__auto__
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        self__.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root = function go(level, node) {
          var node__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__$1, n & 31, val);
            return node__$1
          }else {
            var subidx = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__$1, subidx, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__$1, subidx)));
            return node__$1
          }
        }.call(null, self__.shift, self__.root);
        self__.root = new_root;
        return tcoll
      }
    }else {
      if(n === self__.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(self__.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === self__.cnt) {
        self__.cnt = 0;
        return tcoll
      }else {
        if((self__.cnt - 1 & 31) > 0) {
          self__.cnt = self__.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail = cljs.core.editable_array_for.call(null, tcoll, self__.cnt - 2);
            var new_root = function() {
              var nr = cljs.core.tv_pop_tail.call(null, tcoll, self__.shift, self__.root);
              if(!(nr == null)) {
                return nr
              }else {
                return new cljs.core.VectorNode(self__.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto__ = 5 < self__.shift;
              if(and__3822__auto__) {
                return cljs.core.pv_aget.call(null, new_root, 1) == null
              }else {
                return and__3822__auto__
              }
            }()) {
              var new_root__$1 = cljs.core.tv_ensure_editable.call(null, self__.root.edit, cljs.core.pv_aget.call(null, new_root, 0));
              self__.root = new_root__$1;
              self__.shift = self__.shift - 5;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }else {
              self__.root = new_root;
              self__.cnt = self__.cnt - 1;
              self__.tail = new_tail;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(self__.root.edit) {
    if(self__.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      self__.tail[self__.cnt & 31] = o;
      self__.cnt = self__.cnt + 1;
      return tcoll
    }else {
      var tail_node = new cljs.core.VectorNode(self__.root.edit, self__.tail);
      var new_tail = cljs.core.make_array.call(null, 32);
      new_tail[0] = o;
      self__.tail = new_tail;
      if(self__.cnt >>> 5 > 1 << self__.shift) {
        var new_root_array = cljs.core.make_array.call(null, 32);
        var new_shift = self__.shift + 5;
        new_root_array[0] = self__.root;
        new_root_array[1] = cljs.core.new_path.call(null, self__.root.edit, self__.shift, tail_node);
        self__.root = new cljs.core.VectorNode(self__.root.edit, new_root_array);
        self__.shift = new_shift;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }else {
        var new_root = cljs.core.tv_push_tail.call(null, tcoll, self__.shift, self__.root, tail_node);
        self__.root = new_root;
        self__.cnt = self__.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(self__.root.edit) {
    self__.root.edit = null;
    var len = self__.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail = cljs.core.make_array.call(null, len);
    cljs.core.array_copy.call(null, self__.tail, 0, trimmed_tail, 0, len);
    return new cljs.core.PersistentVector(null, self__.cnt, self__.shift, self__.root, trimmed_tail, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
goog.provide("cljs.core.PersistentQueueSeq");
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._first.call(null, self__.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  var temp__3971__auto__ = cljs.core.next.call(null, self__.front);
  if(temp__3971__auto__) {
    var f1 = temp__3971__auto__;
    return new cljs.core.PersistentQueueSeq(self__.meta, f1, self__.rear, null)
  }else {
    if(self__.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(self__.meta, self__.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueueSeq(meta__$1, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
goog.provide("cljs.core.PersistentQueue");
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, self__.front, cljs.core.conj.call(null, function() {
      var or__3824__auto__ = self__.rear;
      if(cljs.core.truth_(or__3824__auto__)) {
        return or__3824__auto__
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(self__.meta, self__.count + 1, cljs.core.conj.call(null, self__.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  var rear__$1 = cljs.core.seq.call(null, self__.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto__ = self__.front;
    if(cljs.core.truth_(or__3824__auto__)) {
      return or__3824__auto__
    }else {
      return rear__$1
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, self__.front, cljs.core.seq.call(null, rear__$1), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var self__ = this;
  if(cljs.core.truth_(self__.front)) {
    var temp__3971__auto__ = cljs.core.next.call(null, self__.front);
    if(temp__3971__auto__) {
      var f1 = temp__3971__auto__;
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, f1, self__.rear, null)
    }else {
      return new cljs.core.PersistentQueue(self__.meta, self__.count - 1, cljs.core.seq.call(null, self__.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentQueue(meta__$1, self__.count, self__.front, self__.rear, self__.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
goog.provide("cljs.core.NeverEquiv");
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return false
};
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len = array.length;
  var i = 0;
  while(true) {
    if(i < len) {
      if(k === array[i]) {
        return i
      }else {
        var G__3197 = i + incr;
        i = G__3197;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__$1 = cljs.core.hash.call(null, a);
  var b__$1 = cljs.core.hash.call(null, b);
  if(a__$1 < b__$1) {
    return-1
  }else {
    if(a__$1 > b__$1) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks = m.keys;
  var len = ks.length;
  var so = m.strobj;
  var out = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i = 0;
  var out__$1 = cljs.core.transient$.call(null, out);
  while(true) {
    if(i < len) {
      var k__$1 = ks[i];
      var G__3198 = i + 1;
      var G__3199 = cljs.core.assoc_BANG_.call(null, out__$1, k__$1, so[k__$1]);
      i = G__3198;
      out__$1 = G__3199;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__$1, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj = {};
  var l = ks.length;
  var i_3201 = 0;
  while(true) {
    if(i_3201 < l) {
      var k_3202 = ks[i_3201];
      new_obj[k_3202] = obj[k_3202];
      var G__3203 = i_3201 + 1;
      i_3201 = G__3203;
      continue
    }else {
    }
    break
  }
  return new_obj
};
goog.provide("cljs.core.ObjMap");
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = goog.isString(k);
    if(and__3822__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3822__auto__
    }
  }()) {
    return self__.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3824__auto__ = self__.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return self__.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)) {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        new_strobj[k] = v;
        return new cljs.core.ObjMap(self__.meta, self__.keys, new_strobj, self__.update_count + 1, null)
      }else {
        var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
        var new_keys = self__.keys.slice();
        new_strobj[k] = v;
        new_keys.push(k);
        return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = goog.isString(k);
    if(and__3822__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3822__auto__
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__3205 = null;
  var G__3205__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3205__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3205 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3205__2.call(this, self__, k);
      case 3:
        return G__3205__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3205
}();
cljs.core.ObjMap.prototype.apply = function(self__, args3204) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3204.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.keys.length;
  var keys__$1 = self__.keys.sort(cljs.core.obj_map_compare_keys);
  var init__$1 = init;
  while(true) {
    if(cljs.core.seq.call(null, keys__$1)) {
      var k = cljs.core.first.call(null, keys__$1);
      var init__$2 = f.call(null, init__$1, k, self__.strobj[k]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__3206 = cljs.core.rest.call(null, keys__$1);
        var G__3207 = init__$2;
        keys__$1 = G__3206;
        init__$1 = G__3207;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__3200_SHARP_) {
      return cljs.core.vector.call(null, p1__3200_SHARP_, self__.strobj[p1__3200_SHARP_])
    }, self__.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ObjMap(meta__$1, self__.keys, self__.strobj, self__.update_count, self__.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, self__.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(function() {
    var and__3822__auto__ = goog.isString(k);
    if(and__3822__auto__) {
      return!(cljs.core.scan_array.call(null, 1, k, self__.keys) == null)
    }else {
      return and__3822__auto__
    }
  }()) {
    var new_keys = self__.keys.slice();
    var new_strobj = cljs.core.obj_clone.call(null, self__.strobj, self__.keys);
    new_keys.splice(cljs.core.scan_array.call(null, 1, k, new_keys), 1);
    cljs.core.js_delete.call(null, new_strobj, k);
    return new cljs.core.ObjMap(self__.meta, new_keys, new_strobj, self__.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
goog.provide("cljs.core.HashMap");
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var bucket = self__.hashobj[cljs.core.hash.call(null, k)];
  var i = cljs.core.truth_(bucket) ? cljs.core.scan_array.call(null, 2, k, bucket) : null;
  if(cljs.core.truth_(i)) {
    return bucket[i + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var h = cljs.core.hash.call(null, k);
  var bucket = self__.hashobj[h];
  if(cljs.core.truth_(bucket)) {
    var new_bucket = bucket.slice();
    var new_hashobj = goog.object.clone(self__.hashobj);
    new_hashobj[h] = new_bucket;
    var temp__3971__auto__ = cljs.core.scan_array.call(null, 2, k, new_bucket);
    if(cljs.core.truth_(temp__3971__auto__)) {
      var i = temp__3971__auto__;
      new_bucket[i + 1] = v;
      return new cljs.core.HashMap(self__.meta, self__.count, new_hashobj, null)
    }else {
      new_bucket.push(k, v);
      return new cljs.core.HashMap(self__.meta, self__.count + 1, new_hashobj, null)
    }
  }else {
    var new_hashobj = goog.object.clone(self__.hashobj);
    new_hashobj[h] = [k, v];
    return new cljs.core.HashMap(self__.meta, self__.count + 1, new_hashobj, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  var bucket = self__.hashobj[cljs.core.hash.call(null, k)];
  var i = cljs.core.truth_(bucket) ? cljs.core.scan_array.call(null, 2, k, bucket) : null;
  if(cljs.core.truth_(i)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__3210 = null;
  var G__3210__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3210__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3210 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3210__2.call(this, self__, k);
      case 3:
        return G__3210__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3210
}();
cljs.core.HashMap.prototype.apply = function(self__, args3209) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3209.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.count > 0) {
    var hashes = cljs.core.js_keys.call(null, self__.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__3208_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, self__.hashobj[p1__3208_SHARP_]))
    }, hashes)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.HashMap(meta__$1, self__.count, self__.hashobj, self__.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, self__.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var h = cljs.core.hash.call(null, k);
  var bucket = self__.hashobj[h];
  var i = cljs.core.truth_(bucket) ? cljs.core.scan_array.call(null, 2, k, bucket) : null;
  if(cljs.core.not.call(null, i)) {
    return coll
  }else {
    var new_hashobj = goog.object.clone(self__.hashobj);
    if(3 > bucket.length) {
      cljs.core.js_delete.call(null, new_hashobj, h)
    }else {
      var new_bucket_3211 = bucket.slice();
      new_bucket_3211.splice(i, 2);
      new_hashobj[h] = new_bucket_3211
    }
    return new cljs.core.HashMap(self__.meta, self__.count - 1, new_hashobj, null)
  }
};
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i < len) {
      var G__3212 = i + 1;
      var G__3213 = cljs.core.assoc.call(null, out, ks[i], vs[i]);
      i = G__3212;
      out = G__3213;
      continue
    }else {
      return out
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr = m.arr;
  var len = arr.length;
  var i = 0;
  while(true) {
    if(len <= i) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr[i], k)) {
        return i
      }else {
        if("\ufdd0'else") {
          var G__3214 = i + 2;
          i = G__3214;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
goog.provide("cljs.core.PersistentArrayMap");
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientArrayMap({}, self__.arr.length, self__.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    return not_found
  }else {
    return self__.arr[idx + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx === -1) {
    if(self__.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt + 1, function() {
        var G__3216 = self__.arr.slice();
        G__3216.push(k);
        G__3216.push(v);
        return G__3216
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === self__.arr[idx + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt, function() {
          var G__3217 = self__.arr.slice();
          G__3217[idx + 1] = v;
          return G__3217
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__3218 = null;
  var G__3218__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3218__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3218 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3218__2.call(this, self__, k);
      case 3:
        return G__3218__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3218
}();
cljs.core.PersistentArrayMap.prototype.apply = function(self__, args3215) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3215.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = f.call(null, init__$1, self__.arr[i], self__.arr[i + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__3219 = i + 2;
        var G__3220 = init__$2;
        i = G__3219;
        init__$1 = G__3220;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var len = self__.arr.length;
    var array_map_seq = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([self__.arr[i], self__.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentArrayMap(meta__$1, self__.cnt, self__.arr, self__.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, self__.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var idx = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx >= 0) {
    var len = self__.arr.length;
    var new_len = len - 2;
    if(new_len === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr = cljs.core.make_array.call(null, new_len);
      var s = 0;
      var d = 0;
      while(true) {
        if(s >= len) {
          return new cljs.core.PersistentArrayMap(self__.meta, self__.cnt - 1, new_arr, null)
        }else {
          if(cljs.core._EQ_.call(null, k, self__.arr[s])) {
            var G__3221 = s + 2;
            var G__3222 = d;
            s = G__3221;
            d = G__3222;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr[d] = self__.arr[s];
              new_arr[d + 1] = self__.arr[s + 1];
              var G__3223 = s + 2;
              var G__3224 = d + 2;
              s = G__3223;
              d = G__3224;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len = cljs.core.count.call(null, ks);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__3225 = i + 1;
      var G__3226 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__3225;
      out = G__3226;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientArrayMap");
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx >= 0) {
      self__.arr[idx] = self__.arr[self__.len - 2];
      self__.arr[idx + 1] = self__.arr[self__.len - 1];
      var G__3227_3229 = self__.arr;
      G__3227_3229.pop();
      G__3227_3229.pop();
      self__.len = self__.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx === -1) {
      if(self__.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        self__.len = self__.len + 2;
        self__.arr.push(key);
        self__.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, self__.len, self__.arr), key, val)
      }
    }else {
      if(val === self__.arr[idx + 1]) {
        return tcoll
      }else {
        self__.arr[idx + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    if(function() {
      var G__3228 = o;
      if(G__3228) {
        if(function() {
          var or__3824__auto__ = G__3228.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__3228.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__3228.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3228)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3228)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__3971__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__3971__auto__)) {
          var e = temp__3971__auto__;
          var G__3230 = cljs.core.next.call(null, es);
          var G__3231 = tcoll__$1.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__$1, cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__3230;
          tcoll__$1 = G__3231;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    self__.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, self__.len, 2), self__.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    var idx = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx === -1) {
      return not_found
    }else {
      return self__.arr[idx + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  if(cljs.core.truth_(self__.editable_QMARK_)) {
    return cljs.core.quot.call(null, self__.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i = 0;
  while(true) {
    if(i < len) {
      var G__3232 = cljs.core.assoc_BANG_.call(null, out, arr[i], arr[i + 1]);
      var G__3233 = i + 2;
      out = G__3232;
      i = G__3233;
      continue
    }else {
      return out
    }
    break
  }
};
goog.provide("cljs.core.Box");
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2333__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box.cljs$lang$ctorPrWriter = function(this__2333__auto__, writer__2334__auto__, opts__2335__auto__) {
  return cljs.core._write.call(null, writer__2334__auto__, "cljs.core/Box")
};
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__3236 = arr.slice();
    G__3236[i] = a;
    return G__3236
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__3237 = arr.slice();
    G__3237[i] = a;
    G__3237[j] = b;
    return G__3237
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr, 2 * i, new_arr.length - 2 * i);
  return new_arr
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    return editable
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable = inode.ensure_editable(edit);
    editable.arr[i] = a;
    editable.arr[j] = b;
    return editable
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len = arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var init__$2 = function() {
        var k = arr[i];
        if(!(k == null)) {
          return f.call(null, init__$1, k, arr[i + 1])
        }else {
          var node = arr[i + 1];
          if(!(node == null)) {
            return node.kv_reduce(f, init__$1)
          }else {
            return init__$1
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
        return cljs.core.deref.call(null, init__$2)
      }else {
        var G__3238 = i + 2;
        var G__3239 = init__$2;
        i = G__3238;
        init__$1 = G__3239;
        continue
      }
    }else {
      return init__$1
    }
    break
  }
};
goog.provide("cljs.core.BitmapIndexedNode");
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var self__ = this;
  var inode = this;
  if(self__.bitmap === bit) {
    return null
  }else {
    var editable = inode.ensure_editable(e);
    var earr = editable.arr;
    var len = earr.length;
    editable.bitmap = bit ^ editable.bitmap;
    cljs.core.array_copy.call(null, earr, 2 * (i + 1), earr, 2 * i, len - 2 * (i + 1));
    earr[len - 2] = null;
    earr[len - 1] = null;
    return editable
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(2 * n < self__.arr.length) {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr, 2 * idx, earr, 2 * (idx + 1), 2 * (n - idx));
      earr[2 * idx] = key;
      earr[2 * idx + 1] = val;
      editable.bitmap = editable.bitmap | bit;
      return editable
    }else {
      if(n >= 16) {
        var nodes = cljs.core.make_array.call(null, 32);
        var jdx = hash >>> shift & 31;
        nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i_3240 = 0;
        var j_3241 = 0;
        while(true) {
          if(i_3240 < 32) {
            if((self__.bitmap >>> i_3240 & 1) === 0) {
              var G__3242 = i_3240 + 1;
              var G__3243 = j_3241;
              i_3240 = G__3242;
              j_3241 = G__3243;
              continue
            }else {
              nodes[i_3240] = !(self__.arr[j_3241] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, cljs.core.hash.call(null, self__.arr[j_3241]), self__.arr[j_3241], self__.arr[j_3241 + 1], added_leaf_QMARK_) : self__.arr[j_3241 + 1];
              var G__3244 = i_3240 + 1;
              var G__3245 = j_3241 + 2;
              i_3240 = G__3244;
              j_3241 = G__3245;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit__$1, n + 1, nodes)
      }else {
        if("\ufdd0'else") {
          var new_arr = cljs.core.make_array.call(null, 2 * (n + 4));
          cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
          new_arr[2 * idx] = key;
          new_arr[2 * idx + 1] = val;
          cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
          added_leaf_QMARK_.val = true;
          var editable = inode.ensure_editable(edit__$1);
          editable.arr = new_arr;
          editable.bitmap = editable.bitmap | bit;
          return editable
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, edit__$1, shift + 5, key_or_nil, val_or_node, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * idx + 1, n)
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode.edit_and_remove_pair(edit__$1, bit, idx)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        removed_leaf_QMARK_[0] = true;
        return inode.edit_and_remove_pair(edit__$1, bit, idx)
      }else {
        if("\ufdd0'else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    var new_arr = cljs.core.make_array.call(null, n < 0 ? 4 : 2 * (n + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * n);
    return new cljs.core.BitmapIndexedNode(e, self__.bitmap, new_arr)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil, val_or_node], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return inode
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_without(shift + 5, hash, key);
      if(n === val_or_node) {
        return inode
      }else {
        if(!(n == null)) {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
        }else {
          if(self__.bitmap === bit) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap ^ bit, cljs.core.remove_pair.call(null, self__.arr, idx))
      }else {
        if("\ufdd0'else") {
          return inode
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
  if((self__.bitmap & bit) === 0) {
    var n = cljs.core.bit_count.call(null, self__.bitmap);
    if(n >= 16) {
      var nodes = cljs.core.make_array.call(null, 32);
      var jdx = hash >>> shift & 31;
      nodes[jdx] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i_3246 = 0;
      var j_3247 = 0;
      while(true) {
        if(i_3246 < 32) {
          if((self__.bitmap >>> i_3246 & 1) === 0) {
            var G__3248 = i_3246 + 1;
            var G__3249 = j_3247;
            i_3246 = G__3248;
            j_3247 = G__3249;
            continue
          }else {
            nodes[i_3246] = !(self__.arr[j_3247] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, self__.arr[j_3247]), self__.arr[j_3247], self__.arr[j_3247 + 1], added_leaf_QMARK_) : self__.arr[j_3247 + 1];
            var G__3250 = i_3246 + 1;
            var G__3251 = j_3247 + 2;
            i_3246 = G__3250;
            j_3247 = G__3251;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n + 1, nodes)
    }else {
      var new_arr = cljs.core.make_array.call(null, 2 * (n + 1));
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * idx);
      new_arr[2 * idx] = key;
      new_arr[2 * idx + 1] = val;
      cljs.core.array_copy.call(null, self__.arr, 2 * idx, new_arr, 2 * (idx + 1), 2 * (n - idx));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, self__.bitmap | bit, new_arr)
    }
  }else {
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      var n = val_or_node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n === val_or_node) {
        return inode
      }else {
        return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, n))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        if(val === val_or_node) {
          return inode
        }else {
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, self__.bitmap, cljs.core.clone_and_set.call(null, self__.arr, 2 * idx, null, 2 * idx + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil, val_or_node, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var bit = 1 << (hash >>> shift & 31);
  if((self__.bitmap & bit) === 0) {
    return not_found
  }else {
    var idx = cljs.core.bitmap_indexed_node_index.call(null, self__.bitmap, bit);
    var key_or_nil = self__.arr[2 * idx];
    var val_or_node = self__.arr[2 * idx + 1];
    if(key_or_nil == null) {
      return val_or_node.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil)) {
        return val_or_node
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr = array_node.arr;
  var len = 2 * (array_node.cnt - 1);
  var new_arr = cljs.core.make_array.call(null, len);
  var i = 0;
  var j = 1;
  var bitmap = 0;
  while(true) {
    if(i < len) {
      if(function() {
        var and__3822__auto__ = !(i === idx);
        if(and__3822__auto__) {
          return!(arr[i] == null)
        }else {
          return and__3822__auto__
        }
      }()) {
        new_arr[j] = arr[i];
        var G__3252 = i + 1;
        var G__3253 = j + 2;
        var G__3254 = bitmap | 1 << i;
        i = G__3252;
        j = G__3253;
        bitmap = G__3254;
        continue
      }else {
        var G__3255 = i + 1;
        var G__3256 = j;
        var G__3257 = bitmap;
        i = G__3255;
        j = G__3256;
        bitmap = G__3257;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap, new_arr)
    }
    break
  }
};
goog.provide("cljs.core.ArrayNode");
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable.cnt = editable.cnt + 1;
    return editable
  }else {
    var n = node.inode_assoc_BANG_(edit__$1, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_array_node_seq.call(null, self__.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return inode
  }else {
    var n = node.inode_without_BANG_(edit__$1, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, edit__$1, idx)
        }else {
          var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n);
          editable.cnt = editable.cnt - 1;
          return editable
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode, edit__$1, idx, n)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    return new cljs.core.ArrayNode(e, self__.cnt, self__.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  var len = self__.arr.length;
  var i = 0;
  var init__$1 = init;
  while(true) {
    if(i < len) {
      var node = self__.arr[i];
      if(!(node == null)) {
        var init__$2 = node.kv_reduce(f, init__$1);
        if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
          return cljs.core.deref.call(null, init__$2)
        }else {
          var G__3258 = i + 1;
          var G__3259 = init__$2;
          i = G__3258;
          init__$1 = G__3259;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__$1
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    var n = node.inode_without(shift + 5, hash, key);
    if(n === node) {
      return inode
    }else {
      if(n == null) {
        if(self__.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode, null, idx)
        }else {
          return new cljs.core.ArrayNode(null, self__.cnt - 1, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
        }else {
          return null
        }
      }
    }
  }else {
    return inode
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(node == null) {
    return new cljs.core.ArrayNode(null, self__.cnt + 1, cljs.core.clone_and_set.call(null, self__.arr, idx, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n = node.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n === node) {
      return inode
    }else {
      return new cljs.core.ArrayNode(null, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx, n))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = hash >>> shift & 31;
  var node = self__.arr[idx];
  if(!(node == null)) {
    return node.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim = 2 * cnt;
  var i = 0;
  while(true) {
    if(i < lim) {
      if(cljs.core.key_test.call(null, key, arr[i])) {
        return i
      }else {
        var G__3260 = i + 2;
        i = G__3260;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
goog.provide("cljs.core.HashCollisionNode");
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit__$1, shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      if(self__.arr.length > 2 * self__.cnt) {
        var editable = cljs.core.edit_and_set.call(null, inode, edit__$1, 2 * self__.cnt, key, 2 * self__.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable.cnt = editable.cnt + 1;
        return editable
      }else {
        var len = self__.arr.length;
        var new_arr = cljs.core.make_array.call(null, len + 2);
        cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
        new_arr[len] = key;
        new_arr[len + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode.ensure_editable_array(edit__$1, self__.cnt + 1, new_arr)
      }
    }else {
      if(self__.arr[idx + 1] === val) {
        return inode
      }else {
        return cljs.core.edit_and_set.call(null, inode, edit__$1, idx + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit__$1, 1 << (self__.collision_hash >>> shift & 31), [null, inode, null, null])).inode_assoc_BANG_(edit__$1, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var self__ = this;
  var inode = this;
  return cljs.core.create_inode_seq.call(null, self__.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit__$1, shift, hash, key, removed_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    removed_leaf_QMARK_[0] = true;
    if(self__.cnt === 1) {
      return null
    }else {
      var editable = inode.ensure_editable(edit__$1);
      var earr = editable.arr;
      earr[idx] = earr[2 * self__.cnt - 2];
      earr[idx + 1] = earr[2 * self__.cnt - 1];
      earr[2 * self__.cnt - 1] = null;
      earr[2 * self__.cnt - 2] = null;
      editable.cnt = editable.cnt - 1;
      return editable
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    return inode
  }else {
    var new_arr = cljs.core.make_array.call(null, 2 * (self__.cnt + 1));
    cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, 2 * self__.cnt);
    return new cljs.core.HashCollisionNode(e, self__.collision_hash, self__.cnt, new_arr)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var inode = this;
  return cljs.core.inode_kv_reduce.call(null, self__.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return cljs.core.PersistentVector.fromArray([self__.arr[idx], self__.arr[idx + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx === -1) {
    return inode
  }else {
    if(self__.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt - 1, cljs.core.remove_pair.call(null, self__.arr, cljs.core.quot.call(null, idx, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var self__ = this;
  var inode = this;
  if(hash === self__.collision_hash) {
    var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
    if(idx === -1) {
      var len = self__.arr.length;
      var new_arr = cljs.core.make_array.call(null, len + 2);
      cljs.core.array_copy.call(null, self__.arr, 0, new_arr, 0, len);
      new_arr[len] = key;
      new_arr[len + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt + 1, new_arr)
    }else {
      if(cljs.core._EQ_.call(null, self__.arr[idx], val)) {
        return inode
      }else {
        return new cljs.core.HashCollisionNode(null, self__.collision_hash, self__.cnt, cljs.core.clone_and_set.call(null, self__.arr, idx + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (self__.collision_hash >>> shift & 31), [null, inode])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var self__ = this;
  var inode = this;
  var idx = cljs.core.hash_collision_node_find_index.call(null, self__.arr, self__.cnt, key);
  if(idx < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, self__.arr[idx])) {
      return self__.arr[idx + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var self__ = this;
  var inode = this;
  if(e === self__.edit) {
    self__.arr = array;
    self__.cnt = count;
    return inode
  }else {
    return new cljs.core.HashCollisionNode(self__.edit, self__.collision_hash, count, array)
  }
};
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash = cljs.core.hash.call(null, key1);
    if(key1hash === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash, key1, val1, added_leaf_QMARK_).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK_)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
goog.provide("cljs.core.NodeSeq");
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.PersistentVector.fromArray([self__.nodes[self__.i], self__.nodes[self__.i + 1]], true)
  }else {
    return cljs.core.first.call(null, self__.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  if(self__.s == null) {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.NodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          if(!(nodes[j] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j, null, null)
          }else {
            var temp__3971__auto__ = nodes[j + 1];
            if(cljs.core.truth_(temp__3971__auto__)) {
              var node = temp__3971__auto__;
              var temp__3971__auto____$1 = node.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____$1)) {
                var node_seq = temp__3971__auto____$1;
                return new cljs.core.NodeSeq(null, nodes, j + 2, node_seq, null)
              }else {
                var G__3261 = j + 2;
                j = G__3261;
                continue
              }
            }else {
              var G__3262 = j + 2;
              j = G__3262;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
goog.provide("cljs.core.ArrayNodeSeq");
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.first.call(null, self__.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.create_array_node_seq.call(null, null, self__.nodes, self__.i, cljs.core.next.call(null, self__.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.ArrayNodeSeq(meta__$1, self__.nodes, self__.i, self__.s, self__.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len = nodes.length;
      var j = i;
      while(true) {
        if(j < len) {
          var temp__3971__auto__ = nodes[j];
          if(cljs.core.truth_(temp__3971__auto__)) {
            var nj = temp__3971__auto__;
            var temp__3971__auto____$1 = nj.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____$1)) {
              var ns = temp__3971__auto____$1;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j + 1, ns, null)
            }else {
              var G__3263 = j + 1;
              j = G__3263;
              continue
            }
          }else {
            var G__3264 = j + 1;
            j = G__3264;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
goog.provide("cljs.core.PersistentHashMap");
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashMap({}, self__.root, self__.cnt, self__.has_nil_QMARK_, self__.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  if(k == null) {
    if(function() {
      var and__3822__auto__ = self__.has_nil_QMARK_;
      if(and__3822__auto__) {
        return v === self__.nil_val
      }else {
        return and__3822__auto__
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, self__.has_nil_QMARK_ ? self__.cnt : self__.cnt + 1, self__.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK_ = new cljs.core.Box(false);
    var new_root = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
    if(new_root === self__.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(self__.meta, added_leaf_QMARK_.val ? self__.cnt + 1 : self__.cnt, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    return self__.has_nil_QMARK_
  }else {
    if(self__.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__3266 = null;
  var G__3266__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3266__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3266 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3266__2.call(this, self__, k);
      case 3:
        return G__3266__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3266
}();
cljs.core.PersistentHashMap.prototype.apply = function(self__, args3265) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3265.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  var init__$1 = self__.has_nil_QMARK_ ? f.call(null, init, null, self__.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    if(!(self__.root == null)) {
      return self__.root.kv_reduce(f, init__$1)
    }else {
      if("\ufdd0'else") {
        return init__$1
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    var s = !(self__.root == null) ? self__.root.inode_seq() : null;
    if(self__.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, self__.nil_val], true), s)
    }else {
      return s
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashMap(meta__$1, self__.cnt, self__.root, self__.has_nil_QMARK_, self__.nil_val, self__.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, self__.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, self__.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(self__.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root = self__.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root === self__.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(self__.meta, self__.cnt - 1, new_root, self__.has_nil_QMARK_, self__.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len = ks.length;
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i < len) {
      var G__3267 = i + 1;
      var G__3268 = cljs.core.assoc_BANG_.call(null, out, ks[i], vs[i]);
      i = G__3267;
      out = G__3268;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashMap");
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 56;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var self__ = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var self__ = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var self__ = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return null
    }
  }else {
    if(self__.root == null) {
      return null
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var self__ = this;
  if(k == null) {
    if(self__.has_nil_QMARK_) {
      return self__.nil_val
    }else {
      return not_found
    }
  }else {
    if(self__.root == null) {
      return not_found
    }else {
      return self__.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.edit) {
    return self__.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(function() {
      var G__3269 = o;
      if(G__3269) {
        if(function() {
          var or__3824__auto__ = G__3269.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return G__3269.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__3269.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3269)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__3269)
      }
    }()) {
      return tcoll.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es = cljs.core.seq.call(null, o);
      var tcoll__$1 = tcoll;
      while(true) {
        var temp__3971__auto__ = cljs.core.first.call(null, es);
        if(cljs.core.truth_(temp__3971__auto__)) {
          var e = temp__3971__auto__;
          var G__3270 = cljs.core.next.call(null, es);
          var G__3271 = tcoll__$1.assoc_BANG_(cljs.core.key.call(null, e), cljs.core.val.call(null, e));
          es = G__3270;
          tcoll__$1 = G__3271;
          continue
        }else {
          return tcoll__$1
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.nil_val === v) {
      }else {
        self__.nil_val = v
      }
      if(self__.has_nil_QMARK_) {
      }else {
        self__.count = self__.count + 1;
        self__.has_nil_QMARK_ = true
      }
      return tcoll
    }else {
      var added_leaf_QMARK_ = new cljs.core.Box(false);
      var node = (self__.root == null ? cljs.core.BitmapIndexedNode.EMPTY : self__.root).inode_assoc_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK_);
      if(node === self__.root) {
      }else {
        self__.root = node
      }
      if(added_leaf_QMARK_.val) {
        self__.count = self__.count + 1
      }else {
      }
      return tcoll
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    if(k == null) {
      if(self__.has_nil_QMARK_) {
        self__.has_nil_QMARK_ = false;
        self__.nil_val = null;
        self__.count = self__.count - 1;
        return tcoll
      }else {
        return tcoll
      }
    }else {
      if(self__.root == null) {
        return tcoll
      }else {
        var removed_leaf_QMARK_ = new cljs.core.Box(false);
        var node = self__.root.inode_without_BANG_(self__.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK_);
        if(node === self__.root) {
        }else {
          self__.root = node
        }
        if(cljs.core.truth_(removed_leaf_QMARK_[0])) {
          self__.count = self__.count - 1
        }else {
        }
        return tcoll
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var self__ = this;
  var tcoll = this;
  if(self__.edit) {
    self__.edit = null;
    return new cljs.core.PersistentHashMap(null, self__.count, self__.root, self__.has_nil_QMARK_, self__.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t = node;
  var stack__$1 = stack;
  while(true) {
    if(!(t == null)) {
      var G__3272 = ascending_QMARK_ ? t.left : t.right;
      var G__3273 = cljs.core.conj.call(null, stack__$1, t);
      t = G__3272;
      stack__$1 = G__3273;
      continue
    }else {
      return stack__$1
    }
    break
  }
};
goog.provide("cljs.core.PersistentTreeMapSeq");
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850574
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var self__ = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return self__.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var self__ = this;
  return cljs.core.peek.call(null, self__.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var self__ = this;
  var t = cljs.core.first.call(null, self__.stack);
  var next_stack = cljs.core.tree_map_seq_push.call(null, self__.ascending_QMARK_ ? t.right : t.left, cljs.core.next.call(null, self__.stack), self__.ascending_QMARK_);
  if(!(next_stack == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack, self__.ascending_QMARK_, self__.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMapSeq(meta__$1, self__.stack, self__.ascending_QMARK_, self__.cnt, self__.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto__ = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto__) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto__
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto__ = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto__) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto__
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__$1 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__$1)) {
    return cljs.core.deref.call(null, init__$1)
  }else {
    var init__$2 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__$1) : init__$1;
    if(cljs.core.reduced_QMARK_.call(null, init__$2)) {
      return cljs.core.deref.call(null, init__$2)
    }else {
      var init__$3 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__$2) : init__$2;
      if(cljs.core.reduced_QMARK_.call(null, init__$3)) {
        return cljs.core.deref.call(null, init__$3)
      }else {
        return init__$3
      }
    }
  }
};
goog.provide("cljs.core.BlackNode");
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__3275 = null;
  var G__3275__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__3275__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__3275 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3275__2.call(this, self__, k);
      case 3:
        return G__3275__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3275
}();
cljs.core.BlackNode.prototype.apply = function(self__, args3274) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3274.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_right(node)
};
cljs.core.BlackNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_right_del.call(null, self__.key, self__.val, self__.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return cljs.core.balance_left_del.call(null, self__.key, self__.val, del, self__.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return ins.balance_left(node)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__3276 = null;
  var G__3276__0 = function() {
    var self__ = this;
    var this$ = this;
    return cljs.core.pr_str.call(null, this$)
  };
  G__3276 = function() {
    switch(arguments.length) {
      case 0:
        return G__3276__0.call(this)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3276
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return node
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
goog.provide("cljs.core.RedNode");
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var self__ = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var self__ = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__3278 = null;
  var G__3278__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$2(node, k)
  };
  var G__3278__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var node = self____$1;
    return node.cljs$core$ILookup$_lookup$arity$3(node, k, not_found)
  };
  G__3278 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3278__2.call(this, self__, k);
      case 3:
        return G__3278__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3278
}();
cljs.core.RedNode.prototype.apply = function(self__, args3277) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3277.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key, self__.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var self__ = this;
  return self__.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var self__ = this;
  var node = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, self__.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key__$1, val__$1, left__$1, right__$1) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(key__$1, val__$1, left__$1, right__$1, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var self__ = this;
  var node = this;
  return cljs.core.tree_map_kv_reduce.call(null, node, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, del, self__.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var self__ = this;
  var node = this;
  return new cljs.core.RedNode(self__.key, self__.val, ins, self__.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var self__ = this;
  var node = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.left)) {
    return new cljs.core.RedNode(self__.key, self__.val, self__.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, self__.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.right)) {
      return new cljs.core.RedNode(self__.right.key, self__.right.val, new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, self__.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__3279 = null;
  var G__3279__0 = function() {
    var self__ = this;
    var this$ = this;
    return cljs.core.pr_str.call(null, this$)
  };
  G__3279 = function() {
    switch(arguments.length) {
      case 0:
        return G__3279__0.call(this)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3279
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var self__ = this;
  var node = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.right)) {
    return new cljs.core.RedNode(self__.key, self__.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left, null), self__.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, self__.left)) {
      return new cljs.core.RedNode(self__.left.key, self__.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, self__.left.left, null), new cljs.core.BlackNode(self__.key, self__.val, self__.left.right, self__.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var self__ = this;
  var node = this;
  return new cljs.core.BlackNode(self__.key, self__.val, self__.left, self__.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.list.call(null, self__.key, self__.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var self__ = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var self__ = this;
  return self__.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.fromArray([self__.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var self__ = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([self__.key, self__.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var self__ = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var self__ = this;
  if(n === 0) {
    return self__.key
  }else {
    if(n === 1) {
      return self__.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var self__ = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return null
    }else {
      if(c < 0) {
        var ins = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins == null)) {
          return tree.add_left(ins)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins == null)) {
            return tree.add_right(ins)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app)) {
            return new cljs.core.RedNode(app.key, app.val, new cljs.core.RedNode(left.key, left.val, left.left, app.left, null), new cljs.core.RedNode(right.key, right.val, app.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app)) {
              return new cljs.core.RedNode(app.key, app.val, new cljs.core.BlackNode(left.key, left.val, left.left, app.left, null), new cljs.core.BlackNode(right.key, right.val, app.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c = comp.call(null, k, tree.key);
    if(c === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c < 0) {
        var del = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto__ = !(del == null);
          if(or__3824__auto__) {
            return or__3824__auto__
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto__ = !(del == null);
            if(or__3824__auto__) {
              return or__3824__auto__
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk = tree.key;
  var c = comp.call(null, k, tk);
  if(c === 0) {
    return tree.replace(tk, v, tree.left, tree.right)
  }else {
    if(c < 0) {
      return tree.replace(tk, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
goog.provide("cljs.core.PersistentTreeMap");
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_imap.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var self__ = this;
  var n = coll.entry_at(k);
  if(!(n == null)) {
    return n.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_add.call(null, self__.comp, self__.tree, k, v, found);
  if(t == null) {
    var found_node = cljs.core.nth.call(null, found, 0);
    if(cljs.core._EQ_.call(null, v, found_node.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, cljs.core.tree_map_replace.call(null, self__.comp, self__.tree, k, v), self__.cnt, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt + 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var self__ = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__3281 = null;
  var G__3281__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3281__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3281 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3281__2.call(this, self__, k);
      case 3:
        return G__3281__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3281
}();
cljs.core.PersistentTreeMap.prototype.apply = function(self__, args3280) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3280.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var self__ = this;
  if(!(self__.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, self__.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var self__ = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, false, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var self__ = this;
  var coll = this;
  var t = self__.tree;
  while(true) {
    if(!(t == null)) {
      var c = self__.comp.call(null, k, t.key);
      if(c === 0) {
        return t
      }else {
        if(c < 0) {
          var G__3282 = t.left;
          t = G__3282;
          continue
        }else {
          if("\ufdd0'else") {
            var G__3283 = t.right;
            t = G__3283;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, ascending_QMARK_, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  if(self__.cnt > 0) {
    var stack = null;
    var t = self__.tree;
    while(true) {
      if(!(t == null)) {
        var c = self__.comp.call(null, k, t.key);
        if(c === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack, t), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c < 0) {
              var G__3284 = cljs.core.conj.call(null, stack, t);
              var G__3285 = t.left;
              stack = G__3284;
              t = G__3285;
              continue
            }else {
              var G__3286 = stack;
              var G__3287 = t.right;
              stack = G__3286;
              t = G__3287;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c > 0) {
                var G__3288 = cljs.core.conj.call(null, stack, t);
                var G__3289 = t.right;
                stack = G__3288;
                t = G__3289;
                continue
              }else {
                var G__3290 = stack;
                var G__3291 = t.left;
                stack = G__3290;
                t = G__3291;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack == null) {
          return null
        }else {
          return new cljs.core.PersistentTreeMapSeq(null, stack, ascending_QMARK_, -1, null)
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return self__.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  if(self__.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, self__.tree, true, self__.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return self__.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeMap(self__.comp, self__.tree, self__.cnt, meta__$1, self__.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, self__.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var self__ = this;
  var found = [null];
  var t = cljs.core.tree_map_remove.call(null, self__.comp, self__.tree, k, found);
  if(t == null) {
    if(cljs.core.nth.call(null, found, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(self__.comp, null, 0, self__.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(self__.comp, t.blacken(), self__.cnt - 1, self__.meta, null)
  }
};
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in$) {
        var G__3292 = cljs.core.nnext.call(null, in$);
        var G__3293 = cljs.core.assoc_BANG_.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__3292;
        out = G__3293;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__3294) {
    var keyvals = cljs.core.seq(arglist__3294);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__3295) {
    var keyvals = cljs.core.seq(arglist__3295);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks = [];
    var obj = {};
    var kvs = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs) {
        ks.push(cljs.core.first.call(null, kvs));
        obj[cljs.core.first.call(null, kvs)] = cljs.core.second.call(null, kvs);
        var G__3296 = cljs.core.nnext.call(null, kvs);
        kvs = G__3296;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks, obj)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__3297) {
    var keyvals = cljs.core.seq(arglist__3297);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in$) {
        var G__3298 = cljs.core.nnext.call(null, in$);
        var G__3299 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__3298;
        out = G__3299;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__3300) {
    var keyvals = cljs.core.seq(arglist__3300);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$ = cljs.core.seq.call(null, keyvals);
    var out = new cljs.core.PersistentTreeMap(cljs.core.fn__GT_comparator.call(null, comparator), null, 0, null, 0);
    while(true) {
      if(in$) {
        var G__3301 = cljs.core.nnext.call(null, in$);
        var G__3302 = cljs.core.assoc.call(null, out, cljs.core.first.call(null, in$), cljs.core.second.call(null, in$));
        in$ = G__3301;
        out = G__3302;
        continue
      }else {
        return out
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__3303) {
    var comparator = cljs.core.first(arglist__3303);
    var keyvals = cljs.core.rest(arglist__3303);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__3304_SHARP_, p2__3305_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto__ = p1__3304_SHARP_;
          if(cljs.core.truth_(or__3824__auto__)) {
            return or__3824__auto__
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__3305_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__3306) {
    var maps = cljs.core.seq(arglist__3306);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry = function(m, e) {
        var k = cljs.core.first.call(null, e);
        var v = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k)) {
          return cljs.core.assoc.call(null, m, k, f.call(null, cljs.core._lookup.call(null, m, k, null), v))
        }else {
          return cljs.core.assoc.call(null, m, k, v)
        }
      };
      var merge2 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry, function() {
          var or__3824__auto__ = m1;
          if(cljs.core.truth_(or__3824__auto__)) {
            return or__3824__auto__
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__3307) {
    var f = cljs.core.first(arglist__3307);
    var maps = cljs.core.rest(arglist__3307);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret = cljs.core.ObjMap.EMPTY;
  var keys = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys) {
      var key = cljs.core.first.call(null, keys);
      var entry = cljs.core._lookup.call(null, map, key, "\ufdd0'cljs.core/not-found");
      var G__3308 = cljs.core.not_EQ_.call(null, entry, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret, key, entry) : ret;
      var G__3309 = cljs.core.next.call(null, keys);
      ret = G__3308;
      keys = G__3309;
      continue
    }else {
      return ret
    }
    break
  }
};
goog.provide("cljs.core.PersistentHashSet");
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 4;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var self__ = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, self__.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, self__.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__3312 = null;
  var G__3312__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3312__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3312 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3312__2.call(this, self__, k);
      case 3:
        return G__3312__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3312
}();
cljs.core.PersistentHashSet.prototype.apply = function(self__, args3311) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3311.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.assoc.call(null, self__.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(self__.meta, cljs.core.dissoc.call(null, self__.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3822__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto__) {
    var and__3822__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__3310_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__3310_SHARP_)
      }, other)
    }else {
      return and__3822__auto____$1
    }
  }else {
    return and__3822__auto__
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(meta__$1, self__.hash_map, self__.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, self__.meta)
};
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len = cljs.core.count.call(null, items);
  var i = 0;
  var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i < len) {
      var G__3313 = i + 1;
      var G__3314 = cljs.core.conj_BANG_.call(null, out, items[i]);
      i = G__3313;
      out = G__3314;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out)
    }
    break
  }
};
goog.provide("cljs.core.TransientHashSet");
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 136
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__3317 = null;
  var G__3317__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__3317__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var tcoll = self____$1;
    if(cljs.core._lookup.call(null, self__.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__3317 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3317__2.call(this, self__, k);
      case 3:
        return G__3317__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3317
}();
cljs.core.TransientHashSet.prototype.apply = function(self__, args3316) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3316.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var self__ = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var self__ = this;
  if(cljs.core._lookup.call(null, self__.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var self__ = this;
  self__.transient_map = cljs.core.dissoc_BANG_.call(null, self__.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var self__ = this;
  self__.transient_map = cljs.core.assoc_BANG_.call(null, self__.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var self__ = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, self__.transient_map), null)
};
goog.provide("cljs.core.PersistentTreeSet");
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_iset.call(null, coll);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var self__ = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var self__ = this;
  var n = self__.tree_map.entry_at(v);
  if(!(n == null)) {
    return n.key
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__3319 = null;
  var G__3319__2 = function(self__, k) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$2(coll, k)
  };
  var G__3319__3 = function(self__, k, not_found) {
    var self__ = this;
    var self____$1 = this;
    var coll = self____$1;
    return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, not_found)
  };
  G__3319 = function(self__, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__3319__2.call(this, self__, k);
      case 3:
        return G__3319__3.call(this, self__, k, not_found)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3319
}();
cljs.core.PersistentTreeSet.prototype.apply = function(self__, args3318) {
  var self__ = this;
  return self__.call.apply(self__, [self__].concat(args3318.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.assoc.call(null, self__.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, self__.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, self__.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var self__ = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, self__.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var self__ = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core._comparator.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.keys.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(self__.meta, cljs.core.dissoc.call(null, self__.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.count.call(null, self__.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var self__ = this;
  var and__3822__auto__ = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto__) {
    var and__3822__auto____$1 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____$1) {
      return cljs.core.every_QMARK_.call(null, function(p1__3315_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__3315_SHARP_)
      }, other)
    }else {
      return and__3822__auto____$1
    }
  }else {
    return and__3822__auto__
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta__$1) {
  var self__ = this;
  return new cljs.core.PersistentTreeSet(meta__$1, self__.tree_map, self__.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var self__ = this;
  return self__.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, self__.meta)
};
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__3320__delegate = function(keys) {
      var in$ = cljs.core.seq.call(null, keys);
      var out = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in$)) {
          var G__3321 = cljs.core.next.call(null, in$);
          var G__3322 = cljs.core.conj_BANG_.call(null, out, cljs.core.first.call(null, in$));
          in$ = G__3321;
          out = G__3322;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out)
        }
        break
      }
    };
    var G__3320 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3320__delegate.call(this, keys)
    };
    G__3320.cljs$lang$maxFixedArity = 0;
    G__3320.cljs$lang$applyTo = function(arglist__3323) {
      var keys = cljs.core.seq(arglist__3323);
      return G__3320__delegate(keys)
    };
    G__3320.cljs$lang$arity$variadic = G__3320__delegate;
    return G__3320
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__3324) {
    var keys = cljs.core.seq(arglist__3324);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__3326) {
    var comparator = cljs.core.first(arglist__3326);
    var keys = cljs.core.rest(arglist__3326);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto__ = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto__)) {
        var e = temp__3971__auto__;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__3325_SHARP_) {
      var temp__3971__auto__ = cljs.core.find.call(null, smap, p1__3325_SHARP_);
      if(cljs.core.truth_(temp__3971__auto__)) {
        var e = temp__3971__auto__;
        return cljs.core.second.call(null, e)
      }else {
        return p1__3325_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__3333, seen__$1) {
        while(true) {
          var vec__3334 = p__3333;
          var f = cljs.core.nth.call(null, vec__3334, 0, null);
          var xs__$1 = vec__3334;
          var temp__3974__auto__ = cljs.core.seq.call(null, xs__$1);
          if(temp__3974__auto__) {
            var s = temp__3974__auto__;
            if(cljs.core.contains_QMARK_.call(null, seen__$1, f)) {
              var G__3335 = cljs.core.rest.call(null, s);
              var G__3336 = seen__$1;
              p__3333 = G__3335;
              seen__$1 = G__3336;
              continue
            }else {
              return cljs.core.cons.call(null, f, step.call(null, cljs.core.rest.call(null, s), cljs.core.conj.call(null, seen__$1, f)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret = cljs.core.PersistentVector.EMPTY;
  var s__$1 = s;
  while(true) {
    if(cljs.core.next.call(null, s__$1)) {
      var G__3337 = cljs.core.conj.call(null, ret, cljs.core.first.call(null, s__$1));
      var G__3338 = cljs.core.next.call(null, s__$1);
      ret = G__3337;
      s__$1 = G__3338;
      continue
    }else {
      return cljs.core.seq.call(null, ret)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto__ = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i = x.lastIndexOf("/", x.length - 2);
      if(i < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto__ = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i = x.lastIndexOf("/", x.length - 2);
    if(i > -1) {
      return cljs.core.subs.call(null, x, 2, i)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map = cljs.core.ObjMap.EMPTY;
  var ks = cljs.core.seq.call(null, keys);
  var vs = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3822__auto__ = ks;
      if(and__3822__auto__) {
        return vs
      }else {
        return and__3822__auto__
      }
    }()) {
      var G__3341 = cljs.core.assoc.call(null, map, cljs.core.first.call(null, ks), cljs.core.first.call(null, vs));
      var G__3342 = cljs.core.next.call(null, ks);
      var G__3343 = cljs.core.next.call(null, vs);
      map = G__3341;
      ks = G__3342;
      vs = G__3343;
      continue
    }else {
      return map
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__3346__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__3339_SHARP_, p2__3340_SHARP_) {
        return max_key.call(null, k, p1__3339_SHARP_, p2__3340_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__3346 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3346__delegate.call(this, k, x, y, more)
    };
    G__3346.cljs$lang$maxFixedArity = 3;
    G__3346.cljs$lang$applyTo = function(arglist__3347) {
      var k = cljs.core.first(arglist__3347);
      var x = cljs.core.first(cljs.core.next(arglist__3347));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3347)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3347)));
      return G__3346__delegate(k, x, y, more)
    };
    G__3346.cljs$lang$arity$variadic = G__3346__delegate;
    return G__3346
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__3348__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__3344_SHARP_, p2__3345_SHARP_) {
        return min_key.call(null, k, p1__3344_SHARP_, p2__3345_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__3348 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3348__delegate.call(this, k, x, y, more)
    };
    G__3348.cljs$lang$maxFixedArity = 3;
    G__3348.cljs$lang$applyTo = function(arglist__3349) {
      var k = cljs.core.first(arglist__3349);
      var x = cljs.core.first(cljs.core.next(arglist__3349));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3349)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3349)));
      return G__3348__delegate(k, x, y, more)
    };
    G__3348.cljs$lang$arity$variadic = G__3348__delegate;
    return G__3348
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3974__auto__) {
      var s = temp__3974__auto__;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_while.call(null, pred, cljs.core.rest.call(null, s)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp = cljs.core._comparator.call(null, sc);
    return test.call(null, comp.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto__)) {
        var vec__3352 = temp__3974__auto__;
        var e = cljs.core.nth.call(null, vec__3352, 0, null);
        var s = vec__3352;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto__ = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto__)) {
      var vec__3353 = temp__3974__auto__;
      var e = cljs.core.nth.call(null, vec__3353, 0, null);
      var s = vec__3353;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto__ = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto__)) {
        var vec__3356 = temp__3974__auto__;
        var e = cljs.core.nth.call(null, vec__3356, 0, null);
        var s = vec__3356;
        if(cljs.core.truth_(include.call(null, e))) {
          return s
        }else {
          return cljs.core.next.call(null, s)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto__ = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto__)) {
      var vec__3357 = temp__3974__auto__;
      var e = cljs.core.nth.call(null, vec__3357, 0, null);
      var s = vec__3357;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e)) ? s : cljs.core.next.call(null, s))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
goog.provide("cljs.core.Range");
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var self__ = this;
  var h__2211__auto__ = self__.__hash;
  if(!(h__2211__auto__ == null)) {
    return h__2211__auto__
  }else {
    var h__2211__auto____$1 = cljs.core.hash_coll.call(null, rng);
    self__.__hash = h__2211__auto____$1;
    return h__2211__auto____$1
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start + self__.step < self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }else {
    if(self__.start + self__.step > self__.end) {
      return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var self__ = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var self__ = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var self__ = this;
  if(self__.step > 0) {
    if(self__.start < self__.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(self__.start > self__.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var self__ = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((self__.end - self__.start) / self__.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var self__ = this;
  return self__.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var self__ = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(self__.meta, self__.start + self__.step, self__.end, self__.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var self__ = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta__$1) {
  var self__ = this;
  return new cljs.core.Range(meta__$1, self__.start, self__.end, self__.step, self__.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var self__ = this;
  return self__.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3822__auto__ = self__.start > self__.end;
      if(and__3822__auto__) {
        return self__.step === 0
      }else {
        return and__3822__auto__
      }
    }()) {
      return self__.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var self__ = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return self__.start + n * self__.step
  }else {
    if(function() {
      var and__3822__auto__ = self__.start > self__.end;
      if(and__3822__auto__) {
        return self__.step === 0
      }else {
        return and__3822__auto__
      }
    }()) {
      return self__.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var self__ = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, self__.meta)
};
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3974__auto__) {
      var s = temp__3974__auto__;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s), take_nth.call(null, n, cljs.core.drop.call(null, n, s)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto__ = cljs.core.seq.call(null, coll);
    if(temp__3974__auto__) {
      var s = temp__3974__auto__;
      var fst = cljs.core.first.call(null, s);
      var fv = f.call(null, fst);
      var run = cljs.core.cons.call(null, fst, cljs.core.take_while.call(null, function(p1__3358_SHARP_) {
        return cljs.core._EQ_.call(null, fv, f.call(null, p1__3358_SHARP_))
      }, cljs.core.next.call(null, s)));
      return cljs.core.cons.call(null, run, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run), s))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3971__auto__) {
        var s = temp__3971__auto__;
        return reductions.call(null, f, cljs.core.first.call(null, s), cljs.core.rest.call(null, s))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto__ = cljs.core.seq.call(null, coll);
      if(temp__3974__auto__) {
        var s = temp__3974__auto__;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s)), cljs.core.rest.call(null, s))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__3369 = null;
      var G__3369__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__3369__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__3369__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__3369__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__3369__4 = function() {
        var G__3370__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__3370 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3370__delegate.call(this, x, y, z, args)
        };
        G__3370.cljs$lang$maxFixedArity = 3;
        G__3370.cljs$lang$applyTo = function(arglist__3371) {
          var x = cljs.core.first(arglist__3371);
          var y = cljs.core.first(cljs.core.next(arglist__3371));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3371)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3371)));
          return G__3370__delegate(x, y, z, args)
        };
        G__3370.cljs$lang$arity$variadic = G__3370__delegate;
        return G__3370
      }();
      G__3369 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3369__0.call(this);
          case 1:
            return G__3369__1.call(this, x);
          case 2:
            return G__3369__2.call(this, x, y);
          case 3:
            return G__3369__3.call(this, x, y, z);
          default:
            return G__3369__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3369.cljs$lang$maxFixedArity = 3;
      G__3369.cljs$lang$applyTo = G__3369__4.cljs$lang$applyTo;
      return G__3369
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__3372 = null;
      var G__3372__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__3372__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__3372__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__3372__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__3372__4 = function() {
        var G__3373__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__3373 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3373__delegate.call(this, x, y, z, args)
        };
        G__3373.cljs$lang$maxFixedArity = 3;
        G__3373.cljs$lang$applyTo = function(arglist__3374) {
          var x = cljs.core.first(arglist__3374);
          var y = cljs.core.first(cljs.core.next(arglist__3374));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3374)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3374)));
          return G__3373__delegate(x, y, z, args)
        };
        G__3373.cljs$lang$arity$variadic = G__3373__delegate;
        return G__3373
      }();
      G__3372 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3372__0.call(this);
          case 1:
            return G__3372__1.call(this, x);
          case 2:
            return G__3372__2.call(this, x, y);
          case 3:
            return G__3372__3.call(this, x, y, z);
          default:
            return G__3372__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3372.cljs$lang$maxFixedArity = 3;
      G__3372.cljs$lang$applyTo = G__3372__4.cljs$lang$applyTo;
      return G__3372
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__3375 = null;
      var G__3375__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__3375__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__3375__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__3375__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__3375__4 = function() {
        var G__3376__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__3376 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__3376__delegate.call(this, x, y, z, args)
        };
        G__3376.cljs$lang$maxFixedArity = 3;
        G__3376.cljs$lang$applyTo = function(arglist__3377) {
          var x = cljs.core.first(arglist__3377);
          var y = cljs.core.first(cljs.core.next(arglist__3377));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3377)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3377)));
          return G__3376__delegate(x, y, z, args)
        };
        G__3376.cljs$lang$arity$variadic = G__3376__delegate;
        return G__3376
      }();
      G__3375 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__3375__0.call(this);
          case 1:
            return G__3375__1.call(this, x);
          case 2:
            return G__3375__2.call(this, x, y);
          case 3:
            return G__3375__3.call(this, x, y, z);
          default:
            return G__3375__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      G__3375.cljs$lang$maxFixedArity = 3;
      G__3375.cljs$lang$applyTo = G__3375__4.cljs$lang$applyTo;
      return G__3375
    }()
  };
  var juxt__4 = function() {
    var G__3378__delegate = function(f, g, h, fs) {
      var fs__$1 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__3379 = null;
        var G__3379__0 = function() {
          return cljs.core.reduce.call(null, function(p1__3359_SHARP_, p2__3360_SHARP_) {
            return cljs.core.conj.call(null, p1__3359_SHARP_, p2__3360_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3379__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__3361_SHARP_, p2__3362_SHARP_) {
            return cljs.core.conj.call(null, p1__3361_SHARP_, p2__3362_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3379__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__3363_SHARP_, p2__3364_SHARP_) {
            return cljs.core.conj.call(null, p1__3363_SHARP_, p2__3364_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3379__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__3365_SHARP_, p2__3366_SHARP_) {
            return cljs.core.conj.call(null, p1__3365_SHARP_, p2__3366_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__$1)
        };
        var G__3379__4 = function() {
          var G__3380__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__3367_SHARP_, p2__3368_SHARP_) {
              return cljs.core.conj.call(null, p1__3367_SHARP_, cljs.core.apply.call(null, p2__3368_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__$1)
          };
          var G__3380 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__3380__delegate.call(this, x, y, z, args)
          };
          G__3380.cljs$lang$maxFixedArity = 3;
          G__3380.cljs$lang$applyTo = function(arglist__3381) {
            var x = cljs.core.first(arglist__3381);
            var y = cljs.core.first(cljs.core.next(arglist__3381));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3381)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3381)));
            return G__3380__delegate(x, y, z, args)
          };
          G__3380.cljs$lang$arity$variadic = G__3380__delegate;
          return G__3380
        }();
        G__3379 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__3379__0.call(this);
            case 1:
              return G__3379__1.call(this, x);
            case 2:
              return G__3379__2.call(this, x, y);
            case 3:
              return G__3379__3.call(this, x, y, z);
            default:
              return G__3379__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw new Error("Invalid arity: " + arguments.length);
        };
        G__3379.cljs$lang$maxFixedArity = 3;
        G__3379.cljs$lang$applyTo = G__3379__4.cljs$lang$applyTo;
        return G__3379
      }()
    };
    var G__3378 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__3378__delegate.call(this, f, g, h, fs)
    };
    G__3378.cljs$lang$maxFixedArity = 3;
    G__3378.cljs$lang$applyTo = function(arglist__3382) {
      var f = cljs.core.first(arglist__3382);
      var g = cljs.core.first(cljs.core.next(arglist__3382));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3382)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__3382)));
      return G__3378__delegate(f, g, h, fs)
    };
    G__3378.cljs$lang$arity$variadic = G__3378__delegate;
    return G__3378
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__3383 = cljs.core.next.call(null, coll);
        coll = G__3383;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto__ = cljs.core.seq.call(null, coll);
        if(and__3822__auto__) {
          return n > 0
        }else {
          return and__3822__auto__
        }
      }())) {
        var G__3384 = n - 1;
        var G__3385 = cljs.core.next.call(null, coll);
        n = G__3384;
        coll = G__3385;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches), s)) {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches) === 1) {
      return cljs.core.first.call(null, matches)
    }else {
      return cljs.core.vec.call(null, matches)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data = cljs.core.re_find.call(null, re, s);
  var match_idx = s.search(re);
  var match_str = cljs.core.coll_QMARK_.call(null, match_data) ? cljs.core.first.call(null, match_data) : match_data;
  var post_match = cljs.core.subs.call(null, s, match_idx + cljs.core.count.call(null, match_str));
  if(cljs.core.truth_(match_data)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data, re_seq.call(null, re, post_match))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__3388 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var _ = cljs.core.nth.call(null, vec__3388, 0, null);
  var flags = cljs.core.nth.call(null, vec__3388, 1, null);
  var pattern = cljs.core.nth.call(null, vec__3388, 2, null);
  return new RegExp(pattern, flags)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__3386_SHARP_) {
    return print_one.call(null, p1__3386_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.pr_sequential_writer = function pr_sequential_writer(writer, print_one, begin, sep, end, opts, coll) {
  cljs.core._write.call(null, writer, begin);
  if(cljs.core.seq.call(null, coll)) {
    print_one.call(null, cljs.core.first.call(null, coll), writer, opts)
  }else {
  }
  var G__3390_3391 = cljs.core.seq.call(null, cljs.core.next.call(null, coll));
  while(true) {
    if(G__3390_3391) {
      var o_3392 = cljs.core.first.call(null, G__3390_3391);
      cljs.core._write.call(null, writer, sep);
      print_one.call(null, o_3392, writer, opts);
      var G__3393 = cljs.core.next.call(null, G__3390_3391);
      G__3390_3391 = G__3393;
      continue
    }else {
    }
    break
  }
  return cljs.core._write.call(null, writer, end)
};
cljs.core.write_all = function() {
  var write_all__delegate = function(writer, ss) {
    var G__3395 = cljs.core.seq.call(null, ss);
    while(true) {
      if(G__3395) {
        var s = cljs.core.first.call(null, G__3395);
        cljs.core._write.call(null, writer, s);
        var G__3396 = cljs.core.next.call(null, G__3395);
        G__3395 = G__3396;
        continue
      }else {
        return null
      }
      break
    }
  };
  var write_all = function(writer, var_args) {
    var ss = null;
    if(goog.isDef(var_args)) {
      ss = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return write_all__delegate.call(this, writer, ss)
  };
  write_all.cljs$lang$maxFixedArity = 1;
  write_all.cljs$lang$applyTo = function(arglist__3397) {
    var writer = cljs.core.first(arglist__3397);
    var ss = cljs.core.rest(arglist__3397);
    return write_all__delegate(writer, ss)
  };
  write_all.cljs$lang$arity$variadic = write_all__delegate;
  return write_all
}();
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
goog.provide("cljs.core.StringBufferWriter");
cljs.core.StringBufferWriter = function(sb) {
  this.sb = sb;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073741824
};
cljs.core.StringBufferWriter.cljs$lang$type = true;
cljs.core.StringBufferWriter.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/StringBufferWriter")
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_write$arity$2 = function(_, s) {
  var self__ = this;
  return self__.sb.append(s)
};
cljs.core.StringBufferWriter.prototype.cljs$core$IWriter$_flush$arity$1 = function(_) {
  var self__ = this;
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto__ = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = function() {
              var G__3400 = obj;
              if(G__3400) {
                if(function() {
                  var or__3824__auto__ = G__3400.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto__) {
                    return or__3824__auto__
                  }else {
                    return G__3400.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__3400.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3400)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3400)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3822__auto__ = !(obj == null);
          if(and__3822__auto__) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto__
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__3401 = obj;
          if(G__3401) {
            if(function() {
              var or__3824__auto__ = G__3401.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3824__auto__) {
                return or__3824__auto__
              }else {
                return G__3401.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__3401.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3401)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3401)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_writer = function pr_writer(obj, writer, opts) {
  if(obj == null) {
    return cljs.core._write.call(null, writer, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core._write.call(null, writer, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_(function() {
          var and__3822__auto__ = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3822__auto__)) {
            var and__3822__auto____$1 = function() {
              var G__3405 = obj;
              if(G__3405) {
                if(function() {
                  var or__3824__auto__ = G__3405.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3824__auto__) {
                    return or__3824__auto__
                  }else {
                    return G__3405.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__3405.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3405)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__3405)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____$1)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____$1
            }
          }else {
            return and__3822__auto__
          }
        }())) {
          cljs.core._write.call(null, writer, "^");
          pr_writer.call(null, cljs.core.meta.call(null, obj), writer, opts);
          cljs.core._write.call(null, writer, " ")
        }else {
        }
        if(function() {
          var and__3822__auto__ = !(obj == null);
          if(and__3822__auto__) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto__
          }
        }()) {
          return obj.cljs$lang$ctorPrWriter(obj, writer, opts)
        }else {
          if(function() {
            var G__3406 = obj;
            if(G__3406) {
              if(function() {
                var or__3824__auto__ = G__3406.cljs$lang$protocol_mask$partition0$ & 2147483648;
                if(or__3824__auto__) {
                  return or__3824__auto__
                }else {
                  return G__3406.cljs$core$IPrintWithWriter$
                }
              }()) {
                return true
              }else {
                if(!G__3406.cljs$lang$protocol_mask$partition0$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__3406)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IPrintWithWriter, G__3406)
            }
          }()) {
            return cljs.core._pr_writer.call(null, obj, writer, opts)
          }else {
            if(function() {
              var G__3407 = obj;
              if(G__3407) {
                if(function() {
                  var or__3824__auto__ = G__3407.cljs$lang$protocol_mask$partition0$ & 536870912;
                  if(or__3824__auto__) {
                    return or__3824__auto__
                  }else {
                    return G__3407.cljs$core$IPrintable$
                  }
                }()) {
                  return true
                }else {
                  if(!G__3407.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3407)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__3407)
              }
            }()) {
              return cljs.core.apply.call(null, cljs.core.write_all, writer, cljs.core._pr_seq.call(null, obj, opts))
            }else {
              if(cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj))) {
                return cljs.core.write_all.call(null, writer, '#"', obj.source, '"')
              }else {
                if("\ufdd0'else") {
                  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(obj)].join(""), ">")
                }else {
                  return null
                }
              }
            }
          }
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_seq_writer = function pr_seq_writer(objs, writer, opts) {
  cljs.core.pr_writer.call(null, cljs.core.first.call(null, objs), writer, opts);
  var G__3409 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  while(true) {
    if(G__3409) {
      var obj = cljs.core.first.call(null, G__3409);
      cljs.core._write.call(null, writer, " ");
      cljs.core.pr_writer.call(null, obj, writer, opts);
      var G__3410 = cljs.core.next.call(null, G__3409);
      G__3409 = G__3410;
      continue
    }else {
      return null
    }
    break
  }
};
cljs.core.pr_sb_with_opts = function pr_sb_with_opts(objs, opts) {
  var sb = new goog.string.StringBuffer;
  var writer = new cljs.core.StringBufferWriter(sb);
  cljs.core.pr_seq_writer.call(null, objs, writer, opts);
  cljs.core._flush.call(null, writer);
  return sb
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return""
  }else {
    return[cljs.core.str(cljs.core.pr_sb_with_opts.call(null, objs, opts))].join("")
  }
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  if(cljs.core.empty_QMARK_.call(null, objs)) {
    return"\n"
  }else {
    var sb = cljs.core.pr_sb_with_opts.call(null, objs, opts);
    sb.append("\n");
    return[cljs.core.str(sb)].join("")
  }
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  return cljs.core.string_print.call(null, cljs.core.pr_str_with_opts.call(null, objs, opts))
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__3411) {
    var objs = cljs.core.seq(arglist__3411);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__3412) {
    var objs = cljs.core.seq(arglist__3412);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__3413) {
    var objs = cljs.core.seq(arglist__3413);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__3414) {
    var objs = cljs.core.seq(arglist__3414);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__3415) {
    var objs = cljs.core.seq(arglist__3415);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__3416) {
    var objs = cljs.core.seq(arglist__3416);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__3417) {
    var objs = cljs.core.seq(arglist__3417);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__3418) {
    var objs = cljs.core.seq(arglist__3418);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__3419) {
    var fmt = cljs.core.first(arglist__3419);
    var args = cljs.core.rest(arglist__3419);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.char_escapes = cljs.core.ObjMap.fromObject(['"', "\\", "\b", "\f", "\n", "\r", "\t"], {'"':'\\"', "\\":"\\\\", "\b":"\\b", "\f":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t"});
cljs.core.quote_string = function quote_string(s) {
  return[cljs.core.str('"'), cljs.core.str(s.replace(RegExp('[\\\\"\b\f\n\r\t]', "g"), function(match) {
    return cljs.core._lookup.call(null, cljs.core.char_escapes, match, null)
  })), cljs.core.str('"')].join("")
};
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto__ = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto__)) {
        var nspc = temp__3974__auto__;
        return[cljs.core.str(nspc), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto__ = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto__)) {
          var nspc = temp__3974__auto__;
          return[cljs.core.str(nspc), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? cljs.core.quote_string.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize = function(n, len) {
    var ns = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns) < len) {
        var G__3420 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
        ns = G__3420;
        continue
      }else {
        return ns
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize.call(null, d.getUTCSeconds(), 2)), cljs.core.str("."), 
  cljs.core.str(normalize.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["number"] = true;
cljs.core._pr_writer["number"] = function(n, writer, opts) {
  1 / 0;
  return cljs.core._write.call(null, writer, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintWithWriter["boolean"] = true;
cljs.core._pr_writer["boolean"] = function(bool, writer, opts) {
  return cljs.core._write.call(null, writer, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintWithWriter["string"] = true;
cljs.core._pr_writer["string"] = function(obj, writer, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    cljs.core._write.call(null, writer, ":");
    var temp__3974__auto___3421 = cljs.core.namespace.call(null, obj);
    if(cljs.core.truth_(temp__3974__auto___3421)) {
      var nspc_3422 = temp__3974__auto___3421;
      cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_3422)].join(""), "/")
    }else {
    }
    return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      var temp__3974__auto___3423 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto___3423)) {
        var nspc_3424 = temp__3974__auto___3423;
        cljs.core.write_all.call(null, writer, [cljs.core.str(nspc_3424)].join(""), "/")
      }else {
      }
      return cljs.core._write.call(null, writer, cljs.core.name.call(null, obj))
    }else {
      if("\ufdd0'else") {
        if(cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts))) {
          return cljs.core._write.call(null, writer, cljs.core.quote_string.call(null, obj))
        }else {
          return cljs.core._write.call(null, writer, obj)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.List.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.IPrintWithWriter["array"] = true;
cljs.core._pr_writer["array"] = function(a, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintWithWriter["function"] = true;
cljs.core._pr_writer["function"] = function(this$, writer, _) {
  return cljs.core.write_all.call(null, writer, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core._write.call(null, writer, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintWithWriter$ = true;
Date.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(d, writer, _) {
  var normalize = function(n, len) {
    var ns = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns) < len) {
        var G__3425 = [cljs.core.str("0"), cljs.core.str(ns)].join("");
        ns = G__3425;
        continue
      }else {
        return ns
      }
      break
    }
  };
  return cljs.core.write_all.call(null, writer, '#inst "', [cljs.core.str(d.getUTCFullYear())].join(""), "-", normalize.call(null, d.getUTCMonth() + 1, 2), "-", normalize.call(null, d.getUTCDate(), 2), "T", normalize.call(null, d.getUTCHours(), 2), ":", normalize.call(null, d.getUTCMinutes(), 2), ":", normalize.call(null, d.getUTCSeconds(), 2), ".", normalize.call(null, d.getUTCMilliseconds(), 3), "-", '00:00"')
};
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.Range.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  var pr_pair = function(keyval) {
    return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential_writer.call(null, writer, pr_pair, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(coll, writer, opts) {
  return cljs.core.pr_sequential_writer.call(null, writer, cljs.core.pr_writer, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
goog.provide("cljs.core.Atom");
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856;
  this.cljs$lang$protocol_mask$partition1$ = 2
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var self__ = this;
  var G__3426 = cljs.core.seq.call(null, self__.watches);
  while(true) {
    if(G__3426) {
      var vec__3427 = cljs.core.first.call(null, G__3426);
      var key = cljs.core.nth.call(null, vec__3427, 0, null);
      var f = cljs.core.nth.call(null, vec__3427, 1, null);
      f.call(null, key, this$, oldval, newval);
      var G__3428 = cljs.core.next.call(null, G__3426);
      G__3426 = G__3428;
      continue
    }else {
      return null
    }
    break
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var self__ = this;
  return this$.watches = cljs.core.assoc.call(null, self__.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var self__ = this;
  return this$.watches = cljs.core.dissoc.call(null, self__.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(a, writer, opts) {
  var self__ = this;
  cljs.core._write.call(null, writer, "#<Atom: ");
  cljs.core._pr_writer.call(null, self__.state, writer, opts);
  return cljs.core._write.call(null, writer, ">")
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var self__ = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, self__.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var self__ = this;
  return self__.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return self__.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var self__ = this;
  return o === other
};
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__3432__delegate = function(x, p__3429) {
      var map__3431 = p__3429;
      var map__3431__$1 = cljs.core.seq_QMARK_.call(null, map__3431) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3431) : map__3431;
      var validator = cljs.core._lookup.call(null, map__3431__$1, "\ufdd0'validator", null);
      var meta = cljs.core._lookup.call(null, map__3431__$1, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta, validator, null)
    };
    var G__3432 = function(x, var_args) {
      var p__3429 = null;
      if(goog.isDef(var_args)) {
        p__3429 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3432__delegate.call(this, x, p__3429)
    };
    G__3432.cljs$lang$maxFixedArity = 1;
    G__3432.cljs$lang$applyTo = function(arglist__3433) {
      var x = cljs.core.first(arglist__3433);
      var p__3429 = cljs.core.rest(arglist__3433);
      return G__3432__delegate(x, p__3429)
    };
    G__3432.cljs$lang$arity$variadic = G__3432__delegate;
    return G__3432
  }();
  atom = function(x, var_args) {
    var p__3429 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto___3434 = a.validator;
  if(cljs.core.truth_(temp__3974__auto___3434)) {
    var validate_3435 = temp__3974__auto___3434;
    if(cljs.core.truth_(validate_3435.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6751))))].join(""));
    }
  }else {
  }
  var old_value_3436 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value_3436, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__3437__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__3437 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__3437__delegate.call(this, a, f, x, y, z, more)
    };
    G__3437.cljs$lang$maxFixedArity = 5;
    G__3437.cljs$lang$applyTo = function(arglist__3438) {
      var a = cljs.core.first(arglist__3438);
      var f = cljs.core.first(cljs.core.next(arglist__3438));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__3438)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3438))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3438)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__3438)))));
      return G__3437__delegate(a, f, x, y, z, more)
    };
    G__3437.cljs$lang$arity$variadic = G__3437__delegate;
    return G__3437
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__3439) {
    var iref = cljs.core.first(arglist__3439);
    var f = cljs.core.first(cljs.core.next(arglist__3439));
    var args = cljs.core.rest(cljs.core.next(arglist__3439));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
goog.provide("cljs.core.Delay");
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, self__.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var self__ = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, self__.state, function(p__3440) {
    var map__3441 = p__3440;
    var map__3441__$1 = cljs.core.seq_QMARK_.call(null, map__3441) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3441) : map__3441;
    var curr_state = map__3441__$1;
    var done = cljs.core._lookup.call(null, map__3441__$1, "\ufdd0'done", null);
    if(cljs.core.truth_(done)) {
      return curr_state
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":self__.f.call(null)})
    }
  }))
};
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.IEncodeJS = {};
cljs.core._clj__GT_js = function _clj__GT_js(x) {
  if(function() {
    var and__3822__auto__ = x;
    if(and__3822__auto__) {
      return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_clj__GT_js$arity$1(x)
  }else {
    var x__2390__auto__ = x == null ? null : x;
    return function() {
      var or__3824__auto__ = cljs.core._clj__GT_js[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._clj__GT_js["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-clj->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core._key__GT_js = function _key__GT_js(x) {
  if(function() {
    var and__3822__auto__ = x;
    if(and__3822__auto__) {
      return x.cljs$core$IEncodeJS$_key__GT_js$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return x.cljs$core$IEncodeJS$_key__GT_js$arity$1(x)
  }else {
    var x__2390__auto__ = x == null ? null : x;
    return function() {
      var or__3824__auto__ = cljs.core._key__GT_js[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._key__GT_js["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IEncodeJS.-key->js", x);
        }
      }
    }().call(null, x)
  }
};
cljs.core.IEncodeJS["null"] = true;
cljs.core._clj__GT_js["null"] = function(x) {
  return null
};
cljs.core.IEncodeJS["_"] = true;
cljs.core._key__GT_js["_"] = function(k) {
  if(function() {
    var or__3824__auto__ = cljs.core.string_QMARK_.call(null, k);
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      var or__3824__auto____$1 = cljs.core.number_QMARK_.call(null, k);
      if(or__3824__auto____$1) {
        return or__3824__auto____$1
      }else {
        var or__3824__auto____$2 = cljs.core.keyword_QMARK_.call(null, k);
        if(or__3824__auto____$2) {
          return or__3824__auto____$2
        }else {
          return cljs.core.symbol_QMARK_.call(null, k)
        }
      }
    }
  }()) {
    return cljs.core._clj__GT_js.call(null, k)
  }else {
    return cljs.core.pr_str.call(null, k)
  }
};
cljs.core._clj__GT_js["_"] = function(x) {
  if(cljs.core.keyword_QMARK_.call(null, x)) {
    return cljs.core.name.call(null, x)
  }else {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return[cljs.core.str(x)].join("")
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        var m = {};
        var G__3442_3444 = cljs.core.seq.call(null, x);
        while(true) {
          if(G__3442_3444) {
            var vec__3443_3445 = cljs.core.first.call(null, G__3442_3444);
            var k_3446 = cljs.core.nth.call(null, vec__3443_3445, 0, null);
            var v_3447 = cljs.core.nth.call(null, vec__3443_3445, 1, null);
            m[cljs.core._key__GT_js.call(null, k_3446)] = cljs.core._clj__GT_js.call(null, v_3447);
            var G__3448 = cljs.core.next.call(null, G__3442_3444);
            G__3442_3444 = G__3448;
            continue
          }else {
          }
          break
        }
        return m
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, cljs.core._clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.clj__GT_js = function clj__GT_js(x) {
  return cljs.core._clj__GT_js.call(null, x)
};
cljs.core.IEncodeClojure = {};
cljs.core._js__GT_clj = function() {
  var _js__GT_clj = null;
  var _js__GT_clj__1 = function(x) {
    if(function() {
      var and__3822__auto__ = x;
      if(and__3822__auto__) {
        return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$1
      }else {
        return and__3822__auto__
      }
    }()) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$1(x)
    }else {
      var x__2390__auto__ = x == null ? null : x;
      return function() {
        var or__3824__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._js__GT_clj["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
          }
        }
      }().call(null, x)
    }
  };
  var _js__GT_clj__2 = function(x, options) {
    if(function() {
      var and__3822__auto__ = x;
      if(and__3822__auto__) {
        return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2
      }else {
        return and__3822__auto__
      }
    }()) {
      return x.cljs$core$IEncodeClojure$_js__GT_clj$arity$2(x, options)
    }else {
      var x__2390__auto__ = x == null ? null : x;
      return function() {
        var or__3824__auto__ = cljs.core._js__GT_clj[goog.typeOf(x__2390__auto__)];
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          var or__3824__auto____$1 = cljs.core._js__GT_clj["_"];
          if(or__3824__auto____$1) {
            return or__3824__auto____$1
          }else {
            throw cljs.core.missing_protocol.call(null, "IEncodeClojure.-js->clj", x);
          }
        }
      }().call(null, x, options)
    }
  };
  _js__GT_clj = function(x, options) {
    switch(arguments.length) {
      case 1:
        return _js__GT_clj__1.call(this, x);
      case 2:
        return _js__GT_clj__2.call(this, x, options)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  _js__GT_clj.cljs$lang$arity$1 = _js__GT_clj__1;
  _js__GT_clj.cljs$lang$arity$2 = _js__GT_clj__2;
  return _js__GT_clj
}();
cljs.core.IEncodeClojure["_"] = true;
cljs.core._js__GT_clj["_"] = function() {
  var G__3454 = null;
  var G__3454__1 = function(x) {
    return cljs.core._js__GT_clj.call(null, x, cljs.core.ObjMap.fromObject(["\ufdd0'keywordize-keys"], {"\ufdd0'keywordize-keys":false}))
  };
  var G__3454__2 = function(x, options) {
    var map__3449 = options;
    var map__3449__$1 = cljs.core.seq_QMARK_.call(null, map__3449) ? cljs.core.apply.call(null, cljs.core.hash_map, map__3449) : map__3449;
    var keywordize_keys = cljs.core._lookup.call(null, map__3449__$1, "\ufdd0'keywordize-keys", null);
    var keyfn = cljs.core.truth_(keywordize_keys) ? cljs.core.keyword : cljs.core.str;
    var f = function thisfn(x__$1) {
      if(cljs.core.seq_QMARK_.call(null, x__$1)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x__$1))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x__$1)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x__$1), cljs.core.map.call(null, thisfn, x__$1))
        }else {
          if(cljs.core.truth_(goog.isArray(x__$1))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x__$1))
          }else {
            if(cljs.core.type.call(null, x__$1) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2487__auto__ = function iter__3452(s__3453) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__3453__$1 = s__3453;
                    while(true) {
                      if(cljs.core.seq.call(null, s__3453__$1)) {
                        var k = cljs.core.first.call(null, s__3453__$1);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn.call(null, k), thisfn.call(null, x__$1[k])], true), iter__3452.call(null, cljs.core.rest.call(null, s__3453__$1)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2487__auto__.call(null, cljs.core.js_keys.call(null, x__$1))
              }())
            }else {
              if("\ufdd0'else") {
                return x__$1
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f.call(null, x)
  };
  G__3454 = function(x, options) {
    switch(arguments.length) {
      case 1:
        return G__3454__1.call(this, x);
      case 2:
        return G__3454__2.call(this, x, options)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  return G__3454
}();
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, opts) {
    return cljs.core._js__GT_clj.call(null, x, cljs.core.apply.call(null, cljs.core.array_map, opts))
  };
  var js__GT_clj = function(x, var_args) {
    var opts = null;
    if(goog.isDef(var_args)) {
      opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, opts)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__3455) {
    var x = cljs.core.first(arglist__3455);
    var opts = cljs.core.rest(arglist__3455);
    return js__GT_clj__delegate(x, opts)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__3456__delegate = function(args) {
      var temp__3971__auto__ = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem), args, null);
      if(cljs.core.truth_(temp__3971__auto__)) {
        var v = temp__3971__auto__;
        return v
      }else {
        var ret = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem, cljs.core.assoc, args, ret);
        return ret
      }
    };
    var G__3456 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__3456__delegate.call(this, args)
    };
    G__3456.cljs$lang$maxFixedArity = 0;
    G__3456.cljs$lang$applyTo = function(arglist__3457) {
      var args = cljs.core.seq(arglist__3457);
      return G__3456__delegate(args)
    };
    G__3456.cljs$lang$arity$variadic = G__3456__delegate;
    return G__3456
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret)) {
        var G__3458 = ret;
        f = G__3458;
        continue
      }else {
        return ret
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__3459__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__3459 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__3459__delegate.call(this, f, args)
    };
    G__3459.cljs$lang$maxFixedArity = 1;
    G__3459.cljs$lang$applyTo = function(arglist__3460) {
      var f = cljs.core.first(arglist__3460);
      var args = cljs.core.rest(arglist__3460);
      return G__3459__delegate(f, args)
    };
    G__3459.cljs$lang$arity$variadic = G__3459__delegate;
    return G__3459
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto__ = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      var or__3824__auto____$1 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3824__auto____$1) {
        return or__3824__auto____$1
      }else {
        var and__3822__auto__ = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto__) {
          var and__3822__auto____$1 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____$1) {
            var and__3822__auto____$2 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____$2) {
              var ret = true;
              var i = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____$2 = cljs.core.not.call(null, ret);
                  if(or__3824__auto____$2) {
                    return or__3824__auto____$2
                  }else {
                    return i === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret
                }else {
                  var G__3461 = isa_QMARK_.call(null, h, child.call(null, i), parent.call(null, i));
                  var G__3462 = i + 1;
                  ret = G__3461;
                  i = G__3462;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____$2
            }
          }else {
            return and__3822__auto____$1
          }
        }else {
          return and__3822__auto__
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 7081))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 7085))))].join(""));
    }
    var tp = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto__ = cljs.core.contains_QMARK_.call(null, tp.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td, parent, ta), "\ufdd0'descendants":tf.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta, tag, td)})
    }();
    if(cljs.core.truth_(or__3824__auto__)) {
      return or__3824__auto__
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents = cljs.core.truth_(parentMap.call(null, tag)) ? cljs.core.disj.call(null, parentMap.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents)) ? cljs.core.assoc.call(null, parentMap, tag, childsParents) : cljs.core.dissoc.call(null, parentMap, tag);
    var deriv_seq = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__3463_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__3463_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__3463_SHARP_), cljs.core.second.call(null, p1__3463_SHARP_)))
    }, cljs.core.seq.call(null, newParents)));
    if(cljs.core.contains_QMARK_.call(null, parentMap.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__3464_SHARP_, p2__3465_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__3464_SHARP_, p2__3465_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto__ = cljs.core.truth_(function() {
    var and__3822__auto__ = xprefs;
    if(cljs.core.truth_(and__3822__auto__)) {
      return xprefs.call(null, y)
    }else {
      return and__3822__auto__
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto__)) {
    return or__3824__auto__
  }else {
    var or__3824__auto____$1 = function() {
      var ps = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps), prefer_table))) {
          }else {
          }
          var G__3466 = cljs.core.rest.call(null, ps);
          ps = G__3466;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____$1)) {
      return or__3824__auto____$1
    }else {
      var or__3824__auto____$2 = function() {
        var ps = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps), y, prefer_table))) {
            }else {
            }
            var G__3467 = cljs.core.rest.call(null, ps);
            ps = G__3467;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____$2)) {
        return or__3824__auto____$2
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto__ = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto__)) {
    return or__3824__auto__
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry = cljs.core.reduce.call(null, function(be, p__3470) {
    var vec__3471 = p__3470;
    var k = cljs.core.nth.call(null, vec__3471, 0, null);
    var _ = cljs.core.nth.call(null, vec__3471, 1, null);
    var e = vec__3471;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k)) {
      var be2 = cljs.core.truth_(function() {
        var or__3824__auto__ = be == null;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return cljs.core.dominates.call(null, k, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2), k, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry));
      return cljs.core.second.call(null, best_entry)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._reset[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._reset["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._add_method[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._add_method["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._remove_method[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._remove_method["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._prefer_method[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._prefer_method["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._get_method[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._get_method["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._methods[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._methods["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._prefers[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._prefers["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto__ = mf;
    if(and__3822__auto__) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2390__auto__ = mf == null ? null : mf;
    return function() {
      var or__3824__auto__ = cljs.core._dispatch[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.core._dispatch["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn = cljs.core._get_method.call(null, mf, dispatch_val);
  if(cljs.core.truth_(target_fn)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val)].join(""));
  }
  return cljs.core.apply.call(null, target_fn, args)
};
goog.provide("cljs.core.MultiFn");
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 256
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.method_cache, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(mf__$1) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, self__.cached_hierarchy, function(mf__$1) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  cljs.core.swap_BANG_.call(null, self__.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var self__ = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, self__.cached_hierarchy), cljs.core.deref.call(null, self__.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
  }
  var temp__3971__auto__ = cljs.core.deref.call(null, self__.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto__)) {
    var target_fn = temp__3971__auto__;
    return target_fn
  }else {
    var temp__3971__auto____$1 = cljs.core.find_and_cache_best_method.call(null, self__.name, dispatch_val, self__.hierarchy, self__.method_table, self__.prefer_table, self__.method_cache, self__.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____$1)) {
      var target_fn = temp__3971__auto____$1;
      return target_fn
    }else {
      return cljs.core.deref.call(null, self__.method_table).call(null, self__.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var self__ = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, self__.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(self__.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, self__.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, self__.method_cache, self__.method_table, self__.cached_hierarchy, self__.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var self__ = this;
  return cljs.core.deref.call(null, self__.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var self__ = this;
  return cljs.core.do_dispatch.call(null, mf, self__.dispatch_fn, args)
};
cljs.core.MultiFn.prototype.call = function() {
  var G__3472__delegate = function(_, args) {
    var self = this;
    return cljs.core._dispatch.call(null, self, args)
  };
  var G__3472 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__3472__delegate.call(this, _, args)
  };
  G__3472.cljs$lang$maxFixedArity = 1;
  G__3472.cljs$lang$applyTo = function(arglist__3473) {
    var _ = cljs.core.first(arglist__3473);
    var args = cljs.core.rest(arglist__3473);
    return G__3472__delegate(_, args)
  };
  G__3472.cljs$lang$arity$variadic = G__3472__delegate;
  return G__3472
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self = this;
  return cljs.core._dispatch.call(null, self, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("cljs.core.UUID");
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690646016
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var self__ = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintWithWriter$_pr_writer$arity$3 = function(_, writer, ___$1) {
  var self__ = this;
  return cljs.core._write.call(null, writer, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_, ___$1) {
  var self__ = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(self__.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var self__ = this;
  var and__3822__auto__ = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3822__auto__) {
    return self__.uuid === other.uuid
  }else {
    return and__3822__auto__
  }
};
cljs.core.UUID.prototype.toString = function() {
  var self__ = this;
  var this$ = this;
  return cljs.core.pr_str.call(null, this$)
};
goog.provide("clojure.string");
goog.require("cljs.core");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
clojure.string.seq_reverse = function seq_reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
clojure.string.reverse = function reverse(s) {
  return s.split("").reverse().join("")
};
clojure.string.replace = function replace(s, match, replacement) {
  if(cljs.core.string_QMARK_.call(null, match)) {
    return s.replace(new RegExp(goog.string.regExpEscape(match), "g"), replacement)
  }else {
    if(cljs.core.truth_(match.hasOwnProperty("source"))) {
      return s.replace(new RegExp(match.source, "g"), replacement)
    }else {
      if("\ufdd0'else") {
        throw[cljs.core.str("Invalid match arg: "), cljs.core.str(match)].join("");
      }else {
        return null
      }
    }
  }
};
clojure.string.replace_first = function replace_first(s, match, replacement) {
  return s.replace(match, replacement)
};
clojure.string.join = function() {
  var join = null;
  var join__1 = function(coll) {
    return cljs.core.apply.call(null, cljs.core.str, coll)
  };
  var join__2 = function(separator, coll) {
    return cljs.core.apply.call(null, cljs.core.str, cljs.core.interpose.call(null, separator, coll))
  };
  join = function(separator, coll) {
    switch(arguments.length) {
      case 1:
        return join__1.call(this, separator);
      case 2:
        return join__2.call(this, separator, coll)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$lang$arity$1 = join__1;
  join.cljs$lang$arity$2 = join__2;
  return join
}();
clojure.string.upper_case = function upper_case(s) {
  return s.toUpperCase()
};
clojure.string.lower_case = function lower_case(s) {
  return s.toLowerCase()
};
clojure.string.capitalize = function capitalize(s) {
  if(cljs.core.count.call(null, s) < 2) {
    return clojure.string.upper_case.call(null, s)
  }else {
    return[cljs.core.str(clojure.string.upper_case.call(null, cljs.core.subs.call(null, s, 0, 1))), cljs.core.str(clojure.string.lower_case.call(null, cljs.core.subs.call(null, s, 1)))].join("")
  }
};
clojure.string.split = function() {
  var split = null;
  var split__2 = function(s, re) {
    return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
  };
  var split__3 = function(s, re, limit) {
    if(limit < 1) {
      return cljs.core.vec.call(null, [cljs.core.str(s)].join("").split(re))
    }else {
      var s__$1 = s;
      var limit__$1 = limit;
      var parts = cljs.core.PersistentVector.EMPTY;
      while(true) {
        if(cljs.core._EQ_.call(null, limit__$1, 1)) {
          return cljs.core.conj.call(null, parts, s__$1)
        }else {
          var temp__3971__auto__ = cljs.core.re_find.call(null, re, s__$1);
          if(cljs.core.truth_(temp__3971__auto__)) {
            var m = temp__3971__auto__;
            var index = s__$1.indexOf(m);
            var G__4334 = s__$1.substring(index + cljs.core.count.call(null, m));
            var G__4335 = limit__$1 - 1;
            var G__4336 = cljs.core.conj.call(null, parts, s__$1.substring(0, index));
            s__$1 = G__4334;
            limit__$1 = G__4335;
            parts = G__4336;
            continue
          }else {
            return cljs.core.conj.call(null, parts, s__$1)
          }
        }
        break
      }
    }
  };
  split = function(s, re, limit) {
    switch(arguments.length) {
      case 2:
        return split__2.call(this, s, re);
      case 3:
        return split__3.call(this, s, re, limit)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  split.cljs$lang$arity$2 = split__2;
  split.cljs$lang$arity$3 = split__3;
  return split
}();
clojure.string.split_lines = function split_lines(s) {
  return clojure.string.split.call(null, s, /\n|\r\n/)
};
clojure.string.trim = function trim(s) {
  return goog.string.trim(s)
};
clojure.string.triml = function triml(s) {
  return goog.string.trimLeft(s)
};
clojure.string.trimr = function trimr(s) {
  return goog.string.trimRight(s)
};
clojure.string.trim_newline = function trim_newline(s) {
  var index = s.length;
  while(true) {
    if(index === 0) {
      return""
    }else {
      var ch = cljs.core._lookup.call(null, s, index - 1, null);
      if(function() {
        var or__3824__auto__ = cljs.core._EQ_.call(null, ch, "\n");
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return cljs.core._EQ_.call(null, ch, "\r")
        }
      }()) {
        var G__4337 = index - 1;
        index = G__4337;
        continue
      }else {
        return s.substring(0, index)
      }
    }
    break
  }
};
clojure.string.blank_QMARK_ = function blank_QMARK_(s) {
  return goog.string.isEmptySafe(s)
};
clojure.string.escape = function escape(s, cmap) {
  var buffer = new goog.string.StringBuffer;
  var length = s.length;
  var index = 0;
  while(true) {
    if(cljs.core._EQ_.call(null, length, index)) {
      return buffer.toString()
    }else {
      var ch = s.charAt(index);
      var temp__3971__auto___4338 = cljs.core._lookup.call(null, cmap, ch, null);
      if(cljs.core.truth_(temp__3971__auto___4338)) {
        var replacement_4339 = temp__3971__auto___4338;
        buffer.append([cljs.core.str(replacement_4339)].join(""))
      }else {
        buffer.append(ch)
      }
      var G__4340 = index + 1;
      index = G__4340;
      continue
    }
    break
  }
};
goog.provide("cljs.reader");
goog.require("cljs.core");
goog.require("goog.string");
cljs.reader.PushbackReader = {};
cljs.reader.read_char = function read_char(reader) {
  if(function() {
    var and__3822__auto__ = reader;
    if(and__3822__auto__) {
      return reader.cljs$reader$PushbackReader$read_char$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return reader.cljs$reader$PushbackReader$read_char$arity$1(reader)
  }else {
    var x__2390__auto__ = reader == null ? null : reader;
    return function() {
      var or__3824__auto__ = cljs.reader.read_char[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.reader.read_char["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.read-char", reader);
        }
      }
    }().call(null, reader)
  }
};
cljs.reader.unread = function unread(reader, ch) {
  if(function() {
    var and__3822__auto__ = reader;
    if(and__3822__auto__) {
      return reader.cljs$reader$PushbackReader$unread$arity$2
    }else {
      return and__3822__auto__
    }
  }()) {
    return reader.cljs$reader$PushbackReader$unread$arity$2(reader, ch)
  }else {
    var x__2390__auto__ = reader == null ? null : reader;
    return function() {
      var or__3824__auto__ = cljs.reader.unread[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.reader.unread["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "PushbackReader.unread", reader);
        }
      }
    }().call(null, reader, ch)
  }
};
goog.provide("cljs.reader.StringPushbackReader");
cljs.reader.StringPushbackReader = function(s, index_atom, buffer_atom) {
  this.s = s;
  this.index_atom = index_atom;
  this.buffer_atom = buffer_atom
};
cljs.reader.StringPushbackReader.cljs$lang$type = true;
cljs.reader.StringPushbackReader.cljs$lang$ctorPrSeq = function(this__2330__auto__) {
  return cljs.core.list.call(null, "cljs.reader/StringPushbackReader")
};
cljs.reader.StringPushbackReader.cljs$lang$ctorPrWriter = function(this__2330__auto__, writer__2331__auto__, opt__2332__auto__) {
  return cljs.core._write.call(null, writer__2331__auto__, "cljs.reader/StringPushbackReader")
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$ = true;
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$read_char$arity$1 = function(reader) {
  var self__ = this;
  if(cljs.core.empty_QMARK_.call(null, cljs.core.deref.call(null, self__.buffer_atom))) {
    var idx = cljs.core.deref.call(null, self__.index_atom);
    cljs.core.swap_BANG_.call(null, self__.index_atom, cljs.core.inc);
    return self__.s[idx]
  }else {
    var buf = cljs.core.deref.call(null, self__.buffer_atom);
    cljs.core.swap_BANG_.call(null, self__.buffer_atom, cljs.core.rest);
    return cljs.core.first.call(null, buf)
  }
};
cljs.reader.StringPushbackReader.prototype.cljs$reader$PushbackReader$unread$arity$2 = function(reader, ch) {
  var self__ = this;
  return cljs.core.swap_BANG_.call(null, self__.buffer_atom, function(p1__3474_SHARP_) {
    return cljs.core.cons.call(null, ch, p1__3474_SHARP_)
  })
};
cljs.reader.push_back_reader = function push_back_reader(s) {
  return new cljs.reader.StringPushbackReader(s, cljs.core.atom.call(null, 0), cljs.core.atom.call(null, null))
};
cljs.reader.whitespace_QMARK_ = function whitespace_QMARK_(ch) {
  var or__3824__auto__ = goog.string.isBreakingWhitespace(ch);
  if(cljs.core.truth_(or__3824__auto__)) {
    return or__3824__auto__
  }else {
    return"," === ch
  }
};
cljs.reader.numeric_QMARK_ = function numeric_QMARK_(ch) {
  return goog.string.isNumeric(ch)
};
cljs.reader.comment_prefix_QMARK_ = function comment_prefix_QMARK_(ch) {
  return";" === ch
};
cljs.reader.number_literal_QMARK_ = function number_literal_QMARK_(reader, initch) {
  var or__3824__auto__ = cljs.reader.numeric_QMARK_.call(null, initch);
  if(or__3824__auto__) {
    return or__3824__auto__
  }else {
    var and__3822__auto__ = function() {
      var or__3824__auto____$1 = "+" === initch;
      if(or__3824__auto____$1) {
        return or__3824__auto____$1
      }else {
        return"-" === initch
      }
    }();
    if(cljs.core.truth_(and__3822__auto__)) {
      return cljs.reader.numeric_QMARK_.call(null, function() {
        var next_ch = cljs.reader.read_char.call(null, reader);
        cljs.reader.unread.call(null, reader, next_ch);
        return next_ch
      }())
    }else {
      return and__3822__auto__
    }
  }
};
cljs.reader.reader_error = function() {
  var reader_error__delegate = function(rdr, msg) {
    throw new Error(cljs.core.apply.call(null, cljs.core.str, msg));
  };
  var reader_error = function(rdr, var_args) {
    var msg = null;
    if(goog.isDef(var_args)) {
      msg = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return reader_error__delegate.call(this, rdr, msg)
  };
  reader_error.cljs$lang$maxFixedArity = 1;
  reader_error.cljs$lang$applyTo = function(arglist__3475) {
    var rdr = cljs.core.first(arglist__3475);
    var msg = cljs.core.rest(arglist__3475);
    return reader_error__delegate(rdr, msg)
  };
  reader_error.cljs$lang$arity$variadic = reader_error__delegate;
  return reader_error
}();
cljs.reader.macro_terminating_QMARK_ = function macro_terminating_QMARK_(ch) {
  var and__3822__auto__ = !(ch === "#");
  if(and__3822__auto__) {
    var and__3822__auto____$1 = !(ch === "'");
    if(and__3822__auto____$1) {
      var and__3822__auto____$2 = !(ch === ":");
      if(and__3822__auto____$2) {
        return cljs.reader.macros.call(null, ch)
      }else {
        return and__3822__auto____$2
      }
    }else {
      return and__3822__auto____$1
    }
  }else {
    return and__3822__auto__
  }
};
cljs.reader.read_token = function read_token(rdr, initch) {
  var sb = new goog.string.StringBuffer(initch);
  var ch = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(function() {
      var or__3824__auto__ = ch == null;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.reader.whitespace_QMARK_.call(null, ch);
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          return cljs.reader.macro_terminating_QMARK_.call(null, ch)
        }
      }
    }()) {
      cljs.reader.unread.call(null, rdr, ch);
      return sb.toString()
    }else {
      var G__3476 = function() {
        sb.append(ch);
        return sb
      }();
      var G__3477 = cljs.reader.read_char.call(null, rdr);
      sb = G__3476;
      ch = G__3477;
      continue
    }
    break
  }
};
cljs.reader.skip_line = function skip_line(reader, _) {
  while(true) {
    var ch = cljs.reader.read_char.call(null, reader);
    if(function() {
      var or__3824__auto__ = ch === "n";
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = ch === "r";
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          return ch == null
        }
      }
    }()) {
      return reader
    }else {
      continue
    }
    break
  }
};
cljs.reader.int_pattern = cljs.core.re_pattern.call(null, "([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?");
cljs.reader.ratio_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+)/([0-9]+)");
cljs.reader.float_pattern = cljs.core.re_pattern.call(null, "([-+]?[0-9]+(\\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?");
cljs.reader.symbol_pattern = cljs.core.re_pattern.call(null, "[:]?([^0-9/].*/)?([^0-9/][^/]*)");
cljs.reader.re_find_STAR_ = function re_find_STAR_(re, s) {
  var matches = re.exec(s);
  if(matches == null) {
    return null
  }else {
    if(matches.length === 1) {
      return matches[0]
    }else {
      return matches
    }
  }
};
cljs.reader.match_int = function match_int(s) {
  var groups = cljs.reader.re_find_STAR_.call(null, cljs.reader.int_pattern, s);
  var group3 = groups[2];
  if(!function() {
    var or__3824__auto__ = group3 == null;
    if(or__3824__auto__) {
      return or__3824__auto__
    }else {
      return group3.length < 1
    }
  }()) {
    return 0
  }else {
    var negate = "-" === groups[1] ? -1 : 1;
    var a = cljs.core.truth_(groups[3]) ? [groups[3], 10] : cljs.core.truth_(groups[4]) ? [groups[4], 16] : cljs.core.truth_(groups[5]) ? [groups[5], 8] : cljs.core.truth_(groups[7]) ? [groups[7], parseInt(groups[7])] : "\ufdd0'default" ? [null, null] : null;
    var n = a[0];
    var radix = a[1];
    if(n == null) {
      return null
    }else {
      return negate * parseInt(n, radix)
    }
  }
};
cljs.reader.match_ratio = function match_ratio(s) {
  var groups = cljs.reader.re_find_STAR_.call(null, cljs.reader.ratio_pattern, s);
  var numinator = groups[1];
  var denominator = groups[2];
  return parseInt(numinator) / parseInt(denominator)
};
cljs.reader.match_float = function match_float(s) {
  return parseFloat(s)
};
cljs.reader.re_matches_STAR_ = function re_matches_STAR_(re, s) {
  var matches = re.exec(s);
  if(function() {
    var and__3822__auto__ = !(matches == null);
    if(and__3822__auto__) {
      return matches[0] === s
    }else {
      return and__3822__auto__
    }
  }()) {
    if(matches.length === 1) {
      return matches[0]
    }else {
      return matches
    }
  }else {
    return null
  }
};
cljs.reader.match_number = function match_number(s) {
  if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.int_pattern, s))) {
    return cljs.reader.match_int.call(null, s)
  }else {
    if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.ratio_pattern, s))) {
      return cljs.reader.match_ratio.call(null, s)
    }else {
      if(cljs.core.truth_(cljs.reader.re_matches_STAR_.call(null, cljs.reader.float_pattern, s))) {
        return cljs.reader.match_float.call(null, s)
      }else {
        return null
      }
    }
  }
};
cljs.reader.escape_char_map = function escape_char_map(c) {
  if(c === "t") {
    return"\t"
  }else {
    if(c === "r") {
      return"\r"
    }else {
      if(c === "n") {
        return"\n"
      }else {
        if(c === "\\") {
          return"\\"
        }else {
          if(c === '"') {
            return'"'
          }else {
            if(c === "b") {
              return"\b"
            }else {
              if(c === "f") {
                return"\f"
              }else {
                if("\ufdd0'else") {
                  return null
                }else {
                  return null
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.read_2_chars = function read_2_chars(reader) {
  return(new goog.string.StringBuffer(cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader))).toString()
};
cljs.reader.read_4_chars = function read_4_chars(reader) {
  return(new goog.string.StringBuffer(cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader), cljs.reader.read_char.call(null, reader))).toString()
};
cljs.reader.unicode_2_pattern = cljs.core.re_pattern.call(null, "[0-9A-Fa-f]{2}");
cljs.reader.unicode_4_pattern = cljs.core.re_pattern.call(null, "[0-9A-Fa-f]{4}");
cljs.reader.validate_unicode_escape = function validate_unicode_escape(unicode_pattern, reader, escape_char, unicode_str) {
  if(cljs.core.truth_(cljs.core.re_matches.call(null, unicode_pattern, unicode_str))) {
    return unicode_str
  }else {
    return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", escape_char, unicode_str)
  }
};
cljs.reader.make_unicode_char = function make_unicode_char(code_str) {
  var code = parseInt(code_str, 16);
  return String.fromCharCode(code)
};
cljs.reader.escape_char = function escape_char(buffer, reader) {
  var ch = cljs.reader.read_char.call(null, reader);
  var mapresult = cljs.reader.escape_char_map.call(null, ch);
  if(cljs.core.truth_(mapresult)) {
    return mapresult
  }else {
    if(ch === "x") {
      return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_2_pattern, reader, ch, cljs.reader.read_2_chars.call(null, reader)))
    }else {
      if(ch === "u") {
        return cljs.reader.make_unicode_char.call(null, cljs.reader.validate_unicode_escape.call(null, cljs.reader.unicode_4_pattern, reader, ch, cljs.reader.read_4_chars.call(null, reader)))
      }else {
        if(cljs.reader.numeric_QMARK_.call(null, ch)) {
          return String.fromCharCode(ch)
        }else {
          if("\ufdd0'else") {
            return cljs.reader.reader_error.call(null, reader, "Unexpected unicode escape \\", ch)
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.reader.read_past = function read_past(pred, rdr) {
  var ch = cljs.reader.read_char.call(null, rdr);
  while(true) {
    if(cljs.core.truth_(pred.call(null, ch))) {
      var G__3478 = cljs.reader.read_char.call(null, rdr);
      ch = G__3478;
      continue
    }else {
      return ch
    }
    break
  }
};
cljs.reader.read_delimited_list = function read_delimited_list(delim, rdr, recursive_QMARK_) {
  var a = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    var ch = cljs.reader.read_past.call(null, cljs.reader.whitespace_QMARK_, rdr);
    if(cljs.core.truth_(ch)) {
    }else {
      cljs.reader.reader_error.call(null, rdr, "EOF while reading")
    }
    if(delim === ch) {
      return cljs.core.persistent_BANG_.call(null, a)
    }else {
      var temp__3971__auto__ = cljs.reader.macros.call(null, ch);
      if(cljs.core.truth_(temp__3971__auto__)) {
        var macrofn = temp__3971__auto__;
        var mret = macrofn.call(null, rdr, ch);
        var G__3479 = mret === rdr ? a : cljs.core.conj_BANG_.call(null, a, mret);
        a = G__3479;
        continue
      }else {
        cljs.reader.unread.call(null, rdr, ch);
        var o = cljs.reader.read.call(null, rdr, true, null, recursive_QMARK_);
        var G__3480 = o === rdr ? a : cljs.core.conj_BANG_.call(null, a, o);
        a = G__3480;
        continue
      }
    }
    break
  }
};
cljs.reader.not_implemented = function not_implemented(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Reader for ", ch, " not implemented yet")
};
cljs.reader.read_dispatch = function read_dispatch(rdr, _) {
  var ch = cljs.reader.read_char.call(null, rdr);
  var dm = cljs.reader.dispatch_macros.call(null, ch);
  if(cljs.core.truth_(dm)) {
    return dm.call(null, rdr, _)
  }else {
    var temp__3971__auto__ = cljs.reader.maybe_read_tagged_type.call(null, rdr, ch);
    if(cljs.core.truth_(temp__3971__auto__)) {
      var obj = temp__3971__auto__;
      return obj
    }else {
      return cljs.reader.reader_error.call(null, rdr, "No dispatch macro for ", ch)
    }
  }
};
cljs.reader.read_unmatched_delimiter = function read_unmatched_delimiter(rdr, ch) {
  return cljs.reader.reader_error.call(null, rdr, "Unmached delimiter ", ch)
};
cljs.reader.read_list = function read_list(rdr, _) {
  return cljs.core.apply.call(null, cljs.core.list, cljs.reader.read_delimited_list.call(null, ")", rdr, true))
};
cljs.reader.read_comment = cljs.reader.skip_line;
cljs.reader.read_vector = function read_vector(rdr, _) {
  return cljs.reader.read_delimited_list.call(null, "]", rdr, true)
};
cljs.reader.read_map = function read_map(rdr, _) {
  var l = cljs.reader.read_delimited_list.call(null, "}", rdr, true);
  if(cljs.core.odd_QMARK_.call(null, cljs.core.count.call(null, l))) {
    cljs.reader.reader_error.call(null, rdr, "Map literal must contain an even number of forms")
  }else {
  }
  return cljs.core.apply.call(null, cljs.core.hash_map, l)
};
cljs.reader.read_number = function read_number(reader, initch) {
  var buffer = new goog.string.StringBuffer(initch);
  var ch = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(cljs.core.truth_(function() {
      var or__3824__auto__ = ch == null;
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = cljs.reader.whitespace_QMARK_.call(null, ch);
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          return cljs.reader.macros.call(null, ch)
        }
      }
    }())) {
      cljs.reader.unread.call(null, reader, ch);
      var s = buffer.toString();
      var or__3824__auto__ = cljs.reader.match_number.call(null, s);
      if(cljs.core.truth_(or__3824__auto__)) {
        return or__3824__auto__
      }else {
        return cljs.reader.reader_error.call(null, reader, "Invalid number format [", s, "]")
      }
    }else {
      var G__3481 = function() {
        buffer.append(ch);
        return buffer
      }();
      var G__3482 = cljs.reader.read_char.call(null, reader);
      buffer = G__3481;
      ch = G__3482;
      continue
    }
    break
  }
};
cljs.reader.read_string_STAR_ = function read_string_STAR_(reader, _) {
  var buffer = new goog.string.StringBuffer;
  var ch = cljs.reader.read_char.call(null, reader);
  while(true) {
    if(ch == null) {
      return cljs.reader.reader_error.call(null, reader, "EOF while reading")
    }else {
      if("\\" === ch) {
        var G__3483 = function() {
          buffer.append(cljs.reader.escape_char.call(null, buffer, reader));
          return buffer
        }();
        var G__3484 = cljs.reader.read_char.call(null, reader);
        buffer = G__3483;
        ch = G__3484;
        continue
      }else {
        if('"' === ch) {
          return buffer.toString()
        }else {
          if("\ufdd0'default") {
            var G__3485 = function() {
              buffer.append(ch);
              return buffer
            }();
            var G__3486 = cljs.reader.read_char.call(null, reader);
            buffer = G__3485;
            ch = G__3486;
            continue
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.special_symbols = function special_symbols(t, not_found) {
  if(t === "nil") {
    return null
  }else {
    if(t === "true") {
      return true
    }else {
      if(t === "false") {
        return false
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.read_symbol = function read_symbol(reader, initch) {
  var token = cljs.reader.read_token.call(null, reader, initch);
  if(cljs.core.truth_(goog.string.contains(token, "/"))) {
    return cljs.core.symbol.call(null, cljs.core.subs.call(null, token, 0, token.indexOf("/")), cljs.core.subs.call(null, token, token.indexOf("/") + 1, token.length))
  }else {
    return cljs.reader.special_symbols.call(null, token, cljs.core.symbol.call(null, token))
  }
};
cljs.reader.read_keyword = function read_keyword(reader, initch) {
  var token = cljs.reader.read_token.call(null, reader, cljs.reader.read_char.call(null, reader));
  var a = cljs.reader.re_matches_STAR_.call(null, cljs.reader.symbol_pattern, token);
  var token__$1 = a[0];
  var ns = a[1];
  var name = a[2];
  if(cljs.core.truth_(function() {
    var or__3824__auto__ = function() {
      var and__3822__auto__ = !(void 0 === ns);
      if(and__3822__auto__) {
        return ns.substring(ns.length - 2, ns.length) === ":/"
      }else {
        return and__3822__auto__
      }
    }();
    if(cljs.core.truth_(or__3824__auto__)) {
      return or__3824__auto__
    }else {
      var or__3824__auto____$1 = name[name.length - 1] === ":";
      if(or__3824__auto____$1) {
        return or__3824__auto____$1
      }else {
        return!(token__$1.indexOf("::", 1) === -1)
      }
    }
  }())) {
    return cljs.reader.reader_error.call(null, reader, "Invalid token: ", token__$1)
  }else {
    if(function() {
      var and__3822__auto__ = !(ns == null);
      if(and__3822__auto__) {
        return ns.length > 0
      }else {
        return and__3822__auto__
      }
    }()) {
      return cljs.core.keyword.call(null, ns.substring(0, ns.indexOf("/")), name)
    }else {
      return cljs.core.keyword.call(null, token__$1)
    }
  }
};
cljs.reader.desugar_meta = function desugar_meta(f) {
  if(cljs.core.symbol_QMARK_.call(null, f)) {
    return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
  }else {
    if(cljs.core.string_QMARK_.call(null, f)) {
      return cljs.core.ObjMap.fromObject(["\ufdd0'tag"], {"\ufdd0'tag":f})
    }else {
      if(cljs.core.keyword_QMARK_.call(null, f)) {
        return cljs.core.PersistentArrayMap.fromArrays([f], [true])
      }else {
        if("\ufdd0'else") {
          return f
        }else {
          return null
        }
      }
    }
  }
};
cljs.reader.wrapping_reader = function wrapping_reader(sym) {
  return function(rdr, _) {
    return cljs.core.list.call(null, sym, cljs.reader.read.call(null, rdr, true, null, true))
  }
};
cljs.reader.throwing_reader = function throwing_reader(msg) {
  return function(rdr, _) {
    return cljs.reader.reader_error.call(null, rdr, msg)
  }
};
cljs.reader.read_meta = function read_meta(rdr, _) {
  var m = cljs.reader.desugar_meta.call(null, cljs.reader.read.call(null, rdr, true, null, true));
  if(cljs.core.map_QMARK_.call(null, m)) {
  }else {
    cljs.reader.reader_error.call(null, rdr, "Metadata must be Symbol,Keyword,String or Map")
  }
  var o = cljs.reader.read.call(null, rdr, true, null, true);
  if(function() {
    var G__3488 = o;
    if(G__3488) {
      if(function() {
        var or__3824__auto__ = G__3488.cljs$lang$protocol_mask$partition0$ & 262144;
        if(or__3824__auto__) {
          return or__3824__auto__
        }else {
          return G__3488.cljs$core$IWithMeta$
        }
      }()) {
        return true
      }else {
        if(!G__3488.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__3488)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IWithMeta, G__3488)
    }
  }()) {
    return cljs.core.with_meta.call(null, o, cljs.core.merge.call(null, cljs.core.meta.call(null, o), m))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Metadata can only be applied to IWithMetas")
  }
};
cljs.reader.read_set = function read_set(rdr, _) {
  return cljs.core.set.call(null, cljs.reader.read_delimited_list.call(null, "}", rdr, true))
};
cljs.reader.read_regex = function read_regex(rdr, ch) {
  return cljs.core.re_pattern.call(null, cljs.reader.read_string_STAR_.call(null, rdr, ch))
};
cljs.reader.read_discard = function read_discard(rdr, _) {
  cljs.reader.read.call(null, rdr, true, null, true);
  return rdr
};
cljs.reader.macros = function macros(c) {
  if(c === '"') {
    return cljs.reader.read_string_STAR_
  }else {
    if(c === ":") {
      return cljs.reader.read_keyword
    }else {
      if(c === ";") {
        return cljs.reader.not_implemented
      }else {
        if(c === "'") {
          return cljs.reader.wrapping_reader.call(null, "\ufdd1'quote")
        }else {
          if(c === "@") {
            return cljs.reader.wrapping_reader.call(null, "\ufdd1'deref")
          }else {
            if(c === "^") {
              return cljs.reader.read_meta
            }else {
              if(c === "`") {
                return cljs.reader.not_implemented
              }else {
                if(c === "~") {
                  return cljs.reader.not_implemented
                }else {
                  if(c === "(") {
                    return cljs.reader.read_list
                  }else {
                    if(c === ")") {
                      return cljs.reader.read_unmatched_delimiter
                    }else {
                      if(c === "[") {
                        return cljs.reader.read_vector
                      }else {
                        if(c === "]") {
                          return cljs.reader.read_unmatched_delimiter
                        }else {
                          if(c === "{") {
                            return cljs.reader.read_map
                          }else {
                            if(c === "}") {
                              return cljs.reader.read_unmatched_delimiter
                            }else {
                              if(c === "\\") {
                                return cljs.reader.read_char
                              }else {
                                if(c === "%") {
                                  return cljs.reader.not_implemented
                                }else {
                                  if(c === "#") {
                                    return cljs.reader.read_dispatch
                                  }else {
                                    if("\ufdd0'else") {
                                      return null
                                    }else {
                                      return null
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.reader.dispatch_macros = function dispatch_macros(s) {
  if(s === "{") {
    return cljs.reader.read_set
  }else {
    if(s === "<") {
      return cljs.reader.throwing_reader.call(null, "Unreadable form")
    }else {
      if(s === '"') {
        return cljs.reader.read_regex
      }else {
        if(s === "!") {
          return cljs.reader.read_comment
        }else {
          if(s === "_") {
            return cljs.reader.read_discard
          }else {
            if("\ufdd0'else") {
              return null
            }else {
              return null
            }
          }
        }
      }
    }
  }
};
cljs.reader.read = function read(reader, eof_is_error, sentinel, is_recursive) {
  while(true) {
    var ch = cljs.reader.read_char.call(null, reader);
    if(ch == null) {
      if(cljs.core.truth_(eof_is_error)) {
        return cljs.reader.reader_error.call(null, reader, "EOF while reading")
      }else {
        return sentinel
      }
    }else {
      if(cljs.reader.whitespace_QMARK_.call(null, ch)) {
        var G__3489 = reader;
        var G__3490 = eof_is_error;
        var G__3491 = sentinel;
        var G__3492 = is_recursive;
        reader = G__3489;
        eof_is_error = G__3490;
        sentinel = G__3491;
        is_recursive = G__3492;
        continue
      }else {
        if(cljs.reader.comment_prefix_QMARK_.call(null, ch)) {
          var G__3493 = cljs.reader.read_comment.call(null, reader, ch);
          var G__3494 = eof_is_error;
          var G__3495 = sentinel;
          var G__3496 = is_recursive;
          reader = G__3493;
          eof_is_error = G__3494;
          sentinel = G__3495;
          is_recursive = G__3496;
          continue
        }else {
          if("\ufdd0'else") {
            var f = cljs.reader.macros.call(null, ch);
            var res = cljs.core.truth_(f) ? f.call(null, reader, ch) : cljs.reader.number_literal_QMARK_.call(null, reader, ch) ? cljs.reader.read_number.call(null, reader, ch) : "\ufdd0'else" ? cljs.reader.read_symbol.call(null, reader, ch) : null;
            if(res === reader) {
              var G__3497 = reader;
              var G__3498 = eof_is_error;
              var G__3499 = sentinel;
              var G__3500 = is_recursive;
              reader = G__3497;
              eof_is_error = G__3498;
              sentinel = G__3499;
              is_recursive = G__3500;
              continue
            }else {
              return res
            }
          }else {
            return null
          }
        }
      }
    }
    break
  }
};
cljs.reader.read_string = function read_string(s) {
  var r = cljs.reader.push_back_reader.call(null, s);
  return cljs.reader.read.call(null, r, true, null, false)
};
cljs.reader.zero_fill_right = function zero_fill_right(s, width) {
  if(cljs.core._EQ_.call(null, width, cljs.core.count.call(null, s))) {
    return s
  }else {
    if(width < cljs.core.count.call(null, s)) {
      return s.substring(0, width)
    }else {
      if("\ufdd0'else") {
        var b = new goog.string.StringBuffer(s);
        while(true) {
          if(b.getLength() < width) {
            var G__3501 = b.append("0");
            b = G__3501;
            continue
          }else {
            return b.toString()
          }
          break
        }
      }else {
        return null
      }
    }
  }
};
cljs.reader.divisible_QMARK_ = function divisible_QMARK_(num, div) {
  return cljs.core.mod.call(null, num, div) === 0
};
cljs.reader.indivisible_QMARK_ = function indivisible_QMARK_(num, div) {
  return cljs.core.not.call(null, cljs.reader.divisible_QMARK_.call(null, num, div))
};
cljs.reader.leap_year_QMARK_ = function leap_year_QMARK_(year) {
  var and__3822__auto__ = cljs.reader.divisible_QMARK_.call(null, year, 4);
  if(cljs.core.truth_(and__3822__auto__)) {
    var or__3824__auto__ = cljs.reader.indivisible_QMARK_.call(null, year, 100);
    if(cljs.core.truth_(or__3824__auto__)) {
      return or__3824__auto__
    }else {
      return cljs.reader.divisible_QMARK_.call(null, year, 400)
    }
  }else {
    return and__3822__auto__
  }
};
cljs.reader.days_in_month = function() {
  var dim_norm = cljs.core.PersistentVector.fromArray([null, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  var dim_leap = cljs.core.PersistentVector.fromArray([null, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], true);
  return function(month, leap_year_QMARK_) {
    return cljs.core._lookup.call(null, cljs.core.truth_(leap_year_QMARK_) ? dim_leap : dim_norm, month, null)
  }
}();
cljs.reader.parse_and_validate_timestamp = function() {
  var timestamp = /(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;
  var check = function(low, n, high, msg) {
    if(function() {
      var and__3822__auto__ = low <= n;
      if(and__3822__auto__) {
        return n <= high
      }else {
        return and__3822__auto__
      }
    }()) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str([cljs.core.str(msg), cljs.core.str(" Failed:  "), cljs.core.str(low), cljs.core.str("<="), cljs.core.str(n), cljs.core.str("<="), cljs.core.str(high)].join("")), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'<=", "\ufdd1'low", "\ufdd1'n", "\ufdd1'high"), cljs.core.hash_map("\ufdd0'line", 474))))].join(""));
    }
    return n
  };
  return function(ts) {
    var temp__3974__auto__ = cljs.core.map.call(null, cljs.core.vec, cljs.core.split_at.call(null, 8, cljs.core.re_matches.call(null, timestamp, ts)));
    if(cljs.core.truth_(temp__3974__auto__)) {
      var vec__3506 = temp__3974__auto__;
      var vec__3507 = cljs.core.nth.call(null, vec__3506, 0, null);
      var _ = cljs.core.nth.call(null, vec__3507, 0, null);
      var years = cljs.core.nth.call(null, vec__3507, 1, null);
      var months = cljs.core.nth.call(null, vec__3507, 2, null);
      var days = cljs.core.nth.call(null, vec__3507, 3, null);
      var hours = cljs.core.nth.call(null, vec__3507, 4, null);
      var minutes = cljs.core.nth.call(null, vec__3507, 5, null);
      var seconds = cljs.core.nth.call(null, vec__3507, 6, null);
      var milliseconds = cljs.core.nth.call(null, vec__3507, 7, null);
      var vec__3508 = cljs.core.nth.call(null, vec__3506, 1, null);
      var ___$1 = cljs.core.nth.call(null, vec__3508, 0, null);
      var ___$2 = cljs.core.nth.call(null, vec__3508, 1, null);
      var ___$3 = cljs.core.nth.call(null, vec__3508, 2, null);
      var V = vec__3506;
      var vec__3509 = cljs.core.map.call(null, function(v) {
        return cljs.core.map.call(null, function(p1__3505_SHARP_) {
          return parseInt(p1__3505_SHARP_, 10)
        }, v)
      }, cljs.core.map.call(null, function(p1__3503_SHARP_, p2__3502_SHARP_) {
        return cljs.core.update_in.call(null, p2__3502_SHARP_, cljs.core.PersistentVector.fromArray([0], true), p1__3503_SHARP_)
      }, cljs.core.PersistentVector.fromArray([cljs.core.constantly.call(null, null), function(p1__3504_SHARP_) {
        if(cljs.core._EQ_.call(null, p1__3504_SHARP_, "-")) {
          return"-1"
        }else {
          return"1"
        }
      }], true), V));
      var vec__3510 = cljs.core.nth.call(null, vec__3509, 0, null);
      var ___$4 = cljs.core.nth.call(null, vec__3510, 0, null);
      var y = cljs.core.nth.call(null, vec__3510, 1, null);
      var mo = cljs.core.nth.call(null, vec__3510, 2, null);
      var d = cljs.core.nth.call(null, vec__3510, 3, null);
      var h = cljs.core.nth.call(null, vec__3510, 4, null);
      var m = cljs.core.nth.call(null, vec__3510, 5, null);
      var s = cljs.core.nth.call(null, vec__3510, 6, null);
      var ms = cljs.core.nth.call(null, vec__3510, 7, null);
      var vec__3511 = cljs.core.nth.call(null, vec__3509, 1, null);
      var offset_sign = cljs.core.nth.call(null, vec__3511, 0, null);
      var offset_hours = cljs.core.nth.call(null, vec__3511, 1, null);
      var offset_minutes = cljs.core.nth.call(null, vec__3511, 2, null);
      var offset = offset_sign * (offset_hours * 60 + offset_minutes);
      return cljs.core.PersistentVector.fromArray([cljs.core.not.call(null, years) ? 1970 : y, cljs.core.not.call(null, months) ? 1 : check.call(null, 1, mo, 12, "timestamp month field must be in range 1..12"), cljs.core.not.call(null, days) ? 1 : check.call(null, 1, d, cljs.reader.days_in_month.call(null, mo, cljs.reader.leap_year_QMARK_.call(null, y)), "timestamp day field must be in range 1..last day in month"), cljs.core.not.call(null, hours) ? 0 : check.call(null, 0, h, 23, "timestamp hour field must be in range 0..23"), 
      cljs.core.not.call(null, minutes) ? 0 : check.call(null, 0, m, 59, "timestamp minute field must be in range 0..59"), cljs.core.not.call(null, seconds) ? 0 : check.call(null, 0, s, cljs.core._EQ_.call(null, m, 59) ? 60 : 59, "timestamp second field must be in range 0..60"), cljs.core.not.call(null, milliseconds) ? 0 : check.call(null, 0, ms, 999, "timestamp millisecond field must be in range 0..999"), offset], true)
    }else {
      return null
    }
  }
}();
cljs.reader.parse_timestamp = function parse_timestamp(ts) {
  var temp__3971__auto__ = cljs.reader.parse_and_validate_timestamp.call(null, ts);
  if(cljs.core.truth_(temp__3971__auto__)) {
    var vec__3513 = temp__3971__auto__;
    var years = cljs.core.nth.call(null, vec__3513, 0, null);
    var months = cljs.core.nth.call(null, vec__3513, 1, null);
    var days = cljs.core.nth.call(null, vec__3513, 2, null);
    var hours = cljs.core.nth.call(null, vec__3513, 3, null);
    var minutes = cljs.core.nth.call(null, vec__3513, 4, null);
    var seconds = cljs.core.nth.call(null, vec__3513, 5, null);
    var ms = cljs.core.nth.call(null, vec__3513, 6, null);
    var offset = cljs.core.nth.call(null, vec__3513, 7, null);
    return new Date(Date.UTC(years, months - 1, days, hours, minutes, seconds, ms) - offset * 60 * 1E3)
  }else {
    return cljs.reader.reader_error.call(null, null, [cljs.core.str("Unrecognized date/time syntax: "), cljs.core.str(ts)].join(""))
  }
};
cljs.reader.read_date = function read_date(s) {
  if(cljs.core.string_QMARK_.call(null, s)) {
    return cljs.reader.parse_timestamp.call(null, s)
  }else {
    return cljs.reader.reader_error.call(null, null, "Instance literal expects a string for its timestamp.")
  }
};
cljs.reader.read_queue = function read_queue(elems) {
  if(cljs.core.vector_QMARK_.call(null, elems)) {
    return cljs.core.into.call(null, cljs.core.PersistentQueue.EMPTY, elems)
  }else {
    return cljs.reader.reader_error.call(null, null, "Queue literal expects a vector for its elements.")
  }
};
cljs.reader.read_uuid = function read_uuid(uuid) {
  if(cljs.core.string_QMARK_.call(null, uuid)) {
    return new cljs.core.UUID(uuid)
  }else {
    return cljs.reader.reader_error.call(null, null, "UUID literal expects a string as its representation.")
  }
};
cljs.reader._STAR_tag_table_STAR_ = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["inst", "uuid", "queue"], {"inst":cljs.reader.read_date, "uuid":cljs.reader.read_uuid, "queue":cljs.reader.read_queue}));
cljs.reader.maybe_read_tagged_type = function maybe_read_tagged_type(rdr, initch) {
  var tag = cljs.reader.read_symbol.call(null, rdr, initch);
  var temp__3971__auto__ = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), cljs.core.name.call(null, tag), null);
  if(cljs.core.truth_(temp__3971__auto__)) {
    var pfn = temp__3971__auto__;
    return pfn.call(null, cljs.reader.read.call(null, rdr, true, null, false))
  }else {
    return cljs.reader.reader_error.call(null, rdr, "Could not find tag parser for ", cljs.core.name.call(null, tag), " in ", cljs.core.pr_str.call(null, cljs.core.keys.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_))))
  }
};
cljs.reader.register_tag_parser_BANG_ = function register_tag_parser_BANG_(tag, f) {
  var tag__$1 = cljs.core.name.call(null, tag);
  var old_parser = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__$1, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.assoc, tag__$1, f);
  return old_parser
};
cljs.reader.deregister_tag_parser_BANG_ = function deregister_tag_parser_BANG_(tag) {
  var tag__$1 = cljs.core.name.call(null, tag);
  var old_parser = cljs.core._lookup.call(null, cljs.core.deref.call(null, cljs.reader._STAR_tag_table_STAR_), tag__$1, null);
  cljs.core.swap_BANG_.call(null, cljs.reader._STAR_tag_table_STAR_, cljs.core.dissoc, tag__$1);
  return old_parser
};
goog.provide("mrhyde.guts");
goog.require("cljs.core");
mrhyde.guts.hyde_proto_array_marker = "$cljs$mrhyde$isarray";
mrhyde.guts.hyde_proto_object_marker = "$cljs$mrhyde$isobject";
mrhyde.guts.get_store_cur_js_fn = function get_store_cur_js_fn(o, field_name) {
  var cur_fn = o[field_name];
  var js_fn_name = [cljs.core.str("_js_"), cljs.core.str(field_name)].join("");
  var root_fn = o[js_fn_name];
  if(cljs.core._EQ_.call(null, undefined, root_fn)) {
    o[js_fn_name] = cur_fn
  }else {
  }
  return cur_fn
};
mrhyde.guts.restore_original_js_fn = function restore_original_js_fn(o, field_name) {
  var js_fn_name = [cljs.core.str("_js_"), cljs.core.str(field_name)].join("");
  var root_fn = o[js_fn_name];
  if(cljs.core.not_EQ_.call(null, undefined, root_fn)) {
    o[field_name] = root_fn
  }else {
  }
  return root_fn
};
goog.provide("mrhyde.mrhyde");
goog.require("cljs.core");
goog.require("cljs.reader");
goog.require("clojure.string");
goog.require("mrhyde.guts");
goog.require("mrhyde.guts");
goog.require("cljs.reader");
goog.require("clojure.string");
mrhyde.mrhyde.IHyde = {};
mrhyde.mrhyde.has_cache_QMARK_ = function has_cache_QMARK_(this$) {
  if(function() {
    var and__3822__auto__ = this$;
    if(and__3822__auto__) {
      return this$.mrhyde$mrhyde$IHyde$has_cache_QMARK_$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return this$.mrhyde$mrhyde$IHyde$has_cache_QMARK_$arity$1(this$)
  }else {
    var x__2390__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3824__auto__ = mrhyde.mrhyde.has_cache_QMARK_[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = mrhyde.mrhyde.has_cache_QMARK_["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHyde.has-cache?", this$);
        }
      }
    }().call(null, this$)
  }
};
mrhyde.mrhyde.from_cache = function from_cache(this$) {
  if(function() {
    var and__3822__auto__ = this$;
    if(and__3822__auto__) {
      return this$.mrhyde$mrhyde$IHyde$from_cache$arity$1
    }else {
      return and__3822__auto__
    }
  }()) {
    return this$.mrhyde$mrhyde$IHyde$from_cache$arity$1(this$)
  }else {
    var x__2390__auto__ = this$ == null ? null : this$;
    return function() {
      var or__3824__auto__ = mrhyde.mrhyde.from_cache[goog.typeOf(x__2390__auto__)];
      if(or__3824__auto__) {
        return or__3824__auto__
      }else {
        var or__3824__auto____$1 = mrhyde.mrhyde.from_cache["_"];
        if(or__3824__auto____$1) {
          return or__3824__auto____$1
        }else {
          throw cljs.core.missing_protocol.call(null, "IHyde.from-cache", this$);
        }
      }
    }().call(null, this$)
  }
};
mrhyde.mrhyde.hyde_QMARK_ = function hyde_QMARK_(x) {
  var G__4329 = x;
  if(G__4329) {
    if(cljs.core.truth_(function() {
      var or__3824__auto__ = null;
      if(cljs.core.truth_(or__3824__auto__)) {
        return or__3824__auto__
      }else {
        return G__4329.mrhyde$mrhyde$IHyde$
      }
    }())) {
      return true
    }else {
      if(!G__4329.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, mrhyde.mrhyde.IHyde, G__4329)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, mrhyde.mrhyde.IHyde, G__4329)
  }
};
mrhyde.mrhyde.hyde_array_QMARK_ = function hyde_array_QMARK_(x) {
  var and__3822__auto__ = function() {
    var G__4331 = x;
    if(G__4331) {
      if(cljs.core.truth_(function() {
        var or__3824__auto__ = null;
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          return G__4331.mrhyde$mrhyde$IHyde$
        }
      }())) {
        return true
      }else {
        if(!G__4331.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, mrhyde.mrhyde.IHyde, G__4331)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, mrhyde.mrhyde.IHyde, G__4331)
    }
  }();
  if(cljs.core.truth_(and__3822__auto__)) {
    return x[mrhyde.guts.hyde_proto_array_marker]
  }else {
    return and__3822__auto__
  }
};
mrhyde.mrhyde.hyde_object_QMARK_ = function hyde_object_QMARK_(x) {
  var and__3822__auto__ = function() {
    var G__4333 = x;
    if(G__4333) {
      if(cljs.core.truth_(function() {
        var or__3824__auto__ = null;
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          return G__4333.mrhyde$mrhyde$IHyde$
        }
      }())) {
        return true
      }else {
        if(!G__4333.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, mrhyde.mrhyde.IHyde, G__4333)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, mrhyde.mrhyde.IHyde, G__4333)
    }
  }();
  if(cljs.core.truth_(and__3822__auto__)) {
    return x[mrhyde.guts.hyde_proto_object_marker]
  }else {
    return and__3822__auto__
  }
};
mrhyde.mrhyde.toclj = function toclj(x) {
  return cljs.core.js__GT_clj.call(null, x, "\ufdd0'keywordize-keys", true)
};
goog.exportSymbol("mrhyde.mrhyde.toclj", mrhyde.mrhyde.toclj);
mrhyde.mrhyde.tojs = function tojs(x) {
  return cljs.core.clj__GT_js.call(null, x)
};
goog.exportSymbol("mrhyde.mrhyde.tojs", mrhyde.mrhyde.tojs);
mrhyde.mrhyde.cljread = function cljread(x) {
  return cljs.reader.read_string.call(null, x)
};
goog.exportSymbol("mrhyde.mrhyde.cljread", mrhyde.mrhyde.cljread);
goog.provide("clojure.set");
goog.require("cljs.core");
clojure.set.bubble_max_key = function bubble_max_key(k, coll) {
  var max = cljs.core.apply.call(null, cljs.core.max_key, k, coll);
  return cljs.core.cons.call(null, max, cljs.core.remove.call(null, function(p1__4298_SHARP_) {
    return max === p1__4298_SHARP_
  }, coll))
};
clojure.set.union = function() {
  var union = null;
  var union__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var union__1 = function(s1) {
    return s1
  };
  var union__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, cljs.core.conj, s2, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.conj, s1, s2)
    }
  };
  var union__3 = function() {
    var G__4300__delegate = function(s1, s2, sets) {
      var bubbled_sets = clojure.set.bubble_max_key.call(null, cljs.core.count, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, cljs.core.into, cljs.core.first.call(null, bubbled_sets), cljs.core.rest.call(null, bubbled_sets))
    };
    var G__4300 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4300__delegate.call(this, s1, s2, sets)
    };
    G__4300.cljs$lang$maxFixedArity = 2;
    G__4300.cljs$lang$applyTo = function(arglist__4301) {
      var s1 = cljs.core.first(arglist__4301);
      var s2 = cljs.core.first(cljs.core.next(arglist__4301));
      var sets = cljs.core.rest(cljs.core.next(arglist__4301));
      return G__4300__delegate(s1, s2, sets)
    };
    G__4300.cljs$lang$arity$variadic = G__4300__delegate;
    return G__4300
  }();
  union = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 0:
        return union__0.call(this);
      case 1:
        return union__1.call(this, s1);
      case 2:
        return union__2.call(this, s1, s2);
      default:
        return union__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  union.cljs$lang$maxFixedArity = 2;
  union.cljs$lang$applyTo = union__3.cljs$lang$applyTo;
  union.cljs$lang$arity$0 = union__0;
  union.cljs$lang$arity$1 = union__1;
  union.cljs$lang$arity$2 = union__2;
  union.cljs$lang$arity$variadic = union__3.cljs$lang$arity$variadic;
  return union
}();
clojure.set.intersection = function() {
  var intersection = null;
  var intersection__1 = function(s1) {
    return s1
  };
  var intersection__2 = function(s1, s2) {
    while(true) {
      if(cljs.core.count.call(null, s2) < cljs.core.count.call(null, s1)) {
        var G__4302 = s2;
        var G__4303 = s1;
        s1 = G__4302;
        s2 = G__4303;
        continue
      }else {
        return cljs.core.reduce.call(null, function(s1, s2) {
          return function(result, item) {
            if(cljs.core.contains_QMARK_.call(null, s2, item)) {
              return result
            }else {
              return cljs.core.disj.call(null, result, item)
            }
          }
        }(s1, s2), s1, s1)
      }
      break
    }
  };
  var intersection__3 = function() {
    var G__4304__delegate = function(s1, s2, sets) {
      var bubbled_sets = clojure.set.bubble_max_key.call(null, function(p1__4299_SHARP_) {
        return-cljs.core.count.call(null, p1__4299_SHARP_)
      }, cljs.core.conj.call(null, sets, s2, s1));
      return cljs.core.reduce.call(null, intersection, cljs.core.first.call(null, bubbled_sets), cljs.core.rest.call(null, bubbled_sets))
    };
    var G__4304 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4304__delegate.call(this, s1, s2, sets)
    };
    G__4304.cljs$lang$maxFixedArity = 2;
    G__4304.cljs$lang$applyTo = function(arglist__4305) {
      var s1 = cljs.core.first(arglist__4305);
      var s2 = cljs.core.first(cljs.core.next(arglist__4305));
      var sets = cljs.core.rest(cljs.core.next(arglist__4305));
      return G__4304__delegate(s1, s2, sets)
    };
    G__4304.cljs$lang$arity$variadic = G__4304__delegate;
    return G__4304
  }();
  intersection = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return intersection__1.call(this, s1);
      case 2:
        return intersection__2.call(this, s1, s2);
      default:
        return intersection__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  intersection.cljs$lang$maxFixedArity = 2;
  intersection.cljs$lang$applyTo = intersection__3.cljs$lang$applyTo;
  intersection.cljs$lang$arity$1 = intersection__1;
  intersection.cljs$lang$arity$2 = intersection__2;
  intersection.cljs$lang$arity$variadic = intersection__3.cljs$lang$arity$variadic;
  return intersection
}();
clojure.set.difference = function() {
  var difference = null;
  var difference__1 = function(s1) {
    return s1
  };
  var difference__2 = function(s1, s2) {
    if(cljs.core.count.call(null, s1) < cljs.core.count.call(null, s2)) {
      return cljs.core.reduce.call(null, function(result, item) {
        if(cljs.core.contains_QMARK_.call(null, s2, item)) {
          return cljs.core.disj.call(null, result, item)
        }else {
          return result
        }
      }, s1, s1)
    }else {
      return cljs.core.reduce.call(null, cljs.core.disj, s1, s2)
    }
  };
  var difference__3 = function() {
    var G__4306__delegate = function(s1, s2, sets) {
      return cljs.core.reduce.call(null, difference, s1, cljs.core.conj.call(null, sets, s2))
    };
    var G__4306 = function(s1, s2, var_args) {
      var sets = null;
      if(goog.isDef(var_args)) {
        sets = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4306__delegate.call(this, s1, s2, sets)
    };
    G__4306.cljs$lang$maxFixedArity = 2;
    G__4306.cljs$lang$applyTo = function(arglist__4307) {
      var s1 = cljs.core.first(arglist__4307);
      var s2 = cljs.core.first(cljs.core.next(arglist__4307));
      var sets = cljs.core.rest(cljs.core.next(arglist__4307));
      return G__4306__delegate(s1, s2, sets)
    };
    G__4306.cljs$lang$arity$variadic = G__4306__delegate;
    return G__4306
  }();
  difference = function(s1, s2, var_args) {
    var sets = var_args;
    switch(arguments.length) {
      case 1:
        return difference__1.call(this, s1);
      case 2:
        return difference__2.call(this, s1, s2);
      default:
        return difference__3.cljs$lang$arity$variadic(s1, s2, cljs.core.array_seq(arguments, 2))
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  difference.cljs$lang$maxFixedArity = 2;
  difference.cljs$lang$applyTo = difference__3.cljs$lang$applyTo;
  difference.cljs$lang$arity$1 = difference__1;
  difference.cljs$lang$arity$2 = difference__2;
  difference.cljs$lang$arity$variadic = difference__3.cljs$lang$arity$variadic;
  return difference
}();
clojure.set.select = function select(pred, xset) {
  return cljs.core.reduce.call(null, function(s, k) {
    if(cljs.core.truth_(pred.call(null, k))) {
      return s
    }else {
      return cljs.core.disj.call(null, s, k)
    }
  }, xset, xset)
};
clojure.set.project = function project(xrel, ks) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__4308_SHARP_) {
    return cljs.core.select_keys.call(null, p1__4308_SHARP_, ks)
  }, xrel))
};
clojure.set.rename_keys = function rename_keys(map, kmap) {
  return cljs.core.reduce.call(null, function(m, p__4312) {
    var vec__4313 = p__4312;
    var old = cljs.core.nth.call(null, vec__4313, 0, null);
    var new$ = cljs.core.nth.call(null, vec__4313, 1, null);
    if(function() {
      var and__3822__auto__ = cljs.core.not_EQ_.call(null, old, new$);
      if(and__3822__auto__) {
        return cljs.core.contains_QMARK_.call(null, m, old)
      }else {
        return and__3822__auto__
      }
    }()) {
      return cljs.core.dissoc.call(null, cljs.core.assoc.call(null, m, new$, cljs.core._lookup.call(null, m, old, null)), old)
    }else {
      return m
    }
  }, map, kmap)
};
clojure.set.rename = function rename(xrel, kmap) {
  return cljs.core.set.call(null, cljs.core.map.call(null, function(p1__4309_SHARP_) {
    return clojure.set.rename_keys.call(null, p1__4309_SHARP_, kmap)
  }, xrel))
};
clojure.set.index = function index(xrel, ks) {
  return cljs.core.reduce.call(null, function(m, x) {
    var ik = cljs.core.select_keys.call(null, x, ks);
    return cljs.core.assoc.call(null, m, ik, cljs.core.conj.call(null, cljs.core._lookup.call(null, m, ik, cljs.core.PersistentHashSet.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, xrel)
};
clojure.set.map_invert = function map_invert(m) {
  return cljs.core.reduce.call(null, function(m__$1, p__4320) {
    var vec__4321 = p__4320;
    var k = cljs.core.nth.call(null, vec__4321, 0, null);
    var v = cljs.core.nth.call(null, vec__4321, 1, null);
    return cljs.core.assoc.call(null, m__$1, v, k)
  }, cljs.core.ObjMap.EMPTY, m)
};
clojure.set.join = function() {
  var join = null;
  var join__2 = function(xrel, yrel) {
    if(function() {
      var and__3822__auto__ = cljs.core.seq.call(null, xrel);
      if(and__3822__auto__) {
        return cljs.core.seq.call(null, yrel)
      }else {
        return and__3822__auto__
      }
    }()) {
      var ks = clojure.set.intersection.call(null, cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, xrel))), cljs.core.set.call(null, cljs.core.keys.call(null, cljs.core.first.call(null, yrel))));
      var vec__4325 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel], true) : cljs.core.PersistentVector.fromArray([yrel, xrel], true);
      var r = cljs.core.nth.call(null, vec__4325, 0, null);
      var s = cljs.core.nth.call(null, vec__4325, 1, null);
      var idx = clojure.set.index.call(null, r, ks);
      return cljs.core.reduce.call(null, function(ret, x) {
        var found = idx.call(null, cljs.core.select_keys.call(null, x, ks));
        if(cljs.core.truth_(found)) {
          return cljs.core.reduce.call(null, function(p1__4314_SHARP_, p2__4315_SHARP_) {
            return cljs.core.conj.call(null, p1__4314_SHARP_, cljs.core.merge.call(null, p2__4315_SHARP_, x))
          }, ret, found)
        }else {
          return ret
        }
      }, cljs.core.PersistentHashSet.EMPTY, s)
    }else {
      return cljs.core.PersistentHashSet.EMPTY
    }
  };
  var join__3 = function(xrel, yrel, km) {
    var vec__4326 = cljs.core.count.call(null, xrel) <= cljs.core.count.call(null, yrel) ? cljs.core.PersistentVector.fromArray([xrel, yrel, clojure.set.map_invert.call(null, km)], true) : cljs.core.PersistentVector.fromArray([yrel, xrel, km], true);
    var r = cljs.core.nth.call(null, vec__4326, 0, null);
    var s = cljs.core.nth.call(null, vec__4326, 1, null);
    var k = cljs.core.nth.call(null, vec__4326, 2, null);
    var idx = clojure.set.index.call(null, r, cljs.core.vals.call(null, k));
    return cljs.core.reduce.call(null, function(ret, x) {
      var found = idx.call(null, clojure.set.rename_keys.call(null, cljs.core.select_keys.call(null, x, cljs.core.keys.call(null, k)), k));
      if(cljs.core.truth_(found)) {
        return cljs.core.reduce.call(null, function(p1__4316_SHARP_, p2__4317_SHARP_) {
          return cljs.core.conj.call(null, p1__4316_SHARP_, cljs.core.merge.call(null, p2__4317_SHARP_, x))
        }, ret, found)
      }else {
        return ret
      }
    }, cljs.core.PersistentHashSet.EMPTY, s)
  };
  join = function(xrel, yrel, km) {
    switch(arguments.length) {
      case 2:
        return join__2.call(this, xrel, yrel);
      case 3:
        return join__3.call(this, xrel, yrel, km)
    }
    throw new Error("Invalid arity: " + arguments.length);
  };
  join.cljs$lang$arity$2 = join__2;
  join.cljs$lang$arity$3 = join__3;
  return join
}();
clojure.set.subset_QMARK_ = function subset_QMARK_(set1, set2) {
  var and__3822__auto__ = cljs.core.count.call(null, set1) <= cljs.core.count.call(null, set2);
  if(and__3822__auto__) {
    return cljs.core.every_QMARK_.call(null, function(p1__4322_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set2, p1__4322_SHARP_)
    }, set1)
  }else {
    return and__3822__auto__
  }
};
clojure.set.superset_QMARK_ = function superset_QMARK_(set1, set2) {
  var and__3822__auto__ = cljs.core.count.call(null, set1) >= cljs.core.count.call(null, set2);
  if(and__3822__auto__) {
    return cljs.core.every_QMARK_.call(null, function(p1__4327_SHARP_) {
      return cljs.core.contains_QMARK_.call(null, set1, p1__4327_SHARP_)
    }, set2)
  }else {
    return and__3822__auto__
  }
};
goog.provide("mrhyde.typepatcher");
goog.require("cljs.core");
goog.require("clojure.set");
goog.require("mrhyde.mrhyde");
goog.require("mrhyde.guts");
goog.require("clojure.set");
goog.require("mrhyde.guts");
goog.require("mrhyde.mrhyde");
mrhyde.typepatcher.dp = function() {
  var dp__delegate = function(args) {
    return console.log(cljs.core.apply.call(null, cljs.core.str, args))
  };
  var dp = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return dp__delegate.call(this, args)
  };
  dp.cljs$lang$maxFixedArity = 0;
  dp.cljs$lang$applyTo = function(arglist__4206) {
    var args = cljs.core.seq(arglist__4206);
    return dp__delegate(args)
  };
  dp.cljs$lang$arity$variadic = dp__delegate;
  return dp
}();
mrhyde.typepatcher.install_js_get_prop = function() {
  var reusable_descriptor = {};
  reusable_descriptor["configurable"] = true;
  reusable_descriptor["enumerable"] = true;
  return function internal_js_getset_prop(obj, nam, getfn) {
    reusable_descriptor["get"] = getfn;
    return Object.defineProperty(obj, nam, reusable_descriptor)
  }
}.call(null);
mrhyde.typepatcher.install_js_hidden_get_prop = function() {
  var reusable_descriptor = {};
  reusable_descriptor["configurable"] = true;
  reusable_descriptor["enumerable"] = false;
  return function internal_js_getset_prop(obj, nam, getfn) {
    reusable_descriptor["get"] = getfn;
    return Object.defineProperty(obj, nam, reusable_descriptor)
  }
}.call(null);
mrhyde.typepatcher.hide_js_props = function() {
  var reusable_descriptor = {};
  reusable_descriptor["enumerable"] = false;
  return function internal_js_getset_prop(obj, s) {
    var G__4208 = cljs.core.seq.call(null, s);
    while(true) {
      if(G__4208) {
        var nam = cljs.core.first.call(null, G__4208);
        Object.defineProperty(obj, nam, reusable_descriptor);
        var G__4209 = cljs.core.next.call(null, G__4208);
        G__4208 = G__4209;
        continue
      }else {
        return null
      }
      break
    }
  }
}.call(null);
mrhyde.typepatcher.install_js_getset_prop = function() {
  var reusable_descriptor = {};
  reusable_descriptor["configurable"] = true;
  reusable_descriptor["enumerable"] = true;
  return function internal_js_getset_prop(obj, nam, getfn, setfn) {
    reusable_descriptor["get"] = getfn;
    reusable_descriptor["set"] = setfn;
    return Object.defineProperty(obj, nam, reusable_descriptor)
  }
}.call(null);
mrhyde.typepatcher.install_js_hidden_getset_prop = function() {
  var reusable_descriptor = {};
  reusable_descriptor["configurable"] = true;
  reusable_descriptor["enumerable"] = false;
  return function internal_js_getset_prop(obj, nam, getfn, setfn) {
    reusable_descriptor["get"] = getfn;
    reusable_descriptor["set"] = setfn;
    return Object.defineProperty(obj, nam, reusable_descriptor)
  }
}.call(null);
mrhyde.typepatcher.aset_hidden = function aset_hidden(o, nam, p) {
  o[nam] = p;
  return mrhyde.typepatcher.hide_js_props.call(null, o, cljs.core.PersistentVector.fromArray([nam], true))
};
mrhyde.typepatcher.hyde_cache_key = "$cljs$mrhyde$cache";
mrhyde.typepatcher.hyde_access_key = "$cljs$mrhyde$acccess";
mrhyde.typepatcher.hyde_keylist_key = "$cljs$mrhyde$keylist";
mrhyde.typepatcher.hyde_keyset_key = "$cljs$mrhyde$keyset";
mrhyde.typepatcher.cljs_partition_key = "cljs$lang$protocol_mask$partition0$";
mrhyde.typepatcher.hyde_parition_key = [cljs.core.str("$cljs$mrhyde$"), cljs.core.str(mrhyde.typepatcher.cljs_partition_key)].join("");
mrhyde.typepatcher.hyde_array_ensure_cached = function hyde_array_ensure_cached(h) {
  if(cljs.core.not.call(null, goog.object.containsKey(h, mrhyde.typepatcher.hyde_cache_key))) {
    return mrhyde.typepatcher.aset_hidden.call(null, h, mrhyde.typepatcher.hyde_cache_key, cljs.core.apply.call(null, cljs.core.array, h))
  }else {
    return null
  }
};
mrhyde.typepatcher.hyde_array_pop = function() {
  var hyde_array_pop__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method pop")
  };
  var hyde_array_pop = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_pop__delegate.call(this, args)
  };
  hyde_array_pop.cljs$lang$maxFixedArity = 0;
  hyde_array_pop.cljs$lang$applyTo = function(arglist__4210) {
    var args = cljs.core.seq(arglist__4210);
    return hyde_array_pop__delegate(args)
  };
  hyde_array_pop.cljs$lang$arity$variadic = hyde_array_pop__delegate;
  return hyde_array_pop
}();
mrhyde.typepatcher.hyde_array_push = function() {
  var hyde_array_push__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method push")
  };
  var hyde_array_push = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_push__delegate.call(this, args)
  };
  hyde_array_push.cljs$lang$maxFixedArity = 0;
  hyde_array_push.cljs$lang$applyTo = function(arglist__4211) {
    var args = cljs.core.seq(arglist__4211);
    return hyde_array_push__delegate(args)
  };
  hyde_array_push.cljs$lang$arity$variadic = hyde_array_push__delegate;
  return hyde_array_push
}();
mrhyde.typepatcher.hyde_array_reverse = function() {
  var hyde_array_reverse__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method reverse")
  };
  var hyde_array_reverse = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_reverse__delegate.call(this, args)
  };
  hyde_array_reverse.cljs$lang$maxFixedArity = 0;
  hyde_array_reverse.cljs$lang$applyTo = function(arglist__4212) {
    var args = cljs.core.seq(arglist__4212);
    return hyde_array_reverse__delegate(args)
  };
  hyde_array_reverse.cljs$lang$arity$variadic = hyde_array_reverse__delegate;
  return hyde_array_reverse
}();
mrhyde.typepatcher.hyde_array_shift = function() {
  var hyde_array_shift__delegate = function(args) {
    var t = this;
    mrhyde.typepatcher.hyde_array_ensure_cached.call(null, t);
    var c = t[mrhyde.typepatcher.hyde_cache_key];
    return c.shift()
  };
  var hyde_array_shift = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_shift__delegate.call(this, args)
  };
  hyde_array_shift.cljs$lang$maxFixedArity = 0;
  hyde_array_shift.cljs$lang$applyTo = function(arglist__4213) {
    var args = cljs.core.seq(arglist__4213);
    return hyde_array_shift__delegate(args)
  };
  hyde_array_shift.cljs$lang$arity$variadic = hyde_array_shift__delegate;
  return hyde_array_shift
}();
mrhyde.typepatcher.hyde_array_sort = function() {
  var hyde_array_sort__delegate = function(args) {
    var t = this;
    mrhyde.typepatcher.hyde_array_ensure_cached.call(null, t);
    var c = t[mrhyde.typepatcher.hyde_cache_key];
    c.sort();
    return t
  };
  var hyde_array_sort = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_sort__delegate.call(this, args)
  };
  hyde_array_sort.cljs$lang$maxFixedArity = 0;
  hyde_array_sort.cljs$lang$applyTo = function(arglist__4214) {
    var args = cljs.core.seq(arglist__4214);
    return hyde_array_sort__delegate(args)
  };
  hyde_array_sort.cljs$lang$arity$variadic = hyde_array_sort__delegate;
  return hyde_array_sort
}();
mrhyde.typepatcher.hyde_array_splice = function() {
  var hyde_array_splice__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method splice")
  };
  var hyde_array_splice = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_splice__delegate.call(this, args)
  };
  hyde_array_splice.cljs$lang$maxFixedArity = 0;
  hyde_array_splice.cljs$lang$applyTo = function(arglist__4215) {
    var args = cljs.core.seq(arglist__4215);
    return hyde_array_splice__delegate(args)
  };
  hyde_array_splice.cljs$lang$arity$variadic = hyde_array_splice__delegate;
  return hyde_array_splice
}();
mrhyde.typepatcher.hyde_array_unshift = function() {
  var hyde_array_unshift__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method unshift")
  };
  var hyde_array_unshift = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_unshift__delegate.call(this, args)
  };
  hyde_array_unshift.cljs$lang$maxFixedArity = 0;
  hyde_array_unshift.cljs$lang$applyTo = function(arglist__4216) {
    var args = cljs.core.seq(arglist__4216);
    return hyde_array_unshift__delegate(args)
  };
  hyde_array_unshift.cljs$lang$arity$variadic = hyde_array_unshift__delegate;
  return hyde_array_unshift
}();
mrhyde.typepatcher.hyde_array_concat = function() {
  var hyde_array_concat__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method concat")
  };
  var hyde_array_concat = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_concat__delegate.call(this, args)
  };
  hyde_array_concat.cljs$lang$maxFixedArity = 0;
  hyde_array_concat.cljs$lang$applyTo = function(arglist__4217) {
    var args = cljs.core.seq(arglist__4217);
    return hyde_array_concat__delegate(args)
  };
  hyde_array_concat.cljs$lang$arity$variadic = hyde_array_concat__delegate;
  return hyde_array_concat
}();
mrhyde.typepatcher.hyde_array_join = function() {
  var hyde_array_join__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method join")
  };
  var hyde_array_join = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_join__delegate.call(this, args)
  };
  hyde_array_join.cljs$lang$maxFixedArity = 0;
  hyde_array_join.cljs$lang$applyTo = function(arglist__4218) {
    var args = cljs.core.seq(arglist__4218);
    return hyde_array_join__delegate(args)
  };
  hyde_array_join.cljs$lang$arity$variadic = hyde_array_join__delegate;
  return hyde_array_join
}();
mrhyde.typepatcher.hyde_array_concat = function() {
  var hyde_array_concat__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method concat")
  };
  var hyde_array_concat = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_concat__delegate.call(this, args)
  };
  hyde_array_concat.cljs$lang$maxFixedArity = 0;
  hyde_array_concat.cljs$lang$applyTo = function(arglist__4219) {
    var args = cljs.core.seq(arglist__4219);
    return hyde_array_concat__delegate(args)
  };
  hyde_array_concat.cljs$lang$arity$variadic = hyde_array_concat__delegate;
  return hyde_array_concat
}();
mrhyde.typepatcher.hyde_array_concat = function() {
  var hyde_array_concat__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method concat")
  };
  var hyde_array_concat = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_concat__delegate.call(this, args)
  };
  hyde_array_concat.cljs$lang$maxFixedArity = 0;
  hyde_array_concat.cljs$lang$applyTo = function(arglist__4220) {
    var args = cljs.core.seq(arglist__4220);
    return hyde_array_concat__delegate(args)
  };
  hyde_array_concat.cljs$lang$arity$variadic = hyde_array_concat__delegate;
  return hyde_array_concat
}();
mrhyde.typepatcher.hyde_array_concat = function() {
  var hyde_array_concat__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method concat")
  };
  var hyde_array_concat = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_concat__delegate.call(this, args)
  };
  hyde_array_concat.cljs$lang$maxFixedArity = 0;
  hyde_array_concat.cljs$lang$applyTo = function(arglist__4221) {
    var args = cljs.core.seq(arglist__4221);
    return hyde_array_concat__delegate(args)
  };
  hyde_array_concat.cljs$lang$arity$variadic = hyde_array_concat__delegate;
  return hyde_array_concat
}();
mrhyde.typepatcher.hyde_array_concat = function() {
  var hyde_array_concat__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method concat")
  };
  var hyde_array_concat = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_concat__delegate.call(this, args)
  };
  hyde_array_concat.cljs$lang$maxFixedArity = 0;
  hyde_array_concat.cljs$lang$applyTo = function(arglist__4222) {
    var args = cljs.core.seq(arglist__4222);
    return hyde_array_concat__delegate(args)
  };
  hyde_array_concat.cljs$lang$arity$variadic = hyde_array_concat__delegate;
  return hyde_array_concat
}();
mrhyde.typepatcher.hyde_array_slice = function() {
  var hyde_array_slice__delegate = function(args) {
    var this$ = this;
    var begin = cljs.core.first.call(null, args);
    var end = cljs.core.second.call(null, args);
    if(end == null) {
      return cljs.core.drop.call(null, begin, this$)
    }else {
      return cljs.core.take.call(null, end - begin, cljs.core.drop.call(null, begin, this$))
    }
  };
  var hyde_array_slice = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_slice__delegate.call(this, args)
  };
  hyde_array_slice.cljs$lang$maxFixedArity = 0;
  hyde_array_slice.cljs$lang$applyTo = function(arglist__4223) {
    var args = cljs.core.seq(arglist__4223);
    return hyde_array_slice__delegate(args)
  };
  hyde_array_slice.cljs$lang$arity$variadic = hyde_array_slice__delegate;
  return hyde_array_slice
}();
mrhyde.typepatcher.hyde_array_vector_slice = function() {
  var hyde_array_vector_slice__delegate = function(args) {
    console.log("note: calling untested hyde-array vector-slice");
    var this$ = this;
    return cljs.core.apply.call(null, cljs.core.subvec, this$, args)
  };
  var hyde_array_vector_slice = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_vector_slice__delegate.call(this, args)
  };
  hyde_array_vector_slice.cljs$lang$maxFixedArity = 0;
  hyde_array_vector_slice.cljs$lang$applyTo = function(arglist__4224) {
    var args = cljs.core.seq(arglist__4224);
    return hyde_array_vector_slice__delegate(args)
  };
  hyde_array_vector_slice.cljs$lang$arity$variadic = hyde_array_vector_slice__delegate;
  return hyde_array_vector_slice
}();
mrhyde.typepatcher.hyde_array_to_source = function() {
  var hyde_array_to_source__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method toSource")
  };
  var hyde_array_to_source = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_to_source__delegate.call(this, args)
  };
  hyde_array_to_source.cljs$lang$maxFixedArity = 0;
  hyde_array_to_source.cljs$lang$applyTo = function(arglist__4225) {
    var args = cljs.core.seq(arglist__4225);
    return hyde_array_to_source__delegate(args)
  };
  hyde_array_to_source.cljs$lang$arity$variadic = hyde_array_to_source__delegate;
  return hyde_array_to_source
}();
mrhyde.typepatcher.hyde_array_to_string = function() {
  var hyde_array_to_string__delegate = function(args) {
    var this$ = this;
    return clojure.string.join.call(null, ", ", this$)
  };
  var hyde_array_to_string = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_to_string__delegate.call(this, args)
  };
  hyde_array_to_string.cljs$lang$maxFixedArity = 0;
  hyde_array_to_string.cljs$lang$applyTo = function(arglist__4226) {
    var args = cljs.core.seq(arglist__4226);
    return hyde_array_to_string__delegate(args)
  };
  hyde_array_to_string.cljs$lang$arity$variadic = hyde_array_to_string__delegate;
  return hyde_array_to_string
}();
mrhyde.typepatcher.hyde_array_index_of = function() {
  var hyde_array_index_of__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method indexOf")
  };
  var hyde_array_index_of = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_index_of__delegate.call(this, args)
  };
  hyde_array_index_of.cljs$lang$maxFixedArity = 0;
  hyde_array_index_of.cljs$lang$applyTo = function(arglist__4227) {
    var args = cljs.core.seq(arglist__4227);
    return hyde_array_index_of__delegate(args)
  };
  hyde_array_index_of.cljs$lang$arity$variadic = hyde_array_index_of__delegate;
  return hyde_array_index_of
}();
mrhyde.typepatcher.hyde_array_last_index_of = function() {
  var hyde_array_last_index_of__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method lastIndexOf")
  };
  var hyde_array_last_index_of = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_last_index_of__delegate.call(this, args)
  };
  hyde_array_last_index_of.cljs$lang$maxFixedArity = 0;
  hyde_array_last_index_of.cljs$lang$applyTo = function(arglist__4228) {
    var args = cljs.core.seq(arglist__4228);
    return hyde_array_last_index_of__delegate(args)
  };
  hyde_array_last_index_of.cljs$lang$arity$variadic = hyde_array_last_index_of__delegate;
  return hyde_array_last_index_of
}();
mrhyde.typepatcher.hyde_array_every = function() {
  var hyde_array_every__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method every")
  };
  var hyde_array_every = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_every__delegate.call(this, args)
  };
  hyde_array_every.cljs$lang$maxFixedArity = 0;
  hyde_array_every.cljs$lang$applyTo = function(arglist__4229) {
    var args = cljs.core.seq(arglist__4229);
    return hyde_array_every__delegate(args)
  };
  hyde_array_every.cljs$lang$arity$variadic = hyde_array_every__delegate;
  return hyde_array_every
}();
mrhyde.typepatcher.hyde_array_some = function() {
  var hyde_array_some__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method some")
  };
  var hyde_array_some = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_some__delegate.call(this, args)
  };
  hyde_array_some.cljs$lang$maxFixedArity = 0;
  hyde_array_some.cljs$lang$applyTo = function(arglist__4230) {
    var args = cljs.core.seq(arglist__4230);
    return hyde_array_some__delegate(args)
  };
  hyde_array_some.cljs$lang$arity$variadic = hyde_array_some__delegate;
  return hyde_array_some
}();
mrhyde.typepatcher.hyde_array_filter = function() {
  var hyde_array_filter__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method filter")
  };
  var hyde_array_filter = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_filter__delegate.call(this, args)
  };
  hyde_array_filter.cljs$lang$maxFixedArity = 0;
  hyde_array_filter.cljs$lang$applyTo = function(arglist__4233) {
    var args = cljs.core.seq(arglist__4233);
    return hyde_array_filter__delegate(args)
  };
  hyde_array_filter.cljs$lang$arity$variadic = hyde_array_filter__delegate;
  return hyde_array_filter
}();
mrhyde.typepatcher.hyde_array_map = function hyde_array_map(f) {
  var ct = this;
  return cljs.core.doall.call(null, cljs.core.map.call(null, function(p1__4231_SHARP_, p2__4232_SHARP_) {
    return f.call(undefined, p1__4231_SHARP_, p2__4232_SHARP_, ct)
  }, cljs.core.seq.call(null, ct), cljs.core.range.call(null)))
};
mrhyde.typepatcher.hyde_array_for_each = function hyde_array_for_each(f) {
  var ct_4234 = this;
  mrhyde.typepatcher.hyde_array_map.call(ct_4234, f);
  return null
};
mrhyde.typepatcher.hyde_array_reduce = function() {
  var hyde_array_reduce__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method reduce")
  };
  var hyde_array_reduce = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_reduce__delegate.call(this, args)
  };
  hyde_array_reduce.cljs$lang$maxFixedArity = 0;
  hyde_array_reduce.cljs$lang$applyTo = function(arglist__4235) {
    var args = cljs.core.seq(arglist__4235);
    return hyde_array_reduce__delegate(args)
  };
  hyde_array_reduce.cljs$lang$arity$variadic = hyde_array_reduce__delegate;
  return hyde_array_reduce
}();
mrhyde.typepatcher.hyde_array_reduce_right = function() {
  var hyde_array_reduce_right__delegate = function(args) {
    return console.log("WARNING: someone has called unsupported hyde-array method reduce-Right")
  };
  var hyde_array_reduce_right = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hyde_array_reduce_right__delegate.call(this, args)
  };
  hyde_array_reduce_right.cljs$lang$maxFixedArity = 0;
  hyde_array_reduce_right.cljs$lang$applyTo = function(arglist__4236) {
    var args = cljs.core.seq(arglist__4236);
    return hyde_array_reduce_right__delegate(args)
  };
  hyde_array_reduce_right.cljs$lang$arity$variadic = hyde_array_reduce_right__delegate;
  return hyde_array_reduce_right
}();
mrhyde.typepatcher.strkey = function strkey(x) {
  if(cljs.core.keyword_QMARK_.call(null, x)) {
    return cljs.core.name.call(null, x)
  }else {
    return x
  }
};
mrhyde.typepatcher.gen_map_getter = function gen_map_getter(k) {
  return function() {
    var t = this;
    return cljs.core._lookup.call(null, t[mrhyde.typepatcher.hyde_access_key], k, null)
  }
};
mrhyde.typepatcher.gen_map_setter = function gen_map_setter(k) {
  return function(v) {
    var t = this;
    if(cljs.core.not.call(null, goog.object.containsKey(t, mrhyde.typepatcher.hyde_cache_key))) {
      var c_4237 = cljs.core.transient$.call(null, t);
      mrhyde.typepatcher.aset_hidden.call(null, t, mrhyde.typepatcher.hyde_access_key, c_4237);
      mrhyde.typepatcher.aset_hidden.call(null, t, mrhyde.typepatcher.hyde_cache_key, c_4237)
    }else {
    }
    var c = t[mrhyde.typepatcher.hyde_cache_key];
    return cljs.core.assoc_BANG_.call(null, c, k, v)
  }
};
mrhyde.typepatcher.patch_map = function patch_map(m) {
  mrhyde.typepatcher.aset_hidden.call(null, m, mrhyde.typepatcher.hyde_access_key, m);
  mrhyde.typepatcher.hide_js_props.call(null, m, Object.keys(m));
  var G__4239_4240 = cljs.core.seq.call(null, cljs.core.keys.call(null, m));
  while(true) {
    if(G__4239_4240) {
      var k_4241 = cljs.core.first.call(null, G__4239_4240);
      if(function() {
        var and__3822__auto__ = cljs.core.keyword_QMARK_.call(null, k_4241);
        if(and__3822__auto__) {
          return cljs.core.not.call(null, goog.object.containsKey(m, cljs.core.name.call(null, k_4241)))
        }else {
          return and__3822__auto__
        }
      }()) {
        mrhyde.typepatcher.install_js_getset_prop.call(null, m, cljs.core.name.call(null, k_4241), mrhyde.typepatcher.gen_map_getter.call(null, k_4241), mrhyde.typepatcher.gen_map_setter.call(null, k_4241))
      }else {
      }
      var G__4242 = cljs.core.next.call(null, G__4239_4240);
      G__4239_4240 = G__4242;
      continue
    }else {
    }
    break
  }
  if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.keyword_QMARK_, cljs.core.keys.call(null, m)))) {
    mrhyde.typepatcher.aset_hidden.call(null, m, mrhyde.typepatcher.hyde_keylist_key, false);
    mrhyde.typepatcher.aset_hidden.call(null, m, mrhyde.typepatcher.hyde_keyset_key, false);
    mrhyde.typepatcher.aset_hidden.call(null, m, mrhyde.typepatcher.hyde_keylist_key, Object.keys(m))
  }else {
  }
  return m
};
mrhyde.typepatcher.have_patched_js_with_key_lookup = cljs.core.atom.call(null, false);
mrhyde.typepatcher.patch_js_with_key_lookup = function patch_js_with_key_lookup() {
  if(cljs.core.not.call(null, cljs.core.deref.call(null, mrhyde.typepatcher.have_patched_js_with_key_lookup))) {
    cljs.core.reset_BANG_.call(null, mrhyde.typepatcher.have_patched_js_with_key_lookup, true);
    cljs.core.ILookup["object"] = true;
    return cljs.core._lookup["object"] = function() {
      var G__4243 = null;
      var G__4243__2 = function(o, k) {
        return o[mrhyde.typepatcher.strkey.call(null, k)]
      };
      var G__4243__3 = function(o, k, not_found) {
        var s = mrhyde.typepatcher.strkey.call(null, k);
        if(cljs.core.truth_(goog.object.containsKey(o, s))) {
          return o[s]
        }else {
          return not_found
        }
      };
      G__4243 = function(o, k, not_found) {
        switch(arguments.length) {
          case 2:
            return G__4243__2.call(this, o, k);
          case 3:
            return G__4243__3.call(this, o, k, not_found)
        }
        throw new Error("Invalid arity: " + arguments.length);
      };
      return G__4243
    }()
  }else {
    return null
  }
};
mrhyde.typepatcher.MAXLEN = function() {
  var or__3824__auto__ = function() {
    var ct = this;
    return ct["mrhyde_maxseqlen"]
  }();
  if(cljs.core.truth_(or__3824__auto__)) {
    return or__3824__auto__
  }else {
    return 5E3
  }
}();
mrhyde.typepatcher.patch_seq_object = function patch_seq_object(o) {
  return null
};
mrhyde.typepatcher.patch_map_object = function patch_map_object(o) {
  mrhyde.typepatcher.patch_map.call(null, o);
  return null
};
mrhyde.typepatcher.patch_core_seq_type = function patch_core_seq_type(s) {
  var orig_fn = cljs.core[s];
  var orig_keys = Object.keys(orig_fn);
  var new_fn = function() {
    var G__4246__delegate = function(args) {
      var nargs = cljs.core.apply.call(null, cljs.core.array, cljs.core.cons.call(null, null, args));
      var binder = Function.prototype.bind.apply(orig_fn, nargs);
      var that = new binder;
      mrhyde.typepatcher.patch_seq_object.call(null, that);
      return that
    };
    var G__4246 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4246__delegate.call(this, args)
    };
    G__4246.cljs$lang$maxFixedArity = 0;
    G__4246.cljs$lang$applyTo = function(arglist__4247) {
      var args = cljs.core.seq(arglist__4247);
      return G__4246__delegate(args)
    };
    G__4246.cljs$lang$arity$variadic = G__4246__delegate;
    return G__4246
  }();
  var G__4245_4248 = cljs.core.seq.call(null, orig_keys);
  while(true) {
    if(G__4245_4248) {
      var k_4249 = cljs.core.first.call(null, G__4245_4248);
      new_fn[k_4249] = orig_fn[k_4249];
      var G__4250 = cljs.core.next.call(null, G__4245_4248);
      G__4245_4248 = G__4250;
      continue
    }else {
    }
    break
  }
  return cljs.core[s] = new_fn
};
mrhyde.typepatcher.patch_core_map_type = function patch_core_map_type(s) {
  var orig_fn = cljs.core[s];
  var orig_keys = Object.keys(orig_fn);
  var new_fn = function() {
    var G__4253__delegate = function(args) {
      var nargs = cljs.core.apply.call(null, cljs.core.array, cljs.core.cons.call(null, null, args));
      var binder = Function.prototype.bind.apply(orig_fn, nargs);
      var that = new binder;
      mrhyde.typepatcher.patch_map_object.call(null, that);
      return that
    };
    var G__4253 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4253__delegate.call(this, args)
    };
    G__4253.cljs$lang$maxFixedArity = 0;
    G__4253.cljs$lang$applyTo = function(arglist__4254) {
      var args = cljs.core.seq(arglist__4254);
      return G__4253__delegate(args)
    };
    G__4253.cljs$lang$arity$variadic = G__4253__delegate;
    return G__4253
  }();
  var G__4252_4255 = cljs.core.seq.call(null, orig_keys);
  while(true) {
    if(G__4252_4255) {
      var k_4256 = cljs.core.first.call(null, G__4252_4255);
      new_fn[k_4256] = orig_fn[k_4256];
      var G__4257 = cljs.core.next.call(null, G__4252_4255);
      G__4252_4255 = G__4257;
      continue
    }else {
    }
    break
  }
  return cljs.core[s] = new_fn
};
mrhyde.typepatcher.gen_seq_getter = function gen_seq_getter(n) {
  return function() {
    var t = this;
    var src = cljs.core.truth_(goog.object.containsKey(t, mrhyde.typepatcher.hyde_cache_key)) ? t[mrhyde.typepatcher.hyde_cache_key] : t;
    return cljs.core.nth.call(null, src, n, undefined)
  }
};
mrhyde.typepatcher.gen_seq_setter = function gen_seq_setter(n) {
  return function(v) {
    var t = this;
    mrhyde.typepatcher.hyde_array_ensure_cached.call(null, t);
    var c = t[mrhyde.typepatcher.hyde_cache_key];
    return c[n] = v
  }
};
mrhyde.typepatcher.patch_prototype_as_array = function patch_prototype_as_array(p, o, is_vect) {
  mrhyde.typepatcher.aset_hidden.call(null, p, mrhyde.guts.hyde_proto_array_marker, true);
  mrhyde.typepatcher.install_js_hidden_get_prop.call(null, p, "length", function() {
    var t = this;
    return cljs.core.count.call(null, cljs.core.take.call(null, mrhyde.typepatcher.MAXLEN, t))
  });
  var n__2552__auto___4258 = mrhyde.typepatcher.MAXLEN;
  var n_4259 = 0;
  while(true) {
    if(n_4259 < n__2552__auto___4258) {
      mrhyde.typepatcher.install_js_hidden_getset_prop.call(null, p, n_4259, mrhyde.typepatcher.gen_seq_getter.call(null, n_4259), mrhyde.typepatcher.gen_seq_setter.call(null, n_4259));
      var G__4260 = n_4259 + 1;
      n_4259 = G__4260;
      continue
    }else {
    }
    break
  }
  mrhyde.typepatcher.aset_hidden.call(null, p, "__ArrayLike", true);
  mrhyde.typepatcher.aset_hidden.call(null, p, "toCljString", p.toString);
  mrhyde.typepatcher.aset_hidden.call(null, p, "pop", mrhyde.typepatcher.hyde_array_pop);
  mrhyde.typepatcher.aset_hidden.call(null, p, "push", mrhyde.typepatcher.hyde_array_push);
  mrhyde.typepatcher.aset_hidden.call(null, p, "reverse", mrhyde.typepatcher.hyde_array_reverse);
  mrhyde.typepatcher.aset_hidden.call(null, p, "shift", mrhyde.typepatcher.hyde_array_shift);
  mrhyde.typepatcher.aset_hidden.call(null, p, "sort", mrhyde.typepatcher.hyde_array_sort);
  mrhyde.typepatcher.aset_hidden.call(null, p, "splice", mrhyde.typepatcher.hyde_array_splice);
  mrhyde.typepatcher.aset_hidden.call(null, p, "unshift", mrhyde.typepatcher.hyde_array_unshift);
  mrhyde.typepatcher.aset_hidden.call(null, p, "concat", mrhyde.typepatcher.hyde_array_concat);
  mrhyde.typepatcher.aset_hidden.call(null, p, "join", mrhyde.typepatcher.hyde_array_pop);
  mrhyde.typepatcher.aset_hidden.call(null, p, "slice", cljs.core.truth_(is_vect) ? mrhyde.typepatcher.hyde_array_vector_slice : mrhyde.typepatcher.hyde_array_slice);
  mrhyde.typepatcher.aset_hidden.call(null, p, "toSource", mrhyde.typepatcher.hyde_array_to_source);
  mrhyde.typepatcher.aset_hidden.call(null, p, "toString", mrhyde.typepatcher.hyde_array_to_string);
  mrhyde.typepatcher.aset_hidden.call(null, p, "indexOf", mrhyde.typepatcher.hyde_array_index_of);
  mrhyde.typepatcher.aset_hidden.call(null, p, "lastIndexOf", mrhyde.typepatcher.hyde_array_last_index_of);
  mrhyde.typepatcher.aset_hidden.call(null, p, "forEach", mrhyde.typepatcher.hyde_array_for_each);
  mrhyde.typepatcher.aset_hidden.call(null, p, "every", mrhyde.typepatcher.hyde_array_every);
  mrhyde.typepatcher.aset_hidden.call(null, p, "some", mrhyde.typepatcher.hyde_array_some);
  mrhyde.typepatcher.aset_hidden.call(null, p, "filter", mrhyde.typepatcher.hyde_array_filter);
  mrhyde.typepatcher.aset_hidden.call(null, p, "map", mrhyde.typepatcher.hyde_array_map);
  mrhyde.typepatcher.aset_hidden.call(null, p, "reduce", mrhyde.typepatcher.hyde_array_reduce);
  return mrhyde.typepatcher.aset_hidden.call(null, p, "reduceRight", mrhyde.typepatcher.hyde_array_reduce_right)
};
mrhyde.typepatcher.patch_prototype_as_map = function patch_prototype_as_map(p, o) {
  return mrhyde.typepatcher.aset_hidden.call(null, p, mrhyde.guts.hyde_proto_object_marker, true)
};
mrhyde.typepatcher.add_hyde_protocol_to_seq = function add_hyde_protocol_to_seq(s) {
  s.prototype.mrhyde$mrhyde$IHyde$ = true;
  s.prototype.mrhyde$mrhyde$IHyde$has_cache_QMARK_$arity$1 = function(this$) {
    return goog.object.containsKey(this$, mrhyde.typepatcher.hyde_cache_key)
  };
  return s.prototype.mrhyde$mrhyde$IHyde$from_cache$arity$1 = function(this$) {
    var temp__3971__auto__ = this$[mrhyde.typepatcher.hyde_cache_key];
    if(cljs.core.truth_(temp__3971__auto__)) {
      var c = temp__3971__auto__;
      return cljs.core.vec.call(null, c)
    }else {
      return this$
    }
  }
};
mrhyde.typepatcher.filtered_keylist_set = function filtered_keylist_set(l) {
  return cljs.core.set.call(null, cljs.core.remove.call(null, function(p1__4261_SHARP_) {
    return cljs.core.re_find.call(null, /cljs\$/, p1__4261_SHARP_)
  }, l))
};
mrhyde.typepatcher.lazy_init_hyde_setset = function lazy_init_hyde_setset(m) {
  if(cljs.core.truth_(function() {
    var and__3822__auto__ = cljs.core.not.call(null, m[mrhyde.typepatcher.hyde_keyset_key]);
    if(and__3822__auto__) {
      return m[mrhyde.typepatcher.hyde_keylist_key]
    }else {
      return and__3822__auto__
    }
  }())) {
    return mrhyde.typepatcher.aset_hidden.call(null, m, mrhyde.typepatcher.hyde_keyset_key, mrhyde.typepatcher.filtered_keylist_set.call(null, m[mrhyde.typepatcher.hyde_keylist_key]))
  }else {
    return null
  }
};
mrhyde.typepatcher.add_hyde_protocol_to_map = function add_hyde_protocol_to_map(m) {
  m.prototype.mrhyde$mrhyde$IHyde$ = true;
  m.prototype.mrhyde$mrhyde$IHyde$has_cache_QMARK_$arity$1 = function(this$) {
    mrhyde.typepatcher.lazy_init_hyde_setset.call(null, this$);
    var or__3824__auto__ = goog.object.containsKey(this$, mrhyde.typepatcher.hyde_cache_key);
    if(cljs.core.truth_(or__3824__auto__)) {
      return or__3824__auto__
    }else {
      return cljs.core.not_EQ_.call(null, this$[mrhyde.typepatcher.hyde_keyset_key], mrhyde.typepatcher.filtered_keylist_set.call(null, Object.keys(this$)))
    }
  };
  m.prototype.mrhyde$mrhyde$IHyde$from_cache$arity$1 = function(this$) {
    mrhyde.typepatcher.lazy_init_hyde_setset.call(null, this$);
    var cur_keyset = clojure.set.difference.call(null, mrhyde.typepatcher.filtered_keylist_set.call(null, Object.keys(this$)), cljs.core.PersistentHashSet.fromArray([mrhyde.typepatcher.hyde_cache_key]));
    var new_keys = clojure.set.difference.call(null, cur_keyset, this$[mrhyde.typepatcher.hyde_keyset_key]);
    var new_map = cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
      var iter__2487__auto__ = function iter__4264(s__4265) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__4265__$1 = s__4265;
          while(true) {
            if(cljs.core.seq.call(null, s__4265__$1)) {
              var k = cljs.core.first.call(null, s__4265__$1);
              return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k), this$[k]], true), iter__4264.call(null, cljs.core.rest.call(null, s__4265__$1)))
            }else {
              return null
            }
            break
          }
        }, null)
      };
      return iter__2487__auto__.call(null, new_keys)
    }());
    var cache = this$[mrhyde.typepatcher.hyde_cache_key];
    if(cljs.core.truth_(cache)) {
      var p = cljs.core.persistent_BANG_.call(null, cache);
      mrhyde.typepatcher.aset_hidden.call(null, this$, mrhyde.typepatcher.hyde_cache_key, cljs.core.transient$.call(null, p));
      return cljs.core.merge.call(null, p, new_map)
    }else {
      return cljs.core.merge.call(null, this$, new_map)
    }
  };
  var p = m["prototype"];
  return mrhyde.typepatcher.hide_js_props.call(null, p, Object.keys(p))
};
mrhyde.typepatcher.from_cache_if_has_cache = function from_cache_if_has_cache(x) {
  if(cljs.core.truth_(function() {
    var and__3822__auto__ = mrhyde.mrhyde.hyde_QMARK_.call(null, x);
    if(and__3822__auto__) {
      return mrhyde.mrhyde.has_cache_QMARK_.call(null, x)
    }else {
      return and__3822__auto__
    }
  }())) {
    return mrhyde.mrhyde.from_cache.call(null, x)
  }else {
    return x
  }
};
mrhyde.typepatcher.recurse_from_hyde_cache = function() {
  var recurse_from_hyde_cache__delegate = function(xo, opts) {
    var opts_map = cljs.core.apply.call(null, cljs.core.array_map, opts);
    var skippers = cljs.core._lookup.call(null, opts_map, "\ufdd0'skip", cljs.core.PersistentVector.EMPTY);
    var skiplist = cljs.core.keyword_QMARK_.call(null, skippers) ? cljs.core.PersistentVector.fromArray([skippers], true) : skippers;
    var skipset = cljs.core.set.call(null, skiplist);
    return function internal_recurse(x) {
      if(cljs.core.truth_(goog.isArray(x))) {
        return cljs.core.vec.call(null, cljs.core.map.call(null, internal_recurse, x))
      }else {
        if(cljs.core.map_QMARK_.call(null, x)) {
          var c = mrhyde.typepatcher.from_cache_if_has_cache.call(null, x);
          return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
            var iter__2487__auto__ = function iter__4278(s__4279) {
              return new cljs.core.LazySeq(null, false, function() {
                var s__4279__$1 = s__4279;
                while(true) {
                  if(cljs.core.seq.call(null, s__4279__$1)) {
                    var vec__4281 = cljs.core.first.call(null, s__4279__$1);
                    var k = cljs.core.nth.call(null, vec__4281, 0, null);
                    var v = cljs.core.nth.call(null, vec__4281, 1, null);
                    return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([internal_recurse.call(null, k), cljs.core.truth_(skipset.call(null, k)) ? v : internal_recurse.call(null, v)], true), iter__4278.call(null, cljs.core.rest.call(null, s__4279__$1)))
                  }else {
                    return null
                  }
                  break
                }
              }, null)
            };
            return iter__2487__auto__.call(null, c)
          }())
        }else {
          if(cljs.core.coll_QMARK_.call(null, x)) {
            var c = mrhyde.typepatcher.from_cache_if_has_cache.call(null, x);
            return cljs.core.into.call(null, cljs.core.empty.call(null, c), cljs.core.map.call(null, internal_recurse, c))
          }else {
            if("\ufdd0'else") {
              return mrhyde.typepatcher.from_cache_if_has_cache.call(null, x)
            }else {
              return null
            }
          }
        }
      }
    }.call(null, xo)
  };
  var recurse_from_hyde_cache = function(xo, var_args) {
    var opts = null;
    if(goog.isDef(var_args)) {
      opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return recurse_from_hyde_cache__delegate.call(this, xo, opts)
  };
  recurse_from_hyde_cache.cljs$lang$maxFixedArity = 1;
  recurse_from_hyde_cache.cljs$lang$applyTo = function(arglist__4282) {
    var xo = cljs.core.first(arglist__4282);
    var opts = cljs.core.rest(arglist__4282);
    return recurse_from_hyde_cache__delegate(xo, opts)
  };
  recurse_from_hyde_cache.cljs$lang$arity$variadic = recurse_from_hyde_cache__delegate;
  return recurse_from_hyde_cache
}();
mrhyde.typepatcher.repersist = function() {
  var repersist__delegate = function(x, opts) {
    if(cljs.core.truth_(goog.isFunction(x))) {
      return function() {
        var G__4283__delegate = function(args) {
          return cljs.core.apply.call(null, repersist, function() {
            var t = this;
            return x.apply(t, cljs.core.apply.call(null, cljs.core.array, args))
          }(), opts)
        };
        var G__4283 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__4283__delegate.call(this, args)
        };
        G__4283.cljs$lang$maxFixedArity = 0;
        G__4283.cljs$lang$applyTo = function(arglist__4284) {
          var args = cljs.core.seq(arglist__4284);
          return G__4283__delegate(args)
        };
        G__4283.cljs$lang$arity$variadic = G__4283__delegate;
        return G__4283
      }()
    }else {
      return cljs.core.apply.call(null, mrhyde.typepatcher.recurse_from_hyde_cache, x, opts)
    }
  };
  var repersist = function(x, var_args) {
    var opts = null;
    if(goog.isDef(var_args)) {
      opts = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return repersist__delegate.call(this, x, opts)
  };
  repersist.cljs$lang$maxFixedArity = 1;
  repersist.cljs$lang$applyTo = function(arglist__4285) {
    var x = cljs.core.first(arglist__4285);
    var opts = cljs.core.rest(arglist__4285);
    return repersist__delegate(x, opts)
  };
  repersist.cljs$lang$arity$variadic = repersist__delegate;
  return repersist
}();
mrhyde.typepatcher.have_patched_arrayish_flag = cljs.core.atom.call(null, false);
mrhyde.typepatcher.have_patched_mappish_flag = cljs.core.atom.call(null, false);
mrhyde.typepatcher.patch_sequential_type = function patch_sequential_type(t) {
  if(mrhyde.mrhyde.hyde_array_QMARK_.call(null, t["prototype"])) {
    return null
  }else {
    mrhyde.typepatcher.patch_prototype_as_array.call(null, t["prototype"], t, false);
    return mrhyde.typepatcher.add_hyde_protocol_to_seq.call(null, t)
  }
};
mrhyde.typepatcher.patch_vector_type = function patch_vector_type(t) {
  if(mrhyde.mrhyde.hyde_array_QMARK_.call(null, t["prototype"])) {
    return null
  }else {
    mrhyde.typepatcher.patch_prototype_as_array.call(null, t["prototype"], t, true);
    return mrhyde.typepatcher.add_hyde_protocol_to_seq.call(null, t)
  }
};
mrhyde.typepatcher.patch_map_type = function patch_map_type(p__4286) {
  var vec__4288 = p__4286;
  var t = cljs.core.nth.call(null, vec__4288, 0, null);
  var s = cljs.core.nth.call(null, vec__4288, 1, null);
  if(mrhyde.mrhyde.hyde_object_QMARK_.call(null, t["prototype"])) {
    return mrhyde.typepatcher.dp.call(null, [cljs.core.str("already a hyde-object: "), cljs.core.str(t)].join(""))
  }else {
    mrhyde.typepatcher.patch_prototype_as_map.call(null, t["prototype"], t);
    mrhyde.typepatcher.add_hyde_protocol_to_map.call(null, t);
    return mrhyde.typepatcher.patch_core_map_type.call(null, s)
  }
};
mrhyde.typepatcher.patch_known_sequential_types = function patch_known_sequential_types() {
  var G__4290 = cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([cljs.core.List, cljs.core.LazySeq, cljs.core.IndexedSeq, cljs.core.Cons, cljs.core.Range, cljs.core.ArrayNodeSeq, cljs.core.ChunkedSeq], true));
  while(true) {
    if(G__4290) {
      var t = cljs.core.first.call(null, G__4290);
      mrhyde.typepatcher.patch_sequential_type.call(null, t);
      var G__4291 = cljs.core.next.call(null, G__4290);
      G__4290 = G__4291;
      continue
    }else {
      return null
    }
    break
  }
};
mrhyde.typepatcher.patch_known_vector_types = function patch_known_vector_types() {
  var G__4293 = cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector, cljs.core.Subvec], true));
  while(true) {
    if(G__4293) {
      var t = cljs.core.first.call(null, G__4293);
      mrhyde.typepatcher.patch_vector_type.call(null, t);
      var G__4294 = cljs.core.next.call(null, G__4293);
      G__4293 = G__4294;
      continue
    }else {
      return null
    }
    break
  }
};
mrhyde.typepatcher.patch_known_mappish_types = function patch_known_mappish_types() {
  mrhyde.typepatcher.patch_sequential_type.call(null, cljs.core.LazySeq);
  var G__4296 = cljs.core.seq.call(null, cljs.core.PersistentVector.fromArray([cljs.core.PersistentVector.fromArray([cljs.core.ObjMap, "ObjMap"], true), cljs.core.PersistentVector.fromArray([cljs.core.PersistentHashMap, "PersistentHashMap"], true)], true));
  while(true) {
    if(G__4296) {
      var t = cljs.core.first.call(null, G__4296);
      if(cljs.core._EQ_.call(null, cljs.core.first.call(null, t), cljs.core[cljs.core.second.call(null, t)])) {
        mrhyde.typepatcher.patch_map_type.call(null, t)
      }else {
      }
      var G__4297 = cljs.core.next.call(null, G__4296);
      G__4296 = G__4297;
      continue
    }else {
      return null
    }
    break
  }
};
mrhyde.typepatcher.get_partition_key = function get_partition_key() {
  var t = this;
  return t[mrhyde.typepatcher.hyde_parition_key]
};
mrhyde.typepatcher.set_partition_key = function set_partition_key(k) {
  var t = this;
  mrhyde.typepatcher.aset_hidden.call(null, t, mrhyde.typepatcher.hyde_parition_key, k);
  window["side"] = "effect";
  if(cljs.core._EQ_.call(null, 16123663, k)) {
    console.log("matches")
  }else {
  }
  console.log(k);
  return console.log(t)
};
mrhyde.typepatcher.patch_obj_spy_on_partition = function patch_obj_spy_on_partition() {
  console.log(mrhyde.typepatcher.set_partition_key);
  return mrhyde.typepatcher.install_js_hidden_getset_prop.call(null, cljs.core.PersistentHashMap.prototype, mrhyde.typepatcher.cljs_partition_key, mrhyde.typepatcher.get_partition_key, mrhyde.typepatcher.set_partition_key)
};
goog.provide("acute");
goog.require("cljs.core");
goog.require("mrhyde.typepatcher");
goog.require("mrhyde.typepatcher");
acute.angular = function() {
  var ct = this;
  return ct["angular"]
}();
acute.bootstrap = function bootstrap() {
  mrhyde.typepatcher.patch_known_vector_types.call(null);
  return mrhyde.typepatcher.patch_known_mappish_types.call(null)
};
goog.exportSymbol("acute.bootstrap", acute.bootstrap);
goog.provide("acute.tutorial.controllers");
goog.require("cljs.core");
goog.require("acute");
goog.require("cljs.reader");
goog.require("acute");
goog.require("cljs.reader");
acute.tutorial.controllers.PhoneListCtrl = function PhoneListCtrl($scope, $http) {
  $http.get("phones/phones.edn").success(function(data) {
    return $scope["phones"] = data
  });
  return $scope["orderProp"] = "age"
};
acute.tutorial.controllers.PhoneDetailCtrl = function PhoneDetailCtrl($scope, $routeParams, $http) {
  $http.get([cljs.core.str("phones/"), cljs.core.str($routeParams["phoneId"]), cljs.core.str(".edn")].join("")).success(function(data) {
    $scope["phone"] = data;
    return $scope["mainImageUrl"] = cljs.core.first.call(null, (new cljs.core.Keyword("\ufdd0'images")).call(null, data))
  });
  return $scope["setImage"] = function(p1__2817_SHARP_) {
    return $scope["mainImageUrl"] = p1__2817_SHARP_
  }
};
goog.provide("acute.tutorial.filters");
goog.require("cljs.core");
goog.require("acute");
goog.require("acute");
acute.angular.module("phonecatFilters", cljs.core.PersistentVector.EMPTY).filter("checkmark", function() {
  return function(p1__2818_SHARP_) {
    if(cljs.core.truth_(p1__2818_SHARP_)) {
      return"\u2713"
    }else {
      return"\u2718"
    }
  }
});
goog.provide("acute.tutorial.app");
goog.require("cljs.core");
goog.require("acute");
goog.require("cljs.reader");
goog.require("acute.tutorial.controllers");
goog.require("acute.tutorial.controllers");
goog.require("acute");
goog.require("cljs.reader");
acute.bootstrap.call(null);
var app_2816 = acute.angular.module("phonecat", cljs.core.PersistentVector.fromArray(["phonecatFilters"], true));
app_2816.config(cljs.core.PersistentVector.fromArray(["$routeProvider", function($routeProvider) {
  return $routeProvider.when("/phones", cljs.core.ObjMap.fromObject(["\ufdd0'templateUrl", "\ufdd0'controller"], {"\ufdd0'templateUrl":"partials/phone-list.html", "\ufdd0'controller":acute.tutorial.controllers.PhoneListCtrl})).when("/phones/:phoneId", cljs.core.ObjMap.fromObject(["\ufdd0'templateUrl", "\ufdd0'controller"], {"\ufdd0'templateUrl":"partials/phone-detail.html", "\ufdd0'controller":acute.tutorial.controllers.PhoneDetailCtrl})).otherwise(cljs.core.ObjMap.fromObject(["\ufdd0'redirectTo"], 
  {"\ufdd0'redirectTo":"/phones"}))
}], true));
app_2816.config(cljs.core.PersistentVector.fromArray(["$httpProvider", function($httpProvider) {
  return $httpProvider.defaults.transformResponse = function(x) {
    if(cljs.core.truth_(function() {
      var and__3822__auto__ = cljs.core.string_QMARK_.call(null, x);
      if(and__3822__auto__) {
        var or__3824__auto__ = cljs.core.re_find.call(null, /^\{\:/, x);
        if(cljs.core.truth_(or__3824__auto__)) {
          return or__3824__auto__
        }else {
          return cljs.core.re_find.call(null, /^\[\{/, x)
        }
      }else {
        return and__3822__auto__
      }
    }())) {
      return cljs.reader.read_string.call(null, x)
    }else {
      return x
    }
  }
}], true));
