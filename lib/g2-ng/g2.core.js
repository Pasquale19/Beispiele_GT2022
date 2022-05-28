/**
 * g2.core (c) 2013-22 Stefan Goessner
 * @author Stefan Goessner
 * @license MIT License
 * @link https://github.com/goessner/g2
 * @typedef {g2}
 * @param {object} [opts] Custom options object.
 * @description Create a 2D graphics command queue object. Call without using 'new'.
 * @returns {g2}
 * @example
 * const ctx = document.getElementById("c").getContext("2d");
 * g2()                                   // Create 'g2' instance.
 *     .lin({x1:50,y1:50,x2:100,y2:100})  // Append ...
 *     .lin({x1:100,y1:100,x2:200,y2:50}) // ... commands.
 *     .exe(ctx);                         // Execute commands addressing canvas context.
 */
 "use strict"

function g2(opts) {
    let o = Object.create(g2.prototype);
    o.commands = [];
    if (opts) Object.assign(o, opts);
    return o;
}

g2.prototype = {
    addCommand({ c, a }) {
        if (a && Object.getPrototypeOf(a) === Object.prototype) {  // modify only pure argument objects 'a' .. !
            for (const key in a) {
                if (!Object.getOwnPropertyDescriptor(a, key).get   // if 'key' is no getter ...
                    && key[0] !== '_'                              // and no private property ... 
                    && typeof a[key] === 'function') {             // and a function ... make it a getter
                    Object.defineProperty(a, key, { get: a[key], enumerable: true, configurable: true, writabel: false });
                }
                if (typeof a[key] === 'string' && a[key][0] === '@') {  // referring values by neighbor id's
                    const refidIdx = a[key].indexOf('.');
                    const refid = refidIdx > 0 ? a[key].substr(1, refidIdx - 1) : '';
                    const refkey = refid ? a[key].substr(refidIdx + 1) : '';
                    const refcmd = refid ? () => this.commands.find((cmd) => cmd.a && cmd.a.id === refid) : undefined;

                    if (refcmd)
                        Object.defineProperty(a, key, {
                            get: function () {
                                const rc = refcmd();
                                return rc && (refkey in rc.a) ? rc.a[refkey] : 0;
                            },
                            enumerable: true,
                            configurable: true,
                            writabel: false
                        });
                }
            }
            if (g2.prototype[c].prototype) Object.setPrototypeOf(a, g2.prototype[c].prototype);
        }
        this.commands.push(arguments[0]);
        return this;
    },

    /**
     * Draw arc by center point, radius, start angle and angular range.
     * @method
     * @returns {object} g2
     * @param {object} - arc arguments object.
     * @property {number} x - x-value center.
     * @property {number} y - y-value center.
     * @property {number} r - radius.
     * @property {number} [w=0] - start angle (in radian).
     * @property {number} [dw=2*pi] - angular range in Radians.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {string} [lc=butt] - line cap [`butt`, `round`, `square`].
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @example
     * g2().arc({x:300,y:400,r:390,w:-Math.PI/4,dw:-Math.PI/2})
     *     .exe(ctx);
     */
    arc({ x, y, r, w, dw }) { return this.addCommand({ c: 'arc', a: arguments[0] }); },

    /**
     * Begin subcommands. Current state is saved.
     * Optionally apply transformation or style properties.
     * @method
     * @returns {object} g2
     * @param {object} - beg arguments object.
     * @property {number} [x = 0] - translation value x.
     * @property {number} [y = 0] - translation value y.
     * @property {number} [w = 0] - rotation angle (in radians).
     * @property {number} [scl = 1] - scale factor.
     * @property {array} [matrix] - matrix instead of single transform arguments (SVG-structure [a,b,c,d,x,y]).
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - line stroke color.
     * @property {string} [lw=1] - line width.
     * @property {string} [lc=butt] - line cap [`butt`, `round`, `square`].
     * @property {string} [lj='miter'] - line join [`round`, `bevel`, `miter`].
     * @property {number} [ml=10] - miter limit.
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @property {string} [thal='start']
     * - text horizontal alignment [`'start'`,`'end'`,`'left'`,`'right'`,`'center'`]
     * @property {string} [tval='alphabetic']
     * - text vertival alignment [`'top'`,`'hanging'`,`'middle'`,`'alphabetic'`,`'ideographic'`,`'bottom'`]
     * @property {string} [font='normal 14px serif'] -
     * [Font]{@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}
     * [styling]{@link https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-font}
     */
    beg({ x, y, w, scl, matrix } = {}) { return this.addCommand({ c: 'beg', a: arguments[0] }); },

    /**
     * Draw rectangular box by center point, width and height.
     * `box` is the sophisticated `rec`, as it can be placed by center and get rotated.
     * @method
     * @returns {object} g2
     * @param {object} - rectangle arguments object.
     * @property {number} x - x-value upper left corner.
     * @property {number} y - y-value upper left corner.
     * @property {number} w - angle in [rad].
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
     * g2().box({x:100,y:80,b:40,h:30}) // Draw rectangle.
     */
    box({ x=0, y=0, w=0, b, h }) { return this.addCommand({ c: 'box', a: arguments[0] }); },

    /**
     * Draw circle by center and radius.
     * @method
     * @returns {object} g2
     * @param {object} - circle arguments object.
     * @property {number} x - x-value center.
     * @property {number} y - y-value center.
     * @property {number} r - radius.
     * @property {number} w - angle.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {array} [sh=[0,0,0,'transparent']]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @example
     * g2().cir({x:100,y:80,r:20})  // Draw circle.
     */
    cir({ x, y, r, w }) { return this.addCommand({ c: 'cir', a: arguments[0] }); },

     /**
     * Clear viewport region.<br>
     * @method
     * @returns {object} g2
     */
    clr() { return this.addCommand({ c: 'clr' }); },

    /**
     * Delete all commands beginning from `idx` to end of command queue.
     * @method
     * @returns {object} g2
     */
    del(idx) { this.commands.length = idx || 0; return this; },

    /**
     * Draw ellipse by center and radius for x and y.
     * @method
     * @returns {object} g2
     * @param {object} - ellipse argument object.
     * @property {number} x - x-value center.
     * @property {number} y - y-value center.
     * @property {number} rx - radius x-axys.
     * @property {number} ry - radius y-axys.
     * @property {number} w - start angle in radiant.
     * @property {number} dw - angular range in radiant.
     * @property {number} rot - rotation angle in radiant.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @example
     * :g2().ell({x:100,y:80,rx:20,ry:30,w:0,dw:2*Math.PI/4,rot:1})  // Draw circle.
     */
    ell({ x, y, rx, ry, w, dw, rot }) { return this.addCommand({ c: 'ell', a: arguments[0] }); },

    /**
     * End subcommands. Previous state is restored.
     * @method
     * @returns {object} g2
     * @param {object} - end arguments object.
     */
    end() { // ignore 'end' commands without matching 'beg'
        let myBeg = 1, idx, cmd;
        for (idx = this.commands.length - 1; idx >= 0; idx--) {
            cmd = this.commands[idx];
            if (cmd.c === 'beg') myBeg--;
            else if (cmd.c === 'end') myBeg++; // care about nested beg...end blocks ...
            if (myBeg === 0) break;            // matching `beg` found ...
        }
        return (myBeg === 0) ? this.addCommand({ c: 'end' }) : this;
    },

    /**
     * Execute g2 commands. It does so automatically and recursively with 'use'ed commands.
     * @method
     * @returns {object} g2
     * @param {object} ctx Context.
     */
    exe(ctx) {
        const handler = g2.handler(ctx);
        if (handler && handler.init(this)) {
            if (handler.exe)
                handler.exe(this.commands)
            else
                this.exeCommands(handler, this.commands, this.view)
        }
        return this;
    },
    // helpers ...
    async exeCommands(hdlr, commands, view) {
        if (commands)
            for (const cmd of commands) {
                // handler supports command name ..
                if (cmd.c && hdlr[cmd.c]) { 
                    const res = hdlr[cmd.c](cmd.a);
                    if (res && res instanceof Promise)
                        await res;
                }
                // support chained `g2` methods
                if (cmd.a?.g2_arr) {
                    for (const fn of cmd.a.g2_arr)
                        this.exeCommands(hdlr, fn.bind(cmd.a)(view)?.commands, view);
                }
                else if (cmd.a?.g2) {
                    this.exeCommands(hdlr, cmd.a.g2(view)?.commands, view);
                }
                // cmd.g2 exists and provides a `commands` array, so execute it.
                if (cmd.g2)
                    this.exeCommands(hdlr, cmd.g2.commands, view);

            }
        return this;
    },

    /**
     * Draw grid.
     * @method
     * @returns {object} g2
     * @param {object} - grid arguments object.
     * @property {string} [color=#ccc] - change color.
     * @property {number} [size=20] - change space between lines.
     */
    grid({ color, size } = {}) { return this.addCommand({ c: 'grid', a: arguments[0] }); },

    /**
     * Draw image.
     * This also applies to images of reused g2 objects. If an image can not be loaded, it will be replaced by a broken-image symbol.
     * @method
     * @returns {object} g2
     * @param {object} - image arguments object.
     * @property {string} uri - image uri or data:url.
     * @property {number} [x = 0] - x-coordinate of image (upper left).
     * @property {number} [y = 0] - y-coordinate of image (upper left).
     * @property {number} [b = image.width] - width.
     * @property {number} [h = image.height] - height.
     * @property {number} [sx = 0] - source x-offset.
     * @property {number} [sy = 0] - source y-offset.
     * @property {number} [sb = image.width] - source width.
     * @property {number} [sh = image.height] - source height.
     * @property {number} [xoff = 0] - x-offset.
     * @property {number} [yoff = 0] - y-offset.
     * @property {number} [w = 0] - rotation angle (about upper left, in radians).
     * @property {number} [scl = 1] - image scaling.
     */
    img({ uri, x, y, b, h, sx, sy, sb, sh, xoff, yoff, w, scl }) { return this.addCommand({ c: 'img', a: arguments[0] }); },

    /**
     * Call function, invoke interim g2 commands or invoke `g2()` method of object 
     * between commands of the command queue.
     * @method
     * @returns {object} g2
     * @param {function} - ins argument function.
     * @example
     * const node = {
     *      fill:'lime',
     *      g2() { return g2().cir({x:160,y:50,r:15,fs:this.fill,lw:4,sh:[8,8,8,"gray"]}) }
     * };
     * let color = 'red';
     * g2().cir({x:40,y:50,r:15,fs:color,lw:4,sh:[8,8,8,"gray"]})   // draw red circle.
     *     .ins(()=>{color='green'})                                // color is now green.
     *     .cir({x:80,y:50,r:15,fs:color,lw:4,sh:[8,8,8,"gray"]})   // draw green circle.
     *     .ins((g) =>                                              // draw orange circle
     *          g.cir({x:120, y:50, r:15, fs:'orange', lw:4,sh:[8,8,8,"gray"]}))
     *     .ins(node)                                               // draw node.
     *     .exe(ctx)                                                // render to canvas context.
     */
    ins(o) {
        return (typeof o === 'function') ? (o(this) || this)
             : (typeof o === 'object' && o instanceof g2) ? this.addCommand({c:'ins',g2:o})
             : this;
    },

    /**
     * Draw line by start point and end point.
     * @method
     * @returns {object} g2
     * @param {object} - line arguments object.
     * @property {number} x1 - start x coordinate.
     * @property {number} y1 - start y coordinate.
     * @property {number} x2 - end x coordinate.
     * @property {number} y2 - end y coordinate.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {string} [lc=butt] - line cap [`butt`, `round`, `square`].
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @example
     * g2().lin({x1:10,x2:10,y1:190,y2:10}) // Draw line.
     */
    lin({ x1, y1, x2, y2 }) { return this.addCommand({ c: 'lin', a: arguments[0] }); },

    /**
     * Draw path via path commands similar to SVG commands.
     * @method
     * @returns {object} g2
     * @param {object} - path arguments object.
     * @property {string} [d = undefined] - SVG path definition data string.
     * @property {array} [seg = undefined] - path segments array
     * @property {number} x - start x coordinate.
     * @property {number} y - start y coordinate.
     * @property {number} w - angle.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {string} [lc=butt] - line cap [`butt`, `round`, `square`].
     * @property {string} [lj='miter'] - line join [`round`, `bevel`, `miter`].
     * @property {number} [ml=10] - miter limit.
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @example
     * g2().ply({pts:[100,50,120,60,80,70]}),
     *     .ply({pts:[150,60],[170,70],[130,80]],closed:true}),
     *     .ply({pts:[{x:160,y:70},{x:180,y:80},{x:140,y:90}]}),
     *     .exe(ctx);
     */
    path(args)  { return this.addCommand({ c: 'path', a: args }); },

    /**
     * Draw polygon by points.
     * Command expects sequence of x/y-coordinates as a flat array [x,y,...],
     * array of [[x,y],...] arrays or array of [{x,y},...] objects.
     * @method
     * @returns {object} g2
     * @param {object} - polygon arguments object.
     * @property {array} pts - array of points.
     * @property {string} [format] - format string of points array structure. Useful for handing over initial empty points array. One of `['x,y','[x,y]','{x,y}']`. Has precedence over `pts` content.
     * @property {boolean} [closed = false]
     * @property {number} x - start x coordinate.
     * @property {number} y - start y coordinate.
     * @property {number} w - angle.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {string} [lc=butt] - line cap [`butt`, `round`, `square`].
     * @property {string} [lj='miter'] - line join [`round`, `bevel`, `miter`].
     * @property {number} [ml=10] - miter limit.
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @example
     * g2().ply({pts:[100,50,120,60,80,70]}),
     *     .ply({pts:[150,60],[170,70],[130,80]],closed:true}),
     *     .ply({pts:[{x:160,y:70},{x:180,y:80},{x:140,y:90}]}),
     *     .exe(ctx);
     */
    ply({ pts, format, closed, x, y, w }) {
        arguments[0].pts = g2.poly.proxy(arguments[0].pts, format, x, y, w);
        return this.addCommand({ c: 'ply', a: arguments[0] });
    },

    /**
     * Draw rectangle by anchor point and dimensions.
     * @method
     * @returns {object} g2
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
    rec({ x, y, b, h }) { return this.addCommand({ c: 'rec', a: arguments[0] }); },

    /**
     * Draw text string at anchor point.
     * @method
     * @returns {object} g2
     * @param {object} - text arguments object.
     * @property {string} str - text string.
     * @property {number} [x=0] - x coordinate of text anchor position.
     * @property {number} [y=0] - y coordinate of text anchor position.
     * @property {number} [w=0] - w Rotation angle about anchor point with respect to positive x-axis.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @property {string} [thal='start']
     * - Text horizontal alignment [`'start'`,`'end'`,`'left'`,`'right'`,`'center'`]
     * @property {string} [tval='alphabetic']
     * - Text vertival alignment [`'top'`,`'hanging'`,`'middle'`,`'alphabetic'`,`'ideographic'`,`'bottom'`]
     * @property {string} [font='normal 14px serif'] -
     * [Font]{@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}
     * [styling]{@link https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-font}
     */
    txt({ str, x, y, w }) { return this.addCommand({ c: 'txt', a: arguments[0] }); },

    /**
     * Reference g2 graphics commands from another g2 object or a predefined g2.symbol.
     * With this command you can reuse instances of grouped graphics commands
     * while applying a similarity transformation and style properties on them.
     * In fact you might want to build custom graphics libraries on top of that feature.
     * @method
     * @returns {object} g2
     * @param {object} - use arguments object.
     * @see {@link https://github.com/goessner/g2/blob/master/docs/api/g2.ext.md#g2symbol--object predefined symbols in g2.ext}
     * @property {object | string} grp - g2 source object or symbol name found in 'g2.symbol' namespace.
     * @property {number} [x=0] - translation value x.
     * @property {number} [y=0] - translation value y.
     * @property {number} [w=0] - rotation angle (in radians).
     * @property {number} [scl=1] - scale factor.
     * @property {string} [fs=transparent] - fill color.
     * @property {string} [ls=black] - stroke color.
     * @property {string} [lw=1] - line width.
     * @property {string} [lc=butt] - line cap [`butt`, `round`, `square`].
     * @property {string} [lj='miter'] - line join [`round`, `bevel`, `miter`].
     * @property {number} [ml=10] - miter limit.
     * @property {array} [ld=[]] - line dash array.
     * @property {array} [sh=[0,0,0,"transparent"]]
     * shadow values [`x-offset`,`y-offset`,`blur`,`color`],
     * @property {string} [thal='start']
     * - Text horizontal alignment [`'start'`,`'end'`,`'left'`,`'right'`,`'center'`]
     * @property {string} [tval='alphabetic']
     * - Text vertival alignment [`'top'`,`'hanging'`,`'middle'`,`'alphabetic'`,`'ideographic'`,`'bottom'`]
     * @property {string} [font='normal 14px serif'] -
     * [Font]{@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/font}
     * [styling]{@link https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-font}
     * @example
     * g2.symbol.cross = g2().lin({x1:5,y1:5,x2:-5,y2:-5}).lin({x1:5,y1:-5,x2:-5,y2:5});  // Define symbol.
     * g2().use({grp:"cross",x:100,y:100})  // Draw cross at position 100,100.
     */
    use({ grp, x, y, w, scl }) {
        if (grp && grp !== this) {     // avoid self reference ..
            const group = grp instanceof g2 ? grp
                        : (typeof grp === "string" && grp in g2.symbol) ? g2.symbol[grp]
                        : g2.symbol['unknown'];
            const cmd = { 
                c: 'use', 
                a: arguments[0],
                g2: g2().beg(arguments[0])
                        .ins(group)
                        .end()
            }

            this.addCommand(cmd);
        }
        return this;
    },

    /**
     * Set the view by placing origin coordinates and scaling factor in device units
     * and optionally make viewport cartesian.
     * @method
     * @returns {object} g2
     * @param {object} - view arguments object.
     * @property {number} [scl=1] - absolute scaling factor.
     * @property {number} [x=0] - x-origin in device units.
     * @property {number} [y=0] - y-origin in device units.
     * @property {boolean} [cartesian=false] - set cartesian flag.
     */
    view({ scl, x, y, cartesian }) { return this.addCommand({ c: 'view', a: (this.view=arguments[0]) }); }
};

