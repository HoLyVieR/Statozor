/// class Function

function FunctionCodeBlock(name) {
	this.name = name;
	this.invocations = [];
}

FunctionCodeBlock.prototype.equals = function (val) {
	if (val.constructor.name !== "FunctionCodeBlock") {
		return false;
	}

	if (this.name !== val.name) {
		return false;
	}
}

module.exports = FunctionCodeBlock;
