// The steps describe the visible route through each equation. The server remains
// responsible for checking the final answer; this data only drives learning UI.
const raw = {
  1: ['balance', 'x + 7 = 15', '- 7|x = 8'],
  2: ['balance', 'y - 9 = 4', '+ 9|y = 13'],
  3: ['balance', 'a + 12 = 5', '- 12|a = -7'],
  4: ['balance', 'm - 15 = -8', '+ 15|m = 7'],
  5: ['balance', '18 + x = 30', '- 18|x = 12'],
  6: ['balance', 'p - 6,5 = 3,5', '+ 6,5|p = 10'],
  7: ['symbolic', 'k + 1/2 = 3', '- 1/2|k = 5/2'],
  8: ['balance', '-7 + n = 14', '+ 7|n = 21'],
  9: ['balance', 'x - 14 = -20', '+ 14|x = -6'],
  10: ['balance', 'y + 25 = 11', '- 25|y = -14'],
  11: ['groups', '4x = 28', '/ 4|x = 7'],
  12: ['symbolic', '-3y = 21', '/ -3|y = -7'],
  13: ['symbolic', 'a / 5 = 6', '* 5|a = 30'],
  14: ['symbolic', 'm / 4 = -9', '* 4|m = -36'],
  15: ['symbolic', '(2/3)x = 12', '* 3/2|x = 18'],
  16: ['symbolic', '-8p = -56', '/ -8|p = 7'],
  17: ['symbolic', 'y / 0,5 = 14', '* 0,5|y = 7'],
  18: ['symbolic', '0,4k = 1,6', '/ 0,4|k = 4'],
  19: ['symbolic', '-(3/4)n = 15', '* -4/3|n = -20'],
  20: ['groups', '15z = -75', '/ 15|z = -5'],
  21: ['balance', '2x + 5 = 17', '- 5|2x = 12; / 2|x = 6'],
  22: ['balance', '3y - 8 = 13', '+ 8|3y = 21; / 3|y = 7'],
  23: ['balance', '5a + 12 = -3', '- 12|5a = -15; / 5|a = -3'],
  24: ['groups', '4(m - 2) = 16', 'expand|4m - 8 = 16; + 8|4m = 24; / 4|m = 6'],
  25: ['symbolic', '(x + 4) / 3 = 5', '* 3|x + 4 = 15; - 4|x = 11'],
  26: ['balance', '-2p + 9 = 25', '- 9|-2p = 16; / -2|p = -8'],
  27: ['symbolic', '7 - 3k = -11', '- 7|-3k = -18; / -3|k = 6'],
  28: ['symbolic', '(2/5)y - 3 = 7', '+ 3|(2/5)y = 10; * 5/2|y = 25'],
  29: ['groups', '3(2n + 1) = 27', 'expand|6n + 3 = 27; - 3|6n = 24; / 6|n = 4'],
  30: ['symbolic', '10 - 2(x + 3) = 2', 'expand|10 - 2x - 6 = 2; simplify|-2x + 4 = 2; - 4|-2x = -2; / -2|x = 1'],
  31: ['symbolic', '5x - 3 = 2x + 9', '- 2x|3x - 3 = 9; + 3|3x = 12; / 3|x = 4'],
  32: ['symbolic', '7y + 4 = 3y - 12', '- 3y|4y + 4 = -12; - 4|4y = -16; / 4|y = -4'],
  33: ['symbolic', '4a + 10 = 6a - 2', '- 4a|10 = 2a - 2; + 2|12 = 2a; / 2|6 = a'],
  34: ['symbolic', '3(m + 2) = 2(m + 7)', 'expand|3m + 6 = 2m + 14; - 2m|m + 6 = 14; - 6|m = 8'],
  35: ['symbolic', '8 - 2p = 4p + 20', '- 4p|8 - 6p = 20; - 8|-6p = 12; / -6|p = -2'],
  36: ['symbolic', '6k - 5 = 2k + 15', '- 2k|4k - 5 = 15; + 5|4k = 20; / 4|k = 5'],
  37: ['symbolic', '(1/2)x + 3 = (1/4)x + 5', '- (1/4)x|(1/4)x + 3 = 5; - 3|(1/4)x = 2; * 4|x = 8'],
  38: ['symbolic', '5(n - 1) = 3(n + 3)', 'expand|5n - 5 = 3n + 9; - 3n|2n - 5 = 9; + 5|2n = 14; / 2|n = 7'],
  39: ['symbolic', '9x - (2x + 5) = 3x + 11', 'expand|9x - 2x - 5 = 3x + 11; simplify|7x - 5 = 3x + 11; - 3x|4x - 5 = 11; + 5|4x = 16; / 4|x = 4'],
  40: ['symbolic', '4(2z - 1) = 2(3z + 5)', 'expand|8z - 4 = 6z + 10; - 6z|2z - 4 = 10; + 4|2z = 14; / 2|z = 7'],
  41: ['symbolic', '3x - 20.000 = 250.000', '+ 20.000|3x = 270.000; / 3|x = 90.000'],
  42: ['symbolic', 'x + (x + 15) = 85', 'simplify|2x + 15 = 85; - 15|2x = 70; / 2|x = 35'],
  43: ['symbolic', '2x + (x + 15.000) = 105.000', 'simplify|3x + 15.000 = 105.000; - 15.000|3x = 90.000; / 3|x = 30.000'],
  44: ['symbolic', '2((2x + 3) + x) = 54', 'simplify|2(3x + 3) = 54; expand|6x + 6 = 54; - 6|6x = 48; / 6|x = 8'],
  45: ['groups', '5x = 50.000 - 15.000', 'simplify|5x = 35.000; / 5|x = 7.000'],
  46: ['symbolic', 'x + (x + 8) = 72', 'simplify|2x + 8 = 72; - 8|2x = 64; / 2|x = 32'],
  47: ['symbolic', '3x - 10 = x + 10', '- x|2x - 10 = 10; + 10|2x = 20; / 2|x = 10'],
  48: ['symbolic', 'x + (x + 90.000) = 450.000', 'simplify|2x + 90.000 = 450.000; - 90.000|2x = 360.000; / 2|x = 180.000'],
  49: ['symbolic', 'x + x/4 = 25', '* 4|4x + x = 100; simplify|5x = 100; / 5|x = 20'],
  50: ['symbolic', '2x - 20 = 80', '+ 20|2x = 100; / 2|x = 50'],
};

