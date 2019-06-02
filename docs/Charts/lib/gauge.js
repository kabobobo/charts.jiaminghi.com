import { Updater } from '../class/updater.class'

import { gaugeConfig } from '../config/gauge'

import { deepClone, getCircleRadianPoint } from '@jiaminghi/c-render/lib/util'

import { deepMerge, initNeedSeries, radianToAngle } from '../util'

import { getRgbaValue } from '@jiaminghi/color'

export function gauge (chart, option = {}) {
  let { series } = option

  if (!series) series = []

  let gauges = initNeedSeries(series, gaugeConfig, 'gauge')

  gauges = calcGaugesCenter(gauges, chart)

  gauges = calcGaugesRadius(gauges, chart)

  gauges = calcGaugesDataRadiusAndLineWidth(gauges, chart)

  gauges = calcGaugesDataAngles(gauges, chart)

  gauges = calcGaugesDataGradient(gauges, chart)

  gauges = calcGaugesAxisTickPosition(gauges, chart)

  gauges = calcGaugesLabelPositionAndAlign(gauges, chart)

  gauges = calcGaugesLabelData(gauges, chart)

  gauges = calcGaugesDetailsPosition(gauges, chart)

  gauges = calcGaugesDetailsContent(gauges, chart)

  if (chart.gaugeAxisTick) {
    chart.gaugeAxisTick.update(gauges)
  } else {
    chart.gaugeAxisTick = new Updater({
      chart,
      key: 'gaugeAxisTick',
      getGraphConfig: getAxisTickConfig
    }, gauges)
  }

  if (chart.gaugeAxisLabel) {
    chart.gaugeAxisLabel.update(gauges)
  } else {
    chart.gaugeAxisLabel = new Updater({
      chart,
      key: 'gaugeAxisLabel',
      getGraphConfig: getAxisLabelConfig
    }, gauges)
  }

  if (chart.gaugeBackgroundArc) {
    chart.gaugeBackgroundArc.update(gauges)
  } else {
    chart.gaugeBackgroundArc = new Updater({
      chart,
      key: 'gaugeBackgroundArc',
      getGraphConfig: getBackgroundArcConfig,
      getStartGraphConfig: getStartBackgroundArcConfig
    }, gauges)
  }

  if (chart.gaugeArc) {
    chart.gaugeArc.update(gauges)
  } else {
    chart.gaugeArc = new Updater({
      chart,
      key: 'gaugeArc',
      getGraphConfig: getArcConfig,
      getStartGraphConfig: getStartArcConfig
    }, gauges)
  }

  if (chart.gaugePointer) {
    chart.gaugePointer.update(gauges)
  } else {
    chart.gaugePointer = new Updater({
      chart,
      key: 'gaugePointer',
      getGraphConfig: getPointerConfig,
      getStartGraphConfig: getStartPointerConfig
    }, gauges)
  }

  if (chart.gaugeDetails) {
    chart.gaugeDetails.update(gauges)
  } else {
    chart.gaugeDetails = new Updater({
      chart,
      key: 'gaugeDetails',
      getGraphConfig: getDetailsConfig
    }, gauges)
  }
}

function calcGaugesCenter (gauges, chart) {
  const { area } = chart.render

  gauges.forEach(gaugeItem => {
    let { center } = gaugeItem

    center = center.map((pos, i) => {
      if (typeof pos === 'number') return pos

      return parseInt(pos) / 100 * area[i]
    })

    gaugeItem.center = center
  })

  return gauges
}

function calcGaugesRadius (gauges, chart) {
  const { area } = chart.render

  const maxRadius = Math.min(...area) / 2

  gauges.forEach(gaugeItem => {
    let { radius } = gaugeItem

    if (typeof radius !== 'number') {
      radius = parseInt(radius) / 100 * maxRadius
    }

    gaugeItem.radius = radius
  })

  return gauges
}

function calcGaugesDataRadiusAndLineWidth (gauges, chart) {
  const { area } = chart.render

  const maxRadius = Math.min(...area)

  gauges.forEach(gaugeItem => {
    const { radius, data, arcLineWidth } = gaugeItem

    data.forEach(item => {
      let { radius: arcRadius, lineWidth } = item

      if (!arcRadius) arcRadius = radius

      if (typeof arcRadius !== 'number') arcRadius = parseInt(arcRadius) / 100 * maxRadius

      item.radius = arcRadius

      if (!lineWidth) lineWidth = arcLineWidth

      item.lineWidth = lineWidth
    })
  })

  return gauges
}

function calcGaugesDataAngles (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { startAngle, endAngle, data, min, max } = gaugeItem
    
    const angleMinus = startAngle - endAngle
    const valueMinus = max - min

    data.forEach(item => {
      const { value } = item

      const itemAngle = Math.abs((value - min) / valueMinus * angleMinus)

      item.startAngle = startAngle
      item.endAngle = startAngle + itemAngle
    })
  })

  return gauges
}

