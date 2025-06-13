import React from 'react';
import { motion } from 'framer-motion';

export const ShiftArchives = ({ shiftArchives }) => {
  return (
    <div className="space-y-3 sm:space-y-4 max-h-[70vh] overflow-y-auto">
      <h2 className="text-md sm:text-lg font-semibold">Arsip Shift</h2>
      {shiftArchives.slice().reverse().map((shift) => (
        <motion.div
          key={shift.endTime}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2 sm:p-3 border rounded-lg bg-white"
        >
          <div className="flex justify-between items-start mb-2 sm:mb-3">
            <div>
              <h3 className="font-semibold text-xs sm:text-sm">{shift.workerName}</h3>
              <p className="text-xs text-gray-500">
                {new Date(shift.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} - 
                {new Date(shift.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
              <p className="text-xs">Kas Awal</p>
              <p className="font-semibold text-xs sm:text-sm">
                Rp {shift.kasAwal.toLocaleString()}
              </p>
            </div>
            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
              <p className="text-xs">Kas Akhir</p>
              <p className="font-semibold text-xs sm:text-sm">
                Rp {shift.kasAkhir.toLocaleString()}
              </p>
            </div>
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
          <div className={`p-1.5 sm:p-2 rounded-lg ${shift.selisih >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <p className="text-xs">Selisih</p>
            <p className={`font-semibold text-xs sm:text-sm ${shift.selisih >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              Rp {Math.abs(shift.selisih).toLocaleString()}
              {shift.selisih >= 0 ? ' (Lebih)' : ' (Kurang)'}
            </p>
          </div>
        </motion.div>
      ))}
      {shiftArchives.length === 0 && (
        <p className="text-center text-gray-500 py-6 sm:py-8 text-xs sm:text-sm">Belum ada arsip shift</p>
      )}
    </div>
  );
};