/** @namespace */
var JusTo    = JusTo    || {};

/** @namespace */
    JusTo.ui = JusTo.ui || {};

/**
 * Creates an instance of Node.
 *
 * @constructor
 * @this {Node}
 * @param {string} value Label of the element.
 * @param {number} id Unique id of the element. Use a negative value to indicate root element
 * @param {string} urlSubItems Url to ajax load.
 */
JusTo.ui.Node = function(value, id, urlSubItems) {
    /** @private */ this.parent = null;
    /** @private */ this.children = [];
    /** @private */ this.childDom = null;
    this.value = value || "";
    this.id = id;
    this.selected = false;
    /** @private */ this.visible = true;
    /** @private */ this.childrenVisible = urlSubItems === undefined;
    /** @private */ this.urlSubItems = urlSubItems;
    /** @private */ this.options = {};

    /** @private */ this.innerDoms = {};
    /** @private */ this.outterDom = this._newListItem(this);

    this.events.init();
};

/**
 * An attribute to store the events.
 *
 * @return {Object} Events.
 */
JusTo.ui.Node.prototype.events = (function() {
// TODO move this method to bind only with root node. With this implementation
// it is allowed only one tree instance per document
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
                var iconDom = node.innerDoms.icon;
                iconDom.className = "icon";
                iconDom.className += node.childrenVisible ? " folder-opened" : " folder-closed";
            });
        },
        initNodeTypeChanged: function() {
            this.nodeTypeChanged.push(function(node) {
                var iconDom = node.innerDoms.icon;
                iconDom.className = "icon";
                iconDom.className += node.childrenVisible ? " folder-opened" : " folder-closed";
            });
        },
        initContentClicked: function() {
            this.contentClicked.push(function(evt, node) {
                node.setSelected(!node.selected);
            });
        },
        openStateChanged: [], //occurs when node toggle his children visibility
        nodeTypeChanged: [],  //occurs when node change from leaf to non-leaf
        selectionChanged: [], //occurs when the node was (de)selected
        contentClicked: [],   //occurs when the user click at content span
        asyncOpened: [],      //occurs when the node was opened in async mode
        asyncErrorHandler: undefined //occurs when async open return http response <> 200
    };
})();

/**
 * Set the html title attribute tag to show the browser hint
 *
 * @this {Node}
 * @param {string} title Title attribute tag
 */
JusTo.ui.Node.prototype.setTitle = function(title) {
    this.innerDoms.listItem.setAttribute("title", title);
};

/**
 * Returns the node found or null if not found.
 *
 * @this {Node}
 * @param {number} Id unique number of the node
 * @return {Node} The node found.
 */
JusTo.ui.Node.prototype.find = function(nodeId) {
    var found = null;
    var result = this.iterate(function(node, depth) {
        if (node.id === nodeId) {
            found = node;
            return false;
        }
        return true;
    });
    return found;
};

/**
 * Returns the root node.
 *
 * @this {Node}
 * @return {Node} The root node.
 */
JusTo.ui.Node.prototype.findRoot = function() {
    if(this.isRoot()) return this;
    var parent = this.parent;
    while(!parent.isRoot()) {
        parent = parent.parent;
    }
    return parent;
};

/**
 * Returns if the node is root.
 *
 * @this {Node}
 * @return {boolean} The node found.
 */
JusTo.ui.Node.prototype.isRoot = function() {
    return this.id < 0;
};

/**
 * (de)select the current node
 *
 * @this {Node}
 * @param {boolean} flag 
 * @param {boolean} force=false Use this param to avoid canSelect function integrity, 
                    by default this param is considered as false
 */
JusTo.ui.Node.prototype.setSelected = function(flag, force) {
    if (!force && !JusTo.ui.Node.canSelect(this))
        return;

    var content = this.innerDoms.content;
    this.selected = flag;

    content.className = "content";
    content.className += this.selected ? " selected" : "";

    this._nodeSelectionChanged(this);
};

JusTo.ui.Node.prototype._setChildrenVisible = function(flag) {
    this.children.forEach(function(entry) {
        entry.outterDom.style.display = flag ? '' : 'none';
        entry.visible = flag;
    });
    this.childrenVisible = flag;
};

/**
 * Returns if the current node is opened
 *
 * @this {Node}
 * @return {boolean} node opened?
 */
