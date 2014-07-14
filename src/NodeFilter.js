var JusTo    = JusTo    || {};
    JusTo.ui = JusTo.ui || {};

/**
 * Auxiliar functions to pass as parameter to iterate method
 * @see JusTo.ui.Node.iterate
 * @see JusTo.ui.Node.canSelect
 */
JusTo.ui.NodeFilter = (function() { 
    return {
        /**
         * fetch only selected nodes
         *
         * @type {function}
         */
        selected: function(node) {
            return node.selected;
        },
        /**
         * fetch only unselected nodes
         *
         * @type {function}
         */
        unselected: function(node) {
            return !node.selected;
        },
        /**
         * fetch only leaf nodes
         *
         * @type {function}
         */
        leaf: function(node) {
            return node.isLeaf();
        },
        /**
         * fetch only one leaf
         *
         * @type {function}
         */
        leafSingle: function(node) {
            var canSelect = node.urlSubItems === undefined && (!node.hasChildren());
            if(canSelect) { 
                node.findRoot().selectAll(false);
            }
            return canSelect;
        },
        /**
         * fetch only one
         *
         * @type {function}
         */
        single: function(node) {
            node.findRoot().selectAll(false);
            return true;
        },
        /**
         * fetch all the nodes
         *
         * @type {function}
         */
        any: function(node) {
            return true;
        },
        /**
         * fetch all the nodes
         *
         * @type {function}
         */
        all: function(node) {
            return this.any;
        },
        /**
         * fetch all the children nodes
         *
         * @type {function}
         */
        children: function(node) {
            var selected = node.selected;
            node.selectAll(!selected);

            return true;
        }
    }; 
})();