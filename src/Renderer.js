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
            buffer += this.writeText(node);
            break;

        case Type.LINK:
            buffer = ''; //link[type="compot"] is not output.
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
            console.log('unhandled node type: %s', node.type);
    }

    return buffer;
};

Renderer.prototype.writeText = function(node) {
    return node.text
};

Renderer.prototype.writeChildren = function(node) {
    return node.children.map(function(child) {
        return this.write(child);
    }, this).join('');
};

Renderer.prototype.writeComponent = function(node) {
    var template = this.getTemplate(node.name);
    if (!template) return this.writeElement(node)

    //import distributed node from template
    var clone = this.distributeNode(template.children[0], node.attrs);

    //copy attributes
    if (clone.attrs.class && node.attrs.class) {
        node.attrs.class = clone.attrs.class + ' ' + node.attrs.class;
    }
    Object.keys(node.attrs).forEach(function(key) {
        //resolve attribute placeholders
        clone.attrs[key] = node.attrs[key];
    }, this);

    //import original nodes
    this.importOriginalNodes(node, clone);

    //write
    var buffer = this.writeElement(clone);

    return buffer

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
        if (node.attrs[key] === '') {
            return key
        } else {
            return key + '="' + node.attrs[key] + '"'
        }
    }, this).join(' ');
};

Renderer.prototype.resolvePlaceholder = function(placeholder, datas) {
    var placeholder = placeholder.trim(),
        ma = placeholder.match(/^\{\{([^\}]+)\}\}$/);

    if (ma && (ma[1] in datas)) {
        return datas[ma[1]]
    } else {
        return placeholder
    }
};

Renderer.prototype.importOriginalNodes = function(from, to) {
    var contents = to.find('content');

    //original nodes
    var originalNodes = from.children.map(function(child) {
        return this.distributeNode(child, from.attrs)
    }, this);

    //@TODO support "select" attribute of <content>
    var content = contents[0];
    if (content) {
        originalNodes.forEach(function(dist) {
            content.appendChild(dist);
        });
    }
};

Renderer.prototype.distributeNode = function(src, datas) {
    var dist = src.clone(false);

    //resolve placeholders in attributes
    Object.keys(dist.attrs).forEach(function(key) {
        dist.attrs[key] = this.resolvePlaceholder(dist.attrs[key], datas);
    }, this);

    if (dist.type === Type.TEXT) {
        dist.text = this.resolvePlaceholder(dist.text, datas);
    }

    //distribute child nodes
    src.children.forEach(function(child) {
        dist.appendChild(this.distributeNode(child, datas));
    }, this);

    return dist
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
        return this.pLoadLink(link, opts)
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
                    .then(resolve, reject)
            });
        });
    })
};

module.exports = Renderer;
