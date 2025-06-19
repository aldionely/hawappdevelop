import { html_beautify } from 'js-beautify';
import { appBalanceKeysAndNames } from '@/lib/shiftConstants';

const formatCurrency = (amount) => `Rp ${(amount || 0).toLocaleString()}`;
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', hour12: false }) : '-';
const formatTime = (dateString) => dateString ? new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';

const formatAppBalancesForReport = (balances) => {
  if (!balances || Object.keys(balances).length === 0) {
    return '  Tidak ada data saldo aplikasi.\n';
  }
  let content = '';
  appBalanceKeysAndNames.forEach(({ key, name }) => {
    if (balances[key] !== undefined) {
      content += `  ${name.padEnd(20, ' ')} : ${formatCurrency(balances[key])}\n`;
    }
  });
  return content;
};

export const downloadShiftReport = (shift) => {
  if (!shift) return;
  const uangTransaksi = (shift.totalIn || shift.totalin || 0) - (shift.totalOut || shift.totalout || 0);
  let reportContent = `
Laporan Akhir Shift
===================

Informasi Umum:
  Nama Pekerja  : ${shift.workerName || shift.workername}
  Lokasi Shift  : ${shift.lokasi || '-'}
  Waktu Mulai   : ${formatDate(shift.startTime || shift.starttime)}
  Waktu Selesai : ${formatDate(shift.endTime || shift.endtime)}

Ringkasan Keuangan:
  Kas Awal                 : ${formatCurrency(shift.kasAwal || shift.kasawal)}
  Total Uang Masuk         : ${formatCurrency(shift.totalIn || shift.totalin)}
  Total Uang Keluar        : ${formatCurrency(shift.totalOut || shift.totalout)}
  Total Admin              : ${formatCurrency(shift.totalAdminFee || shift.totaladminfee)}
  --------------------------------------------------
  Total Uang Transaksi     : ${formatCurrency(uangTransaksi)}
  --------------------------------------------------
  Total Uang Seharusnya    : ${formatCurrency(shift.expectedBalance || shift.expectedbalance)}
  Uang Aktual di Tangan    : ${formatCurrency(shift.kasAkhir || shift.kasakhir)}
  --------------------------------------------------
  Selisih Kas              : ${formatCurrency(Math.abs(shift.selisih || 0))} ${(shift.selisih || 0) === 0 ? '(Sesuai)' : (shift.selisih || 0) > 0 ? '(Lebih)' : '(Kurang)'}

Saldo Aplikasi (Akhir Shift):
${formatAppBalancesForReport(shift.app_balances)}
Lain-lain:
  Jumlah Transaksi : ${shift.transactions ? shift.transactions.length : 0} transaksi
`;

  if (shift.notes) {
    reportContent += `
Catatan Akhir Shift:
  ${shift.notes.split('\n').map(line => line.trim()).join('\n  ')}
`;
  }

  reportContent += `\n\nRiwayat Transaksi Rinci:\n`;
  reportContent += `=========================\n`;
  if (shift.transactions && shift.transactions.length > 0) {
    shift.transactions.forEach(tx => {
      const totalFee = (tx.adminFee || 0) + (tx.productAdminFee || 0);
      reportContent += `
  Waktu       : ${formatTime(tx.timestamp)} - ${new Date(tx.timestamp).toLocaleDateString()}
  Deskripsi   : ${tx.description}
  Jenis       : ${tx.type === 'in' ? 'Masuk' : 'Keluar'}
  Jumlah      : ${tx.type === 'in' ? '+' : '-'} ${formatCurrency(tx.amount)}
  Total Adm   : ${formatCurrency(totalFee)}
  -----------------------------------
`;
    });
  } else {
    reportContent += `  Tidak ada transaksi.\n`;
  }

  const beautifulContent = html_beautify(reportContent.trim(), { indent_size: 2, preserve_newlines: true, unformatted: [] });

  const blob = new Blob([beautifulContent], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const workerNameFormatted = (shift.workerName || shift.workername || 'Pekerja').replace(/\s/g, '_');
  const startTimeFormatted = shift.startTime || shift.starttime ? new Date(shift.startTime || shift.starttime).toLocaleDateString('sv') : 'tanggal_tidak_diketahui';
  link.download = `Laporan_Shift_${workerNameFormatted}_${startTimeFormatted}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const downloadTransactions = (shiftData, workerNameInput) => {
  if (!shiftData) return;
  const workerName = workerNameInput || shiftData.workername || 'Pekerja';
  let transactionContent = `
Riwayat Transaksi Shift
=======================

Nama Pekerja  : ${workerName}
Lokasi Shift  : ${shiftData.lokasi || '-'}
Waktu Mulai   : ${formatDate(shiftData.startTime || shiftData.starttime)}
${(shiftData.endTime || shiftData.endtime) ? `Waktu Selesai : ${formatDate(shiftData.endTime || shiftData.endtime)}\n` : ''}
Saldo Aplikasi (Saat Laporan Dibuat):
${formatAppBalancesForReport(shiftData.app_balances)}
--------------------------------------------------
`;

  if (shiftData.transactions && shiftData.transactions.length > 0) {
    shiftData.transactions.forEach(tx => {
      const totalFee = (tx.adminFee || 0) + (tx.productAdminFee || 0);
      transactionContent += `
  Waktu       : ${formatTime(tx.timestamp)} - ${new Date(tx.timestamp).toLocaleDateString()}
  Deskripsi   : ${tx.description}
  Jenis       : ${tx.type === 'in' ? 'Masuk' : 'Keluar'}
  Jumlah      : ${tx.type === 'in' ? '+' : '-'} ${formatCurrency(tx.amount)}
  Total Adm   : ${formatCurrency(totalFee)}
  -----------------------------------
`;
    });
  } else {
    transactionContent += `  Tidak ada transaksi untuk shift ini.\n`;
  }
  
  const beautifulContent = html_beautify(transactionContent.trim(), { indent_size: 2, preserve_newlines: true, unformatted: [] });

  const blob = new Blob([beautifulContent], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const workerNameFormatted = workerName.replace(/\s/g, '_');
  const startTimeFormatted = shiftData.startTime || shiftData.starttime ? new Date(shiftData.startTime || shiftData.starttime).toLocaleDateString('sv') : 'tanggal_tidak_diketahui';
  link.download = `Transaksi_Shift_${workerNameFormatted}_${startTimeFormatted}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadVoucherStockReport = (shift, allVouchers, isArchived) => {
  if (!shift || !allVouchers || !shift.initial_voucher_stock) {
    alert("Data laporan voucher tidak lengkap.");
    return;
  }
  
  let reportContent = `
Laporan Stok Voucher
====================

Informasi Shift:
  Nama Pekerja  : ${shift.workerName || shift.workername}
  Lokasi        : ${shift.lokasi || '-'}
  Waktu Mulai   : ${formatDate(shift.startTime || shift.starttime)}
  ${isArchived ? `Waktu Selesai : ${formatDate(shift.endTime || shift.endtime)}` : 'Status        : Sedang Berjalan'}

Rincian Stok:\n`;
  
  const relevantVouchers = allVouchers.filter(v => shift.initial_voucher_stock.hasOwnProperty(v.id) && v.location === shift.lokasi);

  const categorizedVouchers = relevantVouchers.reduce((acc, v) => {
    const category = v.category || 'Lainnya';
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {});

  Object.keys(categorizedVouchers).sort().forEach(category => {
    reportContent += `\n===== ${category.toUpperCase()} =====\n\n`;
    categorizedVouchers[category]
      .sort((a,b) => a.name.localeCompare(b.name))
      .forEach(voucher => {
        const initialStock = shift.initial_voucher_stock[voucher.id] ?? 0;
        const finalStock = isArchived 
            ? (shift.final_voucher_stock ? shift.final_voucher_stock[voucher.id] ?? 0 : initialStock)
            : voucher.current_stock ?? 0;
        const sold = initialStock - finalStock;

        reportContent += `${voucher.name.padEnd(15, ' ')}: ${initialStock} -> (-${sold}) -> ${finalStock}\n`;
    });
  });

  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const workerNameFormatted = (shift.workerName || shift.workername || 'Pekerja').replace(/\s/g, '_');
  const startTimeFormatted = new Date(shift.startTime || shift.starttime).toLocaleDateString('sv');
  link.download = `Laporan_Stok_Voucher_${workerNameFormatted}_${startTimeFormatted}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};