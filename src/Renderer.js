var Parser = require('./Parser.js'),
    fs = require('fs'),
    path = require('path'),
    constance = require('./constance.js'),
    Promise = global.Promise || require('es6-promise');

var Type = constance.Type;

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

function Renderer() {
    this.root = '';
    this.parser = null;
    this.callback = null;
    this.templates = null;
    this.loadedPath = null;
}

Renderer.prototype.render = function(text, opts, callback) {
    this.root = opts.root || process.cwd();
    this.parser = new Parser();
    this.callback = callback;
    this.templates = [];
    this.loadedPath = {};

    this.parser.parse(text, this.onParseEnd.bind(this));
};

Renderer.prototype.onParseEnd = function(err, rootNode) {
    if (err) return this.callback(err, null)

    var self = this;

    this.pResolveTemplateAndLink(rootNode, {
            root: this.root
        })
        .then(function() {
            self.callback(null, self.write(rootNode));
        })
        .catch(function(err) {
            self.callback(err, null);
        })
};

Renderer.prototype.pResolveTemplateAndLink = function(rootNode, opt) {
    this.registerTemplates(rootNode);
    return this.pLoadLinks(rootNode, opt)
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

        case Type.LINK:
            buffer = '';    //link[type="compot"] is not output.
            break;

        case Type.ELEMENT:
            if (this.templates[node.name]) {
                buffer += this.writeComponent(node);

            } else {
                buffer += this.writeElement(node);
            }
            break;

        case Type.CONTENT:
            buffer += this.writeChildren(node);
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
    var template = this.getTemplate(node.name);
    if (!template) return this.writeElement(node)

    //clone from template
    var clone = template.clone(true).children[0];

    //copy attributes
    if (clone.attrs.class && node.attrs.class) {
        node.attrs.class = clone.attrs.class + ' ' + node.attrs.class;
    }
    extend(clone.attrs, node.attrs);

    var contents = clone.find('content'),
        content = contents[0];

    if (content) {
        node.children.forEach(function(child){
            content.appendChild(child);
        });
    }

    return this.writeElement(clone);
};

Renderer.prototype.writeElement = function(node) {
    var buffer = '';

    buffer += '<' + node.name;

    if (Object.keys(node.attrs).length) {
        buffer += ' ' + this.writeAttrs(node);
    }

    buffer += '>';

    buffer += this.writeChildren(node);

    //@TODO support for no-close-tag element
    buffer += '</' + node.name + '>';

    return buffer
};

Renderer.prototype.writeAttrs = function(node) {
    return Object.keys(node.attrs).map(function(key) {
        return key + '="' + node.attrs[key] + '"'
    }).join(' ');
};

Renderer.prototype.writeContent = function(node) {
    //@TODO
    return ''
};

//------------------------------------------------------------------------------
// Templates

Renderer.prototype.registerTemplates = function(rootNode) {
    var templates = rootNode.templates

    templates.forEach(function(template) {
        if (this.templates[template.name]) {
            //handle loading component more than once
            return
        }

        this.templates[template.name] = template;
    }, this);
};

Renderer.prototype.getTemplate = function(name) {
    return this.templates[name]
};

Renderer.prototype.pLoadLinks = function(rootNode, opts) {
    var ps = rootNode.links.map(function(link) {
        return this.pLoadLink(link, opts);
    }, this);

    return Promise.all(ps)
};

Renderer.prototype.pLoadLink = function(link, opts) {
    var self = this;

    return new Promise(function(resolve, reject) {
        var filePath = path.resolve(opts.root, link.attrs.href);

        if (self.loadedPath[filePath]) return resolve();

        fs.readFile(filePath, 'utf-8', function(err, res) {
            if (err) return reject(err);

            new Parser().parse(res, function(err, rootNode) {
                if (err) return reject(err);

                self.loadedPath[filePath] = true;

                return self
                    .pResolveTemplateAndLink(rootNode, {
                        root: path.dirname(filePath)
                    })
                    .then(resolve)
            });
        });
    })
};

module.exports = Renderer;