// statics
g2.defaultStyle = { fs: 'transparent', ls: '#000', lw: 1, lc: "butt", lj: "miter", ld: [], ml: 10, sh: [0, 0], lsh: false, font: '16px serif', thal: 'start', tval: 'alphabetic' };
g2.styleRex = /^(fs|ls|lw|lc|lj|ld|ldoff|ml|sh|lsh|font|thal|tval)([-0-9].*)?$/,

g2.symbol = {
    unknown: g2().cir({ r: 12, fs: 'orange' }).txt({ str: '?', thal: 'center', tval: 'middle', font: 'bold 20pt serif' })
};
g2.handler = function (ctx) {
    let hdl;
    for (let h of g2.handler.factory)
        if ((hdl = h(ctx)) !== false)
            return hdl;
    return false;
}
g2.handler.factory = [];

/**
 * Replacement for Object.assign, as it does not assign getters and setters properly ...
 * See https://github.com/tc39/proposal-object-getownpropertydescriptors
 * See https://medium.com/@benastontweet/mixins-in-javascript-700ec81f5e5c
 * Shallow copy of prototypes (think interfaces)
 * create 
 * @private
 */
g2.mixin = function mixin(...protos) {
    const mix = {g2_arr:[]};

    for (const p of protos) {
        if (p) {
            Object.defineProperties(mix, Object.getOwnPropertyDescriptors(p));
            if ('g2' in p) {  // create call chain of multiple g2-methods. Order controlled by g2_level.
                p.g2.level = p.g2_level || 0;
                mix.g2_arr.push(p.g2);
            }
        }
    }

    if ('g2' in mix) {
        delete mix.g2;
        mix.g2_arr.sort((a,b) => a.level - b.level);
    }
    return mix;
}

