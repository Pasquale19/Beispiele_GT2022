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
            o._w = w;
        }
        else if (typeof w === 'function') {
            Object.defineProperty(o, '_w', { get:w, enumerable:true, configurable:true });
        }
        else if (typeof w === 'string' && w === 'const') {
            o._w = Math.atan2(p2.y-p1.y, p2.x-p1.x);
        }
        else if (typeof w === 'object' && 'ref' in w) {
            const ref = typeof w.ref === 'object' ? w.ref : null;
            const offset = Math.atan2(p2.y-p1.y, p2.x-p1.x) - ref.w;
            Object.defineProperty(o, '_w', { get:()=>ref.w + offset, enumerable:true, configurable:true });
            o.wref = ref;
        }
    }
    return Object.create(cstr.prototype, Object.getOwnPropertyDescriptors(o));
}

cstr.prototype = {
    get r() { return this._r !== undefined ? this._r : Math.hypot(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
    get w() { return this._w !== undefined ? this._w : Math.atan2(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
    get e() { const w = this.w; return {x:Math.cos(w), y:Math.sin(w)}; },

//    get im() { return (this.p1.base ? 0 : 1) + (this.p2.base ? 0 : 1); },  // constraint mass ...

//    get rcstr() { return this._r !== undefined; },
//    get wcstr() { return this._w !== undefined; },

//    get rDev() { return this.rfix ? (Math.hypot(this.p2.y-this.p1.y,this.p2.x-this.p1.x) - this._r) : 0; },
//    get wDev() { return this.wfix ? (Math.atan2(this.p2.y-this.p1.y,this.p2.x-this.p1.x) - this._w) : 0; },
//    get error() { return Math.max(Math.abs(this.rDev), Math.abs(this.wDev*this.r/2)); },
//    get v() { return {x:this.p2.x-this.p1.x, y:this.p2.y-this.p1.y}; },

    correct(lenTol) {
        const p1 = this.p1, p2 = this.p2;
        const ax = p2.x - p1.x, ay = p2.y - p1.y;
        const w = this.w, cw = Math.cos(w), sw = Math.sin(w);
        let   Cr=0, Cw=0;

        if (this._r !== undefined) {
            Cr = ax*cw + ay*sw - this._r;
            this.applyImpulse(Cr*cw, Cr*sw);
        }
        if (this.wref) {
            Cw = this.ay*this.cw - this.ax*this.sw - ratio*this.r/(ref.r||1)*(ref.ay*ref.cw - ref.ax*ref.sw),
        }
        else if (this._w !== undefined) {
            Cw = ay*cw - ax*sw;
//            this.applyImpulse(-Cw*sw, Cw*cw);
            if (this.wref) {
//            console.log('#')
                const ref = this.wref;
                const scl = this.r/ref.r;
                this.applyImpulse(-Cw*sw/2, Cw*cw/2);
                ref.applyImpulse(scl*Cw*sw/2, -scl*Cw*cw/2);
            }
//            else
                this.applyImpulse(-Cw*sw/2, Cw*cw/2);
        }

        return Math.abs(Cr) < lenTol && Math.abs(Cw) < lenTol;
    },

    applyImpulse(Cx,Cy) {
        const p1 = this.p1, p2 = this.p2;
        const im1 = p1.base ? 0 : 1, im2 = p2.base ? 0 : 1, im = im1 + im2;
//console.log(`${this.id}: apply (${Cx},${Cy})`)
        p1.x +=   im1/im * Cx;
        p1.y +=   im1/im * Cy;
        p2.x += - im2/im * Cx;
        p2.y += - im2/im * Cy;
    }
}
/*
cstr2.len = function len({p1,p2,r}) {
    const o = {p1,p2};
    if (typeof r === 'number') { // constant
        o._r = r;
    }
    else if (typeof r === 'string' && r === 'const') {
        o._r = Math.hypot(p2.y-p1.y, p2.x-p1.x);
    }
    else if (typeof r === 'function') {
        Object.defineProperty(o, 'r', { get:r, enumerable:true, configurable:true, writabel:false });
    }
    return Object.create(cstr2.len.prototype, Object.getOwnPropertyDescriptors(o));
}
cstr2.len.prototype = {
    get r() { return this._r !== undefined ? this._r : Math.hypot(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
    get w() { return Math.atan2(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
//    get error() { return this._r !== undefined ? (Math.hypot(this.p2.y-this.p1.y, this.p2.x-this.p1.x) - this._r) : 0; },
    correct(minerr) {
        const a = Math.hypot(this.p2.y-this.p1.y, this.p2.x-this.p1.x);
        const r = this._r !== undefined ? this._r : a;

        if (Math.abs(a - r) <= minerr) return true;

        const p1 = this.p1, p2 = this.p2;
        const dx = a > 0 ? (1 - r/a)*(p2.x - p1.x) : 1,
              dy = a > 0 ? (1 - r/a)*(p2.y - p1.y) : 1;

        if (!p1.base && p2.base) {
            p1.x += dx;
            p1.y += dy;
        }
        else if (p1.base && !p2.base) {
            p2.x -= dx;
            p2.y -= dy;
        }
        else if (!p1.base && !p2.base) {
            p1.x += dx/2;
            p1.y += dy/2;
            p2.x -= dx/2;
            p2.y -= dy/2;
        }

        return false;
    }
}

cstr2.ori = function ori({p1,p2,w}) {
    const o = {p1,p2};
    if (typeof w === 'number') { // constant
        o._w = w;
    }
    else if (typeof w === 'function') {
        Object.defineProperty(o, '_w', { get:w, enumerable:true, configurable:false } );
    }
    else
       o._w = Math.atan2(p2.y-p1.y, p2.x-p1.x);
    return Object.create(cstr2.ori.prototype, Object.getOwnPropertyDescriptors(o));
}
cstr2.ori.prototype = {
    get r() { return Math.hypot(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
//    get w() { return Math.atan2(this.p2.y-this.p1.y, this.p2.x-this.p1.x); },
    get e() { return { x:Math.cos(this._w), y:Math.sin(this._w) } },

    correct(errLimit) {
        const ex =  Math.cos(this._w), ey =  Math.sin(this._w);
        const p1 = this.p1, p2 = this.p2;
        const ax = p2.x-p1.x, ay = p2.y-p1.y;

        if (Math.abs(ax*ey - ay*ex) < 2*errLimit) return true;

        const lam = ex*ax + ey*ay;
        const dx = ax - lam*ex, dy = ay - lam*ey;

        if  (!p1.base && p2.base) {
            p1.x += dx;
            p1.y += dy;
        }
        else if (p1.base && !p2.base) {
            p2.x -= dx;
            p2.y -= dy;
        }
        else if (!p1.base && !p2.base) {
            p1.x += dx/2;
            p1.y += dy/2;
            p2.x -= dx/2;
            p2.y -= dy/2;
        }

        return false;
    }
}

cstr2.ori2 = function ori2({c1,c2,w}) {
    const o = {c1,c2};
    if (typeof w === 'number') { // constant
        o.w = w;
    }
    else if (typeof w === 'function') {
        Object.defineProperty(o, 'w', { get:w, enumerable:true, configurable:false } );
    }
    else {
        const e1 = c1.e, e2 = c2.e;
        o.w = Math.atan2(e2.x*e1.y-e2.y*e1.x, e2.x*e1.x+e2.y*e1.y);
    }
    return Object.create(cstr2.ori2.prototype, Object.getOwnPropertyDescriptors(o));
}
cstr2.ori2.prototype = {
    correct(errLimit) {
        const e1 = this.c1.e, e2 = this.c2.e,
            cw = Math.cos(this.w), sw = Math.sin(this.w),
            e12x = e1.x*e2.x + e1.y*e2.y, e12y = e1.x*e2.y - e1.y*e2.x,
            sdel = e12y*cw - e12x*sw, cdel = e12y*sw + e12x*cw,
            delta = Math.atan2(sdel,cdel);

console.log("delta="+(delta/Math.PI*180)+"°")
        if (Math.abs(delta) < 0.001)  // ... here radiant !
            return true;

        this.c1._w += delta/2;  // correct both ...
        this.c2._w -= delta/2;  // ... constraint angles.

        this.c1.correct(errLimit);
        this.c2.correct(errLimit);

        return false;
    }
}
*/
// use it with node.js ... ?
if (typeof module !== 'undefined') module.exports = cstr;