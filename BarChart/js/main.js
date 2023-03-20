// Initialize helper function
let data, stackedBarChart

/**
 * Load data from CSV file asynchronously and render area chart
 */
d3.csv('data/A1_Data.csv').then((_data) => {
  // get the keys and states
  var keys = _data.columns.slice(1)
  // compute total population
  _data.forEach((d) => {
    var total = 0
    keys.map((name) => {
      total += +d[name]
    })
    d.total = total
  })

  // load data
  data = _data

  // Initialize and render chart
  stackedBarChart = new StackedAreaChart(data)
  stackedBarChart.updateVis()
})

/**
 * Select box event listener
 */

//
d3.select('#display-type-selection').on('change', function () {
  // Get selected display type and update chart
  stackedBarChart.displayType = d3.select(this).property('value')
  stackedBarChart.updateVis()
})
