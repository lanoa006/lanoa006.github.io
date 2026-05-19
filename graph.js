import { convertCurrencyHistory } from './currency.js'

const SCALE_FACTOR = 1.01

function formatLabel(dateString) {
    const date = new Date(dateString)

    const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    return formatter.format(date)
}

function reduceLabels(labels, values, maxTicks) {
    if (labels.length <= maxTicks) return { labels, values }

    const step = Math.ceil(labels.length / maxTicks)
    const reducedLabels = []
    const reducedValues = []

    for (let index = 0; index < labels.length; index += step) {
        reducedLabels.push(labels[index])
        reducedValues.push(values[index])
    }

    return {
        labels: reducedLabels,
        values: reducedValues
    }
}



export function createCurrencyPlot(currencyHistoryData) {
    const maximumItemsToDisplay = 1000
    const samplingStepSize = Math.ceil(currencyHistoryData.rates.length / maximumItemsToDisplay)

    const sampledValues = []
    const sampledDates = []

    for (let index = 0; index < currencyHistoryData.rates.length; index += samplingStepSize) {
        const ratePoint = currencyHistoryData.rates[index]
        sampledValues.push(ratePoint.value)
        sampledDates.push(ratePoint.date)
    }

    let minimumRateValue = Infinity
    let maximumRateValue = -Infinity

    let minimumTimestamp = Infinity
    let maximumTimestamp = -Infinity

    const chartDataPoints = []

    for (let index = 0; index < sampledValues.length; index++) {
        const value = sampledValues[index]
        const timestamp = new Date(sampledDates[index]).getTime()

        if (value < minimumRateValue) minimumRateValue = value
        if (value > maximumRateValue) maximumRateValue = value

        if (timestamp < minimumTimestamp) minimumTimestamp = timestamp
        if (timestamp > maximumTimestamp) maximumTimestamp = timestamp

        chartDataPoints.push({
            x: timestamp,
            y: value
        })
    }

    const formatDate = timestamp => {
        const date = new Date(timestamp)
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "2-digit"
        }).format(date)
    }

    const dayMilliseconds = 24 * 60 * 60 * 1000

    const weekendBackgroundPlugin = {
        id: "weekendBackground",
        beforeDraw: chart => {
            const { ctx, chartArea, scales } = chart
            const xAxis = scales.x
            if (!chartArea) return

            ctx.save()

            for (
                let currentTime = minimumTimestamp;
                currentTime < maximumTimestamp;
                currentTime += dayMilliseconds
            ) {
                const dayOfWeek = new Date(currentTime).getDay()

                if (dayOfWeek === 0 || dayOfWeek === 6) {
                    const startPixel = xAxis.getPixelForValue(currentTime)
                    const endPixel = xAxis.getPixelForValue(currentTime + dayMilliseconds)

                    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
                    ctx.fillRect(
                        startPixel,
                        chartArea.top,
                        endPixel - startPixel,
                        chartArea.bottom - chartArea.top
                    )
                }
            }

            ctx.restore()
        }
    }

    const canvasElement = document.createElement("canvas")
    const renderingContext = canvasElement.getContext("2d")
    canvasElement.style.width = "100%"

    const pointCount = sampledValues.length

    const tension =
        pointCount < 20 ? 0 :
        pointCount < 100 ? 0.15 :
        pointCount < 500 ? 0.25 :
        0.35

    const xPadding = (maximumTimestamp - minimumTimestamp) * 0.08
    const yPadding = (maximumRateValue - minimumRateValue) * 0.08
    
    new Chart(renderingContext, {
        type: "line",
        data: {
            datasets: [
                {
                    label: `${currencyHistoryData.base} ▶ ${currencyHistoryData.target}`,
                    data: chartDataPoints,
                    backgroundColor: "rgba(75, 192, 192, 0.15)",
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 2,
                    pointRadius: 0,
                    hoverRadius: 5,
                    hitRadius: 20,
                    tension,
                    parsing: false,
                    normalized: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 1,

            animation: {
                duration: 100,
                easing: "easeOutQuart"
            },

            interaction: {
                mode: "nearest",
                intersect: false
            },

            scales: {
                x: {
                    type: "linear",
                    min: minimumTimestamp - xPadding,
                    max: maximumTimestamp + xPadding,

                    afterBuildTicks: axis => {
                        const tickCount = 6
                        const step = (maximumTimestamp - minimumTimestamp) / (tickCount - 1)

                        axis.ticks = []

                        for (let tickIndex = 0; tickIndex < tickCount; tickIndex++) {
                            axis.ticks.push({
                                value: minimumTimestamp + step * tickIndex
                            })
                        }
                    },

                    ticks: {
                        callback: value => formatDate(Number(value)),
                        maxRotation: 0,
                        padding: 12
                    },

                    grid: {
                        display: false
                    }
                },

                y: {
                    min: minimumRateValue - yPadding,
                    max: maximumRateValue + yPadding,

                    ticks: {
                        callback: value => value.toFixed(4),
                        padding: 12
                    },

                    grid: {
                        display: true
                    }
                }
            },

            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: context => formatDate(context[0].parsed.x),
                        label: context => `Rate: ${context.parsed.y.toFixed(6)}`
                    }
                },
                legend: {
                    display: true
                },
                decimation: {
                    enabled: true,
                    algorithm: "lttb",
                    samples: 500
                }
            },

            elements: {
                point: {
                    radius: 0
                }
            }
        },
        plugins: [weekendBackgroundPlugin]
    })

    return canvasElement
}