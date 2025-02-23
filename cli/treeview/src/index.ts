import { toDistribution, Morphir } from "morphir-elm";
import { TreeNode } from "./treeNode";
import * as d3 from "d3";

const treeviewTitle: string = "Treeview Display";

window.onload = Home;

export default function Home() {
  getIR();
}

interface RawDistribution {
  distribution: Morphir.IR.Distribution.Distribution;
  fornatVersion: Number;
}

export async function getIR(): Promise<TreeNode | string> {
  try {
    let response = await fetch("/server/morphir-ir.json", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        "Error getting morphir-ir with status: " + response.statusText
      );
    }

    const result = (await response.json()) as RawDistribution;

    const distribution: Morphir.IR.Distribution.Distribution = toDistribution(
      JSON.stringify(result)
    );
    console.log("DIST: ", distribution);
    let treeview: TreeNode = createTree(distribution);
    treeview.children = nestedTree(treeview);
    console.log("CREATED TREE: ", treeview);

    d3.select("#treeview").append(() => createChart(treeview));
    return treeview;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "An unexpected error occurred getting morphir-ir.json.";
  }
}

function createChart(data: TreeNode): SVGSVGElement | null {
  // Chart from: https://observablehq.com/@d3/collapsible-tree with modifications to support our implementation.
  // Specify the charts’ dimensions. The height is variable, depending on the layout.
  const marginTop = 10;
  const marginRight = 200;
  const marginBottom = 10;
  const marginLeft = 200;

  // Rows are separated by dx pixels, columns by dy pixels. These names can be counter-intuitive
  // (dx is a height, and dy a width). This because the tree must be viewed with the root at the
  // “bottom”, in the data domain. The width of a column is based on the tree’s height.
  const root = d3.hierarchy<TreeNode>(data as TreeNode);
  const dx = 30; //10
  // const dy = ((width - marginRight - marginLeft) / (1 + root.height))+30;// NEed mor space
  const dy = 150;

  // Define the tree layout and the shape for links.
  const tree = d3.tree<TreeNode>().nodeSize([dx, dy]);
  const diagonal = d3
    .linkHorizontal()
    .x((d: any) => d.y)
    .y((d: any) => d.x);
  // const diagonal = d3.linkHorizontal().x(d => d.x).y(d => d.y);

  // Create the SVG container, a layer for the links and a layer for the nodes.
  const svg = d3
    .create("svg")
    .attr("width", dy)
    .attr("height", dx)
    .attr("viewBox", [-marginLeft, -marginTop, dy, dx])
    .attr(
      "style",
      "width: auto; height: auto; font: 10px sans-serif; user-select: none;"
    );

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  function update(event: any, source: any) {
    const duration = event?.altKey ? 2500 : 250; // hold the alt key to slow down the transition
    const nodes = (
      root.descendants() as d3.HierarchyPointNode<TreeNode>[]
    ).reverse();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    let left = root;
    let right = root;
    let up = root;
    let down = root;
    root.eachBefore((node) => {
      if (
        node.x === undefined ||
        node.y == undefined ||
        left.x === undefined ||
        right.x === undefined ||
        up.y === undefined ||
        down.y === undefined
      )
        return;
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
      if (node.y < up.y) up = node;
      if (node.y > down.y) down = node;
    });
    if (
      left.x === undefined ||
      right.x === undefined ||
      down.y == undefined ||
      up.y == undefined
    )
      return;

    const height = right.x - left.x + marginTop + marginBottom;
    const width = down.y - up.y + marginRight + marginLeft;

    const transition = svg
      .transition()
      .duration(duration)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-marginLeft, left.x - marginTop, width, height].join());

    if (!window.ResizeObserver) {
      transition.tween("resize", function () {
        return function () {
          svg.dispatch("toggle");
        };
      });
    }

    // Update the nodes…
    const node = gNode
      .selectAll<SVGGElement, d3.HierarchyNode<TreeNode>>("g")
      .data(nodes, (d) => d.id as string);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", (event, d: any) => {
        d.children = d.children ? null : d._children;
        if(!d._children){
          flyout(d.data);
        }
        update(event, d);
      });

    const types = ["Enum", "CustomType", "Record", "Alias"];
    nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d: any) => {
        //blue node if it is a type, less bright when terminating node
        if (types.includes(d.data.type))
            return d._children ? "rgba(0, 163, 225, 1)" : "rgba(0, 163, 225, 1)";
        return d._children ? "#555" : "#999";
      })
      .attr("stroke-width", 10);

    nodeEnter
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => (d._children ? -6 : 6))
      .attr("text-anchor", (d: any) => (d._children ? "end" : "start"))
      .text((d: any) => d.data.name)
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .attr("paint-order", "stroke");

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition as any)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition as any)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink
      .selectAll<SVGGElement, d3.HierarchyPointLink<TreeNode>>("path")
      .data(links, (d) => d.target.id as string);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d) => {
        const o: any = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link
      .merge(linkEnter as any)
      .transition(transition as any)
      .attr("d", diagonal as any);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition as any)
      .remove()
      .attr("d", (d) => {
        const o: any = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Do the first update to the initial configuration of the tree — where a number of nodes
  // are open (arbitrarily selected as the root, plus nodes with 7 letters).
  (root as any).x0 = dy / 2;
  (root as any).y0 = 0;
  root.descendants().forEach((d: any, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth && d.data.name.length !== 7) d.children = null;
  });

  update(null, root);

  return svg.node();
}

