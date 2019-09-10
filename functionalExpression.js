"use strict";

var Operation = function (operation) {
    var operand = arguments;
    var opera = operation;
    return function () {
        var array = [];
        for (var i = 1; i < operand.length; i++) {
            array.push(operand[i].apply(null, arguments))
        }
        return opera.apply(null, array);
    }
};

var add = function(first, second) {
    return Operation(function(first, second) {
        return first + second;
    }, first, second);
};

var subtract = function(first, second) {
    return Operation(function (first, second) {
        return first - second;
    }, first, second);
};

var multiply = function(first, second) {
    return Operation(function(first, second) {
        return first * second;
    }, first, second);
};

var divide = function(first, second) {
    return Operation(function (first, second) {
        return first / second;
    }, first, second);
};

var negate = function(first) {
    return Operation(function(first) {
        return -first;
    }, first);
};

var cube = function (first) {
    return Operation(function (first) {
        return Math.pow(first, 3)
    }, first)
};

var cuberoot = function (first) {
    return Operation(function (first) {
        return Math.pow(first, 1/3)
    }, first)
};

var min3 = function (a, b, c) {
    return Operation(function (a, b, c) {
        return Math.min(a, b, c);
    }, a, b, c)
};

var max5 = function (a, b, c, d, e) {
    return Operation(function (a, b, c, d, e) {
        return Math.max(a, b, c, d, e)
    }, a, b, c, d, e)
};

var cnst = function(num) {
    return function(xValue, yValue, zValue) {
        return num;
    }
};

var e = cnst(Math.E);
var pi = cnst(Math.PI);

var MY_VARIABLE = {
    'x' : 0,
    'y' : 1,
    'z' : 2
};

var EXP = Object.freeze({
    "-": [subtract, 2],
    "+": [add, 2],
    "/": [divide, 2],
    "*": [multiply, 2],
    "negate": [negate, 1],
    "max5": [max5, 5],
    "min3": [min3, 3],
    "cube": [cube, 1],
    "cuberoot": [cuberoot, 1]
});


var variable = function(arg) {
    return function() {
        return arguments[MY_VARIABLE[arg]];
    }
};

function parse(expression){
    var stack = [];
    var tokens = expression.trim().split(' ');

    for (var i = 0; i < tokens.length; i++) {
        tokens[i] = tokens[i].trim();
        if (tokens[i].length <= 0) continue;

        switch (tokens[i]) {
            case "negate" :
            case '+' :
            case "-" :
            case "min3" :
            case "max5" :
            case "*" :
            case "/" :
                var array = [];
                for (var j = 0; j < EXP[tokens[i]][1]; j++) {
                    array.push(stack.pop())
                }
                var arr = [];
                var n = array.length;
                for (j = 0; j < n; j++) {
                    arr.push(array.pop());
                }
                stack.push(EXP[tokens[i]][0].apply(null, arr));
                continue;
            case 'pi' :
                stack.push(pi);
                continue;
            case 'e' :
                stack.push(e);
                continue;
            default :
                if (MY_VARIABLE[tokens[i]] !== undefined) {
                    stack.push(variable(tokens[i]));
                    continue;
                }
                if (isNumeric(tokens[i])) {
                    stack.push(cnst(+tokens[i]));
                    continue;
                }
                throw new Error("parser error: incorrect expression")
        }
    }
    return stack.pop();
}

function isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
