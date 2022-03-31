class VisGraph extends HTMLElement {
    constructor() {
        super();

    }

    drawGraph() {

        var graphObject = JSON.parse(this.getAttribute('graph'))


        // create an array with nodes
        var nodes = new vis.DataSet(
            graphObject.nodes
        );

        // create an array with edges
        var edges = new vis.DataSet(
            graphObject.edges
        );

        var data = {
            nodes: nodes,
            edges: edges
        };

        var options = {
            layout: {
                hierarchical: {
                    nodeSpacing: 100,
                    levelSeparation: 80,

                    direction: "UD",
                    sortMethod: "directed",
                },
            },
            edges: {
                smooth: true,
                arrows: "to",
            },
            autoResize: false,
            height: "1000px",
            width: "1000px"
        };

        // initialize your network!
        var network = new vis.Network(this, data, options);

    }
    connectedCallback() { this.drawGraph() }
    attributeChangedCallback() { this.drawGraph() }
    disconnectedCallback() { }
    static get observedAttributes() { return ["graph"] }
}
window.customElements.define('vis-graph', VisGraph)

