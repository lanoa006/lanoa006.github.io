export function calculateLogReturns(values) {
    const returns = []

    for (let index = 1; index < values.length; index++) {
        returns.push(Math.log(values[index] / values[index - 1]))
    }

    return returns
}



export function calculateMean(values) {
    let sum = 0

    for (let index = 0; index < values.length; index++) {
        sum += values[index]
    }

    return sum / values.length
}



export function calculateStandardDeviation(values) {
    const mean = calculateMean(values)

    let varianceSum = 0

    for (let index = 0; index < values.length; index++) {
        const difference = values[index] - mean
        varianceSum += difference * difference
    }

    return Math.sqrt(varianceSum / values.length)
}



export function calculateLinearRegressionStrength(values) {
    const n = values.length

    if (n < 2) {
        return { slope: 0, strength: 0, signedTrend: 0 }
    }

    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    for (let index = 0; index < n; index++) {
        const x = index
        const y = values[index]

        sumX += x
        sumY += y
        sumXY += x * y
        sumXX += x * x
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)

    const meanY = sumY / n

    let totalVariance = 0
    let explainedVariance = 0

    for (let index = 0; index < n; index++) {
        const y = values[index]
        const predicted = meanY + slope * (index - sumX / n)

        totalVariance += Math.pow(y - meanY, 2)
        explainedVariance += Math.pow(predicted - meanY, 2)
    }

    const strength = totalVariance === 0 ? 0 : explainedVariance / totalVariance

    const signedTrend = strength * (slope >= 0 ? 1 : -1)

    return { slope, strength, signedTrend }
}



export function calculateDirectionBias(values) {
    let up = 0
    let down = 0

    for (let index = 1; index < values.length; index++) {
        if (values[index] > values[index - 1]) up++
        else if (values[index] < values[index - 1]) down++
    }

    return up / (up + down || 1)
}



export function calculateMomentum(values) {
    const returns = []

    for (let index = 1; index < values.length; index++) {
        returns.push(Math.log(values[index] / values[index - 1]))
    }

    if (returns.length < 5) return 0

    const windowSize = Math.floor(returns.length / 3)

    const recent = returns.slice(-windowSize)
    const earlier = returns.slice(0, returns.length - windowSize)

    const recentMean = calculateMean(recent)
    const earlierMean = calculateMean(earlier)

    const volatility = calculateStandardDeviation(returns) + 1e-9

    const rawMomentum = (recentMean - earlierMean) / volatility

    return rawMomentum
}