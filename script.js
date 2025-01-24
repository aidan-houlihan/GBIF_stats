const datasetUUIDs = {
    'Entomology': ['20524cf7-66f8-49d2-a274-102e1090e502', '0475db1b-e6f9-4418-9248-845e64047da8'],
    'Herbarium': 'f873ef66-231a-4ea3-bd4d-a16f182bf337',
    'Bryophytes': '039c9aba-2f77-4001-a72a-40b9fa830ab4',
    'Algae': '63e79196-626f-41a5-9871-0c29135ccd09',
    'Lichens': '38bdc3d6-9748-4f72-9d5f-55ffd573b5d1',
    'Mycology': 'd01d75ac-09d3-464f-8b0f-0a4ddecd6c10',
    'Malacology': '86b50d88-f762-11e1-a439-00145eb45e9a',
    'Ornithology': '8658262c-f762-11e1-a439-00145eb45e9a',
    'Ichthyology': 'de22e531-395a-468b-8830-bd1a8ad04673',
    'Herpetology': '86594bf6-f762-11e1-a439-00145eb45e9a',
    'VertPaelo': 'eaa45b10-2445-427b-b03c-a1e97b2c7087',
    'InvertPaelo': 'ec3805da-46a8-433b-bebc-20fed11f9e1e',
    'ANSP_Publisher': 'f9b67ad0-9c9b-11d9-b9db-b8a03c50a862'
};

const datasetVars = {};
let allStatistics = [];

document.addEventListener('DOMContentLoaded', () => {
    const datasetCheckboxes = document.getElementById('dataset-checkboxes');
    for (const datasetName in datasetUUIDs) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = datasetName;
        checkbox.name = datasetName;
        datasetVars[datasetName] = checkbox;

        const label = document.createElement('label');
        label.htmlFor = datasetName;
        label.textContent = datasetName;

        datasetCheckboxes.appendChild(checkbox);
        datasetCheckboxes.appendChild(label);
        datasetCheckboxes.appendChild(document.createElement('br'));
    }

    document.getElementById('select-all').addEventListener('change', (event) => {
        const selectAll = event.target.checked;
        for (const checkbox of Object.values(datasetVars)) {
            checkbox.checked = selectAll;
        }
    });
});

async function getDownloadStatistics(startDate, endDate, datasetUUID) {
    const url = `https://api.gbif.org/v1/occurrence/download/statistics?fromDate=${startDate}&toDate=${endDate}&datasetKey=${datasetUUID}`;
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        return data.results;
    } else {
        return `Error: ${response.status}`;
    }
}

async function fetchStatistics(startDate, endDate, selectedDatasets) {
    allStatistics.length = 0;
    for (const datasetName of selectedDatasets) {
        const datasetUUIDsList = Array.isArray(datasetUUIDs[datasetName]) ? datasetUUIDs[datasetName] : [datasetUUIDs[datasetName]];
        const datasetStats = [];
        for (const datasetUUID of datasetUUIDsList) {
            const statistics = await getDownloadStatistics(startDate, endDate, datasetUUID);
            if (Array.isArray(statistics)) {
                for (const stats of statistics) {
                    stats.dataset_name = datasetName;
                    datasetStats.push(stats);
                }
            }
        }

        if (datasetStats.length === 0) {
            datasetStats.push({ dataset_name: datasetName, year: 'N/A', month: 'N/A', totalRecords: 0, numberDownloads: 0 });
        }

        allStatistics.push(...datasetStats);
    }

    const combinedEntomologyStats = {};
    for (const stats of allStatistics) {
        if (stats.dataset_name === 'Entomology') {
            const monthYear = `${stats.month}-${stats.year}`;
            if (!combinedEntomologyStats[monthYear]) {
                combinedEntomologyStats[monthYear] = {
                    dataset_name: 'Entomology',
                    month: stats.month,
                    year: stats.year,
                    totalRecords: 0,
                    numberDownloads: 0
                };
            }
            combinedEntomologyStats[monthYear].totalRecords += stats.totalRecords;
            combinedEntomologyStats[monthYear].numberDownloads += stats.numberDownloads;
        }
    }

    allStatistics = allStatistics.filter(stats => stats.dataset_name !== 'Entomology');
    allStatistics.push(...Object.values(combinedEntomologyStats));
}

async function viewStatistics() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const selectedDatasets = Object.keys(datasetVars).filter(dataset => datasetVars[dataset].checked);

    if (!startDate || !endDate) {
        alert("Please enter both start and end dates.");
        return;
    }

    if (selectedDatasets.length === 0) {
        alert("Please select at least one dataset.");
        return;
    }

    await fetchStatistics(startDate, endDate, selectedDatasets);

    const output = document.getElementById('output');
    output.textContent = '';
    const header = `Year      Month     Total Records       Number of Downloads\n`;
    for (const datasetName of selectedDatasets) {
        output.textContent += `Dataset: ${datasetName}\n`;
        output.textContent += header;
        for (const stats of allStatistics) {
            if (stats.dataset_name === datasetName) {
                output.textContent += `${String(stats.year).padEnd(10)}${String(stats.month).padEnd(10)}${String(stats.totalRecords).padEnd(20)}${String(stats.numberDownloads).padEnd(20)}\n`;
            }
        }
        output.textContent += `\n`;
    }
}

async function saveStatistics() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const selectedDatasets = Object.keys(datasetVars).filter(dataset => datasetVars[dataset].checked);

    if (!startDate || !endDate) {
        alert("Please enter both start and end dates.");
        return;
    }

    if (selectedDatasets.length === 0) {
        alert("Please select at least one dataset.");
        return;
    }

    await fetchStatistics(startDate, endDate, selectedDatasets);

    const fileContent = [];
    const header = `Dataset,Year,Month,Total Records,Number of Downloads\n`;
    fileContent.push(header);
    for (const datasetName of Object.keys(datasetVars)) {
        for (const stats of allStatistics) {
            if (stats.dataset_name === datasetName) {
                fileContent.push(`${datasetName},${String(stats.year)},${String(stats.month)},${String(stats.totalRecords)},${String(stats.numberDownloads)}\n`);
            }
        }
    }

    const blob = new Blob([fileContent.join('')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    a.href = url;
    a.download = `download_statistics_${currentDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
