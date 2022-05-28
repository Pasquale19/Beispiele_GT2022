/**
 * g2.ext (c) 2015-22 Stefan Goessner
 * @author Stefan Goessner
 * @license MIT License
 * @requires g2.core.js
 * @typedef {g2}
 * @description Advanced symbols and prototypes for g2.
 * @returns {g2}
 */

 "use strict"

//var g2 = g2 || { prototype: {} };  // for jsdoc only ...

// constants for element selection / editing
g2.NONE = 0x0; g2.OVER = 0x1; g2.DRAG = 0x2; g2.EDIT = 0x4;

/**
 * Command prototype interfaces
 */
g2.ifc = {}

// point-like commands interface
g2.ifc.point = {
    get x()  { return Object.getOwnPropertyDescriptor(this, 'p') ? this.p.x : 0; },
    set x(q) { if (Object.getOwnPropertyDescriptor(this, 'p')) this.p.x = q; },
    get y()  { return Object.getOwnPropertyDescriptor(this, 'p') ? this.p.y : 0; },
    set y(q) { if (Object.getOwnPropertyDescriptor(this, 'p')) this.p.y = q; },
    drag({ x, y }) {
        this.x = x;
        this.y = y;
    }
}

// line-like commands interface
g2.ifc.line = {
    get x1() { return Object.getOwnPropertyDescriptor(this, 'p1') ? this.p1.x : 0; },
    get y1() { return Object.getOwnPropertyDescriptor(this, 'p1') ? this.p1.y : 0; },
    get x2() { return Object.getOwnPropertyDescriptor(this, 'p2') ? this.p2.x : 0; },
    get y2() { return Object.getOwnPropertyDescriptor(this, 'p2') ? this.p2.y : 0; },
    get len() { return Math.hypot(this.x2 - this.x1, this.y2 - this.y1) },
    pointAt(loc) {
        const t = loc === "beg" ? 0
                : loc === "end" ? 1
                    : (loc + 0 === loc) ? loc // numerical arg ..
                        : 0.5;   // 'mid' ..
        const dx = this.x2 - this.x1;
        const dy = this.y2 - this.y1;
        const len = Math.hypot(dx, dy);
        return {
            x: this.x1 + dx * t,
            y: this.y1 + dy * t,
            nx: len ? dy / len : 0,
            ny: len ? -dx / len : -1
        };
    },
    hit({ x, y, eps }) {
        const {x1,y1,x2,y2} = this;
        const dx = x2 - x1, dy = y2 - y1, dx1 = x - x1, dy1 = y - y1;
        const dot = dx*dx1 + dy*dy1, perp = dx*dy1 - dy*dx1, len = Math.hypot(dx,dy), epslen = eps*len;
        return -epslen < perp && perp < epslen && -epslen < dot && dot < len*(len+eps);
    },
    drag({ dx, dy }) {
        this.x1 += dx; this.x2 += dx;
        this.y1 += dy; this.y2 += dy;
    }
}

// arc-like commands interface
g2.ifc.arc = {
    pointAt(loc) {
        const t = loc === "beg" ? 0
                : loc === "end" ? 1
                    : (loc + 0 === loc) ? loc // numerical arg [0..1] ..
                        : 0.5;   // 'mid' ..
        const ang = (this.w || 0) + t * (this.dw || Math.PI * 2);
        const cang = Math.cos(ang), sang = Math.sin(ang);
        const r = loc === "c" ? 0 : this.r;
        return {
            x: this.x + r * cang,
            y: this.y + r * sang,
            nx: cang,
            ny: sang
        };
    },
    asPoly() {
        const {x,y,r} = this;
        const N = Math.floor(this.dw*r / (4*(this.lw || 1)));
        const dw = this.dw/N;
        const pts = [];

        for (let w = this.w; w < this.dw - dw; w += dw)
            pts.push({x: x + r*Math.cos(w), y: y + r*Math.sin(w)});

        return pts;
    }
}

