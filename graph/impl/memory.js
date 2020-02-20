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
