var htmlparser = require("htmlparser2"),
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
    var node = {
        type: Type.ELEMENT,
        name: name,
        attrs: attrs,
        children: [],
        parent: this.currentNode
    };

    this.currentNode.children.push(node);
    this.currentNode = node;
};

Parser.prototype.onText = function(text) {
    var node = {
        type: Type.TEXT,
        text: text,
        parent: this.currentNode
    };

    this.currentNode.children.push(node);
};

Parser.prototype.onComment = function(comment) {
    var node = this._parseComment(comment);

    switch(node.type) {
        case Type.COMMENT:
            this.currentNode.children.push(node);
            break

        case Type.COMPONENT:
            this.root.components.push(node);
            break
    }
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
        oncomment: this.onComment.bind(this),
        onclosetag: this.onCloseTag.bind(this),
        onend: this.onEnd.bind(this),
    }, {
        decodeEntities: true
    });

    this.root = {
        type: Type.ROOT,
        children: [],
        components: [],
        parent: null
    };

    this.currentNode = this.root;
    this.callback = callback;
};

module.exports = Parser;
