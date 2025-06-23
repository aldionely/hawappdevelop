import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const AccessoryTab = () => {
    const { accessories, sellAccessoryAndUpdateShift } = useData();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');

    const categories = useMemo(() => {
        if (!accessories) return [];
        const uniqueCategories = new Set(accessories.map(p => p.category || 'Lainnya'));
        return Array.from(uniqueCategories).sort();
    }, [accessories]);

    const filteredAccessories = useMemo(() => {
        if (!accessories) return [];
        let results = [...accessories];
        if (searchTerm) {
            results = results.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return results;
    }, [accessories, searchTerm]);
    
    const groupedAccessories = useMemo(() => {
        return filteredAccessories.reduce((acc, accessory) => {
            const category = accessory.category || 'Lainnya';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(accessory);
            return acc;
        }, {});
    }, [filteredAccessories]);

    const handleSell = async (accessory) => {
        const result = await sellAccessoryAndUpdateShift(accessory);
        if (result.success) {
            toast({ title: 'Aksesoris Terjual!', description: `${accessory.name} telah tercatat.` });
        } else {
            toast({ variant: 'destructive', title: 'Gagal Menjual', description: result.error || 'Terjadi kesalahan.' });
        }
    };

    return (
        <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
            <div className="relative flex-grow my-2">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Cari aksesoris..."
                    className="w-full pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="space-y-4 mt-2">
                {Object.keys(groupedAccessories).length === 0 ? (
                    <p className="text-center text-gray-500 pt-10">Tidak ada aksesoris yang cocok.</p>
                ) : (
                    Object.keys(groupedAccessories).sort().map(category => (
                        <div key={category}>
                            <h3 className="font-bold text-md mb-2 sticky top-0 bg-gradient-to-b from-purple-100 to-transparent py-1">{category}</h3>
                            <div className="space-y-3">
                                {groupedAccessories[category].map(acc => (
                                    <div key={acc.id} className="p-3 border rounded-lg bg-white flex justify-between items-center">
                                        <div className="text-sm">
                                            <p className="font-semibold">{acc.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-sm">Rp {acc.sell_price.toLocaleString()}</p>
                                            <Button size="sm" className="mt-1 h-8 text-xs" onClick={() => handleSell(acc)}>Jual</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};