JusTo.ui.Node.prototype.isOpened = function() {
    return this.childrenVisible;
};

/**
 * Returns if the current node has children 
 * (NOTE: the URL attribute to open data via ajax WILL NOT AFFECT this method)
 *
 * @this {Node}
 * @see isLeaf
 * @return {boolean} has children?
 */
JusTo.ui.Node.prototype.hasChildren = function() {
    return this.children.length > 0;
};

/**
 * Returns if the node is leaf
 * (NOTE: the URL attribute to open data via ajax WILL BE VERIFIED on this method)
 *
 * @this {Node}
 * @return {boolean} node is leaf?
 */
JusTo.ui.Node.prototype.isLeaf = function() {
    return !this.hasChildren() && this.urlSubItems === undefined;
};


/**
 * insert a node element at the last position
 *
 * @this {Node}
 * @param {Node} node element
 */
JusTo.ui.Node.prototype.push = function(node) {
    node.parent = this;

    this._insertNode(node);
    this.children.push(node);
};

/**
 * Creates a child instance of Node.
 *
 * @this {Node}
 * @param {string} value Label of the element.
 * @param {number} id Unique id of the element.
 * @param {string} urlSubItems Url to ajax load.
 */
JusTo.ui.Node.prototype.createAndpush = function(value, id, urlSubItems) {
    var child = new JusTo.ui.Node(value, id, urlSubItems);
    this.push(child);

    return child;
};

JusTo.ui.Node.prototype._insertNode = function(node) {
    var parentElement = this.outterDom;
    if (!this.isRoot()) {
        if (!this.hasChildren()) {
            this.childDom = document.createElement("ul");
            parentElement.appendChild(this.childDom);
            this._setChildrenVisible(true);
            this._nodeTypeChanged(this);
        }

        parentElement = this.childDom;
        this.outterDom.firstChild.className = "expander expanded";
        this.outterDom.firstChild.style.display = '';
    }
    parentElement.appendChild(node.outterDom);
};

JusTo.ui.Node.prototype._newListItem = function(node) {
    if (this.isRoot()) {
        var element = document.createElement("ul");
        element.className = "justo-root-list";
        return element;
    }

    var listItem = document.createElement("li");
    var expander = this._createExpanderElement(node);
    var icon = this._createIconElement(node);
    var content = this._createContentElement(node);

    listItem.appendChild(expander);
    listItem.appendChild(icon);
    listItem.appendChild(content);

    this.innerDoms.listItem = listItem;
    this.innerDoms.expander = expander;
    this.innerDoms.icon = icon;
    this.innerDoms.content = content;

    return listItem;
};

JusTo.ui.Node.prototype._createExpanderElement = function(node) {
    var expander = document.createElement('span');
    var objThis = this;
    expander.className = 'expander';
    expander.style.display = 'none';

    if (this.urlSubItems !== undefined) {
        expander.className += ' collapsed';
        expander.style.display = '';
    }

    expander.addEventListener("click", function(evt) {
        if(objThis.isOpened()) {
            objThis.close();
        } else {
            objThis.open();
        }
    });
    return expander;
};

JusTo.ui.Node.prototype._createIconElement = function(node) {
    var icon = document.createElement('span');
    icon.className = 'icon document';

    if (node.urlSubItems !== undefined) {
        icon.className = 'icon folder-closed';
    }

    return icon;
};

/**
 * Opens a node. 
 * This method will automatically check if exist URL to load data via ajax, 
 * once data was loaded, data will be cached at memory
 * Examples: node.open(), node.open(50), node.open(10, 20, 30, 40),
 * node.open([10, 20, 30, 40])
 *
 * @this {Node}
 * @see events.openStateChanged
 * @param {Object=} optional This param can be omitted or multiple
 */
JusTo.ui.Node.prototype.open = function() {
    switch (arguments.length) {
        case 0: {
            return this._open();
        } case 1: {
            if(typeof(arguments[0]) == 'number') {
                return this._openId(arguments[0]);
            }
            return this._openPath(Array.prototype.slice.call(arguments[0]));
        }
    }
    return this._openPath(Array.prototype.slice.call(arguments));
};

JusTo.ui.Node.prototype._open = function(nodeId) {
    if (this.urlSubItems !== undefined && this.loaded !== true) {
        this._asyncOpen();
    } else {
        this.innerDoms.expander.className = 'expander expanded';

        this._setChildrenVisible(true);
        this._nodeOpenChanged(this);
    }
    return this;
};

