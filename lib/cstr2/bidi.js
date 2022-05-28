/**
 * @author Stefan Goessner (c) 2021
 * @license MIT Licence (MIT)
 */

const A = {
    id: 'A',
    r: 25,
    x: false
}
const B = {
    id: 'B',
    x: false
}

function bic(o1, o2, fn) {
    function get() {
        return fn(this, o1, o2);
    }
    return get;
}

function fn(o,o1,o2) {
    console.log(o.id+': '+ ((o === o1 && o1.r) ? o1.r : (100-o1.r)))
}

Object.defineProperty(A, 'x', { get:bic(A,B,fn), enumerable:true, configurable:true });
Object.defineProperty(B, 'x', { get:bic(B,A,fn), enumerable:true, configurable:true });

A.x
B.x