document.addEventListener('DOMContentLoaded', () =>{
  const exitFlyout = document.getElementById("closeFlyout");
  exitFlyout?.addEventListener('click', () => {
    document.getElementById('flyout')!.classList.remove('show');
    document.getElementById('flyout')!.classList.add('hide');
    hideFlyout();
  });
});

async function hideFlyout(){
  await wait(500);
  document.getElementById('flyout')!.style.display = "none";
}

async function wait(ms: number): Promise<void>{
  return new Promise(resolve => setTimeout(resolve, ms));
}

function flyout(node: TreeNode){
  document.getElementById('flyout')!.style.display = "block";
  document.getElementById('flyout')!.classList.remove('hide');
  document.getElementById('flyout')!.classList.add('show');
  document.getElementById('flyoutTitle')!.innerText = node.name.toString();
  document.getElementById('flyoutSubtitle')!.innerText = ""+node.type.toString();

  const definitionTable = document.createElement('table');
  node.definition.forEach(node => {
    let tableRow = document.createElement('tr');
    let cell = document.createElement('td');
    cell.textContent = node.name.toString();
    tableRow.appendChild(cell);
    definitionTable.appendChild(recursiveFlyoutDefinition(node, tableRow));
  });

  const docs = node.doc || 'None';
  document.getElementById('docs')!.innerText= docs.toString();
  document.getElementById('contentDef')!.innerHTML='';
  document.getElementById('contentDef')!.appendChild(definitionTable);
}

function recursiveFlyoutDefinition(node: TreeNode, tableRow: any): any{
  node.definition.forEach(child => {
    let childCell = document.createElement('td');
    childCell.textContent = child.name.toString();
    tableRow.appendChild(childCell);
    if(child.children.length == 0){
      recursiveFlyoutDefinition(child, tableRow);
    }
  });
  return tableRow;
}

function nestedTree(flatTree: TreeNode): TreeNode[] {
  const root = new TreeNode("root", "placeholder");
  flatTree.children.forEach((node) => {
    const modules = node.name.split(".");
    let currentNode = root;

    modules.forEach((module, idx) => {
      let child = currentNode.children.find((child) => child.name === module);
      if (!child) {
        currentNode.children = currentNode.children.filter(
          (child) => child.type == "module"
        );
        child = new TreeNode(module, "module");
        currentNode.children.push(child);
      }

      currentNode = child;
    });

    currentNode.children = node.children;
  });
  return root.children;
}

