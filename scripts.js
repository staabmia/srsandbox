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
    TE: 0,
    spSwapBTV: 0,      // BTV credited for the assumed SP pre-boost set
    spSwapWindow: 0,   // length of the window that credit covers, seconds
    spCreditDefl: 0,   // deflector % credited pre-boost (0 = already equipped)
    spCreditSiab: 0,   // SIAB % credited pre-boost (0 = already equipped)
    chickensNeeded: 0, // chickens at which the lay-rate set is shipping-capped (early swap)
    swapTime: 0        // sim time the IHR set was swapped for the lay-rate set
};
const defaultRates = {
    ihr: 0,
    deliveryRate: 0,
    baseShip: 0,
    baseELR: 0,
    layRate: 0,
    shipRate: 0,
    ihrLaySet: 0,        // IHR once the IHR set is swapped out (no chalice/monocle/life stones)
    maxDeliveryRate: 0,  // best delivery rate the lay-rate set can reach at full habs
}
const defaultFlags = {
    needsMirror: false,
    isSink: false,
    isCreator: false,
    maxHab: false,
    siabActive: false,
    collegg: false,
    spSwap: false,     // standard permit player assumed to swap out of defl/SIAB at boost
    swapped: false     // lay-rate set equipped (at max habs, or early once shipping-capped)
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

    // ── Lay-rate set / early swap helpers ──────────────────────────────────
    // Rates this player would have with the lay-rate set equipped and `chickens`
    // chickens, given the deflector the rest of the coop currently runs (stats.otherDefl).
    calcLaySetRates(chickens) {
        let elr = chickens * this.rates.baseELR;
        let sr = this.rates.baseShip;
        let slots = 0;
        for (let i = 0; i < 4; i++) {
            const a = this.artifacts[i];
            elr *= a.elrmult;
            sr *= a.srmult;
            slots += a.slots;
        }
        elr *= (1 + this.stats.otherDefl / 100);
        const [layRate, shipRate, nTach, nQuant] = optimizeStones(elr, sr, slots);
        return { layRate, shipRate, deliveryRate: Math.min(layRate, shipRate), numTach: nTach, numQuant: nQuant };
    }

    applyRates({ layRate, shipRate, deliveryRate, numTach, numQuant }) {
        this.rates.layRate = layRate;
        this.rates.shipRate = shipRate;
        this.rates.deliveryRate = deliveryRate;
        this.stats.numTach = numTach;
        this.stats.numQuant = numQuant;
    }

    // Works out how many chickens the lay-rate set actually needs. The best delivery rate
    // is what the set reaches at full habs (stones split optimally). If shipping is the
    // bottleneck there, fewer chickens reach the same rate: put as many stones into
    // tachyon as shipping can spare, then solve lay rate = that delivery rate for chickens.
    // Never exceeds habsize. Must be re-run whenever stats.otherDefl changes.
    updateSwapTarget() {
        const EPS = 1e-9;
        const maxChickens = this.stats.maxChickens;
        const maxDelivery = this.calcLaySetRates(maxChickens).deliveryRate;

        let elrPerChicken = this.rates.baseELR;
        let srBase = this.rates.baseShip;
        let slots = 0;
        for (let i = 0; i < 4; i++) {
            const a = this.artifacts[i];
            elrPerChicken *= a.elrmult;
            srBase *= a.srmult;
            slots += a.slots;
        }
        elrPerChicken *= (1 + this.stats.otherDefl / 100);

        // Most tachyons possible while the remaining quants still ship maxDelivery
        let tach = 0;
        for (let t = slots; t >= 0; t--) {
            if (srBase * Math.pow(1.05, slots - t) >= maxDelivery * (1 - EPS)) { tach = t; break; }
        }

        let needed = Math.ceil(maxDelivery / (elrPerChicken * Math.pow(1.05, tach)));
        if (!isFinite(needed) || needed >= maxChickens * (1 - EPS)) needed = maxChickens;

        this.stats.chickensNeeded = Math.max(0, needed);
        this.rates.maxDeliveryRate = maxDelivery;
    }

    // Habs full, or on the lay-rate set and already delivering its best possible rate.
    // Settled players stop hatching; the sim reaches steady state once everyone is settled.
    isSettled() {
        if (this.flags.maxHab) return true;
        return this.flags.swapped
            && this.rates.deliveryRate >= this.rates.maxDeliveryRate * (1 - 1e-9);
    }

    // Early swap: don't hatch past the chickens needed (only trims within the crossing tick).
    capAtSwapTarget(prevChickens) {
        const target = this.stats.chickensNeeded;
        if (prevChickens < target && this.stats.chickens > target) {
            this.stats.chickens = target;
            this.flags.maxHab = (target >= this.stats.maxChickens);
        }
    }

    // Swap the IHR set for the lay-rate set.
    swapToLaySet(t_elapsed, duration) {
        this.flags.swapped = true;
        this.stats.swapTime = t_elapsed;
        this.stats.boostingTime = this.stats.timeToBoost > 0 && this.stats.timeToBoost < duration
            ? t_elapsed - this.stats.timeToBoost  // boosted before swapping
            : t_elapsed;
        // IHR set is gone; any further hatching uses the bare IHR
        this.rates.ihr = this.rates.ihrLaySet;
        updateArtis(null, this);
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
    'Pre-Boost/Time Boosting <span class="info-tip info-tip--down" data-tip="Pre-Boost: Time from coop start until the player\'s boost begins. Time Boosting: Time from boost start until the lay-rate set is swapped in, at full habs or once shipping is capped if early swap is on (or time from coop start if the swap came before boosting).">?</span>',
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
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
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
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
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
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
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
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
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
    { name: 'T1C Chalice', image: 'images/Chalice1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.05, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsMonocle = [
    { name: 'T4L Monocle', image: 'images/Monocle4L.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1.3, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Monocle', image: 'images/Monocle4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1.25, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Monocle', image: 'images/Monocle4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.2, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Monocle', image: 'images/Monocle3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.15, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Monocle', image: 'images/Monocle2C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Monocle', image: 'images/Monocle1C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1.05, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
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
    { name: '2 Slot', image: 'images/RandomEpic.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsIHRSIAB = [
    { name: 'T4L SIAB', image: 'images/SIAB4L.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'images/SIAB4E.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'images/SIAB4R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'T4C SIAB', image: 'images/SIAB4C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 70, chickmult: 1 },
    { name: 'T3R SIAB', image: 'images/SIAB3R.png', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 60, chickmult: 1 },
    { name: 'T3C SIAB', image: 'images/SIAB3C.png', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 50, chickmult: 1 },
    { name: '3 Slot', image: 'images/RandomLeg.png', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'images/RandomEpic.png', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
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


const deflTierLabels = ["T4L", "T4E", "T4R", "T4C"];

// When compass is swapped for "3 Slot", metro/gusset are the only slots still
// guaranteed to be legendary; otherwise compass joins them in that group.
function legendaryGroupLabel(compBetter) {
    return compBetter ? "T4L Metro/Gusset" : "T4L Metro/Compass/Gusset";
}

function buildDeflTierScenario(deflIndex) {
    const deflLabel = deflTierLabels[deflIndex];
    return {
        name: `All ${deflLabel} Defl. + Leggies`,
        apply: (players, deflBetter = false, compBetter = false) => {
            players.forEach(player => {
                player.artifacts[0] = deflBetter ? get3SlotItem(1) : itemLists[1][deflIndex];
                player.artifacts[1] = itemLists[2][0];
                player.artifacts[2] = compBetter ? get3SlotItem(3) : itemLists[3][0];
                player.artifacts[3] = itemLists[4][0];
            });
            handleArtifactChange(players);
        },
        getName: (deflBetter, compBetter) => {
            if (!deflBetter && !compBetter) return `All ${deflLabel} Defl. + Leggies`;
            const parts = [deflBetter ? "3 Slot replacing Defl." : `${deflLabel} Defl.`];
            if (compBetter) parts.push("3 Slot replacing Compass");
            parts.push(legendaryGroupLabel(compBetter));
            return parts.join(", ");
        }
    };
}

const scenarios = [
    buildDeflTierScenario(0),
    buildDeflTierScenario(1),
    buildDeflTierScenario(2),
    buildDeflTierScenario(3),
    {
        name: "Mixed Deflectors",
        apply: (players, deflBetter = false, compBetter = false) => {
            const numPlayers = players.length;
            const b = Math.floor(numPlayers / 4);
            players.forEach((player, i) => {
                const group =
                    i < b ? 0 :
                        i < 2 * b ? 1 :
                            i < 3 * b ? 2 : 3;

                player.artifacts[1] = itemLists[2][0];
                player.artifacts[2] = compBetter ? get3SlotItem(3) : itemLists[3][0];
                player.artifacts[3] = itemLists[4][0];

                player.artifacts[0] = deflBetter ? get3SlotItem(1) : itemLists[1][group];
            });
            handleArtifactChange(players);
        },
        getName: (deflBetter, compBetter) => {
            if (!deflBetter && !compBetter) return "Mixed Deflectors";
            const parts = [deflBetter ? "3 Slot replacing Defl." : "Mixed Defl."];
            if (compBetter) parts.push("3 Slot replacing Compass");
            parts.push(legendaryGroupLabel(compBetter));
            return parts.join(", ");
        }
    }
];





let maxCS = 0;
let curentURLEncodeVer = 'v-5';
let coopNameFromURL = null;
let coopNameFromBot = false;
const deflLinked = {}; // tracks whether each player's two defl slots are linked
const siabLinked = {}; // tracks whether each player's boosted and IHR SIAB slots are linked
const siabSlotMemo = {}; // remembers which boosted slot (2-4) holds the SIAB, so the
                         // link survives that slot being set to 'Empty'
const EMPTY_ITEM = 'Empty';

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

    strinfo = '<b><u>Valid for cxp-v0.2.0</u></b>' + "<br />" + 'Current Colleggtibles Assumed (If Checked): +5% Shipping, +5% Shipping, +5% IHR, +5% Layrate, +5% Layrate, +5% Hab Capacity' + "<br />"
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
        + "<br /><b><u>IHR → Lay-Rate Artifact Swap:</b></u>"
        + "<br />With 'Swap once shipping capped?' off, players keep their IHR set until habs are full. With it on, each player swaps as soon as they have enough chickens for their lay-rate set to match its best shipping rate (stones split optimally, never more than habsize), using the coop deflector in place at that moment. "
        + "After swapping they only keep hatching (at bare IHR, no chalice/monocle/life stones) if a deflector change leaves them lay-rate limited again. The Population column shows how full each early-swapped player's habs are. "
        + "<br /><b><u>Estimate CS Ranges — Deflector Drop (↳ lines):</b></u>"
        + "<br />For the all-legendary and 1 SIAB cases, if the coop's unused deflector % covers at least one whole T4L deflector, the last k players swap their deflector for a 3 Slot (k = whole deflectors unused, stepping down until it helps). The ↳ line shows the result when it beats nobody dropping; its low end is usually a dropper. "
        + "<br /><b><u>Standard Permit (SP ⇄) Artifact Swap:</b></u>"
        + "<br />A player with two or fewer artifacts in both the boosted set and the IHR set is treated as a standard permit player, and is assumed to run deflector/SIAB from coop start until their boost, then swap to the IHR pair selected. "
        + "Pre-boost teamwork is credited for whichever of deflector/SIAB is not already equipped in their IHR set; the best available tier of each is assumed. Anything already equipped there is simulated directly for the whole run and is never credited twice, including a low tier, since a standard permit player has no better copy to swap in. "
        + "Neither artifact has a lay rate or shipping bonus, so only BTV changes — eggs delivered, contribution ratio and completion time are unaffected. Under cxp the BTV formula caps at 12% deflector and 50% SIAB, so tier is irrelevant there; the legacy formula is uncapped and assumes the best of each. "
        + "A credited deflector raises only that player's own BTV — it does not feed the coop-wide lay rate bonus or the deflector-drop figures, since those are computed from equipped artifacts. The chalice or monocle given up during that window is treated as worth nothing, which overstates CS very slightly. "
        + "Equipping a deflector and SIAB in the IHR set models them running past boost instead and disables this credit."
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


// Saved Ref CS values, keyed by player name (duplicate names keep a value each, in
// row order). Kept here rather than in the table cells so the reference follows a
// player when rows are reordered, and survives a rename-and-rename-back.
const referenceCS = new Map();

// Rewrites the Ref CS column for whoever occupies each row now. Called at the top of
// every table fill. A player with no saved value gets a blank cell and no +/-.
function syncReferenceCS(players) {
    const rows = document.getElementById('playersTable').querySelectorAll('tr:not(:first-child)');
    const cells = Array.from(rows).map(row => row.querySelector('.reference-col'));
    if (!cells.some(Boolean)) return;

    const usedPerName = new Map();
    cells.forEach((cell, i) => {
        if (!cell) return;
        const name = players[i]?.name ?? '';
        const saved = referenceCS.get(name) ?? [];
        const used = usedPerName.get(name) ?? 0;
        usedPerName.set(name, used + 1);
        cell.textContent = saved[used] !== undefined ? saved[used] : '';
    });
}

// Saved CS for this row, or null when this player has no reference value
function getReferenceValue(referenceCell) {
    if (!referenceCell || referenceCell.textContent.trim() === '') return null;
    const value = parseFloat(referenceCell.textContent);
    return isNaN(value) ? null : value;
}

function removeReferenceCS() {
    referenceCS.clear();
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

    referenceCS.clear();

    rows.forEach((row, idx) => {
        const finalPointsCell = row.querySelector(".final-points");
        const finalValue = parseFloat(finalPointsCell.textContent) || 0;

        let refCell = row.querySelector(".reference-col");

        if (!refCell) {
            refCell = document.createElement("td");
            refCell.classList.add("reference-col");
            row.appendChild(refCell);
        }

        // Save current final value against the player it belongs to
        const refName = document.getElementById(`playerName${idx}`)?.value ?? `Player ${idx}`;
        if (!referenceCS.has(refName)) referenceCS.set(refName, []);
        referenceCS.get(refName).push(finalValue);
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
        earlySwap: document.getElementById('earlySwapToggle')?.checked ?? false,
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

// ─── STANDARD PERMIT ARTIFACT SWAP ────────────────────────────────────────
// A standard permit player only has two artifact slots, so they run deflector/SIAB up
// to their boost and then swap to their IHR pair (chalice, monocle, ...) for the hab
// fill. The sandbox has one IHR set per player and can't represent that swap directly,
// so instead of adding a third artifact set we credit the pre-boost set after the fact.
//
// This is exact as long as an IHR artifact is worth nothing pre-boost: neither the
// deflector nor the SIAB has an elrmult/srmult, so they reach CS only through
// updateBTV. Crediting BTV therefore leaves eggs delivered, contribution ratio and
// completion time untouched. Two approximations remain:
//   1. The chalice/monocle given up for that window is not debited.
//   2. A credited deflector raises only this player's own BTV. It does not feed
//      `otherDefl` (the coop-wide lay rate bonus) or the deflector-drop figures, since
//      those are computed from equipped artifacts before the sim runs.
//
// Trigger: at most two artifacts in BOTH sets, and at least one of deflector/SIAB not
// already equipped in the IHR set. Whatever IS equipped there is simulated directly for
// the whole run and is never credited again. See getStandardPermitCredit().
// ───────────────────────────────────────────────────────────────────
const SP_MAX_ARTIFACTS = 2;          // standard permit slot limit

// Best available deflector/SIAB, read from the tables so they track any future edits.
// The pre-boost set is assumed to be the player's best of each.
//
// Under cxp (new2p0) updateBTV caps both terms — min(deflectorPercent, 12) and
// min(siabPercent, 50) — and every deflector from T3C up and every SIAB from T3C up
// already exceeds its cap, so the exact values below don't matter there. They only
// matter on the legacy BTV branch, which is uncapped and scales linearly with both.
const SP_ASSUMED_DEFL_PERCENT = Math.max(...itemsIHRDefl.map(a => a.deflectorPercent));
const SP_ASSUMED_SIAB_PERCENT = Math.max(...itemsIHRSIAB.map(a => a.siabPercent));

// Counts artifacts actually equipped (non-Empty) in the boosted set and the IHR set.
function getSlotUsage(playerIndex) {
    let boosted = 0, ihr = 0;
    for (let j = 1; j <= 4; j++) {
        const el = document.getElementById(`player${playerIndex}_item${j}`);
        if (el && el.value && el.value !== EMPTY_ITEM) boosted++;
    }
    for (let j = 5; j <= 8; j++) {
        const el = document.getElementById(`player${playerIndex}_item${j}`);
        if (el && el.value && el.value !== EMPTY_ITEM) ihr++;
    }
    return { boosted, ihr };
}

// Returns { defl, siab } — the artifact percentages to credit for this player's assumed
// pre-boost set — or null if they aren't a standard permit player, or already have both
// equipped in their IHR set.
function getStandardPermitCredit(playerIndex) {
    const { boosted, ihr } = getSlotUsage(playerIndex);
    // Both sets have to look like a standard permit loadout.
    if (boosted === 0 || ihr === 0) return null;
    if (boosted > SP_MAX_ARTIFACTS || ihr > SP_MAX_ARTIFACTS) return null;

    // Credit only what is missing. Anything equipped in the IHR set is the same physical
    // artifact the player wore pre-boost, is already simulated for the whole run, and
    // would be double counted if credited here — including a weak one, since a standard
    // permit player has no better copy to swap in.
    const defl = getDeflectorPerc(playerIndex) > 0 ? 0 : SP_ASSUMED_DEFL_PERCENT;
    const siab = getSIABPerc(playerIndex) > 0 ? 0 : SP_ASSUMED_SIAB_PERCENT;

    // Already running defl/SIAB through the fill — nothing to credit, nothing to flag.
    if (defl === 0 && siab === 0) return null;

    return { defl, siab };
}

// Adds the assumed pre-boost set's BTV for every flagged player. Must run after the
// simulation has finished accumulating BTV and before getCSMaxMean() turns it into
// teamwork/CS.
function applyStandardPermitCredit(players, simConfig, coopResult) {
    const { duration, new2p0 } = simConfig;
    const endTime = coopResult.completionTime > 0
        ? Math.min(coopResult.completionTime, duration)
        : duration;

    players.forEach(player => {
        player.stats.spSwapBTV = 0;
        player.stats.spSwapWindow = 0;
        if (!player.flags.spSwap) return;

        // The pre-boost set comes off when the player boosts. timeToBoost is left at
        // `duration` for anyone who never boosts — they never swap, so the credit runs
        // to completion instead.
        const window = Math.min(player.stats.timeToBoost, endTime);
        if (!(window > 0)) return;

        // Reuse updateBTV rather than reimplementing it, so the credit always matches
        // whichever BTV formula is active. Both branches are separable in deflector and
        // SIAB, so feeding only the missing percentages yields exactly the missing BTV;
        // anything already equipped is passed as 0 and contributes nothing here.
        const savedSiab = player.stats.siabPercent;
        const savedDefl = player.stats.deflectorPercent;
        const savedBtv = player.stats.btv;

        player.stats.deflectorPercent = player.stats.spCreditDefl;
        player.stats.siabPercent = player.stats.spCreditSiab;
        player.stats.btv = 0;
        player.updateBTV(window, new2p0);
        const credit = player.stats.btv;

        player.stats.siabPercent = savedSiab;
        player.stats.deflectorPercent = savedDefl;
        player.stats.btv = savedBtv + credit;
        player.stats.spSwapBTV = credit;
        player.stats.spSwapWindow = window;
        // getTeamwork() clamps btvRat at 2, so the teamwork cap still applies normally.
    });
}

function buildPlayersFromUI(simConfig) {
    const players = [];
    let totDeflector = 0;

    for (let i = 0; i < simConfig.numPlayers; i++) {
        const defl = getDeflectorPerc(i);
        totDeflector += defl;
        const spCredit = getStandardPermitCredit(i);

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
                spCreditDefl: spCredit ? spCredit.defl : 0,
                spCreditSiab: spCredit ? spCredit.siab : 0,
                timeToBoost: simConfig.duration,
                TE: document.getElementById(`playerTE${i}`).value
            },
            rates: {
                ihr: calcIHR(i),
                ihrLaySet: calcIHRLaySet(i),
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
                collegg: document.getElementById(`Shipping-colleggtible${i}`).checked,
                spSwap: spCredit !== null
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
    // ===== GATOREGG-NOTICE-TEMP: START (added 2026-07-30, remove after ~2026-08-13) =====
    // One-time migration nudge: the Colleggtibles checkbox already bundles both lay-rate
    // colleggtibles (Silicon + Gatoregg). Warn users who may still be manually simulating
    // that +5% via the Modifier field. Auto-hides after 5s so it doesn't linger.
    (function () {
        const gatoreggNotice = document.getElementById('gatoreggNotice');
        if (!gatoreggNotice) return;
        const modIdx = document.getElementById('mod-name').selectedIndex; // 3 = "LayRate"
        const modVal = parseFloat(document.getElementById('modifiers').value);
        const shouldShow = (modIdx === 3 && Math.abs(modVal - 1.05) < 0.0001);
        if (shouldShow) {
            if (gatoreggNotice.hidden) {
                gatoreggNotice.hidden = false;
            }
            clearTimeout(window.__gatoreggNoticeTimer);
            window.__gatoreggNoticeTimer = setTimeout(() => {
                gatoreggNotice.hidden = true;
            }, 9000);
        } else {
            gatoreggNotice.hidden = true;
            clearTimeout(window.__gatoreggNoticeTimer);
        }
    })();
    // ===== GATOREGG-NOTICE-TEMP: END =====

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

    // Early swap: work out how many chickens each player's lay-rate set needs
    if (simConfig.earlySwap) {
        players.forEach(player => player.updateSwapTarget());
    }

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
    // Standard permit players: add the assumed pre-boost set's BTV before teamwork/CS.
    applyStandardPermitCredit(players, simConfig, coopResult);

    [coopResult.meanCS, coopResult.maxCS, coopResult.minCS] = getCSMaxMean(players, simConfig, coopResult);


    // Skipped during token optimization: thousands of history.replaceState calls
    // get throttled/throw on mobile browsers and slow everything else down.
    if (!simConfig.skipUrlUpdate) {
        const [data, data2, repeatedPrefix] = gatherDOMData();
        const base64Data = dataToBase64(data, data2);

        let version = curentURLEncodeVer;

        // If compressed names, replace the middle '-' with '_'
        if (repeatedPrefix) {
            version = curentURLEncodeVer.replace('-', '_'); // 'v_4'
        }
        updateUrlWithBase64(version + base64Data);
    }

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

    const earlySwap = !!simConfig.earlySwap;

    // allMaxHabs now means "everyone settled": habs full, or (early swap) on the
    // lay-rate set and shipping-capped. With early swap off the two are identical.
    while (eggsDelivered < targetEggAmount && t_elapsed < simTime && !allMaxHabs) {
        let totNotMaxHabs = 0;
        coopResult.totalDeflector = 0;
        updateOtherDefl = false;
        players.forEach((player, index) => {
            if (!player.isSettled() && (!crtFlag || player.flags.isCreator)) {
                const prevChickens = player.stats.chickens;
                player.updateChickens();
                if (earlySwap) player.capAtSwapTarget(prevChickens);
                totNotMaxHabs++;

                if (player.flags.swapped) {
                    // Already on the lay-rate set but not yet shipping-capped
                    // (e.g. coop deflector dropped): keep hatching at the bare IHR.
                    player.applyRates(player.calcLaySetRates(player.stats.chickens));
                } else {
                    player.updateDeliveryRate();
                    const hitSwapTarget = earlySwap
                        && player.stats.chickens >= player.stats.chickensNeeded;
                    if (player.flags.maxHab || hitSwapTarget) {
                        // Habs full, or enough chickens to cap shipping: swap artis
                        player.swapToLaySet(t_elapsed, duration);
                        // Trigger a deflector change to update all rates
                        updateOtherDefl = true;
                    }
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
            // Coop deflector changed, so everyone's chicken target moves too
            if (earlySwap) {
                players.forEach(player => player.updateSwapTarget());
            }
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
                if (nextPlayer.isSettled()) {
                    // Already at max habs (or shipping-capped) — skip without spending tokens
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
            },
            // Early-swapped players below habsize: rates they could reach at full habs
            // with this set (used for the unused deflector estimate)
            ratesAtMaxHab: rateAtMaxHab(player)
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
    return document.getElementById(`Shipping-colleggtible${playerIndex}`).checked ? 1.1025 : 1;
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

    syncReferenceCS(players);

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
        // Standard permit swap: highlight the row so the BTV bump is never unexplained.
        const isSP = !!player.flags?.spSwap;
        rows[i].style.backgroundColor = isSP ? 'rgba(245, 158, 11, 0.10)' : '';

        cells[cnt].innerHTML = player.name;
        if (isSP) {
            const spCredited = [
                player.stats.spCreditDefl > 0 ? 'deflector' : null,
                player.stats.spCreditSiab > 0 ? 'SIAB' : null
            ].filter(Boolean).join(' + ');
            const spTip = `Standard permit: assumed deflector/SIAB until boost `
                + `(${secondsToString(player.stats.spSwapWindow)}), then swapped to the IHR pair shown. `
                + `Credited pre-boost teamwork for: ${spCredited}.`;
            cells[cnt].innerHTML += ` <span title="${spTip}" style="font-size:10px; padding:0 4px;`
                + ` border:1px solid var(--amber, #f59e0b); border-radius:3px;`
                + ` color:var(--amber, #f59e0b); white-space:nowrap; cursor:help;">SP ⇄</span>`;
        }
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
            cells[cnt++].innerHTML = `${commafy(before.stats.chickens)}<br>${commafy(base.stats.chickens)}`
                + earlySwapHabNote(base);
        } else {
            base = siabActive ? player.beforeSwap : player;
            // ELR
            cells[cnt++].innerHTML = formatRateCell(base.rates.layRate, base.rates.shipRate, base.stats.numTach, tachImage);
            // SR
            cells[cnt++].innerHTML = formatRateCell(base.rates.shipRate, base.rates.layRate, base.stats.numQuant, quantImage);
            // Chickens
            cells[cnt++].innerHTML = commafy(base.stats.chickens) + earlySwapHabNote(player);
        }

        // Contribution ratio
        cells[cnt++].textContent = (Math.round(player.stats.contributionRatio * 1e3) / 1e3).toString();
        // Time to boost
        //cells[cnt++].textContent = player.stats.timeToBoost == duration ? "N/A" : secondsToString(player.stats.timeToBoost);
        cells[cnt++].innerHTML = (player.stats.timeToBoost == duration ? "N/A" : secondsToString(player.stats.timeToBoost))
            + "<br>" + secondsToString(player.stats.boostingTime);
        // BTV
        cells[cnt].textContent = (Math.round(player.stats.btvRat * 1e3) / 1e3).toString();
        if (isSP && player.stats.spSwapBTV > 0 && completionTime > 0) {
            const spBtvRat = player.stats.spSwapBTV / completionTime;
            const spParts = [
                player.stats.spCreditDefl > 0 ? 'deflector' : null,
                player.stats.spCreditSiab > 0 ? 'SIAB' : null
            ].filter(Boolean).join(' + ');
            cells[cnt].title = `Includes +${(Math.round(spBtvRat * 1e3) / 1e3)} from the assumed `
                + `pre-boost ${spParts} (${secondsToString(player.stats.spSwapWindow)}).`;
        } else {
            cells[cnt].removeAttribute('title');
        }
        cnt++;
        // Teamwork
        cells[cnt++].textContent = (Math.round(player.stats.tw * 1e6) / 1e6).toString();

        // CS / Final points
        const cs = player.stats.cs;
        const finalPointsCell = cells[cnt];
        const finalValue = cs;

        // Reference column check
        const referenceCell = rows[i].querySelector(".reference-col");
        const referenceValue = getReferenceValue(referenceCell);
        if (referenceValue !== null) {
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

    updateSPSwapNote(players);

    return [meanCS, maxCS, minCS];
}

// Population cell note for players who swapped to the lay-rate set before habs were full.
function earlySwapHabNote(player) {
    const { chickens, maxChickens } = player.stats;
    if (!player.flags?.swapped || !maxChickens || chickens >= maxChickens * (1 - 1e-9)) return '';
    const pct = Math.round(chickens / maxChickens * 1000) / 10;
    const tip = `Swapped to the lay-rate set at ${secondsToString(player.stats.swapTime)}, `
        + `once shipping was capped. Habs ${pct}% full.`;
    return `<br><span title="${tip}" style="font-size:10px; color:var(--text-muted); cursor:help; white-space:nowrap;">${pct}% habs</span>`;
}

// Footnote under the results table, shown only while at least one player is flagged as
// a standard permit swap. Created on demand so index.html needs no new markup.
function updateSPSwapNote(players) {
    const table = document.getElementById('playersTable');
    if (!table) return;

    let note = document.getElementById('spSwapNote');
    const spNames = players.filter(p => p.flags?.spSwap).map(p => p.name);

    if (!spNames.length) {
        if (note) note.remove();
        return;
    }

    if (!note) {
        note = document.createElement('div');
        note.id = 'spSwapNote';
        note.style.cssText = 'margin: 8px 0 4px; padding: 6px 10px; font-size: 12px;'
            + ' line-height: 1.5; border-left: 3px solid var(--amber, #f59e0b);'
            + ' background: rgba(245, 158, 11, 0.08); color: var(--text-secondary, #ccc);';
        table.parentNode.insertBefore(note, table.nextSibling);
    }

    const withDefl = players.filter(p => p.flags?.spSwap && p.stats.spCreditDefl > 0).length;
    const withSiab = players.filter(p => p.flags?.spSwap && p.stats.spCreditSiab > 0).length;
    const credited = [
        withDefl ? 'deflector' : null,
        withSiab ? 'SIAB' : null
    ].filter(Boolean).join(' and ');

    note.innerHTML = `<b>SP ⇄ — standard permit swap assumed</b> for: ${spNames.join(', ')}.`
        + ` These players have two artifacts or fewer in both sets, so they are assumed to run`
        + ` <b>deflector/SIAB from coop start until they boost</b>, then swap to the IHR pair shown.`
        + ` Pre-boost teamwork is credited for whichever of those two is <i>not</i> already in their`
        + ` IHR set (here: <b>${credited}</b>); anything that is equipped there is simulated directly`
        + ` for the whole run and is not credited twice. Only BTV changes — lay rate, ship rate,`
        + ` chickens and contribution are unaffected, since neither artifact has a rate bonus.`
        + ` A credited deflector raises only that player's own BTV, not the coop-wide lay rate bonus`
        + ` or the deflector-drop figures. The chalice/monocle given up for that window is not`
        + ` deducted, which overstates CS very slightly. Equip a deflector and SIAB in the IHR set`
        + ` to model them running past boost instead, and this credit turns off.`;
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

    syncReferenceCS(players);

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
        const referenceValue = getReferenceValue(referenceCell);

        if (referenceValue !== null) {
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

    syncReferenceCS(players);

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
        const referenceValue = getReferenceValue(referenceCell);

        if (referenceValue !== null) {
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
// Rates used for the unused deflector estimate. A player who swapped early stops at
// lay rate = shipping, which would always read as 0% unused; what matters is the lay
// rate they could reach at full habs. Everyone else: their actual rates.
function rateAtMaxHab(player) {
    if (player.flags?.swapped && player.stats.chickens < player.stats.maxChickens) {
        return player.calcLaySetRates(player.stats.maxChickens);
    }
    return player.rates;
}

function getDeflectorDropPerc(players, totDeflector, siabCoop) {
    // Check if solo
    if (players.length < 2) return [totDeflector, totDeflector];


    val1 = 0;
    // Find player with lowest elr/sr ratio, and save their deflector multiplier
    elrDivSrMin = Infinity;
    def = (totDeflector - players[0].stats.deflectorPercent) / 100 + 1;
    players.forEach((player, index) => {
        const r = rateAtMaxHab(player);
        currentPlayer = r.layRate / r.shipRate;
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
            const rb = player.beforeSwap.ratesAtMaxHab || player.beforeSwap.rates;
            currentPlayer = rb.layRate / rb.shipRate;
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
    if (document.getElementById('cxpToggle').checked) {
        cs *= 1.05; // Kev Fudge Factor
    }
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

// IHR after the IHR set is swapped out: no chalice/monocle/life stones,
// but modifier, colleggtible and TE still apply.
function calcIHRLaySet(playerIndex) {
    let ihrLay = 7440;
    if (document.getElementById('mod-name').value === 'IHR') {
        ihrLay *= document.getElementById('modifiers').value;
    }
    ihrLay *= document.getElementById(`Shipping-colleggtible${playerIndex}`).checked ? 1.05 : 1;
    ihrLay *= Math.pow(1.01, document.getElementById(`playerTE${playerIndex}`).value);
    return Math.floor(ihrLay);
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
        const atMaxHab = player.stats.maxChickens === player.stats.chickens;
        // Early-swapped player below habsize: tops up to the new set's target (below)
        const topUp = !atMaxHab && player.flags.swapped;
        if (atMaxHab || player.flags.swapped) {
            for (let i = 0; i <= 3; i++) {
                // Remove SIAB
                if (player.artifacts[i].siabPercent > 0) {
                    player.artifacts[i] = itemLists[i + 1][0];
                    // Gusset replaced, Max chickens instantly
                    if (i == 3) {
                        // *= x.chickmult;
                        if (atMaxHab) {
                            player.stats.chickens *= player.artifacts[i].chickmult;
                            elr *= player.artifacts[i].chickmult;
                        }
                        player.stats.maxChickens *= player.artifacts[i].chickmult;
                    }
                }
                elr *= player.artifacts[i].elrmult;
                sr *= player.artifacts[i].srmult;
                totSlotsAvailable += player.artifacts[i].slots;
            }
        }

        elr *= (1 + (totDeflector - player.stats.deflectorPercent) / 100);
        [elr, sr, numTach, numQuant] = optimizeStones(elr, sr, totSlotsAvailable);

        if (topUp) {
            // Same "chickens appear instantly" assumption as the gusset case above:
            // hatch up to what the new set needs to stay shipping-capped.
            player.stats.otherDefl = totDeflector - player.stats.deflectorPercent;
            player.updateSwapTarget();
            player.stats.chickens = Math.max(player.stats.chickens, player.stats.chickensNeeded);
            ({ layRate: elr, shipRate: sr, numTach, numQuant } = player.calcLaySetRates(player.stats.chickens));
        }

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
    const useLaySet = players[playerIndex].flags.swapped || players[playerIndex].stats.maxChickens === chickens;
    if (useLaySet) {
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
    if (useLaySet) {
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

            // The link buttons were injected before these values were applied,
            // so their state has to be recomputed from what actually loaded.
            refreshLinkStateFromSelections(i);

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
    if (element.value[2] === 'C' || element.value[2] === 'S' || element.value[2] === 'p') {
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

// Returns the slot the SIAB link applies to. Normally that is whichever boosted
// slot currently holds a SIAB, but if that slot has been set to 'Empty' we fall
// back to the remembered slot so the pair stays linked across an Empty selection.
function getLinkedSIABSlot(playerIndex) {
    const live = getBoostedSIABSlot(playerIndex);
    if (live) {
        siabSlotMemo[playerIndex] = live;
        return live;
    }
    const memo = siabSlotMemo[playerIndex];
    if (memo) {
        const el = document.getElementById(`player${playerIndex}_item${memo}`);
        if (el && el.value === EMPTY_ITEM) return memo;
        delete siabSlotMemo[playerIndex];
    }
    return null;
}

function syncSIAB(playerIndex, source) {
    if (!siabLinked[playerIndex]) return;
    const siabSlot = getLinkedSIABSlot(playerIndex);
    const ihr = document.getElementById(`player${playerIndex}_item6`);
    if (!ihr || !siabSlot) return;
    const boosted = document.getElementById(`player${playerIndex}_item${siabSlot}`);
    if (!boosted) return;

    const from = source === 'boosted' ? boosted : ihr;
    const to = source === 'boosted' ? ihr : boosted;

    // 'Empty' propagates as 'Empty'; anything else matches on grade (T4L → T4L SIAB).
    const match = from.value === EMPTY_ITEM
        ? Array.from(to.options).findIndex(o => o.value === EMPTY_ITEM)
        : Array.from(to.options).findIndex(o => o.value.startsWith(from.value.split(' ')[0]) && o.value.includes('SIAB'));

    // No counterpart in the other list (e.g. a T3C SIAB, or '2 Slot') — leave it alone
    // rather than dragging the other slot to an unrelated entry.
    if (match < 0) return;
    to.selectedIndex = match;
    setColor(to);
    if (source === 'ihr') updateSIABLinkVisibility(playerIndex);
}

function updateSIABLinkVisibility(playerIndex) {
    const siabSlot = getLinkedSIABSlot(playerIndex);
    // Hide all SIAB link button wrappers for this player first
    for (let j = 2; j <= 4; j++) {
        const wrap = document.getElementById(`siabLinkWrap${playerIndex}_${j}`);
        if (wrap) wrap.style.display = 'none';
    }
    if (siabSlot) {
        const wrap = document.getElementById(`siabLinkWrap${playerIndex}_${siabSlot}`);
        if (wrap) wrap.style.display = '';
    }
    // If no SIAB selected (and none remembered), disable syncing
    if (!siabSlot) siabLinked[playerIndex] = false;
}

// Handles a change to one of the boosted slots (items 2-4): keeps the SIAB link
// state, the link button and the IHR SIAB slot in step with the new selection.
function handleBoostedSlotChange(playerIndex, slot, el) {
    const isSIAB = el.value.includes('SIAB');
    const isEmpty = el.value === EMPTY_ITEM;

    if (isSIAB) {
        siabSlotMemo[playerIndex] = slot;
    } else if (!isEmpty && siabSlotMemo[playerIndex] === slot) {
        // The SIAB slot was given some other artifact — the link no longer applies.
        delete siabSlotMemo[playerIndex];
    }

    // Clearing the SIAB slot to 'Empty' must not silently drop the link: push the
    // Empty through to the IHR SIAB slot and keep the pair linked, so selecting a
    // SIAB again later re-syncs both sides.
    const clearingLinkedSlot = siabLinked[playerIndex] && isEmpty && siabSlotMemo[playerIndex] === slot;

    updateSIABLinkVisibility(playerIndex);

    if (clearingLinkedSlot) {
        siabLinked[playerIndex] = true;
        syncSIAB(playerIndex, 'boosted');
        return;
    }

    if (!isSIAB) return;

    // Only re-enable link if it hasn't been explicitly unlinked by the user.
    // siabLinked is false either because: (a) user clicked unlink, or
    // (b) no SIAB was previously selected (cleared by updateSIABLinkVisibility).
    // We distinguish by checking if a siabLink button exists and shows 🔓.
    const anyBtn = document.getElementById(`siabLink${playerIndex}_2`) ||
        document.getElementById(`siabLink${playerIndex}_3`) ||
        document.getElementById(`siabLink${playerIndex}_4`);
    const userUnlinked = anyBtn && anyBtn.textContent === '🔓';
    if (userUnlinked) return;

    siabLinked[playerIndex] = true;
    for (let k = 2; k <= 4; k++) {
        const b = document.getElementById(`siabLink${playerIndex}_${k}`);
        if (b) {
            b.textContent = '🔗';
            b.title = 'SIAB slots linked — click to unlink';
            b.style.color = 'var(--amber, #f59e0b)';
            b.style.background = 'rgba(0,0,0,0.35)';
        }
    }
    syncSIAB(playerIndex, 'boosted');
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

    // Match by option name, NOT selectedIndex: the two deflector lists are not
    // index-aligned. itemsIHRDefl carries an extra '2 Slot' entry, so from '3 Slot'
    // onward the indices are off by one ('Empty' is 9 in one list and 10 in the other).
    const from = source === 1 ? defl1 : defl5;
    const to = source === 1 ? defl5 : defl1;

    const match = Array.from(to.options).findIndex(o => o.value === from.value);
    // '2 Slot' has no counterpart in the boosted list — leave the other slot as it is
    // instead of blanking it out or landing on an unrelated entry.
    if (match < 0) return;
    to.selectedIndex = match;
    setColor(to);
}

// Paints the defl link button for a given state.
function setDeflLinkButtonState(playerIndex, linked) {
    const btn = document.getElementById(`deflLink${playerIndex}`);
    if (!btn) return;
    btn.textContent = linked ? '🔗' : '🔓';
    btn.title = linked ? 'Defl. slots linked — click to unlink' : 'Defl. slots unlinked — click to link';
    btn.style.color = linked ? 'var(--amber, #f59e0b)' : 'var(--text-muted, #888)';
}

// Paints all of a player's SIAB link buttons for a given state.
function setSIABLinkButtonState(playerIndex, linked) {
    for (let k = 2; k <= 4; k++) {
        const b = document.getElementById(`siabLink${playerIndex}_${k}`);
        if (!b) continue;
        b.textContent = linked ? '🔗' : '🔓';
        b.title = linked ? 'SIAB slots linked — click to unlink' : 'SIAB slots unlinked — click to link';
        b.style.color = linked ? 'var(--amber, #f59e0b)' : 'var(--text-muted, #888)';
        b.style.background = 'rgba(0,0,0,0.35)';
    }
}

// Recomputes link state from what is actually selected. Needed after a URL load:
// the link buttons are injected by generatePlayers() while the selects still hold
// defaults, so without this a saved link comes back with stale link state. A saved
// URL may hold deliberately mismatched slots (a '2 Slot' IHR defl next to a T4L
// boosted defl, say), and those must not be silently re-linked and then clobbered
// the first time the user touches a dropdown.
function refreshLinkStateFromSelections(playerIndex) {
    const defl1 = document.getElementById(`player${playerIndex}_item1`);
    const defl5 = document.getElementById(`player${playerIndex}_item5`);
    if (defl1 && defl5) {
        deflLinked[playerIndex] = defl1.value === defl5.value;
        setDeflLinkButtonState(playerIndex, deflLinked[playerIndex]);
    }

    const siabSlot = getBoostedSIABSlot(playerIndex);
    const ihr = document.getElementById(`player${playerIndex}_item6`);
    const boosted = siabSlot ? document.getElementById(`player${playerIndex}_item${siabSlot}`) : null;
    if (boosted && ihr) {
        siabSlotMemo[playerIndex] = siabSlot;
        // Linked only if both sides already agree on grade (e.g. T4E / T4E).
        siabLinked[playerIndex] = boosted.value.split(' ')[0] === ihr.value.split(' ')[0];
    } else {
        delete siabSlotMemo[playerIndex];
        siabLinked[playerIndex] = false;
    }
    setSIABLinkButtonState(playerIndex, siabLinked[playerIndex]);
    updateSIABLinkVisibility(playerIndex);
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
    document.getElementById('earlySwapToggle').onchange = () => Run();
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
                    // Any boosted slot change may affect SIAB link state/visibility
                    if (j >= 2 && j <= 4) handleBoostedSlotChange(i, j, this);
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

function QSetTERun() {
    const te = document.getElementById("QSetTEInput").value;
    if (te === '') return;
    for (let i = 0; i < numPlayers; i++) {
        const teEl = document.getElementById(`playerTE${i}`);
        if (teEl) teEl.value = te;
    }
    Run();
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
function showOptimizerError(e) {
    document.getElementById('scenarioHtmlOutput').innerHTML = `<pre>Error: ${e.message}\n${e.stack}</pre>`;
    document.getElementById('scenarioOutputContainer').classList.remove('hidden');
}
document.getElementById("runTokenScenariosBtn").addEventListener("click", () => optimizeWithOuterFirstPlayer(0).catch(showOptimizerError));
document.getElementById("runTokenScenariosMeanBtn").addEventListener("click", () => optimizeWithOuterFirstPlayer(1).catch(showOptimizerError));

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
    // Run() already wrote the URL; the scenario sims below don't need to
    simConfig.skipUrlUpdate = true;
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
    // Establish the pure T4L-legendary baseline (no 3-slot swaps) for comparison
    const baselinePlayers = basePlayers.map((p, i) => {
        const clone = clonePlayer(p);
        return clone;
    });
    scenarios[0].apply(baselinePlayers, false, false);
    const baseline = RunSimulation(baselinePlayers, simConfig);

    const playersLeg = basePlayers.map((p, i) => {
        const clone = clonePlayer(p);
        return clone;
    });
    scenarios[0].apply(playersLeg, false, false);

    // Edge case checks: does swapping the deflector or compass slot for a
    // "3 Slot" item (across all players) beat the all-legendary baseline?
    const deflBetter = test3SlotReplacement(basePlayers, simConfig, baseline, 0, 1, "Deflector") !== null;
    const compBetter = test3SlotReplacement(basePlayers, simConfig, baseline, 2, 3, "Compass") !== null;

    // CheckSIAB - players without SIAB use 3 Slot in the deflector/compass slot
    // instead of legendary, if that was shown to beat the baseline above.
    const siabTest = testSinglePlayerSIAB(playersLeg, simConfig, baseline, deflBetter, compBetter);

    // Deflector drop check (legendary and 1-SIAB cases only, to keep output short):
    // with more unused deflector than one whole deflector, some players can swap
    // theirs for a 3 Slot. Skipped when everyone already runs a 3 Slot there.
    // (The legendary case is checked in the scenario loop below.)
    if (siabTest && !deflBetter) {
        siabTest.result.dropVariant = testDeflectorDrop(basePlayers, simConfig, compBetter, siabTest.slot);
    }


    if (siabTest) {


        if (basePlayers.length > 3) {
            const halfResult = runHalfSIAB(basePlayers, simConfig, siabTest.slot, deflBetter, compBetter);
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


    // Run all baseline/legendary-tier scenarios, applying the 3-slot edge case
    // swaps (and updated names) wherever they were shown to beat the baseline.
    scenarios.forEach((scenario, scenarioIndex) => {
        const players = basePlayers.map((p, i) => {
            const clone = clonePlayer(p);
            return clone;
        });
        scenario.apply(players, deflBetter, compBetter);
        const res = RunSimulation(players, simConfig);
        if (scenarioIndex === 0 && !deflBetter) {
            res.dropVariant = testDeflectorDrop(basePlayers, simConfig, compBetter, null);
        }
        results.push({
            name: scenario.getName ? scenario.getName(deflBetter, compBetter) : scenario.name,
            ...res
        });
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

function get3SlotItem(listIndex) {
    return itemLists[listIndex].find(item => item.name === '3 Slot');
}

// Sets every player's artifacts to the T4L legendary baseline, except that the
// deflector and/or compass slots use "3 Slot" instead when that has been shown
// to beat the baseline (deflBetter / compBetter).
function setDefaultArtifacts(players, deflBetter, compBetter) {
    players.forEach(player => {
        player.artifacts[0] = deflBetter ? get3SlotItem(1) : itemLists[1][0];
        player.artifacts[1] = itemLists[2][0];
        player.artifacts[2] = compBetter ? get3SlotItem(3) : itemLists[3][0];
        player.artifacts[3] = itemLists[4][0];
    });
}

// Edge case check: replace a single artifact slot with "3 Slot" for every player
// (leaving the rest of the set at T4L legendary) and see if it beats the baseline.
function test3SlotReplacement(basePlayers, simConfig, baseResult, slotIndex, listIndex, label) {
    const players = basePlayers.map(p => clonePlayer(p));
    players.forEach(player => {
        for (let n = 0; n < 4; n++) {
            player.artifacts[n] = itemLists[n + 1][0];
        }
        player.artifacts[slotIndex] = get3SlotItem(listIndex);
    });
    handleArtifactChange(players);
    const res = RunSimulation(players, simConfig);

    if (res.maxCS > baseResult.maxCS) {
        return { result: res, name: `3 Slot in place of ${label} + Leggies` };
    }
    return null;
}

function testSinglePlayerSIAB(basePlayers, simConfig, baseResult, deflBetter, compBetter) {

    let bestResult = null;
    let bestSlot = -1;

    for (let slot = 3; slot > 0; slot--) {

        // Duplicate players, and set all to legendary (3 Slot for deflector/compass
        // if that was shown to beat the baseline, since these players don't have SIAB there)
        const players = basePlayers.map((p, i) => {
            const clone = clonePlayer(p);
            return clone;
        });
        setDefaultArtifacts(players, deflBetter, compBetter);

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

        const restSwaps = [];
        if (deflBetter) restSwaps.push("Deflector");
        if (compBetter) restSwaps.push("Compass");
        if (restSwaps.length > 0) {
            resName += ", Rest 3 Slot in place of " + restSwaps.join("/");
        }

        return { result: bestResult, slot: bestSlot, name: resName };
    }

    return null;
}

function runHalfSIAB(basePlayers, simConfig, slot, deflBetter, compBetter) {

    const players = basePlayers.map(p => clonePlayer(p));
    setDefaultArtifacts(players, deflBetter, compBetter);
    const half = Math.ceil(players.length / 2);

    for (let i = 0; i < half; i++) {
        applySIAB(players[i], slot);
    }
    handleArtifactChange(players);
    return RunSimulation(players, simConfig);
}

// T4L legendaries for everyone (3 Slot compass if compBetter), optional T4L SIAB for
// player 0, and the last `k` players running a 3 Slot instead of their deflector.
function buildDeflDropPlayers(basePlayers, compBetter, siabSlot, k) {
    const players = basePlayers.map(p => clonePlayer(p));
    setDefaultArtifacts(players, false, compBetter);
    if (siabSlot !== null) applySIAB(players[0], siabSlot);
    const N = players.length;
    for (let i = N - k; i < N; i++) {
        players[i].artifacts[0] = get3SlotItem(1);
    }
    handleArtifactChange(players);
    return players;
}

// Deflector drop check. Simulates the setup above with nobody dropping, reads the
// coop's unused deflector %, and if that covers at least one whole deflector tries
// k = (whole deflectors unused) down to 1 droppers. Droppers are the last players, so
// player 0 keeps the top score. Returns the best { result, k } that beats nobody
// dropping, or null.
function testDeflectorDrop(basePlayers, simConfig, compBetter, siabSlot) {
    const N = basePlayers.length;
    if (N < 2) return null;

    const refPlayers = buildDeflDropPlayers(basePlayers, compBetter, siabSlot, 0);
    const ref = RunSimulation(refPlayers, simConfig);
    if (!ref.success) return null;

    // [before SIAB swap, after]; with SIAB, allow the larger and let the sim decide
    const [unusedBefore, unusedAfter] = getDeflectorDropPerc(refPlayers, ref.totalDeflector, ref.siabActive);
    const unused = ref.siabActive ? Math.max(unusedBefore, unusedAfter) : unusedAfter;
    const deflPercent = itemLists[1][0].deflectorPercent;
    const kMax = Math.min(Math.floor(unused / deflPercent), N - 1);

    let best = null;
    for (let k = kMax; k >= 1; k--) {
        const res = RunSimulation(buildDeflDropPlayers(basePlayers, compBetter, siabSlot, k), simConfig);
        const bar = best ? best.result.maxCS : ref.maxCS;
        if (res.success && res.maxCS > bar) best = { result: res, k };
    }
    return best;
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


    const csRange = r => `${(r.minCS / 1e3).toFixed(1)}k - ${(r.maxCS / 1e3).toFixed(1)}k`;
    const siabCount = hasSIAB ? (numPlayers > 3 ? 2 : 1) : 0;
    let siabLineCount = 0;
    const output = [];
    results.forEach((r, i) => {
        const lines = [`- ${csRange(r)} (${r.name})`];
        // Deflector drop variant: one compact line under its parent scenario
        if (r.dropVariant) {
            lines.push(`  ↳ ${csRange(r.dropVariant.result)} (${r.dropVariant.k} Defl. → 3 Slot)`);
        }
        if (i < siabCount) siabLineCount += lines.length;
        output.push(...lines);
    });

    if (hasSIAB) {
        output.splice(0, 0, "-----");                // before SIAB
        output.splice(siabLineCount + 1, 0, "-----"); // after SIAB
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

async function optimizeWithOuterFirstPlayer(meanFlag) {
    const simConfig = buildSimConfigFromUI();
    simConfig.skipUrlUpdate = true;

    if (simConfig.numPlayers > 20) {
        const textarea = document.getElementById("scenarioOutput");
        textarea.value = `Sorry, Optimization only available for size 20 or less`;
        textarea.style.display = "block";
        document.getElementById("scenarioHtmlOutput").innerHTML = "";
        document.getElementById('scenarioOutputContainer').classList.remove("hidden");
        return;
    }
    const basePlayers = buildPlayersFromUI(simConfig);
    const N = basePlayers.length;

    tokenSweepResults.length = 0;
    const seen = new Set();

    let bestCS = -Infinity;

    // Show progress UI
    const container = document.getElementById('scenarioOutputContainer');
    const htmlOut = document.getElementById('scenarioHtmlOutput');
    const textarea = document.getElementById('scenarioOutput');
    textarea.style.display = 'none';
    htmlOut.innerHTML = '<pre>Optimizing... (0 scenarios evaluated)</pre>';
    container.classList.remove('hidden');

    // Yield to browser every YIELD_EVERY evaluations to keep UI responsive.
    // Lower = more responsive but slightly more overhead from setTimeout clamping.
    const YIELD_EVERY = 5;
    let evalCount = 0;

    async function evaluate(tokens) {
        const key = tokenKey(tokens);
        if (seen.has(key)) {
            evaluate.lastImproved = false;
            return undefined; // already seen — caller should skip, not stop
        }
        seen.add(key);

        const players = basePlayers.map((p, i) => {
            const clone = clonePlayer(p);
            clone.tokens = tokens[i];
            return clone;
        });

        evalCount++;
        if (evalCount % YIELD_EVERY === 0) {
            htmlOut.innerHTML = `<pre>Optimizing... (${evalCount} scenarios evaluated)</pre>`;
            await new Promise(resolve => setTimeout(resolve, 0));
        }

        let results;
        try {
            results = RunSimulation(players, simConfig);
        } catch(e) {
            evaluate.lastImproved = false;
            return null;
        }

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
        await optimizeRestGivenFirstPlayer({
            p0,
            basePlayers,
            simConfig,
            evaluate
        });
    }

    if (tokenSweepResults.length === 0) return;

    const best = tokenSweepResults.reduce(
        (a, b) => (b.cs > a.cs ? b : a)
    );

    renderScenarioResults({ best, all: tokenSweepResults, meanFlag });
}


async function optimizeRestGivenFirstPlayer({
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

        const cs = await evaluate(tokens);
        if (cs !== null && cs !== undefined && cs > bestUniform.cs) {
            bestUniform = { cs, tokens: [...tokens] };
        }
    }

    if (!bestUniform.tokens) return;

    // --- Case B: front-loaded permutations (players 1 →)
    await frontLoadedNestedSweep({
        baseTokens: bestUniform.tokens,
        evaluate
    });

    // --- Case C: back-loaded permutations (players N-1 ←)
    await backLoadedNestedSweep({
        baseTokens: bestUniform.tokens,
        evaluate
    });

    // --- Case D: symmetric front/back loading
    await symmetricNestedSweep({
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
async function frontLoadedNestedSweep({
    baseTokens,
    evaluate,
    tokenCap = 12
}) {
    const N = baseTokens.length;
    const tokens = [...baseTokens];

    async function sweepAt(index, localBestCS) {
        if (index >= N) return localBestCS;

        while (tokens[index] < tokenCap) {
            tokens[index]++;

            const cs = await evaluate(tokens);
            if (cs === undefined) {
                // Already seen — don't roll back, just try next token value
                continue;
            }
            if (cs === null || cs <= localBestCS) {
                tokens[index]--;
                break;
            }
            localBestCS = cs;
            localBestCS = await sweepAt(index + 1, localBestCS);
        }

        return localBestCS;
    }

    await sweepAt(1);
}
async function backLoadedNestedSweep({
    baseTokens,
    evaluate,
    tokenCap = 12
}) {
    const N = baseTokens.length;
    const tokens = [...baseTokens];

    async function sweepAt(index, localBestCS) {
        if (index <= 0) return localBestCS;

        while (tokens[index] < tokenCap) {
            tokens[index]++;

            const cs = await evaluate(tokens);
            if (cs === undefined) {
                continue;
            }
            if (cs === null || cs <= localBestCS) {
                tokens[index]--;
                break;
            }

            localBestCS = cs;
            localBestCS = await sweepAt(index - 1, localBestCS);
        }

        return localBestCS;
    }

    await sweepAt(N - 1, -Infinity);
}

async function symmetricNestedSweep({
    baseTokens,
    evaluate,
    tokenCap = 12
}) {
    const N = baseTokens.length;
    const tokens = [...baseTokens];

    const maxDepth = Math.floor((N - 1) / 2);

    async function sweepAt(depth, localBestCS) {
        const left = 1 + depth;
        const right = N - 1 - depth;

        if (left >= right) return localBestCS;
        if (left <= 0 || right >= N) return localBestCS;

        while (
            tokens[left] < tokenCap &&
            tokens[right] < tokenCap
        ) {
            tokens[left]++;
            tokens[right]++;

            const cs = await evaluate(tokens);
            if (cs === undefined) {
                continue;
            }
            if (cs === null || cs <= localBestCS) {
                tokens[left]--;
                tokens[right]--;
                break;
            }

            localBestCS = cs;
            localBestCS = await sweepAt(depth + 1, localBestCS);
        }

        return localBestCS;
    }

    await sweepAt(0);
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


