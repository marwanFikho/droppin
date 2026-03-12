/**
 * File Purpose:
 * - Factory for opening and normalizing entity detail views.
 * - Fetches canonical entity/package data, normalizes notes/delivered items, and prepares detail modal state.
 * - Ensures detail views are populated with complete/consistent backend data.
 */

export const createEntityDetailsHandlers = ({
  adminService,
  packageService,
  setSelectedEntity,
  setShowDetailsModal,
  setShopPackages,
  setShopPackagesWithUnpaidMoney,
  setShopUnpaidTotal,
  setIsLoadingShopPackages
}) => {
  const viewDetails = async (entity, type) => {
    let notesArr = [];
    if (type === 'package') {
      if (Array.isArray(entity.notes)) {
        notesArr = entity.notes;
      } else if (typeof entity.notes === 'string') {
        try {
          notesArr = JSON.parse(entity.notes);
        } catch {
          notesArr = [];
        }
      }
    }
    entity.entityType = type;

    if (type === 'shop' || (type === 'user' && entity.role === 'shop')) {
      try {
        const shopId = entity.shopId || entity.id;
        const response = await adminService.getShopById(shopId);
        if (response && response.data) {
          setSelectedEntity({ ...response.data, entityType: type });
        } else {
          setSelectedEntity(type === 'package' ? { ...entity, notes: notesArr } : entity);
        }
      } catch {
        setSelectedEntity(type === 'package' ? { ...entity, notes: notesArr } : entity);
      }
      setShowDetailsModal(true);
      setShopPackages([]);
      setShopPackagesWithUnpaidMoney([]);
      setShopUnpaidTotal(0);
      return;
    }

    if (type === 'package') {
      try {
        const response = await packageService.getPackageById(entity.id);
        if (response && response.data) {
          let fetchedNotesArr = [];
          if (Array.isArray(response.data.notes)) {
            fetchedNotesArr = response.data.notes;
          } else if (typeof response.data.notes === 'string') {
            try {
              fetchedNotesArr = JSON.parse(response.data.notes);
            } catch {
              fetchedNotesArr = [];
            }
          }

          let normalizedDelivered = response.data.deliveredItems ?? response.data.delivereditems ?? null;
          if (typeof normalizedDelivered === 'string') {
            try {
              normalizedDelivered = JSON.parse(normalizedDelivered);
            } catch {
              normalizedDelivered = null;
            }
          }
          if (!Array.isArray(normalizedDelivered)) normalizedDelivered = [];

          let normalizedItems = response.data.Items ?? response.data.items ?? [];
          if (!Array.isArray(normalizedItems)) normalizedItems = [];

          setSelectedEntity({
            ...response.data,
            deliveredItems: normalizedDelivered,
            Items: normalizedItems,
            notes: fetchedNotesArr,
            entityType: type
          });
        } else {
          let normalizedDelivered = entity.deliveredItems ?? entity.delivereditems ?? null;
          if (typeof normalizedDelivered === 'string') {
            try {
              normalizedDelivered = JSON.parse(normalizedDelivered);
            } catch {
              normalizedDelivered = null;
            }
          }
          if (!Array.isArray(normalizedDelivered)) normalizedDelivered = [];
          setSelectedEntity({ ...entity, deliveredItems: normalizedDelivered, notes: notesArr });
        }
      } catch (err) {
        console.error('Error fetching package details:', err);
        let normalizedDelivered = entity.deliveredItems ?? entity.delivereditems ?? null;
        if (typeof normalizedDelivered === 'string') {
          try {
            normalizedDelivered = JSON.parse(normalizedDelivered);
          } catch {
            normalizedDelivered = null;
          }
        }
        if (!Array.isArray(normalizedDelivered)) normalizedDelivered = [];
        setSelectedEntity({ ...entity, deliveredItems: normalizedDelivered, notes: notesArr });
      }
    } else {
      setSelectedEntity(entity);
    }

    setShowDetailsModal(true);
    setShopPackages([]);
    setShopPackagesWithUnpaidMoney([]);
    setShopUnpaidTotal(0);
  };

  const loadShopPackages = async (shopId) => {
    setIsLoadingShopPackages(true);
    setShopPackages([]);
    setShopPackagesWithUnpaidMoney([]);
    setShopUnpaidTotal(0);
    try {
      const shopResponse = await adminService.getShopById(shopId);
      const shopData = shopResponse?.data || {};
      const totalCollected = parseFloat(shopData.TotalCollected || 0);

      const packagesResponse = await adminService.getShopPackages(shopId);
      let pkgs = [];
      const candidates = [
        packagesResponse?.data,
        packagesResponse?.data?.packages,
        packagesResponse?.packages,
        packagesResponse?.data?.rows,
        packagesResponse?.data?.data,
        packagesResponse?.rows,
        packagesResponse?.data?.results
      ];
      for (const c of candidates) {
        if (Array.isArray(c)) {
          pkgs = c;
          break;
        }
      }
      if (!Array.isArray(pkgs)) pkgs = [];

      const latestTen = pkgs
        .slice()
        .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
        .slice(0, 10);
      setShopPackages(latestTen);

      const packagesWithMoney = (Array.isArray(pkgs) ? pkgs : []).filter(
        (pkg) => parseFloat(pkg.codAmount) > 0 && pkg.isPaid === true && pkg.status === 'delivered'
      );
      setShopPackagesWithUnpaidMoney(packagesWithMoney);
      setShopUnpaidTotal(totalCollected);
    } catch (error) {
      console.error('Error loading shop packages:', error);
      alert(`Error: ${error?.response?.data?.message || error.message || 'Failed to load packages'}`);
      setShopPackages([]);
    } finally {
      setIsLoadingShopPackages(false);
    }
  };

  return {
    viewDetails,
    loadShopPackages
  };
};