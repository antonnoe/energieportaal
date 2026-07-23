// tests/dpe-test.js — kwaliteitsborging voor de DPE-indicatie.
//
// Draaien:  node tests/dpe-test.js
//
// Test 1: drie DPE-cases (ongeïsoleerd/stookolie → F/G, top/WP → A/B, midden/gas → C/D/E)
// Test 2: regressie — computeResults (engine.js) blijft ongewijzigd (referentiehuis H = 371,9 W/K)

'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var ROOT = path.join(__dirname, '..');
var dpe = require(path.join(ROOT, 'engine', 'dpe.js'));
var computeDPE = dpe.computeDPE;

// ── engine/engine.js laden in Node (heeft geen module.exports) ────────────────
function loadEngine() {
  var code = fs.readFileSync(path.join(ROOT, 'engine', 'engine.js'), 'utf8');
  var sandbox = { Intl: Intl, Math: Math, Number: Number, Object: Object, console: console };
  vm.createContext(sandbox);
  vm.runInContext(code + '\n;this.computeResults = computeResults; this.ZONES = ZONES;', sandbox);
  return sandbox;
}

var GREEN = '\x1b[32m', RED = '\x1b[31m', DIM = '\x1b[2m', RST = '\x1b[0m';
var failures = 0;

function baseHouse(over) {
  var s = {
    zone: 'paris', volume: 250, ach: 0.6, ventType: 'natural', hrvEta: 0.75,
    wallA: 120, wallU: 0.5, roofA: 100, roofU: 0.25, floorA: 100, floorU: 0.35, winA: 20, winU: 1.6,
    woonoppervlak: 100,
    mainType: 'hp', mainScop: 3.2, mainEta: 0.9,
    dhwType: 'elec', dhwScop: 2.5, dhwEta: 0.9
  };
  for (var k in (over || {})) s[k] = over[k];
  return s;
}

// ══ TEST 1: DPE-cases ═════════════════════════════════════════════════════════
console.log('\n=== TEST 1 · DPE-indicatie (3 cases) ===\n');

var cases = [
  {
    name: '(a) Ongeïsoleerd huis, stookolie',
    expect: ['F', 'G'],
    state: baseHouse({
      zone: 'est', volume: 300, ach: 1.0, ventType: 'natural',
      wallA: 130, wallU: 2.0, roofA: 100, roofU: 3.0, floorA: 100, floorU: 2.0, winA: 22, winU: 5.5,
      woonoppervlak: 110, mainType: 'fioul', mainEta: 0.8, dhwType: 'elec'
    })
  },
  {
    name: '(b) Goed geïsoleerd huis, warmtepomp',
    expect: ['A', 'B'],
    state: baseHouse({
      zone: 'paris', volume: 250, ach: 0.4, ventType: 'hrv', hrvEta: 0.85,
      wallA: 120, wallU: 0.20, roofA: 100, roofU: 0.14, floorA: 100, floorU: 0.25, winA: 20, winU: 1.0,
      woonoppervlak: 100, mainType: 'hp', mainScop: 4.2, dhwType: 'hp', dhwScop: 3.0
    })
  },
  {
    name: '(c) Middenhuis, gasketel',
    expect: ['C', 'D', 'E'],
    state: baseHouse({
      zone: 'paris', volume: 250, ach: 0.6, ventType: 'natural',
      wallA: 120, wallU: 0.8, roofA: 100, roofU: 0.5, floorA: 100, floorU: 0.8, winA: 20, winU: 2.8,
      woonoppervlak: 100, mainType: 'gas', mainEta: 0.9, dhwType: 'gas', dhwEta: 0.9
    })
  }
];

cases.forEach(function (c) {
  var r = computeDPE(c.state);
  var ok = c.expect.indexOf(r.classe) >= 0;
  if (!ok) failures++;
  console.log((ok ? GREEN + 'PASS' : RED + 'FAIL') + RST + '  ' + c.name);
  console.log('      verwacht: ' + c.expect.join('/') + '  →  gekregen: ' + r.classe +
    '  (energie ' + r.details.epClasse + ', GES ' + r.details.gesClasse + ', bepaald door ' + r.details.drivenBy + ')');
  console.log(DIM +
    '      ' + Math.round(r.perM2.ep) + ' kWh EP/m²/jr · ' + r.perM2.ges.toFixed(1) + ' kg CO2/m²/jr' +
    ' · finaal ' + Math.round(r.energieFinale) + ' kWh/jr · Shab ' + r.details.shab + ' m² · H ' + r.details.H.toFixed(1) + ' W/K' + RST);
  console.log('');
});

// ══ TEST 2: regressie op de bestaande berekening ══════════════════════════════
console.log('=== TEST 2 · Regressie computeResults (referentiehuis) ===\n');

var eng = loadEngine();
var ref = {
  zone: 'est', setpoint: 20, volume: 156, ach: 0.8, ventType: 'natural', hrvEta: 0.75,
  wallA: 80, wallU: 1.25, roofA: 60, roofU: 1.0, floorA: 60, floorU: 2.0, winA: 9, winU: 5.5,
  presentDaysWinter: 155, presentDaysSummer: 105, awaySetpoint: 12,
  mainType: 'hp', mainScop: 3.2, mainEta: 0.9,
  auxType: 'none', auxSharePreset: '25', auxShareCustom: 25, auxScop: 3.2, auxEta: 0.85,
  persons: 2, showersPerPerson: 1, litersPer: 55,
  dhwType: 'elec', dhwScop: 2.5, dhwEta: 0.9,
  pvKwp: 0, pvSelfUse: 60, pvExportMode: 'nvt', pvExportTariff: 0.04,
  acOn: false, seer: 4.0, appls: [],
  evKmWeek: 0, evKwh100: 18, evLoss: 10,
  poolHas: false, poolVol: 30, poolTargetT: 27, poolSeason: 5, poolHeatType: 'hp', poolHpScop: 4,
  poolPumpW: 450, poolPumpH: 8, poolCover: 'true', poolWind: 1,
  userPrices: { elec: 0.25, gas: 1.20, fioul: 1.15, pellet: 0.60, wood: 85, propaan: 1.80, petroleum: 2.00 }
};

var rr = eng.computeResults(ref);
var H = rr.debug.H;
var Htarget = 371.9;
var okH = Math.abs(H - Htarget) < 0.05;
if (!okH) failures++;
console.log((okH ? GREEN + 'PASS' : RED + 'FAIL') + RST +
  '  Referentiehuis H = ' + H.toFixed(1) + ' W/K  (verwacht ' + Htarget + ')');
console.log(DIM + '      UA = ' + rr.debug.UA.toFixed(2) + ' · Hvent = ' + rr.debug.Hvent.toFixed(3) +
  ' · warmtevraag = ' + Math.round(rr.heatDemand) + ' kWh/jr' + RST);

// ── Samenvatting ──────────────────────────────────────────────────────────────
console.log('\n' + (failures === 0
  ? GREEN + '✔ Alle tests geslaagd.' + RST
  : RED + '✗ ' + failures + ' test(s) gefaald.' + RST) + '\n');

process.exit(failures === 0 ? 0 : 1);
