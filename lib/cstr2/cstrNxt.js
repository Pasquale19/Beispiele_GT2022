/**
 * @author Stefan Goessner (c) 2021
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
function cstr({id,p1,p2,r,w,r_ref}) {
    const o = { id, p1, p2,
                _r: { type:'free', q:Math.hypot(p2.y-p1.y, p2.x-p1.x), dq:0 },
                _w: { type:'free', q:Math.atan2(p2.y-p1.y, p2.x-p1.x), dq:0 }
              }
    if (r !== undefined) {
        if (typeof r === 'string' && r === 'const')
            Object.assign(o._r, { type:'ctrl' });
        else if (typeof r === 'number')
            Object.assign(o._r, { type:'ctrl', q:r });
    }
    if (r_ref !== undefined && typeof r_ref === 'function')
        Object.assign(o._r, { ref:r_ref });

    if (w !== undefined) {
        if (typeof w === 'string' && w === 'const')
            Object.assign(o._w, { type:'ctrl' });
        else if (typeof w === 'number') 
            Object.assign(o._w, { type:'ctrl', q:w });
    }

    return Object.create(cstr.prototype, Object.getOwnPropertyDescriptors(o));
}

cstr.prototype = {
    get r() { return this._r.q; },
    get w() { return this._w.q; },

    get im1() { return (this.p1.m ? 1/this.p1.m : this.p1.base ? 0 : 1); },
    get im2() { return (this.p2.m ? 1/this.p2.m : this.p2.base ? 0 : 1); },
    get imc() { return this.im1 + this.im2; },

    pre() {
    },
    calc(tol) {
        this.calc_r(tol);
        this.calc_w(tol);
    },
    post(tol) {
        return this.post_r(tol) && this.post_w(tol);
    },
    calc_r(tol) {
        if (this._r.type === "free")
            this._r.dq = (this.p2.x-this.p1.x)*Math.cos(this.w) + (this.p2.y-this.p1.y)*Math.sin(this.w) - this._r.q;
        if (this._r.ref !== undefined) {
            const dr = (this.p2.x-this.p1.x)*Math.cos(this.w) + (this.p2.y-this.p1.y)*Math.sin(this.w) - this._r.q;
            if (Math.abs(dr) < tol) { // constraint intact ... call ref ... ?
                this._r.dq = this._r.ref();
//                console.log(this._r.dq)
            }
            else                      // constraint violated ... 
                this._r.dq = dr;
        }
    },
    post_r(tol) {
        const done = this._r.type === "free" && this._r.ref === undefined
                  || Math.abs(this._r.dq) < tol;
        if (!done) { // self-control
            console.log('~')
            this.applyImpulse(this._r.dq*Math.cos(this.w), this._r.dq*Math.sin(this.w));
        }
        else
            ;//console.log(this)
        this._r.q = (this.p2.x-this.p1.x)*Math.cos(this.w) + (this.p2.y-this.p1.y)*Math.sin(this.w);
        this._r.dq = 0;
        return done;
    },
    calc_w(tol) {
        if (this._w.type !== "free")
            this._w.dq = (this.p2.y-this.p1.y)*Math.cos(this.w) - (this.p2.x-this.p1.x)*Math.sin(this.w)
    },
    post_w(tol) {
        const done = this._w.type === "free" || Math.abs(this._w.dq) < tol;
        if (!done)  // self-control
            this.applyImpulse(-this._w.dq*Math.sin(this.w), this._w.dq*Math.cos(this.w));
        return done;
    },
    applyImpulse(dx,dy) {
        const im1_imc = this.im1 / this.imc, 
              im2_imc = this.im2 / this.imc,
              limit = 1000;
        this.p1.x = Math.min(limit, Math.max(-limit, this.p1.x + im1_imc * dx));
        this.p1.y = Math.min(limit, Math.max(-limit, this.p1.y + im1_imc * dy));
        this.p2.x = Math.min(limit, Math.max(-limit, this.p2.x - im2_imc * dx));
        this.p2.y = Math.min(limit, Math.max(-limit, this.p2.y - im2_imc * dy));
    }
}

// use it with node.js ... ?
if (typeof module !== 'undefined') module.exports = cstr;