export const SIMULATIONS = Object.fromEntries(Object.entries(raw).map(([id, [mode, equation, route]]) => [
  Number(id),
  { mode, equation, steps: route.split('; ').map((part) => {
    const [operation, after] = part.split('|');
    return { operation, after };
  }) },
]));

export function getSimulationAnswer(questionId){
  const result=SIMULATIONS[Number(questionId)]?.steps.at(-1)?.after;
  const match=String(result||'').match(/=\s*(.+)$/);
  return match?.[1]?.trim()||'';
}

// Each story has the same three checks: what x means, how quantities relate,
// and which equation matches the stated total. A second option targets the
// common misconception described in the design document.
const models = {
  41: [['harga awal satu kain', 'harga total tiga kain'], ['3 kain lalu voucher mengurangi total Rp20.000', 'voucher mengurangi tiap kain Rp20.000'], ['3x - 20.000 = 250.000', '3(x - 20.000) = 250.000']],
  42: [['batu tingkatan atas', 'batu tingkatan bawah'], ['bawah 15 lebih banyak: x + 15', 'bawah 15 lebih sedikit: x - 15'], ['x + (x + 15) = 85', 'x + (x - 15) = 85']],
  43: [['harga satu angklung kecil', 'harga satu angklung besar'], ['besar Rp15.000 lebih mahal: x + 15.000', 'besar Rp15.000 lebih murah: x - 15.000'], ['2x + (x + 15.000) = 105.000', 'x + 2(x + 15.000) = 105.000']],
  44: [['lebar ukiran', 'keliling ukiran'], ['panjang 2x + 3; lebar x', 'panjang x + 3; lebar x'], ['2((2x + 3) + x) = 54', '(2x + 3) + x = 54']],
  45: [['harga satu bungkus lupis', 'harga lima bungkus lupis'], ['belanja = Rp50.000 - Rp15.000', 'belanja = Rp50.000 + Rp15.000'], ['5x = 50.000 - 15.000', '5x = 50.000']],
  46: [['panjang keris Luk 3', 'panjang keris Luk 5'], ['Luk 5 lebih panjang 8 cm: x + 8', 'Luk 5 lebih pendek 8 cm: x - 8'], ['x + (x + 8) = 72', 'x + (x - 8) = 72']],
  47: [['biji Ani sebelum transfer', 'biji Ani setelah transfer'], ['Budi awal 3x; memberi 10 kepada Ani', 'Budi awal 3x; keduanya kehilangan 10'], ['3x - 10 = x + 10', '3x - 10 = x - 10']],
  48: [['harga Ulos standar', 'harga Ulos super'], ['Ulos super Rp90.000 lebih mahal: x + 90.000', 'Ulos super Rp90.000 lebih murah: x - 90.000'], ['x + (x + 90.000) = 450.000', 'x + (x - 90.000) = 450.000']],
  49: [['jumlah piring utama', 'jumlah piring cadangan'], ['cadangan seperempat dari utama: x/4', 'cadangan empat lebih banyak: x + 4'], ['x + x/4 = 25', 'x + 4 = 25']],
  50: [['jumlah wajik putih', 'jumlah wajik merah'], ['merah dua kali putih dikurangi 20: 2x - 20', 'merah dua kali putih ditambah 20: 2x + 20'], ['2x - 20 = 80', 'x + (2x - 20) = 80']],
};