// circular-like commands interface
g2.ifc.circular = {
    get isSolid() { return this.fs && this.fs !== 'transparent' },
    get len() { return 2 * Math.PI * this.r; },
    get lsh() { return this.state & g2.OVER; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false },
    pointAt(loc, cartesian) {
        const Q = Math.SQRT2 / 2;
        const LOC = { c: [0, 0], e: [1, 0], ne: [Q, Q], n: [0, 1], nw: [-Q, Q], w: [-1, 0], sw: [-Q, -Q], s: [0, -1], se: [Q, -Q] };
        const q = (loc + 0 === loc) ? [Math.cos(loc * 2 * Math.PI), Math.sin(loc * 2 * Math.PI)]
            : (LOC[loc || "c"] || [0, 0]);

        if (!cartesian) q[1] = -q[1];

        return {
            x: this.x + q[0] * this.r,
            y: this.y + q[1] * this.r,
            nx: q[0],
            ny: q[1]
        };
    },
    asPoly() {
        const {x,y,r} = this;
        const N = Math.max(Math.floor(2*Math.PI*r / (4*(this.lw || 1))), 5);
        const dw = 2*Math.PI/N;
        const pts = [];

        for (let w = 0; w < 2*Math.PI - dw; w += dw)
            pts.push({x: x + r*Math.cos(w), y: y + r*Math.sin(w)});

        return pts;
    },
    hit({ x, y, eps }) {
        return this.isSolid ? this.isPntIn({ x, y, eps }) : this.isPntOn({ x, y, eps });
    },
    isPntIn({ x, y, eps }) {
        return (this.x - x)**2 + (this.y - y)**2 < this.r**2;
    },
    isPntOn({ x, y, eps }) {
        const ddis = (this.x - x)**2 + (this.y - y)**2 - this.r**2, reps = eps*this.r;
        return -reps < ddis && ddis < reps;
    }
}

/**
 * `label` interface.
 * add label text to element.
 * @method
 * @param {string | object} - label string or object.
 * @property {string} str - label string.
 * @property {number} off - offset to label location.
 * @property {string | number} loc - label's center location (element specific)
 * @property {string} [font='normal 14px serif'] - label font.
 * @property {boolean} [border=false] - draw elliptical label border.
 * @property {object} border - draw elliptical label border using `{ls='transparent',fs='#ffc'}` style.
 */
g2.ifc.label = {
    significantDigits: 2,
    get offset() { 
        const off = this.label.off !== undefined ? +this.label.off : (this.lboff || 1);
        return off + Math.sign(off) * (this.lw || 2) / 2;
    },
    valueFrom(str) {
        const val = this[str];
        return isNaN(val) ? val
             : Number.isInteger(val) ? Number(val)
             : Number(val).toFixed(Math.max(this.significantDigits - Math.log10(val), 0));
    },
    get string() {   // example 'len=@len; mm'
        const s = typeof this.label === 'object' ? this.label.str 
                : typeof this.label === 'string' ? this.label 
                : '?';
        return s.replace(/([^@]*)@([^;]+);?(.*)/g,($0,$1,$2,$3)=>$1+($2?this.valueFrom($2):'')+$3);
    },

    g2_level: 5,
    g2(vw) {
        const lbl = this.label;
        if (lbl) {
            const font = (lbl.font || g2.defaultStyle.font);
            const h = +font.replace(/.*?([0-9]+)px.*/g,($0,$1)=>$1);
            const str = this.string;
            const rx = (str.length || 1) * 0.65 * h / 2; 
            const ry = 1.25 * h / 2;    // ellipse semi-axes length 
            const pos = this.pointAt(lbl.loc || this.lbloc, !!vw.cartesian);
            const off = this.offset;
            const p = {
                x: pos.x + pos.nx * (off + Math.sign(off) * rx),
                y: pos.y + pos.ny * (off + Math.sign(off) * ry)
            };
            const g = g2();

            if (lbl.border || lbl.fs) {
                lbl.fs = lbl.border && lbl.border.fs || (lbl.fs === '@' ? this.fs : lbl.fs) || '#ffc';
                g.ell({ x: p.x, y: p.y, rx, ry, 
                        ls: (lbl.border === true ? this.ls : (lbl.border?.ls || lbl.ls)) || 'transparent',
                        fs: lbl.border?.fs || lbl.fs || '#ffc' });
            }
            g.txt({
                str, x: p.x, y: p.y,
                thal: "center", tval: "middle",
                fs: lbl.ls || this.ls || 'black', 
                font
            });

            return g;
        }
    }
}

