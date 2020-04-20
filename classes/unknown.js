/// class Unknown

function Unknown() {

}

Unknown.prototype.toHumanValue = function () {
	return "@{UNKNOWN}";
}

Unknown.prototype.equals = function (val) {
	if (!val) {
		return false;
	}
	
	if (val.constructor.name !== "Unknown") {
		return false;
	}

	return true;
}

Unknown.prototype.size = function () {
	return 1;
};


module.exports = Unknown;