var acorn = require("acorn");
var utils = require("./utils");

/**
 * Constant
 */

var CONST_SEPARATOR_ID = require("./constant").CONST_SEPARATOR_ID;
var PLACEHOLDER_VARIABLE = require("./constant").PLACEHOLDER_VARIABLE;

/**
 * Classes to represent the stucture used in the utility.
 */

var AnalysisResult     = require("./classes/analysis-result");
var ArrayStructure     = require("./classes/array-structure");
var Concatenation      = require("./classes/concatenation");
var Constant           = require("./classes/constant");
var Context            = require("./classes/context");
var FunctionArgument   = require("./classes/function-argument");
var FunctionInvocation = require("./classes/function-invocation");
var GlobalFunctionCall = require("./classes/global-function-call");
var LocalFunctionCall  = require("./classes/local-function-call");
var MemberExpression   = require("./classes/member-expression");
var ObjectFunctionCall = require("./classes/object-function-call");
var ObjectStructure    = require("./classes/object-structure");
var Reference          = require("./classes/reference");
var Unknown            = require("./classes/unknown");

/**
 * Storage & Query
 */

var graph = require("./graph/main");

