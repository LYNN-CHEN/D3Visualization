class ForceDirectedGraph {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: 800,
      containerHeight: 800,
      margin: { top: 25, right: 20, bottom: 20, left: 35 },
    }
    this.data = _data
    this.initVis()
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this
    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.config.width_l =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right
    vis.config.height_l =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom
    vis.colorScale = d3.scaleOrdinal(d3.schemeTableau10)

    // Define size of SVG drawing area
    vis.local = d3
      .select(vis.config.parentElement)
      .append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight)
      .attr('id', 'local')

    // Append group element that will contain our actual chart
    // and position it according to the given margin config

    // define node and link
    vis.link = vis.local
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(vis.data.links)
      .enter()
      .append('line')
      .attr('stroke-width', function (d) {
        return 1/2 * Math.sqrt(d.value)
      })

    vis.node = vis.local
      .append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(vis.data.nodes)
      .enter()
      // set the filling color, stroke, and mouse events 
      .append('circle')
      .attr('r', 5)
      .attr('fill', function (d) {
        return vis.colorScale(d.group)
      })
      .attr('stroke', 'black')
      .attr('stroke-width', 1)
      .on("mouseover.fade", vis.fade(0.3))
      .on("mouseout.fade", vis.fade(1))

    // define force simulation
    vis.simulation = d3.forceSimulation(vis.data.nodes)
    .force('link', d3.forceLink().id(d => d.id).links(vis.data.links))
    .force('charge', d3.forceManyBody())
    .force('center', d3.forceCenter(vis.config.width_l / 2, vis.config.height_l / 2))

    // define a tooltip for showing text
    vis.tooltip = vis.local.selectAll(".text")
        .data(vis.data.nodes)
        .enter().append("text")
        .attr('dx', 8)
        .attr('dy', 6)
        .style("font-size", "12px")
        .text(d => d.id)
        .style("display", "none")

    vis.linkedByIndex = {}
    // Build a dictionary (i.e., linkedByIndex) which will be used in isConnected function
    vis.data.links.forEach((d) => {
      vis.linkedByIndex[`${d.source.index},${d.target.index}`] = 1
    })

    vis.updateVis()
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this

    // Add node-link data to simulation
    vis.simulation
      .nodes(vis.data.nodes)
      // the tick function
      .on("end", () => {
        vis.link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
        vis.node
          .attr("cx", function (d) { return d.x; })
          .attr("cy", function(d) { return d.y; });
        vis.tooltip.attr("x", d => d.x).attr("y", d=>d.y)
      });

    vis.renderVis()
  }

  /**
   * Bind data to visual elements.
   */
  renderVis() {
    let vis = this
  }

  fade(opacity) {
    let vis = this
    return function(d) {
      const curNode = d.srcElement.__data__
      vis.node.style('stroke-opacity', function (o) {
        const curOpacity = vis.isConnected(curNode, o) ? 1 : opacity;
        this.setAttribute('fill-opacity', curOpacity);
        return curOpacity;
      });
      vis.link.style('stroke-opacity', o => (o.source === curNode || o.target === curNode ? 1 : opacity));
      if (opacity!=1) {
        vis.tooltip.style('display', o => vis.isConnected(curNode, o) ? "inline" : "none")
      } else {
        vis.tooltip.style('display', "none")
      }
    }
  }

  isConnected(a, b) {
    let vis=this
    return vis.linkedByIndex[`${a.index},${b.index}`] || vis.linkedByIndex[`${b.index},${a.index}`] || a.index === b.index;
  }
}
