export const appBalanceKeysAndNames = [
  { key: 'PERMATA', name: 'PERMATA' },
  { key: 'BCA', name: 'BCA' },
  { key: 'BRI', name: 'BRI' },
  { key: 'MANDIRI', name: 'MANDIRI' },
  { key: 'SEABANK', name: 'SEABANK' },
  { key: 'BNI', name: 'BNI' },
  { key: 'DANA', name: 'DANA' },
  { key: 'GOPAY', name: 'GOPAY' },
  { key: 'OVO', name: 'OVO' },
  { key: 'LINKAJA', name: 'LINK AJA' },
  { key: 'ISIMPEL', name: 'ISIMPEL' },
  { key: 'SIDOMPUL', name: 'SIDOMPUL' },
  { key: 'DIGIPOS', name: 'DIGIPOS' },
  { key: 'RITA', name: 'RITA' },
  { key: 'BERKAT', name: 'BERKAT' },
  { key: 'QRIS', name: 'QRIS' },

];

export const initialAppBalances = appBalanceKeysAndNames.reduce((acc, { key }) => {
  acc[key] = 0;
  return acc;
}, {});