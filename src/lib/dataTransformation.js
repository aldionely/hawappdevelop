import { initialAppBalances } from "@/components/worker/StartShiftForm";

export const parseSafeNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const cleanValue = value.replace(/\./g, '');
    const parsed = parseInt(cleanValue, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const ensureValidAppBalances = (balances) => {
  const validBalances = { ...initialAppBalances };
  if (balances && typeof balances === 'object') {
    for (const key in validBalances) {
      if (balances.hasOwnProperty(key)) {
        validBalances[key] = parseSafeNumber(balances[key]);
      }
    }
  }
  return validBalances;
};

export const transformShiftData = (shift) => {
  if (!shift) return null;
  return {
    ...shift,
    id: shift.id,
    username: shift.username,
    transactions: Array.isArray(shift.transactions) ? shift.transactions : [],
    kasAwal: typeof shift.kasawal === 'number' ? shift.kasawal : 0,
    startTime: shift.starttime,
    totalIn: typeof shift.totalin === 'number' ? shift.totalin : 0,
    totalOut: typeof shift.totalout === 'number' ? shift.totalout : 0,
    uangTransaksi: typeof shift.uangtransaksi === 'number' ? shift.uangtransaksi : 0,
    totalAdminFee: typeof shift.totaladminfee === 'number' ? shift.totaladminfee : 0,
    workerName: shift.workername,
    lokasi: shift.lokasi,
    notes: shift.notes,
    app_balances: ensureValidAppBalances(shift.app_balances),
    initial_app_balances: ensureValidAppBalances(shift.initial_app_balances),
    kasAkhir: typeof shift.kasakhir === 'number' ? shift.kasakhir : undefined,
    endTime: shift.endtime,
    expectedBalance: typeof shift.expectedbalance === 'number' ? shift.expectedbalance : undefined,
    selisih: typeof shift.selisih === 'number' ? shift.selisih : undefined,
  };
};