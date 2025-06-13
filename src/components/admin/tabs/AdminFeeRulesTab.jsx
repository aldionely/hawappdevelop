import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit3, Save, PlusCircle } from 'lucide-react';
import { formatNumberInput, parseFormattedNumber } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AdminFeeRuleForm = ({ rule, onSave, onCancel }) => {
  const [minAmount, setMinAmount] = useState(rule ? rule.min_amount : "");
  const [displayMinAmount, setDisplayMinAmount] = useState(rule ? formatNumberInput(String(rule.min_amount)) : "");
  const [maxAmount, setMaxAmount] = useState(rule ? rule.max_amount : "");
  const [displayMaxAmount, setDisplayMaxAmount] = useState(rule ? formatNumberInput(String(rule.max_amount)) : "");
  const [fee, setFee] = useState(rule ? rule.fee : "");
  const [displayFee, setDisplayFee] = useState(rule ? formatNumberInput(String(rule.fee)) : "");
  const { toast } = useToast();

  const handleMinAmountChange = (e) => {
    const value = e.target.value;
    setMinAmount(parseFormattedNumber(value));
    setDisplayMinAmount(formatNumberInput(value));
  };
  const handleMaxAmountChange = (e) => {
    const value = e.target.value;
    setMaxAmount(parseFormattedNumber(value));
    setDisplayMaxAmount(formatNumberInput(value));
  };
  const handleFeeChange = (e) => {
    const value = e.target.value;
    setFee(parseFormattedNumber(value));
    setDisplayFee(formatNumberInput(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const numMinAmount = parseFloat(minAmount);
    const numMaxAmount = parseFloat(maxAmount);
    const numFee = parseFloat(fee);

    if (isNaN(numMinAmount) || isNaN(numMaxAmount) || isNaN(numFee)) {
      toast({ variant: "destructive", title: "Error", description: "Semua nominal harus angka." });
      return;
    }
    if (numMinAmount < 0 || numMaxAmount < 0 || numFee < 0) {
      toast({ variant: "destructive", title: "Error", description: "Nominal tidak boleh negatif." });
      return;
    }
    if (numMinAmount >= numMaxAmount) {
      toast({ variant: "destructive", title: "Error", description: "Nominal minimal harus lebih kecil dari nominal maksimal." });
      return;
    }
    onSave({ min_amount: numMinAmount, max_amount: numMaxAmount, fee: numFee });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input type="text" placeholder="Nominal Minimal (Rp)" value={displayMinAmount} onChange={handleMinAmountChange} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Nominal Maksimal (Rp)" value={displayMaxAmount} onChange={handleMaxAmountChange} required className="text-xs sm:text-sm" />
      <Input type="text" placeholder="Biaya Admin (Rp)" value={displayFee} onChange={handleFeeChange} required className="text-xs sm:text-sm" />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
        </DialogClose>
        <Button type="submit" size="sm">Simpan Aturan</Button>
      </DialogFooter>
    </form>
  );
};

export const AdminFeeRulesTab = () => {
  const { adminFeeRules, addAdminFeeRule, updateAdminFeeRule, removeAdminFeeRule } = useData();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const handleSaveRule = async (ruleData) => {
    let result;
    if (editingRule) {
      result = await updateAdminFeeRule(editingRule.id, ruleData);
    } else {
      result = await addAdminFeeRule(ruleData);
    }

    if (result.success) {
      toast({ title: "Berhasil", description: `Aturan biaya admin telah ${editingRule ? 'diperbarui' : 'ditambahkan'}.` });
      setIsFormOpen(false);
      setEditingRule(null);
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.error || "Terjadi kesalahan." });
    }
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setIsFormOpen(true);
  };

  const handleAddNewRule = () => {
    setEditingRule(null);
    setIsFormOpen(true);
  };

  const handleDeleteRule = async (ruleId) => {
    const result = await removeAdminFeeRule(ruleId);
    if (result.success) {
      toast({ title: "Berhasil", description: "Aturan biaya admin telah dihapus." });
    } else {
      toast({ variant: "destructive", title: "Gagal", description: result.error || "Terjadi kesalahan." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-md sm:text-lg font-semibold">Pengaturan Biaya Admin</h2>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleAddNewRule} className="text-xs">
              <PlusCircle size={16} className="mr-2" /> Tambah Aturan Baru
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit Aturan Biaya Admin' : 'Tambah Aturan Biaya Admin Baru'}</DialogTitle>
            </DialogHeader>
            <AdminFeeRuleForm
              rule={editingRule}
              onSave={handleSaveRule}
              onCancel={() => { setIsFormOpen(false); setEditingRule(null); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {adminFeeRules.length === 0 ? (
        <p className="text-center text-gray-500 py-4 text-xs sm:text-sm">Belum ada aturan biaya admin.</p>
      ) : (
        <div className="space-y-2">
          {adminFeeRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg bg-white text-xs sm:text-sm">
              <div>
                <p className="font-semibold">
                  Rp {rule.min_amount.toLocaleString()} - Rp {rule.max_amount.toLocaleString()}
                </p>
                <p className="text-gray-600">Biaya Admin: Rp {rule.fee.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleEditRule(rule)}>
                  <Edit3 size={14} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="icon" className="h-7 w-7">
                      <Trash2 size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan menghapus aturan biaya admin ini secara permanen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteRule(rule.id)} className="bg-red-600 hover:bg-red-700">
                        Hapus
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 p-3 border rounded-lg bg-gray-50 text-xs text-gray-600">
        <p className="font-semibold mb-1">Cara Kerja Biaya Admin Otomatis:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Biaya admin akan dihitung otomatis untuk transaksi dengan deskripsi yang mengandung kata kunci: <strong>TOPUP, NARIK, TF, TRANSFER</strong>.</li>
          <li>Perhitungan berdasarkan nominal transaksi dan range yang telah Anda tentukan di atas.</li>
          <li>Jika nominal transaksi tidak masuk dalam range manapun, biaya admin tidak akan dikenakan.</li>
        </ul>
      </div>
    </div>
  );
};