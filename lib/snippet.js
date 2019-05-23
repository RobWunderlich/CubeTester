var b = {};
var a = {};
a.x = true;
var c = {};
b.x = 'Z';
x = a.x || b.x || c.x;
console.log(x);