// =======================================
// Minimal content extracted from poly2.js
// =======================================

g2.poly = globalThis.poly2 || {};

/**
 * Polygon data arrays of different structures are supported:
 * * `[x1,y1,x2,y2,...,xn,yn]` ... flat array of alternating x,y coordinates.
 * * `[[x1,y1],[x2,y2],...,[xn,yn]]` ... array of arrays of x,y coordinates.
 * * `[{x:x1,y:y1},{x:x2,y:y2},...,{x:xn,y:yn}]` ... array of {x,y} objects holding coordinates (this is the target polygon structure!)
 * A Proxy object - behaving as if it is filled with `{x,y}` objects - is returned.
 * Proxy objects for polygon data are designed to be read only. So modification must be applied to the original array. 
 * @method
 * @param {array} poly - Array of points.
 * @param {number} x - translation x-coordinate.
 * @param {number} y - translation y-coordinate.
 * @param {number} w - rotation angle in radians.
 * @return {proxy | undefined}
 * @example
 * const arr = poly2.proxy([2,3,5,6,7,8]);
 * for (let i=0; i<arr.length; i++)
 *     console.log(arr[i].x+','+arr[i].y);
 */
 g2.poly.proxy = g2.poly.proxy || function(poly, format, x, y, w) {
    if (Array.isArray(poly)) {
        let ply;
        if (poly.length > 1)   // at least holding two points ...
            ply = typeof poly[0] === "number" ? g2.poly.proxy.flat(poly)
                : Array.isArray(poly[0]) && typeof poly[0][0] === "number" && poly[0].length >= 2 ? g2.poly.proxy.arr(poly)
                : poly;
        else
            ply = format == 'x,y'   ? g2.poly.proxy.flat(poly)
                : format == '[x,y]' ? g2.poly.proxy.arr(poly)
                : poly

        return  (x || y || w) ? g2.poly.proxy.trf(ply,{x,y,w}) : ply;
    }
}
/**
 * Flat array of alternating x,y coordinates:
 * `[x1,y1,x2,y2,...,xn,yn]` ... 
 * @method
 * @param {array} poly - Array of alternating coordinates.
 * @return {proxy} Object for accessing `{x,y}` points instead.
 */
 g2.poly.proxy.flat = g2.poly.proxy.flat || function(poly) {
    const points = new Array(~~(poly.length/2));
    points[Symbol.iterator] = function() {
        let index = 0;
        return {
            next() { 
                return index < points.length 
                    ? { value: { x:poly[index*2], y:poly[(index++)*2+1] },
                        done: false }
                    : { done: true };
            }
        }
    }
    return new Proxy(poly, {
        get: (pts, key) => {
            if (key === Symbol.iterator)
                return points[Symbol.iterator].bind(points);
            else if (!isNaN(+key))
                return {x:pts[key*2],y:pts[key*2+1]};
            else if (key === 'length')
                return  ~~(pts.length/2);
            else
                return pts[key];
        }
    });
}
/**
 * Array of arrays of x,y coordinates:
 * `[[x1,y1],[x2,y2],...,[xn,yn]]` ... 
 * @method
 * @param {array} poly - Array of arrays of x,y coordinates.
 * @return {proxy} Object for accessing `{x,y}` points instead.
 */
 g2.poly.proxy.arr = g2.poly.proxy.arr || function(poly) {
    const points = new Array(poly.length);
    points[Symbol.iterator] = function() {
        let index = 0;
        return {
            next() { 
                return index < points.length 
                    ? { value: { x:poly[index][0], y:poly[index++][1] },
                        done: false }
                    : { done: true };
            }
        }
    }
    return new Proxy(poly, {
        get: (pts, key) => {
            if (key === Symbol.iterator)
                return points[Symbol.iterator].bind(points);
            else if (!isNaN(+key))
                return {x:pts[key][0],y:pts[key][1]};
            else
                return pts[key];
        }
    });
}
/**
 * Accessing transformed `{x,y}` points.
 * `[trf*{x,y}_0,trf*{x,y}_1,...,trf*{x,y}_n]` ... 
 * @method
 * @param {array} poly - Array or Proxy holding `{x,y}` points.
 * @param {number} w - rotation angle in radians.
 * @param {number} x - translation x-coordinate.
 * @param {number} y - translation y-coordinate.
 * @return {proxy} Object for accessing rotated `{x,y}` points.
 */
 g2.poly.proxy.trf = g2.poly.proxy.trf || function(poly,{w=0,x=0,y=0}) {
    if (w || x || y) {
        const points = new Array(poly.length);
        const sw = Math.sin(w), cw = Math.cos(w);

        points[Symbol.iterator] = function() {
            let index = 0;
            return {
                next() {
                    if (index < points.length) {
                        const p = poly[index++];
                        return { value: {x: p.x*cw - p.y*sw + x, y: p.x*sw + p.y*cw + y}, done: false };
                    }
                    return { done: true };
                }
            }
        }
        return new Proxy(poly, {
            get: (pts, key) => {
                if (key === Symbol.iterator)
                    return points[Symbol.iterator].bind(points);
                else if (!isNaN(+key)) {
                    const p = pts[+key];
                    return {x: p.x*cw - p.y*sw + x, y: p.x*sw + p.y*cw + y};
                }
                else
                    return pts[key];
            }
        });
    }
    return poly;  // no transform ...
}

