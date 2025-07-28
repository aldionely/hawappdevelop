import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { html_beautify } from 'js-beautify';
import { appBalanceKeysAndNames } from '@/lib/shiftConstants';

// --- FUNGSI CERDAS UNTUK MENGHITUNG UANG HARIAN ---
const processShiftsForReport = (shifts) => {
  return shifts.map(shift => {
      const netAdminFee = shift.totalAdminFee || 0;
      const calculatedAllowance = shift.uang_makan || 0;
      const grossAdminFee = netAdminFee + calculatedAllowance;
      const finalFee = netAdminFee;
      return { ...shift, calculatedAllowance, finalFee, grossAdminFee };
  });
};

const formatCurrency = (amount) => `Rp ${(amount || 0).toLocaleString()}`;

export const downloadLocationAdminReport = (shiftsForLocation, location, dateRange) => {
  if (!shiftsForLocation || shiftsForLocation.length === 0) {
      alert("Tidak ada data untuk diunduh.");
      return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  
  const processedShifts = processShiftsForReport(shiftsForLocation);

  // --- HALAMAN 1: RINGKASAN ---
  doc.setFontSize(18);
  doc.text(`Rincian Total Admin - ${location}`, pageWidth / 2, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(dateRange, pageWidth / 2, 28, { align: 'center' });

  const groupedByDate = processedShifts.reduce((acc, shift) => {
      const date = new Date(shift.startTime);
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (!acc[dateKey]) {
          acc[dateKey] = { total: 0, shifts: [] };
      }
      acc[dateKey].total += shift.finalFee;
      acc[dateKey].shifts.push(shift);
      return acc;
  }, {});

  let grandTotal = 0;
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(a) - new Date(b));

  const summaryBody = sortedDates.map(dateKey => {
      const total = groupedByDate[dateKey].total;
      grandTotal += total;
      const formattedDate = new Date(dateKey.replace(/-/g, '/')).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      return [formattedDate, formatCurrency(total)];
  });

  autoTable(doc, {
      startY: 40,
      head: [['TANGGAL', 'TOTAL FINAL ADMIN']],
      body: summaryBody,
      foot: [[
          { content: 'GRAND TOTAL', styles: { halign: 'center' } },
          { content: formatCurrency(grandTotal), styles: { halign: 'center' } }
      ]],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 14 },
  });

  // --- HALAMAN 2 DAN SETERUSNYA: RINCIAN ---
  doc.addPage();
  doc.setFontSize(18);
  doc.text(`Rincian Shift - ${location}`, pageWidth / 2, 20, { align: 'center' });
  let finalY = 30;

  sortedDates.forEach(dateKey => {
      const { shifts, total } = groupedByDate[dateKey];
      const formattedDateTitle = new Date(dateKey.replace(/-/g, '/')).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

      // --- PERUBAHAN 2: Gunakan `grossAdminFee` untuk kolom 'TOTAL ADMIN' ---
      const tableBody = shifts.map(shift => {
          const timeRange = `${new Date(shift.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'})} - ${shift.endTime ? new Date(shift.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}) : '-'}`;
          return [
              shift.workerName,
              timeRange,
              formatCurrency(shift.grossAdminFee || 0), // Menggunakan admin kotor
              formatCurrency(shift.calculatedAllowance),
              formatCurrency(shift.finalFee)
          ];
      });
      
      const totalRow = [
          { content: '',},
          { content: '',},
          { content: 'TOTAL', styles: { halign: 'center', fontStyle: 'bold', fontSize: 15 } },
          { content: '',},
          { content: formatCurrency(total), styles: { fontStyle: 'bold', fontSize: 15, halign: 'center' } }
        ];

      const tableHeight = (tableBody.length + 2) * 8 + 15;
      if (finalY + tableHeight > pageHeight - margin) {
          doc.addPage();
          finalY = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(formattedDateTitle, 14, finalY);
      finalY += 8;

      autoTable(doc, {
          startY: finalY,
          head: [['NAMA SHIFT', 'WAKTU SHIFT', 'TOTAL ADMIN', 'UANG MAKAN', 'TOTAL FINAL']],
          body: tableBody,
          foot: [totalRow],
          theme: 'striped',
          headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
          bodyStyles: { halign: 'center' },
          footStyles: { fillColor: [230, 230, 230], textColor: [0, 0, 0], fontStyle: 'bold' },
      });

      finalY = doc.lastAutoTable.finalY + 15;
  });

  const fileName = `Laporan_Admin_${location}_${dateRange.replace(/\s/g, '_')}.pdf`;
  doc.save(fileName);
};


// ... (Sisa file tidak perlu diubah) ...
export const formatAppBalancesForReport = (balances) => {
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
  Nama Shift : ${shift.workerName || shift.workername}
  Lokasi : ${shift.lokasi || '-'}
  Waktu Mulai   : ${formatDate(shift.startTime || shift.starttime)}
  Waktu Selesai : ${formatDate(shift.endTime || shift.endtime)}

Ringkasan Keuangan:
  Kas Awal : ${formatCurrency(shift.kasAwal || shift.kasawal)}
  Total Uang Masuk : ${formatCurrency(shift.totalIn || shift.totalin)}
  Total Uang Keluar : ${formatCurrency(shift.totalOut || shift.totalout)}
  Total Admin : ${formatCurrency(shift.totalAdminFee || shift.totaladminfee)}
  --------------------------------------------------
  Total Uang Transaksi : ${formatCurrency(uangTransaksi)}
  --------------------------------------------------
  Total Uang Seharusnya : ${formatCurrency(shift.expectedBalance || shift.expectedbalance)}
  Uang Aktual di Tangan : ${formatCurrency(shift.kasAkhir || shift.kasakhir)}
  --------------------------------------------------
  Selisih Kas : ${formatCurrency(Math.abs(shift.selisih || 0))} ${(shift.selisih || 0) === 0 ? '(Sesuai)' : (shift.selisih || 0) > 0 ? '(Lebih)' : '(Kurang)'}

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

Shift : ${workerName}
Lokasi : ${shiftData.lokasi || '-'}
Waktu Mulai : ${formatDate(shiftData.startTime || shiftData.starttime)}
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
  
  const categoryOrder = [
    "VCR SMARTFREN HARIAN", "VCR SMARTFREN UNL", "VCR INDOSAT UNL",
    "VCR INDOSAT BULANAN", "VCR INDOSAT HARIAN", "VCR TRI BULANAN", "VCR TRI HARIAN",
    "VCR TSEL HARIAN", "VCR TSEL BULANAN", "VCR XL BULANAN", "VCR XL HARIAN",
    "VCR AXIS BULANAN", "VCR AXIS HARIAN", "KARTU SMARTFREN", "KARTU AXIS", "KARTU BYU",
    "KARTU ISAT", "KARTU TRI", "KARTU XL",
  ];

  const sortVoucherItems = (a, b) => {
    const regex = /([\d.,]+)\s*GB/i;
    const matchA = a.name.match(regex);
    const matchB = b.name.match(regex);
    if (matchA && matchB) {
        const gbA = parseFloat(matchA[1].replace(',', '.'));
        const gbB = parseFloat(matchB[1].replace(',', '.'));
        if (gbA !== gbB) return gbA - gbB;
    }
    const daysRegex = /(\d+)\s*D/i;
    const daysMatchA = a.name.match(daysRegex);
    const daysMatchB = b.name.match(daysRegex);
    if (daysMatchA && daysMatchB) {
        const daysA = parseInt(daysMatchA[1], 10);
        const daysB = parseInt(daysMatchB[1], 10);
        if (daysA !== daysB) return daysA - daysB;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  };

  const formatItemName = (name) => {
      const prefixesToRemove = ['VCR', 'SF', 'ISAT', 'TRI', 'TSEL', 'XL', 'AXIS', 'SMARTFREN', 'BYU', 'KARTU' , 'SMART' ];
      let processedName = name.trim();
      
      prefixesToRemove.forEach(prefix => {
          if (processedName.toUpperCase().startsWith(prefix)) {
              processedName = processedName.substring(prefix.length).trim();
          }
      });
      
      return processedName;
  };
  
  let reportContent = `Laporan Stok Voucher\n====================\n\nNama Shift : ${shift.workerName || shift.workername}\nLokasi : ${shift.lokasi || '-'}\nWaktu Mulai : ${formatDate(shift.startTime || shift.starttime)}\n${isArchived ? `Waktu Selesai : ${formatDate(shift.endTime || shift.endtime)}` : 'Status : Sedang Berjalan'}\n`;
  
  const relevantVouchers = allVouchers.filter(v => shift.initial_voucher_stock.hasOwnProperty(v.id) && v.location === shift.lokasi);
  
  const categorizedVouchers = relevantVouchers.reduce((acc, v) => {
    const category = v.category || 'Lainnya';
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {});

  const sortedCategories = Object.keys(categorizedVouchers).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a.toUpperCase());
    const indexB = categoryOrder.indexOf(b.toUpperCase());
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.localeCompare(b);
  });

  sortedCategories.forEach(category => {
    reportContent += `\n=== ${category.toUpperCase()} ===\n\n`;
    
    const itemsInCategory = categorizedVouchers[category];
    
    const formattedNames = itemsInCategory.map(voucher => formatItemName(voucher.name));
    const maxLength = Math.max(...formattedNames.map(name => name.length));

    itemsInCategory
      .sort(sortVoucherItems)
      .forEach(voucher => {
        const initialStock = shift.initial_voucher_stock[voucher.id] ?? 0;
        const finalStock = isArchived 
            ? (shift.final_voucher_stock ? shift.final_voucher_stock[voucher.id] ?? 0 : initialStock)
            : voucher.current_stock ?? 0;
        const sold = initialStock - finalStock;
        
        const itemName = formatItemName(voucher.name);
        reportContent += `${itemName.padEnd(maxLength + 2, ' ')}: ${initialStock} -> (-${sold}) -> ${finalStock}\n`;
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


export const downloadCategoryVoucherReport = (shift, vouchersForCategory, categoryName, isArchived) => {
  if (!shift || !vouchersForCategory || !categoryName) {
    alert("Data untuk laporan kategori tidak lengkap.");
    return;
  }

  const sortVoucherItems = (a, b) => {
    const regex = /([\d.,]+)\s*GB/i;
    const matchA = a.name.match(regex);
    const matchB = b.name.match(regex);
    if (matchA && matchB) {
        const gbA = parseFloat(matchA[1].replace(',', '.'));
        const gbB = parseFloat(matchB[1].replace(',', '.'));
        if (gbA !== gbB) return gbA - gbB;
    }
    const daysRegex = /(\d+)\s*D/i;
    const daysMatchA = a.name.match(daysRegex);
    const daysMatchB = b.name.match(daysRegex);
    if (daysMatchA && daysMatchB) {
        const daysA = parseInt(daysMatchA[1], 10);
        const daysB = parseInt(daysMatchB[1], 10);
        if (daysA !== daysB) return daysA - daysB;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  };

  const formatItemName = (name) => {
      const prefixesToRemove = ['VCR', 'SF', 'ISAT', 'TRI', 'TSEL', 'XL', 'AXIS', 'SMARTFREN', 'BYU', 'KARTU' , 'SMART' ];
      let processedName = name.trim();
      prefixesToRemove.forEach(prefix => {
          if (processedName.toUpperCase().startsWith(prefix)) {
              processedName = processedName.substring(prefix.length).trim();
          }
      });
      return processedName;
  };

  let reportContent = `=== ${categoryName} ===\n\n`;
  
  const maxLength = Math.max(...vouchersForCategory.map(voucher => formatItemName(voucher.name).length));

  vouchersForCategory
    .sort(sortVoucherItems)
    .forEach(voucher => {
      const initialStock = shift.initial_voucher_stock[voucher.id] ?? 0;
      const finalStock = isArchived 
          ? (shift.final_voucher_stock ? shift.final_voucher_stock[voucher.id] ?? 0 : initialStock)
          : voucher.current_stock ?? 0;
      const sold = initialStock - finalStock;
      
      const itemName = formatItemName(voucher.name);
      reportContent += `${itemName.padEnd(maxLength + 2, ' ')}: ${initialStock} -> (-${sold}) -> ${finalStock}\n`;
  });

  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  const workerNameFormatted = (shift.workerName || shift.workername || 'Pekerja').replace(/\s/g, '_');
  const categoryFormatted = categoryName.replace(/\s/g, '_');
  link.download = `Laporan_${categoryFormatted}_${workerNameFormatted}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};