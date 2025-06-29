import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, CornerDownLeft } from 'lucide-react';
import { RequestStockDialog } from './RequestStockDialog';
import { ReturnItemDialog } from './ReturnItemDialog';

export const AccessoryTab = () => {
    const { accessories, activeShift, sellAccessoryAndUpdateShift } = useData();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [requestTarget, setRequestTarget] = useState(null);
    const [returnTarget, setReturnTarget] = useState(null);

    const locationName = activeShift?.lokasi;
    
    const allLocationAccessories = useMemo(() => {
        if (!Array.isArray(accessories) || !locationName) return [];
        return accessories
            .map(acc => {
                const locationInv = acc.inventory?.find(inv => inv.location === locationName);
                return {
                    ...acc,
                    location_stock: locationInv ? locationInv.stock : 0,
                };
            })
            .filter(acc => 
                acc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.item_code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [accessories, locationName, searchTerm]);

    const handleSell = async (accessory) => {
        const result = await sellAccessoryAndUpdateShift(accessory);
        if (result.success) {
            toast({ title: 'Aksesoris Terjual!', description: `${accessory.name} telah tercatat.` });
        } else {
            toast({ variant: 'destructive', title: 'Gagal Menjual', description: result.error?.message || 'Terjadi kesalahan.' });
        }
    };

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <div className="flex gap-2 items-center my-2">
                <div className="relative flex-grow">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Cari aksesoris..." className="w-full pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
            
            <div className="space-y-3 mt-4">
                {allLocationAccessories.length === 0 ? (
                    <p className="text-center text-gray-500 pt-10">Tidak ada aksesoris yang cocok.</p>
                ) : (
                    allLocationAccessories.map(acc => (
                        <div key={acc.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                            {/* DIUBAH: Menambahkan kembali harga jual */}
                            <div className="text-sm flex-grow">
                                <p className="font-semibold">{acc.name}</p>
                                <p className="text-xs text-gray-500">Stok: {acc.location_stock} | Harga: Rp {acc.sell_price.toLocaleString()}</p>
                            </div>
                            <div className="flex items-center space-x-1 ml-2">
                                <Button size="sm" className="h-8 text-xs px-3" onClick={() => handleSell(acc)} disabled={acc.location_stock <= 0}>Jual</Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" title="Request Stok" onClick={() => setRequestTarget(acc)}>
                                    <Plus size={14} />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" title="Return Barang" onClick={() => setReturnTarget(acc)}>
                                    <CornerDownLeft size={14} />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <RequestStockDialog 
                isOpen={!!requestTarget}
                onOpenChange={() => setRequestTarget(null)}
                accessory={requestTarget}
            />
            <ReturnItemDialog
                isOpen={!!returnTarget}
                onOpenChange={() => setReturnTarget(null)}
                accessory={returnTarget}
            />
        </div>
    );
};