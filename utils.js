var exportFnct = {};

var _ = require('lodash');

/**
 * Constant
 */

var CONST_SEPARATOR_ID = require("./constant").CONST_SEPARATOR_ID;
var PLACEHOLDER_VARIABLE = require("./constant").PLACEHOLDER_VARIABLE;

/**
 * Classes to represent the stucture used in the utility.
 */

var ArrayStructure     = require("./classes/array-structure");
var Concatenation      = require("./classes/concatenation");
var Constant           = require("./classes/constant");
var Context            = require("./classes/context");
var FunctionArgument   = require("./classes/function-argument");
var FunctionCodeBlock  = require("./classes/function-code-block");
var FunctionInvocation = require("./classes/function-invocation");
var GlobalFunctionCall = require("./classes/global-function-call");
var LocalFunctionCall  = require("./classes/local-function-call");
var MemberExpression   = require("./classes/member-expression");
var ObjectFunctionCall = require("./classes/object-function-call");
var ObjectStructure    = require("./classes/object-structure");
var Reference          = require("./classes/reference");
var Unknown            = require("./classes/unknown");

var ALL_TYPE = {
	ArrayStructure : ArrayStructure,
	Concatenation : Concatenation,
	Constant : Constant,
	Context :  Context,
	FunctionArgument : FunctionArgument,
	FunctionCodeBlock : FunctionCodeBlock,
	FunctionInvocation : FunctionInvocation,
	GlobalFunctionCall : GlobalFunctionCall,
	LocalFunctionCall : LocalFunctionCall,
	MemberExpression : MemberExpression,
	ObjectFunctionCall : ObjectFunctionCall,
	ObjectStructure : ObjectStructure,
	Reference : Reference,
	Unknown : Unknown
}

/**
 * Storage & Query
 */
var graph = require("./graph/main");

function debug(message) {
	if (typeof console === "undefined") {
		if (typeof message !== "string") {
			message = JSON.stringify(message);
		}
		System.println(message + "");
	} else {
		console.log(message);
	}
}

exportFnct.debug = debug;

function clone(obj) {
	//return JSON.parse(JSON.stringify(obj));
	return _.cloneDeep(obj);
}

exportFnct.clone = clone;

/**
 * Analysis function
 */

function reTypeValue(value) {
	if (Array.isArray(value)) {
		var res = [];
		
		for (var i=0; i<value.length; i++) {
			res.push(reTypeValue(value[i]));
		}

		return res;
	} else if (typeof value === "object") {
		var res;

		if (value.__type) {
			var type = ALL_TYPE[value.__type];
			res = Object.create(type.prototype);
		} else {
			res = {};
		}

		for (var i in value) {
			res[i] = reTypeValue(value[i]);
		}

		return res;
	} else {
		return value;
	}
}

exportFnct.reTypeValue = reTypeValue;

/**
 * Returns the list of all the variable declaration in the scope of the 
 * "tree" object.
 *
 * @param tree       - AST object
 * @param collectVar - If we collect variable declared with "var".
 * @param collectLet - If we collect variable declared with "let".
 */
function collectVar(tree, _collectVar, collectLet) {
	var variables = [];

	if (!tree) {
		return variables;
	}

	if (!tree.body) {
		tree = { body : tree };
	}

	if (!Array.isArray(tree.body)) {
		tree.body = [tree.body];

		if (tree[0] && tree[0].synthetic) {
			tree.body.synthetic = tree[0].synthetic;
		}
	}

	for (let i=0; i<tree.body.length; i++) {
		let statement = tree.body[i];
		let statementIsFunction = statement.type === "FunctionDeclaration" || statement.type === "FunctionExpression";

		if (statement.type === "VariableDeclaration") {
			if (statement.kind === "let" && !collectLet) {
				continue;
			}

			for (let j=0; j<statement.declarations.length; j++) {
				variables.push(statement.declarations[j].id.name);
				variables = variables.concat(collectVar(statement.declarations[j], true, false));
			}
		} else if (statement.body && !statementIsFunction && _collectVar) {
			variables = variables.concat(collectVar(statement, true, false));
		} else if (statementIsFunction && _collectVar) {
			variables.push(statement.id.name);
		} else if (!statementIsFunction && _collectVar) {
			for (var prop in statement) {
				if (statement.hasOwnProperty(prop) && typeof statement[prop] === "object") {
					variables = variables.concat(collectVar(statement[prop], true, false));
				}
			}
		}
	}

	return variables;
}

exportFnct.collectVar = collectVar;

/**
 * Returns the list of all the function declaration inside the "tree"
 * object. This search stops at one level of function.
 *
 * @param tree - AST object
 */
