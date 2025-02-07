'use strict';
const NOW = {
  epoch: new Date(),
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  date: new Date().getDate(),
};

Date.prototype.addTime = function(timeType, timeOffset) {
  let result = new Date(this);
  result[`set${timeType}`](result[`get${timeType}`]() + timeOffset);
  return result;
};

Date.prototype.daysInThisMonth = function() {
  return new Date(this.getFullYear(), this.getMonth() + 1, 0).getDate();
};

const numOfMonthFetched = 48;

const getDateKeyFromEpoch = (date) =>
  date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

const getDetailedDateLabelFromEpoch = (date) =>
  `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

const getDateLabelFromDateKey = (key) => `${Math.floor((key % 10000) / 100)}/${key % 100}`;

let fetchReadyState = Array(numOfMonthFetched).fill(false);
let hourView = [];
let monthView = [...Array(numOfMonthFetched / 12 + 1)].map(() => [...Array(12)].map(() => 0));
let timeFormatState = 'day';
let fromTimeState = 0;
let isFinishFetch = false;
let tryFinishFetchCounter = 0;

const timeFormatBtnWrap = document.querySelector('.time_format_btn_wrap');
timeFormatBtnWrap.addEventListener('click', function(e) {
  if (e.target.classList.contains('time_format_btn-select')) return;

  for (let child of this.children) {
    if (child !== e.target) {
      child.classList.remove('time_format_btn-select');
    } else {
      child.classList.add('time_format_btn-select');
    }
  }
  changeTimeFormatState(e.target.dataset.timeformat);
});

function changeTimeFormatState(newTimeFormat) {
  timeFormatState = newTimeFormat;
  if (hourView[fromTimeState] !== undefined) {
    backwardTimeBtn.classList.remove('change_time_btn-prohibit');
  }
  renderHandler[timeFormatState](fromTimeState);
}

const forwardTimeBtn = document.querySelector('.forward_time_btn');
forwardTimeBtn.addEventListener('click', forwardTimeHandler);

const backwardTimeBtn = document.querySelector('.backward_time_btn');
backwardTimeBtn.addEventListener('click', backwardTimeHandler);

function forwardTimeHandler() {
  if (
    this.classList.contains('change_time_btn-prohibit') &&
    hourView[fromTimeState] === undefined
  ) {
    return;
  }

  if (timeFormatState === 'hour') {
    fromTimeState -= 24;
  } else if (timeFormatState === 'day') {
    fromTimeState -= 24 * 7;
  } else if (timeFormatState === 'week') {
    fromTimeState -= 24 * 7 * 8;
  } else if (timeFormatState === 'month') {
    fromTimeState -= 24 * 30 * 6;
  } else if (timeFormatState === 'year') {
    fromTimeState -= 24 * 30 * 12;
  }
  if (fromTimeState <= 0) {
    fromTimeState = 0;
    forwardTimeBtn.classList.add('change_time_btn-prohibit');
  }
  if (hourView[fromTimeState] !== undefined) {
    backwardTimeBtn.classList.remove('change_time_btn-prohibit');
  }
  renderHandler[timeFormatState](fromTimeState);
}

function backwardTimeHandler() {
  if (this.classList.contains('change_time_btn-prohibit')) return;

  if (timeFormatState === 'hour') {
    fromTimeState += 24;
  } else if (timeFormatState === 'day') {
    fromTimeState += 24 * 7;
  } else if (timeFormatState === 'week') {
    fromTimeState += 24 * 7 * 8;
  } else if (timeFormatState === 'month') {
    fromTimeState += 24 * 30 * 6;
  } else if (timeFormatState === 'year') {
    fromTimeState += 24 * 30 * 12;
  }
  if (fromTimeState > 0) {
    forwardTimeBtn.classList.remove('change_time_btn-prohibit');
  }
  if (hourView[fromTimeState] === undefined) {
    backwardTimeBtn.classList.add('change_time_btn-prohibit');
    return;
  }
  renderHandler[timeFormatState](fromTimeState);
}

init();
const renderHandler = {
  hour: function(hourIdx) {
    let labels = [];
    let data = [];
    for (let idx = 0; idx < 24; idx++) {
      if (hourView[hourIdx + idx] === undefined) {
        backwardTimeBtn.classList.add('change_time_btn-prohibit');
        break;
      }
      let [timeStamp, views] = hourView[hourIdx + idx];
      let label = `${23 - idx}:00 - ${23 - idx + 1}:00 (${timeStamp.getMonth() +
        1}/${timeStamp.getDate()})`;
      labels.push(label);
      data.push(views);
    }

    renderBarChart(labels.reverse(), data.reverse(), hourView[fromTimeState][0]);
  },
  day: function(hourIdx) {
    let labels = [];
    let data = [];
    for (let idx = 0; idx < 24 * 7; idx++) {
      if (hourView[hourIdx + idx] === undefined) {
        backwardTimeBtn.classList.add('change_time_btn-prohibit');
        break;
      }
      let [timeStamp, views] = hourView[hourIdx + idx];
      if (idx % 24 === 0) {
        let label = `${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;
        labels.push(label);
        data.push(0);
      }
      data[data.length - 1] += views;
    }

    renderBarChart(labels.reverse(), data.reverse(), hourView[fromTimeState][0]);
  },
  week: function(hourIdx) {
    let labels = [];
    let data = [];
    for (let idx = 0; idx < 24 * 7 * 8; idx++) {
      if (hourView[hourIdx + idx] === undefined) {
        backwardTimeBtn.classList.add('change_time_btn-prohibit');
        break;
      }
      let [timeStamp, views] = hourView[hourIdx + idx];
      if (idx % (24 * 7) === 0) {
        let label =
          `${timeStamp.addTime('Date', -6).getMonth() + 1}/${timeStamp
            .addTime('Date', -6)
            .getDate()}` +
          ` - ` +
          `${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;

        labels.push(label);
        data.push(0);
      }
      data[data.length - 1] += views;
    }

    renderBarChart(labels.reverse(), data.reverse(), hourView[fromTimeState][0]);
  },
  month: function(hourIdx) {
    let labels = [];
    let data = [];
    let curTime = hourView[hourIdx][0];

    for (let idx = 0; idx < 6; idx++) {
      let label = `${curTime}`.split(' ')[1];
      labels.push(label);
      data.push(monthView[NOW.year - curTime.getFullYear()][curTime.getMonth()]);
      curTime = curTime.addTime('Month', -1);
    }

    renderBarChart(labels.reverse(), data.reverse(), hourView[fromTimeState][0]);
  },
  year: function(hourIdx) {
    let labels = [];
    let data = [];
    let curTime = hourView[hourIdx][0];
    for (let idx = 0; idx < 3; idx++) {
      let label = `${curTime}`.split(' ')[3];
      labels.push(label);
      data.push(monthView[NOW.year - curTime.getFullYear()].reduce((acc, cur) => acc + cur));
      curTime = curTime.addTime('FullYear', -1);
    }

    renderBarChart(labels.reverse(), data.reverse(), hourView[fromTimeState][0]);
  },
};
const ctx = document.getElementById('hourStatsChart').getContext('2d');
let chart;

function renderBarChart(labels, data, timeStamp) {
  document.getElementById('hourStatsChart').style.display = 'block';
  document.querySelector('#hourStats_loader').style.display = 'none';
  if (chart) {
    chart.data.datasets[0].data = data;
    chart.data.labels = labels;
    chart.options.title.text = timeStamp.getFullYear();
    chart.update();
    return;
  }
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Views',
          borderColor: '#6eb799',
          backgroundColor: 'rgba(104, 172, 144, 0.9)',
          data: data,
        },
      ],
    },

    options: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: timeStamp.getFullYear(),
        position: 'bottom',
      },
      tooltips: {
        displayColors: false,
        callbacks: {
          title: function(tooltipItem, data) {
            return data.labels[tooltipItem[0].index];
          },
          label: function(tooltipItem, data) {
            return 'Views: ' + data.datasets[0].data[tooltipItem.index].toLocaleString();
          },
        },
      },

      scales: {
        xAxes: [
          {
            ticks: {
              callback: function(t) {
                return t.split(' - ')[0];
              },
            },
          },
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              callback: function(value) {
                return value.toLocaleString();
              },
            },
          },
        ],
      },
    },
  });
}

function init() {
  let sumByHour = [...Array(24)].fill(0);
  let sumByDay = [...Array(7)].fill(0);

  fetchStoriesHourStats(NOW.epoch);
  function fetchStoriesHourStats(fromTime) {
    if (tryFinishFetchCounter > 1) {
      isFinishFetch = true;
      return;
    }
    for (let idx = 0; idx < numOfMonthFetched; idx++) {
      if (!fetchReadyState[idx] && fromTime < new Date(NOW.year, NOW.month - idx, NOW.date)) {
        fetchReadyState[idx] = true;
        if (idx === 0) renderHandler['day'](0);
        if (idx === numOfMonthFetched - 1) {
          isFinishFetch = true;
          return;
        }
      }
    }

    const year = fromTime.getFullYear();
    const month = fromTime.getMonth();
    const date = fromTime.getDate();
    const toTime = new Date(year, month - 1, date);
    const fetchUrl = `https://medium.com/me/stats/total/${toTime.getTime()}/${fromTime.getTime()}`;

    fetch(fetchUrl)
      .then(function(response) {
        return response.text();
      })
      .then(function(textRes) {
        const data = JSON.parse(textRes.split('</x>')[1]);
        const { value: notiRawData } = data.payload;
        let curHourView = [];
        let isZeroView = true;
        notiRawData.forEach((notiItem) => {
          if (notiItem.views > 0) isZeroView = false;
          let timeStamp = new Date(notiItem.timestampMs);
          curHourView.push([timeStamp, notiItem.views]);
          sumByHour[timeStamp.getHours()] += notiItem.views;
          sumByDay[timeStamp.getDay()] += notiItem.views;
          monthView[NOW.year - timeStamp.getFullYear()][timeStamp.getMonth()] += notiItem.views;
        });
        if (isZeroView) tryFinishFetchCounter++;
        if (hourView.length === 0) {
          while (curHourView[curHourView.length - 1][0].getHours() !== 23) {
            curHourView.push([curHourView[curHourView.length - 1][0].addTime('Hours', 1), 0]);
          }
        }
        hourView.push(...curHourView.reverse());
        fetchStoriesHourStats(toTime);
      })
      .catch(function(err) {
        console.error(err);
      });
  }
}

displaySummaryData();

function numFormater(number) {
  const SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E'];

  let tier = (Math.log10(number) / 3) | 0;
  if (tier == 0) return number;
  let suffix = SI_SYMBOL[tier];
  let scale = Math.pow(10, tier * 3);
  let scaled = number / scale;
  return scaled.toFixed(1) + suffix;
}

function displaySummaryData() {
  fetch('https://medium.com/me/stats?format=json&limit=100000')
    .then(function(response) {
      return response.text();
    })
    .then(function(textRes) {
      const data = JSON.parse(textRes.split('</x>')[1]);
      const storyRawData = data.payload.value;
      const storyData = {
        totalViews: getTotal(storyRawData, 'views'),
        totalReads: getTotal(storyRawData, 'reads'),
        totalClaps: getTotal(storyRawData, 'claps'),
        totalUpvotes: getTotal(storyRawData, 'upvotes'),
        totalStories: storyRawData.length,
      };
      renderStoryData(storyData);
    })
    .catch(function(err) {
      console.error(err);
      const errorMsg = `<div class="label">Please log in to your Medium account :)<div>`;
      document.querySelector('#table_container').innerHTML = errorMsg;
    });

  function getTotal(arr, type) {
    return arr.reduce((sum, el) => {
      return sum + el[type];
    }, 0);
  }

  function renderStoryData({ totalViews, totalReads, totalClaps, totalUpvotes, totalStories }) {
    document.querySelector('#table_loader').style.display = 'none';
    const html = `
                  <table>
                      <thead>
                        <tr>
                          <th>Types</th>
                          <th>Views</th>
                          <th>Reads</th>
                          <th>Claps</th>
                          <th>Fans</th>
                        </tr>
                      <thead>
                      <tbody>
                        <tr>
                          <td>Total</td>
                          <td>${numFormater(totalViews)}</td>
                          <td>${numFormater(totalReads)}</td>
                          <td>${numFormater(totalClaps)}</td>
                          <td>${numFormater(totalUpvotes)}</td>
                        </tr>
                        <tr>
                          <td>Average</td>
                          <td>${numFormater(Math.floor(totalViews / totalStories))}</td>
                          <td>${numFormater(Math.floor(totalReads / totalStories))}</td>
                          <td>${numFormater(Math.floor(totalClaps / totalStories))}</td>
                          <td>${numFormater(Math.floor(totalUpvotes / totalStories))}</td>
                        </tr>
                      </tbody>
                    <table/>
                  `;

    document.querySelector('.container').innerHTML = html;
  }
}

const download_btn = document.querySelector('.feather-download');
const download_loader = document.querySelector('.download_loader');
const download_btn_wrap = document.querySelector('.download_btn_wrap');

download_btn.addEventListener('click', handleDownload);

function handleDownload() {
  download_btn.style.display = 'none';
  download_loader.style.display = 'block';
  const pollingFetchState = setInterval(() => {
    if (isFinishFetch) {
      exportToCsv();
      download_btn.style.display = 'block';
      download_loader.style.display = 'none';
      clearInterval(pollingFetchState);
    }
  }, 100);
}
function exportToCsv() {
  let content = [['Year', 'Month', 'Day', 'Views']];
  let curDateViews = 0;
  let curDateKey = getDateKeyFromEpoch(new Date(hourView[0]));
  for (let idx = 0; idx < hourView.length; idx++) {
    const [timestamp, views] = hourView[idx];
    const tmpDateKey = getDateKeyFromEpoch(new Date(timestamp));
    if (curDateKey !== tmpDateKey) {
      content.push([
        `${curDateKey}`.slice(0, 4),
        `${curDateKey}`.slice(4, 6),
        `${curDateKey}`.slice(6, 8),
        curDateViews,
      ]);
      curDateViews = 0;
      curDateKey = tmpDateKey;
    }
    curDateViews += views;
  }

  let finalVal = '';

  for (let i = 0; i < content.length; i++) {
    let value = content[i];

    for (let j = 0; j < value.length; j++) {
      let innerValue = value[j] === null ? '' : value[j].toString();
      let result = innerValue.replace(/"/g, '""');
      if (result.search(/("|,|\n)/g) >= 0) result = '"' + result + '"';
      if (j > 0) finalVal += ',';
      finalVal += result;
    }

    finalVal += '\n';
  }

  console.log(finalVal);

  download_btn_wrap.setAttribute(
    'href',
    'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal)
  );
  download_btn_wrap.setAttribute(
    'download',
    `Medium-Stats-Counter-${getDateKeyFromEpoch(NOW.epoch)}.csv`
  );
}
