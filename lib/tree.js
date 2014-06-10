var JusTo               = JusTo               || {};
    JusTo.ui            = JusTo.ui            || {};
//-------------------------------------------------------------------------------
// Tree
//-------------------------------------------------------------------------------
JusTo.ui.Tree = function() {
	this.rootNode = new JusTo.ui.Node("root", -1);
};

JusTo.ui.Tree.prototype.push = function(node) {
	this.rootNode.push(node);
};

JusTo.ui.Tree.prototype.iterate = function(fnCallback, fnFilter) {
	this.rootNode.iterate(fnCallback, fnFilter);
};

JusTo.ui.Tree.prototype.open = function(nodeId) {
	var node = this.find(nodeId);
	//TODO not implemented yet
};

JusTo.ui.Tree.prototype.find = function(nodeId) {
	var result = null;
	this.iterate(function(node, depth) {
		if(node.id == nodeId) result = node; //TODO avoid full iterate
	});
	return result;
};

JusTo.ui.Tree.prototype.toDom = function() {
	return this.rootNode.outterDom;
};

JusTo.ui.Tree.prototype.putClickEvent = function(fnEvent) {
	this.iterate(function(node, depth) {
		node.contentClickedEvts.push(fnEvent);
	});
};

//-------------------------------------------------------------------------------
// Node
//-------------------------------------------------------------------------------
JusTo.ui.Node = function(value, id, urlSubItems) {
	this.parent = null;
	this.children = [];
	this.childDom = null;
	this.value = value || "";
	this.id = id;
	this.selected = false;
	this.visible = true;
	this.childrenVisible = true;
	this.urlSubItems = urlSubItems;

	this.outterDom = this.newListItem(this);

	this.openStateChangedEvts = [];
	this.nodeTypeChangedEvts = [];
	this.contentClickedEvts = [];

	this.init();
};

JusTo.ui.Node.prototype.init = function() {
	var objThis = this;
	this.openStateChangedEvts.push(function(node) {
		objThis._nodeTypeChanged(node);
	});

	this.nodeTypeChangedEvts.push(function(node) {
		var iconDom = objThis._getIconDom();
		iconDom.className  = "icon";
		iconDom.className += node.childrenVisible ? " folder-opened" : " folder-closed";
	});
};

JusTo.ui.Node.prototype._getIconDom = function() {
	var element = this.outterDom;
	var i;

	for(i=0; i<element.childElementCount; i++) {	
		if(element.children[i].className.indexOf("icon") >= 0) return element.children[i];
	}
};

JusTo.ui.Node.prototype.isRoot = function() {
	return this.id === -1;
};

JusTo.ui.Node.prototype.setChildrenVisible = function(flag) {
	this.children.forEach(function(entry) {
		entry.outterDom.style.display = flag ? '' : 'none';
		entry.visible = flag;
	});
	this.childrenVisible = flag;
};

JusTo.ui.Node.prototype.isOpened = function() {
	return this.childrenVisible;
};

JusTo.ui.Node.prototype.hasChildren = function() {
	return this.children.length > 0;
};

JusTo.ui.Node.prototype.push = function(node) {
	this.insertNode(node);

	this.children.push(node);
	node.parent = this;
};

JusTo.ui.Node.prototype.insertNode = function(node) {
	var parentElement = this.outterDom;
	if(!this.isRoot()) {
		if(!this.hasChildren()) {
			this.childDom = document.createElement("ul");
			parentElement.appendChild(this.childDom);
			this._nodeTypeChanged(this);
		}

		parentElement = this.childDom;
		this.outterDom.firstChild.className = "expander expanded";
		this.outterDom.firstChild.style.display  = '';
	}
	parentElement.appendChild(node.outterDom);
};

JusTo.ui.Node.prototype.newListItem = function(node) {
	if(this.isRoot()) {
		var element = document.createElement("ul");
		element.className = "justo-root-list";
		return element;
	}

	var listItem = document.createElement("li");
	var expander = this.createExpanderElement(node);
	var icon     = this.createIconElement(node);
	var content  = this.createContentElement(node);

	listItem.appendChild(expander);
	listItem.appendChild(icon);
	listItem.appendChild(content);

	return listItem;
};

JusTo.ui.Node.prototype.createExpanderElement = function(node) {
	var expander = document.createElement('span');
	var objThis = this;
	expander.className  = 'expander';
	expander.style.display  = 'none';

	if(this.urlSubItems !== undefined) {
		expander.className  += ' collapsed';
		expander.style.display  = '';
	}

	expander.addEventListener("click", function(evt) {
		if(objThis.urlSubItems !== undefined && objThis.loaded !== true) {
	        objThis.asyncOpen(objThis);
		} else {
			node.setChildrenVisible(!node.childrenVisible);
			expander.className  = 'expander';
			expander.className += node.childrenVisible ? ' expanded' : ' collapsed';

			objThis._nodeOpenChanged(node);
		}
	});
	return expander;
};

JusTo.ui.Node.prototype.createIconElement = function(node) {
	var icon = document.createElement('span');
	icon.className = 'icon document';

	if(node.urlSubItems !== undefined) {
		icon.className  = 'icon folder-closed';
	}
	
	return icon;
};

JusTo.ui.Node.prototype.asyncOpen = function(node) {
	var request = new XMLHttpRequest();
	var objThis = this;
	var icon = node._getIconDom();
	icon.className = "icon loading";

    request.onreadystatechange = function() {
        if(request.readyState == 4 && request.status == 200) {
            node.loaded = true;
            var result = JSON.parse(request.responseText).result;
            result.forEach(function(entry) {
                var newNode = new JusTo.ui.Node(entry.value, entry.id, entry.urlSubItems);
                node.push(newNode);


                var evts = node.parent.contentClickedEvts;
                evts.forEach(function(_e) {
                	node.contentClickedEvts.push(_e);
                });
            });
            objThis._nodeOpenChanged(node);
        }
    };
    request.open("GET", node.urlSubItems, true);
    request.send();
};

JusTo.ui.Node.prototype.createContentElement = function(node) {
	var content = document.createElement('span');
	var objThis = this;
	content.innerHTML = node.value;
	content.className = 'content';

	content.addEventListener("click", function(evt) {
		node.selected = !node.selected;

		content.className = "content";
		content.className += node.selected ? " selected" : "";
		evt.stopPropagation();
		objThis._contentClicked(node);
	});

	return content;
};

JusTo.ui.Node.prototype.iterate = function(fnCallback, fnFilter) {
	this._iterate(fnCallback, fnFilter, 0);
};

JusTo.ui.Node.prototype._iterate = function(fnCallback, fnFilter, depth) {
	++depth;
	this.children.forEach(function(node) {
		if(!fnFilter || (fnFilter(node))) {
			fnCallback(node, depth);
		}
		node._iterate(fnCallback, fnFilter, depth);
	});
};

JusTo.ui.Node.prototype._nodeOpenChanged = function(node) {
	this.openStateChangedEvts.forEach(function(entryFunction) {
		entryFunction(node);
	});
};

JusTo.ui.Node.prototype._nodeTypeChanged = function(node) {
	this.nodeTypeChangedEvts.forEach(function(entryFunction) {
		entryFunction(node);
	});
};
JusTo.ui.Node.prototype._contentClicked = function(node) {
	this.contentClickedEvts.forEach(function(entryFunction) {
		entryFunction(node);
	});
};

JusTo.ui.NodeFilter = function() { };

JusTo.ui.NodeFilter.selected = function(node) {
	return node.selected;
};

JusTo.ui.NodeFilter.unselected = function(node) {
	return !node.selected;
};