function createTree(ir: Morphir.IR.Distribution.Distribution) {
  let packageName = ir.arg1.map((p) => p.map(capitalize).join(".")).join(".");
  let tree: TreeNode = new TreeNode(packageName, "package");

  switch (ir.kind) {
    case "Library":
      ir.arg3.modules.forEach((accessControlledModuleDef, moduleName) => {
        let nodeName = moduleName
          .map((n) => n.map(capitalize).join(""))
          .join(".");
        let moduleNode = new TreeNode(nodeName, "module");
        accessControlledModuleDef.value.types.forEach(
          (documentedAccessControlledTypeDef, typeName) => {
            let distNode = documentedAccessControlledTypeDef.value.value;
            let typeNode = new TreeNode(toCamelCase(typeName), "type");
            typeNode.doc = documentedAccessControlledTypeDef.value.doc;
            let typeTree: TreeNode;

            //Drilldown into each type
            if (distNode.kind == "CustomTypeDefinition") {
              typeTree = getCustomTypeTree(typeNode, distNode);
            } else {
              typeTree = getTypeAliasTree(typeNode, distNode);
            }
            moduleNode.children.push(typeTree);
          }
        );

        accessControlledModuleDef.value.values.forEach(
          (documentedAccessControlledValueDef, valueName) => {
            let distNode = documentedAccessControlledValueDef.value.value.body;
            let valueNode: TreeNode = new TreeNode(
              toCamelCase(valueName),
              "value"
            );

            //Drilldown into each value
            valueNode.children.push(...recursiveValueFunction(distNode));
            moduleNode.children.push(valueNode);
          }
        );

        tree.children.push(moduleNode);
      });
      return tree;
  }
}

function getCustomTypeTree(
  treeNode: TreeNode,
  distNode: Morphir.IR.Type.CustomTypeDefinition<{}>
): TreeNode {
  let typeDistNode = distNode.arg2;

  if (
    typeDistNode.value.values().next().value &&
    typeDistNode.value.values().next().value!.length == 0
  ) {
    treeNode.type = "Enum";
  } else {
    treeNode.type = "CustomType";
  }
  typeDistNode.value.forEach((value, key) => {
    let node = new TreeNode(toCamelCase(key), "CustomType");
    value.forEach((val) =>
      node.definition.push(...recursiveTypeFunction(val[1]))
    );
    treeNode.definition.push(node);
  });
  return treeNode;
}

function getTypeAliasTree(
  treeNode: TreeNode,
  distNode: Morphir.IR.Type.TypeAliasDefinition<{}>
): TreeNode {
  let typeDistNode = distNode.arg2;
  let kind: string = typeDistNode.kind;

  switch (kind) {
    case "Reference":
      treeNode.type = "Alias";
      treeNode.definition.push(...recursiveTypeFunction(typeDistNode));
      break;
    case "Record":
      treeNode.type = "Record";
      treeNode.definition.push(...recursiveTypeFunction(typeDistNode));
      break;
    default:
      console.log("Unsupported type found: ", distNode.kind);
      break;
  }

  return treeNode;
}

function recursiveTypeFunction(
  distNode: Morphir.IR.Type.Type<{}>
): Array<TreeNode> {
  let treeNodes: Array<TreeNode> = [];

  switch (distNode.kind) {
    case "Reference":
      if (!isMorphirSDK(distNode)) { //This filters out all basic types
        treeNodes.push(
          new TreeNode(toCamelCase(distNode.arg2[2]), distNode.kind)
        );
      }
      distNode.arg3.forEach((node) =>
        treeNodes.push(...recursiveTypeFunction(node))
      );
      break;
    case "Tuple":
      treeNodes.push(
        ...recursiveTypeFunction(distNode.arg2[0]),
        ...recursiveTypeFunction(distNode.arg2[1])
      );
      break;
    case "Record":
      distNode.arg2.forEach((node) => {
        let parentNode = new TreeNode(toCamelCase(node.name), node.tpe.kind);
        parentNode.definition.push(...recursiveTypeFunction(node.tpe));
        treeNodes.push(parentNode);
      });
      break;
    case "Function":
      let parentNode = recursiveTypeFunction(distNode.arg2);
      parentNode[0].definition.push(...recursiveTypeFunction(distNode.arg3));
      treeNodes.push(...parentNode);
      break;
    default:
      console.log("Unsupported type found: ", distNode.kind);
      treeNodes.push(new TreeNode("Unknown Type", distNode.kind));
      break;
  }

  return treeNodes;
}

