# jtTreeJs
========

# Usage:

## HTML

add css and Javascripts references, then a blank div:
```html
...
<link rel="stylesheet" href="../css/tree.css">
<script src="https://github.com/paulocanedo/jtTreeJs/releases/download/0.9.0/jtTreeJs.min.js"></script>
<div id="tree">
  <!-- empty DIV to draw tree  -->
</div>
```

## JavaScript
your root node where will hold every else nodes:
```javascript
var rootNode = new JusTo.ui.Node("root", -1);
```

create a new node:
```javascript
var milk = new JusTo.ui.Node("Milk", 1); //value, id
rootNode.push(milk);
```

add a subnode:
```javascript
milk.push(new JusTo.ui.Node("subnode", 2)); //value, id
```

a node with ajax/json subnode
```javascript
var node = new JusTo.ui.Node("subnode", 3, "./sample.json"); //value, id, json URL
```

## Events
to listen (de)selection:
```javascript
rootNode.events.selectionChanged.push(function(node) {
  if(node.selected) {
      console.log("node selected", node.id);
  } else {
      console.log("node deselected", node.id);
  }
});
```

to listen node opened:
```javascript
rootNode.events.openStateChanged.push(function(node) {
    console.log("opened");
});
```

## Selection modes
```javascript
JusTo.ui.NodeFilter.single; //can select any node
JusTo.ui.NodeFilter.all; //can select any node - multiple
JusTo.ui.NodeFilter.leafSingle; //can select only leaf
JusTo.ui.NodeFilter.leaf; //can select only leaf - multiple
JusTo.ui.NodeFilter.children; //select auto recursively from node until leaf

//e.g.:
JusTo.ui.Node.canSelect = JusTo.ui.NodeFilter.single;
```

## Other
to select all nodes (it will select recursively from the node)
```javascript
document.getElementById("selectAllButton").addEventListener("click", function(evt) {
    rootNode.selectAll();
});
```

## Run demo

```bash
npm start
```
open: http://localhost:8080/demo/index.htm to test it
