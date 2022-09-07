/**
 * cstr - Lightweight 2D constraint class for nodes
 * @author Stefan Goessner (c) 2021-22
 * @license MIT Licence (MIT)
 */
/* jshint -W014 */

function cstr(opts) {
    return Object.create(cstr.prototype, Object.getOwnPropertyDescriptors(opts ? {nodes:[],constraints:[],opts} : {nodes:[],constraints:[]}));
}

cstr.prototype = {
    /**
     * Constraint(s) between two nodes.
     * @method
     * @returns {object} cstr
     * @param {object} a - constraint arguments object.
     * @property {string} id - id string.
     * @property {object} n1 - start node.
     * @property {object} n2 - end node.
     * @property {number | string | function} [r='const'] - magnitude of vector from `n1` to `n2`.
     * @property {number | string | function} [w='const'] - angle of vector from `n1` to `n2` with respect to pos. x-axis. direction is allowed to get negative though.
     * @property {boolean} [dir=0] - specified angle `ang` must be strictly met directional (1) or antidirectional (-1), else unrestricted (0).
     */
    n2(a) {
        for (const key in a) // for all properties in argument `a`
            if (!Object.getOwnPropertyDescriptor(a, key).get    // if 'key' is no getter ...
                && typeof a[key] === 'function') {              // and a function ... make it a getter
                    Object.defineProperty(a, key, { get: a[key], enumerable: true, configurable: true, writabel: false });
            }
        return this.addCstr({ c:'n2', a });
    },
    /**
     * Get DoF (degree of freedom).
     * @method
     * @param {string} - id.
     * @returns {object} cstr
     */
     get dof() {
        let cdof = 0;
        for (const n of this.nodes)
            if (!n.base) cdof += 2;
        for (const c of this.constraints) {
            if (c.a.len !== undefined) cdof--;
            if (c.a.ang !== undefined) cdof--;
        }
        return cdof;
    },
    /**
     * Constraint(s) between three nodes.
     * !!! DEPRICATED: use two n2 constraints instead ...
     * @method
     * @returns {object} cstr
     * @param {object} - 'n2' constraint arguments object.
     * @property {string} id - id string.
     * @property {object} n1 - base node.
     * @property {object} n2 - node.
     * @property {object} n3 - node.
     * @property {number | string | function} [w='const'] - angle from vector `r12` to `r13`.
     */
     n3({id,n1,n2,n3,ang}) {
        const o = (ang !== undefined ? {id,n1,n2,n3,ang} : {id,n1,n2,n3});
        return this.addCstr({ c:'n3', a:o });
    },
    /**
     * Add constraint to constraint array.
     * @private
     * @method
     * @returns {object} cstr
     * @param {object} - constraint arguments object.
     * @property {string} c - constraint type name.
     * @property {number} a - constraint arguments.
     */
    addCstr({c,a}) {
        if (cstr.prototype[c].prototype) {
            Object.setPrototypeOf(a, cstr.prototype[c].prototype);
            if (a.constructor)
                a.constructor(this);
        }
        if (!this.nodes.includes(a.n1)) this.nodes.push(a.n1);
        if (!this.nodes.includes(a.n2)) this.nodes.push(a.n2);
        this.constraints.push(arguments[0]);
        return this;
    },
    /**
     * Get constraint by id.
     * @private
     * @method
     * @param {string} - id.
     * @returns {object} cstr
     */
    byId(id) {
        return this.constraints.find(c => c.a.id === id)?.a;
    },
    correct() {
        let valid = false, itr = 0;  // iterations done ...
        for (; !valid && itr<cstr.itrmax; itr++) {
            for (const c of this.constraints)
                c.a.initItrSeq();
            valid = true;
            for (const c of this.constraints)
                valid = c.a.correct() && valid;
        }
        if (!valid) {
            for (const c of this.constraints)
                c.a.undoItrSeq();
            return 0;
        }
        return itr;
    },
    log() {
        for (const c of this.constraints)
            c.a.log();
    }
}

// static constants.
cstr.pi2 = 2*Math.PI;
cstr.lenmax = 1.0e6;      // max. length of vector between two nodes.
cstr.lentol = 0.1;        // length tolerace
cstr.itrmax = 256;        // max. iteration steps

