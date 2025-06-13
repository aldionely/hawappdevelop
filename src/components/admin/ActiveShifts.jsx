import React from 'react';
import { motion } from 'framer-motion';

export const ActiveShifts = ({ activeShifts }) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-md sm:text-lg font-semibold">Shift Saat Ini</h2>
      {activeShifts.map((shift) => (
        <motion.div
          key={shift.username}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2 sm:p-3 border rounded-lg bg-white"
        >
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div>
              <h3 className="font-semibold text-xs sm:text-sm">{shift.workerName}</h3>
              <p className="text-xs text-gray-500">
                Mulai: {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(shift.startTime).toLocaleDateString()})
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium text-xs sm:text-sm">Kas Awal: Rp {shift.kasAwal.toLocaleString()}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
              <p className="text-xs">Total Masuk</p>
              <p className="font-semibold text-green-600 text-xs sm:text-sm">
                Rp {shift.totalIn.toLocaleString()}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
              <p className="text-xs">Total Keluar</p>
              <p className="font-semibold text-red-600 text-xs sm:text-sm">
                Rp {shift.totalOut.toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="p-2 sm:p-3 border rounded-lg max-h-40 overflow-y-auto bg-gray-50">
            <h4 className="text-xs font-semibold mb-1.5 sm:mb-2">Riwayat Transaksi Shift Ini:</h4>
            {shift.transactions && shift.transactions.length > 0 ? (
              <div className="space-y-1 sm:space-y-1.5">
                {shift.transactions.map((tx) => (
                  <div key={tx.id} className="text-xs flex justify-between items-center border-b pb-1">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className={tx.type === "in" ? "text-green-600" : "text-red-600"}>
                      {tx.type === "in" ? "+" : "-"} Rp {tx.amount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">Belum ada transaksi.</p>
            )}
          </div>
        </motion.div>
      ))}
      {activeShifts.length === 0 && (
        <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Tidak ada shift aktif saat ini</p>
      )}
    </div>
  );
};