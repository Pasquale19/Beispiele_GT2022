"use strict"
//console.log('g2ExtraSymbols.js loaded');
/**
 * @author Pascal Schnabel
 * @license MIT License
 * @requires g2.core.js
 * @requires g2.ext.js
 */
/**
 * Extended G2 SymbolStyle values.
 * @namespace
 * @property {object} symbol  `g2` symbol namespace.
 * @property {object} [symbol.poldot] Predefined symbol: a little tick
 * @property {string} [symbol.nodfill3=white]    node color.
 * @property {object} [symbol.poldot] Pole Symbol
 * @property {object} [symbol.Xcross] X-Symbol
 * @property {object} [symbol.gndlines] ground lines symbol
 */
g2.symbol = g2.symbol || {};
g2.symbol.poldot = g2().cir({ x: 0, y: 0, r: 1.32, ls: "transparent", fs: "black" });
g2.symbol.nodfill3 = "white";
g2.symbol.pol = g2().cir({ x: 0, y: 0, r: 6, lw: 1.5, fs: "white" }).use({ grp: 'poldot' });
g2.symbol.Xcross = g2().lin({ x1: 5, y1: 5, x2: -5, y2: -5 }).lin({ x1: 5, y1: -5, x2: -5, y2: 5 });
g2.symbol.gndlines = g2().lin({ x1: -10, y1: -5, x2: -5, y2: 0 })
    .lin({ x1: -5, y1: -5, x2: -0, y2: 0 })
    .lin({ x1: -0, y1: -5, x2: 5, y2: 0 })
    .lin({ x1: 5, y1: -5, x2: 10, y2: 0 });


/**
 * @property {object} [symbol.slider] Predefined symbol: slider
 */
g2.symbol.slider = function () {
    const sl = g2();
    const args = { b: 32, h: 16, fs: 'white', lw: 0.8, label: { str: 'default', loc: 'ne', off: '15' } };
    return g2()
        .rec({ x: -args.b / 2, y: -args.h / 2, b: args.b, h: args.h, fs: 'white' })
        .use({ grp: "pol" })
        .end();
}

