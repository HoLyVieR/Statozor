/// class Function

function FunctionCodeBlock(name) {
	this.name = name;
	this.invocations = [];
	this.returns = [];
}

FunctionCodeBlock.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "FunctionCodeBlock") {
		return false;
	}

	if (this.name !== val.name) {
		return false;
	}

	return true;
}

FunctionCodeBlock.prototype.size = function () {
	var size = 1;
	
	for (var i=0; i<this.invocations.length; i++) {
		size += this.invocations[i].size();
	}

	for (var i=0; i<this.returns.length; i++) {
		size += this.returns[i].size();
	}

	return size;
};

module.exports = FunctionCodeBlock;
