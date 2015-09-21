var Parser = require('./Parser.js'),
    fs = require('fs'),
    path = require('path'),
    constance = require('./constance.js'),
    Promise = global.Promise || require('es6-promise');

var Type = constance.Type;

function Renderer() {
    this.root = '';
    this.parser = null;
    this.callback = null;
    this.components = null;
    this.componentNames = null;
    this.contentStack = null;
}

Renderer.prototype.render = function(text, opts, callback) {
    this.root = opts.root || process.cwd();
    this.parser = new Parser();
    this.callback = callback;
    this.components = [];
    this.componentNames = [];
    this.contentStack = [];

    this.parser.parse(text, this.onParseEnd.bind(this));
};

Renderer.prototype.onParseEnd = function(err, res) {
    if (err) return this.callback(err, null)

    var self = this;

    this.pRegisterComponents(res, {
            root: this.root
        })
        .then(function() {
            self.callback(null, self.write(res));
        })
        .catch(function(err) {
            self.callback(err, null);
        });
};

Renderer.prototype.write = function(node) {
    var buffer = '',
        self = this;

    switch (node.type) {
        case Type.ROOT:
            buffer += this.writeChildren(node);
            break;

        case Type.TEXT:
            buffer += node.text.trim();
            break;

        case Type.ELEMENT:
            if (this.isComponent(node)) {
                buffer += this.writeComponent(node);

            } else if (node.name === 'content') {
                buffer += this.writeContent(node);

            } else {
                buffer += this.writeElement(node);
            }
            break;

        default:
            console.warn('unhandled node type: %s', node.type);
    }

    return buffer;
};

Renderer.prototype.writeChildren = function(node) {
    return node.children.map(function(child) {
        return this.write(child);
    }, this).join('');
};

Renderer.prototype.writeComponent = function(node) {
    var template = this.getTemplate(node),
        buffer;

    this.contentStack.unshift(node);
    buffer = this.write(template);
    this.contentStack.shift();

    return buffer
};

Renderer.prototype.writeElement = function(node) {
    var buffer = '';

    buffer += '<' + node.name;

    if (Object.keys(node.attrs).length) {
        buffer += ' ' + Object.keys(node.attrs).map(function(key) {
            return key + '="' + node.attrs[key] + '"'
        }).join(' ');
    }

    buffer += '>';

    buffer += this.writeChildren(node);

    //@TODO support for no-close-tag element
    buffer += '</' + node.name + '>';

    return buffer
};

Renderer.prototype.writeContent = function(node) {
    return this.writeChildren(this.contentStack[0]);
};

//------------------------------------------------------------------------------
// Component

Renderer.prototype.pRegisterComponents = function(rootNode, opts) {
    var promises = [],
        components = rootNode.components

    components.forEach(function(component) {
        if (this.isComponent(component.attrs.name)) {
            //handle loading component more than once
            return
        }

        this.components.push(component);
        this.componentNames.push(component.attrs.name);
        promises.push(this.pLoadComponent(component, opts));
    }, this);

    return Promise.all(promises)
};

Renderer.prototype.isComponent = function(node) {
    return (this.componentNames.indexOf(node.name) !== -1)
};

Renderer.prototype.getTemplate = function(node) {
    var index = this.componentNames.indexOf(node.name);

    if (index === -1) return null

    return this.components[index].template
};

Renderer.prototype.pLoadComponent = function(component, opts) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var filePath = path.resolve(opts.root, component.attrs.src);

        fs.readFile(filePath, 'utf-8', function(err, res) {
            if (err) return reject(err);

            new Parser().parse(res, function(err, res) {
                if (err) return reject(err);

                component.template = res;

                var ps = self.pRegisterComponents(res, {
                    root: path.dirname(filePath)
                });

                resolve(ps);
            });
        });
    })
};

module.exports = Renderer;
