function input() {
	return "bob";
}

function test(cb) {
	bob(cb);
}

function bob(abc) {
	abc("foo");
}

test(function (foo) {
	function abcdef(ppp) {
		eval(foo + "&" + ppp);
		eval(input());
	}

	abcdef("bar");
})