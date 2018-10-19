"use strict";

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _lodash = require("lodash");

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _webpack = require("webpack");

var _webpack2 = _interopRequireDefault(_webpack);

var _dotenv = require("dotenv");

var _dotenv2 = _interopRequireDefault(_dotenv);

var _webpackConfigurator = require("webpack-configurator");

var _webpackConfigurator2 = _interopRequireDefault(_webpackConfigurator);

var _staticSiteGeneratorWebpackPlugin = require("static-site-generator-webpack-plugin");

var _staticSiteGeneratorWebpackPlugin2 = _interopRequireDefault(_staticSiteGeneratorWebpackPlugin);

var _webpackStatsPlugin = require("webpack-stats-plugin");

var _friendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");

var _friendlyErrorsWebpackPlugin2 = _interopRequireDefault(_friendlyErrorsWebpackPlugin);

var _gatsby1ConfigCssModules = require("gatsby-1-config-css-modules");

var _gatsby1ConfigExtractPlugin = require("gatsby-1-config-extract-plugin");

var _webpackModifyValidate = require("./webpack-modify-validate");

var _webpackModifyValidate2 = _interopRequireDefault(_webpackModifyValidate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require(`v8-compile-cache`);

// This isn't working right it seems.
// import WebpackStableModuleIdAndHash from 'webpack-stable-module-id-and-hash'

var _require = require(`../redux`),
    store = _require.store;

var debug = require(`debug`)(`gatsby:webpack-config`);
var WebpackMD5Hash = require(`webpack-md5-hash`);
var ChunkManifestPlugin = require(`chunk-manifest-webpack-plugin`);
var GatsbyModulePlugin = require(`gatsby-module-loader/plugin`);
var genBabelConfig = require(`./babel-config`);

var _require2 = require(`./path`),
    withBasePath = _require2.withBasePath;

var HashedChunkIdsPlugin = require(`./hashed-chunk-ids-plugin`);

// Five stages or modes:
//   1) develop: for `gatsby develop` command, hot reload and CSS injection into page
//   2) develop-html: same as develop without react-hmre in the babel config for html renderer
//   3) build-css: build styles.css file
//   4) build-html: build all HTML files
//   5) build-javascript: Build js chunks for Single Page App in production

module.exports = function () {
  var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(program, directory, suppliedStage) {
    var webpackPort = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1500;
    var pages = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
    var directoryPath, stage, babelConfig, noUglify, processEnv, getHmrPath, output, entry, plugins, resolve, devtool, module, resolveLoader, config, validatedConfig;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            resolveLoader = function resolveLoader() {
              var root = [_path2.default.resolve(directory, `node_modules`)];

              var userLoaderDirectoryPath = _path2.default.resolve(directory, `loaders`);

              try {
                if (_fs2.default.statSync(userLoaderDirectoryPath).isDirectory()) {
                  root.push(userLoaderDirectoryPath);
                }
              } catch (e) {
                if (e && e.code !== `ENOENT`) {
                  console.log(e);
                }
              }

              return {
                root,
                modulesDirectories: [_path2.default.join(__dirname, `../loaders`), `node_modules`]
              };
            };

            module = function module(config) {
              // Common config for every env.
              config.loader(`js`, {
                test: /\.jsx?$/, // Accept either .js or .jsx files.
                exclude: /(node_modules|bower_components)/,
                loader: `babel`,
                query: babelConfig
              });
              config.loader(`json`, {
                test: /\.json$/,
                loaders: [`json`]
              });
              config.loader(`yaml`, {
                test: /\.ya?ml/,
                loaders: [`json`, `yaml`]
              });

              // "file" loader makes sure those assets end up in the `public` folder.
              // When you `import` an asset, you get its filename.
              config.loader(`file-loader`, {
                test: /\.(ico|eot|otf|webp|pdf|ttf|woff(2)?)(\?.*)?$/,
                loader: `file`,
                query: {
                  name: `static/[name].[hash:8].[ext]`
                }
              });
              // "url" loader works just like "file" loader but it also embeds
              // assets smaller than specified size as data URLs to avoid requests.
              config.loader(`url-loader`, {
                test: /\.(svg|jpg|jpeg|png|gif|mp4|webm|wav|mp3|m4a|aac|oga)(\?.*)?$/,
                loader: `url-loader`,
                query: {
                  limit: 10000,
                  name: `static/[name].[hash:8].[ext]`
                }
              });

              switch (stage) {
                case `develop`:
                  config.loader(`css`, {
                    test: /\.css$/,
                    exclude: /\.module\.css$/,
                    loaders: [`style`, `css`, `postcss`]
                  });

                  // CSS modules
                  config.loader(`cssModules`, {
                    test: /\.module\.css$/,
                    loaders: [`style`, (0, _gatsby1ConfigCssModules.cssModulesConfig)(stage), `postcss`]
                  });

                  config.merge({
                    postcss(wp) {
                      return [require(`postcss-import`)({ addDependencyTo: wp }), require(`postcss-cssnext`)({ browsers: program.browserslist }), require(`postcss-browser-reporter`), require(`postcss-reporter`)];
                    }
                  });
                  return config;

                case `build-css`:
                  config.loader(`css`, {
                    test: /\.css$/,
                    exclude: /\.module\.css$/,
                    loader: (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage).extract([`css?minimize`, `postcss`])
                  });

                  // CSS modules
                  config.loader(`cssModules`, {
                    test: /\.module\.css$/,
                    loader: (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage).extract(`style`, [(0, _gatsby1ConfigCssModules.cssModulesConfig)(stage), `postcss`])
                  });
                  config.merge({
                    postcss: [require(`postcss-import`)(), require(`postcss-cssnext`)({
                      browsers: program.browserslist
                    })]
                  });
                  return config;

                case `build-html`:
                case `develop-html`:
                  // We don't deal with CSS at all when building the HTML.
                  // The 'null' loader is used to prevent 'module not found' errors.
                  // On the other hand CSS modules loaders are necessary.

                  config.loader(`css`, {
                    test: /\.css$/,
                    exclude: /\.module\.css$/,
                    loader: `null`
                  });

                  // CSS modules
                  config.loader(`cssModules`, {
                    test: /\.module\.css$/,
                    loader: (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage).extract(`style`, [(0, _gatsby1ConfigCssModules.cssModulesConfig)(stage), `postcss`])
                  });

                  return config;

                case `build-javascript`:
                  // we don't deal with css at all when building the javascript.  but
                  // still need to process the css so offline-plugin knows about the
                  // various assets referenced in your css.
                  //
                  // It's also necessary to process CSS Modules so your JS knows the
                  // classNames to use.

                  config.loader(`css`, {
                    test: /\.css$/,
                    exclude: /\.module\.css$/,
                    // loader: `null`,
                    loader: (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage).extract([`css`])
                  });

                  // CSS modules
                  config.loader(`cssModules`, {
                    test: /\.module\.css$/,
                    loader: (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage).extract(`style`, [(0, _gatsby1ConfigCssModules.cssModulesConfig)(stage), `postcss`])
                  });

                  return config;

                default:
                  return config;
              }
            };

            devtool = function devtool() {
              switch (stage) {
                case `develop`:
                  return `cheap-module-source-map`;
                // use a normal `source-map` for the html phases since
                // it gives better line and column numbers
                case `develop-html`:
                case `build-html`:
                case `build-javascript`:
                  return `source-map`;
                default:
                  return false;
              }
            };

            resolve = function resolve() {
              var _store$getState = store.getState(),
                  program = _store$getState.program;

              return {
                // Use the program's extension list (generated via the
                // 'resolvableExtensions' API hook).
                extensions: [``].concat(program.extensions),
                // Default to using the site's node_modules directory to look for
                // modules. But also make it possible to install modules within the src
                // directory if you need to install a specific version of a module for a
                // part of your site.
                modulesDirectories: [`node_modules`, directoryPath(`node_modules`), directoryPath(`node_modules`, `gatsby`, `node_modules`)]
              };
            };

            plugins = function plugins() {
              switch (stage) {
                case `develop`:
                  return [new _webpack2.default.optimize.OccurenceOrderPlugin(), new _webpack2.default.HotModuleReplacementPlugin(), new _webpack2.default.NoErrorsPlugin(), new _webpack2.default.DefinePlugin({
                    "process.env": processEnv(stage, `development`),
                    __PREFIX_PATHS__: program.prefixPaths,
                    __PATH_PREFIX__: JSON.stringify(store.getState().config.pathPrefix),
                    __POLYFILL__: store.getState().config.polyfill
                  }),
                  // Names module ids with their filepath. We use this in development
                  // to make it easier to see what modules have hot reloaded, etc. as
                  // the numerical IDs aren't useful. In production we use numerical module
                  // ids to reduce filesize.
                  new _webpack2.default.NamedModulesPlugin(), new _friendlyErrorsWebpackPlugin2.default({
                    clearConsole: false
                    // compilationSuccessInfo: {
                    // messages: [
                    // `You can now view your site in the browser running at http://${program.host}:${program.port}`,
                    // `Your graphql debugger is running at http://${program.host}:${program.port}/___graphql`,
                    // ],
                    // },
                  })];
                case `develop-html`:
                  return [new _staticSiteGeneratorWebpackPlugin2.default({
                    entry: `render-page.js`,
                    paths: pages
                  }), new _webpack2.default.DefinePlugin({
                    "process.env": processEnv(stage, `development`),
                    __PREFIX_PATHS__: program.prefixPaths,
                    __PATH_PREFIX__: JSON.stringify(store.getState().config.pathPrefix),
                    __POLYFILL__: store.getState().config.polyfill
                  }), (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage)];
                case `build-css`:
                  return [new _webpack2.default.DefinePlugin({
                    "process.env": processEnv(stage, `production`),
                    __PREFIX_PATHS__: program.prefixPaths,
                    __PATH_PREFIX__: JSON.stringify(store.getState().config.pathPrefix),
                    __POLYFILL__: store.getState().config.polyfill
                  }), (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage)];
                case `build-html`:
                  return [new _staticSiteGeneratorWebpackPlugin2.default({
                    entry: `render-page.js`,
                    paths: pages
                  }), new _webpack2.default.DefinePlugin({
                    "process.env": processEnv(stage, `production`),
                    __PREFIX_PATHS__: program.prefixPaths,
                    __PATH_PREFIX__: JSON.stringify(store.getState().config.pathPrefix),
                    __POLYFILL__: store.getState().config.polyfill
                  }), (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage)];
                case `build-javascript`:
                  {
                    // Get array of page template component names.
                    var components = store.getState().pages.map(function (page) {
                      return page.componentChunkName;
                    });
                    components = (0, _lodash.uniq)(components);
                    var _plugins = [
                    // Moment.js includes 100s of KBs of extra localization data by
                    // default in Webpack that most sites don't want. This line disables
                    // loading locale modules. This is a practical solution that requires
                    // the user to opt into importing specific locales.
                    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
                    new _webpack2.default.IgnorePlugin(/^\.\/locale$/, /moment$/), new WebpackMD5Hash(),
                    // new webpack.optimize.DedupePlugin(),
                    // Extract "commons" chunk from the app entry and all
                    // page components.
                    new _webpack2.default.optimize.CommonsChunkPlugin({
                      name: `commons`,
                      chunks: [`app`].concat(components),
                      // The more page components there are, the higher we raise the bar
                      // for merging in page-specific JS libs into the commons chunk. The
                      // two principles here is a) keep the TTI (time to interaction) as
                      // low as possible so that means keeping commons.js small with
                      // critical framework code (e.g. React/react-router) and b) is we
                      // want to push JS parse/eval work as close as possible to when
                      // it's used. Since most people don't navigate to most pages, take
                      // tradeoff of loading/evaling modules multiple times over
                      // loading/evaling lots of unused code on the initial opening of
                      // the app.
                      minChunks: function minChunks(module, count) {
                        var vendorModuleList = [`react`, `react-dom`, `fbjs`, `react-router`, `react-router-dom`, `gatsby-react-router-scroll`, `dom-helpers`, // Used in gatsby-react-router-scroll
                        `path-to-regexp`, `isarray`, // Used by path-to-regexp.
                        `scroll-behavior`, `history`, `resolve-pathname`, // Used by history.
                        `value-equal`, // Used by history.
                        `invariant`, // Used by history.
                        `warning`, // Used by history.
                        `babel-runtime`, // Used by history.
                        `core-js`, // Used by history.
                        `loose-envify`, // Used by history.
                        `prop-types`, `gatsby-link`];
                        var isFramework = (0, _lodash.some)(vendorModuleList.map(function (vendor) {
                          var regex = new RegExp(`[\\\\/]node_modules[\\\\/]${vendor}[\\\\/].*`, `i`);
                          return regex.test(module.resource);
                        }));
                        return isFramework || count > 3;
                      }
                    }),
                    // Add a few global variables. Set NODE_ENV to production (enables
                    // optimizations for React) and whether prefixing links is enabled
                    // (__PREFIX_PATHS__) and what the link prefix is (__PATH_PREFIX__).
                    new _webpack2.default.DefinePlugin({
                      "process.env": processEnv(stage, `production`),
                      __PREFIX_PATHS__: program.prefixPaths,
                      __PATH_PREFIX__: JSON.stringify(store.getState().config.pathPrefix),
                      __POLYFILL__: store.getState().config.polyfill
                    }),
                    // Extract CSS so it doesn't get added to JS bundles.
                    (0, _gatsby1ConfigExtractPlugin.extractTextPlugin)(stage),
                    // Write out mapping between chunk names and their hashed names. We use
                    // this to add the needed javascript files to each HTML page.
                    new _webpackStatsPlugin.StatsWriterPlugin(),
                    // Extract the webpack chunk manifest out of commons.js so commons.js
                    // doesn't get changed everytime you build. This increases the cache-hit
                    // rate for commons.js.
                    new ChunkManifestPlugin({
                      filename: `chunk-manifest.json`,
                      manifestVariable: `webpackManifest`
                    }),
                    // Ensure module order stays the same. Supposibly fixed in webpack 2.0.
                    new _webpack2.default.optimize.OccurenceOrderPlugin(), new GatsbyModulePlugin(),
                    // new WebpackStableModuleIdAndHash({ seed: 9, hashSize: 47 }),
                    new HashedChunkIdsPlugin()];
                    if (!noUglify) {
                      // Minify JavaScript.
                      _plugins.push(new _webpack2.default.optimize.UglifyJsPlugin({
                        compress: {
                          screw_ie8: true, // React doesn't support IE8
                          warnings: false
                        },
                        mangle: {
                          screw_ie8: true
                        },
                        output: {
                          comments: false,
                          screw_ie8: true
                        }
                      }));
                    }
                    return _plugins;
                  }
                default:
                  throw new Error(`The state requested ${stage} doesn't exist.`);
              }
            };

            entry = function entry() {
              switch (stage) {
                case `develop`:
                  return {
                    commons: [require.resolve(`react-hot-loader/patch`), `${require.resolve(`webpack-hot-middleware/client`)}?path=${getHmrPath()}`, directoryPath(`.cache/app`)]
                  };
                case `develop-html`:
                  return {
                    main: directoryPath(`.cache/develop-static-entry`)
                  };
                case `build-css`:
                  return {
                    main: directoryPath(`.cache/app`)
                  };
                case `build-html`:
                  return {
                    main: directoryPath(`.cache/static-entry`)
                  };
                case `build-javascript`:
                  return {
                    app: directoryPath(`.cache/production-app`)
                  };
                default:
                  throw new Error(`The state requested ${stage} doesn't exist.`);
              }
            };

            output = function output() {
              switch (stage) {
                case `develop`:
                  return {
                    path: directory,
                    filename: `[name].js`,
                    publicPath: process.env.GATSBY_WEBPACK_PUBLICPATH || `${program.ssl ? `https` : `http`}://${program.host}:${webpackPort}/`,
                    devtoolModuleFilenameTemplate: function devtoolModuleFilenameTemplate(info) {
                      return _path2.default.resolve(info.absoluteResourcePath).replace(/\\/g, `/`);
                    }
                  };
                case `build-css`:
                  // Webpack will always generate a resultant javascript file.
                  // But we don't want it for this step. Deleted by build-css.js.
                  return {
                    path: directoryPath(`public`),
                    filename: `bundle-for-css.js`,
                    publicPath: program.prefixPaths ? `${store.getState().config.pathPrefix}/` : `/`
                  };
                case `build-html`:
                case `develop-html`:
                  // A temp file required by static-site-generator-plugin. See plugins() below.
                  // Deleted by build-html.js, since it's not needed for production.
                  return {
                    path: directoryPath(`public`),
                    filename: `render-page.js`,
                    libraryTarget: `umd`,
                    publicPath: program.prefixPaths ? `${store.getState().config.pathPrefix}/` : `/`
                  };
                case `build-javascript`:
                  return {
                    filename: `[name]-[chunkhash].js`,
                    chunkFilename: `[name]-[chunkhash].js`,
                    path: directoryPath(`public`),
                    publicPath: program.prefixPaths ? `${store.getState().config.pathPrefix}/` : `/`
                  };
                default:
                  throw new Error(`The state requested ${stage} doesn't exist.`);
              }
            };

            getHmrPath = function getHmrPath() {
              var hmrBasePath = `${program.ssl ? `https` : `http`}://${program.host}:${webpackPort}/`;

              var hmrSuffix = `__webpack_hmr&reload=true&overlay=false`;

              if (process.env.GATSBY_WEBPACK_PUBLICPATH) {
                var pubPath = process.env.GATSBY_WEBPACK_PUBLICPATH;
                if (pubPath.substr(-1) === `/`) {
                  hmrBasePath = pubPath;
                } else {
                  hmrBasePath = `${pubPath}/`;
                }
              }

              return hmrBasePath + hmrSuffix;
            };

            processEnv = function processEnv(stage, defaultNodeEnv) {
              debug(`Building env for "${stage}"`);
              var env = process.env.NODE_ENV ? process.env.NODE_ENV : `${defaultNodeEnv}`;
              var envFile = _path2.default.join(process.cwd(), `./.env.${env}`);
              var parsed = {};
              try {
                parsed = _dotenv2.default.parse(_fs2.default.readFileSync(envFile, { encoding: `utf8` }));
              } catch (e) {
                if (e && e.code !== `ENOENT`) {
                  console.log(e);
                }
              }
              var envObject = Object.keys(parsed).reduce(function (acc, key) {
                acc[key] = JSON.stringify(parsed[key]);
                return acc;
              }, {});

              var gatsbyVarObject = Object.keys(process.env).reduce(function (acc, key) {
                if (key.match(/^GATSBY_/)) {
                  acc[key] = JSON.stringify(process.env[key]);
                }
                return acc;
              }, {});

              // Don't allow overwriting of NODE_ENV, PUBLIC_DIR as to not break gatsby things
              envObject.NODE_ENV = JSON.stringify(env);
              envObject.PUBLIC_DIR = JSON.stringify(`${process.cwd()}/public`);

              return Object.assign(envObject, gatsbyVarObject);
            };

            directoryPath = withBasePath(directory);

            // We combine develop & develop-html stages for purposes of generating the
            // webpack config.

            stage = suppliedStage;
            _context.next = 13;
            return genBabelConfig(program, suppliedStage);

          case 13:
            babelConfig = _context.sent;
            noUglify = program.noUglify;


            debug(`Loading webpack config for stage "${stage}"`);
            config = new _webpackConfigurator2.default();


            config.merge({
              // Context is the base directory for resolving the entry option.
              context: directory,
              node: {
                __filename: true
              },
              entry: entry(),
              debug: true,
              // Certain "isomorphic" packages have different entry points for browser
              // and server (see
              // https://github.com/defunctzombie/package-browser-field-spec); setting
              // the target tells webpack which file to include, ie. browser vs main.
              target: stage === `build-html` || stage === `develop-html` ? `node` : `web`,
              profile: stage === `production`,
              devtool: devtool(),
              output: output(),
              resolveLoader: resolveLoader(),
              plugins: plugins(),
              resolve: resolve()
            });

            module(config, stage);

            // Use the suppliedStage again to let plugins distinguish between
            // server rendering the html.js and the frontend development config.
            _context.next = 21;
            return (0, _webpackModifyValidate2.default)(program, config, babelConfig, suppliedStage);

          case 21:
            validatedConfig = _context.sent;
            return _context.abrupt("return", validatedConfig);

          case 23:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x3, _x4, _x5) {
    return _ref.apply(this, arguments);
  };
}();
//# sourceMappingURL=webpack.config.js.map