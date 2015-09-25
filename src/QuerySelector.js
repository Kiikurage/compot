var token = '[a-zA-Z0-9_\\-$%]+',
	universal = '(\\*)',
	tagName = '(' + token + ')',
	id = '#(' + token + ')',
	className = '\\.(' + token + ')',
	attr = '\\[' + '(' + token + ')' + '(?:=(?:\"([^\"]+)\"|\'([^\']+)\'|([^\'\"]+)))?' + '\\]',
	child = '(\\s+)',
	any = [universal, tagName, id, className, attr, child].join('|'),
	regSelector = new RegExp(any, 'g');

function test(node, query) {
	var queryParts = query.split(','),
		i, part;

	for (i = 0; i < queryParts.length; i++) {
		part = queryParts[i].trim();
		if (!part) continue
		if (testSingle(node, part)) return true
	}

	return false
};

function testSingle(node, query) {
	var from = 0,
		ma, classList;

	regSelector.lastIndex = 0;
	while (ma = regSelector.exec(query)) {
		if (ma.index !== from) {
			throw new Error('Invalid Selector: ' + query + ' (' + from + ')');
			return false
		}
		from = regSelector.lastIndex;

		if (ma[1]) {
			//universal selector

		} else if (ma[2]) {
			//tag name selector
			// console.log(node.name, ma[2]);
			if (node.name !== ma[2]) return false

		} else if (ma[3]) {
			//ID selector
			// console.log(node.attrs.id, ma[3]);
			if (node.attrs.id !== ma[3]) return false

		} else if (ma[4]) {
			//class selector
			// console.log(node.attrs.class, ma[4]);
			classList = node.attrs.class.split(/\s+/g);
			if (classList.indexOf(ma[4]) === -1) return false

		} else if (ma[5]) {
			//attribute selector
			var key = ma[5],
				value = ma[6] || ma[7] || ma[8];

			// console.log(node.attrs[key], value);
			if (value === void 0) {
				if (!(key in node.attrs)) return false
			} else {
				if (node.attrs[key] !== value) return false
			}

		} else if (ma[9]) {
			//child selector
			throw new Error('Child selector is not supported: ' + query + ' (' + from + ')');
			return false

		} else {
			//unknown selector
			throw new Error('Unknown Selector: ' + query + ' (' + from + ')');
			return false
		}
	}

	return true
}

module.exports = {
	test: test
};