// hatch interface
g2.ifc.hatch = {
    g2_level: 1,
    g2() {
        if (this.hatch && this.asPoly) {
            const g = g2();
            const deflt = {w:Math.PI/4,dist:4*(this.lw||1),gap:3*(this.lw||1),lc:'round'};
            const hatch = this.hatch === true ? deflt : {...deflt,...this.hatch};
            const {ls,lw,lc} = {...this,...hatch};
            const lines = poly2.hatch(hatch, this.asPoly());
            if (lines.length > 1) {
                let d = '';
                for (let i=0; i < lines.length; i+=2)
                    d += `M${lines[i].x},${lines[i].y}L${lines[i+1].x},${lines[i+1].y}`;
                g.stroke({d,ls,lw,lc});
            }
            return g;
        }
    }
}


/**
 * `arc` command prototype
 */
g2.prototype.arc.prototype = g2.mixin(g2.ifc.point, g2.ifc.arc, g2.ifc.label, g2.ifc.hatch, {
    get angle() { return this.dw*180/Math.PI }
})

/**
 * `box` command prototype
 */
g2.prototype.box.prototype = g2.mixin(g2.ifc.label, g2.ifc.hatch, {
    x:0, y:0, w:0,
    asPoly() {
        const b2 = this.b/2, h2 = this.h/2;
        const pts = [{x:-b2,y:-h2},{x:b2,y:-h2},{x:b2,y:h2},{x:-b2,y:h2}];
        return poly2.proxy.trf(pts,{x,y,w}=this);
    },
    pointAt(loc) {
        const {x,y,b,h} = this;
        const diag = Math.hypot(b,h), dx = b/diag, dy = h/diag;
        const LOC = { c: [0,0,0,0], e: [b/2,0,1,0], ne: [b/2,h/2,dx,dy], n: [0,h/2,0,1], nw: [-b/2,h/2,-dx,dy], 
                      w: [-b/2,0,-1,0], sw: [-b/2,-h/2,-dx,-dy], s: [0,-h/2,0,-1], se: [b/2,-h/2,dx,-dy] };
        const q = LOC[loc] || LOC['c'];
        if (this.w) {
            const cw = Math.cos(this.w), sw = Math.sin(this.w);
            return {
                x: x + cw*q[0] - sw*q[1],
                y: y + sw*q[0] + cw*q[1],
                nx: cw*q[2] - sw*q[3],
                ny: sw*q[2] + cw*q[3]
            };
        }
        return {
            x: x + q[0],
            y: y + q[1],
            nx: q[2],
            ny: q[3]
        };
    }
})

/**
 * `cir` command prototype
 */
g2.prototype.cir.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, g2.ifc.hatch);

/**
 * `lin` command prototype
 */
g2.prototype.lin.prototype = g2.mixin(g2.ifc.line, g2.ifc.label, {
    drag({ dx, dy }) {
        this.x1 += dx; this.x2 += dx;
        this.y1 += dy; this.y2 += dy;
    }
});

/**
 * `rec` command prototype
 */
g2.prototype.rec.prototype = g2.mixin(g2.ifc.label, g2.ifc.hatch, {
    asPoly() {
        const {x,y,b,h} = this;
        return [{x,y},{x:x+b,y},{x:x+b,y:y+h},{x,y:y+h}];
    },
    pointAt(loc) {
        const {b,h} = this;
        const diag = Math.hypot(b,h), dx = b/diag, dy = h/diag;
        const LOC = { c: [b/2,h/2,0,0], e: [b,h/2,1,0], ne: [b,h,dx,dy], n: [b/2,h,0,1], nw: [0,h,-dx,dy], 
                      w: [0,h/2,-1,0], sw: [0,0,-dx,-dy], s: [b/2,0,0,-1], se: [b,0,dx,-dy] };
        const q = LOC[loc] || LOC['c'];
        return {
            x: this.x + q[0],
            y: this.y + q[1],
            nx: q[2],
            ny: q[3]
        };
    }
})

