/// class MemberExpression

function MemberExpression(parts) {
	if (typeof parts !== "object" || typeof parts.length !== "number") {
                throw new Error("Type of parts must be array.");
        }	
	
	this.parts = parts;
}

MemberExpression.prototype.toHumanValue = function () {
	var result = "";
	for (let i=0; i<this.parts.length; i++) {
		result += this.parts[i].toHumanValue() + ".";
	}
	result = result.substring(0, result.length - 1);
	return result;
}

MemberExpression.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "MemberExpression") {
		return false;
	}

	if (this.parts.length !== val.parts.length) {
		return false;
	}

	var good = true;
	
	this.parts.forEach(function (value, key, map) {
		if (!value.equals(val.parts[key])) {
			good = false;
		}
	});

	return good;
}

MemberExpression.prototype.size = function () {
	var size = 1;
	
	for (var i=0; i<this.parts.length; i++) {
		size += this.parts[i].size();
	}

	return size;
};

module.exports = MemberExpression;
