/**
 * @author Stefan Goessner (c) 2021
 * @license MIT Licence (MIT)
 */
/* jshint -W014 */

/**
 * Constraint between a pair of nodes.
 * @param {object} n1 - node one.
 * @param {object} n2 - node two.
 * @param {number} r - magnitude of vector from `n1` to `n2`.
 * @param {number} w - angle of vector from `n1` to `n2` w.r.t positive x-axis [radians].
 */
function cstr({id,n1,n2,r,w}) {
    const o = {id,n1,n2};
    if (r !== undefined) {
        if (typeof r === 'string' && r === 'const') {
            o.r = Math.hypot(n2.y-n1.y, n2.x-n1.x);
        }
        else if (typeof r === 'number') { // constant
            o.r = r;
        }
        else if (typeof r === 'function') {
            Object.defineProperty(o, 'r', { get:r, enumerable:true, configurable:true });
        }
        o.r_cstr = true;   // r is constrained ... !
    }

    if (w !== undefined) {
        if (typeof w === 'string' && w === 'const') {
            o.w = Math.atan2(n2.y-n1.y, n2.x-n1.x);
        }
        else if (typeof w === 'number') { // constant
            o.w = w;
        }
        else if (typeof w === 'function') {
            Object.defineProperty(o, 'w', { get:w, enumerable:true, configurable:true });
        }
        o.w_cstr = true;   // w is constrained ... !
    }

    return Object.create(cstr.prototype, Object.getOwnPropertyDescriptors(o));
}

cstr.prototype = {
    // target values ...
    get r() { return Math.hypot(this.n2.x-this.n1.x, this.n2.y-this.n1.y); },
    get w() { return Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x); },
    get e() { return {x:Math.cos(this.w), y:Math.sin(this.w)}; },
    // current values ...
    get _r() { return Math.hypot(this.n2.x-this.n1.x, this.n2.y-this.n1.y); },
    get _w() { return Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x); },
    get _e() { return {x:Math.cos(this._w), y:Math.sin(this._w)}; },

//    get dr() { const e = this.e; return this.r - ((this.n2.x-this.n1.x)*e.x + (this.n2.y-this.n1.y)*e.y); },
    get dr() { return this.r - this._r; },
    get dw() { const e = this.e, _e = this._e; return Math.atan2(_e.x*e.y - _e.y*e.x, _e.x*e.x + _e.y*e.y); },
    get de() { return Math.cos(this.w)*Math.sin(this._w) - Math.sin(this.w)*Math.cos(this._w); },

    get im1() { return (this.n1.m ? 1/this.n1.m : this.n1.base ? 0 : 1); },
    get im2() { return (this.n2.m ? 1/this.n2.m : this.n2.base ? 0 : 1); },
    get imc() { return this.im1 + this.im2; },
    get mc_m1() { return this.im1 / this.imc; },
    get mc_m2() { return this.im2 / this.imc; },

    inc_m() {
        if (!this.n1.base) this.n1.m++;
        if (!this.n2.base) this.n2.m++;
    },

    correct_r(dr) {
        this.n1.x -= 1*this.mc_m1*dr*this._e.x;
        this.n1.y -= 1*this.mc_m1*dr*this._e.y;
        this.n2.x += 1*this.mc_m2*dr*this._e.x;
        this.n2.y += 1*this.mc_m2*dr*this._e.y;
    },
    correct_w(dw) {
        const _e = this._e;
        this.n1.x += 1*this.mc_m1*this.r*((1 - Math.cos(dw))*_e.x + Math.sin(dw)*_e.y);
        this.n1.y += 1*this.mc_m1*this.r*((1 - Math.cos(dw))*_e.y - Math.sin(dw)*_e.x);
        this.n2.x -= 1*this.mc_m2*this.r*((1 - Math.cos(dw))*_e.x + Math.sin(dw)*_e.y);
        this.n2.y -= 1*this.mc_m2*this.r*((1 - Math.cos(dw))*_e.y - Math.sin(dw)*_e.x);
    },
    correct() {
        const rtol = 0.01, wtol = 0.001;
        const dr = this.dr, dw = this.dw;

        /*if (Math.abs(dr) > rtol)*/ this.correct_r(dr);
        /*if (Math.abs(dw) > wtol)*/ this.correct_w(dw);

        this.inc_m();
//        return +(Math.abs(this.dr) > rtol) 
//             + +(Math.abs(this.dw) > wtol);
    },
    log() {
        console.log({id:this.id,mc_m1:this.mc_m1,mc_m2:this.mc_m2,r:this.r,_r:this._r,_w:this._w,dr:this.dr,dw:this.dw}); 
    }
/*
    pre() {
        this.r0 = this.r;
    },
    calc(tol) {     // deprecated
        return this.correct_r(tol) || this.correct_w(tol);
    },
*/
}

/**
 * Dual Constraint between a pair of node-constraints.
 * @param {object} c1 - constraint one.
 * @param {object} c2 - constraint two.
 * @param {number} r - sum of constraint magnitudes.
 * @param {number} w - angle `c1` to `c2` [radians].
 */
 function dualcstr({id,c1,c2,r,w}) {
    const o = {id,c1,c2};
    if (r !== undefined) {
        if (typeof r === 'string' && r === 'const') {
            o.r = Math.hypot(c1.n2.y-c1.n1.y, c1.n2.x-c1.n1.x) + Math.hypot(c2.n2.y-c2.n1.y, c2.n2.x-c2.n1.x);
        }
        else if (typeof r === 'number') { // constant
            o.r = r;
        }
        else if (typeof r === 'function') {
            Object.defineProperty(o, 'r', { get:r, enumerable:true, configurable:true });
        }
    }

    if (w !== undefined) {
        if (typeof w === 'string' && w === 'const') {
            const e1 = o.c1.e, e2 = o.c2.e; 
            o.w = Math.atan2(e1.x*e2.y - e1.y*e2.x, e1.x*e2.x + e1.y*e2.y);
        }
        else if (typeof w === 'number') { // constant
            o.w = w;
        }
        else if (typeof w === 'function') {
            Object.defineProperty(o, 'w', { get:w, enumerable:true, configurable:true });
        }
    }

    return Object.create(dualcstr.prototype, Object.getOwnPropertyDescriptors(o));
}

