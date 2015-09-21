var Renderer = require('./Renderer.js'),
    fs = require('fs'),
    path = require('path'),
    _ = module.exports;

_.render = function(text, opts, callback) {
    if (arguments.length === 2) {
        callback = opts;
        opts = {};
    }

    opts = opts || {
        root: process.cwd()
    };

    (new Renderer()).render(text, opts, callback);
};