function collectFunction(tree) {
	var functions = [];

	function handleProperty(tree) {
		if (!tree) return;

		if (typeof tree === "object") {
			if (tree.body) {
				if (tree.type === "FunctionDeclaration" || tree.type === "FunctionExpression") {
					functions.push(tree);
					return;
				}
			}

			functions = functions.concat(collectFunction(tree));
		}
	}

	for (let prop in tree) {
		if (!tree.hasOwnProperty(prop)) continue;

		if (Array.isArray(tree[prop])) {
			for (let j=0; j<tree[prop].length; j++) {
				handleProperty(tree[prop][j]);
			}
		} else {
			handleProperty(tree[prop]);
		}
	}

	return functions;
}

exportFnct.collectFunction = collectFunction;

/**
 * Give all function declaration in the current scope with no name a random name.
 * 
 * @param tree - AST object
 */
function tagAnonymousFunctionWithName(tree) {
	function handleProperty(tree) {
		if (!tree) return;

		if (typeof tree === "object") {
			if (tree.body) {
				if (tree.type === "FunctionDeclaration" || tree.type === "FunctionExpression") {
					if (!tree.id) {
						tree.id = {};
					}

					if (!tree.id.name) {
						tree.id.name = "anon" + (Math.random().toString(16).substr(2));
					}
				}
			}

			tagAnonymousFunctionWithName(tree);
		}
	}

	for (let prop in tree) {
		if (!tree.hasOwnProperty(prop)) continue;

		if (Array.isArray(tree[prop])) {
			for (let j=0; j<tree[prop].length; j++) {
				handleProperty(tree[prop][j]);
			}
		} else {
			handleProperty(tree[prop]);
		}
	}
}
exportFnct.tagAnonymousFunctionWithName = tagAnonymousFunctionWithName;

/**
 * Returns the component of a member expression as a flatten array.
 * It also resolves the symbolic value of the component.
 *
 * @param memberExpression - AST of type "MemberExpression"
 * @param context          - Context object
 */
function flattenMemberExpression(memberExpression, context) {
	var result;
	var property = (memberExpression.computed) ? 
			toSymbolic(memberExpression.property, context) : 
			new Constant(memberExpression.property.name);

	if (memberExpression.object.type === "MemberExpression") {
		result = flattenMemberExpression(memberExpression.object, context);
		result.push(property);
	} else {
		result = [toSymbolic(memberExpression.object, context), property];
	}

	return result;
}

exportFnct.flattenMemberExpression = flattenMemberExpression;

/**
 * Returns the resolved symbolic value of the "variableName".
 *
 * @param variableName - Name of the variable.
 * @param context      - Context object.
 */
function resolveReference(variableName, context) {
	let referenceIdentifier = context.scope.get(variableName);
	
	if (context.assignations.has(referenceIdentifier)) {
		let res = context.assignations.get(referenceIdentifier);
		return res;
	} else {
		if (typeof referenceIdentifier === "undefined" || referenceIdentifier === null) {
			referenceIdentifier = "G" + CONST_SEPARATOR_ID + variableName;
		}
		return new Reference(referenceIdentifier);
	}
}

exportFnct.resolveReference = resolveReference;

/**
 * Returns the resolved symbolic value of the "MemberExpression".
 *
 * @param flattenMemberExpression - Array of all the componenent of the MemberExpression.
 * @param context                 - Context object
 */
function resolveMemberExpression(flattenMemberExpression, context) {
	if (flattenMemberExpression[0].constructor.name === "ObjectStructure") {
		let objStructure = flattenMemberExpression[0];
		let keyValue = flattenMemberExpression[1];

		if (keyValue.constructor.name === "Constant" && objStructure.properties.has(keyValue.value)) {
			if (flattenMemberExpression.length > 2) {
				let subsetMemberExpression = [objStructure.properties.get(keyValue.value)].concat(flattenMemberExpression.slice(2))
				return resolveMemberExpression(subsetMemberExpression);
			} else {
				return objStructure.properties.get(keyValue.value);
			}
		}
	}

	return new MemberExpression(flattenMemberExpression);
}

exportFnct.resolveMemberExpression = resolveMemberExpression;

/**
 * Returns the symbolic value of the AST object "tree".
 *
 * @param tree              - AST object
 * @param context           - Context object
 * @param resolveIdentifier - Whether or not identifier value should be ressolved. 
 */
