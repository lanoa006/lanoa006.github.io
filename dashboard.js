import { getCurrencyOptions, convertCurrencyHistory } from './currency.js'
import { createCurrencyPlot } from './graph.js'
import { createAnalyticsWidget, createCalculatorWidget } from './widgets.js'

let selectedBaseCurrency = null
let selectedTargetCurrency = null
let latestCurrencyRates = null

let previousBaseCurrency = null
let previousTargetCurrency = null
let previousStartDate = null
let previousEndDate = null
let hasInitializedGraph = false

let selectedStartDate = null
let selectedEndDate = null

const applicationRoot = document.createElement("div")
applicationRoot.id = "app"
document.body.appendChild(applicationRoot)

const controlsContainer = document.createElement("div")
controlsContainer.id = "controls"

const mainContentContainer = document.createElement("div")
mainContentContainer.id = "mainContent"

const graphContainer = document.createElement("div")
graphContainer.id = "graphContainer"

const sidebarContainer = document.createElement("div")
sidebarContainer.id = "sidebar"

applicationRoot.appendChild(controlsContainer)
applicationRoot.appendChild(mainContentContainer)

mainContentContainer.appendChild(graphContainer)
mainContentContainer.appendChild(sidebarContainer)

const formatDate = (date) => date.toISOString().split("T")[0]

const getDefaultDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - 3)

    return {
        start: formatDate(startDate),
        end: formatDate(endDate)
    }
}



function showGraphLoading() {
    let overlay = document.getElementById("graphLoadingOverlay")

    if (!overlay) {
        overlay = document.createElement("div")
        overlay.id = "graphLoadingOverlay"

        const loadingBar = document.createElement("div")
        loadingBar.className = "loadingBar"

        overlay.appendChild(loadingBar)
        graphContainer.appendChild(overlay)
    }

    overlay.style.display = "flex"
}



function hideGraphLoading() {
    const overlay = document.getElementById("graphLoadingOverlay")
    if (overlay) overlay.style.display = "none"
}



function updateGraph() {
    if (!selectedBaseCurrency || !selectedTargetCurrency) return
    if (!selectedStartDate || !selectedEndDate) return

    showGraphLoading()

    if (
        hasInitializedGraph &&
        selectedBaseCurrency === previousBaseCurrency &&
        selectedTargetCurrency === previousTargetCurrency &&
        selectedStartDate === previousStartDate &&
        selectedEndDate === previousEndDate
    ) {
        hideGraphLoading()
        return
    }

    previousBaseCurrency = selectedBaseCurrency
    previousTargetCurrency = selectedTargetCurrency
    previousStartDate = selectedStartDate
    previousEndDate = selectedEndDate
    hasInitializedGraph = true

    convertCurrencyHistory(
        1,
        selectedBaseCurrency,
        selectedTargetCurrency,
        selectedStartDate,
        selectedEndDate,
        (data) => {
            const existingChart = document.getElementById("chart")
            if (existingChart) existingChart.remove()

            latestCurrencyRates = data.rates

            const chartElement = createCurrencyPlot(data)
            chartElement.id = "chart"
            graphContainer.appendChild(chartElement)

            sidebarContainer.innerHTML = ""
            sidebarContainer.appendChild(createCalculatorWidget(selectedBaseCurrency, selectedTargetCurrency, latestCurrencyRates))
            sidebarContainer.appendChild(createAnalyticsWidget(selectedBaseCurrency, selectedTargetCurrency, latestCurrencyRates))

            hideGraphLoading()
        }
    )
}

function createDatePicker(initialStart, initialEnd) {
    const MAX_OFFSET_FUTURE = 24 * 60 * 60 * 1000
    const MAX_OFFSET_PAST = 10000 * 24 * 60 * 60 * 1000

    const endInput = document.createElement("input")
    endInput.type = "date"
    endInput.min = formatDate(new Date(Date.now() - MAX_OFFSET_PAST))
    endInput.max = formatDate(new Date())
    endInput.value = initialEnd

    const startInput = document.createElement("input")
    startInput.type = "date" 
    startInput.min = formatDate(new Date(Date.now() - MAX_OFFSET_PAST))
    startInput.max = formatDate(new Date(Date.now() - MAX_OFFSET_FUTURE))
    startInput.value = formatDate(new Date(Math.min(Date.parse(initialStart), Date.parse(startInput.max))))

    function updateDates() {
        startInput.max = formatDate(new Date(new Date(endInput.value) - MAX_OFFSET_FUTURE))
        startInput.value = formatDate(new Date(Math.min(Date.parse(startInput.value), Date.parse(startInput.max))))
        
        selectedStartDate = startInput.value
        selectedEndDate = endInput.value

        updateGraph()
    }

    startInput.addEventListener("change", updateDates)
    endInput.addEventListener("change", updateDates)

    controlsContainer.appendChild(startInput)
    controlsContainer.appendChild(endInput)

    updateDates()
}

function createDropdown(id, options, onChange) {
    const validCurrencySet = new Set(options)

    const inputElement = document.createElement("input")
    inputElement.id = id
    inputElement.value = id == "baseCurrency" ? selectedBaseCurrency : selectedTargetCurrency
    inputElement.placeholder = id === "baseCurrency" ? "Base currency" : "Target currency"
    inputElement.autocomplete = "off"
    inputElement.setAttribute("list", id + "-list")

    const dataListElement = document.createElement("datalist")
    dataListElement.id = id + "-list"

    options.forEach(currencyCode => {
        const optionElement = document.createElement("option")
        optionElement.value = currencyCode
        dataListElement.appendChild(optionElement)
    })

    let lastValidValue = inputElement.value

    function tryUpdate(value) {
        const normalizedValue = value.toUpperCase()

        if (!validCurrencySet.has(normalizedValue)) return

        lastValidValue = normalizedValue
        inputElement.value = normalizedValue

        onChange(normalizedValue)
        updateGraph()
    }

    inputElement.addEventListener("input", () => {
        const rawValue = inputElement.value.trim().toUpperCase()
        if (!rawValue) return

        if (validCurrencySet.has(rawValue)) {
            tryUpdate(rawValue)
        }
    })

    inputElement.addEventListener("focus", () => {
        inputElement.value = ""
    })

    inputElement.addEventListener("focusout", () => {
        if (!inputElement.value.trim()) {
            inputElement.value = options[0]
            tryUpdate(options[0])
            return
        }

        if (!validCurrencySet.has(inputElement.value.toUpperCase())) {
            inputElement.value = lastValidValue
            return
        }

        tryUpdate(inputElement.value)
    })

    controlsContainer.appendChild(inputElement)
    controlsContainer.appendChild(dataListElement)
}

getCurrencyOptions((options) => {
    const currencies = options.currencies

    const defaultRange = getDefaultDateRange()

    selectedBaseCurrency = options.defaultBase
    selectedTargetCurrency = options.defaultTarget

    createDropdown("baseCurrency", currencies, value => selectedBaseCurrency = value)
    createDropdown("targetCurrency", currencies, value => selectedTargetCurrency = value)

    createDatePicker(defaultRange.start, defaultRange.end)
})