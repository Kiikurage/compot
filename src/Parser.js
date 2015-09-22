var htmlparser = require("htmlparser2"),
    Node = require('./Node.js'),
    constance = require('./constance.js');

function Parser() {
    this.htmlparser = null;
    this.nodes = null;
    this.currentNode = null;
}

var Type = constance.Type,
    PREFIX_COMP = constance.PREFIX_COMP;

Parser.prototype._parseComment = function(comment) {
    var parts = comment.trim().split(/\s+/g);

    if (parts[0] !== PREFIX_COMP) {
        return {
            type: Type.COMMENT,
            comment: comment,
            parent: this.currentNode
        }
    }

    //@TODO support to escaped quote/double-quote.
    var regAttr = /^([^=]+)=(?:"([^"]+)"|'([^']+)'|([^'"]+))$/,
        node = {
            type: Type.COMPONENT,
            attrs: {},
            template: null,
        };

    parts.forEach(function(part) {
        var ma = part.match(regAttr);
        if (!ma) return;

        node.attrs[ma[1]] = ma[2] || ma[3] || ma[4];
    });

    return node
};

Parser.prototype.onOpenTag = function(name, attrs) {
    var node,
        name = name.toLowerCase();

    if (name === 'link' && attrs.rel === 'compot') {
        // handle <link rel="compot" href="...">
        node = new Node({
            type: Type.LINK,
            name: name,
            attrs: attrs,
        });
        this.root.links.push(node);

    } else if (name === 'template' && attrs.type === 'compot') {
        // handle <template type="compot" name="...">
        node = new Node({
            type: Type.TEMPLATE,
            name: attrs.name,
            attrs: attrs,
        });
        this.root.templates.push(node);

    } else if (name === 'template' && attrs.if) {
        // handle <template if="...">
        node = new Node({
            type: Type.IF,
            name: name,
            attrs: attrs,
        });

    } else if (name === 'content') {
        // handle <content>
        node = new Node({
            type: Type.CONTENT,
            name: name,
            attrs: attrs,
        });

    } else {
        // handle other elements
        node = new Node({
            type: Type.ELEMENT,
            name: name,
            attrs: attrs,
        });
    }

    this.currentNode.appendChild(node);
    this.currentNode = node;
};

Parser.prototype.onText = function(text) {
    if (text.trim() === '') return

    var node = new Node({
        type: Type.TEXT,
        name: 'text',
        text: text
    });

    this.currentNode.appendChild(node);
};

Parser.prototype.onCloseTag = function(name) {

    this.currentNode = this.currentNode.parent;
};

Parser.prototype.onEnd = function() {
    if (this.callback) {
        this.callback(null, this.root);
    }
};

Parser.prototype.parse = function(text, callback) {
    this.init(callback);
    this.htmlparser.write(text)
    this.htmlparser.end();
};

Parser.prototype.init = function(callback) {
    this.htmlparser = new htmlparser.Parser({
        onopentag: this.onOpenTag.bind(this),
        ontext: this.onText.bind(this),
        onclosetag: this.onCloseTag.bind(this),
        onend: this.onEnd.bind(this),
    }, {
        decodeEntities: true
    });

    this.root = new Node({
        name: 'root',
        type: Type.ROOT,
    });
    this.root.templates = [];
    this.root.links = [];

    this.currentNode = this.root;
    this.callback = callback;
};

module.exports = Parser;
