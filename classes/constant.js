/// class Constant

function Constant(value) {
	this.value = value;
}

Constant.prototype.toHumanValue = function () {
	return this.value;
}

Constant.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "Constant") {
		return false;
	}

	return this.value === val.value;
}

Constant.prototype.size = function () {
	return 1;
};

module.exports = Constant;
