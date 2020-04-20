/// class FunctionArgument

function FunctionArgument(fnct, variableName, index) {
	if (!fnct) {
		throw new Error("Type of fnct must be string or object.");	
	}

	if (typeof variableName !== "string") {
		throw new Error("Type of variableName must be string.");
	}

	if (typeof index !== "number") {
		throw new Error("Type of index must be number.");
	}
	
	this.name = variableName;
	this.fnct = fnct;
	this.index = index;
}

FunctionArgument.prototype.toHumanValue = function () {
	return "@{arg" + this.index + "(" + this.name + ")}";
}

FunctionArgument.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "FunctionArgument") {
		return false;
	}
	
	if (typeof this.fnct === "string") {
		if (val.fnct !== this.fnct) {
			return false;
		}	
	} else if (!this.fnct.equals(val.fnct)) {
		return false;
	}

	if (this.index !== val.index) {
		return false;
	}

	return true;
}

FunctionArgument.prototype.size = function () {
	var size = 1;

	if (typeof this.fnct !== "string") {
		size += this.fnct.size();
	}

	return size;
};

module.exports = FunctionArgument;
