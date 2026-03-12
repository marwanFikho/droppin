/**
 * File Purpose:
 * - Root details modal for selected entities (shop/driver/package).
 * - Chooses which details sections to render and passes all required action handlers to each section.
 * - Acts as the central shell for entity-specific details UI and package action bar controls.
 */

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import EntityDetailsSection from './EntityDetailsSection';
import DriverDetailsSection from './DriverDetailsSection';
import PackageDesktopDetailsSection from './PackageDesktopDetailsSection';
import PackageMobileDetailsSection from './PackageMobileDetailsSection';
import PackageActionBar from './PackageActionBar';

const DetailsModal = ({
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
  packages,
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
  shippingFeesInput,
  setShippingFeesInput,
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
  setShowRejectPackageModal
}) => {
  if (!showDetailsModal || !selectedEntity) return null;

  const entityType = selectedEntity.entityType;
  const isUser = entityType === 'user';
  const isShop = entityType === 'shop' || (isUser && selectedEntity.role === 'shop');
  const isDriver = entityType === 'driver' || (isUser && selectedEntity.role === 'driver');
  const isPackage = entityType === 'package';

  return (
    <div className={`modal-overlay details-modal-overlay ${showDetailsModal ? 'show' : ''}`} onClick={closeDetails}>
      {isMobile && (
        <button className="modal-close-fab" aria-label="Close" onClick={(e) => { e.stopPropagation(); closeDetails(); }}>
          x
        </button>
      )}

      <div
        className={`modal-content details-modal rounded-4 shadow-lg border-0 p-0 ${isPackage ? 'package-popup-modal' : ''}`}
        role="dialog"
        aria-modal="true"
        ref={detailsModalContentRef}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onDetailsTouchStart}
        onTouchMove={onDetailsTouchMove}
        onTouchEnd={onDetailsTouchEnd}
        onTouchCancel={onDetailsTouchCancel}
      >
        <div className="modal-header sticky-top bg-white border-bottom px-3 px-md-4 py-3">
          <div>
          <h2 className="h5 fw-bold mb-0 d-flex align-items-center gap-2">
            {isUser && (
              <>
                {getRoleIcon(selectedEntity.role)} {selectedEntity.name}
              </>
            )}
            {isPackage && (
              <>
                <FontAwesomeIcon icon={faBox} /> Package #{selectedEntity.trackingNumber}
              </>
            )}
          </h2>
          {isPackage && (
            <div className="d-flex flex-wrap gap-2 mt-2">
              <span className="badge text-bg-light border">{selectedEntity.status || 'unknown'}</span>
              <span className="badge text-bg-light border">{selectedEntity.type || 'new'}</span>
              <span className={`badge ${selectedEntity.isPaid ? 'text-bg-success' : 'text-bg-warning'}`}>
                {selectedEntity.isPaid ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          )}
          </div>
          <div className="d-flex align-items-center gap-2">
            {isPackage && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={(e) => { e.stopPropagation(); handlePrintAWB(selectedEntity); }}
                title="Print AWB"
              >
                Print AWB
              </button>
            )}
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={(e) => { e.stopPropagation(); closeDetails(); }}
              title="Close"
            >
              &times;
            </button>
          </div>
        </div>

        <EntityDetailsSection
          isUser={isUser}
          isShop={isShop}
          isDriver={isDriver}
          selectedEntity={selectedEntity}
          getRoleIcon={getRoleIcon}
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
        />

        <DriverDetailsSection
          isDriver={isDriver}
          selectedEntity={selectedEntity}
          setSelectedDriverForPackages={setSelectedDriverForPackages}
          fetchDriverPackages={fetchDriverPackages}
          setActiveTab={setActiveTab}
          setShowDetailsModal={setShowDetailsModal}
          setConfirmationDialogTitle={setConfirmationDialogTitle}
          setConfirmationDialogText={setConfirmationDialogText}
          setConfirmAction={setConfirmAction}
          setDrivers={setDrivers}
          setSelectedEntity={setSelectedEntity}
          setStatusMessage={setStatusMessage}
          setShowConfirmationDialog={setShowConfirmationDialog}
          giveMoneyAmount={giveMoneyAmount}
          setGiveMoneyAmount={setGiveMoneyAmount}
          giveMoneyReason={giveMoneyReason}
          setGiveMoneyReason={setGiveMoneyReason}
          handleGiveMoneyToDriver={handleGiveMoneyToDriver}
          givingMoney={givingMoney}
          handleDeleteDriver={handleDeleteDriver}
        />

        <PackageDesktopDetailsSection
          isPackage={isPackage}
          isMobile={isMobile}
          selectedEntity={selectedEntity}
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
          setSelectedEntity={setSelectedEntity}
          notesError={notesError}
        />

        <PackageMobileDetailsSection
          isPackage={isPackage}
          isMobile={isMobile}
          selectedEntity={selectedEntity}
          editingPackageData={editingPackageData}
          setEditingPackageData={setEditingPackageData}
          drivers={drivers}
          copyToClipboard={copyToClipboard}
          shareTracking={shareTracking}
          isEditingPackage={isEditingPackage}
          startEditingPackage={startEditingPackage}
          deletePackage={deletePackage}
          savePackageEdits={savePackageEdits}
          savingPackage={savingPackage}
          cancelPackageEditing={cancelPackageEditing}
          toTel={toTel}
          editingNotes={editingNotes}
          setEditingNotes={setEditingNotes}
          notesSaving={notesSaving}
          setNotesSaving={setNotesSaving}
          setNotesError={setNotesError}
          setSelectedEntity={setSelectedEntity}
          notesError={notesError}
        />

        <PackageActionBar
          isPackage={isPackage}
          selectedEntity={selectedEntity}
          openAssignDriverModal={openAssignDriverModal}
          forwardingPackageId={forwardingPackageId}
          handleForwardFromDetails={handleForwardFromDetails}
          setPackageToAction={setPackageToAction}
          setRejectShippingPaidAmount={setRejectShippingPaidAmount}
          setShowRejectPackageModal={setShowRejectPackageModal}
        />
      </div>
    </div>
  );
};

export default DetailsModal;
