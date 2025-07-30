import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { TrendingUp, DollarSign, Package, History, Target, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Komponen kartu untuk menampilkan statistik
const StatsCard = ({ title, value, icon, color, note }) => (
    <div className={`p-4 rounded-lg flex flex-col justify-between h-full ${color}`}>
        <div>
            <div className="flex items-center text-gray-700 mb-2">
                {icon}
                <p className="text-sm font-medium ml-2">{title}</p>
            </div>
            <p className="text-3xl font-bold">Rp {value.toLocaleString('id-ID')}</p>
        </div>
        {note && <p className="text-xs text-gray-600 mt-2">{note}</p>}
    </div>
);

export const VoucherDashboardTab = () => {
  const { vouchers, shiftArchives } = useData();
  
  const [selectedLocation, setSelectedLocation] = useState('PIPITAN');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('ALL');
  
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const filterOptions = useMemo(() => {
    const options = { years: new Set(), months: {}, dates: {} };
    if (!shiftArchives) return { years: [], months: {}, dates: {} };

    shiftArchives.filter(s => s.lokasi === selectedLocation).forEach(s => {
        const date = new Date(s.startTime);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');

        options.years.add(year);
        if (!options.months[year]) options.months[year] = new Set();
        options.months[year].add(month);
        
        const monthKey = `${year}-${month}`;
        if (!options.dates[monthKey]) options.dates[monthKey] = new Set();
        options.dates[monthKey].add(day);
    });

    return {
        years: Array.from(options.years).sort((a, b) => b - a),
        months: Object.keys(options.months).reduce((acc, year) => ({...acc, [year]: Array.from(options.months[year]).sort((a,b) => b-a) }), {}),
        dates: Object.keys(options.dates).reduce((acc, monthKey) => ({...acc, [monthKey]: Array.from(options.dates[monthKey]).sort((a,b) => parseInt(a) - parseInt(b)) }), {})
    };
  }, [shiftArchives, selectedLocation]);
  
  // Efek untuk memeriksa validitas filter saat lokasi berubah
  useEffect(() => {
    if (selectedYear && !filterOptions.years.includes(selectedYear)) {
      setSelectedYear('');
      setSelectedMonth('');
      setSelectedDate('ALL');
    } else if (selectedMonth && (!filterOptions.months[selectedYear] || !filterOptions.months[selectedYear].includes(selectedMonth))) {
      setSelectedMonth('');
      setSelectedDate('ALL');
    } else if (selectedDate !== 'ALL' && (!filterOptions.dates[`${selectedYear}-${selectedMonth}`] || !filterOptions.dates[`${selectedYear}-${selectedMonth}`].includes(selectedDate))) {
      setSelectedDate('ALL');
    }
  }, [selectedLocation, filterOptions, selectedYear, selectedMonth, selectedDate]);


  const filteredShiftArchives = useMemo(() => {
      if (!shiftArchives || !selectedYear || !selectedMonth) return [];

      return shiftArchives.filter(shift => {
          if (shift.lokasi !== selectedLocation) return false;
          const date = new Date(shift.startTime);
          const yearMatch = !selectedYear || date.getFullYear().toString() === selectedYear;
          const monthMatch = !selectedMonth || (date.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
          const dateMatch = selectedDate === 'ALL' || date.getDate().toString().padStart(2, '0') === selectedDate;
          return yearMatch && monthMatch && dateMatch;
      });
  }, [shiftArchives, selectedLocation, selectedYear, selectedMonth, selectedDate]);

  const stats = useMemo(() => {
    if (!Array.isArray(vouchers)) {
      return { totalInitialCapital: 0, totalInitialPotentialSales: 0, totalCurrentCapital: 0, totalCurrentPotentialSales: 0, totalActualSales: 0 };
    }
    
    const locationVouchers = vouchers.filter(v => v.location === selectedLocation);

    const totalInitialCapital = locationVouchers.reduce((sum, v) => sum + ((v.initial_stock || 0) * (v.cost_price || 0)), 0);
    const totalInitialPotentialSales = locationVouchers.reduce((sum, v) => sum + ((v.initial_stock || 0) * (v.sell_price || 0)), 0);
    const totalCurrentCapital = locationVouchers.reduce((sum, v) => sum + ((v.current_stock || 0) * (v.cost_price || 0)), 0);
    const totalCurrentPotentialSales = locationVouchers.reduce((sum, v) => sum + ((v.current_stock || 0) * (v.sell_price || 0)), 0);

    const totalActualSales = filteredShiftArchives.reduce((sum, shift) => {
      return sum + shift.transactions
        .filter(tx => tx.id && tx.id.includes('tx_vcr'))
        .reduce((shiftSum, tx) => shiftSum + tx.amount, 0);
    }, 0);

    return { totalInitialCapital, totalInitialPotentialSales, totalCurrentCapital, totalCurrentPotentialSales, totalActualSales };
  }, [vouchers, filteredShiftArchives, selectedLocation]);

  const salesByShift = useMemo(() => {
    if (filteredShiftArchives.length === 0) return [];
    return filteredShiftArchives.map(shift => ({
        id: shift.id,
        workerName: shift.workerName,
        startTime: shift.startTime,
        endTime: shift.endTime,
        totalVoucherSales: shift.transactions
            .filter(tx => tx.id && tx.id.includes('tx_vcr'))
            .reduce((sum, tx) => sum + tx.amount, 0),
    })).filter(item => item.totalVoucherSales > 0);
  }, [filteredShiftArchives]);

  // --- PERUBAHAN UTAMA DI SINI ---
  // Fungsi ini sekarang hanya mengubah lokasi, tidak mereset filter tanggal.
  const handleLocationChange = (location) => {
    setSelectedLocation(location);
  }
  
  const handleYearChange = (year) => { setSelectedYear(year); setSelectedMonth(''); setSelectedDate('ALL'); }
  const handleMonthChange = (month) => { setSelectedMonth(month); setSelectedDate('ALL'); }
  const handleResetFilter = () => { setSelectedYear(''); setSelectedMonth(''); setSelectedDate('ALL'); }
  
  const isFilterActive = selectedYear && selectedMonth;

  const getDateRangeText = () => {
    if (!isFilterActive) return "Pilih periode penjualan";
    const monthName = monthNames[parseInt(selectedMonth, 10) - 1];
    if (selectedDate !== 'ALL') return `Periode: ${selectedDate} ${monthName} ${selectedYear}`;
    return `Periode: ${monthName} ${selectedYear}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard Voucher</h2>
      </div>

      <Tabs defaultValue="PIPITAN" onValueChange={handleLocationChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="PIPITAN">PIPITAN</TabsTrigger>
              <TabsTrigger value="SADIK">SADIK</TabsTrigger>
          </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 p-2 border rounded-md">
          <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger><SelectValue placeholder="Pilih Tahun..." /></SelectTrigger>
              <SelectContent>{filterOptions.years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={handleMonthChange} disabled={!selectedYear}>
              <SelectTrigger><SelectValue placeholder="Pilih Bulan..." /></SelectTrigger>
              <SelectContent>{((selectedYear && filterOptions.months[selectedYear]) || []).map(m => <SelectItem key={m} value={m}>{monthNames[parseInt(m, 10) - 1]}</SelectItem>)}</SelectContent>
          </Select>
           <Select value={selectedDate} onValueChange={setSelectedDate} disabled={!selectedMonth}>
              <SelectTrigger><SelectValue placeholder="Pilih Tanggal..." /></SelectTrigger>
              <SelectContent>
                  <SelectItem value="ALL">Semua Tanggal</SelectItem>
                  {((selectedYear && selectedMonth && filterOptions.dates[`${selectedYear}-${selectedMonth}`]) || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
          </Select>
          <Button onClick={handleResetFilter} variant="outline" disabled={!isFilterActive}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset Filter
          </Button>
      </div>
      
      <p className="text-sm text-center text-gray-600 font-medium">{getDateRangeText()}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatsCard 
            title={`Total Modal Awal (${selectedLocation})`}
            value={stats.totalInitialCapital} 
            icon={<History size={24} className="text-gray-600"/>}
            color="bg-gray-100 text-gray-900" 
            note="Nilai tetap berdasarkan stok awal."
          />
           <StatsCard 
            title={`Total Potensi Jual Awal (${selectedLocation})`}
            value={stats.totalInitialPotentialSales} 
            icon={<Target size={24} className="text-purple-600"/>}
            color="bg-purple-100 text-purple-900" 
            note="Target penjualan dari stok awal."
          />
          <StatsCard 
            title={`Penjualan Aktual (${selectedLocation})`}
            value={stats.totalActualSales} 
            icon={<TrendingUp size={24} className="text-green-600"/>}
            color="bg-green-100 text-green-900" 
            note="Penjualan berdasarkan periode filter."
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Perbandingan Penjualan vs Potensi Awal</h3>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span>Target Potensi Penjualan Awal:</span>
                      <span className="font-bold text-purple-700">Rp {stats.totalInitialPotentialSales.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Total Penjualan Aktual (Filter):</span>
                      <span className="font-bold text-green-700">Rp {stats.totalActualSales.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t mt-2">
                      <span className="font-semibold">Selisih (Kekurangan):</span>
                      <span className="font-bold text-red-600">Rp {(stats.totalInitialPotentialSales - stats.totalActualSales).toLocaleString('id-ID')}</span>
                  </div>
              </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Nilai Inventaris Saat Ini ({selectedLocation})</h3>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                      <span>Total Modal Stok Saat Ini:</span>
                      <span className="font-bold">Rp {stats.totalCurrentCapital.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Total Potensi Jual Stok Saat Ini:</span>
                      <span className="font-bold">Rp {stats.totalCurrentPotentialSales.toLocaleString('id-ID')}</span>
                  </div>
              </div>
          </div>
      </div>
      
      {isFilterActive && salesByShift.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Rincian Penjualan per Shift ({getDateRangeText().replace('Periode: ','')})</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {salesByShift.map(shiftSale => (
                      <div key={shiftSale.id} className="p-2 border rounded-md bg-white flex justify-between items-center text-sm">
                          <div>
                              <p className="font-semibold">{shiftSale.workerName}</p>
                              <p className="text-xs text-gray-500">
                                  {new Date(shiftSale.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
                                  {shiftSale.endTime ? new Date(shiftSale.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Berjalan'}
                              </p>
                          </div>
                          <div className="text-right">
                              <p className="font-bold text-green-600">Rp {shiftSale.totalVoucherSales.toLocaleString('id-ID')}</p>
                              <p className="text-xs text-gray-500">Kontribusi Penjualan</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};