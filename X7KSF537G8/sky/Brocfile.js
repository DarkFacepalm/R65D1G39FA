((_w, undefined) => {
  "use strict";

  const BUILD = {
    _start: Date.now(),
    _current: undefined,
    _end: undefined,
    _ix: 0,
    timeD: function timeD() {
      let _i = this;
      return _i._current - _i._start;
    },
    timeS: function timeS() {
      let _i = this;
      return _i._current - (_i._end || _i._start);
    },
    log: function log() {
      let _i = this;
      _i._current = Date.now();
      _i._ix = 1 + _i._ix;
      let args = [`[ ${_i._ix} ][ ${_i.timeD()} ][ ${_i.timeS()} ][`];
      for (let i = 0; i < arguments.length; ++i) {
        args.push(arguments[i]);
      }
      args.push(']');
      console.log.apply(console, args);
      _i._end = _i._current;
    }
  };
  log('START');

  const funnel = require('broccoli-funnel');
  const concat = require('broccoli-concat');
  const mergeTrees = require('broccoli-merge-trees');
  const esTranspiler = require('broccoli-babel-transpiler');
  const replace = require('broccoli-string-replace');
  const babelPolyfill = require("babel-polyfill");
  const uglifyJavaScript = require('broccoli-uglify-js');
  const pkg = require('./package.json');
  log('funnel,concat,mergeTrees,esTranspiler,esTranspiler,replace,babelPolyfill,uglifyJavaScript,pkg');

  const src = 'src';
  const babelPath = require.resolve('broccoli-babel-transpiler').replace(/\\index.js$/, '') + '\\node_modules\\babel-core';


  const browserPolyfill = funnel(babelPath, {
    files: ['browser-polyfill.js']
  });
  log('browserPolyfill');

  const index_Page = /*replace(*/funnel(src, {
    files: ['index.jsp']
  })/*, {
   files: ['index.jsp'],
   pattern: {
   match: /src\/index/g,
   replacement: pkg.name + '.js'
   }
   })*/;
  log('index_Page');

  var estCfg = {
    stage: 0,
    modules: 'common', /*modules: 'amd',*/
    filterExtensions: ['js', 'es6']
    /*sourceMaps: 'both'*/
    /*moduleIds: true,*/
    /*code: true,*/
    /*babelrc: true,*/

    // Transforms /index.js files to use their containing directory name
    /*getModuleId: function (name) {
     name = pkg.name + '/' + name;
     return name.replace(/\/index$/, '');
     },

     // Fix relative imports inside /index's
     resolveModuleSource: function (source, filename) {
     var match = filename.match(/(.+)\/index\.\S+$/i);

     // is this an import inside an /index file?
     if (match) {
     var path = match[1];
     return source
     .replace(/^\.\//, path + '/')
     .replace(/^\.\.\//, '');
     } else {
     return source;
     }
     }*/
  };

  const indexJS = funnel(src, {
    files: ['index.js']
  });
  log('indexJS');


  const transpiledCmpJS = esTranspiler(src + '/cmp', estCfg);
  log('transpiledCmpJS');

  const transpiledIndexJS = esTranspiler(indexJS, estCfg);
  log('transpiledIndexJS');


  const processedJS = concat(
    mergeTrees(
      [
        /*browserPolyfill,*/
        transpiledCmpJS,
        replace(
          transpiledIndexJS,
          {
            files: ['index.js'],
            pattern: {
              match: /EXEC_MODE = 'src'/g,
              replacement: 'EXEC_MODE = \'ori\''
            }
          }
        )
      ]
    ), {
      inputFiles: [
        /*'browser-polyfill.js',*/
        'index.js',
        '**/*.js'
      ],
      outputFile: '/index.js'
    }
  );
  log('processedJS');

  const minifiedJS = uglifyJavaScript(processedJS, {
    mangle: true,
    compress: true
  });
  log('minifiedJS');

  module.exports = mergeTrees([minifiedJS, index_Page], {
    overwrite: true
  });

  log('DONE');


  function log() {
    let args = [];
    for (let i = 0; i < arguments.length; ++i) {
      args.push(arguments[i]);
    }
    return BUILD.log.apply(BUILD, args);
  }
})(this);
