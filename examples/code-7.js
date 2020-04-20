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
		test = input("abc");
	} else {
		test = input("def");
	}

	if (true) {
		test = test + input("foo");
	} else {
		test = test + "bar";
	}

	eval(test);
})