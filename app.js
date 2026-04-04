/**
 * app.js — EnergiePortaal application logic
 * Builds UI from engine data, handles confirms, computes results
 */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.from(document.querySelectorAll(s)); };
  var num = function (v, d) { var n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : (d || 0); };
  var eur = function (x) { return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(x || 0); };
  var fmt0 = function (x) { return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(x || 0); };
  var fmt1 = function (x) { return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(x || 0); };

  // ============================================================
  // INITIALIZATION
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    buildSelects();
    buildPresets();
    buildAppliances();
    buildPriceInputs();
    bindToggles();
  });

  // ============================================================
  // BUILD SELECT OPTIONS
  // ============================================================
  function buildSelects() {
    // Main heating
    var mainEl = $('#mainType');
    if (mainEl) {
      mainEl.innerHTML = HEAT_MAIN_DEF.map(function (h) {
        return '<option value="' + h.key + '">' + h.label.replace(/\s*\(.*\)/, '') + '</option>';
      }).join('');
      mainEl.value = 'hp';
    }

    // Aux heating
    var auxEl = $('#auxType');
    if (auxEl) {
      auxEl.innerHTML = HEAT_AUX_DEF.map(function (h) {
        return '<option value="' + h.key + '">' + h.label.replace(/\s*\(.*\)/, '') + '</option>';
      }).join('');
      auxEl.value = 'none';
    }

    // DHW
    var dhwEl = $('#dhwType');
    if (dhwEl) {
      dhwEl.innerHTML = DHW_TYPES_DEF.map(function (d) {
        return '<option value="' + d.key + '">' + d.label.replace(/\s*\(.*\)/, '') + '</option>';
      }).join('');
      dhwEl.value = 'elec';
    }

    // Pool heat
    var poolEl = $('#poolHeatType');
    if (poolEl) {
      poolEl.innerHTML = POOL_HEAT_DEF.map(function (p) {
        return '<option value="' + p.key + '">' + p.label.replace(/\s*\(.*\)/, '') + '</option>';
      }).join('');
      poolEl.value = 'hp';
    }
  }

  // ============================================================
  // BUILD PRESET BUTTONS (human-readable labels)
  // ============================================================
  function buildPresets() {
    var presetLabels = {
      wall: {
        'Dikke stenen muur, ongeïsoleerd': 2.0,
        'Licht geïsoleerd (circa 5 cm)': 0.8,
        'Goed geïsoleerd (circa 10 cm)': 0.4,
        'Zeer goed geïsoleerd (15 cm+)': 0.25
      },
      roof: {
        'Ongeïsoleerd dak': 3.0,
        'Beetje isolatie (circa 10 cm)': 0.5,
        'Goed geïsoleerd (circa 20 cm)': 0.25,
        'Zeer goed geïsoleerd (30 cm+)': 0.15
      },
      floor: {
        'Direct op zand/aarde': 2.2,
        'Kruipruimte zonder isolatie': 1.2,
        'Licht geïsoleerd': 0.8,
        'Goed geïsoleerd': 0.3
      },
      win: {
        'Enkel glas': 5.5,
        'Oud dubbel glas': 2.8,
        'Modern dubbel glas': 1.6,
        'Triple glas (HR++)': 1.0
      }
    };

    Object.keys(presetLabels).forEach(function (key) {
      var container = $('#' + key + 'Presets');
      var targetId = key === 'win' ? 'winU' : key + 'U';
      if (!container) return;

      container.innerHTML = Object.keys(presetLabels[key]).map(function (label) {
        return '<button type="button" class="preset-btn" data-target="' + targetId + '" data-val="' + presetLabels[key][label] + '">' + label + '</button>';
      }).join('');

      container.querySelectorAll('.preset-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = document.getElementById(btn.dataset.target);
          if (target) target.value = btn.dataset.val;
          // Toggle active state
          container.querySelectorAll('.preset-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
        });
      });
    });
  }

  // ============================================================
  // BUILD APPLIANCE LIST
  // ============================================================
  function buildAppliances() {
    var container = $('#appliances');
    if (!container) return;
    container.innerHTML = DEFAULT_APPLIANCES.map(function (a, i) {
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--primary-light);border-radius:6px;margin-bottom:6px">' +
        '<label style="display:flex;align-items:center;gap:8px;font-size:.9em;cursor:pointer">' +
        '<input type="checkbox" id="appl_on_' + i + '" ' + (a.on ? 'checked' : '') + ' style="accent-color:var(--primary);width:16px;height:16px"> ' + a.label +
        '</label>' +
        '<div style="display:flex;align-items:center;gap:4px"><input type="number" id="appl_kwh_' + i + '" value="' + a.kwh + '" style="width:70px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;text-align:right;font-size:.85em"> <span style="font-size:.78em;color:var(--text-light)">kWh/j</span></div>' +
        '</div>';
    }).join('');
  }

  // ============================================================
  // BUILD PRICE INPUTS
  // ============================================================
  function buildPriceInputs() {
    var container = $('#prices');
    if (!container) return;
    var labels = { elec: 'Elektriciteit', gas: 'Aardgas', fioul: 'Stookolie', pellet: 'Houtpellets', wood: 'Stookhout', propaan: 'Propaan', petroleum: 'Petroleum' };
    container.innerHTML = Object.keys(labels).map(function (k) {
      return '<div class="field">' +
        '<label>' + labels[k] + ' <span class="unit">(' + ENERGY_UNITS[k] + ')</span></label>' +
        '<input type="number" id="price_' + k + '" value="' + PRICE_DEFAULTS_USER[k] + '" step="0.01">' +
        '</div>';
    }).join('');
  }

  // ============================================================
  // BIND TOGGLE LOGIC (conditional fields)
  // ============================================================
  function bindToggles() {
    // Ventilation → HRV field
    var ventType = $('#ventType');
    if (ventType) ventType.addEventListener('change', function () {
      toggleField('hrvWrap', ventType.value === 'hrv');
    });

    // Main heating → SCOP or eta
    var mainType = $('#mainType');
    if (mainType) mainType.addEventListener('change', function () {
      toggleField('mainScopWrap', mainType.value === 'hp');
      toggleField('mainEtaWrap', ['gas', 'fioul', 'pellet', 'wood'].indexOf(mainType.value) >= 0);
    });

    // Aux heating → details
    var auxType = $('#auxType');
    if (auxType) auxType.addEventListener('change', function () {
      var hasAux = auxType.value !== 'none';
      toggleField('auxDetailsWrap', hasAux);
      toggleField('auxScopWrap', auxType.value === 'inverter');
      toggleField('auxEtaWrap', ['pellet', 'wood', 'petroleum'].indexOf(auxType.value) >= 0);
    });

    // Aux share custom
    var auxShare = $('#auxSharePreset');
    if (auxShare) auxShare.addEventListener('change', function () {
      toggleField('auxShareCustomWrap', auxShare.value === 'custom');
    });

    // DHW type
    var dhwType = $('#dhwType');
    if (dhwType) dhwType.addEventListener('change', function () {
      toggleField('dhwScopWrap', dhwType.value === 'hp');
      toggleField('dhwEtaWrap', dhwType.value === 'gas');
    });

    // PV fields
    var pvKwp = $('#pvKwp');
    if (pvKwp) pvKwp.addEventListener('input', function () {
      var hasPv = num(pvKwp.value) > 0;
      toggleField('pvSelfWrap', hasPv);
      toggleField('pvExportWrap', hasPv);
    });

    var pvExport = $('#pvExportMode');
    if (pvExport) pvExport.addEventListener('change', function () {
      toggleField('pvExportTariffWrap', pvExport.value === 'custom');
    });

    // AC toggle
    var acOn = $('#acOn');
    if (acOn) acOn.addEventListener('change', function () {
      toggleField('seerWrap', acOn.checked);
    });

    // Pool toggle
    var poolHas = $('#poolHas');
    if (poolHas) poolHas.addEventListener('change', function () {
      toggleField('poolInputs', poolHas.checked);
    });

    // Pool heat type → SCOP
    var poolHeat = $('#poolHeatType');
    if (poolHeat) poolHeat.addEventListener('change', function () {
      toggleField('poolScopWrap', poolHeat.value === 'hp');
    });
  }

  function toggleField(id, show) {
    var el = document.getElementById(id);
    if (el) {
      if (show) el.classList.add('visible');
      else el.classList.remove('visible');
    }
  }

  // ============================================================
  // GATHER STATE (reads all inputs into engine-compatible object)
  // ============================================================
  function gatherState() {
    var prices = {};
    Object.keys(PRICE_DEFAULTS_USER).forEach(function (k) {
      var el = document.getElementById('price_' + k);
      prices[k] = el ? num(el.value, PRICE_DEFAULTS_USER[k]) : PRICE_DEFAULTS_USER[k];
    });

    var appls = DEFAULT_APPLIANCES.map(function (a, i) {
      return {
        key: a.key, label: a.label, scales: a.scales,
        on: document.getElementById('appl_on_' + i) ? document.getElementById('appl_on_' + i).checked : a.on,
        kwh: document.getElementById('appl_kwh_' + i) ? num(document.getElementById('appl_kwh_' + i).value, a.kwh) : a.kwh
      };
    });

    return {
      zone: val('zone', 'paris'),
      setpoint: num(val('setpoint'), 20),
      volume: num(val('volume'), 250),
      ach: num(val('ach'), 0.5),
      ventType: val('ventType', 'natural'),
      hrvEta: num(val('hrvEta'), 0.75),
      wallA: num(val('wallA'), 120), wallU: num(val('wallU'), 0.5),
      roofA: num(val('roofA'), 100), roofU: num(val('roofU'), 0.25),
      floorA: num(val('floorA'), 100), floorU: num(val('floorU'), 0.35),
      winA: num(val('winA'), 20), winU: num(val('winU'), 1.6),
      presentDays: Math.min(365, Math.max(0, num(val('presentDays'), 260))),
      awaySetpoint: num(val('awaySetpoint'), 12),
      mainType: val('mainType', 'hp'),
      mainScop: num(val('mainScop'), 3.2),
      mainEta: num(val('mainEta'), 0.9),
      auxType: val('auxType', 'none'),
      auxSharePreset: val('auxSharePreset', '25'),
      auxShareCustom: num(val('auxShareCustom'), 25),
      auxScop: num(val('auxScop'), 3.2),
      auxEta: num(val('auxEta'), 0.85),
      persons: num(val('persons'), 2),
      showersPerPerson: num(val('showersPerPerson'), 1),
      litersPer: num(val('litersPer'), 55),
      dhwType: val('dhwType', 'elec'),
      dhwScop: num(val('dhwScop'), 2.5),
      dhwEta: num(val('dhwEta'), 0.9),
      pvKwp: num(val('pvKwp'), 0),
      pvSelfUse: num(val('pvSelfUse'), 60),
      pvExportMode: val('pvExportMode', 'nvt'),
      pvExportTariff: num(val('pvExportTariff'), 0.04),
      acOn: document.getElementById('acOn') ? document.getElementById('acOn').checked : false,
      seer: num(val('seer'), 4.0),
      appls: appls,
      evKmWeek: num(val('evKmWeek'), 0),
      evKwh100: num(val('evKwh100'), 18),
      evLoss: num(val('evLoss'), 10),
      poolHas: document.getElementById('poolHas') ? document.getElementById('poolHas').checked : false,
      poolVol: num(val('poolVol'), 30),
      poolTargetT: num(val('poolTargetT'), 27),
      poolSeason: num(val('poolSeason'), 5),
      poolHeatType: val('poolHeatType', 'hp'),
      poolHpScop: num(val('poolHpScop'), 4),
      poolPumpW: num(val('poolPumpW'), 450),
      poolPumpH: num(val('poolPumpH'), 8),
      poolCover: val('poolCover', 'true'),
      poolWind: 1,
      userPrices: prices
    };
  }

  function val(id, def) {
    var el = document.getElementById(id);
    return el ? el.value : (def || '');
  }

  // ============================================================
  // BUILD CONFIRM CARDS
  // ============================================================
  window.buildConfirm = function (section) {
    var el = document.getElementById('confirm-' + section);
    if (!el) return;

    var zoneLabels = { med: 'Middellandse Zeekust', ouest: 'Zuid-West / Atlantisch', paris: 'Noord / Parijs', centre: 'Centraal Frankrijk', est: 'Oost-Frankrijk', mont: 'Berggebied' };
    var ventLabels = { natural: 'Natuurlijke ventilatie', mech: 'Mechanische ventilatie', hrv: 'Ventilatie met warmteterugwinning' };

    var html = '';
    switch (section) {
      case '2':
        html = card('Klimaatzone', zoneLabels[val('zone')] || val('zone')) +
          card('Binnentemperatuur', val('setpoint') + ' °C') +
          card('Temperatuur bij afwezigheid', val('awaySetpoint') + ' °C') +
          card('Aanwezigheid', val('presentDays') + ' dagen per jaar');
        break;

      case '3':
        html = card('Verwarmd volume', val('volume') + ' m³') +
          card('Ventilatie', ventLabels[val('ventType')] || val('ventType')) +
          card('Luchtwisseling', val('ach') + ' per uur');
        if (val('ventType') === 'hrv') html += card('Rendement warmteterugwinning', val('hrvEta'));
        break;

      case '4':
        html = card('Buitenmuren', val('wallA') + ' m² · U = ' + val('wallU')) +
          card('Dak', val('roofA') + ' m² · U = ' + val('roofU')) +
          card('Vloer', val('floorA') + ' m² · U = ' + val('floorU')) +
          card('Ramen', val('winA') + ' m² · U = ' + val('winU'));
        break;

      case '5':
        var mainLabel = HEAT_MAIN_DEF.find(function (h) { return h.key === val('mainType'); });
        html = card('Hoofdverwarming', mainLabel ? mainLabel.label : val('mainType'));
        if (val('mainType') === 'hp') html += card('Seizoensrendement (SCOP)', val('mainScop'));
        if (['gas', 'fioul', 'pellet', 'wood'].indexOf(val('mainType')) >= 0) html += card('Rendement', val('mainEta'));
        var auxLabel = HEAT_AUX_DEF.find(function (h) { return h.key === val('auxType'); });
        html += card('Bijverwarming', auxLabel ? auxLabel.label : 'Geen');
        if (val('auxType') !== 'none') {
          var share = val('auxSharePreset') === 'custom' ? val('auxShareCustom') : val('auxSharePreset');
          html += card('Aandeel bijverwarming', share + '%');
        }
        break;

      case '6':
        html = card('Aantal personen', val('persons')) +
          card('Douches per persoon per dag', val('showersPerPerson')) +
          card('Liters per douche', val('litersPer') + ' L');
        var dhwLabel = DHW_TYPES_DEF.find(function (d) { return d.key === val('dhwType'); });
        html += card('Warmwatersysteem', dhwLabel ? dhwLabel.label : val('dhwType'));
        break;

      case '7':
        var pvKwp = num(val('pvKwp'));
        html = card('Zonnepanelen', pvKwp > 0 ? pvKwp + ' kWp' : 'Geen');
        var evKm = num(val('evKmWeek'));
        html += card('Elektrische auto', evKm > 0 ? evKm + ' km/week' : 'Geen');
        html += card('Airconditioning', document.getElementById('acOn') && document.getElementById('acOn').checked ? 'Ja (SEER ' + val('seer') + ')' : 'Nee');
        html += card('Zwembad', document.getElementById('poolHas') && document.getElementById('poolHas').checked ? 'Ja (' + val('poolVol') + ' m³)' : 'Nee');
        html += card('Elektriciteitsprijs', val('price_elec') || PRICE_DEFAULTS_USER.elec + ' €/kWh');
        break;
    }

    el.innerHTML = html;
  };

  function card(label, value) {
    return '<div class="confirm-card"><div class="label">' + label + '</div><div class="value">' + value + '</div></div>';
  }

  // ============================================================
  // COMPUTE & RENDER RESULTS
  // ============================================================
  window.computeAndRender = function () {
    var state = gatherState();
    var r = computeResults(state);

    // Hero numbers
    var totalEl = $('#totalCost');
    if (totalEl) totalEl.textContent = eur(r.totalCost);
    var monthEl = $('#perMonth');
    if (monthEl) monthEl.textContent = eur(r.perMonth) + ' per maand';

    // Cost breakdown
    var bd = $('#costBreakdown');
    if (bd) {
      var rows = [
        { label: 'Verwarming (hoofd + bij)', val: r.costs.verwarming },
        { label: 'Warm water', val: r.costs.tapwater },
        { label: 'Koeling (airco)', val: r.costs.koeling },
        { label: 'Apparaten & verlichting', val: r.costs.apparaten },
        { label: 'Elektrische auto', val: r.costs.ev },
        { label: 'Zwembad', val: r.costs.zwembad },
        { label: 'Zonnepanelen (besparing)', val: r.costs.pvWaarde },
        { label: 'Teruglevering PV', val: r.costs.pvExportOpbrengst }
      ].filter(function (row) { return Math.abs(row.val) > 1; });

      bd.innerHTML = rows.map(function (row) {
        return '<div class="result-row"><span class="label">' + row.label + '</span><span class="val">' + eur(row.val) + '</span></div>';
      }).join('') +
        '<div class="result-row total"><span class="label">Totaal per jaar</span><span class="val">' + eur(r.totalCost) + '</span></div>';
    }

    // Energy balance
    var eb = $('#energyBalance');
    if (eb) {
      eb.innerHTML =
        row('Warmtevraag woning', fmt0(r.heatDemand) + ' kWh') +
        row('Verwarming input (hoofd)', fmt0(r.verbruik.heatMain) + ' kWh') +
        row('Verwarming input (bij)', fmt0(r.verbruik.heatAux) + ' kWh') +
        row('Warm water input', fmt0(r.verbruik.tapwater) + ' kWh') +
        row('Bruto elektra', fmt0(r.verbruik.brutoElec) + ' kWh') +
        row('PV eigenverbruik', '−' + fmt0(r.verbruik.pvEigen) + ' kWh') +
        row('Netto elektra van net', fmt0(r.verbruik.nettoElec) + ' kWh');
    }

    // Cost bars
    var bars = $('#costBars');
    if (bars) {
      var items = [
        { label: 'Verwarming', val: Math.max(0, r.costs.verwarming) },
        { label: 'Warm water', val: Math.max(0, r.costs.tapwater) },
        { label: 'Apparaten', val: Math.max(0, r.costs.apparaten) },
        { label: 'Koeling', val: Math.max(0, r.costs.koeling) },
        { label: 'Auto (EV)', val: Math.max(0, r.costs.ev) },
        { label: 'Zwembad', val: Math.max(0, r.costs.zwembad) }
      ].filter(function (item) { return item.val > 1; });

      var maxVal = Math.max.apply(null, items.map(function (i) { return i.val; }));
      bars.innerHTML = items.map(function (item) {
        var pct = maxVal > 0 ? (item.val / maxVal * 100) : 0;
        return '<div class="bar-row">' +
          '<span class="bar-label">' + item.label + '</span>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + pct + '%"></div></div>' +
          '<span class="bar-value">' + eur(item.val) + '</span>' +
          '</div>';
      }).join('');
    }

    // Grondslagen
    var gs = $('#grondslagen');
    if (gs) {
      var z = ZONES.find(function (x) { return x.id === state.zone; }) || ZONES[2];
      gs.innerHTML =
        '<p><strong>Transmissieverlies:</strong> H<sub>tr</sub> = Σ(U × A) = ' + fmt1(r.debug.UA) + ' W/K</p>' +
        '<p><strong>Ventilatieverlies:</strong> H<sub>vent</sub> = 0,34 × ' + state.ach + ' × ' + state.volume + ' = ' + fmt1(r.debug.Hvent) + ' W/K' +
        (state.ventType === 'hrv' ? ' → na warmteterugwinning: ' + fmt1(r.debug.HventEff) + ' W/K' : '') + '</p>' +
        '<p><strong>Totaal verliescoëfficiënt:</strong> H = ' + fmt1(r.debug.H) + ' W/K</p>' +
        '<p><strong>Klimaatzone:</strong> ' + z.name + ' · ' + z.hdd + ' graaddagen (HDD) · referentietemperatuur ' + z.Tref + ' °C</p>' +
        '<p><strong>Warmtevraag:</strong> ' + fmt0(r.heatDemand) + ' kWh/jaar (gewogen naar ' + state.presentDays + ' dagen aanwezig)</p>' +
        '<p style="margin-top:10px;font-size:.85em;color:var(--text-light)">Formule: Warmtevraag = H × HDD × 24 / 1000, geschaald naar setpoint en aanwezigheid.<br>Bron: Infofrankrijk.com, "De isolatie van het Franse huis" en "Warmteverliezen" (Rob van der Meulen).</p>';
    }
  };

  function row(label, value) {
    return '<div class="result-row"><span class="label">' + label + '</span><span class="val">' + value + '</span></div>';
  }

})();
