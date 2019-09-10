"use strict";
function isZero(a) {
    return ((a instanceof Const) && (a.getValue() === 0));
}
function isOne(a) {
    return ((a instanceof Const) && (a.getValue() === 1));
}
function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function Operation(type) {
    this.operation = generateOperation(type);
    this.differ = generateDiff(type);
    this.simple = generateSimplify(type);

    this.type = type;
    this.arr = [];
    for (var i = 1; i < arguments.length; i++) {
        this.arr.push(arguments[i])
    }

    this.evaluate = function() {
        var array = [];
        for (var i = 0; i < this.arr.length; i++) {
            array.push(this.arr[i].evaluate.apply(this.arr[i], arguments));
        }
        return this.operation.apply(null, array);
    };

    this.diff = function (base) {
        var array = [base];
        for (var i = 0; i < this.arr.length; i++) {
            array.push(this.arr[i]);
        }
        return this.differ.apply(null, array);
    };

    this.simplify = function () {
        var array = [];
        for (var i = 0; i < this.arr.length; i++) {
            array.push(this.arr[i].simplify());
        }
        return this.simple.apply(null, array);
    };

    this.prefix = function () {
        var stack = this.type;
        for (var i = 0; i < this.arr.length; i++) {
            stack += " " + this.arr[i].prefix();
        }
        return "(" +  stack + ")"
    };

    this.postfix = function () {
        var stack = "";
        for (var i = 0; i < this.arr.length; i++) {
            stack += this.arr[i].prefix() + " ";
        }
        return "(" +  stack + this.type + ")"
    };

    this.toString = function () {
        return this.arr.join(" ") + " " + this.type;
    };

    function generateOperation(type) {
        switch (type) {
            case '+' : return function (a, b) {
                return a + b;
            };
            case '/' : return function (a, b) {
                return a / b;
            };
            case '*' : return function (a, b) {
                return a * b;
            };
            case '-' : return function (a, b) {
                return a - b;
            };
            case 'log' : return function (a, b) {
                return Math.log(Math.abs(b)) / Math.log(Math.abs(a));
            };
            case 'pow' : return function (a, b) {
                return Math.pow(a, b);
            };
            case 'sqrt' : return function (a) {
                return Math.pow(a, 1/2);
            };
            case 'square' : return function (a) {
                return Math.pow(a, 2);
            };
            case 'negate' : return function (a) {
                return -a;
            };
            case 'exp' : return function (a) {
                return Math.pow(Math.E, a);
            };
            case 'atan' : return function (a) {
                return Math.atan(a);
            };
        }
    }

    function generateDiff(type) {
        switch (type) {
            case '-' :
                return function (base, a, b) {
                    return new Subtract(a.diff(base), b.diff(base));
                };
            case '+' :
                return function (base, a, b) {
                    return new Add(a.diff(base), b.diff(base));
                };
            case '*' :
                return function (base, a, b) {
                    var da = a.diff(base);
                    var db = b.diff(base);
                    return new Add(new Multiply(da, b), new Multiply(a, db));
                };
            case '/' :
                return function (base, a, b) {
                    var da = a.diff(base);
                    var db = b.diff(base);
                    return new Divide(new Subtract(new Multiply(da, b), new Multiply(a, db)), new Multiply(b, b));
                };
            case 'pow' :
                return function (base, a, b) {
                    return new Multiply(
                        new Power(
                            a,
                            new Subtract(
                                b,
                                MY_CNST[1]
                            )
                        ),
                        new Add(
                            new Multiply(
                                b,
                                a.diff(base)
                            ),
                            new Multiply(
                                a,
                                new Multiply(
                                    new Log(MY_CNST['e'], a),
                                    b.diff(base)
                                )
                            )
                        )
                    )
                };
            case 'log' :
                return function (base, a, b) {
                    return new Subtract(
                        new Divide(
                            b.diff(base),
                            new Multiply(
                                b,
                                new Log(MY_CNST[e], a)
                            )
                        ),
                        new Divide(
                            new Multiply(
                                a.diff(base),
                                new Log(MY_CNST[e], b)
                            ),
                            new Multiply(
                                a,
                                new Square(
                                    new Log(MY_CNST[e], a)
                                )
                            )
                        )
                    );
                };
            case 'sqrt' :
                return function (base, a) {
                    var da = a.diff(base);
                    return new Divide(new Multiply(a, da), new Multiply(MY_CNST[2], new Sqrt(new Multiply(new Square(a), a))));
                };
            case 'square' :
                return function (base, a) {
                    return new Multiply(new Multiply(MY_CNST[2], a), a.diff(base));
                };
            case 'negate' :
                return function (base, a) {
                    return new Negate(a.diff(base));
                }
        }
        return null;
    }

    function generateSimplify(type) {
        switch (type) {
            case '+' : return function (a, b) {
                if (isZero(a) && isZero(b)) return MY_CNST[0];
                if (isZero(a)) return b;
                if (isZero(b)) return a;
                if (a instanceof Const && b instanceof Const) return new Const(a.getValue() + b.getValue());
                return new Add(a, b);
            };
            case '-' : return function (a, b) {
                if (isZero(a) && isZero(b)) return MY_CNST[0];
                if (isZero(a)) return (new Negate(b)).simplify();
                if (isZero(b)) return a;
                if (a instanceof Const && b instanceof Const) return new Const(a.getValue() - b.getValue());

                return new Subtract(a, b);
            };
            case '*' : return function (a, b) {
                if (isZero(a) || isZero(b)) return MY_CNST[0];
                if (isOne(a)) return b;
                if (isOne(b)) return a;
                if (a instanceof Const && b instanceof Const) return new Const(a.getValue() * b.getValue());

                return new Multiply(a, b);
            };
            case '/' : return function (a, b) {
                if (isZero(a)) return MY_CNST[0];
                if (isOne(b)) return a;
                if (a instanceof Const && b instanceof Const) return new Const(a.getValue() / b.getValue());

                return new Divide(a, b);
            };
            case 'log' : return function (a, b) {
                if (isOne(b)) return MY_CNST[0];
                if (a instanceof Const && b instanceof Const) {
                    return new Const(Math.log(Math.abs(b.getValue())) / Math.log(Math.abs(a.getValue())));
                }
                return new Log(a, b);
            };
            case 'pow' : return function (a, b) {
                if (isZero(a)) return MY_CNST[0];
                if (isOne(a) || isZero(b)) return MY_CNST[1];
                if (a instanceof Const && b instanceof Const) {
                    return new Const(Math.pow(a.getValue(), b.getValue()));
                }
                return new Power(a, b);
            };
            case 'sqrt' : return function (a) {
                if (isZero(a)) return MY_CNST[0];
                if (isOne(a)) return MY_CNST[1];
                if (a instanceof Const) return new Const(Math.pow(a.getValue(), 1/2));
                return new Sqrt(a);
            };
            case 'square' : return function (a) {
                if (isZero(a)) return MY_CNST[0];
                if (isOne(a)) return MY_CNST[1];
                if (a instanceof Const) return new Const(Math.pow(a.getValue(), 2));
                return new Square(a);
            };
            case 'negate' : return function (a) {
                if (a instanceof Const) return new Const(-a.getValue());
                return new Negate(a);
            };
        }
    }
}

