var util = require('util');
var astring = require('astring');

var utils = require('./utils');
var fs = require('fs');
var acorn = require('acorn');
var Context = require('./classes/context');
var graph = require("./graph/main");

var graphInst = graph.getInstance("memory", {});
var code = fs.readFileSync("examples/code.js");
var tree = acorn.parse(code);

utils.preAnalysis(tree);

console.log(astring.generate(tree));

var result = utils.analysis(tree, new Context(graphInst));

console.log(util.inspect(result.graph.getCodeBlocks(), { depth: null }));
console.log(result.graph.getInvocations());
console.log(result.graph.getValues());

//console.log(util.inspect(acorn.parse("if (1) { }")))