function toSymbolic(tree, context, resolveIdentfier) {
	if (typeof resolveIdentfier === "undefined") {
		resolveIdentfier = true;
	}

	if (!context) {
		throw new Exception("context is null");
	}

	if (tree.symbolicValue) {
		return tree.symbolicValue;
	}

	var symbolicValue = null;

	switch (tree.type) {
		case "Literal":
			let constant = new Constant(tree.value);
			constant.position = { start : tree.start, end : tree.end };
			context.graph.addValue(constant);
			symbolicValue = constant;
			break;

		case "Identifier":
			if (resolveIdentfier) {
				let result = resolveReference(tree.name, context);
				if (!result.position) {
					result.position = { start : tree.start, end : tree.end };
				}
				symbolicValue = result;
				break;
			} else {
				if (context.scope.has(tree.name)) {
					let referenceIdentifier = context.scope.get(tree.name);
					let ref = new Reference(referenceIdentifier);
					ref.position = { start : tree.start, end : tree.end };
					context.graph.addValue(ref);
					symbolicValue = ref;
					break;
				} else {
					let tmpReference = new Reference("G" + CONST_SEPARATOR_ID + tree.name);
					context.scope.set(tree.name, tmpReference.name);
					tmpReference.position = { start : tree.start, end : tree.end };
					context.graph.addValue(tmpReference);
					symbolicValue = tmpReference;
					break;
				}
			}

		case "BinaryExpression":
			if (tree.operator === "+") {
				let concat = new Concatenation(toSymbolic(tree.left, context), toSymbolic(tree.right, context));
				concat.position = { start : tree.start, end : tree.end };
				context.graph.addValue(concat);
				symbolicValue = concat;
				break;
			}
			break;

		case "MemberExpression":
			let memberExpression = flattenMemberExpression(tree, context);

			if (resolveIdentfier) {
				let res = resolveMemberExpression(memberExpression, context);
				if (!res.position) {
					res.position = { start : tree.start, end : tree.end };
				}
				symbolicValue = res;
				break;
			} else {
				let memberExpr = new MemberExpression(memberExpression);
				memberExpr.position = { start : tree.start, end : tree.end };
				context.graph.addValue(memberExpr);
				symbolicValue = memberExpr;
				break;
			}

		case "NewExpression":
			let args = [];
			for (let i=0; i<tree.arguments.length; i++) {
				args.push(toSymbolic(tree.arguments[i], context));	
			}

			if (tree.callee.type === "Identifier") {
				let functionName = tree.callee.name;

				if (context.scope.has(functionName)) {
					let localFunctionCall = new LocalFunctionCall(context.scope.get(functionName), args);
					localFunctionCall.position = { start : tree.start, end : tree.end };
					context.graph.addInvocation(localFunctionCall);
					symbolicValue = localFunctionCall;
					break;
				} else {
					let globalFunctionCall = new GlobalFunctionCall(functionName, args);
					globalFunctionCall.position = { start : tree.start, end : tree.end };
					context.graph.addInvocation(globalFunctionCall);
					symbolicValue = globalFunctionCall;
					break;
				}
			} else {
				if (tree.callee.type === "MemberExpression") {
					let members = flattenMemberExpression(tree.callee, context);
					let objectFunctionCall = new ObjectFunctionCall(members, args);
					objectFunctionCall.position = { start : tree.start, end : tree.end };
					context.graph.addInvocation(objectFunctionCall);
					symbolicValue = objectFunctionCall;
					break;
				} else {
					// TODO
				}
			}

		case "ObjectExpression":
			let obj = new ObjectStructure();
			for (let i=0; i<tree.properties.length; i++) {
				let property = tree.properties[i];

				if (property.key.type === "Constant" || property.key.type === "Literal") {
					obj.properties.set(property.key.value, toSymbolic(property.value, context));
				} else {
					obj.properties.set(property.key.name, toSymbolic(property.value, context));
				}
			}
			obj.position = { start : tree.start, end : tree.end };
			context.graph.addValue(obj);
			symbolicValue = obj;
			break;

		case "ArrayExpression":
			let arr = new ArrayStructure();
			for (let i=0; i<tree.elements.length; i++) {
				let element = tree.elements[i];
				arr.values.push(toSymbolic(element, context));
			}
			arr.position = { start : tree.start, end : tree.end };
			context.graph.addValue(arr);
			symbolicValue = arr;
			break;

		case "CallExpression":
			let invocation = new FunctionInvocation();
			invocation.fnct = toSymbolic(tree.callee, context);
			invocation.arguments = [];

			for (let j=0; j<tree.arguments.length; j++) {
				invocation.arguments.push(toSymbolic(tree.arguments[j], context));
			}

			invocation.position = { start : tree.start, end : tree.end };
			invocation.condition = tree.condition;
			context.graph.addInvocation(invocation);
			context.graph.linkCodeBlockToInvocation(context.codeBlock, invocation);
			symbolicValue = invocation;
			break;

		case "FunctionExpression":
			let codeBlock = new FunctionCodeBlock(context.scope.get(tree.id.name));
			codeBlock.position = { start : tree.start, end : tree.end };
			context.graph.addCodeBlock(codeBlock);
			symbolicValue = codeBlock;
			break;

		default:
			console.log("Unknown : " + tree.type);
			console.log("Unknown : " + tree);

			var unknown = new Unknown();
			unknown.position = { start : tree.start, end : tree.end };
			return unknown;
	}

	tree.symbolicValue = symbolicValue;
	return symbolicValue;
}

