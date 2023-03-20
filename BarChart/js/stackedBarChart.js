class StackedAreaChart {
  /**
   * Class constructor with basic chart configuration
   * @param {Array}
   */
  constructor(_data) {
    this.margin = { top: 20, right: 40, bottom: 60, left: 40 }
    this.width = 1200 - this.margin.left - this.margin.right
    this.height = 800 - this.margin.top - this.margin.bottom
    this.displayType = 'Bar'
    this.data = _data
    this.initVis()
  }

  /**
   * Initialize scales/axes and append static chart elements
   */
  initVis() {
    let vis = this

    // Select HTML tag, add a SVG, and set the attributes
    // append the svg object to the body of the page
    vis.svg = d3
      .select('#my_dataviz')
      .append('svg')
      .attr('width', vis.width + vis.margin.left + vis.margin.right)
      .attr('height', vis.height + vis.margin.top + vis.margin.bottom)

    // Create scales for x and y axis
    // get states list
    vis.groups = d3.map(vis.data, (d) => {
      return d.State
    })
    // get the total population of each state
    vis.x = vis.data.map((d) => d['total'])
    // X axis
    vis.xScaleFocus = d3
      .scaleBand()
      .domain(vis.groups)
      .range([0, vis.width])
      .padding([0.1])
    // Y axis
    vis.yScaleFocus = d3.scaleLinear().range([vis.height, 0])

    // Create x and y axis and add them in SVG
    vis.xAxis = d3.axisBottom(vis.xScaleFocus)
    vis.yAxis = d3.axisLeft(vis.yScaleFocus)

    vis.container = vis.svg
      .append('g')
      .attr('id', 'container')
      .attr('width', vis.width)
      .attr('height', vis.height)
      .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`)

    vis.xAxisG = vis.container
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0, ${vis.height})`)
    vis.yAxisG = vis.container.append('g').attr('class', 'axis y-axis')

    // Add y label to the chart
    vis.svg
      .append('text')
      .attr('class', 'ylabel')
      .attr('y', 5)
      .attr('x', 0)
      .attr('dy', '1em')
      .attr('transform', 'rotate(0)')
      .style('text-align', 'left')
      .style('font-size', '9px')
      .style('font-weight', 600)
      .text('Population')

    // Get the population under different age categories and assign color
    vis.subgroups = vis.data.columns.slice(1)
    vis.colorScale = d3
      .scaleOrdinal()
      .range([
        '#8dd3c7',
        '#ffffb3',
        '#bebada',
        '#fb8072',
        '#80b1d3',
        '#fdb462',
        '#b3de69',
      ])
      .domain(vis.subgroups)
  }

  /**
   * Prepare the data and scales before we render it.
   */
  updateVis() {
    let vis = this

    if (vis.displayType == 'Sorted') {
      // sort the data according to the population and get the new states order
      vis.data.sort((a, b) => b.total - a.total)
      vis.sorted_groups = d3.map(vis.data, (d) => {
        return d.State
      })
      vis.xScaleFocus.domain(vis.sorted_groups)
    } else {
      // sort the data by state index
      vis.data.sort(
        (a, b) => vis.groups.indexOf(a.State) - vis.groups.indexOf(b.State),
      )
      vis.xScaleFocus.domain(vis.groups)
    }

    vis.yScaleFocus.domain([
      0,
      d3.max(vis.data, function (d) {
        return d.total
      }),
    ])

    // get the stacked data
    vis.stackedData = d3.stack().keys(vis.subgroups)(vis.data)

    vis.renderVis()
  }

  /**
   * This function contains the D3 code for binding data to visual elements
   * Important: the chart is not interactive yet and renderVis() is intended
   * to be called only once; otherwise new paths would be added on top
   */
  renderVis() {
    let vis = this

    if (vis.displayType == 'Bar') {
      // Visualzie Bar Chart
      vis.container.selectAll('rect').remove()
      vis.container
        .selectAll('rect')
        .data(vis.data)
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return vis.xScaleFocus(d.State)
        })
        .attr('y', function (d) {
          return vis.yScaleFocus(d.total)
        })
        .attr('width', (d) => {
          return vis.xScaleFocus.bandwidth()
        })
        .attr('height', (d) => {
          return vis.height - vis.yScaleFocus(d.total)
        })
        .attr('fill', '#bb7733')
    }
    else {
      // Visualize Stacked/Sorted Bar Chart
      vis.container.selectAll('rect').remove()
      vis.container
        .append('g')
        .selectAll('g')
        .data(vis.stackedData)
        .enter()
        .append('g')
        .attr('fill', function (d) {
          return vis.colorScale(d.key)
        })
        .selectAll('rect')
        .data(function (d) {
          return d
        })
        .enter()
        .append('rect')
        .attr('x', function (d) {
          return vis.xScaleFocus(d.data.State)
        })
        .attr('y', function (d) {
          return vis.yScaleFocus(d[1])
        })
        .attr('height', function (d) {
          return vis.yScaleFocus(d[0]) - vis.yScaleFocus(d[1])
        })
        .attr('width', vis.xScaleFocus.bandwidth())
    }

    vis.xAxisG.call(vis.xAxis)
    vis.yAxisG.call(vis.yAxis)

    // Display or remove legend
    if (vis.displayType == 'Bar') {
      d3.selectAll('.legend-area').remove()
    } else {
      let legend = vis.svg
        .append('g')
        .attr('class', 'legend-area')
        .attr('font-family', 'sans-serif')
        .attr('font-size', 10)
        .attr('text-anchor', 'end')
        .selectAll('g')
        .data(vis.subgroups.slice().reverse())
        .enter()
        .append('g')
        .attr('transform', function (d, i) {
          return 'translate(0,' + i * 20 + ')'
        })

      legend
        .append('rect')
        .attr('x', vis.width - 19)
        .attr('width', 19)
        .attr('height', 19)
        .attr('fill', vis.colorScale)

      legend
        .append('text')
        .attr('x', vis.width - 24)
        .attr('y', 9.5)
        .attr('dy', '0.32em')
        .text(function (d) {
          return d
        })
    }
  }
}
