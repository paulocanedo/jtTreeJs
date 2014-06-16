var JusTo    = JusTo    || {};
    JusTo.ui = JusTo.ui || {};

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

    this.events.init();
};

/**
 * TODO move this method to bind only with root node. With this implementation
 *      it is allowed only one tree instance per document
 */
JusTo.ui.Node.prototype.events = (function() {
    return {
        initialized: false,
        init: function() {
            if (this.initialized)
                return;

            //TODO this function bind needs to be placed outside event scope
            JusTo.ui.Node.canSelect = JusTo.ui.NodeFilter.any;

            this.initOpenState();
            this.initNodeTypeChanged();
            this.initContentClicked();

            this.initialized = true;
        },
        initOpenState: function() {
            this.openStateChanged.push(function(node) {
                var iconDom = node._getIconDom();
                iconDom.className = "icon";
                iconDom.className += node.childrenVisible ? " folder-opened" : " folder-closed";
            });
        },
        initNodeTypeChanged: function() {
            this.nodeTypeChanged.push(function(node) {
                node._nodeOpenChanged(node);
            });
        },
        initContentClicked: function() {
            this.contentClicked.push(function(evt, node) {
                if (!JusTo.ui.Node.canSelect(node))
                    return;

                node.setSelected(!node.selected);
                node._nodeSelectionChanged(node);
            });
        },
        openStateChanged: [], //occurs when node toggle his children visibility
        nodeTypeChanged: [], //occurs when node change from leaf to non-leaf
        selectionChanged: [], //occurs when the node was (de)selected
        contentClicked: []  //occurs when the user click at content span
    };
})();

JusTo.ui.Node.prototype._getIconDom = function() {
    var element = this.outterDom;
    var i;

    for (i = 0; i < element.childElementCount; i++) {
        if (element.children[i].className.indexOf("icon") >= 0)
            return element.children[i];
    }
};

JusTo.ui.Node.prototype._getContent = function() {
    var element = this.outterDom;
    var i;

    for (i = 0; i < element.childElementCount; i++) {
        if (element.children[i].className.indexOf("content") >= 0)
            return element.children[i];
    }
};

JusTo.ui.Node.prototype.find = function(nodeId) {
    var result = null;
    this.iterate(function(node, depth) {
        if (node.id === nodeId)
            result = node; //TODO avoid full iterate
    });
    return result;
};

JusTo.ui.Node.prototype.isRoot = function() {
    return this.id === -1;
};

JusTo.ui.Node.prototype.setSelected = function(flag) {
    var content = this._getContent();
    this.selected = flag;

    content.className = "content";
    content.className += this.selected ? " selected" : "";
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

JusTo.ui.Node.prototype.isLeaf = function() {
    return !this.hasChildren() && node.urlSubItems === undefined;
};

JusTo.ui.Node.prototype.push = function(node) {
    this.insertNode(node);

    this.children.push(node);
    node.parent = this;
};

JusTo.ui.Node.prototype.insertNode = function(node) {
    var parentElement = this.outterDom;
    if (!this.isRoot()) {
        if (!this.hasChildren()) {
            this.childDom = document.createElement("ul");
            parentElement.appendChild(this.childDom);
            this._nodeTypeChanged(this);
        }

        parentElement = this.childDom;
        this.outterDom.firstChild.className = "expander expanded";
        this.outterDom.firstChild.style.display = '';
    }
    parentElement.appendChild(node.outterDom);
};

JusTo.ui.Node.prototype.newListItem = function(node) {
    if (this.isRoot()) {
        var element = document.createElement("ul");
        element.className = "justo-root-list";
        return element;
    }

    var listItem = document.createElement("li");
    var expander = this.createExpanderElement(node);
    var icon = this.createIconElement(node);
    var content = this.createContentElement(node);

    listItem.appendChild(expander);
    listItem.appendChild(icon);
    listItem.appendChild(content);

    return listItem;
};

JusTo.ui.Node.prototype.createExpanderElement = function(node) {
    var expander = document.createElement('span');
    var objThis = this;
    expander.className = 'expander';
    expander.style.display = 'none';

    if (this.urlSubItems !== undefined) {
        expander.className += ' collapsed';
        expander.style.display = '';
    }

    expander.addEventListener("click", function(evt) {
        if (objThis.urlSubItems !== undefined && objThis.loaded !== true) {
            objThis.asyncOpen(objThis);
        } else {
            node.setChildrenVisible(!node.childrenVisible);
            expander.className = 'expander';
            expander.className += node.childrenVisible ? ' expanded' : ' collapsed';

            objThis._nodeOpenChanged(node);
        }
    });
    return expander;
};

JusTo.ui.Node.prototype.createIconElement = function(node) {
    var icon = document.createElement('span');
    icon.className = 'icon document';

    if (node.urlSubItems !== undefined) {
        icon.className = 'icon folder-closed';
    }

    return icon;
};

JusTo.ui.Node.prototype.asyncOpen = function(node) {
    var request = new XMLHttpRequest();
    var objThis = this;
    var icon = node._getIconDom();
    icon.className = "icon loading";

    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            node.loaded = true;
            var result = JSON.parse(request.responseText).result;
            result.forEach(function(entry) {
                var newNode = new JusTo.ui.Node(entry.value, entry.id, entry.urlSubItems);
                node.push(newNode);
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
        objThis._contentClicked(evt, node);
        evt.stopPropagation();
    });

    // content.addEventListener("mouseover", function(evt) {
    //     content.className = 'content background-hover';
        
    //     objThis.iterate(function(node, depth) {
    //         var childContent = node._getContent();
    //         childContent.className = 'content background-hover';
    //         if(node.selected) childContent.className += ' selected';
    //     });
    // });

    // content.addEventListener("mouseout", function(evt) {
    //     content.className = 'content';
        
    //     objThis.iterate(function(node, depth) {
    //         var childContent = node._getContent();
    //         childContent.className = 'content';
    //         if(node.selected) childContent.className += ' selected';
    //     });
    // });

    return content;
};

JusTo.ui.Node.prototype.selectAll = function(flag) {
    if (flag === undefined)
        flag = true;

    this.iterate(function(node, depth) {
        node.setSelected(flag);
    });
};

JusTo.ui.Node.prototype.iterate = function(fnCallback, fnFilter) {
    this._iterate(fnCallback, fnFilter, 0);
};

JusTo.ui.Node.prototype._iterate = function(fnCallback, fnFilter, depth) {
    ++depth;
    this.children.forEach(function(node) {
        if (!fnFilter || (fnFilter(node))) {
            fnCallback(node, depth);
        }
        node._iterate(fnCallback, fnFilter, depth);
    });
};

JusTo.ui.Node.prototype._nodeOpenChanged = function(node) {
    this.events.openStateChanged.forEach(function(entryFunction) {
        entryFunction(node);
    });
};

JusTo.ui.Node.prototype._nodeTypeChanged = function(node) {
    this.events.nodeTypeChanged.forEach(function(entryFunction) {
        entryFunction(node);
    });
};

JusTo.ui.Node.prototype._contentClicked = function(evt, node) {
    this.events.contentClicked.forEach(function(entryFunction) {
        entryFunction(evt, node);
    });
};

JusTo.ui.Node.prototype._nodeSelectionChanged = function(node) {
    this.events.selectionChanged.forEach(function(entryFunction) {
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

JusTo.ui.NodeFilter.leaf = function(node) {
    return node.isLeaf();
};

JusTo.ui.NodeFilter.any = function(node) {
    return true;
};

JusTo.ui.NodeFilter.children = function(node) {
    var selected = node.selected;
    node.selectAll(!selected);

    return true;
};