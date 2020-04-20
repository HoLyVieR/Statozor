/// class FunctionInvocation

function FunctionInvocation() {
	this.fnct = null;
	this.arguments = [];
	this.condition = null;
}

FunctionInvocation.prototype.equals = function (val) {
	if (!val) {
		return false;
	}

	if (val.constructor.name !== "FunctionInvocation") {
		return false;
	}

	if (!this.fnct.equals(val.fnct)) {
		return false;
	}

	if (this.arguments.length !== val.arguments.length) {
		return false;
	}

	/*if (this.condition !== val.condition) {
		return false;
	}*/

	var good = true;

	this.arguments.forEach(function (value, index) {
		if (!value.equals(val.arguments[index])) {
			good = false;
		}
	});

	return good;
}

FunctionInvocation.prototype.toHumanValue = function () {
	return this.fnct.toHumanValue() + "(" + this.arguments.map(
		function (args) { 
			return args.toHumanValue(); 
		}).join(", ") 
	+ ")";
};

FunctionInvocation.prototype.size = function () {
	var size = 1;
	
	for (var i=0; i<this.arguments.length; i++) {
		size += this.arguments[i].size();
	}

	size += this.fnct.size();
	return size;
};

module.exports = FunctionInvocation;
