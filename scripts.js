// Define default settings for playerClass
// NTS: Ctrl+F5 if dynamic localhost
const defaultStats = {
    chickens: 0,
    maxChickens: 250,
    eggsDelivered: 0,
    deflectorPercent: 0,
    siabPercent: 0,
    otherDefl: 0,
    timeToBoost: 0,
    boostingTime: 0,
    numTach: 0,
    numQuant: 0,
    boostMulti: 1,
    btv: 0,
    contributionRatio: 0,
    btvRat: 0,
    tw: 0,
    CS: 0,
    TE: 0
};
const defaultRates = {
    ihr: 0,
    deliveryRate: 0,
    baseShip: 0,
    baseELR: 0,
    layRate: 0,
    shipRate: 0,
}
const defaultFlags = {
    needsMirror: false,
    isSink: false,
    isCreator: false,
    maxHab: false,
    siabActive: false,
    collegg: false
};
const defaultArtifacts = {
    layRateArtis: [null, null, null, null], // 4 arti's
};

class PlayerClass {
    constructor({
        name = "Player",
        tokens = 6,
        stats = {},
        rates = {},
        flags = {},
        artifacts = {}
    } = {}) {
        this.name = name;
        this.tokens = tokens;

        this.stats = { ...defaultStats, ...stats };
        this.rates = { ...defaultRates, ...rates };
        this.flags = { ...defaultFlags, ...flags };
        this.artifacts = { ...defaultArtifacts.layRateArtis, ...artifacts };
    }
    updateChickens() {
        const increase = this.rates.ihr * 12 * this.stats.boostMulti / 60;

        this.stats.chickens = Math.min(
            this.stats.chickens + increase,
            this.stats.maxChickens
        );
        if (this.stats.chickens === this.stats.maxChickens) {
            this.flags.maxHab = true;
        }
    }
    updateDeliveryRate() {
        this.rates.layRate = this.stats.chickens * 332640 * (1 + this.stats.otherDefl / 100);
        this.rates.shipRate = this.rates.baseShip;
        this.rates.deliveryRate = Math.min(
            this.rates.layRate,
            this.rates.baseShip
        );
    }
    updateEggsDelivered(updateRate) {
        this.stats.eggsDelivered += updateRate * this.rates.deliveryRate / 3600;
    }
    updateEggsDeliveredSIAB(updateRate) {
        this.stats.eggsDelivered += updateRate * this.beforeSwap.rates.deliveryRate / 3600;
    }
    updateBTV(updateRate, new2p0) {
        const { deflectorPercent, siabPercent } = this.stats;
        const btvRate = new2p0 ?
            12.5 * Math.min(deflectorPercent, 12) + 0.75 * Math.min(siabPercent, 50)
            : 7.5 * (deflectorPercent + siabPercent / 10);
        this.stats.btv += updateRate * btvRate / 100;
    }

};


const base62 = {
    charset: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
        .split(''),
    encode: integer => {
        if (integer === 0) {
            return 0;
        }
        let s = [];
        while (integer > 0) {
            s = [base62.charset[integer % 62], ...s];
            integer = Math.floor(integer / 62);
        }
        return s.join('');
    },
    decode: chars => chars.split('').reverse().reduce((prev, curr, i) =>
        prev + (base62.charset.indexOf(curr) * (62 ** i)), 0)
};

// Define the items
const items = [
    { name: 'Metro/Stone Arti' },
    { name: 'Compass/Stone Arti' },
    { name: 'Gusset/Stone Arti' },
    { name: 'Deflector/Stone Arti' },
    { name: 'Chalice' },
    { name: 'Monocle' },
    { name: 'Deflector/Stone Arti' },
    { name: 'SIAB/Stone Arti' },
];

const tableColumns = [
    'Player',
    'TE',
    'elr (q/hr)',
    'sr (q/hr)',
    'Population',
    'Contr. Ratio',
    'Pre-Boost/Time Boosting <span class="info-tip info-tip--down" data-tip="Pre-Boost: Time from coop start until the player\'s boost begins. Time Boosting: Time from boost start until habs are full (or time to fill habs naturally if max was reached before boosting).">?</span>',
    'BTV / complTime',
    'Teamwork',
    'CS'
];

const itemsMetro = [
    { name: 'T4L Metro', image: 'images/Metro4L.png', slots: 3, elrmult: 1.35, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Metro', image: 'images/Metro4E.png', slots: 2, elrmult: 1.3, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Metro', image: 'images/Metro4R.png', slots: 1, elrmult: 1.27, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Metro', image: 'images/Metro4C.png', slots: 0, elrmult: 1.25, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3E Metro', image: 'images/Metro3E.png', slots: 2, elrmult: 1.2, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Metro', image: 'images/Metro3R.png', slots: 1, elrmult: 1.17, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Metro', image: 'images/Metro3C.png', slots: 0, elrmult: 1.15, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2R Metro', image: 'images/Metro2R.png', slots: 1, elrmult: 1.12, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Metro', image: 'images/Metro2C.png', slots: 0, elrmult: 1.1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Metro', image: 'images/Metro1C.png', slots: 0, elrmult: 1.05, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4L SIAB', image: 'images/SIAB4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'images/SIAB4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 }
];

const itemsComp = [
    { name: 'T4L Compass', image: 'images/Compass4L.png', slots: 2, elrmult: 1, srmult: 1.5, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Compass', image: 'images/Compass4E.png', slots: 2, elrmult: 1, srmult: 1.4, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Compass', image: 'images/Compass4R.png', slots: 1, elrmult: 1, srmult: 1.35, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Compass', image: 'images/Compass4C.png', slots: 0, elrmult: 1, srmult: 1.3, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Compass', image: 'images/Compass3R.png', slots: 1, elrmult: 1, srmult: 1.22, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Compass', image: 'images/Compass3C.png', slots: 0, elrmult: 1, srmult: 1.2, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Compass', image: 'images/Compass2C.png', slots: 0, elrmult: 1, srmult: 1.1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Compass', image: 'images/Compass1C.png', slots: 0, elrmult: 1, srmult: 1.05, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4L SIAB', image: 'images/SIAB4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'images/SIAB4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 }
];

