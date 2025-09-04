import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminTransactionTab } from "./DashboardTab/AdminTransactionTab";
import { VoucherDashboardTab } from "./DashboardTab/VoucherDashboardTab";
import { DashboardKeuanganTab } from "./DashboardTab/DashboardKeuanganTab";
import { UangShiftTab } from "./DashboardTab/UangShiftTab"; // Impor komponen baru

export const DashboardTab = () => {
  return (
    <Tabs defaultValue="admin-transaksi" className="w-full">
      {/* Tambahkan grid-cols-4 untuk membagi tab menjadi empat */}
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="admin-transaksi">Admin Transaksi</TabsTrigger>
        <TabsTrigger value="voucher-dashboard">Dashboard Voucher</TabsTrigger>
        <TabsTrigger value="keuangan">Keuangan Pusat</TabsTrigger>
        <TabsTrigger value="uang-shift">Uang Shift</TabsTrigger> {/* Trigger baru */}
      </TabsList>
      <TabsContent value="admin-transaksi">
        <AdminTransactionTab />
      </TabsContent>
      <TabsContent value="voucher-dashboard">
        <VoucherDashboardTab />
      </TabsContent>
       <TabsContent value="keuangan">
        <DashboardKeuanganTab />
      </TabsContent>
      <TabsContent value="uang-shift">
        <UangShiftTab /> {/* Konten baru */}
      </TabsContent>
    </Tabs>
  );
};