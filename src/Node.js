var constance = require('./constance.js');

function extend(dest, src) {
    Array.prototype.slice.call(arguments, 0)
        .forEach(function(src) {
            if (!src) return

            Object.keys(src).forEach(function(key) {
                dest[key] = src[key]
            });
        })

    return dest
}

function Node(params) {
    this.type = params.type || constance.Type.ELEMENT;
    this.name = params.name.toLowerCase();
    this.attrs = extend({}, params.attrs);
    this.children = [];
    this.text = params.text || '';
    this.parent = null;
};

Node.prototype.clone = function(isDeep){
    var newNode = new Node(this);

    if (!isDeep) return newNode

    this.children.forEach(function(child, i){
        newNode.appendChild(child.clone(true));
    });
    return newNode
};

Node.prototype.appendChild = function(child) {
    if (child.parent) {
        child.parent.removeChild(this);
    }

    this.children.push(child);
    child.parent = this;
};

Node.prototype.removeChild = function(child) {
    if (!child.parent) return

    var i = this.children.indexOf(child);
    if (i === -1) return

    this.children.splice(i, 1);
    child.parent = null;
};

Node.prototype.find = function(name) {
    var res = [];

    this.children.forEach(function(child){
        if (child.name === name) {
            res.push(child);
        }

        res = res.concat(child.find(name));
    });

    return res
};

module.exports = Node;