// private helpers ...
cstr._hasGetter = function(o,key) {
    const pd = Object.getOwnPropertyDescriptor(o,key);
    return pd && !!pd.get;
}
cstr.toPi = (w) => (w = (w % cstr.pi2 + cstr.pi2) % cstr.pi2) > Math.PI ? w - cstr.pi2 : w; // [-pi .. w .. pi]

// length functions
cstr.len = {
    min(min) {
        return function() {return Math.max(this.r,min)};
    },
    max(max) {
        return function() {return Math.min(this.r,max)};
    },
    from(id,scl) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            return (c || (c = this.root.byId(id))).r*(scl || 1);
        }
    },
    range(min,max) {
        return function() {return Math.min(Math.max(this.r,min),max)};
    }
}

// angular functions
cstr.ang = {
    min(min) {
        return function() {return Math.max(this.w,min)};
    },
    max(max) {
        return function() {return Math.min(this.w,max)};
    },
    range(min,max) {
        return function() {return Math.min(Math.max(this.w,min),max)};
    },
    from(id,ang=0) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            return cstr.toPi((c || (c = this.root.byId(id))).w + ang);
        }
    },
    posFrom(id) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            c = c || this.root.byId(id);
            return Math.min(Math.max(cstr.toPi(this.w - c.w),0),Math.PI) + c.w;
        }
    },
    negFrom(id) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            c = c || this.root.byId(id);
            return Math.min(Math.max(cstr.toPi(this.w - c.w),-Math.PI),0) + c.w;
        }
    },
    acuteFrom(id) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            c = c || this.root.byId(id);
            const dw = cstr.toPi(this.w - c.w);
            return Math.min(Math.max(dw,-Math.PI/2),Math.PI/2) + c.w;
        }
    },
    obtuseFrom(id) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            c = c || this.root.byId(id);
            const dw = cstr.toPi(this.w - c.w);
            return dw >= 0 ? Math.min(Math.max(dw, Math.PI/2), Math.PI) + c.w
                           : Math.max(Math.min(dw,-Math.PI/2),-Math.PI) + c.w;
        }
    },
    rangeFrom(id,min,max) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            c = c || this.root.byId(id);
            return Math.min(Math.max(cstr.toPi(this.w - c.w),min),max) + c.w;
        }
    },
    delta(from,to,scl) {
        let c1,c2;  // lazy reference to constraints with `id` ...
        return function() {
            return cstr.toPi(((c2 || (c2 = this.root.byId(to))).w - 
                              (c1 || (c1 = this.root.byId(from))).w)*scl + c1.w);
        }
    },
    // !! use `cstr.ang.from` instead ...
    include(id,ang) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            return cstr.toPi((c || (c = this.root.byId(id))).w + ang);
        }
    },
    // !! use `cstr.ang.fromRange` instead ...
    inclRange(id,min,max) {
        let c;  // lazy reference to constraint with `id` ...
        return function() {
            c = c || this.root.byId(id);
            return Math.min(Math.max(cstr.toPi(this.w - c.w),min),max) + c.w;
        }
    }
}

/**
 * Create constraint between two nodes.
 * @method
 * @returns {object} cstr
 * @param {object} - rectangle arguments object.
 * @property {number} x - x-value upper left corner.
 * @property {number} y - y-value upper left corner.
 * @property {number} b - width.
 * @property {number} h - height.
 * @property {string} [fs=transparent] - fill color.
 * @property {string} [ls=black] - stroke color.
 * @property {string} [lw=1] - line width.
 * @property {string} [lj='miter'] - line join [`round`, `bevel`, `miter`].
 * @property {number} [ml=10] - miter limit.
 * @property {array} [ld=[]] - line dash array.
 * @property {array} [sh=[0,0,0,"transparent"]]
 * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
 * @example
 * g2().rec({x:100,y:80,b:40,h:30}) // Draw rectangle.
 */
