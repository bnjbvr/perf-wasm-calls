// Wrap everything in a closure so all locales belong to a function and not the
// global environment.
(function() {

let exports = null;

// Runs the test and displays it in the results table.
function runTest(name, description, func) {
    let time = performance.now();
    func(ITERATIONS);
    time = performance.now() - time;
    time = (time*100|0)/100;
    console.log(name, time);
}

// Benchmarks start here.
function testCallKnownNoArgs(limit) {
    var func = exports.no_arg;
    for (var i = 0; i < limit; i++) {
        func();
    }
}

function testCallKnownOneArg(limit) {
    var func = exports.set_global_one;
    for (var i = 0; i < limit; i++) {
        func(i);
    }
}

function testCallKnownTwoArgs(limit) {
    var func = exports.add;
    for (var i = 0; i < limit; i++) {
        func(i, i + 1);
    }
}

function testCallKnownTwoArgsRectifyingOne(limit) {
    var func = exports.add;
    for (var i = 0; i < limit; i++) {
        func(i + 1);
    }
}

function jsAdd(x, y) {
    return (x|0) + (y|0) | 0;
}

function testCallGeneric(limit) {
    var func = exports.add;
    var arr = [func, jsAdd];
    for (var i = 0; i < limit; i++) {
        arr[i%2](i, i+1);
    }
}

function testCallGenericRectifying(limit) {
    var func = exports.add;
    var arr = [func, jsAdd];
    for (var i = 0; i < limit; i++) {
        arr[i%2](i+1);
    }
}

function testCallScriptedGetter(limit) {
    let GETSET = {};
    Object.defineProperty(GETSET, 'x', {
        get: exports.no_arg,
    });
    for (var i = 0; i < limit; i++) {
        GETSET.x;
    }
}

function testCallScriptedGetterRectifying(limit) {
    let GETSET = {};
    Object.defineProperty(GETSET, 'x', {
        get: exports.set_global_one,
    });
    for (var i = 0; i < limit; i++) {
        GETSET.x
    }
}

function testCallScriptedSetter(limit) {
    let GETSET = {};
    Object.defineProperty(GETSET, 'x', {
        set: exports.set_global_one
    });
    for (var i = 0; i < limit; i++) {
        GETSET.x = i;
    }
}

function testCallScriptedSetterRectifying(limit) {
    let GETSET = {};
    Object.defineProperty(GETSET, 'x', {
        set: exports.set_global_two
    });
    for (var i = 0; i < limit; i++) {
        GETSET.x = i;
    }
}

function testFunctionApplyArray(limit) {
    let func = exports.add;
    for (var i = 0; i < limit; i++) {
        func.apply(null, [i, i + 1]);
    }
}

function testFunctionApplyArrayRectifying(limit) {
    let func = exports.add;
    for (var i = 0; i < limit; i++) {
        func.apply(null, [i + 1]);
    }
}

function testFunctionApplyArgs(limit) {
    let func = exports.add;
    function applyArgsWrapper() {
        func.apply(null, arguments);
    }
    for (var i = 0; i < limit; i++) {
        applyArgsWrapper(i, i + 1);
    }
}
function testFunctionApplyArgsRectifying(limit) {
    let func = exports.add;
    function applyArgsWrapper() {
        func.apply(null, arguments);
    }
    for (var i = 0; i < limit; i++) {
        applyArgsWrapper(i + 1);
    }
}

function testFunctionCall(limit) {
    let func = exports.add;
    for (var i = 0; i < limit; i++) {
        func.call(null, i + 1);
    }
}
function testFunctionCallRectifying(limit) {
    let func = exports.add;
    for (var i = 0; i < limit; i++) {
        func.call(null, i + 1);
    }
}

var ITERATIONS = 0;

function start() {
    //ITERATIONS = 200000;
    ITERATIONS = 200000000;

    console.log(`Running ${ITERATIONS} iterations...`);
    runTest('warmup', 'Warming up the JITs...', testCallKnownNoArgs);

    runTest('call-known-0', 'Call a monomorphic function which expects 0 arguments with 0 arguments', testCallKnownNoArgs);
    runTest('call-known-1', 'Call a monomorphic function which expects 1 argument with 1 argument', testCallKnownOneArg);
    runTest('call-known-2', 'Call a monomorphic function which expects 2 arguments with 2 arguments', testCallKnownTwoArgs);

    runTest('call-known-2-r', 'Call a monomorphic function which expects 2 arguments with 1 argument', testCallKnownTwoArgsRectifyingOne);

    runTest('call-generic-2', 'Alternate between a JS function call and a wasm function, with 2 arguments (both expect 2 arguments)', testCallGeneric);
    runTest('call-generic-2-r', 'Alternate between a JS function call and a wasm function, with 1 argument (both expect 2 arguments)', testCallGenericRectifying);

    runTest('scripted-getter-0', "Call a scripted getter that's a wasm function expecting 0 arguments", testCallScriptedGetter);
    runTest('scripted-getter-1', "Call a scripted getter that's a wasm function expecting 1 argument", testCallScriptedGetterRectifying);

    runTest('scripted-setter-1', "Call a scripted setter that's a wasm function expecting 1 argument", testCallScriptedSetter);
    runTest('scripted-setter-2', "Call a scripted setter that's a wasm function expecting 2 arguments", testCallScriptedSetterRectifying);

    runTest('F.p.apply-array', 'Call a wasm function with Function.prototype.apply and an array, with the expected number of arguments', testFunctionApplyArray);
    runTest('F.p.apply-array-r', 'Call a wasm function with Function.prototype.apply and an array, with one fewer argument than expected', testFunctionApplyArrayRectifying);
    runTest('F.p.apply-args', 'Call a wasm function with Function.prototype.apply and the arguments object, with the expected number of arguments', testFunctionApplyArgs);
    runTest('F.p.apply-args-r', 'Call a wasm function with Function.prototype.apply and the arguments object, with one fewer argument than expected', testFunctionApplyArgsRectifying);

    runTest('F.p.call', 'Call a wasm function with Function.prototype.call and the expected number of arguments', testFunctionCall);
    runTest('F.p.call-r', 'Call a wasm function with Function.prototype.call and one fewer argument than expected', testFunctionCallRectifying);
}

// Fetch the wasm binary and compile the instance.
(function() {
    let binary = os.file.readFile('./binary.wasm', 'binary')
    let mod = new WebAssembly.Module(binary);
    exports = new WebAssembly.Instance(mod).exports;
    start();
})();

})();