function Add(a, b) {
    return new Operation('+', a, b)
}
function Divide(a, b) {
    return new Operation('/', a, b)
}
function Subtract(a, b) {
    return new Operation('-', a, b)
}
function Multiply(a, b) {
    return new Operation('*', a, b)
}
function Negate(a) {
    return new Operation('negate', a)
}
function Sqrt(a) {
    return new Operation('sqrt', a)
}
function Square(a) {
    return new Operation('square', a)
}
function Power(a, b) {
    return new Operation('pow', a, b)
}
function Log(a, b) {
    return new Operation('log', a, b)
}
function Exp(a) {
    return new Operation('exp', a)
}
function ArcTan(a) {
    return new Operation('atan', a)
}

var MY_VRBL = Object.freeze({
    'x' : 0,
    'y' : 1,
    'z' : 2
});
var MY_EXPR = Object.freeze({
    "-": [Subtract, 2],
    "+": [Add, 2],
    "/": [Divide, 2],
    "*": [Multiply, 2],
    "negate": [Negate, 1],
    "square": [Square, 1],
    "sqrt": [Sqrt, 1],
    "pow": [Power, 2],
    "log": [Log, 2],
    "exp": [Exp, 1],
    "atan": [ArcTan, 1]
});
var MY_CNST = Object.freeze({
    'pi' : new Const(Math.PI),
    'e' : new Const(Math.E),
    '0' : new Const(0),
    '1' : new Const(1),
    '2' : new Const(2)
});

function Variable(str) {
    this.evaluate = function () {
        return arguments[MY_VRBL[str]];
    };
    this.diff = function (base) {
        return MY_CNST[base === str ? 1 : 0];
    };
    this.simplify = function () {
        return new Variable(str);
    };
    this.prefix = function () {
        return str;
    };
    this.postfix = function () {
        return str;
    };
    this.toString = function () {
        return str;
    };
}