// ==========================
// Obsolete ...
// ==========================

/**
 * Begin new path.
 * @method
 * @returns {object} g2
 */
 g2.prototype.p = function() { return this.addCommand({ c: 'p' }); },

/**
 * Close current path by straight line.
 * @method
 * @returns {object} g2
 */
 g2.prototype.z = function() { return this.addCommand({ c: 'z' }); },

/**
 * Move to point.
 * @method
 * @returns {object} g2
 * @param {object} - move arguments object.
 * @property {number} x - move to x coordinate
 * @property {number} y - move to y coordinate
 */
 g2.prototype.m = function({ x, y }) { return this.addCommand({ c: 'm', a: arguments[0] }); },

/**
 * Create line segment to point.
 * @method
 * @returns {object} g2
 * @param {object} - line segment argument object.
 * @property {number} x - x coordinate of target point.
 * @property {number} y - y coordinate of target point.
 * @example
 * g2().p()             // Begin path.
 *     .m({x:0,y:50})   // Move to point.
 *     .l({x:300,y:0})  // Line segment to point.
 *     .l({x:400,y:100}) // ...
 *     .stroke()        // Stroke path.
 */
 g2.prototype.l = function({ x, y }) { return this.addCommand({ c: 'l', a: arguments[0] }); },

/**
 * Create quadratic bezier curve segment to point.
 * @method
 * @returns {object} g2
 * @param {object} - quadratic curve arguments object.
 * @property {number} x1 - x coordinate of control point.
 * @property {number} y1 - y coordinate of control point.
 * @property {number} x - x coordinate of target point.
 * @property {number} y - y coordinate of target point.
 * @example
 * g2().p()                           // Begin path.
 *     .m({x:0,y:0})                  // Move to point.
 *     .q({x1:200,y1:200,x:400,y:0})  // Quadratic bezier curve segment.
 *     .stroke()                      // Stroke path.
 */
 g2.prototype.q = function({ x1, y1, x, y }) { return this.addCommand({ c: 'q', a: arguments[0] }); },

