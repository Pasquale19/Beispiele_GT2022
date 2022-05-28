/**
 * @author Stefan Goessner (c) 2020
 * @license MIT Licence (MIT)
 */
/* jshint -W014 */

/**
 * Create constraint between a pair of nodes.
 * @param {object} p1 - node one.
 * @param {object} p2 - node two.
 * @param {number} r - magnitude of vector from `p1` to `p2`.
 * @param {number} w - angle of vector from `p1` to `p2` w.r.t positive x-axis [radians].
 */
function cstr({id,p1,p2,r,w}) {
    const o = {id,p1,p2};
    if (r !== undefined) {
        if (typeof r === 'number') { // constant
            o._r = r;
        }
        else if (typeof r === 'function') {
            Object.defineProperty(o, '_r', { get:r, enumerable:true, configurable:true });
        }
        else if (typeof r === 'string' && r === 'const') {
            o._r = Math.hypot(p2.y-p1.y, p2.x-p1.x);
        }
    }
    if (w !== undefined) {
        if (typeof w === 'number') { // constant
            o.w0 = o.w = w;
            o.Cw = () => (p2.y-p1.y)*Math.cos(o.w) - (p2.x-p1.x)*Math.sin(o.w);
        }
        else if (typeof w === 'function') {
            o.w0 = w();
            Object.defineProperty(o, 'w', { get:w, enumerable:true, configurable:true });
            o.Cw = () => (p2.y-p1.y)*Math.cos(o.w) - (p2.x-p1.x)*Math.sin(o.w);
        }
        else if (typeof w === 'string' && w === 'const') {
            o.w0 = o.w = Math.atan2(p2.y-p1.y, p2.x-p1.x);
            o.Cw = () => (p2.y-p1.y)*Math.cos(o.w) - (p2.x-p1.x)*Math.sin(o.w);
        }
        else if (typeof w === 'object' && 'ref' in w) {
            const ref = w.ref;
            const ratio = w.ratio || 1;
            const w0 = o.w0 = Math.atan2(p2.y-p1.y, p2.x-p1.x);
            Object.defineProperty(o, 'w', { get: () => w0 + ratio*(ref.w - ref.w0), enumerable:true, configurable:true });
            o.Cw = () => (p2.y-p1.y)*Math.cos(o.w) - (p2.x-p1.x)*Math.sin(o.w) - ratio*o.r/ref.r*( (ref.p2.y-ref.p1.y)*Math.cos(ref.w) - (ref.p2.x-ref.p1.x)*Math.sin(ref.w) );
        }
    }
    else {
        Object.defineProperty(o, 'w', { get: ()=>Math.atan2(p2.y-p1.y, p2.x-p1.x), enumerable:true, configurable:true });
        o.w0 = Math.atan2(p2.y-p1.y, p2.x-p1.x);
        o.Cw = 0;
    }

    return Object.create(cstr.prototype, Object.getOwnPropertyDescriptors(o));
}

cstr.prototype = {
    get r() { return this._r !== undefined ? this._r : Math.hypot(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
//    get w() { return this._w !== undefined ? this._w : Math.atan2(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
    get Cr() { return this._r !== undefined ? (this.p2.x-this.p1.x)*Math.cos(this.w) + (this.p2.y-this.p1.y)*Math.sin(this.w) - this._r : 0; },
    get Cw() { return this._w !== undefined ? (this.p2.y-this.p1.y)*Math.cos(this.w) - (this.p2.x-this.p1.x)*Math.sin(this.w) : 0; },
    get im1() { return (this.p1.base ? 0 : 1); },
    get im2() { return (this.p2.base ? 0 : 1); },
    get imc() { return this.im1 + this.im2; },

    correct(lenTol) {
        const Cr = this.Cr, Cw = this.Cw;

        if (Cr !== 0) {
            this.applyImpulse(Cr*Math.cos(this.w), Cr*Math.sin(this.w));
        }
        if (Cw !== 0) {
            this.applyImpulse(-Cw*Math.sin(this.w), Cw*Math.cos(this.w));
        }

        return Math.abs(Cr) < lenTol && Math.abs(Cw) < lenTol;
    },

    applyImpulse(Cx,Cy) {
        const im1_imc = this.im1 / this.imc, 
              im2_imc = this.im2 / this.imc;
//console.log(`${this.id}: apply (${Cx},${Cy})`)
        this.p1.x +=   im1_imc * Cx;
        this.p1.y +=   im1_imc * Cy;
        this.p2.x += - im2_imc * Cx;
        this.p2.y += - im2_imc * Cy;
    }
}

/**
 * Create constraint between a pair of constraints.
 * @param {object} c1 - constraint one.
 * @param {object} c2 - constraint two.
 */
function cstr2({c1,c2,type,ratio}) {
    const o = {id,c1,c2,type};
    if (type === 'w-w') {
        o.dw0 = c2.w - c1.w;
        o.scl = c2.r / c1.r;
        o.ratio = ratio || 1;
//        o.w1 = () => 
//        o.w2 = () => c2.w;
    }
    return Object.create(cstr2.prototype, Object.getOwnPropertyDescriptors(o));
}

cstr2.prototype = {
    get Cww() { return this.c1.Cw - this.ratio*this.c1.r/this.c2.r*this.c2.Cw; },
    get imc() { return this.c1.imc + (this.ratio*this.c1.r/this.c2.r)**2 * this.c2.imc; },

}


// use it with node.js ... ?
if (typeof module !== 'undefined') module.exports = cstr;