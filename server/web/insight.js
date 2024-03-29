(function(scope){
'use strict';

function F(arity, fun, wrapper) {
  wrapper.a = arity;
  wrapper.f = fun;
  return wrapper;
}

function F2(fun) {
  return F(2, fun, function(a) { return function(b) { return fun(a,b); }; })
}
function F3(fun) {
  return F(3, fun, function(a) {
    return function(b) { return function(c) { return fun(a, b, c); }; };
  });
}
function F4(fun) {
  return F(4, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return fun(a, b, c, d); }; }; };
  });
}
function F5(fun) {
  return F(5, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return fun(a, b, c, d, e); }; }; }; };
  });
}
function F6(fun) {
  return F(6, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return fun(a, b, c, d, e, f); }; }; }; }; };
  });
}
function F7(fun) {
  return F(7, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return fun(a, b, c, d, e, f, g); }; }; }; }; }; };
  });
}
function F8(fun) {
  return F(8, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) {
    return fun(a, b, c, d, e, f, g, h); }; }; }; }; }; }; };
  });
}
function F9(fun) {
  return F(9, fun, function(a) { return function(b) { return function(c) {
    return function(d) { return function(e) { return function(f) {
    return function(g) { return function(h) { return function(i) {
    return fun(a, b, c, d, e, f, g, h, i); }; }; }; }; }; }; }; };
  });
}

function A2(fun, a, b) {
  return fun.a === 2 ? fun.f(a, b) : fun(a)(b);
}
function A3(fun, a, b, c) {
  return fun.a === 3 ? fun.f(a, b, c) : fun(a)(b)(c);
}
function A4(fun, a, b, c, d) {
  return fun.a === 4 ? fun.f(a, b, c, d) : fun(a)(b)(c)(d);
}
function A5(fun, a, b, c, d, e) {
  return fun.a === 5 ? fun.f(a, b, c, d, e) : fun(a)(b)(c)(d)(e);
}
function A6(fun, a, b, c, d, e, f) {
  return fun.a === 6 ? fun.f(a, b, c, d, e, f) : fun(a)(b)(c)(d)(e)(f);
}
function A7(fun, a, b, c, d, e, f, g) {
  return fun.a === 7 ? fun.f(a, b, c, d, e, f, g) : fun(a)(b)(c)(d)(e)(f)(g);
}
function A8(fun, a, b, c, d, e, f, g, h) {
  return fun.a === 8 ? fun.f(a, b, c, d, e, f, g, h) : fun(a)(b)(c)(d)(e)(f)(g)(h);
}
function A9(fun, a, b, c, d, e, f, g, h, i) {
  return fun.a === 9 ? fun.f(a, b, c, d, e, f, g, h, i) : fun(a)(b)(c)(d)(e)(f)(g)(h)(i);
}

console.warn('Compiled in DEV mode. Follow the advice at https://elm-lang.org/0.19.1/optimize for better performance and smaller assets.');


// EQUALITY

function _Utils_eq(x, y)
{
	for (
		var pair, stack = [], isEqual = _Utils_eqHelp(x, y, 0, stack);
		isEqual && (pair = stack.pop());
		isEqual = _Utils_eqHelp(pair.a, pair.b, 0, stack)
		)
	{}

	return isEqual;
}

function _Utils_eqHelp(x, y, depth, stack)
{
	if (x === y)
	{
		return true;
	}

	if (typeof x !== 'object' || x === null || y === null)
	{
		typeof x === 'function' && _Debug_crash(5);
		return false;
	}

	if (depth > 100)
	{
		stack.push(_Utils_Tuple2(x,y));
		return true;
	}

	/**/
	if (x.$ === 'Set_elm_builtin')
	{
		x = $elm$core$Set$toList(x);
		y = $elm$core$Set$toList(y);
	}
	if (x.$ === 'RBNode_elm_builtin' || x.$ === 'RBEmpty_elm_builtin')
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	/**_UNUSED/
	if (x.$ < 0)
	{
		x = $elm$core$Dict$toList(x);
		y = $elm$core$Dict$toList(y);
	}
	//*/

	for (var key in x)
	{
		if (!_Utils_eqHelp(x[key], y[key], depth + 1, stack))
		{
			return false;
		}
	}
	return true;
}

var _Utils_equal = F2(_Utils_eq);
var _Utils_notEqual = F2(function(a, b) { return !_Utils_eq(a,b); });



// COMPARISONS

// Code in Generate/JavaScript.hs, Basics.js, and List.js depends on
// the particular integer values assigned to LT, EQ, and GT.

function _Utils_cmp(x, y, ord)
{
	if (typeof x !== 'object')
	{
		return x === y ? /*EQ*/ 0 : x < y ? /*LT*/ -1 : /*GT*/ 1;
	}

	/**/
	if (x instanceof String)
	{
		var a = x.valueOf();
		var b = y.valueOf();
		return a === b ? 0 : a < b ? -1 : 1;
	}
	//*/

	/**_UNUSED/
	if (typeof x.$ === 'undefined')
	//*/
	/**/
	if (x.$[0] === '#')
	//*/
	{
		return (ord = _Utils_cmp(x.a, y.a))
			? ord
			: (ord = _Utils_cmp(x.b, y.b))
				? ord
				: _Utils_cmp(x.c, y.c);
	}

	// traverse conses until end of a list or a mismatch
	for (; x.b && y.b && !(ord = _Utils_cmp(x.a, y.a)); x = x.b, y = y.b) {} // WHILE_CONSES
	return ord || (x.b ? /*GT*/ 1 : y.b ? /*LT*/ -1 : /*EQ*/ 0);
}

var _Utils_lt = F2(function(a, b) { return _Utils_cmp(a, b) < 0; });
var _Utils_le = F2(function(a, b) { return _Utils_cmp(a, b) < 1; });
var _Utils_gt = F2(function(a, b) { return _Utils_cmp(a, b) > 0; });
var _Utils_ge = F2(function(a, b) { return _Utils_cmp(a, b) >= 0; });

var _Utils_compare = F2(function(x, y)
{
	var n = _Utils_cmp(x, y);
	return n < 0 ? $elm$core$Basics$LT : n ? $elm$core$Basics$GT : $elm$core$Basics$EQ;
});


// COMMON VALUES

var _Utils_Tuple0_UNUSED = 0;
var _Utils_Tuple0 = { $: '#0' };

function _Utils_Tuple2_UNUSED(a, b) { return { a: a, b: b }; }
function _Utils_Tuple2(a, b) { return { $: '#2', a: a, b: b }; }

function _Utils_Tuple3_UNUSED(a, b, c) { return { a: a, b: b, c: c }; }
function _Utils_Tuple3(a, b, c) { return { $: '#3', a: a, b: b, c: c }; }

function _Utils_chr_UNUSED(c) { return c; }
function _Utils_chr(c) { return new String(c); }


// RECORDS

function _Utils_update(oldRecord, updatedFields)
{
	var newRecord = {};

	for (var key in oldRecord)
	{
		newRecord[key] = oldRecord[key];
	}

	for (var key in updatedFields)
	{
		newRecord[key] = updatedFields[key];
	}

	return newRecord;
}


// APPEND

var _Utils_append = F2(_Utils_ap);

function _Utils_ap(xs, ys)
{
	// append Strings
	if (typeof xs === 'string')
	{
		return xs + ys;
	}

	// append Lists
	if (!xs.b)
	{
		return ys;
	}
	var root = _List_Cons(xs.a, ys);
	xs = xs.b
	for (var curr = root; xs.b; xs = xs.b) // WHILE_CONS
	{
		curr = curr.b = _List_Cons(xs.a, ys);
	}
	return root;
}



var _List_Nil_UNUSED = { $: 0 };
var _List_Nil = { $: '[]' };

function _List_Cons_UNUSED(hd, tl) { return { $: 1, a: hd, b: tl }; }
function _List_Cons(hd, tl) { return { $: '::', a: hd, b: tl }; }


var _List_cons = F2(_List_Cons);

function _List_fromArray(arr)
{
	var out = _List_Nil;
	for (var i = arr.length; i--; )
	{
		out = _List_Cons(arr[i], out);
	}
	return out;
}

function _List_toArray(xs)
{
	for (var out = []; xs.b; xs = xs.b) // WHILE_CONS
	{
		out.push(xs.a);
	}
	return out;
}

var _List_map2 = F3(function(f, xs, ys)
{
	for (var arr = []; xs.b && ys.b; xs = xs.b, ys = ys.b) // WHILE_CONSES
	{
		arr.push(A2(f, xs.a, ys.a));
	}
	return _List_fromArray(arr);
});

var _List_map3 = F4(function(f, xs, ys, zs)
{
	for (var arr = []; xs.b && ys.b && zs.b; xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A3(f, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map4 = F5(function(f, ws, xs, ys, zs)
{
	for (var arr = []; ws.b && xs.b && ys.b && zs.b; ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A4(f, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_map5 = F6(function(f, vs, ws, xs, ys, zs)
{
	for (var arr = []; vs.b && ws.b && xs.b && ys.b && zs.b; vs = vs.b, ws = ws.b, xs = xs.b, ys = ys.b, zs = zs.b) // WHILE_CONSES
	{
		arr.push(A5(f, vs.a, ws.a, xs.a, ys.a, zs.a));
	}
	return _List_fromArray(arr);
});

var _List_sortBy = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		return _Utils_cmp(f(a), f(b));
	}));
});

var _List_sortWith = F2(function(f, xs)
{
	return _List_fromArray(_List_toArray(xs).sort(function(a, b) {
		var ord = A2(f, a, b);
		return ord === $elm$core$Basics$EQ ? 0 : ord === $elm$core$Basics$LT ? -1 : 1;
	}));
});



var _JsArray_empty = [];

function _JsArray_singleton(value)
{
    return [value];
}

function _JsArray_length(array)
{
    return array.length;
}

var _JsArray_initialize = F3(function(size, offset, func)
{
    var result = new Array(size);

    for (var i = 0; i < size; i++)
    {
        result[i] = func(offset + i);
    }

    return result;
});

var _JsArray_initializeFromList = F2(function (max, ls)
{
    var result = new Array(max);

    for (var i = 0; i < max && ls.b; i++)
    {
        result[i] = ls.a;
        ls = ls.b;
    }

    result.length = i;
    return _Utils_Tuple2(result, ls);
});

var _JsArray_unsafeGet = F2(function(index, array)
{
    return array[index];
});

var _JsArray_unsafeSet = F3(function(index, value, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[index] = value;
    return result;
});

var _JsArray_push = F2(function(value, array)
{
    var length = array.length;
    var result = new Array(length + 1);

    for (var i = 0; i < length; i++)
    {
        result[i] = array[i];
    }

    result[length] = value;
    return result;
});

var _JsArray_foldl = F3(function(func, acc, array)
{
    var length = array.length;

    for (var i = 0; i < length; i++)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_foldr = F3(function(func, acc, array)
{
    for (var i = array.length - 1; i >= 0; i--)
    {
        acc = A2(func, array[i], acc);
    }

    return acc;
});

var _JsArray_map = F2(function(func, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = func(array[i]);
    }

    return result;
});

var _JsArray_indexedMap = F3(function(func, offset, array)
{
    var length = array.length;
    var result = new Array(length);

    for (var i = 0; i < length; i++)
    {
        result[i] = A2(func, offset + i, array[i]);
    }

    return result;
});

var _JsArray_slice = F3(function(from, to, array)
{
    return array.slice(from, to);
});

var _JsArray_appendN = F3(function(n, dest, source)
{
    var destLen = dest.length;
    var itemsToCopy = n - destLen;

    if (itemsToCopy > source.length)
    {
        itemsToCopy = source.length;
    }

    var size = destLen + itemsToCopy;
    var result = new Array(size);

    for (var i = 0; i < destLen; i++)
    {
        result[i] = dest[i];
    }

    for (var i = 0; i < itemsToCopy; i++)
    {
        result[i + destLen] = source[i];
    }

    return result;
});



// LOG

var _Debug_log_UNUSED = F2(function(tag, value)
{
	return value;
});

var _Debug_log = F2(function(tag, value)
{
	console.log(tag + ': ' + _Debug_toString(value));
	return value;
});


// TODOS

function _Debug_todo(moduleName, region)
{
	return function(message) {
		_Debug_crash(8, moduleName, region, message);
	};
}

function _Debug_todoCase(moduleName, region, value)
{
	return function(message) {
		_Debug_crash(9, moduleName, region, value, message);
	};
}


// TO STRING

function _Debug_toString_UNUSED(value)
{
	return '<internals>';
}

function _Debug_toString(value)
{
	return _Debug_toAnsiString(false, value);
}

function _Debug_toAnsiString(ansi, value)
{
	if (typeof value === 'function')
	{
		return _Debug_internalColor(ansi, '<function>');
	}

	if (typeof value === 'boolean')
	{
		return _Debug_ctorColor(ansi, value ? 'True' : 'False');
	}

	if (typeof value === 'number')
	{
		return _Debug_numberColor(ansi, value + '');
	}

	if (value instanceof String)
	{
		return _Debug_charColor(ansi, "'" + _Debug_addSlashes(value, true) + "'");
	}

	if (typeof value === 'string')
	{
		return _Debug_stringColor(ansi, '"' + _Debug_addSlashes(value, false) + '"');
	}

	if (typeof value === 'object' && '$' in value)
	{
		var tag = value.$;

		if (typeof tag === 'number')
		{
			return _Debug_internalColor(ansi, '<internals>');
		}

		if (tag[0] === '#')
		{
			var output = [];
			for (var k in value)
			{
				if (k === '$') continue;
				output.push(_Debug_toAnsiString(ansi, value[k]));
			}
			return '(' + output.join(',') + ')';
		}

		if (tag === 'Set_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Set')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Set$toList(value));
		}

		if (tag === 'RBNode_elm_builtin' || tag === 'RBEmpty_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Dict')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Dict$toList(value));
		}

		if (tag === 'Array_elm_builtin')
		{
			return _Debug_ctorColor(ansi, 'Array')
				+ _Debug_fadeColor(ansi, '.fromList') + ' '
				+ _Debug_toAnsiString(ansi, $elm$core$Array$toList(value));
		}

		if (tag === '::' || tag === '[]')
		{
			var output = '[';

			value.b && (output += _Debug_toAnsiString(ansi, value.a), value = value.b)

			for (; value.b; value = value.b) // WHILE_CONS
			{
				output += ',' + _Debug_toAnsiString(ansi, value.a);
			}
			return output + ']';
		}

		var output = '';
		for (var i in value)
		{
			if (i === '$') continue;
			var str = _Debug_toAnsiString(ansi, value[i]);
			var c0 = str[0];
			var parenless = c0 === '{' || c0 === '(' || c0 === '[' || c0 === '<' || c0 === '"' || str.indexOf(' ') < 0;
			output += ' ' + (parenless ? str : '(' + str + ')');
		}
		return _Debug_ctorColor(ansi, tag) + output;
	}

	if (typeof DataView === 'function' && value instanceof DataView)
	{
		return _Debug_stringColor(ansi, '<' + value.byteLength + ' bytes>');
	}

	if (typeof File !== 'undefined' && value instanceof File)
	{
		return _Debug_internalColor(ansi, '<' + value.name + '>');
	}

	if (typeof value === 'object')
	{
		var output = [];
		for (var key in value)
		{
			var field = key[0] === '_' ? key.slice(1) : key;
			output.push(_Debug_fadeColor(ansi, field) + ' = ' + _Debug_toAnsiString(ansi, value[key]));
		}
		if (output.length === 0)
		{
			return '{}';
		}
		return '{ ' + output.join(', ') + ' }';
	}

	return _Debug_internalColor(ansi, '<internals>');
}

function _Debug_addSlashes(str, isChar)
{
	var s = str
		.replace(/\\/g, '\\\\')
		.replace(/\n/g, '\\n')
		.replace(/\t/g, '\\t')
		.replace(/\r/g, '\\r')
		.replace(/\v/g, '\\v')
		.replace(/\0/g, '\\0');

	if (isChar)
	{
		return s.replace(/\'/g, '\\\'');
	}
	else
	{
		return s.replace(/\"/g, '\\"');
	}
}

function _Debug_ctorColor(ansi, string)
{
	return ansi ? '\x1b[96m' + string + '\x1b[0m' : string;
}

function _Debug_numberColor(ansi, string)
{
	return ansi ? '\x1b[95m' + string + '\x1b[0m' : string;
}

function _Debug_stringColor(ansi, string)
{
	return ansi ? '\x1b[93m' + string + '\x1b[0m' : string;
}

function _Debug_charColor(ansi, string)
{
	return ansi ? '\x1b[92m' + string + '\x1b[0m' : string;
}

function _Debug_fadeColor(ansi, string)
{
	return ansi ? '\x1b[37m' + string + '\x1b[0m' : string;
}

function _Debug_internalColor(ansi, string)
{
	return ansi ? '\x1b[36m' + string + '\x1b[0m' : string;
}

function _Debug_toHexDigit(n)
{
	return String.fromCharCode(n < 10 ? 48 + n : 55 + n);
}


// CRASH


function _Debug_crash_UNUSED(identifier)
{
	throw new Error('https://github.com/elm/core/blob/1.0.0/hints/' + identifier + '.md');
}


function _Debug_crash(identifier, fact1, fact2, fact3, fact4)
{
	switch(identifier)
	{
		case 0:
			throw new Error('What node should I take over? In JavaScript I need something like:\n\n    Elm.Main.init({\n        node: document.getElementById("elm-node")\n    })\n\nYou need to do this with any Browser.sandbox or Browser.element program.');

		case 1:
			throw new Error('Browser.application programs cannot handle URLs like this:\n\n    ' + document.location.href + '\n\nWhat is the root? The root of your file system? Try looking at this program with `elm reactor` or some other server.');

		case 2:
			var jsonErrorString = fact1;
			throw new Error('Problem with the flags given to your Elm program on initialization.\n\n' + jsonErrorString);

		case 3:
			var portName = fact1;
			throw new Error('There can only be one port named `' + portName + '`, but your program has multiple.');

		case 4:
			var portName = fact1;
			var problem = fact2;
			throw new Error('Trying to send an unexpected type of value through port `' + portName + '`:\n' + problem);

		case 5:
			throw new Error('Trying to use `(==)` on functions.\nThere is no way to know if functions are "the same" in the Elm sense.\nRead more about this at https://package.elm-lang.org/packages/elm/core/latest/Basics#== which describes why it is this way and what the better version will look like.');

		case 6:
			var moduleName = fact1;
			throw new Error('Your page is loading multiple Elm scripts with a module named ' + moduleName + '. Maybe a duplicate script is getting loaded accidentally? If not, rename one of them so I know which is which!');

		case 8:
			var moduleName = fact1;
			var region = fact2;
			var message = fact3;
			throw new Error('TODO in module `' + moduleName + '` ' + _Debug_regionToString(region) + '\n\n' + message);

		case 9:
			var moduleName = fact1;
			var region = fact2;
			var value = fact3;
			var message = fact4;
			throw new Error(
				'TODO in module `' + moduleName + '` from the `case` expression '
				+ _Debug_regionToString(region) + '\n\nIt received the following value:\n\n    '
				+ _Debug_toString(value).replace('\n', '\n    ')
				+ '\n\nBut the branch that handles it says:\n\n    ' + message.replace('\n', '\n    ')
			);

		case 10:
			throw new Error('Bug in https://github.com/elm/virtual-dom/issues');

		case 11:
			throw new Error('Cannot perform mod 0. Division by zero error.');
	}
}

function _Debug_regionToString(region)
{
	if (region.start.line === region.end.line)
	{
		return 'on line ' + region.start.line;
	}
	return 'on lines ' + region.start.line + ' through ' + region.end.line;
}



// MATH

var _Basics_add = F2(function(a, b) { return a + b; });
var _Basics_sub = F2(function(a, b) { return a - b; });
var _Basics_mul = F2(function(a, b) { return a * b; });
var _Basics_fdiv = F2(function(a, b) { return a / b; });
var _Basics_idiv = F2(function(a, b) { return (a / b) | 0; });
var _Basics_pow = F2(Math.pow);

var _Basics_remainderBy = F2(function(b, a) { return a % b; });

// https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/divmodnote-letter.pdf
var _Basics_modBy = F2(function(modulus, x)
{
	var answer = x % modulus;
	return modulus === 0
		? _Debug_crash(11)
		:
	((answer > 0 && modulus < 0) || (answer < 0 && modulus > 0))
		? answer + modulus
		: answer;
});


// TRIGONOMETRY

var _Basics_pi = Math.PI;
var _Basics_e = Math.E;
var _Basics_cos = Math.cos;
var _Basics_sin = Math.sin;
var _Basics_tan = Math.tan;
var _Basics_acos = Math.acos;
var _Basics_asin = Math.asin;
var _Basics_atan = Math.atan;
var _Basics_atan2 = F2(Math.atan2);


// MORE MATH

function _Basics_toFloat(x) { return x; }
function _Basics_truncate(n) { return n | 0; }
function _Basics_isInfinite(n) { return n === Infinity || n === -Infinity; }

var _Basics_ceiling = Math.ceil;
var _Basics_floor = Math.floor;
var _Basics_round = Math.round;
var _Basics_sqrt = Math.sqrt;
var _Basics_log = Math.log;
var _Basics_isNaN = isNaN;


// BOOLEANS

function _Basics_not(bool) { return !bool; }
var _Basics_and = F2(function(a, b) { return a && b; });
var _Basics_or  = F2(function(a, b) { return a || b; });
var _Basics_xor = F2(function(a, b) { return a !== b; });



var _String_cons = F2(function(chr, str)
{
	return chr + str;
});

function _String_uncons(string)
{
	var word = string.charCodeAt(0);
	return !isNaN(word)
		? $elm$core$Maybe$Just(
			0xD800 <= word && word <= 0xDBFF
				? _Utils_Tuple2(_Utils_chr(string[0] + string[1]), string.slice(2))
				: _Utils_Tuple2(_Utils_chr(string[0]), string.slice(1))
		)
		: $elm$core$Maybe$Nothing;
}

var _String_append = F2(function(a, b)
{
	return a + b;
});

function _String_length(str)
{
	return str.length;
}

var _String_map = F2(function(func, string)
{
	var len = string.length;
	var array = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = string.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			array[i] = func(_Utils_chr(string[i] + string[i+1]));
			i += 2;
			continue;
		}
		array[i] = func(_Utils_chr(string[i]));
		i++;
	}
	return array.join('');
});

var _String_filter = F2(function(isGood, str)
{
	var arr = [];
	var len = str.length;
	var i = 0;
	while (i < len)
	{
		var char = str[i];
		var word = str.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += str[i];
			i++;
		}

		if (isGood(_Utils_chr(char)))
		{
			arr.push(char);
		}
	}
	return arr.join('');
});

function _String_reverse(str)
{
	var len = str.length;
	var arr = new Array(len);
	var i = 0;
	while (i < len)
	{
		var word = str.charCodeAt(i);
		if (0xD800 <= word && word <= 0xDBFF)
		{
			arr[len - i] = str[i + 1];
			i++;
			arr[len - i] = str[i - 1];
			i++;
		}
		else
		{
			arr[len - i] = str[i];
			i++;
		}
	}
	return arr.join('');
}

var _String_foldl = F3(function(func, state, string)
{
	var len = string.length;
	var i = 0;
	while (i < len)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		i++;
		if (0xD800 <= word && word <= 0xDBFF)
		{
			char += string[i];
			i++;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_foldr = F3(function(func, state, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		state = A2(func, _Utils_chr(char), state);
	}
	return state;
});

var _String_split = F2(function(sep, str)
{
	return str.split(sep);
});

var _String_join = F2(function(sep, strs)
{
	return strs.join(sep);
});

var _String_slice = F3(function(start, end, str) {
	return str.slice(start, end);
});

function _String_trim(str)
{
	return str.trim();
}

function _String_trimLeft(str)
{
	return str.replace(/^\s+/, '');
}

function _String_trimRight(str)
{
	return str.replace(/\s+$/, '');
}

function _String_words(str)
{
	return _List_fromArray(str.trim().split(/\s+/g));
}

function _String_lines(str)
{
	return _List_fromArray(str.split(/\r\n|\r|\n/g));
}

function _String_toUpper(str)
{
	return str.toUpperCase();
}

function _String_toLower(str)
{
	return str.toLowerCase();
}

var _String_any = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (isGood(_Utils_chr(char)))
		{
			return true;
		}
	}
	return false;
});

var _String_all = F2(function(isGood, string)
{
	var i = string.length;
	while (i--)
	{
		var char = string[i];
		var word = string.charCodeAt(i);
		if (0xDC00 <= word && word <= 0xDFFF)
		{
			i--;
			char = string[i] + char;
		}
		if (!isGood(_Utils_chr(char)))
		{
			return false;
		}
	}
	return true;
});

var _String_contains = F2(function(sub, str)
{
	return str.indexOf(sub) > -1;
});

var _String_startsWith = F2(function(sub, str)
{
	return str.indexOf(sub) === 0;
});

var _String_endsWith = F2(function(sub, str)
{
	return str.length >= sub.length &&
		str.lastIndexOf(sub) === str.length - sub.length;
});

var _String_indexes = F2(function(sub, str)
{
	var subLen = sub.length;

	if (subLen < 1)
	{
		return _List_Nil;
	}

	var i = 0;
	var is = [];

	while ((i = str.indexOf(sub, i)) > -1)
	{
		is.push(i);
		i = i + subLen;
	}

	return _List_fromArray(is);
});


// TO STRING

function _String_fromNumber(number)
{
	return number + '';
}


// INT CONVERSIONS

function _String_toInt(str)
{
	var total = 0;
	var code0 = str.charCodeAt(0);
	var start = code0 == 0x2B /* + */ || code0 == 0x2D /* - */ ? 1 : 0;

	for (var i = start; i < str.length; ++i)
	{
		var code = str.charCodeAt(i);
		if (code < 0x30 || 0x39 < code)
		{
			return $elm$core$Maybe$Nothing;
		}
		total = 10 * total + code - 0x30;
	}

	return i == start
		? $elm$core$Maybe$Nothing
		: $elm$core$Maybe$Just(code0 == 0x2D ? -total : total);
}


// FLOAT CONVERSIONS

function _String_toFloat(s)
{
	// check if it is a hex, octal, or binary number
	if (s.length === 0 || /[\sxbo]/.test(s))
	{
		return $elm$core$Maybe$Nothing;
	}
	var n = +s;
	// faster isNaN check
	return n === n ? $elm$core$Maybe$Just(n) : $elm$core$Maybe$Nothing;
}

function _String_fromList(chars)
{
	return _List_toArray(chars).join('');
}




function _Char_toCode(char)
{
	var code = char.charCodeAt(0);
	if (0xD800 <= code && code <= 0xDBFF)
	{
		return (code - 0xD800) * 0x400 + char.charCodeAt(1) - 0xDC00 + 0x10000
	}
	return code;
}

function _Char_fromCode(code)
{
	return _Utils_chr(
		(code < 0 || 0x10FFFF < code)
			? '\uFFFD'
			:
		(code <= 0xFFFF)
			? String.fromCharCode(code)
			:
		(code -= 0x10000,
			String.fromCharCode(Math.floor(code / 0x400) + 0xD800, code % 0x400 + 0xDC00)
		)
	);
}

function _Char_toUpper(char)
{
	return _Utils_chr(char.toUpperCase());
}

function _Char_toLower(char)
{
	return _Utils_chr(char.toLowerCase());
}

function _Char_toLocaleUpper(char)
{
	return _Utils_chr(char.toLocaleUpperCase());
}

function _Char_toLocaleLower(char)
{
	return _Utils_chr(char.toLocaleLowerCase());
}



/**/
function _Json_errorToString(error)
{
	return $elm$json$Json$Decode$errorToString(error);
}
//*/


// CORE DECODERS

function _Json_succeed(msg)
{
	return {
		$: 0,
		a: msg
	};
}

function _Json_fail(msg)
{
	return {
		$: 1,
		a: msg
	};
}

function _Json_decodePrim(decoder)
{
	return { $: 2, b: decoder };
}

var _Json_decodeInt = _Json_decodePrim(function(value) {
	return (typeof value !== 'number')
		? _Json_expecting('an INT', value)
		:
	(-2147483647 < value && value < 2147483647 && (value | 0) === value)
		? $elm$core$Result$Ok(value)
		:
	(isFinite(value) && !(value % 1))
		? $elm$core$Result$Ok(value)
		: _Json_expecting('an INT', value);
});

var _Json_decodeBool = _Json_decodePrim(function(value) {
	return (typeof value === 'boolean')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a BOOL', value);
});

var _Json_decodeFloat = _Json_decodePrim(function(value) {
	return (typeof value === 'number')
		? $elm$core$Result$Ok(value)
		: _Json_expecting('a FLOAT', value);
});

var _Json_decodeValue = _Json_decodePrim(function(value) {
	return $elm$core$Result$Ok(_Json_wrap(value));
});

var _Json_decodeString = _Json_decodePrim(function(value) {
	return (typeof value === 'string')
		? $elm$core$Result$Ok(value)
		: (value instanceof String)
			? $elm$core$Result$Ok(value + '')
			: _Json_expecting('a STRING', value);
});

function _Json_decodeList(decoder) { return { $: 3, b: decoder }; }
function _Json_decodeArray(decoder) { return { $: 4, b: decoder }; }

function _Json_decodeNull(value) { return { $: 5, c: value }; }

var _Json_decodeField = F2(function(field, decoder)
{
	return {
		$: 6,
		d: field,
		b: decoder
	};
});

var _Json_decodeIndex = F2(function(index, decoder)
{
	return {
		$: 7,
		e: index,
		b: decoder
	};
});

function _Json_decodeKeyValuePairs(decoder)
{
	return {
		$: 8,
		b: decoder
	};
}

function _Json_mapMany(f, decoders)
{
	return {
		$: 9,
		f: f,
		g: decoders
	};
}

var _Json_andThen = F2(function(callback, decoder)
{
	return {
		$: 10,
		b: decoder,
		h: callback
	};
});

function _Json_oneOf(decoders)
{
	return {
		$: 11,
		g: decoders
	};
}


// DECODING OBJECTS

var _Json_map1 = F2(function(f, d1)
{
	return _Json_mapMany(f, [d1]);
});

var _Json_map2 = F3(function(f, d1, d2)
{
	return _Json_mapMany(f, [d1, d2]);
});

var _Json_map3 = F4(function(f, d1, d2, d3)
{
	return _Json_mapMany(f, [d1, d2, d3]);
});

var _Json_map4 = F5(function(f, d1, d2, d3, d4)
{
	return _Json_mapMany(f, [d1, d2, d3, d4]);
});

var _Json_map5 = F6(function(f, d1, d2, d3, d4, d5)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5]);
});

var _Json_map6 = F7(function(f, d1, d2, d3, d4, d5, d6)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6]);
});

var _Json_map7 = F8(function(f, d1, d2, d3, d4, d5, d6, d7)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7]);
});

var _Json_map8 = F9(function(f, d1, d2, d3, d4, d5, d6, d7, d8)
{
	return _Json_mapMany(f, [d1, d2, d3, d4, d5, d6, d7, d8]);
});


// DECODE

var _Json_runOnString = F2(function(decoder, string)
{
	try
	{
		var value = JSON.parse(string);
		return _Json_runHelp(decoder, value);
	}
	catch (e)
	{
		return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'This is not valid JSON! ' + e.message, _Json_wrap(string)));
	}
});

var _Json_run = F2(function(decoder, value)
{
	return _Json_runHelp(decoder, _Json_unwrap(value));
});

function _Json_runHelp(decoder, value)
{
	switch (decoder.$)
	{
		case 2:
			return decoder.b(value);

		case 5:
			return (value === null)
				? $elm$core$Result$Ok(decoder.c)
				: _Json_expecting('null', value);

		case 3:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('a LIST', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _List_fromArray);

		case 4:
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			return _Json_runArrayDecoder(decoder.b, value, _Json_toElmArray);

		case 6:
			var field = decoder.d;
			if (typeof value !== 'object' || value === null || !(field in value))
			{
				return _Json_expecting('an OBJECT with a field named `' + field + '`', value);
			}
			var result = _Json_runHelp(decoder.b, value[field]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, field, result.a));

		case 7:
			var index = decoder.e;
			if (!_Json_isArray(value))
			{
				return _Json_expecting('an ARRAY', value);
			}
			if (index >= value.length)
			{
				return _Json_expecting('a LONGER array. Need index ' + index + ' but only see ' + value.length + ' entries', value);
			}
			var result = _Json_runHelp(decoder.b, value[index]);
			return ($elm$core$Result$isOk(result)) ? result : $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, index, result.a));

		case 8:
			if (typeof value !== 'object' || value === null || _Json_isArray(value))
			{
				return _Json_expecting('an OBJECT', value);
			}

			var keyValuePairs = _List_Nil;
			// TODO test perf of Object.keys and switch when support is good enough
			for (var key in value)
			{
				if (value.hasOwnProperty(key))
				{
					var result = _Json_runHelp(decoder.b, value[key]);
					if (!$elm$core$Result$isOk(result))
					{
						return $elm$core$Result$Err(A2($elm$json$Json$Decode$Field, key, result.a));
					}
					keyValuePairs = _List_Cons(_Utils_Tuple2(key, result.a), keyValuePairs);
				}
			}
			return $elm$core$Result$Ok($elm$core$List$reverse(keyValuePairs));

		case 9:
			var answer = decoder.f;
			var decoders = decoder.g;
			for (var i = 0; i < decoders.length; i++)
			{
				var result = _Json_runHelp(decoders[i], value);
				if (!$elm$core$Result$isOk(result))
				{
					return result;
				}
				answer = answer(result.a);
			}
			return $elm$core$Result$Ok(answer);

		case 10:
			var result = _Json_runHelp(decoder.b, value);
			return (!$elm$core$Result$isOk(result))
				? result
				: _Json_runHelp(decoder.h(result.a), value);

		case 11:
			var errors = _List_Nil;
			for (var temp = decoder.g; temp.b; temp = temp.b) // WHILE_CONS
			{
				var result = _Json_runHelp(temp.a, value);
				if ($elm$core$Result$isOk(result))
				{
					return result;
				}
				errors = _List_Cons(result.a, errors);
			}
			return $elm$core$Result$Err($elm$json$Json$Decode$OneOf($elm$core$List$reverse(errors)));

		case 1:
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, decoder.a, _Json_wrap(value)));

		case 0:
			return $elm$core$Result$Ok(decoder.a);
	}
}

function _Json_runArrayDecoder(decoder, value, toElmValue)
{
	var len = value.length;
	var array = new Array(len);
	for (var i = 0; i < len; i++)
	{
		var result = _Json_runHelp(decoder, value[i]);
		if (!$elm$core$Result$isOk(result))
		{
			return $elm$core$Result$Err(A2($elm$json$Json$Decode$Index, i, result.a));
		}
		array[i] = result.a;
	}
	return $elm$core$Result$Ok(toElmValue(array));
}

function _Json_isArray(value)
{
	return Array.isArray(value) || (typeof FileList !== 'undefined' && value instanceof FileList);
}

function _Json_toElmArray(array)
{
	return A2($elm$core$Array$initialize, array.length, function(i) { return array[i]; });
}

function _Json_expecting(type, value)
{
	return $elm$core$Result$Err(A2($elm$json$Json$Decode$Failure, 'Expecting ' + type, _Json_wrap(value)));
}


// EQUALITY

function _Json_equality(x, y)
{
	if (x === y)
	{
		return true;
	}

	if (x.$ !== y.$)
	{
		return false;
	}

	switch (x.$)
	{
		case 0:
		case 1:
			return x.a === y.a;

		case 2:
			return x.b === y.b;

		case 5:
			return x.c === y.c;

		case 3:
		case 4:
		case 8:
			return _Json_equality(x.b, y.b);

		case 6:
			return x.d === y.d && _Json_equality(x.b, y.b);

		case 7:
			return x.e === y.e && _Json_equality(x.b, y.b);

		case 9:
			return x.f === y.f && _Json_listEquality(x.g, y.g);

		case 10:
			return x.h === y.h && _Json_equality(x.b, y.b);

		case 11:
			return _Json_listEquality(x.g, y.g);
	}
}

function _Json_listEquality(aDecoders, bDecoders)
{
	var len = aDecoders.length;
	if (len !== bDecoders.length)
	{
		return false;
	}
	for (var i = 0; i < len; i++)
	{
		if (!_Json_equality(aDecoders[i], bDecoders[i]))
		{
			return false;
		}
	}
	return true;
}


// ENCODE

var _Json_encode = F2(function(indentLevel, value)
{
	return JSON.stringify(_Json_unwrap(value), null, indentLevel) + '';
});

function _Json_wrap(value) { return { $: 0, a: value }; }
function _Json_unwrap(value) { return value.a; }

function _Json_wrap_UNUSED(value) { return value; }
function _Json_unwrap_UNUSED(value) { return value; }

function _Json_emptyArray() { return []; }
function _Json_emptyObject() { return {}; }

var _Json_addField = F3(function(key, value, object)
{
	object[key] = _Json_unwrap(value);
	return object;
});

function _Json_addEntry(func)
{
	return F2(function(entry, array)
	{
		array.push(_Json_unwrap(func(entry)));
		return array;
	});
}

var _Json_encodeNull = _Json_wrap(null);



// TASKS

function _Scheduler_succeed(value)
{
	return {
		$: 0,
		a: value
	};
}

function _Scheduler_fail(error)
{
	return {
		$: 1,
		a: error
	};
}

function _Scheduler_binding(callback)
{
	return {
		$: 2,
		b: callback,
		c: null
	};
}

var _Scheduler_andThen = F2(function(callback, task)
{
	return {
		$: 3,
		b: callback,
		d: task
	};
});

var _Scheduler_onError = F2(function(callback, task)
{
	return {
		$: 4,
		b: callback,
		d: task
	};
});

function _Scheduler_receive(callback)
{
	return {
		$: 5,
		b: callback
	};
}


// PROCESSES

var _Scheduler_guid = 0;

function _Scheduler_rawSpawn(task)
{
	var proc = {
		$: 0,
		e: _Scheduler_guid++,
		f: task,
		g: null,
		h: []
	};

	_Scheduler_enqueue(proc);

	return proc;
}

function _Scheduler_spawn(task)
{
	return _Scheduler_binding(function(callback) {
		callback(_Scheduler_succeed(_Scheduler_rawSpawn(task)));
	});
}

function _Scheduler_rawSend(proc, msg)
{
	proc.h.push(msg);
	_Scheduler_enqueue(proc);
}

var _Scheduler_send = F2(function(proc, msg)
{
	return _Scheduler_binding(function(callback) {
		_Scheduler_rawSend(proc, msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});

function _Scheduler_kill(proc)
{
	return _Scheduler_binding(function(callback) {
		var task = proc.f;
		if (task.$ === 2 && task.c)
		{
			task.c();
		}

		proc.f = null;

		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
}


/* STEP PROCESSES

type alias Process =
  { $ : tag
  , id : unique_id
  , root : Task
  , stack : null | { $: SUCCEED | FAIL, a: callback, b: stack }
  , mailbox : [msg]
  }

*/


var _Scheduler_working = false;
var _Scheduler_queue = [];


function _Scheduler_enqueue(proc)
{
	_Scheduler_queue.push(proc);
	if (_Scheduler_working)
	{
		return;
	}
	_Scheduler_working = true;
	while (proc = _Scheduler_queue.shift())
	{
		_Scheduler_step(proc);
	}
	_Scheduler_working = false;
}


function _Scheduler_step(proc)
{
	while (proc.f)
	{
		var rootTag = proc.f.$;
		if (rootTag === 0 || rootTag === 1)
		{
			while (proc.g && proc.g.$ !== rootTag)
			{
				proc.g = proc.g.i;
			}
			if (!proc.g)
			{
				return;
			}
			proc.f = proc.g.b(proc.f.a);
			proc.g = proc.g.i;
		}
		else if (rootTag === 2)
		{
			proc.f.c = proc.f.b(function(newRoot) {
				proc.f = newRoot;
				_Scheduler_enqueue(proc);
			});
			return;
		}
		else if (rootTag === 5)
		{
			if (proc.h.length === 0)
			{
				return;
			}
			proc.f = proc.f.b(proc.h.shift());
		}
		else // if (rootTag === 3 || rootTag === 4)
		{
			proc.g = {
				$: rootTag === 3 ? 0 : 1,
				b: proc.f.b,
				i: proc.g
			};
			proc.f = proc.f.d;
		}
	}
}



function _Process_sleep(time)
{
	return _Scheduler_binding(function(callback) {
		var id = setTimeout(function() {
			callback(_Scheduler_succeed(_Utils_Tuple0));
		}, time);

		return function() { clearTimeout(id); };
	});
}




// PROGRAMS


var _Platform_worker = F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function() { return function() {} }
	);
});



// INITIALIZE A PROGRAM


function _Platform_initialize(flagDecoder, args, init, update, subscriptions, stepperBuilder)
{
	var result = A2(_Json_run, flagDecoder, _Json_wrap(args ? args['flags'] : undefined));
	$elm$core$Result$isOk(result) || _Debug_crash(2 /**/, _Json_errorToString(result.a) /**/);
	var managers = {};
	var initPair = init(result.a);
	var model = initPair.a;
	var stepper = stepperBuilder(sendToApp, model);
	var ports = _Platform_setupEffects(managers, sendToApp);

	function sendToApp(msg, viewMetadata)
	{
		var pair = A2(update, msg, model);
		stepper(model = pair.a, viewMetadata);
		_Platform_enqueueEffects(managers, pair.b, subscriptions(model));
	}

	_Platform_enqueueEffects(managers, initPair.b, subscriptions(model));

	return ports ? { ports: ports } : {};
}



// TRACK PRELOADS
//
// This is used by code in elm/browser and elm/http
// to register any HTTP requests that are triggered by init.
//


var _Platform_preload;


function _Platform_registerPreload(url)
{
	_Platform_preload.add(url);
}



// EFFECT MANAGERS


var _Platform_effectManagers = {};


function _Platform_setupEffects(managers, sendToApp)
{
	var ports;

	// setup all necessary effect managers
	for (var key in _Platform_effectManagers)
	{
		var manager = _Platform_effectManagers[key];

		if (manager.a)
		{
			ports = ports || {};
			ports[key] = manager.a(key, sendToApp);
		}

		managers[key] = _Platform_instantiateManager(manager, sendToApp);
	}

	return ports;
}


function _Platform_createManager(init, onEffects, onSelfMsg, cmdMap, subMap)
{
	return {
		b: init,
		c: onEffects,
		d: onSelfMsg,
		e: cmdMap,
		f: subMap
	};
}


function _Platform_instantiateManager(info, sendToApp)
{
	var router = {
		g: sendToApp,
		h: undefined
	};

	var onEffects = info.c;
	var onSelfMsg = info.d;
	var cmdMap = info.e;
	var subMap = info.f;

	function loop(state)
	{
		return A2(_Scheduler_andThen, loop, _Scheduler_receive(function(msg)
		{
			var value = msg.a;

			if (msg.$ === 0)
			{
				return A3(onSelfMsg, router, value, state);
			}

			return cmdMap && subMap
				? A4(onEffects, router, value.i, value.j, state)
				: A3(onEffects, router, cmdMap ? value.i : value.j, state);
		}));
	}

	return router.h = _Scheduler_rawSpawn(A2(_Scheduler_andThen, loop, info.b));
}



// ROUTING


var _Platform_sendToApp = F2(function(router, msg)
{
	return _Scheduler_binding(function(callback)
	{
		router.g(msg);
		callback(_Scheduler_succeed(_Utils_Tuple0));
	});
});


var _Platform_sendToSelf = F2(function(router, msg)
{
	return A2(_Scheduler_send, router.h, {
		$: 0,
		a: msg
	});
});



// BAGS


function _Platform_leaf(home)
{
	return function(value)
	{
		return {
			$: 1,
			k: home,
			l: value
		};
	};
}


function _Platform_batch(list)
{
	return {
		$: 2,
		m: list
	};
}


var _Platform_map = F2(function(tagger, bag)
{
	return {
		$: 3,
		n: tagger,
		o: bag
	}
});



// PIPE BAGS INTO EFFECT MANAGERS
//
// Effects must be queued!
//
// Say your init contains a synchronous command, like Time.now or Time.here
//
//   - This will produce a batch of effects (FX_1)
//   - The synchronous task triggers the subsequent `update` call
//   - This will produce a batch of effects (FX_2)
//
// If we just start dispatching FX_2, subscriptions from FX_2 can be processed
// before subscriptions from FX_1. No good! Earlier versions of this code had
// this problem, leading to these reports:
//
//   https://github.com/elm/core/issues/980
//   https://github.com/elm/core/pull/981
//   https://github.com/elm/compiler/issues/1776
//
// The queue is necessary to avoid ordering issues for synchronous commands.


// Why use true/false here? Why not just check the length of the queue?
// The goal is to detect "are we currently dispatching effects?" If we
// are, we need to bail and let the ongoing while loop handle things.
//
// Now say the queue has 1 element. When we dequeue the final element,
// the queue will be empty, but we are still actively dispatching effects.
// So you could get queue jumping in a really tricky category of cases.
//
var _Platform_effectsQueue = [];
var _Platform_effectsActive = false;


function _Platform_enqueueEffects(managers, cmdBag, subBag)
{
	_Platform_effectsQueue.push({ p: managers, q: cmdBag, r: subBag });

	if (_Platform_effectsActive) return;

	_Platform_effectsActive = true;
	for (var fx; fx = _Platform_effectsQueue.shift(); )
	{
		_Platform_dispatchEffects(fx.p, fx.q, fx.r);
	}
	_Platform_effectsActive = false;
}


function _Platform_dispatchEffects(managers, cmdBag, subBag)
{
	var effectsDict = {};
	_Platform_gatherEffects(true, cmdBag, effectsDict, null);
	_Platform_gatherEffects(false, subBag, effectsDict, null);

	for (var home in managers)
	{
		_Scheduler_rawSend(managers[home], {
			$: 'fx',
			a: effectsDict[home] || { i: _List_Nil, j: _List_Nil }
		});
	}
}


function _Platform_gatherEffects(isCmd, bag, effectsDict, taggers)
{
	switch (bag.$)
	{
		case 1:
			var home = bag.k;
			var effect = _Platform_toEffect(isCmd, home, taggers, bag.l);
			effectsDict[home] = _Platform_insert(isCmd, effect, effectsDict[home]);
			return;

		case 2:
			for (var list = bag.m; list.b; list = list.b) // WHILE_CONS
			{
				_Platform_gatherEffects(isCmd, list.a, effectsDict, taggers);
			}
			return;

		case 3:
			_Platform_gatherEffects(isCmd, bag.o, effectsDict, {
				s: bag.n,
				t: taggers
			});
			return;
	}
}


function _Platform_toEffect(isCmd, home, taggers, value)
{
	function applyTaggers(x)
	{
		for (var temp = taggers; temp; temp = temp.t)
		{
			x = temp.s(x);
		}
		return x;
	}

	var map = isCmd
		? _Platform_effectManagers[home].e
		: _Platform_effectManagers[home].f;

	return A2(map, applyTaggers, value)
}


function _Platform_insert(isCmd, newEffect, effects)
{
	effects = effects || { i: _List_Nil, j: _List_Nil };

	isCmd
		? (effects.i = _List_Cons(newEffect, effects.i))
		: (effects.j = _List_Cons(newEffect, effects.j));

	return effects;
}



// PORTS


function _Platform_checkPortName(name)
{
	if (_Platform_effectManagers[name])
	{
		_Debug_crash(3, name)
	}
}



// OUTGOING PORTS


function _Platform_outgoingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		e: _Platform_outgoingPortMap,
		u: converter,
		a: _Platform_setupOutgoingPort
	};
	return _Platform_leaf(name);
}


var _Platform_outgoingPortMap = F2(function(tagger, value) { return value; });


function _Platform_setupOutgoingPort(name)
{
	var subs = [];
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Process_sleep(0);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, cmdList, state)
	{
		for ( ; cmdList.b; cmdList = cmdList.b) // WHILE_CONS
		{
			// grab a separate reference to subs in case unsubscribe is called
			var currentSubs = subs;
			var value = _Json_unwrap(converter(cmdList.a));
			for (var i = 0; i < currentSubs.length; i++)
			{
				currentSubs[i](value);
			}
		}
		return init;
	});

	// PUBLIC API

	function subscribe(callback)
	{
		subs.push(callback);
	}

	function unsubscribe(callback)
	{
		// copy subs into a new array in case unsubscribe is called within a
		// subscribed callback
		subs = subs.slice();
		var index = subs.indexOf(callback);
		if (index >= 0)
		{
			subs.splice(index, 1);
		}
	}

	return {
		subscribe: subscribe,
		unsubscribe: unsubscribe
	};
}



// INCOMING PORTS


function _Platform_incomingPort(name, converter)
{
	_Platform_checkPortName(name);
	_Platform_effectManagers[name] = {
		f: _Platform_incomingPortMap,
		u: converter,
		a: _Platform_setupIncomingPort
	};
	return _Platform_leaf(name);
}


var _Platform_incomingPortMap = F2(function(tagger, finalTagger)
{
	return function(value)
	{
		return tagger(finalTagger(value));
	};
});


function _Platform_setupIncomingPort(name, sendToApp)
{
	var subs = _List_Nil;
	var converter = _Platform_effectManagers[name].u;

	// CREATE MANAGER

	var init = _Scheduler_succeed(null);

	_Platform_effectManagers[name].b = init;
	_Platform_effectManagers[name].c = F3(function(router, subList, state)
	{
		subs = subList;
		return init;
	});

	// PUBLIC API

	function send(incomingValue)
	{
		var result = A2(_Json_run, converter, _Json_wrap(incomingValue));

		$elm$core$Result$isOk(result) || _Debug_crash(4, name, result.a);

		var value = result.a;
		for (var temp = subs; temp.b; temp = temp.b) // WHILE_CONS
		{
			sendToApp(temp.a(value));
		}
	}

	return { send: send };
}



// EXPORT ELM MODULES
//
// Have DEBUG and PROD versions so that we can (1) give nicer errors in
// debug mode and (2) not pay for the bits needed for that in prod mode.
//


function _Platform_export_UNUSED(exports)
{
	scope['Elm']
		? _Platform_mergeExportsProd(scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsProd(obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6)
				: _Platform_mergeExportsProd(obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}


function _Platform_export(exports)
{
	scope['Elm']
		? _Platform_mergeExportsDebug('Elm', scope['Elm'], exports)
		: scope['Elm'] = exports;
}


function _Platform_mergeExportsDebug(moduleName, obj, exports)
{
	for (var name in exports)
	{
		(name in obj)
			? (name == 'init')
				? _Debug_crash(6, moduleName)
				: _Platform_mergeExportsDebug(moduleName + '.' + name, obj[name], exports[name])
			: (obj[name] = exports[name]);
	}
}




// HELPERS


var _VirtualDom_divertHrefToApp;

var _VirtualDom_doc = typeof document !== 'undefined' ? document : {};


function _VirtualDom_appendChild(parent, child)
{
	parent.appendChild(child);
}

var _VirtualDom_init = F4(function(virtualNode, flagDecoder, debugMetadata, args)
{
	// NOTE: this function needs _Platform_export available to work

	/**_UNUSED/
	var node = args['node'];
	//*/
	/**/
	var node = args && args['node'] ? args['node'] : _Debug_crash(0);
	//*/

	node.parentNode.replaceChild(
		_VirtualDom_render(virtualNode, function() {}),
		node
	);

	return {};
});



// TEXT


function _VirtualDom_text(string)
{
	return {
		$: 0,
		a: string
	};
}



// NODE


var _VirtualDom_nodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 1,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_node = _VirtualDom_nodeNS(undefined);



// KEYED NODE


var _VirtualDom_keyedNodeNS = F2(function(namespace, tag)
{
	return F2(function(factList, kidList)
	{
		for (var kids = [], descendantsCount = 0; kidList.b; kidList = kidList.b) // WHILE_CONS
		{
			var kid = kidList.a;
			descendantsCount += (kid.b.b || 0);
			kids.push(kid);
		}
		descendantsCount += kids.length;

		return {
			$: 2,
			c: tag,
			d: _VirtualDom_organizeFacts(factList),
			e: kids,
			f: namespace,
			b: descendantsCount
		};
	});
});


var _VirtualDom_keyedNode = _VirtualDom_keyedNodeNS(undefined);



// CUSTOM


function _VirtualDom_custom(factList, model, render, diff)
{
	return {
		$: 3,
		d: _VirtualDom_organizeFacts(factList),
		g: model,
		h: render,
		i: diff
	};
}



// MAP


var _VirtualDom_map = F2(function(tagger, node)
{
	return {
		$: 4,
		j: tagger,
		k: node,
		b: 1 + (node.b || 0)
	};
});



// LAZY


function _VirtualDom_thunk(refs, thunk)
{
	return {
		$: 5,
		l: refs,
		m: thunk,
		k: undefined
	};
}

var _VirtualDom_lazy = F2(function(func, a)
{
	return _VirtualDom_thunk([func, a], function() {
		return func(a);
	});
});

var _VirtualDom_lazy2 = F3(function(func, a, b)
{
	return _VirtualDom_thunk([func, a, b], function() {
		return A2(func, a, b);
	});
});

var _VirtualDom_lazy3 = F4(function(func, a, b, c)
{
	return _VirtualDom_thunk([func, a, b, c], function() {
		return A3(func, a, b, c);
	});
});

var _VirtualDom_lazy4 = F5(function(func, a, b, c, d)
{
	return _VirtualDom_thunk([func, a, b, c, d], function() {
		return A4(func, a, b, c, d);
	});
});

var _VirtualDom_lazy5 = F6(function(func, a, b, c, d, e)
{
	return _VirtualDom_thunk([func, a, b, c, d, e], function() {
		return A5(func, a, b, c, d, e);
	});
});

var _VirtualDom_lazy6 = F7(function(func, a, b, c, d, e, f)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f], function() {
		return A6(func, a, b, c, d, e, f);
	});
});

var _VirtualDom_lazy7 = F8(function(func, a, b, c, d, e, f, g)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g], function() {
		return A7(func, a, b, c, d, e, f, g);
	});
});

var _VirtualDom_lazy8 = F9(function(func, a, b, c, d, e, f, g, h)
{
	return _VirtualDom_thunk([func, a, b, c, d, e, f, g, h], function() {
		return A8(func, a, b, c, d, e, f, g, h);
	});
});



// FACTS


var _VirtualDom_on = F2(function(key, handler)
{
	return {
		$: 'a0',
		n: key,
		o: handler
	};
});
var _VirtualDom_style = F2(function(key, value)
{
	return {
		$: 'a1',
		n: key,
		o: value
	};
});
var _VirtualDom_property = F2(function(key, value)
{
	return {
		$: 'a2',
		n: key,
		o: value
	};
});
var _VirtualDom_attribute = F2(function(key, value)
{
	return {
		$: 'a3',
		n: key,
		o: value
	};
});
var _VirtualDom_attributeNS = F3(function(namespace, key, value)
{
	return {
		$: 'a4',
		n: key,
		o: { f: namespace, o: value }
	};
});



// XSS ATTACK VECTOR CHECKS


function _VirtualDom_noScript(tag)
{
	return tag == 'script' ? 'p' : tag;
}

function _VirtualDom_noOnOrFormAction(key)
{
	return /^(on|formAction$)/i.test(key) ? 'data-' + key : key;
}

function _VirtualDom_noInnerHtmlOrFormAction(key)
{
	return key == 'innerHTML' || key == 'formAction' ? 'data-' + key : key;
}

function _VirtualDom_noJavaScriptUri_UNUSED(value)
{
	return /^javascript:/i.test(value.replace(/\s/g,'')) ? '' : value;
}

function _VirtualDom_noJavaScriptUri(value)
{
	return /^javascript:/i.test(value.replace(/\s/g,''))
		? 'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'
		: value;
}

function _VirtualDom_noJavaScriptOrHtmlUri_UNUSED(value)
{
	return /^\s*(javascript:|data:text\/html)/i.test(value) ? '' : value;
}

function _VirtualDom_noJavaScriptOrHtmlUri(value)
{
	return /^\s*(javascript:|data:text\/html)/i.test(value)
		? 'javascript:alert("This is an XSS vector. Please use ports or web components instead.")'
		: value;
}



// MAP FACTS


var _VirtualDom_mapAttribute = F2(function(func, attr)
{
	return (attr.$ === 'a0')
		? A2(_VirtualDom_on, attr.n, _VirtualDom_mapHandler(func, attr.o))
		: attr;
});

function _VirtualDom_mapHandler(func, handler)
{
	var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

	// 0 = Normal
	// 1 = MayStopPropagation
	// 2 = MayPreventDefault
	// 3 = Custom

	return {
		$: handler.$,
		a:
			!tag
				? A2($elm$json$Json$Decode$map, func, handler.a)
				:
			A3($elm$json$Json$Decode$map2,
				tag < 3
					? _VirtualDom_mapEventTuple
					: _VirtualDom_mapEventRecord,
				$elm$json$Json$Decode$succeed(func),
				handler.a
			)
	};
}

var _VirtualDom_mapEventTuple = F2(function(func, tuple)
{
	return _Utils_Tuple2(func(tuple.a), tuple.b);
});

var _VirtualDom_mapEventRecord = F2(function(func, record)
{
	return {
		message: func(record.message),
		stopPropagation: record.stopPropagation,
		preventDefault: record.preventDefault
	}
});



// ORGANIZE FACTS


function _VirtualDom_organizeFacts(factList)
{
	for (var facts = {}; factList.b; factList = factList.b) // WHILE_CONS
	{
		var entry = factList.a;

		var tag = entry.$;
		var key = entry.n;
		var value = entry.o;

		if (tag === 'a2')
		{
			(key === 'className')
				? _VirtualDom_addClass(facts, key, _Json_unwrap(value))
				: facts[key] = _Json_unwrap(value);

			continue;
		}

		var subFacts = facts[tag] || (facts[tag] = {});
		(tag === 'a3' && key === 'class')
			? _VirtualDom_addClass(subFacts, key, value)
			: subFacts[key] = value;
	}

	return facts;
}

function _VirtualDom_addClass(object, key, newClass)
{
	var classes = object[key];
	object[key] = classes ? classes + ' ' + newClass : newClass;
}



// RENDER


function _VirtualDom_render(vNode, eventNode)
{
	var tag = vNode.$;

	if (tag === 5)
	{
		return _VirtualDom_render(vNode.k || (vNode.k = vNode.m()), eventNode);
	}

	if (tag === 0)
	{
		return _VirtualDom_doc.createTextNode(vNode.a);
	}

	if (tag === 4)
	{
		var subNode = vNode.k;
		var tagger = vNode.j;

		while (subNode.$ === 4)
		{
			typeof tagger !== 'object'
				? tagger = [tagger, subNode.j]
				: tagger.push(subNode.j);

			subNode = subNode.k;
		}

		var subEventRoot = { j: tagger, p: eventNode };
		var domNode = _VirtualDom_render(subNode, subEventRoot);
		domNode.elm_event_node_ref = subEventRoot;
		return domNode;
	}

	if (tag === 3)
	{
		var domNode = vNode.h(vNode.g);
		_VirtualDom_applyFacts(domNode, eventNode, vNode.d);
		return domNode;
	}

	// at this point `tag` must be 1 or 2

	var domNode = vNode.f
		? _VirtualDom_doc.createElementNS(vNode.f, vNode.c)
		: _VirtualDom_doc.createElement(vNode.c);

	if (_VirtualDom_divertHrefToApp && vNode.c == 'a')
	{
		domNode.addEventListener('click', _VirtualDom_divertHrefToApp(domNode));
	}

	_VirtualDom_applyFacts(domNode, eventNode, vNode.d);

	for (var kids = vNode.e, i = 0; i < kids.length; i++)
	{
		_VirtualDom_appendChild(domNode, _VirtualDom_render(tag === 1 ? kids[i] : kids[i].b, eventNode));
	}

	return domNode;
}



// APPLY FACTS


function _VirtualDom_applyFacts(domNode, eventNode, facts)
{
	for (var key in facts)
	{
		var value = facts[key];

		key === 'a1'
			? _VirtualDom_applyStyles(domNode, value)
			:
		key === 'a0'
			? _VirtualDom_applyEvents(domNode, eventNode, value)
			:
		key === 'a3'
			? _VirtualDom_applyAttrs(domNode, value)
			:
		key === 'a4'
			? _VirtualDom_applyAttrsNS(domNode, value)
			:
		((key !== 'value' && key !== 'checked') || domNode[key] !== value) && (domNode[key] = value);
	}
}



// APPLY STYLES


function _VirtualDom_applyStyles(domNode, styles)
{
	var domNodeStyle = domNode.style;

	for (var key in styles)
	{
		domNodeStyle[key] = styles[key];
	}
}



// APPLY ATTRS


function _VirtualDom_applyAttrs(domNode, attrs)
{
	for (var key in attrs)
	{
		var value = attrs[key];
		typeof value !== 'undefined'
			? domNode.setAttribute(key, value)
			: domNode.removeAttribute(key);
	}
}



// APPLY NAMESPACED ATTRS


function _VirtualDom_applyAttrsNS(domNode, nsAttrs)
{
	for (var key in nsAttrs)
	{
		var pair = nsAttrs[key];
		var namespace = pair.f;
		var value = pair.o;

		typeof value !== 'undefined'
			? domNode.setAttributeNS(namespace, key, value)
			: domNode.removeAttributeNS(namespace, key);
	}
}



// APPLY EVENTS


function _VirtualDom_applyEvents(domNode, eventNode, events)
{
	var allCallbacks = domNode.elmFs || (domNode.elmFs = {});

	for (var key in events)
	{
		var newHandler = events[key];
		var oldCallback = allCallbacks[key];

		if (!newHandler)
		{
			domNode.removeEventListener(key, oldCallback);
			allCallbacks[key] = undefined;
			continue;
		}

		if (oldCallback)
		{
			var oldHandler = oldCallback.q;
			if (oldHandler.$ === newHandler.$)
			{
				oldCallback.q = newHandler;
				continue;
			}
			domNode.removeEventListener(key, oldCallback);
		}

		oldCallback = _VirtualDom_makeCallback(eventNode, newHandler);
		domNode.addEventListener(key, oldCallback,
			_VirtualDom_passiveSupported
			&& { passive: $elm$virtual_dom$VirtualDom$toHandlerInt(newHandler) < 2 }
		);
		allCallbacks[key] = oldCallback;
	}
}



// PASSIVE EVENTS


var _VirtualDom_passiveSupported;

try
{
	window.addEventListener('t', null, Object.defineProperty({}, 'passive', {
		get: function() { _VirtualDom_passiveSupported = true; }
	}));
}
catch(e) {}



// EVENT HANDLERS


function _VirtualDom_makeCallback(eventNode, initialHandler)
{
	function callback(event)
	{
		var handler = callback.q;
		var result = _Json_runHelp(handler.a, event);

		if (!$elm$core$Result$isOk(result))
		{
			return;
		}

		var tag = $elm$virtual_dom$VirtualDom$toHandlerInt(handler);

		// 0 = Normal
		// 1 = MayStopPropagation
		// 2 = MayPreventDefault
		// 3 = Custom

		var value = result.a;
		var message = !tag ? value : tag < 3 ? value.a : value.message;
		var stopPropagation = tag == 1 ? value.b : tag == 3 && value.stopPropagation;
		var currentEventNode = (
			stopPropagation && event.stopPropagation(),
			(tag == 2 ? value.b : tag == 3 && value.preventDefault) && event.preventDefault(),
			eventNode
		);
		var tagger;
		var i;
		while (tagger = currentEventNode.j)
		{
			if (typeof tagger == 'function')
			{
				message = tagger(message);
			}
			else
			{
				for (var i = tagger.length; i--; )
				{
					message = tagger[i](message);
				}
			}
			currentEventNode = currentEventNode.p;
		}
		currentEventNode(message, stopPropagation); // stopPropagation implies isSync
	}

	callback.q = initialHandler;

	return callback;
}

function _VirtualDom_equalEvents(x, y)
{
	return x.$ == y.$ && _Json_equality(x.a, y.a);
}



// DIFF


// TODO: Should we do patches like in iOS?
//
// type Patch
//   = At Int Patch
//   | Batch (List Patch)
//   | Change ...
//
// How could it not be better?
//
function _VirtualDom_diff(x, y)
{
	var patches = [];
	_VirtualDom_diffHelp(x, y, patches, 0);
	return patches;
}


function _VirtualDom_pushPatch(patches, type, index, data)
{
	var patch = {
		$: type,
		r: index,
		s: data,
		t: undefined,
		u: undefined
	};
	patches.push(patch);
	return patch;
}


function _VirtualDom_diffHelp(x, y, patches, index)
{
	if (x === y)
	{
		return;
	}

	var xType = x.$;
	var yType = y.$;

	// Bail if you run into different types of nodes. Implies that the
	// structure has changed significantly and it's not worth a diff.
	if (xType !== yType)
	{
		if (xType === 1 && yType === 2)
		{
			y = _VirtualDom_dekey(y);
			yType = 1;
		}
		else
		{
			_VirtualDom_pushPatch(patches, 0, index, y);
			return;
		}
	}

	// Now we know that both nodes are the same $.
	switch (yType)
	{
		case 5:
			var xRefs = x.l;
			var yRefs = y.l;
			var i = xRefs.length;
			var same = i === yRefs.length;
			while (same && i--)
			{
				same = xRefs[i] === yRefs[i];
			}
			if (same)
			{
				y.k = x.k;
				return;
			}
			y.k = y.m();
			var subPatches = [];
			_VirtualDom_diffHelp(x.k, y.k, subPatches, 0);
			subPatches.length > 0 && _VirtualDom_pushPatch(patches, 1, index, subPatches);
			return;

		case 4:
			// gather nested taggers
			var xTaggers = x.j;
			var yTaggers = y.j;
			var nesting = false;

			var xSubNode = x.k;
			while (xSubNode.$ === 4)
			{
				nesting = true;

				typeof xTaggers !== 'object'
					? xTaggers = [xTaggers, xSubNode.j]
					: xTaggers.push(xSubNode.j);

				xSubNode = xSubNode.k;
			}

			var ySubNode = y.k;
			while (ySubNode.$ === 4)
			{
				nesting = true;

				typeof yTaggers !== 'object'
					? yTaggers = [yTaggers, ySubNode.j]
					: yTaggers.push(ySubNode.j);

				ySubNode = ySubNode.k;
			}

			// Just bail if different numbers of taggers. This implies the
			// structure of the virtual DOM has changed.
			if (nesting && xTaggers.length !== yTaggers.length)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			// check if taggers are "the same"
			if (nesting ? !_VirtualDom_pairwiseRefEqual(xTaggers, yTaggers) : xTaggers !== yTaggers)
			{
				_VirtualDom_pushPatch(patches, 2, index, yTaggers);
			}

			// diff everything below the taggers
			_VirtualDom_diffHelp(xSubNode, ySubNode, patches, index + 1);
			return;

		case 0:
			if (x.a !== y.a)
			{
				_VirtualDom_pushPatch(patches, 3, index, y.a);
			}
			return;

		case 1:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKids);
			return;

		case 2:
			_VirtualDom_diffNodes(x, y, patches, index, _VirtualDom_diffKeyedKids);
			return;

		case 3:
			if (x.h !== y.h)
			{
				_VirtualDom_pushPatch(patches, 0, index, y);
				return;
			}

			var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
			factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

			var patch = y.i(x.g, y.g);
			patch && _VirtualDom_pushPatch(patches, 5, index, patch);

			return;
	}
}

// assumes the incoming arrays are the same length
function _VirtualDom_pairwiseRefEqual(as, bs)
{
	for (var i = 0; i < as.length; i++)
	{
		if (as[i] !== bs[i])
		{
			return false;
		}
	}

	return true;
}

function _VirtualDom_diffNodes(x, y, patches, index, diffKids)
{
	// Bail if obvious indicators have changed. Implies more serious
	// structural changes such that it's not worth it to diff.
	if (x.c !== y.c || x.f !== y.f)
	{
		_VirtualDom_pushPatch(patches, 0, index, y);
		return;
	}

	var factsDiff = _VirtualDom_diffFacts(x.d, y.d);
	factsDiff && _VirtualDom_pushPatch(patches, 4, index, factsDiff);

	diffKids(x, y, patches, index);
}



// DIFF FACTS


// TODO Instead of creating a new diff object, it's possible to just test if
// there *is* a diff. During the actual patch, do the diff again and make the
// modifications directly. This way, there's no new allocations. Worth it?
function _VirtualDom_diffFacts(x, y, category)
{
	var diff;

	// look for changes and removals
	for (var xKey in x)
	{
		if (xKey === 'a1' || xKey === 'a0' || xKey === 'a3' || xKey === 'a4')
		{
			var subDiff = _VirtualDom_diffFacts(x[xKey], y[xKey] || {}, xKey);
			if (subDiff)
			{
				diff = diff || {};
				diff[xKey] = subDiff;
			}
			continue;
		}

		// remove if not in the new facts
		if (!(xKey in y))
		{
			diff = diff || {};
			diff[xKey] =
				!category
					? (typeof x[xKey] === 'string' ? '' : null)
					:
				(category === 'a1')
					? ''
					:
				(category === 'a0' || category === 'a3')
					? undefined
					:
				{ f: x[xKey].f, o: undefined };

			continue;
		}

		var xValue = x[xKey];
		var yValue = y[xKey];

		// reference equal, so don't worry about it
		if (xValue === yValue && xKey !== 'value' && xKey !== 'checked'
			|| category === 'a0' && _VirtualDom_equalEvents(xValue, yValue))
		{
			continue;
		}

		diff = diff || {};
		diff[xKey] = yValue;
	}

	// add new stuff
	for (var yKey in y)
	{
		if (!(yKey in x))
		{
			diff = diff || {};
			diff[yKey] = y[yKey];
		}
	}

	return diff;
}



// DIFF KIDS


function _VirtualDom_diffKids(xParent, yParent, patches, index)
{
	var xKids = xParent.e;
	var yKids = yParent.e;

	var xLen = xKids.length;
	var yLen = yKids.length;

	// FIGURE OUT IF THERE ARE INSERTS OR REMOVALS

	if (xLen > yLen)
	{
		_VirtualDom_pushPatch(patches, 6, index, {
			v: yLen,
			i: xLen - yLen
		});
	}
	else if (xLen < yLen)
	{
		_VirtualDom_pushPatch(patches, 7, index, {
			v: xLen,
			e: yKids
		});
	}

	// PAIRWISE DIFF EVERYTHING ELSE

	for (var minLen = xLen < yLen ? xLen : yLen, i = 0; i < minLen; i++)
	{
		var xKid = xKids[i];
		_VirtualDom_diffHelp(xKid, yKids[i], patches, ++index);
		index += xKid.b || 0;
	}
}



// KEYED DIFF


function _VirtualDom_diffKeyedKids(xParent, yParent, patches, rootIndex)
{
	var localPatches = [];

	var changes = {}; // Dict String Entry
	var inserts = []; // Array { index : Int, entry : Entry }
	// type Entry = { tag : String, vnode : VNode, index : Int, data : _ }

	var xKids = xParent.e;
	var yKids = yParent.e;
	var xLen = xKids.length;
	var yLen = yKids.length;
	var xIndex = 0;
	var yIndex = 0;

	var index = rootIndex;

	while (xIndex < xLen && yIndex < yLen)
	{
		var x = xKids[xIndex];
		var y = yKids[yIndex];

		var xKey = x.a;
		var yKey = y.a;
		var xNode = x.b;
		var yNode = y.b;

		var newMatch = undefined;
		var oldMatch = undefined;

		// check if keys match

		if (xKey === yKey)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNode, localPatches, index);
			index += xNode.b || 0;

			xIndex++;
			yIndex++;
			continue;
		}

		// look ahead 1 to detect insertions and removals.

		var xNext = xKids[xIndex + 1];
		var yNext = yKids[yIndex + 1];

		if (xNext)
		{
			var xNextKey = xNext.a;
			var xNextNode = xNext.b;
			oldMatch = yKey === xNextKey;
		}

		if (yNext)
		{
			var yNextKey = yNext.a;
			var yNextNode = yNext.b;
			newMatch = xKey === yNextKey;
		}


		// swap x and y
		if (newMatch && oldMatch)
		{
			index++;
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			_VirtualDom_insertNode(changes, localPatches, xKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNextNode, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		// insert y
		if (newMatch)
		{
			index++;
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			_VirtualDom_diffHelp(xNode, yNextNode, localPatches, index);
			index += xNode.b || 0;

			xIndex += 1;
			yIndex += 2;
			continue;
		}

		// remove x
		if (oldMatch)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 1;
			continue;
		}

		// remove x, insert y
		if (xNext && xNextKey === yNextKey)
		{
			index++;
			_VirtualDom_removeNode(changes, localPatches, xKey, xNode, index);
			_VirtualDom_insertNode(changes, localPatches, yKey, yNode, yIndex, inserts);
			index += xNode.b || 0;

			index++;
			_VirtualDom_diffHelp(xNextNode, yNextNode, localPatches, index);
			index += xNextNode.b || 0;

			xIndex += 2;
			yIndex += 2;
			continue;
		}

		break;
	}

	// eat up any remaining nodes with removeNode and insertNode

	while (xIndex < xLen)
	{
		index++;
		var x = xKids[xIndex];
		var xNode = x.b;
		_VirtualDom_removeNode(changes, localPatches, x.a, xNode, index);
		index += xNode.b || 0;
		xIndex++;
	}

	while (yIndex < yLen)
	{
		var endInserts = endInserts || [];
		var y = yKids[yIndex];
		_VirtualDom_insertNode(changes, localPatches, y.a, y.b, undefined, endInserts);
		yIndex++;
	}

	if (localPatches.length > 0 || inserts.length > 0 || endInserts)
	{
		_VirtualDom_pushPatch(patches, 8, rootIndex, {
			w: localPatches,
			x: inserts,
			y: endInserts
		});
	}
}



// CHANGES FROM KEYED DIFF


var _VirtualDom_POSTFIX = '_elmW6BL';


function _VirtualDom_insertNode(changes, localPatches, key, vnode, yIndex, inserts)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		entry = {
			c: 0,
			z: vnode,
			r: yIndex,
			s: undefined
		};

		inserts.push({ r: yIndex, A: entry });
		changes[key] = entry;

		return;
	}

	// this key was removed earlier, a match!
	if (entry.c === 1)
	{
		inserts.push({ r: yIndex, A: entry });

		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(entry.z, vnode, subPatches, entry.r);
		entry.r = yIndex;
		entry.s.s = {
			w: subPatches,
			A: entry
		};

		return;
	}

	// this key has already been inserted or moved, a duplicate!
	_VirtualDom_insertNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, yIndex, inserts);
}


function _VirtualDom_removeNode(changes, localPatches, key, vnode, index)
{
	var entry = changes[key];

	// never seen this key before
	if (!entry)
	{
		var patch = _VirtualDom_pushPatch(localPatches, 9, index, undefined);

		changes[key] = {
			c: 1,
			z: vnode,
			r: index,
			s: patch
		};

		return;
	}

	// this key was inserted earlier, a match!
	if (entry.c === 0)
	{
		entry.c = 2;
		var subPatches = [];
		_VirtualDom_diffHelp(vnode, entry.z, subPatches, index);

		_VirtualDom_pushPatch(localPatches, 9, index, {
			w: subPatches,
			A: entry
		});

		return;
	}

	// this key has already been removed or moved, a duplicate!
	_VirtualDom_removeNode(changes, localPatches, key + _VirtualDom_POSTFIX, vnode, index);
}



// ADD DOM NODES
//
// Each DOM node has an "index" assigned in order of traversal. It is important
// to minimize our crawl over the actual DOM, so these indexes (along with the
// descendantsCount of virtual nodes) let us skip touching entire subtrees of
// the DOM if we know there are no patches there.


function _VirtualDom_addDomNodes(domNode, vNode, patches, eventNode)
{
	_VirtualDom_addDomNodesHelp(domNode, vNode, patches, 0, 0, vNode.b, eventNode);
}


// assumes `patches` is non-empty and indexes increase monotonically.
function _VirtualDom_addDomNodesHelp(domNode, vNode, patches, i, low, high, eventNode)
{
	var patch = patches[i];
	var index = patch.r;

	while (index === low)
	{
		var patchType = patch.$;

		if (patchType === 1)
		{
			_VirtualDom_addDomNodes(domNode, vNode.k, patch.s, eventNode);
		}
		else if (patchType === 8)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var subPatches = patch.s.w;
			if (subPatches.length > 0)
			{
				_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
			}
		}
		else if (patchType === 9)
		{
			patch.t = domNode;
			patch.u = eventNode;

			var data = patch.s;
			if (data)
			{
				data.A.s = domNode;
				var subPatches = data.w;
				if (subPatches.length > 0)
				{
					_VirtualDom_addDomNodesHelp(domNode, vNode, subPatches, 0, low, high, eventNode);
				}
			}
		}
		else
		{
			patch.t = domNode;
			patch.u = eventNode;
		}

		i++;

		if (!(patch = patches[i]) || (index = patch.r) > high)
		{
			return i;
		}
	}

	var tag = vNode.$;

	if (tag === 4)
	{
		var subNode = vNode.k;

		while (subNode.$ === 4)
		{
			subNode = subNode.k;
		}

		return _VirtualDom_addDomNodesHelp(domNode, subNode, patches, i, low + 1, high, domNode.elm_event_node_ref);
	}

	// tag must be 1 or 2 at this point

	var vKids = vNode.e;
	var childNodes = domNode.childNodes;
	for (var j = 0; j < vKids.length; j++)
	{
		low++;
		var vKid = tag === 1 ? vKids[j] : vKids[j].b;
		var nextLow = low + (vKid.b || 0);
		if (low <= index && index <= nextLow)
		{
			i = _VirtualDom_addDomNodesHelp(childNodes[j], vKid, patches, i, low, nextLow, eventNode);
			if (!(patch = patches[i]) || (index = patch.r) > high)
			{
				return i;
			}
		}
		low = nextLow;
	}
	return i;
}



// APPLY PATCHES


function _VirtualDom_applyPatches(rootDomNode, oldVirtualNode, patches, eventNode)
{
	if (patches.length === 0)
	{
		return rootDomNode;
	}

	_VirtualDom_addDomNodes(rootDomNode, oldVirtualNode, patches, eventNode);
	return _VirtualDom_applyPatchesHelp(rootDomNode, patches);
}

function _VirtualDom_applyPatchesHelp(rootDomNode, patches)
{
	for (var i = 0; i < patches.length; i++)
	{
		var patch = patches[i];
		var localDomNode = patch.t
		var newNode = _VirtualDom_applyPatch(localDomNode, patch);
		if (localDomNode === rootDomNode)
		{
			rootDomNode = newNode;
		}
	}
	return rootDomNode;
}

function _VirtualDom_applyPatch(domNode, patch)
{
	switch (patch.$)
	{
		case 0:
			return _VirtualDom_applyPatchRedraw(domNode, patch.s, patch.u);

		case 4:
			_VirtualDom_applyFacts(domNode, patch.u, patch.s);
			return domNode;

		case 3:
			domNode.replaceData(0, domNode.length, patch.s);
			return domNode;

		case 1:
			return _VirtualDom_applyPatchesHelp(domNode, patch.s);

		case 2:
			if (domNode.elm_event_node_ref)
			{
				domNode.elm_event_node_ref.j = patch.s;
			}
			else
			{
				domNode.elm_event_node_ref = { j: patch.s, p: patch.u };
			}
			return domNode;

		case 6:
			var data = patch.s;
			for (var i = 0; i < data.i; i++)
			{
				domNode.removeChild(domNode.childNodes[data.v]);
			}
			return domNode;

		case 7:
			var data = patch.s;
			var kids = data.e;
			var i = data.v;
			var theEnd = domNode.childNodes[i];
			for (; i < kids.length; i++)
			{
				domNode.insertBefore(_VirtualDom_render(kids[i], patch.u), theEnd);
			}
			return domNode;

		case 9:
			var data = patch.s;
			if (!data)
			{
				domNode.parentNode.removeChild(domNode);
				return domNode;
			}
			var entry = data.A;
			if (typeof entry.r !== 'undefined')
			{
				domNode.parentNode.removeChild(domNode);
			}
			entry.s = _VirtualDom_applyPatchesHelp(domNode, data.w);
			return domNode;

		case 8:
			return _VirtualDom_applyPatchReorder(domNode, patch);

		case 5:
			return patch.s(domNode);

		default:
			_Debug_crash(10); // 'Ran into an unknown patch!'
	}
}


function _VirtualDom_applyPatchRedraw(domNode, vNode, eventNode)
{
	var parentNode = domNode.parentNode;
	var newNode = _VirtualDom_render(vNode, eventNode);

	if (!newNode.elm_event_node_ref)
	{
		newNode.elm_event_node_ref = domNode.elm_event_node_ref;
	}

	if (parentNode && newNode !== domNode)
	{
		parentNode.replaceChild(newNode, domNode);
	}
	return newNode;
}


function _VirtualDom_applyPatchReorder(domNode, patch)
{
	var data = patch.s;

	// remove end inserts
	var frag = _VirtualDom_applyPatchReorderEndInsertsHelp(data.y, patch);

	// removals
	domNode = _VirtualDom_applyPatchesHelp(domNode, data.w);

	// inserts
	var inserts = data.x;
	for (var i = 0; i < inserts.length; i++)
	{
		var insert = inserts[i];
		var entry = insert.A;
		var node = entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u);
		domNode.insertBefore(node, domNode.childNodes[insert.r]);
	}

	// add end inserts
	if (frag)
	{
		_VirtualDom_appendChild(domNode, frag);
	}

	return domNode;
}


function _VirtualDom_applyPatchReorderEndInsertsHelp(endInserts, patch)
{
	if (!endInserts)
	{
		return;
	}

	var frag = _VirtualDom_doc.createDocumentFragment();
	for (var i = 0; i < endInserts.length; i++)
	{
		var insert = endInserts[i];
		var entry = insert.A;
		_VirtualDom_appendChild(frag, entry.c === 2
			? entry.s
			: _VirtualDom_render(entry.z, patch.u)
		);
	}
	return frag;
}


function _VirtualDom_virtualize(node)
{
	// TEXT NODES

	if (node.nodeType === 3)
	{
		return _VirtualDom_text(node.textContent);
	}


	// WEIRD NODES

	if (node.nodeType !== 1)
	{
		return _VirtualDom_text('');
	}


	// ELEMENT NODES

	var attrList = _List_Nil;
	var attrs = node.attributes;
	for (var i = attrs.length; i--; )
	{
		var attr = attrs[i];
		var name = attr.name;
		var value = attr.value;
		attrList = _List_Cons( A2(_VirtualDom_attribute, name, value), attrList );
	}

	var tag = node.tagName.toLowerCase();
	var kidList = _List_Nil;
	var kids = node.childNodes;

	for (var i = kids.length; i--; )
	{
		kidList = _List_Cons(_VirtualDom_virtualize(kids[i]), kidList);
	}
	return A3(_VirtualDom_node, tag, attrList, kidList);
}

function _VirtualDom_dekey(keyedNode)
{
	var keyedKids = keyedNode.e;
	var len = keyedKids.length;
	var kids = new Array(len);
	for (var i = 0; i < len; i++)
	{
		kids[i] = keyedKids[i].b;
	}

	return {
		$: 1,
		c: keyedNode.c,
		d: keyedNode.d,
		e: kids,
		f: keyedNode.f,
		b: keyedNode.b
	};
}




// ELEMENT


var _Debugger_element;

var _Browser_element = _Debugger_element || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function(sendToApp, initialModel) {
			var view = impl.view;
			/**_UNUSED/
			var domNode = args['node'];
			//*/
			/**/
			var domNode = args && args['node'] ? args['node'] : _Debug_crash(0);
			//*/
			var currNode = _VirtualDom_virtualize(domNode);

			return _Browser_makeAnimator(initialModel, function(model)
			{
				var nextNode = view(model);
				var patches = _VirtualDom_diff(currNode, nextNode);
				domNode = _VirtualDom_applyPatches(domNode, currNode, patches, sendToApp);
				currNode = nextNode;
			});
		}
	);
});



// DOCUMENT


var _Debugger_document;

var _Browser_document = _Debugger_document || F4(function(impl, flagDecoder, debugMetadata, args)
{
	return _Platform_initialize(
		flagDecoder,
		args,
		impl.init,
		impl.update,
		impl.subscriptions,
		function(sendToApp, initialModel) {
			var divertHrefToApp = impl.setup && impl.setup(sendToApp)
			var view = impl.view;
			var title = _VirtualDom_doc.title;
			var bodyNode = _VirtualDom_doc.body;
			var currNode = _VirtualDom_virtualize(bodyNode);
			return _Browser_makeAnimator(initialModel, function(model)
			{
				_VirtualDom_divertHrefToApp = divertHrefToApp;
				var doc = view(model);
				var nextNode = _VirtualDom_node('body')(_List_Nil)(doc.body);
				var patches = _VirtualDom_diff(currNode, nextNode);
				bodyNode = _VirtualDom_applyPatches(bodyNode, currNode, patches, sendToApp);
				currNode = nextNode;
				_VirtualDom_divertHrefToApp = 0;
				(title !== doc.title) && (_VirtualDom_doc.title = title = doc.title);
			});
		}
	);
});



// ANIMATION


var _Browser_cancelAnimationFrame =
	typeof cancelAnimationFrame !== 'undefined'
		? cancelAnimationFrame
		: function(id) { clearTimeout(id); };

var _Browser_requestAnimationFrame =
	typeof requestAnimationFrame !== 'undefined'
		? requestAnimationFrame
		: function(callback) { return setTimeout(callback, 1000 / 60); };


function _Browser_makeAnimator(model, draw)
{
	draw(model);

	var state = 0;

	function updateIfNeeded()
	{
		state = state === 1
			? 0
			: ( _Browser_requestAnimationFrame(updateIfNeeded), draw(model), 1 );
	}

	return function(nextModel, isSync)
	{
		model = nextModel;

		isSync
			? ( draw(model),
				state === 2 && (state = 1)
				)
			: ( state === 0 && _Browser_requestAnimationFrame(updateIfNeeded),
				state = 2
				);
	};
}



// APPLICATION


function _Browser_application(impl)
{
	var onUrlChange = impl.onUrlChange;
	var onUrlRequest = impl.onUrlRequest;
	var key = function() { key.a(onUrlChange(_Browser_getUrl())); };

	return _Browser_document({
		setup: function(sendToApp)
		{
			key.a = sendToApp;
			_Browser_window.addEventListener('popstate', key);
			_Browser_window.navigator.userAgent.indexOf('Trident') < 0 || _Browser_window.addEventListener('hashchange', key);

			return F2(function(domNode, event)
			{
				if (!event.ctrlKey && !event.metaKey && !event.shiftKey && event.button < 1 && !domNode.target && !domNode.hasAttribute('download'))
				{
					event.preventDefault();
					var href = domNode.href;
					var curr = _Browser_getUrl();
					var next = $elm$url$Url$fromString(href).a;
					sendToApp(onUrlRequest(
						(next
							&& curr.protocol === next.protocol
							&& curr.host === next.host
							&& curr.port_.a === next.port_.a
						)
							? $elm$browser$Browser$Internal(next)
							: $elm$browser$Browser$External(href)
					));
				}
			});
		},
		init: function(flags)
		{
			return A3(impl.init, flags, _Browser_getUrl(), key);
		},
		view: impl.view,
		update: impl.update,
		subscriptions: impl.subscriptions
	});
}

function _Browser_getUrl()
{
	return $elm$url$Url$fromString(_VirtualDom_doc.location.href).a || _Debug_crash(1);
}

var _Browser_go = F2(function(key, n)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		n && history.go(n);
		key();
	}));
});

var _Browser_pushUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.pushState({}, '', url);
		key();
	}));
});

var _Browser_replaceUrl = F2(function(key, url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function() {
		history.replaceState({}, '', url);
		key();
	}));
});



// GLOBAL EVENTS


var _Browser_fakeNode = { addEventListener: function() {}, removeEventListener: function() {} };
var _Browser_doc = typeof document !== 'undefined' ? document : _Browser_fakeNode;
var _Browser_window = typeof window !== 'undefined' ? window : _Browser_fakeNode;

var _Browser_on = F3(function(node, eventName, sendToSelf)
{
	return _Scheduler_spawn(_Scheduler_binding(function(callback)
	{
		function handler(event)	{ _Scheduler_rawSpawn(sendToSelf(event)); }
		node.addEventListener(eventName, handler, _VirtualDom_passiveSupported && { passive: true });
		return function() { node.removeEventListener(eventName, handler); };
	}));
});

var _Browser_decodeEvent = F2(function(decoder, event)
{
	var result = _Json_runHelp(decoder, event);
	return $elm$core$Result$isOk(result) ? $elm$core$Maybe$Just(result.a) : $elm$core$Maybe$Nothing;
});



// PAGE VISIBILITY


function _Browser_visibilityInfo()
{
	return (typeof _VirtualDom_doc.hidden !== 'undefined')
		? { hidden: 'hidden', change: 'visibilitychange' }
		:
	(typeof _VirtualDom_doc.mozHidden !== 'undefined')
		? { hidden: 'mozHidden', change: 'mozvisibilitychange' }
		:
	(typeof _VirtualDom_doc.msHidden !== 'undefined')
		? { hidden: 'msHidden', change: 'msvisibilitychange' }
		:
	(typeof _VirtualDom_doc.webkitHidden !== 'undefined')
		? { hidden: 'webkitHidden', change: 'webkitvisibilitychange' }
		: { hidden: 'hidden', change: 'visibilitychange' };
}



// ANIMATION FRAMES


function _Browser_rAF()
{
	return _Scheduler_binding(function(callback)
	{
		var id = _Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(Date.now()));
		});

		return function() {
			_Browser_cancelAnimationFrame(id);
		};
	});
}


function _Browser_now()
{
	return _Scheduler_binding(function(callback)
	{
		callback(_Scheduler_succeed(Date.now()));
	});
}



// DOM STUFF


function _Browser_withNode(id, doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			var node = document.getElementById(id);
			callback(node
				? _Scheduler_succeed(doStuff(node))
				: _Scheduler_fail($elm$browser$Browser$Dom$NotFound(id))
			);
		});
	});
}


function _Browser_withWindow(doStuff)
{
	return _Scheduler_binding(function(callback)
	{
		_Browser_requestAnimationFrame(function() {
			callback(_Scheduler_succeed(doStuff()));
		});
	});
}


// FOCUS and BLUR


var _Browser_call = F2(function(functionName, id)
{
	return _Browser_withNode(id, function(node) {
		node[functionName]();
		return _Utils_Tuple0;
	});
});



// WINDOW VIEWPORT


function _Browser_getViewport()
{
	return {
		scene: _Browser_getScene(),
		viewport: {
			x: _Browser_window.pageXOffset,
			y: _Browser_window.pageYOffset,
			width: _Browser_doc.documentElement.clientWidth,
			height: _Browser_doc.documentElement.clientHeight
		}
	};
}

function _Browser_getScene()
{
	var body = _Browser_doc.body;
	var elem = _Browser_doc.documentElement;
	return {
		width: Math.max(body.scrollWidth, body.offsetWidth, elem.scrollWidth, elem.offsetWidth, elem.clientWidth),
		height: Math.max(body.scrollHeight, body.offsetHeight, elem.scrollHeight, elem.offsetHeight, elem.clientHeight)
	};
}

var _Browser_setViewport = F2(function(x, y)
{
	return _Browser_withWindow(function()
	{
		_Browser_window.scroll(x, y);
		return _Utils_Tuple0;
	});
});



// ELEMENT VIEWPORT


function _Browser_getViewportOf(id)
{
	return _Browser_withNode(id, function(node)
	{
		return {
			scene: {
				width: node.scrollWidth,
				height: node.scrollHeight
			},
			viewport: {
				x: node.scrollLeft,
				y: node.scrollTop,
				width: node.clientWidth,
				height: node.clientHeight
			}
		};
	});
}


var _Browser_setViewportOf = F3(function(id, x, y)
{
	return _Browser_withNode(id, function(node)
	{
		node.scrollLeft = x;
		node.scrollTop = y;
		return _Utils_Tuple0;
	});
});



// ELEMENT


function _Browser_getElement(id)
{
	return _Browser_withNode(id, function(node)
	{
		var rect = node.getBoundingClientRect();
		var x = _Browser_window.pageXOffset;
		var y = _Browser_window.pageYOffset;
		return {
			scene: _Browser_getScene(),
			viewport: {
				x: x,
				y: y,
				width: _Browser_doc.documentElement.clientWidth,
				height: _Browser_doc.documentElement.clientHeight
			},
			element: {
				x: x + rect.left,
				y: y + rect.top,
				width: rect.width,
				height: rect.height
			}
		};
	});
}



// LOAD and RELOAD


function _Browser_reload(skipCache)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		_VirtualDom_doc.location.reload(skipCache);
	}));
}

function _Browser_load(url)
{
	return A2($elm$core$Task$perform, $elm$core$Basics$never, _Scheduler_binding(function(callback)
	{
		try
		{
			_Browser_window.location = url;
		}
		catch(err)
		{
			// Only Firefox can throw a NS_ERROR_MALFORMED_URI exception here.
			// Other browsers reload the page, so let's be consistent about that.
			_VirtualDom_doc.location.reload(false);
		}
	}));
}


// CREATE

var _Regex_never = /.^/;

var _Regex_fromStringWith = F2(function(options, string)
{
	var flags = 'g';
	if (options.multiline) { flags += 'm'; }
	if (options.caseInsensitive) { flags += 'i'; }

	try
	{
		return $elm$core$Maybe$Just(new RegExp(string, flags));
	}
	catch(error)
	{
		return $elm$core$Maybe$Nothing;
	}
});


// USE

var _Regex_contains = F2(function(re, string)
{
	return string.match(re) !== null;
});


var _Regex_findAtMost = F3(function(n, re, str)
{
	var out = [];
	var number = 0;
	var string = str;
	var lastIndex = re.lastIndex;
	var prevLastIndex = -1;
	var result;
	while (number++ < n && (result = re.exec(string)))
	{
		if (prevLastIndex == re.lastIndex) break;
		var i = result.length - 1;
		var subs = new Array(i);
		while (i > 0)
		{
			var submatch = result[i];
			subs[--i] = submatch
				? $elm$core$Maybe$Just(submatch)
				: $elm$core$Maybe$Nothing;
		}
		out.push(A4($elm$regex$Regex$Match, result[0], result.index, number, _List_fromArray(subs)));
		prevLastIndex = re.lastIndex;
	}
	re.lastIndex = lastIndex;
	return _List_fromArray(out);
});


var _Regex_replaceAtMost = F4(function(n, re, replacer, string)
{
	var count = 0;
	function jsReplacer(match)
	{
		if (count++ >= n)
		{
			return match;
		}
		var i = arguments.length - 3;
		var submatches = new Array(i);
		while (i > 0)
		{
			var submatch = arguments[i];
			submatches[--i] = submatch
				? $elm$core$Maybe$Just(submatch)
				: $elm$core$Maybe$Nothing;
		}
		return replacer(A4($elm$regex$Regex$Match, match, arguments[arguments.length - 2], count, _List_fromArray(submatches)));
	}
	return string.replace(re, jsReplacer);
});

var _Regex_splitAtMost = F3(function(n, re, str)
{
	var string = str;
	var out = [];
	var start = re.lastIndex;
	var restoreLastIndex = re.lastIndex;
	while (n--)
	{
		var result = re.exec(string);
		if (!result) break;
		out.push(string.slice(start, result.index));
		start = re.lastIndex;
	}
	out.push(string.slice(start));
	re.lastIndex = restoreLastIndex;
	return _List_fromArray(out);
});

var _Regex_infinity = Infinity;



var _Bitwise_and = F2(function(a, b)
{
	return a & b;
});

var _Bitwise_or = F2(function(a, b)
{
	return a | b;
});

var _Bitwise_xor = F2(function(a, b)
{
	return a ^ b;
});

function _Bitwise_complement(a)
{
	return ~a;
};

var _Bitwise_shiftLeftBy = F2(function(offset, a)
{
	return a << offset;
});

var _Bitwise_shiftRightBy = F2(function(offset, a)
{
	return a >> offset;
});

var _Bitwise_shiftRightZfBy = F2(function(offset, a)
{
	return a >>> offset;
});
var $elm$core$Basics$EQ = {$: 'EQ'};
var $elm$core$Basics$GT = {$: 'GT'};
var $elm$core$Basics$LT = {$: 'LT'};
var $elm$core$List$cons = _List_cons;
var $elm$core$Dict$foldr = F3(
	function (func, acc, t) {
		foldr:
		while (true) {
			if (t.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = t.b;
				var value = t.c;
				var left = t.d;
				var right = t.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldr, func, acc, right)),
					$temp$t = left;
				func = $temp$func;
				acc = $temp$acc;
				t = $temp$t;
				continue foldr;
			}
		}
	});
var $elm$core$Dict$toList = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, list) {
				return A2(
					$elm$core$List$cons,
					_Utils_Tuple2(key, value),
					list);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Dict$keys = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, keyList) {
				return A2($elm$core$List$cons, key, keyList);
			}),
		_List_Nil,
		dict);
};
var $elm$core$Set$toList = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$keys(dict);
};
var $elm$core$Elm$JsArray$foldr = _JsArray_foldr;
var $elm$core$Array$foldr = F3(
	function (func, baseCase, _v0) {
		var tree = _v0.c;
		var tail = _v0.d;
		var helper = F2(
			function (node, acc) {
				if (node.$ === 'SubTree') {
					var subTree = node.a;
					return A3($elm$core$Elm$JsArray$foldr, helper, acc, subTree);
				} else {
					var values = node.a;
					return A3($elm$core$Elm$JsArray$foldr, func, acc, values);
				}
			});
		return A3(
			$elm$core$Elm$JsArray$foldr,
			helper,
			A3($elm$core$Elm$JsArray$foldr, func, baseCase, tail),
			tree);
	});
var $elm$core$Array$toList = function (array) {
	return A3($elm$core$Array$foldr, $elm$core$List$cons, _List_Nil, array);
};
var $elm$core$Result$Err = function (a) {
	return {$: 'Err', a: a};
};
var $elm$json$Json$Decode$Failure = F2(
	function (a, b) {
		return {$: 'Failure', a: a, b: b};
	});
var $elm$json$Json$Decode$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $elm$json$Json$Decode$Index = F2(
	function (a, b) {
		return {$: 'Index', a: a, b: b};
	});
var $elm$core$Result$Ok = function (a) {
	return {$: 'Ok', a: a};
};
var $elm$json$Json$Decode$OneOf = function (a) {
	return {$: 'OneOf', a: a};
};
var $elm$core$Basics$False = {$: 'False'};
var $elm$core$Basics$add = _Basics_add;
var $elm$core$Maybe$Just = function (a) {
	return {$: 'Just', a: a};
};
var $elm$core$Maybe$Nothing = {$: 'Nothing'};
var $elm$core$String$all = _String_all;
var $elm$core$Basics$and = _Basics_and;
var $elm$core$Basics$append = _Utils_append;
var $elm$json$Json$Encode$encode = _Json_encode;
var $elm$core$String$fromInt = _String_fromNumber;
var $elm$core$String$join = F2(
	function (sep, chunks) {
		return A2(
			_String_join,
			sep,
			_List_toArray(chunks));
	});
var $elm$core$String$split = F2(
	function (sep, string) {
		return _List_fromArray(
			A2(_String_split, sep, string));
	});
var $elm$json$Json$Decode$indent = function (str) {
	return A2(
		$elm$core$String$join,
		'\n    ',
		A2($elm$core$String$split, '\n', str));
};
var $elm$core$List$foldl = F3(
	function (func, acc, list) {
		foldl:
		while (true) {
			if (!list.b) {
				return acc;
			} else {
				var x = list.a;
				var xs = list.b;
				var $temp$func = func,
					$temp$acc = A2(func, x, acc),
					$temp$list = xs;
				func = $temp$func;
				acc = $temp$acc;
				list = $temp$list;
				continue foldl;
			}
		}
	});
var $elm$core$List$length = function (xs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, i) {
				return i + 1;
			}),
		0,
		xs);
};
var $elm$core$List$map2 = _List_map2;
var $elm$core$Basics$le = _Utils_le;
var $elm$core$Basics$sub = _Basics_sub;
var $elm$core$List$rangeHelp = F3(
	function (lo, hi, list) {
		rangeHelp:
		while (true) {
			if (_Utils_cmp(lo, hi) < 1) {
				var $temp$lo = lo,
					$temp$hi = hi - 1,
					$temp$list = A2($elm$core$List$cons, hi, list);
				lo = $temp$lo;
				hi = $temp$hi;
				list = $temp$list;
				continue rangeHelp;
			} else {
				return list;
			}
		}
	});
var $elm$core$List$range = F2(
	function (lo, hi) {
		return A3($elm$core$List$rangeHelp, lo, hi, _List_Nil);
	});
var $elm$core$List$indexedMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$map2,
			f,
			A2(
				$elm$core$List$range,
				0,
				$elm$core$List$length(xs) - 1),
			xs);
	});
var $elm$core$Char$toCode = _Char_toCode;
var $elm$core$Char$isLower = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (97 <= code) && (code <= 122);
};
var $elm$core$Char$isUpper = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 90) && (65 <= code);
};
var $elm$core$Basics$or = _Basics_or;
var $elm$core$Char$isAlpha = function (_char) {
	return $elm$core$Char$isLower(_char) || $elm$core$Char$isUpper(_char);
};
var $elm$core$Char$isDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 57) && (48 <= code);
};
var $elm$core$Char$isAlphaNum = function (_char) {
	return $elm$core$Char$isLower(_char) || ($elm$core$Char$isUpper(_char) || $elm$core$Char$isDigit(_char));
};
var $elm$core$List$reverse = function (list) {
	return A3($elm$core$List$foldl, $elm$core$List$cons, _List_Nil, list);
};
var $elm$core$String$uncons = _String_uncons;
var $elm$json$Json$Decode$errorOneOf = F2(
	function (i, error) {
		return '\n\n(' + ($elm$core$String$fromInt(i + 1) + (') ' + $elm$json$Json$Decode$indent(
			$elm$json$Json$Decode$errorToString(error))));
	});
var $elm$json$Json$Decode$errorToString = function (error) {
	return A2($elm$json$Json$Decode$errorToStringHelp, error, _List_Nil);
};
var $elm$json$Json$Decode$errorToStringHelp = F2(
	function (error, context) {
		errorToStringHelp:
		while (true) {
			switch (error.$) {
				case 'Field':
					var f = error.a;
					var err = error.b;
					var isSimple = function () {
						var _v1 = $elm$core$String$uncons(f);
						if (_v1.$ === 'Nothing') {
							return false;
						} else {
							var _v2 = _v1.a;
							var _char = _v2.a;
							var rest = _v2.b;
							return $elm$core$Char$isAlpha(_char) && A2($elm$core$String$all, $elm$core$Char$isAlphaNum, rest);
						}
					}();
					var fieldName = isSimple ? ('.' + f) : ('[\'' + (f + '\']'));
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, fieldName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'Index':
					var i = error.a;
					var err = error.b;
					var indexName = '[' + ($elm$core$String$fromInt(i) + ']');
					var $temp$error = err,
						$temp$context = A2($elm$core$List$cons, indexName, context);
					error = $temp$error;
					context = $temp$context;
					continue errorToStringHelp;
				case 'OneOf':
					var errors = error.a;
					if (!errors.b) {
						return 'Ran into a Json.Decode.oneOf with no possibilities' + function () {
							if (!context.b) {
								return '!';
							} else {
								return ' at json' + A2(
									$elm$core$String$join,
									'',
									$elm$core$List$reverse(context));
							}
						}();
					} else {
						if (!errors.b.b) {
							var err = errors.a;
							var $temp$error = err,
								$temp$context = context;
							error = $temp$error;
							context = $temp$context;
							continue errorToStringHelp;
						} else {
							var starter = function () {
								if (!context.b) {
									return 'Json.Decode.oneOf';
								} else {
									return 'The Json.Decode.oneOf at json' + A2(
										$elm$core$String$join,
										'',
										$elm$core$List$reverse(context));
								}
							}();
							var introduction = starter + (' failed in the following ' + ($elm$core$String$fromInt(
								$elm$core$List$length(errors)) + ' ways:'));
							return A2(
								$elm$core$String$join,
								'\n\n',
								A2(
									$elm$core$List$cons,
									introduction,
									A2($elm$core$List$indexedMap, $elm$json$Json$Decode$errorOneOf, errors)));
						}
					}
				default:
					var msg = error.a;
					var json = error.b;
					var introduction = function () {
						if (!context.b) {
							return 'Problem with the given value:\n\n';
						} else {
							return 'Problem with the value at json' + (A2(
								$elm$core$String$join,
								'',
								$elm$core$List$reverse(context)) + ':\n\n    ');
						}
					}();
					return introduction + ($elm$json$Json$Decode$indent(
						A2($elm$json$Json$Encode$encode, 4, json)) + ('\n\n' + msg));
			}
		}
	});
var $elm$core$Array$branchFactor = 32;
var $elm$core$Array$Array_elm_builtin = F4(
	function (a, b, c, d) {
		return {$: 'Array_elm_builtin', a: a, b: b, c: c, d: d};
	});
var $elm$core$Elm$JsArray$empty = _JsArray_empty;
var $elm$core$Basics$ceiling = _Basics_ceiling;
var $elm$core$Basics$fdiv = _Basics_fdiv;
var $elm$core$Basics$logBase = F2(
	function (base, number) {
		return _Basics_log(number) / _Basics_log(base);
	});
var $elm$core$Basics$toFloat = _Basics_toFloat;
var $elm$core$Array$shiftStep = $elm$core$Basics$ceiling(
	A2($elm$core$Basics$logBase, 2, $elm$core$Array$branchFactor));
var $elm$core$Array$empty = A4($elm$core$Array$Array_elm_builtin, 0, $elm$core$Array$shiftStep, $elm$core$Elm$JsArray$empty, $elm$core$Elm$JsArray$empty);
var $elm$core$Elm$JsArray$initialize = _JsArray_initialize;
var $elm$core$Array$Leaf = function (a) {
	return {$: 'Leaf', a: a};
};
var $elm$core$Basics$apL = F2(
	function (f, x) {
		return f(x);
	});
var $elm$core$Basics$apR = F2(
	function (x, f) {
		return f(x);
	});
var $elm$core$Basics$eq = _Utils_equal;
var $elm$core$Basics$floor = _Basics_floor;
var $elm$core$Elm$JsArray$length = _JsArray_length;
var $elm$core$Basics$gt = _Utils_gt;
var $elm$core$Basics$max = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) > 0) ? x : y;
	});
var $elm$core$Basics$mul = _Basics_mul;
var $elm$core$Array$SubTree = function (a) {
	return {$: 'SubTree', a: a};
};
var $elm$core$Elm$JsArray$initializeFromList = _JsArray_initializeFromList;
var $elm$core$Array$compressNodes = F2(
	function (nodes, acc) {
		compressNodes:
		while (true) {
			var _v0 = A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodes);
			var node = _v0.a;
			var remainingNodes = _v0.b;
			var newAcc = A2(
				$elm$core$List$cons,
				$elm$core$Array$SubTree(node),
				acc);
			if (!remainingNodes.b) {
				return $elm$core$List$reverse(newAcc);
			} else {
				var $temp$nodes = remainingNodes,
					$temp$acc = newAcc;
				nodes = $temp$nodes;
				acc = $temp$acc;
				continue compressNodes;
			}
		}
	});
var $elm$core$Tuple$first = function (_v0) {
	var x = _v0.a;
	return x;
};
var $elm$core$Array$treeFromBuilder = F2(
	function (nodeList, nodeListSize) {
		treeFromBuilder:
		while (true) {
			var newNodeSize = $elm$core$Basics$ceiling(nodeListSize / $elm$core$Array$branchFactor);
			if (newNodeSize === 1) {
				return A2($elm$core$Elm$JsArray$initializeFromList, $elm$core$Array$branchFactor, nodeList).a;
			} else {
				var $temp$nodeList = A2($elm$core$Array$compressNodes, nodeList, _List_Nil),
					$temp$nodeListSize = newNodeSize;
				nodeList = $temp$nodeList;
				nodeListSize = $temp$nodeListSize;
				continue treeFromBuilder;
			}
		}
	});
var $elm$core$Array$builderToArray = F2(
	function (reverseNodeList, builder) {
		if (!builder.nodeListSize) {
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail),
				$elm$core$Array$shiftStep,
				$elm$core$Elm$JsArray$empty,
				builder.tail);
		} else {
			var treeLen = builder.nodeListSize * $elm$core$Array$branchFactor;
			var depth = $elm$core$Basics$floor(
				A2($elm$core$Basics$logBase, $elm$core$Array$branchFactor, treeLen - 1));
			var correctNodeList = reverseNodeList ? $elm$core$List$reverse(builder.nodeList) : builder.nodeList;
			var tree = A2($elm$core$Array$treeFromBuilder, correctNodeList, builder.nodeListSize);
			return A4(
				$elm$core$Array$Array_elm_builtin,
				$elm$core$Elm$JsArray$length(builder.tail) + treeLen,
				A2($elm$core$Basics$max, 5, depth * $elm$core$Array$shiftStep),
				tree,
				builder.tail);
		}
	});
var $elm$core$Basics$idiv = _Basics_idiv;
var $elm$core$Basics$lt = _Utils_lt;
var $elm$core$Array$initializeHelp = F5(
	function (fn, fromIndex, len, nodeList, tail) {
		initializeHelp:
		while (true) {
			if (fromIndex < 0) {
				return A2(
					$elm$core$Array$builderToArray,
					false,
					{nodeList: nodeList, nodeListSize: (len / $elm$core$Array$branchFactor) | 0, tail: tail});
			} else {
				var leaf = $elm$core$Array$Leaf(
					A3($elm$core$Elm$JsArray$initialize, $elm$core$Array$branchFactor, fromIndex, fn));
				var $temp$fn = fn,
					$temp$fromIndex = fromIndex - $elm$core$Array$branchFactor,
					$temp$len = len,
					$temp$nodeList = A2($elm$core$List$cons, leaf, nodeList),
					$temp$tail = tail;
				fn = $temp$fn;
				fromIndex = $temp$fromIndex;
				len = $temp$len;
				nodeList = $temp$nodeList;
				tail = $temp$tail;
				continue initializeHelp;
			}
		}
	});
var $elm$core$Basics$remainderBy = _Basics_remainderBy;
var $elm$core$Array$initialize = F2(
	function (len, fn) {
		if (len <= 0) {
			return $elm$core$Array$empty;
		} else {
			var tailLen = len % $elm$core$Array$branchFactor;
			var tail = A3($elm$core$Elm$JsArray$initialize, tailLen, len - tailLen, fn);
			var initialFromIndex = (len - tailLen) - $elm$core$Array$branchFactor;
			return A5($elm$core$Array$initializeHelp, fn, initialFromIndex, len, _List_Nil, tail);
		}
	});
var $elm$core$Basics$True = {$: 'True'};
var $elm$core$Result$isOk = function (result) {
	if (result.$ === 'Ok') {
		return true;
	} else {
		return false;
	}
};
var $elm$json$Json$Decode$map = _Json_map1;
var $elm$json$Json$Decode$map2 = _Json_map2;
var $elm$json$Json$Decode$succeed = _Json_succeed;
var $elm$virtual_dom$VirtualDom$toHandlerInt = function (handler) {
	switch (handler.$) {
		case 'Normal':
			return 0;
		case 'MayStopPropagation':
			return 1;
		case 'MayPreventDefault':
			return 2;
		default:
			return 3;
	}
};
var $elm$browser$Browser$External = function (a) {
	return {$: 'External', a: a};
};
var $elm$browser$Browser$Internal = function (a) {
	return {$: 'Internal', a: a};
};
var $elm$core$Basics$identity = function (x) {
	return x;
};
var $elm$browser$Browser$Dom$NotFound = function (a) {
	return {$: 'NotFound', a: a};
};
var $elm$url$Url$Http = {$: 'Http'};
var $elm$url$Url$Https = {$: 'Https'};
var $elm$url$Url$Url = F6(
	function (protocol, host, port_, path, query, fragment) {
		return {fragment: fragment, host: host, path: path, port_: port_, protocol: protocol, query: query};
	});
var $elm$core$String$contains = _String_contains;
var $elm$core$String$length = _String_length;
var $elm$core$String$slice = _String_slice;
var $elm$core$String$dropLeft = F2(
	function (n, string) {
		return (n < 1) ? string : A3(
			$elm$core$String$slice,
			n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$String$indexes = _String_indexes;
var $elm$core$String$isEmpty = function (string) {
	return string === '';
};
var $elm$core$String$left = F2(
	function (n, string) {
		return (n < 1) ? '' : A3($elm$core$String$slice, 0, n, string);
	});
var $elm$core$String$toInt = _String_toInt;
var $elm$url$Url$chompBeforePath = F5(
	function (protocol, path, params, frag, str) {
		if ($elm$core$String$isEmpty(str) || A2($elm$core$String$contains, '@', str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, ':', str);
			if (!_v0.b) {
				return $elm$core$Maybe$Just(
					A6($elm$url$Url$Url, protocol, str, $elm$core$Maybe$Nothing, path, params, frag));
			} else {
				if (!_v0.b.b) {
					var i = _v0.a;
					var _v1 = $elm$core$String$toInt(
						A2($elm$core$String$dropLeft, i + 1, str));
					if (_v1.$ === 'Nothing') {
						return $elm$core$Maybe$Nothing;
					} else {
						var port_ = _v1;
						return $elm$core$Maybe$Just(
							A6(
								$elm$url$Url$Url,
								protocol,
								A2($elm$core$String$left, i, str),
								port_,
								path,
								params,
								frag));
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			}
		}
	});
var $elm$url$Url$chompBeforeQuery = F4(
	function (protocol, params, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '/', str);
			if (!_v0.b) {
				return A5($elm$url$Url$chompBeforePath, protocol, '/', params, frag, str);
			} else {
				var i = _v0.a;
				return A5(
					$elm$url$Url$chompBeforePath,
					protocol,
					A2($elm$core$String$dropLeft, i, str),
					params,
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompBeforeFragment = F3(
	function (protocol, frag, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '?', str);
			if (!_v0.b) {
				return A4($elm$url$Url$chompBeforeQuery, protocol, $elm$core$Maybe$Nothing, frag, str);
			} else {
				var i = _v0.a;
				return A4(
					$elm$url$Url$chompBeforeQuery,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					frag,
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$url$Url$chompAfterProtocol = F2(
	function (protocol, str) {
		if ($elm$core$String$isEmpty(str)) {
			return $elm$core$Maybe$Nothing;
		} else {
			var _v0 = A2($elm$core$String$indexes, '#', str);
			if (!_v0.b) {
				return A3($elm$url$Url$chompBeforeFragment, protocol, $elm$core$Maybe$Nothing, str);
			} else {
				var i = _v0.a;
				return A3(
					$elm$url$Url$chompBeforeFragment,
					protocol,
					$elm$core$Maybe$Just(
						A2($elm$core$String$dropLeft, i + 1, str)),
					A2($elm$core$String$left, i, str));
			}
		}
	});
var $elm$core$String$startsWith = _String_startsWith;
var $elm$url$Url$fromString = function (str) {
	return A2($elm$core$String$startsWith, 'http://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Http,
		A2($elm$core$String$dropLeft, 7, str)) : (A2($elm$core$String$startsWith, 'https://', str) ? A2(
		$elm$url$Url$chompAfterProtocol,
		$elm$url$Url$Https,
		A2($elm$core$String$dropLeft, 8, str)) : $elm$core$Maybe$Nothing);
};
var $elm$core$Basics$never = function (_v0) {
	never:
	while (true) {
		var nvr = _v0.a;
		var $temp$_v0 = nvr;
		_v0 = $temp$_v0;
		continue never;
	}
};
var $elm$core$Task$Perform = function (a) {
	return {$: 'Perform', a: a};
};
var $elm$core$Task$succeed = _Scheduler_succeed;
var $elm$core$Task$init = $elm$core$Task$succeed(_Utils_Tuple0);
var $elm$core$List$foldrHelper = F4(
	function (fn, acc, ctr, ls) {
		if (!ls.b) {
			return acc;
		} else {
			var a = ls.a;
			var r1 = ls.b;
			if (!r1.b) {
				return A2(fn, a, acc);
			} else {
				var b = r1.a;
				var r2 = r1.b;
				if (!r2.b) {
					return A2(
						fn,
						a,
						A2(fn, b, acc));
				} else {
					var c = r2.a;
					var r3 = r2.b;
					if (!r3.b) {
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(fn, c, acc)));
					} else {
						var d = r3.a;
						var r4 = r3.b;
						var res = (ctr > 500) ? A3(
							$elm$core$List$foldl,
							fn,
							acc,
							$elm$core$List$reverse(r4)) : A4($elm$core$List$foldrHelper, fn, acc, ctr + 1, r4);
						return A2(
							fn,
							a,
							A2(
								fn,
								b,
								A2(
									fn,
									c,
									A2(fn, d, res))));
					}
				}
			}
		}
	});
var $elm$core$List$foldr = F3(
	function (fn, acc, ls) {
		return A4($elm$core$List$foldrHelper, fn, acc, 0, ls);
	});
var $elm$core$List$map = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, acc) {
					return A2(
						$elm$core$List$cons,
						f(x),
						acc);
				}),
			_List_Nil,
			xs);
	});
var $elm$core$Task$andThen = _Scheduler_andThen;
var $elm$core$Task$map = F2(
	function (func, taskA) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return $elm$core$Task$succeed(
					func(a));
			},
			taskA);
	});
var $elm$core$Task$map2 = F3(
	function (func, taskA, taskB) {
		return A2(
			$elm$core$Task$andThen,
			function (a) {
				return A2(
					$elm$core$Task$andThen,
					function (b) {
						return $elm$core$Task$succeed(
							A2(func, a, b));
					},
					taskB);
			},
			taskA);
	});
var $elm$core$Task$sequence = function (tasks) {
	return A3(
		$elm$core$List$foldr,
		$elm$core$Task$map2($elm$core$List$cons),
		$elm$core$Task$succeed(_List_Nil),
		tasks);
};
var $elm$core$Platform$sendToApp = _Platform_sendToApp;
var $elm$core$Task$spawnCmd = F2(
	function (router, _v0) {
		var task = _v0.a;
		return _Scheduler_spawn(
			A2(
				$elm$core$Task$andThen,
				$elm$core$Platform$sendToApp(router),
				task));
	});
var $elm$core$Task$onEffects = F3(
	function (router, commands, state) {
		return A2(
			$elm$core$Task$map,
			function (_v0) {
				return _Utils_Tuple0;
			},
			$elm$core$Task$sequence(
				A2(
					$elm$core$List$map,
					$elm$core$Task$spawnCmd(router),
					commands)));
	});
var $elm$core$Task$onSelfMsg = F3(
	function (_v0, _v1, _v2) {
		return $elm$core$Task$succeed(_Utils_Tuple0);
	});
var $elm$core$Task$cmdMap = F2(
	function (tagger, _v0) {
		var task = _v0.a;
		return $elm$core$Task$Perform(
			A2($elm$core$Task$map, tagger, task));
	});
_Platform_effectManagers['Task'] = _Platform_createManager($elm$core$Task$init, $elm$core$Task$onEffects, $elm$core$Task$onSelfMsg, $elm$core$Task$cmdMap);
var $elm$core$Task$command = _Platform_leaf('Task');
var $elm$core$Task$perform = F2(
	function (toMessage, task) {
		return $elm$core$Task$command(
			$elm$core$Task$Perform(
				A2($elm$core$Task$map, toMessage, task)));
	});
var $elm$browser$Browser$element = _Browser_element;
var $author$project$Morphir$Web$Insight$Failed = function (a) {
	return {$: 'Failed', a: a};
};
var $author$project$Morphir$Web$Insight$IRLoaded = function (a) {
	return {$: 'IRLoaded', a: a};
};
var $author$project$Morphir$Web$Insight$Flag = F2(
	function (distribution, config) {
		return {config: config, distribution: distribution};
	});
var $author$project$Morphir$Visual$Theme$ThemeConfig = F2(
	function (fontSize, decimalDigit) {
		return {decimalDigit: decimalDigit, fontSize: fontSize};
	});
var $elm$json$Json$Decode$field = _Json_decodeField;
var $elm$json$Json$Decode$int = _Json_decodeInt;
var $elm$json$Json$Decode$oneOf = _Json_oneOf;
var $elm$json$Json$Decode$maybe = function (decoder) {
	return $elm$json$Json$Decode$oneOf(
		_List_fromArray(
			[
				A2($elm$json$Json$Decode$map, $elm$core$Maybe$Just, decoder),
				$elm$json$Json$Decode$succeed($elm$core$Maybe$Nothing)
			]));
};
var $author$project$Morphir$Visual$Theme$Codec$decodeThemeConfig = A3(
	$elm$json$Json$Decode$map2,
	$author$project$Morphir$Visual$Theme$ThemeConfig,
	$elm$json$Json$Decode$maybe(
		A2($elm$json$Json$Decode$field, 'fontSize', $elm$json$Json$Decode$int)),
	$elm$json$Json$Decode$maybe(
		A2($elm$json$Json$Decode$field, 'decimalDigit', $elm$json$Json$Decode$int)));
var $elm$json$Json$Decode$andThen = _Json_andThen;
var $elm$core$String$concat = function (strings) {
	return A2($elm$core$String$join, '', strings);
};
var $author$project$Morphir$IR$Distribution$Codec$currentFormatVersion = 1;
var $author$project$Morphir$IR$Distribution$Library = F3(
	function (a, b, c) {
		return {$: 'Library', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Package$Definition = function (modules) {
	return {modules: modules};
};
var $author$project$Morphir$IR$AccessControlled$AccessControlled = F2(
	function (access, value) {
		return {access: access, value: value};
	});
var $author$project$Morphir$IR$AccessControlled$Private = {$: 'Private'};
var $author$project$Morphir$IR$AccessControlled$Public = {$: 'Public'};
var $elm$json$Json$Decode$fail = _Json_fail;
var $elm$json$Json$Decode$index = _Json_decodeIndex;
var $elm$json$Json$Decode$string = _Json_decodeString;
var $author$project$Morphir$IR$AccessControlled$Codec$decodeAccessControlled = function (decodeValue) {
	return A2(
		$elm$json$Json$Decode$andThen,
		function (tag) {
			switch (tag) {
				case 'public':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$AccessControlled$AccessControlled($author$project$Morphir$IR$AccessControlled$Public),
						A2($elm$json$Json$Decode$index, 1, decodeValue));
				case 'private':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$AccessControlled$AccessControlled($author$project$Morphir$IR$AccessControlled$Private),
						A2($elm$json$Json$Decode$index, 1, decodeValue));
				default:
					var other = tag;
					return $elm$json$Json$Decode$fail('Unknown access controlled type: ' + other);
			}
		},
		A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
};
var $author$project$Morphir$IR$Module$Definition = F2(
	function (types, values) {
		return {types: types, values: values};
	});
var $author$project$Morphir$IR$Type$CustomTypeDefinition = F2(
	function (a, b) {
		return {$: 'CustomTypeDefinition', a: a, b: b};
	});
var $author$project$Morphir$IR$Type$TypeAliasDefinition = F2(
	function (a, b) {
		return {$: 'TypeAliasDefinition', a: a, b: b};
	});
var $author$project$Morphir$IR$Name$fromList = function (words) {
	return words;
};
var $elm$json$Json$Decode$list = _Json_decodeList;
var $author$project$Morphir$IR$Name$Codec$decodeName = A2(
	$elm$json$Json$Decode$map,
	$author$project$Morphir$IR$Name$fromList,
	$elm$json$Json$Decode$list($elm$json$Json$Decode$string));
var $author$project$Morphir$IR$Type$ExtensibleRecord = F3(
	function (a, b, c) {
		return {$: 'ExtensibleRecord', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Type$Field = F2(
	function (name, tpe) {
		return {name: name, tpe: tpe};
	});
var $author$project$Morphir$IR$Type$Function = F3(
	function (a, b, c) {
		return {$: 'Function', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Type$Record = F2(
	function (a, b) {
		return {$: 'Record', a: a, b: b};
	});
var $author$project$Morphir$IR$Type$Reference = F3(
	function (a, b, c) {
		return {$: 'Reference', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Type$Tuple = F2(
	function (a, b) {
		return {$: 'Tuple', a: a, b: b};
	});
var $author$project$Morphir$IR$Type$Unit = function (a) {
	return {$: 'Unit', a: a};
};
var $author$project$Morphir$IR$Type$Variable = F2(
	function (a, b) {
		return {$: 'Variable', a: a, b: b};
	});
var $author$project$Morphir$IR$Path$fromList = function (names) {
	return names;
};
var $author$project$Morphir$IR$Path$Codec$decodePath = A2(
	$elm$json$Json$Decode$map,
	$author$project$Morphir$IR$Path$fromList,
	$elm$json$Json$Decode$list($author$project$Morphir$IR$Name$Codec$decodeName));
var $author$project$Morphir$IR$FQName$fQName = F3(
	function (packagePath, modulePath, localName) {
		return _Utils_Tuple3(packagePath, modulePath, localName);
	});
var $elm$json$Json$Decode$map3 = _Json_map3;
var $author$project$Morphir$IR$FQName$Codec$decodeFQName = A4(
	$elm$json$Json$Decode$map3,
	$author$project$Morphir$IR$FQName$fQName,
	A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Path$Codec$decodePath),
	A2($elm$json$Json$Decode$index, 1, $author$project$Morphir$IR$Path$Codec$decodePath),
	A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Name$Codec$decodeName));
var $elm$json$Json$Decode$lazy = function (thunk) {
	return A2(
		$elm$json$Json$Decode$andThen,
		thunk,
		$elm$json$Json$Decode$succeed(_Utils_Tuple0));
};
var $author$project$Morphir$IR$Type$Codec$decodeField = function (decodeAttributes) {
	return A3(
		$elm$json$Json$Decode$map2,
		$author$project$Morphir$IR$Type$Field,
		A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
		A2(
			$elm$json$Json$Decode$index,
			1,
			$author$project$Morphir$IR$Type$Codec$decodeType(decodeAttributes)));
};
var $author$project$Morphir$IR$Type$Codec$decodeType = function (decodeAttributes) {
	var lazyDecodeType = $elm$json$Json$Decode$lazy(
		function (_v3) {
			return $author$project$Morphir$IR$Type$Codec$decodeType(decodeAttributes);
		});
	var lazyDecodeField = $elm$json$Json$Decode$lazy(
		function (_v2) {
			return $author$project$Morphir$IR$Type$Codec$decodeField(decodeAttributes);
		});
	return A2(
		$elm$json$Json$Decode$andThen,
		function (kind) {
			switch (kind) {
				case 'variable':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$Variable,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Name$Codec$decodeName));
				case 'reference':
					return A4(
						$elm$json$Json$Decode$map3,
						$author$project$Morphir$IR$Type$Reference,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$FQName$Codec$decodeFQName),
						A2(
							$elm$json$Json$Decode$index,
							3,
							$elm$json$Json$Decode$list(
								$elm$json$Json$Decode$lazy(
									function (_v1) {
										return $author$project$Morphir$IR$Type$Codec$decodeType(decodeAttributes);
									}))));
				case 'tuple':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$Tuple,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$elm$json$Json$Decode$list(lazyDecodeType)));
				case 'record':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$Record,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$elm$json$Json$Decode$list(lazyDecodeField)));
				case 'extensible_record':
					return A4(
						$elm$json$Json$Decode$map3,
						$author$project$Morphir$IR$Type$ExtensibleRecord,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Name$Codec$decodeName),
						A2(
							$elm$json$Json$Decode$index,
							3,
							$elm$json$Json$Decode$list(lazyDecodeField)));
				case 'function':
					return A4(
						$elm$json$Json$Decode$map3,
						$author$project$Morphir$IR$Type$Function,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, lazyDecodeType),
						A2($elm$json$Json$Decode$index, 3, lazyDecodeType));
				case 'unit':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$Type$Unit,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes));
				default:
					return $elm$json$Json$Decode$fail('Unknown kind: ' + kind);
			}
		},
		A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
};
var $elm$core$Dict$RBEmpty_elm_builtin = {$: 'RBEmpty_elm_builtin'};
var $elm$core$Dict$empty = $elm$core$Dict$RBEmpty_elm_builtin;
var $elm$core$Dict$Black = {$: 'Black'};
var $elm$core$Dict$RBNode_elm_builtin = F5(
	function (a, b, c, d, e) {
		return {$: 'RBNode_elm_builtin', a: a, b: b, c: c, d: d, e: e};
	});
var $elm$core$Dict$Red = {$: 'Red'};
var $elm$core$Dict$balance = F5(
	function (color, key, value, left, right) {
		if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Red')) {
			var _v1 = right.a;
			var rK = right.b;
			var rV = right.c;
			var rLeft = right.d;
			var rRight = right.e;
			if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
				var _v3 = left.a;
				var lK = left.b;
				var lV = left.c;
				var lLeft = left.d;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					key,
					value,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					rK,
					rV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, left, rLeft),
					rRight);
			}
		} else {
			if ((((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) && (left.d.$ === 'RBNode_elm_builtin')) && (left.d.a.$ === 'Red')) {
				var _v5 = left.a;
				var lK = left.b;
				var lV = left.c;
				var _v6 = left.d;
				var _v7 = _v6.a;
				var llK = _v6.b;
				var llV = _v6.c;
				var llLeft = _v6.d;
				var llRight = _v6.e;
				var lRight = left.e;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Red,
					lK,
					lV,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, lRight, right));
			} else {
				return A5($elm$core$Dict$RBNode_elm_builtin, color, key, value, left, right);
			}
		}
	});
var $elm$core$Basics$compare = _Utils_compare;
var $elm$core$Dict$insertHelp = F3(
	function (key, value, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
		} else {
			var nColor = dict.a;
			var nKey = dict.b;
			var nValue = dict.c;
			var nLeft = dict.d;
			var nRight = dict.e;
			var _v1 = A2($elm$core$Basics$compare, key, nKey);
			switch (_v1.$) {
				case 'LT':
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						A3($elm$core$Dict$insertHelp, key, value, nLeft),
						nRight);
				case 'EQ':
					return A5($elm$core$Dict$RBNode_elm_builtin, nColor, nKey, value, nLeft, nRight);
				default:
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						nLeft,
						A3($elm$core$Dict$insertHelp, key, value, nRight));
			}
		}
	});
var $elm$core$Dict$insert = F3(
	function (key, value, dict) {
		var _v0 = A3($elm$core$Dict$insertHelp, key, value, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $elm$core$Dict$fromList = function (assocs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (_v0, dict) {
				var key = _v0.a;
				var value = _v0.b;
				return A3($elm$core$Dict$insert, key, value, dict);
			}),
		$elm$core$Dict$empty,
		assocs);
};
var $elm$core$Tuple$pair = F2(
	function (a, b) {
		return _Utils_Tuple2(a, b);
	});
var $author$project$Morphir$IR$Type$Codec$decodeConstructors = function (decodeAttributes) {
	return A2(
		$elm$json$Json$Decode$map,
		$elm$core$Dict$fromList,
		$elm$json$Json$Decode$list(
			A3(
				$elm$json$Json$Decode$map2,
				$elm$core$Tuple$pair,
				A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
				A2(
					$elm$json$Json$Decode$index,
					1,
					$elm$json$Json$Decode$list(
						A3(
							$elm$json$Json$Decode$map2,
							$elm$core$Tuple$pair,
							A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
							A2(
								$elm$json$Json$Decode$index,
								1,
								$author$project$Morphir$IR$Type$Codec$decodeType(decodeAttributes))))))));
};
var $author$project$Morphir$IR$Type$Codec$decodeDefinition = function (decodeAttributes) {
	return A2(
		$elm$json$Json$Decode$andThen,
		function (kind) {
			switch (kind) {
				case 'type_alias_definition':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$TypeAliasDefinition,
						A2(
							$elm$json$Json$Decode$index,
							1,
							$elm$json$Json$Decode$list($author$project$Morphir$IR$Name$Codec$decodeName)),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$author$project$Morphir$IR$Type$Codec$decodeType(decodeAttributes)));
				case 'custom_type_definition':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$CustomTypeDefinition,
						A2(
							$elm$json$Json$Decode$index,
							1,
							$elm$json$Json$Decode$list($author$project$Morphir$IR$Name$Codec$decodeName)),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$author$project$Morphir$IR$AccessControlled$Codec$decodeAccessControlled(
								$author$project$Morphir$IR$Type$Codec$decodeConstructors(decodeAttributes))));
				default:
					return $elm$json$Json$Decode$fail('Unknown kind: ' + kind);
			}
		},
		A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
};
var $author$project$Morphir$IR$Value$Apply = F3(
	function (a, b, c) {
		return {$: 'Apply', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$Constructor = F2(
	function (a, b) {
		return {$: 'Constructor', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$Definition = F3(
	function (inputTypes, outputType, body) {
		return {body: body, inputTypes: inputTypes, outputType: outputType};
	});
var $author$project$Morphir$IR$Value$Destructure = F4(
	function (a, b, c, d) {
		return {$: 'Destructure', a: a, b: b, c: c, d: d};
	});
var $author$project$Morphir$IR$Value$Field = F3(
	function (a, b, c) {
		return {$: 'Field', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$FieldFunction = F2(
	function (a, b) {
		return {$: 'FieldFunction', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$IfThenElse = F4(
	function (a, b, c, d) {
		return {$: 'IfThenElse', a: a, b: b, c: c, d: d};
	});
var $author$project$Morphir$IR$Value$Lambda = F3(
	function (a, b, c) {
		return {$: 'Lambda', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$LetDefinition = F4(
	function (a, b, c, d) {
		return {$: 'LetDefinition', a: a, b: b, c: c, d: d};
	});
var $author$project$Morphir$IR$Value$LetRecursion = F3(
	function (a, b, c) {
		return {$: 'LetRecursion', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$List = F2(
	function (a, b) {
		return {$: 'List', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$Literal = F2(
	function (a, b) {
		return {$: 'Literal', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$PatternMatch = F3(
	function (a, b, c) {
		return {$: 'PatternMatch', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$Record = F2(
	function (a, b) {
		return {$: 'Record', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$Reference = F2(
	function (a, b) {
		return {$: 'Reference', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$Tuple = F2(
	function (a, b) {
		return {$: 'Tuple', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$Unit = function (a) {
	return {$: 'Unit', a: a};
};
var $author$project$Morphir$IR$Value$UpdateRecord = F3(
	function (a, b, c) {
		return {$: 'UpdateRecord', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$Variable = F2(
	function (a, b) {
		return {$: 'Variable', a: a, b: b};
	});
var $author$project$Morphir$IR$Literal$BoolLiteral = function (a) {
	return {$: 'BoolLiteral', a: a};
};
var $author$project$Morphir$IR$Literal$CharLiteral = function (a) {
	return {$: 'CharLiteral', a: a};
};
var $author$project$Morphir$IR$Literal$FloatLiteral = function (a) {
	return {$: 'FloatLiteral', a: a};
};
var $author$project$Morphir$IR$Literal$IntLiteral = function (a) {
	return {$: 'IntLiteral', a: a};
};
var $author$project$Morphir$IR$Literal$StringLiteral = function (a) {
	return {$: 'StringLiteral', a: a};
};
var $elm$json$Json$Decode$bool = _Json_decodeBool;
var $elm$json$Json$Decode$float = _Json_decodeFloat;
var $author$project$Morphir$IR$Literal$Codec$decodeLiteral = A2(
	$elm$json$Json$Decode$andThen,
	function (kind) {
		switch (kind) {
			case 'bool_literal':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Morphir$IR$Literal$BoolLiteral,
					A2($elm$json$Json$Decode$index, 1, $elm$json$Json$Decode$bool));
			case 'char_literal':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Morphir$IR$Literal$CharLiteral,
					A2(
						$elm$json$Json$Decode$andThen,
						function (str) {
							var _v1 = $elm$core$String$uncons(str);
							if (_v1.$ === 'Just') {
								var _v2 = _v1.a;
								var ch = _v2.a;
								return $elm$json$Json$Decode$succeed(ch);
							} else {
								return $elm$json$Json$Decode$fail('Single char expected');
							}
						},
						A2($elm$json$Json$Decode$index, 1, $elm$json$Json$Decode$string)));
			case 'string_literal':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Morphir$IR$Literal$StringLiteral,
					A2($elm$json$Json$Decode$index, 1, $elm$json$Json$Decode$string));
			case 'int_literal':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Morphir$IR$Literal$IntLiteral,
					A2($elm$json$Json$Decode$index, 1, $elm$json$Json$Decode$int));
			case 'float_literal':
				return A2(
					$elm$json$Json$Decode$map,
					$author$project$Morphir$IR$Literal$FloatLiteral,
					A2($elm$json$Json$Decode$index, 1, $elm$json$Json$Decode$float));
			default:
				var other = kind;
				return $elm$json$Json$Decode$fail('Unknown literal type: ' + other);
		}
	},
	A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
var $author$project$Morphir$IR$Value$AsPattern = F3(
	function (a, b, c) {
		return {$: 'AsPattern', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$ConstructorPattern = F3(
	function (a, b, c) {
		return {$: 'ConstructorPattern', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$EmptyListPattern = function (a) {
	return {$: 'EmptyListPattern', a: a};
};
var $author$project$Morphir$IR$Value$HeadTailPattern = F3(
	function (a, b, c) {
		return {$: 'HeadTailPattern', a: a, b: b, c: c};
	});
var $author$project$Morphir$IR$Value$LiteralPattern = F2(
	function (a, b) {
		return {$: 'LiteralPattern', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$TuplePattern = F2(
	function (a, b) {
		return {$: 'TuplePattern', a: a, b: b};
	});
var $author$project$Morphir$IR$Value$UnitPattern = function (a) {
	return {$: 'UnitPattern', a: a};
};
var $author$project$Morphir$IR$Value$WildcardPattern = function (a) {
	return {$: 'WildcardPattern', a: a};
};
var $author$project$Morphir$IR$Value$Codec$decodePattern = function (decodeAttributes) {
	var lazyDecodePattern = $elm$json$Json$Decode$lazy(
		function (_v1) {
			return $author$project$Morphir$IR$Value$Codec$decodePattern(decodeAttributes);
		});
	return A2(
		$elm$json$Json$Decode$andThen,
		function (kind) {
			switch (kind) {
				case 'wildcard_pattern':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$Value$WildcardPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes));
				case 'as_pattern':
					return A4(
						$elm$json$Json$Decode$map3,
						$author$project$Morphir$IR$Value$AsPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, lazyDecodePattern),
						A2($elm$json$Json$Decode$index, 3, $author$project$Morphir$IR$Name$Codec$decodeName));
				case 'tuple_pattern':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Value$TuplePattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$elm$json$Json$Decode$list(lazyDecodePattern)));
				case 'constructor_pattern':
					return A4(
						$elm$json$Json$Decode$map3,
						$author$project$Morphir$IR$Value$ConstructorPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$FQName$Codec$decodeFQName),
						A2(
							$elm$json$Json$Decode$index,
							3,
							$elm$json$Json$Decode$list(lazyDecodePattern)));
				case 'empty_list_pattern':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$Value$EmptyListPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes));
				case 'head_tail_pattern':
					return A4(
						$elm$json$Json$Decode$map3,
						$author$project$Morphir$IR$Value$HeadTailPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, lazyDecodePattern),
						A2($elm$json$Json$Decode$index, 3, lazyDecodePattern));
				case 'literal_pattern':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Value$LiteralPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes),
						A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Literal$Codec$decodeLiteral));
				case 'unit_pattern':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$Value$UnitPattern,
						A2($elm$json$Json$Decode$index, 1, decodeAttributes));
				default:
					var other = kind;
					return $elm$json$Json$Decode$fail('Unknown pattern type: ' + other);
			}
		},
		A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
};
var $elm$json$Json$Decode$map4 = _Json_map4;
var $author$project$Morphir$IR$Value$Codec$decodeDefinition = F2(
	function (decodeTypeAttributes, decodeValueAttributes) {
		return A4(
			$elm$json$Json$Decode$map3,
			$author$project$Morphir$IR$Value$Definition,
			A2(
				$elm$json$Json$Decode$field,
				'inputTypes',
				$elm$json$Json$Decode$list(
					A4(
						$elm$json$Json$Decode$map3,
						F3(
							function (n, a, t) {
								return _Utils_Tuple3(n, a, t);
							}),
						A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
						A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$author$project$Morphir$IR$Type$Codec$decodeType(decodeTypeAttributes))))),
			A2(
				$elm$json$Json$Decode$field,
				'outputType',
				$author$project$Morphir$IR$Type$Codec$decodeType(decodeTypeAttributes)),
			A2(
				$elm$json$Json$Decode$field,
				'body',
				$elm$json$Json$Decode$lazy(
					function (_v2) {
						return A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes);
					})));
	});
var $author$project$Morphir$IR$Value$Codec$decodeValue = F2(
	function (decodeTypeAttributes, decodeValueAttributes) {
		var lazyDecodeValue = $elm$json$Json$Decode$lazy(
			function (_v1) {
				return A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes);
			});
		return A2(
			$elm$json$Json$Decode$andThen,
			function (kind) {
				switch (kind) {
					case 'literal':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$Literal,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Literal$Codec$decodeLiteral));
					case 'constructor':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$Constructor,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$FQName$Codec$decodeFQName));
					case 'tuple':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$Tuple,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								$elm$json$Json$Decode$list(lazyDecodeValue)));
					case 'list':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$List,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								$elm$json$Json$Decode$list(lazyDecodeValue)));
					case 'record':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$Record,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								$elm$json$Json$Decode$list(
									A3(
										$elm$json$Json$Decode$map2,
										$elm$core$Tuple$pair,
										A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
										A2(
											$elm$json$Json$Decode$index,
											1,
											A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes))))));
					case 'variable':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$Variable,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Name$Codec$decodeName));
					case 'reference':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$Reference,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$FQName$Codec$decodeFQName));
					case 'field':
						return A4(
							$elm$json$Json$Decode$map3,
							$author$project$Morphir$IR$Value$Field,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2($elm$json$Json$Decode$index, 3, $author$project$Morphir$IR$Name$Codec$decodeName));
					case 'field_function':
						return A3(
							$elm$json$Json$Decode$map2,
							$author$project$Morphir$IR$Value$FieldFunction,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Name$Codec$decodeName));
					case 'apply':
						return A4(
							$elm$json$Json$Decode$map3,
							$author$project$Morphir$IR$Value$Apply,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								3,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)));
					case 'lambda':
						return A4(
							$elm$json$Json$Decode$map3,
							$author$project$Morphir$IR$Value$Lambda,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								$author$project$Morphir$IR$Value$Codec$decodePattern(decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								3,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)));
					case 'let_definition':
						return A5(
							$elm$json$Json$Decode$map4,
							$author$project$Morphir$IR$Value$LetDefinition,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2($elm$json$Json$Decode$index, 2, $author$project$Morphir$IR$Name$Codec$decodeName),
							A2(
								$elm$json$Json$Decode$index,
								3,
								A2($author$project$Morphir$IR$Value$Codec$decodeDefinition, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								4,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)));
					case 'let_recursion':
						return A4(
							$elm$json$Json$Decode$map3,
							$author$project$Morphir$IR$Value$LetRecursion,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								A2(
									$elm$json$Json$Decode$map,
									$elm$core$Dict$fromList,
									$elm$json$Json$Decode$list(
										A3(
											$elm$json$Json$Decode$map2,
											$elm$core$Tuple$pair,
											A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
											A2(
												$elm$json$Json$Decode$index,
												1,
												A2($author$project$Morphir$IR$Value$Codec$decodeDefinition, decodeTypeAttributes, decodeValueAttributes)))))),
							A2(
								$elm$json$Json$Decode$index,
								3,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)));
					case 'destructure':
						return A5(
							$elm$json$Json$Decode$map4,
							$author$project$Morphir$IR$Value$Destructure,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								$author$project$Morphir$IR$Value$Codec$decodePattern(decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								3,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								4,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)));
					case 'if_then_else':
						return A5(
							$elm$json$Json$Decode$map4,
							$author$project$Morphir$IR$Value$IfThenElse,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								3,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								4,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)));
					case 'pattern_match':
						return A4(
							$elm$json$Json$Decode$map3,
							$author$project$Morphir$IR$Value$PatternMatch,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								3,
								$elm$json$Json$Decode$list(
									A3(
										$elm$json$Json$Decode$map2,
										$elm$core$Tuple$pair,
										A2(
											$elm$json$Json$Decode$index,
											0,
											$author$project$Morphir$IR$Value$Codec$decodePattern(decodeValueAttributes)),
										A2(
											$elm$json$Json$Decode$index,
											1,
											A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes))))));
					case 'update_record':
						return A4(
							$elm$json$Json$Decode$map3,
							$author$project$Morphir$IR$Value$UpdateRecord,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes),
							A2(
								$elm$json$Json$Decode$index,
								2,
								A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes)),
							A2(
								$elm$json$Json$Decode$index,
								3,
								$elm$json$Json$Decode$list(
									A3(
										$elm$json$Json$Decode$map2,
										$elm$core$Tuple$pair,
										A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
										A2(
											$elm$json$Json$Decode$index,
											1,
											A2($author$project$Morphir$IR$Value$Codec$decodeValue, decodeTypeAttributes, decodeValueAttributes))))));
					case 'unit':
						return A2(
							$elm$json$Json$Decode$map,
							$author$project$Morphir$IR$Value$Unit,
							A2($elm$json$Json$Decode$index, 1, decodeValueAttributes));
					default:
						var other = kind;
						return $elm$json$Json$Decode$fail('Unknown value type: ' + other);
				}
			},
			A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
	});
var $author$project$Morphir$IR$Documented$Documented = F2(
	function (doc, value) {
		return {doc: doc, value: value};
	});
var $author$project$Morphir$IR$Documented$Codec$decodeDocumented = function (decodeValue) {
	return A3(
		$elm$json$Json$Decode$map2,
		$author$project$Morphir$IR$Documented$Documented,
		A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string),
		A2($elm$json$Json$Decode$index, 1, decodeValue));
};
var $author$project$Morphir$IR$Module$Codec$decodeDefinition = F2(
	function (decodeTypeAttributes, decodeValueAttributes) {
		return A3(
			$elm$json$Json$Decode$map2,
			$author$project$Morphir$IR$Module$Definition,
			A2(
				$elm$json$Json$Decode$field,
				'types',
				A2(
					$elm$json$Json$Decode$map,
					$elm$core$Dict$fromList,
					$elm$json$Json$Decode$list(
						A3(
							$elm$json$Json$Decode$map2,
							$elm$core$Tuple$pair,
							A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
							A2(
								$elm$json$Json$Decode$index,
								1,
								$author$project$Morphir$IR$AccessControlled$Codec$decodeAccessControlled(
									$author$project$Morphir$IR$Documented$Codec$decodeDocumented(
										$author$project$Morphir$IR$Type$Codec$decodeDefinition(decodeTypeAttributes)))))))),
			A2(
				$elm$json$Json$Decode$field,
				'values',
				A2(
					$elm$json$Json$Decode$map,
					$elm$core$Dict$fromList,
					$elm$json$Json$Decode$list(
						A3(
							$elm$json$Json$Decode$map2,
							$elm$core$Tuple$pair,
							A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
							A2(
								$elm$json$Json$Decode$index,
								1,
								$author$project$Morphir$IR$AccessControlled$Codec$decodeAccessControlled(
									A2($author$project$Morphir$IR$Value$Codec$decodeDefinition, decodeTypeAttributes, decodeValueAttributes))))))));
	});
var $author$project$Morphir$IR$Package$Codec$decodeDefinition = F2(
	function (decodeAttributes, decodeAttributes2) {
		return A2(
			$elm$json$Json$Decode$map,
			$author$project$Morphir$IR$Package$Definition,
			A2(
				$elm$json$Json$Decode$field,
				'modules',
				A2(
					$elm$json$Json$Decode$map,
					$elm$core$Dict$fromList,
					$elm$json$Json$Decode$list(
						A3(
							$elm$json$Json$Decode$map2,
							$elm$core$Tuple$pair,
							A2($elm$json$Json$Decode$field, 'name', $author$project$Morphir$IR$Path$Codec$decodePath),
							A2(
								$elm$json$Json$Decode$field,
								'def',
								$author$project$Morphir$IR$AccessControlled$Codec$decodeAccessControlled(
									A2($author$project$Morphir$IR$Module$Codec$decodeDefinition, decodeAttributes, decodeAttributes2))))))));
	});
var $author$project$Morphir$IR$Package$Specification = function (modules) {
	return {modules: modules};
};
var $author$project$Morphir$IR$Module$Specification = F2(
	function (types, values) {
		return {types: types, values: values};
	});
var $author$project$Morphir$IR$Type$CustomTypeSpecification = F2(
	function (a, b) {
		return {$: 'CustomTypeSpecification', a: a, b: b};
	});
var $author$project$Morphir$IR$Type$OpaqueTypeSpecification = function (a) {
	return {$: 'OpaqueTypeSpecification', a: a};
};
var $author$project$Morphir$IR$Type$TypeAliasSpecification = F2(
	function (a, b) {
		return {$: 'TypeAliasSpecification', a: a, b: b};
	});
var $author$project$Morphir$IR$Type$Codec$decodeSpecification = function (decodeAttributes) {
	return A2(
		$elm$json$Json$Decode$andThen,
		function (kind) {
			switch (kind) {
				case 'type_alias_specification':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$TypeAliasSpecification,
						A2(
							$elm$json$Json$Decode$index,
							1,
							$elm$json$Json$Decode$list($author$project$Morphir$IR$Name$Codec$decodeName)),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$author$project$Morphir$IR$Type$Codec$decodeType(decodeAttributes)));
				case 'opaque_type_specification':
					return A2(
						$elm$json$Json$Decode$map,
						$author$project$Morphir$IR$Type$OpaqueTypeSpecification,
						A2(
							$elm$json$Json$Decode$index,
							1,
							$elm$json$Json$Decode$list($author$project$Morphir$IR$Name$Codec$decodeName)));
				case 'custom_type_specification':
					return A3(
						$elm$json$Json$Decode$map2,
						$author$project$Morphir$IR$Type$CustomTypeSpecification,
						A2(
							$elm$json$Json$Decode$index,
							1,
							$elm$json$Json$Decode$list($author$project$Morphir$IR$Name$Codec$decodeName)),
						A2(
							$elm$json$Json$Decode$index,
							2,
							$author$project$Morphir$IR$Type$Codec$decodeConstructors(decodeAttributes)));
				default:
					return $elm$json$Json$Decode$fail('Unknown kind: ' + kind);
			}
		},
		A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
};
var $author$project$Morphir$IR$Value$Specification = F2(
	function (inputs, output) {
		return {inputs: inputs, output: output};
	});
var $author$project$Morphir$IR$Value$Codec$decodeSpecification = function (decodeTypeAttributes) {
	return A3(
		$elm$json$Json$Decode$map2,
		$author$project$Morphir$IR$Value$Specification,
		A2(
			$elm$json$Json$Decode$field,
			'inputs',
			$elm$json$Json$Decode$list(
				A3(
					$elm$json$Json$Decode$map2,
					$elm$core$Tuple$pair,
					A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
					A2(
						$elm$json$Json$Decode$index,
						1,
						$author$project$Morphir$IR$Type$Codec$decodeType(decodeTypeAttributes))))),
		A2(
			$elm$json$Json$Decode$field,
			'output',
			$author$project$Morphir$IR$Type$Codec$decodeType(decodeTypeAttributes)));
};
var $author$project$Morphir$IR$Module$Codec$decodeSpecification = function (decodeTypeAttributes) {
	return A3(
		$elm$json$Json$Decode$map2,
		$author$project$Morphir$IR$Module$Specification,
		A2(
			$elm$json$Json$Decode$field,
			'types',
			A2(
				$elm$json$Json$Decode$map,
				$elm$core$Dict$fromList,
				$elm$json$Json$Decode$list(
					A3(
						$elm$json$Json$Decode$map2,
						$elm$core$Tuple$pair,
						A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
						A2(
							$elm$json$Json$Decode$index,
							1,
							$author$project$Morphir$IR$Documented$Codec$decodeDocumented(
								$author$project$Morphir$IR$Type$Codec$decodeSpecification(decodeTypeAttributes))))))),
		A2(
			$elm$json$Json$Decode$field,
			'values',
			A2(
				$elm$json$Json$Decode$map,
				$elm$core$Dict$fromList,
				$elm$json$Json$Decode$list(
					A3(
						$elm$json$Json$Decode$map2,
						$elm$core$Tuple$pair,
						A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Name$Codec$decodeName),
						A2(
							$elm$json$Json$Decode$index,
							1,
							$author$project$Morphir$IR$Value$Codec$decodeSpecification(decodeTypeAttributes)))))));
};
var $author$project$Morphir$IR$Package$Codec$decodeSpecification = function (decodeAttributes) {
	return A2(
		$elm$json$Json$Decode$map,
		$author$project$Morphir$IR$Package$Specification,
		A2(
			$elm$json$Json$Decode$field,
			'modules',
			A2(
				$elm$json$Json$Decode$map,
				$elm$core$Dict$fromList,
				$elm$json$Json$Decode$list(
					A3(
						$elm$json$Json$Decode$map2,
						$elm$core$Tuple$pair,
						A2($elm$json$Json$Decode$field, 'name', $author$project$Morphir$IR$Path$Codec$decodePath),
						A2(
							$elm$json$Json$Decode$field,
							'spec',
							$author$project$Morphir$IR$Module$Codec$decodeSpecification(decodeAttributes)))))));
};
var $author$project$Morphir$Codec$decodeUnit = $elm$json$Json$Decode$succeed(_Utils_Tuple0);
var $author$project$Morphir$IR$Distribution$Codec$decodeDistribution = A2(
	$elm$json$Json$Decode$andThen,
	function (kind) {
		if (kind === 'library') {
			return A4(
				$elm$json$Json$Decode$map3,
				$author$project$Morphir$IR$Distribution$Library,
				A2($elm$json$Json$Decode$index, 1, $author$project$Morphir$IR$Path$Codec$decodePath),
				A2(
					$elm$json$Json$Decode$index,
					2,
					A2(
						$elm$json$Json$Decode$map,
						$elm$core$Dict$fromList,
						$elm$json$Json$Decode$list(
							A3(
								$elm$json$Json$Decode$map2,
								$elm$core$Tuple$pair,
								A2($elm$json$Json$Decode$index, 0, $author$project$Morphir$IR$Path$Codec$decodePath),
								A2(
									$elm$json$Json$Decode$index,
									1,
									$author$project$Morphir$IR$Package$Codec$decodeSpecification($author$project$Morphir$Codec$decodeUnit)))))),
				A2(
					$elm$json$Json$Decode$index,
					3,
					A2(
						$author$project$Morphir$IR$Package$Codec$decodeDefinition,
						$author$project$Morphir$Codec$decodeUnit,
						$author$project$Morphir$IR$Type$Codec$decodeType($author$project$Morphir$Codec$decodeUnit))));
		} else {
			var other = kind;
			return $elm$json$Json$Decode$fail('Unknown value type: ' + other);
		}
	},
	A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string));
var $author$project$Morphir$IR$Distribution$Codec$decodeVersionedDistribution = $elm$json$Json$Decode$oneOf(
	_List_fromArray(
		[
			A2(
			$elm$json$Json$Decode$andThen,
			function (formatVersion) {
				return _Utils_eq(formatVersion, $author$project$Morphir$IR$Distribution$Codec$currentFormatVersion) ? A2($elm$json$Json$Decode$field, 'distribution', $author$project$Morphir$IR$Distribution$Codec$decodeDistribution) : $elm$json$Json$Decode$fail(
					$elm$core$String$concat(
						_List_fromArray(
							[
								'The IR is using format version ',
								$elm$core$String$fromInt(formatVersion),
								' but the latest format version is ',
								$elm$core$String$fromInt($author$project$Morphir$IR$Distribution$Codec$currentFormatVersion),
								'. Please regenerate it!'
							])));
			},
			A2($elm$json$Json$Decode$field, 'formatVersion', $elm$json$Json$Decode$int)),
			$elm$json$Json$Decode$fail('The IR is in an old format that doesn\'t have a format version on it. Please regenerate it!')
		]));
var $author$project$Morphir$Web$Insight$decodeFlag = A3(
	$elm$json$Json$Decode$map2,
	$author$project$Morphir$Web$Insight$Flag,
	A2($elm$json$Json$Decode$field, 'distribution', $author$project$Morphir$IR$Distribution$Codec$decodeVersionedDistribution),
	$elm$json$Json$Decode$maybe(
		A2($elm$json$Json$Decode$field, 'config', $author$project$Morphir$Visual$Theme$Codec$decodeThemeConfig)));
var $elm$json$Json$Decode$decodeValue = _Json_run;
var $mdgriffith$elm_ui$Internal$Model$Rgba = F4(
	function (a, b, c, d) {
		return {$: 'Rgba', a: a, b: b, c: c, d: d};
	});
var $mdgriffith$elm_ui$Element$rgb = F3(
	function (r, g, b) {
		return A4($mdgriffith$elm_ui$Internal$Model$Rgba, r, g, b, 1);
	});
var $mdgriffith$elm_ui$Element$rgb255 = F3(
	function (red, green, blue) {
		return A4($mdgriffith$elm_ui$Internal$Model$Rgba, red / 255, green / 255, blue / 255, 1);
	});
var $author$project$Morphir$Visual$Theme$defaultColors = {
	darkest: A3($mdgriffith$elm_ui$Element$rgb, 0.1, 0.1, 0.1),
	lightest: A3($mdgriffith$elm_ui$Element$rgb, 1, 1, 1),
	negative: A3($mdgriffith$elm_ui$Element$rgb, 0.7, 0, 0),
	positive: A3($mdgriffith$elm_ui$Element$rgb, 0, 0.6, 0),
	primaryHighlight: A3($mdgriffith$elm_ui$Element$rgb255, 0, 163, 225),
	secondaryHighlight: A3($mdgriffith$elm_ui$Element$rgb255, 255, 105, 0)
};
var $elm$core$Maybe$withDefault = F2(
	function (_default, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return value;
		} else {
			return _default;
		}
	});
var $author$project$Morphir$Visual$Theme$fromConfig = function (maybeConfig) {
	if (maybeConfig.$ === 'Just') {
		var config = maybeConfig.a;
		return {
			colors: $author$project$Morphir$Visual$Theme$defaultColors,
			decimalDigit: A2($elm$core$Maybe$withDefault, 2, config.decimalDigit),
			fontSize: A2($elm$core$Maybe$withDefault, 12, config.fontSize)
		};
	} else {
		return {colors: $author$project$Morphir$Visual$Theme$defaultColors, decimalDigit: 2, fontSize: 12};
	}
};
var $elm$core$Platform$Cmd$batch = _Platform_batch;
var $elm$core$Platform$Cmd$none = $elm$core$Platform$Cmd$batch(_List_Nil);
var $author$project$Morphir$Web$Insight$init = function (json) {
	var model = function () {
		var _v0 = A2($elm$json$Json$Decode$decodeValue, $author$project$Morphir$Web$Insight$decodeFlag, json);
		if (_v0.$ === 'Ok') {
			var flag = _v0.a;
			return {
				modelState: $author$project$Morphir$Web$Insight$IRLoaded(flag.distribution),
				theme: $author$project$Morphir$Visual$Theme$fromConfig(flag.config)
			};
		} else {
			var error = _v0.a;
			return {
				modelState: $author$project$Morphir$Web$Insight$Failed(
					'Wrong IR: ' + $elm$json$Json$Decode$errorToString(error)),
				theme: $author$project$Morphir$Visual$Theme$fromConfig($elm$core$Maybe$Nothing)
			};
		}
	}();
	return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
};
var $author$project$Morphir$Web$Insight$FunctionArgumentsReceived = function (a) {
	return {$: 'FunctionArgumentsReceived', a: a};
};
var $author$project$Morphir$Web$Insight$FunctionNameReceived = function (a) {
	return {$: 'FunctionNameReceived', a: a};
};
var $elm$core$Platform$Sub$batch = _Platform_batch;
var $elm$json$Json$Decode$value = _Json_decodeValue;
var $author$project$Morphir$Web$Insight$receiveFunctionArguments = _Platform_incomingPort('receiveFunctionArguments', $elm$json$Json$Decode$value);
var $author$project$Morphir$Web$Insight$receiveFunctionName = _Platform_incomingPort('receiveFunctionName', $elm$json$Json$Decode$string);
var $author$project$Morphir$Web$Insight$subscriptions = function (model) {
	return $elm$core$Platform$Sub$batch(
		_List_fromArray(
			[
				$author$project$Morphir$Web$Insight$receiveFunctionArguments($author$project$Morphir$Web$Insight$FunctionArgumentsReceived),
				$author$project$Morphir$Web$Insight$receiveFunctionName($author$project$Morphir$Web$Insight$FunctionNameReceived)
			]));
};
var $author$project$Morphir$Web$Insight$FunctionsSet = function (a) {
	return {$: 'FunctionsSet', a: a};
};
var $author$project$Morphir$IR$QName$QName = F2(
	function (a, b) {
		return {$: 'QName', a: a, b: b};
	});
var $elm$core$Maybe$andThen = F2(
	function (callback, maybeValue) {
		if (maybeValue.$ === 'Just') {
			var value = maybeValue.a;
			return callback(value);
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $elm$core$Result$andThen = F2(
	function (callback, result) {
		if (result.$ === 'Ok') {
			var value = result.a;
			return callback(value);
		} else {
			var msg = result.a;
			return $elm$core$Result$Err(msg);
		}
	});
var $elm$core$Result$fromMaybe = F2(
	function (err, maybe) {
		if (maybe.$ === 'Just') {
			var v = maybe.a;
			return $elm$core$Result$Ok(v);
		} else {
			return $elm$core$Result$Err(err);
		}
	});
var $elm$regex$Regex$Match = F4(
	function (match, index, number, submatches) {
		return {index: index, match: match, number: number, submatches: submatches};
	});
var $elm$regex$Regex$find = _Regex_findAtMost(_Regex_infinity);
var $elm$regex$Regex$fromStringWith = _Regex_fromStringWith;
var $elm$regex$Regex$fromString = function (string) {
	return A2(
		$elm$regex$Regex$fromStringWith,
		{caseInsensitive: false, multiline: false},
		string);
};
var $elm$regex$Regex$never = _Regex_never;
var $elm$core$String$toLower = _String_toLower;
var $author$project$Morphir$IR$Name$fromString = function (string) {
	var wordPattern = A2(
		$elm$core$Maybe$withDefault,
		$elm$regex$Regex$never,
		$elm$regex$Regex$fromString('([a-zA-Z][a-z]*|[0-9]+)'));
	return $author$project$Morphir$IR$Name$fromList(
		A2(
			$elm$core$List$map,
			$elm$core$String$toLower,
			A2(
				$elm$core$List$map,
				function ($) {
					return $.match;
				},
				A2($elm$regex$Regex$find, wordPattern, string))));
};
var $elm$core$Dict$get = F2(
	function (targetKey, dict) {
		get:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return $elm$core$Maybe$Nothing;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var _v1 = A2($elm$core$Basics$compare, targetKey, key);
				switch (_v1.$) {
					case 'LT':
						var $temp$targetKey = targetKey,
							$temp$dict = left;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
					case 'EQ':
						return $elm$core$Maybe$Just(value);
					default:
						var $temp$targetKey = targetKey,
							$temp$dict = right;
						targetKey = $temp$targetKey;
						dict = $temp$dict;
						continue get;
				}
			}
		}
	});
var $elm$regex$Regex$split = _Regex_splitAtMost(_Regex_infinity);
var $author$project$Morphir$IR$Path$fromString = function (string) {
	var separatorRegex = A2(
		$elm$core$Maybe$withDefault,
		$elm$regex$Regex$never,
		$elm$regex$Regex$fromString('[^\\w\\s]+'));
	return $author$project$Morphir$IR$Path$fromList(
		A2(
			$elm$core$List$map,
			$author$project$Morphir$IR$Name$fromString,
			A2($elm$regex$Regex$split, separatorRegex, string)));
};
var $author$project$Morphir$IR$SDK$Maybe$moduleName = $author$project$Morphir$IR$Path$fromString('Maybe');
var $author$project$Morphir$IR$QName$fromName = F2(
	function (modulePath, localName) {
		return A2($author$project$Morphir$IR$QName$QName, modulePath, localName);
	});
var $author$project$Morphir$IR$QName$getLocalName = function (_v0) {
	var localName = _v0.b;
	return localName;
};
var $author$project$Morphir$IR$QName$getModulePath = function (_v0) {
	var modulePath = _v0.a;
	return modulePath;
};
var $author$project$Morphir$IR$FQName$fromQName = F2(
	function (packagePath, qName) {
		return _Utils_Tuple3(
			packagePath,
			$author$project$Morphir$IR$QName$getModulePath(qName),
			$author$project$Morphir$IR$QName$getLocalName(qName));
	});
var $author$project$Morphir$IR$SDK$Common$packageName = $author$project$Morphir$IR$Path$fromString('Morphir.SDK');
var $author$project$Morphir$IR$SDK$Common$toFQName = F2(
	function (modulePath, localName) {
		return A2(
			$author$project$Morphir$IR$FQName$fromQName,
			$author$project$Morphir$IR$SDK$Common$packageName,
			A2(
				$author$project$Morphir$IR$QName$fromName,
				modulePath,
				$author$project$Morphir$IR$Name$fromString(localName)));
	});
var $author$project$Morphir$IR$SDK$Maybe$just = F2(
	function (va, v) {
		return A3(
			$author$project$Morphir$IR$Value$Apply,
			va,
			A2(
				$author$project$Morphir$IR$Value$Constructor,
				va,
				A2($author$project$Morphir$IR$SDK$Common$toFQName, $author$project$Morphir$IR$SDK$Maybe$moduleName, 'Just')),
			v);
	});
var $author$project$Morphir$IR$lookupTypeSpecification = F2(
	function (fqn, ir) {
		return A2($elm$core$Dict$get, fqn, ir.typeSpecifications);
	});
var $elm$core$Result$map = F2(
	function (func, ra) {
		if (ra.$ === 'Ok') {
			var a = ra.a;
			return $elm$core$Result$Ok(
				func(a));
		} else {
			var e = ra.a;
			return $elm$core$Result$Err(e);
		}
	});
var $author$project$Morphir$IR$SDK$Maybe$nothing = function (va) {
	return A2(
		$author$project$Morphir$IR$Value$Constructor,
		va,
		A2($author$project$Morphir$IR$SDK$Common$toFQName, $author$project$Morphir$IR$SDK$Maybe$moduleName, 'Nothing'));
};
var $elm$core$Tuple$second = function (_v0) {
	var y = _v0.b;
	return y;
};
var $author$project$Morphir$IR$Type$substituteTypeVariables = F2(
	function (mapping, original) {
		switch (original.$) {
			case 'Variable':
				var a = original.a;
				var varName = original.b;
				return A2(
					$elm$core$Maybe$withDefault,
					original,
					A2($elm$core$Dict$get, varName, mapping));
			case 'Reference':
				var a = original.a;
				var fQName = original.b;
				var typeArgs = original.c;
				return A3(
					$author$project$Morphir$IR$Type$Reference,
					a,
					fQName,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Type$substituteTypeVariables(mapping),
						typeArgs));
			case 'Tuple':
				var a = original.a;
				var elemTypes = original.b;
				return A2(
					$author$project$Morphir$IR$Type$Tuple,
					a,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Type$substituteTypeVariables(mapping),
						elemTypes));
			case 'Record':
				var a = original.a;
				var fields = original.b;
				return A2(
					$author$project$Morphir$IR$Type$Record,
					a,
					A2(
						$elm$core$List$map,
						function (field) {
							return A2(
								$author$project$Morphir$IR$Type$Field,
								field.name,
								A2($author$project$Morphir$IR$Type$substituteTypeVariables, mapping, field.tpe));
						},
						fields));
			case 'ExtensibleRecord':
				var a = original.a;
				var name = original.b;
				var fields = original.c;
				return A3(
					$author$project$Morphir$IR$Type$ExtensibleRecord,
					a,
					name,
					A2(
						$elm$core$List$map,
						function (field) {
							return A2(
								$author$project$Morphir$IR$Type$Field,
								field.name,
								A2($author$project$Morphir$IR$Type$substituteTypeVariables, mapping, field.tpe));
						},
						fields));
			case 'Function':
				var a = original.a;
				var argType = original.b;
				var returnType = original.c;
				return A3(
					$author$project$Morphir$IR$Type$Function,
					a,
					A2($author$project$Morphir$IR$Type$substituteTypeVariables, mapping, argType),
					A2($author$project$Morphir$IR$Type$substituteTypeVariables, mapping, returnType));
			default:
				var a = original.a;
				return $author$project$Morphir$IR$Type$Unit(a);
		}
	});
var $elm$core$String$cons = _String_cons;
var $elm$core$Char$toUpper = _Char_toUpper;
var $author$project$Morphir$IR$Name$capitalize = function (string) {
	var _v0 = $elm$core$String$uncons(string);
	if (_v0.$ === 'Just') {
		var _v1 = _v0.a;
		var headChar = _v1.a;
		var tailString = _v1.b;
		return A2(
			$elm$core$String$cons,
			$elm$core$Char$toUpper(headChar),
			tailString);
	} else {
		return string;
	}
};
var $author$project$Morphir$IR$Name$toList = function (words) {
	return words;
};
var $author$project$Morphir$IR$Name$toCamelCase = function (name) {
	var _v0 = $author$project$Morphir$IR$Name$toList(name);
	if (!_v0.b) {
		return '';
	} else {
		var head = _v0.a;
		var tail = _v0.b;
		return A2(
			$elm$core$String$join,
			'',
			A2(
				$elm$core$List$cons,
				head,
				A2($elm$core$List$map, $author$project$Morphir$IR$Name$capitalize, tail)));
	}
};
var $author$project$Morphir$IR$Path$toList = function (names) {
	return names;
};
var $author$project$Morphir$IR$Path$toString = F3(
	function (nameToString, sep, path) {
		return A2(
			$elm$core$String$join,
			sep,
			A2(
				$elm$core$List$map,
				nameToString,
				$author$project$Morphir$IR$Path$toList(path)));
	});
var $author$project$Morphir$IR$Name$toTitleCase = function (name) {
	return A2(
		$elm$core$String$join,
		'',
		A2(
			$elm$core$List$map,
			$author$project$Morphir$IR$Name$capitalize,
			$author$project$Morphir$IR$Name$toList(name)));
};
var $author$project$Morphir$IR$FQName$toString = function (_v0) {
	var p = _v0.a;
	var m = _v0.b;
	var l = _v0.c;
	return A2(
		$elm$core$String$join,
		':',
		_List_fromArray(
			[
				A3($author$project$Morphir$IR$Path$toString, $author$project$Morphir$IR$Name$toTitleCase, '.', p),
				A3($author$project$Morphir$IR$Path$toString, $author$project$Morphir$IR$Name$toTitleCase, '.', m),
				$author$project$Morphir$IR$Name$toCamelCase(l)
			]));
};
var $elm$core$Debug$todo = _Debug_todo;
var $author$project$Morphir$IR$Type$DataCodec$decodeData = F2(
	function (ir, tpe) {
		switch (tpe.$) {
			case 'Reference':
				if ((((((((((((tpe.b.a.b && tpe.b.a.a.b) && (tpe.b.a.a.a === 'morphir')) && (!tpe.b.a.a.b.b)) && tpe.b.a.b.b) && tpe.b.a.b.a.b) && (tpe.b.a.b.a.a === 's')) && tpe.b.a.b.a.b.b) && (tpe.b.a.b.a.b.a === 'd')) && tpe.b.a.b.a.b.b.b) && (tpe.b.a.b.a.b.b.a === 'k')) && (!tpe.b.a.b.a.b.b.b.b)) && (!tpe.b.a.b.b.b)) {
					var _v1 = tpe.b;
					var _v2 = _v1.a;
					var _v3 = _v2.a;
					var _v4 = _v2.b;
					var _v5 = _v4.a;
					var _v6 = _v5.b;
					var _v7 = _v6.b;
					var moduleName = _v1.b;
					var localName = _v1.c;
					var args = tpe.c;
					var _v8 = _Utils_Tuple3(moduleName, localName, args);
					_v8$7:
					while (true) {
						if (((((_v8.a.b && _v8.a.a.b) && (!_v8.a.a.b.b)) && (!_v8.a.b.b)) && _v8.b.b) && (!_v8.b.b.b)) {
							if (!_v8.c.b) {
								switch (_v8.a.a.a) {
									case 'basics':
										switch (_v8.b.a) {
											case 'bool':
												var _v9 = _v8.a;
												var _v10 = _v9.a;
												var _v11 = _v8.b;
												return $elm$core$Result$Ok(
													A2(
														$elm$json$Json$Decode$map,
														function (value) {
															return A2(
																$author$project$Morphir$IR$Value$Literal,
																_Utils_Tuple0,
																$author$project$Morphir$IR$Literal$BoolLiteral(value));
														},
														$elm$json$Json$Decode$bool));
											case 'int':
												var _v12 = _v8.a;
												var _v13 = _v12.a;
												var _v14 = _v8.b;
												return $elm$core$Result$Ok(
													A2(
														$elm$json$Json$Decode$map,
														function (value) {
															return A2(
																$author$project$Morphir$IR$Value$Literal,
																_Utils_Tuple0,
																$author$project$Morphir$IR$Literal$IntLiteral(value));
														},
														$elm$json$Json$Decode$int));
											case 'float':
												var _v15 = _v8.a;
												var _v16 = _v15.a;
												var _v17 = _v8.b;
												return $elm$core$Result$Ok(
													A2(
														$elm$json$Json$Decode$map,
														function (value) {
															return A2(
																$author$project$Morphir$IR$Value$Literal,
																_Utils_Tuple0,
																$author$project$Morphir$IR$Literal$FloatLiteral(value));
														},
														$elm$json$Json$Decode$float));
											default:
												break _v8$7;
										}
									case 'char':
										if (_v8.b.a === 'char') {
											var _v18 = _v8.a;
											var _v19 = _v18.a;
											var _v20 = _v8.b;
											return $elm$core$Result$Ok(
												A2(
													$elm$json$Json$Decode$andThen,
													function (value) {
														var _v21 = $elm$core$String$uncons(value);
														if (_v21.$ === 'Just') {
															var _v22 = _v21.a;
															var firstChar = _v22.a;
															return $elm$json$Json$Decode$succeed(
																A2(
																	$author$project$Morphir$IR$Value$Literal,
																	_Utils_Tuple0,
																	$author$project$Morphir$IR$Literal$CharLiteral(firstChar)));
														} else {
															return $elm$json$Json$Decode$fail('Expected char but found empty string.');
														}
													},
													$elm$json$Json$Decode$string));
										} else {
											break _v8$7;
										}
									case 'string':
										if (_v8.b.a === 'string') {
											var _v23 = _v8.a;
											var _v24 = _v23.a;
											var _v25 = _v8.b;
											return $elm$core$Result$Ok(
												A2(
													$elm$json$Json$Decode$map,
													function (value) {
														return A2(
															$author$project$Morphir$IR$Value$Literal,
															_Utils_Tuple0,
															$author$project$Morphir$IR$Literal$StringLiteral(value));
													},
													$elm$json$Json$Decode$string));
										} else {
											break _v8$7;
										}
									default:
										break _v8$7;
								}
							} else {
								if (!_v8.c.b.b) {
									switch (_v8.a.a.a) {
										case 'list':
											if (_v8.b.a === 'list') {
												var _v26 = _v8.a;
												var _v27 = _v26.a;
												var _v28 = _v8.b;
												var _v29 = _v8.c;
												var itemType = _v29.a;
												return A2(
													$elm$core$Result$map,
													function (itemDecoder) {
														return A2(
															$elm$json$Json$Decode$map,
															$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
															$elm$json$Json$Decode$list(itemDecoder));
													},
													A2($author$project$Morphir$IR$Type$DataCodec$decodeData, ir, itemType));
											} else {
												break _v8$7;
											}
										case 'maybe':
											if (_v8.b.a === 'maybe') {
												var _v30 = _v8.a;
												var _v31 = _v30.a;
												var _v32 = _v8.b;
												var _v33 = _v8.c;
												var itemType = _v33.a;
												return A2(
													$elm$core$Result$map,
													function (itemDecoder) {
														return A2(
															$elm$json$Json$Decode$map,
															function (item) {
																if (item.$ === 'Just') {
																	var v = item.a;
																	return A2($author$project$Morphir$IR$SDK$Maybe$just, _Utils_Tuple0, v);
																} else {
																	return $author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0);
																}
															},
															$elm$json$Json$Decode$maybe(itemDecoder));
													},
													A2($author$project$Morphir$IR$Type$DataCodec$decodeData, ir, itemType));
											} else {
												break _v8$7;
											}
										default:
											break _v8$7;
									}
								} else {
									break _v8$7;
								}
							}
						} else {
							break _v8$7;
						}
					}
					return _Debug_todo(
						'Morphir.IR.Type.DataCodec',
						{
							start: {line: 301, column: 21},
							end: {line: 301, column: 31}
						})('Todo Custom Type');
				} else {
					var fQName = tpe.b;
					var typePackageName = fQName.a;
					var typeModuleName = fQName.b;
					var typeArgs = tpe.c;
					return A2(
						$elm$core$Result$andThen,
						function (typeSpec) {
							switch (typeSpec.$) {
								case 'TypeAliasSpecification':
									var typeArgNames = typeSpec.a;
									var typeExp = typeSpec.b;
									var argVariables = $elm$core$Dict$fromList(
										A3($elm$core$List$map2, $elm$core$Tuple$pair, typeArgNames, typeArgs));
									return A2(
										$author$project$Morphir$IR$Type$DataCodec$decodeData,
										ir,
										A2($author$project$Morphir$IR$Type$substituteTypeVariables, argVariables, typeExp));
								case 'OpaqueTypeSpecification':
									return $elm$core$Result$Err(
										$elm$core$String$concat(
											_List_fromArray(
												[
													'Cannot serialize opaque type: ',
													$author$project$Morphir$IR$FQName$toString(fQName)
												])));
								default:
									var typeArgNames = typeSpec.a;
									var constructors = typeSpec.b;
									var argVariables = $elm$core$Dict$fromList(
										A3($elm$core$List$map2, $elm$core$Tuple$pair, typeArgNames, typeArgs));
									return $elm$core$Result$Ok(
										A2(
											$elm$json$Json$Decode$andThen,
											function (tag) {
												var constructorLocalName = $author$project$Morphir$IR$Name$fromString(tag);
												var decoderResult = A2(
													$elm$core$Result$andThen,
													function (constructorArgTypes) {
														return A3(
															$elm$core$List$foldl,
															F2(
																function (_v37, _v38) {
																	var argType = _v37.b;
																	var index = _v38.a;
																	var resultSoFar = _v38.b;
																	return _Utils_Tuple2(
																		index + 1,
																		A2(
																			$elm$core$Result$andThen,
																			function (decoderSoFar) {
																				return A2(
																					$elm$core$Result$map,
																					function (argDecoder) {
																						return A2(
																							$elm$json$Json$Decode$andThen,
																							function (constructorSoFar) {
																								return A2(
																									$elm$json$Json$Decode$map,
																									function (argValue) {
																										return A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, constructorSoFar, argValue);
																									},
																									A2($elm$json$Json$Decode$index, index, argDecoder));
																							},
																							decoderSoFar);
																					},
																					A2(
																						$author$project$Morphir$IR$Type$DataCodec$decodeData,
																						ir,
																						A2($author$project$Morphir$IR$Type$substituteTypeVariables, argVariables, argType)));
																			},
																			resultSoFar));
																}),
															_Utils_Tuple2(
																1,
																$elm$core$Result$Ok(
																	$elm$json$Json$Decode$succeed(
																		A2(
																			$author$project$Morphir$IR$Value$Constructor,
																			_Utils_Tuple0,
																			_Utils_Tuple3(typePackageName, typeModuleName, constructorLocalName))))),
															constructorArgTypes).b;
													},
													A2(
														$elm$core$Result$fromMaybe,
														$elm$core$String$concat(
															_List_fromArray(
																[
																	'Constructor \'',
																	$author$project$Morphir$IR$Name$toTitleCase(constructorLocalName),
																	'\' in type \'',
																	$author$project$Morphir$IR$FQName$toString(fQName),
																	'\' not found.'
																])),
														A2($elm$core$Dict$get, constructorLocalName, constructors)));
												if (decoderResult.$ === 'Ok') {
													var d = decoderResult.a;
													return d;
												} else {
													var error = decoderResult.a;
													return $elm$json$Json$Decode$fail(error);
												}
											},
											A2($elm$json$Json$Decode$index, 0, $elm$json$Json$Decode$string)));
							}
						},
						A2(
							$elm$core$Result$fromMaybe,
							$elm$core$String$concat(
								_List_fromArray(
									[
										'Cannot find reference: ',
										$author$project$Morphir$IR$FQName$toString(fQName)
									])),
							A2($author$project$Morphir$IR$lookupTypeSpecification, fQName, ir)));
				}
			case 'Record':
				var fields = tpe.b;
				return A2(
					$elm$core$Result$map,
					function (decoder) {
						return A2(
							$elm$json$Json$Decode$map,
							$author$project$Morphir$IR$Value$Record(_Utils_Tuple0),
							decoder);
					},
					A3(
						$elm$core$List$foldr,
						F2(
							function (field, resultSoFar) {
								return A2(
									$elm$core$Result$andThen,
									function (decoderSoFar) {
										return A2(
											$elm$core$Result$map,
											function (fieldDecoder) {
												return A2(
													$elm$json$Json$Decode$andThen,
													function (fieldValuesSoFar) {
														return A2(
															$elm$json$Json$Decode$map,
															function (fieldValue) {
																return A2(
																	$elm$core$List$cons,
																	_Utils_Tuple2(field.name, fieldValue),
																	fieldValuesSoFar);
															},
															A2(
																$elm$json$Json$Decode$field,
																$author$project$Morphir$IR$Name$toCamelCase(field.name),
																fieldDecoder));
													},
													decoderSoFar);
											},
											A2($author$project$Morphir$IR$Type$DataCodec$decodeData, ir, field.tpe));
									},
									resultSoFar);
							}),
						$elm$core$Result$Ok(
							$elm$json$Json$Decode$succeed(_List_Nil)),
						fields));
			case 'Tuple':
				var elemTypes = tpe.b;
				return A2(
					$elm$core$Result$map,
					$elm$json$Json$Decode$map(
						$author$project$Morphir$IR$Value$Tuple(_Utils_Tuple0)),
					A3(
						$elm$core$List$foldr,
						F2(
							function (elemType, _v39) {
								var index = _v39.a;
								var resultSoFar = _v39.b;
								return _Utils_Tuple2(
									index - 1,
									A2(
										$elm$core$Result$andThen,
										function (decoderSoFar) {
											return A2(
												$elm$core$Result$map,
												function (fieldDecoder) {
													return A2(
														$elm$json$Json$Decode$andThen,
														function (fieldValuesSoFar) {
															return A2(
																$elm$json$Json$Decode$map,
																function (fieldValue) {
																	return A2($elm$core$List$cons, fieldValue, fieldValuesSoFar);
																},
																A2($elm$json$Json$Decode$index, index, fieldDecoder));
														},
														decoderSoFar);
												},
												A2($author$project$Morphir$IR$Type$DataCodec$decodeData, ir, elemType));
										},
										resultSoFar));
							}),
						_Utils_Tuple2(
							$elm$core$List$length(elemTypes) - 1,
							$elm$core$Result$Ok(
								$elm$json$Json$Decode$succeed(_List_Nil))),
						elemTypes).b);
			default:
				return $elm$core$Result$Err('Cannot Decode this type');
		}
	});
var $author$project$Morphir$IR$empty = {typeConstructors: $elm$core$Dict$empty, typeSpecifications: $elm$core$Dict$empty, valueDefinitions: $elm$core$Dict$empty, valueSpecifications: $elm$core$Dict$empty};
var $elm$core$List$append = F2(
	function (xs, ys) {
		if (!ys.b) {
			return xs;
		} else {
			return A3($elm$core$List$foldr, $elm$core$List$cons, ys, xs);
		}
	});
var $elm$core$List$concat = function (lists) {
	return A3($elm$core$List$foldr, $elm$core$List$append, _List_Nil, lists);
};
var $elm$core$List$concatMap = F2(
	function (f, list) {
		return $elm$core$List$concat(
			A2($elm$core$List$map, f, list));
	});
var $author$project$Morphir$IR$AccessControlled$withPublicAccess = function (ac) {
	var _v0 = ac.access;
	if (_v0.$ === 'Public') {
		return $elm$core$Maybe$Just(ac.value);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Morphir$IR$Type$definitionToSpecification = function (def) {
	if (def.$ === 'TypeAliasDefinition') {
		var params = def.a;
		var exp = def.b;
		return A2($author$project$Morphir$IR$Type$TypeAliasSpecification, params, exp);
	} else {
		var params = def.a;
		var accessControlledCtors = def.b;
		var _v1 = $author$project$Morphir$IR$AccessControlled$withPublicAccess(accessControlledCtors);
		if (_v1.$ === 'Just') {
			var ctors = _v1.a;
			return A2($author$project$Morphir$IR$Type$CustomTypeSpecification, params, ctors);
		} else {
			return $author$project$Morphir$IR$Type$OpaqueTypeSpecification(params);
		}
	}
};
var $author$project$Morphir$IR$Value$definitionToSpecification = function (def) {
	return {
		inputs: A2(
			$elm$core$List$map,
			function (_v0) {
				var name = _v0.a;
				var tpe = _v0.c;
				return _Utils_Tuple2(name, tpe);
			},
			def.inputTypes),
		output: def.outputType
	};
};
var $author$project$Morphir$IR$Documented$map = F2(
	function (f, d) {
		return A2(
			$author$project$Morphir$IR$Documented$Documented,
			d.doc,
			f(d.value));
	});
var $author$project$Morphir$IR$AccessControlled$withPrivateAccess = function (ac) {
	var _v0 = ac.access;
	if (_v0.$ === 'Public') {
		return ac.value;
	} else {
		return ac.value;
	}
};
var $author$project$Morphir$IR$Module$definitionToSpecificationWithPrivate = function (def) {
	return {
		types: $elm$core$Dict$fromList(
			A2(
				$elm$core$List$map,
				function (_v0) {
					var path = _v0.a;
					var accessControlledType = _v0.b;
					return _Utils_Tuple2(
						path,
						A2(
							$author$project$Morphir$IR$Documented$map,
							$author$project$Morphir$IR$Type$definitionToSpecification,
							$author$project$Morphir$IR$AccessControlled$withPrivateAccess(accessControlledType)));
				},
				$elm$core$Dict$toList(def.types))),
		values: $elm$core$Dict$fromList(
			A2(
				$elm$core$List$map,
				function (_v1) {
					var path = _v1.a;
					var accessControlledValue = _v1.b;
					return _Utils_Tuple2(
						path,
						$author$project$Morphir$IR$Value$definitionToSpecification(
							$author$project$Morphir$IR$AccessControlled$withPrivateAccess(accessControlledValue)));
				},
				$elm$core$Dict$toList(def.values)))
	};
};
var $author$project$Morphir$IR$Package$definitionToSpecificationWithPrivate = function (def) {
	return {
		modules: $elm$core$Dict$fromList(
			A2(
				$elm$core$List$map,
				function (_v0) {
					var path = _v0.a;
					var accessControlledModule = _v0.b;
					return _Utils_Tuple2(
						path,
						$author$project$Morphir$IR$Module$definitionToSpecificationWithPrivate(
							$author$project$Morphir$IR$AccessControlled$withPrivateAccess(accessControlledModule)));
				},
				$elm$core$Dict$toList(def.modules)))
	};
};
var $author$project$Morphir$IR$flattenPackages = F2(
	function (packages, f) {
		return $elm$core$Dict$fromList(
			A2(
				$elm$core$List$concatMap,
				function (_v0) {
					var packageName = _v0.a;
					var _package = _v0.b;
					return A2(f, packageName, _package);
				},
				$elm$core$Dict$toList(packages)));
	});
var $author$project$Morphir$IR$fromPackageSpecifications = function (packageSpecs) {
	var packageValueSpecifications = F2(
		function (packageName, packageSpec) {
			return A2(
				$elm$core$List$concatMap,
				function (_v6) {
					var moduleName = _v6.a;
					var moduleSpec = _v6.b;
					return A2(
						$elm$core$List$map,
						function (_v7) {
							var valueName = _v7.a;
							var valueSpec = _v7.b;
							return _Utils_Tuple2(
								_Utils_Tuple3(packageName, moduleName, valueName),
								valueSpec);
						},
						$elm$core$Dict$toList(moduleSpec.values));
				},
				$elm$core$Dict$toList(packageSpec.modules));
		});
	var packageTypeSpecifications = F2(
		function (packageName, packageSpec) {
			return A2(
				$elm$core$List$concatMap,
				function (_v4) {
					var moduleName = _v4.a;
					var moduleSpec = _v4.b;
					return A2(
						$elm$core$List$map,
						function (_v5) {
							var typeName = _v5.a;
							var typeSpec = _v5.b;
							return _Utils_Tuple2(
								_Utils_Tuple3(packageName, moduleName, typeName),
								typeSpec.value);
						},
						$elm$core$Dict$toList(moduleSpec.types));
				},
				$elm$core$Dict$toList(packageSpec.modules));
		});
	var packageTypeConstructors = F2(
		function (packageName, packageSpec) {
			return A2(
				$elm$core$List$concatMap,
				function (_v0) {
					var moduleName = _v0.a;
					var moduleSpec = _v0.b;
					return A2(
						$elm$core$List$concatMap,
						function (_v1) {
							var typeName = _v1.a;
							var typeSpec = _v1.b;
							var _v2 = typeSpec.value;
							if (_v2.$ === 'CustomTypeSpecification') {
								var params = _v2.a;
								var constructors = _v2.b;
								return A2(
									$elm$core$List$map,
									function (_v3) {
										var ctorName = _v3.a;
										var ctorArgs = _v3.b;
										return _Utils_Tuple2(
											_Utils_Tuple3(packageName, moduleName, ctorName),
											_Utils_Tuple3(
												_Utils_Tuple3(packageName, moduleName, typeName),
												params,
												ctorArgs));
									},
									$elm$core$Dict$toList(constructors));
							} else {
								return _List_Nil;
							}
						},
						$elm$core$Dict$toList(moduleSpec.types));
				},
				$elm$core$Dict$toList(packageSpec.modules));
		});
	return {
		typeConstructors: A2($author$project$Morphir$IR$flattenPackages, packageSpecs, packageTypeConstructors),
		typeSpecifications: A2($author$project$Morphir$IR$flattenPackages, packageSpecs, packageTypeSpecifications),
		valueDefinitions: $elm$core$Dict$empty,
		valueSpecifications: A2($author$project$Morphir$IR$flattenPackages, packageSpecs, packageValueSpecifications)
	};
};
var $author$project$Morphir$IR$fromDistribution = function (_v0) {
	var libraryName = _v0.a;
	var dependencies = _v0.b;
	var packageDef = _v0.c;
	var packageValueDefinitions = $elm$core$Dict$fromList(
		A2(
			$elm$core$List$concatMap,
			function (_v1) {
				var moduleName = _v1.a;
				var moduleDef = _v1.b;
				return A2(
					$elm$core$List$map,
					function (_v2) {
						var valueName = _v2.a;
						var valueDef = _v2.b;
						return _Utils_Tuple2(
							_Utils_Tuple3(libraryName, moduleName, valueName),
							valueDef.value);
					},
					$elm$core$Dict$toList(moduleDef.value.values));
			},
			$elm$core$Dict$toList(packageDef.modules)));
	var packageSpecs = A3(
		$elm$core$Dict$insert,
		libraryName,
		$author$project$Morphir$IR$Package$definitionToSpecificationWithPrivate(packageDef),
		dependencies);
	var specificationsOnly = $author$project$Morphir$IR$fromPackageSpecifications(packageSpecs);
	return _Utils_update(
		specificationsOnly,
		{valueDefinitions: packageValueDefinitions});
};
var $author$project$Morphir$IR$QName$fromString = function (qNameString) {
	var _v0 = A2($elm$core$String$split, ':', qNameString);
	if ((_v0.b && _v0.b.b) && (!_v0.b.b.b)) {
		var packageNameString = _v0.a;
		var _v1 = _v0.b;
		var localNameString = _v1.a;
		return $elm$core$Maybe$Just(
			A2(
				$author$project$Morphir$IR$QName$QName,
				$author$project$Morphir$IR$Path$fromString(packageNameString),
				$author$project$Morphir$IR$Name$fromString(localNameString)));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Maybe$map = F2(
	function (f, maybe) {
		if (maybe.$ === 'Just') {
			var value = maybe.a;
			return $elm$core$Maybe$Just(
				f(value));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	});
var $author$project$Morphir$IR$Package$lookupModuleDefinition = F2(
	function (modulePath, packageDef) {
		return A2(
			$elm$core$Maybe$map,
			$author$project$Morphir$IR$AccessControlled$withPrivateAccess,
			A2($elm$core$Dict$get, modulePath, packageDef.modules));
	});
var $author$project$Morphir$IR$Module$lookupValueDefinition = F2(
	function (localName, moduleDef) {
		return A2(
			$elm$core$Maybe$map,
			$author$project$Morphir$IR$AccessControlled$withPrivateAccess,
			A2($elm$core$Dict$get, localName, moduleDef.values));
	});
var $author$project$Morphir$IR$Distribution$lookupValueDefinition = F2(
	function (_v0, distribution) {
		var moduleName = _v0.a;
		var localName = _v0.b;
		var packageDef = distribution.c;
		return A2(
			$elm$core$Maybe$andThen,
			$author$project$Morphir$IR$Module$lookupValueDefinition(localName),
			A2($author$project$Morphir$IR$Package$lookupModuleDefinition, moduleName, packageDef));
	});
var $elm$core$Result$mapError = F2(
	function (f, result) {
		if (result.$ === 'Ok') {
			var v = result.a;
			return $elm$core$Result$Ok(v);
		} else {
			var e = result.a;
			return $elm$core$Result$Err(
				f(e));
		}
	});
var $elm$core$Dict$member = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$get, key, dict);
		if (_v0.$ === 'Just') {
			return true;
		} else {
			return false;
		}
	});
var $elm$core$Dict$getMin = function (dict) {
	getMin:
	while (true) {
		if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
			var left = dict.d;
			var $temp$dict = left;
			dict = $temp$dict;
			continue getMin;
		} else {
			return dict;
		}
	}
};
var $elm$core$Dict$moveRedLeft = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.e.d.$ === 'RBNode_elm_builtin') && (dict.e.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var lLeft = _v1.d;
			var lRight = _v1.e;
			var _v2 = dict.e;
			var rClr = _v2.a;
			var rK = _v2.b;
			var rV = _v2.c;
			var rLeft = _v2.d;
			var _v3 = rLeft.a;
			var rlK = rLeft.b;
			var rlV = rLeft.c;
			var rlL = rLeft.d;
			var rlR = rLeft.e;
			var rRight = _v2.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				rlK,
				rlV,
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					rlL),
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, rK, rV, rlR, rRight));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v4 = dict.d;
			var lClr = _v4.a;
			var lK = _v4.b;
			var lV = _v4.c;
			var lLeft = _v4.d;
			var lRight = _v4.e;
			var _v5 = dict.e;
			var rClr = _v5.a;
			var rK = _v5.b;
			var rV = _v5.c;
			var rLeft = _v5.d;
			var rRight = _v5.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$moveRedRight = function (dict) {
	if (((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) && (dict.e.$ === 'RBNode_elm_builtin')) {
		if ((dict.d.d.$ === 'RBNode_elm_builtin') && (dict.d.d.a.$ === 'Red')) {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v1 = dict.d;
			var lClr = _v1.a;
			var lK = _v1.b;
			var lV = _v1.c;
			var _v2 = _v1.d;
			var _v3 = _v2.a;
			var llK = _v2.b;
			var llV = _v2.c;
			var llLeft = _v2.d;
			var llRight = _v2.e;
			var lRight = _v1.e;
			var _v4 = dict.e;
			var rClr = _v4.a;
			var rK = _v4.b;
			var rV = _v4.c;
			var rLeft = _v4.d;
			var rRight = _v4.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				$elm$core$Dict$Red,
				lK,
				lV,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, llK, llV, llLeft, llRight),
				A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					lRight,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight)));
		} else {
			var clr = dict.a;
			var k = dict.b;
			var v = dict.c;
			var _v5 = dict.d;
			var lClr = _v5.a;
			var lK = _v5.b;
			var lV = _v5.c;
			var lLeft = _v5.d;
			var lRight = _v5.e;
			var _v6 = dict.e;
			var rClr = _v6.a;
			var rK = _v6.b;
			var rV = _v6.c;
			var rLeft = _v6.d;
			var rRight = _v6.e;
			if (clr.$ === 'Black') {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			} else {
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					$elm$core$Dict$Black,
					k,
					v,
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, lK, lV, lLeft, lRight),
					A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, rK, rV, rLeft, rRight));
			}
		}
	} else {
		return dict;
	}
};
var $elm$core$Dict$removeHelpPrepEQGT = F7(
	function (targetKey, dict, color, key, value, left, right) {
		if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Red')) {
			var _v1 = left.a;
			var lK = left.b;
			var lV = left.c;
			var lLeft = left.d;
			var lRight = left.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				lK,
				lV,
				lLeft,
				A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Red, key, value, lRight, right));
		} else {
			_v2$2:
			while (true) {
				if ((right.$ === 'RBNode_elm_builtin') && (right.a.$ === 'Black')) {
					if (right.d.$ === 'RBNode_elm_builtin') {
						if (right.d.a.$ === 'Black') {
							var _v3 = right.a;
							var _v4 = right.d;
							var _v5 = _v4.a;
							return $elm$core$Dict$moveRedRight(dict);
						} else {
							break _v2$2;
						}
					} else {
						var _v6 = right.a;
						var _v7 = right.d;
						return $elm$core$Dict$moveRedRight(dict);
					}
				} else {
					break _v2$2;
				}
			}
			return dict;
		}
	});
var $elm$core$Dict$removeMin = function (dict) {
	if ((dict.$ === 'RBNode_elm_builtin') && (dict.d.$ === 'RBNode_elm_builtin')) {
		var color = dict.a;
		var key = dict.b;
		var value = dict.c;
		var left = dict.d;
		var lColor = left.a;
		var lLeft = left.d;
		var right = dict.e;
		if (lColor.$ === 'Black') {
			if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
				var _v3 = lLeft.a;
				return A5(
					$elm$core$Dict$RBNode_elm_builtin,
					color,
					key,
					value,
					$elm$core$Dict$removeMin(left),
					right);
			} else {
				var _v4 = $elm$core$Dict$moveRedLeft(dict);
				if (_v4.$ === 'RBNode_elm_builtin') {
					var nColor = _v4.a;
					var nKey = _v4.b;
					var nValue = _v4.c;
					var nLeft = _v4.d;
					var nRight = _v4.e;
					return A5(
						$elm$core$Dict$balance,
						nColor,
						nKey,
						nValue,
						$elm$core$Dict$removeMin(nLeft),
						nRight);
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			}
		} else {
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				value,
				$elm$core$Dict$removeMin(left),
				right);
		}
	} else {
		return $elm$core$Dict$RBEmpty_elm_builtin;
	}
};
var $elm$core$Dict$removeHelp = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_cmp(targetKey, key) < 0) {
				if ((left.$ === 'RBNode_elm_builtin') && (left.a.$ === 'Black')) {
					var _v4 = left.a;
					var lLeft = left.d;
					if ((lLeft.$ === 'RBNode_elm_builtin') && (lLeft.a.$ === 'Red')) {
						var _v6 = lLeft.a;
						return A5(
							$elm$core$Dict$RBNode_elm_builtin,
							color,
							key,
							value,
							A2($elm$core$Dict$removeHelp, targetKey, left),
							right);
					} else {
						var _v7 = $elm$core$Dict$moveRedLeft(dict);
						if (_v7.$ === 'RBNode_elm_builtin') {
							var nColor = _v7.a;
							var nKey = _v7.b;
							var nValue = _v7.c;
							var nLeft = _v7.d;
							var nRight = _v7.e;
							return A5(
								$elm$core$Dict$balance,
								nColor,
								nKey,
								nValue,
								A2($elm$core$Dict$removeHelp, targetKey, nLeft),
								nRight);
						} else {
							return $elm$core$Dict$RBEmpty_elm_builtin;
						}
					}
				} else {
					return A5(
						$elm$core$Dict$RBNode_elm_builtin,
						color,
						key,
						value,
						A2($elm$core$Dict$removeHelp, targetKey, left),
						right);
				}
			} else {
				return A2(
					$elm$core$Dict$removeHelpEQGT,
					targetKey,
					A7($elm$core$Dict$removeHelpPrepEQGT, targetKey, dict, color, key, value, left, right));
			}
		}
	});
var $elm$core$Dict$removeHelpEQGT = F2(
	function (targetKey, dict) {
		if (dict.$ === 'RBNode_elm_builtin') {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			if (_Utils_eq(targetKey, key)) {
				var _v1 = $elm$core$Dict$getMin(right);
				if (_v1.$ === 'RBNode_elm_builtin') {
					var minKey = _v1.b;
					var minValue = _v1.c;
					return A5(
						$elm$core$Dict$balance,
						color,
						minKey,
						minValue,
						left,
						$elm$core$Dict$removeMin(right));
				} else {
					return $elm$core$Dict$RBEmpty_elm_builtin;
				}
			} else {
				return A5(
					$elm$core$Dict$balance,
					color,
					key,
					value,
					left,
					A2($elm$core$Dict$removeHelp, targetKey, right));
			}
		} else {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		}
	});
var $elm$core$Dict$remove = F2(
	function (key, dict) {
		var _v0 = A2($elm$core$Dict$removeHelp, key, dict);
		if ((_v0.$ === 'RBNode_elm_builtin') && (_v0.a.$ === 'Red')) {
			var _v1 = _v0.a;
			var k = _v0.b;
			var v = _v0.c;
			var l = _v0.d;
			var r = _v0.e;
			return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, k, v, l, r);
		} else {
			var x = _v0;
			return x;
		}
	});
var $author$project$Morphir$Web$Insight$update = F2(
	function (msg, model) {
		var getDistribution = function () {
			var _v12 = model.modelState;
			switch (_v12.$) {
				case 'IRLoaded':
					var distribution = _v12.a;
					return $elm$core$Maybe$Just(distribution);
				case 'FunctionsSet':
					var visualizationState = _v12.a;
					return $elm$core$Maybe$Just(visualizationState.distribution);
				default:
					return $elm$core$Maybe$Nothing;
			}
		}();
		switch (msg.$) {
			case 'FunctionNameReceived':
				var qNameString = msg.a;
				var popupScreen = {variableIndex: 0, variableValue: $elm$core$Maybe$Nothing};
				var _v1 = $author$project$Morphir$IR$QName$fromString(qNameString);
				if (_v1.$ === 'Just') {
					var qName = _v1.a;
					return A2(
						$elm$core$Maybe$withDefault,
						_Utils_Tuple2(
							_Utils_update(
								model,
								{
									modelState: $author$project$Morphir$Web$Insight$Failed('Invalid State in receiving function name')
								}),
							$elm$core$Platform$Cmd$none),
						A2(
							$elm$core$Maybe$map,
							function (m) {
								return _Utils_Tuple2(m, $elm$core$Platform$Cmd$none);
							},
							A2(
								$elm$core$Maybe$andThen,
								function (distribution) {
									return A2(
										$elm$core$Maybe$map,
										function (funDef) {
											return _Utils_update(
												model,
												{
													modelState: $author$project$Morphir$Web$Insight$FunctionsSet(
														{distribution: distribution, expandedFunctions: $elm$core$Dict$empty, functionArguments: _List_Nil, functionDefinition: funDef, popupVariables: popupScreen, selectedFunction: qName})
												});
										},
										A2($author$project$Morphir$IR$Distribution$lookupValueDefinition, qName, distribution));
								},
								getDistribution)));
				} else {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								modelState: $author$project$Morphir$Web$Insight$Failed('Received function name is not found')
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 'FunctionArgumentsReceived':
				var jsonList = msg.a;
				var getTypes = function () {
					var _v6 = model.modelState;
					if (_v6.$ === 'FunctionsSet') {
						var visualizationState = _v6.a;
						return A2(
							$author$project$Morphir$IR$Type$Tuple,
							_Utils_Tuple0,
							A2(
								$elm$core$List$map,
								function (_v7) {
									var name = _v7.a;
									var tpe = _v7.c;
									return tpe;
								},
								visualizationState.functionDefinition.inputTypes));
					} else {
						return $author$project$Morphir$IR$Type$Unit(_Utils_Tuple0);
					}
				}();
				var getIR = function () {
					if (getDistribution.$ === 'Just') {
						var distribution = getDistribution.a;
						return $author$project$Morphir$IR$fromDistribution(distribution);
					} else {
						return $author$project$Morphir$IR$empty;
					}
				}();
				var jsonDecoder = A2($author$project$Morphir$IR$Type$DataCodec$decodeData, getIR, getTypes);
				var _v2 = A2(
					$elm$core$Result$andThen,
					function (decoder) {
						return A2(
							$elm$core$Result$mapError,
							$elm$json$Json$Decode$errorToString,
							A2($elm$json$Json$Decode$decodeValue, decoder, jsonList));
					},
					jsonDecoder);
				if (_v2.$ === 'Ok') {
					var tupleList = _v2.a;
					var updatedArgValues = function () {
						if (tupleList.$ === 'Tuple') {
							var list = tupleList.b;
							return list;
						} else {
							return _List_Nil;
						}
					}();
					var _v3 = model.modelState;
					if (_v3.$ === 'FunctionsSet') {
						var visualizationState = _v3.a;
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									modelState: $author$project$Morphir$Web$Insight$FunctionsSet(
										_Utils_update(
											visualizationState,
											{functionArguments: updatedArgValues}))
								}),
							$elm$core$Platform$Cmd$none);
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									modelState: $author$project$Morphir$Web$Insight$Failed('Invalid State')
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								modelState: $author$project$Morphir$Web$Insight$Failed('Received function arguments cannot be decoded')
							}),
						$elm$core$Platform$Cmd$none);
				}
			case 'ExpandReference':
				var fqName = msg.a;
				var packageName = fqName.a;
				var moduleName = fqName.b;
				var localName = fqName.c;
				var isFunctionPresent = msg.b;
				var _v8 = model.modelState;
				if (_v8.$ === 'FunctionsSet') {
					var visualizationState = _v8.a;
					if (A2($elm$core$Dict$member, fqName, visualizationState.expandedFunctions)) {
						if (isFunctionPresent) {
							return _Utils_Tuple2(
								_Utils_update(
									model,
									{
										modelState: $author$project$Morphir$Web$Insight$FunctionsSet(
											_Utils_update(
												visualizationState,
												{
													expandedFunctions: A2($elm$core$Dict$remove, fqName, visualizationState.expandedFunctions)
												}))
									}),
								$elm$core$Platform$Cmd$none);
						} else {
							return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
						}
					} else {
						return _Utils_Tuple2(
							_Utils_update(
								model,
								{
									modelState: $author$project$Morphir$Web$Insight$FunctionsSet(
										_Utils_update(
											visualizationState,
											{
												expandedFunctions: A2(
													$elm$core$Maybe$withDefault,
													visualizationState.expandedFunctions,
													A2(
														$elm$core$Maybe$map,
														function (valueDef) {
															return A3($elm$core$Dict$insert, fqName, valueDef, visualizationState.expandedFunctions);
														},
														A2(
															$author$project$Morphir$IR$Distribution$lookupValueDefinition,
															A2($author$project$Morphir$IR$QName$QName, moduleName, localName),
															visualizationState.distribution)))
											}))
								}),
							$elm$core$Platform$Cmd$none);
					}
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			case 'ExpandVariable':
				var varIndex = msg.a;
				var maybeRawValue = msg.b;
				var _v10 = model.modelState;
				if (_v10.$ === 'FunctionsSet') {
					var visualizationState = _v10.a;
					var popupScreen = {variableIndex: varIndex, variableValue: maybeRawValue};
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								modelState: $author$project$Morphir$Web$Insight$FunctionsSet(
									_Utils_update(
										visualizationState,
										{popupVariables: popupScreen}))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
			default:
				var varIndex = msg.a;
				var _v11 = model.modelState;
				if (_v11.$ === 'FunctionsSet') {
					var visualizationState = _v11.a;
					var popupScreen = {variableIndex: varIndex, variableValue: $elm$core$Maybe$Nothing};
					return _Utils_Tuple2(
						_Utils_update(
							model,
							{
								modelState: $author$project$Morphir$Web$Insight$FunctionsSet(
									_Utils_update(
										visualizationState,
										{popupVariables: popupScreen}))
							}),
						$elm$core$Platform$Cmd$none);
				} else {
					return _Utils_Tuple2(model, $elm$core$Platform$Cmd$none);
				}
		}
	});
var $author$project$Morphir$Web$Insight$ExpandReference = F2(
	function (a, b) {
		return {$: 'ExpandReference', a: a, b: b};
	});
var $author$project$Morphir$Web$Insight$ExpandVariable = F2(
	function (a, b) {
		return {$: 'ExpandVariable', a: a, b: b};
	});
var $author$project$Morphir$Web$Insight$ShrinkVariable = function (a) {
	return {$: 'ShrinkVariable', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$Class = F2(
	function (a, b) {
		return {$: 'Class', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$classes = {above: 'a', active: 'atv', alignBottom: 'ab', alignCenterX: 'cx', alignCenterY: 'cy', alignContainerBottom: 'acb', alignContainerCenterX: 'accx', alignContainerCenterY: 'accy', alignContainerRight: 'acr', alignLeft: 'al', alignRight: 'ar', alignTop: 'at', alignedHorizontally: 'ah', alignedVertically: 'av', any: 's', behind: 'bh', below: 'b', bold: 'w7', borderDashed: 'bd', borderDotted: 'bdt', borderNone: 'bn', borderSolid: 'bs', capturePointerEvents: 'cpe', clip: 'cp', clipX: 'cpx', clipY: 'cpy', column: 'c', container: 'ctr', contentBottom: 'cb', contentCenterX: 'ccx', contentCenterY: 'ccy', contentLeft: 'cl', contentRight: 'cr', contentTop: 'ct', cursorPointer: 'cptr', cursorText: 'ctxt', focus: 'fcs', focusedWithin: 'focus-within', fullSize: 'fs', grid: 'g', hasBehind: 'hbh', heightContent: 'hc', heightExact: 'he', heightFill: 'hf', heightFillPortion: 'hfp', hover: 'hv', imageContainer: 'ic', inFront: 'fr', inputLabel: 'lbl', inputMultiline: 'iml', inputMultilineFiller: 'imlf', inputMultilineParent: 'imlp', inputMultilineWrapper: 'implw', inputText: 'it', italic: 'i', link: 'lnk', nearby: 'nb', noTextSelection: 'notxt', onLeft: 'ol', onRight: 'or', opaque: 'oq', overflowHidden: 'oh', page: 'pg', paragraph: 'p', passPointerEvents: 'ppe', root: 'ui', row: 'r', scrollbars: 'sb', scrollbarsX: 'sbx', scrollbarsY: 'sby', seButton: 'sbt', single: 'e', sizeByCapital: 'cap', spaceEvenly: 'sev', strike: 'sk', text: 't', textCenter: 'tc', textExtraBold: 'w8', textExtraLight: 'w2', textHeavy: 'w9', textJustify: 'tj', textJustifyAll: 'tja', textLeft: 'tl', textLight: 'w3', textMedium: 'w5', textNormalWeight: 'w4', textRight: 'tr', textSemiBold: 'w6', textThin: 'w1', textUnitalicized: 'tun', transition: 'ts', transparent: 'clr', underline: 'u', widthContent: 'wc', widthExact: 'we', widthFill: 'wf', widthFillPortion: 'wfp', wrapped: 'wrp'};
var $mdgriffith$elm_ui$Internal$Flag$Flag = function (a) {
	return {$: 'Flag', a: a};
};
var $mdgriffith$elm_ui$Internal$Flag$Second = function (a) {
	return {$: 'Second', a: a};
};
var $elm$core$Bitwise$shiftLeftBy = _Bitwise_shiftLeftBy;
var $mdgriffith$elm_ui$Internal$Flag$flag = function (i) {
	return (i > 31) ? $mdgriffith$elm_ui$Internal$Flag$Second(1 << (i - 32)) : $mdgriffith$elm_ui$Internal$Flag$Flag(1 << i);
};
var $mdgriffith$elm_ui$Internal$Flag$fontWeight = $mdgriffith$elm_ui$Internal$Flag$flag(13);
var $mdgriffith$elm_ui$Element$Font$bold = A2($mdgriffith$elm_ui$Internal$Model$Class, $mdgriffith$elm_ui$Internal$Flag$fontWeight, $mdgriffith$elm_ui$Internal$Style$classes.bold);
var $elm$html$Html$div = _VirtualDom_node('div');
var $mdgriffith$elm_ui$Internal$Model$Attr = function (a) {
	return {$: 'Attr', a: a};
};
var $elm$json$Json$Encode$string = _Json_wrap;
var $elm$html$Html$Attributes$stringProperty = F2(
	function (key, string) {
		return A2(
			_VirtualDom_property,
			key,
			$elm$json$Json$Encode$string(string));
	});
var $elm$html$Html$Attributes$class = $elm$html$Html$Attributes$stringProperty('className');
var $mdgriffith$elm_ui$Internal$Model$htmlClass = function (cls) {
	return $mdgriffith$elm_ui$Internal$Model$Attr(
		$elm$html$Html$Attributes$class(cls));
};
var $mdgriffith$elm_ui$Internal$Model$OnlyDynamic = F2(
	function (a, b) {
		return {$: 'OnlyDynamic', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$StaticRootAndDynamic = F2(
	function (a, b) {
		return {$: 'StaticRootAndDynamic', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$Unkeyed = function (a) {
	return {$: 'Unkeyed', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$AsEl = {$: 'AsEl'};
var $mdgriffith$elm_ui$Internal$Model$asEl = $mdgriffith$elm_ui$Internal$Model$AsEl;
var $mdgriffith$elm_ui$Internal$Model$Generic = {$: 'Generic'};
var $mdgriffith$elm_ui$Internal$Model$div = $mdgriffith$elm_ui$Internal$Model$Generic;
var $mdgriffith$elm_ui$Internal$Model$NoNearbyChildren = {$: 'NoNearbyChildren'};
var $mdgriffith$elm_ui$Internal$Model$columnClass = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.column);
var $mdgriffith$elm_ui$Internal$Model$gridClass = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.grid);
var $mdgriffith$elm_ui$Internal$Model$pageClass = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.page);
var $mdgriffith$elm_ui$Internal$Model$paragraphClass = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.paragraph);
var $mdgriffith$elm_ui$Internal$Model$rowClass = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.row);
var $mdgriffith$elm_ui$Internal$Model$singleClass = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.single);
var $mdgriffith$elm_ui$Internal$Model$contextClasses = function (context) {
	switch (context.$) {
		case 'AsRow':
			return $mdgriffith$elm_ui$Internal$Model$rowClass;
		case 'AsColumn':
			return $mdgriffith$elm_ui$Internal$Model$columnClass;
		case 'AsEl':
			return $mdgriffith$elm_ui$Internal$Model$singleClass;
		case 'AsGrid':
			return $mdgriffith$elm_ui$Internal$Model$gridClass;
		case 'AsParagraph':
			return $mdgriffith$elm_ui$Internal$Model$paragraphClass;
		default:
			return $mdgriffith$elm_ui$Internal$Model$pageClass;
	}
};
var $mdgriffith$elm_ui$Internal$Model$Keyed = function (a) {
	return {$: 'Keyed', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$NoStyleSheet = {$: 'NoStyleSheet'};
var $mdgriffith$elm_ui$Internal$Model$Styled = function (a) {
	return {$: 'Styled', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$Unstyled = function (a) {
	return {$: 'Unstyled', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$addChildren = F2(
	function (existing, nearbyChildren) {
		switch (nearbyChildren.$) {
			case 'NoNearbyChildren':
				return existing;
			case 'ChildrenBehind':
				var behind = nearbyChildren.a;
				return _Utils_ap(behind, existing);
			case 'ChildrenInFront':
				var inFront = nearbyChildren.a;
				return _Utils_ap(existing, inFront);
			default:
				var behind = nearbyChildren.a;
				var inFront = nearbyChildren.b;
				return _Utils_ap(
					behind,
					_Utils_ap(existing, inFront));
		}
	});
var $mdgriffith$elm_ui$Internal$Model$addKeyedChildren = F3(
	function (key, existing, nearbyChildren) {
		switch (nearbyChildren.$) {
			case 'NoNearbyChildren':
				return existing;
			case 'ChildrenBehind':
				var behind = nearbyChildren.a;
				return _Utils_ap(
					A2(
						$elm$core$List$map,
						function (x) {
							return _Utils_Tuple2(key, x);
						},
						behind),
					existing);
			case 'ChildrenInFront':
				var inFront = nearbyChildren.a;
				return _Utils_ap(
					existing,
					A2(
						$elm$core$List$map,
						function (x) {
							return _Utils_Tuple2(key, x);
						},
						inFront));
			default:
				var behind = nearbyChildren.a;
				var inFront = nearbyChildren.b;
				return _Utils_ap(
					A2(
						$elm$core$List$map,
						function (x) {
							return _Utils_Tuple2(key, x);
						},
						behind),
					_Utils_ap(
						existing,
						A2(
							$elm$core$List$map,
							function (x) {
								return _Utils_Tuple2(key, x);
							},
							inFront)));
		}
	});
var $mdgriffith$elm_ui$Internal$Model$AsParagraph = {$: 'AsParagraph'};
var $mdgriffith$elm_ui$Internal$Model$asParagraph = $mdgriffith$elm_ui$Internal$Model$AsParagraph;
var $mdgriffith$elm_ui$Internal$Flag$alignBottom = $mdgriffith$elm_ui$Internal$Flag$flag(41);
var $mdgriffith$elm_ui$Internal$Flag$alignRight = $mdgriffith$elm_ui$Internal$Flag$flag(40);
var $mdgriffith$elm_ui$Internal$Flag$centerX = $mdgriffith$elm_ui$Internal$Flag$flag(42);
var $mdgriffith$elm_ui$Internal$Flag$centerY = $mdgriffith$elm_ui$Internal$Flag$flag(43);
var $elm$core$Set$Set_elm_builtin = function (a) {
	return {$: 'Set_elm_builtin', a: a};
};
var $elm$core$Set$empty = $elm$core$Set$Set_elm_builtin($elm$core$Dict$empty);
var $mdgriffith$elm_ui$Internal$Model$lengthClassName = function (x) {
	switch (x.$) {
		case 'Px':
			var px = x.a;
			return $elm$core$String$fromInt(px) + 'px';
		case 'Content':
			return 'auto';
		case 'Fill':
			var i = x.a;
			return $elm$core$String$fromInt(i) + 'fr';
		case 'Min':
			var min = x.a;
			var len = x.b;
			return 'min' + ($elm$core$String$fromInt(min) + $mdgriffith$elm_ui$Internal$Model$lengthClassName(len));
		default:
			var max = x.a;
			var len = x.b;
			return 'max' + ($elm$core$String$fromInt(max) + $mdgriffith$elm_ui$Internal$Model$lengthClassName(len));
	}
};
var $elm$core$Basics$round = _Basics_round;
var $mdgriffith$elm_ui$Internal$Model$floatClass = function (x) {
	return $elm$core$String$fromInt(
		$elm$core$Basics$round(x * 255));
};
var $mdgriffith$elm_ui$Internal$Model$transformClass = function (transform) {
	switch (transform.$) {
		case 'Untransformed':
			return $elm$core$Maybe$Nothing;
		case 'Moved':
			var _v1 = transform.a;
			var x = _v1.a;
			var y = _v1.b;
			var z = _v1.c;
			return $elm$core$Maybe$Just(
				'mv-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(x) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(y) + ('-' + $mdgriffith$elm_ui$Internal$Model$floatClass(z))))));
		default:
			var _v2 = transform.a;
			var tx = _v2.a;
			var ty = _v2.b;
			var tz = _v2.c;
			var _v3 = transform.b;
			var sx = _v3.a;
			var sy = _v3.b;
			var sz = _v3.c;
			var _v4 = transform.c;
			var ox = _v4.a;
			var oy = _v4.b;
			var oz = _v4.c;
			var angle = transform.d;
			return $elm$core$Maybe$Just(
				'tfrm-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(tx) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(ty) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(tz) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(sx) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(sy) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(sz) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(ox) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(oy) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(oz) + ('-' + $mdgriffith$elm_ui$Internal$Model$floatClass(angle))))))))))))))))))));
	}
};
var $mdgriffith$elm_ui$Internal$Model$getStyleName = function (style) {
	switch (style.$) {
		case 'Shadows':
			var name = style.a;
			return name;
		case 'Transparency':
			var name = style.a;
			var o = style.b;
			return name;
		case 'Style':
			var _class = style.a;
			return _class;
		case 'FontFamily':
			var name = style.a;
			return name;
		case 'FontSize':
			var i = style.a;
			return 'font-size-' + $elm$core$String$fromInt(i);
		case 'Single':
			var _class = style.a;
			return _class;
		case 'Colored':
			var _class = style.a;
			return _class;
		case 'SpacingStyle':
			var cls = style.a;
			var x = style.b;
			var y = style.c;
			return cls;
		case 'PaddingStyle':
			var cls = style.a;
			var top = style.b;
			var right = style.c;
			var bottom = style.d;
			var left = style.e;
			return cls;
		case 'BorderWidth':
			var cls = style.a;
			var top = style.b;
			var right = style.c;
			var bottom = style.d;
			var left = style.e;
			return cls;
		case 'GridTemplateStyle':
			var template = style.a;
			return 'grid-rows-' + (A2(
				$elm$core$String$join,
				'-',
				A2($elm$core$List$map, $mdgriffith$elm_ui$Internal$Model$lengthClassName, template.rows)) + ('-cols-' + (A2(
				$elm$core$String$join,
				'-',
				A2($elm$core$List$map, $mdgriffith$elm_ui$Internal$Model$lengthClassName, template.columns)) + ('-space-x-' + ($mdgriffith$elm_ui$Internal$Model$lengthClassName(template.spacing.a) + ('-space-y-' + $mdgriffith$elm_ui$Internal$Model$lengthClassName(template.spacing.b)))))));
		case 'GridPosition':
			var pos = style.a;
			return 'gp grid-pos-' + ($elm$core$String$fromInt(pos.row) + ('-' + ($elm$core$String$fromInt(pos.col) + ('-' + ($elm$core$String$fromInt(pos.width) + ('-' + $elm$core$String$fromInt(pos.height)))))));
		case 'PseudoSelector':
			var selector = style.a;
			var subStyle = style.b;
			var name = function () {
				switch (selector.$) {
					case 'Focus':
						return 'fs';
					case 'Hover':
						return 'hv';
					default:
						return 'act';
				}
			}();
			return A2(
				$elm$core$String$join,
				' ',
				A2(
					$elm$core$List$map,
					function (sty) {
						var _v1 = $mdgriffith$elm_ui$Internal$Model$getStyleName(sty);
						if (_v1 === '') {
							return '';
						} else {
							var styleName = _v1;
							return styleName + ('-' + name);
						}
					},
					subStyle));
		default:
			var x = style.a;
			return A2(
				$elm$core$Maybe$withDefault,
				'',
				$mdgriffith$elm_ui$Internal$Model$transformClass(x));
	}
};
var $elm$core$Set$insert = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return $elm$core$Set$Set_elm_builtin(
			A3($elm$core$Dict$insert, key, _Utils_Tuple0, dict));
	});
var $elm$core$Set$member = F2(
	function (key, _v0) {
		var dict = _v0.a;
		return A2($elm$core$Dict$member, key, dict);
	});
var $mdgriffith$elm_ui$Internal$Model$reduceStyles = F2(
	function (style, nevermind) {
		var cache = nevermind.a;
		var existing = nevermind.b;
		var styleName = $mdgriffith$elm_ui$Internal$Model$getStyleName(style);
		return A2($elm$core$Set$member, styleName, cache) ? nevermind : _Utils_Tuple2(
			A2($elm$core$Set$insert, styleName, cache),
			A2($elm$core$List$cons, style, existing));
	});
var $mdgriffith$elm_ui$Internal$Model$Property = F2(
	function (a, b) {
		return {$: 'Property', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$Style = F2(
	function (a, b) {
		return {$: 'Style', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$dot = function (c) {
	return '.' + c;
};
var $elm$core$List$maybeCons = F3(
	function (f, mx, xs) {
		var _v0 = f(mx);
		if (_v0.$ === 'Just') {
			var x = _v0.a;
			return A2($elm$core$List$cons, x, xs);
		} else {
			return xs;
		}
	});
var $elm$core$List$filterMap = F2(
	function (f, xs) {
		return A3(
			$elm$core$List$foldr,
			$elm$core$List$maybeCons(f),
			_List_Nil,
			xs);
	});
var $elm$core$String$fromFloat = _String_fromNumber;
var $mdgriffith$elm_ui$Internal$Model$formatColor = function (_v0) {
	var red = _v0.a;
	var green = _v0.b;
	var blue = _v0.c;
	var alpha = _v0.d;
	return 'rgba(' + ($elm$core$String$fromInt(
		$elm$core$Basics$round(red * 255)) + ((',' + $elm$core$String$fromInt(
		$elm$core$Basics$round(green * 255))) + ((',' + $elm$core$String$fromInt(
		$elm$core$Basics$round(blue * 255))) + (',' + ($elm$core$String$fromFloat(alpha) + ')')))));
};
var $mdgriffith$elm_ui$Internal$Model$formatBoxShadow = function (shadow) {
	return A2(
		$elm$core$String$join,
		' ',
		A2(
			$elm$core$List$filterMap,
			$elm$core$Basics$identity,
			_List_fromArray(
				[
					shadow.inset ? $elm$core$Maybe$Just('inset') : $elm$core$Maybe$Nothing,
					$elm$core$Maybe$Just(
					$elm$core$String$fromFloat(shadow.offset.a) + 'px'),
					$elm$core$Maybe$Just(
					$elm$core$String$fromFloat(shadow.offset.b) + 'px'),
					$elm$core$Maybe$Just(
					$elm$core$String$fromFloat(shadow.blur) + 'px'),
					$elm$core$Maybe$Just(
					$elm$core$String$fromFloat(shadow.size) + 'px'),
					$elm$core$Maybe$Just(
					$mdgriffith$elm_ui$Internal$Model$formatColor(shadow.color))
				])));
};
var $elm$core$Tuple$mapFirst = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			func(x),
			y);
	});
var $elm$core$Tuple$mapSecond = F2(
	function (func, _v0) {
		var x = _v0.a;
		var y = _v0.b;
		return _Utils_Tuple2(
			x,
			func(y));
	});
var $mdgriffith$elm_ui$Internal$Model$renderFocusStyle = function (focus) {
	return _List_fromArray(
		[
			A2(
			$mdgriffith$elm_ui$Internal$Model$Style,
			$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.focusedWithin) + ':focus-within',
			A2(
				$elm$core$List$filterMap,
				$elm$core$Basics$identity,
				_List_fromArray(
					[
						A2(
						$elm$core$Maybe$map,
						function (color) {
							return A2(
								$mdgriffith$elm_ui$Internal$Model$Property,
								'border-color',
								$mdgriffith$elm_ui$Internal$Model$formatColor(color));
						},
						focus.borderColor),
						A2(
						$elm$core$Maybe$map,
						function (color) {
							return A2(
								$mdgriffith$elm_ui$Internal$Model$Property,
								'background-color',
								$mdgriffith$elm_ui$Internal$Model$formatColor(color));
						},
						focus.backgroundColor),
						A2(
						$elm$core$Maybe$map,
						function (shadow) {
							return A2(
								$mdgriffith$elm_ui$Internal$Model$Property,
								'box-shadow',
								$mdgriffith$elm_ui$Internal$Model$formatBoxShadow(
									{
										blur: shadow.blur,
										color: shadow.color,
										inset: false,
										offset: A2(
											$elm$core$Tuple$mapSecond,
											$elm$core$Basics$toFloat,
											A2($elm$core$Tuple$mapFirst, $elm$core$Basics$toFloat, shadow.offset)),
										size: shadow.size
									}));
						},
						focus.shadow),
						$elm$core$Maybe$Just(
						A2($mdgriffith$elm_ui$Internal$Model$Property, 'outline', 'none'))
					]))),
			A2(
			$mdgriffith$elm_ui$Internal$Model$Style,
			($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + ':focus .focusable, ') + (($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + '.focusable:focus, ') + ('.ui-slide-bar:focus + ' + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + ' .focusable-thumb'))),
			A2(
				$elm$core$List$filterMap,
				$elm$core$Basics$identity,
				_List_fromArray(
					[
						A2(
						$elm$core$Maybe$map,
						function (color) {
							return A2(
								$mdgriffith$elm_ui$Internal$Model$Property,
								'border-color',
								$mdgriffith$elm_ui$Internal$Model$formatColor(color));
						},
						focus.borderColor),
						A2(
						$elm$core$Maybe$map,
						function (color) {
							return A2(
								$mdgriffith$elm_ui$Internal$Model$Property,
								'background-color',
								$mdgriffith$elm_ui$Internal$Model$formatColor(color));
						},
						focus.backgroundColor),
						A2(
						$elm$core$Maybe$map,
						function (shadow) {
							return A2(
								$mdgriffith$elm_ui$Internal$Model$Property,
								'box-shadow',
								$mdgriffith$elm_ui$Internal$Model$formatBoxShadow(
									{
										blur: shadow.blur,
										color: shadow.color,
										inset: false,
										offset: A2(
											$elm$core$Tuple$mapSecond,
											$elm$core$Basics$toFloat,
											A2($elm$core$Tuple$mapFirst, $elm$core$Basics$toFloat, shadow.offset)),
										size: shadow.size
									}));
						},
						focus.shadow),
						$elm$core$Maybe$Just(
						A2($mdgriffith$elm_ui$Internal$Model$Property, 'outline', 'none'))
					])))
		]);
};
var $elm$virtual_dom$VirtualDom$node = function (tag) {
	return _VirtualDom_node(
		_VirtualDom_noScript(tag));
};
var $elm$virtual_dom$VirtualDom$property = F2(
	function (key, value) {
		return A2(
			_VirtualDom_property,
			_VirtualDom_noInnerHtmlOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $mdgriffith$elm_ui$Internal$Style$AllChildren = F2(
	function (a, b) {
		return {$: 'AllChildren', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$Batch = function (a) {
	return {$: 'Batch', a: a};
};
var $mdgriffith$elm_ui$Internal$Style$Child = F2(
	function (a, b) {
		return {$: 'Child', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$Class = F2(
	function (a, b) {
		return {$: 'Class', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$Descriptor = F2(
	function (a, b) {
		return {$: 'Descriptor', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$Left = {$: 'Left'};
var $mdgriffith$elm_ui$Internal$Style$Prop = F2(
	function (a, b) {
		return {$: 'Prop', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$Right = {$: 'Right'};
var $mdgriffith$elm_ui$Internal$Style$Self = function (a) {
	return {$: 'Self', a: a};
};
var $mdgriffith$elm_ui$Internal$Style$Supports = F2(
	function (a, b) {
		return {$: 'Supports', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Style$Content = function (a) {
	return {$: 'Content', a: a};
};
var $mdgriffith$elm_ui$Internal$Style$Bottom = {$: 'Bottom'};
var $mdgriffith$elm_ui$Internal$Style$CenterX = {$: 'CenterX'};
var $mdgriffith$elm_ui$Internal$Style$CenterY = {$: 'CenterY'};
var $mdgriffith$elm_ui$Internal$Style$Top = {$: 'Top'};
var $mdgriffith$elm_ui$Internal$Style$alignments = _List_fromArray(
	[$mdgriffith$elm_ui$Internal$Style$Top, $mdgriffith$elm_ui$Internal$Style$Bottom, $mdgriffith$elm_ui$Internal$Style$Right, $mdgriffith$elm_ui$Internal$Style$Left, $mdgriffith$elm_ui$Internal$Style$CenterX, $mdgriffith$elm_ui$Internal$Style$CenterY]);
var $mdgriffith$elm_ui$Internal$Style$contentName = function (desc) {
	switch (desc.a.$) {
		case 'Top':
			var _v1 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.contentTop);
		case 'Bottom':
			var _v2 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.contentBottom);
		case 'Right':
			var _v3 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.contentRight);
		case 'Left':
			var _v4 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.contentLeft);
		case 'CenterX':
			var _v5 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.contentCenterX);
		default:
			var _v6 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.contentCenterY);
	}
};
var $mdgriffith$elm_ui$Internal$Style$selfName = function (desc) {
	switch (desc.a.$) {
		case 'Top':
			var _v1 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignTop);
		case 'Bottom':
			var _v2 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignBottom);
		case 'Right':
			var _v3 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignRight);
		case 'Left':
			var _v4 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignLeft);
		case 'CenterX':
			var _v5 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterX);
		default:
			var _v6 = desc.a;
			return $mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterY);
	}
};
var $mdgriffith$elm_ui$Internal$Style$describeAlignment = function (values) {
	var createDescription = function (alignment) {
		var _v0 = values(alignment);
		var content = _v0.a;
		var indiv = _v0.b;
		return _List_fromArray(
			[
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$contentName(
					$mdgriffith$elm_ui$Internal$Style$Content(alignment)),
				content),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Child,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$selfName(
							$mdgriffith$elm_ui$Internal$Style$Self(alignment)),
						indiv)
					]))
			]);
	};
	return $mdgriffith$elm_ui$Internal$Style$Batch(
		A2($elm$core$List$concatMap, createDescription, $mdgriffith$elm_ui$Internal$Style$alignments));
};
var $mdgriffith$elm_ui$Internal$Style$elDescription = _List_fromArray(
	[
		A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex'),
		A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-direction', 'column'),
		A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'pre'),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Descriptor,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.hasBehind),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '0'),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Child,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.behind),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '-1')
					]))
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Descriptor,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.seButton),
		_List_fromArray(
			[
				A2(
				$mdgriffith$elm_ui$Internal$Style$Child,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.text),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'auto !important')
							]))
					]))
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Child,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightContent),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', 'auto')
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Child,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '100000')
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Child,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFill),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%')
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Child,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFillPortion),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%')
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Child,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthContent),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-start')
			])),
		$mdgriffith$elm_ui$Internal$Style$describeAlignment(
		function (alignment) {
			switch (alignment.$) {
				case 'Top':
					return _Utils_Tuple2(
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-start')
							]),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto !important'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', '0 !important')
							]));
				case 'Bottom':
					return _Utils_Tuple2(
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-end')
							]),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto !important'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', '0 !important')
							]));
				case 'Right':
					return _Utils_Tuple2(
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-end')
							]),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-end')
							]));
				case 'Left':
					return _Utils_Tuple2(
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-start')
							]),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-start')
							]));
				case 'CenterX':
					return _Utils_Tuple2(
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'center')
							]),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'center')
							]));
				default:
					return _Utils_Tuple2(
						_List_fromArray(
							[
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto'),
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto')
									]))
							]),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto !important'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto !important')
							]));
			}
		})
	]);
var $mdgriffith$elm_ui$Internal$Style$gridAlignments = function (values) {
	var createDescription = function (alignment) {
		return _List_fromArray(
			[
				A2(
				$mdgriffith$elm_ui$Internal$Style$Child,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$selfName(
							$mdgriffith$elm_ui$Internal$Style$Self(alignment)),
						values(alignment))
					]))
			]);
	};
	return $mdgriffith$elm_ui$Internal$Style$Batch(
		A2($elm$core$List$concatMap, createDescription, $mdgriffith$elm_ui$Internal$Style$alignments));
};
var $mdgriffith$elm_ui$Internal$Style$Above = {$: 'Above'};
var $mdgriffith$elm_ui$Internal$Style$Behind = {$: 'Behind'};
var $mdgriffith$elm_ui$Internal$Style$Below = {$: 'Below'};
var $mdgriffith$elm_ui$Internal$Style$OnLeft = {$: 'OnLeft'};
var $mdgriffith$elm_ui$Internal$Style$OnRight = {$: 'OnRight'};
var $mdgriffith$elm_ui$Internal$Style$Within = {$: 'Within'};
var $mdgriffith$elm_ui$Internal$Style$locations = function () {
	var loc = $mdgriffith$elm_ui$Internal$Style$Above;
	var _v0 = function () {
		switch (loc.$) {
			case 'Above':
				return _Utils_Tuple0;
			case 'Below':
				return _Utils_Tuple0;
			case 'OnRight':
				return _Utils_Tuple0;
			case 'OnLeft':
				return _Utils_Tuple0;
			case 'Within':
				return _Utils_Tuple0;
			default:
				return _Utils_Tuple0;
		}
	}();
	return _List_fromArray(
		[$mdgriffith$elm_ui$Internal$Style$Above, $mdgriffith$elm_ui$Internal$Style$Below, $mdgriffith$elm_ui$Internal$Style$OnRight, $mdgriffith$elm_ui$Internal$Style$OnLeft, $mdgriffith$elm_ui$Internal$Style$Within, $mdgriffith$elm_ui$Internal$Style$Behind]);
}();
var $mdgriffith$elm_ui$Internal$Style$baseSheet = _List_fromArray(
	[
		A2(
		$mdgriffith$elm_ui$Internal$Style$Class,
		'html,body',
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'padding', '0'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0')
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Class,
		_Utils_ap(
			$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
			_Utils_ap(
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.single),
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.imageContainer))),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'block'),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'img',
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'max-height', '100%'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'object-fit', 'cover')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFill),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'img',
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'max-width', '100%'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'object-fit', 'cover')
							]))
					]))
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Class,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + ':focus',
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'outline', 'none')
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Class,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.root),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', 'auto'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'min-height', '100%'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '0'),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				_Utils_ap(
					$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
					$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill)),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Child,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inFront),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.nearby),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'fixed'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '20')
							]))
					]))
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Class,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.nearby),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'relative'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border', 'none'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-direction', 'row'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto'),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.single),
				$mdgriffith$elm_ui$Internal$Style$elDescription),
				$mdgriffith$elm_ui$Internal$Style$Batch(
				function (fn) {
					return A2($elm$core$List$map, fn, $mdgriffith$elm_ui$Internal$Style$locations);
				}(
					function (loc) {
						switch (loc.$) {
							case 'Above':
								return A2(
									$mdgriffith$elm_ui$Internal$Style$Descriptor,
									$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.above),
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'absolute'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'bottom', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'left', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '20'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', 'auto')
												])),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFill),
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%')
												])),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											'*',
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto')
												]))
										]));
							case 'Below':
								return A2(
									$mdgriffith$elm_ui$Internal$Style$Descriptor,
									$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.below),
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'absolute'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'bottom', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'left', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '20'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											'*',
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto')
												])),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', 'auto')
												]))
										]));
							case 'OnRight':
								return A2(
									$mdgriffith$elm_ui$Internal$Style$Descriptor,
									$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.onRight),
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'absolute'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'left', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'top', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '20'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											'*',
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto')
												]))
										]));
							case 'OnLeft':
								return A2(
									$mdgriffith$elm_ui$Internal$Style$Descriptor,
									$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.onLeft),
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'absolute'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'right', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'top', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '20'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											'*',
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto')
												]))
										]));
							case 'Within':
								return A2(
									$mdgriffith$elm_ui$Internal$Style$Descriptor,
									$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inFront),
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'absolute'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'left', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'top', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											'*',
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto')
												]))
										]));
							default:
								return A2(
									$mdgriffith$elm_ui$Internal$Style$Descriptor,
									$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.behind),
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'absolute'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'left', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'top', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '0'),
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none'),
											A2(
											$mdgriffith$elm_ui$Internal$Style$Child,
											'*',
											_List_fromArray(
												[
													A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto')
												]))
										]));
						}
					}))
			])),
		A2(
		$mdgriffith$elm_ui$Internal$Style$Class,
		$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
		_List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'relative'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border', 'none'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-shrink', '0'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-direction', 'row'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'resize', 'none'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-feature-settings', 'inherit'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'box-sizing', 'border-box'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'padding', '0'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border-width', '0'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border-style', 'solid'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-size', 'inherit'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'color', 'inherit'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-family', 'inherit'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'line-height', '1'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', 'inherit'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration', 'none'),
				A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-style', 'inherit'),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.wrapped),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-wrap', 'wrap')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.noTextSelection),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, '-moz-user-select', 'none'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, '-webkit-user-select', 'none'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, '-ms-user-select', 'none'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'user-select', 'none')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.cursorPointer),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'cursor', 'pointer')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.cursorText),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'cursor', 'text')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.passPointerEvents),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none !important')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.capturePointerEvents),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'auto !important')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.transparent),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '0')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.opaque),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '1')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot(
					_Utils_ap($mdgriffith$elm_ui$Internal$Style$classes.hover, $mdgriffith$elm_ui$Internal$Style$classes.transparent)) + ':hover',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '0')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot(
					_Utils_ap($mdgriffith$elm_ui$Internal$Style$classes.hover, $mdgriffith$elm_ui$Internal$Style$classes.opaque)) + ':hover',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '1')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot(
					_Utils_ap($mdgriffith$elm_ui$Internal$Style$classes.focus, $mdgriffith$elm_ui$Internal$Style$classes.transparent)) + ':focus',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '0')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot(
					_Utils_ap($mdgriffith$elm_ui$Internal$Style$classes.focus, $mdgriffith$elm_ui$Internal$Style$classes.opaque)) + ':focus',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '1')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot(
					_Utils_ap($mdgriffith$elm_ui$Internal$Style$classes.active, $mdgriffith$elm_ui$Internal$Style$classes.transparent)) + ':active',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '0')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot(
					_Utils_ap($mdgriffith$elm_ui$Internal$Style$classes.active, $mdgriffith$elm_ui$Internal$Style$classes.opaque)) + ':active',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'opacity', '1')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.transition),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Prop,
						'transition',
						A2(
							$elm$core$String$join,
							', ',
							A2(
								$elm$core$List$map,
								function (x) {
									return x + ' 160ms';
								},
								_List_fromArray(
									['transform', 'opacity', 'filter', 'background-color', 'color', 'font-size']))))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.scrollbars),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow', 'auto'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-shrink', '1')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.scrollbarsX),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow-x', 'auto'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.row),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-shrink', '1')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.scrollbarsY),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow-y', 'auto'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.column),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-shrink', '1')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.single),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-shrink', '1')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.clip),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow', 'hidden')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.clipX),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow-x', 'hidden')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.clipY),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow-y', 'hidden')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthContent),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', 'auto')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.borderNone),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border-width', '0')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.borderDashed),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border-style', 'dashed')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.borderDotted),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border-style', 'dotted')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.borderSolid),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'border-style', 'solid')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.text),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'pre'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline-block')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inputText),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'line-height', '1.05'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'background', 'transparent'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-align', 'inherit')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.single),
				$mdgriffith$elm_ui$Internal$Style$elDescription),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.row),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-direction', 'row'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', '0%'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthExact),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.link),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'stretch !important')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFillPortion),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'stretch !important')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '100000')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.container),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'stretch')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'u:first-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerRight,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:first-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterX,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterX),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-left', 'auto !important')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:last-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterX,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterX),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-right', 'auto !important')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:only-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterX,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterY),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto !important'),
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto !important')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:last-of-type.' + ($mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterX + ' ~ u'),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'u:first-of-type.' + ($mdgriffith$elm_ui$Internal$Style$classes.alignContainerRight + (' ~ s.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterX)),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0')
							])),
						$mdgriffith$elm_ui$Internal$Style$describeAlignment(
						function (alignment) {
							switch (alignment.$) {
								case 'Top':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-start')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-start')
											]));
								case 'Bottom':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-end')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-end')
											]));
								case 'Right':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-end')
											]),
										_List_Nil);
								case 'Left':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-start')
											]),
										_List_Nil);
								case 'CenterX':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'center')
											]),
										_List_Nil);
								default:
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'center')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'center')
											]));
							}
						}),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.spaceEvenly),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'space-between')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inputLabel),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'baseline')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.column),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-direction', 'column'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', '0px'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'min-height', 'min-content'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightExact),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.heightFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '100000')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFill),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthFillPortion),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthContent),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-start')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'u:first-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerBottom,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:first-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterY,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterY),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto !important'),
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', '0 !important')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:last-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterY,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterY),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto !important'),
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', '0 !important')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:only-of-type.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterY,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '1'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.alignCenterY),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto !important'),
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto !important')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						's:last-of-type.' + ($mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterY + ' ~ u'),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'u:first-of-type.' + ($mdgriffith$elm_ui$Internal$Style$classes.alignContainerBottom + (' ~ s.' + $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterY)),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0')
							])),
						$mdgriffith$elm_ui$Internal$Style$describeAlignment(
						function (alignment) {
							switch (alignment.$) {
								case 'Top':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-start')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-bottom', 'auto')
											]));
								case 'Bottom':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-end')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin-top', 'auto')
											]));
								case 'Right':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-end')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-end')
											]));
								case 'Left':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-start')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'flex-start')
											]));
								case 'CenterX':
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'center')
											]),
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'center')
											]));
								default:
									return _Utils_Tuple2(
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'center')
											]),
										_List_Nil);
							}
						}),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.container),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-grow', '0'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-self', 'stretch !important')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.spaceEvenly),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'space-between')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.grid),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', '-ms-grid'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						'.gp',
						_List_fromArray(
							[
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Supports,
						_Utils_Tuple2('display', 'grid'),
						_List_fromArray(
							[
								_Utils_Tuple2('display', 'grid')
							])),
						$mdgriffith$elm_ui$Internal$Style$gridAlignments(
						function (alignment) {
							switch (alignment.$) {
								case 'Top':
									return _List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-start')
										]);
								case 'Bottom':
									return _List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'flex-end')
										]);
								case 'Right':
									return _List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-end')
										]);
								case 'Left':
									return _List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'flex-start')
										]);
								case 'CenterX':
									return _List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'align-items', 'center')
										]);
								default:
									return _List_fromArray(
										[
											A2($mdgriffith$elm_ui$Internal$Style$Prop, 'justify-content', 'center')
										]);
							}
						})
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.page),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'block'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any + ':first-child'),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot(
							$mdgriffith$elm_ui$Internal$Style$classes.any + ($mdgriffith$elm_ui$Internal$Style$selfName(
								$mdgriffith$elm_ui$Internal$Style$Self($mdgriffith$elm_ui$Internal$Style$Left)) + (':first-child + .' + $mdgriffith$elm_ui$Internal$Style$classes.any))),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot(
							$mdgriffith$elm_ui$Internal$Style$classes.any + ($mdgriffith$elm_ui$Internal$Style$selfName(
								$mdgriffith$elm_ui$Internal$Style$Self($mdgriffith$elm_ui$Internal$Style$Right)) + (':first-child + .' + $mdgriffith$elm_ui$Internal$Style$classes.any))),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'margin', '0 !important')
							])),
						$mdgriffith$elm_ui$Internal$Style$describeAlignment(
						function (alignment) {
							switch (alignment.$) {
								case 'Top':
									return _Utils_Tuple2(_List_Nil, _List_Nil);
								case 'Bottom':
									return _Utils_Tuple2(_List_Nil, _List_Nil);
								case 'Right':
									return _Utils_Tuple2(
										_List_Nil,
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'float', 'right'),
												A2(
												$mdgriffith$elm_ui$Internal$Style$Descriptor,
												'::after',
												_List_fromArray(
													[
														A2($mdgriffith$elm_ui$Internal$Style$Prop, 'content', '\"\"'),
														A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'table'),
														A2($mdgriffith$elm_ui$Internal$Style$Prop, 'clear', 'both')
													]))
											]));
								case 'Left':
									return _Utils_Tuple2(
										_List_Nil,
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'float', 'left'),
												A2(
												$mdgriffith$elm_ui$Internal$Style$Descriptor,
												'::after',
												_List_fromArray(
													[
														A2($mdgriffith$elm_ui$Internal$Style$Prop, 'content', '\"\"'),
														A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'table'),
														A2($mdgriffith$elm_ui$Internal$Style$Prop, 'clear', 'both')
													]))
											]));
								case 'CenterX':
									return _Utils_Tuple2(_List_Nil, _List_Nil);
								default:
									return _Utils_Tuple2(_List_Nil, _List_Nil);
							}
						})
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inputMultiline),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'pre-wrap !important'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'background-color', 'transparent')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inputMultilineWrapper),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.single),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'flex-basis', 'auto')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inputMultilineParent),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'pre-wrap !important'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'cursor', 'text'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inputMultilineFiller),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'pre-wrap !important'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'color', 'transparent')
							]))
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.paragraph),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'block'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'normal'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'overflow-wrap', 'break-word'),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Descriptor,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.hasBehind),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '0'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.behind),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'z-index', '-1')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$AllChildren,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.text),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'normal')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$AllChildren,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.paragraph),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								'::after',
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'content', 'none')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								'::before',
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'content', 'none')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$AllChildren,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.single),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline'),
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'normal'),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.widthExact),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline-block')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.inFront),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.behind),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.above),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.below),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.onRight),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Descriptor,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.onLeft),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'flex')
									])),
								A2(
								$mdgriffith$elm_ui$Internal$Style$Child,
								$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.text),
								_List_fromArray(
									[
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline'),
										A2($mdgriffith$elm_ui$Internal$Style$Prop, 'white-space', 'normal')
									]))
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.row),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.column),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline-flex')
							])),
						A2(
						$mdgriffith$elm_ui$Internal$Style$Child,
						$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.grid),
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'inline-grid')
							])),
						$mdgriffith$elm_ui$Internal$Style$describeAlignment(
						function (alignment) {
							switch (alignment.$) {
								case 'Top':
									return _Utils_Tuple2(_List_Nil, _List_Nil);
								case 'Bottom':
									return _Utils_Tuple2(_List_Nil, _List_Nil);
								case 'Right':
									return _Utils_Tuple2(
										_List_Nil,
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'float', 'right')
											]));
								case 'Left':
									return _Utils_Tuple2(
										_List_Nil,
										_List_fromArray(
											[
												A2($mdgriffith$elm_ui$Internal$Style$Prop, 'float', 'left')
											]));
								case 'CenterX':
									return _Utils_Tuple2(_List_Nil, _List_Nil);
								default:
									return _Utils_Tuple2(_List_Nil, _List_Nil);
							}
						})
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				'.hidden',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'display', 'none')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textThin),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '100')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textExtraLight),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '200')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textLight),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '300')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textNormalWeight),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '400')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textMedium),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '500')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textSemiBold),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '600')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.bold),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '700')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textExtraBold),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '800')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textHeavy),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-weight', '900')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.italic),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-style', 'italic')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.strike),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration', 'line-through')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.underline),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration', 'underline'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration-skip-ink', 'auto'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration-skip', 'ink')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				_Utils_ap(
					$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.underline),
					$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.strike)),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration', 'line-through underline'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration-skip-ink', 'auto'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-decoration-skip', 'ink')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textUnitalicized),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-style', 'normal')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textJustify),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-align', 'justify')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textJustifyAll),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-align', 'justify-all')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textCenter),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-align', 'center')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textRight),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-align', 'right')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				$mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.textLeft),
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'text-align', 'left')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Descriptor,
				'.modal',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'position', 'fixed'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'left', '0'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'top', '0'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'width', '100%'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'height', '100%'),
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'pointer-events', 'none')
					]))
			]))
	]);
var $mdgriffith$elm_ui$Internal$Style$fontVariant = function (_var) {
	return _List_fromArray(
		[
			A2(
			$mdgriffith$elm_ui$Internal$Style$Class,
			'.v-' + _var,
			_List_fromArray(
				[
					A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-feature-settings', '\"' + (_var + '\"'))
				])),
			A2(
			$mdgriffith$elm_ui$Internal$Style$Class,
			'.v-' + (_var + '-off'),
			_List_fromArray(
				[
					A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-feature-settings', '\"' + (_var + '\" 0'))
				]))
		]);
};
var $mdgriffith$elm_ui$Internal$Style$commonValues = $elm$core$List$concat(
	_List_fromArray(
		[
			A2(
			$elm$core$List$map,
			function (x) {
				return A2(
					$mdgriffith$elm_ui$Internal$Style$Class,
					'.border-' + $elm$core$String$fromInt(x),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Style$Prop,
							'border-width',
							$elm$core$String$fromInt(x) + 'px')
						]));
			},
			A2($elm$core$List$range, 0, 6)),
			A2(
			$elm$core$List$map,
			function (i) {
				return A2(
					$mdgriffith$elm_ui$Internal$Style$Class,
					'.font-size-' + $elm$core$String$fromInt(i),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Style$Prop,
							'font-size',
							$elm$core$String$fromInt(i) + 'px')
						]));
			},
			A2($elm$core$List$range, 8, 32)),
			A2(
			$elm$core$List$map,
			function (i) {
				return A2(
					$mdgriffith$elm_ui$Internal$Style$Class,
					'.p-' + $elm$core$String$fromInt(i),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Style$Prop,
							'padding',
							$elm$core$String$fromInt(i) + 'px')
						]));
			},
			A2($elm$core$List$range, 0, 24)),
			_List_fromArray(
			[
				A2(
				$mdgriffith$elm_ui$Internal$Style$Class,
				'.v-smcp',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-variant', 'small-caps')
					])),
				A2(
				$mdgriffith$elm_ui$Internal$Style$Class,
				'.v-smcp-off',
				_List_fromArray(
					[
						A2($mdgriffith$elm_ui$Internal$Style$Prop, 'font-variant', 'normal')
					]))
			]),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('zero'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('onum'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('liga'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('dlig'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('ordn'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('tnum'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('afrc'),
			$mdgriffith$elm_ui$Internal$Style$fontVariant('frac')
		]));
var $mdgriffith$elm_ui$Internal$Style$explainer = '\n.explain {\n    border: 6px solid rgb(174, 121, 15) !important;\n}\n.explain > .' + ($mdgriffith$elm_ui$Internal$Style$classes.any + (' {\n    border: 4px dashed rgb(0, 151, 167) !important;\n}\n\n.ctr {\n    border: none !important;\n}\n.explain > .ctr > .' + ($mdgriffith$elm_ui$Internal$Style$classes.any + ' {\n    border: 4px dashed rgb(0, 151, 167) !important;\n}\n\n')));
var $mdgriffith$elm_ui$Internal$Style$inputTextReset = '\ninput[type="search"],\ninput[type="search"]::-webkit-search-decoration,\ninput[type="search"]::-webkit-search-cancel-button,\ninput[type="search"]::-webkit-search-results-button,\ninput[type="search"]::-webkit-search-results-decoration {\n  -webkit-appearance:none;\n}\n';
var $mdgriffith$elm_ui$Internal$Style$sliderReset = '\ninput[type=range] {\n  -webkit-appearance: none; \n  background: transparent;\n  position:absolute;\n  left:0;\n  top:0;\n  z-index:10;\n  width: 100%;\n  outline: dashed 1px;\n  height: 100%;\n  opacity: 0;\n}\n';
var $mdgriffith$elm_ui$Internal$Style$thumbReset = '\ninput[type=range]::-webkit-slider-thumb {\n    -webkit-appearance: none;\n    opacity: 0.5;\n    width: 80px;\n    height: 80px;\n    background-color: black;\n    border:none;\n    border-radius: 5px;\n}\ninput[type=range]::-moz-range-thumb {\n    opacity: 0.5;\n    width: 80px;\n    height: 80px;\n    background-color: black;\n    border:none;\n    border-radius: 5px;\n}\ninput[type=range]::-ms-thumb {\n    opacity: 0.5;\n    width: 80px;\n    height: 80px;\n    background-color: black;\n    border:none;\n    border-radius: 5px;\n}\ninput[type=range][orient=vertical]{\n    writing-mode: bt-lr; /* IE */\n    -webkit-appearance: slider-vertical;  /* WebKit */\n}\n';
var $mdgriffith$elm_ui$Internal$Style$trackReset = '\ninput[type=range]::-moz-range-track {\n    background: transparent;\n    cursor: pointer;\n}\ninput[type=range]::-ms-track {\n    background: transparent;\n    cursor: pointer;\n}\ninput[type=range]::-webkit-slider-runnable-track {\n    background: transparent;\n    cursor: pointer;\n}\n';
var $mdgriffith$elm_ui$Internal$Style$overrides = '@media screen and (-ms-high-contrast: active), (-ms-high-contrast: none) {' + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.row) + (' > ' + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + (' { flex-basis: auto !important; } ' + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.row) + (' > ' + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.container) + (' { flex-basis: auto !important; }}' + ($mdgriffith$elm_ui$Internal$Style$inputTextReset + ($mdgriffith$elm_ui$Internal$Style$sliderReset + ($mdgriffith$elm_ui$Internal$Style$trackReset + ($mdgriffith$elm_ui$Internal$Style$thumbReset + $mdgriffith$elm_ui$Internal$Style$explainer)))))))))))))));
var $mdgriffith$elm_ui$Internal$Style$Intermediate = function (a) {
	return {$: 'Intermediate', a: a};
};
var $mdgriffith$elm_ui$Internal$Style$emptyIntermediate = F2(
	function (selector, closing) {
		return $mdgriffith$elm_ui$Internal$Style$Intermediate(
			{closing: closing, others: _List_Nil, props: _List_Nil, selector: selector});
	});
var $mdgriffith$elm_ui$Internal$Style$renderRules = F2(
	function (_v0, rulesToRender) {
		var parent = _v0.a;
		var generateIntermediates = F2(
			function (rule, rendered) {
				switch (rule.$) {
					case 'Prop':
						var name = rule.a;
						var val = rule.b;
						return _Utils_update(
							rendered,
							{
								props: A2(
									$elm$core$List$cons,
									_Utils_Tuple2(name, val),
									rendered.props)
							});
					case 'Supports':
						var _v2 = rule.a;
						var prop = _v2.a;
						var value = _v2.b;
						var props = rule.b;
						return _Utils_update(
							rendered,
							{
								others: A2(
									$elm$core$List$cons,
									$mdgriffith$elm_ui$Internal$Style$Intermediate(
										{closing: '\n}', others: _List_Nil, props: props, selector: '@supports (' + (prop + (':' + (value + (') {' + parent.selector))))}),
									rendered.others)
							});
					case 'Adjacent':
						var selector = rule.a;
						var adjRules = rule.b;
						return _Utils_update(
							rendered,
							{
								others: A2(
									$elm$core$List$cons,
									A2(
										$mdgriffith$elm_ui$Internal$Style$renderRules,
										A2($mdgriffith$elm_ui$Internal$Style$emptyIntermediate, parent.selector + (' + ' + selector), ''),
										adjRules),
									rendered.others)
							});
					case 'Child':
						var child = rule.a;
						var childRules = rule.b;
						return _Utils_update(
							rendered,
							{
								others: A2(
									$elm$core$List$cons,
									A2(
										$mdgriffith$elm_ui$Internal$Style$renderRules,
										A2($mdgriffith$elm_ui$Internal$Style$emptyIntermediate, parent.selector + (' > ' + child), ''),
										childRules),
									rendered.others)
							});
					case 'AllChildren':
						var child = rule.a;
						var childRules = rule.b;
						return _Utils_update(
							rendered,
							{
								others: A2(
									$elm$core$List$cons,
									A2(
										$mdgriffith$elm_ui$Internal$Style$renderRules,
										A2($mdgriffith$elm_ui$Internal$Style$emptyIntermediate, parent.selector + (' ' + child), ''),
										childRules),
									rendered.others)
							});
					case 'Descriptor':
						var descriptor = rule.a;
						var descriptorRules = rule.b;
						return _Utils_update(
							rendered,
							{
								others: A2(
									$elm$core$List$cons,
									A2(
										$mdgriffith$elm_ui$Internal$Style$renderRules,
										A2(
											$mdgriffith$elm_ui$Internal$Style$emptyIntermediate,
											_Utils_ap(parent.selector, descriptor),
											''),
										descriptorRules),
									rendered.others)
							});
					default:
						var batched = rule.a;
						return _Utils_update(
							rendered,
							{
								others: A2(
									$elm$core$List$cons,
									A2(
										$mdgriffith$elm_ui$Internal$Style$renderRules,
										A2($mdgriffith$elm_ui$Internal$Style$emptyIntermediate, parent.selector, ''),
										batched),
									rendered.others)
							});
				}
			});
		return $mdgriffith$elm_ui$Internal$Style$Intermediate(
			A3($elm$core$List$foldr, generateIntermediates, parent, rulesToRender));
	});
var $mdgriffith$elm_ui$Internal$Style$renderCompact = function (styleClasses) {
	var renderValues = function (values) {
		return $elm$core$String$concat(
			A2(
				$elm$core$List$map,
				function (_v3) {
					var x = _v3.a;
					var y = _v3.b;
					return x + (':' + (y + ';'));
				},
				values));
	};
	var renderClass = function (rule) {
		var _v2 = rule.props;
		if (!_v2.b) {
			return '';
		} else {
			return rule.selector + ('{' + (renderValues(rule.props) + (rule.closing + '}')));
		}
	};
	var renderIntermediate = function (_v0) {
		var rule = _v0.a;
		return _Utils_ap(
			renderClass(rule),
			$elm$core$String$concat(
				A2($elm$core$List$map, renderIntermediate, rule.others)));
	};
	return $elm$core$String$concat(
		A2(
			$elm$core$List$map,
			renderIntermediate,
			A3(
				$elm$core$List$foldr,
				F2(
					function (_v1, existing) {
						var name = _v1.a;
						var styleRules = _v1.b;
						return A2(
							$elm$core$List$cons,
							A2(
								$mdgriffith$elm_ui$Internal$Style$renderRules,
								A2($mdgriffith$elm_ui$Internal$Style$emptyIntermediate, name, ''),
								styleRules),
							existing);
					}),
				_List_Nil,
				styleClasses)));
};
var $mdgriffith$elm_ui$Internal$Style$rules = _Utils_ap(
	$mdgriffith$elm_ui$Internal$Style$overrides,
	$mdgriffith$elm_ui$Internal$Style$renderCompact(
		_Utils_ap($mdgriffith$elm_ui$Internal$Style$baseSheet, $mdgriffith$elm_ui$Internal$Style$commonValues)));
var $elm$virtual_dom$VirtualDom$text = _VirtualDom_text;
var $mdgriffith$elm_ui$Internal$Model$staticRoot = function (opts) {
	var _v0 = opts.mode;
	switch (_v0.$) {
		case 'Layout':
			return A3(
				$elm$virtual_dom$VirtualDom$node,
				'div',
				_List_Nil,
				_List_fromArray(
					[
						A3(
						$elm$virtual_dom$VirtualDom$node,
						'style',
						_List_Nil,
						_List_fromArray(
							[
								$elm$virtual_dom$VirtualDom$text($mdgriffith$elm_ui$Internal$Style$rules)
							]))
					]));
		case 'NoStaticStyleSheet':
			return $elm$virtual_dom$VirtualDom$text('');
		default:
			return A3(
				$elm$virtual_dom$VirtualDom$node,
				'elm-ui-static-rules',
				_List_fromArray(
					[
						A2(
						$elm$virtual_dom$VirtualDom$property,
						'rules',
						$elm$json$Json$Encode$string($mdgriffith$elm_ui$Internal$Style$rules))
					]),
				_List_Nil);
	}
};
var $elm$json$Json$Encode$list = F2(
	function (func, entries) {
		return _Json_wrap(
			A3(
				$elm$core$List$foldl,
				_Json_addEntry(func),
				_Json_emptyArray(_Utils_Tuple0),
				entries));
	});
var $elm$json$Json$Encode$object = function (pairs) {
	return _Json_wrap(
		A3(
			$elm$core$List$foldl,
			F2(
				function (_v0, obj) {
					var k = _v0.a;
					var v = _v0.b;
					return A3(_Json_addField, k, v, obj);
				}),
			_Json_emptyObject(_Utils_Tuple0),
			pairs));
};
var $elm$core$List$any = F2(
	function (isOkay, list) {
		any:
		while (true) {
			if (!list.b) {
				return false;
			} else {
				var x = list.a;
				var xs = list.b;
				if (isOkay(x)) {
					return true;
				} else {
					var $temp$isOkay = isOkay,
						$temp$list = xs;
					isOkay = $temp$isOkay;
					list = $temp$list;
					continue any;
				}
			}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$fontName = function (font) {
	switch (font.$) {
		case 'Serif':
			return 'serif';
		case 'SansSerif':
			return 'sans-serif';
		case 'Monospace':
			return 'monospace';
		case 'Typeface':
			var name = font.a;
			return '\"' + (name + '\"');
		case 'ImportFont':
			var name = font.a;
			var url = font.b;
			return '\"' + (name + '\"');
		default:
			var name = font.a.name;
			return '\"' + (name + '\"');
	}
};
var $mdgriffith$elm_ui$Internal$Model$isSmallCaps = function (_var) {
	switch (_var.$) {
		case 'VariantActive':
			var name = _var.a;
			return name === 'smcp';
		case 'VariantOff':
			var name = _var.a;
			return false;
		default:
			var name = _var.a;
			var index = _var.b;
			return (name === 'smcp') && (index === 1);
	}
};
var $mdgriffith$elm_ui$Internal$Model$hasSmallCaps = function (typeface) {
	if (typeface.$ === 'FontWith') {
		var font = typeface.a;
		return A2($elm$core$List$any, $mdgriffith$elm_ui$Internal$Model$isSmallCaps, font.variants);
	} else {
		return false;
	}
};
var $elm$core$Basics$min = F2(
	function (x, y) {
		return (_Utils_cmp(x, y) < 0) ? x : y;
	});
var $elm$core$Basics$negate = function (n) {
	return -n;
};
var $mdgriffith$elm_ui$Internal$Model$renderProps = F3(
	function (force, _v0, existing) {
		var key = _v0.a;
		var val = _v0.b;
		return force ? (existing + ('\n  ' + (key + (': ' + (val + ' !important;'))))) : (existing + ('\n  ' + (key + (': ' + (val + ';')))));
	});
var $mdgriffith$elm_ui$Internal$Model$renderStyle = F4(
	function (options, maybePseudo, selector, props) {
		if (maybePseudo.$ === 'Nothing') {
			return _List_fromArray(
				[
					selector + ('{' + (A3(
					$elm$core$List$foldl,
					$mdgriffith$elm_ui$Internal$Model$renderProps(false),
					'',
					props) + '\n}'))
				]);
		} else {
			var pseudo = maybePseudo.a;
			switch (pseudo.$) {
				case 'Hover':
					var _v2 = options.hover;
					switch (_v2.$) {
						case 'NoHover':
							return _List_Nil;
						case 'ForceHover':
							return _List_fromArray(
								[
									selector + ('-hv {' + (A3(
									$elm$core$List$foldl,
									$mdgriffith$elm_ui$Internal$Model$renderProps(true),
									'',
									props) + '\n}'))
								]);
						default:
							return _List_fromArray(
								[
									selector + ('-hv:hover {' + (A3(
									$elm$core$List$foldl,
									$mdgriffith$elm_ui$Internal$Model$renderProps(false),
									'',
									props) + '\n}'))
								]);
					}
				case 'Focus':
					var renderedProps = A3(
						$elm$core$List$foldl,
						$mdgriffith$elm_ui$Internal$Model$renderProps(false),
						'',
						props);
					return _List_fromArray(
						[
							selector + ('-fs:focus {' + (renderedProps + '\n}')),
							('.' + ($mdgriffith$elm_ui$Internal$Style$classes.any + (':focus ' + (selector + '-fs  {')))) + (renderedProps + '\n}'),
							(selector + '-fs:focus-within {') + (renderedProps + '\n}'),
							('.ui-slide-bar:focus + ' + ($mdgriffith$elm_ui$Internal$Style$dot($mdgriffith$elm_ui$Internal$Style$classes.any) + (' .focusable-thumb' + (selector + '-fs {')))) + (renderedProps + '\n}')
						]);
				default:
					return _List_fromArray(
						[
							selector + ('-act:active {' + (A3(
							$elm$core$List$foldl,
							$mdgriffith$elm_ui$Internal$Model$renderProps(false),
							'',
							props) + '\n}'))
						]);
			}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$renderVariant = function (_var) {
	switch (_var.$) {
		case 'VariantActive':
			var name = _var.a;
			return '\"' + (name + '\"');
		case 'VariantOff':
			var name = _var.a;
			return '\"' + (name + '\" 0');
		default:
			var name = _var.a;
			var index = _var.b;
			return '\"' + (name + ('\" ' + $elm$core$String$fromInt(index)));
	}
};
var $mdgriffith$elm_ui$Internal$Model$renderVariants = function (typeface) {
	if (typeface.$ === 'FontWith') {
		var font = typeface.a;
		return $elm$core$Maybe$Just(
			A2(
				$elm$core$String$join,
				', ',
				A2($elm$core$List$map, $mdgriffith$elm_ui$Internal$Model$renderVariant, font.variants)));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $mdgriffith$elm_ui$Internal$Model$transformValue = function (transform) {
	switch (transform.$) {
		case 'Untransformed':
			return $elm$core$Maybe$Nothing;
		case 'Moved':
			var _v1 = transform.a;
			var x = _v1.a;
			var y = _v1.b;
			var z = _v1.c;
			return $elm$core$Maybe$Just(
				'translate3d(' + ($elm$core$String$fromFloat(x) + ('px, ' + ($elm$core$String$fromFloat(y) + ('px, ' + ($elm$core$String$fromFloat(z) + 'px)'))))));
		default:
			var _v2 = transform.a;
			var tx = _v2.a;
			var ty = _v2.b;
			var tz = _v2.c;
			var _v3 = transform.b;
			var sx = _v3.a;
			var sy = _v3.b;
			var sz = _v3.c;
			var _v4 = transform.c;
			var ox = _v4.a;
			var oy = _v4.b;
			var oz = _v4.c;
			var angle = transform.d;
			var translate = 'translate3d(' + ($elm$core$String$fromFloat(tx) + ('px, ' + ($elm$core$String$fromFloat(ty) + ('px, ' + ($elm$core$String$fromFloat(tz) + 'px)')))));
			var scale = 'scale3d(' + ($elm$core$String$fromFloat(sx) + (', ' + ($elm$core$String$fromFloat(sy) + (', ' + ($elm$core$String$fromFloat(sz) + ')')))));
			var rotate = 'rotate3d(' + ($elm$core$String$fromFloat(ox) + (', ' + ($elm$core$String$fromFloat(oy) + (', ' + ($elm$core$String$fromFloat(oz) + (', ' + ($elm$core$String$fromFloat(angle) + 'rad)')))))));
			return $elm$core$Maybe$Just(translate + (' ' + (scale + (' ' + rotate))));
	}
};
var $mdgriffith$elm_ui$Internal$Model$renderStyleRule = F3(
	function (options, rule, maybePseudo) {
		switch (rule.$) {
			case 'Style':
				var selector = rule.a;
				var props = rule.b;
				return A4($mdgriffith$elm_ui$Internal$Model$renderStyle, options, maybePseudo, selector, props);
			case 'Shadows':
				var name = rule.a;
				var prop = rule.b;
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					'.' + name,
					_List_fromArray(
						[
							A2($mdgriffith$elm_ui$Internal$Model$Property, 'box-shadow', prop)
						]));
			case 'Transparency':
				var name = rule.a;
				var transparency = rule.b;
				var opacity = A2(
					$elm$core$Basics$max,
					0,
					A2($elm$core$Basics$min, 1, 1 - transparency));
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					'.' + name,
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Model$Property,
							'opacity',
							$elm$core$String$fromFloat(opacity))
						]));
			case 'FontSize':
				var i = rule.a;
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					'.font-size-' + $elm$core$String$fromInt(i),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Model$Property,
							'font-size',
							$elm$core$String$fromInt(i) + 'px')
						]));
			case 'FontFamily':
				var name = rule.a;
				var typefaces = rule.b;
				var features = A2(
					$elm$core$String$join,
					', ',
					A2($elm$core$List$filterMap, $mdgriffith$elm_ui$Internal$Model$renderVariants, typefaces));
				var families = _List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Internal$Model$Property,
						'font-family',
						A2(
							$elm$core$String$join,
							', ',
							A2($elm$core$List$map, $mdgriffith$elm_ui$Internal$Model$fontName, typefaces))),
						A2($mdgriffith$elm_ui$Internal$Model$Property, 'font-feature-settings', features),
						A2(
						$mdgriffith$elm_ui$Internal$Model$Property,
						'font-variant',
						A2($elm$core$List$any, $mdgriffith$elm_ui$Internal$Model$hasSmallCaps, typefaces) ? 'small-caps' : 'normal')
					]);
				return A4($mdgriffith$elm_ui$Internal$Model$renderStyle, options, maybePseudo, '.' + name, families);
			case 'Single':
				var _class = rule.a;
				var prop = rule.b;
				var val = rule.c;
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					'.' + _class,
					_List_fromArray(
						[
							A2($mdgriffith$elm_ui$Internal$Model$Property, prop, val)
						]));
			case 'Colored':
				var _class = rule.a;
				var prop = rule.b;
				var color = rule.c;
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					'.' + _class,
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Model$Property,
							prop,
							$mdgriffith$elm_ui$Internal$Model$formatColor(color))
						]));
			case 'SpacingStyle':
				var cls = rule.a;
				var x = rule.b;
				var y = rule.c;
				var yPx = $elm$core$String$fromInt(y) + 'px';
				var xPx = $elm$core$String$fromInt(x) + 'px';
				var single = '.' + $mdgriffith$elm_ui$Internal$Style$classes.single;
				var row = '.' + $mdgriffith$elm_ui$Internal$Style$classes.row;
				var wrappedRow = '.' + ($mdgriffith$elm_ui$Internal$Style$classes.wrapped + row);
				var right = '.' + $mdgriffith$elm_ui$Internal$Style$classes.alignRight;
				var paragraph = '.' + $mdgriffith$elm_ui$Internal$Style$classes.paragraph;
				var page = '.' + $mdgriffith$elm_ui$Internal$Style$classes.page;
				var left = '.' + $mdgriffith$elm_ui$Internal$Style$classes.alignLeft;
				var halfY = $elm$core$String$fromFloat(y / 2) + 'px';
				var halfX = $elm$core$String$fromFloat(x / 2) + 'px';
				var column = '.' + $mdgriffith$elm_ui$Internal$Style$classes.column;
				var _class = '.' + cls;
				var any = '.' + $mdgriffith$elm_ui$Internal$Style$classes.any;
				return $elm$core$List$concat(
					_List_fromArray(
						[
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (row + (' > ' + (any + (' + ' + any)))),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-left', xPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (wrappedRow + (' > ' + any)),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin', halfY + (' ' + halfX))
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (column + (' > ' + (any + (' + ' + any)))),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-top', yPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (page + (' > ' + (any + (' + ' + any)))),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-top', yPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (page + (' > ' + left)),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-right', xPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (page + (' > ' + right)),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-left', xPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_Utils_ap(_class, paragraph),
							_List_fromArray(
								[
									A2(
									$mdgriffith$elm_ui$Internal$Model$Property,
									'line-height',
									'calc(1em + ' + ($elm$core$String$fromInt(y) + 'px)'))
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							'textarea' + (any + _class),
							_List_fromArray(
								[
									A2(
									$mdgriffith$elm_ui$Internal$Model$Property,
									'line-height',
									'calc(1em + ' + ($elm$core$String$fromInt(y) + 'px)')),
									A2(
									$mdgriffith$elm_ui$Internal$Model$Property,
									'height',
									'calc(100% + ' + ($elm$core$String$fromInt(y) + 'px)'))
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (paragraph + (' > ' + left)),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-right', xPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (paragraph + (' > ' + right)),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'margin-left', xPx)
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (paragraph + '::after'),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'content', '\'\''),
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'display', 'block'),
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'height', '0'),
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'width', '0'),
									A2(
									$mdgriffith$elm_ui$Internal$Model$Property,
									'margin-top',
									$elm$core$String$fromInt((-1) * ((y / 2) | 0)) + 'px')
								])),
							A4(
							$mdgriffith$elm_ui$Internal$Model$renderStyle,
							options,
							maybePseudo,
							_class + (paragraph + '::before'),
							_List_fromArray(
								[
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'content', '\'\''),
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'display', 'block'),
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'height', '0'),
									A2($mdgriffith$elm_ui$Internal$Model$Property, 'width', '0'),
									A2(
									$mdgriffith$elm_ui$Internal$Model$Property,
									'margin-bottom',
									$elm$core$String$fromInt((-1) * ((y / 2) | 0)) + 'px')
								]))
						]));
			case 'PaddingStyle':
				var cls = rule.a;
				var top = rule.b;
				var right = rule.c;
				var bottom = rule.d;
				var left = rule.e;
				var _class = '.' + cls;
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					_class,
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Model$Property,
							'padding',
							$elm$core$String$fromFloat(top) + ('px ' + ($elm$core$String$fromFloat(right) + ('px ' + ($elm$core$String$fromFloat(bottom) + ('px ' + ($elm$core$String$fromFloat(left) + 'px')))))))
						]));
			case 'BorderWidth':
				var cls = rule.a;
				var top = rule.b;
				var right = rule.c;
				var bottom = rule.d;
				var left = rule.e;
				var _class = '.' + cls;
				return A4(
					$mdgriffith$elm_ui$Internal$Model$renderStyle,
					options,
					maybePseudo,
					_class,
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Model$Property,
							'border-width',
							$elm$core$String$fromInt(top) + ('px ' + ($elm$core$String$fromInt(right) + ('px ' + ($elm$core$String$fromInt(bottom) + ('px ' + ($elm$core$String$fromInt(left) + 'px')))))))
						]));
			case 'GridTemplateStyle':
				var template = rule.a;
				var toGridLengthHelper = F3(
					function (minimum, maximum, x) {
						toGridLengthHelper:
						while (true) {
							switch (x.$) {
								case 'Px':
									var px = x.a;
									return $elm$core$String$fromInt(px) + 'px';
								case 'Content':
									var _v2 = _Utils_Tuple2(minimum, maximum);
									if (_v2.a.$ === 'Nothing') {
										if (_v2.b.$ === 'Nothing') {
											var _v3 = _v2.a;
											var _v4 = _v2.b;
											return 'max-content';
										} else {
											var _v6 = _v2.a;
											var maxSize = _v2.b.a;
											return 'minmax(max-content, ' + ($elm$core$String$fromInt(maxSize) + 'px)');
										}
									} else {
										if (_v2.b.$ === 'Nothing') {
											var minSize = _v2.a.a;
											var _v5 = _v2.b;
											return 'minmax(' + ($elm$core$String$fromInt(minSize) + ('px, ' + 'max-content)'));
										} else {
											var minSize = _v2.a.a;
											var maxSize = _v2.b.a;
											return 'minmax(' + ($elm$core$String$fromInt(minSize) + ('px, ' + ($elm$core$String$fromInt(maxSize) + 'px)')));
										}
									}
								case 'Fill':
									var i = x.a;
									var _v7 = _Utils_Tuple2(minimum, maximum);
									if (_v7.a.$ === 'Nothing') {
										if (_v7.b.$ === 'Nothing') {
											var _v8 = _v7.a;
											var _v9 = _v7.b;
											return $elm$core$String$fromInt(i) + 'fr';
										} else {
											var _v11 = _v7.a;
											var maxSize = _v7.b.a;
											return 'minmax(max-content, ' + ($elm$core$String$fromInt(maxSize) + 'px)');
										}
									} else {
										if (_v7.b.$ === 'Nothing') {
											var minSize = _v7.a.a;
											var _v10 = _v7.b;
											return 'minmax(' + ($elm$core$String$fromInt(minSize) + ('px, ' + ($elm$core$String$fromInt(i) + ('fr' + 'fr)'))));
										} else {
											var minSize = _v7.a.a;
											var maxSize = _v7.b.a;
											return 'minmax(' + ($elm$core$String$fromInt(minSize) + ('px, ' + ($elm$core$String$fromInt(maxSize) + 'px)')));
										}
									}
								case 'Min':
									var m = x.a;
									var len = x.b;
									var $temp$minimum = $elm$core$Maybe$Just(m),
										$temp$maximum = maximum,
										$temp$x = len;
									minimum = $temp$minimum;
									maximum = $temp$maximum;
									x = $temp$x;
									continue toGridLengthHelper;
								default:
									var m = x.a;
									var len = x.b;
									var $temp$minimum = minimum,
										$temp$maximum = $elm$core$Maybe$Just(m),
										$temp$x = len;
									minimum = $temp$minimum;
									maximum = $temp$maximum;
									x = $temp$x;
									continue toGridLengthHelper;
							}
						}
					});
				var toGridLength = function (x) {
					return A3(toGridLengthHelper, $elm$core$Maybe$Nothing, $elm$core$Maybe$Nothing, x);
				};
				var xSpacing = toGridLength(template.spacing.a);
				var ySpacing = toGridLength(template.spacing.b);
				var rows = function (x) {
					return 'grid-template-rows: ' + (x + ';');
				}(
					A2(
						$elm$core$String$join,
						' ',
						A2($elm$core$List$map, toGridLength, template.rows)));
				var msRows = function (x) {
					return '-ms-grid-rows: ' + (x + ';');
				}(
					A2(
						$elm$core$String$join,
						ySpacing,
						A2($elm$core$List$map, toGridLength, template.columns)));
				var msColumns = function (x) {
					return '-ms-grid-columns: ' + (x + ';');
				}(
					A2(
						$elm$core$String$join,
						ySpacing,
						A2($elm$core$List$map, toGridLength, template.columns)));
				var gapY = 'grid-row-gap:' + (toGridLength(template.spacing.b) + ';');
				var gapX = 'grid-column-gap:' + (toGridLength(template.spacing.a) + ';');
				var columns = function (x) {
					return 'grid-template-columns: ' + (x + ';');
				}(
					A2(
						$elm$core$String$join,
						' ',
						A2($elm$core$List$map, toGridLength, template.columns)));
				var _class = '.grid-rows-' + (A2(
					$elm$core$String$join,
					'-',
					A2($elm$core$List$map, $mdgriffith$elm_ui$Internal$Model$lengthClassName, template.rows)) + ('-cols-' + (A2(
					$elm$core$String$join,
					'-',
					A2($elm$core$List$map, $mdgriffith$elm_ui$Internal$Model$lengthClassName, template.columns)) + ('-space-x-' + ($mdgriffith$elm_ui$Internal$Model$lengthClassName(template.spacing.a) + ('-space-y-' + $mdgriffith$elm_ui$Internal$Model$lengthClassName(template.spacing.b)))))));
				var modernGrid = _class + ('{' + (columns + (rows + (gapX + (gapY + '}')))));
				var supports = '@supports (display:grid) {' + (modernGrid + '}');
				var base = _class + ('{' + (msColumns + (msRows + '}')));
				return _List_fromArray(
					[base, supports]);
			case 'GridPosition':
				var position = rule.a;
				var msPosition = A2(
					$elm$core$String$join,
					' ',
					_List_fromArray(
						[
							'-ms-grid-row: ' + ($elm$core$String$fromInt(position.row) + ';'),
							'-ms-grid-row-span: ' + ($elm$core$String$fromInt(position.height) + ';'),
							'-ms-grid-column: ' + ($elm$core$String$fromInt(position.col) + ';'),
							'-ms-grid-column-span: ' + ($elm$core$String$fromInt(position.width) + ';')
						]));
				var modernPosition = A2(
					$elm$core$String$join,
					' ',
					_List_fromArray(
						[
							'grid-row: ' + ($elm$core$String$fromInt(position.row) + (' / ' + ($elm$core$String$fromInt(position.row + position.height) + ';'))),
							'grid-column: ' + ($elm$core$String$fromInt(position.col) + (' / ' + ($elm$core$String$fromInt(position.col + position.width) + ';')))
						]));
				var _class = '.grid-pos-' + ($elm$core$String$fromInt(position.row) + ('-' + ($elm$core$String$fromInt(position.col) + ('-' + ($elm$core$String$fromInt(position.width) + ('-' + $elm$core$String$fromInt(position.height)))))));
				var modernGrid = _class + ('{' + (modernPosition + '}'));
				var supports = '@supports (display:grid) {' + (modernGrid + '}');
				var base = _class + ('{' + (msPosition + '}'));
				return _List_fromArray(
					[base, supports]);
			case 'PseudoSelector':
				var _class = rule.a;
				var styles = rule.b;
				var renderPseudoRule = function (style) {
					return A3(
						$mdgriffith$elm_ui$Internal$Model$renderStyleRule,
						options,
						style,
						$elm$core$Maybe$Just(_class));
				};
				return A2($elm$core$List$concatMap, renderPseudoRule, styles);
			default:
				var transform = rule.a;
				var val = $mdgriffith$elm_ui$Internal$Model$transformValue(transform);
				var _class = $mdgriffith$elm_ui$Internal$Model$transformClass(transform);
				var _v12 = _Utils_Tuple2(_class, val);
				if ((_v12.a.$ === 'Just') && (_v12.b.$ === 'Just')) {
					var cls = _v12.a.a;
					var v = _v12.b.a;
					return A4(
						$mdgriffith$elm_ui$Internal$Model$renderStyle,
						options,
						maybePseudo,
						'.' + cls,
						_List_fromArray(
							[
								A2($mdgriffith$elm_ui$Internal$Model$Property, 'transform', v)
							]));
				} else {
					return _List_Nil;
				}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$encodeStyles = F2(
	function (options, stylesheet) {
		return $elm$json$Json$Encode$object(
			A2(
				$elm$core$List$map,
				function (style) {
					var styled = A3($mdgriffith$elm_ui$Internal$Model$renderStyleRule, options, style, $elm$core$Maybe$Nothing);
					return _Utils_Tuple2(
						$mdgriffith$elm_ui$Internal$Model$getStyleName(style),
						A2($elm$json$Json$Encode$list, $elm$json$Json$Encode$string, styled));
				},
				stylesheet));
	});
var $mdgriffith$elm_ui$Internal$Model$bracket = F2(
	function (selector, rules) {
		var renderPair = function (_v0) {
			var name = _v0.a;
			var val = _v0.b;
			return name + (': ' + (val + ';'));
		};
		return selector + (' {' + (A2(
			$elm$core$String$join,
			'',
			A2($elm$core$List$map, renderPair, rules)) + '}'));
	});
var $mdgriffith$elm_ui$Internal$Model$fontRule = F3(
	function (name, modifier, _v0) {
		var parentAdj = _v0.a;
		var textAdjustment = _v0.b;
		return _List_fromArray(
			[
				A2($mdgriffith$elm_ui$Internal$Model$bracket, '.' + (name + ('.' + (modifier + (', ' + ('.' + (name + (' .' + modifier))))))), parentAdj),
				A2($mdgriffith$elm_ui$Internal$Model$bracket, '.' + (name + ('.' + (modifier + ('> .' + ($mdgriffith$elm_ui$Internal$Style$classes.text + (', .' + (name + (' .' + (modifier + (' > .' + $mdgriffith$elm_ui$Internal$Style$classes.text)))))))))), textAdjustment)
			]);
	});
var $mdgriffith$elm_ui$Internal$Model$renderFontAdjustmentRule = F3(
	function (fontToAdjust, _v0, otherFontName) {
		var full = _v0.a;
		var capital = _v0.b;
		var name = _Utils_eq(fontToAdjust, otherFontName) ? fontToAdjust : (otherFontName + (' .' + fontToAdjust));
		return A2(
			$elm$core$String$join,
			' ',
			_Utils_ap(
				A3($mdgriffith$elm_ui$Internal$Model$fontRule, name, $mdgriffith$elm_ui$Internal$Style$classes.sizeByCapital, capital),
				A3($mdgriffith$elm_ui$Internal$Model$fontRule, name, $mdgriffith$elm_ui$Internal$Style$classes.fullSize, full)));
	});
var $mdgriffith$elm_ui$Internal$Model$renderNullAdjustmentRule = F2(
	function (fontToAdjust, otherFontName) {
		var name = _Utils_eq(fontToAdjust, otherFontName) ? fontToAdjust : (otherFontName + (' .' + fontToAdjust));
		return A2(
			$elm$core$String$join,
			' ',
			_List_fromArray(
				[
					A2(
					$mdgriffith$elm_ui$Internal$Model$bracket,
					'.' + (name + ('.' + ($mdgriffith$elm_ui$Internal$Style$classes.sizeByCapital + (', ' + ('.' + (name + (' .' + $mdgriffith$elm_ui$Internal$Style$classes.sizeByCapital))))))),
					_List_fromArray(
						[
							_Utils_Tuple2('line-height', '1')
						])),
					A2(
					$mdgriffith$elm_ui$Internal$Model$bracket,
					'.' + (name + ('.' + ($mdgriffith$elm_ui$Internal$Style$classes.sizeByCapital + ('> .' + ($mdgriffith$elm_ui$Internal$Style$classes.text + (', .' + (name + (' .' + ($mdgriffith$elm_ui$Internal$Style$classes.sizeByCapital + (' > .' + $mdgriffith$elm_ui$Internal$Style$classes.text)))))))))),
					_List_fromArray(
						[
							_Utils_Tuple2('vertical-align', '0'),
							_Utils_Tuple2('line-height', '1')
						]))
				]));
	});
var $mdgriffith$elm_ui$Internal$Model$adjust = F3(
	function (size, height, vertical) {
		return {height: height / size, size: size, vertical: vertical};
	});
var $elm$core$List$filter = F2(
	function (isGood, list) {
		return A3(
			$elm$core$List$foldr,
			F2(
				function (x, xs) {
					return isGood(x) ? A2($elm$core$List$cons, x, xs) : xs;
				}),
			_List_Nil,
			list);
	});
var $elm$core$List$maximum = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(
			A3($elm$core$List$foldl, $elm$core$Basics$max, x, xs));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$List$minimum = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(
			A3($elm$core$List$foldl, $elm$core$Basics$min, x, xs));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Basics$neq = _Utils_notEqual;
var $mdgriffith$elm_ui$Internal$Model$convertAdjustment = function (adjustment) {
	var lines = _List_fromArray(
		[adjustment.capital, adjustment.baseline, adjustment.descender, adjustment.lowercase]);
	var lineHeight = 1.5;
	var normalDescender = (lineHeight - 1) / 2;
	var oldMiddle = lineHeight / 2;
	var descender = A2(
		$elm$core$Maybe$withDefault,
		adjustment.descender,
		$elm$core$List$minimum(lines));
	var newBaseline = A2(
		$elm$core$Maybe$withDefault,
		adjustment.baseline,
		$elm$core$List$minimum(
			A2(
				$elm$core$List$filter,
				function (x) {
					return !_Utils_eq(x, descender);
				},
				lines)));
	var base = lineHeight;
	var ascender = A2(
		$elm$core$Maybe$withDefault,
		adjustment.capital,
		$elm$core$List$maximum(lines));
	var capitalSize = 1 / (ascender - newBaseline);
	var capitalVertical = 1 - ascender;
	var fullSize = 1 / (ascender - descender);
	var fullVertical = 1 - ascender;
	var newCapitalMiddle = ((ascender - newBaseline) / 2) + newBaseline;
	var newFullMiddle = ((ascender - descender) / 2) + descender;
	return {
		capital: A3($mdgriffith$elm_ui$Internal$Model$adjust, capitalSize, ascender - newBaseline, capitalVertical),
		full: A3($mdgriffith$elm_ui$Internal$Model$adjust, fullSize, ascender - descender, fullVertical)
	};
};
var $mdgriffith$elm_ui$Internal$Model$fontAdjustmentRules = function (converted) {
	return _Utils_Tuple2(
		_List_fromArray(
			[
				_Utils_Tuple2('display', 'block')
			]),
		_List_fromArray(
			[
				_Utils_Tuple2('display', 'inline-block'),
				_Utils_Tuple2(
				'line-height',
				$elm$core$String$fromFloat(converted.height)),
				_Utils_Tuple2(
				'vertical-align',
				$elm$core$String$fromFloat(converted.vertical) + 'em'),
				_Utils_Tuple2(
				'font-size',
				$elm$core$String$fromFloat(converted.size) + 'em')
			]));
};
var $mdgriffith$elm_ui$Internal$Model$typefaceAdjustment = function (typefaces) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (face, found) {
				if (found.$ === 'Nothing') {
					if (face.$ === 'FontWith') {
						var _with = face.a;
						var _v2 = _with.adjustment;
						if (_v2.$ === 'Nothing') {
							return found;
						} else {
							var adjustment = _v2.a;
							return $elm$core$Maybe$Just(
								_Utils_Tuple2(
									$mdgriffith$elm_ui$Internal$Model$fontAdjustmentRules(
										function ($) {
											return $.full;
										}(
											$mdgriffith$elm_ui$Internal$Model$convertAdjustment(adjustment))),
									$mdgriffith$elm_ui$Internal$Model$fontAdjustmentRules(
										function ($) {
											return $.capital;
										}(
											$mdgriffith$elm_ui$Internal$Model$convertAdjustment(adjustment)))));
						}
					} else {
						return found;
					}
				} else {
					return found;
				}
			}),
		$elm$core$Maybe$Nothing,
		typefaces);
};
var $mdgriffith$elm_ui$Internal$Model$renderTopLevelValues = function (rules) {
	var withImport = function (font) {
		if (font.$ === 'ImportFont') {
			var url = font.b;
			return $elm$core$Maybe$Just('@import url(\'' + (url + '\');'));
		} else {
			return $elm$core$Maybe$Nothing;
		}
	};
	var fontImports = function (_v2) {
		var name = _v2.a;
		var typefaces = _v2.b;
		var imports = A2(
			$elm$core$String$join,
			'\n',
			A2($elm$core$List$filterMap, withImport, typefaces));
		return imports;
	};
	var allNames = A2($elm$core$List$map, $elm$core$Tuple$first, rules);
	var fontAdjustments = function (_v1) {
		var name = _v1.a;
		var typefaces = _v1.b;
		var _v0 = $mdgriffith$elm_ui$Internal$Model$typefaceAdjustment(typefaces);
		if (_v0.$ === 'Nothing') {
			return A2(
				$elm$core$String$join,
				'',
				A2(
					$elm$core$List$map,
					$mdgriffith$elm_ui$Internal$Model$renderNullAdjustmentRule(name),
					allNames));
		} else {
			var adjustment = _v0.a;
			return A2(
				$elm$core$String$join,
				'',
				A2(
					$elm$core$List$map,
					A2($mdgriffith$elm_ui$Internal$Model$renderFontAdjustmentRule, name, adjustment),
					allNames));
		}
	};
	return _Utils_ap(
		A2(
			$elm$core$String$join,
			'\n',
			A2($elm$core$List$map, fontImports, rules)),
		A2(
			$elm$core$String$join,
			'\n',
			A2($elm$core$List$map, fontAdjustments, rules)));
};
var $mdgriffith$elm_ui$Internal$Model$topLevelValue = function (rule) {
	if (rule.$ === 'FontFamily') {
		var name = rule.a;
		var typefaces = rule.b;
		return $elm$core$Maybe$Just(
			_Utils_Tuple2(name, typefaces));
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $mdgriffith$elm_ui$Internal$Model$toStyleSheetString = F2(
	function (options, stylesheet) {
		var combine = F2(
			function (style, rendered) {
				return {
					rules: _Utils_ap(
						rendered.rules,
						A3($mdgriffith$elm_ui$Internal$Model$renderStyleRule, options, style, $elm$core$Maybe$Nothing)),
					topLevel: function () {
						var _v1 = $mdgriffith$elm_ui$Internal$Model$topLevelValue(style);
						if (_v1.$ === 'Nothing') {
							return rendered.topLevel;
						} else {
							var topLevel = _v1.a;
							return A2($elm$core$List$cons, topLevel, rendered.topLevel);
						}
					}()
				};
			});
		var _v0 = A3(
			$elm$core$List$foldl,
			combine,
			{rules: _List_Nil, topLevel: _List_Nil},
			stylesheet);
		var topLevel = _v0.topLevel;
		var rules = _v0.rules;
		return _Utils_ap(
			$mdgriffith$elm_ui$Internal$Model$renderTopLevelValues(topLevel),
			$elm$core$String$concat(rules));
	});
var $mdgriffith$elm_ui$Internal$Model$toStyleSheet = F2(
	function (options, styleSheet) {
		var _v0 = options.mode;
		switch (_v0.$) {
			case 'Layout':
				return A3(
					$elm$virtual_dom$VirtualDom$node,
					'div',
					_List_Nil,
					_List_fromArray(
						[
							A3(
							$elm$virtual_dom$VirtualDom$node,
							'style',
							_List_Nil,
							_List_fromArray(
								[
									$elm$virtual_dom$VirtualDom$text(
									A2($mdgriffith$elm_ui$Internal$Model$toStyleSheetString, options, styleSheet))
								]))
						]));
			case 'NoStaticStyleSheet':
				return A3(
					$elm$virtual_dom$VirtualDom$node,
					'div',
					_List_Nil,
					_List_fromArray(
						[
							A3(
							$elm$virtual_dom$VirtualDom$node,
							'style',
							_List_Nil,
							_List_fromArray(
								[
									$elm$virtual_dom$VirtualDom$text(
									A2($mdgriffith$elm_ui$Internal$Model$toStyleSheetString, options, styleSheet))
								]))
						]));
			default:
				return A3(
					$elm$virtual_dom$VirtualDom$node,
					'elm-ui-rules',
					_List_fromArray(
						[
							A2(
							$elm$virtual_dom$VirtualDom$property,
							'rules',
							A2($mdgriffith$elm_ui$Internal$Model$encodeStyles, options, styleSheet))
						]),
					_List_Nil);
		}
	});
var $mdgriffith$elm_ui$Internal$Model$embedKeyed = F4(
	function (_static, opts, styles, children) {
		var dynamicStyleSheet = A2(
			$mdgriffith$elm_ui$Internal$Model$toStyleSheet,
			opts,
			A3(
				$elm$core$List$foldl,
				$mdgriffith$elm_ui$Internal$Model$reduceStyles,
				_Utils_Tuple2(
					$elm$core$Set$empty,
					$mdgriffith$elm_ui$Internal$Model$renderFocusStyle(opts.focus)),
				styles).b);
		return _static ? A2(
			$elm$core$List$cons,
			_Utils_Tuple2(
				'static-stylesheet',
				$mdgriffith$elm_ui$Internal$Model$staticRoot(opts)),
			A2(
				$elm$core$List$cons,
				_Utils_Tuple2('dynamic-stylesheet', dynamicStyleSheet),
				children)) : A2(
			$elm$core$List$cons,
			_Utils_Tuple2('dynamic-stylesheet', dynamicStyleSheet),
			children);
	});
var $mdgriffith$elm_ui$Internal$Model$embedWith = F4(
	function (_static, opts, styles, children) {
		var dynamicStyleSheet = A2(
			$mdgriffith$elm_ui$Internal$Model$toStyleSheet,
			opts,
			A3(
				$elm$core$List$foldl,
				$mdgriffith$elm_ui$Internal$Model$reduceStyles,
				_Utils_Tuple2(
					$elm$core$Set$empty,
					$mdgriffith$elm_ui$Internal$Model$renderFocusStyle(opts.focus)),
				styles).b);
		return _static ? A2(
			$elm$core$List$cons,
			$mdgriffith$elm_ui$Internal$Model$staticRoot(opts),
			A2($elm$core$List$cons, dynamicStyleSheet, children)) : A2($elm$core$List$cons, dynamicStyleSheet, children);
	});
var $mdgriffith$elm_ui$Internal$Flag$heightBetween = $mdgriffith$elm_ui$Internal$Flag$flag(45);
var $mdgriffith$elm_ui$Internal$Flag$heightFill = $mdgriffith$elm_ui$Internal$Flag$flag(37);
var $elm$virtual_dom$VirtualDom$keyedNode = function (tag) {
	return _VirtualDom_keyedNode(
		_VirtualDom_noScript(tag));
};
var $elm$core$Basics$not = _Basics_not;
var $elm$html$Html$p = _VirtualDom_node('p');
var $elm$core$Bitwise$and = _Bitwise_and;
var $mdgriffith$elm_ui$Internal$Flag$present = F2(
	function (myFlag, _v0) {
		var fieldOne = _v0.a;
		var fieldTwo = _v0.b;
		if (myFlag.$ === 'Flag') {
			var first = myFlag.a;
			return _Utils_eq(first & fieldOne, first);
		} else {
			var second = myFlag.a;
			return _Utils_eq(second & fieldTwo, second);
		}
	});
var $elm$html$Html$s = _VirtualDom_node('s');
var $elm$html$Html$u = _VirtualDom_node('u');
var $mdgriffith$elm_ui$Internal$Flag$widthBetween = $mdgriffith$elm_ui$Internal$Flag$flag(44);
var $mdgriffith$elm_ui$Internal$Flag$widthFill = $mdgriffith$elm_ui$Internal$Flag$flag(39);
var $mdgriffith$elm_ui$Internal$Model$finalizeNode = F6(
	function (has, node, attributes, children, embedMode, parentContext) {
		var createNode = F2(
			function (nodeName, attrs) {
				if (children.$ === 'Keyed') {
					var keyed = children.a;
					return A3(
						$elm$virtual_dom$VirtualDom$keyedNode,
						nodeName,
						attrs,
						function () {
							switch (embedMode.$) {
								case 'NoStyleSheet':
									return keyed;
								case 'OnlyDynamic':
									var opts = embedMode.a;
									var styles = embedMode.b;
									return A4($mdgriffith$elm_ui$Internal$Model$embedKeyed, false, opts, styles, keyed);
								default:
									var opts = embedMode.a;
									var styles = embedMode.b;
									return A4($mdgriffith$elm_ui$Internal$Model$embedKeyed, true, opts, styles, keyed);
							}
						}());
				} else {
					var unkeyed = children.a;
					return A2(
						function () {
							switch (nodeName) {
								case 'div':
									return $elm$html$Html$div;
								case 'p':
									return $elm$html$Html$p;
								default:
									return $elm$virtual_dom$VirtualDom$node(nodeName);
							}
						}(),
						attrs,
						function () {
							switch (embedMode.$) {
								case 'NoStyleSheet':
									return unkeyed;
								case 'OnlyDynamic':
									var opts = embedMode.a;
									var styles = embedMode.b;
									return A4($mdgriffith$elm_ui$Internal$Model$embedWith, false, opts, styles, unkeyed);
								default:
									var opts = embedMode.a;
									var styles = embedMode.b;
									return A4($mdgriffith$elm_ui$Internal$Model$embedWith, true, opts, styles, unkeyed);
							}
						}());
				}
			});
		var html = function () {
			switch (node.$) {
				case 'Generic':
					return A2(createNode, 'div', attributes);
				case 'NodeName':
					var nodeName = node.a;
					return A2(createNode, nodeName, attributes);
				default:
					var nodeName = node.a;
					var internal = node.b;
					return A3(
						$elm$virtual_dom$VirtualDom$node,
						nodeName,
						attributes,
						_List_fromArray(
							[
								A2(
								createNode,
								internal,
								_List_fromArray(
									[
										$elm$html$Html$Attributes$class($mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.single))
									]))
							]));
			}
		}();
		switch (parentContext.$) {
			case 'AsRow':
				return (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$widthFill, has) && (!A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$widthBetween, has))) ? html : (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$alignRight, has) ? A2(
					$elm$html$Html$u,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class(
							A2(
								$elm$core$String$join,
								' ',
								_List_fromArray(
									[$mdgriffith$elm_ui$Internal$Style$classes.any, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.container, $mdgriffith$elm_ui$Internal$Style$classes.contentCenterY, $mdgriffith$elm_ui$Internal$Style$classes.alignContainerRight])))
						]),
					_List_fromArray(
						[html])) : (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$centerX, has) ? A2(
					$elm$html$Html$s,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class(
							A2(
								$elm$core$String$join,
								' ',
								_List_fromArray(
									[$mdgriffith$elm_ui$Internal$Style$classes.any, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.container, $mdgriffith$elm_ui$Internal$Style$classes.contentCenterY, $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterX])))
						]),
					_List_fromArray(
						[html])) : html));
			case 'AsColumn':
				return (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$heightFill, has) && (!A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$heightBetween, has))) ? html : (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$centerY, has) ? A2(
					$elm$html$Html$s,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class(
							A2(
								$elm$core$String$join,
								' ',
								_List_fromArray(
									[$mdgriffith$elm_ui$Internal$Style$classes.any, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.container, $mdgriffith$elm_ui$Internal$Style$classes.alignContainerCenterY])))
						]),
					_List_fromArray(
						[html])) : (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$alignBottom, has) ? A2(
					$elm$html$Html$u,
					_List_fromArray(
						[
							$elm$html$Html$Attributes$class(
							A2(
								$elm$core$String$join,
								' ',
								_List_fromArray(
									[$mdgriffith$elm_ui$Internal$Style$classes.any, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.container, $mdgriffith$elm_ui$Internal$Style$classes.alignContainerBottom])))
						]),
					_List_fromArray(
						[html])) : html));
			default:
				return html;
		}
	});
var $elm$core$List$isEmpty = function (xs) {
	if (!xs.b) {
		return true;
	} else {
		return false;
	}
};
var $elm$html$Html$text = $elm$virtual_dom$VirtualDom$text;
var $mdgriffith$elm_ui$Internal$Model$textElementClasses = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + ($mdgriffith$elm_ui$Internal$Style$classes.text + (' ' + ($mdgriffith$elm_ui$Internal$Style$classes.widthContent + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.heightContent)))));
var $mdgriffith$elm_ui$Internal$Model$textElement = function (str) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class($mdgriffith$elm_ui$Internal$Model$textElementClasses)
			]),
		_List_fromArray(
			[
				$elm$html$Html$text(str)
			]));
};
var $mdgriffith$elm_ui$Internal$Model$textElementFillClasses = $mdgriffith$elm_ui$Internal$Style$classes.any + (' ' + ($mdgriffith$elm_ui$Internal$Style$classes.text + (' ' + ($mdgriffith$elm_ui$Internal$Style$classes.widthFill + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.heightFill)))));
var $mdgriffith$elm_ui$Internal$Model$textElementFill = function (str) {
	return A2(
		$elm$html$Html$div,
		_List_fromArray(
			[
				$elm$html$Html$Attributes$class($mdgriffith$elm_ui$Internal$Model$textElementFillClasses)
			]),
		_List_fromArray(
			[
				$elm$html$Html$text(str)
			]));
};
var $mdgriffith$elm_ui$Internal$Model$createElement = F3(
	function (context, children, rendered) {
		var gatherKeyed = F2(
			function (_v8, _v9) {
				var key = _v8.a;
				var child = _v8.b;
				var htmls = _v9.a;
				var existingStyles = _v9.b;
				switch (child.$) {
					case 'Unstyled':
						var html = child.a;
						return _Utils_eq(context, $mdgriffith$elm_ui$Internal$Model$asParagraph) ? _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								_Utils_Tuple2(
									key,
									html(context)),
								htmls),
							existingStyles) : _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								_Utils_Tuple2(
									key,
									html(context)),
								htmls),
							existingStyles);
					case 'Styled':
						var styled = child.a;
						return _Utils_eq(context, $mdgriffith$elm_ui$Internal$Model$asParagraph) ? _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								_Utils_Tuple2(
									key,
									A2(styled.html, $mdgriffith$elm_ui$Internal$Model$NoStyleSheet, context)),
								htmls),
							$elm$core$List$isEmpty(existingStyles) ? styled.styles : _Utils_ap(styled.styles, existingStyles)) : _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								_Utils_Tuple2(
									key,
									A2(styled.html, $mdgriffith$elm_ui$Internal$Model$NoStyleSheet, context)),
								htmls),
							$elm$core$List$isEmpty(existingStyles) ? styled.styles : _Utils_ap(styled.styles, existingStyles));
					case 'Text':
						var str = child.a;
						return _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								_Utils_Tuple2(
									key,
									_Utils_eq(context, $mdgriffith$elm_ui$Internal$Model$asEl) ? $mdgriffith$elm_ui$Internal$Model$textElementFill(str) : $mdgriffith$elm_ui$Internal$Model$textElement(str)),
								htmls),
							existingStyles);
					default:
						return _Utils_Tuple2(htmls, existingStyles);
				}
			});
		var gather = F2(
			function (child, _v6) {
				var htmls = _v6.a;
				var existingStyles = _v6.b;
				switch (child.$) {
					case 'Unstyled':
						var html = child.a;
						return _Utils_eq(context, $mdgriffith$elm_ui$Internal$Model$asParagraph) ? _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								html(context),
								htmls),
							existingStyles) : _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								html(context),
								htmls),
							existingStyles);
					case 'Styled':
						var styled = child.a;
						return _Utils_eq(context, $mdgriffith$elm_ui$Internal$Model$asParagraph) ? _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								A2(styled.html, $mdgriffith$elm_ui$Internal$Model$NoStyleSheet, context),
								htmls),
							$elm$core$List$isEmpty(existingStyles) ? styled.styles : _Utils_ap(styled.styles, existingStyles)) : _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								A2(styled.html, $mdgriffith$elm_ui$Internal$Model$NoStyleSheet, context),
								htmls),
							$elm$core$List$isEmpty(existingStyles) ? styled.styles : _Utils_ap(styled.styles, existingStyles));
					case 'Text':
						var str = child.a;
						return _Utils_Tuple2(
							A2(
								$elm$core$List$cons,
								_Utils_eq(context, $mdgriffith$elm_ui$Internal$Model$asEl) ? $mdgriffith$elm_ui$Internal$Model$textElementFill(str) : $mdgriffith$elm_ui$Internal$Model$textElement(str),
								htmls),
							existingStyles);
					default:
						return _Utils_Tuple2(htmls, existingStyles);
				}
			});
		if (children.$ === 'Keyed') {
			var keyedChildren = children.a;
			var _v1 = A3(
				$elm$core$List$foldr,
				gatherKeyed,
				_Utils_Tuple2(_List_Nil, _List_Nil),
				keyedChildren);
			var keyed = _v1.a;
			var styles = _v1.b;
			var newStyles = $elm$core$List$isEmpty(styles) ? rendered.styles : _Utils_ap(rendered.styles, styles);
			if (!newStyles.b) {
				return $mdgriffith$elm_ui$Internal$Model$Unstyled(
					A5(
						$mdgriffith$elm_ui$Internal$Model$finalizeNode,
						rendered.has,
						rendered.node,
						rendered.attributes,
						$mdgriffith$elm_ui$Internal$Model$Keyed(
							A3($mdgriffith$elm_ui$Internal$Model$addKeyedChildren, 'nearby-element-pls', keyed, rendered.children)),
						$mdgriffith$elm_ui$Internal$Model$NoStyleSheet));
			} else {
				var allStyles = newStyles;
				return $mdgriffith$elm_ui$Internal$Model$Styled(
					{
						html: A4(
							$mdgriffith$elm_ui$Internal$Model$finalizeNode,
							rendered.has,
							rendered.node,
							rendered.attributes,
							$mdgriffith$elm_ui$Internal$Model$Keyed(
								A3($mdgriffith$elm_ui$Internal$Model$addKeyedChildren, 'nearby-element-pls', keyed, rendered.children))),
						styles: allStyles
					});
			}
		} else {
			var unkeyedChildren = children.a;
			var _v3 = A3(
				$elm$core$List$foldr,
				gather,
				_Utils_Tuple2(_List_Nil, _List_Nil),
				unkeyedChildren);
			var unkeyed = _v3.a;
			var styles = _v3.b;
			var newStyles = $elm$core$List$isEmpty(styles) ? rendered.styles : _Utils_ap(rendered.styles, styles);
			if (!newStyles.b) {
				return $mdgriffith$elm_ui$Internal$Model$Unstyled(
					A5(
						$mdgriffith$elm_ui$Internal$Model$finalizeNode,
						rendered.has,
						rendered.node,
						rendered.attributes,
						$mdgriffith$elm_ui$Internal$Model$Unkeyed(
							A2($mdgriffith$elm_ui$Internal$Model$addChildren, unkeyed, rendered.children)),
						$mdgriffith$elm_ui$Internal$Model$NoStyleSheet));
			} else {
				var allStyles = newStyles;
				return $mdgriffith$elm_ui$Internal$Model$Styled(
					{
						html: A4(
							$mdgriffith$elm_ui$Internal$Model$finalizeNode,
							rendered.has,
							rendered.node,
							rendered.attributes,
							$mdgriffith$elm_ui$Internal$Model$Unkeyed(
								A2($mdgriffith$elm_ui$Internal$Model$addChildren, unkeyed, rendered.children))),
						styles: allStyles
					});
			}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$Single = F3(
	function (a, b, c) {
		return {$: 'Single', a: a, b: b, c: c};
	});
var $mdgriffith$elm_ui$Internal$Model$Transform = function (a) {
	return {$: 'Transform', a: a};
};
var $mdgriffith$elm_ui$Internal$Flag$Field = F2(
	function (a, b) {
		return {$: 'Field', a: a, b: b};
	});
var $elm$core$Bitwise$or = _Bitwise_or;
var $mdgriffith$elm_ui$Internal$Flag$add = F2(
	function (myFlag, _v0) {
		var one = _v0.a;
		var two = _v0.b;
		if (myFlag.$ === 'Flag') {
			var first = myFlag.a;
			return A2($mdgriffith$elm_ui$Internal$Flag$Field, first | one, two);
		} else {
			var second = myFlag.a;
			return A2($mdgriffith$elm_ui$Internal$Flag$Field, one, second | two);
		}
	});
var $mdgriffith$elm_ui$Internal$Model$ChildrenBehind = function (a) {
	return {$: 'ChildrenBehind', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$ChildrenBehindAndInFront = F2(
	function (a, b) {
		return {$: 'ChildrenBehindAndInFront', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$ChildrenInFront = function (a) {
	return {$: 'ChildrenInFront', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$nearbyElement = F2(
	function (location, elem) {
		return A2(
			$elm$html$Html$div,
			_List_fromArray(
				[
					$elm$html$Html$Attributes$class(
					function () {
						switch (location.$) {
							case 'Above':
								return A2(
									$elm$core$String$join,
									' ',
									_List_fromArray(
										[$mdgriffith$elm_ui$Internal$Style$classes.nearby, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.above]));
							case 'Below':
								return A2(
									$elm$core$String$join,
									' ',
									_List_fromArray(
										[$mdgriffith$elm_ui$Internal$Style$classes.nearby, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.below]));
							case 'OnRight':
								return A2(
									$elm$core$String$join,
									' ',
									_List_fromArray(
										[$mdgriffith$elm_ui$Internal$Style$classes.nearby, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.onRight]));
							case 'OnLeft':
								return A2(
									$elm$core$String$join,
									' ',
									_List_fromArray(
										[$mdgriffith$elm_ui$Internal$Style$classes.nearby, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.onLeft]));
							case 'InFront':
								return A2(
									$elm$core$String$join,
									' ',
									_List_fromArray(
										[$mdgriffith$elm_ui$Internal$Style$classes.nearby, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.inFront]));
							default:
								return A2(
									$elm$core$String$join,
									' ',
									_List_fromArray(
										[$mdgriffith$elm_ui$Internal$Style$classes.nearby, $mdgriffith$elm_ui$Internal$Style$classes.single, $mdgriffith$elm_ui$Internal$Style$classes.behind]));
						}
					}())
				]),
			_List_fromArray(
				[
					function () {
					switch (elem.$) {
						case 'Empty':
							return $elm$virtual_dom$VirtualDom$text('');
						case 'Text':
							var str = elem.a;
							return $mdgriffith$elm_ui$Internal$Model$textElement(str);
						case 'Unstyled':
							var html = elem.a;
							return html($mdgriffith$elm_ui$Internal$Model$asEl);
						default:
							var styled = elem.a;
							return A2(styled.html, $mdgriffith$elm_ui$Internal$Model$NoStyleSheet, $mdgriffith$elm_ui$Internal$Model$asEl);
					}
				}()
				]));
	});
var $mdgriffith$elm_ui$Internal$Model$addNearbyElement = F3(
	function (location, elem, existing) {
		var nearby = A2($mdgriffith$elm_ui$Internal$Model$nearbyElement, location, elem);
		switch (existing.$) {
			case 'NoNearbyChildren':
				if (location.$ === 'Behind') {
					return $mdgriffith$elm_ui$Internal$Model$ChildrenBehind(
						_List_fromArray(
							[nearby]));
				} else {
					return $mdgriffith$elm_ui$Internal$Model$ChildrenInFront(
						_List_fromArray(
							[nearby]));
				}
			case 'ChildrenBehind':
				var existingBehind = existing.a;
				if (location.$ === 'Behind') {
					return $mdgriffith$elm_ui$Internal$Model$ChildrenBehind(
						A2($elm$core$List$cons, nearby, existingBehind));
				} else {
					return A2(
						$mdgriffith$elm_ui$Internal$Model$ChildrenBehindAndInFront,
						existingBehind,
						_List_fromArray(
							[nearby]));
				}
			case 'ChildrenInFront':
				var existingInFront = existing.a;
				if (location.$ === 'Behind') {
					return A2(
						$mdgriffith$elm_ui$Internal$Model$ChildrenBehindAndInFront,
						_List_fromArray(
							[nearby]),
						existingInFront);
				} else {
					return $mdgriffith$elm_ui$Internal$Model$ChildrenInFront(
						A2($elm$core$List$cons, nearby, existingInFront));
				}
			default:
				var existingBehind = existing.a;
				var existingInFront = existing.b;
				if (location.$ === 'Behind') {
					return A2(
						$mdgriffith$elm_ui$Internal$Model$ChildrenBehindAndInFront,
						A2($elm$core$List$cons, nearby, existingBehind),
						existingInFront);
				} else {
					return A2(
						$mdgriffith$elm_ui$Internal$Model$ChildrenBehindAndInFront,
						existingBehind,
						A2($elm$core$List$cons, nearby, existingInFront));
				}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$Embedded = F2(
	function (a, b) {
		return {$: 'Embedded', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$NodeName = function (a) {
	return {$: 'NodeName', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$addNodeName = F2(
	function (newNode, old) {
		switch (old.$) {
			case 'Generic':
				return $mdgriffith$elm_ui$Internal$Model$NodeName(newNode);
			case 'NodeName':
				var name = old.a;
				return A2($mdgriffith$elm_ui$Internal$Model$Embedded, name, newNode);
			default:
				var x = old.a;
				var y = old.b;
				return A2($mdgriffith$elm_ui$Internal$Model$Embedded, x, y);
		}
	});
var $mdgriffith$elm_ui$Internal$Model$alignXName = function (align) {
	switch (align.$) {
		case 'Left':
			return $mdgriffith$elm_ui$Internal$Style$classes.alignedHorizontally + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.alignLeft);
		case 'Right':
			return $mdgriffith$elm_ui$Internal$Style$classes.alignedHorizontally + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.alignRight);
		default:
			return $mdgriffith$elm_ui$Internal$Style$classes.alignedHorizontally + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.alignCenterX);
	}
};
var $mdgriffith$elm_ui$Internal$Model$alignYName = function (align) {
	switch (align.$) {
		case 'Top':
			return $mdgriffith$elm_ui$Internal$Style$classes.alignedVertically + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.alignTop);
		case 'Bottom':
			return $mdgriffith$elm_ui$Internal$Style$classes.alignedVertically + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.alignBottom);
		default:
			return $mdgriffith$elm_ui$Internal$Style$classes.alignedVertically + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.alignCenterY);
	}
};
var $elm$virtual_dom$VirtualDom$attribute = F2(
	function (key, value) {
		return A2(
			_VirtualDom_attribute,
			_VirtualDom_noOnOrFormAction(key),
			_VirtualDom_noJavaScriptOrHtmlUri(value));
	});
var $mdgriffith$elm_ui$Internal$Model$FullTransform = F4(
	function (a, b, c, d) {
		return {$: 'FullTransform', a: a, b: b, c: c, d: d};
	});
var $mdgriffith$elm_ui$Internal$Model$Moved = function (a) {
	return {$: 'Moved', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$composeTransformation = F2(
	function (transform, component) {
		switch (transform.$) {
			case 'Untransformed':
				switch (component.$) {
					case 'MoveX':
						var x = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(
							_Utils_Tuple3(x, 0, 0));
					case 'MoveY':
						var y = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(
							_Utils_Tuple3(0, y, 0));
					case 'MoveZ':
						var z = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(
							_Utils_Tuple3(0, 0, z));
					case 'MoveXYZ':
						var xyz = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(xyz);
					case 'Rotate':
						var xyz = component.a;
						var angle = component.b;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							_Utils_Tuple3(0, 0, 0),
							_Utils_Tuple3(1, 1, 1),
							xyz,
							angle);
					default:
						var xyz = component.a;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							_Utils_Tuple3(0, 0, 0),
							xyz,
							_Utils_Tuple3(0, 0, 1),
							0);
				}
			case 'Moved':
				var moved = transform.a;
				var x = moved.a;
				var y = moved.b;
				var z = moved.c;
				switch (component.$) {
					case 'MoveX':
						var newX = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(
							_Utils_Tuple3(newX, y, z));
					case 'MoveY':
						var newY = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(
							_Utils_Tuple3(x, newY, z));
					case 'MoveZ':
						var newZ = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(
							_Utils_Tuple3(x, y, newZ));
					case 'MoveXYZ':
						var xyz = component.a;
						return $mdgriffith$elm_ui$Internal$Model$Moved(xyz);
					case 'Rotate':
						var xyz = component.a;
						var angle = component.b;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							moved,
							_Utils_Tuple3(1, 1, 1),
							xyz,
							angle);
					default:
						var scale = component.a;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							moved,
							scale,
							_Utils_Tuple3(0, 0, 1),
							0);
				}
			default:
				var moved = transform.a;
				var x = moved.a;
				var y = moved.b;
				var z = moved.c;
				var scaled = transform.b;
				var origin = transform.c;
				var angle = transform.d;
				switch (component.$) {
					case 'MoveX':
						var newX = component.a;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							_Utils_Tuple3(newX, y, z),
							scaled,
							origin,
							angle);
					case 'MoveY':
						var newY = component.a;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							_Utils_Tuple3(x, newY, z),
							scaled,
							origin,
							angle);
					case 'MoveZ':
						var newZ = component.a;
						return A4(
							$mdgriffith$elm_ui$Internal$Model$FullTransform,
							_Utils_Tuple3(x, y, newZ),
							scaled,
							origin,
							angle);
					case 'MoveXYZ':
						var newMove = component.a;
						return A4($mdgriffith$elm_ui$Internal$Model$FullTransform, newMove, scaled, origin, angle);
					case 'Rotate':
						var newOrigin = component.a;
						var newAngle = component.b;
						return A4($mdgriffith$elm_ui$Internal$Model$FullTransform, moved, scaled, newOrigin, newAngle);
					default:
						var newScale = component.a;
						return A4($mdgriffith$elm_ui$Internal$Model$FullTransform, moved, newScale, origin, angle);
				}
		}
	});
var $mdgriffith$elm_ui$Internal$Flag$height = $mdgriffith$elm_ui$Internal$Flag$flag(7);
var $mdgriffith$elm_ui$Internal$Flag$heightContent = $mdgriffith$elm_ui$Internal$Flag$flag(36);
var $mdgriffith$elm_ui$Internal$Flag$merge = F2(
	function (_v0, _v1) {
		var one = _v0.a;
		var two = _v0.b;
		var three = _v1.a;
		var four = _v1.b;
		return A2($mdgriffith$elm_ui$Internal$Flag$Field, one | three, two | four);
	});
var $mdgriffith$elm_ui$Internal$Flag$none = A2($mdgriffith$elm_ui$Internal$Flag$Field, 0, 0);
var $mdgriffith$elm_ui$Internal$Model$renderHeight = function (h) {
	switch (h.$) {
		case 'Px':
			var px = h.a;
			var val = $elm$core$String$fromInt(px);
			var name = 'height-px-' + val;
			return _Utils_Tuple3(
				$mdgriffith$elm_ui$Internal$Flag$none,
				$mdgriffith$elm_ui$Internal$Style$classes.heightExact + (' ' + name),
				_List_fromArray(
					[
						A3($mdgriffith$elm_ui$Internal$Model$Single, name, 'height', val + 'px')
					]));
		case 'Content':
			return _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$heightContent, $mdgriffith$elm_ui$Internal$Flag$none),
				$mdgriffith$elm_ui$Internal$Style$classes.heightContent,
				_List_Nil);
		case 'Fill':
			var portion = h.a;
			return (portion === 1) ? _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$heightFill, $mdgriffith$elm_ui$Internal$Flag$none),
				$mdgriffith$elm_ui$Internal$Style$classes.heightFill,
				_List_Nil) : _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$heightFill, $mdgriffith$elm_ui$Internal$Flag$none),
				$mdgriffith$elm_ui$Internal$Style$classes.heightFillPortion + (' height-fill-' + $elm$core$String$fromInt(portion)),
				_List_fromArray(
					[
						A3(
						$mdgriffith$elm_ui$Internal$Model$Single,
						$mdgriffith$elm_ui$Internal$Style$classes.any + ('.' + ($mdgriffith$elm_ui$Internal$Style$classes.column + (' > ' + $mdgriffith$elm_ui$Internal$Style$dot(
							'height-fill-' + $elm$core$String$fromInt(portion))))),
						'flex-grow',
						$elm$core$String$fromInt(portion * 100000))
					]));
		case 'Min':
			var minSize = h.a;
			var len = h.b;
			var cls = 'min-height-' + $elm$core$String$fromInt(minSize);
			var style = A3(
				$mdgriffith$elm_ui$Internal$Model$Single,
				cls,
				'min-height',
				$elm$core$String$fromInt(minSize) + 'px !important');
			var _v1 = $mdgriffith$elm_ui$Internal$Model$renderHeight(len);
			var newFlag = _v1.a;
			var newAttrs = _v1.b;
			var newStyle = _v1.c;
			return _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$heightBetween, newFlag),
				cls + (' ' + newAttrs),
				A2($elm$core$List$cons, style, newStyle));
		default:
			var maxSize = h.a;
			var len = h.b;
			var cls = 'max-height-' + $elm$core$String$fromInt(maxSize);
			var style = A3(
				$mdgriffith$elm_ui$Internal$Model$Single,
				cls,
				'max-height',
				$elm$core$String$fromInt(maxSize) + 'px');
			var _v2 = $mdgriffith$elm_ui$Internal$Model$renderHeight(len);
			var newFlag = _v2.a;
			var newAttrs = _v2.b;
			var newStyle = _v2.c;
			return _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$heightBetween, newFlag),
				cls + (' ' + newAttrs),
				A2($elm$core$List$cons, style, newStyle));
	}
};
var $mdgriffith$elm_ui$Internal$Flag$widthContent = $mdgriffith$elm_ui$Internal$Flag$flag(38);
var $mdgriffith$elm_ui$Internal$Model$renderWidth = function (w) {
	switch (w.$) {
		case 'Px':
			var px = w.a;
			return _Utils_Tuple3(
				$mdgriffith$elm_ui$Internal$Flag$none,
				$mdgriffith$elm_ui$Internal$Style$classes.widthExact + (' width-px-' + $elm$core$String$fromInt(px)),
				_List_fromArray(
					[
						A3(
						$mdgriffith$elm_ui$Internal$Model$Single,
						'width-px-' + $elm$core$String$fromInt(px),
						'width',
						$elm$core$String$fromInt(px) + 'px')
					]));
		case 'Content':
			return _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$widthContent, $mdgriffith$elm_ui$Internal$Flag$none),
				$mdgriffith$elm_ui$Internal$Style$classes.widthContent,
				_List_Nil);
		case 'Fill':
			var portion = w.a;
			return (portion === 1) ? _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$widthFill, $mdgriffith$elm_ui$Internal$Flag$none),
				$mdgriffith$elm_ui$Internal$Style$classes.widthFill,
				_List_Nil) : _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$widthFill, $mdgriffith$elm_ui$Internal$Flag$none),
				$mdgriffith$elm_ui$Internal$Style$classes.widthFillPortion + (' width-fill-' + $elm$core$String$fromInt(portion)),
				_List_fromArray(
					[
						A3(
						$mdgriffith$elm_ui$Internal$Model$Single,
						$mdgriffith$elm_ui$Internal$Style$classes.any + ('.' + ($mdgriffith$elm_ui$Internal$Style$classes.row + (' > ' + $mdgriffith$elm_ui$Internal$Style$dot(
							'width-fill-' + $elm$core$String$fromInt(portion))))),
						'flex-grow',
						$elm$core$String$fromInt(portion * 100000))
					]));
		case 'Min':
			var minSize = w.a;
			var len = w.b;
			var cls = 'min-width-' + $elm$core$String$fromInt(minSize);
			var style = A3(
				$mdgriffith$elm_ui$Internal$Model$Single,
				cls,
				'min-width',
				$elm$core$String$fromInt(minSize) + 'px');
			var _v1 = $mdgriffith$elm_ui$Internal$Model$renderWidth(len);
			var newFlag = _v1.a;
			var newAttrs = _v1.b;
			var newStyle = _v1.c;
			return _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$widthBetween, newFlag),
				cls + (' ' + newAttrs),
				A2($elm$core$List$cons, style, newStyle));
		default:
			var maxSize = w.a;
			var len = w.b;
			var cls = 'max-width-' + $elm$core$String$fromInt(maxSize);
			var style = A3(
				$mdgriffith$elm_ui$Internal$Model$Single,
				cls,
				'max-width',
				$elm$core$String$fromInt(maxSize) + 'px');
			var _v2 = $mdgriffith$elm_ui$Internal$Model$renderWidth(len);
			var newFlag = _v2.a;
			var newAttrs = _v2.b;
			var newStyle = _v2.c;
			return _Utils_Tuple3(
				A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$widthBetween, newFlag),
				cls + (' ' + newAttrs),
				A2($elm$core$List$cons, style, newStyle));
	}
};
var $mdgriffith$elm_ui$Internal$Flag$borderWidth = $mdgriffith$elm_ui$Internal$Flag$flag(27);
var $elm$core$Basics$ge = _Utils_ge;
var $mdgriffith$elm_ui$Internal$Model$skippable = F2(
	function (flag, style) {
		if (_Utils_eq(flag, $mdgriffith$elm_ui$Internal$Flag$borderWidth)) {
			if (style.$ === 'Single') {
				var val = style.c;
				switch (val) {
					case '0px':
						return true;
					case '1px':
						return true;
					case '2px':
						return true;
					case '3px':
						return true;
					case '4px':
						return true;
					case '5px':
						return true;
					case '6px':
						return true;
					default:
						return false;
				}
			} else {
				return false;
			}
		} else {
			switch (style.$) {
				case 'FontSize':
					var i = style.a;
					return (i >= 8) && (i <= 32);
				case 'PaddingStyle':
					var name = style.a;
					var t = style.b;
					var r = style.c;
					var b = style.d;
					var l = style.e;
					return _Utils_eq(t, b) && (_Utils_eq(t, r) && (_Utils_eq(t, l) && ((t >= 0) && (t <= 24))));
				default:
					return false;
			}
		}
	});
var $mdgriffith$elm_ui$Internal$Flag$width = $mdgriffith$elm_ui$Internal$Flag$flag(6);
var $mdgriffith$elm_ui$Internal$Flag$xAlign = $mdgriffith$elm_ui$Internal$Flag$flag(30);
var $mdgriffith$elm_ui$Internal$Flag$yAlign = $mdgriffith$elm_ui$Internal$Flag$flag(29);
var $mdgriffith$elm_ui$Internal$Model$gatherAttrRecursive = F8(
	function (classes, node, has, transform, styles, attrs, children, elementAttrs) {
		gatherAttrRecursive:
		while (true) {
			if (!elementAttrs.b) {
				var _v1 = $mdgriffith$elm_ui$Internal$Model$transformClass(transform);
				if (_v1.$ === 'Nothing') {
					return {
						attributes: A2(
							$elm$core$List$cons,
							$elm$html$Html$Attributes$class(classes),
							attrs),
						children: children,
						has: has,
						node: node,
						styles: styles
					};
				} else {
					var _class = _v1.a;
					return {
						attributes: A2(
							$elm$core$List$cons,
							$elm$html$Html$Attributes$class(classes + (' ' + _class)),
							attrs),
						children: children,
						has: has,
						node: node,
						styles: A2(
							$elm$core$List$cons,
							$mdgriffith$elm_ui$Internal$Model$Transform(transform),
							styles)
					};
				}
			} else {
				var attribute = elementAttrs.a;
				var remaining = elementAttrs.b;
				switch (attribute.$) {
					case 'NoAttribute':
						var $temp$classes = classes,
							$temp$node = node,
							$temp$has = has,
							$temp$transform = transform,
							$temp$styles = styles,
							$temp$attrs = attrs,
							$temp$children = children,
							$temp$elementAttrs = remaining;
						classes = $temp$classes;
						node = $temp$node;
						has = $temp$has;
						transform = $temp$transform;
						styles = $temp$styles;
						attrs = $temp$attrs;
						children = $temp$children;
						elementAttrs = $temp$elementAttrs;
						continue gatherAttrRecursive;
					case 'Class':
						var flag = attribute.a;
						var exactClassName = attribute.b;
						if (A2($mdgriffith$elm_ui$Internal$Flag$present, flag, has)) {
							var $temp$classes = classes,
								$temp$node = node,
								$temp$has = has,
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						} else {
							var $temp$classes = exactClassName + (' ' + classes),
								$temp$node = node,
								$temp$has = A2($mdgriffith$elm_ui$Internal$Flag$add, flag, has),
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						}
					case 'Attr':
						var actualAttribute = attribute.a;
						var $temp$classes = classes,
							$temp$node = node,
							$temp$has = has,
							$temp$transform = transform,
							$temp$styles = styles,
							$temp$attrs = A2($elm$core$List$cons, actualAttribute, attrs),
							$temp$children = children,
							$temp$elementAttrs = remaining;
						classes = $temp$classes;
						node = $temp$node;
						has = $temp$has;
						transform = $temp$transform;
						styles = $temp$styles;
						attrs = $temp$attrs;
						children = $temp$children;
						elementAttrs = $temp$elementAttrs;
						continue gatherAttrRecursive;
					case 'StyleClass':
						var flag = attribute.a;
						var style = attribute.b;
						if (A2($mdgriffith$elm_ui$Internal$Flag$present, flag, has)) {
							var $temp$classes = classes,
								$temp$node = node,
								$temp$has = has,
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						} else {
							if (A2($mdgriffith$elm_ui$Internal$Model$skippable, flag, style)) {
								var $temp$classes = $mdgriffith$elm_ui$Internal$Model$getStyleName(style) + (' ' + classes),
									$temp$node = node,
									$temp$has = A2($mdgriffith$elm_ui$Internal$Flag$add, flag, has),
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							} else {
								var $temp$classes = $mdgriffith$elm_ui$Internal$Model$getStyleName(style) + (' ' + classes),
									$temp$node = node,
									$temp$has = A2($mdgriffith$elm_ui$Internal$Flag$add, flag, has),
									$temp$transform = transform,
									$temp$styles = A2($elm$core$List$cons, style, styles),
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							}
						}
					case 'TransformComponent':
						var flag = attribute.a;
						var component = attribute.b;
						var $temp$classes = classes,
							$temp$node = node,
							$temp$has = A2($mdgriffith$elm_ui$Internal$Flag$add, flag, has),
							$temp$transform = A2($mdgriffith$elm_ui$Internal$Model$composeTransformation, transform, component),
							$temp$styles = styles,
							$temp$attrs = attrs,
							$temp$children = children,
							$temp$elementAttrs = remaining;
						classes = $temp$classes;
						node = $temp$node;
						has = $temp$has;
						transform = $temp$transform;
						styles = $temp$styles;
						attrs = $temp$attrs;
						children = $temp$children;
						elementAttrs = $temp$elementAttrs;
						continue gatherAttrRecursive;
					case 'Width':
						var width = attribute.a;
						if (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$width, has)) {
							var $temp$classes = classes,
								$temp$node = node,
								$temp$has = has,
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						} else {
							switch (width.$) {
								case 'Px':
									var px = width.a;
									var $temp$classes = ($mdgriffith$elm_ui$Internal$Style$classes.widthExact + (' width-px-' + $elm$core$String$fromInt(px))) + (' ' + classes),
										$temp$node = node,
										$temp$has = A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$width, has),
										$temp$transform = transform,
										$temp$styles = A2(
										$elm$core$List$cons,
										A3(
											$mdgriffith$elm_ui$Internal$Model$Single,
											'width-px-' + $elm$core$String$fromInt(px),
											'width',
											$elm$core$String$fromInt(px) + 'px'),
										styles),
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
								case 'Content':
									var $temp$classes = classes + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.widthContent),
										$temp$node = node,
										$temp$has = A2(
										$mdgriffith$elm_ui$Internal$Flag$add,
										$mdgriffith$elm_ui$Internal$Flag$widthContent,
										A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$width, has)),
										$temp$transform = transform,
										$temp$styles = styles,
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
								case 'Fill':
									var portion = width.a;
									if (portion === 1) {
										var $temp$classes = classes + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.widthFill),
											$temp$node = node,
											$temp$has = A2(
											$mdgriffith$elm_ui$Internal$Flag$add,
											$mdgriffith$elm_ui$Internal$Flag$widthFill,
											A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$width, has)),
											$temp$transform = transform,
											$temp$styles = styles,
											$temp$attrs = attrs,
											$temp$children = children,
											$temp$elementAttrs = remaining;
										classes = $temp$classes;
										node = $temp$node;
										has = $temp$has;
										transform = $temp$transform;
										styles = $temp$styles;
										attrs = $temp$attrs;
										children = $temp$children;
										elementAttrs = $temp$elementAttrs;
										continue gatherAttrRecursive;
									} else {
										var $temp$classes = classes + (' ' + ($mdgriffith$elm_ui$Internal$Style$classes.widthFillPortion + (' width-fill-' + $elm$core$String$fromInt(portion)))),
											$temp$node = node,
											$temp$has = A2(
											$mdgriffith$elm_ui$Internal$Flag$add,
											$mdgriffith$elm_ui$Internal$Flag$widthFill,
											A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$width, has)),
											$temp$transform = transform,
											$temp$styles = A2(
											$elm$core$List$cons,
											A3(
												$mdgriffith$elm_ui$Internal$Model$Single,
												$mdgriffith$elm_ui$Internal$Style$classes.any + ('.' + ($mdgriffith$elm_ui$Internal$Style$classes.row + (' > ' + $mdgriffith$elm_ui$Internal$Style$dot(
													'width-fill-' + $elm$core$String$fromInt(portion))))),
												'flex-grow',
												$elm$core$String$fromInt(portion * 100000)),
											styles),
											$temp$attrs = attrs,
											$temp$children = children,
											$temp$elementAttrs = remaining;
										classes = $temp$classes;
										node = $temp$node;
										has = $temp$has;
										transform = $temp$transform;
										styles = $temp$styles;
										attrs = $temp$attrs;
										children = $temp$children;
										elementAttrs = $temp$elementAttrs;
										continue gatherAttrRecursive;
									}
								default:
									var _v4 = $mdgriffith$elm_ui$Internal$Model$renderWidth(width);
									var addToFlags = _v4.a;
									var newClass = _v4.b;
									var newStyles = _v4.c;
									var $temp$classes = classes + (' ' + newClass),
										$temp$node = node,
										$temp$has = A2(
										$mdgriffith$elm_ui$Internal$Flag$merge,
										addToFlags,
										A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$width, has)),
										$temp$transform = transform,
										$temp$styles = _Utils_ap(newStyles, styles),
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
							}
						}
					case 'Height':
						var height = attribute.a;
						if (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$height, has)) {
							var $temp$classes = classes,
								$temp$node = node,
								$temp$has = has,
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						} else {
							switch (height.$) {
								case 'Px':
									var px = height.a;
									var val = $elm$core$String$fromInt(px) + 'px';
									var name = 'height-px-' + val;
									var $temp$classes = $mdgriffith$elm_ui$Internal$Style$classes.heightExact + (' ' + (name + (' ' + classes))),
										$temp$node = node,
										$temp$has = A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$height, has),
										$temp$transform = transform,
										$temp$styles = A2(
										$elm$core$List$cons,
										A3($mdgriffith$elm_ui$Internal$Model$Single, name, 'height ', val),
										styles),
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
								case 'Content':
									var $temp$classes = $mdgriffith$elm_ui$Internal$Style$classes.heightContent + (' ' + classes),
										$temp$node = node,
										$temp$has = A2(
										$mdgriffith$elm_ui$Internal$Flag$add,
										$mdgriffith$elm_ui$Internal$Flag$heightContent,
										A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$height, has)),
										$temp$transform = transform,
										$temp$styles = styles,
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
								case 'Fill':
									var portion = height.a;
									if (portion === 1) {
										var $temp$classes = $mdgriffith$elm_ui$Internal$Style$classes.heightFill + (' ' + classes),
											$temp$node = node,
											$temp$has = A2(
											$mdgriffith$elm_ui$Internal$Flag$add,
											$mdgriffith$elm_ui$Internal$Flag$heightFill,
											A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$height, has)),
											$temp$transform = transform,
											$temp$styles = styles,
											$temp$attrs = attrs,
											$temp$children = children,
											$temp$elementAttrs = remaining;
										classes = $temp$classes;
										node = $temp$node;
										has = $temp$has;
										transform = $temp$transform;
										styles = $temp$styles;
										attrs = $temp$attrs;
										children = $temp$children;
										elementAttrs = $temp$elementAttrs;
										continue gatherAttrRecursive;
									} else {
										var $temp$classes = classes + (' ' + ($mdgriffith$elm_ui$Internal$Style$classes.heightFillPortion + (' height-fill-' + $elm$core$String$fromInt(portion)))),
											$temp$node = node,
											$temp$has = A2(
											$mdgriffith$elm_ui$Internal$Flag$add,
											$mdgriffith$elm_ui$Internal$Flag$heightFill,
											A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$height, has)),
											$temp$transform = transform,
											$temp$styles = A2(
											$elm$core$List$cons,
											A3(
												$mdgriffith$elm_ui$Internal$Model$Single,
												$mdgriffith$elm_ui$Internal$Style$classes.any + ('.' + ($mdgriffith$elm_ui$Internal$Style$classes.column + (' > ' + $mdgriffith$elm_ui$Internal$Style$dot(
													'height-fill-' + $elm$core$String$fromInt(portion))))),
												'flex-grow',
												$elm$core$String$fromInt(portion * 100000)),
											styles),
											$temp$attrs = attrs,
											$temp$children = children,
											$temp$elementAttrs = remaining;
										classes = $temp$classes;
										node = $temp$node;
										has = $temp$has;
										transform = $temp$transform;
										styles = $temp$styles;
										attrs = $temp$attrs;
										children = $temp$children;
										elementAttrs = $temp$elementAttrs;
										continue gatherAttrRecursive;
									}
								default:
									var _v6 = $mdgriffith$elm_ui$Internal$Model$renderHeight(height);
									var addToFlags = _v6.a;
									var newClass = _v6.b;
									var newStyles = _v6.c;
									var $temp$classes = classes + (' ' + newClass),
										$temp$node = node,
										$temp$has = A2(
										$mdgriffith$elm_ui$Internal$Flag$merge,
										addToFlags,
										A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$height, has)),
										$temp$transform = transform,
										$temp$styles = _Utils_ap(newStyles, styles),
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
							}
						}
					case 'Describe':
						var description = attribute.a;
						switch (description.$) {
							case 'Main':
								var $temp$classes = classes,
									$temp$node = A2($mdgriffith$elm_ui$Internal$Model$addNodeName, 'main', node),
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'Navigation':
								var $temp$classes = classes,
									$temp$node = A2($mdgriffith$elm_ui$Internal$Model$addNodeName, 'nav', node),
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'ContentInfo':
								var $temp$classes = classes,
									$temp$node = A2($mdgriffith$elm_ui$Internal$Model$addNodeName, 'footer', node),
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'Complementary':
								var $temp$classes = classes,
									$temp$node = A2($mdgriffith$elm_ui$Internal$Model$addNodeName, 'aside', node),
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'Heading':
								var i = description.a;
								if (i <= 1) {
									var $temp$classes = classes,
										$temp$node = A2($mdgriffith$elm_ui$Internal$Model$addNodeName, 'h1', node),
										$temp$has = has,
										$temp$transform = transform,
										$temp$styles = styles,
										$temp$attrs = attrs,
										$temp$children = children,
										$temp$elementAttrs = remaining;
									classes = $temp$classes;
									node = $temp$node;
									has = $temp$has;
									transform = $temp$transform;
									styles = $temp$styles;
									attrs = $temp$attrs;
									children = $temp$children;
									elementAttrs = $temp$elementAttrs;
									continue gatherAttrRecursive;
								} else {
									if (i < 7) {
										var $temp$classes = classes,
											$temp$node = A2(
											$mdgriffith$elm_ui$Internal$Model$addNodeName,
											'h' + $elm$core$String$fromInt(i),
											node),
											$temp$has = has,
											$temp$transform = transform,
											$temp$styles = styles,
											$temp$attrs = attrs,
											$temp$children = children,
											$temp$elementAttrs = remaining;
										classes = $temp$classes;
										node = $temp$node;
										has = $temp$has;
										transform = $temp$transform;
										styles = $temp$styles;
										attrs = $temp$attrs;
										children = $temp$children;
										elementAttrs = $temp$elementAttrs;
										continue gatherAttrRecursive;
									} else {
										var $temp$classes = classes,
											$temp$node = A2($mdgriffith$elm_ui$Internal$Model$addNodeName, 'h6', node),
											$temp$has = has,
											$temp$transform = transform,
											$temp$styles = styles,
											$temp$attrs = attrs,
											$temp$children = children,
											$temp$elementAttrs = remaining;
										classes = $temp$classes;
										node = $temp$node;
										has = $temp$has;
										transform = $temp$transform;
										styles = $temp$styles;
										attrs = $temp$attrs;
										children = $temp$children;
										elementAttrs = $temp$elementAttrs;
										continue gatherAttrRecursive;
									}
								}
							case 'Paragraph':
								var $temp$classes = classes,
									$temp$node = node,
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = attrs,
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'Button':
								var $temp$classes = classes,
									$temp$node = node,
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = A2(
									$elm$core$List$cons,
									A2($elm$virtual_dom$VirtualDom$attribute, 'role', 'button'),
									attrs),
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'Label':
								var label = description.a;
								var $temp$classes = classes,
									$temp$node = node,
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = A2(
									$elm$core$List$cons,
									A2($elm$virtual_dom$VirtualDom$attribute, 'aria-label', label),
									attrs),
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							case 'LivePolite':
								var $temp$classes = classes,
									$temp$node = node,
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = A2(
									$elm$core$List$cons,
									A2($elm$virtual_dom$VirtualDom$attribute, 'aria-live', 'polite'),
									attrs),
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
							default:
								var $temp$classes = classes,
									$temp$node = node,
									$temp$has = has,
									$temp$transform = transform,
									$temp$styles = styles,
									$temp$attrs = A2(
									$elm$core$List$cons,
									A2($elm$virtual_dom$VirtualDom$attribute, 'aria-live', 'assertive'),
									attrs),
									$temp$children = children,
									$temp$elementAttrs = remaining;
								classes = $temp$classes;
								node = $temp$node;
								has = $temp$has;
								transform = $temp$transform;
								styles = $temp$styles;
								attrs = $temp$attrs;
								children = $temp$children;
								elementAttrs = $temp$elementAttrs;
								continue gatherAttrRecursive;
						}
					case 'Nearby':
						var location = attribute.a;
						var elem = attribute.b;
						var newStyles = function () {
							switch (elem.$) {
								case 'Empty':
									return styles;
								case 'Text':
									var str = elem.a;
									return styles;
								case 'Unstyled':
									var html = elem.a;
									return styles;
								default:
									var styled = elem.a;
									return _Utils_ap(styles, styled.styles);
							}
						}();
						var $temp$classes = classes,
							$temp$node = node,
							$temp$has = has,
							$temp$transform = transform,
							$temp$styles = newStyles,
							$temp$attrs = attrs,
							$temp$children = A3($mdgriffith$elm_ui$Internal$Model$addNearbyElement, location, elem, children),
							$temp$elementAttrs = remaining;
						classes = $temp$classes;
						node = $temp$node;
						has = $temp$has;
						transform = $temp$transform;
						styles = $temp$styles;
						attrs = $temp$attrs;
						children = $temp$children;
						elementAttrs = $temp$elementAttrs;
						continue gatherAttrRecursive;
					case 'AlignX':
						var x = attribute.a;
						if (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$xAlign, has)) {
							var $temp$classes = classes,
								$temp$node = node,
								$temp$has = has,
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						} else {
							var $temp$classes = $mdgriffith$elm_ui$Internal$Model$alignXName(x) + (' ' + classes),
								$temp$node = node,
								$temp$has = function (flags) {
								switch (x.$) {
									case 'CenterX':
										return A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$centerX, flags);
									case 'Right':
										return A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$alignRight, flags);
									default:
										return flags;
								}
							}(
								A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$xAlign, has)),
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						}
					default:
						var y = attribute.a;
						if (A2($mdgriffith$elm_ui$Internal$Flag$present, $mdgriffith$elm_ui$Internal$Flag$yAlign, has)) {
							var $temp$classes = classes,
								$temp$node = node,
								$temp$has = has,
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						} else {
							var $temp$classes = $mdgriffith$elm_ui$Internal$Model$alignYName(y) + (' ' + classes),
								$temp$node = node,
								$temp$has = function (flags) {
								switch (y.$) {
									case 'CenterY':
										return A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$centerY, flags);
									case 'Bottom':
										return A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$alignBottom, flags);
									default:
										return flags;
								}
							}(
								A2($mdgriffith$elm_ui$Internal$Flag$add, $mdgriffith$elm_ui$Internal$Flag$yAlign, has)),
								$temp$transform = transform,
								$temp$styles = styles,
								$temp$attrs = attrs,
								$temp$children = children,
								$temp$elementAttrs = remaining;
							classes = $temp$classes;
							node = $temp$node;
							has = $temp$has;
							transform = $temp$transform;
							styles = $temp$styles;
							attrs = $temp$attrs;
							children = $temp$children;
							elementAttrs = $temp$elementAttrs;
							continue gatherAttrRecursive;
						}
				}
			}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$Untransformed = {$: 'Untransformed'};
var $mdgriffith$elm_ui$Internal$Model$untransformed = $mdgriffith$elm_ui$Internal$Model$Untransformed;
var $mdgriffith$elm_ui$Internal$Model$element = F4(
	function (context, node, attributes, children) {
		return A3(
			$mdgriffith$elm_ui$Internal$Model$createElement,
			context,
			children,
			A8(
				$mdgriffith$elm_ui$Internal$Model$gatherAttrRecursive,
				$mdgriffith$elm_ui$Internal$Model$contextClasses(context),
				node,
				$mdgriffith$elm_ui$Internal$Flag$none,
				$mdgriffith$elm_ui$Internal$Model$untransformed,
				_List_Nil,
				_List_Nil,
				$mdgriffith$elm_ui$Internal$Model$NoNearbyChildren,
				$elm$core$List$reverse(attributes)));
	});
var $mdgriffith$elm_ui$Internal$Model$AllowHover = {$: 'AllowHover'};
var $mdgriffith$elm_ui$Internal$Model$Layout = {$: 'Layout'};
var $mdgriffith$elm_ui$Internal$Model$focusDefaultStyle = {
	backgroundColor: $elm$core$Maybe$Nothing,
	borderColor: $elm$core$Maybe$Nothing,
	shadow: $elm$core$Maybe$Just(
		{
			blur: 0,
			color: A4($mdgriffith$elm_ui$Internal$Model$Rgba, 155 / 255, 203 / 255, 1, 1),
			offset: _Utils_Tuple2(0, 0),
			size: 3
		})
};
var $mdgriffith$elm_ui$Internal$Model$optionsToRecord = function (options) {
	var combine = F2(
		function (opt, record) {
			switch (opt.$) {
				case 'HoverOption':
					var hoverable = opt.a;
					var _v4 = record.hover;
					if (_v4.$ === 'Nothing') {
						return _Utils_update(
							record,
							{
								hover: $elm$core$Maybe$Just(hoverable)
							});
					} else {
						return record;
					}
				case 'FocusStyleOption':
					var focusStyle = opt.a;
					var _v5 = record.focus;
					if (_v5.$ === 'Nothing') {
						return _Utils_update(
							record,
							{
								focus: $elm$core$Maybe$Just(focusStyle)
							});
					} else {
						return record;
					}
				default:
					var renderMode = opt.a;
					var _v6 = record.mode;
					if (_v6.$ === 'Nothing') {
						return _Utils_update(
							record,
							{
								mode: $elm$core$Maybe$Just(renderMode)
							});
					} else {
						return record;
					}
			}
		});
	var andFinally = function (record) {
		return {
			focus: function () {
				var _v0 = record.focus;
				if (_v0.$ === 'Nothing') {
					return $mdgriffith$elm_ui$Internal$Model$focusDefaultStyle;
				} else {
					var focusable = _v0.a;
					return focusable;
				}
			}(),
			hover: function () {
				var _v1 = record.hover;
				if (_v1.$ === 'Nothing') {
					return $mdgriffith$elm_ui$Internal$Model$AllowHover;
				} else {
					var hoverable = _v1.a;
					return hoverable;
				}
			}(),
			mode: function () {
				var _v2 = record.mode;
				if (_v2.$ === 'Nothing') {
					return $mdgriffith$elm_ui$Internal$Model$Layout;
				} else {
					var actualMode = _v2.a;
					return actualMode;
				}
			}()
		};
	};
	return andFinally(
		A3(
			$elm$core$List$foldr,
			combine,
			{focus: $elm$core$Maybe$Nothing, hover: $elm$core$Maybe$Nothing, mode: $elm$core$Maybe$Nothing},
			options));
};
var $mdgriffith$elm_ui$Internal$Model$toHtml = F2(
	function (mode, el) {
		switch (el.$) {
			case 'Unstyled':
				var html = el.a;
				return html($mdgriffith$elm_ui$Internal$Model$asEl);
			case 'Styled':
				var styles = el.a.styles;
				var html = el.a.html;
				return A2(
					html,
					mode(styles),
					$mdgriffith$elm_ui$Internal$Model$asEl);
			case 'Text':
				var text = el.a;
				return $mdgriffith$elm_ui$Internal$Model$textElement(text);
			default:
				return $mdgriffith$elm_ui$Internal$Model$textElement('');
		}
	});
var $mdgriffith$elm_ui$Internal$Model$renderRoot = F3(
	function (optionList, attributes, child) {
		var options = $mdgriffith$elm_ui$Internal$Model$optionsToRecord(optionList);
		var embedStyle = function () {
			var _v0 = options.mode;
			if (_v0.$ === 'NoStaticStyleSheet') {
				return $mdgriffith$elm_ui$Internal$Model$OnlyDynamic(options);
			} else {
				return $mdgriffith$elm_ui$Internal$Model$StaticRootAndDynamic(options);
			}
		}();
		return A2(
			$mdgriffith$elm_ui$Internal$Model$toHtml,
			embedStyle,
			A4(
				$mdgriffith$elm_ui$Internal$Model$element,
				$mdgriffith$elm_ui$Internal$Model$asEl,
				$mdgriffith$elm_ui$Internal$Model$div,
				attributes,
				$mdgriffith$elm_ui$Internal$Model$Unkeyed(
					_List_fromArray(
						[child]))));
	});
var $mdgriffith$elm_ui$Internal$Model$Colored = F3(
	function (a, b, c) {
		return {$: 'Colored', a: a, b: b, c: c};
	});
var $mdgriffith$elm_ui$Internal$Model$FontFamily = F2(
	function (a, b) {
		return {$: 'FontFamily', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$FontSize = function (a) {
	return {$: 'FontSize', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$SansSerif = {$: 'SansSerif'};
var $mdgriffith$elm_ui$Internal$Model$StyleClass = F2(
	function (a, b) {
		return {$: 'StyleClass', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$Typeface = function (a) {
	return {$: 'Typeface', a: a};
};
var $mdgriffith$elm_ui$Internal$Flag$bgColor = $mdgriffith$elm_ui$Internal$Flag$flag(8);
var $mdgriffith$elm_ui$Internal$Flag$fontColor = $mdgriffith$elm_ui$Internal$Flag$flag(14);
var $mdgriffith$elm_ui$Internal$Flag$fontFamily = $mdgriffith$elm_ui$Internal$Flag$flag(5);
var $mdgriffith$elm_ui$Internal$Flag$fontSize = $mdgriffith$elm_ui$Internal$Flag$flag(4);
var $mdgriffith$elm_ui$Internal$Model$formatColorClass = function (_v0) {
	var red = _v0.a;
	var green = _v0.b;
	var blue = _v0.c;
	var alpha = _v0.d;
	return $mdgriffith$elm_ui$Internal$Model$floatClass(red) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(green) + ('-' + ($mdgriffith$elm_ui$Internal$Model$floatClass(blue) + ('-' + $mdgriffith$elm_ui$Internal$Model$floatClass(alpha))))));
};
var $elm$core$String$words = _String_words;
var $mdgriffith$elm_ui$Internal$Model$renderFontClassName = F2(
	function (font, current) {
		return _Utils_ap(
			current,
			function () {
				switch (font.$) {
					case 'Serif':
						return 'serif';
					case 'SansSerif':
						return 'sans-serif';
					case 'Monospace':
						return 'monospace';
					case 'Typeface':
						var name = font.a;
						return A2(
							$elm$core$String$join,
							'-',
							$elm$core$String$words(
								$elm$core$String$toLower(name)));
					case 'ImportFont':
						var name = font.a;
						var url = font.b;
						return A2(
							$elm$core$String$join,
							'-',
							$elm$core$String$words(
								$elm$core$String$toLower(name)));
					default:
						var name = font.a.name;
						return A2(
							$elm$core$String$join,
							'-',
							$elm$core$String$words(
								$elm$core$String$toLower(name)));
				}
			}());
	});
var $mdgriffith$elm_ui$Internal$Model$rootStyle = function () {
	var families = _List_fromArray(
		[
			$mdgriffith$elm_ui$Internal$Model$Typeface('Open Sans'),
			$mdgriffith$elm_ui$Internal$Model$Typeface('Helvetica'),
			$mdgriffith$elm_ui$Internal$Model$Typeface('Verdana'),
			$mdgriffith$elm_ui$Internal$Model$SansSerif
		]);
	return _List_fromArray(
		[
			A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$bgColor,
			A3(
				$mdgriffith$elm_ui$Internal$Model$Colored,
				'bg-' + $mdgriffith$elm_ui$Internal$Model$formatColorClass(
					A4($mdgriffith$elm_ui$Internal$Model$Rgba, 1, 1, 1, 0)),
				'background-color',
				A4($mdgriffith$elm_ui$Internal$Model$Rgba, 1, 1, 1, 0))),
			A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$fontColor,
			A3(
				$mdgriffith$elm_ui$Internal$Model$Colored,
				'fc-' + $mdgriffith$elm_ui$Internal$Model$formatColorClass(
					A4($mdgriffith$elm_ui$Internal$Model$Rgba, 0, 0, 0, 1)),
				'color',
				A4($mdgriffith$elm_ui$Internal$Model$Rgba, 0, 0, 0, 1))),
			A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$fontSize,
			$mdgriffith$elm_ui$Internal$Model$FontSize(20)),
			A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$fontFamily,
			A2(
				$mdgriffith$elm_ui$Internal$Model$FontFamily,
				A3($elm$core$List$foldl, $mdgriffith$elm_ui$Internal$Model$renderFontClassName, 'font-', families),
				families))
		]);
}();
var $mdgriffith$elm_ui$Element$layoutWith = F3(
	function (_v0, attrs, child) {
		var options = _v0.options;
		return A3(
			$mdgriffith$elm_ui$Internal$Model$renderRoot,
			options,
			A2(
				$elm$core$List$cons,
				$mdgriffith$elm_ui$Internal$Model$htmlClass(
					A2(
						$elm$core$String$join,
						' ',
						_List_fromArray(
							[$mdgriffith$elm_ui$Internal$Style$classes.root, $mdgriffith$elm_ui$Internal$Style$classes.any, $mdgriffith$elm_ui$Internal$Style$classes.single]))),
				_Utils_ap($mdgriffith$elm_ui$Internal$Model$rootStyle, attrs)),
			child);
	});
var $mdgriffith$elm_ui$Element$layout = $mdgriffith$elm_ui$Element$layoutWith(
	{options: _List_Nil});
var $author$project$Morphir$Value$Error$UnexpectedArguments = function (a) {
	return {$: 'UnexpectedArguments', a: a};
};
var $elm$core$Basics$abs = function (n) {
	return (n < 0) ? (-n) : n;
};
var $author$project$Morphir$Value$Native$binaryLazy = function (f) {
	return F2(
		function (_eval, args) {
			if ((args.b && args.b.b) && (!args.b.b.b)) {
				var arg1 = args.a;
				var _v1 = args.b;
				var arg2 = _v1.a;
				return A3(f, _eval, arg1, arg2);
			} else {
				return $elm$core$Result$Err(
					$author$project$Morphir$Value$Error$UnexpectedArguments(args));
			}
		});
};
var $author$project$Morphir$Value$Native$binaryStrict = function (f) {
	return $author$project$Morphir$Value$Native$binaryLazy(
		F3(
			function (_eval, arg1, arg2) {
				return A2(
					$elm$core$Result$andThen,
					function (a1) {
						return A2(
							$elm$core$Result$andThen,
							f(a1),
							_eval(arg2));
					},
					_eval(arg1));
			}));
};
var $author$project$Morphir$Value$Error$ExpectedBoolLiteral = function (a) {
	return {$: 'ExpectedBoolLiteral', a: a};
};
var $author$project$Morphir$Value$Native$boolLiteral = function (lit) {
	if (lit.$ === 'BoolLiteral') {
		var v = lit.a;
		return $elm$core$Result$Ok(v);
	} else {
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$ExpectedBoolLiteral(
				A2($author$project$Morphir$IR$Value$Literal, _Utils_Tuple0, lit)));
	}
};
var $elm$core$Basics$clamp = F3(
	function (low, high, number) {
		return (_Utils_cmp(number, low) < 0) ? low : ((_Utils_cmp(number, high) > 0) ? high : number);
	});
var $author$project$Morphir$Value$Error$TupleLengthNotMatchException = F2(
	function (a, b) {
		return {$: 'TupleLengthNotMatchException', a: a, b: b};
	});
var $author$project$Morphir$Value$Native$Comparable$compareValue = F2(
	function (arg1, arg2) {
		var _v0 = _Utils_Tuple2(arg1, arg2);
		_v0$6:
		while (true) {
			switch (_v0.a.$) {
				case 'Literal':
					if (_v0.b.$ === 'Literal') {
						switch (_v0.a.b.$) {
							case 'IntLiteral':
								if (_v0.b.b.$ === 'IntLiteral') {
									var _v1 = _v0.a;
									var val1 = _v1.b.a;
									var _v2 = _v0.b;
									var val2 = _v2.b.a;
									return $elm$core$Result$Ok(
										A2($elm$core$Basics$compare, val1, val2));
								} else {
									break _v0$6;
								}
							case 'FloatLiteral':
								if (_v0.b.b.$ === 'FloatLiteral') {
									var _v3 = _v0.a;
									var val1 = _v3.b.a;
									var _v4 = _v0.b;
									var val2 = _v4.b.a;
									return $elm$core$Result$Ok(
										A2($elm$core$Basics$compare, val1, val2));
								} else {
									break _v0$6;
								}
							case 'CharLiteral':
								if (_v0.b.b.$ === 'CharLiteral') {
									var _v5 = _v0.a;
									var val1 = _v5.b.a;
									var _v6 = _v0.b;
									var val2 = _v6.b.a;
									return $elm$core$Result$Ok(
										A2($elm$core$Basics$compare, val1, val2));
								} else {
									break _v0$6;
								}
							case 'StringLiteral':
								if (_v0.b.b.$ === 'StringLiteral') {
									var _v7 = _v0.a;
									var val1 = _v7.b.a;
									var _v8 = _v0.b;
									var val2 = _v8.b.a;
									return $elm$core$Result$Ok(
										A2($elm$core$Basics$compare, val1, val2));
								} else {
									break _v0$6;
								}
							default:
								break _v0$6;
						}
					} else {
						break _v0$6;
					}
				case 'List':
					if (_v0.b.$ === 'List') {
						var _v9 = _v0.a;
						var list1 = _v9.b;
						var _v10 = _v0.b;
						var list2 = _v10.b;
						var fun = F2(
							function (listA, listB) {
								fun:
								while (true) {
									var _v11 = _Utils_Tuple2(listA, listB);
									if (!_v11.a.b) {
										if (!_v11.b.b) {
											return $elm$core$Result$Ok($elm$core$Basics$EQ);
										} else {
											return $elm$core$Result$Ok($elm$core$Basics$LT);
										}
									} else {
										if (!_v11.b.b) {
											return $elm$core$Result$Ok($elm$core$Basics$GT);
										} else {
											var _v12 = _v11.a;
											var head1 = _v12.a;
											var tail1 = _v12.b;
											var _v13 = _v11.b;
											var head2 = _v13.a;
											var tail2 = _v13.b;
											var _v14 = A2($author$project$Morphir$Value$Native$Comparable$compareValue, head1, head2);
											if ((_v14.$ === 'Ok') && (_v14.a.$ === 'EQ')) {
												var _v15 = _v14.a;
												var $temp$listA = tail1,
													$temp$listB = tail2;
												listA = $temp$listA;
												listB = $temp$listB;
												continue fun;
											} else {
												var other = _v14;
												return other;
											}
										}
									}
								}
							});
						return A2(fun, list1, list2);
					} else {
						break _v0$6;
					}
				case 'Tuple':
					if (_v0.b.$ === 'Tuple') {
						var _v16 = _v0.a;
						var tupleList1 = _v16.b;
						var _v17 = _v0.b;
						var tupleList2 = _v17.b;
						var fun = F2(
							function (listA, listB) {
								fun:
								while (true) {
									var _v18 = _Utils_Tuple2(listA, listB);
									if (!_v18.a.b) {
										if (!_v18.b.b) {
											return $elm$core$Result$Ok($elm$core$Basics$EQ);
										} else {
											return $elm$core$Result$Err(
												A2($author$project$Morphir$Value$Error$TupleLengthNotMatchException, tupleList1, tupleList2));
										}
									} else {
										if (!_v18.b.b) {
											return $elm$core$Result$Err(
												A2($author$project$Morphir$Value$Error$TupleLengthNotMatchException, tupleList1, tupleList2));
										} else {
											var _v19 = _v18.a;
											var head1 = _v19.a;
											var tail1 = _v19.b;
											var _v20 = _v18.b;
											var head2 = _v20.a;
											var tail2 = _v20.b;
											var _v21 = A2($author$project$Morphir$Value$Native$Comparable$compareValue, head1, head2);
											if ((_v21.$ === 'Ok') && (_v21.a.$ === 'EQ')) {
												var _v22 = _v21.a;
												var $temp$listA = tail1,
													$temp$listB = tail2;
												listA = $temp$listA;
												listB = $temp$listB;
												continue fun;
											} else {
												var other = _v21;
												return other;
											}
										}
									}
								}
							});
						return A2(fun, tupleList1, tupleList2);
					} else {
						break _v0$6;
					}
				default:
					break _v0$6;
			}
		}
		var a = _v0.a;
		var b = _v0.b;
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$UnexpectedArguments(
				_List_fromArray(
					[a, b])));
	});
var $author$project$Morphir$Value$Error$ExpectedList = function (a) {
	return {$: 'ExpectedList', a: a};
};
var $elm$core$List$head = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(x);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$Result$toMaybe = function (result) {
	if (result.$ === 'Ok') {
		var v = result.a;
		return $elm$core$Maybe$Just(v);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $author$project$Morphir$ListOfResults$liftAllErrors = function (results) {
	var oks = A2(
		$elm$core$List$filterMap,
		function (result) {
			return $elm$core$Result$toMaybe(result);
		},
		results);
	var errs = A2(
		$elm$core$List$filterMap,
		function (result) {
			if (result.$ === 'Ok') {
				return $elm$core$Maybe$Nothing;
			} else {
				var e = result.a;
				return $elm$core$Maybe$Just(e);
			}
		},
		results);
	if (!errs.b) {
		return $elm$core$Result$Ok(oks);
	} else {
		return $elm$core$Result$Err(errs);
	}
};
var $author$project$Morphir$ListOfResults$liftFirstError = function (results) {
	var _v0 = $author$project$Morphir$ListOfResults$liftAllErrors(results);
	if (_v0.$ === 'Ok') {
		var a = _v0.a;
		return $elm$core$Result$Ok(a);
	} else {
		var errors = _v0.a;
		return A2(
			$elm$core$Maybe$withDefault,
			$elm$core$Result$Ok(_List_Nil),
			A2(
				$elm$core$Maybe$map,
				$elm$core$Result$Err,
				$elm$core$List$head(errors)));
	}
};
var $author$project$Morphir$Value$Native$decodeList = F3(
	function (decodeItem, _eval, value) {
		var _v0 = _eval(value);
		if (_v0.$ === 'Ok') {
			if (_v0.a.$ === 'List') {
				var _v1 = _v0.a;
				var values = _v1.b;
				return $author$project$Morphir$ListOfResults$liftFirstError(
					A2(
						$elm$core$List$map,
						decodeItem(_eval),
						values));
			} else {
				return $elm$core$Result$Err(
					$author$project$Morphir$Value$Error$ExpectedList(value));
			}
		} else {
			var error = _v0.a;
			return $elm$core$Result$Err(error);
		}
	});
var $author$project$Morphir$Value$Error$ExpectedLiteral = function (a) {
	return {$: 'ExpectedLiteral', a: a};
};
var $author$project$Morphir$Value$Native$decodeLiteral = F3(
	function (decodeLit, _eval, value) {
		var _v0 = _eval(value);
		if (_v0.$ === 'Ok') {
			if (_v0.a.$ === 'Literal') {
				var _v1 = _v0.a;
				var lit = _v1.b;
				return decodeLit(lit);
			} else {
				return $elm$core$Result$Err(
					$author$project$Morphir$Value$Error$ExpectedLiteral(value));
			}
		} else {
			var error = _v0.a;
			return $elm$core$Result$Err(error);
		}
	});
var $author$project$Morphir$Value$Native$decodeRaw = F2(
	function (_eval, value) {
		return _eval(value);
	});
var $author$project$Morphir$Value$Native$encodeList = F2(
	function (encodeA, list) {
		return A2(
			$elm$core$Result$map,
			$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
			$author$project$Morphir$ListOfResults$liftFirstError(
				A2($elm$core$List$map, encodeA, list)));
	});
var $author$project$Morphir$Value$Native$encodeLiteral = F2(
	function (toLit, a) {
		return $elm$core$Result$Ok(
			A2(
				$author$project$Morphir$IR$Value$Literal,
				_Utils_Tuple0,
				toLit(a)));
	});
var $author$project$Morphir$Value$Native$encodeRaw = function (value) {
	return $elm$core$Result$Ok(value);
};
var $elm$core$Basics$composeL = F3(
	function (g, f, x) {
		return g(
			f(x));
	});
var $elm$core$List$all = F2(
	function (isOkay, list) {
		return !A2(
			$elm$core$List$any,
			A2($elm$core$Basics$composeL, $elm$core$Basics$not, isOkay),
			list);
	});
var $author$project$Morphir$IR$Value$isData = function (value) {
	switch (value.$) {
		case 'Literal':
			return true;
		case 'Constructor':
			return true;
		case 'Tuple':
			var elems = value.b;
			return A2($elm$core$List$all, $author$project$Morphir$IR$Value$isData, elems);
		case 'List':
			var items = value.b;
			return A2($elm$core$List$all, $author$project$Morphir$IR$Value$isData, items);
		case 'Record':
			var fields = value.b;
			return A2(
				$elm$core$List$all,
				$author$project$Morphir$IR$Value$isData,
				A2($elm$core$List$map, $elm$core$Tuple$second, fields));
		case 'Apply':
			var fun = value.b;
			var arg = value.c;
			return $author$project$Morphir$IR$Value$isData(fun) && $author$project$Morphir$IR$Value$isData(arg);
		case 'Unit':
			return true;
		default:
			return false;
	}
};
var $author$project$Morphir$Value$Native$Eq$equal = F2(
	function (arg1, arg2) {
		return ($author$project$Morphir$IR$Value$isData(arg1) && $author$project$Morphir$IR$Value$isData(arg2)) ? $elm$core$Result$Ok(
			_Utils_eq(arg1, arg2)) : $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$UnexpectedArguments(
				_List_fromArray(
					[arg1, arg2])));
	});
var $author$project$Morphir$Value$Native$eval1 = F5(
	function (f, decodeA, encodeR, _eval, args) {
		if (args.b && (!args.b.b)) {
			var arg1 = args.a;
			return A2(
				$elm$core$Result$andThen,
				function (a) {
					return encodeR(
						f(a));
				},
				A2(decodeA, _eval, arg1));
		} else {
			return $elm$core$Result$Err(
				$author$project$Morphir$Value$Error$UnexpectedArguments(args));
		}
	});
var $author$project$Morphir$Value$Native$eval2 = F6(
	function (f, decodeA, decodeB, encodeR, _eval, args) {
		if ((args.b && args.b.b) && (!args.b.b.b)) {
			var arg1 = args.a;
			var _v1 = args.b;
			var arg2 = _v1.a;
			return A2(
				$elm$core$Result$andThen,
				function (a) {
					return A2(
						$elm$core$Result$andThen,
						function (b) {
							return encodeR(
								A2(f, a, b));
						},
						A2(decodeB, _eval, arg2));
				},
				A2(decodeA, _eval, arg1));
		} else {
			return $elm$core$Result$Err(
				$author$project$Morphir$Value$Error$UnexpectedArguments(args));
		}
	});
var $author$project$Morphir$Value$Native$eval3 = F7(
	function (f, decodeA, decodeB, decodeC, encodeR, _eval, args) {
		if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
			var arg1 = args.a;
			var _v1 = args.b;
			var arg2 = _v1.a;
			var _v2 = _v1.b;
			var arg3 = _v2.a;
			return A2(
				$elm$core$Result$andThen,
				function (a) {
					return A2(
						$elm$core$Result$andThen,
						function (b) {
							return A2(
								$elm$core$Result$andThen,
								function (c) {
									return encodeR(
										A3(f, a, b, c));
								},
								A2(decodeC, _eval, arg3));
						},
						A2(decodeB, _eval, arg2));
				},
				A2(decodeA, _eval, arg1));
		} else {
			return $elm$core$Result$Err(
				$author$project$Morphir$Value$Error$UnexpectedArguments(args));
		}
	});
var $author$project$Morphir$Value$Error$ExpectedFloatLiteral = function (a) {
	return {$: 'ExpectedFloatLiteral', a: a};
};
var $author$project$Morphir$Value$Native$floatLiteral = function (lit) {
	if (lit.$ === 'FloatLiteral') {
		var v = lit.a;
		return $elm$core$Result$Ok(v);
	} else {
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$ExpectedFloatLiteral(
				A2($author$project$Morphir$IR$Value$Literal, _Utils_Tuple0, lit)));
	}
};
var $author$project$Morphir$Value$Native$Comparable$greaterThan = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			function (order) {
				if (order.$ === 'GT') {
					return true;
				} else {
					return false;
				}
			},
			A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
	});
var $author$project$Morphir$Value$Native$Comparable$greaterThanOrEqual = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			function (order) {
				if (order.$ === 'LT') {
					return false;
				} else {
					return true;
				}
			},
			A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
	});
var $author$project$Morphir$Value$Error$ExpectedIntLiteral = function (a) {
	return {$: 'ExpectedIntLiteral', a: a};
};
var $author$project$Morphir$Value$Native$intLiteral = function (lit) {
	if (lit.$ === 'IntLiteral') {
		var v = lit.a;
		return $elm$core$Result$Ok(v);
	} else {
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$ExpectedIntLiteral(
				A2($author$project$Morphir$IR$Value$Literal, _Utils_Tuple0, lit)));
	}
};
var $author$project$Morphir$Value$Native$Comparable$lessThan = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			function (order) {
				if (order.$ === 'LT') {
					return true;
				} else {
					return false;
				}
			},
			A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
	});
var $author$project$Morphir$Value$Native$Comparable$lessThanOrEqual = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			function (order) {
				if (order.$ === 'GT') {
					return false;
				} else {
					return true;
				}
			},
			A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
	});
var $author$project$Morphir$Value$Native$Comparable$max = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			function (order) {
				if (order.$ === 'LT') {
					return arg2;
				} else {
					return arg1;
				}
			},
			A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
	});
var $author$project$Morphir$Value$Native$Comparable$min = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			function (order) {
				if (order.$ === 'GT') {
					return arg2;
				} else {
					return arg1;
				}
			},
			A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
	});
var $author$project$Morphir$IR$SDK$Basics$moduleName = $author$project$Morphir$IR$Path$fromString('Basics');
var $author$project$Morphir$Value$Native$Eq$notEqual = F2(
	function (arg1, arg2) {
		return A2(
			$elm$core$Result$map,
			$elm$core$Basics$not,
			A2($author$project$Morphir$Value$Native$Eq$equal, arg1, arg2));
	});
var $author$project$Morphir$Value$Error$NotImplemented = {$: 'NotImplemented'};
var $author$project$Morphir$Value$Native$oneOf = function (funs) {
	return A3(
		$elm$core$List$foldl,
		F2(
			function (nextFun, funSoFar) {
				return F2(
					function (_eval, args) {
						var _v0 = A2(funSoFar, _eval, args);
						if (_v0.$ === 'Ok') {
							var result = _v0.a;
							return $elm$core$Result$Ok(result);
						} else {
							return A2(nextFun, _eval, args);
						}
					});
			}),
		F2(
			function (_eval, args) {
				return $elm$core$Result$Err($author$project$Morphir$Value$Error$NotImplemented);
			}),
		funs);
};
var $elm$core$Basics$pow = _Basics_pow;
var $author$project$Morphir$Value$Error$ExpectedStringLiteral = function (a) {
	return {$: 'ExpectedStringLiteral', a: a};
};
var $author$project$Morphir$Value$Native$stringLiteral = function (lit) {
	if (lit.$ === 'StringLiteral') {
		var v = lit.a;
		return $elm$core$Result$Ok(v);
	} else {
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$ExpectedStringLiteral(
				A2($author$project$Morphir$IR$Value$Literal, _Utils_Tuple0, lit)));
	}
};
var $author$project$Morphir$Value$Native$unaryLazy = function (f) {
	return F2(
		function (_eval, args) {
			if (args.b && (!args.b.b)) {
				var arg = args.a;
				return A2(f, _eval, arg);
			} else {
				return $elm$core$Result$Err(
					$author$project$Morphir$Value$Error$UnexpectedArguments(args));
			}
		});
};
var $author$project$Morphir$Value$Native$unaryStrict = function (f) {
	return $author$project$Morphir$Value$Native$unaryLazy(
		F2(
			function (_eval, arg) {
				return A2(
					$elm$core$Result$andThen,
					f(_eval),
					_eval(arg));
			}));
};
var $elm$core$Basics$xor = _Basics_xor;
var $author$project$Morphir$IR$SDK$Basics$nativeFunctions = _List_fromArray(
	[
		_Utils_Tuple2(
		'not',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$not,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple2(
		'and',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$and,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple2(
		'or',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$or,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple2(
		'xor',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$xor,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple2(
		'add',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$add,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$add,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'subtract',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$sub,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$sub,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'multiply',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$mul,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$mul,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'divide',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$fdiv,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple2(
		'integerDivide',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$idiv,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple2(
		'power',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$pow,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$pow,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'equal',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (bool) {
							return A2(
								$author$project$Morphir$IR$Value$Literal,
								_Utils_Tuple0,
								$author$project$Morphir$IR$Literal$BoolLiteral(bool));
						},
						A2($author$project$Morphir$Value$Native$Eq$equal, arg1, arg2));
				}))),
		_Utils_Tuple2(
		'notEqual',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (bool) {
							return A2(
								$author$project$Morphir$IR$Value$Literal,
								_Utils_Tuple0,
								$author$project$Morphir$IR$Literal$BoolLiteral(bool));
						},
						A2($author$project$Morphir$Value$Native$Eq$notEqual, arg1, arg2));
				}))),
		_Utils_Tuple2(
		'identity',
		$author$project$Morphir$Value$Native$unaryStrict(
			function (arg1) {
				return arg1;
			})),
		_Utils_Tuple2(
		'always',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, _v0) {
					return $elm$core$Result$Ok(arg1);
				}))),
		_Utils_Tuple2(
		'never',
		F2(
			function (_eval, args) {
				return $elm$core$Result$Err(
					$author$project$Morphir$Value$Error$UnexpectedArguments(args));
			})),
		_Utils_Tuple2(
		'composeLeft',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun1 = args.a;
					var _v2 = args.b;
					var fun2 = _v2.a;
					var _v3 = _v2.b;
					var arg1 = _v3.a;
					return A2(
						$elm$core$Result$andThen,
						function (arg2) {
							return _eval(
								A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun1, arg2));
						},
						_eval(
							A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun2, arg1)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'composeRight',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun1 = args.a;
					var _v5 = args.b;
					var fun2 = _v5.a;
					var _v6 = _v5.b;
					var arg1 = _v6.a;
					return A2(
						$elm$core$Result$andThen,
						function (arg2) {
							return _eval(
								A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun2, arg2));
						},
						_eval(
							A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun1, arg1)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'lessThan',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (bool) {
							return A2(
								$author$project$Morphir$IR$Value$Literal,
								_Utils_Tuple0,
								$author$project$Morphir$IR$Literal$BoolLiteral(bool));
						},
						A2($author$project$Morphir$Value$Native$Comparable$lessThan, arg1, arg2));
				}))),
		_Utils_Tuple2(
		'greaterThan',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (bool) {
							return A2(
								$author$project$Morphir$IR$Value$Literal,
								_Utils_Tuple0,
								$author$project$Morphir$IR$Literal$BoolLiteral(bool));
						},
						A2($author$project$Morphir$Value$Native$Comparable$greaterThan, arg1, arg2));
				}))),
		_Utils_Tuple2(
		'lessThanOrEqual',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (bool) {
							return A2(
								$author$project$Morphir$IR$Value$Literal,
								_Utils_Tuple0,
								$author$project$Morphir$IR$Literal$BoolLiteral(bool));
						},
						A2($author$project$Morphir$Value$Native$Comparable$lessThanOrEqual, arg1, arg2));
				}))),
		_Utils_Tuple2(
		'greaterThanOrEqual',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (bool) {
							return A2(
								$author$project$Morphir$IR$Value$Literal,
								_Utils_Tuple0,
								$author$project$Morphir$IR$Literal$BoolLiteral(bool));
						},
						A2($author$project$Morphir$Value$Native$Comparable$greaterThanOrEqual, arg1, arg2));
				}))),
		_Utils_Tuple2(
		'abs',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$Basics$abs,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$Basics$abs,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'toFloat',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$Basics$toFloat,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'negate',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$Basics$negate,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$Basics$negate,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'clamp',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A5(
					$author$project$Morphir$Value$Native$eval3,
					$elm$core$Basics$clamp,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)),
					A5(
					$author$project$Morphir$Value$Native$eval3,
					$elm$core$Basics$clamp,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))
				]))),
		_Utils_Tuple2(
		'max',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2($author$project$Morphir$Value$Native$Comparable$max, arg1, arg2);
				}))),
		_Utils_Tuple2(
		'min',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2($author$project$Morphir$Value$Native$Comparable$min, arg1, arg2);
				}))),
		_Utils_Tuple2(
		'append',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$append,
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral)),
					A4(
					$author$project$Morphir$Value$Native$eval2,
					$elm$core$Basics$append,
					$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
					$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
					$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))
				]))),
		_Utils_Tuple2(
		'compare',
		$author$project$Morphir$Value$Native$binaryStrict(
			F2(
				function (arg1, arg2) {
					return A2(
						$elm$core$Result$map,
						function (order) {
							var val = function () {
								switch (order.$) {
									case 'GT':
										return 'GT';
									case 'LT':
										return 'LT';
									default:
										return 'EQ';
								}
							}();
							return A2(
								$author$project$Morphir$IR$Value$Constructor,
								_Utils_Tuple0,
								A2($author$project$Morphir$IR$SDK$Common$toFQName, $author$project$Morphir$IR$SDK$Basics$moduleName, val));
						},
						A2($author$project$Morphir$Value$Native$Comparable$compareValue, arg1, arg2));
				})))
	]);
var $author$project$Morphir$Value$Native$decodeFun1 = F4(
	function (encodeA, decodeR, _eval, fun) {
		return $elm$core$Result$Ok(
			function (a) {
				return A2(
					$elm$core$Result$andThen,
					decodeR(_eval),
					A2(
						$elm$core$Result$andThen,
						function (arg) {
							return _eval(
								A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, arg));
						},
						encodeA(a)));
			});
	});
var $author$project$Morphir$Value$Error$ExpectedTuple = function (a) {
	return {$: 'ExpectedTuple', a: a};
};
var $elm$core$Result$map2 = F3(
	function (func, ra, rb) {
		if (ra.$ === 'Err') {
			var x = ra.a;
			return $elm$core$Result$Err(x);
		} else {
			var a = ra.a;
			if (rb.$ === 'Err') {
				var x = rb.a;
				return $elm$core$Result$Err(x);
			} else {
				var b = rb.a;
				return $elm$core$Result$Ok(
					A2(func, a, b));
			}
		}
	});
var $author$project$Morphir$Value$Native$decodeTuple2 = F3(
	function (_v0, _eval, value) {
		var decodeA = _v0.a;
		var decodeB = _v0.b;
		var _v1 = _eval(value);
		if (_v1.$ === 'Ok') {
			if ((((_v1.a.$ === 'Tuple') && _v1.a.b.b) && _v1.a.b.b.b) && (!_v1.a.b.b.b.b)) {
				var _v2 = _v1.a;
				var _v3 = _v2.b;
				var val1 = _v3.a;
				var _v4 = _v3.b;
				var val2 = _v4.a;
				return A3(
					$elm$core$Result$map2,
					F2(
						function (a1, b1) {
							return _Utils_Tuple2(a1, b1);
						}),
					A2(decodeA, _eval, val1),
					A2(decodeB, _eval, val2));
			} else {
				return $elm$core$Result$Err(
					$author$project$Morphir$Value$Error$ExpectedTuple(value));
			}
		} else {
			var error = _v1.a;
			return $elm$core$Result$Err(error);
		}
	});
var $elm$core$List$drop = F2(
	function (n, list) {
		drop:
		while (true) {
			if (n <= 0) {
				return list;
			} else {
				if (!list.b) {
					return list;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs;
					n = $temp$n;
					list = $temp$list;
					continue drop;
				}
			}
		}
	});
var $author$project$Morphir$Value$Native$encodeMaybe = F2(
	function (encodeA, maybe) {
		if (maybe.$ === 'Just') {
			var a = maybe.a;
			return A2(
				$elm$core$Result$map,
				A2(
					$author$project$Morphir$IR$Value$Apply,
					_Utils_Tuple0,
					A2(
						$author$project$Morphir$IR$Value$Constructor,
						_Utils_Tuple0,
						_Utils_Tuple3(
							_List_fromArray(
								[
									_List_fromArray(
									['morphir']),
									_List_fromArray(
									['s', 'd', 'k'])
								]),
							_List_fromArray(
								[
									_List_fromArray(
									['maybe'])
								]),
							_List_fromArray(
								['just'])))),
				encodeA(a));
		} else {
			return $elm$core$Result$Ok(
				A2(
					$author$project$Morphir$IR$Value$Constructor,
					_Utils_Tuple0,
					_Utils_Tuple3(
						_List_fromArray(
							[
								_List_fromArray(
								['morphir']),
								_List_fromArray(
								['s', 'd', 'k'])
							]),
						_List_fromArray(
							[
								_List_fromArray(
								['maybe'])
							]),
						_List_fromArray(
							['nothing']))));
		}
	});
var $author$project$Morphir$Value$Native$encodeResultList = function (listOfValueResults) {
	return A2(
		$elm$core$Result$map,
		$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
		$author$project$Morphir$ListOfResults$liftFirstError(listOfValueResults));
};
var $author$project$Morphir$Value$Native$encodeTuple2 = F2(
	function (_v0, _v1) {
		var encodeA = _v0.a;
		var encodeB = _v0.b;
		var a = _v1.a;
		var b = _v1.b;
		return A3(
			$elm$core$Result$map2,
			F2(
				function (a1, b1) {
					return A2(
						$author$project$Morphir$IR$Value$Tuple,
						_Utils_Tuple0,
						_List_fromArray(
							[a1, b1]));
				}),
			encodeA(a),
			encodeB(b));
	});
var $elm$core$List$intersperse = F2(
	function (sep, xs) {
		if (!xs.b) {
			return _List_Nil;
		} else {
			var hd = xs.a;
			var tl = xs.b;
			var step = F2(
				function (x, rest) {
					return A2(
						$elm$core$List$cons,
						sep,
						A2($elm$core$List$cons, x, rest));
				});
			var spersed = A3($elm$core$List$foldr, step, _List_Nil, tl);
			return A2($elm$core$List$cons, hd, spersed);
		}
	});
var $elm$core$List$map3 = _List_map3;
var $elm$core$Result$map3 = F4(
	function (func, ra, rb, rc) {
		if (ra.$ === 'Err') {
			var x = ra.a;
			return $elm$core$Result$Err(x);
		} else {
			var a = ra.a;
			if (rb.$ === 'Err') {
				var x = rb.a;
				return $elm$core$Result$Err(x);
			} else {
				var b = rb.a;
				if (rc.$ === 'Err') {
					var x = rc.a;
					return $elm$core$Result$Err(x);
				} else {
					var c = rc.a;
					return $elm$core$Result$Ok(
						A3(func, a, b, c));
				}
			}
		}
	});
var $elm$core$List$map4 = _List_map4;
var $elm$core$Result$map4 = F5(
	function (func, ra, rb, rc, rd) {
		if (ra.$ === 'Err') {
			var x = ra.a;
			return $elm$core$Result$Err(x);
		} else {
			var a = ra.a;
			if (rb.$ === 'Err') {
				var x = rb.a;
				return $elm$core$Result$Err(x);
			} else {
				var b = rb.a;
				if (rc.$ === 'Err') {
					var x = rc.a;
					return $elm$core$Result$Err(x);
				} else {
					var c = rc.a;
					if (rd.$ === 'Err') {
						var x = rd.a;
						return $elm$core$Result$Err(x);
					} else {
						var d = rd.a;
						return $elm$core$Result$Ok(
							A4(func, a, b, c, d));
					}
				}
			}
		}
	});
var $elm$core$List$map5 = _List_map5;
var $elm$core$Result$map5 = F6(
	function (func, ra, rb, rc, rd, re) {
		if (ra.$ === 'Err') {
			var x = ra.a;
			return $elm$core$Result$Err(x);
		} else {
			var a = ra.a;
			if (rb.$ === 'Err') {
				var x = rb.a;
				return $elm$core$Result$Err(x);
			} else {
				var b = rb.a;
				if (rc.$ === 'Err') {
					var x = rc.a;
					return $elm$core$Result$Err(x);
				} else {
					var c = rc.a;
					if (rd.$ === 'Err') {
						var x = rd.a;
						return $elm$core$Result$Err(x);
					} else {
						var d = rd.a;
						if (re.$ === 'Err') {
							var x = re.a;
							return $elm$core$Result$Err(x);
						} else {
							var e = re.a;
							return $elm$core$Result$Ok(
								A5(func, a, b, c, d, e));
						}
					}
				}
			}
		}
	});
var $elm$core$List$member = F2(
	function (x, xs) {
		return A2(
			$elm$core$List$any,
			function (a) {
				return _Utils_eq(a, x);
			},
			xs);
	});
var $elm$core$List$product = function (numbers) {
	return A3($elm$core$List$foldl, $elm$core$Basics$mul, 1, numbers);
};
var $elm$core$List$repeatHelp = F3(
	function (result, n, value) {
		repeatHelp:
		while (true) {
			if (n <= 0) {
				return result;
			} else {
				var $temp$result = A2($elm$core$List$cons, value, result),
					$temp$n = n - 1,
					$temp$value = value;
				result = $temp$result;
				n = $temp$n;
				value = $temp$value;
				continue repeatHelp;
			}
		}
	});
var $elm$core$List$repeat = F2(
	function (n, value) {
		return A3($elm$core$List$repeatHelp, _List_Nil, n, value);
	});
var $elm$core$List$singleton = function (value) {
	return _List_fromArray(
		[value]);
};
var $elm$core$List$sum = function (numbers) {
	return A3($elm$core$List$foldl, $elm$core$Basics$add, 0, numbers);
};
var $elm$core$List$tail = function (list) {
	if (list.b) {
		var x = list.a;
		var xs = list.b;
		return $elm$core$Maybe$Just(xs);
	} else {
		return $elm$core$Maybe$Nothing;
	}
};
var $elm$core$List$takeReverse = F3(
	function (n, list, kept) {
		takeReverse:
		while (true) {
			if (n <= 0) {
				return kept;
			} else {
				if (!list.b) {
					return kept;
				} else {
					var x = list.a;
					var xs = list.b;
					var $temp$n = n - 1,
						$temp$list = xs,
						$temp$kept = A2($elm$core$List$cons, x, kept);
					n = $temp$n;
					list = $temp$list;
					kept = $temp$kept;
					continue takeReverse;
				}
			}
		}
	});
var $elm$core$List$takeTailRec = F2(
	function (n, list) {
		return $elm$core$List$reverse(
			A3($elm$core$List$takeReverse, n, list, _List_Nil));
	});
var $elm$core$List$takeFast = F3(
	function (ctr, n, list) {
		if (n <= 0) {
			return _List_Nil;
		} else {
			var _v0 = _Utils_Tuple2(n, list);
			_v0$1:
			while (true) {
				_v0$5:
				while (true) {
					if (!_v0.b.b) {
						return list;
					} else {
						if (_v0.b.b.b) {
							switch (_v0.a) {
								case 1:
									break _v0$1;
								case 2:
									var _v2 = _v0.b;
									var x = _v2.a;
									var _v3 = _v2.b;
									var y = _v3.a;
									return _List_fromArray(
										[x, y]);
								case 3:
									if (_v0.b.b.b.b) {
										var _v4 = _v0.b;
										var x = _v4.a;
										var _v5 = _v4.b;
										var y = _v5.a;
										var _v6 = _v5.b;
										var z = _v6.a;
										return _List_fromArray(
											[x, y, z]);
									} else {
										break _v0$5;
									}
								default:
									if (_v0.b.b.b.b && _v0.b.b.b.b.b) {
										var _v7 = _v0.b;
										var x = _v7.a;
										var _v8 = _v7.b;
										var y = _v8.a;
										var _v9 = _v8.b;
										var z = _v9.a;
										var _v10 = _v9.b;
										var w = _v10.a;
										var tl = _v10.b;
										return (ctr > 1000) ? A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A2($elm$core$List$takeTailRec, n - 4, tl))))) : A2(
											$elm$core$List$cons,
											x,
											A2(
												$elm$core$List$cons,
												y,
												A2(
													$elm$core$List$cons,
													z,
													A2(
														$elm$core$List$cons,
														w,
														A3($elm$core$List$takeFast, ctr + 1, n - 4, tl)))));
									} else {
										break _v0$5;
									}
							}
						} else {
							if (_v0.a === 1) {
								break _v0$1;
							} else {
								break _v0$5;
							}
						}
					}
				}
				return list;
			}
			var _v1 = _v0.b;
			var x = _v1.a;
			return _List_fromArray(
				[x]);
		}
	});
var $elm$core$List$take = F2(
	function (n, list) {
		return A3($elm$core$List$takeFast, 0, n, list);
	});
var $elm$core$List$unzip = function (pairs) {
	var step = F2(
		function (_v0, _v1) {
			var x = _v0.a;
			var y = _v0.b;
			var xs = _v1.a;
			var ys = _v1.b;
			return _Utils_Tuple2(
				A2($elm$core$List$cons, x, xs),
				A2($elm$core$List$cons, y, ys));
		});
	return A3(
		$elm$core$List$foldr,
		step,
		_Utils_Tuple2(_List_Nil, _List_Nil),
		pairs);
};
var $author$project$Morphir$IR$SDK$List$nativeFunctions = _List_fromArray(
	[
		_Utils_Tuple2(
		'singleton',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$singleton,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'repeat',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$repeat,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'cons',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$cons,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'map',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$map,
			A2($author$project$Morphir$Value$Native$decodeFun1, $author$project$Morphir$Value$Native$encodeRaw, $author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeResultList)),
		_Utils_Tuple2(
		'filter',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v1 = args.b;
					var arg1 = _v1.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = F2(
									function (list, items) {
										evaluate:
										while (true) {
											if (!items.b) {
												return $elm$core$Result$Ok(list);
											} else {
												var head = items.a;
												var tail = items.b;
												var _v4 = _eval(
													A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, head));
												if (_v4.$ === 'Ok') {
													if ((_v4.a.$ === 'Literal') && (_v4.a.b.$ === 'BoolLiteral')) {
														if (_v4.a.b.a) {
															var _v5 = _v4.a;
															var $temp$list = _Utils_ap(
																list,
																_List_fromArray(
																	[head])),
																$temp$items = tail;
															list = $temp$list;
															items = $temp$items;
															continue evaluate;
														} else {
															var _v6 = _v4.a;
															var $temp$list = list,
																$temp$items = tail;
															list = $temp$list;
															items = $temp$items;
															continue evaluate;
														}
													} else {
														var other = _v4.a;
														return $elm$core$Result$Err(
															$author$project$Morphir$Value$Error$ExpectedBoolLiteral(other));
													}
												} else {
													var other = _v4.a;
													return $elm$core$Result$Err(other);
												}
											}
										}
									});
								return A2(
									$elm$core$Result$map,
									$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
									A2(evaluate, _List_Nil, listItems));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'filterMap',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v8 = args.b;
					var arg1 = _v8.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = F2(
									function (list, items) {
										evaluate:
										while (true) {
											if (!items.b) {
												return $elm$core$Result$Ok(list);
											} else {
												var head = items.a;
												var tail = items.b;
												var _v11 = _eval(
													A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, head));
												_v11$2:
												while (true) {
													if (_v11.$ === 'Ok') {
														switch (_v11.a.$) {
															case 'Apply':
																if ((((((((((((((((((((((_v11.a.b.$ === 'Constructor') && _v11.a.b.b.a.b) && _v11.a.b.b.a.a.b) && (_v11.a.b.b.a.a.a === 'morphir')) && (!_v11.a.b.b.a.a.b.b)) && _v11.a.b.b.a.b.b) && _v11.a.b.b.a.b.a.b) && (_v11.a.b.b.a.b.a.a === 's')) && _v11.a.b.b.a.b.a.b.b) && (_v11.a.b.b.a.b.a.b.a === 'd')) && _v11.a.b.b.a.b.a.b.b.b) && (_v11.a.b.b.a.b.a.b.b.a === 'k')) && (!_v11.a.b.b.a.b.a.b.b.b.b)) && (!_v11.a.b.b.a.b.b.b)) && _v11.a.b.b.b.b) && _v11.a.b.b.b.a.b) && (_v11.a.b.b.b.a.a === 'maybe')) && (!_v11.a.b.b.b.a.b.b)) && (!_v11.a.b.b.b.b.b)) && _v11.a.b.b.c.b) && (_v11.a.b.b.c.a === 'just')) && (!_v11.a.b.b.c.b.b)) {
																	var _v12 = _v11.a;
																	var _v13 = _v12.b;
																	var _v14 = _v13.b;
																	var _v15 = _v14.a;
																	var _v16 = _v15.a;
																	var _v17 = _v15.b;
																	var _v18 = _v17.a;
																	var _v19 = _v18.b;
																	var _v20 = _v19.b;
																	var _v21 = _v14.b;
																	var _v22 = _v21.a;
																	var _v23 = _v14.c;
																	var value = _v12.c;
																	var $temp$list = _Utils_ap(
																		list,
																		_List_fromArray(
																			[value])),
																		$temp$items = tail;
																	list = $temp$list;
																	items = $temp$items;
																	continue evaluate;
																} else {
																	break _v11$2;
																}
															case 'Constructor':
																if ((((((((((((((((((((_v11.a.b.a.b && _v11.a.b.a.a.b) && (_v11.a.b.a.a.a === 'morphir')) && (!_v11.a.b.a.a.b.b)) && _v11.a.b.a.b.b) && _v11.a.b.a.b.a.b) && (_v11.a.b.a.b.a.a === 's')) && _v11.a.b.a.b.a.b.b) && (_v11.a.b.a.b.a.b.a === 'd')) && _v11.a.b.a.b.a.b.b.b) && (_v11.a.b.a.b.a.b.b.a === 'k')) && (!_v11.a.b.a.b.a.b.b.b.b)) && (!_v11.a.b.a.b.b.b)) && _v11.a.b.b.b) && _v11.a.b.b.a.b) && (_v11.a.b.b.a.a === 'maybe')) && (!_v11.a.b.b.a.b.b)) && (!_v11.a.b.b.b.b)) && _v11.a.b.c.b) && (_v11.a.b.c.a === 'nothing')) && (!_v11.a.b.c.b.b)) {
																	var _v24 = _v11.a;
																	var _v25 = _v24.b;
																	var _v26 = _v25.a;
																	var _v27 = _v26.a;
																	var _v28 = _v26.b;
																	var _v29 = _v28.a;
																	var _v30 = _v29.b;
																	var _v31 = _v30.b;
																	var _v32 = _v25.b;
																	var _v33 = _v32.a;
																	var _v34 = _v25.c;
																	var $temp$list = list,
																		$temp$items = tail;
																	list = $temp$list;
																	items = $temp$items;
																	continue evaluate;
																} else {
																	break _v11$2;
																}
															default:
																break _v11$2;
														}
													} else {
														var other = _v11.a;
														return $elm$core$Result$Err(other);
													}
												}
												var other = _v11.a;
												return $elm$core$Result$Err(
													$author$project$Morphir$Value$Error$ExpectedBoolLiteral(other));
											}
										}
									});
								return A2(
									$elm$core$Result$map,
									$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
									A2(evaluate, _List_Nil, listItems));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'foldl',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun = args.a;
					var _v36 = args.b;
					var arg1 = _v36.a;
					var _v37 = _v36.b;
					var arg2 = _v37.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg2) {
							if (evaluatedArg2.$ === 'List') {
								var listItems = evaluatedArg2.b;
								return A3(
									$elm$core$List$foldl,
									F2(
										function (next, resultSoFar) {
											return A2(
												$elm$core$Result$andThen,
												function (soFar) {
													return A2(
														$elm$core$Result$andThen,
														function (evaluatedNext) {
															return _eval(
																A3(
																	$author$project$Morphir$IR$Value$Apply,
																	_Utils_Tuple0,
																	A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, evaluatedNext),
																	soFar));
														},
														_eval(next));
												},
												resultSoFar);
										}),
									_eval(arg1),
									listItems);
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg2));
							}
						},
						_eval(arg2));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'foldr',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun = args.a;
					var _v40 = args.b;
					var arg1 = _v40.a;
					var _v41 = _v40.b;
					var arg2 = _v41.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg2) {
							if (evaluatedArg2.$ === 'List') {
								var listItems = evaluatedArg2.b;
								return A3(
									$elm$core$List$foldr,
									F2(
										function (next, resultSoFar) {
											return A2(
												$elm$core$Result$andThen,
												function (soFar) {
													return A2(
														$elm$core$Result$andThen,
														function (evaluatedNext) {
															return _eval(
																A3(
																	$author$project$Morphir$IR$Value$Apply,
																	_Utils_Tuple0,
																	A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, evaluatedNext),
																	soFar));
														},
														_eval(next));
												},
												resultSoFar);
										}),
									_eval(arg1),
									listItems);
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg2));
							}
						},
						_eval(arg2));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'length',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$length,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple2(
		'reverse',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$reverse,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'member',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$member,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple2(
		'all',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v44 = args.b;
					var arg1 = _v44.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = function (items) {
									evaluate:
									while (true) {
										if (!items.b) {
											return $elm$core$Result$Ok(true);
										} else {
											var head1 = items.a;
											var tail1 = items.b;
											var _v47 = _eval(
												A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, head1));
											if (_v47.$ === 'Ok') {
												if ((_v47.a.$ === 'Literal') && (_v47.a.b.$ === 'BoolLiteral')) {
													if (_v47.a.b.a) {
														var _v48 = _v47.a;
														var $temp$items = tail1;
														items = $temp$items;
														continue evaluate;
													} else {
														var _v49 = _v47.a;
														return $elm$core$Result$Ok(false);
													}
												} else {
													var other = _v47.a;
													return $elm$core$Result$Err(
														$author$project$Morphir$Value$Error$ExpectedBoolLiteral(other));
												}
											} else {
												var other = _v47.a;
												return $elm$core$Result$Err(other);
											}
										}
									}
								};
								return A2(
									$elm$core$Result$map,
									function (val) {
										return A2(
											$author$project$Morphir$IR$Value$Literal,
											_Utils_Tuple0,
											$author$project$Morphir$IR$Literal$BoolLiteral(val));
									},
									evaluate(listItems));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'any',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v51 = args.b;
					var arg1 = _v51.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = function (items) {
									evaluate:
									while (true) {
										if (!items.b) {
											return $elm$core$Result$Ok(false);
										} else {
											var head1 = items.a;
											var tail1 = items.b;
											var _v54 = _eval(
												A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, head1));
											if (_v54.$ === 'Ok') {
												if ((_v54.a.$ === 'Literal') && (_v54.a.b.$ === 'BoolLiteral')) {
													if (!_v54.a.b.a) {
														var _v55 = _v54.a;
														var $temp$items = tail1;
														items = $temp$items;
														continue evaluate;
													} else {
														var _v56 = _v54.a;
														return $elm$core$Result$Ok(true);
													}
												} else {
													var other = _v54.a;
													return $elm$core$Result$Err(
														$author$project$Morphir$Value$Error$ExpectedBoolLiteral(other));
												}
											} else {
												var other = _v54.a;
												return $elm$core$Result$Err(other);
											}
										}
									}
								};
								return A2(
									$elm$core$Result$map,
									function (val) {
										return A2(
											$author$project$Morphir$IR$Value$Literal,
											_Utils_Tuple0,
											$author$project$Morphir$IR$Literal$BoolLiteral(val));
									},
									evaluate(listItems));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'maximum',
		F2(
			function (_eval, args) {
				if (args.b && (!args.b.b)) {
					var arg1 = args.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = function (items) {
									if (!items.b) {
										return $elm$core$Result$Ok(
											$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
									} else {
										var head = items.a;
										var tail = items.b;
										return A2(
											$elm$core$Result$map,
											$author$project$Morphir$IR$SDK$Maybe$just(_Utils_Tuple0),
											A3(
												$elm$core$List$foldl,
												F2(
													function (next, resultSoFar) {
														return A2(
															$elm$core$Result$andThen,
															function (soFar) {
																return A2(
																	$elm$core$Result$andThen,
																	function (evaluatedNext) {
																		return A2(
																			$elm$core$Result$map,
																			function (order) {
																				if (order.$ === 'LT') {
																					return soFar;
																				} else {
																					return evaluatedNext;
																				}
																			},
																			A2($author$project$Morphir$Value$Native$Comparable$compareValue, evaluatedNext, soFar));
																	},
																	_eval(next));
															},
															resultSoFar);
													}),
												_eval(head),
												tail));
									}
								};
								return evaluate(listItems);
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'minimum',
		F2(
			function (_eval, args) {
				if (args.b && (!args.b.b)) {
					var arg1 = args.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = function (items) {
									if (!items.b) {
										return $elm$core$Result$Ok(
											$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
									} else {
										var head = items.a;
										var tail = items.b;
										return A2(
											$elm$core$Result$map,
											$author$project$Morphir$IR$SDK$Maybe$just(_Utils_Tuple0),
											A3(
												$elm$core$List$foldl,
												F2(
													function (next, resultSoFar) {
														return A2(
															$elm$core$Result$andThen,
															function (soFar) {
																return A2(
																	$elm$core$Result$andThen,
																	function (evaluatedNext) {
																		return A2(
																			$elm$core$Result$map,
																			function (order) {
																				if (order.$ === 'LT') {
																					return evaluatedNext;
																				} else {
																					return soFar;
																				}
																			},
																			A2($author$project$Morphir$Value$Native$Comparable$compareValue, evaluatedNext, soFar));
																	},
																	_eval(next));
															},
															resultSoFar);
													}),
												_eval(head),
												tail));
									}
								};
								return evaluate(listItems);
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'sum',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$List$sum,
					$author$project$Morphir$Value$Native$decodeList(
						$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral)),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral)),
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$List$sum,
					$author$project$Morphir$Value$Native$decodeList(
						$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral)),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))
				]))),
		_Utils_Tuple2(
		'product',
		$author$project$Morphir$Value$Native$oneOf(
			_List_fromArray(
				[
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$List$product,
					$author$project$Morphir$Value$Native$decodeList(
						$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral)),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral)),
					A3(
					$author$project$Morphir$Value$Native$eval1,
					$elm$core$List$product,
					$author$project$Morphir$Value$Native$decodeList(
						$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral)),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))
				]))),
		_Utils_Tuple2(
		'append',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$append,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'concat',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$concat,
			$author$project$Morphir$Value$Native$decodeList(
				$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw)),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'intersperse',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$intersperse,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'indexedMap',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v66 = args.b;
					var arg1 = _v66.a;
					return A2(
						$elm$core$Result$andThen,
						$elm$core$Basics$identity,
						A2(
							$elm$core$Result$map,
							function (evaluatedArg1) {
								if (evaluatedArg1.$ === 'List') {
									var listItems1 = evaluatedArg1.b;
									return A2(
										$elm$core$Result$map,
										$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
										$author$project$Morphir$ListOfResults$liftFirstError(
											A2(
												$elm$core$List$indexedMap,
												F2(
													function (index, item1) {
														return _eval(
															A3(
																$author$project$Morphir$IR$Value$Apply,
																_Utils_Tuple0,
																A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, item1),
																A2(
																	$author$project$Morphir$IR$Value$Literal,
																	_Utils_Tuple0,
																	$author$project$Morphir$IR$Literal$IntLiteral(index))));
													}),
												listItems1)));
								} else {
									return $elm$core$Result$Err(
										$author$project$Morphir$Value$Error$UnexpectedArguments(args));
								}
							},
							_eval(arg1)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map2',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun = args.a;
					var _v69 = args.b;
					var arg1 = _v69.a;
					var _v70 = _v69.b;
					var arg2 = _v70.a;
					return A2(
						$elm$core$Result$andThen,
						$elm$core$Basics$identity,
						A3(
							$elm$core$Result$map2,
							F2(
								function (evaluatedArg1, evaluatedArg2) {
									var _v71 = _Utils_Tuple2(evaluatedArg1, evaluatedArg2);
									if ((_v71.a.$ === 'List') && (_v71.b.$ === 'List')) {
										var _v72 = _v71.a;
										var listItems1 = _v72.b;
										var _v73 = _v71.b;
										var listItems2 = _v73.b;
										return A2(
											$elm$core$Result$map,
											$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
											$author$project$Morphir$ListOfResults$liftFirstError(
												A3(
													$elm$core$List$map2,
													F2(
														function (item1, item2) {
															return _eval(
																A3(
																	$author$project$Morphir$IR$Value$Apply,
																	_Utils_Tuple0,
																	A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, item1),
																	item2));
														}),
													listItems1,
													listItems2)));
									} else {
										return $elm$core$Result$Err(
											$author$project$Morphir$Value$Error$UnexpectedArguments(args));
									}
								}),
							_eval(arg1),
							_eval(arg2)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map3',
		F2(
			function (_eval, args) {
				if ((((args.b && args.b.b) && args.b.b.b) && args.b.b.b.b) && (!args.b.b.b.b.b)) {
					var fun = args.a;
					var _v75 = args.b;
					var arg1 = _v75.a;
					var _v76 = _v75.b;
					var arg2 = _v76.a;
					var _v77 = _v76.b;
					var arg3 = _v77.a;
					return A2(
						$elm$core$Result$andThen,
						$elm$core$Basics$identity,
						A4(
							$elm$core$Result$map3,
							F3(
								function (evaluatedArg1, evaluatedArg2, evaluatedArg3) {
									var _v78 = _Utils_Tuple3(evaluatedArg1, evaluatedArg2, evaluatedArg3);
									if (((_v78.a.$ === 'List') && (_v78.b.$ === 'List')) && (_v78.c.$ === 'List')) {
										var _v79 = _v78.a;
										var listItems1 = _v79.b;
										var _v80 = _v78.b;
										var listItems2 = _v80.b;
										var _v81 = _v78.c;
										var listItems3 = _v81.b;
										return A2(
											$elm$core$Result$map,
											$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
											$author$project$Morphir$ListOfResults$liftFirstError(
												A4(
													$elm$core$List$map3,
													F3(
														function (item1, item2, item3) {
															return _eval(
																A3(
																	$author$project$Morphir$IR$Value$Apply,
																	_Utils_Tuple0,
																	A3(
																		$author$project$Morphir$IR$Value$Apply,
																		_Utils_Tuple0,
																		A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, item1),
																		item2),
																	item3));
														}),
													listItems1,
													listItems2,
													listItems3)));
									} else {
										return $elm$core$Result$Err(
											$author$project$Morphir$Value$Error$UnexpectedArguments(args));
									}
								}),
							_eval(arg1),
							_eval(arg2),
							_eval(arg3)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map4',
		F2(
			function (_eval, args) {
				if (((((args.b && args.b.b) && args.b.b.b) && args.b.b.b.b) && args.b.b.b.b.b) && (!args.b.b.b.b.b.b)) {
					var fun = args.a;
					var _v83 = args.b;
					var arg1 = _v83.a;
					var _v84 = _v83.b;
					var arg2 = _v84.a;
					var _v85 = _v84.b;
					var arg3 = _v85.a;
					var _v86 = _v85.b;
					var arg4 = _v86.a;
					return A2(
						$elm$core$Result$andThen,
						$elm$core$Basics$identity,
						A5(
							$elm$core$Result$map4,
							F4(
								function (evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4) {
									var _v87 = _List_fromArray(
										[evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4]);
									if ((((((((_v87.b && (_v87.a.$ === 'List')) && _v87.b.b) && (_v87.b.a.$ === 'List')) && _v87.b.b.b) && (_v87.b.b.a.$ === 'List')) && _v87.b.b.b.b) && (_v87.b.b.b.a.$ === 'List')) && (!_v87.b.b.b.b.b)) {
										var _v88 = _v87.a;
										var listItems1 = _v88.b;
										var _v89 = _v87.b;
										var _v90 = _v89.a;
										var listItems2 = _v90.b;
										var _v91 = _v89.b;
										var _v92 = _v91.a;
										var listItems3 = _v92.b;
										var _v93 = _v91.b;
										var _v94 = _v93.a;
										var listItems4 = _v94.b;
										return A2(
											$elm$core$Result$map,
											$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
											$author$project$Morphir$ListOfResults$liftFirstError(
												A5(
													$elm$core$List$map4,
													F4(
														function (item1, item2, item3, item4) {
															return _eval(
																A3(
																	$author$project$Morphir$IR$Value$Apply,
																	_Utils_Tuple0,
																	A3(
																		$author$project$Morphir$IR$Value$Apply,
																		_Utils_Tuple0,
																		A3(
																			$author$project$Morphir$IR$Value$Apply,
																			_Utils_Tuple0,
																			A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, item1),
																			item2),
																		item3),
																	item4));
														}),
													listItems1,
													listItems2,
													listItems3,
													listItems4)));
									} else {
										return $elm$core$Result$Err(
											$author$project$Morphir$Value$Error$UnexpectedArguments(args));
									}
								}),
							_eval(arg1),
							_eval(arg2),
							_eval(arg3),
							_eval(arg4)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map5',
		F2(
			function (_eval, args) {
				if ((((((args.b && args.b.b) && args.b.b.b) && args.b.b.b.b) && args.b.b.b.b.b) && args.b.b.b.b.b.b) && (!args.b.b.b.b.b.b.b)) {
					var fun = args.a;
					var _v96 = args.b;
					var arg1 = _v96.a;
					var _v97 = _v96.b;
					var arg2 = _v97.a;
					var _v98 = _v97.b;
					var arg3 = _v98.a;
					var _v99 = _v98.b;
					var arg4 = _v99.a;
					var _v100 = _v99.b;
					var arg5 = _v100.a;
					return A2(
						$elm$core$Result$andThen,
						$elm$core$Basics$identity,
						A6(
							$elm$core$Result$map5,
							F5(
								function (evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4, evaluatedArg5) {
									var _v101 = _List_fromArray(
										[evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4, evaluatedArg5]);
									if ((((((((((_v101.b && (_v101.a.$ === 'List')) && _v101.b.b) && (_v101.b.a.$ === 'List')) && _v101.b.b.b) && (_v101.b.b.a.$ === 'List')) && _v101.b.b.b.b) && (_v101.b.b.b.a.$ === 'List')) && _v101.b.b.b.b.b) && (_v101.b.b.b.b.a.$ === 'List')) && (!_v101.b.b.b.b.b.b)) {
										var _v102 = _v101.a;
										var listItems1 = _v102.b;
										var _v103 = _v101.b;
										var _v104 = _v103.a;
										var listItems2 = _v104.b;
										var _v105 = _v103.b;
										var _v106 = _v105.a;
										var listItems3 = _v106.b;
										var _v107 = _v105.b;
										var _v108 = _v107.a;
										var listItems4 = _v108.b;
										var _v109 = _v107.b;
										var _v110 = _v109.a;
										var listItems5 = _v110.b;
										return A2(
											$elm$core$Result$map,
											$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
											$author$project$Morphir$ListOfResults$liftFirstError(
												A6(
													$elm$core$List$map5,
													F5(
														function (item1, item2, item3, item4, item5) {
															return _eval(
																A3(
																	$author$project$Morphir$IR$Value$Apply,
																	_Utils_Tuple0,
																	A3(
																		$author$project$Morphir$IR$Value$Apply,
																		_Utils_Tuple0,
																		A3(
																			$author$project$Morphir$IR$Value$Apply,
																			_Utils_Tuple0,
																			A3(
																				$author$project$Morphir$IR$Value$Apply,
																				_Utils_Tuple0,
																				A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, item1),
																				item2),
																			item3),
																		item4),
																	item5));
														}),
													listItems1,
													listItems2,
													listItems3,
													listItems4,
													listItems5)));
									} else {
										return $elm$core$Result$Err(
											$author$project$Morphir$Value$Error$UnexpectedArguments(args));
									}
								}),
							_eval(arg1),
							_eval(arg2),
							_eval(arg3),
							_eval(arg4),
							_eval(arg5)));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'concatMap',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v112 = args.b;
					var arg1 = _v112.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = F2(
									function (resultList, items) {
										evaluate:
										while (true) {
											if (!items.b) {
												return $elm$core$Result$Ok(resultList);
											} else {
												var head1 = items.a;
												var tail1 = items.b;
												var _v115 = _eval(
													A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, head1));
												if (_v115.$ === 'Ok') {
													if (_v115.a.$ === 'List') {
														var _v116 = _v115.a;
														var list = _v116.b;
														var $temp$resultList = _Utils_ap(resultList, list),
															$temp$items = tail1;
														resultList = $temp$resultList;
														items = $temp$items;
														continue evaluate;
													} else {
														var other = _v115.a;
														return $elm$core$Result$Err(
															$author$project$Morphir$Value$Error$ExpectedList(other));
													}
												} else {
													var other = _v115.a;
													return $elm$core$Result$Err(other);
												}
											}
										}
									});
								return A2(
									$elm$core$Result$map,
									$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
									A2(evaluate, _List_Nil, listItems));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'isEmpty',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$isEmpty,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple2(
		'head',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$head,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeMaybe($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'tail',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$tail,
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeMaybe(
				$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw)))),
		_Utils_Tuple2(
		'take',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$take,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'drop',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$drop,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeList($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw))),
		_Utils_Tuple2(
		'partition',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v118 = args.b;
					var arg1 = _v118.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if (evaluatedArg1.$ === 'List') {
								var listItems = evaluatedArg1.b;
								var evaluate = F3(
									function (list1, list2, items) {
										evaluate:
										while (true) {
											if (!items.b) {
												return $elm$core$Result$Ok(
													_Utils_Tuple2(list1, list2));
											} else {
												var head1 = items.a;
												var tail1 = items.b;
												var _v121 = _eval(
													A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, head1));
												if (_v121.$ === 'Ok') {
													if ((_v121.a.$ === 'Literal') && (_v121.a.b.$ === 'BoolLiteral')) {
														if (_v121.a.b.a) {
															var _v122 = _v121.a;
															var $temp$list1 = _Utils_ap(
																list1,
																_List_fromArray(
																	[head1])),
																$temp$list2 = list2,
																$temp$items = tail1;
															list1 = $temp$list1;
															list2 = $temp$list2;
															items = $temp$items;
															continue evaluate;
														} else {
															var _v123 = _v121.a;
															var $temp$list1 = list1,
																$temp$list2 = _Utils_ap(
																list2,
																_List_fromArray(
																	[head1])),
																$temp$items = tail1;
															list1 = $temp$list1;
															list2 = $temp$list2;
															items = $temp$items;
															continue evaluate;
														}
													} else {
														var other = _v121.a;
														return $elm$core$Result$Err(
															$author$project$Morphir$Value$Error$ExpectedBoolLiteral(other));
													}
												} else {
													var other = _v121.a;
													return $elm$core$Result$Err(other);
												}
											}
										}
									});
								return A2(
									$elm$core$Result$map,
									function (_v124) {
										var list1 = _v124.a;
										var list2 = _v124.b;
										return A2(
											$author$project$Morphir$IR$Value$Tuple,
											_Utils_Tuple0,
											_List_fromArray(
												[
													A2($author$project$Morphir$IR$Value$List, _Utils_Tuple0, list1),
													A2($author$project$Morphir$IR$Value$List, _Utils_Tuple0, list2)
												]));
									},
									A3(evaluate, _List_Nil, _List_Nil, listItems));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedList(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'unzip',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$List$unzip,
			$author$project$Morphir$Value$Native$decodeList(
				$author$project$Morphir$Value$Native$decodeTuple2(
					_Utils_Tuple2($author$project$Morphir$Value$Native$decodeRaw, $author$project$Morphir$Value$Native$decodeRaw))),
			$author$project$Morphir$Value$Native$encodeTuple2(
				_Utils_Tuple2(
					$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw),
					$author$project$Morphir$Value$Native$encodeList($author$project$Morphir$Value$Native$encodeRaw)))))
	]);
var $author$project$Morphir$Value$Error$ExpectedMaybe = function (a) {
	return {$: 'ExpectedMaybe', a: a};
};
var $author$project$Morphir$Value$Native$decodeMaybe = F3(
	function (decodeItem, _eval, value) {
		var _v0 = _eval(value);
		_v0$2:
		while (true) {
			if (_v0.$ === 'Ok') {
				switch (_v0.a.$) {
					case 'Constructor':
						if ((((((((((((((((((((_v0.a.b.a.b && _v0.a.b.a.a.b) && (_v0.a.b.a.a.a === 'morphir')) && (!_v0.a.b.a.a.b.b)) && _v0.a.b.a.b.b) && _v0.a.b.a.b.a.b) && (_v0.a.b.a.b.a.a === 's')) && _v0.a.b.a.b.a.b.b) && (_v0.a.b.a.b.a.b.a === 'd')) && _v0.a.b.a.b.a.b.b.b) && (_v0.a.b.a.b.a.b.b.a === 'k')) && (!_v0.a.b.a.b.a.b.b.b.b)) && (!_v0.a.b.a.b.b.b)) && _v0.a.b.b.b) && _v0.a.b.b.a.b) && (_v0.a.b.b.a.a === 'maybe')) && (!_v0.a.b.b.a.b.b)) && (!_v0.a.b.b.b.b)) && _v0.a.b.c.b) && (_v0.a.b.c.a === 'nothing')) && (!_v0.a.b.c.b.b)) {
							var _v1 = _v0.a;
							var _v2 = _v1.b;
							var _v3 = _v2.a;
							var _v4 = _v3.a;
							var _v5 = _v3.b;
							var _v6 = _v5.a;
							var _v7 = _v6.b;
							var _v8 = _v7.b;
							var _v9 = _v2.b;
							var _v10 = _v9.a;
							var _v11 = _v2.c;
							return $elm$core$Result$Ok($elm$core$Maybe$Nothing);
						} else {
							break _v0$2;
						}
					case 'Apply':
						if ((((((((((((((((((((((_v0.a.b.$ === 'Constructor') && _v0.a.b.b.a.b) && _v0.a.b.b.a.a.b) && (_v0.a.b.b.a.a.a === 'morphir')) && (!_v0.a.b.b.a.a.b.b)) && _v0.a.b.b.a.b.b) && _v0.a.b.b.a.b.a.b) && (_v0.a.b.b.a.b.a.a === 's')) && _v0.a.b.b.a.b.a.b.b) && (_v0.a.b.b.a.b.a.b.a === 'd')) && _v0.a.b.b.a.b.a.b.b.b) && (_v0.a.b.b.a.b.a.b.b.a === 'k')) && (!_v0.a.b.b.a.b.a.b.b.b.b)) && (!_v0.a.b.b.a.b.b.b)) && _v0.a.b.b.b.b) && _v0.a.b.b.b.a.b) && (_v0.a.b.b.b.a.a === 'maybe')) && (!_v0.a.b.b.b.a.b.b)) && (!_v0.a.b.b.b.b.b)) && _v0.a.b.b.c.b) && (_v0.a.b.b.c.a === 'just')) && (!_v0.a.b.b.c.b.b)) {
							var _v12 = _v0.a;
							var _v13 = _v12.b;
							var _v14 = _v13.b;
							var _v15 = _v14.a;
							var _v16 = _v15.a;
							var _v17 = _v15.b;
							var _v18 = _v17.a;
							var _v19 = _v18.b;
							var _v20 = _v19.b;
							var _v21 = _v14.b;
							var _v22 = _v21.a;
							var _v23 = _v14.c;
							var val = _v12.c;
							return A2(
								$elm$core$Result$map,
								$elm$core$Maybe$Just,
								A2(decodeItem, _eval, val));
						} else {
							break _v0$2;
						}
					default:
						break _v0$2;
				}
			} else {
				var error = _v0.a;
				return $elm$core$Result$Err(error);
			}
		}
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$ExpectedMaybe(value));
	});
var $author$project$Morphir$Value$Native$encodeMaybeResult = function (maybeResult) {
	if (maybeResult.$ === 'Just') {
		if (maybeResult.a.$ === 'Ok') {
			var value = maybeResult.a.a;
			return $elm$core$Result$Ok(
				A3(
					$author$project$Morphir$IR$Value$Apply,
					_Utils_Tuple0,
					A2(
						$author$project$Morphir$IR$Value$Constructor,
						_Utils_Tuple0,
						_Utils_Tuple3(
							_List_fromArray(
								[
									_List_fromArray(
									['morphir']),
									_List_fromArray(
									['s', 'd', 'k'])
								]),
							_List_fromArray(
								[
									_List_fromArray(
									['maybe'])
								]),
							_List_fromArray(
								['just']))),
					value));
		} else {
			var error = maybeResult.a.a;
			return $elm$core$Result$Err(error);
		}
	} else {
		return $elm$core$Result$Ok(
			A2(
				$author$project$Morphir$IR$Value$Constructor,
				_Utils_Tuple0,
				_Utils_Tuple3(
					_List_fromArray(
						[
							_List_fromArray(
							['morphir']),
							_List_fromArray(
							['s', 'd', 'k'])
						]),
					_List_fromArray(
						[
							_List_fromArray(
							['maybe'])
						]),
					_List_fromArray(
						['nothing']))));
	}
};
var $author$project$Morphir$IR$SDK$Maybe$nativeFunctions = _List_fromArray(
	[
		_Utils_Tuple2(
		'andThen',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v1 = args.b;
					var arg1 = _v1.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							_v2$2:
							while (true) {
								switch (evaluatedArg1.$) {
									case 'Apply':
										if ((((((((((((((((((((((evaluatedArg1.b.$ === 'Constructor') && evaluatedArg1.b.b.a.b) && evaluatedArg1.b.b.a.a.b) && (evaluatedArg1.b.b.a.a.a === 'morphir')) && (!evaluatedArg1.b.b.a.a.b.b)) && evaluatedArg1.b.b.a.b.b) && evaluatedArg1.b.b.a.b.a.b) && (evaluatedArg1.b.b.a.b.a.a === 's')) && evaluatedArg1.b.b.a.b.a.b.b) && (evaluatedArg1.b.b.a.b.a.b.a === 'd')) && evaluatedArg1.b.b.a.b.a.b.b.b) && (evaluatedArg1.b.b.a.b.a.b.b.a === 'k')) && (!evaluatedArg1.b.b.a.b.a.b.b.b.b)) && (!evaluatedArg1.b.b.a.b.b.b)) && evaluatedArg1.b.b.b.b) && evaluatedArg1.b.b.b.a.b) && (evaluatedArg1.b.b.b.a.a === 'maybe')) && (!evaluatedArg1.b.b.b.a.b.b)) && (!evaluatedArg1.b.b.b.b.b)) && evaluatedArg1.b.b.c.b) && (evaluatedArg1.b.b.c.a === 'just')) && (!evaluatedArg1.b.b.c.b.b)) {
											var _v3 = evaluatedArg1.b;
											var _v4 = _v3.b;
											var _v5 = _v4.a;
											var _v6 = _v5.a;
											var _v7 = _v5.b;
											var _v8 = _v7.a;
											var _v9 = _v8.b;
											var _v10 = _v9.b;
											var _v11 = _v4.b;
											var _v12 = _v11.a;
											var _v13 = _v4.c;
											var value = evaluatedArg1.c;
											return _eval(
												A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, value));
										} else {
											break _v2$2;
										}
									case 'Constructor':
										if ((((((((((((((((((((evaluatedArg1.b.a.b && evaluatedArg1.b.a.a.b) && (evaluatedArg1.b.a.a.a === 'morphir')) && (!evaluatedArg1.b.a.a.b.b)) && evaluatedArg1.b.a.b.b) && evaluatedArg1.b.a.b.a.b) && (evaluatedArg1.b.a.b.a.a === 's')) && evaluatedArg1.b.a.b.a.b.b) && (evaluatedArg1.b.a.b.a.b.a === 'd')) && evaluatedArg1.b.a.b.a.b.b.b) && (evaluatedArg1.b.a.b.a.b.b.a === 'k')) && (!evaluatedArg1.b.a.b.a.b.b.b.b)) && (!evaluatedArg1.b.a.b.b.b)) && evaluatedArg1.b.b.b) && evaluatedArg1.b.b.a.b) && (evaluatedArg1.b.b.a.a === 'maybe')) && (!evaluatedArg1.b.b.a.b.b)) && (!evaluatedArg1.b.b.b.b)) && evaluatedArg1.b.c.b) && (evaluatedArg1.b.c.a === 'nothing')) && (!evaluatedArg1.b.c.b.b)) {
											var _v14 = evaluatedArg1.b;
											var _v15 = _v14.a;
											var _v16 = _v15.a;
											var _v17 = _v15.b;
											var _v18 = _v17.a;
											var _v19 = _v18.b;
											var _v20 = _v19.b;
											var _v21 = _v14.b;
											var _v22 = _v21.a;
											var _v23 = _v14.c;
											return $elm$core$Result$Ok(
												$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
										} else {
											break _v2$2;
										}
									default:
										break _v2$2;
								}
							}
							return $elm$core$Result$Err(
								$author$project$Morphir$Value$Error$UnexpectedArguments(
									_List_fromArray(
										[arg1])));
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'withDefault',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Maybe$withDefault,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$decodeMaybe($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeRaw)),
		_Utils_Tuple2(
		'map',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Maybe$map,
			A2($author$project$Morphir$Value$Native$decodeFun1, $author$project$Morphir$Value$Native$encodeRaw, $author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$decodeMaybe($author$project$Morphir$Value$Native$decodeRaw),
			$author$project$Morphir$Value$Native$encodeMaybeResult)),
		_Utils_Tuple2(
		'map2',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun = args.a;
					var _v25 = args.b;
					var arg1 = _v25.a;
					var _v26 = _v25.b;
					var arg2 = _v26.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							return A2(
								$elm$core$Result$andThen,
								function (evaluatedArg2) {
									var _v27 = _Utils_Tuple2(evaluatedArg1, evaluatedArg2);
									_v27$1:
									while (true) {
										_v27$3:
										while (true) {
											switch (_v27.a.$) {
												case 'Apply':
													switch (_v27.b.$) {
														case 'Apply':
															if ((((((((((((((((((((((((((((((((((((((((((((_v27.a.b.$ === 'Constructor') && _v27.a.b.b.a.b) && _v27.a.b.b.a.a.b) && (_v27.a.b.b.a.a.a === 'morphir')) && (!_v27.a.b.b.a.a.b.b)) && _v27.a.b.b.a.b.b) && _v27.a.b.b.a.b.a.b) && (_v27.a.b.b.a.b.a.a === 's')) && _v27.a.b.b.a.b.a.b.b) && (_v27.a.b.b.a.b.a.b.a === 'd')) && _v27.a.b.b.a.b.a.b.b.b) && (_v27.a.b.b.a.b.a.b.b.a === 'k')) && (!_v27.a.b.b.a.b.a.b.b.b.b)) && (!_v27.a.b.b.a.b.b.b)) && _v27.a.b.b.b.b) && _v27.a.b.b.b.a.b) && (_v27.a.b.b.b.a.a === 'maybe')) && (!_v27.a.b.b.b.a.b.b)) && (!_v27.a.b.b.b.b.b)) && _v27.a.b.b.c.b) && (_v27.a.b.b.c.a === 'just')) && (!_v27.a.b.b.c.b.b)) && (_v27.b.b.$ === 'Constructor')) && _v27.b.b.b.a.b) && _v27.b.b.b.a.a.b) && (_v27.b.b.b.a.a.a === 'morphir')) && (!_v27.b.b.b.a.a.b.b)) && _v27.b.b.b.a.b.b) && _v27.b.b.b.a.b.a.b) && (_v27.b.b.b.a.b.a.a === 's')) && _v27.b.b.b.a.b.a.b.b) && (_v27.b.b.b.a.b.a.b.a === 'd')) && _v27.b.b.b.a.b.a.b.b.b) && (_v27.b.b.b.a.b.a.b.b.a === 'k')) && (!_v27.b.b.b.a.b.a.b.b.b.b)) && (!_v27.b.b.b.a.b.b.b)) && _v27.b.b.b.b.b) && _v27.b.b.b.b.a.b) && (_v27.b.b.b.b.a.a === 'maybe')) && (!_v27.b.b.b.b.a.b.b)) && (!_v27.b.b.b.b.b.b)) && _v27.b.b.b.c.b) && (_v27.b.b.b.c.a === 'just')) && (!_v27.b.b.b.c.b.b)) {
																var _v28 = _v27.a;
																var _v29 = _v28.b;
																var _v30 = _v29.b;
																var _v31 = _v30.a;
																var _v32 = _v31.a;
																var _v33 = _v31.b;
																var _v34 = _v33.a;
																var _v35 = _v34.b;
																var _v36 = _v35.b;
																var _v37 = _v30.b;
																var _v38 = _v37.a;
																var _v39 = _v30.c;
																var value1 = _v28.c;
																var _v40 = _v27.b;
																var _v41 = _v40.b;
																var _v42 = _v41.b;
																var _v43 = _v42.a;
																var _v44 = _v43.a;
																var _v45 = _v43.b;
																var _v46 = _v45.a;
																var _v47 = _v46.b;
																var _v48 = _v47.b;
																var _v49 = _v42.b;
																var _v50 = _v49.a;
																var _v51 = _v42.c;
																var value2 = _v40.c;
																return _eval(
																	A3(
																		$author$project$Morphir$IR$Value$Apply,
																		_Utils_Tuple0,
																		A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, value1),
																		value2));
															} else {
																break _v27$3;
															}
														case 'Constructor':
															if ((((((((((((((((((((_v27.b.b.a.b && _v27.b.b.a.a.b) && (_v27.b.b.a.a.a === 'morphir')) && (!_v27.b.b.a.a.b.b)) && _v27.b.b.a.b.b) && _v27.b.b.a.b.a.b) && (_v27.b.b.a.b.a.a === 's')) && _v27.b.b.a.b.a.b.b) && (_v27.b.b.a.b.a.b.a === 'd')) && _v27.b.b.a.b.a.b.b.b) && (_v27.b.b.a.b.a.b.b.a === 'k')) && (!_v27.b.b.a.b.a.b.b.b.b)) && (!_v27.b.b.a.b.b.b)) && _v27.b.b.b.b) && _v27.b.b.b.a.b) && (_v27.b.b.b.a.a === 'maybe')) && (!_v27.b.b.b.a.b.b)) && (!_v27.b.b.b.b.b)) && _v27.b.b.c.b) && (_v27.b.b.c.a === 'nothing')) && (!_v27.b.b.c.b.b)) {
																break _v27$1;
															} else {
																break _v27$3;
															}
														default:
															break _v27$3;
													}
												case 'Constructor':
													if ((((((((((((((((((((((_v27.b.$ === 'Constructor') && _v27.b.b.a.b) && _v27.b.b.a.a.b) && (_v27.b.b.a.a.a === 'morphir')) && (!_v27.b.b.a.a.b.b)) && _v27.b.b.a.b.b) && _v27.b.b.a.b.a.b) && (_v27.b.b.a.b.a.a === 's')) && _v27.b.b.a.b.a.b.b) && (_v27.b.b.a.b.a.b.a === 'd')) && _v27.b.b.a.b.a.b.b.b) && (_v27.b.b.a.b.a.b.b.a === 'k')) && (!_v27.b.b.a.b.a.b.b.b.b)) && (!_v27.b.b.a.b.b.b)) && _v27.b.b.b.b) && _v27.b.b.b.a.b) && (_v27.b.b.b.a.a === 'maybe')) && (!_v27.b.b.b.a.b.b)) && (!_v27.b.b.b.b.b)) && _v27.b.b.c.b) && (_v27.b.b.c.a === 'nothing')) && (!_v27.b.b.c.b.b)) {
														break _v27$1;
													} else {
														if ((((((((((((((((((((_v27.a.b.a.b && _v27.a.b.a.a.b) && (_v27.a.b.a.a.a === 'morphir')) && (!_v27.a.b.a.a.b.b)) && _v27.a.b.a.b.b) && _v27.a.b.a.b.a.b) && (_v27.a.b.a.b.a.a === 's')) && _v27.a.b.a.b.a.b.b) && (_v27.a.b.a.b.a.b.a === 'd')) && _v27.a.b.a.b.a.b.b.b) && (_v27.a.b.a.b.a.b.b.a === 'k')) && (!_v27.a.b.a.b.a.b.b.b.b)) && (!_v27.a.b.a.b.b.b)) && _v27.a.b.b.b) && _v27.a.b.b.a.b) && (_v27.a.b.b.a.a === 'maybe')) && (!_v27.a.b.b.a.b.b)) && (!_v27.a.b.b.b.b)) && _v27.a.b.c.b) && (_v27.a.b.c.a === 'nothing')) && (!_v27.a.b.c.b.b)) {
															var _v63 = _v27.a;
															var _v64 = _v63.b;
															var _v65 = _v64.a;
															var _v66 = _v65.a;
															var _v67 = _v65.b;
															var _v68 = _v67.a;
															var _v69 = _v68.b;
															var _v70 = _v69.b;
															var _v71 = _v64.b;
															var _v72 = _v71.a;
															var _v73 = _v64.c;
															return $elm$core$Result$Ok(
																$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
														} else {
															break _v27$3;
														}
													}
												default:
													if ((((((((((((((((((((((_v27.b.$ === 'Constructor') && _v27.b.b.a.b) && _v27.b.b.a.a.b) && (_v27.b.b.a.a.a === 'morphir')) && (!_v27.b.b.a.a.b.b)) && _v27.b.b.a.b.b) && _v27.b.b.a.b.a.b) && (_v27.b.b.a.b.a.a === 's')) && _v27.b.b.a.b.a.b.b) && (_v27.b.b.a.b.a.b.a === 'd')) && _v27.b.b.a.b.a.b.b.b) && (_v27.b.b.a.b.a.b.b.a === 'k')) && (!_v27.b.b.a.b.a.b.b.b.b)) && (!_v27.b.b.a.b.b.b)) && _v27.b.b.b.b) && _v27.b.b.b.a.b) && (_v27.b.b.b.a.a === 'maybe')) && (!_v27.b.b.b.a.b.b)) && (!_v27.b.b.b.b.b)) && _v27.b.b.c.b) && (_v27.b.b.c.a === 'nothing')) && (!_v27.b.b.c.b.b)) {
														break _v27$1;
													} else {
														break _v27$3;
													}
											}
										}
										return $elm$core$Result$Err(
											$author$project$Morphir$Value$Error$UnexpectedArguments(
												_List_fromArray(
													[evaluatedArg1, evaluatedArg2])));
									}
									var _v52 = _v27.b;
									var _v53 = _v52.b;
									var _v54 = _v53.a;
									var _v55 = _v54.a;
									var _v56 = _v54.b;
									var _v57 = _v56.a;
									var _v58 = _v57.b;
									var _v59 = _v58.b;
									var _v60 = _v53.b;
									var _v61 = _v60.a;
									var _v62 = _v53.c;
									return $elm$core$Result$Ok(
										$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
								},
								_eval(arg2));
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map3',
		F2(
			function (_eval, args) {
				if ((((args.b && args.b.b) && args.b.b.b) && args.b.b.b.b) && (!args.b.b.b.b.b)) {
					var fun = args.a;
					var _v75 = args.b;
					var arg1 = _v75.a;
					var _v76 = _v75.b;
					var arg2 = _v76.a;
					var _v77 = _v76.b;
					var arg3 = _v77.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							return A2(
								$elm$core$Result$andThen,
								function (evaluatedArg2) {
									return A2(
										$elm$core$Result$andThen,
										function (evaluatedArg3) {
											var _v78 = _Utils_Tuple3(evaluatedArg1, evaluatedArg2, evaluatedArg3);
											_v78$1:
											while (true) {
												_v78$2:
												while (true) {
													_v78$4:
													while (true) {
														switch (_v78.a.$) {
															case 'Apply':
																switch (_v78.b.$) {
																	case 'Apply':
																		switch (_v78.c.$) {
																			case 'Apply':
																				if ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((_v78.a.b.$ === 'Constructor') && _v78.a.b.b.a.b) && _v78.a.b.b.a.a.b) && (_v78.a.b.b.a.a.a === 'morphir')) && (!_v78.a.b.b.a.a.b.b)) && _v78.a.b.b.a.b.b) && _v78.a.b.b.a.b.a.b) && (_v78.a.b.b.a.b.a.a === 's')) && _v78.a.b.b.a.b.a.b.b) && (_v78.a.b.b.a.b.a.b.a === 'd')) && _v78.a.b.b.a.b.a.b.b.b) && (_v78.a.b.b.a.b.a.b.b.a === 'k')) && (!_v78.a.b.b.a.b.a.b.b.b.b)) && (!_v78.a.b.b.a.b.b.b)) && _v78.a.b.b.b.b) && _v78.a.b.b.b.a.b) && (_v78.a.b.b.b.a.a === 'maybe')) && (!_v78.a.b.b.b.a.b.b)) && (!_v78.a.b.b.b.b.b)) && _v78.a.b.b.c.b) && (_v78.a.b.b.c.a === 'just')) && (!_v78.a.b.b.c.b.b)) && (_v78.b.b.$ === 'Constructor')) && _v78.b.b.b.a.b) && _v78.b.b.b.a.a.b) && (_v78.b.b.b.a.a.a === 'morphir')) && (!_v78.b.b.b.a.a.b.b)) && _v78.b.b.b.a.b.b) && _v78.b.b.b.a.b.a.b) && (_v78.b.b.b.a.b.a.a === 's')) && _v78.b.b.b.a.b.a.b.b) && (_v78.b.b.b.a.b.a.b.a === 'd')) && _v78.b.b.b.a.b.a.b.b.b) && (_v78.b.b.b.a.b.a.b.b.a === 'k')) && (!_v78.b.b.b.a.b.a.b.b.b.b)) && (!_v78.b.b.b.a.b.b.b)) && _v78.b.b.b.b.b) && _v78.b.b.b.b.a.b) && (_v78.b.b.b.b.a.a === 'maybe')) && (!_v78.b.b.b.b.a.b.b)) && (!_v78.b.b.b.b.b.b)) && _v78.b.b.b.c.b) && (_v78.b.b.b.c.a === 'just')) && (!_v78.b.b.b.c.b.b)) && (_v78.c.b.$ === 'Constructor')) && _v78.c.b.b.a.b) && _v78.c.b.b.a.a.b) && (_v78.c.b.b.a.a.a === 'morphir')) && (!_v78.c.b.b.a.a.b.b)) && _v78.c.b.b.a.b.b) && _v78.c.b.b.a.b.a.b) && (_v78.c.b.b.a.b.a.a === 's')) && _v78.c.b.b.a.b.a.b.b) && (_v78.c.b.b.a.b.a.b.a === 'd')) && _v78.c.b.b.a.b.a.b.b.b) && (_v78.c.b.b.a.b.a.b.b.a === 'k')) && (!_v78.c.b.b.a.b.a.b.b.b.b)) && (!_v78.c.b.b.a.b.b.b)) && _v78.c.b.b.b.b) && _v78.c.b.b.b.a.b) && (_v78.c.b.b.b.a.a === 'maybe')) && (!_v78.c.b.b.b.a.b.b)) && (!_v78.c.b.b.b.b.b)) && _v78.c.b.b.c.b) && (_v78.c.b.b.c.a === 'just')) && (!_v78.c.b.b.c.b.b)) {
																					var _v79 = _v78.a;
																					var _v80 = _v79.b;
																					var _v81 = _v80.b;
																					var _v82 = _v81.a;
																					var _v83 = _v82.a;
																					var _v84 = _v82.b;
																					var _v85 = _v84.a;
																					var _v86 = _v85.b;
																					var _v87 = _v86.b;
																					var _v88 = _v81.b;
																					var _v89 = _v88.a;
																					var _v90 = _v81.c;
																					var value1 = _v79.c;
																					var _v91 = _v78.b;
																					var _v92 = _v91.b;
																					var _v93 = _v92.b;
																					var _v94 = _v93.a;
																					var _v95 = _v94.a;
																					var _v96 = _v94.b;
																					var _v97 = _v96.a;
																					var _v98 = _v97.b;
																					var _v99 = _v98.b;
																					var _v100 = _v93.b;
																					var _v101 = _v100.a;
																					var _v102 = _v93.c;
																					var value2 = _v91.c;
																					var _v103 = _v78.c;
																					var _v104 = _v103.b;
																					var _v105 = _v104.b;
																					var _v106 = _v105.a;
																					var _v107 = _v106.a;
																					var _v108 = _v106.b;
																					var _v109 = _v108.a;
																					var _v110 = _v109.b;
																					var _v111 = _v110.b;
																					var _v112 = _v105.b;
																					var _v113 = _v112.a;
																					var _v114 = _v105.c;
																					var value3 = _v103.c;
																					return _eval(
																						A3(
																							$author$project$Morphir$IR$Value$Apply,
																							_Utils_Tuple0,
																							A3(
																								$author$project$Morphir$IR$Value$Apply,
																								_Utils_Tuple0,
																								A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, value1),
																								value2),
																							value3));
																				} else {
																					break _v78$4;
																				}
																			case 'Constructor':
																				if ((((((((((((((((((((_v78.c.b.a.b && _v78.c.b.a.a.b) && (_v78.c.b.a.a.a === 'morphir')) && (!_v78.c.b.a.a.b.b)) && _v78.c.b.a.b.b) && _v78.c.b.a.b.a.b) && (_v78.c.b.a.b.a.a === 's')) && _v78.c.b.a.b.a.b.b) && (_v78.c.b.a.b.a.b.a === 'd')) && _v78.c.b.a.b.a.b.b.b) && (_v78.c.b.a.b.a.b.b.a === 'k')) && (!_v78.c.b.a.b.a.b.b.b.b)) && (!_v78.c.b.a.b.b.b)) && _v78.c.b.b.b) && _v78.c.b.b.a.b) && (_v78.c.b.b.a.a === 'maybe')) && (!_v78.c.b.b.a.b.b)) && (!_v78.c.b.b.b.b)) && _v78.c.b.c.b) && (_v78.c.b.c.a === 'nothing')) && (!_v78.c.b.c.b.b)) {
																					break _v78$1;
																				} else {
																					break _v78$4;
																				}
																			default:
																				break _v78$4;
																		}
																	case 'Constructor':
																		if ((((((((((((((((((((((_v78.c.$ === 'Constructor') && _v78.c.b.a.b) && _v78.c.b.a.a.b) && (_v78.c.b.a.a.a === 'morphir')) && (!_v78.c.b.a.a.b.b)) && _v78.c.b.a.b.b) && _v78.c.b.a.b.a.b) && (_v78.c.b.a.b.a.a === 's')) && _v78.c.b.a.b.a.b.b) && (_v78.c.b.a.b.a.b.a === 'd')) && _v78.c.b.a.b.a.b.b.b) && (_v78.c.b.a.b.a.b.b.a === 'k')) && (!_v78.c.b.a.b.a.b.b.b.b)) && (!_v78.c.b.a.b.b.b)) && _v78.c.b.b.b) && _v78.c.b.b.a.b) && (_v78.c.b.b.a.a === 'maybe')) && (!_v78.c.b.b.a.b.b)) && (!_v78.c.b.b.b.b)) && _v78.c.b.c.b) && (_v78.c.b.c.a === 'nothing')) && (!_v78.c.b.c.b.b)) {
																			break _v78$1;
																		} else {
																			if ((((((((((((((((((((_v78.b.b.a.b && _v78.b.b.a.a.b) && (_v78.b.b.a.a.a === 'morphir')) && (!_v78.b.b.a.a.b.b)) && _v78.b.b.a.b.b) && _v78.b.b.a.b.a.b) && (_v78.b.b.a.b.a.a === 's')) && _v78.b.b.a.b.a.b.b) && (_v78.b.b.a.b.a.b.a === 'd')) && _v78.b.b.a.b.a.b.b.b) && (_v78.b.b.a.b.a.b.b.a === 'k')) && (!_v78.b.b.a.b.a.b.b.b.b)) && (!_v78.b.b.a.b.b.b)) && _v78.b.b.b.b) && _v78.b.b.b.a.b) && (_v78.b.b.b.a.a === 'maybe')) && (!_v78.b.b.b.a.b.b)) && (!_v78.b.b.b.b.b)) && _v78.b.b.c.b) && (_v78.b.b.c.a === 'nothing')) && (!_v78.b.b.c.b.b)) {
																				break _v78$2;
																			} else {
																				break _v78$4;
																			}
																		}
																	default:
																		if ((((((((((((((((((((((_v78.c.$ === 'Constructor') && _v78.c.b.a.b) && _v78.c.b.a.a.b) && (_v78.c.b.a.a.a === 'morphir')) && (!_v78.c.b.a.a.b.b)) && _v78.c.b.a.b.b) && _v78.c.b.a.b.a.b) && (_v78.c.b.a.b.a.a === 's')) && _v78.c.b.a.b.a.b.b) && (_v78.c.b.a.b.a.b.a === 'd')) && _v78.c.b.a.b.a.b.b.b) && (_v78.c.b.a.b.a.b.b.a === 'k')) && (!_v78.c.b.a.b.a.b.b.b.b)) && (!_v78.c.b.a.b.b.b)) && _v78.c.b.b.b) && _v78.c.b.b.a.b) && (_v78.c.b.b.a.a === 'maybe')) && (!_v78.c.b.b.a.b.b)) && (!_v78.c.b.b.b.b)) && _v78.c.b.c.b) && (_v78.c.b.c.a === 'nothing')) && (!_v78.c.b.c.b.b)) {
																			break _v78$1;
																		} else {
																			break _v78$4;
																		}
																}
															case 'Constructor':
																if ((((((((((((((((((((((_v78.c.$ === 'Constructor') && _v78.c.b.a.b) && _v78.c.b.a.a.b) && (_v78.c.b.a.a.a === 'morphir')) && (!_v78.c.b.a.a.b.b)) && _v78.c.b.a.b.b) && _v78.c.b.a.b.a.b) && (_v78.c.b.a.b.a.a === 's')) && _v78.c.b.a.b.a.b.b) && (_v78.c.b.a.b.a.b.a === 'd')) && _v78.c.b.a.b.a.b.b.b) && (_v78.c.b.a.b.a.b.b.a === 'k')) && (!_v78.c.b.a.b.a.b.b.b.b)) && (!_v78.c.b.a.b.b.b)) && _v78.c.b.b.b) && _v78.c.b.b.a.b) && (_v78.c.b.b.a.a === 'maybe')) && (!_v78.c.b.b.a.b.b)) && (!_v78.c.b.b.b.b)) && _v78.c.b.c.b) && (_v78.c.b.c.a === 'nothing')) && (!_v78.c.b.c.b.b)) {
																	break _v78$1;
																} else {
																	if ((((((((((((((((((((((_v78.b.$ === 'Constructor') && _v78.b.b.a.b) && _v78.b.b.a.a.b) && (_v78.b.b.a.a.a === 'morphir')) && (!_v78.b.b.a.a.b.b)) && _v78.b.b.a.b.b) && _v78.b.b.a.b.a.b) && (_v78.b.b.a.b.a.a === 's')) && _v78.b.b.a.b.a.b.b) && (_v78.b.b.a.b.a.b.a === 'd')) && _v78.b.b.a.b.a.b.b.b) && (_v78.b.b.a.b.a.b.b.a === 'k')) && (!_v78.b.b.a.b.a.b.b.b.b)) && (!_v78.b.b.a.b.b.b)) && _v78.b.b.b.b) && _v78.b.b.b.a.b) && (_v78.b.b.b.a.a === 'maybe')) && (!_v78.b.b.b.a.b.b)) && (!_v78.b.b.b.b.b)) && _v78.b.b.c.b) && (_v78.b.b.c.a === 'nothing')) && (!_v78.b.b.c.b.b)) {
																		break _v78$2;
																	} else {
																		if ((((((((((((((((((((_v78.a.b.a.b && _v78.a.b.a.a.b) && (_v78.a.b.a.a.a === 'morphir')) && (!_v78.a.b.a.a.b.b)) && _v78.a.b.a.b.b) && _v78.a.b.a.b.a.b) && (_v78.a.b.a.b.a.a === 's')) && _v78.a.b.a.b.a.b.b) && (_v78.a.b.a.b.a.b.a === 'd')) && _v78.a.b.a.b.a.b.b.b) && (_v78.a.b.a.b.a.b.b.a === 'k')) && (!_v78.a.b.a.b.a.b.b.b.b)) && (!_v78.a.b.a.b.b.b)) && _v78.a.b.b.b) && _v78.a.b.b.a.b) && (_v78.a.b.b.a.a === 'maybe')) && (!_v78.a.b.b.a.b.b)) && (!_v78.a.b.b.b.b)) && _v78.a.b.c.b) && (_v78.a.b.c.a === 'nothing')) && (!_v78.a.b.c.b.b)) {
																			var _v137 = _v78.a;
																			var _v138 = _v137.b;
																			var _v139 = _v138.a;
																			var _v140 = _v139.a;
																			var _v141 = _v139.b;
																			var _v142 = _v141.a;
																			var _v143 = _v142.b;
																			var _v144 = _v143.b;
																			var _v145 = _v138.b;
																			var _v146 = _v145.a;
																			var _v147 = _v138.c;
																			return $elm$core$Result$Ok(
																				$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
																		} else {
																			break _v78$4;
																		}
																	}
																}
															default:
																if ((((((((((((((((((((((_v78.c.$ === 'Constructor') && _v78.c.b.a.b) && _v78.c.b.a.a.b) && (_v78.c.b.a.a.a === 'morphir')) && (!_v78.c.b.a.a.b.b)) && _v78.c.b.a.b.b) && _v78.c.b.a.b.a.b) && (_v78.c.b.a.b.a.a === 's')) && _v78.c.b.a.b.a.b.b) && (_v78.c.b.a.b.a.b.a === 'd')) && _v78.c.b.a.b.a.b.b.b) && (_v78.c.b.a.b.a.b.b.a === 'k')) && (!_v78.c.b.a.b.a.b.b.b.b)) && (!_v78.c.b.a.b.b.b)) && _v78.c.b.b.b) && _v78.c.b.b.a.b) && (_v78.c.b.b.a.a === 'maybe')) && (!_v78.c.b.b.a.b.b)) && (!_v78.c.b.b.b.b)) && _v78.c.b.c.b) && (_v78.c.b.c.a === 'nothing')) && (!_v78.c.b.c.b.b)) {
																	break _v78$1;
																} else {
																	if ((((((((((((((((((((((_v78.b.$ === 'Constructor') && _v78.b.b.a.b) && _v78.b.b.a.a.b) && (_v78.b.b.a.a.a === 'morphir')) && (!_v78.b.b.a.a.b.b)) && _v78.b.b.a.b.b) && _v78.b.b.a.b.a.b) && (_v78.b.b.a.b.a.a === 's')) && _v78.b.b.a.b.a.b.b) && (_v78.b.b.a.b.a.b.a === 'd')) && _v78.b.b.a.b.a.b.b.b) && (_v78.b.b.a.b.a.b.b.a === 'k')) && (!_v78.b.b.a.b.a.b.b.b.b)) && (!_v78.b.b.a.b.b.b)) && _v78.b.b.b.b) && _v78.b.b.b.a.b) && (_v78.b.b.b.a.a === 'maybe')) && (!_v78.b.b.b.a.b.b)) && (!_v78.b.b.b.b.b)) && _v78.b.b.c.b) && (_v78.b.b.c.a === 'nothing')) && (!_v78.b.b.c.b.b)) {
																		break _v78$2;
																	} else {
																		break _v78$4;
																	}
																}
														}
													}
													return $elm$core$Result$Err(
														$author$project$Morphir$Value$Error$UnexpectedArguments(
															_List_fromArray(
																[evaluatedArg1, evaluatedArg2, evaluatedArg3])));
												}
												var _v126 = _v78.b;
												var _v127 = _v126.b;
												var _v128 = _v127.a;
												var _v129 = _v128.a;
												var _v130 = _v128.b;
												var _v131 = _v130.a;
												var _v132 = _v131.b;
												var _v133 = _v132.b;
												var _v134 = _v127.b;
												var _v135 = _v134.a;
												var _v136 = _v127.c;
												return $elm$core$Result$Ok(
													$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
											}
											var _v115 = _v78.c;
											var _v116 = _v115.b;
											var _v117 = _v116.a;
											var _v118 = _v117.a;
											var _v119 = _v117.b;
											var _v120 = _v119.a;
											var _v121 = _v120.b;
											var _v122 = _v121.b;
											var _v123 = _v116.b;
											var _v124 = _v123.a;
											var _v125 = _v116.c;
											return $elm$core$Result$Ok(
												$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
										},
										_eval(arg3));
								},
								_eval(arg2));
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map4',
		F2(
			function (_eval, args) {
				if (((((args.b && args.b.b) && args.b.b.b) && args.b.b.b.b) && args.b.b.b.b.b) && (!args.b.b.b.b.b.b)) {
					var fun = args.a;
					var _v149 = args.b;
					var arg1 = _v149.a;
					var _v150 = _v149.b;
					var arg2 = _v150.a;
					var _v151 = _v150.b;
					var arg3 = _v151.a;
					var _v152 = _v151.b;
					var arg4 = _v152.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							return A2(
								$elm$core$Result$andThen,
								function (evaluatedArg2) {
									return A2(
										$elm$core$Result$andThen,
										function (evaluatedArg3) {
											return A2(
												$elm$core$Result$andThen,
												function (evaluatedArg4) {
													var _v153 = _List_fromArray(
														[evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4]);
													_v153$1:
													while (true) {
														_v153$2:
														while (true) {
															_v153$3:
															while (true) {
																_v153$5:
																while (true) {
																	if ((((_v153.b && _v153.b.b) && _v153.b.b.b) && _v153.b.b.b.b) && (!_v153.b.b.b.b.b)) {
																		switch (_v153.a.$) {
																			case 'Apply':
																				switch (_v153.b.a.$) {
																					case 'Apply':
																						switch (_v153.b.b.a.$) {
																							case 'Apply':
																								switch (_v153.b.b.b.a.$) {
																									case 'Apply':
																										if ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((_v153.a.b.$ === 'Constructor') && _v153.a.b.b.a.b) && _v153.a.b.b.a.a.b) && (_v153.a.b.b.a.a.a === 'morphir')) && (!_v153.a.b.b.a.a.b.b)) && _v153.a.b.b.a.b.b) && _v153.a.b.b.a.b.a.b) && (_v153.a.b.b.a.b.a.a === 's')) && _v153.a.b.b.a.b.a.b.b) && (_v153.a.b.b.a.b.a.b.a === 'd')) && _v153.a.b.b.a.b.a.b.b.b) && (_v153.a.b.b.a.b.a.b.b.a === 'k')) && (!_v153.a.b.b.a.b.a.b.b.b.b)) && (!_v153.a.b.b.a.b.b.b)) && _v153.a.b.b.b.b) && _v153.a.b.b.b.a.b) && (_v153.a.b.b.b.a.a === 'maybe')) && (!_v153.a.b.b.b.a.b.b)) && (!_v153.a.b.b.b.b.b)) && _v153.a.b.b.c.b) && (_v153.a.b.b.c.a === 'just')) && (!_v153.a.b.b.c.b.b)) && (_v153.b.a.b.$ === 'Constructor')) && _v153.b.a.b.b.a.b) && _v153.b.a.b.b.a.a.b) && (_v153.b.a.b.b.a.a.a === 'morphir')) && (!_v153.b.a.b.b.a.a.b.b)) && _v153.b.a.b.b.a.b.b) && _v153.b.a.b.b.a.b.a.b) && (_v153.b.a.b.b.a.b.a.a === 's')) && _v153.b.a.b.b.a.b.a.b.b) && (_v153.b.a.b.b.a.b.a.b.a === 'd')) && _v153.b.a.b.b.a.b.a.b.b.b) && (_v153.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v153.b.a.b.b.a.b.a.b.b.b.b)) && (!_v153.b.a.b.b.a.b.b.b)) && _v153.b.a.b.b.b.b) && _v153.b.a.b.b.b.a.b) && (_v153.b.a.b.b.b.a.a === 'maybe')) && (!_v153.b.a.b.b.b.a.b.b)) && (!_v153.b.a.b.b.b.b.b)) && _v153.b.a.b.b.c.b) && (_v153.b.a.b.b.c.a === 'just')) && (!_v153.b.a.b.b.c.b.b)) && (_v153.b.b.a.b.$ === 'Constructor')) && _v153.b.b.a.b.b.a.b) && _v153.b.b.a.b.b.a.a.b) && (_v153.b.b.a.b.b.a.a.a === 'morphir')) && (!_v153.b.b.a.b.b.a.a.b.b)) && _v153.b.b.a.b.b.a.b.b) && _v153.b.b.a.b.b.a.b.a.b) && (_v153.b.b.a.b.b.a.b.a.a === 's')) && _v153.b.b.a.b.b.a.b.a.b.b) && (_v153.b.b.a.b.b.a.b.a.b.a === 'd')) && _v153.b.b.a.b.b.a.b.a.b.b.b) && (_v153.b.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.a.b.b.a.b.a.b.b.b.b)) && (!_v153.b.b.a.b.b.a.b.b.b)) && _v153.b.b.a.b.b.b.b) && _v153.b.b.a.b.b.b.a.b) && (_v153.b.b.a.b.b.b.a.a === 'maybe')) && (!_v153.b.b.a.b.b.b.a.b.b)) && (!_v153.b.b.a.b.b.b.b.b)) && _v153.b.b.a.b.b.c.b) && (_v153.b.b.a.b.b.c.a === 'just')) && (!_v153.b.b.a.b.b.c.b.b)) && (_v153.b.b.b.a.b.$ === 'Constructor')) && _v153.b.b.b.a.b.b.a.b) && _v153.b.b.b.a.b.b.a.a.b) && (_v153.b.b.b.a.b.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.b.a.a.b.b)) && _v153.b.b.b.a.b.b.a.b.b) && _v153.b.b.b.a.b.b.a.b.a.b) && (_v153.b.b.b.a.b.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.b.a.b.a.b.b) && (_v153.b.b.b.a.b.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b.b) && _v153.b.b.b.a.b.b.b.a.b) && (_v153.b.b.b.a.b.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b.b)) && _v153.b.b.b.a.b.b.c.b) && (_v153.b.b.b.a.b.b.c.a === 'just')) && (!_v153.b.b.b.a.b.b.c.b.b)) {
																											var _v154 = _v153.a;
																											var _v155 = _v154.b;
																											var _v156 = _v155.b;
																											var _v157 = _v156.a;
																											var _v158 = _v157.a;
																											var _v159 = _v157.b;
																											var _v160 = _v159.a;
																											var _v161 = _v160.b;
																											var _v162 = _v161.b;
																											var _v163 = _v156.b;
																											var _v164 = _v163.a;
																											var _v165 = _v156.c;
																											var value1 = _v154.c;
																											var _v166 = _v153.b;
																											var _v167 = _v166.a;
																											var _v168 = _v167.b;
																											var _v169 = _v168.b;
																											var _v170 = _v169.a;
																											var _v171 = _v170.a;
																											var _v172 = _v170.b;
																											var _v173 = _v172.a;
																											var _v174 = _v173.b;
																											var _v175 = _v174.b;
																											var _v176 = _v169.b;
																											var _v177 = _v176.a;
																											var _v178 = _v169.c;
																											var value2 = _v167.c;
																											var _v179 = _v166.b;
																											var _v180 = _v179.a;
																											var _v181 = _v180.b;
																											var _v182 = _v181.b;
																											var _v183 = _v182.a;
																											var _v184 = _v183.a;
																											var _v185 = _v183.b;
																											var _v186 = _v185.a;
																											var _v187 = _v186.b;
																											var _v188 = _v187.b;
																											var _v189 = _v182.b;
																											var _v190 = _v189.a;
																											var _v191 = _v182.c;
																											var value3 = _v180.c;
																											var _v192 = _v179.b;
																											var _v193 = _v192.a;
																											var _v194 = _v193.b;
																											var _v195 = _v194.b;
																											var _v196 = _v195.a;
																											var _v197 = _v196.a;
																											var _v198 = _v196.b;
																											var _v199 = _v198.a;
																											var _v200 = _v199.b;
																											var _v201 = _v200.b;
																											var _v202 = _v195.b;
																											var _v203 = _v202.a;
																											var _v204 = _v195.c;
																											var value4 = _v193.c;
																											return _eval(
																												A3(
																													$author$project$Morphir$IR$Value$Apply,
																													_Utils_Tuple0,
																													A3(
																														$author$project$Morphir$IR$Value$Apply,
																														_Utils_Tuple0,
																														A3(
																															$author$project$Morphir$IR$Value$Apply,
																															_Utils_Tuple0,
																															A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, value1),
																															value2),
																														value3),
																													value4));
																										} else {
																											break _v153$5;
																										}
																									case 'Constructor':
																										if ((((((((((((((((((((_v153.b.b.b.a.b.a.b && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																											break _v153$1;
																										} else {
																											break _v153$5;
																										}
																									default:
																										break _v153$5;
																								}
																							case 'Constructor':
																								if ((((((((((((((((((((((_v153.b.b.b.a.$ === 'Constructor') && _v153.b.b.b.a.b.a.b) && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																									break _v153$1;
																								} else {
																									if ((((((((((((((((((((_v153.b.b.a.b.a.b && _v153.b.b.a.b.a.a.b) && (_v153.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.a.b.a.a.b.b)) && _v153.b.b.a.b.a.b.b) && _v153.b.b.a.b.a.b.a.b) && (_v153.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.a.b.a.b.a.b.b) && (_v153.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.a.b.a.b.b.b)) && _v153.b.b.a.b.b.b) && _v153.b.b.a.b.b.a.b) && (_v153.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.a.b.b.a.b.b)) && (!_v153.b.b.a.b.b.b.b)) && _v153.b.b.a.b.c.b) && (_v153.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.a.b.c.b.b)) {
																										break _v153$2;
																									} else {
																										break _v153$5;
																									}
																								}
																							default:
																								if ((((((((((((((((((((((_v153.b.b.b.a.$ === 'Constructor') && _v153.b.b.b.a.b.a.b) && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																									break _v153$1;
																								} else {
																									break _v153$5;
																								}
																						}
																					case 'Constructor':
																						if ((((((((((((((((((((((_v153.b.b.b.a.$ === 'Constructor') && _v153.b.b.b.a.b.a.b) && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																							break _v153$1;
																						} else {
																							if ((((((((((((((((((((((_v153.b.b.a.$ === 'Constructor') && _v153.b.b.a.b.a.b) && _v153.b.b.a.b.a.a.b) && (_v153.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.a.b.a.a.b.b)) && _v153.b.b.a.b.a.b.b) && _v153.b.b.a.b.a.b.a.b) && (_v153.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.a.b.a.b.a.b.b) && (_v153.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.a.b.a.b.b.b)) && _v153.b.b.a.b.b.b) && _v153.b.b.a.b.b.a.b) && (_v153.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.a.b.b.a.b.b)) && (!_v153.b.b.a.b.b.b.b)) && _v153.b.b.a.b.c.b) && (_v153.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.a.b.c.b.b)) {
																								break _v153$2;
																							} else {
																								if ((((((((((((((((((((_v153.b.a.b.a.b && _v153.b.a.b.a.a.b) && (_v153.b.a.b.a.a.a === 'morphir')) && (!_v153.b.a.b.a.a.b.b)) && _v153.b.a.b.a.b.b) && _v153.b.a.b.a.b.a.b) && (_v153.b.a.b.a.b.a.a === 's')) && _v153.b.a.b.a.b.a.b.b) && (_v153.b.a.b.a.b.a.b.a === 'd')) && _v153.b.a.b.a.b.a.b.b.b) && (_v153.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.a.b.a.b.b.b)) && _v153.b.a.b.b.b) && _v153.b.a.b.b.a.b) && (_v153.b.a.b.b.a.a === 'maybe')) && (!_v153.b.a.b.b.a.b.b)) && (!_v153.b.a.b.b.b.b)) && _v153.b.a.b.c.b) && (_v153.b.a.b.c.a === 'nothing')) && (!_v153.b.a.b.c.b.b)) {
																									break _v153$3;
																								} else {
																									break _v153$5;
																								}
																							}
																						}
																					default:
																						if ((((((((((((((((((((((_v153.b.b.b.a.$ === 'Constructor') && _v153.b.b.b.a.b.a.b) && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																							break _v153$1;
																						} else {
																							if ((((((((((((((((((((((_v153.b.b.a.$ === 'Constructor') && _v153.b.b.a.b.a.b) && _v153.b.b.a.b.a.a.b) && (_v153.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.a.b.a.a.b.b)) && _v153.b.b.a.b.a.b.b) && _v153.b.b.a.b.a.b.a.b) && (_v153.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.a.b.a.b.a.b.b) && (_v153.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.a.b.a.b.b.b)) && _v153.b.b.a.b.b.b) && _v153.b.b.a.b.b.a.b) && (_v153.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.a.b.b.a.b.b)) && (!_v153.b.b.a.b.b.b.b)) && _v153.b.b.a.b.c.b) && (_v153.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.a.b.c.b.b)) {
																								break _v153$2;
																							} else {
																								break _v153$5;
																							}
																						}
																				}
																			case 'Constructor':
																				if ((((((((((((((((((((((_v153.b.b.b.a.$ === 'Constructor') && _v153.b.b.b.a.b.a.b) && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																					break _v153$1;
																				} else {
																					if ((((((((((((((((((((((_v153.b.b.a.$ === 'Constructor') && _v153.b.b.a.b.a.b) && _v153.b.b.a.b.a.a.b) && (_v153.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.a.b.a.a.b.b)) && _v153.b.b.a.b.a.b.b) && _v153.b.b.a.b.a.b.a.b) && (_v153.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.a.b.a.b.a.b.b) && (_v153.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.a.b.a.b.b.b)) && _v153.b.b.a.b.b.b) && _v153.b.b.a.b.b.a.b) && (_v153.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.a.b.b.a.b.b)) && (!_v153.b.b.a.b.b.b.b)) && _v153.b.b.a.b.c.b) && (_v153.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.a.b.c.b.b)) {
																						break _v153$2;
																					} else {
																						if ((((((((((((((((((((((_v153.b.a.$ === 'Constructor') && _v153.b.a.b.a.b) && _v153.b.a.b.a.a.b) && (_v153.b.a.b.a.a.a === 'morphir')) && (!_v153.b.a.b.a.a.b.b)) && _v153.b.a.b.a.b.b) && _v153.b.a.b.a.b.a.b) && (_v153.b.a.b.a.b.a.a === 's')) && _v153.b.a.b.a.b.a.b.b) && (_v153.b.a.b.a.b.a.b.a === 'd')) && _v153.b.a.b.a.b.a.b.b.b) && (_v153.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.a.b.a.b.b.b)) && _v153.b.a.b.b.b) && _v153.b.a.b.b.a.b) && (_v153.b.a.b.b.a.a === 'maybe')) && (!_v153.b.a.b.b.a.b.b)) && (!_v153.b.a.b.b.b.b)) && _v153.b.a.b.c.b) && (_v153.b.a.b.c.a === 'nothing')) && (!_v153.b.a.b.c.b.b)) {
																							break _v153$3;
																						} else {
																							if ((((((((((((((((((((_v153.a.b.a.b && _v153.a.b.a.a.b) && (_v153.a.b.a.a.a === 'morphir')) && (!_v153.a.b.a.a.b.b)) && _v153.a.b.a.b.b) && _v153.a.b.a.b.a.b) && (_v153.a.b.a.b.a.a === 's')) && _v153.a.b.a.b.a.b.b) && (_v153.a.b.a.b.a.b.a === 'd')) && _v153.a.b.a.b.a.b.b.b) && (_v153.a.b.a.b.a.b.b.a === 'k')) && (!_v153.a.b.a.b.a.b.b.b.b)) && (!_v153.a.b.a.b.b.b)) && _v153.a.b.b.b) && _v153.a.b.b.a.b) && (_v153.a.b.b.a.a === 'maybe')) && (!_v153.a.b.b.a.b.b)) && (!_v153.a.b.b.b.b)) && _v153.a.b.c.b) && (_v153.a.b.c.a === 'nothing')) && (!_v153.a.b.c.b.b)) {
																								var _v247 = _v153.a;
																								var _v248 = _v247.b;
																								var _v249 = _v248.a;
																								var _v250 = _v249.a;
																								var _v251 = _v249.b;
																								var _v252 = _v251.a;
																								var _v253 = _v252.b;
																								var _v254 = _v253.b;
																								var _v255 = _v248.b;
																								var _v256 = _v255.a;
																								var _v257 = _v248.c;
																								var _v258 = _v153.b;
																								var _v259 = _v258.b;
																								var _v260 = _v259.b;
																								return $elm$core$Result$Ok(
																									$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
																							} else {
																								break _v153$5;
																							}
																						}
																					}
																				}
																			default:
																				if ((((((((((((((((((((((_v153.b.b.b.a.$ === 'Constructor') && _v153.b.b.b.a.b.a.b) && _v153.b.b.b.a.b.a.a.b) && (_v153.b.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.b.a.b.a.a.b.b)) && _v153.b.b.b.a.b.a.b.b) && _v153.b.b.b.a.b.a.b.a.b) && (_v153.b.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.b.a.b.a.b.a.b.b) && (_v153.b.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.b.a.b.a.b.b.b)) && _v153.b.b.b.a.b.b.b) && _v153.b.b.b.a.b.b.a.b) && (_v153.b.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.b.a.b.b.a.b.b)) && (!_v153.b.b.b.a.b.b.b.b)) && _v153.b.b.b.a.b.c.b) && (_v153.b.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.b.a.b.c.b.b)) {
																					break _v153$1;
																				} else {
																					if ((((((((((((((((((((((_v153.b.b.a.$ === 'Constructor') && _v153.b.b.a.b.a.b) && _v153.b.b.a.b.a.a.b) && (_v153.b.b.a.b.a.a.a === 'morphir')) && (!_v153.b.b.a.b.a.a.b.b)) && _v153.b.b.a.b.a.b.b) && _v153.b.b.a.b.a.b.a.b) && (_v153.b.b.a.b.a.b.a.a === 's')) && _v153.b.b.a.b.a.b.a.b.b) && (_v153.b.b.a.b.a.b.a.b.a === 'd')) && _v153.b.b.a.b.a.b.a.b.b.b) && (_v153.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.b.a.b.a.b.b.b)) && _v153.b.b.a.b.b.b) && _v153.b.b.a.b.b.a.b) && (_v153.b.b.a.b.b.a.a === 'maybe')) && (!_v153.b.b.a.b.b.a.b.b)) && (!_v153.b.b.a.b.b.b.b)) && _v153.b.b.a.b.c.b) && (_v153.b.b.a.b.c.a === 'nothing')) && (!_v153.b.b.a.b.c.b.b)) {
																						break _v153$2;
																					} else {
																						if ((((((((((((((((((((((_v153.b.a.$ === 'Constructor') && _v153.b.a.b.a.b) && _v153.b.a.b.a.a.b) && (_v153.b.a.b.a.a.a === 'morphir')) && (!_v153.b.a.b.a.a.b.b)) && _v153.b.a.b.a.b.b) && _v153.b.a.b.a.b.a.b) && (_v153.b.a.b.a.b.a.a === 's')) && _v153.b.a.b.a.b.a.b.b) && (_v153.b.a.b.a.b.a.b.a === 'd')) && _v153.b.a.b.a.b.a.b.b.b) && (_v153.b.a.b.a.b.a.b.b.a === 'k')) && (!_v153.b.a.b.a.b.a.b.b.b.b)) && (!_v153.b.a.b.a.b.b.b)) && _v153.b.a.b.b.b) && _v153.b.a.b.b.a.b) && (_v153.b.a.b.b.a.a === 'maybe')) && (!_v153.b.a.b.b.a.b.b)) && (!_v153.b.a.b.b.b.b)) && _v153.b.a.b.c.b) && (_v153.b.a.b.c.a === 'nothing')) && (!_v153.b.a.b.c.b.b)) {
																							break _v153$3;
																						} else {
																							break _v153$5;
																						}
																					}
																				}
																		}
																	} else {
																		break _v153$5;
																	}
																}
																return $elm$core$Result$Err(
																	$author$project$Morphir$Value$Error$UnexpectedArguments(
																		_List_fromArray(
																			[evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4])));
															}
															var _v233 = _v153.b;
															var _v234 = _v233.a;
															var _v235 = _v234.b;
															var _v236 = _v235.a;
															var _v237 = _v236.a;
															var _v238 = _v236.b;
															var _v239 = _v238.a;
															var _v240 = _v239.b;
															var _v241 = _v240.b;
															var _v242 = _v235.b;
															var _v243 = _v242.a;
															var _v244 = _v235.c;
															var _v245 = _v233.b;
															var _v246 = _v245.b;
															return $elm$core$Result$Ok(
																$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
														}
														var _v219 = _v153.b;
														var _v220 = _v219.b;
														var _v221 = _v220.a;
														var _v222 = _v221.b;
														var _v223 = _v222.a;
														var _v224 = _v223.a;
														var _v225 = _v223.b;
														var _v226 = _v225.a;
														var _v227 = _v226.b;
														var _v228 = _v227.b;
														var _v229 = _v222.b;
														var _v230 = _v229.a;
														var _v231 = _v222.c;
														var _v232 = _v220.b;
														return $elm$core$Result$Ok(
															$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
													}
													var _v205 = _v153.b;
													var _v206 = _v205.b;
													var _v207 = _v206.b;
													var _v208 = _v207.a;
													var _v209 = _v208.b;
													var _v210 = _v209.a;
													var _v211 = _v210.a;
													var _v212 = _v210.b;
													var _v213 = _v212.a;
													var _v214 = _v213.b;
													var _v215 = _v214.b;
													var _v216 = _v209.b;
													var _v217 = _v216.a;
													var _v218 = _v209.c;
													return $elm$core$Result$Ok(
														$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
												},
												_eval(arg4));
										},
										_eval(arg3));
								},
								_eval(arg2));
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'map5',
		F2(
			function (_eval, args) {
				if ((((((args.b && args.b.b) && args.b.b.b) && args.b.b.b.b) && args.b.b.b.b.b) && args.b.b.b.b.b.b) && (!args.b.b.b.b.b.b.b)) {
					var fun = args.a;
					var _v262 = args.b;
					var arg1 = _v262.a;
					var _v263 = _v262.b;
					var arg2 = _v263.a;
					var _v264 = _v263.b;
					var arg3 = _v264.a;
					var _v265 = _v264.b;
					var arg4 = _v265.a;
					var _v266 = _v265.b;
					var arg5 = _v266.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							return A2(
								$elm$core$Result$andThen,
								function (evaluatedArg2) {
									return A2(
										$elm$core$Result$andThen,
										function (evaluatedArg3) {
											return A2(
												$elm$core$Result$andThen,
												function (evaluatedArg4) {
													return A2(
														$elm$core$Result$andThen,
														function (evaluatedArg5) {
															var _v267 = _List_fromArray(
																[evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4, evaluatedArg5]);
															_v267$1:
															while (true) {
																_v267$2:
																while (true) {
																	_v267$3:
																	while (true) {
																		_v267$4:
																		while (true) {
																			_v267$6:
																			while (true) {
																				if (((((_v267.b && _v267.b.b) && _v267.b.b.b) && _v267.b.b.b.b) && _v267.b.b.b.b.b) && (!_v267.b.b.b.b.b.b)) {
																					switch (_v267.a.$) {
																						case 'Apply':
																							switch (_v267.b.a.$) {
																								case 'Apply':
																									switch (_v267.b.b.a.$) {
																										case 'Apply':
																											switch (_v267.b.b.b.a.$) {
																												case 'Apply':
																													switch (_v267.b.b.b.b.a.$) {
																														case 'Apply':
																															if ((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((((_v267.a.b.$ === 'Constructor') && _v267.a.b.b.a.b) && _v267.a.b.b.a.a.b) && (_v267.a.b.b.a.a.a === 'morphir')) && (!_v267.a.b.b.a.a.b.b)) && _v267.a.b.b.a.b.b) && _v267.a.b.b.a.b.a.b) && (_v267.a.b.b.a.b.a.a === 's')) && _v267.a.b.b.a.b.a.b.b) && (_v267.a.b.b.a.b.a.b.a === 'd')) && _v267.a.b.b.a.b.a.b.b.b) && (_v267.a.b.b.a.b.a.b.b.a === 'k')) && (!_v267.a.b.b.a.b.a.b.b.b.b)) && (!_v267.a.b.b.a.b.b.b)) && _v267.a.b.b.b.b) && _v267.a.b.b.b.a.b) && (_v267.a.b.b.b.a.a === 'maybe')) && (!_v267.a.b.b.b.a.b.b)) && (!_v267.a.b.b.b.b.b)) && _v267.a.b.b.c.b) && (_v267.a.b.b.c.a === 'just')) && (!_v267.a.b.b.c.b.b)) && (_v267.b.a.b.$ === 'Constructor')) && _v267.b.a.b.b.a.b) && _v267.b.a.b.b.a.a.b) && (_v267.b.a.b.b.a.a.a === 'morphir')) && (!_v267.b.a.b.b.a.a.b.b)) && _v267.b.a.b.b.a.b.b) && _v267.b.a.b.b.a.b.a.b) && (_v267.b.a.b.b.a.b.a.a === 's')) && _v267.b.a.b.b.a.b.a.b.b) && (_v267.b.a.b.b.a.b.a.b.a === 'd')) && _v267.b.a.b.b.a.b.a.b.b.b) && (_v267.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v267.b.a.b.b.a.b.a.b.b.b.b)) && (!_v267.b.a.b.b.a.b.b.b)) && _v267.b.a.b.b.b.b) && _v267.b.a.b.b.b.a.b) && (_v267.b.a.b.b.b.a.a === 'maybe')) && (!_v267.b.a.b.b.b.a.b.b)) && (!_v267.b.a.b.b.b.b.b)) && _v267.b.a.b.b.c.b) && (_v267.b.a.b.b.c.a === 'just')) && (!_v267.b.a.b.b.c.b.b)) && (_v267.b.b.a.b.$ === 'Constructor')) && _v267.b.b.a.b.b.a.b) && _v267.b.b.a.b.b.a.a.b) && (_v267.b.b.a.b.b.a.a.a === 'morphir')) && (!_v267.b.b.a.b.b.a.a.b.b)) && _v267.b.b.a.b.b.a.b.b) && _v267.b.b.a.b.b.a.b.a.b) && (_v267.b.b.a.b.b.a.b.a.a === 's')) && _v267.b.b.a.b.b.a.b.a.b.b) && (_v267.b.b.a.b.b.a.b.a.b.a === 'd')) && _v267.b.b.a.b.b.a.b.a.b.b.b) && (_v267.b.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.a.b.b.a.b.a.b.b.b.b)) && (!_v267.b.b.a.b.b.a.b.b.b)) && _v267.b.b.a.b.b.b.b) && _v267.b.b.a.b.b.b.a.b) && (_v267.b.b.a.b.b.b.a.a === 'maybe')) && (!_v267.b.b.a.b.b.b.a.b.b)) && (!_v267.b.b.a.b.b.b.b.b)) && _v267.b.b.a.b.b.c.b) && (_v267.b.b.a.b.b.c.a === 'just')) && (!_v267.b.b.a.b.b.c.b.b)) && (_v267.b.b.b.a.b.$ === 'Constructor')) && _v267.b.b.b.a.b.b.a.b) && _v267.b.b.b.a.b.b.a.a.b) && (_v267.b.b.b.a.b.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.b.a.a.b.b)) && _v267.b.b.b.a.b.b.a.b.b) && _v267.b.b.b.a.b.b.a.b.a.b) && (_v267.b.b.b.a.b.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.b.a.b.a.b.b) && (_v267.b.b.b.a.b.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b.b) && _v267.b.b.b.a.b.b.b.a.b) && (_v267.b.b.b.a.b.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b.b)) && _v267.b.b.b.a.b.b.c.b) && (_v267.b.b.b.a.b.b.c.a === 'just')) && (!_v267.b.b.b.a.b.b.c.b.b)) && (_v267.b.b.b.b.a.b.$ === 'Constructor')) && _v267.b.b.b.b.a.b.b.a.b) && _v267.b.b.b.b.a.b.b.a.a.b) && (_v267.b.b.b.b.a.b.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.b.a.a.b.b)) && _v267.b.b.b.b.a.b.b.a.b.b) && _v267.b.b.b.b.a.b.b.a.b.a.b) && (_v267.b.b.b.b.a.b.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b.b) && _v267.b.b.b.b.a.b.b.b.a.b) && (_v267.b.b.b.b.a.b.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b.b)) && _v267.b.b.b.b.a.b.b.c.b) && (_v267.b.b.b.b.a.b.b.c.a === 'just')) && (!_v267.b.b.b.b.a.b.b.c.b.b)) {
																																var _v268 = _v267.a;
																																var _v269 = _v268.b;
																																var _v270 = _v269.b;
																																var _v271 = _v270.a;
																																var _v272 = _v271.a;
																																var _v273 = _v271.b;
																																var _v274 = _v273.a;
																																var _v275 = _v274.b;
																																var _v276 = _v275.b;
																																var _v277 = _v270.b;
																																var _v278 = _v277.a;
																																var _v279 = _v270.c;
																																var value1 = _v268.c;
																																var _v280 = _v267.b;
																																var _v281 = _v280.a;
																																var _v282 = _v281.b;
																																var _v283 = _v282.b;
																																var _v284 = _v283.a;
																																var _v285 = _v284.a;
																																var _v286 = _v284.b;
																																var _v287 = _v286.a;
																																var _v288 = _v287.b;
																																var _v289 = _v288.b;
																																var _v290 = _v283.b;
																																var _v291 = _v290.a;
																																var _v292 = _v283.c;
																																var value2 = _v281.c;
																																var _v293 = _v280.b;
																																var _v294 = _v293.a;
																																var _v295 = _v294.b;
																																var _v296 = _v295.b;
																																var _v297 = _v296.a;
																																var _v298 = _v297.a;
																																var _v299 = _v297.b;
																																var _v300 = _v299.a;
																																var _v301 = _v300.b;
																																var _v302 = _v301.b;
																																var _v303 = _v296.b;
																																var _v304 = _v303.a;
																																var _v305 = _v296.c;
																																var value3 = _v294.c;
																																var _v306 = _v293.b;
																																var _v307 = _v306.a;
																																var _v308 = _v307.b;
																																var _v309 = _v308.b;
																																var _v310 = _v309.a;
																																var _v311 = _v310.a;
																																var _v312 = _v310.b;
																																var _v313 = _v312.a;
																																var _v314 = _v313.b;
																																var _v315 = _v314.b;
																																var _v316 = _v309.b;
																																var _v317 = _v316.a;
																																var _v318 = _v309.c;
																																var value4 = _v307.c;
																																var _v319 = _v306.b;
																																var _v320 = _v319.a;
																																var _v321 = _v320.b;
																																var _v322 = _v321.b;
																																var _v323 = _v322.a;
																																var _v324 = _v323.a;
																																var _v325 = _v323.b;
																																var _v326 = _v325.a;
																																var _v327 = _v326.b;
																																var _v328 = _v327.b;
																																var _v329 = _v322.b;
																																var _v330 = _v329.a;
																																var _v331 = _v322.c;
																																var value5 = _v320.c;
																																return _eval(
																																	A3(
																																		$author$project$Morphir$IR$Value$Apply,
																																		_Utils_Tuple0,
																																		A3(
																																			$author$project$Morphir$IR$Value$Apply,
																																			_Utils_Tuple0,
																																			A3(
																																				$author$project$Morphir$IR$Value$Apply,
																																				_Utils_Tuple0,
																																				A3(
																																					$author$project$Morphir$IR$Value$Apply,
																																					_Utils_Tuple0,
																																					A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, value1),
																																					value2),
																																				value3),
																																			value4),
																																		value5));
																															} else {
																																break _v267$6;
																															}
																														case 'Constructor':
																															if ((((((((((((((((((((_v267.b.b.b.b.a.b.a.b && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																																break _v267$1;
																															} else {
																																break _v267$6;
																															}
																														default:
																															break _v267$6;
																													}
																												case 'Constructor':
																													if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																														break _v267$1;
																													} else {
																														if ((((((((((((((((((((_v267.b.b.b.a.b.a.b && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																															break _v267$2;
																														} else {
																															break _v267$6;
																														}
																													}
																												default:
																													if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																														break _v267$1;
																													} else {
																														break _v267$6;
																													}
																											}
																										case 'Constructor':
																											if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																												break _v267$1;
																											} else {
																												if ((((((((((((((((((((((_v267.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.a.b.a.b) && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																													break _v267$2;
																												} else {
																													if ((((((((((((((((((((_v267.b.b.a.b.a.b && _v267.b.b.a.b.a.a.b) && (_v267.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.a.b.a.a.b.b)) && _v267.b.b.a.b.a.b.b) && _v267.b.b.a.b.a.b.a.b) && (_v267.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.a.b.a.b.a.b.b) && (_v267.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.a.b.a.b.b.b)) && _v267.b.b.a.b.b.b) && _v267.b.b.a.b.b.a.b) && (_v267.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.a.b.b.a.b.b)) && (!_v267.b.b.a.b.b.b.b)) && _v267.b.b.a.b.c.b) && (_v267.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.a.b.c.b.b)) {
																														break _v267$3;
																													} else {
																														break _v267$6;
																													}
																												}
																											}
																										default:
																											if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																												break _v267$1;
																											} else {
																												if ((((((((((((((((((((((_v267.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.a.b.a.b) && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																													break _v267$2;
																												} else {
																													break _v267$6;
																												}
																											}
																									}
																								case 'Constructor':
																									if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																										break _v267$1;
																									} else {
																										if ((((((((((((((((((((((_v267.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.a.b.a.b) && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																											break _v267$2;
																										} else {
																											if ((((((((((((((((((((((_v267.b.b.a.$ === 'Constructor') && _v267.b.b.a.b.a.b) && _v267.b.b.a.b.a.a.b) && (_v267.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.a.b.a.a.b.b)) && _v267.b.b.a.b.a.b.b) && _v267.b.b.a.b.a.b.a.b) && (_v267.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.a.b.a.b.a.b.b) && (_v267.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.a.b.a.b.b.b)) && _v267.b.b.a.b.b.b) && _v267.b.b.a.b.b.a.b) && (_v267.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.a.b.b.a.b.b)) && (!_v267.b.b.a.b.b.b.b)) && _v267.b.b.a.b.c.b) && (_v267.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.a.b.c.b.b)) {
																												break _v267$3;
																											} else {
																												if ((((((((((((((((((((_v267.b.a.b.a.b && _v267.b.a.b.a.a.b) && (_v267.b.a.b.a.a.a === 'morphir')) && (!_v267.b.a.b.a.a.b.b)) && _v267.b.a.b.a.b.b) && _v267.b.a.b.a.b.a.b) && (_v267.b.a.b.a.b.a.a === 's')) && _v267.b.a.b.a.b.a.b.b) && (_v267.b.a.b.a.b.a.b.a === 'd')) && _v267.b.a.b.a.b.a.b.b.b) && (_v267.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.a.b.a.b.b.b)) && _v267.b.a.b.b.b) && _v267.b.a.b.b.a.b) && (_v267.b.a.b.b.a.a === 'maybe')) && (!_v267.b.a.b.b.a.b.b)) && (!_v267.b.a.b.b.b.b)) && _v267.b.a.b.c.b) && (_v267.b.a.b.c.a === 'nothing')) && (!_v267.b.a.b.c.b.b)) {
																													break _v267$4;
																												} else {
																													break _v267$6;
																												}
																											}
																										}
																									}
																								default:
																									if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																										break _v267$1;
																									} else {
																										if ((((((((((((((((((((((_v267.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.a.b.a.b) && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																											break _v267$2;
																										} else {
																											if ((((((((((((((((((((((_v267.b.b.a.$ === 'Constructor') && _v267.b.b.a.b.a.b) && _v267.b.b.a.b.a.a.b) && (_v267.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.a.b.a.a.b.b)) && _v267.b.b.a.b.a.b.b) && _v267.b.b.a.b.a.b.a.b) && (_v267.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.a.b.a.b.a.b.b) && (_v267.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.a.b.a.b.b.b)) && _v267.b.b.a.b.b.b) && _v267.b.b.a.b.b.a.b) && (_v267.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.a.b.b.a.b.b)) && (!_v267.b.b.a.b.b.b.b)) && _v267.b.b.a.b.c.b) && (_v267.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.a.b.c.b.b)) {
																												break _v267$3;
																											} else {
																												break _v267$6;
																											}
																										}
																									}
																							}
																						case 'Constructor':
																							if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																								break _v267$1;
																							} else {
																								if ((((((((((((((((((((((_v267.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.a.b.a.b) && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																									break _v267$2;
																								} else {
																									if ((((((((((((((((((((((_v267.b.b.a.$ === 'Constructor') && _v267.b.b.a.b.a.b) && _v267.b.b.a.b.a.a.b) && (_v267.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.a.b.a.a.b.b)) && _v267.b.b.a.b.a.b.b) && _v267.b.b.a.b.a.b.a.b) && (_v267.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.a.b.a.b.a.b.b) && (_v267.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.a.b.a.b.b.b)) && _v267.b.b.a.b.b.b) && _v267.b.b.a.b.b.a.b) && (_v267.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.a.b.b.a.b.b)) && (!_v267.b.b.a.b.b.b.b)) && _v267.b.b.a.b.c.b) && (_v267.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.a.b.c.b.b)) {
																										break _v267$3;
																									} else {
																										if ((((((((((((((((((((((_v267.b.a.$ === 'Constructor') && _v267.b.a.b.a.b) && _v267.b.a.b.a.a.b) && (_v267.b.a.b.a.a.a === 'morphir')) && (!_v267.b.a.b.a.a.b.b)) && _v267.b.a.b.a.b.b) && _v267.b.a.b.a.b.a.b) && (_v267.b.a.b.a.b.a.a === 's')) && _v267.b.a.b.a.b.a.b.b) && (_v267.b.a.b.a.b.a.b.a === 'd')) && _v267.b.a.b.a.b.a.b.b.b) && (_v267.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.a.b.a.b.b.b)) && _v267.b.a.b.b.b) && _v267.b.a.b.b.a.b) && (_v267.b.a.b.b.a.a === 'maybe')) && (!_v267.b.a.b.b.a.b.b)) && (!_v267.b.a.b.b.b.b)) && _v267.b.a.b.c.b) && (_v267.b.a.b.c.a === 'nothing')) && (!_v267.b.a.b.c.b.b)) {
																											break _v267$4;
																										} else {
																											if ((((((((((((((((((((_v267.a.b.a.b && _v267.a.b.a.a.b) && (_v267.a.b.a.a.a === 'morphir')) && (!_v267.a.b.a.a.b.b)) && _v267.a.b.a.b.b) && _v267.a.b.a.b.a.b) && (_v267.a.b.a.b.a.a === 's')) && _v267.a.b.a.b.a.b.b) && (_v267.a.b.a.b.a.b.a === 'd')) && _v267.a.b.a.b.a.b.b.b) && (_v267.a.b.a.b.a.b.b.a === 'k')) && (!_v267.a.b.a.b.a.b.b.b.b)) && (!_v267.a.b.a.b.b.b)) && _v267.a.b.b.b) && _v267.a.b.b.a.b) && (_v267.a.b.b.a.a === 'maybe')) && (!_v267.a.b.b.a.b.b)) && (!_v267.a.b.b.b.b)) && _v267.a.b.c.b) && (_v267.a.b.c.a === 'nothing')) && (!_v267.a.b.c.b.b)) {
																												var _v392 = _v267.a;
																												var _v393 = _v392.b;
																												var _v394 = _v393.a;
																												var _v395 = _v394.a;
																												var _v396 = _v394.b;
																												var _v397 = _v396.a;
																												var _v398 = _v397.b;
																												var _v399 = _v398.b;
																												var _v400 = _v393.b;
																												var _v401 = _v400.a;
																												var _v402 = _v393.c;
																												var _v403 = _v267.b;
																												var _v404 = _v403.b;
																												var _v405 = _v404.b;
																												var _v406 = _v405.b;
																												return $elm$core$Result$Ok(
																													$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
																											} else {
																												break _v267$6;
																											}
																										}
																									}
																								}
																							}
																						default:
																							if ((((((((((((((((((((((_v267.b.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.b.a.b.a.b) && _v267.b.b.b.b.a.b.a.a.b) && (_v267.b.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.b.a.b.a.b.b) && _v267.b.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.b.a.b.b.b) && _v267.b.b.b.b.a.b.b.a.b) && (_v267.b.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.b.a.b.b.b.b)) && _v267.b.b.b.b.a.b.c.b) && (_v267.b.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.b.a.b.c.b.b)) {
																								break _v267$1;
																							} else {
																								if ((((((((((((((((((((((_v267.b.b.b.a.$ === 'Constructor') && _v267.b.b.b.a.b.a.b) && _v267.b.b.b.a.b.a.a.b) && (_v267.b.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.b.a.b.a.a.b.b)) && _v267.b.b.b.a.b.a.b.b) && _v267.b.b.b.a.b.a.b.a.b) && (_v267.b.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.b.a.b.a.b.a.b.b) && (_v267.b.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.b.a.b.a.b.b.b)) && _v267.b.b.b.a.b.b.b) && _v267.b.b.b.a.b.b.a.b) && (_v267.b.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.b.a.b.b.a.b.b)) && (!_v267.b.b.b.a.b.b.b.b)) && _v267.b.b.b.a.b.c.b) && (_v267.b.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.b.a.b.c.b.b)) {
																									break _v267$2;
																								} else {
																									if ((((((((((((((((((((((_v267.b.b.a.$ === 'Constructor') && _v267.b.b.a.b.a.b) && _v267.b.b.a.b.a.a.b) && (_v267.b.b.a.b.a.a.a === 'morphir')) && (!_v267.b.b.a.b.a.a.b.b)) && _v267.b.b.a.b.a.b.b) && _v267.b.b.a.b.a.b.a.b) && (_v267.b.b.a.b.a.b.a.a === 's')) && _v267.b.b.a.b.a.b.a.b.b) && (_v267.b.b.a.b.a.b.a.b.a === 'd')) && _v267.b.b.a.b.a.b.a.b.b.b) && (_v267.b.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.b.a.b.a.b.b.b)) && _v267.b.b.a.b.b.b) && _v267.b.b.a.b.b.a.b) && (_v267.b.b.a.b.b.a.a === 'maybe')) && (!_v267.b.b.a.b.b.a.b.b)) && (!_v267.b.b.a.b.b.b.b)) && _v267.b.b.a.b.c.b) && (_v267.b.b.a.b.c.a === 'nothing')) && (!_v267.b.b.a.b.c.b.b)) {
																										break _v267$3;
																									} else {
																										if ((((((((((((((((((((((_v267.b.a.$ === 'Constructor') && _v267.b.a.b.a.b) && _v267.b.a.b.a.a.b) && (_v267.b.a.b.a.a.a === 'morphir')) && (!_v267.b.a.b.a.a.b.b)) && _v267.b.a.b.a.b.b) && _v267.b.a.b.a.b.a.b) && (_v267.b.a.b.a.b.a.a === 's')) && _v267.b.a.b.a.b.a.b.b) && (_v267.b.a.b.a.b.a.b.a === 'd')) && _v267.b.a.b.a.b.a.b.b.b) && (_v267.b.a.b.a.b.a.b.b.a === 'k')) && (!_v267.b.a.b.a.b.a.b.b.b.b)) && (!_v267.b.a.b.a.b.b.b)) && _v267.b.a.b.b.b) && _v267.b.a.b.b.a.b) && (_v267.b.a.b.b.a.a === 'maybe')) && (!_v267.b.a.b.b.a.b.b)) && (!_v267.b.a.b.b.b.b)) && _v267.b.a.b.c.b) && (_v267.b.a.b.c.a === 'nothing')) && (!_v267.b.a.b.c.b.b)) {
																											break _v267$4;
																										} else {
																											break _v267$6;
																										}
																									}
																								}
																							}
																					}
																				} else {
																					break _v267$6;
																				}
																			}
																			return $elm$core$Result$Err(
																				$author$project$Morphir$Value$Error$UnexpectedArguments(
																					_List_fromArray(
																						[evaluatedArg1, evaluatedArg2, evaluatedArg3, evaluatedArg4, evaluatedArg5])));
																		}
																		var _v377 = _v267.b;
																		var _v378 = _v377.a;
																		var _v379 = _v378.b;
																		var _v380 = _v379.a;
																		var _v381 = _v380.a;
																		var _v382 = _v380.b;
																		var _v383 = _v382.a;
																		var _v384 = _v383.b;
																		var _v385 = _v384.b;
																		var _v386 = _v379.b;
																		var _v387 = _v386.a;
																		var _v388 = _v379.c;
																		var _v389 = _v377.b;
																		var _v390 = _v389.b;
																		var _v391 = _v390.b;
																		return $elm$core$Result$Ok(
																			$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
																	}
																	var _v362 = _v267.b;
																	var _v363 = _v362.b;
																	var _v364 = _v363.a;
																	var _v365 = _v364.b;
																	var _v366 = _v365.a;
																	var _v367 = _v366.a;
																	var _v368 = _v366.b;
																	var _v369 = _v368.a;
																	var _v370 = _v369.b;
																	var _v371 = _v370.b;
																	var _v372 = _v365.b;
																	var _v373 = _v372.a;
																	var _v374 = _v365.c;
																	var _v375 = _v363.b;
																	var _v376 = _v375.b;
																	return $elm$core$Result$Ok(
																		$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
																}
																var _v347 = _v267.b;
																var _v348 = _v347.b;
																var _v349 = _v348.b;
																var _v350 = _v349.a;
																var _v351 = _v350.b;
																var _v352 = _v351.a;
																var _v353 = _v352.a;
																var _v354 = _v352.b;
																var _v355 = _v354.a;
																var _v356 = _v355.b;
																var _v357 = _v356.b;
																var _v358 = _v351.b;
																var _v359 = _v358.a;
																var _v360 = _v351.c;
																var _v361 = _v349.b;
																return $elm$core$Result$Ok(
																	$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
															}
															var _v332 = _v267.b;
															var _v333 = _v332.b;
															var _v334 = _v333.b;
															var _v335 = _v334.b;
															var _v336 = _v335.a;
															var _v337 = _v336.b;
															var _v338 = _v337.a;
															var _v339 = _v338.a;
															var _v340 = _v338.b;
															var _v341 = _v340.a;
															var _v342 = _v341.b;
															var _v343 = _v342.b;
															var _v344 = _v337.b;
															var _v345 = _v344.a;
															var _v346 = _v337.c;
															return $elm$core$Result$Ok(
																$author$project$Morphir$IR$SDK$Maybe$nothing(_Utils_Tuple0));
														},
														_eval(arg5));
												},
												_eval(arg4));
										},
										_eval(arg3));
								},
								_eval(arg2));
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			}))
	]);
var $elm$core$Basics$acos = _Basics_acos;
var $elm$core$String$append = _String_append;
var $elm$core$Basics$asin = _Basics_asin;
var $elm$core$Basics$atan = _Basics_atan;
var $elm$core$Basics$atan2 = _Basics_atan2;
var $author$project$Morphir$Value$Error$ExpectedCharLiteral = function (a) {
	return {$: 'ExpectedCharLiteral', a: a};
};
var $author$project$Morphir$Value$Native$charLiteral = function (lit) {
	if (lit.$ === 'CharLiteral') {
		var v = lit.a;
		return $elm$core$Result$Ok(v);
	} else {
		return $elm$core$Result$Err(
			$author$project$Morphir$Value$Error$ExpectedCharLiteral(
				A2($author$project$Morphir$IR$Value$Literal, _Utils_Tuple0, lit)));
	}
};
var $elm$core$Basics$cos = _Basics_cos;
var $elm$core$Basics$pi = _Basics_pi;
var $elm$core$Basics$degrees = function (angleInDegrees) {
	return (angleInDegrees * $elm$core$Basics$pi) / 180;
};
var $elm$core$String$dropRight = F2(
	function (n, string) {
		return (n < 1) ? string : A3($elm$core$String$slice, 0, -n, string);
	});
var $elm$core$Basics$e = _Basics_e;
var $elm$core$String$endsWith = _String_endsWith;
var $author$project$Morphir$Value$Native$eval0 = F2(
	function (r, encodeR) {
		return F2(
			function (_eval, args) {
				if (!args.b) {
					return encodeR(r);
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			});
	});
var $elm$core$String$fromChar = function (_char) {
	return A2($elm$core$String$cons, _char, '');
};
var $elm$core$Char$fromCode = _Char_fromCode;
var $elm$core$String$fromList = _String_fromList;
var $elm$core$Basics$sin = _Basics_sin;
var $elm$core$Basics$fromPolar = function (_v0) {
	var radius = _v0.a;
	var theta = _v0.b;
	return _Utils_Tuple2(
		radius * $elm$core$Basics$cos(theta),
		radius * $elm$core$Basics$sin(theta));
};
var $elm$core$String$indices = _String_indexes;
var $elm$core$Char$isHexDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return ((48 <= code) && (code <= 57)) || (((65 <= code) && (code <= 70)) || ((97 <= code) && (code <= 102)));
};
var $elm$core$Basics$isInfinite = _Basics_isInfinite;
var $elm$core$Basics$isNaN = _Basics_isNaN;
var $elm$core$Char$isOctDigit = function (_char) {
	var code = $elm$core$Char$toCode(_char);
	return (code <= 55) && (48 <= code);
};
var $elm$core$String$lines = _String_lines;
var $elm$core$Basics$modBy = _Basics_modBy;
var $elm$core$Bitwise$shiftRightBy = _Bitwise_shiftRightBy;
var $elm$core$String$repeatHelp = F3(
	function (n, chunk, result) {
		return (n <= 0) ? result : A3(
			$elm$core$String$repeatHelp,
			n >> 1,
			_Utils_ap(chunk, chunk),
			(!(n & 1)) ? result : _Utils_ap(result, chunk));
	});
var $elm$core$String$repeat = F2(
	function (n, chunk) {
		return A3($elm$core$String$repeatHelp, n, chunk, '');
	});
var $elm$core$String$pad = F3(
	function (n, _char, string) {
		var half = (n - $elm$core$String$length(string)) / 2;
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				$elm$core$Basics$ceiling(half),
				$elm$core$String$fromChar(_char)),
			_Utils_ap(
				string,
				A2(
					$elm$core$String$repeat,
					$elm$core$Basics$floor(half),
					$elm$core$String$fromChar(_char))));
	});
var $elm$core$String$padLeft = F3(
	function (n, _char, string) {
		return _Utils_ap(
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)),
			string);
	});
var $elm$core$String$padRight = F3(
	function (n, _char, string) {
		return _Utils_ap(
			string,
			A2(
				$elm$core$String$repeat,
				n - $elm$core$String$length(string),
				$elm$core$String$fromChar(_char)));
	});
var $elm$core$Basics$radians = function (angleInRadians) {
	return angleInRadians;
};
var $elm$core$String$replace = F3(
	function (before, after, string) {
		return A2(
			$elm$core$String$join,
			after,
			A2($elm$core$String$split, before, string));
	});
var $elm$core$String$reverse = _String_reverse;
var $elm$core$String$right = F2(
	function (n, string) {
		return (n < 1) ? '' : A3(
			$elm$core$String$slice,
			-n,
			$elm$core$String$length(string),
			string);
	});
var $elm$core$Basics$sqrt = _Basics_sqrt;
var $elm$core$Basics$tan = _Basics_tan;
var $elm$core$String$toFloat = _String_toFloat;
var $elm$core$String$foldr = _String_foldr;
var $elm$core$String$toList = function (string) {
	return A3($elm$core$String$foldr, $elm$core$List$cons, _List_Nil, string);
};
var $elm$core$Char$toLocaleLower = _Char_toLocaleLower;
var $elm$core$Char$toLocaleUpper = _Char_toLocaleUpper;
var $elm$core$Char$toLower = _Char_toLower;
var $elm$core$Basics$toPolar = function (_v0) {
	var x = _v0.a;
	var y = _v0.b;
	return _Utils_Tuple2(
		$elm$core$Basics$sqrt((x * x) + (y * y)),
		A2($elm$core$Basics$atan2, y, x));
};
var $elm$core$String$toUpper = _String_toUpper;
var $elm$core$String$trim = _String_trim;
var $elm$core$String$trimLeft = _String_trimLeft;
var $elm$core$String$trimRight = _String_trimRight;
var $elm$core$Basics$truncate = _Basics_truncate;
var $elm$core$Basics$turns = function (angleInTurns) {
	return (2 * $elm$core$Basics$pi) * angleInTurns;
};
var $author$project$Morphir$IR$SDK$SDKNativeFunctions$nativeFunctions = _List_fromArray(
	[
		_Utils_Tuple3(
		'Basics',
		'acos',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$acos,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'and',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$and,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Basics',
		'asin',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$asin,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'atan',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$atan,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'atan2',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$atan2,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'ceiling',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$ceiling,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'cos',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$cos,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'degrees',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$degrees,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'divide',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$fdiv,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'e',
		A2(
			$author$project$Morphir$Value$Native$eval0,
			$elm$core$Basics$e,
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'floor',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$floor,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'fromPolar',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$fromPolar,
			$author$project$Morphir$Value$Native$decodeTuple2(
				_Utils_Tuple2(
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral))),
			$author$project$Morphir$Value$Native$encodeTuple2(
				_Utils_Tuple2(
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))))),
		_Utils_Tuple3(
		'Basics',
		'integerDivide',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$idiv,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'isInfinite',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$isInfinite,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Basics',
		'isNaN',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$isNaN,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Basics',
		'logBase',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$logBase,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'modBy',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$modBy,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'not',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$not,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Basics',
		'or',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$or,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Basics',
		'pi',
		A2(
			$author$project$Morphir$Value$Native$eval0,
			$elm$core$Basics$pi,
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'radians',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$radians,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'remainderBy',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$remainderBy,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'round',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$round,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'sin',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$sin,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'sqrt',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$sqrt,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'tan',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$tan,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'toFloat',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$toFloat,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'toPolar',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$toPolar,
			$author$project$Morphir$Value$Native$decodeTuple2(
				_Utils_Tuple2(
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
					$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral))),
			$author$project$Morphir$Value$Native$encodeTuple2(
				_Utils_Tuple2(
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral),
					$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))))),
		_Utils_Tuple3(
		'Basics',
		'truncate',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$truncate,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Basics',
		'turns',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Basics$turns,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral))),
		_Utils_Tuple3(
		'Basics',
		'xor',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Basics$xor,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$boolLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'fromCode',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$fromCode,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral))),
		_Utils_Tuple3(
		'Char',
		'isAlpha',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isAlpha,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'isAlphaNum',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isAlphaNum,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'isDigit',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isDigit,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'isHexDigit',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isHexDigit,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'isLower',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isLower,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'isOctDigit',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isOctDigit,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'isUpper',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$isUpper,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'Char',
		'toCode',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$toCode,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'Char',
		'toLocaleLower',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$toLocaleLower,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral))),
		_Utils_Tuple3(
		'Char',
		'toLocaleUpper',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$toLocaleUpper,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral))),
		_Utils_Tuple3(
		'Char',
		'toLower',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$toLower,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral))),
		_Utils_Tuple3(
		'Char',
		'toUpper',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Char$toUpper,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral))),
		_Utils_Tuple3(
		'List',
		'range',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$List$range,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)))),
		_Utils_Tuple3(
		'String',
		'append',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$append,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'concat',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$concat,
			$author$project$Morphir$Value$Native$decodeList(
				$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral)),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'cons',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$cons,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'contains',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$contains,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'String',
		'dropLeft',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$dropLeft,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'dropRight',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$dropRight,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'endsWith',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$endsWith,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'String',
		'fromChar',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$fromChar,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'fromFloat',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$fromFloat,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$floatLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'fromInt',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$fromInt,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'fromList',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$fromList,
			$author$project$Morphir$Value$Native$decodeList(
				$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral)),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'indexes',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$indexes,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)))),
		_Utils_Tuple3(
		'String',
		'indices',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$indices,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)))),
		_Utils_Tuple3(
		'String',
		'isEmpty',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$isEmpty,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'String',
		'join',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$join,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeList(
				$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral)),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'left',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$left,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'length',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$length,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral))),
		_Utils_Tuple3(
		'String',
		'lines',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$lines,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral)))),
		_Utils_Tuple3(
		'String',
		'pad',
		A5(
			$author$project$Morphir$Value$Native$eval3,
			$elm$core$String$pad,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'padLeft',
		A5(
			$author$project$Morphir$Value$Native$eval3,
			$elm$core$String$padLeft,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'padRight',
		A5(
			$author$project$Morphir$Value$Native$eval3,
			$elm$core$String$padRight,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$charLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'repeat',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$repeat,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'replace',
		A5(
			$author$project$Morphir$Value$Native$eval3,
			$elm$core$String$replace,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'reverse',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$reverse,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'right',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$right,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'slice',
		A5(
			$author$project$Morphir$Value$Native$eval3,
			$elm$core$String$slice,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$intLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'split',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$split,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral)))),
		_Utils_Tuple3(
		'String',
		'startsWith',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$String$startsWith,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$BoolLiteral))),
		_Utils_Tuple3(
		'String',
		'toFloat',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$toFloat,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeMaybe(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$FloatLiteral)))),
		_Utils_Tuple3(
		'String',
		'toInt',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$toInt,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeMaybe(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$IntLiteral)))),
		_Utils_Tuple3(
		'String',
		'toList',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$toList,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral)))),
		_Utils_Tuple3(
		'String',
		'toLower',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$toLower,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'toUpper',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$toUpper,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'trim',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$trim,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'trimLeft',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$trimLeft,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'trimRight',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$trimRight,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))),
		_Utils_Tuple3(
		'String',
		'uncons',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$uncons,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeMaybe(
				$author$project$Morphir$Value$Native$encodeTuple2(
					_Utils_Tuple2(
						$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$CharLiteral),
						$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral)))))),
		_Utils_Tuple3(
		'String',
		'words',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$String$words,
			$author$project$Morphir$Value$Native$decodeLiteral($author$project$Morphir$Value$Native$stringLiteral),
			$author$project$Morphir$Value$Native$encodeList(
				$author$project$Morphir$Value$Native$encodeLiteral($author$project$Morphir$IR$Literal$StringLiteral))))
	]);
var $author$project$Morphir$IR$SDK$Tuple$nativeFunctions = _List_fromArray(
	[
		_Utils_Tuple2(
		'pair',
		A4(
			$author$project$Morphir$Value$Native$eval2,
			$elm$core$Tuple$pair,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$decodeRaw,
			$author$project$Morphir$Value$Native$encodeTuple2(
				_Utils_Tuple2($author$project$Morphir$Value$Native$encodeRaw, $author$project$Morphir$Value$Native$encodeRaw)))),
		_Utils_Tuple2(
		'first',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Tuple$first,
			$author$project$Morphir$Value$Native$decodeTuple2(
				_Utils_Tuple2($author$project$Morphir$Value$Native$decodeRaw, $author$project$Morphir$Value$Native$decodeRaw)),
			$author$project$Morphir$Value$Native$encodeRaw)),
		_Utils_Tuple2(
		'second',
		A3(
			$author$project$Morphir$Value$Native$eval1,
			$elm$core$Tuple$second,
			$author$project$Morphir$Value$Native$decodeTuple2(
				_Utils_Tuple2($author$project$Morphir$Value$Native$decodeRaw, $author$project$Morphir$Value$Native$decodeRaw)),
			$author$project$Morphir$Value$Native$encodeRaw)),
		_Utils_Tuple2(
		'mapFirst',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v1 = args.b;
					var arg1 = _v1.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if ((((evaluatedArg1.$ === 'Tuple') && evaluatedArg1.b.b) && evaluatedArg1.b.b.b) && (!evaluatedArg1.b.b.b.b)) {
								var _v3 = evaluatedArg1.b;
								var val1 = _v3.a;
								var _v4 = _v3.b;
								var val2 = _v4.a;
								return A2(
									$elm$core$Result$andThen,
									function (evaluatedValue1) {
										return $elm$core$Result$Ok(
											A2(
												$author$project$Morphir$IR$Value$Tuple,
												_Utils_Tuple0,
												_List_fromArray(
													[evaluatedValue1, val2])));
									},
									_eval(
										A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, val1)));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedTuple(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'mapSecond',
		F2(
			function (_eval, args) {
				if ((args.b && args.b.b) && (!args.b.b.b)) {
					var fun = args.a;
					var _v6 = args.b;
					var arg1 = _v6.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if ((((evaluatedArg1.$ === 'Tuple') && evaluatedArg1.b.b) && evaluatedArg1.b.b.b) && (!evaluatedArg1.b.b.b.b)) {
								var _v8 = evaluatedArg1.b;
								var val1 = _v8.a;
								var _v9 = _v8.b;
								var val2 = _v9.a;
								return A2(
									$elm$core$Result$andThen,
									function (evaluatedValue2) {
										return $elm$core$Result$Ok(
											A2(
												$author$project$Morphir$IR$Value$Tuple,
												_Utils_Tuple0,
												_List_fromArray(
													[val1, evaluatedValue2])));
									},
									_eval(
										A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun, val2)));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedTuple(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			})),
		_Utils_Tuple2(
		'mapBoth',
		F2(
			function (_eval, args) {
				if (((args.b && args.b.b) && args.b.b.b) && (!args.b.b.b.b)) {
					var fun1 = args.a;
					var _v11 = args.b;
					var fun2 = _v11.a;
					var _v12 = _v11.b;
					var arg1 = _v12.a;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArg1) {
							if ((((evaluatedArg1.$ === 'Tuple') && evaluatedArg1.b.b) && evaluatedArg1.b.b.b) && (!evaluatedArg1.b.b.b.b)) {
								var _v14 = evaluatedArg1.b;
								var val1 = _v14.a;
								var _v15 = _v14.b;
								var val2 = _v15.a;
								return A2(
									$elm$core$Result$andThen,
									$elm$core$Basics$identity,
									A3(
										$elm$core$Result$map2,
										F2(
											function (evaluatedValue1, evaluatedValue2) {
												return $elm$core$Result$Ok(
													A2(
														$author$project$Morphir$IR$Value$Tuple,
														_Utils_Tuple0,
														_List_fromArray(
															[evaluatedValue1, evaluatedValue2])));
											}),
										_eval(
											A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun1, val1)),
										_eval(
											A3($author$project$Morphir$IR$Value$Apply, _Utils_Tuple0, fun2, val2))));
							} else {
								return $elm$core$Result$Err(
									$author$project$Morphir$Value$Error$ExpectedTuple(evaluatedArg1));
							}
						},
						_eval(arg1));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Value$Error$UnexpectedArguments(args));
				}
			}))
	]);
var $author$project$Morphir$IR$SDK$packageName = $author$project$Morphir$IR$Path$fromString('Morphir.SDK');
var $elm$core$Dict$foldl = F3(
	function (func, acc, dict) {
		foldl:
		while (true) {
			if (dict.$ === 'RBEmpty_elm_builtin') {
				return acc;
			} else {
				var key = dict.b;
				var value = dict.c;
				var left = dict.d;
				var right = dict.e;
				var $temp$func = func,
					$temp$acc = A3(
					func,
					key,
					value,
					A3($elm$core$Dict$foldl, func, acc, left)),
					$temp$dict = right;
				func = $temp$func;
				acc = $temp$acc;
				dict = $temp$dict;
				continue foldl;
			}
		}
	});
var $elm$core$Dict$union = F2(
	function (t1, t2) {
		return A3($elm$core$Dict$foldl, $elm$core$Dict$insert, t2, t1);
	});
var $author$project$Morphir$IR$SDK$nativeFunctions = function () {
	var moduleFunctions = F2(
		function (moduleName, functionsByName) {
			return $elm$core$Dict$fromList(
				A2(
					$elm$core$List$map,
					function (_v1) {
						var localName = _v1.a;
						var fun = _v1.b;
						return _Utils_Tuple2(
							_Utils_Tuple3(
								$author$project$Morphir$IR$SDK$packageName,
								$author$project$Morphir$IR$Path$fromString(moduleName),
								$author$project$Morphir$IR$Name$fromString(localName)),
							fun);
					},
					functionsByName));
		});
	return A3(
		$elm$core$List$foldl,
		$elm$core$Dict$union,
		$elm$core$Dict$fromList(
			A2(
				$elm$core$List$map,
				function (_v0) {
					var moduleName = _v0.a;
					var localName = _v0.b;
					var fun = _v0.c;
					return _Utils_Tuple2(
						_Utils_Tuple3(
							$author$project$Morphir$IR$SDK$packageName,
							$author$project$Morphir$IR$Path$fromString(moduleName),
							$author$project$Morphir$IR$Name$fromString(localName)),
						fun);
				},
				$author$project$Morphir$IR$SDK$SDKNativeFunctions$nativeFunctions)),
		_List_fromArray(
			[
				A2(moduleFunctions, 'Basics', $author$project$Morphir$IR$SDK$Basics$nativeFunctions),
				A2(moduleFunctions, 'List', $author$project$Morphir$IR$SDK$List$nativeFunctions),
				A2(moduleFunctions, 'Maybe', $author$project$Morphir$IR$SDK$Maybe$nativeFunctions),
				A2(moduleFunctions, 'Tuple', $author$project$Morphir$IR$SDK$Tuple$nativeFunctions)
			]));
}();
var $mdgriffith$elm_ui$Internal$Model$PaddingStyle = F5(
	function (a, b, c, d, e) {
		return {$: 'PaddingStyle', a: a, b: b, c: c, d: d, e: e};
	});
var $mdgriffith$elm_ui$Internal$Flag$padding = $mdgriffith$elm_ui$Internal$Flag$flag(2);
var $mdgriffith$elm_ui$Element$padding = function (x) {
	var f = x;
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$padding,
		A5(
			$mdgriffith$elm_ui$Internal$Model$PaddingStyle,
			'p-' + $elm$core$String$fromInt(x),
			f,
			f,
			f,
			f));
};
var $mdgriffith$elm_ui$Element$Font$size = function (i) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$fontSize,
		$mdgriffith$elm_ui$Internal$Model$FontSize(i));
};
var $mdgriffith$elm_ui$Element$modular = F3(
	function (normal, ratio, rescale) {
		return (!rescale) ? normal : ((rescale < 0) ? (normal * A2($elm$core$Basics$pow, ratio, rescale)) : (normal * A2($elm$core$Basics$pow, ratio, rescale - 1)));
	});
var $author$project$Morphir$Visual$Theme$scaled = F2(
	function (scaleValue, theme) {
		return $elm$core$Basics$round(
			A3($mdgriffith$elm_ui$Element$modular, theme.fontSize, 1.25, scaleValue));
	});
var $author$project$Morphir$Visual$Theme$smallPadding = function (theme) {
	return A2($author$project$Morphir$Visual$Theme$scaled, -3, theme);
};
var $author$project$Morphir$Visual$Theme$smallSpacing = function (theme) {
	return A2($author$project$Morphir$Visual$Theme$scaled, -3, theme);
};
var $mdgriffith$elm_ui$Internal$Model$SpacingStyle = F3(
	function (a, b, c) {
		return {$: 'SpacingStyle', a: a, b: b, c: c};
	});
var $mdgriffith$elm_ui$Internal$Flag$spacing = $mdgriffith$elm_ui$Internal$Flag$flag(3);
var $mdgriffith$elm_ui$Internal$Model$spacingName = F2(
	function (x, y) {
		return 'spacing-' + ($elm$core$String$fromInt(x) + ('-' + $elm$core$String$fromInt(y)));
	});
var $mdgriffith$elm_ui$Element$spacing = function (x) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$spacing,
		A3(
			$mdgriffith$elm_ui$Internal$Model$SpacingStyle,
			A2($mdgriffith$elm_ui$Internal$Model$spacingName, x, x),
			x,
			x));
};
var $mdgriffith$elm_ui$Internal$Model$Text = function (a) {
	return {$: 'Text', a: a};
};
var $mdgriffith$elm_ui$Element$text = function (content) {
	return $mdgriffith$elm_ui$Internal$Model$Text(content);
};
var $mdgriffith$elm_ui$Element$Background$color = function (clr) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$bgColor,
		A3(
			$mdgriffith$elm_ui$Internal$Model$Colored,
			'bg-' + $mdgriffith$elm_ui$Internal$Model$formatColorClass(clr),
			'background-color',
			clr));
};
var $mdgriffith$elm_ui$Element$Font$color = function (fontColor) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$fontColor,
		A3(
			$mdgriffith$elm_ui$Internal$Model$Colored,
			'fc-' + $mdgriffith$elm_ui$Internal$Model$formatColorClass(fontColor),
			'color',
			fontColor));
};
var $mdgriffith$elm_ui$Internal$Model$AsColumn = {$: 'AsColumn'};
var $mdgriffith$elm_ui$Internal$Model$asColumn = $mdgriffith$elm_ui$Internal$Model$AsColumn;
var $mdgriffith$elm_ui$Internal$Model$Height = function (a) {
	return {$: 'Height', a: a};
};
var $mdgriffith$elm_ui$Element$height = $mdgriffith$elm_ui$Internal$Model$Height;
var $mdgriffith$elm_ui$Internal$Model$Content = {$: 'Content'};
var $mdgriffith$elm_ui$Element$shrink = $mdgriffith$elm_ui$Internal$Model$Content;
var $mdgriffith$elm_ui$Internal$Model$Width = function (a) {
	return {$: 'Width', a: a};
};
var $mdgriffith$elm_ui$Element$width = $mdgriffith$elm_ui$Internal$Model$Width;
var $mdgriffith$elm_ui$Element$column = F2(
	function (attrs, children) {
		return A4(
			$mdgriffith$elm_ui$Internal$Model$element,
			$mdgriffith$elm_ui$Internal$Model$asColumn,
			$mdgriffith$elm_ui$Internal$Model$div,
			A2(
				$elm$core$List$cons,
				$mdgriffith$elm_ui$Internal$Model$htmlClass($mdgriffith$elm_ui$Internal$Style$classes.contentTop + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.contentLeft)),
				A2(
					$elm$core$List$cons,
					$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$shrink),
					A2(
						$elm$core$List$cons,
						$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$shrink),
						attrs))),
			$mdgriffith$elm_ui$Internal$Model$Unkeyed(children));
	});
var $mdgriffith$elm_ui$Element$el = F2(
	function (attrs, child) {
		return A4(
			$mdgriffith$elm_ui$Internal$Model$element,
			$mdgriffith$elm_ui$Internal$Model$asEl,
			$mdgriffith$elm_ui$Internal$Model$div,
			A2(
				$elm$core$List$cons,
				$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$shrink),
				A2(
					$elm$core$List$cons,
					$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$shrink),
					attrs)),
			$mdgriffith$elm_ui$Internal$Model$Unkeyed(
				_List_fromArray(
					[child])));
	});
var $author$project$Morphir$Visual$Theme$mediumPadding = function (theme) {
	return A2($author$project$Morphir$Visual$Theme$scaled, 0, theme);
};
var $author$project$Morphir$Visual$Theme$mediumSpacing = function (theme) {
	return A2($author$project$Morphir$Visual$Theme$scaled, 0, theme);
};
var $mdgriffith$elm_ui$Internal$Model$paddingName = F4(
	function (top, right, bottom, left) {
		return 'pad-' + ($elm$core$String$fromInt(top) + ('-' + ($elm$core$String$fromInt(right) + ('-' + ($elm$core$String$fromInt(bottom) + ('-' + $elm$core$String$fromInt(left)))))));
	});
var $mdgriffith$elm_ui$Element$paddingEach = function (_v0) {
	var top = _v0.top;
	var right = _v0.right;
	var bottom = _v0.bottom;
	var left = _v0.left;
	if (_Utils_eq(top, right) && (_Utils_eq(top, bottom) && _Utils_eq(top, left))) {
		var topFloat = top;
		return A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$padding,
			A5(
				$mdgriffith$elm_ui$Internal$Model$PaddingStyle,
				'p-' + $elm$core$String$fromInt(top),
				topFloat,
				topFloat,
				topFloat,
				topFloat));
	} else {
		return A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$padding,
			A5(
				$mdgriffith$elm_ui$Internal$Model$PaddingStyle,
				A4($mdgriffith$elm_ui$Internal$Model$paddingName, top, right, bottom, left),
				top,
				right,
				bottom,
				left));
	}
};
var $mdgriffith$elm_ui$Internal$Model$AsRow = {$: 'AsRow'};
var $mdgriffith$elm_ui$Internal$Model$asRow = $mdgriffith$elm_ui$Internal$Model$AsRow;
var $mdgriffith$elm_ui$Element$row = F2(
	function (attrs, children) {
		return A4(
			$mdgriffith$elm_ui$Internal$Model$element,
			$mdgriffith$elm_ui$Internal$Model$asRow,
			$mdgriffith$elm_ui$Internal$Model$div,
			A2(
				$elm$core$List$cons,
				$mdgriffith$elm_ui$Internal$Model$htmlClass($mdgriffith$elm_ui$Internal$Style$classes.contentLeft + (' ' + $mdgriffith$elm_ui$Internal$Style$classes.contentCenterY)),
				A2(
					$elm$core$List$cons,
					$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$shrink),
					A2(
						$elm$core$List$cons,
						$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$shrink),
						attrs))),
			$mdgriffith$elm_ui$Internal$Model$Unkeyed(children));
	});
var $author$project$Morphir$Visual$Common$definition = F3(
	function (config, header, body) {
		return A2(
			$mdgriffith$elm_ui$Element$column,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$spacing(
					$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
				]),
			_List_fromArray(
				[
					A2(
					$mdgriffith$elm_ui$Element$row,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$spacing(
							$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
						]),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Element$el,
							_List_fromArray(
								[$mdgriffith$elm_ui$Element$Font$bold]),
							$mdgriffith$elm_ui$Element$text(header)),
							A2(
							$mdgriffith$elm_ui$Element$el,
							_List_Nil,
							$mdgriffith$elm_ui$Element$text('='))
						])),
					A2(
					$mdgriffith$elm_ui$Element$el,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$paddingEach(
							{
								bottom: 0,
								left: $author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme),
								right: $author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme),
								top: 0
							})
						]),
					body)
				]));
	});
var $elm$core$Dict$isEmpty = function (dict) {
	if (dict.$ === 'RBEmpty_elm_builtin') {
		return true;
	} else {
		return false;
	}
};
var $author$project$Morphir$IR$Name$toHumanWords = function (name) {
	var words = $author$project$Morphir$IR$Name$toList(name);
	var join = function (abbrev) {
		return $elm$core$String$toUpper(
			A2($elm$core$String$join, '', abbrev));
	};
	var process = F3(
		function (prefix, abbrev, suffix) {
			process:
			while (true) {
				if (!suffix.b) {
					return $elm$core$List$isEmpty(abbrev) ? prefix : A2(
						$elm$core$List$append,
						prefix,
						_List_fromArray(
							[
								join(abbrev)
							]));
				} else {
					var first = suffix.a;
					var rest = suffix.b;
					if ($elm$core$String$length(first) === 1) {
						var $temp$prefix = prefix,
							$temp$abbrev = A2(
							$elm$core$List$append,
							abbrev,
							_List_fromArray(
								[first])),
							$temp$suffix = rest;
						prefix = $temp$prefix;
						abbrev = $temp$abbrev;
						suffix = $temp$suffix;
						continue process;
					} else {
						if (!abbrev.b) {
							var $temp$prefix = A2(
								$elm$core$List$append,
								prefix,
								_List_fromArray(
									[first])),
								$temp$abbrev = _List_Nil,
								$temp$suffix = rest;
							prefix = $temp$prefix;
							abbrev = $temp$abbrev;
							suffix = $temp$suffix;
							continue process;
						} else {
							var $temp$prefix = A2(
								$elm$core$List$append,
								prefix,
								_List_fromArray(
									[
										join(abbrev),
										first
									])),
								$temp$abbrev = _List_Nil,
								$temp$suffix = rest;
							prefix = $temp$prefix;
							abbrev = $temp$abbrev;
							suffix = $temp$suffix;
							continue process;
						}
					}
				}
			}
		});
	return A3(process, _List_Nil, _List_Nil, words);
};
var $author$project$Morphir$Visual$Common$nameToText = function (name) {
	return A2(
		$elm$core$String$join,
		' ',
		$author$project$Morphir$IR$Name$toHumanWords(name));
};
var $mdgriffith$elm_ui$Internal$Model$Empty = {$: 'Empty'};
var $mdgriffith$elm_ui$Element$none = $mdgriffith$elm_ui$Internal$Model$Empty;
var $elm$virtual_dom$VirtualDom$Normal = function (a) {
	return {$: 'Normal', a: a};
};
var $elm$virtual_dom$VirtualDom$on = _VirtualDom_on;
var $elm$html$Html$Events$on = F2(
	function (event, decoder) {
		return A2(
			$elm$virtual_dom$VirtualDom$on,
			event,
			$elm$virtual_dom$VirtualDom$Normal(decoder));
	});
var $elm$html$Html$Events$onClick = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'click',
		$elm$json$Json$Decode$succeed(msg));
};
var $mdgriffith$elm_ui$Element$Events$onClick = A2($elm$core$Basics$composeL, $mdgriffith$elm_ui$Internal$Model$Attr, $elm$html$Html$Events$onClick);
var $mdgriffith$elm_ui$Internal$Flag$borderRound = $mdgriffith$elm_ui$Internal$Flag$flag(17);
var $mdgriffith$elm_ui$Element$Border$rounded = function (radius) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$borderRound,
		A3(
			$mdgriffith$elm_ui$Internal$Model$Single,
			'br-' + $elm$core$String$fromInt(radius),
			'border-radius',
			$elm$core$String$fromInt(radius) + 'px'));
};
var $mdgriffith$elm_ui$Internal$Flag$borderStyle = $mdgriffith$elm_ui$Internal$Flag$flag(11);
var $mdgriffith$elm_ui$Element$Border$solid = A2($mdgriffith$elm_ui$Internal$Model$Class, $mdgriffith$elm_ui$Internal$Flag$borderStyle, $mdgriffith$elm_ui$Internal$Style$classes.borderSolid);
var $author$project$Morphir$IR$Value$indexedMapListHelp = F3(
	function (f, baseIndex, elemList) {
		return A3(
			$elm$core$List$foldl,
			F2(
				function (nextElem, _v0) {
					var elemsSoFar = _v0.a;
					var lastIndexSoFar = _v0.b;
					var _v1 = A2(f, lastIndexSoFar + 1, nextElem);
					var mappedElem = _v1.a;
					var lastIndex = _v1.b;
					return _Utils_Tuple2(
						A2(
							$elm$core$List$append,
							elemsSoFar,
							_List_fromArray(
								[mappedElem])),
						lastIndex);
				}),
			_Utils_Tuple2(_List_Nil, baseIndex),
			elemList);
	});
var $author$project$Morphir$IR$Value$indexedMapPattern = F3(
	function (f, baseIndex, pattern) {
		switch (pattern.$) {
			case 'WildcardPattern':
				var a = pattern.a;
				return _Utils_Tuple2(
					$author$project$Morphir$IR$Value$WildcardPattern(
						A2(f, baseIndex, a)),
					baseIndex);
			case 'AsPattern':
				var a = pattern.a;
				var aliasedPattern = pattern.b;
				var alias = pattern.c;
				var _v1 = A3($author$project$Morphir$IR$Value$indexedMapPattern, f, baseIndex + 1, aliasedPattern);
				var mappedAliasedPattern = _v1.a;
				var lastIndex = _v1.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$AsPattern,
						A2(f, baseIndex, a),
						mappedAliasedPattern,
						alias),
					lastIndex);
			case 'TuplePattern':
				var a = pattern.a;
				var elemPatterns = pattern.b;
				var _v2 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					$author$project$Morphir$IR$Value$indexedMapPattern(f),
					baseIndex,
					elemPatterns);
				var mappedElemPatterns = _v2.a;
				var elemsLastIndex = _v2.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$TuplePattern,
						A2(f, baseIndex, a),
						mappedElemPatterns),
					elemsLastIndex);
			case 'ConstructorPattern':
				var a = pattern.a;
				var fQName = pattern.b;
				var argPatterns = pattern.c;
				var _v3 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					$author$project$Morphir$IR$Value$indexedMapPattern(f),
					baseIndex,
					argPatterns);
				var mappedArgPatterns = _v3.a;
				var argPatternsLastIndex = _v3.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$ConstructorPattern,
						A2(f, baseIndex, a),
						fQName,
						mappedArgPatterns),
					argPatternsLastIndex);
			case 'EmptyListPattern':
				var a = pattern.a;
				return _Utils_Tuple2(
					$author$project$Morphir$IR$Value$EmptyListPattern(
						A2(f, baseIndex, a)),
					baseIndex);
			case 'HeadTailPattern':
				var a = pattern.a;
				var headPattern = pattern.b;
				var tailPattern = pattern.c;
				var _v4 = A3($author$project$Morphir$IR$Value$indexedMapPattern, f, baseIndex + 1, headPattern);
				var mappedHeadPattern = _v4.a;
				var lastIndexHeadPattern = _v4.b;
				var _v5 = A3($author$project$Morphir$IR$Value$indexedMapPattern, f, lastIndexHeadPattern + 1, tailPattern);
				var mappedTailPattern = _v5.a;
				var lastIndexTailPattern = _v5.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$HeadTailPattern,
						A2(f, baseIndex, a),
						mappedHeadPattern,
						mappedTailPattern),
					lastIndexTailPattern);
			case 'LiteralPattern':
				var a = pattern.a;
				var lit = pattern.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$LiteralPattern,
						A2(f, baseIndex, a),
						lit),
					baseIndex);
			default:
				var a = pattern.a;
				return _Utils_Tuple2(
					$author$project$Morphir$IR$Value$UnitPattern(
						A2(f, baseIndex, a)),
					baseIndex);
		}
	});
var $author$project$Morphir$IR$Value$indexedMapValue = F3(
	function (f, baseIndex, value) {
		switch (value.$) {
			case 'Literal':
				var a = value.a;
				var lit = value.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$Literal,
						A2(f, baseIndex, a),
						lit),
					baseIndex);
			case 'Constructor':
				var a = value.a;
				var fullyQualifiedName = value.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$Constructor,
						A2(f, baseIndex, a),
						fullyQualifiedName),
					baseIndex);
			case 'Tuple':
				var a = value.a;
				var elems = value.b;
				var _v1 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					$author$project$Morphir$IR$Value$indexedMapValue(f),
					baseIndex,
					elems);
				var mappedElems = _v1.a;
				var elemsLastIndex = _v1.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$Tuple,
						A2(f, baseIndex, a),
						mappedElems),
					elemsLastIndex);
			case 'List':
				var a = value.a;
				var values = value.b;
				var _v2 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					$author$project$Morphir$IR$Value$indexedMapValue(f),
					baseIndex,
					values);
				var mappedValues = _v2.a;
				var valuesLastIndex = _v2.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$List,
						A2(f, baseIndex, a),
						mappedValues),
					valuesLastIndex);
			case 'Record':
				var a = value.a;
				var fields = value.b;
				var _v3 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					F2(
						function (fieldBaseIndex, _v4) {
							var fieldName = _v4.a;
							var fieldValue = _v4.b;
							var _v5 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, fieldBaseIndex, fieldValue);
							var mappedFieldValue = _v5.a;
							var lastFieldIndex = _v5.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(fieldName, mappedFieldValue),
								lastFieldIndex);
						}),
					baseIndex,
					fields);
				var mappedFields = _v3.a;
				var valuesLastIndex = _v3.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$Record,
						A2(f, baseIndex, a),
						mappedFields),
					valuesLastIndex);
			case 'Variable':
				var a = value.a;
				var name = value.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$Variable,
						A2(f, baseIndex, a),
						name),
					baseIndex);
			case 'Reference':
				var a = value.a;
				var fQName = value.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$Reference,
						A2(f, baseIndex, a),
						fQName),
					baseIndex);
			case 'Field':
				var a = value.a;
				var subjectValue = value.b;
				var name = value.c;
				var _v6 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, baseIndex + 1, subjectValue);
				var mappedSubjectValue = _v6.a;
				var subjectValueLastIndex = _v6.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$Field,
						A2(f, baseIndex, a),
						mappedSubjectValue,
						name),
					subjectValueLastIndex);
			case 'FieldFunction':
				var a = value.a;
				var name = value.b;
				return _Utils_Tuple2(
					A2(
						$author$project$Morphir$IR$Value$FieldFunction,
						A2(f, baseIndex, a),
						name),
					baseIndex);
			case 'Apply':
				var a = value.a;
				var funValue = value.b;
				var argValue = value.c;
				var _v7 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, baseIndex + 1, funValue);
				var mappedFunValue = _v7.a;
				var funValueLastIndex = _v7.b;
				var _v8 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, funValueLastIndex + 1, argValue);
				var mappedArgValue = _v8.a;
				var argValueLastIndex = _v8.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$Apply,
						A2(f, baseIndex, a),
						mappedFunValue,
						mappedArgValue),
					argValueLastIndex);
			case 'Lambda':
				var a = value.a;
				var argPattern = value.b;
				var bodyValue = value.c;
				var _v9 = A3($author$project$Morphir$IR$Value$indexedMapPattern, f, baseIndex + 1, argPattern);
				var mappedArgPattern = _v9.a;
				var argPatternLastIndex = _v9.b;
				var _v10 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, argPatternLastIndex + 1, bodyValue);
				var mappedBodyValue = _v10.a;
				var bodyValueLastIndex = _v10.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$Lambda,
						A2(f, baseIndex, a),
						mappedArgPattern,
						mappedBodyValue),
					bodyValueLastIndex);
			case 'LetDefinition':
				var a = value.a;
				var defName = value.b;
				var def = value.c;
				var inValue = value.d;
				var _v11 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					F2(
						function (inputBaseIndex, _v12) {
							var inputName = _v12.a;
							var inputA = _v12.b;
							var inputType = _v12.c;
							return _Utils_Tuple2(
								_Utils_Tuple3(
									inputName,
									A2(f, inputBaseIndex, inputA),
									inputType),
								inputBaseIndex);
						}),
					baseIndex,
					def.inputTypes);
				var mappedDefArgs = _v11.a;
				var defArgsLastIndex = _v11.b;
				var _v13 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, defArgsLastIndex + 1, def.body);
				var mappedDefBody = _v13.a;
				var defBodyLastIndex = _v13.b;
				var _v14 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, defBodyLastIndex + 1, inValue);
				var mappedInValue = _v14.a;
				var inValueLastIndex = _v14.b;
				var mappedDef = {body: mappedDefBody, inputTypes: mappedDefArgs, outputType: def.outputType};
				return _Utils_Tuple2(
					A4(
						$author$project$Morphir$IR$Value$LetDefinition,
						A2(f, baseIndex, a),
						defName,
						mappedDef,
						mappedInValue),
					inValueLastIndex);
			case 'LetRecursion':
				var a = value.a;
				var defs = value.b;
				var inValue = value.c;
				var _v15 = $elm$core$Dict$isEmpty(defs) ? _Utils_Tuple2(_List_Nil, baseIndex) : A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					F2(
						function (defBaseIndex, _v16) {
							var defName = _v16.a;
							var def = _v16.b;
							var _v17 = A3(
								$author$project$Morphir$IR$Value$indexedMapListHelp,
								F2(
									function (inputBaseIndex, _v18) {
										var inputName = _v18.a;
										var inputA = _v18.b;
										var inputType = _v18.c;
										return _Utils_Tuple2(
											_Utils_Tuple3(
												inputName,
												A2(f, inputBaseIndex, inputA),
												inputType),
											inputBaseIndex);
									}),
								defBaseIndex - 1,
								def.inputTypes);
							var mappedDefArgs = _v17.a;
							var defArgsLastIndex = _v17.b;
							var _v19 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, defArgsLastIndex + 1, def.body);
							var mappedDefBody = _v19.a;
							var defBodyLastIndex = _v19.b;
							var mappedDef = {body: mappedDefBody, inputTypes: mappedDefArgs, outputType: def.outputType};
							return _Utils_Tuple2(
								_Utils_Tuple2(defName, mappedDef),
								defBodyLastIndex);
						}),
					baseIndex,
					$elm$core$Dict$toList(defs));
				var mappedDefs = _v15.a;
				var defsLastIndex = _v15.b;
				var _v20 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, defsLastIndex + 1, inValue);
				var mappedInValue = _v20.a;
				var inValueLastIndex = _v20.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$LetRecursion,
						A2(f, baseIndex, a),
						$elm$core$Dict$fromList(mappedDefs),
						mappedInValue),
					inValueLastIndex);
			case 'Destructure':
				var a = value.a;
				var bindPattern = value.b;
				var bindValue = value.c;
				var inValue = value.d;
				var _v21 = A3($author$project$Morphir$IR$Value$indexedMapPattern, f, baseIndex + 1, bindPattern);
				var mappedBindPattern = _v21.a;
				var bindPatternLastIndex = _v21.b;
				var _v22 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, bindPatternLastIndex + 1, bindValue);
				var mappedBindValue = _v22.a;
				var bindValueLastIndex = _v22.b;
				var _v23 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, bindValueLastIndex + 1, inValue);
				var mappedInValue = _v23.a;
				var inValueLastIndex = _v23.b;
				return _Utils_Tuple2(
					A4(
						$author$project$Morphir$IR$Value$Destructure,
						A2(f, baseIndex, a),
						mappedBindPattern,
						mappedBindValue,
						mappedInValue),
					inValueLastIndex);
			case 'IfThenElse':
				var a = value.a;
				var condValue = value.b;
				var thenValue = value.c;
				var elseValue = value.d;
				var _v24 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, baseIndex + 1, condValue);
				var mappedCondValue = _v24.a;
				var condValueLastIndex = _v24.b;
				var _v25 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, condValueLastIndex + 1, thenValue);
				var mappedThenValue = _v25.a;
				var thenValueLastIndex = _v25.b;
				var _v26 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, thenValueLastIndex + 1, elseValue);
				var mappedElseValue = _v26.a;
				var elseValueLastIndex = _v26.b;
				return _Utils_Tuple2(
					A4(
						$author$project$Morphir$IR$Value$IfThenElse,
						A2(f, baseIndex, a),
						mappedCondValue,
						mappedThenValue,
						mappedElseValue),
					elseValueLastIndex);
			case 'PatternMatch':
				var a = value.a;
				var subjectValue = value.b;
				var cases = value.c;
				var _v27 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, baseIndex + 1, subjectValue);
				var mappedSubjectValue = _v27.a;
				var subjectValueLastIndex = _v27.b;
				var _v28 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					F2(
						function (fieldBaseIndex, _v29) {
							var casePattern = _v29.a;
							var caseBody = _v29.b;
							var _v30 = A3($author$project$Morphir$IR$Value$indexedMapPattern, f, fieldBaseIndex, casePattern);
							var mappedCasePattern = _v30.a;
							var casePatternLastIndex = _v30.b;
							var _v31 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, casePatternLastIndex + 1, caseBody);
							var mappedCaseBody = _v31.a;
							var caseBodyLastIndex = _v31.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(mappedCasePattern, mappedCaseBody),
								caseBodyLastIndex);
						}),
					subjectValueLastIndex + 1,
					cases);
				var mappedCases = _v28.a;
				var casesLastIndex = _v28.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$PatternMatch,
						A2(f, baseIndex, a),
						mappedSubjectValue,
						mappedCases),
					casesLastIndex);
			case 'UpdateRecord':
				var a = value.a;
				var subjectValue = value.b;
				var fields = value.c;
				var _v32 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, baseIndex + 1, subjectValue);
				var mappedSubjectValue = _v32.a;
				var subjectValueLastIndex = _v32.b;
				var _v33 = A3(
					$author$project$Morphir$IR$Value$indexedMapListHelp,
					F2(
						function (fieldBaseIndex, _v34) {
							var fieldName = _v34.a;
							var fieldValue = _v34.b;
							var _v35 = A3($author$project$Morphir$IR$Value$indexedMapValue, f, fieldBaseIndex, fieldValue);
							var mappedFieldValue = _v35.a;
							var lastFieldIndex = _v35.b;
							return _Utils_Tuple2(
								_Utils_Tuple2(fieldName, mappedFieldValue),
								lastFieldIndex);
						}),
					subjectValueLastIndex + 1,
					fields);
				var mappedFields = _v33.a;
				var valuesLastIndex = _v33.b;
				return _Utils_Tuple2(
					A3(
						$author$project$Morphir$IR$Value$UpdateRecord,
						A2(f, baseIndex, a),
						mappedSubjectValue,
						mappedFields),
					valuesLastIndex);
			default:
				var a = value.a;
				return _Utils_Tuple2(
					$author$project$Morphir$IR$Value$Unit(
						A2(f, baseIndex, a)),
					baseIndex);
		}
	});
var $author$project$Morphir$Visual$VisualTypedValue$typedToVisualTypedValue = function (typedValue) {
	return A3($author$project$Morphir$IR$Value$indexedMapValue, $elm$core$Tuple$pair, 0, typedValue).a;
};
var $elm$core$Basics$always = F2(
	function (a, _v0) {
		return a;
	});
var $mdgriffith$elm_ui$Internal$Model$Below = {$: 'Below'};
var $mdgriffith$elm_ui$Internal$Model$Nearby = F2(
	function (a, b) {
		return {$: 'Nearby', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Model$NoAttribute = {$: 'NoAttribute'};
var $mdgriffith$elm_ui$Element$createNearby = F2(
	function (loc, element) {
		if (element.$ === 'Empty') {
			return $mdgriffith$elm_ui$Internal$Model$NoAttribute;
		} else {
			return A2($mdgriffith$elm_ui$Internal$Model$Nearby, loc, element);
		}
	});
var $mdgriffith$elm_ui$Element$below = function (element) {
	return A2($mdgriffith$elm_ui$Element$createNearby, $mdgriffith$elm_ui$Internal$Model$Below, element);
};
var $author$project$Morphir$IR$SDK$Basics$boolType = function (attributes) {
	return A3(
		$author$project$Morphir$IR$Type$Reference,
		attributes,
		A2($author$project$Morphir$IR$SDK$Common$toFQName, $author$project$Morphir$IR$SDK$Basics$moduleName, 'Bool'),
		_List_Nil);
};
var $mdgriffith$elm_ui$Internal$Flag$fontAlignment = $mdgriffith$elm_ui$Internal$Flag$flag(12);
var $mdgriffith$elm_ui$Element$Font$center = A2($mdgriffith$elm_ui$Internal$Model$Class, $mdgriffith$elm_ui$Internal$Flag$fontAlignment, $mdgriffith$elm_ui$Internal$Style$classes.textCenter);
var $author$project$Morphir$IR$Value$definitionToValue = function (def) {
	var _v0 = def.inputTypes;
	if (!_v0.b) {
		return def.body;
	} else {
		var _v1 = _v0.a;
		var firstArgName = _v1.a;
		var restOfArgs = _v0.b;
		return A3(
			$author$project$Morphir$IR$Value$Lambda,
			_Utils_Tuple0,
			A3(
				$author$project$Morphir$IR$Value$AsPattern,
				_Utils_Tuple0,
				$author$project$Morphir$IR$Value$WildcardPattern(_Utils_Tuple0),
				firstArgName),
			$author$project$Morphir$IR$Value$definitionToValue(
				_Utils_update(
					def,
					{inputTypes: restOfArgs})));
	}
};
var $author$project$Morphir$Value$Error$BindPatternDidNotMatch = F2(
	function (a, b) {
		return {$: 'BindPatternDidNotMatch', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$ErrorWhileEvaluatingReference = F2(
	function (a, b) {
		return {$: 'ErrorWhileEvaluatingReference', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$ErrorWhileEvaluatingVariable = F2(
	function (a, b) {
		return {$: 'ErrorWhileEvaluatingVariable', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$ExactlyOneArgumentExpected = function (a) {
	return {$: 'ExactlyOneArgumentExpected', a: a};
};
var $author$project$Morphir$Value$Error$FieldNotFound = F2(
	function (a, b) {
		return {$: 'FieldNotFound', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$IfThenElseConditionShouldEvaluateToBool = F2(
	function (a, b) {
		return {$: 'IfThenElseConditionShouldEvaluateToBool', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$LambdaArgumentDidNotMatch = function (a) {
	return {$: 'LambdaArgumentDidNotMatch', a: a};
};
var $author$project$Morphir$Value$Error$NoArgumentToPassToLambda = {$: 'NoArgumentToPassToLambda'};
var $author$project$Morphir$Value$Error$NoPatternsMatch = F2(
	function (a, b) {
		return {$: 'NoPatternsMatch', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$RecordExpected = F2(
	function (a, b) {
		return {$: 'RecordExpected', a: a, b: b};
	});
var $author$project$Morphir$Value$Error$ReferenceNotFound = function (a) {
	return {$: 'ReferenceNotFound', a: a};
};
var $author$project$Morphir$Value$Error$VariableNotFound = function (a) {
	return {$: 'VariableNotFound', a: a};
};
var $elm$core$Basics$composeR = F3(
	function (f, g, x) {
		return g(
			f(x));
	});
var $author$project$Morphir$IR$lookupValueDefinition = F2(
	function (fqn, ir) {
		return A2($elm$core$Dict$get, fqn, ir.valueDefinitions);
	});
var $elm$core$Dict$map = F2(
	function (func, dict) {
		if (dict.$ === 'RBEmpty_elm_builtin') {
			return $elm$core$Dict$RBEmpty_elm_builtin;
		} else {
			var color = dict.a;
			var key = dict.b;
			var value = dict.c;
			var left = dict.d;
			var right = dict.e;
			return A5(
				$elm$core$Dict$RBNode_elm_builtin,
				color,
				key,
				A2(func, key, value),
				A2($elm$core$Dict$map, func, left),
				A2($elm$core$Dict$map, func, right));
		}
	});
var $author$project$Morphir$Value$Error$PatternMismatch = F2(
	function (a, b) {
		return {$: 'PatternMismatch', a: a, b: b};
	});
var $author$project$Morphir$Value$Interpreter$matchPattern = F2(
	function (pattern, value) {
		var error = $elm$core$Result$Err(
			A2($author$project$Morphir$Value$Error$PatternMismatch, pattern, value));
		switch (pattern.$) {
			case 'WildcardPattern':
				return $elm$core$Result$Ok($elm$core$Dict$empty);
			case 'AsPattern':
				var subjectPattern = pattern.b;
				var alias = pattern.c;
				return A2(
					$elm$core$Result$map,
					function (subjectVariables) {
						return A3($elm$core$Dict$insert, alias, value, subjectVariables);
					},
					A2($author$project$Morphir$Value$Interpreter$matchPattern, subjectPattern, value));
			case 'TuplePattern':
				var elemPatterns = pattern.b;
				if (value.$ === 'Tuple') {
					var elemValues = value.b;
					var valueLength = $elm$core$List$length(elemValues);
					var patternLength = $elm$core$List$length(elemPatterns);
					return _Utils_eq(patternLength, valueLength) ? A2(
						$elm$core$Result$map,
						A2($elm$core$List$foldl, $elm$core$Dict$union, $elm$core$Dict$empty),
						$author$project$Morphir$ListOfResults$liftFirstError(
							A3($elm$core$List$map2, $author$project$Morphir$Value$Interpreter$matchPattern, elemPatterns, elemValues))) : error;
				} else {
					return error;
				}
			case 'ConstructorPattern':
				var ctorPatternFQName = pattern.b;
				var argPatterns = pattern.c;
				var uncurry = function (v) {
					if (v.$ === 'Apply') {
						var f = v.b;
						var a = v.c;
						var _v3 = uncurry(f);
						var nestedV = _v3.a;
						var nestedArgs = _v3.b;
						return _Utils_Tuple2(
							nestedV,
							_Utils_ap(
								nestedArgs,
								_List_fromArray(
									[a])));
					} else {
						return _Utils_Tuple2(v, _List_Nil);
					}
				};
				var _v4 = uncurry(value);
				var ctorValue = _v4.a;
				var argValues = _v4.b;
				if (ctorValue.$ === 'Constructor') {
					var ctorFQName = ctorValue.b;
					if (_Utils_eq(ctorPatternFQName, ctorFQName)) {
						var valueLength = $elm$core$List$length(argValues);
						var patternLength = $elm$core$List$length(argPatterns);
						return _Utils_eq(patternLength, valueLength) ? A2(
							$elm$core$Result$map,
							A2($elm$core$List$foldl, $elm$core$Dict$union, $elm$core$Dict$empty),
							$author$project$Morphir$ListOfResults$liftFirstError(
								A3($elm$core$List$map2, $author$project$Morphir$Value$Interpreter$matchPattern, argPatterns, argValues))) : error;
					} else {
						return error;
					}
				} else {
					return error;
				}
			case 'EmptyListPattern':
				if ((value.$ === 'List') && (!value.b.b)) {
					return $elm$core$Result$Ok($elm$core$Dict$empty);
				} else {
					return error;
				}
			case 'HeadTailPattern':
				var headPattern = pattern.b;
				var tailPattern = pattern.c;
				if ((value.$ === 'List') && value.b.b) {
					var a = value.a;
					var _v8 = value.b;
					var headValue = _v8.a;
					var tailValue = _v8.b;
					return A3(
						$elm$core$Result$map2,
						$elm$core$Dict$union,
						A2($author$project$Morphir$Value$Interpreter$matchPattern, headPattern, headValue),
						A2(
							$author$project$Morphir$Value$Interpreter$matchPattern,
							tailPattern,
							A2($author$project$Morphir$IR$Value$List, a, tailValue)));
				} else {
					return error;
				}
			case 'LiteralPattern':
				var matchLiteral = pattern.b;
				if (value.$ === 'Literal') {
					var valueLiteral = value.b;
					return _Utils_eq(matchLiteral, valueLiteral) ? $elm$core$Result$Ok($elm$core$Dict$empty) : error;
				} else {
					return error;
				}
			default:
				if (value.$ === 'Unit') {
					return $elm$core$Result$Ok($elm$core$Dict$empty);
				} else {
					return error;
				}
		}
	});
var $author$project$Morphir$IR$resolveAliases = F2(
	function (fQName, ir) {
		return A2(
			$elm$core$Maybe$withDefault,
			fQName,
			A2(
				$elm$core$Maybe$map,
				function (typeSpec) {
					if ((typeSpec.$ === 'TypeAliasSpecification') && (typeSpec.b.$ === 'Reference')) {
						var _v1 = typeSpec.b;
						var aliasFQName = _v1.b;
						return aliasFQName;
					} else {
						return fQName;
					}
				},
				A2($author$project$Morphir$IR$lookupTypeSpecification, fQName, ir)));
	});
var $author$project$Morphir$IR$Value$mapPatternAttributes = F2(
	function (f, p) {
		switch (p.$) {
			case 'WildcardPattern':
				var a = p.a;
				return $author$project$Morphir$IR$Value$WildcardPattern(
					f(a));
			case 'AsPattern':
				var a = p.a;
				var p2 = p.b;
				var name = p.c;
				return A3(
					$author$project$Morphir$IR$Value$AsPattern,
					f(a),
					A2($author$project$Morphir$IR$Value$mapPatternAttributes, f, p2),
					name);
			case 'TuplePattern':
				var a = p.a;
				var elementPatterns = p.b;
				return A2(
					$author$project$Morphir$IR$Value$TuplePattern,
					f(a),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Value$mapPatternAttributes(f),
						elementPatterns));
			case 'ConstructorPattern':
				var a = p.a;
				var constructorName = p.b;
				var argumentPatterns = p.c;
				return A3(
					$author$project$Morphir$IR$Value$ConstructorPattern,
					f(a),
					constructorName,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Value$mapPatternAttributes(f),
						argumentPatterns));
			case 'EmptyListPattern':
				var a = p.a;
				return $author$project$Morphir$IR$Value$EmptyListPattern(
					f(a));
			case 'HeadTailPattern':
				var a = p.a;
				var headPattern = p.b;
				var tailPattern = p.c;
				return A3(
					$author$project$Morphir$IR$Value$HeadTailPattern,
					f(a),
					A2($author$project$Morphir$IR$Value$mapPatternAttributes, f, headPattern),
					A2($author$project$Morphir$IR$Value$mapPatternAttributes, f, tailPattern));
			case 'LiteralPattern':
				var a = p.a;
				var value = p.b;
				return A2(
					$author$project$Morphir$IR$Value$LiteralPattern,
					f(a),
					value);
			default:
				var a = p.a;
				return $author$project$Morphir$IR$Value$UnitPattern(
					f(a));
		}
	});
var $author$project$Morphir$IR$Type$mapFieldType = F2(
	function (f, field) {
		return A2(
			$author$project$Morphir$IR$Type$Field,
			field.name,
			f(field.tpe));
	});
var $author$project$Morphir$IR$Type$mapTypeAttributes = F2(
	function (f, tpe) {
		switch (tpe.$) {
			case 'Variable':
				var a = tpe.a;
				var name = tpe.b;
				return A2(
					$author$project$Morphir$IR$Type$Variable,
					f(a),
					name);
			case 'Reference':
				var a = tpe.a;
				var fQName = tpe.b;
				var argTypes = tpe.c;
				return A3(
					$author$project$Morphir$IR$Type$Reference,
					f(a),
					fQName,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Type$mapTypeAttributes(f),
						argTypes));
			case 'Tuple':
				var a = tpe.a;
				var elemTypes = tpe.b;
				return A2(
					$author$project$Morphir$IR$Type$Tuple,
					f(a),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Type$mapTypeAttributes(f),
						elemTypes));
			case 'Record':
				var a = tpe.a;
				var fields = tpe.b;
				return A2(
					$author$project$Morphir$IR$Type$Record,
					f(a),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Type$mapFieldType(
							$author$project$Morphir$IR$Type$mapTypeAttributes(f)),
						fields));
			case 'ExtensibleRecord':
				var a = tpe.a;
				var name = tpe.b;
				var fields = tpe.c;
				return A3(
					$author$project$Morphir$IR$Type$ExtensibleRecord,
					f(a),
					name,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$IR$Type$mapFieldType(
							$author$project$Morphir$IR$Type$mapTypeAttributes(f)),
						fields));
			case 'Function':
				var a = tpe.a;
				var argType = tpe.b;
				var returnType = tpe.c;
				return A3(
					$author$project$Morphir$IR$Type$Function,
					f(a),
					A2($author$project$Morphir$IR$Type$mapTypeAttributes, f, argType),
					A2($author$project$Morphir$IR$Type$mapTypeAttributes, f, returnType));
			default:
				var a = tpe.a;
				return $author$project$Morphir$IR$Type$Unit(
					f(a));
		}
	});
var $author$project$Morphir$IR$Value$mapDefinitionAttributes = F3(
	function (f, g, d) {
		return A3(
			$author$project$Morphir$IR$Value$Definition,
			A2(
				$elm$core$List$map,
				function (_v5) {
					var name = _v5.a;
					var attr = _v5.b;
					var tpe = _v5.c;
					return _Utils_Tuple3(
						name,
						g(attr),
						A2($author$project$Morphir$IR$Type$mapTypeAttributes, f, tpe));
				},
				d.inputTypes),
			A2($author$project$Morphir$IR$Type$mapTypeAttributes, f, d.outputType),
			A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, d.body));
	});
var $author$project$Morphir$IR$Value$mapValueAttributes = F3(
	function (f, g, v) {
		switch (v.$) {
			case 'Literal':
				var a = v.a;
				var value = v.b;
				return A2(
					$author$project$Morphir$IR$Value$Literal,
					g(a),
					value);
			case 'Constructor':
				var a = v.a;
				var fullyQualifiedName = v.b;
				return A2(
					$author$project$Morphir$IR$Value$Constructor,
					g(a),
					fullyQualifiedName);
			case 'Tuple':
				var a = v.a;
				var elements = v.b;
				return A2(
					$author$project$Morphir$IR$Value$Tuple,
					g(a),
					A2(
						$elm$core$List$map,
						A2($author$project$Morphir$IR$Value$mapValueAttributes, f, g),
						elements));
			case 'List':
				var a = v.a;
				var items = v.b;
				return A2(
					$author$project$Morphir$IR$Value$List,
					g(a),
					A2(
						$elm$core$List$map,
						A2($author$project$Morphir$IR$Value$mapValueAttributes, f, g),
						items));
			case 'Record':
				var a = v.a;
				var fields = v.b;
				return A2(
					$author$project$Morphir$IR$Value$Record,
					g(a),
					A2(
						$elm$core$List$map,
						function (_v1) {
							var fieldName = _v1.a;
							var fieldValue = _v1.b;
							return _Utils_Tuple2(
								fieldName,
								A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, fieldValue));
						},
						fields));
			case 'Variable':
				var a = v.a;
				var name = v.b;
				return A2(
					$author$project$Morphir$IR$Value$Variable,
					g(a),
					name);
			case 'Reference':
				var a = v.a;
				var fullyQualifiedName = v.b;
				return A2(
					$author$project$Morphir$IR$Value$Reference,
					g(a),
					fullyQualifiedName);
			case 'Field':
				var a = v.a;
				var subjectValue = v.b;
				var fieldName = v.c;
				return A3(
					$author$project$Morphir$IR$Value$Field,
					g(a),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, subjectValue),
					fieldName);
			case 'FieldFunction':
				var a = v.a;
				var fieldName = v.b;
				return A2(
					$author$project$Morphir$IR$Value$FieldFunction,
					g(a),
					fieldName);
			case 'Apply':
				var a = v.a;
				var _function = v.b;
				var argument = v.c;
				return A3(
					$author$project$Morphir$IR$Value$Apply,
					g(a),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, _function),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, argument));
			case 'Lambda':
				var a = v.a;
				var argumentPattern = v.b;
				var body = v.c;
				return A3(
					$author$project$Morphir$IR$Value$Lambda,
					g(a),
					A2($author$project$Morphir$IR$Value$mapPatternAttributes, g, argumentPattern),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, body));
			case 'LetDefinition':
				var a = v.a;
				var valueName = v.b;
				var valueDefinition = v.c;
				var inValue = v.d;
				return A4(
					$author$project$Morphir$IR$Value$LetDefinition,
					g(a),
					valueName,
					A3($author$project$Morphir$IR$Value$mapDefinitionAttributes, f, g, valueDefinition),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, inValue));
			case 'LetRecursion':
				var a = v.a;
				var valueDefinitions = v.b;
				var inValue = v.c;
				return A3(
					$author$project$Morphir$IR$Value$LetRecursion,
					g(a),
					A2(
						$elm$core$Dict$map,
						F2(
							function (_v2, def) {
								return A3($author$project$Morphir$IR$Value$mapDefinitionAttributes, f, g, def);
							}),
						valueDefinitions),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, inValue));
			case 'Destructure':
				var a = v.a;
				var pattern = v.b;
				var valueToDestruct = v.c;
				var inValue = v.d;
				return A4(
					$author$project$Morphir$IR$Value$Destructure,
					g(a),
					A2($author$project$Morphir$IR$Value$mapPatternAttributes, g, pattern),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, valueToDestruct),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, inValue));
			case 'IfThenElse':
				var a = v.a;
				var condition = v.b;
				var thenBranch = v.c;
				var elseBranch = v.d;
				return A4(
					$author$project$Morphir$IR$Value$IfThenElse,
					g(a),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, condition),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, thenBranch),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, elseBranch));
			case 'PatternMatch':
				var a = v.a;
				var branchOutOn = v.b;
				var cases = v.c;
				return A3(
					$author$project$Morphir$IR$Value$PatternMatch,
					g(a),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, branchOutOn),
					A2(
						$elm$core$List$map,
						function (_v3) {
							var pattern = _v3.a;
							var body = _v3.b;
							return _Utils_Tuple2(
								A2($author$project$Morphir$IR$Value$mapPatternAttributes, g, pattern),
								A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, body));
						},
						cases));
			case 'UpdateRecord':
				var a = v.a;
				var valueToUpdate = v.b;
				var fieldsToUpdate = v.c;
				return A3(
					$author$project$Morphir$IR$Value$UpdateRecord,
					g(a),
					A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, valueToUpdate),
					A2(
						$elm$core$List$map,
						function (_v4) {
							var fieldName = _v4.a;
							var fieldValue = _v4.b;
							return _Utils_Tuple2(
								fieldName,
								A3($author$project$Morphir$IR$Value$mapValueAttributes, f, g, fieldValue));
						},
						fieldsToUpdate));
			default:
				var a = v.a;
				return $author$project$Morphir$IR$Value$Unit(
					g(a));
		}
	});
var $author$project$Morphir$IR$Value$toRawValue = function (value) {
	return A3(
		$author$project$Morphir$IR$Value$mapValueAttributes,
		$elm$core$Basics$always(_Utils_Tuple0),
		$elm$core$Basics$always(_Utils_Tuple0),
		value);
};
var $author$project$Morphir$Value$Interpreter$evaluateFunctionValue = F4(
	function (nativeFunctions, ir, fQName, variableValues) {
		return A2(
			$elm$core$Result$andThen,
			function (valueDef) {
				return A5(
					$author$project$Morphir$Value$Interpreter$evaluateValue,
					nativeFunctions,
					ir,
					$elm$core$Dict$fromList(
						A3(
							$elm$core$List$map2,
							$elm$core$Tuple$pair,
							A2(
								$elm$core$List$map,
								function (_v18) {
									var name = _v18.a;
									return name;
								},
								valueDef.inputTypes),
							variableValues)),
					_List_Nil,
					$author$project$Morphir$IR$Value$toRawValue(valueDef.body));
			},
			A2(
				$elm$core$Result$fromMaybe,
				$author$project$Morphir$Value$Error$ReferenceNotFound(fQName),
				A2($author$project$Morphir$IR$lookupValueDefinition, fQName, ir)));
	});
var $author$project$Morphir$Value$Interpreter$evaluateValue = F5(
	function (nativeFunctions, ir, variables, _arguments, value) {
		evaluateValue:
		while (true) {
			switch (value.$) {
				case 'Literal':
					return $elm$core$Result$Ok(value);
				case 'Constructor':
					var fQName = value.b;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedArgs) {
							var _v1 = A2(
								$author$project$Morphir$IR$lookupTypeSpecification,
								A2($author$project$Morphir$IR$resolveAliases, fQName, ir),
								ir);
							if (((_v1.$ === 'Just') && (_v1.a.$ === 'TypeAliasSpecification')) && (_v1.a.b.$ === 'Record')) {
								var _v2 = _v1.a;
								var _v3 = _v2.b;
								var fields = _v3.b;
								return $elm$core$Result$Ok(
									A2(
										$author$project$Morphir$IR$Value$Record,
										_Utils_Tuple0,
										A3(
											$elm$core$List$map2,
											$elm$core$Tuple$pair,
											A2(
												$elm$core$List$map,
												function ($) {
													return $.name;
												},
												fields),
											evaluatedArgs)));
							} else {
								var applyArgs = F2(
									function (subject, argsReversed) {
										if (!argsReversed.b) {
											return subject;
										} else {
											var lastArg = argsReversed.a;
											var restOfArgsReversed = argsReversed.b;
											return A3(
												$author$project$Morphir$IR$Value$Apply,
												_Utils_Tuple0,
												A2(applyArgs, subject, restOfArgsReversed),
												lastArg);
										}
									});
								return $elm$core$Result$Ok(
									A2(
										applyArgs,
										value,
										$elm$core$List$reverse(evaluatedArgs)));
							}
						},
						$author$project$Morphir$ListOfResults$liftFirstError(
							A2(
								$elm$core$List$map,
								A4($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil),
								_arguments)));
				case 'Tuple':
					var elems = value.b;
					return A2(
						$elm$core$Result$map,
						$author$project$Morphir$IR$Value$Tuple(_Utils_Tuple0),
						$author$project$Morphir$ListOfResults$liftFirstError(
							A2(
								$elm$core$List$map,
								A4($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil),
								elems)));
				case 'List':
					var items = value.b;
					return A2(
						$elm$core$Result$map,
						$author$project$Morphir$IR$Value$List(_Utils_Tuple0),
						$author$project$Morphir$ListOfResults$liftFirstError(
							A2(
								$elm$core$List$map,
								A4($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil),
								items)));
				case 'Record':
					var fields = value.b;
					return A2(
						$elm$core$Result$map,
						$author$project$Morphir$IR$Value$Record(_Utils_Tuple0),
						$author$project$Morphir$ListOfResults$liftFirstError(
							A2(
								$elm$core$List$map,
								function (_v5) {
									var fieldName = _v5.a;
									var fieldValue = _v5.b;
									return A2(
										$elm$core$Result$map,
										$elm$core$Tuple$pair(fieldName),
										A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, fieldValue));
								},
								fields)));
				case 'Variable':
					var varName = value.b;
					return A2(
						$elm$core$Result$mapError,
						$author$project$Morphir$Value$Error$ErrorWhileEvaluatingVariable(varName),
						A2(
							$elm$core$Result$andThen,
							A4($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil),
							A2(
								$elm$core$Result$fromMaybe,
								$author$project$Morphir$Value$Error$VariableNotFound(varName),
								A2($elm$core$Dict$get, varName, variables))));
				case 'Reference':
					var fQName = value.b;
					var packageName = fQName.a;
					var moduleName = fQName.b;
					var localName = fQName.c;
					var _v6 = A2(
						$elm$core$Dict$get,
						_Utils_Tuple3(packageName, moduleName, localName),
						nativeFunctions);
					if (_v6.$ === 'Just') {
						var nativeFunction = _v6.a;
						return A2(
							$elm$core$Result$mapError,
							$author$project$Morphir$Value$Error$ErrorWhileEvaluatingReference(fQName),
							A2(
								nativeFunction,
								A4($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil),
								_arguments));
					} else {
						return A4($author$project$Morphir$Value$Interpreter$evaluateFunctionValue, nativeFunctions, ir, fQName, _arguments);
					}
				case 'Field':
					var subjectValue = value.b;
					var fieldName = value.c;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedSubjectValue) {
							if (evaluatedSubjectValue.$ === 'Record') {
								var fields = evaluatedSubjectValue.b;
								return A2(
									$elm$core$Result$fromMaybe,
									A2($author$project$Morphir$Value$Error$FieldNotFound, subjectValue, fieldName),
									A2(
										$elm$core$Dict$get,
										fieldName,
										$elm$core$Dict$fromList(fields)));
							} else {
								return $elm$core$Result$Err(
									A2($author$project$Morphir$Value$Error$RecordExpected, subjectValue, evaluatedSubjectValue));
							}
						},
						A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, subjectValue));
				case 'FieldFunction':
					var fieldName = value.b;
					if (_arguments.b && (!_arguments.b.b)) {
						var subjectValue = _arguments.a;
						return A2(
							$elm$core$Result$andThen,
							function (evaluatedSubjectValue) {
								if (evaluatedSubjectValue.$ === 'Record') {
									var fields = evaluatedSubjectValue.b;
									return A2(
										$elm$core$Result$fromMaybe,
										A2($author$project$Morphir$Value$Error$FieldNotFound, subjectValue, fieldName),
										A2(
											$elm$core$Dict$get,
											fieldName,
											$elm$core$Dict$fromList(fields)));
								} else {
									return $elm$core$Result$Err(
										A2($author$project$Morphir$Value$Error$RecordExpected, subjectValue, evaluatedSubjectValue));
								}
							},
							A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, subjectValue));
					} else {
						var other = _arguments;
						return $elm$core$Result$Err(
							$author$project$Morphir$Value$Error$ExactlyOneArgumentExpected(other));
					}
				case 'Apply':
					var _function = value.b;
					var argument = value.c;
					var $temp$nativeFunctions = nativeFunctions,
						$temp$ir = ir,
						$temp$variables = variables,
						$temp$arguments = A2($elm$core$List$cons, argument, _arguments),
						$temp$value = _function;
					nativeFunctions = $temp$nativeFunctions;
					ir = $temp$ir;
					variables = $temp$variables;
					_arguments = $temp$arguments;
					value = $temp$value;
					continue evaluateValue;
				case 'Lambda':
					var argumentPattern = value.b;
					var body = value.c;
					return A2(
						$elm$core$Result$andThen,
						function (argumentVariables) {
							return A5(
								$author$project$Morphir$Value$Interpreter$evaluateValue,
								nativeFunctions,
								ir,
								A2($elm$core$Dict$union, argumentVariables, variables),
								A2(
									$elm$core$Maybe$withDefault,
									_List_Nil,
									$elm$core$List$tail(_arguments)),
								body);
						},
						A2(
							$elm$core$Result$andThen,
							function (argumentValue) {
								return A2(
									$elm$core$Result$mapError,
									$author$project$Morphir$Value$Error$LambdaArgumentDidNotMatch,
									A2($author$project$Morphir$Value$Interpreter$matchPattern, argumentPattern, argumentValue));
							},
							A2(
								$elm$core$Result$fromMaybe,
								$author$project$Morphir$Value$Error$NoArgumentToPassToLambda,
								$elm$core$List$head(_arguments))));
				case 'LetDefinition':
					var defName = value.b;
					var def = value.c;
					var inValue = value.d;
					return A2(
						$elm$core$Result$andThen,
						function (defValue) {
							return A5(
								$author$project$Morphir$Value$Interpreter$evaluateValue,
								nativeFunctions,
								ir,
								A3($elm$core$Dict$insert, defName, defValue, variables),
								_List_Nil,
								inValue);
						},
						A5(
							$author$project$Morphir$Value$Interpreter$evaluateValue,
							nativeFunctions,
							ir,
							variables,
							_List_Nil,
							$author$project$Morphir$IR$Value$definitionToValue(def)));
				case 'LetRecursion':
					var defs = value.b;
					var inValue = value.c;
					var defVariables = A2(
						$elm$core$Dict$map,
						F2(
							function (_v10, def) {
								return $author$project$Morphir$IR$Value$definitionToValue(def);
							}),
						defs);
					var $temp$nativeFunctions = nativeFunctions,
						$temp$ir = ir,
						$temp$variables = A2($elm$core$Dict$union, defVariables, variables),
						$temp$arguments = _List_Nil,
						$temp$value = inValue;
					nativeFunctions = $temp$nativeFunctions;
					ir = $temp$ir;
					variables = $temp$variables;
					_arguments = $temp$arguments;
					value = $temp$value;
					continue evaluateValue;
				case 'Destructure':
					var bindPattern = value.b;
					var bindValue = value.c;
					var inValue = value.d;
					return A2(
						$elm$core$Result$andThen,
						function (bindVariables) {
							return A5(
								$author$project$Morphir$Value$Interpreter$evaluateValue,
								nativeFunctions,
								ir,
								A2($elm$core$Dict$union, bindVariables, variables),
								_List_Nil,
								inValue);
						},
						A2(
							$elm$core$Result$andThen,
							A2(
								$elm$core$Basics$composeR,
								$author$project$Morphir$Value$Interpreter$matchPattern(bindPattern),
								$elm$core$Result$mapError(
									$author$project$Morphir$Value$Error$BindPatternDidNotMatch(bindValue))),
							A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, bindValue)));
				case 'IfThenElse':
					var condition = value.b;
					var thenBranch = value.c;
					var elseBranch = value.d;
					return A2(
						$elm$core$Result$andThen,
						function (conditionValue) {
							if ((conditionValue.$ === 'Literal') && (conditionValue.b.$ === 'BoolLiteral')) {
								var conditionTrue = conditionValue.b.a;
								var branchToFollow = conditionTrue ? thenBranch : elseBranch;
								return A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, branchToFollow);
							} else {
								return $elm$core$Result$Err(
									A2($author$project$Morphir$Value$Error$IfThenElseConditionShouldEvaluateToBool, condition, conditionValue));
							}
						},
						A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, condition));
				case 'PatternMatch':
					var subjectValue = value.b;
					var cases = value.c;
					var findMatch = F2(
						function (remainingCases, evaluatedSubject) {
							findMatch:
							while (true) {
								if (remainingCases.b) {
									var _v13 = remainingCases.a;
									var nextPattern = _v13.a;
									var nextBody = _v13.b;
									var restOfCases = remainingCases.b;
									var _v14 = A2($author$project$Morphir$Value$Interpreter$matchPattern, nextPattern, evaluatedSubject);
									if (_v14.$ === 'Ok') {
										var patternVariables = _v14.a;
										return A5(
											$author$project$Morphir$Value$Interpreter$evaluateValue,
											nativeFunctions,
											ir,
											A2($elm$core$Dict$union, patternVariables, variables),
											_List_Nil,
											nextBody);
									} else {
										var $temp$remainingCases = restOfCases,
											$temp$evaluatedSubject = evaluatedSubject;
										remainingCases = $temp$remainingCases;
										evaluatedSubject = $temp$evaluatedSubject;
										continue findMatch;
									}
								} else {
									return $elm$core$Result$Err(
										A2(
											$author$project$Morphir$Value$Error$NoPatternsMatch,
											evaluatedSubject,
											A2($elm$core$List$map, $elm$core$Tuple$first, cases)));
								}
							}
						});
					return A2(
						$elm$core$Result$andThen,
						findMatch(cases),
						A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, subjectValue));
				case 'UpdateRecord':
					var subjectValue = value.b;
					var fieldUpdates = value.c;
					return A2(
						$elm$core$Result$andThen,
						function (evaluatedSubjectValue) {
							if (evaluatedSubjectValue.$ === 'Record') {
								var fields = evaluatedSubjectValue.b;
								return A2(
									$elm$core$Result$map,
									A2(
										$elm$core$Basics$composeR,
										$elm$core$Dict$toList,
										$author$project$Morphir$IR$Value$Record(_Utils_Tuple0)),
									A3(
										$elm$core$List$foldl,
										F2(
											function (_v16, fieldsResultSoFar) {
												var fieldName = _v16.a;
												var newFieldValue = _v16.b;
												return A2(
													$elm$core$Result$andThen,
													function (fieldsSoFar) {
														return A2(
															$elm$core$Result$andThen,
															function (_v17) {
																return A2(
																	$elm$core$Result$map,
																	function (evaluatedNewFieldValue) {
																		return A3($elm$core$Dict$insert, fieldName, evaluatedNewFieldValue, fieldsSoFar);
																	},
																	A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, newFieldValue));
															},
															A2(
																$elm$core$Result$fromMaybe,
																A2($author$project$Morphir$Value$Error$FieldNotFound, subjectValue, fieldName),
																A2($elm$core$Dict$get, fieldName, fieldsSoFar)));
													},
													fieldsResultSoFar);
											}),
										$elm$core$Result$Ok(
											$elm$core$Dict$fromList(fields)),
										fieldUpdates));
							} else {
								return $elm$core$Result$Err(
									A2($author$project$Morphir$Value$Error$RecordExpected, subjectValue, evaluatedSubjectValue));
							}
						},
						A5($author$project$Morphir$Value$Interpreter$evaluateValue, nativeFunctions, ir, variables, _List_Nil, subjectValue));
				default:
					return $elm$core$Result$Ok(value);
			}
		}
	});
var $elm$core$Debug$log = _Debug_log;
var $elm$core$Debug$toString = _Debug_toString;
var $author$project$Morphir$Visual$Config$evaluate = F2(
	function (value, config) {
		return A2(
			$elm$core$Result$mapError,
			function (error) {
				return $elm$core$Debug$toString(
					A2(
						$elm$core$Debug$log,
						$elm$core$String$concat(
							_List_fromArray(
								[
									'Error while evaluating \'',
									$elm$core$Debug$toString(value),
									'\''
								])),
						error));
			},
			A5(
				$author$project$Morphir$Value$Interpreter$evaluateValue,
				config.irContext.nativeFunctions,
				$author$project$Morphir$IR$fromDistribution(config.irContext.distribution),
				config.state.variables,
				_List_Nil,
				value));
	});
var $mdgriffith$elm_ui$Internal$Model$Fill = function (a) {
	return {$: 'Fill', a: a};
};
var $mdgriffith$elm_ui$Element$fill = $mdgriffith$elm_ui$Internal$Model$Fill(1);
var $author$project$Morphir$Visual$Components$AritmeticExpressions$Add = {$: 'Add'};
var $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticDivisionBranch = function (a) {
	return {$: 'ArithmeticDivisionBranch', a: a};
};
var $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch = F2(
	function (a, b) {
		return {$: 'ArithmeticOperatorBranch', a: a, b: b};
	});
var $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf = function (a) {
	return {$: 'ArithmeticValueLeaf', a: a};
};
var $author$project$Morphir$Visual$Components$AritmeticExpressions$Multiply = {$: 'Multiply'};
var $author$project$Morphir$Visual$Components$AritmeticExpressions$Subtract = {$: 'Subtract'};
var $author$project$Morphir$Visual$Components$AritmeticExpressions$functionName = F2(
	function (moduleName, localName) {
		return A2(
			$elm$core$String$join,
			'.',
			_List_fromArray(
				[
					A3($author$project$Morphir$IR$Path$toString, $author$project$Morphir$IR$Name$toTitleCase, '.', moduleName),
					$author$project$Morphir$IR$Name$toCamelCase(localName)
				]));
	});
var $author$project$Morphir$IR$Value$uncurryApply = F2(
	function (fun, lastArg) {
		if (fun.$ === 'Apply') {
			var nestedFun = fun.b;
			var nestedArg = fun.c;
			var _v1 = A2($author$project$Morphir$IR$Value$uncurryApply, nestedFun, nestedArg);
			var f = _v1.a;
			var initArgs = _v1.b;
			return _Utils_Tuple2(
				f,
				A2(
					$elm$core$List$append,
					initArgs,
					_List_fromArray(
						[lastArg])));
		} else {
			return _Utils_Tuple2(
				fun,
				_List_fromArray(
					[lastArg]));
		}
	});
var $author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion = F2(
	function (value, operatorName) {
		if (value.$ === 'Apply') {
			var fun = value.b;
			var arg = value.c;
			var _v1 = A2($author$project$Morphir$IR$Value$uncurryApply, fun, arg);
			var _function = _v1.a;
			var args = _v1.b;
			var _v2 = _Utils_Tuple2(_function, args);
			if ((((_v2.a.$ === 'Reference') && _v2.b.b) && _v2.b.b.b) && (!_v2.b.b.b.b)) {
				var _v3 = _v2.a;
				var _v4 = _v3.b;
				var moduleName = _v4.b;
				var localName = _v4.c;
				var _v5 = _v2.b;
				var arg1 = _v5.a;
				var _v6 = _v5.b;
				var arg2 = _v6.a;
				var _v7 = A2($author$project$Morphir$Visual$Components$AritmeticExpressions$functionName, moduleName, localName);
				switch (_v7) {
					case 'Basics.add':
						return _List_fromArray(
							[
								A2(
								$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch,
								$author$project$Morphir$Visual$Components$AritmeticExpressions$Add,
								_Utils_ap(
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg1, operatorName),
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)))
							]);
					case 'Basics.subtract':
						return _List_fromArray(
							[
								A2(
								$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch,
								$author$project$Morphir$Visual$Components$AritmeticExpressions$Subtract,
								_Utils_ap(
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg1, operatorName),
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)))
							]);
					case 'Basics.multiply':
						return _List_fromArray(
							[
								A2(
								$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch,
								$author$project$Morphir$Visual$Components$AritmeticExpressions$Multiply,
								_Utils_ap(
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg1, operatorName),
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)))
							]);
					case 'Basics.divide':
						return _List_fromArray(
							[
								$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticDivisionBranch(
								_Utils_ap(
									_List_fromArray(
										[
											$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(arg1)
										]),
									A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)))
							]);
					default:
						return _List_fromArray(
							[
								$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(value)
							]);
				}
			} else {
				return _List_fromArray(
					[
						$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(value)
					]);
			}
		} else {
			return _List_fromArray(
				[
					$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(value)
				]);
		}
	});
var $author$project$Morphir$Visual$Components$AritmeticExpressions$fromArithmeticTypedValue = function (typedValue) {
	if (typedValue.$ === 'Apply') {
		var fun = typedValue.b;
		var arg = typedValue.c;
		var _v1 = A2($author$project$Morphir$IR$Value$uncurryApply, fun, arg);
		var _function = _v1.a;
		var args = _v1.b;
		var _v2 = _Utils_Tuple2(_function, args);
		if ((((_v2.a.$ === 'Reference') && _v2.b.b) && _v2.b.b.b) && (!_v2.b.b.b.b)) {
			var _v3 = _v2.a;
			var _v4 = _v3.b;
			var moduleName = _v4.b;
			var localName = _v4.c;
			var _v5 = _v2.b;
			var arg1 = _v5.a;
			var _v6 = _v5.b;
			var arg2 = _v6.a;
			var operatorName = A2($author$project$Morphir$Visual$Components$AritmeticExpressions$functionName, moduleName, localName);
			switch (operatorName) {
				case 'Basics.add':
					return A2(
						$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch,
						$author$project$Morphir$Visual$Components$AritmeticExpressions$Add,
						_Utils_ap(
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg1, operatorName),
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)));
				case 'Basics.subtract':
					return A2(
						$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch,
						$author$project$Morphir$Visual$Components$AritmeticExpressions$Subtract,
						_Utils_ap(
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg1, operatorName),
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)));
				case 'Basics.divide':
					return $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticDivisionBranch(
						_Utils_ap(
							_List_fromArray(
								[
									$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(arg1)
								]),
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)));
				case 'Basics.multiply':
					return A2(
						$author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticOperatorBranch,
						$author$project$Morphir$Visual$Components$AritmeticExpressions$Multiply,
						_Utils_ap(
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg1, operatorName),
							A2($author$project$Morphir$Visual$Components$AritmeticExpressions$helperArithmeticTreeBuilderRecursion, arg2, operatorName)));
				default:
					return $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(typedValue);
			}
		} else {
			return $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(typedValue);
		}
	} else {
		return $author$project$Morphir$Visual$Components$AritmeticExpressions$ArithmeticValueLeaf(typedValue);
	}
};
var $author$project$Morphir$Visual$BoolOperatorTree$And = {$: 'And'};
var $author$project$Morphir$Visual$BoolOperatorTree$BoolOperatorBranch = F2(
	function (a, b) {
		return {$: 'BoolOperatorBranch', a: a, b: b};
	});
var $author$project$Morphir$Visual$BoolOperatorTree$BoolValueLeaf = function (a) {
	return {$: 'BoolValueLeaf', a: a};
};
var $author$project$Morphir$Visual$BoolOperatorTree$Or = {$: 'Or'};
var $author$project$Morphir$Visual$BoolOperatorTree$functionName = F2(
	function (moduleName, localName) {
		return A2(
			$elm$core$String$join,
			'.',
			_List_fromArray(
				[
					A3($author$project$Morphir$IR$Path$toString, $author$project$Morphir$IR$Name$toTitleCase, '.', moduleName),
					$author$project$Morphir$IR$Name$toCamelCase(localName)
				]));
	});
var $author$project$Morphir$Visual$BoolOperatorTree$fromTypedValue = function (typedValue) {
	if (typedValue.$ === 'Apply') {
		var fun = typedValue.b;
		var arg = typedValue.c;
		var _v8 = A2($author$project$Morphir$IR$Value$uncurryApply, fun, arg);
		var _function = _v8.a;
		var args = _v8.b;
		var _v9 = _Utils_Tuple2(_function, args);
		if ((((_v9.a.$ === 'Reference') && _v9.b.b) && _v9.b.b.b) && (!_v9.b.b.b.b)) {
			var _v10 = _v9.a;
			var _v11 = _v10.b;
			var moduleName = _v11.b;
			var localName = _v11.c;
			var _v12 = _v9.b;
			var arg1 = _v12.a;
			var _v13 = _v12.b;
			var arg2 = _v13.a;
			var operatorName = A2($author$project$Morphir$Visual$BoolOperatorTree$functionName, moduleName, localName);
			switch (operatorName) {
				case 'Basics.or':
					return A2(
						$author$project$Morphir$Visual$BoolOperatorTree$BoolOperatorBranch,
						$author$project$Morphir$Visual$BoolOperatorTree$Or,
						A2($author$project$Morphir$Visual$BoolOperatorTree$helperFunction, typedValue, operatorName));
				case 'Basics.and':
					return A2(
						$author$project$Morphir$Visual$BoolOperatorTree$BoolOperatorBranch,
						$author$project$Morphir$Visual$BoolOperatorTree$And,
						A2($author$project$Morphir$Visual$BoolOperatorTree$helperFunction, typedValue, operatorName));
				default:
					return $author$project$Morphir$Visual$BoolOperatorTree$BoolValueLeaf(typedValue);
			}
		} else {
			return $author$project$Morphir$Visual$BoolOperatorTree$BoolValueLeaf(typedValue);
		}
	} else {
		return $author$project$Morphir$Visual$BoolOperatorTree$BoolValueLeaf(typedValue);
	}
};
var $author$project$Morphir$Visual$BoolOperatorTree$helperFunction = F2(
	function (value, operatorName) {
		if (value.$ === 'Apply') {
			var fun = value.b;
			var arg = value.c;
			var _v1 = A2($author$project$Morphir$IR$Value$uncurryApply, fun, arg);
			var _function = _v1.a;
			var args = _v1.b;
			var _v2 = _Utils_Tuple2(_function, args);
			if ((((_v2.a.$ === 'Reference') && _v2.b.b) && _v2.b.b.b) && (!_v2.b.b.b.b)) {
				var _v3 = _v2.a;
				var _v4 = _v3.b;
				var moduleName = _v4.b;
				var localName = _v4.c;
				var _v5 = _v2.b;
				var arg1 = _v5.a;
				var _v6 = _v5.b;
				var arg2 = _v6.a;
				return _Utils_eq(
					A2($author$project$Morphir$Visual$BoolOperatorTree$functionName, moduleName, localName),
					operatorName) ? _Utils_ap(
					A2($author$project$Morphir$Visual$BoolOperatorTree$helperFunction, arg1, operatorName),
					A2($author$project$Morphir$Visual$BoolOperatorTree$helperFunction, arg2, operatorName)) : _List_fromArray(
					[
						$author$project$Morphir$Visual$BoolOperatorTree$fromTypedValue(value)
					]);
			} else {
				return _List_fromArray(
					[
						$author$project$Morphir$Visual$BoolOperatorTree$BoolValueLeaf(value)
					]);
			}
		} else {
			return _List_fromArray(
				[
					$author$project$Morphir$Visual$BoolOperatorTree$BoolValueLeaf(value)
				]);
		}
	});
var $mdgriffith$elm_ui$Element$htmlAttribute = $mdgriffith$elm_ui$Internal$Model$Attr;
var $author$project$Morphir$IR$SDK$Basics$isNumber = function (tpe) {
	_v0$2:
	while (true) {
		if ((((((((((((((((((((((tpe.$ === 'Reference') && tpe.b.a.b) && tpe.b.a.a.b) && (tpe.b.a.a.a === 'morphir')) && (!tpe.b.a.a.b.b)) && tpe.b.a.b.b) && tpe.b.a.b.a.b) && (tpe.b.a.b.a.a === 's')) && tpe.b.a.b.a.b.b) && (tpe.b.a.b.a.b.a === 'd')) && tpe.b.a.b.a.b.b.b) && (tpe.b.a.b.a.b.b.a === 'k')) && (!tpe.b.a.b.a.b.b.b.b)) && (!tpe.b.a.b.b.b)) && tpe.b.b.b) && tpe.b.b.a.b) && (tpe.b.b.a.a === 'basics')) && (!tpe.b.b.a.b.b)) && (!tpe.b.b.b.b)) && tpe.b.c.b) && (!tpe.b.c.b.b)) && (!tpe.c.b)) {
			switch (tpe.b.c.a) {
				case 'float':
					var _v1 = tpe.b;
					var _v2 = _v1.a;
					var _v3 = _v2.a;
					var _v4 = _v2.b;
					var _v5 = _v4.a;
					var _v6 = _v5.b;
					var _v7 = _v6.b;
					var _v8 = _v1.b;
					var _v9 = _v8.a;
					var _v10 = _v1.c;
					return true;
				case 'int':
					var _v11 = tpe.b;
					var _v12 = _v11.a;
					var _v13 = _v12.a;
					var _v14 = _v12.b;
					var _v15 = _v14.a;
					var _v16 = _v15.b;
					var _v17 = _v16.b;
					var _v18 = _v11.b;
					var _v19 = _v18.a;
					var _v20 = _v11.c;
					return true;
				default:
					break _v0$2;
			}
		} else {
			break _v0$2;
		}
	}
	return false;
};
var $elm$html$Html$Events$onMouseEnter = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mouseenter',
		$elm$json$Json$Decode$succeed(msg));
};
var $mdgriffith$elm_ui$Element$Events$onMouseEnter = A2($elm$core$Basics$composeL, $mdgriffith$elm_ui$Internal$Model$Attr, $elm$html$Html$Events$onMouseEnter);
var $elm$html$Html$Events$onMouseLeave = function (msg) {
	return A2(
		$elm$html$Html$Events$on,
		'mouseleave',
		$elm$json$Json$Decode$succeed(msg));
};
var $mdgriffith$elm_ui$Element$Events$onMouseLeave = A2($elm$core$Basics$composeL, $mdgriffith$elm_ui$Internal$Model$Attr, $elm$html$Html$Events$onMouseLeave);
var $author$project$Morphir$Type$MetaType$variableByIndex = function (i) {
	return _Utils_Tuple3(_List_Nil, i, 0);
};
var $author$project$Morphir$Type$Infer$annotateValue = F2(
	function (baseIndex, untypedValue) {
		return A3(
			$author$project$Morphir$IR$Value$indexedMapValue,
			F2(
				function (index, va) {
					return _Utils_Tuple2(
						va,
						$author$project$Morphir$Type$MetaType$variableByIndex(index));
				}),
			baseIndex,
			untypedValue);
	});
var $author$project$Morphir$IR$SDK$Basics$floatType = function (attributes) {
	return A3(
		$author$project$Morphir$IR$Type$Reference,
		attributes,
		A2($author$project$Morphir$IR$SDK$Common$toFQName, $author$project$Morphir$IR$SDK$Basics$moduleName, 'Float'),
		_List_Nil);
};
var $author$project$Morphir$IR$resolveType = F2(
	function (tpe, ir) {
		switch (tpe.$) {
			case 'Variable':
				var a = tpe.a;
				var name = tpe.b;
				return A2($author$project$Morphir$IR$Type$Variable, a, name);
			case 'Reference':
				var fQName = tpe.b;
				var typeParams = tpe.c;
				return A2(
					$elm$core$Maybe$withDefault,
					tpe,
					A2(
						$elm$core$Maybe$map,
						function (typeSpec) {
							if (typeSpec.$ === 'TypeAliasSpecification') {
								var typeParamNames = typeSpec.a;
								var targetType = typeSpec.b;
								return A2(
									$author$project$Morphir$IR$Type$substituteTypeVariables,
									$elm$core$Dict$fromList(
										A3($elm$core$List$map2, $elm$core$Tuple$pair, typeParamNames, typeParams)),
									targetType);
							} else {
								return tpe;
							}
						},
						A2($author$project$Morphir$IR$lookupTypeSpecification, fQName, ir)));
			case 'Tuple':
				var a = tpe.a;
				var elemTypes = tpe.b;
				return A2(
					$author$project$Morphir$IR$Type$Tuple,
					a,
					A2(
						$elm$core$List$map,
						function (t) {
							return A2($author$project$Morphir$IR$resolveType, t, ir);
						},
						elemTypes));
			case 'Record':
				var a = tpe.a;
				var fields = tpe.b;
				return A2(
					$author$project$Morphir$IR$Type$Record,
					a,
					A2(
						$elm$core$List$map,
						function (f) {
							return _Utils_update(
								f,
								{
									tpe: A2($author$project$Morphir$IR$resolveType, f.tpe, ir)
								});
						},
						fields));
			case 'ExtensibleRecord':
				var a = tpe.a;
				var varName = tpe.b;
				var fields = tpe.c;
				return A3(
					$author$project$Morphir$IR$Type$ExtensibleRecord,
					a,
					varName,
					A2(
						$elm$core$List$map,
						function (f) {
							return _Utils_update(
								f,
								{
									tpe: A2($author$project$Morphir$IR$resolveType, f.tpe, ir)
								});
						},
						fields));
			case 'Function':
				var a = tpe.a;
				var argType = tpe.b;
				var returnType = tpe.c;
				return A3(
					$author$project$Morphir$IR$Type$Function,
					a,
					A2($author$project$Morphir$IR$resolveType, argType, ir),
					A2($author$project$Morphir$IR$resolveType, returnType, ir));
			default:
				var a = tpe.a;
				return $author$project$Morphir$IR$Type$Unit(a);
		}
	});
var $author$project$Morphir$IR$Value$rewriteValue = F2(
	function (f, value) {
		var _v0 = f(value);
		if (_v0.$ === 'Just') {
			var newValue = _v0.a;
			return newValue;
		} else {
			switch (value.$) {
				case 'Tuple':
					var va = value.a;
					var elems = value.b;
					return A2(
						$author$project$Morphir$IR$Value$Tuple,
						va,
						A2(
							$elm$core$List$map,
							$author$project$Morphir$IR$Value$rewriteValue(f),
							elems));
				case 'List':
					var va = value.a;
					var items = value.b;
					return A2(
						$author$project$Morphir$IR$Value$List,
						va,
						A2(
							$elm$core$List$map,
							$author$project$Morphir$IR$Value$rewriteValue(f),
							items));
				case 'Record':
					var va = value.a;
					var fields = value.b;
					return A2(
						$author$project$Morphir$IR$Value$Record,
						va,
						A2(
							$elm$core$List$map,
							function (_v2) {
								var n = _v2.a;
								var v = _v2.b;
								return _Utils_Tuple2(
									n,
									A2($author$project$Morphir$IR$Value$rewriteValue, f, v));
							},
							fields));
				case 'Field':
					var va = value.a;
					var subject = value.b;
					var name = value.c;
					return A3(
						$author$project$Morphir$IR$Value$Field,
						va,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, subject),
						name);
				case 'Apply':
					var va = value.a;
					var fun = value.b;
					var arg = value.c;
					return A3(
						$author$project$Morphir$IR$Value$Apply,
						va,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, fun),
						A2($author$project$Morphir$IR$Value$rewriteValue, f, arg));
				case 'Lambda':
					var va = value.a;
					var pattern = value.b;
					var body = value.c;
					return A3(
						$author$project$Morphir$IR$Value$Lambda,
						va,
						pattern,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, body));
				case 'LetDefinition':
					var va = value.a;
					var defName = value.b;
					var def = value.c;
					var inValue = value.d;
					return A4(
						$author$project$Morphir$IR$Value$LetDefinition,
						va,
						defName,
						_Utils_update(
							def,
							{
								body: A2($author$project$Morphir$IR$Value$rewriteValue, f, def.body)
							}),
						A2($author$project$Morphir$IR$Value$rewriteValue, f, inValue));
				case 'LetRecursion':
					var va = value.a;
					var defs = value.b;
					var inValue = value.c;
					return A3(
						$author$project$Morphir$IR$Value$LetRecursion,
						va,
						A2(
							$elm$core$Dict$map,
							F2(
								function (_v3, def) {
									return _Utils_update(
										def,
										{
											body: A2($author$project$Morphir$IR$Value$rewriteValue, f, def.body)
										});
								}),
							defs),
						A2($author$project$Morphir$IR$Value$rewriteValue, f, inValue));
				case 'Destructure':
					var va = value.a;
					var bindPattern = value.b;
					var bindValue = value.c;
					var inValue = value.d;
					return A4(
						$author$project$Morphir$IR$Value$Destructure,
						va,
						bindPattern,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, bindValue),
						A2($author$project$Morphir$IR$Value$rewriteValue, f, inValue));
				case 'IfThenElse':
					var va = value.a;
					var condition = value.b;
					var thenBranch = value.c;
					var elseBranch = value.d;
					return A4(
						$author$project$Morphir$IR$Value$IfThenElse,
						va,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, condition),
						A2($author$project$Morphir$IR$Value$rewriteValue, f, thenBranch),
						A2($author$project$Morphir$IR$Value$rewriteValue, f, elseBranch));
				case 'PatternMatch':
					var va = value.a;
					var subject = value.b;
					var cases = value.c;
					return A3(
						$author$project$Morphir$IR$Value$PatternMatch,
						va,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, subject),
						A2(
							$elm$core$List$map,
							function (_v4) {
								var p = _v4.a;
								var v = _v4.b;
								return _Utils_Tuple2(
									p,
									A2($author$project$Morphir$IR$Value$rewriteValue, f, v));
							},
							cases));
				case 'UpdateRecord':
					var va = value.a;
					var subject = value.b;
					var fields = value.c;
					return A3(
						$author$project$Morphir$IR$Value$UpdateRecord,
						va,
						A2($author$project$Morphir$IR$Value$rewriteValue, f, subject),
						A2(
							$elm$core$List$map,
							function (_v5) {
								var n = _v5.a;
								var v = _v5.b;
								return _Utils_Tuple2(
									n,
									A2($author$project$Morphir$IR$Value$rewriteValue, f, v));
							},
							fields));
				default:
					return value;
			}
		}
	});
var $author$project$Morphir$Type$Infer$fixNumberLiterals = F2(
	function (ir, typedValue) {
		return A2(
			$author$project$Morphir$IR$Value$rewriteValue,
			function (value) {
				if ((value.$ === 'Literal') && (value.b.$ === 'IntLiteral')) {
					var _v1 = value.a;
					var va = _v1.a;
					var tpe = _v1.b;
					var v = value.b.a;
					return _Utils_eq(
						A2($author$project$Morphir$IR$resolveType, tpe, ir),
						$author$project$Morphir$IR$SDK$Basics$floatType(_Utils_Tuple0)) ? $elm$core$Maybe$Just(
						A2(
							$author$project$Morphir$IR$Value$Literal,
							_Utils_Tuple2(va, tpe),
							$author$project$Morphir$IR$Literal$FloatLiteral(v))) : $elm$core$Maybe$Nothing;
				} else {
					return $elm$core$Maybe$Nothing;
				}
			},
			typedValue);
	});
var $author$project$Morphir$Type$Solve$get = F2(
	function (_var, _v0) {
		var dict = _v0.a;
		return A2($elm$core$Dict$get, _var, dict);
	});
var $author$project$Morphir$Type$MetaType$toName = function (_v0) {
	var n = _v0.a;
	var i = _v0.b;
	var s = _v0.c;
	return $elm$core$List$isEmpty(n) ? _List_fromArray(
		[
			't',
			$elm$core$String$fromInt(i),
			$elm$core$String$fromInt(s)
		]) : (((i > 0) || (s > 0)) ? _Utils_ap(
		n,
		_List_fromArray(
			[
				$elm$core$String$fromInt(i),
				$elm$core$String$fromInt(s)
			])) : n);
};
var $author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType = F2(
	function (solutionMap, metaType) {
		switch (metaType.$) {
			case 'MetaVar':
				var metaVar = metaType.a;
				return A2(
					$elm$core$Maybe$withDefault,
					A2(
						$author$project$Morphir$IR$Type$Variable,
						_Utils_Tuple0,
						$author$project$Morphir$Type$MetaType$toName(metaVar)),
					A2(
						$elm$core$Maybe$map,
						$author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType(solutionMap),
						A2($author$project$Morphir$Type$Solve$get, metaVar, solutionMap)));
			case 'MetaTuple':
				var metaElems = metaType.b;
				return A2(
					$author$project$Morphir$IR$Type$Tuple,
					_Utils_Tuple0,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType(solutionMap),
						metaElems));
			case 'MetaRecord':
				var _extends = metaType.b;
				var metaFields = metaType.c;
				if (_extends.$ === 'Nothing') {
					return A2(
						$author$project$Morphir$IR$Type$Record,
						_Utils_Tuple0,
						A2(
							$elm$core$List$map,
							function (_v2) {
								var fieldName = _v2.a;
								var fieldType = _v2.b;
								return A2(
									$author$project$Morphir$IR$Type$Field,
									fieldName,
									A2($author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType, solutionMap, fieldType));
							},
							$elm$core$Dict$toList(metaFields)));
				} else {
					var baseType = _extends.a;
					return A3(
						$author$project$Morphir$IR$Type$ExtensibleRecord,
						_Utils_Tuple0,
						$author$project$Morphir$Type$MetaType$toName(baseType),
						A2(
							$elm$core$List$map,
							function (_v3) {
								var fieldName = _v3.a;
								var fieldType = _v3.b;
								return A2(
									$author$project$Morphir$IR$Type$Field,
									fieldName,
									A2($author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType, solutionMap, fieldType));
							},
							$elm$core$Dict$toList(metaFields)));
				}
			case 'MetaFun':
				var argType = metaType.b;
				var returnType = metaType.c;
				return A3(
					$author$project$Morphir$IR$Type$Function,
					_Utils_Tuple0,
					A2($author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType, solutionMap, argType),
					A2($author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType, solutionMap, returnType));
			case 'MetaRef':
				var fQName = metaType.b;
				var args = metaType.c;
				return A3(
					$author$project$Morphir$IR$Type$Reference,
					_Utils_Tuple0,
					fQName,
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType(solutionMap),
						args));
			default:
				return $author$project$Morphir$IR$Type$Unit(_Utils_Tuple0);
		}
	});
var $author$project$Morphir$Type$Infer$applySolutionToAnnotatedValue = F3(
	function (ir, annotatedValue, _v0) {
		var residualConstraints = _v0.a;
		var solutionMap = _v0.b;
		return A2(
			$author$project$Morphir$Type$Infer$fixNumberLiterals,
			ir,
			A3(
				$author$project$Morphir$IR$Value$mapValueAttributes,
				$elm$core$Basics$identity,
				function (_v1) {
					var va = _v1.a;
					var metaVar = _v1.b;
					return _Utils_Tuple2(
						va,
						A2(
							$elm$core$Maybe$withDefault,
							A2(
								$author$project$Morphir$IR$Type$Variable,
								_Utils_Tuple0,
								$author$project$Morphir$Type$MetaType$toName(metaVar)),
							A2(
								$elm$core$Maybe$map,
								$author$project$Morphir$Type$MetaTypeMapping$metaTypeToConcreteType(solutionMap),
								A2($author$project$Morphir$Type$Solve$get, metaVar, solutionMap))));
				},
				annotatedValue));
	});
var $author$project$Morphir$IR$FQName$fqn = F3(
	function (packageName, moduleName, localName) {
		return A3(
			$author$project$Morphir$IR$FQName$fQName,
			$author$project$Morphir$IR$Path$fromString(packageName),
			$author$project$Morphir$IR$Path$fromString(moduleName),
			$author$project$Morphir$IR$Name$fromString(localName));
	});
var $author$project$Morphir$Type$MetaType$MetaRef = F4(
	function (a, b, c, d) {
		return {$: 'MetaRef', a: a, b: b, c: c, d: d};
	});
var $elm$core$Set$union = F2(
	function (_v0, _v1) {
		var dict1 = _v0.a;
		var dict2 = _v1.a;
		return $elm$core$Set$Set_elm_builtin(
			A2($elm$core$Dict$union, dict1, dict2));
	});
var $elm$core$Dict$singleton = F2(
	function (key, value) {
		return A5($elm$core$Dict$RBNode_elm_builtin, $elm$core$Dict$Black, key, value, $elm$core$Dict$RBEmpty_elm_builtin, $elm$core$Dict$RBEmpty_elm_builtin);
	});
var $elm$core$Set$singleton = function (key) {
	return $elm$core$Set$Set_elm_builtin(
		A2($elm$core$Dict$singleton, key, _Utils_Tuple0));
};
var $author$project$Morphir$Type$MetaType$variables = function (metaType) {
	switch (metaType.$) {
		case 'MetaVar':
			var variable = metaType.a;
			return $elm$core$Set$singleton(variable);
		case 'MetaRef':
			var vars = metaType.a;
			return vars;
		case 'MetaTuple':
			var vars = metaType.a;
			return vars;
		case 'MetaRecord':
			var vars = metaType.a;
			return vars;
		case 'MetaFun':
			var vars = metaType.a;
			return vars;
		default:
			return $elm$core$Set$empty;
	}
};
var $author$project$Morphir$Type$MetaType$metaRef = F2(
	function (fQName, args) {
		var vars = A3(
			$elm$core$List$foldl,
			$elm$core$Set$union,
			$elm$core$Set$empty,
			A2($elm$core$List$map, $author$project$Morphir$Type$MetaType$variables, args));
		return A4($author$project$Morphir$Type$MetaType$MetaRef, vars, fQName, args, $elm$core$Maybe$Nothing);
	});
var $author$project$Morphir$Type$MetaType$boolType = A2(
	$author$project$Morphir$Type$MetaType$metaRef,
	A3($author$project$Morphir$IR$FQName$fqn, 'Morphir.SDK', 'Basics', 'Bool'),
	_List_Nil);
var $author$project$Morphir$IR$Type$collectVariables = function (tpe) {
	var collectUnion = function (values) {
		return A3(
			$elm$core$List$foldl,
			$elm$core$Set$union,
			$elm$core$Set$empty,
			A2($elm$core$List$map, $author$project$Morphir$IR$Type$collectVariables, values));
	};
	switch (tpe.$) {
		case 'Variable':
			var name = tpe.b;
			return $elm$core$Set$singleton(name);
		case 'Reference':
			var args = tpe.c;
			return collectUnion(args);
		case 'Tuple':
			var elements = tpe.b;
			return collectUnion(elements);
		case 'Record':
			var fields = tpe.b;
			return collectUnion(
				A2(
					$elm$core$List$map,
					function ($) {
						return $.tpe;
					},
					fields));
		case 'ExtensibleRecord':
			var subjectName = tpe.b;
			var fields = tpe.c;
			return A2(
				$elm$core$Set$insert,
				subjectName,
				collectUnion(
					A2(
						$elm$core$List$map,
						function ($) {
							return $.tpe;
						},
						fields)));
		case 'Function':
			var argType = tpe.b;
			var returnType = tpe.c;
			return collectUnion(
				_List_fromArray(
					[argType, returnType]));
		default:
			return $elm$core$Set$empty;
	}
};
var $author$project$Morphir$Type$ConstraintSet$ConstraintSet = function (a) {
	return {$: 'ConstraintSet', a: a};
};
var $author$project$Morphir$Type$ConstraintSet$empty = $author$project$Morphir$Type$ConstraintSet$ConstraintSet(_List_Nil);
var $author$project$Morphir$Type$Constraint$isTrivial = function (constraint) {
	if (constraint.$ === 'Equality') {
		var metaType1 = constraint.a;
		var metaType2 = constraint.b;
		return _Utils_eq(metaType1, metaType2);
	} else {
		return false;
	}
};
var $author$project$Morphir$Type$Constraint$equivalent = F2(
	function (constraint1, constraint2) {
		if (_Utils_eq(constraint1, constraint2)) {
			return true;
		} else {
			var _v0 = _Utils_Tuple2(constraint1, constraint2);
			if ((_v0.a.$ === 'Equality') && (_v0.b.$ === 'Equality')) {
				var _v1 = _v0.a;
				var a1 = _v1.a;
				var a2 = _v1.b;
				var _v2 = _v0.b;
				var b1 = _v2.a;
				var b2 = _v2.b;
				return (_Utils_eq(a1, b1) && _Utils_eq(a2, b2)) || (_Utils_eq(a1, b2) && _Utils_eq(a2, b1));
			} else {
				return false;
			}
		}
	});
var $author$project$Morphir$Type$ConstraintSet$member = F2(
	function (constraint, _v0) {
		var constraints = _v0.a;
		return A2(
			$elm$core$List$any,
			$author$project$Morphir$Type$Constraint$equivalent(constraint),
			constraints);
	});
var $author$project$Morphir$Type$ConstraintSet$insert = F2(
	function (constraint, constraintSet) {
		var constraints = constraintSet.a;
		return ($author$project$Morphir$Type$Constraint$isTrivial(constraint) || A2($author$project$Morphir$Type$ConstraintSet$member, constraint, constraintSet)) ? constraintSet : $author$project$Morphir$Type$ConstraintSet$ConstraintSet(
			A2($elm$core$List$cons, constraint, constraints));
	});
var $author$project$Morphir$Type$ConstraintSet$union = F2(
	function (constraintSet1, _v0) {
		var constraints2 = _v0.a;
		return A3($elm$core$List$foldl, $author$project$Morphir$Type$ConstraintSet$insert, constraintSet1, constraints2);
	});
var $author$project$Morphir$Type$ConstraintSet$concat = function (constraintSets) {
	return A3($elm$core$List$foldl, $author$project$Morphir$Type$ConstraintSet$union, $author$project$Morphir$Type$ConstraintSet$empty, constraintSets);
};
var $author$project$Morphir$Type$MetaTypeMapping$CouldNotFindAlias = function (a) {
	return {$: 'CouldNotFindAlias', a: a};
};
var $author$project$Morphir$Type$MetaTypeMapping$ExpectedAlias = function (a) {
	return {$: 'ExpectedAlias', a: a};
};
var $author$project$Morphir$Type$MetaTypeMapping$lookupAliasedType = F3(
	function (ir, typeFQN, concreteTypeParams) {
		return A2(
			$elm$core$Result$andThen,
			function (typeSpec) {
				if (typeSpec.$ === 'TypeAliasSpecification') {
					var typeParamNames = typeSpec.a;
					var tpe = typeSpec.b;
					return $elm$core$Result$Ok(
						A2(
							$author$project$Morphir$IR$Type$substituteTypeVariables,
							$elm$core$Dict$fromList(
								A3($elm$core$List$map2, $elm$core$Tuple$pair, typeParamNames, concreteTypeParams)),
							tpe));
				} else {
					return $elm$core$Result$Err(
						$author$project$Morphir$Type$MetaTypeMapping$ExpectedAlias(typeFQN));
				}
			},
			A2(
				$elm$core$Result$fromMaybe,
				$author$project$Morphir$Type$MetaTypeMapping$CouldNotFindAlias(typeFQN),
				A2($author$project$Morphir$IR$lookupTypeSpecification, typeFQN, ir)));
	});
var $author$project$Morphir$Type$MetaType$metaAlias = F3(
	function (fQName, args, tpe) {
		var vars = A2(
			$elm$core$Set$union,
			$author$project$Morphir$Type$MetaType$variables(tpe),
			A3(
				$elm$core$List$foldl,
				$elm$core$Set$union,
				$elm$core$Set$empty,
				A2($elm$core$List$map, $author$project$Morphir$Type$MetaType$variables, args)));
		return A4(
			$author$project$Morphir$Type$MetaType$MetaRef,
			vars,
			fQName,
			args,
			$elm$core$Maybe$Just(tpe));
	});
var $author$project$Morphir$Type$MetaType$MetaFun = F3(
	function (a, b, c) {
		return {$: 'MetaFun', a: a, b: b, c: c};
	});
var $author$project$Morphir$Type$MetaType$metaFun = F2(
	function (arg, body) {
		var vars = A2(
			$elm$core$Set$union,
			$author$project$Morphir$Type$MetaType$variables(arg),
			$author$project$Morphir$Type$MetaType$variables(body));
		return A3($author$project$Morphir$Type$MetaType$MetaFun, vars, arg, body);
	});
var $author$project$Morphir$Type$MetaType$MetaRecord = F3(
	function (a, b, c) {
		return {$: 'MetaRecord', a: a, b: b, c: c};
	});
var $author$project$Morphir$Type$MetaType$metaRecord = F2(
	function (_extends, fields) {
		var fieldVars = A3(
			$elm$core$List$foldl,
			$elm$core$Set$union,
			$elm$core$Set$empty,
			A2(
				$elm$core$List$map,
				A2($elm$core$Basics$composeR, $elm$core$Tuple$second, $author$project$Morphir$Type$MetaType$variables),
				$elm$core$Dict$toList(fields)));
		var vars = A2(
			$elm$core$Maybe$withDefault,
			fieldVars,
			A2(
				$elm$core$Maybe$map,
				function (eVar) {
					return A2($elm$core$Set$insert, eVar, fieldVars);
				},
				_extends));
		return A3($author$project$Morphir$Type$MetaType$MetaRecord, vars, _extends, fields);
	});
var $author$project$Morphir$Type$MetaType$MetaTuple = F2(
	function (a, b) {
		return {$: 'MetaTuple', a: a, b: b};
	});
var $author$project$Morphir$Type$MetaType$metaTuple = function (elems) {
	var vars = A3(
		$elm$core$List$foldl,
		$elm$core$Set$union,
		$elm$core$Set$empty,
		A2($elm$core$List$map, $author$project$Morphir$Type$MetaType$variables, elems));
	return A2($author$project$Morphir$Type$MetaType$MetaTuple, vars, elems);
};
var $author$project$Morphir$Type$MetaType$MetaUnit = {$: 'MetaUnit'};
var $author$project$Morphir$Type$MetaType$metaUnit = $author$project$Morphir$Type$MetaType$MetaUnit;
var $author$project$Morphir$Type$MetaType$MetaVar = function (a) {
	return {$: 'MetaVar', a: a};
};
var $author$project$Morphir$Type$MetaType$metaVar = $author$project$Morphir$Type$MetaType$MetaVar;
var $elm$core$Result$withDefault = F2(
	function (def, result) {
		if (result.$ === 'Ok') {
			var a = result.a;
			return a;
		} else {
			return def;
		}
	});
var $author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType = F4(
	function (baseVar, ir, varToMeta, tpe) {
		switch (tpe.$) {
			case 'Variable':
				var varName = tpe.b;
				return $author$project$Morphir$Type$MetaType$metaVar(
					A2(
						$elm$core$Maybe$withDefault,
						baseVar,
						A2($elm$core$Dict$get, varName, varToMeta)));
			case 'Reference':
				var fQName = tpe.b;
				var args = tpe.c;
				var resolveAliases = F2(
					function (fqn, ars) {
						var metaArgs = A2(
							$elm$core$List$map,
							A3($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta),
							ars);
						return A2(
							$elm$core$Result$withDefault,
							A2($author$project$Morphir$Type$MetaType$metaRef, fqn, metaArgs),
							A2(
								$elm$core$Result$map,
								A2(
									$elm$core$Basics$composeR,
									A3($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta),
									A2($author$project$Morphir$Type$MetaType$metaAlias, fqn, metaArgs)),
								A3($author$project$Morphir$Type$MetaTypeMapping$lookupAliasedType, ir, fqn, ars)));
					});
				return A2(resolveAliases, fQName, args);
			case 'Tuple':
				var elemTypes = tpe.b;
				return $author$project$Morphir$Type$MetaType$metaTuple(
					A2(
						$elm$core$List$map,
						A3($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta),
						elemTypes));
			case 'Record':
				var fieldTypes = tpe.b;
				return A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					$elm$core$Maybe$Nothing,
					$elm$core$Dict$fromList(
						A2(
							$elm$core$List$map,
							function (field) {
								return _Utils_Tuple2(
									field.name,
									A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, field.tpe));
							},
							fieldTypes)));
			case 'ExtensibleRecord':
				var subjectName = tpe.b;
				var fieldTypes = tpe.c;
				return A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					A2($elm$core$Dict$get, subjectName, varToMeta),
					$elm$core$Dict$fromList(
						A2(
							$elm$core$List$map,
							function (field) {
								return _Utils_Tuple2(
									field.name,
									A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, field.tpe));
							},
							fieldTypes)));
			case 'Function':
				var argType = tpe.b;
				var returnType = tpe.c;
				return A2(
					$author$project$Morphir$Type$MetaType$metaFun,
					A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, argType),
					A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, returnType));
			default:
				return $author$project$Morphir$Type$MetaType$metaUnit;
		}
	});
var $author$project$Morphir$Type$Class$Number = {$: 'Number'};
var $author$project$Morphir$Type$MetaType$charType = A2(
	$author$project$Morphir$Type$MetaType$metaRef,
	A3($author$project$Morphir$IR$FQName$fqn, 'Morphir.SDK', 'Char', 'Char'),
	_List_Nil);
var $author$project$Morphir$Type$Constraint$Class = F2(
	function (a, b) {
		return {$: 'Class', a: a, b: b};
	});
var $author$project$Morphir$Type$Constraint$class = $author$project$Morphir$Type$Constraint$Class;
var $author$project$Morphir$Type$Constraint$Equality = F2(
	function (a, b) {
		return {$: 'Equality', a: a, b: b};
	});
var $author$project$Morphir$Type$Constraint$equality = $author$project$Morphir$Type$Constraint$Equality;
var $author$project$Morphir$Type$MetaType$floatType = A2(
	$author$project$Morphir$Type$MetaType$metaRef,
	A3($author$project$Morphir$IR$FQName$fqn, 'Morphir.SDK', 'Basics', 'Float'),
	_List_Nil);
var $author$project$Morphir$Type$ConstraintSet$singleton = function (constraint) {
	return $author$project$Morphir$Type$ConstraintSet$ConstraintSet(
		_List_fromArray(
			[constraint]));
};
var $author$project$Morphir$Type$MetaType$stringType = A2(
	$author$project$Morphir$Type$MetaType$metaRef,
	A3($author$project$Morphir$IR$FQName$fqn, 'Morphir.SDK', 'String', 'String'),
	_List_Nil);
var $author$project$Morphir$Type$Infer$constrainLiteral = F2(
	function (thisTypeVar, literalValue) {
		var expectExactType = function (expectedType) {
			return $author$project$Morphir$Type$ConstraintSet$singleton(
				A2(
					$author$project$Morphir$Type$Constraint$equality,
					$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
					expectedType));
		};
		switch (literalValue.$) {
			case 'BoolLiteral':
				return expectExactType($author$project$Morphir$Type$MetaType$boolType);
			case 'CharLiteral':
				return expectExactType($author$project$Morphir$Type$MetaType$charType);
			case 'StringLiteral':
				return expectExactType($author$project$Morphir$Type$MetaType$stringType);
			case 'IntLiteral':
				return $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$class,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						$author$project$Morphir$Type$Class$Number));
			default:
				return expectExactType($author$project$Morphir$Type$MetaType$floatType);
		}
	});
var $author$project$Morphir$Type$ConstraintSet$fromList = function (list) {
	return A3($elm$core$List$foldl, $author$project$Morphir$Type$ConstraintSet$insert, $author$project$Morphir$Type$ConstraintSet$empty, list);
};
var $author$project$Morphir$Type$MetaType$listType = function (itemType) {
	return A2(
		$author$project$Morphir$Type$MetaType$metaRef,
		A3($author$project$Morphir$IR$FQName$fqn, 'Morphir.SDK', 'List', 'List'),
		_List_fromArray(
			[itemType]));
};
var $author$project$Morphir$Type$MetaTypeMapping$CouldNotFindConstructor = function (a) {
	return {$: 'CouldNotFindConstructor', a: a};
};
var $author$project$Morphir$Type$MetaType$subVariable = function (_v0) {
	var n = _v0.a;
	var i = _v0.b;
	var s = _v0.c;
	return _Utils_Tuple3(n, i, s + 1);
};
var $author$project$Morphir$Type$MetaTypeMapping$concreteVarsToMetaVars = F2(
	function (baseVar, variables) {
		return A3(
			$elm$core$List$foldl,
			F2(
				function (varName, _v0) {
					var metaVarSoFar = _v0.a;
					var varToMetaSoFar = _v0.b;
					var nextVar = $author$project$Morphir$Type$MetaType$subVariable(metaVarSoFar);
					return _Utils_Tuple2(
						nextVar,
						A3($elm$core$Dict$insert, varName, nextVar, varToMetaSoFar));
				}),
			_Utils_Tuple2(baseVar, $elm$core$Dict$empty),
			$elm$core$Set$toList(variables)).b;
	});
var $elm$core$Set$fromList = function (list) {
	return A3($elm$core$List$foldl, $elm$core$Set$insert, $elm$core$Set$empty, list);
};
var $author$project$Morphir$Type$MetaTypeMapping$ctorToMetaType = F5(
	function (baseVar, ir, ctorFQName, paramNames, ctorArgs) {
		var argVariables = A3(
			$elm$core$List$foldl,
			$elm$core$Set$union,
			$elm$core$Set$empty,
			A2($elm$core$List$map, $author$project$Morphir$IR$Type$collectVariables, ctorArgs));
		var allVariables = A2(
			$elm$core$Set$union,
			argVariables,
			$elm$core$Set$fromList(paramNames));
		var varToMeta = A2($author$project$Morphir$Type$MetaTypeMapping$concreteVarsToMetaVars, baseVar, allVariables);
		var recurse = function (cargs) {
			if (!cargs.b) {
				return A2(
					$author$project$Morphir$Type$MetaType$metaRef,
					ctorFQName,
					A2(
						$elm$core$List$map,
						function (paramName) {
							return $author$project$Morphir$Type$MetaType$metaVar(
								A2(
									$elm$core$Maybe$withDefault,
									baseVar,
									A2($elm$core$Dict$get, paramName, varToMeta)));
						},
						paramNames));
			} else {
				var firstCtorArg = cargs.a;
				var restOfCtorArgs = cargs.b;
				return A2(
					$author$project$Morphir$Type$MetaType$metaFun,
					A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, firstCtorArg),
					recurse(restOfCtorArgs));
			}
		};
		return recurse(ctorArgs);
	});
var $author$project$Morphir$IR$lookupTypeConstructor = F2(
	function (fqn, ir) {
		return A2($elm$core$Dict$get, fqn, ir.typeConstructors);
	});
var $author$project$Morphir$Type$MetaTypeMapping$lookupConstructor = F3(
	function (baseVar, ir, ctorFQN) {
		return A2(
			$elm$core$Result$fromMaybe,
			$author$project$Morphir$Type$MetaTypeMapping$CouldNotFindConstructor(ctorFQN),
			A2(
				$elm$core$Maybe$map,
				function (_v0) {
					var typeFQN = _v0.a;
					var paramNames = _v0.b;
					var ctorArgs = _v0.c;
					return A5(
						$author$project$Morphir$Type$MetaTypeMapping$ctorToMetaType,
						baseVar,
						ir,
						typeFQN,
						paramNames,
						A2($elm$core$List$map, $elm$core$Tuple$second, ctorArgs));
				},
				A2($author$project$Morphir$IR$lookupTypeConstructor, ctorFQN, ir)));
	});
var $author$project$Morphir$IR$Value$patternAttribute = function (p) {
	switch (p.$) {
		case 'WildcardPattern':
			var a = p.a;
			return a;
		case 'AsPattern':
			var a = p.a;
			return a;
		case 'TuplePattern':
			var a = p.a;
			return a;
		case 'ConstructorPattern':
			var a = p.a;
			return a;
		case 'EmptyListPattern':
			var a = p.a;
			return a;
		case 'HeadTailPattern':
			var a = p.a;
			return a;
		case 'LiteralPattern':
			var a = p.a;
			return a;
		default:
			var a = p.a;
			return a;
	}
};
var $author$project$Morphir$Type$Infer$metaTypeVarForPattern = function (pattern) {
	return $author$project$Morphir$Type$MetaType$metaVar(
		$author$project$Morphir$IR$Value$patternAttribute(pattern).b);
};
var $author$project$Morphir$Type$Infer$constrainPattern = F2(
	function (ir, pattern) {
		switch (pattern.$) {
			case 'WildcardPattern':
				var _v1 = pattern.a;
				var va = _v1.a;
				var thisTypeVar = _v1.b;
				return _Utils_Tuple2($elm$core$Dict$empty, $author$project$Morphir$Type$ConstraintSet$empty);
			case 'AsPattern':
				var _v2 = pattern.a;
				var va = _v2.a;
				var thisTypeVar = _v2.b;
				var nestedPattern = pattern.b;
				var alias = pattern.c;
				var thisPatternConstraints = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						$author$project$Morphir$Type$Infer$metaTypeVarForPattern(nestedPattern)));
				var _v3 = A2($author$project$Morphir$Type$Infer$constrainPattern, ir, nestedPattern);
				var nestedVariables = _v3.a;
				var nestedConstraints = _v3.b;
				return _Utils_Tuple2(
					A3($elm$core$Dict$insert, alias, thisTypeVar, nestedVariables),
					A2($author$project$Morphir$Type$ConstraintSet$union, nestedConstraints, thisPatternConstraints));
			case 'TuplePattern':
				var _v4 = pattern.a;
				var va = _v4.a;
				var thisTypeVar = _v4.b;
				var elemPatterns = pattern.b;
				var tupleConstraint = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						$author$project$Morphir$Type$MetaType$metaTuple(
							A2($elm$core$List$map, $author$project$Morphir$Type$Infer$metaTypeVarForPattern, elemPatterns))));
				var _v5 = $elm$core$List$unzip(
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Type$Infer$constrainPattern(ir),
						elemPatterns));
				var elemsVariables = _v5.a;
				var elemsConstraints = _v5.b;
				return _Utils_Tuple2(
					A3($elm$core$List$foldl, $elm$core$Dict$union, $elm$core$Dict$empty, elemsVariables),
					$author$project$Morphir$Type$ConstraintSet$concat(
						A2($elm$core$List$cons, tupleConstraint, elemsConstraints)));
			case 'ConstructorPattern':
				var _v6 = pattern.a;
				var va = _v6.a;
				var thisTypeVar = _v6.b;
				var fQName = pattern.b;
				var argPatterns = pattern.c;
				var resultType = function (t) {
					resultType:
					while (true) {
						if (t.$ === 'MetaFun') {
							var a = t.b;
							var r = t.c;
							var $temp$t = r;
							t = $temp$t;
							continue resultType;
						} else {
							return t;
						}
					}
				};
				var ctorTypeVar = $author$project$Morphir$Type$MetaType$subVariable(thisTypeVar);
				var customTypeConstraint = A2(
					$elm$core$Result$withDefault,
					$author$project$Morphir$Type$ConstraintSet$empty,
					A2(
						$elm$core$Result$map,
						function (ctorFunType) {
							return $author$project$Morphir$Type$ConstraintSet$fromList(
								_List_fromArray(
									[
										A2(
										$author$project$Morphir$Type$Constraint$equality,
										$author$project$Morphir$Type$MetaType$metaVar(ctorTypeVar),
										ctorFunType),
										A2(
										$author$project$Morphir$Type$Constraint$equality,
										$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
										resultType(ctorFunType))
									]));
						},
						A3($author$project$Morphir$Type$MetaTypeMapping$lookupConstructor, ctorTypeVar, ir, fQName)));
				var ctorType = function (args) {
					if (!args.b) {
						return $author$project$Morphir$Type$MetaType$metaVar(thisTypeVar);
					} else {
						var firstArg = args.a;
						var restOfArgs = args.b;
						return A2(
							$author$project$Morphir$Type$MetaType$metaFun,
							firstArg,
							ctorType(restOfArgs));
					}
				};
				var ctorFunConstraint = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(ctorTypeVar),
						ctorType(
							A2($elm$core$List$map, $author$project$Morphir$Type$Infer$metaTypeVarForPattern, argPatterns))));
				var _v9 = $elm$core$List$unzip(
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Type$Infer$constrainPattern(ir),
						argPatterns));
				var argVariables = _v9.a;
				var argConstraints = _v9.b;
				return _Utils_Tuple2(
					A3($elm$core$List$foldl, $elm$core$Dict$union, $elm$core$Dict$empty, argVariables),
					$author$project$Morphir$Type$ConstraintSet$concat(
						A2(
							$elm$core$List$cons,
							customTypeConstraint,
							A2($elm$core$List$cons, ctorFunConstraint, argConstraints))));
			case 'EmptyListPattern':
				var _v10 = pattern.a;
				var va = _v10.a;
				var thisTypeVar = _v10.b;
				var itemType = $author$project$Morphir$Type$MetaType$metaVar(
					$author$project$Morphir$Type$MetaType$subVariable(thisTypeVar));
				var listType = $author$project$Morphir$Type$MetaType$listType(itemType);
				return _Utils_Tuple2(
					$elm$core$Dict$empty,
					$author$project$Morphir$Type$ConstraintSet$singleton(
						A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							listType)));
			case 'HeadTailPattern':
				var _v11 = pattern.a;
				var va = _v11.a;
				var thisTypeVar = _v11.b;
				var headPattern = pattern.b;
				var tailPattern = pattern.c;
				var itemType = $author$project$Morphir$Type$Infer$metaTypeVarForPattern(headPattern);
				var listType = $author$project$Morphir$Type$MetaType$listType(itemType);
				var thisPatternConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							listType),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$Infer$metaTypeVarForPattern(tailPattern),
							listType)
						]));
				var _v12 = A2($author$project$Morphir$Type$Infer$constrainPattern, ir, tailPattern);
				var tailVariables = _v12.a;
				var tailConstraints = _v12.b;
				var _v13 = A2($author$project$Morphir$Type$Infer$constrainPattern, ir, headPattern);
				var headVariables = _v13.a;
				var headConstraints = _v13.b;
				return _Utils_Tuple2(
					A2($elm$core$Dict$union, headVariables, tailVariables),
					$author$project$Morphir$Type$ConstraintSet$concat(
						_List_fromArray(
							[headConstraints, tailConstraints, thisPatternConstraints])));
			case 'LiteralPattern':
				var _v14 = pattern.a;
				var va = _v14.a;
				var thisTypeVar = _v14.b;
				var literalValue = pattern.b;
				return _Utils_Tuple2(
					$elm$core$Dict$empty,
					A2($author$project$Morphir$Type$Infer$constrainLiteral, thisTypeVar, literalValue));
			default:
				var _v15 = pattern.a;
				var va = _v15.a;
				var thisTypeVar = _v15.b;
				return _Utils_Tuple2(
					$elm$core$Dict$empty,
					$author$project$Morphir$Type$ConstraintSet$singleton(
						A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							$author$project$Morphir$Type$MetaType$metaUnit)));
		}
	});
var $author$project$Morphir$Type$MetaTypeMapping$CouldNotFindValue = function (a) {
	return {$: 'CouldNotFindValue', a: a};
};
var $author$project$Morphir$IR$lookupValueSpecification = F2(
	function (fqn, ir) {
		return A2($elm$core$Dict$get, fqn, ir.valueSpecifications);
	});
var $author$project$Morphir$Type$MetaTypeMapping$valueSpecToMetaType = F3(
	function (baseVar, ir, valueSpec) {
		var specToFunctionType = F2(
			function (argTypes, returnType) {
				if (!argTypes.b) {
					return returnType;
				} else {
					var firstArg = argTypes.a;
					var restOfArgs = argTypes.b;
					return A3(
						$author$project$Morphir$IR$Type$Function,
						_Utils_Tuple0,
						firstArg,
						A2(specToFunctionType, restOfArgs, returnType));
				}
			});
		var functionType = A2(
			specToFunctionType,
			A2($elm$core$List$map, $elm$core$Tuple$second, valueSpec.inputs),
			valueSpec.output);
		var varToMeta = A2(
			$author$project$Morphir$Type$MetaTypeMapping$concreteVarsToMetaVars,
			baseVar,
			$author$project$Morphir$IR$Type$collectVariables(functionType));
		return A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, functionType);
	});
var $author$project$Morphir$Type$MetaTypeMapping$lookupValue = F3(
	function (baseVar, ir, valueFQN) {
		return A2(
			$elm$core$Result$fromMaybe,
			$author$project$Morphir$Type$MetaTypeMapping$CouldNotFindValue(valueFQN),
			A2(
				$elm$core$Maybe$map,
				A2($author$project$Morphir$Type$MetaTypeMapping$valueSpecToMetaType, baseVar, ir),
				A2($author$project$Morphir$IR$lookupValueSpecification, valueFQN, ir)));
	});
var $author$project$Morphir$IR$Value$valueAttribute = function (v) {
	switch (v.$) {
		case 'Literal':
			var a = v.a;
			return a;
		case 'Constructor':
			var a = v.a;
			return a;
		case 'Tuple':
			var a = v.a;
			return a;
		case 'List':
			var a = v.a;
			return a;
		case 'Record':
			var a = v.a;
			return a;
		case 'Variable':
			var a = v.a;
			return a;
		case 'Reference':
			var a = v.a;
			return a;
		case 'Field':
			var a = v.a;
			return a;
		case 'FieldFunction':
			var a = v.a;
			return a;
		case 'Apply':
			var a = v.a;
			return a;
		case 'Lambda':
			var a = v.a;
			return a;
		case 'LetDefinition':
			var a = v.a;
			return a;
		case 'LetRecursion':
			var a = v.a;
			return a;
		case 'Destructure':
			var a = v.a;
			return a;
		case 'IfThenElse':
			var a = v.a;
			return a;
		case 'PatternMatch':
			var a = v.a;
			return a;
		case 'UpdateRecord':
			var a = v.a;
			return a;
		default:
			var a = v.a;
			return a;
	}
};
var $author$project$Morphir$Type$Infer$metaTypeVarForValue = function (value) {
	return $author$project$Morphir$Type$MetaType$metaVar(
		$author$project$Morphir$IR$Value$valueAttribute(value).b);
};
var $author$project$Morphir$Type$MetaType$variableByName = function (name) {
	return _Utils_Tuple3(name, 0, 0);
};
var $author$project$Morphir$Type$Infer$constrainDefinition = F4(
	function (baseVar, ir, vars, def) {
		var outputTypeVars = $author$project$Morphir$IR$Type$collectVariables(def.outputType);
		var inputVars = $elm$core$Dict$fromList(
			A2(
				$elm$core$List$map,
				function (_v41) {
					var name = _v41.a;
					var _v42 = _v41.b;
					var thisTypeVar = _v42.b;
					return _Utils_Tuple2(name, thisTypeVar);
				},
				def.inputTypes));
		var inputTypeVars = A3(
			$elm$core$List$foldl,
			$elm$core$Set$union,
			$elm$core$Set$empty,
			A2(
				$elm$core$List$map,
				function (_v40) {
					var declaredType = _v40.c;
					return $author$project$Morphir$IR$Type$collectVariables(declaredType);
				},
				def.inputTypes));
		var varToMeta = $elm$core$Dict$fromList(
			A2(
				$elm$core$List$map,
				function (varName) {
					return _Utils_Tuple2(
						varName,
						$author$project$Morphir$Type$MetaType$variableByName(varName));
				},
				$elm$core$Set$toList(
					A2($elm$core$Set$union, inputTypeVars, outputTypeVars))));
		var outputConstraints = $author$project$Morphir$Type$ConstraintSet$singleton(
			A2(
				$author$project$Morphir$Type$Constraint$equality,
				$author$project$Morphir$Type$Infer$metaTypeVarForValue(def.body),
				A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, baseVar, ir, varToMeta, def.outputType)));
		var inputConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
			A2(
				$elm$core$List$map,
				function (_v38) {
					var _v39 = _v38.b;
					var thisTypeVar = _v39.b;
					var declaredType = _v38.c;
					return A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						A4($author$project$Morphir$Type$MetaTypeMapping$concreteTypeToMetaType, thisTypeVar, ir, varToMeta, declaredType));
				},
				def.inputTypes));
		var bodyConstraints = A3(
			$author$project$Morphir$Type$Infer$constrainValue,
			ir,
			A2($elm$core$Dict$union, inputVars, vars),
			def.body);
		return $author$project$Morphir$Type$ConstraintSet$concat(
			_List_fromArray(
				[inputConstraints, outputConstraints, bodyConstraints]));
	});
var $author$project$Morphir$Type$Infer$constrainValue = F3(
	function (ir, vars, annotatedValue) {
		switch (annotatedValue.$) {
			case 'Literal':
				var _v1 = annotatedValue.a;
				var thisTypeVar = _v1.b;
				var literalValue = annotatedValue.b;
				return A2($author$project$Morphir$Type$Infer$constrainLiteral, thisTypeVar, literalValue);
			case 'Constructor':
				var _v2 = annotatedValue.a;
				var thisTypeVar = _v2.b;
				var fQName = annotatedValue.b;
				return A2(
					$elm$core$Result$withDefault,
					$author$project$Morphir$Type$ConstraintSet$empty,
					A2(
						$elm$core$Result$map,
						$author$project$Morphir$Type$ConstraintSet$singleton,
						A2(
							$elm$core$Result$map,
							$author$project$Morphir$Type$Constraint$equality(
								$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar)),
							A3($author$project$Morphir$Type$MetaTypeMapping$lookupConstructor, thisTypeVar, ir, fQName))));
			case 'Tuple':
				var _v3 = annotatedValue.a;
				var thisTypeVar = _v3.b;
				var elems = annotatedValue.b;
				var tupleConstraint = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						$author$project$Morphir$Type$MetaType$metaTuple(
							A2($elm$core$List$map, $author$project$Morphir$Type$Infer$metaTypeVarForValue, elems))));
				var elemsConstraints = A2(
					$elm$core$List$map,
					A2($author$project$Morphir$Type$Infer$constrainValue, ir, vars),
					elems);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					A2($elm$core$List$cons, tupleConstraint, elemsConstraints));
			case 'List':
				var _v4 = annotatedValue.a;
				var thisTypeVar = _v4.b;
				var items = annotatedValue.b;
				var itemType = $author$project$Morphir$Type$MetaType$metaVar(
					$author$project$Morphir$Type$MetaType$subVariable(thisTypeVar));
				var listConstraint = A2(
					$author$project$Morphir$Type$Constraint$equality,
					$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
					$author$project$Morphir$Type$MetaType$listType(itemType));
				var itemConstraints = $author$project$Morphir$Type$ConstraintSet$concat(
					A2(
						$elm$core$List$map,
						function (item) {
							return A2(
								$author$project$Morphir$Type$ConstraintSet$insert,
								A2(
									$author$project$Morphir$Type$Constraint$equality,
									itemType,
									$author$project$Morphir$Type$Infer$metaTypeVarForValue(item)),
								A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, item));
						},
						items));
				return A2($author$project$Morphir$Type$ConstraintSet$insert, listConstraint, itemConstraints);
			case 'Record':
				var _v5 = annotatedValue.a;
				var thisTypeVar = _v5.b;
				var fieldValues = annotatedValue.b;
				var recordType = A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					$elm$core$Maybe$Nothing,
					$elm$core$Dict$fromList(
						A2(
							$elm$core$List$map,
							function (_v6) {
								var fieldName = _v6.a;
								var fieldValue = _v6.b;
								return _Utils_Tuple2(
									fieldName,
									$author$project$Morphir$Type$Infer$metaTypeVarForValue(fieldValue));
							},
							fieldValues)));
				var recordConstraints = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						recordType));
				var fieldConstraints = $author$project$Morphir$Type$ConstraintSet$concat(
					A2(
						$elm$core$List$map,
						A2(
							$elm$core$Basics$composeR,
							$elm$core$Tuple$second,
							A2($author$project$Morphir$Type$Infer$constrainValue, ir, vars)),
						fieldValues));
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[fieldConstraints, recordConstraints]));
			case 'Variable':
				var _v7 = annotatedValue.a;
				var varUse = _v7.b;
				var varName = annotatedValue.b;
				var _v8 = A2($elm$core$Dict$get, varName, vars);
				if (_v8.$ === 'Just') {
					var varDecl = _v8.a;
					return $author$project$Morphir$Type$ConstraintSet$singleton(
						A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(varUse),
							$author$project$Morphir$Type$MetaType$metaVar(varDecl)));
				} else {
					return $author$project$Morphir$Type$ConstraintSet$empty;
				}
			case 'Reference':
				var _v9 = annotatedValue.a;
				var thisTypeVar = _v9.b;
				var fQName = annotatedValue.b;
				return A2(
					$elm$core$Result$withDefault,
					$author$project$Morphir$Type$ConstraintSet$empty,
					A2(
						$elm$core$Result$map,
						$author$project$Morphir$Type$ConstraintSet$singleton,
						A2(
							$elm$core$Result$map,
							$author$project$Morphir$Type$Constraint$equality(
								$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar)),
							A3($author$project$Morphir$Type$MetaTypeMapping$lookupValue, thisTypeVar, ir, fQName))));
			case 'Field':
				var _v10 = annotatedValue.a;
				var thisTypeVar = _v10.b;
				var subjectValue = annotatedValue.b;
				var fieldName = annotatedValue.c;
				var extendsVar = $author$project$Morphir$Type$MetaType$subVariable(thisTypeVar);
				var fieldType = $author$project$Morphir$Type$MetaType$metaVar(
					$author$project$Morphir$Type$MetaType$subVariable(extendsVar));
				var extensibleRecordType = A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					$elm$core$Maybe$Just(extendsVar),
					A2($elm$core$Dict$singleton, fieldName, fieldType));
				var fieldConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(subjectValue),
							extensibleRecordType),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							fieldType)
						]));
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[
							A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, subjectValue),
							fieldConstraints
						]));
			case 'FieldFunction':
				var _v11 = annotatedValue.a;
				var thisTypeVar = _v11.b;
				var fieldName = annotatedValue.b;
				var extendsVar = $author$project$Morphir$Type$MetaType$subVariable(thisTypeVar);
				var fieldType = $author$project$Morphir$Type$MetaType$metaVar(
					$author$project$Morphir$Type$MetaType$subVariable(extendsVar));
				var extensibleRecordType = A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					$elm$core$Maybe$Just(extendsVar),
					A2($elm$core$Dict$singleton, fieldName, fieldType));
				return $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						A2($author$project$Morphir$Type$MetaType$metaFun, extensibleRecordType, fieldType)));
			case 'Apply':
				var _v12 = annotatedValue.a;
				var thisTypeVar = _v12.b;
				var funValue = annotatedValue.b;
				var argValue = annotatedValue.c;
				var funType = A2(
					$author$project$Morphir$Type$MetaType$metaFun,
					$author$project$Morphir$Type$Infer$metaTypeVarForValue(argValue),
					$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar));
				var applyConstraints = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$Infer$metaTypeVarForValue(funValue),
						funType));
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[
							A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, funValue),
							A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, argValue),
							applyConstraints
						]));
			case 'Lambda':
				var _v13 = annotatedValue.a;
				var thisTypeVar = _v13.b;
				var argPattern = annotatedValue.b;
				var bodyValue = annotatedValue.c;
				var lambdaType = A2(
					$author$project$Morphir$Type$MetaType$metaFun,
					$author$project$Morphir$Type$Infer$metaTypeVarForPattern(argPattern),
					$author$project$Morphir$Type$Infer$metaTypeVarForValue(bodyValue));
				var lambdaConstraints = $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						lambdaType));
				var _v14 = A2($author$project$Morphir$Type$Infer$constrainPattern, ir, argPattern);
				var argVariables = _v14.a;
				var argConstraints = _v14.b;
				var bodyConstraints = A3(
					$author$project$Morphir$Type$Infer$constrainValue,
					ir,
					A2($elm$core$Dict$union, argVariables, vars),
					bodyValue);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[lambdaConstraints, bodyConstraints, argConstraints]));
			case 'LetDefinition':
				var _v15 = annotatedValue.a;
				var thisTypeVar = _v15.b;
				var defName = annotatedValue.b;
				var def = annotatedValue.c;
				var inValue = annotatedValue.d;
				var defTypeVar = $author$project$Morphir$Type$MetaType$subVariable(thisTypeVar);
				var inConstraints = A3(
					$author$project$Morphir$Type$Infer$constrainValue,
					ir,
					A3($elm$core$Dict$insert, defName, defTypeVar, vars),
					inValue);
				var defType = F2(
					function (argTypes, returnType) {
						if (!argTypes.b) {
							return returnType;
						} else {
							var firstArg = argTypes.a;
							var restOfArgs = argTypes.b;
							return A2(
								$author$project$Morphir$Type$MetaType$metaFun,
								firstArg,
								A2(defType, restOfArgs, returnType));
						}
					});
				var letConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(inValue)),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(defTypeVar),
							A2(
								defType,
								A2(
									$elm$core$List$map,
									function (_v17) {
										var _v18 = _v17.b;
										var argTypeVar = _v18.b;
										return $author$project$Morphir$Type$MetaType$metaVar(argTypeVar);
									},
									def.inputTypes),
								$author$project$Morphir$Type$Infer$metaTypeVarForValue(def.body)))
						]));
				var defConstraints = A4($author$project$Morphir$Type$Infer$constrainDefinition, thisTypeVar, ir, vars, def);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[defConstraints, inConstraints, letConstraints]));
			case 'LetRecursion':
				var _v19 = annotatedValue.a;
				var thisTypeVar = _v19.b;
				var defs = annotatedValue.b;
				var inValue = annotatedValue.c;
				var letConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(inValue))
						]));
				var defType = F2(
					function (argTypes, returnType) {
						if (!argTypes.b) {
							return returnType;
						} else {
							var firstArg = argTypes.a;
							var restOfArgs = argTypes.b;
							return A2(
								$author$project$Morphir$Type$MetaType$metaFun,
								firstArg,
								A2(defType, restOfArgs, returnType));
						}
					});
				var _v21 = A3(
					$elm$core$List$foldl,
					F2(
						function (_v22, _v23) {
							var defName = _v22.a;
							var def = _v22.b;
							var lastTypeVar = _v23.a;
							var constraintsSoFar = _v23.b;
							var variablesSoFar = _v23.c;
							var nextTypeVar = $author$project$Morphir$Type$MetaType$subVariable(lastTypeVar);
							var letConstraint = $author$project$Morphir$Type$ConstraintSet$fromList(
								_List_fromArray(
									[
										A2(
										$author$project$Morphir$Type$Constraint$equality,
										$author$project$Morphir$Type$MetaType$metaVar(nextTypeVar),
										A2(
											defType,
											A2(
												$elm$core$List$map,
												function (_v24) {
													var _v25 = _v24.b;
													var argTypeVar = _v25.b;
													return $author$project$Morphir$Type$MetaType$metaVar(argTypeVar);
												},
												def.inputTypes),
											$author$project$Morphir$Type$Infer$metaTypeVarForValue(def.body)))
									]));
							return _Utils_Tuple3(
								nextTypeVar,
								A2($elm$core$List$cons, letConstraint, constraintsSoFar),
								A2(
									$elm$core$List$cons,
									_Utils_Tuple2(defName, nextTypeVar),
									variablesSoFar));
						}),
					_Utils_Tuple3(thisTypeVar, _List_Nil, _List_Nil),
					$elm$core$Dict$toList(defs));
				var lastDefTypeVar = _v21.a;
				var defDeclsConstraints = _v21.b;
				var defVariables = _v21.c;
				var inConstraints = A3(
					$author$project$Morphir$Type$Infer$constrainValue,
					ir,
					A2(
						$elm$core$Dict$union,
						$elm$core$Dict$fromList(defVariables),
						vars),
					inValue);
				var defsConstraints = $author$project$Morphir$Type$ConstraintSet$concat(
					A3(
						$elm$core$List$foldl,
						F2(
							function (_v26, _v27) {
								var def = _v26.b;
								var lastTypeVar = _v27.a;
								var constraintsSoFar = _v27.b;
								var nextTypeVar = $author$project$Morphir$Type$MetaType$subVariable(lastTypeVar);
								var defConstraints = A4($author$project$Morphir$Type$Infer$constrainDefinition, lastTypeVar, ir, vars, def);
								return _Utils_Tuple2(
									nextTypeVar,
									A2($elm$core$List$cons, defConstraints, constraintsSoFar));
							}),
						_Utils_Tuple2(lastDefTypeVar, defDeclsConstraints),
						$elm$core$Dict$toList(defs)).b);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[defsConstraints, inConstraints, letConstraints]));
			case 'Destructure':
				var _v28 = annotatedValue.a;
				var thisTypeVar = _v28.b;
				var bindPattern = annotatedValue.b;
				var bindValue = annotatedValue.c;
				var inValue = annotatedValue.d;
				var destructureConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(inValue)),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(bindValue),
							$author$project$Morphir$Type$Infer$metaTypeVarForPattern(bindPattern))
						]));
				var bindValueConstraints = A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, bindValue);
				var _v29 = A2($author$project$Morphir$Type$Infer$constrainPattern, ir, bindPattern);
				var bindPatternVariables = _v29.a;
				var bindPatternConstraints = _v29.b;
				var inValueConstraints = A3(
					$author$project$Morphir$Type$Infer$constrainValue,
					ir,
					A2($elm$core$Dict$union, bindPatternVariables, vars),
					inValue);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[bindPatternConstraints, bindValueConstraints, inValueConstraints, destructureConstraints]));
			case 'IfThenElse':
				var _v30 = annotatedValue.a;
				var thisTypeVar = _v30.b;
				var condition = annotatedValue.b;
				var thenBranch = annotatedValue.c;
				var elseBranch = annotatedValue.d;
				var specificConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(condition),
							$author$project$Morphir$Type$MetaType$boolType),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(elseBranch),
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(thenBranch)),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(thenBranch))
						]));
				var childConstraints = _List_fromArray(
					[
						A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, condition),
						A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, thenBranch),
						A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, elseBranch)
					]);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					A2($elm$core$List$cons, specificConstraints, childConstraints));
			case 'PatternMatch':
				var _v31 = annotatedValue.a;
				var thisTypeVar = _v31.b;
				var subjectValue = annotatedValue.b;
				var cases = annotatedValue.c;
				var thisType = $author$project$Morphir$Type$MetaType$metaVar(thisTypeVar);
				var subjectType = $author$project$Morphir$Type$Infer$metaTypeVarForValue(subjectValue);
				var subjectConstraints = A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, subjectValue);
				var casesConstraints = A2(
					$elm$core$List$map,
					function (_v32) {
						var casePattern = _v32.a;
						var caseValue = _v32.b;
						var caseConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
							_List_fromArray(
								[
									A2(
									$author$project$Morphir$Type$Constraint$equality,
									subjectType,
									$author$project$Morphir$Type$Infer$metaTypeVarForPattern(casePattern)),
									A2(
									$author$project$Morphir$Type$Constraint$equality,
									thisType,
									$author$project$Morphir$Type$Infer$metaTypeVarForValue(caseValue))
								]));
						var _v33 = A2($author$project$Morphir$Type$Infer$constrainPattern, ir, casePattern);
						var casePatternVariables = _v33.a;
						var casePatternConstraints = _v33.b;
						var caseValueConstraints = A3(
							$author$project$Morphir$Type$Infer$constrainValue,
							ir,
							A2($elm$core$Dict$union, casePatternVariables, vars),
							caseValue);
						return $author$project$Morphir$Type$ConstraintSet$concat(
							_List_fromArray(
								[casePatternConstraints, caseValueConstraints, caseConstraints]));
					},
					cases);
				return $author$project$Morphir$Type$ConstraintSet$concat(
					A2($elm$core$List$cons, subjectConstraints, casesConstraints));
			case 'UpdateRecord':
				var _v34 = annotatedValue.a;
				var thisTypeVar = _v34.b;
				var subjectValue = annotatedValue.b;
				var fieldValues = annotatedValue.c;
				var fieldValueConstraints = $author$project$Morphir$Type$ConstraintSet$concat(
					A2(
						$elm$core$List$map,
						function (_v36) {
							var fieldValue = _v36.b;
							return A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, fieldValue);
						},
						fieldValues));
				var extendsVar = $author$project$Morphir$Type$MetaType$subVariable(thisTypeVar);
				var extensibleRecordType = A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					$elm$core$Maybe$Just(extendsVar),
					$elm$core$Dict$fromList(
						A2(
							$elm$core$List$map,
							function (_v35) {
								var fieldName = _v35.a;
								var fieldValue = _v35.b;
								return _Utils_Tuple2(
									fieldName,
									$author$project$Morphir$Type$Infer$metaTypeVarForValue(fieldValue));
							},
							fieldValues)));
				var fieldConstraints = $author$project$Morphir$Type$ConstraintSet$fromList(
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(subjectValue),
							extensibleRecordType),
							A2(
							$author$project$Morphir$Type$Constraint$equality,
							$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
							$author$project$Morphir$Type$Infer$metaTypeVarForValue(subjectValue))
						]));
				return $author$project$Morphir$Type$ConstraintSet$concat(
					_List_fromArray(
						[
							A3($author$project$Morphir$Type$Infer$constrainValue, ir, vars, subjectValue),
							fieldValueConstraints,
							fieldConstraints
						]));
			default:
				var _v37 = annotatedValue.a;
				var thisTypeVar = _v37.b;
				return $author$project$Morphir$Type$ConstraintSet$singleton(
					A2(
						$author$project$Morphir$Type$Constraint$equality,
						$author$project$Morphir$Type$MetaType$metaVar(thisTypeVar),
						$author$project$Morphir$Type$MetaType$metaUnit));
		}
	});
var $author$project$Morphir$Type$Solve$SolutionMap = function (a) {
	return {$: 'SolutionMap', a: a};
};
var $author$project$Morphir$Type$Solve$emptySolution = $author$project$Morphir$Type$Solve$SolutionMap($elm$core$Dict$empty);
var $author$project$Morphir$Type$Infer$UnifyError = function (a) {
	return {$: 'UnifyError', a: a};
};
var $author$project$Morphir$Type$MetaType$substituteVariable = F3(
	function (_var, replacement, original) {
		if (A2(
			$elm$core$Set$member,
			_var,
			$author$project$Morphir$Type$MetaType$variables(original))) {
			switch (original.$) {
				case 'MetaVar':
					var thisVar = original.a;
					return _Utils_eq(thisVar, _var) ? replacement : original;
				case 'MetaTuple':
					var metaElems = original.b;
					return $author$project$Morphir$Type$MetaType$metaTuple(
						A2(
							$elm$core$List$map,
							A2($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement),
							metaElems));
				case 'MetaRecord':
					var _extends = original.b;
					var metaFields = original.c;
					return _Utils_eq(
						_extends,
						$elm$core$Maybe$Just(_var)) ? replacement : A2(
						$author$project$Morphir$Type$MetaType$metaRecord,
						_extends,
						A2(
							$elm$core$Dict$map,
							F2(
								function (_v1, fieldType) {
									return A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, fieldType);
								}),
							metaFields));
				case 'MetaFun':
					var metaFunc = original.b;
					var metaArg = original.c;
					return A2(
						$author$project$Morphir$Type$MetaType$metaFun,
						A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, metaFunc),
						A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, metaArg));
				case 'MetaRef':
					var fQName = original.b;
					var args = original.c;
					var maybeAliasedType = original.d;
					if (maybeAliasedType.$ === 'Just') {
						var aliasedType = maybeAliasedType.a;
						return A3(
							$author$project$Morphir$Type$MetaType$metaAlias,
							fQName,
							A2(
								$elm$core$List$map,
								A2($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement),
								args),
							A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, aliasedType));
					} else {
						return A2(
							$author$project$Morphir$Type$MetaType$metaRef,
							fQName,
							A2(
								$elm$core$List$map,
								A2($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement),
								args));
					}
				default:
					return original;
			}
		} else {
			return original;
		}
	});
var $author$project$Morphir$Type$Constraint$substituteVariable = F3(
	function (_var, replacement, constraint) {
		if (constraint.$ === 'Equality') {
			var metaType1 = constraint.a;
			var metaType2 = constraint.b;
			return A2(
				$author$project$Morphir$Type$Constraint$Equality,
				A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, metaType1),
				A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, metaType2));
		} else {
			var metaType = constraint.a;
			var cls = constraint.b;
			return A2(
				$author$project$Morphir$Type$Constraint$Class,
				A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, metaType),
				cls);
		}
	});
var $author$project$Morphir$Type$ConstraintSet$substituteVariable = F3(
	function (_var, replacement, _v0) {
		var constraints = _v0.a;
		return $author$project$Morphir$Type$ConstraintSet$ConstraintSet(
			A2(
				$elm$core$List$filterMap,
				function (constraint) {
					var newConstraint = A3($author$project$Morphir$Type$Constraint$substituteVariable, _var, replacement, constraint);
					return $author$project$Morphir$Type$Constraint$isTrivial(newConstraint) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(newConstraint);
				},
				constraints));
	});
var $author$project$Morphir$Type$ConstraintSet$applySubstitutions = F2(
	function (_v0, constraintSet) {
		var substitutions = _v0.a;
		return A3(
			$elm$core$List$foldl,
			F2(
				function (_v1, soFar) {
					var _var = _v1.a;
					var replacement = _v1.b;
					return A3($author$project$Morphir$Type$ConstraintSet$substituteVariable, _var, replacement, soFar);
				}),
			constraintSet,
			$elm$core$Dict$toList(substitutions));
	});
var $author$project$Morphir$Type$Solve$isEmptySolution = function (_v0) {
	var solutions = _v0.a;
	return $elm$core$Dict$isEmpty(solutions);
};
var $author$project$Morphir$Type$Solve$CouldNotFindField = function (a) {
	return {$: 'CouldNotFindField', a: a};
};
var $author$project$Morphir$Type$Solve$CouldNotUnify = F3(
	function (a, b, c) {
		return {$: 'CouldNotUnify', a: a, b: b, c: c};
	});
var $author$project$Morphir$Type$Solve$FieldMismatch = {$: 'FieldMismatch'};
var $author$project$Morphir$Type$Solve$NoUnificationRule = {$: 'NoUnificationRule'};
var $author$project$Morphir$Type$Solve$RefMismatch = {$: 'RefMismatch'};
var $author$project$Morphir$Type$Solve$TuplesOfDifferentSize = {$: 'TuplesOfDifferentSize'};
var $author$project$Morphir$Type$Solve$UnificationErrors = function (a) {
	return {$: 'UnificationErrors', a: a};
};
var $elm$core$Dict$diff = F2(
	function (t1, t2) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (k, v, t) {
					return A2($elm$core$Dict$remove, k, t);
				}),
			t1,
			t2);
	});
var $elm$core$Dict$filter = F2(
	function (isGood, dict) {
		return A3(
			$elm$core$Dict$foldl,
			F3(
				function (k, v, d) {
					return A2(isGood, k, v) ? A3($elm$core$Dict$insert, k, v, d) : d;
				}),
			$elm$core$Dict$empty,
			dict);
	});
var $elm$core$Dict$intersect = F2(
	function (t1, t2) {
		return A2(
			$elm$core$Dict$filter,
			F2(
				function (k, _v0) {
					return A2($elm$core$Dict$member, k, t2);
				}),
			t1);
	});
var $author$project$Morphir$Type$MetaType$wrapInAliases = F2(
	function (aliases, tpe) {
		if (!aliases.b) {
			return tpe;
		} else {
			var _v1 = aliases.a;
			var alias = _v1.a;
			var aliasArgs = _v1.b;
			var restOfAliases = aliases.b;
			return A3(
				$author$project$Morphir$Type$MetaType$metaAlias,
				alias,
				aliasArgs,
				A2($author$project$Morphir$Type$MetaType$wrapInAliases, restOfAliases, tpe));
		}
	});
var $author$project$Morphir$Type$Solve$singleSolution = F3(
	function (aliases, _var, metaType) {
		return $author$project$Morphir$Type$Solve$SolutionMap(
			A2(
				$elm$core$Dict$singleton,
				_var,
				A2($author$project$Morphir$Type$MetaType$wrapInAliases, aliases, metaType)));
	});
var $author$project$Morphir$Type$Solve$substituteVariable = F3(
	function (_var, replacement, _v0) {
		var solutions = _v0.a;
		return $author$project$Morphir$Type$Solve$SolutionMap(
			A2(
				$elm$core$Dict$map,
				F2(
					function (_v1, metaType) {
						return A3($author$project$Morphir$Type$MetaType$substituteVariable, _var, replacement, metaType);
					}),
				solutions));
	});
var $elm$core$Set$intersect = F2(
	function (_v0, _v1) {
		var dict1 = _v0.a;
		var dict2 = _v1.a;
		return $elm$core$Set$Set_elm_builtin(
			A2($elm$core$Dict$intersect, dict1, dict2));
	});
var $elm$core$Set$isEmpty = function (_v0) {
	var dict = _v0.a;
	return $elm$core$Dict$isEmpty(dict);
};
var $author$project$Morphir$Type$MetaType$substituteVariables = F2(
	function (replacements, original) {
		if ($elm$core$Set$isEmpty(
			A2(
				$elm$core$Set$intersect,
				$elm$core$Set$fromList(
					$elm$core$Dict$keys(replacements)),
				$author$project$Morphir$Type$MetaType$variables(original)))) {
			return original;
		} else {
			switch (original.$) {
				case 'MetaVar':
					var thisVar = original.a;
					var _v1 = A2($elm$core$Dict$get, thisVar, replacements);
					if (_v1.$ === 'Just') {
						var replacement = _v1.a;
						return replacement;
					} else {
						return original;
					}
				case 'MetaTuple':
					var metaElems = original.b;
					return $author$project$Morphir$Type$MetaType$metaTuple(
						A2(
							$elm$core$List$map,
							$author$project$Morphir$Type$MetaType$substituteVariables(replacements),
							metaElems));
				case 'MetaRecord':
					if (original.b.$ === 'Just') {
						var _extends = original.b.a;
						var metaFields = original.c;
						var _v2 = A2($elm$core$Dict$get, _extends, replacements);
						if (_v2.$ === 'Just') {
							var replacement = _v2.a;
							return replacement;
						} else {
							return A2(
								$author$project$Morphir$Type$MetaType$metaRecord,
								$elm$core$Maybe$Just(_extends),
								A2(
									$elm$core$Dict$map,
									F2(
										function (_v3, fieldType) {
											return A2($author$project$Morphir$Type$MetaType$substituteVariables, replacements, fieldType);
										}),
									metaFields));
						}
					} else {
						var _v4 = original.b;
						var metaFields = original.c;
						return A2(
							$author$project$Morphir$Type$MetaType$metaRecord,
							$elm$core$Maybe$Nothing,
							A2(
								$elm$core$Dict$map,
								F2(
									function (_v5, fieldType) {
										return A2($author$project$Morphir$Type$MetaType$substituteVariables, replacements, fieldType);
									}),
								metaFields));
					}
				case 'MetaFun':
					var metaFunc = original.b;
					var metaArg = original.c;
					return A2(
						$author$project$Morphir$Type$MetaType$metaFun,
						A2($author$project$Morphir$Type$MetaType$substituteVariables, replacements, metaFunc),
						A2($author$project$Morphir$Type$MetaType$substituteVariables, replacements, metaArg));
				case 'MetaRef':
					var fQName = original.b;
					var args = original.c;
					var maybeAliasedType = original.d;
					if (maybeAliasedType.$ === 'Just') {
						var aliasedType = maybeAliasedType.a;
						return A3(
							$author$project$Morphir$Type$MetaType$metaAlias,
							fQName,
							A2(
								$elm$core$List$map,
								$author$project$Morphir$Type$MetaType$substituteVariables(replacements),
								args),
							A2($author$project$Morphir$Type$MetaType$substituteVariables, replacements, aliasedType));
					} else {
						return A2(
							$author$project$Morphir$Type$MetaType$metaRef,
							fQName,
							A2(
								$elm$core$List$map,
								$author$project$Morphir$Type$MetaType$substituteVariables(replacements),
								args));
					}
				default:
					return original;
			}
		}
	});
var $author$project$Morphir$Type$Solve$unifyUnit = F2(
	function (aliases, metaType2) {
		if (metaType2.$ === 'MetaUnit') {
			return $elm$core$Result$Ok($author$project$Morphir$Type$Solve$emptySolution);
		} else {
			return $elm$core$Result$Err(
				A3($author$project$Morphir$Type$Solve$CouldNotUnify, $author$project$Morphir$Type$Solve$NoUnificationRule, $author$project$Morphir$Type$MetaType$MetaUnit, metaType2));
		}
	});
var $author$project$Morphir$Type$MetaType$isNamedVariable = function (_v0) {
	var name = _v0.a;
	return !$elm$core$List$isEmpty(name);
};
var $author$project$Morphir$Type$Solve$unifyVariable = F3(
	function (aliases, var1, metaType2) {
		if (metaType2.$ === 'MetaVar') {
			var var2 = metaType2.a;
			return $author$project$Morphir$Type$MetaType$isNamedVariable(var1) ? $elm$core$Result$Ok(
				A3(
					$author$project$Morphir$Type$Solve$singleSolution,
					aliases,
					var2,
					$author$project$Morphir$Type$MetaType$metaVar(var1))) : $elm$core$Result$Ok(
				A3($author$project$Morphir$Type$Solve$singleSolution, aliases, var1, metaType2));
		} else {
			return $elm$core$Result$Ok(
				A3($author$project$Morphir$Type$Solve$singleSolution, aliases, var1, metaType2));
		}
	});
var $author$project$Morphir$Type$Solve$addSolution = F4(
	function (ir, _var, newSolution, _v14) {
		var currentSolutions = _v14.a;
		var substitutedNewSolution = A2($author$project$Morphir$Type$MetaType$substituteVariables, currentSolutions, newSolution);
		var _v15 = A2($elm$core$Dict$get, _var, currentSolutions);
		if (_v15.$ === 'Just') {
			var existingSolution = _v15.a;
			return A2(
				$elm$core$Result$map,
				function (_v16) {
					var newSubstitutions = _v16.a;
					return A3(
						$author$project$Morphir$Type$Solve$substituteVariable,
						_var,
						substitutedNewSolution,
						$author$project$Morphir$Type$Solve$SolutionMap(
							A2(
								$elm$core$Dict$union,
								newSubstitutions,
								A3(
									$elm$core$Dict$insert,
									_var,
									A2($author$project$Morphir$Type$MetaType$substituteVariables, newSubstitutions, existingSolution),
									currentSolutions))));
				},
				A4($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil, existingSolution, substitutedNewSolution));
		} else {
			return $elm$core$Result$Ok(
				A3(
					$author$project$Morphir$Type$Solve$substituteVariable,
					_var,
					substitutedNewSolution,
					$author$project$Morphir$Type$Solve$SolutionMap(
						A3($elm$core$Dict$insert, _var, substitutedNewSolution, currentSolutions))));
		}
	});
var $author$project$Morphir$Type$Solve$concatSolutions = F2(
	function (refs, solutionMaps) {
		return A3(
			$elm$core$List$foldl,
			F2(
				function (nextSolutions, resultSoFar) {
					return A2(
						$elm$core$Result$andThen,
						function (solutionsSoFar) {
							return A3($author$project$Morphir$Type$Solve$mergeSolutions, refs, solutionsSoFar, nextSolutions);
						},
						resultSoFar);
				}),
			$elm$core$Result$Ok($author$project$Morphir$Type$Solve$emptySolution),
			solutionMaps);
	});
var $author$project$Morphir$Type$Solve$mergeSolutions = F3(
	function (refs, _v12, currentSolutions) {
		var newSolutions = _v12.a;
		return A3(
			$elm$core$List$foldl,
			F2(
				function (_v13, solutionsSoFar) {
					var _var = _v13.a;
					var newSolution = _v13.b;
					return A2(
						$elm$core$Result$andThen,
						A3($author$project$Morphir$Type$Solve$addSolution, refs, _var, newSolution),
						solutionsSoFar);
				}),
			$elm$core$Result$Ok(currentSolutions),
			$elm$core$Dict$toList(newSolutions));
	});
var $author$project$Morphir$Type$Solve$unifyFields = F5(
	function (ir, oldExtends, oldFields, newExtends, newFields) {
		var extraOldFields = A2($elm$core$Dict$diff, oldFields, newFields);
		var extraNewFields = A2($elm$core$Dict$diff, newFields, oldFields);
		var commonFieldsOldType = A2($elm$core$Dict$intersect, oldFields, newFields);
		var fieldSolutionsResult = A2(
			$elm$core$Result$andThen,
			$author$project$Morphir$Type$Solve$concatSolutions(ir),
			A2(
				$elm$core$Result$mapError,
				$author$project$Morphir$Type$Solve$UnificationErrors,
				$author$project$Morphir$ListOfResults$liftAllErrors(
					A2(
						$elm$core$List$map,
						function (_v11) {
							var fieldName = _v11.a;
							var originalType = _v11.b;
							return A2(
								$elm$core$Result$andThen,
								A3($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil, originalType),
								A2(
									$elm$core$Result$fromMaybe,
									$author$project$Morphir$Type$Solve$CouldNotFindField(fieldName),
									A2($elm$core$Dict$get, fieldName, newFields)));
						},
						$elm$core$Dict$toList(commonFieldsOldType)))));
		var unifiedFields = A2(
			$elm$core$Dict$union,
			commonFieldsOldType,
			A2($elm$core$Dict$union, extraOldFields, extraNewFields));
		return (_Utils_eq(oldExtends, $elm$core$Maybe$Nothing) && (!$elm$core$Dict$isEmpty(extraNewFields))) ? $elm$core$Result$Err(
			A3(
				$author$project$Morphir$Type$Solve$CouldNotUnify,
				$author$project$Morphir$Type$Solve$FieldMismatch,
				A2($author$project$Morphir$Type$MetaType$metaRecord, oldExtends, oldFields),
				A2($author$project$Morphir$Type$MetaType$metaRecord, newExtends, newFields))) : ((_Utils_eq(newExtends, $elm$core$Maybe$Nothing) && (!$elm$core$Dict$isEmpty(extraOldFields))) ? $elm$core$Result$Err(
			A3(
				$author$project$Morphir$Type$Solve$CouldNotUnify,
				$author$project$Morphir$Type$Solve$FieldMismatch,
				A2($author$project$Morphir$Type$MetaType$metaRecord, oldExtends, oldFields),
				A2($author$project$Morphir$Type$MetaType$metaRecord, newExtends, newFields))) : A2(
			$elm$core$Result$map,
			$elm$core$Tuple$pair(unifiedFields),
			fieldSolutionsResult));
	});
var $author$project$Morphir$Type$Solve$unifyFun = F5(
	function (ir, aliases, arg1, return1, metaType2) {
		if (metaType2.$ === 'MetaFun') {
			var arg2 = metaType2.b;
			var return2 = metaType2.c;
			return A2(
				$elm$core$Result$andThen,
				$elm$core$Basics$identity,
				A3(
					$elm$core$Result$map2,
					$author$project$Morphir$Type$Solve$mergeSolutions(ir),
					A4($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil, arg1, arg2),
					A4($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil, return1, return2)));
		} else {
			return $elm$core$Result$Err(
				A3(
					$author$project$Morphir$Type$Solve$CouldNotUnify,
					$author$project$Morphir$Type$Solve$NoUnificationRule,
					A2($author$project$Morphir$Type$MetaType$metaFun, arg1, return1),
					metaType2));
		}
	});
var $author$project$Morphir$Type$Solve$unifyMetaType = F4(
	function (ir, aliases, metaType1, metaType2) {
		unifyMetaType:
		while (true) {
			var handleCommon = F2(
				function (mt2, specific) {
					_v9$2:
					while (true) {
						switch (mt2.$) {
							case 'MetaVar':
								var var2 = mt2.a;
								return A3($author$project$Morphir$Type$Solve$unifyVariable, aliases, var2, metaType1);
							case 'MetaRef':
								if (mt2.d.$ === 'Just') {
									var ref2 = mt2.b;
									var args2 = mt2.c;
									var aliasedType2 = mt2.d.a;
									return A4(
										$author$project$Morphir$Type$Solve$unifyMetaType,
										ir,
										A2(
											$elm$core$List$cons,
											_Utils_Tuple2(ref2, args2),
											aliases),
										aliasedType2,
										metaType1);
								} else {
									break _v9$2;
								}
							default:
								break _v9$2;
						}
					}
					return specific(mt2);
				});
			if (_Utils_eq(metaType1, metaType2)) {
				return $elm$core$Result$Ok($author$project$Morphir$Type$Solve$emptySolution);
			} else {
				switch (metaType1.$) {
					case 'MetaVar':
						var var1 = metaType1.a;
						return A3($author$project$Morphir$Type$Solve$unifyVariable, aliases, var1, metaType2);
					case 'MetaTuple':
						var elems1 = metaType1.b;
						return A2(
							handleCommon,
							metaType2,
							A3($author$project$Morphir$Type$Solve$unifyTuple, ir, aliases, elems1));
					case 'MetaRef':
						if (metaType1.d.$ === 'Nothing') {
							var ref1 = metaType1.b;
							var args1 = metaType1.c;
							var _v8 = metaType1.d;
							return A2(
								handleCommon,
								metaType2,
								A4($author$project$Morphir$Type$Solve$unifyRef, ir, aliases, ref1, args1));
						} else {
							var ref1 = metaType1.b;
							var args1 = metaType1.c;
							var aliasedType1 = metaType1.d.a;
							var $temp$ir = ir,
								$temp$aliases = A2(
								$elm$core$List$cons,
								_Utils_Tuple2(ref1, args1),
								aliases),
								$temp$metaType1 = aliasedType1,
								$temp$metaType2 = metaType2;
							ir = $temp$ir;
							aliases = $temp$aliases;
							metaType1 = $temp$metaType1;
							metaType2 = $temp$metaType2;
							continue unifyMetaType;
						}
					case 'MetaFun':
						var arg1 = metaType1.b;
						var return1 = metaType1.c;
						return A2(
							handleCommon,
							metaType2,
							A4($author$project$Morphir$Type$Solve$unifyFun, ir, aliases, arg1, return1));
					case 'MetaRecord':
						var extends1 = metaType1.b;
						var fields1 = metaType1.c;
						return A2(
							handleCommon,
							metaType2,
							A4($author$project$Morphir$Type$Solve$unifyRecord, ir, aliases, extends1, fields1));
					default:
						return A2(
							handleCommon,
							metaType2,
							$author$project$Morphir$Type$Solve$unifyUnit(aliases));
				}
			}
		}
	});
var $author$project$Morphir$Type$Solve$unifyRecord = F5(
	function (refs, aliases, extends1, fields1, metaType2) {
		if (metaType2.$ === 'MetaRecord') {
			var extends2 = metaType2.b;
			var fields2 = metaType2.c;
			return A2(
				$elm$core$Result$andThen,
				function (_v4) {
					var newFields = _v4.a;
					var fieldSolutions = _v4.b;
					if (extends1.$ === 'Just') {
						var extendsVar1 = extends1.a;
						return A3(
							$author$project$Morphir$Type$Solve$mergeSolutions,
							refs,
							fieldSolutions,
							A3(
								$author$project$Morphir$Type$Solve$singleSolution,
								aliases,
								extendsVar1,
								A2($author$project$Morphir$Type$MetaType$metaRecord, extends2, newFields)));
					} else {
						if (extends2.$ === 'Just') {
							var extendsVar2 = extends2.a;
							return A3(
								$author$project$Morphir$Type$Solve$mergeSolutions,
								refs,
								fieldSolutions,
								A3(
									$author$project$Morphir$Type$Solve$singleSolution,
									aliases,
									extendsVar2,
									A2($author$project$Morphir$Type$MetaType$metaRecord, extends1, newFields)));
						} else {
							return $elm$core$Result$Ok(fieldSolutions);
						}
					}
				},
				A5($author$project$Morphir$Type$Solve$unifyFields, refs, extends1, fields1, extends2, fields2));
		} else {
			return $elm$core$Result$Err(
				A3(
					$author$project$Morphir$Type$Solve$CouldNotUnify,
					$author$project$Morphir$Type$Solve$NoUnificationRule,
					A2($author$project$Morphir$Type$MetaType$metaRecord, extends1, fields1),
					metaType2));
		}
	});
var $author$project$Morphir$Type$Solve$unifyRef = F5(
	function (ir, aliases, ref1, args1, metaType2) {
		_v1$2:
		while (true) {
			switch (metaType2.$) {
				case 'MetaRef':
					if (metaType2.d.$ === 'Nothing') {
						var ref2 = metaType2.b;
						var args2 = metaType2.c;
						var _v2 = metaType2.d;
						return _Utils_eq(ref1, ref2) ? (_Utils_eq(
							$elm$core$List$length(args1),
							$elm$core$List$length(args2)) ? A2(
							$elm$core$Result$andThen,
							$author$project$Morphir$Type$Solve$concatSolutions(ir),
							A2(
								$elm$core$Result$mapError,
								$author$project$Morphir$Type$Solve$UnificationErrors,
								$author$project$Morphir$ListOfResults$liftAllErrors(
									A3(
										$elm$core$List$map2,
										A2($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil),
										args1,
										args2)))) : $elm$core$Result$Err(
							A3(
								$author$project$Morphir$Type$Solve$CouldNotUnify,
								$author$project$Morphir$Type$Solve$TuplesOfDifferentSize,
								A2($author$project$Morphir$Type$MetaType$metaRef, ref1, args1),
								metaType2))) : $elm$core$Result$Err(
							A3(
								$author$project$Morphir$Type$Solve$CouldNotUnify,
								$author$project$Morphir$Type$Solve$RefMismatch,
								A2($author$project$Morphir$Type$MetaType$metaRef, ref1, args1),
								metaType2));
					} else {
						break _v1$2;
					}
				case 'MetaRecord':
					var extends2 = metaType2.b;
					var fields2 = metaType2.c;
					return A5(
						$author$project$Morphir$Type$Solve$unifyRecord,
						ir,
						aliases,
						extends2,
						fields2,
						A2($author$project$Morphir$Type$MetaType$metaRef, ref1, args1));
				default:
					break _v1$2;
			}
		}
		return $elm$core$Result$Err(
			A3(
				$author$project$Morphir$Type$Solve$CouldNotUnify,
				$author$project$Morphir$Type$Solve$NoUnificationRule,
				A2($author$project$Morphir$Type$MetaType$metaRef, ref1, args1),
				metaType2));
	});
var $author$project$Morphir$Type$Solve$unifyTuple = F4(
	function (ir, aliases, elems1, metaType2) {
		if (metaType2.$ === 'MetaTuple') {
			var elems2 = metaType2.b;
			return _Utils_eq(
				$elm$core$List$length(elems1),
				$elm$core$List$length(elems2)) ? A2(
				$elm$core$Result$andThen,
				$author$project$Morphir$Type$Solve$concatSolutions(ir),
				A2(
					$elm$core$Result$mapError,
					$author$project$Morphir$Type$Solve$UnificationErrors,
					$author$project$Morphir$ListOfResults$liftAllErrors(
						A3(
							$elm$core$List$map2,
							A2($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil),
							elems1,
							elems2)))) : $elm$core$Result$Err(
				A3(
					$author$project$Morphir$Type$Solve$CouldNotUnify,
					$author$project$Morphir$Type$Solve$TuplesOfDifferentSize,
					$author$project$Morphir$Type$MetaType$metaTuple(elems1),
					metaType2));
		} else {
			return $elm$core$Result$Err(
				A3(
					$author$project$Morphir$Type$Solve$CouldNotUnify,
					$author$project$Morphir$Type$Solve$NoUnificationRule,
					$author$project$Morphir$Type$MetaType$metaTuple(elems1),
					metaType2));
		}
	});
var $author$project$Morphir$Type$Solve$findSubstitution = F2(
	function (ir, constraints) {
		findSubstitution:
		while (true) {
			if (!constraints.b) {
				return $elm$core$Result$Ok($elm$core$Maybe$Nothing);
			} else {
				var firstConstraint = constraints.a;
				var restOfConstraints = constraints.b;
				if (firstConstraint.$ === 'Equality') {
					var metaType1 = firstConstraint.a;
					var metaType2 = firstConstraint.b;
					return A2(
						$elm$core$Result$andThen,
						function (solutions) {
							return $author$project$Morphir$Type$Solve$isEmptySolution(solutions) ? A2($author$project$Morphir$Type$Solve$findSubstitution, ir, restOfConstraints) : $elm$core$Result$Ok(
								$elm$core$Maybe$Just(solutions));
						},
						A4($author$project$Morphir$Type$Solve$unifyMetaType, ir, _List_Nil, metaType1, metaType2));
				} else {
					var $temp$ir = ir,
						$temp$constraints = restOfConstraints;
					ir = $temp$ir;
					constraints = $temp$constraints;
					continue findSubstitution;
				}
			}
		}
	});
var $author$project$Morphir$Type$Infer$ClassConstraintViolation = F2(
	function (a, b) {
		return {$: 'ClassConstraintViolation', a: a, b: b};
	});
var $author$project$Morphir$Type$Infer$RecursiveConstraint = F2(
	function (a, b) {
		return {$: 'RecursiveConstraint', a: a, b: b};
	});
var $elm$core$Dict$values = function (dict) {
	return A3(
		$elm$core$Dict$foldr,
		F3(
			function (key, value, valueList) {
				return A2($elm$core$List$cons, value, valueList);
			}),
		_List_Nil,
		dict);
};
var $author$project$Morphir$Type$MetaType$contains = F2(
	function (innerType, outerType) {
		if (_Utils_eq(innerType, outerType)) {
			return true;
		} else {
			switch (outerType.$) {
				case 'MetaVar':
					return false;
				case 'MetaTuple':
					var metaElems = outerType.b;
					return A2(
						$elm$core$List$any,
						$author$project$Morphir$Type$MetaType$contains(innerType),
						metaElems);
				case 'MetaRecord':
					var metaFields = outerType.c;
					return A2(
						$elm$core$List$any,
						$author$project$Morphir$Type$MetaType$contains(innerType),
						$elm$core$Dict$values(metaFields));
				case 'MetaFun':
					var metaFunc = outerType.b;
					var metaArg = outerType.c;
					return A2($author$project$Morphir$Type$MetaType$contains, innerType, metaFunc) || A2($author$project$Morphir$Type$MetaType$contains, innerType, metaArg);
				case 'MetaRef':
					var args = outerType.c;
					var maybeAliasedType = outerType.d;
					if (maybeAliasedType.$ === 'Just') {
						var aliasedType = maybeAliasedType.a;
						return A2($author$project$Morphir$Type$MetaType$contains, innerType, aliasedType) || A2(
							$elm$core$List$any,
							$author$project$Morphir$Type$MetaType$contains(innerType),
							args);
					} else {
						return A2(
							$elm$core$List$any,
							$author$project$Morphir$Type$MetaType$contains(innerType),
							args);
					}
				default:
					return false;
			}
		}
	});
var $author$project$Morphir$Type$MetaType$removeAliases = function (original) {
	removeAliases:
	while (true) {
		switch (original.$) {
			case 'MetaVar':
				return original;
			case 'MetaTuple':
				var metaElems = original.b;
				return $author$project$Morphir$Type$MetaType$metaTuple(
					A2($elm$core$List$map, $author$project$Morphir$Type$MetaType$removeAliases, metaElems));
			case 'MetaRecord':
				var _extends = original.b;
				var metaFields = original.c;
				return A2(
					$author$project$Morphir$Type$MetaType$metaRecord,
					_extends,
					A2(
						$elm$core$Dict$map,
						F2(
							function (_v1, fieldType) {
								return $author$project$Morphir$Type$MetaType$removeAliases(fieldType);
							}),
						metaFields));
			case 'MetaFun':
				var metaFunc = original.b;
				var metaArg = original.c;
				return A2(
					$author$project$Morphir$Type$MetaType$metaFun,
					$author$project$Morphir$Type$MetaType$removeAliases(metaFunc),
					$author$project$Morphir$Type$MetaType$removeAliases(metaArg));
			case 'MetaRef':
				var fQName = original.b;
				var args = original.c;
				var maybeAliasedType = original.d;
				if (maybeAliasedType.$ === 'Just') {
					var aliasedType = maybeAliasedType.a;
					var $temp$original = aliasedType;
					original = $temp$original;
					continue removeAliases;
				} else {
					return A2(
						$author$project$Morphir$Type$MetaType$metaRef,
						fQName,
						A2($elm$core$List$map, $author$project$Morphir$Type$MetaType$removeAliases, args));
				}
			default:
				return original;
		}
	}
};
var $author$project$Morphir$Type$Constraint$isRecursive = function (constraint) {
	if (constraint.$ === 'Equality') {
		var metaType1 = constraint.a;
		var metaType2 = constraint.b;
		var rawMetaType2 = $author$project$Morphir$Type$MetaType$removeAliases(metaType2);
		var rawMetaType1 = $author$project$Morphir$Type$MetaType$removeAliases(metaType1);
		return (!_Utils_eq(rawMetaType1, rawMetaType2)) && ((!$elm$core$Set$isEmpty(
			$author$project$Morphir$Type$MetaType$variables(rawMetaType1))) && ((!$elm$core$Set$isEmpty(
			$author$project$Morphir$Type$MetaType$variables(rawMetaType2))) && (A2($author$project$Morphir$Type$MetaType$contains, rawMetaType1, rawMetaType2) || A2($author$project$Morphir$Type$MetaType$contains, rawMetaType2, rawMetaType1))));
	} else {
		return false;
	}
};
var $author$project$Morphir$Type$MetaType$intType = A2(
	$author$project$Morphir$Type$MetaType$metaRef,
	A3($author$project$Morphir$IR$FQName$fqn, 'Morphir.SDK', 'Basics', 'Int'),
	_List_Nil);
var $author$project$Morphir$Type$Class$numberTypes = _List_fromArray(
	[$author$project$Morphir$Type$MetaType$intType, $author$project$Morphir$Type$MetaType$floatType]);
var $author$project$Morphir$Type$Class$member = F2(
	function (metaType, _class) {
		var targetType = function (mt) {
			targetType:
			while (true) {
				if ((mt.$ === 'MetaRef') && (mt.d.$ === 'Just')) {
					var t = mt.d.a;
					var $temp$mt = t;
					mt = $temp$mt;
					continue targetType;
				} else {
					return mt;
				}
			}
		};
		return A2(
			$elm$core$List$member,
			targetType(metaType),
			$author$project$Morphir$Type$Class$numberTypes);
	});
var $author$project$Morphir$Type$Infer$TypeErrors = function (a) {
	return {$: 'TypeErrors', a: a};
};
var $author$project$Morphir$Type$Infer$typeErrors = function (errors) {
	if (errors.b && (!errors.b.b)) {
		var single = errors.a;
		return single;
	} else {
		return $author$project$Morphir$Type$Infer$TypeErrors(errors);
	}
};
var $author$project$Morphir$Type$Infer$validateConstraints = function (constraints) {
	return A2(
		$elm$core$Result$mapError,
		$author$project$Morphir$Type$Infer$typeErrors,
		$author$project$Morphir$ListOfResults$liftAllErrors(
			A2(
				$elm$core$List$map,
				function (constraint) {
					if (constraint.$ === 'Class') {
						if (constraint.a.$ === 'MetaVar') {
							return $elm$core$Result$Ok(constraint);
						} else {
							var metaType = constraint.a;
							var _class = constraint.b;
							return A2($author$project$Morphir$Type$Class$member, metaType, _class) ? $elm$core$Result$Ok(constraint) : $elm$core$Result$Err(
								A2($author$project$Morphir$Type$Infer$ClassConstraintViolation, metaType, _class));
						}
					} else {
						var metaType1 = constraint.a;
						var metaType2 = constraint.b;
						return $author$project$Morphir$Type$Constraint$isRecursive(constraint) ? $elm$core$Result$Err(
							A2($author$project$Morphir$Type$Infer$RecursiveConstraint, metaType1, metaType2)) : $elm$core$Result$Ok(constraint);
					}
				},
				constraints)));
};
var $author$project$Morphir$Type$Infer$solveHelp = F3(
	function (refs, solutionsSoFar, constraintSet) {
		solveHelp:
		while (true) {
			var constraints = constraintSet.a;
			var _v0 = $author$project$Morphir$Type$Infer$validateConstraints(constraints);
			if (_v0.$ === 'Ok') {
				var nonTrivialConstraints = _v0.a;
				var _v1 = A2($author$project$Morphir$Type$Solve$findSubstitution, refs, nonTrivialConstraints);
				if (_v1.$ === 'Ok') {
					var maybeNewSolutions = _v1.a;
					if (maybeNewSolutions.$ === 'Nothing') {
						return $elm$core$Result$Ok(
							_Utils_Tuple2(
								$author$project$Morphir$Type$ConstraintSet$fromList(nonTrivialConstraints),
								solutionsSoFar));
					} else {
						var newSolutions = maybeNewSolutions.a;
						var _v3 = A3($author$project$Morphir$Type$Solve$mergeSolutions, refs, newSolutions, solutionsSoFar);
						if (_v3.$ === 'Ok') {
							var mergedSolutions = _v3.a;
							var $temp$refs = refs,
								$temp$solutionsSoFar = mergedSolutions,
								$temp$constraintSet = A2($author$project$Morphir$Type$ConstraintSet$applySubstitutions, mergedSolutions, constraintSet);
							refs = $temp$refs;
							solutionsSoFar = $temp$solutionsSoFar;
							constraintSet = $temp$constraintSet;
							continue solveHelp;
						} else {
							var error = _v3.a;
							return $elm$core$Result$Err(
								$author$project$Morphir$Type$Infer$UnifyError(error));
						}
					}
				} else {
					var error = _v1.a;
					return $elm$core$Result$Err(
						$author$project$Morphir$Type$Infer$UnifyError(error));
				}
			} else {
				var error = _v0.a;
				return $elm$core$Result$Err(error);
			}
		}
	});
var $author$project$Morphir$Type$Infer$solve = F2(
	function (refs, constraintSet) {
		return A3($author$project$Morphir$Type$Infer$solveHelp, refs, $author$project$Morphir$Type$Solve$emptySolution, constraintSet);
	});
var $author$project$Morphir$Type$Infer$inferValue = F2(
	function (ir, untypedValue) {
		var _v0 = A2($author$project$Morphir$Type$Infer$annotateValue, 0, untypedValue);
		var annotatedValue = _v0.a;
		var lastVarIndex = _v0.b;
		var constraints = A3($author$project$Morphir$Type$Infer$constrainValue, ir, $elm$core$Dict$empty, annotatedValue);
		var solution = A2($author$project$Morphir$Type$Infer$solve, ir, constraints);
		return A2(
			$elm$core$Result$map,
			A2($author$project$Morphir$Type$Infer$applySolutionToAnnotatedValue, ir, annotatedValue),
			solution);
	});
var $author$project$Morphir$Visual$VisualTypedValue$rawToVisualTypedValue = F2(
	function (references, rawValue) {
		return A2(
			$elm$core$Result$andThen,
			function (typedValue) {
				return $elm$core$Result$Ok(
					$author$project$Morphir$Visual$VisualTypedValue$typedToVisualTypedValue(
						A3(
							$author$project$Morphir$IR$Value$mapValueAttributes,
							$elm$core$Basics$identity,
							function (_v0) {
								var tpe = _v0.b;
								return tpe;
							},
							typedValue)));
			},
			A2($author$project$Morphir$Type$Infer$inferValue, references, rawValue));
	});
var $mdgriffith$elm_ui$Internal$Model$boxShadowClass = function (shadow) {
	return $elm$core$String$concat(
		_List_fromArray(
			[
				shadow.inset ? 'box-inset' : 'box-',
				$mdgriffith$elm_ui$Internal$Model$floatClass(shadow.offset.a) + 'px',
				$mdgriffith$elm_ui$Internal$Model$floatClass(shadow.offset.b) + 'px',
				$mdgriffith$elm_ui$Internal$Model$floatClass(shadow.blur) + 'px',
				$mdgriffith$elm_ui$Internal$Model$floatClass(shadow.size) + 'px',
				$mdgriffith$elm_ui$Internal$Model$formatColorClass(shadow.color)
			]));
};
var $mdgriffith$elm_ui$Internal$Flag$shadows = $mdgriffith$elm_ui$Internal$Flag$flag(19);
var $mdgriffith$elm_ui$Element$Border$shadow = function (almostShade) {
	var shade = {blur: almostShade.blur, color: almostShade.color, inset: false, offset: almostShade.offset, size: almostShade.size};
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$shadows,
		A3(
			$mdgriffith$elm_ui$Internal$Model$Single,
			$mdgriffith$elm_ui$Internal$Model$boxShadowClass(shade),
			'box-shadow',
			$mdgriffith$elm_ui$Internal$Model$formatBoxShadow(shade)));
};
var $elm$virtual_dom$VirtualDom$style = _VirtualDom_style;
var $elm$html$Html$Attributes$style = $elm$virtual_dom$VirtualDom$style;
var $author$project$Morphir$Type$Class$toString = function (_class) {
	return 'number';
};
var $author$project$Morphir$IR$Name$toSnakeCase = function (name) {
	return A2(
		$elm$core$String$join,
		'_',
		$author$project$Morphir$IR$Name$toHumanWords(name));
};
var $author$project$Morphir$Type$MetaType$toString = function (metaType) {
	switch (metaType.$) {
		case 'MetaVar':
			var _var = metaType.a;
			return 'var_' + $author$project$Morphir$IR$Name$toSnakeCase(
				$author$project$Morphir$Type$MetaType$toName(_var));
		case 'MetaRef':
			var fQName = metaType.b;
			var args = metaType.c;
			var maybeAliasedType = metaType.d;
			var refString = $elm$core$List$isEmpty(args) ? $author$project$Morphir$IR$FQName$toString(fQName) : A2(
				$elm$core$String$join,
				' ',
				_List_fromArray(
					[
						$author$project$Morphir$IR$FQName$toString(fQName),
						A2(
						$elm$core$String$join,
						' ',
						A2(
							$elm$core$List$map,
							function (arg) {
								return $elm$core$String$concat(
									_List_fromArray(
										[
											'(',
											$author$project$Morphir$Type$MetaType$toString(arg),
											')'
										]));
							},
							args))
					]));
			if (maybeAliasedType.$ === 'Just') {
				var aliasedType = maybeAliasedType.a;
				return $elm$core$String$concat(
					_List_fromArray(
						[
							refString,
							' = ',
							$author$project$Morphir$Type$MetaType$toString(aliasedType)
						]));
			} else {
				return refString;
			}
		case 'MetaTuple':
			var metaTypes = metaType.b;
			return $elm$core$String$concat(
				_List_fromArray(
					[
						'( ',
						A2(
						$elm$core$String$join,
						', ',
						A2($elm$core$List$map, $author$project$Morphir$Type$MetaType$toString, metaTypes)),
						' )'
					]));
		case 'MetaRecord':
			var _extends = metaType.b;
			var fields = metaType.c;
			var prefix = function () {
				if (_extends.$ === 'Just') {
					var _var = _extends.a;
					return 'var_' + $author$project$Morphir$IR$Name$toSnakeCase(
						$author$project$Morphir$Type$MetaType$toName(_var));
				} else {
					return '';
				}
			}();
			var fieldStrings = A2(
				$elm$core$List$map,
				function (_v2) {
					var fieldName = _v2.a;
					var fieldType = _v2.b;
					return $elm$core$String$concat(
						_List_fromArray(
							[
								$author$project$Morphir$IR$Name$toCamelCase(fieldName),
								' : ',
								$author$project$Morphir$Type$MetaType$toString(fieldType)
							]));
				},
				$elm$core$Dict$toList(fields));
			return $elm$core$String$concat(
				_List_fromArray(
					[
						'{ ',
						prefix,
						A2($elm$core$String$join, ', ', fieldStrings),
						' }'
					]));
		case 'MetaFun':
			var argType = metaType.b;
			var returnType = metaType.c;
			return $elm$core$String$concat(
				_List_fromArray(
					[
						$author$project$Morphir$Type$MetaType$toString(argType),
						' -> ',
						$author$project$Morphir$Type$MetaType$toString(returnType)
					]));
		default:
			return '()';
	}
};
var $author$project$Morphir$Type$Infer$typeErrorToMessage = function (typeError) {
	switch (typeError.$) {
		case 'TypeErrors':
			var errors = typeError.a;
			return $elm$core$String$concat(
				_List_fromArray(
					[
						'Multiple errors: ',
						A2(
						$elm$core$String$join,
						', ',
						A2($elm$core$List$map, $author$project$Morphir$Type$Infer$typeErrorToMessage, errors))
					]));
		case 'ClassConstraintViolation':
			var metaType = typeError.a;
			var _class = typeError.b;
			return $elm$core$String$concat(
				_List_fromArray(
					[
						'Type \'',
						$author$project$Morphir$Type$MetaType$toString(metaType),
						'\' is not a ',
						$author$project$Morphir$Type$Class$toString(_class)
					]));
		case 'LookupError':
			var lookupError = typeError.a;
			switch (lookupError.$) {
				case 'CouldNotFindConstructor':
					var fQName = lookupError.a;
					return $elm$core$String$concat(
						_List_fromArray(
							[
								'Could not find constructor: ',
								$author$project$Morphir$IR$FQName$toString(fQName)
							]));
				case 'CouldNotFindValue':
					var fQName = lookupError.a;
					return $elm$core$String$concat(
						_List_fromArray(
							[
								'Could not find value: ',
								$author$project$Morphir$IR$FQName$toString(fQName)
							]));
				case 'CouldNotFindAlias':
					var fQName = lookupError.a;
					return $elm$core$String$concat(
						_List_fromArray(
							[
								'Could not find alias: ',
								$author$project$Morphir$IR$FQName$toString(fQName)
							]));
				default:
					var fQName = lookupError.a;
					return $elm$core$String$concat(
						_List_fromArray(
							[
								'Expected alias at: ',
								$author$project$Morphir$IR$FQName$toString(fQName)
							]));
			}
		case 'UnknownError':
			var message = typeError.a;
			return $elm$core$String$concat(
				_List_fromArray(
					['Unknown error: ', message]));
		case 'UnifyError':
			var unificationError = typeError.a;
			var mapUnificationError = function (uniError) {
				switch (uniError.$) {
					case 'CouldNotUnify':
						var errorType = uniError.a;
						var metaType1 = uniError.b;
						var metaType2 = uniError.c;
						var cause = function () {
							switch (errorType.$) {
								case 'NoUnificationRule':
									return 'there are no unification rules to apply';
								case 'TuplesOfDifferentSize':
									return 'they are tuples of different sizes';
								case 'RefMismatch':
									return 'the references do not match';
								default:
									return 'the fields don\'t match';
							}
						}();
						return $elm$core$String$concat(
							_List_fromArray(
								[
									'Could not unify \'',
									$author$project$Morphir$Type$MetaType$toString(metaType1),
									'\' with \'',
									$author$project$Morphir$Type$MetaType$toString(metaType2),
									'\' because ',
									cause
								]));
					case 'UnificationErrors':
						var unificationErrors = uniError.a;
						return A2(
							$elm$core$String$join,
							'. ',
							A2($elm$core$List$map, mapUnificationError, unificationErrors));
					default:
						var name = uniError.a;
						return $elm$core$String$concat(
							_List_fromArray(
								[
									'Could not find field \'',
									$author$project$Morphir$IR$Name$toCamelCase(name),
									'\''
								]));
				}
			};
			return mapUnificationError(unificationError);
		default:
			var metaType1 = typeError.a;
			var metaType2 = typeError.b;
			return $elm$core$String$concat(
				_List_fromArray(
					[
						'Recursive constraint: \'',
						$author$project$Morphir$Type$MetaType$toString(metaType1),
						'\' == \'',
						$author$project$Morphir$Type$MetaType$toString(metaType2),
						'\''
					]));
	}
};
var $mdgriffith$elm_ui$Internal$Model$AlignX = function (a) {
	return {$: 'AlignX', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$CenterX = {$: 'CenterX'};
var $mdgriffith$elm_ui$Element$centerX = $mdgriffith$elm_ui$Internal$Model$AlignX($mdgriffith$elm_ui$Internal$Model$CenterX);
var $author$project$Morphir$Visual$ViewApply$inlineBinaryOperators = $elm$core$Dict$fromList(
	_List_fromArray(
		[
			_Utils_Tuple2('Basics.equal', '='),
			_Utils_Tuple2('Basics.lessThan', '<'),
			_Utils_Tuple2('Basics.lessThanOrEqual', '<='),
			_Utils_Tuple2('Basics.greaterThan', '>'),
			_Utils_Tuple2('Basics.greaterThanOrEqual', '>='),
			_Utils_Tuple2('Basics.add', '+'),
			_Utils_Tuple2('Basics.subtract', '-'),
			_Utils_Tuple2('Basics.multiply', '*'),
			_Utils_Tuple2('Basics.divide', '/'),
			_Utils_Tuple2('List.append', '+'),
			_Utils_Tuple2('Basics.notEqual', '≠'),
			_Utils_Tuple2('Basics.power', '^')
		]));
var $mdgriffith$elm_ui$Internal$Model$MoveY = function (a) {
	return {$: 'MoveY', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$TransformComponent = F2(
	function (a, b) {
		return {$: 'TransformComponent', a: a, b: b};
	});
var $mdgriffith$elm_ui$Internal$Flag$moveY = $mdgriffith$elm_ui$Internal$Flag$flag(26);
var $mdgriffith$elm_ui$Element$moveUp = function (y) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$TransformComponent,
		$mdgriffith$elm_ui$Internal$Flag$moveY,
		$mdgriffith$elm_ui$Internal$Model$MoveY(-y));
};
var $author$project$Morphir$Visual$ViewApply$view = F4(
	function (config, viewValue, functionValue, argValues) {
		var _v0 = _Utils_Tuple2(functionValue, argValues);
		_v0$0:
		while (true) {
			_v0$3:
			while (true) {
				_v0$5:
				while (true) {
					if ((_v0.a.$ === 'Reference') && _v0.b.b) {
						if (!_v0.b.b.b) {
							if (_v0.a.b.c.b) {
								if (((((((((((((((((_v0.a.b.a.b && _v0.a.b.a.a.b) && (_v0.a.b.a.a.a === 'morphir')) && (!_v0.a.b.a.a.b.b)) && _v0.a.b.a.b.b) && _v0.a.b.a.b.a.b) && (_v0.a.b.a.b.a.a === 's')) && _v0.a.b.a.b.a.b.b) && (_v0.a.b.a.b.a.b.a === 'd')) && _v0.a.b.a.b.a.b.b.b) && (_v0.a.b.a.b.a.b.b.a === 'k')) && (!_v0.a.b.a.b.a.b.b.b.b)) && (!_v0.a.b.a.b.b.b)) && _v0.a.b.b.b) && _v0.a.b.b.a.b) && (_v0.a.b.b.a.a === 'basics')) && (!_v0.a.b.b.a.b.b)) && (!_v0.a.b.b.b.b)) {
									switch (_v0.a.b.c.a) {
										case 'is':
											break _v0$0;
										case 'negate':
											if (!_v0.a.b.c.b.b) {
												var _v4 = _v0.a;
												var _v5 = _v4.b;
												var _v6 = _v5.a;
												var _v7 = _v6.a;
												var _v8 = _v6.b;
												var _v9 = _v8.a;
												var _v10 = _v9.b;
												var _v11 = _v10.b;
												var _v12 = _v5.b;
												var _v13 = _v12.a;
												var _v14 = _v5.c;
												var _v15 = _v0.b;
												var argValue = _v15.a;
												return A2(
													$mdgriffith$elm_ui$Element$row,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$spacing(
															$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
														]),
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$text('- ('),
															viewValue(argValue),
															$mdgriffith$elm_ui$Element$text(')')
														]));
											} else {
												break _v0$3;
											}
										case 'abs':
											if (!_v0.a.b.c.b.b) {
												var _v16 = _v0.a;
												var _v17 = _v16.b;
												var _v18 = _v17.a;
												var _v19 = _v18.a;
												var _v20 = _v18.b;
												var _v21 = _v20.a;
												var _v22 = _v21.b;
												var _v23 = _v22.b;
												var _v24 = _v17.b;
												var _v25 = _v24.a;
												var _v26 = _v17.c;
												var _v27 = _v0.b;
												var argValue = _v27.a;
												return A2(
													$mdgriffith$elm_ui$Element$row,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$spacing(
															$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
														]),
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$text('abs ('),
															viewValue(argValue),
															$mdgriffith$elm_ui$Element$text(')')
														]));
											} else {
												break _v0$3;
											}
										default:
											break _v0$3;
									}
								} else {
									if (_v0.a.b.c.a === 'is') {
										break _v0$0;
									} else {
										break _v0$5;
									}
								}
							} else {
								if (((((((((((((((((_v0.a.b.a.b && _v0.a.b.a.a.b) && (_v0.a.b.a.a.a === 'morphir')) && (!_v0.a.b.a.a.b.b)) && _v0.a.b.a.b.b) && _v0.a.b.a.b.a.b) && (_v0.a.b.a.b.a.a === 's')) && _v0.a.b.a.b.a.b.b) && (_v0.a.b.a.b.a.b.a === 'd')) && _v0.a.b.a.b.a.b.b.b) && (_v0.a.b.a.b.a.b.b.a === 'k')) && (!_v0.a.b.a.b.a.b.b.b.b)) && (!_v0.a.b.a.b.b.b)) && _v0.a.b.b.b) && _v0.a.b.b.a.b) && (_v0.a.b.b.a.a === 'basics')) && (!_v0.a.b.b.a.b.b)) && (!_v0.a.b.b.b.b)) {
									break _v0$3;
								} else {
									break _v0$5;
								}
							}
						} else {
							if (((((((((((((_v0.a.b.a.b && _v0.a.b.a.a.b) && (_v0.a.b.a.a.a === 'morphir')) && (!_v0.a.b.a.a.b.b)) && _v0.a.b.a.b.b) && _v0.a.b.a.b.a.b) && (_v0.a.b.a.b.a.a === 's')) && _v0.a.b.a.b.a.b.b) && (_v0.a.b.a.b.a.b.a === 'd')) && _v0.a.b.a.b.a.b.b.b) && (_v0.a.b.a.b.a.b.b.a === 'k')) && (!_v0.a.b.a.b.a.b.b.b.b)) && (!_v0.a.b.a.b.b.b)) && (!_v0.b.b.b.b)) {
								var _v39 = _v0.a;
								var _v40 = _v39.b;
								var _v41 = _v40.a;
								var _v42 = _v41.a;
								var _v43 = _v41.b;
								var _v44 = _v43.a;
								var _v45 = _v44.b;
								var _v46 = _v45.b;
								var moduleName = _v40.b;
								var localName = _v40.c;
								var _v47 = _v0.b;
								var argValues1 = _v47.a;
								var _v48 = _v47.b;
								var argValues2 = _v48.a;
								var functionName = A2(
									$elm$core$String$join,
									'.',
									_List_fromArray(
										[
											A3($author$project$Morphir$IR$Path$toString, $author$project$Morphir$IR$Name$toTitleCase, '.', moduleName),
											$author$project$Morphir$IR$Name$toCamelCase(localName)
										]));
								return (_Utils_eq(
									moduleName,
									_List_fromArray(
										[
											_List_fromArray(
											['basics'])
										])) && (_Utils_eq(
									localName,
									_List_fromArray(
										['min'])) || _Utils_eq(
									localName,
									_List_fromArray(
										['max'])))) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$spacing(
											$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
										]),
									_List_fromArray(
										[
											viewValue(functionValue),
											$mdgriffith$elm_ui$Element$text(' ('),
											viewValue(argValues1),
											$mdgriffith$elm_ui$Element$text(','),
											viewValue(argValues2),
											$mdgriffith$elm_ui$Element$text(')')
										])) : ((_Utils_eq(
									moduleName,
									_List_fromArray(
										[
											_List_fromArray(
											['basics'])
										])) && _Utils_eq(
									localName,
									_List_fromArray(
										['power']))) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$spacing(
											$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
										]),
									_List_fromArray(
										[
											viewValue(argValues1),
											A2(
											$mdgriffith$elm_ui$Element$el,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$Font$bold,
													$mdgriffith$elm_ui$Element$Font$size(
													$elm$core$Basics$ceiling(config.state.theme.fontSize / 1.3)),
													$mdgriffith$elm_ui$Element$moveUp((config.state.theme.fontSize / 4) | 0)
												]),
											viewValue(argValues2))
										])) : A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$spacing(
											$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme)),
											$mdgriffith$elm_ui$Element$padding(
											$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
										]),
									_List_fromArray(
										[
											viewValue(argValues1),
											function () {
											var _v49 = A2($elm$core$Dict$get, functionName, $author$project$Morphir$Visual$ViewApply$inlineBinaryOperators);
											if (_v49.$ === 'Just') {
												var string = _v49.a;
												return $mdgriffith$elm_ui$Element$text(string);
											} else {
												return viewValue(functionValue);
											}
										}(),
											viewValue(argValues2)
										])));
							} else {
								break _v0$5;
							}
						}
					} else {
						break _v0$5;
					}
				}
				return A2(
					$mdgriffith$elm_ui$Element$column,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$spacing(
							$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
						]),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Element$column,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
									$mdgriffith$elm_ui$Element$centerX,
									$mdgriffith$elm_ui$Element$spacing(
									$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
								]),
							_List_fromArray(
								[
									viewValue(functionValue)
								])),
							A2(
							$mdgriffith$elm_ui$Element$column,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
									$mdgriffith$elm_ui$Element$centerX,
									$mdgriffith$elm_ui$Element$spacing(
									$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
								]),
							A2($elm$core$List$map, viewValue, argValues))
						]));
			}
			var _v28 = _v0.a;
			var _v29 = _v28.b;
			var _v30 = _v29.a;
			var _v31 = _v30.a;
			var _v32 = _v30.b;
			var _v33 = _v32.a;
			var _v34 = _v33.b;
			var _v35 = _v34.b;
			var _v36 = _v29.b;
			var _v37 = _v36.a;
			var localName = _v29.c;
			var _v38 = _v0.b;
			var argValue = _v38.a;
			return A2(
				$mdgriffith$elm_ui$Element$row,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$spacing(
						$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme)),
						$mdgriffith$elm_ui$Element$padding(
						$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
					]),
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$IR$Name$toCamelCase(localName) + ' ('),
						viewValue(argValue),
						$mdgriffith$elm_ui$Element$text(')')
					]));
		}
		var _v1 = _v0.a;
		var _v2 = _v1.b;
		var localName = _v2.c;
		var _v3 = _v0.b;
		var argValue = _v3.a;
		return A2(
			$mdgriffith$elm_ui$Element$row,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
					$mdgriffith$elm_ui$Element$spacing(
					$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
				]),
			_List_fromArray(
				[
					viewValue(argValue),
					$mdgriffith$elm_ui$Element$text(
					$author$project$Morphir$Visual$Common$nameToText(localName))
				]));
	});
var $mdgriffith$elm_ui$Internal$Flag$borderColor = $mdgriffith$elm_ui$Internal$Flag$flag(28);
var $mdgriffith$elm_ui$Element$Border$color = function (clr) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$borderColor,
		A3(
			$mdgriffith$elm_ui$Internal$Model$Colored,
			'bc-' + $mdgriffith$elm_ui$Internal$Model$formatColorClass(clr),
			'border-color',
			clr));
};
var $author$project$Morphir$Visual$ViewArithmetic$currentPrecedence = function (operatorName) {
	switch (operatorName) {
		case 'Basics.add':
			return 1;
		case 'Basics.subtract':
			return 1;
		case 'Basics.multiply':
			return 2;
		case 'Basics.divide':
			return 2;
		default:
			return 0;
	}
};
var $author$project$Morphir$Visual$ViewArithmetic$functionName = function (ao) {
	switch (ao.$) {
		case 'Add':
			return 'Basics.add';
		case 'Subtract':
			return 'Basics.subtract';
		default:
			return 'Basics.multiply';
	}
};
var $author$project$Morphir$Visual$ViewArithmetic$dropInPrecedence = F5(
	function (arithmeticOperatorTrees, index, currentPointer, currentPrecedenceValue, previousOperator) {
		dropInPrecedence:
		while (true) {
			if (_Utils_cmp(currentPointer, index) < 0) {
				var $temp$arithmeticOperatorTrees = A2($elm$core$List$drop, 1, arithmeticOperatorTrees),
					$temp$index = index,
					$temp$currentPointer = currentPointer + 1,
					$temp$currentPrecedenceValue = currentPrecedenceValue,
					$temp$previousOperator = previousOperator;
				arithmeticOperatorTrees = $temp$arithmeticOperatorTrees;
				index = $temp$index;
				currentPointer = $temp$currentPointer;
				currentPrecedenceValue = $temp$currentPrecedenceValue;
				previousOperator = $temp$previousOperator;
				continue dropInPrecedence;
			} else {
				var _v0 = $elm$core$List$head(arithmeticOperatorTrees);
				if (_v0.$ === 'Just') {
					var a = _v0.a;
					switch (a.$) {
						case 'ArithmeticOperatorBranch':
							var arithmeticOperator = a.a;
							var arithmeticOperatorTrees1 = a.b;
							return (_Utils_cmp(
								$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
									$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
								$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
									$author$project$Morphir$Visual$ViewArithmetic$functionName(previousOperator))) < 0) ? true : false;
						case 'ArithmeticValueLeaf':
							var typedValue = a.a;
							var $temp$arithmeticOperatorTrees = A2($elm$core$List$drop, 2, arithmeticOperatorTrees),
								$temp$index = index,
								$temp$currentPointer = currentPointer + 2,
								$temp$currentPrecedenceValue = currentPrecedenceValue,
								$temp$previousOperator = previousOperator;
							arithmeticOperatorTrees = $temp$arithmeticOperatorTrees;
							index = $temp$index;
							currentPointer = $temp$currentPointer;
							currentPrecedenceValue = $temp$currentPrecedenceValue;
							previousOperator = $temp$previousOperator;
							continue dropInPrecedence;
						default:
							if ((a.a.b && a.a.b.b) && (!a.a.b.b.b)) {
								var _v3 = a.a;
								var arithmeticOperatorTree = _v3.a;
								var _v4 = _v3.b;
								var arithmeticOperatorTree1 = _v4.a;
								return (_Utils_cmp(
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence('Basics.divide'),
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
										$author$project$Morphir$Visual$ViewArithmetic$functionName(previousOperator))) < 0) ? true : false;
							} else {
								return false;
							}
					}
				} else {
					return false;
				}
			}
		}
	});
var $author$project$Morphir$Visual$ViewArithmetic$functionNameHelper = function (ao) {
	switch (ao.$) {
		case 'Add':
			return 'Add';
		case 'Subtract':
			return 'Subtract';
		default:
			return 'Multiply';
	}
};
var $author$project$Morphir$Visual$ViewArithmetic$inlineBinaryOperators = $elm$core$Dict$fromList(
	_List_fromArray(
		[
			_Utils_Tuple2('Basics.equal', '='),
			_Utils_Tuple2('Basics.lessThan', '<'),
			_Utils_Tuple2('Basics.lessThanOrEqual', '<='),
			_Utils_Tuple2('Basics.greaterThan', '>'),
			_Utils_Tuple2('Basics.greaterThanOrEqual', '>='),
			_Utils_Tuple2('Add', '+'),
			_Utils_Tuple2('Subtract', '-'),
			_Utils_Tuple2('Multiply', '*')
		]));
var $author$project$Morphir$Visual$ViewArithmetic$riseInPrecedence = F5(
	function (arithmeticOperatorTrees, index, currentPointer, currentPrecedenceValue, previousOperator) {
		riseInPrecedence:
		while (true) {
			if (_Utils_cmp(currentPointer, index) < 0) {
				var $temp$arithmeticOperatorTrees = A2($elm$core$List$drop, 1, arithmeticOperatorTrees),
					$temp$index = index,
					$temp$currentPointer = currentPointer + 1,
					$temp$currentPrecedenceValue = currentPrecedenceValue,
					$temp$previousOperator = previousOperator;
				arithmeticOperatorTrees = $temp$arithmeticOperatorTrees;
				index = $temp$index;
				currentPointer = $temp$currentPointer;
				currentPrecedenceValue = $temp$currentPrecedenceValue;
				previousOperator = $temp$previousOperator;
				continue riseInPrecedence;
			} else {
				var _v0 = $elm$core$List$head(arithmeticOperatorTrees);
				if (_v0.$ === 'Just') {
					var a = _v0.a;
					switch (a.$) {
						case 'ArithmeticOperatorBranch':
							var arithmeticOperator = a.a;
							var arithmeticOperatorTrees1 = a.b;
							return (_Utils_cmp(
								$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
									$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
								$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
									$author$project$Morphir$Visual$ViewArithmetic$functionName(previousOperator))) > 0) ? true : false;
						case 'ArithmeticValueLeaf':
							var typedValue = a.a;
							var $temp$arithmeticOperatorTrees = A2($elm$core$List$drop, 2, arithmeticOperatorTrees),
								$temp$index = index,
								$temp$currentPointer = currentPointer + 2,
								$temp$currentPrecedenceValue = currentPrecedenceValue,
								$temp$previousOperator = previousOperator;
							arithmeticOperatorTrees = $temp$arithmeticOperatorTrees;
							index = $temp$index;
							currentPointer = $temp$currentPointer;
							currentPrecedenceValue = $temp$currentPrecedenceValue;
							previousOperator = $temp$previousOperator;
							continue riseInPrecedence;
						default:
							if ((a.a.b && a.a.b.b) && (!a.a.b.b.b)) {
								var _v3 = a.a;
								var arithmeticOperatorTree = _v3.a;
								var _v4 = _v3.b;
								var arithmeticOperatorTree1 = _v4.a;
								return (_Utils_cmp(
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence('Basics.divide'),
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
										$author$project$Morphir$Visual$ViewArithmetic$functionName(previousOperator))) > 0) ? true : false;
							} else {
								return false;
							}
					}
				} else {
					return false;
				}
			}
		}
	});
var $mdgriffith$elm_ui$Internal$Model$BorderWidth = F5(
	function (a, b, c, d, e) {
		return {$: 'BorderWidth', a: a, b: b, c: c, d: d, e: e};
	});
var $mdgriffith$elm_ui$Element$Border$width = function (v) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$borderWidth,
		A5(
			$mdgriffith$elm_ui$Internal$Model$BorderWidth,
			'b-' + $elm$core$String$fromInt(v),
			v,
			v,
			v,
			v));
};
var $mdgriffith$elm_ui$Element$Border$widthXY = F2(
	function (x, y) {
		return A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$borderWidth,
			A5(
				$mdgriffith$elm_ui$Internal$Model$BorderWidth,
				'b-' + ($elm$core$String$fromInt(x) + ('-' + $elm$core$String$fromInt(y))),
				y,
				x,
				y,
				x));
	});
var $mdgriffith$elm_ui$Element$Border$widthEach = function (_v0) {
	var bottom = _v0.bottom;
	var top = _v0.top;
	var left = _v0.left;
	var right = _v0.right;
	return (_Utils_eq(top, bottom) && _Utils_eq(left, right)) ? (_Utils_eq(top, right) ? $mdgriffith$elm_ui$Element$Border$width(top) : A2($mdgriffith$elm_ui$Element$Border$widthXY, left, top)) : A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$borderWidth,
		A5(
			$mdgriffith$elm_ui$Internal$Model$BorderWidth,
			'b-' + ($elm$core$String$fromInt(top) + ('-' + ($elm$core$String$fromInt(right) + ('-' + ($elm$core$String$fromInt(bottom) + ('-' + $elm$core$String$fromInt(left))))))),
			top,
			right,
			bottom,
			left));
};
var $author$project$Morphir$Visual$ViewArithmetic$view = F3(
	function (config, viewValue, arithmeticOperatorTree) {
		switch (arithmeticOperatorTree.$) {
			case 'ArithmeticOperatorBranch':
				var arithmeticOperator = arithmeticOperatorTree.a;
				var arithmeticOperatorTrees = arithmeticOperatorTree.b;
				var separator = A2(
					$mdgriffith$elm_ui$Element$row,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$spacing(5),
							$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
							$mdgriffith$elm_ui$Element$centerX
						]),
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$text(
							A2(
								$elm$core$Maybe$withDefault,
								'',
								A2(
									$elm$core$Dict$get,
									$author$project$Morphir$Visual$ViewArithmetic$functionNameHelper(arithmeticOperator),
									$author$project$Morphir$Visual$ViewArithmetic$inlineBinaryOperators)))
						]));
				return A2(
					$mdgriffith$elm_ui$Element$row,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$spacing(5),
							$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
							$mdgriffith$elm_ui$Element$centerX
						]),
					A2(
						$elm$core$List$indexedMap,
						F2(
							function (i, b) {
								return (A5(
									$author$project$Morphir$Visual$ViewArithmetic$dropInPrecedence,
									arithmeticOperatorTrees,
									i,
									0,
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
										$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
									arithmeticOperator) && (_Utils_cmp(
									i,
									$elm$core$List$length(arithmeticOperatorTrees) - 1) < 0)) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$padding(2),
											$mdgriffith$elm_ui$Element$spacing(5),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$text('('),
											b,
											$mdgriffith$elm_ui$Element$text(')'),
											separator
										])) : (A5(
									$author$project$Morphir$Visual$ViewArithmetic$dropInPrecedence,
									arithmeticOperatorTrees,
									i,
									0,
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
										$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
									arithmeticOperator) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$padding(2),
											$mdgriffith$elm_ui$Element$spacing(5),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$text('('),
											b,
											$mdgriffith$elm_ui$Element$text(')')
										])) : ((A5(
									$author$project$Morphir$Visual$ViewArithmetic$riseInPrecedence,
									arithmeticOperatorTrees,
									i,
									0,
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
										$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
									arithmeticOperator) && (_Utils_cmp(
									i,
									$elm$core$List$length(arithmeticOperatorTrees) - 1) < 0)) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$padding(2),
											$mdgriffith$elm_ui$Element$spacing(5),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[b, separator])) : (A5(
									$author$project$Morphir$Visual$ViewArithmetic$riseInPrecedence,
									arithmeticOperatorTrees,
									i,
									0,
									$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
										$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
									arithmeticOperator) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$padding(2),
											$mdgriffith$elm_ui$Element$spacing(5),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[b])) : ((_Utils_cmp(
									i,
									$elm$core$List$length(arithmeticOperatorTrees) - 1) < 0) ? A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$padding(2),
											$mdgriffith$elm_ui$Element$spacing(5),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[b, separator])) : A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$padding(2),
											$mdgriffith$elm_ui$Element$spacing(5),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[b]))))));
							}),
						A2(
							$elm$core$List$map,
							A2($author$project$Morphir$Visual$ViewArithmetic$view, config, viewValue),
							arithmeticOperatorTrees)));
			case 'ArithmeticDivisionBranch':
				if ((arithmeticOperatorTree.a.b && arithmeticOperatorTree.a.b.b) && (!arithmeticOperatorTree.a.b.b.b)) {
					var _v1 = arithmeticOperatorTree.a;
					var arithmeticOperatorTree1 = _v1.a;
					var _v2 = _v1.b;
					var arithmeticOperatorTree2 = _v2.a;
					if (arithmeticOperatorTree1.$ === 'ArithmeticValueLeaf') {
						var typedValue1 = arithmeticOperatorTree1.a;
						switch (arithmeticOperatorTree2.$) {
							case 'ArithmeticValueLeaf':
								var typedValue2 = arithmeticOperatorTree2.a;
								return A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$centerX,
											$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
											$mdgriffith$elm_ui$Element$spacing(5)
										]),
									_List_fromArray(
										[
											A2(
											$mdgriffith$elm_ui$Element$column,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$centerX,
													$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
												]),
											_List_fromArray(
												[
													A2(
													$mdgriffith$elm_ui$Element$row,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$centerX,
															$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
														]),
													_List_fromArray(
														[
															A2(
															$mdgriffith$elm_ui$Element$row,
															_List_fromArray(
																[
																	$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
																	$mdgriffith$elm_ui$Element$spacing(
																	$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme)),
																	$mdgriffith$elm_ui$Element$Border$color(
																	A3($mdgriffith$elm_ui$Element$rgb, 0, 0.7, 0)),
																	$mdgriffith$elm_ui$Element$padding(
																	$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
																	$mdgriffith$elm_ui$Element$centerX
																]),
															_List_fromArray(
																[
																	viewValue(typedValue1)
																]))
														])),
													A2(
													$mdgriffith$elm_ui$Element$row,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$centerX,
															$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
															$mdgriffith$elm_ui$Element$Border$solid,
															$mdgriffith$elm_ui$Element$Border$widthEach(
															{bottom: 0, left: 0, right: 0, top: 1}),
															$mdgriffith$elm_ui$Element$padding(
															$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
														]),
													_List_fromArray(
														[
															viewValue(typedValue2)
														]))
												]))
										]));
							case 'ArithmeticOperatorBranch':
								var arithmeticOperator = arithmeticOperatorTree2.a;
								var arithmeticOperatorTrees = arithmeticOperatorTree2.b;
								var separator = A2(
									$mdgriffith$elm_ui$Element$row,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$spacing(
											$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme)),
											$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
											$mdgriffith$elm_ui$Element$centerX
										]),
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$text(
											A2(
												$elm$core$Maybe$withDefault,
												'',
												A2(
													$elm$core$Dict$get,
													$author$project$Morphir$Visual$ViewArithmetic$functionNameHelper(arithmeticOperator),
													$author$project$Morphir$Visual$ViewArithmetic$inlineBinaryOperators)))
										]));
								var mainBody = A2(
									$elm$core$List$indexedMap,
									F2(
										function (i, b) {
											return (A5(
												$author$project$Morphir$Visual$ViewArithmetic$dropInPrecedence,
												arithmeticOperatorTrees,
												i,
												0,
												$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
													$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
												arithmeticOperator) && (_Utils_cmp(
												i,
												$elm$core$List$length(arithmeticOperatorTrees) - 1) < 0)) ? A2(
												$mdgriffith$elm_ui$Element$row,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(2),
														$mdgriffith$elm_ui$Element$spacing(5),
														$mdgriffith$elm_ui$Element$centerX
													]),
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$text('('),
														b,
														$mdgriffith$elm_ui$Element$text(')'),
														separator
													])) : (A5(
												$author$project$Morphir$Visual$ViewArithmetic$dropInPrecedence,
												arithmeticOperatorTrees,
												i,
												0,
												$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
													$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
												arithmeticOperator) ? A2(
												$mdgriffith$elm_ui$Element$row,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(2),
														$mdgriffith$elm_ui$Element$spacing(5),
														$mdgriffith$elm_ui$Element$centerX
													]),
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$text('('),
														b,
														$mdgriffith$elm_ui$Element$text(')')
													])) : ((A5(
												$author$project$Morphir$Visual$ViewArithmetic$riseInPrecedence,
												arithmeticOperatorTrees,
												i,
												0,
												$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
													$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
												arithmeticOperator) && (_Utils_cmp(
												i,
												$elm$core$List$length(arithmeticOperatorTrees) - 1) < 0)) ? A2(
												$mdgriffith$elm_ui$Element$row,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(2),
														$mdgriffith$elm_ui$Element$spacing(5),
														$mdgriffith$elm_ui$Element$centerX
													]),
												_List_fromArray(
													[b, separator])) : (A5(
												$author$project$Morphir$Visual$ViewArithmetic$riseInPrecedence,
												arithmeticOperatorTrees,
												i,
												0,
												$author$project$Morphir$Visual$ViewArithmetic$currentPrecedence(
													$author$project$Morphir$Visual$ViewArithmetic$functionName(arithmeticOperator)),
												arithmeticOperator) ? A2(
												$mdgriffith$elm_ui$Element$row,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(2),
														$mdgriffith$elm_ui$Element$spacing(5),
														$mdgriffith$elm_ui$Element$centerX
													]),
												_List_fromArray(
													[b])) : ((_Utils_cmp(
												i,
												$elm$core$List$length(arithmeticOperatorTrees) - 1) < 0) ? A2(
												$mdgriffith$elm_ui$Element$row,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(2),
														$mdgriffith$elm_ui$Element$spacing(5),
														$mdgriffith$elm_ui$Element$centerX
													]),
												_List_fromArray(
													[b, separator])) : A2(
												$mdgriffith$elm_ui$Element$row,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(2),
														$mdgriffith$elm_ui$Element$spacing(5),
														$mdgriffith$elm_ui$Element$centerX
													]),
												_List_fromArray(
													[b]))))));
										}),
									A2(
										$elm$core$List$map,
										A2($author$project$Morphir$Visual$ViewArithmetic$view, config, viewValue),
										arithmeticOperatorTrees));
								return A2(
									$mdgriffith$elm_ui$Element$column,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$centerX,
											$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
										]),
									_List_fromArray(
										[
											A2(
											$mdgriffith$elm_ui$Element$row,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$centerX,
													$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
												]),
											_List_fromArray(
												[
													A2(
													$mdgriffith$elm_ui$Element$row,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$spacing(5),
															$mdgriffith$elm_ui$Element$Border$color(
															A3($mdgriffith$elm_ui$Element$rgb, 0, 0.7, 0)),
															$mdgriffith$elm_ui$Element$paddingEach(
															{bottom: 4, left: 0, right: 0, top: 0}),
															$mdgriffith$elm_ui$Element$centerX
														]),
													_List_fromArray(
														[
															viewValue(typedValue1)
														]))
												])),
											A2(
											$mdgriffith$elm_ui$Element$row,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$centerX,
													$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
													$mdgriffith$elm_ui$Element$Border$solid,
													$mdgriffith$elm_ui$Element$Border$widthEach(
													{bottom: 0, left: 0, right: 0, top: 1}),
													$mdgriffith$elm_ui$Element$paddingEach(
													{bottom: 0, left: 0, right: 0, top: 10})
												]),
											_List_fromArray(
												[
													A2(
													$mdgriffith$elm_ui$Element$row,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$spacing(5),
															$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
															$mdgriffith$elm_ui$Element$centerX
														]),
													mainBody)
												]))
										]));
							default:
								return $mdgriffith$elm_ui$Element$none;
						}
					} else {
						return $mdgriffith$elm_ui$Element$none;
					}
				} else {
					return $mdgriffith$elm_ui$Element$none;
				}
			default:
				var typedValue = arithmeticOperatorTree.a;
				return viewValue(typedValue);
		}
	});
var $author$project$Morphir$Visual$ViewBoolOperatorTree$Vertical = {$: 'Vertical'};
var $mdgriffith$elm_ui$Internal$Model$AlignY = function (a) {
	return {$: 'AlignY', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$CenterY = {$: 'CenterY'};
var $mdgriffith$elm_ui$Element$centerY = $mdgriffith$elm_ui$Internal$Model$AlignY($mdgriffith$elm_ui$Internal$Model$CenterY);
var $author$project$Morphir$Visual$ViewBoolOperatorTree$Horizontal = {$: 'Horizontal'};
var $author$project$Morphir$Visual$ViewBoolOperatorTree$flipLayoutDirection = function (direction) {
	if (direction.$ === 'Horizontal') {
		return $author$project$Morphir$Visual$ViewBoolOperatorTree$Vertical;
	} else {
		return $author$project$Morphir$Visual$ViewBoolOperatorTree$Horizontal;
	}
};
var $author$project$Morphir$Visual$ViewBoolOperatorTree$operatorToString = function (operator) {
	if (operator.$ === 'Or') {
		return 'OR';
	} else {
		return 'AND';
	}
};
var $author$project$Morphir$Visual$ViewBoolOperatorTree$viewTreeNode = F4(
	function (config, viewValue, direction, boolOperatorTree) {
		if (boolOperatorTree.$ === 'BoolOperatorBranch') {
			var operator = boolOperatorTree.a;
			var values = boolOperatorTree.b;
			var separator = function () {
				if (direction.$ === 'Horizontal') {
					var verticalLine = A2(
						$mdgriffith$elm_ui$Element$row,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$centerX,
								$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
							]),
						_List_fromArray(
							[
								A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$Border$widthEach(
										{bottom: 0, left: 1, right: 0, top: 0}),
										$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
									]),
								$mdgriffith$elm_ui$Element$none),
								A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
									]),
								$mdgriffith$elm_ui$Element$none)
							]));
					return A2(
						$mdgriffith$elm_ui$Element$column,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$centerY,
								$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
							]),
						_List_fromArray(
							[
								verticalLine,
								A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
										$mdgriffith$elm_ui$Element$Font$bold
									]),
								$mdgriffith$elm_ui$Element$text(
									$author$project$Morphir$Visual$ViewBoolOperatorTree$operatorToString(operator))),
								verticalLine
							]));
				} else {
					var horizontalLine = A2(
						$mdgriffith$elm_ui$Element$column,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
							]),
						_List_fromArray(
							[
								A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$Border$widthEach(
										{bottom: 1, left: 0, right: 0, top: 0}),
										$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
									]),
								$mdgriffith$elm_ui$Element$none),
								A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
									]),
								$mdgriffith$elm_ui$Element$none)
							]));
					return A2(
						$mdgriffith$elm_ui$Element$row,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$centerX,
								$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
							]),
						_List_fromArray(
							[
								horizontalLine,
								A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
										$mdgriffith$elm_ui$Element$Font$bold
									]),
								$mdgriffith$elm_ui$Element$text(
									$author$project$Morphir$Visual$ViewBoolOperatorTree$operatorToString(operator))),
								horizontalLine
							]));
				}
			}();
			var layout = function (elems) {
				if (direction.$ === 'Horizontal') {
					return A2(
						$mdgriffith$elm_ui$Element$row,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$centerX,
								$mdgriffith$elm_ui$Element$spacing(
								$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
							]),
						elems);
				} else {
					return A2(
						$mdgriffith$elm_ui$Element$column,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$centerY,
								$mdgriffith$elm_ui$Element$spacing(
								$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
							]),
						elems);
				}
			};
			return layout(
				A2(
					$elm$core$List$intersperse,
					separator,
					A2(
						$elm$core$List$map,
						$mdgriffith$elm_ui$Element$el(
							_List_fromArray(
								[$mdgriffith$elm_ui$Element$centerX])),
						A2(
							$elm$core$List$map,
							A3(
								$author$project$Morphir$Visual$ViewBoolOperatorTree$viewTreeNode,
								config,
								viewValue,
								$author$project$Morphir$Visual$ViewBoolOperatorTree$flipLayoutDirection(direction)),
							values))));
		} else {
			var value = boolOperatorTree.a;
			return viewValue(value);
		}
	});
var $author$project$Morphir$Visual$ViewBoolOperatorTree$view = F3(
	function (config, viewValue, boolOperatorTree) {
		return A4($author$project$Morphir$Visual$ViewBoolOperatorTree$viewTreeNode, config, viewValue, $author$project$Morphir$Visual$ViewBoolOperatorTree$Vertical, boolOperatorTree);
	});
var $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted = {$: 'NotHighlighted'};
var $author$project$Morphir$Visual$Components$DecisionTree$Highlighted = function (a) {
	return {$: 'Highlighted', a: a};
};
var $author$project$Morphir$Visual$Components$DecisionTree$highlightStateToBorderWidth = function (state) {
	if (state.$ === 'Highlighted') {
		return 4;
	} else {
		return 2;
	}
};
var $author$project$Morphir$Visual$Components$DecisionTree$Color = F3(
	function (a, b, c) {
		return {$: 'Color', a: a, b: b, c: c};
	});
var $author$project$Morphir$Visual$Components$DecisionTree$highlightColor = {
	_default: A3($author$project$Morphir$Visual$Components$DecisionTree$Color, 120, 120, 120),
	_false: A3($author$project$Morphir$Visual$Components$DecisionTree$Color, 180, 100, 100),
	_true: A3($author$project$Morphir$Visual$Components$DecisionTree$Color, 100, 180, 100)
};
var $author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor = function (state) {
	if (state.$ === 'Highlighted') {
		var bool = state.a;
		return bool ? $author$project$Morphir$Visual$Components$DecisionTree$highlightColor._true : $author$project$Morphir$Visual$Components$DecisionTree$highlightColor._false;
	} else {
		return $author$project$Morphir$Visual$Components$DecisionTree$highlightColor._default;
	}
};
var $mdgriffith$elm_ui$Element$Font$regular = A2($mdgriffith$elm_ui$Internal$Model$Class, $mdgriffith$elm_ui$Internal$Flag$fontWeight, $mdgriffith$elm_ui$Internal$Style$classes.textNormalWeight);
var $author$project$Morphir$Visual$Components$DecisionTree$highlightStateToFontWeight = function (state) {
	if (state.$ === 'Highlighted') {
		return $mdgriffith$elm_ui$Element$Font$bold;
	} else {
		return $mdgriffith$elm_ui$Element$Font$regular;
	}
};
var $mdgriffith$elm_ui$Internal$Model$Left = {$: 'Left'};
var $mdgriffith$elm_ui$Element$alignLeft = $mdgriffith$elm_ui$Internal$Model$AlignX($mdgriffith$elm_ui$Internal$Model$Left);
var $mdgriffith$elm_ui$Internal$Model$Top = {$: 'Top'};
var $mdgriffith$elm_ui$Element$alignTop = $mdgriffith$elm_ui$Internal$Model$AlignY($mdgriffith$elm_ui$Internal$Model$Top);
var $elm$html$Html$Attributes$colspan = function (n) {
	return A2(
		_VirtualDom_attribute,
		'colspan',
		$elm$core$String$fromInt(n));
};
var $elm$svg$Svg$Attributes$height = _VirtualDom_attribute('height');
var $elm$svg$Svg$Attributes$points = _VirtualDom_attribute('points');
var $elm$svg$Svg$trustedNode = _VirtualDom_nodeNS('http://www.w3.org/2000/svg');
var $elm$svg$Svg$polygon = $elm$svg$Svg$trustedNode('polygon');
var $elm$svg$Svg$Attributes$style = _VirtualDom_attribute('style');
var $elm$svg$Svg$svg = $elm$svg$Svg$trustedNode('svg');
var $author$project$Morphir$Visual$Components$DecisionTree$toCssColor = function (_v0) {
	var r = _v0.a;
	var g = _v0.b;
	var b = _v0.c;
	return $elm$core$String$concat(
		_List_fromArray(
			[
				'rgb(',
				$elm$core$String$fromInt(r),
				',',
				$elm$core$String$fromInt(g),
				',',
				$elm$core$String$fromInt(b),
				')'
			]));
};
var $elm$svg$Svg$Attributes$viewBox = _VirtualDom_attribute('viewBox');
var $elm$svg$Svg$Attributes$width = _VirtualDom_attribute('width');
var $author$project$Morphir$Visual$Components$DecisionTree$downArrowHead = F2(
	function (config, highlightState) {
		return A2(
			$elm$svg$Svg$svg,
			_List_fromArray(
				[
					$elm$svg$Svg$Attributes$width(
					_Utils_eq(highlightState, $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted) ? $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme)) : $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))),
					$elm$svg$Svg$Attributes$height(
					_Utils_eq(highlightState, $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted) ? $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme)) : $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))),
					$elm$svg$Svg$Attributes$viewBox('0 0 200 200')
				]),
			_List_fromArray(
				[
					A2(
					$elm$svg$Svg$polygon,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$points('0,0 100,200 200,0'),
							$elm$svg$Svg$Attributes$style(
							'fill:' + $author$project$Morphir$Visual$Components$DecisionTree$toCssColor(
								$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(highlightState)))
						]),
					_List_Nil)
				]));
	});
var $mdgriffith$elm_ui$Internal$Model$NoStaticStyleSheet = {$: 'NoStaticStyleSheet'};
var $mdgriffith$elm_ui$Internal$Model$RenderModeOption = function (a) {
	return {$: 'RenderModeOption', a: a};
};
var $mdgriffith$elm_ui$Element$noStaticStyleSheet = $mdgriffith$elm_ui$Internal$Model$RenderModeOption($mdgriffith$elm_ui$Internal$Model$NoStaticStyleSheet);
var $author$project$Morphir$Visual$Common$element = function (elem) {
	return A3(
		$mdgriffith$elm_ui$Element$layoutWith,
		{
			options: _List_fromArray(
				[$mdgriffith$elm_ui$Element$noStaticStyleSheet])
		},
		_List_fromArray(
			[
				$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$shrink),
				$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$shrink)
			]),
		elem);
};
var $mdgriffith$elm_ui$Internal$Model$unstyled = A2($elm$core$Basics$composeL, $mdgriffith$elm_ui$Internal$Model$Unstyled, $elm$core$Basics$always);
var $mdgriffith$elm_ui$Element$html = $mdgriffith$elm_ui$Internal$Model$unstyled;
var $elm$html$Html$table = _VirtualDom_node('table');
var $elm$html$Html$td = _VirtualDom_node('td');
var $elm$html$Html$tr = _VirtualDom_node('tr');
var $author$project$Morphir$Visual$Components$DecisionTree$downArrow = F2(
	function (config, highlightState) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
					$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
				]),
			$mdgriffith$elm_ui$Element$html(
				A2(
					$elm$html$Html$table,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'border-collapse', 'collapse'),
							A2($elm$html$Html$Attributes$style, 'height', '100%')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$tr,
							_List_fromArray(
								[
									A2($elm$html$Html$Attributes$style, 'height', '100%')
								]),
							_List_fromArray(
								[
									A2(
									$elm$html$Html$td,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$Attributes$style,
											'border-right',
											$elm$core$String$concat(
												_List_fromArray(
													[
														'solid ',
														$elm$core$String$fromInt(
														$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToBorderWidth(highlightState)),
														'px ',
														$author$project$Morphir$Visual$Components$DecisionTree$toCssColor(
														$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(highlightState))
													])))
										]),
									_List_Nil),
									A2($elm$html$Html$td, _List_Nil, _List_Nil)
								])),
							A2(
							$elm$html$Html$tr,
							_List_Nil,
							_List_fromArray(
								[
									A2(
									$elm$html$Html$td,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$colspan(2)
										]),
									_List_fromArray(
										[
											$author$project$Morphir$Visual$Common$element(
											A2(
												$mdgriffith$elm_ui$Element$el,
												_List_fromArray(
													[$mdgriffith$elm_ui$Element$centerX]),
												$mdgriffith$elm_ui$Element$html(
													A2($author$project$Morphir$Visual$Components$DecisionTree$downArrowHead, config, highlightState))))
										]))
								]))
						]))));
	});
var $author$project$Morphir$Visual$Components$DecisionTree$noPadding = {bottom: 0, left: 0, right: 0, top: 0};
var $mdgriffith$elm_ui$Element$paddingXY = F2(
	function (x, y) {
		if (_Utils_eq(x, y)) {
			var f = x;
			return A2(
				$mdgriffith$elm_ui$Internal$Model$StyleClass,
				$mdgriffith$elm_ui$Internal$Flag$padding,
				A5(
					$mdgriffith$elm_ui$Internal$Model$PaddingStyle,
					'p-' + $elm$core$String$fromInt(x),
					f,
					f,
					f,
					f));
		} else {
			var yFloat = y;
			var xFloat = x;
			return A2(
				$mdgriffith$elm_ui$Internal$Model$StyleClass,
				$mdgriffith$elm_ui$Internal$Flag$padding,
				A5(
					$mdgriffith$elm_ui$Internal$Model$PaddingStyle,
					'p-' + ($elm$core$String$fromInt(x) + ('-' + $elm$core$String$fromInt(y))),
					yFloat,
					xFloat,
					yFloat,
					xFloat));
		}
	});
var $author$project$Morphir$Visual$Components$DecisionTree$rightArrowHead = F2(
	function (config, highlightState) {
		return A2(
			$elm$svg$Svg$svg,
			_List_fromArray(
				[
					$elm$svg$Svg$Attributes$width(
					_Utils_eq(highlightState, $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted) ? $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme)) : $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))),
					$elm$svg$Svg$Attributes$height(
					_Utils_eq(highlightState, $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted) ? $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme)) : $elm$core$String$fromInt(
						$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))),
					$elm$svg$Svg$Attributes$viewBox('0 0 200 200')
				]),
			_List_fromArray(
				[
					A2(
					$elm$svg$Svg$polygon,
					_List_fromArray(
						[
							$elm$svg$Svg$Attributes$points('0,0 200,100 0,200'),
							$elm$svg$Svg$Attributes$style(
							'fill:' + $author$project$Morphir$Visual$Components$DecisionTree$toCssColor(
								$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(highlightState)))
						]),
					_List_Nil)
				]));
	});
var $elm$html$Html$Attributes$rowspan = function (n) {
	return A2(
		_VirtualDom_attribute,
		'rowspan',
		$elm$core$String$fromInt(n));
};
var $author$project$Morphir$Visual$Components$DecisionTree$rightArrow = F2(
	function (config, highlightState) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
					$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
				]),
			$mdgriffith$elm_ui$Element$html(
				A2(
					$elm$html$Html$table,
					_List_fromArray(
						[
							A2($elm$html$Html$Attributes$style, 'border-collapse', 'collapse'),
							A2($elm$html$Html$Attributes$style, 'width', '100%')
						]),
					_List_fromArray(
						[
							A2(
							$elm$html$Html$tr,
							_List_Nil,
							_List_fromArray(
								[
									A2(
									$elm$html$Html$td,
									_List_fromArray(
										[
											A2(
											$elm$html$Html$Attributes$style,
											'border-bottom',
											$elm$core$String$concat(
												_List_fromArray(
													[
														'solid ',
														$elm$core$String$fromInt(
														$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToBorderWidth(highlightState)),
														'px ',
														$author$project$Morphir$Visual$Components$DecisionTree$toCssColor(
														$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(highlightState))
													]))),
											A2($elm$html$Html$Attributes$style, 'width', '100%')
										]),
									_List_Nil),
									A2(
									$elm$html$Html$td,
									_List_fromArray(
										[
											$elm$html$Html$Attributes$rowspan(2)
										]),
									_List_fromArray(
										[
											$author$project$Morphir$Visual$Common$element(
											A2(
												$mdgriffith$elm_ui$Element$el,
												_List_fromArray(
													[$mdgriffith$elm_ui$Element$centerY]),
												$mdgriffith$elm_ui$Element$html(
													A2($author$project$Morphir$Visual$Components$DecisionTree$rightArrowHead, config, highlightState))))
										]))
								])),
							A2(
							$elm$html$Html$tr,
							_List_Nil,
							_List_fromArray(
								[
									A2($elm$html$Html$td, _List_Nil, _List_Nil)
								]))
						]))));
	});
var $author$project$Morphir$Visual$Components$DecisionTree$horizontalLayout = F8(
	function (config, condition, branch1Label, branch1State, branch1, branch2Label, branch2State, branch2) {
		return A2(
			$mdgriffith$elm_ui$Element$row,
			_List_Nil,
			_List_fromArray(
				[
					A2(
					$mdgriffith$elm_ui$Element$column,
					_List_fromArray(
						[$mdgriffith$elm_ui$Element$alignTop]),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Element$row,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
								]),
							_List_fromArray(
								[
									A2(
									$mdgriffith$elm_ui$Element$column,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$alignTop,
											$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$shrink)
										]),
									_List_fromArray(
										[
											A2(
											$mdgriffith$elm_ui$Element$el,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$shrink)
												]),
											condition),
											A2(
											$mdgriffith$elm_ui$Element$row,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$alignLeft,
													$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill),
													$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
													$mdgriffith$elm_ui$Element$spacing(
													$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
												]),
											_List_fromArray(
												[
													A2(
													$mdgriffith$elm_ui$Element$el,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$paddingEach(
															_Utils_update(
																$author$project$Morphir$Visual$Components$DecisionTree$noPadding,
																{
																	left: $author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme)
																})),
															$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
														]),
													A2($author$project$Morphir$Visual$Components$DecisionTree$downArrow, config, branch1State)),
													A2(
													$mdgriffith$elm_ui$Element$el,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$centerY,
															A2(
															$mdgriffith$elm_ui$Element$paddingXY,
															0,
															$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
														]),
													branch1Label)
												]))
										])),
									A2(
									$mdgriffith$elm_ui$Element$column,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$alignTop,
											$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
										]),
									_List_fromArray(
										[
											A2(
											$mdgriffith$elm_ui$Element$el,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
													$mdgriffith$elm_ui$Element$paddingEach(
													_Utils_update(
														$author$project$Morphir$Visual$Components$DecisionTree$noPadding,
														{
															top: $author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme)
														}))
												]),
											A2($author$project$Morphir$Visual$Components$DecisionTree$rightArrow, config, branch2State)),
											A2(
											$mdgriffith$elm_ui$Element$el,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$centerX,
													$mdgriffith$elm_ui$Element$padding(
													$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
												]),
											branch2Label)
										]))
								])),
							A2(
							$mdgriffith$elm_ui$Element$el,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$paddingEach(
									_Utils_update(
										$author$project$Morphir$Visual$Components$DecisionTree$noPadding,
										{
											right: $author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme)
										}))
								]),
							branch1)
						])),
					A2(
					$mdgriffith$elm_ui$Element$el,
					_List_fromArray(
						[$mdgriffith$elm_ui$Element$alignTop]),
					branch2)
				]));
	});
var $author$project$Morphir$Visual$Components$DecisionTree$toElementColor = function (_v0) {
	var r = _v0.a;
	var g = _v0.b;
	var b = _v0.c;
	return A3($mdgriffith$elm_ui$Element$rgb255, r, g, b);
};
var $author$project$Morphir$Visual$Components$DecisionTree$layoutHelp = F4(
	function (config, highlightState, viewValue, rootNode) {
		var depthOf = F2(
			function (f, node) {
				if (node.$ === 'Branch') {
					var branch = node.a;
					return A2(
						depthOf,
						f,
						f(branch)) + 1;
				} else {
					return 1;
				}
			});
		if (rootNode.$ === 'Branch') {
			var branch = rootNode.a;
			var thenState = function () {
				var _v4 = branch.conditionValue;
				if (_v4.$ === 'Just') {
					var v = _v4.a;
					return v ? $author$project$Morphir$Visual$Components$DecisionTree$Highlighted(true) : $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted;
				} else {
					return $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted;
				}
			}();
			var elseState = function () {
				var _v3 = branch.conditionValue;
				if (_v3.$ === 'Just') {
					var v = _v3.a;
					return v ? $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted : $author$project$Morphir$Visual$Components$DecisionTree$Highlighted(false);
				} else {
					return $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted;
				}
			}();
			var conditionState = function () {
				var _v2 = branch.conditionValue;
				if (_v2.$ === 'Just') {
					var v = _v2.a;
					return $author$project$Morphir$Visual$Components$DecisionTree$Highlighted(v);
				} else {
					return $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted;
				}
			}();
			return A8(
				$author$project$Morphir$Visual$Components$DecisionTree$horizontalLayout,
				config,
				A2(
					$mdgriffith$elm_ui$Element$el,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$Border$width(
							$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToBorderWidth(conditionState)),
							$mdgriffith$elm_ui$Element$Border$rounded(6),
							$mdgriffith$elm_ui$Element$Border$color(
							$author$project$Morphir$Visual$Components$DecisionTree$toElementColor(
								$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(conditionState))),
							$mdgriffith$elm_ui$Element$padding(
							$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
						]),
					viewValue(branch.condition)),
				A2(
					$mdgriffith$elm_ui$Element$el,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$Font$color(
							$author$project$Morphir$Visual$Components$DecisionTree$toElementColor(
								$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(thenState))),
							$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToFontWeight(thenState)
						]),
					$mdgriffith$elm_ui$Element$text('Yes')),
				thenState,
				A4($author$project$Morphir$Visual$Components$DecisionTree$layoutHelp, config, thenState, viewValue, branch.thenBranch),
				A2(
					$mdgriffith$elm_ui$Element$el,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$Font$color(
							$author$project$Morphir$Visual$Components$DecisionTree$toElementColor(
								$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(elseState))),
							$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToFontWeight(elseState)
						]),
					$mdgriffith$elm_ui$Element$text('No')),
				elseState,
				A4($author$project$Morphir$Visual$Components$DecisionTree$layoutHelp, config, elseState, viewValue, branch.elseBranch));
		} else {
			var value = rootNode.a;
			return A2(
				$mdgriffith$elm_ui$Element$el,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$Border$width(
						$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToBorderWidth(highlightState)),
						$mdgriffith$elm_ui$Element$Border$rounded(6),
						$mdgriffith$elm_ui$Element$Border$color(
						$author$project$Morphir$Visual$Components$DecisionTree$toElementColor(
							$author$project$Morphir$Visual$Components$DecisionTree$highlightStateToColor(highlightState))),
						$mdgriffith$elm_ui$Element$padding(
						$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
					]),
				viewValue(value));
		}
	});
var $author$project$Morphir$Visual$Components$DecisionTree$layout = F3(
	function (config, viewValue, rootNode) {
		return A4($author$project$Morphir$Visual$Components$DecisionTree$layoutHelp, config, $author$project$Morphir$Visual$Components$DecisionTree$NotHighlighted, viewValue, rootNode);
	});
var $author$project$Morphir$Visual$Components$DecisionTree$Branch = function (a) {
	return {$: 'Branch', a: a};
};
var $author$project$Morphir$Visual$Components$DecisionTree$Leaf = function (a) {
	return {$: 'Leaf', a: a};
};
var $author$project$Morphir$Visual$ViewIfThenElse$valueToTree = F3(
	function (config, doEval, value) {
		valueToTree:
		while (true) {
			switch (value.$) {
				case 'IfThenElse':
					var condition = value.b;
					var thenBranch = value.c;
					var elseBranch = value.d;
					var result = function () {
						if (doEval) {
							var _v1 = A2(
								$author$project$Morphir$Visual$Config$evaluate,
								$author$project$Morphir$IR$Value$toRawValue(condition),
								config);
							if (((_v1.$ === 'Ok') && (_v1.a.$ === 'Literal')) && (_v1.a.b.$ === 'BoolLiteral')) {
								var _v2 = _v1.a;
								var v = _v2.b.a;
								return $elm$core$Maybe$Just(v);
							} else {
								return $elm$core$Maybe$Nothing;
							}
						} else {
							return $elm$core$Maybe$Nothing;
						}
					}();
					return $author$project$Morphir$Visual$Components$DecisionTree$Branch(
						{
							condition: condition,
							conditionValue: result,
							elseBranch: A3(
								$author$project$Morphir$Visual$ViewIfThenElse$valueToTree,
								config,
								_Utils_eq(
									result,
									$elm$core$Maybe$Just(false)),
								elseBranch),
							thenBranch: A3(
								$author$project$Morphir$Visual$ViewIfThenElse$valueToTree,
								config,
								_Utils_eq(
									result,
									$elm$core$Maybe$Just(true)),
								thenBranch)
						});
				case 'LetDefinition':
					var defName = value.b;
					var defValue = value.c;
					var inValue = value.d;
					var currentState = config.state;
					var newState = _Utils_update(
						currentState,
						{
							variables: A2(
								$elm$core$Result$withDefault,
								currentState.variables,
								A2(
									$elm$core$Result$map,
									function (evaluatedDefValue) {
										return A3($elm$core$Dict$insert, defName, evaluatedDefValue, currentState.variables);
									},
									A2(
										$author$project$Morphir$Visual$Config$evaluate,
										$author$project$Morphir$IR$Value$definitionToValue(
											A3(
												$author$project$Morphir$IR$Value$mapDefinitionAttributes,
												$elm$core$Basics$identity,
												$elm$core$Basics$always(_Utils_Tuple0),
												defValue)),
										config)))
						});
					var $temp$config = _Utils_update(
						config,
						{state: newState}),
						$temp$doEval = doEval,
						$temp$value = inValue;
					config = $temp$config;
					doEval = $temp$doEval;
					value = $temp$value;
					continue valueToTree;
				default:
					return $author$project$Morphir$Visual$Components$DecisionTree$Leaf(value);
			}
		}
	});
var $author$project$Morphir$Visual$ViewIfThenElse$view = F3(
	function (config, viewValue, value) {
		return A3(
			$author$project$Morphir$Visual$Components$DecisionTree$layout,
			config,
			viewValue,
			A3($author$project$Morphir$Visual$ViewIfThenElse$valueToTree, config, true, value));
	});
var $mdgriffith$elm_ui$Element$InternalIndexedColumn = function (a) {
	return {$: 'InternalIndexedColumn', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$GridPosition = function (a) {
	return {$: 'GridPosition', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$GridTemplateStyle = function (a) {
	return {$: 'GridTemplateStyle', a: a};
};
var $mdgriffith$elm_ui$Internal$Model$AsGrid = {$: 'AsGrid'};
var $mdgriffith$elm_ui$Internal$Model$asGrid = $mdgriffith$elm_ui$Internal$Model$AsGrid;
var $mdgriffith$elm_ui$Internal$Model$getSpacing = F2(
	function (attrs, _default) {
		return A2(
			$elm$core$Maybe$withDefault,
			_default,
			A3(
				$elm$core$List$foldr,
				F2(
					function (attr, acc) {
						if (acc.$ === 'Just') {
							var x = acc.a;
							return $elm$core$Maybe$Just(x);
						} else {
							if ((attr.$ === 'StyleClass') && (attr.b.$ === 'SpacingStyle')) {
								var _v2 = attr.b;
								var x = _v2.b;
								var y = _v2.c;
								return $elm$core$Maybe$Just(
									_Utils_Tuple2(x, y));
							} else {
								return $elm$core$Maybe$Nothing;
							}
						}
					}),
				$elm$core$Maybe$Nothing,
				attrs));
	});
var $mdgriffith$elm_ui$Internal$Flag$gridPosition = $mdgriffith$elm_ui$Internal$Flag$flag(35);
var $mdgriffith$elm_ui$Internal$Flag$gridTemplate = $mdgriffith$elm_ui$Internal$Flag$flag(34);
var $mdgriffith$elm_ui$Internal$Model$Px = function (a) {
	return {$: 'Px', a: a};
};
var $mdgriffith$elm_ui$Element$px = $mdgriffith$elm_ui$Internal$Model$Px;
var $mdgriffith$elm_ui$Element$tableHelper = F2(
	function (attrs, config) {
		var onGrid = F3(
			function (rowLevel, columnLevel, elem) {
				return A4(
					$mdgriffith$elm_ui$Internal$Model$element,
					$mdgriffith$elm_ui$Internal$Model$asEl,
					$mdgriffith$elm_ui$Internal$Model$div,
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Internal$Model$StyleClass,
							$mdgriffith$elm_ui$Internal$Flag$gridPosition,
							$mdgriffith$elm_ui$Internal$Model$GridPosition(
								{col: columnLevel, height: 1, row: rowLevel, width: 1}))
						]),
					$mdgriffith$elm_ui$Internal$Model$Unkeyed(
						_List_fromArray(
							[elem])));
			});
		var columnWidth = function (col) {
			if (col.$ === 'InternalIndexedColumn') {
				var colConfig = col.a;
				return colConfig.width;
			} else {
				var colConfig = col.a;
				return colConfig.width;
			}
		};
		var columnHeader = function (col) {
			if (col.$ === 'InternalIndexedColumn') {
				var colConfig = col.a;
				return colConfig.header;
			} else {
				var colConfig = col.a;
				return colConfig.header;
			}
		};
		var maybeHeaders = function (headers) {
			return A2(
				$elm$core$List$all,
				$elm$core$Basics$eq($mdgriffith$elm_ui$Internal$Model$Empty),
				headers) ? $elm$core$Maybe$Nothing : $elm$core$Maybe$Just(
				A2(
					$elm$core$List$indexedMap,
					F2(
						function (col, header) {
							return A3(onGrid, 1, col + 1, header);
						}),
					headers));
		}(
			A2($elm$core$List$map, columnHeader, config.columns));
		var add = F3(
			function (cell, columnConfig, cursor) {
				if (columnConfig.$ === 'InternalIndexedColumn') {
					var col = columnConfig.a;
					return _Utils_update(
						cursor,
						{
							column: cursor.column + 1,
							elements: A2(
								$elm$core$List$cons,
								A3(
									onGrid,
									cursor.row,
									cursor.column,
									A2(
										col.view,
										_Utils_eq(maybeHeaders, $elm$core$Maybe$Nothing) ? (cursor.row - 1) : (cursor.row - 2),
										cell)),
								cursor.elements)
						});
				} else {
					var col = columnConfig.a;
					return {
						column: cursor.column + 1,
						elements: A2(
							$elm$core$List$cons,
							A3(
								onGrid,
								cursor.row,
								cursor.column,
								col.view(cell)),
							cursor.elements),
						row: cursor.row
					};
				}
			});
		var build = F3(
			function (columns, rowData, cursor) {
				var newCursor = A3(
					$elm$core$List$foldl,
					add(rowData),
					cursor,
					columns);
				return {column: 1, elements: newCursor.elements, row: cursor.row + 1};
			});
		var children = A3(
			$elm$core$List$foldl,
			build(config.columns),
			{
				column: 1,
				elements: _List_Nil,
				row: _Utils_eq(maybeHeaders, $elm$core$Maybe$Nothing) ? 1 : 2
			},
			config.data);
		var _v0 = A2(
			$mdgriffith$elm_ui$Internal$Model$getSpacing,
			attrs,
			_Utils_Tuple2(0, 0));
		var sX = _v0.a;
		var sY = _v0.b;
		var template = A2(
			$mdgriffith$elm_ui$Internal$Model$StyleClass,
			$mdgriffith$elm_ui$Internal$Flag$gridTemplate,
			$mdgriffith$elm_ui$Internal$Model$GridTemplateStyle(
				{
					columns: A2($elm$core$List$map, columnWidth, config.columns),
					rows: A2(
						$elm$core$List$repeat,
						$elm$core$List$length(config.data),
						$mdgriffith$elm_ui$Internal$Model$Content),
					spacing: _Utils_Tuple2(
						$mdgriffith$elm_ui$Element$px(sX),
						$mdgriffith$elm_ui$Element$px(sY))
				}));
		return A4(
			$mdgriffith$elm_ui$Internal$Model$element,
			$mdgriffith$elm_ui$Internal$Model$asGrid,
			$mdgriffith$elm_ui$Internal$Model$div,
			A2(
				$elm$core$List$cons,
				$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
				A2($elm$core$List$cons, template, attrs)),
			$mdgriffith$elm_ui$Internal$Model$Unkeyed(
				function () {
					if (maybeHeaders.$ === 'Nothing') {
						return children.elements;
					} else {
						var renderedHeaders = maybeHeaders.a;
						return _Utils_ap(
							renderedHeaders,
							$elm$core$List$reverse(children.elements));
					}
				}()));
	});
var $mdgriffith$elm_ui$Element$indexedTable = F2(
	function (attrs, config) {
		return A2(
			$mdgriffith$elm_ui$Element$tableHelper,
			attrs,
			{
				columns: A2($elm$core$List$map, $mdgriffith$elm_ui$Element$InternalIndexedColumn, config.columns),
				data: config.data
			});
	});
var $author$project$Morphir$IR$Module$definitionToSpecification = function (def) {
	return {
		types: $elm$core$Dict$fromList(
			A2(
				$elm$core$List$filterMap,
				function (_v0) {
					var path = _v0.a;
					var accessControlledType = _v0.b;
					return A2(
						$elm$core$Maybe$map,
						function (typeDef) {
							return _Utils_Tuple2(
								path,
								A2($author$project$Morphir$IR$Documented$map, $author$project$Morphir$IR$Type$definitionToSpecification, typeDef));
						},
						$author$project$Morphir$IR$AccessControlled$withPublicAccess(accessControlledType));
				},
				$elm$core$Dict$toList(def.types))),
		values: $elm$core$Dict$fromList(
			A2(
				$elm$core$List$filterMap,
				function (_v1) {
					var path = _v1.a;
					var accessControlledValue = _v1.b;
					return A2(
						$elm$core$Maybe$map,
						function (valueDef) {
							return _Utils_Tuple2(
								path,
								$author$project$Morphir$IR$Value$definitionToSpecification(valueDef));
						},
						$author$project$Morphir$IR$AccessControlled$withPublicAccess(accessControlledValue));
				},
				$elm$core$Dict$toList(def.values)))
	};
};
var $author$project$Morphir$IR$Package$definitionToSpecification = function (def) {
	return {
		modules: $elm$core$Dict$fromList(
			A2(
				$elm$core$List$filterMap,
				function (_v0) {
					var path = _v0.a;
					var accessControlledModule = _v0.b;
					return A2(
						$elm$core$Maybe$map,
						function (moduleDef) {
							return _Utils_Tuple2(
								path,
								$author$project$Morphir$IR$Module$definitionToSpecification(moduleDef));
						},
						$author$project$Morphir$IR$AccessControlled$withPublicAccess(accessControlledModule));
				},
				$elm$core$Dict$toList(def.modules)))
	};
};
var $author$project$Morphir$IR$Package$lookupModuleSpecification = F2(
	function (modulePath, packageSpec) {
		return A2($elm$core$Dict$get, modulePath, packageSpec.modules);
	});
var $author$project$Morphir$IR$Distribution$lookupModuleSpecification = F3(
	function (packageName, modulePath, distribution) {
		var libraryPackageName = distribution.a;
		var dependencies = distribution.b;
		var packageDef = distribution.c;
		return _Utils_eq(packageName, libraryPackageName) ? A2(
			$author$project$Morphir$IR$Package$lookupModuleSpecification,
			modulePath,
			$author$project$Morphir$IR$Package$definitionToSpecification(packageDef)) : A2(
			$elm$core$Maybe$andThen,
			$author$project$Morphir$IR$Package$lookupModuleSpecification(modulePath),
			A2($elm$core$Dict$get, packageName, dependencies));
	});
var $author$project$Morphir$IR$Module$lookupTypeSpecification = F2(
	function (localName, moduleSpec) {
		return A2(
			$elm$core$Maybe$map,
			function ($) {
				return $.value;
			},
			A2($elm$core$Dict$get, localName, moduleSpec.types));
	});
var $author$project$Morphir$IR$Distribution$lookupTypeSpecification = F4(
	function (packageName, moduleName, localName, distribution) {
		return A2(
			$elm$core$Maybe$andThen,
			$author$project$Morphir$IR$Module$lookupTypeSpecification(localName),
			A3($author$project$Morphir$IR$Distribution$lookupModuleSpecification, packageName, moduleName, distribution));
	});
var $author$project$Morphir$IR$Distribution$resolveRecordConstructors = F2(
	function (value, distribution) {
		return A2(
			$author$project$Morphir$IR$Value$rewriteValue,
			function (v) {
				if (v.$ === 'Apply') {
					var fun = v.b;
					var lastArg = v.c;
					var _v1 = A2($author$project$Morphir$IR$Value$uncurryApply, fun, lastArg);
					var bottomFun = _v1.a;
					var args = _v1.b;
					if (bottomFun.$ === 'Constructor') {
						var va = bottomFun.a;
						var _v3 = bottomFun.b;
						var packageName = _v3.a;
						var moduleName = _v3.b;
						var localName = _v3.c;
						return A2(
							$elm$core$Maybe$andThen,
							function (typeSpec) {
								if ((typeSpec.$ === 'TypeAliasSpecification') && (typeSpec.b.$ === 'Record')) {
									var _v5 = typeSpec.b;
									var fields = _v5.b;
									return $elm$core$Maybe$Just(
										A2(
											$author$project$Morphir$IR$Value$Record,
											va,
											A3(
												$elm$core$List$map2,
												$elm$core$Tuple$pair,
												A2(
													$elm$core$List$map,
													function ($) {
														return $.name;
													},
													fields),
												args)));
								} else {
									return $elm$core$Maybe$Nothing;
								}
							},
							A4($author$project$Morphir$IR$Distribution$lookupTypeSpecification, packageName, moduleName, localName, distribution));
					} else {
						return $elm$core$Maybe$Nothing;
					}
				} else {
					return $elm$core$Maybe$Nothing;
				}
			},
			value);
	});
var $author$project$Morphir$IR$Distribution$resolveTypeReference = F3(
	function (fQName, typeArgs, distribution) {
		var packageName = fQName.a;
		var moduleName = fQName.b;
		var localName = fQName.c;
		var _v0 = A4($author$project$Morphir$IR$Distribution$lookupTypeSpecification, packageName, moduleName, localName, distribution);
		if (_v0.$ === 'Just') {
			var typeSpec = _v0.a;
			switch (typeSpec.$) {
				case 'TypeAliasSpecification':
					var paramNames = typeSpec.a;
					var tpe = typeSpec.b;
					var paramMapping = $elm$core$Dict$fromList(
						A3($elm$core$List$map2, $elm$core$Tuple$pair, paramNames, typeArgs));
					return $elm$core$Result$Ok(
						A2($author$project$Morphir$IR$Type$substituteTypeVariables, paramMapping, tpe));
				case 'OpaqueTypeSpecification':
					return $elm$core$Result$Err(
						$elm$core$String$concat(
							_List_fromArray(
								[
									'Opaque types cannot be resolved: ',
									$author$project$Morphir$IR$FQName$toString(fQName)
								])));
				default:
					return $elm$core$Result$Err(
						$elm$core$String$concat(
							_List_fromArray(
								[
									'Custom types cannot be resolved: ',
									$author$project$Morphir$IR$FQName$toString(fQName)
								])));
			}
		} else {
			return $elm$core$Result$Err(
				$elm$core$String$concat(
					_List_fromArray(
						[
							'Type specification not found: ',
							$author$project$Morphir$IR$FQName$toString(fQName)
						])));
		}
	});
var $mdgriffith$elm_ui$Element$InternalColumn = function (a) {
	return {$: 'InternalColumn', a: a};
};
var $mdgriffith$elm_ui$Element$table = F2(
	function (attrs, config) {
		return A2(
			$mdgriffith$elm_ui$Element$tableHelper,
			attrs,
			{
				columns: A2($elm$core$List$map, $mdgriffith$elm_ui$Element$InternalColumn, config.columns),
				data: config.data
			});
	});
var $author$project$Morphir$Visual$ViewList$viewAsList = F3(
	function (config, viewValue, items) {
		return A2(
			$mdgriffith$elm_ui$Element$table,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$spacing(
					$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
				]),
			{
				columns: _List_fromArray(
					[
						{header: $mdgriffith$elm_ui$Element$none, view: viewValue, width: $mdgriffith$elm_ui$Element$fill}
					]),
				data: items
			});
	});
var $author$project$Morphir$Visual$ViewList$view = F4(
	function (config, viewValue, itemType, items) {
		view:
		while (true) {
			if ($elm$core$List$isEmpty(items)) {
				return A2(
					$mdgriffith$elm_ui$Element$el,
					_List_Nil,
					$mdgriffith$elm_ui$Element$text('[ ]'));
			} else {
				switch (itemType.$) {
					case 'Record':
						var fields = itemType.b;
						return A2(
							$mdgriffith$elm_ui$Element$indexedTable,
							_List_fromArray(
								[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY]),
							{
								columns: A2(
									$elm$core$List$map,
									function (field) {
										return {
											header: A2(
												$mdgriffith$elm_ui$Element$el,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$Border$width(1),
														$mdgriffith$elm_ui$Element$padding(
														$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
														$mdgriffith$elm_ui$Element$Font$bold
													]),
												A2(
													$mdgriffith$elm_ui$Element$el,
													_List_fromArray(
														[$mdgriffith$elm_ui$Element$centerY, $mdgriffith$elm_ui$Element$centerX]),
													$mdgriffith$elm_ui$Element$text(
														A2(
															$elm$core$String$join,
															' ',
															$author$project$Morphir$IR$Name$toHumanWords(field.name))))),
											view: F2(
												function (rowIndex, item) {
													return A2(
														$mdgriffith$elm_ui$Element$el,
														_List_fromArray(
															[
																$mdgriffith$elm_ui$Element$padding(
																$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
																$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
																$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill),
																$mdgriffith$elm_ui$Element$Border$widthEach(
																{bottom: 1, left: 1, right: 1, top: 0})
															]),
														A2(
															$mdgriffith$elm_ui$Element$el,
															_List_fromArray(
																[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY]),
															function () {
																if (item.$ === 'Record') {
																	var fieldValues = item.b;
																	return A2(
																		$elm$core$Maybe$withDefault,
																		$mdgriffith$elm_ui$Element$text('???'),
																		A2(
																			$elm$core$Maybe$map,
																			viewValue,
																			A2(
																				$elm$core$Dict$get,
																				field.name,
																				$elm$core$Dict$fromList(fieldValues))));
																} else {
																	return viewValue(item);
																}
															}()));
												}),
											width: $mdgriffith$elm_ui$Element$fill
										};
									},
									fields),
								data: A2(
									$elm$core$List$map,
									function (item) {
										return A2($author$project$Morphir$IR$Distribution$resolveRecordConstructors, item, config.irContext.distribution);
									},
									items)
							});
					case 'Reference':
						var fQName = itemType.b;
						var typeArgs = itemType.c;
						var _v2 = A3($author$project$Morphir$IR$Distribution$resolveTypeReference, fQName, typeArgs, config.irContext.distribution);
						if (_v2.$ === 'Ok') {
							var resolvedItemType = _v2.a;
							var $temp$config = config,
								$temp$viewValue = viewValue,
								$temp$itemType = resolvedItemType,
								$temp$items = items;
							config = $temp$config;
							viewValue = $temp$viewValue;
							itemType = $temp$itemType;
							items = $temp$items;
							continue view;
						} else {
							return A3($author$project$Morphir$Visual$ViewList$viewAsList, config, viewValue, items);
						}
					default:
						return A3($author$project$Morphir$Visual$ViewList$viewAsList, config, viewValue, items);
				}
			}
		}
	});
var $cuducos$elm_format_number$FormatNumber$Locales$Exact = function (a) {
	return {$: 'Exact', a: a};
};
var $cuducos$elm_format_number$FormatNumber$Parser$FormattedNumber = F5(
	function (original, integers, decimals, prefix, suffix) {
		return {decimals: decimals, integers: integers, original: original, prefix: prefix, suffix: suffix};
	});
var $cuducos$elm_format_number$FormatNumber$Parser$Negative = {$: 'Negative'};
var $cuducos$elm_format_number$FormatNumber$Parser$Positive = {$: 'Positive'};
var $cuducos$elm_format_number$FormatNumber$Parser$Zero = {$: 'Zero'};
var $cuducos$elm_format_number$FormatNumber$Parser$classify = function (formatted) {
	var onlyZeros = A2(
		$elm$core$String$all,
		function (_char) {
			return _Utils_eq(
				_char,
				_Utils_chr('0'));
		},
		$elm$core$String$concat(
			A2(
				$elm$core$List$append,
				formatted.integers,
				$elm$core$List$singleton(formatted.decimals))));
	return onlyZeros ? $cuducos$elm_format_number$FormatNumber$Parser$Zero : ((formatted.original < 0) ? $cuducos$elm_format_number$FormatNumber$Parser$Negative : $cuducos$elm_format_number$FormatNumber$Parser$Positive);
};
var $elm$core$String$filter = _String_filter;
var $cuducos$elm_format_number$FormatNumber$Parser$addZerosToFit = F2(
	function (desiredLength, value) {
		var length = $elm$core$String$length(value);
		var missing = (_Utils_cmp(length, desiredLength) < 0) ? $elm$core$Basics$abs(desiredLength - length) : 0;
		return _Utils_ap(
			value,
			A2($elm$core$String$repeat, missing, '0'));
	});
var $cuducos$elm_format_number$FormatNumber$Parser$removeZeros = function (decimals) {
	return (A2($elm$core$String$right, 1, decimals) !== '0') ? decimals : $cuducos$elm_format_number$FormatNumber$Parser$removeZeros(
		A2($elm$core$String$dropRight, 1, decimals));
};
var $cuducos$elm_format_number$FormatNumber$Parser$getDecimals = F2(
	function (locale, digits) {
		var _v0 = locale.decimals;
		switch (_v0.$) {
			case 'Max':
				return $cuducos$elm_format_number$FormatNumber$Parser$removeZeros(digits);
			case 'Exact':
				return digits;
			default:
				var min = _v0.a;
				return A2($cuducos$elm_format_number$FormatNumber$Parser$addZerosToFit, min, digits);
		}
	});
var $myrho$elm_round$Round$addSign = F2(
	function (signed, str) {
		var isNotZero = A2(
			$elm$core$List$any,
			function (c) {
				return (!_Utils_eq(
					c,
					_Utils_chr('0'))) && (!_Utils_eq(
					c,
					_Utils_chr('.')));
			},
			$elm$core$String$toList(str));
		return _Utils_ap(
			(signed && isNotZero) ? '-' : '',
			str);
	});
var $myrho$elm_round$Round$increaseNum = function (_v0) {
	var head = _v0.a;
	var tail = _v0.b;
	if (_Utils_eq(
		head,
		_Utils_chr('9'))) {
		var _v1 = $elm$core$String$uncons(tail);
		if (_v1.$ === 'Nothing') {
			return '01';
		} else {
			var headtail = _v1.a;
			return A2(
				$elm$core$String$cons,
				_Utils_chr('0'),
				$myrho$elm_round$Round$increaseNum(headtail));
		}
	} else {
		var c = $elm$core$Char$toCode(head);
		return ((c >= 48) && (c < 57)) ? A2(
			$elm$core$String$cons,
			$elm$core$Char$fromCode(c + 1),
			tail) : '0';
	}
};
var $myrho$elm_round$Round$splitComma = function (str) {
	var _v0 = A2($elm$core$String$split, '.', str);
	if (_v0.b) {
		if (_v0.b.b) {
			var before = _v0.a;
			var _v1 = _v0.b;
			var after = _v1.a;
			return _Utils_Tuple2(before, after);
		} else {
			var before = _v0.a;
			return _Utils_Tuple2(before, '0');
		}
	} else {
		return _Utils_Tuple2('0', '0');
	}
};
var $myrho$elm_round$Round$toDecimal = function (fl) {
	var _v0 = A2(
		$elm$core$String$split,
		'e',
		$elm$core$String$fromFloat(
			$elm$core$Basics$abs(fl)));
	if (_v0.b) {
		if (_v0.b.b) {
			var num = _v0.a;
			var _v1 = _v0.b;
			var exp = _v1.a;
			var e = A2(
				$elm$core$Maybe$withDefault,
				0,
				$elm$core$String$toInt(
					A2($elm$core$String$startsWith, '+', exp) ? A2($elm$core$String$dropLeft, 1, exp) : exp));
			var _v2 = $myrho$elm_round$Round$splitComma(num);
			var before = _v2.a;
			var after = _v2.b;
			var total = _Utils_ap(before, after);
			var zeroed = (e < 0) ? A2(
				$elm$core$Maybe$withDefault,
				'0',
				A2(
					$elm$core$Maybe$map,
					function (_v3) {
						var a = _v3.a;
						var b = _v3.b;
						return a + ('.' + b);
					},
					A2(
						$elm$core$Maybe$map,
						$elm$core$Tuple$mapFirst($elm$core$String$fromChar),
						$elm$core$String$uncons(
							_Utils_ap(
								A2(
									$elm$core$String$repeat,
									$elm$core$Basics$abs(e),
									'0'),
								total))))) : A3(
				$elm$core$String$padRight,
				e + 1,
				_Utils_chr('0'),
				total);
			return _Utils_ap(
				(fl < 0) ? '-' : '',
				zeroed);
		} else {
			var num = _v0.a;
			return _Utils_ap(
				(fl < 0) ? '-' : '',
				num);
		}
	} else {
		return '';
	}
};
var $myrho$elm_round$Round$roundFun = F3(
	function (functor, s, fl) {
		if ($elm$core$Basics$isInfinite(fl) || $elm$core$Basics$isNaN(fl)) {
			return $elm$core$String$fromFloat(fl);
		} else {
			var signed = fl < 0;
			var _v0 = $myrho$elm_round$Round$splitComma(
				$myrho$elm_round$Round$toDecimal(
					$elm$core$Basics$abs(fl)));
			var before = _v0.a;
			var after = _v0.b;
			var r = $elm$core$String$length(before) + s;
			var normalized = _Utils_ap(
				A2($elm$core$String$repeat, (-r) + 1, '0'),
				A3(
					$elm$core$String$padRight,
					r,
					_Utils_chr('0'),
					_Utils_ap(before, after)));
			var totalLen = $elm$core$String$length(normalized);
			var roundDigitIndex = A2($elm$core$Basics$max, 1, r);
			var increase = A2(
				functor,
				signed,
				A3($elm$core$String$slice, roundDigitIndex, totalLen, normalized));
			var remains = A3($elm$core$String$slice, 0, roundDigitIndex, normalized);
			var num = increase ? $elm$core$String$reverse(
				A2(
					$elm$core$Maybe$withDefault,
					'1',
					A2(
						$elm$core$Maybe$map,
						$myrho$elm_round$Round$increaseNum,
						$elm$core$String$uncons(
							$elm$core$String$reverse(remains))))) : remains;
			var numLen = $elm$core$String$length(num);
			var numZeroed = (num === '0') ? num : ((s <= 0) ? _Utils_ap(
				num,
				A2(
					$elm$core$String$repeat,
					$elm$core$Basics$abs(s),
					'0')) : ((_Utils_cmp(
				s,
				$elm$core$String$length(after)) < 0) ? (A3($elm$core$String$slice, 0, numLen - s, num) + ('.' + A3($elm$core$String$slice, numLen - s, numLen, num))) : _Utils_ap(
				before + '.',
				A3(
					$elm$core$String$padRight,
					s,
					_Utils_chr('0'),
					after))));
			return A2($myrho$elm_round$Round$addSign, signed, numZeroed);
		}
	});
var $myrho$elm_round$Round$round = $myrho$elm_round$Round$roundFun(
	F2(
		function (signed, str) {
			var _v0 = $elm$core$String$uncons(str);
			if (_v0.$ === 'Nothing') {
				return false;
			} else {
				if ('5' === _v0.a.a.valueOf()) {
					if (_v0.a.b === '') {
						var _v1 = _v0.a;
						return !signed;
					} else {
						var _v2 = _v0.a;
						return true;
					}
				} else {
					var _v3 = _v0.a;
					var _int = _v3.a;
					return function (i) {
						return ((i > 53) && signed) || ((i >= 53) && (!signed));
					}(
						$elm$core$Char$toCode(_int));
				}
			}
		}));
var $cuducos$elm_format_number$FormatNumber$Parser$splitInParts = F2(
	function (locale, value) {
		var toString = function () {
			var _v1 = locale.decimals;
			switch (_v1.$) {
				case 'Max':
					var max = _v1.a;
					return $myrho$elm_round$Round$round(max);
				case 'Min':
					return $elm$core$String$fromFloat;
				default:
					var exact = _v1.a;
					return $myrho$elm_round$Round$round(exact);
			}
		}();
		var asList = A2(
			$elm$core$String$split,
			'.',
			toString(value));
		var decimals = function () {
			var _v0 = $elm$core$List$tail(asList);
			if (_v0.$ === 'Just') {
				var values = _v0.a;
				return A2(
					$elm$core$Maybe$withDefault,
					'',
					$elm$core$List$head(values));
			} else {
				return '';
			}
		}();
		var integers = A2(
			$elm$core$Maybe$withDefault,
			'',
			$elm$core$List$head(asList));
		return _Utils_Tuple2(integers, decimals);
	});
var $cuducos$elm_format_number$FormatNumber$Parser$splitThousands = function (integers) {
	var reversedSplitThousands = function (value) {
		return ($elm$core$String$length(value) > 3) ? A2(
			$elm$core$List$cons,
			A2($elm$core$String$right, 3, value),
			reversedSplitThousands(
				A2($elm$core$String$dropRight, 3, value))) : _List_fromArray(
			[value]);
	};
	return $elm$core$List$reverse(
		reversedSplitThousands(integers));
};
var $cuducos$elm_format_number$FormatNumber$Parser$parse = F2(
	function (locale, original) {
		var parts = A2($cuducos$elm_format_number$FormatNumber$Parser$splitInParts, locale, original);
		var integers = $cuducos$elm_format_number$FormatNumber$Parser$splitThousands(
			A2($elm$core$String$filter, $elm$core$Char$isDigit, parts.a));
		var decimals = A2($cuducos$elm_format_number$FormatNumber$Parser$getDecimals, locale, parts.b);
		var partial = A5($cuducos$elm_format_number$FormatNumber$Parser$FormattedNumber, original, integers, decimals, '', '');
		var _v0 = $cuducos$elm_format_number$FormatNumber$Parser$classify(partial);
		switch (_v0.$) {
			case 'Negative':
				return _Utils_update(
					partial,
					{prefix: locale.negativePrefix, suffix: locale.negativeSuffix});
			case 'Positive':
				return _Utils_update(
					partial,
					{prefix: locale.positivePrefix, suffix: locale.positiveSuffix});
			default:
				return _Utils_update(
					partial,
					{prefix: locale.zeroPrefix, suffix: locale.zeroSuffix});
		}
	});
var $cuducos$elm_format_number$FormatNumber$Stringfy$formatDecimals = F2(
	function (locale, decimals) {
		return (decimals === '') ? '' : _Utils_ap(locale.decimalSeparator, decimals);
	});
var $cuducos$elm_format_number$FormatNumber$Stringfy$stringfy = F2(
	function (locale, formatted) {
		var stringfyDecimals = $cuducos$elm_format_number$FormatNumber$Stringfy$formatDecimals(locale);
		var integers = A2($elm$core$String$join, locale.thousandSeparator, formatted.integers);
		var decimals = stringfyDecimals(formatted.decimals);
		return $elm$core$String$concat(
			_List_fromArray(
				[formatted.prefix, integers, decimals, formatted.suffix]));
	});
var $cuducos$elm_format_number$FormatNumber$format = F2(
	function (locale, number_) {
		return A2(
			$cuducos$elm_format_number$FormatNumber$Stringfy$stringfy,
			locale,
			A2($cuducos$elm_format_number$FormatNumber$Parser$parse, locale, number_));
	});
var $cuducos$elm_format_number$FormatNumber$Locales$Min = function (a) {
	return {$: 'Min', a: a};
};
var $cuducos$elm_format_number$FormatNumber$Locales$base = {
	decimalSeparator: '.',
	decimals: $cuducos$elm_format_number$FormatNumber$Locales$Min(0),
	negativePrefix: '−',
	negativeSuffix: '',
	positivePrefix: '',
	positiveSuffix: '',
	thousandSeparator: '',
	zeroPrefix: '',
	zeroSuffix: ''
};
var $cuducos$elm_format_number$FormatNumber$Locales$usLocale = _Utils_update(
	$cuducos$elm_format_number$FormatNumber$Locales$base,
	{
		decimals: $cuducos$elm_format_number$FormatNumber$Locales$Exact(2),
		thousandSeparator: ','
	});
var $author$project$Morphir$Visual$Common$cssClass = function (className) {
	return $mdgriffith$elm_ui$Element$htmlAttribute(
		$elm$html$Html$Attributes$class(className));
};
var $author$project$Morphir$Visual$ViewLiteral$viewLiteralText = F2(
	function (className, literalText) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_Nil,
			A2(
				$mdgriffith$elm_ui$Element$row,
				_List_fromArray(
					[
						$author$project$Morphir$Visual$Common$cssClass(className)
					]),
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$text(literalText)
					])));
	});
var $author$project$Morphir$Visual$ViewLiteral$view = F2(
	function (config, literal) {
		switch (literal.$) {
			case 'BoolLiteral':
				var bool = literal.a;
				return A2(
					$author$project$Morphir$Visual$ViewLiteral$viewLiteralText,
					'bool-literal',
					function () {
						if (bool) {
							return 'True';
						} else {
							return 'False';
						}
					}());
			case 'CharLiteral':
				var _char = literal.a;
				return A2(
					$author$project$Morphir$Visual$ViewLiteral$viewLiteralText,
					'char-literal',
					$elm$core$String$concat(
						_List_fromArray(
							[
								'\'',
								$elm$core$String$fromChar(_char),
								'\''
							])));
			case 'StringLiteral':
				var string = literal.a;
				return A2(
					$author$project$Morphir$Visual$ViewLiteral$viewLiteralText,
					'string-literal',
					$elm$core$String$concat(
						_List_fromArray(
							['\"', string, '\"'])));
			case 'IntLiteral':
				var _int = literal.a;
				return A2(
					$author$project$Morphir$Visual$ViewLiteral$viewLiteralText,
					'int-literal',
					A2(
						$cuducos$elm_format_number$FormatNumber$format,
						_Utils_update(
							$cuducos$elm_format_number$FormatNumber$Locales$usLocale,
							{
								decimals: $cuducos$elm_format_number$FormatNumber$Locales$Exact(0),
								negativePrefix: '- ( ',
								negativeSuffix: ' )'
							}),
						_int));
			default:
				var _float = literal.a;
				return A2(
					$author$project$Morphir$Visual$ViewLiteral$viewLiteralText,
					'float-literal',
					A2(
						$cuducos$elm_format_number$FormatNumber$format,
						_Utils_update(
							$cuducos$elm_format_number$FormatNumber$Locales$usLocale,
							{
								decimals: $cuducos$elm_format_number$FormatNumber$Locales$Exact(config.state.theme.decimalDigit),
								negativePrefix: '- ( ',
								negativeSuffix: ' )'
							}),
						_float));
		}
	});
var $mdgriffith$elm_ui$Element$Column = F3(
	function (header, width, view) {
		return {header: header, view: view, width: width};
	});
var $author$project$Morphir$Visual$Components$DecisionTable$Pattern = function (a) {
	return {$: 'Pattern', a: a};
};
var $author$project$Morphir$IR$FQName$getLocalName = function (_v0) {
	var l = _v0.c;
	return l;
};
var $author$project$Morphir$Visual$Components$DecisionTable$highlightColor = {
	_default: A3($mdgriffith$elm_ui$Element$rgb255, 255, 255, 255),
	_false: A3($mdgriffith$elm_ui$Element$rgb255, 180, 100, 100),
	_true: A3($mdgriffith$elm_ui$Element$rgb255, 100, 180, 100)
};
var $author$project$Morphir$Visual$Components$DecisionTable$highlightStateToColor = function (highlightState) {
	if (highlightState.$ === 'Just') {
		var state = highlightState.a;
		switch (state.$) {
			case 'Matched':
				return $author$project$Morphir$Visual$Components$DecisionTable$highlightColor._true;
			case 'Unmatched':
				return $author$project$Morphir$Visual$Components$DecisionTable$highlightColor._false;
			default:
				return $author$project$Morphir$Visual$Components$DecisionTable$highlightColor._default;
		}
	} else {
		return $author$project$Morphir$Visual$Components$DecisionTable$highlightColor._default;
	}
};
var $author$project$Morphir$Visual$Components$DecisionTable$toTypedPattern = function (match) {
	return A2(
		$author$project$Morphir$IR$Value$mapPatternAttributes,
		$elm$core$Basics$always(
			$author$project$Morphir$IR$Value$patternAttribute(match)),
		match);
};
var $author$project$Morphir$Visual$Components$DecisionTable$patternToMatch = function (pattern) {
	return $author$project$Morphir$Visual$Components$DecisionTable$Pattern(
		$author$project$Morphir$Visual$Components$DecisionTable$toTypedPattern(pattern));
};
var $author$project$Morphir$Visual$Components$DecisionTable$toVisualTypedValue = function (typedValue) {
	return A3($author$project$Morphir$IR$Value$indexedMapValue, $elm$core$Tuple$pair, 0, typedValue).a;
};
var $author$project$Morphir$Visual$Components$DecisionTable$updateConfig = F2(
	function (config, highlightState) {
		var tableState = config.state;
		var updatedTableState = _Utils_update(
			tableState,
			{highlightState: highlightState});
		return _Utils_update(
			config,
			{state: updatedTableState});
	});
var $author$project$Morphir$Visual$Components$DecisionTable$getCaseFromIndex = F5(
	function (config, head, viewValue, highlightState, rule) {
		getCaseFromIndex:
		while (true) {
			if (rule.$ === 'Just') {
				var match = rule.a;
				if (match.$ === 'Pattern') {
					var pattern = match.a;
					var updatedConfig = A2($author$project$Morphir$Visual$Components$DecisionTable$updateConfig, config, highlightState);
					var result = $author$project$Morphir$Visual$Components$DecisionTable$highlightStateToColor(highlightState);
					switch (pattern.$) {
						case 'WildcardPattern':
							return A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$Background$color(result),
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
									]),
								$mdgriffith$elm_ui$Element$text('_'));
						case 'LiteralPattern':
							var va = pattern.a;
							var literal = pattern.b;
							var value = $author$project$Morphir$Visual$Components$DecisionTable$toVisualTypedValue(
								A2($author$project$Morphir$IR$Value$Literal, va, literal));
							return A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$Background$color(result),
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
									]),
								A2(viewValue, updatedConfig, value));
						case 'ConstructorPattern':
							var tpe = pattern.a;
							var fQName = pattern.b;
							var matches = pattern.c;
							var parsedMatches = A2(
								$elm$core$List$map,
								A2(
									$elm$core$Basics$composeL,
									A2(
										$elm$core$Basics$composeL,
										A2(
											$elm$core$Basics$composeL,
											A4($author$project$Morphir$Visual$Components$DecisionTable$getCaseFromIndex, config, head, viewValue, highlightState),
											$elm$core$Maybe$Just),
										$author$project$Morphir$Visual$Components$DecisionTable$Pattern),
									$author$project$Morphir$Visual$Components$DecisionTable$toTypedPattern),
								matches);
							return A2(
								$mdgriffith$elm_ui$Element$row,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
										$mdgriffith$elm_ui$Element$Background$color(result),
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
									]),
								$elm$core$List$concat(
									_List_fromArray(
										[
											_List_fromArray(
											[
												$mdgriffith$elm_ui$Element$text('('),
												$mdgriffith$elm_ui$Element$text(
												$author$project$Morphir$Visual$Common$nameToText(
													$author$project$Morphir$IR$FQName$getLocalName(fQName)))
											]),
											A2(
											$elm$core$List$intersperse,
											$mdgriffith$elm_ui$Element$text(','),
											parsedMatches),
											_List_fromArray(
											[
												$mdgriffith$elm_ui$Element$text(')')
											])
										])));
						case 'AsPattern':
							var tpe = pattern.a;
							var asPattern = pattern.b;
							var name = pattern.c;
							var $temp$config = config,
								$temp$head = head,
								$temp$viewValue = viewValue,
								$temp$highlightState = highlightState,
								$temp$rule = $elm$core$Maybe$Just(
								$author$project$Morphir$Visual$Components$DecisionTable$patternToMatch(asPattern));
							config = $temp$config;
							head = $temp$head;
							viewValue = $temp$viewValue;
							highlightState = $temp$highlightState;
							rule = $temp$rule;
							continue getCaseFromIndex;
						default:
							return $mdgriffith$elm_ui$Element$text('pattern type not implemented');
					}
				} else {
					return $mdgriffith$elm_ui$Element$text('guard');
				}
			} else {
				return $mdgriffith$elm_ui$Element$text('nothing');
			}
		}
	});
var $author$project$Morphir$Visual$Components$DecisionTable$columnHelper = F4(
	function (config, viewValue, header, index) {
		var head = $author$project$Morphir$Visual$Components$DecisionTable$toVisualTypedValue(header);
		return _List_fromArray(
			[
				A3(
				$mdgriffith$elm_ui$Element$Column,
				A2(
					$mdgriffith$elm_ui$Element$el,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$Border$widthEach(
							{bottom: 1, left: 0, right: 0, top: 0}),
							$mdgriffith$elm_ui$Element$padding(
							$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme)),
							$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
						]),
					A2(viewValue, config, head)),
				$mdgriffith$elm_ui$Element$fill,
				function (rules) {
					return A5(
						$author$project$Morphir$Visual$Components$DecisionTable$getCaseFromIndex,
						config,
						head,
						viewValue,
						$elm$core$List$head(
							A2($elm$core$List$drop, index, rules.highlightStates)),
						$elm$core$List$head(
							A2($elm$core$List$drop, index, rules.matches)));
				})
			]);
	});
var $author$project$Morphir$Visual$Components$DecisionTable$getColumnFromHeader = F4(
	function (config, viewValue, index, decomposeInput) {
		if (decomposeInput.b) {
			if (!decomposeInput.b.b) {
				var inputHead = decomposeInput.a;
				return A4($author$project$Morphir$Visual$Components$DecisionTable$columnHelper, config, viewValue, inputHead, index);
			} else {
				var inputHead = decomposeInput.a;
				var inputTail = decomposeInput.b;
				return $elm$core$List$concat(
					_List_fromArray(
						[
							A4($author$project$Morphir$Visual$Components$DecisionTable$columnHelper, config, viewValue, inputHead, index),
							A4($author$project$Morphir$Visual$Components$DecisionTable$getColumnFromHeader, config, viewValue, index + 1, inputTail)
						]));
			}
		} else {
			return _List_Nil;
		}
	});
var $author$project$Morphir$Visual$Components$DecisionTable$tableHelp = F4(
	function (config, viewValue, headerFunctions, rows) {
		return A2(
			$mdgriffith$elm_ui$Element$table,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$Border$solid,
					$mdgriffith$elm_ui$Element$Border$width(1)
				]),
			{
				columns: A2(
					$elm$core$List$append,
					A4($author$project$Morphir$Visual$Components$DecisionTable$getColumnFromHeader, config, viewValue, 0, headerFunctions),
					_List_fromArray(
						[
							A3(
							$mdgriffith$elm_ui$Element$Column,
							A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$Border$widthEach(
										{bottom: 1, left: 0, right: 0, top: 0}),
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme)),
										$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill)
									]),
								$mdgriffith$elm_ui$Element$text('Result')),
							$mdgriffith$elm_ui$Element$fill,
							function (rules) {
								return A2(
									$mdgriffith$elm_ui$Element$el,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$Background$color(
											$author$project$Morphir$Visual$Components$DecisionTable$highlightStateToColor(
												$elm$core$List$head(
													$elm$core$List$reverse(rules.highlightStates)))),
											$mdgriffith$elm_ui$Element$padding(
											$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme))
										]),
									A2(
										viewValue,
										A2(
											$author$project$Morphir$Visual$Components$DecisionTable$updateConfig,
											config,
											$elm$core$List$head(
												$elm$core$List$reverse(rules.highlightStates))),
										$author$project$Morphir$Visual$Components$DecisionTable$toVisualTypedValue(rules.result)));
							})
						])),
				data: rows
			});
	});
var $author$project$Morphir$Visual$Components$DecisionTable$displayTable = F3(
	function (config, viewValue, table) {
		return A4($author$project$Morphir$Visual$Components$DecisionTable$tableHelp, config, viewValue, table.decomposeInput, table.rules);
	});
var $author$project$Morphir$Visual$Components$DecisionTable$Rule = F3(
	function (matches, result, highlightStates) {
		return {highlightStates: highlightStates, matches: matches, result: result};
	});
var $author$project$Morphir$Visual$ViewPatternMatch$decomposeInput = function (subject) {
	if (subject.$ === 'Tuple') {
		var elems = subject.b;
		return A2($elm$core$List$concatMap, $author$project$Morphir$Visual$ViewPatternMatch$decomposeInput, elems);
	} else {
		return _List_fromArray(
			[subject]);
	}
};
var $author$project$Morphir$Visual$Config$Default = {$: 'Default'};
var $author$project$Morphir$Visual$Config$Matched = {$: 'Matched'};
var $author$project$Morphir$Visual$Config$Unmatched = {$: 'Unmatched'};
var $author$project$Morphir$Visual$ViewPatternMatch$getNextHighlightState = F3(
	function (config, currentMatch, previousStates) {
		var lastState = function () {
			var _v5 = $elm$core$List$reverse(previousStates);
			if (_v5.b) {
				var x = _v5.a;
				return x;
			} else {
				return $author$project$Morphir$Visual$Config$Matched;
			}
		}();
		var nextState = function () {
			if (lastState.$ === 'Matched') {
				var subject = currentMatch.a;
				var match = currentMatch.b;
				if (match.$ === 'Pattern') {
					var pattern = match.a;
					var rawPattern = A2(
						$author$project$Morphir$IR$Value$mapPatternAttributes,
						$elm$core$Basics$always(_Utils_Tuple0),
						pattern);
					var _v3 = A2(
						$author$project$Morphir$Visual$Config$evaluate,
						$author$project$Morphir$IR$Value$toRawValue(subject),
						config);
					if (_v3.$ === 'Ok') {
						var value = _v3.a;
						var _v4 = A2($author$project$Morphir$Value$Interpreter$matchPattern, rawPattern, value);
						if (_v4.$ === 'Ok') {
							return $author$project$Morphir$Visual$Config$Matched;
						} else {
							return $author$project$Morphir$Visual$Config$Unmatched;
						}
					} else {
						return $author$project$Morphir$Visual$Config$Default;
					}
				} else {
					return $author$project$Morphir$Visual$Config$Default;
				}
			} else {
				return $author$project$Morphir$Visual$Config$Default;
			}
		}();
		return A2(
			$elm$core$List$append,
			previousStates,
			_List_fromArray(
				[nextState]));
	});
var $author$project$Morphir$Visual$ViewPatternMatch$isNotDefaultHighlightState = function (highlightState) {
	return !_Utils_eq(highlightState, $author$project$Morphir$Visual$Config$Default);
};
var $author$project$Morphir$Visual$ViewPatternMatch$isFullyDefaultRow = function (highlightStates) {
	return !$elm$core$List$length(
		A2($elm$core$List$filter, $author$project$Morphir$Visual$ViewPatternMatch$isNotDefaultHighlightState, highlightStates));
};
var $author$project$Morphir$Visual$ViewPatternMatch$isNotMatchedHighlightState = function (highlightState) {
	return !_Utils_eq(highlightState, $author$project$Morphir$Visual$Config$Matched);
};
var $author$project$Morphir$Visual$ViewPatternMatch$isFullyMatchedRow = function (highlightStates) {
	return !$elm$core$List$length(
		A2($elm$core$List$filter, $author$project$Morphir$Visual$ViewPatternMatch$isNotMatchedHighlightState, highlightStates));
};
var $author$project$Morphir$Visual$ViewPatternMatch$comparePreviousHighlightStates = F3(
	function (config, matches, previousStates) {
		var mostRecentRow = function () {
			var _v1 = $elm$core$List$reverse(previousStates);
			if (_v1.b) {
				var x = _v1.a;
				return x;
			} else {
				return _List_Nil;
			}
		}();
		var nextMatches = function () {
			if (mostRecentRow.b) {
				var x = mostRecentRow.a;
				if ($author$project$Morphir$Visual$ViewPatternMatch$isFullyMatchedRow(mostRecentRow) || $author$project$Morphir$Visual$ViewPatternMatch$isFullyDefaultRow(mostRecentRow)) {
					return A2(
						$elm$core$List$repeat,
						$elm$core$List$length(matches) + 1,
						$author$project$Morphir$Visual$Config$Default);
				} else {
					var nextStates = A3(
						$elm$core$List$foldl,
						$author$project$Morphir$Visual$ViewPatternMatch$getNextHighlightState(config),
						_List_Nil,
						matches);
					return $author$project$Morphir$Visual$ViewPatternMatch$isFullyMatchedRow(nextStates) ? A2(
						$elm$core$List$append,
						nextStates,
						_List_fromArray(
							[$author$project$Morphir$Visual$Config$Matched])) : A2(
						$elm$core$List$append,
						nextStates,
						_List_fromArray(
							[$author$project$Morphir$Visual$Config$Default]));
				}
			} else {
				var nextStates = A3(
					$elm$core$List$foldl,
					$author$project$Morphir$Visual$ViewPatternMatch$getNextHighlightState(config),
					_List_Nil,
					matches);
				return $author$project$Morphir$Visual$ViewPatternMatch$isFullyMatchedRow(nextStates) ? A2(
					$elm$core$List$append,
					nextStates,
					_List_fromArray(
						[$author$project$Morphir$Visual$Config$Matched])) : A2(
					$elm$core$List$append,
					nextStates,
					_List_fromArray(
						[$author$project$Morphir$Visual$Config$Default]));
			}
		}();
		return A2(
			$elm$core$List$append,
			previousStates,
			_List_fromArray(
				[nextMatches]));
	});
var $author$project$Morphir$Visual$ViewPatternMatch$getHighlightStates = F3(
	function (config, subject, matches) {
		var patterns = A2(
			$elm$core$List$map,
			function (x) {
				return x.a;
			},
			matches);
		var referencedPatterns = A2(
			$elm$core$List$map,
			A2($elm$core$List$map2, $elm$core$Tuple$pair, subject),
			patterns);
		var _v0 = config.state.highlightState;
		if (_v0.$ === 'Nothing') {
			return A3(
				$elm$core$List$foldl,
				$author$project$Morphir$Visual$ViewPatternMatch$comparePreviousHighlightStates(config),
				_List_Nil,
				referencedPatterns);
		} else {
			var highlightState = _v0.a;
			if (highlightState.$ === 'Matched') {
				return A3(
					$elm$core$List$foldl,
					$author$project$Morphir$Visual$ViewPatternMatch$comparePreviousHighlightStates(config),
					_List_Nil,
					referencedPatterns);
			} else {
				return A2(
					$elm$core$List$map,
					function (x) {
						return A2(
							$elm$core$List$repeat,
							$elm$core$List$length(x),
							$author$project$Morphir$Visual$Config$Default);
					},
					patterns);
			}
		}
	});
var $author$project$Morphir$Visual$ViewPatternMatch$decomposePattern = F2(
	function (subject, match) {
		switch (match.a.$) {
			case 'WildcardPattern':
				var tpe = match.a.a;
				var wildcardMatch = $author$project$Morphir$Visual$Components$DecisionTable$Pattern(match.a);
				return _List_fromArray(
					[
						_Utils_Tuple2(
						A2(
							$elm$core$List$repeat,
							$elm$core$List$length(subject),
							wildcardMatch),
						match.b)
					]);
			case 'LiteralPattern':
				var _v1 = match.a;
				var tpe = _v1.a;
				var literal = _v1.b;
				var literalMatch = $author$project$Morphir$Visual$Components$DecisionTable$Pattern(match.a);
				return _List_fromArray(
					[
						_Utils_Tuple2(
						_List_fromArray(
							[literalMatch]),
						match.b)
					]);
			case 'TuplePattern':
				var _v2 = match.a;
				var tpe = _v2.a;
				var matches = _v2.b;
				var tupleMatch = A2($elm$core$List$map, $author$project$Morphir$Visual$Components$DecisionTable$Pattern, matches);
				return _List_fromArray(
					[
						_Utils_Tuple2(tupleMatch, match.b)
					]);
			case 'ConstructorPattern':
				var _v3 = match.a;
				var tpe = _v3.a;
				var fQName = _v3.b;
				var matches = _v3.c;
				var constructorMatch = $author$project$Morphir$Visual$Components$DecisionTable$Pattern(match.a);
				return _List_fromArray(
					[
						_Utils_Tuple2(
						_List_fromArray(
							[constructorMatch]),
						match.b)
					]);
			case 'AsPattern':
				var _v4 = match.a;
				var tpe = _v4.a;
				var pattern = _v4.b;
				var name = _v4.c;
				var asMatch = $author$project$Morphir$Visual$Components$DecisionTable$Pattern(match.a);
				return _List_fromArray(
					[
						_Utils_Tuple2(
						_List_fromArray(
							[asMatch]),
						match.b)
					]);
			default:
				return _List_Nil;
		}
	});
var $author$project$Morphir$Visual$ViewPatternMatch$getRules = F2(
	function (subject, matches) {
		return A2(
			$elm$core$List$concatMap,
			$author$project$Morphir$Visual$ViewPatternMatch$decomposePattern(subject),
			matches);
	});
var $author$project$Morphir$Visual$ViewPatternMatch$toDecisionTable = F3(
	function (config, subject, matches) {
		var decomposedInput = $author$project$Morphir$Visual$ViewPatternMatch$decomposeInput(subject);
		var rules = A2($author$project$Morphir$Visual$ViewPatternMatch$getRules, decomposedInput, matches);
		var highlights = A3($author$project$Morphir$Visual$ViewPatternMatch$getHighlightStates, config, decomposedInput, rules);
		return {
			decomposeInput: decomposedInput,
			rules: A3(
				$elm$core$List$map2,
				F2(
					function (rows, highlightStates) {
						return A3($author$project$Morphir$Visual$Components$DecisionTable$Rule, rows.a, rows.b, highlightStates);
					}),
				rules,
				highlights)
		};
	});
var $author$project$Morphir$Visual$ViewPatternMatch$toTypedPattern = function (match) {
	return A2(
		$author$project$Morphir$IR$Value$mapPatternAttributes,
		A2(
			$elm$core$Basics$always,
			$elm$core$Tuple$second,
			$author$project$Morphir$IR$Value$patternAttribute(match)),
		match);
};
var $author$project$Morphir$Visual$ViewPatternMatch$toTypedValue = function (visualTypedValue) {
	return A3(
		$author$project$Morphir$IR$Value$mapValueAttributes,
		$elm$core$Basics$always(_Utils_Tuple0),
		A2(
			$elm$core$Basics$always,
			$elm$core$Tuple$second,
			$author$project$Morphir$IR$Value$valueAttribute(visualTypedValue)),
		visualTypedValue);
};
var $author$project$Morphir$Visual$ViewPatternMatch$view = F4(
	function (config, viewValue, subject, matches) {
		var typedSubject = $author$project$Morphir$Visual$ViewPatternMatch$toTypedValue(subject);
		var typedMatches = A2(
			$elm$core$List$map,
			function (_v0) {
				var a = _v0.a;
				var b = _v0.b;
				return _Utils_Tuple2(
					$author$project$Morphir$Visual$ViewPatternMatch$toTypedPattern(a),
					$author$project$Morphir$Visual$ViewPatternMatch$toTypedValue(b));
			},
			matches);
		var decisionTable = A3($author$project$Morphir$Visual$ViewPatternMatch$toDecisionTable, config, typedSubject, typedMatches);
		return A3($author$project$Morphir$Visual$Components$DecisionTable$displayTable, config, viewValue, decisionTable);
	});
var $author$project$Morphir$Visual$ViewRecord$view = F3(
	function (config, viewValue, items) {
		return A2(
			$mdgriffith$elm_ui$Element$table,
			_List_fromArray(
				[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY]),
			{
				columns: _List_fromArray(
					[
						{
						header: A2(
							$mdgriffith$elm_ui$Element$el,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$Border$widthEach(
									{bottom: 1, left: 1, right: 0, top: 1}),
									$mdgriffith$elm_ui$Element$padding(
									$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
								]),
							A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY, $mdgriffith$elm_ui$Element$Font$bold]),
								$mdgriffith$elm_ui$Element$text('Field Name'))),
						view: function (_v0) {
							var name = _v0.a;
							return A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
										$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
										$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill),
										$mdgriffith$elm_ui$Element$Border$widthEach(
										{bottom: 1, left: 1, right: 0, top: 0})
									]),
								A2(
									$mdgriffith$elm_ui$Element$el,
									_List_fromArray(
										[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY]),
									$mdgriffith$elm_ui$Element$text(
										$author$project$Morphir$Visual$Common$nameToText(name))));
						},
						width: $mdgriffith$elm_ui$Element$fill
					},
						{
						header: A2(
							$mdgriffith$elm_ui$Element$el,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$Border$widthEach(
									{bottom: 1, left: 1, right: 1, top: 1}),
									$mdgriffith$elm_ui$Element$padding(
									$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
								]),
							A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY, $mdgriffith$elm_ui$Element$Font$bold]),
								$mdgriffith$elm_ui$Element$text('Field Value'))),
						view: function (_v1) {
							var val = _v1.b;
							return A2(
								$mdgriffith$elm_ui$Element$el,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$padding(
										$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
										$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
										$mdgriffith$elm_ui$Element$height($mdgriffith$elm_ui$Element$fill),
										$mdgriffith$elm_ui$Element$Border$widthEach(
										{bottom: 1, left: 1, right: 1, top: 0})
									]),
								A2(
									$mdgriffith$elm_ui$Element$el,
									_List_fromArray(
										[$mdgriffith$elm_ui$Element$centerX, $mdgriffith$elm_ui$Element$centerY]),
									viewValue(val)));
						},
						width: $mdgriffith$elm_ui$Element$fill
					}
					]),
				data: items
			});
	});
var $author$project$Morphir$Visual$ViewReference$view = F3(
	function (config, viewValue, fQName) {
		var packageName = fQName.a;
		var moduleName = fQName.b;
		var localName = fQName.c;
		return A2(
			$mdgriffith$elm_ui$Element$row,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$padding(
					$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
					$mdgriffith$elm_ui$Element$spacing(
					$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme)),
					$mdgriffith$elm_ui$Element$Events$onClick(
					A2(config.handlers.onReferenceClicked, fQName, false))
				]),
			_List_fromArray(
				[
					A2(
					$mdgriffith$elm_ui$Element$el,
					_List_Nil,
					$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$Visual$Common$nameToText(localName)))
				]));
	});
var $author$project$Morphir$Visual$ViewTuple$view = F3(
	function (config, viewValue, elems) {
		return A2(
			$mdgriffith$elm_ui$Element$column,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$spacing(
					$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
				]),
			_List_fromArray(
				[
					A2(
					$mdgriffith$elm_ui$Element$row,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$spacing(
							$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme)),
							$mdgriffith$elm_ui$Element$padding(
							$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
						]),
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$text('('),
							A2(
							$mdgriffith$elm_ui$Element$row,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$spacing(
									$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
								]),
							A2(
								$elm$core$List$intersperse,
								$mdgriffith$elm_ui$Element$text(','),
								A2($elm$core$List$map, viewValue, elems))),
							$mdgriffith$elm_ui$Element$text(')')
						]))
				]));
	});
var $author$project$Morphir$Visual$XRayView$viewType = function (tpe) {
	switch (tpe.$) {
		case 'Variable':
			var varName = tpe.b;
			return $mdgriffith$elm_ui$Element$text(
				$author$project$Morphir$IR$Name$toCamelCase(varName));
		case 'Reference':
			var _v1 = tpe.b;
			var localName = _v1.c;
			var argTypes = tpe.c;
			return $elm$core$List$isEmpty(argTypes) ? $mdgriffith$elm_ui$Element$text(
				$author$project$Morphir$IR$Name$toTitleCase(localName)) : A2(
				$mdgriffith$elm_ui$Element$row,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$spacing(6)
					]),
				$elm$core$List$concat(
					_List_fromArray(
						[
							_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$text(
								$author$project$Morphir$IR$Name$toTitleCase(localName))
							]),
							A2($elm$core$List$map, $author$project$Morphir$Visual$XRayView$viewType, argTypes)
						])));
		case 'Tuple':
			var a = tpe.a;
			var elems = tpe.b;
			var elemsView = A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				A2(
					$elm$core$List$intersperse,
					$mdgriffith$elm_ui$Element$text(', '),
					A2($elm$core$List$map, $author$project$Morphir$Visual$XRayView$viewType, elems)));
			return A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$text('( '),
						elemsView,
						$mdgriffith$elm_ui$Element$text(' )')
					]));
		case 'Record':
			var a = tpe.a;
			var fields = tpe.b;
			var fieldsView = A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				A2(
					$elm$core$List$intersperse,
					$mdgriffith$elm_ui$Element$text(', '),
					A2(
						$elm$core$List$map,
						function (field) {
							return A2(
								$mdgriffith$elm_ui$Element$row,
								_List_Nil,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$text(
										$author$project$Morphir$IR$Name$toCamelCase(field.name)),
										$mdgriffith$elm_ui$Element$text(' : '),
										$author$project$Morphir$Visual$XRayView$viewType(field.tpe)
									]));
						},
						fields)));
			return A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$text('{ '),
						fieldsView,
						$mdgriffith$elm_ui$Element$text(' }')
					]));
		case 'ExtensibleRecord':
			var a = tpe.a;
			var varName = tpe.b;
			var fields = tpe.c;
			var fieldsView = A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				A2(
					$elm$core$List$intersperse,
					$mdgriffith$elm_ui$Element$text(', '),
					A2(
						$elm$core$List$map,
						function (field) {
							return A2(
								$mdgriffith$elm_ui$Element$row,
								_List_Nil,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$text(
										$author$project$Morphir$IR$Name$toCamelCase(field.name)),
										$mdgriffith$elm_ui$Element$text(' : '),
										$author$project$Morphir$Visual$XRayView$viewType(field.tpe)
									]));
						},
						fields)));
			return A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$text('{ '),
						$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$IR$Name$toCamelCase(varName)),
						$mdgriffith$elm_ui$Element$text(' | '),
						fieldsView,
						$mdgriffith$elm_ui$Element$text(' }')
					]));
		case 'Function':
			var argType = tpe.b;
			var returnType = tpe.c;
			return A2(
				$mdgriffith$elm_ui$Element$row,
				_List_Nil,
				_List_fromArray(
					[
						$author$project$Morphir$Visual$XRayView$viewType(argType),
						$mdgriffith$elm_ui$Element$text(' -> '),
						$author$project$Morphir$Visual$XRayView$viewType(returnType)
					]));
		default:
			return $mdgriffith$elm_ui$Element$text('()');
	}
};
var $mdgriffith$elm_ui$Element$Font$family = function (families) {
	return A2(
		$mdgriffith$elm_ui$Internal$Model$StyleClass,
		$mdgriffith$elm_ui$Internal$Flag$fontFamily,
		A2(
			$mdgriffith$elm_ui$Internal$Model$FontFamily,
			A3($elm$core$List$foldl, $mdgriffith$elm_ui$Internal$Model$renderFontClassName, 'ff-', families),
			families));
};
var $author$project$Morphir$Visual$Common$grayScale = function (v) {
	return A3($mdgriffith$elm_ui$Element$rgb, v, v, v);
};
var $mdgriffith$elm_ui$Internal$Model$Monospace = {$: 'Monospace'};
var $mdgriffith$elm_ui$Element$Font$monospace = $mdgriffith$elm_ui$Internal$Model$Monospace;
var $author$project$Morphir$Visual$XRayView$TreeNode = F3(
	function (a, b, c) {
		return {$: 'TreeNode', a: a, b: b, c: c};
	});
var $author$project$Morphir$Visual$XRayView$ValueNode = function (a) {
	return {$: 'ValueNode', a: a};
};
var $author$project$Morphir$Visual$XRayView$PatternNode = function (a) {
	return {$: 'PatternNode', a: a};
};
var $author$project$Morphir$Visual$XRayView$patternToNode = F2(
	function (maybeTag, pattern) {
		switch (pattern.$) {
			case 'AsPattern':
				var target = pattern.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					maybeTag,
					$author$project$Morphir$Visual$XRayView$PatternNode(pattern),
					_List_fromArray(
						[
							A2($author$project$Morphir$Visual$XRayView$patternToNode, $elm$core$Maybe$Nothing, target)
						]));
			case 'TuplePattern':
				var elems = pattern.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					maybeTag,
					$author$project$Morphir$Visual$XRayView$PatternNode(pattern),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Visual$XRayView$patternToNode($elm$core$Maybe$Nothing),
						elems));
			case 'ConstructorPattern':
				var args = pattern.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					maybeTag,
					$author$project$Morphir$Visual$XRayView$PatternNode(pattern),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Visual$XRayView$patternToNode($elm$core$Maybe$Nothing),
						args));
			case 'HeadTailPattern':
				var head = pattern.b;
				var tail = pattern.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					maybeTag,
					$author$project$Morphir$Visual$XRayView$PatternNode(pattern),
					_List_fromArray(
						[
							A2($author$project$Morphir$Visual$XRayView$patternToNode, $elm$core$Maybe$Nothing, head),
							A2($author$project$Morphir$Visual$XRayView$patternToNode, $elm$core$Maybe$Nothing, tail)
						]));
			default:
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					maybeTag,
					$author$project$Morphir$Visual$XRayView$PatternNode(pattern),
					_List_Nil);
		}
	});
var $author$project$Morphir$Visual$XRayView$valueToNode = F2(
	function (tag, value) {
		switch (value.$) {
			case 'Tuple':
				var elems = value.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Visual$XRayView$valueToNode($elm$core$Maybe$Nothing),
						elems));
			case 'List':
				var items = value.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					A2(
						$elm$core$List$map,
						$author$project$Morphir$Visual$XRayView$valueToNode($elm$core$Maybe$Nothing),
						items));
			case 'Record':
				var fields = value.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					A2(
						$elm$core$List$map,
						function (_v1) {
							var fieldName = _v1.a;
							var fieldValue = _v1.b;
							return A2(
								$author$project$Morphir$Visual$XRayView$valueToNode,
								$elm$core$Maybe$Just(
									$author$project$Morphir$IR$Name$toCamelCase(fieldName)),
								fieldValue);
						},
						fields));
			case 'Field':
				var subject = value.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('subject'),
							subject)
						]));
			case 'Apply':
				var fun = value.b;
				var arg = value.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('fun'),
							fun),
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('arg'),
							arg)
						]));
			case 'Lambda':
				var arg = value.b;
				var body = value.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Visual$XRayView$patternToNode,
							$elm$core$Maybe$Just('\\'),
							arg),
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('->'),
							body)
						]));
			case 'LetDefinition':
				var flattenLet = function (v) {
					if (v.$ === 'LetDefinition') {
						var defName = v.b;
						var def = v.c;
						var inValue = v.d;
						var _v3 = flattenLet(inValue);
						var subInValue = _v3.a;
						var subDefs = _v3.b;
						return _Utils_Tuple2(
							subInValue,
							A2(
								$elm$core$List$cons,
								_Utils_Tuple2(defName, def),
								subDefs));
					} else {
						return _Utils_Tuple2(v, _List_Nil);
					}
				};
				var _v4 = flattenLet(value);
				var bottomInValue = _v4.a;
				var defs = _v4.b;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					$elm$core$List$concat(
						_List_fromArray(
							[
								A2(
								$elm$core$List$map,
								function (_v5) {
									var defName = _v5.a;
									var def = _v5.b;
									return A2(
										$author$project$Morphir$Visual$XRayView$valueToNode,
										$elm$core$Maybe$Just(
											$author$project$Morphir$IR$Name$toCamelCase(defName)),
										def.body);
								},
								defs),
								_List_fromArray(
								[
									A2(
									$author$project$Morphir$Visual$XRayView$valueToNode,
									$elm$core$Maybe$Just('in'),
									bottomInValue)
								])
							])));
			case 'LetRecursion':
				var defs = value.b;
				var inValue = value.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					$elm$core$List$concat(
						_List_fromArray(
							[
								A2(
								$elm$core$List$map,
								function (_v6) {
									var defName = _v6.a;
									var def = _v6.b;
									return A2(
										$author$project$Morphir$Visual$XRayView$valueToNode,
										$elm$core$Maybe$Just(
											$author$project$Morphir$IR$Name$toCamelCase(defName)),
										def.body);
								},
								$elm$core$Dict$toList(defs)),
								_List_fromArray(
								[
									A2(
									$author$project$Morphir$Visual$XRayView$valueToNode,
									$elm$core$Maybe$Just('in'),
									inValue)
								])
							])));
			case 'Destructure':
				var pattern = value.b;
				var subject = value.c;
				var inValue = value.d;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					_List_fromArray(
						[
							A2($author$project$Morphir$Visual$XRayView$patternToNode, $elm$core$Maybe$Nothing, pattern),
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('='),
							subject),
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('in'),
							inValue)
						]));
			case 'IfThenElse':
				var cond = value.b;
				var thenBranch = value.c;
				var elseBranch = value.d;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					_List_fromArray(
						[
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('cond'),
							cond),
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('then'),
							thenBranch),
							A2(
							$author$project$Morphir$Visual$XRayView$valueToNode,
							$elm$core$Maybe$Just('else'),
							elseBranch)
						]));
			case 'PatternMatch':
				var subject = value.b;
				var cases = value.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					$elm$core$List$concat(
						_List_fromArray(
							[
								_List_fromArray(
								[
									A2(
									$author$project$Morphir$Visual$XRayView$valueToNode,
									$elm$core$Maybe$Just('case'),
									subject)
								]),
								$elm$core$List$concat(
								A2(
									$elm$core$List$indexedMap,
									F2(
										function (index, _v7) {
											var casePattern = _v7.a;
											var caseValue = _v7.b;
											return _List_fromArray(
												[
													A2($author$project$Morphir$Visual$XRayView$patternToNode, $elm$core$Maybe$Nothing, casePattern),
													A2(
													$author$project$Morphir$Visual$XRayView$valueToNode,
													$elm$core$Maybe$Just('->'),
													caseValue)
												]);
										}),
									cases))
							])));
			case 'UpdateRecord':
				var subject = value.b;
				var fields = value.c;
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					$elm$core$List$concat(
						_List_fromArray(
							[
								_List_fromArray(
								[
									A2($author$project$Morphir$Visual$XRayView$valueToNode, $elm$core$Maybe$Nothing, subject)
								]),
								A2(
								$elm$core$List$map,
								function (_v8) {
									var fieldName = _v8.a;
									var fieldValue = _v8.b;
									return A2(
										$author$project$Morphir$Visual$XRayView$valueToNode,
										$elm$core$Maybe$Just(
											$author$project$Morphir$IR$Name$toCamelCase(fieldName)),
										fieldValue);
								},
								fields)
							])));
			default:
				return A3(
					$author$project$Morphir$Visual$XRayView$TreeNode,
					tag,
					$author$project$Morphir$Visual$XRayView$ValueNode(value),
					_List_Nil);
		}
	});
var $author$project$Morphir$Visual$XRayView$noPadding = {bottom: 0, left: 0, right: 0, top: 0};
var $author$project$Morphir$Visual$XRayView$viewConstructorName = function (_v0) {
	var localName = _v0.c;
	return $mdgriffith$elm_ui$Element$text(
		$author$project$Morphir$IR$Name$toTitleCase(localName));
};
var $author$project$Morphir$Visual$XRayView$viewLiteral = function (lit) {
	switch (lit.$) {
		case 'BoolLiteral':
			var bool = lit.a;
			return bool ? $mdgriffith$elm_ui$Element$text('True') : $mdgriffith$elm_ui$Element$text('False');
		case 'CharLiteral':
			var _char = lit.a;
			return $mdgriffith$elm_ui$Element$text(
				$elm$core$String$concat(
					_List_fromArray(
						[
							'\'',
							$elm$core$String$fromChar(_char),
							'\''
						])));
		case 'StringLiteral':
			var string = lit.a;
			return $mdgriffith$elm_ui$Element$text(
				$elm$core$String$concat(
					_List_fromArray(
						['\"', string, '\"'])));
		case 'IntLiteral':
			var _int = lit.a;
			return $mdgriffith$elm_ui$Element$text(
				$elm$core$String$fromInt(_int));
		default:
			var _float = lit.a;
			return $mdgriffith$elm_ui$Element$text(
				$elm$core$String$fromFloat(_float));
	}
};
var $author$project$Morphir$Visual$XRayView$viewPatternAsHeader = function (pattern) {
	var nodeLabel = function (labelText) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_fromArray(
				[
					A2($mdgriffith$elm_ui$Element$paddingXY, 6, 3),
					$mdgriffith$elm_ui$Element$Border$rounded(3),
					$mdgriffith$elm_ui$Element$Background$color(
					A3($mdgriffith$elm_ui$Element$rgb, 1, 0.9, 1))
				]),
			$mdgriffith$elm_ui$Element$text(labelText));
	};
	var header = function (elems) {
		return A2(
			$mdgriffith$elm_ui$Element$row,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$spacing(5)
				]),
			elems);
	};
	switch (pattern.$) {
		case 'WildcardPattern':
			var a = pattern.a;
			return header(
				_List_fromArray(
					[
						nodeLabel('WildcardPattern')
					]));
		case 'AsPattern':
			var a = pattern.a;
			var name = pattern.c;
			return header(
				_List_fromArray(
					[
						nodeLabel('AsPattern'),
						$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$IR$Name$toCamelCase(name))
					]));
		case 'TuplePattern':
			var a = pattern.a;
			return header(
				_List_fromArray(
					[
						nodeLabel('TuplePattern')
					]));
		case 'ConstructorPattern':
			var a = pattern.a;
			var fQName = pattern.b;
			return header(
				_List_fromArray(
					[
						nodeLabel('ConstructorPattern'),
						$author$project$Morphir$Visual$XRayView$viewConstructorName(fQName)
					]));
		case 'EmptyListPattern':
			var a = pattern.a;
			return header(
				_List_fromArray(
					[
						nodeLabel('EmptyListPattern')
					]));
		case 'HeadTailPattern':
			var a = pattern.a;
			return header(
				_List_fromArray(
					[
						nodeLabel('HeadTailPattern')
					]));
		case 'LiteralPattern':
			var a = pattern.a;
			var literal = pattern.b;
			return header(
				_List_fromArray(
					[
						nodeLabel('LiteralPattern'),
						$author$project$Morphir$Visual$XRayView$viewLiteral(literal)
					]));
		default:
			var a = pattern.a;
			return header(
				_List_fromArray(
					[
						nodeLabel('UnitPattern')
					]));
	}
};
var $author$project$Morphir$Visual$XRayView$viewReferenceName = function (_v0) {
	var localName = _v0.c;
	return $mdgriffith$elm_ui$Element$text(
		$author$project$Morphir$IR$Name$toCamelCase(localName));
};
var $author$project$Morphir$Visual$XRayView$viewValueAsHeader = function (value) {
	var logicLabel = function (labelText) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_fromArray(
				[
					A2($mdgriffith$elm_ui$Element$paddingXY, 6, 3),
					$mdgriffith$elm_ui$Element$Border$rounded(3),
					$mdgriffith$elm_ui$Element$Background$color(
					A3($mdgriffith$elm_ui$Element$rgb, 0.9, 1, 0.9))
				]),
			$mdgriffith$elm_ui$Element$text(labelText));
	};
	var header = function (elems) {
		return A2(
			$mdgriffith$elm_ui$Element$row,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$spacing(5)
				]),
			elems);
	};
	var dataLabel = function (labelText) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_fromArray(
				[
					A2($mdgriffith$elm_ui$Element$paddingXY, 6, 3),
					$mdgriffith$elm_ui$Element$Border$rounded(3),
					$mdgriffith$elm_ui$Element$Background$color(
					A3($mdgriffith$elm_ui$Element$rgb, 0.9, 0.9, 1))
				]),
			$mdgriffith$elm_ui$Element$text(labelText));
	};
	switch (value.$) {
		case 'Literal':
			var lit = value.b;
			return header(
				_List_fromArray(
					[
						dataLabel('Literal'),
						$author$project$Morphir$Visual$XRayView$viewLiteral(lit)
					]));
		case 'Constructor':
			var fQName = value.b;
			return header(
				_List_fromArray(
					[
						dataLabel('Constructor'),
						$author$project$Morphir$Visual$XRayView$viewConstructorName(fQName)
					]));
		case 'Tuple':
			var items = value.b;
			return $elm$core$List$isEmpty(items) ? header(
				_List_fromArray(
					[
						dataLabel('Tuple'),
						$mdgriffith$elm_ui$Element$text('()')
					])) : header(
				_List_fromArray(
					[
						dataLabel('Tuple')
					]));
		case 'List':
			var items = value.b;
			return $elm$core$List$isEmpty(items) ? header(
				_List_fromArray(
					[
						dataLabel('List'),
						$mdgriffith$elm_ui$Element$text('[]')
					])) : header(
				_List_fromArray(
					[
						dataLabel('List')
					]));
		case 'Record':
			var fields = value.b;
			return $elm$core$List$isEmpty(fields) ? header(
				_List_fromArray(
					[
						dataLabel('Record'),
						$mdgriffith$elm_ui$Element$text('{}')
					])) : header(
				_List_fromArray(
					[
						dataLabel('Record')
					]));
		case 'Variable':
			var varName = value.b;
			return header(
				_List_fromArray(
					[
						logicLabel('Variable'),
						$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$IR$Name$toCamelCase(varName))
					]));
		case 'Reference':
			var fQName = value.b;
			return header(
				_List_fromArray(
					[
						logicLabel('Reference'),
						$author$project$Morphir$Visual$XRayView$viewReferenceName(fQName)
					]));
		case 'Field':
			var fieldName = value.c;
			return header(
				_List_fromArray(
					[
						logicLabel('Field'),
						$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$IR$Name$toCamelCase(fieldName))
					]));
		case 'FieldFunction':
			var fieldName = value.b;
			return header(
				_List_fromArray(
					[
						logicLabel('FieldFunction'),
						$mdgriffith$elm_ui$Element$text(
						$author$project$Morphir$IR$Name$toCamelCase(fieldName))
					]));
		case 'Apply':
			return header(
				_List_fromArray(
					[
						logicLabel('Apply')
					]));
		case 'Lambda':
			return header(
				_List_fromArray(
					[
						logicLabel('Lambda')
					]));
		case 'LetDefinition':
			return header(
				_List_fromArray(
					[
						logicLabel('LetDefinition')
					]));
		case 'LetRecursion':
			return header(
				_List_fromArray(
					[
						logicLabel('LetRecursion')
					]));
		case 'Destructure':
			return header(
				_List_fromArray(
					[
						logicLabel('Destructure')
					]));
		case 'IfThenElse':
			return header(
				_List_fromArray(
					[
						logicLabel('IfThenElse')
					]));
		case 'PatternMatch':
			return header(
				_List_fromArray(
					[
						logicLabel('PatternMatch')
					]));
		case 'UpdateRecord':
			return header(
				_List_fromArray(
					[
						logicLabel('UpdateRecord')
					]));
		default:
			return header(
				_List_fromArray(
					[
						logicLabel('Unit')
					]));
	}
};
var $author$project$Morphir$Visual$XRayView$viewTreeNode = F2(
	function (viewValueAttr, _v0) {
		var maybeTag = _v0.a;
		var nodeType = _v0.b;
		var treeNodes = _v0.c;
		var viewHeaderAndChildren = F3(
			function (header, attr, children) {
				return A2(
					$mdgriffith$elm_ui$Element$column,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
							$mdgriffith$elm_ui$Element$spacing(5)
						]),
					_List_fromArray(
						[
							A2(
							$mdgriffith$elm_ui$Element$row,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
									$mdgriffith$elm_ui$Element$spacing(5)
								]),
							_List_fromArray(
								[
									function () {
									if (maybeTag.$ === 'Just') {
										var tag = maybeTag.a;
										return A2(
											$mdgriffith$elm_ui$Element$row,
											_List_fromArray(
												[
													$mdgriffith$elm_ui$Element$spacing(5)
												]),
											_List_fromArray(
												[
													A2(
													$mdgriffith$elm_ui$Element$el,
													_List_fromArray(
														[
															$mdgriffith$elm_ui$Element$Font$color(
															$author$project$Morphir$Visual$Common$grayScale(0.7))
														]),
													$mdgriffith$elm_ui$Element$text(tag)),
													header
												]));
									} else {
										return header;
									}
								}(),
									A2(
									$mdgriffith$elm_ui$Element$el,
									_List_fromArray(
										[
											A2($mdgriffith$elm_ui$Element$paddingXY, 10, 2),
											$mdgriffith$elm_ui$Element$Background$color(
											A3($mdgriffith$elm_ui$Element$rgb, 1, 0.9, 0.8)),
											$mdgriffith$elm_ui$Element$Border$rounded(3)
										]),
									attr)
								])),
							A2(
							$mdgriffith$elm_ui$Element$column,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
									$mdgriffith$elm_ui$Element$paddingEach(
									_Utils_update(
										$author$project$Morphir$Visual$XRayView$noPadding,
										{left: 20}))
								]),
							children)
						]));
			});
		if (nodeType.$ === 'ValueNode') {
			var value = nodeType.a;
			return A3(
				viewHeaderAndChildren,
				$author$project$Morphir$Visual$XRayView$viewValueAsHeader(value),
				viewValueAttr(
					$author$project$Morphir$IR$Value$valueAttribute(value)),
				A2(
					$elm$core$List$map,
					$author$project$Morphir$Visual$XRayView$viewTreeNode(viewValueAttr),
					treeNodes));
		} else {
			var pattern = nodeType.a;
			return A3(
				viewHeaderAndChildren,
				$author$project$Morphir$Visual$XRayView$viewPatternAsHeader(pattern),
				viewValueAttr(
					$author$project$Morphir$IR$Value$patternAttribute(pattern)),
				A2(
					$elm$core$List$map,
					$author$project$Morphir$Visual$XRayView$viewTreeNode(viewValueAttr),
					treeNodes));
		}
	});
var $author$project$Morphir$Visual$XRayView$viewValue = F2(
	function (viewValueAttr, value) {
		return A2(
			$mdgriffith$elm_ui$Element$el,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$Font$family(
					_List_fromArray(
						[$mdgriffith$elm_ui$Element$Font$monospace])),
					$mdgriffith$elm_ui$Element$Font$color(
					$author$project$Morphir$Visual$Common$grayScale(0.3))
				]),
			A2(
				$author$project$Morphir$Visual$XRayView$viewTreeNode,
				viewValueAttr,
				A2($author$project$Morphir$Visual$XRayView$valueToNode, $elm$core$Maybe$Nothing, value)));
	});
var $author$project$Morphir$Visual$ViewValue$viewPopup = function (config) {
	return A2(
		$elm$core$Maybe$withDefault,
		A2(
			$mdgriffith$elm_ui$Element$el,
			_List_Nil,
			$mdgriffith$elm_ui$Element$text('')),
		A2(
			$elm$core$Maybe$map,
			function (rawValue) {
				var visualTypedVal = A2(
					$author$project$Morphir$Visual$VisualTypedValue$rawToVisualTypedValue,
					$author$project$Morphir$IR$fromDistribution(config.irContext.distribution),
					rawValue);
				var popUpStyle = function (elementMsg) {
					return A2(
						$mdgriffith$elm_ui$Element$el,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$Border$shadow(
								{
									blur: 2,
									color: config.state.theme.colors.darkest,
									offset: _Utils_Tuple2(2, 2),
									size: 2
								}),
								$mdgriffith$elm_ui$Element$Background$color(config.state.theme.colors.lightest),
								$mdgriffith$elm_ui$Element$Font$bold,
								$mdgriffith$elm_ui$Element$Font$color(config.state.theme.colors.darkest),
								$mdgriffith$elm_ui$Element$Border$rounded(4),
								$mdgriffith$elm_ui$Element$Font$center,
								$mdgriffith$elm_ui$Element$padding(
								$author$project$Morphir$Visual$Theme$mediumPadding(config.state.theme)),
								$mdgriffith$elm_ui$Element$htmlAttribute(
								A2($elm$html$Html$Attributes$style, 'position', 'absolute')),
								$mdgriffith$elm_ui$Element$htmlAttribute(
								A2($elm$html$Html$Attributes$style, 'transition', 'all 0.2s ease-in-out'))
							]),
						elementMsg);
				};
				if (visualTypedVal.$ === 'Ok') {
					var visualTypedValue = visualTypedVal.a;
					return popUpStyle(
						A2($author$project$Morphir$Visual$ViewValue$viewValue, config, visualTypedValue));
				} else {
					var error = visualTypedVal.a;
					return popUpStyle(
						$mdgriffith$elm_ui$Element$text(
							$author$project$Morphir$Type$Infer$typeErrorToMessage(error)));
				}
			},
			config.state.popupVariables.variableValue));
};
var $author$project$Morphir$Visual$ViewValue$viewValue = F2(
	function (config, value) {
		return A2($author$project$Morphir$Visual$ViewValue$viewValueByValueType, config, value);
	});
var $author$project$Morphir$Visual$ViewValue$viewValueByLanguageFeature = F2(
	function (config, value) {
		var valueElem = function () {
			_v0$13:
			while (true) {
				switch (value.$) {
					case 'Literal':
						var literal = value.b;
						return A2($author$project$Morphir$Visual$ViewLiteral$view, config, literal);
					case 'Constructor':
						var fQName = value.b;
						return A3(
							$author$project$Morphir$Visual$ViewReference$view,
							config,
							$author$project$Morphir$Visual$ViewValue$viewValue(config),
							fQName);
					case 'Tuple':
						var elems = value.b;
						return A3(
							$author$project$Morphir$Visual$ViewTuple$view,
							config,
							$author$project$Morphir$Visual$ViewValue$viewValue(config),
							elems);
					case 'List':
						if ((((((((((((((((((((((((value.a.b.$ === 'Reference') && value.a.b.b.a.b) && value.a.b.b.a.a.b) && (value.a.b.b.a.a.a === 'morphir')) && (!value.a.b.b.a.a.b.b)) && value.a.b.b.a.b.b) && value.a.b.b.a.b.a.b) && (value.a.b.b.a.b.a.a === 's')) && value.a.b.b.a.b.a.b.b) && (value.a.b.b.a.b.a.b.a === 'd')) && value.a.b.b.a.b.a.b.b.b) && (value.a.b.b.a.b.a.b.b.a === 'k')) && (!value.a.b.b.a.b.a.b.b.b.b)) && (!value.a.b.b.a.b.b.b)) && value.a.b.b.b.b) && value.a.b.b.b.a.b) && (value.a.b.b.b.a.a === 'list')) && (!value.a.b.b.b.a.b.b)) && (!value.a.b.b.b.b.b)) && value.a.b.b.c.b) && (value.a.b.b.c.a === 'list')) && (!value.a.b.b.c.b.b)) && value.a.b.c.b) && (!value.a.b.c.b.b)) {
							var _v1 = value.a;
							var index = _v1.a;
							var _v2 = _v1.b;
							var _v3 = _v2.b;
							var _v4 = _v3.a;
							var _v5 = _v4.a;
							var _v6 = _v4.b;
							var _v7 = _v6.a;
							var _v8 = _v7.b;
							var _v9 = _v8.b;
							var _v10 = _v3.b;
							var _v11 = _v10.a;
							var _v12 = _v3.c;
							var _v13 = _v2.c;
							var itemType = _v13.a;
							var items = value.b;
							return A4(
								$author$project$Morphir$Visual$ViewList$view,
								config,
								$author$project$Morphir$Visual$ViewValue$viewValue(config),
								itemType,
								items);
						} else {
							break _v0$13;
						}
					case 'Record':
						var items = value.b;
						return A3(
							$author$project$Morphir$Visual$ViewRecord$view,
							config,
							$author$project$Morphir$Visual$ViewValue$viewValue(config),
							items);
					case 'Variable':
						var _v14 = value.a;
						var index = _v14.a;
						var tpe = _v14.b;
						var name = value.b;
						var variableValue = A2($elm$core$Dict$get, name, config.state.variables);
						return A2(
							$mdgriffith$elm_ui$Element$el,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$Events$onMouseEnter(
									A2(config.handlers.onHoverOver, index, variableValue)),
									$mdgriffith$elm_ui$Element$Events$onMouseLeave(
									config.handlers.onHoverLeave(index)),
									$mdgriffith$elm_ui$Element$below(
									_Utils_eq(config.state.popupVariables.variableIndex, index) ? A2(
										$mdgriffith$elm_ui$Element$el,
										_List_fromArray(
											[
												$mdgriffith$elm_ui$Element$padding(
												$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
											]),
										$author$project$Morphir$Visual$ViewValue$viewPopup(config)) : $mdgriffith$elm_ui$Element$none),
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
									$mdgriffith$elm_ui$Element$Font$center
								]),
							$mdgriffith$elm_ui$Element$text(
								$author$project$Morphir$Visual$Common$nameToText(name)));
					case 'Reference':
						var fQName = value.b;
						return A3(
							$author$project$Morphir$Visual$ViewReference$view,
							config,
							$author$project$Morphir$Visual$ViewValue$viewValue(config),
							fQName);
					case 'Field':
						var _v15 = value.a;
						var index1 = _v15.a;
						var tpe = _v15.b;
						var subjectValue = value.b;
						var fieldName = value.c;
						var defaultValue = A2(
							$mdgriffith$elm_ui$Element$row,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
								]),
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$text(
									$elm$core$String$concat(
										_List_fromArray(
											[
												'the ',
												$author$project$Morphir$Visual$Common$nameToText(fieldName),
												' field of '
											]))),
									A2($author$project$Morphir$Visual$ViewValue$viewValue, config, subjectValue)
								]));
						var _v16 = A2(
							$author$project$Morphir$Visual$Config$evaluate,
							$author$project$Morphir$IR$Value$toRawValue(subjectValue),
							config);
						if (_v16.$ === 'Ok') {
							var valueType = _v16.a;
							var _v17 = A2(
								$author$project$Morphir$Visual$VisualTypedValue$rawToVisualTypedValue,
								$author$project$Morphir$IR$fromDistribution(config.irContext.distribution),
								valueType);
							if ((_v17.$ === 'Ok') && (_v17.a.$ === 'Variable')) {
								var _v18 = _v17.a;
								var _v19 = _v18.a;
								var index = _v19.a;
								var variableName = _v18.b;
								var variableValue = A2($elm$core$Dict$get, variableName, config.state.variables);
								return A2(
									$mdgriffith$elm_ui$Element$el,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$Events$onMouseEnter(
											A2(config.handlers.onHoverOver, index, variableValue)),
											$mdgriffith$elm_ui$Element$Events$onMouseLeave(
											config.handlers.onHoverLeave(index)),
											$mdgriffith$elm_ui$Element$below(
											_Utils_eq(config.state.popupVariables.variableIndex, index) ? A2(
												$mdgriffith$elm_ui$Element$el,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$padding(
														$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme))
													]),
												$author$project$Morphir$Visual$ViewValue$viewPopup(config)) : $mdgriffith$elm_ui$Element$text('Not Found')),
											$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill),
											$mdgriffith$elm_ui$Element$Font$center
										]),
									$mdgriffith$elm_ui$Element$text(
										$elm$core$String$concat(
											_List_fromArray(
												[
													'the ',
													$author$project$Morphir$Visual$Common$nameToText(variableName),
													'\'s ',
													$author$project$Morphir$Visual$Common$nameToText(fieldName)
												]))));
							} else {
								return defaultValue;
							}
						} else {
							var error = _v16.a;
							return defaultValue;
						}
					case 'Apply':
						var fun = value.b;
						var arg = value.c;
						var _v20 = A2($author$project$Morphir$IR$Value$uncurryApply, fun, arg);
						var _function = _v20.a;
						var args = _v20.b;
						return A4(
							$author$project$Morphir$Visual$ViewApply$view,
							config,
							$author$project$Morphir$Visual$ViewValue$viewValue(config),
							_function,
							args);
					case 'LetDefinition':
						var unnest = F2(
							function (conf, v) {
								if (v.$ === 'LetDefinition') {
									var defName = v.b;
									var def = v.c;
									var inVal = v.d;
									var currentState = conf.state;
									var newState = _Utils_update(
										currentState,
										{
											variables: A2(
												$elm$core$Result$withDefault,
												currentState.variables,
												A2(
													$elm$core$Result$map,
													function (evaluatedDefValue) {
														return A3($elm$core$Dict$insert, defName, evaluatedDefValue, currentState.variables);
													},
													A2(
														$author$project$Morphir$Visual$Config$evaluate,
														$author$project$Morphir$IR$Value$definitionToValue(
															A3(
																$author$project$Morphir$IR$Value$mapDefinitionAttributes,
																$elm$core$Basics$always(_Utils_Tuple0),
																$elm$core$Basics$always(_Utils_Tuple0),
																def)),
														conf)))
										});
									var _v22 = A2(
										unnest,
										_Utils_update(
											conf,
											{state: newState}),
										inVal);
									var defs = _v22.a;
									var bottomIn = _v22.b;
									return _Utils_Tuple2(
										A2(
											$elm$core$List$cons,
											_Utils_Tuple2(
												defName,
												A2($author$project$Morphir$Visual$ViewValue$viewValue, conf, def.body)),
											defs),
										bottomIn);
								} else {
									var notLet = v;
									return _Utils_Tuple2(
										_List_Nil,
										A2($author$project$Morphir$Visual$ViewValue$viewValue, conf, notLet));
								}
							});
						var _v23 = A2(unnest, config, value);
						var definitions = _v23.a;
						var inValueElem = _v23.b;
						return A2(
							$mdgriffith$elm_ui$Element$column,
							_List_fromArray(
								[
									$mdgriffith$elm_ui$Element$spacing(
									$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
								]),
							_List_fromArray(
								[
									inValueElem,
									A2(
									$mdgriffith$elm_ui$Element$column,
									_List_fromArray(
										[
											$mdgriffith$elm_ui$Element$spacing(
											$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
										]),
									A2(
										$elm$core$List$map,
										function (_v24) {
											var defName = _v24.a;
											var defElem = _v24.b;
											return A2(
												$mdgriffith$elm_ui$Element$column,
												_List_fromArray(
													[
														$mdgriffith$elm_ui$Element$spacing(
														$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
													]),
												_List_fromArray(
													[
														A3(
														$author$project$Morphir$Visual$Common$definition,
														config,
														$author$project$Morphir$Visual$Common$nameToText(defName),
														defElem)
													]));
										},
										definitions))
								]));
					case 'IfThenElse':
						return A3(
							$author$project$Morphir$Visual$ViewIfThenElse$view,
							config,
							$author$project$Morphir$Visual$ViewValue$viewValue(config),
							value);
					case 'PatternMatch':
						var tpe = value.a;
						var param = value.b;
						var patterns = value.c;
						return A4($author$project$Morphir$Visual$ViewPatternMatch$view, config, $author$project$Morphir$Visual$ViewValue$viewValue, param, patterns);
					case 'Unit':
						return A2(
							$mdgriffith$elm_ui$Element$el,
							_List_Nil,
							$mdgriffith$elm_ui$Element$text('not set'));
					default:
						break _v0$13;
				}
			}
			var other = value;
			return A2(
				$mdgriffith$elm_ui$Element$column,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$Background$color(
						A3($mdgriffith$elm_ui$Element$rgb, 1, 0.6, 0.6)),
						$mdgriffith$elm_ui$Element$padding(
						$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
						$mdgriffith$elm_ui$Element$Border$rounded(6)
					]),
				_List_fromArray(
					[
						A2(
						$mdgriffith$elm_ui$Element$el,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$padding(
								$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
								$mdgriffith$elm_ui$Element$Font$bold
							]),
						$mdgriffith$elm_ui$Element$text('No visual mapping found for:')),
						A2(
						$mdgriffith$elm_ui$Element$el,
						_List_fromArray(
							[
								$mdgriffith$elm_ui$Element$Background$color(
								A3($mdgriffith$elm_ui$Element$rgb, 1, 1, 1)),
								$mdgriffith$elm_ui$Element$padding(
								$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
								$mdgriffith$elm_ui$Element$Border$rounded(6),
								$mdgriffith$elm_ui$Element$width($mdgriffith$elm_ui$Element$fill)
							]),
						A2(
							$author$project$Morphir$Visual$XRayView$viewValue,
							$author$project$Morphir$Visual$XRayView$viewType,
							A3(
								$author$project$Morphir$IR$Value$mapValueAttributes,
								$elm$core$Basics$identity,
								function (_v25) {
									var tpe = _v25.b;
									return tpe;
								},
								other)))
					]));
		}();
		return valueElem;
	});
var $author$project$Morphir$Visual$ViewValue$viewValueByValueType = F2(
	function (config, typedValue) {
		var valueType = $author$project$Morphir$IR$Value$valueAttribute(typedValue).b;
		if (_Utils_eq(
			valueType,
			$author$project$Morphir$IR$SDK$Basics$boolType(_Utils_Tuple0))) {
			var boolOperatorTree = $author$project$Morphir$Visual$BoolOperatorTree$fromTypedValue(typedValue);
			return A3(
				$author$project$Morphir$Visual$ViewBoolOperatorTree$view,
				config,
				$author$project$Morphir$Visual$ViewValue$viewValueByLanguageFeature(config),
				boolOperatorTree);
		} else {
			if ($author$project$Morphir$IR$SDK$Basics$isNumber(valueType)) {
				var arithmeticOperatorTree = $author$project$Morphir$Visual$Components$AritmeticExpressions$fromArithmeticTypedValue(typedValue);
				return A3(
					$author$project$Morphir$Visual$ViewArithmetic$view,
					config,
					$author$project$Morphir$Visual$ViewValue$viewValueByLanguageFeature(config),
					arithmeticOperatorTree);
			} else {
				return A2($author$project$Morphir$Visual$ViewValue$viewValueByLanguageFeature, config, typedValue);
			}
		}
	});
var $author$project$Morphir$Visual$ViewValue$viewDefinition = F3(
	function (config, _v0, valueDef) {
		var valueName = _v0.c;
		var definitionElem = A3(
			$author$project$Morphir$Visual$Common$definition,
			config,
			$author$project$Morphir$Visual$Common$nameToText(valueName),
			A2(
				$author$project$Morphir$Visual$ViewValue$viewValue,
				config,
				$author$project$Morphir$Visual$VisualTypedValue$typedToVisualTypedValue(valueDef.body)));
		return A2(
			$mdgriffith$elm_ui$Element$column,
			_List_fromArray(
				[
					$mdgriffith$elm_ui$Element$spacing(
					$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
				]),
			_List_fromArray(
				[
					definitionElem,
					$elm$core$Dict$isEmpty(config.state.expandedFunctions) ? $mdgriffith$elm_ui$Element$none : A2(
					$mdgriffith$elm_ui$Element$column,
					_List_fromArray(
						[
							$mdgriffith$elm_ui$Element$spacing(
							$author$project$Morphir$Visual$Theme$mediumSpacing(config.state.theme))
						]),
					A2(
						$elm$core$List$map,
						function (_v1) {
							var fqName = _v1.a;
							var localName = fqName.c;
							var valDef = _v1.b;
							return A2(
								$mdgriffith$elm_ui$Element$column,
								_List_fromArray(
									[
										$mdgriffith$elm_ui$Element$spacing(
										$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme))
									]),
								_List_fromArray(
									[
										A3(
										$author$project$Morphir$Visual$Common$definition,
										config,
										$author$project$Morphir$Visual$Common$nameToText(localName),
										A2(
											$author$project$Morphir$Visual$ViewValue$viewValue,
											config,
											$author$project$Morphir$Visual$VisualTypedValue$typedToVisualTypedValue(valDef.body))),
										A2(
										$mdgriffith$elm_ui$Element$el,
										_List_fromArray(
											[
												$mdgriffith$elm_ui$Element$Font$bold,
												$mdgriffith$elm_ui$Element$Border$solid,
												$mdgriffith$elm_ui$Element$Border$rounded(3),
												$mdgriffith$elm_ui$Element$Background$color(config.state.theme.colors.lightest),
												$mdgriffith$elm_ui$Element$Font$color(config.state.theme.colors.darkest),
												$mdgriffith$elm_ui$Element$padding(
												$author$project$Morphir$Visual$Theme$smallPadding(config.state.theme)),
												$mdgriffith$elm_ui$Element$spacing(
												$author$project$Morphir$Visual$Theme$smallSpacing(config.state.theme)),
												$mdgriffith$elm_ui$Element$Events$onClick(
												A2(config.handlers.onReferenceClicked, fqName, true))
											]),
										$mdgriffith$elm_ui$Element$text('Close'))
									]));
						},
						$elm$core$List$reverse(
							$elm$core$Dict$toList(config.state.expandedFunctions))))
				]));
	});
var $author$project$Morphir$Web$Insight$view = function (model) {
	var _v0 = model.modelState;
	switch (_v0.$) {
		case 'IRLoaded':
			return A2($elm$html$Html$div, _List_Nil, _List_Nil);
		case 'Failed':
			var string = _v0.a;
			return A2(
				$mdgriffith$elm_ui$Element$layout,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$Font$size(model.theme.fontSize),
						$mdgriffith$elm_ui$Element$padding(
						$author$project$Morphir$Visual$Theme$smallPadding(model.theme)),
						$mdgriffith$elm_ui$Element$Font$bold
					]),
				$mdgriffith$elm_ui$Element$text(string));
		default:
			var visualizationState = _v0.a;
			var valueFQName = function () {
				var _v2 = _Utils_Tuple2(visualizationState.distribution, visualizationState.selectedFunction);
				var _v3 = _v2.a;
				var packageName = _v3.a;
				var _v4 = _v2.b;
				var moduleName = _v4.a;
				var localName = _v4.b;
				return _Utils_Tuple3(packageName, moduleName, localName);
			}();
			var validArgValues = $elm$core$Dict$fromList(
				A3(
					$elm$core$List$map2,
					F2(
						function (_v1, argValue) {
							var argName = _v1.a;
							return _Utils_Tuple2(argName, argValue);
						}),
					visualizationState.functionDefinition.inputTypes,
					visualizationState.functionArguments));
			var config = {
				handlers: {onHoverLeave: $author$project$Morphir$Web$Insight$ShrinkVariable, onHoverOver: $author$project$Morphir$Web$Insight$ExpandVariable, onReferenceClicked: $author$project$Morphir$Web$Insight$ExpandReference},
				irContext: {distribution: visualizationState.distribution, nativeFunctions: $author$project$Morphir$IR$SDK$nativeFunctions},
				state: {expandedFunctions: visualizationState.expandedFunctions, highlightState: $elm$core$Maybe$Nothing, popupVariables: visualizationState.popupVariables, theme: model.theme, variables: validArgValues}
			};
			return A2(
				$mdgriffith$elm_ui$Element$layout,
				_List_fromArray(
					[
						$mdgriffith$elm_ui$Element$Font$size(model.theme.fontSize),
						$mdgriffith$elm_ui$Element$padding(
						$author$project$Morphir$Visual$Theme$smallPadding(model.theme)),
						$mdgriffith$elm_ui$Element$spacing(
						$author$project$Morphir$Visual$Theme$smallSpacing(model.theme))
					]),
				A3($author$project$Morphir$Visual$ViewValue$viewDefinition, config, valueFQName, visualizationState.functionDefinition));
	}
};
var $author$project$Morphir$Web$Insight$main = $elm$browser$Browser$element(
	{init: $author$project$Morphir$Web$Insight$init, subscriptions: $author$project$Morphir$Web$Insight$subscriptions, update: $author$project$Morphir$Web$Insight$update, view: $author$project$Morphir$Web$Insight$view});
_Platform_export({'Morphir':{'Web':{'Insight':{'init':$author$project$Morphir$Web$Insight$main($elm$json$Json$Decode$value)(0)}}}});}(this));