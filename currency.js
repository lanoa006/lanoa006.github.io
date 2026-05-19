const cache = {}



function saveToCache(baseCurrency, targetCurrency, rates) {
    const cacheKey = baseCurrency + "-" + targetCurrency

    cache[cacheKey] = cache[cacheKey] || {}

    for (let rateIndex = 0; rateIndex < rates.length; rateIndex++) {
        const date = rates[rateIndex].date
        const value = rates[rateIndex].value

        cache[cacheKey][date] = value
    }
}



function loadFromCache(baseCurrency, targetCurrency, dates) {
    const cacheKey = baseCurrency + "-" + targetCurrency

    if (!cache[cacheKey]) {
        return
    }

    let foundAllDates = true

    for (let dateIndex = 0; dateIndex < dates.length; dateIndex++) {
        if (!cache[cacheKey][dates[dateIndex]]) {
            foundAllDates = false
            break
        }
    }

    if (!foundAllDates) {
        return
    }

    const filledRates = dates.map(date => {
        const rate = cache[cacheKey][date]

        return {
            date,
            value: rate
        }
    })

    return filledRates
}



function getDateRange(start, end) {
    const dates = []
    let current = new Date(start)
    const last = new Date(end)

    while (current <= last) {
        dates.push(current.toISOString().split("T")[0])
        current.setDate(current.getDate() + 1)
    }

    return dates
}



export function convertCurrencyHistory(amount, base, target, startDate, endDate, callback) {
    const toDateObject = dateString => new Date(dateString + "T00:00:00")
    const formatDate = dateObject => dateObject.toISOString().slice(0, 10)

    const todayDate = new Date()

    let fetchStartDate = toDateObject(startDate)
    let fetchEndDate = toDateObject(endDate)

    fetchStartDate.setDate(fetchStartDate.getDate() - 3)
    fetchEndDate.setDate(fetchEndDate.getDate() + 3)

    if (fetchEndDate > todayDate) {
        fetchEndDate = todayDate
    }

    const fetchStartString = formatDate(fetchStartDate)
    const fetchEndString = formatDate(fetchEndDate)

    const getDateRange = (rangeStart, rangeEnd) => {
        const dates = []
        let currentDate = toDateObject(rangeStart)
        const endDateObject = toDateObject(rangeEnd)

        while (currentDate <= endDateObject) {
            dates.push(formatDate(currentDate))
            currentDate.setDate(currentDate.getDate() + 1)
        }

        return dates
    }

    const requestedDates = getDateRange(startDate, endDate)

    if (base === target) {
        return callback({
            base,
            target,
            amount,
            rates: requestedDates.map(date => ({
                date,
                value: amount
            }))
        })
    }

    const rates = loadFromCache(base, target, requestedDates)

    if (rates) {
        callback({
            base,
            target,
            amount,
            rates: rates
        })
        return
    }

    fetch(`https://api.frankfurter.dev/v1/${fetchStartString}..${fetchEndString}?from=${base}&to=${target}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response was not ok")
            }
            return response.json()
        })
        .then(data => {
            const rawRates = data.rates
            const sortedDates = Object.keys(rawRates).sort()

            let lastKnownRate = null

            const filledRates = requestedDates.map(date => {
                if (rawRates[date]) {
                    lastKnownRate = rawRates[date][target]
                    return {
                        date,
                        value: lastKnownRate * amount
                    }
                }

                if (lastKnownRate !== null) {
                    return {
                        date,
                        value: lastKnownRate * amount
                    }
                }

                const firstAvailableRate = rawRates[sortedDates[0]][target]

                return {
                    date,
                    value: firstAvailableRate * amount
                }
            })

            saveToCache(base, target, filledRates)

            callback({
                base,
                target,
                amount,
                rates: filledRates
            })
        })
        .catch(error => console.error("Fetch error:", error))
}



export function getCurrencyOptions(callback) {
    fetch(
        './currencies.json'
    ).then(response => {
        if (!response.ok) throw new Error('Network response was not ok')
        return response.json()
    }).then(data => callback(data))
}