import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StartShiftForm } from "@/components/worker/StartShiftForm";
import { ShiftInProgressManager } from "@/components/worker/shift-in-progress/ShiftInProgressManager";
import { ShiftHistory } from "@/components/worker/ShiftHistory";
import { ShiftReportDialog } from "@/components/worker/ShiftReportDialog";
import { AppBalancesManager } from "@/components/worker/app-balances/AppBalancesManager";
import { VoucherTab as WorkerVoucherTab } from "@/components/worker/VoucherTab";
import { ProductTab } from "@/components/worker/ProductTab";

const WorkerDashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { 
    shiftArchives, 
    getActiveShiftForCurrentUser, 
    loadingData,
    fetchShiftArchives,
  } = useData();
  const navigate = useNavigate();
  
  const activeShiftData = getActiveShiftForCurrentUser();
  const isShiftStarted = !!activeShiftData;

  const [activeTab, setActiveTab] = useState(isShiftStarted ? "shift" : "startShift");
  const [showShiftReport, setShowShiftReport] = useState(false);
  const [lastShiftReportData, setLastShiftReportData] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "worker")) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const newDefaultTab = isShiftStarted ? "shift" : "startShift";
    if (activeTab !== newDefaultTab) {
      if (isShiftStarted && !["shift", "vouchers", "products", "appBalances"].includes(activeTab)) {
        setActiveTab("shift");
      } else if (!isShiftStarted && activeTab !== "history") {
        setActiveTab("startShift");
      }
    }
  }, [isShiftStarted, activeTab]);

  useEffect(() => {
    if (user && !isShiftStarted && activeTab === 'history') {
      fetchShiftArchives();
    }
  }, [activeTab, user, isShiftStarted, fetchShiftArchives]);

  const handleShiftStarted = () => setActiveTab("shift");
  
  const handleShiftEnded = (finalShiftData) => {
    setLastShiftReportData(finalShiftData);
    setShowShiftReport(true);
    setActiveTab("history"); 
    fetchShiftArchives(); 
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const userShiftArchives = shiftArchives.filter(archive => archive.username === user?.username);

  if (authLoading || loadingData || !user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Memuat...</p></div>;
  }
  
  return (
    <div className="min-h-screen p-2 sm:p-4 text-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0 }}
        className="max-w-md mx-auto glass-morphism rounded-xl p-3 sm:p-4"
      >
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Panel Shift</h1>
            <p className="text-base text-gray-600">{user?.name}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">Logout</Button>
        </div>

        {!isShiftStarted ? (
          <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4 text-xs sm:text-sm">
              <TabsTrigger value="startShift">Mulai Shift</TabsTrigger>
              <TabsTrigger value="history">Riwayat Shift</TabsTrigger>
            </TabsList>
            <TabsContent value="startShift">
              <StartShiftForm onShiftStarted={handleShiftStarted} />
            </TabsContent>
            <TabsContent value="history">
              <ShiftHistory shifts={userShiftArchives} />
            </TabsContent>
          </Tabs>
        ) : (
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4 text-xs sm:text-sm">
                <TabsTrigger value="shift">Shift</TabsTrigger>
                <TabsTrigger value="vouchers">Voucher</TabsTrigger>
                <TabsTrigger value="products">Produk</TabsTrigger>
                <TabsTrigger value="appBalances">Saldo Aplikasi</TabsTrigger>
            </TabsList>
            <TabsContent value="shift">
                {activeShiftData && <ShiftInProgressManager initialShiftData={activeShiftData} onShiftEnded={handleShiftEnded} />}
            </TabsContent>
            <TabsContent value="vouchers">
                {activeShiftData && <WorkerVoucherTab shiftLocation={activeShiftData.lokasi} activeShiftData={activeShiftData} />}
            </TabsContent>
            <TabsContent value="appBalances">
                {activeShiftData && <AppBalancesManager activeShiftData={activeShiftData} />}
            </TabsContent>
            <TabsContent value="products">
                {activeShiftData && <ProductTab />}
            </TabsContent>
           </Tabs>
        )}
        {lastShiftReportData && (
           <ShiftReportDialog
            shift={lastShiftReportData}
            isOpen={showShiftReport}
            onOpenChange={setShowShiftReport}
            showDownloadButton={true}
          />
        )}
      </motion.div>
    </div>
  );
};

export default WorkerDashboard;