/**
 * @forgerock/login-widget
 *
 * Copyright (c) 2023 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license.
 *
 * MIT License
 *
 * Copyright (c) 2023
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function noop() {}
function assign(tar, src) {
  // @ts-ignore
  for (const k in src) tar[k] = src[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === 'function';
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}
function is_empty(obj) {
  return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function get_store_value(store) {
  let value;
  subscribe(store, (_) => (value = _))();
  return value;
}
function component_subscribe(component, store, callback) {
  component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
  if (definition) {
    const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
    return definition[0](slot_ctx);
  }
}
function get_slot_context(definition, ctx, $$scope, fn) {
  return definition[1] && fn ? assign($$scope.ctx.slice(), definition[1](fn(ctx))) : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
  if (definition[2] && fn) {
    const lets = definition[2](fn(dirty));
    if ($$scope.dirty === undefined) {
      return lets;
    }
    if (typeof lets === 'object') {
      const merged = [];
      const len = Math.max($$scope.dirty.length, lets.length);
      for (let i = 0; i < len; i += 1) {
        merged[i] = $$scope.dirty[i] | lets[i];
      }
      return merged;
    }
    return $$scope.dirty | lets;
  }
  return $$scope.dirty;
}
function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
  if (slot_changes) {
    const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
    slot.p(slot_context, slot_changes);
  }
}
function get_all_dirty_from_scope($$scope) {
  if ($$scope.ctx.length > 32) {
    const dirty = [];
    const length = $$scope.ctx.length / 32;
    for (let i = 0; i < length; i++) {
      dirty[i] = -1;
    }
    return dirty;
  }
  return -1;
}
function append(target, node) {
  target.appendChild(node);
}
function insert(target, node, anchor) {
  target.insertBefore(node, anchor || null);
}
function detach(node) {
  if (node.parentNode) {
    node.parentNode.removeChild(node);
  }
}
function destroy_each(iterations, detaching) {
  for (let i = 0; i < iterations.length; i += 1) {
    if (iterations[i]) iterations[i].d(detaching);
  }
}
function element(name) {
  return document.createElement(name);
}
function svg_element(name) {
  return document.createElementNS('http://www.w3.org/2000/svg', name);
}
function text(data) {
  return document.createTextNode(data);
}
function space() {
  return text(' ');
}
function empty() {
  return text('');
}
function listen(node, event, handler, options) {
  node.addEventListener(event, handler, options);
  return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
  return function (event) {
    event.preventDefault();
    // @ts-ignore
    return fn.call(this, event);
  };
}
function attr(node, attribute, value) {
  if (value == null) node.removeAttribute(attribute);
  else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}
function to_number(value) {
  return value === '' ? null : +value;
}
function children(element) {
  return Array.from(element.childNodes);
}
function set_data(text, data) {
  data = '' + data;
  if (text.wholeText !== data) text.data = data;
}
function set_input_value(input, value) {
  input.value = value == null ? '' : value;
}
function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
  const e = document.createEvent('CustomEvent');
  e.initCustomEvent(type, bubbles, cancelable, detail);
  return e;
}
class HtmlTag {
  constructor(is_svg = false) {
    this.is_svg = false;
    this.is_svg = is_svg;
    this.e = this.n = null;
  }
  c(html) {
    this.h(html);
  }
  m(html, target, anchor = null) {
    if (!this.e) {
      if (this.is_svg) this.e = svg_element(target.nodeName);
      else this.e = element(target.nodeName);
      this.t = target;
      this.c(html);
    }
    this.i(anchor);
  }
  h(html) {
    this.e.innerHTML = html;
    this.n = Array.from(this.e.childNodes);
  }
  i(anchor) {
    for (let i = 0; i < this.n.length; i += 1) {
      insert(this.t, this.n[i], anchor);
    }
  }
  p(html) {
    this.d();
    this.h(html);
    this.i(this.a);
  }
  d() {
    this.n.forEach(detach);
  }
}
function construct_svelte_component(component, props) {
  return new component(props);
}

let current_component;
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component) throw new Error('Function called outside component initialization');
  return current_component;
}
/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs#run-time-svelte-onmount
 */
function onMount(fn) {
  get_current_component().$$.on_mount.push(fn);
}
/**
 * Schedules a callback to run immediately after the component has been updated.
 *
 * The first time the callback runs will be after the initial `onMount`
 */
function afterUpdate(fn) {
  get_current_component().$$.after_update.push(fn);
}
/**
 * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
 * Event dispatchers are functions that can take two arguments: `name` and `detail`.
 *
 * Component events created with `createEventDispatcher` create a
 * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
 * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
 * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
 * property and can contain any type of data.
 *
 * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
 */
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail, { cancelable = false } = {}) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      // TODO are there situations where events could be dispatched
      // in a server (non-DOM) environment?
      const event = custom_event(type, detail, { cancelable });
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
      return !event.defaultPrevented;
    }
    return true;
  };
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function add_flush_callback(fn) {
  flush_callbacks.push(fn);
}
// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();
let flushidx = 0; // Do *not* move this inside the flush() function
function flush() {
  const saved_component = current_component;
  do {
    // first, call beforeUpdate functions
    // and update components
    while (flushidx < dirty_components.length) {
      const component = dirty_components[flushidx];
      flushidx++;
      set_current_component(component);
      update(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    flushidx = 0;
    while (binding_callbacks.length) binding_callbacks.pop()();
    // then, once components are updated, call
    // afterUpdate functions. This may cause
    // subsequent updates...
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        // ...so guard against infinite loops
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  seen_callbacks.clear();
  set_current_component(saved_component);
}
function update($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
const outroing = new Set();
let outros;
function group_outros() {
  outros = {
    r: 0,
    c: [],
    p: outros, // parent group
  };
}
function check_outros() {
  if (!outros.r) {
    run_all(outros.c);
  }
  outros = outros.p;
}
function transition_in(block, local) {
  if (block && block.i) {
    outroing.delete(block);
    block.i(local);
  }
}
function transition_out(block, local, detach, callback) {
  if (block && block.o) {
    if (outroing.has(block)) return;
    outroing.add(block);
    outros.c.push(() => {
      outroing.delete(block);
      if (callback) {
        if (detach) block.d(1);
        callback();
      }
    });
    block.o(local);
  } else if (callback) {
    callback();
  }
}

function get_spread_update(levels, updates) {
  const update = {};
  const to_null_out = {};
  const accounted_for = { $$scope: 1 };
  let i = levels.length;
  while (i--) {
    const o = levels[i];
    const n = updates[i];
    if (n) {
      for (const key in o) {
        if (!(key in n)) to_null_out[key] = 1;
      }
      for (const key in n) {
        if (!accounted_for[key]) {
          update[key] = n[key];
          accounted_for[key] = 1;
        }
      }
      levels[i] = n;
    } else {
      for (const key in o) {
        accounted_for[key] = 1;
      }
    }
  }
  for (const key in to_null_out) {
    if (!(key in update)) update[key] = undefined;
  }
  return update;
}
function get_spread_object(spread_props) {
  return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
}

function bind(component, name, callback, value) {
  const index = component.$$.props[name];
  if (index !== undefined) {
    component.$$.bound[index] = callback;
    if (value === undefined) {
      callback(component.$$.ctx[index]);
    }
  }
}
function create_component(block) {
  block && block.c();
}
function mount_component(component, target, anchor, customElement) {
  const { fragment, after_update } = component.$$;
  fragment && fragment.m(target, anchor);
  if (!customElement) {
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
      const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
      // if the component was destroyed immediately
      // it will update the `$$.on_destroy` reference to `null`.
      // the destructured on_destroy may still reference to the old array
      if (component.$$.on_destroy) {
        component.$$.on_destroy.push(...new_on_destroy);
      } else {
        // Edge case - component was destroyed immediately,
        // most likely as a result of a binding initialising
        run_all(new_on_destroy);
      }
      component.$$.on_mount = [];
    });
  }
  after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
  const $$ = component.$$;
  if ($$.fragment !== null) {
    run_all($$.on_destroy);
    $$.fragment && $$.fragment.d(detaching);
    // TODO null out other refs, including component.$$ (but need to
    // preserve final state?)
    $$.on_destroy = $$.fragment = null;
    $$.ctx = [];
  }
}
function make_dirty(component, i) {
  if (component.$$.dirty[0] === -1) {
    dirty_components.push(component);
    schedule_update();
    component.$$.dirty.fill(0);
  }
  component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}
function init(
  component,
  options,
  instance,
  create_fragment,
  not_equal,
  props,
  append_styles,
  dirty = [-1],
) {
  const parent_component = current_component;
  set_current_component(component);
  const $$ = (component.$$ = {
    fragment: null,
    ctx: [],
    // state
    props,
    update: noop,
    not_equal,
    bound: blank_object(),
    // lifecycle
    on_mount: [],
    on_destroy: [],
    on_disconnect: [],
    before_update: [],
    after_update: [],
    context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
    // everything else
    callbacks: blank_object(),
    dirty,
    skip_bound: false,
    root: options.target || parent_component.$$.root,
  });
  append_styles && append_styles($$.root);
  let ready = false;
  $$.ctx = instance
    ? instance(component, options.props || {}, (i, ret, ...rest) => {
        const value = rest.length ? rest[0] : ret;
        if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
          if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
          if (ready) make_dirty(component, i);
        }
        return ret;
      })
    : [];
  $$.update();
  ready = true;
  run_all($$.before_update);
  // `false` as a special case of no DOM component
  $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
  if (options.target) {
    if (options.hydrate) {
      const nodes = children(options.target);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      $$.fragment && $$.fragment.l(nodes);
      nodes.forEach(detach);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      $$.fragment && $$.fragment.c();
    }
    if (options.intro) transition_in(component.$$.fragment);
    mount_component(component, options.target, options.anchor, options.customElement);
    flush();
  }
  set_current_component(parent_component);
}
/**
 * Base class for Svelte components. Used when dev=false.
 */
class SvelteComponent {
  $destroy() {
    destroy_component(this, 1);
    this.$destroy = noop;
  }
  $on(type, callback) {
    if (!is_function(callback)) {
      return noop;
    }
    const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
    callbacks.push(callback);
    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    };
  }
  $set($$props) {
    if (this.$$set && !is_empty($$props)) {
      this.$$.skip_bound = true;
      this.$$set($$props);
      this.$$.skip_bound = false;
    }
  }
}

const subscriber_queue = [];
/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param {StartStopNotifier}start start and stop notifications for subscriptions
 */
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe,
  };
}
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        // store is ready
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update(fn) {
    set(fn(value));
  }
  function subscribe(run, invalidate = noop) {
    const subscriber = [run, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update, subscribe };
}

/*
 * @forgerock/javascript-sdk
 *
 * constants.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/** @hidden */
var DEFAULT_TIMEOUT = 60 * 1000;
var DEFAULT_OAUTH_THRESHOLD = 30 * 1000;

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$8 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$8 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$8.apply(this, arguments);
  };
/**
 * Sets defaults for options that are required but have no supplied value
 * @param options The options to set defaults for
 * @returns options The options with defaults
 */
function setDefaults(options) {
  return __assign$8(__assign$8({}, options), {
    oauthThreshold: options.oauthThreshold || DEFAULT_OAUTH_THRESHOLD,
  });
}
/**
 * Utility for merging configuration defaults with one-off options.
 *
 * Example:
 *
 * ```js
 * // Establish configuration defaults
 * Config.set({
 *   clientId: 'myApp',
 *   serverConfig: { baseUrl: 'https://openam-domain.com/am' },
 *   tree: 'UsernamePassword'
 * });
 *
 * // Specify overrides as needed
 * const configOverrides = { tree: 'PasswordlessWebAuthn' };
 * const step = await FRAuth.next(undefined, configOverrides);
 */
var Config = /** @class */ (function () {
  function Config() {}
  /**
   * Sets the default options.
   *
   * @param options The options to use as defaults
   */
  Config.set = function (options) {
    if (!this.isValid(options)) {
      throw new Error('Configuration is invalid');
    }
    if (options.serverConfig) {
      this.validateServerConfig(options.serverConfig);
    }
    this.options = __assign$8({}, setDefaults(options));
  };
  /**
   * Merges the provided options with the default options.  Ensures a server configuration exists.
   *
   * @param options The options to merge with defaults
   */
  Config.get = function (options) {
    if (!this.options && !options) {
      throw new Error('Configuration has not been set');
    }
    var merged = __assign$8(__assign$8({}, this.options), options);
    if (!merged.serverConfig || !merged.serverConfig.baseUrl) {
      throw new Error('Server configuration has not been set');
    }
    return merged;
  };
  Config.isValid = function (options) {
    return !!(options && options.serverConfig);
  };
  Config.validateServerConfig = function (serverConfig) {
    if (!serverConfig.timeout) {
      serverConfig.timeout = DEFAULT_TIMEOUT;
    }
    var url = serverConfig.baseUrl;
    if (url && url.charAt(url.length - 1) !== '/') {
      serverConfig.baseUrl = url + '/';
    }
  };
  return Config;
})();

/*
 * @forgerock/javascript-sdk
 *
 * enums.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var ActionTypes;
(function (ActionTypes) {
  ActionTypes['Authenticate'] = 'AUTHENTICATE';
  ActionTypes['Authorize'] = 'AUTHORIZE';
  ActionTypes['EndSession'] = 'END_SESSION';
  ActionTypes['Logout'] = 'LOGOUT';
  ActionTypes['ExchangeToken'] = 'EXCHANGE_TOKEN';
  ActionTypes['RefreshToken'] = 'REFRESH_TOKEN';
  ActionTypes['ResumeAuthenticate'] = 'RESUME_AUTHENTICATE';
  ActionTypes['RevokeToken'] = 'REVOKE_TOKEN';
  ActionTypes['StartAuthenticate'] = 'START_AUTHENTICATE';
  ActionTypes['UserInfo'] = 'USER_INFO';
})(ActionTypes || (ActionTypes = {}));

/*
 * @forgerock/javascript-sdk
 *
 * constants.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @module
 * @ignore
 * These are private constants
 */
var REQUESTED_WITH = 'forgerock-sdk';

/*
 * @forgerock/javascript-sdk
 *
 * timeout.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @module
 * @ignore
 * These are private utility functions
 */
function withTimeout(promise, timeout) {
  if (timeout === void 0) {
    timeout = DEFAULT_TIMEOUT;
  }
  var effectiveTimeout = timeout || DEFAULT_TIMEOUT;
  var timeoutP = new Promise(function (_, reject) {
    return window.setTimeout(function () {
      return reject(new Error('Timeout'));
    }, effectiveTimeout);
  });
  return Promise.race([promise, timeoutP]);
}

/*
 * @forgerock/javascript-sdk
 *
 * realm.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/** @hidden */
function getRealmUrlPath(realmPath) {
  // Split the path and scrub segments
  var names = (realmPath || '')
    .split('/')
    .map(function (x) {
      return x.trim();
    })
    .filter(function (x) {
      return x !== '';
    });
  // Ensure 'root' is the first realm
  if (names[0] !== 'root') {
    names.unshift('root');
  }
  // Concatenate into a URL path
  var urlPath = names
    .map(function (x) {
      return 'realms/'.concat(x);
    })
    .join('/');
  return urlPath;
}

/*
 * @forgerock/javascript-sdk
 *
 * url.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __spreadArray =
  (undefined && undefined.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
/**
 * Returns the base URL including protocol, hostname and any non-standard port.
 * The returned URL does not include a trailing slash.
 */
function getBaseUrl(url) {
  var isNonStandardPort =
    (url.protocol === 'http:' && ['', '80'].indexOf(url.port) === -1) ||
    (url.protocol === 'https:' && ['', '443'].indexOf(url.port) === -1);
  var port = isNonStandardPort ? ':'.concat(url.port) : '';
  var baseUrl = ''.concat(url.protocol, '//').concat(url.hostname).concat(port);
  return baseUrl;
}
function getEndpointPath(endpoint, realmPath, customPaths) {
  var realmUrlPath = getRealmUrlPath(realmPath);
  var defaultPaths = {
    authenticate: 'json/'.concat(realmUrlPath, '/authenticate'),
    authorize: 'oauth2/'.concat(realmUrlPath, '/authorize'),
    accessToken: 'oauth2/'.concat(realmUrlPath, '/access_token'),
    endSession: 'oauth2/'.concat(realmUrlPath, '/connect/endSession'),
    userInfo: 'oauth2/'.concat(realmUrlPath, '/userinfo'),
    revoke: 'oauth2/'.concat(realmUrlPath, '/token/revoke'),
    sessions: 'json/'.concat(realmUrlPath, '/sessions/'),
  };
  if (customPaths && customPaths[endpoint]) {
    // TypeScript is not correctly reading the condition above
    // It's thinking that customPaths[endpoint] may result in undefined
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return customPaths[endpoint];
  } else {
    return defaultPaths[endpoint];
  }
}
function resolve(baseUrl, path) {
  var url = new URL(baseUrl);
  if (path.startsWith('/')) {
    return ''.concat(getBaseUrl(url)).concat(path);
  }
  var basePath = url.pathname.split('/');
  var destPath = path.split('/').filter(function (x) {
    return !!x;
  });
  var newPath = __spreadArray(__spreadArray([], basePath.slice(0, -1), true), destPath, true).join(
    '/',
  );
  return ''.concat(getBaseUrl(url)).concat(newPath);
}
function parseQuery(fullUrl) {
  var url = new URL(fullUrl);
  var query = {};
  url.searchParams.forEach(function (v, k) {
    return (query[k] = v);
  });
  return query;
}
function stringify(data) {
  var pairs = [];
  for (var k in data) {
    if (data[k]) {
      pairs.push(k + '=' + encodeURIComponent(data[k]));
    }
  }
  return pairs.join('&');
}

/*
 * @forgerock/javascript-sdk
 *
 * middleware.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @function middlewareWrapper - A "Node" and "Redux" style middleware that is called just before
 * the request is made from the SDK. This allows you access to the request for modification.
 * @param request - A request object container of the URL and the Request Init object
 * @param action - The action object that is passed into the middleware communicating intent
 * @param action.type - A "Redux" style type that contains the serialized action
 * @param action.payload - The payload of the action that can contain metadata
 * @returns {function} - Function that takes middleware parameter & runs middleware against request
 */
function middlewareWrapper(
  request,
  // eslint-disable-next-line
  _a,
) {
  var type = _a.type,
    payload = _a.payload;
  // no mutation and no reassignment
  var actionCopy = Object.freeze({ type: type, payload: payload });
  return function (middleware) {
    if (!Array.isArray(middleware)) {
      return request;
    }
    // Copy middleware so the `shift` below doesn't mutate source
    var mwareCopy = middleware.map(function (fn) {
      return fn;
    });
    function iterator() {
      var nextMiddlewareToBeCalled = mwareCopy.shift();
      nextMiddlewareToBeCalled && nextMiddlewareToBeCalled(request, actionCopy, iterator);
      return request;
    }
    return iterator();
  };
}

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$7 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$7 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$7.apply(this, arguments);
  };
var __awaiter$d =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$d =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides direct access to the OpenAM authentication tree API.
 */
var Auth = /** @class */ (function () {
  function Auth() {}
  /**
   * Gets the next step in the authentication tree.
   *
   * @param {Step} previousStep The previous step, including any required input.
   * @param {StepOptions} options Configuration default overrides.
   * @return {Step} The next step in the authentication tree.
   */
  Auth.next = function (previousStep, options) {
    return __awaiter$d(this, void 0, void 0, function () {
      var _a,
        middleware,
        realmPath,
        serverConfig,
        tree,
        type,
        query,
        url,
        runMiddleware,
        req,
        res,
        json;
      return __generator$d(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = Config.get(options)),
              (middleware = _a.middleware),
              (realmPath = _a.realmPath),
              (serverConfig = _a.serverConfig),
              (tree = _a.tree),
              (type = _a.type);
            query = options ? options.query : {};
            url = this.constructUrl(serverConfig, realmPath, tree, query);
            runMiddleware = middlewareWrapper(
              {
                url: new URL(url),
                init: this.configureRequest(previousStep),
              },
              {
                type: previousStep ? ActionTypes.Authenticate : ActionTypes.StartAuthenticate,
                payload: {
                  tree: tree,
                  type: type ? type : 'service',
                },
              },
            );
            req = runMiddleware(middleware);
            return [
              4 /*yield*/,
              withTimeout(fetch(req.url.toString(), req.init), serverConfig.timeout),
            ];
          case 1:
            res = _b.sent();
            return [4 /*yield*/, this.getResponseJson(res)];
          case 2:
            json = _b.sent();
            return [2 /*return*/, json];
        }
      });
    });
  };
  Auth.constructUrl = function (serverConfig, realmPath, tree, query) {
    var treeParams = tree ? { authIndexType: 'service', authIndexValue: tree } : undefined;
    var params = __assign$7(__assign$7({}, query), treeParams);
    var queryString = Object.keys(params).length > 0 ? '?'.concat(stringify(params)) : '';
    var path = getEndpointPath('authenticate', realmPath, serverConfig.paths);
    var url = resolve(serverConfig.baseUrl, ''.concat(path).concat(queryString));
    return url;
  };
  Auth.configureRequest = function (step) {
    var init = {
      body: step ? JSON.stringify(step) : undefined,
      credentials: 'include',
      headers: new Headers({
        Accept: 'application/json',
        'Accept-API-Version': 'protocol=1.0,resource=2.1',
        'Content-Type': 'application/json',
        'X-Requested-With': REQUESTED_WITH,
      }),
      method: 'POST',
    };
    return init;
  };
  Auth.getResponseJson = function (res) {
    return __awaiter$d(this, void 0, void 0, function () {
      var contentType, isJson, json, _a;
      return __generator$d(this, function (_b) {
        switch (_b.label) {
          case 0:
            contentType = res.headers.get('content-type');
            isJson = contentType && contentType.indexOf('application/json') > -1;
            if (!isJson) return [3 /*break*/, 2];
            return [4 /*yield*/, res.json()];
          case 1:
            _a = _b.sent();
            return [3 /*break*/, 3];
          case 2:
            _a = {};
            _b.label = 3;
          case 3:
            json = _a;
            json.status = res.status;
            json.ok = res.ok;
            return [2 /*return*/, json];
        }
      });
    });
  };
  return Auth;
})();

/*
 * @forgerock/javascript-sdk
 *
 * enums.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Known errors that can occur during authentication.
 */
var ErrorCode;
(function (ErrorCode) {
  ErrorCode['BadRequest'] = 'BAD_REQUEST';
  ErrorCode['Timeout'] = 'TIMEOUT';
  ErrorCode['Unauthorized'] = 'UNAUTHORIZED';
  ErrorCode['Unknown'] = 'UNKNOWN';
})(ErrorCode || (ErrorCode = {}));
/**
 * Types of callbacks directly supported by the SDK.
 */
var CallbackType;
(function (CallbackType) {
  CallbackType['BooleanAttributeInputCallback'] = 'BooleanAttributeInputCallback';
  CallbackType['ChoiceCallback'] = 'ChoiceCallback';
  CallbackType['ConfirmationCallback'] = 'ConfirmationCallback';
  CallbackType['DeviceProfileCallback'] = 'DeviceProfileCallback';
  CallbackType['HiddenValueCallback'] = 'HiddenValueCallback';
  CallbackType['KbaCreateCallback'] = 'KbaCreateCallback';
  CallbackType['MetadataCallback'] = 'MetadataCallback';
  CallbackType['NameCallback'] = 'NameCallback';
  CallbackType['NumberAttributeInputCallback'] = 'NumberAttributeInputCallback';
  CallbackType['PasswordCallback'] = 'PasswordCallback';
  CallbackType['PollingWaitCallback'] = 'PollingWaitCallback';
  CallbackType['ReCaptchaCallback'] = 'ReCaptchaCallback';
  CallbackType['RedirectCallback'] = 'RedirectCallback';
  CallbackType['SelectIdPCallback'] = 'SelectIdPCallback';
  CallbackType['StringAttributeInputCallback'] = 'StringAttributeInputCallback';
  CallbackType['SuspendedTextOutputCallback'] = 'SuspendedTextOutputCallback';
  CallbackType['TermsAndConditionsCallback'] = 'TermsAndConditionsCallback';
  CallbackType['TextInputCallback'] = 'TextInputCallback';
  CallbackType['TextOutputCallback'] = 'TextOutputCallback';
  CallbackType['ValidatedCreatePasswordCallback'] = 'ValidatedCreatePasswordCallback';
  CallbackType['ValidatedCreateUsernameCallback'] = 'ValidatedCreateUsernameCallback';
})(CallbackType || (CallbackType = {}));

/*
 * @forgerock/javascript-sdk
 *
 * helpers.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/** @hidden */
function add(container, type, listener) {
  container[type] = container[type] || [];
  if (container[type].indexOf(listener) < 0) {
    container[type].push(listener);
  }
}
/** @hidden */
function remove(container, type, listener) {
  if (!container[type]) {
    return;
  }
  var index = container[type].indexOf(listener);
  if (index >= 0) {
    container[type].splice(index, 1);
  }
}
/** @hidden */
function clear(container, type) {
  Object.keys(container).forEach(function (k) {
    if (!type || k === type) {
      delete container[k];
    }
  });
}

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Event dispatcher for subscribing and publishing categorized events.
 */
var Dispatcher = /** @class */ (function () {
  function Dispatcher() {
    this.callbacks = {};
  }
  /**
   * Subscribes to an event type.
   *
   * @param type The event type
   * @param listener The function to subscribe to events of this type
   */
  Dispatcher.prototype.addEventListener = function (type, listener) {
    add(this.callbacks, type, listener);
  };
  /**
   * Unsubscribes from an event type.
   *
   * @param type The event type
   * @param listener The function to unsubscribe from events of this type
   */
  Dispatcher.prototype.removeEventListener = function (type, listener) {
    remove(this.callbacks, type, listener);
  };
  /**
   * Unsubscribes all listener functions to a single event type or all event types.
   *
   * @param type The event type, or all event types if not specified
   */
  Dispatcher.prototype.clearEventListeners = function (type) {
    clear(this.callbacks, type);
  };
  /**
   * Publishes an event.
   *
   * @param event The event object to publish
   */
  Dispatcher.prototype.dispatchEvent = function (event) {
    if (!this.callbacks[event.type]) {
      return;
    }
    for (var _i = 0, _a = this.callbacks[event.type]; _i < _a.length; _i++) {
      var listener = _a[_i];
      listener(event);
    }
  };
  return Dispatcher;
})();

/*
 * @forgerock/javascript-sdk
 *
 * enums.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var PolicyKey;
(function (PolicyKey) {
  PolicyKey['CannotContainCharacters'] = 'CANNOT_CONTAIN_CHARACTERS';
  PolicyKey['CannotContainDuplicates'] = 'CANNOT_CONTAIN_DUPLICATES';
  PolicyKey['CannotContainOthers'] = 'CANNOT_CONTAIN_OTHERS';
  PolicyKey['LeastCapitalLetters'] = 'AT_LEAST_X_CAPITAL_LETTERS';
  PolicyKey['LeastNumbers'] = 'AT_LEAST_X_NUMBERS';
  PolicyKey['MatchRegexp'] = 'MATCH_REGEXP';
  PolicyKey['MaximumLength'] = 'MAX_LENGTH';
  PolicyKey['MaximumNumber'] = 'MAXIMUM_NUMBER_VALUE';
  PolicyKey['MinimumLength'] = 'MIN_LENGTH';
  PolicyKey['MinimumNumber'] = 'MINIMUM_NUMBER_VALUE';
  PolicyKey['Required'] = 'REQUIRED';
  PolicyKey['Unique'] = 'UNIQUE';
  PolicyKey['UnknownPolicy'] = 'UNKNOWN_POLICY';
  PolicyKey['ValidArrayItems'] = 'VALID_ARRAY_ITEMS';
  PolicyKey['ValidDate'] = 'VALID_DATE';
  PolicyKey['ValidEmailAddress'] = 'VALID_EMAIL_ADDRESS_FORMAT';
  PolicyKey['ValidNameFormat'] = 'VALID_NAME_FORMAT';
  PolicyKey['ValidNumber'] = 'VALID_NUMBER';
  PolicyKey['ValidPhoneFormat'] = 'VALID_PHONE_FORMAT';
  PolicyKey['ValidQueryFilter'] = 'VALID_QUERY_FILTER';
  PolicyKey['ValidType'] = 'VALID_TYPE';
})(PolicyKey || (PolicyKey = {}));

/*
 * @forgerock/javascript-sdk
 *
 * strings.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @module
 * @ignore
 * These are private utility functions
 */
function plural(n, singularText, pluralText) {
  if (n === 1) {
    return singularText;
  }
  return pluralText !== undefined ? pluralText : singularText + 's';
}

/*
 * @forgerock/javascript-sdk
 *
 * helpers.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
function getProp(obj, prop, defaultValue) {
  if (!obj || obj[prop] === undefined) {
    return defaultValue;
  }
  return obj[prop];
}

/*
 * @forgerock/javascript-sdk
 *
 * message-creator.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var _a;
var defaultMessageCreator =
  ((_a = {}),
  (_a[PolicyKey.CannotContainCharacters] = function (property, params) {
    var forbiddenChars = getProp(params, 'forbiddenChars', '');
    return ''
      .concat(property, ' must not contain following characters: "')
      .concat(forbiddenChars, '"');
  }),
  (_a[PolicyKey.CannotContainDuplicates] = function (property, params) {
    var duplicateValue = getProp(params, 'duplicateValue', '');
    return ''.concat(property, '  must not contain duplicates: "').concat(duplicateValue, '"');
  }),
  (_a[PolicyKey.CannotContainOthers] = function (property, params) {
    var disallowedFields = getProp(params, 'disallowedFields', '');
    return ''.concat(property, ' must not contain: "').concat(disallowedFields, '"');
  }),
  (_a[PolicyKey.LeastCapitalLetters] = function (property, params) {
    var numCaps = getProp(params, 'numCaps', 0);
    return ''
      .concat(property, ' must contain at least ')
      .concat(numCaps, ' capital ')
      .concat(plural(numCaps, 'letter'));
  }),
  (_a[PolicyKey.LeastNumbers] = function (property, params) {
    var numNums = getProp(params, 'numNums', 0);
    return ''
      .concat(property, ' must contain at least ')
      .concat(numNums, ' numeric ')
      .concat(plural(numNums, 'value'));
  }),
  (_a[PolicyKey.MatchRegexp] = function (property) {
    return ''.concat(property, ' has failed the "MATCH_REGEXP" policy');
  }),
  (_a[PolicyKey.MaximumLength] = function (property, params) {
    var maxLength = getProp(params, 'maxLength', 0);
    return ''
      .concat(property, ' must be at most ')
      .concat(maxLength, ' ')
      .concat(plural(maxLength, 'character'));
  }),
  (_a[PolicyKey.MaximumNumber] = function (property) {
    return ''.concat(property, ' has failed the "MAXIMUM_NUMBER_VALUE" policy');
  }),
  (_a[PolicyKey.MinimumLength] = function (property, params) {
    var minLength = getProp(params, 'minLength', 0);
    return ''
      .concat(property, ' must be at least ')
      .concat(minLength, ' ')
      .concat(plural(minLength, 'character'));
  }),
  (_a[PolicyKey.MinimumNumber] = function (property) {
    return ''.concat(property, ' has failed the "MINIMUM_NUMBER_VALUE" policy');
  }),
  (_a[PolicyKey.Required] = function (property) {
    return ''.concat(property, ' is required');
  }),
  (_a[PolicyKey.Unique] = function (property) {
    return ''.concat(property, ' must be unique');
  }),
  (_a[PolicyKey.UnknownPolicy] = function (property, params) {
    var policyRequirement = getProp(params, 'policyRequirement', 'Unknown');
    return ''.concat(property, ': Unknown policy requirement "').concat(policyRequirement, '"');
  }),
  (_a[PolicyKey.ValidArrayItems] = function (property) {
    return ''.concat(property, ' has failed the "VALID_ARRAY_ITEMS" policy');
  }),
  (_a[PolicyKey.ValidDate] = function (property) {
    return ''.concat(property, ' has an invalid date');
  }),
  (_a[PolicyKey.ValidEmailAddress] = function (property) {
    return ''.concat(property, ' has an invalid email address');
  }),
  (_a[PolicyKey.ValidNameFormat] = function (property) {
    return ''.concat(property, ' has an invalid name format');
  }),
  (_a[PolicyKey.ValidNumber] = function (property) {
    return ''.concat(property, ' has an invalid number');
  }),
  (_a[PolicyKey.ValidPhoneFormat] = function (property) {
    return ''.concat(property, ' has an invalid phone number');
  }),
  (_a[PolicyKey.ValidQueryFilter] = function (property) {
    return ''.concat(property, ' has failed the "VALID_QUERY_FILTER" policy');
  }),
  (_a[PolicyKey.ValidType] = function (property) {
    return ''.concat(property, ' has failed the "VALID_TYPE" policy');
  }),
  _a);

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$6 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$6 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$6.apply(this, arguments);
  };
/**
 * Utility for processing policy failures into human readable messages.
 *
 * Example:
 *
 * ```js
 * // Create message overrides and extensions as needed
 * const messageCreator = {
 *   [PolicyKey.unique]: (property: string) => (
 *     `this is a custom message for "UNIQUE" policy of ${property}`
 *   ),
 *   CUSTOM_POLICY: (property: string, params: any) => (
 *     `this is a custom message for "${params.policyRequirement}" policy of ${property}`
 *   ),
 * };
 *
 * const thisStep = await FRAuth.next(previousStep);
 *
 * if (thisStep.type === StepType.LoginFailure) {
 *   const messagesStepMethod = thisStep.getProcessedMessage(messageCreator);
 *   const messagesClassMethod = FRPolicy.parseErrors(thisStep, messageCreator)
 * }
 */
var FRPolicy = /** @class */ (function () {
  function FRPolicy() {}
  /**
   * Parses policy errors and generates human readable error messages.
   *
   * @param {Step} err The step containing the error.
   * @param {MessageCreator} messageCreator
   * Extensible and overridable custom error messages for policy failures.
   * @return {ProcessedPropertyError[]} Array of objects containing all processed policy errors.
   */
  FRPolicy.parseErrors = function (err, messageCreator) {
    var _this = this;
    var errors = [];
    if (err.detail && err.detail.failedPolicyRequirements) {
      err.detail.failedPolicyRequirements.map(function (x) {
        errors.push.apply(errors, [
          {
            detail: x,
            messages: _this.parseFailedPolicyRequirement(x, messageCreator),
          },
        ]);
      });
    }
    return errors;
  };
  /**
   * Parses a failed policy and returns a string array of error messages.
   *
   * @param {FailedPolicyRequirement} failedPolicy The detail data of the failed policy.
   * @param {MessageCreator} customMessage
   * Extensible and overridable custom error messages for policy failures.
   * @return {string[]} Array of strings with all processed policy errors.
   */
  FRPolicy.parseFailedPolicyRequirement = function (failedPolicy, messageCreator) {
    var _this = this;
    var errors = [];
    failedPolicy.policyRequirements.map(function (policyRequirement) {
      errors.push(
        _this.parsePolicyRequirement(failedPolicy.property, policyRequirement, messageCreator),
      );
    });
    return errors;
  };
  /**
   * Parses a policy error into a human readable error message.
   *
   * @param {string} property The property with the policy failure.
   * @param {PolicyRequirement} policy The policy failure data.
   * @param {MessageCreator} customMessage
   * Extensible and overridable custom error messages for policy failures.
   * @return {string} Human readable error message.
   */
  FRPolicy.parsePolicyRequirement = function (property, policy, messageCreator) {
    if (messageCreator === void 0) {
      messageCreator = {};
    }
    // AM is returning policy requirement failures as JSON strings
    var policyObject = typeof policy === 'string' ? JSON.parse(policy) : __assign$6({}, policy);
    var policyRequirement = policyObject.policyRequirement;
    // Determine which message creator function to use
    var effectiveMessageCreator =
      messageCreator[policyRequirement] ||
      defaultMessageCreator[policyRequirement] ||
      defaultMessageCreator[PolicyKey.UnknownPolicy];
    // Flatten the parameters and create the message
    var params = policyObject.params
      ? __assign$6(__assign$6({}, policyObject.params), { policyRequirement: policyRequirement })
      : { policyRequirement: policyRequirement };
    var message = effectiveMessageCreator(property, params);
    return message;
  };
  return FRPolicy;
})();

/*
 * @forgerock/javascript-sdk
 *
 * enums.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Types of steps returned by the authentication tree.
 */
var StepType;
(function (StepType) {
  StepType['LoginFailure'] = 'LoginFailure';
  StepType['LoginSuccess'] = 'LoginSuccess';
  StepType['Step'] = 'Step';
})(StepType || (StepType = {}));

/*
 * @forgerock/javascript-sdk
 *
 * fr-login-failure.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var FRLoginFailure = /** @class */ (function () {
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function FRLoginFailure(payload) {
    this.payload = payload;
    /**
     * The type of step.
     */
    this.type = StepType.LoginFailure;
  }
  /**
   * Gets the error code.
   */
  FRLoginFailure.prototype.getCode = function () {
    return Number(this.payload.code);
  };
  /**
   * Gets the failure details.
   */
  FRLoginFailure.prototype.getDetail = function () {
    return this.payload.detail;
  };
  /**
   * Gets the failure message.
   */
  FRLoginFailure.prototype.getMessage = function () {
    return this.payload.message;
  };
  /**
   * Gets processed failure message.
   */
  FRLoginFailure.prototype.getProcessedMessage = function (messageCreator) {
    return FRPolicy.parseErrors(this.payload, messageCreator);
  };
  /**
   * Gets the failure reason.
   */
  FRLoginFailure.prototype.getReason = function () {
    return this.payload.reason;
  };
  return FRLoginFailure;
})();

/*
 * @forgerock/javascript-sdk
 *
 * fr-login-success.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var FRLoginSuccess = /** @class */ (function () {
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function FRLoginSuccess(payload) {
    this.payload = payload;
    /**
     * The type of step.
     */
    this.type = StepType.LoginSuccess;
  }
  /**
   * Gets the step's realm.
   */
  FRLoginSuccess.prototype.getRealm = function () {
    return this.payload.realm;
  };
  /**
   * Gets the step's session token.
   */
  FRLoginSuccess.prototype.getSessionToken = function () {
    return this.payload.tokenId;
  };
  /**
   * Gets the step's success URL.
   */
  FRLoginSuccess.prototype.getSuccessUrl = function () {
    return this.payload.successUrl;
  };
  return FRLoginSuccess;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Base class for authentication tree callback wrappers.
 */
var FRCallback = /** @class */ (function () {
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function FRCallback(payload) {
    this.payload = payload;
  }
  /**
   * Gets the name of this callback type.
   */
  FRCallback.prototype.getType = function () {
    return this.payload.type;
  };
  /**
   * Gets the value of the specified input element, or the first element if `selector` is not
   * provided.
   *
   * @param selector The index position or name of the desired element
   */
  FRCallback.prototype.getInputValue = function (selector) {
    if (selector === void 0) {
      selector = 0;
    }
    return this.getArrayElement(this.payload.input, selector).value;
  };
  /**
   * Sets the value of the specified input element, or the first element if `selector` is not
   * provided.
   *
   * @param selector The index position or name of the desired element
   */
  FRCallback.prototype.setInputValue = function (value, selector) {
    if (selector === void 0) {
      selector = 0;
    }
    this.getArrayElement(this.payload.input, selector).value = value;
  };
  /**
   * Gets the value of the specified output element, or the first element if `selector`
   * is not provided.
   *
   * @param selector The index position or name of the desired element
   */
  FRCallback.prototype.getOutputValue = function (selector) {
    if (selector === void 0) {
      selector = 0;
    }
    return this.getArrayElement(this.payload.output, selector).value;
  };
  /**
   * Gets the value of the first output element with the specified name or the
   * specified default value.
   *
   * @param name The name of the desired element
   */
  FRCallback.prototype.getOutputByName = function (name, defaultValue) {
    var output = this.payload.output.find(function (x) {
      return x.name === name;
    });
    return output ? output.value : defaultValue;
  };
  FRCallback.prototype.getArrayElement = function (array, selector) {
    if (selector === void 0) {
      selector = 0;
    }
    if (array === undefined) {
      throw new Error('No NameValue array was provided to search (selector '.concat(selector, ')'));
    }
    if (typeof selector === 'number') {
      if (selector < 0 || selector > array.length - 1) {
        throw new Error('Selector index '.concat(selector, ' is out of range'));
      }
      return array[selector];
    }
    if (typeof selector === 'string') {
      var input = array.find(function (x) {
        return x.name === selector;
      });
      if (!input) {
        throw new Error('Missing callback input entry "'.concat(selector, '"'));
      }
      return input;
    }
    // Duck typing for RegEx
    if (typeof selector === 'object' && selector.test && selector.exec) {
      var input = array.find(function (x) {
        return selector.test(x.name);
      });
      if (!input) {
        throw new Error('Missing callback input entry "'.concat(selector, '"'));
      }
      return input;
    }
    throw new Error('Invalid selector value type');
  };
  return FRCallback;
})();

/*
 * @forgerock/javascript-sdk
 *
 * attribute-input-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$k =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect attributes.
 *
 * @typeparam T Maps to StringAttributeInputCallback, NumberAttributeInputCallback and
 *     BooleanAttributeInputCallback, respectively
 */
var AttributeInputCallback = /** @class */ (function (_super) {
  __extends$k(AttributeInputCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function AttributeInputCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the attribute name.
   */
  AttributeInputCallback.prototype.getName = function () {
    return this.getOutputByName('name', '');
  };
  /**
   * Gets the attribute prompt.
   */
  AttributeInputCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Gets whether the attribute is required.
   */
  AttributeInputCallback.prototype.isRequired = function () {
    return this.getOutputByName('required', false);
  };
  /**
   * Gets the callback's failed policies.
   */
  AttributeInputCallback.prototype.getFailedPolicies = function () {
    return this.getOutputByName('failedPolicies', []);
  };
  /**
   * Gets the callback's applicable policies.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AttributeInputCallback.prototype.getPolicies = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getOutputByName('policies', {});
  };
  /**
   * Set if validating value only.
   */
  AttributeInputCallback.prototype.setValidateOnly = function (value) {
    this.setInputValue(value, /validateOnly/);
  };
  /**
   * Sets the attribute's value.
   */
  AttributeInputCallback.prototype.setValue = function (value) {
    this.setInputValue(value);
  };
  return AttributeInputCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * choice-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$j =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect an answer to a choice.
 */
var ChoiceCallback = /** @class */ (function (_super) {
  __extends$j(ChoiceCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function ChoiceCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the choice's prompt.
   */
  ChoiceCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Gets the choice's default answer.
   */
  ChoiceCallback.prototype.getDefaultChoice = function () {
    return this.getOutputByName('defaultChoice', 0);
  };
  /**
   * Gets the choice's possible answers.
   */
  ChoiceCallback.prototype.getChoices = function () {
    return this.getOutputByName('choices', []);
  };
  /**
   * Sets the choice's answer by index position.
   */
  ChoiceCallback.prototype.setChoiceIndex = function (index) {
    var length = this.getChoices().length;
    if (index < 0 || index > length - 1) {
      throw new Error(''.concat(index, ' is out of bounds'));
    }
    this.setInputValue(index);
  };
  /**
   * Sets the choice's answer by value.
   */
  ChoiceCallback.prototype.setChoiceValue = function (value) {
    var index = this.getChoices().indexOf(value);
    if (index === -1) {
      throw new Error('"'.concat(value, '" is not a valid choice'));
    }
    this.setInputValue(index);
  };
  return ChoiceCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * confirmation-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$i =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect a confirmation to a message.
 */
var ConfirmationCallback = /** @class */ (function (_super) {
  __extends$i(ConfirmationCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function ConfirmationCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the index position of the confirmation's default answer.
   */
  ConfirmationCallback.prototype.getDefaultOption = function () {
    return Number(this.getOutputByName('defaultOption', 0));
  };
  /**
   * Gets the confirmation's message type.
   */
  ConfirmationCallback.prototype.getMessageType = function () {
    return Number(this.getOutputByName('messageType', 0));
  };
  /**
   * Gets the confirmation's possible answers.
   */
  ConfirmationCallback.prototype.getOptions = function () {
    return this.getOutputByName('options', []);
  };
  /**
   * Gets the confirmation's option type.
   */
  ConfirmationCallback.prototype.getOptionType = function () {
    return Number(this.getOutputByName('optionType', 0));
  };
  /**
   * Gets the confirmation's prompt.
   */
  ConfirmationCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Set option index.
   */
  ConfirmationCallback.prototype.setOptionIndex = function (index) {
    if (index !== 0 && index !== 1) {
      throw new Error('"'.concat(index, '" is not a valid choice'));
    }
    this.setInputValue(index);
  };
  /**
   * Set option value.
   */
  ConfirmationCallback.prototype.setOptionValue = function (value) {
    var index = this.getOptions().indexOf(value);
    if (index === -1) {
      throw new Error('"'.concat(value, '" is not a valid choice'));
    }
    this.setInputValue(index);
  };
  return ConfirmationCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * device-profile-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$h =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect device profile data.
 */
var DeviceProfileCallback = /** @class */ (function (_super) {
  __extends$h(DeviceProfileCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function DeviceProfileCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's data.
   */
  DeviceProfileCallback.prototype.getMessage = function () {
    return this.getOutputByName('message', '');
  };
  /**
   * Does callback require metadata?
   */
  DeviceProfileCallback.prototype.isMetadataRequired = function () {
    return this.getOutputByName('metadata', false);
  };
  /**
   * Does callback require location data?
   */
  DeviceProfileCallback.prototype.isLocationRequired = function () {
    return this.getOutputByName('location', false);
  };
  /**
   * Sets the profile.
   */
  DeviceProfileCallback.prototype.setProfile = function (profile) {
    this.setInputValue(JSON.stringify(profile));
  };
  return DeviceProfileCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * hidden-value-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$g =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect information indirectly from the user.
 */
var HiddenValueCallback = /** @class */ (function (_super) {
  __extends$g(HiddenValueCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function HiddenValueCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  return HiddenValueCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * kba-create-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$f =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect KBA-style security questions and answers.
 */
var KbaCreateCallback = /** @class */ (function (_super) {
  __extends$f(KbaCreateCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function KbaCreateCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback prompt.
   */
  KbaCreateCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Gets the callback's list of pre-defined security questions.
   */
  KbaCreateCallback.prototype.getPredefinedQuestions = function () {
    return this.getOutputByName('predefinedQuestions', []);
  };
  /**
   * Sets the callback's security question.
   */
  KbaCreateCallback.prototype.setQuestion = function (question) {
    this.setValue('question', question);
  };
  /**
   * Sets the callback's security question answer.
   */
  KbaCreateCallback.prototype.setAnswer = function (answer) {
    this.setValue('answer', answer);
  };
  KbaCreateCallback.prototype.setValue = function (type, value) {
    if (!this.payload.input) {
      throw new Error('KBA payload is missing input');
    }
    var input = this.payload.input.find(function (x) {
      return x.name.endsWith(type);
    });
    if (!input) {
      throw new Error('No input has name ending in "'.concat(type, '"'));
    }
    input.value = value;
  };
  return KbaCreateCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * metadata-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$e =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to deliver and collect miscellaneous data.
 */
var MetadataCallback = /** @class */ (function (_super) {
  __extends$e(MetadataCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function MetadataCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's data.
   */
  MetadataCallback.prototype.getData = function () {
    return this.getOutputByName('data', {});
  };
  return MetadataCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * name-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$d =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect a username.
 */
var NameCallback = /** @class */ (function (_super) {
  __extends$d(NameCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function NameCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's prompt.
   */
  NameCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Sets the username.
   */
  NameCallback.prototype.setName = function (name) {
    this.setInputValue(name);
  };
  return NameCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * password-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$c =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect a password.
 */
var PasswordCallback = /** @class */ (function (_super) {
  __extends$c(PasswordCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function PasswordCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's failed policies.
   */
  PasswordCallback.prototype.getFailedPolicies = function () {
    return this.getOutputByName('failedPolicies', []);
  };
  /**
   * Gets the callback's applicable policies.
   */
  PasswordCallback.prototype.getPolicies = function () {
    return this.getOutputByName('policies', []);
  };
  /**
   * Gets the callback's prompt.
   */
  PasswordCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Sets the password.
   */
  PasswordCallback.prototype.setPassword = function (password) {
    this.setInputValue(password);
  };
  return PasswordCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * polling-wait-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$b =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to instruct the system to poll while a backend process completes.
 */
var PollingWaitCallback = /** @class */ (function (_super) {
  __extends$b(PollingWaitCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function PollingWaitCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the message to display while polling.
   */
  PollingWaitCallback.prototype.getMessage = function () {
    return this.getOutputByName('message', '');
  };
  /**
   * Gets the polling interval in milliseconds.
   */
  PollingWaitCallback.prototype.getWaitTime = function () {
    return Number(this.getOutputByName('waitTime', 0));
  };
  return PollingWaitCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * recaptcha-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$a =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to integrate reCAPTCHA.
 */
var ReCaptchaCallback = /** @class */ (function (_super) {
  __extends$a(ReCaptchaCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function ReCaptchaCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the reCAPTCHA site key.
   */
  ReCaptchaCallback.prototype.getSiteKey = function () {
    return this.getOutputByName('recaptchaSiteKey', '');
  };
  /**
   * Sets the reCAPTCHA result.
   */
  ReCaptchaCallback.prototype.setResult = function (result) {
    this.setInputValue(result);
  };
  return ReCaptchaCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * redirect-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$9 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect an answer to a choice.
 */
var RedirectCallback = /** @class */ (function (_super) {
  __extends$9(RedirectCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function RedirectCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the redirect URL.
   */
  RedirectCallback.prototype.getRedirectUrl = function () {
    return this.getOutputByName('redirectUrl', '');
  };
  return RedirectCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * select-idp-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$8 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect an answer to a choice.
 */
var SelectIdPCallback = /** @class */ (function (_super) {
  __extends$8(SelectIdPCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function SelectIdPCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the available providers.
   */
  SelectIdPCallback.prototype.getProviders = function () {
    return this.getOutputByName('providers', []);
  };
  /**
   * Sets the provider by name.
   */
  SelectIdPCallback.prototype.setProvider = function (value) {
    var item = this.getProviders().find(function (item) {
      return item.provider === value;
    });
    if (!item) {
      throw new Error('"'.concat(value, '" is not a valid choice'));
    }
    this.setInputValue(item.provider);
  };
  return SelectIdPCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * text-output-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$7 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to display a message.
 */
var TextOutputCallback = /** @class */ (function (_super) {
  __extends$7(TextOutputCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function TextOutputCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the message content.
   */
  TextOutputCallback.prototype.getMessage = function () {
    return this.getOutputByName('message', '');
  };
  /**
   * Gets the message type.
   */
  TextOutputCallback.prototype.getMessageType = function () {
    return this.getOutputByName('messageType', '');
  };
  return TextOutputCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * suspended-text-output-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$6 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to display a message.
 */
var SuspendedTextOutputCallback = /** @class */ (function (_super) {
  __extends$6(SuspendedTextOutputCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function SuspendedTextOutputCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  return SuspendedTextOutputCallback;
})(TextOutputCallback);

/*
 * @forgerock/javascript-sdk
 *
 * terms-and-conditions-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$5 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect acceptance of terms and conditions.
 */
var TermsAndConditionsCallback = /** @class */ (function (_super) {
  __extends$5(TermsAndConditionsCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function TermsAndConditionsCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the terms and conditions content.
   */
  TermsAndConditionsCallback.prototype.getTerms = function () {
    return this.getOutputByName('terms', '');
  };
  /**
   * Gets the version of the terms and conditions.
   */
  TermsAndConditionsCallback.prototype.getVersion = function () {
    return this.getOutputByName('version', '');
  };
  /**
   * Gets the date of the terms and conditions.
   */
  TermsAndConditionsCallback.prototype.getCreateDate = function () {
    var date = this.getOutputByName('createDate', '');
    return new Date(date);
  };
  /**
   * Sets the callback's acceptance.
   */
  TermsAndConditionsCallback.prototype.setAccepted = function (accepted) {
    if (accepted === void 0) {
      accepted = true;
    }
    this.setInputValue(accepted);
  };
  return TermsAndConditionsCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * text-input-callback.ts
 *
 * Copyright (c) 2022 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$4 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to retrieve input from the user.
 */
var TextInputCallback = /** @class */ (function (_super) {
  __extends$4(TextInputCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function TextInputCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's prompt.
   */
  TextInputCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Sets the callback's input value.
   */
  TextInputCallback.prototype.setInput = function (input) {
    this.setInputValue(input);
  };
  return TextInputCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * validated-create-password-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$3 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect a valid platform password.
 */
var ValidatedCreatePasswordCallback = /** @class */ (function (_super) {
  __extends$3(ValidatedCreatePasswordCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function ValidatedCreatePasswordCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's failed policies.
   */
  ValidatedCreatePasswordCallback.prototype.getFailedPolicies = function () {
    return this.getOutputByName('failedPolicies', []);
  };
  /**
   * Gets the callback's applicable policies.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValidatedCreatePasswordCallback.prototype.getPolicies = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getOutputByName('policies', {});
  };
  /**
   * Gets the callback's prompt.
   */
  ValidatedCreatePasswordCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Gets whether the password is required.
   */
  ValidatedCreatePasswordCallback.prototype.isRequired = function () {
    return this.getOutputByName('required', false);
  };
  /**
   * Sets the callback's password.
   */
  ValidatedCreatePasswordCallback.prototype.setPassword = function (password) {
    this.setInputValue(password);
  };
  /**
   * Set if validating value only.
   */
  ValidatedCreatePasswordCallback.prototype.setValidateOnly = function (value) {
    this.setInputValue(value, /validateOnly/);
  };
  return ValidatedCreatePasswordCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * validated-create-username-callback.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$2 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
/**
 * Represents a callback used to collect a valid platform username.
 */
var ValidatedCreateUsernameCallback = /** @class */ (function (_super) {
  __extends$2(ValidatedCreateUsernameCallback, _super);
  /**
   * @param payload The raw payload returned by OpenAM
   */
  function ValidatedCreateUsernameCallback(payload) {
    var _this = _super.call(this, payload) || this;
    _this.payload = payload;
    return _this;
  }
  /**
   * Gets the callback's prompt.
   */
  ValidatedCreateUsernameCallback.prototype.getPrompt = function () {
    return this.getOutputByName('prompt', '');
  };
  /**
   * Gets the callback's failed policies.
   */
  ValidatedCreateUsernameCallback.prototype.getFailedPolicies = function () {
    return this.getOutputByName('failedPolicies', []);
  };
  /**
   * Gets the callback's applicable policies.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ValidatedCreateUsernameCallback.prototype.getPolicies = function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.getOutputByName('policies', {});
  };
  /**
   * Gets whether the username is required.
   */
  ValidatedCreateUsernameCallback.prototype.isRequired = function () {
    return this.getOutputByName('required', false);
  };
  /**
   * Sets the callback's username.
   */
  ValidatedCreateUsernameCallback.prototype.setName = function (name) {
    this.setInputValue(name);
  };
  /**
   * Set if validating value only.
   */
  ValidatedCreateUsernameCallback.prototype.setValidateOnly = function (value) {
    this.setInputValue(value, /validateOnly/);
  };
  return ValidatedCreateUsernameCallback;
})(FRCallback);

/*
 * @forgerock/javascript-sdk
 *
 * factory.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @hidden
 */
function createCallback(callback) {
  switch (callback.type) {
    case CallbackType.BooleanAttributeInputCallback:
      return new AttributeInputCallback(callback);
    case CallbackType.ChoiceCallback:
      return new ChoiceCallback(callback);
    case CallbackType.ConfirmationCallback:
      return new ConfirmationCallback(callback);
    case CallbackType.DeviceProfileCallback:
      return new DeviceProfileCallback(callback);
    case CallbackType.HiddenValueCallback:
      return new HiddenValueCallback(callback);
    case CallbackType.KbaCreateCallback:
      return new KbaCreateCallback(callback);
    case CallbackType.MetadataCallback:
      return new MetadataCallback(callback);
    case CallbackType.NameCallback:
      return new NameCallback(callback);
    case CallbackType.NumberAttributeInputCallback:
      return new AttributeInputCallback(callback);
    case CallbackType.PasswordCallback:
      return new PasswordCallback(callback);
    case CallbackType.PollingWaitCallback:
      return new PollingWaitCallback(callback);
    case CallbackType.ReCaptchaCallback:
      return new ReCaptchaCallback(callback);
    case CallbackType.RedirectCallback:
      return new RedirectCallback(callback);
    case CallbackType.SelectIdPCallback:
      return new SelectIdPCallback(callback);
    case CallbackType.StringAttributeInputCallback:
      return new AttributeInputCallback(callback);
    case CallbackType.SuspendedTextOutputCallback:
      return new SuspendedTextOutputCallback(callback);
    case CallbackType.TermsAndConditionsCallback:
      return new TermsAndConditionsCallback(callback);
    case CallbackType.TextInputCallback:
      return new TextInputCallback(callback);
    case CallbackType.TextOutputCallback:
      return new TextOutputCallback(callback);
    case CallbackType.ValidatedCreatePasswordCallback:
      return new ValidatedCreatePasswordCallback(callback);
    case CallbackType.ValidatedCreateUsernameCallback:
      return new ValidatedCreateUsernameCallback(callback);
    default:
      return new FRCallback(callback);
  }
}

/*
 * @forgerock/javascript-sdk
 *
 * fr-step.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Represents a single step of an authentication tree.
 */
var FRStep = /** @class */ (function () {
  /**
   * @param payload The raw payload returned by OpenAM
   * @param callbackFactory A function that returns am implementation of FRCallback
   */
  function FRStep(payload, callbackFactory) {
    this.payload = payload;
    /**
     * The type of step.
     */
    this.type = StepType.Step;
    /**
     * The callbacks contained in this step.
     */
    this.callbacks = [];
    if (payload.callbacks) {
      this.callbacks = this.convertCallbacks(payload.callbacks, callbackFactory);
    }
  }
  /**
   * Gets the first callback of the specified type in this step.
   *
   * @param type The type of callback to find.
   */
  FRStep.prototype.getCallbackOfType = function (type) {
    var callbacks = this.getCallbacksOfType(type);
    if (callbacks.length !== 1) {
      throw new Error(
        'Expected 1 callback of type "'.concat(type, '", but found ').concat(callbacks.length),
      );
    }
    return callbacks[0];
  };
  /**
   * Gets all callbacks of the specified type in this step.
   *
   * @param type The type of callback to find.
   */
  FRStep.prototype.getCallbacksOfType = function (type) {
    return this.callbacks.filter(function (x) {
      return x.getType() === type;
    });
  };
  /**
   * Sets the value of the first callback of the specified type in this step.
   *
   * @param type The type of callback to find.
   * @param value The value to set for the callback.
   */
  FRStep.prototype.setCallbackValue = function (type, value) {
    var callbacks = this.getCallbacksOfType(type);
    if (callbacks.length !== 1) {
      throw new Error(
        'Expected 1 callback of type "'.concat(type, '", but found ').concat(callbacks.length),
      );
    }
    callbacks[0].setInputValue(value);
  };
  /**
   * Gets the step's description.
   */
  FRStep.prototype.getDescription = function () {
    return this.payload.description;
  };
  /**
   * Gets the step's header.
   */
  FRStep.prototype.getHeader = function () {
    return this.payload.header;
  };
  /**
   * Gets the step's stage.
   */
  FRStep.prototype.getStage = function () {
    return this.payload.stage;
  };
  FRStep.prototype.convertCallbacks = function (callbacks, callbackFactory) {
    var converted = callbacks.map(function (x) {
      // This gives preference to the provided factory and falls back to our default implementation
      return (callbackFactory || createCallback)(x) || createCallback(x);
    });
    return converted;
  };
  return FRStep;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$5 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$5 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$5.apply(this, arguments);
  };
var __awaiter$c =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$c =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides access to the OpenAM authentication tree API.
 */
var FRAuth = /** @class */ (function () {
  function FRAuth() {}
  /**
   * Requests the next step in the authentication tree.
   *
   * Call `FRAuth.next()` recursively.  At each step, check for session token or error, otherwise
   * populate the step's callbacks and call `next()` again.
   *
   * Example:
   *
   * ```js
   * async function nextStep(previousStep) {
   *   const thisStep = await FRAuth.next(previousStep);
   *
   *   switch (thisStep.type) {
   *     case StepType.LoginSuccess:
   *       const token = thisStep.getSessionToken();
   *       break;
   *     case StepType.LoginFailure:
   *       const detail = thisStep.getDetail();
   *       break;
   *     case StepType.Step:
   *       // Populate `thisStep` callbacks here, and then continue
   *       thisStep.setInputValue('foo');
   *       nextStep(thisStep);
   *       break;
   *   }
   * }
   * ```
   *
   * @param previousStep The previous step with its callback values populated
   * @param options Configuration overrides
   * @return The next step in the authentication tree
   */
  FRAuth.next = function (previousStep, options) {
    return __awaiter$c(this, void 0, void 0, function () {
      var nextPayload, callbackFactory;
      return __generator$c(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              Auth.next(previousStep ? previousStep.payload : undefined, options),
            ];
          case 1:
            nextPayload = _a.sent();
            if (nextPayload.authId) {
              callbackFactory = options ? options.callbackFactory : undefined;
              return [2 /*return*/, new FRStep(nextPayload, callbackFactory)];
            }
            if (!nextPayload.authId && nextPayload.ok) {
              // If there's no authId, and the response is OK, tree is complete
              return [2 /*return*/, new FRLoginSuccess(nextPayload)];
            }
            // If there's no authId, and the response is not OK, tree has failure
            return [2 /*return*/, new FRLoginFailure(nextPayload)];
        }
      });
    });
  };
  /**
   * Redirects to the URL identified in the RedirectCallback and saves the full
   * step information to localStorage for retrieval when user returns from login.
   *
   * Example:
   * ```js
   * forgerock.FRAuth.redirect(step);
   * ```
   */
  FRAuth.redirect = function (step) {
    var cb = step.getCallbackOfType(CallbackType.RedirectCallback);
    var redirectUrl = cb.getRedirectUrl();
    window.localStorage.setItem(this.previousStepKey, JSON.stringify(step));
    window.location.assign(redirectUrl);
  };
  /**
   * Resumes a tree after returning from an external client or provider.
   * Requires the full URL of the current window. It will parse URL for
   * key-value pairs as well as, if required, retrieves previous step.
   *
   * Example;
   * ```js
   * forgerock.FRAuth.resume(window.location.href)
   * ```
   */
  FRAuth.resume = function (url, options) {
    var _a, _b, _c;
    return __awaiter$c(this, void 0, void 0, function () {
      function requiresPreviousStep() {
        return (code && state) || form_post_entry || responsekey;
      }
      var parsedUrl,
        code,
        error,
        errorCode,
        errorMessage,
        form_post_entry,
        nonce,
        RelayState,
        responsekey,
        scope,
        state,
        suspendedId,
        authIndexValue,
        previousStep,
        redirectStepString,
        nextOptions;
      return __generator$c(this, function (_d) {
        switch (_d.label) {
          case 0:
            parsedUrl = new URL(url);
            code = parsedUrl.searchParams.get('code');
            error = parsedUrl.searchParams.get('error');
            errorCode = parsedUrl.searchParams.get('errorCode');
            errorMessage = parsedUrl.searchParams.get('errorMessage');
            form_post_entry = parsedUrl.searchParams.get('form_post_entry');
            nonce = parsedUrl.searchParams.get('nonce');
            RelayState = parsedUrl.searchParams.get('RelayState');
            responsekey = parsedUrl.searchParams.get('responsekey');
            scope = parsedUrl.searchParams.get('scope');
            state = parsedUrl.searchParams.get('state');
            suspendedId = parsedUrl.searchParams.get('suspendedId');
            authIndexValue =
              (_a = parsedUrl.searchParams.get('authIndexValue')) !== null && _a !== void 0
                ? _a
                : undefined;
            /**
             * If we are returning back from a provider, the previous redirect step data is required.
             * Retrieve the previous step from localStorage, and then delete it to remove stale data.
             * If suspendedId is present, no previous step data is needed, so skip below conditional.
             */
            if (requiresPreviousStep()) {
              redirectStepString = window.localStorage.getItem(this.previousStepKey);
              if (!redirectStepString) {
                throw new Error('Error: could not retrieve original redirect information.');
              }
              try {
                previousStep = JSON.parse(redirectStepString);
              } catch (err) {
                throw new Error('Error: could not parse redirect params or step information');
              }
              window.localStorage.removeItem(this.previousStepKey);
            }
            nextOptions = __assign$5(
              __assign$5(__assign$5({}, options), {
                query: __assign$5(
                  __assign$5(
                    __assign$5(
                      __assign$5(
                        __assign$5(
                          __assign$5(
                            __assign$5(
                              __assign$5(
                                __assign$5(
                                  __assign$5(
                                    __assign$5(
                                      __assign$5({}, code && { code: code }),
                                      error && { error: error },
                                    ),
                                    errorCode && { errorCode: errorCode },
                                  ),
                                  errorMessage && { errorMessage: errorMessage },
                                ),
                                form_post_entry && { form_post_entry: form_post_entry },
                              ),
                              nonce && { nonce: nonce },
                            ),
                            RelayState && { RelayState: RelayState },
                          ),
                          responsekey && { responsekey: responsekey },
                        ),
                        scope && { scope: scope },
                      ),
                      state && { state: state },
                    ),
                    suspendedId && { suspendedId: suspendedId },
                  ),
                  options && options.query,
                ),
              }),
              ((_b = options === null || options === void 0 ? void 0 : options.tree) !== null &&
              _b !== void 0
                ? _b
                : authIndexValue) && {
                tree:
                  (_c = options === null || options === void 0 ? void 0 : options.tree) !== null &&
                  _c !== void 0
                    ? _c
                    : authIndexValue,
              },
            );
            return [4 /*yield*/, this.next(previousStep, nextOptions)];
          case 1:
            return [2 /*return*/, _d.sent()];
        }
      });
    });
  };
  /**
   * Requests the first step in the authentication tree.
   * This is essentially an alias to calling FRAuth.next without a previous step.
   *
   * @param options Configuration overrides
   * @return The next step in the authentication tree
   */
  FRAuth.start = function (options) {
    return __awaiter$c(this, void 0, void 0, function () {
      return __generator$c(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, FRAuth.next(undefined, options)];
          case 1:
            return [2 /*return*/, _a.sent()];
        }
      });
    });
  };
  FRAuth.previousStepKey = 'FRAuth_PreviousStep';
  return FRAuth;
})();

/*
 * @forgerock/javascript-sdk
 *
 * defaults.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var browserProps = [
  'userAgent',
  'appName',
  'appCodeName',
  'appVersion',
  'appMinorVersion',
  'buildID',
  'product',
  'productSub',
  'vendor',
  'vendorSub',
  'browserLanguage',
];
var configurableCategories = [
  'fontNames',
  'displayProps',
  'browserProps',
  'hardwareProps',
  'platformProps',
];
var delay = 30 * 1000;
var devicePlatforms = {
  mac: ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
  windows: ['Win32', 'Win64', 'Windows', 'WinCE'],
  ios: ['iPhone', 'iPad', 'iPod'],
};
var displayProps = ['width', 'height', 'pixelDepth', 'orientation.angle'];
var fontNames = [
  'cursive',
  'monospace',
  'serif',
  'sans-serif',
  'fantasy',
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Arial Rounded MT Bold',
  'Bookman Old Style',
  'Bradley Hand ITC',
  'Century',
  'Century Gothic',
  'Comic Sans MS',
  'Courier',
  'Courier New',
  'Georgia',
  'Gentium',
  'Impact',
  'King',
  'Lucida Console',
  'Lalit',
  'Modena',
  'Monotype Corsiva',
  'Papyrus',
  'Tahoma',
  'TeX',
  'Times',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
  'Verona',
];
var hardwareProps = ['cpuClass', 'deviceMemory', 'hardwareConcurrency', 'maxTouchPoints', 'oscpu'];
var platformProps = ['language', 'platform', 'userLanguage', 'systemLanguage'];

/*
 * @forgerock/javascript-sdk
 *
 * collector.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @class Collector - base class for FRDevice
 * Generic collector functions for collecting a device profile attributes
 */
var Collector = /** @class */ (function () {
  function Collector() {}
  /**
   * @method reduceToObject - goes one to two levels into source to collect attribute
   * @param props - array of strings; can use dot notation for two level lookup
   * @param src - source of attributes to check
   */
  // eslint-disable-next-line
  Collector.prototype.reduceToObject = function (props, src) {
    return props.reduce(function (prev, curr) {
      if (curr.includes('.')) {
        var propArr = curr.split('.');
        var prop1 = propArr[0];
        var prop2 = propArr[1];
        var prop = src[prop1] && src[prop1][prop2];
        prev[prop2] = prop != undefined ? prop : '';
      } else {
        prev[curr] = src[curr] != undefined ? src[curr] : null;
      }
      return prev;
    }, {});
  };
  /**
   * @method reduceToString - goes one level into source to collect attribute
   * @param props - array of strings
   * @param src - source of attributes to check
   */
  // eslint-disable-next-line
  Collector.prototype.reduceToString = function (props, src) {
    return props.reduce(function (prev, curr) {
      prev = ''.concat(prev).concat(src[curr].filename, ';');
      return prev;
    }, '');
  };
  return Collector;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends$1 =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
var __assign$4 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$4 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$4.apply(this, arguments);
  };
var __awaiter$b =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$b =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * @class FRDevice - Collects user device metadata
 *
 * Example:
 *
 * ```js
 * // Instantiate new device object (w/optional config, if needed)
 * const device = new forgerock.FRDevice(
 *   // optional configuration
 * );
 * // override any instance methods, if needed
 * // e.g.: device.getDisplayMeta = () => {};
 *
 * // Call getProfile with required argument obj of boolean properties
 * // of location and metadata
 * const profile = await device.getProfile({
 *   location: isLocationRequired,
 *   metadata: isMetadataRequired,
 * });
 * ```
 */
/** @class */ (function (_super) {
  __extends$1(FRDevice, _super);
  function FRDevice(config) {
    var _this = _super.call(this) || this;
    _this.config = {
      fontNames: fontNames,
      devicePlatforms: devicePlatforms,
      displayProps: displayProps,
      browserProps: browserProps,
      hardwareProps: hardwareProps,
      platformProps: platformProps,
    };
    if (config) {
      Object.keys(config).forEach(function (key) {
        if (!configurableCategories.includes(key)) {
          throw new Error('Device profile configuration category does not exist.');
        }
        _this.config[key] = config[key];
      });
    }
    return _this;
  }
  FRDevice.prototype.getBrowserMeta = function () {
    if (typeof navigator === 'undefined') {
      console.warn('Cannot collect browser metadata. navigator is not defined.');
      return {};
    }
    return this.reduceToObject(this.config.browserProps, navigator);
  };
  FRDevice.prototype.getBrowserPluginsNames = function () {
    if (!(typeof navigator !== 'undefined' && navigator.plugins)) {
      console.warn('Cannot collect browser plugin information. navigator.plugins is not defined.');
      return '';
    }
    return this.reduceToString(Object.keys(navigator.plugins), navigator.plugins);
  };
  FRDevice.prototype.getDeviceName = function () {
    if (typeof navigator === 'undefined') {
      console.warn('Cannot collect device name. navigator is not defined.');
      return '';
    }
    var userAgent = navigator.userAgent;
    var platform = navigator.platform;
    switch (true) {
      case this.config.devicePlatforms.mac.includes(platform):
        return 'Mac (Browser)';
      case this.config.devicePlatforms.ios.includes(platform):
        return ''.concat(platform, ' (Browser)');
      case this.config.devicePlatforms.windows.includes(platform):
        return 'Windows (Browser)';
      case /Android/.test(platform) || /Android/.test(userAgent):
        return 'Android (Browser)';
      case /CrOS/.test(userAgent) || /Chromebook/.test(userAgent):
        return 'Chrome OS (Browser)';
      case /Linux/.test(platform):
        return 'Linux (Browser)';
      default:
        return ''.concat(platform || 'Unknown', ' (Browser)');
    }
  };
  FRDevice.prototype.getDisplayMeta = function () {
    if (typeof screen === 'undefined') {
      console.warn('Cannot collect screen information. screen is not defined.');
      return {};
    }
    return this.reduceToObject(this.config.displayProps, screen);
  };
  FRDevice.prototype.getHardwareMeta = function () {
    if (typeof navigator === 'undefined') {
      console.warn('Cannot collect OS metadata. Navigator is not defined.');
      return {};
    }
    return this.reduceToObject(this.config.hardwareProps, navigator);
  };
  FRDevice.prototype.getIdentifier = function () {
    if (!(typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues)) {
      console.warn('Cannot generate profile ID. Crypto and/or getRandomValues is not supported.');
      return '';
    }
    if (!localStorage) {
      console.warn('Cannot store profile ID. localStorage is not supported.');
      return '';
    }
    var id = localStorage.getItem('profile-id');
    if (!id) {
      // generate ID, 3 sections of random numbers: "714524572-2799534390-3707617532"
      id = globalThis.crypto.getRandomValues(new Uint32Array(3)).join('-');
      localStorage.setItem('profile-id', id);
    }
    return id;
  };
  FRDevice.prototype.getInstalledFonts = function () {
    if (typeof document === undefined) {
      console.warn('Cannot collect font data. Global document object is undefined.');
      return '';
    }
    var canvas = document.createElement('canvas');
    if (!canvas) {
      console.warn('Cannot collect font data. Browser does not support canvas element');
      return '';
    }
    var context = canvas.getContext && canvas.getContext('2d');
    if (!context) {
      console.warn('Cannot collect font data. Browser does not support 2d canvas context');
      return '';
    }
    var text = 'abcdefghi0123456789';
    context.font = '72px Comic Sans';
    var baseWidth = context.measureText(text).width;
    var installedFonts = this.config.fontNames.reduce(function (prev, curr) {
      context.font = '72px '.concat(curr, ', Comic Sans');
      var newWidth = context.measureText(text).width;
      if (newWidth !== baseWidth) {
        prev = ''.concat(prev).concat(curr, ';');
      }
      return prev;
    }, '');
    return installedFonts;
  };
  FRDevice.prototype.getLocationCoordinates = function () {
    return __awaiter$b(this, void 0, void 0, function () {
      var _this = this;
      return __generator$b(this, function (_a) {
        if (!(typeof navigator !== 'undefined' && navigator.geolocation)) {
          console.warn(
            'Cannot collect geolocation information. navigator.geolocation is not defined.',
          );
          return [2 /*return*/, Promise.resolve({})];
        }
        // eslint-disable-next-line no-async-promise-executor
        return [
          2 /*return*/,
          new Promise(function (resolve) {
            return __awaiter$b(_this, void 0, void 0, function () {
              return __generator$b(this, function (_a) {
                navigator.geolocation.getCurrentPosition(
                  function (position) {
                    return resolve({
                      latitude: position.coords.latitude,
                      longitude: position.coords.longitude,
                    });
                  },
                  function (error) {
                    console.warn(
                      'Cannot collect geolocation information. ' +
                        error.code +
                        ': ' +
                        error.message,
                    );
                    resolve({});
                  },
                  {
                    enableHighAccuracy: true,
                    timeout: delay,
                    maximumAge: 0,
                  },
                );
                return [2 /*return*/];
              });
            });
          }),
        ];
      });
    });
  };
  FRDevice.prototype.getOSMeta = function () {
    if (typeof navigator === 'undefined') {
      console.warn('Cannot collect OS metadata. navigator is not defined.');
      return {};
    }
    return this.reduceToObject(this.config.platformProps, navigator);
  };
  FRDevice.prototype.getProfile = function (_a) {
    var location = _a.location,
      metadata = _a.metadata;
    return __awaiter$b(this, void 0, void 0, function () {
      var profile, _b;
      return __generator$b(this, function (_c) {
        switch (_c.label) {
          case 0:
            profile = {
              identifier: this.getIdentifier(),
            };
            if (metadata) {
              profile.metadata = {
                hardware: __assign$4(__assign$4({}, this.getHardwareMeta()), {
                  display: this.getDisplayMeta(),
                }),
                browser: __assign$4(__assign$4({}, this.getBrowserMeta()), {
                  plugins: this.getBrowserPluginsNames(),
                }),
                platform: __assign$4(__assign$4({}, this.getOSMeta()), {
                  deviceName: this.getDeviceName(),
                  fonts: this.getInstalledFonts(),
                  timezone: this.getTimezoneOffset(),
                }),
              };
            }
            if (!location) return [3 /*break*/, 2];
            _b = profile;
            return [4 /*yield*/, this.getLocationCoordinates()];
          case 1:
            _b.location = _c.sent();
            _c.label = 2;
          case 2:
            return [2 /*return*/, profile];
        }
      });
    });
  };
  FRDevice.prototype.getTimezoneOffset = function () {
    try {
      return new Date().getTimezoneOffset();
    } catch (err) {
      console.warn('Cannot collect timezone information. getTimezoneOffset is not defined.');
      return null;
    }
  };
  return FRDevice;
})(Collector);

/*
 * @forgerock/javascript-sdk
 *
 * constants.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @module
 * @ignore
 * These are private constants for TokenStorage
 */
var DB_NAME = 'forgerock-sdk';
/** @hidden */
var TOKEN_KEY = 'tokens';

/*
 * @forgerock/javascript-sdk
 *
 * indexed-db.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$a =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$a =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides wrapper for tokens with IndexedDB.
 */
var IndexedDBWrapper = /** @class */ (function () {
  function IndexedDBWrapper() {}
  /**
   * Retrieve tokens.
   */
  IndexedDBWrapper.get = function (clientId) {
    return __awaiter$a(this, void 0, void 0, function () {
      return __generator$a(this, function (_a) {
        return [
          2 /*return*/,
          new Promise(function (resolve, reject) {
            var onError = function () {
              return reject();
            };
            var openReq = window.indexedDB.open(DB_NAME);
            openReq.onsuccess = function () {
              if (!openReq.result.objectStoreNames.contains(clientId)) {
                openReq.result.close();
                return reject('Client ID not found');
              }
              var getReq = openReq.result
                .transaction(clientId, 'readonly')
                .objectStore(clientId)
                .get(TOKEN_KEY);
              getReq.onsuccess = function (event) {
                if (!event || !event.target) {
                  throw new Error('Missing storage event target');
                }
                openReq.result.close();
                resolve(event.target.result);
              };
              getReq.onerror = onError;
            };
            openReq.onupgradeneeded = function () {
              openReq.result.close();
              reject('IndexedDB upgrade needed');
            };
            openReq.onerror = onError;
          }),
        ];
      });
    });
  };
  /**
   * Saves tokens.
   */
  IndexedDBWrapper.set = function (clientId, tokens) {
    return __awaiter$a(this, void 0, void 0, function () {
      return __generator$a(this, function (_a) {
        return [
          2 /*return*/,
          new Promise(function (resolve, reject) {
            var openReq = window.indexedDB.open(DB_NAME);
            var onSetSuccess = function () {
              openReq.result.close();
              resolve();
            };
            var onError = function () {
              return reject();
            };
            var onUpgradeNeeded = function () {
              openReq.result.createObjectStore(clientId);
            };
            var onOpenSuccess = function () {
              if (!openReq.result.objectStoreNames.contains(clientId)) {
                var version = openReq.result.version + 1;
                openReq.result.close();
                openReq = window.indexedDB.open(DB_NAME, version);
                openReq.onupgradeneeded = onUpgradeNeeded;
                openReq.onsuccess = onOpenSuccess;
                openReq.onerror = onError;
                return;
              }
              var txnReq = openReq.result.transaction(clientId, 'readwrite');
              txnReq.onerror = onError;
              var objectStore = txnReq.objectStore(clientId);
              var putReq = objectStore.put(tokens, TOKEN_KEY);
              putReq.onsuccess = onSetSuccess;
              putReq.onerror = onError;
            };
            openReq.onupgradeneeded = onUpgradeNeeded;
            openReq.onsuccess = onOpenSuccess;
            openReq.onerror = onError;
          }),
        ];
      });
    });
  };
  /**
   * Removes stored tokens.
   */
  IndexedDBWrapper.remove = function (clientId) {
    return __awaiter$a(this, void 0, void 0, function () {
      return __generator$a(this, function (_a) {
        return [
          2 /*return*/,
          new Promise(function (resolve, reject) {
            var onError = function () {
              return reject();
            };
            var openReq = window.indexedDB.open(DB_NAME);
            openReq.onsuccess = function () {
              if (!openReq.result.objectStoreNames.contains(clientId)) {
                return resolve();
              }
              var removeReq = openReq.result
                .transaction(clientId, 'readwrite')
                .objectStore(clientId)
                .delete(TOKEN_KEY);
              removeReq.onsuccess = function () {
                resolve();
              };
              removeReq.onerror = onError;
            };
            openReq.onerror = onError;
          }),
        ];
      });
    });
  };
  return IndexedDBWrapper;
})();

/*
 * @forgerock/javascript-sdk
 *
 * local-storage.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$9 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$9 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides wrapper for tokens with localStorage.
 */
var LocalStorageWrapper = /** @class */ (function () {
  function LocalStorageWrapper() {}
  /**
   * Retrieve tokens.
   */
  LocalStorageWrapper.get = function (clientId) {
    return __awaiter$9(this, void 0, void 0, function () {
      var tokenString;
      return __generator$9(this, function (_a) {
        tokenString = localStorage.getItem(''.concat(DB_NAME, '-').concat(clientId));
        try {
          return [2 /*return*/, Promise.resolve(JSON.parse(tokenString || ''))];
        } catch (err) {
          console.warn(
            'Could not parse token from localStorage. This could be due to accessing a removed token',
          );
          // Original behavior had an untyped return of undefined for no token
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return [2 /*return*/, undefined];
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Saves tokens.
   */
  LocalStorageWrapper.set = function (clientId, tokens) {
    return __awaiter$9(this, void 0, void 0, function () {
      var tokenString;
      return __generator$9(this, function (_a) {
        tokenString = JSON.stringify(tokens);
        localStorage.setItem(''.concat(DB_NAME, '-').concat(clientId), tokenString);
        return [2 /*return*/];
      });
    });
  };
  /**
   * Removes stored tokens.
   */
  LocalStorageWrapper.remove = function (clientId) {
    return __awaiter$9(this, void 0, void 0, function () {
      return __generator$9(this, function (_a) {
        localStorage.removeItem(''.concat(DB_NAME, '-').concat(clientId));
        return [2 /*return*/];
      });
    });
  };
  return LocalStorageWrapper;
})();

/*
 * @forgerock/javascript-sdk
 *
 * session-storage.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$8 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$8 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides wrapper for tokens with sessionStorage.
 */
var SessionStorageWrapper = /** @class */ (function () {
  function SessionStorageWrapper() {}
  /**
   * Retrieve tokens.
   */
  SessionStorageWrapper.get = function (clientId) {
    return __awaiter$8(this, void 0, void 0, function () {
      var tokenString;
      return __generator$8(this, function (_a) {
        tokenString = sessionStorage.getItem(''.concat(DB_NAME, '-').concat(clientId));
        try {
          return [2 /*return*/, Promise.resolve(JSON.parse(tokenString || ''))];
        } catch (err) {
          console.warn(
            'Could not parse token from sessionStorage. This could be due to accessing a removed token',
          );
          // Original behavior had an untyped return of undefined for no token
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          return [2 /*return*/, undefined];
        }
        return [2 /*return*/];
      });
    });
  };
  /**
   * Saves tokens.
   */
  SessionStorageWrapper.set = function (clientId, tokens) {
    return __awaiter$8(this, void 0, void 0, function () {
      var tokenString;
      return __generator$8(this, function (_a) {
        tokenString = JSON.stringify(tokens);
        sessionStorage.setItem(''.concat(DB_NAME, '-').concat(clientId), tokenString);
        return [2 /*return*/];
      });
    });
  };
  /**
   * Removes stored tokens.
   */
  SessionStorageWrapper.remove = function (clientId) {
    return __awaiter$8(this, void 0, void 0, function () {
      return __generator$8(this, function (_a) {
        sessionStorage.removeItem(''.concat(DB_NAME, '-').concat(clientId));
        return [2 /*return*/];
      });
    });
  };
  return SessionStorageWrapper;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020-2021 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$7 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$7 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides access to the token storage API.
 * The type of storage (localStorage, sessionStorage, etc) can be configured
 * through `tokenStore` object on the SDK configuration.
 */
var TokenStorage = /** @class */ (function () {
  function TokenStorage() {}
  /**
   * Gets stored tokens.
   */
  TokenStorage.get = function () {
    return __awaiter$7(this, void 0, void 0, function () {
      var _a, clientId, tokenStore;
      return __generator$7(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = this.getClientConfig()), (clientId = _a.clientId), (tokenStore = _a.tokenStore);
            if (!(tokenStore === 'sessionStorage')) return [3 /*break*/, 2];
            return [4 /*yield*/, SessionStorageWrapper.get(clientId)];
          case 1:
            return [2 /*return*/, _b.sent()];
          case 2:
            if (!(tokenStore === 'localStorage')) return [3 /*break*/, 4];
            return [4 /*yield*/, LocalStorageWrapper.get(clientId)];
          case 3:
            return [2 /*return*/, _b.sent()];
          case 4:
            if (!(tokenStore === 'indexedDB')) return [3 /*break*/, 6];
            return [4 /*yield*/, IndexedDBWrapper.get(clientId)];
          case 5:
            return [2 /*return*/, _b.sent()];
          case 6:
            if (!(tokenStore && tokenStore.get)) return [3 /*break*/, 8];
            return [4 /*yield*/, tokenStore.get(clientId)];
          case 7:
            // User supplied token store
            return [2 /*return*/, _b.sent()];
          case 8:
            return [4 /*yield*/, LocalStorageWrapper.get(clientId)];
          case 9:
            // if tokenStore is undefined, default to localStorage
            return [2 /*return*/, _b.sent()];
        }
      });
    });
  };
  /**
   * Saves tokens.
   */
  TokenStorage.set = function (tokens) {
    return __awaiter$7(this, void 0, void 0, function () {
      var _a, clientId, tokenStore;
      return __generator$7(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = this.getClientConfig()), (clientId = _a.clientId), (tokenStore = _a.tokenStore);
            if (!(tokenStore === 'sessionStorage')) return [3 /*break*/, 2];
            return [4 /*yield*/, SessionStorageWrapper.set(clientId, tokens)];
          case 1:
            return [2 /*return*/, _b.sent()];
          case 2:
            if (!(tokenStore === 'localStorage')) return [3 /*break*/, 4];
            return [4 /*yield*/, LocalStorageWrapper.set(clientId, tokens)];
          case 3:
            return [2 /*return*/, _b.sent()];
          case 4:
            if (!(tokenStore === 'indexedDB')) return [3 /*break*/, 6];
            return [4 /*yield*/, IndexedDBWrapper.set(clientId, tokens)];
          case 5:
            return [2 /*return*/, _b.sent()];
          case 6:
            if (!(tokenStore && tokenStore.set)) return [3 /*break*/, 8];
            return [4 /*yield*/, tokenStore.set(clientId, tokens)];
          case 7:
            // User supplied token store
            return [2 /*return*/, _b.sent()];
          case 8:
            return [4 /*yield*/, LocalStorageWrapper.set(clientId, tokens)];
          case 9:
            // if tokenStore is undefined, default to localStorage
            return [2 /*return*/, _b.sent()];
        }
      });
    });
  };
  /**
   * Removes stored tokens.
   */
  TokenStorage.remove = function () {
    return __awaiter$7(this, void 0, void 0, function () {
      var _a, clientId, tokenStore;
      return __generator$7(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = this.getClientConfig()), (clientId = _a.clientId), (tokenStore = _a.tokenStore);
            if (!(tokenStore === 'sessionStorage')) return [3 /*break*/, 2];
            return [4 /*yield*/, SessionStorageWrapper.remove(clientId)];
          case 1:
            return [2 /*return*/, _b.sent()];
          case 2:
            if (!(tokenStore === 'localStorage')) return [3 /*break*/, 4];
            return [4 /*yield*/, LocalStorageWrapper.remove(clientId)];
          case 3:
            return [2 /*return*/, _b.sent()];
          case 4:
            if (!(tokenStore === 'indexedDB')) return [3 /*break*/, 6];
            return [4 /*yield*/, IndexedDBWrapper.remove(clientId)];
          case 5:
            return [2 /*return*/, _b.sent()];
          case 6:
            if (!(tokenStore && tokenStore.remove)) return [3 /*break*/, 8];
            return [4 /*yield*/, tokenStore.remove(clientId)];
          case 7:
            // User supplied token store
            return [2 /*return*/, _b.sent()];
          case 8:
            return [4 /*yield*/, LocalStorageWrapper.remove(clientId)];
          case 9:
            // if tokenStore is undefined, default to localStorage
            return [2 /*return*/, _b.sent()];
        }
      });
    });
  };
  TokenStorage.getClientConfig = function () {
    var _a = Config.get(),
      clientId = _a.clientId,
      tokenStore = _a.tokenStore;
    if (!clientId) {
      throw new Error('clientId is required to manage token storage');
    }
    return { clientId: clientId, tokenStore: tokenStore };
  };
  return TokenStorage;
})();

/*
 * @forgerock/javascript-sdk
 *
 * http.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @module
 * @ignore
 * These are private utility functions
 */
function isOkOr4xx(response) {
  return response.ok || Math.floor(response.status / 100) === 4;
}

/*
 * @forgerock/javascript-sdk
 *
 * pkce.ts
 *
 * Copyright (c) 2020-2021 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$6 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$6 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Helper class for generating verifier, challenge and state strings used for
 * Proof Key for Code Exchange (PKCE).
 */
var PKCE = /** @class */ (function () {
  function PKCE() {}
  /**
   * Creates a random state.
   */
  PKCE.createState = function () {
    return this.createRandomString(16);
  };
  /**
   * Creates a random verifier.
   */
  PKCE.createVerifier = function () {
    return this.createRandomString(32);
  };
  /**
   * Creates a SHA-256 hash of the verifier.
   *
   * @param verifier The verifier to hash
   */
  PKCE.createChallenge = function (verifier) {
    return __awaiter$6(this, void 0, void 0, function () {
      var sha256, challenge;
      return __generator$6(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.sha256(verifier)];
          case 1:
            sha256 = _a.sent();
            challenge = this.base64UrlEncode(sha256);
            return [2 /*return*/, challenge];
        }
      });
    });
  };
  /**
   * Creates a base64 encoded, URL-friendly version of the specified array.
   *
   * @param array The array of numbers to encode
   */
  PKCE.base64UrlEncode = function (array) {
    var numbers = Array.prototype.slice.call(array);
    var ascii = window.btoa(String.fromCharCode.apply(null, numbers));
    var urlEncoded = ascii.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return urlEncoded;
  };
  /**
   * Creates a SHA-256 hash of the specified string.
   *
   * @param value The string to hash
   */
  PKCE.sha256 = function (value) {
    return __awaiter$6(this, void 0, void 0, function () {
      var uint8Array, hashBuffer, hashArray;
      return __generator$6(this, function (_a) {
        switch (_a.label) {
          case 0:
            uint8Array = new TextEncoder().encode(value);
            return [4 /*yield*/, window.crypto.subtle.digest('SHA-256', uint8Array)];
          case 1:
            hashBuffer = _a.sent();
            hashArray = new Uint8Array(hashBuffer);
            return [2 /*return*/, hashArray];
        }
      });
    });
  };
  /**
   * Creates a random string.
   *
   * @param size The number for entropy (default: 32)
   */
  PKCE.createRandomString = function (num) {
    if (num === void 0) {
      num = 32;
    }
    var random = new Uint8Array(num);
    window.crypto.getRandomValues(random);
    return btoa(random.join('')).replace(/[^a-zA-Z0-9]+/, '');
  };
  return PKCE;
})();

/*
 * @forgerock/javascript-sdk
 *
 * enums.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Specifies the type of OAuth flow to invoke.
 */
var ResponseType;
(function (ResponseType) {
  ResponseType['Code'] = 'code';
  ResponseType['Token'] = 'token';
})(ResponseType || (ResponseType = {}));

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020-2021 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$3 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$3 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$3.apply(this, arguments);
  };
var __awaiter$5 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$5 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var allowedErrors = {
  // AM error for consent requirement
  AuthenticationConsentRequired: 'Authentication or consent required',
  // Manual iframe error
  AuthorizationTimeout: 'Authorization timed out',
  // Chromium browser error
  FailedToFetch: 'Failed to fetch',
  // Mozilla browser error
  NetworkError: 'NetworkError when attempting to fetch resource.',
  // Webkit browser error
  CORSError: 'Cross-origin redirection',
};
/**
 * OAuth 2.0 client.
 */
var OAuth2Client = /** @class */ (function () {
  function OAuth2Client() {}
  OAuth2Client.createAuthorizeUrl = function (options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var _a,
        clientId,
        middleware,
        redirectUri,
        scope,
        requestParams,
        challenge,
        runMiddleware,
        url;
      return __generator$5(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = Config.get(options)),
              (clientId = _a.clientId),
              (middleware = _a.middleware),
              (redirectUri = _a.redirectUri),
              (scope = _a.scope);
            requestParams = __assign$3(__assign$3({}, options.query), {
              client_id: clientId,
              redirect_uri: redirectUri,
              response_type: options.responseType,
              scope: scope,
              state: options.state,
            });
            if (!options.verifier) return [3 /*break*/, 2];
            return [4 /*yield*/, PKCE.createChallenge(options.verifier)];
          case 1:
            challenge = _b.sent();
            requestParams.code_challenge = challenge;
            requestParams.code_challenge_method = 'S256';
            _b.label = 2;
          case 2:
            runMiddleware = middlewareWrapper(
              {
                url: new URL(this.getUrl('authorize', requestParams, options)),
                init: {},
              },
              { type: ActionTypes.Authorize },
            );
            url = runMiddleware(middleware).url;
            return [2 /*return*/, url.toString()];
        }
      });
    });
  };
  /**
   * Calls the authorize URL with an iframe. If successful,
   * it returns the callback URL with authentication code,
   * optionally using PKCE.
   * Method renamed in v3.
   * Original Name: getAuthorizeUrl
   * New Name: getAuthCodeByIframe
   */
  OAuth2Client.getAuthCodeByIframe = function (options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var url, serverConfig;
      var _this = this;
      return __generator$5(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.createAuthorizeUrl(options)];
          case 1:
            url = _a.sent();
            serverConfig = Config.get(options).serverConfig;
            return [
              2 /*return*/,
              new Promise(function (resolve, reject) {
                var iframe = document.createElement('iframe');
                // Define these here to avoid linter warnings
                var noop = function () {
                  return;
                };
                var onLoad = noop;
                var cleanUp = noop;
                var timeout = 0;
                cleanUp = function () {
                  window.clearTimeout(timeout);
                  iframe.removeEventListener('load', onLoad);
                  iframe.remove();
                };
                onLoad = function () {
                  if (iframe.contentWindow) {
                    var newHref = iframe.contentWindow.location.href;
                    if (_this.containsAuthCode(newHref)) {
                      cleanUp();
                      resolve(newHref);
                    } else if (_this.containsAuthError(newHref)) {
                      cleanUp();
                      resolve(newHref);
                    }
                  }
                };
                timeout = window.setTimeout(function () {
                  cleanUp();
                  reject(new Error(allowedErrors.AuthorizationTimeout));
                }, serverConfig.timeout);
                iframe.style.display = 'none';
                iframe.addEventListener('load', onLoad);
                document.body.appendChild(iframe);
                iframe.src = url;
              }),
            ];
        }
      });
    });
  };
  /**
   * Exchanges an authorization code for OAuth tokens.
   */
  OAuth2Client.getOAuth2Tokens = function (options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var _a,
        clientId,
        redirectUri,
        requestParams,
        body,
        init,
        response,
        responseBody,
        message,
        responseObject,
        tokenExpiry;
      return __generator$5(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = Config.get(options)), (clientId = _a.clientId), (redirectUri = _a.redirectUri);
            requestParams = {
              client_id: clientId,
              code: options.authorizationCode,
              grant_type: 'authorization_code',
              redirect_uri: redirectUri,
            };
            if (options.verifier) {
              requestParams.code_verifier = options.verifier;
            }
            body = stringify(requestParams);
            init = {
              body: body,
              headers: new Headers({
                'Content-Length': body.length.toString(),
                'Content-Type': 'application/x-www-form-urlencoded',
              }),
              method: 'POST',
            };
            return [4 /*yield*/, this.request('accessToken', undefined, false, init, options)];
          case 1:
            response = _b.sent();
            return [4 /*yield*/, this.getBody(response)];
          case 2:
            responseBody = _b.sent();
            if (response.status !== 200) {
              message =
                typeof responseBody === 'string'
                  ? 'Expected 200, received '.concat(response.status)
                  : this.parseError(responseBody);
              throw new Error(message);
            }
            responseObject = responseBody;
            if (!responseObject.access_token) {
              throw new Error('Access token not found in response');
            }
            tokenExpiry = undefined;
            if (responseObject.expires_in) {
              tokenExpiry = Date.now() + responseObject.expires_in * 1000;
            }
            return [
              2 /*return*/,
              {
                accessToken: responseObject.access_token,
                idToken: responseObject.id_token,
                refreshToken: responseObject.refresh_token,
                tokenExpiry: tokenExpiry,
              },
            ];
        }
      });
    });
  };
  /**
   * Gets OIDC user information.
   */
  OAuth2Client.getUserInfo = function (options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var response, json;
      return __generator$5(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, this.request('userInfo', undefined, true, undefined, options)];
          case 1:
            response = _a.sent();
            if (response.status !== 200) {
              throw new Error('Failed to get user info; received '.concat(response.status));
            }
            return [4 /*yield*/, response.json()];
          case 2:
            json = _a.sent();
            return [2 /*return*/, json];
        }
      });
    });
  };
  /**
   * Invokes the OIDC end session endpoint.
   */
  OAuth2Client.endSession = function (options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var idToken, query, response;
      return __generator$5(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, TokenStorage.get()];
          case 1:
            idToken = _a.sent().idToken;
            query = {};
            if (idToken) {
              query.id_token_hint = idToken;
            }
            return [4 /*yield*/, this.request('endSession', query, true, undefined, options)];
          case 2:
            response = _a.sent();
            if (!isOkOr4xx(response)) {
              throw new Error('Failed to end session; received '.concat(response.status));
            }
            return [2 /*return*/, response];
        }
      });
    });
  };
  /**
   * Immediately revokes the stored access token.
   */
  OAuth2Client.revokeToken = function (options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var clientId, accessToken, init, response;
      return __generator$5(this, function (_a) {
        switch (_a.label) {
          case 0:
            clientId = Config.get(options).clientId;
            return [4 /*yield*/, TokenStorage.get()];
          case 1:
            accessToken = _a.sent().accessToken;
            init = {
              body: stringify({ client_id: clientId, token: accessToken }),
              credentials: 'include',
              headers: new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' }),
              method: 'POST',
            };
            return [4 /*yield*/, this.request('revoke', undefined, false, init, options)];
          case 2:
            response = _a.sent();
            if (!isOkOr4xx(response)) {
              throw new Error('Failed to revoke token; received '.concat(response.status));
            }
            return [2 /*return*/, response];
        }
      });
    });
  };
  OAuth2Client.request = function (endpoint, query, includeToken, init, options) {
    return __awaiter$5(this, void 0, void 0, function () {
      var _a, middleware, serverConfig, url, getActionType, accessToken, runMiddleware, req;
      return __generator$5(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = Config.get(options)),
              (middleware = _a.middleware),
              (serverConfig = _a.serverConfig);
            url = this.getUrl(endpoint, query, options);
            getActionType = function (endpoint) {
              switch (endpoint) {
                case 'accessToken':
                  return ActionTypes.ExchangeToken;
                case 'endSession':
                  return ActionTypes.EndSession;
                case 'revoke':
                  return ActionTypes.RevokeToken;
                default:
                  return ActionTypes.UserInfo;
              }
            };
            init = init || {};
            if (!includeToken) return [3 /*break*/, 2];
            return [4 /*yield*/, TokenStorage.get()];
          case 1:
            accessToken = _b.sent().accessToken;
            init.credentials = 'include';
            init.headers = init.headers || new Headers();
            init.headers.set('Authorization', 'Bearer '.concat(accessToken));
            _b.label = 2;
          case 2:
            runMiddleware = middlewareWrapper(
              { url: new URL(url), init: init },
              { type: getActionType(endpoint) },
            );
            req = runMiddleware(middleware);
            return [
              4 /*yield*/,
              withTimeout(fetch(req.url.toString(), req.init), serverConfig.timeout),
            ];
          case 3:
            return [2 /*return*/, _b.sent()];
        }
      });
    });
  };
  OAuth2Client.containsAuthCode = function (url) {
    return !!url && /code=([^&]+)/.test(url);
  };
  OAuth2Client.containsAuthError = function (url) {
    return !!url && /error=([^&]+)/.test(url);
  };
  OAuth2Client.getBody = function (response) {
    return __awaiter$5(this, void 0, void 0, function () {
      var contentType;
      return __generator$5(this, function (_a) {
        switch (_a.label) {
          case 0:
            contentType = response.headers.get('Content-Type');
            if (!(contentType && contentType.indexOf('application/json') > -1))
              return [3 /*break*/, 2];
            return [4 /*yield*/, response.json()];
          case 1:
            return [2 /*return*/, _a.sent()];
          case 2:
            return [4 /*yield*/, response.text()];
          case 3:
            return [2 /*return*/, _a.sent()];
        }
      });
    });
  };
  OAuth2Client.parseError = function (json) {
    if (json) {
      if (json.error && json.error_description) {
        return ''.concat(json.error, ': ').concat(json.error_description);
      }
      if (json.code && json.message) {
        return ''.concat(json.code, ': ').concat(json.message);
      }
    }
    return undefined;
  };
  OAuth2Client.getUrl = function (endpoint, query, options) {
    var _a = Config.get(options),
      realmPath = _a.realmPath,
      serverConfig = _a.serverConfig;
    var path = getEndpointPath(endpoint, realmPath, serverConfig.paths);
    var url = resolve(serverConfig.baseUrl, path);
    if (query) {
      url += '?'.concat(stringify(query));
    }
    return url;
  };
  return OAuth2Client;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$4 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$4 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * Provides access to the session management API.
 */
var SessionManager = /** @class */ (function () {
  function SessionManager() {}
  /**
   * Ends the current session.
   */
  SessionManager.logout = function (options) {
    return __awaiter$4(this, void 0, void 0, function () {
      var _a, middleware, realmPath, serverConfig, init, path, url, runMiddleware, req, response;
      return __generator$4(this, function (_b) {
        switch (_b.label) {
          case 0:
            (_a = Config.get(options)),
              (middleware = _a.middleware),
              (realmPath = _a.realmPath),
              (serverConfig = _a.serverConfig);
            init = {
              credentials: 'include',
              headers: new Headers({
                'Accept-API-Version': 'protocol=1.0,resource=2.0',
                'X-Requested-With': REQUESTED_WITH,
              }),
              method: 'POST',
            };
            path = ''.concat(
              getEndpointPath('sessions', realmPath, serverConfig.paths),
              '?_action=logout',
            );
            url = resolve(serverConfig.baseUrl, path);
            runMiddleware = middlewareWrapper(
              { url: new URL(url), init: init },
              { type: ActionTypes.Logout },
            );
            req = runMiddleware(middleware);
            return [
              4 /*yield*/,
              withTimeout(fetch(req.url.toString(), req.init), serverConfig.timeout),
            ];
          case 1:
            response = _b.sent();
            if (!isOkOr4xx(response)) {
              throw new Error('Failed to log out; received '.concat(response.status));
            }
            return [2 /*return*/, response];
        }
      });
    });
  };
  return SessionManager;
})();

/*
 * @forgerock/javascript-sdk
 *
 * helpers.ts
 *
 * Copyright (c) 2022 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @module
 * @ignore
 * These are private utility functions for Token Manager
 */
function tokensWillExpireWithinThreshold(oauthThreshold, tokenExpiry) {
  if (oauthThreshold && tokenExpiry) {
    return tokenExpiry - oauthThreshold < Date.now();
  }
  return false;
}

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020-2021 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$2 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$2 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$2.apply(this, arguments);
  };
var __awaiter$3 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$3 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var TokenManager = /** @class */ (function () {
  function TokenManager() {}
  /**
     * Token Manager class that provides high-level abstraction for Authorization Code flow,
     * PKCE value generation, token exchange and token storage.
     *
     * Supports both embedded authentication as well as external authentication via redirects
     *
     Example 1:
  
     ```js
     const tokens = forgerock.TokenManager.getTokens({
       forceRenew: true, // If you want to get new tokens, despite existing ones
       login: 'embedded', // If user authentication is handled in-app
       support: 'legacy', // Set globally or locally; `"legacy"` or `undefined` will use iframe
       serverConfig: {
         timeout: 5000, // If using "legacy", use a short timeout to catch error
       },
     });
     ```
  
     Example 2:
  
     ```js
     const tokens = forgerock.TokenManager.getTokens({
       forceRenew: false, // Will immediately return stored tokens, if they exist
       login: 'redirect', // If user authentication is handled in external Web app
       support: 'modern', // Set globally or locally; `"modern"` will use native fetch
     });
     ```
  
     Example 3:
  
     ```js
     const tokens = forgerock.TokenManager.getTokens({
       query: {
         code: 'lFJQYdoQG1u7nUm8 ... ', // Authorization code from redirect URL
         state: 'MTY2NDkxNTQ2Nde3D ... ', // State from redirect URL
       },
     });
     ```
     */
  TokenManager.getTokens = function (options) {
    var _a, _b, _c;
    return __awaiter$3(this, void 0, void 0, function () {
      var tokens,
        _d,
        clientId,
        middleware,
        serverConfig,
        support,
        oauthThreshold,
        error_1,
        error_2,
        storedString,
        storedValues,
        verifier,
        state,
        authorizeUrlOptions,
        authorizeUrl,
        parsedUrl,
        _e,
        runMiddleware,
        init,
        response,
        parsedQuery,
        err_1;
      return __generator$3(this, function (_f) {
        switch (_f.label) {
          case 0:
            tokens = null;
            (_d = Config.get(options)),
              (clientId = _d.clientId),
              (middleware = _d.middleware),
              (serverConfig = _d.serverConfig),
              (support = _d.support),
              (oauthThreshold = _d.oauthThreshold);
            _f.label = 1;
          case 1:
            _f.trys.push([1, 3, , 4]);
            return [4 /*yield*/, TokenStorage.get()];
          case 2:
            tokens = _f.sent();
            return [3 /*break*/, 4];
          case 3:
            error_1 = _f.sent();
            console.info('No stored tokens available', error_1);
            return [3 /*break*/, 4];
          case 4:
            /**
             * If tokens are stored, no option for `forceRenew` or `query` object with `code`, and do not expire within the configured threshold,
             * immediately return the stored tokens
             */
            if (
              tokens &&
              !(options === null || options === void 0 ? void 0 : options.forceRenew) &&
              !((_a = options === null || options === void 0 ? void 0 : options.query) === null ||
              _a === void 0
                ? void 0
                : _a.code) &&
              !tokensWillExpireWithinThreshold(oauthThreshold, tokens.tokenExpiry)
            ) {
              return [2 /*return*/, tokens];
            }
            if (!tokens) return [3 /*break*/, 9];
            _f.label = 5;
          case 5:
            _f.trys.push([5, 8, , 9]);
            return [4 /*yield*/, OAuth2Client.revokeToken(options)];
          case 6:
            _f.sent();
            return [4 /*yield*/, TokenManager.deleteTokens()];
          case 7:
            _f.sent();
            return [3 /*break*/, 9];
          case 8:
            error_2 = _f.sent();
            console.warn('Existing tokens could not be revoked or deleted', error_2);
            return [3 /*break*/, 9];
          case 9:
            if (
              !(
                ((_b = options === null || options === void 0 ? void 0 : options.query) === null ||
                _b === void 0
                  ? void 0
                  : _b.code) &&
                ((_c = options === null || options === void 0 ? void 0 : options.query) === null ||
                _c === void 0
                  ? void 0
                  : _c.state)
              )
            )
              return [3 /*break*/, 11];
            storedString = window.sessionStorage.getItem(clientId);
            window.sessionStorage.removeItem(clientId);
            storedValues = JSON.parse(storedString);
            return [4 /*yield*/, this.tokenExchange(options, storedValues)];
          case 10:
            return [2 /*return*/, _f.sent()];
          case 11:
            verifier = PKCE.createVerifier();
            state = PKCE.createState();
            authorizeUrlOptions = __assign$2(__assign$2({}, options), {
              responseType: ResponseType.Code,
              state: state,
              verifier: verifier,
            });
            return [4 /*yield*/, OAuth2Client.createAuthorizeUrl(authorizeUrlOptions)];
          case 12:
            authorizeUrl = _f.sent();
            _f.label = 13;
          case 13:
            _f.trys.push([13, 18, , 19]);
            parsedUrl = void 0;
            if (!(support === 'legacy' || support === undefined)) return [3 /*break*/, 15];
            _e = URL.bind;
            return [4 /*yield*/, OAuth2Client.getAuthCodeByIframe(authorizeUrlOptions)];
          case 14:
            // To support legacy browsers, iframe works best with short timeout
            parsedUrl = new (_e.apply(URL, [void 0, _f.sent()]))();
            return [3 /*break*/, 17];
          case 15:
            runMiddleware = middlewareWrapper(
              {
                url: new URL(authorizeUrl),
                init: {
                  credentials: 'include',
                  mode: 'cors',
                },
              },
              {
                type: ActionTypes.Authorize,
              },
            );
            init = runMiddleware(middleware).init;
            return [4 /*yield*/, withTimeout(fetch(authorizeUrl, init), serverConfig.timeout)];
          case 16:
            response = _f.sent();
            parsedUrl = new URL(response.url);
            _f.label = 17;
          case 17:
            // Throw if we have an error param or have no authorization code
            if (parsedUrl.searchParams.get('error')) {
              throw Error(''.concat(parsedUrl.searchParams.get('error_description')));
            } else if (!parsedUrl.searchParams.get('code')) {
              throw Error(allowedErrors.AuthenticationConsentRequired);
            }
            parsedQuery = parseQuery(parsedUrl.toString());
            if (!options) {
              options = {};
            }
            options.query = parsedQuery;
            return [3 /*break*/, 19];
          case 18:
            err_1 = _f.sent();
            // If authorize request fails, handle according to `login` type
            if (
              !(err_1 instanceof Error) ||
              (options === null || options === void 0 ? void 0 : options.login) !== 'redirect'
            ) {
              // Throw for any error if login is NOT of type "redirect"
              throw err_1;
            }
            // Check if error is not one of our allowed errors
            if (
              allowedErrors.AuthenticationConsentRequired !== err_1.message &&
              allowedErrors.AuthorizationTimeout !== err_1.message &&
              allowedErrors.FailedToFetch !== err_1.message &&
              allowedErrors.NetworkError !== err_1.message &&
              // Safari has a very long error message, so we check for a substring
              !err_1.message.includes(allowedErrors.CORSError)
            ) {
              // Throw if the error is NOT an explicitly allowed error along with redirect of true
              // as that is a normal response and just requires a redirect
              throw err_1;
            }
            // Since `login` is configured for "redirect", store authorize values and redirect
            window.sessionStorage.setItem(clientId, JSON.stringify(authorizeUrlOptions));
            return [2 /*return*/, window.location.assign(authorizeUrl)];
          case 19:
            return [4 /*yield*/, this.tokenExchange(options, { state: state, verifier: verifier })];
          case 20:
            /**
             * Exchange authorization code for tokens
             */
            return [2 /*return*/, _f.sent()];
        }
      });
    });
  };
  TokenManager.deleteTokens = function () {
    return __awaiter$3(this, void 0, void 0, function () {
      return __generator$3(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, TokenStorage.remove()];
          case 1:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  TokenManager.tokenExchange = function (options, stored) {
    var _a, _b, _c, _d;
    return __awaiter$3(this, void 0, void 0, function () {
      var authorizationCode, verifier, getTokensOptions, tokens, error_3;
      return __generator$3(this, function (_e) {
        switch (_e.label) {
          case 0:
            /**
             * Ensure incoming state and stored state are equal and authorization code exists
             */
            if (
              ((_a = options.query) === null || _a === void 0 ? void 0 : _a.state) !== stored.state
            ) {
              throw new Error('State mismatch');
            }
            if (
              !((_b = options.query) === null || _b === void 0 ? void 0 : _b.code) ||
              Array.isArray((_c = options.query) === null || _c === void 0 ? void 0 : _c.code)
            ) {
              throw new Error('Failed to acquire authorization code');
            }
            authorizationCode = (_d = options.query) === null || _d === void 0 ? void 0 : _d.code;
            verifier = stored.verifier;
            getTokensOptions = __assign$2(__assign$2({}, options), {
              authorizationCode: authorizationCode,
              verifier: verifier,
            });
            return [4 /*yield*/, OAuth2Client.getOAuth2Tokens(getTokensOptions)];
          case 1:
            tokens = _e.sent();
            if (!tokens || !tokens.accessToken) {
              throw new Error('Unable to exchange authorization for tokens');
            }
            _e.label = 2;
          case 2:
            _e.trys.push([2, 4, , 5]);
            return [4 /*yield*/, TokenStorage.set(tokens)];
          case 3:
            _e.sent();
            return [3 /*break*/, 5];
          case 4:
            error_3 = _e.sent();
            console.error('Failed to store tokens', error_3);
            return [3 /*break*/, 5];
          case 5:
            return [2 /*return*/, tokens];
        }
      });
    });
  };
  return TokenManager;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * Provides access to the current user's profile.
 */
var UserManager = /** @class */ (function () {
  function UserManager() {}
  /**
   * Gets the current user's profile.
   */
  UserManager.getCurrentUser = function (options) {
    return OAuth2Client.getUserInfo(options);
  };
  return UserManager;
})();

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$2 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$2 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * High-level API for logging a user in/out and getting profile information.
 */
var FRUser = /** @class */ (function () {
  function FRUser() {}
  /**
   * Logs the user in with the specified step handler, acquires OAuth tokens, and retrieves
   * user profile.  **Currently not implemented.**
   *
   * @typeparam T The type of user object expected
   * @param handler The function to invoke when handling authentication steps
   * @param options Configuration overrides
   */
  FRUser.login = function (handler, options) {
    return __awaiter$2(this, void 0, void 0, function () {
      return __generator$2(this, function (_a) {
        console.info(handler, options); // Avoid lint errors
        throw new Error('FRUser.login() not implemented');
      });
    });
  };
  /**
   * Logs the user in with the specified UI, acquires OAuth tokens, and retrieves user profile.
   *
   * @typeparam T The type of user object expected
   * @param ui The UI instance to use to acquire a session
   * @param options Configuration overrides
   */
  FRUser.loginWithUI = function (ui, options) {
    return __awaiter$2(this, void 0, void 0, function () {
      var currentUser;
      return __generator$2(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 4, , 5]);
            return [4 /*yield*/, ui.getSession(options)];
          case 1:
            _a.sent();
            return [4 /*yield*/, TokenManager.getTokens({ forceRenew: true })];
          case 2:
            _a.sent();
            return [4 /*yield*/, UserManager.getCurrentUser()];
          case 3:
            currentUser = _a.sent();
            return [2 /*return*/, currentUser];
          case 4:
            _a.sent();
            throw new Error('Login failed');
          case 5:
            return [2 /*return*/];
        }
      });
    });
  };
  /**
   * Ends the user's session and revokes OAuth tokens.
   *
   * @param options Configuration overrides
   */
  FRUser.logout = function (options) {
    return __awaiter$2(this, void 0, void 0, function () {
      return __generator$2(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            // Both invalidates the session on the server AND removes browser cookie
            return [4 /*yield*/, SessionManager.logout(options)];
          case 1:
            // Both invalidates the session on the server AND removes browser cookie
            _a.sent();
            return [3 /*break*/, 3];
          case 2:
            _a.sent();
            console.warn('Session logout was not successful');
            return [3 /*break*/, 3];
          case 3:
            _a.trys.push([3, 5, , 6]);
            // Invalidates session on the server tied to the ID Token
            // Needed for Express environment as session logout is unavailable
            return [4 /*yield*/, OAuth2Client.endSession(options)];
          case 4:
            // Invalidates session on the server tied to the ID Token
            // Needed for Express environment as session logout is unavailable
            _a.sent();
            return [3 /*break*/, 6];
          case 5:
            _a.sent();
            console.warn('OAuth endSession was not successful');
            return [3 /*break*/, 6];
          case 6:
            _a.trys.push([6, 8, , 9]);
            return [4 /*yield*/, OAuth2Client.revokeToken(options)];
          case 7:
            _a.sent();
            return [3 /*break*/, 9];
          case 8:
            _a.sent();
            console.warn('OAuth revokeToken was not successful');
            return [3 /*break*/, 9];
          case 9:
            return [4 /*yield*/, TokenManager.deleteTokens()];
          case 10:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  return FRUser;
})();

/*
 * @forgerock/javascript-sdk
 *
 * enums.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var WebAuthnOutcome;
(function (WebAuthnOutcome) {
  WebAuthnOutcome['Error'] = 'ERROR';
  WebAuthnOutcome['Unsupported'] = 'unsupported';
})(WebAuthnOutcome || (WebAuthnOutcome = {}));
var WebAuthnOutcomeType;
(function (WebAuthnOutcomeType) {
  WebAuthnOutcomeType['AbortError'] = 'AbortError';
  WebAuthnOutcomeType['DataError'] = 'DataError';
  WebAuthnOutcomeType['ConstraintError'] = 'ConstraintError';
  WebAuthnOutcomeType['EncodingError'] = 'EncodingError';
  WebAuthnOutcomeType['InvalidError'] = 'InvalidError';
  WebAuthnOutcomeType['NetworkError'] = 'NetworkError';
  WebAuthnOutcomeType['NotAllowedError'] = 'NotAllowedError';
  WebAuthnOutcomeType['NotSupportedError'] = 'NotSupportedError';
  WebAuthnOutcomeType['SecurityError'] = 'SecurityError';
  WebAuthnOutcomeType['TimeoutError'] = 'TimeoutError';
  WebAuthnOutcomeType['UnknownError'] = 'UnknownError';
})(WebAuthnOutcomeType || (WebAuthnOutcomeType = {}));
var WebAuthnStepType;
(function (WebAuthnStepType) {
  WebAuthnStepType[(WebAuthnStepType['None'] = 0)] = 'None';
  WebAuthnStepType[(WebAuthnStepType['Authentication'] = 1)] = 'Authentication';
  WebAuthnStepType[(WebAuthnStepType['Registration'] = 2)] = 'Registration';
})(WebAuthnStepType || (WebAuthnStepType = {}));

/* eslint-disable no-useless-escape */
/*
 * @forgerock/javascript-sdk
 *
 * script-parser.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign$1 =
  (undefined && undefined.__assign) ||
  function () {
    __assign$1 =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign$1.apply(this, arguments);
  };

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __assign =
  (undefined && undefined.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
(undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
(undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };

/*
 * @forgerock/javascript-sdk
 *
 * helpers.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __awaiter$1 =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator$1 =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
function addAuthzInfoToHeaders(init, advices, tokens) {
  var headers = new Headers(init.headers);
  if (advices.AuthenticateToServiceConditionAdvice) {
    headers.set('X-Tree', advices.AuthenticateToServiceConditionAdvice[0]);
  } else if (advices.TransactionConditionAdvice) {
    headers.set('X-TxID', advices.TransactionConditionAdvice[0]);
  }
  if (tokens && tokens.idToken) {
    headers.set('X-IdToken', tokens.idToken);
  }
  return headers;
}
function addAuthzInfoToURL(url, advices, tokens) {
  var updatedURL = new URL(url);
  // Only modify URL for Transactional Authorization
  if (advices.TransactionConditionAdvice) {
    var txId = advices.TransactionConditionAdvice[0];
    // Add Txn ID to *original* request options as URL param
    updatedURL.searchParams.append('_txid', txId);
  }
  // If tokens are used, send idToken (OIDC)
  if (tokens && tokens.idToken) {
    updatedURL.searchParams.append('_idtoken', tokens.idToken);
  }
  // FYI: in certain circumstances, the URL may be returned unchanged
  return updatedURL.toString();
}
function buildAuthzOptions(authzObj, baseURL, timeout, realmPath, customPaths) {
  var treeAuthAdvices = authzObj.advices && authzObj.advices.AuthenticateToServiceConditionAdvice;
  var txnAuthAdvices = authzObj.advices && authzObj.advices.TransactionConditionAdvice;
  var attributeValue = '';
  var attributeName = '';
  if (treeAuthAdvices) {
    attributeValue = treeAuthAdvices.reduce(function (prev, curr) {
      var prevWithSpace = prev ? ' '.concat(prev) : prev;
      prev = ''.concat(curr).concat(prevWithSpace);
      return prev;
    }, '');
    attributeName = 'AuthenticateToServiceConditionAdvice';
  } else if (txnAuthAdvices) {
    attributeValue = txnAuthAdvices.reduce(function (prev, curr) {
      var prevWithSpace = prev ? ' '.concat(prev) : prev;
      prev = ''.concat(curr).concat(prevWithSpace);
      return prev;
    }, '');
    attributeName = 'TransactionConditionAdvice';
  }
  var openTags = '<Advices><AttributeValuePair>';
  var nameTag = '<Attribute name="'.concat(attributeName, '"/>');
  var valueTag = '<Value>'.concat(attributeValue, '</Value>');
  var endTags = '</AttributeValuePair></Advices>';
  var fullXML = ''.concat(openTags).concat(nameTag).concat(valueTag).concat(endTags);
  var path = getEndpointPath('authenticate', realmPath, customPaths);
  var queryParams = {
    authIndexType: 'composite_advice',
    authIndexValue: fullXML,
  };
  var options = {
    init: {
      method: 'POST',
      credentials: 'include',
      headers: new Headers({
        'Accept-API-Version': 'resource=2.0, protocol=1.0',
      }),
    },
    timeout: timeout,
    url: resolve(baseURL, ''.concat(path, '?').concat(stringify(queryParams))),
  };
  return options;
}
function examineForIGAuthz(res) {
  var type = res.headers.get('Content-Type') || '';
  return type.includes('html') && res.url.includes('composite_advice');
}
function examineForRESTAuthz(res) {
  return __awaiter$1(this, void 0, void 0, function () {
    var clone, json;
    return __generator$1(this, function (_a) {
      switch (_a.label) {
        case 0:
          clone = res.clone();
          return [4 /*yield*/, clone.json()];
        case 1:
          json = _a.sent();
          return [2 /*return*/, !!json.advices];
      }
    });
  });
}
function getXMLValueFromURL(urlString) {
  var url = new URL(urlString);
  var value = url.searchParams.get('authIndexValue') || '';
  var parser = new DOMParser();
  var decodedValue = decodeURIComponent(value);
  var doc = parser.parseFromString(decodedValue, 'application/xml');
  var el = doc.querySelector('Value');
  return el ? el.innerHTML : '';
}
function hasAuthzAdvice(json) {
  if (json.advices && json.advices.AuthenticateToServiceConditionAdvice) {
    return (
      Array.isArray(json.advices.AuthenticateToServiceConditionAdvice) &&
      json.advices.AuthenticateToServiceConditionAdvice.length > 0
    );
  } else if (json.advices && json.advices.TransactionConditionAdvice) {
    return (
      Array.isArray(json.advices.TransactionConditionAdvice) &&
      json.advices.TransactionConditionAdvice.length > 0
    );
  } else {
    return false;
  }
}
function isAuthzStep(res) {
  return __awaiter$1(this, void 0, void 0, function () {
    var clone, json;
    return __generator$1(this, function (_a) {
      switch (_a.label) {
        case 0:
          clone = res.clone();
          return [4 /*yield*/, clone.json()];
        case 1:
          json = _a.sent();
          return [2 /*return*/, !!json.callbacks];
      }
    });
  });
}
function newTokenRequired(res, requiresNewToken) {
  if (typeof requiresNewToken === 'function') {
    return requiresNewToken(res);
  }
  return res.status === 401;
}
function normalizeIGJSON(res) {
  var advices = {};
  if (res.url.includes('AuthenticateToServiceConditionAdvice')) {
    advices.AuthenticateToServiceConditionAdvice = [getXMLValueFromURL(res.url)];
  } else {
    advices.TransactionConditionAdvice = [getXMLValueFromURL(res.url)];
  }
  return {
    resource: '',
    actions: {},
    attributes: {},
    advices: advices,
    ttl: 0,
  };
}
function normalizeRESTJSON(res) {
  return __awaiter$1(this, void 0, void 0, function () {
    return __generator$1(this, function (_a) {
      switch (_a.label) {
        case 0:
          return [4 /*yield*/, res.json()];
        case 1:
          return [2 /*return*/, _a.sent()];
      }
    });
  });
}

/*
 * @forgerock/javascript-sdk
 *
 * index.ts
 *
 * Copyright (c) 2020 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
var __extends =
  (undefined && undefined.__extends) ||
  (function () {
    var extendStatics = function (d, b) {
      extendStatics =
        Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array &&
          function (d, b) {
            d.__proto__ = b;
          }) ||
        function (d, b) {
          for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
        };
      return extendStatics(d, b);
    };
    return function (d, b) {
      if (typeof b !== 'function' && b !== null)
        throw new TypeError('Class extends value ' + String(b) + ' is not a constructor or null');
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
    };
  })();
var __awaiter =
  (undefined && undefined.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (undefined && undefined.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g;
    return (
      (g = { next: verb(0), throw: verb(1), return: verb(2) }),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while (_)
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                  ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                  : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
/**
 * HTTP client that includes bearer token injection and refresh.
 * This module also supports authorization for policy protected endpoints.
 *
 * Example:
 *
 * ```js
 * return forgerock.HttpClient.request({
 *   url: `https://example.com/protected/resource`,
 *   init: {
 *     method: 'GET',
 *     credentials: 'include',
 *   },
 *   authorization: {
 *     handleStep: async (step) => {
 *       step.getCallbackOfType('PasswordCallback').setPassword(pw);
 *       return Promise.resolve(step);
 *     },
 *   },
 * });
 * ```
 */
var HttpClient = /** @class */ (function (_super) {
  __extends(HttpClient, _super);
  function HttpClient() {
    return (_super !== null && _super.apply(this, arguments)) || this;
  }
  /**
   * Makes a request using the specified options.
   *
   * @param options The options to use when making the request
   */
  HttpClient.request = function (options) {
    return __awaiter(this, void 0, void 0, function () {
      var res,
        authorizationJSON,
        hasIG,
        _a,
        middleware,
        realmPath,
        serverConfig,
        authzOptions,
        url,
        type,
        tree,
        runMiddleware,
        _b,
        authUrl,
        authInit,
        initialStep,
        tokens;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            return [4 /*yield*/, this._request(options, false)];
          case 1:
            res = _c.sent();
            hasIG = false;
            if (!newTokenRequired(res, options.requiresNewToken)) return [3 /*break*/, 3];
            return [4 /*yield*/, this._request(options, true)];
          case 2:
            res = _c.sent();
            _c.label = 3;
          case 3:
            if (!(options.authorization && options.authorization.handleStep))
              return [3 /*break*/, 16];
            if (!(res.redirected && examineForIGAuthz(res))) return [3 /*break*/, 4];
            hasIG = true;
            authorizationJSON = normalizeIGJSON(res);
            return [3 /*break*/, 7];
          case 4:
            return [4 /*yield*/, examineForRESTAuthz(res)];
          case 5:
            if (!_c.sent()) return [3 /*break*/, 7];
            return [4 /*yield*/, normalizeRESTJSON(res)];
          case 6:
            authorizationJSON = _c.sent();
            _c.label = 7;
          case 7:
            if (!(authorizationJSON && authorizationJSON.advices)) return [3 /*break*/, 16];
            (_a = Config.get(options.authorization.config)),
              (middleware = _a.middleware),
              (realmPath = _a.realmPath),
              (serverConfig = _a.serverConfig);
            authzOptions = buildAuthzOptions(
              authorizationJSON,
              serverConfig.baseUrl,
              options.timeout,
              realmPath,
              serverConfig.paths,
            );
            url = new URL(authzOptions.url);
            type = url.searchParams.get('authIndexType');
            tree = url.searchParams.get('authIndexValue');
            runMiddleware = middlewareWrapper(
              {
                url: new URL(authzOptions.url),
                init: authzOptions.init,
              },
              {
                type: ActionTypes.StartAuthenticate,
                payload: { type: type, tree: tree },
              },
            );
            (_b = runMiddleware(middleware)), (authUrl = _b.url), (authInit = _b.init);
            authzOptions.url = authUrl.toString();
            authzOptions.init = authInit;
            return [4 /*yield*/, this._request(authzOptions, false)];
          case 8:
            initialStep = _c.sent();
            return [4 /*yield*/, isAuthzStep(initialStep)];
          case 9:
            if (!_c.sent()) {
              throw new Error('Error: Initial response from auth server not a "step".');
            }
            if (!hasAuthzAdvice(authorizationJSON)) {
              throw new Error('Error: Transactional or Service Advice is empty.');
            }
            // Walk through auth tree
            return [
              4 /*yield*/,
              this.stepIterator(initialStep, options.authorization.handleStep, type, tree),
            ];
          case 10:
            // Walk through auth tree
            _c.sent();
            tokens = void 0;
            _c.label = 11;
          case 11:
            _c.trys.push([11, 13, , 14]);
            return [4 /*yield*/, TokenStorage.get()];
          case 12:
            tokens = _c.sent();
            return [3 /*break*/, 14];
          case 13:
            _c.sent();
            return [3 /*break*/, 14];
          case 14:
            if (hasIG) {
              // Update URL with IDs and tokens for IG
              options.url = addAuthzInfoToURL(options.url, authorizationJSON.advices, tokens);
            } else {
              // Update headers with IDs and tokens for REST API
              options.init.headers = addAuthzInfoToHeaders(
                options.init,
                authorizationJSON.advices,
                tokens,
              );
            }
            return [4 /*yield*/, this._request(options, false)];
          case 15:
            // Retry original resource request
            res = _c.sent();
            _c.label = 16;
          case 16:
            return [2 /*return*/, res];
        }
      });
    });
  };
  HttpClient.setAuthHeaders = function (headers, forceRenew) {
    return __awaiter(this, void 0, void 0, function () {
      var tokens;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            _a.trys.push([0, 2, , 3]);
            return [4 /*yield*/, TokenStorage.get()];
          case 1:
            tokens = _a.sent();
            return [3 /*break*/, 3];
          case 2:
            _a.sent();
            return [3 /*break*/, 3];
          case 3:
            if (!(tokens && tokens.accessToken)) return [3 /*break*/, 5];
            return [4 /*yield*/, TokenManager.getTokens({ forceRenew: forceRenew })];
          case 4:
            // Access tokens are an OAuth artifact
            tokens = _a.sent();
            // TODO: Temp fix; refactor this in next txn auth story
            if (tokens && tokens.accessToken) {
              headers.set('Authorization', 'Bearer '.concat(tokens.accessToken));
            }
            _a.label = 5;
          case 5:
            return [2 /*return*/, headers];
        }
      });
    });
  };
  HttpClient.stepIterator = function (res, handleStep, type, tree) {
    return __awaiter(this, void 0, void 0, function () {
      var jsonRes, initialStep;
      var _this = this;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, res.json()];
          case 1:
            jsonRes = _a.sent();
            initialStep = new FRStep(jsonRes);
            // eslint-disable-next-line no-async-promise-executor
            return [
              2 /*return*/,
              new Promise(function (resolve, reject) {
                return __awaiter(_this, void 0, void 0, function () {
                  function handleNext(step) {
                    return __awaiter(this, void 0, void 0, function () {
                      var input, output;
                      return __generator(this, function (_a) {
                        switch (_a.label) {
                          case 0:
                            return [4 /*yield*/, handleStep(step)];
                          case 1:
                            input = _a.sent();
                            return [4 /*yield*/, FRAuth.next(input, { type: type, tree: tree })];
                          case 2:
                            output = _a.sent();
                            if (output.type === StepType.LoginSuccess) {
                              resolve();
                            } else if (output.type === StepType.LoginFailure) {
                              reject('Authentication tree failure.');
                            } else {
                              handleNext(output);
                            }
                            return [2 /*return*/];
                        }
                      });
                    });
                  }
                  return __generator(this, function (_a) {
                    handleNext(initialStep);
                    return [2 /*return*/];
                  });
                });
              }),
            ];
        }
      });
    });
  };
  HttpClient._request = function (options, forceRenew) {
    return __awaiter(this, void 0, void 0, function () {
      var url, init, timeout, headers;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            (url = options.url), (init = options.init), (timeout = options.timeout);
            headers = new Headers(init.headers || {});
            if (!!options.bypassAuthentication) return [3 /*break*/, 2];
            return [4 /*yield*/, this.setAuthHeaders(headers, forceRenew)];
          case 1:
            headers = _a.sent();
            _a.label = 2;
          case 2:
            init.headers = headers;
            return [2 /*return*/, withTimeout(fetch(url, init), timeout)];
        }
      });
    });
  };
  return HttpClient;
})(Dispatcher);

var lib$1 = { exports: {} };

var _default$1 = {};

var lib = { exports: {} };

var _default = {};

/**
 * cssfilter
 *
 * @author 老雷<leizongmin@gmail.com>
 */

function getDefaultWhiteList$1() {
  // 白名单值说明：
  // true: 允许该属性
  // Function: function (val) { } 返回true表示允许该属性，其他值均表示不允许
  // RegExp: regexp.test(val) 返回true表示允许该属性，其他值均表示不允许
  // 除上面列出的值外均表示不允许
  var whiteList = {};

  whiteList['align-content'] = false; // default: auto
  whiteList['align-items'] = false; // default: auto
  whiteList['align-self'] = false; // default: auto
  whiteList['alignment-adjust'] = false; // default: auto
  whiteList['alignment-baseline'] = false; // default: baseline
  whiteList['all'] = false; // default: depending on individual properties
  whiteList['anchor-point'] = false; // default: none
  whiteList['animation'] = false; // default: depending on individual properties
  whiteList['animation-delay'] = false; // default: 0
  whiteList['animation-direction'] = false; // default: normal
  whiteList['animation-duration'] = false; // default: 0
  whiteList['animation-fill-mode'] = false; // default: none
  whiteList['animation-iteration-count'] = false; // default: 1
  whiteList['animation-name'] = false; // default: none
  whiteList['animation-play-state'] = false; // default: running
  whiteList['animation-timing-function'] = false; // default: ease
  whiteList['azimuth'] = false; // default: center
  whiteList['backface-visibility'] = false; // default: visible
  whiteList['background'] = true; // default: depending on individual properties
  whiteList['background-attachment'] = true; // default: scroll
  whiteList['background-clip'] = true; // default: border-box
  whiteList['background-color'] = true; // default: transparent
  whiteList['background-image'] = true; // default: none
  whiteList['background-origin'] = true; // default: padding-box
  whiteList['background-position'] = true; // default: 0% 0%
  whiteList['background-repeat'] = true; // default: repeat
  whiteList['background-size'] = true; // default: auto
  whiteList['baseline-shift'] = false; // default: baseline
  whiteList['binding'] = false; // default: none
  whiteList['bleed'] = false; // default: 6pt
  whiteList['bookmark-label'] = false; // default: content()
  whiteList['bookmark-level'] = false; // default: none
  whiteList['bookmark-state'] = false; // default: open
  whiteList['border'] = true; // default: depending on individual properties
  whiteList['border-bottom'] = true; // default: depending on individual properties
  whiteList['border-bottom-color'] = true; // default: current color
  whiteList['border-bottom-left-radius'] = true; // default: 0
  whiteList['border-bottom-right-radius'] = true; // default: 0
  whiteList['border-bottom-style'] = true; // default: none
  whiteList['border-bottom-width'] = true; // default: medium
  whiteList['border-collapse'] = true; // default: separate
  whiteList['border-color'] = true; // default: depending on individual properties
  whiteList['border-image'] = true; // default: none
  whiteList['border-image-outset'] = true; // default: 0
  whiteList['border-image-repeat'] = true; // default: stretch
  whiteList['border-image-slice'] = true; // default: 100%
  whiteList['border-image-source'] = true; // default: none
  whiteList['border-image-width'] = true; // default: 1
  whiteList['border-left'] = true; // default: depending on individual properties
  whiteList['border-left-color'] = true; // default: current color
  whiteList['border-left-style'] = true; // default: none
  whiteList['border-left-width'] = true; // default: medium
  whiteList['border-radius'] = true; // default: 0
  whiteList['border-right'] = true; // default: depending on individual properties
  whiteList['border-right-color'] = true; // default: current color
  whiteList['border-right-style'] = true; // default: none
  whiteList['border-right-width'] = true; // default: medium
  whiteList['border-spacing'] = true; // default: 0
  whiteList['border-style'] = true; // default: depending on individual properties
  whiteList['border-top'] = true; // default: depending on individual properties
  whiteList['border-top-color'] = true; // default: current color
  whiteList['border-top-left-radius'] = true; // default: 0
  whiteList['border-top-right-radius'] = true; // default: 0
  whiteList['border-top-style'] = true; // default: none
  whiteList['border-top-width'] = true; // default: medium
  whiteList['border-width'] = true; // default: depending on individual properties
  whiteList['bottom'] = false; // default: auto
  whiteList['box-decoration-break'] = true; // default: slice
  whiteList['box-shadow'] = true; // default: none
  whiteList['box-sizing'] = true; // default: content-box
  whiteList['box-snap'] = true; // default: none
  whiteList['box-suppress'] = true; // default: show
  whiteList['break-after'] = true; // default: auto
  whiteList['break-before'] = true; // default: auto
  whiteList['break-inside'] = true; // default: auto
  whiteList['caption-side'] = false; // default: top
  whiteList['chains'] = false; // default: none
  whiteList['clear'] = true; // default: none
  whiteList['clip'] = false; // default: auto
  whiteList['clip-path'] = false; // default: none
  whiteList['clip-rule'] = false; // default: nonzero
  whiteList['color'] = true; // default: implementation dependent
  whiteList['color-interpolation-filters'] = true; // default: auto
  whiteList['column-count'] = false; // default: auto
  whiteList['column-fill'] = false; // default: balance
  whiteList['column-gap'] = false; // default: normal
  whiteList['column-rule'] = false; // default: depending on individual properties
  whiteList['column-rule-color'] = false; // default: current color
  whiteList['column-rule-style'] = false; // default: medium
  whiteList['column-rule-width'] = false; // default: medium
  whiteList['column-span'] = false; // default: none
  whiteList['column-width'] = false; // default: auto
  whiteList['columns'] = false; // default: depending on individual properties
  whiteList['contain'] = false; // default: none
  whiteList['content'] = false; // default: normal
  whiteList['counter-increment'] = false; // default: none
  whiteList['counter-reset'] = false; // default: none
  whiteList['counter-set'] = false; // default: none
  whiteList['crop'] = false; // default: auto
  whiteList['cue'] = false; // default: depending on individual properties
  whiteList['cue-after'] = false; // default: none
  whiteList['cue-before'] = false; // default: none
  whiteList['cursor'] = false; // default: auto
  whiteList['direction'] = false; // default: ltr
  whiteList['display'] = true; // default: depending on individual properties
  whiteList['display-inside'] = true; // default: auto
  whiteList['display-list'] = true; // default: none
  whiteList['display-outside'] = true; // default: inline-level
  whiteList['dominant-baseline'] = false; // default: auto
  whiteList['elevation'] = false; // default: level
  whiteList['empty-cells'] = false; // default: show
  whiteList['filter'] = false; // default: none
  whiteList['flex'] = false; // default: depending on individual properties
  whiteList['flex-basis'] = false; // default: auto
  whiteList['flex-direction'] = false; // default: row
  whiteList['flex-flow'] = false; // default: depending on individual properties
  whiteList['flex-grow'] = false; // default: 0
  whiteList['flex-shrink'] = false; // default: 1
  whiteList['flex-wrap'] = false; // default: nowrap
  whiteList['float'] = false; // default: none
  whiteList['float-offset'] = false; // default: 0 0
  whiteList['flood-color'] = false; // default: black
  whiteList['flood-opacity'] = false; // default: 1
  whiteList['flow-from'] = false; // default: none
  whiteList['flow-into'] = false; // default: none
  whiteList['font'] = true; // default: depending on individual properties
  whiteList['font-family'] = true; // default: implementation dependent
  whiteList['font-feature-settings'] = true; // default: normal
  whiteList['font-kerning'] = true; // default: auto
  whiteList['font-language-override'] = true; // default: normal
  whiteList['font-size'] = true; // default: medium
  whiteList['font-size-adjust'] = true; // default: none
  whiteList['font-stretch'] = true; // default: normal
  whiteList['font-style'] = true; // default: normal
  whiteList['font-synthesis'] = true; // default: weight style
  whiteList['font-variant'] = true; // default: normal
  whiteList['font-variant-alternates'] = true; // default: normal
  whiteList['font-variant-caps'] = true; // default: normal
  whiteList['font-variant-east-asian'] = true; // default: normal
  whiteList['font-variant-ligatures'] = true; // default: normal
  whiteList['font-variant-numeric'] = true; // default: normal
  whiteList['font-variant-position'] = true; // default: normal
  whiteList['font-weight'] = true; // default: normal
  whiteList['grid'] = false; // default: depending on individual properties
  whiteList['grid-area'] = false; // default: depending on individual properties
  whiteList['grid-auto-columns'] = false; // default: auto
  whiteList['grid-auto-flow'] = false; // default: none
  whiteList['grid-auto-rows'] = false; // default: auto
  whiteList['grid-column'] = false; // default: depending on individual properties
  whiteList['grid-column-end'] = false; // default: auto
  whiteList['grid-column-start'] = false; // default: auto
  whiteList['grid-row'] = false; // default: depending on individual properties
  whiteList['grid-row-end'] = false; // default: auto
  whiteList['grid-row-start'] = false; // default: auto
  whiteList['grid-template'] = false; // default: depending on individual properties
  whiteList['grid-template-areas'] = false; // default: none
  whiteList['grid-template-columns'] = false; // default: none
  whiteList['grid-template-rows'] = false; // default: none
  whiteList['hanging-punctuation'] = false; // default: none
  whiteList['height'] = true; // default: auto
  whiteList['hyphens'] = false; // default: manual
  whiteList['icon'] = false; // default: auto
  whiteList['image-orientation'] = false; // default: auto
  whiteList['image-resolution'] = false; // default: normal
  whiteList['ime-mode'] = false; // default: auto
  whiteList['initial-letters'] = false; // default: normal
  whiteList['inline-box-align'] = false; // default: last
  whiteList['justify-content'] = false; // default: auto
  whiteList['justify-items'] = false; // default: auto
  whiteList['justify-self'] = false; // default: auto
  whiteList['left'] = false; // default: auto
  whiteList['letter-spacing'] = true; // default: normal
  whiteList['lighting-color'] = true; // default: white
  whiteList['line-box-contain'] = false; // default: block inline replaced
  whiteList['line-break'] = false; // default: auto
  whiteList['line-grid'] = false; // default: match-parent
  whiteList['line-height'] = false; // default: normal
  whiteList['line-snap'] = false; // default: none
  whiteList['line-stacking'] = false; // default: depending on individual properties
  whiteList['line-stacking-ruby'] = false; // default: exclude-ruby
  whiteList['line-stacking-shift'] = false; // default: consider-shifts
  whiteList['line-stacking-strategy'] = false; // default: inline-line-height
  whiteList['list-style'] = true; // default: depending on individual properties
  whiteList['list-style-image'] = true; // default: none
  whiteList['list-style-position'] = true; // default: outside
  whiteList['list-style-type'] = true; // default: disc
  whiteList['margin'] = true; // default: depending on individual properties
  whiteList['margin-bottom'] = true; // default: 0
  whiteList['margin-left'] = true; // default: 0
  whiteList['margin-right'] = true; // default: 0
  whiteList['margin-top'] = true; // default: 0
  whiteList['marker-offset'] = false; // default: auto
  whiteList['marker-side'] = false; // default: list-item
  whiteList['marks'] = false; // default: none
  whiteList['mask'] = false; // default: border-box
  whiteList['mask-box'] = false; // default: see individual properties
  whiteList['mask-box-outset'] = false; // default: 0
  whiteList['mask-box-repeat'] = false; // default: stretch
  whiteList['mask-box-slice'] = false; // default: 0 fill
  whiteList['mask-box-source'] = false; // default: none
  whiteList['mask-box-width'] = false; // default: auto
  whiteList['mask-clip'] = false; // default: border-box
  whiteList['mask-image'] = false; // default: none
  whiteList['mask-origin'] = false; // default: border-box
  whiteList['mask-position'] = false; // default: center
  whiteList['mask-repeat'] = false; // default: no-repeat
  whiteList['mask-size'] = false; // default: border-box
  whiteList['mask-source-type'] = false; // default: auto
  whiteList['mask-type'] = false; // default: luminance
  whiteList['max-height'] = true; // default: none
  whiteList['max-lines'] = false; // default: none
  whiteList['max-width'] = true; // default: none
  whiteList['min-height'] = true; // default: 0
  whiteList['min-width'] = true; // default: 0
  whiteList['move-to'] = false; // default: normal
  whiteList['nav-down'] = false; // default: auto
  whiteList['nav-index'] = false; // default: auto
  whiteList['nav-left'] = false; // default: auto
  whiteList['nav-right'] = false; // default: auto
  whiteList['nav-up'] = false; // default: auto
  whiteList['object-fit'] = false; // default: fill
  whiteList['object-position'] = false; // default: 50% 50%
  whiteList['opacity'] = false; // default: 1
  whiteList['order'] = false; // default: 0
  whiteList['orphans'] = false; // default: 2
  whiteList['outline'] = false; // default: depending on individual properties
  whiteList['outline-color'] = false; // default: invert
  whiteList['outline-offset'] = false; // default: 0
  whiteList['outline-style'] = false; // default: none
  whiteList['outline-width'] = false; // default: medium
  whiteList['overflow'] = false; // default: depending on individual properties
  whiteList['overflow-wrap'] = false; // default: normal
  whiteList['overflow-x'] = false; // default: visible
  whiteList['overflow-y'] = false; // default: visible
  whiteList['padding'] = true; // default: depending on individual properties
  whiteList['padding-bottom'] = true; // default: 0
  whiteList['padding-left'] = true; // default: 0
  whiteList['padding-right'] = true; // default: 0
  whiteList['padding-top'] = true; // default: 0
  whiteList['page'] = false; // default: auto
  whiteList['page-break-after'] = false; // default: auto
  whiteList['page-break-before'] = false; // default: auto
  whiteList['page-break-inside'] = false; // default: auto
  whiteList['page-policy'] = false; // default: start
  whiteList['pause'] = false; // default: implementation dependent
  whiteList['pause-after'] = false; // default: implementation dependent
  whiteList['pause-before'] = false; // default: implementation dependent
  whiteList['perspective'] = false; // default: none
  whiteList['perspective-origin'] = false; // default: 50% 50%
  whiteList['pitch'] = false; // default: medium
  whiteList['pitch-range'] = false; // default: 50
  whiteList['play-during'] = false; // default: auto
  whiteList['position'] = false; // default: static
  whiteList['presentation-level'] = false; // default: 0
  whiteList['quotes'] = false; // default: text
  whiteList['region-fragment'] = false; // default: auto
  whiteList['resize'] = false; // default: none
  whiteList['rest'] = false; // default: depending on individual properties
  whiteList['rest-after'] = false; // default: none
  whiteList['rest-before'] = false; // default: none
  whiteList['richness'] = false; // default: 50
  whiteList['right'] = false; // default: auto
  whiteList['rotation'] = false; // default: 0
  whiteList['rotation-point'] = false; // default: 50% 50%
  whiteList['ruby-align'] = false; // default: auto
  whiteList['ruby-merge'] = false; // default: separate
  whiteList['ruby-position'] = false; // default: before
  whiteList['shape-image-threshold'] = false; // default: 0.0
  whiteList['shape-outside'] = false; // default: none
  whiteList['shape-margin'] = false; // default: 0
  whiteList['size'] = false; // default: auto
  whiteList['speak'] = false; // default: auto
  whiteList['speak-as'] = false; // default: normal
  whiteList['speak-header'] = false; // default: once
  whiteList['speak-numeral'] = false; // default: continuous
  whiteList['speak-punctuation'] = false; // default: none
  whiteList['speech-rate'] = false; // default: medium
  whiteList['stress'] = false; // default: 50
  whiteList['string-set'] = false; // default: none
  whiteList['tab-size'] = false; // default: 8
  whiteList['table-layout'] = false; // default: auto
  whiteList['text-align'] = true; // default: start
  whiteList['text-align-last'] = true; // default: auto
  whiteList['text-combine-upright'] = true; // default: none
  whiteList['text-decoration'] = true; // default: none
  whiteList['text-decoration-color'] = true; // default: currentColor
  whiteList['text-decoration-line'] = true; // default: none
  whiteList['text-decoration-skip'] = true; // default: objects
  whiteList['text-decoration-style'] = true; // default: solid
  whiteList['text-emphasis'] = true; // default: depending on individual properties
  whiteList['text-emphasis-color'] = true; // default: currentColor
  whiteList['text-emphasis-position'] = true; // default: over right
  whiteList['text-emphasis-style'] = true; // default: none
  whiteList['text-height'] = true; // default: auto
  whiteList['text-indent'] = true; // default: 0
  whiteList['text-justify'] = true; // default: auto
  whiteList['text-orientation'] = true; // default: mixed
  whiteList['text-overflow'] = true; // default: clip
  whiteList['text-shadow'] = true; // default: none
  whiteList['text-space-collapse'] = true; // default: collapse
  whiteList['text-transform'] = true; // default: none
  whiteList['text-underline-position'] = true; // default: auto
  whiteList['text-wrap'] = true; // default: normal
  whiteList['top'] = false; // default: auto
  whiteList['transform'] = false; // default: none
  whiteList['transform-origin'] = false; // default: 50% 50% 0
  whiteList['transform-style'] = false; // default: flat
  whiteList['transition'] = false; // default: depending on individual properties
  whiteList['transition-delay'] = false; // default: 0s
  whiteList['transition-duration'] = false; // default: 0s
  whiteList['transition-property'] = false; // default: all
  whiteList['transition-timing-function'] = false; // default: ease
  whiteList['unicode-bidi'] = false; // default: normal
  whiteList['vertical-align'] = false; // default: baseline
  whiteList['visibility'] = false; // default: visible
  whiteList['voice-balance'] = false; // default: center
  whiteList['voice-duration'] = false; // default: auto
  whiteList['voice-family'] = false; // default: implementation dependent
  whiteList['voice-pitch'] = false; // default: medium
  whiteList['voice-range'] = false; // default: medium
  whiteList['voice-rate'] = false; // default: normal
  whiteList['voice-stress'] = false; // default: normal
  whiteList['voice-volume'] = false; // default: medium
  whiteList['volume'] = false; // default: medium
  whiteList['white-space'] = false; // default: normal
  whiteList['widows'] = false; // default: 2
  whiteList['width'] = true; // default: auto
  whiteList['will-change'] = false; // default: auto
  whiteList['word-break'] = true; // default: normal
  whiteList['word-spacing'] = true; // default: normal
  whiteList['word-wrap'] = true; // default: normal
  whiteList['wrap-flow'] = false; // default: auto
  whiteList['wrap-through'] = false; // default: wrap
  whiteList['writing-mode'] = false; // default: horizontal-tb
  whiteList['z-index'] = false; // default: auto

  return whiteList;
}

/**
 * 匹配到白名单上的一个属性时
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {String}
 */
function onAttr(name, value, options) {
  // do nothing
}

/**
 * 匹配到不在白名单上的一个属性时
 *
 * @param {String} name
 * @param {String} value
 * @param {Object} options
 * @return {String}
 */
function onIgnoreAttr(name, value, options) {
  // do nothing
}

var REGEXP_URL_JAVASCRIPT = /javascript\s*\:/gim;

/**
 * 过滤属性值
 *
 * @param {String} name
 * @param {String} value
 * @return {String}
 */
function safeAttrValue$1(name, value) {
  if (REGEXP_URL_JAVASCRIPT.test(value)) return '';
  return value;
}

_default.whiteList = getDefaultWhiteList$1();
_default.getDefaultWhiteList = getDefaultWhiteList$1;
_default.onAttr = onAttr;
_default.onIgnoreAttr = onIgnoreAttr;
_default.safeAttrValue = safeAttrValue$1;

var util$2 = {
  indexOf: function (arr, item) {
    var i, j;
    if (Array.prototype.indexOf) {
      return arr.indexOf(item);
    }
    for (i = 0, j = arr.length; i < j; i++) {
      if (arr[i] === item) {
        return i;
      }
    }
    return -1;
  },
  forEach: function (arr, fn, scope) {
    var i, j;
    if (Array.prototype.forEach) {
      return arr.forEach(fn, scope);
    }
    for (i = 0, j = arr.length; i < j; i++) {
      fn.call(scope, arr[i], i, arr);
    }
  },
  trim: function (str) {
    if (String.prototype.trim) {
      return str.trim();
    }
    return str.replace(/(^\s*)|(\s*$)/g, '');
  },
  trimRight: function (str) {
    if (String.prototype.trimRight) {
      return str.trimRight();
    }
    return str.replace(/(\s*$)/g, '');
  },
};

/**
 * cssfilter
 *
 * @author 老雷<leizongmin@gmail.com>
 */

var _$3 = util$2;

/**
 * 解析style
 *
 * @param {String} css
 * @param {Function} onAttr 处理属性的函数
 *   参数格式： function (sourcePosition, position, name, value, source)
 * @return {String}
 */
function parseStyle$1(css, onAttr) {
  css = _$3.trimRight(css);
  if (css[css.length - 1] !== ';') css += ';';
  var cssLength = css.length;
  var isParenthesisOpen = false;
  var lastPos = 0;
  var i = 0;
  var retCSS = '';

  function addNewAttr() {
    // 如果没有正常的闭合圆括号，则直接忽略当前属性
    if (!isParenthesisOpen) {
      var source = _$3.trim(css.slice(lastPos, i));
      var j = source.indexOf(':');
      if (j !== -1) {
        var name = _$3.trim(source.slice(0, j));
        var value = _$3.trim(source.slice(j + 1));
        // 必须有属性名称
        if (name) {
          var ret = onAttr(lastPos, retCSS.length, name, value, source);
          if (ret) retCSS += ret + '; ';
        }
      }
    }
    lastPos = i + 1;
  }

  for (; i < cssLength; i++) {
    var c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      // 备注开始
      var j = css.indexOf('*/', i + 2);
      // 如果没有正常的备注结束，则后面的部分全部跳过
      if (j === -1) break;
      // 直接将当前位置调到备注结尾，并且初始化状态
      i = j + 1;
      lastPos = i + 1;
      isParenthesisOpen = false;
    } else if (c === '(') {
      isParenthesisOpen = true;
    } else if (c === ')') {
      isParenthesisOpen = false;
    } else if (c === ';') {
      if (isParenthesisOpen);
      else {
        addNewAttr();
      }
    } else if (c === '\n') {
      addNewAttr();
    }
  }

  return _$3.trim(retCSS);
}

var parser$2 = parseStyle$1;

/**
 * cssfilter
 *
 * @author 老雷<leizongmin@gmail.com>
 */

var DEFAULT$1 = _default;
var parseStyle = parser$2;

/**
 * 返回值是否为空
 *
 * @param {Object} obj
 * @return {Boolean}
 */
function isNull$1(obj) {
  return obj === undefined || obj === null;
}

/**
 * 浅拷贝对象
 *
 * @param {Object} obj
 * @return {Object}
 */
function shallowCopyObject$1(obj) {
  var ret = {};
  for (var i in obj) {
    ret[i] = obj[i];
  }
  return ret;
}

/**
 * 创建CSS过滤器
 *
 * @param {Object} options
 *   - {Object} whiteList
 *   - {Function} onAttr
 *   - {Function} onIgnoreAttr
 *   - {Function} safeAttrValue
 */
function FilterCSS$2(options) {
  options = shallowCopyObject$1(options || {});
  options.whiteList = options.whiteList || DEFAULT$1.whiteList;
  options.onAttr = options.onAttr || DEFAULT$1.onAttr;
  options.onIgnoreAttr = options.onIgnoreAttr || DEFAULT$1.onIgnoreAttr;
  options.safeAttrValue = options.safeAttrValue || DEFAULT$1.safeAttrValue;
  this.options = options;
}

FilterCSS$2.prototype.process = function (css) {
  // 兼容各种奇葩输入
  css = css || '';
  css = css.toString();
  if (!css) return '';

  var me = this;
  var options = me.options;
  var whiteList = options.whiteList;
  var onAttr = options.onAttr;
  var onIgnoreAttr = options.onIgnoreAttr;
  var safeAttrValue = options.safeAttrValue;

  var retCSS = parseStyle(css, function (sourcePosition, position, name, value, source) {
    var check = whiteList[name];
    var isWhite = false;
    if (check === true) isWhite = check;
    else if (typeof check === 'function') isWhite = check(value);
    else if (check instanceof RegExp) isWhite = check.test(value);
    if (isWhite !== true) isWhite = false;

    // 如果过滤后 value 为空则直接忽略
    value = safeAttrValue(name, value);
    if (!value) return;

    var opts = {
      position: position,
      sourcePosition: sourcePosition,
      source: source,
      isWhite: isWhite,
    };

    if (isWhite) {
      var ret = onAttr(name, value, opts);
      if (isNull$1(ret)) {
        return name + ':' + value;
      } else {
        return ret;
      }
    } else {
      var ret = onIgnoreAttr(name, value, opts);
      if (!isNull$1(ret)) {
        return ret;
      }
    }
  });

  return retCSS;
};

var css = FilterCSS$2;

/**
 * cssfilter
 *
 * @author 老雷<leizongmin@gmail.com>
 */

(function (module, exports) {
  var DEFAULT = _default;
  var FilterCSS = css;

  /**
   * XSS过滤
   *
   * @param {String} css 要过滤的CSS代码
   * @param {Object} options 选项：whiteList, onAttr, onIgnoreAttr
   * @return {String}
   */
  function filterCSS(html, options) {
    var xss = new FilterCSS(options);
    return xss.process(html);
  }

  // 输出
  exports = module.exports = filterCSS;
  exports.FilterCSS = FilterCSS;
  for (var i in DEFAULT) exports[i] = DEFAULT[i];

  // 在浏览器端使用
  if (typeof window !== 'undefined') {
    window.filterCSS = module.exports;
  }
})(lib, lib.exports);

var util$1 = {
  indexOf: function (arr, item) {
    var i, j;
    if (Array.prototype.indexOf) {
      return arr.indexOf(item);
    }
    for (i = 0, j = arr.length; i < j; i++) {
      if (arr[i] === item) {
        return i;
      }
    }
    return -1;
  },
  forEach: function (arr, fn, scope) {
    var i, j;
    if (Array.prototype.forEach) {
      return arr.forEach(fn, scope);
    }
    for (i = 0, j = arr.length; i < j; i++) {
      fn.call(scope, arr[i], i, arr);
    }
  },
  trim: function (str) {
    if (String.prototype.trim) {
      return str.trim();
    }
    return str.replace(/(^\s*)|(\s*$)/g, '');
  },
  spaceIndex: function (str) {
    var reg = /\s|\n|\t/;
    var match = reg.exec(str);
    return match ? match.index : -1;
  },
};

/**
 * default settings
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */

var FilterCSS$1 = lib.exports.FilterCSS;
var getDefaultCSSWhiteList = lib.exports.getDefaultWhiteList;
var _$2 = util$1;

function getDefaultWhiteList() {
  return {
    a: ['target', 'href', 'title'],
    abbr: ['title'],
    address: [],
    area: ['shape', 'coords', 'href', 'alt'],
    article: [],
    aside: [],
    audio: ['autoplay', 'controls', 'crossorigin', 'loop', 'muted', 'preload', 'src'],
    b: [],
    bdi: ['dir'],
    bdo: ['dir'],
    big: [],
    blockquote: ['cite'],
    br: [],
    caption: [],
    center: [],
    cite: [],
    code: [],
    col: ['align', 'valign', 'span', 'width'],
    colgroup: ['align', 'valign', 'span', 'width'],
    dd: [],
    del: ['datetime'],
    details: ['open'],
    div: [],
    dl: [],
    dt: [],
    em: [],
    figcaption: [],
    figure: [],
    font: ['color', 'size', 'face'],
    footer: [],
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
    header: [],
    hr: [],
    i: [],
    img: ['src', 'alt', 'title', 'width', 'height'],
    ins: ['datetime'],
    li: [],
    mark: [],
    nav: [],
    ol: [],
    p: [],
    pre: [],
    s: [],
    section: [],
    small: [],
    span: [],
    sub: [],
    summary: [],
    sup: [],
    strong: [],
    strike: [],
    table: ['width', 'border', 'align', 'valign'],
    tbody: ['align', 'valign'],
    td: ['width', 'rowspan', 'colspan', 'align', 'valign'],
    tfoot: ['align', 'valign'],
    th: ['width', 'rowspan', 'colspan', 'align', 'valign'],
    thead: ['align', 'valign'],
    tr: ['rowspan', 'align', 'valign'],
    tt: [],
    u: [],
    ul: [],
    video: [
      'autoplay',
      'controls',
      'crossorigin',
      'loop',
      'muted',
      'playsinline',
      'poster',
      'preload',
      'src',
      'height',
      'width',
    ],
  };
}

var defaultCSSFilter = new FilterCSS$1();

/**
 * default onTag function
 *
 * @param {String} tag
 * @param {String} html
 * @param {Object} options
 * @return {String}
 */
function onTag(tag, html, options) {
  // do nothing
}

/**
 * default onIgnoreTag function
 *
 * @param {String} tag
 * @param {String} html
 * @param {Object} options
 * @return {String}
 */
function onIgnoreTag(tag, html, options) {
  // do nothing
}

/**
 * default onTagAttr function
 *
 * @param {String} tag
 * @param {String} name
 * @param {String} value
 * @return {String}
 */
function onTagAttr(tag, name, value) {
  // do nothing
}

/**
 * default onIgnoreTagAttr function
 *
 * @param {String} tag
 * @param {String} name
 * @param {String} value
 * @return {String}
 */
function onIgnoreTagAttr(tag, name, value) {
  // do nothing
}

/**
 * default escapeHtml function
 *
 * @param {String} html
 */
function escapeHtml(html) {
  return html.replace(REGEXP_LT, '&lt;').replace(REGEXP_GT, '&gt;');
}

/**
 * default safeAttrValue function
 *
 * @param {String} tag
 * @param {String} name
 * @param {String} value
 * @param {Object} cssFilter
 * @return {String}
 */
function safeAttrValue(tag, name, value, cssFilter) {
  // unescape attribute value firstly
  value = friendlyAttrValue(value);

  if (name === 'href' || name === 'src') {
    // filter `href` and `src` attribute
    // only allow the value that starts with `http://` | `https://` | `mailto:` | `/` | `#`
    value = _$2.trim(value);
    if (value === '#') return '#';
    if (
      !(
        value.substr(0, 7) === 'http://' ||
        value.substr(0, 8) === 'https://' ||
        value.substr(0, 7) === 'mailto:' ||
        value.substr(0, 4) === 'tel:' ||
        value.substr(0, 11) === 'data:image/' ||
        value.substr(0, 6) === 'ftp://' ||
        value.substr(0, 2) === './' ||
        value.substr(0, 3) === '../' ||
        value[0] === '#' ||
        value[0] === '/'
      )
    ) {
      return '';
    }
  } else if (name === 'background') {
    // filter `background` attribute (maybe no use)
    // `javascript:`
    REGEXP_DEFAULT_ON_TAG_ATTR_4.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_4.test(value)) {
      return '';
    }
  } else if (name === 'style') {
    // `expression()`
    REGEXP_DEFAULT_ON_TAG_ATTR_7.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_7.test(value)) {
      return '';
    }
    // `url()`
    REGEXP_DEFAULT_ON_TAG_ATTR_8.lastIndex = 0;
    if (REGEXP_DEFAULT_ON_TAG_ATTR_8.test(value)) {
      REGEXP_DEFAULT_ON_TAG_ATTR_4.lastIndex = 0;
      if (REGEXP_DEFAULT_ON_TAG_ATTR_4.test(value)) {
        return '';
      }
    }
    if (cssFilter !== false) {
      cssFilter = cssFilter || defaultCSSFilter;
      value = cssFilter.process(value);
    }
  }

  // escape `<>"` before returns
  value = escapeAttrValue(value);
  return value;
}

// RegExp list
var REGEXP_LT = /</g;
var REGEXP_GT = />/g;
var REGEXP_QUOTE = /"/g;
var REGEXP_QUOTE_2 = /&quot;/g;
var REGEXP_ATTR_VALUE_1 = /&#([a-zA-Z0-9]*);?/gim;
var REGEXP_ATTR_VALUE_COLON = /&colon;?/gim;
var REGEXP_ATTR_VALUE_NEWLINE = /&newline;?/gim;
// var REGEXP_DEFAULT_ON_TAG_ATTR_3 = /\/\*|\*\//gm;
var REGEXP_DEFAULT_ON_TAG_ATTR_4 =
  /((j\s*a\s*v\s*a|v\s*b|l\s*i\s*v\s*e)\s*s\s*c\s*r\s*i\s*p\s*t\s*|m\s*o\s*c\s*h\s*a):/gi;
// var REGEXP_DEFAULT_ON_TAG_ATTR_5 = /^[\s"'`]*(d\s*a\s*t\s*a\s*)\:/gi;
// var REGEXP_DEFAULT_ON_TAG_ATTR_6 = /^[\s"'`]*(d\s*a\s*t\s*a\s*)\:\s*image\//gi;
var REGEXP_DEFAULT_ON_TAG_ATTR_7 = /e\s*x\s*p\s*r\s*e\s*s\s*s\s*i\s*o\s*n\s*\(.*/gi;
var REGEXP_DEFAULT_ON_TAG_ATTR_8 = /u\s*r\s*l\s*\(.*/gi;

/**
 * escape double quote
 *
 * @param {String} str
 * @return {String} str
 */
function escapeQuote(str) {
  return str.replace(REGEXP_QUOTE, '&quot;');
}

/**
 * unescape double quote
 *
 * @param {String} str
 * @return {String} str
 */
function unescapeQuote(str) {
  return str.replace(REGEXP_QUOTE_2, '"');
}

/**
 * escape html entities
 *
 * @param {String} str
 * @return {String}
 */
function escapeHtmlEntities(str) {
  return str.replace(REGEXP_ATTR_VALUE_1, function replaceUnicode(str, code) {
    return code[0] === 'x' || code[0] === 'X'
      ? String.fromCharCode(parseInt(code.substr(1), 16))
      : String.fromCharCode(parseInt(code, 10));
  });
}

/**
 * escape html5 new danger entities
 *
 * @param {String} str
 * @return {String}
 */
function escapeDangerHtml5Entities(str) {
  return str.replace(REGEXP_ATTR_VALUE_COLON, ':').replace(REGEXP_ATTR_VALUE_NEWLINE, ' ');
}

/**
 * clear nonprintable characters
 *
 * @param {String} str
 * @return {String}
 */
function clearNonPrintableCharacter(str) {
  var str2 = '';
  for (var i = 0, len = str.length; i < len; i++) {
    str2 += str.charCodeAt(i) < 32 ? ' ' : str.charAt(i);
  }
  return _$2.trim(str2);
}

/**
 * get friendly attribute value
 *
 * @param {String} str
 * @return {String}
 */
function friendlyAttrValue(str) {
  str = unescapeQuote(str);
  str = escapeHtmlEntities(str);
  str = escapeDangerHtml5Entities(str);
  str = clearNonPrintableCharacter(str);
  return str;
}

/**
 * unescape attribute value
 *
 * @param {String} str
 * @return {String}
 */
function escapeAttrValue(str) {
  str = escapeQuote(str);
  str = escapeHtml(str);
  return str;
}

/**
 * `onIgnoreTag` function for removing all the tags that are not in whitelist
 */
function onIgnoreTagStripAll() {
  return '';
}

/**
 * remove tag body
 * specify a `tags` list, if the tag is not in the `tags` list then process by the specify function (optional)
 *
 * @param {array} tags
 * @param {function} next
 */
function StripTagBody(tags, next) {
  if (typeof next !== 'function') {
    next = function () {};
  }

  var isRemoveAllTag = !Array.isArray(tags);
  function isRemoveTag(tag) {
    if (isRemoveAllTag) return true;
    return _$2.indexOf(tags, tag) !== -1;
  }

  var removeList = [];
  var posStart = false;

  return {
    onIgnoreTag: function (tag, html, options) {
      if (isRemoveTag(tag)) {
        if (options.isClosing) {
          var ret = '[/removed]';
          var end = options.position + ret.length;
          removeList.push([posStart !== false ? posStart : options.position, end]);
          posStart = false;
          return ret;
        } else {
          if (!posStart) {
            posStart = options.position;
          }
          return '[removed]';
        }
      } else {
        return next(tag, html, options);
      }
    },
    remove: function (html) {
      var rethtml = '';
      var lastPos = 0;
      _$2.forEach(removeList, function (pos) {
        rethtml += html.slice(lastPos, pos[0]);
        lastPos = pos[1];
      });
      rethtml += html.slice(lastPos);
      return rethtml;
    },
  };
}

/**
 * remove html comments
 *
 * @param {String} html
 * @return {String}
 */
function stripCommentTag(html) {
  var retHtml = '';
  var lastPos = 0;
  while (lastPos < html.length) {
    var i = html.indexOf('<!--', lastPos);
    if (i === -1) {
      retHtml += html.slice(lastPos);
      break;
    }
    retHtml += html.slice(lastPos, i);
    var j = html.indexOf('-->', i);
    if (j === -1) {
      break;
    }
    lastPos = j + 3;
  }
  return retHtml;
}

/**
 * remove invisible characters
 *
 * @param {String} html
 * @return {String}
 */
function stripBlankChar(html) {
  var chars = html.split('');
  chars = chars.filter(function (char) {
    var c = char.charCodeAt(0);
    if (c === 127) return false;
    if (c <= 31) {
      if (c === 10 || c === 13) return true;
      return false;
    }
    return true;
  });
  return chars.join('');
}

_default$1.whiteList = getDefaultWhiteList();
_default$1.getDefaultWhiteList = getDefaultWhiteList;
_default$1.onTag = onTag;
_default$1.onIgnoreTag = onIgnoreTag;
_default$1.onTagAttr = onTagAttr;
_default$1.onIgnoreTagAttr = onIgnoreTagAttr;
_default$1.safeAttrValue = safeAttrValue;
_default$1.escapeHtml = escapeHtml;
_default$1.escapeQuote = escapeQuote;
_default$1.unescapeQuote = unescapeQuote;
_default$1.escapeHtmlEntities = escapeHtmlEntities;
_default$1.escapeDangerHtml5Entities = escapeDangerHtml5Entities;
_default$1.clearNonPrintableCharacter = clearNonPrintableCharacter;
_default$1.friendlyAttrValue = friendlyAttrValue;
_default$1.escapeAttrValue = escapeAttrValue;
_default$1.onIgnoreTagStripAll = onIgnoreTagStripAll;
_default$1.StripTagBody = StripTagBody;
_default$1.stripCommentTag = stripCommentTag;
_default$1.stripBlankChar = stripBlankChar;
_default$1.cssFilter = defaultCSSFilter;
_default$1.getDefaultCSSWhiteList = getDefaultCSSWhiteList;

var parser$1 = {};

/**
 * Simple HTML Parser
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */

var _$1 = util$1;

/**
 * get tag name
 *
 * @param {String} html e.g. '<a hef="#">'
 * @return {String}
 */
function getTagName(html) {
  var i = _$1.spaceIndex(html);
  var tagName;
  if (i === -1) {
    tagName = html.slice(1, -1);
  } else {
    tagName = html.slice(1, i + 1);
  }
  tagName = _$1.trim(tagName).toLowerCase();
  if (tagName.slice(0, 1) === '/') tagName = tagName.slice(1);
  if (tagName.slice(-1) === '/') tagName = tagName.slice(0, -1);
  return tagName;
}

/**
 * is close tag?
 *
 * @param {String} html 如：'<a hef="#">'
 * @return {Boolean}
 */
function isClosing(html) {
  return html.slice(0, 2) === '</';
}

/**
 * parse input html and returns processed html
 *
 * @param {String} html
 * @param {Function} onTag e.g. function (sourcePosition, position, tag, html, isClosing)
 * @param {Function} escapeHtml
 * @return {String}
 */
function parseTag$1(html, onTag, escapeHtml) {
  var rethtml = '';
  var lastPos = 0;
  var tagStart = false;
  var quoteStart = false;
  var currentPos = 0;
  var len = html.length;
  var currentTagName = '';
  var currentHtml = '';

  chariterator: for (currentPos = 0; currentPos < len; currentPos++) {
    var c = html.charAt(currentPos);
    if (tagStart === false) {
      if (c === '<') {
        tagStart = currentPos;
        continue;
      }
    } else {
      if (quoteStart === false) {
        if (c === '<') {
          rethtml += escapeHtml(html.slice(lastPos, currentPos));
          tagStart = currentPos;
          lastPos = currentPos;
          continue;
        }
        if (c === '>' || currentPos === len - 1) {
          rethtml += escapeHtml(html.slice(lastPos, tagStart));
          currentHtml = html.slice(tagStart, currentPos + 1);
          currentTagName = getTagName(currentHtml);
          rethtml += onTag(
            tagStart,
            rethtml.length,
            currentTagName,
            currentHtml,
            isClosing(currentHtml),
          );
          lastPos = currentPos + 1;
          tagStart = false;
          continue;
        }
        if (c === '"' || c === "'") {
          var i = 1;
          var ic = html.charAt(currentPos - i);

          while (ic.trim() === '' || ic === '=') {
            if (ic === '=') {
              quoteStart = c;
              continue chariterator;
            }
            ic = html.charAt(currentPos - ++i);
          }
        }
      } else {
        if (c === quoteStart) {
          quoteStart = false;
          continue;
        }
      }
    }
  }
  if (lastPos < len) {
    rethtml += escapeHtml(html.substr(lastPos));
  }

  return rethtml;
}

var REGEXP_ILLEGAL_ATTR_NAME = /[^a-zA-Z0-9\\_:.-]/gim;

/**
 * parse input attributes and returns processed attributes
 *
 * @param {String} html e.g. `href="#" target="_blank"`
 * @param {Function} onAttr e.g. `function (name, value)`
 * @return {String}
 */
function parseAttr$1(html, onAttr) {
  var lastPos = 0;
  var lastMarkPos = 0;
  var retAttrs = [];
  var tmpName = false;
  var len = html.length;

  function addAttr(name, value) {
    name = _$1.trim(name);
    name = name.replace(REGEXP_ILLEGAL_ATTR_NAME, '').toLowerCase();
    if (name.length < 1) return;
    var ret = onAttr(name, value || '');
    if (ret) retAttrs.push(ret);
  }

  // 逐个分析字符
  for (var i = 0; i < len; i++) {
    var c = html.charAt(i);
    var v, j;
    if (tmpName === false && c === '=') {
      tmpName = html.slice(lastPos, i);
      lastPos = i + 1;
      lastMarkPos =
        html.charAt(lastPos) === '"' || html.charAt(lastPos) === "'"
          ? lastPos
          : findNextQuotationMark(html, i + 1);
      continue;
    }
    if (tmpName !== false) {
      if (i === lastMarkPos) {
        j = html.indexOf(c, i + 1);
        if (j === -1) {
          break;
        } else {
          v = _$1.trim(html.slice(lastMarkPos + 1, j));
          addAttr(tmpName, v);
          tmpName = false;
          i = j;
          lastPos = i + 1;
          continue;
        }
      }
    }
    if (/\s|\n|\t/.test(c)) {
      html = html.replace(/\s|\n|\t/g, ' ');
      if (tmpName === false) {
        j = findNextEqual(html, i);
        if (j === -1) {
          v = _$1.trim(html.slice(lastPos, i));
          addAttr(v);
          tmpName = false;
          lastPos = i + 1;
          continue;
        } else {
          i = j - 1;
          continue;
        }
      } else {
        j = findBeforeEqual(html, i - 1);
        if (j === -1) {
          v = _$1.trim(html.slice(lastPos, i));
          v = stripQuoteWrap(v);
          addAttr(tmpName, v);
          tmpName = false;
          lastPos = i + 1;
          continue;
        } else {
          continue;
        }
      }
    }
  }

  if (lastPos < html.length) {
    if (tmpName === false) {
      addAttr(html.slice(lastPos));
    } else {
      addAttr(tmpName, stripQuoteWrap(_$1.trim(html.slice(lastPos))));
    }
  }

  return _$1.trim(retAttrs.join(' '));
}

function findNextEqual(str, i) {
  for (; i < str.length; i++) {
    var c = str[i];
    if (c === ' ') continue;
    if (c === '=') return i;
    return -1;
  }
}

function findNextQuotationMark(str, i) {
  for (; i < str.length; i++) {
    var c = str[i];
    if (c === ' ') continue;
    if (c === "'" || c === '"') return i;
    return -1;
  }
}

function findBeforeEqual(str, i) {
  for (; i > 0; i--) {
    var c = str[i];
    if (c === ' ') continue;
    if (c === '=') return i;
    return -1;
  }
}

function isQuoteWrapString(text) {
  if (
    (text[0] === '"' && text[text.length - 1] === '"') ||
    (text[0] === "'" && text[text.length - 1] === "'")
  ) {
    return true;
  } else {
    return false;
  }
}

function stripQuoteWrap(text) {
  if (isQuoteWrapString(text)) {
    return text.substr(1, text.length - 2);
  } else {
    return text;
  }
}

parser$1.parseTag = parseTag$1;
parser$1.parseAttr = parseAttr$1;

/**
 * filter xss
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */

var FilterCSS = lib.exports.FilterCSS;
var DEFAULT = _default$1;
var parser = parser$1;
var parseTag = parser.parseTag;
var parseAttr = parser.parseAttr;
var _ = util$1;

/**
 * returns `true` if the input value is `undefined` or `null`
 *
 * @param {Object} obj
 * @return {Boolean}
 */
function isNull(obj) {
  return obj === undefined || obj === null;
}

/**
 * get attributes for a tag
 *
 * @param {String} html
 * @return {Object}
 *   - {String} html
 *   - {Boolean} closing
 */
function getAttrs(html) {
  var i = _.spaceIndex(html);
  if (i === -1) {
    return {
      html: '',
      closing: html[html.length - 2] === '/',
    };
  }
  html = _.trim(html.slice(i + 1, -1));
  var isClosing = html[html.length - 1] === '/';
  if (isClosing) html = _.trim(html.slice(0, -1));
  return {
    html: html,
    closing: isClosing,
  };
}

/**
 * shallow copy
 *
 * @param {Object} obj
 * @return {Object}
 */
function shallowCopyObject(obj) {
  var ret = {};
  for (var i in obj) {
    ret[i] = obj[i];
  }
  return ret;
}

function keysToLowerCase(obj) {
  var ret = {};
  for (var i in obj) {
    if (Array.isArray(obj[i])) {
      ret[i.toLowerCase()] = obj[i].map(function (item) {
        return item.toLowerCase();
      });
    } else {
      ret[i.toLowerCase()] = obj[i];
    }
  }
  return ret;
}

/**
 * FilterXSS class
 *
 * @param {Object} options
 *        whiteList (or allowList), onTag, onTagAttr, onIgnoreTag,
 *        onIgnoreTagAttr, safeAttrValue, escapeHtml
 *        stripIgnoreTagBody, allowCommentTag, stripBlankChar
 *        css{whiteList, onAttr, onIgnoreAttr} `css=false` means don't use `cssfilter`
 */
function FilterXSS(options) {
  options = shallowCopyObject(options || {});

  if (options.stripIgnoreTag) {
    if (options.onIgnoreTag) {
      console.error(
        'Notes: cannot use these two options "stripIgnoreTag" and "onIgnoreTag" at the same time',
      );
    }
    options.onIgnoreTag = DEFAULT.onIgnoreTagStripAll;
  }
  if (options.whiteList || options.allowList) {
    options.whiteList = keysToLowerCase(options.whiteList || options.allowList);
  } else {
    options.whiteList = DEFAULT.whiteList;
  }

  options.onTag = options.onTag || DEFAULT.onTag;
  options.onTagAttr = options.onTagAttr || DEFAULT.onTagAttr;
  options.onIgnoreTag = options.onIgnoreTag || DEFAULT.onIgnoreTag;
  options.onIgnoreTagAttr = options.onIgnoreTagAttr || DEFAULT.onIgnoreTagAttr;
  options.safeAttrValue = options.safeAttrValue || DEFAULT.safeAttrValue;
  options.escapeHtml = options.escapeHtml || DEFAULT.escapeHtml;
  this.options = options;

  if (options.css === false) {
    this.cssFilter = false;
  } else {
    options.css = options.css || {};
    this.cssFilter = new FilterCSS(options.css);
  }
}

/**
 * start process and returns result
 *
 * @param {String} html
 * @return {String}
 */
FilterXSS.prototype.process = function (html) {
  // compatible with the input
  html = html || '';
  html = html.toString();
  if (!html) return '';

  var me = this;
  var options = me.options;
  var whiteList = options.whiteList;
  var onTag = options.onTag;
  var onIgnoreTag = options.onIgnoreTag;
  var onTagAttr = options.onTagAttr;
  var onIgnoreTagAttr = options.onIgnoreTagAttr;
  var safeAttrValue = options.safeAttrValue;
  var escapeHtml = options.escapeHtml;
  var cssFilter = me.cssFilter;

  // remove invisible characters
  if (options.stripBlankChar) {
    html = DEFAULT.stripBlankChar(html);
  }

  // remove html comments
  if (!options.allowCommentTag) {
    html = DEFAULT.stripCommentTag(html);
  }

  // if enable stripIgnoreTagBody
  var stripIgnoreTagBody = false;
  if (options.stripIgnoreTagBody) {
    stripIgnoreTagBody = DEFAULT.StripTagBody(options.stripIgnoreTagBody, onIgnoreTag);
    onIgnoreTag = stripIgnoreTagBody.onIgnoreTag;
  }

  var retHtml = parseTag(
    html,
    function (sourcePosition, position, tag, html, isClosing) {
      var info = {
        sourcePosition: sourcePosition,
        position: position,
        isClosing: isClosing,
        isWhite: Object.prototype.hasOwnProperty.call(whiteList, tag),
      };

      // call `onTag()`
      var ret = onTag(tag, html, info);
      if (!isNull(ret)) return ret;

      if (info.isWhite) {
        if (info.isClosing) {
          return '</' + tag + '>';
        }

        var attrs = getAttrs(html);
        var whiteAttrList = whiteList[tag];
        var attrsHtml = parseAttr(attrs.html, function (name, value) {
          // call `onTagAttr()`
          var isWhiteAttr = _.indexOf(whiteAttrList, name) !== -1;
          var ret = onTagAttr(tag, name, value, isWhiteAttr);
          if (!isNull(ret)) return ret;

          if (isWhiteAttr) {
            // call `safeAttrValue()`
            value = safeAttrValue(tag, name, value, cssFilter);
            if (value) {
              return name + '="' + value + '"';
            } else {
              return name;
            }
          } else {
            // call `onIgnoreTagAttr()`
            ret = onIgnoreTagAttr(tag, name, value, isWhiteAttr);
            if (!isNull(ret)) return ret;
            return;
          }
        });

        // build new tag html
        html = '<' + tag;
        if (attrsHtml) html += ' ' + attrsHtml;
        if (attrs.closing) html += ' /';
        html += '>';
        return html;
      } else {
        // call `onIgnoreTag()`
        ret = onIgnoreTag(tag, html, info);
        if (!isNull(ret)) return ret;
        return escapeHtml(html);
      }
    },
    escapeHtml,
  );

  // if enable stripIgnoreTagBody
  if (stripIgnoreTagBody) {
    retHtml = stripIgnoreTagBody.remove(retHtml);
  }

  return retHtml;
};

var xss = FilterXSS;

/**
 * xss
 *
 * @author Zongmin Lei<leizongmin@gmail.com>
 */

(function (module, exports) {
  var DEFAULT = _default$1;
  var parser = parser$1;
  var FilterXSS = xss;

  /**
   * filter xss function
   *
   * @param {String} html
   * @param {Object} options { whiteList, onTag, onTagAttr, onIgnoreTag, onIgnoreTagAttr, safeAttrValue, escapeHtml }
   * @return {String}
   */
  function filterXSS(html, options) {
    var xss = new FilterXSS(options);
    return xss.process(html);
  }

  exports = module.exports = filterXSS;
  exports.filterXSS = filterXSS;
  exports.FilterXSS = FilterXSS;

  (function () {
    for (var i in DEFAULT) {
      exports[i] = DEFAULT[i];
    }
    for (var j in parser) {
      exports[j] = parser[j];
    }
  })();

  // using `xss` on the browser, output `filterXSS` to the globals
  if (typeof window !== 'undefined') {
    window.filterXSS = module.exports;
  }

  // using `xss` on the WebWorker, output `filterXSS` to the globals
  function isWorkerEnv() {
    return (
      typeof self !== 'undefined' &&
      typeof DedicatedWorkerGlobalScope !== 'undefined' &&
      self instanceof DedicatedWorkerGlobalScope
    );
  }
  if (isWorkerEnv()) {
    self.filterXSS = module.exports;
  }
})(lib$1, lib$1.exports);

var sanitize = lib$1.exports;

var util;
(function (util) {
  util.assertEqual = (val) => val;
  function assertIs(_arg) {}
  util.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util.assertNever = assertNever;
  util.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util.getValidEnumValues = (obj) => {
    const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== 'number');
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util.objectValues(filtered);
  };
  util.objectValues = (obj) => {
    return util.objectKeys(obj).map(function (e) {
      return obj[e];
    });
  };
  util.objectKeys =
    typeof Object.keys === 'function' // eslint-disable-line ban/ban
      ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
      : (object) => {
          const keys = [];
          for (const key in object) {
            if (Object.prototype.hasOwnProperty.call(object, key)) {
              keys.push(key);
            }
          }
          return keys;
        };
  util.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item)) return item;
    }
    return undefined;
  };
  util.isInteger =
    typeof Number.isInteger === 'function'
      ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
      : (val) => typeof val === 'number' && isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = ' | ') {
    return array.map((val) => (typeof val === 'string' ? `'${val}'` : val)).join(separator);
  }
  util.joinValues = joinValues;
  util.jsonStringifyReplacer = (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
const ZodParsedType = util.arrayToEnum([
  'string',
  'nan',
  'number',
  'integer',
  'float',
  'boolean',
  'date',
  'bigint',
  'symbol',
  'function',
  'undefined',
  'null',
  'array',
  'object',
  'unknown',
  'promise',
  'void',
  'never',
  'map',
  'set',
]);
const getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case 'undefined':
      return ZodParsedType.undefined;
    case 'string':
      return ZodParsedType.string;
    case 'number':
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case 'boolean':
      return ZodParsedType.boolean;
    case 'function':
      return ZodParsedType.function;
    case 'bigint':
      return ZodParsedType.bigint;
    case 'object':
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (
        data.then &&
        typeof data.then === 'function' &&
        data.catch &&
        typeof data.catch === 'function'
      ) {
        return ZodParsedType.promise;
      }
      if (typeof Map !== 'undefined' && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== 'undefined' && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== 'undefined' && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

const ZodIssueCode = util.arrayToEnum([
  'invalid_type',
  'invalid_literal',
  'custom',
  'invalid_union',
  'invalid_union_discriminator',
  'invalid_enum_value',
  'unrecognized_keys',
  'invalid_arguments',
  'invalid_return_type',
  'invalid_date',
  'invalid_string',
  'too_small',
  'too_big',
  'invalid_intersection_types',
  'not_multiple_of',
]);
const quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, '$1:');
};
class ZodError extends Error {
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      // eslint-disable-next-line ban/ban
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = 'ZodError';
    this.issues = issues;
  }
  get errors() {
    return this.issues;
  }
  format(_mapper) {
    const mapper =
      _mapper ||
      function (issue) {
        return issue.message;
      };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === 'invalid_union') {
          issue.unionErrors.map(processError);
        } else if (issue.code === 'invalid_return_type') {
          processError(issue.returnTypeError);
        } else if (issue.code === 'invalid_arguments') {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
              // if (typeof el === "string") {
              //   curr[el] = curr[el] || { _errors: [] };
              // } else if (typeof el === "number") {
              //   const errorArray: any = [];
              //   errorArray._errors = [];
              //   curr[el] = curr[el] || errorArray;
              // }
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

const errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = 'Required';
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(
        issue.expected,
        util.jsonStringifyReplacer,
      )}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ', ')}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${
        issue.received
      }'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === 'object') {
        if ('startsWith' in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ('endsWith' in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== 'regex') {
        message = `Invalid ${issue.validation}`;
      } else {
        message = 'Invalid';
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === 'array')
        message = `Array must contain ${issue.inclusive ? `at least` : `more than`} ${
          issue.minimum
        } element(s)`;
      else if (issue.type === 'string')
        message = `String must contain ${issue.inclusive ? `at least` : `over`} ${
          issue.minimum
        } character(s)`;
      else if (issue.type === 'number')
        message = `Number must be greater than ${issue.inclusive ? `or equal to ` : ``}${
          issue.minimum
        }`;
      else if (issue.type === 'date')
        message = `Date must be greater than ${issue.inclusive ? `or equal to ` : ``}${new Date(
          issue.minimum,
        )}`;
      else message = 'Invalid input';
      break;
    case ZodIssueCode.too_big:
      if (issue.type === 'array')
        message = `Array must contain ${issue.inclusive ? `at most` : `less than`} ${
          issue.maximum
        } element(s)`;
      else if (issue.type === 'string')
        message = `String must contain ${issue.inclusive ? `at most` : `under`} ${
          issue.maximum
        } character(s)`;
      else if (issue.type === 'number')
        message = `Number must be less than ${issue.inclusive ? `or equal to ` : ``}${
          issue.maximum
        }`;
      else if (issue.type === 'date')
        message = `Date must be smaller than ${issue.inclusive ? `or equal to ` : ``}${new Date(
          issue.maximum,
        )}`;
      else message = 'Invalid input';
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};

let overrideErrorMap = errorMap;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

const makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...(issueData.path || [])];
  const fullIssue = {
    ...issueData,
    path: fullPath,
  };
  let errorMessage = '';
  const maps = errorMaps
    .filter((m) => !!m)
    .slice()
    .reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: issueData.message || errorMessage,
  };
};
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const issue = makeIssue({
    issueData: issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), errorMap].filter(
      (x) => !!x,
    ),
  });
  ctx.common.issues.push(issue);
}
class ParseStatus {
  constructor() {
    this.value = 'valid';
  }
  dirty() {
    if (this.value === 'valid') this.value = 'dirty';
  }
  abort() {
    if (this.value !== 'aborted') this.value = 'aborted';
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === 'aborted') return INVALID;
      if (s.status === 'dirty') status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      syncPairs.push({
        key: await pair.key,
        value: await pair.value,
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === 'aborted') return INVALID;
      if (value.status === 'aborted') return INVALID;
      if (key.status === 'dirty') status.dirty();
      if (value.status === 'dirty') status.dirty();
      if (typeof value.value !== 'undefined' || pair.alwaysSet) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
const INVALID = Object.freeze({
  status: 'aborted',
});
const DIRTY = (value) => ({ status: 'dirty', value });
const OK = (value) => ({ status: 'valid', value });
const isAborted = (x) => x.status === 'aborted';
const isDirty = (x) => x.status === 'dirty';
const isValid = (x) => x.status === 'valid';
const isAsync = (x) => typeof Promise !== undefined && x instanceof Promise;

var errorUtil;
(function (errorUtil) {
  errorUtil.errToObj = (message) => (typeof message === 'string' ? { message } : message || {});
  errorUtil.toString = (message) =>
    typeof message === 'string'
      ? message
      : message === null || message === void 0
      ? void 0
      : message.message;
})(errorUtil || (errorUtil = {}));

class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    return this._path.concat(this._key);
  }
}
const handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error('Validation failed but no issues detected.');
    }
    const error = new ZodError(ctx.common.issues);
    return { success: false, error };
  }
};
function processCreateParams(params) {
  if (!params) return {};
  const { errorMap, invalid_type_error, required_error, description } = params;
  if (errorMap && (invalid_type_error || required_error)) {
    throw new Error(
      `Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`,
    );
  }
  if (errorMap) return { errorMap: errorMap, description };
  const customMap = (iss, ctx) => {
    if (iss.code !== 'invalid_type') return { message: ctx.defaultError };
    if (typeof ctx.data === 'undefined') {
      return {
        message:
          required_error !== null && required_error !== void 0 ? required_error : ctx.defaultError,
      };
    }
    return {
      message:
        invalid_type_error !== null && invalid_type_error !== void 0
          ? invalid_type_error
          : ctx.defaultError,
    };
  };
  return { errorMap: customMap, description };
}
class ZodType {
  constructor(def) {
    /** Alias of safeParseAsync */
    this.spa = this.safeParseAsync;
    this.superRefine = this._refinement;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.default = this.default.bind(this);
    this.describe = this.describe.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return (
      ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent,
      }
    );
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent,
      },
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error('Synchronous parse encountered promise.');
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success) return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    var _a;
    const ctx = {
      common: {
        issues: [],
        async:
          (_a = params === null || params === void 0 ? void 0 : params.async) !== null &&
          _a !== void 0
            ? _a
            : false,
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success) return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
        async: true,
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data),
    };
    const maybeAsyncResult = this._parse({ data, path: [], parent: ctx });
    const result = await (isAsync(maybeAsyncResult)
      ? maybeAsyncResult
      : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === 'string' || typeof message === 'undefined') {
        return { message };
      } else if (typeof message === 'function') {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () =>
        ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val),
        });
      if (typeof Promise !== 'undefined' && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(
          typeof refinementData === 'function' ? refinementData(val, ctx) : refinementData,
        );
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'refinement', refinement },
    });
  }
  optional() {
    return ZodOptional.create(this);
  }
  nullable() {
    return ZodNullable.create(this);
  }
  nullish() {
    return this.optional().nullable();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this);
  }
  or(option) {
    return ZodUnion.create([this, option]);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming);
  }
  transform(transform) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: 'transform', transform },
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === 'function' ? def : () => def;
    return new ZodDefault({
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(undefined),
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description,
    });
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const uuidRegex =
  /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
// eslint-disable-next-line
const emailRegex =
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
class ZodString extends ZodType {
  constructor() {
    super(...arguments);
    this._regex = (regex, validation, message) =>
      this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message),
      });
    /**
     * @deprecated Use z.string().min(1) instead.
     * @see {@link ZodString.min}
     */
    this.nonempty = (message) => this.min(1, errorUtil.errToObj(message));
    this.trim = () =>
      new ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: 'trim' }],
      });
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(
        ctx,
        {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx.parsedType,
        },
        //
      );
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: 'string',
            inclusive: true,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'max') {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: 'string',
            inclusive: true,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'email') {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: 'email',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'uuid') {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: 'uuid',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'cuid') {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: 'cuid',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'url') {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: 'url',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'regex') {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: 'regex',
            code: ZodIssueCode.invalid_string,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'trim') {
        input.data = input.data.trim();
      } else if (check.kind === 'startsWith') {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'endsWith') {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message,
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check],
    });
  }
  email(message) {
    return this._addCheck({ kind: 'email', ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: 'url', ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: 'uuid', ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: 'cuid', ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: 'regex',
      regex: regex,
      ...errorUtil.errToObj(message),
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: 'startsWith',
      value: value,
      ...errorUtil.errToObj(message),
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: 'endsWith',
      value: value,
      ...errorUtil.errToObj(message),
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: 'min',
      value: minLength,
      ...errorUtil.errToObj(message),
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: 'max',
      value: maxLength,
      ...errorUtil.errToObj(message),
    });
  }
  length(len, message) {
    return this.min(len, message).max(len, message);
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === 'email');
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === 'url');
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === 'uuid');
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === 'cuid');
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    ...processCreateParams(params),
  });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split('.')[1] || '').length;
  const stepDecCount = (step.toString().split('.')[1] || '').length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace('.', ''));
  const stepInt = parseInt(step.toFixed(decCount).replace('.', ''));
  return (valInt % stepInt) / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === 'int') {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: 'integer',
            received: 'float',
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'min') {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'max') {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: 'number',
            inclusive: check.inclusive,
            message: check.message,
          });
          status.dirty();
        }
      } else if (check.kind === 'multipleOf') {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message,
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit('min', value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit('min', value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit('max', value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit('max', value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message),
        },
      ],
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check],
    });
  }
  int(message) {
    return this._addCheck({
      kind: 'int',
      message: errorUtil.toString(message),
    });
  }
  positive(message) {
    return this._addCheck({
      kind: 'min',
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message),
    });
  }
  negative(message) {
    return this._addCheck({
      kind: 'max',
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message),
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: 'max',
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message),
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: 'min',
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message),
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: 'multipleOf',
      value: value,
      message: errorUtil.toString(message),
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === 'int');
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    ...processCreateParams(params),
  });
};
class ZodBigInt extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    ...processCreateParams(params),
  });
};
class ZodBoolean extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    ...processCreateParams(params),
  });
};
class ZodDate extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    if (isNaN(input.data.getTime())) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_date,
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === 'min') {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            minimum: check.value,
            type: 'date',
          });
          status.dirty();
        }
      } else if (check.kind === 'max') {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            maximum: check.value,
            type: 'date',
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime()),
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check],
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: 'min',
      value: minDate.getTime(),
      message: errorUtil.toString(message),
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: 'max',
      value: maxDate.getTime(),
      message: errorUtil.toString(message),
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === 'min') {
        if (min === null || ch.value > min) min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === 'max') {
        if (max === null || ch.value < max) max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params),
  });
};
class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params),
  });
};
class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params),
  });
};
class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params),
  });
};
class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    // required
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params),
  });
};
class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType,
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params),
  });
};
class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params),
  });
};
class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: 'array',
          inclusive: true,
          message: def.minLength.message,
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: 'array',
          inclusive: true,
          message: def.maxLength.message,
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all(
        ctx.data.map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        }),
      ).then((result) => {
        return ParseStatus.mergeArray(status, result);
      });
    }
    const result = ctx.data.map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) },
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) },
    });
  }
  length(len, message) {
    return this.min(len, message).max(len, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params),
  });
};
/////////////////////////////////////////
/////////////////////////////////////////
//////////                     //////////
//////////      ZodObject      //////////
//////////                     //////////
/////////////////////////////////////////
/////////////////////////////////////////
var objectUtil;
(function (objectUtil) {
  objectUtil.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second,
    };
  };
})(objectUtil || (objectUtil = {}));
const AugmentFactory = (def) => (augmentation) => {
  return new ZodObject({
    ...def,
    shape: () => ({
      ...def.shape(),
      ...augmentation,
    }),
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape,
    });
  } else if (schema instanceof ZodArray) {
    return ZodArray.create(deepPartialify(schema.element));
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    /**
     * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
     * If you want to pass through unknown properties, use `.passthrough()` instead.
     */
    this.nonstrict = this.passthrough;
    this.augment = AugmentFactory(this._def);
    this.extend = AugmentFactory(this._def);
  }
  _getCached() {
    if (this._cached !== null) return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    return (this._cached = { shape, keys });
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === 'strip')) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: 'valid', value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data,
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === 'passthrough') {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: 'valid', value: key },
            value: { status: 'valid', value: ctx.data[key] },
          });
        }
      } else if (unknownKeys === 'strict') {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys,
          });
          status.dirty();
        }
      } else if (unknownKeys === 'strip');
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      // run catchall validation
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: 'valid', value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key), //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data,
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve()
        .then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            syncPairs.push({
              key,
              value: await pair.value,
              alwaysSet: pair.alwaysSet,
            });
          }
          return syncPairs;
        })
        .then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strict',
      ...(message !== undefined
        ? {
            errorMap: (issue, ctx) => {
              var _a, _b, _c, _d;
              const defaultError =
                (_c =
                  (_b = (_a = this._def).errorMap) === null || _b === void 0
                    ? void 0
                    : _b.call(_a, issue, ctx).message) !== null && _c !== void 0
                  ? _c
                  : ctx.defaultError;
              if (issue.code === 'unrecognized_keys')
                return {
                  message:
                    (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0
                      ? _d
                      : defaultError,
                };
              return {
                message: defaultError,
              };
            },
          }
        : {}),
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'strip',
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: 'passthrough',
    });
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    // const mergedShape = objectUtil.mergeShapes(
    //   this._def.shape(),
    //   merging._def.shape()
    // );
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      typeName: ZodFirstPartyTypeKind.ZodObject,
    });
    return merged;
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index,
    });
  }
  pick(mask) {
    const shape = {};
    util.objectKeys(mask).map((key) => {
      // only add to shape if key corresponds to an element of the current shape
      if (this.shape[key]) shape[key] = this.shape[key];
    });
    return new ZodObject({
      ...this._def,
      shape: () => shape,
    });
  }
  omit(mask) {
    const shape = {};
    util.objectKeys(this.shape).map((key) => {
      if (util.objectKeys(mask).indexOf(key) === -1) {
        shape[key] = this.shape[key];
      }
    });
    return new ZodObject({
      ...this._def,
      shape: () => shape,
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    if (mask) {
      util.objectKeys(this.shape).map((key) => {
        if (util.objectKeys(mask).indexOf(key) === -1) {
          newShape[key] = this.shape[key];
        } else {
          newShape[key] = this.shape[key].optional();
        }
      });
      return new ZodObject({
        ...this._def,
        shape: () => newShape,
      });
    } else {
      for (const key in this.shape) {
        const fieldSchema = this.shape[key];
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape,
    });
  }
  required() {
    const newShape = {};
    for (const key in this.shape) {
      const fieldSchema = this.shape[key];
      let newField = fieldSchema;
      while (newField instanceof ZodOptional) {
        newField = newField._def.innerType;
      }
      newShape[key] = newField;
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape,
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: 'strip',
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params),
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: 'strict',
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params),
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: 'strip',
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params),
  });
};
class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      // return first issue-free validation if it exists
      for (const result of results) {
        if (result.result.status === 'valid') {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === 'dirty') {
          // add issues from dirty option
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      // return invalid
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors,
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(
        options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: [],
            },
            parent: null,
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx,
            }),
            ctx: childCtx,
          };
        }),
      ).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: [],
          },
          parent: null,
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx,
        });
        if (result.status === 'valid') {
          return result;
        } else if (result.status === 'dirty' && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues) => new ZodError(issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors,
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params),
  });
};
class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.options.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: this.validDiscriminatorValues,
        path: [discriminator],
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx,
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get validDiscriminatorValues() {
    return Array.from(this.options.keys());
  }
  get options() {
    return this._def.options;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, types, params) {
    // Get all the valid discriminator values
    const options = new Map();
    try {
      types.forEach((type) => {
        const discriminatorValue = type.shape[discriminator].value;
        options.set(discriminatorValue, type);
      });
    } catch (e) {
      throw new Error(
        'The discriminator value could not be extracted from all the provided schemas',
      );
    }
    // Assert that all the discriminator values are unique
    if (options.size !== types.length) {
      throw new Error('Some of the discriminator values are not unique');
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      ...processCreateParams(params),
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types,
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(
        this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      );
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left: left,
    right: right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params),
  });
};
class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        type: 'array',
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        type: 'array',
      });
      status.dirty();
    }
    const items = ctx.data
      .map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema) return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      })
      .filter((x) => !!x); // filter nulls
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest,
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error('You must pass an array of schemas to z.tuple([ ... ])');
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params),
  });
};
class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third),
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second),
    });
  }
}
class ZodMap extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, 'key'])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, 'value'])),
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === 'aborted' || value.status === 'aborted') {
            return INVALID;
          }
          if (key.status === 'dirty' || value.status === 'dirty') {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === 'aborted' || value.status === 'aborted') {
          return INVALID;
        }
        if (key.status === 'dirty' || value.status === 'dirty') {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params),
  });
};
class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: 'set',
          inclusive: true,
          message: def.minSize.message,
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: 'set',
          inclusive: true,
          message: def.maxSize.message,
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements) {
      const parsedSet = new Set();
      for (const element of elements) {
        if (element.status === 'aborted') return INVALID;
        if (element.status === 'dirty') status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) =>
      valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)),
    );
    if (ctx.common.async) {
      return Promise.all(elements).then((elements) => finalizeSet(elements));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) },
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) },
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params),
  });
};
class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap,
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error,
        },
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap,
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error,
        },
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      return OK(async (...args) => {
        const error = new ZodError([]);
        const parsedArgs = await this._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await fn(...parsedArgs);
        const parsedReturns = await this._def.returns._def.type
          .parseAsync(result, params)
          .catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
        return parsedReturns;
      });
    } else {
      return OK((...args) => {
        const parsedArgs = this._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = fn(...parsedArgs.data);
        const parsedReturns = this._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create()),
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType,
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params),
    });
  }
}
class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter: getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params),
  });
};
class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value,
      });
      return INVALID;
    }
    return { status: 'valid', value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value: value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params),
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values: values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params),
  });
}
class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== 'string') {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      });
      return INVALID;
    }
    if (this._def.values.indexOf(input.data) === -1) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      });
      return INVALID;
    }
    if (nativeEnumValues.indexOf(input.data) === -1) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values: values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params),
  });
};
class ZodPromise extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    const promisified =
      ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(
      promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap,
        });
      }),
    );
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params),
  });
};
class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    if (effect.type === 'preprocess') {
      const processed = effect.transform(ctx.data);
      if (ctx.common.async) {
        return Promise.resolve(processed).then((processed) => {
          return this._def.schema._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx,
          });
        });
      } else {
        return this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx,
        });
      }
    }
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      },
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === 'refinement') {
      const executeRefinement = (
        acc,
        // effect: RefinementEffect<any>
      ) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error(
            'Async refinement encountered during synchronous parse operation. Use .parseAsync instead.',
          );
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        });
        if (inner.status === 'aborted') return INVALID;
        if (inner.status === 'dirty') status.dirty();
        // return value is ignored
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema
          ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
          .then((inner) => {
            if (inner.status === 'aborted') return INVALID;
            if (inner.status === 'dirty') status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
      }
    }
    if (effect.type === 'transform') {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        });
        // if (base.status === "aborted") return INVALID;
        // if (base.status === "dirty") {
        //   return { status: "dirty", value: base.value };
        // }
        if (!isValid(base)) return base;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(
            `Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`,
          );
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema
          ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
          .then((base) => {
            if (!isValid(base)) return base;
            // if (base.status === "aborted") return INVALID;
            // if (base.status === "dirty") {
            //   return { status: "dirty", value: base.value };
            // }
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result,
            }));
          });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params),
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: 'preprocess', transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params),
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params),
  });
};
class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params),
  });
};
class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx,
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params),
  });
};
class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType,
      });
      return INVALID;
    }
    return { status: 'valid', value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params),
  });
};
const BRAND = Symbol('zod_brand');
class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx,
    });
  }
  unwrap() {
    return this._def.type;
  }
}
const custom = (check, params = {}, fatal) => {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      if (!check(data)) {
        const p = typeof params === 'function' ? params(data) : params;
        const p2 = typeof p === 'string' ? { message: p } : p;
        ctx.addIssue({ code: 'custom', ...p2, fatal });
      }
    });
  return ZodAny.create();
};
const late = {
  object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
  ZodFirstPartyTypeKind['ZodString'] = 'ZodString';
  ZodFirstPartyTypeKind['ZodNumber'] = 'ZodNumber';
  ZodFirstPartyTypeKind['ZodNaN'] = 'ZodNaN';
  ZodFirstPartyTypeKind['ZodBigInt'] = 'ZodBigInt';
  ZodFirstPartyTypeKind['ZodBoolean'] = 'ZodBoolean';
  ZodFirstPartyTypeKind['ZodDate'] = 'ZodDate';
  ZodFirstPartyTypeKind['ZodUndefined'] = 'ZodUndefined';
  ZodFirstPartyTypeKind['ZodNull'] = 'ZodNull';
  ZodFirstPartyTypeKind['ZodAny'] = 'ZodAny';
  ZodFirstPartyTypeKind['ZodUnknown'] = 'ZodUnknown';
  ZodFirstPartyTypeKind['ZodNever'] = 'ZodNever';
  ZodFirstPartyTypeKind['ZodVoid'] = 'ZodVoid';
  ZodFirstPartyTypeKind['ZodArray'] = 'ZodArray';
  ZodFirstPartyTypeKind['ZodObject'] = 'ZodObject';
  ZodFirstPartyTypeKind['ZodUnion'] = 'ZodUnion';
  ZodFirstPartyTypeKind['ZodDiscriminatedUnion'] = 'ZodDiscriminatedUnion';
  ZodFirstPartyTypeKind['ZodIntersection'] = 'ZodIntersection';
  ZodFirstPartyTypeKind['ZodTuple'] = 'ZodTuple';
  ZodFirstPartyTypeKind['ZodRecord'] = 'ZodRecord';
  ZodFirstPartyTypeKind['ZodMap'] = 'ZodMap';
  ZodFirstPartyTypeKind['ZodSet'] = 'ZodSet';
  ZodFirstPartyTypeKind['ZodFunction'] = 'ZodFunction';
  ZodFirstPartyTypeKind['ZodLazy'] = 'ZodLazy';
  ZodFirstPartyTypeKind['ZodLiteral'] = 'ZodLiteral';
  ZodFirstPartyTypeKind['ZodEnum'] = 'ZodEnum';
  ZodFirstPartyTypeKind['ZodEffects'] = 'ZodEffects';
  ZodFirstPartyTypeKind['ZodNativeEnum'] = 'ZodNativeEnum';
  ZodFirstPartyTypeKind['ZodOptional'] = 'ZodOptional';
  ZodFirstPartyTypeKind['ZodNullable'] = 'ZodNullable';
  ZodFirstPartyTypeKind['ZodDefault'] = 'ZodDefault';
  ZodFirstPartyTypeKind['ZodPromise'] = 'ZodPromise';
  ZodFirstPartyTypeKind['ZodBranded'] = 'ZodBranded';
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
// new approach that works for abstract classes
// but required TS 4.4+
// abstract class Class {
//   constructor(..._: any[]) {}
// }
// const instanceOfType = <T extends typeof Class>(
const instanceOfType = (
  cls,
  params = {
    message: `Input not instance of ${cls.name}`,
  },
) => custom((data) => data instanceof cls, params, true);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();
const NEVER = INVALID;

var mod = /*#__PURE__*/ Object.freeze({
  __proto__: null,
  getParsedType: getParsedType,
  ZodParsedType: ZodParsedType,
  defaultErrorMap: errorMap,
  setErrorMap: setErrorMap,
  getErrorMap: getErrorMap,
  makeIssue: makeIssue,
  EMPTY_PATH: EMPTY_PATH,
  addIssueToContext: addIssueToContext,
  ParseStatus: ParseStatus,
  INVALID: INVALID,
  DIRTY: DIRTY,
  OK: OK,
  isAborted: isAborted,
  isDirty: isDirty,
  isValid: isValid,
  isAsync: isAsync,
  ZodType: ZodType,
  ZodString: ZodString,
  ZodNumber: ZodNumber,
  ZodBigInt: ZodBigInt,
  ZodBoolean: ZodBoolean,
  ZodDate: ZodDate,
  ZodUndefined: ZodUndefined,
  ZodNull: ZodNull,
  ZodAny: ZodAny,
  ZodUnknown: ZodUnknown,
  ZodNever: ZodNever,
  ZodVoid: ZodVoid,
  ZodArray: ZodArray,
  get objectUtil() {
    return objectUtil;
  },
  ZodObject: ZodObject,
  ZodUnion: ZodUnion,
  ZodDiscriminatedUnion: ZodDiscriminatedUnion,
  ZodIntersection: ZodIntersection,
  ZodTuple: ZodTuple,
  ZodRecord: ZodRecord,
  ZodMap: ZodMap,
  ZodSet: ZodSet,
  ZodFunction: ZodFunction,
  ZodLazy: ZodLazy,
  ZodLiteral: ZodLiteral,
  ZodEnum: ZodEnum,
  ZodNativeEnum: ZodNativeEnum,
  ZodPromise: ZodPromise,
  ZodEffects: ZodEffects,
  ZodTransformer: ZodEffects,
  ZodOptional: ZodOptional,
  ZodNullable: ZodNullable,
  ZodDefault: ZodDefault,
  ZodNaN: ZodNaN,
  BRAND: BRAND,
  ZodBranded: ZodBranded,
  custom: custom,
  Schema: ZodType,
  ZodSchema: ZodType,
  late: late,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  date: dateType,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  enum: enumType,
  function: functionType,
  instanceof: instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  null: nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  oboolean: oboolean,
  onumber: onumber,
  optional: optionalType,
  ostring: ostring,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  transformer: effectsType,
  tuple: tupleType,
  undefined: undefinedType,
  union: unionType,
  unknown: unknownType,
  void: voidType,
  NEVER: NEVER,
  ZodIssueCode: ZodIssueCode,
  quotelessJson: quotelessJson,
  ZodError: ZodError,
});

var alreadyHaveAnAccount = "Already have an account? <a href='?journey'>Sign in here!</a>";
var backToDefault = 'Back to Sign In';
var backToLogin = 'Back to Sign In';
var dontHaveAnAccount = "No account? <a href='?journey=Registration'>Register here!</a>";
var closeModal = 'Close';
var chooseDifferentUsername = 'Please choose a different username.';
var confirmPassword = 'Confirm password';
var constraintViolationForPassword = 'Password does not meet the requirements.';
var constraintViolationForValue = 'Value does not meet the requirements.';
var continueWith = 'Continue with ';
var customSecurityQuestion = 'Custom security question';
var doesNotMeetMinimumCharacterLength = 'At least {min} character(s)';
var ensurePasswordIsMoreThan = 'Password must contain at least {minPasswordLength} character(s).';
var ensurePasswordHasOne =
  'Password must contain at least 1 capital letter, 1 number, and 1 special character.';
var exceedsMaximumCharacterLength = 'Exceeds maximum of {max} characters';
var fieldCanNotContainFollowingCharacters = 'Cannot contain these character(s): {chars}';
var fieldCanNotContainFollowingValues = 'Cannot contain these value(s): {fields}';
var forgotPassword = 'Forgot password?';
var forgotUsername = 'Forgot username?';
var givenName = 'First name';
var inputRequiredError = 'Value is required';
var loading = 'Loading ...';
var loginButton = 'Sign in';
var loginFailure = 'Sign in failed';
var loginHeader = 'Sign in';
var loginSuccess = 'Sign in successful!';
var mail = 'Email address';
var minimumNumberOfNumbers = 'At least {num} number(s)';
var minimumNumberOfLowercase = 'At least {num} lowercase letter(s)';
var minimumNumberOfUppercase = 'At least {num} uppercase letter(s)';
var minimumNumberOfSymbols = 'At least {num} symbol(s)';
var nameCallback = 'Username';
var nextButton = 'Next';
var notToExceedMaximumCharacterLength = 'No more than {max} characters';
var noLessThanMinimumCharacterLength = 'At least {min} character(s)';
var passwordCallback = 'Password';
var passwordRequirements = 'Password requirements:';
var pleaseCheckValue = 'Please check this value';
var pleaseConfirm = 'Please confirm';
var preferencesMarketing = 'Send me special offers and services';
var preferencesUpdates = 'Send me news and updates';
var provideCustomQuestion = 'Provide custom security question';
var redirectingTo = 'Redirecting you to';
var registerButton = 'Register';
var registerHeader = 'Register';
var registerSuccess = 'Registration successful!';
var requiredField = 'Value is required';
var securityAnswer = 'Security answer';
var securityQuestions = 'Security question(s)';
var securityQuestionsPrompt = 'Provide custom security question(s) and answer(s):';
var showPassword = 'Show password';
var sn = 'Last name';
var submitButton = 'Submit';
var successMessage = 'Success!';
var termsAndConditions = 'Please accept our Terms & Conditions';
var termsAndConditionsLinkText = 'View full Terms & Conditions';
var tryAgain = 'Please try again';
var useValidEmail = 'Please use a valid email address.';
var unrecoverableError = 'There was an error in the form submission.';
var unknownNetworkError = 'Unknown network request failure has occurred.';
var usernameRequirements = 'Username requirements:';
var validatedCreatePasswordCallback = 'Password';
var validatedCreateUsernameCallback = 'Username';
var valueRequirements = 'Value requirements:';
var fallback = {
  alreadyHaveAnAccount: alreadyHaveAnAccount,
  backToDefault: backToDefault,
  backToLogin: backToLogin,
  dontHaveAnAccount: dontHaveAnAccount,
  closeModal: closeModal,
  chooseDifferentUsername: chooseDifferentUsername,
  confirmPassword: confirmPassword,
  constraintViolationForPassword: constraintViolationForPassword,
  constraintViolationForValue: constraintViolationForValue,
  continueWith: continueWith,
  customSecurityQuestion: customSecurityQuestion,
  doesNotMeetMinimumCharacterLength: doesNotMeetMinimumCharacterLength,
  ensurePasswordIsMoreThan: ensurePasswordIsMoreThan,
  ensurePasswordHasOne: ensurePasswordHasOne,
  exceedsMaximumCharacterLength: exceedsMaximumCharacterLength,
  fieldCanNotContainFollowingCharacters: fieldCanNotContainFollowingCharacters,
  fieldCanNotContainFollowingValues: fieldCanNotContainFollowingValues,
  forgotPassword: forgotPassword,
  forgotUsername: forgotUsername,
  givenName: givenName,
  inputRequiredError: inputRequiredError,
  loading: loading,
  loginButton: loginButton,
  loginFailure: loginFailure,
  loginHeader: loginHeader,
  loginSuccess: loginSuccess,
  mail: mail,
  minimumNumberOfNumbers: minimumNumberOfNumbers,
  minimumNumberOfLowercase: minimumNumberOfLowercase,
  minimumNumberOfUppercase: minimumNumberOfUppercase,
  minimumNumberOfSymbols: minimumNumberOfSymbols,
  nameCallback: nameCallback,
  nextButton: nextButton,
  notToExceedMaximumCharacterLength: notToExceedMaximumCharacterLength,
  noLessThanMinimumCharacterLength: noLessThanMinimumCharacterLength,
  passwordCallback: passwordCallback,
  passwordRequirements: passwordRequirements,
  pleaseCheckValue: pleaseCheckValue,
  pleaseConfirm: pleaseConfirm,
  preferencesMarketing: preferencesMarketing,
  preferencesUpdates: preferencesUpdates,
  provideCustomQuestion: provideCustomQuestion,
  redirectingTo: redirectingTo,
  registerButton: registerButton,
  registerHeader: registerHeader,
  registerSuccess: registerSuccess,
  requiredField: requiredField,
  securityAnswer: securityAnswer,
  securityQuestions: securityQuestions,
  securityQuestionsPrompt: securityQuestionsPrompt,
  showPassword: showPassword,
  sn: sn,
  submitButton: submitButton,
  successMessage: successMessage,
  termsAndConditions: termsAndConditions,
  termsAndConditionsLinkText: termsAndConditionsLinkText,
  tryAgain: tryAgain,
  useValidEmail: useValidEmail,
  unrecoverableError: unrecoverableError,
  unknownNetworkError: unknownNetworkError,
  usernameRequirements: usernameRequirements,
  validatedCreatePasswordCallback: validatedCreatePasswordCallback,
  validatedCreateUsernameCallback: validatedCreateUsernameCallback,
  valueRequirements: valueRequirements,
};

const stringsSchema = mod
  .object({
    alreadyHaveAnAccount: mod.string(),
    backToDefault: mod.string(),
    backToLogin: mod.string(),
    dontHaveAnAccount: mod.string(),
    closeModal: mod.string(),
    chooseDifferentUsername: mod.string(),
    confirmPassword: mod.string(),
    constraintViolationForPassword: mod.string(),
    constraintViolationForValue: mod.string(),
    continueWith: mod.string(),
    customSecurityQuestion: mod.string(),
    doesNotMeetMinimumCharacterLength: mod.string(),
    ensurePasswordIsMoreThan: mod.string(),
    ensurePasswordHasOne: mod.string(),
    exceedsMaximumCharacterLength: mod.string(),
    fieldCanNotContainFollowingCharacters: mod.string(),
    fieldCanNotContainFollowingValues: mod.string(),
    forgotPassword: mod.string(),
    forgotUsername: mod.string(),
    givenName: mod.string(),
    inputRequiredError: mod.string(),
    loading: mod.string(),
    loginButton: mod.string(),
    loginFailure: mod.string(),
    loginHeader: mod.string(),
    loginSuccess: mod.string(),
    mail: mod.string(),
    minimumNumberOfNumbers: mod.string(),
    minimumNumberOfLowercase: mod.string(),
    minimumNumberOfUppercase: mod.string(),
    minimumNumberOfSymbols: mod.string(),
    nameCallback: mod.string(),
    nextButton: mod.string(),
    notToExceedMaximumCharacterLength: mod.string(),
    noLessThanMinimumCharacterLength: mod.string(),
    passwordCallback: mod.string(),
    passwordRequirements: mod.string(),
    pleaseCheckValue: mod.string(),
    pleaseConfirm: mod.string(),
    preferencesMarketing: mod.string(),
    preferencesUpdates: mod.string(),
    provideCustomQuestion: mod.string(),
    redirectingTo: mod.string(),
    registerButton: mod.string(),
    registerHeader: mod.string(),
    registerSuccess: mod.string(),
    requiredField: mod.string(),
    securityAnswer: mod.string(),
    securityQuestions: mod.string(),
    securityQuestionsPrompt: mod.string(),
    showPassword: mod.string(),
    sn: mod.string(),
    submitButton: mod.string(),
    successMessage: mod.string(),
    termsAndConditions: mod.string(),
    termsAndConditionsLinkText: mod.string(),
    tryAgain: mod.string(),
    useValidEmail: mod.string(),
    unrecoverableError: mod.string(),
    unknownNetworkError: mod.string(),
    usernameRequirements: mod.string(),
    validatedCreatePasswordCallback: mod.string(),
    validatedCreateUsernameCallback: mod.string(),
    valueRequirements: mod.string(),
  })
  .strict();
stringsSchema.partial();
// Ensure fallback follows schema
stringsSchema.parse(fallback);
let strings;
function initialize$6(userLocale) {
  if (userLocale) {
    /**
     * Allow widgets to overwrite select portions of the content
     */
    strings = readable({ ...fallback, ...userLocale });
  } else {
    strings = readable(fallback);
  }
}

/**
 * Do not allow strings with angle brackets, just to be extra safe
 *
 * Demo: https://regex101.com/r/Mw9vTB/1
 */
const valueSchema = mod.record(mod.string().regex(/^[^<>]*$/)).optional();
function interpolate(key, values, externalText) {
  // Let's throw some errors if we're trying to use keys/locales that don't exist.
  // We could improve this by using Typescript and/or fallback values.
  if (!key) throw new Error('No key provided to t()');
  // Grab the text from the translations store.
  const contentObj = get_store_value(strings);
  const string = (contentObj && contentObj[key]) || '';
  let messageDirty = '';
  if (values) {
    // Validate value before interpolation, if any value looks questionable throw error
    valueSchema.parse(values);
    /**
     * Replace any passed in variables in the translation string.
     *
     * Example:
     *
     * string = "{greeting}, World!"
     * values = {
     *    greeting: "Hello"
     * }
     */
    Object.keys(values).map((k) => {
      /**
       * k = greeting
       * regex = /{greeting}/g
       */
      const regex = new RegExp(`{${k}}`, 'g');
      /**
       * values[k] = "Hello"
       * messageDirty = "Hello, World!"
       */
      messageDirty = string.replace(regex, values[k]);
    });
  } else {
    messageDirty = string;
  }
  /**
   * If there's no message, then convert the key itself into the message
   */
  if (!messageDirty && !externalText) {
    /**
     * If the key is NOT external, then split at the capital letter
     */
    const textFromKey = key.replace(/([A-Z])/g, ' $1');
    messageDirty = textFromKey.charAt(0).toUpperCase() + textFromKey.slice(1);
  } else if (!messageDirty && externalText) {
    /**
     * If no internal message is found, but external content is provided,
     * just return the external text
     */
    messageDirty = externalText;
  }
  const messageClean = sanitize(messageDirty, {
    /**
     * Allow `?` as first char in `href` value for anchor tags.
     * To preserve original behavior in addition to this one exception,
     * return `undefined` for all other cases.
     */
    onTagAttr: function (tag, name, value) {
      if (tag == 'a' && name == 'href') {
        if (value.substr(0, 1) === '?') {
          return `${name}="${value}"`;
        }
      }
    },
  });
  return messageClean;
}
function textToKey(text) {
  if (typeof text !== 'string' && typeof text !== 'number') {
    throw new Error('Parameter for textToKey function needs to be of type string or number');
  }
  if (typeof text === 'number') {
    text = String(text);
  }
  // If text is entirely uppercase, just lowercase it all
  if (text.match(/^([A-Z]+)$/)) {
    return text.toLowerCase();
  }
  /**
   * If text is entirely uppercase with trailing non-word chars,
   * strip the non-word chars and lowercase the rest
   */
  if (text.match(/^([A-Z]+[\W]*)$/)) {
    return text.replace(/\W/g, '').toLowerCase();
  }
  /**
   * If we have reached here, the text has word chars (`\w`) mixed with
   * non-word chars (`\W`), so we have to do more for proper transform
   */
  const transformedString = text
    // Matches any non-word character followed up by a word or number character
    .replace(/(\W)([\w\d])/g, (_, p1, p2) => {
      if (p1.match(/['’"”]/) && p2.match(/[a-z]/)) {
        return p2;
      }
      if (p1.match(/\W/) && p2.match(/[a-z]/)) {
        return p2.toUpperCase();
      }
      if (p1.match(/\W/) && p2.match(/\d/)) {
        return p2;
      }
      return p2;
    })
    .replace(/(\W)/g, '');
  return transformedString.charAt(0).toLowerCase() + transformedString.slice(1);
}

/* src/lib/components/_utilities/locale-strings.svelte generated by Svelte v3.55.0 */

function create_else_block$9(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[5].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
  const default_slot_or_fallback = default_slot || fallback_block_1$1(ctx);

  return {
    c() {
      if (default_slot_or_fallback) default_slot_or_fallback.c();
    },
    m(target, anchor) {
      if (default_slot_or_fallback) {
        default_slot_or_fallback.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[4],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
            null,
          );
        }
      } else {
        if (
          default_slot_or_fallback &&
          default_slot_or_fallback.p &&
          (!current || dirty & /*message*/ 2)
        ) {
          default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    },
  };
}

// (11:0) {#if html}
function create_if_block$l(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[5].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);
  const default_slot_or_fallback = default_slot || fallback_block$2(ctx);

  return {
    c() {
      if (default_slot_or_fallback) default_slot_or_fallback.c();
    },
    m(target, anchor) {
      if (default_slot_or_fallback) {
        default_slot_or_fallback.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[4],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
            null,
          );
        }
      } else {
        if (
          default_slot_or_fallback &&
          default_slot_or_fallback.p &&
          (!current || dirty & /*message*/ 2)
        ) {
          default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    },
  };
}

// (14:8) {message}
function fallback_block_1$1(ctx) {
  let t;

  return {
    c() {
      t = text(/*message*/ ctx[1]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*message*/ 2) set_data(t, /*message*/ ctx[1]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (12:8) {@html message}
function fallback_block$2(ctx) {
  let html_tag;
  let html_anchor;

  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(/*message*/ ctx[1], target, anchor);
      insert(target, html_anchor, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*message*/ 2) html_tag.p(/*message*/ ctx[1]);
    },
    d(detaching) {
      if (detaching) detach(html_anchor);
      if (detaching) html_tag.d();
    },
  };
}

function create_fragment$V(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$l, create_else_block$9];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*html*/ ctx[0]) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$W($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { html = false } = $$props;
  let { key } = $$props;
  let { values = undefined } = $$props;
  let message;

  $$self.$$set = ($$props) => {
    if ('html' in $$props) $$invalidate(0, (html = $$props.html));
    if ('key' in $$props) $$invalidate(2, (key = $$props.key));
    if ('values' in $$props) $$invalidate(3, (values = $$props.values));
    if ('$$scope' in $$props) $$invalidate(4, ($$scope = $$props.$$scope));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*key, values*/ 12) {
      {
        $$invalidate(1, (message = interpolate(key, values)));
      }
    }
  };

  return [html, message, key, values, $$scope, slots];
}

class Locale_strings extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$W, create_fragment$V, safe_not_equal, {
      html: 0,
      key: 2,
      values: 3,
    });
  }
}

/* src/lib/components/icons/x-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$U(ctx) {
  let svg;
  let path;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(
        path,
        'd',
        'M 7 4 C 6.744125 4 6.4879687 4.0974687 6.2929688 4.2929688 L 4.2929688 6.2929688 C 3.9019687 6.6839688 3.9019687 7.3170313 4.2929688 7.7070312 L 11.585938 15 L 4.2929688 22.292969 C 3.9019687 22.683969 3.9019687 23.317031 4.2929688 23.707031 L 6.2929688 25.707031 C 6.6839688 26.098031 7.3170313 26.098031 7.7070312 25.707031 L 15 18.414062 L 22.292969 25.707031 C 22.682969 26.098031 23.317031 26.098031 23.707031 25.707031 L 25.707031 23.707031 C 26.098031 23.316031 26.098031 22.682969 25.707031 22.292969 L 18.414062 15 L 25.707031 7.7070312 C 26.098031 7.3170312 26.098031 6.6829688 25.707031 6.2929688 L 23.707031 4.2929688 C 23.316031 3.9019687 22.682969 3.9019687 22.292969 4.2929688 L 15 11.585938 L 7.7070312 4.2929688 C 7.5115312 4.0974687 7.255875 4 7 4 z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 30 30');
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$V($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class X_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$V, create_fragment$U, safe_not_equal, { classes: 0, size: 1 });
  }
}

let style;
// TODO: Implement Zod for better usability
function initialize$5(customStyle) {
  style = readable(customStyle);
}

/* src/lib/components/compositions/dialog/dialog.svelte generated by Svelte v3.55.0 */

function create_else_block$8(ctx) {
  let div;
  let button;
  let xicon;
  let t;
  let div_class_value;
  let current;
  let mounted;
  let dispose;

  xicon = new X_icon({
    props: {
      classes:
        'tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light',
      $$slots: { default: [create_default_slot_1$b] },
      $$scope: { ctx },
    },
  });

  let if_block = /*$style*/ ctx[5]?.logo && create_if_block_1$b(ctx);

  return {
    c() {
      div = element('div');
      button = element('button');
      create_component(xicon.$$.fragment);
      t = space();
      if (if_block) if_block.c();
      attr(
        button,
        'class',
        'tw_dialog-x md:tw_dialog-x_medium tw_focusable-element dark:tw_focusable-element_dark',
      );
      attr(button, 'aria-controls', /*dialogId*/ ctx[1]);

      attr(
        div,
        'class',
        (div_class_value = `tw_pt-10 md:tw_pt-10 tw_text-right ${
          /*$style*/ ctx[5]?.logo ? 'tw_h-32 md:tw_h-36  tw_pb-6' : ''
        }`),
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button);
      mount_component(xicon, button, null);
      append(div, t);
      if (if_block) if_block.m(div, null);
      current = true;

      if (!mounted) {
        dispose = listen(button, 'click', /*click_handler_1*/ ctx[9]);
        mounted = true;
      }
    },
    p(ctx, dirty) {
      const xicon_changes = {};

      if (dirty & /*$$scope*/ 2048) {
        xicon_changes.$$scope = { dirty, ctx };
      }

      xicon.$set(xicon_changes);

      if (!current || dirty & /*dialogId*/ 2) {
        attr(button, 'aria-controls', /*dialogId*/ ctx[1]);
      }

      if (/*$style*/ ctx[5]?.logo) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block_1$b(ctx);
          if_block.c();
          if_block.m(div, null);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }

      if (
        !current ||
        (dirty & /*$style*/ 32 &&
          div_class_value !==
            (div_class_value = `tw_pt-10 md:tw_pt-10 tw_text-right ${
              /*$style*/ ctx[5]?.logo ? 'tw_h-32 md:tw_h-36  tw_pb-6' : ''
            }`))
      ) {
        attr(div, 'class', div_class_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(xicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(xicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(xicon);
      if (if_block) if_block.d();
      mounted = false;
      dispose();
    },
  };
}

// (39:2) {#if withHeader}
function create_if_block$k(ctx) {
  let div1;
  let div0;
  let div0_style_value;
  let t;
  let button;
  let xicon;
  let current;
  let mounted;
  let dispose;

  xicon = new X_icon({
    props: {
      classes:
        'tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light',
      $$slots: { default: [create_default_slot$n] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      div1 = element('div');
      div0 = element('div');
      t = space();
      button = element('button');
      create_component(xicon.$$.fragment);
      attr(div0, 'class', 'tw_dialog-logo dark:tw_dialog-logo_dark');

      attr(
        div0,
        'style',
        (div0_style_value = `--logo-dark: url("${
          /*$style*/ ctx[5]?.logo?.dark
        }"); --logo-light: url("${/*$style*/ ctx[5]?.logo?.light}"); ${
          /*$style*/ ctx[5]?.logo?.height ? `height: ${/*$style*/ ctx[5]?.logo.height}px;` : ''
        } ${/*$style*/ ctx[5]?.logo?.width ? `width: ${/*$style*/ ctx[5]?.logo.width}px;` : ''}`),
      );

      attr(
        button,
        'class',
        'tw_dialog-x md:tw_dialog-x_medium tw_focusable-element dark:tw_focusable-element_dark',
      );
      attr(button, 'aria-controls', /*dialogId*/ ctx[1]);
      attr(div1, 'class', 'tw_dialog-header dark:tw_dialog-header_dark');
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, div0);
      append(div1, t);
      append(div1, button);
      mount_component(xicon, button, null);
      current = true;

      if (!mounted) {
        dispose = listen(button, 'click', /*click_handler*/ ctx[8]);
        mounted = true;
      }
    },
    p(ctx, dirty) {
      if (
        !current ||
        (dirty & /*$style*/ 32 &&
          div0_style_value !==
            (div0_style_value = `--logo-dark: url("${
              /*$style*/ ctx[5]?.logo?.dark
            }"); --logo-light: url("${/*$style*/ ctx[5]?.logo?.light}"); ${
              /*$style*/ ctx[5]?.logo?.height ? `height: ${/*$style*/ ctx[5]?.logo.height}px;` : ''
            } ${
              /*$style*/ ctx[5]?.logo?.width ? `width: ${/*$style*/ ctx[5]?.logo.width}px;` : ''
            }`))
      ) {
        attr(div0, 'style', div0_style_value);
      }

      const xicon_changes = {};

      if (dirty & /*$$scope*/ 2048) {
        xicon_changes.$$scope = { dirty, ctx };
      }

      xicon.$set(xicon_changes);

      if (!current || dirty & /*dialogId*/ 2) {
        attr(button, 'aria-controls', /*dialogId*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(xicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(xicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div1);
      destroy_component(xicon);
      mounted = false;
      dispose();
    },
  };
}

// (71:8) <XIcon           classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"           >
function create_default_slot_1$b(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'closeModal' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (76:6) {#if $style?.logo}
function create_if_block_1$b(ctx) {
  let div;
  let div_style_value;

  return {
    c() {
      div = element('div');
      attr(div, 'class', 'tw_dialog-logo dark:tw_dialog-logo_dark');
      attr(
        div,
        'style',
        (div_style_value = `--logo-dark: url("${
          /*$style*/ ctx[5]?.logo?.dark
        }"); --logo-light: url("${/*$style*/ ctx[5]?.logo?.light}")`),
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);
    },
    p(ctx, dirty) {
      if (
        dirty & /*$style*/ 32 &&
        div_style_value !==
          (div_style_value = `--logo-dark: url("${
            /*$style*/ ctx[5]?.logo?.dark
          }"); --logo-light: url("${/*$style*/ ctx[5]?.logo?.light}")`)
      ) {
        attr(div, 'style', div_style_value);
      }
    },
    d(detaching) {
      if (detaching) detach(div);
    },
  };
}

// (54:8) <XIcon           classes="tw_inline-block tw_fill-current tw_text-secondary-dark dark:tw_text-secondary-light"           >
function create_default_slot$n(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'closeModal' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

function create_fragment$T(ctx) {
  let dialog;
  let current_block_type_index;
  let if_block;
  let t;
  let div;
  let dialog_class_value;
  let current;
  const if_block_creators = [create_if_block$k, create_else_block$8];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*withHeader*/ ctx[3]) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  const default_slot_template = /*#slots*/ ctx[7].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

  return {
    c() {
      dialog = element('dialog');
      if_block.c();
      t = space();
      div = element('div');
      if (default_slot) default_slot.c();
      attr(div, 'class', 'tw_dialog-body');
      attr(dialog, 'id', /*dialogId*/ ctx[1]);
      attr(
        dialog,
        'class',
        (dialog_class_value = `tw_dialog-box dark:tw_dialog-box_dark md:tw_dialog-box_medium ${
          /*forceOpen*/ ctx[2] ? '' : 'tw_dialog-box_animate'
        }`),
      );
      dialog.open = /*forceOpen*/ ctx[2];
    },
    m(target, anchor) {
      insert(target, dialog, anchor);
      if_blocks[current_block_type_index].m(dialog, null);
      append(dialog, t);
      append(dialog, div);

      if (default_slot) {
        default_slot.m(div, null);
      }

      /*dialog_binding*/ ctx[10](dialog);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(dialog, t);
      }

      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[11],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*dialogId*/ 2) {
        attr(dialog, 'id', /*dialogId*/ ctx[1]);
      }

      if (
        !current ||
        (dirty & /*forceOpen*/ 4 &&
          dialog_class_value !==
            (dialog_class_value = `tw_dialog-box dark:tw_dialog-box_dark md:tw_dialog-box_medium ${
              /*forceOpen*/ ctx[2] ? '' : 'tw_dialog-box_animate'
            }`))
      ) {
        attr(dialog, 'class', dialog_class_value);
      }

      if (!current || dirty & /*forceOpen*/ 4) {
        dialog.open = /*forceOpen*/ ctx[2];
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(dialog);
      if_blocks[current_block_type_index].d();
      if (default_slot) default_slot.d(detaching);
      /*dialog_binding*/ ctx[10](null);
    },
  };
}

function instance$U($$self, $$props, $$invalidate) {
  let $style;
  component_subscribe($$self, style, ($$value) => $$invalidate(5, ($style = $$value)));
  let { $$slots: slots = {}, $$scope } = $$props;
  let { closeCallback } = $$props;
  let { dialogEl = null } = $$props;
  let { dialogId } = $$props;
  let { forceOpen = false } = $$props;
  let { withHeader = false } = $$props;

  function closeDialog(args) {
    const { reason } = args || { reason: 'external' };

    function completeClose() {
      dialogEl?.close();
      dialogEl?.classList.remove('tw_dialog-closing');

      // Call dev provided callback function for event hook
      closeCallback && closeCallback({ reason });
    }

    // Create timer in case the CSS is not loaded
    const fallbackTimer = setTimeout(completeClose, 500);

    // If animation starts, then CSS is loaded and timer can be removed
    dialogEl?.addEventListener(
      'animationstart',
      () => {
        // Animation started, so we can rely on CSS, rather than timer
        clearTimeout(fallbackTimer);
      },
      { once: true },
    );

    // Clean up the DOM and complete dialog closing
    dialogEl?.addEventListener('animationend', completeClose, { once: true });

    dialogEl?.classList.add('tw_dialog-closing');
  }

  const click_handler = () => closeDialog({ reason: 'user' });
  const click_handler_1 = () => closeDialog({ reason: 'user' });

  function dialog_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      dialogEl = $$value;
      $$invalidate(0, dialogEl);
    });
  }

  $$self.$$set = ($$props) => {
    if ('closeCallback' in $$props) $$invalidate(6, (closeCallback = $$props.closeCallback));
    if ('dialogEl' in $$props) $$invalidate(0, (dialogEl = $$props.dialogEl));
    if ('dialogId' in $$props) $$invalidate(1, (dialogId = $$props.dialogId));
    if ('forceOpen' in $$props) $$invalidate(2, (forceOpen = $$props.forceOpen));
    if ('withHeader' in $$props) $$invalidate(3, (withHeader = $$props.withHeader));
    if ('$$scope' in $$props) $$invalidate(11, ($$scope = $$props.$$scope));
  };

  return [
    dialogEl,
    dialogId,
    forceOpen,
    withHeader,
    closeDialog,
    $style,
    closeCallback,
    slots,
    click_handler,
    click_handler_1,
    dialog_binding,
    $$scope,
  ];
}

class Dialog extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$U, create_fragment$T, safe_not_equal, {
      closeCallback: 6,
      dialogEl: 0,
      dialogId: 1,
      forceOpen: 2,
      withHeader: 3,
      closeDialog: 4,
    });
  }

  get closeDialog() {
    return this.$$.ctx[4];
  }
}

/* src/lib/components/icons/alert-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$S(ctx) {
  let svg;
  let path;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(
        path,
        'd',
        'M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 16 16');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$T($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class Alert_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$T, create_fragment$S, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/components/icons/info-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$R(ctx) {
  let svg;
  let path;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(
        path,
        'd',
        'M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 16 16');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$S($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class Info_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$S, create_fragment$R, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/components/icons/warning-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$Q(ctx) {
  let svg;
  let path;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(
        path,
        'd',
        'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 16 16');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$R($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class Warning_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$R, create_fragment$Q, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/components/primitives/alert/alert.svelte generated by Svelte v3.55.0 */

function create_else_block$7(ctx) {
  let infoicon;
  let current;
  infoicon = new Info_icon({});

  return {
    c() {
      create_component(infoicon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(infoicon, target, anchor);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(infoicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(infoicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(infoicon, detaching);
    },
  };
}

// (43:33)
function create_if_block_1$a(ctx) {
  let warningicon;
  let current;
  warningicon = new Warning_icon({});

  return {
    c() {
      create_component(warningicon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(warningicon, target, anchor);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(warningicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(warningicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(warningicon, detaching);
    },
  };
}

// (41:4) {#if type === 'error'}
function create_if_block$j(ctx) {
  let alerticon;
  let current;
  alerticon = new Alert_icon({});

  return {
    c() {
      create_component(alerticon.$$.fragment);
    },
    m(target, anchor) {
      mount_component(alerticon, target, anchor);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(alerticon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(alerticon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(alerticon, detaching);
    },
  };
}

function create_fragment$P(ctx) {
  let div;
  let p;
  let current_block_type_index;
  let if_block;
  let t;
  let span;
  let div_class_value;
  let current;
  const if_block_creators = [create_if_block$j, create_if_block_1$a, create_else_block$7];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*type*/ ctx[1] === 'error') return 0;
    if (/*type*/ ctx[1] === 'warning') return 1;
    return 2;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  const default_slot_template = /*#slots*/ ctx[5].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

  return {
    c() {
      div = element('div');
      p = element('p');
      if_block.c();
      t = space();
      span = element('span');
      if (default_slot) default_slot.c();
      attr(p, 'class', 'tw_grid tw_grid-cols-[2em_1fr]');
      attr(
        div,
        'class',
        (div_class_value = `${generateClassString$3(
          /*type*/ ctx[1],
        )} tw_alert dark:tw_alert_dark tw_input-spacing tw_outline-none`),
      );
      attr(div, 'id', /*id*/ ctx[0]);
      attr(div, 'tabindex', '-1');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, p);
      if_blocks[current_block_type_index].m(p, null);
      append(p, t);
      append(p, span);

      if (default_slot) {
        default_slot.m(span, null);
      }

      /*div_binding*/ ctx[6](div);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index !== previous_block_index) {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        }

        transition_in(if_block, 1);
        if_block.m(p, t);
      }

      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 16)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[4],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[4])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*type*/ 2 &&
          div_class_value !==
            (div_class_value = `${generateClassString$3(
              /*type*/ ctx[1],
            )} tw_alert dark:tw_alert_dark tw_input-spacing tw_outline-none`))
      ) {
        attr(div, 'class', div_class_value);
      }

      if (!current || dirty & /*id*/ 1) {
        attr(div, 'id', /*id*/ ctx[0]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      if_blocks[current_block_type_index].d();
      if (default_slot) default_slot.d(detaching);
      /*div_binding*/ ctx[6](null);
    },
  };
}

function generateClassString$3(...args) {
  return args.reduce((prev, curr) => {
    switch (curr) {
      case 'error':
        return `${prev} tw_alert-error dark:tw_alert-error_dark`;
      case 'info':
        return `${prev} tw_alert-info dark:tw_alert-info_dark`;
      case 'success':
        return `${prev} tw_alert-success dark:tw_alert-success_dark`;
      case 'warning':
        return `${prev} tw_alert-warning dark:tw_alert-warning_dark`;
      default:
        return prev;
    }
  }, '');
}

function instance$Q($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { id } = $$props;
  let { needsFocus = false } = $$props;
  let { type = '' } = $$props;
  let divEl;

  function div_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      divEl = $$value;
      $$invalidate(2, divEl);
    });
  }

  $$self.$$set = ($$props) => {
    if ('id' in $$props) $$invalidate(0, (id = $$props.id));
    if ('needsFocus' in $$props) $$invalidate(3, (needsFocus = $$props.needsFocus));
    if ('type' in $$props) $$invalidate(1, (type = $$props.type));
    if ('$$scope' in $$props) $$invalidate(4, ($$scope = $$props.$$scope));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*needsFocus, divEl*/ 12) {
      {
        if (needsFocus) {
          divEl && divEl.focus();
        }
      }
    }
  };

  return [id, type, divEl, needsFocus, $$scope, slots, div_binding];
}

class Alert extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$Q, create_fragment$P, safe_not_equal, {
      id: 0,
      needsFocus: 3,
      type: 1,
    });
  }
}

/* src/lib/components/primitives/spinner/spinner.svelte generated by Svelte v3.55.0 */

function create_fragment$O(ctx) {
  let div;
  let span;
  let t;
  let div_class_value;
  let current;
  t = new Locale_strings({ props: { key: 'loading' } });

  return {
    c() {
      div = element('div');
      span = element('span');
      create_component(t.$$.fragment);
      attr(span, 'class', 'tw_sr-only');
      attr(
        div,
        'class',
        (div_class_value = `tw_spinner tw_animate-spin tw_border-4 tw_inline-block tw_rounded-full ${
          /*colorClass*/ ctx[0]
        } ${/*layoutClasses*/ ctx[1]}`),
      );
      attr(div, 'role', 'status');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, span);
      mount_component(t, span, null);
      current = true;
    },
    p(ctx, [dirty]) {
      if (
        !current ||
        (dirty & /*colorClass, layoutClasses*/ 3 &&
          div_class_value !==
            (div_class_value = `tw_spinner tw_animate-spin tw_border-4 tw_inline-block tw_rounded-full ${
              /*colorClass*/ ctx[0]
            } ${/*layoutClasses*/ ctx[1]}`))
      ) {
        attr(div, 'class', div_class_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(t);
    },
  };
}

function instance$P($$self, $$props, $$invalidate) {
  let { colorClass } = $$props;
  let { layoutClasses } = $$props;

  $$self.$$set = ($$props) => {
    if ('colorClass' in $$props) $$invalidate(0, (colorClass = $$props.colorClass));
    if ('layoutClasses' in $$props) $$invalidate(1, (layoutClasses = $$props.layoutClasses));
  };

  return [colorClass, layoutClasses];
}

class Spinner extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$P, create_fragment$O, safe_not_equal, {
      colorClass: 0,
      layoutClasses: 1,
    });
  }
}

/* src/lib/components/primitives/button/button.svelte generated by Svelte v3.55.0 */

function create_if_block$i(ctx) {
  let spinner;
  let current;

  spinner = new Spinner({
    props: {
      colorClass: 'white',
      layoutClasses: 'tw_h-4 tw_w-4 tw_mr-2',
    },
  });

  return {
    c() {
      create_component(spinner.$$.fragment);
    },
    m(target, anchor) {
      mount_component(spinner, target, anchor);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(spinner.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(spinner, detaching);
    },
  };
}

// (44:8) Submit
function fallback_block$1(ctx) {
  let t;

  return {
    c() {
      t = text('Submit');
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$N(ctx) {
  let button;
  let t;
  let button_class_value;
  let current;
  let mounted;
  let dispose;
  let if_block = /*busy*/ ctx[0] && create_if_block$i();
  const default_slot_template = /*#slots*/ ctx[7].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);
  const default_slot_or_fallback = default_slot || fallback_block$1();

  return {
    c() {
      button = element('button');
      if (if_block) if_block.c();
      t = space();
      if (default_slot_or_fallback) default_slot_or_fallback.c();
      attr(
        button,
        'class',
        (button_class_value = `${generateClassString$2(
          /*style*/ ctx[3],
          /*width*/ ctx[5],
        )} tw_button-base tw_focusable-element dark:tw_focusable-element_dark width-${
          /*width*/ ctx[5]
        } ${/*classes*/ ctx[1]}`),
      );
      attr(button, 'type', /*type*/ ctx[4]);
    },
    m(target, anchor) {
      insert(target, button, anchor);
      if (if_block) if_block.m(button, null);
      append(button, t);

      if (default_slot_or_fallback) {
        default_slot_or_fallback.m(button, null);
      }

      current = true;

      if (!mounted) {
        dispose = listen(button, 'click', function () {
          if (is_function(/*onClick*/ ctx[2])) /*onClick*/ ctx[2].apply(this, arguments);
        });

        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;

      if (/*busy*/ ctx[0]) {
        if (if_block) {
          if (dirty & /*busy*/ 1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$i();
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(button, t);
        }
      } else if (if_block) {
        group_outros();

        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });

        check_outros();
      }

      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[6],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*style, width, classes*/ 42 &&
          button_class_value !==
            (button_class_value = `${generateClassString$2(
              /*style*/ ctx[3],
              /*width*/ ctx[5],
            )} tw_button-base tw_focusable-element dark:tw_focusable-element_dark width-${
              /*width*/ ctx[5]
            } ${/*classes*/ ctx[1]}`))
      ) {
        attr(button, 'class', button_class_value);
      }

      if (!current || dirty & /*type*/ 16) {
        attr(button, 'type', /*type*/ ctx[4]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      transition_in(default_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      transition_out(default_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(button);
      if (if_block) if_block.d();
      if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
      mounted = false;
      dispose();
    },
  };
}

function generateClassString$2(...args) {
  return args.reduce((prev, curr) => {
    switch (curr) {
      case 'primary':
        return `${prev} tw_button-primary dark:tw_button-primary_dark`;
      case 'secondary':
        return `${prev} tw_button-secondary dark:tw_button-secondary_dark`;
      case 'outline':
        return `${prev} tw_button-outline dark:tw_button-outline_dark`;
      case 'auto':
        return `${prev} tw_w-auto`;
      case 'full':
        return `${prev} tw_w-full`;
      default:
        return prev;
    }
  }, '');
}

function instance$O($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { busy = false } = $$props;
  let { classes = '' } = $$props;

  let { onClick = (e) => {} } = $$props;

  let { style = 'outline' } = $$props;
  let { type = null } = $$props;
  let { width = 'auto' } = $$props;

  $$self.$$set = ($$props) => {
    if ('busy' in $$props) $$invalidate(0, (busy = $$props.busy));
    if ('classes' in $$props) $$invalidate(1, (classes = $$props.classes));
    if ('onClick' in $$props) $$invalidate(2, (onClick = $$props.onClick));
    if ('style' in $$props) $$invalidate(3, (style = $$props.style));
    if ('type' in $$props) $$invalidate(4, (type = $$props.type));
    if ('width' in $$props) $$invalidate(5, (width = $$props.width));
    if ('$$scope' in $$props) $$invalidate(6, ($$scope = $$props.$$scope));
  };

  return [busy, classes, onClick, style, type, width, $$scope, slots];
}

class Button extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$O, create_fragment$N, safe_not_equal, {
      busy: 0,
      classes: 1,
      onClick: 2,
      style: 3,
      type: 4,
      width: 5,
    });
  }
}

/*
 * forgerock-sample-web-react
 *
 * decode.js
 *
 * Copyright (c) 2021 ForgeRock. All rights reserved.
 * This software may be modified and distributed under the terms
 * of the MIT license. See the LICENSE file for details.
 */
/**
 * @function htmlDecode - Decodes HTML encoded strings
 * @param {string} input - string that needs to be HTML decoded
 * @returns {string} - decoded string
 */
function htmlDecode(input) {
  // Check if running in server before using the document object
  if (typeof document !== 'object') {
    return null;
  }
  const e = document.createElement('div');
  e.innerHTML = input;
  return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
}

const authIdTimeoutErrorCode = '110';
const constrainedViolationMessage = 'constraint violation';
/**
 * @function convertStringToKey -
 * @param {string} string
 * @returns {string}
 */
function convertStringToKey(string) {
  if (!string) {
    return '';
  }
  if (string.toLocaleLowerCase().includes('constraint violation')) {
    console.error(
      'Delta Sierra error has occurred. Please communicate this to your system administrator.',
    );
    if (string.toLocaleLowerCase().includes('password')) {
      return 'constraintViolationForPassword';
    }
    return 'constraintViolationForValue';
  }
  const replaceFunction = (_, char) => `${char.toLowerCase()}`;
  const normalizedString = string
    .replace(/^([A-Z])/g, replaceFunction)
    .replace(/\s([a-z])/g, (_, char) => `${char.toUpperCase()}`);
  const key = normalizedString.replace(/\W/g, '');
  return key;
}
/**
 * @function initCheckValidation -
 * @returns {boolean}
 */
function initCheckValidation() {
  let hasPrevError = false;
  return function checkValidation(callback) {
    const failedPolices = callback.getOutputByName('failedPolicies', []);
    if (failedPolices.length && !hasPrevError) {
      hasPrevError = true;
      return true;
    }
    return false;
  };
}
/**
 * @function shouldRedirectFromStep -
 * @returns {boolean}
 */
function shouldRedirectFromStep(step) {
  return step.getCallbacksOfType(CallbackType.RedirectCallback).length > 0;
}
/**
 * @function shouldPopulateWithPreviousCallbacks -
 * @param {object} nextStep
 * @param {array} previousCallbacks
 * @param {object} restartedStep
 * @param {number} stepNumber
 * @returns {boolean}
 */
function shouldPopulateWithPreviousCallbacks(
  nextStep,
  previousCallbacks,
  restartedStep,
  stepNumber,
) {
  if (!Array.isArray(previousCallbacks)) {
    return false;
  }
  if (restartedStep.type !== StepType.Step) {
    return false;
  }
  if (stepNumber !== 1) {
    return false;
  }
  const details = nextStep.payload.detail;
  const message = nextStep.payload.message?.toLowerCase();
  /**
   * Now that we know we have previous callbacks, this is of type "Step",
   * it has payload detail or payload message, and it's just the first step,
   * we can populate the new step with old callbacks.
   */
  if (
    details?.errorCode === authIdTimeoutErrorCode ||
    message?.includes(constrainedViolationMessage)
  ) {
    return true;
  }
  // Fallback to false
  return false;
}

const selfSubmittingCallbacks = [
  CallbackType.ConfirmationCallback,
  CallbackType.DeviceProfileCallback,
  CallbackType.PollingWaitCallback,
  CallbackType.SelectIdPCallback,
];
const userInputCallbacks = [
  CallbackType.BooleanAttributeInputCallback,
  CallbackType.ChoiceCallback,
  CallbackType.ConfirmationCallback,
  CallbackType.KbaCreateCallback,
  CallbackType.NameCallback,
  CallbackType.NumberAttributeInputCallback,
  CallbackType.PasswordCallback,
  CallbackType.ReCaptchaCallback,
  CallbackType.SelectIdPCallback,
  CallbackType.StringAttributeInputCallback,
  CallbackType.TermsAndConditionsCallback,
  CallbackType.ValidatedCreatePasswordCallback,
  CallbackType.ValidatedCreateUsernameCallback,
];
// This eventually will be overridable by user of framework
const forceUserInputOptionalityCallbacks = {
  SelectIdPCallback: (callback) => {
    const selectIdpCb = callback;
    return !!selectIdpCb
      .getProviders()
      .find((provider) => provider.provider === 'localAuthentication');
  },
};
function isCbReadyByDefault(callback) {
  if (callback.getType() === CallbackType.ConfirmationCallback) {
    const cb = callback;
    if (cb.getOptions().length === 1) {
      return true;
    }
  }
  return false;
}
function canForceUserInputOptionality(callback) {
  // See if a callback function exists within this collection
  const fn = forceUserInputOptionalityCallbacks[callback.getType()];
  // If there is a function, run it and it will return a boolean
  return fn ? fn(callback) : false;
}
/**
 * @function isSelfSubmitting -
 * @param {object} callback - generic FRCallback from JavaScript SDK
 * @returns
 */
function isSelfSubmitting(callback) {
  return selfSubmittingCallbacks.includes(callback.getType());
}
/**
 * @function isStepSelfSubmittable -
 * @param {array} callbacks - CallbackMetadata
 * @returns
 */
function isStepSelfSubmittable(callbacks, userInputOptional) {
  if (userInputOptional) {
    return true;
  }
  const unsubmittableCallbacks = callbacks.filter(
    (callback) => callback.derived.isUserInputRequired && !callback.derived.isSelfSubmitting,
  );
  return !unsubmittableCallbacks.length;
}
/**
 *
 * @param  {object} callback - Generic callback provided by JavaScript SDK
 * @returns
 */
function requiresUserInput(callback) {
  if (callback.getType() === CallbackType.SelectIdPCallback) {
    return false;
  }
  if (callback.getType() === CallbackType.ConfirmationCallback) {
    const cb = callback;
    if (cb.getOptions().length === 1) {
      return false;
    }
  }
  return userInputCallbacks.includes(callback.getType());
}
// Notice this function can take a user provided argument function to
// override behavior (this doesn't have to be well defined)
function isUserInputOptional(callbackMetadataArray, numOfUserInputCbs, fn) {
  // default reducer function to check if both overriding callback exists
  // along with user input required callbacks
  const fallbackFn = (prev, curr) => {
    if (curr.derived.canForceUserInputOptionality && numOfUserInputCbs > 0) {
      prev = true;
    }
    return prev;
  };
  // Call reduce function with either fallback or user provided function
  return callbackMetadataArray.reduce(fn || fallbackFn, false);
}

/**
 * @function buildCallbackMetadata - Constructs an array of callback metadata that matches to original callback array
 * @param {object} step - The modified Widget step object
 * @param checkValidation - function that checks if current callback is the first invalid callback
 * @returns {array}
 */
function buildCallbackMetadata(step, checkValidation, stageJson) {
  const callbackCount = {};
  return step?.callbacks.map((callback, idx) => {
    const cb = callback;
    const callbackType = cb.getType();
    let stageCbMetadata;
    if (callbackCount[callbackType]) {
      callbackCount[callbackType] = callbackCount[callbackType] + 1;
    } else {
      callbackCount[callbackType] = 1;
    }
    if (stageJson && stageJson[callbackType]) {
      const stageCbArray = stageJson[callbackType];
      stageCbMetadata = stageCbArray[callbackCount[callbackType] - 1];
    }
    return {
      derived: {
        canForceUserInputOptionality: canForceUserInputOptionality(callback),
        isFirstInvalidInput: checkValidation(callback),
        isReadyForSubmission: isCbReadyByDefault(callback),
        isSelfSubmitting: isSelfSubmitting(callback),
        isUserInputRequired: requiresUserInput(callback),
      },
      idx,
      // Only use the `platform` prop if there's metadata to add
      ...(stageCbMetadata && {
        platform: {
          ...stageCbMetadata,
        },
      }),
    };
  });
}
/**
 * @function buildStepMetadata - Constructs a metadata object that summarizes the step from AM
 * @param {array} callbackMetadataArray - The array returned from buildCallbackMetadata
 * @returns {object}
 */
function buildStepMetadata(callbackMetadataArray, stageJson) {
  const numOfUserInputCbs = callbackMetadataArray.filter(
    (cb) => !!cb.derived.isUserInputRequired,
  ).length;
  const userInputOptional = isUserInputOptional(callbackMetadataArray, numOfUserInputCbs);
  let stageMetadata;
  if (stageJson) {
    stageMetadata = Object.keys(stageJson).reduce((prev, curr) => {
      // Filter out objects or arrays as those are for the callbacks
      if (typeof stageJson[curr] !== 'object') {
        prev[curr] = stageJson[curr];
      }
      return prev;
    }, {});
  }
  return {
    derived: {
      isStepSelfSubmittable: isStepSelfSubmittable(callbackMetadataArray, userInputOptional),
      isUserInputOptional: userInputOptional,
      numOfCallbacks: callbackMetadataArray.length,
      numOfSelfSubmittableCbs: callbackMetadataArray.filter((cb) => !!cb.derived.isSelfSubmitting)
        .length,
      numOfUserInputCbs: numOfUserInputCbs,
    },
    // Only use the `platform` prop if there's metadata to add
    ...(stageMetadata && {
      platform: {
        ...stageMetadata,
      },
    }),
  };
}

function initializeStack(initOptions) {
  const initialValue = initOptions ? [initOptions] : [];
  const { update, set, subscribe } = writable(initialValue);
  // Assign to exported variable (see bottom of file)
  stack = {
    pop: async () => {
      return new Promise((resolve) => {
        update((current) => {
          let state;
          if (current.length) {
            state = current.slice(0, -1);
          } else {
            state = current;
          }
          resolve([...state]);
          return state;
        });
      });
    },
    push: async (options) => {
      return new Promise((resolve) => {
        update((current) => {
          let state;
          if (!current.length) {
            state = [{ ...options }];
          } else if (options && options?.tree !== current[current.length - 1]?.tree) {
            state = [...current, options];
          } else {
            state = current;
          }
          resolve([...state]);
          return state;
        });
      });
    },
    reset: () => {
      set([]);
    },
    subscribe,
  };
  return stack;
}
function initialize$4(initOptions) {
  const { set, subscribe } = writable({
    completed: false,
    error: null,
    loading: false,
    metadata: null,
    step: null,
    successful: false,
    response: null,
  });
  const stack = initializeStack();
  let stepNumber = 0;
  async function next(prevStep = null, nextOptions, resumeUrl) {
    /**
     * Create an options object with nextOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
     */
    const options = {
      ...initOptions,
      ...nextOptions,
    };
    /**
     * Save previous step information just in case we have a total
     * form failure due to 400 response from ForgeRock.
     */
    let previousCallbacks;
    if (prevStep && prevStep.type === StepType.Step) {
      previousCallbacks = prevStep?.callbacks;
    }
    const previousPayload = prevStep?.payload;
    let nextStep;
    set({
      completed: false,
      error: null,
      loading: true,
      metadata: null,
      step: prevStep,
      successful: false,
      response: null,
    });
    try {
      if (resumeUrl) {
        // If resuming an unknown journey remove the tree from the options
        options.tree = undefined;
        /**
         * Attempt to resume journey
         */
        nextStep = await FRAuth.resume(resumeUrl, options);
      } else if (prevStep) {
        // If continuing on a tree remove it from the options
        options.tree = undefined;
        /**
         * Initial attempt to retrieve next step
         */
        nextStep = await FRAuth.next(prevStep, options);
      } else {
        nextStep = await FRAuth.next(undefined, options);
      }
    } catch (err) {
      console.error(`Next step request | ${err}`);
      /**
       * Setup an object to display failure message
       */
      nextStep = new FRLoginFailure({
        message: interpolate('unknownNetworkError'),
      });
    }
    if (nextStep.type === StepType.Step) {
      const stageAttribute = nextStep.getStage();
      let stageJson = null;
      // Check if stage attribute is serialized JSON
      if (stageAttribute && stageAttribute.includes('{')) {
        try {
          stageJson = JSON.parse(stageAttribute);
        } catch (err) {
          console.warn('Stage attribute value was not parsable');
        }
      }
      const callbackMetadata = buildCallbackMetadata(nextStep, initCheckValidation(), stageJson);
      const stepMetadata = buildStepMetadata(callbackMetadata, stageJson);
      // Iterate on a successful progression
      stepNumber = stepNumber + 1;
      set({
        completed: false,
        error: null,
        loading: false,
        metadata: {
          callbacks: callbackMetadata,
          step: stepMetadata,
        },
        step: nextStep,
        successful: false,
        response: null,
      });
    } else if (nextStep.type === StepType.LoginSuccess) {
      /**
       * SUCCESSFUL COMPLETION BLOCK
       */
      // Set final state
      set({
        completed: true,
        error: null,
        loading: false,
        metadata: null,
        step: null,
        successful: true,
        response: nextStep.payload,
      });
    } else if (nextStep.type === StepType.LoginFailure) {
      /**
       * FAILURE COMPLETION BLOCK
       *
       * Grab failure message, which may contain encoded HTML
       */
      const failureMessageStr = htmlDecode(nextStep.payload.message || '');
      let restartedStep = null;
      try {
        /**
         * Restart tree to get fresh step
         */
        restartedStep = await FRAuth.next(undefined, options);
      } catch (err) {
        console.error(`Restart failed step request | ${err}`);
        /**
         * Setup an object to display failure message
         */
        restartedStep = new FRLoginFailure({
          message: interpolate('unknownNetworkError'),
        });
      }
      /**
       * Now that we have a new authId (the identification of the
       * fresh step) let's populate this new step with old callback data if
       * this is step one and meets a few criteria.
       *
       * If error code is 110 or error message includes "Constrained Violation",
       * then the issue needs special handling.
       *
       * If this is the first step in the journey, replace the callbacks with
       * existing callbacks to resubmit with a fresh authId.
       ******************************************************************* */
      if (
        shouldPopulateWithPreviousCallbacks(nextStep, previousCallbacks, restartedStep, stepNumber)
      ) {
        /**
         * TypeScript notes:
         *
         * Assert that restartedStep is FRStep as that is required for the above condition to be true.
         * Also, assert that previousCallbacks is FRCallback[] as that too is required for above to be true.
         *
         * Attempt a refactor using Ryan's suggestion found here: https://www.typescriptlang.org/play?#code/PTAEHUFMBsGMHsC2lQBd5oBYoCoE8AHSAZVgCcBLA1UABWgEM8BzM+AVwDsATAGiwoBnUENANQAd0gAjQRVSQAUCEmYKsTKGYUAbpGF4OY0BoadYKdJMoL+gzAzIoz3UNEiPOofEVKVqAHSKymAAmkYI7NCuqGqcANag8ABmIjQUXrFOKBJMggBcISGgoAC0oACCbvCwDKgU8JkY7p7ehCTkVDQS2E6gnPCxGcwmZqDSTgzxxWWVoASMFmgYkAAeRJTInN3ymj4d-jSCeNsMq-wuoPaOltigAKoASgAywhK7SbGQZIIz5VWCFzSeCrZagNYbChbHaxUDcCjJZLfSDbExIAgUdxkUBIursJzCFJtXydajBZJcWD1RqgJyofGcABqDGg7EgAB4cAA+AAUq3y3nBqwUPGEglQlE4IwA-FcJcNQALOOxENJvgBKUAAb0UJT1CNAPNQ7SJoIAvBbQAAiZWq75WzV0hmgUG6vXg6CCFBOsheVZukoB0CKAC+incNCGUtAZtpkHpvuZrI54slzF5VoAjA6ANzkynUrxCYjyqV8gWphUAH36KrVZHVAuB8BaXh17oNRpNqXNloA5JWpX3Ne33XqfZkyGy8+6w0GJziWV683PO8XS8wjXFmOqR0Go8wAhlYKzuPoeVbsNBoPBc6HgiocM0PL7QIh4H0GMD2JG7owpewDDMJA-AnuoiRfvAegiF4VoAKKrAwiALPoVpJNiVrgA4qADqAABykASFaQQqAA8l8ZDvF6-DAUcqCOAorjSHgcbvjoCpfF6aKINCwiXF8kgftEIgGBw2ILEwrAcDwQQlEAA
         */
        restartedStep = restartedStep;
        // Rebuild callbacks onto restartedStep
        restartedStep.callbacks = previousCallbacks;
        // Rebuild payload onto restartedStep ensuring the use of the NEW authId
        restartedStep.payload = {
          ...previousPayload,
          authId: restartedStep.payload.authId,
        };
        const details = nextStep.payload.detail;
        /**
         * Only if the authId expires do we resubmit with same callback values
         */
        if (details?.errorCode === authIdTimeoutErrorCode) {
          restartedStep = await FRAuth.next(restartedStep, options);
        }
      }
      /**
       * SET RESULT OF SUBSEQUENT REQUEST
       *
       * After the above attempts to salvage the form submission, let's return
       * the final result to the user.
       */
      if (restartedStep.type === StepType.Step) {
        const stageAttribute = restartedStep.getStage();
        let stageJson = null;
        // Check if stage attribute is serialized JSON
        if (stageAttribute && stageAttribute.includes('{')) {
          try {
            stageJson = JSON.parse(stageAttribute);
          } catch (err) {
            console.warn('Stage attribute value was not parsable');
          }
        }
        const callbackMetadata = buildCallbackMetadata(
          restartedStep,
          initCheckValidation(),
          stageJson,
        );
        const stepMetadata = buildStepMetadata(callbackMetadata, stageJson);
        set({
          completed: false,
          error: {
            code: nextStep.getCode(),
            message: failureMessageStr,
            // TODO: Should we remove the callbacks for PII info?
            step: prevStep?.payload,
          },
          loading: false,
          metadata: {
            callbacks: callbackMetadata,
            step: stepMetadata,
          },
          step: restartedStep,
          successful: false,
          response: null,
        });
      } else if (restartedStep.type === StepType.LoginSuccess) {
        set({
          completed: true,
          error: null,
          loading: false,
          metadata: null,
          step: null,
          successful: true,
          response: restartedStep.payload,
        });
      } else {
        set({
          completed: true,
          error: {
            code: nextStep.getCode(),
            message: failureMessageStr,
            // TODO: Should we remove the callbacks for PII info?
            step: prevStep?.payload,
          },
          loading: false,
          metadata: null,
          step: null,
          successful: false,
          response: restartedStep.payload,
        });
      }
    }
  }
  async function pop() {
    reset();
    const updatedStack = await stack.pop();
    const currentJourney = updatedStack[updatedStack.length - 1];
    await start(currentJourney);
  }
  async function push(newOptions) {
    reset();
    await stack.push(newOptions);
    await start(newOptions);
  }
  async function resume(url, resumeOptions) {
    await next(undefined, resumeOptions, url);
  }
  async function start(startOptions) {
    await stack.push(startOptions);
    await next(undefined, startOptions);
  }
  function reset() {
    set({
      completed: false,
      error: null,
      loading: false,
      metadata: null,
      step: null,
      successful: false,
      response: null,
    });
  }
  return {
    next,
    pop,
    push,
    reset,
    resume,
    start,
    subscribe,
  };
}
let stack;

/* src/lib/components/primitives/form/form.svelte generated by Svelte v3.55.0 */

function create_fragment$M(ctx) {
  let form;
  let form_class_value;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = /*#slots*/ ctx[8].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

  return {
    c() {
      form = element('form');
      if (default_slot) default_slot.c();
      attr(form, 'aria-describedby', /*ariaDescribedBy*/ ctx[1]);
      attr(form, 'id', /*id*/ ctx[2]);

      attr(
        form,
        'class',
        (form_class_value = `tw_form-base ${
          /*isFormValid*/ ctx[3] ? 'tw_form-valid' : 'tw_form-invalid'
        } tw_outline-none`),
      );

      form.noValidate = true;
      attr(form, 'tabindex', '-1');
    },
    m(target, anchor) {
      insert(target, form, anchor);

      if (default_slot) {
        default_slot.m(form, null);
      }

      /*form_binding*/ ctx[9](form);
      current = true;

      if (!mounted) {
        dispose = listen(form, 'submit', prevent_default(/*formSubmit*/ ctx[4]));
        mounted = true;
      }
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[7],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*ariaDescribedBy*/ 2) {
        attr(form, 'aria-describedby', /*ariaDescribedBy*/ ctx[1]);
      }

      if (!current || dirty & /*id*/ 4) {
        attr(form, 'id', /*id*/ ctx[2]);
      }

      if (
        !current ||
        (dirty & /*isFormValid*/ 8 &&
          form_class_value !==
            (form_class_value = `tw_form-base ${
              /*isFormValid*/ ctx[3] ? 'tw_form-valid' : 'tw_form-invalid'
            } tw_outline-none`))
      ) {
        attr(form, 'class', form_class_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(form);
      if (default_slot) default_slot.d(detaching);
      /*form_binding*/ ctx[9](null);
      mounted = false;
      dispose();
    },
  };
}

function instance$N($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { ariaDescribedBy } = $$props;
  let { formEl = null } = $$props;
  let { id = 'formId' } = $$props;
  let { needsFocus = false } = $$props;
  let { onSubmitWhenValid } = $$props;
  let isFormValid = false;

  /**
   * @function formSubmit - responsible for form validation prior to calling provided submit function
   * @param {Object} event - HTML form event
   * @return {undefined}
   */
  // TODO: Using an `any` to give us time to figure out these weird event types that just changed
  function formSubmit(event) {
    /**
     * Reference for validation: https://www.aleksandrhovhannisyan.com/blog/html-input-validation-without-a-form/
     */
    const form = event.target;

    let isFirstInvalidInput = null;
    $$invalidate(3, (isFormValid = false)); // Restart with `false`

    // Iterate over all children of the form, and pluck out the inputs
    Array.from(form.children).forEach((el, idx) => {
      // First child will be a `div`, so query the actual form elements
      // eslint-disable-next-line no-undef
      const inputs = el.querySelectorAll('input, select, textarea');

      // If element has no form input, return early
      if (!inputs?.length) {
        return;
      }

      // Reports input's value validity and triggers native error handling
      // const isValid = input.reportValidity();
      /**
       * Not the most efficient thing to do, but fieldsets contain more than one input
       * The vast majority of these will be a list of one
       */
      Array.from(inputs).forEach((input) => {
        /**
         * Just check validity, but don't "report" it
         * The data attribute is a string of 'true', 'false', OR the value undefined
         */
        const isValid = input.checkValidity() && input.dataset.forceValidityFailure !== 'true';

        // debugger;
        // Grab the associated elements to this input
        const messageKey = input.getAttribute('aria-describedby') || '';

        const messageContainer = document.getElementById(messageKey);
        const messageEl = messageContainer?.querySelector('.__input-message');

        // If input is invalid, mark it with error and message
        if (!isValid) {
          input.setAttribute('aria-invalid', 'true');

          if (messageKey) {
            messageEl?.classList.add('tw_isInvalid');
            messageEl?.classList.remove('tw_hidden');
          }

          // If there is no previous invalid input, this input is first and receives focus
          if (isFirstInvalidInput === null) {
            input.focus();
            isFirstInvalidInput = idx;
          }
        } else {
          input.setAttribute('aria-invalid', 'false');
          messageEl?.classList.remove('tw_isInvalid');
          messageEl?.classList.add('tw_hidden');
        }
      });
    });

    // If there's no invalid input, submit form.
    if (isFirstInvalidInput === null) {
      $$invalidate(3, (isFormValid = true));
      onSubmitWhenValid(event, isFormValid);
    }
  }

  function form_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      formEl = $$value;
      $$invalidate(0, formEl);
    });
  }

  $$self.$$set = ($$props) => {
    if ('ariaDescribedBy' in $$props) $$invalidate(1, (ariaDescribedBy = $$props.ariaDescribedBy));
    if ('formEl' in $$props) $$invalidate(0, (formEl = $$props.formEl));
    if ('id' in $$props) $$invalidate(2, (id = $$props.id));
    if ('needsFocus' in $$props) $$invalidate(5, (needsFocus = $$props.needsFocus));
    if ('onSubmitWhenValid' in $$props)
      $$invalidate(6, (onSubmitWhenValid = $$props.onSubmitWhenValid));
    if ('$$scope' in $$props) $$invalidate(7, ($$scope = $$props.$$scope));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*needsFocus, formEl*/ 33) {
      {
        if (needsFocus) {
          formEl && formEl.focus();
        }
      }
    }
  };

  return [
    formEl,
    ariaDescribedBy,
    id,
    isFormValid,
    formSubmit,
    needsFocus,
    onSubmitWhenValid,
    $$scope,
    slots,
    form_binding,
  ];
}

class Form extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$N, create_fragment$M, safe_not_equal, {
      ariaDescribedBy: 1,
      formEl: 0,
      id: 2,
      needsFocus: 5,
      onSubmitWhenValid: 6,
    });
  }
}

/* src/lib/components/_utilities/server-strings.svelte generated by Svelte v3.55.0 */

function create_else_block$6(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[4].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
  const default_slot_or_fallback = default_slot || fallback_block_1(ctx);

  return {
    c() {
      if (default_slot_or_fallback) default_slot_or_fallback.c();
    },
    m(target, anchor) {
      if (default_slot_or_fallback) {
        default_slot_or_fallback.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[3],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
            null,
          );
        }
      } else {
        if (
          default_slot_or_fallback &&
          default_slot_or_fallback.p &&
          (!current || dirty & /*message*/ 2)
        ) {
          default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    },
  };
}

// (10:0) {#if html}
function create_if_block$h(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[4].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);
  const default_slot_or_fallback = default_slot || fallback_block(ctx);

  return {
    c() {
      if (default_slot_or_fallback) default_slot_or_fallback.c();
    },
    m(target, anchor) {
      if (default_slot_or_fallback) {
        default_slot_or_fallback.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[3],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
            null,
          );
        }
      } else {
        if (
          default_slot_or_fallback &&
          default_slot_or_fallback.p &&
          (!current || dirty & /*message*/ 2)
        ) {
          default_slot_or_fallback.p(ctx, !current ? -1 : dirty);
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot_or_fallback, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot_or_fallback, local);
      current = false;
    },
    d(detaching) {
      if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    },
  };
}

// (13:8) {message}
function fallback_block_1(ctx) {
  let t;

  return {
    c() {
      t = text(/*message*/ ctx[1]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*message*/ 2) set_data(t, /*message*/ ctx[1]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (11:8) {@html message}
function fallback_block(ctx) {
  let html_tag;
  let html_anchor;

  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(/*message*/ ctx[1], target, anchor);
      insert(target, html_anchor, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*message*/ 2) html_tag.p(/*message*/ ctx[1]);
    },
    d(detaching) {
      if (detaching) detach(html_anchor);
      if (detaching) html_tag.d();
    },
  };
}

function create_fragment$L(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$h, create_else_block$6];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*html*/ ctx[0]) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$M($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { html = false } = $$props;
  let { string } = $$props;
  let message;

  $$self.$$set = ($$props) => {
    if ('html' in $$props) $$invalidate(0, (html = $$props.html));
    if ('string' in $$props) $$invalidate(2, (string = $$props.string));
    if ('$$scope' in $$props) $$invalidate(3, ($$scope = $$props.$$scope));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*string*/ 4) {
      {
        $$invalidate(1, (message = sanitize(string)));
      }
    }
  };

  return [html, message, string, $$scope, slots];
}

class Server_strings extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$M, create_fragment$L, safe_not_equal, { html: 0, string: 2 });
  }
}

/* src/lib/components/icons/shield-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$K(ctx) {
  let svg;
  let path;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(
        path,
        'd',
        'M8 0c-.69 0-1.843.265-2.928.56-1.11.3-2.229.655-2.887.87a1.54 1.54 0 0 0-1.044 1.262c-.596 4.477.787 7.795 2.465 9.99a11.777 11.777 0 0 0 2.517 2.453c.386.273.744.482 1.048.625.28.132.581.24.829.24s.548-.108.829-.24a7.159 7.159 0 0 0 1.048-.625 11.775 11.775 0 0 0 2.517-2.453c1.678-2.195 3.061-5.513 2.465-9.99a1.541 1.541 0 0 0-1.044-1.263 62.467 62.467 0 0 0-2.887-.87C9.843.266 8.69 0 8 0zm0 5a1.5 1.5 0 0 1 .5 2.915l.385 1.99a.5.5 0 0 1-.491.595h-.788a.5.5 0 0 1-.49-.595l.384-1.99A1.5 1.5 0 0 1 8 5z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '-2 0 20 20');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$L($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class Shield_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$L, create_fragment$K, safe_not_equal, { classes: 0, size: 1 });
  }
}

const journeyConfigItemSchema = mod.object({
  journey: mod.string().optional(),
  match: mod
    .string()
    .regex(/^(#\/service|\?journey)/, {
      message: 'HREF string must start with `?journey` or `#/service`',
    })
    .array(),
});
const journeyConfigSchema = mod.object({
  forgotPassword: journeyConfigItemSchema,
  forgotUsername: journeyConfigItemSchema,
  login: journeyConfigItemSchema,
  register: journeyConfigItemSchema,
});
const defaultJourneys = {
  forgotPassword: {
    journey: 'ResetPassword',
    match: ['#/service/ResetPassword', '?journey=ResetPassword'],
  },
  forgotUsername: {
    journey: 'ForgottenUsername',
    match: ['#/service/ForgottenUsername', '?journey=ForgottenUsername'],
  },
  login: {
    journey: undefined,
    match: ['#/service/Login', '?journey'],
  },
  register: {
    journey: 'Registration',
    match: ['#/service/Registration', '?journey=Registration'],
  },
};
// Ensure default follows schema
journeyConfigSchema.parse(defaultJourneys);
let configuredJourneys;
function initialize$3(customJourneys) {
  if (customJourneys) {
    // Provide developer feedback if customized
    journeyConfigSchema.parse(customJourneys);
    const arr = Object.keys(customJourneys);
    configuredJourneys = readable(
      arr.map((key) => ({
        ...customJourneys[key],
        key,
      })),
    );
  } else {
    const arr = Object.keys(defaultJourneys);
    configuredJourneys = readable(
      arr.map((key) => ({
        ...defaultJourneys[key],
        key,
      })),
    );
  }
}

/* src/lib/journey/stages/_utilities/back-to.svelte generated by Svelte v3.55.0 */

function create_if_block$g(ctx) {
  let p;
  let button;
  let t_value = interpolate(/*string*/ ctx[1]) + '';
  let t;
  let mounted;
  let dispose;

  return {
    c() {
      p = element('p');
      button = element('button');
      t = text(t_value);
      attr(
        p,
        'class',
        'tw_my-4 tw_text-base tw_text-center tw_text-link-dark dark:tw_text-link-light',
      );
    },
    m(target, anchor) {
      insert(target, p, anchor);
      append(p, button);
      append(button, t);

      if (!mounted) {
        dispose = listen(button, 'click', prevent_default(/*click_handler*/ ctx[4]));
        mounted = true;
      }
    },
    p(ctx, dirty) {
      if (dirty & /*string*/ 2 && t_value !== (t_value = interpolate(/*string*/ ctx[1]) + ''))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(p);
      mounted = false;
      dispose();
    },
  };
}

function create_fragment$J(ctx) {
  let if_block_anchor;
  let if_block = /*$stack*/ ctx[2].length > 1 && create_if_block$g(ctx);

  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx, [dirty]) {
      if (/*$stack*/ ctx[2].length > 1) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block$g(ctx);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$K($$self, $$props, $$invalidate) {
  let $stack;
  let $configuredJourneys;
  component_subscribe($$self, configuredJourneys, ($$value) =>
    $$invalidate(5, ($configuredJourneys = $$value)),
  );
  let { journey } = $$props;
  let stack = journey.stack;
  component_subscribe($$self, stack, (value) => $$invalidate(2, ($stack = value)));
  let string = '';

  function constructString() {
    const currentJourney = $configuredJourneys.find((journey) => {
      return journey.journey === $stack[$stack.length - 2]?.tree;
    });

    const key = currentJourney?.key;

    const capitalizedKey =
      typeof key === 'string' ? key.replace(/([a-z])/, (_, char) => `${char.toUpperCase()}`) : key;

    return `backTo${capitalizedKey || 'Default'}`;
  }

  const click_handler = () => {
    journey?.pop();
  };

  $$self.$$set = ($$props) => {
    if ('journey' in $$props) $$invalidate(0, (journey = $$props.journey));
  };

  {
    $$invalidate(1, (string = constructString()));
  }

  return [journey, string, $stack, stack, click_handler];
}

class Back_to extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$K, create_fragment$J, safe_not_equal, { journey: 0 });
  }
}

/**
 * @function captureLinks - This is a callback for onMount that internally handled links and prevents navigation
 * @param {object} linkWrapper - The object return from `bind:this` attribute on an native element
 * @param {object} currentJourney - The current stage's journey object
 */
function captureLinks(linkWrapper, currentJourney) {
  const journeys = get_store_value(configuredJourneys);
  const stack = get_store_value(currentJourney.stack);
  linkWrapper.addEventListener('click', (event) => {
    const target = event.target;
    const href = target.hasAttribute('href') && target.getAttribute('href');
    const { action, journey } = matchJourneyAndDecideAction(href, journeys, stack);
    if (!action) {
      // If no action is required, return early and allow default behavior
      return;
    }
    // Action is required, so prevent default behavior
    event.preventDefault();
    // Now, push or pop accordingly
    if (action === 'push') {
      currentJourney.push({ tree: journey });
    } else if (action === 'pop') {
      currentJourney.pop();
    }
  });
}
/**
 * Exporting this solely to unit test the logic. It is not intended for external use.
 * @private - compares requested and current journey, then pops or pushes accordingly
 * @param href
 * @param journeys
 * @param stack
 */
function matchJourneyAndDecideAction(href, journeys, stack) {
  if (href) {
    /**
     * Does this href match an item configured in the journeys?
     */
    const match = journeys.find((item) => {
      return item.match.find((string) => {
        return href === string;
      });
    });
    if (match) {
      const previousJourney = stack[stack.length - 2];
      if (!previousJourney || previousJourney.tree !== match.journey) {
        return { action: 'push', journey: match.journey };
      } else {
        return { action: 'pop' };
      }
    } else {
      return { action: null };
    }
  } else {
    return { action: null };
  }
}

/** *********************************************
 * NEW "NORMALIZED" METHODS
 */
function getInputTypeFromPolicies(policies) {
  const value = policies?.value;
  if (typeof value !== 'object') {
    return 'text';
  }
  const reqs = value?.policyRequirements;
  if (!Array.isArray(reqs)) {
    return 'text';
  }
  if (reqs.includes('VALID_EMAIL_ADDRESS_FORMAT')) {
    return 'email';
  }
  if (reqs.includes('VALID_USERNAME')) {
    return 'text';
  }
  return 'text';
}
function getValidationFailureParams(failedPolicy) {
  if (failedPolicy?.policyRequirement === 'CHARACTER_SET') {
    const params = failedPolicy?.params;
    return params?.['character-sets'].map(convertCharacterSetToRuleObj);
  } else if (failedPolicy?.policyRequirement === 'LENGTH_BASED') {
    const params = failedPolicy?.params;
    const min = params?.['min-password-length'] || 0;
    const max = params?.['max-password-length'] || null;
    const arr = [];
    if (max) {
      arr.push({
        length: max,
        message: interpolate('exceedsMaximumCharacterLength', { max: String(max) }),
        rule: 'maximumLength',
      });
    }
    if (min) {
      arr.push({
        length: min,
        message: interpolate('doesNotMeetMinimumCharacterLength', { min: String(min) }),
        rule: 'minimumLength',
      });
    }
    return arr;
  } else if (failedPolicy?.policyRequirement === 'VALID_USERNAME') {
    return [
      {
        length: null,
        message: interpolate('chooseDifferentUsername'),
        rule: 'validUsername',
      },
    ];
  } else if (failedPolicy?.policyRequirement === 'VALID_EMAIL_ADDRESS_FORMAT') {
    return [
      {
        length: null,
        message: interpolate('invalidEmailAddress'),
        rule: 'validEmailAddress',
      },
    ];
  } else {
    return [
      {
        length: null,
        message: interpolate('pleaseCheckValue'),
        rule: 'unknown',
      },
    ];
  }
}
function getValidationMessageString(policy) {
  switch (policy?.policyId) {
    case 'at-least-X-capitals': {
      const params = policy?.params;
      const length = params?.numCaps;
      return interpolate('minimumNumberOfUppercase', { num: String(length) });
    }
    case 'at-least-X-numbers': {
      const params = policy?.params;
      const length = params?.numNums;
      return interpolate('minimumNumberOfNumbers', { num: String(length) });
    }
    case 'cannot-contain-characters': {
      const params = policy?.params;
      const chars = params?.forbiddenChars.reduce((prev, curr) => {
        prev = `${prev ? `${prev}, ` : `${prev}`} ${curr}`;
        return prev;
      }, '');
      return interpolate('fieldCanNotContainFollowingCharacters', { chars });
    }
    case 'cannot-contain-others': {
      const params = policy?.params;
      const fields = params?.disallowedFields?.reduce((prev, curr) => {
        prev = `${prev ? `${prev}, ` : `${prev}`} ${interpolate(curr)}`;
        return prev;
      }, '');
      return interpolate('fieldCanNotContainFollowingValues', { fields });
    }
    case 'maximum-length': {
      const params = policy?.params;
      const length = params?.maxLength;
      if (length > 100) {
        return '';
      }
      return interpolate('notToExceedMaximumCharacterLength', { max: String(length) });
    }
    case 'minimum-length': {
      const params = policy?.params;
      const length = params?.minLength;
      if (length === 1) {
        return '';
      }
      return interpolate('noLessThanMinimumCharacterLength', { min: String(length) });
    }
    /**
     * The below cases can be handled, but I think they create more noise than value to the user
     */
    case 'not-empty':
      // return interpolate('fieldCanNotBeEmpty');
      return '';
    case 'required':
      // return interpolate('requiredField');
      return '';
    case 'valid-username':
      // return interpolate('chooseDifferentUsername');
      return '';
    case 'valid-email-address-format':
      // return interpolate('useValidEmail');
      return '';
    case 'valid-type':
      return '';
    default:
      return '';
  }
}
function getValidationFailures(callback, label) {
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  const parsedPolicies = parseFailedPolicies(failedPolicies, label);
  return parsedPolicies.map((policy) => {
    return {
      params: policy?.params,
      policyRequirement: policy?.policyRequirement || '',
      restructured: getValidationFailureParams(policy),
    };
  });
}
function getValidationPolicies(policies) {
  if (typeof policies !== 'object' && !policies) {
    return [];
  }
  const reqs = policies?.policies;
  if (!Array.isArray(reqs)) {
    return [];
  }
  return reqs
    .map((policy) => {
      return {
        message: getValidationMessageString(policy),
        ...(policy?.params && { params: policy?.params }),
        ...(policy?.policyId && { policyId: policy?.policyId }),
      };
    })
    .filter((policy) => !!policy.message);
}
function isInputRequired(callback) {
  const policies = callback.getPolicies && callback.getPolicies();
  let isRequired = false;
  if (policies?.policyRequirements) {
    isRequired = policies.policyRequirements.includes('REQUIRED');
  } else if (callback.isRequired) {
    isRequired = callback.isRequired();
  }
  return isRequired;
}
function convertCharacterSetToRuleObj(set) {
  const arr = set.split(':');
  const num = arr[0];
  const type = arr[1];
  if (type === '0123456789') {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfNumbers', { num: String(num) }),
      rule: 'numbers',
    };
  } else if (type === 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfUppercase', { num: String(num) }),
      rule: 'uppercase',
    };
  } else if (type === 'abcdefghijklmnopqrstuvwxyz') {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfLowercase', { num: String(num) }),
      rule: 'lowercase',
    };
  } else if (type.includes('@') || type.includes('!') || type.includes('*') || type.includes('#')) {
    return {
      length: Number(num),
      message: interpolate('minimumNumberOfSymbols', { num: String(num) }),
      rule: 'symbols',
    };
  } else {
    return {
      length: Number(num),
      message: interpolate('pleaseCheckValue'),
      rule: 'unknown',
    };
  }
}
function parseFailedPolicies(policies, label) {
  return policies.map((policy) => {
    if (typeof policy === 'string') {
      try {
        return JSON.parse(policy);
      } catch (err) {
        console.error(`Parsing failure for ${label}`);
      }
    } else {
      return policy;
    }
  });
}
/** *********************************************
 * OLD METHODS
 */
function getAttributeValidationFailureText(callback) {
  // TODO: Mature this utility for better parsing and display
  const failedPolicies = callback.getFailedPolicies && callback.getFailedPolicies();
  return failedPolicies.reduce((prev, curr) => {
    switch (curr.policyRequirement) {
      default:
        prev = `${prev}${interpolate('pleaseCheckValue')}`;
    }
    return prev;
  }, '');
}

/* src/lib/components/primitives/message/input-message.svelte generated by Svelte v3.55.0 */

function create_if_block$f(ctx) {
  let p;
  let p_class_value;
  let p_id_value;

  return {
    c() {
      p = element('p');
      attr(
        p,
        'class',
        (p_class_value = `${/*classes*/ ctx[0]} __input-message ${
          !(/*showMessage*/ ctx[3]) ? 'tw_hidden' : ''
        } ${generateClassString$1(/*type*/ ctx[4])}`),
      );
      attr(p, 'id', (p_id_value = `${/*key*/ ctx[2] ? `${/*key*/ ctx[2]}-message` : ''}`));
    },
    m(target, anchor) {
      insert(target, p, anchor);
      p.innerHTML = /*cleanMessage*/ ctx[5];
    },
    p(ctx, dirty) {
      if (dirty & /*cleanMessage*/ 32) p.innerHTML = /*cleanMessage*/ ctx[5];
      if (
        dirty & /*classes, showMessage, type*/ 25 &&
        p_class_value !==
          (p_class_value = `${/*classes*/ ctx[0]} __input-message ${
            !(/*showMessage*/ ctx[3]) ? 'tw_hidden' : ''
          } ${generateClassString$1(/*type*/ ctx[4])}`)
      ) {
        attr(p, 'class', p_class_value);
      }

      if (
        dirty & /*key*/ 4 &&
        p_id_value !== (p_id_value = `${/*key*/ ctx[2] ? `${/*key*/ ctx[2]}-message` : ''}`)
      ) {
        attr(p, 'id', p_id_value);
      }
    },
    d(detaching) {
      if (detaching) detach(p);
    },
  };
}

function create_fragment$I(ctx) {
  let if_block_anchor;
  let if_block = /*dirtyMessage*/ ctx[1] && create_if_block$f(ctx);

  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
    },
    p(ctx, [dirty]) {
      if (/*dirtyMessage*/ ctx[1]) {
        if (if_block) {
          if_block.p(ctx, dirty);
        } else {
          if_block = create_if_block$f(ctx);
          if_block.c();
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        if_block.d(1);
        if_block = null;
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function generateClassString$1(...args) {
  return args.reduce((prev, curr) => {
    switch (curr) {
      case 'error':
        return `${prev} tw_input-error-message dark:tw_input-error-message_dark`;
      default:
        return `${prev} tw_input-info-message dark:tw_input-info-message_dark`;
    }
  }, '');
}

function instance$J($$self, $$props, $$invalidate) {
  let { classes = '' } = $$props;
  let { dirtyMessage } = $$props;
  let { key = undefined } = $$props;
  let { showMessage = true } = $$props;
  let { type = 'info' } = $$props;
  let cleanMessage = sanitize(dirtyMessage);

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('dirtyMessage' in $$props) $$invalidate(1, (dirtyMessage = $$props.dirtyMessage));
    if ('key' in $$props) $$invalidate(2, (key = $$props.key));
    if ('showMessage' in $$props) $$invalidate(3, (showMessage = $$props.showMessage));
    if ('type' in $$props) $$invalidate(4, (type = $$props.type));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*dirtyMessage*/ 2) {
      {
        $$invalidate(5, (cleanMessage = sanitize(dirtyMessage)));
      }
    }
  };

  return [classes, dirtyMessage, key, showMessage, type, cleanMessage];
}

class Input_message extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$J, create_fragment$I, safe_not_equal, {
      classes: 0,
      dirtyMessage: 1,
      key: 2,
      showMessage: 3,
      type: 4,
    });
  }
}

/* src/lib/components/primitives/label/label.svelte generated by Svelte v3.55.0 */

function create_fragment$H(ctx) {
  let label;
  let label_class_value;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      label = element('label');
      if (default_slot) default_slot.c();
      attr(label, 'for', /*key*/ ctx[0]);
      attr(
        label,
        'class',
        (label_class_value = `${/*classes*/ ctx[1]} tw_input-label dark:tw_input-label_dark`),
      );
    },
    m(target, anchor) {
      insert(target, label, anchor);

      if (default_slot) {
        default_slot.m(label, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*key*/ 1) {
        attr(label, 'for', /*key*/ ctx[0]);
      }

      if (
        !current ||
        (dirty & /*classes*/ 2 &&
          label_class_value !==
            (label_class_value = `${/*classes*/ ctx[1]} tw_input-label dark:tw_input-label_dark`))
      ) {
        attr(label, 'class', label_class_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(label);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$I($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { key } = $$props;
  let { classes = '' } = $$props;

  $$self.$$set = ($$props) => {
    if ('key' in $$props) $$invalidate(0, (key = $$props.key));
    if ('classes' in $$props) $$invalidate(1, (classes = $$props.classes));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [key, classes, $$scope, slots];
}

class Label extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$I, create_fragment$H, safe_not_equal, { key: 0, classes: 1 });
  }
}

/* src/lib/components/compositions/checkbox/animated.svelte generated by Svelte v3.55.0 */

function create_default_slot$m(ctx) {
  let span;
  let t;
  let current;
  const default_slot_template = /*#slots*/ ctx[11].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

  return {
    c() {
      span = element('span');
      t = space();
      if (default_slot) default_slot.c();
      attr(span, 'class', 'tw_animated-check dark:tw_animated-check_dark');
    },
    m(target, anchor) {
      insert(target, span, anchor);
      insert(target, t, anchor);

      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[13],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[13])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, null),
            null,
          );
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(span);
      if (detaching) detach(t);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function create_fragment$G(ctx) {
  let div1;
  let input;
  let input_data_message_value;
  let t0;
  let label;
  let t1;
  let div0;
  let message_1;
  let current;
  let mounted;
  let dispose;

  label = new Label({
    props: {
      key: /*key*/ ctx[3],
      classes: 'tw_grid tw_grid-cols-[2.5em_1fr] tw_relative',
      $$slots: { default: [create_default_slot$m] },
      $$scope: { ctx },
    },
  });

  message_1 = new Input_message({
    props: {
      key: /*key*/ ctx[3],
      dirtyMessage: /*message*/ ctx[1],
      showMessage: /*showMessage*/ ctx[4],
      type: /*isInvalid*/ ctx[0] ? 'error' : 'info',
    },
  });

  return {
    c() {
      div1 = element('div');
      input = element('input');
      t0 = space();
      create_component(label.$$.fragment);
      t1 = space();
      div0 = element('div');
      create_component(message_1.$$.fragment);
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[0]);
      attr(
        input,
        'class',
        'tw_checkbox-input_animated dark:tw_checkbox-input_animated_dark tw_sr-only',
      );
      input.checked = /*value*/ ctx[5];
      attr(input, 'data-message', (input_data_message_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'id', /*key*/ ctx[3]);
      input.required = /*isRequired*/ ctx[2];
      attr(input, 'type', 'checkbox');
      attr(div0, 'class', 'tw_ml-10');
      attr(div1, 'class', 'tw_input-spacing');
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      append(div1, input);
      /*input_binding*/ ctx[12](input);
      append(div1, t0);
      mount_component(label, div1, null);
      append(div1, t1);
      append(div1, div0);
      mount_component(message_1, div0, null);
      current = true;

      if (!mounted) {
        dispose = listen(input, 'change', /*onChangeWrapper*/ ctx[7]);
        mounted = true;
      }
    },
    p(ctx, [dirty]) {
      if (!current || dirty & /*isInvalid*/ 1) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[0]);
      }

      if (!current || dirty & /*value*/ 32) {
        input.checked = /*value*/ ctx[5];
      }

      if (
        !current ||
        (dirty & /*key*/ 8 &&
          input_data_message_value !== (input_data_message_value = `${/*key*/ ctx[3]}-message`))
      ) {
        attr(input, 'data-message', input_data_message_value);
      }

      if (!current || dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (!current || dirty & /*isRequired*/ 4) {
        input.required = /*isRequired*/ ctx[2];
      }

      const label_changes = {};
      if (dirty & /*key*/ 8) label_changes.key = /*key*/ ctx[3];

      if (dirty & /*$$scope*/ 8192) {
        label_changes.$$scope = { dirty, ctx };
      }

      label.$set(label_changes);
      const message_1_changes = {};
      if (dirty & /*key*/ 8) message_1_changes.key = /*key*/ ctx[3];
      if (dirty & /*message*/ 2) message_1_changes.dirtyMessage = /*message*/ ctx[1];
      if (dirty & /*showMessage*/ 16) message_1_changes.showMessage = /*showMessage*/ ctx[4];
      if (dirty & /*isInvalid*/ 1) message_1_changes.type = /*isInvalid*/ ctx[0] ? 'error' : 'info';
      message_1.$set(message_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label.$$.fragment, local);
      transition_in(message_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label.$$.fragment, local);
      transition_out(message_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div1);
      /*input_binding*/ ctx[12](null);
      destroy_component(label);
      destroy_component(message_1);
      mounted = false;
      dispose();
    },
  };
}

function instance$H($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { checkValidity = null } = $$props;
  let { message = '' } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { onChange } = $$props;
  let { showMessage = undefined } = $$props;
  let { value } = $$props;
  let inputEl;

  function onChangeWrapper(event) {
    if (checkValidity) {
      $$invalidate(0, (isInvalid = !checkValidity(event)));
    }

    onChange(event);
  }

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });

  function input_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(6, inputEl);
    });
  }

  $$self.$$set = ($$props) => {
    if ('checkValidity' in $$props) $$invalidate(8, (checkValidity = $$props.checkValidity));
    if ('message' in $$props) $$invalidate(1, (message = $$props.message));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(9, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('isRequired' in $$props) $$invalidate(2, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(0, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(3, (key = $$props.key));
    if ('onChange' in $$props) $$invalidate(10, (onChange = $$props.onChange));
    if ('showMessage' in $$props) $$invalidate(4, (showMessage = $$props.showMessage));
    if ('value' in $$props) $$invalidate(5, (value = $$props.value));
    if ('$$scope' in $$props) $$invalidate(13, ($$scope = $$props.$$scope));
  };

  return [
    isInvalid,
    message,
    isRequired,
    key,
    showMessage,
    value,
    inputEl,
    onChangeWrapper,
    checkValidity,
    isFirstInvalidInput,
    onChange,
    slots,
    input_binding,
    $$scope,
  ];
}

let Animated$1 = class Animated extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$H, create_fragment$G, safe_not_equal, {
      checkValidity: 8,
      message: 1,
      isFirstInvalidInput: 9,
      isRequired: 2,
      isInvalid: 0,
      key: 3,
      onChange: 10,
      showMessage: 4,
      value: 5,
    });
  }
};

/* src/lib/components/primitives/checkbox/checkbox.svelte generated by Svelte v3.55.0 */

function create_default_slot$l(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[7].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

  return {
    c() {
      if (default_slot) default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[9],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
            null,
          );
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function create_fragment$F(ctx) {
  let input;
  let input_aria_describedby_value;
  let t;
  let label;
  let current;
  let mounted;
  let dispose;

  label = new Label({
    props: {
      key: /*key*/ ctx[2],
      $$slots: { default: [create_default_slot$l] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      input = element('input');
      t = space();
      create_component(label.$$.fragment);
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[2]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[1]);
      attr(
        input,
        'class',
        'tw_checkbox-input dark:tw_checkbox-input_dark tw_focusable-element dark:tw_focusable-element_dark',
      );
      input.checked = /*value*/ ctx[4];
      attr(input, 'id', /*key*/ ctx[2]);
      input.required = /*isRequired*/ ctx[0];
      attr(input, 'type', 'checkbox');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding*/ ctx[8](input);
      insert(target, t, anchor);
      mount_component(label, target, anchor);
      current = true;

      if (!mounted) {
        dispose = listen(input, 'change', function () {
          if (is_function(/*onChange*/ ctx[3])) /*onChange*/ ctx[3].apply(this, arguments);
        });

        mounted = true;
      }
    },
    p(new_ctx, [dirty]) {
      ctx = new_ctx;

      if (
        !current ||
        (dirty & /*key*/ 4 &&
          input_aria_describedby_value !==
            (input_aria_describedby_value = `${/*key*/ ctx[2]}-message`))
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (!current || dirty & /*isInvalid*/ 2) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[1]);
      }

      if (!current || dirty & /*value*/ 16) {
        input.checked = /*value*/ ctx[4];
      }

      if (!current || dirty & /*key*/ 4) {
        attr(input, 'id', /*key*/ ctx[2]);
      }

      if (!current || dirty & /*isRequired*/ 1) {
        input.required = /*isRequired*/ ctx[0];
      }

      const label_changes = {};
      if (dirty & /*key*/ 4) label_changes.key = /*key*/ ctx[2];

      if (dirty & /*$$scope*/ 512) {
        label_changes.$$scope = { dirty, ctx };
      }

      label.$set(label_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding*/ ctx[8](null);
      if (detaching) detach(t);
      destroy_component(label, detaching);
      mounted = false;
      dispose();
    },
  };
}

function instance$G($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { onChange } = $$props;
  let { value } = $$props;
  let inputEl;

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });

  function input_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(5, inputEl);
    });
  }

  $$self.$$set = ($$props) => {
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(6, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('isRequired' in $$props) $$invalidate(0, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(1, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(2, (key = $$props.key));
    if ('onChange' in $$props) $$invalidate(3, (onChange = $$props.onChange));
    if ('value' in $$props) $$invalidate(4, (value = $$props.value));
    if ('$$scope' in $$props) $$invalidate(9, ($$scope = $$props.$$scope));
  };

  return [
    isRequired,
    isInvalid,
    key,
    onChange,
    value,
    inputEl,
    isFirstInvalidInput,
    slots,
    input_binding,
    $$scope,
  ];
}

class Checkbox extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$G, create_fragment$F, safe_not_equal, {
      isFirstInvalidInput: 6,
      isRequired: 0,
      isInvalid: 1,
      key: 2,
      onChange: 3,
      value: 4,
    });
  }
}

/* src/lib/components/compositions/checkbox/standard.svelte generated by Svelte v3.55.0 */

function create_default_slot$k(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[10].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);

  return {
    c() {
      if (default_slot) default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 2048)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[11],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[11])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[11], dirty, null),
            null,
          );
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function create_fragment$E(ctx) {
  let div;
  let checkbox;
  let t;
  let span;
  let message_1;
  let current;

  checkbox = new Checkbox({
    props: {
      isFirstInvalidInput: /*isFirstInvalidInput*/ ctx[2],
      isRequired: /*isRequired*/ ctx[3],
      isInvalid: /*isInvalid*/ ctx[0],
      key: /*key*/ ctx[4],
      onChange: /*onChangeWrapper*/ ctx[7],
      value: /*value*/ ctx[6],
      $$slots: { default: [create_default_slot$k] },
      $$scope: { ctx },
    },
  });

  message_1 = new Input_message({
    props: {
      dirtyMessage: /*message*/ ctx[1],
      key: /*key*/ ctx[4],
      showMessage: /*showMessage*/ ctx[5],
      type: /*isInvalid*/ ctx[0] ? 'error' : 'info',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(checkbox.$$.fragment);
      t = space();
      span = element('span');
      create_component(message_1.$$.fragment);
      attr(span, 'class', 'tw_col-start-2 tw_row-start-2');
      attr(div, 'class', 'tw_input-spacing tw_grid tw_grid-cols-[1.5em_1fr]');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(checkbox, div, null);
      append(div, t);
      append(div, span);
      mount_component(message_1, span, null);
      current = true;
    },
    p(ctx, [dirty]) {
      const checkbox_changes = {};
      if (dirty & /*isFirstInvalidInput*/ 4)
        checkbox_changes.isFirstInvalidInput = /*isFirstInvalidInput*/ ctx[2];
      if (dirty & /*isRequired*/ 8) checkbox_changes.isRequired = /*isRequired*/ ctx[3];
      if (dirty & /*isInvalid*/ 1) checkbox_changes.isInvalid = /*isInvalid*/ ctx[0];
      if (dirty & /*key*/ 16) checkbox_changes.key = /*key*/ ctx[4];
      if (dirty & /*value*/ 64) checkbox_changes.value = /*value*/ ctx[6];

      if (dirty & /*$$scope*/ 2048) {
        checkbox_changes.$$scope = { dirty, ctx };
      }

      checkbox.$set(checkbox_changes);
      const message_1_changes = {};
      if (dirty & /*message*/ 2) message_1_changes.dirtyMessage = /*message*/ ctx[1];
      if (dirty & /*key*/ 16) message_1_changes.key = /*key*/ ctx[4];
      if (dirty & /*showMessage*/ 32) message_1_changes.showMessage = /*showMessage*/ ctx[5];
      if (dirty & /*isInvalid*/ 1) message_1_changes.type = /*isInvalid*/ ctx[0] ? 'error' : 'info';
      message_1.$set(message_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(checkbox.$$.fragment, local);
      transition_in(message_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(checkbox.$$.fragment, local);
      transition_out(message_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(checkbox);
      destroy_component(message_1);
    },
  };
}

function instance$F($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { checkValidity = null } = $$props;
  let { message = '' } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { onChange } = $$props;
  let { showMessage = undefined } = $$props;
  let { value } = $$props;

  function onChangeWrapper(event) {
    if (checkValidity) {
      $$invalidate(0, (isInvalid = !checkValidity(event)));
    }

    onChange(event);
  }

  $$self.$$set = ($$props) => {
    if ('checkValidity' in $$props) $$invalidate(8, (checkValidity = $$props.checkValidity));
    if ('message' in $$props) $$invalidate(1, (message = $$props.message));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(2, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('isRequired' in $$props) $$invalidate(3, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(0, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(4, (key = $$props.key));
    if ('onChange' in $$props) $$invalidate(9, (onChange = $$props.onChange));
    if ('showMessage' in $$props) $$invalidate(5, (showMessage = $$props.showMessage));
    if ('value' in $$props) $$invalidate(6, (value = $$props.value));
    if ('$$scope' in $$props) $$invalidate(11, ($$scope = $$props.$$scope));
  };

  return [
    isInvalid,
    message,
    isFirstInvalidInput,
    isRequired,
    key,
    showMessage,
    value,
    onChangeWrapper,
    checkValidity,
    onChange,
    slots,
    $$scope,
  ];
}

class Standard extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$F, create_fragment$E, safe_not_equal, {
      checkValidity: 8,
      message: 1,
      isFirstInvalidInput: 2,
      isRequired: 3,
      isInvalid: 0,
      key: 4,
      onChange: 9,
      showMessage: 5,
      value: 6,
    });
  }
}

/* src/lib/journey/callbacks/boolean/boolean.svelte generated by Svelte v3.55.0 */

function create_default_slot$j(ctx) {
  let t_value = interpolate(textToKey(/*outputName*/ ctx[2]), null, /*prompt*/ ctx[4]) + '';
  let t;

  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (
        dirty & /*outputName, prompt*/ 20 &&
        t_value !==
          (t_value = interpolate(textToKey(/*outputName*/ ctx[2]), null, /*prompt*/ ctx[4]) + '')
      )
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$D(ctx) {
  let checkbox;
  let current;

  checkbox = new /*Checkbox*/ ctx[6]({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      isInvalid: !!(/*validationFailure*/ ctx[5]),
      key: /*inputName*/ ctx[1],
      message: /*validationFailure*/ ctx[5],
      onChange: /*setValue*/ ctx[7],
      value: /*previousValue*/ ctx[3],
      $$slots: { default: [create_default_slot$j] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(checkbox.$$.fragment);
    },
    m(target, anchor) {
      mount_component(checkbox, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const checkbox_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        checkbox_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*validationFailure*/ 32)
        checkbox_changes.isInvalid = !!(/*validationFailure*/ ctx[5]);
      if (dirty & /*inputName*/ 2) checkbox_changes.key = /*inputName*/ ctx[1];
      if (dirty & /*validationFailure*/ 32) checkbox_changes.message = /*validationFailure*/ ctx[5];
      if (dirty & /*previousValue*/ 8) checkbox_changes.value = /*previousValue*/ ctx[3];

      if (dirty & /*$$scope, outputName, prompt*/ 4116) {
        checkbox_changes.$$scope = { dirty, ctx };
      }

      checkbox.$set(checkbox_changes);
    },
    i(local) {
      if (current) return;
      transition_in(checkbox.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(checkbox.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(checkbox, detaching);
    },
  };
}

function instance$E($$self, $$props, $$invalidate) {
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  const stepMetadata = null;
  const selfSubmitFunction = null;
  let { style = {} } = $$props;

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated$1;

  let inputName;

  // A boolean being required doesn't make much sense, so commenting it out for now
  // let isRequired = isInputRequired(callback);
  let outputName;

  let previousValue;
  let prompt;
  let validationFailure;

  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(event.target.checked);
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(8, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(0, (callbackMetadata = $$props.callbackMetadata));
    if ('style' in $$props) $$invalidate(11, (style = $$props.style));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata*/ 257) {
      {
        $$invalidate(
          1,
          (inputName =
            callback?.payload?.input?.[0].name || `boolean-attr-${callbackMetadata?.idx}`),
        );

        // A boolean being required doesn't make much sense, so commenting it out for now
        // isRequired = isInputRequired(callback);
        $$invalidate(2, (outputName = callback.getOutputByName('name', '')));

        $$invalidate(3, (previousValue = callback.getInputValue()));
        $$invalidate(4, (prompt = callback.getPrompt()));
        $$invalidate(5, (validationFailure = getAttributeValidationFailureText(callback)));
      }
    }
  };

  return [
    callbackMetadata,
    inputName,
    outputName,
    previousValue,
    prompt,
    validationFailure,
    Checkbox,
    setValue,
    callback,
    stepMetadata,
    selfSubmitFunction,
    style,
  ];
}

let Boolean$1 = class Boolean extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$E, create_fragment$D, safe_not_equal, {
      callback: 8,
      callbackMetadata: 0,
      stepMetadata: 9,
      selfSubmitFunction: 10,
      style: 11,
    });
  }

  get stepMetadata() {
    return this.$$.ctx[9];
  }

  get selfSubmitFunction() {
    return this.$$.ctx[10];
  }
};

/* src/lib/components/compositions/radio/animated.svelte generated by Svelte v3.55.0 */

function get_each_context$7(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[13] = list[i];
  return child_ctx;
}

// (41:8) <Label           key={`${key}-${option.value}`}           classes="tw_input-spacing tw_grid tw_grid-cols-[2.5em_1fr] tw_relative"         >
function create_default_slot$i(ctx) {
  let span;
  let t0;
  let t1_value = /*option*/ ctx[13].text + '';
  let t1;

  return {
    c() {
      span = element('span');
      t0 = space();
      t1 = text(t1_value);
      attr(span, 'class', 'tw_animated-radio dark:tw_animated-radio_dark');
    },
    m(target, anchor) {
      insert(target, span, anchor);
      insert(target, t0, anchor);
      insert(target, t1, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*options*/ 256 && t1_value !== (t1_value = /*option*/ ctx[13].text + ''))
        set_data(t1, t1_value);
    },
    d(detaching) {
      if (detaching) detach(span);
      if (detaching) detach(t0);
      if (detaching) detach(t1);
    },
  };
}

// (27:4) {#each options as option}
function create_each_block$7(ctx) {
  let div;
  let input;
  let input_checked_value;
  let input_id_value;
  let input_value_value;
  let t0;
  let label;
  let t1;
  let current;
  let mounted;
  let dispose;

  label = new Label({
    props: {
      key: `${/*key*/ ctx[5]}-${/*option*/ ctx[13].value}`,
      classes: 'tw_input-spacing tw_grid tw_grid-cols-[2.5em_1fr] tw_relative',
      $$slots: { default: [create_default_slot$i] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      div = element('div');
      input = element('input');
      t0 = space();
      create_component(label.$$.fragment);
      t1 = space();
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[4]);
      attr(input, 'class', 'tw_radio-input_animated dark:tw_radio-input_animated_dark tw_sr-only');
      input.checked = input_checked_value = /*defaultOption*/ ctx[0] === /*option*/ ctx[13].value;
      attr(input, 'id', (input_id_value = `${/*key*/ ctx[5]}-${/*option*/ ctx[13].value}`));
      attr(input, 'name', /*name*/ ctx[6]);
      input.required = /*isRequired*/ ctx[3];
      attr(input, 'type', 'radio');
      input.value = input_value_value = /*option*/ ctx[13].value;
      attr(div, 'class', 'tw_input-spacing');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, input);
      /*input_binding*/ ctx[12](input);
      append(div, t0);
      mount_component(label, div, null);
      append(div, t1);
      current = true;

      if (!mounted) {
        dispose = listen(input, 'change', function () {
          if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
        });

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (!current || dirty & /*isInvalid*/ 16) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[4]);
      }

      if (
        !current ||
        (dirty & /*defaultOption, options*/ 257 &&
          input_checked_value !==
            (input_checked_value = /*defaultOption*/ ctx[0] === /*option*/ ctx[13].value))
      ) {
        input.checked = input_checked_value;
      }

      if (
        !current ||
        (dirty & /*key, options*/ 288 &&
          input_id_value !== (input_id_value = `${/*key*/ ctx[5]}-${/*option*/ ctx[13].value}`))
      ) {
        attr(input, 'id', input_id_value);
      }

      if (!current || dirty & /*name*/ 64) {
        attr(input, 'name', /*name*/ ctx[6]);
      }

      if (!current || dirty & /*isRequired*/ 8) {
        input.required = /*isRequired*/ ctx[3];
      }

      if (
        !current ||
        (dirty & /*options*/ 256 &&
          input_value_value !== (input_value_value = /*option*/ ctx[13].value))
      ) {
        input.value = input_value_value;
      }

      const label_changes = {};
      if (dirty & /*key, options*/ 288)
        label_changes.key = `${/*key*/ ctx[5]}-${/*option*/ ctx[13].value}`;

      if (dirty & /*$$scope, options*/ 65792) {
        label_changes.$$scope = { dirty, ctx };
      }

      label.$set(label_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      /*input_binding*/ ctx[12](null);
      destroy_component(label);
      mounted = false;
      dispose();
    },
  };
}

function create_fragment$C(ctx) {
  let fieldset;
  let legend;
  let t0;
  let t1;
  let div;
  let t2;
  let span;
  let message_1;
  let current;
  let each_value = /*options*/ ctx[8];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
  }

  const out = (i) =>
    transition_out(each_blocks[i], 1, 1, () => {
      each_blocks[i] = null;
    });

  message_1 = new Input_message({
    props: {
      dirtyMessage: /*message*/ ctx[1],
      key: /*key*/ ctx[5],
      showMessage: /*showMessage*/ ctx[9],
      type: /*isInvalid*/ ctx[4] ? 'error' : 'info',
    },
  });

  return {
    c() {
      fieldset = element('fieldset');
      legend = element('legend');
      t0 = text(/*groupLabel*/ ctx[2]);
      t1 = space();
      div = element('div');

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      t2 = space();
      span = element('span');
      create_component(message_1.$$.fragment);
      attr(legend, 'class', 'tw_input-label dark:tw_input-label_dark tw_font-bold tw_mb-4');
      attr(span, 'class', 'tw_col-start-2 tw_row-start-2');
    },
    m(target, anchor) {
      insert(target, fieldset, anchor);
      append(fieldset, legend);
      append(legend, t0);
      append(fieldset, t1);
      append(fieldset, div);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(div, null);
      }

      append(div, t2);
      append(div, span);
      mount_component(message_1, span, null);
      current = true;
    },
    p(ctx, [dirty]) {
      if (!current || dirty & /*groupLabel*/ 4) set_data(t0, /*groupLabel*/ ctx[2]);

      if (
        dirty & /*key, options, isInvalid, defaultOption, name, isRequired, inputEl, onChange*/ 1529
      ) {
        each_value = /*options*/ ctx[8];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$7(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$7(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(div, t2);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }

      const message_1_changes = {};
      if (dirty & /*message*/ 2) message_1_changes.dirtyMessage = /*message*/ ctx[1];
      if (dirty & /*key*/ 32) message_1_changes.key = /*key*/ ctx[5];
      if (dirty & /*showMessage*/ 512) message_1_changes.showMessage = /*showMessage*/ ctx[9];
      if (dirty & /*isInvalid*/ 16)
        message_1_changes.type = /*isInvalid*/ ctx[4] ? 'error' : 'info';
      message_1.$set(message_1_changes);
    },
    i(local) {
      if (current) return;

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      transition_in(message_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      transition_out(message_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(fieldset);
      destroy_each(each_blocks, detaching);
      destroy_component(message_1);
    },
  };
}

function instance$D($$self, $$props, $$invalidate) {
  let { defaultOption = null } = $$props;
  let { message = '' } = $$props;
  let { groupLabel = '' } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { name } = $$props;
  let { onChange } = $$props;
  let { options } = $$props;
  let { showMessage = undefined } = $$props;
  let inputEl;

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });

  function input_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(10, inputEl);
    });
  }

  $$self.$$set = ($$props) => {
    if ('defaultOption' in $$props) $$invalidate(0, (defaultOption = $$props.defaultOption));
    if ('message' in $$props) $$invalidate(1, (message = $$props.message));
    if ('groupLabel' in $$props) $$invalidate(2, (groupLabel = $$props.groupLabel));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(11, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('isRequired' in $$props) $$invalidate(3, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(4, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(5, (key = $$props.key));
    if ('name' in $$props) $$invalidate(6, (name = $$props.name));
    if ('onChange' in $$props) $$invalidate(7, (onChange = $$props.onChange));
    if ('options' in $$props) $$invalidate(8, (options = $$props.options));
    if ('showMessage' in $$props) $$invalidate(9, (showMessage = $$props.showMessage));
  };

  return [
    defaultOption,
    message,
    groupLabel,
    isRequired,
    isInvalid,
    key,
    name,
    onChange,
    options,
    showMessage,
    inputEl,
    isFirstInvalidInput,
    input_binding,
  ];
}

class Animated extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$D, create_fragment$C, safe_not_equal, {
      defaultOption: 0,
      message: 1,
      groupLabel: 2,
      isFirstInvalidInput: 11,
      isRequired: 3,
      isInvalid: 4,
      key: 5,
      name: 6,
      onChange: 7,
      options: 8,
      showMessage: 9,
    });
  }
}

/* src/lib/components/primitives/select/select.svelte generated by Svelte v3.55.0 */

function get_each_context$6(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[15] = list[i];
  return child_ctx;
}

// (40:0) {#if labelOrder === 'first'}
function create_if_block_1$9(ctx) {
  let label_1;
  let current;

  label_1 = new Label({
    props: {
      key: /*key*/ ctx[4],
      classes: `${/*labelClasses*/ ctx[6]}`,
      $$slots: { default: [create_default_slot_1$a] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(label_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(label_1, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const label_1_changes = {};
      if (dirty & /*key*/ 16) label_1_changes.key = /*key*/ ctx[4];
      if (dirty & /*labelClasses*/ 64) label_1_changes.classes = `${/*labelClasses*/ ctx[6]}`;

      if (dirty & /*$$scope, label*/ 262176) {
        label_1_changes.$$scope = { dirty, ctx };
      }

      label_1.$set(label_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(label_1, detaching);
    },
  };
}

// (41:2) <Label {key} classes={`${labelClasses}`}>
function create_default_slot_1$a(ctx) {
  let t;

  return {
    c() {
      t = text(/*label*/ ctx[5]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*label*/ 32) set_data(t, /*label*/ ctx[5]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (55:2) {#each options as option}
function create_each_block$6(ctx) {
  let option;
  let t0_value = /*option*/ ctx[15].text + '';
  let t0;
  let t1;
  let option_value_value;
  let option_selected_value;

  return {
    c() {
      option = element('option');
      t0 = text(t0_value);
      t1 = space();
      option.__value = option_value_value = /*option*/ ctx[15].value;
      option.value = option.__value;
      option.selected = option_selected_value =
        /*option*/ ctx[15].value === /*defaultOption*/ ctx[1];
    },
    m(target, anchor) {
      insert(target, option, anchor);
      append(option, t0);
      append(option, t1);
    },
    p(ctx, dirty) {
      if (dirty & /*options*/ 256 && t0_value !== (t0_value = /*option*/ ctx[15].text + ''))
        set_data(t0, t0_value);

      if (
        dirty & /*options*/ 256 &&
        option_value_value !== (option_value_value = /*option*/ ctx[15].value)
      ) {
        option.__value = option_value_value;
        option.value = option.__value;
      }

      if (
        dirty & /*options, defaultOption*/ 258 &&
        option_selected_value !==
          (option_selected_value = /*option*/ ctx[15].value === /*defaultOption*/ ctx[1])
      ) {
        option.selected = option_selected_value;
      }
    },
    d(detaching) {
      if (detaching) detach(option);
    },
  };
}

// (62:0) {#if labelOrder === 'last'}
function create_if_block$e(ctx) {
  let label_1;
  let current;

  label_1 = new Label({
    props: {
      key: /*key*/ ctx[4],
      classes: `${/*shouldDisplayOption*/ ctx[10] ? /*labelClasses*/ ctx[6] : 'tw_sr-only'}`,
      $$slots: { default: [create_default_slot$h] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(label_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(label_1, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const label_1_changes = {};
      if (dirty & /*key*/ 16) label_1_changes.key = /*key*/ ctx[4];

      if (dirty & /*shouldDisplayOption, labelClasses*/ 1088)
        label_1_changes.classes = `${
          /*shouldDisplayOption*/ ctx[10] ? /*labelClasses*/ ctx[6] : 'tw_sr-only'
        }`;

      if (dirty & /*$$scope, label*/ 262176) {
        label_1_changes.$$scope = { dirty, ctx };
      }

      label_1.$set(label_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(label_1, detaching);
    },
  };
}

// (63:2) <Label {key} classes={`${shouldDisplayOption ? labelClasses : 'tw_sr-only'}`}>
function create_default_slot$h(ctx) {
  let t;

  return {
    c() {
      t = text(/*label*/ ctx[5]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*label*/ 32) set_data(t, /*label*/ ctx[5]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$B(ctx) {
  let t0;
  let select;
  let select_aria_describedby_value;
  let select_class_value;
  let t1;
  let if_block1_anchor;
  let current;
  let mounted;
  let dispose;
  let if_block0 = /*labelOrder*/ ctx[7] === 'first' && create_if_block_1$9(ctx);
  let each_value = /*options*/ ctx[8];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
  }

  let if_block1 = /*labelOrder*/ ctx[7] === 'last' && create_if_block$e(ctx);

  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      select = element('select');

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      t1 = space();
      if (if_block1) if_block1.c();
      if_block1_anchor = empty();
      attr(
        select,
        'aria-describedby',
        (select_aria_describedby_value = `${/*key*/ ctx[4]}-message`),
      );
      attr(select, 'aria-invalid', /*isInvalid*/ ctx[3]);

      attr(
        select,
        'class',
        (select_class_value = `${
          /*shouldDisplayOption*/ ctx[10] ? /*selectClasses*/ ctx[0] : ''
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_select-base dark:tw_select-base_dark tw_w-full`),
      );

      attr(select, 'id', /*key*/ ctx[4]);
      select.required = /*isRequired*/ ctx[2];
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      insert(target, select, anchor);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(select, null);
      }

      /*select_binding*/ ctx[14](select);
      insert(target, t1, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, if_block1_anchor, anchor);
      current = true;

      if (!mounted) {
        dispose = listen(select, 'change', /*onChangeWrapper*/ ctx[11]);
        mounted = true;
      }
    },
    p(ctx, [dirty]) {
      if (/*labelOrder*/ ctx[7] === 'first') {
        if (if_block0) {
          if_block0.p(ctx, dirty);

          if (dirty & /*labelOrder*/ 128) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_1$9(ctx);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();

        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });

        check_outros();
      }

      if (dirty & /*options, defaultOption*/ 258) {
        each_value = /*options*/ ctx[8];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$6(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$6(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(select, null);
          }
        }

        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }

        each_blocks.length = each_value.length;
      }

      if (
        !current ||
        (dirty & /*key*/ 16 &&
          select_aria_describedby_value !==
            (select_aria_describedby_value = `${/*key*/ ctx[4]}-message`))
      ) {
        attr(select, 'aria-describedby', select_aria_describedby_value);
      }

      if (!current || dirty & /*isInvalid*/ 8) {
        attr(select, 'aria-invalid', /*isInvalid*/ ctx[3]);
      }

      if (
        !current ||
        (dirty & /*shouldDisplayOption, selectClasses*/ 1025 &&
          select_class_value !==
            (select_class_value = `${
              /*shouldDisplayOption*/ ctx[10] ? /*selectClasses*/ ctx[0] : ''
            } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_select-base dark:tw_select-base_dark tw_w-full`))
      ) {
        attr(select, 'class', select_class_value);
      }

      if (!current || dirty & /*key*/ 16) {
        attr(select, 'id', /*key*/ ctx[4]);
      }

      if (!current || dirty & /*isRequired*/ 4) {
        select.required = /*isRequired*/ ctx[2];
      }

      if (/*labelOrder*/ ctx[7] === 'last') {
        if (if_block1) {
          if_block1.p(ctx, dirty);

          if (dirty & /*labelOrder*/ 128) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block$e(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
        }
      } else if (if_block1) {
        group_outros();

        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });

        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(if_block1);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block1);
      current = false;
    },
    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t0);
      if (detaching) detach(select);
      destroy_each(each_blocks, detaching);
      /*select_binding*/ ctx[14](null);
      if (detaching) detach(t1);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(if_block1_anchor);
      mounted = false;
      dispose();
    },
  };
}

function instance$C($$self, $$props, $$invalidate) {
  let { selectClasses = '' } = $$props;
  let { defaultOption = null } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { label } = $$props;
  let { labelClasses = '' } = $$props;
  let { labelOrder = 'first' } = $$props;
  let { onChange } = $$props;
  let { options } = $$props;
  let inputEl;
  let shouldDisplayOption = true;

  /**
   * If label and option share the same text, only display option
   */
  if (defaultOption === null && options[0].text === label) {
    shouldDisplayOption = false;
  }

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });

  function onChangeWrapper(event) {
    const value = event.target.value;

    const selectedOption = options.find((option) => {
      return String(option.value) === value;
    });

    // Check if text is same as label
    $$invalidate(10, (shouldDisplayOption = !(label === selectedOption?.text)));

    console.log(shouldDisplayOption);

    // Continue with calling onChange parameter
    onChange(event);
  }

  function select_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(9, inputEl);
      $$invalidate(8, options);
    });
  }

  $$self.$$set = ($$props) => {
    if ('selectClasses' in $$props) $$invalidate(0, (selectClasses = $$props.selectClasses));
    if ('defaultOption' in $$props) $$invalidate(1, (defaultOption = $$props.defaultOption));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(12, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('isRequired' in $$props) $$invalidate(2, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(3, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(4, (key = $$props.key));
    if ('label' in $$props) $$invalidate(5, (label = $$props.label));
    if ('labelClasses' in $$props) $$invalidate(6, (labelClasses = $$props.labelClasses));
    if ('labelOrder' in $$props) $$invalidate(7, (labelOrder = $$props.labelOrder));
    if ('onChange' in $$props) $$invalidate(13, (onChange = $$props.onChange));
    if ('options' in $$props) $$invalidate(8, (options = $$props.options));
  };

  return [
    selectClasses,
    defaultOption,
    isRequired,
    isInvalid,
    key,
    label,
    labelClasses,
    labelOrder,
    options,
    inputEl,
    shouldDisplayOption,
    onChangeWrapper,
    isFirstInvalidInput,
    onChange,
    select_binding,
  ];
}

class Select extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$C, create_fragment$B, safe_not_equal, {
      selectClasses: 0,
      defaultOption: 1,
      isFirstInvalidInput: 12,
      isRequired: 2,
      isInvalid: 3,
      key: 4,
      label: 5,
      labelClasses: 6,
      labelOrder: 7,
      onChange: 13,
      options: 8,
    });
  }
}

/* src/lib/components/compositions/select-floating/floating-label.svelte generated by Svelte v3.55.0 */

function create_fragment$A(ctx) {
  let div;
  let select;
  let t;
  let message_1;
  let current;

  select = new Select({
    props: {
      defaultOption: /*defaultOption*/ ctx[1],
      isFirstInvalidInput: /*isFirstInvalidInput*/ ctx[3],
      isRequired: /*isRequired*/ ctx[4],
      isInvalid: /*isInvalid*/ ctx[0],
      key: /*key*/ ctx[5],
      label: /*label*/ ctx[6],
      labelClasses: 'tw_absolute tw_input-floating-label tw_select-floating-label',
      labelOrder: 'last',
      onChange: /*onChangeWrapper*/ ctx[9],
      options: /*options*/ ctx[7],
      selectClasses: 'tw_select-floating',
    },
  });

  message_1 = new Input_message({
    props: {
      dirtyMessage: /*message*/ ctx[2],
      key: /*key*/ ctx[5],
      showMessage: /*showMessage*/ ctx[8],
      type: /*isInvalid*/ ctx[0] ? 'error' : 'info',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(select.$$.fragment);
      t = space();
      create_component(message_1.$$.fragment);
      attr(div, 'class', `tw_input-spacing tw_relative`);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(select, div, null);
      append(div, t);
      mount_component(message_1, div, null);
      current = true;
    },
    p(ctx, [dirty]) {
      const select_changes = {};
      if (dirty & /*defaultOption*/ 2) select_changes.defaultOption = /*defaultOption*/ ctx[1];
      if (dirty & /*isFirstInvalidInput*/ 8)
        select_changes.isFirstInvalidInput = /*isFirstInvalidInput*/ ctx[3];
      if (dirty & /*isRequired*/ 16) select_changes.isRequired = /*isRequired*/ ctx[4];
      if (dirty & /*isInvalid*/ 1) select_changes.isInvalid = /*isInvalid*/ ctx[0];
      if (dirty & /*key*/ 32) select_changes.key = /*key*/ ctx[5];
      if (dirty & /*label*/ 64) select_changes.label = /*label*/ ctx[6];
      if (dirty & /*options*/ 128) select_changes.options = /*options*/ ctx[7];
      select.$set(select_changes);
      const message_1_changes = {};
      if (dirty & /*message*/ 4) message_1_changes.dirtyMessage = /*message*/ ctx[2];
      if (dirty & /*key*/ 32) message_1_changes.key = /*key*/ ctx[5];
      if (dirty & /*showMessage*/ 256) message_1_changes.showMessage = /*showMessage*/ ctx[8];
      if (dirty & /*isInvalid*/ 1) message_1_changes.type = /*isInvalid*/ ctx[0] ? 'error' : 'info';
      message_1.$set(message_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(select.$$.fragment, local);
      transition_in(message_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(select.$$.fragment, local);
      transition_out(message_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(select);
      destroy_component(message_1);
    },
  };
}

function instance$B($$self, $$props, $$invalidate) {
  let { checkValidity = null } = $$props;
  let { defaultOption = null } = $$props;
  let { message = '' } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { label } = $$props;
  let { onChange } = $$props;
  let { options } = $$props;
  let { showMessage = undefined } = $$props;

  function onChangeWrapper(event) {
    if (checkValidity) {
      $$invalidate(0, (isInvalid = !checkValidity(event)));
    }

    onChange(event);
  }

  $$self.$$set = ($$props) => {
    if ('checkValidity' in $$props) $$invalidate(10, (checkValidity = $$props.checkValidity));
    if ('defaultOption' in $$props) $$invalidate(1, (defaultOption = $$props.defaultOption));
    if ('message' in $$props) $$invalidate(2, (message = $$props.message));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(3, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('isRequired' in $$props) $$invalidate(4, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(0, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(5, (key = $$props.key));
    if ('label' in $$props) $$invalidate(6, (label = $$props.label));
    if ('onChange' in $$props) $$invalidate(11, (onChange = $$props.onChange));
    if ('options' in $$props) $$invalidate(7, (options = $$props.options));
    if ('showMessage' in $$props) $$invalidate(8, (showMessage = $$props.showMessage));
  };

  return [
    isInvalid,
    defaultOption,
    message,
    isFirstInvalidInput,
    isRequired,
    key,
    label,
    options,
    showMessage,
    onChangeWrapper,
    checkValidity,
    onChange,
  ];
}

let Floating_label$1 = class Floating_label extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$B, create_fragment$A, safe_not_equal, {
      checkValidity: 10,
      defaultOption: 1,
      message: 2,
      isFirstInvalidInput: 3,
      isRequired: 4,
      isInvalid: 0,
      key: 5,
      label: 6,
      onChange: 11,
      options: 7,
      showMessage: 8,
    });
  }
};

/* src/lib/journey/callbacks/choice/choice.svelte generated by Svelte v3.55.0 */

function create_else_block$5(ctx) {
  let select;
  let current;

  select = new Floating_label$1({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      defaultOption: /*defaultChoice*/ ctx[5],
      isRequired: false,
      key: /*inputName*/ ctx[3],
      label: /*label*/ ctx[4],
      onChange: /*setValue*/ ctx[6],
      options: /*choiceOptions*/ ctx[2],
    },
  });

  return {
    c() {
      create_component(select.$$.fragment);
    },
    m(target, anchor) {
      mount_component(select, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const select_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        select_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*defaultChoice*/ 32) select_changes.defaultOption = /*defaultChoice*/ ctx[5];
      if (dirty & /*inputName*/ 8) select_changes.key = /*inputName*/ ctx[3];
      if (dirty & /*label*/ 16) select_changes.label = /*label*/ ctx[4];
      if (dirty & /*choiceOptions*/ 4) select_changes.options = /*choiceOptions*/ ctx[2];
      select.$set(select_changes);
    },
    i(local) {
      if (current) return;
      transition_in(select.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(select.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(select, detaching);
    },
  };
}

// (62:0) {#if callbackMetadata?.platform?.displayType === 'radio'}
function create_if_block$d(ctx) {
  let radio;
  let current;

  radio = new Animated({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      defaultOption: /*defaultChoice*/ ctx[5],
      isRequired: false,
      key: /*inputName*/ ctx[3],
      groupLabel: /*prompt*/ ctx[1],
      onChange: /*setValue*/ ctx[6],
      name: /*inputName*/ ctx[3],
      options: /*choiceOptions*/ ctx[2],
    },
  });

  return {
    c() {
      create_component(radio.$$.fragment);
    },
    m(target, anchor) {
      mount_component(radio, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const radio_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        radio_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*defaultChoice*/ 32) radio_changes.defaultOption = /*defaultChoice*/ ctx[5];
      if (dirty & /*inputName*/ 8) radio_changes.key = /*inputName*/ ctx[3];
      if (dirty & /*prompt*/ 2) radio_changes.groupLabel = /*prompt*/ ctx[1];
      if (dirty & /*inputName*/ 8) radio_changes.name = /*inputName*/ ctx[3];
      if (dirty & /*choiceOptions*/ 4) radio_changes.options = /*choiceOptions*/ ctx[2];
      radio.$set(radio_changes);
    },
    i(local) {
      if (current) return;
      transition_in(radio.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(radio.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(radio, detaching);
    },
  };
}

function create_fragment$z(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$d, create_else_block$5];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*callbackMetadata*/ ctx[0]?.platform?.displayType === 'radio') return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$A($$self, $$props, $$invalidate) {
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let choiceOptions;
  let inputName;

  /**
   * Since locale content keys for the choice component are built off of the
   * values, there will not be any existing key-value pairs in the provided
   * content. The third argument here, the original value, is what will be
   * displayed. If you want to localize it, you'll need to add content keys
   * in the locale file for that to override the original value.
   */
  let label;

  let prompt;
  let defaultChoice;

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setChoiceIndex(Number(event.target.value));
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(10, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(0, (callbackMetadata = $$props.callbackMetadata));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata, prompt*/ 1027) {
      {
        /** *************************************************************************
         * SDK INTEGRATION POINT
         * Summary: SDK callback methods for getting values
         * --------------------------------------------------------------------------
         * Details: Each callback is wrapped by the SDK to provide helper methods
         * for accessing values from the callbacks received from AM
         ************************************************************************* */
        $$invalidate(
          2,
          (choiceOptions = callback.getChoices()?.map((text, idx) => ({
            /**
             * Since locale content keys for the choice component are built off of the
             * values, there will not be any existing key-value pairs in the provided
             * content. The third argument here, the original value, is what will be
             * displayed. If you want to localize it, you'll need to add content keys
             * in the locale file for that to override the original value.
             */
            text: interpolate(textToKey(text), null, text),
            value: `${idx}`,
          }))),
        );

        $$invalidate(5, (defaultChoice = `${callback.getDefaultChoice()}` || null));
        $$invalidate(
          3,
          (inputName = callback?.payload?.input?.[0].name || `choice-${callbackMetadata?.idx}`),
        );
        $$invalidate(1, (prompt = callback.getPrompt()));
        $$invalidate(4, (label = interpolate(textToKey(prompt), null, prompt)));
      }
    }
  };

  return [
    callbackMetadata,
    prompt,
    choiceOptions,
    inputName,
    label,
    defaultChoice,
    setValue,
    selfSubmitFunction,
    stepMetadata,
    style,
    callback,
  ];
}

class Choice extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$A, create_fragment$z, safe_not_equal, {
      selfSubmitFunction: 7,
      stepMetadata: 8,
      style: 9,
      callback: 10,
      callbackMetadata: 0,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[7];
  }

  get stepMetadata() {
    return this.$$.ctx[8];
  }

  get style() {
    return this.$$.ctx[9];
  }
}

/* src/lib/components/primitives/grid/grid.svelte generated by Svelte v3.55.0 */

function create_fragment$y(ctx) {
  let div;
  let div_class_value;
  let current;
  const default_slot_template = /*#slots*/ ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

  return {
    c() {
      div = element('div');
      if (default_slot) default_slot.c();
      attr(
        div,
        'class',
        (div_class_value = `${generateClassString(
          /*num*/ ctx[0],
        )} tw_gap-4 tw_grid tw_input-spacing`),
      );
    },
    m(target, anchor) {
      insert(target, div, anchor);

      if (default_slot) {
        default_slot.m(div, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[1],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*num*/ 1 &&
          div_class_value !==
            (div_class_value = `${generateClassString(
              /*num*/ ctx[0],
            )} tw_gap-4 tw_grid tw_input-spacing`))
      ) {
        attr(div, 'class', div_class_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function generateClassString(...args) {
  return args.reduce((prev, curr) => {
    switch (curr) {
      case 4:
        return `${prev} tw_grid-cols-4`;
      case 3:
        return `${prev} tw_grid-cols-3`;
      case 2:
        return `${prev} tw_grid-cols-2`;
      default:
        return `${prev} tw_grid-cols-1`;
    }
  }, '');
}

function instance$z($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { num = 2 } = $$props;

  $$self.$$set = ($$props) => {
    if ('num' in $$props) $$invalidate(0, (num = $$props.num));
    if ('$$scope' in $$props) $$invalidate(1, ($$scope = $$props.$$scope));
  };

  return [num, $$scope, slots];
}

class Grid extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$z, create_fragment$y, safe_not_equal, { num: 0 });
  }
}

/* src/lib/journey/callbacks/confirmation/confirmation.svelte generated by Svelte v3.55.0 */

function get_each_context$5(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[15] = list[i];
  return child_ctx;
}

// (116:0) {:else}
function create_else_block_1(ctx) {
  let grid;
  let current;

  grid = new Grid({
    props: {
      num: /*options*/ ctx[3].length,
      $$slots: { default: [create_default_slot_1$9] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(grid.$$.fragment);
    },
    m(target, anchor) {
      mount_component(grid, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const grid_changes = {};
      if (dirty & /*options*/ 8) grid_changes.num = /*options*/ ctx[3].length;

      if (dirty & /*$$scope, options, defaultChoice, buttonStyle*/ 262200) {
        grid_changes.$$scope = { dirty, ctx };
      }

      grid.$set(grid_changes);
    },
    i(local) {
      if (current) return;
      transition_in(grid.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(grid.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(grid, detaching);
    },
  };
}

// (95:0) {#if !stepMetadata?.derived.isStepSelfSubmittable}
function create_if_block$c(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block_1$8, create_else_block$4];
  const if_blocks = [];

  function select_block_type_1(ctx, dirty) {
    if (/*options*/ ctx[3].length > 1) return 0;
    return 1;
  }

  current_block_type_index = select_block_type_1(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_1(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

// (119:6) <Button         style={options.length > 1 && defaultChoice === Number(opt.value) ? 'primary' : buttonStyle}         type="button"         width="auto"         onClick={() => setBtnValue(Number(opt.value))}       >
function create_default_slot_2$4(ctx) {
  let t0_value = /*opt*/ ctx[15].text + '';
  let t0;
  let t1;

  return {
    c() {
      t0 = text(t0_value);
      t1 = space();
    },
    m(target, anchor) {
      insert(target, t0, anchor);
      insert(target, t1, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*options*/ 8 && t0_value !== (t0_value = /*opt*/ ctx[15].text + ''))
        set_data(t0, t0_value);
    },
    d(detaching) {
      if (detaching) detach(t0);
      if (detaching) detach(t1);
    },
  };
}

// (118:4) {#each options as opt}
function create_each_block$5(ctx) {
  let button;
  let current;

  function func() {
    return /*func*/ ctx[14](/*opt*/ ctx[15]);
  }

  button = new Button({
    props: {
      style:
        /*options*/ ctx[3].length > 1 && /*defaultChoice*/ ctx[5] === Number(/*opt*/ ctx[15].value)
          ? 'primary'
          : /*buttonStyle*/ ctx[4],
      type: 'button',
      width: 'auto',
      onClick: func,
      $$slots: { default: [create_default_slot_2$4] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const button_changes = {};

      if (dirty & /*options, defaultChoice, buttonStyle*/ 56)
        button_changes.style =
          /*options*/ ctx[3].length > 1 &&
          /*defaultChoice*/ ctx[5] === Number(/*opt*/ ctx[15].value)
            ? 'primary'
            : /*buttonStyle*/ ctx[4];

      if (dirty & /*options*/ 8) button_changes.onClick = func;

      if (dirty & /*$$scope, options*/ 262152) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (117:2) <Grid num={options.length}>
function create_default_slot_1$9(ctx) {
  let each_1_anchor;
  let current;
  let each_value = /*options*/ ctx[3];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
  }

  const out = (i) =>
    transition_out(each_blocks[i], 1, 1, () => {
      each_blocks[i] = null;
    });

  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }

      insert(target, each_1_anchor, anchor);
      current = true;
    },
    p(ctx, dirty) {
      if (dirty & /*options, defaultChoice, Number, buttonStyle, setBtnValue*/ 312) {
        each_value = /*options*/ ctx[3];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$5(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$5(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }
    },
    i(local) {
      if (current) return;

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      current = false;
    },
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching) detach(each_1_anchor);
    },
  };
}

// (105:2) {:else}
function create_else_block$4(ctx) {
  let checkbox;
  let current;

  checkbox = new /*Checkbox*/ ctx[7]({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      isInvalid: false,
      key: /*inputName*/ ctx[6],
      onChange: /*setCheckboxValue*/ ctx[10],
      value: false,
      $$slots: { default: [create_default_slot$g] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(checkbox.$$.fragment);
    },
    m(target, anchor) {
      mount_component(checkbox, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const checkbox_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        checkbox_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*inputName*/ 64) checkbox_changes.key = /*inputName*/ ctx[6];

      if (dirty & /*$$scope, options*/ 262152) {
        checkbox_changes.$$scope = { dirty, ctx };
      }

      checkbox.$set(checkbox_changes);
    },
    i(local) {
      if (current) return;
      transition_in(checkbox.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(checkbox.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(checkbox, detaching);
    },
  };
}

// (96:2) {#if options.length > 1}
function create_if_block_1$8(ctx) {
  let select;
  let current;

  select = new Floating_label$1({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      isRequired: false,
      key: /*inputName*/ ctx[6],
      label: /*label*/ ctx[2],
      onChange: /*setOptionValue*/ ctx[9],
      options: /*options*/ ctx[3],
    },
  });

  return {
    c() {
      create_component(select.$$.fragment);
    },
    m(target, anchor) {
      mount_component(select, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const select_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        select_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*inputName*/ 64) select_changes.key = /*inputName*/ ctx[6];
      if (dirty & /*label*/ 4) select_changes.label = /*label*/ ctx[2];
      if (dirty & /*options*/ 8) select_changes.options = /*options*/ ctx[3];
      select.$set(select_changes);
    },
    i(local) {
      if (current) return;
      transition_in(select.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(select.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(select, detaching);
    },
  };
}

// (106:4) <Checkbox       isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}       isInvalid={false}       key={inputName}       onChange={setCheckboxValue}       value={false}     >
function create_default_slot$g(ctx) {
  let t_value = /*options*/ ctx[3][0].text + '';
  let t;

  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*options*/ 8 && t_value !== (t_value = /*options*/ ctx[3][0].text + ''))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$x(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$c, create_else_block_1];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (!(/*stepMetadata*/ ctx[1]?.derived.isStepSelfSubmittable)) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$y($$self, $$props, $$invalidate) {
  const style = {};
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { selfSubmitFunction = null } = $$props;
  let { stepMetadata } = $$props;

  const Checkbox = style.checksAndRadios === 'standard' ? Standard : Animated$1;

  let buttonStyle;
  let defaultChoice = callback.getDefaultOption();
  let inputName;
  let label;
  let options;

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(index) {
    callback.setOptionIndex(index);

    if (callbackMetadata) {
      $$invalidate(0, (callbackMetadata.derived.isReadyForSubmission = true), callbackMetadata);
    }

    selfSubmitFunction && selfSubmitFunction();
  }

  /**
   * @function setOptionValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setOptionValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setOptionIndex(Number(event.target.value));
  }

  /**
   * @function setOptionValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setCheckboxValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    const value = event.target.checked;

    if (value) {
      callback.setOptionIndex(0);
    } else {
      // If checkbox is unset, revert back to default choice
      callback.setOptionIndex(defaultChoice);
    }
  }

  if (callback.getInputValue() === 0) {
    /**
     * If input value is 0 (falsy value), then let's make sure it's set to the default value
     * There's a case when the input value is 100, and for that we leave it 100
     */
    callback.setOptionIndex(defaultChoice);
  }

  const func = (opt) => setBtnValue(Number(opt.value));

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(12, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(0, (callbackMetadata = $$props.callbackMetadata));
    if ('selfSubmitFunction' in $$props)
      $$invalidate(13, (selfSubmitFunction = $$props.selfSubmitFunction));
    if ('stepMetadata' in $$props) $$invalidate(1, (stepMetadata = $$props.stepMetadata));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata, options, stepMetadata, label*/ 4111) {
      // TODO: use selfSubmitFunction to communicate to step component that this callback is ready
      {
        $$invalidate(
          6,
          (inputName =
            callback?.payload?.input?.[0].name || `confirmation-${callbackMetadata?.idx}`),
        );
        $$invalidate(
          3,
          (options = callback
            .getOptions()
            .map((option, index) => ({ value: `${index}`, text: option }))),
        );

        if (callbackMetadata?.platform?.showOnlyPositiveAnswer) {
          // The positive option is always first in the options array
          $$invalidate(3, (options = options.slice(0, 1)));
        }

        $$invalidate(5, (defaultChoice = callback.getDefaultOption()));
        $$invalidate(2, (label = interpolate(textToKey('pleaseConfirm'), null, 'Please Confirm')));

        if (!stepMetadata?.derived.isStepSelfSubmittable && options.length > 1) {
          // Since the user needs to confirm, add this non-value to force selection
          options.unshift({ value: '', text: label });
        } else if (options.length === 1) {
          $$invalidate(4, (buttonStyle = 'outline'));
        } else {
          $$invalidate(4, (buttonStyle = 'secondary'));
        }
      }
    }
  };

  return [
    callbackMetadata,
    stepMetadata,
    label,
    options,
    buttonStyle,
    defaultChoice,
    inputName,
    Checkbox,
    setBtnValue,
    setOptionValue,
    setCheckboxValue,
    style,
    callback,
    selfSubmitFunction,
    func,
  ];
}

class Confirmation extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$y, create_fragment$x, safe_not_equal, {
      style: 11,
      callback: 12,
      callbackMetadata: 0,
      selfSubmitFunction: 13,
      stepMetadata: 1,
    });
  }

  get style() {
    return this.$$.ctx[11];
  }
}

/* src/lib/journey/callbacks/hidden-value/hidden-value.svelte generated by Svelte v3.55.0 */

function instance$x($$self, $$props, $$invalidate) {
  const callbackMetadata = null;
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  const callback = null;
  return [callbackMetadata, selfSubmitFunction, stepMetadata, style, callback];
}

class Hidden_value extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$x, null, safe_not_equal, {
      callbackMetadata: 0,
      selfSubmitFunction: 1,
      stepMetadata: 2,
      style: 3,
      callback: 4,
    });
  }

  get callbackMetadata() {
    return this.$$.ctx[0];
  }

  get selfSubmitFunction() {
    return this.$$.ctx[1];
  }

  get stepMetadata() {
    return this.$$.ctx[2];
  }

  get style() {
    return this.$$.ctx[3];
  }

  get callback() {
    return this.$$.ctx[4];
  }
}

/* src/lib/components/primitives/input/input.svelte generated by Svelte v3.55.0 */

function create_if_block_7$1(ctx) {
  let label_1;
  let current;

  label_1 = new Label({
    props: {
      key: /*key*/ ctx[3],
      classes: `${/*labelClasses*/ ctx[5]} tw_w-full tw_ml-1`,
      $$slots: { default: [create_default_slot_1$8] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(label_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(label_1, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const label_1_changes = {};
      if (dirty & /*key*/ 8) label_1_changes.key = /*key*/ ctx[3];
      if (dirty & /*labelClasses*/ 32)
        label_1_changes.classes = `${/*labelClasses*/ ctx[5]} tw_w-full tw_ml-1`;

      if (dirty & /*$$scope, label*/ 67108880) {
        label_1_changes.$$scope = { dirty, ctx };
      }

      label_1.$set(label_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(label_1, detaching);
    },
  };
}

// (25:2) <Label {key} classes={`${labelClasses} tw_w-full tw_ml-1`}>
function create_default_slot_1$8(ctx) {
  let t;

  return {
    c() {
      t = text(/*label*/ ctx[4]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*label*/ 16) set_data(t, /*label*/ ctx[4]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (33:0) {#if type === 'date'}
function create_if_block_6$1(ctx) {
  let input;
  let input_aria_describedby_value;
  let input_class_value;
  let mounted;
  let dispose;

  return {
    c() {
      input = element('input');
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      attr(
        input,
        'class',
        (input_class_value = `${
          /*inputClasses*/ ctx[2]
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`),
      );
      attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      attr(input, 'id', /*key*/ ctx[3]);
      attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      input.required = /*isRequired*/ ctx[9];
      attr(input, 'type', 'date');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding*/ ctx[14](input);
      set_input_value(input, /*value*/ ctx[0]);

      if (!mounted) {
        dispose = [
          listen(input, 'change', function () {
            if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
          }),
          listen(input, 'input', /*input_input_handler*/ ctx[15]),
        ];

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
        dirty & /*key*/ 8 &&
        input_aria_describedby_value !==
          (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`)
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (dirty & /*isInvalid*/ 1024) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      }

      if (
        dirty & /*inputClasses*/ 4 &&
        input_class_value !==
          (input_class_value = `${
            /*inputClasses*/ ctx[2]
          } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`)
      ) {
        attr(input, 'class', input_class_value);
      }

      if (dirty & /*forceValidityFailure*/ 2) {
        attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      }

      if (dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (dirty & /*placeholder*/ 256) {
        attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      }

      if (dirty & /*isRequired*/ 512) {
        input.required = /*isRequired*/ ctx[9];
      }

      if (dirty & /*value*/ 1) {
        set_input_value(input, /*value*/ ctx[0]);
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding*/ ctx[14](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

// (49:0) {#if type === 'email'}
function create_if_block_5$1(ctx) {
  let input;
  let input_aria_describedby_value;
  let input_class_value;
  let mounted;
  let dispose;

  return {
    c() {
      input = element('input');
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      attr(
        input,
        'class',
        (input_class_value = `${
          /*inputClasses*/ ctx[2]
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`),
      );
      attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      attr(input, 'id', /*key*/ ctx[3]);
      attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      input.required = /*isRequired*/ ctx[9];
      attr(input, 'type', 'email');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding_1*/ ctx[16](input);
      set_input_value(input, /*value*/ ctx[0]);

      if (!mounted) {
        dispose = [
          listen(input, 'change', function () {
            if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
          }),
          listen(input, 'input', /*input_input_handler_1*/ ctx[17]),
        ];

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
        dirty & /*key*/ 8 &&
        input_aria_describedby_value !==
          (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`)
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (dirty & /*isInvalid*/ 1024) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      }

      if (
        dirty & /*inputClasses*/ 4 &&
        input_class_value !==
          (input_class_value = `${
            /*inputClasses*/ ctx[2]
          } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`)
      ) {
        attr(input, 'class', input_class_value);
      }

      if (dirty & /*forceValidityFailure*/ 2) {
        attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      }

      if (dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (dirty & /*placeholder*/ 256) {
        attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      }

      if (dirty & /*isRequired*/ 512) {
        input.required = /*isRequired*/ ctx[9];
      }

      if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
        set_input_value(input, /*value*/ ctx[0]);
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding_1*/ ctx[16](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

// (65:0) {#if type === 'number'}
function create_if_block_4$1(ctx) {
  let input;
  let input_aria_describedby_value;
  let input_class_value;
  let mounted;
  let dispose;

  return {
    c() {
      input = element('input');
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      attr(
        input,
        'class',
        (input_class_value = `${
          /*inputClasses*/ ctx[2]
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`),
      );
      attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      attr(input, 'id', /*key*/ ctx[3]);
      attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      input.required = /*isRequired*/ ctx[9];
      attr(input, 'type', 'number');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding_2*/ ctx[18](input);
      set_input_value(input, /*value*/ ctx[0]);

      if (!mounted) {
        dispose = [
          listen(input, 'change', function () {
            if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
          }),
          listen(input, 'input', /*input_input_handler_2*/ ctx[19]),
        ];

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
        dirty & /*key*/ 8 &&
        input_aria_describedby_value !==
          (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`)
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (dirty & /*isInvalid*/ 1024) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      }

      if (
        dirty & /*inputClasses*/ 4 &&
        input_class_value !==
          (input_class_value = `${
            /*inputClasses*/ ctx[2]
          } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`)
      ) {
        attr(input, 'class', input_class_value);
      }

      if (dirty & /*forceValidityFailure*/ 2) {
        attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      }

      if (dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (dirty & /*placeholder*/ 256) {
        attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      }

      if (dirty & /*isRequired*/ 512) {
        input.required = /*isRequired*/ ctx[9];
      }

      if (dirty & /*value*/ 1 && to_number(input.value) !== /*value*/ ctx[0]) {
        set_input_value(input, /*value*/ ctx[0]);
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding_2*/ ctx[18](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

// (81:0) {#if type === 'password'}
function create_if_block_3$3(ctx) {
  let input;
  let input_aria_describedby_value;
  let input_class_value;
  let mounted;
  let dispose;

  return {
    c() {
      input = element('input');
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      attr(
        input,
        'class',
        (input_class_value = `${
          /*inputClasses*/ ctx[2]
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`),
      );
      attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      attr(input, 'id', /*key*/ ctx[3]);
      attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      input.required = /*isRequired*/ ctx[9];
      attr(input, 'type', 'password');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding_3*/ ctx[20](input);
      set_input_value(input, /*value*/ ctx[0]);

      if (!mounted) {
        dispose = [
          listen(input, 'change', function () {
            if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
          }),
          listen(input, 'input', /*input_input_handler_3*/ ctx[21]),
        ];

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
        dirty & /*key*/ 8 &&
        input_aria_describedby_value !==
          (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`)
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (dirty & /*isInvalid*/ 1024) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      }

      if (
        dirty & /*inputClasses*/ 4 &&
        input_class_value !==
          (input_class_value = `${
            /*inputClasses*/ ctx[2]
          } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`)
      ) {
        attr(input, 'class', input_class_value);
      }

      if (dirty & /*forceValidityFailure*/ 2) {
        attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      }

      if (dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (dirty & /*placeholder*/ 256) {
        attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      }

      if (dirty & /*isRequired*/ 512) {
        input.required = /*isRequired*/ ctx[9];
      }

      if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
        set_input_value(input, /*value*/ ctx[0]);
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding_3*/ ctx[20](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

// (97:0) {#if type === 'phone'}
function create_if_block_2$6(ctx) {
  let input;
  let input_aria_describedby_value;
  let input_class_value;
  let mounted;
  let dispose;

  return {
    c() {
      input = element('input');
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      attr(
        input,
        'class',
        (input_class_value = `${
          /*inputClasses*/ ctx[2]
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`),
      );
      attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      attr(input, 'id', /*key*/ ctx[3]);
      attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      input.required = /*isRequired*/ ctx[9];
      attr(input, 'type', 'phone');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding_4*/ ctx[22](input);
      set_input_value(input, /*value*/ ctx[0]);

      if (!mounted) {
        dispose = [
          listen(input, 'change', function () {
            if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
          }),
          listen(input, 'input', /*input_input_handler_4*/ ctx[23]),
        ];

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
        dirty & /*key*/ 8 &&
        input_aria_describedby_value !==
          (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`)
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (dirty & /*isInvalid*/ 1024) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      }

      if (
        dirty & /*inputClasses*/ 4 &&
        input_class_value !==
          (input_class_value = `${
            /*inputClasses*/ ctx[2]
          } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`)
      ) {
        attr(input, 'class', input_class_value);
      }

      if (dirty & /*forceValidityFailure*/ 2) {
        attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      }

      if (dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (dirty & /*placeholder*/ 256) {
        attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      }

      if (dirty & /*isRequired*/ 512) {
        input.required = /*isRequired*/ ctx[9];
      }

      if (dirty & /*value*/ 1) {
        set_input_value(input, /*value*/ ctx[0]);
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding_4*/ ctx[22](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

// (113:0) {#if type === 'text'}
function create_if_block_1$7(ctx) {
  let input;
  let input_aria_describedby_value;
  let input_class_value;
  let mounted;
  let dispose;

  return {
    c() {
      input = element('input');
      attr(input, 'aria-describedby', (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`));
      attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      attr(
        input,
        'class',
        (input_class_value = `${
          /*inputClasses*/ ctx[2]
        } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`),
      );
      attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      attr(input, 'id', /*key*/ ctx[3]);
      attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      input.required = /*isRequired*/ ctx[9];
      attr(input, 'type', 'text');
    },
    m(target, anchor) {
      insert(target, input, anchor);
      /*input_binding_5*/ ctx[24](input);
      set_input_value(input, /*value*/ ctx[0]);

      if (!mounted) {
        dispose = [
          listen(input, 'change', function () {
            if (is_function(/*onChange*/ ctx[7])) /*onChange*/ ctx[7].apply(this, arguments);
          }),
          listen(input, 'input', /*input_input_handler_5*/ ctx[25]),
        ];

        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;

      if (
        dirty & /*key*/ 8 &&
        input_aria_describedby_value !==
          (input_aria_describedby_value = `${/*key*/ ctx[3]}-message`)
      ) {
        attr(input, 'aria-describedby', input_aria_describedby_value);
      }

      if (dirty & /*isInvalid*/ 1024) {
        attr(input, 'aria-invalid', /*isInvalid*/ ctx[10]);
      }

      if (
        dirty & /*inputClasses*/ 4 &&
        input_class_value !==
          (input_class_value = `${
            /*inputClasses*/ ctx[2]
          } tw_input-base dark:tw_input-base_dark tw_focusable-element dark:tw_focusable-element_dark tw_flex-1 tw_w-full`)
      ) {
        attr(input, 'class', input_class_value);
      }

      if (dirty & /*forceValidityFailure*/ 2) {
        attr(input, 'data-force-validity-failure', /*forceValidityFailure*/ ctx[1]);
      }

      if (dirty & /*key*/ 8) {
        attr(input, 'id', /*key*/ ctx[3]);
      }

      if (dirty & /*placeholder*/ 256) {
        attr(input, 'placeholder', /*placeholder*/ ctx[8]);
      }

      if (dirty & /*isRequired*/ 512) {
        input.required = /*isRequired*/ ctx[9];
      }

      if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
        set_input_value(input, /*value*/ ctx[0]);
      }
    },
    d(detaching) {
      if (detaching) detach(input);
      /*input_binding_5*/ ctx[24](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

// (129:0) {#if labelOrder === 'last'}
function create_if_block$b(ctx) {
  let label_1;
  let current;

  label_1 = new Label({
    props: {
      key: /*key*/ ctx[3],
      classes: `${/*labelClasses*/ ctx[5]}`,
      $$slots: { default: [create_default_slot$f] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(label_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(label_1, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const label_1_changes = {};
      if (dirty & /*key*/ 8) label_1_changes.key = /*key*/ ctx[3];
      if (dirty & /*labelClasses*/ 32) label_1_changes.classes = `${/*labelClasses*/ ctx[5]}`;

      if (dirty & /*$$scope, label*/ 67108880) {
        label_1_changes.$$scope = { dirty, ctx };
      }

      label_1.$set(label_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(label_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(label_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(label_1, detaching);
    },
  };
}

// (130:2) <Label {key} classes={`${labelClasses}`}>
function create_default_slot$f(ctx) {
  let t;

  return {
    c() {
      t = text(/*label*/ ctx[4]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*label*/ 16) set_data(t, /*label*/ ctx[4]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$w(ctx) {
  let t0;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let if_block7_anchor;
  let current;
  let if_block0 = /*labelOrder*/ ctx[6] === 'first' && create_if_block_7$1(ctx);
  let if_block1 = /*type*/ ctx[11] === 'date' && create_if_block_6$1(ctx);
  let if_block2 = /*type*/ ctx[11] === 'email' && create_if_block_5$1(ctx);
  let if_block3 = /*type*/ ctx[11] === 'number' && create_if_block_4$1(ctx);
  let if_block4 = /*type*/ ctx[11] === 'password' && create_if_block_3$3(ctx);
  let if_block5 = /*type*/ ctx[11] === 'phone' && create_if_block_2$6(ctx);
  let if_block6 = /*type*/ ctx[11] === 'text' && create_if_block_1$7(ctx);
  let if_block7 = /*labelOrder*/ ctx[6] === 'last' && create_if_block$b(ctx);

  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      if (if_block1) if_block1.c();
      t1 = space();
      if (if_block2) if_block2.c();
      t2 = space();
      if (if_block3) if_block3.c();
      t3 = space();
      if (if_block4) if_block4.c();
      t4 = space();
      if (if_block5) if_block5.c();
      t5 = space();
      if (if_block6) if_block6.c();
      t6 = space();
      if (if_block7) if_block7.c();
      if_block7_anchor = empty();
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t1, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, t2, anchor);
      if (if_block3) if_block3.m(target, anchor);
      insert(target, t3, anchor);
      if (if_block4) if_block4.m(target, anchor);
      insert(target, t4, anchor);
      if (if_block5) if_block5.m(target, anchor);
      insert(target, t5, anchor);
      if (if_block6) if_block6.m(target, anchor);
      insert(target, t6, anchor);
      if (if_block7) if_block7.m(target, anchor);
      insert(target, if_block7_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      if (/*labelOrder*/ ctx[6] === 'first') {
        if (if_block0) {
          if_block0.p(ctx, dirty);

          if (dirty & /*labelOrder*/ 64) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_7$1(ctx);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();

        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });

        check_outros();
      }

      if (/*type*/ ctx[11] === 'date') {
        if (if_block1) {
          if_block1.p(ctx, dirty);
        } else {
          if_block1 = create_if_block_6$1(ctx);
          if_block1.c();
          if_block1.m(t1.parentNode, t1);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }

      if (/*type*/ ctx[11] === 'email') {
        if (if_block2) {
          if_block2.p(ctx, dirty);
        } else {
          if_block2 = create_if_block_5$1(ctx);
          if_block2.c();
          if_block2.m(t2.parentNode, t2);
        }
      } else if (if_block2) {
        if_block2.d(1);
        if_block2 = null;
      }

      if (/*type*/ ctx[11] === 'number') {
        if (if_block3) {
          if_block3.p(ctx, dirty);
        } else {
          if_block3 = create_if_block_4$1(ctx);
          if_block3.c();
          if_block3.m(t3.parentNode, t3);
        }
      } else if (if_block3) {
        if_block3.d(1);
        if_block3 = null;
      }

      if (/*type*/ ctx[11] === 'password') {
        if (if_block4) {
          if_block4.p(ctx, dirty);
        } else {
          if_block4 = create_if_block_3$3(ctx);
          if_block4.c();
          if_block4.m(t4.parentNode, t4);
        }
      } else if (if_block4) {
        if_block4.d(1);
        if_block4 = null;
      }

      if (/*type*/ ctx[11] === 'phone') {
        if (if_block5) {
          if_block5.p(ctx, dirty);
        } else {
          if_block5 = create_if_block_2$6(ctx);
          if_block5.c();
          if_block5.m(t5.parentNode, t5);
        }
      } else if (if_block5) {
        if_block5.d(1);
        if_block5 = null;
      }

      if (/*type*/ ctx[11] === 'text') {
        if (if_block6) {
          if_block6.p(ctx, dirty);
        } else {
          if_block6 = create_if_block_1$7(ctx);
          if_block6.c();
          if_block6.m(t6.parentNode, t6);
        }
      } else if (if_block6) {
        if_block6.d(1);
        if_block6 = null;
      }

      if (/*labelOrder*/ ctx[6] === 'last') {
        if (if_block7) {
          if_block7.p(ctx, dirty);

          if (dirty & /*labelOrder*/ 64) {
            transition_in(if_block7, 1);
          }
        } else {
          if_block7 = create_if_block$b(ctx);
          if_block7.c();
          transition_in(if_block7, 1);
          if_block7.m(if_block7_anchor.parentNode, if_block7_anchor);
        }
      } else if (if_block7) {
        group_outros();

        transition_out(if_block7, 1, 1, () => {
          if_block7 = null;
        });

        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(if_block7);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(if_block7);
      current = false;
    },
    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t0);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(t1);
      if (if_block2) if_block2.d(detaching);
      if (detaching) detach(t2);
      if (if_block3) if_block3.d(detaching);
      if (detaching) detach(t3);
      if (if_block4) if_block4.d(detaching);
      if (detaching) detach(t4);
      if (if_block5) if_block5.d(detaching);
      if (detaching) detach(t5);
      if (if_block6) if_block6.d(detaching);
      if (detaching) detach(t6);
      if (if_block7) if_block7.d(detaching);
      if (detaching) detach(if_block7_anchor);
    },
  };
}

function instance$w($$self, $$props, $$invalidate) {
  let { forceValidityFailure = false } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { inputClasses = '' } = $$props;
  let { key } = $$props;
  let { label } = $$props;
  let { labelClasses = '' } = $$props;
  let { labelOrder = 'first' } = $$props;
  let { onChange } = $$props;
  let { placeholder = ' ' } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = null } = $$props;
  let { type = 'text' } = $$props;
  let { value = '' } = $$props;
  let inputEl;

  afterUpdate(() => {
    if (isFirstInvalidInput) {
      inputEl.focus();
    }
  });

  function input_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(12, inputEl);
    });
  }

  function input_input_handler() {
    value = this.value;
    $$invalidate(0, value);
  }

  function input_binding_1($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(12, inputEl);
    });
  }

  function input_input_handler_1() {
    value = this.value;
    $$invalidate(0, value);
  }

  function input_binding_2($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(12, inputEl);
    });
  }

  function input_input_handler_2() {
    value = to_number(this.value);
    $$invalidate(0, value);
  }

  function input_binding_3($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(12, inputEl);
    });
  }

  function input_input_handler_3() {
    value = this.value;
    $$invalidate(0, value);
  }

  function input_binding_4($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(12, inputEl);
    });
  }

  function input_input_handler_4() {
    value = this.value;
    $$invalidate(0, value);
  }

  function input_binding_5($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      inputEl = $$value;
      $$invalidate(12, inputEl);
    });
  }

  function input_input_handler_5() {
    value = this.value;
    $$invalidate(0, value);
  }

  $$self.$$set = ($$props) => {
    if ('forceValidityFailure' in $$props)
      $$invalidate(1, (forceValidityFailure = $$props.forceValidityFailure));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(13, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('inputClasses' in $$props) $$invalidate(2, (inputClasses = $$props.inputClasses));
    if ('key' in $$props) $$invalidate(3, (key = $$props.key));
    if ('label' in $$props) $$invalidate(4, (label = $$props.label));
    if ('labelClasses' in $$props) $$invalidate(5, (labelClasses = $$props.labelClasses));
    if ('labelOrder' in $$props) $$invalidate(6, (labelOrder = $$props.labelOrder));
    if ('onChange' in $$props) $$invalidate(7, (onChange = $$props.onChange));
    if ('placeholder' in $$props) $$invalidate(8, (placeholder = $$props.placeholder));
    if ('isRequired' in $$props) $$invalidate(9, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(10, (isInvalid = $$props.isInvalid));
    if ('type' in $$props) $$invalidate(11, (type = $$props.type));
    if ('value' in $$props) $$invalidate(0, (value = $$props.value));
  };

  return [
    value,
    forceValidityFailure,
    inputClasses,
    key,
    label,
    labelClasses,
    labelOrder,
    onChange,
    placeholder,
    isRequired,
    isInvalid,
    type,
    inputEl,
    isFirstInvalidInput,
    input_binding,
    input_input_handler,
    input_binding_1,
    input_input_handler_1,
    input_binding_2,
    input_input_handler_2,
    input_binding_3,
    input_input_handler_3,
    input_binding_4,
    input_input_handler_4,
    input_binding_5,
    input_input_handler_5,
  ];
}

class Input extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$w, create_fragment$w, safe_not_equal, {
      forceValidityFailure: 1,
      isFirstInvalidInput: 13,
      inputClasses: 2,
      key: 3,
      label: 4,
      labelClasses: 5,
      labelOrder: 6,
      onChange: 7,
      placeholder: 8,
      isRequired: 9,
      isInvalid: 10,
      type: 11,
      value: 0,
    });
  }
}

/* src/lib/components/compositions/input-floating/floating-label.svelte generated by Svelte v3.55.0 */
const get_input_button_slot_changes$1 = (dirty) => ({});
const get_input_button_slot_context$1 = (ctx) => ({});

function create_fragment$v(ctx) {
  let div1;
  let input;
  let updating_value;
  let t0;
  let t1;
  let div0;
  let message_1;
  let t2;
  let div0_id_value;
  let current;

  function input_value_binding(value) {
    /*input_value_binding*/ ctx[16](value);
  }

  let input_props = {
    forceValidityFailure: /*forceValidityFailure*/ ctx[2],
    isFirstInvalidInput: /*isFirstInvalidInput*/ ctx[4],
    inputClasses: `tw_input-floating dark:tw_input-floating_dark ${
      /*hasRightIcon*/ ctx[5] ? '!tw_border-r-0 !tw_rounded-r-none' : ''
    }`,
    key: /*key*/ ctx[7],
    onChange: /*onChangeWrapper*/ ctx[11],
    label: /*label*/ ctx[8],
    labelClasses: 'tw_absolute tw_border tw_border-transparent tw_input-floating-label',
    labelOrder: 'last',
    isRequired: /*isRequired*/ ctx[6],
    isInvalid: /*isInvalid*/ ctx[0],
    type: /*type*/ ctx[10],
  };

  if (/*value*/ ctx[1] !== void 0) {
    input_props.value = /*value*/ ctx[1];
  }

  input = new Input({ props: input_props });
  binding_callbacks.push(() => bind(input, 'value', input_value_binding, /*value*/ ctx[1]));
  const input_button_slot_template = /*#slots*/ ctx[15]['input-button'];
  const input_button_slot = create_slot(
    input_button_slot_template,
    ctx,
    /*$$scope*/ ctx[14],
    get_input_button_slot_context$1,
  );

  message_1 = new Input_message({
    props: {
      dirtyMessage: /*message*/ ctx[3],
      showMessage: /*showMessage*/ ctx[9],
      type: /*isInvalid*/ ctx[0] ? 'error' : 'info',
    },
  });

  const default_slot_template = /*#slots*/ ctx[15].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

  return {
    c() {
      div1 = element('div');
      create_component(input.$$.fragment);
      t0 = space();
      if (input_button_slot) input_button_slot.c();
      t1 = space();
      div0 = element('div');
      create_component(message_1.$$.fragment);
      t2 = space();
      if (default_slot) default_slot.c();
      attr(div0, 'class', 'tw_w-full');
      attr(div0, 'id', (div0_id_value = `${/*key*/ ctx[7]}-message`));
      attr(
        div1,
        'class',
        `tw_justify-items-stretch tw_flex tw_input-spacing tw_relative tw_flex-wrap`,
      );
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      mount_component(input, div1, null);
      append(div1, t0);

      if (input_button_slot) {
        input_button_slot.m(div1, null);
      }

      append(div1, t1);
      append(div1, div0);
      mount_component(message_1, div0, null);
      append(div0, t2);

      if (default_slot) {
        default_slot.m(div0, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*forceValidityFailure*/ 4)
        input_changes.forceValidityFailure = /*forceValidityFailure*/ ctx[2];
      if (dirty & /*isFirstInvalidInput*/ 16)
        input_changes.isFirstInvalidInput = /*isFirstInvalidInput*/ ctx[4];

      if (dirty & /*hasRightIcon*/ 32)
        input_changes.inputClasses = `tw_input-floating dark:tw_input-floating_dark ${
          /*hasRightIcon*/ ctx[5] ? '!tw_border-r-0 !tw_rounded-r-none' : ''
        }`;

      if (dirty & /*key*/ 128) input_changes.key = /*key*/ ctx[7];
      if (dirty & /*label*/ 256) input_changes.label = /*label*/ ctx[8];
      if (dirty & /*isRequired*/ 64) input_changes.isRequired = /*isRequired*/ ctx[6];
      if (dirty & /*isInvalid*/ 1) input_changes.isInvalid = /*isInvalid*/ ctx[0];
      if (dirty & /*type*/ 1024) input_changes.type = /*type*/ ctx[10];

      if (!updating_value && dirty & /*value*/ 2) {
        updating_value = true;
        input_changes.value = /*value*/ ctx[1];
        add_flush_callback(() => (updating_value = false));
      }

      input.$set(input_changes);

      if (input_button_slot) {
        if (input_button_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
          update_slot_base(
            input_button_slot,
            input_button_slot_template,
            ctx,
            /*$$scope*/ ctx[14],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
              : get_slot_changes(
                  input_button_slot_template,
                  /*$$scope*/ ctx[14],
                  dirty,
                  get_input_button_slot_changes$1,
                ),
            get_input_button_slot_context$1,
          );
        }
      }

      const message_1_changes = {};
      if (dirty & /*message*/ 8) message_1_changes.dirtyMessage = /*message*/ ctx[3];
      if (dirty & /*showMessage*/ 512) message_1_changes.showMessage = /*showMessage*/ ctx[9];
      if (dirty & /*isInvalid*/ 1) message_1_changes.type = /*isInvalid*/ ctx[0] ? 'error' : 'info';
      message_1.$set(message_1_changes);

      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[14],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*key*/ 128 && div0_id_value !== (div0_id_value = `${/*key*/ ctx[7]}-message`))
      ) {
        attr(div0, 'id', div0_id_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      transition_in(input_button_slot, local);
      transition_in(message_1.$$.fragment, local);
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      transition_out(input_button_slot, local);
      transition_out(message_1.$$.fragment, local);
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div1);
      destroy_component(input);
      if (input_button_slot) input_button_slot.d(detaching);
      destroy_component(message_1);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$v($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { checkValidity = null } = $$props;
  let { forceValidityFailure = false } = $$props;
  let { message = '' } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { hasRightIcon = false } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { label } = $$props;
  let { onChange } = $$props;
  let { showMessage = undefined } = $$props;
  let { type = 'text' } = $$props;
  let { value = '' } = $$props;

  function onChangeWrapper(event) {
    if (checkValidity) {
      $$invalidate(0, (isInvalid = !checkValidity(event)));
    }

    onChange(event);
  }

  function input_value_binding(value$1) {
    value = value$1;
    $$invalidate(1, value);
  }

  $$self.$$set = ($$props) => {
    if ('checkValidity' in $$props) $$invalidate(12, (checkValidity = $$props.checkValidity));
    if ('forceValidityFailure' in $$props)
      $$invalidate(2, (forceValidityFailure = $$props.forceValidityFailure));
    if ('message' in $$props) $$invalidate(3, (message = $$props.message));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(4, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('hasRightIcon' in $$props) $$invalidate(5, (hasRightIcon = $$props.hasRightIcon));
    if ('isRequired' in $$props) $$invalidate(6, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(0, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(7, (key = $$props.key));
    if ('label' in $$props) $$invalidate(8, (label = $$props.label));
    if ('onChange' in $$props) $$invalidate(13, (onChange = $$props.onChange));
    if ('showMessage' in $$props) $$invalidate(9, (showMessage = $$props.showMessage));
    if ('type' in $$props) $$invalidate(10, (type = $$props.type));
    if ('value' in $$props) $$invalidate(1, (value = $$props.value));
    if ('$$scope' in $$props) $$invalidate(14, ($$scope = $$props.$$scope));
  };

  return [
    isInvalid,
    value,
    forceValidityFailure,
    message,
    isFirstInvalidInput,
    hasRightIcon,
    isRequired,
    key,
    label,
    showMessage,
    type,
    onChangeWrapper,
    checkValidity,
    onChange,
    $$scope,
    slots,
    input_value_binding,
  ];
}

class Floating_label extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$v, create_fragment$v, safe_not_equal, {
      checkValidity: 12,
      forceValidityFailure: 2,
      message: 3,
      isFirstInvalidInput: 4,
      hasRightIcon: 5,
      isRequired: 6,
      isInvalid: 0,
      key: 7,
      label: 8,
      onChange: 13,
      showMessage: 9,
      type: 10,
      value: 1,
    });
  }
}

/* src/lib/components/compositions/input-stacked/stacked-label.svelte generated by Svelte v3.55.0 */
const get_input_button_slot_changes = (dirty) => ({});
const get_input_button_slot_context = (ctx) => ({});

function create_fragment$u(ctx) {
  let div1;
  let input;
  let updating_value;
  let t0;
  let t1;
  let div0;
  let message_1;
  let t2;
  let div0_id_value;
  let current;

  function input_value_binding(value) {
    /*input_value_binding*/ ctx[17](value);
  }

  let input_props = {
    forceValidityFailure: /*forceValidityFailure*/ ctx[2],
    isFirstInvalidInput: /*isFirstInvalidInput*/ ctx[3],
    inputClasses: `${/*hasRightIcon*/ ctx[4] ? '!tw_border-r-0 !tw_rounded-r-none' : ''}`,
    key: /*key*/ ctx[7],
    onChange: /*onChangeWrapper*/ ctx[12],
    label: /*label*/ ctx[8],
    labelClasses: 'tw_input-stacked-label',
    labelOrder: 'first',
    placeholder: /*placeholder*/ ctx[9],
    isRequired: /*isRequired*/ ctx[6],
    isInvalid: /*isInvalid*/ ctx[0],
    type: /*type*/ ctx[11],
  };

  if (/*value*/ ctx[1] !== void 0) {
    input_props.value = /*value*/ ctx[1];
  }

  input = new Input({ props: input_props });
  binding_callbacks.push(() => bind(input, 'value', input_value_binding, /*value*/ ctx[1]));
  const input_button_slot_template = /*#slots*/ ctx[16]['input-button'];
  const input_button_slot = create_slot(
    input_button_slot_template,
    ctx,
    /*$$scope*/ ctx[15],
    get_input_button_slot_context,
  );

  message_1 = new Input_message({
    props: {
      key: /*key*/ ctx[7],
      dirtyMessage: /*message*/ ctx[5],
      showMessage: /*showMessage*/ ctx[10],
      type: /*isInvalid*/ ctx[0] ? 'error' : 'info',
    },
  });

  const default_slot_template = /*#slots*/ ctx[16].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

  return {
    c() {
      div1 = element('div');
      create_component(input.$$.fragment);
      t0 = space();
      if (input_button_slot) input_button_slot.c();
      t1 = space();
      div0 = element('div');
      create_component(message_1.$$.fragment);
      t2 = space();
      if (default_slot) default_slot.c();
      attr(div0, 'class', 'tw_w-full');
      attr(div0, 'id', (div0_id_value = `${/*key*/ ctx[7]}-message`));
      attr(div1, 'class', 'tw_input-spacing tw_flex tw_flex-wrap');
    },
    m(target, anchor) {
      insert(target, div1, anchor);
      mount_component(input, div1, null);
      append(div1, t0);

      if (input_button_slot) {
        input_button_slot.m(div1, null);
      }

      append(div1, t1);
      append(div1, div0);
      mount_component(message_1, div0, null);
      append(div0, t2);

      if (default_slot) {
        default_slot.m(div0, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*forceValidityFailure*/ 4)
        input_changes.forceValidityFailure = /*forceValidityFailure*/ ctx[2];
      if (dirty & /*isFirstInvalidInput*/ 8)
        input_changes.isFirstInvalidInput = /*isFirstInvalidInput*/ ctx[3];

      if (dirty & /*hasRightIcon*/ 16)
        input_changes.inputClasses = `${
          /*hasRightIcon*/ ctx[4] ? '!tw_border-r-0 !tw_rounded-r-none' : ''
        }`;

      if (dirty & /*key*/ 128) input_changes.key = /*key*/ ctx[7];
      if (dirty & /*label*/ 256) input_changes.label = /*label*/ ctx[8];
      if (dirty & /*placeholder*/ 512) input_changes.placeholder = /*placeholder*/ ctx[9];
      if (dirty & /*isRequired*/ 64) input_changes.isRequired = /*isRequired*/ ctx[6];
      if (dirty & /*isInvalid*/ 1) input_changes.isInvalid = /*isInvalid*/ ctx[0];
      if (dirty & /*type*/ 2048) input_changes.type = /*type*/ ctx[11];

      if (!updating_value && dirty & /*value*/ 2) {
        updating_value = true;
        input_changes.value = /*value*/ ctx[1];
        add_flush_callback(() => (updating_value = false));
      }

      input.$set(input_changes);

      if (input_button_slot) {
        if (input_button_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
          update_slot_base(
            input_button_slot,
            input_button_slot_template,
            ctx,
            /*$$scope*/ ctx[15],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
              : get_slot_changes(
                  input_button_slot_template,
                  /*$$scope*/ ctx[15],
                  dirty,
                  get_input_button_slot_changes,
                ),
            get_input_button_slot_context,
          );
        }
      }

      const message_1_changes = {};
      if (dirty & /*key*/ 128) message_1_changes.key = /*key*/ ctx[7];
      if (dirty & /*message*/ 32) message_1_changes.dirtyMessage = /*message*/ ctx[5];
      if (dirty & /*showMessage*/ 1024) message_1_changes.showMessage = /*showMessage*/ ctx[10];
      if (dirty & /*isInvalid*/ 1) message_1_changes.type = /*isInvalid*/ ctx[0] ? 'error' : 'info';
      message_1.$set(message_1_changes);

      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[15],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*key*/ 128 && div0_id_value !== (div0_id_value = `${/*key*/ ctx[7]}-message`))
      ) {
        attr(div0, 'id', div0_id_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      transition_in(input_button_slot, local);
      transition_in(message_1.$$.fragment, local);
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      transition_out(input_button_slot, local);
      transition_out(message_1.$$.fragment, local);
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div1);
      destroy_component(input);
      if (input_button_slot) input_button_slot.d(detaching);
      destroy_component(message_1);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$u($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { checkValidity = null } = $$props;
  let { forceValidityFailure = false } = $$props;
  let { isFirstInvalidInput } = $$props;
  let { hasRightIcon = false } = $$props;
  let { message = '' } = $$props;
  let { isRequired = false } = $$props;
  let { isInvalid = false } = $$props;
  let { key } = $$props;
  let { label } = $$props;
  let { onChange } = $$props;
  let { placeholder = undefined } = $$props;
  let { showMessage = undefined } = $$props;
  let { type = 'text' } = $$props;
  let { value = '' } = $$props;

  function onChangeWrapper(event) {
    if (checkValidity) {
      $$invalidate(0, (isInvalid = !checkValidity(event)));
    }

    onChange(event);
  }

  function input_value_binding(value$1) {
    value = value$1;
    $$invalidate(1, value);
  }

  $$self.$$set = ($$props) => {
    if ('checkValidity' in $$props) $$invalidate(13, (checkValidity = $$props.checkValidity));
    if ('forceValidityFailure' in $$props)
      $$invalidate(2, (forceValidityFailure = $$props.forceValidityFailure));
    if ('isFirstInvalidInput' in $$props)
      $$invalidate(3, (isFirstInvalidInput = $$props.isFirstInvalidInput));
    if ('hasRightIcon' in $$props) $$invalidate(4, (hasRightIcon = $$props.hasRightIcon));
    if ('message' in $$props) $$invalidate(5, (message = $$props.message));
    if ('isRequired' in $$props) $$invalidate(6, (isRequired = $$props.isRequired));
    if ('isInvalid' in $$props) $$invalidate(0, (isInvalid = $$props.isInvalid));
    if ('key' in $$props) $$invalidate(7, (key = $$props.key));
    if ('label' in $$props) $$invalidate(8, (label = $$props.label));
    if ('onChange' in $$props) $$invalidate(14, (onChange = $$props.onChange));
    if ('placeholder' in $$props) $$invalidate(9, (placeholder = $$props.placeholder));
    if ('showMessage' in $$props) $$invalidate(10, (showMessage = $$props.showMessage));
    if ('type' in $$props) $$invalidate(11, (type = $$props.type));
    if ('value' in $$props) $$invalidate(1, (value = $$props.value));
    if ('$$scope' in $$props) $$invalidate(15, ($$scope = $$props.$$scope));
  };

  return [
    isInvalid,
    value,
    forceValidityFailure,
    isFirstInvalidInput,
    hasRightIcon,
    message,
    isRequired,
    key,
    label,
    placeholder,
    showMessage,
    type,
    onChangeWrapper,
    checkValidity,
    onChange,
    $$scope,
    slots,
    input_value_binding,
  ];
}

class Stacked_label extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$u, create_fragment$u, safe_not_equal, {
      checkValidity: 13,
      forceValidityFailure: 2,
      isFirstInvalidInput: 3,
      hasRightIcon: 4,
      message: 5,
      isRequired: 6,
      isInvalid: 0,
      key: 7,
      label: 8,
      onChange: 14,
      placeholder: 9,
      showMessage: 10,
      type: 11,
      value: 1,
    });
  }
}

/* src/lib/components/icons/lock-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$t(ctx) {
  let svg;
  let path0;
  let path1;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path0 = svg_element('path');
      path1 = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(path0, 'd', 'M0 0h24v24H0z');
      attr(path0, 'fill', 'none');
      attr(
        path1,
        'd',
        'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 24 24');
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path0);
      append(svg, path1);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$t($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class Lock_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$t, create_fragment$t, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/journey/callbacks/kba/kba-create.svelte generated by Svelte v3.55.0 */

function create_if_block$a(ctx) {
  let input;
  let current;

  input = new /*Input*/ ctx[7]({
    props: {
      isFirstInvalidInput: false,
      key: `kba-custom-question-${/*callbackMetadata*/ ctx[0]?.idx}`,
      label: interpolate('customSecurityQuestion'),
      showMessage: false,
      message: interpolate('inputRequiredError'),
      onChange: /*setQuestion*/ ctx[11],
      type: 'text',
    },
  });

  return {
    c() {
      create_component(input.$$.fragment);
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const input_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        input_changes.key = `kba-custom-question-${/*callbackMetadata*/ ctx[0]?.idx}`;
      input.$set(input_changes);
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
    },
  };
}

function create_fragment$s(ctx) {
  let fieldset;
  let legend;
  let t0;
  let t1;
  let h2;
  let t2;
  let t3;
  let span;
  let lockicon;
  let t4;
  let select;
  let t5;
  let t6;
  let input;
  let updating_value;
  let current;
  t0 = new Locale_strings({ props: { key: 'securityQuestions' } });

  t2 = new Locale_strings({
    props: { key: 'securityQuestionsPrompt' },
  });

  lockicon = new Lock_icon({ props: { size: '18' } });

  select = new Floating_label$1({
    props: {
      isFirstInvalidInput: false,
      key: /*inputNameQuestion*/ ctx[4],
      label: /*prompt*/ ctx[1],
      onChange: /*selectQuestion*/ ctx[10],
      options: /*questions*/ ctx[2],
    },
  });

  let if_block = /*displayCustomQuestionInput*/ ctx[3] && create_if_block$a(ctx);

  function input_value_binding(value) {
    /*input_value_binding*/ ctx[20](value);
  }

  let input_props = {
    isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
    key: /*inputNameAnswer*/ ctx[5] || `kba-answer-${/*callbackMetadata*/ ctx[0]?.idx}`,
    label: interpolate('securityAnswer'),
    showMessage: false,
    message: interpolate('inputRequiredError'),
    onChange: /*setAnswer*/ ctx[9],
    type: 'text',
  };

  if (/*$value*/ ctx[6] !== void 0) {
    input_props.value = /*$value*/ ctx[6];
  }

  input = new /*Input*/ ctx[7]({ props: input_props });
  binding_callbacks.push(() => bind(input, 'value', input_value_binding, /*$value*/ ctx[6]));

  return {
    c() {
      fieldset = element('fieldset');
      legend = element('legend');
      create_component(t0.$$.fragment);
      t1 = space();
      h2 = element('h2');
      create_component(t2.$$.fragment);
      t3 = space();
      span = element('span');
      create_component(lockicon.$$.fragment);
      t4 = space();
      create_component(select.$$.fragment);
      t5 = space();
      if (if_block) if_block.c();
      t6 = space();
      create_component(input.$$.fragment);
      attr(legend, 'class', 'tw_sr-only');
      attr(h2, 'class', 'tw_secondary-header dark:tw_secondary-header_dark');
      attr(span, 'class', 'tw_kba-lock-icon dark:tw_kba-lock-icon_dark');
      attr(fieldset, 'class', 'tw_kba-fieldset tw_input-spacing dark:tw_kba-fieldset_dark');
    },
    m(target, anchor) {
      insert(target, fieldset, anchor);
      append(fieldset, legend);
      mount_component(t0, legend, null);
      append(fieldset, t1);
      append(fieldset, h2);
      mount_component(t2, h2, null);
      append(fieldset, t3);
      append(fieldset, span);
      mount_component(lockicon, span, null);
      append(fieldset, t4);
      mount_component(select, fieldset, null);
      append(fieldset, t5);
      if (if_block) if_block.m(fieldset, null);
      append(fieldset, t6);
      mount_component(input, fieldset, null);
      current = true;
    },
    p(ctx, [dirty]) {
      const select_changes = {};
      if (dirty & /*inputNameQuestion*/ 16) select_changes.key = /*inputNameQuestion*/ ctx[4];
      if (dirty & /*prompt*/ 2) select_changes.label = /*prompt*/ ctx[1];
      if (dirty & /*questions*/ 4) select_changes.options = /*questions*/ ctx[2];
      select.$set(select_changes);

      if (/*displayCustomQuestionInput*/ ctx[3]) {
        if (if_block) {
          if_block.p(ctx, dirty);

          if (dirty & /*displayCustomQuestionInput*/ 8) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$a(ctx);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(fieldset, t6);
        }
      } else if (if_block) {
        group_outros();

        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });

        check_outros();
      }

      const input_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        input_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*inputNameAnswer, callbackMetadata*/ 33)
        input_changes.key =
          /*inputNameAnswer*/ ctx[5] || `kba-answer-${/*callbackMetadata*/ ctx[0]?.idx}`;

      if (!updating_value && dirty & /*$value*/ 64) {
        updating_value = true;
        input_changes.value = /*$value*/ ctx[6];
        add_flush_callback(() => (updating_value = false));
      }

      input.$set(input_changes);
    },
    i(local) {
      if (current) return;
      transition_in(t0.$$.fragment, local);
      transition_in(t2.$$.fragment, local);
      transition_in(lockicon.$$.fragment, local);
      transition_in(select.$$.fragment, local);
      transition_in(if_block);
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t0.$$.fragment, local);
      transition_out(t2.$$.fragment, local);
      transition_out(lockicon.$$.fragment, local);
      transition_out(select.$$.fragment, local);
      transition_out(if_block);
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(fieldset);
      destroy_component(t0);
      destroy_component(t2);
      destroy_component(lockicon);
      destroy_component(select);
      if (if_block) if_block.d();
      destroy_component(input);
    },
  };
}

function instance$s($$self, $$props, $$invalidate) {
  let $value;
  const selfSubmitFunction = null;
  const stepMetadata = null;
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { style = {} } = $$props;
  const Input = style.labels === 'stacked' ? Stacked_label : Floating_label;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  let customQuestionIndex = null;

  let displayCustomQuestionInput = false;
  let inputArr;
  let inputName;
  let inputNameQuestion;
  let inputNameAnswer;
  let prompt;
  let questions;
  let shouldAllowCustomQuestion;
  let value = writable('');
  component_subscribe($$self, value, (value) => $$invalidate(6, ($value = value)));

  /**
   * `getOutputValue` throws if it doesn't find this property. There _may_ be a context
   * in which the property doesn't exist, so I'm going to wrap it in a try-catch, just
   * in case
   */
  try {
    shouldAllowCustomQuestion = callback.getOutputValue('allowUserDefinedQuestions');
  } catch (err) {
    console.error(
      '`allowUserDefinedQuestions` property is missing in callback `KbaCreateCallback`',
    );
  }

  /**
   * @function setAnswer - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setAnswer(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setAnswer(event.target.value);
  }

  /**
   * @function setQuestion - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function selectQuestion(event) {
    const selectValue = event.target.value;

    if (selectValue === customQuestionIndex) {
      $$invalidate(3, (displayCustomQuestionInput = true));
      value.set('');
      callback.setAnswer('');
    } else {
      $$invalidate(3, (displayCustomQuestionInput = false));

      /** ***********************************************************************
       * SDK INTEGRATION POINT
       * Summary: SDK callback methods for setting values
       * ------------------------------------------------------------------------
       * Details: Each callback is wrapped by the SDK to provide helper methods
       * for writing values to the callbacks received from AM
       *********************************************************************** */
      callback.setQuestion(selectValue);
    }
  }

  /**
   * @function setQuestion - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setQuestion(event) {
    const inputValue = event.target.value;

    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setQuestion(inputValue);
  }

  function input_value_binding(value$1) {
    $value = value$1;
    value.set($value);
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(14, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(0, (callbackMetadata = $$props.callbackMetadata));
    if ('style' in $$props) $$invalidate(15, (style = $$props.style));
  };

  $$self.$$.update = () => {
    if (
      $$self.$$.dirty &
      /*callback, callbackMetadata, inputName, inputArr, questions, prompt, shouldAllowCustomQuestion, customQuestionIndex*/ 999431
    ) {
      {
        $$invalidate(17, (inputArr = callback?.payload?.input));
        $$invalidate(
          18,
          (inputName = callback?.payload?.input?.[0].name || `kba-${callbackMetadata?.idx}`),
        );
        $$invalidate(4, (inputNameQuestion = inputName));
        $$invalidate(5, (inputNameAnswer = Array.isArray(inputArr) && inputArr[1].name));
        $$invalidate(1, (prompt = callback.getPrompt()));
        $$invalidate(
          2,
          (questions = callback
            .getPredefinedQuestions()
            ?.map((label, idx) => ({ text: label, value: `${idx}` }))),
        );

        /**
         * `getOutputValue` throws if it doesn't find this property. There _may_ be a context
         * in which the property doesn't exist, so I'm going to wrap it in a try-catch, just
         * in case
         */
        try {
          $$invalidate(
            19,
            (shouldAllowCustomQuestion = callback.getOutputValue('allowUserDefinedQuestions')),
          );
        } catch (err) {
          console.error(
            '`allowUserDefinedQuestions` property is missing in callback `KbaCreateCallback`',
          );
        }

        questions.unshift({ text: prompt, value: '' });

        /**
         * Uncomment the below `setQuestion` if you remove the `unshift` above.
         * The `unshift` defaults the UI to a non-question, but if you remove it,
         * you will default to a question, which needs to be set in the callback.
         *
         * callback.setQuestion(questions[0].text);
         */
        if (shouldAllowCustomQuestion) {
          $$invalidate(16, (customQuestionIndex = `${questions.length - 1}`));

          questions.push({
            text: interpolate('provideCustomQuestion'),
            value: customQuestionIndex,
          });
        }
      }
    }
  };

  return [
    callbackMetadata,
    prompt,
    questions,
    displayCustomQuestionInput,
    inputNameQuestion,
    inputNameAnswer,
    $value,
    Input,
    value,
    setAnswer,
    selectQuestion,
    setQuestion,
    selfSubmitFunction,
    stepMetadata,
    callback,
    style,
    customQuestionIndex,
    inputArr,
    inputName,
    shouldAllowCustomQuestion,
    input_value_binding,
  ];
}

class Kba_create extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$s, create_fragment$s, safe_not_equal, {
      selfSubmitFunction: 12,
      stepMetadata: 13,
      callback: 14,
      callbackMetadata: 0,
      style: 15,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[12];
  }

  get stepMetadata() {
    return this.$$.ctx[13];
  }
}

/* src/lib/journey/callbacks/username/name.svelte generated by Svelte v3.55.0 */

function create_fragment$r(ctx) {
  let input;
  let current;

  input = new /*Input*/ ctx[5]({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      key: /*inputName*/ ctx[2],
      label: interpolate(textToKey(/*callbackType*/ ctx[1]), null, /*textInputLabel*/ ctx[3]),
      onChange: /*setValue*/ ctx[6],
      type: 'text',
      showMessage: false,
      value: typeof (/*value*/ ctx[4]) === 'string' ? /*value*/ ctx[4] : '',
    },
  });

  return {
    c() {
      create_component(input.$$.fragment);
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        input_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*inputName*/ 4) input_changes.key = /*inputName*/ ctx[2];
      if (dirty & /*callbackType, textInputLabel*/ 10)
        input_changes.label = interpolate(
          textToKey(/*callbackType*/ ctx[1]),
          null,
          /*textInputLabel*/ ctx[3],
        );

      if (dirty & /*value*/ 16)
        input_changes.value = typeof (/*value*/ ctx[4]) === 'string' ? /*value*/ ctx[4] : '';

      input.$set(input_changes);
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
    },
  };
}

function instance$r($$self, $$props, $$invalidate) {
  const selfSubmitFunction = null;
  const stepMetadata = null;
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { style = {} } = $$props;
  const Input = style.labels === 'stacked' ? Stacked_label : Floating_label;
  let callbackType;
  let inputName;
  let textInputLabel;
  let value;

  function setValue(event) {
    callback.setInputValue(event.target.value);
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(9, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(0, (callbackMetadata = $$props.callbackMetadata));
    if ('style' in $$props) $$invalidate(10, (style = $$props.style));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata*/ 513) {
      {
        $$invalidate(1, (callbackType = callback.getType()));
        $$invalidate(
          2,
          (inputName = callback?.payload?.input?.[0].name || `name-${callbackMetadata?.idx}`),
        );
        $$invalidate(3, (textInputLabel = callback.getPrompt()));
        $$invalidate(4, (value = callback?.getInputValue()));
      }
    }
  };

  return [
    callbackMetadata,
    callbackType,
    inputName,
    textInputLabel,
    value,
    Input,
    setValue,
    selfSubmitFunction,
    stepMetadata,
    callback,
    style,
  ];
}

class Name extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$r, create_fragment$r, safe_not_equal, {
      selfSubmitFunction: 7,
      stepMetadata: 8,
      callback: 9,
      callbackMetadata: 0,
      style: 10,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[7];
  }

  get stepMetadata() {
    return this.$$.ctx[8];
  }
}

/* src/lib/components/icons/eye-icon.svelte generated by Svelte v3.55.0 */

function create_else_block$3(ctx) {
  let svg;
  let path0;
  let path1;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[4].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

  return {
    c() {
      svg = svg_element('svg');
      path0 = svg_element('path');
      path1 = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(path0, 'd', 'M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z');
      attr(path0, 'fill', 'none');
      attr(
        path1,
        'd',
        'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 24 24');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path0);
      append(svg, path1);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[3],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

// (6:0) {#if !visible}
function create_if_block$9(ctx) {
  let svg;
  let path0;
  let path1;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[4].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

  return {
    c() {
      svg = svg_element('svg');
      path0 = svg_element('path');
      path1 = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(path0, 'd', 'M0 0h24v24H0z');
      attr(path0, 'fill', 'none');
      attr(
        path1,
        'd',
        'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 24 24');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path0);
      append(svg, path1);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[3],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function create_fragment$q(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$9, create_else_block$3];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (!(/*visible*/ ctx[2])) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$q($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;
  let { visible = false } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('visible' in $$props) $$invalidate(2, (visible = $$props.visible));
    if ('$$scope' in $$props) $$invalidate(3, ($$scope = $$props.$$scope));
  };

  return [classes, size, visible, $$scope, slots];
}

class Eye_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$q, create_fragment$q, safe_not_equal, {
      classes: 0,
      size: 1,
      visible: 2,
    });
  }
}

/* src/lib/journey/callbacks/password/confirm-input.svelte generated by Svelte v3.55.0 */

function create_default_slot_1$7(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[12].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

  return {
    c() {
      if (default_slot) default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8192)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[13],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[13])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[13], dirty, null),
            null,
          );
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot) default_slot.d(detaching);
    },
  };
}

// (47:4) <EyeIcon classes="tw_password-icon dark:tw_password-icon_dark" visible={isVisible}       >
function create_default_slot$e(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'showPassword' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (41:2)
function create_input_button_slot$1(ctx) {
  let button;
  let eyeicon;
  let current;
  let mounted;
  let dispose;

  eyeicon = new Eye_icon({
    props: {
      classes: 'tw_password-icon dark:tw_password-icon_dark',
      visible: /*isVisible*/ ctx[6],
      $$slots: { default: [create_default_slot$e] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      button = element('button');
      create_component(eyeicon.$$.fragment);
      attr(
        button,
        'class',
        `tw_password-button dark:tw_password-button_dark tw_focusable-element tw_input-base dark:tw_input-base_dark`,
      );
      attr(button, 'slot', 'input-button');
      attr(button, 'type', 'button');
    },
    m(target, anchor) {
      insert(target, button, anchor);
      mount_component(eyeicon, button, null);
      current = true;

      if (!mounted) {
        dispose = listen(button, 'click', /*toggleVisibility*/ ctx[10]);
        mounted = true;
      }
    },
    p(ctx, dirty) {
      const eyeicon_changes = {};
      if (dirty & /*isVisible*/ 64) eyeicon_changes.visible = /*isVisible*/ ctx[6];

      if (dirty & /*$$scope*/ 8192) {
        eyeicon_changes.$$scope = { dirty, ctx };
      }

      eyeicon.$set(eyeicon_changes);
    },
    i(local) {
      if (current) return;
      transition_in(eyeicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(eyeicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(button);
      destroy_component(eyeicon);
      mounted = false;
      dispose();
    },
  };
}

function create_fragment$p(ctx) {
  let input;
  let current;

  input = new /*Input*/ ctx[8]({
    props: {
      forceValidityFailure: /*forceValidityFailure*/ ctx[0],
      isFirstInvalidInput: false,
      hasRightIcon: true,
      key: `${/*key*/ ctx[1]}-confirm`,
      label: interpolate('confirmPassword', null, 'Confirm Password'),
      message: /*isInvalid*/ ctx[3]
        ? interpolate('passwordConfirmationError', null, 'Passwords do not match')
        : undefined,
      onChange: /*onChange*/ ctx[2],
      isInvalid: /*isInvalid*/ ctx[3],
      isRequired: /*isRequired*/ ctx[4],
      showMessage: /*showMessage*/ ctx[5],
      type: /*type*/ ctx[7],
      value: typeof (/*value*/ ctx[9]) === 'string' ? /*value*/ ctx[9] : '',
      $$slots: {
        'input-button': [create_input_button_slot$1],
        default: [create_default_slot_1$7],
      },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(input.$$.fragment);
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*forceValidityFailure*/ 1)
        input_changes.forceValidityFailure = /*forceValidityFailure*/ ctx[0];
      if (dirty & /*key*/ 2) input_changes.key = `${/*key*/ ctx[1]}-confirm`;

      if (dirty & /*isInvalid*/ 8)
        input_changes.message = /*isInvalid*/ ctx[3]
          ? interpolate('passwordConfirmationError', null, 'Passwords do not match')
          : undefined;

      if (dirty & /*onChange*/ 4) input_changes.onChange = /*onChange*/ ctx[2];
      if (dirty & /*isInvalid*/ 8) input_changes.isInvalid = /*isInvalid*/ ctx[3];
      if (dirty & /*isRequired*/ 16) input_changes.isRequired = /*isRequired*/ ctx[4];
      if (dirty & /*showMessage*/ 32) input_changes.showMessage = /*showMessage*/ ctx[5];
      if (dirty & /*type*/ 128) input_changes.type = /*type*/ ctx[7];

      if (dirty & /*$$scope, isVisible*/ 8256) {
        input_changes.$$scope = { dirty, ctx };
      }

      input.$set(input_changes);
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
    },
  };
}

function instance$p($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { forceValidityFailure = false } = $$props;
  let { key } = $$props;
  let { onChange } = $$props;
  let { isInvalid = false } = $$props;
  let { isRequired = true } = $$props;
  let { style = {} } = $$props;
  const Input = style.labels === 'stacked' ? Stacked_label : Floating_label;
  let { showMessage = undefined } = $$props;
  let isVisible = false;
  let type = 'password';
  let value;

  /**
   * @function toggleVisibility - toggles the password from masked to plaintext
   */
  function toggleVisibility() {
    $$invalidate(6, (isVisible = !isVisible));
    $$invalidate(7, (type = isVisible ? 'text' : 'password'));
  }

  $$self.$$set = ($$props) => {
    if ('forceValidityFailure' in $$props)
      $$invalidate(0, (forceValidityFailure = $$props.forceValidityFailure));
    if ('key' in $$props) $$invalidate(1, (key = $$props.key));
    if ('onChange' in $$props) $$invalidate(2, (onChange = $$props.onChange));
    if ('isInvalid' in $$props) $$invalidate(3, (isInvalid = $$props.isInvalid));
    if ('isRequired' in $$props) $$invalidate(4, (isRequired = $$props.isRequired));
    if ('style' in $$props) $$invalidate(11, (style = $$props.style));
    if ('showMessage' in $$props) $$invalidate(5, (showMessage = $$props.showMessage));
    if ('$$scope' in $$props) $$invalidate(13, ($$scope = $$props.$$scope));
  };

  return [
    forceValidityFailure,
    key,
    onChange,
    isInvalid,
    isRequired,
    showMessage,
    isVisible,
    type,
    Input,
    value,
    toggleVisibility,
    style,
    slots,
    $$scope,
  ];
}

class Confirm_input extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$p, create_fragment$p, safe_not_equal, {
      forceValidityFailure: 0,
      key: 1,
      onChange: 2,
      isInvalid: 3,
      isRequired: 4,
      style: 11,
      showMessage: 5,
    });
  }
}

/* src/lib/journey/callbacks/password/base.svelte generated by Svelte v3.55.0 */

function create_default_slot_1$6(ctx) {
  let current;
  const default_slot_template = /*#slots*/ ctx[19].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[20], null);

  return {
    c() {
      if (default_slot) default_slot.c();
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }

      current = true;
    },
    p(ctx, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 1048576)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[20],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[20])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[20], dirty, null),
            null,
          );
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot) default_slot.d(detaching);
    },
  };
}

// (82:4) <EyeIcon classes="tw_password-icon dark:tw_password-icon_dark" visible={isVisible}       >
function create_default_slot$d(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'showPassword' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (76:2)
function create_input_button_slot(ctx) {
  let button;
  let eyeicon;
  let current;
  let mounted;
  let dispose;

  eyeicon = new Eye_icon({
    props: {
      classes: 'tw_password-icon dark:tw_password-icon_dark',
      visible: /*isVisible*/ ctx[10],
      $$slots: { default: [create_default_slot$d] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      button = element('button');
      create_component(eyeicon.$$.fragment);
      attr(
        button,
        'class',
        `tw_password-button dark:tw_password-button_dark tw_focusable-element tw_input-base dark:tw_input-base_dark`,
      );
      attr(button, 'slot', 'input-button');
      attr(button, 'type', 'button');
    },
    m(target, anchor) {
      insert(target, button, anchor);
      mount_component(eyeicon, button, null);
      current = true;

      if (!mounted) {
        dispose = listen(button, 'click', /*toggleVisibility*/ ctx[16]);
        mounted = true;
      }
    },
    p(ctx, dirty) {
      const eyeicon_changes = {};
      if (dirty & /*isVisible*/ 1024) eyeicon_changes.visible = /*isVisible*/ ctx[10];

      if (dirty & /*$$scope*/ 1048576) {
        eyeicon_changes.$$scope = { dirty, ctx };
      }

      eyeicon.$set(eyeicon_changes);
    },
    i(local) {
      if (current) return;
      transition_in(eyeicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(eyeicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(button);
      destroy_component(eyeicon);
      mounted = false;
      dispose();
    },
  };
}

// (89:0) {#if callbackMetadata?.platform?.confirmPassword}
function create_if_block$8(ctx) {
  let confirminput;
  let current;

  confirminput = new Confirm_input({
    props: {
      forceValidityFailure: /*doPasswordsMatch*/ ctx[9] === false,
      isInvalid: /*doPasswordsMatch*/ ctx[9] === false,
      key: /*key*/ ctx[0],
      onChange: /*confirmInput*/ ctx[14],
      showMessage: /*doPasswordsMatch*/ ctx[9] === false,
      style: /*style*/ ctx[4],
    },
  });

  return {
    c() {
      create_component(confirminput.$$.fragment);
    },
    m(target, anchor) {
      mount_component(confirminput, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const confirminput_changes = {};
      if (dirty & /*doPasswordsMatch*/ 512)
        confirminput_changes.forceValidityFailure = /*doPasswordsMatch*/ ctx[9] === false;
      if (dirty & /*doPasswordsMatch*/ 512)
        confirminput_changes.isInvalid = /*doPasswordsMatch*/ ctx[9] === false;
      if (dirty & /*key*/ 1) confirminput_changes.key = /*key*/ ctx[0];
      if (dirty & /*doPasswordsMatch*/ 512)
        confirminput_changes.showMessage = /*doPasswordsMatch*/ ctx[9] === false;
      if (dirty & /*style*/ 16) confirminput_changes.style = /*style*/ ctx[4];
      confirminput.$set(confirminput_changes);
    },
    i(local) {
      if (current) return;
      transition_in(confirminput.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(confirminput.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(confirminput, detaching);
    },
  };
}

function create_fragment$o(ctx) {
  let input;
  let t;
  let if_block_anchor;
  let current;

  input = new /*Input*/ ctx[13]({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[1]?.derived.isFirstInvalidInput || false,
      hasRightIcon: true,
      key: /*key*/ ctx[0],
      label: interpolate(textToKey(/*callbackType*/ ctx[8]), null, /*textInputLabel*/ ctx[11]),
      message:
        /*validationFailure*/ ctx[6] ||
        /*isRequired*/ (ctx[3] ? interpolate('inputRequiredError') : undefined),
      onChange: /*setValue*/ ctx[15],
      isInvalid: /*isInvalid*/ ctx[2],
      isRequired: /*isRequired*/ ctx[3],
      showMessage: /*showMessage*/ ctx[5],
      type: /*type*/ ctx[12],
      value: typeof (/*value*/ ctx[7]) === 'string' ? /*value*/ ctx[7] : '',
      $$slots: {
        'input-button': [create_input_button_slot],
        default: [create_default_slot_1$6],
      },
      $$scope: { ctx },
    },
  });

  let if_block = /*callbackMetadata*/ ctx[1]?.platform?.confirmPassword && create_if_block$8(ctx);

  return {
    c() {
      create_component(input.$$.fragment);
      t = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      insert(target, t, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*callbackMetadata*/ 2)
        input_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[1]?.derived.isFirstInvalidInput || false;
      if (dirty & /*key*/ 1) input_changes.key = /*key*/ ctx[0];
      if (dirty & /*callbackType, textInputLabel*/ 2304)
        input_changes.label = interpolate(
          textToKey(/*callbackType*/ ctx[8]),
          null,
          /*textInputLabel*/ ctx[11],
        );

      if (dirty & /*validationFailure, isRequired*/ 72)
        input_changes.message =
          /*validationFailure*/ ctx[6] ||
          /*isRequired*/ (ctx[3] ? interpolate('inputRequiredError') : undefined);

      if (dirty & /*isInvalid*/ 4) input_changes.isInvalid = /*isInvalid*/ ctx[2];
      if (dirty & /*isRequired*/ 8) input_changes.isRequired = /*isRequired*/ ctx[3];
      if (dirty & /*showMessage*/ 32) input_changes.showMessage = /*showMessage*/ ctx[5];
      if (dirty & /*type*/ 4096) input_changes.type = /*type*/ ctx[12];

      if (dirty & /*value*/ 128)
        input_changes.value = typeof (/*value*/ ctx[7]) === 'string' ? /*value*/ ctx[7] : '';

      if (dirty & /*$$scope, isVisible*/ 1049600) {
        input_changes.$$scope = { dirty, ctx };
      }

      input.$set(input_changes);

      if (/*callbackMetadata*/ ctx[1]?.platform?.confirmPassword) {
        if (if_block) {
          if_block.p(ctx, dirty);

          if (dirty & /*callbackMetadata*/ 2) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$8(ctx);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();

        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });

        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
      if (detaching) detach(t);
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$o($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { key } = $$props;
  let { isInvalid = false } = $$props;
  let { isRequired = false } = $$props;
  let { style = {} } = $$props;
  const Input = style.labels === 'stacked' ? Stacked_label : Floating_label;
  let { showMessage = undefined } = $$props;
  let { validationFailure = '' } = $$props;
  let confirmValue;
  let callbackType;
  let doPasswordsMatch;
  let isVisible = false;
  let textInputLabel;
  let type = 'password';
  let value;

  /**
   * @function confirmInput - ensures the second password input matches the first
   * @param event
   */
  function confirmInput(event) {
    $$invalidate(18, (confirmValue = event.target?.value));
  }

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    $$invalidate(7, (value = event.target.value));

    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(value);
  }

  /**
   * @function toggleVisibility - toggles the password from masked to plaintext
   */
  function toggleVisibility() {
    $$invalidate(10, (isVisible = !isVisible));
    $$invalidate(12, (type = isVisible ? 'text' : 'password'));
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(17, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(1, (callbackMetadata = $$props.callbackMetadata));
    if ('key' in $$props) $$invalidate(0, (key = $$props.key));
    if ('isInvalid' in $$props) $$invalidate(2, (isInvalid = $$props.isInvalid));
    if ('isRequired' in $$props) $$invalidate(3, (isRequired = $$props.isRequired));
    if ('style' in $$props) $$invalidate(4, (style = $$props.style));
    if ('showMessage' in $$props) $$invalidate(5, (showMessage = $$props.showMessage));
    if ('validationFailure' in $$props)
      $$invalidate(6, (validationFailure = $$props.validationFailure));
    if ('$$scope' in $$props) $$invalidate(20, ($$scope = $$props.$$scope));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata, confirmValue, value*/ 393346) {
      {
        $$invalidate(8, (callbackType = callback.getType()));
        $$invalidate(
          0,
          (key = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`),
        );
        $$invalidate(11, (textInputLabel = callback.getPrompt()));
        $$invalidate(7, (value = callback?.getInputValue()));

        // Only assign a boolean if the confirm input has an actual value
        $$invalidate(
          9,
          (doPasswordsMatch = confirmValue !== undefined ? confirmValue === value : undefined),
        );
      }
    }
  };

  return [
    key,
    callbackMetadata,
    isInvalid,
    isRequired,
    style,
    showMessage,
    validationFailure,
    value,
    callbackType,
    doPasswordsMatch,
    isVisible,
    textInputLabel,
    type,
    Input,
    confirmInput,
    setValue,
    toggleVisibility,
    callback,
    confirmValue,
    slots,
    $$scope,
  ];
}

class Base extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$o, create_fragment$o, safe_not_equal, {
      callback: 17,
      callbackMetadata: 1,
      key: 0,
      isInvalid: 2,
      isRequired: 3,
      style: 4,
      showMessage: 5,
      validationFailure: 6,
    });
  }
}

/* src/lib/journey/callbacks/password/password.svelte generated by Svelte v3.55.0 */

function create_fragment$n(ctx) {
  let base;
  let current;

  base = new Base({
    props: {
      callback: /*callback*/ ctx[0],
      callbackMetadata: /*callbackMetadata*/ ctx[1],
      style: /*style*/ ctx[2],
      key: /*inputName*/ ctx[3],
    },
  });

  return {
    c() {
      create_component(base.$$.fragment);
    },
    m(target, anchor) {
      mount_component(base, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const base_changes = {};
      if (dirty & /*callback*/ 1) base_changes.callback = /*callback*/ ctx[0];
      if (dirty & /*callbackMetadata*/ 2)
        base_changes.callbackMetadata = /*callbackMetadata*/ ctx[1];
      if (dirty & /*style*/ 4) base_changes.style = /*style*/ ctx[2];
      if (dirty & /*inputName*/ 8) base_changes.key = /*inputName*/ ctx[3];
      base.$set(base_changes);
    },
    i(local) {
      if (current) return;
      transition_in(base.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(base.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(base, detaching);
    },
  };
}

function instance$n($$self, $$props, $$invalidate) {
  const selfSubmitFunction = null;
  const stepMetadata = null;
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { style = {} } = $$props;
  let inputName;

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(0, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(1, (callbackMetadata = $$props.callbackMetadata));
    if ('style' in $$props) $$invalidate(2, (style = $$props.style));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata*/ 3) {
      {
        $$invalidate(0, callback), $$invalidate(1, callbackMetadata);
        $$invalidate(
          3,
          (inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`),
        );
      }
    }
  };

  return [callback, callbackMetadata, style, inputName, selfSubmitFunction, stepMetadata];
}

class Password extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$n, create_fragment$n, safe_not_equal, {
      selfSubmitFunction: 4,
      stepMetadata: 5,
      callback: 0,
      callbackMetadata: 1,
      style: 2,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[4];
  }

  get stepMetadata() {
    return this.$$.ctx[5];
  }
}

/* src/lib/components/primitives/text/text.svelte generated by Svelte v3.55.0 */

function create_fragment$m(ctx) {
  let p;
  let p_class_value;
  let current;
  const default_slot_template = /*#slots*/ ctx[2].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

  return {
    c() {
      p = element('p');
      if (default_slot) default_slot.c();
      attr(
        p,
        'class',
        (p_class_value = `${
          /*classes*/ ctx[0]
        } tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing`),
      );
    },
    m(target, anchor) {
      insert(target, p, anchor);

      if (default_slot) {
        default_slot.m(p, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[1],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*classes*/ 1 &&
          p_class_value !==
            (p_class_value = `${
              /*classes*/ ctx[0]
            } tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing`))
      ) {
        attr(p, 'class', p_class_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(p);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$m($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('$$scope' in $$props) $$invalidate(1, ($$scope = $$props.$$scope));
  };

  return [classes, $$scope, slots];
}

class Text extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$m, create_fragment$m, safe_not_equal, { classes: 0 });
  }
}

/* src/lib/journey/callbacks/polling-wait/polling-wait.svelte generated by Svelte v3.55.0 */

function create_default_slot$c(ctx) {
  let t;

  return {
    c() {
      t = text(/*message*/ ctx[0]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*message*/ 1) set_data(t, /*message*/ ctx[0]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$l(ctx) {
  let div;
  let spinner;
  let t;
  let text_1;
  let current;

  spinner = new Spinner({
    props: {
      colorClass: 'tw_text-primary-light',
      layoutClasses: 'tw_h-24 tw_mb-6 tw_w-24',
    },
  });

  text_1 = new Text({
    props: {
      $$slots: { default: [create_default_slot$c] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      div = element('div');
      create_component(spinner.$$.fragment);
      t = space();
      create_component(text_1.$$.fragment);
      attr(div, 'class', 'tw_text-center');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(spinner, div, null);
      append(div, t);
      mount_component(text_1, div, null);
      current = true;
    },
    p(ctx, [dirty]) {
      const text_1_changes = {};

      if (dirty & /*$$scope, message*/ 129) {
        text_1_changes.$$scope = { dirty, ctx };
      }

      text_1.$set(text_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(spinner.$$.fragment, local);
      transition_in(text_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      transition_out(text_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(spinner);
      destroy_component(text_1);
    },
  };
}

function instance$l($$self, $$props, $$invalidate) {
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { selfSubmitFunction = null } = $$props;
  let message;
  let time;

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(1, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(2, (callbackMetadata = $$props.callbackMetadata));
    if ('selfSubmitFunction' in $$props)
      $$invalidate(5, (selfSubmitFunction = $$props.selfSubmitFunction));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata, selfSubmitFunction, time*/ 102) {
      {
        (($$invalidate(1, callback), $$invalidate(2, callbackMetadata)),
        $$invalidate(5, selfSubmitFunction)),
          $$invalidate(6, time);
        $$invalidate(0, (message = callback.getMessage()));
        $$invalidate(6, (time = callback.getWaitTime()));

        setTimeout(() => {
          if (callbackMetadata) {
            $$invalidate(
              2,
              (callbackMetadata.derived.isReadyForSubmission = true),
              callbackMetadata,
            );
          }

          selfSubmitFunction && selfSubmitFunction();
        }, time);
      }
    }
  };

  return [message, callback, callbackMetadata, stepMetadata, style, selfSubmitFunction, time];
}

class Polling_wait extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$l, create_fragment$l, safe_not_equal, {
      stepMetadata: 3,
      style: 4,
      callback: 1,
      callbackMetadata: 2,
      selfSubmitFunction: 5,
    });
  }

  get stepMetadata() {
    return this.$$.ctx[3];
  }

  get style() {
    return this.$$.ctx[4];
  }
}

/* src/lib/journey/callbacks/redirect/redirect.svelte generated by Svelte v3.55.0 */

function create_default_slot$b(ctx) {
  let t;

  return {
    c() {
      t = text(/*message*/ ctx[0]);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*message*/ 1) set_data(t, /*message*/ ctx[0]);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

function create_fragment$k(ctx) {
  let div;
  let spinner;
  let t;
  let text_1;
  let current;

  spinner = new Spinner({
    props: {
      colorClass: 'tw_text-primary-light',
      layoutClasses: 'tw_h-24 tw_mb-6 tw_w-24',
    },
  });

  text_1 = new Text({
    props: {
      $$slots: { default: [create_default_slot$b] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      div = element('div');
      create_component(spinner.$$.fragment);
      t = space();
      create_component(text_1.$$.fragment);
      attr(div, 'class', 'tw_text-center');
      attr(div, 'aria-live', 'assertive');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(spinner, div, null);
      append(div, t);
      mount_component(text_1, div, null);
      current = true;
    },
    p(ctx, [dirty]) {
      const text_1_changes = {};

      if (dirty & /*$$scope, message*/ 65) {
        text_1_changes.$$scope = { dirty, ctx };
      }

      text_1.$set(text_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(spinner.$$.fragment, local);
      transition_in(text_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      transition_out(text_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(spinner);
      destroy_component(text_1);
    },
  };
}

function instance$k($$self, $$props, $$invalidate) {
  const callbackMetadata = null;
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  let message;

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(5, (callback = $$props.callback));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback*/ 32) {
      {
        $$invalidate(
          0,
          (message = `${interpolate('redirectingTo')} ${
            new URL(callback.getRedirectUrl()).hostname
          }`),
        );
      }
    }
  };

  return [message, callbackMetadata, selfSubmitFunction, stepMetadata, style, callback];
}

class Redirect extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$k, create_fragment$k, safe_not_equal, {
      callbackMetadata: 1,
      selfSubmitFunction: 2,
      stepMetadata: 3,
      style: 4,
      callback: 5,
    });
  }

  get callbackMetadata() {
    return this.$$.ctx[1];
  }

  get selfSubmitFunction() {
    return this.$$.ctx[2];
  }

  get stepMetadata() {
    return this.$$.ctx[3];
  }

  get style() {
    return this.$$.ctx[4];
  }
}

/* src/lib/components/icons/apple-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$j(ctx) {
  let svg;
  let path0;
  let path1;

  return {
    c() {
      svg = svg_element('svg');
      path0 = svg_element('path');
      path1 = svg_element('path');
      attr(
        path0,
        'd',
        'M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282Z',
      );
      attr(
        path1,
        'd',
        'M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516.024.034 1.52.087 2.475-1.258.955-1.345.762-2.391.728-2.43Zm3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422.212-2.189 1.675-2.789 1.698-2.854.023-.065-.597-.79-1.254-1.157a3.692 3.692 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56.244.729.625 1.924 1.273 2.796.576.984 1.34 1.667 1.659 1.899.319.232 1.219.386 1.843.067.502-.308 1.408-.485 1.766-.472.357.013 1.061.154 1.782.539.571.197 1.111.115 1.652-.105.541-.221 1.324-1.059 2.238-2.758.347-.79.505-1.217.473-1.282Z',
      );
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'fill', 'currentColor');
      attr(svg, 'viewBox', '0 0 16 18');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path0);
      append(svg, path1);
    },
    p(ctx, [dirty]) {
      if (dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }

      if (dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) detach(svg);
    },
  };
}

function instance$j($$self, $$props, $$invalidate) {
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
  };

  return [classes, size];
}

class Apple_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$j, create_fragment$j, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/components/icons/facebook-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$i(ctx) {
  let svg;
  let path;

  return {
    c() {
      svg = svg_element('svg');
      path = svg_element('path');
      attr(
        path,
        'd',
        'M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z',
      );
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'fill', 'currentColor');
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'viewBox', '0 0 18 18');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path);
    },
    p(ctx, [dirty]) {
      if (dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }

      if (dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) detach(svg);
    },
  };
}

function instance$i($$self, $$props, $$invalidate) {
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
  };

  return [classes, size];
}

class Facebook_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$i, create_fragment$i, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/components/icons/google-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$h(ctx) {
  let svg;
  let g;
  let path0;
  let path1;
  let path2;
  let path3;
  let path4;

  return {
    c() {
      svg = svg_element('svg');
      g = svg_element('g');
      path0 = svg_element('path');
      path1 = svg_element('path');
      path2 = svg_element('path');
      path3 = svg_element('path');
      path4 = svg_element('path');
      attr(path0, 'fill', '#EA4335');
      attr(
        path0,
        'd',
        'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z',
      );
      attr(path1, 'fill', '#4285F4');
      attr(
        path1,
        'd',
        'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z',
      );
      attr(path2, 'fill', '#FBBC05');
      attr(
        path2,
        'd',
        'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z',
      );
      attr(path3, 'fill', '#34A853');
      attr(
        path3,
        'd',
        'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z',
      );
      attr(path4, 'fill', 'none');
      attr(path4, 'd', 'M0 0h48v48H0z');
      attr(svg, 'version', '1.1');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 56 56');
      attr(svg, 'class', /*classes*/ ctx[0]);
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, g);
      append(g, path0);
      append(g, path1);
      append(g, path2);
      append(g, path3);
      append(g, path4);
    },
    p(ctx, [dirty]) {
      if (dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }

      if (dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }
    },
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) detach(svg);
    },
  };
}

function instance$h($$self, $$props, $$invalidate) {
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
  };

  return [classes, size];
}

class Google_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$h, create_fragment$h, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/journey/callbacks/select-idp/select-idp.svelte generated by Svelte v3.55.0 */

function get_each_context$4(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i];
  return child_ctx;
}

// (66:56)
function create_if_block_3$2(ctx) {
  let button;
  let current;

  function func_2() {
    return /*func_2*/ ctx[9](/*idp*/ ctx[10]);
  }

  button = new Button({
    props: {
      classes: 'tw_button-google dark:tw_button-google_dark',
      type: 'button',
      width: 'auto',
      onClick: func_2,
      $$slots: { default: [create_default_slot_4] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const button_changes = {};
      if (dirty & /*idps*/ 2) button_changes.onClick = func_2;

      if (dirty & /*$$scope, idps*/ 8194) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (55:58)
function create_if_block_2$5(ctx) {
  let button;
  let current;

  function func_1() {
    return /*func_1*/ ctx[8](/*idp*/ ctx[10]);
  }

  button = new Button({
    props: {
      classes: 'tw_button-facebook dark:tw_button-facebook_dark',
      type: 'button',
      width: 'auto',
      onClick: func_1,
      $$slots: { default: [create_default_slot_3] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const button_changes = {};
      if (dirty & /*idps*/ 2) button_changes.onClick = func_1;

      if (dirty & /*$$scope, idps*/ 8194) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (44:4) {#if idp.text.toUpperCase().includes('APPLE')}
function create_if_block_1$6(ctx) {
  let button;
  let current;

  function func() {
    return /*func*/ ctx[7](/*idp*/ ctx[10]);
  }

  button = new Button({
    props: {
      classes: 'tw_button-apple dark:tw_button-apple_dark',
      type: 'button',
      width: 'auto',
      onClick: func,
      $$slots: { default: [create_default_slot_2$3] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const button_changes = {};
      if (dirty & /*idps*/ 2) button_changes.onClick = func;

      if (dirty & /*$$scope, idps*/ 8194) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (67:6) <Button         classes="tw_button-google dark:tw_button-google_dark"         type="button"         width="auto"         onClick={() => setBtnValue(idp.value)}       >
function create_default_slot_4(ctx) {
  let googleicon;
  let t0;
  let t1;
  let t2;
  let t3_value = /*idp*/ ctx[10].text + '';
  let t3;
  let current;

  googleicon = new Google_icon({
    props: {
      classes: 'tw_inline-block tw_fill-current',
    },
  });

  t1 = new Locale_strings({ props: { key: 'continueWith' } });

  return {
    c() {
      create_component(googleicon.$$.fragment);
      t0 = space();
      create_component(t1.$$.fragment);
      t2 = space();
      t3 = text(t3_value);
    },
    m(target, anchor) {
      mount_component(googleicon, target, anchor);
      insert(target, t0, anchor);
      mount_component(t1, target, anchor);
      insert(target, t2, anchor);
      insert(target, t3, anchor);
      current = true;
    },
    p(ctx, dirty) {
      if ((!current || dirty & /*idps*/ 2) && t3_value !== (t3_value = /*idp*/ ctx[10].text + ''))
        set_data(t3, t3_value);
    },
    i(local) {
      if (current) return;
      transition_in(googleicon.$$.fragment, local);
      transition_in(t1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(googleicon.$$.fragment, local);
      transition_out(t1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(googleicon, detaching);
      if (detaching) detach(t0);
      destroy_component(t1, detaching);
      if (detaching) detach(t2);
      if (detaching) detach(t3);
    },
  };
}

// (56:6) <Button         classes="tw_button-facebook dark:tw_button-facebook_dark"         type="button"         width="auto"         onClick={() => setBtnValue(idp.value)}       >
function create_default_slot_3(ctx) {
  let facebookicon;
  let t0;
  let t1;
  let t2;
  let t3_value = /*idp*/ ctx[10].text + '';
  let t3;
  let current;

  facebookicon = new Facebook_icon({
    props: {
      classes: 'tw_inline-block tw_fill-current',
    },
  });

  t1 = new Locale_strings({ props: { key: 'continueWith' } });

  return {
    c() {
      create_component(facebookicon.$$.fragment);
      t0 = space();
      create_component(t1.$$.fragment);
      t2 = space();
      t3 = text(t3_value);
    },
    m(target, anchor) {
      mount_component(facebookicon, target, anchor);
      insert(target, t0, anchor);
      mount_component(t1, target, anchor);
      insert(target, t2, anchor);
      insert(target, t3, anchor);
      current = true;
    },
    p(ctx, dirty) {
      if ((!current || dirty & /*idps*/ 2) && t3_value !== (t3_value = /*idp*/ ctx[10].text + ''))
        set_data(t3, t3_value);
    },
    i(local) {
      if (current) return;
      transition_in(facebookicon.$$.fragment, local);
      transition_in(t1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(facebookicon.$$.fragment, local);
      transition_out(t1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(facebookicon, detaching);
      if (detaching) detach(t0);
      destroy_component(t1, detaching);
      if (detaching) detach(t2);
      if (detaching) detach(t3);
    },
  };
}

// (45:6) <Button         classes="tw_button-apple dark:tw_button-apple_dark"         type="button"         width="auto"         onClick={() => setBtnValue(idp.value)}       >
function create_default_slot_2$3(ctx) {
  let appleicon;
  let t0;
  let t1;
  let t2;
  let t3_value = /*idp*/ ctx[10].text + '';
  let t3;
  let current;

  appleicon = new Apple_icon({
    props: {
      classes: 'tw_inline-block tw_fill-current',
    },
  });

  t1 = new Locale_strings({ props: { key: 'continueWith' } });

  return {
    c() {
      create_component(appleicon.$$.fragment);
      t0 = space();
      create_component(t1.$$.fragment);
      t2 = space();
      t3 = text(t3_value);
    },
    m(target, anchor) {
      mount_component(appleicon, target, anchor);
      insert(target, t0, anchor);
      mount_component(t1, target, anchor);
      insert(target, t2, anchor);
      insert(target, t3, anchor);
      current = true;
    },
    p(ctx, dirty) {
      if ((!current || dirty & /*idps*/ 2) && t3_value !== (t3_value = /*idp*/ ctx[10].text + ''))
        set_data(t3, t3_value);
    },
    i(local) {
      if (current) return;
      transition_in(appleicon.$$.fragment, local);
      transition_in(t1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(appleicon.$$.fragment, local);
      transition_out(t1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(appleicon, detaching);
      if (detaching) detach(t0);
      destroy_component(t1, detaching);
      if (detaching) detach(t2);
      if (detaching) detach(t3);
    },
  };
}

// (43:2) <Grid num={1}>
function create_default_slot_1$5(ctx) {
  let show_if;
  let show_if_1;
  let show_if_2;
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block_1$6, create_if_block_2$5, create_if_block_3$2];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (dirty & /*idps*/ 2) show_if = null;
    if (dirty & /*idps*/ 2) show_if_1 = null;
    if (dirty & /*idps*/ 2) show_if_2 = null;
    if (show_if == null) show_if = !!(/*idp*/ ctx[10].text.toUpperCase().includes('APPLE'));
    if (show_if) return 0;
    if (show_if_1 == null) show_if_1 = !!(/*idp*/ ctx[10].text.toUpperCase().includes('FACEBOOK'));
    if (show_if_1) return 1;
    if (show_if_2 == null) show_if_2 = !!(/*idp*/ ctx[10].text.toUpperCase().includes('GOOGLE'));
    if (show_if_2) return 2;
    return -1;
  }

  if (~(current_block_type_index = select_block_type(ctx, -1))) {
    if_block = if_blocks[current_block_type_index] =
      if_block_creators[current_block_type_index](ctx);
  }

  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(target, anchor);
      }

      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx, dirty);

      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx, dirty);
        }
      } else {
        if (if_block) {
          group_outros();

          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });

          check_outros();
        }

        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];

          if (!if_block) {
            if_block = if_blocks[current_block_type_index] =
              if_block_creators[current_block_type_index](ctx);
            if_block.c();
          } else {
            if_block.p(ctx, dirty);
          }

          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        } else {
          if_block = null;
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d(detaching);
      }

      if (detaching) detach(if_block_anchor);
    },
  };
}

// (42:0) {#each idps as idp}
function create_each_block$4(ctx) {
  let grid;
  let current;

  grid = new Grid({
    props: {
      num: 1,
      $$slots: { default: [create_default_slot_1$5] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(grid.$$.fragment);
    },
    m(target, anchor) {
      mount_component(grid, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const grid_changes = {};

      if (dirty & /*$$scope, idps*/ 8194) {
        grid_changes.$$scope = { dirty, ctx };
      }

      grid.$set(grid_changes);
    },
    i(local) {
      if (current) return;
      transition_in(grid.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(grid.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(grid, detaching);
    },
  };
}

// (81:0) {#if stepMetadata && stepMetadata.derived.numOfCallbacks > 1}
function create_if_block$7(ctx) {
  let grid;
  let current;

  grid = new Grid({
    props: {
      num: 1,
      $$slots: { default: [create_default_slot$a] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(grid.$$.fragment);
    },
    m(target, anchor) {
      mount_component(grid, target, anchor);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(grid.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(grid.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(grid, detaching);
    },
  };
}

// (82:2) <Grid num={1}>
function create_default_slot$a(ctx) {
  let hr;

  return {
    c() {
      hr = element('hr');
      attr(
        hr,
        'class',
        'tw_border-0 tw_border-b tw_border-secondary-light dark:tw_border-secondary-dark',
      );
    },
    m(target, anchor) {
      insert(target, hr, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) detach(hr);
    },
  };
}

function create_fragment$g(ctx) {
  let t;
  let if_block_anchor;
  let current;
  let each_value = /*idps*/ ctx[1];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
  }

  const out = (i) =>
    transition_out(each_blocks[i], 1, 1, () => {
      each_blocks[i] = null;
    });

  let if_block =
    /*stepMetadata*/ ctx[0] &&
    /*stepMetadata*/ ctx[0].derived.numOfCallbacks > 1 &&
    create_if_block$7(ctx);

  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      t = space();
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }

      insert(target, t, anchor);
      if (if_block) if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      if (dirty & /*setBtnValue, idps*/ 6) {
        each_value = /*idps*/ ctx[1];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$4(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$4(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(t.parentNode, t);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }

      if (/*stepMetadata*/ ctx[0] && /*stepMetadata*/ ctx[0].derived.numOfCallbacks > 1) {
        if (if_block) {
          if (dirty & /*stepMetadata*/ 1) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$7(ctx);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();

        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });

        check_outros();
      }
    },
    i(local) {
      if (current) return;

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      transition_in(if_block);
      current = true;
    },
    o(local) {
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      destroy_each(each_blocks, detaching);
      if (detaching) detach(t);
      if (if_block) if_block.d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$g($$self, $$props, $$invalidate) {
  const style = {};
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { selfSubmitFunction = null } = $$props;
  let { stepMetadata } = $$props;
  let idps;

  /**
   * @function setButtonValue - Sets the value on the callback on button click
   * @param {number} index
   */
  function setBtnValue(value) {
    callback.setProvider(value);

    if (callbackMetadata) {
      $$invalidate(3, (callbackMetadata.derived.isReadyForSubmission = true), callbackMetadata);
    }

    selfSubmitFunction && selfSubmitFunction();
  }

  const func = (idp) => setBtnValue(idp.value);
  const func_1 = (idp) => setBtnValue(idp.value);
  const func_2 = (idp) => setBtnValue(idp.value);

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(5, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(3, (callbackMetadata = $$props.callbackMetadata));
    if ('selfSubmitFunction' in $$props)
      $$invalidate(6, (selfSubmitFunction = $$props.selfSubmitFunction));
    if ('stepMetadata' in $$props) $$invalidate(0, (stepMetadata = $$props.stepMetadata));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback*/ 32) {
      {
        const localAuthentication = callback
          .getProviders()
          .filter((provider) => provider.provider === 'localAuthentication');
        const socialProviders = callback
          .getProviders()
          .filter((provider) => provider.provider !== 'localAuthentication');

        if (localAuthentication.length > 0) {
          // Assume that clicking "next" will indicate the user wants to use local authentication
          callback.setProvider('localAuthentication');
        }

        $$invalidate(
          1,
          (idps = socialProviders.map((option, index) => ({
            value: option.provider,
            text: option.uiConfig.buttonDisplayName,
          }))),
        );
      }
    }
  };

  return [
    stepMetadata,
    idps,
    setBtnValue,
    callbackMetadata,
    style,
    callback,
    selfSubmitFunction,
    func,
    func_1,
    func_2,
  ];
}

class Select_idp extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$g, create_fragment$g, safe_not_equal, {
      style: 4,
      callback: 5,
      callbackMetadata: 3,
      selfSubmitFunction: 6,
      stepMetadata: 0,
    });
  }

  get style() {
    return this.$$.ctx[4];
  }
}

/* src/lib/journey/callbacks/_utilities/policies.svelte generated by Svelte v3.55.0 */

function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[10] = list[i];
  return child_ctx;
}

function get_each_context$3(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[7] = list[i];
  return child_ctx;
}

// (34:33)
function create_if_block_1$5(ctx) {
  let div;
  let p;
  let t0;
  let t1;
  let ul;
  let div_id_value;
  let current;
  t0 = new Locale_strings({ props: { key: /*messageKey*/ ctx[1] } });
  let each_value_1 = /*validationRules*/ ctx[2];
  let each_blocks = [];

  for (let i = 0; i < each_value_1.length; i += 1) {
    each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
  }

  return {
    c() {
      div = element('div');
      p = element('p');
      create_component(t0.$$.fragment);
      t1 = space();
      ul = element('ul');

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      attr(p, 'class', 'tw_text-secondary-dark dark:tw_text-secondary-light tw_w-full');
      attr(ul, 'class', 'tw_text-secondary-dark dark:tw_text-secondary-light tw_w-full');
      attr(div, 'class', 'tw_input-policies tw_w-full');
      attr(div, 'id', (div_id_value = `${/*key*/ ctx[0] ? `${/*key*/ ctx[0]}-message` : ''}`));
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, p);
      mount_component(t0, p, null);
      append(div, t1);
      append(div, ul);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(ul, null);
      }

      current = true;
    },
    p(ctx, dirty) {
      const t0_changes = {};
      if (dirty & /*messageKey*/ 2) t0_changes.key = /*messageKey*/ ctx[1];
      t0.$set(t0_changes);

      if (dirty & /*validationRules*/ 4) {
        each_value_1 = /*validationRules*/ ctx[2];
        let i;

        for (i = 0; i < each_value_1.length; i += 1) {
          const child_ctx = get_each_context_1(ctx, each_value_1, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block_1(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(ul, null);
          }
        }

        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }

        each_blocks.length = each_value_1.length;
      }

      if (
        !current ||
        (dirty & /*key*/ 1 &&
          div_id_value !== (div_id_value = `${/*key*/ ctx[0] ? `${/*key*/ ctx[0]}-message` : ''}`))
      ) {
        attr(div, 'id', div_id_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(t0.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t0.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(t0);
      destroy_each(each_blocks, detaching);
    },
  };
}

// (23:0) {#if simplifiedFailures.length}
function create_if_block$6(ctx) {
  let div;
  let p;
  let t0;
  let t1;
  let ul;
  let div_id_value;
  let current;
  t0 = new Locale_strings({ props: { key: /*messageKey*/ ctx[1] } });
  let each_value = /*simplifiedFailures*/ ctx[3];
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
  }

  return {
    c() {
      div = element('div');
      p = element('p');
      create_component(t0.$$.fragment);
      t1 = space();
      ul = element('ul');

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      attr(p, 'class', 'tw_text-error-dark dark:tw_text-error-light tw_w-full');
      attr(ul, 'class', 'tw_text-error-dark dark:tw_text-error-light tw_w-full');
      attr(div, 'class', 'tw_input-policies tw_w-full');
      attr(div, 'id', (div_id_value = `${/*key*/ ctx[0] ? `${/*key*/ ctx[0]}-message` : ''}`));
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, p);
      mount_component(t0, p, null);
      append(div, t1);
      append(div, ul);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(ul, null);
      }

      current = true;
    },
    p(ctx, dirty) {
      const t0_changes = {};
      if (dirty & /*messageKey*/ 2) t0_changes.key = /*messageKey*/ ctx[1];
      t0.$set(t0_changes);

      if (dirty & /*simplifiedFailures*/ 8) {
        each_value = /*simplifiedFailures*/ ctx[3];
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$3(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
          } else {
            each_blocks[i] = create_each_block$3(child_ctx);
            each_blocks[i].c();
            each_blocks[i].m(ul, null);
          }
        }

        for (; i < each_blocks.length; i += 1) {
          each_blocks[i].d(1);
        }

        each_blocks.length = each_value.length;
      }

      if (
        !current ||
        (dirty & /*key*/ 1 &&
          div_id_value !== (div_id_value = `${/*key*/ ctx[0] ? `${/*key*/ ctx[0]}-message` : ''}`))
      ) {
        attr(div, 'id', div_id_value);
      }
    },
    i(local) {
      if (current) return;
      transition_in(t0.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t0.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(t0);
      destroy_each(each_blocks, detaching);
    },
  };
}

// (40:6) {#each validationRules as rule}
function create_each_block_1(ctx) {
  let li;
  let t_value = /*rule*/ ctx[10].message + '';
  let t;

  return {
    c() {
      li = element('li');
      t = text(t_value);
      attr(li, 'class', 'tw_list-disc');
    },
    m(target, anchor) {
      insert(target, li, anchor);
      append(li, t);
    },
    p(ctx, dirty) {
      if (dirty & /*validationRules*/ 4 && t_value !== (t_value = /*rule*/ ctx[10].message + ''))
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(li);
    },
  };
}

// (29:6) {#each simplifiedFailures as failure}
function create_each_block$3(ctx) {
  let li;
  let t_value = /*failure*/ ctx[7].message + '';
  let t;

  return {
    c() {
      li = element('li');
      t = text(t_value);
      attr(li, 'class', 'tw_list-disc');
    },
    m(target, anchor) {
      insert(target, li, anchor);
      append(li, t);
    },
    p(ctx, dirty) {
      if (
        dirty & /*simplifiedFailures*/ 8 &&
        t_value !== (t_value = /*failure*/ ctx[7].message + '')
      )
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(li);
    },
  };
}

function create_fragment$f(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$6, create_if_block_1$5];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*simplifiedFailures*/ ctx[3].length) return 0;
    if (/*validationRules*/ ctx[2].length) return 1;
    return -1;
  }

  if (~(current_block_type_index = select_block_type(ctx))) {
    if_block = if_blocks[current_block_type_index] =
      if_block_creators[current_block_type_index](ctx);
  }

  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(target, anchor);
      }

      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx, dirty);
        }
      } else {
        if (if_block) {
          group_outros();

          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });

          check_outros();
        }

        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];

          if (!if_block) {
            if_block = if_blocks[current_block_type_index] =
              if_block_creators[current_block_type_index](ctx);
            if_block.c();
          } else {
            if_block.p(ctx, dirty);
          }

          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        } else {
          if_block = null;
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d(detaching);
      }

      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$f($$self, $$props, $$invalidate) {
  let { callback } = $$props;
  let { key = undefined } = $$props;
  let { label } = $$props;
  let { messageKey } = $$props;
  let validationFailures = getValidationFailures(callback, label);
  let validationRules = getValidationPolicies(callback.getPolicies());

  let simplifiedFailures = validationFailures.reduce((prev, curr) => {
    prev = prev.concat(curr.restructured);
    return prev;
  }, []);

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(4, (callback = $$props.callback));
    if ('key' in $$props) $$invalidate(0, (key = $$props.key));
    if ('label' in $$props) $$invalidate(5, (label = $$props.label));
    if ('messageKey' in $$props) $$invalidate(1, (messageKey = $$props.messageKey));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, label, validationFailures*/ 112) {
      {
        $$invalidate(6, (validationFailures = getValidationFailures(callback, label)));
        $$invalidate(2, (validationRules = getValidationPolicies(callback.getPolicies())));

        $$invalidate(
          3,
          (simplifiedFailures = validationFailures.reduce((prev, curr) => {
            prev = prev.concat(curr.restructured);
            return prev;
          }, [])),
        );
      }
    }
  };

  return [
    key,
    messageKey,
    validationRules,
    simplifiedFailures,
    callback,
    label,
    validationFailures,
  ];
}

class Policies extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$f, create_fragment$f, safe_not_equal, {
      callback: 4,
      key: 0,
      label: 5,
      messageKey: 1,
    });
  }
}

/* src/lib/journey/callbacks/string-attribute/string-attribute-input.svelte generated by Svelte v3.55.0 */

function create_default_slot$9(ctx) {
  let policies_1;
  let current;

  policies_1 = new Policies({
    props: {
      callback: /*callback*/ ctx[0],
      key: /*inputName*/ ctx[3],
      label: /*prompt*/ ctx[2],
      messageKey: 'valueRequirements',
    },
  });

  return {
    c() {
      create_component(policies_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(policies_1, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const policies_1_changes = {};
      if (dirty & /*callback*/ 1) policies_1_changes.callback = /*callback*/ ctx[0];
      if (dirty & /*inputName*/ 8) policies_1_changes.key = /*inputName*/ ctx[3];
      if (dirty & /*prompt*/ 4) policies_1_changes.label = /*prompt*/ ctx[2];
      policies_1.$set(policies_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(policies_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(policies_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(policies_1, detaching);
    },
  };
}

function create_fragment$e(ctx) {
  let input;
  let current;

  input = new Floating_label({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[1]?.derived.isFirstInvalidInput || false,
      key: /*inputName*/ ctx[3],
      label: interpolate(/*outputName*/ ctx[5], null, /*prompt*/ ctx[2]),
      message: /*isRequired*/ ctx[4] ? interpolate('inputRequiredError') : undefined,
      onChange: /*setValue*/ ctx[9],
      isRequired: /*isRequired*/ ctx[4],
      isInvalid: /*isInvalid*/ ctx[8],
      type: /*type*/ ctx[7],
      showMessage: !!(/*isInvalid*/ ctx[8]),
      value: /*previousValue*/ ctx[6],
      $$slots: { default: [create_default_slot$9] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(input.$$.fragment);
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*callbackMetadata*/ 2)
        input_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[1]?.derived.isFirstInvalidInput || false;
      if (dirty & /*inputName*/ 8) input_changes.key = /*inputName*/ ctx[3];
      if (dirty & /*outputName, prompt*/ 36)
        input_changes.label = interpolate(/*outputName*/ ctx[5], null, /*prompt*/ ctx[2]);

      if (dirty & /*isRequired*/ 16)
        input_changes.message = /*isRequired*/ ctx[4]
          ? interpolate('inputRequiredError')
          : undefined;

      if (dirty & /*isRequired*/ 16) input_changes.isRequired = /*isRequired*/ ctx[4];
      if (dirty & /*isInvalid*/ 256) input_changes.isInvalid = /*isInvalid*/ ctx[8];
      if (dirty & /*type*/ 128) input_changes.type = /*type*/ ctx[7];
      if (dirty & /*isInvalid*/ 256) input_changes.showMessage = !!(/*isInvalid*/ ctx[8]);
      if (dirty & /*previousValue*/ 64) input_changes.value = /*previousValue*/ ctx[6];

      if (dirty & /*$$scope, callback, inputName, prompt*/ 32781) {
        input_changes.$$scope = { dirty, ctx };
      }

      input.$set(input_changes);
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
    },
  };
}

function instance$e($$self, $$props, $$invalidate) {
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let inputName;
  let isRequired;
  let outputName;
  let policies;
  let previousValue;
  let prompt;
  let type;
  let validationFailures;
  let isInvalid;

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(event.target.value);
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(0, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(1, (callbackMetadata = $$props.callbackMetadata));
  };

  $$self.$$.update = () => {
    if (
      $$self.$$.dirty & /*callback, callbackMetadata, policies, prompt, validationFailures*/ 24583
    ) {
      {
        /**
         * We need to wrap this in a reactive block, so it reruns the function
         * on value changes within `callback`
         */
        $$invalidate(
          3,
          (inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`),
        );

        $$invalidate(4, (isRequired = isInputRequired(callback)));
        $$invalidate(5, (outputName = callback.getOutputByName('name', '')));
        $$invalidate(13, (policies = callback.getPolicies()));
        $$invalidate(6, (previousValue = callback?.getInputValue()));
        $$invalidate(2, (prompt = callback.getPrompt()));
        $$invalidate(7, (type = getInputTypeFromPolicies(policies)));
        $$invalidate(14, (validationFailures = getValidationFailures(callback, prompt)));
        $$invalidate(8, (isInvalid = !!validationFailures.length));
      }
    }
  };

  return [
    callback,
    callbackMetadata,
    prompt,
    inputName,
    isRequired,
    outputName,
    previousValue,
    type,
    isInvalid,
    setValue,
    selfSubmitFunction,
    stepMetadata,
    style,
    policies,
    validationFailures,
  ];
}

class String_attribute_input extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$e, create_fragment$e, safe_not_equal, {
      selfSubmitFunction: 10,
      stepMetadata: 11,
      style: 12,
      callback: 0,
      callbackMetadata: 1,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[10];
  }

  get stepMetadata() {
    return this.$$.ctx[11];
  }

  get style() {
    return this.$$.ctx[12];
  }
}

/* src/lib/components/primitives/link/link.svelte generated by Svelte v3.55.0 */

function create_fragment$d(ctx) {
  let a;
  let a_class_value;
  let current;
  const default_slot_template = /*#slots*/ ctx[4].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

  return {
    c() {
      a = element('a');
      if (default_slot) default_slot.c();
      attr(a, 'class', (a_class_value = `${/*classes*/ ctx[0]} tw_link dark:tw_link_dark`));
      attr(a, 'href', /*href*/ ctx[1]);
      attr(a, 'target', /*target*/ ctx[2]);
    },
    m(target, anchor) {
      insert(target, a, anchor);

      if (default_slot) {
        default_slot.m(a, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 8)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[3],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[3])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null),
            null,
          );
        }
      }

      if (
        !current ||
        (dirty & /*classes*/ 1 &&
          a_class_value !== (a_class_value = `${/*classes*/ ctx[0]} tw_link dark:tw_link_dark`))
      ) {
        attr(a, 'class', a_class_value);
      }

      if (!current || dirty & /*href*/ 2) {
        attr(a, 'href', /*href*/ ctx[1]);
      }

      if (!current || dirty & /*target*/ 4) {
        attr(a, 'target', /*target*/ ctx[2]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(a);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$d($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { href } = $$props;
  let { target = '_self' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('href' in $$props) $$invalidate(1, (href = $$props.href));
    if ('target' in $$props) $$invalidate(2, (target = $$props.target));
    if ('$$scope' in $$props) $$invalidate(3, ($$scope = $$props.$$scope));
  };

  return [classes, href, target, $$scope, slots];
}

class Link extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$d, create_fragment$d, safe_not_equal, {
      classes: 0,
      href: 1,
      target: 2,
    });
  }
}

const linksSchema = mod
  .object({
    termsAndConditions: mod.string(),
  })
  .strict();
linksSchema.partial();
let links;
function initialize$2(customLinks) {
  // Provide developer feedback for custom links
  linksSchema.parse(customLinks);
  links = readable(customLinks);
}

/* src/lib/journey/callbacks/terms-and-conditions/terms-conditions.svelte generated by Svelte v3.55.0 */

function create_else_block$2(ctx) {
  let p;

  return {
    c() {
      p = element('p');
      p.innerHTML = `Error: Configuration is missing <code>termsAndConditions</code> URL.`;
      attr(p, 'class', 'tw_text-error-dark dark:tw_text-error-light tw_input-spacing');
    },
    m(target, anchor) {
      insert(target, p, anchor);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) detach(p);
    },
  };
}

// (43:0) {#if $links?.termsAndConditions}
function create_if_block$5(ctx) {
  let link;
  let t;
  let checkbox;
  let current;

  link = new Link({
    props: {
      classes: 'tw_block tw_mb-4',
      href: /*$links*/ ctx[2]?.termsAndConditions,
      target: '_blank',
      $$slots: { default: [create_default_slot_1$4] },
      $$scope: { ctx },
    },
  });

  checkbox = new /*Checkbox*/ ctx[3]({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false,
      key: /*inputName*/ ctx[1],
      onChange: /*setValue*/ ctx[4],
      value: false,
      $$slots: { default: [create_default_slot$8] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(link.$$.fragment);
      t = space();
      create_component(checkbox.$$.fragment);
    },
    m(target, anchor) {
      mount_component(link, target, anchor);
      insert(target, t, anchor);
      mount_component(checkbox, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const link_changes = {};
      if (dirty & /*$links*/ 4) link_changes.href = /*$links*/ ctx[2]?.termsAndConditions;

      if (dirty & /*$$scope*/ 1024) {
        link_changes.$$scope = { dirty, ctx };
      }

      link.$set(link_changes);
      const checkbox_changes = {};
      if (dirty & /*callbackMetadata*/ 1)
        checkbox_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[0]?.derived.isFirstInvalidInput || false;
      if (dirty & /*inputName*/ 2) checkbox_changes.key = /*inputName*/ ctx[1];

      if (dirty & /*$$scope*/ 1024) {
        checkbox_changes.$$scope = { dirty, ctx };
      }

      checkbox.$set(checkbox_changes);
    },
    i(local) {
      if (current) return;
      transition_in(link.$$.fragment, local);
      transition_in(checkbox.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(link.$$.fragment, local);
      transition_out(checkbox.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(link, detaching);
      if (detaching) detach(t);
      destroy_component(checkbox, detaching);
    },
  };
}

// (44:2) <Link classes="tw_block tw_mb-4" href={$links?.termsAndConditions} target="_blank">
function create_default_slot_1$4(ctx) {
  let t_value = interpolate('termsAndConditionsLinkText') + '';
  let t;

  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p: noop,
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (47:2) <Checkbox     isFirstInvalidInput={callbackMetadata?.derived.isFirstInvalidInput || false}     key={inputName}     onChange={setValue}     value={false}   >
function create_default_slot$8(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'termsAndConditions' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

function create_fragment$c(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$5, create_else_block$2];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*$links*/ ctx[2]?.termsAndConditions) return 0;
    return 1;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$c($$self, $$props, $$invalidate) {
  let $links;
  component_subscribe($$self, links, ($$value) => $$invalidate(2, ($links = $$value)));
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  let { checkAndRadioType = 'animated' } = $$props;
  let { callbackMetadata } = $$props;

  /** *************************************************************************
   * SDK INTEGRATION POINT
   * Summary: SDK callback methods for getting values
   * --------------------------------------------------------------------------
   * Details: Each callback is wrapped by the SDK to provide helper methods
   * for accessing values from the callbacks received from AM
   ************************************************************************* */
  const Checkbox = checkAndRadioType === 'standard' ? Standard : Animated$1;

  let inputName;

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setAccepted(event.target.checked);
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(8, (callback = $$props.callback));
    if ('checkAndRadioType' in $$props)
      $$invalidate(9, (checkAndRadioType = $$props.checkAndRadioType));
    if ('callbackMetadata' in $$props)
      $$invalidate(0, (callbackMetadata = $$props.callbackMetadata));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata*/ 257) {
      {
        $$invalidate(
          1,
          (inputName = callback?.payload?.input?.[0].name || `terms-${callbackMetadata?.idx}`),
        );
      }
    }
  };

  return [
    callbackMetadata,
    inputName,
    $links,
    Checkbox,
    setValue,
    selfSubmitFunction,
    stepMetadata,
    style,
    callback,
    checkAndRadioType,
  ];
}

class Terms_conditions extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$c, create_fragment$c, safe_not_equal, {
      selfSubmitFunction: 5,
      stepMetadata: 6,
      style: 7,
      callback: 8,
      checkAndRadioType: 9,
      callbackMetadata: 0,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[5];
  }

  get stepMetadata() {
    return this.$$.ctx[6];
  }

  get style() {
    return this.$$.ctx[7];
  }
}

/* src/lib/journey/callbacks/text-output/text-output.svelte generated by Svelte v3.55.0 */

function create_default_slot$7(ctx) {
  let html_tag;
  let html_anchor;

  return {
    c() {
      html_tag = new HtmlTag(false);
      html_anchor = empty();
      html_tag.a = html_anchor;
    },
    m(target, anchor) {
      html_tag.m(/*cleanMessage*/ ctx[0], target, anchor);
      insert(target, html_anchor, anchor);
    },
    p(ctx, dirty) {
      if (dirty & /*cleanMessage*/ 1) html_tag.p(/*cleanMessage*/ ctx[0]);
    },
    d(detaching) {
      if (detaching) detach(html_anchor);
      if (detaching) html_tag.d();
    },
  };
}

function create_fragment$b(ctx) {
  let text_1;
  let current;

  text_1 = new Text({
    props: {
      classes: 'tw_font-bold tw_mt-6',
      $$slots: { default: [create_default_slot$7] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(text_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(text_1, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const text_1_changes = {};

      if (dirty & /*$$scope, cleanMessage*/ 129) {
        text_1_changes.$$scope = { dirty, ctx };
      }

      text_1.$set(text_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(text_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(text_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(text_1, detaching);
    },
  };
}

function instance$b($$self, $$props, $$invalidate) {
  const callbackMetadata = null;
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  let dirtyMessage = callback.getMessage();
  let cleanMessage = sanitize(dirtyMessage);

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(5, (callback = $$props.callback));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, dirtyMessage*/ 96) {
      {
        $$invalidate(6, (dirtyMessage = callback.getMessage()));
        $$invalidate(0, (cleanMessage = sanitize(dirtyMessage)));
      }
    }
  };

  return [
    cleanMessage,
    callbackMetadata,
    selfSubmitFunction,
    stepMetadata,
    style,
    callback,
    dirtyMessage,
  ];
}

class Text_output extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$b, create_fragment$b, safe_not_equal, {
      callbackMetadata: 1,
      selfSubmitFunction: 2,
      stepMetadata: 3,
      style: 4,
      callback: 5,
    });
  }

  get callbackMetadata() {
    return this.$$.ctx[1];
  }

  get selfSubmitFunction() {
    return this.$$.ctx[2];
  }

  get stepMetadata() {
    return this.$$.ctx[3];
  }

  get style() {
    return this.$$.ctx[4];
  }
}

/* src/lib/journey/callbacks/unknown/unknown.svelte generated by Svelte v3.55.0 */

function create_fragment$a(ctx) {
  let p;

  return {
    c() {
      p = element('p');
      p.textContent = `Unknown callback encountered: ${/*type*/ ctx[0]}. Please contact support.`;
      attr(
        p,
        'class',
        'tw_text-base tw_text-secondary-dark dark:tw_text-secondary-light tw_input-spacing',
      );
    },
    m(target, anchor) {
      insert(target, p, anchor);
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) detach(p);
    },
  };
}

function instance$a($$self, $$props, $$invalidate) {
  const callbackMetadata = null;
  const selfSubmitFunction = null;
  const stepMetadata = null;
  const style = {};
  let { callback } = $$props;
  const type = callback.getType();

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(5, (callback = $$props.callback));
  };

  return [type, callbackMetadata, selfSubmitFunction, stepMetadata, style, callback];
}

class Unknown extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$a, create_fragment$a, safe_not_equal, {
      callbackMetadata: 1,
      selfSubmitFunction: 2,
      stepMetadata: 3,
      style: 4,
      callback: 5,
    });
  }

  get callbackMetadata() {
    return this.$$.ctx[1];
  }

  get selfSubmitFunction() {
    return this.$$.ctx[2];
  }

  get stepMetadata() {
    return this.$$.ctx[3];
  }

  get style() {
    return this.$$.ctx[4];
  }
}

/* src/lib/journey/callbacks/password/validated-create-password.svelte generated by Svelte v3.55.0 */

function create_default_slot$6(ctx) {
  let policies;
  let current;

  policies = new Policies({
    props: {
      callback: /*callback*/ ctx[0],
      label: /*prompt*/ ctx[3],
      messageKey: 'passwordRequirements',
    },
  });

  return {
    c() {
      create_component(policies.$$.fragment);
    },
    m(target, anchor) {
      mount_component(policies, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const policies_changes = {};
      if (dirty & /*callback*/ 1) policies_changes.callback = /*callback*/ ctx[0];
      if (dirty & /*prompt*/ 8) policies_changes.label = /*prompt*/ ctx[3];
      policies.$set(policies_changes);
    },
    i(local) {
      if (current) return;
      transition_in(policies.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(policies.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(policies, detaching);
    },
  };
}

function create_fragment$9(ctx) {
  let base;
  let current;

  base = new Base({
    props: {
      callback: /*callback*/ ctx[0],
      callbackMetadata: /*callbackMetadata*/ ctx[1],
      isInvalid: /*isInvalid*/ ctx[5],
      isRequired: /*isRequired*/ ctx[6],
      key: /*inputName*/ ctx[4],
      showMessage: /*isInvalid*/ ctx[5],
      style: /*style*/ ctx[2],
      $$slots: { default: [create_default_slot$6] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(base.$$.fragment);
    },
    m(target, anchor) {
      mount_component(base, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const base_changes = {};
      if (dirty & /*callback*/ 1) base_changes.callback = /*callback*/ ctx[0];
      if (dirty & /*callbackMetadata*/ 2)
        base_changes.callbackMetadata = /*callbackMetadata*/ ctx[1];
      if (dirty & /*isInvalid*/ 32) base_changes.isInvalid = /*isInvalid*/ ctx[5];
      if (dirty & /*inputName*/ 16) base_changes.key = /*inputName*/ ctx[4];
      if (dirty & /*isInvalid*/ 32) base_changes.showMessage = /*isInvalid*/ ctx[5];
      if (dirty & /*style*/ 4) base_changes.style = /*style*/ ctx[2];

      if (dirty & /*$$scope, callback, prompt*/ 1033) {
        base_changes.$$scope = { dirty, ctx };
      }

      base.$set(base_changes);
    },
    i(local) {
      if (current) return;
      transition_in(base.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(base.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(base, detaching);
    },
  };
}

function instance$9($$self, $$props, $$invalidate) {
  const selfSubmitFunction = null;
  const stepMetadata = null;
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { style = {} } = $$props;
  const isRequired = isInputRequired(callback);
  let inputName;
  let isInvalid;
  let prompt;
  let validationFailures;

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(0, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(1, (callbackMetadata = $$props.callbackMetadata));
    if ('style' in $$props) $$invalidate(2, (style = $$props.style));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata, prompt, validationFailures*/ 523) {
      {
        /**
         * We need to wrap this in a reactive block, so it reruns the function
         * on value changes within `callback`
         */
        $$invalidate(
          4,
          (inputName = callback?.payload?.input?.[0].name || `password-${callbackMetadata?.idx}`),
        );

        $$invalidate(3, (prompt = callback.getPrompt()));
        $$invalidate(9, (validationFailures = getValidationFailures(callback, prompt)));
        $$invalidate(5, (isInvalid = !!validationFailures.length));
      }
    }
  };

  return [
    callback,
    callbackMetadata,
    style,
    prompt,
    inputName,
    isInvalid,
    isRequired,
    selfSubmitFunction,
    stepMetadata,
    validationFailures,
  ];
}

class Validated_create_password extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$9, create_fragment$9, safe_not_equal, {
      selfSubmitFunction: 7,
      stepMetadata: 8,
      callback: 0,
      callbackMetadata: 1,
      style: 2,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[7];
  }

  get stepMetadata() {
    return this.$$.ctx[8];
  }
}

/* src/lib/journey/callbacks/username/validated-create-username.svelte generated by Svelte v3.55.0 */

function create_default_slot$5(ctx) {
  let policies;
  let current;

  policies = new Policies({
    props: {
      callback: /*callback*/ ctx[0],
      key: /*inputName*/ ctx[4],
      label: /*prompt*/ ctx[2],
      messageKey: 'usernameRequirements',
    },
  });

  return {
    c() {
      create_component(policies.$$.fragment);
    },
    m(target, anchor) {
      mount_component(policies, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const policies_changes = {};
      if (dirty & /*callback*/ 1) policies_changes.callback = /*callback*/ ctx[0];
      if (dirty & /*inputName*/ 16) policies_changes.key = /*inputName*/ ctx[4];
      if (dirty & /*prompt*/ 4) policies_changes.label = /*prompt*/ ctx[2];
      policies.$set(policies_changes);
    },
    i(local) {
      if (current) return;
      transition_in(policies.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(policies.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(policies, detaching);
    },
  };
}

function create_fragment$8(ctx) {
  let input;
  let current;

  input = new /*Input*/ ctx[8]({
    props: {
      isFirstInvalidInput: /*callbackMetadata*/ ctx[1]?.derived.isFirstInvalidInput || false,
      isRequired: /*isRequired*/ ctx[6],
      isInvalid: /*isInvalid*/ ctx[5],
      key: /*inputName*/ ctx[4],
      label: interpolate(textToKey(/*callbackType*/ ctx[3]), null, /*prompt*/ ctx[2]),
      message: /*isRequired*/ ctx[6] ? interpolate('inputRequiredError') : undefined,
      onChange: /*setValue*/ ctx[9],
      showMessage: false,
      type: 'text',
      value: typeof (/*value*/ ctx[7]) === 'string' ? /*value*/ ctx[7] : '',
      $$slots: { default: [create_default_slot$5] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(input.$$.fragment);
    },
    m(target, anchor) {
      mount_component(input, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const input_changes = {};
      if (dirty & /*callbackMetadata*/ 2)
        input_changes.isFirstInvalidInput =
          /*callbackMetadata*/ ctx[1]?.derived.isFirstInvalidInput || false;
      if (dirty & /*isRequired*/ 64) input_changes.isRequired = /*isRequired*/ ctx[6];
      if (dirty & /*isInvalid*/ 32) input_changes.isInvalid = /*isInvalid*/ ctx[5];
      if (dirty & /*inputName*/ 16) input_changes.key = /*inputName*/ ctx[4];
      if (dirty & /*callbackType, prompt*/ 12)
        input_changes.label = interpolate(
          textToKey(/*callbackType*/ ctx[3]),
          null,
          /*prompt*/ ctx[2],
        );

      if (dirty & /*isRequired*/ 64)
        input_changes.message = /*isRequired*/ ctx[6]
          ? interpolate('inputRequiredError')
          : undefined;

      if (dirty & /*value*/ 128)
        input_changes.value = typeof (/*value*/ ctx[7]) === 'string' ? /*value*/ ctx[7] : '';

      if (dirty & /*$$scope, callback, inputName, prompt*/ 16405) {
        input_changes.$$scope = { dirty, ctx };
      }

      input.$set(input_changes);
    },
    i(local) {
      if (current) return;
      transition_in(input.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(input.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(input, detaching);
    },
  };
}

function instance$8($$self, $$props, $$invalidate) {
  const selfSubmitFunction = null;
  const stepMetadata = null;
  let { callback } = $$props;
  let { callbackMetadata } = $$props;
  let { style = {} } = $$props;
  const Input = style.labels === 'stacked' ? Stacked_label : Floating_label;
  let callbackType;
  let inputName;
  let isInvalid;
  let isRequired;
  let prompt;
  let value;
  let validationFailures;

  /**
   * @function setValue - Sets the value on the callback on element blur (lose focus)
   * @param {Object} event
   */
  function setValue(event) {
    /** ***********************************************************************
     * SDK INTEGRATION POINT
     * Summary: SDK callback methods for setting values
     * ------------------------------------------------------------------------
     * Details: Each callback is wrapped by the SDK to provide helper methods
     * for writing values to the callbacks received from AM
     *********************************************************************** */
    callback.setInputValue(event.target.value);
  }

  $$self.$$set = ($$props) => {
    if ('callback' in $$props) $$invalidate(0, (callback = $$props.callback));
    if ('callbackMetadata' in $$props)
      $$invalidate(1, (callbackMetadata = $$props.callbackMetadata));
    if ('style' in $$props) $$invalidate(12, (style = $$props.style));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*callback, callbackMetadata, prompt, validationFailures*/ 8199) {
      {
        $$invalidate(3, (callbackType = callback.getType()));
        $$invalidate(
          4,
          (inputName =
            callback?.payload?.input?.[0].name || `validated-name=${callbackMetadata?.idx}`),
        );
        $$invalidate(6, (isRequired = isInputRequired(callback)));
        $$invalidate(2, (prompt = callback.getPrompt()));
        $$invalidate(7, (value = callback?.getInputValue()));
        $$invalidate(13, (validationFailures = getValidationFailures(callback, prompt)));
        $$invalidate(5, (isInvalid = !!validationFailures.length));
      }
    }
  };

  return [
    callback,
    callbackMetadata,
    prompt,
    callbackType,
    inputName,
    isInvalid,
    isRequired,
    value,
    Input,
    setValue,
    selfSubmitFunction,
    stepMetadata,
    style,
    validationFailures,
  ];
}

class Validated_create_username extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$8, create_fragment$8, safe_not_equal, {
      selfSubmitFunction: 10,
      stepMetadata: 11,
      callback: 0,
      callbackMetadata: 1,
      style: 12,
    });
  }

  get selfSubmitFunction() {
    return this.$$.ctx[10];
  }

  get stepMetadata() {
    return this.$$.ctx[11];
  }
}

/* src/lib/journey/_utilities/callback-mapper.svelte generated by Svelte v3.55.0 */

function get_else_ctx(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_FRCallback*/ child_ctx[18],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_15(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_SuspendedTextOutputCallback*/ child_ctx[17],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_14(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_TextOutputCallback*/ child_ctx[16],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_13(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_TermsAndConditionsCallback*/ child_ctx[15],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_12(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_ValidatedCreateUsernameCallback*/ child_ctx[14],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_11(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_ValidatedCreatePasswordCallback*/ child_ctx[13],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_10(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_StringAttributeInputCallback*/ child_ctx[12],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_9(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_SelectIdPCallback*/ child_ctx[11],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_8(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_RedirectCallback*/ child_ctx[10],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_7(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_PollingWaitCallback*/ child_ctx[9],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_6(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_PasswordCallback*/ child_ctx[8],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_5(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_NameCallback*/ child_ctx[7],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_4(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_KbaCreateCallback*/ child_ctx[6],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_3(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_HiddenValueCallback*/ child_ctx[5],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_2(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_ConfirmationCallback*/ child_ctx[4],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx_1(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_ChoiceCallback*/ child_ctx[3],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

function get_if_ctx(ctx) {
  const child_ctx = ctx.slice();

  const constants_0 = {
    .../*props*/ child_ctx[0],
    callback: /*_BooleanAttributeInputCallback*/ child_ctx[2],
  };

  child_ctx[19] = constants_0;
  return child_ctx;
}

// (198:0) {:else}
function create_else_block$1(ctx) {
  let unknown;
  let current;
  const unknown_spread_levels = [/*newProps*/ ctx[19]];
  let unknown_props = {};

  for (let i = 0; i < unknown_spread_levels.length; i += 1) {
    unknown_props = assign(unknown_props, unknown_spread_levels[i]);
  }

  unknown = new Unknown({ props: unknown_props });

  return {
    c() {
      create_component(unknown.$$.fragment);
    },
    m(target, anchor) {
      mount_component(unknown, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const unknown_changes =
        dirty & /*props, _FRCallback*/ 262145
          ? get_spread_update(unknown_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      unknown.$set(unknown_changes);
    },
    i(local) {
      if (current) return;
      transition_in(unknown.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(unknown.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(unknown, detaching);
    },
  };
}

// (192:62)
function create_if_block_15(ctx) {
  let textoutput;
  let current;
  const textoutput_spread_levels = [/*newProps*/ ctx[19]];
  let textoutput_props = {};

  for (let i = 0; i < textoutput_spread_levels.length; i += 1) {
    textoutput_props = assign(textoutput_props, textoutput_spread_levels[i]);
  }

  textoutput = new Text_output({ props: textoutput_props });

  return {
    c() {
      create_component(textoutput.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textoutput, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const textoutput_changes =
        dirty & /*props, _SuspendedTextOutputCallback*/ 131073
          ? get_spread_update(textoutput_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      textoutput.$set(textoutput_changes);
    },
    i(local) {
      if (current) return;
      transition_in(textoutput.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textoutput.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textoutput, detaching);
    },
  };
}

// (186:53)
function create_if_block_14(ctx) {
  let textoutput;
  let current;
  const textoutput_spread_levels = [/*newProps*/ ctx[19]];
  let textoutput_props = {};

  for (let i = 0; i < textoutput_spread_levels.length; i += 1) {
    textoutput_props = assign(textoutput_props, textoutput_spread_levels[i]);
  }

  textoutput = new Text_output({ props: textoutput_props });

  return {
    c() {
      create_component(textoutput.$$.fragment);
    },
    m(target, anchor) {
      mount_component(textoutput, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const textoutput_changes =
        dirty & /*props, _TextOutputCallback*/ 65537
          ? get_spread_update(textoutput_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      textoutput.$set(textoutput_changes);
    },
    i(local) {
      if (current) return;
      transition_in(textoutput.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(textoutput.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(textoutput, detaching);
    },
  };
}

// (180:61)
function create_if_block_13(ctx) {
  let termsconditions;
  let current;
  const termsconditions_spread_levels = [/*newProps*/ ctx[19]];
  let termsconditions_props = {};

  for (let i = 0; i < termsconditions_spread_levels.length; i += 1) {
    termsconditions_props = assign(termsconditions_props, termsconditions_spread_levels[i]);
  }

  termsconditions = new Terms_conditions({ props: termsconditions_props });

  return {
    c() {
      create_component(termsconditions.$$.fragment);
    },
    m(target, anchor) {
      mount_component(termsconditions, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const termsconditions_changes =
        dirty & /*props, _TermsAndConditionsCallback*/ 32769
          ? get_spread_update(termsconditions_spread_levels, [
              get_spread_object(/*newProps*/ ctx[19]),
            ])
          : {};

      termsconditions.$set(termsconditions_changes);
    },
    i(local) {
      if (current) return;
      transition_in(termsconditions.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(termsconditions.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(termsconditions, detaching);
    },
  };
}

// (174:66)
function create_if_block_12(ctx) {
  let validatedcreateusername;
  let current;
  const validatedcreateusername_spread_levels = [/*newProps*/ ctx[19]];
  let validatedcreateusername_props = {};

  for (let i = 0; i < validatedcreateusername_spread_levels.length; i += 1) {
    validatedcreateusername_props = assign(
      validatedcreateusername_props,
      validatedcreateusername_spread_levels[i],
    );
  }

  validatedcreateusername = new Validated_create_username({ props: validatedcreateusername_props });

  return {
    c() {
      create_component(validatedcreateusername.$$.fragment);
    },
    m(target, anchor) {
      mount_component(validatedcreateusername, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const validatedcreateusername_changes =
        dirty & /*props, _ValidatedCreateUsernameCallback*/ 16385
          ? get_spread_update(validatedcreateusername_spread_levels, [
              get_spread_object(/*newProps*/ ctx[19]),
            ])
          : {};

      validatedcreateusername.$set(validatedcreateusername_changes);
    },
    i(local) {
      if (current) return;
      transition_in(validatedcreateusername.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(validatedcreateusername.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(validatedcreateusername, detaching);
    },
  };
}

// (168:66)
function create_if_block_11(ctx) {
  let validatedcreatepassword;
  let current;
  const validatedcreatepassword_spread_levels = [/*newProps*/ ctx[19]];
  let validatedcreatepassword_props = {};

  for (let i = 0; i < validatedcreatepassword_spread_levels.length; i += 1) {
    validatedcreatepassword_props = assign(
      validatedcreatepassword_props,
      validatedcreatepassword_spread_levels[i],
    );
  }

  validatedcreatepassword = new Validated_create_password({ props: validatedcreatepassword_props });

  return {
    c() {
      create_component(validatedcreatepassword.$$.fragment);
    },
    m(target, anchor) {
      mount_component(validatedcreatepassword, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const validatedcreatepassword_changes =
        dirty & /*props, _ValidatedCreatePasswordCallback*/ 8193
          ? get_spread_update(validatedcreatepassword_spread_levels, [
              get_spread_object(/*newProps*/ ctx[19]),
            ])
          : {};

      validatedcreatepassword.$set(validatedcreatepassword_changes);
    },
    i(local) {
      if (current) return;
      transition_in(validatedcreatepassword.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(validatedcreatepassword.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(validatedcreatepassword, detaching);
    },
  };
}

// (162:63)
function create_if_block_10(ctx) {
  let stringattributeinput;
  let current;
  const stringattributeinput_spread_levels = [/*newProps*/ ctx[19]];
  let stringattributeinput_props = {};

  for (let i = 0; i < stringattributeinput_spread_levels.length; i += 1) {
    stringattributeinput_props = assign(
      stringattributeinput_props,
      stringattributeinput_spread_levels[i],
    );
  }

  stringattributeinput = new String_attribute_input({ props: stringattributeinput_props });

  return {
    c() {
      create_component(stringattributeinput.$$.fragment);
    },
    m(target, anchor) {
      mount_component(stringattributeinput, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const stringattributeinput_changes =
        dirty & /*props, _StringAttributeInputCallback*/ 4097
          ? get_spread_update(stringattributeinput_spread_levels, [
              get_spread_object(/*newProps*/ ctx[19]),
            ])
          : {};

      stringattributeinput.$set(stringattributeinput_changes);
    },
    i(local) {
      if (current) return;
      transition_in(stringattributeinput.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(stringattributeinput.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(stringattributeinput, detaching);
    },
  };
}

// (156:52)
function create_if_block_9(ctx) {
  let selectidp;
  let current;
  const selectidp_spread_levels = [/*newProps*/ ctx[19]];
  let selectidp_props = {};

  for (let i = 0; i < selectidp_spread_levels.length; i += 1) {
    selectidp_props = assign(selectidp_props, selectidp_spread_levels[i]);
  }

  selectidp = new Select_idp({ props: selectidp_props });

  return {
    c() {
      create_component(selectidp.$$.fragment);
    },
    m(target, anchor) {
      mount_component(selectidp, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const selectidp_changes =
        dirty & /*props, _SelectIdPCallback*/ 2049
          ? get_spread_update(selectidp_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      selectidp.$set(selectidp_changes);
    },
    i(local) {
      if (current) return;
      transition_in(selectidp.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(selectidp.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(selectidp, detaching);
    },
  };
}

// (150:51)
function create_if_block_8(ctx) {
  let redirect;
  let current;
  const redirect_spread_levels = [/*newProps*/ ctx[19]];
  let redirect_props = {};

  for (let i = 0; i < redirect_spread_levels.length; i += 1) {
    redirect_props = assign(redirect_props, redirect_spread_levels[i]);
  }

  redirect = new Redirect({ props: redirect_props });

  return {
    c() {
      create_component(redirect.$$.fragment);
    },
    m(target, anchor) {
      mount_component(redirect, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const redirect_changes =
        dirty & /*props, _RedirectCallback*/ 1025
          ? get_spread_update(redirect_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      redirect.$set(redirect_changes);
    },
    i(local) {
      if (current) return;
      transition_in(redirect.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(redirect.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(redirect, detaching);
    },
  };
}

// (144:54)
function create_if_block_7(ctx) {
  let pollingwait;
  let current;
  const pollingwait_spread_levels = [/*newProps*/ ctx[19]];
  let pollingwait_props = {};

  for (let i = 0; i < pollingwait_spread_levels.length; i += 1) {
    pollingwait_props = assign(pollingwait_props, pollingwait_spread_levels[i]);
  }

  pollingwait = new Polling_wait({ props: pollingwait_props });

  return {
    c() {
      create_component(pollingwait.$$.fragment);
    },
    m(target, anchor) {
      mount_component(pollingwait, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const pollingwait_changes =
        dirty & /*props, _PollingWaitCallback*/ 513
          ? get_spread_update(pollingwait_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      pollingwait.$set(pollingwait_changes);
    },
    i(local) {
      if (current) return;
      transition_in(pollingwait.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(pollingwait.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(pollingwait, detaching);
    },
  };
}

// (138:51)
function create_if_block_6(ctx) {
  let password;
  let current;
  const password_spread_levels = [/*newProps*/ ctx[19]];
  let password_props = {};

  for (let i = 0; i < password_spread_levels.length; i += 1) {
    password_props = assign(password_props, password_spread_levels[i]);
  }

  password = new Password({ props: password_props });

  return {
    c() {
      create_component(password.$$.fragment);
    },
    m(target, anchor) {
      mount_component(password, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const password_changes =
        dirty & /*props, _PasswordCallback*/ 257
          ? get_spread_update(password_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      password.$set(password_changes);
    },
    i(local) {
      if (current) return;
      transition_in(password.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(password.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(password, detaching);
    },
  };
}

// (132:47)
function create_if_block_5(ctx) {
  let name;
  let current;
  const name_spread_levels = [/*newProps*/ ctx[19]];
  let name_props = {};

  for (let i = 0; i < name_spread_levels.length; i += 1) {
    name_props = assign(name_props, name_spread_levels[i]);
  }

  name = new Name({ props: name_props });

  return {
    c() {
      create_component(name.$$.fragment);
    },
    m(target, anchor) {
      mount_component(name, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const name_changes =
        dirty & /*props, _NameCallback*/ 129
          ? get_spread_update(name_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      name.$set(name_changes);
    },
    i(local) {
      if (current) return;
      transition_in(name.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(name.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(name, detaching);
    },
  };
}

// (126:52)
function create_if_block_4(ctx) {
  let kbacreate;
  let current;
  const kbacreate_spread_levels = [/*newProps*/ ctx[19]];
  let kbacreate_props = {};

  for (let i = 0; i < kbacreate_spread_levels.length; i += 1) {
    kbacreate_props = assign(kbacreate_props, kbacreate_spread_levels[i]);
  }

  kbacreate = new Kba_create({ props: kbacreate_props });

  return {
    c() {
      create_component(kbacreate.$$.fragment);
    },
    m(target, anchor) {
      mount_component(kbacreate, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const kbacreate_changes =
        dirty & /*props, _KbaCreateCallback*/ 65
          ? get_spread_update(kbacreate_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      kbacreate.$set(kbacreate_changes);
    },
    i(local) {
      if (current) return;
      transition_in(kbacreate.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(kbacreate.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(kbacreate, detaching);
    },
  };
}

// (120:54)
function create_if_block_3$1(ctx) {
  let hiddenvalue;
  let current;
  const hiddenvalue_spread_levels = [/*newProps*/ ctx[19]];
  let hiddenvalue_props = {};

  for (let i = 0; i < hiddenvalue_spread_levels.length; i += 1) {
    hiddenvalue_props = assign(hiddenvalue_props, hiddenvalue_spread_levels[i]);
  }

  hiddenvalue = new Hidden_value({ props: hiddenvalue_props });

  return {
    c() {
      create_component(hiddenvalue.$$.fragment);
    },
    m(target, anchor) {
      mount_component(hiddenvalue, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const hiddenvalue_changes =
        dirty & /*props, _HiddenValueCallback*/ 33
          ? get_spread_update(hiddenvalue_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      hiddenvalue.$set(hiddenvalue_changes);
    },
    i(local) {
      if (current) return;
      transition_in(hiddenvalue.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(hiddenvalue.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(hiddenvalue, detaching);
    },
  };
}

// (114:55)
function create_if_block_2$4(ctx) {
  let confirmation;
  let current;
  const confirmation_spread_levels = [/*newProps*/ ctx[19]];
  let confirmation_props = {};

  for (let i = 0; i < confirmation_spread_levels.length; i += 1) {
    confirmation_props = assign(confirmation_props, confirmation_spread_levels[i]);
  }

  confirmation = new Confirmation({ props: confirmation_props });

  return {
    c() {
      create_component(confirmation.$$.fragment);
    },
    m(target, anchor) {
      mount_component(confirmation, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const confirmation_changes =
        dirty & /*props, _ConfirmationCallback*/ 17
          ? get_spread_update(confirmation_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      confirmation.$set(confirmation_changes);
    },
    i(local) {
      if (current) return;
      transition_in(confirmation.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(confirmation.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(confirmation, detaching);
    },
  };
}

// (108:49)
function create_if_block_1$4(ctx) {
  let choice;
  let current;
  const choice_spread_levels = [/*newProps*/ ctx[19]];
  let choice_props = {};

  for (let i = 0; i < choice_spread_levels.length; i += 1) {
    choice_props = assign(choice_props, choice_spread_levels[i]);
  }

  choice = new Choice({ props: choice_props });

  return {
    c() {
      create_component(choice.$$.fragment);
    },
    m(target, anchor) {
      mount_component(choice, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const choice_changes =
        dirty & /*props, _ChoiceCallback*/ 9
          ? get_spread_update(choice_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      choice.$set(choice_changes);
    },
    i(local) {
      if (current) return;
      transition_in(choice.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(choice.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(choice, detaching);
    },
  };
}

// (102:0) {#if cbType === CallbackType.BooleanAttributeInputCallback}
function create_if_block$4(ctx) {
  let boolean;
  let current;
  const boolean_spread_levels = [/*newProps*/ ctx[19]];
  let boolean_props = {};

  for (let i = 0; i < boolean_spread_levels.length; i += 1) {
    boolean_props = assign(boolean_props, boolean_spread_levels[i]);
  }

  boolean = new Boolean$1({ props: boolean_props });

  return {
    c() {
      create_component(boolean.$$.fragment);
    },
    m(target, anchor) {
      mount_component(boolean, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const boolean_changes =
        dirty & /*props, _BooleanAttributeInputCallback*/ 5
          ? get_spread_update(boolean_spread_levels, [get_spread_object(/*newProps*/ ctx[19])])
          : {};

      boolean.$set(boolean_changes);
    },
    i(local) {
      if (current) return;
      transition_in(boolean.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(boolean.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(boolean, detaching);
    },
  };
}

function create_fragment$7(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;

  const if_block_creators = [
    create_if_block$4,
    create_if_block_1$4,
    create_if_block_2$4,
    create_if_block_3$1,
    create_if_block_4,
    create_if_block_5,
    create_if_block_6,
    create_if_block_7,
    create_if_block_8,
    create_if_block_9,
    create_if_block_10,
    create_if_block_11,
    create_if_block_12,
    create_if_block_13,
    create_if_block_14,
    create_if_block_15,
    create_else_block$1,
  ];

  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (/*cbType*/ ctx[1] === CallbackType.BooleanAttributeInputCallback) return 0;
    if (/*cbType*/ ctx[1] === CallbackType.ChoiceCallback) return 1;
    if (/*cbType*/ ctx[1] === CallbackType.ConfirmationCallback) return 2;
    if (/*cbType*/ ctx[1] === CallbackType.HiddenValueCallback) return 3;
    if (/*cbType*/ ctx[1] === CallbackType.KbaCreateCallback) return 4;
    if (/*cbType*/ ctx[1] === CallbackType.NameCallback) return 5;
    if (/*cbType*/ ctx[1] === CallbackType.PasswordCallback) return 6;
    if (/*cbType*/ ctx[1] === CallbackType.PollingWaitCallback) return 7;
    if (/*cbType*/ ctx[1] === CallbackType.RedirectCallback) return 8;
    if (/*cbType*/ ctx[1] === CallbackType.SelectIdPCallback) return 9;
    if (/*cbType*/ ctx[1] === CallbackType.StringAttributeInputCallback) return 10;
    if (/*cbType*/ ctx[1] === CallbackType.ValidatedCreatePasswordCallback) return 11;
    if (/*cbType*/ ctx[1] === CallbackType.ValidatedCreateUsernameCallback) return 12;
    if (/*cbType*/ ctx[1] === CallbackType.TermsAndConditionsCallback) return 13;
    if (/*cbType*/ ctx[1] === CallbackType.TextOutputCallback) return 14;
    if (/*cbType*/ ctx[1] === CallbackType.SuspendedTextOutputCallback) return 15;
    return 16;
  }

  function select_block_ctx(ctx, index) {
    if (index === 0) return get_if_ctx(ctx);
    if (index === 1) return get_if_ctx_1(ctx);
    if (index === 2) return get_if_ctx_2(ctx);
    if (index === 3) return get_if_ctx_3(ctx);
    if (index === 4) return get_if_ctx_4(ctx);
    if (index === 5) return get_if_ctx_5(ctx);
    if (index === 6) return get_if_ctx_6(ctx);
    if (index === 7) return get_if_ctx_7(ctx);
    if (index === 8) return get_if_ctx_8(ctx);
    if (index === 9) return get_if_ctx_9(ctx);
    if (index === 10) return get_if_ctx_10(ctx);
    if (index === 11) return get_if_ctx_11(ctx);
    if (index === 12) return get_if_ctx_12(ctx);
    if (index === 13) return get_if_ctx_13(ctx);
    if (index === 14) return get_if_ctx_14(ctx);
    if (index === 15) return get_if_ctx_15(ctx);
    return get_else_ctx(ctx);
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](
    select_block_ctx(ctx, current_block_type_index),
  );

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(
          select_block_ctx(ctx, current_block_type_index),
          dirty,
        );
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] = if_block_creators[
            current_block_type_index
          ](select_block_ctx(ctx, current_block_type_index));
          if_block.c();
        } else {
          if_block.p(select_block_ctx(ctx, current_block_type_index), dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$7($$self, $$props, $$invalidate) {
  let { props } = $$props;
  let cbType;
  let _BooleanAttributeInputCallback;
  let _ChoiceCallback;
  let _ConfirmationCallback;
  let _HiddenValueCallback;
  let _KbaCreateCallback;
  let _NameCallback;
  let _PasswordCallback;
  let _PollingWaitCallback;
  let _RedirectCallback;
  let _SelectIdPCallback;
  let _StringAttributeInputCallback;
  let _ValidatedCreatePasswordCallback;
  let _ValidatedCreateUsernameCallback;
  let _TermsAndConditionsCallback;
  let _TextOutputCallback;
  let _SuspendedTextOutputCallback;
  let _FRCallback;

  $$self.$$set = ($$props) => {
    if ('props' in $$props) $$invalidate(0, (props = $$props.props));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*props, cbType*/ 3) {
      {
        $$invalidate(1, (cbType = props.callback.getType()));

        switch (cbType) {
          case CallbackType.BooleanAttributeInputCallback:
            $$invalidate(2, (_BooleanAttributeInputCallback = props.callback));
            break;
          case CallbackType.ChoiceCallback:
            $$invalidate(3, (_ChoiceCallback = props.callback));
            break;
          case CallbackType.ConfirmationCallback:
            $$invalidate(4, (_ConfirmationCallback = props.callback));
            break;
          case CallbackType.HiddenValueCallback:
            $$invalidate(5, (_HiddenValueCallback = props.callback));
            break;
          case CallbackType.KbaCreateCallback:
            $$invalidate(6, (_KbaCreateCallback = props.callback));
            break;
          case CallbackType.NameCallback:
            $$invalidate(7, (_NameCallback = props.callback));
            break;
          case CallbackType.PasswordCallback:
            $$invalidate(8, (_PasswordCallback = props.callback));
            break;
          case CallbackType.PollingWaitCallback:
            $$invalidate(9, (_PollingWaitCallback = props.callback));
            break;
          case CallbackType.RedirectCallback:
            $$invalidate(10, (_RedirectCallback = props.callback));
            break;
          case CallbackType.SelectIdPCallback:
            $$invalidate(11, (_SelectIdPCallback = props.callback));
            break;
          case CallbackType.StringAttributeInputCallback:
            $$invalidate(12, (_StringAttributeInputCallback = props.callback));
            break;
          case CallbackType.ValidatedCreatePasswordCallback:
            $$invalidate(13, (_ValidatedCreatePasswordCallback = props.callback));
            break;
          case CallbackType.ValidatedCreateUsernameCallback:
            $$invalidate(14, (_ValidatedCreateUsernameCallback = props.callback));
            break;
          case CallbackType.TermsAndConditionsCallback:
            $$invalidate(15, (_TermsAndConditionsCallback = props.callback));
            break;
          case CallbackType.TextOutputCallback:
            $$invalidate(16, (_TextOutputCallback = props.callback));
            break;
          case CallbackType.SuspendedTextOutputCallback:
            $$invalidate(17, (_SuspendedTextOutputCallback = props.callback));
            break;
          default:
            $$invalidate(18, (_FRCallback = props.callback));
        }
      }
    }
  };

  return [
    props,
    cbType,
    _BooleanAttributeInputCallback,
    _ChoiceCallback,
    _ConfirmationCallback,
    _HiddenValueCallback,
    _KbaCreateCallback,
    _NameCallback,
    _PasswordCallback,
    _PollingWaitCallback,
    _RedirectCallback,
    _SelectIdPCallback,
    _StringAttributeInputCallback,
    _ValidatedCreatePasswordCallback,
    _ValidatedCreateUsernameCallback,
    _TermsAndConditionsCallback,
    _TextOutputCallback,
    _SuspendedTextOutputCallback,
    _FRCallback,
  ];
}

class Callback_mapper extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$7, create_fragment$7, safe_not_equal, { props: 0 });
  }
}

/* src/lib/journey/stages/generic.svelte generated by Svelte v3.55.0 */

function get_each_context$2(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[15] = list[i];
  child_ctx[17] = i;
  return child_ctx;
}

// (71:2) {#if form?.icon}
function create_if_block_2$3(ctx) {
  let div;
  let shieldicon;
  let current;

  shieldicon = new Shield_icon({
    props: {
      classes: 'tw_text-gray-400 tw_fill-current',
      size: '72px',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(shieldicon.$$.fragment);
      attr(div, 'class', 'tw_flex tw_justify-center');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(shieldicon, div, null);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(shieldicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(shieldicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(shieldicon);
    },
  };
}

// (87:2) {#if form?.message}
function create_if_block_1$3(ctx) {
  let alert;
  let current;

  alert = new Alert({
    props: {
      id: formFailureMessageId,
      needsFocus: /*alertNeedsFocus*/ ctx[5],
      type: 'error',
      $$slots: { default: [create_default_slot_2$2] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(alert.$$.fragment);
    },
    m(target, anchor) {
      mount_component(alert, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const alert_changes = {};
      if (dirty & /*alertNeedsFocus*/ 32) alert_changes.needsFocus = /*alertNeedsFocus*/ ctx[5];

      if (dirty & /*$$scope, formMessageKey, form*/ 262210) {
        alert_changes.$$scope = { dirty, ctx };
      }

      alert.$set(alert_changes);
    },
    i(local) {
      if (current) return;
      transition_in(alert.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(alert.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(alert, detaching);
    },
  };
}

// (88:4) <Alert id={formFailureMessageId} needsFocus={alertNeedsFocus} type="error">
function create_default_slot_2$2(ctx) {
  let t_value = interpolate(/*formMessageKey*/ ctx[6], null, /*form*/ ctx[1]?.message) + '';
  let t;

  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (
        dirty & /*formMessageKey, form*/ 66 &&
        t_value !==
          (t_value = interpolate(/*formMessageKey*/ ctx[6], null, /*form*/ ctx[1]?.message) + '')
      )
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (93:2) {#each step?.callbacks as callback, idx}
function create_each_block$2(ctx) {
  let callbackmapper;
  let current;

  callbackmapper = new Callback_mapper({
    props: {
      props: {
        callback: /*callback*/ ctx[15],
        callbackMetadata: /*metadata*/ ctx[3]?.callbacks[/*idx*/ ctx[17]],
        selfSubmitFunction: /*determineSubmission*/ ctx[11],
        stepMetadata: /*metadata*/ ctx[3]?.step && { .../*metadata*/ ctx[3].step },
        style: /*$style*/ ctx[10],
      },
    },
  });

  return {
    c() {
      create_component(callbackmapper.$$.fragment);
    },
    m(target, anchor) {
      mount_component(callbackmapper, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const callbackmapper_changes = {};

      if (dirty & /*step, metadata, $style*/ 1048)
        callbackmapper_changes.props = {
          callback: /*callback*/ ctx[15],
          callbackMetadata: /*metadata*/ ctx[3]?.callbacks[/*idx*/ ctx[17]],
          selfSubmitFunction: /*determineSubmission*/ ctx[11],
          stepMetadata: /*metadata*/ ctx[3]?.step && { .../*metadata*/ ctx[3].step },
          style: /*$style*/ ctx[10],
        };

      callbackmapper.$set(callbackmapper_changes);
    },
    i(local) {
      if (current) return;
      transition_in(callbackmapper.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(callbackmapper.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(callbackmapper, detaching);
    },
  };
}

// (105:2) {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable}
function create_if_block$3(ctx) {
  let button;
  let current;

  button = new Button({
    props: {
      busy: /*journey*/ ctx[2]?.loading,
      style: 'primary',
      type: 'submit',
      width: 'full',
      $$slots: { default: [create_default_slot_1$3] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const button_changes = {};
      if (dirty & /*journey*/ 4) button_changes.busy = /*journey*/ ctx[2]?.loading;

      if (dirty & /*$$scope*/ 262144) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (106:4) <Button busy={journey?.loading} style="primary" type="submit" width="full">
function create_default_slot_1$3(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'nextButton' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (64:0) <Form   bind:formEl   ariaDescribedBy={formAriaDescriptor}   id={formElementId}   needsFocus={formNeedsFocus}   onSubmitWhenValid={submitFormWrapper} >
function create_default_slot$4(ctx) {
  let t0;
  let header;
  let h1;
  let sanitize0;
  let t1;
  let p;
  let sanitize1;
  let t2;
  let t3;
  let t4;
  let t5;
  let backto;
  let current;
  let if_block0 = /*form*/ ctx[1]?.icon && create_if_block_2$3();

  sanitize0 = new Server_strings({
    props: {
      html: true,
      string: /*step*/ ctx[4]?.getHeader() || '',
    },
  });

  sanitize1 = new Server_strings({
    props: {
      html: true,
      string: /*step*/ ctx[4]?.getDescription() || '',
    },
  });

  let if_block1 = /*form*/ ctx[1]?.message && create_if_block_1$3(ctx);
  let each_value = /*step*/ ctx[4]?.callbacks;
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
  }

  const out = (i) =>
    transition_out(each_blocks[i], 1, 1, () => {
      each_blocks[i] = null;
    });

  let if_block2 =
    /*metadata*/ (ctx[3]?.step?.derived.isUserInputOptional ||
      !(/*metadata*/ ctx[3]?.step?.derived.isStepSelfSubmittable)) &&
    create_if_block$3(ctx);
  backto = new Back_to({ props: { journey: /*journey*/ ctx[2] } });

  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      header = element('header');
      h1 = element('h1');
      create_component(sanitize0.$$.fragment);
      t1 = space();
      p = element('p');
      create_component(sanitize1.$$.fragment);
      t2 = space();
      if (if_block1) if_block1.c();
      t3 = space();

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      t4 = space();
      if (if_block2) if_block2.c();
      t5 = space();
      create_component(backto.$$.fragment);
      attr(h1, 'class', 'tw_primary-header dark:tw_primary-header_dark');
      attr(
        p,
        'class',
        'tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light',
      );
      attr(header, 'id', formHeaderId);
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      insert(target, header, anchor);
      append(header, h1);
      mount_component(sanitize0, h1, null);
      append(header, t1);
      append(header, p);
      mount_component(sanitize1, p, null);
      /*header_binding*/ ctx[13](header);
      insert(target, t2, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t3, anchor);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }

      insert(target, t4, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, t5, anchor);
      mount_component(backto, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      if (/*form*/ ctx[1]?.icon) {
        if (if_block0) {
          if (dirty & /*form*/ 2) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2$3();
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();

        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });

        check_outros();
      }

      const sanitize0_changes = {};
      if (dirty & /*step*/ 16) sanitize0_changes.string = /*step*/ ctx[4]?.getHeader() || '';
      sanitize0.$set(sanitize0_changes);
      const sanitize1_changes = {};
      if (dirty & /*step*/ 16) sanitize1_changes.string = /*step*/ ctx[4]?.getDescription() || '';
      sanitize1.$set(sanitize1_changes);

      if (/*form*/ ctx[1]?.message) {
        if (if_block1) {
          if_block1.p(ctx, dirty);

          if (dirty & /*form*/ 2) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_1$3(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(t3.parentNode, t3);
        }
      } else if (if_block1) {
        group_outros();

        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });

        check_outros();
      }

      if (dirty & /*step, metadata, determineSubmission, $style*/ 3096) {
        each_value = /*step*/ ctx[4]?.callbacks;
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$2(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$2(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(t4.parentNode, t4);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }

      if (
        /*metadata*/ ctx[3]?.step?.derived.isUserInputOptional ||
        !(/*metadata*/ ctx[3]?.step?.derived.isStepSelfSubmittable)
      ) {
        if (if_block2) {
          if_block2.p(ctx, dirty);

          if (dirty & /*metadata*/ 8) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block$3(ctx);
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(t5.parentNode, t5);
        }
      } else if (if_block2) {
        group_outros();

        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });

        check_outros();
      }

      const backto_changes = {};
      if (dirty & /*journey*/ 4) backto_changes.journey = /*journey*/ ctx[2];
      backto.$set(backto_changes);
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(sanitize0.$$.fragment, local);
      transition_in(sanitize1.$$.fragment, local);
      transition_in(if_block1);

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      transition_in(if_block2);
      transition_in(backto.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(sanitize0.$$.fragment, local);
      transition_out(sanitize1.$$.fragment, local);
      transition_out(if_block1);
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      transition_out(if_block2);
      transition_out(backto.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t0);
      if (detaching) detach(header);
      destroy_component(sanitize0);
      destroy_component(sanitize1);
      /*header_binding*/ ctx[13](null);
      if (detaching) detach(t2);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(t3);
      destroy_each(each_blocks, detaching);
      if (detaching) detach(t4);
      if (if_block2) if_block2.d(detaching);
      if (detaching) detach(t5);
      destroy_component(backto, detaching);
    },
  };
}

function create_fragment$6(ctx) {
  let form_1;
  let updating_formEl;
  let current;

  function form_1_formEl_binding(value) {
    /*form_1_formEl_binding*/ ctx[14](value);
  }

  let form_1_props = {
    ariaDescribedBy: /*formAriaDescriptor*/ ctx[7],
    id: formElementId,
    needsFocus: /*formNeedsFocus*/ ctx[8],
    onSubmitWhenValid: /*submitFormWrapper*/ ctx[12],
    $$slots: { default: [create_default_slot$4] },
    $$scope: { ctx },
  };

  if (/*formEl*/ ctx[0] !== void 0) {
    form_1_props.formEl = /*formEl*/ ctx[0];
  }

  form_1 = new Form({ props: form_1_props });
  binding_callbacks.push(() => bind(form_1, 'formEl', form_1_formEl_binding, /*formEl*/ ctx[0]));

  return {
    c() {
      create_component(form_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(form_1, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const form_1_changes = {};
      if (dirty & /*formAriaDescriptor*/ 128)
        form_1_changes.ariaDescribedBy = /*formAriaDescriptor*/ ctx[7];
      if (dirty & /*formNeedsFocus*/ 256) form_1_changes.needsFocus = /*formNeedsFocus*/ ctx[8];

      if (
        dirty &
        /*$$scope, journey, metadata, step, $style, alertNeedsFocus, formMessageKey, form, linkWrapper*/ 263806
      ) {
        form_1_changes.$$scope = { dirty, ctx };
      }

      if (!updating_formEl && dirty & /*formEl*/ 1) {
        updating_formEl = true;
        form_1_changes.formEl = /*formEl*/ ctx[0];
        add_flush_callback(() => (updating_formEl = false));
      }

      form_1.$set(form_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(form_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(form_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(form_1, detaching);
    },
  };
}

const formFailureMessageId = 'genericStepFailureMessage';
const formHeaderId = 'genericStepHeader';
const formElementId = 'genericStepForm';

function instance$6($$self, $$props, $$invalidate) {
  let $style;
  component_subscribe($$self, style, ($$value) => $$invalidate(10, ($style = $$value)));
  let { form } = $$props;
  let { formEl = null } = $$props;
  let { journey } = $$props;
  let { metadata } = $$props;
  let { step } = $$props;
  let alertNeedsFocus = false;
  let formMessageKey = '';
  let formAriaDescriptor = 'genericStepHeader';
  let formNeedsFocus = false;
  let linkWrapper;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {
    // The below variation is more liberal, first self-submittable cb to call this wins.
    if (metadata?.step?.derived.isStepSelfSubmittable) {
      submitFormWrapper();
    }
  }

  function submitFormWrapper() {
    $$invalidate(5, (alertNeedsFocus = false));
    $$invalidate(8, (formNeedsFocus = false));
    form?.submit();
  }

  afterUpdate(() => {
    if (form?.message) {
      $$invalidate(7, (formAriaDescriptor = formFailureMessageId));
      $$invalidate(5, (alertNeedsFocus = true));
      $$invalidate(8, (formNeedsFocus = false));
    } else {
      $$invalidate(7, (formAriaDescriptor = formHeaderId));
      $$invalidate(5, (alertNeedsFocus = false));
      $$invalidate(8, (formNeedsFocus = true));
    }
  });

  onMount(() => captureLinks(linkWrapper, journey));

  function header_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      linkWrapper = $$value;
      $$invalidate(9, linkWrapper);
    });
  }

  function form_1_formEl_binding(value) {
    formEl = value;
    $$invalidate(0, formEl);
  }

  $$self.$$set = ($$props) => {
    if ('form' in $$props) $$invalidate(1, (form = $$props.form));
    if ('formEl' in $$props) $$invalidate(0, (formEl = $$props.formEl));
    if ('journey' in $$props) $$invalidate(2, (journey = $$props.journey));
    if ('metadata' in $$props) $$invalidate(3, (metadata = $$props.metadata));
    if ('step' in $$props) $$invalidate(4, (step = $$props.step));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*step, form*/ 18) {
      {
        shouldRedirectFromStep(step) && FRAuth.redirect(step);
        $$invalidate(6, (formMessageKey = convertStringToKey(form?.message)));
      }
    }
  };

  return [
    formEl,
    form,
    journey,
    metadata,
    step,
    alertNeedsFocus,
    formMessageKey,
    formAriaDescriptor,
    formNeedsFocus,
    linkWrapper,
    $style,
    determineSubmission,
    submitFormWrapper,
    header_binding,
    form_1_formEl_binding,
  ];
}

class Generic extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$6, create_fragment$6, safe_not_equal, {
      form: 1,
      formEl: 0,
      journey: 2,
      metadata: 3,
      step: 4,
    });
  }
}

/* src/lib/components/icons/new-user-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$5(ctx) {
  let svg;
  let path0;
  let path1;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path0 = svg_element('path');
      path1 = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(path0, 'd', 'M0 0h24v24H0z');
      attr(path0, 'fill', 'none');
      attr(
        path1,
        'd',
        'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 24 24');
      attr(svg, 'width', /*size*/ ctx[1]);
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path0);
      append(svg, path1);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$5($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class New_user_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$5, create_fragment$5, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/journey/stages/registration.svelte generated by Svelte v3.55.0 */

function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[12] = list[i];
  child_ctx[14] = i;
  return child_ctx;
}

// (44:2) {#if form?.icon}
function create_if_block_2$2(ctx) {
  let div;
  let newusericon;
  let current;

  newusericon = new New_user_icon({
    props: {
      classes: 'tw_text-gray-400 tw_fill-current',
      size: '72px',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(newusericon.$$.fragment);
      attr(div, 'class', 'tw_flex tw_justify-center');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(newusericon, div, null);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(newusericon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(newusericon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(newusericon);
    },
  };
}

// (59:2) {#if form.message}
function create_if_block_1$2(ctx) {
  let alert;
  let current;

  alert = new Alert({
    props: {
      id: 'formFailureMessageAlert',
      needsFocus: /*alertNeedsFocus*/ ctx[5],
      type: 'error',
      $$slots: { default: [create_default_slot_2$1] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(alert.$$.fragment);
    },
    m(target, anchor) {
      mount_component(alert, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const alert_changes = {};
      if (dirty & /*alertNeedsFocus*/ 32) alert_changes.needsFocus = /*alertNeedsFocus*/ ctx[5];

      if (dirty & /*$$scope, formMessageKey, form*/ 32834) {
        alert_changes.$$scope = { dirty, ctx };
      }

      alert.$set(alert_changes);
    },
    i(local) {
      if (current) return;
      transition_in(alert.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(alert.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(alert, detaching);
    },
  };
}

// (60:4) <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
function create_default_slot_2$1(ctx) {
  let t_value = interpolate(/*formMessageKey*/ ctx[6], null, /*form*/ ctx[1]?.message) + '';
  let t;

  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (
        dirty & /*formMessageKey, form*/ 66 &&
        t_value !==
          (t_value = interpolate(/*formMessageKey*/ ctx[6], null, /*form*/ ctx[1]?.message) + '')
      )
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (65:2) {#each step?.callbacks as callback, idx}
function create_each_block$1(ctx) {
  let callbackmapper;
  let current;

  callbackmapper = new Callback_mapper({
    props: {
      props: {
        callback: /*callback*/ ctx[12],
        callbackMetadata: /*metadata*/ ctx[3]?.callbacks[/*idx*/ ctx[14]],
        selfSubmitFunction: /*determineSubmission*/ ctx[9],
        stepMetadata: /*metadata*/ ctx[3]?.step && { .../*metadata*/ ctx[3].step },
        style: /*$style*/ ctx[8],
      },
    },
  });

  return {
    c() {
      create_component(callbackmapper.$$.fragment);
    },
    m(target, anchor) {
      mount_component(callbackmapper, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const callbackmapper_changes = {};

      if (dirty & /*step, metadata, $style*/ 280)
        callbackmapper_changes.props = {
          callback: /*callback*/ ctx[12],
          callbackMetadata: /*metadata*/ ctx[3]?.callbacks[/*idx*/ ctx[14]],
          selfSubmitFunction: /*determineSubmission*/ ctx[9],
          stepMetadata: /*metadata*/ ctx[3]?.step && { .../*metadata*/ ctx[3].step },
          style: /*$style*/ ctx[8],
        };

      callbackmapper.$set(callbackmapper_changes);
    },
    i(local) {
      if (current) return;
      transition_in(callbackmapper.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(callbackmapper.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(callbackmapper, detaching);
    },
  };
}

// (77:2) {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable}
function create_if_block$2(ctx) {
  let button;
  let current;

  button = new Button({
    props: {
      busy: /*journey*/ ctx[2]?.loading,
      style: 'primary',
      type: 'submit',
      width: 'full',
      $$slots: { default: [create_default_slot_1$2] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const button_changes = {};
      if (dirty & /*journey*/ 4) button_changes.busy = /*journey*/ ctx[2]?.loading;

      if (dirty & /*$$scope*/ 32768) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (78:4) <Button busy={journey?.loading} style="primary" type="submit" width="full">
function create_default_slot_1$2(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'registerButton' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (43:0) <Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={form?.submit}>
function create_default_slot$3(ctx) {
  let t0;
  let h1;
  let t1;
  let t2;
  let p;
  let t3;
  let t4;
  let t5;
  let t6;
  let if_block2_anchor;
  let current;
  let if_block0 = /*form*/ ctx[1]?.icon && create_if_block_2$2();
  t1 = new Locale_strings({ props: { key: 'registerHeader' } });

  t3 = new Locale_strings({
    props: { key: 'alreadyHaveAnAccount', html: true },
  });

  let if_block1 = /*form*/ ctx[1].message && create_if_block_1$2(ctx);
  let each_value = /*step*/ ctx[4]?.callbacks;
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
  }

  const out = (i) =>
    transition_out(each_blocks[i], 1, 1, () => {
      each_blocks[i] = null;
    });

  let if_block2 =
    /*metadata*/ (ctx[3]?.step?.derived.isUserInputOptional ||
      !(/*metadata*/ ctx[3]?.step?.derived.isStepSelfSubmittable)) &&
    create_if_block$2(ctx);

  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      h1 = element('h1');
      create_component(t1.$$.fragment);
      t2 = space();
      p = element('p');
      create_component(t3.$$.fragment);
      t4 = space();
      if (if_block1) if_block1.c();
      t5 = space();

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      t6 = space();
      if (if_block2) if_block2.c();
      if_block2_anchor = empty();
      attr(h1, 'class', 'tw_primary-header dark:tw_primary-header_dark');
      attr(
        p,
        'class',
        'tw_text-base tw_text-center tw_-mt-5 tw_mb-2 tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light',
      );
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      insert(target, h1, anchor);
      mount_component(t1, h1, null);
      insert(target, t2, anchor);
      insert(target, p, anchor);
      mount_component(t3, p, null);
      /*p_binding*/ ctx[10](p);
      insert(target, t4, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t5, anchor);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }

      insert(target, t6, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, if_block2_anchor, anchor);
      current = true;
    },
    p(ctx, dirty) {
      if (/*form*/ ctx[1]?.icon) {
        if (if_block0) {
          if (dirty & /*form*/ 2) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2$2();
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();

        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });

        check_outros();
      }

      if (/*form*/ ctx[1].message) {
        if (if_block1) {
          if_block1.p(ctx, dirty);

          if (dirty & /*form*/ 2) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_1$2(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(t5.parentNode, t5);
        }
      } else if (if_block1) {
        group_outros();

        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });

        check_outros();
      }

      if (dirty & /*step, metadata, determineSubmission, $style*/ 792) {
        each_value = /*step*/ ctx[4]?.callbacks;
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context$1(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block$1(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(t6.parentNode, t6);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }

      if (
        /*metadata*/ ctx[3]?.step?.derived.isUserInputOptional ||
        !(/*metadata*/ ctx[3]?.step?.derived.isStepSelfSubmittable)
      ) {
        if (if_block2) {
          if_block2.p(ctx, dirty);

          if (dirty & /*metadata*/ 8) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block$2(ctx);
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
        }
      } else if (if_block2) {
        group_outros();

        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });

        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(t1.$$.fragment, local);
      transition_in(t3.$$.fragment, local);
      transition_in(if_block1);

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      transition_in(if_block2);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(t1.$$.fragment, local);
      transition_out(t3.$$.fragment, local);
      transition_out(if_block1);
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      transition_out(if_block2);
      current = false;
    },
    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t0);
      if (detaching) detach(h1);
      destroy_component(t1);
      if (detaching) detach(t2);
      if (detaching) detach(p);
      destroy_component(t3);
      /*p_binding*/ ctx[10](null);
      if (detaching) detach(t4);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(t5);
      destroy_each(each_blocks, detaching);
      if (detaching) detach(t6);
      if (if_block2) if_block2.d(detaching);
      if (detaching) detach(if_block2_anchor);
    },
  };
}

function create_fragment$4(ctx) {
  let form_1;
  let updating_formEl;
  let current;

  function form_1_formEl_binding(value) {
    /*form_1_formEl_binding*/ ctx[11](value);
  }

  let form_1_props = {
    ariaDescribedBy: 'formFailureMessageAlert',
    onSubmitWhenValid: /*form*/ ctx[1]?.submit,
    $$slots: { default: [create_default_slot$3] },
    $$scope: { ctx },
  };

  if (/*formEl*/ ctx[0] !== void 0) {
    form_1_props.formEl = /*formEl*/ ctx[0];
  }

  form_1 = new Form({ props: form_1_props });
  binding_callbacks.push(() => bind(form_1, 'formEl', form_1_formEl_binding, /*formEl*/ ctx[0]));

  return {
    c() {
      create_component(form_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(form_1, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const form_1_changes = {};
      if (dirty & /*form*/ 2) form_1_changes.onSubmitWhenValid = /*form*/ ctx[1]?.submit;

      if (
        dirty &
        /*$$scope, journey, metadata, step, $style, alertNeedsFocus, formMessageKey, form, linkWrapper*/ 33278
      ) {
        form_1_changes.$$scope = { dirty, ctx };
      }

      if (!updating_formEl && dirty & /*formEl*/ 1) {
        updating_formEl = true;
        form_1_changes.formEl = /*formEl*/ ctx[0];
        add_flush_callback(() => (updating_formEl = false));
      }

      form_1.$set(form_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(form_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(form_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(form_1, detaching);
    },
  };
}

function instance$4($$self, $$props, $$invalidate) {
  let $style;
  component_subscribe($$self, style, ($$value) => $$invalidate(8, ($style = $$value)));
  let { form } = $$props;
  let { formEl = null } = $$props;
  let { journey } = $$props;
  let { metadata } = $$props;
  let { step } = $$props;
  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {
    // The below variation is more liberal first self-submittable cb to call this wins.
    if (metadata?.step?.derived.isStepSelfSubmittable) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    $$invalidate(5, (alertNeedsFocus = !!form?.message));
  });

  onMount(() => captureLinks(linkWrapper, journey));

  function p_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      linkWrapper = $$value;
      $$invalidate(7, linkWrapper);
    });
  }

  function form_1_formEl_binding(value) {
    formEl = value;
    $$invalidate(0, formEl);
  }

  $$self.$$set = ($$props) => {
    if ('form' in $$props) $$invalidate(1, (form = $$props.form));
    if ('formEl' in $$props) $$invalidate(0, (formEl = $$props.formEl));
    if ('journey' in $$props) $$invalidate(2, (journey = $$props.journey));
    if ('metadata' in $$props) $$invalidate(3, (metadata = $$props.metadata));
    if ('step' in $$props) $$invalidate(4, (step = $$props.step));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*form*/ 2) {
      {
        $$invalidate(6, (formMessageKey = convertStringToKey(form?.message)));
      }
    }
  };

  return [
    formEl,
    form,
    journey,
    metadata,
    step,
    alertNeedsFocus,
    formMessageKey,
    linkWrapper,
    $style,
    determineSubmission,
    p_binding,
    form_1_formEl_binding,
  ];
}

class Registration extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$4, create_fragment$4, safe_not_equal, {
      form: 1,
      formEl: 0,
      journey: 2,
      metadata: 3,
      step: 4,
    });
  }
}

/* src/lib/components/icons/key-icon.svelte generated by Svelte v3.55.0 */

function create_fragment$3(ctx) {
  let svg;
  let path0;
  let path1;
  let title;
  let current;
  const default_slot_template = /*#slots*/ ctx[3].default;
  const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

  return {
    c() {
      svg = svg_element('svg');
      path0 = svg_element('path');
      path1 = svg_element('path');
      title = svg_element('title');
      if (default_slot) default_slot.c();
      attr(path0, 'd', 'M0 0h24v24H0z');
      attr(path0, 'fill', 'none');
      attr(
        path1,
        'd',
        'M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
      );
      attr(svg, 'class', /*classes*/ ctx[0]);
      attr(svg, 'height', /*size*/ ctx[1]);
      attr(svg, 'width', /*size*/ ctx[1]);
      attr(svg, 'viewBox', '0 0 24 24');
      attr(svg, 'xmlns', 'http://www.w3.org/2000/svg');
    },
    m(target, anchor) {
      insert(target, svg, anchor);
      append(svg, path0);
      append(svg, path1);
      append(svg, title);

      if (default_slot) {
        default_slot.m(title, null);
      }

      current = true;
    },
    p(ctx, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx,
            /*$$scope*/ ctx[2],
            !current
              ? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
              : get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
            null,
          );
        }
      }

      if (!current || dirty & /*classes*/ 1) {
        attr(svg, 'class', /*classes*/ ctx[0]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'height', /*size*/ ctx[1]);
      }

      if (!current || dirty & /*size*/ 2) {
        attr(svg, 'width', /*size*/ ctx[1]);
      }
    },
    i(local) {
      if (current) return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(svg);
      if (default_slot) default_slot.d(detaching);
    },
  };
}

function instance$3($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let { classes = '' } = $$props;
  let { size = '24px' } = $$props;

  $$self.$$set = ($$props) => {
    if ('classes' in $$props) $$invalidate(0, (classes = $$props.classes));
    if ('size' in $$props) $$invalidate(1, (size = $$props.size));
    if ('$$scope' in $$props) $$invalidate(2, ($$scope = $$props.$$scope));
  };

  return [classes, size, $$scope, slots];
}

class Key_icon extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$3, create_fragment$3, safe_not_equal, { classes: 0, size: 1 });
  }
}

/* src/lib/journey/stages/username-password.svelte generated by Svelte v3.55.0 */

function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[14] = list[i];
  child_ctx[16] = i;
  return child_ctx;
}

// (44:2) {#if form?.icon}
function create_if_block_2$1(ctx) {
  let div;
  let keyicon;
  let current;

  keyicon = new Key_icon({
    props: {
      classes: 'tw_text-gray-400 tw_fill-current',
      size: '72px',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(keyicon.$$.fragment);
      attr(div, 'class', 'tw_flex tw_justify-center');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(keyicon, div, null);
      current = true;
    },
    i(local) {
      if (current) return;
      transition_in(keyicon.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(keyicon.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(keyicon);
    },
  };
}

// (53:2) {#if form?.message}
function create_if_block_1$1(ctx) {
  let alert;
  let current;

  alert = new Alert({
    props: {
      id: 'formFailureMessageAlert',
      needsFocus: /*alertNeedsFocus*/ ctx[5],
      type: 'error',
      $$slots: { default: [create_default_slot_2] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(alert.$$.fragment);
    },
    m(target, anchor) {
      mount_component(alert, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const alert_changes = {};
      if (dirty & /*alertNeedsFocus*/ 32) alert_changes.needsFocus = /*alertNeedsFocus*/ ctx[5];

      if (dirty & /*$$scope, formMessageKey, form*/ 131138) {
        alert_changes.$$scope = { dirty, ctx };
      }

      alert.$set(alert_changes);
    },
    i(local) {
      if (current) return;
      transition_in(alert.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(alert.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(alert, detaching);
    },
  };
}

// (54:4) <Alert id="formFailureMessageAlert" needsFocus={alertNeedsFocus} type="error">
function create_default_slot_2(ctx) {
  let t_value = interpolate(/*formMessageKey*/ ctx[6], null, /*form*/ ctx[1]?.message) + '';
  let t;

  return {
    c() {
      t = text(t_value);
    },
    m(target, anchor) {
      insert(target, t, anchor);
    },
    p(ctx, dirty) {
      if (
        dirty & /*formMessageKey, form*/ 66 &&
        t_value !==
          (t_value = interpolate(/*formMessageKey*/ ctx[6], null, /*form*/ ctx[1]?.message) + '')
      )
        set_data(t, t_value);
    },
    d(detaching) {
      if (detaching) detach(t);
    },
  };
}

// (59:2) {#each step?.callbacks as callback, idx}
function create_each_block(ctx) {
  let callbackmapper;
  let current;

  callbackmapper = new Callback_mapper({
    props: {
      props: {
        callback: /*callback*/ ctx[14],
        callbackMetadata: /*metadata*/ ctx[3]?.callbacks[/*idx*/ ctx[16]],
        selfSubmitFunction: /*determineSubmission*/ ctx[9],
        stepMetadata: /*metadata*/ ctx[3]?.step && { .../*metadata*/ ctx[3].step },
        style: /*$style*/ ctx[8],
      },
    },
  });

  return {
    c() {
      create_component(callbackmapper.$$.fragment);
    },
    m(target, anchor) {
      mount_component(callbackmapper, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const callbackmapper_changes = {};

      if (dirty & /*step, metadata, $style*/ 280)
        callbackmapper_changes.props = {
          callback: /*callback*/ ctx[14],
          callbackMetadata: /*metadata*/ ctx[3]?.callbacks[/*idx*/ ctx[16]],
          selfSubmitFunction: /*determineSubmission*/ ctx[9],
          stepMetadata: /*metadata*/ ctx[3]?.step && { .../*metadata*/ ctx[3].step },
          style: /*$style*/ ctx[8],
        };

      callbackmapper.$set(callbackmapper_changes);
    },
    i(local) {
      if (current) return;
      transition_in(callbackmapper.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(callbackmapper.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(callbackmapper, detaching);
    },
  };
}

// (71:2) {#if metadata?.step?.derived.isUserInputOptional || !metadata?.step?.derived.isStepSelfSubmittable}
function create_if_block$1(ctx) {
  let button;
  let current;

  button = new Button({
    props: {
      busy: /*journey*/ ctx[2]?.loading,
      style: 'primary',
      type: 'submit',
      width: 'full',
      $$slots: { default: [create_default_slot_1$1] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const button_changes = {};
      if (dirty & /*journey*/ 4) button_changes.busy = /*journey*/ ctx[2]?.loading;

      if (dirty & /*$$scope*/ 131072) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(button, detaching);
    },
  };
}

// (72:4) <Button busy={journey?.loading} style="primary" type="submit" width="full">
function create_default_slot_1$1(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'loginButton' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (43:0) <Form bind:formEl ariaDescribedBy="formFailureMessageAlert" onSubmitWhenValid={form?.submit}>
function create_default_slot$2(ctx) {
  let t0;
  let h1;
  let t1;
  let t2;
  let t3;
  let t4;
  let t5;
  let p0;
  let button0;
  let t7;
  let button1;
  let t9;
  let hr;
  let t10;
  let p1;
  let t11;
  let current;
  let mounted;
  let dispose;
  let if_block0 = /*form*/ ctx[1]?.icon && create_if_block_2$1();
  t1 = new Locale_strings({ props: { key: 'loginHeader' } });
  let if_block1 = /*form*/ ctx[1]?.message && create_if_block_1$1(ctx);
  let each_value = /*step*/ ctx[4]?.callbacks;
  let each_blocks = [];

  for (let i = 0; i < each_value.length; i += 1) {
    each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
  }

  const out = (i) =>
    transition_out(each_blocks[i], 1, 1, () => {
      each_blocks[i] = null;
    });

  let if_block2 =
    /*metadata*/ (ctx[3]?.step?.derived.isUserInputOptional ||
      !(/*metadata*/ ctx[3]?.step?.derived.isStepSelfSubmittable)) &&
    create_if_block$1(ctx);

  t11 = new Locale_strings({
    props: { key: 'dontHaveAnAccount', html: true },
  });

  return {
    c() {
      if (if_block0) if_block0.c();
      t0 = space();
      h1 = element('h1');
      create_component(t1.$$.fragment);
      t2 = space();
      if (if_block1) if_block1.c();
      t3 = space();

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }

      t4 = space();
      if (if_block2) if_block2.c();
      t5 = space();
      p0 = element('p');
      button0 = element('button');
      button0.textContent = `${interpolate('forgotPassword', null, 'Forgot Password?')}`;
      t7 = text('\n     \n    ');
      button1 = element('button');
      button1.textContent = `${interpolate('forgotUsername', null, 'Forgot Username?')}`;
      t9 = space();
      hr = element('hr');
      t10 = space();
      p1 = element('p');
      create_component(t11.$$.fragment);
      attr(h1, 'class', 'tw_primary-header dark:tw_primary-header_dark');
      attr(
        p0,
        'class',
        'tw_my-4 tw_text-base tw_text-center tw_text-link-dark dark:tw_text-link-light',
      );
      attr(
        hr,
        'class',
        'tw_border-0 tw_border-b tw_border-secondary-light dark:tw_border-secondary-dark',
      );
      attr(
        p1,
        'class',
        'tw_text-base tw_text-center tw_py-4 tw_text-secondary-dark dark:tw_text-secondary-light',
      );
    },
    m(target, anchor) {
      if (if_block0) if_block0.m(target, anchor);
      insert(target, t0, anchor);
      insert(target, h1, anchor);
      mount_component(t1, h1, null);
      insert(target, t2, anchor);
      if (if_block1) if_block1.m(target, anchor);
      insert(target, t3, anchor);

      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }

      insert(target, t4, anchor);
      if (if_block2) if_block2.m(target, anchor);
      insert(target, t5, anchor);
      insert(target, p0, anchor);
      append(p0, button0);
      append(p0, t7);
      append(p0, button1);
      insert(target, t9, anchor);
      insert(target, hr, anchor);
      insert(target, t10, anchor);
      insert(target, p1, anchor);
      mount_component(t11, p1, null);
      /*p1_binding*/ ctx[12](p1);
      current = true;

      if (!mounted) {
        dispose = [
          listen(button0, 'click', prevent_default(/*click_handler*/ ctx[10])),
          listen(button1, 'click', prevent_default(/*click_handler_1*/ ctx[11])),
        ];

        mounted = true;
      }
    },
    p(ctx, dirty) {
      if (/*form*/ ctx[1]?.icon) {
        if (if_block0) {
          if (dirty & /*form*/ 2) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2$1();
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(t0.parentNode, t0);
        }
      } else if (if_block0) {
        group_outros();

        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });

        check_outros();
      }

      if (/*form*/ ctx[1]?.message) {
        if (if_block1) {
          if_block1.p(ctx, dirty);

          if (dirty & /*form*/ 2) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_1$1(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(t3.parentNode, t3);
        }
      } else if (if_block1) {
        group_outros();

        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });

        check_outros();
      }

      if (dirty & /*step, metadata, determineSubmission, $style*/ 792) {
        each_value = /*step*/ ctx[4]?.callbacks;
        let i;

        for (i = 0; i < each_value.length; i += 1) {
          const child_ctx = get_each_context(ctx, each_value, i);

          if (each_blocks[i]) {
            each_blocks[i].p(child_ctx, dirty);
            transition_in(each_blocks[i], 1);
          } else {
            each_blocks[i] = create_each_block(child_ctx);
            each_blocks[i].c();
            transition_in(each_blocks[i], 1);
            each_blocks[i].m(t4.parentNode, t4);
          }
        }

        group_outros();

        for (i = each_value.length; i < each_blocks.length; i += 1) {
          out(i);
        }

        check_outros();
      }

      if (
        /*metadata*/ ctx[3]?.step?.derived.isUserInputOptional ||
        !(/*metadata*/ ctx[3]?.step?.derived.isStepSelfSubmittable)
      ) {
        if (if_block2) {
          if_block2.p(ctx, dirty);

          if (dirty & /*metadata*/ 8) {
            transition_in(if_block2, 1);
          }
        } else {
          if_block2 = create_if_block$1(ctx);
          if_block2.c();
          transition_in(if_block2, 1);
          if_block2.m(t5.parentNode, t5);
        }
      } else if (if_block2) {
        group_outros();

        transition_out(if_block2, 1, 1, () => {
          if_block2 = null;
        });

        check_outros();
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block0);
      transition_in(t1.$$.fragment, local);
      transition_in(if_block1);

      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }

      transition_in(if_block2);
      transition_in(t11.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      transition_out(t1.$$.fragment, local);
      transition_out(if_block1);
      each_blocks = each_blocks.filter(Boolean);

      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }

      transition_out(if_block2);
      transition_out(t11.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (if_block0) if_block0.d(detaching);
      if (detaching) detach(t0);
      if (detaching) detach(h1);
      destroy_component(t1);
      if (detaching) detach(t2);
      if (if_block1) if_block1.d(detaching);
      if (detaching) detach(t3);
      destroy_each(each_blocks, detaching);
      if (detaching) detach(t4);
      if (if_block2) if_block2.d(detaching);
      if (detaching) detach(t5);
      if (detaching) detach(p0);
      if (detaching) detach(t9);
      if (detaching) detach(hr);
      if (detaching) detach(t10);
      if (detaching) detach(p1);
      destroy_component(t11);
      /*p1_binding*/ ctx[12](null);
      mounted = false;
      run_all(dispose);
    },
  };
}

function create_fragment$2(ctx) {
  let form_1;
  let updating_formEl;
  let current;

  function form_1_formEl_binding(value) {
    /*form_1_formEl_binding*/ ctx[13](value);
  }

  let form_1_props = {
    ariaDescribedBy: 'formFailureMessageAlert',
    onSubmitWhenValid: /*form*/ ctx[1]?.submit,
    $$slots: { default: [create_default_slot$2] },
    $$scope: { ctx },
  };

  if (/*formEl*/ ctx[0] !== void 0) {
    form_1_props.formEl = /*formEl*/ ctx[0];
  }

  form_1 = new Form({ props: form_1_props });
  binding_callbacks.push(() => bind(form_1, 'formEl', form_1_formEl_binding, /*formEl*/ ctx[0]));

  return {
    c() {
      create_component(form_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(form_1, target, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      const form_1_changes = {};
      if (dirty & /*form*/ 2) form_1_changes.onSubmitWhenValid = /*form*/ ctx[1]?.submit;

      if (
        dirty &
        /*$$scope, linkWrapper, journey, metadata, step, $style, alertNeedsFocus, formMessageKey, form*/ 131582
      ) {
        form_1_changes.$$scope = { dirty, ctx };
      }

      if (!updating_formEl && dirty & /*formEl*/ 1) {
        updating_formEl = true;
        form_1_changes.formEl = /*formEl*/ ctx[0];
        add_flush_callback(() => (updating_formEl = false));
      }

      form_1.$set(form_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(form_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(form_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(form_1, detaching);
    },
  };
}

function instance$2($$self, $$props, $$invalidate) {
  let $style;
  component_subscribe($$self, style, ($$value) => $$invalidate(8, ($style = $$value)));
  let { form } = $$props;
  let { formEl = null } = $$props;
  let { journey } = $$props;
  let { metadata } = $$props;
  let { step } = $$props;
  let alertNeedsFocus = false;
  let formMessageKey = '';
  let linkWrapper;

  function determineSubmission() {
    // TODO: the below is more strict; all self-submitting cbs have to complete before submitting
    // if (stepMetadata.isStepSelfSubmittable && isStepReadyToSubmit(callbackMetadataArray)) {
    // The below variation is more liberal first self-submittable cb to call this wins.
    if (metadata?.step?.derived.isStepSelfSubmittable) {
      form?.submit();
    }
  }

  afterUpdate(() => {
    $$invalidate(5, (alertNeedsFocus = !!form?.message));
  });

  onMount(() => captureLinks(linkWrapper, journey));

  const click_handler = () => {
    journey.push({ tree: 'ResetPassword' });
  };

  const click_handler_1 = () => {
    journey.push({ tree: 'ForgottenUsername' });
  };

  function p1_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      linkWrapper = $$value;
      $$invalidate(7, linkWrapper);
    });
  }

  function form_1_formEl_binding(value) {
    formEl = value;
    $$invalidate(0, formEl);
  }

  $$self.$$set = ($$props) => {
    if ('form' in $$props) $$invalidate(1, (form = $$props.form));
    if ('formEl' in $$props) $$invalidate(0, (formEl = $$props.formEl));
    if ('journey' in $$props) $$invalidate(2, (journey = $$props.journey));
    if ('metadata' in $$props) $$invalidate(3, (metadata = $$props.metadata));
    if ('step' in $$props) $$invalidate(4, (step = $$props.step));
  };

  $$self.$$.update = () => {
    if ($$self.$$.dirty & /*form*/ 2) {
      {
        $$invalidate(6, (formMessageKey = convertStringToKey(form?.message)));
      }
    }
  };

  return [
    formEl,
    form,
    journey,
    metadata,
    step,
    alertNeedsFocus,
    formMessageKey,
    linkWrapper,
    $style,
    determineSubmission,
    click_handler,
    click_handler_1,
    p1_binding,
    form_1_formEl_binding,
  ];
}

class Username_password extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$2, create_fragment$2, safe_not_equal, {
      form: 1,
      formEl: 0,
      journey: 2,
      metadata: 3,
      step: 4,
    });
  }
}

function mapStepToStage(currentStep) {
  /** *********************************************************************
   * SDK INTEGRATION POINT
   * Summary:SDK step method for getting the stage value
   * ----------------------------------------------------------------------
   * Details: This method is helpful in quickly identifying the stage
   * when you want to provide special layout or handling of the form
   ********************************************************************* */
  if (!currentStep || currentStep.type !== 'Step') {
    return Generic;
  }
  switch (currentStep?.getStage && currentStep.getStage()) {
    case 'Registration':
      return Registration;
    case 'UsernamePassword':
      return Username_password;
    default:
      return Generic;
  }
}

/* src/lib/journey/journey.svelte generated by Svelte v3.55.0 */

function create_else_block(ctx) {
  let alert;
  let t;
  let button;
  let current;

  alert = new Alert({
    props: {
      id: 'unrecoverableStepError',
      needsFocus: /*alertNeedsFocus*/ ctx[3],
      type: 'error',
      $$slots: { default: [create_default_slot_1] },
      $$scope: { ctx },
    },
  });

  button = new Button({
    props: {
      style: 'secondary',
      onClick: /*tryAgain*/ ctx[6],
      $$slots: { default: [create_default_slot$1] },
      $$scope: { ctx },
    },
  });

  return {
    c() {
      create_component(alert.$$.fragment);
      t = space();
      create_component(button.$$.fragment);
    },
    m(target, anchor) {
      mount_component(alert, target, anchor);
      insert(target, t, anchor);
      mount_component(button, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const alert_changes = {};
      if (dirty & /*alertNeedsFocus*/ 8) alert_changes.needsFocus = /*alertNeedsFocus*/ ctx[3];

      if (dirty & /*$$scope*/ 256) {
        alert_changes.$$scope = { dirty, ctx };
      }

      alert.$set(alert_changes);
      const button_changes = {};

      if (dirty & /*$$scope*/ 256) {
        button_changes.$$scope = { dirty, ctx };
      }

      button.$set(button_changes);
    },
    i(local) {
      if (current) return;
      transition_in(alert.$$.fragment, local);
      transition_in(button.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(alert.$$.fragment, local);
      transition_out(button.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(alert, detaching);
      if (detaching) detach(t);
      destroy_component(button, detaching);
    },
  };
}

// (51:36)
function create_if_block_3(ctx) {
  let div;
  let spinner;
  let current;

  spinner = new Spinner({
    props: {
      colorClass: 'tw_text-primary-light',
      layoutClasses: 'tw_h-28 tw_w-28',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(spinner.$$.fragment);
      attr(div, 'class', 'tw_text-center tw_w-full tw_py-4');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(spinner, div, null);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(spinner.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(spinner);
    },
  };
}

// (26:0) {#if !$journeyStore?.completed}
function create_if_block(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block_1, create_if_block_2];
  const if_blocks = [];

  function select_block_type_1(ctx, dirty) {
    if (!(/*$journeyStore*/ ctx[4].step)) return 0;
    if (/*$journeyStore*/ ctx[4].step.type === StepType.Step) return 1;
    return -1;
  }

  if (~(current_block_type_index = select_block_type_1(ctx))) {
    if_block = if_blocks[current_block_type_index] =
      if_block_creators[current_block_type_index](ctx);
  }

  return {
    c() {
      if (if_block) if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].m(target, anchor);
      }

      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, dirty) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type_1(ctx);

      if (current_block_type_index === previous_block_index) {
        if (~current_block_type_index) {
          if_blocks[current_block_type_index].p(ctx, dirty);
        }
      } else {
        if (if_block) {
          group_outros();

          transition_out(if_blocks[previous_block_index], 1, 1, () => {
            if_blocks[previous_block_index] = null;
          });

          check_outros();
        }

        if (~current_block_type_index) {
          if_block = if_blocks[current_block_type_index];

          if (!if_block) {
            if_block = if_blocks[current_block_type_index] =
              if_block_creators[current_block_type_index](ctx);
            if_block.c();
          } else {
            if_block.p(ctx, dirty);
          }

          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        } else {
          if_block = null;
        }
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (~current_block_type_index) {
        if_blocks[current_block_type_index].d(detaching);
      }

      if (detaching) detach(if_block_anchor);
    },
  };
}

// (56:2) <Alert id="unrecoverableStepError" needsFocus={alertNeedsFocus} type="error">
function create_default_slot_1(ctx) {
  let t;
  let current;

  t = new Locale_strings({
    props: { html: true, key: 'unrecoverableError' },
  });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (59:2) <Button style="secondary" onClick={tryAgain}>
function create_default_slot$1(ctx) {
  let t;
  let current;
  t = new Locale_strings({ props: { key: 'tryAgain' } });

  return {
    c() {
      create_component(t.$$.fragment);
    },
    m(target, anchor) {
      mount_component(t, target, anchor);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(t.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(t.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(t, detaching);
    },
  };
}

// (31:54)
function create_if_block_2(ctx) {
  let switch_instance;
  let updating_formEl;
  let switch_instance_anchor;
  let current;

  function switch_instance_formEl_binding(value) {
    /*switch_instance_formEl_binding*/ ctx[7](value);
  }

  var switch_value = mapStepToStage(/*$journeyStore*/ ctx[4].step);

  function switch_props(ctx) {
    let switch_instance_props = {
      form: {
        icon: /*displayIcon*/ ctx[1],
        message: /*$journeyStore*/ ctx[4].error?.message || '',
        status: /*$journeyStore*/ ctx[4].error?.code ? 'error' : 'ok',
        submit: /*submitForm*/ ctx[5],
      },
      journey: {
        loading: /*$journeyStore*/ ctx[4].loading,
        pop: /*journeyStore*/ ctx[2].pop,
        push: /*journeyStore*/ ctx[2].push,
        stack,
      },
      metadata: /*$journeyStore*/ ctx[4].metadata,
      step: /*$journeyStore*/ ctx[4].step,
    };

    if (/*formEl*/ ctx[0] !== void 0) {
      switch_instance_props.formEl = /*formEl*/ ctx[0];
    }

    return { props: switch_instance_props };
  }

  if (switch_value) {
    switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
    binding_callbacks.push(() =>
      bind(switch_instance, 'formEl', switch_instance_formEl_binding, /*formEl*/ ctx[0]),
    );
  }

  return {
    c() {
      if (switch_instance) create_component(switch_instance.$$.fragment);
      switch_instance_anchor = empty();
    },
    m(target, anchor) {
      if (switch_instance) mount_component(switch_instance, target, anchor);
      insert(target, switch_instance_anchor, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const switch_instance_changes = {};

      if (dirty & /*displayIcon, $journeyStore*/ 18)
        switch_instance_changes.form = {
          icon: /*displayIcon*/ ctx[1],
          message: /*$journeyStore*/ ctx[4].error?.message || '',
          status: /*$journeyStore*/ ctx[4].error?.code ? 'error' : 'ok',
          submit: /*submitForm*/ ctx[5],
        };

      if (dirty & /*$journeyStore, journeyStore*/ 20)
        switch_instance_changes.journey = {
          loading: /*$journeyStore*/ ctx[4].loading,
          pop: /*journeyStore*/ ctx[2].pop,
          push: /*journeyStore*/ ctx[2].push,
          stack,
        };

      if (dirty & /*$journeyStore*/ 16)
        switch_instance_changes.metadata = /*$journeyStore*/ ctx[4].metadata;
      if (dirty & /*$journeyStore*/ 16)
        switch_instance_changes.step = /*$journeyStore*/ ctx[4].step;

      if (!updating_formEl && dirty & /*formEl*/ 1) {
        updating_formEl = true;
        switch_instance_changes.formEl = /*formEl*/ ctx[0];
        add_flush_callback(() => (updating_formEl = false));
      }

      if (switch_value !== (switch_value = mapStepToStage(/*$journeyStore*/ ctx[4].step))) {
        if (switch_instance) {
          group_outros();
          const old_component = switch_instance;

          transition_out(old_component.$$.fragment, 1, 0, () => {
            destroy_component(old_component, 1);
          });

          check_outros();
        }

        if (switch_value) {
          switch_instance = construct_svelte_component(switch_value, switch_props(ctx));
          binding_callbacks.push(() =>
            bind(switch_instance, 'formEl', switch_instance_formEl_binding, /*formEl*/ ctx[0]),
          );
          create_component(switch_instance.$$.fragment);
          transition_in(switch_instance.$$.fragment, 1);
          mount_component(
            switch_instance,
            switch_instance_anchor.parentNode,
            switch_instance_anchor,
          );
        } else {
          switch_instance = null;
        }
      } else if (switch_value) {
        switch_instance.$set(switch_instance_changes);
      }
    },
    i(local) {
      if (current) return;
      if (switch_instance) transition_in(switch_instance.$$.fragment, local);
      current = true;
    },
    o(local) {
      if (switch_instance) transition_out(switch_instance.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(switch_instance_anchor);
      if (switch_instance) destroy_component(switch_instance, detaching);
    },
  };
}

// (27:2) {#if !$journeyStore.step}
function create_if_block_1(ctx) {
  let div;
  let spinner;
  let current;

  spinner = new Spinner({
    props: {
      colorClass: 'tw_text-primary-light',
      layoutClasses: 'tw_h-28 tw_w-28',
    },
  });

  return {
    c() {
      div = element('div');
      create_component(spinner.$$.fragment);
      attr(div, 'class', 'tw_text-center tw_w-full tw_py-4');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(spinner, div, null);
      current = true;
    },
    p: noop,
    i(local) {
      if (current) return;
      transition_in(spinner.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(spinner.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      destroy_component(spinner);
    },
  };
}

function create_fragment$1(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block, create_if_block_3, create_else_block];
  const if_blocks = [];

  function select_block_type(ctx, dirty) {
    if (!(/*$journeyStore*/ ctx[4]?.completed)) return 0;
    if (/*$journeyStore*/ ctx[4]?.successful) return 1;
    return 2;
  }

  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx, [dirty]) {
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx);

      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx, dirty);
      } else {
        group_outros();

        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });

        check_outros();
        if_block = if_blocks[current_block_type_index];

        if (!if_block) {
          if_block = if_blocks[current_block_type_index] =
            if_block_creators[current_block_type_index](ctx);
          if_block.c();
        } else {
          if_block.p(ctx, dirty);
        }

        transition_in(if_block, 1);
        if_block.m(if_block_anchor.parentNode, if_block_anchor);
      }
    },
    i(local) {
      if (current) return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching) detach(if_block_anchor);
    },
  };
}

function instance$1($$self, $$props, $$invalidate) {
  let $journeyStore,
    $$unsubscribe_journeyStore = noop,
    $$subscribe_journeyStore = () => (
      $$unsubscribe_journeyStore(),
      ($$unsubscribe_journeyStore = subscribe(journeyStore, ($$value) =>
        $$invalidate(4, ($journeyStore = $$value)),
      )),
      journeyStore
    );

  $$self.$$.on_destroy.push(() => $$unsubscribe_journeyStore());
  let { displayIcon } = $$props;
  let { formEl = null } = $$props;
  let { journeyStore } = $$props;
  $$subscribe_journeyStore();
  let alertNeedsFocus = false;

  function submitForm() {
    // Get next step, passing previous step with new data
    journeyStore?.next($journeyStore.step);
  }

  function tryAgain() {
    journeyStore?.reset();
    journeyStore?.next();
  }

  afterUpdate(() => {
    $$invalidate(3, (alertNeedsFocus = !$journeyStore.successful));
  });

  function switch_instance_formEl_binding(value) {
    formEl = value;
    $$invalidate(0, formEl);
  }

  $$self.$$set = ($$props) => {
    if ('displayIcon' in $$props) $$invalidate(1, (displayIcon = $$props.displayIcon));
    if ('formEl' in $$props) $$invalidate(0, (formEl = $$props.formEl));
    if ('journeyStore' in $$props)
      $$subscribe_journeyStore($$invalidate(2, (journeyStore = $$props.journeyStore)));
  };

  return [
    formEl,
    displayIcon,
    journeyStore,
    alertNeedsFocus,
    $journeyStore,
    submitForm,
    tryAgain,
    switch_instance_formEl_binding,
  ];
}

class Journey extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance$1, create_fragment$1, safe_not_equal, {
      displayIcon: 1,
      formEl: 0,
      journeyStore: 2,
    });
  }
}

/**
 * Configure underlying SDK
 */
const configSchema = mod
  .object({
    callbackFactory: mod
      .function()
      .args(
        mod.object({
          _id: mod.number().optional(),
          input: mod
            .array(
              mod.object({
                name: mod.string(),
                value: mod.unknown(),
              }),
            )
            .optional(),
          output: mod.array(
            mod.object({
              name: mod.string(),
              value: mod.unknown(),
            }),
          ),
          type: mod.nativeEnum(CallbackType),
        }),
      )
      .returns(mod.instanceof(FRCallback))
      .optional(),
    clientId: mod.string().optional(),
    middleware: mod.array(mod.function()).optional(),
    realmPath: mod.string(),
    redirectUri: mod.string().optional(),
    scope: mod.string().optional(),
    serverConfig: mod.object({
      baseUrl: mod.string(),
      paths: mod
        .object({
          authenticate: mod.string(),
          authorize: mod.string(),
          accessToken: mod.string(),
          endSession: mod.string(),
          userInfo: mod.string(),
          revoke: mod.string(),
          sessions: mod.string(),
        })
        .optional(),
      timeout: mod.number(), // TODO: Should be optional; fix in SDK
    }),
    support: mod.union([mod.literal('legacy'), mod.literal('modern')]).optional(),
    tokenStore: mod
      .union([
        mod.object({
          get: mod
            .function()
            .args(mod.string())
            .returns(
              mod.promise(
                mod.object({
                  accessToken: mod.string(),
                  idToken: mod.string().optional(),
                  refreshToken: mod.string().optional(),
                  tokenExpiry: mod.number().optional(),
                }),
              ),
            ),
          set: mod.function().args(mod.string()).returns(mod.promise(mod.void())),
          remove: mod.function().args(mod.string()).returns(mod.promise(mod.void())),
        }),
        mod.literal('indexedDB'),
        mod.literal('sessionStorage'),
        mod.literal('localStorage'),
      ])
      .optional(),
    tree: mod.string().optional(),
    type: mod.string().optional(),
    oauthThreshold: mod.number().optional(),
  })
  .strict();
configSchema.partial();
// const defaultPaths = {
//   authenticate: 'authenticate',
//   authorize: 'authorize',
//   accessToken: 'tokens',
//   endSession: 'end-session',
//   userInfo: 'userinfo',
//   revoke: 'revoke',
//   sessions: 'sessions',
// };
function configure(config) {
  configSchema.parse(config);
  Config.set(config);
}

function initialize$1(initOptions) {
  const { set, subscribe } = writable({
    completed: false,
    error: null,
    loading: false,
    successful: false,
    response: null,
  });
  async function get(getOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
     */
    const options = {
      ...{ query: { prompt: 'none' } },
      ...initOptions,
      ...getOptions,
    };
    let tokens;
    try {
      tokens = await TokenManager.getTokens(options);
    } catch (err) {
      console.error(`Get tokens | ${err}`);
      if (err instanceof Error) {
        set({
          completed: true,
          error: {
            message: err.message,
          },
          loading: false,
          successful: false,
          response: null,
        });
      }
      return;
    }
    set({
      completed: true,
      error: null,
      loading: false,
      successful: true,
      response: tokens,
    });
  }
  function reset() {
    set({
      completed: false,
      error: null,
      loading: false,
      successful: false,
      response: null,
    });
  }
  return {
    get,
    reset,
    subscribe,
  };
}

function initialize(initOptions) {
  const { set, subscribe } = writable({
    completed: false,
    error: null,
    loading: false,
    successful: false,
    response: null,
  });
  async function get(getOptions) {
    /**
     * Create an options object with getOptions overriding anything from initOptions
     * TODO: Does this object merge need to be more granular?
     */
    const options = {
      ...initOptions,
      ...getOptions,
    };
    try {
      const user = await UserManager.getCurrentUser(options);
      set({
        completed: true,
        error: null,
        loading: false,
        successful: true,
        response: user,
      });
    } catch (err) {
      console.error(`Get current user | ${err}`);
      if (err instanceof Error) {
        set({
          completed: true,
          error: {
            message: err.message,
          },
          loading: false,
          successful: false,
          response: null,
        });
      }
    }
  }
  function reset() {
    set({
      completed: false,
      error: null,
      loading: false,
      successful: false,
      response: null,
    });
  }
  return {
    get,
    reset,
    subscribe,
  };
}

/* src/lib/widget/modal.svelte generated by Svelte v3.55.0 */

function create_default_slot(ctx) {
  let journey_1;
  let updating_formEl;
  let current;

  function journey_1_formEl_binding(value) {
    /*journey_1_formEl_binding*/ ctx[10](value);
  }

  let journey_1_props = {
    displayIcon: /*style*/ ctx[0]?.stage?.icon ?? !(/*style*/ ctx[0]?.logo),
    journeyStore: /*_journeyStore*/ ctx[5],
  };

  if (/*formEl*/ ctx[3] !== void 0) {
    journey_1_props.formEl = /*formEl*/ ctx[3];
  }

  journey_1 = new Journey({ props: journey_1_props });
  binding_callbacks.push(() =>
    bind(journey_1, 'formEl', journey_1_formEl_binding, /*formEl*/ ctx[3]),
  );

  return {
    c() {
      create_component(journey_1.$$.fragment);
    },
    m(target, anchor) {
      mount_component(journey_1, target, anchor);
      current = true;
    },
    p(ctx, dirty) {
      const journey_1_changes = {};
      if (dirty & /*style*/ 1)
        journey_1_changes.displayIcon = /*style*/ ctx[0]?.stage?.icon ?? !(/*style*/ ctx[0]?.logo);

      if (!updating_formEl && dirty & /*formEl*/ 8) {
        updating_formEl = true;
        journey_1_changes.formEl = /*formEl*/ ctx[3];
        add_flush_callback(() => (updating_formEl = false));
      }

      journey_1.$set(journey_1_changes);
    },
    i(local) {
      if (current) return;
      transition_in(journey_1.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(journey_1.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(journey_1, detaching);
    },
  };
}

function create_fragment(ctx) {
  let div;
  let dialog;
  let updating_dialogEl;
  let current;

  function dialog_dialogEl_binding(value) {
    /*dialog_dialogEl_binding*/ ctx[11](value);
  }

  let dialog_props = {
    closeCallback: /*_closeCallback*/ ctx[4],
    dialogId: 'sampleDialog',
    $$slots: { default: [create_default_slot] },
    $$scope: { ctx },
  };

  if (/*_dialogEl*/ ctx[2] !== void 0) {
    dialog_props.dialogEl = /*_dialogEl*/ ctx[2];
  }

  dialog = new Dialog({ props: dialog_props });
  binding_callbacks.push(() =>
    bind(dialog, 'dialogEl', dialog_dialogEl_binding, /*_dialogEl*/ ctx[2]),
  );
  /*dialog_binding*/ ctx[12](dialog);

  return {
    c() {
      div = element('div');
      create_component(dialog.$$.fragment);
      attr(div, 'class', 'fr_widget-root');
    },
    m(target, anchor) {
      insert(target, div, anchor);
      mount_component(dialog, div, null);
      current = true;
    },
    p(ctx, [dirty]) {
      const dialog_changes = {};

      if (dirty & /*$$scope, style, formEl*/ 65545) {
        dialog_changes.$$scope = { dirty, ctx };
      }

      if (!updating_dialogEl && dirty & /*_dialogEl*/ 4) {
        updating_dialogEl = true;
        dialog_changes.dialogEl = /*_dialogEl*/ ctx[2];
        add_flush_callback(() => (updating_dialogEl = false));
      }

      dialog.$set(dialog_changes);
    },
    i(local) {
      if (current) return;
      transition_in(dialog.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(dialog.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching) detach(div);
      /*dialog_binding*/ ctx[12](null);
      destroy_component(dialog);
    },
  };
}

let dialogComp;
let dialogEl;
let callMounted;
let closeCallback;
let journeyStore;
let oauthStore;
let returnError;
let returnResponse;
let userStore;

const journey = {
  start(options) {
    const requestsOauth = options?.oauth || true;
    const requestsUser = options?.user || true;
    let journey;
    let oauth;

    let journeyStoreUnsub = journeyStore.subscribe((response) => {
      if (!requestsOauth && response.successful) {
        returnResponse && returnResponse({ journey: response });
        modal.close({ reason: 'auto' });
      } else if (requestsOauth && response.successful) {
        journey = response;
        oauthStore.get({ forceRenew: true });
      } else if (response.error) {
        journey = response;
        returnError && returnError({ journey: response });
      }

      /**
       * Clean up unneeded subscription, but only when it's successful
       * Leaving the subscription allows for the journey to be
       * restarted internally.
       */
      if (response.successful) {
        journeyStoreUnsub();
      }
    });

    let oauthStoreUnsub = oauthStore.subscribe((response) => {
      if (!requestsUser && response.successful) {
        returnResponse && returnResponse({ journey, oauth: response });
        modal.close({ reason: 'auto' });
      } else if (requestsUser && response.successful) {
        oauth = response;
        userStore.get();
      } else if (response.error) {
        oauth = response;
        returnError && returnError({ journey, oauth: response });
      }

      /**
       * Clean up unneeded subscription, but only when it's successful
       * Leaving the subscription allows for the journey to be
       * restarted internally.
       */
      if (response.successful) {
        oauthStoreUnsub();
      }
    });

    let userStoreUnsub = userStore.subscribe((response) => {
      if (response.successful) {
        returnResponse && returnResponse({ journey, oauth, user: response });
        modal.close({ reason: 'auto' });
      } else if (response.error) {
        returnError && returnError({ journey, oauth, user: response });
      }

      /**
       * Clean up unneeded subscription, but only when it's successful
       * Leaving the subscription allows for the journey to be
       * restarted internally.
       */
      if (response.successful) {
        userStoreUnsub();
      }
    });

    if (options?.resumeUrl) {
      journeyStore.resume(options.resumeUrl);
    } else {
      journeyStore.start({
        ...options?.config,
        tree: options?.journey,
      });
    }
  },
  onFailure(fn) {
    returnError = (response) => fn(response);
  },
  onSuccess(fn) {
    returnResponse = (response) => fn(response);
  },
};

const modal = {
  close(args) {
    dialogComp.closeDialog(args);
  },
  onClose(fn) {
    closeCallback = (args) => fn(args);
  },
  onMount(fn) {
    callMounted = (dialog, form) => fn(dialog, form);
  },
  open(options) {
    // If journey does not have a step, start the journey
    if (!get_store_value(journeyStore).step) {
      journey.start(options);
    }

    dialogEl.showModal();
  },
};

const request = async (options) => {
  return await HttpClient.request(options);
};

const user = {
  async authorized(remote = false) {
    if (remote) {
      return !!(await UserManager.getCurrentUser());
    }

    return !!(await TokenManager.getTokens());
  },
  async info(remote = false) {
    if (remote) {
      return await UserManager.getCurrentUser();
    }

    return get_store_value(userStore).response;
  },
  async logout() {
    const { clientId } = Config.get();

    /**
     * If configuration has a clientId, then use FRUser to logout to ensure
     * token revoking and removal; else, just end the session.
     */
    if (clientId) {
      // Call SDK logout
      await FRUser.logout();
    } else {
      await SessionManager.logout();
    }

    // Reset stores
    journeyStore.reset();

    oauthStore.reset();
    userStore.reset();

    // Fetch fresh journey step
    journey.start();
  },
  async tokens(options) {
    return await TokenManager.getTokens(options);
  },
};

function instance($$self, $$props, $$invalidate) {
  let { config } = $$props;
  let { content } = $$props;
  let { journeys = undefined } = $$props;
  let { links = undefined } = $$props;
  let { style = undefined } = $$props;
  const dispatch = createEventDispatcher();

  // Reference to the closeCallback from the above module context
  let _closeCallback = closeCallback;

  // Variables that reference the Svelte component and the DOM element
  // Variables with `_` reference points to the same variables from the `context="module"`
  let _dialogComp;

  let _dialogEl;

  // The single refernce to the `form` DOM element
  let formEl;

  // Set base config to SDK
  // TODO: Move to a shared utility
  configure({
    // Set some basics by default
    ...{
      // TODO: Could this be a default OAuth client provided by Platform UI OOTB?
      clientId: 'WebLoginWidgetClient',
      // TODO: If a realmPath is not provided, should we call the realm endpoint and detect a likely default?
      // https://backstage.forgerock.com/docs/am/7/setup-guide/sec-rest-realm-rest.html#rest-api-list-realm
      realmPath: 'alpha',
      // TODO: Once we move to SSR, this default should be more intelligent
      redirectUri:
        typeof window === 'object' ? window.location.href : 'https://localhost:3000/callback',
      scope: 'openid email',
    },
    // Let user provided config override defaults
    ...config,
    // Force 'legacy' to remove confusion
    ...{ support: 'legacy' },
  });

  /**
   * Initialize the stores and ensure both variables point to the same reference.
   * Variables with _ are the reactive version of the original variable from above.
   */
  let _journeyStore = (journeyStore = initialize$4(config));

  oauthStore = initialize$1(config);
  userStore = initialize(config);
  initialize$6(content);
  initialize$3(journeys);
  initialize$2(links);
  initialize$5(style);

  onMount(() => {
    dialogComp = _dialogComp;
    dialogEl = _dialogEl;

    /**
     * Call mounted event for Singleton users
     */
    callMounted && callMounted(_dialogEl, formEl);

    /**
     * Call mounted event for Instance users
     * NOTE: needs to be wrapped in setTimeout. Asked in Svelte Discord
     * if this is an issue or expected. Answer: Object instantiation seems
     * to be synchronous, so this doesn't get called without `setTimeout`.
     */
    setTimeout(() => {
      dispatch('modal-mount', 'Modal mounted');
    }, 0);
  });

  function journey_1_formEl_binding(value) {
    formEl = value;
    $$invalidate(3, formEl);
  }

  function dialog_dialogEl_binding(value) {
    _dialogEl = value;
    $$invalidate(2, _dialogEl);
  }

  function dialog_binding($$value) {
    binding_callbacks[$$value ? 'unshift' : 'push'](() => {
      _dialogComp = $$value;
      $$invalidate(1, _dialogComp);
    });
  }

  $$self.$$set = ($$props) => {
    if ('config' in $$props) $$invalidate(6, (config = $$props.config));
    if ('content' in $$props) $$invalidate(7, (content = $$props.content));
    if ('journeys' in $$props) $$invalidate(8, (journeys = $$props.journeys));
    if ('links' in $$props) $$invalidate(9, (links = $$props.links));
    if ('style' in $$props) $$invalidate(0, (style = $$props.style));
  };

  return [
    style,
    _dialogComp,
    _dialogEl,
    formEl,
    _closeCallback,
    _journeyStore,
    config,
    content,
    journeys,
    links,
    journey_1_formEl_binding,
    dialog_dialogEl_binding,
    dialog_binding,
  ];
}

class Modal extends SvelteComponent {
  constructor(options) {
    super();

    init(this, options, instance, create_fragment, safe_not_equal, {
      config: 6,
      content: 7,
      journeys: 8,
      links: 9,
      style: 0,
    });
  }
}

export { Modal as default, journey, modal, request, user };
//# sourceMappingURL=modal.js.map
