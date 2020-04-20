/// class ArrayStructure

function ArrayStructure() {
	this.values = [];
}

ArrayStructure.prototype.toHumanValue = function () {
	return "@{[" + this.values.map(function (a) { return a.toHumanValue(); }).join(",")  + "]}";
};

ArrayStructure.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "ArrayStructure") {
		return false;
	}

	if (val.values.length !== this.values.length) {
		return false;
	}

	var good = true;

	this.values.forEach(function (value, key, map) {
		if (!val.values[key].equals(value)) {
			good = false;
			return;
		}
	});

	return good;
};

ArrayStructure.prototype.size = function () {
	var size = 1;
	
	for (var i=0; i<this.values.length; i++) {
		size += this.values[i].size();
	}

	return size;
};

module.exports = ArrayStructure;