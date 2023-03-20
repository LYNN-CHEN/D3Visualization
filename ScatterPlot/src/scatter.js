async function drawScatter() {
  // 1. Access data
  const dataset = await d3.json('./data/my_weather_data.json')
  // set data constants
  // Get data attributes, i.e. xAccesstor for max temperature and yAccessor for min temperature
  const xAccessor = (d) => d.temperatureMin
  const yAccessor = (d) => d.temperatureMax
  const colorScaleYear = 2000
  const parseDate = d3.timeParse('%Y-%m-%d')
  const colorAccessor = (d) => parseDate(d.date).setYear(colorScaleYear)

  // Create chart dimensions
  const width = d3.min([window.innerWidth * 0.75, window.innerHeight * 0.75])
  let dimensions = {
    width: width,
    height: width,
    margin: {
      top: 90,
      right: 90,
      bottom: 50,
      left: 50,
    },
    legendWidth: 250,
    legendHeight: 26,
    histogramMargin: 10,
    histogramHeight: 80,
  }
  dimensions.boundedWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  // Draw
  const wrapper = d3
    .select('#wrapper')
    .append('svg')
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)

  const bounds = wrapper
    .append('g')
    .style(
      'transform',
      `translate(${dimensions.margin.left}px, ${dimensions.margin.top}px)`,
    )

  const boundsBackground = bounds
    .append('rect')
    .attr('class', 'bounds-background')
    .attr('x', 0)
    .attr('width', dimensions.boundedWidth)
    .attr('y', 0)
    .attr('height', dimensions.boundedHeight)

  // Create scales
  // Create scales for x, y, and color (i.e., xScale, yScale, and colorScale)
  const xScale = d3
    .scaleLinear()
    .domain([
      d3.min(dataset, (d) => xAccessor(d)),
      d3.max(dataset, (d) => yAccessor(d)),
    ])
    .range([0, dimensions.boundedWidth])
    .nice()
  const yScale = d3
    .scaleLinear()
    .domain([
      d3.min(dataset, (d) => xAccessor(d)),
      d3.max(dataset, (d) => yAccessor(d)),
    ])
    .range([dimensions.boundedHeight, 0])
    .nice()
  const colorScale = d3
    .scaleSequential()
    .domain([
      d3.timeParse('%m/%d/%Y')(`1/1/${colorScaleYear}`),
      d3.timeParse('%m/%d/%Y')(`12/31/${colorScaleYear}`),
    ])
    .interpolator((d) => d3.interpolateRainbow(d))

  // 5. Draw data
  // draw data into a scatter plot
  const dotsGroup = bounds.append('g')
  const dots = dotsGroup
    .selectAll('.dot')
    .data(dataset, (d) => d[0])
    .join('circle')
    .attr('class', 'dot')
    .attr('cx', (d) => xScale(xAccessor(d)))
    .attr('cy', (d) => yScale(yAccessor(d)))
    .attr('r', 4)
    .style('fill', (d) => colorScale(colorAccessor(d)))

  // 6. Draw peripherals
  const xAxisGenerator = d3.axisBottom().scale(xScale).ticks(4)
  const xAxis = bounds
    .append('g')
    .call(xAxisGenerator)
    .style('transform', `translateY(${dimensions.boundedHeight}px)`)
  const xAxisLabel = xAxis
    .append('text')
    .attr('class', 'x-axis-label')
    .attr('x', dimensions.boundedWidth / 2)
    .attr('y', dimensions.margin.bottom - 10)
    .html('Minimum Temperature (&deg;F)')
  const yAxisGenerator = d3.axisLeft().scale(yScale).ticks(4)
  const yAxis = bounds.append('g').call(yAxisGenerator)
  const yAxisLabel = yAxis
    .append('text')
    .attr('class', 'y-axis-label')
    .attr('x', -dimensions.boundedHeight / 2)
    .attr('y', -dimensions.margin.left + 10)
    .html('Maximum Temperature (&deg;F)')
  const legendGroup = bounds
    .append('g')
    .attr(
      'transform',
      `translate(${dimensions.boundedWidth - dimensions.legendWidth - 9},${
        dimensions.boundedHeight - 37
      })`,
    )
  const defs = wrapper.append('defs')
  const numberOfGradientStops = 10
  const stops = d3
    .range(numberOfGradientStops)
    .map((i) => i / (numberOfGradientStops - 1))
  const legendGradientId = 'legend-gradient'
  const gradient = defs
    .append('linearGradient')
    .attr('id', legendGradientId)
    .selectAll('stop')
    .data(stops)
    .join('stop')
    .attr('stop-color', (d) => d3.interpolateRainbow(-d))
    .attr('offset', (d) => `${d * 100}%`)
  const legendGradient = legendGroup
    .append('rect')
    .attr('height', dimensions.legendHeight)
    .attr('width', dimensions.legendWidth)
    .style('fill', `url(#${legendGradientId})`)
  const tickValues = [
    d3.timeParse('%m/%d/%Y')(`4/1/${colorScaleYear}`),
    d3.timeParse('%m/%d/%Y')(`7/1/${colorScaleYear}`),
    d3.timeParse('%m/%d/%Y')(`10/1/${colorScaleYear}`),
  ]
  const legendTickScale = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([0, dimensions.legendWidth])
  const legendValues = legendGroup
    .selectAll('.legend-value')
    .data(tickValues)
    .join('text')
    .attr('class', 'legend-value')
    .attr('x', legendTickScale)
    .attr('y', -6)
    .text(d3.timeFormat('%b'))
  const legendValueTicks = legendGroup
    .selectAll('.legend-tick')
    .data(tickValues)
    .join('line')
    .attr('class', 'legend-tick')
    .attr('x1', legendTickScale)
    .attr('x2', legendTickScale)
    .attr('y1', 6)

  // Bonus Part: draw marginal distributions
  const topHistogram = d3
    .histogram()
    .domain(xScale.domain())
    .value(xAccessor)
    .thresholds(40)
  const topHistogramBins = topHistogram(dataset)
  const topHistogramYScale = d3
    .scaleLinear()
    .domain([
      d3.min(topHistogramBins, (d) => d.length),
      d3.max(topHistogramBins, (d) => d.length),
    ])
    .range([dimensions.histogramHeight, 0])
  const topBounds = bounds
    .append('g')
    .attr(
      'transform',
      `translate(0, ${
        -dimensions.histogramHeight - dimensions.histogramMargin
      })`,
    )
  // draw the area
  topBounds
    .append('path')
    .attr(
      'd',
      d3
        .area()
        .x((d) => xScale((d.x0 + d.x1) / 2))
        .y0(dimensions.histogramHeight)
        .y1((d) => topHistogramYScale(d.length))
        .curve(d3.curveBasis)(topHistogramBins),
    )
    .attr('class', 'histogram-area')

  const rightHistogram = d3
    .histogram()
    .domain(yScale.domain())
    .value(yAccessor)
    .thresholds(40)
  const rightHistogramBins = rightHistogram(dataset)
  const rightHistogramYScale = d3
    .scaleLinear()
    .domain([
      d3.min(rightHistogramBins, (d) => d.length),
      d3.max(rightHistogramBins, (d) => d.length),
    ])
    .range([dimensions.histogramHeight, 0])
  const rightBounds = bounds
    .append('g')
    .attr('class', 'right-histogram')
    .style(
      'transform',
      `translate(${dimensions.boundedWidth + dimensions.histogramMargin}px, -${
        dimensions.histogramHeight
      }px) rotate(90deg)`,
    )
  rightBounds
    .append('path')
    .attr(
      'd',
      d3
        .area()
        .x((d) => yScale((d.x0 + d.x1) / 2))
        .y0(dimensions.histogramHeight)
        .y1((d) => rightHistogramYScale(d.length))
        .curve(d3.curveBasis)(rightHistogramBins),
    )
    .attr('class', 'histogram-area')

  // Set up interactions
  // create voronoi for tooltips
  const delaunay = d3.Delaunay.from(
    dataset,
    (d) => xScale(xAccessor(d)),
    (d) => yScale(yAccessor(d)),
  )
  const voronoiPolygons = delaunay.voronoi()
  voronoiPolygons.xmax = dimensions.boundedWidth
  voronoiPolygons.ymax = dimensions.boundedHeight
  const voronoi = dotsGroup
    .selectAll('.voronoi')
    .data(dataset)
    .join('path')
    .attr('class', 'voronoi')
    .attr('d', (d, i) => voronoiPolygons.renderCell(i))

  // add two mouse events in the tooltip
  voronoi
    .on('mouseenter', onVoronoiMouseEnter)
    .on('mouseleave', onVoronoiMouseLeave)
  const tooltip = d3.select('#tooltip')
  const hoverElementsGroup = bounds.append('g').attr('opacity', 0)

  const dayDot = hoverElementsGroup
    .append('circle')
    .attr('class', 'tooltip-dot')

  function onVoronoiMouseEnter(e, datum) {
    //Given the mouse event and a datum, you are asked to highlight the data by adding an addtioanl circle and display its information (such as date and temperature).
    hoverElementsGroup.style('opacity', 1)
    const x = xScale(xAccessor(datum))
    const y = yScale(yAccessor(datum))
    // highlight the selected dot
    dayDot
      .attr('cx', (d) => x)
      .attr('cy', (d) => y)
      .attr('r', 5)
    // format tooltip temperature
    const formatTemperature = d3.format('.1f')
    tooltip.select('#max-temperature').text(formatTemperature(yAccessor(datum)))
    tooltip.select('#min-temperature').text(formatTemperature(xAccessor(datum)))
    // format tooltip date
    const formatDate = d3.timeFormat('%A, %B %d, %Y')
    tooltip.select('#date').text(formatDate(parseDate(datum.date)))
    // align center and make it visible
    const tooltipX = xScale(xAccessor(datum)) + dimensions.margin.left
    const tooltipY = yScale(yAccessor(datum)) + dimensions.margin.top - 5
    tooltip.style(
      'transform',
      `translate(` +
        `calc( -50% + ${tooltipX}px),` +
        `calc(-100% + ${tooltipY}px)` +
        `)`,
    )
    tooltip.style('opacity', 1)
  }

  function onVoronoiMouseLeave() {
    hoverElementsGroup.style('opacity', 0)
    tooltip.style('opacity', 0)
  }

  // add two mouse actions on the legend
  legendGradient
    .on('mousemove', onLegendMouseMove)
    .on('mouseleave', onLegendMouseLeave)

  const legendHighlightBarWidth = dimensions.legendWidth * 0.05
  const legendHighlightGroup = legendGroup.append('g').attr('opacity', 0)
  const legendHighlightBar = legendHighlightGroup
    .append('rect')
    .attr('class', 'legend-highlight-bar')
    .attr('width', legendHighlightBarWidth)
    .attr('height', dimensions.legendHeight)

  const legendHighlightText = legendHighlightGroup
    .append('text')
    .attr('class', 'legend-highlight-text')
    .attr('x', legendHighlightBarWidth / 2)
    .attr('y', -6)

  // declare two bounds for the marginal distribution of the hovered part
  const hoveredTopBounds = topBounds.append('path')
  const hoveredRightBounds = rightBounds.append('path')

  function onLegendMouseMove(e) {
    const posX = d3.pointer(e)[0]   // get x position
    // calculate the date range
    const minDateToHighlight = new Date(
      legendTickScale.invert(posX - legendHighlightBarWidth),
    )
    const maxDateToHighlight = new Date(
      legendTickScale.invert(posX + legendHighlightBarWidth),
    )
    // calculate the legend bar position & display bar
    const barPos =
      posX - legendHighlightBarWidth / 2 < 0
        ? 0
        : posX - legendHighlightBarWidth / 2 >
          dimensions.legendWidth - legendHighlightBarWidth
        ? dimensions.legendWidth - legendHighlightBarWidth
        : posX - legendHighlightBarWidth / 2
    legendHighlightGroup
      .style('opacity', 1)
      .style('transform', `translateX(${barPos}px)`)
    const formatLegendDate = d3.timeFormat('%b %d')
    legendHighlightText.text(
      formatLegendDate(minDateToHighlight) +
        ' - ' +
        formatLegendDate(maxDateToHighlight),
    )
    legendValues.style('opacity', 0)
    legendValueTicks.style('opacity', 0)
    // make the unhovered dots transparent
    dots.transition().duration(100).style('opacity', 0.1).attr('r', 3)
    const getYear = (d) => +d3.timeFormat('%Y')(d)
    const isDayWithinRange = (d) => {
      const date = colorAccessor(d)
      if (getYear(minDateToHighlight) < colorScaleYear) {
        return (
          date >= new Date(minDateToHighlight).setYear(colorScaleYear) ||
          date <= maxDateToHighlight
        )
      } else if (getYear(maxDateToHighlight) > colorScaleYear) {
        return (
          date <= new Date(maxDateToHighlight).setYear(colorScaleYear) ||
          date >= minDateToHighlight
        )
      } else {
        return date >= minDateToHighlight && date <= maxDateToHighlight
      }
    }
    // highlight the hovered dots
    dots
      .filter(isDayWithinRange)
      .transition()
      .duration(100)
      .style('opacity', 1)
      .attr('r', 5)

    // draw the marginal distribution of the hovered dots
    const datesInRange = dataset.filter(isDayWithinRange)
    const date = d3.isoParse(legendTickScale.invert(posX))
    hoveredTopBounds
      .attr('d', (d) =>
        d3
          .area()
          .x((d) => xScale((d.x0 + d.x1) / 2))
          .y0(dimensions.histogramHeight)
          .y1((d) => topHistogramYScale(d.length))
          .curve(d3.curveBasis)(topHistogram(datesInRange)),
      )
      .attr('fill', colorScale(date))
      .attr('stroke', 'white')
      .style('opacity', 1)

    hoveredRightBounds
      .attr('d', (d) =>
        d3
          .area()
          .x((d) => yScale((d.x0 + d.x1) / 2))
          .y0(dimensions.histogramHeight)
          .y1((d) => rightHistogramYScale(d.length))
          .curve(d3.curveBasis)(rightHistogram(datesInRange)),
      )
      .attr('fill', colorScale(date))
      .attr('stroke', 'white')
      .style('opacity', 1)
  }

  function onLegendMouseLeave() {
    dotsGroup
      .selectAll('.dot')
      .transition()
      .duration(500)
      .style('opacity', 1)
      .attr('r', 4)

    legendValues.style('opacity', 1)
    legendValueTicks.style('opacity', 1)
    legendHighlightGroup.style('opacity', 0)
    hoveredTopBounds.style("opacity", 0)
    hoveredRightBounds.style("opacity", 0)
  }
}

drawScatter()
