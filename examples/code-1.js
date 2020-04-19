/*function def() {

}

function test(abc) {
	//var xhr = new XMLHttpRequest();
	//xhr.open("GET", "/my-api", true);
	//xhr.send(null);
	var b = def(function () {
		
	});
}*/

/*d = 4;

if (1) {
	if (2) {
		e = 5;
	}
	a = 1;
} else {
	b = 2;
}

c = 3;*/

/*
b = 1;
for (var i=0; i<5; i++) {
	a = 4;
}
c = 3;
*/

function test(cb) {
	bob(cb);
}

function bob(abc) {
	abc("test");
}

test(function (foo) {
	eval(foo);
	eval(input());
})