function calcGaugesDataGradient (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { data } = gaugeItem

    data.forEach(item => {
      let { color, gradient } = item

      if (!gradient || !gradient.length) gradient = color

      if (!(gradient instanceof Array)) gradient = [gradient]

      item.gradient = gradient
    })
  })

  return gauges
}

function calcGaugesAxisTickPosition (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { startAngle, endAngle, splitNum, center, radius, arcLineWidth, axisTick } = gaugeItem

    const { tickLength, style: { lineWidth } } = axisTick

    const angles = endAngle - startAngle

    const outerRadius = radius - (arcLineWidth / 2)
    const innerRadius = outerRadius - tickLength

    const angleGap = angles / (splitNum - 1)

    const arcLength = 2 * Math.PI * radius * angles / (Math.PI * 2)

    const offset = Math.ceil(lineWidth / 2) / arcLength * angles

    gaugeItem.tickAngles = []
    gaugeItem.tickInnerRadius = []

    gaugeItem.tickPosition = new Array(splitNum).fill(0)
      .map((foo, i) => {
        let angle = startAngle + angleGap * i

        if (i === 0) angle += offset
        if (i === splitNum - 1) angle -= offset

        gaugeItem.tickAngles[i] = angle
        gaugeItem.tickInnerRadius[i] = innerRadius

        return [
          getCircleRadianPoint(...center, outerRadius, angle),
          getCircleRadianPoint(...center, innerRadius, angle)
        ]
      })
  })

  return gauges
}

function calcGaugesLabelPositionAndAlign (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { center, tickInnerRadius, tickAngles, axisLabel: { labelGap } } = gaugeItem

    const position = tickAngles.map((angle, i) => getCircleRadianPoint(
      ...center,
      tickInnerRadius[i] - labelGap,
      tickAngles[i]
    ))

    const align = position.map(([x, y]) => ({
      textAlign: x > center[0] ? 'right' : 'left',
      textBaseline: y > center[1] ? 'bottom' : 'top'
    }))

    gaugeItem.labelPosition = position
    gaugeItem.labelAlign = align
  })

  return gauges
}

function calcGaugesLabelData (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { axisLabel, min, max, splitNum } = gaugeItem

    let { data, formatter } = axisLabel

    const valueGap = (max - min) / (splitNum - 1)

    const value = new Array(splitNum).fill(0).map((foo, i) => parseInt(min + valueGap * i))

    const formatterType = typeof formatter

    data = deepMerge(value, data).map((v, i) => {
      let label = v

      if (formatterType === 'string') {
        label = formatter.replace('{value}', v)
      }

      if (formatterType === 'function') {
        label = formatter({ value: v, index: i })
      }

      return label
    })

    axisLabel.data = data
  })

  return gauges
}

function calcGaugesDetailsPosition (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { data, details, center } = gaugeItem

    const { position, offset } = details

    const detailsPosition = data.map(({ startAngle, endAngle, radius }) => {
      let point = null

      if (position === 'center') {
        point = center
      } else if (position === 'start') {
        point = getCircleRadianPoint(...center, radius, startAngle)
      } else if (position === 'end') {
        point = getCircleRadianPoint(...center, radius, endAngle)
      }

      return getOffsetedPoint(point, offset)
    })

    gaugeItem.detailsPosition = detailsPosition
  })

  return gauges
}

function calcGaugesDetailsContent (gauges, chart) {
  gauges.forEach(gaugeItem => {
    const { data, details } = gaugeItem

    const { formatter } = details

    const formatterType = typeof formatter

    const contents = data.map(dataItem => {
      let content = dataItem.value

      if (formatterType === 'string') {
        content = formatter.replace('{value}', dataItem.value)
        content = content.replace('{name}', dataItem.name)
      }

      if (formatterType === 'function') content = formatter(dataItem)

      return content.toString()
    })

    gaugeItem.detailsContent = contents
  })

  return gauges
}

function getOffsetedPoint ([x, y], [ox, oy]) {
  return [x + ox, y + oy]
}

function getAxisTickConfig (gaugeItem) {
  const { tickPosition, animationCurve, animationFrame } = gaugeItem

  return tickPosition.map((foo, i) => ({
    name: 'polyline',
    visible: gaugeItem.axisTick.show,
    animationCurve,
    animationFrame,
    shape: getAxisTickShape(gaugeItem, i),
    style: getAxisTickStyle(gaugeItem, i)
  }))
}

function getAxisTickShape (gaugeItem, i) {
  const { tickPosition } = gaugeItem

  return { points: tickPosition[i] }
}

function getAxisTickStyle (gaugeItem, i) {
  const { axisTick: { style } } = gaugeItem

  return style
}

function getAxisLabelConfig (gaugeItem) {
  const { labelPosition, animationCurve, animationFrame } = gaugeItem

  return labelPosition.map((foo, i) => ({
    name: 'text',
    visible: gaugeItem.axisLabel.show,
    animationCurve,
    animationFrame,
    shape: getAxisLabelShape(gaugeItem, i),
    style: getAxisLabelStyle(gaugeItem, i)
  }))
}