function recursiveValueFunction(
  distNode: Morphir.IR.Value.Value<{}, {}>
): Array<TreeNode> {
  let treeNodes: Array<TreeNode> = [];

  switch (distNode.kind) {
    case "LetDefinition":
      let arg3Drilldown = recursiveValueFunction(distNode.arg3.body);
      let arg4Drilldown = recursiveValueFunction(distNode.arg4);

      if (arg4Drilldown.length > 0) {
        let name: String = toCamelCase(distNode.arg2);
        if (name != arg4Drilldown[0].name) {
          arg4Drilldown[0].children
            .filter((child) => child.name == name)
            .forEach((child) => child.children.push(...arg3Drilldown));
        } else {
          arg4Drilldown[0].children.push(...arg3Drilldown);
        }
        treeNodes.push(...arg4Drilldown);
      } else {
        treeNodes.push(...arg3Drilldown);
      }
      break;
    case "Apply":
      let arg2ApplyDrilldown = recursiveValueFunction(distNode.arg2);
      let arg3ApplyDrilldown = recursiveValueFunction(distNode.arg3);

      if (distNode.arg3.kind == "Apply") {
        treeNodes.push(...arg2ApplyDrilldown);
        treeNodes.push(...arg3ApplyDrilldown);
      } else {
        if (arg2ApplyDrilldown.length > 0) {
          arg2ApplyDrilldown[0].children.push(...arg3ApplyDrilldown);
          treeNodes.push(...arg2ApplyDrilldown);
        } else {
          treeNodes.push(...arg3ApplyDrilldown);
        }
      }
      break;
    case "IfThenElse":
      let arg2IfDrilldown = recursiveValueFunction(distNode.arg2);
      treeNodes.push(...arg2IfDrilldown);
      break;
    case "PatternMatch":
      treeNodes.push(...recursiveValueFunction(distNode.arg2));
      break;
    case "Variable":
      treeNodes.push(new TreeNode(toCamelCase(distNode.arg2), "Variable"));
      break;
    case "Reference":
      if (!isMorphirSDK(distNode)) {
        //Stop normal operations from appearing in tree
        treeNodes.push(
          new TreeNode(toCamelCase(distNode.arg2[2]), "Reference")
        );
      }
      break;
    case "Field":
      treeNodes.push(...recursiveValueFunction(distNode.arg2));
      break;
    case "Literal":
      break;
    case "Constructor":
      treeNodes.push(new TreeNode(toCamelCase(distNode.arg2[2]), "Reference"));
      break;
    case "List":
      distNode.arg2.forEach((node) =>
        treeNodes.push(...recursiveValueFunction(node))
      );
      break;
    case "Tuple":
      treeNodes.push(...recursiveValueFunction(distNode.arg2[0]));
      treeNodes.push(...recursiveValueFunction(distNode.arg2[1]));
      break;
    case "Lambda":
      break;
    case "FieldFunction":
      break;
    default:
      console.log("Unsupported type found:", distNode);
      treeNodes.push(new TreeNode("Unknown Value", distNode.kind));
      break;
  }

  return treeNodes;
}

// String Utils
function toCamelCase(array: string[]) {
  if (array.length === 0) {
    return "";
  }
  const camelCaseString = array
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return capitalize(word);
    })
    .join("");
  return camelCaseString;
}

function capitalize(str: string): string {
  return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
}

function isMorphirSDK(
  distNode: Morphir.IR.Type.Reference<{}> | Morphir.IR.Value.Reference<{}>
): boolean {
  return (
    distNode.arg2[0][1] &&
    distNode.arg2[0][0] &&
    toCamelCase(distNode.arg2[0][1]) == "sDK" &&
    toCamelCase(distNode.arg2[0][0]) == "morphir"
  );
}
