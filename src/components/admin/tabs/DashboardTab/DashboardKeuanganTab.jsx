import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Landmark, PlusCircle, Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { AddBankHawBalanceDialog } from './AddBankHawBalanceDialog';
import { downloadBankHawReport } from '@/lib/downloadHelper'; // Impor fungsi download baru

const BankHawStatsCard = ({ balance, onAddBalance }) => (
    <div className="p-6 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-lg">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex items-center mb-2">
                    <Landmark size={28} className="text-yellow-400"/>
                    <p className="text-xl font-semibold ml-3">Saldo BANK HAW</p>
                </div>
                <p className="text-4xl font-bold tracking-tight">
                    Rp {(balance || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-sm text-gray-400 mt-1">Total dana pusat yang tersedia.</p>
            </div>
            <Button size="sm" className="bg-yellow-400 text-gray-900 hover:bg-yellow-300" onClick={onAddBalance}>
                <PlusCircle size={16} className="mr-2"/> Tambah Saldo
            </Button>
        </div>
    </div>
);

const BankHawHistoryTab = () => {
    const { bankHawLogs, loadingData } = useData();

    const handleDownload = () => {
        downloadBankHawReport(bankHawLogs);
    };

    return (
        <div className="space-y-4 mt-4">
             <div className="flex justify-between items-center">
                <h3 className="font-semibold">Riwayat Transaksi BANK HAW</h3>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!bankHawLogs || bankHawLogs.length === 0}>
                    <Download size={16} className="mr-2" />
                    Download Laporan
                </Button>
            </div>
            {loadingData && <p>Memuat riwayat...</p>}
            {!loadingData && (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {bankHawLogs.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Belum ada riwayat transaksi.</p>
                    ) : (
                        bankHawLogs.map(log => (
                            <div key={log.id} className="p-3 border rounded-lg bg-white text-xs">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold">{log.description}</p>
                                        <p className="text-gray-500">Oleh: {log.actor} | Tipe: {log.activity_type} | Bank: {log.app_key} | Lokasi: {log.location}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${log.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {log.amount > 0 ? '+' : '-'} Rp {Math.abs(log.amount).toLocaleString()}
                                        </p>
                                        <p className="text-gray-400">{new Date(log.timestamp).toLocaleString('id-ID')}</p>
                                    </div>
                                </div>
                                <div className="text-right text-gray-400 mt-1 pt-1 border-t">
                                    Saldo: Rp {log.previous_balance.toLocaleString()} &rarr; Rp {log.new_balance.toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};


export const DashboardKeuanganTab = () => {
    const { bankHawBalance, fetchBankHawBalance, fetchBankHawLogs } = useData();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    useEffect(() => {
        fetchBankHawBalance();
        fetchBankHawLogs();
    }, [fetchBankHawBalance, fetchBankHawLogs]);

    return (
        <>
            <Tabs defaultValue="saldo" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="saldo">Saldo</TabsTrigger>
                    <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
                </TabsList>
                <TabsContent value="saldo">
                    <div className="mt-4">
                        {bankHawBalance === null ? (
                            <p>Memuat saldo...</p>
                        ) : (
                            <BankHawStatsCard balance={bankHawBalance} onAddBalance={() => setIsAddDialogOpen(true)} />
                        )}
                    </div>
                    <div className="mt-4 p-3 border rounded-lg bg-gray-50 text-xs text-gray-600">
                        <p className="font-semibold mb-1">Informasi:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Saldo BANK HAW adalah dana pusat yang dikelola oleh admin.</li>
                            <li>Saldo ini akan berkurang jika pekerja melakukan "Tambah Saldo" dari panel shift mereka.</li>
                            <li>Saldo ini akan bertambah jika pekerja melakukan "Pindah Saldo" dari aplikasi mereka ke BANK HAW.</li>
                        </ul>
                    </div>
                </TabsContent>
                <TabsContent value="riwayat">
                    <BankHawHistoryTab />
                </TabsContent>
            </Tabs>
            <AddBankHawBalanceDialog isOpen={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />
        </>
    );
};