exportFnct.toSymbolic = toSymbolic;

/**
 * Perform a symbolic assignation on a MemberExpression.
 * 
 * @param left         - MemberExpression
 * @param right        - Value to set
 * @param assignations - Map of existing assignations 
 */
function memberExpressionAssignment(left, right, assignations) {
	let mainObj = left.parts[0];
	let prop    = left.parts[1];

	if (mainObj instanceof ObjectStructure && prop instanceof Constant) {
		// For deep structure we need to do the a recursive assignation.
		if (mainObj.properties.has(prop.value) && left.parts.length > 2) {
			let subsetMemberExpression = [mainObj.properties.get(prop.value)].concat(left.parts.slice(2));
			let leftPartRemaining = clone(left);
			leftPartRemaining.parts = subsetMemberExpression;
			memberExpressionAssignment(leftPartRemaining, right, assignations);
		} else {
			mainObj.properties.set(prop.value, right);
		}
	} else {
		let found = false;

		assignations.forEach(function (value, key, map) {
			if (found) return;

			if (key instanceof MemberExpression && key.equals(left)) {
				assignations.delete(key);
				assignations.set(left, right);
				found = true;
			}
		});

		if (!found) {
			assignations.set(left, right);
		}
	}
}

exportFnct.memberExpressionAssignment = memberExpressionAssignment;

function findExactCall(result, search) {
	var invocations = result.graph.getInvocations();
	var results = [];

	for (var i=0; i<invocations.length; i++) {
		var invocation = invocations[i];
		var fnct = invocation.fnct;

		if (fnct.equals(search)) {
			results.push(invocation);
		}
	}

	return results;
}

exportFnct.findExactCall = findExactCall;

function replaceArgumentsElements(source, fnct, replacement) {
	if (source.__type === "FunctionArgument" && source.fnct === fnct) {
		return replacement[source.index];
	}

	if (Array.isArray(source)) {
		for (var i=0; i<source.length; i++) {
			source[i] = replaceArgumentsElements(source[i], fnct, replacement);
		}
	} else if (typeof source === "object") {
		for (var i in source) {
			source[i] = replaceArgumentsElements(source[i], fnct, replacement);
		}
	}

	return source;
}

function replaceElements(source, findWhat, replacement) {
	if (findWhat.equals(source)) {
		return replacement;
	}

	if (Array.isArray(source)) {
		for (var i=0; i<source.length; i++) {
			source[i] = replaceElements(source[i], findWhat, replacement);
		}
	} else if (typeof source === "object") {
		for (var i in source) {
			source[i] = replaceElements(source[i], findWhat, replacement);
		}
	}

	return source;
}

function findObjectType(value, type) {
	var results = [];

	if (value instanceof type) {
		results.push(value);
	}

	if (Array.isArray(value)) {
		for (var i=0; i<value.length; i++) {
			results = results.concat(findObjectType(value[i], type));
		}
	} else if (typeof value === "object") {
		for (var i in value) {
			results = results.concat(findObjectType(value[i], type));
		}
	}

	return results;
}

function getFunctionArguments(value) {
	return findObjectType(value, FunctionArgument);
}

function getFunctionCall(value) {
	var results = [];
	results = results.concat(findObjectType(value, FunctionInvocation));
	results = results.concat(findObjectType(value, GlobalFunctionCall));
	results = results.concat(findObjectType(value, LocalFunctionCall));
	return results;
}

function findInvocationsOf(result, element) {
	if (!element) {
		return [];
	}

	var refs = result.graph.findReferencesTo(element);

	if (element.name) {
		refs = refs.concat(result.graph.findReferencesTo(new Reference(element.name)));
	}

	for (var i=0; i<refs.length; i++) {
		var ref = refs[i];
		var parent = ref.parent;
		var property = ref.property;

		switch (parent.constructor.name) {
			case "FunctionInvocation":
			case "LocalFunctionCall":
				if (property === "arguments") {
					var invokedFunction = parent.reference || parent.fnct;
					var results = [];

					if (invokedFunction instanceof Reference) {
						invokedFunction = [invokedFunction];
					} else {
						invokedFunction = resolveValues(result, invokedFunction);

						// Keep only fully resolved value
						// May need further analysis to extract possible function
						invokedFunction = invokedFunction.filter(function (fnct) {
							return fnct instanceof Reference;
						});
					}

					for (var j=0; j<parent.arguments.length; j++) {
						if (parent.arguments[j].id === element.id) {
							for (var k=0; k<invokedFunction.length; k++) {
								var fnctArgument = result.graph.findValue(new FunctionArgument(invokedFunction[k].name, "", j));
								results = results.concat(findInvocationsOf(result, fnctArgument));
							}
						}
					}

					return results;
				} else {
					return [parent];
				}
					break;

			case "GlobalFunctionCall":
				// Can't resolve those as we don't know what it points to :( 
				break;

			default:
				// When the function is an attribute of something else, we must find where
				// this something else is used.
				return findInvocationsOf(result, parent);
				break;
		}
	}

	return [];
}