const itemsGusset = [
    { name: 'T4L Gusset', image: 'images/Gusset4L.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.25 },
    { name: 'T4E Gusset', image: 'images/Gusset4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.22 },
    { name: 'T2E Gusset', image: 'images/Gusset2E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.12 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Gusset', image: 'images/Gusset4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.2 },
    { name: 'T3R Gusset', image: 'images/Gusset3R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.16 },
    { name: 'T3C Gusset', image: 'images/Gusset3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.15 },
    { name: 'T2C Gusset', image: 'images/Gusset2C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.1 },
    { name: 'T1C Gusset', image: 'images/Gusset1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.05 },
    { name: 'T4L SIAB', image: 'images/SIAB4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'images/SIAB4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 }
];

const itemsDefl = [
    { name: 'T4L Defl.', image: 'images/Deflector4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 20, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Defl.', image: 'images/Deflector4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 19, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Defl.', image: 'images/Deflector4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 17, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Defl.', image: 'images/Deflector4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 15, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Defl.', image: 'images/Deflector3R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 13, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Defl.', image: 'images/Deflector3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 12, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Defl.', image: 'images/Deflector2C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 8, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Defl.', image: 'images/Deflector1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 5, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsChal = [
    { name: 'T4L Chalice', image: 'images/Chalice4L.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1.4, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Chalice', image: 'images/Chalice4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1.35, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Chalice', image: 'images/Chalice4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.3, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3E Chalice', image: 'images/Chalice3E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1.25, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Chalice', image: 'images/Chalice3R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1.23, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Chalice', image: 'images/Chalice3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.2, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2E Chalice', image: 'images/Chalice2E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1.15, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Chalice', image: 'images/Chalice2C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Chalice', image: 'images/Chalice1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.05, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsMonocle = [
    { name: 'T4L Monocle', image: 'images/Monocle4L.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1.3, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Monocle', image: 'images/Monocle4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1.25, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Monocle', image: 'images/Monocle4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.2, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Monocle', image: 'images/Monocle3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.15, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Monocle', image: 'images/Monocle2C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Monocle', image: 'images/Monocle1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.05, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsIHRDefl = [
    { name: 'T4L Defl.', image: 'images/Deflector4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 20, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Defl.', image: 'images/Deflector4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 19, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Defl.', image: 'images/Deflector4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 17, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Defl.', image: 'images/Deflector4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 15, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Defl.', image: 'images/Deflector3R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 13, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Defl.', image: 'images/Deflector3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 12, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Defl.', image: 'images/Deflector2C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 8, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Defl.', image: 'images/Deflector1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 5, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'images/RandomEpic.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsIHRSIAB = [
    { name: 'T4L SIAB', image: 'images/SIAB4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'images/SIAB4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'T4C SIAB', image: 'images/SIAB4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 70, chickmult: 1 },
    { name: 'T3R SIAB', image: 'images/SIAB3R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 60, chickmult: 1 },
    { name: 'T3C SIAB', image: 'images/SIAB3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 50, chickmult: 1 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'images/RandomEpic.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemLabel1 = [
    { name: 'Boosted Arti. Set:' },
    { name: 'IHR Arti. Set:' }
];
const itemLabel2 = [
    { name: 'Boosted Arti. Set:' },
    { name: 'IHR Artifact Set:' }
];
const tableLabels = [
    { name: 'Player' },
    { name: 'ELR' },
    { name: 'SR' },
    { name: 'Contr. Ratio' },
    { name: 'Boost Order' },
    { name: 'BTV' },
    { name: 'Teamwork' },
    { name: 'Completion Time' },
    { name: 'CS' }
];


const itemLists = [itemLabel1, itemsDefl, itemsMetro, itemsComp, itemsGusset, itemLabel2, itemsIHRDefl, itemsIHRSIAB, itemsMonocle, itemsChal];

const artiQualArray = [[0, 0, 0, 0, 0, 0, 0, 0],
[3, 0, 0, 0, 3, 1, 1, 0],
[3, 1, 1, 1, 3, 3, 2, 1],
[4, 2, 2, 1, 3, 4, 2, 2]];


const scenarios = [
    {
        name: "All T4L Defl. + Leggies",
        apply: (players) => {
            //numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
            //document.getElementById('QPlayerInput').value = numPlayers + ' 0';
            //return;
            // Set all players to T4L
            players.forEach(player => {
                for (let n = 0; n < 4; n++) {
                    player.artifacts[n] = itemLists[n + 1][0];
                }
            });
            handleArtifactChange(players);
        }
    },
    {
        name: "All T4E Defl. + Leggies",
        apply: (players) => {
            players.forEach(player => {
                for (let n = 1; n < 4; n++) {
                    player.artifacts[n] = itemLists[n + 1][0];
                }
                player.artifacts[0] = itemLists[1][1];
            });
            handleArtifactChange(players);
        }
    },
    {
        name: "All T4R Defl. + Leggies",
        apply: (players) => {
            players.forEach(player => {
                for (let n = 1; n < 4; n++) {
                    player.artifacts[n] = itemLists[n + 1][0];
                }
                player.artifacts[0] = itemLists[1][2];
            });
            handleArtifactChange(players);
        }
    },
    {
        name: "All T4C Defl. + Leggies",
        apply: (players) => {
            players.forEach(player => {
                for (let n = 1; n < 4; n++) {
                    player.artifacts[n] = itemLists[n + 1][0];
                }
                player.artifacts[0] = itemLists[1][3];
            });
            handleArtifactChange(players);
        }
    },
    {
        name: "Mixed Deflectors",
        apply: (players) => {
            const numPlayers = players.length;
            const b = Math.floor(numPlayers / 4);
            players.forEach((player, i) => {
                const group =
                    i < b ? 0 :
                        i < 2 * b ? 1 :
                            i < 3 * b ? 2 : 3;

                for (let n = 1; n < 4; n++) {
                    player.artifacts[n] = itemLists[n + 1][0];
                }

                player.artifacts[0] = itemLists[1][group];
            });
            handleArtifactChange(players);
        }
    }
];




let maxCS = 0;
let curentURLEncodeVer = 'v-5';
let coopNameFromURL = null;
let coopNameFromBot = false;
const deflLinked = {}; // tracks whether each player's two defl slots are linked
const siabLinked = {}; // tracks whether each player's boosted and IHR SIAB slots are linked

// Function to generate player inputs
function generatePlayers(artiArray) {
    numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
    const targetEggAmount = parseInt(document.getElementById('targetEggAmount').value, 10);
    const eggUnit = document.getElementById('eggUnit').value;
    const container = document.getElementById('playersContainer');
    const currentPlayers = container.children.length;
    const containerInfo = document.getElementById('infoContainer');
    const containerInfo2 = document.getElementById('info2Container');
    const savedElementArray = document.getElementById('savedPlayerContainer');
    const containerRun = document.getElementById('runContainer');
    const containerOptOrder = document.getElementById('optimizeOrderContainer');
    const containerResults = document.getElementById('resultsContainer');
    const table = document.getElementById('playersTable');
    const tableCoop = document.getElementById('coopTable');
    const run = document.getElementById('run');
    const durUnit = document.getElementById('durUnit').value;
    //const saveButton = document.getElementById('saveButton');
    const btvtargetobj = document.getElementById('btvTarget');
    const artiQual = document.getElementById('artiQual').selectedIndex;
    const cxpToggle = document.getElementById('cxpToggle');
    if (artiArray !== undefined) {
        const artiNumbers = artiArray.split(/\s+/).filter(n => n !== '').map(Number);
        numPlayers = artiNumbers.reduce((acc, curr) => acc + curr, 0);
    }
    if (numPlayers == 0)
        return;

    if (numPlayers > 70) {
        strCoopSize = `<h2>CoopSize too large`;
        containerInfo.innerHTML = (strCoopSize);
        return;
    }

    //saveButton.hidden = false;
    // Remove players
    if (numPlayers < currentPlayers) {
        for (let i = container.children.length - 1; i >= (numPlayers); i--) {
            container.removeChild(container.children[i]);
        }
    }

    // Clear previous content
    if (currentPlayers === 0) {
        container.innerHTML = '';
        containerInfo.innerHTML = '';
        containerRun.innerHTML = '';
        containerResults.innerHTML = '';
        containerOptOrder.innerHTML = '';

        const str = document.createElement('div');
        str.innerHTML = `<h1>Player Information`;
        containerInfo.appendChild(str);

        const str2 = document.createElement('div');
        str2.innerHTML = `<h1>Results`;
        containerResults.appendChild(str2);
    }
    table.innerHTML = '';
    tableCoop.innerHTML = '';

    // Change existing players artis, if specified

    if (artiArray !== undefined) {
        for (let i = 0; i < currentPlayers; i++) {
            n = findDeflectorForPlayer(i, artiArray.split(/\s+/).filter(n => n !== '').map(Number));
            defl1El = document.getElementById(`player${i}_item${1}`);
            defl1El.selectedIndex = n;
            defl2El = document.getElementById(`player${i}_item${5}`);
            defl2El.selectedIndex = n;
            setColor(defl1El);
            setColor(defl2El);
        }
    }

    // Generate player sections
    for (let i = currentPlayers; i < numPlayers; i++) {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player');

        // New Code: Create Up and Down buttons
        playerDiv.setAttribute("id", `player-${i}`);
        const strBO = document.createElement('label');
        strBO.innerHTML = 'Move boost order:  ';


        const upButton = document.createElement("button");
        upButton.textContent = '\u{02191}';
        upButton.onclick = () => movePlayerUp(i);

        const downButton = document.createElement("button");
        downButton.textContent = '\u{02193}';
        downButton.onclick = () => movePlayerDown(i);

        const quickMoveButton = document.createElement("label");
        quickMoveButton.textContent = 'Quick Move To Postion: ';
        quickMoveButton.style.paddingLeft = '5px';
        quickMoveButton.style.paddingRight = '5px';
        //quickMoveButton.onClick = () => movePlayerQuick(i);

        const movePosition = document.createElement("input");
        movePosition.type = "number";
        movePosition.min = 1;
        movePosition.value = i + 1;
        movePosition.id = `MovePosition${i}`;
        movePosition.style.width = '62px';
        movePosition.onchange = () => movePlayerQuick(i);

        playerDiv.appendChild(strBO);
        playerDiv.appendChild(upButton);
        playerDiv.appendChild(downButton);
        playerDiv.appendChild(quickMoveButton);
        playerDiv.appendChild(movePosition);
        // New Code end

        // Create a container for player information
        const playerInfoDiv = document.createElement('div');
        playerInfoDiv.classList.add('player-info');
        playerInfoDiv.innerHTML = `
            <label for="playerName${i}">Name:</label>
            <input type="text" id="playerName${i}" value="Player ${i}" style="width:120px">
            <label for="playerTokens${i}">Tokens:</label>
            <input type="number" id="playerTokens${i}" min="0" value="6" max="12" onkeyup=enforceMinMax(this)>
            <label for="playerMirror${i}">Mirror?:</label>
            <input type="checkbox" id="playerMirror${i}">
            <label for="Shipping-colleggtible${i}">Colleggtibles?:</label>
            <input type="checkbox" id="Shipping-colleggtible${i}" checked="true">
            <label for="Sink${i}" id="SinkLabel${i}">Sink?:</label>
            <input type="checkbox" id="Sink${i}">
            <label for="Creator${i}">Creator?:</label>
            <input type="checkbox" id="Creator${i}">
            <label for="playerTE${i}">#TE:</label>
            <input type="number" id="playerTE${i}" min="0" value="10" max="999" onkeyup=enforceMinMax(this)>
        `;

        const itemsGrid = document.createElement('div');
        itemsGrid.classList.add('itemsGrid');


        offset = 0;
        itemLists.forEach((itemList, index) => {
            if (index == 0 || index == 5) {
                const itemDiv = document.createElement('div');
                itemDiv.innerHTML = `
                    <label for="player${i}_item${index + 1 - offset}">${itemLabel1[offset].name}</label>
                `;
                itemsGrid.appendChild(itemDiv);
                offset += 1;
            } else {
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('item');
                itemDiv.innerHTML = `
                        <select id="player${i}_item${index + 1 - offset}" name="player${i}_items" onchange="updateImage(${i}, ${index + 1 - offset})">
                        ${itemList.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}
                        
                    </select>
                `;
                itemsGrid.appendChild(itemDiv);
            }

        });

        const imageContainer = document.createElement('div');
        imageContainer.classList.add('imageContainer');
        imageContainer.id = `imageContainer${i}`;
        playerDiv.appendChild(imageContainer);

        playerDiv.appendChild(playerInfoDiv); // Add player info row
        playerDiv.appendChild(itemsGrid);
        container.appendChild(playerDiv);




        // Change color of generated lists. Not sure why it's not working when the list is generated
        for (let j = 1; j <= 4; j++) {
            const selectElement = document.getElementById(`player${i}_item${j}`);
            selectElement.style.backgroundColor = '#fef941';
            selectElement.style.color = '#333';
        }
        for (let j = 5; j <= 8; j++) {
            const selectElement = document.getElementById(`player${i}_item${j}`);
            selectElement.style.backgroundColor = '#fef941';
            selectElement.style.color = '#333';
        }
    }

    // Add or remove sink option depending on seasonal or leggacy
    let cxpVal = cxpToggle.checked;
    if (cxpVal) {
        for (let i = 0; i < numPlayers; i++) {
            document.getElementById(`Sink${i}`).hidden = cxpVal;
            document.getElementById(`SinkLabel${i}`).hidden = cxpVal;
        }
    }

    // GenerateCoopTable
    const tableHeaderCoop = `<tr>
        <th>Production Rate (q/hr)</th>
        <th>Completion Time</th>
        <th>max CS</th>
        <th>mean CS <span class="info-tip info-tip--down" data-tip="Mean excludes Sinks, and players without deflectors in boosted set.">?</span></th>
        <th>Deflector Boost</th>
        <th>Unused Deflector %</th>
    </tr>`;
    const tableRowsCoop = [];

    rowCoop = `<tr>`;
    for (let i = 0; i < 6; i++) {
        rowCoop += `<td></td>`;
    }
    rowCoop += `</tr>`;
    tableRowsCoop.push(rowCoop);

    tableCoop.innerHTML = tableHeaderCoop + tableRowsCoop.join('');

    // Generate table
    /*const tableHeader = `<tr>
        <th>Player</th>
        <th>TE</th>
        <th>elr (q/hr)</th>
        <th>sr (q/hr)</th>
        <th>Population</th>
        <th>Contr. Ratio</th>
        <th>Pre-Boost / Time Boosting <span class="info-tip info-tip--down" data-tip="Pre-Boost: time from coop start until the player's boost begins. Time Boosting: time from boost start until habs are full (or time to fill habs naturally if max was reached before boosting).">?</span></th>
        <th>BTV / complTime</th>
        <th>Teamwork</th>
        <th>CS</th>
    </tr>`;*/
    const tableHeader = `<tr>${tableColumns.map(col => `<th>${col}</th>`).join('')}</tr>`;

    const tableRows = [];
    /*for (let i = 0; i < numPlayers; i++) {
        const row = `<tr>
        <td id="playerNameTable${i}">Player ${i}</td>
        ${items.map(() => `<td></td>`).join('')}
    </tr>`;
        tableRows.push(row);
    }*/
    /*
    for (let i = 0; i < numPlayers; i++) {
        const row = `<tr>
        <td id="playerNameTable${i}">Player ${i}</td>
        ${Array.from({ length: tableColumns.length - 1 }, () => `<td></td>`).join('')}
    </tr>`;
        tableRows.push(row);
    }
    */
    for (let i = 0; i < numPlayers; i++) {
        const cells = tableColumns.map((col, index) => {
            if (index === 0) {
                return `<td id="playerNameTable${i}">Player ${i}</td>`;
            }
            if (index === tableColumns.length - 1) {
                return `<td class="final-points"></td>`; // 👈 important
            }
            return `<td></td>`;
        }).join('');

        const row = `<tr>${cells}</tr>`;
        tableRows.push(row);
    }

    table.innerHTML = tableHeader + tableRows.join('');

    const optimizerSummaryText = `
        The optimizer follows:
        • Anchoring the first player and sweeps their token count independently
        • Finds a strong uniform baseline for the remaining players
        • Explores front-loaded token distributions
        • Explores back-loaded token distributions
        • Explores symmetric front-and-back token distributions
        • Uses monotonic pruning to stop exploring once CS decreases
        • Avoids duplicate evaluations by tracking previously tested token vectors
        • Records every evaluated scenario along with its Contract Score
        This approach achieves near-optimal results without brute-force search.
        Currently, this only works on fast PCs and crashes on phones. 
        `;

    strinfo = '<b><u>Valid for cxp-v0.2.0</u></b>' + "<br />" + 'Current Colleggtibles Assumed (If Checked): +5% Shipping, +5% Shipping, +5% IHR, +5% Layrate, +5% Hab Capacity' + "<br />"
        + '<b><u>Assumptions:</u></b> 50x tach. boost assumed prior to boost. coopSize = maxCoopSize. All players present for token farming, '
        + 'all players check in immediately when finished boosting and update artis, and check in right at completion. Offline IHR, and token farming always assumed; shiny deflectors are equipped with life stones during boosting, and quant / tach after boosting '
        + '(these will overshoot CS predictions a bit).  ' + "<br />" + '<b><u>Boosting Assumptions(no mirror): </u></b>' + "<br />" + ' < 2 token or > 12 tokens = 50x tach, '
        + '1 token = (40x tach)(2x beacon), 2 token = 140x tach, ' + "<br />" + '3 token = (130x tach) (2x beacon), 4 token = 1040x tach, '
        + "<br />" + '5 token = (1030x tach) (2x beacon), 6 token = (1020x tach) (4x beacon), ' + "<br />" + '7 token = (1010x tach) (6x beacon), 8 token = (1030x tach) (10x beacon), '
        + "<br />" + '9 token = (1020x tach) (12x beacon), 10 token = (1010x tach) (14x beacon), ' + "<br />" + '11 token = (1000x tach) (16x beacon), 12 token = (1030x tach) (50x beacon) '
        + "<br />" + '<b>Example:</b> If (Mirror is checked &amp; tokens=9) then 1020x tach + 10x beacon + mirror is assumed.'
        + "<br />" + '<b><u>Assumptions with SIAB in Boosted Arti Set:</u></b>'
        + "<br />" + 'SIAB is switched at designated time to a legendary in the same slot. This does assume that if gusset is swapped in, chickens are immediately maxed which will overshoot projections a bit. It also assumes there is only 1 swap time. That is, in old runs, if 1 player is using T4L SIAB and another T4E SIAB, the T4E will want to keep theirs in for longer in a real coop, '
        + 'but the simulation will switch theirs when it is optimal for the T4L player'
        + "<br /><b><u>Creator</b></u><br /> Creators do not get btv penalized during Join Delay time. Additionally, if Join Delay time is very long, and the creator(s) is at the top of the boost list, they could boost before Join Delay time is complete. If everyone is a creator, no one loses btv during Join Delay, and Join Delay time is ignored."
        + "<br /><b><u>Token Optimization</b></u><br /> It is impossible to search through all possible token values for any moderate coopSize. <br /> " + optimizerSummaryText.trim();
    containerInfo2.style.whiteSpace = "pre-wrap";
    containerInfo2.innerHTML = strinfo;

    // Add listeners
    onPlayersGenerated();

    if (artiArray === undefined) {
        // Set default arti Quality
        for (let i = currentPlayers; i < numPlayers; i++) {
            // Add listeners to each player
            document.getElementById(`playerName${i}`).onchange = () => Run();
            document.getElementById(`playerTokens${i}`).onchange = () => Run();
            document.getElementById(`playerMirror${i}`).onchange = () => Run();
            document.getElementById(`Shipping-colleggtible${i}`).onchange = () => Run();
            document.getElementById(`Sink${i}`).onchange = () => Run();
            document.getElementById(`Creator${i}`).onchange = () => Run();
            selectElement = document.getElementById(`playerTE${i}`);
            selectElement.onchange = () => Run();
            selectElement.value = document.getElementById('numTEDefault').value;
            for (let j = 1; j < 5; j++) {
                selectElement = document.getElementById(`player${i}_item${j}`);
                selectElement.onchange = null; // Run() called after sync in addEventListener
                selectElement.selectedIndex = artiQualArray[artiQual][j - 1];
                setColor(selectElement);
            }
            for (let j = 5; j < 9; j++) {
                selectElement = document.getElementById(`player${i}_item${j}`);
                selectElement.onchange = null; // Run() called after sync in addEventListener
                selectElement.selectedIndex = artiQualArray[artiQual][j - 1];
                setColor(selectElement);
            }
        }
    } else {
        for (let i = currentPlayers; i < numPlayers; i++) {
            n = findDeflectorForPlayer(i, artiArray.split(/\s+/).filter(n => n !== '').map(Number));
            defl1El = document.getElementById(`player${i}_item${1}`);
            defl1El.selectedIndex = n;
            defl2El = document.getElementById(`player${i}_item${5}`);
            defl2El.selectedIndex = n;
            setColor(defl1El);
            setColor(defl2El);
        }
        // Reset number of players based on number of typed players
        document.getElementById('numPlayers').value = numPlayers;
    }


    // Run
    Run();
}


function removeReferenceCS() {
    const table = document.getElementById('playersTable');
    const headerRow = table.querySelector('tr');
    const ths = Array.from(headerRow.children);
    const refIndex = ths.findIndex(th => th.classList.contains('reference-col'));

    if (refIndex === -1) return;

    const rows = table.querySelectorAll('tr:not(:first-child)');
    rows.forEach(row => {
        const csCell = row.querySelector('.final-points');
        if (csCell) {
            csCell.classList.remove('increase', 'decrease');
            if (csCell.innerHTML.includes('<br>')) {
                csCell.innerHTML = csCell.innerHTML.split('<br>')[0];
            }
        }
        const cells = row.children;
        if (cells[refIndex]) cells[refIndex].remove();
    });
    ths[refIndex].remove();
}

function hideScenarioOutput() {
    document.getElementById("scenarioOutputContainer")
        .classList.add("hidden");
}


const button = document.getElementById("saveReference");

button.addEventListener("click", () => {
    const table = document.getElementById('playersTable');
    const headerRow = table.querySelector("tr");

    const params = new URLSearchParams(window.location.search);
    const base64Data = params.get('data');
    let url = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;

    if (coopNameFromURL) {
        const coopEncoded = btoa(encodeURIComponent(coopNameFromURL));
        url += `&c=${coopEncoded}`;
    }

    // Check if header exists
    let th = table.querySelector("th.reference-col");

    if (!th) {
        // Create the header
        th = document.createElement("th");
        th.classList.add("reference-col");
        headerRow.appendChild(th);

        // Add remove button
        const removeBtn = document.createElement('span');
        removeBtn.classList.add('remove-ref');
        removeBtn.textContent = '✖';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.color = 'maroon';
        removeBtn.style.marginLeft = '5px';
        removeBtn.title = 'Remove Reference Column';
        removeBtn.addEventListener('click', removeReferenceCS);
        th.appendChild(removeBtn);
    }

    // Update header content with new URL (link goes before remove button)
    const removeBtn = th.querySelector(".remove-ref");
    th.innerHTML = `Ref CS <a href="${url}" target="_blank">🔗</a>`;
    if (removeBtn) th.appendChild(removeBtn); // reattach remove button

    const rows = table.querySelectorAll("tr:not(:first-child)");

    rows.forEach(row => {
        const finalPointsCell = row.querySelector(".final-points");
        const finalValue = parseFloat(finalPointsCell.textContent) || 0;

        let refCell = row.querySelector(".reference-col");

        if (!refCell) {
            refCell = document.createElement("td");
            refCell.classList.add("reference-col");
            row.appendChild(refCell);
        }

        // Save current final value
        refCell.textContent = finalValue;

        // Reset (+/-) highlights
        finalPointsCell.classList.remove("increase", "decrease");
        finalPointsCell.textContent = finalValue; // remove (+/-) if any
    });

    // Save coop-level max CS and mean CS as reference values
    const coopTable = document.getElementById('coopTable');
    const coopRows = coopTable.getElementsByTagName('tr');
    if (coopRows.length > 1) {
        const coopCells = coopRows[1].getElementsByTagName('td');
        if (coopCells[2] && coopCells[3]) {
            // Read the raw numeric value (text before any <br> ref line)
            const rawMax = parseFloat(coopCells[2].textContent) || 0;
            const rawMean = parseFloat(coopCells[3].textContent) || 0;
            coopCells[2].dataset.refMax = rawMax;
            coopCells[3].dataset.refMean = rawMean;
            // Clear increase/decrease and rewrite to show ref line
            coopCells[2].classList.remove('increase', 'decrease');
            coopCells[2].textContent = rawMax;
            coopCells[3].classList.remove('increase', 'decrease');
            coopCells[3].textContent = rawMean;
        }
    }

    // Run to clear any other displays if needed
    Run();
});
// Remove reference column and reset differences

function findDeflectorForPlayer(n, artiNumbers) {
    let total = 0;
    for (let i = 0; i < artiNumbers.length; i++) {
        total += artiNumbers[i];

        if (n + 1 <= total) {
            return i;
        }
    }
}

function movePlayerUp(i) {
    const playersContainer = document.getElementById("playersContainer");
    if (i > 0) {
        const playerDiv = playersContainer.children[i];
        playersContainer.insertBefore(playerDiv, playersContainer.children[i - 1]);

        const upButton = playerDiv.children[1];//querySelector('button:first-child');
        const downButton = playerDiv.children[2]; //.querySelector('button:last-child');
        const movePosition = playerDiv.children[4];
        upButton.onclick = () => movePlayerUp(i - 1);
        downButton.onclick = () => movePlayerDown(i - 1);
        movePosition.onchange = () => movePlayerQuick(i - 1);


        const playerDiv2 = playersContainer.children[i];
        const upButton2 = playerDiv2.children[1]; //.querySelector('button:first-child');
        const downButton2 = playerDiv2.children[2]; //.querySelector('button:last-child');
        const movePosition2 = playerDiv2.children[4];
        upButton2.onclick = () => movePlayerUp(i);
        downButton2.onclick = () => movePlayerDown(i);
        movePosition2.onchange = () => movePlayerQuick(i);

        // Reset id's
        for (let j = 1; j < 9; j++) {
            swapID(`player${i}_item${j}`, `player${i - 1}_item${j}`);
        }
        swapID(`playerName${i}`, `playerName${i - 1}`);
        swapID(`playerTokens${i}`, `playerTokens${i - 1}`);
        swapID(`playerMirror${i}`, `playerMirror${i - 1}`);
        swapID(`Shipping-colleggtible${i}`, `Shipping-colleggtible${i - 1}`);
        swapID(`Sink${i}`, `Sink${i - 1}`);
        swapID(`Creator${i}`, `Creator${i - 1}`);
        swapID(`playerTE${i}`, `playerTE${i - 1}`);
        const container = document.getElementById('playersContainer');
        const playerDivs = Array.from(container.children);
        playerDivs[i].id = `player2-${i}`;
        playerDivs[i - 1].id = `player-${i - 1}`;
        playerDivs[i].id = `player-${i}`;
        playerDivs[i].children[4].value = i + 1;
        playerDivs[i - 1].children[4].value = i;

        Run();
    }
}

function swapID(id1, id2) {
    const el1 = document.getElementById(id1);
    const el2 = document.getElementById(id2);
    if (!el1 || !el2) return;

    const tempID = el1.id;
    el1.id = el2.id;
    el2.id = tempID;
}


function movePlayerDown(i) {
    const playersContainer = document.getElementById("playersContainer");
    if (i < playersContainer.children.length - 1) {
        const playerDiv = playersContainer.children[i];
        playersContainer.insertBefore(playerDiv.nextSibling, playerDiv);

        const upButton = playerDiv.children[1];
        const downButton = playerDiv.children[2];
        const movePosition = playerDiv.children[2];
        upButton.onclick = () => movePlayerUp(i + 1);
        downButton.onclick = () => movePlayerDown(i + 1);
        movePosition.onchange = () => movePlayerQuick(i + 1);

        const playerDiv2 = playersContainer.children[i];
        const upButton2 = playerDiv2.children[1];
        const downButton2 = playerDiv2.children[2];
        const movePosition2 = playerDiv.children[2];
        upButton2.onclick = () => movePlayerUp(i);
        downButton2.onclick = () => movePlayerDown(i);
        movePosition2.onchange = () => movePlayerQuick(i);

        // Reset id's
        for (let j = 1; j < 9; j++) {
            swapID(`player${i}_item${j}`, `player${i + 1}_item${j}`);
        }
        swapID(`playerName${i}`, `playerName${i + 1}`);
        swapID(`playerTokens${i}`, `playerTokens${i + 1}`);
        swapID(`playerMirror${i}`, `playerMirror${i + 1}`);
        swapID(`Shipping-colleggtible${i}`, `Shipping-colleggtible${i + 1}`);
        swapID(`Sink${i}`, `Sink${i + 1}`);
        swapID(`Creator${i}`, `Creator${i + 1}`);
        swapID(`playerTE${i}`, `playerTE${i + 1}`);
        const container = document.getElementById('playersContainer');
        const playerDivs = Array.from(container.children);
        playerDivs[i].id = `player2-${i}`;
        playerDivs[i + 1].id = `player-${i + 1}`;
        playerDivs[i].id = `player-${i}`;
        playerDivs[i + 1].children[4].value = i + 1 + 1;
        playerDivs[i].children[4].value = i + 1;

        Run()
    }
}

function movePlayerQuick(currentIndex) {

    const playersContainer = document.getElementById("playersContainer");
    const playerDiv = playersContainer.children[currentIndex];
    const numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
    desiredIndex = parseInt(playerDiv.children[4].value);
    // Sanitize inputs
    desiredIndex = (desiredIndex < 0) ? 0 : desiredIndex;
    desiredIndex = (desiredIndex > numPlayers) ? (numPlayers) : desiredIndex;
    playerDiv.children[4].value = desiredIndex;
    while (currentIndex < (desiredIndex - 1) && currentIndex < (numPlayers)) {
        movePlayerUp(currentIndex + 1);
        currentIndex++;
    }
    while (currentIndex > (desiredIndex - 1) && currentIndex >= 0) {
        movePlayerUp(currentIndex);
        currentIndex--;
    }

};

function buildSimConfigFromUI() {
    return {
        numPlayers: parseInt(document.getElementById('numPlayers').value, 10),
        crtTime: parseFloat(document.getElementById('crttime').value),
        crtRun: document.getElementById('crtToggle').checked,
        tokenToggle: document.getElementById('tokenToggle').checked,
        timeToTokenGift: parseFloat(document.getElementById('mpft').value) * 60,
        tokenTimer: Math.max(
            parseFloat(document.getElementById('tokenTimer').value) * 60,
            1
        ),
        duration: convertUnits(
            parseFloat(document.getElementById('duration').value),
            document.getElementById('durUnit').value
        ),
        targetEggAmount: convertUnits(
            parseFloat(document.getElementById('targetEggAmount').value),
            document.getElementById('eggUnit').value
        ),
        btvTarget: parseFloat(document.getElementById('btvTarget').value),
        new2p0: document.getElementById('cxpToggle').checked,
        GG: document.getElementById('GGToggle').checked ? 2 : 1,
        btvtargetobj: document.getElementById('btvTarget'),
        btvlabel: document.getElementById('btvTargetLabel'),
        SIABtext: document.getElementById('SIABSwapContainer'),
        playersContainer: document.getElementById("playersContainer"),
        playerDivs: Array.from(document.getElementById("playersContainer").children),
        consoleElement: document.getElementById('console'),
        containerOptOrder: document.getElementById('optimizeOrderContainer')
    };

}

function getArtifactFromDOM(playerIndex, slotIndex, itemLists) {
    const select = document.getElementById(`player${playerIndex}_item${slotIndex}`);

    if (!select || !select.value) return null;

    return itemLists[slotIndex].find(
        item => item.name === select.value
    ) ?? null;
}

function buildPlayersFromUI(simConfig) {
    const players = [];
    let totDeflector = 0;

    for (let i = 0; i < simConfig.numPlayers; i++) {
        const defl = getDeflectorPerc(i);
        totDeflector += defl;

        // Get Artifacts from DOM
        const layArtifacts = [];
        const ihrArtifacts = [];

        // Lay-rate artifacts (slots 0–3)
        for (let n = 0; n < 4; n++) {
            layArtifacts.push(
                getArtifactFromDOM(i, n + 1, itemLists)
            );
        }


        const player = new PlayerClass({
            name: document.getElementById(`playerName${i}`)?.value ?? `Player ${i}`,
            tokens: parseInt(document.getElementById(`playerTokens${i}`).value, 10),
            stats: {
                boostMulti: calcBoostMulti(0),
                maxChickens: getMaxChickens(i),
                deflectorPercent: defl,
                siabPercent: getSIABPerc(i),
                timeToBoost: simConfig.duration,
                TE: document.getElementById(`playerTE${i}`).value
            },
            rates: {
                ihr: calcIHR(i),
                baseShip:
                    2978359222414.5 * 2400 *
                    getCollegtibleShip(i) *
                    getSRModifier(),
                baseELR:
                    332640 *
                    getELRModifier() *
                    getCollegtibleELR(i)
            },
            flags: {
                needsMirror: document.getElementById(`playerMirror${i}`).checked,
                isSink: document.getElementById(`Sink${i}`).checked,
                isCreator: document.getElementById(`Creator${i}`).checked,
                collegg: document.getElementById(`Shipping-colleggtible${i}`).checked
            },
            artifacts: layArtifacts
        });

        players.push(player);
    }

    // Fill otherDefl once
    players.forEach(p => {
        p.stats.otherDefl = totDeflector - p.stats.deflectorPercent;
    });

    return players;
}


// Main simulation
function Run() {
    const simConfig = buildSimConfigFromUI();
    const players = buildPlayersFromUI(simConfig);

    const results = RunSimulation(players, simConfig);
    simConfig.SIABtext.innerHTML = '';
    simConfig.btvtargetobj.hidden = true;
    simConfig.btvlabel.hidden = true;
    displayResults(players, simConfig, results);
}
function displayResults(players, simConfig, results) {
    let {
        success,
        coopRateBeforeSwap,
        coopRate,
        siabActive,
        completionTime,
        maxCS,
        meanCS,
        coopDeflector,
        unusedDeflector,
        siabSwapTime,
        totalDeflector
    } = results;
    // Calculate how much deflector% can be dropped
    [defDropPerc2, defDropPerc] = getDeflectorDropPerc(players, totalDeflector, siabActive);
    if (!success) {
        fillTableFail();
        return;
    }
    fillTableUnified(players, results, simConfig, siabSwapTime);
    //fillTableUnified(players, completionTime, simConfig.targetEggAmount, simConfig.duration, simConfig.new2p0, siabSwapTime);
    if (results.siabActive) {

        //fillTable2SIAB(players, completionTime, simConfig.targetEggAmount, simConfig.duration, siabSwapTime, simConfig.new2p0);
        fillTableCoopSIAB(results, defDropPerc, defDropPerc2)
    } else {
        //fillTable2(players, completionTime, simConfig.targetEggAmount, simConfig.duration, simConfig.new2p0);
        fillTableCoop(results, defDropPerc);
    }

    return;
}
function handleArtifactChange(players) {

    let totDeflector = 0;
    players.forEach(p => {
        let chick = 11340000000;
        let deflectorPercent = 0;
        let siabPercent = 0;
        for (let i = 0; i < 4; i++) {
            const a = p.artifacts[i];
            chick *= a.chickmult;
            deflectorPercent += a.deflectorPercent;
            siabPercent += a.siabPercent;
        }
        /*
        Object.values(p.artifacts).forEach(a => {
            chick *= a.chickmult;
            deflectorPercent += a.deflectorPercent;
            siabPercent += a.siabPercent;
        });*/
        if (p.flags.collegg) {
            chick *= 1.05;
        }
        p.stats.maxChickens = chick;
        p.stats.deflectorPercent = deflectorPercent;
        //p.stats.siabPercent = siabPercent;

        totDeflector += p.stats.deflectorPercent;
    });

    // Fill otherDefl once
    players.forEach(p => {
        p.stats.otherDefl = totDeflector - p.stats.deflectorPercent;
    });
}


function RunSimulation(players, simConfig) {
    let {
        numPlayers,
        crtTime,
        timeToTokenGift,
        tokenTimer,
        duration,
        targetEggAmount,
        GG,
        new2p0,
        btvtargetobj,
        btvlabel,
        btvTarget,
        SIABtext,
        playersContainer,
        playerDivs,
        consoleElement,
        containerOptOrder
    } = simConfig;

    // initialize
    simState = {
        updateRate: 1, // 1/seconds
        eggsDelivered: 0, // Total Eggs delivered by all players
        t_elapsed: 0, // Start sim at t=0
        tokensUsed: 0, // Total coop tokens used
        numberBoosting: 0, // Total number of players boosting
        allMaxHabs: false, // flag if all players haven't fill habs
        allBoosting: false, // flag if all players have boosted
        siabSwapTime: 0
    };
    coopResult = {
        success: false,
        coopRateBeforeSwap: 0,
        coopRate: 0,
        siabActive: false,
        siabSwapTime: 0,
        completionTime: 0,
        maxCS: 0,
        meanCS: 0,
        coopDeflector: 0,
        unusedDeflector: 0,
        totalDeflector: 0
    };

    // Simulate CRT if first player is creator
    if (players[0].flags.isCreator) {
        if (simState.t_elapsed < crtTime)
            simState = simUpdateRate(players, simConfig, simState, coopResult, crtTime, true);
    } else { // else, just update creator's BTV, and propogate t_elapsed to crtTime
        players.forEach(player => {
            if (player.isCreator) {
                player.updateBTV(crtTime, new2p0);
            }
        });
        simState.t_elapsed = crtTime;
    }

    // Simulate token farming stage until steady state is reached (all Max Habs)
    simState = simUpdateRate(players, simConfig, simState, coopResult, duration, false);
    // Unpack simstate for now. todo: refactor renderResults()



    rate = 0;
    players.forEach(player => {
        rate += player.rates.deliveryRate;
    });
    rate = rate == 0 ? 1 : rate;

    coopResult.coopRate = rate;

    // Propagate steady state to completion.
    if (simState.t_elapsed <= duration) {
        if (simState.eggsDelivered < targetEggAmount) {
            //[creatorSIABActive, siabActive, deflRateMax, siabRateMax] = checkPlayerSIAB(players, new2p0);
            siabStatus = checkPlayerSIAB(players, new2p0);
            coopResult.siabActive = siabStatus.siabActive;
            // Get Coop rate
            rate = 0;
            players.forEach(player => {
                rate += player.rates.deliveryRate;
            });
            rate = rate == 0 ? 1 : rate;

            coopResult.coopRate = rate;

            rateOld = rate;
            // Handle case where SIAB is active, currently only fixes one player, not all, propagate to swap time, update rate
            if (siabStatus.siabActive) {
                coopResult.coopRateBeforeSwap = rateOld;
                rate = handleSIABActive(players, simConfig, simState, rate, siabStatus);
            }
            coopResult.coopRateBeforeSwap = rateOld;
            coopResult.coopRate = rate;

            // Propagate to end of coop
            tRemaining = (targetEggAmount - simState.eggsDelivered) / (rate / 60 / 60);
            coopResult.completionTime = simState.t_elapsed + tRemaining;

            // update each players contrib. & BTV
            players.forEach(player => {
                player.updateEggsDelivered(tRemaining);
                player.updateBTV(tRemaining, new2p0);
            });

            if (coopResult.completionTime < duration) {
                coopResult.success = true;
            }
        }
    }

    coopResult.siabSwapTime = simState.siabSwapTime;

    if (simState.t_elapsed <= duration && simState.eggsDelivered >= targetEggAmount) {
        // Coop completed before everyone boosted
        coopResult.completionTime = simState.t_elapsed;
        coopResult.success = true;
    }
    [coopResult.meanCS, coopResult.maxCS, coopResult.minCS] = getCSMaxMean(players, simConfig, coopResult);


    const [data, data2, repeatedPrefix] = gatherDOMData();
    const base64Data = dataToBase64(data, data2);

    let version = curentURLEncodeVer;

    // If compressed names, replace the middle '-' with '_'
    if (repeatedPrefix) {
        version = curentURLEncodeVer.replace('-', '_'); // 'v_4'
    }
    updateUrlWithBase64(version + base64Data);

    return coopResult;
}

function handleSIABActive(players, simConfig, simState, rate, siabStatus) {
    let {
        numPlayers,
        crtTime,
        timeToTokenGift,
        tokenTimer,
        duration,
        targetEggAmount,
        GG,
        new2p0,
        btvtargetobj,
        btvlabel,
        btvTarget,
        SIABtext,
        playersContainer,
        playerDivs,
        consoleElement,
        containerOptOrder
    } = simConfig;
    let {
        t_elapsed,
        eggsDelivered,
        tokensUsed,
        numberBoosting,
        allBoosting,
        allMaxHabs
    } = simState;

    let {
        creatorSIABActive,
        siabActive,
        deflRateMax,
        siabRateMax } = siabStatus;

    // Ratio of time siab needs to be active for maxing teamwork
    RN = 0;
    saveDataBeforeSwap(players);
    calcRateSIABRemoved(players);

    players.forEach((player, playerIndex) => {
        // Save rates before swap

        //[player.rates.layRate, player.rates.shipRate, player.stats.chickens, player.stats.maxChickens, player.stats.numTach, player.stats.numQuant] = calcRateSIABRemoved(playerIndex, players[playerIndex].stats.chickens, players);
        //todo: cleanup calcRateSIABRemoved, move outside loop, just pass in players
        // calcRateSIABRemoved(playerIndex, players[playerIndex].stats.chickens, players);
        RN += player.rates.deliveryRate / 60 / 60;
    });

    crtFactor = creatorSIABActive ? 1 : 0;

    // Voodoo math for estimating swap time that hits the btvtarget. see: https://discord.com/channels/455380663013736479/1212962842580619285/1349257357733003265
    T0 = t_elapsed - crtTime * crtFactor;
    R1 = rate / 60 / 60;
    num = RN * (btvTarget * crtTime * crtFactor - T0 * (siabRateMax + deflRateMax - btvTarget)) - (deflRateMax - btvTarget) * (targetEggAmount - eggsDelivered);
    den = RN * (siabRateMax + deflRateMax - btvTarget) - (deflRateMax - btvTarget) * R1;
    T1 = num / den;

    T1 = Math.max(T1, 0);
    tCompleteAtCurrentRate = (targetEggAmount - eggsDelivered) / (rate / 60 / 60);
    rateChange = false;
    // Check if swapTime (T1) happens before completion time if no swap occured
    if (T1 < tCompleteAtCurrentRate) {
        rateChange = true;
    }
    T1 = Math.min(T1, tCompleteAtCurrentRate);
    // update each players contrib during T1
    players.forEach(player => {
        //player.updateEggsDelivered(T1);
        player.updateEggsDeliveredSIAB(T1);
        player.updateBTV(T1, new2p0);
    });
    eggsDelivered = players.reduce(
        (sum, player) => sum + player.stats.eggsDelivered,
        0
    );
    players.forEach(player => {
        if (player.stats.siabPercent > 0) {
            player.stats.deliveryRate = Math.min(player.stats.layRate, player.stats.shipRate);
            player.stats.siabPercent = 0;
        }
    });

    if (rateChange) {
        rate = RN * 60 * 60;
    }

    t_elapsed += T1;
    simState.t_elapsed = t_elapsed;
    simState.eggsDelivered = eggsDelivered;
    simState.siabSwapTime = crtTime + T0 + T1;

    return rate;
}

function getCSMaxMean(players, simConfig) {
    maxCS = 0;
    meanCS = 0;
    numNoDefl = 0;
    let {
        numPlayers
    } = simConfig;
    players.forEach(player => {
        if (player.stats.deflectorPercent > 0 && !player.flags.isSink) {
            meanCS += cs;
        } else {
            numNoDefl++;
        }
        if (cs > maxCS)
            maxCS = cs;
    });

    // If at least 1 player has deflector, return meanCS minus those without deflector. If all no deflector, just return mean of all
    if (numPlayers > numNoDefl) {
        meanCS /= (numPlayers - numNoDefl);
    } else {
        meanCS = meanCS / numPlayers;
    }

    return [maxCS, meanCS];

}

function checkPlayerSIAB(players, new2p0) {
    btvRateMax = 0;
    siabActive = false;
    creatorSIABActive = false;
    deflRateMax = 0;
    siabRateMax = 0;
    players.forEach((player, index) => {
        if (player.stats.siabPercent > 0) {
            if (index == 0 && player.isCreator) {
                creatorSIABActive = true;
            }
            siabActive = true;
            player.flags.siabActive = true;
            if (new2p0) {
                deflRate = 12.5 * Math.min(player.stats.deflectorPercent, 12) / 100;
                siabRate = 0.75 * Math.min(player.stats.siabPercent, 50) / 100;
            } else {
                deflRate = 7.5 * player.stats.deflectorPercent / 100;
                siabRate = 0.75 * player.stats.siabPercent / 100;
            }
            if (btvRateMax <= deflRate + siabRate) {
                btvRateMax = deflRate + siabRate;
                deflRateMax = deflRate;
                siabRateMax = siabRate;
            }
        }
    });
    return { creatorSIABActive, siabActive, deflRateMax, siabRateMax };
}

function simUpdateRate(players, simConfig, simState, coopResult, simTime, crtFlag) {
    let {
        numPlayers,
        crtTime,
        timeToTokenGift,
        tokenTimer,
        duration,
        targetEggAmount,
        GG,
        new2p0,
        btvtargetobj,
        btvlabel,
        btvTarget,
        SIABtext,
        playersContainer,
        playerDivs,
        consoleElement,
        containerOptOrder
    } = simConfig;
    let {
        t_elapsed,
        updateRate,
        eggsDelivered,
        tokensUsed,
        numberBoosting,
        allBoosting,
        allMaxHabs,
    } = simState;

    eggsDelivered = players.reduce(
        (sum, player) => sum + player.stats.eggsDelivered,
        0
    );

    while (eggsDelivered < targetEggAmount && t_elapsed < simTime && !allMaxHabs) {
        let totNotMaxHabs = 0;
        coopResult.totalDeflector = 0;
        updateOtherDefl = false;
        players.forEach((player, index) => {
            if (!player.flags.maxHab && (!crtFlag || player.flags.isCreator)) {
                player.updateChickens();
                player.updateDeliveryRate();
                totNotMaxHabs++;
                if (player.flags.maxHab == true) {
                    // Boost Time
                    //time = t_elapsed - player.stats.timeToBoost;
                    //player.stats.boostingTime = t_elapsed - player.stats.timeToBoost;
                    player.stats.boostingTime = player.stats.timeToBoost > 0 && player.stats.timeToBoost < duration
                        ? t_elapsed - player.stats.timeToBoost  // boosted before maxHab
                        : t_elapsed;
                    //Player reached max, swap artis
                    updateArtis(index, player);
                    // Trigger a deflectorchangeto update all rates
                    updateOtherDefl = true;
                }
            }
            coopResult.totalDeflector += player.stats.deflectorPercent;
            player.updateEggsDelivered(updateRate);
            player.updateBTV(updateRate, new2p0);
        });

        if (updateOtherDefl) {
            players.forEach(player => {
                player.stats.otherDefl = coopResult.totalDeflector - player.stats.deflectorPercent;
            });
            players.forEach((player, index) => {
                if (!crtFlag || player.flags.isCreator) {
                    calcRate(index, player.stats.chickens, players);
                    // Todo: continue from here: add .rates, .stats, and .flags to player
                    player.rates.deliveryRate = Math.min(player.rates.layRate, player.rates.shipRate);
                }
            });
        }

        // Check if all players have max Habs
        allMaxHabs = (totNotMaxHabs === 0);

        // Assume average drop rate of tokens
        totTokens = Math.floor(t_elapsed * numPlayers / timeToTokenGift) * GG;
        totTokens += Math.floor(t_elapsed / tokenTimer) + Math.floor((t_elapsed - crtTime) / tokenTimer) * (numPlayers - 1); // Add Timer tokens

        // Check if next user can boost
        /*if (!allBoosting) {
            if (players[numberBoosting].tokens <= (totTokens - tokensUsed) && (!crtFlag || players[numberBoosting].flags.isCreator)) {
                players = playerBoosting(players, numberBoosting);
                tokensUsed += players[numberBoosting].tokens;
                players[numberBoosting].stats.timeToBoost = t_elapsed;
                numberBoosting++;
            }
            allBoosting = numberBoosting == players.length ? true : false;
        }*/
        if (!allBoosting) {
            const nextPlayer = players[numberBoosting];
            if (!crtFlag || nextPlayer.flags.isCreator) {
                if (nextPlayer.flags.maxHab) {
                    // Already at max habs — skip without spending tokens
                    nextPlayer.stats.timeToBoost = duration; // optional: record when this was noted
                    numberBoosting++;
                } else if (nextPlayer.tokens <= (totTokens - tokensUsed)) {
                    players = playerBoosting(players, numberBoosting);
                    tokensUsed += players[numberBoosting].tokens;
                    players[numberBoosting].stats.timeToBoost = t_elapsed;
                    numberBoosting++;
                }
            }
            allBoosting = numberBoosting == players.length;
        }

        // Update eggsDelivered
        eggsDelivered = 0;
        players.forEach(player => {
            if (!crtFlag || player.flags.isCreator) {
                eggsDelivered += player.stats.eggsDelivered;
            }
        });


        t_elapsed += updateRate;
    }

    return {
        t_elapsed,
        updateRate,
        eggsDelivered,
        tokensUsed,
        numberBoosting,
        allBoosting,
        allMaxHabs
    }
}

function saveDataBeforeSwap(players) {
    players.forEach((player) => {
        player.beforeSwap = {
            stats: {
                chickens: player.stats.chickens,
                maxChickens: player.stats.maxChickens,
                numTach: player.stats.numTach,
                numQuant: player.stats.numQuant,
                deflectorPercent: player.stats.deflectorPercent
            },
            rates: {
                layRate: player.rates.layRate,
                shipRate: player.rates.shipRate,
                deliveryRate: player.rates.deliveryRate
            }
        };
    });

}

function getSRModifier() {
    mult = 1;
    // Get Modifier
    const selectMod = document.getElementById(`mod-name`);
    const name = selectMod.value;
    if (name === 'ShipRate') {
        const modMult = document.getElementById(`modifiers`);
        mult *= modMult.value;
    }
    return mult;
}
function getELRModifier() {
    mult = 1;
    // Get Modifier
    const selectMod = document.getElementById(`mod-name`);
    const name = selectMod.value;
    if (name === 'LayRate') {
        const modMult = document.getElementById(`modifiers`);
        mult *= modMult.value;
    }
    return mult;
}

function getCollegtibleShip(playerIndex) {
    return document.getElementById(`Shipping-colleggtible${playerIndex}`).checked ? 1.1025 : 1;
    //return mult;
}

function getCollegtibleELR(playerIndex) {
    return document.getElementById(`Shipping-colleggtible${playerIndex}`).checked ? 1.05 : 1;
    //return mult;
}

function fillTableFail() {
    const table = document.getElementById('playersTable');
    const rows = table.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        for (let j = 1; j < cells.length; j++) {
            cells[j].textContent = '';
        }
    }
    const cells = rows[1].getElementsByTagName('td');
    cells[1].textContent = 'Mission';
    cells[2].textContent = 'failed,';
    cells[3].textContent = 'we\'ll';
    cells[4].textContent = 'get';
    cells[5].textContent = '\'em';
    cells[6].textContent = 'next';
    cells[7].textContent = 'time!';


    const tableCoop = document.getElementById('coopTable');
    const rowsCoop = tableCoop.getElementsByTagName('tr');
    const cellsCoop = rowsCoop[1].getElementsByTagName('td');
    for (let i = 0; i < cellsCoop.length; i++)
        cellsCoop[i].textConent = '';
}


// Column indexes for readability
const COL = {
    NAME: 0,
    TE: 1,
    ELR: 2,
    SR: 3,
    CHICKENS: 4,
    CONTR: 5,
    TIME: 6,
    BTV: 7,
    TEAMWORK: 8,
    CS: 9 // final points
};

// Helper: format rate cell (green if rate >= otherRate)
function formatRateCell(rate, otherRate, count, icon) {
    const colorStart = rate <= otherRate ? '<span style="color:#00CC66">' : '';
    const colorEnd = rate <= otherRate ? '</span>' : '';
    const rateText = (Math.round(rate / 1e9) / 1e6).toString();
    return `${colorStart}${rateText}${colorEnd}<br>${count} ${icon}`;
}

// Helper: format rate cell for SIAB (stacked before/after values)
function formatRateCellSIAB(before, after, icon) {
    return `
        ${formatRateCell(before.rate, before.otherRate, before.count, icon)}
        <br>
        ${formatRateCell(after.rate, after.otherRate, after.count, icon)}
    `;
}

// Unified table renderer
//function fillTableUnified(players, completionTime, targetEggAmount, duration, new2p0, siabSwapTime = null) {
function fillTableUnified(players, results, simConfig, siabSwapTime = null) {
    let {
        targetEggAmount,
        duration,
        new2p0
    } = simConfig;
    let {
        completionTime
    } = results;
    const numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
    const table = document.getElementById('playersTable');
    if (numPlayers === 0) return;

    const rows = table.getElementsByTagName('tr');
    let maxCS = 0, meanCS = 0, minCS = 1e15, numNoDefl = 0, defMeanCS = 0;
    const durDays = duration / 60 / 60 / 24;

    const BT_txt = '<img src="https://staabass.netlify.app/images/b_icon_token.png" width="15" height="15" alt="Tach" align="center">';
    const CR_txt = '<img src="https://staabass.netlify.app/images/CR.png" width="30" height="15" alt="Tach" align="center">';
    const tachImage = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="15" height="15" alt="Tach" align="center">';

    const siabActive = siabSwapTime !== null;

    // Optional SIAB info display
    if (siabActive) {
        const SIABtext = document.getElementById('SIABSwapContainer');
        const strSIAB = document.createElement('div');
        const btvTargetObj = document.getElementById('btvTarget');
        const btvLabel = document.getElementById('btvTargetLabel');

        if (siabSwapTime < completionTime - 1) {
            strSIAB.innerHTML = `<br><b><u>SIAB swapped after:</b></u> ${secondsToString(siabSwapTime)}`;
        } else {
            strSIAB.innerHTML = `<br><b><u>SIAB active entire contract.</b></u>`;
        }
        SIABtext.appendChild(strSIAB);
        btvTargetObj.hidden = false;
        btvLabel.hidden = false;
    }

    for (let i = 1; i < rows.length; i++) { // skip header
        const player = players[i - 1];
        const cells = rows[i].getElementsByTagName('td');
        let cnt = 0;

        // Player Name + Sink info
        let T = player.flags?.isSink ? 2 : (document.getElementById('tokenToggle').checked ? 10 : 0);
        T = (numPlayers === 1) ? 0 : T;
        cells[cnt].innerHTML = player.name;
        if (player.flags?.isSink && !new2p0) {
            cells[cnt].innerHTML += `<br> &#x1FAC2;<br>${calcSinkCR(numPlayers, durDays)}${CR_txt}, ${T}${BT_txt}`;
        }
        cnt++;

        // TE
        cells[cnt++].innerHTML = player.stats.TE;

        // Determine if SIAB stack needed
        const useSIAB = siabActive && player.flags?.siabActive && siabSwapTime < completionTime - 1;
        let base, before;
        if (useSIAB) {
            before = player.beforeSwap;
            base = player;
            // ELR
            cells[cnt++].innerHTML = formatRateCellSIAB(
                { rate: before.rates.layRate, otherRate: before.rates.shipRate, count: before.stats.numTach },
                { rate: base.rates.layRate, otherRate: base.rates.shipRate, count: base.stats.numTach },
                tachImage
            );
            // SR
            cells[cnt++].innerHTML = formatRateCellSIAB(
                { rate: before.rates.shipRate, otherRate: before.rates.layRate, count: before.stats.numQuant },
                { rate: base.rates.shipRate, otherRate: base.rates.layRate, count: base.stats.numQuant },
                quantImage
            );
            // Chickens stacked
            cells[cnt++].innerHTML = `${commafy(before.stats.chickens)}<br>${commafy(base.stats.chickens)}`;
        } else {
            base = siabActive ? player.beforeSwap : player;
            // ELR
            cells[cnt++].innerHTML = formatRateCell(base.rates.layRate, base.rates.shipRate, base.stats.numTach, tachImage);
            // SR
            cells[cnt++].innerHTML = formatRateCell(base.rates.shipRate, base.rates.layRate, base.stats.numQuant, quantImage);
            // Chickens
            cells[cnt++].textContent = commafy(base.stats.chickens);
        }

        // Contribution ratio
        cells[cnt++].textContent = (Math.round(player.stats.contributionRatio * 1e3) / 1e3).toString();
        // Time to boost
        //cells[cnt++].textContent = player.stats.timeToBoost == duration ? "N/A" : secondsToString(player.stats.timeToBoost);
        cells[cnt++].innerHTML = (player.stats.timeToBoost == duration ? "N/A" : secondsToString(player.stats.timeToBoost))
            + "<br>" + secondsToString(player.stats.boostingTime);
        // BTV
        cells[cnt++].textContent = (Math.round(player.stats.btvRat * 1e3) / 1e3).toString();
        // Teamwork
        cells[cnt++].textContent = (Math.round(player.stats.tw * 1e6) / 1e6).toString();

        // CS / Final points
        const cs = player.stats.cs;
        const finalPointsCell = cells[cnt];
        const finalValue = cs;

        // Reference column check
        const referenceCell = rows[i].querySelector(".reference-col");
        if (referenceCell) {
            const referenceValue = parseFloat(referenceCell.textContent) || 0;
            const diff = finalValue - referenceValue;

            if (diff > 0) {
                finalPointsCell.innerHTML = `${finalValue}<br>(+${diff})`;
            } else if (diff < 0) {
                finalPointsCell.innerHTML = `${finalValue}<br>(${diff})`;
            } else {
                finalPointsCell.textContent = finalValue;
            }

            finalPointsCell.classList.remove("increase", "decrease");
            if (finalValue > referenceValue) finalPointsCell.classList.add("increase");
            else if (finalValue < referenceValue) finalPointsCell.classList.add("decrease");
        } else {
            finalPointsCell.textContent = finalValue;
        }
        cnt++;

        // Mean / max / min CS calculations
        defMeanCS += cs;
        if (player.stats.deflectorPercent > 0 && !player.flags?.isSink) {
            meanCS += cs;
        } else {
            numNoDefl++;
        }
        if (cs > maxCS) maxCS = cs;
        if (cs < minCS) minCS = cs;
    }

    // Final mean CS calculation
    if (numPlayers > numNoDefl) {
        meanCS /= (numPlayers - numNoDefl);
    } else {
        meanCS = defMeanCS / numPlayers;
    }

    return [meanCS, maxCS, minCS];
}
function fillTable2SIAB(players, completionTime, targetEggAmount, duration, tswap, new2p0) {
    const numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
    const table = document.getElementById('playersTable');
    const SIABtext = document.getElementById('SIABSwapContainer');
    const strSIAB = document.createElement('div');
    const btvtargetobj = document.getElementById('btvTarget');
    const btvlabel = document.getElementById('btvTargetLabel');
    if (tswap < completionTime - 1) {
        strSIAB.innerHTML = "<br>" + '<b><u>SIAB swapped after:</b></u> ' + secondsToString(tswap).toString();
    } else {
        strSIAB.innerHTML = "<br>" + '<b><u>SIAB active entire contract.</b></u>';
    }
    SIABtext.appendChild(strSIAB);
    btvtargetobj.hidden = false;
    btvlabel.hidden = false;

    if (numPlayers === 0) return; // No players, no action

    const rows = table.getElementsByTagName('tr');
    maxCS = 0;
    meanCS = 0;
    minCS = 1e15;
    numNoDefl = 0;
    defMeanCS = 0;
    durDays = duration / 60 / 60 / 24;
    const BT_txt = '<img src="https://staabass.netlify.app/images/b_icon_token.png" width="15" height="15" alt="Tach" align="center">';
    const CR_txt = '<img src="https://staabass.netlify.app/images/CR.png" width="30" height="15" alt="Tach" align="center">';
    const tachImage = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="15" height="15" alt="Tach" align="center">';

    for (let i = 1; i < rows.length; i++) { // Skip header row
        const cells = rows[i].getElementsByTagName('td');
        let cnt = 0;
        cells[cnt].textContent = players[i - 1].name; // Update player name in table
        T = players[i - 1].flags.isSink ? 2 : (document.getElementById('tokenToggle').checked ? 10 : 0);
        T = (numPlayers === 1) ? 0 : T;

        if (players[i - 1].flags.isSink && !new2p0)
            cells[cnt].innerHTML += "<br> &#x1FAC2;" + "<br>" + calcSinkCR(numPlayers, durDays) + CR_txt + ", " + T + BT_txt;
        cnt++;
        cells[cnt].innerHTML = players[i - 1].stats.TE; cnt++;
        if (players[i - 1].flags.siabActive && tswap < completionTime - 1) {
            colels1 = "<span style=\"color: #00CC66\">";
            colele1 = "</span>";
            colsrs1 = "";
            colsre1 = "";
            colels2 = "<span style=\"color: #00CC66\">";
            colele2 = "</span>";
            colsrs2 = "";
            colsre2 = "";
            if (players[i - 1].beforeSwap.rates.shipRate < players[i - 1].beforeSwap.rates.layRate) {
                colsrs1 = "<span style=\"color: #00CC66\">";
                colsre1 = "</span>";
                colels1 = "";
                colele1 = "";
            }
            if (players[i - 1].rates.shipRate < players[i - 1].rates.layRate) {
                colsrs2 = "<span style=\"color: #00CC66\">";
                colsre2 = "</span>";
                colels2 = "";
                colele2 = "";
            }
            // Show players ELR
            cells[cnt].innerHTML = colels1 + (Math.round((players[i - 1].beforeSwap.rates.layRate / 1e9)) / 1e6).toString() + colele1 + "<br>" + players[i - 1].beforeSwap.stats.numTach + " " + tachImage +
                "<br>" + colels2 + (Math.round((players[i - 1].rates.layRate / 1e9)) / 1e6).toString() + colele2 + "<br>" + players[i - 1].stats.numTach + " " + tachImage; cnt++;
            // Show players SR
            cells[cnt].innerHTML = colsrs1 + (Math.round((players[i - 1].beforeSwap.rates.shipRate / 1e9)) / 1e6).toString() + colsre1 + "<br>" + players[i - 1].beforeSwap.stats.numQuant + " " + quantImage +
                "<br>" + colsrs2 + (Math.round((players[i - 1].rates.shipRate / 1e9)) / 1e6).toString() + colsre2 + "<br>" + players[i - 1].stats.numQuant + " " + quantImage; cnt++;
            // Show players chickens
            cells[cnt].innerHTML = commafy(players[i - 1].beforeSwap.stats.chickens) + "<br>" + commafy(players[i - 1].stats.chickens); cnt++;
        } else {
            colels = "<span style=\"color: #00CC66\">";
            colele = "</span>";
            colsrs = "";
            colsre = "";
            if (players[i - 1].beforeSwap.rates.shipRate < players[i - 1].beforeSwap.rates.layRate) {
                colsrs = "<span style=\"color: #00CC66\">";
                colsre = "</span>";
                colels = "";
                colele = "";
            }
            // Show players ELR
            cells[cnt].innerHTML = colels + (Math.round((players[i - 1].beforeSwap.rates.layRate / 1e9)) / 1e6).toString() + colele + "<br>" + players[i - 1].beforeSwap.stats.numTach + " " + tachImage; cnt++;
            // Show players SR
            cells[cnt].innerHTML = colsrs + (Math.round((players[i - 1].beforeSwap.rates.shipRate / 1e9)) / 1e6).toString() + colsre + "<br>" + players[i - 1].beforeSwap.stats.numQuant + " " + quantImage; cnt++;
            // Show players chickens
            cells[cnt].textContent = commafy(players[i - 1].beforeSwap.stats.chickens); cnt++;
            /*
            if (players[i - 1].siabActive)
                cells[3].textContent = commafy(players[i - 1].chick2);
            else
                cells[3].textContent = commafy(players[i - 1].chickens);
                */
        }
        // Show players contribution ratio
        cells[cnt].textContent = (Math.round(players[i - 1].stats.contributionRatio * 1e3) / 1e3).toString(); cnt++;
        // show players time to boost
        //cells[cnt].textContent = players[i - 1].stats.timeToBoost == duration ? "N/A" : secondsToString(players[i - 1].stats.timeToBoost); cnt++;
        cells[cnt].innerHTML = (players[i - 1].stats.timeToBoost == duration ? "N/A" : secondsToString(players[i - 1].stats.timeToBoost))
            + "<br>" + secondsToString(players[i - 1].stats.boostingTime); cnt++;
        // show players BTV
        cells[cnt].textContent = (Math.round(players[i - 1].stats.btvRat * 1e3) / 1e3).toString(); cnt++;
        // show players teamwork
        cells[cnt].textContent = (Math.round(players[i - 1].stats.tw * 1e6) / 1e6).toString(); cnt++;
        // Show players CS
        const cs = players[i - 1].stats.cs;
        //cells[cnt].textContent = cs.toString(); cnt++;
        const finalPointsCell = cells[cnt];
        const finalValue = players[i - 1].stats.cs;

        // check if reference column exists
        const referenceCell = rows[i].querySelector(".reference-col");

        if (referenceCell) {
            const referenceValue = parseFloat(referenceCell.textContent) || 0;
            const diff = finalValue - referenceValue;

            // set text with difference
            if (diff > 0) {
                finalPointsCell.innerHTML = `${finalValue}` + "<br>" + `(+${diff})`;
            } else if (diff < 0) {
                finalPointsCell.innerHTML = `${finalValue}` + "<br>" + `(${diff})`;
            } else {
                finalPointsCell.textContent = finalValue;
            }

            // color highlighting
            finalPointsCell.classList.remove("increase", "decrease");

            if (finalValue > referenceValue) {
                finalPointsCell.classList.add("increase");
            } else if (finalValue < referenceValue) {
                finalPointsCell.classList.add("decrease");
            }

        } else {
            // normal behavior if no reference column yet
            finalPointsCell.textContent = finalValue;
        }

        cnt++;

        // cells[cnt].textContent = players[i - 1].stats.cs.toString(); cnt++;
        defMeanCS += cs;
        if (players[i - 1].deflPerc > 0 && !players[i - 1].isSink) {
            meanCS += cs;
        } else {
            numNoDefl++;
        }

        if (cs > maxCS)
            maxCS = cs;
        if (cs < minCS)
            minCS = cs;
    }
    // If at least 1 player has deflector, return meanCS minus those without deflector. If all no deflector, just return mean of all
    if (numPlayers > numNoDefl) {
        meanCS /= (numPlayers - numNoDefl);
    } else {
        meanCS = defMeanCS / numPlayers;
    }

    return [meanCS, maxCS, minCS];
}

function fillTable2(players, completionTime, targetEggAmount, duration, new2p0) {
    const numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
    const table = document.getElementById('playersTable');

    if (numPlayers === 0) return;

    const rows = table.getElementsByTagName('tr');
    maxCS = 0;
    meanCS = 0;
    minCS = 1e15;
    numNoDefl = 0;
    defMeanCS = 0;
    durDays = duration / 60 / 60 / 24;
    const BT_txt = '<img src="https://staabass.netlify.app/images/b_icon_token.png" width="15" height="15" alt="Tach" align="center">';
    const CR_txt = '<img src="https://staabass.netlify.app/images/CR.png" width="30" height="15" alt="Tach" align="center">';
    const tachImage = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="15" height="15" alt="Tach" align="center">';

    for (let i = 1; i < rows.length; i++) { // Skip header row
        const cells = rows[i].getElementsByTagName('td');
        //const playerNameInput = document.getElementById(`playerName${i - 1}`);
        //const playerName = playerNameInput ? playerNameInput.value : `Player ${i - 1}`;
        cnt = 0;
        cells[cnt].innerHTML = players[i - 1].name; // Update player name in table
        T = players[i - 1].isSink ? 2 : (document.getElementById('tokenToggle').checked ? 10 : 0);
        T = (numPlayers === 1) ? 0 : T;

        if (players[i - 1].flags.isSink && !new2p0) {
            cells[cnt].innerHTML += "<br> &#x1FAC2;" + "<br>" + calcSinkCR(numPlayers, durDays) + CR_txt + ", " + T + BT_txt;
        }
        cnt++;
        //cells[0].innerHTML += "<br> &#x1FAC2;" + "<br>" + calcSinkCR(numPlayers, durDays) + "&#x1F413," + T + "&#x1FA99";
        colels = "<span style=\"color: #00CC66\">";
        colele = "</span>";
        colsrs = "";
        colsre = "";
        if (players[i - 1].rates.shipRate < players[i - 1].rates.layRate) {
            colsrs = "<span style=\"color: #00CC66\">";
            colsre = "</span>";
            colels = "";
            colele = "";
        }
        cells[cnt].innerHTML = players[i - 1].stats.TE; cnt++;
        // Show players ELR
        cells[cnt].innerHTML = colels + (Math.round((players[i - 1].rates.layRate / 1e9)) / 1e6).toString() + colele + "<br>" + players[i - 1].stats.numTach + " " + tachImage; cnt++;
        // Show players SR
        cells[cnt].innerHTML = colsrs + (Math.round((players[i - 1].rates.shipRate / 1e9)) / 1e6).toString() + colsre + "<br>" + players[i - 1].stats.numQuant + " " + quantImage; cnt++;
        // Show players chickens
        cells[cnt].textContent = commafy(players[i - 1].stats.chickens); cnt++;
        // Show players contribtion ratio
        cells[cnt].textContent = (Math.round(players[i - 1].stats.contributionRatio * 1e3) / 1e3).toString(); cnt++;
        // Show players time to boost
        //cells[cnt].textContent = players[i - 1].stats.timeToBoost == duration ? "N/A" : secondsToString(players[i - 1].stats.timeToBoost); cnt++;
        cells[cnt].innerHTML = (players[i - 1].stats.timeToBoost == duration ? "N/A" : secondsToString(players[i - 1].stats.timeToBoost))
            + "<br>" + secondsToString(players[i - 1].stats.boostingTime); cnt++;
        // Show players BTV
        cells[cnt].textContent = (Math.round(players[i - 1].stats.btvRat * 1e3) / 1e3).toString(); cnt++;
        // Show players teamwork
        cells[cnt].textContent = (Math.round(players[i - 1].stats.tw * 1e6) / 1e6).toString(); cnt++;

        // Show players CS
        const cs = players[i - 1].stats.cs;
        //cells[cnt].textContent = cs.toString(); cnt++;
        const finalPointsCell = cells[cnt];
        const finalValue = players[i - 1].stats.cs;

        // check if reference column exists
        const referenceCell = rows[i].querySelector(".reference-col");

        if (referenceCell) {
            const referenceValue = parseFloat(referenceCell.textContent) || 0;
            const diff = finalValue - referenceValue;

            // set text with difference
            if (diff > 0) {
                finalPointsCell.innerHTML = `${finalValue}` + "<br>" + `(+${diff})`;
            } else if (diff < 0) {
                finalPointsCell.innerHTML = `${finalValue}` + "<br>" + `(${diff})`;
            } else {
                finalPointsCell.textContent = finalValue;
            }

            // color highlighting
            finalPointsCell.classList.remove("increase", "decrease");

            if (finalValue > referenceValue) {
                finalPointsCell.classList.add("increase");
            } else if (finalValue < referenceValue) {
                finalPointsCell.classList.add("decrease");
            }

        } else {
            // normal behavior if no reference column yet
            finalPointsCell.textContent = finalValue;
        }

        cnt++;



        defMeanCS += cs;
        if (players[i - 1].stats.deflectorPercent > 0 && !players[i - 1].flags.isSink) {
            meanCS += cs;
        } else {
            numNoDefl++;
        }
        if (cs > maxCS)
            maxCS = cs;
        if (cs < minCS)
            minCS = cs;
    }
    // If at least 1 player has deflector, return meanCS minus those without deflector. If all no deflector, just return mean of all
    if (numPlayers > numNoDefl) {
        meanCS /= (numPlayers - numNoDefl);
    } else {
        meanCS = defMeanCS / numPlayers;
    }

    return [meanCS, maxCS, minCS]
}

function getCSMaxMean(players, simConfig, coopResult) {
    let { completionTime } = coopResult;
    let { numPlayers,
        duration
    } = simConfig;
    maxCS = 0;
    meanCS = 0;
    minCS = 1000000;
    fair_share = simConfig.targetEggAmount / numPlayers;
    durDays = duration / 60 / 60 / 24;
    numNoDefl = 0;
    players.forEach((player) => {
        contrib = player.stats.eggsDelivered / fair_share;
        btvRat = player.stats.btv / completionTime;
        T = player.isSink ? 2 : (simConfig.tokenToggle ? 10 : 0);
        T = (numPlayers === 1) ? 0 : T;
        crt = player.flags.isSink ? calcSinkCR(numPlayers, durDays) : (simConfig.crtRun ? 20 : numPlayers - 1);
        crt = (numPlayers === 1) ? 0 : crt;
        tw = getTeamwork(btvRat, numPlayers, durDays, crt, T, simConfig.new2p0);
        cs = getCS(contrib, duration, completionTime, tw);
        player.stats.contributionRatio = contrib;
        player.stats.btvRat = btvRat;
        player.stats.tw = tw;
        player.stats.cs = cs;
        if (player.stats.deflectorPercent > 0 && !player.flags.isSink) {
            meanCS += cs;
        } else {
            numNoDefl++;
        }
        if (cs > maxCS)
            maxCS = cs;
        if (cs < minCS)
            minCS = cs;
    });
    if (numPlayers > numNoDefl) {
        meanCS /= (numPlayers - numNoDefl);
    } else {
        meanCS = meanCS / numPlayers;
    }

    return [meanCS, maxCS, minCS]
}

function calcSinkCR(numPlayers, durDays) {
    // Take care of solo and duo contracts first
    if (numPlayers < 3)
        return (numPlayers - 1);
    // calculate targetCR
    targetCR = Math.ceil(durDays * numPlayers / 2)
    if (targetCR > 20)
        targetCR = 20;
    // Calculate number of kicks needed for others needed to reach max
    runSessions = Math.ceil((targetCR - 1) / (numPlayers - 2)); // -1 for removing sink from equation as can only run once / Number of runs per session (no sink, no selfrun)
    sinkRuns = runSessions * (numPlayers - 1);
    return sinkRuns;
}

// Note: totDeflector is total coop deflector %
function getDeflectorDropPerc(players, totDeflector, siabCoop) {
    // Check if solo
    if (players.length < 2) return [totDeflector, totDeflector];


    val1 = 0;
    // Find player with lowest elr/sr ratio, and save their deflector multiplier
    elrDivSrMin = Infinity;
    def = (totDeflector - players[0].stats.deflectorPercent) / 100 + 1;
    players.forEach((player, index) => {
        currentPlayer = player.rates.layRate / player.rates.shipRate;
        if (currentPlayer < elrDivSrMin) {
            elrDivSrMin = currentPlayer;
            def = (totDeflector - player.stats.deflectorPercent) / 100 + 1;
        }
    });

    // Check if anyone is not shipping capped
    if (elrDivSrMin >= 1)
        val1 = (def - 1) * 100 - (def / elrDivSrMin - 1) * 100;

    val0 = 0;
    // Check rates before swap
    elrDivSrMin2 = Infinity;
    if (siabCoop) {
        //elrDivSrMin2 = players[0].beforeSwap.rates.layRate / players[0].beforeSwap.rates.shipRate;
        def2 = (totDeflector - players[0].beforeSwap.stats.deflectorPercent) / 100 + 1;
        players.forEach((player, index) => {
            currentPlayer = player.beforeSwap.rates.layRate / player.beforeSwap.rates.shipRate;
            if (currentPlayer < elrDivSrMin2) {
                elrDivSrMin2 = currentPlayer;
                def2 = (totDeflector - player.beforeSwap.stats.deflectorPercent) / 100 + 1;
            }
        });
        if (elrDivSrMin2 >= 1)
            val0 = (def2 - 1) * 100 - (def2 / elrDivSrMin2 - 1) * 100;
        // swap variables
        /*x = val0;
        val0 = val1;
        val1 = x;*/
    }



    // Check how much deflector % could be dropped for player with smallest elr/sr
    return [Math.min(Math.floor(val0), Math.round(totDeflector)), Math.min(Math.floor(val1), Math.round(totDeflector))];
}

// Helper: write max/mean CS cells with optional ref+delta display
function setCoopCSCells(maxCSVal, meanCSVal, cells) {
    const refMax = parseFloat(cells[2].dataset.refMax);
    const refMean = parseFloat(cells[3].dataset.refMean);

    function writeCell(cell, val, ref) {
        if (!isNaN(ref)) {
            const diff = Math.round((val - ref) * 1e2) / 1e2;
            const sign = diff > 0 ? '+' : '';
            const deltaStr = diff !== 0 ? ` <span class="coop-ref-delta">(${sign}${diff})</span>` : '';
            cell.innerHTML = `${val}${deltaStr}<br><span class="coop-ref-line">ref: ${ref}</span>`;
            cell.classList.remove('increase', 'decrease');
            if (diff > 0) cell.classList.add('increase');
            else if (diff < 0) cell.classList.add('decrease');
        } else {
            cell.textContent = val;
            cell.classList.remove('increase', 'decrease');
        }
    }

    writeCell(cells[2], maxCSVal, refMax);
    writeCell(cells[3], meanCSVal, refMean);
}

function fillTableCoop(results, deflectorDropPerc) {
    const table = document.getElementById('coopTable');
    const rows = table.getElementsByTagName('tr');
    const cells = rows[1].getElementsByTagName('td');
    cells[0].textContent = (Math.round((results.coopRate / 1e9)) / 1e6).toString();
    cells[1].textContent = secondsToString(results.completionTime).toString();
    setCoopCSCells(results.maxCS, Math.round(results.meanCS * 1e2) / 1e2, cells);
    cells[4].textContent = results.totalDeflector.toString() + '%';
    cells[5].textContent = deflectorDropPerc + '%';
}

function fillTableCoopSIAB(results, deflectorDropPerc, deflectorDropPerc2) {
    const table = document.getElementById('coopTable');
    const rows = table.getElementsByTagName('tr');
    const cells = rows[1].getElementsByTagName('td');
    if (Math.round(results.siabSwapTime) < Math.round(results.completionTime))
        cells[0].innerHTML = (Math.round((results.coopRateBeforeSwap / 1e9)) / 1e6).toString() + "<br>" + (Math.round((results.coopRate / 1e9)) / 1e6).toString();
    else
        cells[0].innerHTML = (Math.round((results.coopRate / 1e9)) / 1e6).toString();
    cells[1].textContent = secondsToString(results.completionTime).toString();
    setCoopCSCells(results.maxCS, Math.round(results.meanCS * 1e2) / 1e2, cells);
    cells[4].textContent = results.totalDeflector.toString() + '%';
    if (Math.round(results.siabSwapTime) >= Math.round(results.completionTime))
        cells[5].textContent = deflectorDropPerc + '%';
    else
        cells[5].innerHTML = deflectorDropPerc + '%' + "<br>" + deflectorDropPerc2 + '%';
}

function commafy(num) {
    var str = num.toString().split('.');
    if (str[0].length >= 5) {
        str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    }
    if (str[1] && str[1].length >= 5) {
        str[1] = str[1].replace(/(\d{3})/g, '$1 ');
    }
    return str.join('.');
}

function secondsToString(sec) {
    days = Math.floor(sec / 3600 / 24);
    sec %= 3600 * 24;
    hours = Math.floor(sec / 3600);
    sec %= 3600;
    minutes = Math.floor(sec / 60);
    sec %= 60;
    seconds = sec % 60;
    pday = days > 1 ? 's' : '';
    phr = hours > 1 ? 's' : '';
    str = days > 0 ? days + 'day' + pday + ', ' : '';
    str = hours > 0 ? str + hours + 'hr' + phr + ', ' : str;
    str = minutes > 0 ? str + minutes + 'min, ' : str;
    str = str + Math.round(seconds) + 's';

    return str;

    /*
    const date = new Date(null);
    date.setSeconds(sec); // specify value for SECONDS here
    const result = date.toISOString().slice(11-3, 19);
    return result;
    */
}

function getCS(contributionRatio, originalLength, completionTime, tw) {
    cs = 1 + originalLength / 259200;
    cs *= 7;
    fac = contributionRatio > 2.5 ? 0.02221 * Math.min(contributionRatio, 12.5) + 4.386486 : 3 * Math.pow(contributionRatio, 0.15) + 1;
    cs *= fac;
    cs *= 4 * Math.pow((1 - completionTime / originalLength), 3) + 1;
    cs *= (0.19 * tw + 1);
    cs *= 1.05; // Kev Fudge Factor
    cs = Math.ceil(cs * 187.5);
    return cs;
}

function getTeamwork(btvRat, numPlayers, durDays, crt, T, new2p0) {
    B = Math.min(btvRat, 2);
    crt = Math.min(crt, 20);
    fCR = Math.max(12 / numPlayers / durDays, 0.3);
    CR = Math.min(fCR * crt, 6);
    if (new2p0) {
        if (numPlayers > 1) {
            CR = 5;
        } else {
            CR = 0;
        }
        T = 0;
    }
    return (5 * B + CR + T) / 19;
}

function updateArtis(playerIndex, player) {
    defl = 0;
    siab = 0;
    // Get selected arti's
    for (let i = 0; i <= 3; i++) {
        //const selectElement = document.getElementById(`player${playerIndex}_item${i}`);
        //const name = selectElement.value;
        //x = itemLists[i].find(item => item.name === name);
        defl += (player.artifacts[i].deflectorPercent);
        siab += (player.artifacts[i].siabPercent);
    }
    player.stats.deflectorPercent = defl;
    player.stats.siabPercent = siab;
}

function getMaxChickens(playerIndex) {
    chick = 11340000000;
    // Get selected arti's
    for (let i = 1; i <= 4; i++) {
        const selectElement = document.getElementById(`player${playerIndex}_item${i}`);
        const name = selectElement.value;
        x = itemLists[i].find(item => item.name === name);
        // Multiply chik
        chick *= (x.chickmult);
    }

    // Get Modifier
    const selectMod = document.getElementById(`mod-name`);
    const name = selectMod.value;
    if (name === 'Hab Space') {
        const modMult = document.getElementById(`modifiers`);
        chick *= modMult.value;
    }

    // Get Colleggtibles
    chick *= document.getElementById(`Shipping-colleggtible${playerIndex}`).checked ? 1.05 : 1;


    return Math.floor(chick);
}

function getDeflectorPerc(playerIndex) {
    defl = 0;
    // Get selected arti's
    for (let i = 5; i <= 8; i++) {
        const selectElement = document.getElementById(`player${playerIndex}_item${i}`);
        const name = selectElement.value;
        x = itemLists[i + 1].find(item => item.name === name);
        // Multiply ihr
        defl += (x.deflectorPercent);
    }

    return defl;
}

function getSIABPerc(playerIndex) {
    siab = 0;
    // Get selected arti's
    for (let i = 5; i <= 8; i++) {
        const selectElement = document.getElementById(`player${playerIndex}_item${i}`);
        const name = selectElement.value;
        x = itemLists[i + 1].find(item => item.name === name);
        // Multiply ihr
        siab += (x.siabPercent);
    }

    return siab;
}

function playerBoosting(players, index) {
    offset = players[index].flags.needsMirror == true ? 1 : 0;
    players[index].stats.boostMulti = calcBoostMulti(players[index].tokens - offset);
    return players;
}

function convertUnits(parameter, units) {
    let mult;
    switch (units) {
        case 'seconds':
            mult = 1;
            break;
        case 'minutes':
            mult = 60;
            break;
        case 'hours':
            mult = 60 * 60;
            break;
        case 'days':
            mult = 60 * 60 * 24;
            break;
        case 'T':
            mult = 1e12;
            break;
        case 'q':
            mult = 1e15;
            break;
        case 'Q':
            mult = 1e18;
            break;
        // Add other cases for different categories if needed
        default:
            mult = 1;
    }

    return parameter * mult;
}

function calcIHR(playerIndex) {
    ihr = 7440;
    // Get selected arti's
    for (let i = 5; i <= 8; i++) {
        const selectElement = document.getElementById(`player${playerIndex}_item${i}`);
        const name = selectElement.value;
        x = itemLists[i + 1].find(item => item.name === name);
        // Multiply ihr
        ihr *= (x.ihrmult * Math.pow(1.04, x.slots));
    }
    // Get Modifier
    const selectMod = document.getElementById(`mod-name`);
    const name = selectMod.value;
    if (name === 'IHR') {
        const modMult = document.getElementById(`modifiers`);
        ihr *= modMult.value;
    }
    // add colleggtible
    colleggIHR = document.getElementById(`Shipping-colleggtible${playerIndex}`).checked ? 1.05 : 1;
    ihr *= colleggIHR;
    // add TE
    TEMult = Math.pow(1.01, document.getElementById(`playerTE${playerIndex}`).value);
    ihr *= TEMult;

    return Math.floor(ihr);
}

function calcRateSIABRemoved(players) {

    // First, get everyone's deflector total
    totDeflector = 0;
    players.forEach((player, index) => {
        totDeflector += player.stats.deflectorPercent;
    });

    // Update Rates
    players.forEach((player, index) => {
        elr = player.stats.chickens * player.rates.baseELR;
        sr = player.rates.baseShip;
        totSlotsAvailable = 0;
        if (player.stats.maxChickens === player.stats.chickens) {
            for (let i = 0; i <= 3; i++) {
                // Remove SIAB
                if (player.artifacts[i].siabPercent > 0) {
                    player.artifacts[i] = itemLists[i + 1][0];
                    // Gusset replaced, Max chickens instantly
                    if (i == 3) {
                        // *= x.chickmult;
                        player.stats.chickens *= player.artifacts[i].chickmult;
                        player.stats.maxChickens *= player.artifacts[i].chickmult;
                        elr *= player.artifacts[i].chickmult;
                    }
                }
                elr *= player.artifacts[i].elrmult;
                sr *= player.artifacts[i].srmult;
                totSlotsAvailable += player.artifacts[i].slots;
            }
        }

        elr *= (1 + (totDeflector - player.stats.deflectorPercent) / 100);
        [elr, sr, numTach, numQuant] = optimizeStones(elr, sr, totSlotsAvailable);

        player.rates.layRate = elr;
        player.rates.shipRate = sr;
        player.rates.deliveryRate = Math.min(elr, sr);
        player.stats.numTach = numTach;
        player.stats.numQuant = numQuant;

    });
    // Define base rates


    totDeflector = 0;





    //if (players[playerIndex].stats.maxChickens === chickens) {

    // }


    // return [elr, sr, chickens, chickens, numTach, numQuant]; // eggs/hr
}



function calcRate(playerIndex, chickens, players) {
    elr = chickens * players[playerIndex].rates.baseELR; // eggs/hr
    sr = players[playerIndex].rates.baseShip;
    totDeflector = 0;
    totSlotsAvailable = 0;
    if (players[playerIndex].stats.maxChickens === chickens) {
        for (let i = 0; i <= 3; i++) {
            elr *= players[playerIndex].artifacts[i].elrmult;
            sr *= players[playerIndex].artifacts[i].srmult;
            totSlotsAvailable += players[playerIndex].artifacts[i].slots;
        }
    }


    // Get everyones deflectors
    for (let i = 0; i < players.length; i++) {
        if (i != playerIndex) {
            totDeflector += players[i].stats.deflectorPercent;
        }
    }
    elr *= (1 + totDeflector / 100);
    if (players[playerIndex].stats.maxChickens === chickens) {
        [elr, sr, numTach, numQuant] = optimizeStones(elr, sr, totSlotsAvailable);
    }
    // Update player class
    players[playerIndex].rates.layRate = elr;
    players[playerIndex].rates.shipRate = sr;
    players[playerIndex].rates.deliveryRate = Math.min(elr, sr);
    players[playerIndex].stats.chickens = chickens;
    players[playerIndex].stats.numTach = numTach;
    players[playerIndex].stats.numQuant = numQuant;
}

function optimizeStones(elr, sr, totSlots) {
    numTach = 0;
    numQuant = 0;
    for (let i = 0; i < totSlots; i++) {
        if (elr < sr) {
            elr *= 1.05;
            numTach++;
        }
        else {
            sr *= 1.05;
            numQuant++;
        }
    }
    return [elr, sr, numTach, numQuant];
}

function calcBoostMulti(tokens) {
    let mult;
    switch (tokens) {
        case 1:
            mult = (4 * 10) * (2);
            break;
        case 2:
            mult = (100 + 4 * 10);
            break;
        case 3:
            mult = (100 + 3 * 10) * (2);
            break;
        case 4:
            mult = (1000 + 4 * 10);
            break;
        case 5:
            mult = (1000 + 3 * 10) * (2);
            break;
        case 6:
            mult = (1000 + 2 * 10) * (2 + 2);
            break;
        case 7:
            mult = (1000 + 10) * (2 + 2 + 2);
            break;
        case 8:
            mult = (1000 + 3 * 10) * (10);
            break;
        case 9:
            mult = (1000 + 2 * 10) * (10 + 2);
            break;
        case 10:
            mult = (1000 + 10) * (10 + 2 + 2);
            break;
        case 11:
            mult = (1000) * (10 + 2 + 2 + 2);
            break;
        case 12:
            mult = (1000 + 3 * 10) * (50);
            break;
        // Add other cases for different categories if needed
        default:
            mult = 50;
    }


    return mult;
}

function updateImage(playerIndex, ItemIndex) {
    // Get dropdown Menu
    const selectElement = document.getElementById(`player${playerIndex}_item${ItemIndex}`);
    // Get new selected value
    const value = selectElement.value;
    if (value[2] === 'L') {
        tmp = 0;
    }
    const imageContainer = document.getElementById(`imageContainer${playerIndex}`);
    const selectedItemObj = itemLists[ItemIndex].find(item => item.name === ItemIndex);

    if (selectedItemObj) {
        imageContainer.innerHTML = `<img src="${selectedItemObj.image}" alt="${selectedItemObj.name}">`;
    } else {
        imageContainer.innerHTML = '';
    }
}

// Dark/Light Mode Toggle
document.getElementById('modeToggle').addEventListener('change', (event) => {
    if (event.target.checked) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
});

// Enable dark mode by default on page load
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('dark-mode');
    document.getElementById('modeToggle').checked = true;
});

// singleStr = crtToggle tokenToggle GGToggle eggUnit durUnit mod-name cxpToggle
// singleStr2 = 1 Mirror Collegg Sink Creator artifacts
// data = singleStr crttime mpft duration targetEggAmount tokenTimer modifiers numPlayers btvTarget {name playerTokens TE singleStr2}

function gatherDOMData(overrideTokens = null) {

    const SEPARATOR = '-';
    const data = [];
    const data2 = [];
    const singleStr = [];
    const singleStr2 = [];

    singleStr.push(convertBool(document.getElementById('crtToggle').checked));
    singleStr.push(convertBool(document.getElementById('tokenToggle').checked));
    singleStr.push(convertBool(document.getElementById('GGToggle').checked));
    singleStr.push(document.getElementById('eggUnit').selectedIndex);
    singleStr.push(document.getElementById('durUnit').selectedIndex);
    singleStr.push(document.getElementById('mod-name').selectedIndex);
    singleStr.push(convertBool(document.getElementById('cxpToggle').checked));

    data.push(singleStr.join(''));

    data.push(convertString(document.getElementById('crttime').value));
    data.push(convertString(document.getElementById('mpft').value));
    data.push(convertString(document.getElementById('duration').value));
    data.push(convertString(document.getElementById('targetEggAmount').value));
    data.push(convertString(document.getElementById('tokenTimer').value));
    data.push(convertString(document.getElementById('modifiers').value));

    const numPlayers = convertString(document.getElementById('numPlayers').value);
    data.push(numPlayers);

    data.push(convertString(document.getElementById('btvTarget').value));

    const playersContainer = document.getElementById('playersContainer');
    const playerDivs = Array.from(playersContainer.children);

    const orderedPlayers = playerDivs.map(div =>
        parseInt(div.id.split('-')[1])
    );

    // -------- detect prefix compression --------

    const names = orderedPlayers.map(k =>
        document.getElementById(`playerName${k}`).value
    );

    let useCompressedNames = false;
    let prefix = '';
    let startIndex = 0;

    const match = names[0].match(/^(.+?)\s*(\d+)$/);

    if (match) {

        prefix = match[1];
        startIndex = parseInt(match[2]);

        let valid = true;

        for (let i = 0; i < names.length; i++) {

            const m = names[i].match(/^(.+?)\s*(\d+)$/);

            if (!m || m[1] !== prefix || parseInt(m[2]) !== startIndex + i) {
                valid = false;
                break;
            }
        }

        if (valid) {

            useCompressedNames = true;
            data.unshift(`${prefix}|${startIndex}`);
        }
    }

    // -------- build player structures --------

    const players = [];

    for (let i = 0; i < numPlayers; i++) {

        const k = orderedPlayers[i];

        const tokens = Array.isArray(overrideTokens)
            ? overrideTokens[i]
            : remDash(document.getElementById(`playerTokens${k}`).value);

        const TE = remDash(document.getElementById(`playerTE${k}`).value);

        const bits = [];

        bits.push(convertBool(document.getElementById(`playerMirror${k}`).checked));
        bits.push(convertBool(document.getElementById(`Shipping-colleggtible${k}`).checked));
        bits.push(convertBool(document.getElementById(`Sink${k}`).checked));
        bits.push(convertBool(document.getElementById(`Creator${k}`).checked));

        // Write boosted set in OLD order: Metro(2), Comp(3), Gusset(4), Defl(1)
        // Write IHR set in OLD order: Chal(8), Monocle(7), IHRDefl(5), IHRSIAB(6)
        // This keeps URLs identical to old site for full backwards compatibility.
        for (let j of [2, 3, 4, 1, 8, 7, 5, 6]) {
            const idx = document.getElementById(`player${k}_item${j}`).selectedIndex;
            bits.push(idx < 10 ? '0' + idx : idx);
        }

        players.push({
            tokens,
            TE,
            bits: bits.join('')
        });
    }

    // -------- group identical players --------

    const groups = [];

    let i = 0;

    while (i < players.length) {

        const ref = players[i];
        let count = 1;

        while (
            i + count < players.length &&
            players[i + count].tokens === ref.tokens &&
            players[i + count].TE === ref.TE &&
            players[i + count].bits === ref.bits
        ) {
            count++;
        }

        groups.push({
            count,
            tokens: ref.tokens,
            TE: ref.TE,
            bits: ref.bits
        });

        i += count;
    }

    // -------- write grouped tokens/TE --------
    if (useCompressedNames) {
        groups.forEach(g => {
            data.push(g.count);
            data.push(g.tokens);
            data.push(g.TE);
        });
    } else {
        for (let i = 0; i < numPlayers; i++) {

            const k = orderedPlayers[i];

            const name = remDash(
                document.getElementById(`playerName${k}`).value
            );

            const tokens = Array.isArray(overrideTokens)
                ? overrideTokens[i]
                : remDash(document.getElementById(`playerTokens${k}`).value);

            const TE = remDash(document.getElementById(`playerTE${k}`).value);

            data.push(name);
            data.push(tokens);
            data.push(TE);
        }
    }

    // -------- build grouped bitstream --------

    singleStr2.push('1');

    if (useCompressedNames) {

        groups.forEach(g => {
            singleStr2.push(g.bits);
        });

    } else {

        players.forEach(p => {
            singleStr2.push(p.bits);
        });

    }

    data2.push(chunk16(singleStr2.join('')));

    return [data.join(SEPARATOR), data2.join(SEPARATOR), useCompressedNames];
}
// Function to gather all input data

function chunk16(x) {
    y = '';
    if (x.length < 16)
        return base62.encode(parseInt(x));
    else {
        n = Math.floor(x.length / 15);
        for (let i = 0; i < n; i++) {
            //y += parseInt('1' + x.slice(i*15, 15 + i*15)).toString(36);
            // 8 is needed to force all chunks of 16 to length of base64=9
            tmp = '8' + x.slice(i * 15, 15 + i * 15);
            yy = tmp.length;
            y += base62.encode(parseInt(tmp));
        }
        tmp = x.slice(n * 15);

        //y += parseInt('1' + tmp).toString(36);
        y += base62.encode(parseInt('8' + tmp));
    }
    tmp2 = y.length;
    return y;
}

// ─── SLOT ORDER REMAP ────────────────────────────────────────────────────────
// All URLs saved before this change encoded slots in the old display order.
// This function remaps the 8 two-char slot values in a player's bit string so
// that old URLs load with the correct artifacts in the new slot positions.
//
// Boosted set:  old [metro][comp][gusset][defl]  → new [defl][metro][comp][gusset]
// IHR set:      old [chal][monocle][ihrDefl][ihrSIAB] → new [ihrDefl][ihrSIAB][monocle][chal]
//
// IMPORTANT — VERSION BUMP REMINDER:
// When curentURLEncodeVer is bumped (e.g. to 'v-6'), new URLs will already be
// saved in the new slot order. Add a version guard here so the remap is only
// applied to old versions (v-1 through v-5), e.g.:
//   if (ver === 'v-6') return bits;   ← skip remap for new URLs
//
// Until then, urlWrittenByNewSite (sessionStorage flag) is used to skip the
// remap when the URL was written by this version of the site.
// ─────────────────────────────────────────────────────────────────────────────
function remapSlotOrder(bits, b) {
    // Boosted set (4 slots × 2 chars each, starting at b)
    const metro = bits.slice(b + 0, b + 2);
    const comp = bits.slice(b + 2, b + 4);
    const gusset = bits.slice(b + 4, b + 6);
    const defl = bits.slice(b + 6, b + 8);

    // IHR set (next 4 slots × 2 chars, starting at b+8)
    const chal = bits.slice(b + 8, b + 10);
    const monocle = bits.slice(b + 10, b + 12);
    const ihrDefl = bits.slice(b + 12, b + 14);
    const ihrSIAB = bits.slice(b + 14, b + 16);

    return (
        bits.slice(0, b) +
        // Boosted set: new order defl, metro, comp, gusset
        defl + metro + comp + gusset +
        // IHR set: new order ihrDefl, ihrSIAB, monocle, chal
        ihrDefl + ihrSIAB + monocle + chal +
        bits.slice(b + 16)
    );
}

function unchunk16(x) {
    y = '';
    len = 9;
    if (x.length < 10)
        return base62.decode(x).toString();
    else {
        n = Math.floor(x.length / len);
        for (let i = 0; i < n; i++) {
            // Convert back to integer, remove the first '8'
            y += base62.decode(x.slice(i * len, len + i * len)).toString().slice(1);
        }
        tmp = x.slice(n * len, x.length);
        // Convert back to integer, remove the first '8'
        //y += parseInt(tmp, 36).toString().slice(1);
        y += base62.decode(tmp).toString().slice(1);
    }
    return y;
}



// Function to populate the form with data

function populateData2(data, data2, ver) {

    data2 = unchunk16(data2);
    data = data.split('-');

    const useCompressedNames = (ver[1] === '_');

    let prefix = '';
    let startIndex = 0;

    if (useCompressedNames) {
        const parts = data[0].split('|');
        prefix = parts[0];
        startIndex = parseInt(parts[1]);
    }

    let offset = useCompressedNames ? 1 : 0;


    const singleStr = data[offset].split('');

    document.getElementById('crtToggle').checked = convertBoolBack(singleStr[0]);
    document.getElementById('tokenToggle').checked = convertBoolBack(singleStr[1]);
    document.getElementById('GGToggle').checked = convertBoolBack(singleStr[2]);
    document.getElementById('eggUnit').selectedIndex = convertStringBack(singleStr[3]);
    document.getElementById('durUnit').selectedIndex = convertStringBack(singleStr[4]);
    document.getElementById('mod-name').selectedIndex = convertStringBack(singleStr[5]);

    let factor = 60;

    if (ver === 'v-5' || ver === 'v_5') {
        document.getElementById('cxpToggle').checked = convertBoolBack(singleStr[6]);
        factor = 1;
    }

    document.getElementById('crttime').value = convertStringBack(data[offset + 1]) * factor;
    document.getElementById('mpft').value = convertStringBack(data[offset + 2]);
    document.getElementById('duration').value = convertStringBack(data[offset + 3]);
    document.getElementById('targetEggAmount').value = convertStringBack(data[offset + 4]);
    document.getElementById('tokenTimer').value = convertStringBack(data[offset + 5]);
    document.getElementById('modifiers').value = convertStringBack(data[offset + 6]);

    const numPlayers = convertStringBack(data[offset + 7]);
    document.getElementById('numPlayers').value = numPlayers;

    let cnt = offset + 8;

    if (ver !== 'v-1') {
        document.getElementById('btvTarget').value = convertStringBack(data[cnt]);
        cnt++;
    }

    generatePlayers();

    // ------------------------------------------------
    // Build player groups from DATA
    // ------------------------------------------------

    const playerGroups = [];
    let totalPlayers = 0;

    if (useCompressedNames) {

        while (totalPlayers < numPlayers) {

            const count = parseInt(data[cnt]);
            const tokens = addDash(data[cnt + 1]);
            const TE = addDash(data[cnt + 2]);

            playerGroups.push({ count, tokens, TE });

            totalPlayers += count;
            cnt += 3;
        }

    } else {

        for (let i = 0; i < numPlayers; i++) {

            const rawName = data[cnt]; cnt++;

            const name = rawName ? addDash(rawName) : "";
            const tokens = addDash(data[cnt]); cnt++;

            let TE = '';
            if (ver === 'v-4' || ver === 'v-5') {
                TE = addDash(data[cnt]);
                cnt++;
            }

            playerGroups.push({
                count: 1,
                name,
                tokens,
                TE
            });
        }
    }

    // ------------------------------------------------
    // Read grouped bit patterns from DATA2
    // ------------------------------------------------

    let bitIndex = 1;
    const bitPatterns = [];

    playerGroups.forEach(() => {

        const bits = data2.slice(bitIndex, bitIndex + 20);
        bitIndex += 20;

        bitPatterns.push(bits);

    });

    // ------------------------------------------------
    // Populate players
    // ------------------------------------------------

    let playerIndex = 0;

    playerGroups.forEach((group, gIndex) => {

        const bits = bitPatterns[gIndex];

        for (let n = 0; n < group.count; n++) {

            const i = playerIndex;
            let b = 0;

            // Player name
            if (useCompressedNames) {
                document.getElementById(`playerName${i}`).value =
                    prefix + ' ' + (startIndex + i);
            } else {
                document.getElementById(`playerName${i}`).value = group.name;
            }

            // Tokens
            document.getElementById(`playerTokens${i}`).value = group.tokens;

            // TE
            if (ver === 'v-4' || ver === 'v-5' || ver === 'v_4' || ver === 'v_5') {
                document.getElementById(`playerTE${i}`).value = group.TE;
            }

            // Booleans
            document.getElementById(`playerMirror${i}`).checked = convertBoolBack(bits[b]); b++;
            document.getElementById(`Shipping-colleggtible${i}`).checked = convertBoolBack(bits[b]); b++;

            if (ver !== 'v-1') {

                document.getElementById(`Sink${i}`).checked = convertBoolBack(bits[b]); b++;

                if (ver !== 'v-2') {
                    document.getElementById(`Creator${i}`).checked = convertBoolBack(bits[b]); b++;
                }
            }

            // Items
            // Remap boosted-set slot order for all saved URLs (v-1 through v-5):
            // Old order: Metro, Compass, Gusset, Defl  (bits b..b+7)
            // New order: Defl,  Metro,   Compass, Gusset
            // Also remaps IHR set: old [Chal][Monocle][IHRDefl][IHRSIAB]
            //                      new [IHRDefl][IHRSIAB][Monocle][Chal]
            // See remapSlotOrder() for version bump instructions.
            const remappedBits = remapSlotOrder(bits, b);
            for (let j = 1; j <= 8; j++) {

                const element = document.getElementById(`player${i}_item${j}`);

                element.selectedIndex = parseInt(remappedBits.slice(b, b + 2));
                b += 2;

                setColor(element);
            }

            playerIndex++;
        }

    });

    populateTable();
}

function populateTable() {
    const table = document.getElementById('playersTable');
    const rows = table.getElementsByTagName('tr');
    for (let i = 0; i < rows.length - 1; i++) { // Skip header row
        pn = document.getElementById(`playerName${i}`).value;
        const cells = rows[i + 1].getElementsByTagName('td');
        cells[0].textContent = pn; // Update player name in table
    }
}

function convertBool(bool) {
    return bool ? 1 : 0;
}

function convertBoolBack(val) {
    return val == 1 ? true : false;
}
function convertString(data) {
    return data.toString().replace(/\./g, 'p');
}

function convertStringBack(data) {
    return data.replace('p', '.');
}

function remDash(data) {
    return data.toString().replace('-', 'axJEFi');
}

function addDash(data) {
    return data.replace('axJEFi', '-');
}




// Function to convert data to base64 string
function dataToBase64(data, data2) {
    dataB64 = btoa(encodeURIComponent(data));
    // Remove all '=' as they often occur many times
    dataB64 = dataB64.split('=');
    dataEncoded = dataB64[0] + "=" + data2;
    //x = data2.length - data.length - tmp.length;
    return dataEncoded;
}

// Function to decode base64 string to data
function base64ToData(base64) {
    return decodeURIComponent(atob(base64));
}

// Function to update the URL with the base64 data
function updateUrlWithBase64(base64Data) {
    let newUrl = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;

    if (coopNameFromURL) {
        const coopEncoded = btoa(encodeURIComponent(coopNameFromURL)).replace(/=+$/, '');
        newUrl += `&c=${coopEncoded}`;
    }

    window.history.replaceState({}, '', newUrl);

    // Keep the old-site notice link in sync
    const oldLink = document.getElementById('oldSiteLink');
    if (oldLink) {
        let oldUrl = 'https://srsandbox-old.netlify.app/?data=' + base64Data;
        if (coopNameFromURL) {
            const coopEncoded = btoa(encodeURIComponent(coopNameFromURL)).replace(/=+$/, '');
            oldUrl += `&c=${coopEncoded}`;
        }
        oldLink.href = oldUrl;
    }
}
/*
function updateContractHeader() {
    const header = document.getElementById("Contract Header");

    if (coopNameFromURL != null && coopNameFromURL !== "") {
        header.textContent = `Contract: ${coopNameFromURL}`;
    } else {
        header.textContent = "Contract Information";
    }
}
*/


function resetContractHeader() {

    if (!coopNameFromBot) return;

    const contractInput = document.getElementById("contractNameInput");

    contractInput.value = "";
    coopNameFromBot = false;
    coopNameFromURL = null;

    const params = new URLSearchParams(window.location.search);

    if (params.has("c")) {
        params.delete("c");

        const newUrl =
            window.location.origin +
            window.location.pathname +
            (params.toString() ? "?" + params.toString() : "");

        history.replaceState(null, "", newUrl);
    }
}

document.getElementById("contractNameInput")
    .addEventListener("input", (e) => {

        const name = e.target.value.trim();
        const params = new URLSearchParams(window.location.search);

        if (name) {
            const coopEncoded = btoa(encodeURIComponent(name)).replace(/=+$/, '');
            params.set("c", coopEncoded);
            coopNameFromURL = name;
        } else {

            params.delete("c");

        }
        /*
        const newUrl =
            window.location.origin +
            window.location.pathname +
            (params.toString() ? "?" + params.toString() : "");
            */
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        //history.replaceState(null, "", url);
        history.replaceState(null, "", newUrl);

        // Keep old-site notice link in sync
        const oldLink = document.getElementById('oldSiteLink');
        if (oldLink) {
            const oldParams = new URLSearchParams(params);
            oldLink.href = 'https://srsandbox-old.netlify.app/?' + oldParams.toString();
        }

        coopNameFromBot = false;
    });

const contractInputs = [
    "duration",
    "durUnit",
    "targetEggAmount",
    "eggUnit",
    "tokenTimer",
    "modifiers",
    "mod-name",
    "numPlayers"
];

contractInputs.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("change", resetContractHeader);
    el.addEventListener("input", resetContractHeader);
});

function loadDataFromUrl(dataOverride = null) {
    let base64Data;
    if (dataOverride) {
        base64Data = dataOverride;
    } else {
        const params = new URLSearchParams(window.location.search);
        base64Data = params.get('data');
        coopNameEncoded = params.get('c');
    }

    if (coopNameEncoded) {
        try {
            coopNameFromURL = decodeURIComponent(atob(coopNameEncoded));
        } catch {
            coopNameFromURL = coopNameEncoded;
        }
        const contractInput = document.getElementById("contractNameInput");
        contractInput.value = coopNameFromURL;

        coopNameFromBot = true;
    }

    //updateContractHeader();

    if (!base64Data) {
        generatePlayers();
        cxpToggleRun();
        return;
    }

    // Extract version: first 3 chars
    const ver = base64Data.slice(0, 3);
    const supportedVersions = ['v-1', 'v-2', 'v-3', 'v-4', 'v-5', 'v_5'];

    if (!supportedVersions.includes(ver)) {
        document.getElementById('urlErrorBar').style.display = 'block';
        generatePlayers();
        cxpToggleRun();
        return;
        return;
    }

    // Extract the encoded portion
    const encodedPart = base64Data.slice(3);

    // Split on '=' (your existing delimiter)
    const splitData = encodedPart.split('=');

    let datap, data2p;

    splitData.forEach((dat, index) => {
        if (index === 0) {
            datap = base64ToData(dat);
        }
        if (index === splitData.length - 1) {
            data2p = dat;
        }
    });

    // Populate data2 with the version
    try {
        populateData2(datap, data2p, ver);
    } catch (e) {
        document.getElementById('urlErrorBar').style.display = 'block';
        console.error('URL parse error:', e);
        generatePlayers();
    }

    // Handle any post-load logic
    cxpToggleRun();
}

// Load data from URL if available

// Load data from URL on page load
window.onload = loadDataFromUrl();


// New code
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Function to add event listeners to all dropdowns in playersContainer

function setColor(element) {
    if (element.value[2] === 'L') {
        element.style.backgroundColor = '#fef941';
        element.style.color = '#333';
        return;
    }
    if (element.value[2] === 'E') {
        element.style.backgroundColor = '#fa40fc';
        element.style.color = '#f4f4f4';
        return;
    }
    if (element.value[2] === 'R') {
        element.style.backgroundColor = '#9de9ff';
        element.style.color = '#333';
        return;
    }
    if (element.value[2] === 'C' || element.value[2] === 'S') {
        element.style.backgroundColor = '#555';
        element.style.color = '#f4f4f4';
        return;
    }
    return;
}


// Returns the item slot (2,3,4) that currently has a SIAB selected, or null
function getBoostedSIABSlot(playerIndex) {
    for (let j = 2; j <= 4; j++) {
        const el = document.getElementById(`player${playerIndex}_item${j}`);
        if (el && el.value && el.value.includes('SIAB')) return j;
    }
    return null;
}

function syncSIAB(playerIndex, source) {
    if (!siabLinked[playerIndex]) return;
    const siabSlot = getBoostedSIABSlot(playerIndex);
    const ihr = document.getElementById(`player${playerIndex}_item6`);
    if (!ihr) return;

    if (source === 'boosted' && siabSlot) {
        const boosted = document.getElementById(`player${playerIndex}_item${siabSlot}`);
        if (!boosted) return;
        // Match grade: T4L SIAB → T4L SIAB in IHR list, etc.
        const grade = boosted.value.split(' ')[0]; // e.g. "T4L"
        const match = Array.from(ihr.options).findIndex(o => o.value.startsWith(grade));
        if (match >= 0) { ihr.selectedIndex = match; setColor(ihr); }
    } else if (source === 'ihr' && siabSlot) {
        const boosted = document.getElementById(`player${playerIndex}_item${siabSlot}`);
        if (!boosted) return;
        const grade = ihr.value.split(' ')[0];
        const match = Array.from(boosted.options).findIndex(o => o.value.startsWith(grade) && o.value.includes('SIAB'));
        if (match >= 0) { boosted.selectedIndex = match; setColor(boosted); }
    }
}

function updateSIABLinkVisibility(playerIndex) {
    const siabSlot = getBoostedSIABSlot(playerIndex);
    // Hide all SIAB link button wrappers for this player first
    for (let j = 2; j <= 4; j++) {
        const wrap = document.getElementById(`siabLinkWrap${playerIndex}_${j}`);
        if (wrap) wrap.style.display = 'none';
    }
    if (siabSlot) {
        const wrap = document.getElementById(`siabLinkWrap${playerIndex}_${siabSlot}`);
        if (wrap) wrap.style.display = '';
    }
    // If no SIAB selected, disable syncing
    if (!siabSlot) siabLinked[playerIndex] = false;
}

function injectSIABLinkButton(playerIndex) {
    siabLinked[playerIndex] = true;

    // Inject a link button under each of items 2, 3, 4 (any could hold SIAB)
    for (let j = 2; j <= 4; j++) {
        const sel = document.getElementById(`player${playerIndex}_item${j}`);
        if (!sel) continue;

        const btn = document.createElement('button');
        btn.id = `siabLink${playerIndex}_${j}`;
        btn.title = 'SIAB slots linked — click to unlink';
        btn.textContent = '🔗';
        btn.style.cssText = `
            position: absolute;
            top: 2px;
            left: 2px;
            font-size: 9px;
            padding: 0px 3px;
            cursor: pointer;
            border-radius: 3px;
            border: 1px solid rgba(255,255,255,0.2);
            background: rgba(0,0,0,0.35);
            color: var(--amber, #f59e0b);
            width: auto;
            line-height: 1.4;
            z-index: 10;
            pointer-events: all;
        `;

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            siabLinked[playerIndex] = !siabLinked[playerIndex];
            // Update all SIAB buttons for this player to reflect state
            for (let k = 2; k <= 4; k++) {
                const b = document.getElementById(`siabLink${playerIndex}_${k}`);
                if (!b) continue;
                if (siabLinked[playerIndex]) {
                    b.textContent = '🔗';
                    b.title = 'SIAB slots linked — click to unlink';
                    b.style.color = 'var(--amber, #f59e0b)';
                    b.style.background = 'rgba(0,0,0,0.35)';
                } else {
                    b.textContent = '🔓';
                    b.title = 'SIAB slots unlinked — click to link';
                    b.style.color = 'var(--text-muted, #888)';
                    b.style.background = 'rgba(0,0,0,0.35)';
                }
            }
            if (siabLinked[playerIndex]) syncSIAB(playerIndex, 'boosted');
        });

        // Make the .item div relative so the button can be absolutely positioned over the select
        const itemParent = sel.closest('.item');
        if (itemParent) {
            itemParent.style.position = 'relative';
            // Wrap button in a hidden div; show/hide via updateSIABLinkVisibility
            const wrapper = document.createElement('div');
            wrapper.id = `siabLinkWrap${playerIndex}_${j}`;
            wrapper.style.cssText = 'display:none; position:absolute; top:0; left:0; z-index:10;';
            wrapper.appendChild(btn);
            itemParent.appendChild(wrapper);
        }
    }

    // Set initial visibility based on current selection
    updateSIABLinkVisibility(playerIndex);
}

function syncDefl(playerIndex, source) {
    if (!deflLinked[playerIndex]) return;
    const defl1 = document.getElementById(`player${playerIndex}_item1`);
    const defl5 = document.getElementById(`player${playerIndex}_item5`);
    if (!defl1 || !defl5) return;

    // Match the name from one defl list to the equivalent in the other
    // Both lists share the same option names so selectedIndex maps directly
    if (source === 1) {
        defl5.selectedIndex = defl1.selectedIndex;
        setColor(defl5);
    } else {
        defl1.selectedIndex = defl5.selectedIndex;
        setColor(defl1);
    }
}

function injectDeflLinkButton(playerIndex) {
    const sel1 = document.getElementById(`player${playerIndex}_item1`);
    if (!sel1) return;

    deflLinked[playerIndex] = true;

    const btn = document.createElement('button');
    btn.id = `deflLink${playerIndex}`;
    btn.title = 'Defl. slots linked — click to unlink';
    btn.textContent = '🔗';
    btn.style.cssText = `
        position: absolute;
        top: 2px;
        left: 2px;
        font-size: 9px;
        padding: 0px 3px;
        cursor: pointer;
        border-radius: 3px;
        border: 1px solid rgba(255,255,255,0.2);
        background: rgba(0,0,0,0.35);
        color: var(--amber, #f59e0b);
        width: auto;
        line-height: 1.4;
        z-index: 10;
        pointer-events: all;
    `;

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deflLinked[playerIndex] = !deflLinked[playerIndex];
        if (deflLinked[playerIndex]) {
            btn.textContent = '🔗';
            btn.title = 'Defl. slots linked — click to unlink';
            btn.style.color = 'var(--amber, #f59e0b)';
            syncDefl(playerIndex, 1);
        } else {
            btn.textContent = '🔓';
            btn.title = 'Defl. slots unlinked — click to link';
            btn.style.color = 'var(--text-muted, #888)';
        }
    });

    // Wrap item1 in a relative-positioned container so the button can overlay it
    const item1Parent = sel1.closest('.item');
    if (item1Parent) {
        item1Parent.style.position = 'relative';
        item1Parent.appendChild(btn);
    }
}

// Call the function to add listeners after players generated
function onPlayersGenerated() {
    const playersContainer = document.getElementById('playersContainer');
    const numPlayers = parseInt(document.getElementById('numPlayers').value, 10);

    document.getElementById('crtToggle').onchange = () => Run();
    document.getElementById('tokenToggle').onchange = () => Run();
    document.getElementById('GGToggle').onchange = () => Run();
    document.getElementById('crttime').onchange = () => Run();
    document.getElementById('mpft').onchange = () => Run();
    document.getElementById('duration').onchange = () => Run();
    document.getElementById('durUnit').onchange = () => Run();
    document.getElementById('targetEggAmount').onchange = () => Run();
    document.getElementById('eggUnit').onchange = () => Run();
    document.getElementById('tokenTimer').onchange = () => Run();
    document.getElementById('modifiers').onchange = () => Run();
    document.getElementById('mod-name').onchange = () => Run();
    document.getElementById('numPlayers').onchange = () => generatePlayers();
    document.getElementById('btvTarget').onchange = () => Run();
    document.getElementById('cxpToggle').onchange = () => cxpToggleRun(numPlayers);
    document.getElementById('QPlayerInput').input = () => QPInRun();



    for (let i = 0; i < numPlayers; i++) {
        const alreadyWired = document.getElementById(`player${i}_item1`)?.dataset.listenersAdded;

        for (let j = 1; j <= 4; j++) {
            const selectElement = document.getElementById(`player${i}_item${j}`);
            selectElement.style.borderRadius = '5px';
            selectElement.style.width = '130px';
            selectElement.style.textAlign = 'center';
            selectElement.style.alignSelf = 'center';
            if (!alreadyWired) {
                selectElement.addEventListener('change', function () {
                    setColor(this);
                    if (j === 1) syncDefl(i, 1);
                    // Any boosted slot change may affect SIAB link visibility
                    if (j >= 2 && j <= 4) {
                        updateSIABLinkVisibility(i);
                        if (this.value.includes('SIAB')) {
                            // Only re-enable link if it hasn't been explicitly unlinked by the user.
                            // siabLinked is false either because: (a) user clicked unlink, or
                            // (b) no SIAB was previously selected (cleared by updateSIABLinkVisibility).
                            // We distinguish by checking if a siabLink button exists and shows 🔓.
                            const anyBtn = document.getElementById(`siabLink${i}_2`) ||
                                document.getElementById(`siabLink${i}_3`) ||
                                document.getElementById(`siabLink${i}_4`);
                            const userUnlinked = anyBtn && anyBtn.textContent === '🔓';
                            if (!userUnlinked) {
                                siabLinked[i] = true;
                                for (let k = 2; k <= 4; k++) {
                                    const b = document.getElementById(`siabLink${i}_${k}`);
                                    if (b) {
                                        b.textContent = '🔗';
                                        b.title = 'SIAB slots linked — click to unlink';
                                        b.style.color = 'var(--amber, #f59e0b)';
                                        b.style.background = 'rgba(0,0,0,0.35)';
                                    }
                                }
                                syncSIAB(i, 'boosted');
                            }
                        }
                    }
                    Run();
                });
            }
        }
        for (let j = 5; j <= 8; j++) {
            const selectElement = document.getElementById(`player${i}_item${j}`);
            selectElement.style.borderRadius = '5px';
            selectElement.style.width = '130px';
            selectElement.style.textAlign = 'center';
            selectElement.style.alignSelf = 'center';
            if (!alreadyWired) {
                selectElement.addEventListener('change', function () {
                    setColor(this);
                    if (j === 5) syncDefl(i, 5);
                    if (j === 6) syncSIAB(i, 'ihr');
                    Run();
                });
            }
        }

        // Mark this player's listeners as wired
        if (!alreadyWired && document.getElementById(`player${i}_item1`)) {
            document.getElementById(`player${i}_item1`).dataset.listenersAdded = '1';
        }

        // Tab from playerName → next playerName in DOM order
        // Tab from playerTE  → next playerTE  in DOM order
        // Tab from playerTokens → next playerTokens in DOM order
        // Uses DOM traversal so it still works correctly after players are reordered
        const nameEl = document.getElementById(`playerName${i}`);
        const teEl = document.getElementById(`playerTE${i}`);
        const tokenEl = document.getElementById(`playerTokens${i}`);

        function nextInputByClass(currentEl, idPrefix) {
            const all = Array.from(document.querySelectorAll(`[id^="${idPrefix}"]`));
            const idx = all.indexOf(currentEl);
            return idx >= 0 && idx + 1 < all.length ? all[idx + 1] : null;
        }

        function showTabTip(anchorEl) {
            if (document.getElementById('tabTip')) return; // already showing
            const tip = document.createElement('div');
            tip.id = 'tabTip';
            tip.textContent = 'Tip: press Tab to jump to the next name, tokens or TE input';
            tip.style.cssText = `
                position: absolute;
                background: var(--surface);
                color: var(--text-secondary);
                border: 1px solid var(--amber);
                border-radius: 6px;
                padding: 6px 12px;
                font-size: 12px;
                font-family: 'DM Sans', sans-serif;
                box-shadow: 0 4px 16px rgba(0,0,0,0.4);
                z-index: 1000;
                pointer-events: none;
                white-space: nowrap;
                opacity: 0;
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(tip);

            // Position below the input
            const rect = anchorEl.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            tip.style.top = (rect.bottom + scrollY + 6) + 'px';
            tip.style.left = (rect.left + scrollX) + 'px';

            requestAnimationFrame(() => { tip.style.opacity = '1'; });

            function dismiss() {
                tip.style.opacity = '0';
                setTimeout(() => tip.remove(), 250);
            }

            const autoHide = setTimeout(dismiss, 6000);

            anchorEl.addEventListener('blur', () => {
                clearTimeout(autoHide);
                dismiss();
            }, { once: true });
        }

        function addTabJump(el, idPrefix) {
            if (!el) return;
            el.addEventListener('keydown', function (e) {
                if (e.key === 'Tab' && !e.shiftKey) {
                    const next = nextInputByClass(this, idPrefix);
                    if (next) { e.preventDefault(); next.focus(); next.select(); }
                }
            });
            el.addEventListener('focus', function () {
                const numPlayers = parseInt(document.getElementById('numPlayers').value, 10);
                if (numPlayers > 1 && !window._tabTipShown) {
                    window._tabTipShown = true;
                    showTabTip(this);
                }
            }, { once: true });
        }

        addTabJump(nameEl, 'playerName');
        addTabJump(teEl, 'playerTE');
        addTabJump(tokenEl, 'playerTokens');

        // Inject the defl link button under item1 (guard against double-injection)
        if (!document.getElementById(`deflLink${i}`)) injectDeflLinkButton(i);
        // Inject SIAB link buttons under items 2–4 (shown only when SIAB selected)
        if (!document.getElementById(`siabLink${i}_2`)) injectSIABLinkButton(i);
    }

}

function cxpToggleRun() {
    cxpVal = document.getElementById('cxpToggle').checked;
    if (cxpVal) {
        document.getElementById('tokenToggle').closest(".controls").classList.add("hidden");
        document.getElementById('tokenToggleLabel').closest(".controls").classList.add("hidden");
        document.getElementById('crtToggle').closest(".controls").classList.add("hidden");
        document.getElementById('crtToggleLbl').closest(".controls").classList.add("hidden");
    } else {
        document.getElementById('tokenToggle').closest(".controls").classList.remove("hidden");
        document.getElementById('tokenToggleLabel').closest(".controls").classList.remove("hidden");
        document.getElementById('crtToggle').closest(".controls").classList.remove("hidden");
        document.getElementById('crtToggleLbl').closest(".controls").classList.remove("hidden");
    }

    for (let i = 0; i < numPlayers; i++) {
        document.getElementById(`Sink${i}`).hidden = cxpVal;
        document.getElementById(`SinkLabel${i}`).hidden = cxpVal;
    }

    Run();
}

function QPInRun() {
    const artiArray = document.getElementById("QPlayerInput").value.trim();
    artiNumbers = artiArray;
    artiNumbers = artiArray.split(/\s+/).filter(n => n !== '').map(Number)
    if (document.getElementById('numPlayers').value !== artiNumbers.reduce((acc, curr) => acc + curr, 0)) {
        document.getElementById('numPlayers').value = artiNumbers.reduce((acc, curr) => acc + curr, 0);
        resetContractHeader();
    }

    generatePlayers();
    generatePlayers(artiArray);
}

function enforceMinMax(el) {
    if (el.value != "") {
        if (parseInt(el.value) < parseInt(el.min)) {
            el.value = el.min;
        }
        if (parseInt(el.value) > parseInt(el.max)) {
            el.value = el.max;
        }
        el.value = Math.round(el.value);
    }
}

function enforceMinMaxDec(el) {
    if (el.value != "") {
        if (parseInt(el.value) < parseInt(el.min)) {
            el.value = el.min;
        }
        if (parseInt(el.value) > parseInt(el.max)) {
            el.value = el.max;
        }
    }
}


function generatePermutations(arr) {
    if (arr.length === 0) return [[]];
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const rest = arr.slice(0, i).concat(arr.slice(i + 1));
        const restPermutations = generatePermutations(rest);
        for (const perm of restPermutations) {
            result.push([arr[i]].concat(perm));
        }
    }
    return result;
}

const btn = document.getElementById("toggleInfo2Btn");
const info2 = document.getElementById("info2Container");

btn.addEventListener("click", () => {
    const isHidden = info2.classList.toggle("hidden");
    btn.textContent = 'ℹ️ More Info & Assumptions';
});


document.getElementById("runScenariosBtn").addEventListener("click", () => runScenarios());
document.getElementById("runTokenScenariosBtn").addEventListener("click", () => optimizeWithOuterFirstPlayer(0));
document.getElementById("runTokenScenariosMeanBtn").addEventListener("click", () => optimizeWithOuterFirstPlayer(1));

function runScenarios() {
    //[data, data2] = gatherData();
    //const baselineData = dataToBase64(data, data2);
    //info2.innerHTML = baselineData;
    const params = new URLSearchParams(window.location.search);
    const base64Data = params.get('data');
    //info2.innerHTML = baselineData;
    const results = [];

    const simConfig = buildSimConfigFromUI();
    const basePlayers = buildPlayersFromUI(simConfig);


    Run();
    /*
    scenarios.forEach(scenario => {
        const players = basePlayers.map((p, i) => {
            const clone = clonePlayer(p);
            return clone;
        });
        scenario.apply(players);
        QPInRun();
        //players = buildPlayersFromUI(simConfig);
        const res = RunSimulation(players, simConfig);
        //const data = collectScenarioResults();
        results.push({
            name: scenario.name,
            ...res
        });
    });
    */
    // Run legendary scenario
    scenarios.forEach((scenario, i) => {
        if (i < 1) {
            const players = basePlayers.map((p, i) => {
                const clone = clonePlayer(p);
                return clone;
            });
            scenario.apply(players);
            //QPInRun();
            //players = buildPlayersFromUI(simConfig);
            const res = RunSimulation(players, simConfig);
            //const data = collectScenarioResults();
            results.push({
                name: scenario.name,
                ...res
            });
        }
    });
    const baseline = results.find(r => r.name.includes("All T4L Defl."));
    const playersLeg = basePlayers.map((p, i) => {
        const clone = clonePlayer(p);
        return clone;
    });
    scenarios[0].apply(playersLeg);

    // CheckSIAB
    const siabTest = testSinglePlayerSIAB(playersLeg, simConfig, baseline);


    if (siabTest) {


        if (basePlayers.length > 3) {
            const halfResult = runHalfSIAB(basePlayers, simConfig, siabTest.slot);
            let half = Math.ceil(basePlayers.length / 2);
            let nameTmp = siabTest.name;
            nameTmp = nameTmp.replace("1 SIAB", `${half} SIABs`);

            results.unshift({
                name: nameTmp,
                ...halfResult
            });
        }

        results.unshift({
            name: siabTest.name,
            ...siabTest.result
        });

    }


    // Run non-legendary scenarios
    scenarios.forEach((scenario, i) => {
        if (i > 0) {
            const players = basePlayers.map((p, i) => {
                const clone = clonePlayer(p);
                return clone;
            });
            scenario.apply(players);
            // QPInRun();
            //players = buildPlayersFromUI(simConfig);
            const res = RunSimulation(players, simConfig);
            //const data = collectScenarioResults();
            results.push({
                name: scenario.name,
                ...res
            });
        }
    });
    displayScenarioResults(results, siabTest !== null);

    //loadDataFromUrl(base64Data);
    //populateData2(data, data2, curentURLEncodeVer);
}

function applySIAB(player, slot) {
    const list = itemLists[slot + 1];
    const siabIndex = list.findIndex(item => item.name === 'T4L SIAB');
    if (siabIndex !== -1) {
        player.artifacts[slot] = list[siabIndex];
    }
}

function testSinglePlayerSIAB(basePlayers, simConfig, baseResult) {

    let bestResult = null;
    let bestSlot = -1;

    for (let slot = 3; slot > 0; slot--) {

        // Duplicate players, and set all to legendary
        const players = basePlayers.map((p, i) => {
            const clone = clonePlayer(p);
            return clone;
        });
        players.forEach(player => {
            for (let n = 0; n < 4; n++) {
                player.artifacts[n] = itemLists[n + 1][0];
            }
        });

        applySIAB(players[0], slot);
        handleArtifactChange(players);
        const res = RunSimulation(players, simConfig);

        if (!bestResult || res.maxCS > bestResult.maxCS) {
            bestResult = res;
            bestSlot = slot;
        }
    }

    const artifactNames = [
        "Deflector",
        "Metro",
        "Compass",
        "Gusset"
    ];


    if (bestResult && bestResult.maxCS > baseResult.maxCS) {
        let resName = "1 SIAB in place of " + artifactNames[bestSlot] + " + Leggies";
        return { result: bestResult, slot: bestSlot, name: resName };
    }

    return null;
}

function runHalfSIAB(basePlayers, simConfig, slot) {

    const players = basePlayers.map(p => clonePlayer(p));
    players.forEach(player => {
        for (let n = 0; n < 4; n++) {
            player.artifacts[n] = itemLists[n + 1][0];
        }
    });
    const half = Math.ceil(players.length / 2);

    for (let i = 0; i < half; i++) {
        applySIAB(players[i], slot);
    }
    handleArtifactChange(players);
    return RunSimulation(players, simConfig);
}

function collectScenarioResults() {
    const coopTable = document.getElementById("coopTable");
    const cells = coopTable.querySelectorAll("td");
    const playerTable = document.getElementById("playersTable");
    const cells2 = playerTable.querySelectorAll("td");
    const tmp = getSecondLineWithImages(cells2[1], ':afx_tachyon_stone_4:');
    const tmp2 = getSecondLineWithImages(cells2[2], ':afx_quantum_stone_4:');
    const stones = tmp + ', ' + tmp2;
    return {
        maxCS,
        minCS,
        stones
    };
}


function getSecondLineWithImages(cell, s) {
    if (!cell) return "";

    // Clone so we don't touch the real DOM
    const clone = cell.cloneNode(true);

    // Replace images with text
    clone.querySelectorAll("img").forEach(img => {
        img.replaceWith(document.createTextNode(s));
    });

    // Find the <br>
    const br = clone.querySelector("br");
    if (!br) return "";

    // Collect all nodes AFTER the <br>
    let text = "";
    let node = br.nextSibling;

    while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
            text += node.textContent;
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            text += node.textContent;
        }
        node = node.nextSibling;
    }

    return text.trim();
}



function displayScenarioResults(results, hasSIAB) {
    const container = document.getElementById("scenarioOutputContainer");
    const textarea = document.getElementById("scenarioOutput");
    const htmlOut = document.getElementById("scenarioHtmlOutput");

    // Clear HTML output
    htmlOut.innerHTML = "";
    const lines = [];
    textarea.style.display = "block";

    // Build link with current settings
    const params = new URLSearchParams(window.location.search);
    const base64Data = params.get('data');
    let url = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;

    if (coopNameFromURL) {
        const coopEncoded = btoa(encodeURIComponent(coopNameFromURL));
        url += `&c=${coopEncoded}`;
    }

    // Player count
    const numPlayers = document.getElementById("numPlayers").value;

    const complTime = approxTime(results[4].completionTime); //estimate completion time using mixed deflectors


    let output = results
        .map(r => `- ${(r.minCS / 1e3).toFixed(1)}k - ${(r.maxCS / 1e3).toFixed(1)}k (${r.name})`);

    if (hasSIAB) {
        const siabCount = numPlayers > 3 ? 2 : 1;

        output.splice(0, 0, "-----");            // before SIAB
        output.splice(siabCount + 1, 0, "-----"); // after SIAB
    }

    output.unshift(`${numPlayers}p ${complTime}`); // `, [sim](${url})`);

    if (coopNameFromURL) {
        output.unshift(`${coopNameFromURL}`);
    }

    textarea.value = output.join("\n");
    container.classList.remove("hidden");
}

function approxTime(sec) {
    const minute = 60;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (sec >= day) {
        const d = Math.floor(sec / day);
        const h = Math.round((sec % day) / hour);
        return `~${d}d${h}h`;
    }

    if (sec >= hour) {
        const h = Math.round(sec / hour);
        return `~${h}h`;
    }

    const m = Math.round(sec / minute);
    return `~${m}m`;
}

document.getElementById("copyScenarioBtn").addEventListener("click", async () => {
    const textarea = document.getElementById("scenarioOutput");
    const htmlOut = document.getElementById("scenarioHtmlOutput");

    let textToCopy = "";

    // Case 1: textarea mode (displayScenarioResults)
    if (textarea && textarea.style.display !== "none" && textarea.value.trim()) {
        textToCopy = textarea.value;

        // Build tool URL
        const params = new URLSearchParams(window.location.search);
        const base64Data = params.get('data');

        let url = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;
        let offset = 0;
        if (coopNameFromURL) {
            // Format text
            textToCopy = '### ' + textToCopy;
            const coopEncoded = btoa(encodeURIComponent(coopNameFromURL));
            url += `&c=${coopEncoded}`;
            offset = 1;
        }
        const discordLink = `[Sim](${url})`;

        const lines = textToCopy.split("\n");
        lines[offset] = `**` + lines[offset] + '**' + ` ` + (discordLink);
        textToCopy = lines.join("\n");
    }
    // Case 2: HTML/pre mode (renderScenarioResults)
    else {
        const pre = htmlOut.querySelector("pre");
        if (pre) {
            textToCopy = pre.innerText;
        }
    }

    if (!textToCopy) return;

    await navigator.clipboard.writeText(textToCopy);
});

document.addEventListener("input", hideScenarioOutput);
document.addEventListener("change", hideScenarioOutput);
const tokenSweepResults = [];

function optimizeWithOuterFirstPlayer(meanFlag) {
    const simConfig = buildSimConfigFromUI();

    if (simConfig.numPlayers > 20) {
        container = document.getElementById('scenarioOutputContainer');
        const textarea = document.getElementById("scenarioOutput");
        textarea.value = `Sorry, Optimization only available for size 20 or less`;
        container.classList.remove("hidden");
        return;
    }
    const basePlayers = buildPlayersFromUI(simConfig);
    const N = basePlayers.length;

    tokenSweepResults.length = 0;
    const seen = new Set();

    let bestCS = -Infinity;

    function evaluate(tokens) {
        const key = tokenKey(tokens);
        if (seen.has(key)) {
            evaluate.lastImproved = false;
            return null;
        }
        seen.add(key);

        const players = basePlayers.map((p, i) => {
            const clone = clonePlayer(p);
            clone.tokens = tokens[i];
            return clone;
        });

        const results = RunSimulation(players, simConfig);
        if (!results.success) {
            evaluate.lastImproved = false;
            return null;
        }

        const csValue = meanFlag ? results.meanCS : results.maxCS;

        evaluate.lastImproved = csValue > bestCS;
        if (evaluate.lastImproved) {
            bestCS = csValue;
        }

        tokenSweepResults.push({
            tokens: [...tokens],
            cs: csValue
        });

        return csValue;
    }
    evaluate.lastImproved = false;

    // Outer sweep: first player
    for (let p0 = 1; p0 <= 8; p0++) {
        optimizeRestGivenFirstPlayer({
            p0,
            basePlayers,
            simConfig,
            evaluate
        });


    }
    x = 0;
    const best = tokenSweepResults.reduce(
        (a, b) => (b.cs > a.cs ? b : a)
    );

    renderScenarioResults({ best, all: tokenSweepResults, meanFlag });
    // return { best, all: tokenSweepResults };
}


function optimizeRestGivenFirstPlayer({
    p0,
    basePlayers,
    simConfig,
    evaluate
}) {
    const N = basePlayers.length;

    // --- Case A: uniform sweep on players 1..N-1
    let bestUniform = {
        cs: -Infinity,
        tokens: null
    };

    for (let t = 0; t <= 8; t++) {
        const tokens = Array(N).fill(t);
        tokens[0] = p0;

        const cs = evaluate(tokens);
        if (cs !== null && cs > bestUniform.cs) {
            bestUniform = { cs, tokens: [...tokens] };
        }
    }

    if (!bestUniform.tokens) return;

    // --- Case B: front-loaded permutations (players 1 →)
    frontLoadedNestedSweep({
        baseTokens: bestUniform.tokens,
        evaluate
    });

    // --- Case C: back-loaded permutations (players N-1 ←)
    backLoadedNestedSweep({
        baseTokens: bestUniform.tokens,
        evaluate
    });

    // --- Case D: symmetric front/back loading
    symmetricNestedSweep({
        baseTokens: bestUniform.tokens,
        evaluate
    });
}

function tokenKey(tokens) {
    return tokens.join(",");
}

function clonePlayer(player) {
    const clone = Object.assign(
        Object.create(Object.getPrototypeOf(player)),
        player
    );

    // Deep-clone mutable sim statefh
    clone.stats = structuredClone(player.stats);
    clone.rates = structuredClone(player.rates);
    clone.flags = structuredClone(player.flags);
    clone.artifacts = structuredClone(player.artifacts);


    // Explicit reset if needed
    // clone.eggsDelivered = 0;

    return clone;
}

function evaluateAndStore(basePlayers, simConfig, tokens, seen) {
    const players = basePlayers.map((p, i) => {
        const clone = clonePlayer(p);
        clone.tokens = tokens[i];
        return clone;
    });

    const key = tokenKey(tokens);
    if (seen.has(key)) return null;
    seen.add(key);

    const results = RunSimulation(players, simConfig);

    if (!results.success) return null;

    const entry = {
        tokens: [...tokens],
        cs: results.maxCS
    };

    tokenSweepResults.push(entry);
    return entry.cs;
}
function frontLoadedNestedSweep({
    baseTokens,
    evaluate,
    tokenCap = 12
}) {
    const N = baseTokens.length;
    const tokens = [...baseTokens];

    function sweepAt(index, localBestCS) {
        if (index >= N) return localBestCS;

        while (tokens[index] < tokenCap) {
            tokens[index]++;

            const cs = evaluate(tokens);
            if (cs === null || cs <= localBestCS) {
                tokens[index]--;
                break;
            }
            // Update local best for THIS path
            localBestCS = cs;

            // For EACH value of this player,
            // fully explore the next one to the right
            localBestCS = sweepAt(index + 1, localBestCS);
        }
    }

    // Start at player 1 (player 0 is fixed)
    sweepAt(1);
}
function backLoadedNestedSweep({
    baseTokens,
    evaluate,
    tokenCap = 12
}) {
    const N = baseTokens.length;
    const tokens = [...baseTokens];

    function sweepAt(index, localBestCS) {
        if (index <= 0) return localBestCS;

        while (tokens[index] < tokenCap) {
            tokens[index]++;

            const cs = evaluate(tokens);
            if (cs === null || cs <= localBestCS) {
                tokens[index]--;
                break;
            }

            // Update local best for THIS path
            localBestCS = cs;

            // For each of these, explore the next dimension
            localBestCS = sweepAt(index - 1, localBestCS);
        }

        return localBestCS;
    }

    sweepAt(N - 1, -Infinity);
}

function symmetricNestedSweep({
    baseTokens,
    evaluate,
    tokenCap = 12
}) {
    const N = baseTokens.length;
    const tokens = [...baseTokens];

    const maxDepth = Math.floor((N - 1) / 2);

    function sweepAt(depth, localBestCS) {
        const left = 1 + depth;
        const right = N - 1 - depth;

        if (left >= right) return;
        if (left <= 0 || right >= N) return;

        while (
            tokens[left] < tokenCap &&
            tokens[right] < tokenCap
        ) {
            tokens[left]++;
            tokens[right]++;

            const cs = evaluate(tokens);
            if (cs === null || cs <= localBestCS) {
                tokens[left]--;
                tokens[right]--;
                break;
            }

            // Update local best for THIS path
            localBestCS = cs;

            // For EACH value of this symmetric pair,
            // fully explore the next inner pair
            sweepAt(depth + 1, localBestCS);
        }
    }

    sweepAt(0);
}

function getResultsSortedByCS() {
    return [...tokenSweepResults].sort((a, b) => b.cs - a.cs);
}

function formatTokens(tokens) {
    if (!tokens.length) return "";

    const parts = [];
    let current = tokens[0];
    let count = 1;


    for (let i = 1; i < tokens.length; i++) {
        if (tokens[i] === current) {
            count++;
        } else {
            parts.push(`${String(count).padStart(2, " ")}` + String.fromCodePoint(0x1F9D1, 0x200D, 0x1F33E) + ` ${String(current).padStart(2, " ")}` + String.fromCodePoint(0x1FA99));
            current = tokens[i];
            count = 1;
        }
    }

    parts.push(`${String(count).padStart(2, " ")}` + String.fromCodePoint(0x1F9D1, 0x200D, 0x1F33E) + ` ${current}` + String.fromCodePoint(0x1FA99));
    return parts.join(", ");
}




function renderScenarioResults({ best, all, meanFlag }) {
    const container = document.getElementById("scenarioOutputContainer");
    const textarea = document.getElementById("scenarioOutput");
    const htmlOut = document.getElementById("scenarioHtmlOutput");

    const headerText = meanFlag ? "\nOptimized Tokens for Mean CS" : "\nOptimized Tokens for Max CS";

    // Clear only HTML output
    htmlOut.innerHTML = "";

    // Hide textarea
    textarea.style.display = "none";

    const sorted = getResultsSortedByCS();

    // Build URL for best result
    const [data, data2, repeatedPrefix] = gatherDOMData(sorted[0].tokens);
    const base64Data = dataToBase64(data, data2);
    const version = repeatedPrefix ? curentURLEncodeVer.replace('-', '_') : curentURLEncodeVer;
    const url = `${window.location.origin}${window.location.pathname}?data=${version + base64Data}`;

    const pre = document.createElement("pre");
    pre.style.margin = "0";
    pre.appendChild(document.createTextNode(headerText));
    pre.appendChild(document.createTextNode("\n"));

    // Best result link
    const bestLine = document.createElement("a");
    bestLine.href = url;
    bestLine.target = "_blank";
    bestLine.textContent = `Optimal Found: ${Math.round(sorted[0].cs)} — ${sorted[0].tokens.join(' ')}`;
    //bestLine.style.display = "inline-block";
    bestLine.style.color = "inherit";
    bestLine.style.textDecoration = "underline";
    //bestLine.style.fontWeight = "inherit";
    bestLine.style.cursor = "pointer";

    pre.appendChild(bestLine);
    pre.appendChild(document.createTextNode("\n"));
    pre.appendChild(document.createTextNode(`\nCS - Tokens:\n`));

    // htmlOut.appendChild(bestLine);

    // const lines = [];

    for (let i = 0; i < Math.min(sorted.length, 10); i++) {
        const r = sorted[i];
        pre.appendChild(
            document.createTextNode(`${Math.round(r.cs)} — ${r.tokens.join(' ')}\n`)
        );
        //lines.push(`CS: ${r.cs} — ${formatTokens(r.tokens)}`);
    }
    if (sorted.length > 10) {
        pre.appendChild(
            document.createTextNode(`And ` + (sorted.length - 10) + ` other cases checked... \n`)
        );
    }

    // pre.textContent = lines.join("\n");
    htmlOut.appendChild(pre);

    container.classList.remove("hidden");
}


