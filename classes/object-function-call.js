/// class ObjectFunctionCall

var MemberExpression   = require("./member-expression");

function ObjectFunctionCall(members, args) {
	if (typeof args !== "object" || typeof args.length !== "number") {
                throw new Error("Type of args must be array.");
        }	

	this.members = new MemberExpression(members);
	this.arguments = args;
}

ObjectFunctionCall.prototype.toHumanValue = function () {
	//TODO
};

ObjectFunctionCall.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "ObjectFunctionCall") {
		return false;
	}

	if (!this.members.equals(val.members)) {
		return false;
	}

	if (this.arguments.length !== val.arguments.length) {
		return false;
	}

	var good = true;

	this.arguments.forEach(function (value, index) {
		if (!value.equals(val.arguments[index])) {
			good = false;
		}
	});

	return good;
};

ObjectFunctionCall.prototype.size = function () {
	var size = 1;
	
	for (var i=0; i<this.arguments.length; i++) {
		size += this.arguments[i].size();
	}

	size += this.members.size();
	return size;
};

module.exports = ObjectFunctionCall;