/**
* Draw interactive handle.
* @method
* @returns {object} g2
* @param {object} - handle object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @example
* g2().hdl({x:100,y:80})  // Draw handle.
*/
g2.prototype.hdl = function (args) { return this.addCommand({ c: 'hdl', a: args }); }
g2.prototype.hdl.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, g2.ifc.hatch, {
    r: 5,             // required by g2.ifc.label
    isSolid: true,
    draggable: true,
    lbloc: 'se',
    get lsh() { return this.state & g2.OVER; },
    get sh() { return this.state & g2.OVER ? [0, 0, 5, "black"] : false },
    g2() {
        const { x, y, r, ls = 'black', fs = '#ffc', sh } = this;
        return g2().cir({ x, y, r, ls, fs, sh });
    }
});

/**
* Node symbol command.
* @param {object} - arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @property {number} [r=5] - radius.
* @example
* g2().nod({x:10,y:10})
*/
g2.prototype.nod = function (args = {}) { return this.addCommand({ c: 'nod', a: args }); }
g2.prototype.nod.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    r: 5,
    lbloc: 'se',
    g2() {
        const {x,y,r,ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill} = this;
        return g2().cir({x,y,r,fs,ls});
    }
})

/**
 * Double node symbol
 * @returns {object} g2
 * @param {object} - arguments object.
 * @property {number} x - x-value center.
 * @property {number} y - y-value center.
 * @property {number} [r=6] - radius.
 * @example
 * g2().dblnod({x:100,y:100})
 */
g2.prototype.dblnod = function ({ x = 0, y = 0 }) { return this.addCommand({ c: 'dblnod', a: arguments[0] }); }
g2.prototype.dblnod.prototype =  g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    r: 6,
    lbloc: 'se',
    g2() {
        const {x,y,r,ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill,fs_2=g2.symbol.nodfill2} = this;
        return g2().cir({x,y,r,ls,fs})
                   .cir({x,y,r:r/2,ls,fs:fs_2})
    }
})

/**
 * Ground revolute joint symbol
 * @returns {object} g2
 * @param {object} - arguments object.
 * @property {number} x - x-value center.
 * @property {number} y - y-value center.
 * @property {number} [r=6] - radius.
 * @example
 * g2().gnd({x:100,y:100})
 */
g2.prototype.gnd = function ({x,y,r}) { return this.addCommand({ c: 'gnd', a: arguments[0] }); }
g2.prototype.gnd.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    r: 6,
    lbloc: 'se',
    g2(vw) {
        const {x,y,r=4,ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill} = this;
        const sgn = vw.cartesian ? 1 : -1;
        return g2()
            .cir({x,y,r,ls,fs})
            .path({seg: [
                {c:'m', x, y:y+sgn*r},
                {c:'a', x:x-r, y, dw:sgn*Math.PI/2},
                {c:'l', x:x+r, y},
                {c:'a', x, y:y-sgn*r, dw:-sgn*Math.PI/2},
                {c:'z'}
              ], ls:'transparent',fs:g2.symbol.nodcolor});
    }
})

/**
 * Pole symbol
 * @returns {object} g2
 * @param {object} - arguments object.
 * @property {number} x - x-value center.
 * @property {number} y - y-value center.
 * @property {number} [r=6] - radius.
 * @example
 * g2().gnd({x:100,y:100,r:10})
 */
g2.prototype.pol = function pol({x,y,r}) { return this.addCommand({ c: 'pol', a: arguments[0] }); }
g2.prototype.pol.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    r: 6,
    lbloc: 'se',
    g2(vw) {
        const {x,y,r,ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill} = this;
        return g2().cir({x,y,r,fs,ls})
                   .cir({x,y,r:r*2/5,fs:ls,ls:'transparent'})
    }
})