function getAxisLabelShape (gaugeItem, i) {
  const { labelPosition, axisLabel: { data } } = gaugeItem

  return {
    content: data[i].toString(),
    position: labelPosition[i]
  }
}

function getAxisLabelStyle (gaugeItem, i) {
  const { labelAlign, axisLabel } = gaugeItem

  const { style } = axisLabel

  return deepMerge({ ...labelAlign[i] }, style)
}

function getBackgroundArcConfig (gaugeItem) {
  const { animationCurve, animationFrame } = gaugeItem

  return [{
    name: 'arc',
    visible: gaugeItem.backgroundArc.show,
    animationCurve,
    animationFrame,
    shape: getGaugeBackgroundArcShape(gaugeItem),
    style: getGaugeBackgroundArcStyle(gaugeItem)
  }]
}

function getGaugeBackgroundArcShape (gaugeItem) {
  let { startAngle, endAngle, center, radius } = gaugeItem

  return {
    rx: center[0],
    ry: center[1],
    r: radius,
    startAngle,
    endAngle
  }
}

function getGaugeBackgroundArcStyle (gaugeItem) {
  const { backgroundArc, arcLineWidth } = gaugeItem

  const { style } = backgroundArc

  return deepMerge({ lineWidth: arcLineWidth }, style)
}

function getStartBackgroundArcConfig (gaugeItem) {
  const config = getBackgroundArcConfig(gaugeItem)[0]

  const shape = { ...config.shape }

  shape.endAngle = config.shape.startAngle

  config.shape = shape

  return [config]
}

function getArcConfig (gaugeItem) {
  const { data, animationCurve, animationFrame } = gaugeItem

  return data.map((foo, i) => ({
    name: 'agArc',
    animationCurve,
    animationFrame,
    shape: getGaugeArcShape(gaugeItem, i),
    style: getGaugeArcStyle(gaugeItem, i)
  }))
}

function getGaugeArcShape (gaugeItem, i) {
  let { data, center, endAngle: gradientEndAngle } = gaugeItem

  const { radius, startAngle, endAngle, localGradient } = data[i]

  if (localGradient) gradientEndAngle = endAngle

  return {
    rx: center[0],
    ry: center[1],
    r: radius,
    startAngle,
    endAngle,
    gradientEndAngle
  }
}

function getGaugeArcStyle (gaugeItem, i) {
  const { data, dataItemStyle } = gaugeItem

  let { lineWidth, gradient } = data[i]

  gradient = gradient.map(c => getRgbaValue(c))

  return deepMerge({ lineWidth, gradient }, dataItemStyle)
}

function getStartArcConfig (gaugeItem) {
  const configs = getArcConfig(gaugeItem)

  configs.map(config => {
    const shape = { ...config.shape }

    shape.endAngle = config.shape.startAngle

    config.shape = shape
  })

  return configs
}

function getPointerConfig (gaugeItem) {
  const { animationCurve, animationFrame, center } = gaugeItem

  return [{
    name: 'polyline',
    visible: gaugeItem.pointer.show,
    animationCurve,
    animationFrame,
    shape: getPointerShape(gaugeItem),
    style: getPointerStyle(gaugeItem),
    setGraphCenter (foo, graph) { graph.style.graphCenter = center }
  }]
}

function getPointerShape (gaugeItem) {
  const { center } = gaugeItem

  return {
    points: getPointerPoints(center),
    close: true
  }
}

function getPointerStyle (gaugeItem) {
  const { startAngle, endAngle, min, max, data, pointer, center } = gaugeItem

  const { valueIndex, style } = pointer

  let value = data[valueIndex] ? data[valueIndex].value : 0

  const angle = (value - min) / (max - min) * (endAngle - startAngle) + startAngle + Math.PI / 2

  return deepMerge({ rotate: radianToAngle(angle), scale: [1, 1], graphCenter: center }, style)
}

function getPointerPoints ([x, y]) {
  const point1 = [x, y - 40]
  const point2 = [x + 5, y]
  const point3 = [x, y + 10]
  const point4 = [x - 5, y]

  return [point1, point2, point3, point4]
}

function getStartPointerConfig (gaugeItem) {
  const { startAngle } = gaugeItem

  const config = getPointerConfig(gaugeItem)[0]

  config.style.rotate = radianToAngle(startAngle + Math.PI / 2)

  return [config]
}

function getDetailsConfig (gaugeItem) {
  const { detailsPosition, animationCurve, animationFrame } = gaugeItem

  const visible = gaugeItem.details.show

  return detailsPosition.map((foo, i) => ({
    name: 'text',
    visible,
    animationCurve,
    animationFrame,
    shape: getDetailsShape(gaugeItem, i),
    style: getDetailsStyle(gaugeItem, i)
  }))
}

function getDetailsShape (gaugeItem, i) {
  const { detailsPosition, detailsContent } = gaugeItem

  const position = detailsPosition[i]
  const content = detailsContent[i]

  return {
    content,
    position
  }
}

function getDetailsStyle (gaugeItem, i) {
  const { details, data } = gaugeItem

  const { style } = details

  const { color } = data[i]

  return deepMerge({ fill: color }, style)
}