import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useToast } from "@/components/ui/use-toast";
import { formatNumberInput, parseFormattedNumber } from "@/lib/utils";

export const appBalanceKeysAndNames = [
  { key: "PERMATA", name: "PERMATA" },
  { key: "BCA", name: "BCA" },
  { key: "BRI", name: "BRI" },
  { key: "MANDIRI", name: "MANDIRI" },
  { key: "SEABANK", name: "SEABANK" },
  { key: "DANA", name: "DANA" },
  { key: "GOPAY", name: "GOPAY" },
  { key: "OVO", name: "OVO" },
  { key: "LINKAJA", name: "LINK AJA" },
  { key: "ISIMPEL", name: "ISIMPEL" },
  { key: "SIDOMPUL", name: "SIDOMPUL" },
  { key: "DIGIPOS", name: "DIGIPOS" },
  { key: "RITA", name: "RITA" },
  { key: "BERKAT", name: "BERKAT" },
];

export const initialAppBalances = appBalanceKeysAndNames.reduce((acc, { key }) => {
  acc[key] = 0;
  return acc;
}, {});

export const StartShiftForm = ({ onShiftStarted }) => {
  const { user } = useAuth();
  const { updateActiveShift, vouchers } = useData();
  const [kasAwal, setKasAwal] = useState("");
  const [displayKasAwal, setDisplayKasAwal] = useState("");
  const [lokasi, setLokasi] = useState("PIPITAN");
  const [appBalances, setAppBalances] = useState(initialAppBalances);
  const [displayAppBalances, setDisplayAppBalances] = useState(initialAppBalances);
  const { toast } = useToast();

  const handleKasAwalChange = (e) => {
    const value = e.target.value;
    const numericValue = parseFormattedNumber(value);
    setKasAwal(numericValue);
    setDisplayKasAwal(formatNumberInput(value));
  };
  
  const handleAppBalanceChange = (key, value) => {
    const numericValue = parseFormattedNumber(value);
    setAppBalances(prev => ({ ...prev, [key]: numericValue }));
    setDisplayAppBalances(prev => ({ ...prev, [key]: formatNumberInput(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numericKasAwal = parseFloat(kasAwal);
    if (isNaN(numericKasAwal) || numericKasAwal < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Masukkan kas awal yang valid.",
      });
      return;
    }

    const locationVouchers = vouchers.filter(v => v.location === lokasi);
    const initialVoucherStock = locationVouchers.reduce((acc, v) => {
      acc[v.id] = v.current_stock;
      return acc;
    }, {});
    
    const shiftData = {
      id: `shift_${Date.now()}_${user.username}`,
      username: user.username,
      workerName: user.name,
      startTime: new Date().toISOString(),
      kasAwal: numericKasAwal,
      lokasi,
      transactions: [],
      totalIn: 0,
      totalOut: 0,
      uangTransaksi: 0,
      totalAdminFee: 0,
      app_balances: appBalances,
      initial_app_balances: appBalances,
      initial_voucher_stock: initialVoucherStock,
    };

    const result = await updateActiveShift(shiftData);
    if (result.success && result.data) {
      localStorage.setItem(`shift_inprogress_${user.username}`, JSON.stringify(result.data));
      onShiftStarted(result.data);
       toast({
        title: "Shift Dimulai!",
        description: `Selamat bekerja, ${user.name}!`,
      });
    } else {
       toast({
        variant: "destructive",
        title: "Gagal memulai shift",
        description: result.error || "Terjadi kesalahan. Coba lagi.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Mulai Shift Baru</h2>
      <Input
        type="text"
        inputMode="decimal"
        placeholder="Kas Awal (Rp)"
        value={displayKasAwal}
        onChange={handleKasAwalChange}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
        <select
          value={lokasi}
          onChange={(e) => setLokasi(e.target.value)}
          className="w-full p-2 border rounded-md"
        >
          <option value="PIPITAN">PIPITAN</option>
          <option value="SADIK">SADIK</option>
        </select>
      </div>
       <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Awal Aplikasi (Opsional)</label>
        <div className="grid grid-cols-2 gap-2">
            {appBalanceKeysAndNames.map(({ key, name }) => (
                <Input
                    key={key}
                    type="text"
                    inputMode="decimal"
                    placeholder={name}
                    value={displayAppBalances[key] || ''}
                    onChange={(e) => handleAppBalanceChange(key, e.target.value)}
                />
            ))}
        </div>
      </div>
      <Button type="submit" className="w-full">Mulai Shift</Button>
    </form>
  );
};