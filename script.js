var cells = [];
function addcell() {
	new Cell();
}
function Cell() {
	var self = this;
	var idx = self.idx = cells.length;
	cells.push(self);
	var ch = self.label = String.fromCharCode(idx + "a".charCodeAt(0));
	var cell = self.el = document.createElement('div');

	self.dependencies = [];

	cell.className = 'cell';
	cell.onclick = function () {
		self.setContents(prompt('New contents of '+self.label, self.contents));
	};
	cell.style.left = Math.random()*500+'px';
	cell.style.top = Math.random()*500+'px';

	var label = self.elLabel = document.createElement('label');
	label.appendChild(document.createTextNode(ch));
	cell.appendChild(label);

	var value = self.elValue = document.createElement('span');
	cell.appendChild(value);

	self.setContents('0');

	document.body.appendChild(cell);
}
Cell.prototype.setContents = function (conts) {
	var self = this;
	self.contents = conts;
	self.findDependencies();
	self.taint();
	cells.recalculate();
};
Cell.prototype.setValue = function (val) {
	var self = this;
	self.value = val;
	self.elValue.textContent = val;
	self.elValue.title = '';
};
Cell.prototype.setError = function (e) {
	var self = this;
	self.setValue('#ERROR');
	self.elValue.title = e;
};
cells.recalculate = function () {
	var self = cells;
	var order = orderOfCalculation();
	for (var i = 0, l = order.length; i < l; ++i) {
		var cell = self[order[i]];
		console.log(cell);
		if (cell.tainted) {
			cell.recalculate();
			cell.tainted = false;
		}
	}
};
Cell.prototype.recalculate = function () {
	var self = this;
	if (self.contents.charAt(0) != '=') {
		self.setValue(self.contents);
		return;
	}
	var exp = self.contents.substring(1, self.contents.length);
	var vars = [];
	for (var i = 0, l = self.dependencies.length; i < l; ++i) {
		var dep = self.dependencies[i];
		var prefix = i ? ', ' : 'var ';
		vars.push(prefix, dep.label, ' = ', dep.stringify());
	}
	vars.push(';', exp);
	console.log(vars.join(''));
	var result;
	try {
		result = eval(vars.join(''));
	} catch (e) {
		self.setError(e);
		return;
	}
	var resultnum = parseInt(result, 10);
	console.log(result,resultnum);
	if (resultnum || resultnum === 0) {
		result = resultnum;
	}
	self.setValue(result);
};
Cell.prototype.stringify = function () {
	var self = this;
	if ('number' == typeof self.value)
		return self.value;
	return JSON.stringify(self.value);
};
Cell.prototype.taint = function () {
	var self = this;
	if (self.tainted) return;
	self.tainted = true;
	for (var dep in self.reverseDependencies) {
		self.reverseDependencies[dep].taint();
	}
};
cells.get = function (label) {
	var self = cells;
	if (label.length != 1) return null;
	var idx = label.charCodeAt(0) - "a".charCodeAt(0);
	if (idx < 0 || idx > self.length) return null;
	return self[idx];
};
Cell.prototype.clearDependencies = function () {
	var self = this;
	if (!self.dependencies) return;
	for (var i = 0, l = self.dependencies.length; i < l; ++i) {
		var dep = self.dependencies[i];
		dep.determines(self, false);
	}
	self.dependencies = [];
};
// a.determines(b, true (false)) means that when a is recalculated,
// b should (shouldn't) be recalculated
Cell.prototype.determines = function (other, b) {
	var self = this;
	if (!self.reverseDependencies) self.reverseDependencies = {};
	if (b) {
		self.reverseDependencies[other.label] = other;
	} else {
		delete self.reverseDependencies[other.label];
	}
};
Cell.prototype.findDependencies = function () {
	var self = this;
	self.clearDependencies();
	if (self.contents.charAt(0) != '=') {
		return;
	}
	var chars = self.contents.match(/[a-z]/g) || [];
	var deps = self.dependencies;
	for (var i = 0, l = chars.length; i < l; ++i) {
		var dep = cells.get(chars[i]);
		if (dep) {
			dep.determines(self, true);
			deps.push(dep);
		}
	}
	self.drawArrows();
};
Cell.prototype.drawArrows = function () {
	// TODO draw arrow from self.el to each of self.dependencies
};
function orderOfCalculation() {
	var vertices = [];
	var cell, dep;
	for (var i = 0, l = cells.length; i < l; ++i) {
		cell = cells[i];
		vertices.push({
			edges: [],
			col: 0, // 0: white, 1: gray, 2: black
			invalue: 0,
			removed: false
		});
	}
	for (i = 0; i < l; ++i) {
		cell = cells[i];
		for (var j = 0, k = cell.dependencies.length; j < k; ++j) {
			dep = cell.dependencies[j];
			//console.log(cell.dependencies);
			var depvertex = vertices[dep.idx];
			++vertices[i].invalue;
			depvertex.edges.push(vertices[i]);
		}
	}
	var result = [];
	while (result.length < vertices.length) {
		var vertex;
		for (i = 0; i < l; ++i) {
			vertex = vertices[i];
			if (vertex.removed) continue;
			if (vertex.invalue === 0) break;
		}
		if (i == l) throw "Circular dependency";
		vertex.removed = true;
		result.push(i);
		for (j = 0, k = vertex.edges.length; j < k; ++j) {
			--vertex.edges[j].invalue;
		}
	}
	return result;
}
