(function(QUnit) {
  let router = null;
  let location = null;
  let lastRoute = null;
  let lastArgs = [];

  const onRoute = function(routerParam, route, args) {
    lastRoute = route;
    lastArgs = args;
  };

  const Location = function(href) {
    this.replace(href);
  };

  _.extend(Location.prototype, {

    parser: document.createElement('a'),

    replace(href) {
      this.parser.href = href;
      _.extend(this, _.pick(this.parser,
        'href',
        'hash',
        'host',
        'search',
        'fragment',
        'pathname',
        'protocol'
      ));

      // In IE, anchor.pathname does not contain a leading slash though
      // window.location.pathname does.
      if (!/^\//.test(this.pathname)) this.pathname = `/${this.pathname}`;
    },

    toString() {
      return this.href;
    }

  });

  QUnit.module('Backbone.Router', {

    beforeEach() {
      location = new Location('http://example.com');
      Backbone.history = _.extend(new Backbone.History(), {location});
      router = new Router({testing: 101});
      Backbone.history.interval = 9;
      Backbone.history.start({pushState: false});
      lastRoute = null;
      lastArgs = [];
      Backbone.history.on('route', onRoute);
    },

    afterEach() {
      Backbone.history.stop();
      Backbone.history.off('route', onRoute);
    }

  });

  const ExternalObject = {
    value: 'unset',

    routingFunction(value) {
      this.value = value;
    }
  };
  ExternalObject.routingFunction = _.bind(ExternalObject.routingFunction, ExternalObject);

  const Router = Backbone.Router.extend({

    count: 0,

    routes: {
      'noCallback': 'noCallback',
      'counter': 'counter',
      'search/:query': 'search',
      'search/:query/p:page': 'search',
      'charñ': 'charUTF',
      'char%C3%B1': 'charEscaped',
      'contacts': 'contacts',
      'contacts/new': 'newContact',
      'contacts/:id': 'loadContact',
      'route-event/:arg': 'routeEvent',
      'optional(/:item)': 'optionalItem',
      'named/optional/(y:z)': 'namedOptional',
      'splat/*args/end': 'splat',
      ':repo/compare/*from...*to': 'github',
      'decode/:named/*splat': 'decode',
      '*first/complex-*part/*rest': 'complex',
      'query/:entity': 'query',
      'function/:value': ExternalObject.routingFunction,
      '*anything': 'anything'
    },

    preinitialize(options) {
      this.testpreinit = 'foo';
    },

    initialize(options) {
      this.testing = options.testing;
      this.route('implicit', 'implicit');
    },

    counter() {
      this.count++;
    },

    implicit() {
      this.count++;
    },

    search(query, page) {
      this.query = query;
      this.page = page;
    },

    charUTF() {
      this.charType = 'UTF';
    },

    charEscaped() {
      this.charType = 'escaped';
    },

    contacts() {
      this.contact = 'index';
    },

    newContact() {
      this.contact = 'new';
    },

    loadContact() {
      this.contact = 'load';
    },

    optionalItem(arg) {
      this.arg = arg !== void 0 ? arg : null;
    },

    splat(args) {
      this.args = args;
    },

    github(repo, from, to) {
      this.repo = repo;
      this.from = from;
      this.to = to;
    },

    complex(first, part, rest) {
      this.first = first;
      this.part = part;
      this.rest = rest;
    },

    query(entity, args) {
      this.entity = entity;
      this.queryArgs = args;
    },

    anything(whatever) {
      this.anything = whatever;
    },

    namedOptional(z) {
      this.z = z;
    },

    decode(named, path) {
      this.named = named;
      this.path = path;
    },

    routeEvent(arg) {
    }

  });

  QUnit.test('initialize', (assert) => {
    assert.expect(1);
    assert.equal(router.testing, 101);
  });

  QUnit.test('preinitialize', (assert) => {
    assert.expect(1);
    assert.equal(router.testpreinit, 'foo');
  });

  QUnit.test('routes (simple)', (assert) => {
    assert.expect(4);
    location.replace('http://example.com#search/news');
    Backbone.history.checkUrl();
    assert.equal(router.query, 'news');
    assert.equal(router.page, void 0);
    assert.equal(lastRoute, 'search');
    assert.equal(lastArgs[0], 'news');
  });

  QUnit.test('routes (simple, but unicode)', (assert) => {
    assert.expect(4);
    location.replace('http://example.com#search/тест');
    Backbone.history.checkUrl();
    assert.equal(router.query, 'тест');
    assert.equal(router.page, void 0);
    assert.equal(lastRoute, 'search');
    assert.equal(lastArgs[0], 'тест');
  });

  QUnit.test('routes (two part)', (assert) => {
    assert.expect(2);
    location.replace('http://example.com#search/nyc/p10');
    Backbone.history.checkUrl();
    assert.equal(router.query, 'nyc');
    assert.equal(router.page, '10');
  });

  QUnit.test('routes via navigate', (assert) => {
    assert.expect(2);
    Backbone.history.navigate('search/manhattan/p20', {trigger: true});
    assert.equal(router.query, 'manhattan');
    assert.equal(router.page, '20');
  });

  QUnit.test('routes via navigate with params', (assert) => {
    assert.expect(1);
    Backbone.history.navigate('query/test?a=b', {trigger: true});
    assert.equal(router.queryArgs, 'a=b');
  });

  QUnit.test('routes via navigate for backwards-compatibility', (assert) => {
    assert.expect(2);
    Backbone.history.navigate('search/manhattan/p20', true);
    assert.equal(router.query, 'manhattan');
    assert.equal(router.page, '20');
  });

  QUnit.test('reports matched route via nagivate', (assert) => {
    assert.expect(1);
    assert.ok(Backbone.history.navigate('search/manhattan/p20', true));
  });

  QUnit.test('route precedence via navigate', (assert) => {
    assert.expect(6);

    // Check both 0.9.x and backwards-compatibility options
    _.each([{trigger: true}, true], (options) => {
      Backbone.history.navigate('contacts', options);
      assert.equal(router.contact, 'index');
      Backbone.history.navigate('contacts/new', options);
      assert.equal(router.contact, 'new');
      Backbone.history.navigate('contacts/foo', options);
      assert.equal(router.contact, 'load');
    });
  });

  QUnit.test('loadUrl is not called for identical routes.', (assert) => {
    assert.expect(0);
    Backbone.history.loadUrl = function() { assert.ok(false); };
    location.replace('http://example.com#route');
    Backbone.history.navigate('route');
    Backbone.history.navigate('/route');
    Backbone.history.navigate('/route');
  });

  QUnit.test('use implicit callback if none provided', (assert) => {
    assert.expect(1);
    router.count = 0;
    router.navigate('implicit', {trigger: true});
    assert.equal(router.count, 1);
  });

  QUnit.test('routes via navigate with {replace: true}', (assert) => {
    assert.expect(1);
    location.replace('http://example.com#start_here');
    Backbone.history.checkUrl();
    location.replace = function(href) {
      assert.strictEqual(href, new Location('http://example.com#end_here').href);
    };
    Backbone.history.navigate('end_here', {replace: true});
  });

  QUnit.test('routes (splats)', (assert) => {
    assert.expect(1);
    location.replace('http://example.com#splat/long-list/of/splatted_99args/end');
    Backbone.history.checkUrl();
    assert.equal(router.args, 'long-list/of/splatted_99args');
  });

  QUnit.test('routes (github)', (assert) => {
    assert.expect(3);
    location.replace('http://example.com#backbone/compare/1.0...braddunbar:with/slash');
    Backbone.history.checkUrl();
    assert.equal(router.repo, 'backbone');
    assert.equal(router.from, '1.0');
    assert.equal(router.to, 'braddunbar:with/slash');
  });

  QUnit.test('routes (optional)', (assert) => {
    assert.expect(2);
    location.replace('http://example.com#optional');
    Backbone.history.checkUrl();
    assert.ok(!router.arg);
    location.replace('http://example.com#optional/thing');
    Backbone.history.checkUrl();
    assert.equal(router.arg, 'thing');
  });

  QUnit.test('routes (complex)', (assert) => {
    assert.expect(3);
    location.replace('http://example.com#one/two/three/complex-part/four/five/six/seven');
    Backbone.history.checkUrl();
    assert.equal(router.first, 'one/two/three');
    assert.equal(router.part, 'part');
    assert.equal(router.rest, 'four/five/six/seven');
  });

  QUnit.test('routes (query)', (assert) => {
    assert.expect(5);
    location.replace('http://example.com#query/mandel?a=b&c=d');
    Backbone.history.checkUrl();
    assert.equal(router.entity, 'mandel');
    assert.equal(router.queryArgs, 'a=b&c=d');
    assert.equal(lastRoute, 'query');
    assert.equal(lastArgs[0], 'mandel');
    assert.equal(lastArgs[1], 'a=b&c=d');
  });

  QUnit.test('routes (anything)', (assert) => {
    assert.expect(1);
    location.replace('http://example.com#doesnt-match-a-route');
    Backbone.history.checkUrl();
    assert.equal(router.anything, 'doesnt-match-a-route');
  });

  QUnit.test('routes (function)', (assert) => {
    assert.expect(3);
    router.on('route', (name) => {
      assert.ok(name === '');
    });
    assert.equal(ExternalObject.value, 'unset');
    location.replace('http://example.com#function/set');
    Backbone.history.checkUrl();
    assert.equal(ExternalObject.value, 'set');
  });

  QUnit.test('Decode named parameters, not splats.', (assert) => {
    assert.expect(2);
    location.replace('http://example.com#decode/a%2Fb/c%2Fd/e');
    Backbone.history.checkUrl();
    assert.strictEqual(router.named, 'a/b');
    assert.strictEqual(router.path, 'c/d/e');
  });

  QUnit.test('fires event when router doesn\'t have callback on it', (assert) => {
    assert.expect(1);
    router.on('route:noCallback', () => { assert.ok(true); });
    location.replace('http://example.com#noCallback');
    Backbone.history.checkUrl();
  });

  QUnit.test('No events are triggered if #execute returns false.', (assert) => {
    assert.expect(1);
    const MyRouter = Backbone.Router.extend({

      routes: {
        foo() {
          assert.ok(true);
        }
      },

      execute(callback, args) {
        callback.apply(this, args);
        return false;
      }

    });

    const myRouter = new MyRouter();

    myRouter.on('route route:foo', () => {
      assert.ok(false);
    });

    Backbone.history.on('route', () => {
      assert.ok(false);
    });

    location.replace('http://example.com#foo');
    Backbone.history.checkUrl();
  });

  QUnit.test('#933, #908 - leading slash', (assert) => {
    assert.expect(2);
    location.replace('http://example.com/root/foo');

    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({root: '/root', hashChange: false, silent: true});
    assert.strictEqual(Backbone.history.getFragment(), 'foo');

    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({root: '/root/', hashChange: false, silent: true});
    assert.strictEqual(Backbone.history.getFragment(), 'foo');
  });

  QUnit.test('#967 - Route callback gets passed encoded values.', (assert) => {
    assert.expect(3);
    const route = 'has%2Fslash/complex-has%23hash/has%20space';
    Backbone.history.navigate(route, {trigger: true});
    assert.strictEqual(router.first, 'has/slash');
    assert.strictEqual(router.part, 'has#hash');
    assert.strictEqual(router.rest, 'has space');
  });

  QUnit.test('correctly handles URLs with % (#868)', (assert) => {
    assert.expect(3);
    location.replace('http://example.com#search/fat%3A1.5%25');
    Backbone.history.checkUrl();
    location.replace('http://example.com#search/fat');
    Backbone.history.checkUrl();
    assert.equal(router.query, 'fat');
    assert.equal(router.page, void 0);
    assert.equal(lastRoute, 'search');
  });

  QUnit.test('#2666 - Hashes with UTF8 in them.', (assert) => {
    assert.expect(2);
    Backbone.history.navigate('charñ', {trigger: true});
    assert.equal(router.charType, 'UTF');
    Backbone.history.navigate('char%C3%B1', {trigger: true});
    assert.equal(router.charType, 'UTF');
  });

  QUnit.test('#1185 - Use pathname when hashChange is not wanted.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/path/name#hash');
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({hashChange: false});
    const fragment = Backbone.history.getFragment();
    assert.strictEqual(fragment, location.pathname.replace(/^\//, ''));
  });

  QUnit.test('#1206 - Strip leading slash before location.assign.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root/');
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({hashChange: false, root: '/root/'});
    location.assign = function(pathname) {
      assert.strictEqual(pathname, '/root/fragment');
    };
    Backbone.history.navigate('/fragment');
  });

  QUnit.test('#1387 - Root fragment without trailing slash.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root');
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({hashChange: false, root: '/root/', silent: true});
    assert.strictEqual(Backbone.history.getFragment(), '');
  });

  QUnit.test('#1366 - History does not prepend root to fragment.', (assert) => {
    assert.expect(2);
    Backbone.history.stop();
    location.replace('http://example.com/root/');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root/x');
        }
      }
    });
    Backbone.history.start({
      root: '/root/',
      pushState: true,
      hashChange: false
    });
    Backbone.history.navigate('x');
    assert.strictEqual(Backbone.history.fragment, 'x');
  });

  QUnit.test('Normalize root.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root/fragment');
        }
      }
    });
    Backbone.history.start({
      pushState: true,
      root: '/root',
      hashChange: false
    });
    Backbone.history.navigate('fragment');
  });

  QUnit.test('Normalize root.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root#fragment');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {},
        replaceState(state, title, url) {
          assert.strictEqual(url, '/root/fragment');
        }
      }
    });
    Backbone.history.start({
      pushState: true,
      root: '/root'
    });
  });

  QUnit.test('Normalize root.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root');
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.loadUrl = function() { assert.ok(true); };
    Backbone.history.start({
      pushState: true,
      root: '/root'
    });
  });

  QUnit.test('Normalize root - leading slash.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() {},
        replaceState() {}
      }
    });
    Backbone.history.start({root: 'root'});
    assert.strictEqual(Backbone.history.root, '/root/');
  });

  QUnit.test('Transition from hashChange to pushState.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root#x/y');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() {},
        replaceState(state, title, url) {
          assert.strictEqual(url, '/root/x/y');
        }
      }
    });
    Backbone.history.start({
      root: 'root',
      pushState: true
    });
  });

  QUnit.test('#1619: Router: Normalize empty root', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() {},
        replaceState() {}
      }
    });
    Backbone.history.start({root: ''});
    assert.strictEqual(Backbone.history.root, '/');
  });

  QUnit.test('#1619: Router: nagivate with empty root', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/fragment');
        }
      }
    });
    Backbone.history.start({
      pushState: true,
      root: '',
      hashChange: false
    });
    Backbone.history.navigate('fragment');
  });

  QUnit.test('Transition from pushState to hashChange.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root/x/y?a=b');
    location.replace = function(url) {
      assert.strictEqual(url, '/root#x/y?a=b');
    };
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState: null,
        replaceState: null
      }
    });
    Backbone.history.start({
      root: 'root',
      pushState: true
    });
  });

  QUnit.test('#1695 - hashChange to pushState with search.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root#x/y?a=b');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() {},
        replaceState(state, title, url) {
          assert.strictEqual(url, '/root/x/y?a=b');
        }
      }
    });
    Backbone.history.start({
      root: 'root',
      pushState: true
    });
  });

  QUnit.test('#1746 - Router allows empty route.', (assert) => {
    assert.expect(1);
    const MyRouter = Backbone.Router.extend({
      routes: {'': 'empty'},
      empty() {},
      route(route) {
        assert.strictEqual(route, '');
      }
    });
    new MyRouter();
  });

  QUnit.test('#1794 - Trailing space in fragments.', (assert) => {
    assert.expect(1);
    const history = new Backbone.History();
    assert.strictEqual(history.getFragment('fragment   '), 'fragment');
  });

  QUnit.test('#1820 - Leading slash and trailing space.', (assert) => {
    assert.expect(1);
    const history = new Backbone.History();
    assert.strictEqual(history.getFragment('/fragment '), 'fragment');
  });

  QUnit.test('#1980 - Optional parameters.', (assert) => {
    assert.expect(2);
    location.replace('http://example.com#named/optional/y');
    Backbone.history.checkUrl();
    assert.strictEqual(router.z, undefined);
    location.replace('http://example.com#named/optional/y123');
    Backbone.history.checkUrl();
    assert.strictEqual(router.z, '123');
  });

  QUnit.test('#2062 - Trigger "route" event on router instance.', (assert) => {
    assert.expect(2);
    router.on('route', (name, args) => {
      assert.strictEqual(name, 'routeEvent');
      assert.deepEqual(args, ['x', null]);
    });
    location.replace('http://example.com#route-event/x');
    Backbone.history.checkUrl();
  });

  QUnit.test('#2255 - Extend routes by making routes a function.', (assert) => {
    assert.expect(1);
    const RouterBase = Backbone.Router.extend({
      routes() {
        return {
          home: 'root',
          index: 'index.html'
        };
      }
    });

    const RouterExtended = RouterBase.extend({
      routes() {
        const _super = RouterExtended.__super__.routes;
        return _.extend(_super(), {show: 'show', search: 'search'});
      }
    });

    const myRouter = new RouterExtended();
    assert.deepEqual({home: 'root', index: 'index.html', show: 'show', search: 'search'}, myRouter.routes);
  });

  QUnit.test('#2538 - hashChange to pushState only if both requested.', (assert) => {
    assert.expect(0);
    Backbone.history.stop();
    location.replace('http://example.com/root?a=b#x/y');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() {},
        replaceState() { assert.ok(false); }
      }
    });
    Backbone.history.start({
      root: 'root',
      pushState: true,
      hashChange: false
    });
  });

  QUnit.test('No hash fallback.', (assert) => {
    assert.expect(0);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() {},
        replaceState() {}
      }
    });

    const MyRouter = Backbone.Router.extend({
      routes: {
        hash() { assert.ok(false); }
      }
    });
    const myRouter = new MyRouter();

    location.replace('http://example.com/');
    Backbone.history.start({
      pushState: true,
      hashChange: false
    });
    location.replace('http://example.com/nomatch#hash');
    Backbone.history.checkUrl();
  });

  QUnit.test('#2656 - No trailing slash on root.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Backbone.history.start({pushState: true, hashChange: false, root: 'root'});
    Backbone.history.navigate('');
  });

  QUnit.test('#2656 - No trailing slash on root.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/');
        }
      }
    });
    location.replace('http://example.com/path');
    Backbone.history.start({pushState: true, hashChange: false});
    Backbone.history.navigate('');
  });

  QUnit.test('#2656 - No trailing slash on root.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/root?x=1');
        }
      }
    });
    location.replace('http://example.com/root/path');
    Backbone.history.start({pushState: true, hashChange: false, root: 'root'});
    Backbone.history.navigate('?x=1');
  });

  QUnit.test('#2765 - Fragment matching sans query/hash.', (assert) => {
    assert.expect(2);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState(state, title, url) {
          assert.strictEqual(url, '/path?query#hash');
        }
      }
    });

    const MyRouter = Backbone.Router.extend({
      routes: {
        path() { assert.ok(true); }
      }
    });
    const myRouter = new MyRouter();

    location.replace('http://example.com/');
    Backbone.history.start({pushState: true, hashChange: false});
    Backbone.history.navigate('path?query#hash', true);
  });

  QUnit.test('Do not decode the search params.', (assert) => {
    assert.expect(1);
    const MyRouter = Backbone.Router.extend({
      routes: {
        path(params) {
          assert.strictEqual(params, 'x=y%3Fz');
        }
      }
    });
    const myRouter = new MyRouter();
    Backbone.history.navigate('path?x=y%3Fz', true);
  });

  QUnit.test('Navigate to a hash url.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({pushState: true});
    const MyRouter = Backbone.Router.extend({
      routes: {
        path(params) {
          assert.strictEqual(params, 'x=y');
        }
      }
    });
    const myRouter = new MyRouter();
    location.replace('http://example.com/path?x=y#hash');
    Backbone.history.checkUrl();
  });

  QUnit.test('#navigate to a hash url.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    Backbone.history.start({pushState: true});
    const MyRouter = Backbone.Router.extend({
      routes: {
        path(params) {
          assert.strictEqual(params, 'x=y');
        }
      }
    });
    const myRouter = new MyRouter();
    Backbone.history.navigate('path?x=y#hash', true);
  });

  QUnit.test('unicode pathname', (assert) => {
    assert.expect(1);
    location.replace('http://example.com/myyjä');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {
        myyjä() {
          assert.ok(true);
        }
      }
    });
    new MyRouter();
    Backbone.history.start({pushState: true});
  });

  QUnit.test('unicode pathname with % in a parameter', (assert) => {
    assert.expect(1);
    location.replace('http://example.com/myyjä/foo%20%25%3F%2f%40%25%20bar');
    location.pathname = '/myyj%C3%A4/foo%20%25%3F%2f%40%25%20bar';
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {
        'myyjä/:query'(query) {
          assert.strictEqual(query, 'foo %?/@% bar');
        }
      }
    });
    new MyRouter();
    Backbone.history.start({pushState: true});
  });

  QUnit.test('newline in route', (assert) => {
    assert.expect(1);
    location.replace('http://example.com/stuff%0Anonsense?param=foo%0Abar');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {
        'stuff\nnonsense'() {
          assert.ok(true);
        }
      }
    });
    new MyRouter();
    Backbone.history.start({pushState: true});
  });

  QUnit.test('Router#execute receives callback, args, name.', (assert) => {
    assert.expect(3);
    location.replace('http://example.com#foo/123/bar?x=y');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {'foo/:id/bar': 'foo'},
      foo() {},
      execute(callback, args, name) {
        assert.strictEqual(callback, this.foo);
        assert.deepEqual(args, ['123', 'x=y']);
        assert.strictEqual(name, 'foo');
      }
    });
    const myRouter = new MyRouter();
    Backbone.history.start();
  });

  QUnit.test('pushState to hashChange with only search params.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com?a=b');
    location.replace = function(url) {
      assert.strictEqual(url, '/#?a=b');
    };
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: null
    });
    Backbone.history.start({pushState: true});
  });

  QUnit.test('#3123 - History#navigate decodes before comparison.', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/shop/search?keyword=short%20dress');
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState() { assert.ok(false); },
        replaceState() { assert.ok(false); }
      }
    });
    Backbone.history.start({pushState: true});
    Backbone.history.navigate('shop/search?keyword=short%20dress', true);
    assert.strictEqual(Backbone.history.fragment, 'shop/search?keyword=short dress');
  });

  QUnit.test('#3175 - Urls in the params', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com#login?a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    Backbone.history = _.extend(new Backbone.History(), {location});
    const myRouter = new Backbone.Router();
    myRouter.route('login', (params) => {
      assert.strictEqual(params, 'a=value&backUrl=https%3A%2F%2Fwww.msn.com%2Fidp%2Fidpdemo%3Fspid%3Dspdemo%26target%3Db');
    });
    Backbone.history.start();
  });

  QUnit.test('#3358 - pushState to hashChange transition with search params', (assert) => {
    assert.expect(1);
    Backbone.history.stop();
    location.replace('http://example.com/root?foo=bar');
    location.replace = function(url) {
      assert.strictEqual(url, '/root#?foo=bar');
    };
    Backbone.history = _.extend(new Backbone.History(), {
      location,
      history: {
        pushState: undefined,
        replaceState: undefined
      }
    });
    Backbone.history.start({root: '/root', pushState: true});
  });

  QUnit.test('Paths that don\'t match the root should not match no root', (assert) => {
    assert.expect(0);
    location.replace('http://example.com/foo');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {
        foo() {
          assert.ok(false, 'should not match unless root matches');
        }
      }
    });
    const myRouter = new MyRouter();
    Backbone.history.start({root: 'root', pushState: true});
  });

  QUnit.test('Paths that don\'t match the root should not match roots of the same length', (assert) => {
    assert.expect(0);
    location.replace('http://example.com/xxxx/foo');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {
        foo() {
          assert.ok(false, 'should not match unless root matches');
        }
      }
    });
    const myRouter = new MyRouter();
    Backbone.history.start({root: 'root', pushState: true});
  });

  QUnit.test('roots with regex characters', (assert) => {
    assert.expect(1);
    location.replace('http://example.com/x+y.z/foo');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {foo() { assert.ok(true); }}
    });
    const myRouter = new MyRouter();
    Backbone.history.start({root: 'x+y.z', pushState: true});
  });

  QUnit.test('roots with unicode characters', (assert) => {
    assert.expect(1);
    location.replace('http://example.com/®ooτ/foo');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {foo() { assert.ok(true); }}
    });
    const myRouter = new MyRouter();
    Backbone.history.start({root: '®ooτ', pushState: true});
  });

  QUnit.test('roots without slash', (assert) => {
    assert.expect(1);
    location.replace('http://example.com/®ooτ');
    Backbone.history.stop();
    Backbone.history = _.extend(new Backbone.History(), {location});
    const MyRouter = Backbone.Router.extend({
      routes: {''() { assert.ok(true); }}
    });
    const myRouter = new MyRouter();
    Backbone.history.start({root: '®ooτ', pushState: true});
  });

  QUnit.test('#4025 - navigate updates URL hash as is', (assert) => {
    assert.expect(1);
    const route = 'search/has%20space';
    Backbone.history.navigate(route);
    assert.strictEqual(location.hash, `#${route}`);
  });
})(QUnit);