exportFnct.findInvocationsOf = findInvocationsOf;

function resolveValues(result, values) {
	return _resolveValues(result, values, {});
}

function _resolveValues(result, values, states) {
	var key = JSON.stringify(values);

	// We have reached a fixed-point where we will no longer get results that are more precise
	if (states[key]) {
		return values;
	}

	states[key] = true;

	var args = [];
	for (var i=0; i<values.length; i++) {
		args = args.concat(getFunctionArguments(values));
	}

	// If there are parameters to resolve
	if (args.length > 0) {
		var argsPriority = args.sort(function (functionArgA, functionArgB) {
			var valueA = functionArgA.fnct.split(CONST_SEPARATOR_ID).length;
			var valueB = functionArgB.fnct.split(CONST_SEPARATOR_ID).length;

			// Descending order
			return valueB - valueA;
		});

		var nextFunction = argsPriority[0].fnct;
		var codeBlock = result.graph.findCodeBlock(nextFunction);
		var invocations = findInvocationsOf(result, codeBlock);
		var possibleResults = [];

		for (var i=0; i<invocations.length; i++) {
			var newValues = clone(values);

			for (var j=0; j<newValues.length; j++) {
				newValues[j] = replaceArgumentsElements(newValues[j], nextFunction, invocations[i].arguments);	
			}

			newValues = reTypeValue(newValues);
			possibleResults = possibleResults.concat(newValues);
		}

		return _resolveValues(result, possibleResults, states);
	}

	var call = [];
	for (var i=0; i<values.length; i++) {
		call = call.concat(getFunctionCall(values));
	}

	// If there are function call to resolve
	if (call.length > 0) {
		var possibleResults = [];

		for (var i=0; i<call.length; i++) {
			var whatsCalled = call[i].reference || call[i].fnct;
			var possibleTarget;

			if (!(whatsCalled instanceof Reference)) {
				possibleTarget = _resolveValues(result, [whatsCalled], states);
			} else {
				possibleTarget = [whatsCalled];
			}

			for (var j=0; j<possibleTarget.length; j++) {
				// If we can't figure out what a call points to, we keep 
				// the symbolic value as it is.
				if (possibleTarget[j] instanceof Reference) {
					var codeBlock = result.graph.findCodeBlock(possibleTarget[j].name);
					
					for (var k=0; k<codeBlock.returns.length; k++) {
						var newValues = clone(values);

						for (var l=0; l<newValues.length; l++) {
							var newValue = replaceElements(newValues[l], call[i], codeBlock.returns[k]);
							var found = false;

							for (var m=0; m<possibleResults.length; m++) {
								if (possibleResults[m].equals(newValue)) {
									found = true;
								}
							}

							if (!found) { 
								possibleResults.push(newValue);
							}
						}
					}
				}
			}
		}

		return _resolveValues(result, possibleResults, states);
	}

	return values;
}

exportFnct.resolveValues = resolveValues;

function preAnalysis(tree) {
	// Make sure all function in this scope have name.
	tagAnonymousFunctionWithName(tree);
	divideElementaryCodeBlock(tree);
}

exportFnct.preAnalysis = preAnalysis;

/**
 * Perform the main analysis to retrieve :
 *  - The list of all the function call.
 *  - The list of all the variable and their symbolic value.
 */
