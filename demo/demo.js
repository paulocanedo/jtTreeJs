var rootNode = new JusTo.ui.Node("root", -1);

(function () {
    var _varControl = 1;
    var startTime = null;
    var eggs = null;
    var treeDiv = document.getElementById("tree");

    treeDiv.innerHTML = "";
    startTime = performance.now();

    eggs = new JusTo.ui.Node("Eggs", _varControl++);
    var milk = new JusTo.ui.Node("Milk", _varControl++);
    var cheese = new JusTo.ui.Node("Cheese", _varControl++);
    var smelly = new JusTo.ui.Node("Smelly", _varControl++);
    var leaf = new JusTo.ui.Node("Leaf", _varControl++);
    var bread = new JusTo.ui.Node("Bread", _varControl++, "sample.json");

    rootNode.push(milk);
    rootNode.push(eggs);
    rootNode.push(cheese);
    rootNode.push(bread);
    rootNode.push(leaf);

    milk.push(new JusTo.ui.Node("Goat", _varControl++));
    milk.push(new JusTo.ui.Node("Cow", _varControl++));

    eggs.push(new JusTo.ui.Node("Free-range", _varControl++));
    eggs.push(new JusTo.ui.Node("Other", _varControl++));

    cheese.push(smelly);
    cheese.push(new JusTo.ui.Node("Extra Smelly", _varControl++));

    smelly.push(new JusTo.ui.Node("Item 1", _varControl++));
    smelly.push(new JusTo.ui.Node("Item 2"));
    smelly.push(new JusTo.ui.Node("Item 3"));

    treeDiv.appendChild(rootNode.outterDom);

    rootNode.events.selectionChanged.push(function(node) {
        console.log("selectionChanged", node.selected);
    });

    document.getElementById("selectionTypeSelect")[0].selected = true;
    document.getElementById("selectAllButton").addEventListener("click", function(evt) {
        rootNode.selectAll();
    });

    document.getElementById("deselectAllButton").addEventListener("click", function(evt) {
        rootNode.selectAll(false);
    });

    document.getElementById("selectionTypeSelect").addEventListener("change", function(evt) {
        switch(evt.target.value) {
            case "0":
                JusTo.ui.Node.canSelect = JusTo.ui.NodeFilter.all;
                break;
            case "1":
                JusTo.ui.Node.canSelect = function(node) { rootNode.selectAll(false); return true; };
                break;
            case "2":
                JusTo.ui.Node.canSelect = JusTo.ui.NodeFilter.leaf;
                break;
            case "3":
                JusTo.ui.Node.canSelect = function(node) { rootNode.selectAll(false); return node.urlSubItems === undefined && (!node.hasChildren()); };
                break;
        }
    });
})();