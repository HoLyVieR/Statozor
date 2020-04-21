function test(cb) {
	bob(cb);
}

function bob(abc) {
	abc("test");
}

var a = function (foo) {
	eval(foo);
	eval(input());
};

test(a);