function analysis(tree, context, partialScope, useNewScope) {
	// TODO: replace "result" with "graph".
	
	// Default value - START
	if (typeof partialScope === "undefined") {
		partialScope = false;
	}

	if (typeof useNewScope === "undefined") {
		useNewScope = true;
	}
	// Default value - END

	if (tree.body && !Array.isArray(tree.body)) {
		tree.body = [tree.body];
	}

	if (tree.left || tree.right) {
		tree.body = [];
		tree.left  && tree.body.push(tree.left);
		tree.right && tree.body.push(tree.right);
	}

	switch (tree.type) {
		case "ExpressionStatement":
			tree = { body : [tree] };
			break;

		case "SequenceExpression":
			tree.body = tree.expressions;
			break;

		case "CallExpression":
		case "AssignmentExpression":
			tree = { body : [tree] };
			break;
	}

	if (!tree.body) {
		return new Map();
	}

	var scope = context.scope;
	var scopeName = context.scopeName;
	var graph = context.graph;

	if (useNewScope) {
		var newScope = new Map(scope);
		var listVar  = collectVar(tree, !partialScope, true);

		for (let i=0; i<listVar.length; i++) {
			let variableName = listVar[i];
			newScope.set(variableName, scopeName + variableName);
		}
	} else {
		newScope = scope;
	}

	// When we enter the declaration of the function, we declare the parameter as
	// local variable.
	if (tree.type === "FunctionDeclaration" || tree.type === "FunctionExpression") {
		let fnctReference = scope.get(tree.id.name);

		for (let i = 0; i < tree.params.length; i++) {
			let arg = tree.params[i];

			if (arg.type === "Identifier") {
				newScope.set(arg.name, scopeName + arg.name);
				let fnctArg = new FunctionArgument(fnctReference, arg.name, i);
				fnctArg.position = { start: arg.start, end: arg.end };
				graph.addValue(fnctArg);
				context.assignations.set(scopeName + arg.name, fnctArg);
			}
		}
	}

	// Process all the sub-elements of the body.
	for (let i=0; i<tree.body.length; i++) {
		let element = tree.body[i];

		switch (element.type) {
			case "VariableDeclaration":
				for (let j=0; j<element.declarations.length; j++) {
					let variable = element.declarations[j];
					if (variable.init) {
						context.assignations.set(newScope.get(variable.id.name), toSymbolic(variable.init, context));
					}
				}
				break;

			case "BinaryExpression":
			case "SequenceExpression":
				var newContext = context.clone();
				newContext.scope = newScope;
				analysis(element, newContext, true, false);
				break;

			case "AssignmentExpression":
				// Operator length of 2 means it's an operation + assignment (ex.: +=)
				// We rewirte the AST so that "a += b" is handled as "a = a + b"
				if (element.operator.length === 2) {
					let newElement = {
						"type" : "BinaryExpression",
						"start" : element.start,
						"end" : element.end,
						"left" : element.left,
						"operator" : element.operator[0],
						"right" : element.right
					};
					element.right = newElement;
					element.operator = "=";
				}

				let symbolicLeft = toSymbolic(element.left, context, false);
				let symbolicRight = toSymbolic(element.right, context);

				if (symbolicLeft instanceof Reference) {
					context.assignations.set(symbolicLeft.name, symbolicRight);
				} else if (symbolicLeft instanceof MemberExpression) {
					memberExpressionAssignment(symbolicLeft, symbolicRight, result.assignations);
				} else {
					context.assignations.set(symbolicLeft, symbolicRight);
				}

				break;

			case "CallExpression":
				let invocation = toSymbolic(element, context);
				break;

			case "ExpressionStatement":
				var newContext = context.clone();
				newContext.scope = newScope;
				analysis(element.expression, newContext, true, false);
				break;

			case "FunctionDeclaration":
			case "FunctionExpression":
				break;

			case "ReturnStatement":
				var newContext = context.clone();
				newContext.scope = newScope;
				context.codeBlock.returns.push(toSymbolic(element.argument, context));
				analysis({ body : [element.argument] }, newContext, true, false);
				break;

			default:
				if (element.body) {
					var newContext = context.clone();
					newContext.scope = newScope;
					newContext.scopeName = scopeName + "LS" + i + CONST_SEPARATOR_ID;
					analysis(element, newContext, true, true);
				}
				break;
		}
	}

	if (!partialScope) {
		let functions = collectFunction(tree);

		for (let i=0; i<functions.length; i++) {
			let element = functions[i];
			let codeBlock = element.symbolicValue ? element.symbolicValue : new FunctionCodeBlock(newScope.get(element.id.name));
			graph.addCodeBlock(codeBlock);

			var newContext = context.clone();
			newContext.scope = newScope;
			newContext.scopeName = scopeName + "FS" + i + CONST_SEPARATOR_ID;
			newContext.codeBlock = codeBlock;
			analysis(element, newContext, false, true);
		}

	}

	return context;
}

exportFnct.analysis = analysis;

function spliceCodeBlock(element, parent) {
	if (!parent.body) {
		throw new Exception("'parent' has no 'body' element.");
	}

	var position = parent.body.indexOf(element);
	var after = parent.body.splice(position + 1, parent.body.length - 1 - position);
	return after;
}

function createFunctionFromCodeBlock(tree, params) {
	var expr = wrapInExpression(tree);

	return {
		type : "FunctionExpression",
		id : {
			"type" : "Identifier",
			"name" : "sub" + (Math.random().toString(16).substr(2))
		},
		params : params || [],
		body : expr
	};
}

function createFunctionInvocation(functionName, params) {
	return {
		type : "CallExpression",
		callee : {
			type : "Identifier",
			name : functionName
		},
		arguments : params || []
	};
}

function createReturnValue(astValue) {
	return {
		type : "ReturnStatement",
		argument : astValue
	};
}

function createNotValue(astValue) {
	return {
		type : "UnaryExpression",
		operator : "!",
		argument : astValue
	};
}

function createAndValue(astValueLeft, astValueRight) {
	return {
		type : "LogicalExpression",
		operator : "&&",
		left : astValueLeft,
		right : astValueRight
	};
}