/**
 * Fixed ground symbol
* @method
* @returns {object} g2
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @property {number} w - rotation angle [rad].
* @example
* g2().view({cartesian:true})
*     .nodfix({x:10,y:10})
*/
g2.prototype.nodfix = function (args = {}) { return this.addCommand({ c: 'nodfix', a: args }); }
g2.prototype.nodfix.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    r: 5,        
    lbloc: 'se',
    lboff: 5,
    g2() {
        const { x, y, r, w = 0, lw = 1, ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill,fs_2=g2.symbol.nodfill2, lc = 'round', lj = 'round'} = this;
        return g2()
            .beg({ x, y, w, ls, fs, lw, lc, lj })
                .path({seg: [
                    {c:'m', x:-8, y:-12},
                    {c:'l', x: 0, y:0 },
                    {c:'l', x: 8, y:-12}
                ], fs:fs_2})
                .cir({ x: 0, y: 0, r })
            .end();
    }
})

/**
 * Floating ground symbol
* @method
* @returns {object} g2
* @param {object} - symbol arguments object.
* @property {number} x - x-value center.
* @property {number} y - y-value center.
* @property {number} w - rotation angle [rad].
* @property {string | object} label - text label.
* @example
* g2().view({cartesian:true})
*     .nodfix({x:10,y:10})
*/
g2.prototype.nodflt = function (args = {}) { return this.addCommand({ c: 'nodflt', a: args }); }
g2.prototype.nodflt.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    r: 5,        
    lbloc: 'ne',
    lboff: 5,
    g2() {
        const { x, y, r, w = 0, lw = 1, ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill,fs_2=g2.symbol.nodfill2, lc = 'round', lj = 'round'} = this;
        return g2()
            .beg({ x, y, w, ls, fs, lw, lc, lj })
                .path({seg: [
                    {c:'m', x:-8, y:-12},
                    {c:'l', x: 0, y:0 },
                    {c:'l', x: 8, y:-12}
                ], fs:fs_2})
                .cir({ x: 0, y: 0, r })
                .lin({ x1: -9, y1: -19, x2: 9, y2: -19, ls: g2.symbol.nodfill2, lw: 5 })
                .lin({ x1: -9, y1: -15.5, x2: 9, y2: -15.5, ls: g2.symbol.nodcolor, lw: 2 })
            .end();
    }
})

/**
* Vector arrow.
* @method
* @returns {object} g2
* @param {object} - vector arguments object.
* @property {number} x1 - start x coordinate.
* @property {number} y1 - start y coordinate.
* @property {number} x2 - end x coordinate.
* @property {number} y2 - end y coordinate.
* @example
* g2().vec({x1:50,y1:20,x2:250,y2:120})
*/
g2.prototype.vec = function vec(args) { return this.addCommand({ c: 'vec', a: args }); }
g2.prototype.vec.prototype = g2.mixin(g2.ifc.line, g2.ifc.label, {
    g2() {
        const { x1, y1, x2, y2, lw = 1, ls = '#000', ld = [], fs = ls || '#000', lc = 'round', lj = 'round', } = this;
        const dx = x2 - x1, dy = y2 - y1, r = Math.hypot(dx, dy);
        const b = 3 * (1 + lw) > r ? r / 3 : (1 + lw);
        return g2()
            .beg({ x: x1, y: y1, w: Math.atan2(dy, dx), ls, fs, lw, lc, lj })
                .path({seg: [
                    {c:'m', x:0, y:0},
                    {c:'l', x:r-6*b, y:0 },
                    {c:'m', x:r, y:0},
                    {c:'l', x:r-5*b, y:b },
                    {c:'a', x:r-5*b, y:-b, dw: -Math.PI / 3},
                    {c:'z'}
                ]})
            .end()
    }
});

