import { React, useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useData } from '@/contexts/DataContext';

export const EndShiftDialog = ({ isOpen, onOpenChange, onConfirmEndShift, shiftData }) => {
  const [notes, setNotes] = useState("");
  const [uangMakan, setUangMakan] = useState("");
  const [displayUangMakan, setDisplayUangMakan] = useState("");
  const { toast } = useToast();
  const { vouchers } = useData();

  // State untuk rincian uang fisik
  const [cashDetails, setCashDetails] = useState({
    ratusan: '',
    puluhan: '',
    ribuan: '',
    koin: ''
  });
  const [displayCashDetails, setDisplayCashDetails] = useState({
      ratusan: '', puluhan: '', ribuan: '', koin: ''
  });

  // Total uang aktual dihitung dari rincian
  const actualKasAkhir = useMemo(() => {
    const ratusan = Number(parseFormattedNumber(cashDetails.ratusan)) || 0;
    const puluhan = Number(parseFormattedNumber(cashDetails.puluhan)) || 0;
    const ribuan = Number(parseFormattedNumber(cashDetails.ribuan)) || 0;
    const koin = Number(parseFormattedNumber(cashDetails.koin)) || 0;
    return ratusan + puluhan + ribuan + koin;
  }, [cashDetails]);

  const baseExpectedBalance = (shiftData.kasAwal || 0) + (shiftData.totalIn || 0) - (shiftData.totalOut || 0);
  const numericUangMakan = parseFloat(parseFormattedNumber(uangMakan)) || 0;
  const finalExpectedBalance = baseExpectedBalance - numericUangMakan;
  // Selisih sekarang dihitung dari total rincian
  const selisih = actualKasAkhir - finalExpectedBalance;

  const totalAdminFee = shiftData.totalAdminFee || 0;
  const finalAdminFee = totalAdminFee - numericUangMakan;

  const stockDiscrepancies = useMemo(() => {
    if (!shiftData || !shiftData.initial_voucher_stock || !vouchers) return [];
    const discrepancies = [];
    const recordedSales = (shiftData.transactions || [])
      .filter(tx => tx.id && tx.id.includes('tx_vcr'))
      .reduce((acc, tx) => {
        acc[tx.description] = (acc[tx.description] || 0) + 1;
        return acc;
      }, {});
    Object.keys(shiftData.initial_voucher_stock).forEach(voucherId => {
      const initialStock = shiftData.initial_voucher_stock[voucherId];
      const voucherInfo = vouchers.find(v => v.id === voucherId);
      if (voucherInfo) {
        const salesCount = recordedSales[voucherInfo.name] || 0;
        const expectedStock = initialStock - salesCount;
        const actualStock = voucherInfo.current_stock;
        const discrepancy = actualStock - expectedStock;
        if (discrepancy !== 0) {
          discrepancies.push({
            name: voucherInfo.name,
            expected: expectedStock,
            actual: actualStock,
            diff: discrepancy,
          });
        }
      }
    });
    return discrepancies;
  }, [shiftData, vouchers]);

  const handleCashDetailChange = (field, value) => {
      setCashDetails(prev => ({ ...prev, [field]: parseFormattedNumber(value) }));
      setDisplayCashDetails(prev => ({...prev, [field]: formatNumberInput(value)}));
  };
  
  const handleUangMakanChange = (e) => {
    const value = e.target.value;
    setUangMakan(parseFormattedNumber(value));
    setDisplayUangMakan(formatNumberInput(value));
  };

  const handleConfirm = () => {
    if (actualKasAkhir <= 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Rincian uang aktual harus diisi dan totalnya lebih dari nol.",
      });
      return;
    }
    const finalCashDetails = {
        ratusan: Number(cashDetails.ratusan) || 0,
        puluhan: Number(cashDetails.puluhan) || 0,
        ribuan: Number(cashDetails.ribuan) || 0,
        koin: Number(cashDetails.koin) || 0,
    };
    onConfirmEndShift(actualKasAkhir, notes, numericUangMakan, finalAdminFee, finalCashDetails);
    onOpenChange(false); 
  };

  useEffect(() => {
    if (isOpen) {
        setNotes(shiftData.notes || "");
        setUangMakan("");
        setDisplayUangMakan("");
        setCashDetails({ ratusan: '', puluhan: '', ribuan: '', koin: '' });
        setDisplayCashDetails({ ratusan: '', puluhan: '', ribuan: '', koin: '' });
    }
  }, [isOpen, shiftData.notes]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Akhiri Shift</DialogTitle>
          <DialogDescription>
            Pastikan semua transaksi sudah dicatat sebelum mengakhiri shift.
          </DialogDescription>
        </DialogHeader>
        {/* Kontainer scroll sekarang tidak memiliki padding vertikal */}
        <div className="max-h-[70vh] overflow-y-auto p-2">
            <div className="space-y-3 py-2">
              {stockDiscrepancies.length > 0 && (
                <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded-md text-xs">
                  <h4 className="font-bold text-red-700 mb-2">Peringatan: Ada Selisih Stok Voucher!</h4>
                  <div className="space-y-1">
                    {stockDiscrepancies.map(item => (
                      <div key={item.name} className="flex justify-between items-center">
                        <span>{item.name}:</span>
                        <span className="font-semibold">
                          Selisih {item.diff > 0 ? `+${item.diff}` : item.diff} (Harusnya: {item.expected}, Sekarang: {item.actual})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Input
                type="text"
                inputMode="decimal"
                placeholder="Uang Harian"
                value={displayUangMakan}
                onChange={handleUangMakanChange}
                className="text-xs sm:text-sm"
              />

              <div className="p-2 bg-gray-100 rounded-md text-xs">
                <p>Total Uang Seharusnya di Tangan: Rp {finalExpectedBalance.toLocaleString()}</p>
              </div>

              {/* Menggunakan input terpisah seperti yang diinginkan */}
              <Input
                type="text" inputMode="decimal" placeholder="Ratusan Ribu (Rp)"
                value={displayCashDetails.ratusan} onChange={(e) => handleCashDetailChange('ratusan', e.target.value)}
                className="text-xs sm:text-sm"
              />
              <Input
                type="text" inputMode="decimal" placeholder="Puluhan Ribu (Rp)"
                value={displayCashDetails.puluhan} onChange={(e) => handleCashDetailChange('puluhan', e.target.value)}
                className="text-xs sm:text-sm"
              />
              <Input
                type="text" inputMode="decimal" placeholder="Ribuan (Rp)"
                value={displayCashDetails.ribuan} onChange={(e) => handleCashDetailChange('ribuan', e.target.value)}
                className="text-xs sm:text-sm"
              />
              <Input
                type="text" inputMode="decimal" placeholder="Koin (Rp)"
                value={displayCashDetails.koin} onChange={(e) => handleCashDetailChange('koin', e.target.value)}
                className="text-xs sm:text-sm"
              />
              
              <div className="p-2 bg-gray-100 rounded-md text-xs font-semibold">
                Total Uang Aktual: Rp {actualKasAkhir.toLocaleString()}
              </div>
              
              {actualKasAkhir > 0 && !isNaN(selisih) && (
                <div className={`p-2 rounded-md text-xs ${selisih === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  Selisih Kas: Rp {Math.abs(selisih).toLocaleString()} {selisih === 0 ? '(Sesuai)' : selisih > 0 ? '(Lebih)' : '(Kurang)'}
                </div>
              )}

              <Textarea
                placeholder="Catatan akhir shift (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs sm:text-sm"
              />
              
              <div className="space-y-2 pt-3 mt-3 border-t">
                <h4 className="text-sm font-semibold text-center">Rincian Admin</h4>
                <div className="flex justify-between items-center text-xs">
                  <span>Total Admin dari Transaksi:</span>
                  <span className="font-medium">Rp {totalAdminFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span>Potong Uang Harian:</span>
                  <span className="font-medium text-red-600">- Rp {numericUangMakan.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                  <span className="font-bold text-sm text-blue-800">Total Final Admin:</span>
                  <span className="font-bold text-lg text-blue-800">Rp {finalAdminFee.toLocaleString()}</span>
                </div>
              </div>
            </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Batal</Button>
          </DialogClose>
          <Button onClick={handleConfirm} size="sm">Konfirmasi & Akhiri Shift</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
