var Renderer = require('./Renderer.js'),
    fs = require('fs'),
    path = require('path'),
    _ = module.exports;

function extend(dest, src){
    Object.keys(src).forEach(function(key){
        dest[key] = src[key]
    });
    return dest
}

_.render = function(text, opts, callback) {
    if (arguments.length === 2) {
        callback = opts;
        opts = {};
    }

    opts = extend({
        root: process.cwd()
    }, opts);

    (new Renderer()).render(text, opts, callback);
};