/**
* Linear Dimension
* @method
* @returns {object} g2
* @param {object} - vector arguments object.
* @property {number} x1 - start x coordinate.
* @property {number} y1 - start y coordinate.
* @property {number} x2 - end x coordinate.
* @property {number} y2 - end y coordinate.
* @property {number} off - offset.
* @property {boolean} [inside=true] - draw dimension arrows between or outside of ticks.
* @example
* g2().dim({x1:50,y1:20,x2:250,y2:120})
*/
g2.prototype.dim = function dim(args) { return this.addCommand({ c: 'dim', a: args }); }
g2.prototype.dim.prototype = g2.mixin(g2.ifc.line, g2.ifc.label, {
    g2() {
        const { x1, y1, x2, y2, lw = 1, ls = '#000', ld = [], fs = ls || '#000', lc = 'round', lj = 'round', off = 0, inside = true} = this;
        const dx = x2 - x1, dy = y2 - y1, r = Math.hypot(dx, dy);
        const b = 3 * (1 + lw) > r ? r / 3 : (1 + lw);
        return g2()
            .beg({ x: x1, y: y1, w: Math.atan2(dy, dx), ls, fs, lw, lc, lj })
                .path({seg: [
                    {c:'m', x:0, y:0},
                    {c:'l', x:5*b, y: b },
                    {c:'a', x:5*b, y:-b, dw: Math.PI / 3},
                    {c:'z'},
                    {c:'m', x:  6*b, y:0 },
                    {c:'l', x:r-6*b, y:0 },
                    {c:'m', x:r, y:0},
                    {c:'l', x:r-5*b, y: b },
                    {c:'a', x:r-5*b, y:-b, dw: -Math.PI / 3},
                    {c:'z'}
                ]})
            .end()
    }
});

/**
 * Slider symbol
 * @method
 * @returns {object} g2
 * @param {object} - slider arguments object.
 * @property {number} x - start x coordinate.
 * @property {number} y - start y coordinate.
 * @property {number} [b=32] - slider breadth.
 * @property {number} [h=16] - slider height.
 * @property {number} [w=0] - rotation.
 * @example
 * g2().slider({x:150,y:75,w:Math.PI/4,b:64,h:32})
 */
g2.prototype.slider = function ({x,y,b,h,w,ls,fs,fs_2}) { return this.addCommand({c:'slider',a:arguments[0]}); }
g2.prototype.slider.prototype = g2.mixin(g2.ifc.point, g2.ifc.circular, g2.ifc.label, {
    b:32, h:16,
    r:5,
    w:0,
    lbloc: 'se',
    lboff: 4,
    g2(vw) {
        const {x,y,b,h,r,w,ls=g2.symbol.nodcolor,fs=g2.symbol.nodfill,fs_2='#fefefe99'} = this;
        return g2().box({x,y,w,b,h,ls,fs:fs_2})
                   .cir({x,y,r,fs,ls})
    }
})

/* Polygonial link.
 * @method
 * @returns {object} g2
 * @param {object} - arguments object.
 * @property {object[] | number[][] | number[]} pts - array of points.
 * @property {bool} [closed = false] - closed link.
 * @property {number} x - start x coordinate.
 * @property {number} y - start y coordinate.
 * @property {number} [w=0] - angle.
 * @example
 * const A = {x:50,y:25},B = {x:150,y:25},
 *       C = {x:50,y:75}, D = {x:100,y:75},
 *       E = {x:50,y:125};
 * g2().view({cartesian:true})
 *     .link({pts:[A,B,E,A,D,C]})
 */
g2.prototype.link = function ({pts,x,y,w}) { return this.addCommand({c:'link',a:arguments[0]}); }
g2.prototype.link.prototype = {
    x:0,y:0,w:0,
    closed: false,
    g2(vw) {
        const {pts,closed,x,y,w,ls='#666',fs='#fefefe66',lw=5,lc='round',lj='round'} = this;
        return g2().ply({pts,x,y,w,ls,fs:closed?fs:'transparent',lw,lc,lj});
    }
}