cstr.prototype.n2.prototype = {
    constructor(root) {
        this.root = root;

        this.undo = {
            n1:Object.assign({}, this.n1),
            n2:Object.assign({}, this.n2)
        };
        if (!cstr._hasGetter(this,'len') && this.len === 'const') 
            this.len = Math.hypot(this.n2.y-this.n1.y, this.n2.x-this.n1.x);
        if (!cstr._hasGetter(this,'ang') && this.ang === 'const') 
            this.ang = Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x);
    },

    get r() {
        return Math.hypot(this.n2.y-this.n1.y, this.n2.x-this.n1.x); 
    },

    get w() { 
        return Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x); 
    },

    get im1() { return (this.n1.base ? 0 : 1/((this.n1.m || 1) + (this.n1.dym || 0))); },
    get im2() { return (this.n2.base ? 0 : 1/((this.n2.m || 1) + (this.n2.dym || 0))); },
    get imc() { return this.im1 + this.im2; },
    get mc_m1() { return this.imc ? this.im1 / this.imc : this.im1; },
    get mc_m2() { return this.imc ? this.im2 / this.imc : this.im2; },

    initItrSeq() {
        Object.assign(this.undo.n1, this.n1);
        Object.assign(this.undo.n2, this.n2);
        if (this.len !== undefined) this.undo.len = this.len;
        if (this.ang !== undefined) this.undo.ang = this.ang;
        if (!this.n1.base) this.n1.dym = 0;
        if (!this.n2.base) this.n2.dym = 0;
    },
    undoItrSeq() {
        Object.assign(this.n1, this.undo.n1);
        Object.assign(this.n2, this.undo.n2);
        if (this.len !== undefined) this.len = this.undo.len;
        if (this.ang !== undefined) this.ang = this.undo.ang;
    },
    correct_r() {
        const x12 = this.n2.x-this.n1.x, y12 = this.n2.y-this.n1.y;
        const r = Math.hypot(x12, y12);
        const dr  = this.len - r;

        if (Math.abs(dr) > cstr.lentol) {
            const ex = r > Number.EPSILON ? x12/r : 1;  // avoid lock with two congruent nodes ... 
            const ey = r > Number.EPSILON ? y12/r : 0;  // ... and non-zero target length.
            const drx = dr*ex, dry = dr*ey;

            this.n1.x -= this.mc_m1*drx;
            this.n1.y -= this.mc_m1*dry;
            this.n2.x += this.mc_m2*drx;
            this.n2.y += this.mc_m2*dry;

            this.n1.dym++;
            this.n2.dym++;

            return false;
        }

        return true;
    },
    correct_w() {
        const x12 = this.n2.x-this.n1.x, y12 = this.n2.y-this.n1.y;
        const ca = Math.cos(this.ang), sa = Math.sin(this.ang);
        const de = -x12*sa + y12*ca;
        const mc_m1 = this.mc_m1, mc_m2 = this.mc_m2;
        let   dx, dy;

        if (this.dir) {  // directional restriction
            const sgn = Math.sign(this.dir);
            const re =  sgn*(x12*ca + y12*sa);
            dx = re > 0 ? -de*sa : 2*re*ca - de*sa;
            dy = re > 0 ?  de*ca : 2*re*sa + de*ca;
        }
        else {
            dx = -de*sa; 
            dy =  de*ca;
        }

        this.n1.x += mc_m1*dx;
        this.n1.y += mc_m1*dy;
        this.n2.x -= mc_m2*dx;
        this.n2.y -= mc_m2*dy;

        if (Math.hypot(this.n2.x - this.n1.x, this.n2.y - this.n1.y) > cstr.maxlen) {
            const x12 = this.n2.x-this.n1.x, y12 = this.n2.y-this.n1.y;
            const dlen = cstr.maxlen - Math.hypot(x12,y12);
            dx = dlen*ca;
            dy = dlen*sa;
            this.n1.x += mc_m1*dx;
            this.n1.y += mc_m1*dy;
            this.n2.x -= mc_m2*dx;
            this.n2.y -= mc_m2*dy;
        }

        this.n1.dym++;
        this.n2.dym++;

        return Math.abs(dx) < cstr.lentol && Math.abs(dy) < cstr.lentol;
    },

    correct() {
        let valid = true;
        if (this.ang !== undefined) {  // angular first ... r may be modified here.
            valid = this.correct_w() && valid;
        }
        if (this.len !== undefined) {
            valid = this.correct_r() && valid;
        }
        return valid;
    },
    log() {
        console.log({id:this.id,im1:this.im1,im2:this.im2,mc_m1:this.mc_m1,mc_m2:this.mc_m2,
                     r:Math.hypot(this.n2.y-this.n1.y, this.n2.x-this.n1.x),dr:this.dr,
                     w:Math.atan2(this.n2.y-this.n1.y, this.n2.x-this.n1.x)*180/Math.PI,dw:this.dw*180/Math.PI});
    }
}

