export class TreeNode {
  public name: String;
  public type: String;
  public children: Array<TreeNode>;

  constructor(name: String, type: String) {
    this.name = name;
    this.type = type;
    this.children = [];
  }
}