dualcstr.prototype = {
    // target values ...
    get r() { return this.c1.r + this.c2.r; },
    get w() { return Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x); },
    get e() { return {x:Math.cos(this.w), y:Math.sin(this.w)}; },
    // current values ...
    get _r() { return Math.hypot(this.n2.x-this.n1.x, this.n2.y-this.n1.y); },
    get _w() { return Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x); },
    get _e() { return {x:Math.cos(this._w), y:Math.sin(this._w)}; },

    get dr() { return 0; },
    get dw() {
        const e1 = this.c1.e, e2 = this.c2.e; 
        return this.w - Math.atan2(e1.x*e2.y - e1.y*e2.x, e1.x*e2.x + e1.y*e2.y);
    },
    get de() { return Math.cos(this.w)*Math.sin(this._w) - Math.sin(this.w)*Math.cos(this._w); },

    get im1() { return this.c1.w_cstr ? 0 : this.c1.imc; },
    get im2() { return this.c2.w_cstr ? 0 : this.c2.imc; },
    get imc() { return this.im1 + this.im2; },
    get mc_m1() { return this.im1 / this.imc; },
    get mc_m2() { return this.im2 / this.imc; },

    correct_r(dr) {
    },
    correct_w(dw) {
        this.c1.correct_w(-this.mc_m1*dw)
        this.c2.correct_w( this.mc_m2*dw);
    },
    correct() {
        const rtol = 0.01, wtol = 0.001;
        const /*dr = this.dr,*/ dw = this.dw;

//        if (Math.abs(dr) > rtol) this.correct_r(dr);
        /*if (Math.abs(dw) > wtol)*/ this.correct_w(dw);

//        return /*Math.abs(this.dr) < rtol &&*/ +(Math.abs(this.dw) > wtol);
    },
    log() {
        console.log({id:this.id,mc_m1:this.mc_m1,mc_m2:this.mc_m2,w:this.w,dw:this.dw}); 
    }
}

/**
 * Triangular Constraint between three nodes.
 * @param {object} n1 - node one.
 * @param {object} n2 - node two.
 * @param {object} n3 - node three.
 */
 function tricstr({id,n1,n2,n3}) {
    const o = {id,n1,n2,n3};
    const r12 = {x:n2.x-n1.x, y:n2.y-n1.y};
    const r13 = {x:n3.x-n1.x, y:n3.y-n1.y};
    const bb = r12.x**2 + r12.y**2;
    o.b   = Math.sqrt(bb);  // base side length ...
    o.lam = (r12.x*r13.x + r12.y*r13.y)/bb;
    o.mu  = (r12.x*r13.y - r12.y*r13.x)/bb;
    o.r = Math.hypot(r12.y,r12.x) + Math.hypot(r13.y,r13.x) + Math.hypot(n3.x-n2.x,n3.y-n2.y);

    return Object.create(tricstr.prototype, Object.getOwnPropertyDescriptors(o));
}

tricstr.prototype = {
    get dr() { return this.r - (  Math.hypot(this.n2.x-this.n1.x,this.n2.y-this.n1.y) 
                                + Math.hypot(this.n3.x-this.n1.x,this.n3.y-this.n1.y) 
                                + Math.hypot(this.n3.x-this.n2.x,this.n3.y-this.n2.y)); },
    get dw() { return 0; },

    get im1() { return (this.n1.m ? 1/this.n1.m : this.n1.base ? 0 : 1); },
    get im2() { return (this.n2.m ? 1/this.n2.m : this.n2.base ? 0 : 1); },
    get im3() { return (this.n3.m ? 1/this.n3.m : this.n3.base ? 0 : 1); },
    get imc() { return this.im1 + this.im2 + this.im3; },
    get mc_m1() { return this.im1 / this.imc; },
    get mc_m2() { return this.im2 / this.imc; },
    get mc_m3() { return this.im3 / this.imc; },

    inc_m() {
        if (!this.n1.base) this.n1.m++;
        if (!this.n2.base) this.n2.m++;
        if (!this.n3.base) this.n3.m++;
    },
    correct() {
        const _b = Math.hypot(this.n2.x-this.n1.x, this.n2.y-this.n1.y);
        const db = this.b - _b;
        const _e = {x:(this.n2.x-this.n1.x)/_b, y:(this.n2.y-this.n1.y)/_b};

        this.n1.x -= this.mc_m1*db*_e.x;
        this.n1.y -= this.mc_m1*db*_e.y;
        this.n2.x += this.mc_m2*db*_e.x;
        this.n2.y += this.mc_m2*db*_e.y;
        this.n3.x  = this.n1.x + (this.lam*(this.n2.x-this.n1.x) - this.mu*(this.n2.y-this.n1.y));
        this.n3.y  = this.n1.y + (this.lam*(this.n2.y-this.n1.y) + this.mu*(this.n2.x-this.n1.x));

        this.inc_m();
    },
    log() {
        console.log({id:this.id,mc_m1:this.mc_m1,mc_m2:this.mc_m2,mc_m3:this.mc_m3,r:this.r,dr:this.dr,dw:this.dw}); 
    }
}

// use it with node.js ... ?
if (typeof module !== 'undefined') module.exports = cstr;