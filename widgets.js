import {
    calculateLogReturns, calculateMean, calculateStandardDeviation,
    calculateLinearRegressionStrength,
    calculateDirectionBias, calculateMomentum
    } from './metrics.js'



function getLatestRateValue(latestCurrencyRates) {
    if (!latestCurrencyRates || latestCurrencyRates.length === 0) return null
    return latestCurrencyRates[latestCurrencyRates.length - 1].value
}



function generateMarketNarrative(values, volatility, regression, momentum) {
    const trend = regression.signedTrend

    let trendDescription = ""

    const absTrend = Math.abs(trend)

    if (absTrend > 0.75) {
        trendDescription = "Strong directional trend"
    } else if (absTrend > 0.45) {
        trendDescription = "Moderate trend"
    } else {
        trendDescription = "Weak or sideways market"
    }

    const directionDescription = trend >= 0 ? "upward bias" : "downward bias"

    let momentumDescription = ""

    if (momentum > 0.4) {
        momentumDescription = "strong accelerating momentum"
    } else if (momentum > 0.1) {
        momentumDescription = "positive momentum"
    } else if (momentum > -0.1) {
        momentumDescription = "neutral momentum"
    } else if (momentum > -0.4) {
        momentumDescription = "weakening momentum"
    } else {
        momentumDescription = "strong reversal pressure"
    }

    let volatilityDescription = ""

    if (volatility < 0.005) {
        volatilityDescription = "low volatility"
    } else if (volatility < 0.02) {
        volatilityDescription = "moderate volatility"
    } else {
        volatilityDescription = "high volatility"
    }

    return `${trendDescription}, ${directionDescription}, ${momentumDescription}, ${volatilityDescription}.`
}



export function createAnalyticsWidget(selectedBaseCurrency, selectedTargetCurrency, latestCurrencyRates) {
    const container = document.createElement("div")
    container.className = "card"

    const title = document.createElement("h3")
    title.textContent = "Market Analytics"

    if (!latestCurrencyRates || latestCurrencyRates.length < 10) {
        const empty = document.createElement("div")
        empty.textContent = "Not enough data"
        container.appendChild(title)
        container.appendChild(empty)
        return container
    }

    const values = latestCurrencyRates.map(point => point.value)

    const returns = calculateLogReturns(values)
    const volatility = calculateStandardDeviation(returns)
    const regression = calculateLinearRegressionStrength(values)
    const directionBias = calculateDirectionBias(values)
    const momentum = calculateMomentum(values)

    const startValue = values[0]
    const endValue = values[values.length - 1]
    const percentChange = ((endValue - startValue) / startValue) * 100

    function formatRow(label, value, icon) {
        const row = document.createElement("div")
        row.textContent = `${icon} ${label}: ${value}`
        return row
    }

    const narrative = document.createElement("div")
    narrative.textContent = generateMarketNarrative(values, volatility, regression, momentum)
    narrative.style.fontSize = "12px"
    narrative.style.opacity = "0.85"
    narrative.style.padding = "6px 0 10px 0"

    let volatilityIcon = "🟢"
    if (volatility > 0.02) volatilityIcon = "🟡"
    if (volatility > 0.05) volatilityIcon = "🔴"

    const trendIcon = regression.signedTrend >= 0 ? "📈" : "📉"
    const changeIcon = percentChange >= 0 ? "⬆️" : "⬇️"
    const biasIcon = directionBias >= 0.5 ? "📊" : "⚖️"
    const momentumIcon = momentum >= 0 ? "🚀" : "📉"

    const volatilityElement = formatRow(
        "Volatility",
        `${(volatility * 100).toFixed(2)}%`,
        volatilityIcon
    )

    const trendElement = formatRow(
        "Trend",
        `${(regression.signedTrend * 100).toFixed(1)}%`,
        trendIcon
    )

    const changeElement = formatRow(
        "Total Change",
        `${percentChange.toFixed(2)}%`,
        changeIcon
    )

    const biasElement = formatRow(
        "Upward Bias",
        `${(directionBias * 100).toFixed(1)}%`,
        biasIcon
    )

    const momentumElement = formatRow(
        "Momentum",
        `${(momentum * 100).toFixed(2)}%`,
        momentumIcon
    )

    container.appendChild(title)
    container.appendChild(narrative)
    container.appendChild(volatilityElement)
    container.appendChild(trendElement)
    container.appendChild(changeElement)
    container.appendChild(biasElement)
    container.appendChild(momentumElement)

    return container
}



export function createCalculatorWidget(selectedBaseCurrency, selectedTargetCurrency, latestCurrencyRates) {
    const calculatorContainer = document.createElement("div")
    calculatorContainer.className = "card"

    const titleElement = document.createElement("h3")
    titleElement.textContent = "Calculator"

    const rateDisplay = document.createElement("div")
    rateDisplay.id = "rateDisplay"
    rateDisplay.textContent = "Rate: -"

    const inputBaseAmount = document.createElement("input")
    inputBaseAmount.type = "number"
    inputBaseAmount.placeholder = selectedBaseCurrency || "Base amount"

    const inputTargetAmount = document.createElement("input")
    inputTargetAmount.type = "number"
    inputTargetAmount.placeholder = selectedTargetCurrency || "Target amount"

    let isUpdating = false

    function updateRateDisplay() {
        const rate = getLatestRateValue(latestCurrencyRates)
        if (!rate) return
        rateDisplay.textContent = `Rate: 1 ${selectedBaseCurrency} = ${rate.toFixed(6)} ${selectedTargetCurrency}`
    }

    inputBaseAmount.addEventListener("focus", () => {
        inputBaseAmount.value = ""
        inputTargetAmount.value = ""
    })

    inputBaseAmount.addEventListener("click", () => {
        inputBaseAmount.value = ""
        inputTargetAmount.value = ""
    })

    inputTargetAmount.addEventListener("focus", () => {
        inputBaseAmount.value = ""
        inputTargetAmount.value = ""
    })

    inputTargetAmount.addEventListener("click", () => {
        inputBaseAmount.value = ""
        inputTargetAmount.value = ""
    })

    inputBaseAmount.addEventListener("input", () => {
        if (isUpdating) return

        const rate = getLatestRateValue(latestCurrencyRates)
        if (!rate) return

        isUpdating = true

        const baseValue = Number(inputBaseAmount.value || 0)
        inputTargetAmount.value = (baseValue * rate).toFixed(2)

        isUpdating = false
    })

    inputTargetAmount.addEventListener("input", () => {
        if (isUpdating) return

        const rate = getLatestRateValue(latestCurrencyRates)
        if (!rate) return

        isUpdating = true

        const targetValue = Number(inputTargetAmount.value || 0)
        inputBaseAmount.value = (targetValue / rate).toFixed(2)

        isUpdating = false
    })

    calculatorContainer.appendChild(titleElement)
    calculatorContainer.appendChild(rateDisplay)
    calculatorContainer.appendChild(inputBaseAmount)
    calculatorContainer.appendChild(inputTargetAmount)

    updateRateDisplay()

    const observer = new MutationObserver(updateRateDisplay)
    observer.observe(graphContainer, { childList: true, subtree: true })

    return calculatorContainer
}