function createEmptyExpression() {
	var result = {
		type : "BlockStatement",
		body : []
	};
	result.body.synthetic = true;
	return result;
}

function createEqualityExpression(a, b) {
	return {
		type : "BinaryExpression",
		operator : "==",
		left : a,
		right : b
	};
}

function createLiteral(value) {
	return {
		type : "Literal",
		value : value,
		raw : value + ""
	};
}

function wrapInExpression(astValue) {
	var expr = createEmptyExpression();
	expr.body = astValue;

	if (!Array.isArray(expr.body)) {
		expr.body.synthetic = true;
		expr.body = [expr.body];
	}

	expr.body.synthetic = true;
	return expr;
}

function replaceBreakStatement(tree, astReplacement) {
	if (typeof tree != "object" || !tree) {
		return;
	}

	if (Array.isArray(tree)) {
		for (var i=0; i<tree.length; i++) {
			if (tree[i] && tree[i].type == "BreakStatement") {
				tree[i] = astReplacement;
			} else {
				replaceBreakStatement(tree[i], astReplacement);
			}
		}
	} else {
		for (var prop in tree) {
			if (tree.hasOwnProperty(prop)) {
				if (tree[prop] && tree[prop].type == "BreakStatement") {
					tree[prop] = astReplacement;
				} else {
					replaceBreakStatement(tree[prop], astReplacement);
				}
			}
		}
	}
}

/**
 * Changes the AST to remove if/for/while/etc. and replace them
 * with code block that invoke themselves.
 * 
 * @param tree AST tree
 */
