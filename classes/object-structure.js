/// class ObjectStructure

function ObjectStructure(type) {
	if (typeof type === "undefined" || type === null) {
		type = "G$Object";
	}
	
	this.properties = new Map();
	this.type = type;
}

ObjectStructure.prototype.toHumanValue = function () {
	return "@{obj(" + this.type + ")}";
};

ObjectStructure.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "ObjectStructure") {
		return false;
	}

	if (val.properties.size !== this.properties.size || val.type !== this.type) {
		return false;
	}

	var good = true;

	this.properties.forEach(function (value, key, map) {
		if (!val.properties.has(key)) {
			good = false;
			return;
		}

		if (!val.properties.get(key).equals(value)) {
			good = false;
			return;
		}

	});

	return good;
};

ObjectStructure.prototype.size = function () {
	var size = 1;
	
	this.properties.forEach(function (value, key, map) {
		size += key.size();
		size += value.size();
	});

	return size;
};

module.exports = ObjectStructure;