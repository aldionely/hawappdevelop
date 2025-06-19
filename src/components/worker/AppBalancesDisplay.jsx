import React from 'react';
import { useData } from '@/contexts/DataContext';

export const AppBalancesDisplay = ({ balances, title = "Saldo Aplikasi" }) => {
  const { appBalanceKeysAndNames, initialAppBalances } = useData();

  const currentBalances = balances || initialAppBalances;

  if (!currentBalances || Object.keys(currentBalances).length === 0) {
    return <p className="text-xs text-gray-500 mt-1">Saldo aplikasi tidak tersedia.</p>;
  }

  // Filter out keys that are not in appBalanceKeysAndNames or have undefined values
  const displayableBalances = appBalanceKeysAndNames.filter(({ key }) => currentBalances[key] !== undefined);

  return (
    <div className="text-xs">
      <h3 className="font-semibold mb-2 text-sm">{title}</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
  {displayableBalances.map(({ key, name }) => (
    // Setiap item sekarang dibungkus div terluar tanpa background
    <div key={key}>
      {/* Nama aplikasi dirender di sini, di luar kotak */}
      <div className="text-gray-700 text-xs font-medium mb-1 pl-1">{name} :</div>
      
      {/* Kotak abu-abu sekarang hanya membungkus nominal saldo */}
      <div className="p-2 bg-gray-50 rounded">
        <div className="font-semibold text-gray-900">Rp {(currentBalances[key] || 0).toLocaleString()}</div>
      </div>
    </div>
  ))}
</div>
       {displayableBalances.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Tidak ada data saldo aplikasi untuk ditampilkan.</p>}
    </div>
  );
};