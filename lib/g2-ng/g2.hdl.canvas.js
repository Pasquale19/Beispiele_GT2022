// Html canvas handler
g2.canvasHdl = function (ctx) {
    if (this instanceof g2.canvasHdl) {
        if (ctx instanceof CanvasRenderingContext2D) {
            this.ctx = ctx;
            this.cur = g2.defaultStyle;
            this.stack = [this.cur];
            this.matrix = [[1, 0, 0, 1, 0.5, 0.5]];
            this.gridBase = 2;
            this.gridExp = 1;
            return this;
        }
        else
            return null;
    }
    return g2.canvasHdl.apply(Object.create(g2.canvasHdl.prototype), arguments);
};
g2.handler.factory.push((ctx) => ctx instanceof g2.canvasHdl ? ctx
    : ctx instanceof CanvasRenderingContext2D ? g2.canvasHdl(ctx) : false);

g2.canvasHdl.prototype = {
    init(grp, style) {
        this.stack.length = 1;
        this.matrix.length = 1;
        this.initStyle(style ? Object.assign({}, this.cur, style) : this.cur);
        return true;
    },
    view({ x = 0, y = 0, scl = 1, cartesian = false }) {
        this.pushTrf(cartesian ? [scl, 0, 0, -scl, x, this.ctx.canvas.height - 1 - y]
            : [scl, 0, 0, scl, x, y]);
    },
    grid({ color = '#ccc', size } = {}) {
        const ctx = this.ctx, b = ctx.canvas.width, h = ctx.canvas.height,
            { x, y, scl } = this.uniTrf,
            sz = size || this.gridSize(scl),
            xoff = x % sz, yoff = y % sz;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = xoff, nx = b + 1; x < nx; x += sz) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
        for (let y = yoff, ny = h + 1; y < ny; y += sz) { ctx.moveTo(0, y); ctx.lineTo(b, y); }
        ctx.stroke();
        ctx.restore();
    },
    clr({ b, h } = {}) {
        const ctx = this.ctx;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, b || ctx.canvas.width, h || ctx.canvas.height);
        ctx.restore();
    },
    cir({ r }) {
        const { x = 0, y = 0 } = arguments[0];
        this.ctx.beginPath();
        this.ctx.arc(x || 0, y || 0, Math.abs(r), 0, 2 * Math.PI, true);
        this.drw(arguments[0]);
    },
    arc({ r, w = 0, dw = 2 * Math.PI }) {
        const { x = 0, y = 0 } = arguments[0];
        if (Math.abs(dw) > Number.EPSILON && Math.abs(r) > Number.EPSILON) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.abs(r), w, w + dw, dw < 0);
        }
        else if (Math.abs(dw) < Number.EPSILON && Math.abs(r) > Number.EPSILON) {
            const cw = Math.cos(w), sw = Math.sin(w);
            this.ctx.beginPath();
            this.ctx.moveTo(x - r * cw, y - r * sw);
            this.ctx.lineTo(x + r * cw, y + r * sw);
        }
        //  else  // nothing to draw with r === 0
        this.drw(arguments[0]);
    },
    ell({ rx, ry, w = 0, dw = 2 * Math.PI, rot = 0 }) {
        const { x = 0, y = 0 } = arguments[0];
        this.ctx.beginPath();
        this.ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, w, w + dw, dw < 0);
        this.drw(arguments[0]);
    },
    box({ x=0, y=0, w=0, b, h }) {
        if (w === 0)
            this.rec({...arguments[0],x:x-b/2,y:y-h/2});
        else {
            const tmp = this.setStyle(arguments[0]);
            const [cw, sw] = [Math.cos(w), Math.sin(w)];
            this.ctx.save();
            this.ctx.transform(cw, sw, -sw, cw, x, y);
            this.ctx.fillRect(-b/2,-h/2, b, h);
            this.ctx.strokeRect(-b/2,-h/2, b, h);
            this.ctx.restore();
            this.resetStyle(tmp);
        }
    },
    rec({ b, h }) {
        const { x = 0, y = 0 } = arguments[0].p !== undefined ? arguments[0].p : arguments[0];
        const tmp = this.setStyle(arguments[0]);
        this.ctx.fillRect(x, y, b, h);
        this.ctx.strokeRect(x, y, b, h);
        this.resetStyle(tmp);
    },
    lin(args) {
        this.ctx.beginPath();
        this.ctx.moveTo(args.x1 || 0, args.y1 || 0);
        this.ctx.lineTo(args.x2 || 0, args.y2 || 0);
        this.stroke(args);
    },
    ply(args) {
        const pts = args.pts;
        const len = pts.length;
        if (len > 1) {
            let   p = pts[0];
            this.ctx.beginPath();
            this.ctx.moveTo(p.x,p.y);
            for (let i = 1; i < len; i++)
                this.ctx.lineTo((p = pts[i]).x, p.y);
            if (args.closed)  // closed then ..
                this.ctx.closePath();
            this.drw(args);
        }
        return len;  // number of points ..
    },
    txt({ str, w = 0 }) {
        const { x = 0, y = 0 } = arguments[0].p !== undefined ? arguments[0].p : arguments[0];
        const tmp = this.setStyle(arguments[0]);
        const sw = w ? Math.sin(w) : 0, cw = w ? Math.cos(w) : 1;
        const trf = this.isCartesian ? [cw, sw, sw, -cw, x, y] : [cw, sw, -sw, cw, x, y];

        this.setTrf(trf);
        if (this.ctx.fillStyle === 'rgba(0, 0, 0, 0)') {
            this.ctx.fillStyle = this.ctx.strokeStyle;
            tmp.fs = 'transparent';
        }
        this.ctx.fillText(str, 0, 0);
        this.resetTrf();
        this.resetStyle(tmp);
    },
    errorImageStr: "data:image/gif;base64,R0lGODlhHgAeAKIAAAAAmWZmmZnM/////8zMzGZmZgAAAAAAACwAAAAAHgAeAEADimi63P5ryAmEqHfqPRWfRQF+nEeeqImum0oJQxUThGaQ7hSs95ezvB4Q+BvihBSAclk6fgKiAkE0kE6RNqwkUBtMa1OpVlI0lsbmFjrdWbMH5Tdcu6wbf7J8YM9H4y0YAE0+dHVKIV0Efm5VGiEpY1A0UVMSBYtPGl1eNZhnEBGEck6jZ6WfoKmgCQA7",
    images: Object.create(null),
    async loadImage(uri) {
        const download = async (xuri) => {
            const pimg = new Promise((resolve, reject) => {
                let img = new Image();
                img.src = xuri;
                function error(err) {
                    img.removeEventListener('load', load);
                    img = undefined;
                    reject(err);
                };
                function load() {
                    img.removeEventListener('error', error);
                    resolve(img);
                    img = undefined;
                };
                img.addEventListener('error', error, { once: true });
                img.addEventListener('load', load, { once: true });
            });

            try {
                return await pimg;
            } catch (err) {
                // console.warn(`failed to (pre-)load image; '${xuri}'`, err);
                if (xuri === this.errorImageStr) {
                    throw err;
                } else {
                    return await download(this.errorImageStr);
                }
            }
        }

        let img = this.images[uri];
        if (img !== undefined) {
            return img instanceof Promise ? await img : img;
        }
        img = download(uri);
        this.images[uri] = img;
        try {
            img = await img;
        } finally {
            this.images[uri] = img;
        }
        return img;
    },
    async img({ uri, x = 0, y = 0, b, h, sx = 0, sy = 0, sb, sh, xoff = 0, yoff = 0, w = 0, scl = 1 }) {
        const img_ = await this.loadImage(uri);
        this.ctx.save();
        const cart = this.isCartesian ? -1 : 1;
        sb = sb || img_.width;
        b = b || img_.width;
        sh = (sh || img_.height);
        h = (h || img_.height) * cart;
        yoff *= cart;
        w *= cart;
        y = this.isCartesian ? -(y / scl) + sy : y / scl;
        const [cw, sw] = [Math.cos(w), Math.sin(w)];
        this.ctx.scale(scl, scl * cart);
        this.ctx.transform(cw, sw, -sw, cw, x / scl, y);
        this.ctx.drawImage(img_, sx, sy, sb, sh, xoff, yoff, b, h);
        this.ctx.restore();
    },
    beg({ w = 0, scl = 1, matrix/*,unsizable*/ } = {}) {
        const { x = 0, y = 0 } = arguments[0].p !== undefined ? arguments[0].p : arguments[0];
        let trf = matrix;
        if (!trf) {
            const ssw = w ? Math.sin(w) * scl : 0;
            const scw = w ? Math.cos(w) * scl : scl;
            trf = [scw, ssw, -ssw, scw, x, y];
        }
        this.pushTrf(trf);
        this.pushStyle(arguments[0]);
    },
    end() {
        this.popStyle();
        this.popTrf();
    },
    path(args) {
        const ctx = this.ctx;
        const tmp = this.setStyle(args);
        const {w=0,x=0,y=0} = args;
        const isTrf = w || x || y;

        if (isTrf) {
            const sw = w ? Math.sin(w) : 0;
            const cw = w ? Math.cos(w) : 1;
            this.pushTrf([cw, sw, -sw, cw, x, y]);
//            console.log([cw, sw, -sw, cw, x, y])
        }
        if (args.seg) {  // segments defined ...
            const p = args.seg, n = p.length;
            let   i;  // current index
            const ifc = {
                m() { ctx.moveTo(p[i].x, p[i].y); i++; },
                l() { ctx.lineTo(p[i].x, p[i].y); i++; },
                q() { ctx.quadraticCurveTo(p[i].x,p[i].y,p[i+1].x,p[i+1].y); i+=2; },
                c() { ctx.bezierCurveTo(p[i].x,p[i].y,p[i+1].x,p[i+1].y,p[i+2].x,p[i+2].y); i+=3; },
                a() {
                    const dw = p[i].dw, dwabs = Math.abs(dw);
                    const mu = (dwabs > Number.EPSILON && dwabs < 2*Math.PI) ? 1/Math.tan(dw/2) : 0;
                    if (i > 0 && mu !== 0) {
                        const dx = p[i].x - p[i-1].x, dy = p[i].y - p[i-1].y;
                        const xc = (dx - mu*dy)/2, yc = (dy + mu*dx)/2;
                        const R = Math.hypot(xc,yc);
                        const w = Math.atan2(-yc,-xc);
                        ctx.ellipse(p[i-1].x+xc, p[i-1].y+yc, R, R, 0, w, w+dw, dw<0);
                    }
                    else
                        ctx.lineTo(p[i].x, p[i].y);
                    i++;
                },
                z() { ctx.closePath(); i++; }
            }
            ctx.beginPath();
            for (i=0; i < n; )
                ifc[p[i].c || 'l']();
            ctx.fill();
            if (ctx.shadowColor !== 'rgba(0, 0, 0, 0)' && ctx.fillStyle !== 'rgba(0, 0, 0, 0)') {
                const shc = ctx.shadowColor;              // avoid stroke shadow when filling ...
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';
                ctx.stroke();
                ctx.shadowColor = shc;
            }
            else
                ctx.stroke();
        }
        else if (args.d) {
            const pth = new Path2D(args.d);   // SVG path syntax
            ctx.fill(pth);
            if (ctx.shadowColor !== 'rgba(0, 0, 0, 0)' && ctx.fillStyle !== 'rgba(0, 0, 0, 0)') {
                const shc = ctx.shadowColor;              // avoid stroke shadow when filling ...
                ctx.shadowColor = 'rgba(0, 0, 0, 0)';
                ctx.stroke(pth);
                ctx.shadowColor = shc;
            }
            else
                ctx.stroke(pth);
        }
        if (isTrf) this.popTrf();
        this.resetStyle(tmp);
    },

    stroke({ d } = {}) {
        let tmp = this.setStyle(arguments[0]);
        d ? this.ctx.stroke(new Path2D(d)) : this.ctx.stroke();  // SVG path syntax
        this.resetStyle(tmp);
    },
    fill({ d } = {}) {
        let tmp = this.setStyle(arguments[0]);
        d ? this.ctx.fill(new Path2D(d)) : this.ctx.fill();  // SVG path syntax
        this.resetStyle(tmp);
    },
    drw({ d, lsh } = {}) {
        let ctx = this.ctx,
            tmp = this.setStyle(arguments[0]),
            p = d && new Path2D(d);   // SVG path syntax
        d ? ctx.fill(p) : ctx.fill();
        if (ctx.shadowColor !== 'rgba(0, 0, 0, 0)' && ctx.fillStyle !== 'rgba(0, 0, 0, 0)' && !lsh) {
            let shc = ctx.shadowColor;        // usually avoid stroke shadow when filling ...
            ctx.shadowColor = 'rgba(0, 0, 0, 0)';
            d ? ctx.stroke(p) : ctx.stroke();
            ctx.shadowColor = shc;
        }
        else
            d ? ctx.stroke(p) : ctx.stroke();
        this.resetStyle(tmp);
    },

    // State management (transform & style)
    // getters & setters
    get: {
        fs: (ctx) => ctx.fillStyle,
        ls: (ctx) => ctx.strokeStyle,
        lw: (ctx) => ctx.lineWidth,
        lc: (ctx) => ctx.lineCap,
        lj: (ctx) => ctx.lineJoin,
        ld: (ctx) => ctx.getLineDash(),
        ldoff: (ctx) => ctx.lineDashOffset,
        ml: (ctx) => ctx.miterLimit,
        sh: (ctx) => [ctx.shadowOffsetX || 0, ctx.shadowOffsetY || 0,
        ctx.shadowBlur || 0, ctx.shadowColor || 'black'],
        font: (ctx) => ctx.font,
        thal: (ctx) => ctx.textAlign,
        tval: (ctx) => ctx.textBaseline,
    },
    set: {
        fs: (ctx, q) => { ctx.fillStyle = q; },
        ls: (ctx, q) => { ctx.strokeStyle = q; },
        lw: (ctx, q) => { ctx.lineWidth = q; },
        lc: (ctx, q) => { ctx.lineCap = q; },
        lj: (ctx, q) => { ctx.lineJoin = q; },
        ld: (ctx, q) => { ctx.setLineDash(q); },
        ldoff: (ctx, q) => { ctx.lineDashOffset = q; },
        ml: (ctx, q) => { ctx.miterLimit = q; },
        sh: (ctx, q) => {
            if (q) {
                ctx.shadowOffsetX = q[0] || 0;
                ctx.shadowOffsetY = q[1] || 0;
                ctx.shadowBlur = q[2] || 0;
                ctx.shadowColor = q[3] || 'black';
            }
        },
        font: (ctx, q) => { ctx.font = q; },
        thal: (ctx, q) => { ctx.textAlign = q; },
        tval: (ctx, q) => { ctx.textBaseline = q; }
    },
    initStyle(style) {
        for (const key in style)
            if (this.get[key] && this.get[key](this.ctx) !== style[key])
                this.set[key](this.ctx, style[key]);
    },
    setStyle(style) {  // short circuit style setting
        let q, prv = {};
        for (const key in style) {
            if (this.get[key]) {  // style keys only ...
                let keyval = style[key];
                if (typeof style[key] === 'string' && style[key][0] === '@') {
                    // also check inherited styles ...
                    const ref = style[key].substr(1);
                    keyval = g2.symbol[ref] || ref in this.get && this.get[ref](this.ctx)
                                            || ref in this.cur && this.cur[ref];
                }
                if ((q = this.get[key](this.ctx)) !== keyval) {
                    prv[key] = q;
                    this.set[key](this.ctx, keyval);
                }
            }
        }
        return prv;
    },
    resetStyle(style) {   // short circuit style reset
        for (const key in style)
            this.set[key](this.ctx, style[key]);
    },
    pushStyle(style) {
        let cur = {};  // hold changed properties ...
        for (const key in style)  // allow extended style syntax ('fs-2', ...)
            if (g2.styleRex.test(key)) {  // (extended) style keys only ...
                if (typeof style[key] === 'string' && style[key][0] === '@') {
                    let ref = style[key].substr(1);
                    style[key] = g2.symbol[ref] || this.get[ref] && this.get[ref](this.ctx);
                }
                if (this.cur[key] !== style[key]) {
                    if (key in this.set)
                        this.set[key](this.ctx, style[key]);
                    cur[key] = style[key];
                }
            }
        this.stack.push(this.cur = Object.assign({}, this.cur, cur));
    },
    popStyle() {
        let cur = this.stack.pop();
        this.cur = this.stack[this.stack.length - 1];
        for (const key in this.cur)
            if (this.get[key] && this.cur[key] !== cur[key])
                this.set[key](this.ctx, this.cur[key]);
    },
    concatTrf(q, t) {
        return [
            q[0] * t[0] + q[2] * t[1],
            q[1] * t[0] + q[3] * t[1],
            q[0] * t[2] + q[2] * t[3],
            q[1] * t[2] + q[3] * t[3],
            q[0] * t[4] + q[2] * t[5] + q[4],
            q[1] * t[4] + q[3] * t[5] + q[5]
        ];
    },
    initTrf() {
        this.ctx.setTransform(...this.matrix[0]);
    },
    setTrf(t) {
        this.ctx.setTransform(...this.concatTrf(this.matrix[this.matrix.length - 1], t));
    },
    resetTrf() {
        this.ctx.setTransform(...this.matrix[this.matrix.length - 1]);
    },
    pushTrf(t) {
        let q_t = this.concatTrf(this.matrix[this.matrix.length - 1], t);
        this.matrix.push(q_t);
        this.ctx.setTransform(...q_t);
    },
    popTrf() {
        this.matrix.pop();
        this.ctx.setTransform(...this.matrix[this.matrix.length - 1]);
    },
    get isCartesian() {  // det of mat2x2 < 0 !
        let m = this.matrix[this.matrix.length - 1];
        return m[0] * m[3] - m[1] * m[2] < 0;
    },
    get uniTrf() {
        let m = this.matrix[this.matrix.length - 1];
        return { x: m[4], y: m[5], scl: Math.hypot(m[0], m[1]), cartesian: m[0] * m[3] - m[1] * m[2] < 0 };
    },
    unscaleTrf({ x, y }) {  // remove scaling effect (make unzoomable with respect to (x,y))
        let m = this.matrix[this.matrix.length - 1],
            invscl = 1 / Math.hypot(m[0], m[1]);
        return [invscl, 0, 0, invscl, (1 - invscl) * x, (1 - invscl) * y];
    },
    gridSize(scl) {
        let base = this.gridBase, exp = this.gridExp, sz;
        while ((sz = scl * base * Math.pow(10, exp)) < 14 || sz > 35) {
            if (sz < 14) {
                if (base == 1) base = 2;
                else if (base == 2) base = 5;
                else if (base == 5) { base = 1; exp++; }
            }
            else {
                if (base == 1) { base = 5; exp--; }
                else if (base == 2) base = 1;
                else if (base == 5) base = 2;
            }
        }
        this.gridBase = base;
        this.gridExp = exp;
        return sz;
    },
    // ==========================
    // Obsolete ...
    // ==========================
    p() { this.ctx.beginPath(); },
    z() { this.ctx.closePath(); },
    m({ x, y }) { this.ctx.moveTo(x, y); },
    l({ x, y }) { this.ctx.lineTo(x, y); },
    q({ x, y, x1, y1 }) { this.ctx.quadraticCurveTo(x1, y1, x, y); },
    c({ x, y, x1, y1, x2, y2 }) { this.ctx.bezierCurveTo(x1, y1, x2, y2, x, y); },
    a({ dw, k, phi, _xp, _yp }) {  // todo: fix elliptical arc bug ...
        const { x = 0, y = 0 } = arguments[0].p !== undefined ? arguments[0].p : arguments[0];
        if (k === undefined) k = 1;  // ratio r1/r2
        if (Math.abs(dw) > Number.EPSILON) {
            if (k === 1) { // circular arc ...
                let x12 = x - _xp, y12 = y - _yp;
                let tdw_2 = Math.tan(dw / 2),
                    rx = (x12 - y12 / tdw_2) / 2, ry = (y12 + x12 / tdw_2) / 2,
                    R = Math.hypot(rx, ry),
                    w = Math.atan2(-ry, -rx);
                this.ctx.ellipse(_xp + rx, _yp + ry, R, R, 0, w, w + dw, this.cartesian ? dw > 0 : dw < 0);
            }
            else { // elliptical arc .. still buggy .. !
                if (phi === undefined) phi = 0;
                let x1 = dw > 0 ? _xp : x,
                    y1 = dw > 0 ? _yp : y,
                    x2 = dw > 0 ? x : _xp,
                    y2 = dw > 0 ? y : _yp;
                let x12 = x2 - x1, y12 = y2 - y1,
                    _dw = (dw < 0) ? dw : -dw;
                //  if (dw < 0) dw = -dw;   // test for bugs .. !
                let cp = phi ? Math.cos(phi) : 1, sp = phi ? Math.sin(phi) : 0,
                    dx = -x12 * cp - y12 * sp, dy = -x12 * sp - y12 * cp,
                    sdw_2 = Math.sin(_dw / 2),
                    R = Math.sqrt((dx * dx + dy * dy / (k * k)) / (4 * sdw_2 * sdw_2)),
                    w = Math.atan2(k * dx, dy) - _dw / 2,
                    x0 = x1 - R * Math.cos(w),
                    y0 = y1 - R * k * Math.sin(w);
                this.ctx.ellipse(x0, y0, R, R * k, phi, w, w + dw, this.cartesian ? dw > 0 : dw < 0);
            }
        }
        else
            this.ctx.lineTo(x, y);
    }
}
