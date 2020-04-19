function getInstance(options) {
	// INIT
	var self = {};

	// DATA
	var codeBlocks = {};
	var invocations = {};
	var values = {};

	// METHOD
	function addCodeBlock(codeBlock) {
		if (!codeBlock.id) {
			codeBlock.id = generateId();
		}

		if (!codeBlock.invocations) {
			codeBlock.invocations = [];
		}

		codeBlocks[codeBlock.id] = codeBlock;
		return codeBlock;
	}
	self.addCodeBlock = addCodeBlock;

	function getCodeBlock(codeBlockId) {
		return codeBlocks[codeBlockId];
	}
	self.getCodeBlock = getCodeBlock;

	function getCodeBlocks() {
		return Object.values(codeBlocks);
	}
	self.getCodeBlocks = getCodeBlocks;

	function findCodeBlock(name) {
		for (var i in codeBlocks) {
			if (codeBlocks[i].name === name) {
				return codeBlocks[i];
			}
		}
	}
	self.findCodeBlock = findCodeBlock;

	function linkCodeBlockToInvocation(codeBlock, invocation) {
		codeBlock.invocations.push(invocation);
	}
	self.linkCodeBlockToInvocation = linkCodeBlockToInvocation;

	function addInvocation(invocation) {
		if (!invocation.id) {
			invocation.id = generateId();
		}

		if (!invocation.arguments) {
			invocation.arguments = [];
		} 

		invocations[invocation.id] = invocation;
		return invocation;
	}
	self.addInvocation = addInvocation;

	function getInvocation(id) {
		return invocations[id];
	}
	self.getInvocation = getInvocation;

	function getInvocations() {
		return Object.values(invocations);
	}
	self.getInvocations = getInvocations;

	function addValue(value) {
		if (!value.id) {
			value.id = generateId();
		}

		if (!value.__type) {
			value.__type = value.constructor.name;
		}

		values[value.id]  = value;
		return value;
	}
	self.addValue = addValue;

	function getValue(id) {
		return values[id];
	}
	self.getValue = getValue;

	function getValues() {
		return Object.values(values);
	}
	self.getValues = getValues;

	function findValue(obj) {
		for (var i in values) {
			if (values[i].equals(obj)) {
				return values[i];
			}
		}
	}
	self.findValue = findValue;

	function findReferencesTo(id) {
		var groups = [codeBlocks, invocations, values];
		var results = [];

		for (var i=0; i<groups.length; i++) {
			for (var index in groups[i]) {
				results = results.concat(_findReferencesTo(id, groups[i][index], true));
			}
		}

		return results;
	}

	function _findReferencesTo(id, all, topLevel) {
		var result = [];
		if (Array.isArray(all)) {
			for (var i=0; i<all.length; i++) {
				var tmpResult = _findReferencesTo(id, all[i], false);
				result = result.concat(tmpResult);
			}
		} else if (typeof all === "object") {
			if (all.id === id && !topLevel) {
				result.push(true);
			}

			for (var index in all) {
				var item = all[index];

				if (item) {
					tmpResult = _findReferencesTo(id, all[index], false);

					if (tmpResult.indexOf(true) !== -1) {
						if (all.id) {
							result.push({parent: all, property: index});
							tmpResult = tmpResult.filter(function (a) { return a !== true });
						}
					}

					result = result.concat(tmpResult);
				}
			}
		}
		
		return result;
	}
	self.findReferencesTo = findReferencesTo;

	// INTERNAL
	function generateId() {
		var p1 = Math.random().toString(16).substr(2);
		var p2 = Math.random().toString(16).substr(2);
		return (p1 + p2).substr(0, 30);
	}

	// END
	return self;
}

module.exports = {
	getInstance : getInstance
}
