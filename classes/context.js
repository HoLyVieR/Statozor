/// class Context

var CONST_SEPARATOR_ID = require("../constant").CONST_SEPARATOR_ID;
var FunctionCodeBlock = require("./function-code-block");

function Context(graph, scopeName, scope, assignations, codeBlock) {
	this.scope = scope || new Map();
	this.assignations = assignations || new Map();
	this.graph = graph;
	this.scopeName = scopeName || "G" + CONST_SEPARATOR_ID;
	this.codeBlock = codeBlock || new FunctionCodeBlock(this.scopeName);
}

Context.prototype.clone = function () {
	return new Context(this.graph, this.scopeName, this.scope, this.assignations, this.codeBlock);
}

module.exports = Context;