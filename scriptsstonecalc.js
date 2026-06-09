// todo: <div id="virtue-all-section" style="display:none;">
// <div class="virtue-artifact-block">
// <div id="virtue-gusset-section" style="display:none;">

// Used to encode integer to base 62
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

// Define the items and relevant properties
const itemsMetro = [
    { name: 'T4L Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1.35, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1.3, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1.27, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.25, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3E Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_3.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1.2, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1.17, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.15, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2R Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_2.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1.12, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.05, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4L SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsMetro2 = [
    { name: 'T4L Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1.35, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1.3, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1.27, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.25, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3E Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_3.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1.2, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1.17, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.15, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2R Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_2.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1.12, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Metro', image: 'https://staabass.netlify.app/images/afx_quantum_metronome_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1.05, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'https://staabass.netlify.app/images/E.gif', bgGif: '', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '1 Slot', image: 'https://staabass.netlify.app/images/R.gif', bgGif: '', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];


const itemsComp = [
    { name: 'T4L Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 2, elrmult: 1, srmult: 1.5, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1.4, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1.35, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.3, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1.22, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.2, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.05, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4L SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsComp2 = [
    { name: 'T4L Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 2, elrmult: 1, srmult: 1.5, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1.4, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1.35, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.3, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1.22, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.2, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Compass', image: 'https://staabass.netlify.app/images/afx_interstellar_compass_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1.05, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'https://staabass.netlify.app/images/E.gif', bgGif: '', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '1 Slot', image: 'https://staabass.netlify.app/images/R.gif', bgGif: '', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsGusset = [
    { name: 'T4L Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.25 },
    { name: 'T4E Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.22 },
    { name: 'T2E Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_2.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.12 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.2 },
    { name: 'T3R Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.16 },
    { name: 'T3C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.15 },
    { name: 'T2C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.1 },
    { name: 'T1C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.05 },
    { name: 'T4L SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 100, chickmult: 1 },
    { name: 'T4E SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 90, chickmult: 1 },
    { name: 'T4R SIAB', image: 'https://staabass.netlify.app/images/afx_ship_in_a_bottle_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 80, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsGusset2 = [
    { name: 'T4L Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.25 },
    { name: 'T4E Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.22 },
    { name: 'T2E Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_2.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.12 },
    { name: 'T4C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.2 },
    { name: 'T3R Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.16 },
    { name: 'T3C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.15 },
    { name: 'T2C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.1 },
    { name: 'T1C Gusset', image: 'https://staabass.netlify.app/images/afx_ornate_gusset_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1.05 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'https://staabass.netlify.app/images/E.gif', bgGif: '', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '1 Slot', image: 'https://staabass.netlify.app/images/R.gif', bgGif: '', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }

];
const itemsDefl = [
    { name: 'T4L Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_4.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 20, siabPercent: 0, chickmult: 1 },
    { name: 'T4E Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_4.png', bgGif: 'https://staabass.netlify.app/images/E.gif', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 19, siabPercent: 0, chickmult: 1 },
    { name: 'T4R Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_4.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 17, siabPercent: 0, chickmult: 1 },
    { name: 'T4C Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_4.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 15, siabPercent: 0, chickmult: 1 },
    { name: 'T3R Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_3.png', bgGif: 'https://staabass.netlify.app/images/R.gif', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 13, siabPercent: 0, chickmult: 1 },
    { name: 'T3C Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_3.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 12, siabPercent: 0, chickmult: 1 },
    { name: 'T2C Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_2.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 8, siabPercent: 0, chickmult: 1 },
    { name: 'T1C Defl.', image: 'https://staabass.netlify.app/images/afx_tachyon_deflector_1.png', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 5, siabPercent: 0, chickmult: 1 },
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: 'Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];

const itemsArti1 = [
    { name: '3 Slot', image: 'https://staabass.netlify.app/images/RandomLeg.png', bgGif: 'https://staabass.netlify.app/images/L.gif', slots: 3, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '2 Slot', image: 'https://staabass.netlify.app/images/E.gif', bgGif: '', slots: 2, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '1 Slot', image: 'https://staabass.netlify.app/images/R.gif', bgGif: '', slots: 1, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 },
    { name: '0 Slot or Empty', image: 'https://staabass.netlify.app/images/C.gif', bgGif: 'https://staabass.netlify.app/images/C.gif', slots: 0, elrmult: 1, srmult: 1, ihrmult: 1, deflectorPercent: 0, siabPercent: 0, chickmult: 1 }
];


const itemLists = [itemsMetro, itemsComp, itemsGusset, itemsDefl];
const itemListsV = [itemsMetro2, itemsComp2, itemsGusset2, itemsArti1];

savedURLA = 'v-6MS0w=B8V64u7te5pFEA';
savedURLB = 'V-1MTAtMTAtOCUyQzAwMCUyQzAwMC04JTJDMDAwJTJDMDAw=B8V64u7teADGu9adu8ADGu9adu8ADGu9adu88';
interfaceCreated = false;

function loadDataFromUrl(dataOverride = null) {
    let base64Data;
    if (dataOverride) {
        base64Data = dataOverride;
    } else {
        // Get data from URL
        const params = new URLSearchParams(window.location.search);
        base64Data = params.get('data');
    }

    // Setup website interface first

    if (base64Data) {
        ver = base64Data.slice(0, 3);
        // Check version
        if (ver === 'v-1' || ver === 'v-2' || ver === 'v-3' || ver === 'v-4' || ver === 'v-5' || ver === 'v-6') {
            
            createInterface();
            // remove version from data
            splitData = base64Data.slice(3, base64Data.length);
            // split data at '='
            splitData = splitData.split('=');
            // Set v2flag. v1 did not have dark mode preference saved. Eventually v1 support will be removed
            v2flag = true;
            ELRCollegg = false;
            HabCollegg = false;
            if (ver === 'v-1') {
                v2flag = false;
                populateData(base64ToData(splitData[0]), splitData[1], v2flag); // pop data for v-1 and v-2, will likely remove in future
            } 
            if (ver === 'v-3' || ver === 'v-4')
                populateData2(splitData[0], splitData[1], v2flag, ELRCollegg, HabCollegg);
            if (ver === 'v-5') {
                ELRCollegg = true;
                populateData2(splitData[0], splitData[1], v2flag, ELRCollegg, HabCollegg); 
            }
            if (ver === 'v-6') {
                ELRCollegg = true;
                HabCollegg = true;
                populateData2(splitData[0], splitData[1], v2flag, ELRCollegg, HabCollegg); // Latest version to use
            }
                
        } else if (ver === 'V-0' || ver === 'V-1') {
            
            createInterface();
            splitData = base64Data.slice(3, base64Data.length);
            splitData = splitData.split('=');
            let val = true;
            if (ver === 'V-0')
                val = false;
            populateDataV(splitData[0], splitData[1], val);
        }
        else {
            alert('URL not recognized! Remove the ?data= and everyting after from URL and try again');
        }

    } else {
        createInterface();
        Run(true);
        //
        //farmToggleRun();
        // RunVirtue();
    }
}

// Initialize interface on startup
function createInterface() {
    if (interfaceCreated)
        return;
    const table = document.getElementById('resultsTable');
    const metro = document.getElementById('Metro');
    const compass = document.getElementById('Comp');
    const gusset = document.getElementById('Gusset');
    const defl = document.getElementById('Defl');
    const shipCollegg = document.getElementById('ShipColleggtibles');
    const shipCollegg2 = document.getElementById('ShipColleggtibles2');
    const ELRCollegg = document.getElementById('ELRColleggtibles');
    const HabCollegg = document.getElementById('HabColleggtibles');
    const mod = document.getElementById('Modifiers');
    const modMult = document.getElementById('ModifierMultiplier');
    const deflBonus = document.getElementById('DeflBonus');
    const deflSelect = document.getElementById('DeflectorSelect');

    populateDropdowns(false);
    // Update dropdown lists of artifacts
    //metro.innerHTML = `${itemsMetro.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
    //compass.innerHTML = `${itemsComp.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
    ///gusset.innerHTML = `${itemsGusset.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
    //defl.innerHTML = `${itemsDefl.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;



    // Initialize table
    const tableHeader = `<tr>
    <th> Egg Lay Rate (q/hr)</th>
    <th> Shipping Rate (q/hr)</th>
    <th> Delivery Rate (q/hr)</th>
    </tr>`;
    const tableRows = [];
    row = `<td></td><td></td><td></td>`;
    tableRows.push(row);
    table.innerHTML = tableHeader + tableRows.join('');

    //Run(false);
    // Generate button and listener for toggling stone cut-off table
    const toggleButton = document.getElementById('toggleStoneCutOff');
    toggleButton.addEventListener('click', () => {
        const table2 = document.getElementById('stoneCutOff');
        // Toggle visibility
        if (table2.style.display === 'none' || table2.style.display === '') {
            table2.style.display = 'table'; // Show the table
            toggleButton.textContent = 'Hide Stone Cut Off Table';
        } else {
            table2.style.display = 'none'; // Hide the table
            toggleButton.textContent = 'View Stone Cut Off Table';
        }
    });

    const assButton = document.getElementById('assVis');
    assButton.addEventListener('click', () => {
        const h = document.getElementById('assHead');
        const hc = document.getElementById('assContainer');
        //tmp = h.style.display;
        //h.style.display = 'none';
        if (h.style.display === 'none') {
            h.style.display = '';
            hc.style.display = '';
            assButton.textContent = 'Hide Assumptions';
        } else {
            h.style.display = 'none';
            hc.style.display = 'none';
            assButton.textContent = 'View Assumptions';
        }
        //h.style.display = '';

    });

    //farmToggleRun();

    // Add listener to any change, Run() on any change
    metro.onchange = () => Run();
    compass.onchange = () => Run();
    gusset.onchange = () => Run();
    defl.onchange = () => Run();
    shipCollegg.onchange = () => Run();
    shipCollegg2.onchange = () => Run();
    ELRCollegg.onchange = () => Run();
    HabCollegg.onchange = () => Run();
    mod.onchange = () => Run();
    modMult.onchange = () => Run();
    deflBonus.onchange = () => Run();
    deflSelect.onchange = () => Run();
    // farmToggle removed
    // ELR/SR/stone listeners removed — virtue farm no longer present
    interfaceCreated = true;
}

function populateDropdowns(farmVal) {
    document.getElementById('PopCurrentID').hidden = true;
    document.getElementById('PopCurrent').hidden = true;
    document.getElementById('PopCurrentRowID').hidden = true;
    document.getElementById('HabCapID').hidden = true;
    document.getElementById('HabCap').hidden = true;
    document.getElementById('HabCapRowID').hidden = true;
    document.getElementById('ShipColleggtibles').hidden = farmVal;
    document.getElementById('ShipColleggId').hidden = farmVal;
    document.getElementById('CFid').hidden = farmVal;
    document.getElementById('Pumpkinid').hidden = farmVal;
    document.getElementById('ShipColleggtibles2').hidden = farmVal;
    document.getElementById('ELRlabelid').hidden = farmVal;
    document.getElementById('SiliconID').hidden = farmVal;
    document.getElementById('ELRColleggtibles').hidden = farmVal;
    document.getElementById('HabColleggtibles').hidden = farmVal;
    document.getElementById('PeggID').hidden = farmVal;
    document.getElementById('Hablabelid').hidden = farmVal;
    document.getElementById('ModifiersID').hidden = farmVal;
    document.getElementById('Modifiers').hidden = farmVal;
    document.getElementById('ValuePadID').hidden = farmVal;
    document.getElementById('DeflID').hidden = farmVal;
    document.getElementById('DeflectorSelect').hidden = farmVal;
    document.getElementById('PercID').hidden = farmVal;
    // removed: BoxedID no longer in DOM
    document.getElementById('toggleStoneCutOff').hidden = farmVal;
    document.getElementById('assVis').hidden = farmVal;
    // ELR/SR rows are virtue-farm-only — always hidden in normal farms
    document.getElementById('ELRRowID').hidden = true;
    document.getElementById('SRRowID').hidden = true;


    if (farmVal) {
        document.getElementById('Arti1ID').textContent = 'Artifact 1:';
        document.getElementById('Defl').innerHTML = `${itemsArti1.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        document.getElementById('Metro').innerHTML = `${itemsMetro2.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        document.getElementById('Comp').innerHTML = `${itemsComp2.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        document.getElementById('Gusset').innerHTML = `${itemsGusset2.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        if(document.getElementById('virtue-defl')) document.getElementById('virtue-defl').innerHTML = `${itemsArti1.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        if(document.getElementById('virtue-metro')) document.getElementById('virtue-metro').innerHTML = `${itemsMetro2.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        if(document.getElementById('virtue-comp')) document.getElementById('virtue-comp').innerHTML = `${itemsComp2.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        if(document.getElementById('virtue-gusset')) document.getElementById('virtue-gusset').innerHTML = `${itemsGusset2.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
    } else {
        document.getElementById('Arti1ID').textContent = 'Deflector';
        document.getElementById('Defl').innerHTML = `${itemsDefl.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        document.getElementById('Metro').innerHTML = `${itemsMetro.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        document.getElementById('Comp').innerHTML = `${itemsComp.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
        document.getElementById('Gusset').innerHTML = `${itemsGusset.map(item => `<option value="${item.name}">${item.name}</option>`).join('')}`;
    }
}

function VirtueArtiToggle() {
    // Virtue farm removed — function kept as stub to avoid reference errors
    return;
}

function farmToggleRun() {
    // Virtue farm removed — stub to avoid reference errors
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

document.getElementById("PopCurrent").addEventListener("input", function (event) {
    // Allow only digits and commas
    this.value = this.value.replace(/[^0-9,]/g, ''); // Remove any non-numeric characters except commas

    // Ensure commas are placed correctly (thousands separator)
    let value = this.value.replace(/,/g, "");  // Remove commas for now
    if (value.length > 3) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas as thousands separator
    }
    this.value = value;
});

document.getElementById("HabCap").addEventListener("input", function (event) {
    // Allow only digits and commas
    this.value = this.value.replace(/[^0-9,]/g, ''); // Remove any non-numeric characters except commas

    // Ensure commas are placed correctly (thousands separator)
    let value = this.value.replace(/,/g, "");  // Remove commas for now
    if (value.length > 3) {
        value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas as thousands separator
    }
    this.value = value;
});

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

// Update images of selected artifacts
function updateImage() {
    // update 4 images and backgrounds
    // Order matches itemLists: [Metro=0, Comp=1, Gusset=2, Defl=3]
    itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl'];
    // Sweep through each artifact and update image
    itemsToSweep.forEach((item, index) => {
        // Get artifact name
        const name = document.getElementById(item).value;
        // Get specific artifact
        if (false)
            x = itemListsV[index].find(item => item.name === name);
        else
            x = itemLists[index].find(item => item.name === name);
        // Get image element from HTML
        const largeImg = document.getElementById(`${item}-large-img`);
        // Update background shiny image and overlay artifact
        if (x.image) {
            largeImg.src = x.image
            largeImg.style.display = 'block';
            largeImg.style.backgroundImage = `url(${x.bgGif})`;
            largeImg.style.backgroundSize = 'cover'; // Adjust to cover the entire image
        } else {
            largeImg.style.display = 'none';
        }
    });
}

// Function to get image of selected artifact - This is used for the stone-cutoff table
function getImage(name) {
    // Get arti element
    const artiName = document.getElementById(name).value;
    offset = 0; // If Metronome requested
    // If Gusset requested
    if (name == 'Gusset') {
        offset = 2;
    }
    // Get specific artifact & return image property
    x = itemLists[offset].find(item => item.name === artiName);
    return [x.image];
}

// Main function to run and calculate stones, update tables, etc. This is run on any change detected. ftvStr is boolean if first time visitor (no data in HTML)
function Run(ftvStr) {
    // Check if virtue, run separate function and exit
    if (false) {
        RunVirtue();
        return;
    }

    // Update images with selected arti's
    updateImage();
    // Get comments containers for adding edge cases & info
    const comments = document.getElementById('info2Container');
    const comments2 = document.getElementById('info3Container');
    const assComments = document.getElementById('assContainer');

    // Default to dark mode if first time visitor
    if (ftvStr) {
        document.body.classList.add('dark-mode');
        document.getElementById('modeToggle').checked = true;
    }

    // Base shipping and ELR, pre artifacts, pre stones
    [ms,allShipCollegg] = getColleggtibleShip();
    sr = 2978359222414.5 * 2400 * ms * getSRModifier();
    srRaw = sr;
    [def, defSelect, totDeflectorPercent] = getDeflectorBonus();
    [me, allELRCollegg] = getColleggtibleELR();
    [mh, allHabCollegg] = getColleggtibleHab();
    elr = 332640 * getELRModifier() * me * 11340000000 * def * mh;
    allCollegg = (allShipCollegg && allELRCollegg && allHabCollegg);

    // update sr, elr based on selected artis
    itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl'];
    // Set all parameters to 0, false, or x1. These update in the sweep through artifacts and are mainly used for edge case checks
    stoneSlots = 0;                 // # of stone slots
    T4RMetroEquipped = false;       // Boolean if T4R Metro is equipped
    MetroEquipped = false;          // Boolean if Metro is equipped at all
    compassEquipped = false;        // Boolean if Compass is equipped at all
    gussetEquipped = false;         // Boolean if Gusset is equipped at all
    EquippedMetroMultiplier = 1;    // Currently equipped Metro Multiplier
    EquippedCompassMultiplier = 1;  // Currently equipped Compass Multiplier
    metroSlots = 0;                 // Number of slots in metronome
    gussetMultiplier = 1;           // Currently equipped Gusset Multiplier
    siabsEquipped = 0;              // # of siabs equipped
    numEmpty = 0;                   // # of empty slot arti's (std. permit)
    allLeggies = true;                 // All leggies flag (other than deflector)
    // Sweep through each arti, update elr, sr, and update parameters if detected
    itemsToSweep.forEach((item, index) => {
        // Get arti object
        const name = document.getElementById(item).value;

        // Match selected arti with the items and code to get properties
        x = itemLists[index].find(item => item.name === name);
        if (index < 3 && !(name.split('')[2] === 'L')) {
            allLeggies = false;
        }

        if (name === 'Empty')
            numEmpty++; // Increase Empty count if no arti selected
        // Update various parameters based on selected artifacts
        if (name === 'T4R Metro')
            T4RMetroEquipped = true;
        if (index === 0) {
            if (name.split('')[4] === 'M') {
                MetroEquipped = true;
                EquippedMetroMultiplier = x.elrmult;
            }
            metroSlots = x.slots;
        }
        if (name.split('')[4] == 'C') {
            compassEquipped = true;
        }
        if (name.split('')[4] == 'G') {
            gussetEquipped = true;
            gussetSlots = x.slots;
        }
        if (name.split('')[4] == 'S') {
            siabsEquipped++;
        }
        EquippedCompassMultiplier *= x.srmult;
        gussetMultiplier *= x.chickmult;
        stoneSlots += x.slots;


        // Update elr, sr based on selected arti's
        elr *= x.elrmult * x.chickmult;
        sr *= x.srmult;
    });

    // Save elr, sr for no stones - used for stone cutoff table and coopmates stone calc
    elrNoStones = elr;
    srNoStones = sr;

    // Optimize stones
    numTach = 0;
    numQuant = 0;
    for (let i = 0; i < stoneSlots; i++) {
        if (elr < sr) { // elr < sr, need more tach
            elr *= 1.05;
            numTach++;
        } else { // elr >= sr, need more quant
            sr *= 1.05;
            numQuant++;
        }
    }

    // define tach and quant images
    const tachImage = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="35" height="35" alt="Tach" align="center">';
    const quantImage = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="35" height="35" alt="Tach" align="center">';
    const tachImage_sm = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="20" height="20" alt="Tach" align="center">';
    const quantImage_sm = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="20" height="20" alt="Tach" align="center">';
    const tachImage_txt = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage_txt = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="15" height="15" alt="Tach" align="center">';

    assComments.innerHTML = 'Max Common Research, Max Epic Research, Max Hyperloop, Full Habs (unless shipping limited), and enough T4 ' + tachImage_txt + '&' + quantImage_txt + ' to reach optimal rate. <br>';
    assComments.innerHTML += 'If you don\'t have enough T4 Stones available, you can use ' + '<a href=https://ei-coop-assistant.netlify.app/laying-set>Kaylier\'s website</a> that can use your EI# to lookup and optimize lower tier stones you have available';

    // Update Results table
    const table = document.getElementById('resultsTable');  // get table element
    const rows = table.getElementsByTagName('tr');          // get row element
    cells = rows[1].getElementsByTagName('td');             // get cells in 2nd row
    cells[0].innerHTML = (Math.round(elr / 1e9) / 1e6).toString() + "<br>" + numTach.toString() + " " + tachImage;  // elr & # tach
    cells[1].innerHTML = (Math.round(sr / 1e9) / 1e6).toString() + "<br>" + numQuant.toString() + " " + quantImage; // sr & # quant
    cells[2].innerHTML = (Math.round(Math.min(elr, sr) / 1e9) / 1e6).toString();                                    // delivery rate  




    comments.innerHTML = 'One (or more) of the following conditions apply:  <br>';
    // Check edge cases
    if (elr > sr * 1.27 / 1.2 && T4RMetroEquipped) {
        comments.innerHTML += 'If available, T3E Metro gives better rate over T4R.  <br>';
    }
    if (elr / sr > EquippedMetroMultiplier && metroSlots < 3)
        comments.innerHTML += 'If available, 3 slot legendary in place of ' + document.getElementById('Metro').value + ' in Metronome slot gives better rate.  <br>';

    if (sr / elr > EquippedCompassMultiplier && compassEquipped) {
        comments.innerHTML += 'If available, 3 slot legendary in place of ' + document.getElementById('Comp').value + ' in Compass slot gives better rate.  <br>';
        if (!MetroEquipped) {
            comments.innerHTML += 'If available, a metronome should give a better rate.  <br>';
        }
    }
    if (!compassEquipped && numQuant > 0)
        comments.innerHTML += 'If available, any compass should give a better rate. It is rare, but possible for this issue to be a false-positive. <br>';

    if (elr / sr > gussetMultiplier && gussetEquipped)
        comments.innerHTML += 'It may also be possible, once any other issues are resolved, to remove gusset for a 3 slot legendary <br>';

    if (sr > elr && !gussetEquipped)
        comments.innerHTML += 'It may be possible that swapping in a gusset gives higher rate. It is rare, but possible for this issue to be a false-positive. <br>';

    if (siabsEquipped > 1)
        comments.innerHTML += 'How do you plan to equip more than 1 siab? Reporting you as an editor /s. <br>';

    // If no edge cases found, overwrite the comments
    if (comments.innerHTML === 'One (or more) of the following conditions apply:  <br>') {
        comments.innerHTML = 'No edge cases found. <br>';
    }
    // Caculate the number of chickens needed to reach rate, and % of deflectors that can be removed before rate starts decreasing
    if (elr > sr) {
        [mh] = getColleggtibleHab();
        chickens = Math.ceil(11340000000 * gussetMultiplier * sr / elr * getHabModifier() * mh);
        comments2.innerHTML = 'You will need at least ' + commafy(chickens) + ' chickens to reach the above max delivery rate. '
        comments2.innerHTML += 'With Full Habs, you can lose up to ' + Math.min(Math.floor((def - 1) * 100 - (def * sr / elr - 1) * 100), Math.round((def - 1) * 100)) + '% in deflectors before your delivery rate starts decreasing. <br>';
    } else {
        comments2.innerHTML = 'You will need full habs to reach the above max delivery rate <br>';
    }
    // Update comments if it's a first time viewer
    if (ftvStr)
        comments.innerHTML = 'Welcome! The URL updates with your inputs - You can set up your arti\'s and bookmark the link after for quick access. You can also just screenshot the stone cut off table at the bottom and never visit here again until you upgrade your arti\'s. For any issues or feature requests, contact @staabmia on discord <br>';

    // Update URL with user selected data. base64Data is actually a combination of base64Data and base62Data, separated by "=" in the URL. More details inside
    const base64Data = gatherData();
    updateUrlWithBase64('v-6' + base64Data);


    // get gusset and metro images
    const selGusset_sm = '<img src="' + getImage('Gusset') + '" width="20" height="20" alt="Tach" align="center">';
    const selMetro_sm = '<img src="' + getImage('Metro') + '" width="20" height="20" alt="Tach" align="center">';
    const table2 = document.getElementById('stoneCutOff');

    // If standard permit, or 1 artifact missing, disable edge cases
    if (numEmpty > 0)
        comments.innerHTML = '';

    elrNoStones = elrNoStones / def;
    // Find cut-offs for stones
    if (stoneSlots == 0) {
        table2.innerHTML = `<tr>
        <th>No Stones Needed</th>
        </tr>`;;
    }
    else {
        table2.hidden = false;
        // find min # of quants with 0% deflector
        [ertmp, srtmp, numTach, numQuant] = optStones(elrNoStones, srNoStones, stoneSlots);
        def_min = 0;
        cnt = 0;

        // Check if display should be deflectors from coop mates, or total (incl. yours)
        idx = document.getElementById('DeflectorSelect').selectedIndex;
        if (idx == 0) {
            str = 'Deflector (From Coop Mates)';
            selfDeflPerc = 0;
            clr2 = '';
        } else {
            str = 'Deflector (Total Incl. Yours)';
            // Get your deflector percent to add to calculations
            selfDefl = document.getElementById('Defl').value;
            x = itemLists[3].find(item => item.name === selfDefl);
            selfDeflPerc = x.deflectorPercent;
            clr2 = '#b45309';
        }
        // Set background color of deflector cell to maroon if total (incl. yours) is selected. the color should help prevent errors as it has tripped me up many times
        document.getElementById('DeflectorSelect').style.backgroundColor = clr2;

        // Initialize table for stone-cutoff
        const tableHeader2 = `<tr>
        <th> ` + str + `</th>
        <th> Stones</th>
        </tr>`;
        table2.innerHTML = tableHeader2;
        const cell2 = table2.rows[0].cells[0];
        cell2.style.backgroundColor = clr2;
        // Sweep through each stone combination and find deflector percents where next stone is needed
        for (let i = numQuant; i < stoneSlots; i++) {
            def_actual = (srtmp / ertmp * Math.pow(1.05, cnt * 2 + 1) - 1) * 100;
            def_max = Math.ceil(def_actual);
            table2.innerHTML += `<tr>
            <th>` + Math.round(def_min + selfDeflPerc).toString() + '% - ' + Math.round(def_max - 1 + selfDeflPerc).toString() + '%' + `</th>
            <th>` + (stoneSlots - numQuant).toString() + tachImage_sm + '  ' + numQuant.toString() + quantImage_sm + `</th>
            </tr>`;

            def_min = def_max;
            cnt++;
            numQuant++;
        }
        // Add last row where all quants are needed, also calculate % needed to reach max
        def_maxRate = (Math.ceil(((1 + def_actual / 100) * 1.05 - 1) * 100) + selfDeflPerc).toString();
        table2.innerHTML += `<tr>
        <th>` + (def_min + selfDeflPerc).toString() + '% and higher <br> (Max Rate @ ' + def_maxRate + `%)</th>
        <th>` + (stoneSlots - numQuant).toString() + tachImage_sm + '  ' + numQuant.toString() + quantImage_sm + `</th>
        </tr>`;
        // Check when gusset and metro can be removed
        if (gussetEquipped) {
            table2.innerHTML += `<tr>
            <th>` + (Math.ceil(((1 + def_actual / 100) * gussetMultiplier * 1.05 / Math.pow(1.05, 3 - gussetSlots) - 1) * 100) + selfDeflPerc).toString() + `% and higher <br>
            (Max Rate @ ` + (Math.ceil(((1 + def_actual / 100) * gussetMultiplier * 1.05 * Math.pow(1.05, 3 - gussetSlots) - 1) * 100) + selfDeflPerc).toString() + `%)</th>
            <th>` + selGusset_sm + ` to 3 slot` + `</th>
            </tr>`;
        }
        if (MetroEquipped) {
            def_actual2 = ((1 + def_actual / 100) * EquippedMetroMultiplier * 1.05 / Math.pow(1.05, 3 - metroSlots) - 1) * 100;
            table2.innerHTML += `<tr>
            <th>` + (Math.ceil(def_actual2) + selfDeflPerc).toString() + `% and higher <br> 
            (Max Rate @ ` + (Math.ceil(((1 + def_actual / 100) * EquippedMetroMultiplier * 1.05 * Math.pow(1.05, 3 - metroSlots) - 1) * 100) + selfDeflPerc).toString() + `%)</th>
            <th>` + selMetro_sm + ` to 3 slot` + `</th>
            </tr>`;
            if (gussetEquipped) {
                table2.innerHTML += `<tr>
                <th>` + (Math.ceil(((1 + def_actual / 100) * gussetMultiplier * EquippedMetroMultiplier * 1.05 / Math.pow(1.05, (6 - gussetSlots - metroSlots)) - 1) * 100) + selfDeflPerc).toString() + `% and higher <br>
                (Max Rate @ ` + (Math.ceil(((1 + def_actual / 100) * gussetMultiplier * EquippedMetroMultiplier * 1.05 * Math.pow(1.05, 6 - gussetSlots - metroSlots) - 1) * 100) + selfDeflPerc).toString() + `%)</th>
                <th>` + selMetro_sm + '&' + selGusset_sm + ` to 3 slots` + `</th>
                </tr>`;
            }

        }

    } // end stone-cutoff table update



    // Check if Total deflector (including yours) is selected, and deflector % is less than your deflector, throw error gracefully
    if (def < 1 && document.getElementById('DeflectorSelect').selectedIndex === 1) {
        comments.innerHTML = 'Error: When \"Total (incl. yours)\" is selected for deflector bonus, the input percentage should not be less than your own deflector. Increase the input percentage, or change to \"From Coop Mates\" if you do not wish to include your deflector in the percentage.';
        // Update table
        const table = document.getElementById('resultsTable');
        const rows = table.getElementsByTagName('tr');
        cells = rows[1].getElementsByTagName('td');
        cells[0].innerHTML = ' ';
        cells[1].innerHTML = ' ';
        cells[2].innerHTML = ' ';
        //table2.hidden = true;
        return;
    }


    // Display other stone configurations for coop

    // Check if solo coop
    solo = false;

    if (def == 1 || (def-1)*100 == totDeflectorPercent)
        solo = true;
    // elrNoStones = elrNoStones / def; // Already done for stone cuttoff table
    const container = document.getElementById('coopOutput');
    const output = document.getElementById('coopLines');
    const copyBtn = document.getElementById('copyCoopBtn');

    // Reset state
    container.style.display = 'none';
    output.textContent = '';
    copyBtn.disabled = true;
    if (allLeggies && compassEquipped && !solo && allCollegg) {
        
        displayOtherCoopConfig(elrNoStones, srNoStones, totDeflectorPercent, tachImage_sm, quantImage_sm);
    }
        
} // end Run()


function displayOtherCoopConfig(elrRaw, sr, totDeflectorPercent, tachIm, quantIm) {
    let lines = [];
    lines.push('Coop Stones:');
    document.getElementById('copyCoopBtn').disabled = false;

    const scenarios = [
        { name: 'T4L Deflector', stoneSlots: 10, def: totDeflectorPercent - 20 },
        { name: 'T4E Deflector', stoneSlots: 10, def: totDeflectorPercent - 19 },
        { name: 'T4R Deflector', stoneSlots: 9, def: totDeflectorPercent - 17 },
        { name: 'T4C Deflector', stoneSlots: 8, def: totDeflectorPercent - 15 },
        { name: 'T3R Deflector', stoneSlots: 9, def: totDeflectorPercent - 13 }
    ];

    scenarios.forEach(scene => {
        const [e1, s1, numTach, numQuant] =
            optStones(elrRaw * (1 + scene.def / 100), sr, scene.stoneSlots);
        spt = '';
        spq = '';
        if (numTach < 10)
            spt = ' ';
        if (numQuant < 10)
            spq = ' ';
        lines.push(
            `${scene.name}:   ` + spt + `${numTach} ${tachIm} ` + spq + `${numQuant} ${quantIm}   ${(Math.round(Math.min(e1, s1) / 1e12) / 1e3).toFixed(3) } q/hr`
        );
    });
    
    const base64Data = gatherData([0,0,0,0,totDeflectorPercent]);
    const url = `${window.location.origin}${window.location.pathname}?data=${'v-6' + base64Data}`;
    lines.push('Assuming all colleggtibles. Based on T4L metro / compass / gusset and total coop deflector boost of ' + totDeflectorPercent + `%`);

    // ---- DISPLAY ----
    const container = document.getElementById('coopOutput');
    const output = document.getElementById('coopLines');

    container.style.display = 'block';
    output.innerHTML = lines.join('\n');

    // ---- COPY BUTTON ----
    document.getElementById('copyCoopBtn').onclick = () => {
        const copyText = lines
            .join('\n')
            .replaceAll(tachIm, ':afx_tachyon_stone_4:')
            .replaceAll(quantIm, ':afx_quantum_stone_4: ')
            .replaceAll(totDeflectorPercent + '%', '[' + totDeflectorPercent + '%](' + url + ')')
            .replaceAll('Coop','## Coop');

        navigator.clipboard.writeText(copyText);
    };
}
// jump
function populateVirtueArtifacts() {
    // Virtue farm removed — stub
}

function updateStoneSlots(artiId, stoneVal) {
    // Virtue farm removed — stub
}

function RunVirtue() {
    updateImage();
    populateVirtueArtifacts();

    // Get comments containers for adding edge cases & info
    const comments = document.getElementById('info2Container');
    const comments2 = document.getElementById('info3Container');
    const assComments = document.getElementById('assContainer');

    comments.innerHTML = 'To get your lay rate and shipping capacity, sync your game client, and check the rates reported on <a href=https://wasmegg-carpet.netlify.app/virtue-companion/>Virtue Companion</a>. Make sure to select the whether you have any arti\'s equipped and make sure the arti\'s in the current Status match with what\s sync\d in Virtue Companion when you get your rates.' + '<br>';
    comments.innerHTML += 'No edge cases currently available to search...';
    comments2.innerHTML = '';
    itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl'];


    // Set all parameters to 0, false, or x1. These update in the sweep through artifacts and are mainly used for edge case checks
    stoneSlots = 0;                 // # of stone slots
    T4RMetroEquipped = false;       // Boolean if T4R Metro is equipped
    MetroEquipped = false;          // Boolean if Metro is equipped at all
    compassEquipped = false;        // Boolean if Compass is equipped at all
    gussetEquipped = false;         // Boolean if Gusset is equipped at all
    EquippedMetroMultiplier = 1;    // Currently equipped Metro Multiplier
    EquippedCompassMultiplier = 1;  // Currently equipped Compass Multiplier
    metroSlots = 0;                 // Number of slots in metronome
    gussetMultiplier = 1;           // Currently equipped Gusset Multiplier
    siabsEquipped = 0;              // # of siabs equipped
    numEmpty = 0;                   // # of empty slot arti's (std. permit)

    let elr;
    let sr;
    [elr, sr] = getRates();

    // Sweep through each arti, update elr, sr, and update parameters if detected
    itemsToSweep.forEach((item, index) => {
        // Get arti object
        const name = document.getElementById(item).value;

        // Match selected arti with the items and code to get properties
        x = itemListsV[index].find(item => item.name === name);

        if (name === 'Empty')
            numEmpty++; // Increase Empty count if no arti selected
        // Update various parameters based on selected artifacts
        if (name === 'T4R Metro')
            T4RMetroEquipped = true;
        if (index === 0) {
            if (name.split('')[4] === 'M') {
                MetroEquipped = true;
                EquippedMetroMultiplier = x.elrmult;
            }
            metroSlots = x.slots;
        }
        if (name.split('')[4] == 'C') {
            compassEquipped = true;
        }
        if (name.split('')[4] == 'G') {
            gussetEquipped = true;
            gussetSlots = x.slots;
        }
        if (name.split('')[4] == 'S') {
            siabsEquipped++;
        }
        EquippedCompassMultiplier *= x.srmult;
        gussetMultiplier *= x.chickmult;
        stoneSlots += x.slots;


        // Update elr, sr based on selected arti's
        elr *= x.elrmult; // * x.chickmult;
        sr *= x.srmult;
    });

    // Add gusset multiplier if applicable
    elr *= gussetMultiplier;


    // Stones card removed — default all stone counts to 0
    availTach4 = 0;
    availTach3 = 0;
    availTach2 = 0;
    availQuant4 = 0;
    availQuant3 = 0;
    availQuant2 = 0;
    numTach4 = 0;
    numTach3 = 0;
    numTach2 = 0;
    numQuant4 = 0;
    numQuant3 = 0;
    numQuant2 = 0;


    for (let i = 0; i < stoneSlots; i++) {
        if (elr < sr) { // elr < sr, need more tach
            if (availTach4 > 0) {
                elr *= 1.05;
                numTach4++;
                availTach4--;
            } else if (availTach3 > 0) {
                elr *= 1.04;
                numTach3++;
                availTach3--;
            } else if (availTach2 > 0) {
                elr *= 1.02;
                numTach2++;
                availTach2--;
            }

        } else { // elr >= sr, need more quant
            if (availQuant4 > 0) {
                sr *= 1.05;
                numQuant4++;
                availQuant4--;
            } else if (availQuant3 > 0) {
                sr *= 1.04;
                numQuant3++;
                availQuant3--;
            } else if (availQuant2 > 0) {
                sr *= 1.02;
                numQuant2++;
                availQuant2--;
            }

        }
    }

    const tachImage4 = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="35" height="35" alt="Tach" align="center">';
    const quantImage4 = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="35" height="35" alt="Tach" align="center">';
    const tachImage4_sm = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="20" height="20" alt="Tach" align="center">';
    const quantImage4_sm = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="20" height="20" alt="Tach" align="center">';
    const tachImage4_txt = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_4.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage4_txt = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_4.png" width="15" height="15" alt="Tach" align="center">';
    const tachImage3 = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_3.png" width="35" height="35" alt="Tach" align="center">';
    const quantImage3 = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_3.png" width="35" height="35" alt="Tach" align="center">';
    const tachImage3_sm = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_3.png" width="20" height="20" alt="Tach" align="center">';
    const quantImage3_sm = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_3.png" width="20" height="20" alt="Tach" align="center">';
    const tachImage3_txt = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_3.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage3_txt = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_3.png" width="15" height="15" alt="Tach" align="center">';
    const tachImage2 = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_2.png" width="35" height="35" alt="Tach" align="center">';
    const quantImage2 = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_2.png" width="35" height="35" alt="Tach" align="center">';
    const tachImage2_sm = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_2.png" width="20" height="20" alt="Tach" align="center">';
    const quantImage2_sm = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_2.png" width="20" height="20" alt="Tach" align="center">';
    const tachImage2_txt = '<img src="https://staabass.netlify.app/images/afx_tachyon_stone_2.png" width="15" height="15" alt="Tach" align="center">';
    const quantImage2_txt = '<img src="https://staabass.netlify.app/images/afx_quantum_stone_2.png" width="15" height="15" alt="Tach" align="center">';

    // Update Results table
    const table = document.getElementById('resultsTable');  // get table element
    const rows = table.getElementsByTagName('tr');          // get row element
    cells = rows[1].getElementsByTagName('td');             // get cells in 2nd row
    if (elr > 1e15 || sr > 1e15) {
        cells[0].innerHTML = (Math.round(elr / 1e12) / 1e3).toString() + "<br>" + numTach4.toString() + " " + tachImage4 + ", " + numTach3.toString() + " " + tachImage3 + ", " + numTach2.toString() + " " + tachImage2;  // elr & # tach
        cells[1].innerHTML = (Math.round(sr / 1e12) / 1e3).toString() + "<br>" + numQuant4.toString() + " " + quantImage4 + ", " + numQuant3.toString() + " " + quantImage3 + ", " + numQuant2.toString() + " " + quantImage2;; // sr & # quant
        cells[2].innerHTML = (Math.round(Math.min(elr, sr) / 1e12) / 1e3).toString();
        cells2 = rows[0].getElementsByTagName('th');
        cells2[0].innerHTML = 'Egg Laying Rate (q/hr)';
        cells2[1].innerHTML = 'Shipping Rate (q/hr)';
        cells2[2].innerHTML = 'Delivery Rate (q/hr)';
    } else {
        cells[0].innerHTML = (Math.round(elr / 1e9) / 1e3).toString() + "<br>" + numTach4.toString() + " " + tachImage4 + ", " + numTach3.toString() + " " + tachImage3 + ", " + numTach2.toString() + " " + tachImage2;  // elr & # tach
        cells[1].innerHTML = (Math.round(sr / 1e9) / 1e3).toString() + "<br>" + numQuant4.toString() + " " + quantImage4 + ", " + numQuant3.toString() + " " + quantImage3 + ", " + numQuant2.toString() + " " + quantImage2;; // sr & # quant
        cells[2].innerHTML = (Math.round(Math.min(elr, sr) / 1e9) / 1e3).toString();
        cells2 = rows[0].getElementsByTagName('th');
        cells2[0].innerHTML = 'Egg Laying Rate (T/hr)';
        cells2[1].innerHTML = 'Shipping Rate (T/hr)';
        cells2[2].innerHTML = 'Delivery Rate (T/hr)';
    }
    // delivery rate

    updateUrlWithBase64('V-1' + gatherDataV());

    // todo: math
    return;
}

function getRates() {
    let elr = document.getElementById('ELRCurr').value * convertUnits('eggUnitELR');
    let sr = document.getElementById('SRCurr').value * convertUnits('eggUnitSR');
    const artiMode = document.getElementById("artiMode")?.selectedIndex ?? 0;
    if (artiMode > 0) {
        //Remove gusset contribution
        const gussetName = (document.getElementById("virtue-gusset")?.value ?? "");

        let gusset = itemListsV.flat().find(a => a.name === gussetName);
        let currPop = document.getElementById('PopCurrent').value;
        currPop = parseFloat(currPop.replace(/,/g, ''));
        let habCap = document.getElementById('HabCap').value;
        habCap = parseFloat(habCap.replace(/,/g, ''));
        if (currPop < habCap) {
            let rat = currPop / (habCap / gusset.chickmult);
            if (rat > 1)
                elr /= rat;
        } else {
            elr /= gusset.chickmult;
        }
        if (gusset.chickmult == 1) {
            document.getElementById('HabCapID').textContent = 'Current Hab Capacity:';
        } else {
            document.getElementById('HabCapID').textContent = 'Current Hab Capacity including Gusset:';
        }

        for (let i = 0; i < gusset.slots; i++) {
            [elrtach, srquant] = getStone("D" + (i + 1));
            elr /= elrtach;
            sr /= srquant;
        }
        // todo consider Population!
    }
    if (artiMode > 1) {
        // Remove other 3 artifact contributions
        const metroName = (document.getElementById("virtue-metro")?.value ?? "");
        let metro = itemListsV.flat().find(a => a.name === metroName);
        elr /= metro.elrmult;
        for (let i = 0; i < metro.slots; i++) {
            [elrtach, srquant] = getStone("B" + (i + 1));
            elr /= elrtach;
            sr /= srquant;
        }

        const compName = (document.getElementById("virtue-comp")?.value ?? "");
        let comp = itemListsV.flat().find(a => a.name === compName);
        sr /= comp.srmult;
        for (let i = 0; i < comp.slots; i++) {
            [elrtach, srquant] = getStone("C" + (i + 1));
            elr /= elrtach;
            sr /= srquant;
        }

        const artiName1 = (document.getElementById("virtue-defl")?.value ?? "");
        let arti1 = itemListsV.flat().find(a => a.name === artiName1);
        for (let i = 0; i < arti1.slots; i++) {
            [elrtach, srquant] = getStone("A" + (i + 1));
            elr /= elrtach;
            sr /= srquant;
        }

    }


    return [elr, sr];
}

function getStone(name) {
    let elrtach = 1;
    let srquant = 1;
    const artiMode = document.getElementById(name);
    let mult = [1.05, 1.04, 1.02];
    for (let i = 0; i < 6; i++) {
        if (i < 3) {
            if (artiMode.selectedIndex == i)
                elrtach = mult[i];
        }
        else {
            if (artiMode.selectedIndex == i)
                srquant = mult[i - 3];
        }

    }
    /*
    elrtach = artiMode.selectedIndex == 0 ? 1.05 : 1;
    elrtach = artiMode.selectedIndex == 1 ? 1.04 : 1;
    elrtach = artiMode.selectedIndex == 2 ? 1.02 : 1;
    srtach = artiMode.selectedIndex == 3 ? 1.05 : 1;
    srtach = artiMode.selectedIndex == 4 ? 1.04 : 1;
    srtach = artiMode.selectedIndex == 5 ? 1.02 : 1;
    */
    return [elrtach, srquant];
}

function convertUnits(str) {
    const val = document.getElementById(str);
    if (val.selectedIndex == 0)
        return 60 / 1e3 * 1e15; // q/hr
    if (val.selectedIndex == 1)
        return 60 * 1e15; // q/hr
    if (val.selectedIndex == 2)
        return 1 / 1e3 * 1e15; // q/hr

    return 1e15; //q/hr
}

// Function to optimize stones
function optStones(elr, sr, stoneSlots) {
    // Optimize stones
    numTach = 0;
    numQuant = 0;
    for (let i = 0; i < stoneSlots; i++) {
        if (elr < sr) {
            elr *= 1.05;
            numTach++;
        } else {
            sr *= 1.05;
            numQuant++;
        }
    }
    return [elr, sr, numTach, numQuant];
}

// String formatting to add commas
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

// Function to return multipliers from selected shipping colleggtibles
function getColleggtibleShip() {
    shipColleggtibleIdx1 = document.getElementById('ShipColleggtibles').selectedIndex;
    shipColleggtibleIdx2 = document.getElementById('ShipColleggtibles2').selectedIndex;
    if (shipColleggtibleIdx1 > 0) {
        shipColleggtibleIdx1++; //Fixes the removal of 4%
    }
    if (shipColleggtibleIdx2 > 0) {
        shipColleggtibleIdx2++; //Fixes the removal of 4%
    }
    allShipCollegg = (shipColleggtibleIdx1 == 0 && shipColleggtibleIdx2 == 0);

    return [((1 + (5 - shipColleggtibleIdx1) / 100) * (1 + (5 - shipColleggtibleIdx2) / 100)), allShipCollegg];
}

function getColleggtibleELR() {
    ELRColleggtibleIdx1 = document.getElementById('ELRColleggtibles').selectedIndex;
    if (ELRColleggtibleIdx1 > 0) {
        ELRColleggtibleIdx1++; //Fixes the removal of 4%
    }
    x = (1 + (5 - ELRColleggtibleIdx1) / 100);
    allELRCollegg = (ELRColleggtibleIdx1 == 0);
    return [(1 + (5 - ELRColleggtibleIdx1) / 100),allELRCollegg];
}

function getColleggtibleHab() {
    HabColleggtibleIdx1 = document.getElementById('HabColleggtibles').selectedIndex;
    if (HabColleggtibleIdx1 > 0) {
        HabColleggtibleIdx1++;
    }
    allHabCollegg = (HabColleggtibleIdx1 == 0);
    return [(1 + (5 - HabColleggtibleIdx1) / 100), allHabCollegg];
}

// Function to return multipliers from selected shipping modifiers
function getSRModifier() {
    selectedModifierIdx = document.getElementById('Modifiers').selectedIndex;
    modifierValue = document.getElementById('ModifierMultiplier').value;
    // Shipping modifier is index 2. Index 0,1 are elr modifiers
    return (selectedModifierIdx > 1) ? parseFloat(modifierValue) : 1;
}

// Function to return multipliers from selected lay-rate modifiers (hab cap and direct elr)
function getELRModifier() {
    selectedModifierIdx = document.getElementById('Modifiers').selectedIndex;
    modifierValue = document.getElementById('ModifierMultiplier').value;
    // lay-rate modifiers are index 0 and 1. Index 2 are shipping modifiers
    return (selectedModifierIdx < 2) ? parseFloat(modifierValue) : 1;
}

// Function to return multipliers from selected Hab Capacity modifiers
function getHabModifier() {
    selectedModifierIdx = document.getElementById('Modifiers').selectedIndex;
    modifierValue = document.getElementById('ModifierMultiplier').value;
    // Hab cap modifier is index 0. Index 1,2 are elr and shipping modifiers
    return (selectedModifierIdx < 1) ? parseFloat(modifierValue) : 1;
}

// Function to return multipliers from DeflectorBonus
function getDeflectorBonus() {
    // Get index of selected deflector bonus (0=from coop mates, 1=total (incl. yours))
    idx = document.getElementById('DeflectorSelect').selectedIndex;
    // Get deflector %
    deflectorPercent = parseInt(document.getElementById('DeflBonus').value);
    selfDefl = document.getElementById('Defl').value;
    x = itemLists[3].find(item => item.name === selfDefl);

    if (idx === 0) {
        return [(1 + deflectorPercent / 100),idx,deflectorPercent+x.deflectorPercent];
    } else {
        return [(1 + (deflectorPercent - x.deflectorPercent) / 100), idx, deflectorPercent];
    }

}

// Function to gather all input data
function gatherData(overRideArtis = null) {
    SEPARATOR = '-'; // Unique Unicode separator character
    const data = [];
    const data2 = [];
    const indexArrayStr = [];
    // Start with a leading 1. This way, converting chunks of 16 to integers will not remove leading 0's (e.g. '00045' => int 100045, instead of int 45)
    // This actually might be redundant to the added '8' inside chunk16(), but don't want to remove
    indexArrayStr.push('1');
    // Grab dark mode preference and add it to array
    indexArrayStr.push(convertBool(document.getElementById('modeToggle').checked));
    // Grab index of selected items and add it to array
    itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'ShipColleggtibles', 'ShipColleggtibles2', 'ELRColleggtibles', 'HabColleggtibles', 'Modifiers', 'DeflectorSelect'];
    if (overRideArtis != null) {
        for (let i = 0; i < 4; i++) {
            indexArrayStr.push(overRideArtis[i]< 10 ? '0' + overRideArtis[i] : overRideArtis[i]);
        }
        itemsToSweep = ['ShipColleggtibles', 'ShipColleggtibles2', 'ELRColleggtibles', 'HabColleggtibles', 'Modifiers'];
    }
    itemsToSweep.forEach(item => {
        index = document.getElementById(item).selectedIndex;
        // Ensure ALL indices are 2 digits by adding a 0 if < 10
        indexArrayStr.push(index < 10 ? '0' + index : index);
    });
    // Force to total deflector
    if (overRideArtis != null)
        indexArrayStr.push('01');
    // Combine string, break into chunks of 16, and encode using base62
    y = chunk16(indexArrayStr.join(''));
    data2.push(y);


    // encode user typed inputs differently, using base64
    data.push(convertString(document.getElementById('ModifierMultiplier').value));
    if (overRideArtis != null) {
        data.push(convertString(overRideArtis[4]));
    } else {
        data.push(convertString(document.getElementById('DeflBonus').value));
    }
    

    // Convert binary to base64 ASCII string
    dataB64 = btoa(encodeURIComponent(data.join(SEPARATOR)));
    // Remove all '=' as they often occur many times
    dataB64 = dataB64.split('=');
    // Combine base64 data, and base62 data, separated by '='
    dataEncoded = dataB64[0] + "=" + data2.join(SEPARATOR);


    return dataEncoded;
}

function gatherDataV() {
    SEPARATOR = '-'; // Unique Unicode separator character
    const data = [];
    const data2 = [];
    const indexArrayStr = [];
    // Start with a leading 1. This way, converting chunks of 16 to integers will not remove leading 0's (e.g. '00045' => int 100045, instead of int 45)
    // This actually might be redundant to the added '8' inside chunk16(), but don't want to remove
    indexArrayStr.push('1');
    // Grab dark mode preference and add it to array
    indexArrayStr.push(convertBool(document.getElementById('modeToggle').checked));
    // Grab index of selected items and add it to array
    itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'eggUnitELR', 'eggUnitSR', 'artiMode', 'virtue-defl', 'A1', 'A2', 'A3', 'virtue-metro', 'B1', 'B2', 'B3', 'virtue-comp', 'C1', 'C2', 'C3', 'virtue-gusset', 'D1', 'D2', 'D3'];
    itemsToSweep.forEach(item => {
        index = document.getElementById(item).selectedIndex;
        // Ensure ALL indices are 2 digits by adding a 0 if < 10
        indexArrayStr.push(index < 10 ? '0' + index : index);
    });
    itemsToSweep2 = ['T4Q', 'T3Q', 'T2Q', 'T4T', 'T3T', 'T2T'];
    itemsToSweep2.forEach(item => {
        val = Number(document.getElementById(item).value);
        indexArrayStr.push(val < 10 ? '0' + val : val);
    })
    // Combine string, break into chunks of 16, and encode using base62
    y = chunk16(indexArrayStr.join(''));
    x = unchunk16(y);
    data2.push(y);



    // encode user typed inputs differently, using base64
    data.push(convertString(document.getElementById('ELRCurr').value));
    data.push(convertString(document.getElementById('SRCurr').value));
    data.push(convertString(document.getElementById('PopCurrent').value));
    data.push(convertString(document.getElementById('HabCap').value));

    // Convert binary to base64 ASCII string
    dataB64 = btoa(encodeURIComponent(data.join(SEPARATOR)));
    // Remove all '=' as they often occur many times
    dataB64 = dataB64.split('=');
    // Combine base64 data, and base62 data, separated by '='
    dataEncoded = dataB64[0] + "=" + data2.join(SEPARATOR);


    return dataEncoded;
}

// Function to convert string of numbers into chunks of length 16, and encode each using base62
function chunk16(x) {
    dataEncoded62 = '';
    // If length of input < 16, just encode the whole thing
    if (x.length < 16)
        return base62.encode(parseInt(x));
    else {
        n = Math.floor(x.length / 15);
        // Sweep through each chunk of 16, encode, and save
        for (let i = 0; i < n; i++) {
            // 8 is needed to force all chunks of 16 to length of base64=9
            tmp = '8' + x.slice(i * 15, 15 + i * 15);
            dataEncoded62 += base62.encode(parseInt(tmp));
        }
        // Get remaining chunk of data, encode, and save
        tmp = x.slice(n * 15);
        dataEncoded62 += base62.encode(parseInt('8' + tmp));
    }
    return dataEncoded62;
}

// This does the exact opposite of chunk16()
function unchunk16(dataEncoded62) {
    x = '';
    len = 9; // All encoded chunks should be len of 9
    // If length of input < 10, just decode the whole thing
    if (dataEncoded62.length < 10)
        return base62.decode(dataEncoded62).toString();
    else {
        n = Math.floor(dataEncoded62.length / len);
        // Sweep through each chunk of 9, decode, and save
        for (let i = 0; i < n; i++) {
            // Convert back to integer, convert to string, remove the first '8'
            x += base62.decode(dataEncoded62.slice(i * len, len + i * len)).toString().slice(1);
        }
        // Get remaining chunk of data, decode, and save
        tmp = dataEncoded62.slice(n * len, dataEncoded62.length);
        // Convert back to integer, convert to string, remove the first '8'
        x += base62.decode(tmp).toString().slice(1);
    }
    return x;
}

// Old populateData() before 2nd shipping colleggtible. Will likely remove this in the future
function populateData(data, data2, v2flag) {
    data2 = unchunk16(data2);

    data = data.split('-');
    singleStr = data2.split('');

    document.getElementById('ModifierMultiplier').value = convertStringBack(data[0]);
    document.getElementById('DeflBonus').value = convertStringBack(data[1]);

    itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'ShipColleggtibles', 'Modifiers'];
    cnt = 1;
    if (v2flag) {
        if (singleStr[cnt] === '0') {
            document.getElementById('modeToggle').checked = convertBoolBack(singleStr[cnt]);
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        }

        cnt++;
    }
    itemsToSweep.forEach(item => {
        if (item === 'null') {

        } else
            document.getElementById(item).selectedIndex = parseInt(singleStr[cnt] + singleStr[cnt + 1]);
        cnt += 2;
    });

    Run(false);

}

// This function does the opposite of gatherData(), and updates the webpage based on the decoded URL data
function populateData2(data, data2, v2flag, ELRCollegg, HabCollegg) {
    // decode base64 data
    data = base64ToData(data);
    // decode base62 indices
    data2 = unchunk16(data2);
    // Split user typed data separated by '-'
    data = data.split('-');
    // Split indices into string array
    singleStr = data2.split('');

    // Update saved user typed data
    document.getElementById('ModifierMultiplier').value = convertStringBack(data[0]);
    document.getElementById('DeflBonus').value = convertStringBack(data[1]);

    if (ELRCollegg == true) {
        itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'ShipColleggtibles', 'ShipColleggtibles2', 'ELRColleggtibles', 'Modifiers', 'DeflectorSelect'];
        if (HabCollegg == true) {
            itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'ShipColleggtibles', 'ShipColleggtibles2', 'ELRColleggtibles', 'HabColleggtibles', 'Modifiers', 'DeflectorSelect'];
        }
    } else {
        itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'ShipColleggtibles', 'ShipColleggtibles2', 'Modifiers', 'DeflectorSelect'];
    }

    cnt = 1; //Start at cnt = 1 to remove first '1' introduced from gatherData()
    if (v2flag) {
        // Set dark mode preference
        if (singleStr[cnt] === '0') {
            document.getElementById('modeToggle').checked = convertBoolBack(singleStr[cnt]);
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        } else {
            document.getElementById('modeToggle').checked = convertBoolBack(singleStr[cnt]);
            document.body.classList.remove('light-mode');
            document.body.classList.add('dark-mode');
        }

        cnt++;
    }
    // Update each artifacts selected index
    itemsToSweep.forEach((item, idx) => {
        if ((idx == 4 || idx == 5) && (ELRCollegg == false)) {
            // This is for backwards compatibility, where 4% was an option in colleggtibles. This will be removed in the future
            x = parseInt(singleStr[cnt] + singleStr[cnt + 1]) - 1;
            document.getElementById(item).selectedIndex = Math.max(x, 0);
        } else {
            document.getElementById(item).selectedIndex = parseInt(singleStr[cnt] + singleStr[cnt + 1]);
        }

        cnt += 2;
    });

    // Run as non-first time viewer
    Run(false);

}
function populateDataV(data, data2, vFlag) {
    // decode base64 data
    // V-0MTAtMTAtODAwMDAwMC04MDAwMDAw=B9cHCgd3i2hndffIO
    data = base64ToData(data);
    // decode base62 indices
    data2 = unchunk16(data2);
    // Split user typed data separated by '-'
    data = data.split('-');
    // Split indices into string array
    singleStr = data2.split('');

    // Update saved user typed data
    document.getElementById('ELRCurr').value = convertStringBack(data[0]);
    document.getElementById('SRCurr').value = convertStringBack(data[1]);
    document.getElementById('PopCurrent').value = convertStringBack(data[2]);
    document.getElementById('HabCap').value = convertStringBack(data[3]);

    let itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'eggUnitELR', 'eggUnitSR'];
    if (vFlag)
        itemsToSweep = ['Metro', 'Comp', 'Gusset', 'Defl', 'eggUnitELR', 'eggUnitSR', 'artiMode', 'virtue-defl', 'A1', 'A2', 'A3', 'virtue-metro', 'B1', 'B2', 'B3', 'virtue-comp', 'C1', 'C2', 'C3', 'virtue-gusset', 'D1', 'D2', 'D3'];

    let cnt = 1; //Start at cnt = 1 to remove first '1' introduced from gatherData()
    // Set dark mode preference
    if (singleStr[cnt] === '0') {
        document.getElementById('modeToggle').checked = convertBoolBack(singleStr[cnt]);
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    } else {
        document.getElementById('modeToggle').checked = convertBoolBack(singleStr[cnt]);
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }
    cnt++;
    createInterface();
    // Update each artifacts selected index
    itemsToSweep.forEach((item, idx) => {
        document.getElementById(item).selectedIndex = parseInt(singleStr[cnt] + singleStr[cnt + 1]);
        cnt += 2;
    });

    itemsToSweep2 = ['T4Q', 'T3Q', 'T2Q', 'T4T', 'T3T', 'T2T'];
    itemsToSweep2.forEach(item => {
        document.getElementById(item).value = parseInt(singleStr[cnt] + singleStr[cnt + 1]);
        cnt += 2;
    })
    /// ADD HERE
    VirtueArtiToggle()
    // Run as non-first time viewer
    RunVirtue();

}
// convertBool converts the boolean bool from (true => 1) or (false => 0)
function convertBool(bool) {
    return bool ? 1 : 0;
}

// convertBoolBack converts the integer val from (1 => true) or (0 => false)
function convertBoolBack(val) {
    return val == 1 ? true : false;
}

// function that converts an integer to a string while replacing any periods to a p
function convertString(data) {
    return data.toString().replace(/\./g, 'p');
}

// function that converts p to a period
function convertStringBack(data) {
    return data.replace('p', '.');
}

// Function to decode base64 string to data
function base64ToData(base64) {
    return decodeURIComponent(atob(base64));
}

// Function to update the URL with the base64 data
function updateUrlWithBase64(base64Data) {
    const newUrl = `${window.location.origin}${window.location.pathname}?data=${base64Data}`;
    window.history.replaceState({}, '', newUrl);

    // Keep old-site notice link in sync
    const oldLink = document.getElementById('oldSiteLink');
    if (oldLink) oldLink.href = `https://srsandbox-old.netlify.app/stone-calc?data=${base64Data}`;
}

// Load data from URL if available
// Data is structed in 3 sets: First 3 digits are version info., next is base64 encoded data of user typed inputs (defl. % and modifier multiplier) and base62 encoded array of indices for dropdown menus, separated by '='
// base62 encoded array of indices is "chunked" in sections of 16 digit numbers (or 9 base62 strings) to avoid int_max, with added numbers on the front end to avoid losing leading zeros, and to ensure base62 strings are always length 9
// The very first indice is for the dark-mode preference. Each indice of each drop down menu is force allocated two digits



// Dark/Light Mode Toggle
document.getElementById('modeToggle').addEventListener('change', (event) => {
    if (event.target.checked) {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
    Run(false);
});

// Add HTML/CSS formmating to buttons. Not sure why this is here instead of in the .css or .html files...
const inputElement = document.getElementById('ModifierMultiplier');
const inputElement2 = document.getElementById('DeflBonus');
const valuePaddingElement = document.querySelectorAll('.valuePadding');
const valuePaddingElement2 = document.querySelectorAll('.valuePadding2');

inputElement.addEventListener('focus', function () {
    valuePaddingElement.forEach(element => {
        //element.style.color = 'red';
        element.style.boxShadow = '0px 0px 8px var(--primary-color)';
    });
});

inputElement.addEventListener('blur', function () {
    valuePaddingElement.forEach(element => {
        //element.style.color = ''; // Reset to original color
        element.style.boxShadow = '0px 0px 0px var(--primary-color)';
    });
});

inputElement2.addEventListener('focus', function () {
    valuePaddingElement2.forEach(element => {
        //element.style.color = 'red';
        element.style.boxShadow = '0px 0px 8px var(--primary-color)';
    });
});

inputElement2.addEventListener('blur', function () {
    valuePaddingElement2.forEach(element => {
        //element.style.color = ''; // Reset to original color
        element.style.boxShadow = '0px 0px 0px var(--primary-color)';
    });
});

// Load data from URL on page load
window.onload = loadDataFromUrl();




