const option1 = {
  title: {
    text: '周销售额趋势'
  },
  xAxis: {
    name: '第一周',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    name: '销售额',
    data: 'value'
  },
  series: [
    {
      data: [1200, 2230, 1900, 2100, 3500, 4200, 3985],
      type: 'bar',
      gradient: {
        color: ['rgba(251, 114, 147, .6)', 'rgba(251, 114, 147, .1)']
      },
      barStyle: {
        stroke: '#fb7293'
      }
    }
  ]
}

const option2 = {
  title: {
    text: '周销售额趋势'
  },
  xAxis: {
    name: '第二周',
    data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  },
  yAxis: {
    name: '销售额',
    data: 'value'
  },
  series: [
    {
      data: [2339, 1899, 2118, 1790, 3265, 4465, 3996],
      type: 'bar',
      gradient: {
        color: ['rgba(251, 114, 147, .6)', 'rgba(251, 114, 147, .1)'],
        local: false
      },
      barStyle: {
        stroke: '#fb7293'
      }
    }
  ]
}

export default [option1, option2]