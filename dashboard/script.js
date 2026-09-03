(function () {
  'use strict';

  var DATA = window.DASHBOARD_DATA;
  var sido = DATA.sido.slice();

  /* ---------- Theme toggle ---------- */
  (function themeInit() {
    var toggle = document.querySelector('[data-theme-toggle]');
    var root = document.documentElement;
    var mode = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
    root.setAttribute('data-theme', mode);
    updateIcon();

    function updateIcon() {
      toggle.setAttribute('aria-label', 'Switch to ' + (mode === 'dark' ? 'light' : 'dark') + ' mode');
      toggle.innerHTML = mode === 'dark'
        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }

    toggle.addEventListener('click', function () {
      mode = mode === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', mode);
      updateIcon();
      refreshChartColors();
    });
  })();

  /* ---------- Helpers ---------- */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function fmt(n) {
    return n.toLocaleString('ko-KR');
  }

  function fmt1(n) {
    return n.toFixed(1);
  }

  /* ---------- KPI count-up ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var isStrong = el.tagName === 'STRONG';
    var dur = 900;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      if (isStrong) {
        el.textContent = fmt1(val);
      } else {
        el.innerHTML = fmt1(val) + (el.querySelector('small') ? '<small>' + el.querySelector('small').textContent + '</small>' : '');
      }
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('[data-count]').forEach(animateCount);

  /* ---------- Chart.js global defaults ---------- */
  Chart.defaults.font.family = "'Satoshi','General Sans','Segoe UI',sans-serif";
  Chart.defaults.color = cssVar('--color-text-muted');

  var colorPrimary = cssVar('--color-primary');
  var colorRust = cssVar('--color-rust');
  var colorPrimarySoft = 'rgba(14,95,163,0.9)';
  var colorRustSoft = 'rgba(180,83,9,0.9)';
  var colorBorder = cssVar('--color-border');
  var colorText = cssVar('--color-text');
  var colorSurface = cssVar('--color-surface');

  /* ================= MAIN CHART ================= */
  var mainCtx = document.getElementById('mainChart').getContext('2d');
  var currentMode = 'both';
  var currentSort = 'res_ratio_desc';

  function sortedSido() {
    var arr = sido.slice();
    switch (currentSort) {
      case 'res_ratio_desc': arr.sort(function (a, b) { return b.res_ratio - a.res_ratio; }); break;
      case 'com_ratio_desc': arr.sort(function (a, b) { return b.com_ratio - a.com_ratio; }); break;
      case 'gap_desc': arr.sort(function (a, b) { return Math.abs(b.res_ratio - b.com_ratio) - Math.abs(a.res_ratio - a.com_ratio); }); break;
      case 'name_asc': arr.sort(function (a, b) { return a.short.localeCompare(b.short, 'ko'); }); break;
    }
    return arr;
  }

  function buildDatasets(list) {
    var datasets = [];
    if (currentMode === 'both' || currentMode === 'residential') {
      datasets.push({
        label: '주거용 30년+ 비율',
        data: list.map(function (d) { return d.res_ratio; }),
        backgroundColor: colorPrimarySoft,
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 26
      });
    }
    if (currentMode === 'both' || currentMode === 'commercial') {
      datasets.push({
        label: '상업용 30년+ 비율',
        data: list.map(function (d) { return d.com_ratio; }),
        backgroundColor: colorRustSoft,
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 26
      });
    }
    return datasets;
  }

  var mainChart = new Chart(mainCtx, {
    type: 'bar',
    data: {
      labels: sortedSido().map(function (d) { return d.short; }),
      datasets: buildDatasets(sortedSido())
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutCubic' },
      layout: { padding: { right: 8 } },
      scales: {
        x: {
          beginAtZero: true,
          max: 80,
          grid: { color: colorBorder },
          ticks: { callback: function (v) { return v + '%'; }, font: { size: 11 } }
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 12, weight: 600 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: colorSurface,
          titleColor: colorText,
          bodyColor: colorText,
          borderColor: colorBorder,
          borderWidth: 1,
          padding: 10,
          titleFont: { weight: 700 },
          callbacks: {
            label: function (ctx) {
              return ctx.dataset.label + ': ' + ctx.formattedValue + '%';
            }
          }
        }
      }
    }
  });

  function renderLegend() {
    var el = document.getElementById('mainLegend');
    var items = [];
    if (currentMode === 'both' || currentMode === 'residential') {
      items.push('<span class="legend-row__item"><span class="legend-row__swatch" style="background:' + colorPrimarySoft + '"></span>주거용 30년 이상 비율</span>');
    }
    if (currentMode === 'both' || currentMode === 'commercial') {
      items.push('<span class="legend-row__item"><span class="legend-row__swatch" style="background:' + colorRustSoft + '"></span>상업용 30년 이상 비율</span>');
    }
    el.innerHTML = items.join('');
  }

  function updateMainChart() {
    var list = sortedSido();
    mainChart.data.labels = list.map(function (d) { return d.short; });
    mainChart.data.datasets = buildDatasets(list);
    mainChart.update();
    renderLegend();
  }
  renderLegend();

  document.querySelectorAll('.segmented__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.segmented__btn').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      currentMode = btn.getAttribute('data-mode');
      updateMainChart();
    });
  });

  document.getElementById('sortSelect').addEventListener('change', function (e) {
    currentSort = e.target.value;
    updateMainChart();
  });

  /* ================= TREND CHART ================= */
  var trendCtx = document.getElementById('trendChart').getContext('2d');
  var trend = DATA.national_trend;
  var trendChart = new Chart(trendCtx, {
    type: 'line',
    data: {
      labels: trend.map(function (d) { return d.year + '년'; }),
      datasets: [
        {
          label: '전체',
          data: trend.map(function (d) { return d.total; }),
          borderColor: colorText,
          backgroundColor: colorText,
          borderDash: [4, 3],
          tension: 0.35,
          pointRadius: 3
        },
        {
          label: '주거용',
          data: trend.map(function (d) { return d.residential; }),
          borderColor: colorPrimary,
          backgroundColor: colorPrimary,
          tension: 0.35,
          pointRadius: 3
        },
        {
          label: '상업용',
          data: trend.map(function (d) { return d.commercial; }),
          borderColor: colorRust,
          backgroundColor: colorRust,
          tension: 0.35,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      scales: {
        y: { ticks: { callback: function (v) { return v + '%'; } }, grid: { color: colorBorder } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
        tooltip: {
          backgroundColor: colorSurface, titleColor: colorText, bodyColor: colorText,
          borderColor: colorBorder, borderWidth: 1,
          callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + (ctx.parsed.y ?? '-') + '%'; } }
        }
      }
    }
  });

  /* ================= REGION (CAPITAL VS NON-CAPITAL) CHART ================= */
  var regionCtx = document.getElementById('regionChart').getContext('2d');
  var r = DATA.national_2024_region;
  var regionChart = new Chart(regionCtx, {
    type: 'bar',
    data: {
      labels: ['전체', '주거용', '상업용'],
      datasets: [
        {
          label: '수도권',
          data: [r.capital.total, r.capital.residential, r.capital.commercial],
          backgroundColor: colorPrimarySoft,
          borderRadius: 4,
          maxBarThickness: 40
        },
        {
          label: '지방',
          data: [r.non_capital.total, r.non_capital.residential, r.non_capital.commercial],
          backgroundColor: colorRustSoft,
          borderRadius: 4,
          maxBarThickness: 40
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      scales: {
        y: { beginAtZero: true, max: 65, ticks: { callback: function (v) { return v + '%'; } }, grid: { color: colorBorder } },
        x: { grid: { display: false } }
      },
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { size: 11 } } },
        tooltip: {
          backgroundColor: colorSurface, titleColor: colorText, bodyColor: colorText,
          borderColor: colorBorder, borderWidth: 1,
          callbacks: { label: function (ctx) { return ctx.dataset.label + ': ' + ctx.formattedValue + '%'; } }
        }
      }
    }
  });

  function refreshChartColors() {
    var muted = cssVar('--color-text-muted');
    var border = cssVar('--color-border');
    var text = cssVar('--color-text');
    var surface = cssVar('--color-surface');
    [mainChart, trendChart, regionChart].forEach(function (c) {
      Chart.defaults.color = muted;
      if (c.options.scales.x) {
        c.options.scales.x.grid.color = border;
        c.options.scales.x.ticks.color = muted;
      }
      if (c.options.scales.y) {
        c.options.scales.y.grid.color = border;
        c.options.scales.y.ticks.color = muted;
      }
      c.options.plugins.tooltip.backgroundColor = surface;
      c.options.plugins.tooltip.titleColor = text;
      c.options.plugins.tooltip.bodyColor = text;
      c.options.plugins.tooltip.borderColor = border;
      c.update();
    });
  }

  /* ================= TABLE ================= */
  var tableSortKey = 'res_ratio';
  var tableSortDir = -1;

  function renderTable() {
    var arr = sido.slice();
    arr.sort(function (a, b) {
      var av = a[tableSortKey], bv = b[tableSortKey];
      if (typeof av === 'string') return tableSortDir * av.localeCompare(bv, 'ko');
      return tableSortDir * (av - bv);
    });

    var body = document.getElementById('tableBody');
    body.innerHTML = arr.map(function (d) {
      var regionLabel = d.region_type === 'capital' ? '수도권' : '지방';
      var regionTagClass = d.region_type === 'capital' ? 'tag--capital' : 'tag--noncapital';
      return '<tr data-testid="row-sido-' + d.short + '">' +
        '<td>' + d.name + '</td>' +
        '<td class="num"><span class="bar-cell"><span class="bar-cell__track"><span class="bar-cell__fill bar-cell__fill--res" style="width:' + (d.res_ratio / 80 * 100) + '%"></span></span><span class="bar-cell__num">' + fmt1(d.res_ratio) + '%</span></span></td>' +
        '<td class="num">' + fmt(d.res_old) + '동</td>' +
        '<td class="num"><span class="bar-cell"><span class="bar-cell__track"><span class="bar-cell__fill bar-cell__fill--com" style="width:' + (d.com_ratio / 80 * 100) + '%"></span></span><span class="bar-cell__num">' + fmt1(d.com_ratio) + '%</span></span></td>' +
        '<td class="num">' + fmt(d.com_old) + '동</td>' +
        '<td><span class="tag ' + regionTagClass + '">' + regionLabel + '</span></td>' +
        '</tr>';
    }).join('');

    document.querySelectorAll('.data-table thead th').forEach(function (th) {
      th.classList.toggle('is-sorted', th.getAttribute('data-key') === tableSortKey);
    });
  }
  renderTable();

  document.querySelectorAll('.data-table thead th').forEach(function (th) {
    th.addEventListener('click', function () {
      var key = th.getAttribute('data-key');
      if (key === tableSortKey) {
        tableSortDir *= -1;
      } else {
        tableSortKey = key;
        tableSortDir = key === 'name' || key === 'region_type' ? 1 : -1;
      }
      renderTable();
    });
  });
})();
