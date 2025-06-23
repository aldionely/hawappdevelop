import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserTab } from "@/components/admin/tabs/UserTab";
import { ActivityTab } from "@/components/admin/tabs/ActivityTab";
import { ArchiveTab } from "@/components/admin/tabs/ArchiveTab";
import { AdminFeeRulesTab } from "@/components/admin/tabs/AdminFeeRulesTab";
import { ProductsTab } from "@/components/admin/tabs/ProductsTab";
import { VoucherTab as AdminVoucherTab } from "@/components/admin/tabs/VoucherTab";
import { AdminAccessoriesTab } from "@/components/admin/tabs/AccessoriesTab";


const AdminDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { loadingData, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers, fetchAccessories  } = useData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("users");

  React.useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      navigate("/login");
    }
  }, [user, navigate, authLoading]);

  React.useEffect(() => {
    if(user && user.role === "admin"){
      const fetchDataForTab = () => {
        switch(activeTab) {
          case "users": fetchWorkers(); break;
          case "active": fetchActiveShifts(); break;
          case "archives": Promise.all([fetchWorkers(), fetchShiftArchives()]); break;
          case "feeRules": fetchAdminFeeRules(); break;
          case "products": fetchProducts(); break;
          case "vouchers": fetchVouchers(); break;
          case "accessories": fetchAccessories(); break;
          default: break;
        }
      };
      fetchDataForTab();
    }
  }, [activeTab, user, fetchWorkers, fetchActiveShifts, fetchShiftArchives, fetchAdminFeeRules, fetchProducts, fetchVouchers]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (authLoading || (!user && !authLoading)) {
    return <div className="min-h-screen flex items-center justify-center"><p>Memuat...</p></div>;
  }
  
  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen p-2 sm:p-4 text-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto glass-morphism rounded-xl p-3 sm:p-4"
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-bold">Panel Admin</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">Logout</Button>
        </div>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="grid w-full grid-cols-7 mb-4 text-xs sm:text-sm min-w-[700px]">
              <TabsTrigger value="users">User</TabsTrigger>
              <TabsTrigger value="active">Aktivitas</TabsTrigger>
              <TabsTrigger value="archives">Arsip Shift</TabsTrigger>
              <TabsTrigger value="feeRules">Biaya Admin</TabsTrigger>
              <TabsTrigger value="products">Produk</TabsTrigger>
              <TabsTrigger value="vouchers">Voucher</TabsTrigger>
              <TabsTrigger value="accessories">Aksesoris</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users"><UserTab /></TabsContent>
          <TabsContent value="active"><ActivityTab /></TabsContent>
          <TabsContent value="archives"><ArchiveTab /></TabsContent>
          <TabsContent value="feeRules"><AdminFeeRulesTab /></TabsContent>
          <TabsContent value="products"><ProductsTab /></TabsContent>
          <TabsContent value="vouchers"><AdminVoucherTab /></TabsContent>
          <TabsContent value="accessories"><AdminAccessoriesTab /></TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;