function Const(number) {
    this.evaluate = function () {
        return number;
    };
    this.diff = function () {
        return MY_CNST[0];
    };
    this.simplify = function () {
        return new Const(number)
    };
    this.toString = function () {
        if (Math.E === number) return 'E';
        if (Math.PI === number) return 'Pi';
        return number.toString();
    };
    this.prefix = function () {
        return number.toString();
    };
    this.postfix = function () {
        return number.toString();
    };
    this.getValue = function () {
        return +number;
    }
}

function parse(expression){
    var stack = [];
    var tokens = expression.trim().split(' ');

    for (var i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].trim();
        if (tokens[i].length <= 0) continue;

        if (MY_EXPR[tokens[i]] !== undefined) {
            var array = [];
            for (var j = 0; j < MY_EXPR[tokens[i]][1]; j++) {
                array.push(stack.pop())
            }
            var arr = [];
            var n = array.length;
            for (j = 0; j < n; j++) {
                arr.push(array.pop());
            }
            stack.push(MY_EXPR[tokens[i]][0].apply(null, arr));
            continue;
        }

        if (MY_VRBL[tokens[i]] !== undefined) {
            stack.push(new Variable(tokens[i]));
            continue;
        }

        if (isNumeric(tokens[i])) {
            stack.push(new Const(+tokens[i]));
            continue;
        }
        throw new Error("Parser error: unknown operation : " + tokens[i])
    }
    return stack.pop();
}

function mainParser(expression, start, next, openBrace, closeBraces, endOfExpr, reverse, addStr) {
    expression = expression.trim();
    var ind = start;
    var balance = 0;
    var token;

    if (expression === '()') throw new ParseError(expression, "Incorrect expression", 0).message;
    var ans = parseSubstring();
    if (balance !== 0) throw new ParseError(expression, "Incorrect expression", reverse(ind, 1)).message;
    if (endOfExpr(expression, ind)) throw new ParseError(expression, "Invalid expression", ind).message;

    return ans;

    function next_token() {
        while (endOfExpr(expression, ind) && expression[ind] === ' ') {
            ind = next(ind);
        }

        if (expression[ind] === '(' || expression[ind] === ')') {
            token = expression[ind];
            return;
        }

        var tmp = '';
        var c;
        while (endOfExpr(expression, ind) && (c = expression[ind]) !== ' '
                                          && c !== '('
                                          && c !== ')') {
            if (c === undefined) break;
            tmp = addStr(tmp, c);
            ind = next(ind);
        }

        if (tmp) {
            token = tmp;
        } else {
            throw new ParseError(expression, "Haven't operand at pos : " + ind, ind).message;
        }
    }

    function parseSubstring() {
        next_token();

        switch (token) {
            case '(' :
                ind = next(ind);
                balance = reverse(balance, -1);

                return openBrace(parseSubstring);
            case ')' :
                balance = reverse(balance, 1);
                if (balance < 0) {
                    throw new ParseError(expression, "The bracket does not have a pair", ind).message;
                }

                ind = next(ind);
                return closeBraces(parseSubstring);
            default :
                if (isNumeric(token)) {
                    return new Const(+token);
                }
                if (MY_CNST[token] !== undefined) {
                    return new Const(MY_CNST[token]);
                }
                if (MY_VRBL[token] !== undefined) {
                    return new Variable(token);
                }
                if (MY_EXPR[token] !== undefined) {
                    var operation = token;
                    var tmp = [];

                    while ((token = parseSubstring()) !== closeBraces()) {
                        tmp.push(token);
                    }

                    if (MY_EXPR[operation][1] === tmp.length) {
                        return MY_EXPR[operation][0].apply(null, tmp)
                    } else {
                        throw new ParseError(expression, "Incorrect number of arguments", ind).message;
                    }
                }
                throw new ParseError(expression, "Incorrect token : '" + token + "'", reverse(ind, token.length)).message;
        }
    }
}

function parsePostfix(expression) {
    return mainParser(expression, expression.length - 1,
        function (a) {
            return a - 1;
        },
        function () {
            return '('
        },
        function (a) {
            return a();
        },
        function (expression, ind) {
            return ind >= 0;
        },
        function (a, b) {
            return a + b;
        },
        function (a, b) {
            return b + a;
        })
}

function parsePrefix(expression) {
    return mainParser(expression, 0,
        function (a) {
            return a + 1;
        },
        function (a) {
            return a();
        },
        function () {
            return ')';
        },
        function (expression, ind) {
            return ind < expression.length;
        },
        function (a, b) {
            return a - b;
        },
        function (a, b) {
            return a + b;
        })
}

var ParseError = function (expression, message, pos) {
    this.name = 'ParserError';
    this.message = (message + "\n" + expression + "\n" + getPos(pos)).toString();

    function getPos(pos) {
        var str = '';
        for (var i = 0; i < pos; i++) {
            str += ' ';
        }
        str += '^';
        return str;
    }
};