/**
 * Create cubic bezier curve to point.
 * @method
 * @returns {object} g2
 * @param {object} - cubic curve arguments object.
 * @property {number} x1 - x coordinate of first control point.
 * @property {number} y1 - y coordinate of first control point.
 * @property {number} x2 - x coordinate of second control point.
 * @property {number} y2 - y coordinate of second control point.
 * @property {number} x - x coordinate of target point.
 * @property {number} y - y coordinate of target point.
 * @example
 * g2().p()                        // Begin path.
 *     .m({x:0,y:100})             // Move to point.
 *     .c({x1:100,y1:200,x2:200,y2:0,x:400,y:100}) // Create cubic bezier curve.
 *     .stroke()                   // Stroke path.
 *     .exe(ctx);                  // Render to canvas context.
 */
 g2.prototype.c = function({ x1, y1, x2, y2, x, y }) { return this.addCommand({ c: 'c', a: arguments[0] }); },

/**
 * Draw arc with angular range to target point.
 * @method
 * @returns {object} g2
 * @param {object} - arc arguments object.
 * @property {number} dw - angular range in radians.
 * @property {number} x - x coordinate of target point.
 * @property {number} y - y coordinate of target point.
 * @example
 * g2().p()            // Begin path.
 *     .m({x:50,y:50})       // Move to point.
 *     .a({dw:2,x:300,y:100})   // Create arc segment.
 *     .stroke()       // Stroke path.
 *     .exe(ctx);      // Render to canvas context.
 */
 g2.prototype.a = function({ dw, x, y }) {
    const prvcmd = this.commands[this.commands.length - 1];
    g2.cpyProp(prvcmd.a, 'x', arguments[0], '_xp');
    g2.cpyProp(prvcmd.a, 'y', arguments[0], '_yp');
    return this.addCommand({ c: 'a', a: arguments[0] });
},

