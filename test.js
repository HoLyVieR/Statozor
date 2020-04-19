// External
var util = require('util');
var astring = require('astring');
var fs = require('fs');
var acorn = require('acorn');

// Internal
var utils = require('./utils');
var graph = require("./graph/main");
var Context = require('./classes/context');
var Reference = require('./classes/reference');

var graphInst = graph.getInstance("memory", {});
var code = fs.readFileSync("examples/code.js");
var tree = acorn.parse(code);

utils.preAnalysis(tree);

/*
console.log("Pre-analysis code =====");
console.log(astring.generate(tree));
*/

var result = utils.analysis(tree, new Context(graphInst));


console.log("");
console.log("Code-block list =====");
console.log(util.inspect(result.graph.getCodeBlocks(), { depth: null }));

console.log("");
console.log("List of invocations =====");
console.log(util.inspect(result.graph.getInvocations(), { depth: null }));

console.log("");
console.log("List of values =====");
console.log(util.inspect(result.graph.getValues(), { depth: null }));


//console.log("");
console.log("Analyzed code :");
console.log(code.toString());
console.log("");

console.log("Possible symbolic of the 1st argument of 'eval' : ");

var invocations = utils.findExactCall(result, new Reference("G&&&eval"));

for (var i=0; i<invocations.length; i++) {
	var values = utils.resolveValues(result, [invocations[i].arguments[0]]);

	for (var j=0; j<values.length; j++) {
		console.log("Possible value : " + values[j].toHumanValue());
	}
}

//console.log(util.inspect(acorn.parse("if (1) { }")))