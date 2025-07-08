import React from 'react';
import { useData } from '@/contexts/DataContext';

export const AppBalancesDisplay = ({ balances, title = "Saldo Aplikasi" }) => {
  const { appBalanceKeysAndNames, initialAppBalances } = useData();

  const currentBalances = balances || initialAppBalances;

  if (!currentBalances || Object.keys(currentBalances).length === 0) {
    return <p className="text-xs text-gray-500 mt-1">Saldo aplikasi tidak tersedia.</p>;
  }

  const displayableBalances = appBalanceKeysAndNames.filter(({ key }) => currentBalances[key] !== undefined);

  return (
    <div className="text-sm">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {displayableBalances.map(({ key, name }) => (
          <div key={key}>
            <p className="font-bold text-xs text-gray-600 mb-1">{name} :</p>
            <div className="p-2 bg-gray-100 rounded-md">
                <p className="font-semibold text-gray-900">Rp {(currentBalances[key] || 0).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
       {displayableBalances.length === 0 && <p className="text-xs text-gray-500 text-center py-2">Tidak ada data saldo.</p>}
    </div>
  );
};