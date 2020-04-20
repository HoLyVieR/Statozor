function tmp(foo) {
	var test = "1";

	for (var i=0; i<5; i++) {
		test += "a";
		eval(test);
	}
}