function divideElementaryCodeBlock(tree, parent) {
	if (!parent) {
		parent = tree;
	}

	if (!tree || typeof tree === "string" || typeof tree === "number") {
		return;
	}

	if (Array.isArray(tree)) {
		for (let i=0; i<tree.length; i++) {
			divideElementaryCodeBlock(tree[i], parent);
		}
		return;
	}

	if (tree.body) {
		newParent = tree;
	} else {
		newParent = parent;
	}

	switch (tree.type) {
		case "IfStatement":
			var fnctAfter = createFunctionFromCodeBlock(spliceCodeBlock(tree, parent));
			var ifTrue = createFunctionFromCodeBlock(tree.consequent); 
			var ifFalse = createFunctionFromCodeBlock(tree.alternate || createEmptyExpression());

			parent.body.pop();
			parent.body.push(ifTrue);
			parent.body.push(ifFalse);
			parent.body.push(fnctAfter);

			ifTrue.body.body[0].body.push(createReturnValue(createFunctionInvocation(fnctAfter.id.name)));
			ifFalse.body.body[0].body.push(createReturnValue(createFunctionInvocation(fnctAfter.id.name)));

			var fnctInvoTrue = createFunctionInvocation(ifTrue.id.name);
			var fnctInvoFalse = createFunctionInvocation(ifFalse.id.name);
			fnctInvoTrue.condition = tree.test;
			fnctInvoFalse.condition = createNotValue(tree.test);
			parent.body.push(createReturnValue(fnctInvoTrue));
			parent.body.push(createReturnValue(fnctInvoFalse));

			if (tree.alternate) {
				divideElementaryCodeBlock(ifFalse);
			}

			divideElementaryCodeBlock(ifTrue);
			divideElementaryCodeBlock(fnctAfter);
			break;

		case "ForStatement":
			var fnctAfter = createFunctionFromCodeBlock(spliceCodeBlock(tree, parent));
			var mainLoop = createFunctionFromCodeBlock(tree.body);
			var initBlock = createFunctionFromCodeBlock(tree.init);

			parent.body.pop();
			parent.body.push(mainLoop);
			parent.body.push(initBlock);
			parent.body.push(fnctAfter);

			mainLoop.body.body = mainLoop.body.body.concat(wrapInExpression(tree.update));
			mainLoop.body.body.synthetic = true;
			parent.body.push(createReturnValue(createFunctionInvocation(initBlock.id.name)));

			var fnctInvoMain = createFunctionInvocation(mainLoop.id.name);
			var fnctInvoExit = createFunctionInvocation(fnctAfter.id.name);
			fnctInvoMain.condition = tree.test;
			fnctInvoExit.condition = createNotValue(tree.test);

			initBlock.body.body.push(createReturnValue(fnctInvoMain));
			initBlock.body.body.push(createReturnValue(fnctInvoExit));
			mainLoop.body.body.push(createReturnValue(fnctInvoMain));
			mainLoop.body.body.push(createReturnValue(fnctInvoExit));

			divideElementaryCodeBlock(initBlock);
			divideElementaryCodeBlock(mainLoop);
			divideElementaryCodeBlock(fnctAfter);
			break;

		case "DoWhileStatement":
			var fnctAfter = createFunctionFromCodeBlock(spliceCodeBlock(tree, parent));
			var mainLoop = createFunctionFromCodeBlock(tree.body);

			parent.body.pop();
			parent.body.push(mainLoop);
			parent.body.push(fnctAfter);

			parent.body.push(createReturnValue(createFunctionInvocation(mainLoop.id.name)));

			var fnctInvoMain = createFunctionInvocation(mainLoop.id.name);
			var fnctInvoExit = createFunctionInvocation(fnctAfter.id.name);
			fnctInvoMain.condition = tree.test;
			fnctInvoExit.condition = createNotValue(tree.test);
			mainLoop.body.body.push(createReturnValue(fnctInvoMain));
			mainLoop.body.body.push(createReturnValue(fnctInvoExit));

			divideElementaryCodeBlock(mainLoop);
			divideElementaryCodeBlock(fnctAfter);
			break;

		case "WhileStatement":
			var fnctAfter = createFunctionFromCodeBlock(spliceCodeBlock(tree, parent));
			var mainLoop = createFunctionFromCodeBlock(tree.body);

			parent.body.pop();
			parent.body.push(mainLoop);
			parent.body.push(fnctAfter);

			var fnctInvoMain = createFunctionInvocation(mainLoop.id.name);
			var fnctInvoExit = createFunctionInvocation(fnctAfter.id.name);
			fnctInvoMain.condition = tree.test;
			fnctInvoExit.condition = createNotValue(tree.test);

			parent.body.push(createReturnValue(fnctInvoMain));
			parent.body.push(createReturnValue(fnctInvoExit));

			mainLoop.body.body.push(createReturnValue(fnctInvoMain));
			mainLoop.body.body.push(createReturnValue(fnctInvoExit));

			divideElementaryCodeBlock(mainLoop);
			divideElementaryCodeBlock(fnctAfter);
			break;

		case "SwitchStatement":
			// Ignore switch case with no "case".
			if (tree.cases.length == 0) {
				break;
			}

			var fnctAfter = createFunctionFromCodeBlock(spliceCodeBlock(tree, parent));
			var discriminant = tree.discriminant;
			var returnToEnd = createReturnValue(createFunctionInvocation(fnctAfter.id.name));

			parent.body.pop();
			parent.body.push(fnctAfter);

			var previousFunction;
			var accumulatedCases = [];

			for (var i=0; i<tree.cases.length; i++) {
				var switchCase = tree.cases[i];
				var codeBlockCase = createFunctionFromCodeBlock(switchCase.consequent);
				parent.body.push(codeBlockCase);

				if (previousFunction) {
					previousFunction.body.body.push(createReturnValue(createFunctionInvocation(codeBlockCase.id.name)));
				}

				var fnctInvoCase = createFunctionInvocation(codeBlockCase.id.name);

				if (switchCase.test != null) {
					fnctInvoCase.condition = createEqualityExpression(discriminant, switchCase.test);
				} else {
					// Case for "default"
					var accumulatedTest = null;
					for (var j=0; j<tree.cases.length; j++) {
						var switchCaseInner = tree.cases[j];
						var notTest = createNotValue(createEqualityExpression(discriminant, switchCase.test));

						if (accumulatedTest == null) {
							accumulatedTest = notTest;
						} else {
							accumulatedTest = createAndValue(accumulatedTest, notTest);
						}
					}
					fnctInvoCase.condition = accumulatedTest || createLiteral(true);
				}

				replaceBreakStatement(codeBlockCase.body.body, returnToEnd);
				previousFunction = codeBlockCase;
				accumulatedCases.push(codeBlockCase);
				parent.body.push(createReturnValue(fnctInvoCase));
			}

			// Handling for empty switch/case
			if (previousFunction) {
				previousFunction.body.body.push(returnToEnd);
			}

			for (var i=0; i<accumulatedCases.length; i++) {
				divideElementaryCodeBlock(accumulatedCases[i]);
			}

			break;

		default:
			if (tree.body && !tree.body.synthetic) {
				/*var fnctAfter = createFunctionFromCodeBlock(spliceCodeBlock(tree, parent));
				var returnToEnd = createReturnValue(createFunctionInvocation(fnctAfter.id.name));
				var fnctBody = createFunctionFromCodeBlock(tree);
				fnctBody.body.body.push(returnToEnd);

				parent.body.pop();
				parent.body.push(fnctAfter);
				parent.body.push(fnctBody);
				parent.body.push(createReturnValue(createFunctionInvocation(fnctBody.id.name)));
				divideElementaryCodeBlock(fnctBody.body);
				break;*/
			}

			for (let prop in tree) {
				if (tree.hasOwnProperty(prop)) {
					divideElementaryCodeBlock(tree[prop], newParent);
				}
			}
			break;
	}
}

exportFnct.divideElementaryCodeBlock = divideElementaryCodeBlock;

module.exports = exportFnct;