export const STORY_MODELS = Object.fromEntries(Object.entries(models).map(([id, stages]) => [Number(id), stages.map(([correct, wrong], index) => ({
  kind: ['variable', 'relation', 'equation'][index], correct, wrong,
}))]));

const modelsEn = {
  41: [['original price of one batik cloth', 'total price of three cloths'], ['three cloths, then a Rp20,000 voucher off the total', 'a Rp20,000 discount on each cloth'], ['3x - 20,000 = 250,000', '3(x - 20,000) = 250,000']],
  42: [['stones on the upper tier', 'stones on the lower tier'], ['lower tier has 15 more: x + 15', 'lower tier has 15 fewer: x - 15'], ['x + (x + 15) = 85', 'x + (x - 15) = 85']],
  43: [['price of one small angklung', 'price of one large angklung'], ['large costs Rp15,000 more: x + 15,000', 'large costs Rp15,000 less: x - 15,000'], ['2x + (x + 15,000) = 105,000', 'x + 2(x + 15,000) = 105,000']],
  44: [['width of the carving', 'perimeter of the carving'], ['length 2x + 3; width x', 'length x + 3; width x'], ['2((2x + 3) + x) = 54', '(2x + 3) + x = 54']],
  45: [['price of one lupis packet', 'price of five lupis packets'], ['spent = Rp50,000 - Rp15,000', 'spent = Rp50,000 + Rp15,000'], ['5x = 50,000 - 15,000', '5x = 50,000']],
  46: [['length of the Luk 3 keris', 'length of the Luk 5 keris'], ['Luk 5 is 8 cm longer: x + 8', 'Luk 5 is 8 cm shorter: x - 8'], ['x + (x + 8) = 72', 'x + (x - 8) = 72']],
  47: [['Ani’s seeds before the transfer', 'Ani’s seeds after the transfer'], ['Budi starts with 3x and gives 10 to Ani', 'Budi starts with 3x and both lose 10'], ['3x - 10 = x + 10', '3x - 10 = x - 10']],
  48: [['price of standard Ulos', 'price of premium Ulos'], ['premium costs Rp90,000 more: x + 90,000', 'premium costs Rp90,000 less: x - 90,000'], ['x + (x + 90,000) = 450,000', 'x + (x - 90,000) = 450,000']],
  49: [['number of main plates', 'number of spare plates'], ['spares are one quarter of main plates: x/4', 'spares are four more: x + 4'], ['x + x/4 = 25', 'x + 4 = 25']],
  50: [['number of white wajik cakes', 'number of red wajik cakes'], ['red is twice white minus 20: 2x - 20', 'red is twice white plus 20: 2x + 20'], ['2x - 20 = 80', 'x + (2x - 20) = 80']],
};

export const STORY_MODELS_EN = Object.fromEntries(Object.entries(modelsEn).map(([id, stages]) => [Number(id), stages.map(([correct, wrong], index) => ({
  kind: ['variable', 'relation', 'equation'][index], correct, wrong,
}))]));

export function operationLabel(operation, lang = 'id') {
  if (operation === 'expand') return lang === 'en' ? 'Expand the parentheses' : 'Buka tanda kurung';
  if (operation === 'simplify') return lang === 'en' ? 'Combine like terms' : 'Sederhanakan suku sejenis';
  const symbol = operation[0];
  const value = operation.slice(2);
  const names = lang === 'en'
    ? { '+': 'Add', '-': 'Subtract', '*': 'Multiply by', '/': 'Divide by' }
    : { '+': 'Tambah', '-': 'Kurangi', '*': 'Kalikan dengan', '/': 'Bagi dengan' };
  return `${names[symbol]} ${value} ${lang === 'en' ? 'on both sides' : 'pada kedua ruas'}`;
}
