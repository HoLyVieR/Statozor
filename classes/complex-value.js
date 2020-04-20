function ComplexValue() {
	this.constants = [];
	this.variables = [];
}

ComplexValue.prototype.toHumanValue = function () {
	return "@{ComplexValue(constants=[" + 
		this.constants.map(function (a) { return a.toHumanValue(); }).join(",")  
		+ "], variables=[" + 
		this.variables.map(function (a) { return a.toHumanValue(); }).join(",")  
		+ "])}";
};

ComplexValue.prototype.addConstant = function (constant) {
	var found = false;

	for (var i=0; i<this.constants.length; i++) {
		if (this.constants[i].equals(constant)) {
			found = true;
			break;
		}
	}

	if (!found) {
		this.constants.push(constant);
	}
};

ComplexValue.prototype.addVariable = function (variable) {
	var found = false;
	
	for (var i=0; i<this.variables.length; i++) {
		if (this.variables[i].equals(variable)) {
			found = true;
			break;
		}
	}

	if (!found) {
		this.variables.push(variable);
	}
};

ComplexValue.prototype.merge = function (complexValue) {
	for (var i=0; i<complexValue.variables.length; i++) {
		this.addVariable(complexValue.variables[i]);
	}

	for (var i=0; i<complexValue.constants.length; i++) {
		this.addConstant(complexValue.constants[i]);
	}
};

ComplexValue.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "ComplexValue") {
		//console.log("FAILED CONSTRUCTOR");
		return false;
	}

	if (val.constants.length !== this.constants.length || val.variables.length !== this.variables.length) {
		//console.log("FAILED LENGTH");
		return false;
	}

	var good = true;

	this.constants.forEach(function (value, key, map) {
		if (val.constants.filter(function (a) { return a.equals(value); }).length == 0) {
			good = false;
		}
	});

	//console.log("FAILED CONSTANTS ? " + good);

	this.variables.forEach(function (value, key, map) {
		if (val.variables.filter(function (a) { return a.equals(value); }).length == 0) {
			good = false;
			return;
		}
	});

	//console.log("FAILED VARIABLES ? " + good);

	return good;
};

ComplexValue.prototype.size = function () {
	return 0;
};

module.exports = ComplexValue;