/**
 * YinYang symbol
 * @returns {object} g2
 * @param {object} - arguments object.
 * @property {number} x - x-value center.
 * @property {number} y - y-value center.
 * @property {number} [r=12] - radius.
 * @property {color} [ls='#666'] - strokecolor.
 * @property {color} [fs='#eee'] - fillcolor.
 * @example
 * g2().yinyang({x:100,y:100,r:10})
 */
g2.prototype.yinyang = function yinyang({x,y,r,ls,fs,lw}) { return this.addCommand({ c: 'yinyang', a: arguments[0] }); }
g2.prototype.yinyang.prototype = {
    r: 12,
    g2(vw) {
        const pi = Math.PI;
        const sgn = vw.cartesian ? -1 : 1;
        const {x,y,r,ls='#666',fs='#eee',lw=1} = this;
        return g2().beg({x,y,r,ls,fs,lw})
                        .cir({r})
                        .path({seg:[
                            {c:'m',x:0,y:-sgn*r},
                            {c:'a',x:0,y: 0, dw: sgn*pi},
                            {c:'a',x:0,y: sgn*r, dw:-sgn*pi},
                            {c:'a',x:0,y:-sgn*r, dw:-sgn*pi},
                            {c:'z'}
                            ], fs:ls})
                        .cir({y: sgn*r/2,r:r/4})
                        .cir({y:-sgn*r/2,r,r:r/4,ls:'transparent',fs:ls})
                    .end()
    }
}


/**
 * Extended style values.
 * Not really meant to get overwritten. But if you actually want, proceed.<br>
 * These styles can be referenced using the comfortable '@' syntax.
 * @namespace
 * @property {object} symbol  `g2` symbol namespace.
 * @property {object} [symbol.tick] Predefined symbol: a little tick
 * @property {object} [symbol.dot] Predefined symbol: a little dot
 * @property {object} [symbol.sqr] Predefined symbol: a little square
 * @property {string} [symbol.nodcolor=#333]    node color.
 * @property {string} [symbol.nodfill=#dedede]   node fill color.
 * @property {string} [symbol.nodfill2=#aeaeae]  alternate node fill color, somewhat darker.
 * @property {string} [symbol.linkcolor=#666]   link color.
 * @property {string} [symbol.linkfill=rgba(225,225,225,0.75)]   link fill color, semi-transparent.
 * @property {string} [symbol.dimcolor=darkslategray]   dimension color.
 * @property {array} [symbol.solid=[]]   solid line style.
 * @property {array} [symbol.dash=[15,10]]   dashed line style.
 * @property {array} [symbol.dot=[4,4]]   dotted line style.
 * @property {array} [symbol.dashdot=[25,6.5,2,6.5]]   dashdotted line style.
 * @property {number} [symbol.labelOffset=5]    default label offset distance.
 * @property {number} [symbol.labelSignificantDigits=3]   default label's significant digits after numbering point.
 */
g2.symbol = g2.symbol || {};
g2.symbol.tick = g2().path({ d:'M0,-2L0,2', lc: "round" });
g2.symbol.dot = g2().cir({ x: 0, y: 0, r: 2, ls: "transparent" });
g2.symbol.sqr = g2().rec({ x: -1.5, y: -1.5, b: 3, h: 3, ls: "transparent" });

g2.symbol.nodcolor = "#333";
g2.symbol.nodfill = "#dedede";
g2.symbol.nodfill2 = "#aeaeae";
g2.symbol.linkcolor = "#666";
g2.symbol.linkfill = "rgba(225,225,225,0.75)";
g2.symbol.dimcolor = "darkslategray";
g2.symbol.solid = [];
g2.symbol.dash = [15, 10];
g2.symbol.dot = [4, 4];
g2.symbol.dashdot = [25, 6.5, 2, 6.5];
g2.symbol.labelSignificantDigits = 3;  //  0.1234 => 0.123,  0.01234 => 0.0123, 1.234 => 1.23, 12.34 => 12.3, 123.4 => 123, 1234 => 1234
