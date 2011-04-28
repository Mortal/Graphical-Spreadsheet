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
	console.log(orderOfCalculation());
	self.elValue.textContent = self.contents;
};
Cell.prototype.findDependencies = function () {
	var self = this;
	if (self.contents.charAt(0) != '=') {
		self.dependencies = [];
		return;
	}
	var chars = self.contents.match(/[a-z]/g);
	var deps = [];
	for (var i = 0, l = chars.length; i < l; ++i) {
		var idx = chars[i].charCodeAt(0) - "a".charCodeAt(0);
		//console.log(idx);
		deps.push(cells[idx]);
	}
	self.dependencies = deps;
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
			++depvertex.invalue;
			vertices[i].edges.push(depvertex);
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