cstr.prototype.n3.prototype = {
    constructor() {
        if (this.ang === 'const') this.ang = this.w;
        
        this.undo = {
            n1:Object.assign({}, this.n1),
            n2:Object.assign({}, this.n2),
            n3:Object.assign({}, this.n3)
        };
    },

    get w() {  // included angle
        const x12 = this.n2.x-this.n1.x, y12 = this.n2.y-this.n1.y;
        const x13 = this.n3.x-this.n1.x, y13 = this.n3.y-this.n1.y;
        return Math.atan2(x12*y13 - y12*x13, x12*x13 + y12*y13);
    },

    get im1() { return (this.n1.base ? 0 : 1/((this.n1.m || 1) + (this.n1.dym || 0))); },
    get im2() { return (this.n2.base ? 0 : 1/((this.n2.m || 1) + (this.n2.dym || 0))); },
    get im3() { return (this.n3.base ? 0 : 1/((this.n3.m || 1) + (this.n3.dym || 0))); },
    get im12() { return this.im1 + this.im2; },
    get im13() { return this.im1 + this.im3; },
    get imc() { return this.im12 + this.im13; },
    get mc_m12() { return this.imc ? this.im12 / this.imc : this.im12; },  // mass relation
    get mc_m13() { return this.imc ? this.im13 / this.imc : this.im13; },  // mass relation

    initItrSeq() {
        Object.assign(this.undo.n1, this.n1);
        Object.assign(this.undo.n2, this.n2);
        Object.assign(this.undo.n3, this.n3);
        if (this.len !== undefined) this.undo.len = this.len;
        if (this.ang !== undefined) this.undo.ang = this.ang;
        if (!this.n1.base) this.n1.dym = 0;
        if (!this.n2.base) this.n2.dym = 0;
        if (!this.n3.base) this.n3.dym = 0;
    },
    undoItrSeq() {
        Object.assign(this.n1, this.undo.n1);
        Object.assign(this.n2, this.undo.n2);
        Object.assign(this.n3, this.undo.n3);
        if (this.len !== undefined) this.len = this.undo.len;
        if (this.ang !== undefined) this.ang = this.undo.ang;
    },
    correct_w() {
        const x12 = this.n2.x-this.n1.x, y12 = this.n2.y-this.n1.y;
        const r12 = Math.hypot(x12,y12);
        if (r12 > Math.sqrt(Number.EPSILON)) {
            const x13 = this.n3.x-this.n1.x, y13 = this.n3.y-this.n1.y;
            const c12 = x12/r12, s12 = y12/r12;
            const ca = Math.cos(this.ang), sa = Math.sin(this.ang);  // Zielwinkel
            const c12a = c12*ca - s12*sa, s12a = s12*ca + c12*sa;
            const o13 = -x13*s12a + y13*c12a;     // orthogonal projection

            const dx13 = - o13*s12a, dy13 = o13*c12a;
            const mc_m3_3 = this.im13 ? this.im3 / this.im13 : this.im3;

            this.n3.x -= mc_m3_3*dx13;
            this.n3.y -= mc_m3_3*dy13;
            this.n3.dym++;

            return Math.abs(dx13) < cstr.lentol && Math.abs(dy13) < cstr.lentol;
        }
        return true;
    },

    correct() {
        let valid = this.correct_w();
        return valid;
    },
    log() {
        console.log({id:this.id,im1:this.im1,im2:this.im2,im3:this.im3,mc_m12:this.mc_m12,mc_m13:this.mc_m13,
                     w:this.w*180/Math.PI,dw:this.dw*180/Math.PI,ang:this.ang*180/Math.PI});
    }
}

// use it with node.js ... ?
if (typeof module !== 'undefined') module.exports = cstr;