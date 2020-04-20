function input(abc) {
	return abc;
}

function test(cb) {
	bob(cb);
}

function bob(abc) {
	abc("foo");
}

test(function (foo) {
	var test;

	if (true) {
		test = "abc";
	} else {
		test = "def";
	}

	if (true) {
		test = test + "foo";
	} else {
		test = test + "bar";
	}

	eval(test);
})