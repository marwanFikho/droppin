/**
 * File Purpose:
 * - Modal composition hub for the Admin dashboard.
 * - Mounts and wires all Admin modal components in one place using state/action props from the container.
 * - Simplifies Dashboard.js render tree by grouping modal orchestration into a single component.
 */

import React from 'react';
import AdminDeliveryModal from './AdminDeliveryModal';
import ReturnExchangeCompleteDialogs from './ReturnExchangeCompleteDialogs';
import SchedulePickupModal from './SchedulePickupModal';
import ShippingFeesModal from './ShippingFeesModal';
import DetailsModal from './DetailsModal';
import AssignDriverModal from './AssignDriverModal';
import PickupDetailsModal from './PickupDetailsModal';
import AssignPickupDriverModal from './AssignPickupDriverModal';
import BulkAssignModal from './BulkAssignModal';
import DriverPackagesModal from './DriverPackagesModal';
import DriverPackagesTab from '../tabs/DriverPackagesTab';
import SettleAmountModal from './SettleAmountModal';
import WorkingAreaModal from './WorkingAreaModal';

const DashboardModalCluster = ({
  showAdminDeliveryModal,
  adminDeliveryModalPackage,
  adminIsPartialDelivery,
  setAdminIsPartialDelivery,
  adminPaymentMethodChoice,
  setAdminPaymentMethodChoice,
  adminDeliveredQuantities,
  setAdminDeliveredQuantities,
  setShowAdminDeliveryModal,
  handleConfirmAdminDelivery,
  showReturnCompleteDialog,
  returnCompletePkg,
  returnDeductShipping,
  setReturnDeductShipping,
  setShowReturnCompleteDialog,
  setReturnCompletePkg,
  handleConfirmReturnComplete,
  showExchangeCompleteDialog,
  exchangeCompletePkg,
  exchangeDeductShipping,
  setExchangeDeductShipping,
  setShowExchangeCompleteDialog,
  setExchangeCompletePkg,
  handleConfirmExchangeComplete,
  showSchedulePickupModal,
  packages,
  selectedPackages,
  pickupScheduleAddress,
  setPickupScheduleAddress,
  pickupScheduleDate,
  setPickupScheduleDate,
  pickupScheduleTime,
  setPickupScheduleTime,
  schedulingPickup,
  handleScheduleSelectedPickup,
  setShowSchedulePickupModal,
  showShippingFeesModal,
  shippingFeesInput,
  setShippingFeesInput,
  pendingShopApproval,
  setPendingShopApproval,
  processApproval,
  setShowShippingFeesModal,
  showDetailsModal,
  selectedEntity,
  isMobile,
  detailsModalContentRef,
  onDetailsTouchStart,
  onDetailsTouchMove,
  onDetailsTouchEnd,
  onDetailsTouchCancel,
  closeDetails,
  getRoleIcon,
  handlePrintAWB,
  loadingShopStats,
  shopStats,
  adjustTotalCollectedInput,
  setAdjustTotalCollectedInput,
  adjustTotalCollectedReason,
  setAdjustTotalCollectedReason,
  adjustingTotalCollected,
  setAdjustingTotalCollected,
  setStatusMessage,
  setSelectedEntity,
  settlementRef,
  settleAmountInput,
  setSettleAmountInput,
  handlePartialSettle,
  loadShopPackages,
  isLoadingShopPackages,
  shopPackages,
  shopUnpaidTotal,
  viewDetails,
  handleDeleteShop,
  setSelectedDriverForPackages,
  fetchDriverPackages,
  setActiveTab,
  setShowDetailsModal,
  setConfirmationDialogTitle,
  setConfirmationDialogText,
  setConfirmAction,
  setDrivers,
  setShowConfirmationDialog,
  giveMoneyAmount,
  setGiveMoneyAmount,
  giveMoneyReason,
  setGiveMoneyReason,
  handleGiveMoneyToDriver,
  givingMoney,
  handleDeleteDriver,
  isEditingPackage,
  startEditingPackage,
  deletePackage,
  savePackageEdits,
  savingPackage,
  cancelPackageEditing,
  editingPackageData,
  setEditingPackageData,
  addItemToPackage,
  updateItemInPackage,
  removeItemFromPackage,
  editingNotes,
  setEditingNotes,
  notesSaving,
  setNotesSaving,
  setNotesError,
  notesError,
  drivers,
  copyToClipboard,
  shareTracking,
  toTel,
  openAssignDriverModal,
  forwardingPackageId,
  handleForwardFromDetails,
  setPackageToAction,
  setRejectShippingPaidAmount,
  setShowRejectPackageModal,
  showAssignDriverModal,
  setShowAssignDriverModal,
  selectedPackage,
  availableDrivers,
  driverSearchTerm,
  setDriverSearchTerm,
  assigningDriver,
  assignDriverToPackage,
  showPickupModal,
  selectedPickup,
  pickupPackagesLoading,
  pickupPackages,
  setShowPickupModal,
  showAssignPickupDriverModal,
  selectedPickupForDriver,
  pickupDriverSearchTerm,
  setPickupDriverSearchTerm,
  assignDriverToPickup,
  assigningPickupDriver,
  setShowAssignPickupDriverModal,
  showBulkAssignModal,
  bulkAssignDriverId,
  setBulkAssignDriverId,
  bulkAssigning,
  handleBulkAssign,
  setShowBulkAssignModal,
  showDriverPackages,
  selectedDriverForPackages,
  driverPackages,
  forwardPackageStatus,
  setShowDriverPackages,
  activeTab,
  driverPackagesFilter,
  setDriverPackagesFilter,
  showSettleAmountModal,
  settleShopId,
  setShowSettleAmountModal,
  showWorkingAreaModal,
  selectedDriverForWorkingArea,
  workingAreaInput,
  setWorkingAreaInput,
  updateDriverWorkingArea,
  setShowWorkingAreaModal
}) => {
  return (
    <>
      <AdminDeliveryModal
        showAdminDeliveryModal={showAdminDeliveryModal}
        adminDeliveryModalPackage={adminDeliveryModalPackage}
        adminIsPartialDelivery={adminIsPartialDelivery}
        setAdminIsPartialDelivery={setAdminIsPartialDelivery}
        adminPaymentMethodChoice={adminPaymentMethodChoice}
        setAdminPaymentMethodChoice={setAdminPaymentMethodChoice}
        adminDeliveredQuantities={adminDeliveredQuantities}
        setAdminDeliveredQuantities={setAdminDeliveredQuantities}
        onClose={() => setShowAdminDeliveryModal(false)}
        onConfirm={handleConfirmAdminDelivery}
      />
      <ReturnExchangeCompleteDialogs
        showReturnCompleteDialog={showReturnCompleteDialog}
        returnCompletePkg={returnCompletePkg}
        returnDeductShipping={returnDeductShipping}
        setReturnDeductShipping={setReturnDeductShipping}
        onCloseReturn={() => {
          setShowReturnCompleteDialog(false);
          setReturnCompletePkg(null);
        }}
        onConfirmReturn={handleConfirmReturnComplete}
        showExchangeCompleteDialog={showExchangeCompleteDialog}
        exchangeCompletePkg={exchangeCompletePkg}
        exchangeDeductShipping={exchangeDeductShipping}
        setExchangeDeductShipping={setExchangeDeductShipping}
        onCloseExchange={() => {
          setShowExchangeCompleteDialog(false);
          setExchangeCompletePkg(null);
        }}
        onConfirmExchange={handleConfirmExchangeComplete}
      />
      <SchedulePickupModal
        showSchedulePickupModal={showSchedulePickupModal}
        packages={packages}
        selectedPackages={selectedPackages}
        pickupScheduleAddress={pickupScheduleAddress}
        setPickupScheduleAddress={setPickupScheduleAddress}
        pickupScheduleDate={pickupScheduleDate}
        setPickupScheduleDate={setPickupScheduleDate}
        pickupScheduleTime={pickupScheduleTime}
        setPickupScheduleTime={setPickupScheduleTime}
        schedulingPickup={schedulingPickup}
        handleScheduleSelectedPickup={handleScheduleSelectedPickup}
        onClose={() => setShowSchedulePickupModal(false)}
      />
      <ShippingFeesModal
        showShippingFeesModal={showShippingFeesModal}
        shippingFeesInput={shippingFeesInput}
        setShippingFeesInput={setShippingFeesInput}
        pendingShopApproval={pendingShopApproval}
        setPendingShopApproval={setPendingShopApproval}
        processApproval={processApproval}
        onClose={() => setShowShippingFeesModal(false)}
      />
      <DetailsModal
        showDetailsModal={showDetailsModal}
        selectedEntity={selectedEntity}
        isMobile={isMobile}
        detailsModalContentRef={detailsModalContentRef}
        onDetailsTouchStart={onDetailsTouchStart}
        onDetailsTouchMove={onDetailsTouchMove}
        onDetailsTouchEnd={onDetailsTouchEnd}
        onDetailsTouchCancel={onDetailsTouchCancel}
        closeDetails={closeDetails}
        getRoleIcon={getRoleIcon}
        handlePrintAWB={handlePrintAWB}
        packages={packages}
        loadingShopStats={loadingShopStats}
        shopStats={shopStats}
        adjustTotalCollectedInput={adjustTotalCollectedInput}
        setAdjustTotalCollectedInput={setAdjustTotalCollectedInput}
        adjustTotalCollectedReason={adjustTotalCollectedReason}
        setAdjustTotalCollectedReason={setAdjustTotalCollectedReason}
        adjustingTotalCollected={adjustingTotalCollected}
        setAdjustingTotalCollected={setAdjustingTotalCollected}
        setStatusMessage={setStatusMessage}
        setSelectedEntity={setSelectedEntity}
        shippingFeesInput={shippingFeesInput}
        setShippingFeesInput={setShippingFeesInput}
        settlementRef={settlementRef}
        settleAmountInput={settleAmountInput}
        setSettleAmountInput={setSettleAmountInput}
        handlePartialSettle={handlePartialSettle}
        loadShopPackages={loadShopPackages}
        isLoadingShopPackages={isLoadingShopPackages}
        shopPackages={shopPackages}
        shopUnpaidTotal={shopUnpaidTotal}
        viewDetails={viewDetails}
        handleDeleteShop={handleDeleteShop}
        setSelectedDriverForPackages={setSelectedDriverForPackages}
        fetchDriverPackages={fetchDriverPackages}
        setActiveTab={setActiveTab}
        setShowDetailsModal={setShowDetailsModal}
        setConfirmationDialogTitle={setConfirmationDialogTitle}
        setConfirmationDialogText={setConfirmationDialogText}
        setConfirmAction={setConfirmAction}
        setDrivers={setDrivers}
        setShowConfirmationDialog={setShowConfirmationDialog}
        giveMoneyAmount={giveMoneyAmount}
        setGiveMoneyAmount={setGiveMoneyAmount}
        giveMoneyReason={giveMoneyReason}
        setGiveMoneyReason={setGiveMoneyReason}
        handleGiveMoneyToDriver={handleGiveMoneyToDriver}
        givingMoney={givingMoney}
        handleDeleteDriver={handleDeleteDriver}
        isEditingPackage={isEditingPackage}
        startEditingPackage={startEditingPackage}
        deletePackage={deletePackage}
        savePackageEdits={savePackageEdits}
        savingPackage={savingPackage}
        cancelPackageEditing={cancelPackageEditing}
        editingPackageData={editingPackageData}
        setEditingPackageData={setEditingPackageData}
        addItemToPackage={addItemToPackage}
        updateItemInPackage={updateItemInPackage}
        removeItemFromPackage={removeItemFromPackage}
        editingNotes={editingNotes}
        setEditingNotes={setEditingNotes}
        notesSaving={notesSaving}
        setNotesSaving={setNotesSaving}
        setNotesError={setNotesError}
        notesError={notesError}
        drivers={drivers}
        copyToClipboard={copyToClipboard}
        shareTracking={shareTracking}
        toTel={toTel}
        openAssignDriverModal={openAssignDriverModal}
        forwardingPackageId={forwardingPackageId}
        handleForwardFromDetails={handleForwardFromDetails}
        setPackageToAction={setPackageToAction}
        setRejectShippingPaidAmount={setRejectShippingPaidAmount}
        setShowRejectPackageModal={setShowRejectPackageModal}
      />
      <AssignDriverModal
        showAssignDriverModal={showAssignDriverModal}
        selectedPackage={selectedPackage}
        availableDrivers={availableDrivers}
        driverSearchTerm={driverSearchTerm}
        setDriverSearchTerm={setDriverSearchTerm}
        drivers={drivers}
        assigningDriver={assigningDriver}
        onClose={() => setShowAssignDriverModal(false)}
        onAssign={assignDriverToPackage}
      />
      <PickupDetailsModal
        showPickupModal={showPickupModal}
        selectedPickup={selectedPickup}
        pickupPackagesLoading={pickupPackagesLoading}
        pickupPackages={pickupPackages}
        onClose={() => setShowPickupModal(false)}
        onPackageClick={(pkg) => viewDetails(pkg, 'package')}
      />
      <AssignPickupDriverModal
        showAssignPickupDriverModal={showAssignPickupDriverModal}
        selectedPickupForDriver={selectedPickupForDriver}
        availableDrivers={availableDrivers}
        pickupDriverSearchTerm={pickupDriverSearchTerm}
        setPickupDriverSearchTerm={setPickupDriverSearchTerm}
        assignDriverToPickup={assignDriverToPickup}
        assigningPickupDriver={assigningPickupDriver}
        onClose={() => setShowAssignPickupDriverModal(false)}
      />
      <BulkAssignModal
        showBulkAssignModal={showBulkAssignModal}
        selectedPackages={selectedPackages}
        packages={packages}
        availableDrivers={availableDrivers}
        driverSearchTerm={driverSearchTerm}
        setDriverSearchTerm={setDriverSearchTerm}
        bulkAssignDriverId={bulkAssignDriverId}
        setBulkAssignDriverId={setBulkAssignDriverId}
        bulkAssigning={bulkAssigning}
        handleBulkAssign={handleBulkAssign}
        onClose={() => setShowBulkAssignModal(false)}
      />
      <DriverPackagesModal
        showDriverPackages={showDriverPackages}
        selectedDriverForPackages={selectedDriverForPackages}
        driverPackages={driverPackages}
        forwardingPackageId={forwardingPackageId}
        forwardPackageStatus={forwardPackageStatus}
        onClose={() => setShowDriverPackages(false)}
      />
      <DriverPackagesTab
        activeTab={activeTab}
        selectedDriverForPackages={selectedDriverForPackages}
        setActiveTab={setActiveTab}
        driverPackagesFilter={driverPackagesFilter}
        setDriverPackagesFilter={setDriverPackagesFilter}
        fetchDriverPackages={fetchDriverPackages}
        driverPackages={driverPackages}
        forwardingPackageId={forwardingPackageId}
        forwardPackageStatus={forwardPackageStatus}
      />
      <SettleAmountModal
        showSettleAmountModal={showSettleAmountModal}
        settleAmountInput={settleAmountInput}
        setSettleAmountInput={setSettleAmountInput}
        onSettle={() => handlePartialSettle(settleShopId)}
        onClose={() => setShowSettleAmountModal(false)}
      />
      <WorkingAreaModal
        showWorkingAreaModal={showWorkingAreaModal}
        selectedDriverForWorkingArea={selectedDriverForWorkingArea}
        workingAreaInput={workingAreaInput}
        setWorkingAreaInput={setWorkingAreaInput}
        onUpdate={() => updateDriverWorkingArea(selectedDriverForWorkingArea, workingAreaInput)}
        onClose={() => setShowWorkingAreaModal(false)}
      />
    </>
  );
};

export default DashboardModalCluster;
