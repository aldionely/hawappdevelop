import React, { useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TransactionForm } from './TransactionForm'; 
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

export const TransactionList = ({ transactions, onEditTransaction, onDeleteTransaction }) => {
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
  };

  const handleSaveEdit = (editedTx) => {
    onEditTransaction(editedTx);
    setEditingTransaction(null);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleDeleteConfirm = () => {
    if (transactionToDelete) {
      onDeleteTransaction(transactionToDelete.id);
      setTransactionToDelete(null);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="p-3 border rounded-lg bg-white max-h-96 overflow-y-auto">
      <h3 className="text-sm font-semibold mb-2">Riwayat Transaksi Shift Ini</h3>
      {editingTransaction && (
        <div className="mb-4 p-2 border rounded-md bg-gray-50">
          <TransactionForm 
            editingTransaction={editingTransaction}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
            onAddTransaction={() => {}}
          />
        </div>
      )}
      {transactions && transactions.length === 0 ? (
        <p className="text-xs text-gray-500 text-center">Belum ada transaksi.</p>
      ) : (
        <div className="space-y-1.5">
          {(transactions || []).slice().reverse().map((tx) => {
            const totalFee = (tx.adminFee || 0) + (tx.productAdminFee || 0);
            return (
              <div key={tx.id} className={`text-xs flex justify-between items-start border-b pb-1 last:border-b-0 ${editingTransaction && editingTransaction.id === tx.id ? 'bg-yellow-50' : ''}`}>
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-gray-500">
                    {formatTime(tx.timestamp)}
                    {totalFee > 0 && <span className="text-purple-600 ml-1">(Adm: Rp {totalFee.toLocaleString()})</span>}
                  </p>
                </div>
                <div className="flex items-center">
                  <p className={`font-semibold mr-2 ${tx.type === "in" ? "text-green-600" : "text-red-600"}`}>
                    {tx.type === "in" ? "+" : "-"} Rp {tx.amount.toLocaleString()}
                  </p>
                  {!editingTransaction || editingTransaction.id !== tx.id ? (
                    <>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-blue-600 hover:text-blue-800" onClick={() => handleEditClick(tx)}>
                        <Edit3 size={12} />
                      </Button>
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-600 hover:text-red-800" onClick={() => setTransactionToDelete(tx)}>
                            <Trash2 size={12} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus transaksi "{tx.description}" sebesar Rp {tx.amount.toLocaleString()}? Tindakan ini tidak dapat dibatalkan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setTransactionToDelete(null)}>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                              Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};