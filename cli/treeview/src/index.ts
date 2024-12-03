import { toDistribution, Morphir } from "morphir-elm";
import { TreeNode } from "./treeNode";

const treeviewTitle: string = "Treeview Display";
document.body.innerHTML = `<h2>${treeviewTitle}</h2>`;

window.onload = Home;

export default function Home() {
  getIR();
}

interface RawDistribution {
  distribution: Morphir.IR.Distribution.Distribution;
  fornatVersion: Number;
}

async function getIR() {
  try {
    const response = await fetch("/server/morphir-ir.json", {
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
    const treeview: TreeNode = createTree(distribution);
    console.log("CREATED TREE: ", treeview);
    document.body.innerHTML = `<h2>${treeview.name}</h2>`;

    return treeview;
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "An unexpected error occurred getting morphir-ir.json.";
  }
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
      node.children.push(...recursiveTypeFunction(val[1]))
    );
    treeNode.children.push(node);
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
      break;
    case "Record":
      treeNode.type = "Record";
      treeNode.children.push(...recursiveTypeFunction(typeDistNode));
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
      treeNodes.push(
        new TreeNode(toCamelCase(distNode.arg2[2]), distNode.kind)
      );
      distNode.arg3.forEach((node) =>
        treeNodes.push(...recursiveTypeFunction(node))
      );
      break;
    case "Record":
      distNode.arg2.forEach((node) => {
        let parentNode = new TreeNode(toCamelCase(node.name), node.tpe.kind);
        parentNode.children.push(...recursiveTypeFunction(node.tpe));
        treeNodes.push(parentNode);
      });
      break;
    case "Function":
      let parentNode = recursiveTypeFunction(distNode.arg2);
      parentNode[0].children.push(...recursiveTypeFunction(distNode.arg3));
      treeNodes.push(...parentNode);
      break;
    default:
      console.log("Not yet covered: ", distNode.kind);
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
      if (distNode.arg2.kind == "Tuple") {
        treeNodes.push(...recursiveValueFunction(distNode.arg2.arg2[0]));
        treeNodes.push(...recursiveValueFunction(distNode.arg2.arg2[1]));
      }
      break;
    case "Variable":
      treeNodes.push(new TreeNode(toCamelCase(distNode.arg2), "Variable"));
      break;
    case "Reference":
      if (
        !(
          toCamelCase(distNode.arg2[1][0]) == "basics" &&
          toCamelCase(distNode.arg2[0][1]) == "sDK" &&
          toCamelCase(distNode.arg2[0][0]) == "morphir"
        )
      ) {
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
    default:
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