JusTo.ui.Node.prototype._openId = function(nodeId) {
    var node = this.find(nodeId);
    if(node !== null) {
        node.open();
        return node;
    }
    return null;
};

JusTo.ui.Node.prototype._openPath = function(path) {
    var depth = -1;

    var evt = function(node) {  
        if(!node.isOpened()) return;
        depth++;
        var id = path[depth];

        var child = node.find(id);
        if(depth === path.length - 1) {
            if(child.isLeaf()) {
                child.setSelected(true);
            } else {
                child.open();
            }

            depth = -1;
            child.innerDoms.content.scrollIntoView(true);
            node.events.openStateChanged.splice(position, 1);
        } else {
            if(child !== null) {
                child.open();
            }
        }
    };
    var position = this.events.openStateChanged.push(evt) - 1;

    var firstId = path.shift();
    this._openId(firstId);
};

/**
 * Close the current node
 *
 * @this {Node}
 */
JusTo.ui.Node.prototype.close = function() {
    this.innerDoms.expander.className = 'expander collapsed';

    this._setChildrenVisible(false);
    this._nodeOpenChanged(this);
};

JusTo.ui.Node.prototype.setAsyncErrorHandler = function(fnErrorHandler) {
    this.events.asyncErrorHandler = fnErrorHandler;
};

JusTo.ui.Node.prototype._asyncOpen = function() {
    var request = new XMLHttpRequest();
    var objThis = this;
    var icon = this.innerDoms.icon;
    var oldClassName = icon.className;
    icon.className = "icon loading";

    request.onreadystatechange = function() {
        if (request.readyState === 4) {
            if(request.status === 200) {
                var result = JSON.parse(request.responseText).result;
                result.forEach(function(entry) {
                    var newNode = new JusTo.ui.Node(entry.value, entry.id, entry.urlSubItems);
                    newNode.setTitle(entry.title);
                    objThis.push(newNode);
                });

                objThis.loaded = true;
                objThis._setChildrenVisible(true);
                objThis._nodeOpenChanged(objThis);
                objThis._nodeAsyncOpened(objThis);
            } else {
                icon.className = oldClassName;
                if(objThis.events.asyncErrorHandler != undefined) {
                    objThis.events.asyncErrorHandler(request.status, request.body);
                }
            }
        }
    };
    request.open("GET", this.urlSubItems, true);
    request.send();
};

JusTo.ui.Node.prototype._createContentElement = function(node) {
    var content = document.createElement('span');
    var objThis = this;
    content.innerHTML = node.value;
    content.className = 'content';

    content.addEventListener("click", function(evt) {
        objThis._contentClicked(evt, node);
        evt.stopPropagation();
    });

    return content;
};

/**
 * Select all children (not select current node, common used with root node)
 *
 * @this {Node}
 * @param {boolean} flag
 */
JusTo.ui.Node.prototype.selectAll = function(flag) {
    if (flag === undefined)
        flag = true;

    this.iterate(function(node, depth) {
        if(node.selected == flag) return;
        node.setSelected(flag, true);
    });
};

/**
 * Iterate all children recursively.
 * Example: root.iterate(
             function(node) {console.log(node.value)},
             function(node) {return node.isLeaf()}
            )
 *
 * @this {Node}
 * @param {function} fnCallback A function to apply in each node found. 
                                You can use 'return false' in this function to stop iteration
 * @param {function} fnFilter A function to determine if node will be iterate or not.
 *                            Must return a boolean
 * @see JusTo.ui.NodeFilter
 */
JusTo.ui.Node.prototype.iterate = function(fnCallback, fnFilter) {
    this._iterate(fnCallback, fnFilter, 0);
};

JusTo.ui.Node.prototype._iterate = function(fnCallback, fnFilter, depth) {
    ++depth;
    var next = true;

    this.children.forEach(function(node) {
        if (!fnFilter || (fnFilter(node))) {
            if(fnCallback(node, depth) === false) {
                next = false;
            }
        }

        if(!next) return;
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

JusTo.ui.Node.prototype._nodeAsyncOpened = function(node) {
    this.events.asyncOpened.forEach(function(entryFunction) {
        entryFunction(node);
    });
};