/**
 * Stroke the current path or path object.
 * @method
 * @returns {object} g2
 * @param {object} - stroke arguments object.
 * @property {string} [d = undefined] - SVG path definition string. Current path is ignored then.
 */
 g2.prototype.stroke = function({ d } = {}) { return this.addCommand({ c: 'stroke', a: arguments[0] }); },

/**
 * Fill the current path or path object.
 * @method
 * @returns {object} g2
 * @param {object} - fill arguments object.
 * @property {string} [d = undefined] - SVG path definition string. Current path is ignored then.
 */
 g2.prototype.fill = function({ d } = {}) { return this.addCommand({ c: 'fill', a: arguments[0] }); },

/**
 * Shortcut for stroke and fill the current path or path object.
 * In case of shadow style, only the path interior creates shadow, not also the path contour.
 * @method
 * @returns {object} g2
 * @param {object} - drw arguments object.
 * @property {string} [d = undefined] - SVG path definition string.  Current path is ignored then.
 */
 g2.prototype.drw = function({ d, lsh } = {}) { return this.addCommand({ c: 'drw', a: arguments[0] }); },

/**
 * Get index of command resolving 'callbk' to 'true' starting from end of the queue walking back.<br>
 * Similar to 'Array.prototype.findIndex', only working reverse.
 * @private
 */
 g2.cmdIdxBy = function (cmds, callbk) {
    for (let i = cmds.length - 1; i >= 0; i--)
        if (callbk(cmds[i], i, cmds))
            return i;
    return false;  // command with index '0' signals 'failing' ...
};

