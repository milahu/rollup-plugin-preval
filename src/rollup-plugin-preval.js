// rollup-plugin-preval.js
// compile-time eval plugin for rollup
// license CC0-1.0 + no warranty

const acorn_parse = require("acorn").parse; // parse js to ast
const estree_walk = require("estree-walker").walk; // walk ast, read only
const magicString = require("magic-string"); // replace strings
const node_tosource = require("tosource"); // convert object to source

module.exports.preval = function preval(options) {

  options = Object.assign(
    {},
    // default options
    {
      funcname: "preval",
      basedir: '.',
      // set this to `__dirname` in rollup.config.js
      // so you can require local scripts like
      // let res = preval(({basedir}) => {
      //   return require(basedir+'/src/myScript.js').myProp;
      // });
      // default basedir is
      // [..../]node_modules/svelte-preval/src
      // which is not portable
      // this breaks with pnpm, for example
      // cos pnpm has its node_modules outside your project path
      // and your project only has symlinks to pnpm's global store
    },
    options
  );

  return {
    name: 'preval',

    async renderChunk(code, chunk, outputOptions) {

      // no change
      //return null;

      // parse script
      let ast;
      try {
        ast = acorn_parse(code, {
          ecmaVersion: 2020,
          sourceType: "module",
        });
      }
      catch(e) {
        const errCtxLen = 100;
        const errCtx = code.substring(
          Math.max(e.pos - errCtxLen, 0),
          Math.min(e.pos + errCtxLen, code.length),
        );
        console.log(`parse error context +-${errCtxLen}: ${errCtx}`);

        const errRaised = code.substring(
          e.raisedAt,
          Math.min(e.raisedAt + errCtxLen, code.length),
        );
        console.log(`parse error raised at: ${errRaised}`);

        throw(e);
      }

      let result = new magicString(code);
      let code_was_changed = false;

      estree_walk(ast, {

        //enter: async function (node, parent, prop, index) {
        enter: function (node, parent, prop, index) {

          if (
            node.type !== "CallExpression" ||
            node.callee.name !== options.funcname
          ) {
            // ignore this node
            return;
          }

          if (node.arguments.length !== 1) {
            return console.error(`preval usage: let res = ${options.funcname}(f);`);
          }

          const nodeSrc = code.substring(node.start, node.end);

          const arg0Src = code.substring(
            node.arguments[0].start,
            node.arguments[0].end
          );

          const addLines = (arg0Src.match(/\n/g) || []).length;

          // eval
          // pass options object from sveltePreval(options)
          // to the eval-ed function
          const evalRes = eval(`(${arg0Src})(options);`);

          // object to source
          let evalResSrc = node_tosource(evalRes);

          // patch the source
          result.overwrite(node.start, node.end, evalResSrc);
          code_was_changed = true;
        },

      });

      if (!code_was_changed) return null;

      if (options.debug) {
        console.log('preval result:\n' + result.toString());
      }

      return {
        code: result.toString(),
        map: result.generateDecodedMap()
      };
    },
  };
};