/**
 * Copy properties from neighbours, even as getters .. a useful part of the above ..
 * @private
 */
g2.cpyProp = function (from, fromKey, to, toKey, deflt=0) {
    const src = Object.getOwnPropertyDescriptor(from, fromKey) || { value: deflt, writable: true, enumerable: true, configurable: true };
    Object.defineProperty(to, toKey, src);
}

// predefined polyline/spline point iterators
g2.pntIterator = {
    "x,y": function (pts) {
        function pitr(i) { return { x: pts[2 * i], y: pts[2 * i + 1] }; };
        Object.defineProperty(pitr, 'len', { get: () => pts.length / 2, enumerable: true, configurable: true, writabel: false });
        return pitr;
    },
    "[x,y]": function (pts) {
        function pitr(i) { return pts[i] ? { x: pts[i][0], y: pts[i][1] } : undefined; };
        Object.defineProperty(pitr, 'len', { get: () => pts.length, enumerable: true, configurable: true, writabel: false });
        return pitr;
    },
    "{x,y}": function (pts) {
        function pitr(i) { return pts[i]; };
        Object.defineProperty(pitr, 'len', { get: () => pts.length, enumerable: true, configurable: true, writabel: false });
        return pitr;
    }
};
g2.pntItrOf = function (pts) {
    return !(pts && pts.length) ? undefined
        : typeof pts[0] === "number" ? g2.pntIterator["x,y"](pts)
            : Array.isArray(pts[0]) && pts[0].length >= 2 ? g2.pntIterator["[x,y]"](pts)
                : typeof pts[0] === "object" && "x" in pts[0] && "y" in pts[0] ? g2.pntIterator["{x,y}"](pts)
                    : undefined;
};
